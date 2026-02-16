import { noteBody, note, publishView } from "./note-fn.ts";

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
        HTML.h3("Store View 2"),
        label,
        HTML.button("increment", {
          onclick: (e: DomEvent) => {
            if (e.type !== "click") return;
            update(1);
          }
        })
      );
      update(1);
      return root;
    };
  }, { remoteFn })
);
