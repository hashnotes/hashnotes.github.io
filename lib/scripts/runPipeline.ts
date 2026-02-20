// ts-note: notes/#672529cbe195515b5a555622d471f61c.ts
// js-note: notes/#8aa50d818d9057b7346dc354f6849898.js


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
        let res = Function(...Object.keys(graph.inputs), graph.code)(...inputs) as Jsonable
        return {
          graph,
          inputs,
          value:res
        }
      }
      case "loop":{
        let steps = [go(graph.input, input)]
        
        while (go(graph.condition, steps[steps.length-1].value)){
          steps.push(go(graph.body, steps[steps.length-1]))
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



