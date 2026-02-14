# CLAUDE.md

## Purpose
`hashnotes` is a minimal reboot focused on a small, auditable core.
Keep only what is essential: parser/runtime, VDom/DAG rendering, and hash-addressed note storage.

## Restart Spirit
This project is a clean restart. Prefer direct, obvious code first.

- Minimize code size.
- Start with the smallest working version.
- Do not add abstraction until a concrete, current use case requires it.
- Do not add layers indirections etc until necessary.

## Core Principles

1. Minimal data model
- A note is only `{ hash, data }`.
- No per-note schema references (`schemaHash`) in the core model.
- Hash is content-addressed from `data` only.

2. Deterministic hashing
- Hash must be pure and deterministic.
- Identical data must produce identical hash.
- Insert is idempotent by hash.

3. Clear boundaries
- `core/`: parser, execution runtime, hashing, note model, backend.
- `lib/`: UI-independent utilities (VDom, DAG renderer).
- `app/`: routing and page wiring only.
- Keep business logic out of view files.

4. Canonical internal form
- At runtime, normalize data into one canonical form before execution/hashing.
- Treat inline vs ref as an input-format concern, not a semantic concern.
- If preserving authoring style is needed, keep provenance separately.

5. Explicit side effects
- Network writes must succeed before local cache is updated.
- Avoid hidden/implicit writes in render paths.
- Keep execution and persistence paths explicit and testable.

6. Testing discipline
- Preserve parser and VDom/DAG tests as core safety rails.
- Add tests around data normalization and note insert semantics.
- Favor small, behavior-focused tests.

## Default Decision Rule
When choosing between options, pick the one that is:
1. simpler,
2. more deterministic,
3. easier to test,
4. easier to reason about in production.
