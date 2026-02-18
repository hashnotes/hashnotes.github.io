

import { counterFn } from "./#e4ed00ce23197e547addafe7c3bd34e9.ts";
import data from "./#f39e8e928f5953a40e640ae0b34cdc3d.json"

export const view = ({update}: UPPER) => {

  console.log(data)

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
    HTML.h2("counter example"),
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
