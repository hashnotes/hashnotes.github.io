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
type ViewContext = import("../src/views.ts").ViewContext;
type View = import("../src/views.ts").View;

declare const args: any[];

declare const store: {
  get(key: Ref | Jsonable): Jsonable | undefined;
  set(key: Ref | Jsonable, value: Ref | Jsonable): Jsonable;
};

declare const remote: <T extends (...args: any[]) => any>(
  fn: T,
) => (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>;

declare const use: (ref: Ref) => Promise<unknown>;
declare const getFuncSync: (ref: Ref) => (...args: any[]) => unknown;
declare const getDataSync: (ref: Ref) => Jsonable;

declare const addNote: (data: Jsonable) => Promise<Ref>;
declare const getNote: (hash: Ref) => Promise<Jsonable>;
declare const asRef: (input: Ref | Jsonable) => Promise<Ref>;
declare const deref: (ref: Ref) => Promise<Jsonable>;
declare const hashData: (value: Jsonable) => Ref;
declare const fromjson: (x: string) => Jsonable;
declare const promptUser: (message: string, defaultValue?: string) => string | null;
declare const openRouterRequest: (req: {
  apiKey: string
  model: string
  prompt: string
  schema: Jsonable
}) => Promise<Jsonable>;

// Safe subset of standard globals
declare const Object: {
  keys(obj: any): string[];
  values(obj: any): any[];
  entries(obj: any): [string, any][];
  fromEntries(entries: Iterable<[string, any]>): Record<string, any>;
  assign(target: any, ...sources: any[]): any;
  freeze<T>(obj: T): Readonly<T>;
};
declare const Array: {
  isArray(v: unknown): v is unknown[];
  from<T>(v: Iterable<T> | ArrayLike<T>, mapFn?: (v: T, i: number) => any): any[];
  of<T>(...items: T[]): T[];
};
declare const Math: {
  abs(x: number): number; ceil(x: number): number; floor(x: number): number; round(x: number): number;
  min(...values: number[]): number; max(...values: number[]): number;
  pow(base: number, exp: number): number; sqrt(x: number): number;
  sign(x: number): number; trunc(x: number): number;
  log(x: number): number; log2(x: number): number;
  random(): number; PI: number; E: number;
};

type HtmlContent =
  | string
  | VDom
  | HtmlContent[]
  | { id: string }
  | { style: Record<string, string> }
  | { value: string }
  | { href: string }
  | { attrs: Record<string, string> }
  | { onclick?: (e: any) => void; onmousedown?: (e: any) => void; onmouseup?: (e: any) => void; onmousemove?: (e: any) => void; onmouseout?: (e: any) => void; onwheel?: (e: any) => void; onkeydown?: (e: any) => void; onkeyup?: (e: any) => void };

declare const HTML: {
  div: (...content: HtmlContent[]) => VDom;
  span: (...content: HtmlContent[]) => VDom;
  p: (...content: HtmlContent[]) => VDom;
  h1: (...content: HtmlContent[]) => VDom;
  h2: (...content: HtmlContent[]) => VDom;
  h3: (...content: HtmlContent[]) => VDom;
  h4: (...content: HtmlContent[]) => VDom;
  h5: (...content: HtmlContent[]) => VDom;
  h6: (...content: HtmlContent[]) => VDom;
  a: (...content: HtmlContent[]) => VDom;
  button: (...content: HtmlContent[]) => VDom;
  input: (...content: HtmlContent[]) => VDom;
  textarea: (...content: HtmlContent[]) => VDom;
  pre: (...content: HtmlContent[]) => VDom;
  svg: (...content: HtmlContent[]) => VDom;
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
