// ts-note: notes/#4e5507d9ae522aba68143eb77a81a51d.ts
// js-note: notes/#0a178b13cbb8be9c6544e4d1e88729f3.js
type OpenRouterLocalRequest = {
  model: string
  prompt: string
  schema: Jsonable
  provider?: string
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
  const cacheBase = {
    $: "openrouter_local_cache",
    model: req.model,
    prompt: req.prompt,
    schema: req.schema,
    provider: req.provider ?? null,
  } as Jsonable
  const cacheKey = hashData(cacheBase)
  const cacheHitKey = hashData({
    $: "openrouter_local_cache_hit",
    model: req.model,
    prompt: req.prompt,
    schema: req.schema,
    provider: req.provider ?? null,
  } as Jsonable)
  const hit = store.get(cacheHitKey)
  if (hit === true) return store.get(cacheKey) as Jsonable

  const apiKey = loadApiKey()
  return openRouterRequest({
    apiKey,
    model: req.model,
    prompt: req.prompt,
    schema: req.schema,
  }).then((out) => {
    store.set(cacheKey, out)
    store.set(cacheHitKey, true)
    return out
  })
}
