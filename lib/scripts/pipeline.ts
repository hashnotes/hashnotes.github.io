// ts-note: notes/#860173f044321f57d299f509f15e1d8c.ts
// js-note: notes/#44d9e8819532bdc591e26141bf47daec.js

import type { JsonSchema } from "./jsonSchema";

export type LogicInputs = {[key: string]: Graph}

export type Graph = {
  $: "input",
} | {
  $: "logic",
  inputs: {[key: string]: Graph},
  code: string
} | {
  $: "loop",
  input: Graph,
  condition: Graph,
  body: Graph,
} | {
  $: "LLMCall",
  prompt: Graph,
  model: string,
  schema: JsonSchema
}

export function mkGraph() {
  return {
    input: (): Graph => {
      return { $: "input" }
    },
    logic: (inputs: LogicInputs, code: string): Graph => {
      return { $: "logic", inputs, code }
    },
    loop: (input: Graph, condition: Graph, body: Graph): Graph => {
      return { $: "loop", input, condition, body }
    },
    llmCall: (prompt: Graph, model: string, schema: JsonSchema): Graph => {
      return { $: "LLMCall", prompt, model, schema }
    },
  }
}
