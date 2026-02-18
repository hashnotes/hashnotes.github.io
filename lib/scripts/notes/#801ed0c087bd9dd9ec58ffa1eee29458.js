const __deps = ["#a6c815f113e0c11d31bd84bc93baffbc", "#f39e8e928f5953a40e640ae0b34cdc3d"];
const counterFn = getFuncSync("#a6c815f113e0c11d31bd84bc93baffbc");
const data = getDataSync("#f39e8e928f5953a40e640ae0b34cdc3d");
const {update} = arg;
console.log(data)
const label = HTML.p("count: loading...");
const localLabel = HTML.p("count: loading...");
let v = -1;
const increment = (delta        ) =>
    remote(counterFn, delta).then(([count, version]) => {
      if (version<v) return
      v = version
      label.textContent = "count: " + count
      update(label)
    });
const localIncrement = (delta       ) => {
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
