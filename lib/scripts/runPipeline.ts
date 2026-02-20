// ts-note: notes/#51f9ea102128c10ced6003b8f51a663f.ts
// js-note: notes/#d130627d77e8b29bb6a823880b575078.js


import type { Graph } from "./pipeline"

export type GraphTrace = {
  graph: Graph
  inputs: GraphTrace[],
  value: Jsonable
}


export const runPipeline = (graph: Graph, input:Jsonable) :GraphTrace => {
  const evalLogic = (inputs: {[key: string]: Jsonable}, code: string): Jsonable => {
    if (code.indexOf("return") < 0) {
      throw "logic code must return a value explicitly (use `return ...`)"
    }
    const keys = Object.keys(inputs)
    const vals = Object.values(inputs)
    const res = Function(...keys, code)(...vals) as Jsonable
    return res
  }

  const go = (graph: Graph, input: Jsonable):GraphTrace => {
    switch (graph.$) {
      case "input": return {
        graph,
        inputs: [],
        value: input
      }
      case "logic": {
        let inputs = Object.values(graph.inputs).map(x=>go(x, input))
        let values = inputs.map(x => x.value)
        let map = Object.fromEntries(Object.keys(graph.inputs).map((k, i) => [k, values[i]])) as {[key:string]: Jsonable}
        let res = evalLogic(map, graph.code)
        return {
          graph,
          inputs,
          value:res
        }
      }
      case "loop":{
        let steps = [go(graph.input, input)]
        while (go(graph.condition, steps[steps.length-1].value).value){
          steps.push(go(graph.body, steps[steps.length-1].value))
        }

        return {
          graph,
          inputs: steps,
          value: steps[steps.length-1].value
        }
      }
    }
  }
  return go(graph, input)
}
