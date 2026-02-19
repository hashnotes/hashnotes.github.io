// ts-note: notes/#a2c8132ece0c491685d919a9f2b5ed5d.ts
// js-note: notes/#7e10f76c85d14f94d816c15144006a1f.js
import { graphView } from "./graphView.ts";
import { Graph } from "./pipeline.ts";

export const view: View = (ctx) => {

  let w = ctx.width * 0.9
  let h = ctx.height * 0.7

  let inp :Graph = {
    $:"input",
  }

  let logic = (inputs: {[key:string]:Graph}, code:string):Graph=>({$:"logic", inputs, code})

  let loop:Graph = {
    $:"loop",
    input: inp,
    condition: logic({"x":inp}, "x.length > 10"),
    body: logic({x:inp}, "x += 'A'"),
  }


  return HTML.div(
    { style: { padding: "1em", fontFamily: "monospace" } },
    HTML.h3("pipeline"),
    graphView(loop, w, h, ctx),
  );

};
