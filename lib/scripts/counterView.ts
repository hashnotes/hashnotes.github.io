// ts-note: ts-notes/#4e8b1995244d419b7894f17ae11ef4ee.ts
// js-note: js-notes/#6e856fbf4b49cc683cb444320c2902ff.js


import { counterFn } from "./ts-notes/#e4ed00ce23197e547addafe7c3bd34e9";

export const view = ({update}: UPPER) => {
  const label = HTML.p("count: loading...");
  const localLabel = HTML.p("count: loading...");

  let v = -1;  
  const increment = (delta: number) =>
    remote(counterFn, delta).then(([count, version]) => {
      if (version<v) return
      v = version
      label.textContent = "count: " + count
      update(label)
    });

  const localIncrement = (delta:number) => {
    localLabel.textContent = "count: " + counterFn(delta)[0]
    update(localLabel)
  }

  increment(0);
  localIncrement(0);

  return HTML.div(
    HTML.h2("counter example poop"),
    label,
    HTML.button("+1", { onclick: () => {
      increment(1);
    } }),
    HTML.button("-1", { onclick: () => increment(-1) }),
    HTML.h2("local counter"),
    localLabel,
    HTML.button("+1", { onclick: () => localIncrement(1) }),
    HTML.button("-1", { onclick: () => localIncrement(-1) })

  );
};
