import { callNoteClient } from "../../src/runtime.ts";
import { noteBody } from "../note-fn.ts";

const main = async () => {
  const remoteFn = noteBody(function () {
    if (arg.op === "set") store.set("k", arg.value);
    return store.get("k");
  });

  const clientFn = noteBody(async function () {
    const first = await remote(arg.remoteFn, { op: "set", value: { ok: true, n: 7 } });
    const second = await remote(arg.remoteFn, { op: "get" });
    return { first, second };
  });

  const result = await callNoteClient(clientFn, { remoteFn }, { fuel: 100000 });
  console.log("result:", JSON.stringify(result));
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
