// ts-note: notes/#7cb0cec4f7628cb81a5c24fca6db5d69.ts
// js-note: notes/#639cba64acff3ec4af6dac3512527ff5.js
export type JsonSchema =
  | { type: "string" }
  | { type: "number" }
  | { type: "boolean" }
  | { type: "null" }
  | { type: "array", items?: JsonSchema }
  | { type: "object", properties?: { [k: string]: JsonSchema }, required?: string[] }
  | { type: "any" }

export const jsonSchema = () => {

  let schema = (
    type: string,
    options: { items?: JsonSchema, properties?: { [k: string]: JsonSchema }, required?: string[] } = {}
  ): JsonSchema => {
    if (type === "array") return { type: "array", items: options.items }
    if (type === "object") return { type: "object", properties: options.properties, required: options.required }
    return { type } as JsonSchema
  }

  let validate = (s: JsonSchema, value: Jsonable, path: string = "$"): string[] => {
    if (s.type === "any") return []

    if (s.type === "null") {
      if (value !== null) return [path + ": expected null, got " + typeof value]
      return []
    }

    if (s.type === "string") {
      if (typeof value !== "string") return [path + ": expected string, got " + typeof value]
      return []
    }

    if (s.type === "number") {
      if (typeof value !== "number") return [path + ": expected number, got " + typeof value]
      return []
    }

    if (s.type === "boolean") {
      if (typeof value !== "boolean") return [path + ": expected boolean, got " + typeof value]
      return []
    }

    if (s.type === "array") {
      if (!Array.isArray(value)) return [path + ": expected array, got " + typeof value]
      if (!s.items) return []
      let errs: string[] = []
      value.forEach((item, i) => {
        errs.push(...validate(s.items!, item as Jsonable, path + "[" + i + "]"))
      })
      return errs
    }

    if (s.type === "object") {
      if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return [path + ": expected object, got " + (value === null ? "null" : typeof value)]
      }
      let errs: string[] = []
      let obj = value as { [k: string]: Jsonable }

      if (s.required) {
        s.required.forEach(key => {
          let keys = Object.keys(obj)
          if (!keys.includes(key)) errs.push(path + "." + key + ": required property missing")
        })
      }

      if (s.properties) {
        let propKeys = Object.keys(s.properties)
        propKeys.forEach(key => {
          let propSchema = s.properties![key]
          let keys = Object.keys(obj)
          if (keys.includes(key)) {
            errs.push(...validate(propSchema, obj[key], path + "." + key))
          }
        })
      }

      return errs
    }

    return [path + ": unknown schema type"]
  }

  return { schema, validate }
}
