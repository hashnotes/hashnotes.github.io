// ts-note: notes/#291611fee40943f849186d67bd74b81d.ts
// js-note: notes/#9f944e042ae52eed5221e669425eb7e6.js
import type { Graph } from "./pipeline"

type StoredGraphTrace = {
  graph: Graph
  inputs: Ref[]
  value: Jsonable
}

export type GraphTrace = {
  ref: Ref
  graph: Graph
  inputs: GraphTrace[]
  value: Jsonable
}

const asStoredTrace = (x: Jsonable): StoredGraphTrace => {
  if (!x || typeof x !== "object" || Array.isArray(x)) {
    return {
      graph: { $: "input" } as Graph,
      inputs: [],
      value: null,
    }
  }
  const rec = x as Record<string, Jsonable>
  const graph = (rec.graph as Graph) || ({ $: "input" } as Graph)
  const inputs = rec.inputs as Jsonable
  const value = rec.value
  if (!Array.isArray(inputs)) {
    return {
      graph,
      inputs: [],
      value,
    }
  }
  return {
    graph,
    inputs: inputs as Ref[],
    value,
  }
}

export const loadTrace = async (root: Ref): Promise<GraphTrace> => {
  const cache = new Map<Ref, GraphTrace>()
  async function go(ref: Ref): Promise<GraphTrace> {
    if (cache.has(ref)) return cache.get(ref) as GraphTrace
    const raw = await getNote(ref)
    const node = asStoredTrace(raw)
    const out: GraphTrace = {
      ref,
      graph: node.graph,
      inputs: [],
      value: node.value,
    }
    cache.set(ref, out)
    out.inputs = await Promise.all(node.inputs.map(go))
    return out
  }
  return await go(root)
}
