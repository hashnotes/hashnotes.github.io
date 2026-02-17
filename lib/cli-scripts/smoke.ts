import { addNote, getNote } from "../src/db.ts";

const main = async () => {
  const payload = { title: "smoke", value: 1 } as const;
  const hash = await addNote(payload);
  const roundtrip = await getNote(hash);

  console.log("hash:", hash);
  console.log("note:", JSON.stringify(roundtrip, null, 2));
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
