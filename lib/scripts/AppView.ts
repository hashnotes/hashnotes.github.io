// ts-note: notes/#55f7a2fd04dad64bf33bf0c717443b00.ts
// js-note: notes/#ea2ffb79d3d5bc63ecdd09182c970aea.js
import { graphView } from "./graphView.ts";
import { Graph } from "./pipeline.ts";

export const view: View = (ctx) => {

  let w = ctx.width * 0.9
  let h = ctx.height * 0.7

  let inp :Graph = {
    $:"input",
  }

  let logic = (inputs: {[key:string]:Graph}, code:string):Graph=>({$:"logic", inputs, code})

  let loop:Graph = {
    $:"loop",
    input: inp,
    condition: logic({"x":inp}, "x.length > 10"),
    body: logic({x:inp}, "x += 'A'"),
  }

  let selected: Graph | null = null

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

  const buildPreview = (): VDom => {
    if (!selected) {
      return HTML.div(
        HTML.p({ style: { opacity: "0.7", margin: "0" } }, "Click a node to preview its content."),
      )
    }
    return HTML.div(
      HTML.p({ style: { margin: "0 0 0.5em 0" } }, "node: " + selected.$),
      HTML.pre(
        {
          style: {
            margin: "0",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            background: "var(--background-color)",
            border: "1px solid var(--color)",
            padding: "0.75em",
          }
        },
        previewFor(selected)
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
          display: "flex",
          gap: "1em",
          alignItems: "flex-start",
        }
      },
      HTML.div(
        { style: { flex: "1 1 auto", minWidth: "0" } },
        graphView(loop, w, h, ctx, {
          onNodeClick: (node) => {
            selected = node
            updatePreview()
          }
        }),
      ),
      HTML.div(
        {
          style: {
            flex: "0 0 22em",
            maxWidth: "45%",
            background: "var(--background)",
            border: "1px solid var(--color)",
            padding: "0.75em",
          }
        },
        HTML.h4({ style: { margin: "0 0 0.75em 0", background: "var(--background)" } }, "node preview"),
        previewBody,
      ),
    ),
  );

};
