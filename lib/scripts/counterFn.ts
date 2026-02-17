// ts-note: ts-notes/#a1ad448b7c114e3c5dd50dd7d6cb2407.ts
// js-note: js-notes/#03186aed4c434e463a967d222dabea4f.js
// Server function: increment a counter in the store.
// Compiles to one note. Called via remote() from the view.

export const counterFn = (arg: {delta: number}) => {
  let count = (store.get("counter") || 0) as number;
  count += arg.delta;
  store.set("counter", count);
  return count;
};
