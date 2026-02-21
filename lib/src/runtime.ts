import { runWithFuelShared, runWithFuelSharedAsync } from "@hashnotes/core/codegen";
import { fromjson, hashData, type Jsonable, type Ref } from "@hashnotes/core/notes";
import { addNote, asRef, callNote, deRef, getNote } from "./db.ts";
import { openRouterRequest } from "./openrouter.ts";
import { HTML, type View, type ViewContext, type VDom } from "./views.ts";

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

type LocalExecutor = (fn: Ref | Jsonable, args: Ref | Jsonable) => Promise<unknown>;

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
  const promptUser = (message: string, defaultValue = ""): string | null => {
    try {
      const p = (globalThis as { prompt?: (m: string, d?: string) => string | null }).prompt;
      if (typeof p === "function") return p(message, defaultValue);
    } catch {
      // no-op
    }
    return null;
  };

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

  const callLocal: LocalExecutor = async (fnInput: Ref | Jsonable, argsInput: Ref | Jsonable): Promise<unknown> => {
    const fnRef = await asRef(fnInput);
    const argsRef = await asRef(argsInput);

    const fnNote = await deRef(fnRef);
    if (typeof fnNote !== "string") throw new Error("function note must resolve to a string");
    const argsNote = await deRef(argsRef);
    const args = Array.isArray(argsNote) ? argsNote : [argsNote];

    const store = makeStore(fnRef, memStore, ls);
    const remote = (fn: unknown): (...remoteArgs: (Ref | Jsonable)[]) => Promise<Jsonable> => {
      const hash = fnToHash.get(fn as Function) ?? fn;
      return (...remoteArgs: (Ref | Jsonable)[]) => callNote(hash as Ref | Jsonable, remoteArgs);
    };

    /** Return a callable wrapper that runs the dep's body with args array, own store. */
    const getFuncSync = (ref: string): (...callArgs: unknown[]) => unknown => {
      const src = noteCache.get(ref);
      if (src === undefined) throw new Error(`getFuncSync: note ${ref} not in cache`);
      if (typeof src !== "string") throw new Error(`getFuncSync: note ${ref} is not code`);
      const fn = (...callArgs: unknown[]) => {
        const depStore = makeStore(ref, memStore, ls);
        const result = runWithFuelShared(src, fuelRef, { ...env, args: callArgs, store: depStore });
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
      args,
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
      promptUser,
      openRouterRequest,
      HTML,
      JSON,
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
  args?: (Ref | Jsonable)[],
  options: ClientFuelOptions = {}
): Promise<Jsonable> => {
  const callLocal = createLocalExecutor(options);
  return (await callLocal(fn, args ?? [])) as Jsonable;
};

export const callViewClient = async (
  fn: Ref | Jsonable,
  _args?: (Ref | Jsonable)[],
  options: ClientFuelOptions = {}
): Promise<View> => {
  // View notes have inlined bodies — args[0] is the upper object.
  // Pre-fetch dep sources async, then return a sync wrapper.
  const fuelBudget = options.fuel ?? 100000;
  const fuelRef = { value: fuelBudget };
  const noteCache = new Map<string, Jsonable>();
  const memStore = new Map<string, Jsonable>();
  const ls = (() => {
    try { return typeof localStorage !== "undefined" ? localStorage : undefined; } catch { return undefined; }
  })();
  const promptUser = (message: string, defaultValue = ""): string | null => {
    try {
      const p = (globalThis as { prompt?: (m: string, d?: string) => string | null }).prompt;
      if (typeof p === "function") return p(message, defaultValue);
    } catch {
      // no-op
    }
    return null;
  };

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
  const remote = (fn: unknown): (...remoteArgs: (Ref | Jsonable)[]) => Promise<Jsonable> => {
    const hash = fnToHash.get(fn as Function) ?? fn;
    return (...remoteArgs: (Ref | Jsonable)[]) => callNote(hash as Ref | Jsonable, remoteArgs);
  };

  /** Return a callable wrapper that runs the dep's body with args array, own store. */
  const getFuncSync = (ref: string): (...callArgs: unknown[]) => unknown => {
    const src = noteCache.get(ref);
    if (src === undefined) throw new Error(`getFuncSync: note ${ref} not in cache`);
    if (typeof src !== "string") throw new Error(`getFuncSync: note ${ref} is not code`);
    const fn = (...callArgs: unknown[]) => {
      const depStore = makeStore(ref, memStore, ls);
      const result = runWithFuelShared(src, fuelRef, { ...baseEnv, args: callArgs, store: depStore });
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
    remote, getFuncSync, getDataSync, store, addNote, getNote, asRef, deref: deRef, hashData, fromjson, promptUser, openRouterRequest, HTML, JSON, console,
  };

  // Inlined body — args[0] is the window object.
  return (upper: ViewContext): VDom => {
    // Install callback on the actual ViewContext object used by renderDom event dispatch.
    upper.onUserEvent = () => {
      fuelRef.value = fuelBudget;
    };
    const result = runWithFuelShared(fnNote, fuelRef, { ...baseEnv, args: [upper] });
    if ("err" in result) throw new Error(result.err);
    return result.ok as VDom;
  };
};
