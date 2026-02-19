// ts-note: notes/#e93078060de5de6d6ab1cbab2a3ca86e.ts
// js-note: notes/#8076715787fc7e758408eb4268d63666.js

// import { Graph } from "./pipeline"


type Graph = {
  $: "input",
} | {
  $: "logic",
  inputs: {[key: string]: Graph},
  code: string
} | {
  $: "loop",
  input: Graph,
  condition: Graph,
  body: Graph,
}

import { drawGraph } from "./drawGraph"
import type { DAG } from "./drawGraph"

export const graphView = (graph: Graph, w: number, h: number, ctx: ViewContext): VDom => {
  let memo = new Map<Graph, DAG>()
  let todag = (g:Graph):DAG =>{
    if (memo.has(g)) return memo.get(g) as DAG
    let node: DAG = { title: g.$, srcs: [] }
    memo.set(g, node)
    node.srcs = (g.$ == "input" ? []
      : g.$ == "logic" ? Object.values(g.inputs)
      : [g.input, g.body, g.condition]).map(todag)
    return node
  }

  return HTML.div(drawGraph(todag(graph), w, h, ctx))
}

