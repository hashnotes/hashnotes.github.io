// ts-note: notes/#798cf0fb947d80905f3e45f12528a0eb.ts
// js-note: notes/#44047ea445907dab377fbe6f4221441e.js


import { counterFn } from "./notes/#e4ed00ce23197e547addafe7c3bd34e9.ts";
import data from "./data.json"
import type { Graph } from "./pipeline.ts";
import { graph } from "./pipeline.ts";

export const view = ({update}: UPPER) => {

  console.log(graph("logic", []))
  console.log(JSON.stringify(graph("logic"), null, 2))

  const label = HTML.p("count: loading...");
  const localLabel = HTML.p("count: loading...");

  let v = -1;
  const increment = (delta: number) =>
    remote(counterFn)(delta).then(([count, version]) => {
      if (version < v) return;
      v = version;
      label.textContent = "count: " + count;
      update(label);
    });

  const localIncrement = (delta: number) => {
    localLabel.textContent = "count: " + counterFn(delta)[0];
    update(localLabel);
  };

  increment(0);
  localIncrement(0);

  return HTML.div(
    HTML.h2("counter example"),
    label,
    HTML.button("+1", { onclick: () => increment(1) }),
    HTML.button("-1", { onclick: () => increment(-1) }),
    HTML.h2("local counter"),
    localLabel,
    HTML.button("+1", { onclick: () => localIncrement(1) }),
    HTML.button("-1", { onclick: () => localIncrement(-1) }),
  );
};
