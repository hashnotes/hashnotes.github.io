(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const mouseEvents = ["click", "mousemove", "mouseup", "mousedown", "drag", "wheel"];
const keyboardEvents = ["keydown", "keyup"];
const svgNamespace = "http://www.w3.org/2000/svg";
const svgTags = /* @__PURE__ */ new Set(["svg", "path", "g", "line", "polyline", "polygon", "circle", "ellipse", "rect", "text"]);
const allowedAttributeNames = /* @__PURE__ */ new Set(["viewBox", "width", "height", "xmlns", "d", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-dasharray", "stroke-dashoffset", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "points", "transform", "opacity", "font-size", "font-family", "font-weight", "text-anchor", "dominant-baseline", "dx", "dy"]);
let doms = /* @__PURE__ */ new WeakMap();
let elements = /* @__PURE__ */ new WeakMap();
const renderDom = (mker) => {
  const render = (dom) => {
    const el = svgTags.has(dom.tag) ? document.createElementNS(svgNamespace, dom.tag) : document.createElement(dom.tag);
    el.textContent = dom.textContent;
    if ((el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && dom.value) el.value = dom.value;
    elements.set(dom, el);
    doms.set(el, dom);
    el.append(...dom.children.map((c) => render(c)));
    Object.entries(dom.attrs).forEach(([k, v]) => {
      if (allowedAttributeNames.has(k)) el.setAttribute(k, v);
    });
    Object.entries(dom.style).forEach((st) => el.style.setProperty(...st));
    mouseEvents.forEach((type) => el.addEventListener(type, (e) => {
      const me = e;
      if (dom.onEvent != void 0) dom.onEvent({
        type,
        target: doms.get(e.target),
        clientX: me.clientX,
        clientY: me.clientY,
        deltaY: type === "wheel" ? me.deltaY : void 0,
        currentTarget: el,
        preventDefault: () => e.preventDefault()
      });
    }));
    keyboardEvents.forEach((type) => el.addEventListener(type, (e) => {
      let { key, metaKey, shiftKey } = e;
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) dom.value = e.target.value;
      if (dom.onEvent != void 0) dom.onEvent({ type, key, metaKey, shiftKey, target: doms.get(e.target) });
    }));
    return el;
  };
  return render(mker({
    add: (parent, ...el) => {
      var _a;
      (_a = elements.get(parent)) == null ? void 0 : _a.append(...el.map((e) => render(e)));
    },
    del: (el) => {
      var _a;
      doms.delete(elements.get(el));
      (_a = elements.get(el)) == null ? void 0 : _a.remove();
      elements.delete(el);
    },
    update: (el) => {
      let oldel = elements.get(el);
      oldel.replaceWith(render(el));
      doms.delete(oldel);
    }
  }));
};
const mkDom = (tag) => (...content) => {
  let listeners = /* @__PURE__ */ new Map();
  let dm = {
    tag,
    style: {},
    attrs: {},
    textContent: "",
    id: "",
    children: [],
    onEvent: (e) => {
      let fn = listeners.get(e.type);
      if (fn) return fn(e);
    }
  };
  let addcontent = (c) => {
    if (c instanceof Array) c.forEach(addcontent);
    else if (typeof c == "string") dm.textContent = c;
    else if (c instanceof Object) {
      if ("tag" in c) return dm.children.push(c);
      if ("id" in c) dm.id = c.id;
      if ("value" in c) dm.value = c.value;
      if ("attrs" in c) Object.entries(c.attrs).forEach(([k, v]) => dm.attrs[k] = v);
      if ("style" in c) Object.entries(c.style).forEach((s) => dm.style[s[0].replace(/([A-Z])/g, "-$1")] = s[1]);
      Object.entries(c).forEach(([k, v]) => {
        if (k.startsWith("on")) listeners.set(k.slice(2), v);
      });
    }
  };
  addcontent(content);
  return dm;
};
let div = mkDom("div");
let svg = mkDom("svg");
let path = mkDom("path");
let text = mkDom("text");
const popup = (...cs) => {
  const dialogfield = div(
    {
      style: {
        background: "var(--background-color)",
        color: "var(--color)",
        padding: "1em",
        paddingBottom: "2em",
        borderRadius: "1em",
        zIndex: "2000",
        overflowY: "scroll"
      }
    },
    ...cs
  );
  const popupbackground = div(
    { style: {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      background: "rgba(166, 166, 166, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: "2000"
    } },
    dialogfield
  );
  return popupbackground;
};
const HTML = {
  div,
  span: mkDom("span"),
  p: mkDom("p"),
  h1: mkDom("h1"),
  h2: mkDom("h2"),
  h3: mkDom("h3"),
  h4: mkDom("h4"),
  h5: mkDom("h5"),
  h6: mkDom("h6"),
  a: mkDom("a"),
  button: mkDom("button"),
  input: mkDom("input"),
  textarea: mkDom("textarea"),
  pre: mkDom("pre"),
  svgPath: (pathData, options = {}, ...children) => {
    const paths = pathData instanceof Array ? pathData : [pathData];
    const { viewBox = "0 0 24 24", width = "1em", height = "1em", fill = "currentColor", stroke, strokeWidth } = options;
    const pathAttrs = { fill };
    if (stroke) pathAttrs.stroke = stroke;
    if (strokeWidth) pathAttrs["stroke-width"] = strokeWidth;
    return svg(
      { attrs: { viewBox, width, height, xmlns: svgNamespace } },
      ...paths.map((d) => path({ attrs: { ...pathAttrs, d } })),
      ...children
    );
  },
  svgText: (content, options = {}) => {
    const attrs = {};
    if (options.x) attrs.x = options.x;
    if (options.y) attrs.y = options.y;
    if (options.fill) attrs.fill = options.fill;
    if (options.background) attrs.background = options.background;
    if (options.fontSize) attrs["font-size"] = options.fontSize;
    if (options.fontFamily) attrs["font-family"] = options.fontFamily;
    if (options.fontWeight) attrs["font-weight"] = options.fontWeight;
    if (options.textAnchor) attrs["text-anchor"] = options.textAnchor;
    if (options.dominantBaseline) attrs["dominant-baseline"] = options.dominantBaseline;
    if (options.dx) attrs.dx = options.dx;
    if (options.dy) attrs.dy = options.dy;
    return text({ attrs }, content);
  },
  popup
};
const FNV_OFFSET_1 = 0xcbf29ce484222325n;
const FNV_OFFSET_2 = 0x84222325cbf29ce4n;
const FNV_PRIME = 0x100000001b3n;
const MASK_64 = (1n << 64n) - 1n;
const hash64 = (value, offset) => {
  let hash = offset;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= BigInt(value.charCodeAt(i));
    hash = hash * FNV_PRIME & MASK_64;
  }
  return hash;
};
const toHex64 = (value) => value.toString(16).padStart(16, "0");
const hash128 = (...data) => {
  const input = JSON.stringify(data);
  const high = hash64(input, FNV_OFFSET_1);
  const low = hash64(input, FNV_OFFSET_2);
  return `#${toHex64(high)}${toHex64(low)}`;
};
const tojson = (x) => JSON.stringify(x, null, 2);
const fromjson = (x) => JSON.parse(x);
const isRef = (value) => typeof value === "string" && /^#([a-f0-9]{32})$/i.test(value);
const hashData = (value) => {
  if (isRef(value)) return value;
  if (["string", "number", "boolean"].includes(typeof value) || value === null) {
    return hash128(tojson(value));
  }
  if (Array.isArray(value)) return hash128("arr", value.map(hashData));
  if (typeof value === "object") {
    const entries = Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => [k, hashData(v)]);
    return hash128(tojson(Object.fromEntries(entries)));
  }
  throw new Error(`unsupported type for hashing: ${typeof value}`);
};
const DB_NAME = "hashnotes";
let SERVER = localStorage.getItem("db_preset") == "local" ? "local" : "maincloud";
const baseUrl = () => ({
  local: "http://localhost:3000",
  maincloud: "https://maincloud.spacetimedb.com"
})[SERVER];
const accessToken = async () => {
  let tokenkey = () => `access_token:${SERVER}`;
  let tkey = tokenkey();
  let token = localStorage.getItem(tkey);
  if (!token) {
    token = await fetch(`${baseUrl()}/v1/identity`, { method: "POST", headers: { "Content-Type": "application/json" } }).then((r) => r.json()).then((j) => j.token || null);
    if (tkey != tokenkey()) return accessToken();
    if (token) localStorage.setItem(tkey, token);
  }
  return token;
};
let getServer = () => SERVER;
console.log("connect to", SERVER);
const call = async (name, payload) => {
  const res = await fetch(`${baseUrl()}/v1/database/${DB_NAME}/call/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: await accessToken().then((t) => t ? `Bearer ${t}` : "") },
    body: JSON.stringify(payload)
  });
  const text2 = await res.text();
  if (!res.ok) throw new Error(text2);
  return text2;
};
const noteCache = /* @__PURE__ */ new Map();
const addInFlight = /* @__PURE__ */ new Map();
const getInFlight = /* @__PURE__ */ new Map();
const addNote = async (data, options = {}) => {
  const { skipCache = false } = options;
  const hash = hashData(data);
  if (!skipCache) {
    const cached = noteCache.get(hash);
    if (cached !== void 0) return hash;
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
const getNote = async (hash, options = {}) => {
  const { skipCache = false } = options;
  if (!skipCache) {
    const cached = noteCache.get(hash);
    if (cached !== void 0) return cached;
    const addPending = addInFlight.get(hash);
    if (addPending) {
      try {
        await addPending;
        const afterAdd = noteCache.get(hash);
        if (afterAdd !== void 0) return afterAdd;
      } catch {
      }
    }
    const pending = getInFlight.get(hash);
    if (pending) return pending;
  }
  const p = (async () => {
    const wireValue = await call("get_note", { hash });
    const data = fromjson(fromjson(wireValue));
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
const deRef = async (value) => isRef(value) ? getNote(value).then(deRef) : value;
const asRef = async (value) => isRef(value) ? value : addNote(value);
const callNote = async (fn, arg) => {
  const fnRef = await asRef(fn);
  const argRef = await asRef(arg === void 0 ? null : arg);
  return await call("call_note", { fn: fnRef, arg: argRef }).then(fromjson).then(deRef);
};
const keywords = /* @__PURE__ */ new Set([
  "if",
  "else",
  "return",
  "await",
  "typeof",
  "let",
  "const",
  "for",
  "while",
  "in",
  "of",
  "break",
  "continue",
  "true",
  "false",
  "null"
]);
const isIdentStart = (c) => /[A-Za-z_$]/.test(c);
const isIdentPart = (c) => /[A-Za-z0-9_$]/.test(c);
const isDigit = (c) => /[0-9]/.test(c);
const tokenize = (src) => {
  const tokens = [];
  let i = 0;
  const push = (type, value, pos) => tokens.push({ type, value, pos });
  const peek = () => src[i];
  const next = () => src[i++];
  while (i < src.length) {
    const c = peek();
    if (c === " " || c === "\n" || c === "\r" || c === "	") {
      i++;
      continue;
    }
    if (c === "/" && src[i + 1] === "/") {
      i += 2;
      while (i < src.length && src[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      i += 2;
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (c === "'" || c === '"') {
      const quote = next();
      let out = "";
      const start2 = i - 1;
      while (i < src.length) {
        const ch = next();
        if (ch === "\\") {
          const esc = next();
          out += esc;
        } else if (ch === quote) {
          break;
        } else {
          out += ch;
        }
      }
      push("string", out, start2);
      continue;
    }
    if (isDigit(c)) {
      const start2 = i;
      let num = "";
      while (i < src.length && isDigit(peek())) num += next();
      if (peek() === ".") {
        num += next();
        while (i < src.length && isDigit(peek())) num += next();
      }
      push("number", num, start2);
      continue;
    }
    if (isIdentStart(c)) {
      const start2 = i;
      let id = "";
      while (i < src.length && isIdentPart(peek())) id += next();
      if (keywords.has(id)) push("keyword", id, start2);
      else push("identifier", id, start2);
      continue;
    }
    const start = i;
    const two = src.slice(i, i + 2);
    const three = src.slice(i, i + 3);
    if (three === "===" || three === "!==" || three === "...") {
      i += 3;
      push("operator", three, start);
      continue;
    }
    if (two === "&&" || two === "||" || two === "==" || two === "!=" || two === "<=" || two === ">=" || two === "=>" || two === "+=" || two === "-=" || two === "*=" || two === "/=" || two === "%=" || two === "++" || two === "--") {
      i += 2;
      push("operator", two, start);
      continue;
    }
    if ("+-*/%<>=!.,;:?(){}[]".includes(c)) {
      i++;
      const type = ".;,(){}[]".includes(c) ? "punct" : "operator";
      push(type, c, start);
      continue;
    }
    throw new Error(`Unexpected character '${c}' at ${i}`);
  }
  tokens.push({ type: "eof", value: "", pos: i });
  return tokens;
};
const validateScopes = (program, allowedGlobals = []) => {
  const errors = [];
  const globals = new Set(allowedGlobals);
  const scopes = [/* @__PURE__ */ new Set()];
  const declare = (name) => scopes[scopes.length - 1].add(name);
  const isDeclared = (name) => scopes.some((s) => s.has(name)) || globals.has(name);
  const enter = () => scopes.push(/* @__PURE__ */ new Set());
  const exit = () => {
    scopes.pop();
  };
  const checkIdent = (name) => {
    if (!isDeclared(name)) errors.push(`undeclared: ${name}`);
  };
  const declarePattern = (p) => {
    if (p.type === "Identifier") declare(p.name);
    else if (p.type === "RestElement") declarePattern(p.argument);
    else if (p.type === "ArrayPattern") p.elements.forEach(declarePattern);
    else p.properties.forEach((prop) => {
      if (prop.type === "RestElement") declarePattern(prop.argument);
      else declarePattern(prop.value);
    });
  };
  const visitExpr = (e) => {
    switch (e.type) {
      case "Identifier":
        checkIdent(e.name);
        return;
      case "Literal":
        return;
      case "SpreadElement":
        visitExpr(e.argument);
        return;
      case "ArrayExpression":
        e.elements.forEach((el) => visitExpr(el));
        return;
      case "ObjectExpression":
        e.properties.forEach((p) => {
          if (p.type === "SpreadElement") visitExpr(p.argument);
          else visitExpr(p.value);
        });
        return;
      case "AwaitExpression":
        visitExpr(e.argument);
        return;
      case "CallExpression":
        visitExpr(e.callee);
        e.arguments.forEach((a) => visitExpr(a));
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
        enter();
        e.params.forEach(declarePattern);
        if (e.body.type === "BlockStatement") visitStmt(e.body);
        else visitExpr(e.body);
        exit();
        return;
    }
  };
  const visitVarDecl = (d) => {
    declarePattern(d.id);
    if (d.init) visitExpr(d.init);
  };
  const visitStmt = (s) => {
    switch (s.type) {
      case "BlockStatement":
        enter();
        s.body.forEach(visitStmt);
        exit();
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
        s.declarations.forEach(visitVarDecl);
        return;
      case "WhileStatement":
        visitExpr(s.test);
        visitStmt(s.body);
        return;
      case "ForStatement": {
        enter();
        if (Array.isArray(s.init)) s.init.forEach(visitVarDecl);
        else if (s.init) visitExpr(s.init);
        if (s.test) visitExpr(s.test);
        if (s.update) visitExpr(s.update);
        visitStmt(s.body);
        exit();
        return;
      }
      case "ForInStatement":
      case "ForOfStatement": {
        enter();
        if (Array.isArray(s.left)) s.left.forEach(visitVarDecl);
        else visitExpr(s.left);
        visitExpr(s.right);
        visitStmt(s.body);
        exit();
        return;
      }
      case "BreakStatement":
      case "ContinueStatement":
        return;
    }
  };
  program.body.forEach(visitStmt);
  return errors;
};
const validateNoPrototype = (program) => {
  const errors = [];
  const forbiddenMembers = /* @__PURE__ */ new Set(["prototype", "constructor", "__proto__"]);
  const visitExpr = (e) => {
    switch (e.type) {
      case "MemberExpression":
        if (!e.computed && e.property.type === "Identifier" && forbiddenMembers.has(e.property.name)) {
          errors.push("prototype access");
        }
        if (e.computed && !(e.property.type === "Literal" && typeof e.property.value === "number")) {
          errors.push("only numeric literal indexing allowed");
        }
        visitExpr(e.object);
        if (e.computed) visitExpr(e.property);
        return;
      case "SpreadElement":
        visitExpr(e.argument);
        return;
      case "CallExpression":
        visitExpr(e.callee);
        e.arguments.forEach((a) => visitExpr(a));
        return;
      case "AwaitExpression":
        visitExpr(e.argument);
        return;
      case "ArrayExpression":
        e.elements.forEach((el) => visitExpr(el));
        return;
      case "ObjectExpression":
        e.properties.forEach((p) => {
          if (p.type === "SpreadElement") visitExpr(p.argument);
          else visitExpr(p.value);
        });
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
        if (e.body.type === "BlockStatement") visitStmt(e.body);
        else visitExpr(e.body);
        return;
      case "Identifier":
      case "Literal":
        return;
    }
  };
  const visitStmt = (s) => {
    switch (s.type) {
      case "BlockStatement":
        s.body.forEach(visitStmt);
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
        s.declarations.forEach((d) => d.init && visitExpr(d.init));
        return;
      case "WhileStatement":
        visitExpr(s.test);
        visitStmt(s.body);
        return;
      case "ForStatement":
        if (Array.isArray(s.init)) s.init.forEach((d) => d.init && visitExpr(d.init));
        else if (s.init) visitExpr(s.init);
        if (s.test) visitExpr(s.test);
        if (s.update) visitExpr(s.update);
        visitStmt(s.body);
        return;
      case "ForInStatement":
      case "ForOfStatement":
        if (Array.isArray(s.left)) s.left.forEach((d) => d.init && visitExpr(d.init));
        else visitExpr(s.left);
        visitExpr(s.right);
        visitStmt(s.body);
        return;
      case "BreakStatement":
      case "ContinueStatement":
        return;
    }
  };
  program.body.forEach(visitStmt);
  return errors;
};
const parse = (src) => {
  const tokens = tokenize(src);
  let i = 0;
  const peek = () => tokens[i];
  const next = () => tokens[i++];
  const eat = (type, value) => {
    const t = peek();
    if (t.type !== type || value !== void 0 && t.value !== value) {
      throw new Error(`Expected ${value ?? type} at ${t.pos}`);
    }
    return next();
  };
  const match = (type, value) => {
    const t = peek();
    return t.type === type && (value === void 0 || t.value === value);
  };
  const parseProgram = () => {
    const body = [];
    while (!match("eof")) body.push(parseStatement());
    return { type: "Program", body };
  };
  const parseStatement = () => {
    if (match("punct", "{")) return parseBlock();
    if (match("keyword", "if")) return parseIf();
    if (match("keyword", "while")) return parseWhile();
    if (match("keyword", "for")) return parseFor();
    if (match("keyword", "break")) {
      next();
      if (match("punct", ";")) next();
      return { type: "BreakStatement" };
    }
    if (match("keyword", "continue")) {
      next();
      if (match("punct", ";")) next();
      return { type: "ContinueStatement" };
    }
    if (match("keyword", "return")) return parseReturn();
    if (match("keyword", "let") || match("keyword", "const")) return parseVarDecl();
    const expr = parseExpression();
    if (match("punct", ";")) next();
    return { type: "ExpressionStatement", expression: expr };
  };
  const parseBlock = () => {
    eat("punct", "{");
    const body = [];
    while (!match("punct", "}")) body.push(parseStatement());
    eat("punct", "}");
    return { type: "BlockStatement", body };
  };
  const parseIf = () => {
    eat("keyword", "if");
    eat("punct", "(");
    const test = parseExpression();
    eat("punct", ")");
    const consequent = parseStatement();
    const alternate = match("keyword", "else") ? (next(), parseStatement()) : null;
    return { type: "IfStatement", test, consequent, alternate };
  };
  const parseReturn = () => {
    eat("keyword", "return");
    if (match("punct", ";")) {
      next();
      return { type: "ReturnStatement", argument: null };
    }
    const argument = match("punct", "}") ? null : parseExpression();
    if (match("punct", ";")) next();
    return { type: "ReturnStatement", argument };
  };
  const parseVarDeclCore = (consumeSemi) => {
    const kind = next().value;
    const declarations = [];
    do {
      const id = parsePattern();
      const init = match("operator", "=") ? (next(), parseExpression()) : null;
      declarations.push({ type: "VariableDeclarator", id, init });
      if (!match("punct", ",")) break;
      next();
    } while (true);
    if (consumeSemi && match("punct", ";")) next();
    return { kind, declarations };
  };
  const parseVarDecl = () => {
    const { kind, declarations } = parseVarDeclCore(true);
    return { type: "VariableDeclaration", kind, declarations };
  };
  const parseWhile = () => {
    eat("keyword", "while");
    eat("punct", "(");
    const test = parseExpression();
    eat("punct", ")");
    const body = parseStatement();
    return { type: "WhileStatement", test, body };
  };
  const parseFor = () => {
    eat("keyword", "for");
    eat("punct", "(");
    let init = null;
    let initKind = null;
    if (!match("punct", ";")) {
      if (match("keyword", "let") || match("keyword", "const")) {
        const parsed = parseVarDeclCore(false);
        init = parsed.declarations;
        initKind = parsed.kind;
      } else {
        init = parseExpression();
      }
    }
    if (match("keyword", "in") || match("keyword", "of")) {
      const kind = next().value;
      const right = parseExpression();
      eat("punct", ")");
      const body2 = parseStatement();
      if (!init) throw new Error(`Expected initializer before ${kind} at ${peek().pos}`);
      return kind === "in" ? { type: "ForInStatement", left: init, leftKind: initKind, right, body: body2 } : { type: "ForOfStatement", left: init, leftKind: initKind, right, body: body2 };
    }
    eat("punct", ";");
    const test = match("punct", ";") ? null : parseExpression();
    eat("punct", ";");
    const update = match("punct", ")") ? null : parseExpression();
    eat("punct", ")");
    const body = parseStatement();
    return { type: "ForStatement", init, initKind, test, update, body };
  };
  const parseExpression = () => parseAssignment();
  const parseAssignment = () => {
    const left = parseConditional();
    if (match("operator", "=") || match("operator", "+=") || match("operator", "-=") || match("operator", "*=") || match("operator", "/=") || match("operator", "%=")) {
      const op = next().value;
      const right = parseAssignment();
      return { type: "AssignmentExpression", operator: op, left, right };
    }
    return left;
  };
  const parseConditional = () => {
    let test = parseLogicalOr();
    if (match("operator", "?")) {
      next();
      const consequent = parseExpression();
      eat("operator", ":");
      const alternate = parseExpression();
      return { type: "ConditionalExpression", test, consequent, alternate };
    }
    return test;
  };
  const parseLogicalOr = () => {
    let left = parseLogicalAnd();
    while (match("operator", "||")) {
      const op = next().value;
      const right = parseLogicalAnd();
      left = { type: "LogicalExpression", operator: op, left, right };
    }
    return left;
  };
  const parseLogicalAnd = () => {
    let left = parseEquality();
    while (match("operator", "&&")) {
      const op = next().value;
      const right = parseEquality();
      left = { type: "LogicalExpression", operator: op, left, right };
    }
    return left;
  };
  const parseEquality = () => {
    let left = parseRelational();
    while (match("operator", "==") || match("operator", "!=") || match("operator", "===") || match("operator", "!==")) {
      const op = next().value;
      const right = parseRelational();
      left = { type: "BinaryExpression", operator: op, left, right };
    }
    return left;
  };
  const parseRelational = () => {
    let left = parseAdditive();
    while (match("operator", "<") || match("operator", "<=") || match("operator", ">") || match("operator", ">=")) {
      const op = next().value;
      const right = parseAdditive();
      left = { type: "BinaryExpression", operator: op, left, right };
    }
    return left;
  };
  const parseAdditive = () => {
    let left = parseMultiplicative();
    while (match("operator", "+") || match("operator", "-")) {
      const op = next().value;
      const right = parseMultiplicative();
      left = { type: "BinaryExpression", operator: op, left, right };
    }
    return left;
  };
  const parseMultiplicative = () => {
    let left = parseUnary();
    while (match("operator", "*") || match("operator", "/") || match("operator", "%")) {
      const op = next().value;
      const right = parseUnary();
      left = { type: "BinaryExpression", operator: op, left, right };
    }
    return left;
  };
  const parseUnary = () => {
    if (match("keyword", "await")) {
      next();
      return { type: "AwaitExpression", argument: parseUnary() };
    }
    if (match("operator", "++") || match("operator", "--")) {
      const op = next().value;
      return { type: "UpdateExpression", operator: op, argument: parseUnary(), prefix: true };
    }
    if (match("keyword", "typeof")) {
      next();
      return { type: "UnaryExpression", operator: "typeof", argument: parseUnary() };
    }
    if (match("operator", "!") || match("operator", "-") || match("operator", "+")) {
      const op = next().value;
      return { type: "UnaryExpression", operator: op, argument: parseUnary() };
    }
    return parsePostfix();
  };
  const parsePostfix = () => {
    let expr = parseArrowOrPrimary();
    while (true) {
      if (match("operator", "++") || match("operator", "--")) {
        const op = next().value;
        expr = { type: "UpdateExpression", operator: op, argument: expr, prefix: false };
        continue;
      }
      if (match("punct", "(")) {
        const args = parseArguments();
        expr = { type: "CallExpression", callee: expr, arguments: args };
        continue;
      }
      if (match("punct", ".")) {
        next();
        const prop = parseIdentifier();
        expr = { type: "MemberExpression", object: expr, property: prop, computed: false };
        continue;
      }
      if (match("punct", "[")) {
        next();
        const prop = parseExpression();
        eat("punct", "]");
        expr = { type: "MemberExpression", object: expr, property: prop, computed: true };
        continue;
      }
      break;
    }
    return expr;
  };
  const parseArrowOrPrimary = () => {
    if (match("identifier", "async")) {
      const start = i;
      next();
      if (match("identifier")) {
        const id = parseIdentifier();
        if (match("operator", "=>")) {
          next();
          const body = match("punct", "{") ? parseBlock() : parseExpression();
          return { type: "ArrowFunctionExpression", params: [id], body, async: true };
        }
      } else if (match("punct", "(")) {
        next();
        const params = [];
        let isParams = true;
        try {
          if (!match("punct", ")")) {
            do {
              params.push(parsePattern());
              if (!match("punct", ",")) break;
              next();
            } while (true);
          }
        } catch {
          isParams = false;
        }
        if (isParams && match("punct", ")")) {
          next();
          if (match("operator", "=>")) {
            next();
            const body = match("punct", "{") ? parseBlock() : parseExpression();
            return { type: "ArrowFunctionExpression", params, body, async: true };
          }
        }
      }
      i = start;
    }
    if (match("identifier")) {
      const id = parseIdentifier();
      if (match("operator", "=>")) {
        next();
        const body = match("punct", "{") ? parseBlock() : parseExpression();
        return { type: "ArrowFunctionExpression", params: [id], body, async: false };
      }
      return id;
    }
    if (match("punct", "(")) {
      const start = i;
      next();
      const params = [];
      let isParams = true;
      try {
        if (!match("punct", ")")) {
          do {
            params.push(parsePattern());
            if (!match("punct", ",")) break;
            next();
          } while (true);
        }
      } catch {
        isParams = false;
      }
      if (isParams && match("punct", ")")) {
        next();
        if (match("operator", "=>")) {
          next();
          const body = match("punct", "{") ? parseBlock() : parseExpression();
          return { type: "ArrowFunctionExpression", params, body, async: false };
        }
      }
      i = start;
      eat("punct", "(");
      const expr = parseExpression();
      eat("punct", ")");
      return expr;
    }
    return parsePrimary();
  };
  const parsePrimary = () => {
    if (match("number")) return { type: "Literal", value: Number(next().value) };
    if (match("string")) return { type: "Literal", value: next().value };
    if (match("keyword", "true")) {
      next();
      return { type: "Literal", value: true };
    }
    if (match("keyword", "false")) {
      next();
      return { type: "Literal", value: false };
    }
    if (match("keyword", "null")) {
      next();
      return { type: "Literal", value: null };
    }
    if (match("punct", "[")) return parseArray();
    if (match("punct", "{")) return parseObject();
    if (match("identifier")) return parseIdentifier();
    throw new Error(`Unexpected token ${peek().type} ${peek().value} at ${peek().pos}`);
  };
  const parseArray = () => {
    eat("punct", "[");
    const elements2 = [];
    if (!match("punct", "]")) {
      do {
        if (match("operator", "...")) {
          next();
          elements2.push({ type: "SpreadElement", argument: parseExpression() });
        } else {
          elements2.push(parseExpression());
        }
        if (!match("punct", ",")) break;
        next();
      } while (true);
    }
    eat("punct", "]");
    return { type: "ArrayExpression", elements: elements2 };
  };
  const parseObject = () => {
    eat("punct", "{");
    const properties = [];
    if (!match("punct", "}")) {
      do {
        if (match("operator", "...")) {
          next();
          properties.push({ type: "SpreadElement", argument: parseExpression() });
          if (!match("punct", ",")) break;
          next();
          continue;
        }
        let key;
        let shorthand = false;
        if (match("identifier")) key = parseIdentifier();
        else if (match("string")) key = { type: "Literal", value: next().value };
        else if (match("number")) key = { type: "Literal", value: Number(next().value) };
        else throw new Error(`Expected object key at ${peek().pos}`);
        let value;
        if (match("operator", ":")) {
          next();
          value = parseExpression();
        } else {
          if (key.type !== "Identifier") throw new Error(`Expected ':' after key at ${peek().pos}`);
          value = key;
          shorthand = true;
        }
        properties.push({ type: "Property", key, value, shorthand });
        if (!match("punct", ",")) break;
        next();
      } while (true);
    }
    eat("punct", "}");
    return { type: "ObjectExpression", properties };
  };
  const parseArguments = () => {
    eat("punct", "(");
    const args = [];
    if (!match("punct", ")")) {
      do {
        if (match("operator", "...")) {
          next();
          args.push({ type: "SpreadElement", argument: parseExpression() });
        } else {
          args.push(parseExpression());
        }
        if (!match("punct", ",")) break;
        next();
      } while (true);
    }
    eat("punct", ")");
    return args;
  };
  const parseIdentifier = () => {
    const t = eat("identifier");
    return { type: "Identifier", name: t.value };
  };
  const parsePattern = () => {
    if (match("operator", "...")) {
      next();
      return { type: "RestElement", argument: parsePattern() };
    }
    if (match("punct", "[")) {
      eat("punct", "[");
      const elements2 = [];
      if (!match("punct", "]")) {
        do {
          elements2.push(parsePattern());
          if (!match("punct", ",")) break;
          next();
        } while (true);
      }
      eat("punct", "]");
      return { type: "ArrayPattern", elements: elements2 };
    }
    if (match("punct", "{")) {
      eat("punct", "{");
      const properties = [];
      if (!match("punct", "}")) {
        do {
          if (match("operator", "...")) {
            next();
            properties.push({ type: "RestElement", argument: parsePattern() });
            if (!match("punct", ",")) break;
            next();
            continue;
          }
          let key;
          let shorthand = false;
          if (match("identifier")) key = parseIdentifier();
          else if (match("string")) key = { type: "Literal", value: next().value };
          else if (match("number")) key = { type: "Literal", value: Number(next().value) };
          else throw new Error(`Expected object pattern key at ${peek().pos}`);
          let value;
          if (match("operator", ":")) {
            next();
            value = parsePattern();
          } else {
            if (key.type !== "Identifier") throw new Error(`Expected ':' after key at ${peek().pos}`);
            value = key;
            shorthand = true;
          }
          properties.push({ type: "Property", key, value, shorthand });
          if (!match("punct", ",")) break;
          next();
        } while (true);
      }
      eat("punct", "}");
      return { type: "ObjectPattern", properties };
    }
    return parseIdentifier();
  };
  return parseProgram();
};
const SAFE_IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const FORBIDDEN_IDENTS = /* @__PURE__ */ new Set([
  "eval",
  "arguments",
  "this",
  "globalThis",
  "window",
  "document",
  "self",
  "top",
  "parent",
  "frames",
  "process",
  "require",
  "module",
  "exports",
  "__dirname",
  "__filename",
  "importScripts"
]);
const assertSafeIdent = (name) => {
  if (!SAFE_IDENT_RE.test(name))
    throw new Error(`unsafe identifier in codegen: ${JSON.stringify(name)}`);
  if (FORBIDDEN_IDENTS.has(name))
    throw new Error(`forbidden identifier in codegen: ${name}`);
};
const renderLiteral = (v) => {
  if (v === null) return "null";
  if (typeof v === "string") return JSON.stringify(v);
  return String(v);
};
const renderExpr = (e) => {
  switch (e.type) {
    case "Identifier":
      assertSafeIdent(e.name);
      return e.name;
    case "SpreadElement":
      return `...${renderExpr(e.argument)}`;
    case "Literal":
      return renderLiteral(e.value);
    case "ArrayExpression":
      return `[${e.elements.map(renderExpr).join(", ")}]`;
    case "ObjectExpression":
      return `{${e.properties.map((p) => p.type === "SpreadElement" ? `...${renderExpr(p.argument)}` : renderProp(p)).join(", ")}}`;
    case "AwaitExpression":
      return `(await ${renderExpr(e.argument)})`;
    case "CallExpression": {
      const calleeStr = renderExpr(e.callee);
      const needsParens = e.callee.type === "ArrowFunctionExpression";
      return `${needsParens ? "(" : ""}${calleeStr}${needsParens ? ")" : ""}(${e.arguments.map(renderExpr).join(", ")})`;
    }
    case "MemberExpression":
      return e.computed ? `${renderExpr(e.object)}[${renderExpr(e.property)}]` : `${renderExpr(e.object)}.${renderExpr(e.property)}`;
    case "AssignmentExpression":
      return `${renderExpr(e.left)} ${e.operator} ${renderExpr(e.right)}`;
    case "UpdateExpression":
      return e.prefix ? `${e.operator}${renderExpr(e.argument)}` : `${renderExpr(e.argument)}${e.operator}`;
    case "BinaryExpression":
    case "LogicalExpression":
      return `(${renderExpr(e.left)} ${e.operator} ${renderExpr(e.right)})`;
    case "UnaryExpression":
      return e.operator === "typeof" ? `(${e.operator} ${renderExpr(e.argument)})` : `(${e.operator}${renderExpr(e.argument)})`;
    case "ConditionalExpression":
      return `(${renderExpr(e.test)} ? ${renderExpr(e.consequent)} : ${renderExpr(e.alternate)})`;
    case "ArrowFunctionExpression":
      return renderArrow(e);
  }
};
const renderProp = (p) => {
  const key = p.key.type === "Identifier" ? p.key.name : renderLiteral(p.key.value);
  if (p.shorthand && p.value.type === "Identifier" && p.value.name === key) {
    assertSafeIdent(key);
    return key;
  }
  return `${key}: ${renderExpr(p.value)}`;
};
const renderArrow = (e) => {
  const params = `(${e.params.map(renderPattern).join(", ")})`;
  const prefix = e.async ? "async " : "";
  if (e.body.type === "BlockStatement") {
    return `${prefix}${params} => ${renderStmt(e.body, true)}`;
  }
  return `${prefix}${params} => { __burn(); return ${renderExpr(e.body)}; }`;
};
const renderStmt = (s, inFn = false) => {
  const burn = inFn ? "__burn();" : "";
  const renderLoopBody = (body) => {
    if (body.type === "BlockStatement") {
      const inner = body.body.map((b) => renderStmt(b, inFn)).join("");
      return `{__burn();${inner}}`;
    }
    return `{__burn();${renderStmt(body, inFn)}}`;
  };
  switch (s.type) {
    case "BlockStatement":
      return `{${s.body.map((b) => renderStmt(b, inFn)).join("")}}`;
    case "ExpressionStatement":
      return `${burn}${renderExpr(s.expression)};`;
    case "IfStatement": {
      const wrap = (stmt) => stmt.type === "BlockStatement" ? renderStmt(stmt, inFn) : `{${renderStmt(stmt, inFn)}}`;
      return `${burn}if (${renderExpr(s.test)}) ${wrap(s.consequent)}${s.alternate ? ` else ${wrap(s.alternate)}` : ""}`;
    }
    case "ReturnStatement":
      return `${burn}return${s.argument ? ` ${renderExpr(s.argument)}` : ""};`;
    case "VariableDeclaration":
      return `${burn}${s.kind} ${s.declarations.map(renderDecl).join(", ")};`;
    case "BreakStatement":
      return `${burn}break;`;
    case "ContinueStatement":
      return `${burn}continue;`;
    case "WhileStatement":
      return `${burn}while (${renderExpr(s.test)}) ${renderLoopBody(s.body)}`;
    case "ForStatement": {
      const init = s.init == null ? "" : Array.isArray(s.init) ? `${s.initKind} ${s.init.map(renderDecl).join(", ")}` : renderExpr(s.init);
      const test = s.test ? renderExpr(s.test) : "";
      const update = s.update ? renderExpr(s.update) : "";
      return `${burn}for (${init}; ${test}; ${update}) ${renderLoopBody(s.body)}`;
    }
    case "ForInStatement": {
      const left = Array.isArray(s.left) ? `${s.leftKind} ${s.left.map(renderDecl).join(", ")}` : renderExpr(s.left);
      return `${burn}for (${left} in ${renderExpr(s.right)}) ${renderLoopBody(s.body)}`;
    }
    case "ForOfStatement": {
      const left = Array.isArray(s.left) ? `${s.leftKind} ${s.left.map(renderDecl).join(", ")}` : renderExpr(s.left);
      return `${burn}for (${left} of ${renderExpr(s.right)}) ${renderLoopBody(s.body)}`;
    }
  }
};
const renderDecl = (d) => `${renderPattern(d.id)}${d.init ? ` = ${renderExpr(d.init)}` : ""}`;
const renderPattern = (p) => {
  if (p.type === "Identifier") {
    assertSafeIdent(p.name);
    return p.name;
  }
  if (p.type === "RestElement") return `...${renderPattern(p.argument)}`;
  if (p.type === "ArrayPattern") return `[${p.elements.map(renderPattern).join(", ")}]`;
  return `{${p.properties.map((prop) => prop.type === "RestElement" ? `...${renderPattern(prop.argument)}` : renderPatternProperty(prop)).join(", ")}}`;
};
const renderPatternProperty = (p) => {
  const key = p.key.type === "Identifier" ? p.key.name : renderLiteral(p.key.value);
  if (p.shorthand && p.key.type === "Identifier" && p.value.type === "Identifier" && p.value.name === p.key.name) {
    assertSafeIdent(key);
    return key;
  }
  return `${key}: ${renderPattern(p.value)}`;
};
const validateNoReservedRuntimeNames = (program, reservedNames) => {
  const reserved = new Set(reservedNames);
  const errors = [];
  const hit = (name) => {
    if (reserved.has(name)) errors.push(`reserved identifier: ${name}`);
  };
  const visitPattern = (p) => {
    switch (p.type) {
      case "Identifier":
        hit(p.name);
        return;
      case "RestElement":
        visitPattern(p.argument);
        return;
      case "ArrayPattern":
        p.elements.forEach(visitPattern);
        return;
      case "ObjectPattern":
        p.properties.forEach((prop) => {
          if (prop.type === "RestElement") {
            visitPattern(prop.argument);
            return;
          }
          visitPattern(prop.value);
        });
        return;
    }
  };
  const visitExpr = (e) => {
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
        e.elements.forEach((el) => visitExpr(el));
        return;
      case "ObjectExpression":
        e.properties.forEach((p) => {
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
        e.arguments.forEach((a) => visitExpr(a));
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
        e.params.forEach(visitPattern);
        if (e.body.type === "BlockStatement") visitStmt(e.body);
        else visitExpr(e.body);
        return;
    }
  };
  const visitVarDecl = (d) => {
    visitPattern(d.id);
    if (d.init) visitExpr(d.init);
  };
  const visitStmt = (s) => {
    switch (s.type) {
      case "BlockStatement":
        s.body.forEach(visitStmt);
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
        s.declarations.forEach(visitVarDecl);
        return;
      case "WhileStatement":
        visitExpr(s.test);
        visitStmt(s.body);
        return;
      case "ForStatement":
        if (Array.isArray(s.init)) s.init.forEach(visitVarDecl);
        else if (s.init) visitExpr(s.init);
        if (s.test) visitExpr(s.test);
        if (s.update) visitExpr(s.update);
        visitStmt(s.body);
        return;
      case "ForInStatement":
      case "ForOfStatement":
        if (Array.isArray(s.left)) s.left.forEach(visitVarDecl);
        else visitExpr(s.left);
        visitExpr(s.right);
        visitStmt(s.body);
        return;
      case "BreakStatement":
      case "ContinueStatement":
        return;
    }
  };
  program.body.forEach(visitStmt);
  return errors;
};
const renderRunnerWithFuelSharedAsync = (program, fuelRefName = "__fuel") => {
  assertSafeIdent(fuelRefName);
  const reservedErrs = validateNoReservedRuntimeNames(program, [fuelRefName, "__burn"]);
  if (reservedErrs.length) throw new Error(reservedErrs.join(", "));
  const prelude = `const __burn = () => { if (--${fuelRefName}.value < 0) throw new Error("fuel exhausted"); };`;
  const body = program.body.map((s) => renderStmt(s, true)).join("");
  return `${prelude}const __run = async () => {${body}}; return __run().then(ok => ({ ok, fuel: ${fuelRefName}.value })).catch(err => ({ err: String(err), fuel: ${fuelRefName}.value }));`;
};
const SAFE_OBJECT = (() => {
  const safe = /* @__PURE__ */ Object.create(null);
  safe.keys = (obj) => Object.keys(obj);
  safe.values = (obj) => Object.values(obj);
  safe.entries = (obj) => Object.entries(obj);
  return Object.freeze(safe);
})();
const parseFunctionCtor = (ctorArgs) => {
  if (ctorArgs.some((v) => typeof v !== "string")) {
    throw new Error("Function arguments must be strings");
  }
  const parts = ctorArgs;
  const body = parts.length ? parts[parts.length - 1] : "";
  const rawParams = parts.slice(0, -1);
  const params = [];
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
  if (restCount > 1 || restCount === 1 && !params[params.length - 1].rest) {
    throw new Error("Rest parameter must be the last parameter");
  }
  return { params, body };
};
const mapFunctionArgs = (params, callArgs) => {
  const env = {};
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
const makeSafeFunctionAsync = (fuelRef, outerGlobals) => (...ctorArgs) => {
  const { params, body } = parseFunctionCtor(ctorArgs);
  return async (...callArgs) => {
    const localEnv = { ...outerGlobals, ...mapFunctionArgs(params, callArgs) };
    const res = await runWithFuelSharedAsync(body, fuelRef, localEnv);
    if ("err" in res) throw new Error(res.err);
    return res.ok;
  };
};
const withBuiltins = (env, fuelRef, mode) => {
  const baseGlobals = {
    ...env,
    Object: SAFE_OBJECT,
    Promise
  };
  return {
    ...baseGlobals,
    Function: makeSafeFunctionAsync(fuelRef, baseGlobals)
  };
};
const stringifyError = (err) => {
  if (err instanceof Error) {
    const stack = err.stack || "";
    const prefix = `${err.name}: ${err.message}`;
    const cleanStack = stack.replace(/^[^\n]*\n?/, "").replace(/spacetimedb_module:(\d+):(\d+)/g, "<bundled:$1:$2>");
    return cleanStack ? `${prefix}
${cleanStack}` : prefix;
  }
  if (typeof err === "object" && err !== null) {
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
};
const runWithFuelSharedAsync = async (src, fuelRef, env = {}, fuelRefName = "__fuel") => {
  try {
    const runtimeEnv = withBuiltins(env, fuelRef, "async");
    const program = parse(src);
    const protoErrs = validateNoPrototype(program);
    if (protoErrs.length) return { err: "prototype access", fuel: fuelRef.value };
    const scopeErrs = validateScopes(program, [...Object.keys(runtimeEnv), fuelRefName]);
    if (scopeErrs.length) return { err: scopeErrs.join(", "), fuel: fuelRef.value };
    const code = renderRunnerWithFuelSharedAsync(program, fuelRefName);
    const fullEnv = { ...runtimeEnv, [fuelRefName]: fuelRef };
    const fn = new Function(...Object.keys(fullEnv), code);
    return await fn(...Object.values(fullEnv));
  } catch (err) {
    return { err: stringifyError(err), fuel: fuelRef.value };
  }
};
const localStoreKey = (fnRef, key) => `${fnRef}|${hashData(key)}`;
const createLocalExecutor = (options) => {
  const fuelRef = { value: options.fuel ?? 1e5 };
  const localStoreBacking = /* @__PURE__ */ new Map();
  const callLocal = async (fnInput, argInput) => {
    const fnRef = await asRef(fnInput);
    const argRef = await asRef(argInput);
    const fnNote = await deRef(fnRef);
    if (typeof fnNote !== "string") throw new Error("function note must resolve to a string");
    const argNote = await deRef(argRef);
    const store = {
      get: (key) => {
        const skey = localStoreKey(fnRef, key);
        return localStoreBacking.get(skey);
      },
      set: (key, value) => {
        const skey = localStoreKey(fnRef, key);
        localStoreBacking.set(skey, value);
        return value;
      }
    };
    const remote = async (remoteFn, remoteArg) => callNote(remoteFn, remoteArg === void 0 ? null : remoteArg);
    const result = await runWithFuelSharedAsync(
      fnNote,
      fuelRef,
      {
        ...options.env ?? {},
        arg: argNote,
        argRef,
        call: callLocal,
        callNote: callLocal,
        remote,
        store,
        addNote,
        getNote,
        asRef,
        deref: deRef,
        hashData,
        fromjson,
        HTML
      }
    );
    if ("err" in result) throw new Error(result.err);
    return result.ok;
  };
  return callLocal;
};
const callViewClient = async (fn, arg, options = {}) => {
  const callLocal = createLocalExecutor(options);
  const result = await callLocal(fn, arg === void 0 ? null : arg);
  if (typeof result !== "function") {
    throw new Error("view function must return (upper) => VDom");
  }
  return result;
};
const parseRefFromPath = (pathname) => {
  const segment = pathname.replace(/^\/+/, "").split("/")[0];
  if (!segment) return null;
  const decoded = decodeURIComponent(segment).trim();
  if (!decoded) return null;
  if (isRef(decoded)) return decoded;
  if (/^[a-f0-9]{32}$/i.test(decoded)) return `#${decoded}`;
  return null;
};
const boot = async () => {
  const mount = document.getElementById("app") ?? document.body;
  const ref = parseRefFromPath(window.location.pathname);
  if (!ref) {
    mount.innerHTML = "";
    mount.textContent = "Open /<note-hash> to render that note as a view.";
    return;
  }
  try {
    const view = await callViewClient(ref, {});
    const el = renderDom(view);
    mount.innerHTML = "";
    mount.append(el);
  } catch (err) {
    mount.innerHTML = `<pre>Failed to render note ${ref} on server ${getServer()}: ${String(err)}</pre>`;
  }
};
boot().catch((err) => {
  console.error(err);
  const mount = document.getElementById("app") ?? document.body;
  mount.textContent = `App boot failed: ${String(err)}`;
});
//# sourceMappingURL=index-CVqA30YG.js.map
