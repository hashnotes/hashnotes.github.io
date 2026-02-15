import { it } from "node:test";
import { assertEq } from "./assert.ts";
import type { Jsonable, Ref } from "@hashnotes/core/notes";
import { hashData, isRef, tojson } from "@hashnotes/core/notes";

type FetchLikeResponse = {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
  json: () => Promise<any>;
};

const mkRes = (ok: boolean, body: string, status = ok ? 200 : 400): FetchLikeResponse => ({
  ok,
  status,
  text: async () => body,
  json: async () => JSON.parse(body),
});

const installLocalStorage = () => {
  const m = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => { m.set(k, v); },
    removeItem: (k: string) => { m.delete(k); },
    clear: () => { m.clear(); },
    __map: m,
  };
  return m;
};

const installFakeFetch = () => {
  const notes = new Map<Ref, string>();

  (globalThis as any).fetch = async (input: string, init?: any) => {
    const url = new URL(input);
    const path = url.pathname;

    if (path === "/v1/identity") {
      return mkRes(true, JSON.stringify({ token: "test-token" }));
    }

    const prefix = "/v1/database/hashnotes/call/";
    if (!path.startsWith(prefix)) return mkRes(false, `unknown path: ${path}`, 404);
    const name = path.slice(prefix.length);
    const body = init?.body ? JSON.parse(init.body) : {};

    if (name === "add_note") {
      const dataStr = String(body.data ?? "");
      const parsed = JSON.parse(dataStr) as Jsonable;
      const h = hashData(parsed);
      if (!notes.has(h)) notes.set(h, dataStr);
      return mkRes(true, "");
    }

    if (name === "get_note") {
      const h = body.hash as Ref;
      if (!isRef(h)) return mkRes(false, "bad ref");
      const dataStr = notes.get(h);
      if (!dataStr) return mkRes(false, "not found", 404);
      // Backend procedure returns a string; `call()` returns raw text; db.ts double-decodes.
      return mkRes(true, JSON.stringify(dataStr));
    }

    // Not needed for this test.
    if (name === "call_note") return mkRes(false, "call_note not implemented in fake fetch", 500);

    return mkRes(false, `unknown call: ${name}`, 404);
  };
};

it("client runtime: local store persists across separate callNoteClient calls (via localStorage)", async () => {
  process.env.HASHNOTES_SERVER = "local";
  const ls = installLocalStorage();
  installFakeFetch();

  const { callNoteClient } = await import("../src/runtime.ts");

  const fn = `
    if (arg.write) store.set(arg.key, arg.value);
    return store.get(arg.key);
  `;

  const payload = { key: { k: "persist" }, value: { ok: true, n: 7 }, write: true };

  const r1 = await callNoteClient(fn, payload, { fuel: 100000 });
  assertEq(r1, payload.value);
  // Ensure something was written to localStorage.
  assertEq(ls.size > 0, true);

  const r2 = await callNoteClient(fn, { key: payload.key, write: false }, { fuel: 100000 });
  assertEq(r2, payload.value);
});
