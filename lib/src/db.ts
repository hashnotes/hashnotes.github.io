import { fromjson, hashData, isRef, tojson, type Jsonable, type Ref } from "@hashnotes/core/notes";

// Section: public types + config
export type ServerName = "local" | "maincloud";
type CacheOptions = { skipCache?: boolean };

const DB_NAME = "hashnotes";
const URL_PRESETS: Record<ServerName, string> = {
  local: "http://localhost:3000",
  maincloud: "https://maincloud.spacetimedb.com",
};

// Section: server/session state
const ls = typeof localStorage !== "undefined" ? localStorage : null;
const tokenKey = (server: ServerName) => `access_token:${server}`;
const defaultServer = (): ServerName => (ls?.getItem("db_preset") === "local" ? "local" : "maincloud");

let currentServer: ServerName = defaultServer();
let baseUrl = URL_PRESETS[currentServer];
let accessToken: string | null = ls?.getItem(tokenKey(currentServer)) ?? null;

export const SERVER = {
  value: currentServer,
  get: (): ServerName => currentServer,
  set: async (value: ServerName) => {
    currentServer = value;
    SERVER.value = value;
    baseUrl = URL_PRESETS[value];
    ls?.setItem("db_preset", value);
    accessToken = ls?.getItem(tokenKey(value)) ?? null;
    return value;
  },
};


const call = async (name: string, payload: unknown): Promise<string> => {
  if (!accessToken) accessToken = ls?.getItem(tokenKey(currentServer)) ?? null;
  if (!accessToken) {
    const res = await fetch(`${baseUrl}/v1/identity`, { method: "POST", headers: { "Content-Type": "application/json" } });
    accessToken = ( (await res.json()) as { token?: string })?.token || null;
    if (accessToken) ls?.setItem(tokenKey(currentServer), accessToken);
  }

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
  return text;
};

// Section: in-memory note cache
const noteCache = new Map<Ref, Jsonable>();
const addInFlight = new Map<Ref, Promise<Ref>>();
const getInFlight = new Map<Ref, Promise<Jsonable>>();

export const clearNoteCache = () => {
  noteCache.clear();
  addInFlight.clear();
  getInFlight.clear();
};

// Section: note API
export const addNote = async (data: Jsonable, options: CacheOptions = {}): Promise<Ref> => {
  const { skipCache = false } = options;
  const hash = hashData(data);

  if (!skipCache) {
    const cached = noteCache.get(hash);
    if (cached !== undefined) return hash;
    const pending = addInFlight.get(hash);
    if (pending) return pending;
  }

  const p = (async () => {
    await call("add_note", { data: tojson(data) });
    if (!skipCache) noteCache.set(hash, data);
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

  if (!skipCache) {
    const cached = noteCache.get(hash);
    if (cached !== undefined) return cached;

    const addPending = addInFlight.get(hash);
    if (addPending) {
      try {
        await addPending;
        const afterAdd = noteCache.get(hash);
        if (afterAdd !== undefined) return afterAdd;
      } catch {
        // fall through
      }
    }

    const pending = getInFlight.get(hash);
    if (pending) return pending;
  }

  const p = (async () => {
    const wireValue = await call("get_note", { hash });
    const data = fromjson(fromjson(wireValue) as string);
    if (!skipCache) noteCache.set(hash, data);
    return data;
  })();

  if (!skipCache) getInFlight.set(hash, p);
  try {
    return await p;
  } finally {
    if (!skipCache) getInFlight.delete(hash);
  }
};


export const deRef = async (value: Jsonable): Promise<Jsonable> =>  isRef(value) ? getNote(value).then(deRef) : value;
export const asRef = async (value: Ref | Jsonable): Promise<Ref> => isRef(value) ? value : addNote(value);

export const callNote = async (fn: Ref | Jsonable, arg?: Ref | Jsonable): Promise<Jsonable> => {
  const fnRef = await asRef(fn);
  const argRef = await asRef(arg === undefined ? null : arg);
  return await call("call_note", { fn: fnRef, arg: argRef }).then(fromjson).then(deRef)
};
