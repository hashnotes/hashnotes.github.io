// ts-note: notes/#5f9b26b9cad62153efe54b8e8cdf4af6.ts
// js-note: notes/#e14511dc186e5b0bef76e80dceb957d0.js

import { graphView } from "./graphView.ts";
import type { GraphViewApi } from "./graphView.ts";
import { mkGraph, type Graph } from "./pipeline.ts";
import type { GraphTrace } from "./runPipeline.ts";

export const view: View = (ctx) => {
  const previewPaneW = 360
  const graphAreaW = Math.max(420, ctx.width - previewPaneW - 64)
  const graphAreaH = Math.max(280, Math.floor(ctx.height * 0.66))



  let { input, logic, llmCall, loop } = mkGraph();
  let inp = input("animals list");

  let llmcall = llmCall(
    logic(
      { data: inp },
      "return 'Given this JSON array of animal names: ' + JSON.stringify(data) + '. Return JSON object: {\"animal\": \"<name>\"}. The name must be a real animal and must NOT already be present in the input list.'",
      "build LLM prompt"
    ),
    "openai/gpt-oss-120b",
    {
      type: "object",
      properties: {
        animal: { type: "string" }
      },
      required: ["animal"],
      additionalProperties: false,
    },
    "new animal via LLM"
  )


  // llmcall = logic(
  //   {
  //     x: input(),
  //   },
  //   "return 'cat'"
  // )


  let graph = loop(
    logic({}, "return ['cat', 'dog']", "seed list"),
    logic({ x: inp }, "return x.length < 6", "continue until size 6"),
    logic({
        ls: inp,
        newanimal: llmcall
      },
      "return ls.concat([newanimal.animal])",
      "append new animal"
    ),
    "grow animal list"
  )
  

  let selected: Graph | null = null
  let selectedTrace: GraphTrace | null = null
  let graphApi: GraphViewApi | null = null
  let updatePreview: () => void = () => {}
  const fallbackGraphTitle = graph.title ? graph.title : "graph"

  const previewFor = (node: Graph): string =>
    node.$ === "input" ? [
      "type: input",
      ...(node.title ? ["title: " + node.title] : []),
    ].join("\n")
      : node.$ === "logic" ? [
        "type: logic",
        ...(node.title ? ["title: " + node.title] : []),
        "inputs: " + Object.keys(node.inputs).join(", "),
        "",
        "code:",
        node.code,
      ].join("\n")
      : node.$ === "LLMCall" ? [
        "type: LLMCall",
        ...(node.title ? ["title: " + node.title] : []),
        "model: " + node.model,
      ].join("\n")
        : [
          "type: loop",
          ...(node.title ? ["title: " + node.title] : []),
          "fields: input, condition, body",
        ].join("\n")

  const traceInputEntries = (t: GraphTrace): { label: string, node: GraphTrace }[] => {
    if (t.graph.$ === "loop") {
      return t.inputs.map((step, i) => ({ label: i === 0 ? "start" : "iter " + i, node: step }))
    }
    if (t.graph.$ === "LLMCall") {
      return t.inputs.map((step, i) => ({ label: i === 0 ? "prompt" : "input " + i, node: step }))
    }
    if (t.graph.$ === "logic") {
      return t.inputs.map((step, i) => {
        const k = Object.keys(t.graph.inputs)[i]
        return { label: k ? k : "input " + (i + 1), node: step }
      })
    }
    return []
  }

  const buildPreview = (): VDom => {
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
                        href: "#",
                        style: {
                          color: "#0a66c2",
                          textDecoration: "underline",
                          cursor: "pointer",
                          fontWeight: "600",
                        },
                        onclick: (e) => {
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
          HTML.p({ style: { margin: "0.5em 0 0 0" } }, "value: " + val(selectedTrace.value)),
        ),
      )
    }
    return HTML.div(
      HTML.p({ style: { margin: "0 0 0.5em 0" } }, "node: " + (selected ? selected.$ : "")),
      HTML.pre(
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
        previewFor(selected ? selected : graph)
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
          onReady: (api) => {
            graphApi = api
          },
          "runInput": "test"
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
  );

};
