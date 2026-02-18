// Server function: increment a counter in the store.
// Compiles to one note. Called via remote() from the view.

export const counterFn = (arg: number) => {

  let [count, version] = store.get("key") as [number, number] || [0,0]
  count += arg;
  version += 1; 
  store.set("key", [count,version])
  return [count, version] as [number, number];
};
  