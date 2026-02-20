import type { Jsonable } from "@hashnotes/core/notes";

export type OpenRouterRequest = {
  apiKey: string;
  model: string;
  prompt: string;
  schema: Jsonable;
};

type OpenRouterMessage = {
  role: "user";
  content: string;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const clip = (s: string, max = 2000): string => (s.length <= max ? s : s.slice(0, max) + "...<truncated>");

const asErrorMessage = async (res: Response): Promise<string> => {
  const text = await res.text();
  if (!text) return `${res.status} ${res.statusText}`;
  try {
    const parsed = JSON.parse(text) as { error?: { message?: string } };
    const msg = parsed?.error?.message;
    return msg ? `${res.status} ${msg}` : `${res.status} ${text}`;
  } catch {
    return `${res.status} ${text}`;
  }
};

export const openRouterRequest = async (
  req: OpenRouterRequest,
): Promise<Jsonable> => {
  if (!req.apiKey) throw new Error("openRouterRequest: apiKey is required");
  if (!req.model) req.model = "openai/gpt-oss-20b"
  if (!req.prompt) throw new Error("openRouterRequest: prompt is required");
  if (!req.schema) req.schema = {type:"string"}
  if (typeof req.schema !== "object" || Array.isArray(req.schema)) {
    throw new Error("openRouterRequest: schema must be an object");
  }

  const messages: OpenRouterMessage[] = [{ role: "user", content: req.prompt }];
  const mkBody = () => ({
    model: req.model,
    messages,
    reasoning: {
      enabled: true,
      exclude: true,
    },
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "structured_output",
        strict: true,
        schema: req.schema,
      },
    },
  });

  const doFetch = () => fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${req.apiKey}`,
    },
    body: JSON.stringify(mkBody()),
  });

  const res = await doFetch();
  if (!res.ok) throw new Error(`OpenRouter request failed: ${await asErrorMessage(res)}`);

  const data = await res.json() as OpenRouterResponse;
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error(
      "OpenRouter response missing choices[0].message.content"
      + "\nmodel: " + req.model
      + "\nschema: " + clip(JSON.stringify(req.schema))
      + "\nresponse: " + clip(JSON.stringify(data))
    );
  }
  if (content.trim().length === 0) {
    throw new Error(
      "OpenRouter response content was empty"
      + "\nmodel: " + req.model
      + "\nschema: " + clip(JSON.stringify(req.schema))
      + "\nresponse: " + clip(JSON.stringify(data))
    );
  }
  try {
    return JSON.parse(content) as Jsonable;
  } catch (err) {
    const parseMsg = err instanceof Error ? err.message : String(err);
    throw new Error(
      "OpenRouter response content was not valid JSON"
      + "\nmodel: " + req.model
      + "\nparse error: " + parseMsg
      + "\nschema: " + clip(JSON.stringify(req.schema))
      + "\ncontent: " + clip(content)
      + "\nresponse: " + clip(JSON.stringify(data))
    );
  }
};
