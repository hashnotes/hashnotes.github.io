// ts-note: notes/#688e09fdc4bf3454ca381e3e149b517f.ts
// js-note: notes/#82b18978dfc8c5d3ad006ae7cdc2cd58.js

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
    loop: (input: Graph, condition: Graph, body: Graph, title?: string): Graph => {
      return withTitle({ $: "loop", input, condition, body }, title) as Graph
    },
    llmCall: (prompt: Graph, model: string, schema: JsonSchema, title?: string): Graph => {
      return withTitle({ $: "LLMCall", prompt, model, schema }, title) as Graph
    },
  }
}
