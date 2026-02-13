import { it } from "node:test";
import { assertEq } from "./assert.ts";
import { addNote, callNote, getNote } from "../src/db.ts";

it("addNote/getNote roundtrip", async () => {


  const data = { title: "backend-test", ok: true };
  const hash = await addNote(data);
  const loaded = await getNote(hash);

  assertEq(loaded, data);
});

it("playground flow: nested note roundtrip and inline function execution", async () => {

  const key = `counter-${Date.now()}`;

  const sample = {
    title: "playground",
    nested: { a: 1, b: [1, 2, 3] },
  };

  const hash = await addNote(sample);
  const loaded = await getNote(hash);
  assertEq(loaded, sample);

  const fn = `
  store.set("${key}", 332);
  return store.get("${key}");
  `;
  const result = await callNote(fn);
  assertEq(result, 332);
});
