import { addNote } from "../src/db.ts";
import { spawn } from "node:child_process";
import { noteBody, note } from "./note-fn.ts";

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
  // remoteFn exists here as a real typed variable — TS is happy.
  // note() will prepend `const remoteFn = "..."` in the output string,
  // shadowing this closure variable with the actual JSON value.
  const remoteFn = noteBody(function () {
    let count = store.get("count") || 0;
    count += arg.dif;
    store.set("count", count);
    return count;
  });

  await publishView(
    note(function () {
      return (upper: UPPER) => {
        let label = HTML.p("count: loading...");
        let root: VDom;
        let update = (dif: number) =>
          remote(remoteFn, { dif }).then((c) => {
            label.textContent = "count: " + c;
            upper.update(root);
          });
        root = HTML.div(
          HTML.h3("Store View"),
          label,
          HTML.button("increment", {
            onclick: (e: DomEvent) => {
              if (e.type !== "click") return;
              update(1);
            },
          })
        );
        update(1);
        return root;
      };
    }, { remoteFn }),
    { open: true }
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
