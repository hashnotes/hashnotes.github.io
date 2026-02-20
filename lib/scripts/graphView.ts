// ts-note: notes/#c647276b986143b5733003f90b7e3534.ts
// js-note: notes/#b2adb31563654ebaddefb7264d15b8e7.js

import { runPipeline } from "./runPipeline"
import type { GraphTrace } from "./runPipeline"
import type { Graph } from "./pipeline"

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

  type StoredGraphTrace = {
    graph: Graph
    inputs: Ref[]
    value: Jsonable
  }

  const storeTrace = async (trace: GraphTrace): Promise<Ref> => {
    const inputRefs = await Promise.all(trace.inputs.map(storeTrace))
    const rec: StoredGraphTrace = {
      graph: trace.graph,
      inputs: inputRefs,
      value: trace.value,
    }
    return await addNote(rec as unknown as Jsonable)
  }

  const asStoredTrace = (x: Jsonable): StoredGraphTrace => {
    if (!x || typeof x !== "object" || Array.isArray(x)) {
      return { graph: { $: "input" }, inputs: [], value: null }
    }
    const rec = x as Record<string, Jsonable>
    const g = (rec.graph as Graph) || ({ $: "input" } as Graph)
    const ins = rec.inputs
    if (!Array.isArray(ins)) return { graph: g, inputs: [], value: rec.value }
    return { graph: g, inputs: ins as Ref[], value: rec.value }
  }

  const loadTraceByRef = async (rootRef: Ref): Promise<GraphTrace> => {
    const cache = new Map<Ref, GraphTrace>()
    const go = async (ref: Ref): Promise<GraphTrace> => {
      if (cache.has(ref)) return cache.get(ref) as GraphTrace
      const raw = await getNote(ref)
      const n = asStoredTrace(raw)
      const out: GraphTrace = { ref, graph: n.graph, inputs: [], value: n.value }
      cache.set(ref, out)
      out.inputs = await Promise.all(n.inputs.map(go))
      return out
    }
    return await go(rootRef)
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
      : g.$ == "LLMCall" ? [g.prompt]
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
              const traceRaw = await runPipeline(graph, runInput)
              const ref = await storeTrace(traceRaw)
              const trace = await loadTraceByRef(ref)
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
