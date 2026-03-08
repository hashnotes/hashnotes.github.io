// ts-note: notes/#e9462d1305e44b16f4add38fead0ee21.ts
// js-note: notes/#8cb3d064caabd19173a0959388fe672a.js

import { mkExamplePipeline } from "./export_pipeline.ts";
import { graphView } from "./graphView.ts";
import type { GraphViewApi } from "./graphView.ts";
import { type Graph } from "./pipeline.ts";
import { makePipelineStore } from "./pipelineStorage.ts";
import type { GraphTrace } from "./runPipeline.ts";

export const view: View = (ctx) => {
  const previewPaneW = 360
  const graphAreaW = Math.max(420, ctx.width - previewPaneW - 64)
  const graphAreaH = Math.max(280, Math.floor(ctx.height * 0.66))
  const pipelineStore = makePipelineStore()
  const parsePipelineRefFromPath = (pathname: string): Ref | null => {
    const seg = (pathname || "/").replace(/^\/+/, "").split("/")[0]
    if (!seg) return null
    if (/^[a-f0-9]{32}$/i.test(seg)) return ("#" + seg) as Ref
    if (/^#[a-f0-9]{32}$/i.test(seg)) return seg as Ref
    return null
  }
  const initialRoutePipelineRef = parsePipelineRefFromPath(ctx.location.pathname)

  let graph = mkExamplePipeline()

  let selectedPipelineRef: Ref | null = initialRoutePipelineRef
  let selectedTraceListRef: Ref | null = null
  let routeGraphLoaded = initialRoutePipelineRef == null
  let routeGraphLoadError = ""
  let routeGraphLoadRequested = false
  let ensureCurrentPipelineQueued = false
  let appRoot: VDom | null = null
  let refreshApp: () => void = () => {}

  let selected: Graph | null = null
  let selectedTrace: GraphTrace | null = null
  let graphApi: GraphViewApi | null = null
  let updatePreview: () => void = () => {}
  let commentNodeKey = ""
  let commentDraft = ""
  let commentStatus = ""
  const fallbackGraphTitle = graph.title ? graph.title : "graph"
  const stripUndefined = (x: Jsonable): Jsonable => {
    if (x == null) return x
    if (typeof x !== "object") return x
    if (Array.isArray(x)) return x.map(stripUndefined)
    const out: { [k: string]: Jsonable } = {}
    Object.entries(x).forEach(([k, v]) => {
      if (typeof v === "undefined") return
      out[k] = stripUndefined(v as Jsonable)
    })
    return out
  }
  const graphCommentNodeKey = (node: Graph): string =>
    "graph:" + hashData(stripUndefined(node as unknown as Jsonable))
  const traceCommentNodeKey = (node: GraphTrace): string => {
    if (node.ref) return "trace:" + node.ref
    return "trace:" + hashData(stripUndefined({
      graph: node.graph as unknown as Jsonable,
      value: node.value,
      inputs: node.inputs.length,
    } as unknown as Jsonable))
  }
  const syncCommentDraft = () => {
    const nextKey = selectedTrace ? traceCommentNodeKey(selectedTrace) : selected ? graphCommentNodeKey(selected) : ""
    if (nextKey === commentNodeKey) return
    commentNodeKey = nextKey
    commentDraft = nextKey ? pipelineStore.getComment(nextKey) : ""
    commentStatus = ""
  }
  const commentEditor = (): VDom => {
    if (!commentNodeKey) return HTML.div()
    return HTML.div(
      { style: { marginTop: "0.75em", borderTop: "1px solid var(--color)", paddingTop: "0.75em" } },
      HTML.p({ style: { margin: "0 0 0.4em 0", fontWeight: "700" } }, "comment"),
      HTML.textarea(
        {
          value: commentDraft,
          style: {
            width: "100%",
            minHeight: "6em",
            boxSizing: "border-box",
            background: "var(--background)",
            color: "var(--color)",
            border: "1px solid var(--color)",
            fontFamily: "monospace",
            resize: "vertical",
          },
          attrs: { title: "Comment for this node" },
          onkeyup: (e:any) => {
            commentDraft = typeof e.target.value === "string" ? e.target.value : commentDraft
            commentStatus = ""
          },
          onkeydown: (e:any) => {
            commentDraft = typeof e.target.value === "string" ? e.target.value : commentDraft
          },
        }
      ),
      HTML.div(
        { style: { marginTop: "0.5em", display: "flex", gap: "0.5em", alignItems: "center" } },
        HTML.button(
          {
            onclick: () => {
              if (!commentNodeKey) return
              pipelineStore.setComment(commentNodeKey, commentDraft)
              commentStatus = "saved"
              updatePreview()
            }
          },
          "Save comment"
        ),
        commentStatus ? HTML.span({ style: { opacity: "0.8" } }, commentStatus) : HTML.span()
      ),
    )
  }
  const restoreGraphHighlight = () => {
    if (!graphApi) return
    if (selectedTrace) graphApi.highlightGraph(selectedTrace.graph)
    else if (selected) graphApi.highlightGraph(selected)
    else graphApi.highlightGraph(null)
  }

  const previewFor = (node: Graph): string =>
    node.$ === "input" ? [
      "type: input",
      ...(node.title ? ["title: " + node.title] : []),
    ].join("\n")
      : node.$ === "const" ? [
        "type: const",
        ...(node.title ? ["title: " + node.title] : []),
        "value: " + (typeof node.value === "string" ? node.value : JSON.stringify(node.value)),
      ].join("\n")
      : node.$ === "logic" ? [
        "type: logic",
        ...(node.title ? ["title: " + node.title] : []),
        "inputs: " + Object.keys(node.inputs).join(", "),
        "",
        "code:",
        node.code,
      ].join("\n")
      : node.$ === "IfElse" ? [
        "type: IfElse",
        ...(node.title ? ["title: " + node.title] : []),
        "fields: condition, then, else",
      ].join("\n")
      : node.$ === "LLMCall" ? [
        "type: LLMCall",
        ...(node.title ? ["title: " + node.title] : []),
        "model: " + node.model,
      ].join("\n")
      : node.$ === "FunctionCall" ? [
        "type: FunctionCall",
        ...(node.title ? ["title: " + node.title] : []),
        "inputs: fn, " + Object.keys(node.inputs).join(", "),
      ].join("\n")
        : [
          "type: loop",
          ...(node.title ? ["title: " + node.title] : []),
          "fields: input, condition, body",
        ].join("\n")

  const traceInputEntries = ({graph, inputs}: GraphTrace): { label: string, node: GraphTrace }[] => {
    if (graph.$ === "loop") {
      return inputs.map((step, i) => ({ label: i === 0 ? "start" : "iter " + i, node: step }))
    }
    if (graph.$ === "LLMCall") {
      return inputs.map((step, i) => ({ label: i === 0 ? "prompt" : "input " + i, node: step }))
    }
    if (graph.$ === "logic") {
      return inputs.map((step, i) => {
        const k = Object.keys(graph.inputs)[i]
        return { label: k ? k : "input " + (i + 1), node: step }
      })
    }
    if (graph.$ === "IfElse") {
      return inputs.map((step, i) => ({ label: i === 0 ? "condition" : "branch", node: step }))
    }
    if (graph.$ === "FunctionCall") {
      const keys = Object.keys(graph.inputs)
      return inputs.map((step, i) => {
        if (i === 0) return { label: "fn", node: step }
        const k = keys[i - 1]
        return { label: k ? k : "arg " + i, node: step }
      })
    }
    return []
  }

  const graphInputEntries = (g: Graph): { label: string, node: Graph }[] => {
    if (g.$ === "logic") {
      return Object.entries(g.inputs).map(([label, node]) => ({ label, node }))
    }
    if (g.$ === "LLMCall") {
      return [{ label: "prompt", node: g.prompt }]
    }
    if (g.$ === "loop") {
      return [
        { label: "input", node: g.input },
        { label: "condition", node: g.condition },
        { label: "body", node: g.body },
      ]
    }
    if (g.$ === "IfElse") {
      return [
        { label: "condition", node: g.condition },
        { label: "then", node: g.then },
        { label: "else", node: g.else },
      ]
    }
    if (g.$ === "FunctionCall") {
      return [
        { label: "fn", node: g.function },
        ...Object.entries(g.inputs).map(([label, node]) => ({ label, node })),
      ]
    }
    return []
  }

  const buildPreview = (): VDom => {
    syncCommentDraft()
    if (!selected && !selectedTrace) {
      return HTML.div(
        HTML.p({ style: { opacity: "0.7", margin: "0" } }, "Click a node to preview its content."),
      )
    }
    if (selectedTrace) {
      const val = (x: Jsonable): string => (typeof x === "string" ? x : JSON.stringify(x))
      const inputs = traceInputEntries(selectedTrace)
      const nodeHeader = selectedTrace.graph.$ + ": " + (selectedTrace.graph.title ? selectedTrace.graph.title : fallbackGraphTitle)
      const jump = (node: GraphTrace) => {
        selectedTrace = node
        selected = null
        if (graphApi) {
          graphApi.focusTrace(node)
          graphApi.focusGraph(node.graph)
        }
        updatePreview()
      }
      return HTML.div(
        HTML.p({ style: { margin: "0 0 0.5em 0", fontWeight: "700" } }, nodeHeader),
        HTML.div(
          {
            style: {
              margin: "0",
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              overflowY: "auto",
              maxHeight: "28em",
              background: "var(--background)",
              border: "1px solid var(--color)",
              padding: "0.75em",
            }
          },
          HTML.p({ style: { margin: "0" } }, "type: " + selectedTrace.graph.$),
          selectedTrace.graph.$ === "LLMCall"
            ? HTML.p({ style: { margin: "0" } }, "model: " + selectedTrace.graph.model)
            : HTML.div(),
          selectedTrace.graph.$ === "loop"
            ? HTML.p({ style: { margin: "0" } }, "iterations: " + Math.max(0, selectedTrace.inputs.length - 1))
            : HTML.div(),
          selectedTrace.graph.$ === "IfElse"
            ? HTML.p({ style: { margin: "0" } }, "branch: " + (selectedTrace.inputs[0] && selectedTrace.inputs[0].value ? "then" : "else"))
            : HTML.div(),
          inputs.length > 0
            ? HTML.div(
                HTML.p({ style: { margin: "0.5em 0 0 0" } }, "inputs:"),
                ...inputs.map((entry) => {
                  const targetTitle = entry.node.graph.title ? entry.node.graph.title : entry.node.graph.$
                  return HTML.div(
                    { style: { margin: "0 0 0.25em 0" } },
                    HTML.span(entry.label + ": "),
                    HTML.a(
                      {
                        href: "/newhash",
                        style: {
                          color: "#0a66c2",
                          textDecoration: "underline",
                          cursor: "pointer",
                          fontWeight: "600",
                        },
                        attrs: { title: "Hover: highlight graph node. Click: jump to trace node." },
                        onmousemove: () => {
                          if (graphApi) graphApi.highlightGraph(entry.node.graph)
                        },
                        onmouseout: () => {
                          restoreGraphHighlight()
                        },
                        onclick: (e:any) => {
                          if (e.preventDefault) e.preventDefault()
                          jump(entry.node)
                        }
                      },
                      targetTitle
                    ),
                  )
                }),
              )
            : HTML.div(),
          selectedTrace.graph.$ === "logic"
            ? HTML.div(
                HTML.p({ style: { margin: "0.5em 0 0 0" } }, "code:"),
                HTML.p({ style: { margin: "0" } }, selectedTrace.graph.code),
              )
            : HTML.div(),
          HTML.p({ style: { margin: "0.5em 0 0 0" } }, "value:"),
          HTML.pre(
            {
              style: {
                margin: "0",
                whiteSpace: "pre",
                maxHeight: "12em",
                overflow: "auto",
              }
            },
            (() => {
              const v = selectedTrace.value
              if (typeof v === "string") return v
              try { return JSON.stringify(v, null, 2) }
              catch (_e) { return val(v) }
            })()
          ),
          commentEditor(),
        ),
      )
    }
    const node = selected ? selected : graph
    const links = graphInputEntries(node)
    const jumpGraph = (target: Graph) => {
      selected = target
      selectedTrace = null
      if (graphApi) graphApi.focusGraph(target)
      updatePreview()
    }
    return HTML.div(
      HTML.p(
        { style: { margin: "0 0 0.5em 0", fontWeight: "700" } },
        (node.$ + ": " + (node.title ? node.title : fallbackGraphTitle))
      ),
      HTML.div(
        {
          style: {
            margin: "0",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            overflowY: "auto",
            maxHeight: "28em",
            background: "var(--background)",
            border: "1px solid var(--color)",
            padding: "0.75em",
          }
        },
        HTML.pre({ style: { margin: "0" } }, previewFor(node)),
        links.length > 0
          ? HTML.div(
              HTML.p({ style: { margin: "0.5em 0 0 0" } }, "inputs:"),
              ...links.map((entry) => {
                const targetTitle = entry.node.title ? entry.node.title : entry.node.$
                return HTML.div(
                  { style: { margin: "0 0 0.25em 0" } },
                  HTML.span(entry.label + ": "),
                  HTML.a(
                    {
                      href: "#",
                      style: {
                        color: "#0a66c2",
                        textDecoration: "underline",
                        cursor: "pointer",
                        fontWeight: "600",
                      },
                      attrs: { title: "Hover: highlight graph node. Click: jump to graph node." },
                      onmousemove: () => {
                        if (graphApi) graphApi.highlightGraph(entry.node)
                      },
                      onmouseout: () => {
                        restoreGraphHighlight()
                      },
                      onclick: (e:any) => {
                        if (e.preventDefault) e.preventDefault()
                        jumpGraph(entry.node)
                      }
                    },
                    targetTitle
                  ),
                )
              }),
              )
            : HTML.div(),
        commentEditor(),
      ),
    )
  }

  let previewBody = buildPreview()

  updatePreview = () => {
    let next = buildPreview()
    previewBody.children = next.children
    previewBody.style = next.style
    previewBody.attrs = next.attrs
    previewBody.textContent = next.textContent
    ctx.update(previewBody)
  }

  const tracesListView = (): VDom => {
    if (!selectedPipelineRef) return HTML.p({ style: { margin: "0", opacity: "0.7" } }, "No pipeline selected.")
    const refs = pipelineStore.listTraces(selectedPipelineRef)
    if (refs.length === 0) return HTML.p({ style: { margin: "0", opacity: "0.7" } }, "No traces yet for this pipeline.")
    return HTML.div(
      HTML.p({ style: { margin: "0 0 0.5em 0", opacity: "0.85" } }, "traces for pipeline:"),
      ...refs.slice().reverse().map((ref, i) =>
        HTML.div(
          { style: { margin: "0 0 0.35em 0" } },
          HTML.a(
            {
              href: "#",
              style: {
                color: selectedTraceListRef === ref ? "#f90" : "#0a66c2",
                textDecoration: "underline",
                cursor: "pointer",
              },
              attrs: { title: "Trace ref" },
              onclick: (e:any) => {
                if (e.preventDefault) e.preventDefault()
                selectedTraceListRef = ref
                selected = null
                selectedTrace = null
                refreshApp()
              },
            },
            "" + (i + 1) + ". " + ref,
          ),
        )
      ),
    )
  }

  const render = (): VDom => {
    const pipelines = pipelineStore.listPipelines()
    if (selectedPipelineRef && !routeGraphLoaded && !routeGraphLoadRequested) {
      routeGraphLoadRequested = true
      Promise.resolve().then(async () => {
        try {
          graph = await pipelineStore.getPipeline(selectedPipelineRef as Ref)
          routeGraphLoaded = true
          routeGraphLoadError = ""
        } catch (err) {
          routeGraphLoadError = "" + err
        }
        refreshApp()
      })
    }

    if (!selectedPipelineRef) {
      return HTML.div(
        { style: { padding: "1em", fontFamily: "monospace", maxWidth: "900px" } },
        HTML.h2({ style: { margin: "0 0 0.75em 0" } }, "pipelines"),
        HTML.p({ style: { margin: "0 0 0.75em 0", opacity: "0.8" } }, "Pick a pipeline to open in the graph view (same page)."),
        HTML.button(
          {
            onclick: async () => {
              const ref = await pipelineStore.addPipeline(graph)
              selectedPipelineRef = ref
              routeGraphLoaded = false
              routeGraphLoadRequested = false
              refreshApp()
            }
          },
          "Save current demo pipeline"
        ),
        pipelines.length === 0
          ? HTML.p({ style: { margin: "0.75em 0 0 0", opacity: "0.7" } }, "No saved pipelines yet.")
          : HTML.div(
              { style: { marginTop: "0.75em", display: "grid", gap: "0.5em" } },
              ...pipelines.map((p) =>
                HTML.button(
                  {
                    style: {
                      display: "block",
                      border: "1px solid var(--color)",
                      background: "var(--background)",
                      padding: "0.6em 0.75em",
                      textAlign: "left",
                      color: "var(--color)",
                      cursor: "pointer",
                    },
                    attrs: { title: p.ref },
                    onclick: () => {
                      selectedPipelineRef = p.ref
                      routeGraphLoaded = false
                      routeGraphLoadRequested = false
                      routeGraphLoadError = ""
                      selected = null
                      selectedTrace = null
                      selectedTraceListRef = null
                      graphApi = null
                      refreshApp()
                    }
                  },
                  (p.title ? p.title : "pipeline") + "  " + p.ref.slice(0, 14) + "…"
                )
              ),
            ),
      )
    }

    if (!routeGraphLoaded) {
      return HTML.div(
        { style: { padding: "1em", fontFamily: "monospace" } },
        HTML.h3("pipeline"),
        routeGraphLoadError
          ? HTML.div(
              HTML.p({ style: { color: "#b00" } }, "Failed to load pipeline " + (selectedPipelineRef ? selectedPipelineRef : "") + ": " + routeGraphLoadError),
              HTML.button({
                onclick: () => {
                  selectedPipelineRef = null
                  routeGraphLoaded = true
                  routeGraphLoadRequested = false
                  routeGraphLoadError = ""
                  refreshApp()
                }
              }, "Back to pipeline picker"),
            )
          : HTML.p({ style: { opacity: "0.7" } }, "Loading pipeline " + (selectedPipelineRef ? selectedPipelineRef : "") + "..."),
      )
    }

    return HTML.div(
      { style: { padding: "1em", fontFamily: "monospace" } },
      HTML.h3("pipeline"),
      HTML.div(
        {
          style: {
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) " + previewPaneW + "px",
            gap: "1em",
            alignItems: "flex-start",
            width: "100%",
          }
        },
        HTML.div(
          { style: { flex: "1 1 auto", minWidth: "0" } },
          graphView(graph, graphAreaW, graphAreaH, ctx, {
            onNodeClick: (node) => {
              selected = node
              selectedTrace = null
              updatePreview()
            },
            onTraceNodeClick: (trace) => {
              selectedTrace = trace
              selected = null
              updatePreview()
            },
            onTraceSavedRef: (ref) => {
              if (selectedPipelineRef) pipelineStore.addTrace(selectedPipelineRef, ref)
              selectedTraceListRef = ref
            },
            emptyTraceView: tracesListView,
            traceRef: selectedTraceListRef,
            onReady: (api) => {
              graphApi = api
            },
            "runInput": {
              full: false,
              maxRetriesIdentify: 0,
              docs: [],
            }
          }),
        ),
        HTML.div(
          {
            style: {
              width: previewPaneW + "px",
              minWidth: "280px",
              background: "var(--background)",
              border: "1px solid var(--color)",
              padding: "0.75em",
              boxSizing: "border-box",
              overflow: "auto",
              resize: "both",
              minHeight: "220px",
            }
          },
          HTML.h4({ style: { margin: "0 0 0.75em 0", background: "var(--background)" } }, "node preview"),
          previewBody,
        ),
      ),
    )
  }

  refreshApp = () => {
    if (!appRoot) return
    const next = render()
    appRoot.children = next.children
    appRoot.style = next.style
    appRoot.attrs = next.attrs
    appRoot.textContent = next.textContent
    ctx.update(appRoot)
  }

  if (!ensureCurrentPipelineQueued) {
    ensureCurrentPipelineQueued = true
    Promise.resolve().then(async () => {
      await pipelineStore.addPipeline(graph)
      refreshApp()
    })
  }

  appRoot = render()
  return appRoot;

};
