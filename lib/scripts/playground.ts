import { tojson, type Jsonable } from "@hashnotes/core/notes";
import { addNote, callNote, getNote, getServer, setServer } from "../src/db.ts";
import { callNoteClient } from "../src/runtime.ts";
import { spawn } from "node:child_process";


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

  const remoteFn = `
    if (arg.op === "set") store.set("k", arg.value);
    return store.get("k");
  `;

  await publishView(
    `
      const remoteFn = ${tojson(remoteFn)};
      await remote(remoteFn, { op: "set", value: 22 });

      return (upper) => {
        let count = store.get("count") || 0;
        let label = HTML.p("count: " + count);
        let btn = HTML.button("increment");
        const root = HTML.div(
          HTML.h3("Store View"),
          label, btn
        );
        btn.onEvent = (e) => {
          if (e.type !== "click") return;
          count += 1;
          store.set("count", count);
          label.textContent = "count: " + count;
          upper.update(root);
        };
        return root;
      };
    `,
    { open: true }
  );
};


main().catch((err) => {
  console.error(err);
  process.exit(1);
});
