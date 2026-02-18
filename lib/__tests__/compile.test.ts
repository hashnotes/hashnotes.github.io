import { describe, it } from "node:test";
import { assert, assertEq } from "./assert.ts";
import { compileModule, stripTypes } from "../src/compile.ts";

describe("compileModule", () => {
  it("rewrites named import to getFuncSync()", () => {
    const src = `import { foo } from "#aaa";\nexport const x = () => foo();`;
    const out = compileModule(src);
    assert(out.includes(`const foo = getFuncSync("#aaa")`), out);
    assert(out.includes("foo()"), out);
  });

  it("rewrites default import to getFuncSync()", () => {
    const src = `import foo from "#aaa";\nexport const x = () => foo();`;
    const out = compileModule(src);
    assert(out.includes(`const foo = getFuncSync("#aaa")`), out);
  });

  it("rewrites namespace import to getFuncSync()", () => {
    const src = `import * as utils from "#aaa";\nexport const x = () => utils.run();`;
    const out = compileModule(src);
    assert(out.includes(`const utils = getFuncSync("#aaa")`), out);
  });

  it("rewrites side-effect import to getFuncSync()", () => {
    const src = `import "#setup";\nexport const x = () => 1;`;
    const out = compileModule(src);
    assert(out.includes(`getFuncSync("#setup")`), out);
  });

  it("inlines single exported function body", () => {
    const src = `export const view = (upper) => HTML.div("hello");`;
    const out = compileModule(src);
    assert(!out.includes("export"), out);
    assert(out.includes("const [upper] = args;"), "should bind param from arg: " + out);
    assert(out.includes('return HTML.div("hello");'), "should inline body: " + out);
    assert(!out.includes("const view ="), "should not wrap in variable: " + out);
  });

  it("inlines export default function body", () => {
    const src = `export default (x) => x + 1;`;
    const out = compileModule(src);
    assert(out.includes("const [x] = args;"), "should bind param: " + out);
    assert(out.includes("return x + 1;"), "should inline body: " + out);
  });

  it("throws on re-export (not an arrow)", () => {
    const src = `export { foo } from "#bbb";`;
    let threw = false;
    try { compileModule(src); } catch { threw = true; }
    assert(threw, "should throw on re-export");
  });

  it("throws on export { name } (not an arrow)", () => {
    const src = `const x = (a) => a + 1;\nexport { x };`;
    let threw = false;
    try { compileModule(src); } catch { threw = true; }
    assert(threw, "should throw on export { name }");
  });

  it("strips TypeScript types and inlines body", () => {
    const src = `export const greet = (name: string): string => name + " world";`;
    const out = compileModule(src);
    assert(!out.includes(": string"), "types should be stripped: " + out);
    assert(out.includes("const [name] = args;"), "should bind param: " + out);
    assert(out.includes('return name + " world";'), "should inline body: " + out);
  });

  it("uses resolve function for import specifiers", () => {
    const src = `import { x } from "#ts_hash";\nexport const fn = () => x();`;
    const out = compileModule(src, (spec) =>
      spec === "#ts_hash" ? "#js_compiled" : spec
    );
    assert(out.includes(`getFuncSync("#js_compiled")`), out);
  });

  it("handles mixed import and export with inlined body", () => {
    const src = `
import { helper } from "#dep";
export const greet = (name) => helper(name);
`;
    const out = compileModule(src);
    assert(out.includes(`getFuncSync("#dep")`), out);
    assert(out.includes("const [name] = args;"), "should bind param: " + out);
    assert(out.includes("return helper(name);"), "should inline body: " + out);
  });

  it("produces no return for modules with no exports", () => {
    const src = `import "#setup";`;
    const out = compileModule(src);
    assert(!out.includes("return"), out);
  });

  it("throws on export * from", () => {
    const src = `export * from "#aaa";`;
    let threw = false;
    try { compileModule(src); } catch { threw = true; }
    assert(threw, "should throw on export *");
  });

  it("inlines multi-param exported function", () => {
    const src = `export const add = (a, b) => a + b;`;
    const out = compileModule(src);
    assert(out.includes("const [a, b] = args;"), "should destructure params: " + out);
    assert(out.includes("return a + b;"), "should inline body: " + out);
  });

  it("inlines three-param exported function with block body", () => {
    const src = `export const clamp = (val, min, max) => {\n  if (val < min) return min;\n  if (val > max) return max;\n  return val;\n};`;
    const out = compileModule(src);
    assert(out.includes("const [val, min, max] = args;"), "should destructure params: " + out);
    assert(out.includes("if (val < min) return min;"), "should inline body: " + out);
  });

  it("zero-param function has no args destructuring", () => {
    const src = `export const now = () => Date.now();`;
    const out = compileModule(src);
    assert(!out.includes("args"), "no args binding: " + out);
    assert(out.includes("return Date.now();"), "should inline body: " + out);
  });
});

describe("compileModule __deps", () => {
  it("emits __deps for imports", () => {
    const src = `import { foo } from "#aaa";\nexport const x = () => foo();`;
    const out = compileModule(src);
    assert(out.startsWith('const __deps = ["#aaa"];'), "should start with __deps: " + out);
  });

  it("emits unique __deps for multiple imports", () => {
    const src = `import { a } from "#aaa";\nimport { b } from "#bbb";\nexport const x = () => a() + b();`;
    const out = compileModule(src, (s) => s);
    assert(out.startsWith('const __deps = ["#aaa", "#bbb"];'), "deps: " + out);
  });

  it("deduplicates deps from same module", () => {
    const src = `import { a } from "./#mod";\nimport { b } from "./#mod";\nexport const x = () => a() + b();`;
    const out = compileModule(src, () => "#hash1");
    assert(out.startsWith('const __deps = ["#hash1"];'), "should dedupe: " + out);
  });

  it("no __deps when no imports", () => {
    const src = `export const x = () => 1;`;
    const out = compileModule(src);
    assert(!out.includes("__deps"), "no deps: " + out);
  });
});

describe("compileModule remote() passthrough", () => {
  it("does not rewrite remote() calls — passes through verbatim", () => {
    const src = `
import { counterFn } from "./#123";
export const view = (upper) => {
  remote(counterFn, { delta: 1 }).then((c) => c);
};
`;
    const out = compileModule(src, (spec) =>
      spec === "./#123" ? "#abc123" : spec
    );
    // counterFn is bound via getFuncSync (runtime resolves hash via fnToHash map)
    assert(out.includes(`const counterFn = getFuncSync("#abc123")`), "should bind import: " + out);
    // remote() call is left untouched — runtime resolves fn→hash
    assert(out.includes("remote(counterFn, { delta: 1 })"), "remote should pass through: " + out);
  });

  it("leaves remote() with non-imported args untouched", () => {
    const src = `
export const view = (upper) => {
  const hash = "#abc";
  remote(hash, {});
};
`;
    const out = compileModule(src);
    assert(out.includes("remote(hash, {})"), "should keep as-is: " + out);
  });

  it("binds import for both local and remote usage", () => {
    const src = `
import { helper } from "./#dep";
export const view = (upper) => {
  const local = helper(42);
  remote(helper, { x: 1 });
  return local;
};
`;
    const out = compileModule(src, (spec) =>
      spec === "./#dep" ? "#dep_hash" : spec
    );
    // import bound as callable function
    assert(out.includes(`const helper = getFuncSync("#dep_hash")`), "local binding: " + out);
    // remote() left alone — runtime uses fnToHash to resolve
    assert(out.includes("remote(helper, { x: 1 })"), "remote passthrough: " + out);
    // local call untouched
    assert(out.includes("helper(42)"), "local call: " + out);
  });
});

describe("compileModule JSON imports", () => {
  it("emits getDataSync for .json imports", () => {
    const src = `
import config from "./config.json";
export const view = (upper) => HTML.div(config.title);
`;
    const jsonSpecs = new Set(["./config.json"]);
    const out = compileModule(src, (spec) =>
      spec === "./config.json" ? "#data_hash" : spec
    , jsonSpecs);
    assert(out.includes(`const config = getDataSync("#data_hash")`), "should use getDataSync: " + out);
    assert(!out.includes("getFuncSync"), "should not use getFuncSync for JSON: " + out);
  });

  it("mixes getFuncSync and getDataSync", () => {
    const src = `
import { helper } from "./#dep";
import data from "./items.json";
export const view = (upper) => helper(data);
`;
    const jsonSpecs = new Set(["./items.json"]);
    const out = compileModule(src, (spec) => {
      if (spec === "./#dep") return "#dep_js";
      if (spec === "./items.json") return "#items_hash";
      return spec;
    }, jsonSpecs);
    assert(out.includes(`const helper = getFuncSync("#dep_js")`), "code import: " + out);
    assert(out.includes(`const data = getDataSync("#items_hash")`), "json import: " + out);
  });

  it("includes JSON dep in __deps", () => {
    const src = `
import config from "./config.json";
export const view = (upper) => HTML.div(config.title);
`;
    const jsonSpecs = new Set(["./config.json"]);
    const out = compileModule(src, (spec) =>
      spec === "./config.json" ? "#cfg_hash" : spec
    , jsonSpecs);
    assert(out.includes('"#cfg_hash"'), "should include in deps: " + out);
  });
});

describe("stripTypes", () => {
  it("strips TypeScript annotations from function body", () => {
    const src = `const d = arg.d as number;\nlet c = (store.get("count") || 0) as number;`;
    const out = stripTypes(src);
    assert(!out.includes(" as number"), out);
    assert(out.includes("arg.d"), out);
  });

  it("handles return statements", () => {
    const src = `const x: number = 1;\nreturn x;`;
    const out = stripTypes(src);
    assert(out.includes("return x"), out);
    assert(!out.includes(": number"), out);
  });
});
