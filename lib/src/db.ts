import { fromjson, hashData, isRef, tojson, type Jsonable, type Ref } from "@hashnotes/core/notes";

// Section: public types and constants
export type ServerName = "local" | "maincloud";

type PersistedCache = {
  tokens: Partial<Record<ServerName, string>>;
  notes: Partial<Record<ServerName, Record<string, Jsonable>>>;
};

const DB_NAME = "hashnotes";
const URL_PRESETS: Record<ServerName, string> = {
  local: "http://localhost:3000",
  maincloud: "https://maincloud.spacetimedb.com",
};

// Section: runtime environment helpers
const ls = typeof localStorage !== "undefined" ? localStorage : null;
const isNodeRuntime = ls === null && typeof process !== "undefined" && !!process.versions?.node;
const tokenKey = (server: ServerName) => `access_token:${server}`;

const defaultServer = (): ServerName =>
  (ls?.getItem("db_preset") === "local" ? "local" : "maincloud");

// Section: node-persisted cache (tokens + immutable notes)
const emptyCache = (): PersistedCache => ({ tokens: {}, notes: {} });
let persistedCachePromise: Promise<PersistedCache> | null = null;
let persistQueue: Promise<void> = Promise.resolve();

const nodeCachePath = async (): Promise<string> => {
  const [{ tmpdir }, { join }] = await Promise.all([import("node:os"), import("node:path")]);
  return join(tmpdir(), "hashnotes-lib-cache.json");
};

const loadPersistedCache = async (): Promise<PersistedCache> => {
  if (!isNodeRuntime) return emptyCache();
  if (persistedCachePromise) return persistedCachePromise;

  persistedCachePromise = (async () => {
    try {
      const { readFile } = await import("node:fs/promises");
      const raw = await readFile(await nodeCachePath(), "utf8");
      const parsed = JSON.parse(raw) as Partial<PersistedCache>;
      return { tokens: parsed.tokens ?? {}, notes: parsed.notes ?? {} };
    } catch {
      return emptyCache();
    }
  })();

  return persistedCachePromise;
};

const persistCache = async (): Promise<void> => {
  if (!isNodeRuntime) return;
  persistQueue = persistQueue.then(async () => {
    const cache = await loadPersistedCache();
    const [{ mkdir, writeFile }, { dirname }] = await Promise.all([
      import("node:fs/promises"),
      import("node:path"),
    ]);
    const path = await nodeCachePath();
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(cache), "utf8");
  });
  await persistQueue;
};

const getCachedToken = async (server: ServerName): Promise<string | null> => {
  if (ls) return ls.getItem(tokenKey(server));
  return (await loadPersistedCache()).tokens[server] ?? null;
};

const setCachedToken = async (server: ServerName, token: string | null): Promise<void> => {
  if (ls) {
    if (token) ls.setItem(tokenKey(server), token);
    else ls.removeItem(tokenKey(server));
    return;
  }

  const cache = await loadPersistedCache();
  if (token) cache.tokens[server] = token;
  else delete cache.tokens[server];
  await persistCache();
};

const getCachedNotes = async (server: ServerName): Promise<Record<string, Jsonable>> => {
  if (!isNodeRuntime) return {};
  return (await loadPersistedCache()).notes[server] ?? {};
};

const setCachedNote = async (server: ServerName, hash: Ref, data: Jsonable): Promise<void> => {
  if (!isNodeRuntime) return;
  const cache = await loadPersistedCache();
  const bucket = cache.notes[server] ?? (cache.notes[server] = {});
  bucket[hash] = data;
  await persistCache();
};

// Section: server/session state
let currentServer: ServerName = defaultServer();
let baseUrl = URL_PRESETS[currentServer];
let accessToken: string | null = null;

const noteCache = new Map<Ref, Jsonable>();
const addInFlight = new Map<Ref, Promise<Ref>>();
const getInFlight = new Map<Ref, Promise<Jsonable>>();
let hydratedServer: ServerName | null = null;

const hydrateNoteCache = async (): Promise<void> => {
  if (hydratedServer === currentServer) return;
  noteCache.clear();
  for (const [hash, data] of Object.entries(await getCachedNotes(currentServer))) {
    noteCache.set(hash as Ref, data);
  }
  hydratedServer = currentServer;
};

export const SERVER = {
  value: currentServer,
  get: (): ServerName => currentServer,
  set: async (value: ServerName) => {
    currentServer = value;
    SERVER.value = value;
    baseUrl = URL_PRESETS[value];
    ls?.setItem("db_preset", value);
    accessToken = await getCachedToken(value);
    hydratedServer = null;
    await hydrateNoteCache();
    return value;
  },
};

// Section: transport
const ensureToken = async (): Promise<void> => {
  if (accessToken) return;
  accessToken = await getCachedToken(currentServer);
  if (accessToken) return;
  if (typeof fetch === "undefined") throw new Error("fetch is not available");

  const res = await fetch(`${baseUrl}/v1/identity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const data = (await res.json()) as { token?: string };
  accessToken = data?.token || null;
  await setCachedToken(currentServer, accessToken);
};

const call = async (name: string, payload: unknown): Promise<string> => {
  console.log("call:", name, payload)
  await ensureToken();
  if (typeof fetch === "undefined") throw new Error("fetch is not available");

  const res = await fetch(`${baseUrl}/v1/database/${DB_NAME}/call/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text);
  // return normalizeCallPayload(text);
  console.log(name, "response:", text)
  return text

};

// Section: public cache controls
export const clearNoteCache = () => {
  noteCache.clear();
  addInFlight.clear();
  getInFlight.clear();
  hydratedServer = currentServer;
};

// Section: note API
type CacheOptions = { skipCache?: boolean };

export const addNote = async (data: Jsonable, options: CacheOptions = {}): Promise<Ref> => {
  const { skipCache = false } = options;
  if (!skipCache) await hydrateNoteCache();

  const hash = hashData(data);
  if (!skipCache && noteCache.has(hash)) return hash;

  if (!skipCache) {
    const pending = addInFlight.get(hash);
    if (pending) return pending;
  }

  const p = (async () => {
    await call("add_note", { data: tojson(data) });
    if (!skipCache) {
      noteCache.set(hash, data);
      await setCachedNote(currentServer, hash, data);
    }
    return hash;
  })();

  if (!skipCache) addInFlight.set(hash, p);
  try {
    return await p;
  } finally {
    if (!skipCache) addInFlight.delete(hash);
  }
};

export const getNote = async (hash: Ref, options: CacheOptions = {}): Promise<Jsonable> => {
  const { skipCache = false } = options;
  if (!skipCache) await hydrateNoteCache();

  if (!skipCache) {
    const cached = noteCache.get(hash);
    if (cached !== undefined) return cached;
  }

  if (!skipCache) {
    const addPending = addInFlight.get(hash);
    if (addPending) {
      try {
        await addPending;
        const afterAdd = noteCache.get(hash);
        if (afterAdd !== undefined) return afterAdd;
      } catch {
        // Fall through to network read.
      }
    }
  }

  if (!skipCache) {
    const pending = getInFlight.get(hash);
    if (pending) return pending;
  }

  const p = (async () => {
    const raw = await call("get_note", { hash });
    const data = fromjson(fromjson(raw) as string);
    if (!skipCache) {
      noteCache.set(hash, data);
      await setCachedNote(currentServer, hash, data);
    }
    return data;
  })();

  if (!skipCache) getInFlight.set(hash, p);
  try {
    return await p;
  } finally {
    if (!skipCache) getInFlight.delete(hash);
  }
};



export const deref = (dat: Jsonable): Promise<Jsonable> => isRef(dat) ? getNote(dat).then(deref) : Promise.resolve(dat);
export const asref = (dat: Jsonable): Promise<Ref> => isRef(dat) ? Promise.resolve(dat) : addNote(dat);


export const callNote = async (fn: Ref | Jsonable, arg?: Ref | Jsonable): Promise<Jsonable> => {

  return call("call_note", {fn: await asref(fn), arg: await asref(arg == undefined ? null : arg)})
  .then(x=>getNote(fromjson(x) as Ref))

};
