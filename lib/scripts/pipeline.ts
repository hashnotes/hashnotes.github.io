// ts-note: notes/#330d1015cecb9feeb90edd46df3e0373.ts
// js-note: notes/#76f42875a897624143c34684a58a1bd2.js



export type Graph = {

  $:string,
  srcs: Graph[],
  code: string

}

export const graph = (tag: string, srcs: Graph[] = [], code: string =""):Graph=>{
  return { $:tag, srcs, code }
}

