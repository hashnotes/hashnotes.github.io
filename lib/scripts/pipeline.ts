// ts-note: notes/#a782af823fd33aacde46fbd74c0ee269.ts
// js-note: notes/#e17bce2eb689c9334e17c873520c9864.js



// export type Graph = {

//   $:string,
//   srcs: Graph[],
//   code: string

// }

type Schema = Jsonable;

export type Graph = {
  $: "input",
} | {
  $: "logic",
  inputs: {[key: string]: Graph},
  code: string
} | {
  $: "loop",
  input: Graph,
  condition: Graph,
  body: Graph,
}



// export const  graph = (tag: string, srcs: Graph[] = [], code: string =""):Graph=>{
//   return { $:tag, srcs, code }
// }



