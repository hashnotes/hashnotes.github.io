# Hashnotes

Hashnotes is a hash-based document management app where every document is content-addressed and immutable.

The system treats documents, functions, and views as notes. A note is identified by its hash, and references are stable across environments.

## Core Features

- Hash-based identity: note IDs are derived from content.
- Immutable notes: same content always maps to the same hash.
- Local-first caching: repeated reads/writes are served from local cache when possible.
- Server-backed storage: works with `local` and `maincloud` backends.
- Data-defined views: notes can store view functions that render UI.
- Hash-routed UI: app route `/<noteHash>` resolves and renders that note as a view.

## Data-Defined Views

A view is stored as function code in a note and evaluated by the runtime.  
The app can render it directly by visiting:

- `http://localhost:5173/<32-char-hash>`

This enables portable UI definitions where the view logic itself is addressable data.

## Workspace Layout

- `/Users/iainbanks/code/dkormann/hashnotes/core` language/runtime primitives
- `/Users/iainbanks/code/dkormann/hashnotes/lib` DB client, runtime, tests, playground scripts
- `/Users/iainbanks/code/dkormann/hashnotes/app` browser app (Vite)
- `/Users/iainbanks/code/dkormann/hashnotes/docs` static build output

## Getting Started

```bash
npm install
```

Run app dev server from root:

```bash
npm run dev
```

Build app into root `docs/`:

```bash
npm run build
```

## Validation

Run all checks:

```bash
npm run check
```

Run all tests:

```bash
npm run test
```

## Playground

Playground scripts live in the lib workspace:

```bash
npm run script:play --workspace lib
```

The playground includes helpers to publish a view note and open its URL in the browser.
