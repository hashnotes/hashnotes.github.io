
import { hash128 } from "@hashnotes/core/notes";
import { addNote, callNote, getNote, SERVER } from "../src/db.ts";

type Jsonable = string | number | boolean | null | Jsonable[] | { [key: string]: Jsonable };

SERVER.set("local")

const E2E = (n: Jsonable)=>
  addNote(n)
  .then(h => {
    return getNote(h, {skipCache: true})
  })
  .then(result => {
    let [a,b] = [result, n].map(x => JSON.stringify(x))
    console.log(a == b ? "✓" : "✗", a, b)
  })

const fe2e = (n: Jsonable) =>
  addNote(n)
  .then(h => {
    return callNote(`
      store.set("test-key", arg);
      return store.get("test-key");
    `, h)
  })
  .then(result => {
    let [a,b] = [result, n].map(x => JSON.stringify(x))
    console.log(a == b ? `✓ ${a}`: `✗ ${a} != ${b}`)
  })

const main = async () => {

  const sample = {
    title: "playground",
    nested: { a: 1, b: [1, 2, 3213] },
  };

  await E2E(222);
  await E2E("222");
  await E2E([[1,2]]);
  await E2E(sample)

  console.log(await callNote(
    "return arg" , 22
  ))

  await fe2e(222)
  await fe2e([1,2,3])
};

main();
