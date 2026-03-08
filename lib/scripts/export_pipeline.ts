// ts-note: notes/#4aa11579b1aa8070a0319d82856c627b.ts
// js-note: notes/#989d66dcbfe131505ae46c6690e61fd5.js
import { type JsonSchema } from "./jsonSchema.ts";
import { type Graph, mkGraph } from "./pipeline.ts";

export const mkExamplePipeline = (): Graph => {
  const { input, constNode, logic, loop, llmCall, ifElse, functionCall } = mkGraph();

  const stringSchema: JsonSchema = { type: "string" };
  const boolSchema: JsonSchema = { type: "boolean" };
  const articleSchema: JsonSchema = {
    type: "object",
    properties: {
      id: { type: "string" },
      title: { type: "string" },
      text: { type: "string" },
    },
    required: ["id", "title", "text"],
  };
  const itemSchema: JsonSchema = {
    type: "object",
    properties: {
      id: { type: "string" },
      label: { type: "string" },
      summary: { type: "string" },
      parentId: { type: "string" },
    },
    required: ["id"],
  };
  const itemsSchema: JsonSchema = { type: "array", items: itemSchema };
  const workflowInputSchema: JsonSchema = {
    type: "object",
    properties: {
      full: { type: "boolean" },
      maxRetriesIdentify: { type: "number" },
      docs: { type: "array", items: articleSchema },
    },
    required: ["full", "maxRetriesIdentify", "docs"],
  };

  const workflowInput = input("Workflow input", workflowInputSchema);
  const identifyPrompt = logic(
    { input: workflowInput },
    "const docs = (input && Array.isArray(input.docs)) ? input.docs : []; const doc = docs.map(a => (a.title || '') + ' ' + (a.text || '')).join('\\n\\n'); return 'Identify items in this legal text:\\n\\n' + doc;",
    "Build identify prompt",
    stringSchema
  );
  const identifyOnce = llmCall(identifyPrompt, "openai/gpt-oss-20b", itemsSchema, "Identify items");
  const needRetry = logic(
    { input: workflowInput, items: identifyOnce },
    "const hasNoItems = !items || items.length === 0; return hasNoItems && ((input.maxRetriesIdentify || 0) > 0);",
    "Need identify retry?",
    boolSchema
  );
  const identifyRetryBody = logic(
    { firstPass: identifyOnce, retryPromptSeed: identifyPrompt },
    "return firstPass;",
    "Identify retry body",
    itemsSchema
  );
  const identifyWithRetry = loop(
    identifyOnce,
    needRetry,
    identifyRetryBody,
    "Identify items with retry loop",
    itemsSchema
  );
  const shouldSummarize = logic(
    { input: workflowInput },
    "return input.full === false;",
    "Should summarize?",
    boolSchema
  );
  const summarizePrompt = logic(
    { items: identifyWithRetry },
    "return 'Summarize and merge duplicate items by key:\\n\\n' + JSON.stringify(items);",
    "Build summarize prompt",
    stringSchema
  );
  const summarizeItems = llmCall(summarizePrompt, "openai/gpt-oss-20b", itemsSchema, "Summarize items");
  const maybeSummarizedItems = ifElse(
    shouldSummarize,
    summarizeItems,
    identifyWithRetry,
    "Summarize only when not full-document mode",
    itemsSchema
  );
  const mapParentsFn = constNode("mapParents", "Map parents function", stringSchema);
  return functionCall(
    mapParentsFn,
    { items: maybeSummarizedItems },
    "Map parents",
    itemsSchema
  );
};
