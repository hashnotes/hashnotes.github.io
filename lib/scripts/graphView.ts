// ts-note: notes/#4c9991d69e37ed8c1c97746260af75ef.ts
// js-note: notes/#b9b052017a498da67413148d82a56407.js

import { Graph } from "./pipeline"
import { drawGraph } from "./drawGraph"
import type { DAG } from "./drawGraph"

export const graphView = (graph: Graph, w: number, h: number, ctx: ViewContext): VDom => {
  let todag = (g:Graph):DAG =>{
    return {
      title: g.$,
      srcs:g.srcs.map(todag)
    }
  }

  return HTML.div(drawGraph(todag(graph), w, h, ctx))
}

