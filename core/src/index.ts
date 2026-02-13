import { schema, table, t, SenderError } from "spacetimedb/server";
import { fromjson, hash128, hashData, isRef, tojson, type Jsonable, type Ref } from "./notes.ts";
import { runWithFuelShared } from "./codegen.ts";

const RefT = t.string();

const Note = table(
  {
    name: "note",
    public: true,
  }, {
    hash: RefT.primaryKey(),
    data: t.string(),
  }
);

const Store = table(
  {
    name: "store",
    public: false,
  }, {
    key: RefT.primaryKey(),
    value: t.string()
  }
)

export const spacetimedb = schema(Note, Store);

spacetimedb.view(
  { name: "note_count", public: true },
  t.array(t.object("NoteCountRow", { count: t.u64() })),
  (ctx) => [{ count: ctx.db.note.count() }]
);

spacetimedb.reducer(
  "add_note",
  { data: t.string() },
  (ctx, { data }) => {
    let parsed: Jsonable;
    try {
      parsed = fromjson(data);
    } catch (e) {
      throw new SenderError(`invalid json: ${String(e)}`);
    }

    const hash = hashData(parsed);
    if (ctx.db.note.hash.find(hash)) return;
    ctx.db.note.insert({ hash, data });
  }
);


spacetimedb.procedure(
  "get_note",
  { hash: RefT },
  t.string(),
  (ctx, { hash }) => ctx.withTx((tx) => {
    if (!isRef(hash)) throw new SenderError("hash must be a #ref");
    const row = tx.db.note.hash.find(hash as Ref);
    if (!row) throw new SenderError(`note not found: ${hash}`);
    return row.data;
  })
);

spacetimedb.procedure(
  "call_note",
  {
    fn: RefT,
    arg: RefT,
  },
  t.string(),
  (ctx, { fn, arg }) => ctx.withTx((tx) => {
    const fuelRef = { value: 100000 };

    const getNote = (ref: Ref): Jsonable => {
      const row = tx.db.note.hash.find(ref);
      if (!row) throw new SenderError(`note not found: ${ref}`);
      return fromjson(row.data);
    };

    const addNote = (data: Jsonable): Ref => {
      const hash = hashData(data);
      if (!tx.db.note.hash.find(hash)) tx.db.note.insert({ hash, data: tojson(data) });
      return hash;
    };

    const asRef = (value: Ref | Jsonable): Ref => isRef(value) ? value : addNote(value);
    const deref = (value: Ref | Jsonable): Jsonable => isRef(value) ? getNote(value) : value;

    const callNote = (fnInput: Ref | Jsonable, argInput: Ref | Jsonable): Jsonable => {
      const fnRef = asRef(fnInput);
      const argRef = asRef(argInput);
      const fnNote = deref(fnRef);
      if (typeof fnNote !== "string") throw new SenderError("function note must resolve to a string");
      const argNote = deref(argRef);

      const storekey = (key: Ref | Jsonable): Ref => hash128(hashData(fnRef), asRef(key));

      const baseEnv =
        argNote && typeof argNote === "object" && !Array.isArray(argNote)
          ? argNote as Record<string, unknown>
          : { arg: argNote };

      const store = {
        get: (key: Ref | Jsonable) => {
          const valueRef = tx.db.store.key.find(storekey(key))?.value;
          if (valueRef === undefined) return undefined;
          if (!isRef(valueRef)) throw new SenderError("store contains non-ref value");
          return getNote(valueRef);
        },
        set: (key: Ref | Jsonable, value: Ref | Jsonable): Ref => {
          const skey = storekey(key);
          const valueRef = asRef(value);
          if (tx.db.store.key.find(skey)) tx.db.store.key.update({ key: skey, value: valueRef });
          else tx.db.store.insert({ key: skey, value: valueRef });
          return valueRef;
        }
      };

      const result = runWithFuelShared(
        fnNote,
        fuelRef,
        { ...baseEnv, arg: argNote, argRef, call: callNote, callNote, store, addNote, getNote, asRef, deref }
      );
      console.log(tojson(result as Jsonable));
      if ("ok" in result) return result.ok as Jsonable;
      if ("err" in result) throw new SenderError(`error executing note: ${result.err}`);
      throw new SenderError("unknown error executing note");
    };


    let ref = addNote(callNote(fn, arg));
    return ref

  })!
);
