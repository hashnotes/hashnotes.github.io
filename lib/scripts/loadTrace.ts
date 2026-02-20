// ts-note: notes/#69623cfa0a13ab5f1992795f4b997f8a.ts
// js-note: notes/#a249c382c8fe40385ba7f6ececcad85b.js
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
  if (!x || typeof x !== "object" || Array.isArray(x)) throw "invalid trace node payload"
  const rec = x as Record<string, Jsonable>
  const graph = rec.graph as Graph
  const inputs = rec.inputs as Jsonable
  const value = rec.value
  if (!Array.isArray(inputs)) throw "invalid trace node inputs"
  return {
    graph,
    inputs: inputs as Ref[],
    value,
  }
}

export const loadTrace = async (root: Ref): Promise<GraphTrace> => {
  const cache = new Map<Ref, GraphTrace>()
  const go = async (ref: Ref): Promise<GraphTrace> => {
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
