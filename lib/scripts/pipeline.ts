// ts-note: notes/#f1029bd71051b12bc4dd976711397b24.ts
// js-note: notes/#50fac4534a9d79e59e0195debb7eace4.js

import type { JsonSchema } from "./jsonSchema";

export type LogicInputs = {[key: string]: Graph}

export type Graph = {
  $: "input",
  title?: string,
} | {
  $: "logic",
  title?: string,
  inputs: {[key: string]: Graph},
  code: string
} | {
  $: "loop",
  title?: string,
  input: Graph,
  condition: Graph,
  body: Graph,
} | {
  $: "LLMCall",
  title?: string,
  prompt: Graph,
  model: string,
  schema: JsonSchema
}

export function mkGraph() {
  return {
    input: (title?: string): Graph => {
      return { $: "input", title }
    },
    logic: (inputs: LogicInputs, code: string, title?: string): Graph => {
      return { $: "logic", inputs, code, title }
    },
    loop: (input: Graph, condition: Graph, body: Graph, title?: string): Graph => {
      return { $: "loop", input, condition, body, title }
    },
    llmCall: (prompt: Graph, model: string, schema: JsonSchema, title?: string): Graph => {
      return { $: "LLMCall", prompt, model, schema, title }
    },
  }
}
