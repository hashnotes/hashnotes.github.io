// ts-note: ts-notes/#6e80a64930274308363717d532297f79.ts
// js-note: js-notes/#599c2b756995f4ea73bbfa7d42b98c93.js
// View module: counter UI.
// import counterFn → getNoteSync("#hash") for local use
// remote(counterFn, arg) → remote("#hash", arg) at compile time


// ./tsnotes.ts


import { counterFn } from "./counterFn";

export const view = ({update}: UPPER) => {
  const label = HTML.p("count: loading...");
  const localLabel = HTML.p("count: loading...");

  const increment = (delta: number) =>
    remote(counterFn, { delta }).then((count) => {
      label.textContent = "count: " + count;
      update(label)
    });


  const localIncrement = (delta:number) => {
    localLabel.textContent = "local count: " + counterFn({delta});
    update(localLabel)
  }

  increment(0);
  localIncrement(0);

  return HTML.div(
    HTML.h2("counter example BAM22"),
    label,
    HTML.button("+1", { onclick: () => increment(1) }),
    HTML.button("-1", { onclick: () => increment(-1) }),
    HTML.h2("local counter"),
    localLabel,
    HTML.button("+1", { onclick: () => localIncrement(1) }),
    HTML.button("-1", { onclick: () => localIncrement(-1) })

  );
};
