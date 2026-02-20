// ts-note: notes/#a0561327ae6c20d7ee7b8c79efeb2312.ts
// js-note: notes/#30013f0e9df99076e36be7d98dc5e0e7.js

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

export type GraphViewOptions = {
  onNodeClick?: (node: Graph) => void
}

export const graphView = (
  graph: Graph,
  w: number,
  h: number,
  ctx: ViewContext,
  options: GraphViewOptions = {},
): VDom => {
  const onNodeClick = options.onNodeClick
  let memo = new Map<Graph, DAG>()
  let todag = (g:Graph):DAG =>{
    if (memo.has(g)) return memo.get(g) as DAG
    let node: DAG = { title: g.$, srcs: [] }
    if (onNodeClick) {
      node.onclick = () => onNodeClick(g)
    }
    memo.set(g, node)
    node.srcs = (g.$ == "input" ? []
      : g.$ == "logic" ? Object.values(g.inputs)
      : [g.input, g.body, g.condition]).map(todag)
    return node
  }

  return HTML.div(drawGraph(todag(graph), w, h, ctx))
}
