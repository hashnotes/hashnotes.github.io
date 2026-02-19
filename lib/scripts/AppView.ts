// ts-note: notes/#ed80d5d76782e8edf4061c4810b13820.ts
// js-note: notes/#2af507d57cb2cba80821967f2c40bfeb.js
import { graphView } from "./graphView.ts";
import { graph } from "./pipeline.ts";
import { showJson } from "./viewJson.ts";

export const view: View = (ctx) => {
  let sensor = graph("sensor")
  let config = graph("config")
  let parse = graph("parse", [sensor])
  let validate = graph("validate", [parse, config])
  let normalize = graph("normalize", [validate])
  let cache = graph("cache", [normalize])
  let transform = graph("transform", [cache, config])
  let enrich = graph("enrich", [transform])
  let render = graph("render", [enrich,   ])
  let output = graph("output", [render])

  let w = ctx.width * 0.9
  let h = ctx.height * 0.7

  return HTML.div(
    { style: { padding: "1em", fontFamily: "monospace" } },
    HTML.h3("pipeline"),
    graphView(output, w, h, ctx),
  );
};
