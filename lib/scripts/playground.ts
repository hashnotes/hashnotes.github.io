import { noteBody, note, publishView } from "./note-fn.ts";

const remoteFn = noteBody(function () {
  let c = store.get("count") || 0 as number;
  c += arg.d;
  store.set("count", c);
  return c
});

await publishView(
  note(function () {
    return (upper: UPPER) => {
      let label = HTML.p("count: loading...");
      let inc = (d:number) => remote(remoteFn, {d}).then(c=>{
        label.textContent = "count: " + c
        upper.update(label)
      })

      let root = HTML.div(
        HTML.h3("Store View"),
        label, HTML.button("inc", {onclick:()=>inc(1)})
      );
      inc(0)
      return root;
    };
  }, { remoteFn })
);
