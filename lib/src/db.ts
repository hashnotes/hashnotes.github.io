import { fromjson, hashData, isRef, tojson, type Jsonable, type Ref } from "@hashnotes/core/notes";

export type ServerName = "local" | "maincloud";

type PersistedCache = {
  tokens: Partial<Record<ServerName, string>>;
  notes: Partial<Record<ServerName, Record<string, Jsonable>>>;
};

const URL_PRESETS: Record<ServerName, string> = {
  local: "http://localhost:3000",
  maincloud: "https://maincloud.spacetimedb.com",
};

const DB_NAME = "hashnotes";
const ls = typeof localStorage !== "undefined" ? localStorage : null;
const isNodeRuntime =
  ls === null && typeof process !== "undefined" && !!process.versions?.node;

const tokenKey = (server: ServerName) => `access_token:${server}`;
const emptyPersistedCache = (): PersistedCache => ({ tokens: {}, notes: {} });

let persistedCachePromise: Promise<PersistedCache> | null = null;
let persistWriteQueue: Promise<void> = Promise.resolve();

const getNodeCachePath = async (): Promise<string> => {
  const [{ tmpdir }, { join }] = await Promise.all([
    import("node:os"),
    import("node:path"),
  ]);
  return join(tmpdir(), "hashnotes-lib-cache.json");
};

const loadPersistedCache = async (): Promise<PersistedCache> => {
  if (!isNodeRuntime) return emptyPersistedCache();
  if (persistedCachePromise) return persistedCachePromise;

  persistedCachePromise = (async () => {
    try {
      const { readFile } = await import("node:fs/promises");
      const raw = await readFile(await getNodeCachePath(), "utf8");
      const parsed = JSON.parse(raw) as Partial<PersistedCache>;
      return {
        tokens: parsed.tokens ?? {},
        notes: parsed.notes ?? {},
      };
    } catch {
      return emptyPersistedCache();
    }
  })();

  return persistedCachePromise;
};

const enqueuePersistWrite = async (): Promise<void> => {
  if (!isNodeRuntime) return;
  persistWriteQueue = persistWriteQueue.then(async () => {
    const cache = await loadPersistedCache();
    const [{ mkdir, writeFile }, { dirname }] = await Promise.all([
      import("node:fs/promises"),
      import("node:path"),
    ]);
    const cachePath = await getNodeCachePath();
    await mkdir(dirname(cachePath), { recursive: true });
    await writeFile(cachePath, JSON.stringify(cache), "utf8");
  });
  await persistWriteQueue;
};

const getCachedToken = async (server: ServerName): Promise<string | null> => {
  if (ls) return ls.getItem(tokenKey(server));
  const cache = await loadPersistedCache();
  return cache.tokens[server] ?? null;
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
  await enqueuePersistWrite();
};

const getCachedNotes = async (server: ServerName): Promise<Record<string, Jsonable>> => {
  if (!isNodeRuntime) return {};
  const cache = await loadPersistedCache();
  return cache.notes[server] ?? {};
};

const setCachedNote = async (server: ServerName, hash: Ref, data: Jsonable): Promise<void> => {
  if (!isNodeRuntime) return;
  const cache = await loadPersistedCache();
  const bucket = cache.notes[server] ?? (cache.notes[server] = {});
  bucket[hash] = data;
  await enqueuePersistWrite();
};

const createIdentityToken = async (url: string): Promise<string | null> => {
  if (typeof fetch === "undefined") throw new Error("fetch is not available");
  const res = await fetch(`${url}/v1/identity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const data = (await res.json()) as { token?: string };
  return data?.token || null;
};

const noteCache = new Map<Ref, Jsonable>();
const addInFlight = new Map<Ref, Promise<Ref>>();
const getInFlight = new Map<Ref, Promise<Jsonable>>();
let hydratedServer: ServerName | null = null;

const ensureNoteCacheHydrated = async () => {
  const server = SERVER.get();
  if (hydratedServer === server) return;

  noteCache.clear();
  for (const [hash, data] of Object.entries(await getCachedNotes(server))) {
    noteCache.set(hash as Ref, data);
  }
  hydratedServer = server;
};

export const SERVER = {
  // Keep maincloud as default unless a prior local override is stored.
  value: (ls?.getItem("db_preset") === "local" ? "local" : "maincloud") as ServerName,
  get: (): ServerName => SERVER.value,
  set: async (value: ServerName) => {
    SERVER.value = value;
    ls?.setItem("db_preset", value);
    baseUrl = URL_PRESETS[value];
    accessToken = await getCachedToken(value);
    hydratedServer = null;
    await ensureNoteCacheHydrated();
    return value;
  },
};

let baseUrl = URL_PRESETS[SERVER.get()];
let accessToken: string | null = null;

const req = async (path: string, method: string, body: string | null = null): Promise<Response> => {
  if (typeof fetch === "undefined") throw new Error("fetch is not available");
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body,
  });
};

const call = async (name: string, payload: unknown): Promise<string> => {
  if (!accessToken) {
    accessToken = await getCachedToken(SERVER.get());
  }
  if (!accessToken) {
    accessToken = await createIdentityToken(baseUrl);
    await setCachedToken(SERVER.get(), accessToken);
  }

  const res = await req(`/v1/database/${DB_NAME}/call/${name}`, "POST", JSON.stringify(payload));
  if (!res.ok) throw new Error(await res.text());
  return res.text();
};

export const clearNoteCache = () => {
  noteCache.clear();
  addInFlight.clear();
  getInFlight.clear();
  hydratedServer = SERVER.get();
};

export const addNote = async (data: Jsonable): Promise<Ref> => {
  await ensureNoteCacheHydrated();

  const hash = hashData(data);
  if (noteCache.has(hash)) return hash;
  const pending = addInFlight.get(hash);
  if (pending) return pending;

  const p = (async () => {
    await call("add_note", { data: tojson(data) });
    noteCache.set(hash, data);
    await setCachedNote(SERVER.get(), hash, data);
    return hash;
  })();

  addInFlight.set(hash, p);
  try {
    return await p;
  } finally {
    addInFlight.delete(hash);
  }
};

export const getNote = async (hash: Ref): Promise<Jsonable> => {
  await ensureNoteCacheHydrated();

  const cached = noteCache.get(hash);
  if (cached !== undefined) return cached;

  // If this hash is currently being inserted, wait for it and then read cache.
  const addPending = addInFlight.get(hash);
  if (addPending) {
    try {
      await addPending;
      const afterAdd = noteCache.get(hash);
      if (afterAdd !== undefined) return afterAdd;
    } catch {
      // If add failed, fall through to a direct fetch path.
    }
  }

  const pending = getInFlight.get(hash);
  if (pending) return pending;

  const p = (async () => {
    const raw = await call("get_note", { hash });
    const data = fromjson(raw) as Jsonable;
    noteCache.set(hash, data);
    await setCachedNote(SERVER.get(), hash, data);
    return data;
  })();

  getInFlight.set(hash, p);
  try {
    return await p;
  } finally {
    getInFlight.delete(hash);
  }
};

export const callNote = async (fn: Ref, arg: Ref | Jsonable): Promise<Jsonable> => {
  const argRef = isRef(arg) ? arg : await addNote(arg);
  const raw = await call("call_note", { fn, arg: argRef });
  return fromjson(raw) as Jsonable;
};
