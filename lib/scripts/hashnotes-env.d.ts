/**
 * Ambient type declarations for the hashnotes sandbox runtime.
 *
 * These describe the globals injected by runtime.ts into note code.
 * Having this file in scope gives IDE autocomplete, type hints, and
 * error checking inside note function bodies written with noteBody()/note().
 *
 * These declarations only exist at the type level — they don't affect
 * the actual runtime, which injects these names via `new Function()`.
 */

type Ref = `#${string}`;
type Jsonable =
  | string
  | number
  | boolean
  | null
  | Jsonable[]
  | { [key: string]: Jsonable };

type VDom = import("../src/views.ts").VDom;
type UPPER = import("../src/views.ts").UPPER;

declare const arg: any;
declare const argRef: Ref;

declare const store: {
  get(key: Ref | Jsonable): Jsonable | undefined;
  set(key: Ref | Jsonable, value: Ref | Jsonable): Jsonable;
};

declare const remote: <X,Y extends Jsonable> (
  fn: (x:X) => Y,
  arg?: X,
) => Promise<Y>;

declare const use: (ref: Ref) => Promise<unknown>;
declare const getFuncSync: (ref: Ref) => (arg: any) => unknown;
declare const getDataSync: (ref: Ref) => Jsonable;

declare const addNote: (data: Jsonable) => Promise<Ref>;
declare const getNote: (hash: Ref) => Promise<Jsonable>;
declare const asRef: (input: Ref | Jsonable) => Promise<Ref>;
declare const deref: (ref: Ref) => Promise<Jsonable>;
declare const hashData: (value: Jsonable) => Ref;
declare const fromjson: (x: string) => Jsonable;

declare const HTML: {
  div: (...content: any[]) => VDom;
  span: (...content: any[]) => VDom;
  p: (...content: any[]) => VDom;
  h1: (...content: any[]) => VDom;
  h2: (...content: any[]) => VDom;
  h3: (...content: any[]) => VDom;
  h4: (...content: any[]) => VDom;
  h5: (...content: any[]) => VDom;
  h6: (...content: any[]) => VDom;
  a: (...content: any[]) => VDom;
  button: (...content: any[]) => VDom;
  input: (...content: any[]) => VDom;
  textarea: (...content: any[]) => VDom;
  pre: (...content: any[]) => VDom;
  svgPath: (
    pathData: string | string[],
    options?: {
      viewBox?: string;
      width?: string;
      height?: string;
      fill?: string;
      stroke?: string;
      strokeWidth?: string;
    },
    ...children: VDom[]
  ) => VDom;
  svgText: (
    content: string,
    options?: {
      x?: string;
      y?: string;
      fill?: string;
      background?: string;
      fontSize?: string;
      fontFamily?: string;
      fontWeight?: string;
      textAnchor?: string;
      dominantBaseline?: string;
      dx?: string;
      dy?: string;
    }
  ) => VDom;
  popup: (...cs: VDom[]) => VDom;
};
