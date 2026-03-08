// ts-note: notes/#e32cf5469029da47836cdbbc6442991e.ts
// js-note: notes/#09d425be2270b574af1c34d0477aa575.js

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
  onTraceSavedRef?: (ref: Ref) => void
  emptyTraceView?: () => VDom
  traceRef?: Ref | null
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
  const onTraceSavedRef = options.onTraceSavedRef
  const emptyTraceView = options.emptyTraceView
  const traceRef = options.traceRef ? options.traceRef : null
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
  ): boolean => {
    if (!next) return false
    const changed = !current || Math.abs(next.w - current.w) > 6 || Math.abs(next.h - current.h) > 6
    if (!changed) return false
    set(next)
    return true
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
      return loopPrevSource
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
      const seedTrace = trace.inputs.length > 0 ? trace.inputs[0] : { graph: { $: "input" } as Graph, inputs: [], value: trace.value }
      const seedValueNode = traceDag(seedTrace)
      const loopStart: DAG = {
        title: (trace.graph.title ? trace.graph.title : "loop") + ":start => " + short(seedTrace.value),
        srcs: [seedValueNode],
      }
      loopStart.onclick = () => clickTrace(seedTrace)
      let stateNode: DAG = loopStart
      for (let i = 1; i < trace.inputs.length; i++) {
        const step = trace.inputs[i]
        const stepKey = (step.ref ? step.ref : safeHash({
          graph: step.graph as unknown as Jsonable,
          value: step.value,
          count: step.inputs.length,
        })) as Ref
        const stepExpanded = expandedIterKeys.has(stepKey)
        const condNode: DAG = {
          title: "iter " + i + ":cond => true",
          srcs: [stateNode],
        }
        condNode.onclick = () => {
          selectedSourceKey = sourceKeyOf(trace.graph.condition)
          if (sourceGraphCtl) {
            const srcNode = memoByHash.get(selectedSourceKey)
            sourceGraphCtl.highlight(srcNode ? srcNode : null)
          }
          if (onTraceNodeClick) onTraceNodeClick(trace)
        }
        const bodyTraceNode = traceDag(step, stateNode)
        const nextState: DAG = {
          title: "iter " + i + ":end " + (stepExpanded ? "[-] " : "[+] ") + "=> " + short(step.value),
          srcs: stepExpanded ? [condNode, bodyTraceNode] : [stateNode],
        }
        traceDagByKey.set(stepKey, nextState)
        nextState.onclick = () => {
          clickTrace(step)
          if (expandedIterKeys.has(stepKey)) expandedIterKeys.delete(stepKey)
          else expandedIterKeys.add(stepKey)
          refreshView()
        }
        stateNode = nextState
      }
      const finalTraceSrc = stateNode === loopStart ? seedValueNode : stateNode
      const node: DAG = {
        title: nodeName + ":end (" + iters + ") " + (expanded ? "[-]" : "[+]") + " => " + short(trace.value),
        srcs: [finalTraceSrc],
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
    const gKey = safeHash(g as unknown as Jsonable)
    if (memo.has(g)) return memo.get(g) as DAG
    if (memoByHash.has(gKey)) {
      const hit = memoByHash.get(gKey) as DAG
      memo.set(g, hit)
      return hit
    }
    let node: DAG = { title: g.title ? g.title : g.$, srcs: [] }
    if (onNodeClick) {
      node.onclick = () => onNodeClick(g)
    }
    memo.set(g, node)
    memoByHash.set(gKey, node)
    if (g.$ == "input" || g.$ == "const") {
      node.srcs = []
    } else if (g.$ == "logic") {
      node.srcs = Object.values(g.inputs).map(todag)
    } else if (g.$ == "IfElse") {
      node.srcs = [g.condition, g.then, g.else].map(todag)
    } else if (g.$ == "LLMCall") {
      node.srcs = [g.prompt].map(todag)
    } else if (g.$ == "FunctionCall") {
      node.srcs = [g.function, ...Object.values(g.inputs)].map(todag)
    } else {
      const inputNode = todag(g.input)
      const loopStart: DAG = { title: (g.title ? g.title : "loop") + ":start", srcs: [inputNode] }
      const scopedMemo = new Map<Graph, DAG>()
      const scopedMemoByHash = new Map<Ref, DAG>()
      const inLoop = (sub: Graph): DAG => {
        if (sub.$ == "input") return loopStart
        if (scopedMemo.has(sub)) return scopedMemo.get(sub) as DAG
        const subKey = safeHash(sub as unknown as Jsonable)
        if (scopedMemoByHash.has(subKey)) {
          const hit = scopedMemoByHash.get(subKey) as DAG
          scopedMemo.set(sub, hit)
          return hit
        }
        const d: DAG = { title: sub.title ? sub.title : sub.$, srcs: [] }
        if (onNodeClick) d.onclick = () => onNodeClick(sub)
        scopedMemo.set(sub, d)
        scopedMemoByHash.set(subKey, d)
        memoByHash.set(subKey, d)
        if (sub.$ == "const") d.srcs = []
        else if (sub.$ == "logic") d.srcs = Object.values(sub.inputs).map(inLoop)
        else if (sub.$ == "IfElse") d.srcs = [sub.condition, sub.then, sub.else].map(inLoop)
        else if (sub.$ == "LLMCall") d.srcs = [inLoop(sub.prompt)]
        else if (sub.$ == "FunctionCall") d.srcs = [inLoop(sub.function), ...Object.values(sub.inputs).map(inLoop)]
        else {
          // Nested loop inside body/condition: render normally rather than rebinding its state.
          const nested = todag(sub)
          d.srcs = nested.srcs
          d.title = nested.title
        }
        return d
      }
      const condNode = inLoop(g.condition)
      const bodyNode = inLoop(g.body)
      node.title = (g.title ? g.title : "loop") + ":end"
      node.srcs = [condNode, bodyNode]
    }
    return node
  }

  let status = "idle"
  let lastRef: Ref | null = null
  let lastTrace: GraphTrace | null = null
  let traceLoadRequested = false

  let root: VDom = HTML.div()
  const render = (): VDom => {
    if (traceRef && (!lastRef || lastRef !== traceRef) && !traceLoadRequested) {
      traceLoadRequested = true
      status = "loading trace..."
      Promise.resolve().then(async () => {
        try {
          const trace = await loadTraceByRef(traceRef)
          lastTrace = trace
          lastRef = traceRef
          status = "loaded: " + traceRef
        } catch (err) {
          status = "error: " + err
          Promise.resolve().then(() => {
            throw err
          })
        }
        root.children = render().children
        ctx.update(root)
      })
    }
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
              if (onTraceSavedRef) onTraceSavedRef(ref)
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
          const changed = applyPaneResize(next, sourcePaneSize, (s) => { sourcePaneSize = s })
          if (changed) refreshView()
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
              const changed = applyPaneResize(next, tracePaneSize, (s) => { tracePaneSize = s })
              if (changed) refreshView()
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
              const changed = applyPaneResize(next, tracePaneSize, (s) => { tracePaneSize = s })
              if (changed) refreshView()
            },
          },
          HTML.h4({ style: { margin: "0 0 0.4em 0", opacity: "0.8" } }, "trace"),
          emptyTraceView ? emptyTraceView() : HTML.p({ style: { margin: "0", opacity: "0.7" } }, "Run pipeline to generate trace."),
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
