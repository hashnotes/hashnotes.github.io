import { test } from "node:test";
import { assert, assertEq } from "./assert.ts";
import { noteBody, note } from "../cli-scripts/note-fn.ts";

test("noteBody extracts function body", () => {
  const src = noteBody(function () {
    let x = 1;
    return x + 2;
  });
  assert(src.includes("let x = 1"), "should contain body statements");
  assert(src.includes("return x + 2"), "should contain return");
  assert(!src.includes("function"), "should not contain function keyword");
});

test("noteBody works with arrow expression body", () => {
  const src = noteBody(() => 42);
  assertEq(src.trim(), "return 42;");
});

test("noteBody works with arrow block body", () => {
  const src = noteBody(() => {
    return 42;
  });
  assert(src.includes("return 42"), "should contain return statement");
});

test("note prepends const declarations for vars", () => {
  const myVal = "hello";
  const src = note(function () {
    return myVal;
  }, { myVal });
  assert(src.includes('const myVal = "hello"'), "should have const declaration");
  assert(src.includes("return myVal"), "body should reference the variable");
});

test("note prepends multiple const declarations", () => {
  const a = 42;
  const b = [1, 2, 3];
  const src = note(function () {
    return [a, b];
  }, { a, b });
  assert(src.includes("const a = 42"), "number decl");
  assert(src.includes("const b ="), "array decl");
  assert(src.includes("return [a, b]"), "body references vars");
});

test("note with no vars is same as noteBody", () => {
  const fn = function () { return 1; };
  assertEq(note(fn), noteBody(fn));
});

test("noteBody output is parseable by hashnotes runtime", async () => {
  const { runWithFuel } = await import("@hashnotes/core/codegen");
  const src = noteBody(function () {
    let x = arg + 1;
    return x * 2;
  });
  const result = runWithFuel(src, 1000, { arg: 5 });
  assert("ok" in result, "should succeed");
  assertEq(result.ok, 12);
});

test("note with vars produces runnable code", async () => {
  const { runWithFuel } = await import("@hashnotes/core/codegen");
  const inner = noteBody(function () {
    return arg * 2;
  });
  const src = note(function () {
    return inner;
  }, { inner });
  const result = runWithFuel(src, 1000, { arg: null });
  assert("ok" in result, "should succeed");
  assertEq(result.ok, inner);
});
