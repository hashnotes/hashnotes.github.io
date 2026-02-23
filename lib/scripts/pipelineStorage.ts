// ts-note: notes/#3dd54b2c5c43bb1a7d51f1f7083f90bb.ts
// js-note: notes/#89ab04d3c771d57c2249cd8779588a03.js
import type { Graph } from "./pipeline"

type PipelineEntry = {
  ref: Ref
  title: string
}

const PIPELINES_KEY = "pipelines"
const tracesKey = (pipelineRef: Ref) => "pipeline_traces:" + pipelineRef

const uniqRefs = (refs: Ref[]): Ref[] => {
  const out: Ref[] = []
  refs.forEach((r) => {
    if (out.indexOf(r) < 0) out.push(r)
  })
  return out
}

export const makePipelineStore = () => {
  const listPipelines = (): PipelineEntry[] =>
    ((store.get(PIPELINES_KEY) || []) as Jsonable[]) as unknown as PipelineEntry[]

  const savePipelines = (xs: PipelineEntry[]) => {
    store.set(PIPELINES_KEY, xs as unknown as Jsonable)
  }

  const addPipeline = async (graph: Graph): Promise<Ref> => {
    const ref = await addNote(graph as unknown as Jsonable)
    const title = graph.title ? graph.title : graph.$
    const prev = listPipelines()
    if (!prev.some((x) => x.ref === ref)) savePipelines(prev.concat([{ ref, title }]))
    return ref
  }

  const listTraces = (pipelineRef: Ref): Ref[] =>
    ((store.get(tracesKey(pipelineRef)) || []) as Ref[])

  const addTrace = (pipelineRef: Ref, traceRef: Ref): void => {
    const next = uniqRefs(listTraces(pipelineRef).concat(traceRef))
    store.set(tracesKey(pipelineRef), next as unknown as Jsonable)
  }

  const getPipeline = async (pipelineRef: Ref): Promise<Graph> =>
    (await getNote(pipelineRef)) as Graph

  return {
    listPipelines,
    addPipeline,
    getPipeline,
    listTraces,
    addTrace,
  }
}

