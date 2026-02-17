// ts-note: ts-notes/#0f42ffe9974f38c1c835ee9880fe5ef8.ts
// js-note: js-notes/#4eb02816aec07b67ecec800cb83949de.js
// Server function: increment a counter in the store.
// Compiles to one note. Called via remote() from the view.

export const counterFn = (arg: {delta: number, v: number}) => {
  let count = (store.get("counter") || 0) as number;
  count += arg.delta;
  store.set("counter", count);
  return {count, v: arg.v};
};
