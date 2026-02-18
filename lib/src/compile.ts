/**
 * compile.ts — TS module → JS function body compiler.
 *
 * Pipeline:
 *   1. Strip TypeScript types (via node:module)
 *   2. Parse as ES module with acorn
 *   3. String-slice the JS source, replacing:
 *      - imports  → `const fn = getFuncSync("#hash")` or `getDataSync("#hash")`
 *      - export arrow  → inline body with `const [a, b, c] = args;`
 *   4. Prepend `const __deps = [...]`
 *
 * Constraint: each file exports exactly one function.
 * All non-import/export code passes through verbatim.
 */

import { parse as acornParse } from "acorn";
import { stripTypeScriptTypes } from "node:module";

type N = { type: string; start: number; end: number; [k: string]: any };

// ---------------------------------------------------------------------------
// Strip types
// ---------------------------------------------------------------------------

/**
 * Strip TypeScript types from a function body source (no import/export).
 * Wraps in an async function to allow top-level return/await, then unwraps.
 */
export const stripTypes = (tsSrc: string): string => {
  const wrapped = `async function __wrap__() {\n${tsSrc}\n}`;
  const stripped = stripTypeScriptTypes(wrapped, { mode: "strip" });
  const open = stripped.indexOf("{\n") + 2;
  const close = stripped.lastIndexOf("\n}");
  return stripped.slice(open, close);
};

// ---------------------------------------------------------------------------
// Module compiler
// ---------------------------------------------------------------------------

export type ResolveResult =
  | string
  | { hash: string; mode: "local" }
  | { hash: string; mode: "remote" };

const resolveHash = (rr: ResolveResult): string =>
  typeof rr === "string" ? rr : rr.hash;

/**
 * Compile a TS module source to a JS function body.
 */
export const compileModule = (
  tsSrc: string,
  resolve?: (specifier: string) => ResolveResult,
  jsonImportSpecs?: Set<string>,
): string => {
  // 1. Strip types
  const jsSrc = stripTypeScriptTypes(tsSrc, { mode: "strip" });

  // 2. Parse as module
  const ast = acornParse(jsSrc, {
    ecmaVersion: "latest",
    sourceType: "module",
  }) as unknown as N;

  // 3. Collect imports
  const importHashes = new Map<string, string>(); // name → hash
  const jsonImportNames = new Set<string>(); // names that are JSON data imports
  const sideEffectHashes: string[] = [];
  const nonImportNodes: N[] = [];

  for (const node of ast.body as N[]) {
    if (node.type === "ImportDeclaration") {
      const specs = node.specifiers as N[];
      const raw: string = node.source.value;
      const isJson = jsonImportSpecs?.has(raw) ?? false;
      const rr = resolve ? resolve(raw) : raw;
      const hash = resolveHash(rr);
      if (specs.length === 0) {
        sideEffectHashes.push(hash);
      } else {
        for (const s of specs) {
          importHashes.set(s.local.name, hash);
          if (isJson) jsonImportNames.add(s.local.name);
        }
      }
    } else {
      nonImportNodes.push(node);
    }
  }

  // 4. Find the single export arrow
  let exportNode: N | null = null;
  let exportArrow: N | null = null;

  for (const node of nonImportNodes) {
    if (node.type === "ExportNamedDeclaration") {
      const arrow = getExportedArrow(node);
      if (!arrow) throw new Error("export must be a single arrow function");
      if (exportArrow) throw new Error("only one export per module");
      exportNode = node;
      exportArrow = arrow;
    } else if (node.type === "ExportDefaultDeclaration") {
      const decl = node.declaration as N;
      if (decl.type !== "ArrowFunctionExpression") throw new Error("export default must be an arrow function");
      if (exportArrow) throw new Error("only one export per module");
      exportNode = node;
      exportArrow = decl;
    } else if (node.type === "ExportAllDeclaration") {
      throw new Error("export * from '...' is not supported");
    }
  }

  // 5. Build output using string slices from jsSrc
  const lines: string[] = [];

  // Emit bindings for all imports
  for (const hash of sideEffectHashes) {
    lines.push(`getFuncSync(${JSON.stringify(hash)});`);
  }
  for (const [name, hash] of importHashes) {
    const getter = jsonImportNames.has(name) ? "getDataSync" : "getFuncSync";
    lines.push(`const ${name} = ${getter}(${JSON.stringify(hash)});`);
  }

  // Emit non-import, non-export statements verbatim
  for (const node of nonImportNodes) {
    if (node === exportNode) continue;
    lines.push(jsSrc.slice(node.start, node.end));
  }

  // 6. Inline the arrow function body
  if (exportArrow) {
    const params = exportArrow.params as N[];
    if (params.length === 1) {
      const p = jsSrc.slice(params[0].start, params[0].end);
      if (p !== "args") lines.push("const [" + p + "] = args;");
    } else if (params.length > 1) {
      const ps = params.map(p => jsSrc.slice(p.start, p.end));
      lines.push("const [" + ps.join(", ") + "] = args;");
    }

    if (exportArrow.body.type === "BlockStatement") {
      for (const s of exportArrow.body.body as N[]) {
        lines.push(jsSrc.slice(s.start, s.end));
      }
    } else {
      lines.push("return " + jsSrc.slice(exportArrow.body.start, exportArrow.body.end) + ";");
    }
  }

  // 7. Prepend __deps
  const depHashes = [...new Set([...sideEffectHashes, ...importHashes.values()])];
  if (depHashes.length > 0) {
    const depsLine = "const __deps = [" + depHashes.map(h => JSON.stringify(h)).join(", ") + "];";
    lines.unshift(depsLine);
  }

  return lines.join("\n") + "\n";
};

// ---------------------------------------------------------------------------
// Export helpers
// ---------------------------------------------------------------------------

/** Extract arrow function from `export const name = (...) => ...` */
const getExportedArrow = (node: N): N | null => {
  const decl = node.declaration as N | null;
  if (!decl || decl.type !== "VariableDeclaration") return null;
  const inits = decl.declarations as N[];
  if (inits.length !== 1 || !inits[0].init) return null;
  const init = inits[0].init as N;
  return init.type === "ArrowFunctionExpression" ? init : null;
};
