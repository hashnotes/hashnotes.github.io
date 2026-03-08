  import { Graph } from "./pipeline";
import { JsonSchema } from "./jsonSchema";

export const inputGraph = (title: string, outputSchema: JsonSchema): Graph => ({
  $: "input",
  outputSchema,
  title,
});

export const constGraph = (
  title: string,
  value: Jsonable,
  outputSchema: JsonSchema,
): Graph => ({
  $: "const",
  value,
  outputSchema,
  title,
});

export const logicGraph = (
  title: string,
  inputs: { [key: string]: Graph },
  code: string,
  outputSchema: JsonSchema,
): Graph => ({
  $: "logic",
  inputs,
  code,
  outputSchema,
  title,
});

export const loopGraph = (
  title: string,
  input: Graph,
  condition: Graph,
  body: Graph,
  outputSchema: JsonSchema,
): Graph => ({
  $: "loop",
  input,
  condition,
  body,
  outputSchema,
  title,
});

export const llmCallGraph = (
  title: string,
  prompt: Graph,
  model: string,
  schema: JsonSchema,
  outputSchema: JsonSchema = schema,
): Graph => ({
  $: "LLMCall",
  prompt,
  model,
  schema,
  outputSchema,
  title,
});

export const ifElseGraph = (
  title: string,
  condition: Graph,
  thenGraph: Graph,
  elseGraph: Graph,
  outputSchema: JsonSchema,
): Graph => ({
  $: "IfElse",
  condition,
  then: thenGraph,
  else: elseGraph,
  outputSchema,
  title,
});

export const functionCallGraph = (
  title: string,
  fn: Graph,
  inputs: { [key: string]: Graph },
  outputSchema: JsonSchema,
): Graph => ({
  $: "FunctionCall",
  function: fn,
  inputs,
  outputSchema,
  title,
});


