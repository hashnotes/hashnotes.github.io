// ts-note: notes/#d58f86ac36dac75fb554e4859d7d641c.ts
// js-note: notes/#d1cad27543049153266262071299dca0.js


import type { Graph } from "./pipeline"

type StoredGraphTrace = {
  graph: Graph
  inputs: Ref[]
  value: Jsonable
}


type TraceState = {
  ref: Ref
  value: Jsonable
}

export const runPipeline = async (graph: Graph, input:Jsonable) :Promise<Ref> => {
  const evalLogic = (inputs: {[key: string]: Jsonable}, code: string): Jsonable => {
    if (code.indexOf("return") < 0) {
      throw "logic code must return a value explicitly (use `return ...`)"
    }
    const keys = Object.keys(inputs)
    const vals = Object.values(inputs)
    const res = Function(...keys, code)(...vals) as Jsonable
    return res
  }

  const saveTraceNode = async (node: Omit<StoredGraphTrace, never>): Promise<Ref> => {
    return await addNote(node as unknown as Jsonable)
  }

  const evalGraph = (g: Graph, i: Jsonable): Jsonable => {
    switch (g.$) {
      case "input":
        return i
      case "logic": {
        const keys = Object.keys(g.inputs)
        const vals = keys.map((k) => evalGraph(g.inputs[k], i))
        const map = Object.fromEntries(keys.map((k, idx) => [k, vals[idx]])) as {[key:string]: Jsonable}
        return evalLogic(map, g.code)
      }
      case "loop": {
        let cur = evalGraph(g.input, i)
        while (evalGraph(g.condition, cur)) {
          cur = evalGraph(g.body, cur)
        }
        return cur
      }
    }
  }

  const go = async (g: Graph, i: Jsonable):Promise<TraceState> => {
    switch (g.$) {
      case "input": {
        const value = i
        const ref = await saveTraceNode({
          graph: g,
          inputs: [],
          value,
        })
        return { ref, value }
      }
      case "logic": {
        const inputStates = await Promise.all(Object.values(g.inputs).map((x) => go(x, i)))
        const values = inputStates.map((x) => x.value)
        const map = Object.fromEntries(Object.keys(g.inputs).map((k, idx) => [k, values[idx]])) as {[key:string]: Jsonable}
        const value = evalLogic(map, g.code)
        const ref = await saveTraceNode({
          graph: g,
          inputs: inputStates.map((x) => x.ref),
          value,
        })
        return { ref, value }
      }
      case "loop": {
        const steps: TraceState[] = [await go(g.input, i)]
        while (evalGraph(g.condition, steps[steps.length - 1].value)) {
          steps.push(await go(g.body, steps[steps.length - 1].value))
        }
        const value = steps[steps.length - 1].value
        const ref = await saveTraceNode({
          graph: g,
          inputs: steps.map((s) => s.ref),
          value,
        })
        return { ref, value }
      }
    }
  }

  const out = await go(graph, input)
  return out.ref
}
