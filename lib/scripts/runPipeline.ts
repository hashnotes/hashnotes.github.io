// ts-note: notes/#30a4a5a0440a301c8fdda84726cf9bab.ts
// js-note: notes/#c96f4105213abd58062ed6f00bfb5275.js


import { Graph } from "./pipeline"

export type GraphTrace = {
  graph: Graph
  inputs: GraphTrace[],
  value: Jsonable
}


export const runPipeline = (graph: Graph, input:Jsonable) :GraphTrace => {

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
        let res = Function(...Object.keys(graph.inputs), graph.code)(...values) as Jsonable
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


