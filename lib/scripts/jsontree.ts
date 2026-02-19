// ts-note: notes/#bd2441b7c9add4083c663dbf6e092619.ts
// js-note: notes/#d553ef1fda823d5c0e1e26028a74de21.js


export const mkView = (data: Jsonable, ctx: ViewContext)=>{
  let space = "    "
  let mk = (data:Jsonable, ident:number):string | VDom =>{
    let nl = "\n" + space.repeat(ident)
    ident += 1;
    if (["string", "number", "boolean"].includes(typeof data)) return JSON.stringify(data)
    if (Array.isArray(data))  return "[" + (data as Jsonable[]).map(x=>mk(x, ident)).join(",") + "]"

    return "{" + nl + space + Object.entries(data as Object).map(([k,v])=>{
      return k + ": " + mk(v, ident)
    }).join("," + nl + space) + nl + "}"

  }

  return HTML.pre(mk(data, 0))

}
