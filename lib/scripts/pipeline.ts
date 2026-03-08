// ts-note: notes/#44a12422889185758b30c794d589f56e.ts
// js-note: notes/#a6e59e9f5b3b035ace35c94e942938b3.js
import type { JsonSchema } from "./jsonSchema.ts";
import type { Jsonable } from "@hashnotes/core/notes";

export type LogicInputs = { [key: string]: Graph };

export type Graph = ({
  $: string,
  title?: string,
  outputSchema: JsonSchema
}) & ({
  $: "input",
} | {
  $: "const",
  value: Jsonable,
} | {
  $: "loop",
  input: Graph,
  condition: Graph,
  body: Graph,
} | {
  $: "logic",
  inputs: { [key: string]: Graph },
  code: string
} | {
  $: "LLMCall",
  prompt: Graph,
  model: string,
  schema: JsonSchema
} | {
  $: "IfElse",
  condition: Graph,
  then: Graph,
  else: Graph,
} | {
  $: "FunctionCall",
  function: Graph,
  inputs: { [key: string]: Graph },
});

const ANY_SCHEMA: JsonSchema = { type: "any" };

export function mkGraph() {
  const withMeta = <T extends { $: string }>(node: T, title?: string, outputSchema: JsonSchema = ANY_SCHEMA): Graph =>
    (title == null
      ? Object.assign(node, { outputSchema })
      : Object.assign(node, { title, outputSchema })) as unknown as Graph;

  return {
    input: (title: string, outputSchema: JsonSchema = ANY_SCHEMA): Graph =>
      ({ $: "input", title, outputSchema }),
    constNode: (value: Jsonable, title?: string, outputSchema: JsonSchema = ANY_SCHEMA): Graph =>
      withMeta({ $: "const", value }, title, outputSchema),
    logic: (inputs: LogicInputs, code: string, title?: string, outputSchema: JsonSchema = ANY_SCHEMA): Graph =>
      withMeta({ $: "logic", inputs, code }, title, outputSchema),
    ifElse: (condition: Graph, thenNode: Graph, elseNode: Graph, title?: string, outputSchema: JsonSchema = ANY_SCHEMA): Graph =>
      withMeta({ $: "IfElse", condition, then: thenNode, else: elseNode }, title, outputSchema),
    loop: (input: Graph, condition: Graph, body: Graph, title?: string, outputSchema: JsonSchema = ANY_SCHEMA): Graph =>
      withMeta({ $: "loop", input, condition, body }, title, outputSchema),
    llmCall: (prompt: Graph, model: string, schema: JsonSchema, title?: string, outputSchema: JsonSchema = schema): Graph =>
      withMeta({ $: "LLMCall", prompt, model, schema }, title, outputSchema),
    functionCall: (fn: Graph, inputs: LogicInputs, title?: string, outputSchema: JsonSchema = ANY_SCHEMA): Graph =>
      withMeta({ $: "FunctionCall", function: fn, inputs }, title, outputSchema),
  };
}

