// ts-note: notes/#52fcda47c7e6864fed8fb4787cf20d1c.ts
// js-note: notes/#e7652bba1ad9dbb8c3beeefd156cc449.js
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
  return await openRouterRequest({
    apiKey,
    model: req.model,
    prompt: req.prompt,
    schema: req.schema,
  })
}
