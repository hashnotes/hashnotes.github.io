/**
 * codegen.ts — Security-critical code generation and runtime execution.
 *
 * Takes acorn AST (from parser.ts) and produces JavaScript source strings
 * evaluated via `new Function()`. The render functions act as a whitelist:
 * unsupported node types are rejected at the `default` branch of each switch.
 * Every identifier is validated by `assertSafeIdent` as defense-in-depth.
 *
 * Audit surface: renderExpr, renderStmt, renderPattern, and the runner
 * functions that interpolate fuel references.
 */

import type { AstNode } from "./parser.ts";
import { parse, validateScopes, validateNoPrototype } from "./parser.ts";

// ---------------------------------------------------------------------------
// Defense-in-depth: identifier validation
// ---------------------------------------------------------------------------

const SAFE_IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const FORBIDDEN_IDENTS = new Set([
  "eval", "arguments", "this", "globalThis", "window", "document",
  "self", "top", "parent", "frames",
  "process", "require", "module", "exports", "__dirname", "__filename",
  "importScripts",
]);

export const assertSafeIdent = (name: string): void => {
  if (!SAFE_IDENT_RE.test(name))
    throw new Error(`unsafe identifier in codegen: ${JSON.stringify(name)}`);
  if (FORBIDDEN_IDENTS.has(name))
    throw new Error(`forbidden identifier in codegen: ${name}`);
};

// ---------------------------------------------------------------------------
// Code generation (acorn AST → JS source string)
// ---------------------------------------------------------------------------

const renderLiteral = (node: AstNode) => {
  if (node.regex) throw new Error("regexp literals not supported");
  if (node.bigint != null) throw new Error("bigint literals not supported");
  const v = node.value;
  if (v === null) return "null";
  if (typeof v === "string") return JSON.stringify(v);
  return String(v);
};

const renderExpr = (e: AstNode): string => {
  switch (e.type) {
    case "Identifier":
      assertSafeIdent(e.name);
      return e.name;
    case "SpreadElement":
      return `...${renderExpr(e.argument)}`;
    case "Literal":
      return renderLiteral(e);
    case "ArrayExpression":
      return `[${(e.elements as AstNode[]).map((el) => el ? renderExpr(el) : "").join(", ")}]`;
    case "ObjectExpression":
      return `{${(e.properties as AstNode[]).map((p) => p.type === "SpreadElement" ? `...${renderExpr(p.argument)}` : renderProp(p)).join(", ")}}`;
    case "AwaitExpression":
      return `(await ${renderExpr(e.argument)})`;
    case "CallExpression": {
      const calleeStr = renderExpr(e.callee);
      const needsParens = e.callee.type === "ArrowFunctionExpression";
      return `${needsParens ? "(" : ""}${calleeStr}${needsParens ? ")" : ""}(${(e.arguments as AstNode[]).map(renderExpr).join(", ")})`;
    }
    case "MemberExpression":
      return e.computed
        ? `${renderExpr(e.object)}[${renderExpr(e.property)}]`
        : `${renderExpr(e.object)}.${renderExpr(e.property)}`;
    case "AssignmentExpression":
      return `${renderExpr(e.left)} ${e.operator} ${renderExpr(e.right)}`;
    case "UpdateExpression":
      return e.prefix
        ? `${e.operator}${renderExpr(e.argument)}`
        : `${renderExpr(e.argument)}${e.operator}`;
    case "BinaryExpression":
    case "LogicalExpression":
      return `(${renderExpr(e.left)} ${e.operator} ${renderExpr(e.right)})`;
    case "UnaryExpression":
      return e.operator === "typeof"
        ? `(${e.operator} ${renderExpr(e.argument)})`
        : `(${e.operator}${renderExpr(e.argument)})`;
    case "ConditionalExpression":
      return `(${renderExpr(e.test)} ? ${renderExpr(e.consequent)} : ${renderExpr(e.alternate)})`;
    case "ArrowFunctionExpression":
      return renderArrow(e);
    default:
      throw new Error(`unsupported expression: ${e.type}`);
  }
};

const renderProp = (p: AstNode) => {
  if (p.computed) throw new Error("computed properties not supported");
  if (p.method) throw new Error("method properties not supported");
  if (p.kind !== "init") throw new Error(`unsupported property kind: ${p.kind}`);
  const key =
    p.key.type === "Identifier" ? p.key.name : renderLiteral(p.key);
  if (p.shorthand && p.value.type === "Identifier" && p.value.name === key) {
    assertSafeIdent(key);
    return key;
  }
  return `${key}: ${renderExpr(p.value)}`;
};

const renderArrow = (e: AstNode) => {
  const params = `(${(e.params as AstNode[]).map(renderPattern).join(", ")})`;
  const prefix = e.async ? "async " : "";
  if (e.body.type === "BlockStatement") {
    return `${prefix}${params} => ${renderStmt(e.body, true)}`;
  }
  return `${prefix}${params} => { __burn(); return ${renderExpr(e.body)}; }`;
};

const renderStmt = (s: AstNode, inFn = false): string => {
  const burn = inFn ? "__burn();" : "";
  const renderLoopBody = (body: AstNode) => {
    if (body.type === "BlockStatement") {
      const inner = (body.body as AstNode[]).map((b) => renderStmt(b, inFn)).join("");
      return `{__burn();${inner}}`;
    }
    return `{__burn();${renderStmt(body, inFn)}}`;
  };
  switch (s.type) {
    case "BlockStatement":
      return `{${(s.body as AstNode[]).map((b) => renderStmt(b, inFn)).join("")}}`;
    case "ExpressionStatement":
      return `${burn}${renderExpr(s.expression)};`;
    case "IfStatement": {
      const wrap = (stmt: AstNode) =>
        stmt.type === "BlockStatement" ? renderStmt(stmt, inFn) : `{${renderStmt(stmt, inFn)}}`;
      return `${burn}if (${renderExpr(s.test)}) ${wrap(s.consequent)}${s.alternate ? ` else ${wrap(s.alternate)}` : ""}`;
    }
    case "ReturnStatement":
      return `${burn}return${s.argument ? ` ${renderExpr(s.argument)}` : ""};`;
    case "VariableDeclaration":
      if (s.kind === "var") throw new Error("var declarations not allowed");
      return `${burn}${s.kind} ${(s.declarations as AstNode[]).map(renderDecl).join(", ")};`;
    case "BreakStatement":
      return `${burn}break;`;
    case "ContinueStatement":
      return `${burn}continue;`;
    case "WhileStatement":
      return `${burn}while (${renderExpr(s.test)}) ${renderLoopBody(s.body)}`;
    case "ForStatement": {
      const init =
        s.init == null
          ? ""
          : s.init.type === "VariableDeclaration"
          ? `${s.init.kind} ${(s.init.declarations as AstNode[]).map(renderDecl).join(", ")}`
          : renderExpr(s.init);
      const test = s.test ? renderExpr(s.test) : "";
      const update = s.update ? renderExpr(s.update) : "";
      return `${burn}for (${init}; ${test}; ${update}) ${renderLoopBody(s.body)}`;
    }
    case "ForInStatement": {
      const left = s.left.type === "VariableDeclaration"
        ? `${s.left.kind} ${(s.left.declarations as AstNode[]).map(renderDecl).join(", ")}`
        : renderExpr(s.left);
      return `${burn}for (${left} in ${renderExpr(s.right)}) ${renderLoopBody(s.body)}`;
    }
    case "ForOfStatement": {
      if (s.await) throw new Error("for-await-of not supported");
      const left = s.left.type === "VariableDeclaration"
        ? `${s.left.kind} ${(s.left.declarations as AstNode[]).map(renderDecl).join(", ")}`
        : renderExpr(s.left);
      return `${burn}for (${left} of ${renderExpr(s.right)}) ${renderLoopBody(s.body)}`;
    }
    case "EmptyStatement":
      return "";
    default:
      throw new Error(`unsupported statement: ${s.type}`);
  }
};

const renderDecl = (d: AstNode) =>
  `${renderPattern(d.id)}${d.init ? ` = ${renderExpr(d.init)}` : ""}`;

const renderPattern = (p: AstNode): string => {
  switch (p.type) {
    case "Identifier":
      assertSafeIdent(p.name);
      return p.name;
    case "AssignmentPattern":
      return `${renderPattern(p.left)} = ${renderExpr(p.right)}`;
    case "RestElement":
      return `...${renderPattern(p.argument)}`;
    case "ArrayPattern":
      return `[${(p.elements as (AstNode | null)[]).map((el) => el ? renderPattern(el) : "").join(", ")}]`;
    case "ObjectPattern":
      return `{${(p.properties as AstNode[]).map((prop) =>
        prop.type === "RestElement" ? `...${renderPattern(prop.argument)}` : renderPatternProperty(prop)
      ).join(", ")}}`;
    default:
      throw new Error(`unsupported pattern: ${p.type}`);
  }
};

const renderPatternProperty = (p: AstNode): string => {
  if (p.computed) throw new Error("computed pattern properties not supported");
  const key =
    p.key.type === "Identifier" ? p.key.name : renderLiteral(p.key);
  if (
    p.shorthand &&
    p.key.type === "Identifier" &&
    p.value.type === "Identifier" &&
    p.value.name === p.key.name
  ) {
    assertSafeIdent(key);
    return key;
  }
  return `${key}: ${renderPattern(p.value)}`;
};

// ---------------------------------------------------------------------------
// Reserved name validation
// ---------------------------------------------------------------------------

const validateNoReservedRuntimeNames = (program: AstNode, reservedNames: string[]): string[] => {
  const reserved = new Set(reservedNames);
  const errors: string[] = [];

  const hit = (name: string) => {
    if (reserved.has(name)) errors.push(`reserved identifier: ${name}`);
  };

  const visitPattern = (p: AstNode): void => {
    switch (p.type) {
      case "Identifier":
        hit(p.name);
        return;
      case "AssignmentPattern":
        visitPattern(p.left);
        return;
      case "RestElement":
        visitPattern(p.argument);
        return;
      case "ArrayPattern":
        (p.elements as (AstNode | null)[]).forEach((el) => el && visitPattern(el));
        return;
      case "ObjectPattern":
        (p.properties as AstNode[]).forEach((prop) => {
          if (prop.type === "RestElement") visitPattern(prop.argument);
          else visitPattern(prop.value);
        });
        return;
    }
  };

  const visitExpr = (e: AstNode): void => {
    if (!e) return;
    switch (e.type) {
      case "Identifier":
        hit(e.name);
        return;
      case "Literal":
        return;
      case "SpreadElement":
        visitExpr(e.argument);
        return;
      case "ArrayExpression":
        (e.elements as AstNode[]).forEach((el) => el && visitExpr(el));
        return;
      case "ObjectExpression":
        (e.properties as AstNode[]).forEach((p) => {
          if (p.type === "SpreadElement") {
            visitExpr(p.argument);
            return;
          }
          if (p.shorthand && p.value.type === "Identifier") hit(p.value.name);
          visitExpr(p.value);
        });
        return;
      case "AwaitExpression":
        visitExpr(e.argument);
        return;
      case "CallExpression":
        visitExpr(e.callee);
        (e.arguments as AstNode[]).forEach((a) => visitExpr(a));
        return;
      case "MemberExpression":
        visitExpr(e.object);
        if (e.computed) visitExpr(e.property);
        return;
      case "AssignmentExpression":
        visitExpr(e.left);
        visitExpr(e.right);
        return;
      case "UpdateExpression":
        visitExpr(e.argument);
        return;
      case "BinaryExpression":
      case "LogicalExpression":
        visitExpr(e.left);
        visitExpr(e.right);
        return;
      case "UnaryExpression":
        visitExpr(e.argument);
        return;
      case "ConditionalExpression":
        visitExpr(e.test);
        visitExpr(e.consequent);
        visitExpr(e.alternate);
        return;
      case "ArrowFunctionExpression":
        (e.params as AstNode[]).forEach(visitPattern);
        if (e.body.type === "BlockStatement") visitStmt(e.body);
        else visitExpr(e.body);
        return;
    }
  };

  const visitVarDecl = (d: AstNode) => {
    visitPattern(d.id);
    if (d.init) visitExpr(d.init);
  };

  const visitStmt = (s: AstNode): void => {
    switch (s.type) {
      case "BlockStatement":
        (s.body as AstNode[]).forEach(visitStmt);
        return;
      case "ExpressionStatement":
        visitExpr(s.expression);
        return;
      case "IfStatement":
        visitExpr(s.test);
        visitStmt(s.consequent);
        if (s.alternate) visitStmt(s.alternate);
        return;
      case "ReturnStatement":
        if (s.argument) visitExpr(s.argument);
        return;
      case "VariableDeclaration":
        (s.declarations as AstNode[]).forEach(visitVarDecl);
        return;
      case "WhileStatement":
        visitExpr(s.test);
        visitStmt(s.body);
        return;
      case "ForStatement":
        if (s.init?.type === "VariableDeclaration") (s.init.declarations as AstNode[]).forEach(visitVarDecl);
        else if (s.init) visitExpr(s.init);
        if (s.test) visitExpr(s.test);
        if (s.update) visitExpr(s.update);
        visitStmt(s.body);
        return;
      case "ForInStatement":
      case "ForOfStatement":
        if (s.left.type === "VariableDeclaration") (s.left.declarations as AstNode[]).forEach(visitVarDecl);
        else visitExpr(s.left);
        visitExpr(s.right);
        visitStmt(s.body);
        return;
      case "BreakStatement":
      case "ContinueStatement":
      case "EmptyStatement":
        return;
    }
  };

  (program.body as AstNode[]).forEach(visitStmt);
  return errors;
};

// ---------------------------------------------------------------------------
// Runner codegen (wraps program body with fuel metering)
// ---------------------------------------------------------------------------

export const renderWithFuel = (program: AstNode, fuel = 10000) => {
  const prelude = `let __fuel = ${fuel}; const __burn = () => { if (--__fuel < 0) throw new Error("fuel exhausted"); };`;
  const body = (program.body as AstNode[]).map((s) => renderStmt(s, true)).join("");
  return `${prelude}${body}`;
};

const renderRunnerWithFuelShared = (program: AstNode, fuelRefName = "__fuel") => {
  assertSafeIdent(fuelRefName);
  const reservedErrs = validateNoReservedRuntimeNames(program, [fuelRefName, "__burn"]);
  if (reservedErrs.length) throw new Error(reservedErrs.join(", "));
  const prelude = `const __burn = () => { if (--${fuelRefName}.value < 0) throw new Error("fuel exhausted"); };`;
  const body = (program.body as AstNode[]).map((s) => renderStmt(s, true)).join("");
  return `${prelude}const __run = () => {${body}}; try { const ok = __run(); return { ok, fuel: ${fuelRefName}.value }; } catch (err) { return { err: String(err), fuel: ${fuelRefName}.value }; }`;
};

const renderRunnerWithFuelSharedAsync = (program: AstNode, fuelRefName = "__fuel") => {
  assertSafeIdent(fuelRefName);
  const reservedErrs = validateNoReservedRuntimeNames(program, [fuelRefName, "__burn"]);
  if (reservedErrs.length) throw new Error(reservedErrs.join(", "));
  const prelude = `const __burn = () => { if (--${fuelRefName}.value < 0) throw new Error("fuel exhausted"); };`;
  const body = (program.body as AstNode[]).map((s) => renderStmt(s, true)).join("");
  return `${prelude}const __run = async () => {${body}}; return __run().then(ok => ({ ok, fuel: ${fuelRefName}.value })).catch(err => ({ err: String(err), fuel: ${fuelRefName}.value }));`;
};

// ---------------------------------------------------------------------------
// Runtime helpers
// ---------------------------------------------------------------------------

export type runRes = { ok: unknown; fuel: number } | { err: string; fuel: number };

const SAFE_OBJECT = Object.freeze(Object.assign(Object.create(null), {
  keys: (obj: unknown) => Object.keys(obj as Record<string, unknown>),
  values: (obj: unknown) => Object.values(obj as Record<string, unknown>),
  entries: (obj: unknown) => Object.entries(obj as Record<string, unknown>),
  fromEntries: (entries: unknown) => Object.fromEntries(entries as Iterable<[string, unknown]>),
  assign: (target: unknown, ...sources: unknown[]) => Object.assign(target as Record<string, unknown>, ...sources),
  freeze: (obj: unknown) => Object.freeze(obj as Record<string, unknown>),
}));

const SAFE_ARRAY = Object.freeze(Object.assign(Object.create(null), {
  isArray: (v: unknown) => Array.isArray(v),
  from: (v: unknown, mapFn?: unknown) => mapFn ? Array.from(v as Iterable<unknown>, mapFn as (v: unknown, i: number) => unknown) : Array.from(v as Iterable<unknown>),
  of: (...items: unknown[]) => Array.of(...items),
}));

const SAFE_MATH = Object.freeze(Object.assign(Object.create(null), {
  abs: Math.abs, ceil: Math.ceil, floor: Math.floor, round: Math.round,
  min: Math.min, max: Math.max, pow: Math.pow, sqrt: Math.sqrt,
  sign: Math.sign, trunc: Math.trunc, log: Math.log, log2: Math.log2,
  random: Math.random, PI: Math.PI, E: Math.E,
}));

type FuelRef = { value: number };
type FunctionParam = { name: string, rest: boolean };

const parseFunctionCtor = (ctorArgs: unknown[]): { params: FunctionParam[], body: string } => {
  if (ctorArgs.some((v) => typeof v !== "string")) {
    throw new Error("Function arguments must be strings");
  }
  const parts = ctorArgs as string[];
  const body = parts.length ? parts[parts.length - 1] : "";
  const rawParams = parts.slice(0, -1);
  const params: FunctionParam[] = [];
  for (const raw of rawParams) {
    for (const seg of raw.split(",")) {
      const name = seg.trim();
      if (!name) continue;
      const rest = name.startsWith("...");
      const base = rest ? name.slice(3) : name;
      if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(base)) {
        throw new Error(`Invalid function parameter: ${name}`);
      }
      params.push({ name: base, rest });
    }
  }
  const restCount = params.filter((p) => p.rest).length;
  if (restCount > 1 || (restCount === 1 && !params[params.length - 1].rest)) {
    throw new Error("Rest parameter must be the last parameter");
  }
  return { params, body };
};

const mapFunctionArgs = (params: FunctionParam[], callArgs: unknown[]): Record<string, unknown> => {
  const env: Record<string, unknown> = {};
  let idx = 0;
  for (const p of params) {
    if (p.rest) {
      env[p.name] = callArgs.slice(idx);
      idx = callArgs.length;
    } else {
      env[p.name] = callArgs[idx++];
    }
  }
  return env;
};

const makeSafeFunctionSync = (fuelRef: FuelRef, outerGlobals: Record<string, unknown>) => (...ctorArgs: unknown[]) => {
  const { params, body } = parseFunctionCtor(ctorArgs);
  return (...callArgs: unknown[]) => {
    const localEnv = { ...outerGlobals, ...mapFunctionArgs(params, callArgs) };
    const res = runWithFuelShared(body, fuelRef, localEnv);
    if ("err" in res) throw new Error(res.err);
    return res.ok;
  };
};

const makeSafeFunctionAsync = (fuelRef: FuelRef, outerGlobals: Record<string, unknown>) => (...ctorArgs: unknown[]) => {
  const { params, body } = parseFunctionCtor(ctorArgs);
  return async (...callArgs: unknown[]) => {
    const localEnv = { ...outerGlobals, ...mapFunctionArgs(params, callArgs) };
    const res = await runWithFuelSharedAsync(body, fuelRef, localEnv);
    if ("err" in res) throw new Error(res.err);
    return res.ok;
  };
};

const withBuiltins = (
  env: Record<string, unknown>,
  fuelRef: FuelRef,
  mode: "sync" | "async",
): Record<string, unknown> => {
  const baseGlobals: Record<string, unknown> = {
    ...env,
    Object: SAFE_OBJECT,
    Array: SAFE_ARRAY,
    Math: SAFE_MATH,
    Promise,
  };
  return {
    ...baseGlobals,
    Function: mode === "async"
      ? makeSafeFunctionAsync(fuelRef, baseGlobals)
      : makeSafeFunctionSync(fuelRef, baseGlobals),
  };
};

const stringifyError = (err: unknown): string => {
  if (err instanceof Error) {
    const stack = err.stack || '';
    const prefix = `${err.name}: ${err.message}`;
    const cleanStack = stack
      .replace(/^[^\n]*\n?/, '')
      .replace(/spacetimedb_module:(\d+):(\d+)/g, '<bundled:$1:$2>');
    return cleanStack ? `${prefix}\n${cleanStack}` : prefix;
  }
  if (typeof err === 'object' && err !== null) {
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
};

// ---------------------------------------------------------------------------
// Public runtime API
// ---------------------------------------------------------------------------

export const runWithFuel = (
  src: string,
  fuel = 10000,
  env: Record<string, unknown> = {},
): runRes => {
  const fuelRef = { value: fuel };
  return runWithFuelShared(src, fuelRef, env);
};

export const runWithFuelShared = (
  src: string,
  fuelRef: FuelRef,
  env: Record<string, unknown> = {},
  fuelRefName = "__fuel"
): runRes => {
  try {
    const runtimeEnv = withBuiltins(env, fuelRef, "sync");
    const program = parse(src);
    const protoErrs = validateNoPrototype(program);
    if (protoErrs.length) return { err: "prototype access", fuel: fuelRef.value };
    const scopeErrs = validateScopes(program, [...Object.keys(runtimeEnv), fuelRefName]);
    if (scopeErrs.length) return { err: scopeErrs.join(", "), fuel: fuelRef.value };
    const code = renderRunnerWithFuelShared(program, fuelRefName);
    const fullEnv = { ...runtimeEnv, [fuelRefName]: fuelRef };
    return (new Function(...Object.keys(fullEnv), code) as (...args:unknown[]) => runRes)(...Object.values(fullEnv));
  } catch (err) {
    return { err: stringifyError(err), fuel: fuelRef.value };
  }
};

export const runWithFuelSharedAsync = async (
  src: string,
  fuelRef: FuelRef,
  env: Record<string, unknown> = {},
  fuelRefName = "__fuel"
): Promise<runRes> => {
  try {
    const runtimeEnv = withBuiltins(env, fuelRef, "async");
    const program = parse(src);
    const protoErrs = validateNoPrototype(program);
    if (protoErrs.length) return { err: "prototype access", fuel: fuelRef.value };
    const scopeErrs = validateScopes(program, [...Object.keys(runtimeEnv), fuelRefName]);
    if (scopeErrs.length) return { err: scopeErrs.join(", "), fuel: fuelRef.value };
    const code = renderRunnerWithFuelSharedAsync(program, fuelRefName);
    const fullEnv = { ...runtimeEnv, [fuelRefName]: fuelRef };
    const fn = new Function(...Object.keys(fullEnv), code) as (...args: unknown[]) => Promise<runRes>;
    return await fn(...Object.values(fullEnv));
  } catch (err) {
    return { err: stringifyError(err), fuel: fuelRef.value };
  }
};

export const runWithFuelAsync = async (
  src: string,
  fuel = 10000,
  env: Record<string, unknown> = {}
): Promise<runRes> => {
  const fuelRef = { value: fuel };
  return runWithFuelSharedAsync(src, fuelRef, env);
};
