// Server function: increment a counter in the store.
// Compiles to one note. Called via remote() from the view.

export const counterFn = (arg: {delta: number}) => {
  let count = (store.get("counter") || 0) as number;
  count += arg.delta;
  store.set("counter", count);
  return count;
};
