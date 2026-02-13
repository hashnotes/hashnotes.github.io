
import { hash128 } from "@hashnotes/core/notes";
import { addNote, getNote } from "../src/db.ts";

type Jsonable = string | number | boolean | null | Jsonable[] | { [key: string]: Jsonable };

const tojson = (x: Jsonable) => JSON.stringify(x, null, 2);

const E2E = (n: Jsonable)=>
  addNote(n)
  .then(h => {
    console.log(h)
    return getNote(h)
  })
  .then(result => {
    console.log(result)
    console.log(result === n ? "E2E success" : "E2E failure")
  })

const main = async () => {

  const sample = {
    title: "playground",
    nested: { a: 1, b: [1, 2, 3213], nonce: hash128(Date.now())},
  };

  E2E(222);
  E2E("222");

  console.log(sample)
  // console.log(await addNote(sample))
  // console.log(await addNote(22))
  // console.log(await addNote({title:22}))
  // addNote(sample)
};

main();
