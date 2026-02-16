import { runWithFuelSharedAsync } from "@hashnotes/core/codegen";
import { fromjson, hashData, type Jsonable, type Ref } from "@hashnotes/core/notes";
import { addNote, asRef, callNote, deRef, getNote } from "./db.ts";
import { HTML, type UPPER, type VDom } from "./views.ts";

type ClientFuelOptions = {
  fuel?: number;
  env?: Record<string, unknown>;
};

const localStoreKey = (fnRef: Ref, key: Ref | Jsonable): string =>
  `${fnRef}|${hashData(key as Jsonable)}`;

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

  // Cache: hash → executed result (the function the note exports)
  const noteResultCache = new Map<string, unknown>();

  /**
   * Pre-load a note and all its deps into the cache.
   * Recursively walks __deps, executes leaves first, so getNoteSync always hits.
   */
  const preload = async (ref: string, env: Record<string, unknown>): Promise<void> => {
    if (noteResultCache.has(ref)) return;
    const src = await deRef(ref as Ref);
    if (typeof src !== "string") throw new Error("preload: note must be a string");
    // Recursively preload deps first
    const deps = parseDeps(src);
    for (const dep of deps) await preload(dep, env);
    // Execute the note — its getNoteSync calls will hit the cache
    const res = await runWithFuelSharedAsync(src, fuelRef, env);
    if ("err" in res) throw new Error(res.err);
    noteResultCache.set(ref, res.ok);
  };

  const callLocal: LocalExecutor = async (fnInput: Ref | Jsonable, argInput: Ref | Jsonable): Promise<unknown> => {
    const fnRef = await asRef(fnInput);
    const argRef = await asRef(argInput);

    const fnNote = await deRef(fnRef);
    if (typeof fnNote !== "string") throw new Error("function note must resolve to a string");
    const argNote = await deRef(argRef);

    const store = {
      get: (key: Ref | Jsonable): Jsonable | undefined => {
        const skey = `hashnotes:store:${localStoreKey(fnRef, key)}`;
        const raw = ls?.getItem(skey);
        if (raw != null) return fromjson(raw) as Jsonable;
        return memStore.get(skey);
      },
      set: (key: Ref | Jsonable, value: Ref | Jsonable): Jsonable => {
        const skey = `hashnotes:store:${localStoreKey(fnRef, key)}`;
        const v = value as Jsonable;
        if (ls) ls.setItem(skey, JSON.stringify(v));
        else memStore.set(skey, v);
        return v;
      },
    };

    const remote = async (remoteFn: Ref | Jsonable, remoteArg?: Ref | Jsonable): Promise<Jsonable> =>
      callNote(remoteFn, remoteArg === undefined ? null : remoteArg);

    const use = async (ref: Ref): Promise<unknown> => {
      if (noteResultCache.has(ref)) return noteResultCache.get(ref);
      const src = await deRef(ref);
      if (typeof src !== "string") throw new Error("use: note must resolve to a string");
      const res = await runWithFuelSharedAsync(src, fuelRef, env);
      if ("err" in res) throw new Error(res.err);
      noteResultCache.set(ref, res.ok);
      return res.ok;
    };

    /** Synchronous cached lookup — deps are guaranteed pre-loaded. */
    const getNoteSync = (ref: string): unknown => {
      if (noteResultCache.has(ref)) return noteResultCache.get(ref);
      throw new Error(`getNoteSync: note ${ref} not in cache`);
    };

    const env: Record<string, unknown> = {
      ...(options.env ?? {}),
      arg: argNote,
      argRef,
      call: callLocal,
      callNote: callLocal,
      remote,
      store,
      use,
      getNoteSync,
      addNote,
      getNote,
      asRef,
      deref: deRef,
      hashData,
      fromjson,
      HTML,
    };

    // Pre-load all deps before executing
    const deps = parseDeps(fnNote);
    for (const dep of deps) await preload(dep, env);

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
  arg?: Ref | Jsonable,
  options: ClientFuelOptions = {}
): Promise<(upper: UPPER) => VDom> => {
  const callLocal = createLocalExecutor(options);
  const result = await callLocal(fn, arg === undefined ? null : arg);
  // Support raw view fn, {view: fn}, or {default: fn}
  const view = typeof result === "function" ? result
    : result && typeof result === "object" && typeof (result as any).view === "function" ? (result as any).view
    : result && typeof result === "object" && typeof (result as any).default === "function" ? (result as any).default
    : null;
  if (!view) {
    throw new Error("view note must return (upper) => VDom, or {view: fn}, or {default: fn}");
  }
  return view as (upper: UPPER) => VDom;
};
