import { it } from "node:test";
import { createTestkit } from "../testkit/client.ts";
import { assertEq } from "../testkit/assert.ts";

it("addNote/getNote roundtrip", async () => {
  const kit = createTestkit();
  await kit.setServer("maincloud");

  const data = { title: "backend-test", ok: true };
  const hash = await kit.addNote(data);
  const loaded = await kit.getNote(hash);

  assertEq(loaded, data);
});

it("playground flow: nested note roundtrip and inline function execution", async () => {
  const kit = createTestkit();
  await kit.setServer("maincloud");

  const sample = {
    title: "playground",
    nested: { a: 1, b: [1, 2, 3] },
  } as const;

  const hash = await kit.addNote(sample);
  const loaded = await kit.getNote(hash);
  assertEq(loaded, sample);

  const fn = `
  store.set("counter", 332);
  return store.get("counter");
  `;
  const result = await kit.callNote(fn);
  assertEq(result, 332);
});
