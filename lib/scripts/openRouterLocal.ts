// ts-note: notes/#6d5e7779d7d57e9d8ff9441a87b5f01e.ts
// js-note: notes/#50e513529e880e2a435dace070ccbc8b.js
type OpenRouterLocalRequest = {
  model: string
  prompt: string
  schema: Jsonable
}

const loadApiKey = (): string => {
  const stored = store.get("openrouter_api_key")
  if (typeof stored === "string" && stored.trim().length > 0) return stored

  const entered = promptUser("Enter OpenRouter API key")
  if (!entered || entered.trim().length === 0) {
    throw "OpenRouter API key is required"
  }
  store.set("openrouter_api_key", entered)
  return entered
}

export const openRouterLocal = async (req: OpenRouterLocalRequest): Promise<Jsonable> => {
  const apiKey = loadApiKey()
  return openRouterRequest({
    apiKey,
    model: req.model,
    prompt: req.prompt,
    schema: req.schema,
  })
}
