// ts-note: notes/#0e89e88326e1607e376d00f8a9db09c5.ts
// js-note: notes/#2a52d24f6f795d2fd923469186dcf40a.js
import type { Graph } from "./pipeline"

type PipelineEntry = {
  ref: Ref
  title: string
}

const PIPELINES_KEY = "pipelines"
const tracesKey = (pipelineRef: Ref) => "pipeline_traces:" + pipelineRef
const commentKey = (nodeKey: string) => "node_comment:" + nodeKey

const uniqRefs = (refs: Ref[]): Ref[] => {
  const out: Ref[] = []
  refs.forEach((r) => {
    if (out.indexOf(r) < 0) out.push(r)
  })
  return out
}

export const makePipelineStore = () => {
  const migrateSchemaDocKey = (x: Jsonable): Jsonable => {
    if (x == null || typeof x !== "object") return x
    if (Array.isArray(x)) return x.map(migrateSchemaDocKey)
    const o = x as { [k: string]: Jsonable }
    const out: { [k: string]: Jsonable } = {}
    Object.keys(o).forEach((k) => {
      out[k] = migrateSchemaDocKey(o[k])
    })
    if ("properties" in out && out.properties && typeof out.properties === "object" && !Array.isArray(out.properties)) {
      const props = out.properties as { [k: string]: Jsonable }
      if (props["document"] && !props.docs) {
        props.docs = props["document"]
        delete props["document"]
      }
    }
    if (Array.isArray(out.required)) {
      out.required = (out.required as Jsonable[]).map((v) => (v === "document" ? "docs" : v))
    }
    return out
  }

  const migrateGraph = (g: Graph): Graph => {
    const m = (node: Graph): Graph => {
      const base = { ...node } as Graph
      ;(base as { outputSchema?: Jsonable }).outputSchema = migrateSchemaDocKey((node as { outputSchema: Jsonable }).outputSchema)
      if (base.$ === "logic") {
        base.code = base.code.replace(/\binput\.document\b/g, "input.docs")
        const nextInputs: { [k: string]: Graph } = {}
        Object.entries(base.inputs).forEach(([k, v]) => { nextInputs[k] = m(v) })
        base.inputs = nextInputs
        return base
      }
      if (base.$ === "loop") {
        base.input = m(base.input)
        base.condition = m(base.condition)
        base.body = m(base.body)
        return base
      }
      if (base.$ === "IfElse") {
        base.condition = m(base.condition)
        base.then = m(base.then)
        base.else = m(base.else)
        return base
      }
      if (base.$ === "LLMCall") {
        base.prompt = m(base.prompt)
        base.schema = migrateSchemaDocKey(base.schema as unknown as Jsonable) as unknown as typeof base.schema
        return base
      }
      if (base.$ === "FunctionCall") {
        base.function = m(base.function)
        const nextInputs: { [k: string]: Graph } = {}
        Object.entries(base.inputs).forEach(([k, v]) => { nextInputs[k] = m(v) })
        base.inputs = nextInputs
        return base
      }
      return base
    }
    return m(g)
  }

  const listPipelines = (): PipelineEntry[] => {
    const raw = ((store.get(PIPELINES_KEY) || []) as Jsonable[]) as unknown as Jsonable[]
    const out: PipelineEntry[] = []
    raw.forEach((x) => {
      if (!x || typeof x !== "object" || Array.isArray(x)) return
      const ref = (x as { [k: string]: Jsonable }).ref
      const title = (x as { [k: string]: Jsonable }).title
      if (typeof ref !== "string") return
      out.push({ ref: ref as Ref, title: typeof title === "string" ? title : "pipeline" })
    })
    return out
  }

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
    migrateGraph((await getNote(pipelineRef)) as Graph)

  const getComment = (nodeKey: string): string =>
    (((store.get(commentKey(nodeKey)) || "") as Jsonable) as string)

  const setComment = (nodeKey: string, text: string): void => {
    store.set(commentKey(nodeKey), text as unknown as Jsonable)
  }

  return {
    listPipelines,
    addPipeline,
    getPipeline,
    listTraces,
    addTrace,
    getComment,
    setComment,
  }
}
