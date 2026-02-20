// ts-note: notes/#17e7cb8403b50528fc8e10da37fbb6f1.ts
// js-note: notes/#4f8256cfc3668b3582f5c0c3723cc3f0.js

import { graphView } from "./graphView.ts";
import type { Graph } from "./pipeline.ts";
import type { GraphTrace } from "./loadTrace.ts";

export const view: View = (ctx) => {

  console.log(await openRouterRequest())

  const previewPaneW = 360
  const graphAreaW = Math.max(420, ctx.width - previewPaneW - 64)
  const graphAreaH = Math.max(280, Math.floor(ctx.height * 0.66))

  let inp :Graph = {
    $:"input",
  }

  let logic = (inputs: {[key:string]:Graph}, code:string):Graph=>({$:"logic", inputs, code})

  let loop:Graph = {
    $:"loop",
    input: inp,
    condition: logic({"x":inp}, "return x.length < 10"),
    body: logic({x:inp}, "return x + 'A'"),
  }

  let bracks: Graph = {
    $: "logic",
    inputs: {x:loop},
    code: "return '[' + x + ']'"
  }

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
        previewFor(selected ? selected : bracks)
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
        graphView(bracks, graphAreaW, graphAreaH, ctx, {
          onNodeClick: (node) => {
            selected = node
            selectedTrace = null
            updatePreview()
          },
          onTraceNodeClick: (trace) => {
            selectedTrace = trace
            selected = null
            updatePreview()
          }
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
