// ts-note: notes/#12ec8c832bed0b1129693e2f496232f4.ts
// js-note: notes/#7ac52d5f362338e210b7f72ff49b5587.js
import { graphView } from "./graphView.ts";
import { graph } from "./pipeline.ts";
import { showJson } from "./viewJson.ts";

export const view: View = (ctx) => {


  let inp = graph("input")
  let lgc = graph("logic", [inp])
  let sz = ctx.width * .8;

  return HTML.div(
    { style: { padding: "1em", fontFamily: "monospace" } },
    HTML.h3("svg line"),
    graphView(lgc, sz,sz),
    showJson(graph("input"))
  );
};
