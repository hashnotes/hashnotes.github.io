import { createTestkit } from "../testkit/client.ts";

const main = async () => {
  const kit = createTestkit();
  await kit.setServer("maincloud");

  const payload = { title: "smoke", value: 1 } as const;
  const hash = await kit.addNote(payload);
  const roundtrip = await kit.getNote(hash);

  console.log("hash:", hash);
  console.log("note:", JSON.stringify(roundtrip, null, 2));
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
