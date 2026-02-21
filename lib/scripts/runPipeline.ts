// ts-note: notes/#0421a3f757329cb22798cd9d534b6791.ts
// js-note: notes/#6c4be7cff029ca13114d095b6086b99e.js
import type { Graph } from "./pipeline"
import { openRouterLocal } from "./openRouterLocal"

export type GraphTrace = {
  ref?: Ref
  graph: Graph
  inputs: GraphTrace[]
  value: Jsonable
}

const isObj = (x: Jsonable): x is { [key: string]: Jsonable } =>
  !!x && typeof x === "object" && !Array.isArray(x)

const deepFreeze = (x: Jsonable): Jsonable => {
  if (Array.isArray(x)) {
    x.forEach((v) => {
      if (v && typeof v === "object") deepFreeze(v as Jsonable)
    })
    return Object.freeze(x) as unknown as Jsonable
  }
  if (isObj(x)) {
    Object.values(x).forEach((v) => {
      if (v && typeof v === "object") deepFreeze(v as Jsonable)
    })
    return Object.freeze(x) as unknown as Jsonable
  }
  return x
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
    const vals = Object.values(inputs).map((v) => deepFreeze(v))
    const out = Function(...keys, code)(...vals) as Jsonable
    return deepFreeze(out)
  }

  const evalGraph = async (g: Graph, i: Jsonable): Promise<Jsonable> => {
    if (g.$ === "input") return i
    if (g.$ === "const") return deepFreeze(g.value)
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
    if (g.$ === "const") return { graph: g, inputs: [], value: deepFreeze(g.value) }
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
