// ts-note: ts-notes/#e4ed00ce23197e547addafe7c3bd34e9.ts
// js-note: js-notes/#a6c815f113e0c11d31bd84bc93baffbc.js
// Server function: increment a counter in the store.
// Compiles to one note. Called via remote() from the view.

export const counterFn = (arg: number) => {

  let [count, version] = store.get("key") as [number, number] || [0,0]
  count += arg;
  version += 1; 
  store.set("key", [count,version])
  return [count, version] as [number, number];
};
  