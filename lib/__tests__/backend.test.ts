import { it } from "node:test";
import { assertEq } from "./assert.ts";
import { addNote, callNote, getNote } from "../src/db.ts";

it("playground e2e: addNote/getNote roundtrip for mixed payload shapes", async () => {
  const cases = [
    222,
    "222",
    [[1, 2]],
    { title: "playground", nested: { a: 1, b: [1, 2, 3213] } },
  ] as const;

  for (const data of cases) {
    const hash = await addNote(data);
    const loaded = await getNote(hash, { skipCache: true });
    assertEq(loaded, data);
  }
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
  ] as const;

  for (const payload of cases) {
    const result = await callNote(fn, payload);
    assertEq(result, payload.value);
  }
});
