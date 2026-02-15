import { fromjson, hashData, isRef, tojson, type Jsonable, type Ref } from "@hashnotes/core/notes";

export type ServerName = "local" | "maincloud";
type CacheOptions = { skipCache?: boolean };

const DB_NAME = "hashnotes";

const env = () => (globalThis as any)?.process?.env as Record<string, string | undefined> | undefined;
const KV = (() => {
  try { if (typeof localStorage !== "undefined" && localStorage) return localStorage; } catch {}
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { m.set(k, v); },
    removeItem: (k: string) => { m.delete(k); },
  };
})();

let SERVER: ServerName = (() => {
  const e = env();
  const v = e?.HASHNOTES_SERVER;
  return v === "local" || v === "maincloud" ? v : (KV.getItem("db_preset") === "local" ? "local" : "maincloud");
})();

const baseUrl = (): string => ({
  local: "http://localhost:3000",
  maincloud: "https://maincloud.spacetimedb.com",
})[SERVER]

const accessToken = async (): Promise<string | null> => {
  let tokenkey = () => `access_token:${SERVER}`;
  let tkey = tokenkey();
  const e = env();
  const envToken = (SERVER === "local" ? e?.HASHNOTES_ACCESS_TOKEN_LOCAL : e?.HASHNOTES_ACCESS_TOKEN_MAINCLOUD) ?? e?.HASHNOTES_ACCESS_TOKEN;
  if (envToken) return envToken;

  let token = KV.getItem(tkey)
  if (!token){
    token = await fetch(`${baseUrl()}/v1/identity`, { method: "POST", headers: { "Content-Type": "application/json" } })
    .then(r=>r.json()).then(j=>j.token || null)
    if (tkey != tokenkey()) return accessToken();
    if (token) KV.setItem(tkey, token)
  }
  return token
};

export const setServer = (value: ServerName) => {
  KV.setItem("db_preset", value);
  SERVER = value;
  console.log("connect to", SERVER)
};

export let getServer = () => SERVER;
console.log("connect to", SERVER)

const call = async (name: string, payload: unknown): Promise<string> => {
  const res = await fetch(`${baseUrl()}/v1/database/${DB_NAME}/call/${name}`, {
    method: "POST",
    headers: {"Content-Type": "application/json", Authorization: await accessToken().then(t=>t?`Bearer ${t}`:'')},
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
