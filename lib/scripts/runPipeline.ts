// ts-note: notes/#985153bc752b30bcd2deaf291cd2f68b.ts
// js-note: notes/#82e9d463c232cb1753d210deb3baa1da.js
import type { Graph } from "./pipeline"
import { openRouterLocal } from "./openRouterLocal"

export type GraphTrace = {
  ref?: Ref
  graph: Graph
  inputs: GraphTrace[]
  value: Jsonable
}

const toPrompt = (x: Jsonable): string => {
  if (typeof x === "string") return x
  if (typeof x === "number" || typeof x === "boolean" || x === null) return "" + x
  return JSON.stringify(x)
}

export const runPipeline = async (graph: Graph, input: Jsonable): Promise<GraphTrace> => {
  const evalLogic = (inputs: {[key: string]: Jsonable}, code: string): Jsonable => {
    if (code.indexOf("return") < 0) return null
    const keys = Object.keys(inputs)
    const vals = Object.values(inputs)
    return Function(...keys, code)(...vals) as Jsonable
  }

  const evalGraph = async (g: Graph, i: Jsonable): Promise<Jsonable> => {
    if (g.$ === "input") return i
    if (g.$ === "logic") {
      const keys = Object.keys(g.inputs)
      const vals = await Promise.all(keys.map((k) => evalGraph(g.inputs[k], i)))
      const map = Object.fromEntries(keys.map((k, idx) => [k, vals[idx]])) as {[key: string]: Jsonable}
      return evalLogic(map, g.code)
    }
    if (g.$ === "LLMCall") {
      const promptValue = await evalGraph(g.prompt, i)
      return await openRouterLocal({
        model: g.model,
        prompt: toPrompt(promptValue),
        schema: g.schema,
      })
    }
    let cur = await evalGraph(g.input, i)
    while (await evalGraph(g.condition, cur)) {
      cur = await evalGraph(g.body, cur)
    }
    return cur
  }

  const go = async (g: Graph, i: Jsonable): Promise<GraphTrace> => {
    if (g.$ === "input") return { graph: g, inputs: [], value: i }
    if (g.$ === "logic") {
      const inputs = await Promise.all(Object.values(g.inputs).map((x) => go(x, i)))
      const values = inputs.map((x) => x.value)
      const map = Object.fromEntries(Object.keys(g.inputs).map((k, idx) => [k, values[idx]])) as {[key: string]: Jsonable}
      return { graph: g, inputs, value: evalLogic(map, g.code) }
    }
    if (g.$ === "LLMCall") {
      const promptTrace = await go(g.prompt, i)
      const llmValue = await openRouterLocal({
        model: g.model,
        prompt: toPrompt(promptTrace.value),
        schema: g.schema,
      })
      return { graph: g, inputs: [promptTrace], value: llmValue }
    }
    const steps: GraphTrace[] = [await go(g.input, i)]
    while (await evalGraph(g.condition, steps[steps.length - 1].value)) {
      steps.push(await go(g.body, steps[steps.length - 1].value))
    }
    return { graph: g, inputs: steps, value: steps[steps.length - 1].value }
  }

  return go(graph, input)
}
