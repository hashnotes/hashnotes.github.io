// ts-note: notes/#8611ca4df79f0c7db5eab19855a4fc8a.ts
// js-note: notes/#de3b787012b990f105404a998c41f364.js

import type { JsonSchema } from "./jsonSchema";
import type { Jsonable } from "@hashnotes/core/notes";

export type LogicInputs = {[key: string]: Graph}

export type Graph = {
  $: "input",
  title?: string,
} | {
  $: "const",
  title?: string,
  value: Jsonable,
} | {
  $: "logic",
  title?: string,
  inputs: {[key: string]: Graph},
  code: string
} | {
  $: "IfElse",
  title?: string,
  condition: Graph,
  then: Graph,
  else: Graph,
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
} | {
  $: "FunctionCall",
  title?: string,
  function: Graph,
  inputs: {[key: string]: Graph},
}

export function mkGraph() {
  const withTitle = <T extends { $: string }>(node: T, title?: string): T | (T & { title: string }) =>
    title == null ? node : Object.assign(node, { title })

  return {
    input: (title?: string): Graph => {
      return withTitle({ $: "input" }, title) as Graph
    },
    constNode: (value: Jsonable, title?: string): Graph => {
      return withTitle({ $: "const", value }, title) as Graph
    },
    logic: (inputs: LogicInputs, code: string, title?: string): Graph => {
      return withTitle({ $: "logic", inputs, code }, title) as Graph
    },
    ifElse: (condition: Graph, thenNode: Graph, elseNode: Graph, title?: string): Graph => {
      return withTitle({ $: "IfElse", condition, then: thenNode, else: elseNode }, title) as Graph
    },
    loop: (input: Graph, condition: Graph, body: Graph, title?: string): Graph => {
      return withTitle({ $: "loop", input, condition, body }, title) as Graph
    },
    llmCall: (prompt: Graph, model: string, schema: JsonSchema, title?: string): Graph => {
      return withTitle({ $: "LLMCall", prompt, model, schema }, title) as Graph
    },
    functionCall: (fn: Graph, inputs: LogicInputs, title?: string): Graph => {
      return withTitle({ $: "FunctionCall", function: fn, inputs }, title) as Graph
    },
  }
}
