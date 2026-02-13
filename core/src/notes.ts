import { hash128 } from "./hash.ts";

export type Jsonable =
  | string
  | number
  | boolean
  | null
  | Jsonable[]
  | { [key: string]: Jsonable };

export type Hash = string & { length: 32 };

export type Note = { hash: Hash; data: Jsonable };

export const tojson = (x: Jsonable) => JSON.stringify(x, null, 2);
export const fromjson = (x: string): Jsonable => JSON.parse(x);

export const hashData = (data: Jsonable): Hash => hash128(data);

export const makeNote = (data: Jsonable): Note => ({ hash: hashData(data), data });

export const isRef = (value: unknown): value is `#${Hash}` =>
  typeof value === "string" && /^#([a-f0-9]{32})$/i.test(value);

export const refToHash = (ref: `#${Hash}`): Hash => ref.slice(1) as Hash;
export const hashToRef = (hash: Hash): `#${Hash}` => `#${hash}` as `#${Hash}`;
