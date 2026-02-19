// ts-note: notes/#1f89f7fbe07dee473b87894386bdf450.ts
// js-note: notes/#99724258a65d2b108ad70e4c92f19e5b.js

import { Graph } from "./pipeline"

export const graphView = (graph: Graph, w:number, h:number):VDom => {

  return HTML.div(
    HTML.svgPath(
      "M10 10 L90 90",
      {},
      HTML.svgText("HELLO", { x: "50", y: "50", textAnchor: "middle" }),
    )
  )

}

