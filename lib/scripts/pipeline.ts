// ts-note: notes/#0508ee6e4180b1ea6f685ac6bd6315cd.ts
// js-note: notes/#76f42875a897624143c34684a58a1bd2.js



export type Graph = {

  $:string,
  srcs: Graph[],
  code: string

}

export const  graph = (tag: string, srcs: Graph[] = [], code: string =""):Graph=>{
  return { $:tag, srcs, code }
}

