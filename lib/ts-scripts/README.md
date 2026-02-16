# Edit flow

## Quick start

```
# terminal 1: dev watcher + compiler
npm run dev --workspace lib

# terminal 2: vite dev server
npm run dev
```

Open `http://localhost:5173/live` to see compiled notes. Click a view name to render it.

## How it works

Notes are TypeScript files in `lib/ts-scripts/`. Each file exports exactly one arrow function. The dev watcher compiles them into JS function bodies and uploads them as content-addressed notes to SpacetimeDB.

### File structure

```
lib/ts-scripts/
  #a1ad448b7c114e3c5dd50dd7d6cb2407.ts   ← server function
  #9296496f2a76ff5727ef127a07927a0c.ts   ← view
  history.json                            ← last 10 compiled entries
  tsconfig.json                           ← IDE support
lib/js-scripts/                           ← compiled output (gitignored)
lib/scripts/
  dev.ts                                  ← dev watcher
  hashnotes-env.d.ts                      ← ambient types for sandbox globals
```

### Writing a note

Every note must export exactly one arrow function:

```ts
// Server function — runs on SpacetimeDB via remote()
export const counterFn = (arg: { delta: number }) => {
  let count = (store.get("counter") || 0) as number;
  count += arg.delta;
  store.set("counter", count);
  return count;
};
```

```ts
// View — runs in the browser, receives `upper` as arg
import { counterFn } from "./#a1ad448b7c114e3c5dd50dd7d6cb2407";

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

### What the compiler does

1. **Strip types** — removes TypeScript annotations via `node:module`
2. **Parse** — builds an acorn AST from the JS module
3. **Resolve imports** — `import { counterFn } from "./#hash"` becomes a hash lookup
4. **Rewrite `remote()`** — `remote(counterFn, arg)` → `remote("#hash", arg)` (compile-time substitution)
5. **Inline the body** — extracts the arrow function body, binds the parameter from `arg`:

```
export const view = (upper: UPPER) => { ... }
```
becomes:
```js
const upper = arg;
...
```

6. **Emit `__deps`** — prefixes `const __deps = ["#hash1", "#hash2"];` so the runtime can prefetch sources
7. **Upload** — `addNote(body)` stores the JS string as a content-addressed note

### Runtime globals

Notes run in a sandboxed `new Function()` with these injected globals:

| Name | Type | Description |
|------|------|-------------|
| `arg` | `any` | The argument passed to the note (upper object for views) |
| `store` | `{get, set}` | Per-note persistent key/value storage |
| `remote(fn, arg)` | `→ Promise` | Call a note on the server (SpacetimeDB) |
| `getNoteSync(ref)` | `→ string` | Synchronous lookup of a prefetched dep source |
| `HTML` | `{div, p, button, ...}` | VDom element constructors |
| `addNote`, `getNote`, `asRef`, `deref`, `hashData`, `fromjson` | | Note storage primitives |

Full type definitions are in `lib/scripts/hashnotes-env.d.ts`.

### Dev watcher cycle

1. You save a `.ts` file in `ts-scripts/`
2. The watcher re-hashes the source → renames the file to `#<newHash>.ts`
3. Import paths in other files are updated to match
4. All files are compiled in dependency order
5. JS function bodies are written to `js-scripts/` and uploaded as notes
6. `history.json` is updated; the `/live` page polls and refreshes

### Views vs server functions

- **Views** export a function named `view` or `default`. The parameter becomes `arg` which is the `UPPER` object (provides `add`, `del`, `update` for live DOM mutations). The body must return a `VDom`.
- **Server functions** export any other name. They run on SpacetimeDB when called via `remote()`. They have access to `store` for persistent state.

### Rendering a note

Navigate to `http://localhost:5173/<hash>` (without the `#` prefix). The app:

1. Fetches the note source from SpacetimeDB
2. Prefetches all `__deps` sources (recursive)
3. Returns a `(upper: UPPER) => VDom` function
4. `renderDom()` calls it with an `UPPER` object wired to the real DOM
