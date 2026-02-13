import { createTestkit } from "../testkit/client.ts";

const main = async () => {

  console.log("STSR")
  const kit = createTestkit();
  console.log("Setting server to maincloud...");
  await kit.setServer("maincloud");
  console.log("Adding note...");

  const sample = {
    title: "playground",
    nested: { a: 1, b: [1, 2, 34] },
  };

  const hash = await kit.addNote(sample);
  console.log("saved:", hash);
  console.log("loaded:", JSON.stringify(await kit.getNote(hash), null, 2));
};

main()