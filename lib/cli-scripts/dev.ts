/**
 * Dev watcher: compiles scripts/ → note function bodies.
 *
 * 1. Read TS sources and JSON data from scripts/
 * 2. Strip comment headers, hash content → notes/#<hash>.ts / .json
 * 3. Compile TS to JS function body → notes/#<jsHash>.js + addNote
 * 4. Prepend comment header to source file pointing to notes
 * 5. Watch for changes, recompile on save
 * 6. Serve /history as JSON for the client /live route
 */

import { readFileSync, readdirSync, writeFileSync, unlinkSync, existsSync, mkdirSync, watch, appendFileSync } from "node:fs";
import { resolve, basename } from "node:path";
import { createServer } from "node:http";
import { compileModule } from "../src/compile.ts";
import { addNote, getNote } from "../src/db.ts";
import { hashData, type Jsonable, type Ref } from "@hashnotes/core/notes";

const SCRIPTS_DIR = resolve(import.meta.dirname!, "../scripts");
const NOTES_DIR = resolve(SCRIPTS_DIR, "notes");
const HISTORY_PATH = resolve(SCRIPTS_DIR, "history.json");
const BROWSER_ERRORS_PATH = resolve(SCRIPTS_DIR, "browser-errors.log");
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
  `// ts-note: notes/${tsHash}.ts\n// js-note: notes/${jsHash}.js\n`;

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

/** Normalize an import dep string: strip .ts/.json suffix and notes/ prefix */
const normalizeDep = (raw: string): string =>
  raw.replace(/\.(ts|json)$/, "").replace(/^(ts-notes|js-notes|notes)\//, "");

const compile = async () => {
  mkdirSync(NOTES_DIR, { recursive: true });

  // --- Read JSON data files ---
  const jsonFiles = readdirSync(SCRIPTS_DIR).filter(f => f.endsWith(".json") && f !== "history.json" && f !== "tsconfig.json");
  const jsonHashByName = new Map<string, string>(); // friendly name or hash → data hash

  for (const file of jsonFiles) {
    const filePath = resolve(SCRIPTS_DIR, file);
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw) as Jsonable;
    const hash = hashData(data);
    const name = basename(file, ".json");
    jsonHashByName.set(name, hash);
    writeFileSync(resolve(NOTES_DIR, `${hash}.json`), raw);
    await addNote(data);
    console.log(`  ${name}.json → ${hash}`);
  }

  // --- Read TS sources ---
  const files = readdirSync(SCRIPTS_DIR)
    .filter(f => f.endsWith(".ts") && !f.endsWith(".d.ts"));

  const sourcesByName = new Map<string, string>();
  const tsHashByName = new Map<string, string>();
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

  // --- Normalize hash imports to ./notes/#hash paths in local source files ---
  for (const [name, src] of sourcesByName) {
    if (name.startsWith("#")) continue; // skip pulled notes
    let rewritten = src;
    for (const m of src.matchAll(/from\s+["'](\.\/[^"']+|#[^"']+)["']/g)) {
      const spec = m[1];
      const dep = normalizeDep(spec.replace(/^\.\//, ""));
      if (!dep.startsWith("#")) continue;
      // Already correct: ./notes/#hash.ext
      if (spec.startsWith("./notes/")) continue;
      // Preserve existing extension, default to .ts
      const extMatch = spec.match(/\.(ts|json)$/);
      const ext = extMatch ? `.${extMatch[1]}` : ".ts";
      rewritten = rewritten.replace(spec, `./notes/${dep}${ext}`);
    }
    if (rewritten !== src) {
      sourcesByName.set(name, rewritten);
      const newHash = hashData(rewritten);
      nameByTsHash.delete(tsHashByName.get(name)!);
      tsHashByName.set(name, newHash);
      nameByTsHash.set(newHash, name);
      writeFileSync(resolve(SCRIPTS_DIR, `${name}.ts`), rewritten);
      console.log(`  rewrite: ${name}.ts → normalized hash import paths`);
    }
  }

  // --- Dependency graph ---
  const deps = new Map<string, string[]>();
  const parseDeps = (name: string, src: string) => {
    const imports: string[] = [];
    // Match both ./dep and bare #hash imports
    for (const m of src.matchAll(/from\s+["'](\.\/[^"']+|#[^"']+)["']/g)) {
      let dep = normalizeDep(m[1].replace(/^\.\//, ""));
      if (dep.startsWith("#") && nameByTsHash.has(dep)) {
        dep = nameByTsHash.get(dep)!;
      }
      imports.push(dep);
    }
    deps.set(name, imports);
  };
  for (const [name, src] of sourcesByName) parseDeps(name, src);

  // --- Pull missing hash imports from server ---
  const pulledHashes = new Set<string>();
  let missing: string[] = [];
  do {
    missing = [];
    for (const depList of deps.values()) {
      for (const dep of depList) {
        if (dep.startsWith("#") && !sourcesByName.has(dep) && !jsonHashByName.has(dep) && !pulledHashes.has(dep)) {
          missing.push(dep);
        }
      }
    }
    for (const hash of missing) {
      try {
        const note = await getNote(hash as Ref);
        pulledHashes.add(hash);
        if (typeof note === "string") {
          console.log(`  pull: ${hash}.ts from server`);
          sourcesByName.set(hash, note);
          tsHashByName.set(hash, hash);
          nameByTsHash.set(hash, hash);
          writeFileSync(resolve(NOTES_DIR, `${hash}.ts`), note);
          parseDeps(hash, note);
        } else {
          console.log(`  pull: ${hash}.json from server`);
          jsonHashByName.set(hash, hash);
          writeFileSync(resolve(NOTES_DIR, `${hash}.json`), JSON.stringify(note));
        }
      } catch (err) {
        console.warn(`  pull: failed to fetch ${hash}:`, err);
        pulledHashes.add(hash);
      }
    }
  } while (missing.length > 0);

  // --- Topological sort (TS sources only, skip JSON data deps) ---
  const order: string[] = [];
  const visited = new Set<string>();
  const visit = (name: string) => {
    if (visited.has(name)) return;
    visited.add(name);
    for (const dep of deps.get(name) || []) visit(dep);
    if (sourcesByName.has(name)) order.push(name);
  };
  for (const name of sourcesByName.keys()) visit(name);

  // --- Compile each in order ---
  const jsHashByName = new Map<string, string>();
  const history = readHistory();

  for (const name of order) {
    const src = sourcesByName.get(name)!;
    const tsHash = tsHashByName.get(name)!;

    // Match both ./dep and bare #hash imports
    const importSpecRe = /from\s+["'](\.\/[^"']+|#[^"']+)["']/g;

    // Collect which import specifiers point to JSON data
    const jsonImportSpecs = new Set<string>();
    for (const m of src.matchAll(importSpecRe)) {
      const spec = m[1];
      if (spec.endsWith(".json")) { jsonImportSpecs.add(spec); continue; }
      const depName = normalizeDep(spec.replace(/^\.\//, ""));
      if (jsonHashByName.has(depName)) jsonImportSpecs.add(spec);
    }

    const resolveImport = (specifier: string): string => {
      if (specifier.startsWith("./") || specifier.startsWith("../") || specifier.startsWith("#")) {
        let depName = normalizeDep(specifier.replace(/^\.\//, ""));
        if (depName.startsWith("#") && nameByTsHash.has(depName)) {
          depName = nameByTsHash.get(depName)!;
        }
        const jsonHash = jsonHashByName.get(depName);
        if (jsonHash) return jsonHash;
        const depJsHash = jsHashByName.get(depName);
        if (!depJsHash) throw new Error(`unresolved import: ${specifier} (compile ${depName} first)`);
        return depJsHash;
      }
      return specifier;
    };

    const noteBody = compileModule(src, resolveImport, jsonImportSpecs);
    const jsHash = await addNote(noteBody);
    jsHashByName.set(name, jsHash);

    // Write notes copy with hash-addressed imports
    let tsNoteSrc = src;
    for (const m of src.matchAll(importSpecRe)) {
      const specifier = m[1];
      let depName = normalizeDep(specifier.replace(/^\.\//, ""));
      if (depName.startsWith("#") && nameByTsHash.has(depName)) {
        depName = nameByTsHash.get(depName)!;
      }
      const depTsHash = tsHashByName.get(depName) ?? jsonHashByName.get(depName);
      if (depTsHash) {
        const isJson = jsonHashByName.has(depName) || specifier.endsWith(".json");
        tsNoteSrc = tsNoteSrc.replace(specifier, `./${depTsHash}${isJson ? ".json" : ".ts"}`);
      }
    }
    writeFileSync(resolve(NOTES_DIR, `${tsHash}.ts`), tsNoteSrc);
    await addNote(tsNoteSrc);

    writeFileSync(resolve(NOTES_DIR, `${jsHash}.js`), noteBody);

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

  // --- GC: delete unreachable note files ---
  const reachable = new Set<string>();
  const walk = (hash: string) => {
    if (reachable.has(hash)) return;
    reachable.add(hash);
    const src = sourcesByName.get(hash);
    if (typeof src === "string") {
      for (const m of src.matchAll(/from\s+["'](\.\/[^"']+|#[^"']+)["']/g)) {
        const dep = normalizeDep(m[1].replace(/^\.\//, ""));
        walk(dep);
      }
    }
  };
  for (const entry of history) { walk(entry.tsHash); walk(entry.jsHash); }
  for (const h of tsHashByName.values()) walk(h);
  for (const h of jsHashByName.values()) walk(h);
  for (const h of jsonHashByName.values()) walk(h);

  let gc = 0;
  for (const file of readdirSync(NOTES_DIR)) {
    const hash = file.replace(/\.(ts|js|json)$/, "");
    if (!reachable.has(hash)) {
      unlinkSync(resolve(NOTES_DIR, file));
      gc++;
    }
  }
  if (gc) console.log(`  gc: removed ${gc} unreachable note files`);

  return jsHashByName;
};

// --- server ---

const server = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.end(); return; }

  if (req.url === "/browser-error" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => { body += String(chunk); });
    req.on("end", () => {
      const at = new Date().toISOString();
      try {
        const payload = JSON.parse(body) as Record<string, unknown>;
        const lines = [
          `\n[${at}] browser error`,
          `page: ${String(payload.page ?? "")}`,
          `source: ${String(payload.source ?? "")}`,
          `message: ${String(payload.message ?? "")}`,
          payload.stack ? `stack: ${String(payload.stack)}` : "",
        ].filter(Boolean).join("\n");
        appendFileSync(BROWSER_ERRORS_PATH, lines + "\n");
        console.error(lines);
      } catch {
        const line = `\n[${at}] browser error (raw)\n${body}\n`;
        appendFileSync(BROWSER_ERRORS_PATH, line);
        console.error(line);
      }
      res.statusCode = 204;
      res.end();
    });
    return;
  }

  if (req.url === "/browser-errors") {
    const content = existsSync(BROWSER_ERRORS_PATH) ? readFileSync(BROWSER_ERRORS_PATH, "utf-8") : "";
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end(content);
    return;
  }

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
  writeFileSync(BROWSER_ERRORS_PATH, "");
  console.log("  browser errors: cleared");
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
  if (!filename.endsWith(".ts") && !filename.endsWith(".json")) return;
  if (filename.endsWith(".d.ts")) return;
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(run, 200);
});
