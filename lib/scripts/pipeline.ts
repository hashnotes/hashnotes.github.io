// ts-note: notes/#ba084fd786538db4234d9c22ccd7559d.ts
// js-note: notes/#e17bce2eb689c9334e17c873520c9864.js



export type Graph = {

  $:string,
  srcs: Graph[],
  code: string

}

export const graph = (tag: string, srcs: Graph[] = [], code: string =""):Graph=>{
  return { $:tag, srcs, code }
}

