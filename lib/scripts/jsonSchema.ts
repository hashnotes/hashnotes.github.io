// ts-note: notes/#0c215aef0f107a617a9bff722d4e7836.ts
// js-note: notes/#f9f82277894c03d4831ff6dc1ad5f34b.js
export type JsonSchema =
  | { type: "string" }
  | { type: "number" }
  | { type: "boolean" }
  | { type: "null" }
  | { type: "array", items?: JsonSchema }
  | { type: "object", properties?: { [k: string]: JsonSchema }, required?: string[], additionalProperties?: false | JsonSchema}
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
    let errs: string[] = [];
    const go = (s:JsonSchema, value: Jsonable, path: string) =>{
      let err = (msg:string, key:string = "") => errs.push(path + (key ? "." + key : "") + ": " + msg)
      if (s.type == "any") return
      else if (s.type == "null") {if (value != null) err("expected null, got:"+typeof value)}
      else if (s.type == "string" || s.type == "number" || s.type == "boolean") {if (typeof value != s.type) err("expected "+s.type+ " got:"+typeof value)}
      else if (s.type == "array"){
        if (!Array.isArray(value)) return err("expected array, got:" + typeof value)
        if (s.items) value.forEach((x, i)=>go(s.items!, x, path+"["+i+"]"))
      }else if (s.type == "object"){
        if (typeof value != "object" || Array.isArray(value) || value == null) return err("expected Object");

        ;(s.required || []).forEach(req=> {if (value[req] == undefined) err("missing required property:" + req)})
        let properties = s.properties ?? {};
        Object.entries(value).forEach(([key,val])=>{
          if (properties[key] != undefined) go(properties[key], val, path + "." + key)
          else if (s.additionalProperties == false) err("unnalowed additonal property:"+key)
          else if(s.additionalProperties) go(s.additionalProperties, val, path + "." + key)
        })
      }
    };

    return errs
  }

  return { schema, validate }
}
