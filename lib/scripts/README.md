# Edit flow

## Quick start

```
# terminal 1: dev watcher + compiler
(cd lib && bun run dev)

# terminal 2: vite dev server
bun run dev
```

Open `http://localhost:5173/live` to see compiled notes. Click a view name to render it.

## How it works

Notes are TypeScript files in `lib/scripts/`. Each file exports exactly one arrow function. The dev watcher compiles them into JS function bodies and uploads them as content-addressed notes to SpacetimeDB.

### File structure

```
lib/scripts/                        <- edit notes here
  counterFn.ts                        friendly-named source
  counterView.ts
  hashnotes-env.d.ts                  ambient types for sandbox globals
  tsconfig.json                       IDE support
  history.json                        last 10 compiled entries
  ts-notes/                           hashed TS copies (gitignored)
    #a1ad448b...ts
  js-notes/                           compiled JS bodies (gitignored)
    #03186aed...js

lib/cli-scripts/                    <- build tooling
  dev.ts                              dev watcher + compiler
  smoke.ts                            smoke test
  note-fn.ts                          note helper utilities
```

### Writing a note

Every note must export exactly one arrow function:

```ts
// Server function -- runs on SpacetimeDB via remote()
export const counterFn = (arg: { delta: number }) => {
  let count = (store.get("counter") || 0) as number;
  count += arg.delta;
  store.set("counter", count);
  return count;
};
```

```ts
// View -- runs in the browser, receives upper as arg
import { counterFn } from "./counterFn";

export const view = (upper: UPPER) => {
  const label = HTML.p("count: loading...");
  const inc = (delta: number) =>
    remote(counterFn, { delta }).then((count) => {
      label.textContent = "count: " + count;
      upper.update(label);
    });
  inc(0);
  return HTML.div(
    HTML.h2("counter"),
    label,
    HTML.button("+1", { onclick: () => inc(1) }),
    HTML.button("-1", { onclick: () => inc(-1) })
  );
};
```

After compilation, the source file gets a comment header:
```ts
// ts-note: ts-notes/#a1ad448b...ts
// js-note: js-notes/#03186aed...js
export const counterFn = (arg: { delta: number }) => { ... };
```

### Imports

Source files import by friendly name:
```ts
import { counterFn } from "./counterFn";
```

Hash imports are also supported:
```ts
import { counterFn } from "./#a1ad448b7c114e3c5dd50dd7d6cb2407";
```

The ts-notes copies have all imports rewritten to hash names (frozen snapshots).

### What the compiler does

1. **Strip headers** -- removes `// ts-note:` / `// js-note:` lines before hashing
2. **Strip types** -- removes TypeScript annotations via `node:module`
3. **Parse** -- builds an acorn AST from the JS module
4. **Resolve imports** -- friendly names and hash names both resolve to the dep's JS hash
5. **Inline the body** -- extracts the arrow function body, binds the parameter from `arg`
7. **Emit `__deps`** -- prefixes `const __deps = [...]` for runtime prefetching
8. **Upload** -- `addNote(body)` stores the JS string as a content-addressed note
9. **Write outputs** -- ts-notes/ (hashed TS copy) and js-notes/ (compiled JS)
10. **Update header** -- prepends `// ts-note:` and `// js-note:` to source file

### Runtime globals

Notes run in a sandboxed `new Function()` with these injected globals:

| Name | Type | Description |
|------|------|-------------|
| `arg` | `any` | The argument passed to the note (upper object for views) |
| `store` | `{get, set}` | Per-note persistent key/value storage |
| `remote(fn, arg)` | `-> Promise` | Call a note on the server (SpacetimeDB) |
| `getFuncSync(ref)` | `-> (arg) -> result` | Get a callable wrapper for a prefetched dep |
| `HTML` | `{div, p, button, ...}` | VDom element constructors |
| `addNote`, `getNote`, `asRef`, `deref`, `hashData`, `fromjson` | | Note storage primitives |

Full type definitions are in `lib/scripts/hashnotes-env.d.ts`.

### Dev watcher cycle

1. You save a `.ts` file in `scripts/`
2. The watcher strips headers, hashes content, builds dependency graph
3. All files are compiled in dependency order
4. Hashed copies written to `ts-notes/`, compiled JS to `js-notes/`
5. JS bodies uploaded as notes to SpacetimeDB
6. Source files get updated comment headers
7. `history.json` is updated; the `/live` page polls and refreshes

### Views vs server functions

- **Views** export a function named `view` or `default`. The parameter becomes `arg` which is the `UPPER` object (provides `add`, `del`, `update` for live DOM mutations). The body must return a `VDom`.
- **Server functions** export any other name. They run on SpacetimeDB when called via `remote()`. They have access to `store` for persistent state.
- **Local calls** -- imported functions can also be called directly: `counterFn({delta: 1})`. The runtime wraps deps as callable functions.

### Rendering a note

Navigate to `http://localhost:5173/<hash>` (without the `#` prefix). The app:

1. Fetches the note source from SpacetimeDB
2. Prefetches all `__deps` sources (recursive)
3. Returns a `(upper: UPPER) => VDom` function
4. `renderDom()` calls it with an `UPPER` object wired to the real DOM
