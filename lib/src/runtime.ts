import { runWithFuelSharedAsync } from "@hashnotes/core/codegen";
import { fromjson, hashData, type Jsonable, type Ref } from "@hashnotes/core/notes";
import { addNote, asRef, callNote, deRef, getNote } from "./db.ts";

type ClientFuelOptions = {
  fuel?: number;
  env?: Record<string, unknown>;
};

const localStoreKey = (fnRef: Ref, key: Ref | Jsonable): string =>
  `${fnRef}|${hashData(key as Jsonable)}`;

export const callNoteClient = async (
  fn: Ref | Jsonable,
  arg?: Ref | Jsonable,
  options: ClientFuelOptions = {}
): Promise<Jsonable> => {
  const fuelRef = { value: options.fuel ?? 100000 };
  // Local runtime store is scoped to a single top-level client execution.
  // Each called function gets isolated space via fnRef prefix.
  const localStoreBacking = new Map<string, Jsonable>();

  const callLocal = async (fnInput: Ref | Jsonable, argInput: Ref | Jsonable): Promise<Jsonable> => {
    const fnRef = await asRef(fnInput);
    const argRef = await asRef(argInput);

    const fnNote = await deRef(fnRef);
    if (typeof fnNote !== "string") throw new Error("function note must resolve to a string");
    const argNote = await deRef(argRef);

    const store = {
      get: (key: Ref | Jsonable): Jsonable | undefined => {
        const skey = localStoreKey(fnRef, key);
        return localStoreBacking.get(skey);
      },
      set: (key: Ref | Jsonable, value: Ref | Jsonable): Jsonable => {
        const skey = localStoreKey(fnRef, key);
        localStoreBacking.set(skey, value as Jsonable);
        return value as Jsonable;
      },
    };

    const remote = async (remoteFn: Ref | Jsonable, remoteArg?: Ref | Jsonable): Promise<Jsonable> =>
      callNote(remoteFn, remoteArg === undefined ? null : remoteArg);

    const result = await runWithFuelSharedAsync(
      fnNote,
      fuelRef,
      {
        ...(options.env ?? {}),
        arg: argNote,
        argRef,
        call: callLocal,
        callNote: callLocal,
        remote,
        store,
        addNote,
        getNote,
        asRef,
        deref: deRef,
        hashData,
        fromjson,
      }
    );

    if ("err" in result) throw new Error(result.err);
    return result.ok as Jsonable;
  };

  return callLocal(fn, arg === undefined ? null : arg);
};
