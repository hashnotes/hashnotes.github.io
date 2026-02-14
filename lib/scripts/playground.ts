import type { Jsonable } from "@hashnotes/core/notes";
import { addNote, callNote, getNote, SERVER } from "../src/db.ts";
import { callNoteClient } from "../src/runtime.ts";
import { spawn } from "node:child_process";


const printCheck = (label: string, ok: boolean, expected: unknown, got: unknown) => {
  const mark = ok ? "✓" : "✗";
  console.log(`${mark} ${label}`);
  if (!ok) {
    console.log("  expected:", JSON.stringify(expected));
    console.log("  got     :", JSON.stringify(got));
  }
};

const roundtrip = async (label: string, value: Jsonable) => {
  const hash = await addNote(value);
  const loaded = await getNote(hash, { skipCache: true });
  printCheck(`${label} roundtrip`, JSON.stringify(loaded) === JSON.stringify(value), value, loaded);
  return hash;
};

const openInBrowser = (url: string) => {
  const platform = process.platform;
  if (platform === "darwin") {
    spawn("open", [url], { stdio: "ignore", detached: true }).unref();
    return;
  }
  if (platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], { stdio: "ignore", detached: true }).unref();
    return;
  }
  spawn("xdg-open", [url], { stdio: "ignore", detached: true }).unref();
};

const publishView = async (
  viewFn: string,
  options: { open?: boolean; appOrigin?: string } = {}
) => {
  const hash = await addNote(viewFn);
  const appOrigin = options.appOrigin ?? process.env.HASHNOTES_APP_ORIGIN ?? "http://localhost:5173";
  const url = `${appOrigin}/${hash.slice(1)}`;

  console.log("view hash:", hash);
  console.log("view url :", url);

  if (options.open ?? true) openInBrowser(url);
  return { hash, url };
};

const main = async () => {
  const server = (process.env.HASHNOTES_SERVER === "maincloud" ? "maincloud" : "local");
  await SERVER.set(server);
  console.log(`server: ${server}`);

  console.log("=== addNote/getNote === ");
  const sample = { title: "playground", nested: { a: 1, b: [1, 2, 3213] } };
  await roundtrip("number", 222);
  await roundtrip("string", "222");
  await roundtrip("array", [[1, 2]]);
  const sampleHash = await roundtrip("object", sample);
  console.log("sample hash:", sampleHash);


  console.log("\n=== callNote (backend) ===");

  const storeFN = `
    store.set(arg.key, arg.value);
    return store.get(arg.key);
  `;
  const FNARG = {
    key: { scope: "backend", id: Date.now() },
    value: { ok: true, via: "call_note" },
  }
  const backendStoreResult = await callNote(storeFN,FNARG );
  console.log("backend store result:", JSON.stringify(backendStoreResult));

  console.log("\n=== callNoteClient (client runtime) ===");

  const clientResult = await callNoteClient(storeFN, FNARG)
  console.log("client runtime result:", JSON.stringify(clientResult));

  console.log("\n=== publish view ===");
  await publishView(
    `
      return (upper) => {
        let count = 0
        let label = HTML.p("count: "+ 0)
        let btn = HTML.button("increment")
        const root = HTML.div(
          { style: { padding: "1rem", fontFamily: "monospace" } },
          HTML.h3("View"),
          label, btn
        );
        btn.onEvent = (e) => {
          if (e.type !== "click") return;
          count += 1;
          label.textContent = "count: " + count;
          upper.update(root);
        };
        return root;
      };
    `
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
