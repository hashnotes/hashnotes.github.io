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
