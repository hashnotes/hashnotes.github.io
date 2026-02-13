export type Ref = `#${string}`;

const FNV_OFFSET_1 = 0xcbf29ce484222325n;
const FNV_OFFSET_2 = 0x84222325cbf29ce4n;
const FNV_PRIME = 0x100000001b3n;
const MASK_64 = (1n << 64n) - 1n;

const hash64 = (value: string, offset: bigint): bigint => {
  let hash = offset;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= BigInt(value.charCodeAt(i));
    hash = (hash * FNV_PRIME) & MASK_64;
  }
  return hash;
};

const toHex64 = (value: bigint) => value.toString(16).padStart(16, "0");

export const hash128 = (...data: any): Ref => {
  const input = JSON.stringify(data);
  const high = hash64(input, FNV_OFFSET_1);
  const low = hash64(input, FNV_OFFSET_2);
  return `#${toHex64(high)}${toHex64(low)}` as Ref;
};

export type Jsonable =
  | string
  | number
  | boolean
  | null
  | Jsonable[]
  | { [key: string]: Jsonable };


export type Note = { hash: Ref; data: Jsonable };

export const tojson = (x: Jsonable) => JSON.stringify(x, null, 2);
export const fromjson = (x: string): Jsonable => JSON.parse(x);

export const isRef = (value: unknown): value is Ref =>
  typeof value === "string" && /^#([a-f0-9]{32})$/i.test(value);

export const hashData = (value: Jsonable): Ref => {
  if (isRef(value)) return value;
  if (["string", "number", "boolean"].includes(typeof value) || value === null) {
    return hash128(tojson(value));
  }
  if (Array.isArray(value)) return hash128("arr", value.map(hashData));
  if (typeof value === "object"){
    const entries = Object.entries(value)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => [k, hashData(v)] as const);
    return hash128(tojson(Object.fromEntries(entries)));
  }
  throw new Error(`unsupported type for hashing: ${typeof value}`);
};
