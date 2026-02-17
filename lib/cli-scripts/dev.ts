/**
 * Dev watcher: compiles scripts/ → note function bodies.
 *
 * 1. Read TS sources (friendly names) from scripts/
 * 2. Strip comment headers, hash content → ts-notes/#<tsHash>.ts
 * 3. Compile to JS function body → js-notes/#<jsHash>.js + addNote
 * 4. Prepend comment header to source file pointing to ts/js notes
 * 5. Watch for changes, recompile on save
 * 6. Serve /history as JSON for the client /live route
 */

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync, watch } from "node:fs";
import { resolve, basename } from "node:path";
import { createServer } from "node:http";
import { compileModule } from "../src/compile.ts";
import { addNote, getNote } from "../src/db.ts";
import { hashData, type Ref } from "@hashnotes/core/notes";

const SCRIPTS_DIR = resolve(import.meta.dirname!, "../scripts");
const TS_NOTES_DIR = resolve(SCRIPTS_DIR, "ts-notes");
const JS_NOTES_DIR = resolve(SCRIPTS_DIR, "js-notes");
const HISTORY_PATH = resolve(SCRIPTS_DIR, "history.json");
const LIVE_PORT = 4321;

type HistoryEntry = {
  tsHash: string;
  jsHash: string;
  exportName: string;
  filename: string;
};

// --- header ---

const HEADER_RE = /^(\/\/ ts-note: [^\n]*\n|\/\/ js-note: [^\n]*\n)*/;

/** Strip // ts-note: and // js-note: header lines from source. */
const stripHeader = (src: string): string => src.replace(HEADER_RE, "");

const makeHeader = (tsHash: string, jsHash: string): string =>
  `// ts-note: ts-notes/${tsHash}.ts\n// js-note: js-notes/${jsHash}.js\n`;

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
  const files = readdirSync(SCRIPTS_DIR)
    .filter(f => f.endsWith(".ts") && !f.endsWith(".d.ts"));

  // Read sources, strip headers, build maps
  // Maps: filename (no ext) → clean source
  const sourcesByName = new Map<string, string>();
  // Maps: filename → tsHash
  const tsHashByName = new Map<string, string>();
  // Maps: tsHash → filename
  const nameByTsHash = new Map<string, string>();

  for (const file of files) {
    const filePath = resolve(SCRIPTS_DIR, file);
    const raw = readFileSync(filePath, "utf-8");
    const clean = stripHeader(raw);
    const name = basename(file, ".ts");
    const tsHash = hashData(clean);

    sourcesByName.set(name, clean);
    tsHashByName.set(name, tsHash);
    nameByTsHash.set(tsHash, name);
  }

  // Dependency graph: name → [dep names or hashes]
  const deps = new Map<string, string[]>();
  const parseDeps = (name: string, src: string) => {
    const imports: string[] = [];
    for (const m of src.matchAll(/from\s+["']\.\/([^"']+)["']/g)) {
      let dep = m[1].replace(/\.ts$/, "").replace(/^ts-notes\//, "");
      if (dep.startsWith("#") && nameByTsHash.has(dep)) {
        dep = nameByTsHash.get(dep)!;
      }
      imports.push(dep);
    }
    deps.set(name, imports);
  };
  for (const [name, src] of sourcesByName) parseDeps(name, src);

  // Pull missing hash imports from server
  const pulledHashes = new Set<string>(); // hashes we fetched from server
  let missing: string[] = [];
  do {
    missing = [];
    for (const depList of deps.values()) {
      for (const dep of depList) {
        if (dep.startsWith("#") && !sourcesByName.has(dep) && !pulledHashes.has(dep)) {
          missing.push(dep);
        }
      }
    }
    for (const hash of missing) {
      try {
        const tsSrc = await getNote(hash as Ref);
        if (typeof tsSrc !== "string") {
          console.warn(`  pull: ${hash} is not a string, skipping`);
          pulledHashes.add(hash);
          continue;
        }
        console.log(`  pull: ${hash} from server`);
        // Register under its hash as the "name"
        sourcesByName.set(hash, tsSrc);
        tsHashByName.set(hash, hash);
        nameByTsHash.set(hash, hash);
        pulledHashes.add(hash);
        // Write to ts-notes/ for local cache
        mkdirSync(TS_NOTES_DIR, { recursive: true });
        writeFileSync(resolve(TS_NOTES_DIR, `${hash}.ts`), tsSrc);
        // Parse its deps (may discover more missing)
        parseDeps(hash, tsSrc);
      } catch (err) {
        console.warn(`  pull: failed to fetch ${hash}:`, err);
        pulledHashes.add(hash); // don't retry
      }
    }
  } while (missing.length > 0);

  // Topological sort
  const order: string[] = [];
  const visited = new Set<string>();
  const visit = (name: string) => {
    if (visited.has(name)) return;
    visited.add(name);
    for (const dep of deps.get(name) || []) visit(dep);
    order.push(name);
  };
  for (const name of sourcesByName.keys()) visit(name);

  // Compile each in order
  mkdirSync(TS_NOTES_DIR, { recursive: true });
  mkdirSync(JS_NOTES_DIR, { recursive: true });
  const jsHashByName = new Map<string, string>();
  const history = readHistory();

  for (const name of order) {
    const src = sourcesByName.get(name)!;
    const tsHash = tsHashByName.get(name)!;

    const resolveImport = (specifier: string) => {
      if (specifier.startsWith("./") || specifier.startsWith("../")) {
        let depName = specifier.replace(/^\.\//, "").replace(/\.ts$/, "").replace(/^ts-notes\//, "");
        if (depName.startsWith("#") && nameByTsHash.has(depName)) {
          depName = nameByTsHash.get(depName)!;
        }
        const depJsHash = jsHashByName.get(depName);
        if (!depJsHash) throw new Error(`unresolved import: ${specifier} (compile ${depName} first)`);
        return depJsHash;
      }
      return specifier;
    };

    const noteBody = compileModule(src, resolveImport);
    const jsHash = await addNote(noteBody);
    jsHashByName.set(name, jsHash);

    // Write ts-notes copy with hash-addressed imports
    let tsNoteSrc = src;
    for (const m of src.matchAll(/from\s+["'](\.\/[^"']+)["']/g)) {
      const specifier = m[1];
      let depName = specifier.replace(/^\.\//, "").replace(/\.ts$/, "").replace(/^ts-notes\//, "");
      if (depName.startsWith("#") && nameByTsHash.has(depName)) {
        depName = nameByTsHash.get(depName)!;
      }
      const depTsHash = tsHashByName.get(depName);
      if (depTsHash) {
        tsNoteSrc = tsNoteSrc.replace(specifier, `./${depTsHash}`);
      }
    }
    writeFileSync(resolve(TS_NOTES_DIR, `${tsHash}.ts`), tsNoteSrc);

    // Upload TS note to server as a note (repository of TS sources)
    await addNote(tsNoteSrc);

    // Write js-notes
    writeFileSync(resolve(JS_NOTES_DIR, `${jsHash}.js`), noteBody);

    // Update source file header (only for local scripts, not pulled notes)
    const isPulled = pulledHashes.has(name);
    if (!isPulled) {
      const filePath = resolve(SCRIPTS_DIR, `${name}.ts`);
      const currentRaw = readFileSync(filePath, "utf-8");
      const header = makeHeader(tsHash, jsHash);
      const expectedRaw = header + stripHeader(currentRaw);
      if (currentRaw !== expectedRaw) {
        writeFileSync(filePath, expectedRaw);
      }
    }

    const exportName = getExportName(src);
    const label = isPulled ? `${tsHash.slice(0, 14)}…` : `${name}.ts`;
    console.log(`  ${exportName}: ${label} → ${jsHash}.js`);

    const existing = history.findIndex(e => e.filename === name);
    if (existing >= 0) history.splice(existing, 1);
    history.push({ tsHash, jsHash, exportName, filename: name });
  }

  writeHistory(history);
  currentHistory = history.slice(-10);
  console.log(`  history: ${currentHistory.length} entries`);

  return jsHashByName;
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
  console.log(`\n--- compiling scripts/ ---`);
  try {
    await compile();
  } catch (err) {
    console.error("compile error:", err);
  }
};

server.listen(LIVE_PORT, async () => {
  console.log(`dev: http://localhost:${LIVE_PORT}/history`);
  console.log(`watching: ${SCRIPTS_DIR}`);
  await run();
});

let debounce: ReturnType<typeof setTimeout> | null = null;
watch(SCRIPTS_DIR, { persistent: true, recursive: false }, (_event, filename) => {
  if (!filename || filename === "history.json") return;
  if (!filename.endsWith(".ts") || filename.endsWith(".d.ts")) return;
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(run, 200);
});
