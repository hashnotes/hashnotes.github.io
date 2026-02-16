import { tojson, type Jsonable } from "@hashnotes/core/notes";
import { addNote } from "../src/db.ts";
import http from "node:http";

/**
 * Extract the body of a function as a source string suitable for note storage.
 *
 * Write real JS/TS functions with full IDE support (autocomplete, type checking,
 * syntax highlighting), then use noteBody() to get the inner source as a string
 * for addNote()/publishView().
 *
 * TypeScript annotations are stripped by the runtime (tsx/node --experimental-strip-types)
 * before .toString() runs, so the result is clean JS.
 */
export const noteBody = (fn: Function): string => {
  const src = fn.toString();
  const open = src.indexOf("{");
  if (open === -1) {
    // arrow with expression body: (x) => x + 1
    const arrow = src.indexOf("=>");
    if (arrow === -1) throw new Error("noteBody: cannot parse function source");
    return `return ${src.slice(arrow + 2).trim()};`;
  }
  return src.slice(open + 1, src.lastIndexOf("}"));
};

/**
 * Like noteBody(), but prepends `const` declarations for embedded values.
 *
 * The vars become JSON literals at the top of the note source, so the
 * function body can reference them as normal variables — no magic placeholders.
 *
 *   note(function () {
 *     return remote(remoteFn, arg);
 *   }, { remoteFn: someSourceString })
 *
 * Produces:
 *   const remoteFn = "...source...";
 *   return remote(remoteFn, arg);
 *
 * In the authoring function, declare the variable name in the closure scope
 * (or as a parameter) so TS type-checks the body. note() shadows it with the
 * real JSON value in the output.
 */
export const note = (fn: Function, vars?: Record<string, Jsonable>): string => {
  const body = noteBody(fn);
  if (!vars || Object.keys(vars).length === 0) return body;
  const decls = Object.entries(vars)
    .map(([k, v]) => `const ${k} = ${tojson(v)};`)
    .join("\n");
  return `${decls}\n${body}`;
};

/**
 * Publish a view note: adds it to the DB, then POSTs the hash
 * to the live server (localhost:4321) so /live picks it up.
 */
export const publishView = async (viewFn: string) => {
  const hash = await addNote(viewFn);
  console.log("view hash:", hash);

  // notify live server (fire-and-forget, ok if not running)
  const req = http.request(
    { hostname: "localhost", port: 4321, path: "/hash", method: "POST" },
    () => {}
  );
  req.on("error", () => {});
  req.end(hash);

  return hash;
};
