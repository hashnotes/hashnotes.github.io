// ts-note: notes/#f770eb754e395d72245bdbeb97b7ba4b.ts
// js-note: notes/#163a88a134627195517b40660494bb1e.js

import { graphView } from "./graphView.ts";
import { mkGraph, type Graph } from "./pipeline.ts";
import type { GraphTrace } from "./runPipeline.ts";

export const view: View = (ctx) => {
  const previewPaneW = 360
  const graphAreaW = Math.max(420, ctx.width - previewPaneW - 64)
  const graphAreaH = Math.max(280, Math.floor(ctx.height * 0.66))



  let { input, logic, llmCall, loop } = mkGraph();
  let inp = input();

  let llmcall = llmCall(
    logic(
      { data: inp },
      "return 'Given this JSON array of animal names: ' + JSON.stringify(data) + '. Return JSON object: {\"animal\": \"<name>\"}.'"
    ),
    "openai/gpt-oss-120b",
    {
      type: "object",
      properties: {
        animal: { type: "string" }
      },
      required: ["animal"],
      additionalProperties: false,
    }
  )


  // llmcall = logic(
  //   {
  //     x: input(),
  //   },
  //   "return 'cat'"
  // )


  let graph = loop(
    logic({}, "return ['cat', 'dog']"),
    logic({ x: inp }, "return x.length < 6"),
    logic({
        ls: inp,
        newanimal: llmcall
      },
      "return ls.concat([newanimal.animal])"
    )
  )
  

  let selected: Graph | null = null
  let selectedTrace: GraphTrace | null = null

  const previewFor = (node: Graph): string =>
    node.$ === "input" ? "type: input"
      : node.$ === "logic" ? [
        "type: logic",
        "inputs: " + Object.keys(node.inputs).join(", "),
        "",
        "code:",
        node.code,
      ].join("\n")
      : node.$ === "LLMCall" ? [
        "type: LLMCall",
        "model: " + node.model,
      ].join("\n")
        : [
          "type: loop",
          "fields: input, condition, body",
        ].join("\n")

  const previewForTrace = (trace: GraphTrace): string =>
    (trace.graph.$ === "loop"
      ? [
          "type: loop",
          "value: " + (typeof trace.value === "string" ? trace.value : JSON.stringify(trace.value)),
          "iterations: " + Math.max(0, trace.inputs.length - 1),
          "",
          "steps:",
          ...trace.inputs.map((step, i) =>
            (i === 0 ? "start: " : "iter " + i + ": ")
            + (typeof step.value === "string" ? step.value : JSON.stringify(step.value))
          ),
        ]
      : [
      "type: " + trace.graph.$,
      "value: " + (typeof trace.value === "string" ? trace.value : JSON.stringify(trace.value)),
      "inputs: " + trace.inputs.length,
      ...(trace.graph.$ === "logic" ? ["", "code:", trace.graph.code] : []),
    ]).join("\n")

  const buildPreview = (): VDom => {
    if (!selected && !selectedTrace) {
      return HTML.div(
        HTML.p({ style: { opacity: "0.7", margin: "0" } }, "Click a node to preview its content."),
      )
    }
    if (selectedTrace) {
      return HTML.div(
        HTML.p({ style: { margin: "0 0 0.5em 0" } }, "trace node: " + selectedTrace.graph.$),
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
          previewForTrace(selectedTrace)
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

  const updatePreview = () => {
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
          "runInput": "test"
        }),
      ),
      HTML.div(
        {
          style: {
            width: previewPaneW + "px",
            background: "var(--background)",
            border: "1px solid var(--color)",
            padding: "0.75em",
            boxSizing: "border-box",
          }
        },
        HTML.h4({ style: { margin: "0 0 0.75em 0", background: "var(--background)" } }, "node preview"),
        previewBody,
      ),
    ),
  );

};
