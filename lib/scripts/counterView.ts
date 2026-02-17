// ts-note: ts-notes/#04cebc474837532104b59f8f8b19ec3a.ts
// js-note: js-notes/#b46032f80e043f763bbe5efafe609e47.js
// View module: counter UI.
// import counterFn → getNoteSync("#hash") for local use
// remote(counterFn, arg) → remote("#hash", arg) at compile time
// ./tsnotes.ts


import { counterFn } from "./counterFn";

export const view = ({update}: UPPER) => {
  const label = HTML.p("count: loading...");
  const localLabel = HTML.p("count: loading...");

  let v = 0;
  const increment = (delta: number) =>
    remote(counterFn, { delta, v:v+1 }).then(({count, v:newv}) => {
      if (newv < v) return
      v = newv;
      label.textContent = "count: " + count;
      update(label)
    });

  const localIncrement = (delta:number) => {
    localLabel.textContent = "countss: " + counterFn({delta, v:0}).count;
    update(localLabel)
  }

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
    HTML.button("-1", { onclick: () => localIncrement(-1) })

  );
};
