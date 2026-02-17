// View module: counter UI.
// import counterFn → getNoteSync("#hash") for local use
// remote(counterFn, arg) → remote("#hash", arg) at compile time

import { counterFn } from "./#a1ad448b7c114e3c5dd50dd7d6cb2407";

export const view = (upper: UPPER) => {
  const label = HTML.p("count: loading...");
  const localLabel = HTML.p("count: loading...");

  const increment = (delta: number) =>
    remote(counterFn, { delta }).then((count) => {
      label.textContent = "count: " + count;
      upper.update(label);
    });


  const localIncrement = async (delta:number) => {
    localLabel.textContent = "local count: " + counterFn({delta});
    upper.update(localLabel)
  }

  increment(0);
  // localIncrement(0);

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
