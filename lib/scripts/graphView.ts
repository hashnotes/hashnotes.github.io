// ts-note: notes/#aef17143e395caec15c413dad11d7995.ts
// js-note: notes/#c8a836abd92e6d530c79dca5a973aa60.js

import { runPipeline } from "./runPipeline"
import type { GraphTrace } from "./runPipeline"
import type { Graph } from "./pipeline"

import { drawGraph } from "./drawGraph"
import type { DAG, DrawGraphResult } from "./drawGraph"

export type GraphViewApi = {
  focusGraph: (node: Graph) => void
  highlightGraph: (node: Graph | null) => void
  focusTrace: (trace: GraphTrace) => void
}

export type GraphViewOptions = {
  onNodeClick?: (node: Graph) => void
  onTraceNodeClick?: (trace: GraphTrace) => void
  runInput?: Jsonable
  onReady?: (api: GraphViewApi) => void
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
  const runInput = options.runInput == null ? "seed" : options.runInput
  const onReady = options.onReady
  const paneW = Math.max(200, Math.floor((w - 16) / 2))
  let memo = new Map<Graph, DAG>()
  let memoByHash = new Map<Ref, DAG>()
  let sourceGraphCtl: DrawGraphResult | null = null
  let traceGraphCtl: DrawGraphResult | null = null
  let sourceVp: { panX: number, panY: number, vpW: number, vpH: number } | null = null
  let traceVp: { panX: number, panY: number, vpW: number, vpH: number } | null = null
  let sourcePaneSize: { w: number, h: number } | null = { w: paneW, h }
  let tracePaneSize: { w: number, h: number } | null = { w: paneW, h }
  let sourceResizeArmed = false
  let traceResizeArmed = false
  let expandedLoopKeys = new Set<string>()
  let expandedIterKeys = new Set<string>()
  let traceDagByKey = new Map<Ref, DAG>()
  let selectedTraceKey: Ref | null = null
  let selectedSourceKey: Ref | null = null
  let refreshView: () => void = () => {}

  const stripUndefined = (x: unknown): Jsonable => {
    if (x === null || typeof x === "string" || typeof x === "number" || typeof x === "boolean") {
      return x as Jsonable
    }
    if (Array.isArray(x)) return x.map(stripUndefined) as Jsonable
    if (x && typeof x === "object") {
      const out: { [key: string]: Jsonable } = {}
      Object.entries(x as Record<string, unknown>).forEach(([k, v]) => {
        if (typeof v !== "undefined") out[k] = stripUndefined(v)
      })
      return out
    }
    return null
  }

  const safeHash = (x: unknown): Ref => hashData(stripUndefined(x))

  const traceKeyOf = (trace: GraphTrace): Ref =>
    (trace.ref ? trace.ref : safeHash({
      graph: trace.graph as unknown as Jsonable,
      value: trace.value,
      count: trace.inputs.length,
    })) as Ref

  const sourceKeyOf = (g: Graph): Ref =>
    safeHash(g as unknown as Jsonable)

  const formatValue = (x: Jsonable): string => {
    if (typeof x === "string") return x
    if (typeof x === "number" || typeof x === "boolean" || x === null) return "" + x
    return JSON.stringify(x)
  }

  const short = (x: Jsonable, n = 20): string => {
    const s = formatValue(x)
    return s.length <= n ? s : s.slice(0, n - 1) + "…"
  }

  const captureSize = (target: Element | null): { w: number, h: number } | null => {
    if (!target) return null
    const rect = (target as unknown as { getBoundingClientRect?: () => { width: number, height: number } }).getBoundingClientRect
      ? (target as unknown as { getBoundingClientRect: () => { width: number, height: number } }).getBoundingClientRect()
      : null
    const w = rect ? Math.round(rect.width) : 0
    const h = rect ? Math.round(rect.height) : 0
    if (w < 1 || h < 1) return null
    return { w, h }
  }

  const applyPaneResize = (
    next: { w: number, h: number } | null,
    current: { w: number, h: number } | null,
    set: (s: { w: number, h: number }) => void,
  ) => {
    if (!next) return
    const changed = !current || Math.abs(next.w - current.w) > 6 || Math.abs(next.h - current.h) > 6
    if (!changed) return
    set(next)
  }

  const armResize = (e: any): boolean => {
    const t = e && e.currentTarget
    if (!t || !t.getBoundingClientRect || e == null || e.clientX == null || e.clientY == null) return false
    const r = t.getBoundingClientRect()
    const edge = 18
    return (r.right - e.clientX) <= edge && (r.bottom - e.clientY) <= edge
  }

  const paneStyle = (
    bordered: string,
    size: { w: number, h: number } | null,
  ): Record<string, string> => {
    const base: Record<string, string> = {
      minWidth: "0",
      border: bordered,
      background: "var(--background)",
      padding: "0.6em",
      overflow: "auto",
      resize: "both",
      minHeight: "220px",
    }
    if (!size) {
      base.flex = "1 1 0"
      return base
    }
    base.flex = "0 0 auto"
    base.width = "" + size.w + "px"
    base.height = "" + size.h + "px"
    return base
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

  const traceDag = (trace: GraphTrace, loopPrevSource: DAG | null = null): DAG => {
    const traceKey = (trace.ref ? trace.ref : safeHash({
      graph: trace.graph as unknown as Jsonable,
      value: trace.value,
      count: trace.inputs.length,
    })) as Ref
    const nodeName = trace.graph.title ? trace.graph.title : trace.graph.$
    if (trace.graph.$ === "input" && loopPrevSource) {
      const node: DAG = {
        title: nodeName + " <= prev",
        srcs: [loopPrevSource],
      }
      traceDagByKey.set(traceKey, node)
      node.onclick = () => {
        if (sourceGraphCtl) {
          const srcNode = memoByHash.get(safeHash(trace.graph as unknown as Jsonable))
          sourceGraphCtl.highlight(srcNode ? srcNode : null)
        }
        if (onTraceNodeClick) onTraceNodeClick(trace)
      }
      return node
    }
    if (trace.graph.$ === "loop") {
      const iters = Math.max(0, trace.inputs.length - 1)
      const loopKey = traceKey
      const expanded = expandedLoopKeys.has(loopKey)
      const clickTrace = (t: GraphTrace) => {
        selectedTraceKey = traceKeyOf(t)
        selectedSourceKey = sourceKeyOf(t.graph)
        if (sourceGraphCtl) {
          const srcNode = memoByHash.get(selectedSourceKey)
          sourceGraphCtl.highlight(srcNode ? srcNode : null)
        }
        if (onTraceNodeClick) onTraceNodeClick(t)
      }
      const toggleExpanded = () => {
        if (expandedLoopKeys.has(loopKey)) expandedLoopKeys.delete(loopKey)
        else expandedLoopKeys.add(loopKey)
        refreshView()
      }
      const iterNodes: DAG[] = []
      let prev: DAG | null = null
      trace.inputs.forEach((step, i) => {
        const stepKey = (step.ref ? step.ref : safeHash({
          graph: step.graph as unknown as Jsonable,
          value: step.value,
          count: step.inputs.length,
        })) as Ref
        const stepExpanded = expandedIterKeys.has(stepKey)
        const stepDetail = traceDag(step, prev)
        const stepNode: DAG = {
          title: (i === 0 ? "start" : "iter " + i) + (stepExpanded ? " [-] " : " [+] ") + "=> " + short(step.value),
          srcs: prev ? [prev] : []
        }
        if (stepExpanded) {
          stepNode.srcs = prev ? [prev, stepDetail] : [stepDetail]
        }
        // For loop iterations, keep selection/focus on the outer step node.
        traceDagByKey.set(stepKey, stepNode)
        stepNode.onclick = () => {
          clickTrace(step)
          if (expandedIterKeys.has(stepKey)) expandedIterKeys.delete(stepKey)
          else expandedIterKeys.add(stepKey)
          refreshView()
        }
        iterNodes.push(stepNode)
        prev = stepNode
      })
      const node: DAG = {
        title: nodeName + " (" + iters + ") " + (expanded ? "[-]" : "[+]") + " => " + short(trace.value),
        srcs: expanded && iterNodes.length > 0 ? [iterNodes[iterNodes.length - 1]] : [],
      }
      traceDagByKey.set(traceKey, node)
      node.onclick = () => {
        clickTrace(trace)
        toggleExpanded()
      }
      return node
    }
    const node: DAG = {
      title: nodeName + " => " + short(trace.value),
      srcs: trace.inputs.map((x) => traceDag(x, loopPrevSource)),
    }
    traceDagByKey.set(traceKey, node)
    node.onclick = () => {
      selectedTraceKey = traceKey
      selectedSourceKey = sourceKeyOf(trace.graph)
      if (sourceGraphCtl) {
        const srcNode = memoByHash.get(selectedSourceKey)
        sourceGraphCtl.highlight(srcNode ? srcNode : null)
      }
      if (onTraceNodeClick) onTraceNodeClick(trace)
    }
    return node
  }

  let todag = (g:Graph):DAG =>{
    if (memo.has(g)) return memo.get(g) as DAG
    let node: DAG = { title: g.title ? g.title : g.$, srcs: [] }
    if (onNodeClick) {
      node.onclick = () => onNodeClick(g)
    }
    memo.set(g, node)
    memoByHash.set(safeHash(g as unknown as Jsonable), node)
    node.srcs = (g.$ == "input" ? []
      : g.$ == "const" ? []
      : g.$ == "logic" ? Object.values(g.inputs)
      : g.$ == "IfElse" ? [g.condition, g.then, g.else]
      : g.$ == "LLMCall" ? [g.prompt]
      : g.$ == "FunctionCall" ? [g.function, ...Object.values(g.inputs)]
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
        style: paneStyle("1px solid var(--color)", sourcePaneSize),
        onmousedown: (e: any) => {
          sourceResizeArmed = armResize(e)
        },
        onmouseup: (e: any) => {
          if (!sourceResizeArmed) return
          sourceResizeArmed = false
          const next = captureSize(e.currentTarget || null)
          applyPaneResize(next, sourcePaneSize, (s) => { sourcePaneSize = s })
        },
      },
      HTML.h4({ style: { margin: "0 0 0.4em 0" } }, "pipeline"),
      (() => {
        const drawW = sourcePaneSize ? Math.max(200, sourcePaneSize.w - 20) : paneW
        const drawH = sourcePaneSize ? Math.max(180, sourcePaneSize.h - 48) : h
        sourceGraphCtl = drawGraph(todag(graph), drawW, drawH, ctx, sourceVp || null)
        return sourceGraphCtl.view
      })(),
    )

    const tracePane = lastTrace
      ? HTML.div(
          {
            style: paneStyle("1px solid var(--color)", tracePaneSize),
            onmousedown: (e: any) => {
              traceResizeArmed = armResize(e)
            },
            onmouseup: (e: any) => {
              if (!traceResizeArmed) return
              traceResizeArmed = false
              const next = captureSize(e.currentTarget || null)
              applyPaneResize(next, tracePaneSize, (s) => { tracePaneSize = s })
            },
          },
          HTML.h4({ style: { margin: "0 0 0.4em 0" } }, "trace"),
          lastRef ? HTML.p({ style: { margin: "0 0 0.4em 0", opacity: "0.8" } }, "note: " + lastRef) : HTML.div(),
          (() => {
            traceDagByKey = new Map<Ref, DAG>()
            const drawW = tracePaneSize ? Math.max(200, tracePaneSize.w - 20) : paneW
            const drawH = tracePaneSize ? Math.max(180, tracePaneSize.h - 48) : h
            traceGraphCtl = drawGraph(
            traceDag(lastTrace),
            drawW,
            drawH,
            ctx,
            traceVp || null,
            )
            return traceGraphCtl.view
          })(),
        )
      : HTML.div(
          {
            style: paneStyle("1px dashed var(--color)", tracePaneSize),
            onmousedown: (e: any) => {
              traceResizeArmed = armResize(e)
            },
            onmouseup: (e: any) => {
              if (!traceResizeArmed) return
              traceResizeArmed = false
              const next = captureSize(e.currentTarget || null)
              applyPaneResize(next, tracePaneSize, (s) => { tracePaneSize = s })
            },
          },
          HTML.h4({ style: { margin: "0 0 0.4em 0", opacity: "0.8" } }, "trace"),
          HTML.p({ style: { margin: "0", opacity: "0.7" } }, "Run pipeline to generate trace."),
        )

    return HTML.div(
      controls,
      HTML.div(
        { style: { display: "flex", gap: "0.75em", alignItems: "flex-start", width: "100%", overflowX: "auto" } },
        sourcePane,
        tracePane,
      ),
    )
  }

  refreshView = () => {
    if (sourceGraphCtl) sourceVp = sourceGraphCtl.getViewport()
    if (traceGraphCtl) traceVp = traceGraphCtl.getViewport()
    root.children = render().children
    ctx.update(root)
    if (sourceGraphCtl && selectedSourceKey) {
      const sourceNode = memoByHash.get(selectedSourceKey)
      sourceGraphCtl.highlight(sourceNode ? sourceNode : null)
    }
    if (traceGraphCtl && selectedTraceKey) {
      const traceNode = traceDagByKey.get(selectedTraceKey)
      if (traceNode) traceGraphCtl.highlight(traceNode)
    }
  }

  const focusGraph = (node: Graph) => {
    if (!sourceGraphCtl) return
    selectedSourceKey = sourceKeyOf(node)
    const dagNode = memoByHash.get(selectedSourceKey)
    if (!dagNode) return
    sourceGraphCtl.focus(dagNode)
  }

  const highlightGraph = (node: Graph | null) => {
    if (!sourceGraphCtl) return
    if (!node) {
      sourceGraphCtl.highlight(null)
      return
    }
    const dagNode = memoByHash.get(sourceKeyOf(node))
    sourceGraphCtl.highlight(dagNode ? dagNode : null)
  }

  const focusTrace = (trace: GraphTrace) => {
    if (!traceGraphCtl) return
    selectedTraceKey = traceKeyOf(trace)
    selectedSourceKey = sourceKeyOf(trace.graph)
    const dagNode = traceDagByKey.get(selectedTraceKey)
    if (!dagNode) return
    traceGraphCtl.focus(dagNode)
  }

  if (onReady) onReady({ focusGraph, highlightGraph, focusTrace })

  root = render()
  return root
}
