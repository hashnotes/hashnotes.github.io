// ts-note: notes/#18cf488f3d37b3cc265ad530cbf2e997.ts
// js-note: notes/#29600093b47b9b27689f50625d38439a.js

// import { Graph } from "./pipeline"
import { runPipeline, GraphTrace } from "./runPipeline"


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
  runInput?: Jsonable
}

export const graphView = (
  graph: Graph,
  w: number,
  h: number,
  ctx: ViewContext,
  options: GraphViewOptions = {},
): VDom => {
  const onNodeClick = options.onNodeClick
  const runInput = options.runInput ?? "seed"

  const formatValue = (x: Jsonable): string => {
    if (typeof x === "string") return x
    if (typeof x === "number" || typeof x === "boolean" || x === null) return "" + x
    return JSON.stringify(x)
  }

  const traceDag = (trace: GraphTrace): DAG => ({
    title: trace.graph.$ + " => " + formatValue(trace.value).slice(0, 26),
    srcs: trace.inputs.map(traceDag),
  })

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

  let status = "idle"
  let lastRef: Ref | null = null
  let lastTrace: GraphTrace | null = null

  let root: VDom = HTML.div()
  const render = (): VDom => {
    const controls = HTML.div(
      { style: { display: "flex", gap: "0.5em", alignItems: "center", marginBottom: "0.5em" } },
      HTML.button(
        {
          onclick: async () => {
            status = "running..."
            root.children = render().children
            ctx.update(root)
            try {
              const trace = runPipeline(graph, runInput)
              const ref = await addNote(trace as unknown as Jsonable)
              lastTrace = trace
              lastRef = ref
              status = "saved: " + ref
            } catch (err) {
              status = "error: " + String(err)
            }
            root.children = render().children
            ctx.update(root)
          }
        },
        "Run pipeline",
      ),
      HTML.span({ style: { opacity: "0.8" } }, status),
    )

    const result = lastTrace
      ? HTML.div(
          { style: { marginTop: "0.75em" } },
          HTML.h4({ style: { margin: "0 0 0.4em 0" } }, "run result graph"),
          lastRef ? HTML.p({ style: { margin: "0 0 0.4em 0", opacity: "0.8" } }, "note: " + lastRef) : HTML.div(),
          drawGraph(traceDag(lastTrace), w, h, ctx),
        )
      : HTML.div()

    return HTML.div(
      controls,
      drawGraph(todag(graph), w, h, ctx),
      result,
    )
  }

  root = render()
  return root
}
