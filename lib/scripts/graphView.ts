// ts-note: notes/#b42ace5109b2223b4ae60a08c165386e.ts
// js-note: notes/#46c4766b7a143fc931c78f5e245b74a0.js

import { runPipeline } from "./runPipeline"
import { loadTrace } from "./loadTrace"
import type { GraphTrace } from "./loadTrace"


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
import type { DAG, DrawGraphResult } from "./drawGraph"

export type GraphViewOptions = {
  onNodeClick?: (node: Graph) => void
  onTraceNodeClick?: (trace: GraphTrace) => void
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
  const onTraceNodeClick = options.onTraceNodeClick
  const runInput = options.runInput ?? "seed"
  const paneW = Math.max(200, Math.floor((w - 16) / 2))
  let memo = new Map<Graph, DAG>()
  let memoByHash = new Map<Ref, DAG>()
  let sourceGraphCtl: DrawGraphResult | null = null

  const formatValue = (x: Jsonable): string => {
    if (typeof x === "string") return x
    if (typeof x === "number" || typeof x === "boolean" || x === null) return "" + x
    return JSON.stringify(x)
  }

  const short = (x: Jsonable, n = 20): string => {
    const s = formatValue(x)
    return s.length <= n ? s : s.slice(0, n - 1) + "…"
  }

  const traceDag = (trace: GraphTrace): DAG => {
    if (trace.graph.$ === "loop") {
      const iters = Math.max(0, trace.inputs.length - 1)
      const hasStart = trace.inputs.length > 0
      const startTrace = hasStart ? trace.inputs[0] : null
      const start = startTrace ? startTrace.value : null
      const clickTrace = (t: GraphTrace) => {
        if (sourceGraphCtl) {
          const srcNode = memoByHash.get(hashData(t.graph as unknown as Jsonable))
          sourceGraphCtl.highlight(srcNode ? srcNode : null)
        }
        if (onTraceNodeClick) onTraceNodeClick(t)
      }
      const node: DAG = {
        title: "loop (" + iters + ") => " + short(trace.value),
        srcs: [
          hasStart && startTrace
            ? { title: "start => " + short(start), srcs: [], onclick: () => clickTrace(startTrace) }
            : { title: "start", srcs: [] },
        ],
      }
      node.onclick = () => clickTrace(trace)
      return node
    }
    const node: DAG = {
      title: trace.graph.$ + " => " + short(trace.value),
      srcs: trace.inputs.map(traceDag),
    }
    node.onclick = () => {
      if (sourceGraphCtl) {
        const srcNode = memoByHash.get(hashData(trace.graph as unknown as Jsonable))
        sourceGraphCtl.highlight(srcNode ? srcNode : null)
      }
      if (onTraceNodeClick) onTraceNodeClick(trace)
    }
    return node
  }

  let todag = (g:Graph):DAG =>{
    if (memo.has(g)) return memo.get(g) as DAG
    let node: DAG = { title: g.$, srcs: [] }
    if (onNodeClick) {
      node.onclick = () => onNodeClick(g)
    }
    memo.set(g, node)
    memoByHash.set(hashData(g as unknown as Jsonable), node)
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
              const ref = await runPipeline(graph, runInput)
              const trace = await loadTrace(ref)
              lastTrace = trace
              lastRef = ref
              status = "saved: " + ref
            } catch (err) {
              status = "error: " + err
              // Bubble to app-level global handlers for centralized browser error routing.
              Promise.resolve().then(() => {
                throw err
              })
            }
            root.children = render().children
            ctx.update(root)
          }
        },
        "Run pipeline",
      ),
      HTML.span({ style: { opacity: "0.8" } }, status),
    )

    const sourcePane = HTML.div(
      {
        style: {
          minWidth: "0",
          border: "1px solid var(--color)",
          background: "var(--background)",
          padding: "0.6em",
          overflowX: "auto",
        }
      },
      HTML.h4({ style: { margin: "0 0 0.4em 0" } }, "pipeline"),
      (() => {
        sourceGraphCtl = drawGraph(todag(graph), paneW, h, ctx)
        return sourceGraphCtl.view
      })(),
    )

    const tracePane = lastTrace
      ? HTML.div(
          {
            style: {
              minWidth: "0",
              border: "1px solid var(--color)",
              background: "var(--background)",
              padding: "0.6em",
              overflowX: "auto",
            }
          },
          HTML.h4({ style: { margin: "0 0 0.4em 0" } }, "trace"),
          lastRef ? HTML.p({ style: { margin: "0 0 0.4em 0", opacity: "0.8" } }, "note: " + lastRef) : HTML.div(),
          drawGraph(
            traceDag(lastTrace),
            paneW,
            h,
            ctx,
          ).view,
        )
      : HTML.div(
          {
            style: {
              minWidth: "0",
              border: "1px dashed var(--color)",
              background: "var(--background)",
              padding: "0.6em",
            }
          },
          HTML.h4({ style: { margin: "0 0 0.4em 0", opacity: "0.8" } }, "trace"),
          HTML.p({ style: { margin: "0", opacity: "0.7" } }, "Run pipeline to generate trace."),
        )

    return HTML.div(
      controls,
      HTML.div(
        { style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "0.75em", alignItems: "start" } },
        sourcePane,
        tracePane,
      ),
    )
  }

  root = render()
  return root
}
