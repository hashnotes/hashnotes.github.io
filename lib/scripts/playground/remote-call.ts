import { callNoteClient } from "../../src/runtime.ts";

const main = async () => {
  // Call the same remote function twice so the backend store namespace (scoped by fnRef) persists.
  const remoteFn = `
	    if (arg.op === "set") store.set("k", arg.value);
	    return store.get("k");
  `;

  const clientFn = `
    const first = await remote(arg.remoteFn, { op: "set", value: { ok: true, n: 7 } });
    const second = await remote(arg.remoteFn, { op: "get" });
    return { first, second };
  `;

  const result = await callNoteClient(clientFn, { remoteFn }, { fuel: 100000 });
  console.log("result:", JSON.stringify(result));
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
