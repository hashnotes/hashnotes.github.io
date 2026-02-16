/**
 * Dev watcher: compiles ts-scripts/ → note function bodies.
 *
 * 1. Hash each TS source → rename file to #<tsHash>.ts
 * 2. Compile to JS function body → addNote → get JS hash
 * 3. Write history.json with last 10 compiled entries
 * 4. Watch for changes, recompile on save
 * 5. Serve /history as JSON for the client /live route
 */

import { readFileSync, readdirSync, writeFileSync, renameSync, existsSync, mkdirSync, watch } from "node:fs";
import { resolve, basename } from "node:path";
import { createServer } from "node:http";
import { compileModule } from "../src/compile.ts";
import { addNote } from "../src/db.ts";
import { hashData } from "@hashnotes/core/notes";

const TS_DIR = resolve(import.meta.dirname!, "../ts-scripts");
const JS_DIR = resolve(import.meta.dirname!, "../js-scripts");
const HISTORY_PATH = resolve(TS_DIR, "history.json");
const LIVE_PORT = 4321;

type HistoryEntry = {
  tsHash: string;
  jsHash: string;
  exportName: string;
};

// --- history ---

const readHistory = (): HistoryEntry[] => {
  if (!existsSync(HISTORY_PATH)) return [];
  const src = readFileSync(HISTORY_PATH, "utf-8");
  try { return JSON.parse(src); } catch { return []; }
};

const writeHistory = (entries: HistoryEntry[]) => {
  writeFileSync(HISTORY_PATH, JSON.stringify(entries.slice(-10), null, 2) + "\n");
};

// --- extract export name from TS source ---

const getExportName = (src: string): string => {
  const m1 = src.match(/export\s+const\s+(\w+)/);
  if (m1) return m1[1];
  const m2 = src.match(/export\s+function\s+(\w+)/);
  if (m2) return m2[1];
  if (/export\s+default/.test(src)) return "default";
  return "unknown";
};

// --- current history for the server ---

let currentHistory: HistoryEntry[] = [];

// --- compilation ---

const compile = async () => {
  const files = readdirSync(TS_DIR)
    .filter(f => f.endsWith(".ts") && !f.endsWith(".d.ts"));

  const renames = new Map<string, string>();
  const sourcesByHash = new Map<string, string>();

  for (const file of files) {
    const filePath = resolve(TS_DIR, file);
    const src = readFileSync(filePath, "utf-8");
    const tsHash = hashData(src);
    const oldName = basename(file, ".ts");

    if (oldName !== tsHash) {
      renames.set(oldName, tsHash);
    }
    sourcesByHash.set(tsHash, src);
  }

  if (renames.size > 0) {
    for (const [oldName, newName] of renames) {
      const oldPath = resolve(TS_DIR, `${oldName}.ts`);
      const newPath = resolve(TS_DIR, `${newName}.ts`);
      if (existsSync(oldPath)) {
        renameSync(oldPath, newPath);
        console.log(`  rename: ${oldName}.ts → ${newName}.ts`);
      }
    }

    const currentFiles = readdirSync(TS_DIR)
      .filter(f => f.endsWith(".ts") && !f.endsWith(".d.ts"));

    for (const file of currentFiles) {
      const filePath = resolve(TS_DIR, file);
      let src = readFileSync(filePath, "utf-8");
      let changed = false;
      for (const [oldName, newName] of renames) {
        const escaped = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`(from\\s+["'])\\./${escaped}(["'])`, "g");
        const next = src.replace(pattern, `$1./${newName}$2`);
        if (next !== src) {
          src = next;
          changed = true;
        }
      }
      if (changed) {
        writeFileSync(filePath, src);
        const hash = basename(file, ".ts");
        sourcesByHash.set(hash, src);
        console.log(`  updated imports in: ${file}`);
      }
    }

    return compile();
  }

  // dependency graph + topological sort
  const deps = new Map<string, string[]>();
  for (const [hash, src] of sourcesByHash) {
    const imports: string[] = [];
    for (const m of src.matchAll(/from\s+["']\.\/([^"']+)["']/g)) {
      imports.push(m[1].replace(/\.ts$/, ""));
    }
    deps.set(hash, imports);
  }

  const order: string[] = [];
  const visited = new Set<string>();
  const visit = (name: string) => {
    if (visited.has(name)) return;
    visited.add(name);
    for (const dep of deps.get(name) || []) visit(dep);
    order.push(name);
  };
  for (const name of sourcesByHash.keys()) visit(name);

  // compile each in order, write JS to js-scripts/
  mkdirSync(JS_DIR, { recursive: true });
  const noteHashes = new Map<string, string>();
  const history = readHistory();

  for (const tsHash of order) {
    const src = sourcesByHash.get(tsHash)!;

    const resolveImport = (specifier: string) => {
      if (specifier.startsWith("./") || specifier.startsWith("../")) {
        const depName = specifier.replace(/^\.\//, "").replace(/\.ts$/, "");
        const depJsHash = noteHashes.get(depName);
        if (!depJsHash) throw new Error(`unresolved import: ${specifier} (compile ${depName} first)`);
        return depJsHash;
      }
      return specifier;
    };

    const noteBody = compileModule(src, resolveImport);
    const jsHash = await addNote(noteBody);
    noteHashes.set(tsHash, jsHash);

    writeFileSync(resolve(JS_DIR, `${jsHash}.js`), noteBody);

    const exportName = getExportName(src);
    console.log(`  ${exportName}: ${tsHash} → ${jsHash}.js`);

    const existing = history.findIndex(e => e.tsHash === tsHash);
    if (existing >= 0) history.splice(existing, 1);
    history.push({ tsHash, jsHash, exportName });
  }

  writeHistory(history);
  currentHistory = history.slice(-10);
  console.log(`  history: ${currentHistory.length} entries`);

  return noteHashes;
};

// --- server ---

const server = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.end(); return; }

  if (req.url === "/history") {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(currentHistory));
    return;
  }

  res.statusCode = 404;
  res.end();
});

// --- run ---

const run = async () => {
  console.log(`\n--- compiling ts-scripts/ ---`);
  try {
    await compile();
  } catch (err) {
    console.error("compile error:", err);
  }
};

server.listen(LIVE_PORT, async () => {
  console.log(`dev: http://localhost:${LIVE_PORT}/history`);
  console.log(`watching: ${TS_DIR}`);
  await run();
});

let debounce: ReturnType<typeof setTimeout> | null = null;
watch(TS_DIR, { persistent: true, recursive: true }, (_event, filename) => {
  if (filename === "history.json") return;
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(run, 200);
});
