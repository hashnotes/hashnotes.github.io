import { addNote, callNote, getNote, SERVER, type ServerName } from "../src/db.ts";
import { type Jsonable, type Ref } from "@hashnotes/core/notes";

export type Testkit = {
  setServer: (name: ServerName) => Promise<ServerName>;
  addNote: (data: Jsonable) => Promise<Ref>;
  getNote: (hash: Ref) => Promise<Jsonable>;
  callNote: (fn: Ref | Jsonable, arg?: Ref | Jsonable) => Promise<Jsonable>;
};

export const createTestkit = (): Testkit => ({
  setServer: (name) => SERVER.set(name),
  addNote,
  getNote,
  callNote,
});
