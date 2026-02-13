import { it } from "node:test";
import { assertEq } from "./assert.ts";
import { addNote, callNote, getNote } from "../src/db.ts";
import { callNoteClient } from "../src/runtime.ts";
import type { Jsonable } from "@hashnotes/core/notes";

it("playground e2e: addNote/getNote roundtrip for mixed payload shapes", async () => {
  const cases = [
    222,
    "222",
    [[1, 2]],
    { title: "playground", nested: { a: 1, b: [1, 2, 3213] } },
  ] as Jsonable[];

  await Promise.all(
    cases.map(async (data) => {
      const hash = await addNote(data);
      const loaded = await getNote(hash, { skipCache: true });
      assertEq(loaded, data);
    })
  );
});

it("playground e2e: callNote store roundtrip for different key/value objects", async () => {
  const fn = `
    store.set(arg.key, arg.value);
    return store.get(arg.key);
  `;

  const cases = [
    { key: 1, value: 222 },
    { key: [1, 2], value: [3, 4, 5] },
    { key: { type: "obj", id: 1 }, value: { ok: true, nested: { n: 7 } } },
    { key: { path: ["a", "b"] }, value: { list: [1, 2, 3], note: "hello" } },
  ] as {key: Jsonable, value: Jsonable}[];

  await Promise.all(
    cases.map(async (payload) => {
      const result = await callNote(fn, payload);
      assertEq(result, payload.value);
    })
  );
});

it("client fuel runner: sync local store + async remoteCall", async () => {
  const fn = `
    store.set(arg.key, arg.value);
    const local = store.get(arg.key);
    const remoteValue = await remote("return arg", arg.value);
    return { local, remote: remoteValue };
  `;

  const payload = {
    key: { type: "client-store", ts: Date.now() },
    value: { ok: true, list: [1, 2, 3] },
  };

  const result = await callNoteClient(fn, payload, { fuel: 100000 });
  assertEq(result, { local: payload.value, remote: payload.value });
});

it("client fuel runner: call(fn,arg) uses isolated child store", async () => {
  const childFn = `
    store.set("shared", arg);
    return store.get("shared");
  `;

  const parentFn = `
    store.set("shared", "parent");
    const child = await call(arg.childFn, arg.childValue);
    const outer = store.get("shared");
    return { outer, child };
  `;

  const result = await callNoteClient(parentFn, { childFn, childValue: "child" }, { fuel: 100000 });
  assertEq(result, { outer: "parent", child: "child" });
});

it("client fuel runner: remote cannot use local store space", async () => {
  const fn = `
    store.set("scope", "local");
    await remote("store.set('scope', 'remote'); return store.get('scope')", null);
    return store.get("scope");
  `;

  const result = await callNoteClient(fn, null, { fuel: 100000 });
  assertEq(result, "local");
});
