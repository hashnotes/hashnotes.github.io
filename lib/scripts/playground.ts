import { tojson, type Jsonable } from "@hashnotes/core/notes";
import { addNote, callNote } from "../src/db.ts";
import { spawn } from "node:child_process";
import { callNoteClient } from "../src/runtime.ts";


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
  // This script requires an accessible SpacetimeDB endpoint.
  // Configure via `HASHNOTES_SERVER=local` (and run `spacetime start`) or provide a reachable maincloud setup.
  // If you see `ENOTFOUND maincloud.spacetimedb.com`, your environment has no network/DNS.

  const remoteFn = `
    let count = store.get("count") || 0  ;
    count += arg.dif;
    store.set("count", count);
    return count;
  `;


	  await publishView(
	    `
	      const remoteFn = ${tojson(remoteFn)};
        let req = dif => remote(remoteFn, {dif})

	      return (upper) => {
	        let label = HTML.p("count: loading...");
	        let btn = HTML.button("increment");
	        const root = HTML.div(
	          HTML.h3("Store View"),
	          label, btn
	        );
          let update = dif => req(dif).then(c=>{
            label.textContent = "count: " + c;
            upper.update(root)
          })
          update(1);
	        btn.onEvent = (e) => {
	          if (e.type !== "click") return;
	          update(1);
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
