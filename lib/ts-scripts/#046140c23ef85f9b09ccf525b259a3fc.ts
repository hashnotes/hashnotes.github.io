// View module: counter UI.
// import counterFn → getNoteSync("#hash") for local use
// remote(counterFn, arg) → remote("#hash", arg) at compile time

import { counterFn } from "./#a1ad448b7c114e3c5dd50dd7d6cb2407";

export const view = (upper: UPPER) => {
  const label = HTML.p("count: loading...");

  const inc = (delta: number) =>
    remote(counterFn, { delta }).then((count) => {
      label.textContent = "count: " + count;
      upper.update(label);
    });

  inc(0);

  return HTML.div(
    HTML.h2("counter example"),
    label,
    HTML.button("+1", { onclick: () => inc(1) }),
    HTML.button("-1", { onclick: () => inc(-1) })
  );
};
