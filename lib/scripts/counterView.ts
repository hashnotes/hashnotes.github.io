// ts-note: ts-notes/#8441bcfbcd5616c51b9f383361d62e8c.ts
// js-note: js-notes/#3f9c4967eef61ffe8a990a3201ae59df.js
// View module: counter UI.
// import counterFn → getNoteSync("#hash") for local use
// remote(counterFn, arg) → remote("#hash", arg) at compile time


// import "./ts-notes/#2e0a1c919e70e8e8d274b5467990ebe3.ts"


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
    HTML.h2("counter example cleanup"),
    label,
    HTML.button("+1", { onclick: () => increment(1) }),
    HTML.button("-1", { onclick: () => increment(-1) }),
    HTML.h2("local counter"),
    localLabel,
    HTML.button("+1", { onclick: () => localIncrement(1) }),
    HTML.button("-1", { onclick: () => localIncrement(-1) })

  );
};
