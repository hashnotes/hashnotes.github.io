import { runWithFuelShared, runWithFuelSharedAsync } from "@hashnotes/core/codegen";
import { fromjson, hashData, type Jsonable, type Ref } from "@hashnotes/core/notes";
import { addNote, asRef, callNote, deRef, getNote } from "./db.ts";
import { HTML, type UPPER, type VDom } from "./views.ts";

type ClientFuelOptions = {
  fuel?: number;
  env?: Record<string, unknown>;
};

const localStoreKey = (fnRef: string, key: Ref | Jsonable): string =>
  `${fnRef}|${hashData(key as Jsonable)}`;

/** Create a store scoped to a specific note ref. */
const makeStore = (
  noteRef: string,
  memStore: Map<string, Jsonable>,
  ls: Storage | undefined,
) => ({
  get: (key: Ref | Jsonable): Jsonable | undefined => {
    const skey = `hashnotes:store:${localStoreKey(noteRef, key)}`;
    const raw = ls?.getItem(skey);
    if (raw != null) return fromjson(raw) as Jsonable;
    return memStore.get(skey);
  },
  set: (key: Ref | Jsonable, value: Ref | Jsonable): Jsonable => {
    const skey = `hashnotes:store:${localStoreKey(noteRef, key)}`;
    const v = value as Jsonable;
    if (ls) ls.setItem(skey, JSON.stringify(v));
    else memStore.set(skey, v);
    return v;
  },
});

type LocalExecutor = (fn: Ref | Jsonable, arg: Ref | Jsonable) => Promise<unknown>;

/**
 * Parse __deps from a compiled note body.
 * Looks for `const __deps = ["#hash1", "#hash2"];` as the first line.
 */
const parseDeps = (src: string): string[] => {
  const m = src.match(/^const __deps = \[([^\]]*)\];/);
  if (!m) return [];
  return [...m[1].matchAll(/"([^"]+)"/g)].map(x => x[1]);
};

const createLocalExecutor = (options: ClientFuelOptions): LocalExecutor => {
  const fuelRef = { value: options.fuel ?? 100000 };
  const memStore = new Map<string, Jsonable>();
  const ls = (() => {
    try { return typeof localStorage !== "undefined" ? localStorage : undefined; } catch { return undefined; }
  })();

  // Cache: hash → note data (string for code, any Jsonable for data)
  const noteCache = new Map<string, Jsonable>();

  // Map from wrapper function → hash (for remote() to resolve)
  const fnToHash = new Map<Function, string>();

  /** Recursively fetch dep sources into noteCache (no execution). */
  const prefetch = async (ref: string): Promise<void> => {
    if (noteCache.has(ref)) return;
    const data = await deRef(ref as Ref);
    noteCache.set(ref, data as Jsonable);
    if (typeof data === "string") {
      for (const dep of parseDeps(data)) await prefetch(dep);
    }
  };

  const callLocal: LocalExecutor = async (fnInput: Ref | Jsonable, argInput: Ref | Jsonable): Promise<unknown> => {
    const fnRef = await asRef(fnInput);
    const argRef = await asRef(argInput);

    const fnNote = await deRef(fnRef);
    if (typeof fnNote !== "string") throw new Error("function note must resolve to a string");
    const argNote = await deRef(argRef);

    const store = makeStore(fnRef, memStore, ls);

    const remote = async (fn: unknown, remoteArg?: Ref | Jsonable): Promise<Jsonable> => {
      const hash = fnToHash.get(fn as Function) ?? fn;
      return callNote(hash as Ref | Jsonable, remoteArg === undefined ? null : remoteArg);
    };

    /** Return a callable wrapper that runs the dep's body with arg = callArg, own store. */
    const getFuncSync = (ref: string): (callArg: unknown) => unknown => {
      const src = noteCache.get(ref);
      if (src === undefined) throw new Error(`getFuncSync: note ${ref} not in cache`);
      if (typeof src !== "string") throw new Error(`getFuncSync: note ${ref} is not code`);
      const fn = (callArg: unknown) => {
        const depStore = makeStore(ref, memStore, ls);
        const result = runWithFuelShared(src, fuelRef, { ...env, arg: callArg, store: depStore });
        if ("err" in result) throw new Error(result.err);
        return result.ok;
      };
      fnToHash.set(fn, ref);
      return fn;
    };

    /** Return JSON data from a prefetched note. */
    const getDataSync = (ref: string): unknown => {
      const data = noteCache.get(ref);
      if (data === undefined) throw new Error(`getDataSync: note ${ref} not in cache`);
      return data;
    };

    const env: Record<string, unknown> = {
      ...(options.env ?? {}),
      arg: argNote,
      argRef,
      call: callLocal,
      callNote: callLocal,
      remote,
      store,
      getFuncSync,
      getDataSync,
      addNote,
      getNote,
      asRef,
      deref: deRef,
      hashData,
      fromjson,
      HTML,
      console,
    };

    // Pre-fetch all dep sources before executing
    const deps = parseDeps(fnNote);
    for (const dep of deps) await prefetch(dep);

    const result = await runWithFuelSharedAsync(
      fnNote,
      fuelRef,
      env,
    );

    if ("err" in result) throw new Error(result.err);
    return result.ok;
  };

  return callLocal;
};

export const callNoteClient = async (
  fn: Ref | Jsonable,
  arg?: Ref | Jsonable,
  options: ClientFuelOptions = {}
): Promise<Jsonable> => {
  const callLocal = createLocalExecutor(options);
  return (await callLocal(fn, arg === undefined ? null : arg)) as Jsonable;
};

export const callViewClient = async (
  fn: Ref | Jsonable,
  _arg?: Ref | Jsonable,
  options: ClientFuelOptions = {}
): Promise<(upper: UPPER) => VDom> => {
  // View notes have inlined bodies — `arg` is the upper object.
  // Pre-fetch dep sources async, then return a sync wrapper.
  const fuelRef = { value: options.fuel ?? 100000 };
  const noteCache = new Map<string, Jsonable>();
  const memStore = new Map<string, Jsonable>();
  const ls = (() => {
    try { return typeof localStorage !== "undefined" ? localStorage : undefined; } catch { return undefined; }
  })();

  // Map from wrapper function → hash (for remote() to resolve)
  const fnToHash = new Map<Function, string>();

  const fnRef = await asRef(fn);
  const fnNote = await deRef(fnRef);
  if (typeof fnNote !== "string") throw new Error("view note must resolve to a string");

  /** Recursively fetch dep data into noteCache (no execution). */
  const prefetch = async (ref: string): Promise<void> => {
    if (noteCache.has(ref)) return;
    const data = await deRef(ref as Ref);
    noteCache.set(ref, data as Jsonable);
    if (typeof data === "string") {
      for (const dep of parseDeps(data)) await prefetch(dep);
    }
  };
  for (const dep of parseDeps(fnNote)) await prefetch(dep);

  const store = makeStore(fnRef, memStore, ls);

  const remote = async (fn: unknown, remoteArg?: Ref | Jsonable): Promise<Jsonable> => {
    const hash = fnToHash.get(fn as Function) ?? fn;
    return callNote(hash as Ref | Jsonable, remoteArg === undefined ? null : remoteArg);
  };

  /** Return a callable wrapper that runs the dep's body with arg = callArg, own store. */
  const getFuncSync = (ref: string): (callArg: unknown) => unknown => {
    const src = noteCache.get(ref);
    if (src === undefined) throw new Error(`getFuncSync: note ${ref} not in cache`);
    if (typeof src !== "string") throw new Error(`getFuncSync: note ${ref} is not code`);
    const fn = (callArg: unknown) => {
      const depStore = makeStore(ref, memStore, ls);
      const result = runWithFuelShared(src, fuelRef, { ...baseEnv, arg: callArg, store: depStore });
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    };
    fnToHash.set(fn, ref);
    return fn;
  };

  /** Return JSON data from a prefetched note. */
  const getDataSync = (ref: string): unknown => {
    const data = noteCache.get(ref);
    if (data === undefined) throw new Error(`getDataSync: note ${ref} not in cache`);
    return data;
  };

  const baseEnv: Record<string, unknown> = {
    ...(options.env ?? {}),
    remote, getFuncSync, getDataSync, store, addNote, getNote, asRef, deref: deRef, hashData, fromjson, HTML, console,
  };

  // Inlined body — arg is the upper object.
  return (upper: UPPER): VDom => {
    const result = runWithFuelShared(fnNote, fuelRef, { ...baseEnv, arg: upper });
    if ("err" in result) throw new Error(result.err);
    return result.ok as VDom;
  };
};
