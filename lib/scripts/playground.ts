
import { hash128 } from "@hashnotes/core/notes";
import { addNote, callNote, getNote, SERVER } from "../src/db.ts";

type Jsonable = string | number | boolean | null | Jsonable[] | { [key: string]: Jsonable };

SERVER.set("local")

const E2E = (n: Jsonable)=>
  addNote(n)
  .then(h => {
    console.log(h)
    return getNote(h, {skipCache: true})
  })
  .then(result => {
    console.log(result)
    let [a,b] = [result, n].map(x => JSON.stringify(x))
    console.log(a == b ? "✓" : "✗", a, b)
  })

const main = async () => {

  const sample = {
    title: "playground",
    nested: { a: 1, b: [1, 2, 3213], nonce: hash128(Date.now())},
  };

  E2E(222);
  E2E("222");
  E2E([[1,2]]);

  console.log(sample)

  console.log(await callNote(
    "return [[532]]"
  ))
  // console.log(await addNote(sample))
  // console.log(await addNote(22))
  // console.log(await addNote({title:22}))
  // addNote(sample)
};

main();
