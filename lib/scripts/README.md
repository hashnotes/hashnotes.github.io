# Hashnotes User Scripts Guide

This guide covers how to develop, run, debug, and publish user scripts in this repo.

## What this system is

- User scripts live in `/Users/iainbanks/code/dkormann/hashnotes/lib/scripts`.
- Each script is compiled into a content-addressed note function body.
- Compiled functions and data are stored in the backend as hash refs (`#...`).
- The app loads and executes these note functions in a sandbox runtime.

## Quick start

Run in two terminals:

```bash
# terminal 1: script compiler + history server
bun run dev:scripts

# terminal 2: app dev server
bun run dev
```

Open:

- `http://localhost:5173/live` for dev history/live links
- `http://localhost:5173/live/view` for live-rendering latest `view`

## Core authoring rules

### 1. One runtime export per script file

- A script module must have exactly one runtime export.
- `export type ...` is fine (type-only), but only one value export (`export const ...` or `export default ...`).

### 2. Use plain JS syntax that parser/codegen supports

Avoid unsupported constructs in user script code bodies, especially:

- template literals (backticks)
- regex literals

Prefer simple string concatenation and plain expressions.

### 3. Treat browser-only APIs as unavailable in scripts

- Do not call `fetch` directly from user scripts.
- Use runtime-provided globals (see Runtime globals section).

## Script types

- `view` script:
  - Export name `view` (or `default`).
  - Receives `ctx: ViewContext` and returns `VDom`.
- function script:
  - Any other export name.
  - Callable through runtime (`remote`, `getFuncSync`, etc.).

## Imports

Use relative imports from scripts:

```ts
import { runPipeline } from "./runPipeline"
import type { Graph } from "./pipeline"
```

The compiler rewrites/import-resolves to hash refs under the hood.

## Runtime globals (available in scripts)

Type declarations are in `/Users/iainbanks/code/dkormann/hashnotes/lib/scripts/hashnotes-env.d.ts`.

Most-used globals:

- `args`
- `store.get(key)`, `store.set(key, value)`
- `remote(fn)`
- `getFuncSync(ref)`, `getDataSync(ref)`
- `addNote(data)`, `getNote(ref)`, `asRef(x)`, `deref(ref)`
- `hashData(value)`, `fromjson(text)`
- `HTML.*` VDom builders
- `promptUser(message, defaultValue?)`
- `openRouterRequest({ apiKey, model, prompt, schema })`

## OpenRouter usage (recommended wrapper)

Use `/Users/iainbanks/code/dkormann/hashnotes/lib/scripts/openRouterLocal.ts`.

It does:

- load API key from function-scoped `store`
- if missing, prompt user via popup
- persist key in `store`
- call `openRouterRequest(...)`

Example:

```ts
import { openRouterLocal } from "./openRouterLocal"

export const myFn = async () => {
  return await openRouterLocal({
    model: "openai/gpt-4o-mini",
    prompt: "Extract fields from this text...",
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
      },
      required: ["title"],
      additionalProperties: false,
    },
  })
}
```

## Trace pipeline model (current)

- Pipeline execution stores trace nodes atomically as backend notes.
- Each stored trace node references child inputs by `Ref[]`.
- Trace visualization loads the tree recursively by root ref.

Related scripts:

- `/Users/iainbanks/code/dkormann/hashnotes/lib/scripts/runPipeline.ts`
- `/Users/iainbanks/code/dkormann/hashnotes/lib/scripts/loadTrace.ts`
- `/Users/iainbanks/code/dkormann/hashnotes/lib/scripts/graphView.ts`

## Build/publish workflow

There is no separate manual publish step for normal dev.

When `bun run dev:scripts` is running:

1. Save a script in `lib/scripts`.
2. Compiler rebuilds in dependency order.
3. Compiled JS note bodies are uploaded (content-addressed).
4. `/Users/iainbanks/code/dkormann/hashnotes/lib/scripts/history.json` is updated.
5. App `/live` and `/live/view` pick up updates.

To share/pin a function/view, use its hash from history.

## Routes

App routes:

- `/:hash` => raw note JSON/data view
- `/view/:hash` => render note as a view
- `/live` => dev history UI
- `/live/view` => live latest view

## Logs and debugging

Browser and dev-script errors both go to:

- `/Users/iainbanks/code/dkormann/hashnotes/lib/scripts/browser-errors.log`

History endpoint used by app live mode:

- `http://localhost:4321/history`

Dev watcher behavior:

- clears `browser-errors.log` each deploy cycle
- logs compile/server/unhandled errors into that file

## Common failure causes

- `only one export per module`:
  - more than one runtime export in a script file.
- `unsupported expression: TemplateLiteral`:
  - backticks used in script code.
- `unsupported expression: regexp literals`:
  - regex literal used in script code.
- `undeclared: ...`:
  - identifier not allowed/in scope in sandbox.

## Helpful commands

```bash
# check all packages
bun run check

# check lib only
(cd lib && bun run check)

# run app
bun run dev

# run script compiler/watcher
bun run dev:scripts
```
