// Server function: increment a counter in the store.

const counterFn = (arg:{delta:number}) => {
  let count = store.get("counter") || 0  + arg.delta;
  store.set("counter", count);
  return count
}


export {counterFn}
