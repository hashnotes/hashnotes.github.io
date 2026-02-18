// ts-note: notes/#07d2e1221835bd78b54dd936c1b94851.ts
// js-note: notes/#801ed0c087bd9dd9ec58ffa1eee29458.js


import { counterFn } from "./notes/#e4ed00ce23197e547addafe7c3bd34e9.ts";
import data from "./data.json"
import type { Graph } from "./pipeline.ts";
import { graph } from "./pipeline.ts";

export const view = ({update}: UPPER) => {

  console.log(graph(
    "logic", []
  ))
};
