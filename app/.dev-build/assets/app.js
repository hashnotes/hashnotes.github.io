// ../lib/src/views.ts
var mouseEvents = ["click", "mousemove", "mouseup", "mousedown", "drag", "wheel"];
var keyboardEvents = ["keydown", "keyup"];
var svgNamespace = "http://www.w3.org/2000/svg";
var svgTags = /* @__PURE__ */ new Set(["svg", "path", "g", "line", "polyline", "polygon", "circle", "ellipse", "rect", "text"]);
var allowedAttributeNames = /* @__PURE__ */ new Set(["viewBox", "width", "height", "xmlns", "d", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-dasharray", "stroke-dashoffset", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "points", "transform", "opacity", "font-size", "font-family", "font-weight", "text-anchor", "dominant-baseline", "dx", "dy", "href", "target", "rel"]);
var doms = /* @__PURE__ */ new WeakMap();
var elements = /* @__PURE__ */ new WeakMap();
var renderDom = (mker, location = { pathname: "/" }, width = globalThis.innerWidth ?? 0, height = globalThis.innerHeight ?? 0) => {
  let ctxRef = null;
  const render = (dom) => {
    const el2 = svgTags.has(dom.tag) ? document.createElementNS(svgNamespace, dom.tag) : document.createElement(dom.tag);
    el2.textContent = dom.textContent;
    if ((el2 instanceof HTMLInputElement || el2 instanceof HTMLTextAreaElement) && dom.value) el2.value = dom.value;
    elements.set(dom, el2);
    doms.set(el2, dom);
    el2.append(...dom.children.map((c) => render(c)));
    Object.entries(dom.attrs).forEach(([k, v]) => {
      if (allowedAttributeNames.has(k)) el2.setAttribute(k, v);
    });
    Object.entries(dom.style).forEach((st) => el2.style.setProperty(...st));
    mouseEvents.forEach((type) => el2.addEventListener(type, (e) => {
      if (ctxRef && ctxRef.onUserEvent) ctxRef.onUserEvent(type);
      const me = e;
      const event = {
        type,
        target: doms.get(e.target),
        clientX: me.clientX,
        clientY: me.clientY,
        deltaY: type === "wheel" ? me.deltaY : void 0,
        currentTarget: el2,
        preventDefault: () => e.preventDefault()
      };
      if (type === "click" && dom.onclick) dom.onclick(event);
      else if (type === "mousedown" && dom.onmousedown) dom.onmousedown(event);
      else if (type === "mouseup" && dom.onmouseup) dom.onmouseup(event);
      else if (type === "mousemove" && dom.onmousemove) dom.onmousemove(event);
      else if (type === "wheel" && dom.onwheel) dom.onwheel(event);
    }));
    keyboardEvents.forEach((type) => el2.addEventListener(type, (e) => {
      if (ctxRef && ctxRef.onUserEvent) ctxRef.onUserEvent(type);
      let { key, metaKey, shiftKey } = e;
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) dom.value = e.target.value;
      const event = { type, key, metaKey, shiftKey, target: doms.get(e.target) };
      if (type === "keydown" && dom.onkeydown) dom.onkeydown(event);
      else if (type === "keyup" && dom.onkeyup) dom.onkeyup(event);
    }));
    return el2;
  };
  const ctx = {
    add: (parent, ...el2) => {
      elements.get(parent)?.append(...el2.map((e) => render(e)));
    },
    del: (el2) => {
      doms.delete(elements.get(el2));
      elements.get(el2)?.remove();
      elements.delete(el2);
    },
    update: (el2) => {
      let oldel = elements.get(el2);
      if (!oldel) return;
      oldel.replaceWith(render(el2));
      doms.delete(oldel);
    },
    location,
    width,
    height
  };
  ctxRef = ctx;
  return render(mker(ctx));
};
var mkDom = (tag) => (...content) => {
  let dm = { tag, style: {}, attrs: {}, textContent: "", id: "", children: [] };
  let strings = [];
  let addcontent = (c) => {
    if (c instanceof Array) c.forEach(addcontent);
    else if (typeof c == "string") strings.push(c);
    else if (c instanceof Object) {
      if ("tag" in c) return dm.children.push(c);
      if ("id" in c) dm.id = c.id;
      if ("value" in c) dm.value = c.value;
      if ("attrs" in c) Object.entries(c.attrs).forEach(([k, v]) => dm.attrs[k] = v);
      if ("style" in c) Object.entries(c.style).forEach((s) => dm.style[s[0].replace(/([A-Z])/g, "-$1")] = s[1]);
      if ("onclick" in c) dm.onclick = c.onclick;
      if ("onmousedown" in c) dm.onmousedown = c.onmousedown;
      if ("onmouseup" in c) dm.onmouseup = c.onmouseup;
      if ("onmousemove" in c) dm.onmousemove = c.onmousemove;
      if ("onwheel" in c) dm.onwheel = c.onwheel;
      if ("onkeydown" in c) dm.onkeydown = c.onkeydown;
      if ("onkeyup" in c) dm.onkeyup = c.onkeyup;
    }
  };
  addcontent(content);
  dm.textContent += strings.join(" ");
  return dm;
};
var div = mkDom("div");
var svg = mkDom("svg");
var path = mkDom("path");
var g = mkDom("g");
var rect = mkDom("rect");
var text = (attrs, ...content) => ({ tag: "text", style: {}, attrs, textContent: content.join(" "), id: "", children: [] });
var popup = (...cs) => {
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
var HTML = {
  div,
  svg,
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
    const { viewBox = "0 0 100 100", width = "100", height = "100", fill = "none", stroke = "var(--color)", strokeWidth = "1" } = options;
    const pathAttrs = { fill, stroke, "stroke-width": strokeWidth };
    return svg(
      { attrs: { viewBox, width, height, xmlns: svgNamespace } },
      ...paths.map((d) => path({ attrs: { ...pathAttrs, d } })),
      ...children
    );
  },
  svgText: (content, options = {}) => {
    const fs = Number(options.fontSize ?? 12);
    const x = options.x ?? "50";
    const y = options.y ?? "50";
    const attrs = {
      fill: options.fill ?? "var(--color)",
      "font-size": String(fs),
      x,
      y,
      "text-anchor": options.textAnchor ?? "middle",
      "dominant-baseline": options.dominantBaseline ?? "middle"
    };
    if (options.fontFamily) attrs["font-family"] = options.fontFamily;
    if (options.fontWeight) attrs["font-weight"] = options.fontWeight;
    if (options.dx) attrs.dx = options.dx;
    if (options.dy) attrs.dy = options.dy;
    const textNode = text(attrs, content);
    if (!options.background) return textNode;
    const pad = fs * 0.4;
    const rw = content.length * fs * 0.6 + pad * 2;
    const rh = fs + pad * 2;
    const rx = Number(x) - rw / 2;
    const ry = Number(y) - rh / 2;
    return g(
      rect({ attrs: { x: String(rx), y: String(ry), width: String(rw), height: String(rh), fill: options.background, rx: String(pad) } }),
      textNode
    );
  },
  popup
};

// ../core/src/notes.ts
var FNV_OFFSET_1 = 0xcbf29ce484222325n;
var FNV_OFFSET_2 = 0x84222325cbf29ce4n;
var FNV_PRIME = 0x100000001b3n;
var MASK_64 = (1n << 64n) - 1n;
var hash64 = (value, offset2) => {
  let hash = offset2;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= BigInt(value.charCodeAt(i));
    hash = hash * FNV_PRIME & MASK_64;
  }
  return hash;
};
var toHex64 = (value) => value.toString(16).padStart(16, "0");
var hash128 = (...data2) => {
  const input = JSON.stringify(data2);
  const high = hash64(input, FNV_OFFSET_1);
  const low = hash64(input, FNV_OFFSET_2);
  return `#${toHex64(high)}${toHex64(low)}`;
};
var tojson = (x) => JSON.stringify(x, null, 2);
var fromjson = (x) => JSON.parse(x);
var isRef = (value) => typeof value === "string" && /^#([a-f0-9]{32})$/i.test(value);
var hashData = (value) => {
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

// ../lib/src/db.ts
var DB_NAME = "hashnotes";
var env = () => globalThis?.process?.env;
var KV = (() => {
  try {
    if (typeof localStorage !== "undefined" && localStorage) return localStorage;
  } catch {
  }
  const m = /* @__PURE__ */ new Map();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => {
      m.set(k, v);
    },
    removeItem: (k) => {
      m.delete(k);
    }
  };
})();
var SERVER = (() => {
  const e = env();
  const v = e?.HASHNOTES_SERVER;
  return v === "local" || v === "maincloud" ? v : KV.getItem("db_preset") === "local" ? "local" : "maincloud";
})();
var baseUrl = () => ({
  local: "http://localhost:3000",
  maincloud: "https://maincloud.spacetimedb.com"
})[SERVER];
var accessToken = async () => {
  let tokenkey = () => `access_token:${SERVER}`;
  let tkey = tokenkey();
  const e = env();
  const envToken = (SERVER === "local" ? e?.HASHNOTES_ACCESS_TOKEN_LOCAL : e?.HASHNOTES_ACCESS_TOKEN_MAINCLOUD) ?? e?.HASHNOTES_ACCESS_TOKEN;
  if (envToken) return envToken;
  let token = KV.getItem(tkey);
  if (!token) {
    token = await fetch(`${baseUrl()}/v1/identity`, { method: "POST", headers: { "Content-Type": "application/json" } }).then((r) => r.json()).then((j) => j.token || null);
    if (tkey != tokenkey()) return accessToken();
    if (token) KV.setItem(tkey, token);
  }
  return token;
};
var getServer = () => SERVER;
console.log("connect to", SERVER);
var call = async (name, payload) => {
  const res = await fetch(`${baseUrl()}/v1/database/${DB_NAME}/call/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: await accessToken().then((t) => t ? `Bearer ${t}` : "") },
    body: JSON.stringify(payload)
  });
  const text2 = await res.text();
  if (!res.ok) throw new Error(text2);
  return text2;
};
var noteCache = /* @__PURE__ */ new Map();
var addInFlight = /* @__PURE__ */ new Map();
var getInFlight = /* @__PURE__ */ new Map();
var addNote = async (data2, options = {}) => {
  const { skipCache = false } = options;
  const hash = hashData(data2);
  if (!skipCache) {
    const cached = noteCache.get(hash);
    if (cached !== void 0) return hash;
    const pending = addInFlight.get(hash);
    if (pending) return pending;
  }
  const p = (async () => {
    await call("add_note", { data: tojson(data2) });
    if (!skipCache) noteCache.set(hash, data2);
    return hash;
  })();
  if (!skipCache) addInFlight.set(hash, p);
  try {
    return await p;
  } finally {
    if (!skipCache) addInFlight.delete(hash);
  }
};
var getNote = async (hash, options = {}) => {
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
    const data2 = fromjson(fromjson(wireValue));
    if (!skipCache) noteCache.set(hash, data2);
    return data2;
  })();
  if (!skipCache) getInFlight.set(hash, p);
  try {
    return await p;
  } finally {
    if (!skipCache) getInFlight.delete(hash);
  }
};
var deRef = async (value) => isRef(value) ? getNote(value).then(deRef) : value;
var asRef = async (value) => isRef(value) ? value : addNote(value);
var callNote = async (fn, args) => {
  const fnRef = await asRef(fn);
  const argsRef = await asRef(args === void 0 ? [] : args);
  return await call("call_note", { fn: fnRef, arg: argsRef }).then(fromjson).then(deRef);
};

// ../node_modules/acorn/dist/acorn.mjs
var astralIdentifierCodes = [509, 0, 227, 0, 150, 4, 294, 9, 1368, 2, 2, 1, 6, 3, 41, 2, 5, 0, 166, 1, 574, 3, 9, 9, 7, 9, 32, 4, 318, 1, 80, 3, 71, 10, 50, 3, 123, 2, 54, 14, 32, 10, 3, 1, 11, 3, 46, 10, 8, 0, 46, 9, 7, 2, 37, 13, 2, 9, 6, 1, 45, 0, 13, 2, 49, 13, 9, 3, 2, 11, 83, 11, 7, 0, 3, 0, 158, 11, 6, 9, 7, 3, 56, 1, 2, 6, 3, 1, 3, 2, 10, 0, 11, 1, 3, 6, 4, 4, 68, 8, 2, 0, 3, 0, 2, 3, 2, 4, 2, 0, 15, 1, 83, 17, 10, 9, 5, 0, 82, 19, 13, 9, 214, 6, 3, 8, 28, 1, 83, 16, 16, 9, 82, 12, 9, 9, 7, 19, 58, 14, 5, 9, 243, 14, 166, 9, 71, 5, 2, 1, 3, 3, 2, 0, 2, 1, 13, 9, 120, 6, 3, 6, 4, 0, 29, 9, 41, 6, 2, 3, 9, 0, 10, 10, 47, 15, 343, 9, 54, 7, 2, 7, 17, 9, 57, 21, 2, 13, 123, 5, 4, 0, 2, 1, 2, 6, 2, 0, 9, 9, 49, 4, 2, 1, 2, 4, 9, 9, 330, 3, 10, 1, 2, 0, 49, 6, 4, 4, 14, 10, 5350, 0, 7, 14, 11465, 27, 2343, 9, 87, 9, 39, 4, 60, 6, 26, 9, 535, 9, 470, 0, 2, 54, 8, 3, 82, 0, 12, 1, 19628, 1, 4178, 9, 519, 45, 3, 22, 543, 4, 4, 5, 9, 7, 3, 6, 31, 3, 149, 2, 1418, 49, 513, 54, 5, 49, 9, 0, 15, 0, 23, 4, 2, 14, 1361, 6, 2, 16, 3, 6, 2, 1, 2, 4, 101, 0, 161, 6, 10, 9, 357, 0, 62, 13, 499, 13, 245, 1, 2, 9, 726, 6, 110, 6, 6, 9, 4759, 9, 787719, 239];
var astralIdentifierStartCodes = [0, 11, 2, 25, 2, 18, 2, 1, 2, 14, 3, 13, 35, 122, 70, 52, 268, 28, 4, 48, 48, 31, 14, 29, 6, 37, 11, 29, 3, 35, 5, 7, 2, 4, 43, 157, 19, 35, 5, 35, 5, 39, 9, 51, 13, 10, 2, 14, 2, 6, 2, 1, 2, 10, 2, 14, 2, 6, 2, 1, 4, 51, 13, 310, 10, 21, 11, 7, 25, 5, 2, 41, 2, 8, 70, 5, 3, 0, 2, 43, 2, 1, 4, 0, 3, 22, 11, 22, 10, 30, 66, 18, 2, 1, 11, 21, 11, 25, 71, 55, 7, 1, 65, 0, 16, 3, 2, 2, 2, 28, 43, 28, 4, 28, 36, 7, 2, 27, 28, 53, 11, 21, 11, 18, 14, 17, 111, 72, 56, 50, 14, 50, 14, 35, 39, 27, 10, 22, 251, 41, 7, 1, 17, 2, 60, 28, 11, 0, 9, 21, 43, 17, 47, 20, 28, 22, 13, 52, 58, 1, 3, 0, 14, 44, 33, 24, 27, 35, 30, 0, 3, 0, 9, 34, 4, 0, 13, 47, 15, 3, 22, 0, 2, 0, 36, 17, 2, 24, 20, 1, 64, 6, 2, 0, 2, 3, 2, 14, 2, 9, 8, 46, 39, 7, 3, 1, 3, 21, 2, 6, 2, 1, 2, 4, 4, 0, 19, 0, 13, 4, 31, 9, 2, 0, 3, 0, 2, 37, 2, 0, 26, 0, 2, 0, 45, 52, 19, 3, 21, 2, 31, 47, 21, 1, 2, 0, 185, 46, 42, 3, 37, 47, 21, 0, 60, 42, 14, 0, 72, 26, 38, 6, 186, 43, 117, 63, 32, 7, 3, 0, 3, 7, 2, 1, 2, 23, 16, 0, 2, 0, 95, 7, 3, 38, 17, 0, 2, 0, 29, 0, 11, 39, 8, 0, 22, 0, 12, 45, 20, 0, 19, 72, 200, 32, 32, 8, 2, 36, 18, 0, 50, 29, 113, 6, 2, 1, 2, 37, 22, 0, 26, 5, 2, 1, 2, 31, 15, 0, 328, 18, 16, 0, 2, 12, 2, 33, 125, 0, 80, 921, 103, 110, 18, 195, 2637, 96, 16, 1071, 18, 5, 26, 3994, 6, 582, 6842, 29, 1763, 568, 8, 30, 18, 78, 18, 29, 19, 47, 17, 3, 32, 20, 6, 18, 433, 44, 212, 63, 129, 74, 6, 0, 67, 12, 65, 1, 2, 0, 29, 6135, 9, 1237, 42, 9, 8936, 3, 2, 6, 2, 1, 2, 290, 16, 0, 30, 2, 3, 0, 15, 3, 9, 395, 2309, 106, 6, 12, 4, 8, 8, 9, 5991, 84, 2, 70, 2, 1, 3, 0, 3, 1, 3, 3, 2, 11, 2, 0, 2, 6, 2, 64, 2, 3, 3, 7, 2, 6, 2, 27, 2, 3, 2, 4, 2, 0, 4, 6, 2, 339, 3, 24, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 7, 1845, 30, 7, 5, 262, 61, 147, 44, 11, 6, 17, 0, 322, 29, 19, 43, 485, 27, 229, 29, 3, 0, 496, 6, 2, 3, 2, 1, 2, 14, 2, 196, 60, 67, 8, 0, 1205, 3, 2, 26, 2, 1, 2, 0, 3, 0, 2, 9, 2, 3, 2, 0, 2, 0, 7, 0, 5, 0, 2, 0, 2, 0, 2, 2, 2, 1, 2, 0, 3, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 1, 2, 0, 3, 3, 2, 6, 2, 3, 2, 3, 2, 0, 2, 9, 2, 16, 6, 2, 2, 4, 2, 16, 4421, 42719, 33, 4153, 7, 221, 3, 5761, 15, 7472, 16, 621, 2467, 541, 1507, 4938, 6, 4191];
var nonASCIIidentifierChars = "\u200C\u200D\xB7\u0300-\u036F\u0387\u0483-\u0487\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u0669\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u06F0-\u06F9\u0711\u0730-\u074A\u07A6-\u07B0\u07C0-\u07C9\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u0897-\u089F\u08CA-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0966-\u096F\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09E6-\u09EF\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A66-\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AE6-\u0AEF\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B55-\u0B57\u0B62\u0B63\u0B66-\u0B6F\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0BE6-\u0BEF\u0C00-\u0C04\u0C3C\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0CE6-\u0CEF\u0CF3\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D66-\u0D6F\u0D81-\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0E50-\u0E59\u0EB1\u0EB4-\u0EBC\u0EC8-\u0ECE\u0ED0-\u0ED9\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1040-\u1049\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F-\u109D\u135D-\u135F\u1369-\u1371\u1712-\u1715\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u17E0-\u17E9\u180B-\u180D\u180F-\u1819\u18A9\u1920-\u192B\u1930-\u193B\u1946-\u194F\u19D0-\u19DA\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AB0-\u1ABD\u1ABF-\u1ACE\u1B00-\u1B04\u1B34-\u1B44\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BB0-\u1BB9\u1BE6-\u1BF3\u1C24-\u1C37\u1C40-\u1C49\u1C50-\u1C59\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DFF\u200C\u200D\u203F\u2040\u2054\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\u30FB\uA620-\uA629\uA66F\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA82C\uA880\uA881\uA8B4-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F1\uA8FF-\uA909\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9D0-\uA9D9\uA9E5\uA9F0-\uA9F9\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA50-\uAA59\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uABF0-\uABF9\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFF10-\uFF19\uFF3F\uFF65";
var nonASCIIidentifierStartChars = "\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05D0-\u05EA\u05EF-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u0870-\u0887\u0889-\u088E\u08A0-\u08C9\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C5D\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D04-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u1711\u171F-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1878\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4C\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C8A\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1CFA\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7CD\uA7D0\uA7D1\uA7D3\uA7D5-\uA7DC\uA7F2-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB69\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC";
var reservedWords = {
  3: "abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile",
  5: "class enum extends super const export import",
  6: "enum",
  strict: "implements interface let package private protected public static yield",
  strictBind: "eval arguments"
};
var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this";
var keywords$1 = {
  5: ecma5AndLessKeywords,
  "5module": ecma5AndLessKeywords + " export import",
  6: ecma5AndLessKeywords + " const class extends export import super"
};
var keywordRelationalOperator = /^in(stanceof)?$/;
var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");
function isInAstralSet(code, set) {
  var pos = 65536;
  for (var i = 0; i < set.length; i += 2) {
    pos += set[i];
    if (pos > code) {
      return false;
    }
    pos += set[i + 1];
    if (pos >= code) {
      return true;
    }
  }
  return false;
}
function isIdentifierStart(code, astral) {
  if (code < 65) {
    return code === 36;
  }
  if (code < 91) {
    return true;
  }
  if (code < 97) {
    return code === 95;
  }
  if (code < 123) {
    return true;
  }
  if (code <= 65535) {
    return code >= 170 && nonASCIIidentifierStart.test(String.fromCharCode(code));
  }
  if (astral === false) {
    return false;
  }
  return isInAstralSet(code, astralIdentifierStartCodes);
}
function isIdentifierChar(code, astral) {
  if (code < 48) {
    return code === 36;
  }
  if (code < 58) {
    return true;
  }
  if (code < 65) {
    return false;
  }
  if (code < 91) {
    return true;
  }
  if (code < 97) {
    return code === 95;
  }
  if (code < 123) {
    return true;
  }
  if (code <= 65535) {
    return code >= 170 && nonASCIIidentifier.test(String.fromCharCode(code));
  }
  if (astral === false) {
    return false;
  }
  return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes);
}
var TokenType = function TokenType2(label, conf) {
  if (conf === void 0) conf = {};
  this.label = label;
  this.keyword = conf.keyword;
  this.beforeExpr = !!conf.beforeExpr;
  this.startsExpr = !!conf.startsExpr;
  this.isLoop = !!conf.isLoop;
  this.isAssign = !!conf.isAssign;
  this.prefix = !!conf.prefix;
  this.postfix = !!conf.postfix;
  this.binop = conf.binop || null;
  this.updateContext = null;
};
function binop(name, prec) {
  return new TokenType(name, { beforeExpr: true, binop: prec });
}
var beforeExpr = { beforeExpr: true };
var startsExpr = { startsExpr: true };
var keywords = {};
function kw(name, options) {
  if (options === void 0) options = {};
  options.keyword = name;
  return keywords[name] = new TokenType(name, options);
}
var types$1 = {
  num: new TokenType("num", startsExpr),
  regexp: new TokenType("regexp", startsExpr),
  string: new TokenType("string", startsExpr),
  name: new TokenType("name", startsExpr),
  privateId: new TokenType("privateId", startsExpr),
  eof: new TokenType("eof"),
  // Punctuation token types.
  bracketL: new TokenType("[", { beforeExpr: true, startsExpr: true }),
  bracketR: new TokenType("]"),
  braceL: new TokenType("{", { beforeExpr: true, startsExpr: true }),
  braceR: new TokenType("}"),
  parenL: new TokenType("(", { beforeExpr: true, startsExpr: true }),
  parenR: new TokenType(")"),
  comma: new TokenType(",", beforeExpr),
  semi: new TokenType(";", beforeExpr),
  colon: new TokenType(":", beforeExpr),
  dot: new TokenType("."),
  question: new TokenType("?", beforeExpr),
  questionDot: new TokenType("?."),
  arrow: new TokenType("=>", beforeExpr),
  template: new TokenType("template"),
  invalidTemplate: new TokenType("invalidTemplate"),
  ellipsis: new TokenType("...", beforeExpr),
  backQuote: new TokenType("`", startsExpr),
  dollarBraceL: new TokenType("${", { beforeExpr: true, startsExpr: true }),
  // Operators. These carry several kinds of properties to help the
  // parser use them properly (the presence of these properties is
  // what categorizes them as operators).
  //
  // `binop`, when present, specifies that this operator is a binary
  // operator, and will refer to its precedence.
  //
  // `prefix` and `postfix` mark the operator as a prefix or postfix
  // unary operator.
  //
  // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
  // binary operators with a very low precedence, that should result
  // in AssignmentExpression nodes.
  eq: new TokenType("=", { beforeExpr: true, isAssign: true }),
  assign: new TokenType("_=", { beforeExpr: true, isAssign: true }),
  incDec: new TokenType("++/--", { prefix: true, postfix: true, startsExpr: true }),
  prefix: new TokenType("!/~", { beforeExpr: true, prefix: true, startsExpr: true }),
  logicalOR: binop("||", 1),
  logicalAND: binop("&&", 2),
  bitwiseOR: binop("|", 3),
  bitwiseXOR: binop("^", 4),
  bitwiseAND: binop("&", 5),
  equality: binop("==/!=/===/!==", 6),
  relational: binop("</>/<=/>=", 7),
  bitShift: binop("<</>>/>>>", 8),
  plusMin: new TokenType("+/-", { beforeExpr: true, binop: 9, prefix: true, startsExpr: true }),
  modulo: binop("%", 10),
  star: binop("*", 10),
  slash: binop("/", 10),
  starstar: new TokenType("**", { beforeExpr: true }),
  coalesce: binop("??", 1),
  // Keyword token types.
  _break: kw("break"),
  _case: kw("case", beforeExpr),
  _catch: kw("catch"),
  _continue: kw("continue"),
  _debugger: kw("debugger"),
  _default: kw("default", beforeExpr),
  _do: kw("do", { isLoop: true, beforeExpr: true }),
  _else: kw("else", beforeExpr),
  _finally: kw("finally"),
  _for: kw("for", { isLoop: true }),
  _function: kw("function", startsExpr),
  _if: kw("if"),
  _return: kw("return", beforeExpr),
  _switch: kw("switch"),
  _throw: kw("throw", beforeExpr),
  _try: kw("try"),
  _var: kw("var"),
  _const: kw("const"),
  _while: kw("while", { isLoop: true }),
  _with: kw("with"),
  _new: kw("new", { beforeExpr: true, startsExpr: true }),
  _this: kw("this", startsExpr),
  _super: kw("super", startsExpr),
  _class: kw("class", startsExpr),
  _extends: kw("extends", beforeExpr),
  _export: kw("export"),
  _import: kw("import", startsExpr),
  _null: kw("null", startsExpr),
  _true: kw("true", startsExpr),
  _false: kw("false", startsExpr),
  _in: kw("in", { beforeExpr: true, binop: 7 }),
  _instanceof: kw("instanceof", { beforeExpr: true, binop: 7 }),
  _typeof: kw("typeof", { beforeExpr: true, prefix: true, startsExpr: true }),
  _void: kw("void", { beforeExpr: true, prefix: true, startsExpr: true }),
  _delete: kw("delete", { beforeExpr: true, prefix: true, startsExpr: true })
};
var lineBreak = /\r\n?|\n|\u2028|\u2029/;
var lineBreakG = new RegExp(lineBreak.source, "g");
function isNewLine(code) {
  return code === 10 || code === 13 || code === 8232 || code === 8233;
}
function nextLineBreak(code, from, end) {
  if (end === void 0) end = code.length;
  for (var i = from; i < end; i++) {
    var next = code.charCodeAt(i);
    if (isNewLine(next)) {
      return i < end - 1 && next === 13 && code.charCodeAt(i + 1) === 10 ? i + 2 : i + 1;
    }
  }
  return -1;
}
var nonASCIIwhitespace = /[\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]/;
var skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g;
var ref = Object.prototype;
var hasOwnProperty = ref.hasOwnProperty;
var toString = ref.toString;
var hasOwn = Object.hasOwn || (function(obj, propName) {
  return hasOwnProperty.call(obj, propName);
});
var isArray = Array.isArray || (function(obj) {
  return toString.call(obj) === "[object Array]";
});
var regexpCache = /* @__PURE__ */ Object.create(null);
function wordsRegexp(words) {
  return regexpCache[words] || (regexpCache[words] = new RegExp("^(?:" + words.replace(/ /g, "|") + ")$"));
}
function codePointToString(code) {
  if (code <= 65535) {
    return String.fromCharCode(code);
  }
  code -= 65536;
  return String.fromCharCode((code >> 10) + 55296, (code & 1023) + 56320);
}
var loneSurrogate = /(?:[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/;
var Position = function Position2(line, col) {
  this.line = line;
  this.column = col;
};
Position.prototype.offset = function offset(n) {
  return new Position(this.line, this.column + n);
};
var SourceLocation = function SourceLocation2(p, start, end) {
  this.start = start;
  this.end = end;
  if (p.sourceFile !== null) {
    this.source = p.sourceFile;
  }
};
function getLineInfo(input, offset2) {
  for (var line = 1, cur = 0; ; ) {
    var nextBreak = nextLineBreak(input, cur, offset2);
    if (nextBreak < 0) {
      return new Position(line, offset2 - cur);
    }
    ++line;
    cur = nextBreak;
  }
}
var defaultOptions = {
  // `ecmaVersion` indicates the ECMAScript version to parse. Must be
  // either 3, 5, 6 (or 2015), 7 (2016), 8 (2017), 9 (2018), 10
  // (2019), 11 (2020), 12 (2021), 13 (2022), 14 (2023), or `"latest"`
  // (the latest version the library supports). This influences
  // support for strict mode, the set of reserved words, and support
  // for new syntax features.
  ecmaVersion: null,
  // `sourceType` indicates the mode the code should be parsed in.
  // Can be either `"script"` or `"module"`. This influences global
  // strict mode and parsing of `import` and `export` declarations.
  sourceType: "script",
  // `onInsertedSemicolon` can be a callback that will be called when
  // a semicolon is automatically inserted. It will be passed the
  // position of the inserted semicolon as an offset, and if
  // `locations` is enabled, it is given the location as a `{line,
  // column}` object as second argument.
  onInsertedSemicolon: null,
  // `onTrailingComma` is similar to `onInsertedSemicolon`, but for
  // trailing commas.
  onTrailingComma: null,
  // By default, reserved words are only enforced if ecmaVersion >= 5.
  // Set `allowReserved` to a boolean value to explicitly turn this on
  // an off. When this option has the value "never", reserved words
  // and keywords can also not be used as property names.
  allowReserved: null,
  // When enabled, a return at the top level is not considered an
  // error.
  allowReturnOutsideFunction: false,
  // When enabled, import/export statements are not constrained to
  // appearing at the top of the program, and an import.meta expression
  // in a script isn't considered an error.
  allowImportExportEverywhere: false,
  // By default, await identifiers are allowed to appear at the top-level scope only if ecmaVersion >= 2022.
  // When enabled, await identifiers are allowed to appear at the top-level scope,
  // but they are still not allowed in non-async functions.
  allowAwaitOutsideFunction: null,
  // When enabled, super identifiers are not constrained to
  // appearing in methods and do not raise an error when they appear elsewhere.
  allowSuperOutsideMethod: null,
  // When enabled, hashbang directive in the beginning of file is
  // allowed and treated as a line comment. Enabled by default when
  // `ecmaVersion` >= 2023.
  allowHashBang: false,
  // By default, the parser will verify that private properties are
  // only used in places where they are valid and have been declared.
  // Set this to false to turn such checks off.
  checkPrivateFields: true,
  // When `locations` is on, `loc` properties holding objects with
  // `start` and `end` properties in `{line, column}` form (with
  // line being 1-based and column 0-based) will be attached to the
  // nodes.
  locations: false,
  // A function can be passed as `onToken` option, which will
  // cause Acorn to call that function with object in the same
  // format as tokens returned from `tokenizer().getToken()`. Note
  // that you are not allowed to call the parser from the
  // callback—that will corrupt its internal state.
  onToken: null,
  // A function can be passed as `onComment` option, which will
  // cause Acorn to call that function with `(block, text, start,
  // end)` parameters whenever a comment is skipped. `block` is a
  // boolean indicating whether this is a block (`/* */`) comment,
  // `text` is the content of the comment, and `start` and `end` are
  // character offsets that denote the start and end of the comment.
  // When the `locations` option is on, two more parameters are
  // passed, the full `{line, column}` locations of the start and
  // end of the comments. Note that you are not allowed to call the
  // parser from the callback—that will corrupt its internal state.
  // When this option has an array as value, objects representing the
  // comments are pushed to it.
  onComment: null,
  // Nodes have their start and end characters offsets recorded in
  // `start` and `end` properties (directly on the node, rather than
  // the `loc` object, which holds line/column data. To also add a
  // [semi-standardized][range] `range` property holding a `[start,
  // end]` array with the same numbers, set the `ranges` option to
  // `true`.
  //
  // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
  ranges: false,
  // It is possible to parse multiple files into a single AST by
  // passing the tree produced by parsing the first file as
  // `program` option in subsequent parses. This will add the
  // toplevel forms of the parsed file to the `Program` (top) node
  // of an existing parse tree.
  program: null,
  // When `locations` is on, you can pass this to record the source
  // file in every node's `loc` object.
  sourceFile: null,
  // This value, if given, is stored in every node, whether
  // `locations` is on or off.
  directSourceFile: null,
  // When enabled, parenthesized expressions are represented by
  // (non-standard) ParenthesizedExpression nodes
  preserveParens: false
};
var warnedAboutEcmaVersion = false;
function getOptions(opts) {
  var options = {};
  for (var opt in defaultOptions) {
    options[opt] = opts && hasOwn(opts, opt) ? opts[opt] : defaultOptions[opt];
  }
  if (options.ecmaVersion === "latest") {
    options.ecmaVersion = 1e8;
  } else if (options.ecmaVersion == null) {
    if (!warnedAboutEcmaVersion && typeof console === "object" && console.warn) {
      warnedAboutEcmaVersion = true;
      console.warn("Since Acorn 8.0.0, options.ecmaVersion is required.\nDefaulting to 2020, but this will stop working in the future.");
    }
    options.ecmaVersion = 11;
  } else if (options.ecmaVersion >= 2015) {
    options.ecmaVersion -= 2009;
  }
  if (options.allowReserved == null) {
    options.allowReserved = options.ecmaVersion < 5;
  }
  if (!opts || opts.allowHashBang == null) {
    options.allowHashBang = options.ecmaVersion >= 14;
  }
  if (isArray(options.onToken)) {
    var tokens = options.onToken;
    options.onToken = function(token) {
      return tokens.push(token);
    };
  }
  if (isArray(options.onComment)) {
    options.onComment = pushComment(options, options.onComment);
  }
  return options;
}
function pushComment(options, array) {
  return function(block, text2, start, end, startLoc, endLoc) {
    var comment = {
      type: block ? "Block" : "Line",
      value: text2,
      start,
      end
    };
    if (options.locations) {
      comment.loc = new SourceLocation(this, startLoc, endLoc);
    }
    if (options.ranges) {
      comment.range = [start, end];
    }
    array.push(comment);
  };
}
var SCOPE_TOP = 1;
var SCOPE_FUNCTION = 2;
var SCOPE_ASYNC = 4;
var SCOPE_GENERATOR = 8;
var SCOPE_ARROW = 16;
var SCOPE_SIMPLE_CATCH = 32;
var SCOPE_SUPER = 64;
var SCOPE_DIRECT_SUPER = 128;
var SCOPE_CLASS_STATIC_BLOCK = 256;
var SCOPE_CLASS_FIELD_INIT = 512;
var SCOPE_VAR = SCOPE_TOP | SCOPE_FUNCTION | SCOPE_CLASS_STATIC_BLOCK;
function functionFlags(async, generator) {
  return SCOPE_FUNCTION | (async ? SCOPE_ASYNC : 0) | (generator ? SCOPE_GENERATOR : 0);
}
var BIND_NONE = 0;
var BIND_VAR = 1;
var BIND_LEXICAL = 2;
var BIND_FUNCTION = 3;
var BIND_SIMPLE_CATCH = 4;
var BIND_OUTSIDE = 5;
var Parser = function Parser2(options, input, startPos) {
  this.options = options = getOptions(options);
  this.sourceFile = options.sourceFile;
  this.keywords = wordsRegexp(keywords$1[options.ecmaVersion >= 6 ? 6 : options.sourceType === "module" ? "5module" : 5]);
  var reserved = "";
  if (options.allowReserved !== true) {
    reserved = reservedWords[options.ecmaVersion >= 6 ? 6 : options.ecmaVersion === 5 ? 5 : 3];
    if (options.sourceType === "module") {
      reserved += " await";
    }
  }
  this.reservedWords = wordsRegexp(reserved);
  var reservedStrict = (reserved ? reserved + " " : "") + reservedWords.strict;
  this.reservedWordsStrict = wordsRegexp(reservedStrict);
  this.reservedWordsStrictBind = wordsRegexp(reservedStrict + " " + reservedWords.strictBind);
  this.input = String(input);
  this.containsEsc = false;
  if (startPos) {
    this.pos = startPos;
    this.lineStart = this.input.lastIndexOf("\n", startPos - 1) + 1;
    this.curLine = this.input.slice(0, this.lineStart).split(lineBreak).length;
  } else {
    this.pos = this.lineStart = 0;
    this.curLine = 1;
  }
  this.type = types$1.eof;
  this.value = null;
  this.start = this.end = this.pos;
  this.startLoc = this.endLoc = this.curPosition();
  this.lastTokEndLoc = this.lastTokStartLoc = null;
  this.lastTokStart = this.lastTokEnd = this.pos;
  this.context = this.initialContext();
  this.exprAllowed = true;
  this.inModule = options.sourceType === "module";
  this.strict = this.inModule || this.strictDirective(this.pos);
  this.potentialArrowAt = -1;
  this.potentialArrowInForAwait = false;
  this.yieldPos = this.awaitPos = this.awaitIdentPos = 0;
  this.labels = [];
  this.undefinedExports = /* @__PURE__ */ Object.create(null);
  if (this.pos === 0 && options.allowHashBang && this.input.slice(0, 2) === "#!") {
    this.skipLineComment(2);
  }
  this.scopeStack = [];
  this.enterScope(SCOPE_TOP);
  this.regexpState = null;
  this.privateNameStack = [];
};
var prototypeAccessors = { inFunction: { configurable: true }, inGenerator: { configurable: true }, inAsync: { configurable: true }, canAwait: { configurable: true }, allowSuper: { configurable: true }, allowDirectSuper: { configurable: true }, treatFunctionsAsVar: { configurable: true }, allowNewDotTarget: { configurable: true }, inClassStaticBlock: { configurable: true } };
Parser.prototype.parse = function parse() {
  var node = this.options.program || this.startNode();
  this.nextToken();
  return this.parseTopLevel(node);
};
prototypeAccessors.inFunction.get = function() {
  return (this.currentVarScope().flags & SCOPE_FUNCTION) > 0;
};
prototypeAccessors.inGenerator.get = function() {
  return (this.currentVarScope().flags & SCOPE_GENERATOR) > 0;
};
prototypeAccessors.inAsync.get = function() {
  return (this.currentVarScope().flags & SCOPE_ASYNC) > 0;
};
prototypeAccessors.canAwait.get = function() {
  for (var i = this.scopeStack.length - 1; i >= 0; i--) {
    var ref2 = this.scopeStack[i];
    var flags = ref2.flags;
    if (flags & (SCOPE_CLASS_STATIC_BLOCK | SCOPE_CLASS_FIELD_INIT)) {
      return false;
    }
    if (flags & SCOPE_FUNCTION) {
      return (flags & SCOPE_ASYNC) > 0;
    }
  }
  return this.inModule && this.options.ecmaVersion >= 13 || this.options.allowAwaitOutsideFunction;
};
prototypeAccessors.allowSuper.get = function() {
  var ref2 = this.currentThisScope();
  var flags = ref2.flags;
  return (flags & SCOPE_SUPER) > 0 || this.options.allowSuperOutsideMethod;
};
prototypeAccessors.allowDirectSuper.get = function() {
  return (this.currentThisScope().flags & SCOPE_DIRECT_SUPER) > 0;
};
prototypeAccessors.treatFunctionsAsVar.get = function() {
  return this.treatFunctionsAsVarInScope(this.currentScope());
};
prototypeAccessors.allowNewDotTarget.get = function() {
  for (var i = this.scopeStack.length - 1; i >= 0; i--) {
    var ref2 = this.scopeStack[i];
    var flags = ref2.flags;
    if (flags & (SCOPE_CLASS_STATIC_BLOCK | SCOPE_CLASS_FIELD_INIT) || flags & SCOPE_FUNCTION && !(flags & SCOPE_ARROW)) {
      return true;
    }
  }
  return false;
};
prototypeAccessors.inClassStaticBlock.get = function() {
  return (this.currentVarScope().flags & SCOPE_CLASS_STATIC_BLOCK) > 0;
};
Parser.extend = function extend() {
  var plugins = [], len = arguments.length;
  while (len--) plugins[len] = arguments[len];
  var cls = this;
  for (var i = 0; i < plugins.length; i++) {
    cls = plugins[i](cls);
  }
  return cls;
};
Parser.parse = function parse2(input, options) {
  return new this(options, input).parse();
};
Parser.parseExpressionAt = function parseExpressionAt(input, pos, options) {
  var parser = new this(options, input, pos);
  parser.nextToken();
  return parser.parseExpression();
};
Parser.tokenizer = function tokenizer(input, options) {
  return new this(options, input);
};
Object.defineProperties(Parser.prototype, prototypeAccessors);
var pp$9 = Parser.prototype;
var literal = /^(?:'((?:\\[^]|[^'\\])*?)'|"((?:\\[^]|[^"\\])*?)")/;
pp$9.strictDirective = function(start) {
  if (this.options.ecmaVersion < 5) {
    return false;
  }
  for (; ; ) {
    skipWhiteSpace.lastIndex = start;
    start += skipWhiteSpace.exec(this.input)[0].length;
    var match = literal.exec(this.input.slice(start));
    if (!match) {
      return false;
    }
    if ((match[1] || match[2]) === "use strict") {
      skipWhiteSpace.lastIndex = start + match[0].length;
      var spaceAfter = skipWhiteSpace.exec(this.input), end = spaceAfter.index + spaceAfter[0].length;
      var next = this.input.charAt(end);
      return next === ";" || next === "}" || lineBreak.test(spaceAfter[0]) && !(/[(`.[+\-/*%<>=,?^&]/.test(next) || next === "!" && this.input.charAt(end + 1) === "=");
    }
    start += match[0].length;
    skipWhiteSpace.lastIndex = start;
    start += skipWhiteSpace.exec(this.input)[0].length;
    if (this.input[start] === ";") {
      start++;
    }
  }
};
pp$9.eat = function(type) {
  if (this.type === type) {
    this.next();
    return true;
  } else {
    return false;
  }
};
pp$9.isContextual = function(name) {
  return this.type === types$1.name && this.value === name && !this.containsEsc;
};
pp$9.eatContextual = function(name) {
  if (!this.isContextual(name)) {
    return false;
  }
  this.next();
  return true;
};
pp$9.expectContextual = function(name) {
  if (!this.eatContextual(name)) {
    this.unexpected();
  }
};
pp$9.canInsertSemicolon = function() {
  return this.type === types$1.eof || this.type === types$1.braceR || lineBreak.test(this.input.slice(this.lastTokEnd, this.start));
};
pp$9.insertSemicolon = function() {
  if (this.canInsertSemicolon()) {
    if (this.options.onInsertedSemicolon) {
      this.options.onInsertedSemicolon(this.lastTokEnd, this.lastTokEndLoc);
    }
    return true;
  }
};
pp$9.semicolon = function() {
  if (!this.eat(types$1.semi) && !this.insertSemicolon()) {
    this.unexpected();
  }
};
pp$9.afterTrailingComma = function(tokType, notNext) {
  if (this.type === tokType) {
    if (this.options.onTrailingComma) {
      this.options.onTrailingComma(this.lastTokStart, this.lastTokStartLoc);
    }
    if (!notNext) {
      this.next();
    }
    return true;
  }
};
pp$9.expect = function(type) {
  this.eat(type) || this.unexpected();
};
pp$9.unexpected = function(pos) {
  this.raise(pos != null ? pos : this.start, "Unexpected token");
};
var DestructuringErrors = function DestructuringErrors2() {
  this.shorthandAssign = this.trailingComma = this.parenthesizedAssign = this.parenthesizedBind = this.doubleProto = -1;
};
pp$9.checkPatternErrors = function(refDestructuringErrors, isAssign) {
  if (!refDestructuringErrors) {
    return;
  }
  if (refDestructuringErrors.trailingComma > -1) {
    this.raiseRecoverable(refDestructuringErrors.trailingComma, "Comma is not permitted after the rest element");
  }
  var parens = isAssign ? refDestructuringErrors.parenthesizedAssign : refDestructuringErrors.parenthesizedBind;
  if (parens > -1) {
    this.raiseRecoverable(parens, isAssign ? "Assigning to rvalue" : "Parenthesized pattern");
  }
};
pp$9.checkExpressionErrors = function(refDestructuringErrors, andThrow) {
  if (!refDestructuringErrors) {
    return false;
  }
  var shorthandAssign = refDestructuringErrors.shorthandAssign;
  var doubleProto = refDestructuringErrors.doubleProto;
  if (!andThrow) {
    return shorthandAssign >= 0 || doubleProto >= 0;
  }
  if (shorthandAssign >= 0) {
    this.raise(shorthandAssign, "Shorthand property assignments are valid only in destructuring patterns");
  }
  if (doubleProto >= 0) {
    this.raiseRecoverable(doubleProto, "Redefinition of __proto__ property");
  }
};
pp$9.checkYieldAwaitInDefaultParams = function() {
  if (this.yieldPos && (!this.awaitPos || this.yieldPos < this.awaitPos)) {
    this.raise(this.yieldPos, "Yield expression cannot be a default value");
  }
  if (this.awaitPos) {
    this.raise(this.awaitPos, "Await expression cannot be a default value");
  }
};
pp$9.isSimpleAssignTarget = function(expr) {
  if (expr.type === "ParenthesizedExpression") {
    return this.isSimpleAssignTarget(expr.expression);
  }
  return expr.type === "Identifier" || expr.type === "MemberExpression";
};
var pp$8 = Parser.prototype;
pp$8.parseTopLevel = function(node) {
  var exports = /* @__PURE__ */ Object.create(null);
  if (!node.body) {
    node.body = [];
  }
  while (this.type !== types$1.eof) {
    var stmt = this.parseStatement(null, true, exports);
    node.body.push(stmt);
  }
  if (this.inModule) {
    for (var i = 0, list = Object.keys(this.undefinedExports); i < list.length; i += 1) {
      var name = list[i];
      this.raiseRecoverable(this.undefinedExports[name].start, "Export '" + name + "' is not defined");
    }
  }
  this.adaptDirectivePrologue(node.body);
  this.next();
  node.sourceType = this.options.sourceType;
  return this.finishNode(node, "Program");
};
var loopLabel = { kind: "loop" };
var switchLabel = { kind: "switch" };
pp$8.isLet = function(context) {
  if (this.options.ecmaVersion < 6 || !this.isContextual("let")) {
    return false;
  }
  skipWhiteSpace.lastIndex = this.pos;
  var skip = skipWhiteSpace.exec(this.input);
  var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next);
  if (nextCh === 91 || nextCh === 92) {
    return true;
  }
  if (context) {
    return false;
  }
  if (nextCh === 123 || nextCh > 55295 && nextCh < 56320) {
    return true;
  }
  if (isIdentifierStart(nextCh, true)) {
    var pos = next + 1;
    while (isIdentifierChar(nextCh = this.input.charCodeAt(pos), true)) {
      ++pos;
    }
    if (nextCh === 92 || nextCh > 55295 && nextCh < 56320) {
      return true;
    }
    var ident = this.input.slice(next, pos);
    if (!keywordRelationalOperator.test(ident)) {
      return true;
    }
  }
  return false;
};
pp$8.isAsyncFunction = function() {
  if (this.options.ecmaVersion < 8 || !this.isContextual("async")) {
    return false;
  }
  skipWhiteSpace.lastIndex = this.pos;
  var skip = skipWhiteSpace.exec(this.input);
  var next = this.pos + skip[0].length, after;
  return !lineBreak.test(this.input.slice(this.pos, next)) && this.input.slice(next, next + 8) === "function" && (next + 8 === this.input.length || !(isIdentifierChar(after = this.input.charCodeAt(next + 8)) || after > 55295 && after < 56320));
};
pp$8.isUsingKeyword = function(isAwaitUsing, isFor) {
  if (this.options.ecmaVersion < 17 || !this.isContextual(isAwaitUsing ? "await" : "using")) {
    return false;
  }
  skipWhiteSpace.lastIndex = this.pos;
  var skip = skipWhiteSpace.exec(this.input);
  var next = this.pos + skip[0].length;
  if (lineBreak.test(this.input.slice(this.pos, next))) {
    return false;
  }
  if (isAwaitUsing) {
    var awaitEndPos = next + 5, after;
    if (this.input.slice(next, awaitEndPos) !== "using" || awaitEndPos === this.input.length || isIdentifierChar(after = this.input.charCodeAt(awaitEndPos)) || after > 55295 && after < 56320) {
      return false;
    }
    skipWhiteSpace.lastIndex = awaitEndPos;
    var skipAfterUsing = skipWhiteSpace.exec(this.input);
    if (skipAfterUsing && lineBreak.test(this.input.slice(awaitEndPos, awaitEndPos + skipAfterUsing[0].length))) {
      return false;
    }
  }
  if (isFor) {
    var ofEndPos = next + 2, after$1;
    if (this.input.slice(next, ofEndPos) === "of") {
      if (ofEndPos === this.input.length || !isIdentifierChar(after$1 = this.input.charCodeAt(ofEndPos)) && !(after$1 > 55295 && after$1 < 56320)) {
        return false;
      }
    }
  }
  var ch = this.input.charCodeAt(next);
  return isIdentifierStart(ch, true) || ch === 92;
};
pp$8.isAwaitUsing = function(isFor) {
  return this.isUsingKeyword(true, isFor);
};
pp$8.isUsing = function(isFor) {
  return this.isUsingKeyword(false, isFor);
};
pp$8.parseStatement = function(context, topLevel, exports) {
  var starttype = this.type, node = this.startNode(), kind;
  if (this.isLet(context)) {
    starttype = types$1._var;
    kind = "let";
  }
  switch (starttype) {
    case types$1._break:
    case types$1._continue:
      return this.parseBreakContinueStatement(node, starttype.keyword);
    case types$1._debugger:
      return this.parseDebuggerStatement(node);
    case types$1._do:
      return this.parseDoStatement(node);
    case types$1._for:
      return this.parseForStatement(node);
    case types$1._function:
      if (context && (this.strict || context !== "if" && context !== "label") && this.options.ecmaVersion >= 6) {
        this.unexpected();
      }
      return this.parseFunctionStatement(node, false, !context);
    case types$1._class:
      if (context) {
        this.unexpected();
      }
      return this.parseClass(node, true);
    case types$1._if:
      return this.parseIfStatement(node);
    case types$1._return:
      return this.parseReturnStatement(node);
    case types$1._switch:
      return this.parseSwitchStatement(node);
    case types$1._throw:
      return this.parseThrowStatement(node);
    case types$1._try:
      return this.parseTryStatement(node);
    case types$1._const:
    case types$1._var:
      kind = kind || this.value;
      if (context && kind !== "var") {
        this.unexpected();
      }
      return this.parseVarStatement(node, kind);
    case types$1._while:
      return this.parseWhileStatement(node);
    case types$1._with:
      return this.parseWithStatement(node);
    case types$1.braceL:
      return this.parseBlock(true, node);
    case types$1.semi:
      return this.parseEmptyStatement(node);
    case types$1._export:
    case types$1._import:
      if (this.options.ecmaVersion > 10 && starttype === types$1._import) {
        skipWhiteSpace.lastIndex = this.pos;
        var skip = skipWhiteSpace.exec(this.input);
        var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next);
        if (nextCh === 40 || nextCh === 46) {
          return this.parseExpressionStatement(node, this.parseExpression());
        }
      }
      if (!this.options.allowImportExportEverywhere) {
        if (!topLevel) {
          this.raise(this.start, "'import' and 'export' may only appear at the top level");
        }
        if (!this.inModule) {
          this.raise(this.start, "'import' and 'export' may appear only with 'sourceType: module'");
        }
      }
      return starttype === types$1._import ? this.parseImport(node) : this.parseExport(node, exports);
    // If the statement does not start with a statement keyword or a
    // brace, it's an ExpressionStatement or LabeledStatement. We
    // simply start parsing an expression, and afterwards, if the
    // next token is a colon and the expression was a simple
    // Identifier node, we switch to interpreting it as a label.
    default:
      if (this.isAsyncFunction()) {
        if (context) {
          this.unexpected();
        }
        this.next();
        return this.parseFunctionStatement(node, true, !context);
      }
      var usingKind = this.isAwaitUsing(false) ? "await using" : this.isUsing(false) ? "using" : null;
      if (usingKind) {
        if (topLevel && this.options.sourceType === "script") {
          this.raise(this.start, "Using declaration cannot appear in the top level when source type is `script`");
        }
        if (usingKind === "await using") {
          if (!this.canAwait) {
            this.raise(this.start, "Await using cannot appear outside of async function");
          }
          this.next();
        }
        this.next();
        this.parseVar(node, false, usingKind);
        this.semicolon();
        return this.finishNode(node, "VariableDeclaration");
      }
      var maybeName = this.value, expr = this.parseExpression();
      if (starttype === types$1.name && expr.type === "Identifier" && this.eat(types$1.colon)) {
        return this.parseLabeledStatement(node, maybeName, expr, context);
      } else {
        return this.parseExpressionStatement(node, expr);
      }
  }
};
pp$8.parseBreakContinueStatement = function(node, keyword) {
  var isBreak = keyword === "break";
  this.next();
  if (this.eat(types$1.semi) || this.insertSemicolon()) {
    node.label = null;
  } else if (this.type !== types$1.name) {
    this.unexpected();
  } else {
    node.label = this.parseIdent();
    this.semicolon();
  }
  var i = 0;
  for (; i < this.labels.length; ++i) {
    var lab = this.labels[i];
    if (node.label == null || lab.name === node.label.name) {
      if (lab.kind != null && (isBreak || lab.kind === "loop")) {
        break;
      }
      if (node.label && isBreak) {
        break;
      }
    }
  }
  if (i === this.labels.length) {
    this.raise(node.start, "Unsyntactic " + keyword);
  }
  return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement");
};
pp$8.parseDebuggerStatement = function(node) {
  this.next();
  this.semicolon();
  return this.finishNode(node, "DebuggerStatement");
};
pp$8.parseDoStatement = function(node) {
  this.next();
  this.labels.push(loopLabel);
  node.body = this.parseStatement("do");
  this.labels.pop();
  this.expect(types$1._while);
  node.test = this.parseParenExpression();
  if (this.options.ecmaVersion >= 6) {
    this.eat(types$1.semi);
  } else {
    this.semicolon();
  }
  return this.finishNode(node, "DoWhileStatement");
};
pp$8.parseForStatement = function(node) {
  this.next();
  var awaitAt = this.options.ecmaVersion >= 9 && this.canAwait && this.eatContextual("await") ? this.lastTokStart : -1;
  this.labels.push(loopLabel);
  this.enterScope(0);
  this.expect(types$1.parenL);
  if (this.type === types$1.semi) {
    if (awaitAt > -1) {
      this.unexpected(awaitAt);
    }
    return this.parseFor(node, null);
  }
  var isLet = this.isLet();
  if (this.type === types$1._var || this.type === types$1._const || isLet) {
    var init$1 = this.startNode(), kind = isLet ? "let" : this.value;
    this.next();
    this.parseVar(init$1, true, kind);
    this.finishNode(init$1, "VariableDeclaration");
    return this.parseForAfterInit(node, init$1, awaitAt);
  }
  var startsWithLet = this.isContextual("let"), isForOf = false;
  var usingKind = this.isUsing(true) ? "using" : this.isAwaitUsing(true) ? "await using" : null;
  if (usingKind) {
    var init$2 = this.startNode();
    this.next();
    if (usingKind === "await using") {
      this.next();
    }
    this.parseVar(init$2, true, usingKind);
    this.finishNode(init$2, "VariableDeclaration");
    return this.parseForAfterInit(node, init$2, awaitAt);
  }
  var containsEsc = this.containsEsc;
  var refDestructuringErrors = new DestructuringErrors();
  var initPos = this.start;
  var init = awaitAt > -1 ? this.parseExprSubscripts(refDestructuringErrors, "await") : this.parseExpression(true, refDestructuringErrors);
  if (this.type === types$1._in || (isForOf = this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
    if (awaitAt > -1) {
      if (this.type === types$1._in) {
        this.unexpected(awaitAt);
      }
      node.await = true;
    } else if (isForOf && this.options.ecmaVersion >= 8) {
      if (init.start === initPos && !containsEsc && init.type === "Identifier" && init.name === "async") {
        this.unexpected();
      } else if (this.options.ecmaVersion >= 9) {
        node.await = false;
      }
    }
    if (startsWithLet && isForOf) {
      this.raise(init.start, "The left-hand side of a for-of loop may not start with 'let'.");
    }
    this.toAssignable(init, false, refDestructuringErrors);
    this.checkLValPattern(init);
    return this.parseForIn(node, init);
  } else {
    this.checkExpressionErrors(refDestructuringErrors, true);
  }
  if (awaitAt > -1) {
    this.unexpected(awaitAt);
  }
  return this.parseFor(node, init);
};
pp$8.parseForAfterInit = function(node, init, awaitAt) {
  if ((this.type === types$1._in || this.options.ecmaVersion >= 6 && this.isContextual("of")) && init.declarations.length === 1) {
    if (this.options.ecmaVersion >= 9) {
      if (this.type === types$1._in) {
        if (awaitAt > -1) {
          this.unexpected(awaitAt);
        }
      } else {
        node.await = awaitAt > -1;
      }
    }
    return this.parseForIn(node, init);
  }
  if (awaitAt > -1) {
    this.unexpected(awaitAt);
  }
  return this.parseFor(node, init);
};
pp$8.parseFunctionStatement = function(node, isAsync, declarationPosition) {
  this.next();
  return this.parseFunction(node, FUNC_STATEMENT | (declarationPosition ? 0 : FUNC_HANGING_STATEMENT), false, isAsync);
};
pp$8.parseIfStatement = function(node) {
  this.next();
  node.test = this.parseParenExpression();
  node.consequent = this.parseStatement("if");
  node.alternate = this.eat(types$1._else) ? this.parseStatement("if") : null;
  return this.finishNode(node, "IfStatement");
};
pp$8.parseReturnStatement = function(node) {
  if (!this.inFunction && !this.options.allowReturnOutsideFunction) {
    this.raise(this.start, "'return' outside of function");
  }
  this.next();
  if (this.eat(types$1.semi) || this.insertSemicolon()) {
    node.argument = null;
  } else {
    node.argument = this.parseExpression();
    this.semicolon();
  }
  return this.finishNode(node, "ReturnStatement");
};
pp$8.parseSwitchStatement = function(node) {
  this.next();
  node.discriminant = this.parseParenExpression();
  node.cases = [];
  this.expect(types$1.braceL);
  this.labels.push(switchLabel);
  this.enterScope(0);
  var cur;
  for (var sawDefault = false; this.type !== types$1.braceR; ) {
    if (this.type === types$1._case || this.type === types$1._default) {
      var isCase = this.type === types$1._case;
      if (cur) {
        this.finishNode(cur, "SwitchCase");
      }
      node.cases.push(cur = this.startNode());
      cur.consequent = [];
      this.next();
      if (isCase) {
        cur.test = this.parseExpression();
      } else {
        if (sawDefault) {
          this.raiseRecoverable(this.lastTokStart, "Multiple default clauses");
        }
        sawDefault = true;
        cur.test = null;
      }
      this.expect(types$1.colon);
    } else {
      if (!cur) {
        this.unexpected();
      }
      cur.consequent.push(this.parseStatement(null));
    }
  }
  this.exitScope();
  if (cur) {
    this.finishNode(cur, "SwitchCase");
  }
  this.next();
  this.labels.pop();
  return this.finishNode(node, "SwitchStatement");
};
pp$8.parseThrowStatement = function(node) {
  this.next();
  if (lineBreak.test(this.input.slice(this.lastTokEnd, this.start))) {
    this.raise(this.lastTokEnd, "Illegal newline after throw");
  }
  node.argument = this.parseExpression();
  this.semicolon();
  return this.finishNode(node, "ThrowStatement");
};
var empty$1 = [];
pp$8.parseCatchClauseParam = function() {
  var param = this.parseBindingAtom();
  var simple = param.type === "Identifier";
  this.enterScope(simple ? SCOPE_SIMPLE_CATCH : 0);
  this.checkLValPattern(param, simple ? BIND_SIMPLE_CATCH : BIND_LEXICAL);
  this.expect(types$1.parenR);
  return param;
};
pp$8.parseTryStatement = function(node) {
  this.next();
  node.block = this.parseBlock();
  node.handler = null;
  if (this.type === types$1._catch) {
    var clause = this.startNode();
    this.next();
    if (this.eat(types$1.parenL)) {
      clause.param = this.parseCatchClauseParam();
    } else {
      if (this.options.ecmaVersion < 10) {
        this.unexpected();
      }
      clause.param = null;
      this.enterScope(0);
    }
    clause.body = this.parseBlock(false);
    this.exitScope();
    node.handler = this.finishNode(clause, "CatchClause");
  }
  node.finalizer = this.eat(types$1._finally) ? this.parseBlock() : null;
  if (!node.handler && !node.finalizer) {
    this.raise(node.start, "Missing catch or finally clause");
  }
  return this.finishNode(node, "TryStatement");
};
pp$8.parseVarStatement = function(node, kind, allowMissingInitializer) {
  this.next();
  this.parseVar(node, false, kind, allowMissingInitializer);
  this.semicolon();
  return this.finishNode(node, "VariableDeclaration");
};
pp$8.parseWhileStatement = function(node) {
  this.next();
  node.test = this.parseParenExpression();
  this.labels.push(loopLabel);
  node.body = this.parseStatement("while");
  this.labels.pop();
  return this.finishNode(node, "WhileStatement");
};
pp$8.parseWithStatement = function(node) {
  if (this.strict) {
    this.raise(this.start, "'with' in strict mode");
  }
  this.next();
  node.object = this.parseParenExpression();
  node.body = this.parseStatement("with");
  return this.finishNode(node, "WithStatement");
};
pp$8.parseEmptyStatement = function(node) {
  this.next();
  return this.finishNode(node, "EmptyStatement");
};
pp$8.parseLabeledStatement = function(node, maybeName, expr, context) {
  for (var i$1 = 0, list = this.labels; i$1 < list.length; i$1 += 1) {
    var label = list[i$1];
    if (label.name === maybeName) {
      this.raise(expr.start, "Label '" + maybeName + "' is already declared");
    }
  }
  var kind = this.type.isLoop ? "loop" : this.type === types$1._switch ? "switch" : null;
  for (var i = this.labels.length - 1; i >= 0; i--) {
    var label$1 = this.labels[i];
    if (label$1.statementStart === node.start) {
      label$1.statementStart = this.start;
      label$1.kind = kind;
    } else {
      break;
    }
  }
  this.labels.push({ name: maybeName, kind, statementStart: this.start });
  node.body = this.parseStatement(context ? context.indexOf("label") === -1 ? context + "label" : context : "label");
  this.labels.pop();
  node.label = expr;
  return this.finishNode(node, "LabeledStatement");
};
pp$8.parseExpressionStatement = function(node, expr) {
  node.expression = expr;
  this.semicolon();
  return this.finishNode(node, "ExpressionStatement");
};
pp$8.parseBlock = function(createNewLexicalScope, node, exitStrict) {
  if (createNewLexicalScope === void 0) createNewLexicalScope = true;
  if (node === void 0) node = this.startNode();
  node.body = [];
  this.expect(types$1.braceL);
  if (createNewLexicalScope) {
    this.enterScope(0);
  }
  while (this.type !== types$1.braceR) {
    var stmt = this.parseStatement(null);
    node.body.push(stmt);
  }
  if (exitStrict) {
    this.strict = false;
  }
  this.next();
  if (createNewLexicalScope) {
    this.exitScope();
  }
  return this.finishNode(node, "BlockStatement");
};
pp$8.parseFor = function(node, init) {
  node.init = init;
  this.expect(types$1.semi);
  node.test = this.type === types$1.semi ? null : this.parseExpression();
  this.expect(types$1.semi);
  node.update = this.type === types$1.parenR ? null : this.parseExpression();
  this.expect(types$1.parenR);
  node.body = this.parseStatement("for");
  this.exitScope();
  this.labels.pop();
  return this.finishNode(node, "ForStatement");
};
pp$8.parseForIn = function(node, init) {
  var isForIn = this.type === types$1._in;
  this.next();
  if (init.type === "VariableDeclaration" && init.declarations[0].init != null && (!isForIn || this.options.ecmaVersion < 8 || this.strict || init.kind !== "var" || init.declarations[0].id.type !== "Identifier")) {
    this.raise(
      init.start,
      (isForIn ? "for-in" : "for-of") + " loop variable declaration may not have an initializer"
    );
  }
  node.left = init;
  node.right = isForIn ? this.parseExpression() : this.parseMaybeAssign();
  this.expect(types$1.parenR);
  node.body = this.parseStatement("for");
  this.exitScope();
  this.labels.pop();
  return this.finishNode(node, isForIn ? "ForInStatement" : "ForOfStatement");
};
pp$8.parseVar = function(node, isFor, kind, allowMissingInitializer) {
  node.declarations = [];
  node.kind = kind;
  for (; ; ) {
    var decl = this.startNode();
    this.parseVarId(decl, kind);
    if (this.eat(types$1.eq)) {
      decl.init = this.parseMaybeAssign(isFor);
    } else if (!allowMissingInitializer && kind === "const" && !(this.type === types$1._in || this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
      this.unexpected();
    } else if (!allowMissingInitializer && (kind === "using" || kind === "await using") && this.options.ecmaVersion >= 17 && this.type !== types$1._in && !this.isContextual("of")) {
      this.raise(this.lastTokEnd, "Missing initializer in " + kind + " declaration");
    } else if (!allowMissingInitializer && decl.id.type !== "Identifier" && !(isFor && (this.type === types$1._in || this.isContextual("of")))) {
      this.raise(this.lastTokEnd, "Complex binding patterns require an initialization value");
    } else {
      decl.init = null;
    }
    node.declarations.push(this.finishNode(decl, "VariableDeclarator"));
    if (!this.eat(types$1.comma)) {
      break;
    }
  }
  return node;
};
pp$8.parseVarId = function(decl, kind) {
  decl.id = kind === "using" || kind === "await using" ? this.parseIdent() : this.parseBindingAtom();
  this.checkLValPattern(decl.id, kind === "var" ? BIND_VAR : BIND_LEXICAL, false);
};
var FUNC_STATEMENT = 1;
var FUNC_HANGING_STATEMENT = 2;
var FUNC_NULLABLE_ID = 4;
pp$8.parseFunction = function(node, statement, allowExpressionBody, isAsync, forInit) {
  this.initFunction(node);
  if (this.options.ecmaVersion >= 9 || this.options.ecmaVersion >= 6 && !isAsync) {
    if (this.type === types$1.star && statement & FUNC_HANGING_STATEMENT) {
      this.unexpected();
    }
    node.generator = this.eat(types$1.star);
  }
  if (this.options.ecmaVersion >= 8) {
    node.async = !!isAsync;
  }
  if (statement & FUNC_STATEMENT) {
    node.id = statement & FUNC_NULLABLE_ID && this.type !== types$1.name ? null : this.parseIdent();
    if (node.id && !(statement & FUNC_HANGING_STATEMENT)) {
      this.checkLValSimple(node.id, this.strict || node.generator || node.async ? this.treatFunctionsAsVar ? BIND_VAR : BIND_LEXICAL : BIND_FUNCTION);
    }
  }
  var oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
  this.yieldPos = 0;
  this.awaitPos = 0;
  this.awaitIdentPos = 0;
  this.enterScope(functionFlags(node.async, node.generator));
  if (!(statement & FUNC_STATEMENT)) {
    node.id = this.type === types$1.name ? this.parseIdent() : null;
  }
  this.parseFunctionParams(node);
  this.parseFunctionBody(node, allowExpressionBody, false, forInit);
  this.yieldPos = oldYieldPos;
  this.awaitPos = oldAwaitPos;
  this.awaitIdentPos = oldAwaitIdentPos;
  return this.finishNode(node, statement & FUNC_STATEMENT ? "FunctionDeclaration" : "FunctionExpression");
};
pp$8.parseFunctionParams = function(node) {
  this.expect(types$1.parenL);
  node.params = this.parseBindingList(types$1.parenR, false, this.options.ecmaVersion >= 8);
  this.checkYieldAwaitInDefaultParams();
};
pp$8.parseClass = function(node, isStatement) {
  this.next();
  var oldStrict = this.strict;
  this.strict = true;
  this.parseClassId(node, isStatement);
  this.parseClassSuper(node);
  var privateNameMap = this.enterClassBody();
  var classBody = this.startNode();
  var hadConstructor = false;
  classBody.body = [];
  this.expect(types$1.braceL);
  while (this.type !== types$1.braceR) {
    var element = this.parseClassElement(node.superClass !== null);
    if (element) {
      classBody.body.push(element);
      if (element.type === "MethodDefinition" && element.kind === "constructor") {
        if (hadConstructor) {
          this.raiseRecoverable(element.start, "Duplicate constructor in the same class");
        }
        hadConstructor = true;
      } else if (element.key && element.key.type === "PrivateIdentifier" && isPrivateNameConflicted(privateNameMap, element)) {
        this.raiseRecoverable(element.key.start, "Identifier '#" + element.key.name + "' has already been declared");
      }
    }
  }
  this.strict = oldStrict;
  this.next();
  node.body = this.finishNode(classBody, "ClassBody");
  this.exitClassBody();
  return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression");
};
pp$8.parseClassElement = function(constructorAllowsSuper) {
  if (this.eat(types$1.semi)) {
    return null;
  }
  var ecmaVersion = this.options.ecmaVersion;
  var node = this.startNode();
  var keyName = "";
  var isGenerator = false;
  var isAsync = false;
  var kind = "method";
  var isStatic = false;
  if (this.eatContextual("static")) {
    if (ecmaVersion >= 13 && this.eat(types$1.braceL)) {
      this.parseClassStaticBlock(node);
      return node;
    }
    if (this.isClassElementNameStart() || this.type === types$1.star) {
      isStatic = true;
    } else {
      keyName = "static";
    }
  }
  node.static = isStatic;
  if (!keyName && ecmaVersion >= 8 && this.eatContextual("async")) {
    if ((this.isClassElementNameStart() || this.type === types$1.star) && !this.canInsertSemicolon()) {
      isAsync = true;
    } else {
      keyName = "async";
    }
  }
  if (!keyName && (ecmaVersion >= 9 || !isAsync) && this.eat(types$1.star)) {
    isGenerator = true;
  }
  if (!keyName && !isAsync && !isGenerator) {
    var lastValue = this.value;
    if (this.eatContextual("get") || this.eatContextual("set")) {
      if (this.isClassElementNameStart()) {
        kind = lastValue;
      } else {
        keyName = lastValue;
      }
    }
  }
  if (keyName) {
    node.computed = false;
    node.key = this.startNodeAt(this.lastTokStart, this.lastTokStartLoc);
    node.key.name = keyName;
    this.finishNode(node.key, "Identifier");
  } else {
    this.parseClassElementName(node);
  }
  if (ecmaVersion < 13 || this.type === types$1.parenL || kind !== "method" || isGenerator || isAsync) {
    var isConstructor = !node.static && checkKeyName(node, "constructor");
    var allowsDirectSuper = isConstructor && constructorAllowsSuper;
    if (isConstructor && kind !== "method") {
      this.raise(node.key.start, "Constructor can't have get/set modifier");
    }
    node.kind = isConstructor ? "constructor" : kind;
    this.parseClassMethod(node, isGenerator, isAsync, allowsDirectSuper);
  } else {
    this.parseClassField(node);
  }
  return node;
};
pp$8.isClassElementNameStart = function() {
  return this.type === types$1.name || this.type === types$1.privateId || this.type === types$1.num || this.type === types$1.string || this.type === types$1.bracketL || this.type.keyword;
};
pp$8.parseClassElementName = function(element) {
  if (this.type === types$1.privateId) {
    if (this.value === "constructor") {
      this.raise(this.start, "Classes can't have an element named '#constructor'");
    }
    element.computed = false;
    element.key = this.parsePrivateIdent();
  } else {
    this.parsePropertyName(element);
  }
};
pp$8.parseClassMethod = function(method, isGenerator, isAsync, allowsDirectSuper) {
  var key = method.key;
  if (method.kind === "constructor") {
    if (isGenerator) {
      this.raise(key.start, "Constructor can't be a generator");
    }
    if (isAsync) {
      this.raise(key.start, "Constructor can't be an async method");
    }
  } else if (method.static && checkKeyName(method, "prototype")) {
    this.raise(key.start, "Classes may not have a static property named prototype");
  }
  var value = method.value = this.parseMethod(isGenerator, isAsync, allowsDirectSuper);
  if (method.kind === "get" && value.params.length !== 0) {
    this.raiseRecoverable(value.start, "getter should have no params");
  }
  if (method.kind === "set" && value.params.length !== 1) {
    this.raiseRecoverable(value.start, "setter should have exactly one param");
  }
  if (method.kind === "set" && value.params[0].type === "RestElement") {
    this.raiseRecoverable(value.params[0].start, "Setter cannot use rest params");
  }
  return this.finishNode(method, "MethodDefinition");
};
pp$8.parseClassField = function(field) {
  if (checkKeyName(field, "constructor")) {
    this.raise(field.key.start, "Classes can't have a field named 'constructor'");
  } else if (field.static && checkKeyName(field, "prototype")) {
    this.raise(field.key.start, "Classes can't have a static field named 'prototype'");
  }
  if (this.eat(types$1.eq)) {
    this.enterScope(SCOPE_CLASS_FIELD_INIT | SCOPE_SUPER);
    field.value = this.parseMaybeAssign();
    this.exitScope();
  } else {
    field.value = null;
  }
  this.semicolon();
  return this.finishNode(field, "PropertyDefinition");
};
pp$8.parseClassStaticBlock = function(node) {
  node.body = [];
  var oldLabels = this.labels;
  this.labels = [];
  this.enterScope(SCOPE_CLASS_STATIC_BLOCK | SCOPE_SUPER);
  while (this.type !== types$1.braceR) {
    var stmt = this.parseStatement(null);
    node.body.push(stmt);
  }
  this.next();
  this.exitScope();
  this.labels = oldLabels;
  return this.finishNode(node, "StaticBlock");
};
pp$8.parseClassId = function(node, isStatement) {
  if (this.type === types$1.name) {
    node.id = this.parseIdent();
    if (isStatement) {
      this.checkLValSimple(node.id, BIND_LEXICAL, false);
    }
  } else {
    if (isStatement === true) {
      this.unexpected();
    }
    node.id = null;
  }
};
pp$8.parseClassSuper = function(node) {
  node.superClass = this.eat(types$1._extends) ? this.parseExprSubscripts(null, false) : null;
};
pp$8.enterClassBody = function() {
  var element = { declared: /* @__PURE__ */ Object.create(null), used: [] };
  this.privateNameStack.push(element);
  return element.declared;
};
pp$8.exitClassBody = function() {
  var ref2 = this.privateNameStack.pop();
  var declared = ref2.declared;
  var used = ref2.used;
  if (!this.options.checkPrivateFields) {
    return;
  }
  var len = this.privateNameStack.length;
  var parent = len === 0 ? null : this.privateNameStack[len - 1];
  for (var i = 0; i < used.length; ++i) {
    var id = used[i];
    if (!hasOwn(declared, id.name)) {
      if (parent) {
        parent.used.push(id);
      } else {
        this.raiseRecoverable(id.start, "Private field '#" + id.name + "' must be declared in an enclosing class");
      }
    }
  }
};
function isPrivateNameConflicted(privateNameMap, element) {
  var name = element.key.name;
  var curr = privateNameMap[name];
  var next = "true";
  if (element.type === "MethodDefinition" && (element.kind === "get" || element.kind === "set")) {
    next = (element.static ? "s" : "i") + element.kind;
  }
  if (curr === "iget" && next === "iset" || curr === "iset" && next === "iget" || curr === "sget" && next === "sset" || curr === "sset" && next === "sget") {
    privateNameMap[name] = "true";
    return false;
  } else if (!curr) {
    privateNameMap[name] = next;
    return false;
  } else {
    return true;
  }
}
function checkKeyName(node, name) {
  var computed = node.computed;
  var key = node.key;
  return !computed && (key.type === "Identifier" && key.name === name || key.type === "Literal" && key.value === name);
}
pp$8.parseExportAllDeclaration = function(node, exports) {
  if (this.options.ecmaVersion >= 11) {
    if (this.eatContextual("as")) {
      node.exported = this.parseModuleExportName();
      this.checkExport(exports, node.exported, this.lastTokStart);
    } else {
      node.exported = null;
    }
  }
  this.expectContextual("from");
  if (this.type !== types$1.string) {
    this.unexpected();
  }
  node.source = this.parseExprAtom();
  if (this.options.ecmaVersion >= 16) {
    node.attributes = this.parseWithClause();
  }
  this.semicolon();
  return this.finishNode(node, "ExportAllDeclaration");
};
pp$8.parseExport = function(node, exports) {
  this.next();
  if (this.eat(types$1.star)) {
    return this.parseExportAllDeclaration(node, exports);
  }
  if (this.eat(types$1._default)) {
    this.checkExport(exports, "default", this.lastTokStart);
    node.declaration = this.parseExportDefaultDeclaration();
    return this.finishNode(node, "ExportDefaultDeclaration");
  }
  if (this.shouldParseExportStatement()) {
    node.declaration = this.parseExportDeclaration(node);
    if (node.declaration.type === "VariableDeclaration") {
      this.checkVariableExport(exports, node.declaration.declarations);
    } else {
      this.checkExport(exports, node.declaration.id, node.declaration.id.start);
    }
    node.specifiers = [];
    node.source = null;
    if (this.options.ecmaVersion >= 16) {
      node.attributes = [];
    }
  } else {
    node.declaration = null;
    node.specifiers = this.parseExportSpecifiers(exports);
    if (this.eatContextual("from")) {
      if (this.type !== types$1.string) {
        this.unexpected();
      }
      node.source = this.parseExprAtom();
      if (this.options.ecmaVersion >= 16) {
        node.attributes = this.parseWithClause();
      }
    } else {
      for (var i = 0, list = node.specifiers; i < list.length; i += 1) {
        var spec = list[i];
        this.checkUnreserved(spec.local);
        this.checkLocalExport(spec.local);
        if (spec.local.type === "Literal") {
          this.raise(spec.local.start, "A string literal cannot be used as an exported binding without `from`.");
        }
      }
      node.source = null;
      if (this.options.ecmaVersion >= 16) {
        node.attributes = [];
      }
    }
    this.semicolon();
  }
  return this.finishNode(node, "ExportNamedDeclaration");
};
pp$8.parseExportDeclaration = function(node) {
  return this.parseStatement(null);
};
pp$8.parseExportDefaultDeclaration = function() {
  var isAsync;
  if (this.type === types$1._function || (isAsync = this.isAsyncFunction())) {
    var fNode = this.startNode();
    this.next();
    if (isAsync) {
      this.next();
    }
    return this.parseFunction(fNode, FUNC_STATEMENT | FUNC_NULLABLE_ID, false, isAsync);
  } else if (this.type === types$1._class) {
    var cNode = this.startNode();
    return this.parseClass(cNode, "nullableID");
  } else {
    var declaration = this.parseMaybeAssign();
    this.semicolon();
    return declaration;
  }
};
pp$8.checkExport = function(exports, name, pos) {
  if (!exports) {
    return;
  }
  if (typeof name !== "string") {
    name = name.type === "Identifier" ? name.name : name.value;
  }
  if (hasOwn(exports, name)) {
    this.raiseRecoverable(pos, "Duplicate export '" + name + "'");
  }
  exports[name] = true;
};
pp$8.checkPatternExport = function(exports, pat) {
  var type = pat.type;
  if (type === "Identifier") {
    this.checkExport(exports, pat, pat.start);
  } else if (type === "ObjectPattern") {
    for (var i = 0, list = pat.properties; i < list.length; i += 1) {
      var prop = list[i];
      this.checkPatternExport(exports, prop);
    }
  } else if (type === "ArrayPattern") {
    for (var i$1 = 0, list$1 = pat.elements; i$1 < list$1.length; i$1 += 1) {
      var elt = list$1[i$1];
      if (elt) {
        this.checkPatternExport(exports, elt);
      }
    }
  } else if (type === "Property") {
    this.checkPatternExport(exports, pat.value);
  } else if (type === "AssignmentPattern") {
    this.checkPatternExport(exports, pat.left);
  } else if (type === "RestElement") {
    this.checkPatternExport(exports, pat.argument);
  }
};
pp$8.checkVariableExport = function(exports, decls) {
  if (!exports) {
    return;
  }
  for (var i = 0, list = decls; i < list.length; i += 1) {
    var decl = list[i];
    this.checkPatternExport(exports, decl.id);
  }
};
pp$8.shouldParseExportStatement = function() {
  return this.type.keyword === "var" || this.type.keyword === "const" || this.type.keyword === "class" || this.type.keyword === "function" || this.isLet() || this.isAsyncFunction();
};
pp$8.parseExportSpecifier = function(exports) {
  var node = this.startNode();
  node.local = this.parseModuleExportName();
  node.exported = this.eatContextual("as") ? this.parseModuleExportName() : node.local;
  this.checkExport(
    exports,
    node.exported,
    node.exported.start
  );
  return this.finishNode(node, "ExportSpecifier");
};
pp$8.parseExportSpecifiers = function(exports) {
  var nodes = [], first = true;
  this.expect(types$1.braceL);
  while (!this.eat(types$1.braceR)) {
    if (!first) {
      this.expect(types$1.comma);
      if (this.afterTrailingComma(types$1.braceR)) {
        break;
      }
    } else {
      first = false;
    }
    nodes.push(this.parseExportSpecifier(exports));
  }
  return nodes;
};
pp$8.parseImport = function(node) {
  this.next();
  if (this.type === types$1.string) {
    node.specifiers = empty$1;
    node.source = this.parseExprAtom();
  } else {
    node.specifiers = this.parseImportSpecifiers();
    this.expectContextual("from");
    node.source = this.type === types$1.string ? this.parseExprAtom() : this.unexpected();
  }
  if (this.options.ecmaVersion >= 16) {
    node.attributes = this.parseWithClause();
  }
  this.semicolon();
  return this.finishNode(node, "ImportDeclaration");
};
pp$8.parseImportSpecifier = function() {
  var node = this.startNode();
  node.imported = this.parseModuleExportName();
  if (this.eatContextual("as")) {
    node.local = this.parseIdent();
  } else {
    this.checkUnreserved(node.imported);
    node.local = node.imported;
  }
  this.checkLValSimple(node.local, BIND_LEXICAL);
  return this.finishNode(node, "ImportSpecifier");
};
pp$8.parseImportDefaultSpecifier = function() {
  var node = this.startNode();
  node.local = this.parseIdent();
  this.checkLValSimple(node.local, BIND_LEXICAL);
  return this.finishNode(node, "ImportDefaultSpecifier");
};
pp$8.parseImportNamespaceSpecifier = function() {
  var node = this.startNode();
  this.next();
  this.expectContextual("as");
  node.local = this.parseIdent();
  this.checkLValSimple(node.local, BIND_LEXICAL);
  return this.finishNode(node, "ImportNamespaceSpecifier");
};
pp$8.parseImportSpecifiers = function() {
  var nodes = [], first = true;
  if (this.type === types$1.name) {
    nodes.push(this.parseImportDefaultSpecifier());
    if (!this.eat(types$1.comma)) {
      return nodes;
    }
  }
  if (this.type === types$1.star) {
    nodes.push(this.parseImportNamespaceSpecifier());
    return nodes;
  }
  this.expect(types$1.braceL);
  while (!this.eat(types$1.braceR)) {
    if (!first) {
      this.expect(types$1.comma);
      if (this.afterTrailingComma(types$1.braceR)) {
        break;
      }
    } else {
      first = false;
    }
    nodes.push(this.parseImportSpecifier());
  }
  return nodes;
};
pp$8.parseWithClause = function() {
  var nodes = [];
  if (!this.eat(types$1._with)) {
    return nodes;
  }
  this.expect(types$1.braceL);
  var attributeKeys = {};
  var first = true;
  while (!this.eat(types$1.braceR)) {
    if (!first) {
      this.expect(types$1.comma);
      if (this.afterTrailingComma(types$1.braceR)) {
        break;
      }
    } else {
      first = false;
    }
    var attr = this.parseImportAttribute();
    var keyName = attr.key.type === "Identifier" ? attr.key.name : attr.key.value;
    if (hasOwn(attributeKeys, keyName)) {
      this.raiseRecoverable(attr.key.start, "Duplicate attribute key '" + keyName + "'");
    }
    attributeKeys[keyName] = true;
    nodes.push(attr);
  }
  return nodes;
};
pp$8.parseImportAttribute = function() {
  var node = this.startNode();
  node.key = this.type === types$1.string ? this.parseExprAtom() : this.parseIdent(this.options.allowReserved !== "never");
  this.expect(types$1.colon);
  if (this.type !== types$1.string) {
    this.unexpected();
  }
  node.value = this.parseExprAtom();
  return this.finishNode(node, "ImportAttribute");
};
pp$8.parseModuleExportName = function() {
  if (this.options.ecmaVersion >= 13 && this.type === types$1.string) {
    var stringLiteral = this.parseLiteral(this.value);
    if (loneSurrogate.test(stringLiteral.value)) {
      this.raise(stringLiteral.start, "An export name cannot include a lone surrogate.");
    }
    return stringLiteral;
  }
  return this.parseIdent(true);
};
pp$8.adaptDirectivePrologue = function(statements) {
  for (var i = 0; i < statements.length && this.isDirectiveCandidate(statements[i]); ++i) {
    statements[i].directive = statements[i].expression.raw.slice(1, -1);
  }
};
pp$8.isDirectiveCandidate = function(statement) {
  return this.options.ecmaVersion >= 5 && statement.type === "ExpressionStatement" && statement.expression.type === "Literal" && typeof statement.expression.value === "string" && // Reject parenthesized strings.
  (this.input[statement.start] === '"' || this.input[statement.start] === "'");
};
var pp$7 = Parser.prototype;
pp$7.toAssignable = function(node, isBinding, refDestructuringErrors) {
  if (this.options.ecmaVersion >= 6 && node) {
    switch (node.type) {
      case "Identifier":
        if (this.inAsync && node.name === "await") {
          this.raise(node.start, "Cannot use 'await' as identifier inside an async function");
        }
        break;
      case "ObjectPattern":
      case "ArrayPattern":
      case "AssignmentPattern":
      case "RestElement":
        break;
      case "ObjectExpression":
        node.type = "ObjectPattern";
        if (refDestructuringErrors) {
          this.checkPatternErrors(refDestructuringErrors, true);
        }
        for (var i = 0, list = node.properties; i < list.length; i += 1) {
          var prop = list[i];
          this.toAssignable(prop, isBinding);
          if (prop.type === "RestElement" && (prop.argument.type === "ArrayPattern" || prop.argument.type === "ObjectPattern")) {
            this.raise(prop.argument.start, "Unexpected token");
          }
        }
        break;
      case "Property":
        if (node.kind !== "init") {
          this.raise(node.key.start, "Object pattern can't contain getter or setter");
        }
        this.toAssignable(node.value, isBinding);
        break;
      case "ArrayExpression":
        node.type = "ArrayPattern";
        if (refDestructuringErrors) {
          this.checkPatternErrors(refDestructuringErrors, true);
        }
        this.toAssignableList(node.elements, isBinding);
        break;
      case "SpreadElement":
        node.type = "RestElement";
        this.toAssignable(node.argument, isBinding);
        if (node.argument.type === "AssignmentPattern") {
          this.raise(node.argument.start, "Rest elements cannot have a default value");
        }
        break;
      case "AssignmentExpression":
        if (node.operator !== "=") {
          this.raise(node.left.end, "Only '=' operator can be used for specifying default value.");
        }
        node.type = "AssignmentPattern";
        delete node.operator;
        this.toAssignable(node.left, isBinding);
        break;
      case "ParenthesizedExpression":
        this.toAssignable(node.expression, isBinding, refDestructuringErrors);
        break;
      case "ChainExpression":
        this.raiseRecoverable(node.start, "Optional chaining cannot appear in left-hand side");
        break;
      case "MemberExpression":
        if (!isBinding) {
          break;
        }
      default:
        this.raise(node.start, "Assigning to rvalue");
    }
  } else if (refDestructuringErrors) {
    this.checkPatternErrors(refDestructuringErrors, true);
  }
  return node;
};
pp$7.toAssignableList = function(exprList, isBinding) {
  var end = exprList.length;
  for (var i = 0; i < end; i++) {
    var elt = exprList[i];
    if (elt) {
      this.toAssignable(elt, isBinding);
    }
  }
  if (end) {
    var last = exprList[end - 1];
    if (this.options.ecmaVersion === 6 && isBinding && last && last.type === "RestElement" && last.argument.type !== "Identifier") {
      this.unexpected(last.argument.start);
    }
  }
  return exprList;
};
pp$7.parseSpread = function(refDestructuringErrors) {
  var node = this.startNode();
  this.next();
  node.argument = this.parseMaybeAssign(false, refDestructuringErrors);
  return this.finishNode(node, "SpreadElement");
};
pp$7.parseRestBinding = function() {
  var node = this.startNode();
  this.next();
  if (this.options.ecmaVersion === 6 && this.type !== types$1.name) {
    this.unexpected();
  }
  node.argument = this.parseBindingAtom();
  return this.finishNode(node, "RestElement");
};
pp$7.parseBindingAtom = function() {
  if (this.options.ecmaVersion >= 6) {
    switch (this.type) {
      case types$1.bracketL:
        var node = this.startNode();
        this.next();
        node.elements = this.parseBindingList(types$1.bracketR, true, true);
        return this.finishNode(node, "ArrayPattern");
      case types$1.braceL:
        return this.parseObj(true);
    }
  }
  return this.parseIdent();
};
pp$7.parseBindingList = function(close, allowEmpty, allowTrailingComma, allowModifiers) {
  var elts = [], first = true;
  while (!this.eat(close)) {
    if (first) {
      first = false;
    } else {
      this.expect(types$1.comma);
    }
    if (allowEmpty && this.type === types$1.comma) {
      elts.push(null);
    } else if (allowTrailingComma && this.afterTrailingComma(close)) {
      break;
    } else if (this.type === types$1.ellipsis) {
      var rest = this.parseRestBinding();
      this.parseBindingListItem(rest);
      elts.push(rest);
      if (this.type === types$1.comma) {
        this.raiseRecoverable(this.start, "Comma is not permitted after the rest element");
      }
      this.expect(close);
      break;
    } else {
      elts.push(this.parseAssignableListItem(allowModifiers));
    }
  }
  return elts;
};
pp$7.parseAssignableListItem = function(allowModifiers) {
  var elem = this.parseMaybeDefault(this.start, this.startLoc);
  this.parseBindingListItem(elem);
  return elem;
};
pp$7.parseBindingListItem = function(param) {
  return param;
};
pp$7.parseMaybeDefault = function(startPos, startLoc, left) {
  left = left || this.parseBindingAtom();
  if (this.options.ecmaVersion < 6 || !this.eat(types$1.eq)) {
    return left;
  }
  var node = this.startNodeAt(startPos, startLoc);
  node.left = left;
  node.right = this.parseMaybeAssign();
  return this.finishNode(node, "AssignmentPattern");
};
pp$7.checkLValSimple = function(expr, bindingType, checkClashes) {
  if (bindingType === void 0) bindingType = BIND_NONE;
  var isBind = bindingType !== BIND_NONE;
  switch (expr.type) {
    case "Identifier":
      if (this.strict && this.reservedWordsStrictBind.test(expr.name)) {
        this.raiseRecoverable(expr.start, (isBind ? "Binding " : "Assigning to ") + expr.name + " in strict mode");
      }
      if (isBind) {
        if (bindingType === BIND_LEXICAL && expr.name === "let") {
          this.raiseRecoverable(expr.start, "let is disallowed as a lexically bound name");
        }
        if (checkClashes) {
          if (hasOwn(checkClashes, expr.name)) {
            this.raiseRecoverable(expr.start, "Argument name clash");
          }
          checkClashes[expr.name] = true;
        }
        if (bindingType !== BIND_OUTSIDE) {
          this.declareName(expr.name, bindingType, expr.start);
        }
      }
      break;
    case "ChainExpression":
      this.raiseRecoverable(expr.start, "Optional chaining cannot appear in left-hand side");
      break;
    case "MemberExpression":
      if (isBind) {
        this.raiseRecoverable(expr.start, "Binding member expression");
      }
      break;
    case "ParenthesizedExpression":
      if (isBind) {
        this.raiseRecoverable(expr.start, "Binding parenthesized expression");
      }
      return this.checkLValSimple(expr.expression, bindingType, checkClashes);
    default:
      this.raise(expr.start, (isBind ? "Binding" : "Assigning to") + " rvalue");
  }
};
pp$7.checkLValPattern = function(expr, bindingType, checkClashes) {
  if (bindingType === void 0) bindingType = BIND_NONE;
  switch (expr.type) {
    case "ObjectPattern":
      for (var i = 0, list = expr.properties; i < list.length; i += 1) {
        var prop = list[i];
        this.checkLValInnerPattern(prop, bindingType, checkClashes);
      }
      break;
    case "ArrayPattern":
      for (var i$1 = 0, list$1 = expr.elements; i$1 < list$1.length; i$1 += 1) {
        var elem = list$1[i$1];
        if (elem) {
          this.checkLValInnerPattern(elem, bindingType, checkClashes);
        }
      }
      break;
    default:
      this.checkLValSimple(expr, bindingType, checkClashes);
  }
};
pp$7.checkLValInnerPattern = function(expr, bindingType, checkClashes) {
  if (bindingType === void 0) bindingType = BIND_NONE;
  switch (expr.type) {
    case "Property":
      this.checkLValInnerPattern(expr.value, bindingType, checkClashes);
      break;
    case "AssignmentPattern":
      this.checkLValPattern(expr.left, bindingType, checkClashes);
      break;
    case "RestElement":
      this.checkLValPattern(expr.argument, bindingType, checkClashes);
      break;
    default:
      this.checkLValPattern(expr, bindingType, checkClashes);
  }
};
var TokContext = function TokContext2(token, isExpr, preserveSpace, override, generator) {
  this.token = token;
  this.isExpr = !!isExpr;
  this.preserveSpace = !!preserveSpace;
  this.override = override;
  this.generator = !!generator;
};
var types = {
  b_stat: new TokContext("{", false),
  b_expr: new TokContext("{", true),
  b_tmpl: new TokContext("${", false),
  p_stat: new TokContext("(", false),
  p_expr: new TokContext("(", true),
  q_tmpl: new TokContext("`", true, true, function(p) {
    return p.tryReadTemplateToken();
  }),
  f_stat: new TokContext("function", false),
  f_expr: new TokContext("function", true),
  f_expr_gen: new TokContext("function", true, false, null, true),
  f_gen: new TokContext("function", false, false, null, true)
};
var pp$6 = Parser.prototype;
pp$6.initialContext = function() {
  return [types.b_stat];
};
pp$6.curContext = function() {
  return this.context[this.context.length - 1];
};
pp$6.braceIsBlock = function(prevType) {
  var parent = this.curContext();
  if (parent === types.f_expr || parent === types.f_stat) {
    return true;
  }
  if (prevType === types$1.colon && (parent === types.b_stat || parent === types.b_expr)) {
    return !parent.isExpr;
  }
  if (prevType === types$1._return || prevType === types$1.name && this.exprAllowed) {
    return lineBreak.test(this.input.slice(this.lastTokEnd, this.start));
  }
  if (prevType === types$1._else || prevType === types$1.semi || prevType === types$1.eof || prevType === types$1.parenR || prevType === types$1.arrow) {
    return true;
  }
  if (prevType === types$1.braceL) {
    return parent === types.b_stat;
  }
  if (prevType === types$1._var || prevType === types$1._const || prevType === types$1.name) {
    return false;
  }
  return !this.exprAllowed;
};
pp$6.inGeneratorContext = function() {
  for (var i = this.context.length - 1; i >= 1; i--) {
    var context = this.context[i];
    if (context.token === "function") {
      return context.generator;
    }
  }
  return false;
};
pp$6.updateContext = function(prevType) {
  var update, type = this.type;
  if (type.keyword && prevType === types$1.dot) {
    this.exprAllowed = false;
  } else if (update = type.updateContext) {
    update.call(this, prevType);
  } else {
    this.exprAllowed = type.beforeExpr;
  }
};
pp$6.overrideContext = function(tokenCtx) {
  if (this.curContext() !== tokenCtx) {
    this.context[this.context.length - 1] = tokenCtx;
  }
};
types$1.parenR.updateContext = types$1.braceR.updateContext = function() {
  if (this.context.length === 1) {
    this.exprAllowed = true;
    return;
  }
  var out = this.context.pop();
  if (out === types.b_stat && this.curContext().token === "function") {
    out = this.context.pop();
  }
  this.exprAllowed = !out.isExpr;
};
types$1.braceL.updateContext = function(prevType) {
  this.context.push(this.braceIsBlock(prevType) ? types.b_stat : types.b_expr);
  this.exprAllowed = true;
};
types$1.dollarBraceL.updateContext = function() {
  this.context.push(types.b_tmpl);
  this.exprAllowed = true;
};
types$1.parenL.updateContext = function(prevType) {
  var statementParens = prevType === types$1._if || prevType === types$1._for || prevType === types$1._with || prevType === types$1._while;
  this.context.push(statementParens ? types.p_stat : types.p_expr);
  this.exprAllowed = true;
};
types$1.incDec.updateContext = function() {
};
types$1._function.updateContext = types$1._class.updateContext = function(prevType) {
  if (prevType.beforeExpr && prevType !== types$1._else && !(prevType === types$1.semi && this.curContext() !== types.p_stat) && !(prevType === types$1._return && lineBreak.test(this.input.slice(this.lastTokEnd, this.start))) && !((prevType === types$1.colon || prevType === types$1.braceL) && this.curContext() === types.b_stat)) {
    this.context.push(types.f_expr);
  } else {
    this.context.push(types.f_stat);
  }
  this.exprAllowed = false;
};
types$1.colon.updateContext = function() {
  if (this.curContext().token === "function") {
    this.context.pop();
  }
  this.exprAllowed = true;
};
types$1.backQuote.updateContext = function() {
  if (this.curContext() === types.q_tmpl) {
    this.context.pop();
  } else {
    this.context.push(types.q_tmpl);
  }
  this.exprAllowed = false;
};
types$1.star.updateContext = function(prevType) {
  if (prevType === types$1._function) {
    var index = this.context.length - 1;
    if (this.context[index] === types.f_expr) {
      this.context[index] = types.f_expr_gen;
    } else {
      this.context[index] = types.f_gen;
    }
  }
  this.exprAllowed = true;
};
types$1.name.updateContext = function(prevType) {
  var allowed = false;
  if (this.options.ecmaVersion >= 6 && prevType !== types$1.dot) {
    if (this.value === "of" && !this.exprAllowed || this.value === "yield" && this.inGeneratorContext()) {
      allowed = true;
    }
  }
  this.exprAllowed = allowed;
};
var pp$5 = Parser.prototype;
pp$5.checkPropClash = function(prop, propHash, refDestructuringErrors) {
  if (this.options.ecmaVersion >= 9 && prop.type === "SpreadElement") {
    return;
  }
  if (this.options.ecmaVersion >= 6 && (prop.computed || prop.method || prop.shorthand)) {
    return;
  }
  var key = prop.key;
  var name;
  switch (key.type) {
    case "Identifier":
      name = key.name;
      break;
    case "Literal":
      name = String(key.value);
      break;
    default:
      return;
  }
  var kind = prop.kind;
  if (this.options.ecmaVersion >= 6) {
    if (name === "__proto__" && kind === "init") {
      if (propHash.proto) {
        if (refDestructuringErrors) {
          if (refDestructuringErrors.doubleProto < 0) {
            refDestructuringErrors.doubleProto = key.start;
          }
        } else {
          this.raiseRecoverable(key.start, "Redefinition of __proto__ property");
        }
      }
      propHash.proto = true;
    }
    return;
  }
  name = "$" + name;
  var other = propHash[name];
  if (other) {
    var redefinition;
    if (kind === "init") {
      redefinition = this.strict && other.init || other.get || other.set;
    } else {
      redefinition = other.init || other[kind];
    }
    if (redefinition) {
      this.raiseRecoverable(key.start, "Redefinition of property");
    }
  } else {
    other = propHash[name] = {
      init: false,
      get: false,
      set: false
    };
  }
  other[kind] = true;
};
pp$5.parseExpression = function(forInit, refDestructuringErrors) {
  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseMaybeAssign(forInit, refDestructuringErrors);
  if (this.type === types$1.comma) {
    var node = this.startNodeAt(startPos, startLoc);
    node.expressions = [expr];
    while (this.eat(types$1.comma)) {
      node.expressions.push(this.parseMaybeAssign(forInit, refDestructuringErrors));
    }
    return this.finishNode(node, "SequenceExpression");
  }
  return expr;
};
pp$5.parseMaybeAssign = function(forInit, refDestructuringErrors, afterLeftParse) {
  if (this.isContextual("yield")) {
    if (this.inGenerator) {
      return this.parseYield(forInit);
    } else {
      this.exprAllowed = false;
    }
  }
  var ownDestructuringErrors = false, oldParenAssign = -1, oldTrailingComma = -1, oldDoubleProto = -1;
  if (refDestructuringErrors) {
    oldParenAssign = refDestructuringErrors.parenthesizedAssign;
    oldTrailingComma = refDestructuringErrors.trailingComma;
    oldDoubleProto = refDestructuringErrors.doubleProto;
    refDestructuringErrors.parenthesizedAssign = refDestructuringErrors.trailingComma = -1;
  } else {
    refDestructuringErrors = new DestructuringErrors();
    ownDestructuringErrors = true;
  }
  var startPos = this.start, startLoc = this.startLoc;
  if (this.type === types$1.parenL || this.type === types$1.name) {
    this.potentialArrowAt = this.start;
    this.potentialArrowInForAwait = forInit === "await";
  }
  var left = this.parseMaybeConditional(forInit, refDestructuringErrors);
  if (afterLeftParse) {
    left = afterLeftParse.call(this, left, startPos, startLoc);
  }
  if (this.type.isAssign) {
    var node = this.startNodeAt(startPos, startLoc);
    node.operator = this.value;
    if (this.type === types$1.eq) {
      left = this.toAssignable(left, false, refDestructuringErrors);
    }
    if (!ownDestructuringErrors) {
      refDestructuringErrors.parenthesizedAssign = refDestructuringErrors.trailingComma = refDestructuringErrors.doubleProto = -1;
    }
    if (refDestructuringErrors.shorthandAssign >= left.start) {
      refDestructuringErrors.shorthandAssign = -1;
    }
    if (this.type === types$1.eq) {
      this.checkLValPattern(left);
    } else {
      this.checkLValSimple(left);
    }
    node.left = left;
    this.next();
    node.right = this.parseMaybeAssign(forInit);
    if (oldDoubleProto > -1) {
      refDestructuringErrors.doubleProto = oldDoubleProto;
    }
    return this.finishNode(node, "AssignmentExpression");
  } else {
    if (ownDestructuringErrors) {
      this.checkExpressionErrors(refDestructuringErrors, true);
    }
  }
  if (oldParenAssign > -1) {
    refDestructuringErrors.parenthesizedAssign = oldParenAssign;
  }
  if (oldTrailingComma > -1) {
    refDestructuringErrors.trailingComma = oldTrailingComma;
  }
  return left;
};
pp$5.parseMaybeConditional = function(forInit, refDestructuringErrors) {
  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseExprOps(forInit, refDestructuringErrors);
  if (this.checkExpressionErrors(refDestructuringErrors)) {
    return expr;
  }
  if (this.eat(types$1.question)) {
    var node = this.startNodeAt(startPos, startLoc);
    node.test = expr;
    node.consequent = this.parseMaybeAssign();
    this.expect(types$1.colon);
    node.alternate = this.parseMaybeAssign(forInit);
    return this.finishNode(node, "ConditionalExpression");
  }
  return expr;
};
pp$5.parseExprOps = function(forInit, refDestructuringErrors) {
  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseMaybeUnary(refDestructuringErrors, false, false, forInit);
  if (this.checkExpressionErrors(refDestructuringErrors)) {
    return expr;
  }
  return expr.start === startPos && expr.type === "ArrowFunctionExpression" ? expr : this.parseExprOp(expr, startPos, startLoc, -1, forInit);
};
pp$5.parseExprOp = function(left, leftStartPos, leftStartLoc, minPrec, forInit) {
  var prec = this.type.binop;
  if (prec != null && (!forInit || this.type !== types$1._in)) {
    if (prec > minPrec) {
      var logical = this.type === types$1.logicalOR || this.type === types$1.logicalAND;
      var coalesce = this.type === types$1.coalesce;
      if (coalesce) {
        prec = types$1.logicalAND.binop;
      }
      var op = this.value;
      this.next();
      var startPos = this.start, startLoc = this.startLoc;
      var right = this.parseExprOp(this.parseMaybeUnary(null, false, false, forInit), startPos, startLoc, prec, forInit);
      var node = this.buildBinary(leftStartPos, leftStartLoc, left, right, op, logical || coalesce);
      if (logical && this.type === types$1.coalesce || coalesce && (this.type === types$1.logicalOR || this.type === types$1.logicalAND)) {
        this.raiseRecoverable(this.start, "Logical expressions and coalesce expressions cannot be mixed. Wrap either by parentheses");
      }
      return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec, forInit);
    }
  }
  return left;
};
pp$5.buildBinary = function(startPos, startLoc, left, right, op, logical) {
  if (right.type === "PrivateIdentifier") {
    this.raise(right.start, "Private identifier can only be left side of binary expression");
  }
  var node = this.startNodeAt(startPos, startLoc);
  node.left = left;
  node.operator = op;
  node.right = right;
  return this.finishNode(node, logical ? "LogicalExpression" : "BinaryExpression");
};
pp$5.parseMaybeUnary = function(refDestructuringErrors, sawUnary, incDec, forInit) {
  var startPos = this.start, startLoc = this.startLoc, expr;
  if (this.isContextual("await") && this.canAwait) {
    expr = this.parseAwait(forInit);
    sawUnary = true;
  } else if (this.type.prefix) {
    var node = this.startNode(), update = this.type === types$1.incDec;
    node.operator = this.value;
    node.prefix = true;
    this.next();
    node.argument = this.parseMaybeUnary(null, true, update, forInit);
    this.checkExpressionErrors(refDestructuringErrors, true);
    if (update) {
      this.checkLValSimple(node.argument);
    } else if (this.strict && node.operator === "delete" && isLocalVariableAccess(node.argument)) {
      this.raiseRecoverable(node.start, "Deleting local variable in strict mode");
    } else if (node.operator === "delete" && isPrivateFieldAccess(node.argument)) {
      this.raiseRecoverable(node.start, "Private fields can not be deleted");
    } else {
      sawUnary = true;
    }
    expr = this.finishNode(node, update ? "UpdateExpression" : "UnaryExpression");
  } else if (!sawUnary && this.type === types$1.privateId) {
    if ((forInit || this.privateNameStack.length === 0) && this.options.checkPrivateFields) {
      this.unexpected();
    }
    expr = this.parsePrivateIdent();
    if (this.type !== types$1._in) {
      this.unexpected();
    }
  } else {
    expr = this.parseExprSubscripts(refDestructuringErrors, forInit);
    if (this.checkExpressionErrors(refDestructuringErrors)) {
      return expr;
    }
    while (this.type.postfix && !this.canInsertSemicolon()) {
      var node$1 = this.startNodeAt(startPos, startLoc);
      node$1.operator = this.value;
      node$1.prefix = false;
      node$1.argument = expr;
      this.checkLValSimple(expr);
      this.next();
      expr = this.finishNode(node$1, "UpdateExpression");
    }
  }
  if (!incDec && this.eat(types$1.starstar)) {
    if (sawUnary) {
      this.unexpected(this.lastTokStart);
    } else {
      return this.buildBinary(startPos, startLoc, expr, this.parseMaybeUnary(null, false, false, forInit), "**", false);
    }
  } else {
    return expr;
  }
};
function isLocalVariableAccess(node) {
  return node.type === "Identifier" || node.type === "ParenthesizedExpression" && isLocalVariableAccess(node.expression);
}
function isPrivateFieldAccess(node) {
  return node.type === "MemberExpression" && node.property.type === "PrivateIdentifier" || node.type === "ChainExpression" && isPrivateFieldAccess(node.expression) || node.type === "ParenthesizedExpression" && isPrivateFieldAccess(node.expression);
}
pp$5.parseExprSubscripts = function(refDestructuringErrors, forInit) {
  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseExprAtom(refDestructuringErrors, forInit);
  if (expr.type === "ArrowFunctionExpression" && this.input.slice(this.lastTokStart, this.lastTokEnd) !== ")") {
    return expr;
  }
  var result = this.parseSubscripts(expr, startPos, startLoc, false, forInit);
  if (refDestructuringErrors && result.type === "MemberExpression") {
    if (refDestructuringErrors.parenthesizedAssign >= result.start) {
      refDestructuringErrors.parenthesizedAssign = -1;
    }
    if (refDestructuringErrors.parenthesizedBind >= result.start) {
      refDestructuringErrors.parenthesizedBind = -1;
    }
    if (refDestructuringErrors.trailingComma >= result.start) {
      refDestructuringErrors.trailingComma = -1;
    }
  }
  return result;
};
pp$5.parseSubscripts = function(base, startPos, startLoc, noCalls, forInit) {
  var maybeAsyncArrow = this.options.ecmaVersion >= 8 && base.type === "Identifier" && base.name === "async" && this.lastTokEnd === base.end && !this.canInsertSemicolon() && base.end - base.start === 5 && this.potentialArrowAt === base.start;
  var optionalChained = false;
  while (true) {
    var element = this.parseSubscript(base, startPos, startLoc, noCalls, maybeAsyncArrow, optionalChained, forInit);
    if (element.optional) {
      optionalChained = true;
    }
    if (element === base || element.type === "ArrowFunctionExpression") {
      if (optionalChained) {
        var chainNode = this.startNodeAt(startPos, startLoc);
        chainNode.expression = element;
        element = this.finishNode(chainNode, "ChainExpression");
      }
      return element;
    }
    base = element;
  }
};
pp$5.shouldParseAsyncArrow = function() {
  return !this.canInsertSemicolon() && this.eat(types$1.arrow);
};
pp$5.parseSubscriptAsyncArrow = function(startPos, startLoc, exprList, forInit) {
  return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList, true, forInit);
};
pp$5.parseSubscript = function(base, startPos, startLoc, noCalls, maybeAsyncArrow, optionalChained, forInit) {
  var optionalSupported = this.options.ecmaVersion >= 11;
  var optional = optionalSupported && this.eat(types$1.questionDot);
  if (noCalls && optional) {
    this.raise(this.lastTokStart, "Optional chaining cannot appear in the callee of new expressions");
  }
  var computed = this.eat(types$1.bracketL);
  if (computed || optional && this.type !== types$1.parenL && this.type !== types$1.backQuote || this.eat(types$1.dot)) {
    var node = this.startNodeAt(startPos, startLoc);
    node.object = base;
    if (computed) {
      node.property = this.parseExpression();
      this.expect(types$1.bracketR);
    } else if (this.type === types$1.privateId && base.type !== "Super") {
      node.property = this.parsePrivateIdent();
    } else {
      node.property = this.parseIdent(this.options.allowReserved !== "never");
    }
    node.computed = !!computed;
    if (optionalSupported) {
      node.optional = optional;
    }
    base = this.finishNode(node, "MemberExpression");
  } else if (!noCalls && this.eat(types$1.parenL)) {
    var refDestructuringErrors = new DestructuringErrors(), oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
    this.yieldPos = 0;
    this.awaitPos = 0;
    this.awaitIdentPos = 0;
    var exprList = this.parseExprList(types$1.parenR, this.options.ecmaVersion >= 8, false, refDestructuringErrors);
    if (maybeAsyncArrow && !optional && this.shouldParseAsyncArrow()) {
      this.checkPatternErrors(refDestructuringErrors, false);
      this.checkYieldAwaitInDefaultParams();
      if (this.awaitIdentPos > 0) {
        this.raise(this.awaitIdentPos, "Cannot use 'await' as identifier inside an async function");
      }
      this.yieldPos = oldYieldPos;
      this.awaitPos = oldAwaitPos;
      this.awaitIdentPos = oldAwaitIdentPos;
      return this.parseSubscriptAsyncArrow(startPos, startLoc, exprList, forInit);
    }
    this.checkExpressionErrors(refDestructuringErrors, true);
    this.yieldPos = oldYieldPos || this.yieldPos;
    this.awaitPos = oldAwaitPos || this.awaitPos;
    this.awaitIdentPos = oldAwaitIdentPos || this.awaitIdentPos;
    var node$1 = this.startNodeAt(startPos, startLoc);
    node$1.callee = base;
    node$1.arguments = exprList;
    if (optionalSupported) {
      node$1.optional = optional;
    }
    base = this.finishNode(node$1, "CallExpression");
  } else if (this.type === types$1.backQuote) {
    if (optional || optionalChained) {
      this.raise(this.start, "Optional chaining cannot appear in the tag of tagged template expressions");
    }
    var node$2 = this.startNodeAt(startPos, startLoc);
    node$2.tag = base;
    node$2.quasi = this.parseTemplate({ isTagged: true });
    base = this.finishNode(node$2, "TaggedTemplateExpression");
  }
  return base;
};
pp$5.parseExprAtom = function(refDestructuringErrors, forInit, forNew) {
  if (this.type === types$1.slash) {
    this.readRegexp();
  }
  var node, canBeArrow = this.potentialArrowAt === this.start;
  switch (this.type) {
    case types$1._super:
      if (!this.allowSuper) {
        this.raise(this.start, "'super' keyword outside a method");
      }
      node = this.startNode();
      this.next();
      if (this.type === types$1.parenL && !this.allowDirectSuper) {
        this.raise(node.start, "super() call outside constructor of a subclass");
      }
      if (this.type !== types$1.dot && this.type !== types$1.bracketL && this.type !== types$1.parenL) {
        this.unexpected();
      }
      return this.finishNode(node, "Super");
    case types$1._this:
      node = this.startNode();
      this.next();
      return this.finishNode(node, "ThisExpression");
    case types$1.name:
      var startPos = this.start, startLoc = this.startLoc, containsEsc = this.containsEsc;
      var id = this.parseIdent(false);
      if (this.options.ecmaVersion >= 8 && !containsEsc && id.name === "async" && !this.canInsertSemicolon() && this.eat(types$1._function)) {
        this.overrideContext(types.f_expr);
        return this.parseFunction(this.startNodeAt(startPos, startLoc), 0, false, true, forInit);
      }
      if (canBeArrow && !this.canInsertSemicolon()) {
        if (this.eat(types$1.arrow)) {
          return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], false, forInit);
        }
        if (this.options.ecmaVersion >= 8 && id.name === "async" && this.type === types$1.name && !containsEsc && (!this.potentialArrowInForAwait || this.value !== "of" || this.containsEsc)) {
          id = this.parseIdent(false);
          if (this.canInsertSemicolon() || !this.eat(types$1.arrow)) {
            this.unexpected();
          }
          return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], true, forInit);
        }
      }
      return id;
    case types$1.regexp:
      var value = this.value;
      node = this.parseLiteral(value.value);
      node.regex = { pattern: value.pattern, flags: value.flags };
      return node;
    case types$1.num:
    case types$1.string:
      return this.parseLiteral(this.value);
    case types$1._null:
    case types$1._true:
    case types$1._false:
      node = this.startNode();
      node.value = this.type === types$1._null ? null : this.type === types$1._true;
      node.raw = this.type.keyword;
      this.next();
      return this.finishNode(node, "Literal");
    case types$1.parenL:
      var start = this.start, expr = this.parseParenAndDistinguishExpression(canBeArrow, forInit);
      if (refDestructuringErrors) {
        if (refDestructuringErrors.parenthesizedAssign < 0 && !this.isSimpleAssignTarget(expr)) {
          refDestructuringErrors.parenthesizedAssign = start;
        }
        if (refDestructuringErrors.parenthesizedBind < 0) {
          refDestructuringErrors.parenthesizedBind = start;
        }
      }
      return expr;
    case types$1.bracketL:
      node = this.startNode();
      this.next();
      node.elements = this.parseExprList(types$1.bracketR, true, true, refDestructuringErrors);
      return this.finishNode(node, "ArrayExpression");
    case types$1.braceL:
      this.overrideContext(types.b_expr);
      return this.parseObj(false, refDestructuringErrors);
    case types$1._function:
      node = this.startNode();
      this.next();
      return this.parseFunction(node, 0);
    case types$1._class:
      return this.parseClass(this.startNode(), false);
    case types$1._new:
      return this.parseNew();
    case types$1.backQuote:
      return this.parseTemplate();
    case types$1._import:
      if (this.options.ecmaVersion >= 11) {
        return this.parseExprImport(forNew);
      } else {
        return this.unexpected();
      }
    default:
      return this.parseExprAtomDefault();
  }
};
pp$5.parseExprAtomDefault = function() {
  this.unexpected();
};
pp$5.parseExprImport = function(forNew) {
  var node = this.startNode();
  if (this.containsEsc) {
    this.raiseRecoverable(this.start, "Escape sequence in keyword import");
  }
  this.next();
  if (this.type === types$1.parenL && !forNew) {
    return this.parseDynamicImport(node);
  } else if (this.type === types$1.dot) {
    var meta = this.startNodeAt(node.start, node.loc && node.loc.start);
    meta.name = "import";
    node.meta = this.finishNode(meta, "Identifier");
    return this.parseImportMeta(node);
  } else {
    this.unexpected();
  }
};
pp$5.parseDynamicImport = function(node) {
  this.next();
  node.source = this.parseMaybeAssign();
  if (this.options.ecmaVersion >= 16) {
    if (!this.eat(types$1.parenR)) {
      this.expect(types$1.comma);
      if (!this.afterTrailingComma(types$1.parenR)) {
        node.options = this.parseMaybeAssign();
        if (!this.eat(types$1.parenR)) {
          this.expect(types$1.comma);
          if (!this.afterTrailingComma(types$1.parenR)) {
            this.unexpected();
          }
        }
      } else {
        node.options = null;
      }
    } else {
      node.options = null;
    }
  } else {
    if (!this.eat(types$1.parenR)) {
      var errorPos = this.start;
      if (this.eat(types$1.comma) && this.eat(types$1.parenR)) {
        this.raiseRecoverable(errorPos, "Trailing comma is not allowed in import()");
      } else {
        this.unexpected(errorPos);
      }
    }
  }
  return this.finishNode(node, "ImportExpression");
};
pp$5.parseImportMeta = function(node) {
  this.next();
  var containsEsc = this.containsEsc;
  node.property = this.parseIdent(true);
  if (node.property.name !== "meta") {
    this.raiseRecoverable(node.property.start, "The only valid meta property for import is 'import.meta'");
  }
  if (containsEsc) {
    this.raiseRecoverable(node.start, "'import.meta' must not contain escaped characters");
  }
  if (this.options.sourceType !== "module" && !this.options.allowImportExportEverywhere) {
    this.raiseRecoverable(node.start, "Cannot use 'import.meta' outside a module");
  }
  return this.finishNode(node, "MetaProperty");
};
pp$5.parseLiteral = function(value) {
  var node = this.startNode();
  node.value = value;
  node.raw = this.input.slice(this.start, this.end);
  if (node.raw.charCodeAt(node.raw.length - 1) === 110) {
    node.bigint = node.value != null ? node.value.toString() : node.raw.slice(0, -1).replace(/_/g, "");
  }
  this.next();
  return this.finishNode(node, "Literal");
};
pp$5.parseParenExpression = function() {
  this.expect(types$1.parenL);
  var val = this.parseExpression();
  this.expect(types$1.parenR);
  return val;
};
pp$5.shouldParseArrow = function(exprList) {
  return !this.canInsertSemicolon();
};
pp$5.parseParenAndDistinguishExpression = function(canBeArrow, forInit) {
  var startPos = this.start, startLoc = this.startLoc, val, allowTrailingComma = this.options.ecmaVersion >= 8;
  if (this.options.ecmaVersion >= 6) {
    this.next();
    var innerStartPos = this.start, innerStartLoc = this.startLoc;
    var exprList = [], first = true, lastIsComma = false;
    var refDestructuringErrors = new DestructuringErrors(), oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, spreadStart;
    this.yieldPos = 0;
    this.awaitPos = 0;
    while (this.type !== types$1.parenR) {
      first ? first = false : this.expect(types$1.comma);
      if (allowTrailingComma && this.afterTrailingComma(types$1.parenR, true)) {
        lastIsComma = true;
        break;
      } else if (this.type === types$1.ellipsis) {
        spreadStart = this.start;
        exprList.push(this.parseParenItem(this.parseRestBinding()));
        if (this.type === types$1.comma) {
          this.raiseRecoverable(
            this.start,
            "Comma is not permitted after the rest element"
          );
        }
        break;
      } else {
        exprList.push(this.parseMaybeAssign(false, refDestructuringErrors, this.parseParenItem));
      }
    }
    var innerEndPos = this.lastTokEnd, innerEndLoc = this.lastTokEndLoc;
    this.expect(types$1.parenR);
    if (canBeArrow && this.shouldParseArrow(exprList) && this.eat(types$1.arrow)) {
      this.checkPatternErrors(refDestructuringErrors, false);
      this.checkYieldAwaitInDefaultParams();
      this.yieldPos = oldYieldPos;
      this.awaitPos = oldAwaitPos;
      return this.parseParenArrowList(startPos, startLoc, exprList, forInit);
    }
    if (!exprList.length || lastIsComma) {
      this.unexpected(this.lastTokStart);
    }
    if (spreadStart) {
      this.unexpected(spreadStart);
    }
    this.checkExpressionErrors(refDestructuringErrors, true);
    this.yieldPos = oldYieldPos || this.yieldPos;
    this.awaitPos = oldAwaitPos || this.awaitPos;
    if (exprList.length > 1) {
      val = this.startNodeAt(innerStartPos, innerStartLoc);
      val.expressions = exprList;
      this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc);
    } else {
      val = exprList[0];
    }
  } else {
    val = this.parseParenExpression();
  }
  if (this.options.preserveParens) {
    var par = this.startNodeAt(startPos, startLoc);
    par.expression = val;
    return this.finishNode(par, "ParenthesizedExpression");
  } else {
    return val;
  }
};
pp$5.parseParenItem = function(item) {
  return item;
};
pp$5.parseParenArrowList = function(startPos, startLoc, exprList, forInit) {
  return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList, false, forInit);
};
var empty = [];
pp$5.parseNew = function() {
  if (this.containsEsc) {
    this.raiseRecoverable(this.start, "Escape sequence in keyword new");
  }
  var node = this.startNode();
  this.next();
  if (this.options.ecmaVersion >= 6 && this.type === types$1.dot) {
    var meta = this.startNodeAt(node.start, node.loc && node.loc.start);
    meta.name = "new";
    node.meta = this.finishNode(meta, "Identifier");
    this.next();
    var containsEsc = this.containsEsc;
    node.property = this.parseIdent(true);
    if (node.property.name !== "target") {
      this.raiseRecoverable(node.property.start, "The only valid meta property for new is 'new.target'");
    }
    if (containsEsc) {
      this.raiseRecoverable(node.start, "'new.target' must not contain escaped characters");
    }
    if (!this.allowNewDotTarget) {
      this.raiseRecoverable(node.start, "'new.target' can only be used in functions and class static block");
    }
    return this.finishNode(node, "MetaProperty");
  }
  var startPos = this.start, startLoc = this.startLoc;
  node.callee = this.parseSubscripts(this.parseExprAtom(null, false, true), startPos, startLoc, true, false);
  if (this.eat(types$1.parenL)) {
    node.arguments = this.parseExprList(types$1.parenR, this.options.ecmaVersion >= 8, false);
  } else {
    node.arguments = empty;
  }
  return this.finishNode(node, "NewExpression");
};
pp$5.parseTemplateElement = function(ref2) {
  var isTagged = ref2.isTagged;
  var elem = this.startNode();
  if (this.type === types$1.invalidTemplate) {
    if (!isTagged) {
      this.raiseRecoverable(this.start, "Bad escape sequence in untagged template literal");
    }
    elem.value = {
      raw: this.value.replace(/\r\n?/g, "\n"),
      cooked: null
    };
  } else {
    elem.value = {
      raw: this.input.slice(this.start, this.end).replace(/\r\n?/g, "\n"),
      cooked: this.value
    };
  }
  this.next();
  elem.tail = this.type === types$1.backQuote;
  return this.finishNode(elem, "TemplateElement");
};
pp$5.parseTemplate = function(ref2) {
  if (ref2 === void 0) ref2 = {};
  var isTagged = ref2.isTagged;
  if (isTagged === void 0) isTagged = false;
  var node = this.startNode();
  this.next();
  node.expressions = [];
  var curElt = this.parseTemplateElement({ isTagged });
  node.quasis = [curElt];
  while (!curElt.tail) {
    if (this.type === types$1.eof) {
      this.raise(this.pos, "Unterminated template literal");
    }
    this.expect(types$1.dollarBraceL);
    node.expressions.push(this.parseExpression());
    this.expect(types$1.braceR);
    node.quasis.push(curElt = this.parseTemplateElement({ isTagged }));
  }
  this.next();
  return this.finishNode(node, "TemplateLiteral");
};
pp$5.isAsyncProp = function(prop) {
  return !prop.computed && prop.key.type === "Identifier" && prop.key.name === "async" && (this.type === types$1.name || this.type === types$1.num || this.type === types$1.string || this.type === types$1.bracketL || this.type.keyword || this.options.ecmaVersion >= 9 && this.type === types$1.star) && !lineBreak.test(this.input.slice(this.lastTokEnd, this.start));
};
pp$5.parseObj = function(isPattern, refDestructuringErrors) {
  var node = this.startNode(), first = true, propHash = {};
  node.properties = [];
  this.next();
  while (!this.eat(types$1.braceR)) {
    if (!first) {
      this.expect(types$1.comma);
      if (this.options.ecmaVersion >= 5 && this.afterTrailingComma(types$1.braceR)) {
        break;
      }
    } else {
      first = false;
    }
    var prop = this.parseProperty(isPattern, refDestructuringErrors);
    if (!isPattern) {
      this.checkPropClash(prop, propHash, refDestructuringErrors);
    }
    node.properties.push(prop);
  }
  return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression");
};
pp$5.parseProperty = function(isPattern, refDestructuringErrors) {
  var prop = this.startNode(), isGenerator, isAsync, startPos, startLoc;
  if (this.options.ecmaVersion >= 9 && this.eat(types$1.ellipsis)) {
    if (isPattern) {
      prop.argument = this.parseIdent(false);
      if (this.type === types$1.comma) {
        this.raiseRecoverable(this.start, "Comma is not permitted after the rest element");
      }
      return this.finishNode(prop, "RestElement");
    }
    prop.argument = this.parseMaybeAssign(false, refDestructuringErrors);
    if (this.type === types$1.comma && refDestructuringErrors && refDestructuringErrors.trailingComma < 0) {
      refDestructuringErrors.trailingComma = this.start;
    }
    return this.finishNode(prop, "SpreadElement");
  }
  if (this.options.ecmaVersion >= 6) {
    prop.method = false;
    prop.shorthand = false;
    if (isPattern || refDestructuringErrors) {
      startPos = this.start;
      startLoc = this.startLoc;
    }
    if (!isPattern) {
      isGenerator = this.eat(types$1.star);
    }
  }
  var containsEsc = this.containsEsc;
  this.parsePropertyName(prop);
  if (!isPattern && !containsEsc && this.options.ecmaVersion >= 8 && !isGenerator && this.isAsyncProp(prop)) {
    isAsync = true;
    isGenerator = this.options.ecmaVersion >= 9 && this.eat(types$1.star);
    this.parsePropertyName(prop);
  } else {
    isAsync = false;
  }
  this.parsePropertyValue(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc);
  return this.finishNode(prop, "Property");
};
pp$5.parseGetterSetter = function(prop) {
  var kind = prop.key.name;
  this.parsePropertyName(prop);
  prop.value = this.parseMethod(false);
  prop.kind = kind;
  var paramCount = prop.kind === "get" ? 0 : 1;
  if (prop.value.params.length !== paramCount) {
    var start = prop.value.start;
    if (prop.kind === "get") {
      this.raiseRecoverable(start, "getter should have no params");
    } else {
      this.raiseRecoverable(start, "setter should have exactly one param");
    }
  } else {
    if (prop.kind === "set" && prop.value.params[0].type === "RestElement") {
      this.raiseRecoverable(prop.value.params[0].start, "Setter cannot use rest params");
    }
  }
};
pp$5.parsePropertyValue = function(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc) {
  if ((isGenerator || isAsync) && this.type === types$1.colon) {
    this.unexpected();
  }
  if (this.eat(types$1.colon)) {
    prop.value = isPattern ? this.parseMaybeDefault(this.start, this.startLoc) : this.parseMaybeAssign(false, refDestructuringErrors);
    prop.kind = "init";
  } else if (this.options.ecmaVersion >= 6 && this.type === types$1.parenL) {
    if (isPattern) {
      this.unexpected();
    }
    prop.method = true;
    prop.value = this.parseMethod(isGenerator, isAsync);
    prop.kind = "init";
  } else if (!isPattern && !containsEsc && this.options.ecmaVersion >= 5 && !prop.computed && prop.key.type === "Identifier" && (prop.key.name === "get" || prop.key.name === "set") && (this.type !== types$1.comma && this.type !== types$1.braceR && this.type !== types$1.eq)) {
    if (isGenerator || isAsync) {
      this.unexpected();
    }
    this.parseGetterSetter(prop);
  } else if (this.options.ecmaVersion >= 6 && !prop.computed && prop.key.type === "Identifier") {
    if (isGenerator || isAsync) {
      this.unexpected();
    }
    this.checkUnreserved(prop.key);
    if (prop.key.name === "await" && !this.awaitIdentPos) {
      this.awaitIdentPos = startPos;
    }
    if (isPattern) {
      prop.value = this.parseMaybeDefault(startPos, startLoc, this.copyNode(prop.key));
    } else if (this.type === types$1.eq && refDestructuringErrors) {
      if (refDestructuringErrors.shorthandAssign < 0) {
        refDestructuringErrors.shorthandAssign = this.start;
      }
      prop.value = this.parseMaybeDefault(startPos, startLoc, this.copyNode(prop.key));
    } else {
      prop.value = this.copyNode(prop.key);
    }
    prop.kind = "init";
    prop.shorthand = true;
  } else {
    this.unexpected();
  }
};
pp$5.parsePropertyName = function(prop) {
  if (this.options.ecmaVersion >= 6) {
    if (this.eat(types$1.bracketL)) {
      prop.computed = true;
      prop.key = this.parseMaybeAssign();
      this.expect(types$1.bracketR);
      return prop.key;
    } else {
      prop.computed = false;
    }
  }
  return prop.key = this.type === types$1.num || this.type === types$1.string ? this.parseExprAtom() : this.parseIdent(this.options.allowReserved !== "never");
};
pp$5.initFunction = function(node) {
  node.id = null;
  if (this.options.ecmaVersion >= 6) {
    node.generator = node.expression = false;
  }
  if (this.options.ecmaVersion >= 8) {
    node.async = false;
  }
};
pp$5.parseMethod = function(isGenerator, isAsync, allowDirectSuper) {
  var node = this.startNode(), oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
  this.initFunction(node);
  if (this.options.ecmaVersion >= 6) {
    node.generator = isGenerator;
  }
  if (this.options.ecmaVersion >= 8) {
    node.async = !!isAsync;
  }
  this.yieldPos = 0;
  this.awaitPos = 0;
  this.awaitIdentPos = 0;
  this.enterScope(functionFlags(isAsync, node.generator) | SCOPE_SUPER | (allowDirectSuper ? SCOPE_DIRECT_SUPER : 0));
  this.expect(types$1.parenL);
  node.params = this.parseBindingList(types$1.parenR, false, this.options.ecmaVersion >= 8);
  this.checkYieldAwaitInDefaultParams();
  this.parseFunctionBody(node, false, true, false);
  this.yieldPos = oldYieldPos;
  this.awaitPos = oldAwaitPos;
  this.awaitIdentPos = oldAwaitIdentPos;
  return this.finishNode(node, "FunctionExpression");
};
pp$5.parseArrowExpression = function(node, params, isAsync, forInit) {
  var oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
  this.enterScope(functionFlags(isAsync, false) | SCOPE_ARROW);
  this.initFunction(node);
  if (this.options.ecmaVersion >= 8) {
    node.async = !!isAsync;
  }
  this.yieldPos = 0;
  this.awaitPos = 0;
  this.awaitIdentPos = 0;
  node.params = this.toAssignableList(params, true);
  this.parseFunctionBody(node, true, false, forInit);
  this.yieldPos = oldYieldPos;
  this.awaitPos = oldAwaitPos;
  this.awaitIdentPos = oldAwaitIdentPos;
  return this.finishNode(node, "ArrowFunctionExpression");
};
pp$5.parseFunctionBody = function(node, isArrowFunction, isMethod, forInit) {
  var isExpression = isArrowFunction && this.type !== types$1.braceL;
  var oldStrict = this.strict, useStrict = false;
  if (isExpression) {
    node.body = this.parseMaybeAssign(forInit);
    node.expression = true;
    this.checkParams(node, false);
  } else {
    var nonSimple = this.options.ecmaVersion >= 7 && !this.isSimpleParamList(node.params);
    if (!oldStrict || nonSimple) {
      useStrict = this.strictDirective(this.end);
      if (useStrict && nonSimple) {
        this.raiseRecoverable(node.start, "Illegal 'use strict' directive in function with non-simple parameter list");
      }
    }
    var oldLabels = this.labels;
    this.labels = [];
    if (useStrict) {
      this.strict = true;
    }
    this.checkParams(node, !oldStrict && !useStrict && !isArrowFunction && !isMethod && this.isSimpleParamList(node.params));
    if (this.strict && node.id) {
      this.checkLValSimple(node.id, BIND_OUTSIDE);
    }
    node.body = this.parseBlock(false, void 0, useStrict && !oldStrict);
    node.expression = false;
    this.adaptDirectivePrologue(node.body.body);
    this.labels = oldLabels;
  }
  this.exitScope();
};
pp$5.isSimpleParamList = function(params) {
  for (var i = 0, list = params; i < list.length; i += 1) {
    var param = list[i];
    if (param.type !== "Identifier") {
      return false;
    }
  }
  return true;
};
pp$5.checkParams = function(node, allowDuplicates) {
  var nameHash = /* @__PURE__ */ Object.create(null);
  for (var i = 0, list = node.params; i < list.length; i += 1) {
    var param = list[i];
    this.checkLValInnerPattern(param, BIND_VAR, allowDuplicates ? null : nameHash);
  }
};
pp$5.parseExprList = function(close, allowTrailingComma, allowEmpty, refDestructuringErrors) {
  var elts = [], first = true;
  while (!this.eat(close)) {
    if (!first) {
      this.expect(types$1.comma);
      if (allowTrailingComma && this.afterTrailingComma(close)) {
        break;
      }
    } else {
      first = false;
    }
    var elt = void 0;
    if (allowEmpty && this.type === types$1.comma) {
      elt = null;
    } else if (this.type === types$1.ellipsis) {
      elt = this.parseSpread(refDestructuringErrors);
      if (refDestructuringErrors && this.type === types$1.comma && refDestructuringErrors.trailingComma < 0) {
        refDestructuringErrors.trailingComma = this.start;
      }
    } else {
      elt = this.parseMaybeAssign(false, refDestructuringErrors);
    }
    elts.push(elt);
  }
  return elts;
};
pp$5.checkUnreserved = function(ref2) {
  var start = ref2.start;
  var end = ref2.end;
  var name = ref2.name;
  if (this.inGenerator && name === "yield") {
    this.raiseRecoverable(start, "Cannot use 'yield' as identifier inside a generator");
  }
  if (this.inAsync && name === "await") {
    this.raiseRecoverable(start, "Cannot use 'await' as identifier inside an async function");
  }
  if (!(this.currentThisScope().flags & SCOPE_VAR) && name === "arguments") {
    this.raiseRecoverable(start, "Cannot use 'arguments' in class field initializer");
  }
  if (this.inClassStaticBlock && (name === "arguments" || name === "await")) {
    this.raise(start, "Cannot use " + name + " in class static initialization block");
  }
  if (this.keywords.test(name)) {
    this.raise(start, "Unexpected keyword '" + name + "'");
  }
  if (this.options.ecmaVersion < 6 && this.input.slice(start, end).indexOf("\\") !== -1) {
    return;
  }
  var re = this.strict ? this.reservedWordsStrict : this.reservedWords;
  if (re.test(name)) {
    if (!this.inAsync && name === "await") {
      this.raiseRecoverable(start, "Cannot use keyword 'await' outside an async function");
    }
    this.raiseRecoverable(start, "The keyword '" + name + "' is reserved");
  }
};
pp$5.parseIdent = function(liberal) {
  var node = this.parseIdentNode();
  this.next(!!liberal);
  this.finishNode(node, "Identifier");
  if (!liberal) {
    this.checkUnreserved(node);
    if (node.name === "await" && !this.awaitIdentPos) {
      this.awaitIdentPos = node.start;
    }
  }
  return node;
};
pp$5.parseIdentNode = function() {
  var node = this.startNode();
  if (this.type === types$1.name) {
    node.name = this.value;
  } else if (this.type.keyword) {
    node.name = this.type.keyword;
    if ((node.name === "class" || node.name === "function") && (this.lastTokEnd !== this.lastTokStart + 1 || this.input.charCodeAt(this.lastTokStart) !== 46)) {
      this.context.pop();
    }
    this.type = types$1.name;
  } else {
    this.unexpected();
  }
  return node;
};
pp$5.parsePrivateIdent = function() {
  var node = this.startNode();
  if (this.type === types$1.privateId) {
    node.name = this.value;
  } else {
    this.unexpected();
  }
  this.next();
  this.finishNode(node, "PrivateIdentifier");
  if (this.options.checkPrivateFields) {
    if (this.privateNameStack.length === 0) {
      this.raise(node.start, "Private field '#" + node.name + "' must be declared in an enclosing class");
    } else {
      this.privateNameStack[this.privateNameStack.length - 1].used.push(node);
    }
  }
  return node;
};
pp$5.parseYield = function(forInit) {
  if (!this.yieldPos) {
    this.yieldPos = this.start;
  }
  var node = this.startNode();
  this.next();
  if (this.type === types$1.semi || this.canInsertSemicolon() || this.type !== types$1.star && !this.type.startsExpr) {
    node.delegate = false;
    node.argument = null;
  } else {
    node.delegate = this.eat(types$1.star);
    node.argument = this.parseMaybeAssign(forInit);
  }
  return this.finishNode(node, "YieldExpression");
};
pp$5.parseAwait = function(forInit) {
  if (!this.awaitPos) {
    this.awaitPos = this.start;
  }
  var node = this.startNode();
  this.next();
  node.argument = this.parseMaybeUnary(null, true, false, forInit);
  return this.finishNode(node, "AwaitExpression");
};
var pp$4 = Parser.prototype;
pp$4.raise = function(pos, message) {
  var loc = getLineInfo(this.input, pos);
  message += " (" + loc.line + ":" + loc.column + ")";
  if (this.sourceFile) {
    message += " in " + this.sourceFile;
  }
  var err = new SyntaxError(message);
  err.pos = pos;
  err.loc = loc;
  err.raisedAt = this.pos;
  throw err;
};
pp$4.raiseRecoverable = pp$4.raise;
pp$4.curPosition = function() {
  if (this.options.locations) {
    return new Position(this.curLine, this.pos - this.lineStart);
  }
};
var pp$3 = Parser.prototype;
var Scope = function Scope2(flags) {
  this.flags = flags;
  this.var = [];
  this.lexical = [];
  this.functions = [];
};
pp$3.enterScope = function(flags) {
  this.scopeStack.push(new Scope(flags));
};
pp$3.exitScope = function() {
  this.scopeStack.pop();
};
pp$3.treatFunctionsAsVarInScope = function(scope) {
  return scope.flags & SCOPE_FUNCTION || !this.inModule && scope.flags & SCOPE_TOP;
};
pp$3.declareName = function(name, bindingType, pos) {
  var redeclared = false;
  if (bindingType === BIND_LEXICAL) {
    var scope = this.currentScope();
    redeclared = scope.lexical.indexOf(name) > -1 || scope.functions.indexOf(name) > -1 || scope.var.indexOf(name) > -1;
    scope.lexical.push(name);
    if (this.inModule && scope.flags & SCOPE_TOP) {
      delete this.undefinedExports[name];
    }
  } else if (bindingType === BIND_SIMPLE_CATCH) {
    var scope$1 = this.currentScope();
    scope$1.lexical.push(name);
  } else if (bindingType === BIND_FUNCTION) {
    var scope$2 = this.currentScope();
    if (this.treatFunctionsAsVar) {
      redeclared = scope$2.lexical.indexOf(name) > -1;
    } else {
      redeclared = scope$2.lexical.indexOf(name) > -1 || scope$2.var.indexOf(name) > -1;
    }
    scope$2.functions.push(name);
  } else {
    for (var i = this.scopeStack.length - 1; i >= 0; --i) {
      var scope$3 = this.scopeStack[i];
      if (scope$3.lexical.indexOf(name) > -1 && !(scope$3.flags & SCOPE_SIMPLE_CATCH && scope$3.lexical[0] === name) || !this.treatFunctionsAsVarInScope(scope$3) && scope$3.functions.indexOf(name) > -1) {
        redeclared = true;
        break;
      }
      scope$3.var.push(name);
      if (this.inModule && scope$3.flags & SCOPE_TOP) {
        delete this.undefinedExports[name];
      }
      if (scope$3.flags & SCOPE_VAR) {
        break;
      }
    }
  }
  if (redeclared) {
    this.raiseRecoverable(pos, "Identifier '" + name + "' has already been declared");
  }
};
pp$3.checkLocalExport = function(id) {
  if (this.scopeStack[0].lexical.indexOf(id.name) === -1 && this.scopeStack[0].var.indexOf(id.name) === -1) {
    this.undefinedExports[id.name] = id;
  }
};
pp$3.currentScope = function() {
  return this.scopeStack[this.scopeStack.length - 1];
};
pp$3.currentVarScope = function() {
  for (var i = this.scopeStack.length - 1; ; i--) {
    var scope = this.scopeStack[i];
    if (scope.flags & (SCOPE_VAR | SCOPE_CLASS_FIELD_INIT | SCOPE_CLASS_STATIC_BLOCK)) {
      return scope;
    }
  }
};
pp$3.currentThisScope = function() {
  for (var i = this.scopeStack.length - 1; ; i--) {
    var scope = this.scopeStack[i];
    if (scope.flags & (SCOPE_VAR | SCOPE_CLASS_FIELD_INIT | SCOPE_CLASS_STATIC_BLOCK) && !(scope.flags & SCOPE_ARROW)) {
      return scope;
    }
  }
};
var Node = function Node2(parser, pos, loc) {
  this.type = "";
  this.start = pos;
  this.end = 0;
  if (parser.options.locations) {
    this.loc = new SourceLocation(parser, loc);
  }
  if (parser.options.directSourceFile) {
    this.sourceFile = parser.options.directSourceFile;
  }
  if (parser.options.ranges) {
    this.range = [pos, 0];
  }
};
var pp$2 = Parser.prototype;
pp$2.startNode = function() {
  return new Node(this, this.start, this.startLoc);
};
pp$2.startNodeAt = function(pos, loc) {
  return new Node(this, pos, loc);
};
function finishNodeAt(node, type, pos, loc) {
  node.type = type;
  node.end = pos;
  if (this.options.locations) {
    node.loc.end = loc;
  }
  if (this.options.ranges) {
    node.range[1] = pos;
  }
  return node;
}
pp$2.finishNode = function(node, type) {
  return finishNodeAt.call(this, node, type, this.lastTokEnd, this.lastTokEndLoc);
};
pp$2.finishNodeAt = function(node, type, pos, loc) {
  return finishNodeAt.call(this, node, type, pos, loc);
};
pp$2.copyNode = function(node) {
  var newNode = new Node(this, node.start, this.startLoc);
  for (var prop in node) {
    newNode[prop] = node[prop];
  }
  return newNode;
};
var scriptValuesAddedInUnicode = "Gara Garay Gukh Gurung_Khema Hrkt Katakana_Or_Hiragana Kawi Kirat_Rai Krai Nag_Mundari Nagm Ol_Onal Onao Sunu Sunuwar Todhri Todr Tulu_Tigalari Tutg Unknown Zzzz";
var ecma9BinaryProperties = "ASCII ASCII_Hex_Digit AHex Alphabetic Alpha Any Assigned Bidi_Control Bidi_C Bidi_Mirrored Bidi_M Case_Ignorable CI Cased Changes_When_Casefolded CWCF Changes_When_Casemapped CWCM Changes_When_Lowercased CWL Changes_When_NFKC_Casefolded CWKCF Changes_When_Titlecased CWT Changes_When_Uppercased CWU Dash Default_Ignorable_Code_Point DI Deprecated Dep Diacritic Dia Emoji Emoji_Component Emoji_Modifier Emoji_Modifier_Base Emoji_Presentation Extender Ext Grapheme_Base Gr_Base Grapheme_Extend Gr_Ext Hex_Digit Hex IDS_Binary_Operator IDSB IDS_Trinary_Operator IDST ID_Continue IDC ID_Start IDS Ideographic Ideo Join_Control Join_C Logical_Order_Exception LOE Lowercase Lower Math Noncharacter_Code_Point NChar Pattern_Syntax Pat_Syn Pattern_White_Space Pat_WS Quotation_Mark QMark Radical Regional_Indicator RI Sentence_Terminal STerm Soft_Dotted SD Terminal_Punctuation Term Unified_Ideograph UIdeo Uppercase Upper Variation_Selector VS White_Space space XID_Continue XIDC XID_Start XIDS";
var ecma10BinaryProperties = ecma9BinaryProperties + " Extended_Pictographic";
var ecma11BinaryProperties = ecma10BinaryProperties;
var ecma12BinaryProperties = ecma11BinaryProperties + " EBase EComp EMod EPres ExtPict";
var ecma13BinaryProperties = ecma12BinaryProperties;
var ecma14BinaryProperties = ecma13BinaryProperties;
var unicodeBinaryProperties = {
  9: ecma9BinaryProperties,
  10: ecma10BinaryProperties,
  11: ecma11BinaryProperties,
  12: ecma12BinaryProperties,
  13: ecma13BinaryProperties,
  14: ecma14BinaryProperties
};
var ecma14BinaryPropertiesOfStrings = "Basic_Emoji Emoji_Keycap_Sequence RGI_Emoji_Modifier_Sequence RGI_Emoji_Flag_Sequence RGI_Emoji_Tag_Sequence RGI_Emoji_ZWJ_Sequence RGI_Emoji";
var unicodeBinaryPropertiesOfStrings = {
  9: "",
  10: "",
  11: "",
  12: "",
  13: "",
  14: ecma14BinaryPropertiesOfStrings
};
var unicodeGeneralCategoryValues = "Cased_Letter LC Close_Punctuation Pe Connector_Punctuation Pc Control Cc cntrl Currency_Symbol Sc Dash_Punctuation Pd Decimal_Number Nd digit Enclosing_Mark Me Final_Punctuation Pf Format Cf Initial_Punctuation Pi Letter L Letter_Number Nl Line_Separator Zl Lowercase_Letter Ll Mark M Combining_Mark Math_Symbol Sm Modifier_Letter Lm Modifier_Symbol Sk Nonspacing_Mark Mn Number N Open_Punctuation Ps Other C Other_Letter Lo Other_Number No Other_Punctuation Po Other_Symbol So Paragraph_Separator Zp Private_Use Co Punctuation P punct Separator Z Space_Separator Zs Spacing_Mark Mc Surrogate Cs Symbol S Titlecase_Letter Lt Unassigned Cn Uppercase_Letter Lu";
var ecma9ScriptValues = "Adlam Adlm Ahom Anatolian_Hieroglyphs Hluw Arabic Arab Armenian Armn Avestan Avst Balinese Bali Bamum Bamu Bassa_Vah Bass Batak Batk Bengali Beng Bhaiksuki Bhks Bopomofo Bopo Brahmi Brah Braille Brai Buginese Bugi Buhid Buhd Canadian_Aboriginal Cans Carian Cari Caucasian_Albanian Aghb Chakma Cakm Cham Cham Cherokee Cher Common Zyyy Coptic Copt Qaac Cuneiform Xsux Cypriot Cprt Cyrillic Cyrl Deseret Dsrt Devanagari Deva Duployan Dupl Egyptian_Hieroglyphs Egyp Elbasan Elba Ethiopic Ethi Georgian Geor Glagolitic Glag Gothic Goth Grantha Gran Greek Grek Gujarati Gujr Gurmukhi Guru Han Hani Hangul Hang Hanunoo Hano Hatran Hatr Hebrew Hebr Hiragana Hira Imperial_Aramaic Armi Inherited Zinh Qaai Inscriptional_Pahlavi Phli Inscriptional_Parthian Prti Javanese Java Kaithi Kthi Kannada Knda Katakana Kana Kayah_Li Kali Kharoshthi Khar Khmer Khmr Khojki Khoj Khudawadi Sind Lao Laoo Latin Latn Lepcha Lepc Limbu Limb Linear_A Lina Linear_B Linb Lisu Lisu Lycian Lyci Lydian Lydi Mahajani Mahj Malayalam Mlym Mandaic Mand Manichaean Mani Marchen Marc Masaram_Gondi Gonm Meetei_Mayek Mtei Mende_Kikakui Mend Meroitic_Cursive Merc Meroitic_Hieroglyphs Mero Miao Plrd Modi Mongolian Mong Mro Mroo Multani Mult Myanmar Mymr Nabataean Nbat New_Tai_Lue Talu Newa Newa Nko Nkoo Nushu Nshu Ogham Ogam Ol_Chiki Olck Old_Hungarian Hung Old_Italic Ital Old_North_Arabian Narb Old_Permic Perm Old_Persian Xpeo Old_South_Arabian Sarb Old_Turkic Orkh Oriya Orya Osage Osge Osmanya Osma Pahawh_Hmong Hmng Palmyrene Palm Pau_Cin_Hau Pauc Phags_Pa Phag Phoenician Phnx Psalter_Pahlavi Phlp Rejang Rjng Runic Runr Samaritan Samr Saurashtra Saur Sharada Shrd Shavian Shaw Siddham Sidd SignWriting Sgnw Sinhala Sinh Sora_Sompeng Sora Soyombo Soyo Sundanese Sund Syloti_Nagri Sylo Syriac Syrc Tagalog Tglg Tagbanwa Tagb Tai_Le Tale Tai_Tham Lana Tai_Viet Tavt Takri Takr Tamil Taml Tangut Tang Telugu Telu Thaana Thaa Thai Thai Tibetan Tibt Tifinagh Tfng Tirhuta Tirh Ugaritic Ugar Vai Vaii Warang_Citi Wara Yi Yiii Zanabazar_Square Zanb";
var ecma10ScriptValues = ecma9ScriptValues + " Dogra Dogr Gunjala_Gondi Gong Hanifi_Rohingya Rohg Makasar Maka Medefaidrin Medf Old_Sogdian Sogo Sogdian Sogd";
var ecma11ScriptValues = ecma10ScriptValues + " Elymaic Elym Nandinagari Nand Nyiakeng_Puachue_Hmong Hmnp Wancho Wcho";
var ecma12ScriptValues = ecma11ScriptValues + " Chorasmian Chrs Diak Dives_Akuru Khitan_Small_Script Kits Yezi Yezidi";
var ecma13ScriptValues = ecma12ScriptValues + " Cypro_Minoan Cpmn Old_Uyghur Ougr Tangsa Tnsa Toto Vithkuqi Vith";
var ecma14ScriptValues = ecma13ScriptValues + " " + scriptValuesAddedInUnicode;
var unicodeScriptValues = {
  9: ecma9ScriptValues,
  10: ecma10ScriptValues,
  11: ecma11ScriptValues,
  12: ecma12ScriptValues,
  13: ecma13ScriptValues,
  14: ecma14ScriptValues
};
var data = {};
function buildUnicodeData(ecmaVersion) {
  var d = data[ecmaVersion] = {
    binary: wordsRegexp(unicodeBinaryProperties[ecmaVersion] + " " + unicodeGeneralCategoryValues),
    binaryOfStrings: wordsRegexp(unicodeBinaryPropertiesOfStrings[ecmaVersion]),
    nonBinary: {
      General_Category: wordsRegexp(unicodeGeneralCategoryValues),
      Script: wordsRegexp(unicodeScriptValues[ecmaVersion])
    }
  };
  d.nonBinary.Script_Extensions = d.nonBinary.Script;
  d.nonBinary.gc = d.nonBinary.General_Category;
  d.nonBinary.sc = d.nonBinary.Script;
  d.nonBinary.scx = d.nonBinary.Script_Extensions;
}
for (i = 0, list = [9, 10, 11, 12, 13, 14]; i < list.length; i += 1) {
  ecmaVersion = list[i];
  buildUnicodeData(ecmaVersion);
}
var ecmaVersion;
var i;
var list;
var pp$1 = Parser.prototype;
var BranchID = function BranchID2(parent, base) {
  this.parent = parent;
  this.base = base || this;
};
BranchID.prototype.separatedFrom = function separatedFrom(alt) {
  for (var self = this; self; self = self.parent) {
    for (var other = alt; other; other = other.parent) {
      if (self.base === other.base && self !== other) {
        return true;
      }
    }
  }
  return false;
};
BranchID.prototype.sibling = function sibling() {
  return new BranchID(this.parent, this.base);
};
var RegExpValidationState = function RegExpValidationState2(parser) {
  this.parser = parser;
  this.validFlags = "gim" + (parser.options.ecmaVersion >= 6 ? "uy" : "") + (parser.options.ecmaVersion >= 9 ? "s" : "") + (parser.options.ecmaVersion >= 13 ? "d" : "") + (parser.options.ecmaVersion >= 15 ? "v" : "");
  this.unicodeProperties = data[parser.options.ecmaVersion >= 14 ? 14 : parser.options.ecmaVersion];
  this.source = "";
  this.flags = "";
  this.start = 0;
  this.switchU = false;
  this.switchV = false;
  this.switchN = false;
  this.pos = 0;
  this.lastIntValue = 0;
  this.lastStringValue = "";
  this.lastAssertionIsQuantifiable = false;
  this.numCapturingParens = 0;
  this.maxBackReference = 0;
  this.groupNames = /* @__PURE__ */ Object.create(null);
  this.backReferenceNames = [];
  this.branchID = null;
};
RegExpValidationState.prototype.reset = function reset(start, pattern, flags) {
  var unicodeSets = flags.indexOf("v") !== -1;
  var unicode = flags.indexOf("u") !== -1;
  this.start = start | 0;
  this.source = pattern + "";
  this.flags = flags;
  if (unicodeSets && this.parser.options.ecmaVersion >= 15) {
    this.switchU = true;
    this.switchV = true;
    this.switchN = true;
  } else {
    this.switchU = unicode && this.parser.options.ecmaVersion >= 6;
    this.switchV = false;
    this.switchN = unicode && this.parser.options.ecmaVersion >= 9;
  }
};
RegExpValidationState.prototype.raise = function raise(message) {
  this.parser.raiseRecoverable(this.start, "Invalid regular expression: /" + this.source + "/: " + message);
};
RegExpValidationState.prototype.at = function at(i, forceU) {
  if (forceU === void 0) forceU = false;
  var s = this.source;
  var l = s.length;
  if (i >= l) {
    return -1;
  }
  var c = s.charCodeAt(i);
  if (!(forceU || this.switchU) || c <= 55295 || c >= 57344 || i + 1 >= l) {
    return c;
  }
  var next = s.charCodeAt(i + 1);
  return next >= 56320 && next <= 57343 ? (c << 10) + next - 56613888 : c;
};
RegExpValidationState.prototype.nextIndex = function nextIndex(i, forceU) {
  if (forceU === void 0) forceU = false;
  var s = this.source;
  var l = s.length;
  if (i >= l) {
    return l;
  }
  var c = s.charCodeAt(i), next;
  if (!(forceU || this.switchU) || c <= 55295 || c >= 57344 || i + 1 >= l || (next = s.charCodeAt(i + 1)) < 56320 || next > 57343) {
    return i + 1;
  }
  return i + 2;
};
RegExpValidationState.prototype.current = function current(forceU) {
  if (forceU === void 0) forceU = false;
  return this.at(this.pos, forceU);
};
RegExpValidationState.prototype.lookahead = function lookahead(forceU) {
  if (forceU === void 0) forceU = false;
  return this.at(this.nextIndex(this.pos, forceU), forceU);
};
RegExpValidationState.prototype.advance = function advance(forceU) {
  if (forceU === void 0) forceU = false;
  this.pos = this.nextIndex(this.pos, forceU);
};
RegExpValidationState.prototype.eat = function eat(ch, forceU) {
  if (forceU === void 0) forceU = false;
  if (this.current(forceU) === ch) {
    this.advance(forceU);
    return true;
  }
  return false;
};
RegExpValidationState.prototype.eatChars = function eatChars(chs, forceU) {
  if (forceU === void 0) forceU = false;
  var pos = this.pos;
  for (var i = 0, list = chs; i < list.length; i += 1) {
    var ch = list[i];
    var current2 = this.at(pos, forceU);
    if (current2 === -1 || current2 !== ch) {
      return false;
    }
    pos = this.nextIndex(pos, forceU);
  }
  this.pos = pos;
  return true;
};
pp$1.validateRegExpFlags = function(state) {
  var validFlags = state.validFlags;
  var flags = state.flags;
  var u = false;
  var v = false;
  for (var i = 0; i < flags.length; i++) {
    var flag = flags.charAt(i);
    if (validFlags.indexOf(flag) === -1) {
      this.raise(state.start, "Invalid regular expression flag");
    }
    if (flags.indexOf(flag, i + 1) > -1) {
      this.raise(state.start, "Duplicate regular expression flag");
    }
    if (flag === "u") {
      u = true;
    }
    if (flag === "v") {
      v = true;
    }
  }
  if (this.options.ecmaVersion >= 15 && u && v) {
    this.raise(state.start, "Invalid regular expression flag");
  }
};
function hasProp(obj) {
  for (var _ in obj) {
    return true;
  }
  return false;
}
pp$1.validateRegExpPattern = function(state) {
  this.regexp_pattern(state);
  if (!state.switchN && this.options.ecmaVersion >= 9 && hasProp(state.groupNames)) {
    state.switchN = true;
    this.regexp_pattern(state);
  }
};
pp$1.regexp_pattern = function(state) {
  state.pos = 0;
  state.lastIntValue = 0;
  state.lastStringValue = "";
  state.lastAssertionIsQuantifiable = false;
  state.numCapturingParens = 0;
  state.maxBackReference = 0;
  state.groupNames = /* @__PURE__ */ Object.create(null);
  state.backReferenceNames.length = 0;
  state.branchID = null;
  this.regexp_disjunction(state);
  if (state.pos !== state.source.length) {
    if (state.eat(
      41
      /* ) */
    )) {
      state.raise("Unmatched ')'");
    }
    if (state.eat(
      93
      /* ] */
    ) || state.eat(
      125
      /* } */
    )) {
      state.raise("Lone quantifier brackets");
    }
  }
  if (state.maxBackReference > state.numCapturingParens) {
    state.raise("Invalid escape");
  }
  for (var i = 0, list = state.backReferenceNames; i < list.length; i += 1) {
    var name = list[i];
    if (!state.groupNames[name]) {
      state.raise("Invalid named capture referenced");
    }
  }
};
pp$1.regexp_disjunction = function(state) {
  var trackDisjunction = this.options.ecmaVersion >= 16;
  if (trackDisjunction) {
    state.branchID = new BranchID(state.branchID, null);
  }
  this.regexp_alternative(state);
  while (state.eat(
    124
    /* | */
  )) {
    if (trackDisjunction) {
      state.branchID = state.branchID.sibling();
    }
    this.regexp_alternative(state);
  }
  if (trackDisjunction) {
    state.branchID = state.branchID.parent;
  }
  if (this.regexp_eatQuantifier(state, true)) {
    state.raise("Nothing to repeat");
  }
  if (state.eat(
    123
    /* { */
  )) {
    state.raise("Lone quantifier brackets");
  }
};
pp$1.regexp_alternative = function(state) {
  while (state.pos < state.source.length && this.regexp_eatTerm(state)) {
  }
};
pp$1.regexp_eatTerm = function(state) {
  if (this.regexp_eatAssertion(state)) {
    if (state.lastAssertionIsQuantifiable && this.regexp_eatQuantifier(state)) {
      if (state.switchU) {
        state.raise("Invalid quantifier");
      }
    }
    return true;
  }
  if (state.switchU ? this.regexp_eatAtom(state) : this.regexp_eatExtendedAtom(state)) {
    this.regexp_eatQuantifier(state);
    return true;
  }
  return false;
};
pp$1.regexp_eatAssertion = function(state) {
  var start = state.pos;
  state.lastAssertionIsQuantifiable = false;
  if (state.eat(
    94
    /* ^ */
  ) || state.eat(
    36
    /* $ */
  )) {
    return true;
  }
  if (state.eat(
    92
    /* \ */
  )) {
    if (state.eat(
      66
      /* B */
    ) || state.eat(
      98
      /* b */
    )) {
      return true;
    }
    state.pos = start;
  }
  if (state.eat(
    40
    /* ( */
  ) && state.eat(
    63
    /* ? */
  )) {
    var lookbehind = false;
    if (this.options.ecmaVersion >= 9) {
      lookbehind = state.eat(
        60
        /* < */
      );
    }
    if (state.eat(
      61
      /* = */
    ) || state.eat(
      33
      /* ! */
    )) {
      this.regexp_disjunction(state);
      if (!state.eat(
        41
        /* ) */
      )) {
        state.raise("Unterminated group");
      }
      state.lastAssertionIsQuantifiable = !lookbehind;
      return true;
    }
  }
  state.pos = start;
  return false;
};
pp$1.regexp_eatQuantifier = function(state, noError) {
  if (noError === void 0) noError = false;
  if (this.regexp_eatQuantifierPrefix(state, noError)) {
    state.eat(
      63
      /* ? */
    );
    return true;
  }
  return false;
};
pp$1.regexp_eatQuantifierPrefix = function(state, noError) {
  return state.eat(
    42
    /* * */
  ) || state.eat(
    43
    /* + */
  ) || state.eat(
    63
    /* ? */
  ) || this.regexp_eatBracedQuantifier(state, noError);
};
pp$1.regexp_eatBracedQuantifier = function(state, noError) {
  var start = state.pos;
  if (state.eat(
    123
    /* { */
  )) {
    var min = 0, max = -1;
    if (this.regexp_eatDecimalDigits(state)) {
      min = state.lastIntValue;
      if (state.eat(
        44
        /* , */
      ) && this.regexp_eatDecimalDigits(state)) {
        max = state.lastIntValue;
      }
      if (state.eat(
        125
        /* } */
      )) {
        if (max !== -1 && max < min && !noError) {
          state.raise("numbers out of order in {} quantifier");
        }
        return true;
      }
    }
    if (state.switchU && !noError) {
      state.raise("Incomplete quantifier");
    }
    state.pos = start;
  }
  return false;
};
pp$1.regexp_eatAtom = function(state) {
  return this.regexp_eatPatternCharacters(state) || state.eat(
    46
    /* . */
  ) || this.regexp_eatReverseSolidusAtomEscape(state) || this.regexp_eatCharacterClass(state) || this.regexp_eatUncapturingGroup(state) || this.regexp_eatCapturingGroup(state);
};
pp$1.regexp_eatReverseSolidusAtomEscape = function(state) {
  var start = state.pos;
  if (state.eat(
    92
    /* \ */
  )) {
    if (this.regexp_eatAtomEscape(state)) {
      return true;
    }
    state.pos = start;
  }
  return false;
};
pp$1.regexp_eatUncapturingGroup = function(state) {
  var start = state.pos;
  if (state.eat(
    40
    /* ( */
  )) {
    if (state.eat(
      63
      /* ? */
    )) {
      if (this.options.ecmaVersion >= 16) {
        var addModifiers = this.regexp_eatModifiers(state);
        var hasHyphen = state.eat(
          45
          /* - */
        );
        if (addModifiers || hasHyphen) {
          for (var i = 0; i < addModifiers.length; i++) {
            var modifier = addModifiers.charAt(i);
            if (addModifiers.indexOf(modifier, i + 1) > -1) {
              state.raise("Duplicate regular expression modifiers");
            }
          }
          if (hasHyphen) {
            var removeModifiers = this.regexp_eatModifiers(state);
            if (!addModifiers && !removeModifiers && state.current() === 58) {
              state.raise("Invalid regular expression modifiers");
            }
            for (var i$1 = 0; i$1 < removeModifiers.length; i$1++) {
              var modifier$1 = removeModifiers.charAt(i$1);
              if (removeModifiers.indexOf(modifier$1, i$1 + 1) > -1 || addModifiers.indexOf(modifier$1) > -1) {
                state.raise("Duplicate regular expression modifiers");
              }
            }
          }
        }
      }
      if (state.eat(
        58
        /* : */
      )) {
        this.regexp_disjunction(state);
        if (state.eat(
          41
          /* ) */
        )) {
          return true;
        }
        state.raise("Unterminated group");
      }
    }
    state.pos = start;
  }
  return false;
};
pp$1.regexp_eatCapturingGroup = function(state) {
  if (state.eat(
    40
    /* ( */
  )) {
    if (this.options.ecmaVersion >= 9) {
      this.regexp_groupSpecifier(state);
    } else if (state.current() === 63) {
      state.raise("Invalid group");
    }
    this.regexp_disjunction(state);
    if (state.eat(
      41
      /* ) */
    )) {
      state.numCapturingParens += 1;
      return true;
    }
    state.raise("Unterminated group");
  }
  return false;
};
pp$1.regexp_eatModifiers = function(state) {
  var modifiers = "";
  var ch = 0;
  while ((ch = state.current()) !== -1 && isRegularExpressionModifier(ch)) {
    modifiers += codePointToString(ch);
    state.advance();
  }
  return modifiers;
};
function isRegularExpressionModifier(ch) {
  return ch === 105 || ch === 109 || ch === 115;
}
pp$1.regexp_eatExtendedAtom = function(state) {
  return state.eat(
    46
    /* . */
  ) || this.regexp_eatReverseSolidusAtomEscape(state) || this.regexp_eatCharacterClass(state) || this.regexp_eatUncapturingGroup(state) || this.regexp_eatCapturingGroup(state) || this.regexp_eatInvalidBracedQuantifier(state) || this.regexp_eatExtendedPatternCharacter(state);
};
pp$1.regexp_eatInvalidBracedQuantifier = function(state) {
  if (this.regexp_eatBracedQuantifier(state, true)) {
    state.raise("Nothing to repeat");
  }
  return false;
};
pp$1.regexp_eatSyntaxCharacter = function(state) {
  var ch = state.current();
  if (isSyntaxCharacter(ch)) {
    state.lastIntValue = ch;
    state.advance();
    return true;
  }
  return false;
};
function isSyntaxCharacter(ch) {
  return ch === 36 || ch >= 40 && ch <= 43 || ch === 46 || ch === 63 || ch >= 91 && ch <= 94 || ch >= 123 && ch <= 125;
}
pp$1.regexp_eatPatternCharacters = function(state) {
  var start = state.pos;
  var ch = 0;
  while ((ch = state.current()) !== -1 && !isSyntaxCharacter(ch)) {
    state.advance();
  }
  return state.pos !== start;
};
pp$1.regexp_eatExtendedPatternCharacter = function(state) {
  var ch = state.current();
  if (ch !== -1 && ch !== 36 && !(ch >= 40 && ch <= 43) && ch !== 46 && ch !== 63 && ch !== 91 && ch !== 94 && ch !== 124) {
    state.advance();
    return true;
  }
  return false;
};
pp$1.regexp_groupSpecifier = function(state) {
  if (state.eat(
    63
    /* ? */
  )) {
    if (!this.regexp_eatGroupName(state)) {
      state.raise("Invalid group");
    }
    var trackDisjunction = this.options.ecmaVersion >= 16;
    var known = state.groupNames[state.lastStringValue];
    if (known) {
      if (trackDisjunction) {
        for (var i = 0, list = known; i < list.length; i += 1) {
          var altID = list[i];
          if (!altID.separatedFrom(state.branchID)) {
            state.raise("Duplicate capture group name");
          }
        }
      } else {
        state.raise("Duplicate capture group name");
      }
    }
    if (trackDisjunction) {
      (known || (state.groupNames[state.lastStringValue] = [])).push(state.branchID);
    } else {
      state.groupNames[state.lastStringValue] = true;
    }
  }
};
pp$1.regexp_eatGroupName = function(state) {
  state.lastStringValue = "";
  if (state.eat(
    60
    /* < */
  )) {
    if (this.regexp_eatRegExpIdentifierName(state) && state.eat(
      62
      /* > */
    )) {
      return true;
    }
    state.raise("Invalid capture group name");
  }
  return false;
};
pp$1.regexp_eatRegExpIdentifierName = function(state) {
  state.lastStringValue = "";
  if (this.regexp_eatRegExpIdentifierStart(state)) {
    state.lastStringValue += codePointToString(state.lastIntValue);
    while (this.regexp_eatRegExpIdentifierPart(state)) {
      state.lastStringValue += codePointToString(state.lastIntValue);
    }
    return true;
  }
  return false;
};
pp$1.regexp_eatRegExpIdentifierStart = function(state) {
  var start = state.pos;
  var forceU = this.options.ecmaVersion >= 11;
  var ch = state.current(forceU);
  state.advance(forceU);
  if (ch === 92 && this.regexp_eatRegExpUnicodeEscapeSequence(state, forceU)) {
    ch = state.lastIntValue;
  }
  if (isRegExpIdentifierStart(ch)) {
    state.lastIntValue = ch;
    return true;
  }
  state.pos = start;
  return false;
};
function isRegExpIdentifierStart(ch) {
  return isIdentifierStart(ch, true) || ch === 36 || ch === 95;
}
pp$1.regexp_eatRegExpIdentifierPart = function(state) {
  var start = state.pos;
  var forceU = this.options.ecmaVersion >= 11;
  var ch = state.current(forceU);
  state.advance(forceU);
  if (ch === 92 && this.regexp_eatRegExpUnicodeEscapeSequence(state, forceU)) {
    ch = state.lastIntValue;
  }
  if (isRegExpIdentifierPart(ch)) {
    state.lastIntValue = ch;
    return true;
  }
  state.pos = start;
  return false;
};
function isRegExpIdentifierPart(ch) {
  return isIdentifierChar(ch, true) || ch === 36 || ch === 95 || ch === 8204 || ch === 8205;
}
pp$1.regexp_eatAtomEscape = function(state) {
  if (this.regexp_eatBackReference(state) || this.regexp_eatCharacterClassEscape(state) || this.regexp_eatCharacterEscape(state) || state.switchN && this.regexp_eatKGroupName(state)) {
    return true;
  }
  if (state.switchU) {
    if (state.current() === 99) {
      state.raise("Invalid unicode escape");
    }
    state.raise("Invalid escape");
  }
  return false;
};
pp$1.regexp_eatBackReference = function(state) {
  var start = state.pos;
  if (this.regexp_eatDecimalEscape(state)) {
    var n = state.lastIntValue;
    if (state.switchU) {
      if (n > state.maxBackReference) {
        state.maxBackReference = n;
      }
      return true;
    }
    if (n <= state.numCapturingParens) {
      return true;
    }
    state.pos = start;
  }
  return false;
};
pp$1.regexp_eatKGroupName = function(state) {
  if (state.eat(
    107
    /* k */
  )) {
    if (this.regexp_eatGroupName(state)) {
      state.backReferenceNames.push(state.lastStringValue);
      return true;
    }
    state.raise("Invalid named reference");
  }
  return false;
};
pp$1.regexp_eatCharacterEscape = function(state) {
  return this.regexp_eatControlEscape(state) || this.regexp_eatCControlLetter(state) || this.regexp_eatZero(state) || this.regexp_eatHexEscapeSequence(state) || this.regexp_eatRegExpUnicodeEscapeSequence(state, false) || !state.switchU && this.regexp_eatLegacyOctalEscapeSequence(state) || this.regexp_eatIdentityEscape(state);
};
pp$1.regexp_eatCControlLetter = function(state) {
  var start = state.pos;
  if (state.eat(
    99
    /* c */
  )) {
    if (this.regexp_eatControlLetter(state)) {
      return true;
    }
    state.pos = start;
  }
  return false;
};
pp$1.regexp_eatZero = function(state) {
  if (state.current() === 48 && !isDecimalDigit(state.lookahead())) {
    state.lastIntValue = 0;
    state.advance();
    return true;
  }
  return false;
};
pp$1.regexp_eatControlEscape = function(state) {
  var ch = state.current();
  if (ch === 116) {
    state.lastIntValue = 9;
    state.advance();
    return true;
  }
  if (ch === 110) {
    state.lastIntValue = 10;
    state.advance();
    return true;
  }
  if (ch === 118) {
    state.lastIntValue = 11;
    state.advance();
    return true;
  }
  if (ch === 102) {
    state.lastIntValue = 12;
    state.advance();
    return true;
  }
  if (ch === 114) {
    state.lastIntValue = 13;
    state.advance();
    return true;
  }
  return false;
};
pp$1.regexp_eatControlLetter = function(state) {
  var ch = state.current();
  if (isControlLetter(ch)) {
    state.lastIntValue = ch % 32;
    state.advance();
    return true;
  }
  return false;
};
function isControlLetter(ch) {
  return ch >= 65 && ch <= 90 || ch >= 97 && ch <= 122;
}
pp$1.regexp_eatRegExpUnicodeEscapeSequence = function(state, forceU) {
  if (forceU === void 0) forceU = false;
  var start = state.pos;
  var switchU = forceU || state.switchU;
  if (state.eat(
    117
    /* u */
  )) {
    if (this.regexp_eatFixedHexDigits(state, 4)) {
      var lead = state.lastIntValue;
      if (switchU && lead >= 55296 && lead <= 56319) {
        var leadSurrogateEnd = state.pos;
        if (state.eat(
          92
          /* \ */
        ) && state.eat(
          117
          /* u */
        ) && this.regexp_eatFixedHexDigits(state, 4)) {
          var trail = state.lastIntValue;
          if (trail >= 56320 && trail <= 57343) {
            state.lastIntValue = (lead - 55296) * 1024 + (trail - 56320) + 65536;
            return true;
          }
        }
        state.pos = leadSurrogateEnd;
        state.lastIntValue = lead;
      }
      return true;
    }
    if (switchU && state.eat(
      123
      /* { */
    ) && this.regexp_eatHexDigits(state) && state.eat(
      125
      /* } */
    ) && isValidUnicode(state.lastIntValue)) {
      return true;
    }
    if (switchU) {
      state.raise("Invalid unicode escape");
    }
    state.pos = start;
  }
  return false;
};
function isValidUnicode(ch) {
  return ch >= 0 && ch <= 1114111;
}
pp$1.regexp_eatIdentityEscape = function(state) {
  if (state.switchU) {
    if (this.regexp_eatSyntaxCharacter(state)) {
      return true;
    }
    if (state.eat(
      47
      /* / */
    )) {
      state.lastIntValue = 47;
      return true;
    }
    return false;
  }
  var ch = state.current();
  if (ch !== 99 && (!state.switchN || ch !== 107)) {
    state.lastIntValue = ch;
    state.advance();
    return true;
  }
  return false;
};
pp$1.regexp_eatDecimalEscape = function(state) {
  state.lastIntValue = 0;
  var ch = state.current();
  if (ch >= 49 && ch <= 57) {
    do {
      state.lastIntValue = 10 * state.lastIntValue + (ch - 48);
      state.advance();
    } while ((ch = state.current()) >= 48 && ch <= 57);
    return true;
  }
  return false;
};
var CharSetNone = 0;
var CharSetOk = 1;
var CharSetString = 2;
pp$1.regexp_eatCharacterClassEscape = function(state) {
  var ch = state.current();
  if (isCharacterClassEscape(ch)) {
    state.lastIntValue = -1;
    state.advance();
    return CharSetOk;
  }
  var negate = false;
  if (state.switchU && this.options.ecmaVersion >= 9 && ((negate = ch === 80) || ch === 112)) {
    state.lastIntValue = -1;
    state.advance();
    var result;
    if (state.eat(
      123
      /* { */
    ) && (result = this.regexp_eatUnicodePropertyValueExpression(state)) && state.eat(
      125
      /* } */
    )) {
      if (negate && result === CharSetString) {
        state.raise("Invalid property name");
      }
      return result;
    }
    state.raise("Invalid property name");
  }
  return CharSetNone;
};
function isCharacterClassEscape(ch) {
  return ch === 100 || ch === 68 || ch === 115 || ch === 83 || ch === 119 || ch === 87;
}
pp$1.regexp_eatUnicodePropertyValueExpression = function(state) {
  var start = state.pos;
  if (this.regexp_eatUnicodePropertyName(state) && state.eat(
    61
    /* = */
  )) {
    var name = state.lastStringValue;
    if (this.regexp_eatUnicodePropertyValue(state)) {
      var value = state.lastStringValue;
      this.regexp_validateUnicodePropertyNameAndValue(state, name, value);
      return CharSetOk;
    }
  }
  state.pos = start;
  if (this.regexp_eatLoneUnicodePropertyNameOrValue(state)) {
    var nameOrValue = state.lastStringValue;
    return this.regexp_validateUnicodePropertyNameOrValue(state, nameOrValue);
  }
  return CharSetNone;
};
pp$1.regexp_validateUnicodePropertyNameAndValue = function(state, name, value) {
  if (!hasOwn(state.unicodeProperties.nonBinary, name)) {
    state.raise("Invalid property name");
  }
  if (!state.unicodeProperties.nonBinary[name].test(value)) {
    state.raise("Invalid property value");
  }
};
pp$1.regexp_validateUnicodePropertyNameOrValue = function(state, nameOrValue) {
  if (state.unicodeProperties.binary.test(nameOrValue)) {
    return CharSetOk;
  }
  if (state.switchV && state.unicodeProperties.binaryOfStrings.test(nameOrValue)) {
    return CharSetString;
  }
  state.raise("Invalid property name");
};
pp$1.regexp_eatUnicodePropertyName = function(state) {
  var ch = 0;
  state.lastStringValue = "";
  while (isUnicodePropertyNameCharacter(ch = state.current())) {
    state.lastStringValue += codePointToString(ch);
    state.advance();
  }
  return state.lastStringValue !== "";
};
function isUnicodePropertyNameCharacter(ch) {
  return isControlLetter(ch) || ch === 95;
}
pp$1.regexp_eatUnicodePropertyValue = function(state) {
  var ch = 0;
  state.lastStringValue = "";
  while (isUnicodePropertyValueCharacter(ch = state.current())) {
    state.lastStringValue += codePointToString(ch);
    state.advance();
  }
  return state.lastStringValue !== "";
};
function isUnicodePropertyValueCharacter(ch) {
  return isUnicodePropertyNameCharacter(ch) || isDecimalDigit(ch);
}
pp$1.regexp_eatLoneUnicodePropertyNameOrValue = function(state) {
  return this.regexp_eatUnicodePropertyValue(state);
};
pp$1.regexp_eatCharacterClass = function(state) {
  if (state.eat(
    91
    /* [ */
  )) {
    var negate = state.eat(
      94
      /* ^ */
    );
    var result = this.regexp_classContents(state);
    if (!state.eat(
      93
      /* ] */
    )) {
      state.raise("Unterminated character class");
    }
    if (negate && result === CharSetString) {
      state.raise("Negated character class may contain strings");
    }
    return true;
  }
  return false;
};
pp$1.regexp_classContents = function(state) {
  if (state.current() === 93) {
    return CharSetOk;
  }
  if (state.switchV) {
    return this.regexp_classSetExpression(state);
  }
  this.regexp_nonEmptyClassRanges(state);
  return CharSetOk;
};
pp$1.regexp_nonEmptyClassRanges = function(state) {
  while (this.regexp_eatClassAtom(state)) {
    var left = state.lastIntValue;
    if (state.eat(
      45
      /* - */
    ) && this.regexp_eatClassAtom(state)) {
      var right = state.lastIntValue;
      if (state.switchU && (left === -1 || right === -1)) {
        state.raise("Invalid character class");
      }
      if (left !== -1 && right !== -1 && left > right) {
        state.raise("Range out of order in character class");
      }
    }
  }
};
pp$1.regexp_eatClassAtom = function(state) {
  var start = state.pos;
  if (state.eat(
    92
    /* \ */
  )) {
    if (this.regexp_eatClassEscape(state)) {
      return true;
    }
    if (state.switchU) {
      var ch$1 = state.current();
      if (ch$1 === 99 || isOctalDigit(ch$1)) {
        state.raise("Invalid class escape");
      }
      state.raise("Invalid escape");
    }
    state.pos = start;
  }
  var ch = state.current();
  if (ch !== 93) {
    state.lastIntValue = ch;
    state.advance();
    return true;
  }
  return false;
};
pp$1.regexp_eatClassEscape = function(state) {
  var start = state.pos;
  if (state.eat(
    98
    /* b */
  )) {
    state.lastIntValue = 8;
    return true;
  }
  if (state.switchU && state.eat(
    45
    /* - */
  )) {
    state.lastIntValue = 45;
    return true;
  }
  if (!state.switchU && state.eat(
    99
    /* c */
  )) {
    if (this.regexp_eatClassControlLetter(state)) {
      return true;
    }
    state.pos = start;
  }
  return this.regexp_eatCharacterClassEscape(state) || this.regexp_eatCharacterEscape(state);
};
pp$1.regexp_classSetExpression = function(state) {
  var result = CharSetOk, subResult;
  if (this.regexp_eatClassSetRange(state)) ;
  else if (subResult = this.regexp_eatClassSetOperand(state)) {
    if (subResult === CharSetString) {
      result = CharSetString;
    }
    var start = state.pos;
    while (state.eatChars(
      [38, 38]
      /* && */
    )) {
      if (state.current() !== 38 && (subResult = this.regexp_eatClassSetOperand(state))) {
        if (subResult !== CharSetString) {
          result = CharSetOk;
        }
        continue;
      }
      state.raise("Invalid character in character class");
    }
    if (start !== state.pos) {
      return result;
    }
    while (state.eatChars(
      [45, 45]
      /* -- */
    )) {
      if (this.regexp_eatClassSetOperand(state)) {
        continue;
      }
      state.raise("Invalid character in character class");
    }
    if (start !== state.pos) {
      return result;
    }
  } else {
    state.raise("Invalid character in character class");
  }
  for (; ; ) {
    if (this.regexp_eatClassSetRange(state)) {
      continue;
    }
    subResult = this.regexp_eatClassSetOperand(state);
    if (!subResult) {
      return result;
    }
    if (subResult === CharSetString) {
      result = CharSetString;
    }
  }
};
pp$1.regexp_eatClassSetRange = function(state) {
  var start = state.pos;
  if (this.regexp_eatClassSetCharacter(state)) {
    var left = state.lastIntValue;
    if (state.eat(
      45
      /* - */
    ) && this.regexp_eatClassSetCharacter(state)) {
      var right = state.lastIntValue;
      if (left !== -1 && right !== -1 && left > right) {
        state.raise("Range out of order in character class");
      }
      return true;
    }
    state.pos = start;
  }
  return false;
};
pp$1.regexp_eatClassSetOperand = function(state) {
  if (this.regexp_eatClassSetCharacter(state)) {
    return CharSetOk;
  }
  return this.regexp_eatClassStringDisjunction(state) || this.regexp_eatNestedClass(state);
};
pp$1.regexp_eatNestedClass = function(state) {
  var start = state.pos;
  if (state.eat(
    91
    /* [ */
  )) {
    var negate = state.eat(
      94
      /* ^ */
    );
    var result = this.regexp_classContents(state);
    if (state.eat(
      93
      /* ] */
    )) {
      if (negate && result === CharSetString) {
        state.raise("Negated character class may contain strings");
      }
      return result;
    }
    state.pos = start;
  }
  if (state.eat(
    92
    /* \ */
  )) {
    var result$1 = this.regexp_eatCharacterClassEscape(state);
    if (result$1) {
      return result$1;
    }
    state.pos = start;
  }
  return null;
};
pp$1.regexp_eatClassStringDisjunction = function(state) {
  var start = state.pos;
  if (state.eatChars(
    [92, 113]
    /* \q */
  )) {
    if (state.eat(
      123
      /* { */
    )) {
      var result = this.regexp_classStringDisjunctionContents(state);
      if (state.eat(
        125
        /* } */
      )) {
        return result;
      }
    } else {
      state.raise("Invalid escape");
    }
    state.pos = start;
  }
  return null;
};
pp$1.regexp_classStringDisjunctionContents = function(state) {
  var result = this.regexp_classString(state);
  while (state.eat(
    124
    /* | */
  )) {
    if (this.regexp_classString(state) === CharSetString) {
      result = CharSetString;
    }
  }
  return result;
};
pp$1.regexp_classString = function(state) {
  var count = 0;
  while (this.regexp_eatClassSetCharacter(state)) {
    count++;
  }
  return count === 1 ? CharSetOk : CharSetString;
};
pp$1.regexp_eatClassSetCharacter = function(state) {
  var start = state.pos;
  if (state.eat(
    92
    /* \ */
  )) {
    if (this.regexp_eatCharacterEscape(state) || this.regexp_eatClassSetReservedPunctuator(state)) {
      return true;
    }
    if (state.eat(
      98
      /* b */
    )) {
      state.lastIntValue = 8;
      return true;
    }
    state.pos = start;
    return false;
  }
  var ch = state.current();
  if (ch < 0 || ch === state.lookahead() && isClassSetReservedDoublePunctuatorCharacter(ch)) {
    return false;
  }
  if (isClassSetSyntaxCharacter(ch)) {
    return false;
  }
  state.advance();
  state.lastIntValue = ch;
  return true;
};
function isClassSetReservedDoublePunctuatorCharacter(ch) {
  return ch === 33 || ch >= 35 && ch <= 38 || ch >= 42 && ch <= 44 || ch === 46 || ch >= 58 && ch <= 64 || ch === 94 || ch === 96 || ch === 126;
}
function isClassSetSyntaxCharacter(ch) {
  return ch === 40 || ch === 41 || ch === 45 || ch === 47 || ch >= 91 && ch <= 93 || ch >= 123 && ch <= 125;
}
pp$1.regexp_eatClassSetReservedPunctuator = function(state) {
  var ch = state.current();
  if (isClassSetReservedPunctuator(ch)) {
    state.lastIntValue = ch;
    state.advance();
    return true;
  }
  return false;
};
function isClassSetReservedPunctuator(ch) {
  return ch === 33 || ch === 35 || ch === 37 || ch === 38 || ch === 44 || ch === 45 || ch >= 58 && ch <= 62 || ch === 64 || ch === 96 || ch === 126;
}
pp$1.regexp_eatClassControlLetter = function(state) {
  var ch = state.current();
  if (isDecimalDigit(ch) || ch === 95) {
    state.lastIntValue = ch % 32;
    state.advance();
    return true;
  }
  return false;
};
pp$1.regexp_eatHexEscapeSequence = function(state) {
  var start = state.pos;
  if (state.eat(
    120
    /* x */
  )) {
    if (this.regexp_eatFixedHexDigits(state, 2)) {
      return true;
    }
    if (state.switchU) {
      state.raise("Invalid escape");
    }
    state.pos = start;
  }
  return false;
};
pp$1.regexp_eatDecimalDigits = function(state) {
  var start = state.pos;
  var ch = 0;
  state.lastIntValue = 0;
  while (isDecimalDigit(ch = state.current())) {
    state.lastIntValue = 10 * state.lastIntValue + (ch - 48);
    state.advance();
  }
  return state.pos !== start;
};
function isDecimalDigit(ch) {
  return ch >= 48 && ch <= 57;
}
pp$1.regexp_eatHexDigits = function(state) {
  var start = state.pos;
  var ch = 0;
  state.lastIntValue = 0;
  while (isHexDigit(ch = state.current())) {
    state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
    state.advance();
  }
  return state.pos !== start;
};
function isHexDigit(ch) {
  return ch >= 48 && ch <= 57 || ch >= 65 && ch <= 70 || ch >= 97 && ch <= 102;
}
function hexToInt(ch) {
  if (ch >= 65 && ch <= 70) {
    return 10 + (ch - 65);
  }
  if (ch >= 97 && ch <= 102) {
    return 10 + (ch - 97);
  }
  return ch - 48;
}
pp$1.regexp_eatLegacyOctalEscapeSequence = function(state) {
  if (this.regexp_eatOctalDigit(state)) {
    var n1 = state.lastIntValue;
    if (this.regexp_eatOctalDigit(state)) {
      var n2 = state.lastIntValue;
      if (n1 <= 3 && this.regexp_eatOctalDigit(state)) {
        state.lastIntValue = n1 * 64 + n2 * 8 + state.lastIntValue;
      } else {
        state.lastIntValue = n1 * 8 + n2;
      }
    } else {
      state.lastIntValue = n1;
    }
    return true;
  }
  return false;
};
pp$1.regexp_eatOctalDigit = function(state) {
  var ch = state.current();
  if (isOctalDigit(ch)) {
    state.lastIntValue = ch - 48;
    state.advance();
    return true;
  }
  state.lastIntValue = 0;
  return false;
};
function isOctalDigit(ch) {
  return ch >= 48 && ch <= 55;
}
pp$1.regexp_eatFixedHexDigits = function(state, length) {
  var start = state.pos;
  state.lastIntValue = 0;
  for (var i = 0; i < length; ++i) {
    var ch = state.current();
    if (!isHexDigit(ch)) {
      state.pos = start;
      return false;
    }
    state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
    state.advance();
  }
  return true;
};
var Token = function Token2(p) {
  this.type = p.type;
  this.value = p.value;
  this.start = p.start;
  this.end = p.end;
  if (p.options.locations) {
    this.loc = new SourceLocation(p, p.startLoc, p.endLoc);
  }
  if (p.options.ranges) {
    this.range = [p.start, p.end];
  }
};
var pp = Parser.prototype;
pp.next = function(ignoreEscapeSequenceInKeyword) {
  if (!ignoreEscapeSequenceInKeyword && this.type.keyword && this.containsEsc) {
    this.raiseRecoverable(this.start, "Escape sequence in keyword " + this.type.keyword);
  }
  if (this.options.onToken) {
    this.options.onToken(new Token(this));
  }
  this.lastTokEnd = this.end;
  this.lastTokStart = this.start;
  this.lastTokEndLoc = this.endLoc;
  this.lastTokStartLoc = this.startLoc;
  this.nextToken();
};
pp.getToken = function() {
  this.next();
  return new Token(this);
};
if (typeof Symbol !== "undefined") {
  pp[Symbol.iterator] = function() {
    var this$1$1 = this;
    return {
      next: function() {
        var token = this$1$1.getToken();
        return {
          done: token.type === types$1.eof,
          value: token
        };
      }
    };
  };
}
pp.nextToken = function() {
  var curContext = this.curContext();
  if (!curContext || !curContext.preserveSpace) {
    this.skipSpace();
  }
  this.start = this.pos;
  if (this.options.locations) {
    this.startLoc = this.curPosition();
  }
  if (this.pos >= this.input.length) {
    return this.finishToken(types$1.eof);
  }
  if (curContext.override) {
    return curContext.override(this);
  } else {
    this.readToken(this.fullCharCodeAtPos());
  }
};
pp.readToken = function(code) {
  if (isIdentifierStart(code, this.options.ecmaVersion >= 6) || code === 92) {
    return this.readWord();
  }
  return this.getTokenFromCode(code);
};
pp.fullCharCodeAtPos = function() {
  var code = this.input.charCodeAt(this.pos);
  if (code <= 55295 || code >= 56320) {
    return code;
  }
  var next = this.input.charCodeAt(this.pos + 1);
  return next <= 56319 || next >= 57344 ? code : (code << 10) + next - 56613888;
};
pp.skipBlockComment = function() {
  var startLoc = this.options.onComment && this.curPosition();
  var start = this.pos, end = this.input.indexOf("*/", this.pos += 2);
  if (end === -1) {
    this.raise(this.pos - 2, "Unterminated comment");
  }
  this.pos = end + 2;
  if (this.options.locations) {
    for (var nextBreak = void 0, pos = start; (nextBreak = nextLineBreak(this.input, pos, this.pos)) > -1; ) {
      ++this.curLine;
      pos = this.lineStart = nextBreak;
    }
  }
  if (this.options.onComment) {
    this.options.onComment(
      true,
      this.input.slice(start + 2, end),
      start,
      this.pos,
      startLoc,
      this.curPosition()
    );
  }
};
pp.skipLineComment = function(startSkip) {
  var start = this.pos;
  var startLoc = this.options.onComment && this.curPosition();
  var ch = this.input.charCodeAt(this.pos += startSkip);
  while (this.pos < this.input.length && !isNewLine(ch)) {
    ch = this.input.charCodeAt(++this.pos);
  }
  if (this.options.onComment) {
    this.options.onComment(
      false,
      this.input.slice(start + startSkip, this.pos),
      start,
      this.pos,
      startLoc,
      this.curPosition()
    );
  }
};
pp.skipSpace = function() {
  loop: while (this.pos < this.input.length) {
    var ch = this.input.charCodeAt(this.pos);
    switch (ch) {
      case 32:
      case 160:
        ++this.pos;
        break;
      case 13:
        if (this.input.charCodeAt(this.pos + 1) === 10) {
          ++this.pos;
        }
      case 10:
      case 8232:
      case 8233:
        ++this.pos;
        if (this.options.locations) {
          ++this.curLine;
          this.lineStart = this.pos;
        }
        break;
      case 47:
        switch (this.input.charCodeAt(this.pos + 1)) {
          case 42:
            this.skipBlockComment();
            break;
          case 47:
            this.skipLineComment(2);
            break;
          default:
            break loop;
        }
        break;
      default:
        if (ch > 8 && ch < 14 || ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
          ++this.pos;
        } else {
          break loop;
        }
    }
  }
};
pp.finishToken = function(type, val) {
  this.end = this.pos;
  if (this.options.locations) {
    this.endLoc = this.curPosition();
  }
  var prevType = this.type;
  this.type = type;
  this.value = val;
  this.updateContext(prevType);
};
pp.readToken_dot = function() {
  var next = this.input.charCodeAt(this.pos + 1);
  if (next >= 48 && next <= 57) {
    return this.readNumber(true);
  }
  var next2 = this.input.charCodeAt(this.pos + 2);
  if (this.options.ecmaVersion >= 6 && next === 46 && next2 === 46) {
    this.pos += 3;
    return this.finishToken(types$1.ellipsis);
  } else {
    ++this.pos;
    return this.finishToken(types$1.dot);
  }
};
pp.readToken_slash = function() {
  var next = this.input.charCodeAt(this.pos + 1);
  if (this.exprAllowed) {
    ++this.pos;
    return this.readRegexp();
  }
  if (next === 61) {
    return this.finishOp(types$1.assign, 2);
  }
  return this.finishOp(types$1.slash, 1);
};
pp.readToken_mult_modulo_exp = function(code) {
  var next = this.input.charCodeAt(this.pos + 1);
  var size = 1;
  var tokentype = code === 42 ? types$1.star : types$1.modulo;
  if (this.options.ecmaVersion >= 7 && code === 42 && next === 42) {
    ++size;
    tokentype = types$1.starstar;
    next = this.input.charCodeAt(this.pos + 2);
  }
  if (next === 61) {
    return this.finishOp(types$1.assign, size + 1);
  }
  return this.finishOp(tokentype, size);
};
pp.readToken_pipe_amp = function(code) {
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === code) {
    if (this.options.ecmaVersion >= 12) {
      var next2 = this.input.charCodeAt(this.pos + 2);
      if (next2 === 61) {
        return this.finishOp(types$1.assign, 3);
      }
    }
    return this.finishOp(code === 124 ? types$1.logicalOR : types$1.logicalAND, 2);
  }
  if (next === 61) {
    return this.finishOp(types$1.assign, 2);
  }
  return this.finishOp(code === 124 ? types$1.bitwiseOR : types$1.bitwiseAND, 1);
};
pp.readToken_caret = function() {
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === 61) {
    return this.finishOp(types$1.assign, 2);
  }
  return this.finishOp(types$1.bitwiseXOR, 1);
};
pp.readToken_plus_min = function(code) {
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === code) {
    if (next === 45 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 62 && (this.lastTokEnd === 0 || lineBreak.test(this.input.slice(this.lastTokEnd, this.pos)))) {
      this.skipLineComment(3);
      this.skipSpace();
      return this.nextToken();
    }
    return this.finishOp(types$1.incDec, 2);
  }
  if (next === 61) {
    return this.finishOp(types$1.assign, 2);
  }
  return this.finishOp(types$1.plusMin, 1);
};
pp.readToken_lt_gt = function(code) {
  var next = this.input.charCodeAt(this.pos + 1);
  var size = 1;
  if (next === code) {
    size = code === 62 && this.input.charCodeAt(this.pos + 2) === 62 ? 3 : 2;
    if (this.input.charCodeAt(this.pos + size) === 61) {
      return this.finishOp(types$1.assign, size + 1);
    }
    return this.finishOp(types$1.bitShift, size);
  }
  if (next === 33 && code === 60 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 45 && this.input.charCodeAt(this.pos + 3) === 45) {
    this.skipLineComment(4);
    this.skipSpace();
    return this.nextToken();
  }
  if (next === 61) {
    size = 2;
  }
  return this.finishOp(types$1.relational, size);
};
pp.readToken_eq_excl = function(code) {
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === 61) {
    return this.finishOp(types$1.equality, this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2);
  }
  if (code === 61 && next === 62 && this.options.ecmaVersion >= 6) {
    this.pos += 2;
    return this.finishToken(types$1.arrow);
  }
  return this.finishOp(code === 61 ? types$1.eq : types$1.prefix, 1);
};
pp.readToken_question = function() {
  var ecmaVersion = this.options.ecmaVersion;
  if (ecmaVersion >= 11) {
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === 46) {
      var next2 = this.input.charCodeAt(this.pos + 2);
      if (next2 < 48 || next2 > 57) {
        return this.finishOp(types$1.questionDot, 2);
      }
    }
    if (next === 63) {
      if (ecmaVersion >= 12) {
        var next2$1 = this.input.charCodeAt(this.pos + 2);
        if (next2$1 === 61) {
          return this.finishOp(types$1.assign, 3);
        }
      }
      return this.finishOp(types$1.coalesce, 2);
    }
  }
  return this.finishOp(types$1.question, 1);
};
pp.readToken_numberSign = function() {
  var ecmaVersion = this.options.ecmaVersion;
  var code = 35;
  if (ecmaVersion >= 13) {
    ++this.pos;
    code = this.fullCharCodeAtPos();
    if (isIdentifierStart(code, true) || code === 92) {
      return this.finishToken(types$1.privateId, this.readWord1());
    }
  }
  this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
};
pp.getTokenFromCode = function(code) {
  switch (code) {
    // The interpretation of a dot depends on whether it is followed
    // by a digit or another two dots.
    case 46:
      return this.readToken_dot();
    // Punctuation tokens.
    case 40:
      ++this.pos;
      return this.finishToken(types$1.parenL);
    case 41:
      ++this.pos;
      return this.finishToken(types$1.parenR);
    case 59:
      ++this.pos;
      return this.finishToken(types$1.semi);
    case 44:
      ++this.pos;
      return this.finishToken(types$1.comma);
    case 91:
      ++this.pos;
      return this.finishToken(types$1.bracketL);
    case 93:
      ++this.pos;
      return this.finishToken(types$1.bracketR);
    case 123:
      ++this.pos;
      return this.finishToken(types$1.braceL);
    case 125:
      ++this.pos;
      return this.finishToken(types$1.braceR);
    case 58:
      ++this.pos;
      return this.finishToken(types$1.colon);
    case 96:
      if (this.options.ecmaVersion < 6) {
        break;
      }
      ++this.pos;
      return this.finishToken(types$1.backQuote);
    case 48:
      var next = this.input.charCodeAt(this.pos + 1);
      if (next === 120 || next === 88) {
        return this.readRadixNumber(16);
      }
      if (this.options.ecmaVersion >= 6) {
        if (next === 111 || next === 79) {
          return this.readRadixNumber(8);
        }
        if (next === 98 || next === 66) {
          return this.readRadixNumber(2);
        }
      }
    // Anything else beginning with a digit is an integer, octal
    // number, or float.
    case 49:
    case 50:
    case 51:
    case 52:
    case 53:
    case 54:
    case 55:
    case 56:
    case 57:
      return this.readNumber(false);
    // Quotes produce strings.
    case 34:
    case 39:
      return this.readString(code);
    // Operators are parsed inline in tiny state machines. '=' (61) is
    // often referred to. `finishOp` simply skips the amount of
    // characters it is given as second argument, and returns a token
    // of the type given by its first argument.
    case 47:
      return this.readToken_slash();
    case 37:
    case 42:
      return this.readToken_mult_modulo_exp(code);
    case 124:
    case 38:
      return this.readToken_pipe_amp(code);
    case 94:
      return this.readToken_caret();
    case 43:
    case 45:
      return this.readToken_plus_min(code);
    case 60:
    case 62:
      return this.readToken_lt_gt(code);
    case 61:
    case 33:
      return this.readToken_eq_excl(code);
    case 63:
      return this.readToken_question();
    case 126:
      return this.finishOp(types$1.prefix, 1);
    case 35:
      return this.readToken_numberSign();
  }
  this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
};
pp.finishOp = function(type, size) {
  var str = this.input.slice(this.pos, this.pos + size);
  this.pos += size;
  return this.finishToken(type, str);
};
pp.readRegexp = function() {
  var escaped, inClass, start = this.pos;
  for (; ; ) {
    if (this.pos >= this.input.length) {
      this.raise(start, "Unterminated regular expression");
    }
    var ch = this.input.charAt(this.pos);
    if (lineBreak.test(ch)) {
      this.raise(start, "Unterminated regular expression");
    }
    if (!escaped) {
      if (ch === "[") {
        inClass = true;
      } else if (ch === "]" && inClass) {
        inClass = false;
      } else if (ch === "/" && !inClass) {
        break;
      }
      escaped = ch === "\\";
    } else {
      escaped = false;
    }
    ++this.pos;
  }
  var pattern = this.input.slice(start, this.pos);
  ++this.pos;
  var flagsStart = this.pos;
  var flags = this.readWord1();
  if (this.containsEsc) {
    this.unexpected(flagsStart);
  }
  var state = this.regexpState || (this.regexpState = new RegExpValidationState(this));
  state.reset(start, pattern, flags);
  this.validateRegExpFlags(state);
  this.validateRegExpPattern(state);
  var value = null;
  try {
    value = new RegExp(pattern, flags);
  } catch (e) {
  }
  return this.finishToken(types$1.regexp, { pattern, flags, value });
};
pp.readInt = function(radix, len, maybeLegacyOctalNumericLiteral) {
  var allowSeparators = this.options.ecmaVersion >= 12 && len === void 0;
  var isLegacyOctalNumericLiteral = maybeLegacyOctalNumericLiteral && this.input.charCodeAt(this.pos) === 48;
  var start = this.pos, total = 0, lastCode = 0;
  for (var i = 0, e = len == null ? Infinity : len; i < e; ++i, ++this.pos) {
    var code = this.input.charCodeAt(this.pos), val = void 0;
    if (allowSeparators && code === 95) {
      if (isLegacyOctalNumericLiteral) {
        this.raiseRecoverable(this.pos, "Numeric separator is not allowed in legacy octal numeric literals");
      }
      if (lastCode === 95) {
        this.raiseRecoverable(this.pos, "Numeric separator must be exactly one underscore");
      }
      if (i === 0) {
        this.raiseRecoverable(this.pos, "Numeric separator is not allowed at the first of digits");
      }
      lastCode = code;
      continue;
    }
    if (code >= 97) {
      val = code - 97 + 10;
    } else if (code >= 65) {
      val = code - 65 + 10;
    } else if (code >= 48 && code <= 57) {
      val = code - 48;
    } else {
      val = Infinity;
    }
    if (val >= radix) {
      break;
    }
    lastCode = code;
    total = total * radix + val;
  }
  if (allowSeparators && lastCode === 95) {
    this.raiseRecoverable(this.pos - 1, "Numeric separator is not allowed at the last of digits");
  }
  if (this.pos === start || len != null && this.pos - start !== len) {
    return null;
  }
  return total;
};
function stringToNumber(str, isLegacyOctalNumericLiteral) {
  if (isLegacyOctalNumericLiteral) {
    return parseInt(str, 8);
  }
  return parseFloat(str.replace(/_/g, ""));
}
function stringToBigInt(str) {
  if (typeof BigInt !== "function") {
    return null;
  }
  return BigInt(str.replace(/_/g, ""));
}
pp.readRadixNumber = function(radix) {
  var start = this.pos;
  this.pos += 2;
  var val = this.readInt(radix);
  if (val == null) {
    this.raise(this.start + 2, "Expected number in radix " + radix);
  }
  if (this.options.ecmaVersion >= 11 && this.input.charCodeAt(this.pos) === 110) {
    val = stringToBigInt(this.input.slice(start, this.pos));
    ++this.pos;
  } else if (isIdentifierStart(this.fullCharCodeAtPos())) {
    this.raise(this.pos, "Identifier directly after number");
  }
  return this.finishToken(types$1.num, val);
};
pp.readNumber = function(startsWithDot) {
  var start = this.pos;
  if (!startsWithDot && this.readInt(10, void 0, true) === null) {
    this.raise(start, "Invalid number");
  }
  var octal = this.pos - start >= 2 && this.input.charCodeAt(start) === 48;
  if (octal && this.strict) {
    this.raise(start, "Invalid number");
  }
  var next = this.input.charCodeAt(this.pos);
  if (!octal && !startsWithDot && this.options.ecmaVersion >= 11 && next === 110) {
    var val$1 = stringToBigInt(this.input.slice(start, this.pos));
    ++this.pos;
    if (isIdentifierStart(this.fullCharCodeAtPos())) {
      this.raise(this.pos, "Identifier directly after number");
    }
    return this.finishToken(types$1.num, val$1);
  }
  if (octal && /[89]/.test(this.input.slice(start, this.pos))) {
    octal = false;
  }
  if (next === 46 && !octal) {
    ++this.pos;
    this.readInt(10);
    next = this.input.charCodeAt(this.pos);
  }
  if ((next === 69 || next === 101) && !octal) {
    next = this.input.charCodeAt(++this.pos);
    if (next === 43 || next === 45) {
      ++this.pos;
    }
    if (this.readInt(10) === null) {
      this.raise(start, "Invalid number");
    }
  }
  if (isIdentifierStart(this.fullCharCodeAtPos())) {
    this.raise(this.pos, "Identifier directly after number");
  }
  var val = stringToNumber(this.input.slice(start, this.pos), octal);
  return this.finishToken(types$1.num, val);
};
pp.readCodePoint = function() {
  var ch = this.input.charCodeAt(this.pos), code;
  if (ch === 123) {
    if (this.options.ecmaVersion < 6) {
      this.unexpected();
    }
    var codePos = ++this.pos;
    code = this.readHexChar(this.input.indexOf("}", this.pos) - this.pos);
    ++this.pos;
    if (code > 1114111) {
      this.invalidStringToken(codePos, "Code point out of bounds");
    }
  } else {
    code = this.readHexChar(4);
  }
  return code;
};
pp.readString = function(quote) {
  var out = "", chunkStart = ++this.pos;
  for (; ; ) {
    if (this.pos >= this.input.length) {
      this.raise(this.start, "Unterminated string constant");
    }
    var ch = this.input.charCodeAt(this.pos);
    if (ch === quote) {
      break;
    }
    if (ch === 92) {
      out += this.input.slice(chunkStart, this.pos);
      out += this.readEscapedChar(false);
      chunkStart = this.pos;
    } else if (ch === 8232 || ch === 8233) {
      if (this.options.ecmaVersion < 10) {
        this.raise(this.start, "Unterminated string constant");
      }
      ++this.pos;
      if (this.options.locations) {
        this.curLine++;
        this.lineStart = this.pos;
      }
    } else {
      if (isNewLine(ch)) {
        this.raise(this.start, "Unterminated string constant");
      }
      ++this.pos;
    }
  }
  out += this.input.slice(chunkStart, this.pos++);
  return this.finishToken(types$1.string, out);
};
var INVALID_TEMPLATE_ESCAPE_ERROR = {};
pp.tryReadTemplateToken = function() {
  this.inTemplateElement = true;
  try {
    this.readTmplToken();
  } catch (err) {
    if (err === INVALID_TEMPLATE_ESCAPE_ERROR) {
      this.readInvalidTemplateToken();
    } else {
      throw err;
    }
  }
  this.inTemplateElement = false;
};
pp.invalidStringToken = function(position, message) {
  if (this.inTemplateElement && this.options.ecmaVersion >= 9) {
    throw INVALID_TEMPLATE_ESCAPE_ERROR;
  } else {
    this.raise(position, message);
  }
};
pp.readTmplToken = function() {
  var out = "", chunkStart = this.pos;
  for (; ; ) {
    if (this.pos >= this.input.length) {
      this.raise(this.start, "Unterminated template");
    }
    var ch = this.input.charCodeAt(this.pos);
    if (ch === 96 || ch === 36 && this.input.charCodeAt(this.pos + 1) === 123) {
      if (this.pos === this.start && (this.type === types$1.template || this.type === types$1.invalidTemplate)) {
        if (ch === 36) {
          this.pos += 2;
          return this.finishToken(types$1.dollarBraceL);
        } else {
          ++this.pos;
          return this.finishToken(types$1.backQuote);
        }
      }
      out += this.input.slice(chunkStart, this.pos);
      return this.finishToken(types$1.template, out);
    }
    if (ch === 92) {
      out += this.input.slice(chunkStart, this.pos);
      out += this.readEscapedChar(true);
      chunkStart = this.pos;
    } else if (isNewLine(ch)) {
      out += this.input.slice(chunkStart, this.pos);
      ++this.pos;
      switch (ch) {
        case 13:
          if (this.input.charCodeAt(this.pos) === 10) {
            ++this.pos;
          }
        case 10:
          out += "\n";
          break;
        default:
          out += String.fromCharCode(ch);
          break;
      }
      if (this.options.locations) {
        ++this.curLine;
        this.lineStart = this.pos;
      }
      chunkStart = this.pos;
    } else {
      ++this.pos;
    }
  }
};
pp.readInvalidTemplateToken = function() {
  for (; this.pos < this.input.length; this.pos++) {
    switch (this.input[this.pos]) {
      case "\\":
        ++this.pos;
        break;
      case "$":
        if (this.input[this.pos + 1] !== "{") {
          break;
        }
      // fall through
      case "`":
        return this.finishToken(types$1.invalidTemplate, this.input.slice(this.start, this.pos));
      case "\r":
        if (this.input[this.pos + 1] === "\n") {
          ++this.pos;
        }
      // fall through
      case "\n":
      case "\u2028":
      case "\u2029":
        ++this.curLine;
        this.lineStart = this.pos + 1;
        break;
    }
  }
  this.raise(this.start, "Unterminated template");
};
pp.readEscapedChar = function(inTemplate) {
  var ch = this.input.charCodeAt(++this.pos);
  ++this.pos;
  switch (ch) {
    case 110:
      return "\n";
    // 'n' -> '\n'
    case 114:
      return "\r";
    // 'r' -> '\r'
    case 120:
      return String.fromCharCode(this.readHexChar(2));
    // 'x'
    case 117:
      return codePointToString(this.readCodePoint());
    // 'u'
    case 116:
      return "	";
    // 't' -> '\t'
    case 98:
      return "\b";
    // 'b' -> '\b'
    case 118:
      return "\v";
    // 'v' -> '\u000b'
    case 102:
      return "\f";
    // 'f' -> '\f'
    case 13:
      if (this.input.charCodeAt(this.pos) === 10) {
        ++this.pos;
      }
    // '\r\n'
    case 10:
      if (this.options.locations) {
        this.lineStart = this.pos;
        ++this.curLine;
      }
      return "";
    case 56:
    case 57:
      if (this.strict) {
        this.invalidStringToken(
          this.pos - 1,
          "Invalid escape sequence"
        );
      }
      if (inTemplate) {
        var codePos = this.pos - 1;
        this.invalidStringToken(
          codePos,
          "Invalid escape sequence in template string"
        );
      }
    default:
      if (ch >= 48 && ch <= 55) {
        var octalStr = this.input.substr(this.pos - 1, 3).match(/^[0-7]+/)[0];
        var octal = parseInt(octalStr, 8);
        if (octal > 255) {
          octalStr = octalStr.slice(0, -1);
          octal = parseInt(octalStr, 8);
        }
        this.pos += octalStr.length - 1;
        ch = this.input.charCodeAt(this.pos);
        if ((octalStr !== "0" || ch === 56 || ch === 57) && (this.strict || inTemplate)) {
          this.invalidStringToken(
            this.pos - 1 - octalStr.length,
            inTemplate ? "Octal literal in template string" : "Octal literal in strict mode"
          );
        }
        return String.fromCharCode(octal);
      }
      if (isNewLine(ch)) {
        if (this.options.locations) {
          this.lineStart = this.pos;
          ++this.curLine;
        }
        return "";
      }
      return String.fromCharCode(ch);
  }
};
pp.readHexChar = function(len) {
  var codePos = this.pos;
  var n = this.readInt(16, len);
  if (n === null) {
    this.invalidStringToken(codePos, "Bad character escape sequence");
  }
  return n;
};
pp.readWord1 = function() {
  this.containsEsc = false;
  var word = "", first = true, chunkStart = this.pos;
  var astral = this.options.ecmaVersion >= 6;
  while (this.pos < this.input.length) {
    var ch = this.fullCharCodeAtPos();
    if (isIdentifierChar(ch, astral)) {
      this.pos += ch <= 65535 ? 1 : 2;
    } else if (ch === 92) {
      this.containsEsc = true;
      word += this.input.slice(chunkStart, this.pos);
      var escStart = this.pos;
      if (this.input.charCodeAt(++this.pos) !== 117) {
        this.invalidStringToken(this.pos, "Expecting Unicode escape sequence \\uXXXX");
      }
      ++this.pos;
      var esc = this.readCodePoint();
      if (!(first ? isIdentifierStart : isIdentifierChar)(esc, astral)) {
        this.invalidStringToken(escStart, "Invalid Unicode escape");
      }
      word += codePointToString(esc);
      chunkStart = this.pos;
    } else {
      break;
    }
    first = false;
  }
  return word + this.input.slice(chunkStart, this.pos);
};
pp.readWord = function() {
  var word = this.readWord1();
  var type = types$1.name;
  if (this.keywords.test(word)) {
    type = keywords[word];
  }
  return this.finishToken(type, word);
};
var version = "8.15.0";
Parser.acorn = {
  Parser,
  version,
  defaultOptions,
  Position,
  SourceLocation,
  getLineInfo,
  Node,
  TokenType,
  tokTypes: types$1,
  keywordTypes: keywords,
  TokContext,
  tokContexts: types,
  isIdentifierChar,
  isIdentifierStart,
  Token,
  isNewLine,
  lineBreak,
  lineBreakG,
  nonASCIIwhitespace
};
function parse3(input, options) {
  return Parser.parse(input, options);
}

// ../core/src/parser.ts
var validateScopes = (program, allowedGlobals = []) => {
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
    else if (p.type === "AssignmentPattern") declarePattern(p.left);
    else if (p.type === "RestElement") declarePattern(p.argument);
    else if (p.type === "ArrayPattern") p.elements.forEach(declarePattern);
    else if (p.type === "ObjectPattern") p.properties.forEach((prop) => {
      if (prop.type === "RestElement") declarePattern(prop.argument);
      else declarePattern(prop.value);
    });
  };
  const visitExpr = (e) => {
    if (!e) return;
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
        e.elements.forEach((el2) => el2 && visitExpr(el2));
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
      case "ChainExpression":
        visitExpr(e.expression);
        return;
      case "NewExpression":
        visitExpr(e.callee);
        e.arguments.forEach((a) => visitExpr(a));
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
      case "ThrowStatement":
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
        if (s.init?.type === "VariableDeclaration") s.init.declarations.forEach(visitVarDecl);
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
        if (s.left.type === "VariableDeclaration") s.left.declarations.forEach(visitVarDecl);
        else visitExpr(s.left);
        visitExpr(s.right);
        visitStmt(s.body);
        exit();
        return;
      }
      case "SwitchStatement": {
        visitExpr(s.discriminant);
        enter();
        s.cases.forEach((c) => {
          if (c.test) visitExpr(c.test);
          c.consequent.forEach(visitStmt);
        });
        exit();
        return;
      }
      case "TryStatement":
        visitStmt(s.block);
        if (s.handler) {
          enter();
          if (s.handler.param) declarePattern(s.handler.param);
          visitStmt(s.handler.body);
          exit();
        }
        if (s.finalizer) visitStmt(s.finalizer);
        return;
      case "BreakStatement":
      case "ContinueStatement":
        return;
    }
  };
  program.body.forEach(visitStmt);
  return errors;
};
var validateNoPrototype = (program) => {
  const errors = [];
  const forbiddenMembers = /* @__PURE__ */ new Set(["prototype", "constructor", "__proto__"]);
  const visitExpr = (e) => {
    if (!e) return;
    switch (e.type) {
      case "MemberExpression":
        if (!e.computed && e.property.type === "Identifier" && forbiddenMembers.has(e.property.name)) {
          errors.push("prototype access");
        }
        visitExpr(e.object);
        if (e.computed) visitExpr(e.property);
        return;
      case "SpreadElement":
        visitExpr(e.argument);
        return;
      case "NewExpression":
        visitExpr(e.callee);
        e.arguments.forEach((a) => visitExpr(a));
        return;
      case "CallExpression":
        visitExpr(e.callee);
        e.arguments.forEach((a) => visitExpr(a));
        return;
      case "AwaitExpression":
        visitExpr(e.argument);
        return;
      case "ChainExpression":
        visitExpr(e.expression);
        return;
      case "ArrayExpression":
        e.elements.forEach((el2) => el2 && visitExpr(el2));
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
      case "ThrowStatement":
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
        if (s.init?.type === "VariableDeclaration") s.init.declarations.forEach((d) => d.init && visitExpr(d.init));
        else if (s.init) visitExpr(s.init);
        if (s.test) visitExpr(s.test);
        if (s.update) visitExpr(s.update);
        visitStmt(s.body);
        return;
      case "ForInStatement":
      case "ForOfStatement":
        if (s.left.type === "VariableDeclaration") s.left.declarations.forEach((d) => d.init && visitExpr(d.init));
        else visitExpr(s.left);
        visitExpr(s.right);
        visitStmt(s.body);
        return;
      case "SwitchStatement":
        visitExpr(s.discriminant);
        s.cases.forEach((c) => {
          if (c.test) visitExpr(c.test);
          c.consequent.forEach(visitStmt);
        });
        return;
      case "TryStatement":
        visitStmt(s.block);
        if (s.handler) visitStmt(s.handler.body);
        if (s.finalizer) visitStmt(s.finalizer);
        return;
      case "BreakStatement":
      case "ContinueStatement":
        return;
    }
  };
  program.body.forEach(visitStmt);
  return errors;
};
var parse4 = (src) => {
  return parse3(src, {
    ecmaVersion: "latest",
    sourceType: "script",
    allowReturnOutsideFunction: true,
    allowAwaitOutsideFunction: true
  });
};

// ../core/src/codegen.ts
var SAFE_IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
var FORBIDDEN_IDENTS = /* @__PURE__ */ new Set([
  "eval",
  "arguments",
  "this",
  "globalThis",
  "window",
  "document",
  "process",
  "require",
  "module",
  "exports",
  "__dirname",
  "__filename",
  "importScripts"
]);
var SAFE_CONSTRUCTORS = /* @__PURE__ */ new Set(["Map", "Set"]);
var assertSafeIdent = (name) => {
  if (!SAFE_IDENT_RE.test(name))
    throw new Error(`unsafe identifier in codegen: ${JSON.stringify(name)}`);
  if (FORBIDDEN_IDENTS.has(name))
    throw new Error(`forbidden identifier in codegen: ${name}`);
};
var renderLiteral = (node) => {
  if (node.regex) {
    if (typeof node.raw === "string" && node.raw.startsWith("/")) return node.raw;
    const pattern = String(node.regex.pattern ?? "");
    const flags = String(node.regex.flags ?? "");
    const escaped = pattern.replace(/\\/g, "\\\\").replace(/\//g, "\\/");
    return `/${escaped}/${flags}`;
  }
  if (node.bigint != null) throw new Error("bigint literals not supported");
  const v = node.value;
  if (v === null) return "null";
  if (typeof v === "string") return JSON.stringify(v);
  return String(v);
};
var renderExpr = (e) => {
  switch (e.type) {
    case "Identifier":
      assertSafeIdent(e.name);
      return e.name;
    case "ChainExpression":
      return renderExpr(e.expression);
    case "SpreadElement":
      return `...${renderExpr(e.argument)}`;
    case "Literal":
      return renderLiteral(e);
    case "ArrayExpression":
      return `[${e.elements.map((el2) => el2 ? renderExpr(el2) : "").join(", ")}]`;
    case "ObjectExpression":
      return `{${e.properties.map((p) => p.type === "SpreadElement" ? `...${renderExpr(p.argument)}` : renderProp(p)).join(", ")}}`;
    case "AwaitExpression":
      return `(await ${renderExpr(e.argument)})`;
    case "CallExpression": {
      const calleeStr = renderExpr(e.callee);
      const needsParens = e.callee.type === "ArrowFunctionExpression";
      return `${needsParens ? "(" : ""}${calleeStr}${needsParens ? ")" : ""}${e.optional ? "?." : ""}(${e.arguments.map(renderExpr).join(", ")})`;
    }
    case "MemberExpression":
      return e.computed ? `${renderExpr(e.object)}${e.optional ? "?." : ""}[__chk(${renderExpr(e.property)})]` : `${renderExpr(e.object)}${e.optional ? "?." : "."}${renderExpr(e.property)}`;
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
    case "NewExpression": {
      if (e.callee.type !== "Identifier") throw new Error("new: only simple constructors allowed");
      const name = e.callee.name;
      assertSafeIdent(name);
      if (!SAFE_CONSTRUCTORS.has(name)) throw new Error(`new: ${name} is not an allowed constructor`);
      return `new ${name}(${e.arguments.map(renderExpr).join(", ")})`;
    }
    case "ArrowFunctionExpression":
      return renderArrow(e);
    default:
      throw new Error(`unsupported expression: ${e.type}`);
  }
};
var renderProp = (p) => {
  if (p.computed) throw new Error("computed properties not supported");
  if (p.method) throw new Error("method properties not supported");
  if (p.kind !== "init") throw new Error(`unsupported property kind: ${p.kind}`);
  const key = p.key.type === "Identifier" ? p.key.name : renderLiteral(p.key);
  if (p.shorthand && p.value.type === "Identifier" && p.value.name === key) {
    assertSafeIdent(key);
    return key;
  }
  return `${key}: ${renderExpr(p.value)}`;
};
var renderArrow = (e) => {
  const params = `(${e.params.map(renderPattern).join(", ")})`;
  const prefix = e.async ? "async " : "";
  if (e.body.type === "BlockStatement") {
    return `${prefix}${params} => ${renderStmt(e.body, true)}`;
  }
  return `${prefix}${params} => { __burn(); return ${renderExpr(e.body)}; }`;
};
var renderStmt = (s, inFn = false) => {
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
    case "ThrowStatement":
      return `${burn}throw ${renderExpr(s.argument)};`;
    case "VariableDeclaration":
      if (s.kind === "var") throw new Error("var declarations not allowed");
      return `${burn}${s.kind} ${s.declarations.map(renderDecl).join(", ")};`;
    case "BreakStatement":
      return `${burn}break;`;
    case "ContinueStatement":
      return `${burn}continue;`;
    case "WhileStatement":
      return `${burn}while (${renderExpr(s.test)}) ${renderLoopBody(s.body)}`;
    case "ForStatement": {
      const init = s.init == null ? "" : s.init.type === "VariableDeclaration" ? `${s.init.kind} ${s.init.declarations.map(renderDecl).join(", ")}` : renderExpr(s.init);
      const test = s.test ? renderExpr(s.test) : "";
      const update = s.update ? renderExpr(s.update) : "";
      return `${burn}for (${init}; ${test}; ${update}) ${renderLoopBody(s.body)}`;
    }
    case "ForInStatement": {
      const left = s.left.type === "VariableDeclaration" ? `${s.left.kind} ${s.left.declarations.map(renderDecl).join(", ")}` : renderExpr(s.left);
      return `${burn}for (${left} in ${renderExpr(s.right)}) ${renderLoopBody(s.body)}`;
    }
    case "ForOfStatement": {
      if (s.await) throw new Error("for-await-of not supported");
      const left = s.left.type === "VariableDeclaration" ? `${s.left.kind} ${s.left.declarations.map(renderDecl).join(", ")}` : renderExpr(s.left);
      return `${burn}for (${left} of ${renderExpr(s.right)}) ${renderLoopBody(s.body)}`;
    }
    case "SwitchStatement": {
      const cases = s.cases.map((c) => {
        const head = c.test ? `case ${renderExpr(c.test)}:` : "default:";
        const body = c.consequent.map((stmt) => renderStmt(stmt, inFn)).join("");
        return `${head}${body}`;
      }).join("");
      return `${burn}switch (${renderExpr(s.discriminant)}) {${cases}}`;
    }
    case "TryStatement": {
      const block = renderStmt(s.block, inFn);
      const handler = s.handler ? (() => {
        const param = s.handler.param ? renderPattern(s.handler.param) : "";
        const body = renderStmt(s.handler.body, inFn);
        return `catch${param ? ` (${param})` : ""} ${body}`;
      })() : "";
      const finalizer = s.finalizer ? ` finally ${renderStmt(s.finalizer, inFn)}` : "";
      return `${burn}try ${block}${handler}${finalizer}`;
    }
    case "EmptyStatement":
      return "";
    default:
      throw new Error(`unsupported statement: ${s.type}`);
  }
};
var renderDecl = (d) => `${renderPattern(d.id)}${d.init ? ` = ${renderExpr(d.init)}` : ""}`;
var renderPattern = (p) => {
  switch (p.type) {
    case "Identifier":
      assertSafeIdent(p.name);
      return p.name;
    case "AssignmentPattern":
      return `${renderPattern(p.left)} = ${renderExpr(p.right)}`;
    case "RestElement":
      return `...${renderPattern(p.argument)}`;
    case "ArrayPattern":
      return `[${p.elements.map((el2) => el2 ? renderPattern(el2) : "").join(", ")}]`;
    case "ObjectPattern":
      return `{${p.properties.map(
        (prop) => prop.type === "RestElement" ? `...${renderPattern(prop.argument)}` : renderPatternProperty(prop)
      ).join(", ")}}`;
    default:
      throw new Error(`unsupported pattern: ${p.type}`);
  }
};
var renderPatternProperty = (p) => {
  if (p.computed) throw new Error("computed pattern properties not supported");
  const key = p.key.type === "Identifier" ? p.key.name : renderLiteral(p.key);
  if (p.shorthand && p.key.type === "Identifier" && p.value.type === "Identifier" && p.value.name === p.key.name) {
    assertSafeIdent(key);
    return key;
  }
  return `${key}: ${renderPattern(p.value)}`;
};
var validateNoReservedRuntimeNames = (program, reservedNames) => {
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
      case "AssignmentPattern":
        visitPattern(p.left);
        return;
      case "RestElement":
        visitPattern(p.argument);
        return;
      case "ArrayPattern":
        p.elements.forEach((el2) => el2 && visitPattern(el2));
        return;
      case "ObjectPattern":
        p.properties.forEach((prop) => {
          if (prop.type === "RestElement") visitPattern(prop.argument);
          else visitPattern(prop.value);
        });
        return;
    }
  };
  const visitExpr = (e) => {
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
        e.elements.forEach((el2) => el2 && visitExpr(el2));
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
      case "ChainExpression":
        visitExpr(e.expression);
        return;
      case "NewExpression":
        visitExpr(e.callee);
        e.arguments.forEach((a) => visitExpr(a));
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
      case "ThrowStatement":
        visitExpr(s.argument);
        return;
      case "VariableDeclaration":
        s.declarations.forEach(visitVarDecl);
        return;
      case "WhileStatement":
        visitExpr(s.test);
        visitStmt(s.body);
        return;
      case "ForStatement":
        if (s.init?.type === "VariableDeclaration") s.init.declarations.forEach(visitVarDecl);
        else if (s.init) visitExpr(s.init);
        if (s.test) visitExpr(s.test);
        if (s.update) visitExpr(s.update);
        visitStmt(s.body);
        return;
      case "ForInStatement":
      case "ForOfStatement":
        if (s.left.type === "VariableDeclaration") s.left.declarations.forEach(visitVarDecl);
        else visitExpr(s.left);
        visitExpr(s.right);
        visitStmt(s.body);
        return;
      case "SwitchStatement":
        visitExpr(s.discriminant);
        s.cases.forEach((c) => {
          if (c.test) visitExpr(c.test);
          c.consequent.forEach(visitStmt);
        });
        return;
      case "TryStatement":
        visitStmt(s.block);
        if (s.handler) {
          if (s.handler.param) visitPattern(s.handler.param);
          visitStmt(s.handler.body);
        }
        if (s.finalizer) visitStmt(s.finalizer);
        return;
      case "BreakStatement":
      case "ContinueStatement":
      case "EmptyStatement":
        return;
    }
  };
  program.body.forEach(visitStmt);
  return errors;
};
var CHK_FN = `const __chk = (k) => { if (typeof k === "string" && (k === "constructor" || k === "__proto__" || k === "prototype")) throw new Error("forbidden property: " + k); return k; };`;
var renderRunnerWithFuelShared = (program, fuelRefName = "__fuel") => {
  assertSafeIdent(fuelRefName);
  const reservedErrs = validateNoReservedRuntimeNames(program, [fuelRefName, "__burn", "__chk"]);
  if (reservedErrs.length) throw new Error(reservedErrs.join(", "));
  const prelude = `const __burn = () => { if (--${fuelRefName}.value < 0) throw new Error("fuel exhausted"); };${CHK_FN}`;
  const body = program.body.map((s) => renderStmt(s, true)).join("");
  return `${prelude}const __run = () => {${body}}; try { const ok = __run(); return { ok, fuel: ${fuelRefName}.value }; } catch (err) { return { err: String(err), fuel: ${fuelRefName}.value }; }`;
};
var renderRunnerWithFuelSharedAsync = (program, fuelRefName = "__fuel") => {
  assertSafeIdent(fuelRefName);
  const reservedErrs = validateNoReservedRuntimeNames(program, [fuelRefName, "__burn", "__chk"]);
  if (reservedErrs.length) throw new Error(reservedErrs.join(", "));
  const prelude = `const __burn = () => { if (--${fuelRefName}.value < 0) throw new Error("fuel exhausted"); };${CHK_FN}`;
  const body = program.body.map((s) => renderStmt(s, true)).join("");
  return `${prelude}const __run = async () => {${body}}; return __run().then(ok => ({ ok, fuel: ${fuelRefName}.value })).catch(err => ({ err: String(err), fuel: ${fuelRefName}.value }));`;
};
var SAFE_OBJECT = Object.freeze(Object.assign(/* @__PURE__ */ Object.create(null), {
  keys: (obj) => Object.keys(obj),
  values: (obj) => Object.values(obj),
  entries: (obj) => Object.entries(obj),
  fromEntries: (entries) => Object.fromEntries(entries),
  assign: (target, ...sources) => Object.assign(target, ...sources),
  freeze: (obj) => Object.freeze(obj)
}));
var SAFE_ARRAY = Object.freeze(Object.assign(/* @__PURE__ */ Object.create(null), {
  isArray: (v) => Array.isArray(v),
  from: (v, mapFn) => mapFn ? Array.from(v, mapFn) : Array.from(v),
  of: (...items) => Array.of(...items)
}));
var SAFE_MATH = Object.freeze(Object.assign(/* @__PURE__ */ Object.create(null), {
  abs: Math.abs,
  ceil: Math.ceil,
  floor: Math.floor,
  round: Math.round,
  min: Math.min,
  max: Math.max,
  pow: Math.pow,
  sqrt: Math.sqrt,
  sign: Math.sign,
  trunc: Math.trunc,
  log: Math.log,
  log2: Math.log2,
  random: Math.random,
  PI: Math.PI,
  E: Math.E
}));
var parseFunctionCtor = (ctorArgs) => {
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
var mapFunctionArgs = (params, callArgs) => {
  const env2 = {};
  let idx = 0;
  for (const p of params) {
    if (p.rest) {
      env2[p.name] = callArgs.slice(idx);
      idx = callArgs.length;
    } else {
      env2[p.name] = callArgs[idx++];
    }
  }
  return env2;
};
var makeSafeFunctionSync = (fuelRef, outerGlobals) => (...ctorArgs) => {
  const { params, body } = parseFunctionCtor(ctorArgs);
  return (...callArgs) => {
    const localEnv = { ...outerGlobals, ...mapFunctionArgs(params, callArgs) };
    const res = runWithFuelShared(body, fuelRef, localEnv);
    if ("err" in res) throw new Error(res.err);
    return res.ok;
  };
};
var makeSafeFunctionAsync = (fuelRef, outerGlobals) => (...ctorArgs) => {
  const { params, body } = parseFunctionCtor(ctorArgs);
  return async (...callArgs) => {
    const localEnv = { ...outerGlobals, ...mapFunctionArgs(params, callArgs) };
    const res = await runWithFuelSharedAsync(body, fuelRef, localEnv);
    if ("err" in res) throw new Error(res.err);
    return res.ok;
  };
};
var withBuiltins = (env2, fuelRef, mode) => {
  const baseGlobals = {
    ...env2,
    Object: SAFE_OBJECT,
    Array: SAFE_ARRAY,
    Math: SAFE_MATH,
    Map,
    Set,
    Promise
  };
  return {
    ...baseGlobals,
    Function: mode === "async" ? makeSafeFunctionAsync(fuelRef, baseGlobals) : makeSafeFunctionSync(fuelRef, baseGlobals)
  };
};
var stringifyError = (err) => {
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
var runWithFuelShared = (src, fuelRef, env2 = {}, fuelRefName = "__fuel") => {
  try {
    const runtimeEnv = withBuiltins(env2, fuelRef, "sync");
    const program = parse4(src);
    const protoErrs = validateNoPrototype(program);
    if (protoErrs.length) return { err: "prototype access", fuel: fuelRef.value };
    const scopeErrs = validateScopes(program, [...Object.keys(runtimeEnv), fuelRefName]);
    if (scopeErrs.length) return { err: scopeErrs.join(", "), fuel: fuelRef.value };
    const code = renderRunnerWithFuelShared(program, fuelRefName);
    const fullEnv = { ...runtimeEnv, [fuelRefName]: fuelRef };
    return new Function(...Object.keys(fullEnv), code)(...Object.values(fullEnv));
  } catch (err) {
    return { err: stringifyError(err), fuel: fuelRef.value };
  }
};
var runWithFuelSharedAsync = async (src, fuelRef, env2 = {}, fuelRefName = "__fuel") => {
  try {
    const runtimeEnv = withBuiltins(env2, fuelRef, "async");
    const program = parse4(src);
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

// ../lib/src/openrouter.ts
var OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
var clip = (s, max = 2e3) => s.length <= max ? s : s.slice(0, max) + "...<truncated>";
var asErrorMessage = async (res) => {
  const text2 = await res.text();
  if (!text2) return `${res.status} ${res.statusText}`;
  try {
    const parsed = JSON.parse(text2);
    const msg = parsed?.error?.message;
    return msg ? `${res.status} ${msg}` : `${res.status} ${text2}`;
  } catch {
    return `${res.status} ${text2}`;
  }
};
var openRouterRequest = async (req) => {
  if (!req.apiKey) throw new Error("openRouterRequest: apiKey is required");
  if (!req.model) req.model = "openai/gpt-oss-20b";
  if (!req.prompt) throw new Error("openRouterRequest: prompt is required");
  if (!req.schema) req.schema = { type: "string" };
  if (typeof req.schema !== "object" || Array.isArray(req.schema)) {
    throw new Error("openRouterRequest: schema must be an object");
  }
  const messages = [{ role: "user", content: req.prompt }];
  const mkBody = () => ({
    model: req.model,
    messages,
    reasoning: {
      enabled: true,
      exclude: true
    },
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "structured_output",
        strict: true,
        schema: req.schema
      }
    }
  });
  const doFetch = () => fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${req.apiKey}`
    },
    body: JSON.stringify(mkBody())
  });
  const res = await doFetch();
  if (!res.ok) throw new Error(`OpenRouter request failed: ${await asErrorMessage(res)}`);
  const data2 = await res.json();
  const content = data2.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error(
      "OpenRouter response missing choices[0].message.content\nmodel: " + req.model + "\nschema: " + clip(JSON.stringify(req.schema)) + "\nresponse: " + clip(JSON.stringify(data2))
    );
  }
  if (content.trim().length === 0) {
    throw new Error(
      "OpenRouter response content was empty\nmodel: " + req.model + "\nschema: " + clip(JSON.stringify(req.schema)) + "\nresponse: " + clip(JSON.stringify(data2))
    );
  }
  try {
    return JSON.parse(content);
  } catch (err) {
    const parseMsg = err instanceof Error ? err.message : String(err);
    throw new Error(
      "OpenRouter response content was not valid JSON\nmodel: " + req.model + "\nparse error: " + parseMsg + "\nschema: " + clip(JSON.stringify(req.schema)) + "\ncontent: " + clip(content) + "\nresponse: " + clip(JSON.stringify(data2))
    );
  }
};

// ../lib/src/runtime.ts
var localStoreKey = (fnRef, key) => `${fnRef}|${hashData(key)}`;
var makeStore = (noteRef, memStore, ls) => ({
  get: (key) => {
    const skey = `hashnotes:store:${localStoreKey(noteRef, key)}`;
    const raw = ls?.getItem(skey);
    if (raw != null) return fromjson(raw);
    return memStore.get(skey);
  },
  set: (key, value) => {
    const skey = `hashnotes:store:${localStoreKey(noteRef, key)}`;
    const v = value;
    if (ls) ls.setItem(skey, JSON.stringify(v));
    else memStore.set(skey, v);
    return v;
  }
});
var parseDeps = (src) => {
  const m = src.match(/^const __deps = \[([^\]]*)\];/);
  if (!m) return [];
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
};
var callViewClient = async (fn, _args, options = {}) => {
  const fuelBudget = options.fuel ?? 1e5;
  const fuelRef = { value: fuelBudget };
  const noteCache2 = /* @__PURE__ */ new Map();
  const memStore = /* @__PURE__ */ new Map();
  const ls = (() => {
    try {
      return typeof localStorage !== "undefined" ? localStorage : void 0;
    } catch {
      return void 0;
    }
  })();
  const promptUser = (message, defaultValue = "") => {
    try {
      const p = globalThis.prompt;
      if (typeof p === "function") return p(message, defaultValue);
    } catch {
    }
    return null;
  };
  const fnToHash = /* @__PURE__ */ new Map();
  const fnRef = await asRef(fn);
  const fnNote = await deRef(fnRef);
  if (typeof fnNote !== "string") throw new Error("view note must resolve to a string");
  const prefetch = async (ref2) => {
    if (noteCache2.has(ref2)) return;
    const data2 = await deRef(ref2);
    noteCache2.set(ref2, data2);
    if (typeof data2 === "string") {
      for (const dep of parseDeps(data2)) await prefetch(dep);
    }
  };
  for (const dep of parseDeps(fnNote)) await prefetch(dep);
  const store = makeStore(fnRef, memStore, ls);
  const remote = (fn2) => {
    const hash = fnToHash.get(fn2) ?? fn2;
    return (...remoteArgs) => callNote(hash, remoteArgs);
  };
  const getFuncSync = (ref2) => {
    const src = noteCache2.get(ref2);
    if (src === void 0) throw new Error(`getFuncSync: note ${ref2} not in cache`);
    if (typeof src !== "string") throw new Error(`getFuncSync: note ${ref2} is not code`);
    const fn2 = (...callArgs) => {
      const depStore = makeStore(ref2, memStore, ls);
      const result = runWithFuelShared(src, fuelRef, { ...baseEnv, args: callArgs, store: depStore });
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    };
    fnToHash.set(fn2, ref2);
    return fn2;
  };
  const getDataSync = (ref2) => {
    const data2 = noteCache2.get(ref2);
    if (data2 === void 0) throw new Error(`getDataSync: note ${ref2} not in cache`);
    return data2;
  };
  const baseEnv = {
    ...options.env ?? {},
    remote,
    getFuncSync,
    getDataSync,
    store,
    addNote,
    getNote,
    asRef,
    deref: deRef,
    hashData,
    fromjson,
    promptUser,
    openRouterRequest,
    HTML,
    JSON,
    console
  };
  return (upper) => {
    const wrappedUpper = {
      ...upper,
      onUserEvent: () => {
        fuelRef.value = fuelBudget;
      }
    };
    const result = runWithFuelShared(fnNote, fuelRef, { ...baseEnv, args: [wrappedUpper] });
    if ("err" in result) throw new Error(result.err);
    return result.ok;
  };
};

// src/main.ts
var DEV_URL = "http://localhost:4321";
var el = (tag, text2) => {
  const e = document.createElement(tag);
  if (text2) e.textContent = text2;
  return e;
};
var errorText = (err) => {
  if (err instanceof Error) {
    const stack = err.stack ? `
${err.stack}` : "";
    return `${err.name}: ${err.message}${stack}`;
  }
  return String(err);
};
var reportDevError = async (source, err) => {
  const message = errorText(err);
  const stack = err instanceof Error ? err.stack || "" : "";
  try {
    await fetch(`${DEV_URL}/browser-error`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source,
        message,
        stack,
        page: window.location.pathname
      })
    });
  } catch {
  }
};
var renderErrorPanel = (mount, title, err, context = {}) => {
  mount.innerHTML = "";
  const box = el("div");
  box.style.cssText = "margin:8px 0;padding:12px;border:1px solid #b44;background:rgba(180,68,68,0.12);";
  const h = el("h3", title);
  h.style.cssText = "margin:0 0 8px 0;font-size:1rem;";
  box.append(h);
  const meta = Object.entries(context).map(([k, v]) => `${k}: ${v}`).join("\n");
  if (meta) {
    const m = el("pre", meta);
    m.style.cssText = "margin:0 0 8px 0;white-space:pre-wrap;opacity:0.85;";
    box.append(m);
  }
  const body = el("pre", errorText(err));
  body.style.cssText = "margin:0;white-space:pre-wrap;overflow:auto;max-height:50vh;";
  box.append(body);
  mount.append(box);
};
var parsePathSeg = (pathname, idx) => {
  const segs = pathname.replace(/^\/+/, "").split("/");
  if (idx < 0 || idx >= segs.length) return "";
  return decodeURIComponent(segs[idx]).trim();
};
var parseRefAt = (pathname, idx) => {
  const seg = parsePathSeg(pathname, idx);
  if (!seg) return null;
  if (isRef(seg)) return seg;
  if (/^[a-f0-9]{32}$/i.test(seg)) return `#${seg}`;
  return null;
};
var startPolling = (mount, poll) => {
  mount.innerHTML = "";
  mount.textContent = "Connecting to dev server...";
  const run = async () => {
    try {
      await poll();
    } catch (err) {
      console.error("live poll failed", err);
      void reportDevError("poll", err);
    }
  };
  run();
  setInterval(run, 500);
};
var fetchHistory = async () => JSON.parse(await (await fetch(`${DEV_URL}/history`)).text());
var latestView = (history) => [...history].reverse().find((e) => e.exportName === "view" || e.exportName === "default");
var renderRef = async (mount, ref2) => {
  const note = await getNote(ref2);
  try {
    const view = await callViewClient(ref2);
    mount.innerHTML = "";
    mount.append(renderDom(view, { pathname: window.location.pathname }));
  } catch (err) {
    void reportDevError("renderRef", err);
    renderErrorPanel(mount, "Failed to render note view", err, {
      ref: ref2,
      path: window.location.pathname,
      note: tojson(note)
    });
  }
};
var renderRawRef = async (mount, ref2) => {
  try {
    const note = await getNote(ref2);
    mount.innerHTML = "";
    const wrap = el("div");
    wrap.style.cssText = "padding:8px;";
    const h = el("h3", `raw note ${ref2}`);
    h.style.cssText = "margin:0 0 8px 0;font-size:1rem;";
    const pre = el("pre", tojson(note));
    pre.style.cssText = "margin:0;white-space:pre-wrap;overflow:auto;max-height:70vh;";
    wrap.append(h, pre);
    mount.append(wrap);
  } catch (err) {
    void reportDevError("renderRawRef", err);
    renderErrorPanel(mount, "Failed to load raw note", err, {
      ref: ref2,
      path: window.location.pathname
    });
  }
};
var bootLiveView = (mount, path2) => {
  let last = "";
  let lastErrorKey = "";
  startPolling(mount, async () => {
    try {
      const history = await fetchHistory();
      const view = latestView(history);
      if (!view) {
        mount.innerHTML = "";
        mount.append(el("p", "No view found."));
        return;
      }
      if (view.jsHash === last) return;
      last = view.jsHash;
      const bar = el("div");
      bar.style.cssText = "padding:4px 8px;font-size:0.85em;opacity:0.6;";
      const a = document.createElement("a");
      a.href = `/view/${view.jsHash.slice(1)}`;
      a.textContent = `${view.filename ?? view.exportName} \u2192 ${view.jsHash.slice(0, 14)}\u2026`;
      bar.append(a);
      const rendered = renderDom(await callViewClient(view.jsHash), { pathname: path2.replace("/live/view", "") || "/" });
      mount.innerHTML = "";
      mount.append(bar, rendered);
      lastErrorKey = "";
    } catch (err) {
      const key = errorText(err);
      void reportDevError("bootLiveView", err);
      if (key !== lastErrorKey) {
        renderErrorPanel(mount, "Failed to render latest live view", err, {
          path: path2,
          retry: "automatic (500ms)"
        });
        lastErrorKey = key;
      }
    }
  });
};
var bootLiveIndex = (mount) => {
  let last = "";
  startPolling(mount, async () => {
    const json = await (await fetch(`${DEV_URL}/history`)).text();
    if (json === last) return;
    last = json;
    const history = JSON.parse(json);
    mount.innerHTML = "";
    mount.append(el("h2", "hashnotes dev"));
    mount.append(el("p", `${history.length} compiled notes (${getServer()})`));
    for (const entry of history) {
      const row = el("div");
      const isView = entry.exportName === "view" || entry.exportName === "default";
      if (isView) {
        const a = document.createElement("a");
        a.href = `/view/${entry.jsHash.slice(1)}`;
        a.textContent = entry.exportName;
        row.append(a);
        const raw = document.createElement("a");
        raw.href = `/${entry.jsHash.slice(1)}`;
        raw.textContent = " (raw)";
        raw.style.cssText = "opacity:0.5;font-size:0.85em;";
        row.append(raw);
        const live = document.createElement("a");
        live.href = "/live/view";
        live.textContent = " (live)";
        live.style.cssText = "opacity:0.5;font-size:0.85em;";
        row.append(live);
      } else {
        const span = el("span", entry.exportName);
        span.style.opacity = "0.5";
        row.append(span);
      }
      const hash = el("span", ` ${entry.jsHash.slice(0, 14)}\u2026`);
      hash.style.cssText = "opacity:0.4;font-size:0.85em;";
      row.append(hash);
      mount.append(row);
    }
  });
};
var boot = async () => {
  window.addEventListener("error", (ev) => {
    void reportDevError("window.onerror", ev.error || ev.message);
  });
  window.addEventListener("unhandledrejection", (ev) => {
    void reportDevError("window.unhandledrejection", ev.reason);
  });
  const mount = document.getElementById("app") ?? document.body;
  const path2 = window.location.pathname.replace(/\/+$/, "");
  if (path2.startsWith("/live/view")) return bootLiveView(mount, path2);
  if (path2 === "/live") return bootLiveIndex(mount);
  if (path2.startsWith("/view/")) {
    const ref3 = parseRefAt(path2, 1);
    if (!ref3) {
      mount.textContent = "Open /view/<note-hash> to render that note as a view.";
      return;
    }
    await renderRef(mount, ref3);
    return;
  }
  const ref2 = parseRefAt(path2, 0);
  if (!ref2) {
    mount.textContent = "Open /<note-hash> for raw data or /view/<note-hash> to render as a view.";
    return;
  }
  await renderRawRef(mount, ref2);
};

// src/entry.ts
boot().catch((err) => {
  console.error(err);
  const mount = document.getElementById("app") ?? document.body;
  mount.textContent = `App boot failed: ${String(err)}`;
});
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vbGliL3NyYy92aWV3cy50cyIsICIuLi8uLi8uLi9jb3JlL3NyYy9ub3Rlcy50cyIsICIuLi8uLi8uLi9saWIvc3JjL2RiLnRzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9hY29ybi9kaXN0L2Fjb3JuLm1qcyIsICIuLi8uLi8uLi9jb3JlL3NyYy9wYXJzZXIudHMiLCAiLi4vLi4vLi4vY29yZS9zcmMvY29kZWdlbi50cyIsICIuLi8uLi8uLi9saWIvc3JjL29wZW5yb3V0ZXIudHMiLCAiLi4vLi4vLi4vbGliL3NyYy9ydW50aW1lLnRzIiwgIi4uLy4uL3NyYy9tYWluLnRzIiwgIi4uLy4uL3NyYy9lbnRyeS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gcGFnZSB2aWV3XG5cbnR5cGUgTW91c2VFdmVudFR5cGUgPSBcImNsaWNrXCJ8IFwibW91c2Vtb3ZlXCIgfCBcIm1vdXNldXBcIiB8IFwibW91c2Vkb3duXCIgfCBcImRyYWdcIiB8IFwid2hlZWxcIlxudHlwZSBLZXlib2FyZEV2ZW50VHlwZSA9IFwia2V5ZG93blwiIHwgXCJrZXl1cFwiXG50eXBlIERvbUV2ZW50VHlwZSA9IE1vdXNlRXZlbnRUeXBlIHwgS2V5Ym9hcmRFdmVudFR5cGU7XG5cbmNvbnN0IG1vdXNlRXZlbnRzIDogTW91c2VFdmVudFR5cGVbXSA9IFtcImNsaWNrXCIsIFwibW91c2Vtb3ZlXCIsIFwibW91c2V1cFwiLCBcIm1vdXNlZG93blwiLCBcImRyYWdcIiwgXCJ3aGVlbFwiXTtcbmNvbnN0IGtleWJvYXJkRXZlbnRzIDogS2V5Ym9hcmRFdmVudFR5cGVbXSA9IFtcImtleWRvd25cIiwgXCJrZXl1cFwiXTtcbmNvbnN0IHN2Z05hbWVzcGFjZSA9IFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIjtcbmNvbnN0IHN2Z1RhZ3MgPSBuZXcgU2V0KFtcInN2Z1wiLCBcInBhdGhcIiwgXCJnXCIsIFwibGluZVwiLCBcInBvbHlsaW5lXCIsIFwicG9seWdvblwiLCBcImNpcmNsZVwiLCBcImVsbGlwc2VcIiwgXCJyZWN0XCIsIFwidGV4dFwiXSk7XG5jb25zdCBhbGxvd2VkQXR0cmlidXRlTmFtZXMgPSBuZXcgU2V0KFtcInZpZXdCb3hcIixcIndpZHRoXCIsXCJoZWlnaHRcIixcInhtbG5zXCIsXCJkXCIsXCJmaWxsXCIsXCJzdHJva2VcIixcInN0cm9rZS13aWR0aFwiLFwic3Ryb2tlLWxpbmVjYXBcIixcInN0cm9rZS1saW5lam9pblwiLFwic3Ryb2tlLWRhc2hhcnJheVwiLFwic3Ryb2tlLWRhc2hvZmZzZXRcIixcInhcIixcInlcIixcIngxXCIsXCJ5MVwiLFwieDJcIixcInkyXCIsXCJjeFwiLFwiY3lcIixcInJcIixcInJ4XCIsXCJyeVwiLFwicG9pbnRzXCIsXCJ0cmFuc2Zvcm1cIixcIm9wYWNpdHlcIixcImZvbnQtc2l6ZVwiLFwiZm9udC1mYW1pbHlcIixcImZvbnQtd2VpZ2h0XCIsXCJ0ZXh0LWFuY2hvclwiLFwiZG9taW5hbnQtYmFzZWxpbmVcIixcImR4XCIsXCJkeVwiLFwiaHJlZlwiLFwidGFyZ2V0XCIsXCJyZWxcIl0pO1xuXG5cblxuXG5leHBvcnQgdHlwZSBNb3VzZUV2ZW50ID0ge1xuICB0eXBlOiBNb3VzZUV2ZW50VHlwZVxuICB0YXJnZXQ6IFZEb21cbiAgY2xpZW50WD86IG51bWJlclxuICBjbGllbnRZPzogbnVtYmVyXG4gIGRlbHRhWT86IG51bWJlclxuICBjdXJyZW50VGFyZ2V0PzogRWxlbWVudFxuICBwcmV2ZW50RGVmYXVsdD86ICgpID0+IHZvaWRcbn07XG5cbnR5cGUgS2V5Ym9hcmRFdmVudCA9IHtcbiAgdHlwZTogS2V5Ym9hcmRFdmVudFR5cGVcbiAga2V5OiBzdHJpbmcsXG4gIG1ldGFLZXk6IGJvb2xlYW4sXG4gIHNoaWZ0S2V5OiBib29sZWFuLFxuICB0YXJnZXQ6IFZEb20sXG59XG5cbmV4cG9ydCB0eXBlIFZpZXdDb250ZXh0ID0ge1xuICBhZGQ6IChwYXJlbnQ6IFZEb20sIC4uLmVsOiBWRG9tW10pPT4gdm9pZCxcbiAgZGVsOiAoZWw6IFZEb20pID0+IHZvaWQsXG4gIHVwZGF0ZTogKGVsOiBWRG9tKSA9PiB2b2lkLFxuICBvblVzZXJFdmVudD86ICh0eXBlOiBEb21FdmVudFR5cGUpID0+IHZvaWQsXG4gIGxvY2F0aW9uOiB7IHBhdGhuYW1lOiBzdHJpbmcgfSxcbiAgd2lkdGg6IG51bWJlcixcbiAgaGVpZ2h0OiBudW1iZXIsXG59XG5cbmV4cG9ydCB0eXBlIFZEb20gPSB7XG4gIHRhZzogc3RyaW5nXG4gIHRleHRDb250ZW50OiBzdHJpbmdcbiAgaWQ6IHN0cmluZ1xuICBzdHlsZTogUmVjb3JkPHN0cmluZywgc3RyaW5nPlxuICBhdHRyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPlxuICBjaGlsZHJlbjogVkRvbVtdXG4gIG9uY2xpY2s/OiBNb3VzZUxpc3RlbmVyXG4gIG9ubW91c2Vkb3duPzogTW91c2VMaXN0ZW5lclxuICBvbm1vdXNldXA/OiBNb3VzZUxpc3RlbmVyXG4gIG9ubW91c2Vtb3ZlPzogTW91c2VMaXN0ZW5lclxuICBvbndoZWVsPzogTW91c2VMaXN0ZW5lclxuICBvbmtleWRvd24/OiBLZXlMaXN0ZW5lclxuICBvbmtleXVwPzogS2V5TGlzdGVuZXJcbiAgdmFsdWU/OiBzdHJpbmdcbn1cblxudHlwZSBEb21VcGRhdGUgPSB7IG9wOiBcIkRFTFwiLCBlbDogVkRvbSB9IHwgeyBvcDogXCJBRERcIiwgcGFyZW50OiBWRG9tLCBlbDogVkRvbVtdfSB8IHsgb3A6IFwiVVBEQVRFXCIsIGVsOiBWRG9tIH1cblxuXG5sZXQgZG9tcyA9IG5ldyBXZWFrTWFwPEVsZW1lbnQsIFZEb20+KCk7XG5sZXQgZWxlbWVudHMgPSBuZXcgV2Vha01hcDxWRG9tLCBFbGVtZW50PigpO1xuXG5cblxuZXhwb3J0IHR5cGUgVmlldyA9IChjdHg6IFZpZXdDb250ZXh0KSA9PiBWRG9tO1xuXG5leHBvcnQgY29uc3QgcmVuZGVyRG9tID0gKG1rZXI6IFZpZXcsIGxvY2F0aW9uOiB7IHBhdGhuYW1lOiBzdHJpbmcgfSA9IHsgcGF0aG5hbWU6IFwiL1wiIH0sIHdpZHRoID0gZ2xvYmFsVGhpcy5pbm5lcldpZHRoID8/IDAsIGhlaWdodCA9IGdsb2JhbFRoaXMuaW5uZXJIZWlnaHQgPz8gMCk6IEhUTUxFbGVtZW50ID0+IHtcblxuICBsZXQgY3R4UmVmOiBWaWV3Q29udGV4dCB8IG51bGwgPSBudWxsXG5cbiAgY29uc3QgcmVuZGVyID0gKGRvbTpWRG9tKSA6IEVsZW1lbnQ9PntcblxuICAgIGNvbnN0IGVsID0gc3ZnVGFncy5oYXMoZG9tLnRhZykgPyBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoc3ZnTmFtZXNwYWNlLCBkb20udGFnKVxuICAgICAgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGRvbS50YWcpO1xuXG4gICAgZWwudGV4dENvbnRlbnQgPSBkb20udGV4dENvbnRlbnRcbiAgICBpZiAoKGVsIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCB8fCBlbCBpbnN0YW5jZW9mIEhUTUxUZXh0QXJlYUVsZW1lbnQpICYmIGRvbS52YWx1ZSkgZWwudmFsdWUgPSBkb20udmFsdWVcbiAgICBlbGVtZW50cy5zZXQoZG9tLCBlbClcbiAgICBkb21zLnNldChlbCwgZG9tKVxuICAgIGVsLmFwcGVuZCguLi5kb20uY2hpbGRyZW4ubWFwKGM9PnJlbmRlcihjKSkpXG4gICAgT2JqZWN0LmVudHJpZXMoZG9tLmF0dHJzKS5mb3JFYWNoKChbaywgdl0pID0+IHtcbiAgICAgIGlmIChhbGxvd2VkQXR0cmlidXRlTmFtZXMuaGFzKGspKSBlbC5zZXRBdHRyaWJ1dGUoaywgdilcbiAgICB9KVxuICAgIE9iamVjdC5lbnRyaWVzKGRvbS5zdHlsZSkuZm9yRWFjaChzdD0+ZWwuc3R5bGUuc2V0UHJvcGVydHkoLi4uc3QpKVxuICAgIG1vdXNlRXZlbnRzLmZvckVhY2goKHR5cGUpID0+IGVsLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgKGUpID0+IHtcbiAgICAgIGlmIChjdHhSZWYgJiYgY3R4UmVmLm9uVXNlckV2ZW50KSBjdHhSZWYub25Vc2VyRXZlbnQodHlwZSlcbiAgICAgIGNvbnN0IG1lID0gZSBhcyBnbG9iYWxUaGlzLk1vdXNlRXZlbnRcbiAgICAgIGNvbnN0IGV2ZW50OiBNb3VzZUV2ZW50ID0ge1xuICAgICAgICB0eXBlLFxuICAgICAgICB0YXJnZXQ6IGRvbXMuZ2V0KGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50KSEsXG4gICAgICAgIGNsaWVudFg6IG1lLmNsaWVudFgsXG4gICAgICAgIGNsaWVudFk6IG1lLmNsaWVudFksXG4gICAgICAgIGRlbHRhWTogdHlwZSA9PT0gXCJ3aGVlbFwiID8gKG1lIGFzIGdsb2JhbFRoaXMuV2hlZWxFdmVudCkuZGVsdGFZIDogdW5kZWZpbmVkLFxuICAgICAgICBjdXJyZW50VGFyZ2V0OiBlbCxcbiAgICAgICAgcHJldmVudERlZmF1bHQ6ICgpID0+IGUucHJldmVudERlZmF1bHQoKSxcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlID09PSBcImNsaWNrXCIgJiYgZG9tLm9uY2xpY2spIGRvbS5vbmNsaWNrKGV2ZW50KVxuICAgICAgZWxzZSBpZiAodHlwZSA9PT0gXCJtb3VzZWRvd25cIiAmJiBkb20ub25tb3VzZWRvd24pIGRvbS5vbm1vdXNlZG93bihldmVudClcbiAgICAgIGVsc2UgaWYgKHR5cGUgPT09IFwibW91c2V1cFwiICYmIGRvbS5vbm1vdXNldXApIGRvbS5vbm1vdXNldXAoZXZlbnQpXG4gICAgICBlbHNlIGlmICh0eXBlID09PSBcIm1vdXNlbW92ZVwiICYmIGRvbS5vbm1vdXNlbW92ZSkgZG9tLm9ubW91c2Vtb3ZlKGV2ZW50KVxuICAgICAgZWxzZSBpZiAodHlwZSA9PT0gXCJ3aGVlbFwiICYmIGRvbS5vbndoZWVsKSBkb20ub253aGVlbChldmVudClcbiAgICB9KSk7XG4gICAga2V5Ym9hcmRFdmVudHMuZm9yRWFjaCgodHlwZSkgPT4gZWwuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCAoZSkgPT57XG4gICAgICBpZiAoY3R4UmVmICYmIGN0eFJlZi5vblVzZXJFdmVudCkgY3R4UmVmLm9uVXNlckV2ZW50KHR5cGUpXG4gICAgICBsZXQge2tleSwgbWV0YUtleSwgc2hpZnRLZXl9ID0gZSBhcyBnbG9iYWxUaGlzLktleWJvYXJkRXZlbnQ7XG4gICAgICBpZiAoW1wiSU5QVVRcIiAsIFwiVEVYVEFSRUFcIl0uaW5jbHVkZXMoKGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS50YWdOYW1lKSkgZG9tLnZhbHVlID0gKGUudGFyZ2V0IGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlXG4gICAgICBjb25zdCBldmVudDogS2V5Ym9hcmRFdmVudCA9IHsgdHlwZSwga2V5LCBtZXRhS2V5LCBzaGlmdEtleSwgdGFyZ2V0OiBkb21zLmdldChlLnRhcmdldCBhcyBIVE1MRWxlbWVudCkhfVxuICAgICAgaWYgKHR5cGUgPT09IFwia2V5ZG93blwiICYmIGRvbS5vbmtleWRvd24pIGRvbS5vbmtleWRvd24oZXZlbnQpXG4gICAgICBlbHNlIGlmICh0eXBlID09PSBcImtleXVwXCIgJiYgZG9tLm9ua2V5dXApIGRvbS5vbmtleXVwKGV2ZW50KVxuICAgIH0pKVxuICAgIHJldHVybiBlbFxuXG4gIH1cbiAgY29uc3QgY3R4OiBWaWV3Q29udGV4dCA9IHtcbiAgICBhZGQ6IChwYXJlbnQ6IFZEb20sIC4uLmVsOiBWRG9tW10pID0+IHtcbiAgICAgIGVsZW1lbnRzLmdldChwYXJlbnQpPy5hcHBlbmQoLi4uZWwubWFwKGU9PnJlbmRlcihlKSkpXG4gICAgfSxcbiAgICBkZWw6IChlbDogVkRvbSkgPT4ge1xuICAgICAgZG9tcy5kZWxldGUoZWxlbWVudHMuZ2V0KGVsKSEpXG4gICAgICBlbGVtZW50cy5nZXQoZWwpPy5yZW1vdmUoKVxuICAgICAgZWxlbWVudHMuZGVsZXRlKGVsKVxuICAgIH0sXG4gICAgdXBkYXRlOiAoZWw6IFZEb20pID0+IHtcbiAgICAgIGxldCBvbGRlbCA9IGVsZW1lbnRzLmdldChlbCkhXG4gICAgICBpZiAoIW9sZGVsKSByZXR1cm5cbiAgICAgIG9sZGVsLnJlcGxhY2VXaXRoKHJlbmRlcihlbCkpXG4gICAgICBkb21zLmRlbGV0ZShvbGRlbClcbiAgICB9LFxuICAgIGxvY2F0aW9uLFxuICAgIHdpZHRoLFxuICAgIGhlaWdodCxcbiAgfVxuICBjdHhSZWYgPSBjdHhcbiAgcmV0dXJuIHJlbmRlcihta2VyKGN0eCkpIGFzIEhUTUxFbGVtZW50XG59XG5cblxuXG5cbnR5cGUgS2V5TGlzdGVuZXIgPSAoZTpLZXlib2FyZEV2ZW50KSA9PiB2b2lkXG50eXBlIE1vdXNlTGlzdGVuZXIgPSAoZTpNb3VzZUV2ZW50KSA9PiB2b2lkXG50eXBlIFN1YnNjcmliZXIgPSB7XG4gIFwib25rZXl1cFwiPyA6IEtleUxpc3RlbmVyXG4gIFwib25rZXlkb3duXCI/IDogS2V5TGlzdGVuZXJcbiAgXCJvbm1vdXNldXBcIj8gOiBNb3VzZUxpc3RlbmVyXG4gIFwib25tb3VzZWRvd25cIj8gOiBNb3VzZUxpc3RlbmVyXG4gIFwib25tb3VzZW1vdmVcIj8gOiBNb3VzZUxpc3RlbmVyXG4gIFwib25jbGlja1wiPyA6TW91c2VMaXN0ZW5lclxuICBcIm9ud2hlZWxcIj8gOiBNb3VzZUxpc3RlbmVyXG59O1xuXG50eXBlIENvbnRlbnQgPSBzdHJpbmcgfCBWRG9tIHwgQ29udGVudFtdIHwge2lkOiBzdHJpbmd9IHwge3N0eWxlOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+fSB8IFN1YnNjcmliZXIgfCB7dmFsdWU6IHN0cmluZ30gfCB7YXR0cnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz59XG5cblxuY29uc3QgbWtEb20gPSAodGFnOiBzdHJpbmcpID0+ICguLi5jb250ZW50OkNvbnRlbnRbXSkgPT57XG5cbiAgbGV0IGRtIDogVkRvbSA9IHt0YWc6IHRhZywgc3R5bGU6IHt9LCBhdHRyczoge30sIHRleHRDb250ZW50OiBcIlwiLCBpZDogXCJcIiwgY2hpbGRyZW46IFtdfTtcbiAgbGV0IHN0cmluZ3M6IHN0cmluZ1tdID0gW11cbiAgbGV0IGFkZGNvbnRlbnQgPSAoYzogQ29udGVudCkgPT4ge1xuICAgIGlmIChjIGluc3RhbmNlb2YgQXJyYXkpIGMuZm9yRWFjaChhZGRjb250ZW50KTtcbiAgICBlbHNlIGlmICh0eXBlb2YgYyA9PSBcInN0cmluZ1wiKSBzdHJpbmdzLnB1c2goYylcbiAgICBlbHNlIGlmIChjIGluc3RhbmNlb2YgT2JqZWN0KSB7XG4gICAgICBpZiAoXCJ0YWdcIiBpbiBjKSByZXR1cm4gZG0uY2hpbGRyZW4ucHVzaChjIGFzIFZEb20pXG4gICAgICBpZiAoXCJpZFwiIGluIGMpIGRtLmlkID0gYy5pZCBhcyBzdHJpbmc7XG4gICAgICBpZiAoXCJ2YWx1ZVwiIGluIGMpIGRtLnZhbHVlID0gYy52YWx1ZTtcbiAgICAgIGlmIChcImF0dHJzXCIgaW4gYykgT2JqZWN0LmVudHJpZXMoYy5hdHRycykuZm9yRWFjaCgoW2ssIHZdKSA9PiBkbS5hdHRyc1trXSA9IHYpXG4gICAgICBpZiAoXCJzdHlsZVwiIGluIGMpIE9iamVjdC5lbnRyaWVzKGMuc3R5bGUpLmZvckVhY2gocz0+IGRtLnN0eWxlW3NbMF0ucmVwbGFjZSgvKFtBLVpdKS9nLCAnLSQxJyldID0gc1sxXSlcbiAgICAgIGlmIChcIm9uY2xpY2tcIiBpbiBjKSBkbS5vbmNsaWNrID0gKGMgYXMgU3Vic2NyaWJlcikub25jbGlja1xuICAgICAgaWYgKFwib25tb3VzZWRvd25cIiBpbiBjKSBkbS5vbm1vdXNlZG93biA9IChjIGFzIFN1YnNjcmliZXIpLm9ubW91c2Vkb3duXG4gICAgICBpZiAoXCJvbm1vdXNldXBcIiBpbiBjKSBkbS5vbm1vdXNldXAgPSAoYyBhcyBTdWJzY3JpYmVyKS5vbm1vdXNldXBcbiAgICAgIGlmIChcIm9ubW91c2Vtb3ZlXCIgaW4gYykgZG0ub25tb3VzZW1vdmUgPSAoYyBhcyBTdWJzY3JpYmVyKS5vbm1vdXNlbW92ZVxuICAgICAgaWYgKFwib253aGVlbFwiIGluIGMpIGRtLm9ud2hlZWwgPSAoYyBhcyBTdWJzY3JpYmVyKS5vbndoZWVsXG4gICAgICBpZiAoXCJvbmtleWRvd25cIiBpbiBjKSBkbS5vbmtleWRvd24gPSAoYyBhcyBTdWJzY3JpYmVyKS5vbmtleWRvd25cbiAgICAgIGlmIChcIm9ua2V5dXBcIiBpbiBjKSBkbS5vbmtleXVwID0gKGMgYXMgU3Vic2NyaWJlcikub25rZXl1cFxuICAgIH1cbiAgfVxuXG4gIGFkZGNvbnRlbnQoY29udGVudClcbiAgZG0udGV4dENvbnRlbnQgKz0gc3RyaW5ncy5qb2luKFwiIFwiKVxuXG4gIHJldHVybiBkbVxufVxuXG5sZXQgZGl2PSBta0RvbShcImRpdlwiKVxubGV0IHN2ZyA9IG1rRG9tKFwic3ZnXCIpXG5sZXQgcGF0aCA9IG1rRG9tKFwicGF0aFwiKVxubGV0IGcgPSBta0RvbShcImdcIilcbmxldCByZWN0ID0gbWtEb20oXCJyZWN0XCIpXG5sZXQgdGV4dCA9IChhdHRyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiAsIC4uLmNvbnRlbnQ6IHN0cmluZ1tdKSA9PiAoe3RhZzogXCJ0ZXh0XCIsIHN0eWxlOiB7fSwgYXR0cnM6IGF0dHJzIGFzIHtwb3M6c3RyaW5nfSwgdGV4dENvbnRlbnQ6IGNvbnRlbnQuam9pbihcIiBcIiksIGlkOiBcIlwiLCBjaGlsZHJlbjogW119KTtcblxuY29uc3QgcG9wdXAgPSAoLi4uY3M6VkRvbVtdKT0+e1xuXG4gIGNvbnN0IGRpYWxvZ2ZpZWxkID0gZGl2KFxuICAgIHtcbiAgICAgIHN0eWxlOiB7XG4gICAgICAgIGJhY2tncm91bmQ6IFwidmFyKC0tYmFja2dyb3VuZC1jb2xvcilcIixcbiAgICAgICAgY29sb3I6IFwidmFyKC0tY29sb3IpXCIsXG4gICAgICAgIHBhZGRpbmc6IFwiMWVtXCIsXG4gICAgICAgIHBhZGRpbmdCb3R0b206IFwiMmVtXCIsXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIxZW1cIixcbiAgICAgICAgekluZGV4OiBcIjIwMDBcIixcbiAgICAgICAgb3ZlcmZsb3dZOiBcInNjcm9sbFwiLFxuICAgICAgfVxuICAgIH0sXG4gICAgLi4uY3MpXG5cbiAgY29uc3QgcG9wdXBiYWNrZ3JvdW5kID0gZGl2KFxuICAgIHtzdHlsZTp7XG4gICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgdG9wOiBcIjBcIixcbiAgICAgIGxlZnQ6IFwiMFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IFwicmdiYSgxNjYsIDE2NiwgMTY2LCAwLjUpXCIsXG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgYWxpZ25JdGVtczogXCJjZW50ZXJcIixcbiAgICAgIHpJbmRleDogXCIyMDAwXCIsXG4gICAgfX0sXG4gICAgZGlhbG9nZmllbGRcbiAgKVxuXG4gIHJldHVybiBwb3B1cGJhY2tncm91bmRcblxufVxuXG5cbmV4cG9ydCBjb25zdCBIVE1MID0ge1xuICBkaXYsXG4gIHN2ZyxcbiAgc3BhbjogbWtEb20oXCJzcGFuXCIpLFxuICBwOiBta0RvbShcInBcIiksXG4gIGgxOiBta0RvbShcImgxXCIpLFxuICBoMjogbWtEb20oXCJoMlwiKSxcbiAgaDM6IG1rRG9tKFwiaDNcIiksXG4gIGg0OiBta0RvbShcImg0XCIpLFxuICBoNTogbWtEb20oXCJoNVwiKSxcbiAgaDY6IG1rRG9tKFwiaDZcIiksXG4gIGE6IG1rRG9tKFwiYVwiKSxcbiAgYnV0dG9uOiBta0RvbShcImJ1dHRvblwiKSxcbiAgaW5wdXQ6IG1rRG9tKFwiaW5wdXRcIiksXG4gIHRleHRhcmVhOiBta0RvbShcInRleHRhcmVhXCIpLFxuICBwcmU6IG1rRG9tKFwicHJlXCIpLFxuICBzdmdQYXRoOiAocGF0aERhdGE6IHN0cmluZyB8IHN0cmluZ1tdLCBvcHRpb25zOiB7XG4gICAgdmlld0JveD86IHN0cmluZyxcbiAgICB3aWR0aD86IHN0cmluZyxcbiAgICBoZWlnaHQ/OiBzdHJpbmcsXG4gICAgZmlsbD86IHN0cmluZyxcbiAgICBzdHJva2U/OiBzdHJpbmcsXG4gICAgc3Ryb2tlV2lkdGg/OiBzdHJpbmdcbiAgfSA9IHt9LCAuLi5jaGlsZHJlbjogVkRvbVtdKSA9PiB7XG4gICAgY29uc3QgcGF0aHMgPSBwYXRoRGF0YSBpbnN0YW5jZW9mIEFycmF5ID8gcGF0aERhdGEgOiBbcGF0aERhdGFdXG4gICAgY29uc3QgeyB2aWV3Qm94ID0gXCIwIDAgMTAwIDEwMFwiLCB3aWR0aCA9IFwiMTAwXCIsIGhlaWdodCA9IFwiMTAwXCIsIGZpbGwgPSBcIm5vbmVcIiwgc3Ryb2tlID0gXCJ2YXIoLS1jb2xvcilcIiwgc3Ryb2tlV2lkdGggPSBcIjFcIiB9ID0gb3B0aW9uc1xuICAgIGNvbnN0IHBhdGhBdHRyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHsgZmlsbCwgc3Ryb2tlLCBcInN0cm9rZS13aWR0aFwiOiBzdHJva2VXaWR0aCB9XG4gICAgcmV0dXJuIHN2ZyhcbiAgICAgIHsgYXR0cnM6IHsgdmlld0JveCwgd2lkdGgsIGhlaWdodCwgeG1sbnM6IHN2Z05hbWVzcGFjZSB9IH0sXG4gICAgICAuLi5wYXRocy5tYXAoZCA9PiBwYXRoKHsgYXR0cnM6IHsgLi4ucGF0aEF0dHJzLCBkIH0gfSkpLFxuICAgICAgLi4uY2hpbGRyZW5cbiAgICApXG4gIH0sXG4gIHN2Z1RleHQ6IChcbiAgICBjb250ZW50OiBzdHJpbmcsXG4gICAgb3B0aW9uczoge1xuICAgICAgeD86IHN0cmluZyxcbiAgICAgIHk/OiBzdHJpbmcsXG4gICAgICBmaWxsPzogc3RyaW5nLFxuICAgICAgYmFja2dyb3VuZD86IHN0cmluZyxcbiAgICAgIGZvbnRTaXplPzogc3RyaW5nLFxuICAgICAgZm9udEZhbWlseT86IHN0cmluZyxcbiAgICAgIGZvbnRXZWlnaHQ/OiBzdHJpbmcsXG4gICAgICB0ZXh0QW5jaG9yPzogc3RyaW5nLFxuICAgICAgZG9taW5hbnRCYXNlbGluZT86IHN0cmluZyxcbiAgICAgIGR4Pzogc3RyaW5nLFxuICAgICAgZHk/OiBzdHJpbmdcbiAgICB9ID0ge31cbiAgKSA9PiB7XG4gICAgY29uc3QgZnMgPSBOdW1iZXIob3B0aW9ucy5mb250U2l6ZSA/PyAxMilcbiAgICBjb25zdCB4ID0gb3B0aW9ucy54ID8/IFwiNTBcIlxuICAgIGNvbnN0IHkgPSBvcHRpb25zLnkgPz8gXCI1MFwiXG4gICAgY29uc3QgYXR0cnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgICBmaWxsOiBvcHRpb25zLmZpbGwgPz8gXCJ2YXIoLS1jb2xvcilcIixcbiAgICAgIFwiZm9udC1zaXplXCI6IFN0cmluZyhmcyksXG4gICAgICB4LCB5LFxuICAgICAgXCJ0ZXh0LWFuY2hvclwiOiBvcHRpb25zLnRleHRBbmNob3IgPz8gXCJtaWRkbGVcIixcbiAgICAgIFwiZG9taW5hbnQtYmFzZWxpbmVcIjogb3B0aW9ucy5kb21pbmFudEJhc2VsaW5lID8/IFwibWlkZGxlXCIsXG4gICAgfVxuICAgIGlmIChvcHRpb25zLmZvbnRGYW1pbHkpIGF0dHJzW1wiZm9udC1mYW1pbHlcIl0gPSBvcHRpb25zLmZvbnRGYW1pbHlcbiAgICBpZiAob3B0aW9ucy5mb250V2VpZ2h0KSBhdHRyc1tcImZvbnQtd2VpZ2h0XCJdID0gb3B0aW9ucy5mb250V2VpZ2h0XG4gICAgaWYgKG9wdGlvbnMuZHgpIGF0dHJzLmR4ID0gb3B0aW9ucy5keFxuICAgIGlmIChvcHRpb25zLmR5KSBhdHRycy5keSA9IG9wdGlvbnMuZHlcbiAgICBjb25zdCB0ZXh0Tm9kZSA9IHRleHQoYXR0cnMsIGNvbnRlbnQpXG4gICAgaWYgKCFvcHRpb25zLmJhY2tncm91bmQpIHJldHVybiB0ZXh0Tm9kZVxuICAgIGNvbnN0IHBhZCA9IGZzICogMC40XG4gICAgY29uc3QgcncgPSBjb250ZW50Lmxlbmd0aCAqIGZzICogMC42ICsgcGFkICogMlxuICAgIGNvbnN0IHJoID0gZnMgKyBwYWQgKiAyXG4gICAgY29uc3QgcnggPSBOdW1iZXIoeCkgLSBydyAvIDJcbiAgICBjb25zdCByeSA9IE51bWJlcih5KSAtIHJoIC8gMlxuICAgIHJldHVybiBnKFxuICAgICAgcmVjdCh7IGF0dHJzOiB7IHg6IFN0cmluZyhyeCksIHk6IFN0cmluZyhyeSksIHdpZHRoOiBTdHJpbmcocncpLCBoZWlnaHQ6IFN0cmluZyhyaCksIGZpbGw6IG9wdGlvbnMuYmFja2dyb3VuZCwgcng6IFN0cmluZyhwYWQpIH0gfSksXG4gICAgICB0ZXh0Tm9kZSxcbiAgICApXG4gIH0sXG4gIHBvcHVwXG59XG4iLCAiZXhwb3J0IHR5cGUgUmVmID0gYCMke3N0cmluZ31gO1xuXG5jb25zdCBGTlZfT0ZGU0VUXzEgPSAweGNiZjI5Y2U0ODQyMjIzMjVuO1xuY29uc3QgRk5WX09GRlNFVF8yID0gMHg4NDIyMjMyNWNiZjI5Y2U0bjtcbmNvbnN0IEZOVl9QUklNRSA9IDB4MTAwMDAwMDAxYjNuO1xuY29uc3QgTUFTS182NCA9ICgxbiA8PCA2NG4pIC0gMW47XG5cbmNvbnN0IGhhc2g2NCA9ICh2YWx1ZTogc3RyaW5nLCBvZmZzZXQ6IGJpZ2ludCk6IGJpZ2ludCA9PiB7XG4gIGxldCBoYXNoID0gb2Zmc2V0O1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgaGFzaCBePSBCaWdJbnQodmFsdWUuY2hhckNvZGVBdChpKSk7XG4gICAgaGFzaCA9IChoYXNoICogRk5WX1BSSU1FKSAmIE1BU0tfNjQ7XG4gIH1cbiAgcmV0dXJuIGhhc2g7XG59O1xuXG5jb25zdCB0b0hleDY0ID0gKHZhbHVlOiBiaWdpbnQpID0+IHZhbHVlLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgxNiwgXCIwXCIpO1xuXG5leHBvcnQgY29uc3QgaGFzaDEyOCA9ICguLi5kYXRhOiBhbnkpOiBSZWYgPT4ge1xuICBjb25zdCBpbnB1dCA9IEpTT04uc3RyaW5naWZ5KGRhdGEpO1xuICBjb25zdCBoaWdoID0gaGFzaDY0KGlucHV0LCBGTlZfT0ZGU0VUXzEpO1xuICBjb25zdCBsb3cgPSBoYXNoNjQoaW5wdXQsIEZOVl9PRkZTRVRfMik7XG4gIHJldHVybiBgIyR7dG9IZXg2NChoaWdoKX0ke3RvSGV4NjQobG93KX1gIGFzIFJlZjtcbn07XG5cbmV4cG9ydCB0eXBlIEpzb25hYmxlID1cbiAgfCBzdHJpbmdcbiAgfCBudW1iZXJcbiAgfCBib29sZWFuXG4gIHwgbnVsbFxuICB8IEpzb25hYmxlW11cbiAgfCB7IFtrZXk6IHN0cmluZ106IEpzb25hYmxlIH07XG5cblxuZXhwb3J0IHR5cGUgTm90ZSA9IHsgaGFzaDogUmVmOyBkYXRhOiBKc29uYWJsZSB9O1xuXG5leHBvcnQgY29uc3QgdG9qc29uID0gKHg6IEpzb25hYmxlKSA9PiBKU09OLnN0cmluZ2lmeSh4LCBudWxsLCAyKTtcbmV4cG9ydCBjb25zdCBmcm9tanNvbiA9ICh4OiBzdHJpbmcpOiBKc29uYWJsZSA9PiBKU09OLnBhcnNlKHgpO1xuXG5leHBvcnQgY29uc3QgaXNSZWYgPSAodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBSZWYgPT5cbiAgdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiICYmIC9eIyhbYS1mMC05XXszMn0pJC9pLnRlc3QodmFsdWUpO1xuXG5leHBvcnQgY29uc3QgaGFzaERhdGEgPSAodmFsdWU6IEpzb25hYmxlKTogUmVmID0+IHtcbiAgaWYgKGlzUmVmKHZhbHVlKSkgcmV0dXJuIHZhbHVlO1xuICBpZiAoW1wic3RyaW5nXCIsIFwibnVtYmVyXCIsIFwiYm9vbGVhblwiXS5pbmNsdWRlcyh0eXBlb2YgdmFsdWUpIHx8IHZhbHVlID09PSBudWxsKSB7XG4gICAgcmV0dXJuIGhhc2gxMjgodG9qc29uKHZhbHVlKSk7XG4gIH1cbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSByZXR1cm4gaGFzaDEyOChcImFyclwiLCB2YWx1ZS5tYXAoaGFzaERhdGEpKTtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIil7XG4gICAgY29uc3QgZW50cmllcyA9IE9iamVjdC5lbnRyaWVzKHZhbHVlKVxuICAgICAgLnNvcnQoKFthXSwgW2JdKSA9PiAoYSA8IGIgPyAtMSA6IGEgPiBiID8gMSA6IDApKVxuICAgICAgLm1hcCgoW2ssIHZdKSA9PiBbaywgaGFzaERhdGEodildIGFzIGNvbnN0KTtcbiAgICByZXR1cm4gaGFzaDEyOCh0b2pzb24oT2JqZWN0LmZyb21FbnRyaWVzKGVudHJpZXMpKSk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKGB1bnN1cHBvcnRlZCB0eXBlIGZvciBoYXNoaW5nOiAke3R5cGVvZiB2YWx1ZX1gKTtcbn07XG4iLCAiaW1wb3J0IHsgZnJvbWpzb24sIGhhc2hEYXRhLCBpc1JlZiwgdG9qc29uLCB0eXBlIEpzb25hYmxlLCB0eXBlIFJlZiB9IGZyb20gXCJAaGFzaG5vdGVzL2NvcmUvbm90ZXNcIjtcblxuZXhwb3J0IHR5cGUgU2VydmVyTmFtZSA9IFwibG9jYWxcIiB8IFwibWFpbmNsb3VkXCI7XG50eXBlIENhY2hlT3B0aW9ucyA9IHsgc2tpcENhY2hlPzogYm9vbGVhbiB9O1xuXG5jb25zdCBEQl9OQU1FID0gXCJoYXNobm90ZXNcIjtcblxuY29uc3QgZW52ID0gKCkgPT4gKGdsb2JhbFRoaXMgYXMgYW55KT8ucHJvY2Vzcz8uZW52IGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IHVuZGVmaW5lZD4gfCB1bmRlZmluZWQ7XG5jb25zdCBLViA9ICgoKSA9PiB7XG4gIHRyeSB7IGlmICh0eXBlb2YgbG9jYWxTdG9yYWdlICE9PSBcInVuZGVmaW5lZFwiICYmIGxvY2FsU3RvcmFnZSkgcmV0dXJuIGxvY2FsU3RvcmFnZTsgfSBjYXRjaCB7fVxuICBjb25zdCBtID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgcmV0dXJuIHtcbiAgICBnZXRJdGVtOiAoazogc3RyaW5nKSA9PiBtLmdldChrKSA/PyBudWxsLFxuICAgIHNldEl0ZW06IChrOiBzdHJpbmcsIHY6IHN0cmluZykgPT4geyBtLnNldChrLCB2KTsgfSxcbiAgICByZW1vdmVJdGVtOiAoazogc3RyaW5nKSA9PiB7IG0uZGVsZXRlKGspOyB9LFxuICB9O1xufSkoKTtcblxubGV0IFNFUlZFUjogU2VydmVyTmFtZSA9ICgoKSA9PiB7XG4gIGNvbnN0IGUgPSBlbnYoKTtcbiAgY29uc3QgdiA9IGU/LkhBU0hOT1RFU19TRVJWRVI7XG4gIHJldHVybiB2ID09PSBcImxvY2FsXCIgfHwgdiA9PT0gXCJtYWluY2xvdWRcIiA/IHYgOiAoS1YuZ2V0SXRlbShcImRiX3ByZXNldFwiKSA9PT0gXCJsb2NhbFwiID8gXCJsb2NhbFwiIDogXCJtYWluY2xvdWRcIik7XG59KSgpO1xuXG5jb25zdCBiYXNlVXJsID0gKCk6IHN0cmluZyA9PiAoe1xuICBsb2NhbDogXCJodHRwOi8vbG9jYWxob3N0OjMwMDBcIixcbiAgbWFpbmNsb3VkOiBcImh0dHBzOi8vbWFpbmNsb3VkLnNwYWNldGltZWRiLmNvbVwiLFxufSlbU0VSVkVSXVxuXG5jb25zdCBhY2Nlc3NUb2tlbiA9IGFzeW5jICgpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+ID0+IHtcbiAgbGV0IHRva2Vua2V5ID0gKCkgPT4gYGFjY2Vzc190b2tlbjoke1NFUlZFUn1gO1xuICBsZXQgdGtleSA9IHRva2Vua2V5KCk7XG4gIGNvbnN0IGUgPSBlbnYoKTtcbiAgY29uc3QgZW52VG9rZW4gPSAoU0VSVkVSID09PSBcImxvY2FsXCIgPyBlPy5IQVNITk9URVNfQUNDRVNTX1RPS0VOX0xPQ0FMIDogZT8uSEFTSE5PVEVTX0FDQ0VTU19UT0tFTl9NQUlOQ0xPVUQpID8/IGU/LkhBU0hOT1RFU19BQ0NFU1NfVE9LRU47XG4gIGlmIChlbnZUb2tlbikgcmV0dXJuIGVudlRva2VuO1xuXG4gIGxldCB0b2tlbiA9IEtWLmdldEl0ZW0odGtleSlcbiAgaWYgKCF0b2tlbil7XG4gICAgdG9rZW4gPSBhd2FpdCBmZXRjaChgJHtiYXNlVXJsKCl9L3YxL2lkZW50aXR5YCwgeyBtZXRob2Q6IFwiUE9TVFwiLCBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0gfSlcbiAgICAudGhlbihyPT5yLmpzb24oKSkudGhlbihqPT5qLnRva2VuIHx8IG51bGwpXG4gICAgaWYgKHRrZXkgIT0gdG9rZW5rZXkoKSkgcmV0dXJuIGFjY2Vzc1Rva2VuKCk7XG4gICAgaWYgKHRva2VuKSBLVi5zZXRJdGVtKHRrZXksIHRva2VuKVxuICB9XG4gIHJldHVybiB0b2tlblxufTtcblxuZXhwb3J0IGNvbnN0IHNldFNlcnZlciA9ICh2YWx1ZTogU2VydmVyTmFtZSkgPT4ge1xuICBLVi5zZXRJdGVtKFwiZGJfcHJlc2V0XCIsIHZhbHVlKTtcbiAgU0VSVkVSID0gdmFsdWU7XG4gIGNvbnNvbGUubG9nKFwiY29ubmVjdCB0b1wiLCBTRVJWRVIpXG59O1xuXG5leHBvcnQgbGV0IGdldFNlcnZlciA9ICgpID0+IFNFUlZFUjtcbmNvbnNvbGUubG9nKFwiY29ubmVjdCB0b1wiLCBTRVJWRVIpXG5cbmNvbnN0IGNhbGwgPSBhc3luYyAobmFtZTogc3RyaW5nLCBwYXlsb2FkOiB1bmtub3duKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYCR7YmFzZVVybCgpfS92MS9kYXRhYmFzZS8ke0RCX05BTUV9L2NhbGwvJHtuYW1lfWAsIHtcbiAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgIGhlYWRlcnM6IHtcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiwgQXV0aG9yaXphdGlvbjogYXdhaXQgYWNjZXNzVG9rZW4oKS50aGVuKHQ9PnQ/YEJlYXJlciAke3R9YDonJyl9LFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpLFxuICB9KTtcbiAgY29uc3QgdGV4dCA9IGF3YWl0IHJlcy50ZXh0KCk7XG4gIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgRXJyb3IodGV4dCk7XG4gIHJldHVybiB0ZXh0O1xufTtcblxuLy8gU2VjdGlvbjogaW4tbWVtb3J5IG5vdGUgY2FjaGVcbmNvbnN0IG5vdGVDYWNoZSA9IG5ldyBNYXA8UmVmLCBKc29uYWJsZT4oKTtcbmNvbnN0IGFkZEluRmxpZ2h0ID0gbmV3IE1hcDxSZWYsIFByb21pc2U8UmVmPj4oKTtcbmNvbnN0IGdldEluRmxpZ2h0ID0gbmV3IE1hcDxSZWYsIFByb21pc2U8SnNvbmFibGU+PigpO1xuXG5leHBvcnQgY29uc3QgY2xlYXJOb3RlQ2FjaGUgPSAoKSA9PiB7XG4gIG5vdGVDYWNoZS5jbGVhcigpO1xuICBhZGRJbkZsaWdodC5jbGVhcigpO1xuICBnZXRJbkZsaWdodC5jbGVhcigpO1xufTtcblxuLy8gU2VjdGlvbjogbm90ZSBBUElcbmV4cG9ydCBjb25zdCBhZGROb3RlID0gYXN5bmMgKGRhdGE6IEpzb25hYmxlLCBvcHRpb25zOiBDYWNoZU9wdGlvbnMgPSB7fSk6IFByb21pc2U8UmVmPiA9PiB7XG4gIGNvbnN0IHsgc2tpcENhY2hlID0gZmFsc2UgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IGhhc2ggPSBoYXNoRGF0YShkYXRhKTtcblxuICBpZiAoIXNraXBDYWNoZSkge1xuICAgIGNvbnN0IGNhY2hlZCA9IG5vdGVDYWNoZS5nZXQoaGFzaCk7XG4gICAgaWYgKGNhY2hlZCAhPT0gdW5kZWZpbmVkKSByZXR1cm4gaGFzaDtcbiAgICBjb25zdCBwZW5kaW5nID0gYWRkSW5GbGlnaHQuZ2V0KGhhc2gpO1xuICAgIGlmIChwZW5kaW5nKSByZXR1cm4gcGVuZGluZztcbiAgfVxuXG4gIGNvbnN0IHAgPSAoYXN5bmMgKCkgPT4ge1xuICAgIGF3YWl0IGNhbGwoXCJhZGRfbm90ZVwiLCB7IGRhdGE6IHRvanNvbihkYXRhKSB9KTtcbiAgICBpZiAoIXNraXBDYWNoZSkgbm90ZUNhY2hlLnNldChoYXNoLCBkYXRhKTtcbiAgICByZXR1cm4gaGFzaDtcbiAgfSkoKTtcblxuICBpZiAoIXNraXBDYWNoZSkgYWRkSW5GbGlnaHQuc2V0KGhhc2gsIHApO1xuICB0cnkge1xuICAgIHJldHVybiBhd2FpdCBwO1xuICB9IGZpbmFsbHkge1xuICAgIGlmICghc2tpcENhY2hlKSBhZGRJbkZsaWdodC5kZWxldGUoaGFzaCk7XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBnZXROb3RlID0gYXN5bmMgKGhhc2g6IFJlZiwgb3B0aW9uczogQ2FjaGVPcHRpb25zID0ge30pOiBQcm9taXNlPEpzb25hYmxlPiA9PiB7XG4gIGNvbnN0IHsgc2tpcENhY2hlID0gZmFsc2UgfSA9IG9wdGlvbnM7XG5cbiAgaWYgKCFza2lwQ2FjaGUpIHtcbiAgICBjb25zdCBjYWNoZWQgPSBub3RlQ2FjaGUuZ2V0KGhhc2gpO1xuICAgIGlmIChjYWNoZWQgIT09IHVuZGVmaW5lZCkgcmV0dXJuIGNhY2hlZDtcblxuICAgIGNvbnN0IGFkZFBlbmRpbmcgPSBhZGRJbkZsaWdodC5nZXQoaGFzaCk7XG4gICAgaWYgKGFkZFBlbmRpbmcpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGFkZFBlbmRpbmc7XG4gICAgICAgIGNvbnN0IGFmdGVyQWRkID0gbm90ZUNhY2hlLmdldChoYXNoKTtcbiAgICAgICAgaWYgKGFmdGVyQWRkICE9PSB1bmRlZmluZWQpIHJldHVybiBhZnRlckFkZDtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvLyBmYWxsIHRocm91Z2hcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBwZW5kaW5nID0gZ2V0SW5GbGlnaHQuZ2V0KGhhc2gpO1xuICAgIGlmIChwZW5kaW5nKSByZXR1cm4gcGVuZGluZztcbiAgfVxuXG4gIGNvbnN0IHAgPSAoYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHdpcmVWYWx1ZSA9IGF3YWl0IGNhbGwoXCJnZXRfbm90ZVwiLCB7IGhhc2ggfSk7XG4gICAgY29uc3QgZGF0YSA9IGZyb21qc29uKGZyb21qc29uKHdpcmVWYWx1ZSkgYXMgc3RyaW5nKTtcbiAgICBpZiAoIXNraXBDYWNoZSkgbm90ZUNhY2hlLnNldChoYXNoLCBkYXRhKTtcbiAgICByZXR1cm4gZGF0YTtcbiAgfSkoKTtcblxuICBpZiAoIXNraXBDYWNoZSkgZ2V0SW5GbGlnaHQuc2V0KGhhc2gsIHApO1xuICB0cnkge1xuICAgIHJldHVybiBhd2FpdCBwO1xuICB9IGZpbmFsbHkge1xuICAgIGlmICghc2tpcENhY2hlKSBnZXRJbkZsaWdodC5kZWxldGUoaGFzaCk7XG4gIH1cbn07XG5cblxuZXhwb3J0IGNvbnN0IGRlUmVmID0gYXN5bmMgKHZhbHVlOiBKc29uYWJsZSk6IFByb21pc2U8SnNvbmFibGU+ID0+ICBpc1JlZih2YWx1ZSkgPyBnZXROb3RlKHZhbHVlKS50aGVuKGRlUmVmKSA6IHZhbHVlO1xuZXhwb3J0IGNvbnN0IGFzUmVmID0gYXN5bmMgKHZhbHVlOiBSZWYgfCBKc29uYWJsZSk6IFByb21pc2U8UmVmPiA9PiBpc1JlZih2YWx1ZSkgPyB2YWx1ZSA6IGFkZE5vdGUodmFsdWUpO1xuXG5leHBvcnQgY29uc3QgY2FsbE5vdGUgPSBhc3luYyAoZm46IFJlZiB8IEpzb25hYmxlLCBhcmdzPzogUmVmIHwgSnNvbmFibGUpOiBQcm9taXNlPEpzb25hYmxlPiA9PiB7XG4gIGNvbnN0IGZuUmVmID0gYXdhaXQgYXNSZWYoZm4pO1xuICBjb25zdCBhcmdzUmVmID0gYXdhaXQgYXNSZWYoYXJncyA9PT0gdW5kZWZpbmVkID8gW10gOiBhcmdzKTtcbiAgcmV0dXJuIGF3YWl0IGNhbGwoXCJjYWxsX25vdGVcIiwgeyBmbjogZm5SZWYsIGFyZzogYXJnc1JlZiB9KS50aGVuKGZyb21qc29uKS50aGVuKGRlUmVmKVxufTtcbiIsICIvLyBUaGlzIGZpbGUgd2FzIGdlbmVyYXRlZC4gRG8gbm90IG1vZGlmeSBtYW51YWxseSFcbnZhciBhc3RyYWxJZGVudGlmaWVyQ29kZXMgPSBbNTA5LCAwLCAyMjcsIDAsIDE1MCwgNCwgMjk0LCA5LCAxMzY4LCAyLCAyLCAxLCA2LCAzLCA0MSwgMiwgNSwgMCwgMTY2LCAxLCA1NzQsIDMsIDksIDksIDcsIDksIDMyLCA0LCAzMTgsIDEsIDgwLCAzLCA3MSwgMTAsIDUwLCAzLCAxMjMsIDIsIDU0LCAxNCwgMzIsIDEwLCAzLCAxLCAxMSwgMywgNDYsIDEwLCA4LCAwLCA0NiwgOSwgNywgMiwgMzcsIDEzLCAyLCA5LCA2LCAxLCA0NSwgMCwgMTMsIDIsIDQ5LCAxMywgOSwgMywgMiwgMTEsIDgzLCAxMSwgNywgMCwgMywgMCwgMTU4LCAxMSwgNiwgOSwgNywgMywgNTYsIDEsIDIsIDYsIDMsIDEsIDMsIDIsIDEwLCAwLCAxMSwgMSwgMywgNiwgNCwgNCwgNjgsIDgsIDIsIDAsIDMsIDAsIDIsIDMsIDIsIDQsIDIsIDAsIDE1LCAxLCA4MywgMTcsIDEwLCA5LCA1LCAwLCA4MiwgMTksIDEzLCA5LCAyMTQsIDYsIDMsIDgsIDI4LCAxLCA4MywgMTYsIDE2LCA5LCA4MiwgMTIsIDksIDksIDcsIDE5LCA1OCwgMTQsIDUsIDksIDI0MywgMTQsIDE2NiwgOSwgNzEsIDUsIDIsIDEsIDMsIDMsIDIsIDAsIDIsIDEsIDEzLCA5LCAxMjAsIDYsIDMsIDYsIDQsIDAsIDI5LCA5LCA0MSwgNiwgMiwgMywgOSwgMCwgMTAsIDEwLCA0NywgMTUsIDM0MywgOSwgNTQsIDcsIDIsIDcsIDE3LCA5LCA1NywgMjEsIDIsIDEzLCAxMjMsIDUsIDQsIDAsIDIsIDEsIDIsIDYsIDIsIDAsIDksIDksIDQ5LCA0LCAyLCAxLCAyLCA0LCA5LCA5LCAzMzAsIDMsIDEwLCAxLCAyLCAwLCA0OSwgNiwgNCwgNCwgMTQsIDEwLCA1MzUwLCAwLCA3LCAxNCwgMTE0NjUsIDI3LCAyMzQzLCA5LCA4NywgOSwgMzksIDQsIDYwLCA2LCAyNiwgOSwgNTM1LCA5LCA0NzAsIDAsIDIsIDU0LCA4LCAzLCA4MiwgMCwgMTIsIDEsIDE5NjI4LCAxLCA0MTc4LCA5LCA1MTksIDQ1LCAzLCAyMiwgNTQzLCA0LCA0LCA1LCA5LCA3LCAzLCA2LCAzMSwgMywgMTQ5LCAyLCAxNDE4LCA0OSwgNTEzLCA1NCwgNSwgNDksIDksIDAsIDE1LCAwLCAyMywgNCwgMiwgMTQsIDEzNjEsIDYsIDIsIDE2LCAzLCA2LCAyLCAxLCAyLCA0LCAxMDEsIDAsIDE2MSwgNiwgMTAsIDksIDM1NywgMCwgNjIsIDEzLCA0OTksIDEzLCAyNDUsIDEsIDIsIDksIDcyNiwgNiwgMTEwLCA2LCA2LCA5LCA0NzU5LCA5LCA3ODc3MTksIDIzOV07XG5cbi8vIFRoaXMgZmlsZSB3YXMgZ2VuZXJhdGVkLiBEbyBub3QgbW9kaWZ5IG1hbnVhbGx5IVxudmFyIGFzdHJhbElkZW50aWZpZXJTdGFydENvZGVzID0gWzAsIDExLCAyLCAyNSwgMiwgMTgsIDIsIDEsIDIsIDE0LCAzLCAxMywgMzUsIDEyMiwgNzAsIDUyLCAyNjgsIDI4LCA0LCA0OCwgNDgsIDMxLCAxNCwgMjksIDYsIDM3LCAxMSwgMjksIDMsIDM1LCA1LCA3LCAyLCA0LCA0MywgMTU3LCAxOSwgMzUsIDUsIDM1LCA1LCAzOSwgOSwgNTEsIDEzLCAxMCwgMiwgMTQsIDIsIDYsIDIsIDEsIDIsIDEwLCAyLCAxNCwgMiwgNiwgMiwgMSwgNCwgNTEsIDEzLCAzMTAsIDEwLCAyMSwgMTEsIDcsIDI1LCA1LCAyLCA0MSwgMiwgOCwgNzAsIDUsIDMsIDAsIDIsIDQzLCAyLCAxLCA0LCAwLCAzLCAyMiwgMTEsIDIyLCAxMCwgMzAsIDY2LCAxOCwgMiwgMSwgMTEsIDIxLCAxMSwgMjUsIDcxLCA1NSwgNywgMSwgNjUsIDAsIDE2LCAzLCAyLCAyLCAyLCAyOCwgNDMsIDI4LCA0LCAyOCwgMzYsIDcsIDIsIDI3LCAyOCwgNTMsIDExLCAyMSwgMTEsIDE4LCAxNCwgMTcsIDExMSwgNzIsIDU2LCA1MCwgMTQsIDUwLCAxNCwgMzUsIDM5LCAyNywgMTAsIDIyLCAyNTEsIDQxLCA3LCAxLCAxNywgMiwgNjAsIDI4LCAxMSwgMCwgOSwgMjEsIDQzLCAxNywgNDcsIDIwLCAyOCwgMjIsIDEzLCA1MiwgNTgsIDEsIDMsIDAsIDE0LCA0NCwgMzMsIDI0LCAyNywgMzUsIDMwLCAwLCAzLCAwLCA5LCAzNCwgNCwgMCwgMTMsIDQ3LCAxNSwgMywgMjIsIDAsIDIsIDAsIDM2LCAxNywgMiwgMjQsIDIwLCAxLCA2NCwgNiwgMiwgMCwgMiwgMywgMiwgMTQsIDIsIDksIDgsIDQ2LCAzOSwgNywgMywgMSwgMywgMjEsIDIsIDYsIDIsIDEsIDIsIDQsIDQsIDAsIDE5LCAwLCAxMywgNCwgMzEsIDksIDIsIDAsIDMsIDAsIDIsIDM3LCAyLCAwLCAyNiwgMCwgMiwgMCwgNDUsIDUyLCAxOSwgMywgMjEsIDIsIDMxLCA0NywgMjEsIDEsIDIsIDAsIDE4NSwgNDYsIDQyLCAzLCAzNywgNDcsIDIxLCAwLCA2MCwgNDIsIDE0LCAwLCA3MiwgMjYsIDM4LCA2LCAxODYsIDQzLCAxMTcsIDYzLCAzMiwgNywgMywgMCwgMywgNywgMiwgMSwgMiwgMjMsIDE2LCAwLCAyLCAwLCA5NSwgNywgMywgMzgsIDE3LCAwLCAyLCAwLCAyOSwgMCwgMTEsIDM5LCA4LCAwLCAyMiwgMCwgMTIsIDQ1LCAyMCwgMCwgMTksIDcyLCAyMDAsIDMyLCAzMiwgOCwgMiwgMzYsIDE4LCAwLCA1MCwgMjksIDExMywgNiwgMiwgMSwgMiwgMzcsIDIyLCAwLCAyNiwgNSwgMiwgMSwgMiwgMzEsIDE1LCAwLCAzMjgsIDE4LCAxNiwgMCwgMiwgMTIsIDIsIDMzLCAxMjUsIDAsIDgwLCA5MjEsIDEwMywgMTEwLCAxOCwgMTk1LCAyNjM3LCA5NiwgMTYsIDEwNzEsIDE4LCA1LCAyNiwgMzk5NCwgNiwgNTgyLCA2ODQyLCAyOSwgMTc2MywgNTY4LCA4LCAzMCwgMTgsIDc4LCAxOCwgMjksIDE5LCA0NywgMTcsIDMsIDMyLCAyMCwgNiwgMTgsIDQzMywgNDQsIDIxMiwgNjMsIDEyOSwgNzQsIDYsIDAsIDY3LCAxMiwgNjUsIDEsIDIsIDAsIDI5LCA2MTM1LCA5LCAxMjM3LCA0MiwgOSwgODkzNiwgMywgMiwgNiwgMiwgMSwgMiwgMjkwLCAxNiwgMCwgMzAsIDIsIDMsIDAsIDE1LCAzLCA5LCAzOTUsIDIzMDksIDEwNiwgNiwgMTIsIDQsIDgsIDgsIDksIDU5OTEsIDg0LCAyLCA3MCwgMiwgMSwgMywgMCwgMywgMSwgMywgMywgMiwgMTEsIDIsIDAsIDIsIDYsIDIsIDY0LCAyLCAzLCAzLCA3LCAyLCA2LCAyLCAyNywgMiwgMywgMiwgNCwgMiwgMCwgNCwgNiwgMiwgMzM5LCAzLCAyNCwgMiwgMjQsIDIsIDMwLCAyLCAyNCwgMiwgMzAsIDIsIDI0LCAyLCAzMCwgMiwgMjQsIDIsIDMwLCAyLCAyNCwgMiwgNywgMTg0NSwgMzAsIDcsIDUsIDI2MiwgNjEsIDE0NywgNDQsIDExLCA2LCAxNywgMCwgMzIyLCAyOSwgMTksIDQzLCA0ODUsIDI3LCAyMjksIDI5LCAzLCAwLCA0OTYsIDYsIDIsIDMsIDIsIDEsIDIsIDE0LCAyLCAxOTYsIDYwLCA2NywgOCwgMCwgMTIwNSwgMywgMiwgMjYsIDIsIDEsIDIsIDAsIDMsIDAsIDIsIDksIDIsIDMsIDIsIDAsIDIsIDAsIDcsIDAsIDUsIDAsIDIsIDAsIDIsIDAsIDIsIDIsIDIsIDEsIDIsIDAsIDMsIDAsIDIsIDAsIDIsIDAsIDIsIDAsIDIsIDAsIDIsIDEsIDIsIDAsIDMsIDMsIDIsIDYsIDIsIDMsIDIsIDMsIDIsIDAsIDIsIDksIDIsIDE2LCA2LCAyLCAyLCA0LCAyLCAxNiwgNDQyMSwgNDI3MTksIDMzLCA0MTUzLCA3LCAyMjEsIDMsIDU3NjEsIDE1LCA3NDcyLCAxNiwgNjIxLCAyNDY3LCA1NDEsIDE1MDcsIDQ5MzgsIDYsIDQxOTFdO1xuXG4vLyBUaGlzIGZpbGUgd2FzIGdlbmVyYXRlZC4gRG8gbm90IG1vZGlmeSBtYW51YWxseSFcbnZhciBub25BU0NJSWlkZW50aWZpZXJDaGFycyA9IFwiXFx1MjAwY1xcdTIwMGRcXHhiN1xcdTAzMDAtXFx1MDM2ZlxcdTAzODdcXHUwNDgzLVxcdTA0ODdcXHUwNTkxLVxcdTA1YmRcXHUwNWJmXFx1MDVjMVxcdTA1YzJcXHUwNWM0XFx1MDVjNVxcdTA1YzdcXHUwNjEwLVxcdTA2MWFcXHUwNjRiLVxcdTA2NjlcXHUwNjcwXFx1MDZkNi1cXHUwNmRjXFx1MDZkZi1cXHUwNmU0XFx1MDZlN1xcdTA2ZThcXHUwNmVhLVxcdTA2ZWRcXHUwNmYwLVxcdTA2ZjlcXHUwNzExXFx1MDczMC1cXHUwNzRhXFx1MDdhNi1cXHUwN2IwXFx1MDdjMC1cXHUwN2M5XFx1MDdlYi1cXHUwN2YzXFx1MDdmZFxcdTA4MTYtXFx1MDgxOVxcdTA4MWItXFx1MDgyM1xcdTA4MjUtXFx1MDgyN1xcdTA4MjktXFx1MDgyZFxcdTA4NTktXFx1MDg1YlxcdTA4OTctXFx1MDg5ZlxcdTA4Y2EtXFx1MDhlMVxcdTA4ZTMtXFx1MDkwM1xcdTA5M2EtXFx1MDkzY1xcdTA5M2UtXFx1MDk0ZlxcdTA5NTEtXFx1MDk1N1xcdTA5NjJcXHUwOTYzXFx1MDk2Ni1cXHUwOTZmXFx1MDk4MS1cXHUwOTgzXFx1MDliY1xcdTA5YmUtXFx1MDljNFxcdTA5YzdcXHUwOWM4XFx1MDljYi1cXHUwOWNkXFx1MDlkN1xcdTA5ZTJcXHUwOWUzXFx1MDllNi1cXHUwOWVmXFx1MDlmZVxcdTBhMDEtXFx1MGEwM1xcdTBhM2NcXHUwYTNlLVxcdTBhNDJcXHUwYTQ3XFx1MGE0OFxcdTBhNGItXFx1MGE0ZFxcdTBhNTFcXHUwYTY2LVxcdTBhNzFcXHUwYTc1XFx1MGE4MS1cXHUwYTgzXFx1MGFiY1xcdTBhYmUtXFx1MGFjNVxcdTBhYzctXFx1MGFjOVxcdTBhY2ItXFx1MGFjZFxcdTBhZTJcXHUwYWUzXFx1MGFlNi1cXHUwYWVmXFx1MGFmYS1cXHUwYWZmXFx1MGIwMS1cXHUwYjAzXFx1MGIzY1xcdTBiM2UtXFx1MGI0NFxcdTBiNDdcXHUwYjQ4XFx1MGI0Yi1cXHUwYjRkXFx1MGI1NS1cXHUwYjU3XFx1MGI2MlxcdTBiNjNcXHUwYjY2LVxcdTBiNmZcXHUwYjgyXFx1MGJiZS1cXHUwYmMyXFx1MGJjNi1cXHUwYmM4XFx1MGJjYS1cXHUwYmNkXFx1MGJkN1xcdTBiZTYtXFx1MGJlZlxcdTBjMDAtXFx1MGMwNFxcdTBjM2NcXHUwYzNlLVxcdTBjNDRcXHUwYzQ2LVxcdTBjNDhcXHUwYzRhLVxcdTBjNGRcXHUwYzU1XFx1MGM1NlxcdTBjNjJcXHUwYzYzXFx1MGM2Ni1cXHUwYzZmXFx1MGM4MS1cXHUwYzgzXFx1MGNiY1xcdTBjYmUtXFx1MGNjNFxcdTBjYzYtXFx1MGNjOFxcdTBjY2EtXFx1MGNjZFxcdTBjZDVcXHUwY2Q2XFx1MGNlMlxcdTBjZTNcXHUwY2U2LVxcdTBjZWZcXHUwY2YzXFx1MGQwMC1cXHUwZDAzXFx1MGQzYlxcdTBkM2NcXHUwZDNlLVxcdTBkNDRcXHUwZDQ2LVxcdTBkNDhcXHUwZDRhLVxcdTBkNGRcXHUwZDU3XFx1MGQ2MlxcdTBkNjNcXHUwZDY2LVxcdTBkNmZcXHUwZDgxLVxcdTBkODNcXHUwZGNhXFx1MGRjZi1cXHUwZGQ0XFx1MGRkNlxcdTBkZDgtXFx1MGRkZlxcdTBkZTYtXFx1MGRlZlxcdTBkZjJcXHUwZGYzXFx1MGUzMVxcdTBlMzQtXFx1MGUzYVxcdTBlNDctXFx1MGU0ZVxcdTBlNTAtXFx1MGU1OVxcdTBlYjFcXHUwZWI0LVxcdTBlYmNcXHUwZWM4LVxcdTBlY2VcXHUwZWQwLVxcdTBlZDlcXHUwZjE4XFx1MGYxOVxcdTBmMjAtXFx1MGYyOVxcdTBmMzVcXHUwZjM3XFx1MGYzOVxcdTBmM2VcXHUwZjNmXFx1MGY3MS1cXHUwZjg0XFx1MGY4NlxcdTBmODdcXHUwZjhkLVxcdTBmOTdcXHUwZjk5LVxcdTBmYmNcXHUwZmM2XFx1MTAyYi1cXHUxMDNlXFx1MTA0MC1cXHUxMDQ5XFx1MTA1Ni1cXHUxMDU5XFx1MTA1ZS1cXHUxMDYwXFx1MTA2Mi1cXHUxMDY0XFx1MTA2Ny1cXHUxMDZkXFx1MTA3MS1cXHUxMDc0XFx1MTA4Mi1cXHUxMDhkXFx1MTA4Zi1cXHUxMDlkXFx1MTM1ZC1cXHUxMzVmXFx1MTM2OS1cXHUxMzcxXFx1MTcxMi1cXHUxNzE1XFx1MTczMi1cXHUxNzM0XFx1MTc1MlxcdTE3NTNcXHUxNzcyXFx1MTc3M1xcdTE3YjQtXFx1MTdkM1xcdTE3ZGRcXHUxN2UwLVxcdTE3ZTlcXHUxODBiLVxcdTE4MGRcXHUxODBmLVxcdTE4MTlcXHUxOGE5XFx1MTkyMC1cXHUxOTJiXFx1MTkzMC1cXHUxOTNiXFx1MTk0Ni1cXHUxOTRmXFx1MTlkMC1cXHUxOWRhXFx1MWExNy1cXHUxYTFiXFx1MWE1NS1cXHUxYTVlXFx1MWE2MC1cXHUxYTdjXFx1MWE3Zi1cXHUxYTg5XFx1MWE5MC1cXHUxYTk5XFx1MWFiMC1cXHUxYWJkXFx1MWFiZi1cXHUxYWNlXFx1MWIwMC1cXHUxYjA0XFx1MWIzNC1cXHUxYjQ0XFx1MWI1MC1cXHUxYjU5XFx1MWI2Yi1cXHUxYjczXFx1MWI4MC1cXHUxYjgyXFx1MWJhMS1cXHUxYmFkXFx1MWJiMC1cXHUxYmI5XFx1MWJlNi1cXHUxYmYzXFx1MWMyNC1cXHUxYzM3XFx1MWM0MC1cXHUxYzQ5XFx1MWM1MC1cXHUxYzU5XFx1MWNkMC1cXHUxY2QyXFx1MWNkNC1cXHUxY2U4XFx1MWNlZFxcdTFjZjRcXHUxY2Y3LVxcdTFjZjlcXHUxZGMwLVxcdTFkZmZcXHUyMDBjXFx1MjAwZFxcdTIwM2ZcXHUyMDQwXFx1MjA1NFxcdTIwZDAtXFx1MjBkY1xcdTIwZTFcXHUyMGU1LVxcdTIwZjBcXHUyY2VmLVxcdTJjZjFcXHUyZDdmXFx1MmRlMC1cXHUyZGZmXFx1MzAyYS1cXHUzMDJmXFx1MzA5OVxcdTMwOWFcXHUzMGZiXFx1YTYyMC1cXHVhNjI5XFx1YTY2ZlxcdWE2NzQtXFx1YTY3ZFxcdWE2OWVcXHVhNjlmXFx1YTZmMFxcdWE2ZjFcXHVhODAyXFx1YTgwNlxcdWE4MGJcXHVhODIzLVxcdWE4MjdcXHVhODJjXFx1YTg4MFxcdWE4ODFcXHVhOGI0LVxcdWE4YzVcXHVhOGQwLVxcdWE4ZDlcXHVhOGUwLVxcdWE4ZjFcXHVhOGZmLVxcdWE5MDlcXHVhOTI2LVxcdWE5MmRcXHVhOTQ3LVxcdWE5NTNcXHVhOTgwLVxcdWE5ODNcXHVhOWIzLVxcdWE5YzBcXHVhOWQwLVxcdWE5ZDlcXHVhOWU1XFx1YTlmMC1cXHVhOWY5XFx1YWEyOS1cXHVhYTM2XFx1YWE0M1xcdWFhNGNcXHVhYTRkXFx1YWE1MC1cXHVhYTU5XFx1YWE3Yi1cXHVhYTdkXFx1YWFiMFxcdWFhYjItXFx1YWFiNFxcdWFhYjdcXHVhYWI4XFx1YWFiZVxcdWFhYmZcXHVhYWMxXFx1YWFlYi1cXHVhYWVmXFx1YWFmNVxcdWFhZjZcXHVhYmUzLVxcdWFiZWFcXHVhYmVjXFx1YWJlZFxcdWFiZjAtXFx1YWJmOVxcdWZiMWVcXHVmZTAwLVxcdWZlMGZcXHVmZTIwLVxcdWZlMmZcXHVmZTMzXFx1ZmUzNFxcdWZlNGQtXFx1ZmU0ZlxcdWZmMTAtXFx1ZmYxOVxcdWZmM2ZcXHVmZjY1XCI7XG5cbi8vIFRoaXMgZmlsZSB3YXMgZ2VuZXJhdGVkLiBEbyBub3QgbW9kaWZ5IG1hbnVhbGx5IVxudmFyIG5vbkFTQ0lJaWRlbnRpZmllclN0YXJ0Q2hhcnMgPSBcIlxceGFhXFx4YjVcXHhiYVxceGMwLVxceGQ2XFx4ZDgtXFx4ZjZcXHhmOC1cXHUwMmMxXFx1MDJjNi1cXHUwMmQxXFx1MDJlMC1cXHUwMmU0XFx1MDJlY1xcdTAyZWVcXHUwMzcwLVxcdTAzNzRcXHUwMzc2XFx1MDM3N1xcdTAzN2EtXFx1MDM3ZFxcdTAzN2ZcXHUwMzg2XFx1MDM4OC1cXHUwMzhhXFx1MDM4Y1xcdTAzOGUtXFx1MDNhMVxcdTAzYTMtXFx1MDNmNVxcdTAzZjctXFx1MDQ4MVxcdTA0OGEtXFx1MDUyZlxcdTA1MzEtXFx1MDU1NlxcdTA1NTlcXHUwNTYwLVxcdTA1ODhcXHUwNWQwLVxcdTA1ZWFcXHUwNWVmLVxcdTA1ZjJcXHUwNjIwLVxcdTA2NGFcXHUwNjZlXFx1MDY2ZlxcdTA2NzEtXFx1MDZkM1xcdTA2ZDVcXHUwNmU1XFx1MDZlNlxcdTA2ZWVcXHUwNmVmXFx1MDZmYS1cXHUwNmZjXFx1MDZmZlxcdTA3MTBcXHUwNzEyLVxcdTA3MmZcXHUwNzRkLVxcdTA3YTVcXHUwN2IxXFx1MDdjYS1cXHUwN2VhXFx1MDdmNFxcdTA3ZjVcXHUwN2ZhXFx1MDgwMC1cXHUwODE1XFx1MDgxYVxcdTA4MjRcXHUwODI4XFx1MDg0MC1cXHUwODU4XFx1MDg2MC1cXHUwODZhXFx1MDg3MC1cXHUwODg3XFx1MDg4OS1cXHUwODhlXFx1MDhhMC1cXHUwOGM5XFx1MDkwNC1cXHUwOTM5XFx1MDkzZFxcdTA5NTBcXHUwOTU4LVxcdTA5NjFcXHUwOTcxLVxcdTA5ODBcXHUwOTg1LVxcdTA5OGNcXHUwOThmXFx1MDk5MFxcdTA5OTMtXFx1MDlhOFxcdTA5YWEtXFx1MDliMFxcdTA5YjJcXHUwOWI2LVxcdTA5YjlcXHUwOWJkXFx1MDljZVxcdTA5ZGNcXHUwOWRkXFx1MDlkZi1cXHUwOWUxXFx1MDlmMFxcdTA5ZjFcXHUwOWZjXFx1MGEwNS1cXHUwYTBhXFx1MGEwZlxcdTBhMTBcXHUwYTEzLVxcdTBhMjhcXHUwYTJhLVxcdTBhMzBcXHUwYTMyXFx1MGEzM1xcdTBhMzVcXHUwYTM2XFx1MGEzOFxcdTBhMzlcXHUwYTU5LVxcdTBhNWNcXHUwYTVlXFx1MGE3Mi1cXHUwYTc0XFx1MGE4NS1cXHUwYThkXFx1MGE4Zi1cXHUwYTkxXFx1MGE5My1cXHUwYWE4XFx1MGFhYS1cXHUwYWIwXFx1MGFiMlxcdTBhYjNcXHUwYWI1LVxcdTBhYjlcXHUwYWJkXFx1MGFkMFxcdTBhZTBcXHUwYWUxXFx1MGFmOVxcdTBiMDUtXFx1MGIwY1xcdTBiMGZcXHUwYjEwXFx1MGIxMy1cXHUwYjI4XFx1MGIyYS1cXHUwYjMwXFx1MGIzMlxcdTBiMzNcXHUwYjM1LVxcdTBiMzlcXHUwYjNkXFx1MGI1Y1xcdTBiNWRcXHUwYjVmLVxcdTBiNjFcXHUwYjcxXFx1MGI4M1xcdTBiODUtXFx1MGI4YVxcdTBiOGUtXFx1MGI5MFxcdTBiOTItXFx1MGI5NVxcdTBiOTlcXHUwYjlhXFx1MGI5Y1xcdTBiOWVcXHUwYjlmXFx1MGJhM1xcdTBiYTRcXHUwYmE4LVxcdTBiYWFcXHUwYmFlLVxcdTBiYjlcXHUwYmQwXFx1MGMwNS1cXHUwYzBjXFx1MGMwZS1cXHUwYzEwXFx1MGMxMi1cXHUwYzI4XFx1MGMyYS1cXHUwYzM5XFx1MGMzZFxcdTBjNTgtXFx1MGM1YVxcdTBjNWRcXHUwYzYwXFx1MGM2MVxcdTBjODBcXHUwYzg1LVxcdTBjOGNcXHUwYzhlLVxcdTBjOTBcXHUwYzkyLVxcdTBjYThcXHUwY2FhLVxcdTBjYjNcXHUwY2I1LVxcdTBjYjlcXHUwY2JkXFx1MGNkZFxcdTBjZGVcXHUwY2UwXFx1MGNlMVxcdTBjZjFcXHUwY2YyXFx1MGQwNC1cXHUwZDBjXFx1MGQwZS1cXHUwZDEwXFx1MGQxMi1cXHUwZDNhXFx1MGQzZFxcdTBkNGVcXHUwZDU0LVxcdTBkNTZcXHUwZDVmLVxcdTBkNjFcXHUwZDdhLVxcdTBkN2ZcXHUwZDg1LVxcdTBkOTZcXHUwZDlhLVxcdTBkYjFcXHUwZGIzLVxcdTBkYmJcXHUwZGJkXFx1MGRjMC1cXHUwZGM2XFx1MGUwMS1cXHUwZTMwXFx1MGUzMlxcdTBlMzNcXHUwZTQwLVxcdTBlNDZcXHUwZTgxXFx1MGU4MlxcdTBlODRcXHUwZTg2LVxcdTBlOGFcXHUwZThjLVxcdTBlYTNcXHUwZWE1XFx1MGVhNy1cXHUwZWIwXFx1MGViMlxcdTBlYjNcXHUwZWJkXFx1MGVjMC1cXHUwZWM0XFx1MGVjNlxcdTBlZGMtXFx1MGVkZlxcdTBmMDBcXHUwZjQwLVxcdTBmNDdcXHUwZjQ5LVxcdTBmNmNcXHUwZjg4LVxcdTBmOGNcXHUxMDAwLVxcdTEwMmFcXHUxMDNmXFx1MTA1MC1cXHUxMDU1XFx1MTA1YS1cXHUxMDVkXFx1MTA2MVxcdTEwNjVcXHUxMDY2XFx1MTA2ZS1cXHUxMDcwXFx1MTA3NS1cXHUxMDgxXFx1MTA4ZVxcdTEwYTAtXFx1MTBjNVxcdTEwYzdcXHUxMGNkXFx1MTBkMC1cXHUxMGZhXFx1MTBmYy1cXHUxMjQ4XFx1MTI0YS1cXHUxMjRkXFx1MTI1MC1cXHUxMjU2XFx1MTI1OFxcdTEyNWEtXFx1MTI1ZFxcdTEyNjAtXFx1MTI4OFxcdTEyOGEtXFx1MTI4ZFxcdTEyOTAtXFx1MTJiMFxcdTEyYjItXFx1MTJiNVxcdTEyYjgtXFx1MTJiZVxcdTEyYzBcXHUxMmMyLVxcdTEyYzVcXHUxMmM4LVxcdTEyZDZcXHUxMmQ4LVxcdTEzMTBcXHUxMzEyLVxcdTEzMTVcXHUxMzE4LVxcdTEzNWFcXHUxMzgwLVxcdTEzOGZcXHUxM2EwLVxcdTEzZjVcXHUxM2Y4LVxcdTEzZmRcXHUxNDAxLVxcdTE2NmNcXHUxNjZmLVxcdTE2N2ZcXHUxNjgxLVxcdTE2OWFcXHUxNmEwLVxcdTE2ZWFcXHUxNmVlLVxcdTE2ZjhcXHUxNzAwLVxcdTE3MTFcXHUxNzFmLVxcdTE3MzFcXHUxNzQwLVxcdTE3NTFcXHUxNzYwLVxcdTE3NmNcXHUxNzZlLVxcdTE3NzBcXHUxNzgwLVxcdTE3YjNcXHUxN2Q3XFx1MTdkY1xcdTE4MjAtXFx1MTg3OFxcdTE4ODAtXFx1MThhOFxcdTE4YWFcXHUxOGIwLVxcdTE4ZjVcXHUxOTAwLVxcdTE5MWVcXHUxOTUwLVxcdTE5NmRcXHUxOTcwLVxcdTE5NzRcXHUxOTgwLVxcdTE5YWJcXHUxOWIwLVxcdTE5YzlcXHUxYTAwLVxcdTFhMTZcXHUxYTIwLVxcdTFhNTRcXHUxYWE3XFx1MWIwNS1cXHUxYjMzXFx1MWI0NS1cXHUxYjRjXFx1MWI4My1cXHUxYmEwXFx1MWJhZVxcdTFiYWZcXHUxYmJhLVxcdTFiZTVcXHUxYzAwLVxcdTFjMjNcXHUxYzRkLVxcdTFjNGZcXHUxYzVhLVxcdTFjN2RcXHUxYzgwLVxcdTFjOGFcXHUxYzkwLVxcdTFjYmFcXHUxY2JkLVxcdTFjYmZcXHUxY2U5LVxcdTFjZWNcXHUxY2VlLVxcdTFjZjNcXHUxY2Y1XFx1MWNmNlxcdTFjZmFcXHUxZDAwLVxcdTFkYmZcXHUxZTAwLVxcdTFmMTVcXHUxZjE4LVxcdTFmMWRcXHUxZjIwLVxcdTFmNDVcXHUxZjQ4LVxcdTFmNGRcXHUxZjUwLVxcdTFmNTdcXHUxZjU5XFx1MWY1YlxcdTFmNWRcXHUxZjVmLVxcdTFmN2RcXHUxZjgwLVxcdTFmYjRcXHUxZmI2LVxcdTFmYmNcXHUxZmJlXFx1MWZjMi1cXHUxZmM0XFx1MWZjNi1cXHUxZmNjXFx1MWZkMC1cXHUxZmQzXFx1MWZkNi1cXHUxZmRiXFx1MWZlMC1cXHUxZmVjXFx1MWZmMi1cXHUxZmY0XFx1MWZmNi1cXHUxZmZjXFx1MjA3MVxcdTIwN2ZcXHUyMDkwLVxcdTIwOWNcXHUyMTAyXFx1MjEwN1xcdTIxMGEtXFx1MjExM1xcdTIxMTVcXHUyMTE4LVxcdTIxMWRcXHUyMTI0XFx1MjEyNlxcdTIxMjhcXHUyMTJhLVxcdTIxMzlcXHUyMTNjLVxcdTIxM2ZcXHUyMTQ1LVxcdTIxNDlcXHUyMTRlXFx1MjE2MC1cXHUyMTg4XFx1MmMwMC1cXHUyY2U0XFx1MmNlYi1cXHUyY2VlXFx1MmNmMlxcdTJjZjNcXHUyZDAwLVxcdTJkMjVcXHUyZDI3XFx1MmQyZFxcdTJkMzAtXFx1MmQ2N1xcdTJkNmZcXHUyZDgwLVxcdTJkOTZcXHUyZGEwLVxcdTJkYTZcXHUyZGE4LVxcdTJkYWVcXHUyZGIwLVxcdTJkYjZcXHUyZGI4LVxcdTJkYmVcXHUyZGMwLVxcdTJkYzZcXHUyZGM4LVxcdTJkY2VcXHUyZGQwLVxcdTJkZDZcXHUyZGQ4LVxcdTJkZGVcXHUzMDA1LVxcdTMwMDdcXHUzMDIxLVxcdTMwMjlcXHUzMDMxLVxcdTMwMzVcXHUzMDM4LVxcdTMwM2NcXHUzMDQxLVxcdTMwOTZcXHUzMDliLVxcdTMwOWZcXHUzMGExLVxcdTMwZmFcXHUzMGZjLVxcdTMwZmZcXHUzMTA1LVxcdTMxMmZcXHUzMTMxLVxcdTMxOGVcXHUzMWEwLVxcdTMxYmZcXHUzMWYwLVxcdTMxZmZcXHUzNDAwLVxcdTRkYmZcXHU0ZTAwLVxcdWE0OGNcXHVhNGQwLVxcdWE0ZmRcXHVhNTAwLVxcdWE2MGNcXHVhNjEwLVxcdWE2MWZcXHVhNjJhXFx1YTYyYlxcdWE2NDAtXFx1YTY2ZVxcdWE2N2YtXFx1YTY5ZFxcdWE2YTAtXFx1YTZlZlxcdWE3MTctXFx1YTcxZlxcdWE3MjItXFx1YTc4OFxcdWE3OGItXFx1YTdjZFxcdWE3ZDBcXHVhN2QxXFx1YTdkM1xcdWE3ZDUtXFx1YTdkY1xcdWE3ZjItXFx1YTgwMVxcdWE4MDMtXFx1YTgwNVxcdWE4MDctXFx1YTgwYVxcdWE4MGMtXFx1YTgyMlxcdWE4NDAtXFx1YTg3M1xcdWE4ODItXFx1YThiM1xcdWE4ZjItXFx1YThmN1xcdWE4ZmJcXHVhOGZkXFx1YThmZVxcdWE5MGEtXFx1YTkyNVxcdWE5MzAtXFx1YTk0NlxcdWE5NjAtXFx1YTk3Y1xcdWE5ODQtXFx1YTliMlxcdWE5Y2ZcXHVhOWUwLVxcdWE5ZTRcXHVhOWU2LVxcdWE5ZWZcXHVhOWZhLVxcdWE5ZmVcXHVhYTAwLVxcdWFhMjhcXHVhYTQwLVxcdWFhNDJcXHVhYTQ0LVxcdWFhNGJcXHVhYTYwLVxcdWFhNzZcXHVhYTdhXFx1YWE3ZS1cXHVhYWFmXFx1YWFiMVxcdWFhYjVcXHVhYWI2XFx1YWFiOS1cXHVhYWJkXFx1YWFjMFxcdWFhYzJcXHVhYWRiLVxcdWFhZGRcXHVhYWUwLVxcdWFhZWFcXHVhYWYyLVxcdWFhZjRcXHVhYjAxLVxcdWFiMDZcXHVhYjA5LVxcdWFiMGVcXHVhYjExLVxcdWFiMTZcXHVhYjIwLVxcdWFiMjZcXHVhYjI4LVxcdWFiMmVcXHVhYjMwLVxcdWFiNWFcXHVhYjVjLVxcdWFiNjlcXHVhYjcwLVxcdWFiZTJcXHVhYzAwLVxcdWQ3YTNcXHVkN2IwLVxcdWQ3YzZcXHVkN2NiLVxcdWQ3ZmJcXHVmOTAwLVxcdWZhNmRcXHVmYTcwLVxcdWZhZDlcXHVmYjAwLVxcdWZiMDZcXHVmYjEzLVxcdWZiMTdcXHVmYjFkXFx1ZmIxZi1cXHVmYjI4XFx1ZmIyYS1cXHVmYjM2XFx1ZmIzOC1cXHVmYjNjXFx1ZmIzZVxcdWZiNDBcXHVmYjQxXFx1ZmI0M1xcdWZiNDRcXHVmYjQ2LVxcdWZiYjFcXHVmYmQzLVxcdWZkM2RcXHVmZDUwLVxcdWZkOGZcXHVmZDkyLVxcdWZkYzdcXHVmZGYwLVxcdWZkZmJcXHVmZTcwLVxcdWZlNzRcXHVmZTc2LVxcdWZlZmNcXHVmZjIxLVxcdWZmM2FcXHVmZjQxLVxcdWZmNWFcXHVmZjY2LVxcdWZmYmVcXHVmZmMyLVxcdWZmYzdcXHVmZmNhLVxcdWZmY2ZcXHVmZmQyLVxcdWZmZDdcXHVmZmRhLVxcdWZmZGNcIjtcblxuLy8gVGhlc2UgYXJlIGEgcnVuLWxlbmd0aCBhbmQgb2Zmc2V0IGVuY29kZWQgcmVwcmVzZW50YXRpb24gb2YgdGhlXG4vLyA+MHhmZmZmIGNvZGUgcG9pbnRzIHRoYXQgYXJlIGEgdmFsaWQgcGFydCBvZiBpZGVudGlmaWVycy4gVGhlXG4vLyBvZmZzZXQgc3RhcnRzIGF0IDB4MTAwMDAsIGFuZCBlYWNoIHBhaXIgb2YgbnVtYmVycyByZXByZXNlbnRzIGFuXG4vLyBvZmZzZXQgdG8gdGhlIG5leHQgcmFuZ2UsIGFuZCB0aGVuIGEgc2l6ZSBvZiB0aGUgcmFuZ2UuXG5cbi8vIFJlc2VydmVkIHdvcmQgbGlzdHMgZm9yIHZhcmlvdXMgZGlhbGVjdHMgb2YgdGhlIGxhbmd1YWdlXG5cbnZhciByZXNlcnZlZFdvcmRzID0ge1xuICAzOiBcImFic3RyYWN0IGJvb2xlYW4gYnl0ZSBjaGFyIGNsYXNzIGRvdWJsZSBlbnVtIGV4cG9ydCBleHRlbmRzIGZpbmFsIGZsb2F0IGdvdG8gaW1wbGVtZW50cyBpbXBvcnQgaW50IGludGVyZmFjZSBsb25nIG5hdGl2ZSBwYWNrYWdlIHByaXZhdGUgcHJvdGVjdGVkIHB1YmxpYyBzaG9ydCBzdGF0aWMgc3VwZXIgc3luY2hyb25pemVkIHRocm93cyB0cmFuc2llbnQgdm9sYXRpbGVcIixcbiAgNTogXCJjbGFzcyBlbnVtIGV4dGVuZHMgc3VwZXIgY29uc3QgZXhwb3J0IGltcG9ydFwiLFxuICA2OiBcImVudW1cIixcbiAgc3RyaWN0OiBcImltcGxlbWVudHMgaW50ZXJmYWNlIGxldCBwYWNrYWdlIHByaXZhdGUgcHJvdGVjdGVkIHB1YmxpYyBzdGF0aWMgeWllbGRcIixcbiAgc3RyaWN0QmluZDogXCJldmFsIGFyZ3VtZW50c1wiXG59O1xuXG4vLyBBbmQgdGhlIGtleXdvcmRzXG5cbnZhciBlY21hNUFuZExlc3NLZXl3b3JkcyA9IFwiYnJlYWsgY2FzZSBjYXRjaCBjb250aW51ZSBkZWJ1Z2dlciBkZWZhdWx0IGRvIGVsc2UgZmluYWxseSBmb3IgZnVuY3Rpb24gaWYgcmV0dXJuIHN3aXRjaCB0aHJvdyB0cnkgdmFyIHdoaWxlIHdpdGggbnVsbCB0cnVlIGZhbHNlIGluc3RhbmNlb2YgdHlwZW9mIHZvaWQgZGVsZXRlIG5ldyBpbiB0aGlzXCI7XG5cbnZhciBrZXl3b3JkcyQxID0ge1xuICA1OiBlY21hNUFuZExlc3NLZXl3b3JkcyxcbiAgXCI1bW9kdWxlXCI6IGVjbWE1QW5kTGVzc0tleXdvcmRzICsgXCIgZXhwb3J0IGltcG9ydFwiLFxuICA2OiBlY21hNUFuZExlc3NLZXl3b3JkcyArIFwiIGNvbnN0IGNsYXNzIGV4dGVuZHMgZXhwb3J0IGltcG9ydCBzdXBlclwiXG59O1xuXG52YXIga2V5d29yZFJlbGF0aW9uYWxPcGVyYXRvciA9IC9eaW4oc3RhbmNlb2YpPyQvO1xuXG4vLyAjIyBDaGFyYWN0ZXIgY2F0ZWdvcmllc1xuXG52YXIgbm9uQVNDSUlpZGVudGlmaWVyU3RhcnQgPSBuZXcgUmVnRXhwKFwiW1wiICsgbm9uQVNDSUlpZGVudGlmaWVyU3RhcnRDaGFycyArIFwiXVwiKTtcbnZhciBub25BU0NJSWlkZW50aWZpZXIgPSBuZXcgUmVnRXhwKFwiW1wiICsgbm9uQVNDSUlpZGVudGlmaWVyU3RhcnRDaGFycyArIG5vbkFTQ0lJaWRlbnRpZmllckNoYXJzICsgXCJdXCIpO1xuXG4vLyBUaGlzIGhhcyBhIGNvbXBsZXhpdHkgbGluZWFyIHRvIHRoZSB2YWx1ZSBvZiB0aGUgY29kZS4gVGhlXG4vLyBhc3N1bXB0aW9uIGlzIHRoYXQgbG9va2luZyB1cCBhc3RyYWwgaWRlbnRpZmllciBjaGFyYWN0ZXJzIGlzXG4vLyByYXJlLlxuZnVuY3Rpb24gaXNJbkFzdHJhbFNldChjb2RlLCBzZXQpIHtcbiAgdmFyIHBvcyA9IDB4MTAwMDA7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc2V0Lmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcG9zICs9IHNldFtpXTtcbiAgICBpZiAocG9zID4gY29kZSkgeyByZXR1cm4gZmFsc2UgfVxuICAgIHBvcyArPSBzZXRbaSArIDFdO1xuICAgIGlmIChwb3MgPj0gY29kZSkgeyByZXR1cm4gdHJ1ZSB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8vIFRlc3Qgd2hldGhlciBhIGdpdmVuIGNoYXJhY3RlciBjb2RlIHN0YXJ0cyBhbiBpZGVudGlmaWVyLlxuXG5mdW5jdGlvbiBpc0lkZW50aWZpZXJTdGFydChjb2RlLCBhc3RyYWwpIHtcbiAgaWYgKGNvZGUgPCA2NSkgeyByZXR1cm4gY29kZSA9PT0gMzYgfVxuICBpZiAoY29kZSA8IDkxKSB7IHJldHVybiB0cnVlIH1cbiAgaWYgKGNvZGUgPCA5NykgeyByZXR1cm4gY29kZSA9PT0gOTUgfVxuICBpZiAoY29kZSA8IDEyMykgeyByZXR1cm4gdHJ1ZSB9XG4gIGlmIChjb2RlIDw9IDB4ZmZmZikgeyByZXR1cm4gY29kZSA+PSAweGFhICYmIG5vbkFTQ0lJaWRlbnRpZmllclN0YXJ0LnRlc3QoU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKSkgfVxuICBpZiAoYXN0cmFsID09PSBmYWxzZSkgeyByZXR1cm4gZmFsc2UgfVxuICByZXR1cm4gaXNJbkFzdHJhbFNldChjb2RlLCBhc3RyYWxJZGVudGlmaWVyU3RhcnRDb2Rlcylcbn1cblxuLy8gVGVzdCB3aGV0aGVyIGEgZ2l2ZW4gY2hhcmFjdGVyIGlzIHBhcnQgb2YgYW4gaWRlbnRpZmllci5cblxuZnVuY3Rpb24gaXNJZGVudGlmaWVyQ2hhcihjb2RlLCBhc3RyYWwpIHtcbiAgaWYgKGNvZGUgPCA0OCkgeyByZXR1cm4gY29kZSA9PT0gMzYgfVxuICBpZiAoY29kZSA8IDU4KSB7IHJldHVybiB0cnVlIH1cbiAgaWYgKGNvZGUgPCA2NSkgeyByZXR1cm4gZmFsc2UgfVxuICBpZiAoY29kZSA8IDkxKSB7IHJldHVybiB0cnVlIH1cbiAgaWYgKGNvZGUgPCA5NykgeyByZXR1cm4gY29kZSA9PT0gOTUgfVxuICBpZiAoY29kZSA8IDEyMykgeyByZXR1cm4gdHJ1ZSB9XG4gIGlmIChjb2RlIDw9IDB4ZmZmZikgeyByZXR1cm4gY29kZSA+PSAweGFhICYmIG5vbkFTQ0lJaWRlbnRpZmllci50ZXN0KFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSkpIH1cbiAgaWYgKGFzdHJhbCA9PT0gZmFsc2UpIHsgcmV0dXJuIGZhbHNlIH1cbiAgcmV0dXJuIGlzSW5Bc3RyYWxTZXQoY29kZSwgYXN0cmFsSWRlbnRpZmllclN0YXJ0Q29kZXMpIHx8IGlzSW5Bc3RyYWxTZXQoY29kZSwgYXN0cmFsSWRlbnRpZmllckNvZGVzKVxufVxuXG4vLyAjIyBUb2tlbiB0eXBlc1xuXG4vLyBUaGUgYXNzaWdubWVudCBvZiBmaW5lLWdyYWluZWQsIGluZm9ybWF0aW9uLWNhcnJ5aW5nIHR5cGUgb2JqZWN0c1xuLy8gYWxsb3dzIHRoZSB0b2tlbml6ZXIgdG8gc3RvcmUgdGhlIGluZm9ybWF0aW9uIGl0IGhhcyBhYm91dCBhXG4vLyB0b2tlbiBpbiBhIHdheSB0aGF0IGlzIHZlcnkgY2hlYXAgZm9yIHRoZSBwYXJzZXIgdG8gbG9vayB1cC5cblxuLy8gQWxsIHRva2VuIHR5cGUgdmFyaWFibGVzIHN0YXJ0IHdpdGggYW4gdW5kZXJzY29yZSwgdG8gbWFrZSB0aGVtXG4vLyBlYXN5IHRvIHJlY29nbml6ZS5cblxuLy8gVGhlIGBiZWZvcmVFeHByYCBwcm9wZXJ0eSBpcyB1c2VkIHRvIGRpc2FtYmlndWF0ZSBiZXR3ZWVuIHJlZ3VsYXJcbi8vIGV4cHJlc3Npb25zIGFuZCBkaXZpc2lvbnMuIEl0IGlzIHNldCBvbiBhbGwgdG9rZW4gdHlwZXMgdGhhdCBjYW5cbi8vIGJlIGZvbGxvd2VkIGJ5IGFuIGV4cHJlc3Npb24gKHRodXMsIGEgc2xhc2ggYWZ0ZXIgdGhlbSB3b3VsZCBiZSBhXG4vLyByZWd1bGFyIGV4cHJlc3Npb24pLlxuLy9cbi8vIFRoZSBgc3RhcnRzRXhwcmAgcHJvcGVydHkgaXMgdXNlZCB0byBjaGVjayBpZiB0aGUgdG9rZW4gZW5kcyBhXG4vLyBgeWllbGRgIGV4cHJlc3Npb24uIEl0IGlzIHNldCBvbiBhbGwgdG9rZW4gdHlwZXMgdGhhdCBlaXRoZXIgY2FuXG4vLyBkaXJlY3RseSBzdGFydCBhbiBleHByZXNzaW9uIChsaWtlIGEgcXVvdGF0aW9uIG1hcmspIG9yIGNhblxuLy8gY29udGludWUgYW4gZXhwcmVzc2lvbiAobGlrZSB0aGUgYm9keSBvZiBhIHN0cmluZykuXG4vL1xuLy8gYGlzTG9vcGAgbWFya3MgYSBrZXl3b3JkIGFzIHN0YXJ0aW5nIGEgbG9vcCwgd2hpY2ggaXMgaW1wb3J0YW50XG4vLyB0byBrbm93IHdoZW4gcGFyc2luZyBhIGxhYmVsLCBpbiBvcmRlciB0byBhbGxvdyBvciBkaXNhbGxvd1xuLy8gY29udGludWUganVtcHMgdG8gdGhhdCBsYWJlbC5cblxudmFyIFRva2VuVHlwZSA9IGZ1bmN0aW9uIFRva2VuVHlwZShsYWJlbCwgY29uZikge1xuICBpZiAoIGNvbmYgPT09IHZvaWQgMCApIGNvbmYgPSB7fTtcblxuICB0aGlzLmxhYmVsID0gbGFiZWw7XG4gIHRoaXMua2V5d29yZCA9IGNvbmYua2V5d29yZDtcbiAgdGhpcy5iZWZvcmVFeHByID0gISFjb25mLmJlZm9yZUV4cHI7XG4gIHRoaXMuc3RhcnRzRXhwciA9ICEhY29uZi5zdGFydHNFeHByO1xuICB0aGlzLmlzTG9vcCA9ICEhY29uZi5pc0xvb3A7XG4gIHRoaXMuaXNBc3NpZ24gPSAhIWNvbmYuaXNBc3NpZ247XG4gIHRoaXMucHJlZml4ID0gISFjb25mLnByZWZpeDtcbiAgdGhpcy5wb3N0Zml4ID0gISFjb25mLnBvc3RmaXg7XG4gIHRoaXMuYmlub3AgPSBjb25mLmJpbm9wIHx8IG51bGw7XG4gIHRoaXMudXBkYXRlQ29udGV4dCA9IG51bGw7XG59O1xuXG5mdW5jdGlvbiBiaW5vcChuYW1lLCBwcmVjKSB7XG4gIHJldHVybiBuZXcgVG9rZW5UeXBlKG5hbWUsIHtiZWZvcmVFeHByOiB0cnVlLCBiaW5vcDogcHJlY30pXG59XG52YXIgYmVmb3JlRXhwciA9IHtiZWZvcmVFeHByOiB0cnVlfSwgc3RhcnRzRXhwciA9IHtzdGFydHNFeHByOiB0cnVlfTtcblxuLy8gTWFwIGtleXdvcmQgbmFtZXMgdG8gdG9rZW4gdHlwZXMuXG5cbnZhciBrZXl3b3JkcyA9IHt9O1xuXG4vLyBTdWNjaW5jdCBkZWZpbml0aW9ucyBvZiBrZXl3b3JkIHRva2VuIHR5cGVzXG5mdW5jdGlvbiBrdyhuYW1lLCBvcHRpb25zKSB7XG4gIGlmICggb3B0aW9ucyA9PT0gdm9pZCAwICkgb3B0aW9ucyA9IHt9O1xuXG4gIG9wdGlvbnMua2V5d29yZCA9IG5hbWU7XG4gIHJldHVybiBrZXl3b3Jkc1tuYW1lXSA9IG5ldyBUb2tlblR5cGUobmFtZSwgb3B0aW9ucylcbn1cblxudmFyIHR5cGVzJDEgPSB7XG4gIG51bTogbmV3IFRva2VuVHlwZShcIm51bVwiLCBzdGFydHNFeHByKSxcbiAgcmVnZXhwOiBuZXcgVG9rZW5UeXBlKFwicmVnZXhwXCIsIHN0YXJ0c0V4cHIpLFxuICBzdHJpbmc6IG5ldyBUb2tlblR5cGUoXCJzdHJpbmdcIiwgc3RhcnRzRXhwciksXG4gIG5hbWU6IG5ldyBUb2tlblR5cGUoXCJuYW1lXCIsIHN0YXJ0c0V4cHIpLFxuICBwcml2YXRlSWQ6IG5ldyBUb2tlblR5cGUoXCJwcml2YXRlSWRcIiwgc3RhcnRzRXhwciksXG4gIGVvZjogbmV3IFRva2VuVHlwZShcImVvZlwiKSxcblxuICAvLyBQdW5jdHVhdGlvbiB0b2tlbiB0eXBlcy5cbiAgYnJhY2tldEw6IG5ldyBUb2tlblR5cGUoXCJbXCIsIHtiZWZvcmVFeHByOiB0cnVlLCBzdGFydHNFeHByOiB0cnVlfSksXG4gIGJyYWNrZXRSOiBuZXcgVG9rZW5UeXBlKFwiXVwiKSxcbiAgYnJhY2VMOiBuZXcgVG9rZW5UeXBlKFwie1wiLCB7YmVmb3JlRXhwcjogdHJ1ZSwgc3RhcnRzRXhwcjogdHJ1ZX0pLFxuICBicmFjZVI6IG5ldyBUb2tlblR5cGUoXCJ9XCIpLFxuICBwYXJlbkw6IG5ldyBUb2tlblR5cGUoXCIoXCIsIHtiZWZvcmVFeHByOiB0cnVlLCBzdGFydHNFeHByOiB0cnVlfSksXG4gIHBhcmVuUjogbmV3IFRva2VuVHlwZShcIilcIiksXG4gIGNvbW1hOiBuZXcgVG9rZW5UeXBlKFwiLFwiLCBiZWZvcmVFeHByKSxcbiAgc2VtaTogbmV3IFRva2VuVHlwZShcIjtcIiwgYmVmb3JlRXhwciksXG4gIGNvbG9uOiBuZXcgVG9rZW5UeXBlKFwiOlwiLCBiZWZvcmVFeHByKSxcbiAgZG90OiBuZXcgVG9rZW5UeXBlKFwiLlwiKSxcbiAgcXVlc3Rpb246IG5ldyBUb2tlblR5cGUoXCI/XCIsIGJlZm9yZUV4cHIpLFxuICBxdWVzdGlvbkRvdDogbmV3IFRva2VuVHlwZShcIj8uXCIpLFxuICBhcnJvdzogbmV3IFRva2VuVHlwZShcIj0+XCIsIGJlZm9yZUV4cHIpLFxuICB0ZW1wbGF0ZTogbmV3IFRva2VuVHlwZShcInRlbXBsYXRlXCIpLFxuICBpbnZhbGlkVGVtcGxhdGU6IG5ldyBUb2tlblR5cGUoXCJpbnZhbGlkVGVtcGxhdGVcIiksXG4gIGVsbGlwc2lzOiBuZXcgVG9rZW5UeXBlKFwiLi4uXCIsIGJlZm9yZUV4cHIpLFxuICBiYWNrUXVvdGU6IG5ldyBUb2tlblR5cGUoXCJgXCIsIHN0YXJ0c0V4cHIpLFxuICBkb2xsYXJCcmFjZUw6IG5ldyBUb2tlblR5cGUoXCIke1wiLCB7YmVmb3JlRXhwcjogdHJ1ZSwgc3RhcnRzRXhwcjogdHJ1ZX0pLFxuXG4gIC8vIE9wZXJhdG9ycy4gVGhlc2UgY2Fycnkgc2V2ZXJhbCBraW5kcyBvZiBwcm9wZXJ0aWVzIHRvIGhlbHAgdGhlXG4gIC8vIHBhcnNlciB1c2UgdGhlbSBwcm9wZXJseSAodGhlIHByZXNlbmNlIG9mIHRoZXNlIHByb3BlcnRpZXMgaXNcbiAgLy8gd2hhdCBjYXRlZ29yaXplcyB0aGVtIGFzIG9wZXJhdG9ycykuXG4gIC8vXG4gIC8vIGBiaW5vcGAsIHdoZW4gcHJlc2VudCwgc3BlY2lmaWVzIHRoYXQgdGhpcyBvcGVyYXRvciBpcyBhIGJpbmFyeVxuICAvLyBvcGVyYXRvciwgYW5kIHdpbGwgcmVmZXIgdG8gaXRzIHByZWNlZGVuY2UuXG4gIC8vXG4gIC8vIGBwcmVmaXhgIGFuZCBgcG9zdGZpeGAgbWFyayB0aGUgb3BlcmF0b3IgYXMgYSBwcmVmaXggb3IgcG9zdGZpeFxuICAvLyB1bmFyeSBvcGVyYXRvci5cbiAgLy9cbiAgLy8gYGlzQXNzaWduYCBtYXJrcyBhbGwgb2YgYD1gLCBgKz1gLCBgLT1gIGV0Y2V0ZXJhLCB3aGljaCBhY3QgYXNcbiAgLy8gYmluYXJ5IG9wZXJhdG9ycyB3aXRoIGEgdmVyeSBsb3cgcHJlY2VkZW5jZSwgdGhhdCBzaG91bGQgcmVzdWx0XG4gIC8vIGluIEFzc2lnbm1lbnRFeHByZXNzaW9uIG5vZGVzLlxuXG4gIGVxOiBuZXcgVG9rZW5UeXBlKFwiPVwiLCB7YmVmb3JlRXhwcjogdHJ1ZSwgaXNBc3NpZ246IHRydWV9KSxcbiAgYXNzaWduOiBuZXcgVG9rZW5UeXBlKFwiXz1cIiwge2JlZm9yZUV4cHI6IHRydWUsIGlzQXNzaWduOiB0cnVlfSksXG4gIGluY0RlYzogbmV3IFRva2VuVHlwZShcIisrLy0tXCIsIHtwcmVmaXg6IHRydWUsIHBvc3RmaXg6IHRydWUsIHN0YXJ0c0V4cHI6IHRydWV9KSxcbiAgcHJlZml4OiBuZXcgVG9rZW5UeXBlKFwiIS9+XCIsIHtiZWZvcmVFeHByOiB0cnVlLCBwcmVmaXg6IHRydWUsIHN0YXJ0c0V4cHI6IHRydWV9KSxcbiAgbG9naWNhbE9SOiBiaW5vcChcInx8XCIsIDEpLFxuICBsb2dpY2FsQU5EOiBiaW5vcChcIiYmXCIsIDIpLFxuICBiaXR3aXNlT1I6IGJpbm9wKFwifFwiLCAzKSxcbiAgYml0d2lzZVhPUjogYmlub3AoXCJeXCIsIDQpLFxuICBiaXR3aXNlQU5EOiBiaW5vcChcIiZcIiwgNSksXG4gIGVxdWFsaXR5OiBiaW5vcChcIj09LyE9Lz09PS8hPT1cIiwgNiksXG4gIHJlbGF0aW9uYWw6IGJpbm9wKFwiPC8+Lzw9Lz49XCIsIDcpLFxuICBiaXRTaGlmdDogYmlub3AoXCI8PC8+Pi8+Pj5cIiwgOCksXG4gIHBsdXNNaW46IG5ldyBUb2tlblR5cGUoXCIrLy1cIiwge2JlZm9yZUV4cHI6IHRydWUsIGJpbm9wOiA5LCBwcmVmaXg6IHRydWUsIHN0YXJ0c0V4cHI6IHRydWV9KSxcbiAgbW9kdWxvOiBiaW5vcChcIiVcIiwgMTApLFxuICBzdGFyOiBiaW5vcChcIipcIiwgMTApLFxuICBzbGFzaDogYmlub3AoXCIvXCIsIDEwKSxcbiAgc3RhcnN0YXI6IG5ldyBUb2tlblR5cGUoXCIqKlwiLCB7YmVmb3JlRXhwcjogdHJ1ZX0pLFxuICBjb2FsZXNjZTogYmlub3AoXCI/P1wiLCAxKSxcblxuICAvLyBLZXl3b3JkIHRva2VuIHR5cGVzLlxuICBfYnJlYWs6IGt3KFwiYnJlYWtcIiksXG4gIF9jYXNlOiBrdyhcImNhc2VcIiwgYmVmb3JlRXhwciksXG4gIF9jYXRjaDoga3coXCJjYXRjaFwiKSxcbiAgX2NvbnRpbnVlOiBrdyhcImNvbnRpbnVlXCIpLFxuICBfZGVidWdnZXI6IGt3KFwiZGVidWdnZXJcIiksXG4gIF9kZWZhdWx0OiBrdyhcImRlZmF1bHRcIiwgYmVmb3JlRXhwciksXG4gIF9kbzoga3coXCJkb1wiLCB7aXNMb29wOiB0cnVlLCBiZWZvcmVFeHByOiB0cnVlfSksXG4gIF9lbHNlOiBrdyhcImVsc2VcIiwgYmVmb3JlRXhwciksXG4gIF9maW5hbGx5OiBrdyhcImZpbmFsbHlcIiksXG4gIF9mb3I6IGt3KFwiZm9yXCIsIHtpc0xvb3A6IHRydWV9KSxcbiAgX2Z1bmN0aW9uOiBrdyhcImZ1bmN0aW9uXCIsIHN0YXJ0c0V4cHIpLFxuICBfaWY6IGt3KFwiaWZcIiksXG4gIF9yZXR1cm46IGt3KFwicmV0dXJuXCIsIGJlZm9yZUV4cHIpLFxuICBfc3dpdGNoOiBrdyhcInN3aXRjaFwiKSxcbiAgX3Rocm93OiBrdyhcInRocm93XCIsIGJlZm9yZUV4cHIpLFxuICBfdHJ5OiBrdyhcInRyeVwiKSxcbiAgX3Zhcjoga3coXCJ2YXJcIiksXG4gIF9jb25zdDoga3coXCJjb25zdFwiKSxcbiAgX3doaWxlOiBrdyhcIndoaWxlXCIsIHtpc0xvb3A6IHRydWV9KSxcbiAgX3dpdGg6IGt3KFwid2l0aFwiKSxcbiAgX25ldzoga3coXCJuZXdcIiwge2JlZm9yZUV4cHI6IHRydWUsIHN0YXJ0c0V4cHI6IHRydWV9KSxcbiAgX3RoaXM6IGt3KFwidGhpc1wiLCBzdGFydHNFeHByKSxcbiAgX3N1cGVyOiBrdyhcInN1cGVyXCIsIHN0YXJ0c0V4cHIpLFxuICBfY2xhc3M6IGt3KFwiY2xhc3NcIiwgc3RhcnRzRXhwciksXG4gIF9leHRlbmRzOiBrdyhcImV4dGVuZHNcIiwgYmVmb3JlRXhwciksXG4gIF9leHBvcnQ6IGt3KFwiZXhwb3J0XCIpLFxuICBfaW1wb3J0OiBrdyhcImltcG9ydFwiLCBzdGFydHNFeHByKSxcbiAgX251bGw6IGt3KFwibnVsbFwiLCBzdGFydHNFeHByKSxcbiAgX3RydWU6IGt3KFwidHJ1ZVwiLCBzdGFydHNFeHByKSxcbiAgX2ZhbHNlOiBrdyhcImZhbHNlXCIsIHN0YXJ0c0V4cHIpLFxuICBfaW46IGt3KFwiaW5cIiwge2JlZm9yZUV4cHI6IHRydWUsIGJpbm9wOiA3fSksXG4gIF9pbnN0YW5jZW9mOiBrdyhcImluc3RhbmNlb2ZcIiwge2JlZm9yZUV4cHI6IHRydWUsIGJpbm9wOiA3fSksXG4gIF90eXBlb2Y6IGt3KFwidHlwZW9mXCIsIHtiZWZvcmVFeHByOiB0cnVlLCBwcmVmaXg6IHRydWUsIHN0YXJ0c0V4cHI6IHRydWV9KSxcbiAgX3ZvaWQ6IGt3KFwidm9pZFwiLCB7YmVmb3JlRXhwcjogdHJ1ZSwgcHJlZml4OiB0cnVlLCBzdGFydHNFeHByOiB0cnVlfSksXG4gIF9kZWxldGU6IGt3KFwiZGVsZXRlXCIsIHtiZWZvcmVFeHByOiB0cnVlLCBwcmVmaXg6IHRydWUsIHN0YXJ0c0V4cHI6IHRydWV9KVxufTtcblxuLy8gTWF0Y2hlcyBhIHdob2xlIGxpbmUgYnJlYWsgKHdoZXJlIENSTEYgaXMgY29uc2lkZXJlZCBhIHNpbmdsZVxuLy8gbGluZSBicmVhaykuIFVzZWQgdG8gY291bnQgbGluZXMuXG5cbnZhciBsaW5lQnJlYWsgPSAvXFxyXFxuP3xcXG58XFx1MjAyOHxcXHUyMDI5LztcbnZhciBsaW5lQnJlYWtHID0gbmV3IFJlZ0V4cChsaW5lQnJlYWsuc291cmNlLCBcImdcIik7XG5cbmZ1bmN0aW9uIGlzTmV3TGluZShjb2RlKSB7XG4gIHJldHVybiBjb2RlID09PSAxMCB8fCBjb2RlID09PSAxMyB8fCBjb2RlID09PSAweDIwMjggfHwgY29kZSA9PT0gMHgyMDI5XG59XG5cbmZ1bmN0aW9uIG5leHRMaW5lQnJlYWsoY29kZSwgZnJvbSwgZW5kKSB7XG4gIGlmICggZW5kID09PSB2b2lkIDAgKSBlbmQgPSBjb2RlLmxlbmd0aDtcblxuICBmb3IgKHZhciBpID0gZnJvbTsgaSA8IGVuZDsgaSsrKSB7XG4gICAgdmFyIG5leHQgPSBjb2RlLmNoYXJDb2RlQXQoaSk7XG4gICAgaWYgKGlzTmV3TGluZShuZXh0KSlcbiAgICAgIHsgcmV0dXJuIGkgPCBlbmQgLSAxICYmIG5leHQgPT09IDEzICYmIGNvZGUuY2hhckNvZGVBdChpICsgMSkgPT09IDEwID8gaSArIDIgOiBpICsgMSB9XG4gIH1cbiAgcmV0dXJuIC0xXG59XG5cbnZhciBub25BU0NJSXdoaXRlc3BhY2UgPSAvW1xcdTE2ODBcXHUyMDAwLVxcdTIwMGFcXHUyMDJmXFx1MjA1ZlxcdTMwMDBcXHVmZWZmXS87XG5cbnZhciBza2lwV2hpdGVTcGFjZSA9IC8oPzpcXHN8XFwvXFwvLip8XFwvXFwqW15dKj9cXCpcXC8pKi9nO1xuXG52YXIgcmVmID0gT2JqZWN0LnByb3RvdHlwZTtcbnZhciBoYXNPd25Qcm9wZXJ0eSA9IHJlZi5oYXNPd25Qcm9wZXJ0eTtcbnZhciB0b1N0cmluZyA9IHJlZi50b1N0cmluZztcblxudmFyIGhhc093biA9IE9iamVjdC5oYXNPd24gfHwgKGZ1bmN0aW9uIChvYmosIHByb3BOYW1lKSB7IHJldHVybiAoXG4gIGhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wTmFtZSlcbik7IH0pO1xuXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgKGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIChcbiAgdG9TdHJpbmcuY2FsbChvYmopID09PSBcIltvYmplY3QgQXJyYXldXCJcbik7IH0pO1xuXG52YXIgcmVnZXhwQ2FjaGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG5mdW5jdGlvbiB3b3Jkc1JlZ2V4cCh3b3Jkcykge1xuICByZXR1cm4gcmVnZXhwQ2FjaGVbd29yZHNdIHx8IChyZWdleHBDYWNoZVt3b3Jkc10gPSBuZXcgUmVnRXhwKFwiXig/OlwiICsgd29yZHMucmVwbGFjZSgvIC9nLCBcInxcIikgKyBcIikkXCIpKVxufVxuXG5mdW5jdGlvbiBjb2RlUG9pbnRUb1N0cmluZyhjb2RlKSB7XG4gIC8vIFVURi0xNiBEZWNvZGluZ1xuICBpZiAoY29kZSA8PSAweEZGRkYpIHsgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSkgfVxuICBjb2RlIC09IDB4MTAwMDA7XG4gIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKChjb2RlID4+IDEwKSArIDB4RDgwMCwgKGNvZGUgJiAxMDIzKSArIDB4REMwMClcbn1cblxudmFyIGxvbmVTdXJyb2dhdGUgPSAvKD86W1xcdUQ4MDAtXFx1REJGRl0oPyFbXFx1REMwMC1cXHVERkZGXSl8KD86W15cXHVEODAwLVxcdURCRkZdfF4pW1xcdURDMDAtXFx1REZGRl0pLztcblxuLy8gVGhlc2UgYXJlIHVzZWQgd2hlbiBgb3B0aW9ucy5sb2NhdGlvbnNgIGlzIG9uLCBmb3IgdGhlXG4vLyBgc3RhcnRMb2NgIGFuZCBgZW5kTG9jYCBwcm9wZXJ0aWVzLlxuXG52YXIgUG9zaXRpb24gPSBmdW5jdGlvbiBQb3NpdGlvbihsaW5lLCBjb2wpIHtcbiAgdGhpcy5saW5lID0gbGluZTtcbiAgdGhpcy5jb2x1bW4gPSBjb2w7XG59O1xuXG5Qb3NpdGlvbi5wcm90b3R5cGUub2Zmc2V0ID0gZnVuY3Rpb24gb2Zmc2V0IChuKSB7XG4gIHJldHVybiBuZXcgUG9zaXRpb24odGhpcy5saW5lLCB0aGlzLmNvbHVtbiArIG4pXG59O1xuXG52YXIgU291cmNlTG9jYXRpb24gPSBmdW5jdGlvbiBTb3VyY2VMb2NhdGlvbihwLCBzdGFydCwgZW5kKSB7XG4gIHRoaXMuc3RhcnQgPSBzdGFydDtcbiAgdGhpcy5lbmQgPSBlbmQ7XG4gIGlmIChwLnNvdXJjZUZpbGUgIT09IG51bGwpIHsgdGhpcy5zb3VyY2UgPSBwLnNvdXJjZUZpbGU7IH1cbn07XG5cbi8vIFRoZSBgZ2V0TGluZUluZm9gIGZ1bmN0aW9uIGlzIG1vc3RseSB1c2VmdWwgd2hlbiB0aGVcbi8vIGBsb2NhdGlvbnNgIG9wdGlvbiBpcyBvZmYgKGZvciBwZXJmb3JtYW5jZSByZWFzb25zKSBhbmQgeW91XG4vLyB3YW50IHRvIGZpbmQgdGhlIGxpbmUvY29sdW1uIHBvc2l0aW9uIGZvciBhIGdpdmVuIGNoYXJhY3RlclxuLy8gb2Zmc2V0LiBgaW5wdXRgIHNob3VsZCBiZSB0aGUgY29kZSBzdHJpbmcgdGhhdCB0aGUgb2Zmc2V0IHJlZmVyc1xuLy8gaW50by5cblxuZnVuY3Rpb24gZ2V0TGluZUluZm8oaW5wdXQsIG9mZnNldCkge1xuICBmb3IgKHZhciBsaW5lID0gMSwgY3VyID0gMDs7KSB7XG4gICAgdmFyIG5leHRCcmVhayA9IG5leHRMaW5lQnJlYWsoaW5wdXQsIGN1ciwgb2Zmc2V0KTtcbiAgICBpZiAobmV4dEJyZWFrIDwgMCkgeyByZXR1cm4gbmV3IFBvc2l0aW9uKGxpbmUsIG9mZnNldCAtIGN1cikgfVxuICAgICsrbGluZTtcbiAgICBjdXIgPSBuZXh0QnJlYWs7XG4gIH1cbn1cblxuLy8gQSBzZWNvbmQgYXJndW1lbnQgbXVzdCBiZSBnaXZlbiB0byBjb25maWd1cmUgdGhlIHBhcnNlciBwcm9jZXNzLlxuLy8gVGhlc2Ugb3B0aW9ucyBhcmUgcmVjb2duaXplZCAob25seSBgZWNtYVZlcnNpb25gIGlzIHJlcXVpcmVkKTpcblxudmFyIGRlZmF1bHRPcHRpb25zID0ge1xuICAvLyBgZWNtYVZlcnNpb25gIGluZGljYXRlcyB0aGUgRUNNQVNjcmlwdCB2ZXJzaW9uIHRvIHBhcnNlLiBNdXN0IGJlXG4gIC8vIGVpdGhlciAzLCA1LCA2IChvciAyMDE1KSwgNyAoMjAxNiksIDggKDIwMTcpLCA5ICgyMDE4KSwgMTBcbiAgLy8gKDIwMTkpLCAxMSAoMjAyMCksIDEyICgyMDIxKSwgMTMgKDIwMjIpLCAxNCAoMjAyMyksIG9yIGBcImxhdGVzdFwiYFxuICAvLyAodGhlIGxhdGVzdCB2ZXJzaW9uIHRoZSBsaWJyYXJ5IHN1cHBvcnRzKS4gVGhpcyBpbmZsdWVuY2VzXG4gIC8vIHN1cHBvcnQgZm9yIHN0cmljdCBtb2RlLCB0aGUgc2V0IG9mIHJlc2VydmVkIHdvcmRzLCBhbmQgc3VwcG9ydFxuICAvLyBmb3IgbmV3IHN5bnRheCBmZWF0dXJlcy5cbiAgZWNtYVZlcnNpb246IG51bGwsXG4gIC8vIGBzb3VyY2VUeXBlYCBpbmRpY2F0ZXMgdGhlIG1vZGUgdGhlIGNvZGUgc2hvdWxkIGJlIHBhcnNlZCBpbi5cbiAgLy8gQ2FuIGJlIGVpdGhlciBgXCJzY3JpcHRcImAgb3IgYFwibW9kdWxlXCJgLiBUaGlzIGluZmx1ZW5jZXMgZ2xvYmFsXG4gIC8vIHN0cmljdCBtb2RlIGFuZCBwYXJzaW5nIG9mIGBpbXBvcnRgIGFuZCBgZXhwb3J0YCBkZWNsYXJhdGlvbnMuXG4gIHNvdXJjZVR5cGU6IFwic2NyaXB0XCIsXG4gIC8vIGBvbkluc2VydGVkU2VtaWNvbG9uYCBjYW4gYmUgYSBjYWxsYmFjayB0aGF0IHdpbGwgYmUgY2FsbGVkIHdoZW5cbiAgLy8gYSBzZW1pY29sb24gaXMgYXV0b21hdGljYWxseSBpbnNlcnRlZC4gSXQgd2lsbCBiZSBwYXNzZWQgdGhlXG4gIC8vIHBvc2l0aW9uIG9mIHRoZSBpbnNlcnRlZCBzZW1pY29sb24gYXMgYW4gb2Zmc2V0LCBhbmQgaWZcbiAgLy8gYGxvY2F0aW9uc2AgaXMgZW5hYmxlZCwgaXQgaXMgZ2l2ZW4gdGhlIGxvY2F0aW9uIGFzIGEgYHtsaW5lLFxuICAvLyBjb2x1bW59YCBvYmplY3QgYXMgc2Vjb25kIGFyZ3VtZW50LlxuICBvbkluc2VydGVkU2VtaWNvbG9uOiBudWxsLFxuICAvLyBgb25UcmFpbGluZ0NvbW1hYCBpcyBzaW1pbGFyIHRvIGBvbkluc2VydGVkU2VtaWNvbG9uYCwgYnV0IGZvclxuICAvLyB0cmFpbGluZyBjb21tYXMuXG4gIG9uVHJhaWxpbmdDb21tYTogbnVsbCxcbiAgLy8gQnkgZGVmYXVsdCwgcmVzZXJ2ZWQgd29yZHMgYXJlIG9ubHkgZW5mb3JjZWQgaWYgZWNtYVZlcnNpb24gPj0gNS5cbiAgLy8gU2V0IGBhbGxvd1Jlc2VydmVkYCB0byBhIGJvb2xlYW4gdmFsdWUgdG8gZXhwbGljaXRseSB0dXJuIHRoaXMgb25cbiAgLy8gYW4gb2ZmLiBXaGVuIHRoaXMgb3B0aW9uIGhhcyB0aGUgdmFsdWUgXCJuZXZlclwiLCByZXNlcnZlZCB3b3Jkc1xuICAvLyBhbmQga2V5d29yZHMgY2FuIGFsc28gbm90IGJlIHVzZWQgYXMgcHJvcGVydHkgbmFtZXMuXG4gIGFsbG93UmVzZXJ2ZWQ6IG51bGwsXG4gIC8vIFdoZW4gZW5hYmxlZCwgYSByZXR1cm4gYXQgdGhlIHRvcCBsZXZlbCBpcyBub3QgY29uc2lkZXJlZCBhblxuICAvLyBlcnJvci5cbiAgYWxsb3dSZXR1cm5PdXRzaWRlRnVuY3Rpb246IGZhbHNlLFxuICAvLyBXaGVuIGVuYWJsZWQsIGltcG9ydC9leHBvcnQgc3RhdGVtZW50cyBhcmUgbm90IGNvbnN0cmFpbmVkIHRvXG4gIC8vIGFwcGVhcmluZyBhdCB0aGUgdG9wIG9mIHRoZSBwcm9ncmFtLCBhbmQgYW4gaW1wb3J0Lm1ldGEgZXhwcmVzc2lvblxuICAvLyBpbiBhIHNjcmlwdCBpc24ndCBjb25zaWRlcmVkIGFuIGVycm9yLlxuICBhbGxvd0ltcG9ydEV4cG9ydEV2ZXJ5d2hlcmU6IGZhbHNlLFxuICAvLyBCeSBkZWZhdWx0LCBhd2FpdCBpZGVudGlmaWVycyBhcmUgYWxsb3dlZCB0byBhcHBlYXIgYXQgdGhlIHRvcC1sZXZlbCBzY29wZSBvbmx5IGlmIGVjbWFWZXJzaW9uID49IDIwMjIuXG4gIC8vIFdoZW4gZW5hYmxlZCwgYXdhaXQgaWRlbnRpZmllcnMgYXJlIGFsbG93ZWQgdG8gYXBwZWFyIGF0IHRoZSB0b3AtbGV2ZWwgc2NvcGUsXG4gIC8vIGJ1dCB0aGV5IGFyZSBzdGlsbCBub3QgYWxsb3dlZCBpbiBub24tYXN5bmMgZnVuY3Rpb25zLlxuICBhbGxvd0F3YWl0T3V0c2lkZUZ1bmN0aW9uOiBudWxsLFxuICAvLyBXaGVuIGVuYWJsZWQsIHN1cGVyIGlkZW50aWZpZXJzIGFyZSBub3QgY29uc3RyYWluZWQgdG9cbiAgLy8gYXBwZWFyaW5nIGluIG1ldGhvZHMgYW5kIGRvIG5vdCByYWlzZSBhbiBlcnJvciB3aGVuIHRoZXkgYXBwZWFyIGVsc2V3aGVyZS5cbiAgYWxsb3dTdXBlck91dHNpZGVNZXRob2Q6IG51bGwsXG4gIC8vIFdoZW4gZW5hYmxlZCwgaGFzaGJhbmcgZGlyZWN0aXZlIGluIHRoZSBiZWdpbm5pbmcgb2YgZmlsZSBpc1xuICAvLyBhbGxvd2VkIGFuZCB0cmVhdGVkIGFzIGEgbGluZSBjb21tZW50LiBFbmFibGVkIGJ5IGRlZmF1bHQgd2hlblxuICAvLyBgZWNtYVZlcnNpb25gID49IDIwMjMuXG4gIGFsbG93SGFzaEJhbmc6IGZhbHNlLFxuICAvLyBCeSBkZWZhdWx0LCB0aGUgcGFyc2VyIHdpbGwgdmVyaWZ5IHRoYXQgcHJpdmF0ZSBwcm9wZXJ0aWVzIGFyZVxuICAvLyBvbmx5IHVzZWQgaW4gcGxhY2VzIHdoZXJlIHRoZXkgYXJlIHZhbGlkIGFuZCBoYXZlIGJlZW4gZGVjbGFyZWQuXG4gIC8vIFNldCB0aGlzIHRvIGZhbHNlIHRvIHR1cm4gc3VjaCBjaGVja3Mgb2ZmLlxuICBjaGVja1ByaXZhdGVGaWVsZHM6IHRydWUsXG4gIC8vIFdoZW4gYGxvY2F0aW9uc2AgaXMgb24sIGBsb2NgIHByb3BlcnRpZXMgaG9sZGluZyBvYmplY3RzIHdpdGhcbiAgLy8gYHN0YXJ0YCBhbmQgYGVuZGAgcHJvcGVydGllcyBpbiBge2xpbmUsIGNvbHVtbn1gIGZvcm0gKHdpdGhcbiAgLy8gbGluZSBiZWluZyAxLWJhc2VkIGFuZCBjb2x1bW4gMC1iYXNlZCkgd2lsbCBiZSBhdHRhY2hlZCB0byB0aGVcbiAgLy8gbm9kZXMuXG4gIGxvY2F0aW9uczogZmFsc2UsXG4gIC8vIEEgZnVuY3Rpb24gY2FuIGJlIHBhc3NlZCBhcyBgb25Ub2tlbmAgb3B0aW9uLCB3aGljaCB3aWxsXG4gIC8vIGNhdXNlIEFjb3JuIHRvIGNhbGwgdGhhdCBmdW5jdGlvbiB3aXRoIG9iamVjdCBpbiB0aGUgc2FtZVxuICAvLyBmb3JtYXQgYXMgdG9rZW5zIHJldHVybmVkIGZyb20gYHRva2VuaXplcigpLmdldFRva2VuKClgLiBOb3RlXG4gIC8vIHRoYXQgeW91IGFyZSBub3QgYWxsb3dlZCB0byBjYWxsIHRoZSBwYXJzZXIgZnJvbSB0aGVcbiAgLy8gY2FsbGJhY2tcdTIwMTR0aGF0IHdpbGwgY29ycnVwdCBpdHMgaW50ZXJuYWwgc3RhdGUuXG4gIG9uVG9rZW46IG51bGwsXG4gIC8vIEEgZnVuY3Rpb24gY2FuIGJlIHBhc3NlZCBhcyBgb25Db21tZW50YCBvcHRpb24sIHdoaWNoIHdpbGxcbiAgLy8gY2F1c2UgQWNvcm4gdG8gY2FsbCB0aGF0IGZ1bmN0aW9uIHdpdGggYChibG9jaywgdGV4dCwgc3RhcnQsXG4gIC8vIGVuZClgIHBhcmFtZXRlcnMgd2hlbmV2ZXIgYSBjb21tZW50IGlzIHNraXBwZWQuIGBibG9ja2AgaXMgYVxuICAvLyBib29sZWFuIGluZGljYXRpbmcgd2hldGhlciB0aGlzIGlzIGEgYmxvY2sgKGAvKiAqL2ApIGNvbW1lbnQsXG4gIC8vIGB0ZXh0YCBpcyB0aGUgY29udGVudCBvZiB0aGUgY29tbWVudCwgYW5kIGBzdGFydGAgYW5kIGBlbmRgIGFyZVxuICAvLyBjaGFyYWN0ZXIgb2Zmc2V0cyB0aGF0IGRlbm90ZSB0aGUgc3RhcnQgYW5kIGVuZCBvZiB0aGUgY29tbWVudC5cbiAgLy8gV2hlbiB0aGUgYGxvY2F0aW9uc2Agb3B0aW9uIGlzIG9uLCB0d28gbW9yZSBwYXJhbWV0ZXJzIGFyZVxuICAvLyBwYXNzZWQsIHRoZSBmdWxsIGB7bGluZSwgY29sdW1ufWAgbG9jYXRpb25zIG9mIHRoZSBzdGFydCBhbmRcbiAgLy8gZW5kIG9mIHRoZSBjb21tZW50cy4gTm90ZSB0aGF0IHlvdSBhcmUgbm90IGFsbG93ZWQgdG8gY2FsbCB0aGVcbiAgLy8gcGFyc2VyIGZyb20gdGhlIGNhbGxiYWNrXHUyMDE0dGhhdCB3aWxsIGNvcnJ1cHQgaXRzIGludGVybmFsIHN0YXRlLlxuICAvLyBXaGVuIHRoaXMgb3B0aW9uIGhhcyBhbiBhcnJheSBhcyB2YWx1ZSwgb2JqZWN0cyByZXByZXNlbnRpbmcgdGhlXG4gIC8vIGNvbW1lbnRzIGFyZSBwdXNoZWQgdG8gaXQuXG4gIG9uQ29tbWVudDogbnVsbCxcbiAgLy8gTm9kZXMgaGF2ZSB0aGVpciBzdGFydCBhbmQgZW5kIGNoYXJhY3RlcnMgb2Zmc2V0cyByZWNvcmRlZCBpblxuICAvLyBgc3RhcnRgIGFuZCBgZW5kYCBwcm9wZXJ0aWVzIChkaXJlY3RseSBvbiB0aGUgbm9kZSwgcmF0aGVyIHRoYW5cbiAgLy8gdGhlIGBsb2NgIG9iamVjdCwgd2hpY2ggaG9sZHMgbGluZS9jb2x1bW4gZGF0YS4gVG8gYWxzbyBhZGQgYVxuICAvLyBbc2VtaS1zdGFuZGFyZGl6ZWRdW3JhbmdlXSBgcmFuZ2VgIHByb3BlcnR5IGhvbGRpbmcgYSBgW3N0YXJ0LFxuICAvLyBlbmRdYCBhcnJheSB3aXRoIHRoZSBzYW1lIG51bWJlcnMsIHNldCB0aGUgYHJhbmdlc2Agb3B0aW9uIHRvXG4gIC8vIGB0cnVlYC5cbiAgLy9cbiAgLy8gW3JhbmdlXTogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NzQ1Njc4XG4gIHJhbmdlczogZmFsc2UsXG4gIC8vIEl0IGlzIHBvc3NpYmxlIHRvIHBhcnNlIG11bHRpcGxlIGZpbGVzIGludG8gYSBzaW5nbGUgQVNUIGJ5XG4gIC8vIHBhc3NpbmcgdGhlIHRyZWUgcHJvZHVjZWQgYnkgcGFyc2luZyB0aGUgZmlyc3QgZmlsZSBhc1xuICAvLyBgcHJvZ3JhbWAgb3B0aW9uIGluIHN1YnNlcXVlbnQgcGFyc2VzLiBUaGlzIHdpbGwgYWRkIHRoZVxuICAvLyB0b3BsZXZlbCBmb3JtcyBvZiB0aGUgcGFyc2VkIGZpbGUgdG8gdGhlIGBQcm9ncmFtYCAodG9wKSBub2RlXG4gIC8vIG9mIGFuIGV4aXN0aW5nIHBhcnNlIHRyZWUuXG4gIHByb2dyYW06IG51bGwsXG4gIC8vIFdoZW4gYGxvY2F0aW9uc2AgaXMgb24sIHlvdSBjYW4gcGFzcyB0aGlzIHRvIHJlY29yZCB0aGUgc291cmNlXG4gIC8vIGZpbGUgaW4gZXZlcnkgbm9kZSdzIGBsb2NgIG9iamVjdC5cbiAgc291cmNlRmlsZTogbnVsbCxcbiAgLy8gVGhpcyB2YWx1ZSwgaWYgZ2l2ZW4sIGlzIHN0b3JlZCBpbiBldmVyeSBub2RlLCB3aGV0aGVyXG4gIC8vIGBsb2NhdGlvbnNgIGlzIG9uIG9yIG9mZi5cbiAgZGlyZWN0U291cmNlRmlsZTogbnVsbCxcbiAgLy8gV2hlbiBlbmFibGVkLCBwYXJlbnRoZXNpemVkIGV4cHJlc3Npb25zIGFyZSByZXByZXNlbnRlZCBieVxuICAvLyAobm9uLXN0YW5kYXJkKSBQYXJlbnRoZXNpemVkRXhwcmVzc2lvbiBub2Rlc1xuICBwcmVzZXJ2ZVBhcmVuczogZmFsc2Vcbn07XG5cbi8vIEludGVycHJldCBhbmQgZGVmYXVsdCBhbiBvcHRpb25zIG9iamVjdFxuXG52YXIgd2FybmVkQWJvdXRFY21hVmVyc2lvbiA9IGZhbHNlO1xuXG5mdW5jdGlvbiBnZXRPcHRpb25zKG9wdHMpIHtcbiAgdmFyIG9wdGlvbnMgPSB7fTtcblxuICBmb3IgKHZhciBvcHQgaW4gZGVmYXVsdE9wdGlvbnMpXG4gICAgeyBvcHRpb25zW29wdF0gPSBvcHRzICYmIGhhc093bihvcHRzLCBvcHQpID8gb3B0c1tvcHRdIDogZGVmYXVsdE9wdGlvbnNbb3B0XTsgfVxuXG4gIGlmIChvcHRpb25zLmVjbWFWZXJzaW9uID09PSBcImxhdGVzdFwiKSB7XG4gICAgb3B0aW9ucy5lY21hVmVyc2lvbiA9IDFlODtcbiAgfSBlbHNlIGlmIChvcHRpb25zLmVjbWFWZXJzaW9uID09IG51bGwpIHtcbiAgICBpZiAoIXdhcm5lZEFib3V0RWNtYVZlcnNpb24gJiYgdHlwZW9mIGNvbnNvbGUgPT09IFwib2JqZWN0XCIgJiYgY29uc29sZS53YXJuKSB7XG4gICAgICB3YXJuZWRBYm91dEVjbWFWZXJzaW9uID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUud2FybihcIlNpbmNlIEFjb3JuIDguMC4wLCBvcHRpb25zLmVjbWFWZXJzaW9uIGlzIHJlcXVpcmVkLlxcbkRlZmF1bHRpbmcgdG8gMjAyMCwgYnV0IHRoaXMgd2lsbCBzdG9wIHdvcmtpbmcgaW4gdGhlIGZ1dHVyZS5cIik7XG4gICAgfVxuICAgIG9wdGlvbnMuZWNtYVZlcnNpb24gPSAxMTtcbiAgfSBlbHNlIGlmIChvcHRpb25zLmVjbWFWZXJzaW9uID49IDIwMTUpIHtcbiAgICBvcHRpb25zLmVjbWFWZXJzaW9uIC09IDIwMDk7XG4gIH1cblxuICBpZiAob3B0aW9ucy5hbGxvd1Jlc2VydmVkID09IG51bGwpXG4gICAgeyBvcHRpb25zLmFsbG93UmVzZXJ2ZWQgPSBvcHRpb25zLmVjbWFWZXJzaW9uIDwgNTsgfVxuXG4gIGlmICghb3B0cyB8fCBvcHRzLmFsbG93SGFzaEJhbmcgPT0gbnVsbClcbiAgICB7IG9wdGlvbnMuYWxsb3dIYXNoQmFuZyA9IG9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTQ7IH1cblxuICBpZiAoaXNBcnJheShvcHRpb25zLm9uVG9rZW4pKSB7XG4gICAgdmFyIHRva2VucyA9IG9wdGlvbnMub25Ub2tlbjtcbiAgICBvcHRpb25zLm9uVG9rZW4gPSBmdW5jdGlvbiAodG9rZW4pIHsgcmV0dXJuIHRva2Vucy5wdXNoKHRva2VuKTsgfTtcbiAgfVxuICBpZiAoaXNBcnJheShvcHRpb25zLm9uQ29tbWVudCkpXG4gICAgeyBvcHRpb25zLm9uQ29tbWVudCA9IHB1c2hDb21tZW50KG9wdGlvbnMsIG9wdGlvbnMub25Db21tZW50KTsgfVxuXG4gIHJldHVybiBvcHRpb25zXG59XG5cbmZ1bmN0aW9uIHB1c2hDb21tZW50KG9wdGlvbnMsIGFycmF5KSB7XG4gIHJldHVybiBmdW5jdGlvbihibG9jaywgdGV4dCwgc3RhcnQsIGVuZCwgc3RhcnRMb2MsIGVuZExvYykge1xuICAgIHZhciBjb21tZW50ID0ge1xuICAgICAgdHlwZTogYmxvY2sgPyBcIkJsb2NrXCIgOiBcIkxpbmVcIixcbiAgICAgIHZhbHVlOiB0ZXh0LFxuICAgICAgc3RhcnQ6IHN0YXJ0LFxuICAgICAgZW5kOiBlbmRcbiAgICB9O1xuICAgIGlmIChvcHRpb25zLmxvY2F0aW9ucylcbiAgICAgIHsgY29tbWVudC5sb2MgPSBuZXcgU291cmNlTG9jYXRpb24odGhpcywgc3RhcnRMb2MsIGVuZExvYyk7IH1cbiAgICBpZiAob3B0aW9ucy5yYW5nZXMpXG4gICAgICB7IGNvbW1lbnQucmFuZ2UgPSBbc3RhcnQsIGVuZF07IH1cbiAgICBhcnJheS5wdXNoKGNvbW1lbnQpO1xuICB9XG59XG5cbi8vIEVhY2ggc2NvcGUgZ2V0cyBhIGJpdHNldCB0aGF0IG1heSBjb250YWluIHRoZXNlIGZsYWdzXG52YXJcbiAgICBTQ09QRV9UT1AgPSAxLFxuICAgIFNDT1BFX0ZVTkNUSU9OID0gMixcbiAgICBTQ09QRV9BU1lOQyA9IDQsXG4gICAgU0NPUEVfR0VORVJBVE9SID0gOCxcbiAgICBTQ09QRV9BUlJPVyA9IDE2LFxuICAgIFNDT1BFX1NJTVBMRV9DQVRDSCA9IDMyLFxuICAgIFNDT1BFX1NVUEVSID0gNjQsXG4gICAgU0NPUEVfRElSRUNUX1NVUEVSID0gMTI4LFxuICAgIFNDT1BFX0NMQVNTX1NUQVRJQ19CTE9DSyA9IDI1NixcbiAgICBTQ09QRV9DTEFTU19GSUVMRF9JTklUID0gNTEyLFxuICAgIFNDT1BFX1ZBUiA9IFNDT1BFX1RPUCB8IFNDT1BFX0ZVTkNUSU9OIHwgU0NPUEVfQ0xBU1NfU1RBVElDX0JMT0NLO1xuXG5mdW5jdGlvbiBmdW5jdGlvbkZsYWdzKGFzeW5jLCBnZW5lcmF0b3IpIHtcbiAgcmV0dXJuIFNDT1BFX0ZVTkNUSU9OIHwgKGFzeW5jID8gU0NPUEVfQVNZTkMgOiAwKSB8IChnZW5lcmF0b3IgPyBTQ09QRV9HRU5FUkFUT1IgOiAwKVxufVxuXG4vLyBVc2VkIGluIGNoZWNrTFZhbCogYW5kIGRlY2xhcmVOYW1lIHRvIGRldGVybWluZSB0aGUgdHlwZSBvZiBhIGJpbmRpbmdcbnZhclxuICAgIEJJTkRfTk9ORSA9IDAsIC8vIE5vdCBhIGJpbmRpbmdcbiAgICBCSU5EX1ZBUiA9IDEsIC8vIFZhci1zdHlsZSBiaW5kaW5nXG4gICAgQklORF9MRVhJQ0FMID0gMiwgLy8gTGV0LSBvciBjb25zdC1zdHlsZSBiaW5kaW5nXG4gICAgQklORF9GVU5DVElPTiA9IDMsIC8vIEZ1bmN0aW9uIGRlY2xhcmF0aW9uXG4gICAgQklORF9TSU1QTEVfQ0FUQ0ggPSA0LCAvLyBTaW1wbGUgKGlkZW50aWZpZXIgcGF0dGVybikgY2F0Y2ggYmluZGluZ1xuICAgIEJJTkRfT1VUU0lERSA9IDU7IC8vIFNwZWNpYWwgY2FzZSBmb3IgZnVuY3Rpb24gbmFtZXMgYXMgYm91bmQgaW5zaWRlIHRoZSBmdW5jdGlvblxuXG52YXIgUGFyc2VyID0gZnVuY3Rpb24gUGFyc2VyKG9wdGlvbnMsIGlucHV0LCBzdGFydFBvcykge1xuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zID0gZ2V0T3B0aW9ucyhvcHRpb25zKTtcbiAgdGhpcy5zb3VyY2VGaWxlID0gb3B0aW9ucy5zb3VyY2VGaWxlO1xuICB0aGlzLmtleXdvcmRzID0gd29yZHNSZWdleHAoa2V5d29yZHMkMVtvcHRpb25zLmVjbWFWZXJzaW9uID49IDYgPyA2IDogb3B0aW9ucy5zb3VyY2VUeXBlID09PSBcIm1vZHVsZVwiID8gXCI1bW9kdWxlXCIgOiA1XSk7XG4gIHZhciByZXNlcnZlZCA9IFwiXCI7XG4gIGlmIChvcHRpb25zLmFsbG93UmVzZXJ2ZWQgIT09IHRydWUpIHtcbiAgICByZXNlcnZlZCA9IHJlc2VydmVkV29yZHNbb3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2ID8gNiA6IG9wdGlvbnMuZWNtYVZlcnNpb24gPT09IDUgPyA1IDogM107XG4gICAgaWYgKG9wdGlvbnMuc291cmNlVHlwZSA9PT0gXCJtb2R1bGVcIikgeyByZXNlcnZlZCArPSBcIiBhd2FpdFwiOyB9XG4gIH1cbiAgdGhpcy5yZXNlcnZlZFdvcmRzID0gd29yZHNSZWdleHAocmVzZXJ2ZWQpO1xuICB2YXIgcmVzZXJ2ZWRTdHJpY3QgPSAocmVzZXJ2ZWQgPyByZXNlcnZlZCArIFwiIFwiIDogXCJcIikgKyByZXNlcnZlZFdvcmRzLnN0cmljdDtcbiAgdGhpcy5yZXNlcnZlZFdvcmRzU3RyaWN0ID0gd29yZHNSZWdleHAocmVzZXJ2ZWRTdHJpY3QpO1xuICB0aGlzLnJlc2VydmVkV29yZHNTdHJpY3RCaW5kID0gd29yZHNSZWdleHAocmVzZXJ2ZWRTdHJpY3QgKyBcIiBcIiArIHJlc2VydmVkV29yZHMuc3RyaWN0QmluZCk7XG4gIHRoaXMuaW5wdXQgPSBTdHJpbmcoaW5wdXQpO1xuXG4gIC8vIFVzZWQgdG8gc2lnbmFsIHRvIGNhbGxlcnMgb2YgYHJlYWRXb3JkMWAgd2hldGhlciB0aGUgd29yZFxuICAvLyBjb250YWluZWQgYW55IGVzY2FwZSBzZXF1ZW5jZXMuIFRoaXMgaXMgbmVlZGVkIGJlY2F1c2Ugd29yZHMgd2l0aFxuICAvLyBlc2NhcGUgc2VxdWVuY2VzIG11c3Qgbm90IGJlIGludGVycHJldGVkIGFzIGtleXdvcmRzLlxuICB0aGlzLmNvbnRhaW5zRXNjID0gZmFsc2U7XG5cbiAgLy8gU2V0IHVwIHRva2VuIHN0YXRlXG5cbiAgLy8gVGhlIGN1cnJlbnQgcG9zaXRpb24gb2YgdGhlIHRva2VuaXplciBpbiB0aGUgaW5wdXQuXG4gIGlmIChzdGFydFBvcykge1xuICAgIHRoaXMucG9zID0gc3RhcnRQb3M7XG4gICAgdGhpcy5saW5lU3RhcnQgPSB0aGlzLmlucHV0Lmxhc3RJbmRleE9mKFwiXFxuXCIsIHN0YXJ0UG9zIC0gMSkgKyAxO1xuICAgIHRoaXMuY3VyTGluZSA9IHRoaXMuaW5wdXQuc2xpY2UoMCwgdGhpcy5saW5lU3RhcnQpLnNwbGl0KGxpbmVCcmVhaykubGVuZ3RoO1xuICB9IGVsc2Uge1xuICAgIHRoaXMucG9zID0gdGhpcy5saW5lU3RhcnQgPSAwO1xuICAgIHRoaXMuY3VyTGluZSA9IDE7XG4gIH1cblxuICAvLyBQcm9wZXJ0aWVzIG9mIHRoZSBjdXJyZW50IHRva2VuOlxuICAvLyBJdHMgdHlwZVxuICB0aGlzLnR5cGUgPSB0eXBlcyQxLmVvZjtcbiAgLy8gRm9yIHRva2VucyB0aGF0IGluY2x1ZGUgbW9yZSBpbmZvcm1hdGlvbiB0aGFuIHRoZWlyIHR5cGUsIHRoZSB2YWx1ZVxuICB0aGlzLnZhbHVlID0gbnVsbDtcbiAgLy8gSXRzIHN0YXJ0IGFuZCBlbmQgb2Zmc2V0XG4gIHRoaXMuc3RhcnQgPSB0aGlzLmVuZCA9IHRoaXMucG9zO1xuICAvLyBBbmQsIGlmIGxvY2F0aW9ucyBhcmUgdXNlZCwgdGhlIHtsaW5lLCBjb2x1bW59IG9iamVjdFxuICAvLyBjb3JyZXNwb25kaW5nIHRvIHRob3NlIG9mZnNldHNcbiAgdGhpcy5zdGFydExvYyA9IHRoaXMuZW5kTG9jID0gdGhpcy5jdXJQb3NpdGlvbigpO1xuXG4gIC8vIFBvc2l0aW9uIGluZm9ybWF0aW9uIGZvciB0aGUgcHJldmlvdXMgdG9rZW5cbiAgdGhpcy5sYXN0VG9rRW5kTG9jID0gdGhpcy5sYXN0VG9rU3RhcnRMb2MgPSBudWxsO1xuICB0aGlzLmxhc3RUb2tTdGFydCA9IHRoaXMubGFzdFRva0VuZCA9IHRoaXMucG9zO1xuXG4gIC8vIFRoZSBjb250ZXh0IHN0YWNrIGlzIHVzZWQgdG8gc3VwZXJmaWNpYWxseSB0cmFjayBzeW50YWN0aWNcbiAgLy8gY29udGV4dCB0byBwcmVkaWN0IHdoZXRoZXIgYSByZWd1bGFyIGV4cHJlc3Npb24gaXMgYWxsb3dlZCBpbiBhXG4gIC8vIGdpdmVuIHBvc2l0aW9uLlxuICB0aGlzLmNvbnRleHQgPSB0aGlzLmluaXRpYWxDb250ZXh0KCk7XG4gIHRoaXMuZXhwckFsbG93ZWQgPSB0cnVlO1xuXG4gIC8vIEZpZ3VyZSBvdXQgaWYgaXQncyBhIG1vZHVsZSBjb2RlLlxuICB0aGlzLmluTW9kdWxlID0gb3B0aW9ucy5zb3VyY2VUeXBlID09PSBcIm1vZHVsZVwiO1xuICB0aGlzLnN0cmljdCA9IHRoaXMuaW5Nb2R1bGUgfHwgdGhpcy5zdHJpY3REaXJlY3RpdmUodGhpcy5wb3MpO1xuXG4gIC8vIFVzZWQgdG8gc2lnbmlmeSB0aGUgc3RhcnQgb2YgYSBwb3RlbnRpYWwgYXJyb3cgZnVuY3Rpb25cbiAgdGhpcy5wb3RlbnRpYWxBcnJvd0F0ID0gLTE7XG4gIHRoaXMucG90ZW50aWFsQXJyb3dJbkZvckF3YWl0ID0gZmFsc2U7XG5cbiAgLy8gUG9zaXRpb25zIHRvIGRlbGF5ZWQtY2hlY2sgdGhhdCB5aWVsZC9hd2FpdCBkb2VzIG5vdCBleGlzdCBpbiBkZWZhdWx0IHBhcmFtZXRlcnMuXG4gIHRoaXMueWllbGRQb3MgPSB0aGlzLmF3YWl0UG9zID0gdGhpcy5hd2FpdElkZW50UG9zID0gMDtcbiAgLy8gTGFiZWxzIGluIHNjb3BlLlxuICB0aGlzLmxhYmVscyA9IFtdO1xuICAvLyBUaHVzLWZhciB1bmRlZmluZWQgZXhwb3J0cy5cbiAgdGhpcy51bmRlZmluZWRFeHBvcnRzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAvLyBJZiBlbmFibGVkLCBza2lwIGxlYWRpbmcgaGFzaGJhbmcgbGluZS5cbiAgaWYgKHRoaXMucG9zID09PSAwICYmIG9wdGlvbnMuYWxsb3dIYXNoQmFuZyAmJiB0aGlzLmlucHV0LnNsaWNlKDAsIDIpID09PSBcIiMhXCIpXG4gICAgeyB0aGlzLnNraXBMaW5lQ29tbWVudCgyKTsgfVxuXG4gIC8vIFNjb3BlIHRyYWNraW5nIGZvciBkdXBsaWNhdGUgdmFyaWFibGUgbmFtZXMgKHNlZSBzY29wZS5qcylcbiAgdGhpcy5zY29wZVN0YWNrID0gW107XG4gIHRoaXMuZW50ZXJTY29wZShTQ09QRV9UT1ApO1xuXG4gIC8vIEZvciBSZWdFeHAgdmFsaWRhdGlvblxuICB0aGlzLnJlZ2V4cFN0YXRlID0gbnVsbDtcblxuICAvLyBUaGUgc3RhY2sgb2YgcHJpdmF0ZSBuYW1lcy5cbiAgLy8gRWFjaCBlbGVtZW50IGhhcyB0d28gcHJvcGVydGllczogJ2RlY2xhcmVkJyBhbmQgJ3VzZWQnLlxuICAvLyBXaGVuIGl0IGV4aXRlZCBmcm9tIHRoZSBvdXRlcm1vc3QgY2xhc3MgZGVmaW5pdGlvbiwgYWxsIHVzZWQgcHJpdmF0ZSBuYW1lcyBtdXN0IGJlIGRlY2xhcmVkLlxuICB0aGlzLnByaXZhdGVOYW1lU3RhY2sgPSBbXTtcbn07XG5cbnZhciBwcm90b3R5cGVBY2Nlc3NvcnMgPSB7IGluRnVuY3Rpb246IHsgY29uZmlndXJhYmxlOiB0cnVlIH0saW5HZW5lcmF0b3I6IHsgY29uZmlndXJhYmxlOiB0cnVlIH0saW5Bc3luYzogeyBjb25maWd1cmFibGU6IHRydWUgfSxjYW5Bd2FpdDogeyBjb25maWd1cmFibGU6IHRydWUgfSxhbGxvd1N1cGVyOiB7IGNvbmZpZ3VyYWJsZTogdHJ1ZSB9LGFsbG93RGlyZWN0U3VwZXI6IHsgY29uZmlndXJhYmxlOiB0cnVlIH0sdHJlYXRGdW5jdGlvbnNBc1ZhcjogeyBjb25maWd1cmFibGU6IHRydWUgfSxhbGxvd05ld0RvdFRhcmdldDogeyBjb25maWd1cmFibGU6IHRydWUgfSxpbkNsYXNzU3RhdGljQmxvY2s6IHsgY29uZmlndXJhYmxlOiB0cnVlIH0gfTtcblxuUGFyc2VyLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uIHBhcnNlICgpIHtcbiAgdmFyIG5vZGUgPSB0aGlzLm9wdGlvbnMucHJvZ3JhbSB8fCB0aGlzLnN0YXJ0Tm9kZSgpO1xuICB0aGlzLm5leHRUb2tlbigpO1xuICByZXR1cm4gdGhpcy5wYXJzZVRvcExldmVsKG5vZGUpXG59O1xuXG5wcm90b3R5cGVBY2Nlc3NvcnMuaW5GdW5jdGlvbi5nZXQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAodGhpcy5jdXJyZW50VmFyU2NvcGUoKS5mbGFncyAmIFNDT1BFX0ZVTkNUSU9OKSA+IDAgfTtcblxucHJvdG90eXBlQWNjZXNzb3JzLmluR2VuZXJhdG9yLmdldCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICh0aGlzLmN1cnJlbnRWYXJTY29wZSgpLmZsYWdzICYgU0NPUEVfR0VORVJBVE9SKSA+IDAgfTtcblxucHJvdG90eXBlQWNjZXNzb3JzLmluQXN5bmMuZ2V0ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gKHRoaXMuY3VycmVudFZhclNjb3BlKCkuZmxhZ3MgJiBTQ09QRV9BU1lOQykgPiAwIH07XG5cbnByb3RvdHlwZUFjY2Vzc29ycy5jYW5Bd2FpdC5nZXQgPSBmdW5jdGlvbiAoKSB7XG4gIGZvciAodmFyIGkgPSB0aGlzLnNjb3BlU3RhY2subGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgcmVmID0gdGhpcy5zY29wZVN0YWNrW2ldO1xuICAgICAgdmFyIGZsYWdzID0gcmVmLmZsYWdzO1xuICAgIGlmIChmbGFncyAmIChTQ09QRV9DTEFTU19TVEFUSUNfQkxPQ0sgfCBTQ09QRV9DTEFTU19GSUVMRF9JTklUKSkgeyByZXR1cm4gZmFsc2UgfVxuICAgIGlmIChmbGFncyAmIFNDT1BFX0ZVTkNUSU9OKSB7IHJldHVybiAoZmxhZ3MgJiBTQ09QRV9BU1lOQykgPiAwIH1cbiAgfVxuICByZXR1cm4gKHRoaXMuaW5Nb2R1bGUgJiYgdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDEzKSB8fCB0aGlzLm9wdGlvbnMuYWxsb3dBd2FpdE91dHNpZGVGdW5jdGlvblxufTtcblxucHJvdG90eXBlQWNjZXNzb3JzLmFsbG93U3VwZXIuZ2V0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgcmVmID0gdGhpcy5jdXJyZW50VGhpc1Njb3BlKCk7XG4gICAgdmFyIGZsYWdzID0gcmVmLmZsYWdzO1xuICByZXR1cm4gKGZsYWdzICYgU0NPUEVfU1VQRVIpID4gMCB8fCB0aGlzLm9wdGlvbnMuYWxsb3dTdXBlck91dHNpZGVNZXRob2Rcbn07XG5cbnByb3RvdHlwZUFjY2Vzc29ycy5hbGxvd0RpcmVjdFN1cGVyLmdldCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICh0aGlzLmN1cnJlbnRUaGlzU2NvcGUoKS5mbGFncyAmIFNDT1BFX0RJUkVDVF9TVVBFUikgPiAwIH07XG5cbnByb3RvdHlwZUFjY2Vzc29ycy50cmVhdEZ1bmN0aW9uc0FzVmFyLmdldCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMudHJlYXRGdW5jdGlvbnNBc1ZhckluU2NvcGUodGhpcy5jdXJyZW50U2NvcGUoKSkgfTtcblxucHJvdG90eXBlQWNjZXNzb3JzLmFsbG93TmV3RG90VGFyZ2V0LmdldCA9IGZ1bmN0aW9uICgpIHtcbiAgZm9yICh2YXIgaSA9IHRoaXMuc2NvcGVTdGFjay5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIHZhciByZWYgPSB0aGlzLnNjb3BlU3RhY2tbaV07XG4gICAgICB2YXIgZmxhZ3MgPSByZWYuZmxhZ3M7XG4gICAgaWYgKGZsYWdzICYgKFNDT1BFX0NMQVNTX1NUQVRJQ19CTE9DSyB8IFNDT1BFX0NMQVNTX0ZJRUxEX0lOSVQpIHx8XG4gICAgICAgICgoZmxhZ3MgJiBTQ09QRV9GVU5DVElPTikgJiYgIShmbGFncyAmIFNDT1BFX0FSUk9XKSkpIHsgcmV0dXJuIHRydWUgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufTtcblxucHJvdG90eXBlQWNjZXNzb3JzLmluQ2xhc3NTdGF0aWNCbG9jay5nZXQgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiAodGhpcy5jdXJyZW50VmFyU2NvcGUoKS5mbGFncyAmIFNDT1BFX0NMQVNTX1NUQVRJQ19CTE9DSykgPiAwXG59O1xuXG5QYXJzZXIuZXh0ZW5kID0gZnVuY3Rpb24gZXh0ZW5kICgpIHtcbiAgICB2YXIgcGx1Z2lucyA9IFtdLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIHdoaWxlICggbGVuLS0gKSBwbHVnaW5zWyBsZW4gXSA9IGFyZ3VtZW50c1sgbGVuIF07XG5cbiAgdmFyIGNscyA9IHRoaXM7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcGx1Z2lucy5sZW5ndGg7IGkrKykgeyBjbHMgPSBwbHVnaW5zW2ldKGNscyk7IH1cbiAgcmV0dXJuIGNsc1xufTtcblxuUGFyc2VyLnBhcnNlID0gZnVuY3Rpb24gcGFyc2UgKGlucHV0LCBvcHRpb25zKSB7XG4gIHJldHVybiBuZXcgdGhpcyhvcHRpb25zLCBpbnB1dCkucGFyc2UoKVxufTtcblxuUGFyc2VyLnBhcnNlRXhwcmVzc2lvbkF0ID0gZnVuY3Rpb24gcGFyc2VFeHByZXNzaW9uQXQgKGlucHV0LCBwb3MsIG9wdGlvbnMpIHtcbiAgdmFyIHBhcnNlciA9IG5ldyB0aGlzKG9wdGlvbnMsIGlucHV0LCBwb3MpO1xuICBwYXJzZXIubmV4dFRva2VuKCk7XG4gIHJldHVybiBwYXJzZXIucGFyc2VFeHByZXNzaW9uKClcbn07XG5cblBhcnNlci50b2tlbml6ZXIgPSBmdW5jdGlvbiB0b2tlbml6ZXIgKGlucHV0LCBvcHRpb25zKSB7XG4gIHJldHVybiBuZXcgdGhpcyhvcHRpb25zLCBpbnB1dClcbn07XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKCBQYXJzZXIucHJvdG90eXBlLCBwcm90b3R5cGVBY2Nlc3NvcnMgKTtcblxudmFyIHBwJDkgPSBQYXJzZXIucHJvdG90eXBlO1xuXG4vLyAjIyBQYXJzZXIgdXRpbGl0aWVzXG5cbnZhciBsaXRlcmFsID0gL14oPzonKCg/OlxcXFxbXl18W14nXFxcXF0pKj8pJ3xcIigoPzpcXFxcW15dfFteXCJcXFxcXSkqPylcIikvO1xucHAkOS5zdHJpY3REaXJlY3RpdmUgPSBmdW5jdGlvbihzdGFydCkge1xuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uIDwgNSkgeyByZXR1cm4gZmFsc2UgfVxuICBmb3IgKDs7KSB7XG4gICAgLy8gVHJ5IHRvIGZpbmQgc3RyaW5nIGxpdGVyYWwuXG4gICAgc2tpcFdoaXRlU3BhY2UubGFzdEluZGV4ID0gc3RhcnQ7XG4gICAgc3RhcnQgKz0gc2tpcFdoaXRlU3BhY2UuZXhlYyh0aGlzLmlucHV0KVswXS5sZW5ndGg7XG4gICAgdmFyIG1hdGNoID0gbGl0ZXJhbC5leGVjKHRoaXMuaW5wdXQuc2xpY2Uoc3RhcnQpKTtcbiAgICBpZiAoIW1hdGNoKSB7IHJldHVybiBmYWxzZSB9XG4gICAgaWYgKChtYXRjaFsxXSB8fCBtYXRjaFsyXSkgPT09IFwidXNlIHN0cmljdFwiKSB7XG4gICAgICBza2lwV2hpdGVTcGFjZS5sYXN0SW5kZXggPSBzdGFydCArIG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgIHZhciBzcGFjZUFmdGVyID0gc2tpcFdoaXRlU3BhY2UuZXhlYyh0aGlzLmlucHV0KSwgZW5kID0gc3BhY2VBZnRlci5pbmRleCArIHNwYWNlQWZ0ZXJbMF0ubGVuZ3RoO1xuICAgICAgdmFyIG5leHQgPSB0aGlzLmlucHV0LmNoYXJBdChlbmQpO1xuICAgICAgcmV0dXJuIG5leHQgPT09IFwiO1wiIHx8IG5leHQgPT09IFwifVwiIHx8XG4gICAgICAgIChsaW5lQnJlYWsudGVzdChzcGFjZUFmdGVyWzBdKSAmJlxuICAgICAgICAgISgvWyhgLlsrXFwtLyolPD49LD9eJl0vLnRlc3QobmV4dCkgfHwgbmV4dCA9PT0gXCIhXCIgJiYgdGhpcy5pbnB1dC5jaGFyQXQoZW5kICsgMSkgPT09IFwiPVwiKSlcbiAgICB9XG4gICAgc3RhcnQgKz0gbWF0Y2hbMF0ubGVuZ3RoO1xuXG4gICAgLy8gU2tpcCBzZW1pY29sb24sIGlmIGFueS5cbiAgICBza2lwV2hpdGVTcGFjZS5sYXN0SW5kZXggPSBzdGFydDtcbiAgICBzdGFydCArPSBza2lwV2hpdGVTcGFjZS5leGVjKHRoaXMuaW5wdXQpWzBdLmxlbmd0aDtcbiAgICBpZiAodGhpcy5pbnB1dFtzdGFydF0gPT09IFwiO1wiKVxuICAgICAgeyBzdGFydCsrOyB9XG4gIH1cbn07XG5cbi8vIFByZWRpY2F0ZSB0aGF0IHRlc3RzIHdoZXRoZXIgdGhlIG5leHQgdG9rZW4gaXMgb2YgdGhlIGdpdmVuXG4vLyB0eXBlLCBhbmQgaWYgeWVzLCBjb25zdW1lcyBpdCBhcyBhIHNpZGUgZWZmZWN0LlxuXG5wcCQ5LmVhdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZSkge1xuICAgIHRoaXMubmV4dCgpO1xuICAgIHJldHVybiB0cnVlXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn07XG5cbi8vIFRlc3RzIHdoZXRoZXIgcGFyc2VkIHRva2VuIGlzIGEgY29udGV4dHVhbCBrZXl3b3JkLlxuXG5wcCQ5LmlzQ29udGV4dHVhbCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgcmV0dXJuIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5uYW1lICYmIHRoaXMudmFsdWUgPT09IG5hbWUgJiYgIXRoaXMuY29udGFpbnNFc2Ncbn07XG5cbi8vIENvbnN1bWVzIGNvbnRleHR1YWwga2V5d29yZCBpZiBwb3NzaWJsZS5cblxucHAkOS5lYXRDb250ZXh0dWFsID0gZnVuY3Rpb24obmFtZSkge1xuICBpZiAoIXRoaXMuaXNDb250ZXh0dWFsKG5hbWUpKSB7IHJldHVybiBmYWxzZSB9XG4gIHRoaXMubmV4dCgpO1xuICByZXR1cm4gdHJ1ZVxufTtcblxuLy8gQXNzZXJ0cyB0aGF0IGZvbGxvd2luZyB0b2tlbiBpcyBnaXZlbiBjb250ZXh0dWFsIGtleXdvcmQuXG5cbnBwJDkuZXhwZWN0Q29udGV4dHVhbCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgaWYgKCF0aGlzLmVhdENvbnRleHR1YWwobmFtZSkpIHsgdGhpcy51bmV4cGVjdGVkKCk7IH1cbn07XG5cbi8vIFRlc3Qgd2hldGhlciBhIHNlbWljb2xvbiBjYW4gYmUgaW5zZXJ0ZWQgYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24uXG5cbnBwJDkuY2FuSW5zZXJ0U2VtaWNvbG9uID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnR5cGUgPT09IHR5cGVzJDEuZW9mIHx8XG4gICAgdGhpcy50eXBlID09PSB0eXBlcyQxLmJyYWNlUiB8fFxuICAgIGxpbmVCcmVhay50ZXN0KHRoaXMuaW5wdXQuc2xpY2UodGhpcy5sYXN0VG9rRW5kLCB0aGlzLnN0YXJ0KSlcbn07XG5cbnBwJDkuaW5zZXJ0U2VtaWNvbG9uID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmNhbkluc2VydFNlbWljb2xvbigpKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5vbkluc2VydGVkU2VtaWNvbG9uKVxuICAgICAgeyB0aGlzLm9wdGlvbnMub25JbnNlcnRlZFNlbWljb2xvbih0aGlzLmxhc3RUb2tFbmQsIHRoaXMubGFzdFRva0VuZExvYyk7IH1cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG59O1xuXG4vLyBDb25zdW1lIGEgc2VtaWNvbG9uLCBvciwgZmFpbGluZyB0aGF0LCBzZWUgaWYgd2UgYXJlIGFsbG93ZWQgdG9cbi8vIHByZXRlbmQgdGhhdCB0aGVyZSBpcyBhIHNlbWljb2xvbiBhdCB0aGlzIHBvc2l0aW9uLlxuXG5wcCQ5LnNlbWljb2xvbiA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIXRoaXMuZWF0KHR5cGVzJDEuc2VtaSkgJiYgIXRoaXMuaW5zZXJ0U2VtaWNvbG9uKCkpIHsgdGhpcy51bmV4cGVjdGVkKCk7IH1cbn07XG5cbnBwJDkuYWZ0ZXJUcmFpbGluZ0NvbW1hID0gZnVuY3Rpb24odG9rVHlwZSwgbm90TmV4dCkge1xuICBpZiAodGhpcy50eXBlID09PSB0b2tUeXBlKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5vblRyYWlsaW5nQ29tbWEpXG4gICAgICB7IHRoaXMub3B0aW9ucy5vblRyYWlsaW5nQ29tbWEodGhpcy5sYXN0VG9rU3RhcnQsIHRoaXMubGFzdFRva1N0YXJ0TG9jKTsgfVxuICAgIGlmICghbm90TmV4dClcbiAgICAgIHsgdGhpcy5uZXh0KCk7IH1cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG59O1xuXG4vLyBFeHBlY3QgYSB0b2tlbiBvZiBhIGdpdmVuIHR5cGUuIElmIGZvdW5kLCBjb25zdW1lIGl0LCBvdGhlcndpc2UsXG4vLyByYWlzZSBhbiB1bmV4cGVjdGVkIHRva2VuIGVycm9yLlxuXG5wcCQ5LmV4cGVjdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdGhpcy5lYXQodHlwZSkgfHwgdGhpcy51bmV4cGVjdGVkKCk7XG59O1xuXG4vLyBSYWlzZSBhbiB1bmV4cGVjdGVkIHRva2VuIGVycm9yLlxuXG5wcCQ5LnVuZXhwZWN0ZWQgPSBmdW5jdGlvbihwb3MpIHtcbiAgdGhpcy5yYWlzZShwb3MgIT0gbnVsbCA/IHBvcyA6IHRoaXMuc3RhcnQsIFwiVW5leHBlY3RlZCB0b2tlblwiKTtcbn07XG5cbnZhciBEZXN0cnVjdHVyaW5nRXJyb3JzID0gZnVuY3Rpb24gRGVzdHJ1Y3R1cmluZ0Vycm9ycygpIHtcbiAgdGhpcy5zaG9ydGhhbmRBc3NpZ24gPVxuICB0aGlzLnRyYWlsaW5nQ29tbWEgPVxuICB0aGlzLnBhcmVudGhlc2l6ZWRBc3NpZ24gPVxuICB0aGlzLnBhcmVudGhlc2l6ZWRCaW5kID1cbiAgdGhpcy5kb3VibGVQcm90byA9XG4gICAgLTE7XG59O1xuXG5wcCQ5LmNoZWNrUGF0dGVybkVycm9ycyA9IGZ1bmN0aW9uKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMsIGlzQXNzaWduKSB7XG4gIGlmICghcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykgeyByZXR1cm4gfVxuICBpZiAocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy50cmFpbGluZ0NvbW1hID4gLTEpXG4gICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy50cmFpbGluZ0NvbW1hLCBcIkNvbW1hIGlzIG5vdCBwZXJtaXR0ZWQgYWZ0ZXIgdGhlIHJlc3QgZWxlbWVudFwiKTsgfVxuICB2YXIgcGFyZW5zID0gaXNBc3NpZ24gPyByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnBhcmVudGhlc2l6ZWRBc3NpZ24gOiByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnBhcmVudGhlc2l6ZWRCaW5kO1xuICBpZiAocGFyZW5zID4gLTEpIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKHBhcmVucywgaXNBc3NpZ24gPyBcIkFzc2lnbmluZyB0byBydmFsdWVcIiA6IFwiUGFyZW50aGVzaXplZCBwYXR0ZXJuXCIpOyB9XG59O1xuXG5wcCQ5LmNoZWNrRXhwcmVzc2lvbkVycm9ycyA9IGZ1bmN0aW9uKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMsIGFuZFRocm93KSB7XG4gIGlmICghcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykgeyByZXR1cm4gZmFsc2UgfVxuICB2YXIgc2hvcnRoYW5kQXNzaWduID0gcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy5zaG9ydGhhbmRBc3NpZ247XG4gIHZhciBkb3VibGVQcm90byA9IHJlZkRlc3RydWN0dXJpbmdFcnJvcnMuZG91YmxlUHJvdG87XG4gIGlmICghYW5kVGhyb3cpIHsgcmV0dXJuIHNob3J0aGFuZEFzc2lnbiA+PSAwIHx8IGRvdWJsZVByb3RvID49IDAgfVxuICBpZiAoc2hvcnRoYW5kQXNzaWduID49IDApXG4gICAgeyB0aGlzLnJhaXNlKHNob3J0aGFuZEFzc2lnbiwgXCJTaG9ydGhhbmQgcHJvcGVydHkgYXNzaWdubWVudHMgYXJlIHZhbGlkIG9ubHkgaW4gZGVzdHJ1Y3R1cmluZyBwYXR0ZXJuc1wiKTsgfVxuICBpZiAoZG91YmxlUHJvdG8gPj0gMClcbiAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShkb3VibGVQcm90bywgXCJSZWRlZmluaXRpb24gb2YgX19wcm90b19fIHByb3BlcnR5XCIpOyB9XG59O1xuXG5wcCQ5LmNoZWNrWWllbGRBd2FpdEluRGVmYXVsdFBhcmFtcyA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy55aWVsZFBvcyAmJiAoIXRoaXMuYXdhaXRQb3MgfHwgdGhpcy55aWVsZFBvcyA8IHRoaXMuYXdhaXRQb3MpKVxuICAgIHsgdGhpcy5yYWlzZSh0aGlzLnlpZWxkUG9zLCBcIllpZWxkIGV4cHJlc3Npb24gY2Fubm90IGJlIGEgZGVmYXVsdCB2YWx1ZVwiKTsgfVxuICBpZiAodGhpcy5hd2FpdFBvcylcbiAgICB7IHRoaXMucmFpc2UodGhpcy5hd2FpdFBvcywgXCJBd2FpdCBleHByZXNzaW9uIGNhbm5vdCBiZSBhIGRlZmF1bHQgdmFsdWVcIik7IH1cbn07XG5cbnBwJDkuaXNTaW1wbGVBc3NpZ25UYXJnZXQgPSBmdW5jdGlvbihleHByKSB7XG4gIGlmIChleHByLnR5cGUgPT09IFwiUGFyZW50aGVzaXplZEV4cHJlc3Npb25cIilcbiAgICB7IHJldHVybiB0aGlzLmlzU2ltcGxlQXNzaWduVGFyZ2V0KGV4cHIuZXhwcmVzc2lvbikgfVxuICByZXR1cm4gZXhwci50eXBlID09PSBcIklkZW50aWZpZXJcIiB8fCBleHByLnR5cGUgPT09IFwiTWVtYmVyRXhwcmVzc2lvblwiXG59O1xuXG52YXIgcHAkOCA9IFBhcnNlci5wcm90b3R5cGU7XG5cbi8vICMjIyBTdGF0ZW1lbnQgcGFyc2luZ1xuXG4vLyBQYXJzZSBhIHByb2dyYW0uIEluaXRpYWxpemVzIHRoZSBwYXJzZXIsIHJlYWRzIGFueSBudW1iZXIgb2Zcbi8vIHN0YXRlbWVudHMsIGFuZCB3cmFwcyB0aGVtIGluIGEgUHJvZ3JhbSBub2RlLiAgT3B0aW9uYWxseSB0YWtlcyBhXG4vLyBgcHJvZ3JhbWAgYXJndW1lbnQuICBJZiBwcmVzZW50LCB0aGUgc3RhdGVtZW50cyB3aWxsIGJlIGFwcGVuZGVkXG4vLyB0byBpdHMgYm9keSBpbnN0ZWFkIG9mIGNyZWF0aW5nIGEgbmV3IG5vZGUuXG5cbnBwJDgucGFyc2VUb3BMZXZlbCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgdmFyIGV4cG9ydHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBpZiAoIW5vZGUuYm9keSkgeyBub2RlLmJvZHkgPSBbXTsgfVxuICB3aGlsZSAodGhpcy50eXBlICE9PSB0eXBlcyQxLmVvZikge1xuICAgIHZhciBzdG10ID0gdGhpcy5wYXJzZVN0YXRlbWVudChudWxsLCB0cnVlLCBleHBvcnRzKTtcbiAgICBub2RlLmJvZHkucHVzaChzdG10KTtcbiAgfVxuICBpZiAodGhpcy5pbk1vZHVsZSlcbiAgICB7IGZvciAodmFyIGkgPSAwLCBsaXN0ID0gT2JqZWN0LmtleXModGhpcy51bmRlZmluZWRFeHBvcnRzKTsgaSA8IGxpc3QubGVuZ3RoOyBpICs9IDEpXG4gICAgICB7XG4gICAgICAgIHZhciBuYW1lID0gbGlzdFtpXTtcblxuICAgICAgICB0aGlzLnJhaXNlUmVjb3ZlcmFibGUodGhpcy51bmRlZmluZWRFeHBvcnRzW25hbWVdLnN0YXJ0LCAoXCJFeHBvcnQgJ1wiICsgbmFtZSArIFwiJyBpcyBub3QgZGVmaW5lZFwiKSk7XG4gICAgICB9IH1cbiAgdGhpcy5hZGFwdERpcmVjdGl2ZVByb2xvZ3VlKG5vZGUuYm9keSk7XG4gIHRoaXMubmV4dCgpO1xuICBub2RlLnNvdXJjZVR5cGUgPSB0aGlzLm9wdGlvbnMuc291cmNlVHlwZTtcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIlByb2dyYW1cIilcbn07XG5cbnZhciBsb29wTGFiZWwgPSB7a2luZDogXCJsb29wXCJ9LCBzd2l0Y2hMYWJlbCA9IHtraW5kOiBcInN3aXRjaFwifTtcblxucHAkOC5pc0xldCA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA8IDYgfHwgIXRoaXMuaXNDb250ZXh0dWFsKFwibGV0XCIpKSB7IHJldHVybiBmYWxzZSB9XG4gIHNraXBXaGl0ZVNwYWNlLmxhc3RJbmRleCA9IHRoaXMucG9zO1xuICB2YXIgc2tpcCA9IHNraXBXaGl0ZVNwYWNlLmV4ZWModGhpcy5pbnB1dCk7XG4gIHZhciBuZXh0ID0gdGhpcy5wb3MgKyBza2lwWzBdLmxlbmd0aCwgbmV4dENoID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KG5leHQpO1xuICAvLyBGb3IgYW1iaWd1b3VzIGNhc2VzLCBkZXRlcm1pbmUgaWYgYSBMZXhpY2FsRGVjbGFyYXRpb24gKG9yIG9ubHkgYVxuICAvLyBTdGF0ZW1lbnQpIGlzIGFsbG93ZWQgaGVyZS4gSWYgY29udGV4dCBpcyBub3QgZW1wdHkgdGhlbiBvbmx5IGEgU3RhdGVtZW50XG4gIC8vIGlzIGFsbG93ZWQuIEhvd2V2ZXIsIGBsZXQgW2AgaXMgYW4gZXhwbGljaXQgbmVnYXRpdmUgbG9va2FoZWFkIGZvclxuICAvLyBFeHByZXNzaW9uU3RhdGVtZW50LCBzbyBzcGVjaWFsLWNhc2UgaXQgZmlyc3QuXG4gIGlmIChuZXh0Q2ggPT09IDkxIHx8IG5leHRDaCA9PT0gOTIpIHsgcmV0dXJuIHRydWUgfSAvLyAnWycsICdcXCdcbiAgaWYgKGNvbnRleHQpIHsgcmV0dXJuIGZhbHNlIH1cblxuICBpZiAobmV4dENoID09PSAxMjMgfHwgbmV4dENoID4gMHhkN2ZmICYmIG5leHRDaCA8IDB4ZGMwMCkgeyByZXR1cm4gdHJ1ZSB9IC8vICd7JywgYXN0cmFsXG4gIGlmIChpc0lkZW50aWZpZXJTdGFydChuZXh0Q2gsIHRydWUpKSB7XG4gICAgdmFyIHBvcyA9IG5leHQgKyAxO1xuICAgIHdoaWxlIChpc0lkZW50aWZpZXJDaGFyKG5leHRDaCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdChwb3MpLCB0cnVlKSkgeyArK3BvczsgfVxuICAgIGlmIChuZXh0Q2ggPT09IDkyIHx8IG5leHRDaCA+IDB4ZDdmZiAmJiBuZXh0Q2ggPCAweGRjMDApIHsgcmV0dXJuIHRydWUgfVxuICAgIHZhciBpZGVudCA9IHRoaXMuaW5wdXQuc2xpY2UobmV4dCwgcG9zKTtcbiAgICBpZiAoIWtleXdvcmRSZWxhdGlvbmFsT3BlcmF0b3IudGVzdChpZGVudCkpIHsgcmV0dXJuIHRydWUgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufTtcblxuLy8gY2hlY2sgJ2FzeW5jIFtubyBMaW5lVGVybWluYXRvciBoZXJlXSBmdW5jdGlvbidcbi8vIC0gJ2FzeW5jIC8qZm9vKi8gZnVuY3Rpb24nIGlzIE9LLlxuLy8gLSAnYXN5bmMgLypcXG4qLyBmdW5jdGlvbicgaXMgaW52YWxpZC5cbnBwJDguaXNBc3luY0Z1bmN0aW9uID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPCA4IHx8ICF0aGlzLmlzQ29udGV4dHVhbChcImFzeW5jXCIpKVxuICAgIHsgcmV0dXJuIGZhbHNlIH1cblxuICBza2lwV2hpdGVTcGFjZS5sYXN0SW5kZXggPSB0aGlzLnBvcztcbiAgdmFyIHNraXAgPSBza2lwV2hpdGVTcGFjZS5leGVjKHRoaXMuaW5wdXQpO1xuICB2YXIgbmV4dCA9IHRoaXMucG9zICsgc2tpcFswXS5sZW5ndGgsIGFmdGVyO1xuICByZXR1cm4gIWxpbmVCcmVhay50ZXN0KHRoaXMuaW5wdXQuc2xpY2UodGhpcy5wb3MsIG5leHQpKSAmJlxuICAgIHRoaXMuaW5wdXQuc2xpY2UobmV4dCwgbmV4dCArIDgpID09PSBcImZ1bmN0aW9uXCIgJiZcbiAgICAobmV4dCArIDggPT09IHRoaXMuaW5wdXQubGVuZ3RoIHx8XG4gICAgICEoaXNJZGVudGlmaWVyQ2hhcihhZnRlciA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdChuZXh0ICsgOCkpIHx8IGFmdGVyID4gMHhkN2ZmICYmIGFmdGVyIDwgMHhkYzAwKSlcbn07XG5cbnBwJDguaXNVc2luZ0tleXdvcmQgPSBmdW5jdGlvbihpc0F3YWl0VXNpbmcsIGlzRm9yKSB7XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPCAxNyB8fCAhdGhpcy5pc0NvbnRleHR1YWwoaXNBd2FpdFVzaW5nID8gXCJhd2FpdFwiIDogXCJ1c2luZ1wiKSlcbiAgICB7IHJldHVybiBmYWxzZSB9XG5cbiAgc2tpcFdoaXRlU3BhY2UubGFzdEluZGV4ID0gdGhpcy5wb3M7XG4gIHZhciBza2lwID0gc2tpcFdoaXRlU3BhY2UuZXhlYyh0aGlzLmlucHV0KTtcbiAgdmFyIG5leHQgPSB0aGlzLnBvcyArIHNraXBbMF0ubGVuZ3RoO1xuXG4gIGlmIChsaW5lQnJlYWsudGVzdCh0aGlzLmlucHV0LnNsaWNlKHRoaXMucG9zLCBuZXh0KSkpIHsgcmV0dXJuIGZhbHNlIH1cblxuICBpZiAoaXNBd2FpdFVzaW5nKSB7XG4gICAgdmFyIGF3YWl0RW5kUG9zID0gbmV4dCArIDUgLyogYXdhaXQgKi8sIGFmdGVyO1xuICAgIGlmICh0aGlzLmlucHV0LnNsaWNlKG5leHQsIGF3YWl0RW5kUG9zKSAhPT0gXCJ1c2luZ1wiIHx8XG4gICAgICBhd2FpdEVuZFBvcyA9PT0gdGhpcy5pbnB1dC5sZW5ndGggfHxcbiAgICAgIGlzSWRlbnRpZmllckNoYXIoYWZ0ZXIgPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQoYXdhaXRFbmRQb3MpKSB8fFxuICAgICAgKGFmdGVyID4gMHhkN2ZmICYmIGFmdGVyIDwgMHhkYzAwKVxuICAgICkgeyByZXR1cm4gZmFsc2UgfVxuXG4gICAgc2tpcFdoaXRlU3BhY2UubGFzdEluZGV4ID0gYXdhaXRFbmRQb3M7XG4gICAgdmFyIHNraXBBZnRlclVzaW5nID0gc2tpcFdoaXRlU3BhY2UuZXhlYyh0aGlzLmlucHV0KTtcbiAgICBpZiAoc2tpcEFmdGVyVXNpbmcgJiYgbGluZUJyZWFrLnRlc3QodGhpcy5pbnB1dC5zbGljZShhd2FpdEVuZFBvcywgYXdhaXRFbmRQb3MgKyBza2lwQWZ0ZXJVc2luZ1swXS5sZW5ndGgpKSkgeyByZXR1cm4gZmFsc2UgfVxuICB9XG5cbiAgaWYgKGlzRm9yKSB7XG4gICAgdmFyIG9mRW5kUG9zID0gbmV4dCArIDIgLyogb2YgKi8sIGFmdGVyJDE7XG4gICAgaWYgKHRoaXMuaW5wdXQuc2xpY2UobmV4dCwgb2ZFbmRQb3MpID09PSBcIm9mXCIpIHtcbiAgICAgIGlmIChvZkVuZFBvcyA9PT0gdGhpcy5pbnB1dC5sZW5ndGggfHxcbiAgICAgICAgKCFpc0lkZW50aWZpZXJDaGFyKGFmdGVyJDEgPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQob2ZFbmRQb3MpKSAmJiAhKGFmdGVyJDEgPiAweGQ3ZmYgJiYgYWZ0ZXIkMSA8IDB4ZGMwMCkpKSB7IHJldHVybiBmYWxzZSB9XG4gICAgfVxuICB9XG5cbiAgdmFyIGNoID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KG5leHQpO1xuICByZXR1cm4gaXNJZGVudGlmaWVyU3RhcnQoY2gsIHRydWUpIHx8IGNoID09PSA5MiAvLyAnXFwnXG59O1xuXG5wcCQ4LmlzQXdhaXRVc2luZyA9IGZ1bmN0aW9uKGlzRm9yKSB7XG4gIHJldHVybiB0aGlzLmlzVXNpbmdLZXl3b3JkKHRydWUsIGlzRm9yKVxufTtcblxucHAkOC5pc1VzaW5nID0gZnVuY3Rpb24oaXNGb3IpIHtcbiAgcmV0dXJuIHRoaXMuaXNVc2luZ0tleXdvcmQoZmFsc2UsIGlzRm9yKVxufTtcblxuLy8gUGFyc2UgYSBzaW5nbGUgc3RhdGVtZW50LlxuLy9cbi8vIElmIGV4cGVjdGluZyBhIHN0YXRlbWVudCBhbmQgZmluZGluZyBhIHNsYXNoIG9wZXJhdG9yLCBwYXJzZSBhXG4vLyByZWd1bGFyIGV4cHJlc3Npb24gbGl0ZXJhbC4gVGhpcyBpcyB0byBoYW5kbGUgY2FzZXMgbGlrZVxuLy8gYGlmIChmb28pIC9ibGFoLy5leGVjKGZvbylgLCB3aGVyZSBsb29raW5nIGF0IHRoZSBwcmV2aW91cyB0b2tlblxuLy8gZG9lcyBub3QgaGVscC5cblxucHAkOC5wYXJzZVN0YXRlbWVudCA9IGZ1bmN0aW9uKGNvbnRleHQsIHRvcExldmVsLCBleHBvcnRzKSB7XG4gIHZhciBzdGFydHR5cGUgPSB0aGlzLnR5cGUsIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpLCBraW5kO1xuXG4gIGlmICh0aGlzLmlzTGV0KGNvbnRleHQpKSB7XG4gICAgc3RhcnR0eXBlID0gdHlwZXMkMS5fdmFyO1xuICAgIGtpbmQgPSBcImxldFwiO1xuICB9XG5cbiAgLy8gTW9zdCB0eXBlcyBvZiBzdGF0ZW1lbnRzIGFyZSByZWNvZ25pemVkIGJ5IHRoZSBrZXl3b3JkIHRoZXlcbiAgLy8gc3RhcnQgd2l0aC4gTWFueSBhcmUgdHJpdmlhbCB0byBwYXJzZSwgc29tZSByZXF1aXJlIGEgYml0IG9mXG4gIC8vIGNvbXBsZXhpdHkuXG5cbiAgc3dpdGNoIChzdGFydHR5cGUpIHtcbiAgY2FzZSB0eXBlcyQxLl9icmVhazogY2FzZSB0eXBlcyQxLl9jb250aW51ZTogcmV0dXJuIHRoaXMucGFyc2VCcmVha0NvbnRpbnVlU3RhdGVtZW50KG5vZGUsIHN0YXJ0dHlwZS5rZXl3b3JkKVxuICBjYXNlIHR5cGVzJDEuX2RlYnVnZ2VyOiByZXR1cm4gdGhpcy5wYXJzZURlYnVnZ2VyU3RhdGVtZW50KG5vZGUpXG4gIGNhc2UgdHlwZXMkMS5fZG86IHJldHVybiB0aGlzLnBhcnNlRG9TdGF0ZW1lbnQobm9kZSlcbiAgY2FzZSB0eXBlcyQxLl9mb3I6IHJldHVybiB0aGlzLnBhcnNlRm9yU3RhdGVtZW50KG5vZGUpXG4gIGNhc2UgdHlwZXMkMS5fZnVuY3Rpb246XG4gICAgLy8gRnVuY3Rpb24gYXMgc29sZSBib2R5IG9mIGVpdGhlciBhbiBpZiBzdGF0ZW1lbnQgb3IgYSBsYWJlbGVkIHN0YXRlbWVudFxuICAgIC8vIHdvcmtzLCBidXQgbm90IHdoZW4gaXQgaXMgcGFydCBvZiBhIGxhYmVsZWQgc3RhdGVtZW50IHRoYXQgaXMgdGhlIHNvbGVcbiAgICAvLyBib2R5IG9mIGFuIGlmIHN0YXRlbWVudC5cbiAgICBpZiAoKGNvbnRleHQgJiYgKHRoaXMuc3RyaWN0IHx8IGNvbnRleHQgIT09IFwiaWZcIiAmJiBjb250ZXh0ICE9PSBcImxhYmVsXCIpKSAmJiB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNikgeyB0aGlzLnVuZXhwZWN0ZWQoKTsgfVxuICAgIHJldHVybiB0aGlzLnBhcnNlRnVuY3Rpb25TdGF0ZW1lbnQobm9kZSwgZmFsc2UsICFjb250ZXh0KVxuICBjYXNlIHR5cGVzJDEuX2NsYXNzOlxuICAgIGlmIChjb250ZXh0KSB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gICAgcmV0dXJuIHRoaXMucGFyc2VDbGFzcyhub2RlLCB0cnVlKVxuICBjYXNlIHR5cGVzJDEuX2lmOiByZXR1cm4gdGhpcy5wYXJzZUlmU3RhdGVtZW50KG5vZGUpXG4gIGNhc2UgdHlwZXMkMS5fcmV0dXJuOiByZXR1cm4gdGhpcy5wYXJzZVJldHVyblN0YXRlbWVudChub2RlKVxuICBjYXNlIHR5cGVzJDEuX3N3aXRjaDogcmV0dXJuIHRoaXMucGFyc2VTd2l0Y2hTdGF0ZW1lbnQobm9kZSlcbiAgY2FzZSB0eXBlcyQxLl90aHJvdzogcmV0dXJuIHRoaXMucGFyc2VUaHJvd1N0YXRlbWVudChub2RlKVxuICBjYXNlIHR5cGVzJDEuX3RyeTogcmV0dXJuIHRoaXMucGFyc2VUcnlTdGF0ZW1lbnQobm9kZSlcbiAgY2FzZSB0eXBlcyQxLl9jb25zdDogY2FzZSB0eXBlcyQxLl92YXI6XG4gICAga2luZCA9IGtpbmQgfHwgdGhpcy52YWx1ZTtcbiAgICBpZiAoY29udGV4dCAmJiBraW5kICE9PSBcInZhclwiKSB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gICAgcmV0dXJuIHRoaXMucGFyc2VWYXJTdGF0ZW1lbnQobm9kZSwga2luZClcbiAgY2FzZSB0eXBlcyQxLl93aGlsZTogcmV0dXJuIHRoaXMucGFyc2VXaGlsZVN0YXRlbWVudChub2RlKVxuICBjYXNlIHR5cGVzJDEuX3dpdGg6IHJldHVybiB0aGlzLnBhcnNlV2l0aFN0YXRlbWVudChub2RlKVxuICBjYXNlIHR5cGVzJDEuYnJhY2VMOiByZXR1cm4gdGhpcy5wYXJzZUJsb2NrKHRydWUsIG5vZGUpXG4gIGNhc2UgdHlwZXMkMS5zZW1pOiByZXR1cm4gdGhpcy5wYXJzZUVtcHR5U3RhdGVtZW50KG5vZGUpXG4gIGNhc2UgdHlwZXMkMS5fZXhwb3J0OlxuICBjYXNlIHR5cGVzJDEuX2ltcG9ydDpcbiAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID4gMTAgJiYgc3RhcnR0eXBlID09PSB0eXBlcyQxLl9pbXBvcnQpIHtcbiAgICAgIHNraXBXaGl0ZVNwYWNlLmxhc3RJbmRleCA9IHRoaXMucG9zO1xuICAgICAgdmFyIHNraXAgPSBza2lwV2hpdGVTcGFjZS5leGVjKHRoaXMuaW5wdXQpO1xuICAgICAgdmFyIG5leHQgPSB0aGlzLnBvcyArIHNraXBbMF0ubGVuZ3RoLCBuZXh0Q2ggPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQobmV4dCk7XG4gICAgICBpZiAobmV4dENoID09PSA0MCB8fCBuZXh0Q2ggPT09IDQ2KSAvLyAnKCcgb3IgJy4nXG4gICAgICAgIHsgcmV0dXJuIHRoaXMucGFyc2VFeHByZXNzaW9uU3RhdGVtZW50KG5vZGUsIHRoaXMucGFyc2VFeHByZXNzaW9uKCkpIH1cbiAgICB9XG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5hbGxvd0ltcG9ydEV4cG9ydEV2ZXJ5d2hlcmUpIHtcbiAgICAgIGlmICghdG9wTGV2ZWwpXG4gICAgICAgIHsgdGhpcy5yYWlzZSh0aGlzLnN0YXJ0LCBcIidpbXBvcnQnIGFuZCAnZXhwb3J0JyBtYXkgb25seSBhcHBlYXIgYXQgdGhlIHRvcCBsZXZlbFwiKTsgfVxuICAgICAgaWYgKCF0aGlzLmluTW9kdWxlKVxuICAgICAgICB7IHRoaXMucmFpc2UodGhpcy5zdGFydCwgXCInaW1wb3J0JyBhbmQgJ2V4cG9ydCcgbWF5IGFwcGVhciBvbmx5IHdpdGggJ3NvdXJjZVR5cGU6IG1vZHVsZSdcIik7IH1cbiAgICB9XG4gICAgcmV0dXJuIHN0YXJ0dHlwZSA9PT0gdHlwZXMkMS5faW1wb3J0ID8gdGhpcy5wYXJzZUltcG9ydChub2RlKSA6IHRoaXMucGFyc2VFeHBvcnQobm9kZSwgZXhwb3J0cylcblxuICAgIC8vIElmIHRoZSBzdGF0ZW1lbnQgZG9lcyBub3Qgc3RhcnQgd2l0aCBhIHN0YXRlbWVudCBrZXl3b3JkIG9yIGFcbiAgICAvLyBicmFjZSwgaXQncyBhbiBFeHByZXNzaW9uU3RhdGVtZW50IG9yIExhYmVsZWRTdGF0ZW1lbnQuIFdlXG4gICAgLy8gc2ltcGx5IHN0YXJ0IHBhcnNpbmcgYW4gZXhwcmVzc2lvbiwgYW5kIGFmdGVyd2FyZHMsIGlmIHRoZVxuICAgIC8vIG5leHQgdG9rZW4gaXMgYSBjb2xvbiBhbmQgdGhlIGV4cHJlc3Npb24gd2FzIGEgc2ltcGxlXG4gICAgLy8gSWRlbnRpZmllciBub2RlLCB3ZSBzd2l0Y2ggdG8gaW50ZXJwcmV0aW5nIGl0IGFzIGEgbGFiZWwuXG4gIGRlZmF1bHQ6XG4gICAgaWYgKHRoaXMuaXNBc3luY0Z1bmN0aW9uKCkpIHtcbiAgICAgIGlmIChjb250ZXh0KSB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gICAgICB0aGlzLm5leHQoKTtcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlRnVuY3Rpb25TdGF0ZW1lbnQobm9kZSwgdHJ1ZSwgIWNvbnRleHQpXG4gICAgfVxuXG4gICAgdmFyIHVzaW5nS2luZCA9IHRoaXMuaXNBd2FpdFVzaW5nKGZhbHNlKSA/IFwiYXdhaXQgdXNpbmdcIiA6IHRoaXMuaXNVc2luZyhmYWxzZSkgPyBcInVzaW5nXCIgOiBudWxsO1xuICAgIGlmICh1c2luZ0tpbmQpIHtcbiAgICAgIGlmICh0b3BMZXZlbCAmJiB0aGlzLm9wdGlvbnMuc291cmNlVHlwZSA9PT0gXCJzY3JpcHRcIikge1xuICAgICAgICB0aGlzLnJhaXNlKHRoaXMuc3RhcnQsIFwiVXNpbmcgZGVjbGFyYXRpb24gY2Fubm90IGFwcGVhciBpbiB0aGUgdG9wIGxldmVsIHdoZW4gc291cmNlIHR5cGUgaXMgYHNjcmlwdGBcIik7XG4gICAgICB9XG4gICAgICBpZiAodXNpbmdLaW5kID09PSBcImF3YWl0IHVzaW5nXCIpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbkF3YWl0KSB7XG4gICAgICAgICAgdGhpcy5yYWlzZSh0aGlzLnN0YXJ0LCBcIkF3YWl0IHVzaW5nIGNhbm5vdCBhcHBlYXIgb3V0c2lkZSBvZiBhc3luYyBmdW5jdGlvblwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm5leHQoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMubmV4dCgpO1xuICAgICAgdGhpcy5wYXJzZVZhcihub2RlLCBmYWxzZSwgdXNpbmdLaW5kKTtcbiAgICAgIHRoaXMuc2VtaWNvbG9uKCk7XG4gICAgICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiVmFyaWFibGVEZWNsYXJhdGlvblwiKVxuICAgIH1cblxuICAgIHZhciBtYXliZU5hbWUgPSB0aGlzLnZhbHVlLCBleHByID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICBpZiAoc3RhcnR0eXBlID09PSB0eXBlcyQxLm5hbWUgJiYgZXhwci50eXBlID09PSBcIklkZW50aWZpZXJcIiAmJiB0aGlzLmVhdCh0eXBlcyQxLmNvbG9uKSlcbiAgICAgIHsgcmV0dXJuIHRoaXMucGFyc2VMYWJlbGVkU3RhdGVtZW50KG5vZGUsIG1heWJlTmFtZSwgZXhwciwgY29udGV4dCkgfVxuICAgIGVsc2UgeyByZXR1cm4gdGhpcy5wYXJzZUV4cHJlc3Npb25TdGF0ZW1lbnQobm9kZSwgZXhwcikgfVxuICB9XG59O1xuXG5wcCQ4LnBhcnNlQnJlYWtDb250aW51ZVN0YXRlbWVudCA9IGZ1bmN0aW9uKG5vZGUsIGtleXdvcmQpIHtcbiAgdmFyIGlzQnJlYWsgPSBrZXl3b3JkID09PSBcImJyZWFrXCI7XG4gIHRoaXMubmV4dCgpO1xuICBpZiAodGhpcy5lYXQodHlwZXMkMS5zZW1pKSB8fCB0aGlzLmluc2VydFNlbWljb2xvbigpKSB7IG5vZGUubGFiZWwgPSBudWxsOyB9XG4gIGVsc2UgaWYgKHRoaXMudHlwZSAhPT0gdHlwZXMkMS5uYW1lKSB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gIGVsc2Uge1xuICAgIG5vZGUubGFiZWwgPSB0aGlzLnBhcnNlSWRlbnQoKTtcbiAgICB0aGlzLnNlbWljb2xvbigpO1xuICB9XG5cbiAgLy8gVmVyaWZ5IHRoYXQgdGhlcmUgaXMgYW4gYWN0dWFsIGRlc3RpbmF0aW9uIHRvIGJyZWFrIG9yXG4gIC8vIGNvbnRpbnVlIHRvLlxuICB2YXIgaSA9IDA7XG4gIGZvciAoOyBpIDwgdGhpcy5sYWJlbHMubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgbGFiID0gdGhpcy5sYWJlbHNbaV07XG4gICAgaWYgKG5vZGUubGFiZWwgPT0gbnVsbCB8fCBsYWIubmFtZSA9PT0gbm9kZS5sYWJlbC5uYW1lKSB7XG4gICAgICBpZiAobGFiLmtpbmQgIT0gbnVsbCAmJiAoaXNCcmVhayB8fCBsYWIua2luZCA9PT0gXCJsb29wXCIpKSB7IGJyZWFrIH1cbiAgICAgIGlmIChub2RlLmxhYmVsICYmIGlzQnJlYWspIHsgYnJlYWsgfVxuICAgIH1cbiAgfVxuICBpZiAoaSA9PT0gdGhpcy5sYWJlbHMubGVuZ3RoKSB7IHRoaXMucmFpc2Uobm9kZS5zdGFydCwgXCJVbnN5bnRhY3RpYyBcIiArIGtleXdvcmQpOyB9XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgaXNCcmVhayA/IFwiQnJlYWtTdGF0ZW1lbnRcIiA6IFwiQ29udGludWVTdGF0ZW1lbnRcIilcbn07XG5cbnBwJDgucGFyc2VEZWJ1Z2dlclN0YXRlbWVudCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgdGhpcy5uZXh0KCk7XG4gIHRoaXMuc2VtaWNvbG9uKCk7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJEZWJ1Z2dlclN0YXRlbWVudFwiKVxufTtcblxucHAkOC5wYXJzZURvU3RhdGVtZW50ID0gZnVuY3Rpb24obm9kZSkge1xuICB0aGlzLm5leHQoKTtcbiAgdGhpcy5sYWJlbHMucHVzaChsb29wTGFiZWwpO1xuICBub2RlLmJvZHkgPSB0aGlzLnBhcnNlU3RhdGVtZW50KFwiZG9cIik7XG4gIHRoaXMubGFiZWxzLnBvcCgpO1xuICB0aGlzLmV4cGVjdCh0eXBlcyQxLl93aGlsZSk7XG4gIG5vZGUudGVzdCA9IHRoaXMucGFyc2VQYXJlbkV4cHJlc3Npb24oKTtcbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2KVxuICAgIHsgdGhpcy5lYXQodHlwZXMkMS5zZW1pKTsgfVxuICBlbHNlXG4gICAgeyB0aGlzLnNlbWljb2xvbigpOyB9XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJEb1doaWxlU3RhdGVtZW50XCIpXG59O1xuXG4vLyBEaXNhbWJpZ3VhdGluZyBiZXR3ZWVuIGEgYGZvcmAgYW5kIGEgYGZvcmAvYGluYCBvciBgZm9yYC9gb2ZgXG4vLyBsb29wIGlzIG5vbi10cml2aWFsLiBCYXNpY2FsbHksIHdlIGhhdmUgdG8gcGFyc2UgdGhlIGluaXQgYHZhcmBcbi8vIHN0YXRlbWVudCBvciBleHByZXNzaW9uLCBkaXNhbGxvd2luZyB0aGUgYGluYCBvcGVyYXRvciAoc2VlXG4vLyB0aGUgc2Vjb25kIHBhcmFtZXRlciB0byBgcGFyc2VFeHByZXNzaW9uYCksIGFuZCB0aGVuIGNoZWNrXG4vLyB3aGV0aGVyIHRoZSBuZXh0IHRva2VuIGlzIGBpbmAgb3IgYG9mYC4gV2hlbiB0aGVyZSBpcyBubyBpbml0XG4vLyBwYXJ0IChzZW1pY29sb24gaW1tZWRpYXRlbHkgYWZ0ZXIgdGhlIG9wZW5pbmcgcGFyZW50aGVzaXMpLCBpdFxuLy8gaXMgYSByZWd1bGFyIGBmb3JgIGxvb3AuXG5cbnBwJDgucGFyc2VGb3JTdGF0ZW1lbnQgPSBmdW5jdGlvbihub2RlKSB7XG4gIHRoaXMubmV4dCgpO1xuICB2YXIgYXdhaXRBdCA9ICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOSAmJiB0aGlzLmNhbkF3YWl0ICYmIHRoaXMuZWF0Q29udGV4dHVhbChcImF3YWl0XCIpKSA/IHRoaXMubGFzdFRva1N0YXJ0IDogLTE7XG4gIHRoaXMubGFiZWxzLnB1c2gobG9vcExhYmVsKTtcbiAgdGhpcy5lbnRlclNjb3BlKDApO1xuICB0aGlzLmV4cGVjdCh0eXBlcyQxLnBhcmVuTCk7XG4gIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuc2VtaSkge1xuICAgIGlmIChhd2FpdEF0ID4gLTEpIHsgdGhpcy51bmV4cGVjdGVkKGF3YWl0QXQpOyB9XG4gICAgcmV0dXJuIHRoaXMucGFyc2VGb3Iobm9kZSwgbnVsbClcbiAgfVxuICB2YXIgaXNMZXQgPSB0aGlzLmlzTGV0KCk7XG4gIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuX3ZhciB8fCB0aGlzLnR5cGUgPT09IHR5cGVzJDEuX2NvbnN0IHx8IGlzTGV0KSB7XG4gICAgdmFyIGluaXQkMSA9IHRoaXMuc3RhcnROb2RlKCksIGtpbmQgPSBpc0xldCA/IFwibGV0XCIgOiB0aGlzLnZhbHVlO1xuICAgIHRoaXMubmV4dCgpO1xuICAgIHRoaXMucGFyc2VWYXIoaW5pdCQxLCB0cnVlLCBraW5kKTtcbiAgICB0aGlzLmZpbmlzaE5vZGUoaW5pdCQxLCBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIik7XG4gICAgcmV0dXJuIHRoaXMucGFyc2VGb3JBZnRlckluaXQobm9kZSwgaW5pdCQxLCBhd2FpdEF0KVxuICB9XG4gIHZhciBzdGFydHNXaXRoTGV0ID0gdGhpcy5pc0NvbnRleHR1YWwoXCJsZXRcIiksIGlzRm9yT2YgPSBmYWxzZTtcblxuICB2YXIgdXNpbmdLaW5kID0gdGhpcy5pc1VzaW5nKHRydWUpID8gXCJ1c2luZ1wiIDogdGhpcy5pc0F3YWl0VXNpbmcodHJ1ZSkgPyBcImF3YWl0IHVzaW5nXCIgOiBudWxsO1xuICBpZiAodXNpbmdLaW5kKSB7XG4gICAgdmFyIGluaXQkMiA9IHRoaXMuc3RhcnROb2RlKCk7XG4gICAgdGhpcy5uZXh0KCk7XG4gICAgaWYgKHVzaW5nS2luZCA9PT0gXCJhd2FpdCB1c2luZ1wiKSB7IHRoaXMubmV4dCgpOyB9XG4gICAgdGhpcy5wYXJzZVZhcihpbml0JDIsIHRydWUsIHVzaW5nS2luZCk7XG4gICAgdGhpcy5maW5pc2hOb2RlKGluaXQkMiwgXCJWYXJpYWJsZURlY2xhcmF0aW9uXCIpO1xuICAgIHJldHVybiB0aGlzLnBhcnNlRm9yQWZ0ZXJJbml0KG5vZGUsIGluaXQkMiwgYXdhaXRBdClcbiAgfVxuICB2YXIgY29udGFpbnNFc2MgPSB0aGlzLmNvbnRhaW5zRXNjO1xuICB2YXIgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycyA9IG5ldyBEZXN0cnVjdHVyaW5nRXJyb3JzO1xuICB2YXIgaW5pdFBvcyA9IHRoaXMuc3RhcnQ7XG4gIHZhciBpbml0ID0gYXdhaXRBdCA+IC0xXG4gICAgPyB0aGlzLnBhcnNlRXhwclN1YnNjcmlwdHMocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycywgXCJhd2FpdFwiKVxuICAgIDogdGhpcy5wYXJzZUV4cHJlc3Npb24odHJ1ZSwgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycyk7XG4gIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuX2luIHx8IChpc0Zvck9mID0gdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDYgJiYgdGhpcy5pc0NvbnRleHR1YWwoXCJvZlwiKSkpIHtcbiAgICBpZiAoYXdhaXRBdCA+IC0xKSB7IC8vIGltcGxpZXMgYGVjbWFWZXJzaW9uID49IDlgIChzZWUgZGVjbGFyYXRpb24gb2YgYXdhaXRBdClcbiAgICAgIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuX2luKSB7IHRoaXMudW5leHBlY3RlZChhd2FpdEF0KTsgfVxuICAgICAgbm9kZS5hd2FpdCA9IHRydWU7XG4gICAgfSBlbHNlIGlmIChpc0Zvck9mICYmIHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA4KSB7XG4gICAgICBpZiAoaW5pdC5zdGFydCA9PT0gaW5pdFBvcyAmJiAhY29udGFpbnNFc2MgJiYgaW5pdC50eXBlID09PSBcIklkZW50aWZpZXJcIiAmJiBpbml0Lm5hbWUgPT09IFwiYXN5bmNcIikgeyB0aGlzLnVuZXhwZWN0ZWQoKTsgfVxuICAgICAgZWxzZSBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDkpIHsgbm9kZS5hd2FpdCA9IGZhbHNlOyB9XG4gICAgfVxuICAgIGlmIChzdGFydHNXaXRoTGV0ICYmIGlzRm9yT2YpIHsgdGhpcy5yYWlzZShpbml0LnN0YXJ0LCBcIlRoZSBsZWZ0LWhhbmQgc2lkZSBvZiBhIGZvci1vZiBsb29wIG1heSBub3Qgc3RhcnQgd2l0aCAnbGV0Jy5cIik7IH1cbiAgICB0aGlzLnRvQXNzaWduYWJsZShpbml0LCBmYWxzZSwgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycyk7XG4gICAgdGhpcy5jaGVja0xWYWxQYXR0ZXJuKGluaXQpO1xuICAgIHJldHVybiB0aGlzLnBhcnNlRm9ySW4obm9kZSwgaW5pdClcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmNoZWNrRXhwcmVzc2lvbkVycm9ycyhyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCB0cnVlKTtcbiAgfVxuICBpZiAoYXdhaXRBdCA+IC0xKSB7IHRoaXMudW5leHBlY3RlZChhd2FpdEF0KTsgfVxuICByZXR1cm4gdGhpcy5wYXJzZUZvcihub2RlLCBpbml0KVxufTtcblxuLy8gSGVscGVyIG1ldGhvZCB0byBwYXJzZSBmb3IgbG9vcCBhZnRlciB2YXJpYWJsZSBpbml0aWFsaXphdGlvblxucHAkOC5wYXJzZUZvckFmdGVySW5pdCA9IGZ1bmN0aW9uKG5vZGUsIGluaXQsIGF3YWl0QXQpIHtcbiAgaWYgKCh0aGlzLnR5cGUgPT09IHR5cGVzJDEuX2luIHx8ICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNiAmJiB0aGlzLmlzQ29udGV4dHVhbChcIm9mXCIpKSkgJiYgaW5pdC5kZWNsYXJhdGlvbnMubGVuZ3RoID09PSAxKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA5KSB7XG4gICAgICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLl9pbikge1xuICAgICAgICBpZiAoYXdhaXRBdCA+IC0xKSB7IHRoaXMudW5leHBlY3RlZChhd2FpdEF0KTsgfVxuICAgICAgfSBlbHNlIHsgbm9kZS5hd2FpdCA9IGF3YWl0QXQgPiAtMTsgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5wYXJzZUZvckluKG5vZGUsIGluaXQpXG4gIH1cbiAgaWYgKGF3YWl0QXQgPiAtMSkgeyB0aGlzLnVuZXhwZWN0ZWQoYXdhaXRBdCk7IH1cbiAgcmV0dXJuIHRoaXMucGFyc2VGb3Iobm9kZSwgaW5pdClcbn07XG5cbnBwJDgucGFyc2VGdW5jdGlvblN0YXRlbWVudCA9IGZ1bmN0aW9uKG5vZGUsIGlzQXN5bmMsIGRlY2xhcmF0aW9uUG9zaXRpb24pIHtcbiAgdGhpcy5uZXh0KCk7XG4gIHJldHVybiB0aGlzLnBhcnNlRnVuY3Rpb24obm9kZSwgRlVOQ19TVEFURU1FTlQgfCAoZGVjbGFyYXRpb25Qb3NpdGlvbiA/IDAgOiBGVU5DX0hBTkdJTkdfU1RBVEVNRU5UKSwgZmFsc2UsIGlzQXN5bmMpXG59O1xuXG5wcCQ4LnBhcnNlSWZTdGF0ZW1lbnQgPSBmdW5jdGlvbihub2RlKSB7XG4gIHRoaXMubmV4dCgpO1xuICBub2RlLnRlc3QgPSB0aGlzLnBhcnNlUGFyZW5FeHByZXNzaW9uKCk7XG4gIC8vIGFsbG93IGZ1bmN0aW9uIGRlY2xhcmF0aW9ucyBpbiBicmFuY2hlcywgYnV0IG9ubHkgaW4gbm9uLXN0cmljdCBtb2RlXG4gIG5vZGUuY29uc2VxdWVudCA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoXCJpZlwiKTtcbiAgbm9kZS5hbHRlcm5hdGUgPSB0aGlzLmVhdCh0eXBlcyQxLl9lbHNlKSA/IHRoaXMucGFyc2VTdGF0ZW1lbnQoXCJpZlwiKSA6IG51bGw7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJJZlN0YXRlbWVudFwiKVxufTtcblxucHAkOC5wYXJzZVJldHVyblN0YXRlbWVudCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgaWYgKCF0aGlzLmluRnVuY3Rpb24gJiYgIXRoaXMub3B0aW9ucy5hbGxvd1JldHVybk91dHNpZGVGdW5jdGlvbilcbiAgICB7IHRoaXMucmFpc2UodGhpcy5zdGFydCwgXCIncmV0dXJuJyBvdXRzaWRlIG9mIGZ1bmN0aW9uXCIpOyB9XG4gIHRoaXMubmV4dCgpO1xuXG4gIC8vIEluIGByZXR1cm5gIChhbmQgYGJyZWFrYC9gY29udGludWVgKSwgdGhlIGtleXdvcmRzIHdpdGhcbiAgLy8gb3B0aW9uYWwgYXJndW1lbnRzLCB3ZSBlYWdlcmx5IGxvb2sgZm9yIGEgc2VtaWNvbG9uIG9yIHRoZVxuICAvLyBwb3NzaWJpbGl0eSB0byBpbnNlcnQgb25lLlxuXG4gIGlmICh0aGlzLmVhdCh0eXBlcyQxLnNlbWkpIHx8IHRoaXMuaW5zZXJ0U2VtaWNvbG9uKCkpIHsgbm9kZS5hcmd1bWVudCA9IG51bGw7IH1cbiAgZWxzZSB7IG5vZGUuYXJndW1lbnQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpOyB0aGlzLnNlbWljb2xvbigpOyB9XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJSZXR1cm5TdGF0ZW1lbnRcIilcbn07XG5cbnBwJDgucGFyc2VTd2l0Y2hTdGF0ZW1lbnQgPSBmdW5jdGlvbihub2RlKSB7XG4gIHRoaXMubmV4dCgpO1xuICBub2RlLmRpc2NyaW1pbmFudCA9IHRoaXMucGFyc2VQYXJlbkV4cHJlc3Npb24oKTtcbiAgbm9kZS5jYXNlcyA9IFtdO1xuICB0aGlzLmV4cGVjdCh0eXBlcyQxLmJyYWNlTCk7XG4gIHRoaXMubGFiZWxzLnB1c2goc3dpdGNoTGFiZWwpO1xuICB0aGlzLmVudGVyU2NvcGUoMCk7XG5cbiAgLy8gU3RhdGVtZW50cyB1bmRlciBtdXN0IGJlIGdyb3VwZWQgKGJ5IGxhYmVsKSBpbiBTd2l0Y2hDYXNlXG4gIC8vIG5vZGVzLiBgY3VyYCBpcyB1c2VkIHRvIGtlZXAgdGhlIG5vZGUgdGhhdCB3ZSBhcmUgY3VycmVudGx5XG4gIC8vIGFkZGluZyBzdGF0ZW1lbnRzIHRvLlxuXG4gIHZhciBjdXI7XG4gIGZvciAodmFyIHNhd0RlZmF1bHQgPSBmYWxzZTsgdGhpcy50eXBlICE9PSB0eXBlcyQxLmJyYWNlUjspIHtcbiAgICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLl9jYXNlIHx8IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5fZGVmYXVsdCkge1xuICAgICAgdmFyIGlzQ2FzZSA9IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5fY2FzZTtcbiAgICAgIGlmIChjdXIpIHsgdGhpcy5maW5pc2hOb2RlKGN1ciwgXCJTd2l0Y2hDYXNlXCIpOyB9XG4gICAgICBub2RlLmNhc2VzLnB1c2goY3VyID0gdGhpcy5zdGFydE5vZGUoKSk7XG4gICAgICBjdXIuY29uc2VxdWVudCA9IFtdO1xuICAgICAgdGhpcy5uZXh0KCk7XG4gICAgICBpZiAoaXNDYXNlKSB7XG4gICAgICAgIGN1ci50ZXN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChzYXdEZWZhdWx0KSB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZSh0aGlzLmxhc3RUb2tTdGFydCwgXCJNdWx0aXBsZSBkZWZhdWx0IGNsYXVzZXNcIik7IH1cbiAgICAgICAgc2F3RGVmYXVsdCA9IHRydWU7XG4gICAgICAgIGN1ci50ZXN0ID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIHRoaXMuZXhwZWN0KHR5cGVzJDEuY29sb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIWN1cikgeyB0aGlzLnVuZXhwZWN0ZWQoKTsgfVxuICAgICAgY3VyLmNvbnNlcXVlbnQucHVzaCh0aGlzLnBhcnNlU3RhdGVtZW50KG51bGwpKTtcbiAgICB9XG4gIH1cbiAgdGhpcy5leGl0U2NvcGUoKTtcbiAgaWYgKGN1cikgeyB0aGlzLmZpbmlzaE5vZGUoY3VyLCBcIlN3aXRjaENhc2VcIik7IH1cbiAgdGhpcy5uZXh0KCk7IC8vIENsb3NpbmcgYnJhY2VcbiAgdGhpcy5sYWJlbHMucG9wKCk7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJTd2l0Y2hTdGF0ZW1lbnRcIilcbn07XG5cbnBwJDgucGFyc2VUaHJvd1N0YXRlbWVudCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgdGhpcy5uZXh0KCk7XG4gIGlmIChsaW5lQnJlYWsudGVzdCh0aGlzLmlucHV0LnNsaWNlKHRoaXMubGFzdFRva0VuZCwgdGhpcy5zdGFydCkpKVxuICAgIHsgdGhpcy5yYWlzZSh0aGlzLmxhc3RUb2tFbmQsIFwiSWxsZWdhbCBuZXdsaW5lIGFmdGVyIHRocm93XCIpOyB9XG4gIG5vZGUuYXJndW1lbnQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICB0aGlzLnNlbWljb2xvbigpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiVGhyb3dTdGF0ZW1lbnRcIilcbn07XG5cbi8vIFJldXNlZCBlbXB0eSBhcnJheSBhZGRlZCBmb3Igbm9kZSBmaWVsZHMgdGhhdCBhcmUgYWx3YXlzIGVtcHR5LlxuXG52YXIgZW1wdHkkMSA9IFtdO1xuXG5wcCQ4LnBhcnNlQ2F0Y2hDbGF1c2VQYXJhbSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcGFyYW0gPSB0aGlzLnBhcnNlQmluZGluZ0F0b20oKTtcbiAgdmFyIHNpbXBsZSA9IHBhcmFtLnR5cGUgPT09IFwiSWRlbnRpZmllclwiO1xuICB0aGlzLmVudGVyU2NvcGUoc2ltcGxlID8gU0NPUEVfU0lNUExFX0NBVENIIDogMCk7XG4gIHRoaXMuY2hlY2tMVmFsUGF0dGVybihwYXJhbSwgc2ltcGxlID8gQklORF9TSU1QTEVfQ0FUQ0ggOiBCSU5EX0xFWElDQUwpO1xuICB0aGlzLmV4cGVjdCh0eXBlcyQxLnBhcmVuUik7XG5cbiAgcmV0dXJuIHBhcmFtXG59O1xuXG5wcCQ4LnBhcnNlVHJ5U3RhdGVtZW50ID0gZnVuY3Rpb24obm9kZSkge1xuICB0aGlzLm5leHQoKTtcbiAgbm9kZS5ibG9jayA9IHRoaXMucGFyc2VCbG9jaygpO1xuICBub2RlLmhhbmRsZXIgPSBudWxsO1xuICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLl9jYXRjaCkge1xuICAgIHZhciBjbGF1c2UgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICAgIHRoaXMubmV4dCgpO1xuICAgIGlmICh0aGlzLmVhdCh0eXBlcyQxLnBhcmVuTCkpIHtcbiAgICAgIGNsYXVzZS5wYXJhbSA9IHRoaXMucGFyc2VDYXRjaENsYXVzZVBhcmFtKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPCAxMCkgeyB0aGlzLnVuZXhwZWN0ZWQoKTsgfVxuICAgICAgY2xhdXNlLnBhcmFtID0gbnVsbDtcbiAgICAgIHRoaXMuZW50ZXJTY29wZSgwKTtcbiAgICB9XG4gICAgY2xhdXNlLmJvZHkgPSB0aGlzLnBhcnNlQmxvY2soZmFsc2UpO1xuICAgIHRoaXMuZXhpdFNjb3BlKCk7XG4gICAgbm9kZS5oYW5kbGVyID0gdGhpcy5maW5pc2hOb2RlKGNsYXVzZSwgXCJDYXRjaENsYXVzZVwiKTtcbiAgfVxuICBub2RlLmZpbmFsaXplciA9IHRoaXMuZWF0KHR5cGVzJDEuX2ZpbmFsbHkpID8gdGhpcy5wYXJzZUJsb2NrKCkgOiBudWxsO1xuICBpZiAoIW5vZGUuaGFuZGxlciAmJiAhbm9kZS5maW5hbGl6ZXIpXG4gICAgeyB0aGlzLnJhaXNlKG5vZGUuc3RhcnQsIFwiTWlzc2luZyBjYXRjaCBvciBmaW5hbGx5IGNsYXVzZVwiKTsgfVxuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiVHJ5U3RhdGVtZW50XCIpXG59O1xuXG5wcCQ4LnBhcnNlVmFyU3RhdGVtZW50ID0gZnVuY3Rpb24obm9kZSwga2luZCwgYWxsb3dNaXNzaW5nSW5pdGlhbGl6ZXIpIHtcbiAgdGhpcy5uZXh0KCk7XG4gIHRoaXMucGFyc2VWYXIobm9kZSwgZmFsc2UsIGtpbmQsIGFsbG93TWlzc2luZ0luaXRpYWxpemVyKTtcbiAgdGhpcy5zZW1pY29sb24oKTtcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIilcbn07XG5cbnBwJDgucGFyc2VXaGlsZVN0YXRlbWVudCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgdGhpcy5uZXh0KCk7XG4gIG5vZGUudGVzdCA9IHRoaXMucGFyc2VQYXJlbkV4cHJlc3Npb24oKTtcbiAgdGhpcy5sYWJlbHMucHVzaChsb29wTGFiZWwpO1xuICBub2RlLmJvZHkgPSB0aGlzLnBhcnNlU3RhdGVtZW50KFwid2hpbGVcIik7XG4gIHRoaXMubGFiZWxzLnBvcCgpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiV2hpbGVTdGF0ZW1lbnRcIilcbn07XG5cbnBwJDgucGFyc2VXaXRoU3RhdGVtZW50ID0gZnVuY3Rpb24obm9kZSkge1xuICBpZiAodGhpcy5zdHJpY3QpIHsgdGhpcy5yYWlzZSh0aGlzLnN0YXJ0LCBcIid3aXRoJyBpbiBzdHJpY3QgbW9kZVwiKTsgfVxuICB0aGlzLm5leHQoKTtcbiAgbm9kZS5vYmplY3QgPSB0aGlzLnBhcnNlUGFyZW5FeHByZXNzaW9uKCk7XG4gIG5vZGUuYm9keSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoXCJ3aXRoXCIpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiV2l0aFN0YXRlbWVudFwiKVxufTtcblxucHAkOC5wYXJzZUVtcHR5U3RhdGVtZW50ID0gZnVuY3Rpb24obm9kZSkge1xuICB0aGlzLm5leHQoKTtcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIkVtcHR5U3RhdGVtZW50XCIpXG59O1xuXG5wcCQ4LnBhcnNlTGFiZWxlZFN0YXRlbWVudCA9IGZ1bmN0aW9uKG5vZGUsIG1heWJlTmFtZSwgZXhwciwgY29udGV4dCkge1xuICBmb3IgKHZhciBpJDEgPSAwLCBsaXN0ID0gdGhpcy5sYWJlbHM7IGkkMSA8IGxpc3QubGVuZ3RoOyBpJDEgKz0gMSlcbiAgICB7XG4gICAgdmFyIGxhYmVsID0gbGlzdFtpJDFdO1xuXG4gICAgaWYgKGxhYmVsLm5hbWUgPT09IG1heWJlTmFtZSlcbiAgICAgIHsgdGhpcy5yYWlzZShleHByLnN0YXJ0LCBcIkxhYmVsICdcIiArIG1heWJlTmFtZSArIFwiJyBpcyBhbHJlYWR5IGRlY2xhcmVkXCIpO1xuICB9IH1cbiAgdmFyIGtpbmQgPSB0aGlzLnR5cGUuaXNMb29wID8gXCJsb29wXCIgOiB0aGlzLnR5cGUgPT09IHR5cGVzJDEuX3N3aXRjaCA/IFwic3dpdGNoXCIgOiBudWxsO1xuICBmb3IgKHZhciBpID0gdGhpcy5sYWJlbHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgbGFiZWwkMSA9IHRoaXMubGFiZWxzW2ldO1xuICAgIGlmIChsYWJlbCQxLnN0YXRlbWVudFN0YXJ0ID09PSBub2RlLnN0YXJ0KSB7XG4gICAgICAvLyBVcGRhdGUgaW5mb3JtYXRpb24gYWJvdXQgcHJldmlvdXMgbGFiZWxzIG9uIHRoaXMgbm9kZVxuICAgICAgbGFiZWwkMS5zdGF0ZW1lbnRTdGFydCA9IHRoaXMuc3RhcnQ7XG4gICAgICBsYWJlbCQxLmtpbmQgPSBraW5kO1xuICAgIH0gZWxzZSB7IGJyZWFrIH1cbiAgfVxuICB0aGlzLmxhYmVscy5wdXNoKHtuYW1lOiBtYXliZU5hbWUsIGtpbmQ6IGtpbmQsIHN0YXRlbWVudFN0YXJ0OiB0aGlzLnN0YXJ0fSk7XG4gIG5vZGUuYm9keSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoY29udGV4dCA/IGNvbnRleHQuaW5kZXhPZihcImxhYmVsXCIpID09PSAtMSA/IGNvbnRleHQgKyBcImxhYmVsXCIgOiBjb250ZXh0IDogXCJsYWJlbFwiKTtcbiAgdGhpcy5sYWJlbHMucG9wKCk7XG4gIG5vZGUubGFiZWwgPSBleHByO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiTGFiZWxlZFN0YXRlbWVudFwiKVxufTtcblxucHAkOC5wYXJzZUV4cHJlc3Npb25TdGF0ZW1lbnQgPSBmdW5jdGlvbihub2RlLCBleHByKSB7XG4gIG5vZGUuZXhwcmVzc2lvbiA9IGV4cHI7XG4gIHRoaXMuc2VtaWNvbG9uKCk7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJFeHByZXNzaW9uU3RhdGVtZW50XCIpXG59O1xuXG4vLyBQYXJzZSBhIHNlbWljb2xvbi1lbmNsb3NlZCBibG9jayBvZiBzdGF0ZW1lbnRzLCBoYW5kbGluZyBgXCJ1c2Vcbi8vIHN0cmljdFwiYCBkZWNsYXJhdGlvbnMgd2hlbiBgYWxsb3dTdHJpY3RgIGlzIHRydWUgKHVzZWQgZm9yXG4vLyBmdW5jdGlvbiBib2RpZXMpLlxuXG5wcCQ4LnBhcnNlQmxvY2sgPSBmdW5jdGlvbihjcmVhdGVOZXdMZXhpY2FsU2NvcGUsIG5vZGUsIGV4aXRTdHJpY3QpIHtcbiAgaWYgKCBjcmVhdGVOZXdMZXhpY2FsU2NvcGUgPT09IHZvaWQgMCApIGNyZWF0ZU5ld0xleGljYWxTY29wZSA9IHRydWU7XG4gIGlmICggbm9kZSA9PT0gdm9pZCAwICkgbm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG5cbiAgbm9kZS5ib2R5ID0gW107XG4gIHRoaXMuZXhwZWN0KHR5cGVzJDEuYnJhY2VMKTtcbiAgaWYgKGNyZWF0ZU5ld0xleGljYWxTY29wZSkgeyB0aGlzLmVudGVyU2NvcGUoMCk7IH1cbiAgd2hpbGUgKHRoaXMudHlwZSAhPT0gdHlwZXMkMS5icmFjZVIpIHtcbiAgICB2YXIgc3RtdCA9IHRoaXMucGFyc2VTdGF0ZW1lbnQobnVsbCk7XG4gICAgbm9kZS5ib2R5LnB1c2goc3RtdCk7XG4gIH1cbiAgaWYgKGV4aXRTdHJpY3QpIHsgdGhpcy5zdHJpY3QgPSBmYWxzZTsgfVxuICB0aGlzLm5leHQoKTtcbiAgaWYgKGNyZWF0ZU5ld0xleGljYWxTY29wZSkgeyB0aGlzLmV4aXRTY29wZSgpOyB9XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJCbG9ja1N0YXRlbWVudFwiKVxufTtcblxuLy8gUGFyc2UgYSByZWd1bGFyIGBmb3JgIGxvb3AuIFRoZSBkaXNhbWJpZ3VhdGlvbiBjb2RlIGluXG4vLyBgcGFyc2VTdGF0ZW1lbnRgIHdpbGwgYWxyZWFkeSBoYXZlIHBhcnNlZCB0aGUgaW5pdCBzdGF0ZW1lbnQgb3Jcbi8vIGV4cHJlc3Npb24uXG5cbnBwJDgucGFyc2VGb3IgPSBmdW5jdGlvbihub2RlLCBpbml0KSB7XG4gIG5vZGUuaW5pdCA9IGluaXQ7XG4gIHRoaXMuZXhwZWN0KHR5cGVzJDEuc2VtaSk7XG4gIG5vZGUudGVzdCA9IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5zZW1pID8gbnVsbCA6IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gIHRoaXMuZXhwZWN0KHR5cGVzJDEuc2VtaSk7XG4gIG5vZGUudXBkYXRlID0gdGhpcy50eXBlID09PSB0eXBlcyQxLnBhcmVuUiA/IG51bGwgOiB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICB0aGlzLmV4cGVjdCh0eXBlcyQxLnBhcmVuUik7XG4gIG5vZGUuYm9keSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoXCJmb3JcIik7XG4gIHRoaXMuZXhpdFNjb3BlKCk7XG4gIHRoaXMubGFiZWxzLnBvcCgpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiRm9yU3RhdGVtZW50XCIpXG59O1xuXG4vLyBQYXJzZSBhIGBmb3JgL2BpbmAgYW5kIGBmb3JgL2BvZmAgbG9vcCwgd2hpY2ggYXJlIGFsbW9zdFxuLy8gc2FtZSBmcm9tIHBhcnNlcidzIHBlcnNwZWN0aXZlLlxuXG5wcCQ4LnBhcnNlRm9ySW4gPSBmdW5jdGlvbihub2RlLCBpbml0KSB7XG4gIHZhciBpc0ZvckluID0gdGhpcy50eXBlID09PSB0eXBlcyQxLl9pbjtcbiAgdGhpcy5uZXh0KCk7XG5cbiAgaWYgKFxuICAgIGluaXQudHlwZSA9PT0gXCJWYXJpYWJsZURlY2xhcmF0aW9uXCIgJiZcbiAgICBpbml0LmRlY2xhcmF0aW9uc1swXS5pbml0ICE9IG51bGwgJiZcbiAgICAoXG4gICAgICAhaXNGb3JJbiB8fFxuICAgICAgdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uIDwgOCB8fFxuICAgICAgdGhpcy5zdHJpY3QgfHxcbiAgICAgIGluaXQua2luZCAhPT0gXCJ2YXJcIiB8fFxuICAgICAgaW5pdC5kZWNsYXJhdGlvbnNbMF0uaWQudHlwZSAhPT0gXCJJZGVudGlmaWVyXCJcbiAgICApXG4gICkge1xuICAgIHRoaXMucmFpc2UoXG4gICAgICBpbml0LnN0YXJ0LFxuICAgICAgKChpc0ZvckluID8gXCJmb3ItaW5cIiA6IFwiZm9yLW9mXCIpICsgXCIgbG9vcCB2YXJpYWJsZSBkZWNsYXJhdGlvbiBtYXkgbm90IGhhdmUgYW4gaW5pdGlhbGl6ZXJcIilcbiAgICApO1xuICB9XG4gIG5vZGUubGVmdCA9IGluaXQ7XG4gIG5vZGUucmlnaHQgPSBpc0ZvckluID8gdGhpcy5wYXJzZUV4cHJlc3Npb24oKSA6IHRoaXMucGFyc2VNYXliZUFzc2lnbigpO1xuICB0aGlzLmV4cGVjdCh0eXBlcyQxLnBhcmVuUik7XG4gIG5vZGUuYm9keSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoXCJmb3JcIik7XG4gIHRoaXMuZXhpdFNjb3BlKCk7XG4gIHRoaXMubGFiZWxzLnBvcCgpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIGlzRm9ySW4gPyBcIkZvckluU3RhdGVtZW50XCIgOiBcIkZvck9mU3RhdGVtZW50XCIpXG59O1xuXG4vLyBQYXJzZSBhIGxpc3Qgb2YgdmFyaWFibGUgZGVjbGFyYXRpb25zLlxuXG5wcCQ4LnBhcnNlVmFyID0gZnVuY3Rpb24obm9kZSwgaXNGb3IsIGtpbmQsIGFsbG93TWlzc2luZ0luaXRpYWxpemVyKSB7XG4gIG5vZGUuZGVjbGFyYXRpb25zID0gW107XG4gIG5vZGUua2luZCA9IGtpbmQ7XG4gIGZvciAoOzspIHtcbiAgICB2YXIgZGVjbCA9IHRoaXMuc3RhcnROb2RlKCk7XG4gICAgdGhpcy5wYXJzZVZhcklkKGRlY2wsIGtpbmQpO1xuICAgIGlmICh0aGlzLmVhdCh0eXBlcyQxLmVxKSkge1xuICAgICAgZGVjbC5pbml0ID0gdGhpcy5wYXJzZU1heWJlQXNzaWduKGlzRm9yKTtcbiAgICB9IGVsc2UgaWYgKCFhbGxvd01pc3NpbmdJbml0aWFsaXplciAmJiBraW5kID09PSBcImNvbnN0XCIgJiYgISh0aGlzLnR5cGUgPT09IHR5cGVzJDEuX2luIHx8ICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNiAmJiB0aGlzLmlzQ29udGV4dHVhbChcIm9mXCIpKSkpIHtcbiAgICAgIHRoaXMudW5leHBlY3RlZCgpO1xuICAgIH0gZWxzZSBpZiAoIWFsbG93TWlzc2luZ0luaXRpYWxpemVyICYmIChraW5kID09PSBcInVzaW5nXCIgfHwga2luZCA9PT0gXCJhd2FpdCB1c2luZ1wiKSAmJiB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTcgJiYgdGhpcy50eXBlICE9PSB0eXBlcyQxLl9pbiAmJiAhdGhpcy5pc0NvbnRleHR1YWwoXCJvZlwiKSkge1xuICAgICAgdGhpcy5yYWlzZSh0aGlzLmxhc3RUb2tFbmQsIChcIk1pc3NpbmcgaW5pdGlhbGl6ZXIgaW4gXCIgKyBraW5kICsgXCIgZGVjbGFyYXRpb25cIikpO1xuICAgIH0gZWxzZSBpZiAoIWFsbG93TWlzc2luZ0luaXRpYWxpemVyICYmIGRlY2wuaWQudHlwZSAhPT0gXCJJZGVudGlmaWVyXCIgJiYgIShpc0ZvciAmJiAodGhpcy50eXBlID09PSB0eXBlcyQxLl9pbiB8fCB0aGlzLmlzQ29udGV4dHVhbChcIm9mXCIpKSkpIHtcbiAgICAgIHRoaXMucmFpc2UodGhpcy5sYXN0VG9rRW5kLCBcIkNvbXBsZXggYmluZGluZyBwYXR0ZXJucyByZXF1aXJlIGFuIGluaXRpYWxpemF0aW9uIHZhbHVlXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWNsLmluaXQgPSBudWxsO1xuICAgIH1cbiAgICBub2RlLmRlY2xhcmF0aW9ucy5wdXNoKHRoaXMuZmluaXNoTm9kZShkZWNsLCBcIlZhcmlhYmxlRGVjbGFyYXRvclwiKSk7XG4gICAgaWYgKCF0aGlzLmVhdCh0eXBlcyQxLmNvbW1hKSkgeyBicmVhayB9XG4gIH1cbiAgcmV0dXJuIG5vZGVcbn07XG5cbnBwJDgucGFyc2VWYXJJZCA9IGZ1bmN0aW9uKGRlY2wsIGtpbmQpIHtcbiAgZGVjbC5pZCA9IGtpbmQgPT09IFwidXNpbmdcIiB8fCBraW5kID09PSBcImF3YWl0IHVzaW5nXCJcbiAgICA/IHRoaXMucGFyc2VJZGVudCgpXG4gICAgOiB0aGlzLnBhcnNlQmluZGluZ0F0b20oKTtcblxuICB0aGlzLmNoZWNrTFZhbFBhdHRlcm4oZGVjbC5pZCwga2luZCA9PT0gXCJ2YXJcIiA/IEJJTkRfVkFSIDogQklORF9MRVhJQ0FMLCBmYWxzZSk7XG59O1xuXG52YXIgRlVOQ19TVEFURU1FTlQgPSAxLCBGVU5DX0hBTkdJTkdfU1RBVEVNRU5UID0gMiwgRlVOQ19OVUxMQUJMRV9JRCA9IDQ7XG5cbi8vIFBhcnNlIGEgZnVuY3Rpb24gZGVjbGFyYXRpb24gb3IgbGl0ZXJhbCAoZGVwZW5kaW5nIG9uIHRoZVxuLy8gYHN0YXRlbWVudCAmIEZVTkNfU1RBVEVNRU5UYCkuXG5cbi8vIFJlbW92ZSBgYWxsb3dFeHByZXNzaW9uQm9keWAgZm9yIDcuMC4wLCBhcyBpdCBpcyBvbmx5IGNhbGxlZCB3aXRoIGZhbHNlXG5wcCQ4LnBhcnNlRnVuY3Rpb24gPSBmdW5jdGlvbihub2RlLCBzdGF0ZW1lbnQsIGFsbG93RXhwcmVzc2lvbkJvZHksIGlzQXN5bmMsIGZvckluaXQpIHtcbiAgdGhpcy5pbml0RnVuY3Rpb24obm9kZSk7XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOSB8fCB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNiAmJiAhaXNBc3luYykge1xuICAgIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuc3RhciAmJiAoc3RhdGVtZW50ICYgRlVOQ19IQU5HSU5HX1NUQVRFTUVOVCkpXG4gICAgICB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gICAgbm9kZS5nZW5lcmF0b3IgPSB0aGlzLmVhdCh0eXBlcyQxLnN0YXIpO1xuICB9XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOClcbiAgICB7IG5vZGUuYXN5bmMgPSAhIWlzQXN5bmM7IH1cblxuICBpZiAoc3RhdGVtZW50ICYgRlVOQ19TVEFURU1FTlQpIHtcbiAgICBub2RlLmlkID0gKHN0YXRlbWVudCAmIEZVTkNfTlVMTEFCTEVfSUQpICYmIHRoaXMudHlwZSAhPT0gdHlwZXMkMS5uYW1lID8gbnVsbCA6IHRoaXMucGFyc2VJZGVudCgpO1xuICAgIGlmIChub2RlLmlkICYmICEoc3RhdGVtZW50ICYgRlVOQ19IQU5HSU5HX1NUQVRFTUVOVCkpXG4gICAgICAvLyBJZiBpdCBpcyBhIHJlZ3VsYXIgZnVuY3Rpb24gZGVjbGFyYXRpb24gaW4gc2xvcHB5IG1vZGUsIHRoZW4gaXQgaXNcbiAgICAgIC8vIHN1YmplY3QgdG8gQW5uZXggQiBzZW1hbnRpY3MgKEJJTkRfRlVOQ1RJT04pLiBPdGhlcndpc2UsIHRoZSBiaW5kaW5nXG4gICAgICAvLyBtb2RlIGRlcGVuZHMgb24gcHJvcGVydGllcyBvZiB0aGUgY3VycmVudCBzY29wZSAoc2VlXG4gICAgICAvLyB0cmVhdEZ1bmN0aW9uc0FzVmFyKS5cbiAgICAgIHsgdGhpcy5jaGVja0xWYWxTaW1wbGUobm9kZS5pZCwgKHRoaXMuc3RyaWN0IHx8IG5vZGUuZ2VuZXJhdG9yIHx8IG5vZGUuYXN5bmMpID8gdGhpcy50cmVhdEZ1bmN0aW9uc0FzVmFyID8gQklORF9WQVIgOiBCSU5EX0xFWElDQUwgOiBCSU5EX0ZVTkNUSU9OKTsgfVxuICB9XG5cbiAgdmFyIG9sZFlpZWxkUG9zID0gdGhpcy55aWVsZFBvcywgb2xkQXdhaXRQb3MgPSB0aGlzLmF3YWl0UG9zLCBvbGRBd2FpdElkZW50UG9zID0gdGhpcy5hd2FpdElkZW50UG9zO1xuICB0aGlzLnlpZWxkUG9zID0gMDtcbiAgdGhpcy5hd2FpdFBvcyA9IDA7XG4gIHRoaXMuYXdhaXRJZGVudFBvcyA9IDA7XG4gIHRoaXMuZW50ZXJTY29wZShmdW5jdGlvbkZsYWdzKG5vZGUuYXN5bmMsIG5vZGUuZ2VuZXJhdG9yKSk7XG5cbiAgaWYgKCEoc3RhdGVtZW50ICYgRlVOQ19TVEFURU1FTlQpKVxuICAgIHsgbm9kZS5pZCA9IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5uYW1lID8gdGhpcy5wYXJzZUlkZW50KCkgOiBudWxsOyB9XG5cbiAgdGhpcy5wYXJzZUZ1bmN0aW9uUGFyYW1zKG5vZGUpO1xuICB0aGlzLnBhcnNlRnVuY3Rpb25Cb2R5KG5vZGUsIGFsbG93RXhwcmVzc2lvbkJvZHksIGZhbHNlLCBmb3JJbml0KTtcblxuICB0aGlzLnlpZWxkUG9zID0gb2xkWWllbGRQb3M7XG4gIHRoaXMuYXdhaXRQb3MgPSBvbGRBd2FpdFBvcztcbiAgdGhpcy5hd2FpdElkZW50UG9zID0gb2xkQXdhaXRJZGVudFBvcztcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCAoc3RhdGVtZW50ICYgRlVOQ19TVEFURU1FTlQpID8gXCJGdW5jdGlvbkRlY2xhcmF0aW9uXCIgOiBcIkZ1bmN0aW9uRXhwcmVzc2lvblwiKVxufTtcblxucHAkOC5wYXJzZUZ1bmN0aW9uUGFyYW1zID0gZnVuY3Rpb24obm9kZSkge1xuICB0aGlzLmV4cGVjdCh0eXBlcyQxLnBhcmVuTCk7XG4gIG5vZGUucGFyYW1zID0gdGhpcy5wYXJzZUJpbmRpbmdMaXN0KHR5cGVzJDEucGFyZW5SLCBmYWxzZSwgdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDgpO1xuICB0aGlzLmNoZWNrWWllbGRBd2FpdEluRGVmYXVsdFBhcmFtcygpO1xufTtcblxuLy8gUGFyc2UgYSBjbGFzcyBkZWNsYXJhdGlvbiBvciBsaXRlcmFsIChkZXBlbmRpbmcgb24gdGhlXG4vLyBgaXNTdGF0ZW1lbnRgIHBhcmFtZXRlcikuXG5cbnBwJDgucGFyc2VDbGFzcyA9IGZ1bmN0aW9uKG5vZGUsIGlzU3RhdGVtZW50KSB7XG4gIHRoaXMubmV4dCgpO1xuXG4gIC8vIGVjbWEtMjYyIDE0LjYgQ2xhc3MgRGVmaW5pdGlvbnNcbiAgLy8gQSBjbGFzcyBkZWZpbml0aW9uIGlzIGFsd2F5cyBzdHJpY3QgbW9kZSBjb2RlLlxuICB2YXIgb2xkU3RyaWN0ID0gdGhpcy5zdHJpY3Q7XG4gIHRoaXMuc3RyaWN0ID0gdHJ1ZTtcblxuICB0aGlzLnBhcnNlQ2xhc3NJZChub2RlLCBpc1N0YXRlbWVudCk7XG4gIHRoaXMucGFyc2VDbGFzc1N1cGVyKG5vZGUpO1xuICB2YXIgcHJpdmF0ZU5hbWVNYXAgPSB0aGlzLmVudGVyQ2xhc3NCb2R5KCk7XG4gIHZhciBjbGFzc0JvZHkgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICB2YXIgaGFkQ29uc3RydWN0b3IgPSBmYWxzZTtcbiAgY2xhc3NCb2R5LmJvZHkgPSBbXTtcbiAgdGhpcy5leHBlY3QodHlwZXMkMS5icmFjZUwpO1xuICB3aGlsZSAodGhpcy50eXBlICE9PSB0eXBlcyQxLmJyYWNlUikge1xuICAgIHZhciBlbGVtZW50ID0gdGhpcy5wYXJzZUNsYXNzRWxlbWVudChub2RlLnN1cGVyQ2xhc3MgIT09IG51bGwpO1xuICAgIGlmIChlbGVtZW50KSB7XG4gICAgICBjbGFzc0JvZHkuYm9keS5wdXNoKGVsZW1lbnQpO1xuICAgICAgaWYgKGVsZW1lbnQudHlwZSA9PT0gXCJNZXRob2REZWZpbml0aW9uXCIgJiYgZWxlbWVudC5raW5kID09PSBcImNvbnN0cnVjdG9yXCIpIHtcbiAgICAgICAgaWYgKGhhZENvbnN0cnVjdG9yKSB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShlbGVtZW50LnN0YXJ0LCBcIkR1cGxpY2F0ZSBjb25zdHJ1Y3RvciBpbiB0aGUgc2FtZSBjbGFzc1wiKTsgfVxuICAgICAgICBoYWRDb25zdHJ1Y3RvciA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGVsZW1lbnQua2V5ICYmIGVsZW1lbnQua2V5LnR5cGUgPT09IFwiUHJpdmF0ZUlkZW50aWZpZXJcIiAmJiBpc1ByaXZhdGVOYW1lQ29uZmxpY3RlZChwcml2YXRlTmFtZU1hcCwgZWxlbWVudCkpIHtcbiAgICAgICAgdGhpcy5yYWlzZVJlY292ZXJhYmxlKGVsZW1lbnQua2V5LnN0YXJ0LCAoXCJJZGVudGlmaWVyICcjXCIgKyAoZWxlbWVudC5rZXkubmFtZSkgKyBcIicgaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHRoaXMuc3RyaWN0ID0gb2xkU3RyaWN0O1xuICB0aGlzLm5leHQoKTtcbiAgbm9kZS5ib2R5ID0gdGhpcy5maW5pc2hOb2RlKGNsYXNzQm9keSwgXCJDbGFzc0JvZHlcIik7XG4gIHRoaXMuZXhpdENsYXNzQm9keSgpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIGlzU3RhdGVtZW50ID8gXCJDbGFzc0RlY2xhcmF0aW9uXCIgOiBcIkNsYXNzRXhwcmVzc2lvblwiKVxufTtcblxucHAkOC5wYXJzZUNsYXNzRWxlbWVudCA9IGZ1bmN0aW9uKGNvbnN0cnVjdG9yQWxsb3dzU3VwZXIpIHtcbiAgaWYgKHRoaXMuZWF0KHR5cGVzJDEuc2VtaSkpIHsgcmV0dXJuIG51bGwgfVxuXG4gIHZhciBlY21hVmVyc2lvbiA9IHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbjtcbiAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICB2YXIga2V5TmFtZSA9IFwiXCI7XG4gIHZhciBpc0dlbmVyYXRvciA9IGZhbHNlO1xuICB2YXIgaXNBc3luYyA9IGZhbHNlO1xuICB2YXIga2luZCA9IFwibWV0aG9kXCI7XG4gIHZhciBpc1N0YXRpYyA9IGZhbHNlO1xuXG4gIGlmICh0aGlzLmVhdENvbnRleHR1YWwoXCJzdGF0aWNcIikpIHtcbiAgICAvLyBQYXJzZSBzdGF0aWMgaW5pdCBibG9ja1xuICAgIGlmIChlY21hVmVyc2lvbiA+PSAxMyAmJiB0aGlzLmVhdCh0eXBlcyQxLmJyYWNlTCkpIHtcbiAgICAgIHRoaXMucGFyc2VDbGFzc1N0YXRpY0Jsb2NrKG5vZGUpO1xuICAgICAgcmV0dXJuIG5vZGVcbiAgICB9XG4gICAgaWYgKHRoaXMuaXNDbGFzc0VsZW1lbnROYW1lU3RhcnQoKSB8fCB0aGlzLnR5cGUgPT09IHR5cGVzJDEuc3Rhcikge1xuICAgICAgaXNTdGF0aWMgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXlOYW1lID0gXCJzdGF0aWNcIjtcbiAgICB9XG4gIH1cbiAgbm9kZS5zdGF0aWMgPSBpc1N0YXRpYztcbiAgaWYgKCFrZXlOYW1lICYmIGVjbWFWZXJzaW9uID49IDggJiYgdGhpcy5lYXRDb250ZXh0dWFsKFwiYXN5bmNcIikpIHtcbiAgICBpZiAoKHRoaXMuaXNDbGFzc0VsZW1lbnROYW1lU3RhcnQoKSB8fCB0aGlzLnR5cGUgPT09IHR5cGVzJDEuc3RhcikgJiYgIXRoaXMuY2FuSW5zZXJ0U2VtaWNvbG9uKCkpIHtcbiAgICAgIGlzQXN5bmMgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXlOYW1lID0gXCJhc3luY1wiO1xuICAgIH1cbiAgfVxuICBpZiAoIWtleU5hbWUgJiYgKGVjbWFWZXJzaW9uID49IDkgfHwgIWlzQXN5bmMpICYmIHRoaXMuZWF0KHR5cGVzJDEuc3RhcikpIHtcbiAgICBpc0dlbmVyYXRvciA9IHRydWU7XG4gIH1cbiAgaWYgKCFrZXlOYW1lICYmICFpc0FzeW5jICYmICFpc0dlbmVyYXRvcikge1xuICAgIHZhciBsYXN0VmFsdWUgPSB0aGlzLnZhbHVlO1xuICAgIGlmICh0aGlzLmVhdENvbnRleHR1YWwoXCJnZXRcIikgfHwgdGhpcy5lYXRDb250ZXh0dWFsKFwic2V0XCIpKSB7XG4gICAgICBpZiAodGhpcy5pc0NsYXNzRWxlbWVudE5hbWVTdGFydCgpKSB7XG4gICAgICAgIGtpbmQgPSBsYXN0VmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBrZXlOYW1lID0gbGFzdFZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFBhcnNlIGVsZW1lbnQgbmFtZVxuICBpZiAoa2V5TmFtZSkge1xuICAgIC8vICdhc3luYycsICdnZXQnLCAnc2V0Jywgb3IgJ3N0YXRpYycgd2VyZSBub3QgYSBrZXl3b3JkIGNvbnRleHR1YWxseS5cbiAgICAvLyBUaGUgbGFzdCB0b2tlbiBpcyBhbnkgb2YgdGhvc2UuIE1ha2UgaXQgdGhlIGVsZW1lbnQgbmFtZS5cbiAgICBub2RlLmNvbXB1dGVkID0gZmFsc2U7XG4gICAgbm9kZS5rZXkgPSB0aGlzLnN0YXJ0Tm9kZUF0KHRoaXMubGFzdFRva1N0YXJ0LCB0aGlzLmxhc3RUb2tTdGFydExvYyk7XG4gICAgbm9kZS5rZXkubmFtZSA9IGtleU5hbWU7XG4gICAgdGhpcy5maW5pc2hOb2RlKG5vZGUua2V5LCBcIklkZW50aWZpZXJcIik7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5wYXJzZUNsYXNzRWxlbWVudE5hbWUobm9kZSk7XG4gIH1cblxuICAvLyBQYXJzZSBlbGVtZW50IHZhbHVlXG4gIGlmIChlY21hVmVyc2lvbiA8IDEzIHx8IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5wYXJlbkwgfHwga2luZCAhPT0gXCJtZXRob2RcIiB8fCBpc0dlbmVyYXRvciB8fCBpc0FzeW5jKSB7XG4gICAgdmFyIGlzQ29uc3RydWN0b3IgPSAhbm9kZS5zdGF0aWMgJiYgY2hlY2tLZXlOYW1lKG5vZGUsIFwiY29uc3RydWN0b3JcIik7XG4gICAgdmFyIGFsbG93c0RpcmVjdFN1cGVyID0gaXNDb25zdHJ1Y3RvciAmJiBjb25zdHJ1Y3RvckFsbG93c1N1cGVyO1xuICAgIC8vIENvdWxkbid0IG1vdmUgdGhpcyBjaGVjayBpbnRvIHRoZSAncGFyc2VDbGFzc01ldGhvZCcgbWV0aG9kIGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5LlxuICAgIGlmIChpc0NvbnN0cnVjdG9yICYmIGtpbmQgIT09IFwibWV0aG9kXCIpIHsgdGhpcy5yYWlzZShub2RlLmtleS5zdGFydCwgXCJDb25zdHJ1Y3RvciBjYW4ndCBoYXZlIGdldC9zZXQgbW9kaWZpZXJcIik7IH1cbiAgICBub2RlLmtpbmQgPSBpc0NvbnN0cnVjdG9yID8gXCJjb25zdHJ1Y3RvclwiIDoga2luZDtcbiAgICB0aGlzLnBhcnNlQ2xhc3NNZXRob2Qobm9kZSwgaXNHZW5lcmF0b3IsIGlzQXN5bmMsIGFsbG93c0RpcmVjdFN1cGVyKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnBhcnNlQ2xhc3NGaWVsZChub2RlKTtcbiAgfVxuXG4gIHJldHVybiBub2RlXG59O1xuXG5wcCQ4LmlzQ2xhc3NFbGVtZW50TmFtZVN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAoXG4gICAgdGhpcy50eXBlID09PSB0eXBlcyQxLm5hbWUgfHxcbiAgICB0aGlzLnR5cGUgPT09IHR5cGVzJDEucHJpdmF0ZUlkIHx8XG4gICAgdGhpcy50eXBlID09PSB0eXBlcyQxLm51bSB8fFxuICAgIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5zdHJpbmcgfHxcbiAgICB0aGlzLnR5cGUgPT09IHR5cGVzJDEuYnJhY2tldEwgfHxcbiAgICB0aGlzLnR5cGUua2V5d29yZFxuICApXG59O1xuXG5wcCQ4LnBhcnNlQ2xhc3NFbGVtZW50TmFtZSA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5wcml2YXRlSWQpIHtcbiAgICBpZiAodGhpcy52YWx1ZSA9PT0gXCJjb25zdHJ1Y3RvclwiKSB7XG4gICAgICB0aGlzLnJhaXNlKHRoaXMuc3RhcnQsIFwiQ2xhc3NlcyBjYW4ndCBoYXZlIGFuIGVsZW1lbnQgbmFtZWQgJyNjb25zdHJ1Y3RvcidcIik7XG4gICAgfVxuICAgIGVsZW1lbnQuY29tcHV0ZWQgPSBmYWxzZTtcbiAgICBlbGVtZW50LmtleSA9IHRoaXMucGFyc2VQcml2YXRlSWRlbnQoKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnBhcnNlUHJvcGVydHlOYW1lKGVsZW1lbnQpO1xuICB9XG59O1xuXG5wcCQ4LnBhcnNlQ2xhc3NNZXRob2QgPSBmdW5jdGlvbihtZXRob2QsIGlzR2VuZXJhdG9yLCBpc0FzeW5jLCBhbGxvd3NEaXJlY3RTdXBlcikge1xuICAvLyBDaGVjayBrZXkgYW5kIGZsYWdzXG4gIHZhciBrZXkgPSBtZXRob2Qua2V5O1xuICBpZiAobWV0aG9kLmtpbmQgPT09IFwiY29uc3RydWN0b3JcIikge1xuICAgIGlmIChpc0dlbmVyYXRvcikgeyB0aGlzLnJhaXNlKGtleS5zdGFydCwgXCJDb25zdHJ1Y3RvciBjYW4ndCBiZSBhIGdlbmVyYXRvclwiKTsgfVxuICAgIGlmIChpc0FzeW5jKSB7IHRoaXMucmFpc2Uoa2V5LnN0YXJ0LCBcIkNvbnN0cnVjdG9yIGNhbid0IGJlIGFuIGFzeW5jIG1ldGhvZFwiKTsgfVxuICB9IGVsc2UgaWYgKG1ldGhvZC5zdGF0aWMgJiYgY2hlY2tLZXlOYW1lKG1ldGhvZCwgXCJwcm90b3R5cGVcIikpIHtcbiAgICB0aGlzLnJhaXNlKGtleS5zdGFydCwgXCJDbGFzc2VzIG1heSBub3QgaGF2ZSBhIHN0YXRpYyBwcm9wZXJ0eSBuYW1lZCBwcm90b3R5cGVcIik7XG4gIH1cblxuICAvLyBQYXJzZSB2YWx1ZVxuICB2YXIgdmFsdWUgPSBtZXRob2QudmFsdWUgPSB0aGlzLnBhcnNlTWV0aG9kKGlzR2VuZXJhdG9yLCBpc0FzeW5jLCBhbGxvd3NEaXJlY3RTdXBlcik7XG5cbiAgLy8gQ2hlY2sgdmFsdWVcbiAgaWYgKG1ldGhvZC5raW5kID09PSBcImdldFwiICYmIHZhbHVlLnBhcmFtcy5sZW5ndGggIT09IDApXG4gICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUodmFsdWUuc3RhcnQsIFwiZ2V0dGVyIHNob3VsZCBoYXZlIG5vIHBhcmFtc1wiKTsgfVxuICBpZiAobWV0aG9kLmtpbmQgPT09IFwic2V0XCIgJiYgdmFsdWUucGFyYW1zLmxlbmd0aCAhPT0gMSlcbiAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZSh2YWx1ZS5zdGFydCwgXCJzZXR0ZXIgc2hvdWxkIGhhdmUgZXhhY3RseSBvbmUgcGFyYW1cIik7IH1cbiAgaWYgKG1ldGhvZC5raW5kID09PSBcInNldFwiICYmIHZhbHVlLnBhcmFtc1swXS50eXBlID09PSBcIlJlc3RFbGVtZW50XCIpXG4gICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUodmFsdWUucGFyYW1zWzBdLnN0YXJ0LCBcIlNldHRlciBjYW5ub3QgdXNlIHJlc3QgcGFyYW1zXCIpOyB9XG5cbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShtZXRob2QsIFwiTWV0aG9kRGVmaW5pdGlvblwiKVxufTtcblxucHAkOC5wYXJzZUNsYXNzRmllbGQgPSBmdW5jdGlvbihmaWVsZCkge1xuICBpZiAoY2hlY2tLZXlOYW1lKGZpZWxkLCBcImNvbnN0cnVjdG9yXCIpKSB7XG4gICAgdGhpcy5yYWlzZShmaWVsZC5rZXkuc3RhcnQsIFwiQ2xhc3NlcyBjYW4ndCBoYXZlIGEgZmllbGQgbmFtZWQgJ2NvbnN0cnVjdG9yJ1wiKTtcbiAgfSBlbHNlIGlmIChmaWVsZC5zdGF0aWMgJiYgY2hlY2tLZXlOYW1lKGZpZWxkLCBcInByb3RvdHlwZVwiKSkge1xuICAgIHRoaXMucmFpc2UoZmllbGQua2V5LnN0YXJ0LCBcIkNsYXNzZXMgY2FuJ3QgaGF2ZSBhIHN0YXRpYyBmaWVsZCBuYW1lZCAncHJvdG90eXBlJ1wiKTtcbiAgfVxuXG4gIGlmICh0aGlzLmVhdCh0eXBlcyQxLmVxKSkge1xuICAgIC8vIFRvIHJhaXNlIFN5bnRheEVycm9yIGlmICdhcmd1bWVudHMnIGV4aXN0cyBpbiB0aGUgaW5pdGlhbGl6ZXIuXG4gICAgdGhpcy5lbnRlclNjb3BlKFNDT1BFX0NMQVNTX0ZJRUxEX0lOSVQgfCBTQ09QRV9TVVBFUik7XG4gICAgZmllbGQudmFsdWUgPSB0aGlzLnBhcnNlTWF5YmVBc3NpZ24oKTtcbiAgICB0aGlzLmV4aXRTY29wZSgpO1xuICB9IGVsc2Uge1xuICAgIGZpZWxkLnZhbHVlID0gbnVsbDtcbiAgfVxuICB0aGlzLnNlbWljb2xvbigpO1xuXG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUoZmllbGQsIFwiUHJvcGVydHlEZWZpbml0aW9uXCIpXG59O1xuXG5wcCQ4LnBhcnNlQ2xhc3NTdGF0aWNCbG9jayA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgbm9kZS5ib2R5ID0gW107XG5cbiAgdmFyIG9sZExhYmVscyA9IHRoaXMubGFiZWxzO1xuICB0aGlzLmxhYmVscyA9IFtdO1xuICB0aGlzLmVudGVyU2NvcGUoU0NPUEVfQ0xBU1NfU1RBVElDX0JMT0NLIHwgU0NPUEVfU1VQRVIpO1xuICB3aGlsZSAodGhpcy50eXBlICE9PSB0eXBlcyQxLmJyYWNlUikge1xuICAgIHZhciBzdG10ID0gdGhpcy5wYXJzZVN0YXRlbWVudChudWxsKTtcbiAgICBub2RlLmJvZHkucHVzaChzdG10KTtcbiAgfVxuICB0aGlzLm5leHQoKTtcbiAgdGhpcy5leGl0U2NvcGUoKTtcbiAgdGhpcy5sYWJlbHMgPSBvbGRMYWJlbHM7XG5cbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIlN0YXRpY0Jsb2NrXCIpXG59O1xuXG5wcCQ4LnBhcnNlQ2xhc3NJZCA9IGZ1bmN0aW9uKG5vZGUsIGlzU3RhdGVtZW50KSB7XG4gIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEubmFtZSkge1xuICAgIG5vZGUuaWQgPSB0aGlzLnBhcnNlSWRlbnQoKTtcbiAgICBpZiAoaXNTdGF0ZW1lbnQpXG4gICAgICB7IHRoaXMuY2hlY2tMVmFsU2ltcGxlKG5vZGUuaWQsIEJJTkRfTEVYSUNBTCwgZmFsc2UpOyB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGlzU3RhdGVtZW50ID09PSB0cnVlKVxuICAgICAgeyB0aGlzLnVuZXhwZWN0ZWQoKTsgfVxuICAgIG5vZGUuaWQgPSBudWxsO1xuICB9XG59O1xuXG5wcCQ4LnBhcnNlQ2xhc3NTdXBlciA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgbm9kZS5zdXBlckNsYXNzID0gdGhpcy5lYXQodHlwZXMkMS5fZXh0ZW5kcykgPyB0aGlzLnBhcnNlRXhwclN1YnNjcmlwdHMobnVsbCwgZmFsc2UpIDogbnVsbDtcbn07XG5cbnBwJDguZW50ZXJDbGFzc0JvZHkgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGVsZW1lbnQgPSB7ZGVjbGFyZWQ6IE9iamVjdC5jcmVhdGUobnVsbCksIHVzZWQ6IFtdfTtcbiAgdGhpcy5wcml2YXRlTmFtZVN0YWNrLnB1c2goZWxlbWVudCk7XG4gIHJldHVybiBlbGVtZW50LmRlY2xhcmVkXG59O1xuXG5wcCQ4LmV4aXRDbGFzc0JvZHkgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJlZiA9IHRoaXMucHJpdmF0ZU5hbWVTdGFjay5wb3AoKTtcbiAgdmFyIGRlY2xhcmVkID0gcmVmLmRlY2xhcmVkO1xuICB2YXIgdXNlZCA9IHJlZi51c2VkO1xuICBpZiAoIXRoaXMub3B0aW9ucy5jaGVja1ByaXZhdGVGaWVsZHMpIHsgcmV0dXJuIH1cbiAgdmFyIGxlbiA9IHRoaXMucHJpdmF0ZU5hbWVTdGFjay5sZW5ndGg7XG4gIHZhciBwYXJlbnQgPSBsZW4gPT09IDAgPyBudWxsIDogdGhpcy5wcml2YXRlTmFtZVN0YWNrW2xlbiAtIDFdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHVzZWQubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgaWQgPSB1c2VkW2ldO1xuICAgIGlmICghaGFzT3duKGRlY2xhcmVkLCBpZC5uYW1lKSkge1xuICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICBwYXJlbnQudXNlZC5wdXNoKGlkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucmFpc2VSZWNvdmVyYWJsZShpZC5zdGFydCwgKFwiUHJpdmF0ZSBmaWVsZCAnI1wiICsgKGlkLm5hbWUpICsgXCInIG11c3QgYmUgZGVjbGFyZWQgaW4gYW4gZW5jbG9zaW5nIGNsYXNzXCIpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGlzUHJpdmF0ZU5hbWVDb25mbGljdGVkKHByaXZhdGVOYW1lTWFwLCBlbGVtZW50KSB7XG4gIHZhciBuYW1lID0gZWxlbWVudC5rZXkubmFtZTtcbiAgdmFyIGN1cnIgPSBwcml2YXRlTmFtZU1hcFtuYW1lXTtcblxuICB2YXIgbmV4dCA9IFwidHJ1ZVwiO1xuICBpZiAoZWxlbWVudC50eXBlID09PSBcIk1ldGhvZERlZmluaXRpb25cIiAmJiAoZWxlbWVudC5raW5kID09PSBcImdldFwiIHx8IGVsZW1lbnQua2luZCA9PT0gXCJzZXRcIikpIHtcbiAgICBuZXh0ID0gKGVsZW1lbnQuc3RhdGljID8gXCJzXCIgOiBcImlcIikgKyBlbGVtZW50LmtpbmQ7XG4gIH1cblxuICAvLyBgY2xhc3MgeyBnZXQgI2EoKXt9OyBzdGF0aWMgc2V0ICNhKF8pe30gfWAgaXMgYWxzbyBjb25mbGljdC5cbiAgaWYgKFxuICAgIGN1cnIgPT09IFwiaWdldFwiICYmIG5leHQgPT09IFwiaXNldFwiIHx8XG4gICAgY3VyciA9PT0gXCJpc2V0XCIgJiYgbmV4dCA9PT0gXCJpZ2V0XCIgfHxcbiAgICBjdXJyID09PSBcInNnZXRcIiAmJiBuZXh0ID09PSBcInNzZXRcIiB8fFxuICAgIGN1cnIgPT09IFwic3NldFwiICYmIG5leHQgPT09IFwic2dldFwiXG4gICkge1xuICAgIHByaXZhdGVOYW1lTWFwW25hbWVdID0gXCJ0cnVlXCI7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH0gZWxzZSBpZiAoIWN1cnIpIHtcbiAgICBwcml2YXRlTmFtZU1hcFtuYW1lXSA9IG5leHQ7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxufVxuXG5mdW5jdGlvbiBjaGVja0tleU5hbWUobm9kZSwgbmFtZSkge1xuICB2YXIgY29tcHV0ZWQgPSBub2RlLmNvbXB1dGVkO1xuICB2YXIga2V5ID0gbm9kZS5rZXk7XG4gIHJldHVybiAhY29tcHV0ZWQgJiYgKFxuICAgIGtleS50eXBlID09PSBcIklkZW50aWZpZXJcIiAmJiBrZXkubmFtZSA9PT0gbmFtZSB8fFxuICAgIGtleS50eXBlID09PSBcIkxpdGVyYWxcIiAmJiBrZXkudmFsdWUgPT09IG5hbWVcbiAgKVxufVxuXG4vLyBQYXJzZXMgbW9kdWxlIGV4cG9ydCBkZWNsYXJhdGlvbi5cblxucHAkOC5wYXJzZUV4cG9ydEFsbERlY2xhcmF0aW9uID0gZnVuY3Rpb24obm9kZSwgZXhwb3J0cykge1xuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDExKSB7XG4gICAgaWYgKHRoaXMuZWF0Q29udGV4dHVhbChcImFzXCIpKSB7XG4gICAgICBub2RlLmV4cG9ydGVkID0gdGhpcy5wYXJzZU1vZHVsZUV4cG9ydE5hbWUoKTtcbiAgICAgIHRoaXMuY2hlY2tFeHBvcnQoZXhwb3J0cywgbm9kZS5leHBvcnRlZCwgdGhpcy5sYXN0VG9rU3RhcnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBub2RlLmV4cG9ydGVkID0gbnVsbDtcbiAgICB9XG4gIH1cbiAgdGhpcy5leHBlY3RDb250ZXh0dWFsKFwiZnJvbVwiKTtcbiAgaWYgKHRoaXMudHlwZSAhPT0gdHlwZXMkMS5zdHJpbmcpIHsgdGhpcy51bmV4cGVjdGVkKCk7IH1cbiAgbm9kZS5zb3VyY2UgPSB0aGlzLnBhcnNlRXhwckF0b20oKTtcbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSAxNilcbiAgICB7IG5vZGUuYXR0cmlidXRlcyA9IHRoaXMucGFyc2VXaXRoQ2xhdXNlKCk7IH1cbiAgdGhpcy5zZW1pY29sb24oKTtcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIkV4cG9ydEFsbERlY2xhcmF0aW9uXCIpXG59O1xuXG5wcCQ4LnBhcnNlRXhwb3J0ID0gZnVuY3Rpb24obm9kZSwgZXhwb3J0cykge1xuICB0aGlzLm5leHQoKTtcbiAgLy8gZXhwb3J0ICogZnJvbSAnLi4uJ1xuICBpZiAodGhpcy5lYXQodHlwZXMkMS5zdGFyKSkge1xuICAgIHJldHVybiB0aGlzLnBhcnNlRXhwb3J0QWxsRGVjbGFyYXRpb24obm9kZSwgZXhwb3J0cylcbiAgfVxuICBpZiAodGhpcy5lYXQodHlwZXMkMS5fZGVmYXVsdCkpIHsgLy8gZXhwb3J0IGRlZmF1bHQgLi4uXG4gICAgdGhpcy5jaGVja0V4cG9ydChleHBvcnRzLCBcImRlZmF1bHRcIiwgdGhpcy5sYXN0VG9rU3RhcnQpO1xuICAgIG5vZGUuZGVjbGFyYXRpb24gPSB0aGlzLnBhcnNlRXhwb3J0RGVmYXVsdERlY2xhcmF0aW9uKCk7XG4gICAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIkV4cG9ydERlZmF1bHREZWNsYXJhdGlvblwiKVxuICB9XG4gIC8vIGV4cG9ydCB2YXJ8Y29uc3R8bGV0fGZ1bmN0aW9ufGNsYXNzIC4uLlxuICBpZiAodGhpcy5zaG91bGRQYXJzZUV4cG9ydFN0YXRlbWVudCgpKSB7XG4gICAgbm9kZS5kZWNsYXJhdGlvbiA9IHRoaXMucGFyc2VFeHBvcnREZWNsYXJhdGlvbihub2RlKTtcbiAgICBpZiAobm9kZS5kZWNsYXJhdGlvbi50eXBlID09PSBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIilcbiAgICAgIHsgdGhpcy5jaGVja1ZhcmlhYmxlRXhwb3J0KGV4cG9ydHMsIG5vZGUuZGVjbGFyYXRpb24uZGVjbGFyYXRpb25zKTsgfVxuICAgIGVsc2VcbiAgICAgIHsgdGhpcy5jaGVja0V4cG9ydChleHBvcnRzLCBub2RlLmRlY2xhcmF0aW9uLmlkLCBub2RlLmRlY2xhcmF0aW9uLmlkLnN0YXJ0KTsgfVxuICAgIG5vZGUuc3BlY2lmaWVycyA9IFtdO1xuICAgIG5vZGUuc291cmNlID0gbnVsbDtcbiAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDE2KVxuICAgICAgeyBub2RlLmF0dHJpYnV0ZXMgPSBbXTsgfVxuICB9IGVsc2UgeyAvLyBleHBvcnQgeyB4LCB5IGFzIHogfSBbZnJvbSAnLi4uJ11cbiAgICBub2RlLmRlY2xhcmF0aW9uID0gbnVsbDtcbiAgICBub2RlLnNwZWNpZmllcnMgPSB0aGlzLnBhcnNlRXhwb3J0U3BlY2lmaWVycyhleHBvcnRzKTtcbiAgICBpZiAodGhpcy5lYXRDb250ZXh0dWFsKFwiZnJvbVwiKSkge1xuICAgICAgaWYgKHRoaXMudHlwZSAhPT0gdHlwZXMkMS5zdHJpbmcpIHsgdGhpcy51bmV4cGVjdGVkKCk7IH1cbiAgICAgIG5vZGUuc291cmNlID0gdGhpcy5wYXJzZUV4cHJBdG9tKCk7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDE2KVxuICAgICAgICB7IG5vZGUuYXR0cmlidXRlcyA9IHRoaXMucGFyc2VXaXRoQ2xhdXNlKCk7IH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxpc3QgPSBub2RlLnNwZWNpZmllcnM7IGkgPCBsaXN0Lmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIC8vIGNoZWNrIGZvciBrZXl3b3JkcyB1c2VkIGFzIGxvY2FsIG5hbWVzXG4gICAgICAgIHZhciBzcGVjID0gbGlzdFtpXTtcblxuICAgICAgICB0aGlzLmNoZWNrVW5yZXNlcnZlZChzcGVjLmxvY2FsKTtcbiAgICAgICAgLy8gY2hlY2sgaWYgZXhwb3J0IGlzIGRlZmluZWRcbiAgICAgICAgdGhpcy5jaGVja0xvY2FsRXhwb3J0KHNwZWMubG9jYWwpO1xuXG4gICAgICAgIGlmIChzcGVjLmxvY2FsLnR5cGUgPT09IFwiTGl0ZXJhbFwiKSB7XG4gICAgICAgICAgdGhpcy5yYWlzZShzcGVjLmxvY2FsLnN0YXJ0LCBcIkEgc3RyaW5nIGxpdGVyYWwgY2Fubm90IGJlIHVzZWQgYXMgYW4gZXhwb3J0ZWQgYmluZGluZyB3aXRob3V0IGBmcm9tYC5cIik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbm9kZS5zb3VyY2UgPSBudWxsO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSAxNilcbiAgICAgICAgeyBub2RlLmF0dHJpYnV0ZXMgPSBbXTsgfVxuICAgIH1cbiAgICB0aGlzLnNlbWljb2xvbigpO1xuICB9XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJFeHBvcnROYW1lZERlY2xhcmF0aW9uXCIpXG59O1xuXG5wcCQ4LnBhcnNlRXhwb3J0RGVjbGFyYXRpb24gPSBmdW5jdGlvbihub2RlKSB7XG4gIHJldHVybiB0aGlzLnBhcnNlU3RhdGVtZW50KG51bGwpXG59O1xuXG5wcCQ4LnBhcnNlRXhwb3J0RGVmYXVsdERlY2xhcmF0aW9uID0gZnVuY3Rpb24oKSB7XG4gIHZhciBpc0FzeW5jO1xuICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLl9mdW5jdGlvbiB8fCAoaXNBc3luYyA9IHRoaXMuaXNBc3luY0Z1bmN0aW9uKCkpKSB7XG4gICAgdmFyIGZOb2RlID0gdGhpcy5zdGFydE5vZGUoKTtcbiAgICB0aGlzLm5leHQoKTtcbiAgICBpZiAoaXNBc3luYykgeyB0aGlzLm5leHQoKTsgfVxuICAgIHJldHVybiB0aGlzLnBhcnNlRnVuY3Rpb24oZk5vZGUsIEZVTkNfU1RBVEVNRU5UIHwgRlVOQ19OVUxMQUJMRV9JRCwgZmFsc2UsIGlzQXN5bmMpXG4gIH0gZWxzZSBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLl9jbGFzcykge1xuICAgIHZhciBjTm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gICAgcmV0dXJuIHRoaXMucGFyc2VDbGFzcyhjTm9kZSwgXCJudWxsYWJsZUlEXCIpXG4gIH0gZWxzZSB7XG4gICAgdmFyIGRlY2xhcmF0aW9uID0gdGhpcy5wYXJzZU1heWJlQXNzaWduKCk7XG4gICAgdGhpcy5zZW1pY29sb24oKTtcbiAgICByZXR1cm4gZGVjbGFyYXRpb25cbiAgfVxufTtcblxucHAkOC5jaGVja0V4cG9ydCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIHBvcykge1xuICBpZiAoIWV4cG9ydHMpIHsgcmV0dXJuIH1cbiAgaWYgKHR5cGVvZiBuYW1lICE9PSBcInN0cmluZ1wiKVxuICAgIHsgbmFtZSA9IG5hbWUudHlwZSA9PT0gXCJJZGVudGlmaWVyXCIgPyBuYW1lLm5hbWUgOiBuYW1lLnZhbHVlOyB9XG4gIGlmIChoYXNPd24oZXhwb3J0cywgbmFtZSkpXG4gICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUocG9zLCBcIkR1cGxpY2F0ZSBleHBvcnQgJ1wiICsgbmFtZSArIFwiJ1wiKTsgfVxuICBleHBvcnRzW25hbWVdID0gdHJ1ZTtcbn07XG5cbnBwJDguY2hlY2tQYXR0ZXJuRXhwb3J0ID0gZnVuY3Rpb24oZXhwb3J0cywgcGF0KSB7XG4gIHZhciB0eXBlID0gcGF0LnR5cGU7XG4gIGlmICh0eXBlID09PSBcIklkZW50aWZpZXJcIilcbiAgICB7IHRoaXMuY2hlY2tFeHBvcnQoZXhwb3J0cywgcGF0LCBwYXQuc3RhcnQpOyB9XG4gIGVsc2UgaWYgKHR5cGUgPT09IFwiT2JqZWN0UGF0dGVyblwiKVxuICAgIHsgZm9yICh2YXIgaSA9IDAsIGxpc3QgPSBwYXQucHJvcGVydGllczsgaSA8IGxpc3QubGVuZ3RoOyBpICs9IDEpXG4gICAgICB7XG4gICAgICAgIHZhciBwcm9wID0gbGlzdFtpXTtcblxuICAgICAgICB0aGlzLmNoZWNrUGF0dGVybkV4cG9ydChleHBvcnRzLCBwcm9wKTtcbiAgICAgIH0gfVxuICBlbHNlIGlmICh0eXBlID09PSBcIkFycmF5UGF0dGVyblwiKVxuICAgIHsgZm9yICh2YXIgaSQxID0gMCwgbGlzdCQxID0gcGF0LmVsZW1lbnRzOyBpJDEgPCBsaXN0JDEubGVuZ3RoOyBpJDEgKz0gMSkge1xuICAgICAgdmFyIGVsdCA9IGxpc3QkMVtpJDFdO1xuXG4gICAgICAgIGlmIChlbHQpIHsgdGhpcy5jaGVja1BhdHRlcm5FeHBvcnQoZXhwb3J0cywgZWx0KTsgfVxuICAgIH0gfVxuICBlbHNlIGlmICh0eXBlID09PSBcIlByb3BlcnR5XCIpXG4gICAgeyB0aGlzLmNoZWNrUGF0dGVybkV4cG9ydChleHBvcnRzLCBwYXQudmFsdWUpOyB9XG4gIGVsc2UgaWYgKHR5cGUgPT09IFwiQXNzaWdubWVudFBhdHRlcm5cIilcbiAgICB7IHRoaXMuY2hlY2tQYXR0ZXJuRXhwb3J0KGV4cG9ydHMsIHBhdC5sZWZ0KTsgfVxuICBlbHNlIGlmICh0eXBlID09PSBcIlJlc3RFbGVtZW50XCIpXG4gICAgeyB0aGlzLmNoZWNrUGF0dGVybkV4cG9ydChleHBvcnRzLCBwYXQuYXJndW1lbnQpOyB9XG59O1xuXG5wcCQ4LmNoZWNrVmFyaWFibGVFeHBvcnQgPSBmdW5jdGlvbihleHBvcnRzLCBkZWNscykge1xuICBpZiAoIWV4cG9ydHMpIHsgcmV0dXJuIH1cbiAgZm9yICh2YXIgaSA9IDAsIGxpc3QgPSBkZWNsczsgaSA8IGxpc3QubGVuZ3RoOyBpICs9IDEpXG4gICAge1xuICAgIHZhciBkZWNsID0gbGlzdFtpXTtcblxuICAgIHRoaXMuY2hlY2tQYXR0ZXJuRXhwb3J0KGV4cG9ydHMsIGRlY2wuaWQpO1xuICB9XG59O1xuXG5wcCQ4LnNob3VsZFBhcnNlRXhwb3J0U3RhdGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnR5cGUua2V5d29yZCA9PT0gXCJ2YXJcIiB8fFxuICAgIHRoaXMudHlwZS5rZXl3b3JkID09PSBcImNvbnN0XCIgfHxcbiAgICB0aGlzLnR5cGUua2V5d29yZCA9PT0gXCJjbGFzc1wiIHx8XG4gICAgdGhpcy50eXBlLmtleXdvcmQgPT09IFwiZnVuY3Rpb25cIiB8fFxuICAgIHRoaXMuaXNMZXQoKSB8fFxuICAgIHRoaXMuaXNBc3luY0Z1bmN0aW9uKClcbn07XG5cbi8vIFBhcnNlcyBhIGNvbW1hLXNlcGFyYXRlZCBsaXN0IG9mIG1vZHVsZSBleHBvcnRzLlxuXG5wcCQ4LnBhcnNlRXhwb3J0U3BlY2lmaWVyID0gZnVuY3Rpb24oZXhwb3J0cykge1xuICB2YXIgbm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gIG5vZGUubG9jYWwgPSB0aGlzLnBhcnNlTW9kdWxlRXhwb3J0TmFtZSgpO1xuXG4gIG5vZGUuZXhwb3J0ZWQgPSB0aGlzLmVhdENvbnRleHR1YWwoXCJhc1wiKSA/IHRoaXMucGFyc2VNb2R1bGVFeHBvcnROYW1lKCkgOiBub2RlLmxvY2FsO1xuICB0aGlzLmNoZWNrRXhwb3J0KFxuICAgIGV4cG9ydHMsXG4gICAgbm9kZS5leHBvcnRlZCxcbiAgICBub2RlLmV4cG9ydGVkLnN0YXJ0XG4gICk7XG5cbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIkV4cG9ydFNwZWNpZmllclwiKVxufTtcblxucHAkOC5wYXJzZUV4cG9ydFNwZWNpZmllcnMgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gIHZhciBub2RlcyA9IFtdLCBmaXJzdCA9IHRydWU7XG4gIC8vIGV4cG9ydCB7IHgsIHkgYXMgeiB9IFtmcm9tICcuLi4nXVxuICB0aGlzLmV4cGVjdCh0eXBlcyQxLmJyYWNlTCk7XG4gIHdoaWxlICghdGhpcy5lYXQodHlwZXMkMS5icmFjZVIpKSB7XG4gICAgaWYgKCFmaXJzdCkge1xuICAgICAgdGhpcy5leHBlY3QodHlwZXMkMS5jb21tYSk7XG4gICAgICBpZiAodGhpcy5hZnRlclRyYWlsaW5nQ29tbWEodHlwZXMkMS5icmFjZVIpKSB7IGJyZWFrIH1cbiAgICB9IGVsc2UgeyBmaXJzdCA9IGZhbHNlOyB9XG5cbiAgICBub2Rlcy5wdXNoKHRoaXMucGFyc2VFeHBvcnRTcGVjaWZpZXIoZXhwb3J0cykpO1xuICB9XG4gIHJldHVybiBub2Rlc1xufTtcblxuLy8gUGFyc2VzIGltcG9ydCBkZWNsYXJhdGlvbi5cblxucHAkOC5wYXJzZUltcG9ydCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgdGhpcy5uZXh0KCk7XG5cbiAgLy8gaW1wb3J0ICcuLi4nXG4gIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuc3RyaW5nKSB7XG4gICAgbm9kZS5zcGVjaWZpZXJzID0gZW1wdHkkMTtcbiAgICBub2RlLnNvdXJjZSA9IHRoaXMucGFyc2VFeHByQXRvbSgpO1xuICB9IGVsc2Uge1xuICAgIG5vZGUuc3BlY2lmaWVycyA9IHRoaXMucGFyc2VJbXBvcnRTcGVjaWZpZXJzKCk7XG4gICAgdGhpcy5leHBlY3RDb250ZXh0dWFsKFwiZnJvbVwiKTtcbiAgICBub2RlLnNvdXJjZSA9IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5zdHJpbmcgPyB0aGlzLnBhcnNlRXhwckF0b20oKSA6IHRoaXMudW5leHBlY3RlZCgpO1xuICB9XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTYpXG4gICAgeyBub2RlLmF0dHJpYnV0ZXMgPSB0aGlzLnBhcnNlV2l0aENsYXVzZSgpOyB9XG4gIHRoaXMuc2VtaWNvbG9uKCk7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJJbXBvcnREZWNsYXJhdGlvblwiKVxufTtcblxuLy8gUGFyc2VzIGEgY29tbWEtc2VwYXJhdGVkIGxpc3Qgb2YgbW9kdWxlIGltcG9ydHMuXG5cbnBwJDgucGFyc2VJbXBvcnRTcGVjaWZpZXIgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICBub2RlLmltcG9ydGVkID0gdGhpcy5wYXJzZU1vZHVsZUV4cG9ydE5hbWUoKTtcblxuICBpZiAodGhpcy5lYXRDb250ZXh0dWFsKFwiYXNcIikpIHtcbiAgICBub2RlLmxvY2FsID0gdGhpcy5wYXJzZUlkZW50KCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5jaGVja1VucmVzZXJ2ZWQobm9kZS5pbXBvcnRlZCk7XG4gICAgbm9kZS5sb2NhbCA9IG5vZGUuaW1wb3J0ZWQ7XG4gIH1cbiAgdGhpcy5jaGVja0xWYWxTaW1wbGUobm9kZS5sb2NhbCwgQklORF9MRVhJQ0FMKTtcblxuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiSW1wb3J0U3BlY2lmaWVyXCIpXG59O1xuXG5wcCQ4LnBhcnNlSW1wb3J0RGVmYXVsdFNwZWNpZmllciA9IGZ1bmN0aW9uKCkge1xuICAvLyBpbXBvcnQgZGVmYXVsdE9iaiwgeyB4LCB5IGFzIHogfSBmcm9tICcuLi4nXG4gIHZhciBub2RlID0gdGhpcy5zdGFydE5vZGUoKTtcbiAgbm9kZS5sb2NhbCA9IHRoaXMucGFyc2VJZGVudCgpO1xuICB0aGlzLmNoZWNrTFZhbFNpbXBsZShub2RlLmxvY2FsLCBCSU5EX0xFWElDQUwpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiSW1wb3J0RGVmYXVsdFNwZWNpZmllclwiKVxufTtcblxucHAkOC5wYXJzZUltcG9ydE5hbWVzcGFjZVNwZWNpZmllciA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gIHRoaXMubmV4dCgpO1xuICB0aGlzLmV4cGVjdENvbnRleHR1YWwoXCJhc1wiKTtcbiAgbm9kZS5sb2NhbCA9IHRoaXMucGFyc2VJZGVudCgpO1xuICB0aGlzLmNoZWNrTFZhbFNpbXBsZShub2RlLmxvY2FsLCBCSU5EX0xFWElDQUwpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiSW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyXCIpXG59O1xuXG5wcCQ4LnBhcnNlSW1wb3J0U3BlY2lmaWVycyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbm9kZXMgPSBbXSwgZmlyc3QgPSB0cnVlO1xuICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLm5hbWUpIHtcbiAgICBub2Rlcy5wdXNoKHRoaXMucGFyc2VJbXBvcnREZWZhdWx0U3BlY2lmaWVyKCkpO1xuICAgIGlmICghdGhpcy5lYXQodHlwZXMkMS5jb21tYSkpIHsgcmV0dXJuIG5vZGVzIH1cbiAgfVxuICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLnN0YXIpIHtcbiAgICBub2Rlcy5wdXNoKHRoaXMucGFyc2VJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXIoKSk7XG4gICAgcmV0dXJuIG5vZGVzXG4gIH1cbiAgdGhpcy5leHBlY3QodHlwZXMkMS5icmFjZUwpO1xuICB3aGlsZSAoIXRoaXMuZWF0KHR5cGVzJDEuYnJhY2VSKSkge1xuICAgIGlmICghZmlyc3QpIHtcbiAgICAgIHRoaXMuZXhwZWN0KHR5cGVzJDEuY29tbWEpO1xuICAgICAgaWYgKHRoaXMuYWZ0ZXJUcmFpbGluZ0NvbW1hKHR5cGVzJDEuYnJhY2VSKSkgeyBicmVhayB9XG4gICAgfSBlbHNlIHsgZmlyc3QgPSBmYWxzZTsgfVxuXG4gICAgbm9kZXMucHVzaCh0aGlzLnBhcnNlSW1wb3J0U3BlY2lmaWVyKCkpO1xuICB9XG4gIHJldHVybiBub2Rlc1xufTtcblxucHAkOC5wYXJzZVdpdGhDbGF1c2UgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG5vZGVzID0gW107XG4gIGlmICghdGhpcy5lYXQodHlwZXMkMS5fd2l0aCkpIHtcbiAgICByZXR1cm4gbm9kZXNcbiAgfVxuICB0aGlzLmV4cGVjdCh0eXBlcyQxLmJyYWNlTCk7XG4gIHZhciBhdHRyaWJ1dGVLZXlzID0ge307XG4gIHZhciBmaXJzdCA9IHRydWU7XG4gIHdoaWxlICghdGhpcy5lYXQodHlwZXMkMS5icmFjZVIpKSB7XG4gICAgaWYgKCFmaXJzdCkge1xuICAgICAgdGhpcy5leHBlY3QodHlwZXMkMS5jb21tYSk7XG4gICAgICBpZiAodGhpcy5hZnRlclRyYWlsaW5nQ29tbWEodHlwZXMkMS5icmFjZVIpKSB7IGJyZWFrIH1cbiAgICB9IGVsc2UgeyBmaXJzdCA9IGZhbHNlOyB9XG5cbiAgICB2YXIgYXR0ciA9IHRoaXMucGFyc2VJbXBvcnRBdHRyaWJ1dGUoKTtcbiAgICB2YXIga2V5TmFtZSA9IGF0dHIua2V5LnR5cGUgPT09IFwiSWRlbnRpZmllclwiID8gYXR0ci5rZXkubmFtZSA6IGF0dHIua2V5LnZhbHVlO1xuICAgIGlmIChoYXNPd24oYXR0cmlidXRlS2V5cywga2V5TmFtZSkpXG4gICAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShhdHRyLmtleS5zdGFydCwgXCJEdXBsaWNhdGUgYXR0cmlidXRlIGtleSAnXCIgKyBrZXlOYW1lICsgXCInXCIpOyB9XG4gICAgYXR0cmlidXRlS2V5c1trZXlOYW1lXSA9IHRydWU7XG4gICAgbm9kZXMucHVzaChhdHRyKTtcbiAgfVxuICByZXR1cm4gbm9kZXNcbn07XG5cbnBwJDgucGFyc2VJbXBvcnRBdHRyaWJ1dGUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICBub2RlLmtleSA9IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5zdHJpbmcgPyB0aGlzLnBhcnNlRXhwckF0b20oKSA6IHRoaXMucGFyc2VJZGVudCh0aGlzLm9wdGlvbnMuYWxsb3dSZXNlcnZlZCAhPT0gXCJuZXZlclwiKTtcbiAgdGhpcy5leHBlY3QodHlwZXMkMS5jb2xvbik7XG4gIGlmICh0aGlzLnR5cGUgIT09IHR5cGVzJDEuc3RyaW5nKSB7XG4gICAgdGhpcy51bmV4cGVjdGVkKCk7XG4gIH1cbiAgbm9kZS52YWx1ZSA9IHRoaXMucGFyc2VFeHByQXRvbSgpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiSW1wb3J0QXR0cmlidXRlXCIpXG59O1xuXG5wcCQ4LnBhcnNlTW9kdWxlRXhwb3J0TmFtZSA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDEzICYmIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5zdHJpbmcpIHtcbiAgICB2YXIgc3RyaW5nTGl0ZXJhbCA9IHRoaXMucGFyc2VMaXRlcmFsKHRoaXMudmFsdWUpO1xuICAgIGlmIChsb25lU3Vycm9nYXRlLnRlc3Qoc3RyaW5nTGl0ZXJhbC52YWx1ZSkpIHtcbiAgICAgIHRoaXMucmFpc2Uoc3RyaW5nTGl0ZXJhbC5zdGFydCwgXCJBbiBleHBvcnQgbmFtZSBjYW5ub3QgaW5jbHVkZSBhIGxvbmUgc3Vycm9nYXRlLlwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0cmluZ0xpdGVyYWxcbiAgfVxuICByZXR1cm4gdGhpcy5wYXJzZUlkZW50KHRydWUpXG59O1xuXG4vLyBTZXQgYEV4cHJlc3Npb25TdGF0ZW1lbnQjZGlyZWN0aXZlYCBwcm9wZXJ0eSBmb3IgZGlyZWN0aXZlIHByb2xvZ3Vlcy5cbnBwJDguYWRhcHREaXJlY3RpdmVQcm9sb2d1ZSA9IGZ1bmN0aW9uKHN0YXRlbWVudHMpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGF0ZW1lbnRzLmxlbmd0aCAmJiB0aGlzLmlzRGlyZWN0aXZlQ2FuZGlkYXRlKHN0YXRlbWVudHNbaV0pOyArK2kpIHtcbiAgICBzdGF0ZW1lbnRzW2ldLmRpcmVjdGl2ZSA9IHN0YXRlbWVudHNbaV0uZXhwcmVzc2lvbi5yYXcuc2xpY2UoMSwgLTEpO1xuICB9XG59O1xucHAkOC5pc0RpcmVjdGl2ZUNhbmRpZGF0ZSA9IGZ1bmN0aW9uKHN0YXRlbWVudCkge1xuICByZXR1cm4gKFxuICAgIHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA1ICYmXG4gICAgc3RhdGVtZW50LnR5cGUgPT09IFwiRXhwcmVzc2lvblN0YXRlbWVudFwiICYmXG4gICAgc3RhdGVtZW50LmV4cHJlc3Npb24udHlwZSA9PT0gXCJMaXRlcmFsXCIgJiZcbiAgICB0eXBlb2Ygc3RhdGVtZW50LmV4cHJlc3Npb24udmFsdWUgPT09IFwic3RyaW5nXCIgJiZcbiAgICAvLyBSZWplY3QgcGFyZW50aGVzaXplZCBzdHJpbmdzLlxuICAgICh0aGlzLmlucHV0W3N0YXRlbWVudC5zdGFydF0gPT09IFwiXFxcIlwiIHx8IHRoaXMuaW5wdXRbc3RhdGVtZW50LnN0YXJ0XSA9PT0gXCInXCIpXG4gIClcbn07XG5cbnZhciBwcCQ3ID0gUGFyc2VyLnByb3RvdHlwZTtcblxuLy8gQ29udmVydCBleGlzdGluZyBleHByZXNzaW9uIGF0b20gdG8gYXNzaWduYWJsZSBwYXR0ZXJuXG4vLyBpZiBwb3NzaWJsZS5cblxucHAkNy50b0Fzc2lnbmFibGUgPSBmdW5jdGlvbihub2RlLCBpc0JpbmRpbmcsIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpIHtcbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2ICYmIG5vZGUpIHtcbiAgICBzd2l0Y2ggKG5vZGUudHlwZSkge1xuICAgIGNhc2UgXCJJZGVudGlmaWVyXCI6XG4gICAgICBpZiAodGhpcy5pbkFzeW5jICYmIG5vZGUubmFtZSA9PT0gXCJhd2FpdFwiKVxuICAgICAgICB7IHRoaXMucmFpc2Uobm9kZS5zdGFydCwgXCJDYW5ub3QgdXNlICdhd2FpdCcgYXMgaWRlbnRpZmllciBpbnNpZGUgYW4gYXN5bmMgZnVuY3Rpb25cIik7IH1cbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlIFwiT2JqZWN0UGF0dGVyblwiOlxuICAgIGNhc2UgXCJBcnJheVBhdHRlcm5cIjpcbiAgICBjYXNlIFwiQXNzaWdubWVudFBhdHRlcm5cIjpcbiAgICBjYXNlIFwiUmVzdEVsZW1lbnRcIjpcbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlIFwiT2JqZWN0RXhwcmVzc2lvblwiOlxuICAgICAgbm9kZS50eXBlID0gXCJPYmplY3RQYXR0ZXJuXCI7XG4gICAgICBpZiAocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykgeyB0aGlzLmNoZWNrUGF0dGVybkVycm9ycyhyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCB0cnVlKTsgfVxuICAgICAgZm9yICh2YXIgaSA9IDAsIGxpc3QgPSBub2RlLnByb3BlcnRpZXM7IGkgPCBsaXN0Lmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHZhciBwcm9wID0gbGlzdFtpXTtcblxuICAgICAgdGhpcy50b0Fzc2lnbmFibGUocHJvcCwgaXNCaW5kaW5nKTtcbiAgICAgICAgLy8gRWFybHkgZXJyb3I6XG4gICAgICAgIC8vICAgQXNzaWdubWVudFJlc3RQcm9wZXJ0eVtZaWVsZCwgQXdhaXRdIDpcbiAgICAgICAgLy8gICAgIGAuLi5gIERlc3RydWN0dXJpbmdBc3NpZ25tZW50VGFyZ2V0W1lpZWxkLCBBd2FpdF1cbiAgICAgICAgLy9cbiAgICAgICAgLy8gICBJdCBpcyBhIFN5bnRheCBFcnJvciBpZiB8RGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnRUYXJnZXR8IGlzIGFuIHxBcnJheUxpdGVyYWx8IG9yIGFuIHxPYmplY3RMaXRlcmFsfC5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIHByb3AudHlwZSA9PT0gXCJSZXN0RWxlbWVudFwiICYmXG4gICAgICAgICAgKHByb3AuYXJndW1lbnQudHlwZSA9PT0gXCJBcnJheVBhdHRlcm5cIiB8fCBwcm9wLmFyZ3VtZW50LnR5cGUgPT09IFwiT2JqZWN0UGF0dGVyblwiKVxuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzLnJhaXNlKHByb3AuYXJndW1lbnQuc3RhcnQsIFwiVW5leHBlY3RlZCB0b2tlblwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYnJlYWtcblxuICAgIGNhc2UgXCJQcm9wZXJ0eVwiOlxuICAgICAgLy8gQXNzaWdubWVudFByb3BlcnR5IGhhcyB0eXBlID09PSBcIlByb3BlcnR5XCJcbiAgICAgIGlmIChub2RlLmtpbmQgIT09IFwiaW5pdFwiKSB7IHRoaXMucmFpc2Uobm9kZS5rZXkuc3RhcnQsIFwiT2JqZWN0IHBhdHRlcm4gY2FuJ3QgY29udGFpbiBnZXR0ZXIgb3Igc2V0dGVyXCIpOyB9XG4gICAgICB0aGlzLnRvQXNzaWduYWJsZShub2RlLnZhbHVlLCBpc0JpbmRpbmcpO1xuICAgICAgYnJlYWtcblxuICAgIGNhc2UgXCJBcnJheUV4cHJlc3Npb25cIjpcbiAgICAgIG5vZGUudHlwZSA9IFwiQXJyYXlQYXR0ZXJuXCI7XG4gICAgICBpZiAocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykgeyB0aGlzLmNoZWNrUGF0dGVybkVycm9ycyhyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCB0cnVlKTsgfVxuICAgICAgdGhpcy50b0Fzc2lnbmFibGVMaXN0KG5vZGUuZWxlbWVudHMsIGlzQmluZGluZyk7XG4gICAgICBicmVha1xuXG4gICAgY2FzZSBcIlNwcmVhZEVsZW1lbnRcIjpcbiAgICAgIG5vZGUudHlwZSA9IFwiUmVzdEVsZW1lbnRcIjtcbiAgICAgIHRoaXMudG9Bc3NpZ25hYmxlKG5vZGUuYXJndW1lbnQsIGlzQmluZGluZyk7XG4gICAgICBpZiAobm9kZS5hcmd1bWVudC50eXBlID09PSBcIkFzc2lnbm1lbnRQYXR0ZXJuXCIpXG4gICAgICAgIHsgdGhpcy5yYWlzZShub2RlLmFyZ3VtZW50LnN0YXJ0LCBcIlJlc3QgZWxlbWVudHMgY2Fubm90IGhhdmUgYSBkZWZhdWx0IHZhbHVlXCIpOyB9XG4gICAgICBicmVha1xuXG4gICAgY2FzZSBcIkFzc2lnbm1lbnRFeHByZXNzaW9uXCI6XG4gICAgICBpZiAobm9kZS5vcGVyYXRvciAhPT0gXCI9XCIpIHsgdGhpcy5yYWlzZShub2RlLmxlZnQuZW5kLCBcIk9ubHkgJz0nIG9wZXJhdG9yIGNhbiBiZSB1c2VkIGZvciBzcGVjaWZ5aW5nIGRlZmF1bHQgdmFsdWUuXCIpOyB9XG4gICAgICBub2RlLnR5cGUgPSBcIkFzc2lnbm1lbnRQYXR0ZXJuXCI7XG4gICAgICBkZWxldGUgbm9kZS5vcGVyYXRvcjtcbiAgICAgIHRoaXMudG9Bc3NpZ25hYmxlKG5vZGUubGVmdCwgaXNCaW5kaW5nKTtcbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlIFwiUGFyZW50aGVzaXplZEV4cHJlc3Npb25cIjpcbiAgICAgIHRoaXMudG9Bc3NpZ25hYmxlKG5vZGUuZXhwcmVzc2lvbiwgaXNCaW5kaW5nLCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKTtcbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlIFwiQ2hhaW5FeHByZXNzaW9uXCI6XG4gICAgICB0aGlzLnJhaXNlUmVjb3ZlcmFibGUobm9kZS5zdGFydCwgXCJPcHRpb25hbCBjaGFpbmluZyBjYW5ub3QgYXBwZWFyIGluIGxlZnQtaGFuZCBzaWRlXCIpO1xuICAgICAgYnJlYWtcblxuICAgIGNhc2UgXCJNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICBpZiAoIWlzQmluZGluZykgeyBicmVhayB9XG5cbiAgICBkZWZhdWx0OlxuICAgICAgdGhpcy5yYWlzZShub2RlLnN0YXJ0LCBcIkFzc2lnbmluZyB0byBydmFsdWVcIik7XG4gICAgfVxuICB9IGVsc2UgaWYgKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpIHsgdGhpcy5jaGVja1BhdHRlcm5FcnJvcnMocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycywgdHJ1ZSk7IH1cbiAgcmV0dXJuIG5vZGVcbn07XG5cbi8vIENvbnZlcnQgbGlzdCBvZiBleHByZXNzaW9uIGF0b21zIHRvIGJpbmRpbmcgbGlzdC5cblxucHAkNy50b0Fzc2lnbmFibGVMaXN0ID0gZnVuY3Rpb24oZXhwckxpc3QsIGlzQmluZGluZykge1xuICB2YXIgZW5kID0gZXhwckxpc3QubGVuZ3RoO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgdmFyIGVsdCA9IGV4cHJMaXN0W2ldO1xuICAgIGlmIChlbHQpIHsgdGhpcy50b0Fzc2lnbmFibGUoZWx0LCBpc0JpbmRpbmcpOyB9XG4gIH1cbiAgaWYgKGVuZCkge1xuICAgIHZhciBsYXN0ID0gZXhwckxpc3RbZW5kIC0gMV07XG4gICAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA9PT0gNiAmJiBpc0JpbmRpbmcgJiYgbGFzdCAmJiBsYXN0LnR5cGUgPT09IFwiUmVzdEVsZW1lbnRcIiAmJiBsYXN0LmFyZ3VtZW50LnR5cGUgIT09IFwiSWRlbnRpZmllclwiKVxuICAgICAgeyB0aGlzLnVuZXhwZWN0ZWQobGFzdC5hcmd1bWVudC5zdGFydCk7IH1cbiAgfVxuICByZXR1cm4gZXhwckxpc3Rcbn07XG5cbi8vIFBhcnNlcyBzcHJlYWQgZWxlbWVudC5cblxucHAkNy5wYXJzZVNwcmVhZCA9IGZ1bmN0aW9uKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpIHtcbiAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICB0aGlzLm5leHQoKTtcbiAgbm9kZS5hcmd1bWVudCA9IHRoaXMucGFyc2VNYXliZUFzc2lnbihmYWxzZSwgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycyk7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJTcHJlYWRFbGVtZW50XCIpXG59O1xuXG5wcCQ3LnBhcnNlUmVzdEJpbmRpbmcgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICB0aGlzLm5leHQoKTtcblxuICAvLyBSZXN0RWxlbWVudCBpbnNpZGUgb2YgYSBmdW5jdGlvbiBwYXJhbWV0ZXIgbXVzdCBiZSBhbiBpZGVudGlmaWVyXG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPT09IDYgJiYgdGhpcy50eXBlICE9PSB0eXBlcyQxLm5hbWUpXG4gICAgeyB0aGlzLnVuZXhwZWN0ZWQoKTsgfVxuXG4gIG5vZGUuYXJndW1lbnQgPSB0aGlzLnBhcnNlQmluZGluZ0F0b20oKTtcblxuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiUmVzdEVsZW1lbnRcIilcbn07XG5cbi8vIFBhcnNlcyBsdmFsdWUgKGFzc2lnbmFibGUpIGF0b20uXG5cbnBwJDcucGFyc2VCaW5kaW5nQXRvbSA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDYpIHtcbiAgICBzd2l0Y2ggKHRoaXMudHlwZSkge1xuICAgIGNhc2UgdHlwZXMkMS5icmFja2V0TDpcbiAgICAgIHZhciBub2RlID0gdGhpcy5zdGFydE5vZGUoKTtcbiAgICAgIHRoaXMubmV4dCgpO1xuICAgICAgbm9kZS5lbGVtZW50cyA9IHRoaXMucGFyc2VCaW5kaW5nTGlzdCh0eXBlcyQxLmJyYWNrZXRSLCB0cnVlLCB0cnVlKTtcbiAgICAgIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJBcnJheVBhdHRlcm5cIilcblxuICAgIGNhc2UgdHlwZXMkMS5icmFjZUw6XG4gICAgICByZXR1cm4gdGhpcy5wYXJzZU9iaih0cnVlKVxuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpcy5wYXJzZUlkZW50KClcbn07XG5cbnBwJDcucGFyc2VCaW5kaW5nTGlzdCA9IGZ1bmN0aW9uKGNsb3NlLCBhbGxvd0VtcHR5LCBhbGxvd1RyYWlsaW5nQ29tbWEsIGFsbG93TW9kaWZpZXJzKSB7XG4gIHZhciBlbHRzID0gW10sIGZpcnN0ID0gdHJ1ZTtcbiAgd2hpbGUgKCF0aGlzLmVhdChjbG9zZSkpIHtcbiAgICBpZiAoZmlyc3QpIHsgZmlyc3QgPSBmYWxzZTsgfVxuICAgIGVsc2UgeyB0aGlzLmV4cGVjdCh0eXBlcyQxLmNvbW1hKTsgfVxuICAgIGlmIChhbGxvd0VtcHR5ICYmIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5jb21tYSkge1xuICAgICAgZWx0cy5wdXNoKG51bGwpO1xuICAgIH0gZWxzZSBpZiAoYWxsb3dUcmFpbGluZ0NvbW1hICYmIHRoaXMuYWZ0ZXJUcmFpbGluZ0NvbW1hKGNsb3NlKSkge1xuICAgICAgYnJlYWtcbiAgICB9IGVsc2UgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5lbGxpcHNpcykge1xuICAgICAgdmFyIHJlc3QgPSB0aGlzLnBhcnNlUmVzdEJpbmRpbmcoKTtcbiAgICAgIHRoaXMucGFyc2VCaW5kaW5nTGlzdEl0ZW0ocmVzdCk7XG4gICAgICBlbHRzLnB1c2gocmVzdCk7XG4gICAgICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLmNvbW1hKSB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZSh0aGlzLnN0YXJ0LCBcIkNvbW1hIGlzIG5vdCBwZXJtaXR0ZWQgYWZ0ZXIgdGhlIHJlc3QgZWxlbWVudFwiKTsgfVxuICAgICAgdGhpcy5leHBlY3QoY2xvc2UpO1xuICAgICAgYnJlYWtcbiAgICB9IGVsc2Uge1xuICAgICAgZWx0cy5wdXNoKHRoaXMucGFyc2VBc3NpZ25hYmxlTGlzdEl0ZW0oYWxsb3dNb2RpZmllcnMpKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGVsdHNcbn07XG5cbnBwJDcucGFyc2VBc3NpZ25hYmxlTGlzdEl0ZW0gPSBmdW5jdGlvbihhbGxvd01vZGlmaWVycykge1xuICB2YXIgZWxlbSA9IHRoaXMucGFyc2VNYXliZURlZmF1bHQodGhpcy5zdGFydCwgdGhpcy5zdGFydExvYyk7XG4gIHRoaXMucGFyc2VCaW5kaW5nTGlzdEl0ZW0oZWxlbSk7XG4gIHJldHVybiBlbGVtXG59O1xuXG5wcCQ3LnBhcnNlQmluZGluZ0xpc3RJdGVtID0gZnVuY3Rpb24ocGFyYW0pIHtcbiAgcmV0dXJuIHBhcmFtXG59O1xuXG4vLyBQYXJzZXMgYXNzaWdubWVudCBwYXR0ZXJuIGFyb3VuZCBnaXZlbiBhdG9tIGlmIHBvc3NpYmxlLlxuXG5wcCQ3LnBhcnNlTWF5YmVEZWZhdWx0ID0gZnVuY3Rpb24oc3RhcnRQb3MsIHN0YXJ0TG9jLCBsZWZ0KSB7XG4gIGxlZnQgPSBsZWZ0IHx8IHRoaXMucGFyc2VCaW5kaW5nQXRvbSgpO1xuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uIDwgNiB8fCAhdGhpcy5lYXQodHlwZXMkMS5lcSkpIHsgcmV0dXJuIGxlZnQgfVxuICB2YXIgbm9kZSA9IHRoaXMuc3RhcnROb2RlQXQoc3RhcnRQb3MsIHN0YXJ0TG9jKTtcbiAgbm9kZS5sZWZ0ID0gbGVmdDtcbiAgbm9kZS5yaWdodCA9IHRoaXMucGFyc2VNYXliZUFzc2lnbigpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiQXNzaWdubWVudFBhdHRlcm5cIilcbn07XG5cbi8vIFRoZSBmb2xsb3dpbmcgdGhyZWUgZnVuY3Rpb25zIGFsbCB2ZXJpZnkgdGhhdCBhIG5vZGUgaXMgYW4gbHZhbHVlIFx1MjAxNFxuLy8gc29tZXRoaW5nIHRoYXQgY2FuIGJlIGJvdW5kLCBvciBhc3NpZ25lZCB0by4gSW4gb3JkZXIgdG8gZG8gc28sIHRoZXkgcGVyZm9ybVxuLy8gYSB2YXJpZXR5IG9mIGNoZWNrczpcbi8vXG4vLyAtIENoZWNrIHRoYXQgbm9uZSBvZiB0aGUgYm91bmQvYXNzaWduZWQtdG8gaWRlbnRpZmllcnMgYXJlIHJlc2VydmVkIHdvcmRzLlxuLy8gLSBSZWNvcmQgbmFtZSBkZWNsYXJhdGlvbnMgZm9yIGJpbmRpbmdzIGluIHRoZSBhcHByb3ByaWF0ZSBzY29wZS5cbi8vIC0gQ2hlY2sgZHVwbGljYXRlIGFyZ3VtZW50IG5hbWVzLCBpZiBjaGVja0NsYXNoZXMgaXMgc2V0LlxuLy9cbi8vIElmIGEgY29tcGxleCBiaW5kaW5nIHBhdHRlcm4gaXMgZW5jb3VudGVyZWQgKGUuZy4sIG9iamVjdCBhbmQgYXJyYXlcbi8vIGRlc3RydWN0dXJpbmcpLCB0aGUgZW50aXJlIHBhdHRlcm4gaXMgcmVjdXJzaXZlbHkgY2hlY2tlZC5cbi8vXG4vLyBUaGVyZSBhcmUgdGhyZWUgdmVyc2lvbnMgb2YgY2hlY2tMVmFsKigpIGFwcHJvcHJpYXRlIGZvciBkaWZmZXJlbnRcbi8vIGNpcmN1bXN0YW5jZXM6XG4vL1xuLy8gLSBjaGVja0xWYWxTaW1wbGUoKSBzaGFsbCBiZSB1c2VkIGlmIHRoZSBzeW50YWN0aWMgY29uc3RydWN0IHN1cHBvcnRzXG4vLyAgIG5vdGhpbmcgb3RoZXIgdGhhbiBpZGVudGlmaWVycyBhbmQgbWVtYmVyIGV4cHJlc3Npb25zLiBQYXJlbnRoZXNpemVkXG4vLyAgIGV4cHJlc3Npb25zIGFyZSBhbHNvIGNvcnJlY3RseSBoYW5kbGVkLiBUaGlzIGlzIGdlbmVyYWxseSBhcHByb3ByaWF0ZSBmb3Jcbi8vICAgY29uc3RydWN0cyBmb3Igd2hpY2ggdGhlIHNwZWMgc2F5c1xuLy9cbi8vICAgPiBJdCBpcyBhIFN5bnRheCBFcnJvciBpZiBBc3NpZ25tZW50VGFyZ2V0VHlwZSBvZiBbdGhlIHByb2R1Y3Rpb25dIGlzIG5vdFxuLy8gICA+IHNpbXBsZS5cbi8vXG4vLyAgIEl0IGlzIGFsc28gYXBwcm9wcmlhdGUgZm9yIGNoZWNraW5nIGlmIGFuIGlkZW50aWZpZXIgaXMgdmFsaWQgYW5kIG5vdFxuLy8gICBkZWZpbmVkIGVsc2V3aGVyZSwgbGlrZSBpbXBvcnQgZGVjbGFyYXRpb25zIG9yIGZ1bmN0aW9uL2NsYXNzIGlkZW50aWZpZXJzLlxuLy9cbi8vICAgRXhhbXBsZXMgd2hlcmUgdGhpcyBpcyB1c2VkIGluY2x1ZGU6XG4vLyAgICAgYSArPSBcdTIwMjY7XG4vLyAgICAgaW1wb3J0IGEgZnJvbSAnXHUyMDI2Jztcbi8vICAgd2hlcmUgYSBpcyB0aGUgbm9kZSB0byBiZSBjaGVja2VkLlxuLy9cbi8vIC0gY2hlY2tMVmFsUGF0dGVybigpIHNoYWxsIGJlIHVzZWQgaWYgdGhlIHN5bnRhY3RpYyBjb25zdHJ1Y3Qgc3VwcG9ydHNcbi8vICAgYW55dGhpbmcgY2hlY2tMVmFsU2ltcGxlKCkgc3VwcG9ydHMsIGFzIHdlbGwgYXMgb2JqZWN0IGFuZCBhcnJheVxuLy8gICBkZXN0cnVjdHVyaW5nIHBhdHRlcm5zLiBUaGlzIGlzIGdlbmVyYWxseSBhcHByb3ByaWF0ZSBmb3IgY29uc3RydWN0cyBmb3Jcbi8vICAgd2hpY2ggdGhlIHNwZWMgc2F5c1xuLy9cbi8vICAgPiBJdCBpcyBhIFN5bnRheCBFcnJvciBpZiBbdGhlIHByb2R1Y3Rpb25dIGlzIG5laXRoZXIgYW4gT2JqZWN0TGl0ZXJhbCBub3Jcbi8vICAgPiBhbiBBcnJheUxpdGVyYWwgYW5kIEFzc2lnbm1lbnRUYXJnZXRUeXBlIG9mIFt0aGUgcHJvZHVjdGlvbl0gaXMgbm90XG4vLyAgID4gc2ltcGxlLlxuLy9cbi8vICAgRXhhbXBsZXMgd2hlcmUgdGhpcyBpcyB1c2VkIGluY2x1ZGU6XG4vLyAgICAgKGEgPSBcdTIwMjYpO1xuLy8gICAgIGNvbnN0IGEgPSBcdTIwMjY7XG4vLyAgICAgdHJ5IHsgXHUyMDI2IH0gY2F0Y2ggKGEpIHsgXHUyMDI2IH1cbi8vICAgd2hlcmUgYSBpcyB0aGUgbm9kZSB0byBiZSBjaGVja2VkLlxuLy9cbi8vIC0gY2hlY2tMVmFsSW5uZXJQYXR0ZXJuKCkgc2hhbGwgYmUgdXNlZCBpZiB0aGUgc3ludGFjdGljIGNvbnN0cnVjdCBzdXBwb3J0c1xuLy8gICBhbnl0aGluZyBjaGVja0xWYWxQYXR0ZXJuKCkgc3VwcG9ydHMsIGFzIHdlbGwgYXMgZGVmYXVsdCBhc3NpZ25tZW50XG4vLyAgIHBhdHRlcm5zLCByZXN0IGVsZW1lbnRzLCBhbmQgb3RoZXIgY29uc3RydWN0cyB0aGF0IG1heSBhcHBlYXIgd2l0aGluIGFuXG4vLyAgIG9iamVjdCBvciBhcnJheSBkZXN0cnVjdHVyaW5nIHBhdHRlcm4uXG4vL1xuLy8gICBBcyBhIHNwZWNpYWwgY2FzZSwgZnVuY3Rpb24gcGFyYW1ldGVycyBhbHNvIHVzZSBjaGVja0xWYWxJbm5lclBhdHRlcm4oKSxcbi8vICAgYXMgdGhleSBhbHNvIHN1cHBvcnQgZGVmYXVsdHMgYW5kIHJlc3QgY29uc3RydWN0cy5cbi8vXG4vLyBUaGVzZSBmdW5jdGlvbnMgZGVsaWJlcmF0ZWx5IHN1cHBvcnQgYm90aCBhc3NpZ25tZW50IGFuZCBiaW5kaW5nIGNvbnN0cnVjdHMsXG4vLyBhcyB0aGUgbG9naWMgZm9yIGJvdGggaXMgZXhjZWVkaW5nbHkgc2ltaWxhci4gSWYgdGhlIG5vZGUgaXMgdGhlIHRhcmdldCBvZlxuLy8gYW4gYXNzaWdubWVudCwgdGhlbiBiaW5kaW5nVHlwZSBzaG91bGQgYmUgc2V0IHRvIEJJTkRfTk9ORS4gT3RoZXJ3aXNlLCBpdFxuLy8gc2hvdWxkIGJlIHNldCB0byB0aGUgYXBwcm9wcmlhdGUgQklORF8qIGNvbnN0YW50LCBsaWtlIEJJTkRfVkFSIG9yXG4vLyBCSU5EX0xFWElDQUwuXG4vL1xuLy8gSWYgdGhlIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aXRoIGEgbm9uLUJJTkRfTk9ORSBiaW5kaW5nVHlwZSwgdGhlblxuLy8gYWRkaXRpb25hbGx5IGEgY2hlY2tDbGFzaGVzIG9iamVjdCBtYXkgYmUgc3BlY2lmaWVkIHRvIGFsbG93IGNoZWNraW5nIGZvclxuLy8gZHVwbGljYXRlIGFyZ3VtZW50IG5hbWVzLiBjaGVja0NsYXNoZXMgaXMgaWdub3JlZCBpZiB0aGUgcHJvdmlkZWQgY29uc3RydWN0XG4vLyBpcyBhbiBhc3NpZ25tZW50IChpLmUuLCBiaW5kaW5nVHlwZSBpcyBCSU5EX05PTkUpLlxuXG5wcCQ3LmNoZWNrTFZhbFNpbXBsZSA9IGZ1bmN0aW9uKGV4cHIsIGJpbmRpbmdUeXBlLCBjaGVja0NsYXNoZXMpIHtcbiAgaWYgKCBiaW5kaW5nVHlwZSA9PT0gdm9pZCAwICkgYmluZGluZ1R5cGUgPSBCSU5EX05PTkU7XG5cbiAgdmFyIGlzQmluZCA9IGJpbmRpbmdUeXBlICE9PSBCSU5EX05PTkU7XG5cbiAgc3dpdGNoIChleHByLnR5cGUpIHtcbiAgY2FzZSBcIklkZW50aWZpZXJcIjpcbiAgICBpZiAodGhpcy5zdHJpY3QgJiYgdGhpcy5yZXNlcnZlZFdvcmRzU3RyaWN0QmluZC50ZXN0KGV4cHIubmFtZSkpXG4gICAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShleHByLnN0YXJ0LCAoaXNCaW5kID8gXCJCaW5kaW5nIFwiIDogXCJBc3NpZ25pbmcgdG8gXCIpICsgZXhwci5uYW1lICsgXCIgaW4gc3RyaWN0IG1vZGVcIik7IH1cbiAgICBpZiAoaXNCaW5kKSB7XG4gICAgICBpZiAoYmluZGluZ1R5cGUgPT09IEJJTkRfTEVYSUNBTCAmJiBleHByLm5hbWUgPT09IFwibGV0XCIpXG4gICAgICAgIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKGV4cHIuc3RhcnQsIFwibGV0IGlzIGRpc2FsbG93ZWQgYXMgYSBsZXhpY2FsbHkgYm91bmQgbmFtZVwiKTsgfVxuICAgICAgaWYgKGNoZWNrQ2xhc2hlcykge1xuICAgICAgICBpZiAoaGFzT3duKGNoZWNrQ2xhc2hlcywgZXhwci5uYW1lKSlcbiAgICAgICAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShleHByLnN0YXJ0LCBcIkFyZ3VtZW50IG5hbWUgY2xhc2hcIik7IH1cbiAgICAgICAgY2hlY2tDbGFzaGVzW2V4cHIubmFtZV0gPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKGJpbmRpbmdUeXBlICE9PSBCSU5EX09VVFNJREUpIHsgdGhpcy5kZWNsYXJlTmFtZShleHByLm5hbWUsIGJpbmRpbmdUeXBlLCBleHByLnN0YXJ0KTsgfVxuICAgIH1cbiAgICBicmVha1xuXG4gIGNhc2UgXCJDaGFpbkV4cHJlc3Npb25cIjpcbiAgICB0aGlzLnJhaXNlUmVjb3ZlcmFibGUoZXhwci5zdGFydCwgXCJPcHRpb25hbCBjaGFpbmluZyBjYW5ub3QgYXBwZWFyIGluIGxlZnQtaGFuZCBzaWRlXCIpO1xuICAgIGJyZWFrXG5cbiAgY2FzZSBcIk1lbWJlckV4cHJlc3Npb25cIjpcbiAgICBpZiAoaXNCaW5kKSB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShleHByLnN0YXJ0LCBcIkJpbmRpbmcgbWVtYmVyIGV4cHJlc3Npb25cIik7IH1cbiAgICBicmVha1xuXG4gIGNhc2UgXCJQYXJlbnRoZXNpemVkRXhwcmVzc2lvblwiOlxuICAgIGlmIChpc0JpbmQpIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKGV4cHIuc3RhcnQsIFwiQmluZGluZyBwYXJlbnRoZXNpemVkIGV4cHJlc3Npb25cIik7IH1cbiAgICByZXR1cm4gdGhpcy5jaGVja0xWYWxTaW1wbGUoZXhwci5leHByZXNzaW9uLCBiaW5kaW5nVHlwZSwgY2hlY2tDbGFzaGVzKVxuXG4gIGRlZmF1bHQ6XG4gICAgdGhpcy5yYWlzZShleHByLnN0YXJ0LCAoaXNCaW5kID8gXCJCaW5kaW5nXCIgOiBcIkFzc2lnbmluZyB0b1wiKSArIFwiIHJ2YWx1ZVwiKTtcbiAgfVxufTtcblxucHAkNy5jaGVja0xWYWxQYXR0ZXJuID0gZnVuY3Rpb24oZXhwciwgYmluZGluZ1R5cGUsIGNoZWNrQ2xhc2hlcykge1xuICBpZiAoIGJpbmRpbmdUeXBlID09PSB2b2lkIDAgKSBiaW5kaW5nVHlwZSA9IEJJTkRfTk9ORTtcblxuICBzd2l0Y2ggKGV4cHIudHlwZSkge1xuICBjYXNlIFwiT2JqZWN0UGF0dGVyblwiOlxuICAgIGZvciAodmFyIGkgPSAwLCBsaXN0ID0gZXhwci5wcm9wZXJ0aWVzOyBpIDwgbGlzdC5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgdmFyIHByb3AgPSBsaXN0W2ldO1xuXG4gICAgdGhpcy5jaGVja0xWYWxJbm5lclBhdHRlcm4ocHJvcCwgYmluZGluZ1R5cGUsIGNoZWNrQ2xhc2hlcyk7XG4gICAgfVxuICAgIGJyZWFrXG5cbiAgY2FzZSBcIkFycmF5UGF0dGVyblwiOlxuICAgIGZvciAodmFyIGkkMSA9IDAsIGxpc3QkMSA9IGV4cHIuZWxlbWVudHM7IGkkMSA8IGxpc3QkMS5sZW5ndGg7IGkkMSArPSAxKSB7XG4gICAgICB2YXIgZWxlbSA9IGxpc3QkMVtpJDFdO1xuXG4gICAgaWYgKGVsZW0pIHsgdGhpcy5jaGVja0xWYWxJbm5lclBhdHRlcm4oZWxlbSwgYmluZGluZ1R5cGUsIGNoZWNrQ2xhc2hlcyk7IH1cbiAgICB9XG4gICAgYnJlYWtcblxuICBkZWZhdWx0OlxuICAgIHRoaXMuY2hlY2tMVmFsU2ltcGxlKGV4cHIsIGJpbmRpbmdUeXBlLCBjaGVja0NsYXNoZXMpO1xuICB9XG59O1xuXG5wcCQ3LmNoZWNrTFZhbElubmVyUGF0dGVybiA9IGZ1bmN0aW9uKGV4cHIsIGJpbmRpbmdUeXBlLCBjaGVja0NsYXNoZXMpIHtcbiAgaWYgKCBiaW5kaW5nVHlwZSA9PT0gdm9pZCAwICkgYmluZGluZ1R5cGUgPSBCSU5EX05PTkU7XG5cbiAgc3dpdGNoIChleHByLnR5cGUpIHtcbiAgY2FzZSBcIlByb3BlcnR5XCI6XG4gICAgLy8gQXNzaWdubWVudFByb3BlcnR5IGhhcyB0eXBlID09PSBcIlByb3BlcnR5XCJcbiAgICB0aGlzLmNoZWNrTFZhbElubmVyUGF0dGVybihleHByLnZhbHVlLCBiaW5kaW5nVHlwZSwgY2hlY2tDbGFzaGVzKTtcbiAgICBicmVha1xuXG4gIGNhc2UgXCJBc3NpZ25tZW50UGF0dGVyblwiOlxuICAgIHRoaXMuY2hlY2tMVmFsUGF0dGVybihleHByLmxlZnQsIGJpbmRpbmdUeXBlLCBjaGVja0NsYXNoZXMpO1xuICAgIGJyZWFrXG5cbiAgY2FzZSBcIlJlc3RFbGVtZW50XCI6XG4gICAgdGhpcy5jaGVja0xWYWxQYXR0ZXJuKGV4cHIuYXJndW1lbnQsIGJpbmRpbmdUeXBlLCBjaGVja0NsYXNoZXMpO1xuICAgIGJyZWFrXG5cbiAgZGVmYXVsdDpcbiAgICB0aGlzLmNoZWNrTFZhbFBhdHRlcm4oZXhwciwgYmluZGluZ1R5cGUsIGNoZWNrQ2xhc2hlcyk7XG4gIH1cbn07XG5cbi8vIFRoZSBhbGdvcml0aG0gdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBhIHJlZ2V4cCBjYW4gYXBwZWFyIGF0IGFcbi8vIGdpdmVuIHBvaW50IGluIHRoZSBwcm9ncmFtIGlzIGxvb3NlbHkgYmFzZWQgb24gc3dlZXQuanMnIGFwcHJvYWNoLlxuLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tb3ppbGxhL3N3ZWV0LmpzL3dpa2kvZGVzaWduXG5cblxudmFyIFRva0NvbnRleHQgPSBmdW5jdGlvbiBUb2tDb250ZXh0KHRva2VuLCBpc0V4cHIsIHByZXNlcnZlU3BhY2UsIG92ZXJyaWRlLCBnZW5lcmF0b3IpIHtcbiAgdGhpcy50b2tlbiA9IHRva2VuO1xuICB0aGlzLmlzRXhwciA9ICEhaXNFeHByO1xuICB0aGlzLnByZXNlcnZlU3BhY2UgPSAhIXByZXNlcnZlU3BhY2U7XG4gIHRoaXMub3ZlcnJpZGUgPSBvdmVycmlkZTtcbiAgdGhpcy5nZW5lcmF0b3IgPSAhIWdlbmVyYXRvcjtcbn07XG5cbnZhciB0eXBlcyA9IHtcbiAgYl9zdGF0OiBuZXcgVG9rQ29udGV4dChcIntcIiwgZmFsc2UpLFxuICBiX2V4cHI6IG5ldyBUb2tDb250ZXh0KFwie1wiLCB0cnVlKSxcbiAgYl90bXBsOiBuZXcgVG9rQ29udGV4dChcIiR7XCIsIGZhbHNlKSxcbiAgcF9zdGF0OiBuZXcgVG9rQ29udGV4dChcIihcIiwgZmFsc2UpLFxuICBwX2V4cHI6IG5ldyBUb2tDb250ZXh0KFwiKFwiLCB0cnVlKSxcbiAgcV90bXBsOiBuZXcgVG9rQ29udGV4dChcImBcIiwgdHJ1ZSwgdHJ1ZSwgZnVuY3Rpb24gKHApIHsgcmV0dXJuIHAudHJ5UmVhZFRlbXBsYXRlVG9rZW4oKTsgfSksXG4gIGZfc3RhdDogbmV3IFRva0NvbnRleHQoXCJmdW5jdGlvblwiLCBmYWxzZSksXG4gIGZfZXhwcjogbmV3IFRva0NvbnRleHQoXCJmdW5jdGlvblwiLCB0cnVlKSxcbiAgZl9leHByX2dlbjogbmV3IFRva0NvbnRleHQoXCJmdW5jdGlvblwiLCB0cnVlLCBmYWxzZSwgbnVsbCwgdHJ1ZSksXG4gIGZfZ2VuOiBuZXcgVG9rQ29udGV4dChcImZ1bmN0aW9uXCIsIGZhbHNlLCBmYWxzZSwgbnVsbCwgdHJ1ZSlcbn07XG5cbnZhciBwcCQ2ID0gUGFyc2VyLnByb3RvdHlwZTtcblxucHAkNi5pbml0aWFsQ29udGV4dCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gW3R5cGVzLmJfc3RhdF1cbn07XG5cbnBwJDYuY3VyQ29udGV4dCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5jb250ZXh0W3RoaXMuY29udGV4dC5sZW5ndGggLSAxXVxufTtcblxucHAkNi5icmFjZUlzQmxvY2sgPSBmdW5jdGlvbihwcmV2VHlwZSkge1xuICB2YXIgcGFyZW50ID0gdGhpcy5jdXJDb250ZXh0KCk7XG4gIGlmIChwYXJlbnQgPT09IHR5cGVzLmZfZXhwciB8fCBwYXJlbnQgPT09IHR5cGVzLmZfc3RhdClcbiAgICB7IHJldHVybiB0cnVlIH1cbiAgaWYgKHByZXZUeXBlID09PSB0eXBlcyQxLmNvbG9uICYmIChwYXJlbnQgPT09IHR5cGVzLmJfc3RhdCB8fCBwYXJlbnQgPT09IHR5cGVzLmJfZXhwcikpXG4gICAgeyByZXR1cm4gIXBhcmVudC5pc0V4cHIgfVxuXG4gIC8vIFRoZSBjaGVjayBmb3IgYHR0Lm5hbWUgJiYgZXhwckFsbG93ZWRgIGRldGVjdHMgd2hldGhlciB3ZSBhcmVcbiAgLy8gYWZ0ZXIgYSBgeWllbGRgIG9yIGBvZmAgY29uc3RydWN0LiBTZWUgdGhlIGB1cGRhdGVDb250ZXh0YCBmb3JcbiAgLy8gYHR0Lm5hbWVgLlxuICBpZiAocHJldlR5cGUgPT09IHR5cGVzJDEuX3JldHVybiB8fCBwcmV2VHlwZSA9PT0gdHlwZXMkMS5uYW1lICYmIHRoaXMuZXhwckFsbG93ZWQpXG4gICAgeyByZXR1cm4gbGluZUJyZWFrLnRlc3QodGhpcy5pbnB1dC5zbGljZSh0aGlzLmxhc3RUb2tFbmQsIHRoaXMuc3RhcnQpKSB9XG4gIGlmIChwcmV2VHlwZSA9PT0gdHlwZXMkMS5fZWxzZSB8fCBwcmV2VHlwZSA9PT0gdHlwZXMkMS5zZW1pIHx8IHByZXZUeXBlID09PSB0eXBlcyQxLmVvZiB8fCBwcmV2VHlwZSA9PT0gdHlwZXMkMS5wYXJlblIgfHwgcHJldlR5cGUgPT09IHR5cGVzJDEuYXJyb3cpXG4gICAgeyByZXR1cm4gdHJ1ZSB9XG4gIGlmIChwcmV2VHlwZSA9PT0gdHlwZXMkMS5icmFjZUwpXG4gICAgeyByZXR1cm4gcGFyZW50ID09PSB0eXBlcy5iX3N0YXQgfVxuICBpZiAocHJldlR5cGUgPT09IHR5cGVzJDEuX3ZhciB8fCBwcmV2VHlwZSA9PT0gdHlwZXMkMS5fY29uc3QgfHwgcHJldlR5cGUgPT09IHR5cGVzJDEubmFtZSlcbiAgICB7IHJldHVybiBmYWxzZSB9XG4gIHJldHVybiAhdGhpcy5leHByQWxsb3dlZFxufTtcblxucHAkNi5pbkdlbmVyYXRvckNvbnRleHQgPSBmdW5jdGlvbigpIHtcbiAgZm9yICh2YXIgaSA9IHRoaXMuY29udGV4dC5sZW5ndGggLSAxOyBpID49IDE7IGktLSkge1xuICAgIHZhciBjb250ZXh0ID0gdGhpcy5jb250ZXh0W2ldO1xuICAgIGlmIChjb250ZXh0LnRva2VuID09PSBcImZ1bmN0aW9uXCIpXG4gICAgICB7IHJldHVybiBjb250ZXh0LmdlbmVyYXRvciB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG5wcCQ2LnVwZGF0ZUNvbnRleHQgPSBmdW5jdGlvbihwcmV2VHlwZSkge1xuICB2YXIgdXBkYXRlLCB0eXBlID0gdGhpcy50eXBlO1xuICBpZiAodHlwZS5rZXl3b3JkICYmIHByZXZUeXBlID09PSB0eXBlcyQxLmRvdClcbiAgICB7IHRoaXMuZXhwckFsbG93ZWQgPSBmYWxzZTsgfVxuICBlbHNlIGlmICh1cGRhdGUgPSB0eXBlLnVwZGF0ZUNvbnRleHQpXG4gICAgeyB1cGRhdGUuY2FsbCh0aGlzLCBwcmV2VHlwZSk7IH1cbiAgZWxzZVxuICAgIHsgdGhpcy5leHByQWxsb3dlZCA9IHR5cGUuYmVmb3JlRXhwcjsgfVxufTtcblxuLy8gVXNlZCB0byBoYW5kbGUgZWRnZSBjYXNlcyB3aGVuIHRva2VuIGNvbnRleHQgY291bGQgbm90IGJlIGluZmVycmVkIGNvcnJlY3RseSBkdXJpbmcgdG9rZW5pemF0aW9uIHBoYXNlXG5cbnBwJDYub3ZlcnJpZGVDb250ZXh0ID0gZnVuY3Rpb24odG9rZW5DdHgpIHtcbiAgaWYgKHRoaXMuY3VyQ29udGV4dCgpICE9PSB0b2tlbkN0eCkge1xuICAgIHRoaXMuY29udGV4dFt0aGlzLmNvbnRleHQubGVuZ3RoIC0gMV0gPSB0b2tlbkN0eDtcbiAgfVxufTtcblxuLy8gVG9rZW4tc3BlY2lmaWMgY29udGV4dCB1cGRhdGUgY29kZVxuXG50eXBlcyQxLnBhcmVuUi51cGRhdGVDb250ZXh0ID0gdHlwZXMkMS5icmFjZVIudXBkYXRlQ29udGV4dCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5jb250ZXh0Lmxlbmd0aCA9PT0gMSkge1xuICAgIHRoaXMuZXhwckFsbG93ZWQgPSB0cnVlO1xuICAgIHJldHVyblxuICB9XG4gIHZhciBvdXQgPSB0aGlzLmNvbnRleHQucG9wKCk7XG4gIGlmIChvdXQgPT09IHR5cGVzLmJfc3RhdCAmJiB0aGlzLmN1ckNvbnRleHQoKS50b2tlbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgb3V0ID0gdGhpcy5jb250ZXh0LnBvcCgpO1xuICB9XG4gIHRoaXMuZXhwckFsbG93ZWQgPSAhb3V0LmlzRXhwcjtcbn07XG5cbnR5cGVzJDEuYnJhY2VMLnVwZGF0ZUNvbnRleHQgPSBmdW5jdGlvbihwcmV2VHlwZSkge1xuICB0aGlzLmNvbnRleHQucHVzaCh0aGlzLmJyYWNlSXNCbG9jayhwcmV2VHlwZSkgPyB0eXBlcy5iX3N0YXQgOiB0eXBlcy5iX2V4cHIpO1xuICB0aGlzLmV4cHJBbGxvd2VkID0gdHJ1ZTtcbn07XG5cbnR5cGVzJDEuZG9sbGFyQnJhY2VMLnVwZGF0ZUNvbnRleHQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5jb250ZXh0LnB1c2godHlwZXMuYl90bXBsKTtcbiAgdGhpcy5leHByQWxsb3dlZCA9IHRydWU7XG59O1xuXG50eXBlcyQxLnBhcmVuTC51cGRhdGVDb250ZXh0ID0gZnVuY3Rpb24ocHJldlR5cGUpIHtcbiAgdmFyIHN0YXRlbWVudFBhcmVucyA9IHByZXZUeXBlID09PSB0eXBlcyQxLl9pZiB8fCBwcmV2VHlwZSA9PT0gdHlwZXMkMS5fZm9yIHx8IHByZXZUeXBlID09PSB0eXBlcyQxLl93aXRoIHx8IHByZXZUeXBlID09PSB0eXBlcyQxLl93aGlsZTtcbiAgdGhpcy5jb250ZXh0LnB1c2goc3RhdGVtZW50UGFyZW5zID8gdHlwZXMucF9zdGF0IDogdHlwZXMucF9leHByKTtcbiAgdGhpcy5leHByQWxsb3dlZCA9IHRydWU7XG59O1xuXG50eXBlcyQxLmluY0RlYy51cGRhdGVDb250ZXh0ID0gZnVuY3Rpb24oKSB7XG4gIC8vIHRva0V4cHJBbGxvd2VkIHN0YXlzIHVuY2hhbmdlZFxufTtcblxudHlwZXMkMS5fZnVuY3Rpb24udXBkYXRlQ29udGV4dCA9IHR5cGVzJDEuX2NsYXNzLnVwZGF0ZUNvbnRleHQgPSBmdW5jdGlvbihwcmV2VHlwZSkge1xuICBpZiAocHJldlR5cGUuYmVmb3JlRXhwciAmJiBwcmV2VHlwZSAhPT0gdHlwZXMkMS5fZWxzZSAmJlxuICAgICAgIShwcmV2VHlwZSA9PT0gdHlwZXMkMS5zZW1pICYmIHRoaXMuY3VyQ29udGV4dCgpICE9PSB0eXBlcy5wX3N0YXQpICYmXG4gICAgICAhKHByZXZUeXBlID09PSB0eXBlcyQxLl9yZXR1cm4gJiYgbGluZUJyZWFrLnRlc3QodGhpcy5pbnB1dC5zbGljZSh0aGlzLmxhc3RUb2tFbmQsIHRoaXMuc3RhcnQpKSkgJiZcbiAgICAgICEoKHByZXZUeXBlID09PSB0eXBlcyQxLmNvbG9uIHx8IHByZXZUeXBlID09PSB0eXBlcyQxLmJyYWNlTCkgJiYgdGhpcy5jdXJDb250ZXh0KCkgPT09IHR5cGVzLmJfc3RhdCkpXG4gICAgeyB0aGlzLmNvbnRleHQucHVzaCh0eXBlcy5mX2V4cHIpOyB9XG4gIGVsc2VcbiAgICB7IHRoaXMuY29udGV4dC5wdXNoKHR5cGVzLmZfc3RhdCk7IH1cbiAgdGhpcy5leHByQWxsb3dlZCA9IGZhbHNlO1xufTtcblxudHlwZXMkMS5jb2xvbi51cGRhdGVDb250ZXh0ID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmN1ckNvbnRleHQoKS50b2tlbiA9PT0gXCJmdW5jdGlvblwiKSB7IHRoaXMuY29udGV4dC5wb3AoKTsgfVxuICB0aGlzLmV4cHJBbGxvd2VkID0gdHJ1ZTtcbn07XG5cbnR5cGVzJDEuYmFja1F1b3RlLnVwZGF0ZUNvbnRleHQgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuY3VyQ29udGV4dCgpID09PSB0eXBlcy5xX3RtcGwpXG4gICAgeyB0aGlzLmNvbnRleHQucG9wKCk7IH1cbiAgZWxzZVxuICAgIHsgdGhpcy5jb250ZXh0LnB1c2godHlwZXMucV90bXBsKTsgfVxuICB0aGlzLmV4cHJBbGxvd2VkID0gZmFsc2U7XG59O1xuXG50eXBlcyQxLnN0YXIudXBkYXRlQ29udGV4dCA9IGZ1bmN0aW9uKHByZXZUeXBlKSB7XG4gIGlmIChwcmV2VHlwZSA9PT0gdHlwZXMkMS5fZnVuY3Rpb24pIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLmNvbnRleHQubGVuZ3RoIC0gMTtcbiAgICBpZiAodGhpcy5jb250ZXh0W2luZGV4XSA9PT0gdHlwZXMuZl9leHByKVxuICAgICAgeyB0aGlzLmNvbnRleHRbaW5kZXhdID0gdHlwZXMuZl9leHByX2dlbjsgfVxuICAgIGVsc2VcbiAgICAgIHsgdGhpcy5jb250ZXh0W2luZGV4XSA9IHR5cGVzLmZfZ2VuOyB9XG4gIH1cbiAgdGhpcy5leHByQWxsb3dlZCA9IHRydWU7XG59O1xuXG50eXBlcyQxLm5hbWUudXBkYXRlQ29udGV4dCA9IGZ1bmN0aW9uKHByZXZUeXBlKSB7XG4gIHZhciBhbGxvd2VkID0gZmFsc2U7XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNiAmJiBwcmV2VHlwZSAhPT0gdHlwZXMkMS5kb3QpIHtcbiAgICBpZiAodGhpcy52YWx1ZSA9PT0gXCJvZlwiICYmICF0aGlzLmV4cHJBbGxvd2VkIHx8XG4gICAgICAgIHRoaXMudmFsdWUgPT09IFwieWllbGRcIiAmJiB0aGlzLmluR2VuZXJhdG9yQ29udGV4dCgpKVxuICAgICAgeyBhbGxvd2VkID0gdHJ1ZTsgfVxuICB9XG4gIHRoaXMuZXhwckFsbG93ZWQgPSBhbGxvd2VkO1xufTtcblxuLy8gQSByZWN1cnNpdmUgZGVzY2VudCBwYXJzZXIgb3BlcmF0ZXMgYnkgZGVmaW5pbmcgZnVuY3Rpb25zIGZvciBhbGxcbi8vIHN5bnRhY3RpYyBlbGVtZW50cywgYW5kIHJlY3Vyc2l2ZWx5IGNhbGxpbmcgdGhvc2UsIGVhY2ggZnVuY3Rpb25cbi8vIGFkdmFuY2luZyB0aGUgaW5wdXQgc3RyZWFtIGFuZCByZXR1cm5pbmcgYW4gQVNUIG5vZGUuIFByZWNlZGVuY2Vcbi8vIG9mIGNvbnN0cnVjdHMgKGZvciBleGFtcGxlLCB0aGUgZmFjdCB0aGF0IGAheFsxXWAgbWVhbnMgYCEoeFsxXSlgXG4vLyBpbnN0ZWFkIG9mIGAoIXgpWzFdYCBpcyBoYW5kbGVkIGJ5IHRoZSBmYWN0IHRoYXQgdGhlIHBhcnNlclxuLy8gZnVuY3Rpb24gdGhhdCBwYXJzZXMgdW5hcnkgcHJlZml4IG9wZXJhdG9ycyBpcyBjYWxsZWQgZmlyc3QsIGFuZFxuLy8gaW4gdHVybiBjYWxscyB0aGUgZnVuY3Rpb24gdGhhdCBwYXJzZXMgYFtdYCBzdWJzY3JpcHRzIFx1MjAxNCB0aGF0XG4vLyB3YXksIGl0J2xsIHJlY2VpdmUgdGhlIG5vZGUgZm9yIGB4WzFdYCBhbHJlYWR5IHBhcnNlZCwgYW5kIHdyYXBzXG4vLyAqdGhhdCogaW4gdGhlIHVuYXJ5IG9wZXJhdG9yIG5vZGUuXG4vL1xuLy8gQWNvcm4gdXNlcyBhbiBbb3BlcmF0b3IgcHJlY2VkZW5jZSBwYXJzZXJdW29wcF0gdG8gaGFuZGxlIGJpbmFyeVxuLy8gb3BlcmF0b3IgcHJlY2VkZW5jZSwgYmVjYXVzZSBpdCBpcyBtdWNoIG1vcmUgY29tcGFjdCB0aGFuIHVzaW5nXG4vLyB0aGUgdGVjaG5pcXVlIG91dGxpbmVkIGFib3ZlLCB3aGljaCB1c2VzIGRpZmZlcmVudCwgbmVzdGluZ1xuLy8gZnVuY3Rpb25zIHRvIHNwZWNpZnkgcHJlY2VkZW5jZSwgZm9yIGFsbCBvZiB0aGUgdGVuIGJpbmFyeVxuLy8gcHJlY2VkZW5jZSBsZXZlbHMgdGhhdCBKYXZhU2NyaXB0IGRlZmluZXMuXG4vL1xuLy8gW29wcF06IGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvT3BlcmF0b3ItcHJlY2VkZW5jZV9wYXJzZXJcblxuXG52YXIgcHAkNSA9IFBhcnNlci5wcm90b3R5cGU7XG5cbi8vIENoZWNrIGlmIHByb3BlcnR5IG5hbWUgY2xhc2hlcyB3aXRoIGFscmVhZHkgYWRkZWQuXG4vLyBPYmplY3QvY2xhc3MgZ2V0dGVycyBhbmQgc2V0dGVycyBhcmUgbm90IGFsbG93ZWQgdG8gY2xhc2ggXHUyMDE0XG4vLyBlaXRoZXIgd2l0aCBlYWNoIG90aGVyIG9yIHdpdGggYW4gaW5pdCBwcm9wZXJ0eSBcdTIwMTQgYW5kIGluXG4vLyBzdHJpY3QgbW9kZSwgaW5pdCBwcm9wZXJ0aWVzIGFyZSBhbHNvIG5vdCBhbGxvd2VkIHRvIGJlIHJlcGVhdGVkLlxuXG5wcCQ1LmNoZWNrUHJvcENsYXNoID0gZnVuY3Rpb24ocHJvcCwgcHJvcEhhc2gsIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpIHtcbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA5ICYmIHByb3AudHlwZSA9PT0gXCJTcHJlYWRFbGVtZW50XCIpXG4gICAgeyByZXR1cm4gfVxuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDYgJiYgKHByb3AuY29tcHV0ZWQgfHwgcHJvcC5tZXRob2QgfHwgcHJvcC5zaG9ydGhhbmQpKVxuICAgIHsgcmV0dXJuIH1cbiAgdmFyIGtleSA9IHByb3Aua2V5O1xuICB2YXIgbmFtZTtcbiAgc3dpdGNoIChrZXkudHlwZSkge1xuICBjYXNlIFwiSWRlbnRpZmllclwiOiBuYW1lID0ga2V5Lm5hbWU7IGJyZWFrXG4gIGNhc2UgXCJMaXRlcmFsXCI6IG5hbWUgPSBTdHJpbmcoa2V5LnZhbHVlKTsgYnJlYWtcbiAgZGVmYXVsdDogcmV0dXJuXG4gIH1cbiAgdmFyIGtpbmQgPSBwcm9wLmtpbmQ7XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNikge1xuICAgIGlmIChuYW1lID09PSBcIl9fcHJvdG9fX1wiICYmIGtpbmQgPT09IFwiaW5pdFwiKSB7XG4gICAgICBpZiAocHJvcEhhc2gucHJvdG8pIHtcbiAgICAgICAgaWYgKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpIHtcbiAgICAgICAgICBpZiAocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy5kb3VibGVQcm90byA8IDApIHtcbiAgICAgICAgICAgIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMuZG91YmxlUHJvdG8gPSBrZXkuc3RhcnQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMucmFpc2VSZWNvdmVyYWJsZShrZXkuc3RhcnQsIFwiUmVkZWZpbml0aW9uIG9mIF9fcHJvdG9fXyBwcm9wZXJ0eVwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcHJvcEhhc2gucHJvdG8gPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm5cbiAgfVxuICBuYW1lID0gXCIkXCIgKyBuYW1lO1xuICB2YXIgb3RoZXIgPSBwcm9wSGFzaFtuYW1lXTtcbiAgaWYgKG90aGVyKSB7XG4gICAgdmFyIHJlZGVmaW5pdGlvbjtcbiAgICBpZiAoa2luZCA9PT0gXCJpbml0XCIpIHtcbiAgICAgIHJlZGVmaW5pdGlvbiA9IHRoaXMuc3RyaWN0ICYmIG90aGVyLmluaXQgfHwgb3RoZXIuZ2V0IHx8IG90aGVyLnNldDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVkZWZpbml0aW9uID0gb3RoZXIuaW5pdCB8fCBvdGhlcltraW5kXTtcbiAgICB9XG4gICAgaWYgKHJlZGVmaW5pdGlvbilcbiAgICAgIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKGtleS5zdGFydCwgXCJSZWRlZmluaXRpb24gb2YgcHJvcGVydHlcIik7IH1cbiAgfSBlbHNlIHtcbiAgICBvdGhlciA9IHByb3BIYXNoW25hbWVdID0ge1xuICAgICAgaW5pdDogZmFsc2UsXG4gICAgICBnZXQ6IGZhbHNlLFxuICAgICAgc2V0OiBmYWxzZVxuICAgIH07XG4gIH1cbiAgb3RoZXJba2luZF0gPSB0cnVlO1xufTtcblxuLy8gIyMjIEV4cHJlc3Npb24gcGFyc2luZ1xuXG4vLyBUaGVzZSBuZXN0LCBmcm9tIHRoZSBtb3N0IGdlbmVyYWwgZXhwcmVzc2lvbiB0eXBlIGF0IHRoZSB0b3AgdG9cbi8vICdhdG9taWMnLCBub25kaXZpc2libGUgZXhwcmVzc2lvbiB0eXBlcyBhdCB0aGUgYm90dG9tLiBNb3N0IG9mXG4vLyB0aGUgZnVuY3Rpb25zIHdpbGwgc2ltcGx5IGxldCB0aGUgZnVuY3Rpb24ocykgYmVsb3cgdGhlbSBwYXJzZSxcbi8vIGFuZCwgKmlmKiB0aGUgc3ludGFjdGljIGNvbnN0cnVjdCB0aGV5IGhhbmRsZSBpcyBwcmVzZW50LCB3cmFwXG4vLyB0aGUgQVNUIG5vZGUgdGhhdCB0aGUgaW5uZXIgcGFyc2VyIGdhdmUgdGhlbSBpbiBhbm90aGVyIG5vZGUuXG5cbi8vIFBhcnNlIGEgZnVsbCBleHByZXNzaW9uLiBUaGUgb3B0aW9uYWwgYXJndW1lbnRzIGFyZSB1c2VkIHRvXG4vLyBmb3JiaWQgdGhlIGBpbmAgb3BlcmF0b3IgKGluIGZvciBsb29wcyBpbml0YWxpemF0aW9uIGV4cHJlc3Npb25zKVxuLy8gYW5kIHByb3ZpZGUgcmVmZXJlbmNlIGZvciBzdG9yaW5nICc9JyBvcGVyYXRvciBpbnNpZGUgc2hvcnRoYW5kXG4vLyBwcm9wZXJ0eSBhc3NpZ25tZW50IGluIGNvbnRleHRzIHdoZXJlIGJvdGggb2JqZWN0IGV4cHJlc3Npb25cbi8vIGFuZCBvYmplY3QgcGF0dGVybiBtaWdodCBhcHBlYXIgKHNvIGl0J3MgcG9zc2libGUgdG8gcmFpc2Vcbi8vIGRlbGF5ZWQgc3ludGF4IGVycm9yIGF0IGNvcnJlY3QgcG9zaXRpb24pLlxuXG5wcCQ1LnBhcnNlRXhwcmVzc2lvbiA9IGZ1bmN0aW9uKGZvckluaXQsIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpIHtcbiAgdmFyIHN0YXJ0UG9zID0gdGhpcy5zdGFydCwgc3RhcnRMb2MgPSB0aGlzLnN0YXJ0TG9jO1xuICB2YXIgZXhwciA9IHRoaXMucGFyc2VNYXliZUFzc2lnbihmb3JJbml0LCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKTtcbiAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5jb21tYSkge1xuICAgIHZhciBub2RlID0gdGhpcy5zdGFydE5vZGVBdChzdGFydFBvcywgc3RhcnRMb2MpO1xuICAgIG5vZGUuZXhwcmVzc2lvbnMgPSBbZXhwcl07XG4gICAgd2hpbGUgKHRoaXMuZWF0KHR5cGVzJDEuY29tbWEpKSB7IG5vZGUuZXhwcmVzc2lvbnMucHVzaCh0aGlzLnBhcnNlTWF5YmVBc3NpZ24oZm9ySW5pdCwgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykpOyB9XG4gICAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIlNlcXVlbmNlRXhwcmVzc2lvblwiKVxuICB9XG4gIHJldHVybiBleHByXG59O1xuXG4vLyBQYXJzZSBhbiBhc3NpZ25tZW50IGV4cHJlc3Npb24uIFRoaXMgaW5jbHVkZXMgYXBwbGljYXRpb25zIG9mXG4vLyBvcGVyYXRvcnMgbGlrZSBgKz1gLlxuXG5wcCQ1LnBhcnNlTWF5YmVBc3NpZ24gPSBmdW5jdGlvbihmb3JJbml0LCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCBhZnRlckxlZnRQYXJzZSkge1xuICBpZiAodGhpcy5pc0NvbnRleHR1YWwoXCJ5aWVsZFwiKSkge1xuICAgIGlmICh0aGlzLmluR2VuZXJhdG9yKSB7IHJldHVybiB0aGlzLnBhcnNlWWllbGQoZm9ySW5pdCkgfVxuICAgIC8vIFRoZSB0b2tlbml6ZXIgd2lsbCBhc3N1bWUgYW4gZXhwcmVzc2lvbiBpcyBhbGxvd2VkIGFmdGVyXG4gICAgLy8gYHlpZWxkYCwgYnV0IHRoaXMgaXNuJ3QgdGhhdCBraW5kIG9mIHlpZWxkXG4gICAgZWxzZSB7IHRoaXMuZXhwckFsbG93ZWQgPSBmYWxzZTsgfVxuICB9XG5cbiAgdmFyIG93bkRlc3RydWN0dXJpbmdFcnJvcnMgPSBmYWxzZSwgb2xkUGFyZW5Bc3NpZ24gPSAtMSwgb2xkVHJhaWxpbmdDb21tYSA9IC0xLCBvbGREb3VibGVQcm90byA9IC0xO1xuICBpZiAocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykge1xuICAgIG9sZFBhcmVuQXNzaWduID0gcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy5wYXJlbnRoZXNpemVkQXNzaWduO1xuICAgIG9sZFRyYWlsaW5nQ29tbWEgPSByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnRyYWlsaW5nQ29tbWE7XG4gICAgb2xkRG91YmxlUHJvdG8gPSByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLmRvdWJsZVByb3RvO1xuICAgIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMucGFyZW50aGVzaXplZEFzc2lnbiA9IHJlZkRlc3RydWN0dXJpbmdFcnJvcnMudHJhaWxpbmdDb21tYSA9IC0xO1xuICB9IGVsc2Uge1xuICAgIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMgPSBuZXcgRGVzdHJ1Y3R1cmluZ0Vycm9ycztcbiAgICBvd25EZXN0cnVjdHVyaW5nRXJyb3JzID0gdHJ1ZTtcbiAgfVxuXG4gIHZhciBzdGFydFBvcyA9IHRoaXMuc3RhcnQsIHN0YXJ0TG9jID0gdGhpcy5zdGFydExvYztcbiAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5wYXJlbkwgfHwgdGhpcy50eXBlID09PSB0eXBlcyQxLm5hbWUpIHtcbiAgICB0aGlzLnBvdGVudGlhbEFycm93QXQgPSB0aGlzLnN0YXJ0O1xuICAgIHRoaXMucG90ZW50aWFsQXJyb3dJbkZvckF3YWl0ID0gZm9ySW5pdCA9PT0gXCJhd2FpdFwiO1xuICB9XG4gIHZhciBsZWZ0ID0gdGhpcy5wYXJzZU1heWJlQ29uZGl0aW9uYWwoZm9ySW5pdCwgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycyk7XG4gIGlmIChhZnRlckxlZnRQYXJzZSkgeyBsZWZ0ID0gYWZ0ZXJMZWZ0UGFyc2UuY2FsbCh0aGlzLCBsZWZ0LCBzdGFydFBvcywgc3RhcnRMb2MpOyB9XG4gIGlmICh0aGlzLnR5cGUuaXNBc3NpZ24pIHtcbiAgICB2YXIgbm9kZSA9IHRoaXMuc3RhcnROb2RlQXQoc3RhcnRQb3MsIHN0YXJ0TG9jKTtcbiAgICBub2RlLm9wZXJhdG9yID0gdGhpcy52YWx1ZTtcbiAgICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLmVxKVxuICAgICAgeyBsZWZ0ID0gdGhpcy50b0Fzc2lnbmFibGUobGVmdCwgZmFsc2UsIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpOyB9XG4gICAgaWYgKCFvd25EZXN0cnVjdHVyaW5nRXJyb3JzKSB7XG4gICAgICByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnBhcmVudGhlc2l6ZWRBc3NpZ24gPSByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnRyYWlsaW5nQ29tbWEgPSByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLmRvdWJsZVByb3RvID0gLTE7XG4gICAgfVxuICAgIGlmIChyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnNob3J0aGFuZEFzc2lnbiA+PSBsZWZ0LnN0YXJ0KVxuICAgICAgeyByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnNob3J0aGFuZEFzc2lnbiA9IC0xOyB9IC8vIHJlc2V0IGJlY2F1c2Ugc2hvcnRoYW5kIGRlZmF1bHQgd2FzIHVzZWQgY29ycmVjdGx5XG4gICAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5lcSlcbiAgICAgIHsgdGhpcy5jaGVja0xWYWxQYXR0ZXJuKGxlZnQpOyB9XG4gICAgZWxzZVxuICAgICAgeyB0aGlzLmNoZWNrTFZhbFNpbXBsZShsZWZ0KTsgfVxuICAgIG5vZGUubGVmdCA9IGxlZnQ7XG4gICAgdGhpcy5uZXh0KCk7XG4gICAgbm9kZS5yaWdodCA9IHRoaXMucGFyc2VNYXliZUFzc2lnbihmb3JJbml0KTtcbiAgICBpZiAob2xkRG91YmxlUHJvdG8gPiAtMSkgeyByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLmRvdWJsZVByb3RvID0gb2xkRG91YmxlUHJvdG87IH1cbiAgICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiQXNzaWdubWVudEV4cHJlc3Npb25cIilcbiAgfSBlbHNlIHtcbiAgICBpZiAob3duRGVzdHJ1Y3R1cmluZ0Vycm9ycykgeyB0aGlzLmNoZWNrRXhwcmVzc2lvbkVycm9ycyhyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCB0cnVlKTsgfVxuICB9XG4gIGlmIChvbGRQYXJlbkFzc2lnbiA+IC0xKSB7IHJlZkRlc3RydWN0dXJpbmdFcnJvcnMucGFyZW50aGVzaXplZEFzc2lnbiA9IG9sZFBhcmVuQXNzaWduOyB9XG4gIGlmIChvbGRUcmFpbGluZ0NvbW1hID4gLTEpIHsgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy50cmFpbGluZ0NvbW1hID0gb2xkVHJhaWxpbmdDb21tYTsgfVxuICByZXR1cm4gbGVmdFxufTtcblxuLy8gUGFyc2UgYSB0ZXJuYXJ5IGNvbmRpdGlvbmFsIChgPzpgKSBvcGVyYXRvci5cblxucHAkNS5wYXJzZU1heWJlQ29uZGl0aW9uYWwgPSBmdW5jdGlvbihmb3JJbml0LCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKSB7XG4gIHZhciBzdGFydFBvcyA9IHRoaXMuc3RhcnQsIHN0YXJ0TG9jID0gdGhpcy5zdGFydExvYztcbiAgdmFyIGV4cHIgPSB0aGlzLnBhcnNlRXhwck9wcyhmb3JJbml0LCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKTtcbiAgaWYgKHRoaXMuY2hlY2tFeHByZXNzaW9uRXJyb3JzKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpKSB7IHJldHVybiBleHByIH1cbiAgaWYgKHRoaXMuZWF0KHR5cGVzJDEucXVlc3Rpb24pKSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZUF0KHN0YXJ0UG9zLCBzdGFydExvYyk7XG4gICAgbm9kZS50ZXN0ID0gZXhwcjtcbiAgICBub2RlLmNvbnNlcXVlbnQgPSB0aGlzLnBhcnNlTWF5YmVBc3NpZ24oKTtcbiAgICB0aGlzLmV4cGVjdCh0eXBlcyQxLmNvbG9uKTtcbiAgICBub2RlLmFsdGVybmF0ZSA9IHRoaXMucGFyc2VNYXliZUFzc2lnbihmb3JJbml0KTtcbiAgICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiQ29uZGl0aW9uYWxFeHByZXNzaW9uXCIpXG4gIH1cbiAgcmV0dXJuIGV4cHJcbn07XG5cbi8vIFN0YXJ0IHRoZSBwcmVjZWRlbmNlIHBhcnNlci5cblxucHAkNS5wYXJzZUV4cHJPcHMgPSBmdW5jdGlvbihmb3JJbml0LCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKSB7XG4gIHZhciBzdGFydFBvcyA9IHRoaXMuc3RhcnQsIHN0YXJ0TG9jID0gdGhpcy5zdGFydExvYztcbiAgdmFyIGV4cHIgPSB0aGlzLnBhcnNlTWF5YmVVbmFyeShyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCBmYWxzZSwgZmFsc2UsIGZvckluaXQpO1xuICBpZiAodGhpcy5jaGVja0V4cHJlc3Npb25FcnJvcnMocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykpIHsgcmV0dXJuIGV4cHIgfVxuICByZXR1cm4gZXhwci5zdGFydCA9PT0gc3RhcnRQb3MgJiYgZXhwci50eXBlID09PSBcIkFycm93RnVuY3Rpb25FeHByZXNzaW9uXCIgPyBleHByIDogdGhpcy5wYXJzZUV4cHJPcChleHByLCBzdGFydFBvcywgc3RhcnRMb2MsIC0xLCBmb3JJbml0KVxufTtcblxuLy8gUGFyc2UgYmluYXJ5IG9wZXJhdG9ycyB3aXRoIHRoZSBvcGVyYXRvciBwcmVjZWRlbmNlIHBhcnNpbmdcbi8vIGFsZ29yaXRobS4gYGxlZnRgIGlzIHRoZSBsZWZ0LWhhbmQgc2lkZSBvZiB0aGUgb3BlcmF0b3IuXG4vLyBgbWluUHJlY2AgcHJvdmlkZXMgY29udGV4dCB0aGF0IGFsbG93cyB0aGUgZnVuY3Rpb24gdG8gc3RvcCBhbmRcbi8vIGRlZmVyIGZ1cnRoZXIgcGFyc2VyIHRvIG9uZSBvZiBpdHMgY2FsbGVycyB3aGVuIGl0IGVuY291bnRlcnMgYW5cbi8vIG9wZXJhdG9yIHRoYXQgaGFzIGEgbG93ZXIgcHJlY2VkZW5jZSB0aGFuIHRoZSBzZXQgaXQgaXMgcGFyc2luZy5cblxucHAkNS5wYXJzZUV4cHJPcCA9IGZ1bmN0aW9uKGxlZnQsIGxlZnRTdGFydFBvcywgbGVmdFN0YXJ0TG9jLCBtaW5QcmVjLCBmb3JJbml0KSB7XG4gIHZhciBwcmVjID0gdGhpcy50eXBlLmJpbm9wO1xuICBpZiAocHJlYyAhPSBudWxsICYmICghZm9ySW5pdCB8fCB0aGlzLnR5cGUgIT09IHR5cGVzJDEuX2luKSkge1xuICAgIGlmIChwcmVjID4gbWluUHJlYykge1xuICAgICAgdmFyIGxvZ2ljYWwgPSB0aGlzLnR5cGUgPT09IHR5cGVzJDEubG9naWNhbE9SIHx8IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5sb2dpY2FsQU5EO1xuICAgICAgdmFyIGNvYWxlc2NlID0gdGhpcy50eXBlID09PSB0eXBlcyQxLmNvYWxlc2NlO1xuICAgICAgaWYgKGNvYWxlc2NlKSB7XG4gICAgICAgIC8vIEhhbmRsZSB0aGUgcHJlY2VkZW5jZSBvZiBgdHQuY29hbGVzY2VgIGFzIGVxdWFsIHRvIHRoZSByYW5nZSBvZiBsb2dpY2FsIGV4cHJlc3Npb25zLlxuICAgICAgICAvLyBJbiBvdGhlciB3b3JkcywgYG5vZGUucmlnaHRgIHNob3VsZG4ndCBjb250YWluIGxvZ2ljYWwgZXhwcmVzc2lvbnMgaW4gb3JkZXIgdG8gY2hlY2sgdGhlIG1peGVkIGVycm9yLlxuICAgICAgICBwcmVjID0gdHlwZXMkMS5sb2dpY2FsQU5ELmJpbm9wO1xuICAgICAgfVxuICAgICAgdmFyIG9wID0gdGhpcy52YWx1ZTtcbiAgICAgIHRoaXMubmV4dCgpO1xuICAgICAgdmFyIHN0YXJ0UG9zID0gdGhpcy5zdGFydCwgc3RhcnRMb2MgPSB0aGlzLnN0YXJ0TG9jO1xuICAgICAgdmFyIHJpZ2h0ID0gdGhpcy5wYXJzZUV4cHJPcCh0aGlzLnBhcnNlTWF5YmVVbmFyeShudWxsLCBmYWxzZSwgZmFsc2UsIGZvckluaXQpLCBzdGFydFBvcywgc3RhcnRMb2MsIHByZWMsIGZvckluaXQpO1xuICAgICAgdmFyIG5vZGUgPSB0aGlzLmJ1aWxkQmluYXJ5KGxlZnRTdGFydFBvcywgbGVmdFN0YXJ0TG9jLCBsZWZ0LCByaWdodCwgb3AsIGxvZ2ljYWwgfHwgY29hbGVzY2UpO1xuICAgICAgaWYgKChsb2dpY2FsICYmIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5jb2FsZXNjZSkgfHwgKGNvYWxlc2NlICYmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEubG9naWNhbE9SIHx8IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5sb2dpY2FsQU5EKSkpIHtcbiAgICAgICAgdGhpcy5yYWlzZVJlY292ZXJhYmxlKHRoaXMuc3RhcnQsIFwiTG9naWNhbCBleHByZXNzaW9ucyBhbmQgY29hbGVzY2UgZXhwcmVzc2lvbnMgY2Fubm90IGJlIG1peGVkLiBXcmFwIGVpdGhlciBieSBwYXJlbnRoZXNlc1wiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLnBhcnNlRXhwck9wKG5vZGUsIGxlZnRTdGFydFBvcywgbGVmdFN0YXJ0TG9jLCBtaW5QcmVjLCBmb3JJbml0KVxuICAgIH1cbiAgfVxuICByZXR1cm4gbGVmdFxufTtcblxucHAkNS5idWlsZEJpbmFyeSA9IGZ1bmN0aW9uKHN0YXJ0UG9zLCBzdGFydExvYywgbGVmdCwgcmlnaHQsIG9wLCBsb2dpY2FsKSB7XG4gIGlmIChyaWdodC50eXBlID09PSBcIlByaXZhdGVJZGVudGlmaWVyXCIpIHsgdGhpcy5yYWlzZShyaWdodC5zdGFydCwgXCJQcml2YXRlIGlkZW50aWZpZXIgY2FuIG9ubHkgYmUgbGVmdCBzaWRlIG9mIGJpbmFyeSBleHByZXNzaW9uXCIpOyB9XG4gIHZhciBub2RlID0gdGhpcy5zdGFydE5vZGVBdChzdGFydFBvcywgc3RhcnRMb2MpO1xuICBub2RlLmxlZnQgPSBsZWZ0O1xuICBub2RlLm9wZXJhdG9yID0gb3A7XG4gIG5vZGUucmlnaHQgPSByaWdodDtcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBsb2dpY2FsID8gXCJMb2dpY2FsRXhwcmVzc2lvblwiIDogXCJCaW5hcnlFeHByZXNzaW9uXCIpXG59O1xuXG4vLyBQYXJzZSB1bmFyeSBvcGVyYXRvcnMsIGJvdGggcHJlZml4IGFuZCBwb3N0Zml4LlxuXG5wcCQ1LnBhcnNlTWF5YmVVbmFyeSA9IGZ1bmN0aW9uKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMsIHNhd1VuYXJ5LCBpbmNEZWMsIGZvckluaXQpIHtcbiAgdmFyIHN0YXJ0UG9zID0gdGhpcy5zdGFydCwgc3RhcnRMb2MgPSB0aGlzLnN0YXJ0TG9jLCBleHByO1xuICBpZiAodGhpcy5pc0NvbnRleHR1YWwoXCJhd2FpdFwiKSAmJiB0aGlzLmNhbkF3YWl0KSB7XG4gICAgZXhwciA9IHRoaXMucGFyc2VBd2FpdChmb3JJbml0KTtcbiAgICBzYXdVbmFyeSA9IHRydWU7XG4gIH0gZWxzZSBpZiAodGhpcy50eXBlLnByZWZpeCkge1xuICAgIHZhciBub2RlID0gdGhpcy5zdGFydE5vZGUoKSwgdXBkYXRlID0gdGhpcy50eXBlID09PSB0eXBlcyQxLmluY0RlYztcbiAgICBub2RlLm9wZXJhdG9yID0gdGhpcy52YWx1ZTtcbiAgICBub2RlLnByZWZpeCA9IHRydWU7XG4gICAgdGhpcy5uZXh0KCk7XG4gICAgbm9kZS5hcmd1bWVudCA9IHRoaXMucGFyc2VNYXliZVVuYXJ5KG51bGwsIHRydWUsIHVwZGF0ZSwgZm9ySW5pdCk7XG4gICAgdGhpcy5jaGVja0V4cHJlc3Npb25FcnJvcnMocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycywgdHJ1ZSk7XG4gICAgaWYgKHVwZGF0ZSkgeyB0aGlzLmNoZWNrTFZhbFNpbXBsZShub2RlLmFyZ3VtZW50KTsgfVxuICAgIGVsc2UgaWYgKHRoaXMuc3RyaWN0ICYmIG5vZGUub3BlcmF0b3IgPT09IFwiZGVsZXRlXCIgJiYgaXNMb2NhbFZhcmlhYmxlQWNjZXNzKG5vZGUuYXJndW1lbnQpKVxuICAgICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUobm9kZS5zdGFydCwgXCJEZWxldGluZyBsb2NhbCB2YXJpYWJsZSBpbiBzdHJpY3QgbW9kZVwiKTsgfVxuICAgIGVsc2UgaWYgKG5vZGUub3BlcmF0b3IgPT09IFwiZGVsZXRlXCIgJiYgaXNQcml2YXRlRmllbGRBY2Nlc3Mobm9kZS5hcmd1bWVudCkpXG4gICAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShub2RlLnN0YXJ0LCBcIlByaXZhdGUgZmllbGRzIGNhbiBub3QgYmUgZGVsZXRlZFwiKTsgfVxuICAgIGVsc2UgeyBzYXdVbmFyeSA9IHRydWU7IH1cbiAgICBleHByID0gdGhpcy5maW5pc2hOb2RlKG5vZGUsIHVwZGF0ZSA/IFwiVXBkYXRlRXhwcmVzc2lvblwiIDogXCJVbmFyeUV4cHJlc3Npb25cIik7XG4gIH0gZWxzZSBpZiAoIXNhd1VuYXJ5ICYmIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5wcml2YXRlSWQpIHtcbiAgICBpZiAoKGZvckluaXQgfHwgdGhpcy5wcml2YXRlTmFtZVN0YWNrLmxlbmd0aCA9PT0gMCkgJiYgdGhpcy5vcHRpb25zLmNoZWNrUHJpdmF0ZUZpZWxkcykgeyB0aGlzLnVuZXhwZWN0ZWQoKTsgfVxuICAgIGV4cHIgPSB0aGlzLnBhcnNlUHJpdmF0ZUlkZW50KCk7XG4gICAgLy8gb25seSBjb3VsZCBiZSBwcml2YXRlIGZpZWxkcyBpbiAnaW4nLCBzdWNoIGFzICN4IGluIG9ialxuICAgIGlmICh0aGlzLnR5cGUgIT09IHR5cGVzJDEuX2luKSB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gIH0gZWxzZSB7XG4gICAgZXhwciA9IHRoaXMucGFyc2VFeHByU3Vic2NyaXB0cyhyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCBmb3JJbml0KTtcbiAgICBpZiAodGhpcy5jaGVja0V4cHJlc3Npb25FcnJvcnMocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykpIHsgcmV0dXJuIGV4cHIgfVxuICAgIHdoaWxlICh0aGlzLnR5cGUucG9zdGZpeCAmJiAhdGhpcy5jYW5JbnNlcnRTZW1pY29sb24oKSkge1xuICAgICAgdmFyIG5vZGUkMSA9IHRoaXMuc3RhcnROb2RlQXQoc3RhcnRQb3MsIHN0YXJ0TG9jKTtcbiAgICAgIG5vZGUkMS5vcGVyYXRvciA9IHRoaXMudmFsdWU7XG4gICAgICBub2RlJDEucHJlZml4ID0gZmFsc2U7XG4gICAgICBub2RlJDEuYXJndW1lbnQgPSBleHByO1xuICAgICAgdGhpcy5jaGVja0xWYWxTaW1wbGUoZXhwcik7XG4gICAgICB0aGlzLm5leHQoKTtcbiAgICAgIGV4cHIgPSB0aGlzLmZpbmlzaE5vZGUobm9kZSQxLCBcIlVwZGF0ZUV4cHJlc3Npb25cIik7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFpbmNEZWMgJiYgdGhpcy5lYXQodHlwZXMkMS5zdGFyc3RhcikpIHtcbiAgICBpZiAoc2F3VW5hcnkpXG4gICAgICB7IHRoaXMudW5leHBlY3RlZCh0aGlzLmxhc3RUb2tTdGFydCk7IH1cbiAgICBlbHNlXG4gICAgICB7IHJldHVybiB0aGlzLmJ1aWxkQmluYXJ5KHN0YXJ0UG9zLCBzdGFydExvYywgZXhwciwgdGhpcy5wYXJzZU1heWJlVW5hcnkobnVsbCwgZmFsc2UsIGZhbHNlLCBmb3JJbml0KSwgXCIqKlwiLCBmYWxzZSkgfVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBleHByXG4gIH1cbn07XG5cbmZ1bmN0aW9uIGlzTG9jYWxWYXJpYWJsZUFjY2Vzcyhub2RlKSB7XG4gIHJldHVybiAoXG4gICAgbm9kZS50eXBlID09PSBcIklkZW50aWZpZXJcIiB8fFxuICAgIG5vZGUudHlwZSA9PT0gXCJQYXJlbnRoZXNpemVkRXhwcmVzc2lvblwiICYmIGlzTG9jYWxWYXJpYWJsZUFjY2Vzcyhub2RlLmV4cHJlc3Npb24pXG4gIClcbn1cblxuZnVuY3Rpb24gaXNQcml2YXRlRmllbGRBY2Nlc3Mobm9kZSkge1xuICByZXR1cm4gKFxuICAgIG5vZGUudHlwZSA9PT0gXCJNZW1iZXJFeHByZXNzaW9uXCIgJiYgbm9kZS5wcm9wZXJ0eS50eXBlID09PSBcIlByaXZhdGVJZGVudGlmaWVyXCIgfHxcbiAgICBub2RlLnR5cGUgPT09IFwiQ2hhaW5FeHByZXNzaW9uXCIgJiYgaXNQcml2YXRlRmllbGRBY2Nlc3Mobm9kZS5leHByZXNzaW9uKSB8fFxuICAgIG5vZGUudHlwZSA9PT0gXCJQYXJlbnRoZXNpemVkRXhwcmVzc2lvblwiICYmIGlzUHJpdmF0ZUZpZWxkQWNjZXNzKG5vZGUuZXhwcmVzc2lvbilcbiAgKVxufVxuXG4vLyBQYXJzZSBjYWxsLCBkb3QsIGFuZCBgW11gLXN1YnNjcmlwdCBleHByZXNzaW9ucy5cblxucHAkNS5wYXJzZUV4cHJTdWJzY3JpcHRzID0gZnVuY3Rpb24ocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycywgZm9ySW5pdCkge1xuICB2YXIgc3RhcnRQb3MgPSB0aGlzLnN0YXJ0LCBzdGFydExvYyA9IHRoaXMuc3RhcnRMb2M7XG4gIHZhciBleHByID0gdGhpcy5wYXJzZUV4cHJBdG9tKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMsIGZvckluaXQpO1xuICBpZiAoZXhwci50eXBlID09PSBcIkFycm93RnVuY3Rpb25FeHByZXNzaW9uXCIgJiYgdGhpcy5pbnB1dC5zbGljZSh0aGlzLmxhc3RUb2tTdGFydCwgdGhpcy5sYXN0VG9rRW5kKSAhPT0gXCIpXCIpXG4gICAgeyByZXR1cm4gZXhwciB9XG4gIHZhciByZXN1bHQgPSB0aGlzLnBhcnNlU3Vic2NyaXB0cyhleHByLCBzdGFydFBvcywgc3RhcnRMb2MsIGZhbHNlLCBmb3JJbml0KTtcbiAgaWYgKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMgJiYgcmVzdWx0LnR5cGUgPT09IFwiTWVtYmVyRXhwcmVzc2lvblwiKSB7XG4gICAgaWYgKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMucGFyZW50aGVzaXplZEFzc2lnbiA+PSByZXN1bHQuc3RhcnQpIHsgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy5wYXJlbnRoZXNpemVkQXNzaWduID0gLTE7IH1cbiAgICBpZiAocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy5wYXJlbnRoZXNpemVkQmluZCA+PSByZXN1bHQuc3RhcnQpIHsgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy5wYXJlbnRoZXNpemVkQmluZCA9IC0xOyB9XG4gICAgaWYgKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMudHJhaWxpbmdDb21tYSA+PSByZXN1bHQuc3RhcnQpIHsgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy50cmFpbGluZ0NvbW1hID0gLTE7IH1cbiAgfVxuICByZXR1cm4gcmVzdWx0XG59O1xuXG5wcCQ1LnBhcnNlU3Vic2NyaXB0cyA9IGZ1bmN0aW9uKGJhc2UsIHN0YXJ0UG9zLCBzdGFydExvYywgbm9DYWxscywgZm9ySW5pdCkge1xuICB2YXIgbWF5YmVBc3luY0Fycm93ID0gdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDggJiYgYmFzZS50eXBlID09PSBcIklkZW50aWZpZXJcIiAmJiBiYXNlLm5hbWUgPT09IFwiYXN5bmNcIiAmJlxuICAgICAgdGhpcy5sYXN0VG9rRW5kID09PSBiYXNlLmVuZCAmJiAhdGhpcy5jYW5JbnNlcnRTZW1pY29sb24oKSAmJiBiYXNlLmVuZCAtIGJhc2Uuc3RhcnQgPT09IDUgJiZcbiAgICAgIHRoaXMucG90ZW50aWFsQXJyb3dBdCA9PT0gYmFzZS5zdGFydDtcbiAgdmFyIG9wdGlvbmFsQ2hhaW5lZCA9IGZhbHNlO1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgdmFyIGVsZW1lbnQgPSB0aGlzLnBhcnNlU3Vic2NyaXB0KGJhc2UsIHN0YXJ0UG9zLCBzdGFydExvYywgbm9DYWxscywgbWF5YmVBc3luY0Fycm93LCBvcHRpb25hbENoYWluZWQsIGZvckluaXQpO1xuXG4gICAgaWYgKGVsZW1lbnQub3B0aW9uYWwpIHsgb3B0aW9uYWxDaGFpbmVkID0gdHJ1ZTsgfVxuICAgIGlmIChlbGVtZW50ID09PSBiYXNlIHx8IGVsZW1lbnQudHlwZSA9PT0gXCJBcnJvd0Z1bmN0aW9uRXhwcmVzc2lvblwiKSB7XG4gICAgICBpZiAob3B0aW9uYWxDaGFpbmVkKSB7XG4gICAgICAgIHZhciBjaGFpbk5vZGUgPSB0aGlzLnN0YXJ0Tm9kZUF0KHN0YXJ0UG9zLCBzdGFydExvYyk7XG4gICAgICAgIGNoYWluTm9kZS5leHByZXNzaW9uID0gZWxlbWVudDtcbiAgICAgICAgZWxlbWVudCA9IHRoaXMuZmluaXNoTm9kZShjaGFpbk5vZGUsIFwiQ2hhaW5FeHByZXNzaW9uXCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGVsZW1lbnRcbiAgICB9XG5cbiAgICBiYXNlID0gZWxlbWVudDtcbiAgfVxufTtcblxucHAkNS5zaG91bGRQYXJzZUFzeW5jQXJyb3cgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICF0aGlzLmNhbkluc2VydFNlbWljb2xvbigpICYmIHRoaXMuZWF0KHR5cGVzJDEuYXJyb3cpXG59O1xuXG5wcCQ1LnBhcnNlU3Vic2NyaXB0QXN5bmNBcnJvdyA9IGZ1bmN0aW9uKHN0YXJ0UG9zLCBzdGFydExvYywgZXhwckxpc3QsIGZvckluaXQpIHtcbiAgcmV0dXJuIHRoaXMucGFyc2VBcnJvd0V4cHJlc3Npb24odGhpcy5zdGFydE5vZGVBdChzdGFydFBvcywgc3RhcnRMb2MpLCBleHByTGlzdCwgdHJ1ZSwgZm9ySW5pdClcbn07XG5cbnBwJDUucGFyc2VTdWJzY3JpcHQgPSBmdW5jdGlvbihiYXNlLCBzdGFydFBvcywgc3RhcnRMb2MsIG5vQ2FsbHMsIG1heWJlQXN5bmNBcnJvdywgb3B0aW9uYWxDaGFpbmVkLCBmb3JJbml0KSB7XG4gIHZhciBvcHRpb25hbFN1cHBvcnRlZCA9IHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSAxMTtcbiAgdmFyIG9wdGlvbmFsID0gb3B0aW9uYWxTdXBwb3J0ZWQgJiYgdGhpcy5lYXQodHlwZXMkMS5xdWVzdGlvbkRvdCk7XG4gIGlmIChub0NhbGxzICYmIG9wdGlvbmFsKSB7IHRoaXMucmFpc2UodGhpcy5sYXN0VG9rU3RhcnQsIFwiT3B0aW9uYWwgY2hhaW5pbmcgY2Fubm90IGFwcGVhciBpbiB0aGUgY2FsbGVlIG9mIG5ldyBleHByZXNzaW9uc1wiKTsgfVxuXG4gIHZhciBjb21wdXRlZCA9IHRoaXMuZWF0KHR5cGVzJDEuYnJhY2tldEwpO1xuICBpZiAoY29tcHV0ZWQgfHwgKG9wdGlvbmFsICYmIHRoaXMudHlwZSAhPT0gdHlwZXMkMS5wYXJlbkwgJiYgdGhpcy50eXBlICE9PSB0eXBlcyQxLmJhY2tRdW90ZSkgfHwgdGhpcy5lYXQodHlwZXMkMS5kb3QpKSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZUF0KHN0YXJ0UG9zLCBzdGFydExvYyk7XG4gICAgbm9kZS5vYmplY3QgPSBiYXNlO1xuICAgIGlmIChjb21wdXRlZCkge1xuICAgICAgbm9kZS5wcm9wZXJ0eSA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICB0aGlzLmV4cGVjdCh0eXBlcyQxLmJyYWNrZXRSKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5wcml2YXRlSWQgJiYgYmFzZS50eXBlICE9PSBcIlN1cGVyXCIpIHtcbiAgICAgIG5vZGUucHJvcGVydHkgPSB0aGlzLnBhcnNlUHJpdmF0ZUlkZW50KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vZGUucHJvcGVydHkgPSB0aGlzLnBhcnNlSWRlbnQodGhpcy5vcHRpb25zLmFsbG93UmVzZXJ2ZWQgIT09IFwibmV2ZXJcIik7XG4gICAgfVxuICAgIG5vZGUuY29tcHV0ZWQgPSAhIWNvbXB1dGVkO1xuICAgIGlmIChvcHRpb25hbFN1cHBvcnRlZCkge1xuICAgICAgbm9kZS5vcHRpb25hbCA9IG9wdGlvbmFsO1xuICAgIH1cbiAgICBiYXNlID0gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiTWVtYmVyRXhwcmVzc2lvblwiKTtcbiAgfSBlbHNlIGlmICghbm9DYWxscyAmJiB0aGlzLmVhdCh0eXBlcyQxLnBhcmVuTCkpIHtcbiAgICB2YXIgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycyA9IG5ldyBEZXN0cnVjdHVyaW5nRXJyb3JzLCBvbGRZaWVsZFBvcyA9IHRoaXMueWllbGRQb3MsIG9sZEF3YWl0UG9zID0gdGhpcy5hd2FpdFBvcywgb2xkQXdhaXRJZGVudFBvcyA9IHRoaXMuYXdhaXRJZGVudFBvcztcbiAgICB0aGlzLnlpZWxkUG9zID0gMDtcbiAgICB0aGlzLmF3YWl0UG9zID0gMDtcbiAgICB0aGlzLmF3YWl0SWRlbnRQb3MgPSAwO1xuICAgIHZhciBleHByTGlzdCA9IHRoaXMucGFyc2VFeHByTGlzdCh0eXBlcyQxLnBhcmVuUiwgdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDgsIGZhbHNlLCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKTtcbiAgICBpZiAobWF5YmVBc3luY0Fycm93ICYmICFvcHRpb25hbCAmJiB0aGlzLnNob3VsZFBhcnNlQXN5bmNBcnJvdygpKSB7XG4gICAgICB0aGlzLmNoZWNrUGF0dGVybkVycm9ycyhyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCBmYWxzZSk7XG4gICAgICB0aGlzLmNoZWNrWWllbGRBd2FpdEluRGVmYXVsdFBhcmFtcygpO1xuICAgICAgaWYgKHRoaXMuYXdhaXRJZGVudFBvcyA+IDApXG4gICAgICAgIHsgdGhpcy5yYWlzZSh0aGlzLmF3YWl0SWRlbnRQb3MsIFwiQ2Fubm90IHVzZSAnYXdhaXQnIGFzIGlkZW50aWZpZXIgaW5zaWRlIGFuIGFzeW5jIGZ1bmN0aW9uXCIpOyB9XG4gICAgICB0aGlzLnlpZWxkUG9zID0gb2xkWWllbGRQb3M7XG4gICAgICB0aGlzLmF3YWl0UG9zID0gb2xkQXdhaXRQb3M7XG4gICAgICB0aGlzLmF3YWl0SWRlbnRQb3MgPSBvbGRBd2FpdElkZW50UG9zO1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VTdWJzY3JpcHRBc3luY0Fycm93KHN0YXJ0UG9zLCBzdGFydExvYywgZXhwckxpc3QsIGZvckluaXQpXG4gICAgfVxuICAgIHRoaXMuY2hlY2tFeHByZXNzaW9uRXJyb3JzKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMsIHRydWUpO1xuICAgIHRoaXMueWllbGRQb3MgPSBvbGRZaWVsZFBvcyB8fCB0aGlzLnlpZWxkUG9zO1xuICAgIHRoaXMuYXdhaXRQb3MgPSBvbGRBd2FpdFBvcyB8fCB0aGlzLmF3YWl0UG9zO1xuICAgIHRoaXMuYXdhaXRJZGVudFBvcyA9IG9sZEF3YWl0SWRlbnRQb3MgfHwgdGhpcy5hd2FpdElkZW50UG9zO1xuICAgIHZhciBub2RlJDEgPSB0aGlzLnN0YXJ0Tm9kZUF0KHN0YXJ0UG9zLCBzdGFydExvYyk7XG4gICAgbm9kZSQxLmNhbGxlZSA9IGJhc2U7XG4gICAgbm9kZSQxLmFyZ3VtZW50cyA9IGV4cHJMaXN0O1xuICAgIGlmIChvcHRpb25hbFN1cHBvcnRlZCkge1xuICAgICAgbm9kZSQxLm9wdGlvbmFsID0gb3B0aW9uYWw7XG4gICAgfVxuICAgIGJhc2UgPSB0aGlzLmZpbmlzaE5vZGUobm9kZSQxLCBcIkNhbGxFeHByZXNzaW9uXCIpO1xuICB9IGVsc2UgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5iYWNrUXVvdGUpIHtcbiAgICBpZiAob3B0aW9uYWwgfHwgb3B0aW9uYWxDaGFpbmVkKSB7XG4gICAgICB0aGlzLnJhaXNlKHRoaXMuc3RhcnQsIFwiT3B0aW9uYWwgY2hhaW5pbmcgY2Fubm90IGFwcGVhciBpbiB0aGUgdGFnIG9mIHRhZ2dlZCB0ZW1wbGF0ZSBleHByZXNzaW9uc1wiKTtcbiAgICB9XG4gICAgdmFyIG5vZGUkMiA9IHRoaXMuc3RhcnROb2RlQXQoc3RhcnRQb3MsIHN0YXJ0TG9jKTtcbiAgICBub2RlJDIudGFnID0gYmFzZTtcbiAgICBub2RlJDIucXVhc2kgPSB0aGlzLnBhcnNlVGVtcGxhdGUoe2lzVGFnZ2VkOiB0cnVlfSk7XG4gICAgYmFzZSA9IHRoaXMuZmluaXNoTm9kZShub2RlJDIsIFwiVGFnZ2VkVGVtcGxhdGVFeHByZXNzaW9uXCIpO1xuICB9XG4gIHJldHVybiBiYXNlXG59O1xuXG4vLyBQYXJzZSBhbiBhdG9taWMgZXhwcmVzc2lvbiBcdTIwMTQgZWl0aGVyIGEgc2luZ2xlIHRva2VuIHRoYXQgaXMgYW5cbi8vIGV4cHJlc3Npb24sIGFuIGV4cHJlc3Npb24gc3RhcnRlZCBieSBhIGtleXdvcmQgbGlrZSBgZnVuY3Rpb25gIG9yXG4vLyBgbmV3YCwgb3IgYW4gZXhwcmVzc2lvbiB3cmFwcGVkIGluIHB1bmN0dWF0aW9uIGxpa2UgYCgpYCwgYFtdYCxcbi8vIG9yIGB7fWAuXG5cbnBwJDUucGFyc2VFeHByQXRvbSA9IGZ1bmN0aW9uKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMsIGZvckluaXQsIGZvck5ldykge1xuICAvLyBJZiBhIGRpdmlzaW9uIG9wZXJhdG9yIGFwcGVhcnMgaW4gYW4gZXhwcmVzc2lvbiBwb3NpdGlvbiwgdGhlXG4gIC8vIHRva2VuaXplciBnb3QgY29uZnVzZWQsIGFuZCB3ZSBmb3JjZSBpdCB0byByZWFkIGEgcmVnZXhwIGluc3RlYWQuXG4gIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuc2xhc2gpIHsgdGhpcy5yZWFkUmVnZXhwKCk7IH1cblxuICB2YXIgbm9kZSwgY2FuQmVBcnJvdyA9IHRoaXMucG90ZW50aWFsQXJyb3dBdCA9PT0gdGhpcy5zdGFydDtcbiAgc3dpdGNoICh0aGlzLnR5cGUpIHtcbiAgY2FzZSB0eXBlcyQxLl9zdXBlcjpcbiAgICBpZiAoIXRoaXMuYWxsb3dTdXBlcilcbiAgICAgIHsgdGhpcy5yYWlzZSh0aGlzLnN0YXJ0LCBcIidzdXBlcicga2V5d29yZCBvdXRzaWRlIGEgbWV0aG9kXCIpOyB9XG4gICAgbm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gICAgdGhpcy5uZXh0KCk7XG4gICAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5wYXJlbkwgJiYgIXRoaXMuYWxsb3dEaXJlY3RTdXBlcilcbiAgICAgIHsgdGhpcy5yYWlzZShub2RlLnN0YXJ0LCBcInN1cGVyKCkgY2FsbCBvdXRzaWRlIGNvbnN0cnVjdG9yIG9mIGEgc3ViY2xhc3NcIik7IH1cbiAgICAvLyBUaGUgYHN1cGVyYCBrZXl3b3JkIGNhbiBhcHBlYXIgYXQgYmVsb3c6XG4gICAgLy8gU3VwZXJQcm9wZXJ0eTpcbiAgICAvLyAgICAgc3VwZXIgWyBFeHByZXNzaW9uIF1cbiAgICAvLyAgICAgc3VwZXIgLiBJZGVudGlmaWVyTmFtZVxuICAgIC8vIFN1cGVyQ2FsbDpcbiAgICAvLyAgICAgc3VwZXIgKCBBcmd1bWVudHMgKVxuICAgIGlmICh0aGlzLnR5cGUgIT09IHR5cGVzJDEuZG90ICYmIHRoaXMudHlwZSAhPT0gdHlwZXMkMS5icmFja2V0TCAmJiB0aGlzLnR5cGUgIT09IHR5cGVzJDEucGFyZW5MKVxuICAgICAgeyB0aGlzLnVuZXhwZWN0ZWQoKTsgfVxuICAgIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJTdXBlclwiKVxuXG4gIGNhc2UgdHlwZXMkMS5fdGhpczpcbiAgICBub2RlID0gdGhpcy5zdGFydE5vZGUoKTtcbiAgICB0aGlzLm5leHQoKTtcbiAgICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiVGhpc0V4cHJlc3Npb25cIilcblxuICBjYXNlIHR5cGVzJDEubmFtZTpcbiAgICB2YXIgc3RhcnRQb3MgPSB0aGlzLnN0YXJ0LCBzdGFydExvYyA9IHRoaXMuc3RhcnRMb2MsIGNvbnRhaW5zRXNjID0gdGhpcy5jb250YWluc0VzYztcbiAgICB2YXIgaWQgPSB0aGlzLnBhcnNlSWRlbnQoZmFsc2UpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOCAmJiAhY29udGFpbnNFc2MgJiYgaWQubmFtZSA9PT0gXCJhc3luY1wiICYmICF0aGlzLmNhbkluc2VydFNlbWljb2xvbigpICYmIHRoaXMuZWF0KHR5cGVzJDEuX2Z1bmN0aW9uKSkge1xuICAgICAgdGhpcy5vdmVycmlkZUNvbnRleHQodHlwZXMuZl9leHByKTtcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlRnVuY3Rpb24odGhpcy5zdGFydE5vZGVBdChzdGFydFBvcywgc3RhcnRMb2MpLCAwLCBmYWxzZSwgdHJ1ZSwgZm9ySW5pdClcbiAgICB9XG4gICAgaWYgKGNhbkJlQXJyb3cgJiYgIXRoaXMuY2FuSW5zZXJ0U2VtaWNvbG9uKCkpIHtcbiAgICAgIGlmICh0aGlzLmVhdCh0eXBlcyQxLmFycm93KSlcbiAgICAgICAgeyByZXR1cm4gdGhpcy5wYXJzZUFycm93RXhwcmVzc2lvbih0aGlzLnN0YXJ0Tm9kZUF0KHN0YXJ0UG9zLCBzdGFydExvYyksIFtpZF0sIGZhbHNlLCBmb3JJbml0KSB9XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDggJiYgaWQubmFtZSA9PT0gXCJhc3luY1wiICYmIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5uYW1lICYmICFjb250YWluc0VzYyAmJlxuICAgICAgICAgICghdGhpcy5wb3RlbnRpYWxBcnJvd0luRm9yQXdhaXQgfHwgdGhpcy52YWx1ZSAhPT0gXCJvZlwiIHx8IHRoaXMuY29udGFpbnNFc2MpKSB7XG4gICAgICAgIGlkID0gdGhpcy5wYXJzZUlkZW50KGZhbHNlKTtcbiAgICAgICAgaWYgKHRoaXMuY2FuSW5zZXJ0U2VtaWNvbG9uKCkgfHwgIXRoaXMuZWF0KHR5cGVzJDEuYXJyb3cpKVxuICAgICAgICAgIHsgdGhpcy51bmV4cGVjdGVkKCk7IH1cbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VBcnJvd0V4cHJlc3Npb24odGhpcy5zdGFydE5vZGVBdChzdGFydFBvcywgc3RhcnRMb2MpLCBbaWRdLCB0cnVlLCBmb3JJbml0KVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaWRcblxuICBjYXNlIHR5cGVzJDEucmVnZXhwOlxuICAgIHZhciB2YWx1ZSA9IHRoaXMudmFsdWU7XG4gICAgbm9kZSA9IHRoaXMucGFyc2VMaXRlcmFsKHZhbHVlLnZhbHVlKTtcbiAgICBub2RlLnJlZ2V4ID0ge3BhdHRlcm46IHZhbHVlLnBhdHRlcm4sIGZsYWdzOiB2YWx1ZS5mbGFnc307XG4gICAgcmV0dXJuIG5vZGVcblxuICBjYXNlIHR5cGVzJDEubnVtOiBjYXNlIHR5cGVzJDEuc3RyaW5nOlxuICAgIHJldHVybiB0aGlzLnBhcnNlTGl0ZXJhbCh0aGlzLnZhbHVlKVxuXG4gIGNhc2UgdHlwZXMkMS5fbnVsbDogY2FzZSB0eXBlcyQxLl90cnVlOiBjYXNlIHR5cGVzJDEuX2ZhbHNlOlxuICAgIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICAgIG5vZGUudmFsdWUgPSB0aGlzLnR5cGUgPT09IHR5cGVzJDEuX251bGwgPyBudWxsIDogdGhpcy50eXBlID09PSB0eXBlcyQxLl90cnVlO1xuICAgIG5vZGUucmF3ID0gdGhpcy50eXBlLmtleXdvcmQ7XG4gICAgdGhpcy5uZXh0KCk7XG4gICAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIkxpdGVyYWxcIilcblxuICBjYXNlIHR5cGVzJDEucGFyZW5MOlxuICAgIHZhciBzdGFydCA9IHRoaXMuc3RhcnQsIGV4cHIgPSB0aGlzLnBhcnNlUGFyZW5BbmREaXN0aW5ndWlzaEV4cHJlc3Npb24oY2FuQmVBcnJvdywgZm9ySW5pdCk7XG4gICAgaWYgKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpIHtcbiAgICAgIGlmIChyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnBhcmVudGhlc2l6ZWRBc3NpZ24gPCAwICYmICF0aGlzLmlzU2ltcGxlQXNzaWduVGFyZ2V0KGV4cHIpKVxuICAgICAgICB7IHJlZkRlc3RydWN0dXJpbmdFcnJvcnMucGFyZW50aGVzaXplZEFzc2lnbiA9IHN0YXJ0OyB9XG4gICAgICBpZiAocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy5wYXJlbnRoZXNpemVkQmluZCA8IDApXG4gICAgICAgIHsgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy5wYXJlbnRoZXNpemVkQmluZCA9IHN0YXJ0OyB9XG4gICAgfVxuICAgIHJldHVybiBleHByXG5cbiAgY2FzZSB0eXBlcyQxLmJyYWNrZXRMOlxuICAgIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICAgIHRoaXMubmV4dCgpO1xuICAgIG5vZGUuZWxlbWVudHMgPSB0aGlzLnBhcnNlRXhwckxpc3QodHlwZXMkMS5icmFja2V0UiwgdHJ1ZSwgdHJ1ZSwgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycyk7XG4gICAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIkFycmF5RXhwcmVzc2lvblwiKVxuXG4gIGNhc2UgdHlwZXMkMS5icmFjZUw6XG4gICAgdGhpcy5vdmVycmlkZUNvbnRleHQodHlwZXMuYl9leHByKTtcbiAgICByZXR1cm4gdGhpcy5wYXJzZU9iaihmYWxzZSwgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycylcblxuICBjYXNlIHR5cGVzJDEuX2Z1bmN0aW9uOlxuICAgIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICAgIHRoaXMubmV4dCgpO1xuICAgIHJldHVybiB0aGlzLnBhcnNlRnVuY3Rpb24obm9kZSwgMClcblxuICBjYXNlIHR5cGVzJDEuX2NsYXNzOlxuICAgIHJldHVybiB0aGlzLnBhcnNlQ2xhc3ModGhpcy5zdGFydE5vZGUoKSwgZmFsc2UpXG5cbiAgY2FzZSB0eXBlcyQxLl9uZXc6XG4gICAgcmV0dXJuIHRoaXMucGFyc2VOZXcoKVxuXG4gIGNhc2UgdHlwZXMkMS5iYWNrUXVvdGU6XG4gICAgcmV0dXJuIHRoaXMucGFyc2VUZW1wbGF0ZSgpXG5cbiAgY2FzZSB0eXBlcyQxLl9pbXBvcnQ6XG4gICAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSAxMSkge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VFeHBySW1wb3J0KGZvck5ldylcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMudW5leHBlY3RlZCgpXG4gICAgfVxuXG4gIGRlZmF1bHQ6XG4gICAgcmV0dXJuIHRoaXMucGFyc2VFeHByQXRvbURlZmF1bHQoKVxuICB9XG59O1xuXG5wcCQ1LnBhcnNlRXhwckF0b21EZWZhdWx0ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMudW5leHBlY3RlZCgpO1xufTtcblxucHAkNS5wYXJzZUV4cHJJbXBvcnQgPSBmdW5jdGlvbihmb3JOZXcpIHtcbiAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuXG4gIC8vIENvbnN1bWUgYGltcG9ydGAgYXMgYW4gaWRlbnRpZmllciBmb3IgYGltcG9ydC5tZXRhYC5cbiAgLy8gQmVjYXVzZSBgdGhpcy5wYXJzZUlkZW50KHRydWUpYCBkb2Vzbid0IGNoZWNrIGVzY2FwZSBzZXF1ZW5jZXMsIGl0IG5lZWRzIHRoZSBjaGVjayBvZiBgdGhpcy5jb250YWluc0VzY2AuXG4gIGlmICh0aGlzLmNvbnRhaW5zRXNjKSB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZSh0aGlzLnN0YXJ0LCBcIkVzY2FwZSBzZXF1ZW5jZSBpbiBrZXl3b3JkIGltcG9ydFwiKTsgfVxuICB0aGlzLm5leHQoKTtcblxuICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLnBhcmVuTCAmJiAhZm9yTmV3KSB7XG4gICAgcmV0dXJuIHRoaXMucGFyc2VEeW5hbWljSW1wb3J0KG5vZGUpXG4gIH0gZWxzZSBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLmRvdCkge1xuICAgIHZhciBtZXRhID0gdGhpcy5zdGFydE5vZGVBdChub2RlLnN0YXJ0LCBub2RlLmxvYyAmJiBub2RlLmxvYy5zdGFydCk7XG4gICAgbWV0YS5uYW1lID0gXCJpbXBvcnRcIjtcbiAgICBub2RlLm1ldGEgPSB0aGlzLmZpbmlzaE5vZGUobWV0YSwgXCJJZGVudGlmaWVyXCIpO1xuICAgIHJldHVybiB0aGlzLnBhcnNlSW1wb3J0TWV0YShub2RlKVxuICB9IGVsc2Uge1xuICAgIHRoaXMudW5leHBlY3RlZCgpO1xuICB9XG59O1xuXG5wcCQ1LnBhcnNlRHluYW1pY0ltcG9ydCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgdGhpcy5uZXh0KCk7IC8vIHNraXAgYChgXG5cbiAgLy8gUGFyc2Ugbm9kZS5zb3VyY2UuXG4gIG5vZGUuc291cmNlID0gdGhpcy5wYXJzZU1heWJlQXNzaWduKCk7XG5cbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSAxNikge1xuICAgIGlmICghdGhpcy5lYXQodHlwZXMkMS5wYXJlblIpKSB7XG4gICAgICB0aGlzLmV4cGVjdCh0eXBlcyQxLmNvbW1hKTtcbiAgICAgIGlmICghdGhpcy5hZnRlclRyYWlsaW5nQ29tbWEodHlwZXMkMS5wYXJlblIpKSB7XG4gICAgICAgIG5vZGUub3B0aW9ucyA9IHRoaXMucGFyc2VNYXliZUFzc2lnbigpO1xuICAgICAgICBpZiAoIXRoaXMuZWF0KHR5cGVzJDEucGFyZW5SKSkge1xuICAgICAgICAgIHRoaXMuZXhwZWN0KHR5cGVzJDEuY29tbWEpO1xuICAgICAgICAgIGlmICghdGhpcy5hZnRlclRyYWlsaW5nQ29tbWEodHlwZXMkMS5wYXJlblIpKSB7XG4gICAgICAgICAgICB0aGlzLnVuZXhwZWN0ZWQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5vZGUub3B0aW9ucyA9IG51bGw7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vZGUub3B0aW9ucyA9IG51bGw7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIFZlcmlmeSBlbmRpbmcuXG4gICAgaWYgKCF0aGlzLmVhdCh0eXBlcyQxLnBhcmVuUikpIHtcbiAgICAgIHZhciBlcnJvclBvcyA9IHRoaXMuc3RhcnQ7XG4gICAgICBpZiAodGhpcy5lYXQodHlwZXMkMS5jb21tYSkgJiYgdGhpcy5lYXQodHlwZXMkMS5wYXJlblIpKSB7XG4gICAgICAgIHRoaXMucmFpc2VSZWNvdmVyYWJsZShlcnJvclBvcywgXCJUcmFpbGluZyBjb21tYSBpcyBub3QgYWxsb3dlZCBpbiBpbXBvcnQoKVwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudW5leHBlY3RlZChlcnJvclBvcyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIkltcG9ydEV4cHJlc3Npb25cIilcbn07XG5cbnBwJDUucGFyc2VJbXBvcnRNZXRhID0gZnVuY3Rpb24obm9kZSkge1xuICB0aGlzLm5leHQoKTsgLy8gc2tpcCBgLmBcblxuICB2YXIgY29udGFpbnNFc2MgPSB0aGlzLmNvbnRhaW5zRXNjO1xuICBub2RlLnByb3BlcnR5ID0gdGhpcy5wYXJzZUlkZW50KHRydWUpO1xuXG4gIGlmIChub2RlLnByb3BlcnR5Lm5hbWUgIT09IFwibWV0YVwiKVxuICAgIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKG5vZGUucHJvcGVydHkuc3RhcnQsIFwiVGhlIG9ubHkgdmFsaWQgbWV0YSBwcm9wZXJ0eSBmb3IgaW1wb3J0IGlzICdpbXBvcnQubWV0YSdcIik7IH1cbiAgaWYgKGNvbnRhaW5zRXNjKVxuICAgIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKG5vZGUuc3RhcnQsIFwiJ2ltcG9ydC5tZXRhJyBtdXN0IG5vdCBjb250YWluIGVzY2FwZWQgY2hhcmFjdGVyc1wiKTsgfVxuICBpZiAodGhpcy5vcHRpb25zLnNvdXJjZVR5cGUgIT09IFwibW9kdWxlXCIgJiYgIXRoaXMub3B0aW9ucy5hbGxvd0ltcG9ydEV4cG9ydEV2ZXJ5d2hlcmUpXG4gICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUobm9kZS5zdGFydCwgXCJDYW5ub3QgdXNlICdpbXBvcnQubWV0YScgb3V0c2lkZSBhIG1vZHVsZVwiKTsgfVxuXG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJNZXRhUHJvcGVydHlcIilcbn07XG5cbnBwJDUucGFyc2VMaXRlcmFsID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICBub2RlLnZhbHVlID0gdmFsdWU7XG4gIG5vZGUucmF3ID0gdGhpcy5pbnB1dC5zbGljZSh0aGlzLnN0YXJ0LCB0aGlzLmVuZCk7XG4gIGlmIChub2RlLnJhdy5jaGFyQ29kZUF0KG5vZGUucmF3Lmxlbmd0aCAtIDEpID09PSAxMTApXG4gICAgeyBub2RlLmJpZ2ludCA9IG5vZGUudmFsdWUgIT0gbnVsbCA/IG5vZGUudmFsdWUudG9TdHJpbmcoKSA6IG5vZGUucmF3LnNsaWNlKDAsIC0xKS5yZXBsYWNlKC9fL2csIFwiXCIpOyB9XG4gIHRoaXMubmV4dCgpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiTGl0ZXJhbFwiKVxufTtcblxucHAkNS5wYXJzZVBhcmVuRXhwcmVzc2lvbiA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmV4cGVjdCh0eXBlcyQxLnBhcmVuTCk7XG4gIHZhciB2YWwgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICB0aGlzLmV4cGVjdCh0eXBlcyQxLnBhcmVuUik7XG4gIHJldHVybiB2YWxcbn07XG5cbnBwJDUuc2hvdWxkUGFyc2VBcnJvdyA9IGZ1bmN0aW9uKGV4cHJMaXN0KSB7XG4gIHJldHVybiAhdGhpcy5jYW5JbnNlcnRTZW1pY29sb24oKVxufTtcblxucHAkNS5wYXJzZVBhcmVuQW5kRGlzdGluZ3Vpc2hFeHByZXNzaW9uID0gZnVuY3Rpb24oY2FuQmVBcnJvdywgZm9ySW5pdCkge1xuICB2YXIgc3RhcnRQb3MgPSB0aGlzLnN0YXJ0LCBzdGFydExvYyA9IHRoaXMuc3RhcnRMb2MsIHZhbCwgYWxsb3dUcmFpbGluZ0NvbW1hID0gdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDg7XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNikge1xuICAgIHRoaXMubmV4dCgpO1xuXG4gICAgdmFyIGlubmVyU3RhcnRQb3MgPSB0aGlzLnN0YXJ0LCBpbm5lclN0YXJ0TG9jID0gdGhpcy5zdGFydExvYztcbiAgICB2YXIgZXhwckxpc3QgPSBbXSwgZmlyc3QgPSB0cnVlLCBsYXN0SXNDb21tYSA9IGZhbHNlO1xuICAgIHZhciByZWZEZXN0cnVjdHVyaW5nRXJyb3JzID0gbmV3IERlc3RydWN0dXJpbmdFcnJvcnMsIG9sZFlpZWxkUG9zID0gdGhpcy55aWVsZFBvcywgb2xkQXdhaXRQb3MgPSB0aGlzLmF3YWl0UG9zLCBzcHJlYWRTdGFydDtcbiAgICB0aGlzLnlpZWxkUG9zID0gMDtcbiAgICB0aGlzLmF3YWl0UG9zID0gMDtcbiAgICAvLyBEbyBub3Qgc2F2ZSBhd2FpdElkZW50UG9zIHRvIGFsbG93IGNoZWNraW5nIGF3YWl0cyBuZXN0ZWQgaW4gcGFyYW1ldGVyc1xuICAgIHdoaWxlICh0aGlzLnR5cGUgIT09IHR5cGVzJDEucGFyZW5SKSB7XG4gICAgICBmaXJzdCA/IGZpcnN0ID0gZmFsc2UgOiB0aGlzLmV4cGVjdCh0eXBlcyQxLmNvbW1hKTtcbiAgICAgIGlmIChhbGxvd1RyYWlsaW5nQ29tbWEgJiYgdGhpcy5hZnRlclRyYWlsaW5nQ29tbWEodHlwZXMkMS5wYXJlblIsIHRydWUpKSB7XG4gICAgICAgIGxhc3RJc0NvbW1hID0gdHJ1ZTtcbiAgICAgICAgYnJlYWtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLmVsbGlwc2lzKSB7XG4gICAgICAgIHNwcmVhZFN0YXJ0ID0gdGhpcy5zdGFydDtcbiAgICAgICAgZXhwckxpc3QucHVzaCh0aGlzLnBhcnNlUGFyZW5JdGVtKHRoaXMucGFyc2VSZXN0QmluZGluZygpKSk7XG4gICAgICAgIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuY29tbWEpIHtcbiAgICAgICAgICB0aGlzLnJhaXNlUmVjb3ZlcmFibGUoXG4gICAgICAgICAgICB0aGlzLnN0YXJ0LFxuICAgICAgICAgICAgXCJDb21tYSBpcyBub3QgcGVybWl0dGVkIGFmdGVyIHRoZSByZXN0IGVsZW1lbnRcIlxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGV4cHJMaXN0LnB1c2godGhpcy5wYXJzZU1heWJlQXNzaWduKGZhbHNlLCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCB0aGlzLnBhcnNlUGFyZW5JdGVtKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBpbm5lckVuZFBvcyA9IHRoaXMubGFzdFRva0VuZCwgaW5uZXJFbmRMb2MgPSB0aGlzLmxhc3RUb2tFbmRMb2M7XG4gICAgdGhpcy5leHBlY3QodHlwZXMkMS5wYXJlblIpO1xuXG4gICAgaWYgKGNhbkJlQXJyb3cgJiYgdGhpcy5zaG91bGRQYXJzZUFycm93KGV4cHJMaXN0KSAmJiB0aGlzLmVhdCh0eXBlcyQxLmFycm93KSkge1xuICAgICAgdGhpcy5jaGVja1BhdHRlcm5FcnJvcnMocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycywgZmFsc2UpO1xuICAgICAgdGhpcy5jaGVja1lpZWxkQXdhaXRJbkRlZmF1bHRQYXJhbXMoKTtcbiAgICAgIHRoaXMueWllbGRQb3MgPSBvbGRZaWVsZFBvcztcbiAgICAgIHRoaXMuYXdhaXRQb3MgPSBvbGRBd2FpdFBvcztcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlUGFyZW5BcnJvd0xpc3Qoc3RhcnRQb3MsIHN0YXJ0TG9jLCBleHByTGlzdCwgZm9ySW5pdClcbiAgICB9XG5cbiAgICBpZiAoIWV4cHJMaXN0Lmxlbmd0aCB8fCBsYXN0SXNDb21tYSkgeyB0aGlzLnVuZXhwZWN0ZWQodGhpcy5sYXN0VG9rU3RhcnQpOyB9XG4gICAgaWYgKHNwcmVhZFN0YXJ0KSB7IHRoaXMudW5leHBlY3RlZChzcHJlYWRTdGFydCk7IH1cbiAgICB0aGlzLmNoZWNrRXhwcmVzc2lvbkVycm9ycyhyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCB0cnVlKTtcbiAgICB0aGlzLnlpZWxkUG9zID0gb2xkWWllbGRQb3MgfHwgdGhpcy55aWVsZFBvcztcbiAgICB0aGlzLmF3YWl0UG9zID0gb2xkQXdhaXRQb3MgfHwgdGhpcy5hd2FpdFBvcztcblxuICAgIGlmIChleHByTGlzdC5sZW5ndGggPiAxKSB7XG4gICAgICB2YWwgPSB0aGlzLnN0YXJ0Tm9kZUF0KGlubmVyU3RhcnRQb3MsIGlubmVyU3RhcnRMb2MpO1xuICAgICAgdmFsLmV4cHJlc3Npb25zID0gZXhwckxpc3Q7XG4gICAgICB0aGlzLmZpbmlzaE5vZGVBdCh2YWwsIFwiU2VxdWVuY2VFeHByZXNzaW9uXCIsIGlubmVyRW5kUG9zLCBpbm5lckVuZExvYyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbCA9IGV4cHJMaXN0WzBdO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YWwgPSB0aGlzLnBhcnNlUGFyZW5FeHByZXNzaW9uKCk7XG4gIH1cblxuICBpZiAodGhpcy5vcHRpb25zLnByZXNlcnZlUGFyZW5zKSB7XG4gICAgdmFyIHBhciA9IHRoaXMuc3RhcnROb2RlQXQoc3RhcnRQb3MsIHN0YXJ0TG9jKTtcbiAgICBwYXIuZXhwcmVzc2lvbiA9IHZhbDtcbiAgICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKHBhciwgXCJQYXJlbnRoZXNpemVkRXhwcmVzc2lvblwiKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiB2YWxcbiAgfVxufTtcblxucHAkNS5wYXJzZVBhcmVuSXRlbSA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgcmV0dXJuIGl0ZW1cbn07XG5cbnBwJDUucGFyc2VQYXJlbkFycm93TGlzdCA9IGZ1bmN0aW9uKHN0YXJ0UG9zLCBzdGFydExvYywgZXhwckxpc3QsIGZvckluaXQpIHtcbiAgcmV0dXJuIHRoaXMucGFyc2VBcnJvd0V4cHJlc3Npb24odGhpcy5zdGFydE5vZGVBdChzdGFydFBvcywgc3RhcnRMb2MpLCBleHByTGlzdCwgZmFsc2UsIGZvckluaXQpXG59O1xuXG4vLyBOZXcncyBwcmVjZWRlbmNlIGlzIHNsaWdodGx5IHRyaWNreS4gSXQgbXVzdCBhbGxvdyBpdHMgYXJndW1lbnQgdG9cbi8vIGJlIGEgYFtdYCBvciBkb3Qgc3Vic2NyaXB0IGV4cHJlc3Npb24sIGJ1dCBub3QgYSBjYWxsIFx1MjAxNCBhdCBsZWFzdCxcbi8vIG5vdCB3aXRob3V0IHdyYXBwaW5nIGl0IGluIHBhcmVudGhlc2VzLiBUaHVzLCBpdCB1c2VzIHRoZSBub0NhbGxzXG4vLyBhcmd1bWVudCB0byBwYXJzZVN1YnNjcmlwdHMgdG8gcHJldmVudCBpdCBmcm9tIGNvbnN1bWluZyB0aGVcbi8vIGFyZ3VtZW50IGxpc3QuXG5cbnZhciBlbXB0eSA9IFtdO1xuXG5wcCQ1LnBhcnNlTmV3ID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmNvbnRhaW5zRXNjKSB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZSh0aGlzLnN0YXJ0LCBcIkVzY2FwZSBzZXF1ZW5jZSBpbiBrZXl3b3JkIG5ld1wiKTsgfVxuICB2YXIgbm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gIHRoaXMubmV4dCgpO1xuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDYgJiYgdGhpcy50eXBlID09PSB0eXBlcyQxLmRvdCkge1xuICAgIHZhciBtZXRhID0gdGhpcy5zdGFydE5vZGVBdChub2RlLnN0YXJ0LCBub2RlLmxvYyAmJiBub2RlLmxvYy5zdGFydCk7XG4gICAgbWV0YS5uYW1lID0gXCJuZXdcIjtcbiAgICBub2RlLm1ldGEgPSB0aGlzLmZpbmlzaE5vZGUobWV0YSwgXCJJZGVudGlmaWVyXCIpO1xuICAgIHRoaXMubmV4dCgpO1xuICAgIHZhciBjb250YWluc0VzYyA9IHRoaXMuY29udGFpbnNFc2M7XG4gICAgbm9kZS5wcm9wZXJ0eSA9IHRoaXMucGFyc2VJZGVudCh0cnVlKTtcbiAgICBpZiAobm9kZS5wcm9wZXJ0eS5uYW1lICE9PSBcInRhcmdldFwiKVxuICAgICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUobm9kZS5wcm9wZXJ0eS5zdGFydCwgXCJUaGUgb25seSB2YWxpZCBtZXRhIHByb3BlcnR5IGZvciBuZXcgaXMgJ25ldy50YXJnZXQnXCIpOyB9XG4gICAgaWYgKGNvbnRhaW5zRXNjKVxuICAgICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUobm9kZS5zdGFydCwgXCInbmV3LnRhcmdldCcgbXVzdCBub3QgY29udGFpbiBlc2NhcGVkIGNoYXJhY3RlcnNcIik7IH1cbiAgICBpZiAoIXRoaXMuYWxsb3dOZXdEb3RUYXJnZXQpXG4gICAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShub2RlLnN0YXJ0LCBcIiduZXcudGFyZ2V0JyBjYW4gb25seSBiZSB1c2VkIGluIGZ1bmN0aW9ucyBhbmQgY2xhc3Mgc3RhdGljIGJsb2NrXCIpOyB9XG4gICAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIk1ldGFQcm9wZXJ0eVwiKVxuICB9XG4gIHZhciBzdGFydFBvcyA9IHRoaXMuc3RhcnQsIHN0YXJ0TG9jID0gdGhpcy5zdGFydExvYztcbiAgbm9kZS5jYWxsZWUgPSB0aGlzLnBhcnNlU3Vic2NyaXB0cyh0aGlzLnBhcnNlRXhwckF0b20obnVsbCwgZmFsc2UsIHRydWUpLCBzdGFydFBvcywgc3RhcnRMb2MsIHRydWUsIGZhbHNlKTtcbiAgaWYgKHRoaXMuZWF0KHR5cGVzJDEucGFyZW5MKSkgeyBub2RlLmFyZ3VtZW50cyA9IHRoaXMucGFyc2VFeHByTGlzdCh0eXBlcyQxLnBhcmVuUiwgdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDgsIGZhbHNlKTsgfVxuICBlbHNlIHsgbm9kZS5hcmd1bWVudHMgPSBlbXB0eTsgfVxuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiTmV3RXhwcmVzc2lvblwiKVxufTtcblxuLy8gUGFyc2UgdGVtcGxhdGUgZXhwcmVzc2lvbi5cblxucHAkNS5wYXJzZVRlbXBsYXRlRWxlbWVudCA9IGZ1bmN0aW9uKHJlZikge1xuICB2YXIgaXNUYWdnZWQgPSByZWYuaXNUYWdnZWQ7XG5cbiAgdmFyIGVsZW0gPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLmludmFsaWRUZW1wbGF0ZSkge1xuICAgIGlmICghaXNUYWdnZWQpIHtcbiAgICAgIHRoaXMucmFpc2VSZWNvdmVyYWJsZSh0aGlzLnN0YXJ0LCBcIkJhZCBlc2NhcGUgc2VxdWVuY2UgaW4gdW50YWdnZWQgdGVtcGxhdGUgbGl0ZXJhbFwiKTtcbiAgICB9XG4gICAgZWxlbS52YWx1ZSA9IHtcbiAgICAgIHJhdzogdGhpcy52YWx1ZS5yZXBsYWNlKC9cXHJcXG4/L2csIFwiXFxuXCIpLFxuICAgICAgY29va2VkOiBudWxsXG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBlbGVtLnZhbHVlID0ge1xuICAgICAgcmF3OiB0aGlzLmlucHV0LnNsaWNlKHRoaXMuc3RhcnQsIHRoaXMuZW5kKS5yZXBsYWNlKC9cXHJcXG4/L2csIFwiXFxuXCIpLFxuICAgICAgY29va2VkOiB0aGlzLnZhbHVlXG4gICAgfTtcbiAgfVxuICB0aGlzLm5leHQoKTtcbiAgZWxlbS50YWlsID0gdGhpcy50eXBlID09PSB0eXBlcyQxLmJhY2tRdW90ZTtcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShlbGVtLCBcIlRlbXBsYXRlRWxlbWVudFwiKVxufTtcblxucHAkNS5wYXJzZVRlbXBsYXRlID0gZnVuY3Rpb24ocmVmKSB7XG4gIGlmICggcmVmID09PSB2b2lkIDAgKSByZWYgPSB7fTtcbiAgdmFyIGlzVGFnZ2VkID0gcmVmLmlzVGFnZ2VkOyBpZiAoIGlzVGFnZ2VkID09PSB2b2lkIDAgKSBpc1RhZ2dlZCA9IGZhbHNlO1xuXG4gIHZhciBub2RlID0gdGhpcy5zdGFydE5vZGUoKTtcbiAgdGhpcy5uZXh0KCk7XG4gIG5vZGUuZXhwcmVzc2lvbnMgPSBbXTtcbiAgdmFyIGN1ckVsdCA9IHRoaXMucGFyc2VUZW1wbGF0ZUVsZW1lbnQoe2lzVGFnZ2VkOiBpc1RhZ2dlZH0pO1xuICBub2RlLnF1YXNpcyA9IFtjdXJFbHRdO1xuICB3aGlsZSAoIWN1ckVsdC50YWlsKSB7XG4gICAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5lb2YpIHsgdGhpcy5yYWlzZSh0aGlzLnBvcywgXCJVbnRlcm1pbmF0ZWQgdGVtcGxhdGUgbGl0ZXJhbFwiKTsgfVxuICAgIHRoaXMuZXhwZWN0KHR5cGVzJDEuZG9sbGFyQnJhY2VMKTtcbiAgICBub2RlLmV4cHJlc3Npb25zLnB1c2godGhpcy5wYXJzZUV4cHJlc3Npb24oKSk7XG4gICAgdGhpcy5leHBlY3QodHlwZXMkMS5icmFjZVIpO1xuICAgIG5vZGUucXVhc2lzLnB1c2goY3VyRWx0ID0gdGhpcy5wYXJzZVRlbXBsYXRlRWxlbWVudCh7aXNUYWdnZWQ6IGlzVGFnZ2VkfSkpO1xuICB9XG4gIHRoaXMubmV4dCgpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiVGVtcGxhdGVMaXRlcmFsXCIpXG59O1xuXG5wcCQ1LmlzQXN5bmNQcm9wID0gZnVuY3Rpb24ocHJvcCkge1xuICByZXR1cm4gIXByb3AuY29tcHV0ZWQgJiYgcHJvcC5rZXkudHlwZSA9PT0gXCJJZGVudGlmaWVyXCIgJiYgcHJvcC5rZXkubmFtZSA9PT0gXCJhc3luY1wiICYmXG4gICAgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5uYW1lIHx8IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5udW0gfHwgdGhpcy50eXBlID09PSB0eXBlcyQxLnN0cmluZyB8fCB0aGlzLnR5cGUgPT09IHR5cGVzJDEuYnJhY2tldEwgfHwgdGhpcy50eXBlLmtleXdvcmQgfHwgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA5ICYmIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5zdGFyKSkgJiZcbiAgICAhbGluZUJyZWFrLnRlc3QodGhpcy5pbnB1dC5zbGljZSh0aGlzLmxhc3RUb2tFbmQsIHRoaXMuc3RhcnQpKVxufTtcblxuLy8gUGFyc2UgYW4gb2JqZWN0IGxpdGVyYWwgb3IgYmluZGluZyBwYXR0ZXJuLlxuXG5wcCQ1LnBhcnNlT2JqID0gZnVuY3Rpb24oaXNQYXR0ZXJuLCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKSB7XG4gIHZhciBub2RlID0gdGhpcy5zdGFydE5vZGUoKSwgZmlyc3QgPSB0cnVlLCBwcm9wSGFzaCA9IHt9O1xuICBub2RlLnByb3BlcnRpZXMgPSBbXTtcbiAgdGhpcy5uZXh0KCk7XG4gIHdoaWxlICghdGhpcy5lYXQodHlwZXMkMS5icmFjZVIpKSB7XG4gICAgaWYgKCFmaXJzdCkge1xuICAgICAgdGhpcy5leHBlY3QodHlwZXMkMS5jb21tYSk7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDUgJiYgdGhpcy5hZnRlclRyYWlsaW5nQ29tbWEodHlwZXMkMS5icmFjZVIpKSB7IGJyZWFrIH1cbiAgICB9IGVsc2UgeyBmaXJzdCA9IGZhbHNlOyB9XG5cbiAgICB2YXIgcHJvcCA9IHRoaXMucGFyc2VQcm9wZXJ0eShpc1BhdHRlcm4sIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpO1xuICAgIGlmICghaXNQYXR0ZXJuKSB7IHRoaXMuY2hlY2tQcm9wQ2xhc2gocHJvcCwgcHJvcEhhc2gsIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpOyB9XG4gICAgbm9kZS5wcm9wZXJ0aWVzLnB1c2gocHJvcCk7XG4gIH1cbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBpc1BhdHRlcm4gPyBcIk9iamVjdFBhdHRlcm5cIiA6IFwiT2JqZWN0RXhwcmVzc2lvblwiKVxufTtcblxucHAkNS5wYXJzZVByb3BlcnR5ID0gZnVuY3Rpb24oaXNQYXR0ZXJuLCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKSB7XG4gIHZhciBwcm9wID0gdGhpcy5zdGFydE5vZGUoKSwgaXNHZW5lcmF0b3IsIGlzQXN5bmMsIHN0YXJ0UG9zLCBzdGFydExvYztcbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA5ICYmIHRoaXMuZWF0KHR5cGVzJDEuZWxsaXBzaXMpKSB7XG4gICAgaWYgKGlzUGF0dGVybikge1xuICAgICAgcHJvcC5hcmd1bWVudCA9IHRoaXMucGFyc2VJZGVudChmYWxzZSk7XG4gICAgICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLmNvbW1hKSB7XG4gICAgICAgIHRoaXMucmFpc2VSZWNvdmVyYWJsZSh0aGlzLnN0YXJ0LCBcIkNvbW1hIGlzIG5vdCBwZXJtaXR0ZWQgYWZ0ZXIgdGhlIHJlc3QgZWxlbWVudFwiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmZpbmlzaE5vZGUocHJvcCwgXCJSZXN0RWxlbWVudFwiKVxuICAgIH1cbiAgICAvLyBQYXJzZSBhcmd1bWVudC5cbiAgICBwcm9wLmFyZ3VtZW50ID0gdGhpcy5wYXJzZU1heWJlQXNzaWduKGZhbHNlLCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKTtcbiAgICAvLyBUbyBkaXNhbGxvdyB0cmFpbGluZyBjb21tYSB2aWEgYHRoaXMudG9Bc3NpZ25hYmxlKClgLlxuICAgIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuY29tbWEgJiYgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycyAmJiByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnRyYWlsaW5nQ29tbWEgPCAwKSB7XG4gICAgICByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnRyYWlsaW5nQ29tbWEgPSB0aGlzLnN0YXJ0O1xuICAgIH1cbiAgICAvLyBGaW5pc2hcbiAgICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKHByb3AsIFwiU3ByZWFkRWxlbWVudFwiKVxuICB9XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNikge1xuICAgIHByb3AubWV0aG9kID0gZmFsc2U7XG4gICAgcHJvcC5zaG9ydGhhbmQgPSBmYWxzZTtcbiAgICBpZiAoaXNQYXR0ZXJuIHx8IHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpIHtcbiAgICAgIHN0YXJ0UG9zID0gdGhpcy5zdGFydDtcbiAgICAgIHN0YXJ0TG9jID0gdGhpcy5zdGFydExvYztcbiAgICB9XG4gICAgaWYgKCFpc1BhdHRlcm4pXG4gICAgICB7IGlzR2VuZXJhdG9yID0gdGhpcy5lYXQodHlwZXMkMS5zdGFyKTsgfVxuICB9XG4gIHZhciBjb250YWluc0VzYyA9IHRoaXMuY29udGFpbnNFc2M7XG4gIHRoaXMucGFyc2VQcm9wZXJ0eU5hbWUocHJvcCk7XG4gIGlmICghaXNQYXR0ZXJuICYmICFjb250YWluc0VzYyAmJiB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOCAmJiAhaXNHZW5lcmF0b3IgJiYgdGhpcy5pc0FzeW5jUHJvcChwcm9wKSkge1xuICAgIGlzQXN5bmMgPSB0cnVlO1xuICAgIGlzR2VuZXJhdG9yID0gdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDkgJiYgdGhpcy5lYXQodHlwZXMkMS5zdGFyKTtcbiAgICB0aGlzLnBhcnNlUHJvcGVydHlOYW1lKHByb3ApO1xuICB9IGVsc2Uge1xuICAgIGlzQXN5bmMgPSBmYWxzZTtcbiAgfVxuICB0aGlzLnBhcnNlUHJvcGVydHlWYWx1ZShwcm9wLCBpc1BhdHRlcm4sIGlzR2VuZXJhdG9yLCBpc0FzeW5jLCBzdGFydFBvcywgc3RhcnRMb2MsIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMsIGNvbnRhaW5zRXNjKTtcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShwcm9wLCBcIlByb3BlcnR5XCIpXG59O1xuXG5wcCQ1LnBhcnNlR2V0dGVyU2V0dGVyID0gZnVuY3Rpb24ocHJvcCkge1xuICB2YXIga2luZCA9IHByb3Aua2V5Lm5hbWU7XG4gIHRoaXMucGFyc2VQcm9wZXJ0eU5hbWUocHJvcCk7XG4gIHByb3AudmFsdWUgPSB0aGlzLnBhcnNlTWV0aG9kKGZhbHNlKTtcbiAgcHJvcC5raW5kID0ga2luZDtcbiAgdmFyIHBhcmFtQ291bnQgPSBwcm9wLmtpbmQgPT09IFwiZ2V0XCIgPyAwIDogMTtcbiAgaWYgKHByb3AudmFsdWUucGFyYW1zLmxlbmd0aCAhPT0gcGFyYW1Db3VudCkge1xuICAgIHZhciBzdGFydCA9IHByb3AudmFsdWUuc3RhcnQ7XG4gICAgaWYgKHByb3Aua2luZCA9PT0gXCJnZXRcIilcbiAgICAgIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKHN0YXJ0LCBcImdldHRlciBzaG91bGQgaGF2ZSBubyBwYXJhbXNcIik7IH1cbiAgICBlbHNlXG4gICAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShzdGFydCwgXCJzZXR0ZXIgc2hvdWxkIGhhdmUgZXhhY3RseSBvbmUgcGFyYW1cIik7IH1cbiAgfSBlbHNlIHtcbiAgICBpZiAocHJvcC5raW5kID09PSBcInNldFwiICYmIHByb3AudmFsdWUucGFyYW1zWzBdLnR5cGUgPT09IFwiUmVzdEVsZW1lbnRcIilcbiAgICAgIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKHByb3AudmFsdWUucGFyYW1zWzBdLnN0YXJ0LCBcIlNldHRlciBjYW5ub3QgdXNlIHJlc3QgcGFyYW1zXCIpOyB9XG4gIH1cbn07XG5cbnBwJDUucGFyc2VQcm9wZXJ0eVZhbHVlID0gZnVuY3Rpb24ocHJvcCwgaXNQYXR0ZXJuLCBpc0dlbmVyYXRvciwgaXNBc3luYywgc3RhcnRQb3MsIHN0YXJ0TG9jLCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCBjb250YWluc0VzYykge1xuICBpZiAoKGlzR2VuZXJhdG9yIHx8IGlzQXN5bmMpICYmIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5jb2xvbilcbiAgICB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG5cbiAgaWYgKHRoaXMuZWF0KHR5cGVzJDEuY29sb24pKSB7XG4gICAgcHJvcC52YWx1ZSA9IGlzUGF0dGVybiA/IHRoaXMucGFyc2VNYXliZURlZmF1bHQodGhpcy5zdGFydCwgdGhpcy5zdGFydExvYykgOiB0aGlzLnBhcnNlTWF5YmVBc3NpZ24oZmFsc2UsIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpO1xuICAgIHByb3Aua2luZCA9IFwiaW5pdFwiO1xuICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2ICYmIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5wYXJlbkwpIHtcbiAgICBpZiAoaXNQYXR0ZXJuKSB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gICAgcHJvcC5tZXRob2QgPSB0cnVlO1xuICAgIHByb3AudmFsdWUgPSB0aGlzLnBhcnNlTWV0aG9kKGlzR2VuZXJhdG9yLCBpc0FzeW5jKTtcbiAgICBwcm9wLmtpbmQgPSBcImluaXRcIjtcbiAgfSBlbHNlIGlmICghaXNQYXR0ZXJuICYmICFjb250YWluc0VzYyAmJlxuICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA1ICYmICFwcm9wLmNvbXB1dGVkICYmIHByb3Aua2V5LnR5cGUgPT09IFwiSWRlbnRpZmllclwiICYmXG4gICAgICAgICAgICAgKHByb3Aua2V5Lm5hbWUgPT09IFwiZ2V0XCIgfHwgcHJvcC5rZXkubmFtZSA9PT0gXCJzZXRcIikgJiZcbiAgICAgICAgICAgICAodGhpcy50eXBlICE9PSB0eXBlcyQxLmNvbW1hICYmIHRoaXMudHlwZSAhPT0gdHlwZXMkMS5icmFjZVIgJiYgdGhpcy50eXBlICE9PSB0eXBlcyQxLmVxKSkge1xuICAgIGlmIChpc0dlbmVyYXRvciB8fCBpc0FzeW5jKSB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gICAgdGhpcy5wYXJzZUdldHRlclNldHRlcihwcm9wKTtcbiAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNiAmJiAhcHJvcC5jb21wdXRlZCAmJiBwcm9wLmtleS50eXBlID09PSBcIklkZW50aWZpZXJcIikge1xuICAgIGlmIChpc0dlbmVyYXRvciB8fCBpc0FzeW5jKSB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gICAgdGhpcy5jaGVja1VucmVzZXJ2ZWQocHJvcC5rZXkpO1xuICAgIGlmIChwcm9wLmtleS5uYW1lID09PSBcImF3YWl0XCIgJiYgIXRoaXMuYXdhaXRJZGVudFBvcylcbiAgICAgIHsgdGhpcy5hd2FpdElkZW50UG9zID0gc3RhcnRQb3M7IH1cbiAgICBpZiAoaXNQYXR0ZXJuKSB7XG4gICAgICBwcm9wLnZhbHVlID0gdGhpcy5wYXJzZU1heWJlRGVmYXVsdChzdGFydFBvcywgc3RhcnRMb2MsIHRoaXMuY29weU5vZGUocHJvcC5rZXkpKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5lcSAmJiByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKSB7XG4gICAgICBpZiAocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy5zaG9ydGhhbmRBc3NpZ24gPCAwKVxuICAgICAgICB7IHJlZkRlc3RydWN0dXJpbmdFcnJvcnMuc2hvcnRoYW5kQXNzaWduID0gdGhpcy5zdGFydDsgfVxuICAgICAgcHJvcC52YWx1ZSA9IHRoaXMucGFyc2VNYXliZURlZmF1bHQoc3RhcnRQb3MsIHN0YXJ0TG9jLCB0aGlzLmNvcHlOb2RlKHByb3Aua2V5KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByb3AudmFsdWUgPSB0aGlzLmNvcHlOb2RlKHByb3Aua2V5KTtcbiAgICB9XG4gICAgcHJvcC5raW5kID0gXCJpbml0XCI7XG4gICAgcHJvcC5zaG9ydGhhbmQgPSB0cnVlO1xuICB9IGVsc2UgeyB0aGlzLnVuZXhwZWN0ZWQoKTsgfVxufTtcblxucHAkNS5wYXJzZVByb3BlcnR5TmFtZSA9IGZ1bmN0aW9uKHByb3ApIHtcbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2KSB7XG4gICAgaWYgKHRoaXMuZWF0KHR5cGVzJDEuYnJhY2tldEwpKSB7XG4gICAgICBwcm9wLmNvbXB1dGVkID0gdHJ1ZTtcbiAgICAgIHByb3Aua2V5ID0gdGhpcy5wYXJzZU1heWJlQXNzaWduKCk7XG4gICAgICB0aGlzLmV4cGVjdCh0eXBlcyQxLmJyYWNrZXRSKTtcbiAgICAgIHJldHVybiBwcm9wLmtleVxuICAgIH0gZWxzZSB7XG4gICAgICBwcm9wLmNvbXB1dGVkID0gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiBwcm9wLmtleSA9IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5udW0gfHwgdGhpcy50eXBlID09PSB0eXBlcyQxLnN0cmluZyA/IHRoaXMucGFyc2VFeHByQXRvbSgpIDogdGhpcy5wYXJzZUlkZW50KHRoaXMub3B0aW9ucy5hbGxvd1Jlc2VydmVkICE9PSBcIm5ldmVyXCIpXG59O1xuXG4vLyBJbml0aWFsaXplIGVtcHR5IGZ1bmN0aW9uIG5vZGUuXG5cbnBwJDUuaW5pdEZ1bmN0aW9uID0gZnVuY3Rpb24obm9kZSkge1xuICBub2RlLmlkID0gbnVsbDtcbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2KSB7IG5vZGUuZ2VuZXJhdG9yID0gbm9kZS5leHByZXNzaW9uID0gZmFsc2U7IH1cbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA4KSB7IG5vZGUuYXN5bmMgPSBmYWxzZTsgfVxufTtcblxuLy8gUGFyc2Ugb2JqZWN0IG9yIGNsYXNzIG1ldGhvZC5cblxucHAkNS5wYXJzZU1ldGhvZCA9IGZ1bmN0aW9uKGlzR2VuZXJhdG9yLCBpc0FzeW5jLCBhbGxvd0RpcmVjdFN1cGVyKSB7XG4gIHZhciBub2RlID0gdGhpcy5zdGFydE5vZGUoKSwgb2xkWWllbGRQb3MgPSB0aGlzLnlpZWxkUG9zLCBvbGRBd2FpdFBvcyA9IHRoaXMuYXdhaXRQb3MsIG9sZEF3YWl0SWRlbnRQb3MgPSB0aGlzLmF3YWl0SWRlbnRQb3M7XG5cbiAgdGhpcy5pbml0RnVuY3Rpb24obm9kZSk7XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNilcbiAgICB7IG5vZGUuZ2VuZXJhdG9yID0gaXNHZW5lcmF0b3I7IH1cbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA4KVxuICAgIHsgbm9kZS5hc3luYyA9ICEhaXNBc3luYzsgfVxuXG4gIHRoaXMueWllbGRQb3MgPSAwO1xuICB0aGlzLmF3YWl0UG9zID0gMDtcbiAgdGhpcy5hd2FpdElkZW50UG9zID0gMDtcbiAgdGhpcy5lbnRlclNjb3BlKGZ1bmN0aW9uRmxhZ3MoaXNBc3luYywgbm9kZS5nZW5lcmF0b3IpIHwgU0NPUEVfU1VQRVIgfCAoYWxsb3dEaXJlY3RTdXBlciA/IFNDT1BFX0RJUkVDVF9TVVBFUiA6IDApKTtcblxuICB0aGlzLmV4cGVjdCh0eXBlcyQxLnBhcmVuTCk7XG4gIG5vZGUucGFyYW1zID0gdGhpcy5wYXJzZUJpbmRpbmdMaXN0KHR5cGVzJDEucGFyZW5SLCBmYWxzZSwgdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDgpO1xuICB0aGlzLmNoZWNrWWllbGRBd2FpdEluRGVmYXVsdFBhcmFtcygpO1xuICB0aGlzLnBhcnNlRnVuY3Rpb25Cb2R5KG5vZGUsIGZhbHNlLCB0cnVlLCBmYWxzZSk7XG5cbiAgdGhpcy55aWVsZFBvcyA9IG9sZFlpZWxkUG9zO1xuICB0aGlzLmF3YWl0UG9zID0gb2xkQXdhaXRQb3M7XG4gIHRoaXMuYXdhaXRJZGVudFBvcyA9IG9sZEF3YWl0SWRlbnRQb3M7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJGdW5jdGlvbkV4cHJlc3Npb25cIilcbn07XG5cbi8vIFBhcnNlIGFycm93IGZ1bmN0aW9uIGV4cHJlc3Npb24gd2l0aCBnaXZlbiBwYXJhbWV0ZXJzLlxuXG5wcCQ1LnBhcnNlQXJyb3dFeHByZXNzaW9uID0gZnVuY3Rpb24obm9kZSwgcGFyYW1zLCBpc0FzeW5jLCBmb3JJbml0KSB7XG4gIHZhciBvbGRZaWVsZFBvcyA9IHRoaXMueWllbGRQb3MsIG9sZEF3YWl0UG9zID0gdGhpcy5hd2FpdFBvcywgb2xkQXdhaXRJZGVudFBvcyA9IHRoaXMuYXdhaXRJZGVudFBvcztcblxuICB0aGlzLmVudGVyU2NvcGUoZnVuY3Rpb25GbGFncyhpc0FzeW5jLCBmYWxzZSkgfCBTQ09QRV9BUlJPVyk7XG4gIHRoaXMuaW5pdEZ1bmN0aW9uKG5vZGUpO1xuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDgpIHsgbm9kZS5hc3luYyA9ICEhaXNBc3luYzsgfVxuXG4gIHRoaXMueWllbGRQb3MgPSAwO1xuICB0aGlzLmF3YWl0UG9zID0gMDtcbiAgdGhpcy5hd2FpdElkZW50UG9zID0gMDtcblxuICBub2RlLnBhcmFtcyA9IHRoaXMudG9Bc3NpZ25hYmxlTGlzdChwYXJhbXMsIHRydWUpO1xuICB0aGlzLnBhcnNlRnVuY3Rpb25Cb2R5KG5vZGUsIHRydWUsIGZhbHNlLCBmb3JJbml0KTtcblxuICB0aGlzLnlpZWxkUG9zID0gb2xkWWllbGRQb3M7XG4gIHRoaXMuYXdhaXRQb3MgPSBvbGRBd2FpdFBvcztcbiAgdGhpcy5hd2FpdElkZW50UG9zID0gb2xkQXdhaXRJZGVudFBvcztcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIkFycm93RnVuY3Rpb25FeHByZXNzaW9uXCIpXG59O1xuXG4vLyBQYXJzZSBmdW5jdGlvbiBib2R5IGFuZCBjaGVjayBwYXJhbWV0ZXJzLlxuXG5wcCQ1LnBhcnNlRnVuY3Rpb25Cb2R5ID0gZnVuY3Rpb24obm9kZSwgaXNBcnJvd0Z1bmN0aW9uLCBpc01ldGhvZCwgZm9ySW5pdCkge1xuICB2YXIgaXNFeHByZXNzaW9uID0gaXNBcnJvd0Z1bmN0aW9uICYmIHRoaXMudHlwZSAhPT0gdHlwZXMkMS5icmFjZUw7XG4gIHZhciBvbGRTdHJpY3QgPSB0aGlzLnN0cmljdCwgdXNlU3RyaWN0ID0gZmFsc2U7XG5cbiAgaWYgKGlzRXhwcmVzc2lvbikge1xuICAgIG5vZGUuYm9keSA9IHRoaXMucGFyc2VNYXliZUFzc2lnbihmb3JJbml0KTtcbiAgICBub2RlLmV4cHJlc3Npb24gPSB0cnVlO1xuICAgIHRoaXMuY2hlY2tQYXJhbXMobm9kZSwgZmFsc2UpO1xuICB9IGVsc2Uge1xuICAgIHZhciBub25TaW1wbGUgPSB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNyAmJiAhdGhpcy5pc1NpbXBsZVBhcmFtTGlzdChub2RlLnBhcmFtcyk7XG4gICAgaWYgKCFvbGRTdHJpY3QgfHwgbm9uU2ltcGxlKSB7XG4gICAgICB1c2VTdHJpY3QgPSB0aGlzLnN0cmljdERpcmVjdGl2ZSh0aGlzLmVuZCk7XG4gICAgICAvLyBJZiB0aGlzIGlzIGEgc3RyaWN0IG1vZGUgZnVuY3Rpb24sIHZlcmlmeSB0aGF0IGFyZ3VtZW50IG5hbWVzXG4gICAgICAvLyBhcmUgbm90IHJlcGVhdGVkLCBhbmQgaXQgZG9lcyBub3QgdHJ5IHRvIGJpbmQgdGhlIHdvcmRzIGBldmFsYFxuICAgICAgLy8gb3IgYGFyZ3VtZW50c2AuXG4gICAgICBpZiAodXNlU3RyaWN0ICYmIG5vblNpbXBsZSlcbiAgICAgICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUobm9kZS5zdGFydCwgXCJJbGxlZ2FsICd1c2Ugc3RyaWN0JyBkaXJlY3RpdmUgaW4gZnVuY3Rpb24gd2l0aCBub24tc2ltcGxlIHBhcmFtZXRlciBsaXN0XCIpOyB9XG4gICAgfVxuICAgIC8vIFN0YXJ0IGEgbmV3IHNjb3BlIHdpdGggcmVnYXJkIHRvIGxhYmVscyBhbmQgdGhlIGBpbkZ1bmN0aW9uYFxuICAgIC8vIGZsYWcgKHJlc3RvcmUgdGhlbSB0byB0aGVpciBvbGQgdmFsdWUgYWZ0ZXJ3YXJkcykuXG4gICAgdmFyIG9sZExhYmVscyA9IHRoaXMubGFiZWxzO1xuICAgIHRoaXMubGFiZWxzID0gW107XG4gICAgaWYgKHVzZVN0cmljdCkgeyB0aGlzLnN0cmljdCA9IHRydWU7IH1cblxuICAgIC8vIEFkZCB0aGUgcGFyYW1zIHRvIHZhckRlY2xhcmVkTmFtZXMgdG8gZW5zdXJlIHRoYXQgYW4gZXJyb3IgaXMgdGhyb3duXG4gICAgLy8gaWYgYSBsZXQvY29uc3QgZGVjbGFyYXRpb24gaW4gdGhlIGZ1bmN0aW9uIGNsYXNoZXMgd2l0aCBvbmUgb2YgdGhlIHBhcmFtcy5cbiAgICB0aGlzLmNoZWNrUGFyYW1zKG5vZGUsICFvbGRTdHJpY3QgJiYgIXVzZVN0cmljdCAmJiAhaXNBcnJvd0Z1bmN0aW9uICYmICFpc01ldGhvZCAmJiB0aGlzLmlzU2ltcGxlUGFyYW1MaXN0KG5vZGUucGFyYW1zKSk7XG4gICAgLy8gRW5zdXJlIHRoZSBmdW5jdGlvbiBuYW1lIGlzbid0IGEgZm9yYmlkZGVuIGlkZW50aWZpZXIgaW4gc3RyaWN0IG1vZGUsIGUuZy4gJ2V2YWwnXG4gICAgaWYgKHRoaXMuc3RyaWN0ICYmIG5vZGUuaWQpIHsgdGhpcy5jaGVja0xWYWxTaW1wbGUobm9kZS5pZCwgQklORF9PVVRTSURFKTsgfVxuICAgIG5vZGUuYm9keSA9IHRoaXMucGFyc2VCbG9jayhmYWxzZSwgdW5kZWZpbmVkLCB1c2VTdHJpY3QgJiYgIW9sZFN0cmljdCk7XG4gICAgbm9kZS5leHByZXNzaW9uID0gZmFsc2U7XG4gICAgdGhpcy5hZGFwdERpcmVjdGl2ZVByb2xvZ3VlKG5vZGUuYm9keS5ib2R5KTtcbiAgICB0aGlzLmxhYmVscyA9IG9sZExhYmVscztcbiAgfVxuICB0aGlzLmV4aXRTY29wZSgpO1xufTtcblxucHAkNS5pc1NpbXBsZVBhcmFtTGlzdCA9IGZ1bmN0aW9uKHBhcmFtcykge1xuICBmb3IgKHZhciBpID0gMCwgbGlzdCA9IHBhcmFtczsgaSA8IGxpc3QubGVuZ3RoOyBpICs9IDEpXG4gICAge1xuICAgIHZhciBwYXJhbSA9IGxpc3RbaV07XG5cbiAgICBpZiAocGFyYW0udHlwZSAhPT0gXCJJZGVudGlmaWVyXCIpIHsgcmV0dXJuIGZhbHNlXG4gIH0gfVxuICByZXR1cm4gdHJ1ZVxufTtcblxuLy8gQ2hlY2tzIGZ1bmN0aW9uIHBhcmFtcyBmb3IgdmFyaW91cyBkaXNhbGxvd2VkIHBhdHRlcm5zIHN1Y2ggYXMgdXNpbmcgXCJldmFsXCJcbi8vIG9yIFwiYXJndW1lbnRzXCIgYW5kIGR1cGxpY2F0ZSBwYXJhbWV0ZXJzLlxuXG5wcCQ1LmNoZWNrUGFyYW1zID0gZnVuY3Rpb24obm9kZSwgYWxsb3dEdXBsaWNhdGVzKSB7XG4gIHZhciBuYW1lSGFzaCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGZvciAodmFyIGkgPSAwLCBsaXN0ID0gbm9kZS5wYXJhbXM7IGkgPCBsaXN0Lmxlbmd0aDsgaSArPSAxKVxuICAgIHtcbiAgICB2YXIgcGFyYW0gPSBsaXN0W2ldO1xuXG4gICAgdGhpcy5jaGVja0xWYWxJbm5lclBhdHRlcm4ocGFyYW0sIEJJTkRfVkFSLCBhbGxvd0R1cGxpY2F0ZXMgPyBudWxsIDogbmFtZUhhc2gpO1xuICB9XG59O1xuXG4vLyBQYXJzZXMgYSBjb21tYS1zZXBhcmF0ZWQgbGlzdCBvZiBleHByZXNzaW9ucywgYW5kIHJldHVybnMgdGhlbSBhc1xuLy8gYW4gYXJyYXkuIGBjbG9zZWAgaXMgdGhlIHRva2VuIHR5cGUgdGhhdCBlbmRzIHRoZSBsaXN0LCBhbmRcbi8vIGBhbGxvd0VtcHR5YCBjYW4gYmUgdHVybmVkIG9uIHRvIGFsbG93IHN1YnNlcXVlbnQgY29tbWFzIHdpdGhcbi8vIG5vdGhpbmcgaW4gYmV0d2VlbiB0aGVtIHRvIGJlIHBhcnNlZCBhcyBgbnVsbGAgKHdoaWNoIGlzIG5lZWRlZFxuLy8gZm9yIGFycmF5IGxpdGVyYWxzKS5cblxucHAkNS5wYXJzZUV4cHJMaXN0ID0gZnVuY3Rpb24oY2xvc2UsIGFsbG93VHJhaWxpbmdDb21tYSwgYWxsb3dFbXB0eSwgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykge1xuICB2YXIgZWx0cyA9IFtdLCBmaXJzdCA9IHRydWU7XG4gIHdoaWxlICghdGhpcy5lYXQoY2xvc2UpKSB7XG4gICAgaWYgKCFmaXJzdCkge1xuICAgICAgdGhpcy5leHBlY3QodHlwZXMkMS5jb21tYSk7XG4gICAgICBpZiAoYWxsb3dUcmFpbGluZ0NvbW1hICYmIHRoaXMuYWZ0ZXJUcmFpbGluZ0NvbW1hKGNsb3NlKSkgeyBicmVhayB9XG4gICAgfSBlbHNlIHsgZmlyc3QgPSBmYWxzZTsgfVxuXG4gICAgdmFyIGVsdCA9ICh2b2lkIDApO1xuICAgIGlmIChhbGxvd0VtcHR5ICYmIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5jb21tYSlcbiAgICAgIHsgZWx0ID0gbnVsbDsgfVxuICAgIGVsc2UgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5lbGxpcHNpcykge1xuICAgICAgZWx0ID0gdGhpcy5wYXJzZVNwcmVhZChyZWZEZXN0cnVjdHVyaW5nRXJyb3JzKTtcbiAgICAgIGlmIChyZWZEZXN0cnVjdHVyaW5nRXJyb3JzICYmIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5jb21tYSAmJiByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnRyYWlsaW5nQ29tbWEgPCAwKVxuICAgICAgICB7IHJlZkRlc3RydWN0dXJpbmdFcnJvcnMudHJhaWxpbmdDb21tYSA9IHRoaXMuc3RhcnQ7IH1cbiAgICB9IGVsc2Uge1xuICAgICAgZWx0ID0gdGhpcy5wYXJzZU1heWJlQXNzaWduKGZhbHNlLCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKTtcbiAgICB9XG4gICAgZWx0cy5wdXNoKGVsdCk7XG4gIH1cbiAgcmV0dXJuIGVsdHNcbn07XG5cbnBwJDUuY2hlY2tVbnJlc2VydmVkID0gZnVuY3Rpb24ocmVmKSB7XG4gIHZhciBzdGFydCA9IHJlZi5zdGFydDtcbiAgdmFyIGVuZCA9IHJlZi5lbmQ7XG4gIHZhciBuYW1lID0gcmVmLm5hbWU7XG5cbiAgaWYgKHRoaXMuaW5HZW5lcmF0b3IgJiYgbmFtZSA9PT0gXCJ5aWVsZFwiKVxuICAgIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKHN0YXJ0LCBcIkNhbm5vdCB1c2UgJ3lpZWxkJyBhcyBpZGVudGlmaWVyIGluc2lkZSBhIGdlbmVyYXRvclwiKTsgfVxuICBpZiAodGhpcy5pbkFzeW5jICYmIG5hbWUgPT09IFwiYXdhaXRcIilcbiAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShzdGFydCwgXCJDYW5ub3QgdXNlICdhd2FpdCcgYXMgaWRlbnRpZmllciBpbnNpZGUgYW4gYXN5bmMgZnVuY3Rpb25cIik7IH1cbiAgaWYgKCEodGhpcy5jdXJyZW50VGhpc1Njb3BlKCkuZmxhZ3MgJiBTQ09QRV9WQVIpICYmIG5hbWUgPT09IFwiYXJndW1lbnRzXCIpXG4gICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUoc3RhcnQsIFwiQ2Fubm90IHVzZSAnYXJndW1lbnRzJyBpbiBjbGFzcyBmaWVsZCBpbml0aWFsaXplclwiKTsgfVxuICBpZiAodGhpcy5pbkNsYXNzU3RhdGljQmxvY2sgJiYgKG5hbWUgPT09IFwiYXJndW1lbnRzXCIgfHwgbmFtZSA9PT0gXCJhd2FpdFwiKSlcbiAgICB7IHRoaXMucmFpc2Uoc3RhcnQsIChcIkNhbm5vdCB1c2UgXCIgKyBuYW1lICsgXCIgaW4gY2xhc3Mgc3RhdGljIGluaXRpYWxpemF0aW9uIGJsb2NrXCIpKTsgfVxuICBpZiAodGhpcy5rZXl3b3Jkcy50ZXN0KG5hbWUpKVxuICAgIHsgdGhpcy5yYWlzZShzdGFydCwgKFwiVW5leHBlY3RlZCBrZXl3b3JkICdcIiArIG5hbWUgKyBcIidcIikpOyB9XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPCA2ICYmXG4gICAgdGhpcy5pbnB1dC5zbGljZShzdGFydCwgZW5kKS5pbmRleE9mKFwiXFxcXFwiKSAhPT0gLTEpIHsgcmV0dXJuIH1cbiAgdmFyIHJlID0gdGhpcy5zdHJpY3QgPyB0aGlzLnJlc2VydmVkV29yZHNTdHJpY3QgOiB0aGlzLnJlc2VydmVkV29yZHM7XG4gIGlmIChyZS50ZXN0KG5hbWUpKSB7XG4gICAgaWYgKCF0aGlzLmluQXN5bmMgJiYgbmFtZSA9PT0gXCJhd2FpdFwiKVxuICAgICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUoc3RhcnQsIFwiQ2Fubm90IHVzZSBrZXl3b3JkICdhd2FpdCcgb3V0c2lkZSBhbiBhc3luYyBmdW5jdGlvblwiKTsgfVxuICAgIHRoaXMucmFpc2VSZWNvdmVyYWJsZShzdGFydCwgKFwiVGhlIGtleXdvcmQgJ1wiICsgbmFtZSArIFwiJyBpcyByZXNlcnZlZFwiKSk7XG4gIH1cbn07XG5cbi8vIFBhcnNlIHRoZSBuZXh0IHRva2VuIGFzIGFuIGlkZW50aWZpZXIuIElmIGBsaWJlcmFsYCBpcyB0cnVlICh1c2VkXG4vLyB3aGVuIHBhcnNpbmcgcHJvcGVydGllcyksIGl0IHdpbGwgYWxzbyBjb252ZXJ0IGtleXdvcmRzIGludG9cbi8vIGlkZW50aWZpZXJzLlxuXG5wcCQ1LnBhcnNlSWRlbnQgPSBmdW5jdGlvbihsaWJlcmFsKSB7XG4gIHZhciBub2RlID0gdGhpcy5wYXJzZUlkZW50Tm9kZSgpO1xuICB0aGlzLm5leHQoISFsaWJlcmFsKTtcbiAgdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiSWRlbnRpZmllclwiKTtcbiAgaWYgKCFsaWJlcmFsKSB7XG4gICAgdGhpcy5jaGVja1VucmVzZXJ2ZWQobm9kZSk7XG4gICAgaWYgKG5vZGUubmFtZSA9PT0gXCJhd2FpdFwiICYmICF0aGlzLmF3YWl0SWRlbnRQb3MpXG4gICAgICB7IHRoaXMuYXdhaXRJZGVudFBvcyA9IG5vZGUuc3RhcnQ7IH1cbiAgfVxuICByZXR1cm4gbm9kZVxufTtcblxucHAkNS5wYXJzZUlkZW50Tm9kZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEubmFtZSkge1xuICAgIG5vZGUubmFtZSA9IHRoaXMudmFsdWU7XG4gIH0gZWxzZSBpZiAodGhpcy50eXBlLmtleXdvcmQpIHtcbiAgICBub2RlLm5hbWUgPSB0aGlzLnR5cGUua2V5d29yZDtcblxuICAgIC8vIFRvIGZpeCBodHRwczovL2dpdGh1Yi5jb20vYWNvcm5qcy9hY29ybi9pc3N1ZXMvNTc1XG4gICAgLy8gYGNsYXNzYCBhbmQgYGZ1bmN0aW9uYCBrZXl3b3JkcyBwdXNoIG5ldyBjb250ZXh0IGludG8gdGhpcy5jb250ZXh0LlxuICAgIC8vIEJ1dCB0aGVyZSBpcyBubyBjaGFuY2UgdG8gcG9wIHRoZSBjb250ZXh0IGlmIHRoZSBrZXl3b3JkIGlzIGNvbnN1bWVkIGFzIGFuIGlkZW50aWZpZXIgc3VjaCBhcyBhIHByb3BlcnR5IG5hbWUuXG4gICAgLy8gSWYgdGhlIHByZXZpb3VzIHRva2VuIGlzIGEgZG90LCB0aGlzIGRvZXMgbm90IGFwcGx5IGJlY2F1c2UgdGhlIGNvbnRleHQtbWFuYWdpbmcgY29kZSBhbHJlYWR5IGlnbm9yZWQgdGhlIGtleXdvcmRcbiAgICBpZiAoKG5vZGUubmFtZSA9PT0gXCJjbGFzc1wiIHx8IG5vZGUubmFtZSA9PT0gXCJmdW5jdGlvblwiKSAmJlxuICAgICAgKHRoaXMubGFzdFRva0VuZCAhPT0gdGhpcy5sYXN0VG9rU3RhcnQgKyAxIHx8IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLmxhc3RUb2tTdGFydCkgIT09IDQ2KSkge1xuICAgICAgdGhpcy5jb250ZXh0LnBvcCgpO1xuICAgIH1cbiAgICB0aGlzLnR5cGUgPSB0eXBlcyQxLm5hbWU7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy51bmV4cGVjdGVkKCk7XG4gIH1cbiAgcmV0dXJuIG5vZGVcbn07XG5cbnBwJDUucGFyc2VQcml2YXRlSWRlbnQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLnByaXZhdGVJZCkge1xuICAgIG5vZGUubmFtZSA9IHRoaXMudmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy51bmV4cGVjdGVkKCk7XG4gIH1cbiAgdGhpcy5uZXh0KCk7XG4gIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIlByaXZhdGVJZGVudGlmaWVyXCIpO1xuXG4gIC8vIEZvciB2YWxpZGF0aW5nIGV4aXN0ZW5jZVxuICBpZiAodGhpcy5vcHRpb25zLmNoZWNrUHJpdmF0ZUZpZWxkcykge1xuICAgIGlmICh0aGlzLnByaXZhdGVOYW1lU3RhY2subGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLnJhaXNlKG5vZGUuc3RhcnQsIChcIlByaXZhdGUgZmllbGQgJyNcIiArIChub2RlLm5hbWUpICsgXCInIG11c3QgYmUgZGVjbGFyZWQgaW4gYW4gZW5jbG9zaW5nIGNsYXNzXCIpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wcml2YXRlTmFtZVN0YWNrW3RoaXMucHJpdmF0ZU5hbWVTdGFjay5sZW5ndGggLSAxXS51c2VkLnB1c2gobm9kZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5vZGVcbn07XG5cbi8vIFBhcnNlcyB5aWVsZCBleHByZXNzaW9uIGluc2lkZSBnZW5lcmF0b3IuXG5cbnBwJDUucGFyc2VZaWVsZCA9IGZ1bmN0aW9uKGZvckluaXQpIHtcbiAgaWYgKCF0aGlzLnlpZWxkUG9zKSB7IHRoaXMueWllbGRQb3MgPSB0aGlzLnN0YXJ0OyB9XG5cbiAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICB0aGlzLm5leHQoKTtcbiAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5zZW1pIHx8IHRoaXMuY2FuSW5zZXJ0U2VtaWNvbG9uKCkgfHwgKHRoaXMudHlwZSAhPT0gdHlwZXMkMS5zdGFyICYmICF0aGlzLnR5cGUuc3RhcnRzRXhwcikpIHtcbiAgICBub2RlLmRlbGVnYXRlID0gZmFsc2U7XG4gICAgbm9kZS5hcmd1bWVudCA9IG51bGw7XG4gIH0gZWxzZSB7XG4gICAgbm9kZS5kZWxlZ2F0ZSA9IHRoaXMuZWF0KHR5cGVzJDEuc3Rhcik7XG4gICAgbm9kZS5hcmd1bWVudCA9IHRoaXMucGFyc2VNYXliZUFzc2lnbihmb3JJbml0KTtcbiAgfVxuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiWWllbGRFeHByZXNzaW9uXCIpXG59O1xuXG5wcCQ1LnBhcnNlQXdhaXQgPSBmdW5jdGlvbihmb3JJbml0KSB7XG4gIGlmICghdGhpcy5hd2FpdFBvcykgeyB0aGlzLmF3YWl0UG9zID0gdGhpcy5zdGFydDsgfVxuXG4gIHZhciBub2RlID0gdGhpcy5zdGFydE5vZGUoKTtcbiAgdGhpcy5uZXh0KCk7XG4gIG5vZGUuYXJndW1lbnQgPSB0aGlzLnBhcnNlTWF5YmVVbmFyeShudWxsLCB0cnVlLCBmYWxzZSwgZm9ySW5pdCk7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJBd2FpdEV4cHJlc3Npb25cIilcbn07XG5cbnZhciBwcCQ0ID0gUGFyc2VyLnByb3RvdHlwZTtcblxuLy8gVGhpcyBmdW5jdGlvbiBpcyB1c2VkIHRvIHJhaXNlIGV4Y2VwdGlvbnMgb24gcGFyc2UgZXJyb3JzLiBJdFxuLy8gdGFrZXMgYW4gb2Zmc2V0IGludGVnZXIgKGludG8gdGhlIGN1cnJlbnQgYGlucHV0YCkgdG8gaW5kaWNhdGVcbi8vIHRoZSBsb2NhdGlvbiBvZiB0aGUgZXJyb3IsIGF0dGFjaGVzIHRoZSBwb3NpdGlvbiB0byB0aGUgZW5kXG4vLyBvZiB0aGUgZXJyb3IgbWVzc2FnZSwgYW5kIHRoZW4gcmFpc2VzIGEgYFN5bnRheEVycm9yYCB3aXRoIHRoYXRcbi8vIG1lc3NhZ2UuXG5cbnBwJDQucmFpc2UgPSBmdW5jdGlvbihwb3MsIG1lc3NhZ2UpIHtcbiAgdmFyIGxvYyA9IGdldExpbmVJbmZvKHRoaXMuaW5wdXQsIHBvcyk7XG4gIG1lc3NhZ2UgKz0gXCIgKFwiICsgbG9jLmxpbmUgKyBcIjpcIiArIGxvYy5jb2x1bW4gKyBcIilcIjtcbiAgaWYgKHRoaXMuc291cmNlRmlsZSkge1xuICAgIG1lc3NhZ2UgKz0gXCIgaW4gXCIgKyB0aGlzLnNvdXJjZUZpbGU7XG4gIH1cbiAgdmFyIGVyciA9IG5ldyBTeW50YXhFcnJvcihtZXNzYWdlKTtcbiAgZXJyLnBvcyA9IHBvczsgZXJyLmxvYyA9IGxvYzsgZXJyLnJhaXNlZEF0ID0gdGhpcy5wb3M7XG4gIHRocm93IGVyclxufTtcblxucHAkNC5yYWlzZVJlY292ZXJhYmxlID0gcHAkNC5yYWlzZTtcblxucHAkNC5jdXJQb3NpdGlvbiA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5vcHRpb25zLmxvY2F0aW9ucykge1xuICAgIHJldHVybiBuZXcgUG9zaXRpb24odGhpcy5jdXJMaW5lLCB0aGlzLnBvcyAtIHRoaXMubGluZVN0YXJ0KVxuICB9XG59O1xuXG52YXIgcHAkMyA9IFBhcnNlci5wcm90b3R5cGU7XG5cbnZhciBTY29wZSA9IGZ1bmN0aW9uIFNjb3BlKGZsYWdzKSB7XG4gIHRoaXMuZmxhZ3MgPSBmbGFncztcbiAgLy8gQSBsaXN0IG9mIHZhci1kZWNsYXJlZCBuYW1lcyBpbiB0aGUgY3VycmVudCBsZXhpY2FsIHNjb3BlXG4gIHRoaXMudmFyID0gW107XG4gIC8vIEEgbGlzdCBvZiBsZXhpY2FsbHktZGVjbGFyZWQgbmFtZXMgaW4gdGhlIGN1cnJlbnQgbGV4aWNhbCBzY29wZVxuICB0aGlzLmxleGljYWwgPSBbXTtcbiAgLy8gQSBsaXN0IG9mIGxleGljYWxseS1kZWNsYXJlZCBGdW5jdGlvbkRlY2xhcmF0aW9uIG5hbWVzIGluIHRoZSBjdXJyZW50IGxleGljYWwgc2NvcGVcbiAgdGhpcy5mdW5jdGlvbnMgPSBbXTtcbn07XG5cbi8vIFRoZSBmdW5jdGlvbnMgaW4gdGhpcyBtb2R1bGUga2VlcCB0cmFjayBvZiBkZWNsYXJlZCB2YXJpYWJsZXMgaW4gdGhlIGN1cnJlbnQgc2NvcGUgaW4gb3JkZXIgdG8gZGV0ZWN0IGR1cGxpY2F0ZSB2YXJpYWJsZSBuYW1lcy5cblxucHAkMy5lbnRlclNjb3BlID0gZnVuY3Rpb24oZmxhZ3MpIHtcbiAgdGhpcy5zY29wZVN0YWNrLnB1c2gobmV3IFNjb3BlKGZsYWdzKSk7XG59O1xuXG5wcCQzLmV4aXRTY29wZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnNjb3BlU3RhY2sucG9wKCk7XG59O1xuXG4vLyBUaGUgc3BlYyBzYXlzOlxuLy8gPiBBdCB0aGUgdG9wIGxldmVsIG9mIGEgZnVuY3Rpb24sIG9yIHNjcmlwdCwgZnVuY3Rpb24gZGVjbGFyYXRpb25zIGFyZVxuLy8gPiB0cmVhdGVkIGxpa2UgdmFyIGRlY2xhcmF0aW9ucyByYXRoZXIgdGhhbiBsaWtlIGxleGljYWwgZGVjbGFyYXRpb25zLlxucHAkMy50cmVhdEZ1bmN0aW9uc0FzVmFySW5TY29wZSA9IGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHJldHVybiAoc2NvcGUuZmxhZ3MgJiBTQ09QRV9GVU5DVElPTikgfHwgIXRoaXMuaW5Nb2R1bGUgJiYgKHNjb3BlLmZsYWdzICYgU0NPUEVfVE9QKVxufTtcblxucHAkMy5kZWNsYXJlTmFtZSA9IGZ1bmN0aW9uKG5hbWUsIGJpbmRpbmdUeXBlLCBwb3MpIHtcbiAgdmFyIHJlZGVjbGFyZWQgPSBmYWxzZTtcbiAgaWYgKGJpbmRpbmdUeXBlID09PSBCSU5EX0xFWElDQUwpIHtcbiAgICB2YXIgc2NvcGUgPSB0aGlzLmN1cnJlbnRTY29wZSgpO1xuICAgIHJlZGVjbGFyZWQgPSBzY29wZS5sZXhpY2FsLmluZGV4T2YobmFtZSkgPiAtMSB8fCBzY29wZS5mdW5jdGlvbnMuaW5kZXhPZihuYW1lKSA+IC0xIHx8IHNjb3BlLnZhci5pbmRleE9mKG5hbWUpID4gLTE7XG4gICAgc2NvcGUubGV4aWNhbC5wdXNoKG5hbWUpO1xuICAgIGlmICh0aGlzLmluTW9kdWxlICYmIChzY29wZS5mbGFncyAmIFNDT1BFX1RPUCkpXG4gICAgICB7IGRlbGV0ZSB0aGlzLnVuZGVmaW5lZEV4cG9ydHNbbmFtZV07IH1cbiAgfSBlbHNlIGlmIChiaW5kaW5nVHlwZSA9PT0gQklORF9TSU1QTEVfQ0FUQ0gpIHtcbiAgICB2YXIgc2NvcGUkMSA9IHRoaXMuY3VycmVudFNjb3BlKCk7XG4gICAgc2NvcGUkMS5sZXhpY2FsLnB1c2gobmFtZSk7XG4gIH0gZWxzZSBpZiAoYmluZGluZ1R5cGUgPT09IEJJTkRfRlVOQ1RJT04pIHtcbiAgICB2YXIgc2NvcGUkMiA9IHRoaXMuY3VycmVudFNjb3BlKCk7XG4gICAgaWYgKHRoaXMudHJlYXRGdW5jdGlvbnNBc1ZhcilcbiAgICAgIHsgcmVkZWNsYXJlZCA9IHNjb3BlJDIubGV4aWNhbC5pbmRleE9mKG5hbWUpID4gLTE7IH1cbiAgICBlbHNlXG4gICAgICB7IHJlZGVjbGFyZWQgPSBzY29wZSQyLmxleGljYWwuaW5kZXhPZihuYW1lKSA+IC0xIHx8IHNjb3BlJDIudmFyLmluZGV4T2YobmFtZSkgPiAtMTsgfVxuICAgIHNjb3BlJDIuZnVuY3Rpb25zLnB1c2gobmFtZSk7XG4gIH0gZWxzZSB7XG4gICAgZm9yICh2YXIgaSA9IHRoaXMuc2NvcGVTdGFjay5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgdmFyIHNjb3BlJDMgPSB0aGlzLnNjb3BlU3RhY2tbaV07XG4gICAgICBpZiAoc2NvcGUkMy5sZXhpY2FsLmluZGV4T2YobmFtZSkgPiAtMSAmJiAhKChzY29wZSQzLmZsYWdzICYgU0NPUEVfU0lNUExFX0NBVENIKSAmJiBzY29wZSQzLmxleGljYWxbMF0gPT09IG5hbWUpIHx8XG4gICAgICAgICAgIXRoaXMudHJlYXRGdW5jdGlvbnNBc1ZhckluU2NvcGUoc2NvcGUkMykgJiYgc2NvcGUkMy5mdW5jdGlvbnMuaW5kZXhPZihuYW1lKSA+IC0xKSB7XG4gICAgICAgIHJlZGVjbGFyZWQgPSB0cnVlO1xuICAgICAgICBicmVha1xuICAgICAgfVxuICAgICAgc2NvcGUkMy52YXIucHVzaChuYW1lKTtcbiAgICAgIGlmICh0aGlzLmluTW9kdWxlICYmIChzY29wZSQzLmZsYWdzICYgU0NPUEVfVE9QKSlcbiAgICAgICAgeyBkZWxldGUgdGhpcy51bmRlZmluZWRFeHBvcnRzW25hbWVdOyB9XG4gICAgICBpZiAoc2NvcGUkMy5mbGFncyAmIFNDT1BFX1ZBUikgeyBicmVhayB9XG4gICAgfVxuICB9XG4gIGlmIChyZWRlY2xhcmVkKSB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShwb3MsIChcIklkZW50aWZpZXIgJ1wiICsgbmFtZSArIFwiJyBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCIpKTsgfVxufTtcblxucHAkMy5jaGVja0xvY2FsRXhwb3J0ID0gZnVuY3Rpb24oaWQpIHtcbiAgLy8gc2NvcGUuZnVuY3Rpb25zIG11c3QgYmUgZW1wdHkgYXMgTW9kdWxlIGNvZGUgaXMgYWx3YXlzIHN0cmljdC5cbiAgaWYgKHRoaXMuc2NvcGVTdGFja1swXS5sZXhpY2FsLmluZGV4T2YoaWQubmFtZSkgPT09IC0xICYmXG4gICAgICB0aGlzLnNjb3BlU3RhY2tbMF0udmFyLmluZGV4T2YoaWQubmFtZSkgPT09IC0xKSB7XG4gICAgdGhpcy51bmRlZmluZWRFeHBvcnRzW2lkLm5hbWVdID0gaWQ7XG4gIH1cbn07XG5cbnBwJDMuY3VycmVudFNjb3BlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnNjb3BlU3RhY2tbdGhpcy5zY29wZVN0YWNrLmxlbmd0aCAtIDFdXG59O1xuXG5wcCQzLmN1cnJlbnRWYXJTY29wZSA9IGZ1bmN0aW9uKCkge1xuICBmb3IgKHZhciBpID0gdGhpcy5zY29wZVN0YWNrLmxlbmd0aCAtIDE7OyBpLS0pIHtcbiAgICB2YXIgc2NvcGUgPSB0aGlzLnNjb3BlU3RhY2tbaV07XG4gICAgaWYgKHNjb3BlLmZsYWdzICYgKFNDT1BFX1ZBUiB8IFNDT1BFX0NMQVNTX0ZJRUxEX0lOSVQgfCBTQ09QRV9DTEFTU19TVEFUSUNfQkxPQ0spKSB7IHJldHVybiBzY29wZSB9XG4gIH1cbn07XG5cbi8vIENvdWxkIGJlIHVzZWZ1bCBmb3IgYHRoaXNgLCBgbmV3LnRhcmdldGAsIGBzdXBlcigpYCwgYHN1cGVyLnByb3BlcnR5YCwgYW5kIGBzdXBlcltwcm9wZXJ0eV1gLlxucHAkMy5jdXJyZW50VGhpc1Njb3BlID0gZnVuY3Rpb24oKSB7XG4gIGZvciAodmFyIGkgPSB0aGlzLnNjb3BlU3RhY2subGVuZ3RoIC0gMTs7IGktLSkge1xuICAgIHZhciBzY29wZSA9IHRoaXMuc2NvcGVTdGFja1tpXTtcbiAgICBpZiAoc2NvcGUuZmxhZ3MgJiAoU0NPUEVfVkFSIHwgU0NPUEVfQ0xBU1NfRklFTERfSU5JVCB8IFNDT1BFX0NMQVNTX1NUQVRJQ19CTE9DSykgJiZcbiAgICAgICAgIShzY29wZS5mbGFncyAmIFNDT1BFX0FSUk9XKSkgeyByZXR1cm4gc2NvcGUgfVxuICB9XG59O1xuXG52YXIgTm9kZSA9IGZ1bmN0aW9uIE5vZGUocGFyc2VyLCBwb3MsIGxvYykge1xuICB0aGlzLnR5cGUgPSBcIlwiO1xuICB0aGlzLnN0YXJ0ID0gcG9zO1xuICB0aGlzLmVuZCA9IDA7XG4gIGlmIChwYXJzZXIub3B0aW9ucy5sb2NhdGlvbnMpXG4gICAgeyB0aGlzLmxvYyA9IG5ldyBTb3VyY2VMb2NhdGlvbihwYXJzZXIsIGxvYyk7IH1cbiAgaWYgKHBhcnNlci5vcHRpb25zLmRpcmVjdFNvdXJjZUZpbGUpXG4gICAgeyB0aGlzLnNvdXJjZUZpbGUgPSBwYXJzZXIub3B0aW9ucy5kaXJlY3RTb3VyY2VGaWxlOyB9XG4gIGlmIChwYXJzZXIub3B0aW9ucy5yYW5nZXMpXG4gICAgeyB0aGlzLnJhbmdlID0gW3BvcywgMF07IH1cbn07XG5cbi8vIFN0YXJ0IGFuIEFTVCBub2RlLCBhdHRhY2hpbmcgYSBzdGFydCBvZmZzZXQuXG5cbnZhciBwcCQyID0gUGFyc2VyLnByb3RvdHlwZTtcblxucHAkMi5zdGFydE5vZGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBOb2RlKHRoaXMsIHRoaXMuc3RhcnQsIHRoaXMuc3RhcnRMb2MpXG59O1xuXG5wcCQyLnN0YXJ0Tm9kZUF0ID0gZnVuY3Rpb24ocG9zLCBsb2MpIHtcbiAgcmV0dXJuIG5ldyBOb2RlKHRoaXMsIHBvcywgbG9jKVxufTtcblxuLy8gRmluaXNoIGFuIEFTVCBub2RlLCBhZGRpbmcgYHR5cGVgIGFuZCBgZW5kYCBwcm9wZXJ0aWVzLlxuXG5mdW5jdGlvbiBmaW5pc2hOb2RlQXQobm9kZSwgdHlwZSwgcG9zLCBsb2MpIHtcbiAgbm9kZS50eXBlID0gdHlwZTtcbiAgbm9kZS5lbmQgPSBwb3M7XG4gIGlmICh0aGlzLm9wdGlvbnMubG9jYXRpb25zKVxuICAgIHsgbm9kZS5sb2MuZW5kID0gbG9jOyB9XG4gIGlmICh0aGlzLm9wdGlvbnMucmFuZ2VzKVxuICAgIHsgbm9kZS5yYW5nZVsxXSA9IHBvczsgfVxuICByZXR1cm4gbm9kZVxufVxuXG5wcCQyLmZpbmlzaE5vZGUgPSBmdW5jdGlvbihub2RlLCB0eXBlKSB7XG4gIHJldHVybiBmaW5pc2hOb2RlQXQuY2FsbCh0aGlzLCBub2RlLCB0eXBlLCB0aGlzLmxhc3RUb2tFbmQsIHRoaXMubGFzdFRva0VuZExvYylcbn07XG5cbi8vIEZpbmlzaCBub2RlIGF0IGdpdmVuIHBvc2l0aW9uXG5cbnBwJDIuZmluaXNoTm9kZUF0ID0gZnVuY3Rpb24obm9kZSwgdHlwZSwgcG9zLCBsb2MpIHtcbiAgcmV0dXJuIGZpbmlzaE5vZGVBdC5jYWxsKHRoaXMsIG5vZGUsIHR5cGUsIHBvcywgbG9jKVxufTtcblxucHAkMi5jb3B5Tm9kZSA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgdmFyIG5ld05vZGUgPSBuZXcgTm9kZSh0aGlzLCBub2RlLnN0YXJ0LCB0aGlzLnN0YXJ0TG9jKTtcbiAgZm9yICh2YXIgcHJvcCBpbiBub2RlKSB7IG5ld05vZGVbcHJvcF0gPSBub2RlW3Byb3BdOyB9XG4gIHJldHVybiBuZXdOb2RlXG59O1xuXG4vLyBUaGlzIGZpbGUgd2FzIGdlbmVyYXRlZCBieSBcImJpbi9nZW5lcmF0ZS11bmljb2RlLXNjcmlwdC12YWx1ZXMuanNcIi4gRG8gbm90IG1vZGlmeSBtYW51YWxseSFcbnZhciBzY3JpcHRWYWx1ZXNBZGRlZEluVW5pY29kZSA9IFwiR2FyYSBHYXJheSBHdWtoIEd1cnVuZ19LaGVtYSBIcmt0IEthdGFrYW5hX09yX0hpcmFnYW5hIEthd2kgS2lyYXRfUmFpIEtyYWkgTmFnX011bmRhcmkgTmFnbSBPbF9PbmFsIE9uYW8gU3VudSBTdW51d2FyIFRvZGhyaSBUb2RyIFR1bHVfVGlnYWxhcmkgVHV0ZyBVbmtub3duIFp6enpcIjtcblxuLy8gVGhpcyBmaWxlIGNvbnRhaW5zIFVuaWNvZGUgcHJvcGVydGllcyBleHRyYWN0ZWQgZnJvbSB0aGUgRUNNQVNjcmlwdCBzcGVjaWZpY2F0aW9uLlxuLy8gVGhlIGxpc3RzIGFyZSBleHRyYWN0ZWQgbGlrZSBzbzpcbi8vICQkKCcjdGFibGUtYmluYXJ5LXVuaWNvZGUtcHJvcGVydGllcyA+IGZpZ3VyZSA+IHRhYmxlID4gdGJvZHkgPiB0ciA+IHRkOm50aC1jaGlsZCgxKSBjb2RlJykubWFwKGVsID0+IGVsLmlubmVyVGV4dClcblxuLy8gI3RhYmxlLWJpbmFyeS11bmljb2RlLXByb3BlcnRpZXNcbnZhciBlY21hOUJpbmFyeVByb3BlcnRpZXMgPSBcIkFTQ0lJIEFTQ0lJX0hleF9EaWdpdCBBSGV4IEFscGhhYmV0aWMgQWxwaGEgQW55IEFzc2lnbmVkIEJpZGlfQ29udHJvbCBCaWRpX0MgQmlkaV9NaXJyb3JlZCBCaWRpX00gQ2FzZV9JZ25vcmFibGUgQ0kgQ2FzZWQgQ2hhbmdlc19XaGVuX0Nhc2Vmb2xkZWQgQ1dDRiBDaGFuZ2VzX1doZW5fQ2FzZW1hcHBlZCBDV0NNIENoYW5nZXNfV2hlbl9Mb3dlcmNhc2VkIENXTCBDaGFuZ2VzX1doZW5fTkZLQ19DYXNlZm9sZGVkIENXS0NGIENoYW5nZXNfV2hlbl9UaXRsZWNhc2VkIENXVCBDaGFuZ2VzX1doZW5fVXBwZXJjYXNlZCBDV1UgRGFzaCBEZWZhdWx0X0lnbm9yYWJsZV9Db2RlX1BvaW50IERJIERlcHJlY2F0ZWQgRGVwIERpYWNyaXRpYyBEaWEgRW1vamkgRW1vamlfQ29tcG9uZW50IEVtb2ppX01vZGlmaWVyIEVtb2ppX01vZGlmaWVyX0Jhc2UgRW1vamlfUHJlc2VudGF0aW9uIEV4dGVuZGVyIEV4dCBHcmFwaGVtZV9CYXNlIEdyX0Jhc2UgR3JhcGhlbWVfRXh0ZW5kIEdyX0V4dCBIZXhfRGlnaXQgSGV4IElEU19CaW5hcnlfT3BlcmF0b3IgSURTQiBJRFNfVHJpbmFyeV9PcGVyYXRvciBJRFNUIElEX0NvbnRpbnVlIElEQyBJRF9TdGFydCBJRFMgSWRlb2dyYXBoaWMgSWRlbyBKb2luX0NvbnRyb2wgSm9pbl9DIExvZ2ljYWxfT3JkZXJfRXhjZXB0aW9uIExPRSBMb3dlcmNhc2UgTG93ZXIgTWF0aCBOb25jaGFyYWN0ZXJfQ29kZV9Qb2ludCBOQ2hhciBQYXR0ZXJuX1N5bnRheCBQYXRfU3luIFBhdHRlcm5fV2hpdGVfU3BhY2UgUGF0X1dTIFF1b3RhdGlvbl9NYXJrIFFNYXJrIFJhZGljYWwgUmVnaW9uYWxfSW5kaWNhdG9yIFJJIFNlbnRlbmNlX1Rlcm1pbmFsIFNUZXJtIFNvZnRfRG90dGVkIFNEIFRlcm1pbmFsX1B1bmN0dWF0aW9uIFRlcm0gVW5pZmllZF9JZGVvZ3JhcGggVUlkZW8gVXBwZXJjYXNlIFVwcGVyIFZhcmlhdGlvbl9TZWxlY3RvciBWUyBXaGl0ZV9TcGFjZSBzcGFjZSBYSURfQ29udGludWUgWElEQyBYSURfU3RhcnQgWElEU1wiO1xudmFyIGVjbWExMEJpbmFyeVByb3BlcnRpZXMgPSBlY21hOUJpbmFyeVByb3BlcnRpZXMgKyBcIiBFeHRlbmRlZF9QaWN0b2dyYXBoaWNcIjtcbnZhciBlY21hMTFCaW5hcnlQcm9wZXJ0aWVzID0gZWNtYTEwQmluYXJ5UHJvcGVydGllcztcbnZhciBlY21hMTJCaW5hcnlQcm9wZXJ0aWVzID0gZWNtYTExQmluYXJ5UHJvcGVydGllcyArIFwiIEVCYXNlIEVDb21wIEVNb2QgRVByZXMgRXh0UGljdFwiO1xudmFyIGVjbWExM0JpbmFyeVByb3BlcnRpZXMgPSBlY21hMTJCaW5hcnlQcm9wZXJ0aWVzO1xudmFyIGVjbWExNEJpbmFyeVByb3BlcnRpZXMgPSBlY21hMTNCaW5hcnlQcm9wZXJ0aWVzO1xuXG52YXIgdW5pY29kZUJpbmFyeVByb3BlcnRpZXMgPSB7XG4gIDk6IGVjbWE5QmluYXJ5UHJvcGVydGllcyxcbiAgMTA6IGVjbWExMEJpbmFyeVByb3BlcnRpZXMsXG4gIDExOiBlY21hMTFCaW5hcnlQcm9wZXJ0aWVzLFxuICAxMjogZWNtYTEyQmluYXJ5UHJvcGVydGllcyxcbiAgMTM6IGVjbWExM0JpbmFyeVByb3BlcnRpZXMsXG4gIDE0OiBlY21hMTRCaW5hcnlQcm9wZXJ0aWVzXG59O1xuXG4vLyAjdGFibGUtYmluYXJ5LXVuaWNvZGUtcHJvcGVydGllcy1vZi1zdHJpbmdzXG52YXIgZWNtYTE0QmluYXJ5UHJvcGVydGllc09mU3RyaW5ncyA9IFwiQmFzaWNfRW1vamkgRW1vamlfS2V5Y2FwX1NlcXVlbmNlIFJHSV9FbW9qaV9Nb2RpZmllcl9TZXF1ZW5jZSBSR0lfRW1vamlfRmxhZ19TZXF1ZW5jZSBSR0lfRW1vamlfVGFnX1NlcXVlbmNlIFJHSV9FbW9qaV9aV0pfU2VxdWVuY2UgUkdJX0Vtb2ppXCI7XG5cbnZhciB1bmljb2RlQmluYXJ5UHJvcGVydGllc09mU3RyaW5ncyA9IHtcbiAgOTogXCJcIixcbiAgMTA6IFwiXCIsXG4gIDExOiBcIlwiLFxuICAxMjogXCJcIixcbiAgMTM6IFwiXCIsXG4gIDE0OiBlY21hMTRCaW5hcnlQcm9wZXJ0aWVzT2ZTdHJpbmdzXG59O1xuXG4vLyAjdGFibGUtdW5pY29kZS1nZW5lcmFsLWNhdGVnb3J5LXZhbHVlc1xudmFyIHVuaWNvZGVHZW5lcmFsQ2F0ZWdvcnlWYWx1ZXMgPSBcIkNhc2VkX0xldHRlciBMQyBDbG9zZV9QdW5jdHVhdGlvbiBQZSBDb25uZWN0b3JfUHVuY3R1YXRpb24gUGMgQ29udHJvbCBDYyBjbnRybCBDdXJyZW5jeV9TeW1ib2wgU2MgRGFzaF9QdW5jdHVhdGlvbiBQZCBEZWNpbWFsX051bWJlciBOZCBkaWdpdCBFbmNsb3NpbmdfTWFyayBNZSBGaW5hbF9QdW5jdHVhdGlvbiBQZiBGb3JtYXQgQ2YgSW5pdGlhbF9QdW5jdHVhdGlvbiBQaSBMZXR0ZXIgTCBMZXR0ZXJfTnVtYmVyIE5sIExpbmVfU2VwYXJhdG9yIFpsIExvd2VyY2FzZV9MZXR0ZXIgTGwgTWFyayBNIENvbWJpbmluZ19NYXJrIE1hdGhfU3ltYm9sIFNtIE1vZGlmaWVyX0xldHRlciBMbSBNb2RpZmllcl9TeW1ib2wgU2sgTm9uc3BhY2luZ19NYXJrIE1uIE51bWJlciBOIE9wZW5fUHVuY3R1YXRpb24gUHMgT3RoZXIgQyBPdGhlcl9MZXR0ZXIgTG8gT3RoZXJfTnVtYmVyIE5vIE90aGVyX1B1bmN0dWF0aW9uIFBvIE90aGVyX1N5bWJvbCBTbyBQYXJhZ3JhcGhfU2VwYXJhdG9yIFpwIFByaXZhdGVfVXNlIENvIFB1bmN0dWF0aW9uIFAgcHVuY3QgU2VwYXJhdG9yIFogU3BhY2VfU2VwYXJhdG9yIFpzIFNwYWNpbmdfTWFyayBNYyBTdXJyb2dhdGUgQ3MgU3ltYm9sIFMgVGl0bGVjYXNlX0xldHRlciBMdCBVbmFzc2lnbmVkIENuIFVwcGVyY2FzZV9MZXR0ZXIgTHVcIjtcblxuLy8gI3RhYmxlLXVuaWNvZGUtc2NyaXB0LXZhbHVlc1xudmFyIGVjbWE5U2NyaXB0VmFsdWVzID0gXCJBZGxhbSBBZGxtIEFob20gQW5hdG9saWFuX0hpZXJvZ2x5cGhzIEhsdXcgQXJhYmljIEFyYWIgQXJtZW5pYW4gQXJtbiBBdmVzdGFuIEF2c3QgQmFsaW5lc2UgQmFsaSBCYW11bSBCYW11IEJhc3NhX1ZhaCBCYXNzIEJhdGFrIEJhdGsgQmVuZ2FsaSBCZW5nIEJoYWlrc3VraSBCaGtzIEJvcG9tb2ZvIEJvcG8gQnJhaG1pIEJyYWggQnJhaWxsZSBCcmFpIEJ1Z2luZXNlIEJ1Z2kgQnVoaWQgQnVoZCBDYW5hZGlhbl9BYm9yaWdpbmFsIENhbnMgQ2FyaWFuIENhcmkgQ2F1Y2FzaWFuX0FsYmFuaWFuIEFnaGIgQ2hha21hIENha20gQ2hhbSBDaGFtIENoZXJva2VlIENoZXIgQ29tbW9uIFp5eXkgQ29wdGljIENvcHQgUWFhYyBDdW5laWZvcm0gWHN1eCBDeXByaW90IENwcnQgQ3lyaWxsaWMgQ3lybCBEZXNlcmV0IERzcnQgRGV2YW5hZ2FyaSBEZXZhIER1cGxveWFuIER1cGwgRWd5cHRpYW5fSGllcm9nbHlwaHMgRWd5cCBFbGJhc2FuIEVsYmEgRXRoaW9waWMgRXRoaSBHZW9yZ2lhbiBHZW9yIEdsYWdvbGl0aWMgR2xhZyBHb3RoaWMgR290aCBHcmFudGhhIEdyYW4gR3JlZWsgR3JlayBHdWphcmF0aSBHdWpyIEd1cm11a2hpIEd1cnUgSGFuIEhhbmkgSGFuZ3VsIEhhbmcgSGFudW5vbyBIYW5vIEhhdHJhbiBIYXRyIEhlYnJldyBIZWJyIEhpcmFnYW5hIEhpcmEgSW1wZXJpYWxfQXJhbWFpYyBBcm1pIEluaGVyaXRlZCBaaW5oIFFhYWkgSW5zY3JpcHRpb25hbF9QYWhsYXZpIFBobGkgSW5zY3JpcHRpb25hbF9QYXJ0aGlhbiBQcnRpIEphdmFuZXNlIEphdmEgS2FpdGhpIEt0aGkgS2FubmFkYSBLbmRhIEthdGFrYW5hIEthbmEgS2F5YWhfTGkgS2FsaSBLaGFyb3NodGhpIEtoYXIgS2htZXIgS2htciBLaG9qa2kgS2hvaiBLaHVkYXdhZGkgU2luZCBMYW8gTGFvbyBMYXRpbiBMYXRuIExlcGNoYSBMZXBjIExpbWJ1IExpbWIgTGluZWFyX0EgTGluYSBMaW5lYXJfQiBMaW5iIExpc3UgTGlzdSBMeWNpYW4gTHljaSBMeWRpYW4gTHlkaSBNYWhhamFuaSBNYWhqIE1hbGF5YWxhbSBNbHltIE1hbmRhaWMgTWFuZCBNYW5pY2hhZWFuIE1hbmkgTWFyY2hlbiBNYXJjIE1hc2FyYW1fR29uZGkgR29ubSBNZWV0ZWlfTWF5ZWsgTXRlaSBNZW5kZV9LaWtha3VpIE1lbmQgTWVyb2l0aWNfQ3Vyc2l2ZSBNZXJjIE1lcm9pdGljX0hpZXJvZ2x5cGhzIE1lcm8gTWlhbyBQbHJkIE1vZGkgTW9uZ29saWFuIE1vbmcgTXJvIE1yb28gTXVsdGFuaSBNdWx0IE15YW5tYXIgTXltciBOYWJhdGFlYW4gTmJhdCBOZXdfVGFpX0x1ZSBUYWx1IE5ld2EgTmV3YSBOa28gTmtvbyBOdXNodSBOc2h1IE9naGFtIE9nYW0gT2xfQ2hpa2kgT2xjayBPbGRfSHVuZ2FyaWFuIEh1bmcgT2xkX0l0YWxpYyBJdGFsIE9sZF9Ob3J0aF9BcmFiaWFuIE5hcmIgT2xkX1Blcm1pYyBQZXJtIE9sZF9QZXJzaWFuIFhwZW8gT2xkX1NvdXRoX0FyYWJpYW4gU2FyYiBPbGRfVHVya2ljIE9ya2ggT3JpeWEgT3J5YSBPc2FnZSBPc2dlIE9zbWFueWEgT3NtYSBQYWhhd2hfSG1vbmcgSG1uZyBQYWxteXJlbmUgUGFsbSBQYXVfQ2luX0hhdSBQYXVjIFBoYWdzX1BhIFBoYWcgUGhvZW5pY2lhbiBQaG54IFBzYWx0ZXJfUGFobGF2aSBQaGxwIFJlamFuZyBSam5nIFJ1bmljIFJ1bnIgU2FtYXJpdGFuIFNhbXIgU2F1cmFzaHRyYSBTYXVyIFNoYXJhZGEgU2hyZCBTaGF2aWFuIFNoYXcgU2lkZGhhbSBTaWRkIFNpZ25Xcml0aW5nIFNnbncgU2luaGFsYSBTaW5oIFNvcmFfU29tcGVuZyBTb3JhIFNveW9tYm8gU295byBTdW5kYW5lc2UgU3VuZCBTeWxvdGlfTmFncmkgU3lsbyBTeXJpYWMgU3lyYyBUYWdhbG9nIFRnbGcgVGFnYmFud2EgVGFnYiBUYWlfTGUgVGFsZSBUYWlfVGhhbSBMYW5hIFRhaV9WaWV0IFRhdnQgVGFrcmkgVGFrciBUYW1pbCBUYW1sIFRhbmd1dCBUYW5nIFRlbHVndSBUZWx1IFRoYWFuYSBUaGFhIFRoYWkgVGhhaSBUaWJldGFuIFRpYnQgVGlmaW5hZ2ggVGZuZyBUaXJodXRhIFRpcmggVWdhcml0aWMgVWdhciBWYWkgVmFpaSBXYXJhbmdfQ2l0aSBXYXJhIFlpIFlpaWkgWmFuYWJhemFyX1NxdWFyZSBaYW5iXCI7XG52YXIgZWNtYTEwU2NyaXB0VmFsdWVzID0gZWNtYTlTY3JpcHRWYWx1ZXMgKyBcIiBEb2dyYSBEb2dyIEd1bmphbGFfR29uZGkgR29uZyBIYW5pZmlfUm9oaW5neWEgUm9oZyBNYWthc2FyIE1ha2EgTWVkZWZhaWRyaW4gTWVkZiBPbGRfU29nZGlhbiBTb2dvIFNvZ2RpYW4gU29nZFwiO1xudmFyIGVjbWExMVNjcmlwdFZhbHVlcyA9IGVjbWExMFNjcmlwdFZhbHVlcyArIFwiIEVseW1haWMgRWx5bSBOYW5kaW5hZ2FyaSBOYW5kIE55aWFrZW5nX1B1YWNodWVfSG1vbmcgSG1ucCBXYW5jaG8gV2Nob1wiO1xudmFyIGVjbWExMlNjcmlwdFZhbHVlcyA9IGVjbWExMVNjcmlwdFZhbHVlcyArIFwiIENob3Jhc21pYW4gQ2hycyBEaWFrIERpdmVzX0FrdXJ1IEtoaXRhbl9TbWFsbF9TY3JpcHQgS2l0cyBZZXppIFllemlkaVwiO1xudmFyIGVjbWExM1NjcmlwdFZhbHVlcyA9IGVjbWExMlNjcmlwdFZhbHVlcyArIFwiIEN5cHJvX01pbm9hbiBDcG1uIE9sZF9VeWdodXIgT3VnciBUYW5nc2EgVG5zYSBUb3RvIFZpdGhrdXFpIFZpdGhcIjtcbnZhciBlY21hMTRTY3JpcHRWYWx1ZXMgPSBlY21hMTNTY3JpcHRWYWx1ZXMgKyBcIiBcIiArIHNjcmlwdFZhbHVlc0FkZGVkSW5Vbmljb2RlO1xuXG52YXIgdW5pY29kZVNjcmlwdFZhbHVlcyA9IHtcbiAgOTogZWNtYTlTY3JpcHRWYWx1ZXMsXG4gIDEwOiBlY21hMTBTY3JpcHRWYWx1ZXMsXG4gIDExOiBlY21hMTFTY3JpcHRWYWx1ZXMsXG4gIDEyOiBlY21hMTJTY3JpcHRWYWx1ZXMsXG4gIDEzOiBlY21hMTNTY3JpcHRWYWx1ZXMsXG4gIDE0OiBlY21hMTRTY3JpcHRWYWx1ZXNcbn07XG5cbnZhciBkYXRhID0ge307XG5mdW5jdGlvbiBidWlsZFVuaWNvZGVEYXRhKGVjbWFWZXJzaW9uKSB7XG4gIHZhciBkID0gZGF0YVtlY21hVmVyc2lvbl0gPSB7XG4gICAgYmluYXJ5OiB3b3Jkc1JlZ2V4cCh1bmljb2RlQmluYXJ5UHJvcGVydGllc1tlY21hVmVyc2lvbl0gKyBcIiBcIiArIHVuaWNvZGVHZW5lcmFsQ2F0ZWdvcnlWYWx1ZXMpLFxuICAgIGJpbmFyeU9mU3RyaW5nczogd29yZHNSZWdleHAodW5pY29kZUJpbmFyeVByb3BlcnRpZXNPZlN0cmluZ3NbZWNtYVZlcnNpb25dKSxcbiAgICBub25CaW5hcnk6IHtcbiAgICAgIEdlbmVyYWxfQ2F0ZWdvcnk6IHdvcmRzUmVnZXhwKHVuaWNvZGVHZW5lcmFsQ2F0ZWdvcnlWYWx1ZXMpLFxuICAgICAgU2NyaXB0OiB3b3Jkc1JlZ2V4cCh1bmljb2RlU2NyaXB0VmFsdWVzW2VjbWFWZXJzaW9uXSlcbiAgICB9XG4gIH07XG4gIGQubm9uQmluYXJ5LlNjcmlwdF9FeHRlbnNpb25zID0gZC5ub25CaW5hcnkuU2NyaXB0O1xuXG4gIGQubm9uQmluYXJ5LmdjID0gZC5ub25CaW5hcnkuR2VuZXJhbF9DYXRlZ29yeTtcbiAgZC5ub25CaW5hcnkuc2MgPSBkLm5vbkJpbmFyeS5TY3JpcHQ7XG4gIGQubm9uQmluYXJ5LnNjeCA9IGQubm9uQmluYXJ5LlNjcmlwdF9FeHRlbnNpb25zO1xufVxuXG5mb3IgKHZhciBpID0gMCwgbGlzdCA9IFs5LCAxMCwgMTEsIDEyLCAxMywgMTRdOyBpIDwgbGlzdC5sZW5ndGg7IGkgKz0gMSkge1xuICB2YXIgZWNtYVZlcnNpb24gPSBsaXN0W2ldO1xuXG4gIGJ1aWxkVW5pY29kZURhdGEoZWNtYVZlcnNpb24pO1xufVxuXG52YXIgcHAkMSA9IFBhcnNlci5wcm90b3R5cGU7XG5cbi8vIFRyYWNrIGRpc2p1bmN0aW9uIHN0cnVjdHVyZSB0byBkZXRlcm1pbmUgd2hldGhlciBhIGR1cGxpY2F0ZVxuLy8gY2FwdHVyZSBncm91cCBuYW1lIGlzIGFsbG93ZWQgYmVjYXVzZSBpdCBpcyBpbiBhIHNlcGFyYXRlIGJyYW5jaC5cbnZhciBCcmFuY2hJRCA9IGZ1bmN0aW9uIEJyYW5jaElEKHBhcmVudCwgYmFzZSkge1xuICAvLyBQYXJlbnQgZGlzanVuY3Rpb24gYnJhbmNoXG4gIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAvLyBJZGVudGlmaWVzIHRoaXMgc2V0IG9mIHNpYmxpbmcgYnJhbmNoZXNcbiAgdGhpcy5iYXNlID0gYmFzZSB8fCB0aGlzO1xufTtcblxuQnJhbmNoSUQucHJvdG90eXBlLnNlcGFyYXRlZEZyb20gPSBmdW5jdGlvbiBzZXBhcmF0ZWRGcm9tIChhbHQpIHtcbiAgLy8gQSBicmFuY2ggaXMgc2VwYXJhdGUgZnJvbSBhbm90aGVyIGJyYW5jaCBpZiB0aGV5IG9yIGFueSBvZlxuICAvLyB0aGVpciBwYXJlbnRzIGFyZSBzaWJsaW5ncyBpbiBhIGdpdmVuIGRpc2p1bmN0aW9uXG4gIGZvciAodmFyIHNlbGYgPSB0aGlzOyBzZWxmOyBzZWxmID0gc2VsZi5wYXJlbnQpIHtcbiAgICBmb3IgKHZhciBvdGhlciA9IGFsdDsgb3RoZXI7IG90aGVyID0gb3RoZXIucGFyZW50KSB7XG4gICAgICBpZiAoc2VsZi5iYXNlID09PSBvdGhlci5iYXNlICYmIHNlbGYgIT09IG90aGVyKSB7IHJldHVybiB0cnVlIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG5CcmFuY2hJRC5wcm90b3R5cGUuc2libGluZyA9IGZ1bmN0aW9uIHNpYmxpbmcgKCkge1xuICByZXR1cm4gbmV3IEJyYW5jaElEKHRoaXMucGFyZW50LCB0aGlzLmJhc2UpXG59O1xuXG52YXIgUmVnRXhwVmFsaWRhdGlvblN0YXRlID0gZnVuY3Rpb24gUmVnRXhwVmFsaWRhdGlvblN0YXRlKHBhcnNlcikge1xuICB0aGlzLnBhcnNlciA9IHBhcnNlcjtcbiAgdGhpcy52YWxpZEZsYWdzID0gXCJnaW1cIiArIChwYXJzZXIub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2ID8gXCJ1eVwiIDogXCJcIikgKyAocGFyc2VyLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOSA/IFwic1wiIDogXCJcIikgKyAocGFyc2VyLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTMgPyBcImRcIiA6IFwiXCIpICsgKHBhcnNlci5vcHRpb25zLmVjbWFWZXJzaW9uID49IDE1ID8gXCJ2XCIgOiBcIlwiKTtcbiAgdGhpcy51bmljb2RlUHJvcGVydGllcyA9IGRhdGFbcGFyc2VyLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTQgPyAxNCA6IHBhcnNlci5vcHRpb25zLmVjbWFWZXJzaW9uXTtcbiAgdGhpcy5zb3VyY2UgPSBcIlwiO1xuICB0aGlzLmZsYWdzID0gXCJcIjtcbiAgdGhpcy5zdGFydCA9IDA7XG4gIHRoaXMuc3dpdGNoVSA9IGZhbHNlO1xuICB0aGlzLnN3aXRjaFYgPSBmYWxzZTtcbiAgdGhpcy5zd2l0Y2hOID0gZmFsc2U7XG4gIHRoaXMucG9zID0gMDtcbiAgdGhpcy5sYXN0SW50VmFsdWUgPSAwO1xuICB0aGlzLmxhc3RTdHJpbmdWYWx1ZSA9IFwiXCI7XG4gIHRoaXMubGFzdEFzc2VydGlvbklzUXVhbnRpZmlhYmxlID0gZmFsc2U7XG4gIHRoaXMubnVtQ2FwdHVyaW5nUGFyZW5zID0gMDtcbiAgdGhpcy5tYXhCYWNrUmVmZXJlbmNlID0gMDtcbiAgdGhpcy5ncm91cE5hbWVzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgdGhpcy5iYWNrUmVmZXJlbmNlTmFtZXMgPSBbXTtcbiAgdGhpcy5icmFuY2hJRCA9IG51bGw7XG59O1xuXG5SZWdFeHBWYWxpZGF0aW9uU3RhdGUucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gcmVzZXQgKHN0YXJ0LCBwYXR0ZXJuLCBmbGFncykge1xuICB2YXIgdW5pY29kZVNldHMgPSBmbGFncy5pbmRleE9mKFwidlwiKSAhPT0gLTE7XG4gIHZhciB1bmljb2RlID0gZmxhZ3MuaW5kZXhPZihcInVcIikgIT09IC0xO1xuICB0aGlzLnN0YXJ0ID0gc3RhcnQgfCAwO1xuICB0aGlzLnNvdXJjZSA9IHBhdHRlcm4gKyBcIlwiO1xuICB0aGlzLmZsYWdzID0gZmxhZ3M7XG4gIGlmICh1bmljb2RlU2V0cyAmJiB0aGlzLnBhcnNlci5vcHRpb25zLmVjbWFWZXJzaW9uID49IDE1KSB7XG4gICAgdGhpcy5zd2l0Y2hVID0gdHJ1ZTtcbiAgICB0aGlzLnN3aXRjaFYgPSB0cnVlO1xuICAgIHRoaXMuc3dpdGNoTiA9IHRydWU7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5zd2l0Y2hVID0gdW5pY29kZSAmJiB0aGlzLnBhcnNlci5vcHRpb25zLmVjbWFWZXJzaW9uID49IDY7XG4gICAgdGhpcy5zd2l0Y2hWID0gZmFsc2U7XG4gICAgdGhpcy5zd2l0Y2hOID0gdW5pY29kZSAmJiB0aGlzLnBhcnNlci5vcHRpb25zLmVjbWFWZXJzaW9uID49IDk7XG4gIH1cbn07XG5cblJlZ0V4cFZhbGlkYXRpb25TdGF0ZS5wcm90b3R5cGUucmFpc2UgPSBmdW5jdGlvbiByYWlzZSAobWVzc2FnZSkge1xuICB0aGlzLnBhcnNlci5yYWlzZVJlY292ZXJhYmxlKHRoaXMuc3RhcnQsIChcIkludmFsaWQgcmVndWxhciBleHByZXNzaW9uOiAvXCIgKyAodGhpcy5zb3VyY2UpICsgXCIvOiBcIiArIG1lc3NhZ2UpKTtcbn07XG5cbi8vIElmIHUgZmxhZyBpcyBnaXZlbiwgdGhpcyByZXR1cm5zIHRoZSBjb2RlIHBvaW50IGF0IHRoZSBpbmRleCAoaXQgY29tYmluZXMgYSBzdXJyb2dhdGUgcGFpcikuXG4vLyBPdGhlcndpc2UsIHRoaXMgcmV0dXJucyB0aGUgY29kZSB1bml0IG9mIHRoZSBpbmRleCAoY2FuIGJlIGEgcGFydCBvZiBhIHN1cnJvZ2F0ZSBwYWlyKS5cblJlZ0V4cFZhbGlkYXRpb25TdGF0ZS5wcm90b3R5cGUuYXQgPSBmdW5jdGlvbiBhdCAoaSwgZm9yY2VVKSB7XG4gICAgaWYgKCBmb3JjZVUgPT09IHZvaWQgMCApIGZvcmNlVSA9IGZhbHNlO1xuXG4gIHZhciBzID0gdGhpcy5zb3VyY2U7XG4gIHZhciBsID0gcy5sZW5ndGg7XG4gIGlmIChpID49IGwpIHtcbiAgICByZXR1cm4gLTFcbiAgfVxuICB2YXIgYyA9IHMuY2hhckNvZGVBdChpKTtcbiAgaWYgKCEoZm9yY2VVIHx8IHRoaXMuc3dpdGNoVSkgfHwgYyA8PSAweEQ3RkYgfHwgYyA+PSAweEUwMDAgfHwgaSArIDEgPj0gbCkge1xuICAgIHJldHVybiBjXG4gIH1cbiAgdmFyIG5leHQgPSBzLmNoYXJDb2RlQXQoaSArIDEpO1xuICByZXR1cm4gbmV4dCA+PSAweERDMDAgJiYgbmV4dCA8PSAweERGRkYgPyAoYyA8PCAxMCkgKyBuZXh0IC0gMHgzNUZEQzAwIDogY1xufTtcblxuUmVnRXhwVmFsaWRhdGlvblN0YXRlLnByb3RvdHlwZS5uZXh0SW5kZXggPSBmdW5jdGlvbiBuZXh0SW5kZXggKGksIGZvcmNlVSkge1xuICAgIGlmICggZm9yY2VVID09PSB2b2lkIDAgKSBmb3JjZVUgPSBmYWxzZTtcblxuICB2YXIgcyA9IHRoaXMuc291cmNlO1xuICB2YXIgbCA9IHMubGVuZ3RoO1xuICBpZiAoaSA+PSBsKSB7XG4gICAgcmV0dXJuIGxcbiAgfVxuICB2YXIgYyA9IHMuY2hhckNvZGVBdChpKSwgbmV4dDtcbiAgaWYgKCEoZm9yY2VVIHx8IHRoaXMuc3dpdGNoVSkgfHwgYyA8PSAweEQ3RkYgfHwgYyA+PSAweEUwMDAgfHwgaSArIDEgPj0gbCB8fFxuICAgICAgKG5leHQgPSBzLmNoYXJDb2RlQXQoaSArIDEpKSA8IDB4REMwMCB8fCBuZXh0ID4gMHhERkZGKSB7XG4gICAgcmV0dXJuIGkgKyAxXG4gIH1cbiAgcmV0dXJuIGkgKyAyXG59O1xuXG5SZWdFeHBWYWxpZGF0aW9uU3RhdGUucHJvdG90eXBlLmN1cnJlbnQgPSBmdW5jdGlvbiBjdXJyZW50IChmb3JjZVUpIHtcbiAgICBpZiAoIGZvcmNlVSA9PT0gdm9pZCAwICkgZm9yY2VVID0gZmFsc2U7XG5cbiAgcmV0dXJuIHRoaXMuYXQodGhpcy5wb3MsIGZvcmNlVSlcbn07XG5cblJlZ0V4cFZhbGlkYXRpb25TdGF0ZS5wcm90b3R5cGUubG9va2FoZWFkID0gZnVuY3Rpb24gbG9va2FoZWFkIChmb3JjZVUpIHtcbiAgICBpZiAoIGZvcmNlVSA9PT0gdm9pZCAwICkgZm9yY2VVID0gZmFsc2U7XG5cbiAgcmV0dXJuIHRoaXMuYXQodGhpcy5uZXh0SW5kZXgodGhpcy5wb3MsIGZvcmNlVSksIGZvcmNlVSlcbn07XG5cblJlZ0V4cFZhbGlkYXRpb25TdGF0ZS5wcm90b3R5cGUuYWR2YW5jZSA9IGZ1bmN0aW9uIGFkdmFuY2UgKGZvcmNlVSkge1xuICAgIGlmICggZm9yY2VVID09PSB2b2lkIDAgKSBmb3JjZVUgPSBmYWxzZTtcblxuICB0aGlzLnBvcyA9IHRoaXMubmV4dEluZGV4KHRoaXMucG9zLCBmb3JjZVUpO1xufTtcblxuUmVnRXhwVmFsaWRhdGlvblN0YXRlLnByb3RvdHlwZS5lYXQgPSBmdW5jdGlvbiBlYXQgKGNoLCBmb3JjZVUpIHtcbiAgICBpZiAoIGZvcmNlVSA9PT0gdm9pZCAwICkgZm9yY2VVID0gZmFsc2U7XG5cbiAgaWYgKHRoaXMuY3VycmVudChmb3JjZVUpID09PSBjaCkge1xuICAgIHRoaXMuYWR2YW5jZShmb3JjZVUpO1xuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG5SZWdFeHBWYWxpZGF0aW9uU3RhdGUucHJvdG90eXBlLmVhdENoYXJzID0gZnVuY3Rpb24gZWF0Q2hhcnMgKGNocywgZm9yY2VVKSB7XG4gICAgaWYgKCBmb3JjZVUgPT09IHZvaWQgMCApIGZvcmNlVSA9IGZhbHNlO1xuXG4gIHZhciBwb3MgPSB0aGlzLnBvcztcbiAgZm9yICh2YXIgaSA9IDAsIGxpc3QgPSBjaHM7IGkgPCBsaXN0Lmxlbmd0aDsgaSArPSAxKSB7XG4gICAgdmFyIGNoID0gbGlzdFtpXTtcblxuICAgICAgdmFyIGN1cnJlbnQgPSB0aGlzLmF0KHBvcywgZm9yY2VVKTtcbiAgICBpZiAoY3VycmVudCA9PT0gLTEgfHwgY3VycmVudCAhPT0gY2gpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICBwb3MgPSB0aGlzLm5leHRJbmRleChwb3MsIGZvcmNlVSk7XG4gIH1cbiAgdGhpcy5wb3MgPSBwb3M7XG4gIHJldHVybiB0cnVlXG59O1xuXG4vKipcbiAqIFZhbGlkYXRlIHRoZSBmbGFncyBwYXJ0IG9mIGEgZ2l2ZW4gUmVnRXhwTGl0ZXJhbC5cbiAqXG4gKiBAcGFyYW0ge1JlZ0V4cFZhbGlkYXRpb25TdGF0ZX0gc3RhdGUgVGhlIHN0YXRlIHRvIHZhbGlkYXRlIFJlZ0V4cC5cbiAqIEByZXR1cm5zIHt2b2lkfVxuICovXG5wcCQxLnZhbGlkYXRlUmVnRXhwRmxhZ3MgPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgdmFsaWRGbGFncyA9IHN0YXRlLnZhbGlkRmxhZ3M7XG4gIHZhciBmbGFncyA9IHN0YXRlLmZsYWdzO1xuXG4gIHZhciB1ID0gZmFsc2U7XG4gIHZhciB2ID0gZmFsc2U7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBmbGFncy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBmbGFnID0gZmxhZ3MuY2hhckF0KGkpO1xuICAgIGlmICh2YWxpZEZsYWdzLmluZGV4T2YoZmxhZykgPT09IC0xKSB7XG4gICAgICB0aGlzLnJhaXNlKHN0YXRlLnN0YXJ0LCBcIkludmFsaWQgcmVndWxhciBleHByZXNzaW9uIGZsYWdcIik7XG4gICAgfVxuICAgIGlmIChmbGFncy5pbmRleE9mKGZsYWcsIGkgKyAxKSA+IC0xKSB7XG4gICAgICB0aGlzLnJhaXNlKHN0YXRlLnN0YXJ0LCBcIkR1cGxpY2F0ZSByZWd1bGFyIGV4cHJlc3Npb24gZmxhZ1wiKTtcbiAgICB9XG4gICAgaWYgKGZsYWcgPT09IFwidVwiKSB7IHUgPSB0cnVlOyB9XG4gICAgaWYgKGZsYWcgPT09IFwidlwiKSB7IHYgPSB0cnVlOyB9XG4gIH1cbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSAxNSAmJiB1ICYmIHYpIHtcbiAgICB0aGlzLnJhaXNlKHN0YXRlLnN0YXJ0LCBcIkludmFsaWQgcmVndWxhciBleHByZXNzaW9uIGZsYWdcIik7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGhhc1Byb3Aob2JqKSB7XG4gIGZvciAodmFyIF8gaW4gb2JqKSB7IHJldHVybiB0cnVlIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICogVmFsaWRhdGUgdGhlIHBhdHRlcm4gcGFydCBvZiBhIGdpdmVuIFJlZ0V4cExpdGVyYWwuXG4gKlxuICogQHBhcmFtIHtSZWdFeHBWYWxpZGF0aW9uU3RhdGV9IHN0YXRlIFRoZSBzdGF0ZSB0byB2YWxpZGF0ZSBSZWdFeHAuXG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqL1xucHAkMS52YWxpZGF0ZVJlZ0V4cFBhdHRlcm4gPSBmdW5jdGlvbihzdGF0ZSkge1xuICB0aGlzLnJlZ2V4cF9wYXR0ZXJuKHN0YXRlKTtcblxuICAvLyBUaGUgZ29hbCBzeW1ib2wgZm9yIHRoZSBwYXJzZSBpcyB8UGF0dGVyblt+VSwgfk5dfC4gSWYgdGhlIHJlc3VsdCBvZlxuICAvLyBwYXJzaW5nIGNvbnRhaW5zIGEgfEdyb3VwTmFtZXwsIHJlcGFyc2Ugd2l0aCB0aGUgZ29hbCBzeW1ib2xcbiAgLy8gfFBhdHRlcm5bflUsICtOXXwgYW5kIHVzZSB0aGlzIHJlc3VsdCBpbnN0ZWFkLiBUaHJvdyBhICpTeW50YXhFcnJvcipcbiAgLy8gZXhjZXB0aW9uIGlmIF9QXyBkaWQgbm90IGNvbmZvcm0gdG8gdGhlIGdyYW1tYXIsIGlmIGFueSBlbGVtZW50cyBvZiBfUF9cbiAgLy8gd2VyZSBub3QgbWF0Y2hlZCBieSB0aGUgcGFyc2UsIG9yIGlmIGFueSBFYXJseSBFcnJvciBjb25kaXRpb25zIGV4aXN0LlxuICBpZiAoIXN0YXRlLnN3aXRjaE4gJiYgdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDkgJiYgaGFzUHJvcChzdGF0ZS5ncm91cE5hbWVzKSkge1xuICAgIHN0YXRlLnN3aXRjaE4gPSB0cnVlO1xuICAgIHRoaXMucmVnZXhwX3BhdHRlcm4oc3RhdGUpO1xuICB9XG59O1xuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1QYXR0ZXJuXG5wcCQxLnJlZ2V4cF9wYXR0ZXJuID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgc3RhdGUucG9zID0gMDtcbiAgc3RhdGUubGFzdEludFZhbHVlID0gMDtcbiAgc3RhdGUubGFzdFN0cmluZ1ZhbHVlID0gXCJcIjtcbiAgc3RhdGUubGFzdEFzc2VydGlvbklzUXVhbnRpZmlhYmxlID0gZmFsc2U7XG4gIHN0YXRlLm51bUNhcHR1cmluZ1BhcmVucyA9IDA7XG4gIHN0YXRlLm1heEJhY2tSZWZlcmVuY2UgPSAwO1xuICBzdGF0ZS5ncm91cE5hbWVzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgc3RhdGUuYmFja1JlZmVyZW5jZU5hbWVzLmxlbmd0aCA9IDA7XG4gIHN0YXRlLmJyYW5jaElEID0gbnVsbDtcblxuICB0aGlzLnJlZ2V4cF9kaXNqdW5jdGlvbihzdGF0ZSk7XG5cbiAgaWYgKHN0YXRlLnBvcyAhPT0gc3RhdGUuc291cmNlLmxlbmd0aCkge1xuICAgIC8vIE1ha2UgdGhlIHNhbWUgbWVzc2FnZXMgYXMgVjguXG4gICAgaWYgKHN0YXRlLmVhdCgweDI5IC8qICkgKi8pKSB7XG4gICAgICBzdGF0ZS5yYWlzZShcIlVubWF0Y2hlZCAnKSdcIik7XG4gICAgfVxuICAgIGlmIChzdGF0ZS5lYXQoMHg1RCAvKiBdICovKSB8fCBzdGF0ZS5lYXQoMHg3RCAvKiB9ICovKSkge1xuICAgICAgc3RhdGUucmFpc2UoXCJMb25lIHF1YW50aWZpZXIgYnJhY2tldHNcIik7XG4gICAgfVxuICB9XG4gIGlmIChzdGF0ZS5tYXhCYWNrUmVmZXJlbmNlID4gc3RhdGUubnVtQ2FwdHVyaW5nUGFyZW5zKSB7XG4gICAgc3RhdGUucmFpc2UoXCJJbnZhbGlkIGVzY2FwZVwiKTtcbiAgfVxuICBmb3IgKHZhciBpID0gMCwgbGlzdCA9IHN0YXRlLmJhY2tSZWZlcmVuY2VOYW1lczsgaSA8IGxpc3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICB2YXIgbmFtZSA9IGxpc3RbaV07XG5cbiAgICBpZiAoIXN0YXRlLmdyb3VwTmFtZXNbbmFtZV0pIHtcbiAgICAgIHN0YXRlLnJhaXNlKFwiSW52YWxpZCBuYW1lZCBjYXB0dXJlIHJlZmVyZW5jZWRcIik7XG4gICAgfVxuICB9XG59O1xuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1EaXNqdW5jdGlvblxucHAkMS5yZWdleHBfZGlzanVuY3Rpb24gPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgdHJhY2tEaXNqdW5jdGlvbiA9IHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSAxNjtcbiAgaWYgKHRyYWNrRGlzanVuY3Rpb24pIHsgc3RhdGUuYnJhbmNoSUQgPSBuZXcgQnJhbmNoSUQoc3RhdGUuYnJhbmNoSUQsIG51bGwpOyB9XG4gIHRoaXMucmVnZXhwX2FsdGVybmF0aXZlKHN0YXRlKTtcbiAgd2hpbGUgKHN0YXRlLmVhdCgweDdDIC8qIHwgKi8pKSB7XG4gICAgaWYgKHRyYWNrRGlzanVuY3Rpb24pIHsgc3RhdGUuYnJhbmNoSUQgPSBzdGF0ZS5icmFuY2hJRC5zaWJsaW5nKCk7IH1cbiAgICB0aGlzLnJlZ2V4cF9hbHRlcm5hdGl2ZShzdGF0ZSk7XG4gIH1cbiAgaWYgKHRyYWNrRGlzanVuY3Rpb24pIHsgc3RhdGUuYnJhbmNoSUQgPSBzdGF0ZS5icmFuY2hJRC5wYXJlbnQ7IH1cblxuICAvLyBNYWtlIHRoZSBzYW1lIG1lc3NhZ2UgYXMgVjguXG4gIGlmICh0aGlzLnJlZ2V4cF9lYXRRdWFudGlmaWVyKHN0YXRlLCB0cnVlKSkge1xuICAgIHN0YXRlLnJhaXNlKFwiTm90aGluZyB0byByZXBlYXRcIik7XG4gIH1cbiAgaWYgKHN0YXRlLmVhdCgweDdCIC8qIHsgKi8pKSB7XG4gICAgc3RhdGUucmFpc2UoXCJMb25lIHF1YW50aWZpZXIgYnJhY2tldHNcIik7XG4gIH1cbn07XG5cbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLUFsdGVybmF0aXZlXG5wcCQxLnJlZ2V4cF9hbHRlcm5hdGl2ZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHdoaWxlIChzdGF0ZS5wb3MgPCBzdGF0ZS5zb3VyY2UubGVuZ3RoICYmIHRoaXMucmVnZXhwX2VhdFRlcm0oc3RhdGUpKSB7fVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtYW5uZXhCLVRlcm1cbnBwJDEucmVnZXhwX2VhdFRlcm0gPSBmdW5jdGlvbihzdGF0ZSkge1xuICBpZiAodGhpcy5yZWdleHBfZWF0QXNzZXJ0aW9uKHN0YXRlKSkge1xuICAgIC8vIEhhbmRsZSBgUXVhbnRpZmlhYmxlQXNzZXJ0aW9uIFF1YW50aWZpZXJgIGFsdGVybmF0aXZlLlxuICAgIC8vIGBzdGF0ZS5sYXN0QXNzZXJ0aW9uSXNRdWFudGlmaWFibGVgIGlzIHRydWUgaWYgdGhlIGxhc3QgZWF0ZW4gQXNzZXJ0aW9uXG4gICAgLy8gaXMgYSBRdWFudGlmaWFibGVBc3NlcnRpb24uXG4gICAgaWYgKHN0YXRlLmxhc3RBc3NlcnRpb25Jc1F1YW50aWZpYWJsZSAmJiB0aGlzLnJlZ2V4cF9lYXRRdWFudGlmaWVyKHN0YXRlKSkge1xuICAgICAgLy8gTWFrZSB0aGUgc2FtZSBtZXNzYWdlIGFzIFY4LlxuICAgICAgaWYgKHN0YXRlLnN3aXRjaFUpIHtcbiAgICAgICAgc3RhdGUucmFpc2UoXCJJbnZhbGlkIHF1YW50aWZpZXJcIik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBpZiAoc3RhdGUuc3dpdGNoVSA/IHRoaXMucmVnZXhwX2VhdEF0b20oc3RhdGUpIDogdGhpcy5yZWdleHBfZWF0RXh0ZW5kZWRBdG9tKHN0YXRlKSkge1xuICAgIHRoaXMucmVnZXhwX2VhdFF1YW50aWZpZXIoc3RhdGUpO1xuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICByZXR1cm4gZmFsc2Vcbn07XG5cbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLWFubmV4Qi1Bc3NlcnRpb25cbnBwJDEucmVnZXhwX2VhdEFzc2VydGlvbiA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcbiAgc3RhdGUubGFzdEFzc2VydGlvbklzUXVhbnRpZmlhYmxlID0gZmFsc2U7XG5cbiAgLy8gXiwgJFxuICBpZiAoc3RhdGUuZWF0KDB4NUUgLyogXiAqLykgfHwgc3RhdGUuZWF0KDB4MjQgLyogJCAqLykpIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgLy8gXFxiIFxcQlxuICBpZiAoc3RhdGUuZWF0KDB4NUMgLyogXFwgKi8pKSB7XG4gICAgaWYgKHN0YXRlLmVhdCgweDQyIC8qIEIgKi8pIHx8IHN0YXRlLmVhdCgweDYyIC8qIGIgKi8pKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICBzdGF0ZS5wb3MgPSBzdGFydDtcbiAgfVxuXG4gIC8vIExvb2thaGVhZCAvIExvb2tiZWhpbmRcbiAgaWYgKHN0YXRlLmVhdCgweDI4IC8qICggKi8pICYmIHN0YXRlLmVhdCgweDNGIC8qID8gKi8pKSB7XG4gICAgdmFyIGxvb2tiZWhpbmQgPSBmYWxzZTtcbiAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDkpIHtcbiAgICAgIGxvb2tiZWhpbmQgPSBzdGF0ZS5lYXQoMHgzQyAvKiA8ICovKTtcbiAgICB9XG4gICAgaWYgKHN0YXRlLmVhdCgweDNEIC8qID0gKi8pIHx8IHN0YXRlLmVhdCgweDIxIC8qICEgKi8pKSB7XG4gICAgICB0aGlzLnJlZ2V4cF9kaXNqdW5jdGlvbihzdGF0ZSk7XG4gICAgICBpZiAoIXN0YXRlLmVhdCgweDI5IC8qICkgKi8pKSB7XG4gICAgICAgIHN0YXRlLnJhaXNlKFwiVW50ZXJtaW5hdGVkIGdyb3VwXCIpO1xuICAgICAgfVxuICAgICAgc3RhdGUubGFzdEFzc2VydGlvbklzUXVhbnRpZmlhYmxlID0gIWxvb2tiZWhpbmQ7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuXG4gIHN0YXRlLnBvcyA9IHN0YXJ0O1xuICByZXR1cm4gZmFsc2Vcbn07XG5cbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLVF1YW50aWZpZXJcbnBwJDEucmVnZXhwX2VhdFF1YW50aWZpZXIgPSBmdW5jdGlvbihzdGF0ZSwgbm9FcnJvcikge1xuICBpZiAoIG5vRXJyb3IgPT09IHZvaWQgMCApIG5vRXJyb3IgPSBmYWxzZTtcblxuICBpZiAodGhpcy5yZWdleHBfZWF0UXVhbnRpZmllclByZWZpeChzdGF0ZSwgbm9FcnJvcikpIHtcbiAgICBzdGF0ZS5lYXQoMHgzRiAvKiA/ICovKTtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHJldHVybiBmYWxzZVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtUXVhbnRpZmllclByZWZpeFxucHAkMS5yZWdleHBfZWF0UXVhbnRpZmllclByZWZpeCA9IGZ1bmN0aW9uKHN0YXRlLCBub0Vycm9yKSB7XG4gIHJldHVybiAoXG4gICAgc3RhdGUuZWF0KDB4MkEgLyogKiAqLykgfHxcbiAgICBzdGF0ZS5lYXQoMHgyQiAvKiArICovKSB8fFxuICAgIHN0YXRlLmVhdCgweDNGIC8qID8gKi8pIHx8XG4gICAgdGhpcy5yZWdleHBfZWF0QnJhY2VkUXVhbnRpZmllcihzdGF0ZSwgbm9FcnJvcilcbiAgKVxufTtcbnBwJDEucmVnZXhwX2VhdEJyYWNlZFF1YW50aWZpZXIgPSBmdW5jdGlvbihzdGF0ZSwgbm9FcnJvcikge1xuICB2YXIgc3RhcnQgPSBzdGF0ZS5wb3M7XG4gIGlmIChzdGF0ZS5lYXQoMHg3QiAvKiB7ICovKSkge1xuICAgIHZhciBtaW4gPSAwLCBtYXggPSAtMTtcbiAgICBpZiAodGhpcy5yZWdleHBfZWF0RGVjaW1hbERpZ2l0cyhzdGF0ZSkpIHtcbiAgICAgIG1pbiA9IHN0YXRlLmxhc3RJbnRWYWx1ZTtcbiAgICAgIGlmIChzdGF0ZS5lYXQoMHgyQyAvKiAsICovKSAmJiB0aGlzLnJlZ2V4cF9lYXREZWNpbWFsRGlnaXRzKHN0YXRlKSkge1xuICAgICAgICBtYXggPSBzdGF0ZS5sYXN0SW50VmFsdWU7XG4gICAgICB9XG4gICAgICBpZiAoc3RhdGUuZWF0KDB4N0QgLyogfSAqLykpIHtcbiAgICAgICAgLy8gU3ludGF4RXJyb3IgaW4gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3NlYy10ZXJtXG4gICAgICAgIGlmIChtYXggIT09IC0xICYmIG1heCA8IG1pbiAmJiAhbm9FcnJvcikge1xuICAgICAgICAgIHN0YXRlLnJhaXNlKFwibnVtYmVycyBvdXQgb2Ygb3JkZXIgaW4ge30gcXVhbnRpZmllclwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc3RhdGUuc3dpdGNoVSAmJiAhbm9FcnJvcikge1xuICAgICAgc3RhdGUucmFpc2UoXCJJbmNvbXBsZXRlIHF1YW50aWZpZXJcIik7XG4gICAgfVxuICAgIHN0YXRlLnBvcyA9IHN0YXJ0O1xuICB9XG4gIHJldHVybiBmYWxzZVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtQXRvbVxucHAkMS5yZWdleHBfZWF0QXRvbSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHJldHVybiAoXG4gICAgdGhpcy5yZWdleHBfZWF0UGF0dGVybkNoYXJhY3RlcnMoc3RhdGUpIHx8XG4gICAgc3RhdGUuZWF0KDB4MkUgLyogLiAqLykgfHxcbiAgICB0aGlzLnJlZ2V4cF9lYXRSZXZlcnNlU29saWR1c0F0b21Fc2NhcGUoc3RhdGUpIHx8XG4gICAgdGhpcy5yZWdleHBfZWF0Q2hhcmFjdGVyQ2xhc3Moc3RhdGUpIHx8XG4gICAgdGhpcy5yZWdleHBfZWF0VW5jYXB0dXJpbmdHcm91cChzdGF0ZSkgfHxcbiAgICB0aGlzLnJlZ2V4cF9lYXRDYXB0dXJpbmdHcm91cChzdGF0ZSlcbiAgKVxufTtcbnBwJDEucmVnZXhwX2VhdFJldmVyc2VTb2xpZHVzQXRvbUVzY2FwZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcbiAgaWYgKHN0YXRlLmVhdCgweDVDIC8qIFxcICovKSkge1xuICAgIGlmICh0aGlzLnJlZ2V4cF9lYXRBdG9tRXNjYXBlKHN0YXRlKSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgc3RhdGUucG9zID0gc3RhcnQ7XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xucHAkMS5yZWdleHBfZWF0VW5jYXB0dXJpbmdHcm91cCA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcbiAgaWYgKHN0YXRlLmVhdCgweDI4IC8qICggKi8pKSB7XG4gICAgaWYgKHN0YXRlLmVhdCgweDNGIC8qID8gKi8pKSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDE2KSB7XG4gICAgICAgIHZhciBhZGRNb2RpZmllcnMgPSB0aGlzLnJlZ2V4cF9lYXRNb2RpZmllcnMoc3RhdGUpO1xuICAgICAgICB2YXIgaGFzSHlwaGVuID0gc3RhdGUuZWF0KDB4MkQgLyogLSAqLyk7XG4gICAgICAgIGlmIChhZGRNb2RpZmllcnMgfHwgaGFzSHlwaGVuKSB7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhZGRNb2RpZmllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBtb2RpZmllciA9IGFkZE1vZGlmaWVycy5jaGFyQXQoaSk7XG4gICAgICAgICAgICBpZiAoYWRkTW9kaWZpZXJzLmluZGV4T2YobW9kaWZpZXIsIGkgKyAxKSA+IC0xKSB7XG4gICAgICAgICAgICAgIHN0YXRlLnJhaXNlKFwiRHVwbGljYXRlIHJlZ3VsYXIgZXhwcmVzc2lvbiBtb2RpZmllcnNcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChoYXNIeXBoZW4pIHtcbiAgICAgICAgICAgIHZhciByZW1vdmVNb2RpZmllcnMgPSB0aGlzLnJlZ2V4cF9lYXRNb2RpZmllcnMoc3RhdGUpO1xuICAgICAgICAgICAgaWYgKCFhZGRNb2RpZmllcnMgJiYgIXJlbW92ZU1vZGlmaWVycyAmJiBzdGF0ZS5jdXJyZW50KCkgPT09IDB4M0EgLyogOiAqLykge1xuICAgICAgICAgICAgICBzdGF0ZS5yYWlzZShcIkludmFsaWQgcmVndWxhciBleHByZXNzaW9uIG1vZGlmaWVyc1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAodmFyIGkkMSA9IDA7IGkkMSA8IHJlbW92ZU1vZGlmaWVycy5sZW5ndGg7IGkkMSsrKSB7XG4gICAgICAgICAgICAgIHZhciBtb2RpZmllciQxID0gcmVtb3ZlTW9kaWZpZXJzLmNoYXJBdChpJDEpO1xuICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgcmVtb3ZlTW9kaWZpZXJzLmluZGV4T2YobW9kaWZpZXIkMSwgaSQxICsgMSkgPiAtMSB8fFxuICAgICAgICAgICAgICAgIGFkZE1vZGlmaWVycy5pbmRleE9mKG1vZGlmaWVyJDEpID4gLTFcbiAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUucmFpc2UoXCJEdXBsaWNhdGUgcmVndWxhciBleHByZXNzaW9uIG1vZGlmaWVyc1wiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHN0YXRlLmVhdCgweDNBIC8qIDogKi8pKSB7XG4gICAgICAgIHRoaXMucmVnZXhwX2Rpc2p1bmN0aW9uKHN0YXRlKTtcbiAgICAgICAgaWYgKHN0YXRlLmVhdCgweDI5IC8qICkgKi8pKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgICBzdGF0ZS5yYWlzZShcIlVudGVybWluYXRlZCBncm91cFwiKTtcbiAgICAgIH1cbiAgICB9XG4gICAgc3RhdGUucG9zID0gc3RhcnQ7XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xucHAkMS5yZWdleHBfZWF0Q2FwdHVyaW5nR3JvdXAgPSBmdW5jdGlvbihzdGF0ZSkge1xuICBpZiAoc3RhdGUuZWF0KDB4MjggLyogKCAqLykpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDkpIHtcbiAgICAgIHRoaXMucmVnZXhwX2dyb3VwU3BlY2lmaWVyKHN0YXRlKTtcbiAgICB9IGVsc2UgaWYgKHN0YXRlLmN1cnJlbnQoKSA9PT0gMHgzRiAvKiA/ICovKSB7XG4gICAgICBzdGF0ZS5yYWlzZShcIkludmFsaWQgZ3JvdXBcIik7XG4gICAgfVxuICAgIHRoaXMucmVnZXhwX2Rpc2p1bmN0aW9uKHN0YXRlKTtcbiAgICBpZiAoc3RhdGUuZWF0KDB4MjkgLyogKSAqLykpIHtcbiAgICAgIHN0YXRlLm51bUNhcHR1cmluZ1BhcmVucyArPSAxO1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgc3RhdGUucmFpc2UoXCJVbnRlcm1pbmF0ZWQgZ3JvdXBcIik7XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuLy8gUmVndWxhckV4cHJlc3Npb25Nb2RpZmllcnMgOjpcbi8vICAgW2VtcHR5XVxuLy8gICBSZWd1bGFyRXhwcmVzc2lvbk1vZGlmaWVycyBSZWd1bGFyRXhwcmVzc2lvbk1vZGlmaWVyXG5wcCQxLnJlZ2V4cF9lYXRNb2RpZmllcnMgPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgbW9kaWZpZXJzID0gXCJcIjtcbiAgdmFyIGNoID0gMDtcbiAgd2hpbGUgKChjaCA9IHN0YXRlLmN1cnJlbnQoKSkgIT09IC0xICYmIGlzUmVndWxhckV4cHJlc3Npb25Nb2RpZmllcihjaCkpIHtcbiAgICBtb2RpZmllcnMgKz0gY29kZVBvaW50VG9TdHJpbmcoY2gpO1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgfVxuICByZXR1cm4gbW9kaWZpZXJzXG59O1xuLy8gUmVndWxhckV4cHJlc3Npb25Nb2RpZmllciA6OiBvbmUgb2Zcbi8vICAgYGlgIGBtYCBgc2BcbmZ1bmN0aW9uIGlzUmVndWxhckV4cHJlc3Npb25Nb2RpZmllcihjaCkge1xuICByZXR1cm4gY2ggPT09IDB4NjkgLyogaSAqLyB8fCBjaCA9PT0gMHg2ZCAvKiBtICovIHx8IGNoID09PSAweDczIC8qIHMgKi9cbn1cblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtYW5uZXhCLUV4dGVuZGVkQXRvbVxucHAkMS5yZWdleHBfZWF0RXh0ZW5kZWRBdG9tID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgcmV0dXJuIChcbiAgICBzdGF0ZS5lYXQoMHgyRSAvKiAuICovKSB8fFxuICAgIHRoaXMucmVnZXhwX2VhdFJldmVyc2VTb2xpZHVzQXRvbUVzY2FwZShzdGF0ZSkgfHxcbiAgICB0aGlzLnJlZ2V4cF9lYXRDaGFyYWN0ZXJDbGFzcyhzdGF0ZSkgfHxcbiAgICB0aGlzLnJlZ2V4cF9lYXRVbmNhcHR1cmluZ0dyb3VwKHN0YXRlKSB8fFxuICAgIHRoaXMucmVnZXhwX2VhdENhcHR1cmluZ0dyb3VwKHN0YXRlKSB8fFxuICAgIHRoaXMucmVnZXhwX2VhdEludmFsaWRCcmFjZWRRdWFudGlmaWVyKHN0YXRlKSB8fFxuICAgIHRoaXMucmVnZXhwX2VhdEV4dGVuZGVkUGF0dGVybkNoYXJhY3RlcihzdGF0ZSlcbiAgKVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtYW5uZXhCLUludmFsaWRCcmFjZWRRdWFudGlmaWVyXG5wcCQxLnJlZ2V4cF9lYXRJbnZhbGlkQnJhY2VkUXVhbnRpZmllciA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIGlmICh0aGlzLnJlZ2V4cF9lYXRCcmFjZWRRdWFudGlmaWVyKHN0YXRlLCB0cnVlKSkge1xuICAgIHN0YXRlLnJhaXNlKFwiTm90aGluZyB0byByZXBlYXRcIik7XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1TeW50YXhDaGFyYWN0ZXJcbnBwJDEucmVnZXhwX2VhdFN5bnRheENoYXJhY3RlciA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBjaCA9IHN0YXRlLmN1cnJlbnQoKTtcbiAgaWYgKGlzU3ludGF4Q2hhcmFjdGVyKGNoKSkge1xuICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IGNoO1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHJldHVybiBmYWxzZVxufTtcbmZ1bmN0aW9uIGlzU3ludGF4Q2hhcmFjdGVyKGNoKSB7XG4gIHJldHVybiAoXG4gICAgY2ggPT09IDB4MjQgLyogJCAqLyB8fFxuICAgIGNoID49IDB4MjggLyogKCAqLyAmJiBjaCA8PSAweDJCIC8qICsgKi8gfHxcbiAgICBjaCA9PT0gMHgyRSAvKiAuICovIHx8XG4gICAgY2ggPT09IDB4M0YgLyogPyAqLyB8fFxuICAgIGNoID49IDB4NUIgLyogWyAqLyAmJiBjaCA8PSAweDVFIC8qIF4gKi8gfHxcbiAgICBjaCA+PSAweDdCIC8qIHsgKi8gJiYgY2ggPD0gMHg3RCAvKiB9ICovXG4gIClcbn1cblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtUGF0dGVybkNoYXJhY3RlclxuLy8gQnV0IGVhdCBlYWdlci5cbnBwJDEucmVnZXhwX2VhdFBhdHRlcm5DaGFyYWN0ZXJzID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIHN0YXJ0ID0gc3RhdGUucG9zO1xuICB2YXIgY2ggPSAwO1xuICB3aGlsZSAoKGNoID0gc3RhdGUuY3VycmVudCgpKSAhPT0gLTEgJiYgIWlzU3ludGF4Q2hhcmFjdGVyKGNoKSkge1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgfVxuICByZXR1cm4gc3RhdGUucG9zICE9PSBzdGFydFxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtYW5uZXhCLUV4dGVuZGVkUGF0dGVybkNoYXJhY3RlclxucHAkMS5yZWdleHBfZWF0RXh0ZW5kZWRQYXR0ZXJuQ2hhcmFjdGVyID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIGNoID0gc3RhdGUuY3VycmVudCgpO1xuICBpZiAoXG4gICAgY2ggIT09IC0xICYmXG4gICAgY2ggIT09IDB4MjQgLyogJCAqLyAmJlxuICAgICEoY2ggPj0gMHgyOCAvKiAoICovICYmIGNoIDw9IDB4MkIgLyogKyAqLykgJiZcbiAgICBjaCAhPT0gMHgyRSAvKiAuICovICYmXG4gICAgY2ggIT09IDB4M0YgLyogPyAqLyAmJlxuICAgIGNoICE9PSAweDVCIC8qIFsgKi8gJiZcbiAgICBjaCAhPT0gMHg1RSAvKiBeICovICYmXG4gICAgY2ggIT09IDB4N0MgLyogfCAqL1xuICApIHtcbiAgICBzdGF0ZS5hZHZhbmNlKCk7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn07XG5cbi8vIEdyb3VwU3BlY2lmaWVyIDo6XG4vLyAgIFtlbXB0eV1cbi8vICAgYD9gIEdyb3VwTmFtZVxucHAkMS5yZWdleHBfZ3JvdXBTcGVjaWZpZXIgPSBmdW5jdGlvbihzdGF0ZSkge1xuICBpZiAoc3RhdGUuZWF0KDB4M0YgLyogPyAqLykpIHtcbiAgICBpZiAoIXRoaXMucmVnZXhwX2VhdEdyb3VwTmFtZShzdGF0ZSkpIHsgc3RhdGUucmFpc2UoXCJJbnZhbGlkIGdyb3VwXCIpOyB9XG4gICAgdmFyIHRyYWNrRGlzanVuY3Rpb24gPSB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTY7XG4gICAgdmFyIGtub3duID0gc3RhdGUuZ3JvdXBOYW1lc1tzdGF0ZS5sYXN0U3RyaW5nVmFsdWVdO1xuICAgIGlmIChrbm93bikge1xuICAgICAgaWYgKHRyYWNrRGlzanVuY3Rpb24pIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxpc3QgPSBrbm93bjsgaSA8IGxpc3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICB2YXIgYWx0SUQgPSBsaXN0W2ldO1xuXG4gICAgICAgICAgaWYgKCFhbHRJRC5zZXBhcmF0ZWRGcm9tKHN0YXRlLmJyYW5jaElEKSlcbiAgICAgICAgICAgIHsgc3RhdGUucmFpc2UoXCJEdXBsaWNhdGUgY2FwdHVyZSBncm91cCBuYW1lXCIpOyB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXRlLnJhaXNlKFwiRHVwbGljYXRlIGNhcHR1cmUgZ3JvdXAgbmFtZVwiKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRyYWNrRGlzanVuY3Rpb24pIHtcbiAgICAgIChrbm93biB8fCAoc3RhdGUuZ3JvdXBOYW1lc1tzdGF0ZS5sYXN0U3RyaW5nVmFsdWVdID0gW10pKS5wdXNoKHN0YXRlLmJyYW5jaElEKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RhdGUuZ3JvdXBOYW1lc1tzdGF0ZS5sYXN0U3RyaW5nVmFsdWVdID0gdHJ1ZTtcbiAgICB9XG4gIH1cbn07XG5cbi8vIEdyb3VwTmFtZSA6OlxuLy8gICBgPGAgUmVnRXhwSWRlbnRpZmllck5hbWUgYD5gXG4vLyBOb3RlOiB0aGlzIHVwZGF0ZXMgYHN0YXRlLmxhc3RTdHJpbmdWYWx1ZWAgcHJvcGVydHkgd2l0aCB0aGUgZWF0ZW4gbmFtZS5cbnBwJDEucmVnZXhwX2VhdEdyb3VwTmFtZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHN0YXRlLmxhc3RTdHJpbmdWYWx1ZSA9IFwiXCI7XG4gIGlmIChzdGF0ZS5lYXQoMHgzQyAvKiA8ICovKSkge1xuICAgIGlmICh0aGlzLnJlZ2V4cF9lYXRSZWdFeHBJZGVudGlmaWVyTmFtZShzdGF0ZSkgJiYgc3RhdGUuZWF0KDB4M0UgLyogPiAqLykpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICAgIHN0YXRlLnJhaXNlKFwiSW52YWxpZCBjYXB0dXJlIGdyb3VwIG5hbWVcIik7XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG4vLyBSZWdFeHBJZGVudGlmaWVyTmFtZSA6OlxuLy8gICBSZWdFeHBJZGVudGlmaWVyU3RhcnRcbi8vICAgUmVnRXhwSWRlbnRpZmllck5hbWUgUmVnRXhwSWRlbnRpZmllclBhcnRcbi8vIE5vdGU6IHRoaXMgdXBkYXRlcyBgc3RhdGUubGFzdFN0cmluZ1ZhbHVlYCBwcm9wZXJ0eSB3aXRoIHRoZSBlYXRlbiBuYW1lLlxucHAkMS5yZWdleHBfZWF0UmVnRXhwSWRlbnRpZmllck5hbWUgPSBmdW5jdGlvbihzdGF0ZSkge1xuICBzdGF0ZS5sYXN0U3RyaW5nVmFsdWUgPSBcIlwiO1xuICBpZiAodGhpcy5yZWdleHBfZWF0UmVnRXhwSWRlbnRpZmllclN0YXJ0KHN0YXRlKSkge1xuICAgIHN0YXRlLmxhc3RTdHJpbmdWYWx1ZSArPSBjb2RlUG9pbnRUb1N0cmluZyhzdGF0ZS5sYXN0SW50VmFsdWUpO1xuICAgIHdoaWxlICh0aGlzLnJlZ2V4cF9lYXRSZWdFeHBJZGVudGlmaWVyUGFydChzdGF0ZSkpIHtcbiAgICAgIHN0YXRlLmxhc3RTdHJpbmdWYWx1ZSArPSBjb2RlUG9pbnRUb1N0cmluZyhzdGF0ZS5sYXN0SW50VmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHJldHVybiBmYWxzZVxufTtcblxuLy8gUmVnRXhwSWRlbnRpZmllclN0YXJ0IDo6XG4vLyAgIFVuaWNvZGVJRFN0YXJ0XG4vLyAgIGAkYFxuLy8gICBgX2Bcbi8vICAgYFxcYCBSZWdFeHBVbmljb2RlRXNjYXBlU2VxdWVuY2VbK1VdXG5wcCQxLnJlZ2V4cF9lYXRSZWdFeHBJZGVudGlmaWVyU3RhcnQgPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgc3RhcnQgPSBzdGF0ZS5wb3M7XG4gIHZhciBmb3JjZVUgPSB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTE7XG4gIHZhciBjaCA9IHN0YXRlLmN1cnJlbnQoZm9yY2VVKTtcbiAgc3RhdGUuYWR2YW5jZShmb3JjZVUpO1xuXG4gIGlmIChjaCA9PT0gMHg1QyAvKiBcXCAqLyAmJiB0aGlzLnJlZ2V4cF9lYXRSZWdFeHBVbmljb2RlRXNjYXBlU2VxdWVuY2Uoc3RhdGUsIGZvcmNlVSkpIHtcbiAgICBjaCA9IHN0YXRlLmxhc3RJbnRWYWx1ZTtcbiAgfVxuICBpZiAoaXNSZWdFeHBJZGVudGlmaWVyU3RhcnQoY2gpKSB7XG4gICAgc3RhdGUubGFzdEludFZhbHVlID0gY2g7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIHN0YXRlLnBvcyA9IHN0YXJ0O1xuICByZXR1cm4gZmFsc2Vcbn07XG5mdW5jdGlvbiBpc1JlZ0V4cElkZW50aWZpZXJTdGFydChjaCkge1xuICByZXR1cm4gaXNJZGVudGlmaWVyU3RhcnQoY2gsIHRydWUpIHx8IGNoID09PSAweDI0IC8qICQgKi8gfHwgY2ggPT09IDB4NUYgLyogXyAqL1xufVxuXG4vLyBSZWdFeHBJZGVudGlmaWVyUGFydCA6OlxuLy8gICBVbmljb2RlSURDb250aW51ZVxuLy8gICBgJGBcbi8vICAgYF9gXG4vLyAgIGBcXGAgUmVnRXhwVW5pY29kZUVzY2FwZVNlcXVlbmNlWytVXVxuLy8gICA8WldOSj5cbi8vICAgPFpXSj5cbnBwJDEucmVnZXhwX2VhdFJlZ0V4cElkZW50aWZpZXJQYXJ0ID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIHN0YXJ0ID0gc3RhdGUucG9zO1xuICB2YXIgZm9yY2VVID0gdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDExO1xuICB2YXIgY2ggPSBzdGF0ZS5jdXJyZW50KGZvcmNlVSk7XG4gIHN0YXRlLmFkdmFuY2UoZm9yY2VVKTtcblxuICBpZiAoY2ggPT09IDB4NUMgLyogXFwgKi8gJiYgdGhpcy5yZWdleHBfZWF0UmVnRXhwVW5pY29kZUVzY2FwZVNlcXVlbmNlKHN0YXRlLCBmb3JjZVUpKSB7XG4gICAgY2ggPSBzdGF0ZS5sYXN0SW50VmFsdWU7XG4gIH1cbiAgaWYgKGlzUmVnRXhwSWRlbnRpZmllclBhcnQoY2gpKSB7XG4gICAgc3RhdGUubGFzdEludFZhbHVlID0gY2g7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIHN0YXRlLnBvcyA9IHN0YXJ0O1xuICByZXR1cm4gZmFsc2Vcbn07XG5mdW5jdGlvbiBpc1JlZ0V4cElkZW50aWZpZXJQYXJ0KGNoKSB7XG4gIHJldHVybiBpc0lkZW50aWZpZXJDaGFyKGNoLCB0cnVlKSB8fCBjaCA9PT0gMHgyNCAvKiAkICovIHx8IGNoID09PSAweDVGIC8qIF8gKi8gfHwgY2ggPT09IDB4MjAwQyAvKiA8WldOSj4gKi8gfHwgY2ggPT09IDB4MjAwRCAvKiA8WldKPiAqL1xufVxuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1hbm5leEItQXRvbUVzY2FwZVxucHAkMS5yZWdleHBfZWF0QXRvbUVzY2FwZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIGlmIChcbiAgICB0aGlzLnJlZ2V4cF9lYXRCYWNrUmVmZXJlbmNlKHN0YXRlKSB8fFxuICAgIHRoaXMucmVnZXhwX2VhdENoYXJhY3RlckNsYXNzRXNjYXBlKHN0YXRlKSB8fFxuICAgIHRoaXMucmVnZXhwX2VhdENoYXJhY3RlckVzY2FwZShzdGF0ZSkgfHxcbiAgICAoc3RhdGUuc3dpdGNoTiAmJiB0aGlzLnJlZ2V4cF9lYXRLR3JvdXBOYW1lKHN0YXRlKSlcbiAgKSB7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICBpZiAoc3RhdGUuc3dpdGNoVSkge1xuICAgIC8vIE1ha2UgdGhlIHNhbWUgbWVzc2FnZSBhcyBWOC5cbiAgICBpZiAoc3RhdGUuY3VycmVudCgpID09PSAweDYzIC8qIGMgKi8pIHtcbiAgICAgIHN0YXRlLnJhaXNlKFwiSW52YWxpZCB1bmljb2RlIGVzY2FwZVwiKTtcbiAgICB9XG4gICAgc3RhdGUucmFpc2UoXCJJbnZhbGlkIGVzY2FwZVwiKTtcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn07XG5wcCQxLnJlZ2V4cF9lYXRCYWNrUmVmZXJlbmNlID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIHN0YXJ0ID0gc3RhdGUucG9zO1xuICBpZiAodGhpcy5yZWdleHBfZWF0RGVjaW1hbEVzY2FwZShzdGF0ZSkpIHtcbiAgICB2YXIgbiA9IHN0YXRlLmxhc3RJbnRWYWx1ZTtcbiAgICBpZiAoc3RhdGUuc3dpdGNoVSkge1xuICAgICAgLy8gRm9yIFN5bnRheEVycm9yIGluIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNzZWMtYXRvbWVzY2FwZVxuICAgICAgaWYgKG4gPiBzdGF0ZS5tYXhCYWNrUmVmZXJlbmNlKSB7XG4gICAgICAgIHN0YXRlLm1heEJhY2tSZWZlcmVuY2UgPSBuO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgaWYgKG4gPD0gc3RhdGUubnVtQ2FwdHVyaW5nUGFyZW5zKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICBzdGF0ZS5wb3MgPSBzdGFydDtcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn07XG5wcCQxLnJlZ2V4cF9lYXRLR3JvdXBOYW1lID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgaWYgKHN0YXRlLmVhdCgweDZCIC8qIGsgKi8pKSB7XG4gICAgaWYgKHRoaXMucmVnZXhwX2VhdEdyb3VwTmFtZShzdGF0ZSkpIHtcbiAgICAgIHN0YXRlLmJhY2tSZWZlcmVuY2VOYW1lcy5wdXNoKHN0YXRlLmxhc3RTdHJpbmdWYWx1ZSk7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICBzdGF0ZS5yYWlzZShcIkludmFsaWQgbmFtZWQgcmVmZXJlbmNlXCIpO1xuICB9XG4gIHJldHVybiBmYWxzZVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtYW5uZXhCLUNoYXJhY3RlckVzY2FwZVxucHAkMS5yZWdleHBfZWF0Q2hhcmFjdGVyRXNjYXBlID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgcmV0dXJuIChcbiAgICB0aGlzLnJlZ2V4cF9lYXRDb250cm9sRXNjYXBlKHN0YXRlKSB8fFxuICAgIHRoaXMucmVnZXhwX2VhdENDb250cm9sTGV0dGVyKHN0YXRlKSB8fFxuICAgIHRoaXMucmVnZXhwX2VhdFplcm8oc3RhdGUpIHx8XG4gICAgdGhpcy5yZWdleHBfZWF0SGV4RXNjYXBlU2VxdWVuY2Uoc3RhdGUpIHx8XG4gICAgdGhpcy5yZWdleHBfZWF0UmVnRXhwVW5pY29kZUVzY2FwZVNlcXVlbmNlKHN0YXRlLCBmYWxzZSkgfHxcbiAgICAoIXN0YXRlLnN3aXRjaFUgJiYgdGhpcy5yZWdleHBfZWF0TGVnYWN5T2N0YWxFc2NhcGVTZXF1ZW5jZShzdGF0ZSkpIHx8XG4gICAgdGhpcy5yZWdleHBfZWF0SWRlbnRpdHlFc2NhcGUoc3RhdGUpXG4gIClcbn07XG5wcCQxLnJlZ2V4cF9lYXRDQ29udHJvbExldHRlciA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcbiAgaWYgKHN0YXRlLmVhdCgweDYzIC8qIGMgKi8pKSB7XG4gICAgaWYgKHRoaXMucmVnZXhwX2VhdENvbnRyb2xMZXR0ZXIoc3RhdGUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICBzdGF0ZS5wb3MgPSBzdGFydDtcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn07XG5wcCQxLnJlZ2V4cF9lYXRaZXJvID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgaWYgKHN0YXRlLmN1cnJlbnQoKSA9PT0gMHgzMCAvKiAwICovICYmICFpc0RlY2ltYWxEaWdpdChzdGF0ZS5sb29rYWhlYWQoKSkpIHtcbiAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSAwO1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHJldHVybiBmYWxzZVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtQ29udHJvbEVzY2FwZVxucHAkMS5yZWdleHBfZWF0Q29udHJvbEVzY2FwZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBjaCA9IHN0YXRlLmN1cnJlbnQoKTtcbiAgaWYgKGNoID09PSAweDc0IC8qIHQgKi8pIHtcbiAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSAweDA5OyAvKiBcXHQgKi9cbiAgICBzdGF0ZS5hZHZhbmNlKCk7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICBpZiAoY2ggPT09IDB4NkUgLyogbiAqLykge1xuICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IDB4MEE7IC8qIFxcbiAqL1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIGlmIChjaCA9PT0gMHg3NiAvKiB2ICovKSB7XG4gICAgc3RhdGUubGFzdEludFZhbHVlID0gMHgwQjsgLyogXFx2ICovXG4gICAgc3RhdGUuYWR2YW5jZSgpO1xuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgaWYgKGNoID09PSAweDY2IC8qIGYgKi8pIHtcbiAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSAweDBDOyAvKiBcXGYgKi9cbiAgICBzdGF0ZS5hZHZhbmNlKCk7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICBpZiAoY2ggPT09IDB4NzIgLyogciAqLykge1xuICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IDB4MEQ7IC8qIFxcciAqL1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHJldHVybiBmYWxzZVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtQ29udHJvbExldHRlclxucHAkMS5yZWdleHBfZWF0Q29udHJvbExldHRlciA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBjaCA9IHN0YXRlLmN1cnJlbnQoKTtcbiAgaWYgKGlzQ29udHJvbExldHRlcihjaCkpIHtcbiAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSBjaCAlIDB4MjA7XG4gICAgc3RhdGUuYWR2YW5jZSgpO1xuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuZnVuY3Rpb24gaXNDb250cm9sTGV0dGVyKGNoKSB7XG4gIHJldHVybiAoXG4gICAgKGNoID49IDB4NDEgLyogQSAqLyAmJiBjaCA8PSAweDVBIC8qIFogKi8pIHx8XG4gICAgKGNoID49IDB4NjEgLyogYSAqLyAmJiBjaCA8PSAweDdBIC8qIHogKi8pXG4gIClcbn1cblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtUmVnRXhwVW5pY29kZUVzY2FwZVNlcXVlbmNlXG5wcCQxLnJlZ2V4cF9lYXRSZWdFeHBVbmljb2RlRXNjYXBlU2VxdWVuY2UgPSBmdW5jdGlvbihzdGF0ZSwgZm9yY2VVKSB7XG4gIGlmICggZm9yY2VVID09PSB2b2lkIDAgKSBmb3JjZVUgPSBmYWxzZTtcblxuICB2YXIgc3RhcnQgPSBzdGF0ZS5wb3M7XG4gIHZhciBzd2l0Y2hVID0gZm9yY2VVIHx8IHN0YXRlLnN3aXRjaFU7XG5cbiAgaWYgKHN0YXRlLmVhdCgweDc1IC8qIHUgKi8pKSB7XG4gICAgaWYgKHRoaXMucmVnZXhwX2VhdEZpeGVkSGV4RGlnaXRzKHN0YXRlLCA0KSkge1xuICAgICAgdmFyIGxlYWQgPSBzdGF0ZS5sYXN0SW50VmFsdWU7XG4gICAgICBpZiAoc3dpdGNoVSAmJiBsZWFkID49IDB4RDgwMCAmJiBsZWFkIDw9IDB4REJGRikge1xuICAgICAgICB2YXIgbGVhZFN1cnJvZ2F0ZUVuZCA9IHN0YXRlLnBvcztcbiAgICAgICAgaWYgKHN0YXRlLmVhdCgweDVDIC8qIFxcICovKSAmJiBzdGF0ZS5lYXQoMHg3NSAvKiB1ICovKSAmJiB0aGlzLnJlZ2V4cF9lYXRGaXhlZEhleERpZ2l0cyhzdGF0ZSwgNCkpIHtcbiAgICAgICAgICB2YXIgdHJhaWwgPSBzdGF0ZS5sYXN0SW50VmFsdWU7XG4gICAgICAgICAgaWYgKHRyYWlsID49IDB4REMwMCAmJiB0cmFpbCA8PSAweERGRkYpIHtcbiAgICAgICAgICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IChsZWFkIC0gMHhEODAwKSAqIDB4NDAwICsgKHRyYWlsIC0gMHhEQzAwKSArIDB4MTAwMDA7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzdGF0ZS5wb3MgPSBsZWFkU3Vycm9nYXRlRW5kO1xuICAgICAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSBsZWFkO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgaWYgKFxuICAgICAgc3dpdGNoVSAmJlxuICAgICAgc3RhdGUuZWF0KDB4N0IgLyogeyAqLykgJiZcbiAgICAgIHRoaXMucmVnZXhwX2VhdEhleERpZ2l0cyhzdGF0ZSkgJiZcbiAgICAgIHN0YXRlLmVhdCgweDdEIC8qIH0gKi8pICYmXG4gICAgICBpc1ZhbGlkVW5pY29kZShzdGF0ZS5sYXN0SW50VmFsdWUpXG4gICAgKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICBpZiAoc3dpdGNoVSkge1xuICAgICAgc3RhdGUucmFpc2UoXCJJbnZhbGlkIHVuaWNvZGUgZXNjYXBlXCIpO1xuICAgIH1cbiAgICBzdGF0ZS5wb3MgPSBzdGFydDtcbiAgfVxuXG4gIHJldHVybiBmYWxzZVxufTtcbmZ1bmN0aW9uIGlzVmFsaWRVbmljb2RlKGNoKSB7XG4gIHJldHVybiBjaCA+PSAwICYmIGNoIDw9IDB4MTBGRkZGXG59XG5cbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLWFubmV4Qi1JZGVudGl0eUVzY2FwZVxucHAkMS5yZWdleHBfZWF0SWRlbnRpdHlFc2NhcGUgPSBmdW5jdGlvbihzdGF0ZSkge1xuICBpZiAoc3RhdGUuc3dpdGNoVSkge1xuICAgIGlmICh0aGlzLnJlZ2V4cF9lYXRTeW50YXhDaGFyYWN0ZXIoc3RhdGUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICBpZiAoc3RhdGUuZWF0KDB4MkYgLyogLyAqLykpIHtcbiAgICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IDB4MkY7IC8qIC8gKi9cbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgdmFyIGNoID0gc3RhdGUuY3VycmVudCgpO1xuICBpZiAoY2ggIT09IDB4NjMgLyogYyAqLyAmJiAoIXN0YXRlLnN3aXRjaE4gfHwgY2ggIT09IDB4NkIgLyogayAqLykpIHtcbiAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSBjaDtcbiAgICBzdGF0ZS5hZHZhbmNlKCk7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIHJldHVybiBmYWxzZVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtRGVjaW1hbEVzY2FwZVxucHAkMS5yZWdleHBfZWF0RGVjaW1hbEVzY2FwZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IDA7XG4gIHZhciBjaCA9IHN0YXRlLmN1cnJlbnQoKTtcbiAgaWYgKGNoID49IDB4MzEgLyogMSAqLyAmJiBjaCA8PSAweDM5IC8qIDkgKi8pIHtcbiAgICBkbyB7XG4gICAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSAxMCAqIHN0YXRlLmxhc3RJbnRWYWx1ZSArIChjaCAtIDB4MzAgLyogMCAqLyk7XG4gICAgICBzdGF0ZS5hZHZhbmNlKCk7XG4gICAgfSB3aGlsZSAoKGNoID0gc3RhdGUuY3VycmVudCgpKSA+PSAweDMwIC8qIDAgKi8gJiYgY2ggPD0gMHgzOSAvKiA5ICovKVxuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG4vLyBSZXR1cm4gdmFsdWVzIHVzZWQgYnkgY2hhcmFjdGVyIHNldCBwYXJzaW5nIG1ldGhvZHMsIG5lZWRlZCB0b1xuLy8gZm9yYmlkIG5lZ2F0aW9uIG9mIHNldHMgdGhhdCBjYW4gbWF0Y2ggc3RyaW5ncy5cbnZhciBDaGFyU2V0Tm9uZSA9IDA7IC8vIE5vdGhpbmcgcGFyc2VkXG52YXIgQ2hhclNldE9rID0gMTsgLy8gQ29uc3RydWN0IHBhcnNlZCwgY2Fubm90IGNvbnRhaW4gc3RyaW5nc1xudmFyIENoYXJTZXRTdHJpbmcgPSAyOyAvLyBDb25zdHJ1Y3QgcGFyc2VkLCBjYW4gY29udGFpbiBzdHJpbmdzXG5cbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLUNoYXJhY3RlckNsYXNzRXNjYXBlXG5wcCQxLnJlZ2V4cF9lYXRDaGFyYWN0ZXJDbGFzc0VzY2FwZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBjaCA9IHN0YXRlLmN1cnJlbnQoKTtcblxuICBpZiAoaXNDaGFyYWN0ZXJDbGFzc0VzY2FwZShjaCkpIHtcbiAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSAtMTtcbiAgICBzdGF0ZS5hZHZhbmNlKCk7XG4gICAgcmV0dXJuIENoYXJTZXRPa1xuICB9XG5cbiAgdmFyIG5lZ2F0ZSA9IGZhbHNlO1xuICBpZiAoXG4gICAgc3RhdGUuc3dpdGNoVSAmJlxuICAgIHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA5ICYmXG4gICAgKChuZWdhdGUgPSBjaCA9PT0gMHg1MCAvKiBQICovKSB8fCBjaCA9PT0gMHg3MCAvKiBwICovKVxuICApIHtcbiAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSAtMTtcbiAgICBzdGF0ZS5hZHZhbmNlKCk7XG4gICAgdmFyIHJlc3VsdDtcbiAgICBpZiAoXG4gICAgICBzdGF0ZS5lYXQoMHg3QiAvKiB7ICovKSAmJlxuICAgICAgKHJlc3VsdCA9IHRoaXMucmVnZXhwX2VhdFVuaWNvZGVQcm9wZXJ0eVZhbHVlRXhwcmVzc2lvbihzdGF0ZSkpICYmXG4gICAgICBzdGF0ZS5lYXQoMHg3RCAvKiB9ICovKVxuICAgICkge1xuICAgICAgaWYgKG5lZ2F0ZSAmJiByZXN1bHQgPT09IENoYXJTZXRTdHJpbmcpIHsgc3RhdGUucmFpc2UoXCJJbnZhbGlkIHByb3BlcnR5IG5hbWVcIik7IH1cbiAgICAgIHJldHVybiByZXN1bHRcbiAgICB9XG4gICAgc3RhdGUucmFpc2UoXCJJbnZhbGlkIHByb3BlcnR5IG5hbWVcIik7XG4gIH1cblxuICByZXR1cm4gQ2hhclNldE5vbmVcbn07XG5cbmZ1bmN0aW9uIGlzQ2hhcmFjdGVyQ2xhc3NFc2NhcGUoY2gpIHtcbiAgcmV0dXJuIChcbiAgICBjaCA9PT0gMHg2NCAvKiBkICovIHx8XG4gICAgY2ggPT09IDB4NDQgLyogRCAqLyB8fFxuICAgIGNoID09PSAweDczIC8qIHMgKi8gfHxcbiAgICBjaCA9PT0gMHg1MyAvKiBTICovIHx8XG4gICAgY2ggPT09IDB4NzcgLyogdyAqLyB8fFxuICAgIGNoID09PSAweDU3IC8qIFcgKi9cbiAgKVxufVxuXG4vLyBVbmljb2RlUHJvcGVydHlWYWx1ZUV4cHJlc3Npb24gOjpcbi8vICAgVW5pY29kZVByb3BlcnR5TmFtZSBgPWAgVW5pY29kZVByb3BlcnR5VmFsdWVcbi8vICAgTG9uZVVuaWNvZGVQcm9wZXJ0eU5hbWVPclZhbHVlXG5wcCQxLnJlZ2V4cF9lYXRVbmljb2RlUHJvcGVydHlWYWx1ZUV4cHJlc3Npb24gPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgc3RhcnQgPSBzdGF0ZS5wb3M7XG5cbiAgLy8gVW5pY29kZVByb3BlcnR5TmFtZSBgPWAgVW5pY29kZVByb3BlcnR5VmFsdWVcbiAgaWYgKHRoaXMucmVnZXhwX2VhdFVuaWNvZGVQcm9wZXJ0eU5hbWUoc3RhdGUpICYmIHN0YXRlLmVhdCgweDNEIC8qID0gKi8pKSB7XG4gICAgdmFyIG5hbWUgPSBzdGF0ZS5sYXN0U3RyaW5nVmFsdWU7XG4gICAgaWYgKHRoaXMucmVnZXhwX2VhdFVuaWNvZGVQcm9wZXJ0eVZhbHVlKHN0YXRlKSkge1xuICAgICAgdmFyIHZhbHVlID0gc3RhdGUubGFzdFN0cmluZ1ZhbHVlO1xuICAgICAgdGhpcy5yZWdleHBfdmFsaWRhdGVVbmljb2RlUHJvcGVydHlOYW1lQW5kVmFsdWUoc3RhdGUsIG5hbWUsIHZhbHVlKTtcbiAgICAgIHJldHVybiBDaGFyU2V0T2tcbiAgICB9XG4gIH1cbiAgc3RhdGUucG9zID0gc3RhcnQ7XG5cbiAgLy8gTG9uZVVuaWNvZGVQcm9wZXJ0eU5hbWVPclZhbHVlXG4gIGlmICh0aGlzLnJlZ2V4cF9lYXRMb25lVW5pY29kZVByb3BlcnR5TmFtZU9yVmFsdWUoc3RhdGUpKSB7XG4gICAgdmFyIG5hbWVPclZhbHVlID0gc3RhdGUubGFzdFN0cmluZ1ZhbHVlO1xuICAgIHJldHVybiB0aGlzLnJlZ2V4cF92YWxpZGF0ZVVuaWNvZGVQcm9wZXJ0eU5hbWVPclZhbHVlKHN0YXRlLCBuYW1lT3JWYWx1ZSlcbiAgfVxuICByZXR1cm4gQ2hhclNldE5vbmVcbn07XG5cbnBwJDEucmVnZXhwX3ZhbGlkYXRlVW5pY29kZVByb3BlcnR5TmFtZUFuZFZhbHVlID0gZnVuY3Rpb24oc3RhdGUsIG5hbWUsIHZhbHVlKSB7XG4gIGlmICghaGFzT3duKHN0YXRlLnVuaWNvZGVQcm9wZXJ0aWVzLm5vbkJpbmFyeSwgbmFtZSkpXG4gICAgeyBzdGF0ZS5yYWlzZShcIkludmFsaWQgcHJvcGVydHkgbmFtZVwiKTsgfVxuICBpZiAoIXN0YXRlLnVuaWNvZGVQcm9wZXJ0aWVzLm5vbkJpbmFyeVtuYW1lXS50ZXN0KHZhbHVlKSlcbiAgICB7IHN0YXRlLnJhaXNlKFwiSW52YWxpZCBwcm9wZXJ0eSB2YWx1ZVwiKTsgfVxufTtcblxucHAkMS5yZWdleHBfdmFsaWRhdGVVbmljb2RlUHJvcGVydHlOYW1lT3JWYWx1ZSA9IGZ1bmN0aW9uKHN0YXRlLCBuYW1lT3JWYWx1ZSkge1xuICBpZiAoc3RhdGUudW5pY29kZVByb3BlcnRpZXMuYmluYXJ5LnRlc3QobmFtZU9yVmFsdWUpKSB7IHJldHVybiBDaGFyU2V0T2sgfVxuICBpZiAoc3RhdGUuc3dpdGNoViAmJiBzdGF0ZS51bmljb2RlUHJvcGVydGllcy5iaW5hcnlPZlN0cmluZ3MudGVzdChuYW1lT3JWYWx1ZSkpIHsgcmV0dXJuIENoYXJTZXRTdHJpbmcgfVxuICBzdGF0ZS5yYWlzZShcIkludmFsaWQgcHJvcGVydHkgbmFtZVwiKTtcbn07XG5cbi8vIFVuaWNvZGVQcm9wZXJ0eU5hbWUgOjpcbi8vICAgVW5pY29kZVByb3BlcnR5TmFtZUNoYXJhY3RlcnNcbnBwJDEucmVnZXhwX2VhdFVuaWNvZGVQcm9wZXJ0eU5hbWUgPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgY2ggPSAwO1xuICBzdGF0ZS5sYXN0U3RyaW5nVmFsdWUgPSBcIlwiO1xuICB3aGlsZSAoaXNVbmljb2RlUHJvcGVydHlOYW1lQ2hhcmFjdGVyKGNoID0gc3RhdGUuY3VycmVudCgpKSkge1xuICAgIHN0YXRlLmxhc3RTdHJpbmdWYWx1ZSArPSBjb2RlUG9pbnRUb1N0cmluZyhjaCk7XG4gICAgc3RhdGUuYWR2YW5jZSgpO1xuICB9XG4gIHJldHVybiBzdGF0ZS5sYXN0U3RyaW5nVmFsdWUgIT09IFwiXCJcbn07XG5cbmZ1bmN0aW9uIGlzVW5pY29kZVByb3BlcnR5TmFtZUNoYXJhY3RlcihjaCkge1xuICByZXR1cm4gaXNDb250cm9sTGV0dGVyKGNoKSB8fCBjaCA9PT0gMHg1RiAvKiBfICovXG59XG5cbi8vIFVuaWNvZGVQcm9wZXJ0eVZhbHVlIDo6XG4vLyAgIFVuaWNvZGVQcm9wZXJ0eVZhbHVlQ2hhcmFjdGVyc1xucHAkMS5yZWdleHBfZWF0VW5pY29kZVByb3BlcnR5VmFsdWUgPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgY2ggPSAwO1xuICBzdGF0ZS5sYXN0U3RyaW5nVmFsdWUgPSBcIlwiO1xuICB3aGlsZSAoaXNVbmljb2RlUHJvcGVydHlWYWx1ZUNoYXJhY3RlcihjaCA9IHN0YXRlLmN1cnJlbnQoKSkpIHtcbiAgICBzdGF0ZS5sYXN0U3RyaW5nVmFsdWUgKz0gY29kZVBvaW50VG9TdHJpbmcoY2gpO1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgfVxuICByZXR1cm4gc3RhdGUubGFzdFN0cmluZ1ZhbHVlICE9PSBcIlwiXG59O1xuZnVuY3Rpb24gaXNVbmljb2RlUHJvcGVydHlWYWx1ZUNoYXJhY3RlcihjaCkge1xuICByZXR1cm4gaXNVbmljb2RlUHJvcGVydHlOYW1lQ2hhcmFjdGVyKGNoKSB8fCBpc0RlY2ltYWxEaWdpdChjaClcbn1cblxuLy8gTG9uZVVuaWNvZGVQcm9wZXJ0eU5hbWVPclZhbHVlIDo6XG4vLyAgIFVuaWNvZGVQcm9wZXJ0eVZhbHVlQ2hhcmFjdGVyc1xucHAkMS5yZWdleHBfZWF0TG9uZVVuaWNvZGVQcm9wZXJ0eU5hbWVPclZhbHVlID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgcmV0dXJuIHRoaXMucmVnZXhwX2VhdFVuaWNvZGVQcm9wZXJ0eVZhbHVlKHN0YXRlKVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtQ2hhcmFjdGVyQ2xhc3NcbnBwJDEucmVnZXhwX2VhdENoYXJhY3RlckNsYXNzID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgaWYgKHN0YXRlLmVhdCgweDVCIC8qIFsgKi8pKSB7XG4gICAgdmFyIG5lZ2F0ZSA9IHN0YXRlLmVhdCgweDVFIC8qIF4gKi8pO1xuICAgIHZhciByZXN1bHQgPSB0aGlzLnJlZ2V4cF9jbGFzc0NvbnRlbnRzKHN0YXRlKTtcbiAgICBpZiAoIXN0YXRlLmVhdCgweDVEIC8qIF0gKi8pKVxuICAgICAgeyBzdGF0ZS5yYWlzZShcIlVudGVybWluYXRlZCBjaGFyYWN0ZXIgY2xhc3NcIik7IH1cbiAgICBpZiAobmVnYXRlICYmIHJlc3VsdCA9PT0gQ2hhclNldFN0cmluZylcbiAgICAgIHsgc3RhdGUucmFpc2UoXCJOZWdhdGVkIGNoYXJhY3RlciBjbGFzcyBtYXkgY29udGFpbiBzdHJpbmdzXCIpOyB9XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn07XG5cbi8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNwcm9kLUNsYXNzQ29udGVudHNcbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLUNsYXNzUmFuZ2VzXG5wcCQxLnJlZ2V4cF9jbGFzc0NvbnRlbnRzID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgaWYgKHN0YXRlLmN1cnJlbnQoKSA9PT0gMHg1RCAvKiBdICovKSB7IHJldHVybiBDaGFyU2V0T2sgfVxuICBpZiAoc3RhdGUuc3dpdGNoVikgeyByZXR1cm4gdGhpcy5yZWdleHBfY2xhc3NTZXRFeHByZXNzaW9uKHN0YXRlKSB9XG4gIHRoaXMucmVnZXhwX25vbkVtcHR5Q2xhc3NSYW5nZXMoc3RhdGUpO1xuICByZXR1cm4gQ2hhclNldE9rXG59O1xuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1Ob25lbXB0eUNsYXNzUmFuZ2VzXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1Ob25lbXB0eUNsYXNzUmFuZ2VzTm9EYXNoXG5wcCQxLnJlZ2V4cF9ub25FbXB0eUNsYXNzUmFuZ2VzID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgd2hpbGUgKHRoaXMucmVnZXhwX2VhdENsYXNzQXRvbShzdGF0ZSkpIHtcbiAgICB2YXIgbGVmdCA9IHN0YXRlLmxhc3RJbnRWYWx1ZTtcbiAgICBpZiAoc3RhdGUuZWF0KDB4MkQgLyogLSAqLykgJiYgdGhpcy5yZWdleHBfZWF0Q2xhc3NBdG9tKHN0YXRlKSkge1xuICAgICAgdmFyIHJpZ2h0ID0gc3RhdGUubGFzdEludFZhbHVlO1xuICAgICAgaWYgKHN0YXRlLnN3aXRjaFUgJiYgKGxlZnQgPT09IC0xIHx8IHJpZ2h0ID09PSAtMSkpIHtcbiAgICAgICAgc3RhdGUucmFpc2UoXCJJbnZhbGlkIGNoYXJhY3RlciBjbGFzc1wiKTtcbiAgICAgIH1cbiAgICAgIGlmIChsZWZ0ICE9PSAtMSAmJiByaWdodCAhPT0gLTEgJiYgbGVmdCA+IHJpZ2h0KSB7XG4gICAgICAgIHN0YXRlLnJhaXNlKFwiUmFuZ2Ugb3V0IG9mIG9yZGVyIGluIGNoYXJhY3RlciBjbGFzc1wiKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLUNsYXNzQXRvbVxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtQ2xhc3NBdG9tTm9EYXNoXG5wcCQxLnJlZ2V4cF9lYXRDbGFzc0F0b20gPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgc3RhcnQgPSBzdGF0ZS5wb3M7XG5cbiAgaWYgKHN0YXRlLmVhdCgweDVDIC8qIFxcICovKSkge1xuICAgIGlmICh0aGlzLnJlZ2V4cF9lYXRDbGFzc0VzY2FwZShzdGF0ZSkpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICAgIGlmIChzdGF0ZS5zd2l0Y2hVKSB7XG4gICAgICAvLyBNYWtlIHRoZSBzYW1lIG1lc3NhZ2UgYXMgVjguXG4gICAgICB2YXIgY2gkMSA9IHN0YXRlLmN1cnJlbnQoKTtcbiAgICAgIGlmIChjaCQxID09PSAweDYzIC8qIGMgKi8gfHwgaXNPY3RhbERpZ2l0KGNoJDEpKSB7XG4gICAgICAgIHN0YXRlLnJhaXNlKFwiSW52YWxpZCBjbGFzcyBlc2NhcGVcIik7XG4gICAgICB9XG4gICAgICBzdGF0ZS5yYWlzZShcIkludmFsaWQgZXNjYXBlXCIpO1xuICAgIH1cbiAgICBzdGF0ZS5wb3MgPSBzdGFydDtcbiAgfVxuXG4gIHZhciBjaCA9IHN0YXRlLmN1cnJlbnQoKTtcbiAgaWYgKGNoICE9PSAweDVEIC8qIF0gKi8pIHtcbiAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSBjaDtcbiAgICBzdGF0ZS5hZHZhbmNlKCk7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIHJldHVybiBmYWxzZVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtYW5uZXhCLUNsYXNzRXNjYXBlXG5wcCQxLnJlZ2V4cF9lYXRDbGFzc0VzY2FwZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcblxuICBpZiAoc3RhdGUuZWF0KDB4NjIgLyogYiAqLykpIHtcbiAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSAweDA4OyAvKiA8QlM+ICovXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIGlmIChzdGF0ZS5zd2l0Y2hVICYmIHN0YXRlLmVhdCgweDJEIC8qIC0gKi8pKSB7XG4gICAgc3RhdGUubGFzdEludFZhbHVlID0gMHgyRDsgLyogLSAqL1xuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBpZiAoIXN0YXRlLnN3aXRjaFUgJiYgc3RhdGUuZWF0KDB4NjMgLyogYyAqLykpIHtcbiAgICBpZiAodGhpcy5yZWdleHBfZWF0Q2xhc3NDb250cm9sTGV0dGVyKHN0YXRlKSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgc3RhdGUucG9zID0gc3RhcnQ7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIHRoaXMucmVnZXhwX2VhdENoYXJhY3RlckNsYXNzRXNjYXBlKHN0YXRlKSB8fFxuICAgIHRoaXMucmVnZXhwX2VhdENoYXJhY3RlckVzY2FwZShzdGF0ZSlcbiAgKVxufTtcblxuLy8gaHR0cHM6Ly90YzM5LmVzL2VjbWEyNjIvI3Byb2QtQ2xhc3NTZXRFeHByZXNzaW9uXG4vLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jcHJvZC1DbGFzc1VuaW9uXG4vLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jcHJvZC1DbGFzc0ludGVyc2VjdGlvblxuLy8gaHR0cHM6Ly90YzM5LmVzL2VjbWEyNjIvI3Byb2QtQ2xhc3NTdWJ0cmFjdGlvblxucHAkMS5yZWdleHBfY2xhc3NTZXRFeHByZXNzaW9uID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIHJlc3VsdCA9IENoYXJTZXRPaywgc3ViUmVzdWx0O1xuICBpZiAodGhpcy5yZWdleHBfZWF0Q2xhc3NTZXRSYW5nZShzdGF0ZSkpIDsgZWxzZSBpZiAoc3ViUmVzdWx0ID0gdGhpcy5yZWdleHBfZWF0Q2xhc3NTZXRPcGVyYW5kKHN0YXRlKSkge1xuICAgIGlmIChzdWJSZXN1bHQgPT09IENoYXJTZXRTdHJpbmcpIHsgcmVzdWx0ID0gQ2hhclNldFN0cmluZzsgfVxuICAgIC8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNwcm9kLUNsYXNzSW50ZXJzZWN0aW9uXG4gICAgdmFyIHN0YXJ0ID0gc3RhdGUucG9zO1xuICAgIHdoaWxlIChzdGF0ZS5lYXRDaGFycyhbMHgyNiwgMHgyNl0gLyogJiYgKi8pKSB7XG4gICAgICBpZiAoXG4gICAgICAgIHN0YXRlLmN1cnJlbnQoKSAhPT0gMHgyNiAvKiAmICovICYmXG4gICAgICAgIChzdWJSZXN1bHQgPSB0aGlzLnJlZ2V4cF9lYXRDbGFzc1NldE9wZXJhbmQoc3RhdGUpKVxuICAgICAgKSB7XG4gICAgICAgIGlmIChzdWJSZXN1bHQgIT09IENoYXJTZXRTdHJpbmcpIHsgcmVzdWx0ID0gQ2hhclNldE9rOyB9XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgICBzdGF0ZS5yYWlzZShcIkludmFsaWQgY2hhcmFjdGVyIGluIGNoYXJhY3RlciBjbGFzc1wiKTtcbiAgICB9XG4gICAgaWYgKHN0YXJ0ICE9PSBzdGF0ZS5wb3MpIHsgcmV0dXJuIHJlc3VsdCB9XG4gICAgLy8gaHR0cHM6Ly90YzM5LmVzL2VjbWEyNjIvI3Byb2QtQ2xhc3NTdWJ0cmFjdGlvblxuICAgIHdoaWxlIChzdGF0ZS5lYXRDaGFycyhbMHgyRCwgMHgyRF0gLyogLS0gKi8pKSB7XG4gICAgICBpZiAodGhpcy5yZWdleHBfZWF0Q2xhc3NTZXRPcGVyYW5kKHN0YXRlKSkgeyBjb250aW51ZSB9XG4gICAgICBzdGF0ZS5yYWlzZShcIkludmFsaWQgY2hhcmFjdGVyIGluIGNoYXJhY3RlciBjbGFzc1wiKTtcbiAgICB9XG4gICAgaWYgKHN0YXJ0ICE9PSBzdGF0ZS5wb3MpIHsgcmV0dXJuIHJlc3VsdCB9XG4gIH0gZWxzZSB7XG4gICAgc3RhdGUucmFpc2UoXCJJbnZhbGlkIGNoYXJhY3RlciBpbiBjaGFyYWN0ZXIgY2xhc3NcIik7XG4gIH1cbiAgLy8gaHR0cHM6Ly90YzM5LmVzL2VjbWEyNjIvI3Byb2QtQ2xhc3NVbmlvblxuICBmb3IgKDs7KSB7XG4gICAgaWYgKHRoaXMucmVnZXhwX2VhdENsYXNzU2V0UmFuZ2Uoc3RhdGUpKSB7IGNvbnRpbnVlIH1cbiAgICBzdWJSZXN1bHQgPSB0aGlzLnJlZ2V4cF9lYXRDbGFzc1NldE9wZXJhbmQoc3RhdGUpO1xuICAgIGlmICghc3ViUmVzdWx0KSB7IHJldHVybiByZXN1bHQgfVxuICAgIGlmIChzdWJSZXN1bHQgPT09IENoYXJTZXRTdHJpbmcpIHsgcmVzdWx0ID0gQ2hhclNldFN0cmluZzsgfVxuICB9XG59O1xuXG4vLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jcHJvZC1DbGFzc1NldFJhbmdlXG5wcCQxLnJlZ2V4cF9lYXRDbGFzc1NldFJhbmdlID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIHN0YXJ0ID0gc3RhdGUucG9zO1xuICBpZiAodGhpcy5yZWdleHBfZWF0Q2xhc3NTZXRDaGFyYWN0ZXIoc3RhdGUpKSB7XG4gICAgdmFyIGxlZnQgPSBzdGF0ZS5sYXN0SW50VmFsdWU7XG4gICAgaWYgKHN0YXRlLmVhdCgweDJEIC8qIC0gKi8pICYmIHRoaXMucmVnZXhwX2VhdENsYXNzU2V0Q2hhcmFjdGVyKHN0YXRlKSkge1xuICAgICAgdmFyIHJpZ2h0ID0gc3RhdGUubGFzdEludFZhbHVlO1xuICAgICAgaWYgKGxlZnQgIT09IC0xICYmIHJpZ2h0ICE9PSAtMSAmJiBsZWZ0ID4gcmlnaHQpIHtcbiAgICAgICAgc3RhdGUucmFpc2UoXCJSYW5nZSBvdXQgb2Ygb3JkZXIgaW4gY2hhcmFjdGVyIGNsYXNzXCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgc3RhdGUucG9zID0gc3RhcnQ7XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG4vLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jcHJvZC1DbGFzc1NldE9wZXJhbmRcbnBwJDEucmVnZXhwX2VhdENsYXNzU2V0T3BlcmFuZCA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIGlmICh0aGlzLnJlZ2V4cF9lYXRDbGFzc1NldENoYXJhY3RlcihzdGF0ZSkpIHsgcmV0dXJuIENoYXJTZXRPayB9XG4gIHJldHVybiB0aGlzLnJlZ2V4cF9lYXRDbGFzc1N0cmluZ0Rpc2p1bmN0aW9uKHN0YXRlKSB8fCB0aGlzLnJlZ2V4cF9lYXROZXN0ZWRDbGFzcyhzdGF0ZSlcbn07XG5cbi8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNwcm9kLU5lc3RlZENsYXNzXG5wcCQxLnJlZ2V4cF9lYXROZXN0ZWRDbGFzcyA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcbiAgaWYgKHN0YXRlLmVhdCgweDVCIC8qIFsgKi8pKSB7XG4gICAgdmFyIG5lZ2F0ZSA9IHN0YXRlLmVhdCgweDVFIC8qIF4gKi8pO1xuICAgIHZhciByZXN1bHQgPSB0aGlzLnJlZ2V4cF9jbGFzc0NvbnRlbnRzKHN0YXRlKTtcbiAgICBpZiAoc3RhdGUuZWF0KDB4NUQgLyogXSAqLykpIHtcbiAgICAgIGlmIChuZWdhdGUgJiYgcmVzdWx0ID09PSBDaGFyU2V0U3RyaW5nKSB7XG4gICAgICAgIHN0YXRlLnJhaXNlKFwiTmVnYXRlZCBjaGFyYWN0ZXIgY2xhc3MgbWF5IGNvbnRhaW4gc3RyaW5nc1wiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHRcbiAgICB9XG4gICAgc3RhdGUucG9zID0gc3RhcnQ7XG4gIH1cbiAgaWYgKHN0YXRlLmVhdCgweDVDIC8qIFxcICovKSkge1xuICAgIHZhciByZXN1bHQkMSA9IHRoaXMucmVnZXhwX2VhdENoYXJhY3RlckNsYXNzRXNjYXBlKHN0YXRlKTtcbiAgICBpZiAocmVzdWx0JDEpIHtcbiAgICAgIHJldHVybiByZXN1bHQkMVxuICAgIH1cbiAgICBzdGF0ZS5wb3MgPSBzdGFydDtcbiAgfVxuICByZXR1cm4gbnVsbFxufTtcblxuLy8gaHR0cHM6Ly90YzM5LmVzL2VjbWEyNjIvI3Byb2QtQ2xhc3NTdHJpbmdEaXNqdW5jdGlvblxucHAkMS5yZWdleHBfZWF0Q2xhc3NTdHJpbmdEaXNqdW5jdGlvbiA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcbiAgaWYgKHN0YXRlLmVhdENoYXJzKFsweDVDLCAweDcxXSAvKiBcXHEgKi8pKSB7XG4gICAgaWYgKHN0YXRlLmVhdCgweDdCIC8qIHsgKi8pKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gdGhpcy5yZWdleHBfY2xhc3NTdHJpbmdEaXNqdW5jdGlvbkNvbnRlbnRzKHN0YXRlKTtcbiAgICAgIGlmIChzdGF0ZS5lYXQoMHg3RCAvKiB9ICovKSkge1xuICAgICAgICByZXR1cm4gcmVzdWx0XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE1ha2UgdGhlIHNhbWUgbWVzc2FnZSBhcyBWOC5cbiAgICAgIHN0YXRlLnJhaXNlKFwiSW52YWxpZCBlc2NhcGVcIik7XG4gICAgfVxuICAgIHN0YXRlLnBvcyA9IHN0YXJ0O1xuICB9XG4gIHJldHVybiBudWxsXG59O1xuXG4vLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jcHJvZC1DbGFzc1N0cmluZ0Rpc2p1bmN0aW9uQ29udGVudHNcbnBwJDEucmVnZXhwX2NsYXNzU3RyaW5nRGlzanVuY3Rpb25Db250ZW50cyA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciByZXN1bHQgPSB0aGlzLnJlZ2V4cF9jbGFzc1N0cmluZyhzdGF0ZSk7XG4gIHdoaWxlIChzdGF0ZS5lYXQoMHg3QyAvKiB8ICovKSkge1xuICAgIGlmICh0aGlzLnJlZ2V4cF9jbGFzc1N0cmluZyhzdGF0ZSkgPT09IENoYXJTZXRTdHJpbmcpIHsgcmVzdWx0ID0gQ2hhclNldFN0cmluZzsgfVxuICB9XG4gIHJldHVybiByZXN1bHRcbn07XG5cbi8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNwcm9kLUNsYXNzU3RyaW5nXG4vLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jcHJvZC1Ob25FbXB0eUNsYXNzU3RyaW5nXG5wcCQxLnJlZ2V4cF9jbGFzc1N0cmluZyA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBjb3VudCA9IDA7XG4gIHdoaWxlICh0aGlzLnJlZ2V4cF9lYXRDbGFzc1NldENoYXJhY3RlcihzdGF0ZSkpIHsgY291bnQrKzsgfVxuICByZXR1cm4gY291bnQgPT09IDEgPyBDaGFyU2V0T2sgOiBDaGFyU2V0U3RyaW5nXG59O1xuXG4vLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jcHJvZC1DbGFzc1NldENoYXJhY3RlclxucHAkMS5yZWdleHBfZWF0Q2xhc3NTZXRDaGFyYWN0ZXIgPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgc3RhcnQgPSBzdGF0ZS5wb3M7XG4gIGlmIChzdGF0ZS5lYXQoMHg1QyAvKiBcXCAqLykpIHtcbiAgICBpZiAoXG4gICAgICB0aGlzLnJlZ2V4cF9lYXRDaGFyYWN0ZXJFc2NhcGUoc3RhdGUpIHx8XG4gICAgICB0aGlzLnJlZ2V4cF9lYXRDbGFzc1NldFJlc2VydmVkUHVuY3R1YXRvcihzdGF0ZSlcbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICAgIGlmIChzdGF0ZS5lYXQoMHg2MiAvKiBiICovKSkge1xuICAgICAgc3RhdGUubGFzdEludFZhbHVlID0gMHgwODsgLyogPEJTPiAqL1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgc3RhdGUucG9zID0gc3RhcnQ7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgdmFyIGNoID0gc3RhdGUuY3VycmVudCgpO1xuICBpZiAoY2ggPCAwIHx8IGNoID09PSBzdGF0ZS5sb29rYWhlYWQoKSAmJiBpc0NsYXNzU2V0UmVzZXJ2ZWREb3VibGVQdW5jdHVhdG9yQ2hhcmFjdGVyKGNoKSkgeyByZXR1cm4gZmFsc2UgfVxuICBpZiAoaXNDbGFzc1NldFN5bnRheENoYXJhY3RlcihjaCkpIHsgcmV0dXJuIGZhbHNlIH1cbiAgc3RhdGUuYWR2YW5jZSgpO1xuICBzdGF0ZS5sYXN0SW50VmFsdWUgPSBjaDtcbiAgcmV0dXJuIHRydWVcbn07XG5cbi8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNwcm9kLUNsYXNzU2V0UmVzZXJ2ZWREb3VibGVQdW5jdHVhdG9yXG5mdW5jdGlvbiBpc0NsYXNzU2V0UmVzZXJ2ZWREb3VibGVQdW5jdHVhdG9yQ2hhcmFjdGVyKGNoKSB7XG4gIHJldHVybiAoXG4gICAgY2ggPT09IDB4MjEgLyogISAqLyB8fFxuICAgIGNoID49IDB4MjMgLyogIyAqLyAmJiBjaCA8PSAweDI2IC8qICYgKi8gfHxcbiAgICBjaCA+PSAweDJBIC8qICogKi8gJiYgY2ggPD0gMHgyQyAvKiAsICovIHx8XG4gICAgY2ggPT09IDB4MkUgLyogLiAqLyB8fFxuICAgIGNoID49IDB4M0EgLyogOiAqLyAmJiBjaCA8PSAweDQwIC8qIEAgKi8gfHxcbiAgICBjaCA9PT0gMHg1RSAvKiBeICovIHx8XG4gICAgY2ggPT09IDB4NjAgLyogYCAqLyB8fFxuICAgIGNoID09PSAweDdFIC8qIH4gKi9cbiAgKVxufVxuXG4vLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jcHJvZC1DbGFzc1NldFN5bnRheENoYXJhY3RlclxuZnVuY3Rpb24gaXNDbGFzc1NldFN5bnRheENoYXJhY3RlcihjaCkge1xuICByZXR1cm4gKFxuICAgIGNoID09PSAweDI4IC8qICggKi8gfHxcbiAgICBjaCA9PT0gMHgyOSAvKiApICovIHx8XG4gICAgY2ggPT09IDB4MkQgLyogLSAqLyB8fFxuICAgIGNoID09PSAweDJGIC8qIC8gKi8gfHxcbiAgICBjaCA+PSAweDVCIC8qIFsgKi8gJiYgY2ggPD0gMHg1RCAvKiBdICovIHx8XG4gICAgY2ggPj0gMHg3QiAvKiB7ICovICYmIGNoIDw9IDB4N0QgLyogfSAqL1xuICApXG59XG5cbi8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNwcm9kLUNsYXNzU2V0UmVzZXJ2ZWRQdW5jdHVhdG9yXG5wcCQxLnJlZ2V4cF9lYXRDbGFzc1NldFJlc2VydmVkUHVuY3R1YXRvciA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBjaCA9IHN0YXRlLmN1cnJlbnQoKTtcbiAgaWYgKGlzQ2xhc3NTZXRSZXNlcnZlZFB1bmN0dWF0b3IoY2gpKSB7XG4gICAgc3RhdGUubGFzdEludFZhbHVlID0gY2g7XG4gICAgc3RhdGUuYWR2YW5jZSgpO1xuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG4vLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jcHJvZC1DbGFzc1NldFJlc2VydmVkUHVuY3R1YXRvclxuZnVuY3Rpb24gaXNDbGFzc1NldFJlc2VydmVkUHVuY3R1YXRvcihjaCkge1xuICByZXR1cm4gKFxuICAgIGNoID09PSAweDIxIC8qICEgKi8gfHxcbiAgICBjaCA9PT0gMHgyMyAvKiAjICovIHx8XG4gICAgY2ggPT09IDB4MjUgLyogJSAqLyB8fFxuICAgIGNoID09PSAweDI2IC8qICYgKi8gfHxcbiAgICBjaCA9PT0gMHgyQyAvKiAsICovIHx8XG4gICAgY2ggPT09IDB4MkQgLyogLSAqLyB8fFxuICAgIGNoID49IDB4M0EgLyogOiAqLyAmJiBjaCA8PSAweDNFIC8qID4gKi8gfHxcbiAgICBjaCA9PT0gMHg0MCAvKiBAICovIHx8XG4gICAgY2ggPT09IDB4NjAgLyogYCAqLyB8fFxuICAgIGNoID09PSAweDdFIC8qIH4gKi9cbiAgKVxufVxuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1hbm5leEItQ2xhc3NDb250cm9sTGV0dGVyXG5wcCQxLnJlZ2V4cF9lYXRDbGFzc0NvbnRyb2xMZXR0ZXIgPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgY2ggPSBzdGF0ZS5jdXJyZW50KCk7XG4gIGlmIChpc0RlY2ltYWxEaWdpdChjaCkgfHwgY2ggPT09IDB4NUYgLyogXyAqLykge1xuICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IGNoICUgMHgyMDtcbiAgICBzdGF0ZS5hZHZhbmNlKCk7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn07XG5cbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLUhleEVzY2FwZVNlcXVlbmNlXG5wcCQxLnJlZ2V4cF9lYXRIZXhFc2NhcGVTZXF1ZW5jZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcbiAgaWYgKHN0YXRlLmVhdCgweDc4IC8qIHggKi8pKSB7XG4gICAgaWYgKHRoaXMucmVnZXhwX2VhdEZpeGVkSGV4RGlnaXRzKHN0YXRlLCAyKSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgaWYgKHN0YXRlLnN3aXRjaFUpIHtcbiAgICAgIHN0YXRlLnJhaXNlKFwiSW52YWxpZCBlc2NhcGVcIik7XG4gICAgfVxuICAgIHN0YXRlLnBvcyA9IHN0YXJ0O1xuICB9XG4gIHJldHVybiBmYWxzZVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtRGVjaW1hbERpZ2l0c1xucHAkMS5yZWdleHBfZWF0RGVjaW1hbERpZ2l0cyA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcbiAgdmFyIGNoID0gMDtcbiAgc3RhdGUubGFzdEludFZhbHVlID0gMDtcbiAgd2hpbGUgKGlzRGVjaW1hbERpZ2l0KGNoID0gc3RhdGUuY3VycmVudCgpKSkge1xuICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IDEwICogc3RhdGUubGFzdEludFZhbHVlICsgKGNoIC0gMHgzMCAvKiAwICovKTtcbiAgICBzdGF0ZS5hZHZhbmNlKCk7XG4gIH1cbiAgcmV0dXJuIHN0YXRlLnBvcyAhPT0gc3RhcnRcbn07XG5mdW5jdGlvbiBpc0RlY2ltYWxEaWdpdChjaCkge1xuICByZXR1cm4gY2ggPj0gMHgzMCAvKiAwICovICYmIGNoIDw9IDB4MzkgLyogOSAqL1xufVxuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1IZXhEaWdpdHNcbnBwJDEucmVnZXhwX2VhdEhleERpZ2l0cyA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcbiAgdmFyIGNoID0gMDtcbiAgc3RhdGUubGFzdEludFZhbHVlID0gMDtcbiAgd2hpbGUgKGlzSGV4RGlnaXQoY2ggPSBzdGF0ZS5jdXJyZW50KCkpKSB7XG4gICAgc3RhdGUubGFzdEludFZhbHVlID0gMTYgKiBzdGF0ZS5sYXN0SW50VmFsdWUgKyBoZXhUb0ludChjaCk7XG4gICAgc3RhdGUuYWR2YW5jZSgpO1xuICB9XG4gIHJldHVybiBzdGF0ZS5wb3MgIT09IHN0YXJ0XG59O1xuZnVuY3Rpb24gaXNIZXhEaWdpdChjaCkge1xuICByZXR1cm4gKFxuICAgIChjaCA+PSAweDMwIC8qIDAgKi8gJiYgY2ggPD0gMHgzOSAvKiA5ICovKSB8fFxuICAgIChjaCA+PSAweDQxIC8qIEEgKi8gJiYgY2ggPD0gMHg0NiAvKiBGICovKSB8fFxuICAgIChjaCA+PSAweDYxIC8qIGEgKi8gJiYgY2ggPD0gMHg2NiAvKiBmICovKVxuICApXG59XG5mdW5jdGlvbiBoZXhUb0ludChjaCkge1xuICBpZiAoY2ggPj0gMHg0MSAvKiBBICovICYmIGNoIDw9IDB4NDYgLyogRiAqLykge1xuICAgIHJldHVybiAxMCArIChjaCAtIDB4NDEgLyogQSAqLylcbiAgfVxuICBpZiAoY2ggPj0gMHg2MSAvKiBhICovICYmIGNoIDw9IDB4NjYgLyogZiAqLykge1xuICAgIHJldHVybiAxMCArIChjaCAtIDB4NjEgLyogYSAqLylcbiAgfVxuICByZXR1cm4gY2ggLSAweDMwIC8qIDAgKi9cbn1cblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtYW5uZXhCLUxlZ2FjeU9jdGFsRXNjYXBlU2VxdWVuY2Vcbi8vIEFsbG93cyBvbmx5IDAtMzc3KG9jdGFsKSBpLmUuIDAtMjU1KGRlY2ltYWwpLlxucHAkMS5yZWdleHBfZWF0TGVnYWN5T2N0YWxFc2NhcGVTZXF1ZW5jZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIGlmICh0aGlzLnJlZ2V4cF9lYXRPY3RhbERpZ2l0KHN0YXRlKSkge1xuICAgIHZhciBuMSA9IHN0YXRlLmxhc3RJbnRWYWx1ZTtcbiAgICBpZiAodGhpcy5yZWdleHBfZWF0T2N0YWxEaWdpdChzdGF0ZSkpIHtcbiAgICAgIHZhciBuMiA9IHN0YXRlLmxhc3RJbnRWYWx1ZTtcbiAgICAgIGlmIChuMSA8PSAzICYmIHRoaXMucmVnZXhwX2VhdE9jdGFsRGlnaXQoc3RhdGUpKSB7XG4gICAgICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IG4xICogNjQgKyBuMiAqIDggKyBzdGF0ZS5sYXN0SW50VmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSBuMSAqIDggKyBuMjtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RhdGUubGFzdEludFZhbHVlID0gbjE7XG4gICAgfVxuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1PY3RhbERpZ2l0XG5wcCQxLnJlZ2V4cF9lYXRPY3RhbERpZ2l0ID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIGNoID0gc3RhdGUuY3VycmVudCgpO1xuICBpZiAoaXNPY3RhbERpZ2l0KGNoKSkge1xuICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IGNoIC0gMHgzMDsgLyogMCAqL1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IDA7XG4gIHJldHVybiBmYWxzZVxufTtcbmZ1bmN0aW9uIGlzT2N0YWxEaWdpdChjaCkge1xuICByZXR1cm4gY2ggPj0gMHgzMCAvKiAwICovICYmIGNoIDw9IDB4MzcgLyogNyAqL1xufVxuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1IZXg0RGlnaXRzXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1IZXhEaWdpdFxuLy8gQW5kIEhleERpZ2l0IEhleERpZ2l0IGluIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLUhleEVzY2FwZVNlcXVlbmNlXG5wcCQxLnJlZ2V4cF9lYXRGaXhlZEhleERpZ2l0cyA9IGZ1bmN0aW9uKHN0YXRlLCBsZW5ndGgpIHtcbiAgdmFyIHN0YXJ0ID0gc3RhdGUucG9zO1xuICBzdGF0ZS5sYXN0SW50VmFsdWUgPSAwO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGNoID0gc3RhdGUuY3VycmVudCgpO1xuICAgIGlmICghaXNIZXhEaWdpdChjaCkpIHtcbiAgICAgIHN0YXRlLnBvcyA9IHN0YXJ0O1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IDE2ICogc3RhdGUubGFzdEludFZhbHVlICsgaGV4VG9JbnQoY2gpO1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgfVxuICByZXR1cm4gdHJ1ZVxufTtcblxuLy8gT2JqZWN0IHR5cGUgdXNlZCB0byByZXByZXNlbnQgdG9rZW5zLiBOb3RlIHRoYXQgbm9ybWFsbHksIHRva2Vuc1xuLy8gc2ltcGx5IGV4aXN0IGFzIHByb3BlcnRpZXMgb24gdGhlIHBhcnNlciBvYmplY3QuIFRoaXMgaXMgb25seVxuLy8gdXNlZCBmb3IgdGhlIG9uVG9rZW4gY2FsbGJhY2sgYW5kIHRoZSBleHRlcm5hbCB0b2tlbml6ZXIuXG5cbnZhciBUb2tlbiA9IGZ1bmN0aW9uIFRva2VuKHApIHtcbiAgdGhpcy50eXBlID0gcC50eXBlO1xuICB0aGlzLnZhbHVlID0gcC52YWx1ZTtcbiAgdGhpcy5zdGFydCA9IHAuc3RhcnQ7XG4gIHRoaXMuZW5kID0gcC5lbmQ7XG4gIGlmIChwLm9wdGlvbnMubG9jYXRpb25zKVxuICAgIHsgdGhpcy5sb2MgPSBuZXcgU291cmNlTG9jYXRpb24ocCwgcC5zdGFydExvYywgcC5lbmRMb2MpOyB9XG4gIGlmIChwLm9wdGlvbnMucmFuZ2VzKVxuICAgIHsgdGhpcy5yYW5nZSA9IFtwLnN0YXJ0LCBwLmVuZF07IH1cbn07XG5cbi8vICMjIFRva2VuaXplclxuXG52YXIgcHAgPSBQYXJzZXIucHJvdG90eXBlO1xuXG4vLyBNb3ZlIHRvIHRoZSBuZXh0IHRva2VuXG5cbnBwLm5leHQgPSBmdW5jdGlvbihpZ25vcmVFc2NhcGVTZXF1ZW5jZUluS2V5d29yZCkge1xuICBpZiAoIWlnbm9yZUVzY2FwZVNlcXVlbmNlSW5LZXl3b3JkICYmIHRoaXMudHlwZS5rZXl3b3JkICYmIHRoaXMuY29udGFpbnNFc2MpXG4gICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUodGhpcy5zdGFydCwgXCJFc2NhcGUgc2VxdWVuY2UgaW4ga2V5d29yZCBcIiArIHRoaXMudHlwZS5rZXl3b3JkKTsgfVxuICBpZiAodGhpcy5vcHRpb25zLm9uVG9rZW4pXG4gICAgeyB0aGlzLm9wdGlvbnMub25Ub2tlbihuZXcgVG9rZW4odGhpcykpOyB9XG5cbiAgdGhpcy5sYXN0VG9rRW5kID0gdGhpcy5lbmQ7XG4gIHRoaXMubGFzdFRva1N0YXJ0ID0gdGhpcy5zdGFydDtcbiAgdGhpcy5sYXN0VG9rRW5kTG9jID0gdGhpcy5lbmRMb2M7XG4gIHRoaXMubGFzdFRva1N0YXJ0TG9jID0gdGhpcy5zdGFydExvYztcbiAgdGhpcy5uZXh0VG9rZW4oKTtcbn07XG5cbnBwLmdldFRva2VuID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMubmV4dCgpO1xuICByZXR1cm4gbmV3IFRva2VuKHRoaXMpXG59O1xuXG4vLyBJZiB3ZSdyZSBpbiBhbiBFUzYgZW52aXJvbm1lbnQsIG1ha2UgcGFyc2VycyBpdGVyYWJsZVxuaWYgKHR5cGVvZiBTeW1ib2wgIT09IFwidW5kZWZpbmVkXCIpXG4gIHsgcHBbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGlzJDEkMSA9IHRoaXM7XG5cbiAgICByZXR1cm4ge1xuICAgICAgbmV4dDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdG9rZW4gPSB0aGlzJDEkMS5nZXRUb2tlbigpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGRvbmU6IHRva2VuLnR5cGUgPT09IHR5cGVzJDEuZW9mLFxuICAgICAgICAgIHZhbHVlOiB0b2tlblxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9OyB9XG5cbi8vIFRvZ2dsZSBzdHJpY3QgbW9kZS4gUmUtcmVhZHMgdGhlIG5leHQgbnVtYmVyIG9yIHN0cmluZyB0byBwbGVhc2Vcbi8vIHBlZGFudGljIHRlc3RzIChgXCJ1c2Ugc3RyaWN0XCI7IDAxMDtgIHNob3VsZCBmYWlsKS5cblxuLy8gUmVhZCBhIHNpbmdsZSB0b2tlbiwgdXBkYXRpbmcgdGhlIHBhcnNlciBvYmplY3QncyB0b2tlbi1yZWxhdGVkXG4vLyBwcm9wZXJ0aWVzLlxuXG5wcC5uZXh0VG9rZW4gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGN1ckNvbnRleHQgPSB0aGlzLmN1ckNvbnRleHQoKTtcbiAgaWYgKCFjdXJDb250ZXh0IHx8ICFjdXJDb250ZXh0LnByZXNlcnZlU3BhY2UpIHsgdGhpcy5za2lwU3BhY2UoKTsgfVxuXG4gIHRoaXMuc3RhcnQgPSB0aGlzLnBvcztcbiAgaWYgKHRoaXMub3B0aW9ucy5sb2NhdGlvbnMpIHsgdGhpcy5zdGFydExvYyA9IHRoaXMuY3VyUG9zaXRpb24oKTsgfVxuICBpZiAodGhpcy5wb3MgPj0gdGhpcy5pbnB1dC5sZW5ndGgpIHsgcmV0dXJuIHRoaXMuZmluaXNoVG9rZW4odHlwZXMkMS5lb2YpIH1cblxuICBpZiAoY3VyQ29udGV4dC5vdmVycmlkZSkgeyByZXR1cm4gY3VyQ29udGV4dC5vdmVycmlkZSh0aGlzKSB9XG4gIGVsc2UgeyB0aGlzLnJlYWRUb2tlbih0aGlzLmZ1bGxDaGFyQ29kZUF0UG9zKCkpOyB9XG59O1xuXG5wcC5yZWFkVG9rZW4gPSBmdW5jdGlvbihjb2RlKSB7XG4gIC8vIElkZW50aWZpZXIgb3Iga2V5d29yZC4gJ1xcdVhYWFgnIHNlcXVlbmNlcyBhcmUgYWxsb3dlZCBpblxuICAvLyBpZGVudGlmaWVycywgc28gJ1xcJyBhbHNvIGRpc3BhdGNoZXMgdG8gdGhhdC5cbiAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KGNvZGUsIHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2KSB8fCBjb2RlID09PSA5MiAvKiAnXFwnICovKVxuICAgIHsgcmV0dXJuIHRoaXMucmVhZFdvcmQoKSB9XG5cbiAgcmV0dXJuIHRoaXMuZ2V0VG9rZW5Gcm9tQ29kZShjb2RlKVxufTtcblxucHAuZnVsbENoYXJDb2RlQXRQb3MgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGNvZGUgPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MpO1xuICBpZiAoY29kZSA8PSAweGQ3ZmYgfHwgY29kZSA+PSAweGRjMDApIHsgcmV0dXJuIGNvZGUgfVxuICB2YXIgbmV4dCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyArIDEpO1xuICByZXR1cm4gbmV4dCA8PSAweGRiZmYgfHwgbmV4dCA+PSAweGUwMDAgPyBjb2RlIDogKGNvZGUgPDwgMTApICsgbmV4dCAtIDB4MzVmZGMwMFxufTtcblxucHAuc2tpcEJsb2NrQ29tbWVudCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc3RhcnRMb2MgPSB0aGlzLm9wdGlvbnMub25Db21tZW50ICYmIHRoaXMuY3VyUG9zaXRpb24oKTtcbiAgdmFyIHN0YXJ0ID0gdGhpcy5wb3MsIGVuZCA9IHRoaXMuaW5wdXQuaW5kZXhPZihcIiovXCIsIHRoaXMucG9zICs9IDIpO1xuICBpZiAoZW5kID09PSAtMSkgeyB0aGlzLnJhaXNlKHRoaXMucG9zIC0gMiwgXCJVbnRlcm1pbmF0ZWQgY29tbWVudFwiKTsgfVxuICB0aGlzLnBvcyA9IGVuZCArIDI7XG4gIGlmICh0aGlzLm9wdGlvbnMubG9jYXRpb25zKSB7XG4gICAgZm9yICh2YXIgbmV4dEJyZWFrID0gKHZvaWQgMCksIHBvcyA9IHN0YXJ0OyAobmV4dEJyZWFrID0gbmV4dExpbmVCcmVhayh0aGlzLmlucHV0LCBwb3MsIHRoaXMucG9zKSkgPiAtMTspIHtcbiAgICAgICsrdGhpcy5jdXJMaW5lO1xuICAgICAgcG9zID0gdGhpcy5saW5lU3RhcnQgPSBuZXh0QnJlYWs7XG4gICAgfVxuICB9XG4gIGlmICh0aGlzLm9wdGlvbnMub25Db21tZW50KVxuICAgIHsgdGhpcy5vcHRpb25zLm9uQ29tbWVudCh0cnVlLCB0aGlzLmlucHV0LnNsaWNlKHN0YXJ0ICsgMiwgZW5kKSwgc3RhcnQsIHRoaXMucG9zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRMb2MsIHRoaXMuY3VyUG9zaXRpb24oKSk7IH1cbn07XG5cbnBwLnNraXBMaW5lQ29tbWVudCA9IGZ1bmN0aW9uKHN0YXJ0U2tpcCkge1xuICB2YXIgc3RhcnQgPSB0aGlzLnBvcztcbiAgdmFyIHN0YXJ0TG9jID0gdGhpcy5vcHRpb25zLm9uQ29tbWVudCAmJiB0aGlzLmN1clBvc2l0aW9uKCk7XG4gIHZhciBjaCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyArPSBzdGFydFNraXApO1xuICB3aGlsZSAodGhpcy5wb3MgPCB0aGlzLmlucHV0Lmxlbmd0aCAmJiAhaXNOZXdMaW5lKGNoKSkge1xuICAgIGNoID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KCsrdGhpcy5wb3MpO1xuICB9XG4gIGlmICh0aGlzLm9wdGlvbnMub25Db21tZW50KVxuICAgIHsgdGhpcy5vcHRpb25zLm9uQ29tbWVudChmYWxzZSwgdGhpcy5pbnB1dC5zbGljZShzdGFydCArIHN0YXJ0U2tpcCwgdGhpcy5wb3MpLCBzdGFydCwgdGhpcy5wb3MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydExvYywgdGhpcy5jdXJQb3NpdGlvbigpKTsgfVxufTtcblxuLy8gQ2FsbGVkIGF0IHRoZSBzdGFydCBvZiB0aGUgcGFyc2UgYW5kIGFmdGVyIGV2ZXJ5IHRva2VuLiBTa2lwc1xuLy8gd2hpdGVzcGFjZSBhbmQgY29tbWVudHMsIGFuZC5cblxucHAuc2tpcFNwYWNlID0gZnVuY3Rpb24oKSB7XG4gIGxvb3A6IHdoaWxlICh0aGlzLnBvcyA8IHRoaXMuaW5wdXQubGVuZ3RoKSB7XG4gICAgdmFyIGNoID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zKTtcbiAgICBzd2l0Y2ggKGNoKSB7XG4gICAgY2FzZSAzMjogY2FzZSAxNjA6IC8vICcgJ1xuICAgICAgKyt0aGlzLnBvcztcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAxMzpcbiAgICAgIGlmICh0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MgKyAxKSA9PT0gMTApIHtcbiAgICAgICAgKyt0aGlzLnBvcztcbiAgICAgIH1cbiAgICBjYXNlIDEwOiBjYXNlIDgyMzI6IGNhc2UgODIzMzpcbiAgICAgICsrdGhpcy5wb3M7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmxvY2F0aW9ucykge1xuICAgICAgICArK3RoaXMuY3VyTGluZTtcbiAgICAgICAgdGhpcy5saW5lU3RhcnQgPSB0aGlzLnBvcztcbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgY2FzZSA0NzogLy8gJy8nXG4gICAgICBzd2l0Y2ggKHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyArIDEpKSB7XG4gICAgICBjYXNlIDQyOiAvLyAnKidcbiAgICAgICAgdGhpcy5za2lwQmxvY2tDb21tZW50KCk7XG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIDQ3OlxuICAgICAgICB0aGlzLnNraXBMaW5lQ29tbWVudCgyKTtcbiAgICAgICAgYnJlYWtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGJyZWFrIGxvb3BcbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIGlmIChjaCA+IDggJiYgY2ggPCAxNCB8fCBjaCA+PSA1NzYwICYmIG5vbkFTQ0lJd2hpdGVzcGFjZS50ZXN0KFN0cmluZy5mcm9tQ2hhckNvZGUoY2gpKSkge1xuICAgICAgICArK3RoaXMucG9zO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWsgbG9vcFxuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuLy8gQ2FsbGVkIGF0IHRoZSBlbmQgb2YgZXZlcnkgdG9rZW4uIFNldHMgYGVuZGAsIGB2YWxgLCBhbmRcbi8vIG1haW50YWlucyBgY29udGV4dGAgYW5kIGBleHByQWxsb3dlZGAsIGFuZCBza2lwcyB0aGUgc3BhY2UgYWZ0ZXJcbi8vIHRoZSB0b2tlbiwgc28gdGhhdCB0aGUgbmV4dCBvbmUncyBgc3RhcnRgIHdpbGwgcG9pbnQgYXQgdGhlXG4vLyByaWdodCBwb3NpdGlvbi5cblxucHAuZmluaXNoVG9rZW4gPSBmdW5jdGlvbih0eXBlLCB2YWwpIHtcbiAgdGhpcy5lbmQgPSB0aGlzLnBvcztcbiAgaWYgKHRoaXMub3B0aW9ucy5sb2NhdGlvbnMpIHsgdGhpcy5lbmRMb2MgPSB0aGlzLmN1clBvc2l0aW9uKCk7IH1cbiAgdmFyIHByZXZUeXBlID0gdGhpcy50eXBlO1xuICB0aGlzLnR5cGUgPSB0eXBlO1xuICB0aGlzLnZhbHVlID0gdmFsO1xuXG4gIHRoaXMudXBkYXRlQ29udGV4dChwcmV2VHlwZSk7XG59O1xuXG4vLyAjIyMgVG9rZW4gcmVhZGluZ1xuXG4vLyBUaGlzIGlzIHRoZSBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB0byBmZXRjaCB0aGUgbmV4dCB0b2tlbi4gSXRcbi8vIGlzIHNvbWV3aGF0IG9ic2N1cmUsIGJlY2F1c2UgaXQgd29ya3MgaW4gY2hhcmFjdGVyIGNvZGVzIHJhdGhlclxuLy8gdGhhbiBjaGFyYWN0ZXJzLCBhbmQgYmVjYXVzZSBvcGVyYXRvciBwYXJzaW5nIGhhcyBiZWVuIGlubGluZWRcbi8vIGludG8gaXQuXG4vL1xuLy8gQWxsIGluIHRoZSBuYW1lIG9mIHNwZWVkLlxuLy9cbnBwLnJlYWRUb2tlbl9kb3QgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG5leHQgPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MgKyAxKTtcbiAgaWYgKG5leHQgPj0gNDggJiYgbmV4dCA8PSA1NykgeyByZXR1cm4gdGhpcy5yZWFkTnVtYmVyKHRydWUpIH1cbiAgdmFyIG5leHQyID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMik7XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNiAmJiBuZXh0ID09PSA0NiAmJiBuZXh0MiA9PT0gNDYpIHsgLy8gNDYgPSBkb3QgJy4nXG4gICAgdGhpcy5wb3MgKz0gMztcbiAgICByZXR1cm4gdGhpcy5maW5pc2hUb2tlbih0eXBlcyQxLmVsbGlwc2lzKVxuICB9IGVsc2Uge1xuICAgICsrdGhpcy5wb3M7XG4gICAgcmV0dXJuIHRoaXMuZmluaXNoVG9rZW4odHlwZXMkMS5kb3QpXG4gIH1cbn07XG5cbnBwLnJlYWRUb2tlbl9zbGFzaCA9IGZ1bmN0aW9uKCkgeyAvLyAnLydcbiAgdmFyIG5leHQgPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MgKyAxKTtcbiAgaWYgKHRoaXMuZXhwckFsbG93ZWQpIHsgKyt0aGlzLnBvczsgcmV0dXJuIHRoaXMucmVhZFJlZ2V4cCgpIH1cbiAgaWYgKG5leHQgPT09IDYxKSB7IHJldHVybiB0aGlzLmZpbmlzaE9wKHR5cGVzJDEuYXNzaWduLCAyKSB9XG4gIHJldHVybiB0aGlzLmZpbmlzaE9wKHR5cGVzJDEuc2xhc2gsIDEpXG59O1xuXG5wcC5yZWFkVG9rZW5fbXVsdF9tb2R1bG9fZXhwID0gZnVuY3Rpb24oY29kZSkgeyAvLyAnJSonXG4gIHZhciBuZXh0ID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMSk7XG4gIHZhciBzaXplID0gMTtcbiAgdmFyIHRva2VudHlwZSA9IGNvZGUgPT09IDQyID8gdHlwZXMkMS5zdGFyIDogdHlwZXMkMS5tb2R1bG87XG5cbiAgLy8gZXhwb25lbnRpYXRpb24gb3BlcmF0b3IgKiogYW5kICoqPVxuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDcgJiYgY29kZSA9PT0gNDIgJiYgbmV4dCA9PT0gNDIpIHtcbiAgICArK3NpemU7XG4gICAgdG9rZW50eXBlID0gdHlwZXMkMS5zdGFyc3RhcjtcbiAgICBuZXh0ID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMik7XG4gIH1cblxuICBpZiAobmV4dCA9PT0gNjEpIHsgcmV0dXJuIHRoaXMuZmluaXNoT3AodHlwZXMkMS5hc3NpZ24sIHNpemUgKyAxKSB9XG4gIHJldHVybiB0aGlzLmZpbmlzaE9wKHRva2VudHlwZSwgc2l6ZSlcbn07XG5cbnBwLnJlYWRUb2tlbl9waXBlX2FtcCA9IGZ1bmN0aW9uKGNvZGUpIHsgLy8gJ3wmJ1xuICB2YXIgbmV4dCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyArIDEpO1xuICBpZiAobmV4dCA9PT0gY29kZSkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTIpIHtcbiAgICAgIHZhciBuZXh0MiA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyArIDIpO1xuICAgICAgaWYgKG5leHQyID09PSA2MSkgeyByZXR1cm4gdGhpcy5maW5pc2hPcCh0eXBlcyQxLmFzc2lnbiwgMykgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5maW5pc2hPcChjb2RlID09PSAxMjQgPyB0eXBlcyQxLmxvZ2ljYWxPUiA6IHR5cGVzJDEubG9naWNhbEFORCwgMilcbiAgfVxuICBpZiAobmV4dCA9PT0gNjEpIHsgcmV0dXJuIHRoaXMuZmluaXNoT3AodHlwZXMkMS5hc3NpZ24sIDIpIH1cbiAgcmV0dXJuIHRoaXMuZmluaXNoT3AoY29kZSA9PT0gMTI0ID8gdHlwZXMkMS5iaXR3aXNlT1IgOiB0eXBlcyQxLmJpdHdpc2VBTkQsIDEpXG59O1xuXG5wcC5yZWFkVG9rZW5fY2FyZXQgPSBmdW5jdGlvbigpIHsgLy8gJ14nXG4gIHZhciBuZXh0ID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMSk7XG4gIGlmIChuZXh0ID09PSA2MSkgeyByZXR1cm4gdGhpcy5maW5pc2hPcCh0eXBlcyQxLmFzc2lnbiwgMikgfVxuICByZXR1cm4gdGhpcy5maW5pc2hPcCh0eXBlcyQxLmJpdHdpc2VYT1IsIDEpXG59O1xuXG5wcC5yZWFkVG9rZW5fcGx1c19taW4gPSBmdW5jdGlvbihjb2RlKSB7IC8vICcrLSdcbiAgdmFyIG5leHQgPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MgKyAxKTtcbiAgaWYgKG5leHQgPT09IGNvZGUpIHtcbiAgICBpZiAobmV4dCA9PT0gNDUgJiYgIXRoaXMuaW5Nb2R1bGUgJiYgdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMikgPT09IDYyICYmXG4gICAgICAgICh0aGlzLmxhc3RUb2tFbmQgPT09IDAgfHwgbGluZUJyZWFrLnRlc3QodGhpcy5pbnB1dC5zbGljZSh0aGlzLmxhc3RUb2tFbmQsIHRoaXMucG9zKSkpKSB7XG4gICAgICAvLyBBIGAtLT5gIGxpbmUgY29tbWVudFxuICAgICAgdGhpcy5za2lwTGluZUNvbW1lbnQoMyk7XG4gICAgICB0aGlzLnNraXBTcGFjZSgpO1xuICAgICAgcmV0dXJuIHRoaXMubmV4dFRva2VuKClcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZmluaXNoT3AodHlwZXMkMS5pbmNEZWMsIDIpXG4gIH1cbiAgaWYgKG5leHQgPT09IDYxKSB7IHJldHVybiB0aGlzLmZpbmlzaE9wKHR5cGVzJDEuYXNzaWduLCAyKSB9XG4gIHJldHVybiB0aGlzLmZpbmlzaE9wKHR5cGVzJDEucGx1c01pbiwgMSlcbn07XG5cbnBwLnJlYWRUb2tlbl9sdF9ndCA9IGZ1bmN0aW9uKGNvZGUpIHsgLy8gJzw+J1xuICB2YXIgbmV4dCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyArIDEpO1xuICB2YXIgc2l6ZSA9IDE7XG4gIGlmIChuZXh0ID09PSBjb2RlKSB7XG4gICAgc2l6ZSA9IGNvZGUgPT09IDYyICYmIHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyArIDIpID09PSA2MiA/IDMgOiAyO1xuICAgIGlmICh0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MgKyBzaXplKSA9PT0gNjEpIHsgcmV0dXJuIHRoaXMuZmluaXNoT3AodHlwZXMkMS5hc3NpZ24sIHNpemUgKyAxKSB9XG4gICAgcmV0dXJuIHRoaXMuZmluaXNoT3AodHlwZXMkMS5iaXRTaGlmdCwgc2l6ZSlcbiAgfVxuICBpZiAobmV4dCA9PT0gMzMgJiYgY29kZSA9PT0gNjAgJiYgIXRoaXMuaW5Nb2R1bGUgJiYgdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMikgPT09IDQ1ICYmXG4gICAgICB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MgKyAzKSA9PT0gNDUpIHtcbiAgICAvLyBgPCEtLWAsIGFuIFhNTC1zdHlsZSBjb21tZW50IHRoYXQgc2hvdWxkIGJlIGludGVycHJldGVkIGFzIGEgbGluZSBjb21tZW50XG4gICAgdGhpcy5za2lwTGluZUNvbW1lbnQoNCk7XG4gICAgdGhpcy5za2lwU3BhY2UoKTtcbiAgICByZXR1cm4gdGhpcy5uZXh0VG9rZW4oKVxuICB9XG4gIGlmIChuZXh0ID09PSA2MSkgeyBzaXplID0gMjsgfVxuICByZXR1cm4gdGhpcy5maW5pc2hPcCh0eXBlcyQxLnJlbGF0aW9uYWwsIHNpemUpXG59O1xuXG5wcC5yZWFkVG9rZW5fZXFfZXhjbCA9IGZ1bmN0aW9uKGNvZGUpIHsgLy8gJz0hJ1xuICB2YXIgbmV4dCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyArIDEpO1xuICBpZiAobmV4dCA9PT0gNjEpIHsgcmV0dXJuIHRoaXMuZmluaXNoT3AodHlwZXMkMS5lcXVhbGl0eSwgdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMikgPT09IDYxID8gMyA6IDIpIH1cbiAgaWYgKGNvZGUgPT09IDYxICYmIG5leHQgPT09IDYyICYmIHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2KSB7IC8vICc9PidcbiAgICB0aGlzLnBvcyArPSAyO1xuICAgIHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEuYXJyb3cpXG4gIH1cbiAgcmV0dXJuIHRoaXMuZmluaXNoT3AoY29kZSA9PT0gNjEgPyB0eXBlcyQxLmVxIDogdHlwZXMkMS5wcmVmaXgsIDEpXG59O1xuXG5wcC5yZWFkVG9rZW5fcXVlc3Rpb24gPSBmdW5jdGlvbigpIHsgLy8gJz8nXG4gIHZhciBlY21hVmVyc2lvbiA9IHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbjtcbiAgaWYgKGVjbWFWZXJzaW9uID49IDExKSB7XG4gICAgdmFyIG5leHQgPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MgKyAxKTtcbiAgICBpZiAobmV4dCA9PT0gNDYpIHtcbiAgICAgIHZhciBuZXh0MiA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyArIDIpO1xuICAgICAgaWYgKG5leHQyIDwgNDggfHwgbmV4dDIgPiA1NykgeyByZXR1cm4gdGhpcy5maW5pc2hPcCh0eXBlcyQxLnF1ZXN0aW9uRG90LCAyKSB9XG4gICAgfVxuICAgIGlmIChuZXh0ID09PSA2Mykge1xuICAgICAgaWYgKGVjbWFWZXJzaW9uID49IDEyKSB7XG4gICAgICAgIHZhciBuZXh0MiQxID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMik7XG4gICAgICAgIGlmIChuZXh0MiQxID09PSA2MSkgeyByZXR1cm4gdGhpcy5maW5pc2hPcCh0eXBlcyQxLmFzc2lnbiwgMykgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuZmluaXNoT3AodHlwZXMkMS5jb2FsZXNjZSwgMilcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXMuZmluaXNoT3AodHlwZXMkMS5xdWVzdGlvbiwgMSlcbn07XG5cbnBwLnJlYWRUb2tlbl9udW1iZXJTaWduID0gZnVuY3Rpb24oKSB7IC8vICcjJ1xuICB2YXIgZWNtYVZlcnNpb24gPSB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb247XG4gIHZhciBjb2RlID0gMzU7IC8vICcjJ1xuICBpZiAoZWNtYVZlcnNpb24gPj0gMTMpIHtcbiAgICArK3RoaXMucG9zO1xuICAgIGNvZGUgPSB0aGlzLmZ1bGxDaGFyQ29kZUF0UG9zKCk7XG4gICAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KGNvZGUsIHRydWUpIHx8IGNvZGUgPT09IDkyIC8qICdcXCcgKi8pIHtcbiAgICAgIHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEucHJpdmF0ZUlkLCB0aGlzLnJlYWRXb3JkMSgpKVxuICAgIH1cbiAgfVxuXG4gIHRoaXMucmFpc2UodGhpcy5wb3MsIFwiVW5leHBlY3RlZCBjaGFyYWN0ZXIgJ1wiICsgY29kZVBvaW50VG9TdHJpbmcoY29kZSkgKyBcIidcIik7XG59O1xuXG5wcC5nZXRUb2tlbkZyb21Db2RlID0gZnVuY3Rpb24oY29kZSkge1xuICBzd2l0Y2ggKGNvZGUpIHtcbiAgLy8gVGhlIGludGVycHJldGF0aW9uIG9mIGEgZG90IGRlcGVuZHMgb24gd2hldGhlciBpdCBpcyBmb2xsb3dlZFxuICAvLyBieSBhIGRpZ2l0IG9yIGFub3RoZXIgdHdvIGRvdHMuXG4gIGNhc2UgNDY6IC8vICcuJ1xuICAgIHJldHVybiB0aGlzLnJlYWRUb2tlbl9kb3QoKVxuXG4gIC8vIFB1bmN0dWF0aW9uIHRva2Vucy5cbiAgY2FzZSA0MDogKyt0aGlzLnBvczsgcmV0dXJuIHRoaXMuZmluaXNoVG9rZW4odHlwZXMkMS5wYXJlbkwpXG4gIGNhc2UgNDE6ICsrdGhpcy5wb3M7IHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEucGFyZW5SKVxuICBjYXNlIDU5OiArK3RoaXMucG9zOyByZXR1cm4gdGhpcy5maW5pc2hUb2tlbih0eXBlcyQxLnNlbWkpXG4gIGNhc2UgNDQ6ICsrdGhpcy5wb3M7IHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEuY29tbWEpXG4gIGNhc2UgOTE6ICsrdGhpcy5wb3M7IHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEuYnJhY2tldEwpXG4gIGNhc2UgOTM6ICsrdGhpcy5wb3M7IHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEuYnJhY2tldFIpXG4gIGNhc2UgMTIzOiArK3RoaXMucG9zOyByZXR1cm4gdGhpcy5maW5pc2hUb2tlbih0eXBlcyQxLmJyYWNlTClcbiAgY2FzZSAxMjU6ICsrdGhpcy5wb3M7IHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEuYnJhY2VSKVxuICBjYXNlIDU4OiArK3RoaXMucG9zOyByZXR1cm4gdGhpcy5maW5pc2hUb2tlbih0eXBlcyQxLmNvbG9uKVxuXG4gIGNhc2UgOTY6IC8vICdgJ1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPCA2KSB7IGJyZWFrIH1cbiAgICArK3RoaXMucG9zO1xuICAgIHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEuYmFja1F1b3RlKVxuXG4gIGNhc2UgNDg6IC8vICcwJ1xuICAgIHZhciBuZXh0ID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMSk7XG4gICAgaWYgKG5leHQgPT09IDEyMCB8fCBuZXh0ID09PSA4OCkgeyByZXR1cm4gdGhpcy5yZWFkUmFkaXhOdW1iZXIoMTYpIH0gLy8gJzB4JywgJzBYJyAtIGhleCBudW1iZXJcbiAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDYpIHtcbiAgICAgIGlmIChuZXh0ID09PSAxMTEgfHwgbmV4dCA9PT0gNzkpIHsgcmV0dXJuIHRoaXMucmVhZFJhZGl4TnVtYmVyKDgpIH0gLy8gJzBvJywgJzBPJyAtIG9jdGFsIG51bWJlclxuICAgICAgaWYgKG5leHQgPT09IDk4IHx8IG5leHQgPT09IDY2KSB7IHJldHVybiB0aGlzLnJlYWRSYWRpeE51bWJlcigyKSB9IC8vICcwYicsICcwQicgLSBiaW5hcnkgbnVtYmVyXG4gICAgfVxuXG4gIC8vIEFueXRoaW5nIGVsc2UgYmVnaW5uaW5nIHdpdGggYSBkaWdpdCBpcyBhbiBpbnRlZ2VyLCBvY3RhbFxuICAvLyBudW1iZXIsIG9yIGZsb2F0LlxuICBjYXNlIDQ5OiBjYXNlIDUwOiBjYXNlIDUxOiBjYXNlIDUyOiBjYXNlIDUzOiBjYXNlIDU0OiBjYXNlIDU1OiBjYXNlIDU2OiBjYXNlIDU3OiAvLyAxLTlcbiAgICByZXR1cm4gdGhpcy5yZWFkTnVtYmVyKGZhbHNlKVxuXG4gIC8vIFF1b3RlcyBwcm9kdWNlIHN0cmluZ3MuXG4gIGNhc2UgMzQ6IGNhc2UgMzk6IC8vICdcIicsIFwiJ1wiXG4gICAgcmV0dXJuIHRoaXMucmVhZFN0cmluZyhjb2RlKVxuXG4gIC8vIE9wZXJhdG9ycyBhcmUgcGFyc2VkIGlubGluZSBpbiB0aW55IHN0YXRlIG1hY2hpbmVzLiAnPScgKDYxKSBpc1xuICAvLyBvZnRlbiByZWZlcnJlZCB0by4gYGZpbmlzaE9wYCBzaW1wbHkgc2tpcHMgdGhlIGFtb3VudCBvZlxuICAvLyBjaGFyYWN0ZXJzIGl0IGlzIGdpdmVuIGFzIHNlY29uZCBhcmd1bWVudCwgYW5kIHJldHVybnMgYSB0b2tlblxuICAvLyBvZiB0aGUgdHlwZSBnaXZlbiBieSBpdHMgZmlyc3QgYXJndW1lbnQuXG4gIGNhc2UgNDc6IC8vICcvJ1xuICAgIHJldHVybiB0aGlzLnJlYWRUb2tlbl9zbGFzaCgpXG5cbiAgY2FzZSAzNzogY2FzZSA0MjogLy8gJyUqJ1xuICAgIHJldHVybiB0aGlzLnJlYWRUb2tlbl9tdWx0X21vZHVsb19leHAoY29kZSlcblxuICBjYXNlIDEyNDogY2FzZSAzODogLy8gJ3wmJ1xuICAgIHJldHVybiB0aGlzLnJlYWRUb2tlbl9waXBlX2FtcChjb2RlKVxuXG4gIGNhc2UgOTQ6IC8vICdeJ1xuICAgIHJldHVybiB0aGlzLnJlYWRUb2tlbl9jYXJldCgpXG5cbiAgY2FzZSA0MzogY2FzZSA0NTogLy8gJystJ1xuICAgIHJldHVybiB0aGlzLnJlYWRUb2tlbl9wbHVzX21pbihjb2RlKVxuXG4gIGNhc2UgNjA6IGNhc2UgNjI6IC8vICc8PidcbiAgICByZXR1cm4gdGhpcy5yZWFkVG9rZW5fbHRfZ3QoY29kZSlcblxuICBjYXNlIDYxOiBjYXNlIDMzOiAvLyAnPSEnXG4gICAgcmV0dXJuIHRoaXMucmVhZFRva2VuX2VxX2V4Y2woY29kZSlcblxuICBjYXNlIDYzOiAvLyAnPydcbiAgICByZXR1cm4gdGhpcy5yZWFkVG9rZW5fcXVlc3Rpb24oKVxuXG4gIGNhc2UgMTI2OiAvLyAnfidcbiAgICByZXR1cm4gdGhpcy5maW5pc2hPcCh0eXBlcyQxLnByZWZpeCwgMSlcblxuICBjYXNlIDM1OiAvLyAnIydcbiAgICByZXR1cm4gdGhpcy5yZWFkVG9rZW5fbnVtYmVyU2lnbigpXG4gIH1cblxuICB0aGlzLnJhaXNlKHRoaXMucG9zLCBcIlVuZXhwZWN0ZWQgY2hhcmFjdGVyICdcIiArIGNvZGVQb2ludFRvU3RyaW5nKGNvZGUpICsgXCInXCIpO1xufTtcblxucHAuZmluaXNoT3AgPSBmdW5jdGlvbih0eXBlLCBzaXplKSB7XG4gIHZhciBzdHIgPSB0aGlzLmlucHV0LnNsaWNlKHRoaXMucG9zLCB0aGlzLnBvcyArIHNpemUpO1xuICB0aGlzLnBvcyArPSBzaXplO1xuICByZXR1cm4gdGhpcy5maW5pc2hUb2tlbih0eXBlLCBzdHIpXG59O1xuXG5wcC5yZWFkUmVnZXhwID0gZnVuY3Rpb24oKSB7XG4gIHZhciBlc2NhcGVkLCBpbkNsYXNzLCBzdGFydCA9IHRoaXMucG9zO1xuICBmb3IgKDs7KSB7XG4gICAgaWYgKHRoaXMucG9zID49IHRoaXMuaW5wdXQubGVuZ3RoKSB7IHRoaXMucmFpc2Uoc3RhcnQsIFwiVW50ZXJtaW5hdGVkIHJlZ3VsYXIgZXhwcmVzc2lvblwiKTsgfVxuICAgIHZhciBjaCA9IHRoaXMuaW5wdXQuY2hhckF0KHRoaXMucG9zKTtcbiAgICBpZiAobGluZUJyZWFrLnRlc3QoY2gpKSB7IHRoaXMucmFpc2Uoc3RhcnQsIFwiVW50ZXJtaW5hdGVkIHJlZ3VsYXIgZXhwcmVzc2lvblwiKTsgfVxuICAgIGlmICghZXNjYXBlZCkge1xuICAgICAgaWYgKGNoID09PSBcIltcIikgeyBpbkNsYXNzID0gdHJ1ZTsgfVxuICAgICAgZWxzZSBpZiAoY2ggPT09IFwiXVwiICYmIGluQ2xhc3MpIHsgaW5DbGFzcyA9IGZhbHNlOyB9XG4gICAgICBlbHNlIGlmIChjaCA9PT0gXCIvXCIgJiYgIWluQ2xhc3MpIHsgYnJlYWsgfVxuICAgICAgZXNjYXBlZCA9IGNoID09PSBcIlxcXFxcIjtcbiAgICB9IGVsc2UgeyBlc2NhcGVkID0gZmFsc2U7IH1cbiAgICArK3RoaXMucG9zO1xuICB9XG4gIHZhciBwYXR0ZXJuID0gdGhpcy5pbnB1dC5zbGljZShzdGFydCwgdGhpcy5wb3MpO1xuICArK3RoaXMucG9zO1xuICB2YXIgZmxhZ3NTdGFydCA9IHRoaXMucG9zO1xuICB2YXIgZmxhZ3MgPSB0aGlzLnJlYWRXb3JkMSgpO1xuICBpZiAodGhpcy5jb250YWluc0VzYykgeyB0aGlzLnVuZXhwZWN0ZWQoZmxhZ3NTdGFydCk7IH1cblxuICAvLyBWYWxpZGF0ZSBwYXR0ZXJuXG4gIHZhciBzdGF0ZSA9IHRoaXMucmVnZXhwU3RhdGUgfHwgKHRoaXMucmVnZXhwU3RhdGUgPSBuZXcgUmVnRXhwVmFsaWRhdGlvblN0YXRlKHRoaXMpKTtcbiAgc3RhdGUucmVzZXQoc3RhcnQsIHBhdHRlcm4sIGZsYWdzKTtcbiAgdGhpcy52YWxpZGF0ZVJlZ0V4cEZsYWdzKHN0YXRlKTtcbiAgdGhpcy52YWxpZGF0ZVJlZ0V4cFBhdHRlcm4oc3RhdGUpO1xuXG4gIC8vIENyZWF0ZSBMaXRlcmFsI3ZhbHVlIHByb3BlcnR5IHZhbHVlLlxuICB2YXIgdmFsdWUgPSBudWxsO1xuICB0cnkge1xuICAgIHZhbHVlID0gbmV3IFJlZ0V4cChwYXR0ZXJuLCBmbGFncyk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBFU1RyZWUgcmVxdWlyZXMgbnVsbCBpZiBpdCBmYWlsZWQgdG8gaW5zdGFudGlhdGUgUmVnRXhwIG9iamVjdC5cbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vZXN0cmVlL2VzdHJlZS9ibG9iL2EyNzAwM2FkZjRmZDdiZmFkNDRkZTljZWYzNzJhMmVhY2Q1MjdiMWMvZXM1Lm1kI3JlZ2V4cGxpdGVyYWxcbiAgfVxuXG4gIHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEucmVnZXhwLCB7cGF0dGVybjogcGF0dGVybiwgZmxhZ3M6IGZsYWdzLCB2YWx1ZTogdmFsdWV9KVxufTtcblxuLy8gUmVhZCBhbiBpbnRlZ2VyIGluIHRoZSBnaXZlbiByYWRpeC4gUmV0dXJuIG51bGwgaWYgemVybyBkaWdpdHNcbi8vIHdlcmUgcmVhZCwgdGhlIGludGVnZXIgdmFsdWUgb3RoZXJ3aXNlLiBXaGVuIGBsZW5gIGlzIGdpdmVuLCB0aGlzXG4vLyB3aWxsIHJldHVybiBgbnVsbGAgdW5sZXNzIHRoZSBpbnRlZ2VyIGhhcyBleGFjdGx5IGBsZW5gIGRpZ2l0cy5cblxucHAucmVhZEludCA9IGZ1bmN0aW9uKHJhZGl4LCBsZW4sIG1heWJlTGVnYWN5T2N0YWxOdW1lcmljTGl0ZXJhbCkge1xuICAvLyBgbGVuYCBpcyB1c2VkIGZvciBjaGFyYWN0ZXIgZXNjYXBlIHNlcXVlbmNlcy4gSW4gdGhhdCBjYXNlLCBkaXNhbGxvdyBzZXBhcmF0b3JzLlxuICB2YXIgYWxsb3dTZXBhcmF0b3JzID0gdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDEyICYmIGxlbiA9PT0gdW5kZWZpbmVkO1xuXG4gIC8vIGBtYXliZUxlZ2FjeU9jdGFsTnVtZXJpY0xpdGVyYWxgIGlzIHRydWUgaWYgaXQgZG9lc24ndCBoYXZlIHByZWZpeCAoMHgsMG8sMGIpXG4gIC8vIGFuZCBpc24ndCBmcmFjdGlvbiBwYXJ0IG5vciBleHBvbmVudCBwYXJ0LiBJbiB0aGF0IGNhc2UsIGlmIHRoZSBmaXJzdCBkaWdpdFxuICAvLyBpcyB6ZXJvIHRoZW4gZGlzYWxsb3cgc2VwYXJhdG9ycy5cbiAgdmFyIGlzTGVnYWN5T2N0YWxOdW1lcmljTGl0ZXJhbCA9IG1heWJlTGVnYWN5T2N0YWxOdW1lcmljTGl0ZXJhbCAmJiB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MpID09PSA0ODtcblxuICB2YXIgc3RhcnQgPSB0aGlzLnBvcywgdG90YWwgPSAwLCBsYXN0Q29kZSA9IDA7XG4gIGZvciAodmFyIGkgPSAwLCBlID0gbGVuID09IG51bGwgPyBJbmZpbml0eSA6IGxlbjsgaSA8IGU7ICsraSwgKyt0aGlzLnBvcykge1xuICAgIHZhciBjb2RlID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zKSwgdmFsID0gKHZvaWQgMCk7XG5cbiAgICBpZiAoYWxsb3dTZXBhcmF0b3JzICYmIGNvZGUgPT09IDk1KSB7XG4gICAgICBpZiAoaXNMZWdhY3lPY3RhbE51bWVyaWNMaXRlcmFsKSB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZSh0aGlzLnBvcywgXCJOdW1lcmljIHNlcGFyYXRvciBpcyBub3QgYWxsb3dlZCBpbiBsZWdhY3kgb2N0YWwgbnVtZXJpYyBsaXRlcmFsc1wiKTsgfVxuICAgICAgaWYgKGxhc3RDb2RlID09PSA5NSkgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUodGhpcy5wb3MsIFwiTnVtZXJpYyBzZXBhcmF0b3IgbXVzdCBiZSBleGFjdGx5IG9uZSB1bmRlcnNjb3JlXCIpOyB9XG4gICAgICBpZiAoaSA9PT0gMCkgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUodGhpcy5wb3MsIFwiTnVtZXJpYyBzZXBhcmF0b3IgaXMgbm90IGFsbG93ZWQgYXQgdGhlIGZpcnN0IG9mIGRpZ2l0c1wiKTsgfVxuICAgICAgbGFzdENvZGUgPSBjb2RlO1xuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICBpZiAoY29kZSA+PSA5NykgeyB2YWwgPSBjb2RlIC0gOTcgKyAxMDsgfSAvLyBhXG4gICAgZWxzZSBpZiAoY29kZSA+PSA2NSkgeyB2YWwgPSBjb2RlIC0gNjUgKyAxMDsgfSAvLyBBXG4gICAgZWxzZSBpZiAoY29kZSA+PSA0OCAmJiBjb2RlIDw9IDU3KSB7IHZhbCA9IGNvZGUgLSA0ODsgfSAvLyAwLTlcbiAgICBlbHNlIHsgdmFsID0gSW5maW5pdHk7IH1cbiAgICBpZiAodmFsID49IHJhZGl4KSB7IGJyZWFrIH1cbiAgICBsYXN0Q29kZSA9IGNvZGU7XG4gICAgdG90YWwgPSB0b3RhbCAqIHJhZGl4ICsgdmFsO1xuICB9XG5cbiAgaWYgKGFsbG93U2VwYXJhdG9ycyAmJiBsYXN0Q29kZSA9PT0gOTUpIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKHRoaXMucG9zIC0gMSwgXCJOdW1lcmljIHNlcGFyYXRvciBpcyBub3QgYWxsb3dlZCBhdCB0aGUgbGFzdCBvZiBkaWdpdHNcIik7IH1cbiAgaWYgKHRoaXMucG9zID09PSBzdGFydCB8fCBsZW4gIT0gbnVsbCAmJiB0aGlzLnBvcyAtIHN0YXJ0ICE9PSBsZW4pIHsgcmV0dXJuIG51bGwgfVxuXG4gIHJldHVybiB0b3RhbFxufTtcblxuZnVuY3Rpb24gc3RyaW5nVG9OdW1iZXIoc3RyLCBpc0xlZ2FjeU9jdGFsTnVtZXJpY0xpdGVyYWwpIHtcbiAgaWYgKGlzTGVnYWN5T2N0YWxOdW1lcmljTGl0ZXJhbCkge1xuICAgIHJldHVybiBwYXJzZUludChzdHIsIDgpXG4gIH1cblxuICAvLyBgcGFyc2VGbG9hdCh2YWx1ZSlgIHN0b3BzIHBhcnNpbmcgYXQgdGhlIGZpcnN0IG51bWVyaWMgc2VwYXJhdG9yIHRoZW4gcmV0dXJucyBhIHdyb25nIHZhbHVlLlxuICByZXR1cm4gcGFyc2VGbG9hdChzdHIucmVwbGFjZSgvXy9nLCBcIlwiKSlcbn1cblxuZnVuY3Rpb24gc3RyaW5nVG9CaWdJbnQoc3RyKSB7XG4gIGlmICh0eXBlb2YgQmlnSW50ICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgLy8gYEJpZ0ludCh2YWx1ZSlgIHRocm93cyBzeW50YXggZXJyb3IgaWYgdGhlIHN0cmluZyBjb250YWlucyBudW1lcmljIHNlcGFyYXRvcnMuXG4gIHJldHVybiBCaWdJbnQoc3RyLnJlcGxhY2UoL18vZywgXCJcIikpXG59XG5cbnBwLnJlYWRSYWRpeE51bWJlciA9IGZ1bmN0aW9uKHJhZGl4KSB7XG4gIHZhciBzdGFydCA9IHRoaXMucG9zO1xuICB0aGlzLnBvcyArPSAyOyAvLyAweFxuICB2YXIgdmFsID0gdGhpcy5yZWFkSW50KHJhZGl4KTtcbiAgaWYgKHZhbCA9PSBudWxsKSB7IHRoaXMucmFpc2UodGhpcy5zdGFydCArIDIsIFwiRXhwZWN0ZWQgbnVtYmVyIGluIHJhZGl4IFwiICsgcmFkaXgpOyB9XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTEgJiYgdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zKSA9PT0gMTEwKSB7XG4gICAgdmFsID0gc3RyaW5nVG9CaWdJbnQodGhpcy5pbnB1dC5zbGljZShzdGFydCwgdGhpcy5wb3MpKTtcbiAgICArK3RoaXMucG9zO1xuICB9IGVsc2UgaWYgKGlzSWRlbnRpZmllclN0YXJ0KHRoaXMuZnVsbENoYXJDb2RlQXRQb3MoKSkpIHsgdGhpcy5yYWlzZSh0aGlzLnBvcywgXCJJZGVudGlmaWVyIGRpcmVjdGx5IGFmdGVyIG51bWJlclwiKTsgfVxuICByZXR1cm4gdGhpcy5maW5pc2hUb2tlbih0eXBlcyQxLm51bSwgdmFsKVxufTtcblxuLy8gUmVhZCBhbiBpbnRlZ2VyLCBvY3RhbCBpbnRlZ2VyLCBvciBmbG9hdGluZy1wb2ludCBudW1iZXIuXG5cbnBwLnJlYWROdW1iZXIgPSBmdW5jdGlvbihzdGFydHNXaXRoRG90KSB7XG4gIHZhciBzdGFydCA9IHRoaXMucG9zO1xuICBpZiAoIXN0YXJ0c1dpdGhEb3QgJiYgdGhpcy5yZWFkSW50KDEwLCB1bmRlZmluZWQsIHRydWUpID09PSBudWxsKSB7IHRoaXMucmFpc2Uoc3RhcnQsIFwiSW52YWxpZCBudW1iZXJcIik7IH1cbiAgdmFyIG9jdGFsID0gdGhpcy5wb3MgLSBzdGFydCA+PSAyICYmIHRoaXMuaW5wdXQuY2hhckNvZGVBdChzdGFydCkgPT09IDQ4O1xuICBpZiAob2N0YWwgJiYgdGhpcy5zdHJpY3QpIHsgdGhpcy5yYWlzZShzdGFydCwgXCJJbnZhbGlkIG51bWJlclwiKTsgfVxuICB2YXIgbmV4dCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyk7XG4gIGlmICghb2N0YWwgJiYgIXN0YXJ0c1dpdGhEb3QgJiYgdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDExICYmIG5leHQgPT09IDExMCkge1xuICAgIHZhciB2YWwkMSA9IHN0cmluZ1RvQmlnSW50KHRoaXMuaW5wdXQuc2xpY2Uoc3RhcnQsIHRoaXMucG9zKSk7XG4gICAgKyt0aGlzLnBvcztcbiAgICBpZiAoaXNJZGVudGlmaWVyU3RhcnQodGhpcy5mdWxsQ2hhckNvZGVBdFBvcygpKSkgeyB0aGlzLnJhaXNlKHRoaXMucG9zLCBcIklkZW50aWZpZXIgZGlyZWN0bHkgYWZ0ZXIgbnVtYmVyXCIpOyB9XG4gICAgcmV0dXJuIHRoaXMuZmluaXNoVG9rZW4odHlwZXMkMS5udW0sIHZhbCQxKVxuICB9XG4gIGlmIChvY3RhbCAmJiAvWzg5XS8udGVzdCh0aGlzLmlucHV0LnNsaWNlKHN0YXJ0LCB0aGlzLnBvcykpKSB7IG9jdGFsID0gZmFsc2U7IH1cbiAgaWYgKG5leHQgPT09IDQ2ICYmICFvY3RhbCkgeyAvLyAnLidcbiAgICArK3RoaXMucG9zO1xuICAgIHRoaXMucmVhZEludCgxMCk7XG4gICAgbmV4dCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyk7XG4gIH1cbiAgaWYgKChuZXh0ID09PSA2OSB8fCBuZXh0ID09PSAxMDEpICYmICFvY3RhbCkgeyAvLyAnZUUnXG4gICAgbmV4dCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCgrK3RoaXMucG9zKTtcbiAgICBpZiAobmV4dCA9PT0gNDMgfHwgbmV4dCA9PT0gNDUpIHsgKyt0aGlzLnBvczsgfSAvLyAnKy0nXG4gICAgaWYgKHRoaXMucmVhZEludCgxMCkgPT09IG51bGwpIHsgdGhpcy5yYWlzZShzdGFydCwgXCJJbnZhbGlkIG51bWJlclwiKTsgfVxuICB9XG4gIGlmIChpc0lkZW50aWZpZXJTdGFydCh0aGlzLmZ1bGxDaGFyQ29kZUF0UG9zKCkpKSB7IHRoaXMucmFpc2UodGhpcy5wb3MsIFwiSWRlbnRpZmllciBkaXJlY3RseSBhZnRlciBudW1iZXJcIik7IH1cblxuICB2YXIgdmFsID0gc3RyaW5nVG9OdW1iZXIodGhpcy5pbnB1dC5zbGljZShzdGFydCwgdGhpcy5wb3MpLCBvY3RhbCk7XG4gIHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEubnVtLCB2YWwpXG59O1xuXG4vLyBSZWFkIGEgc3RyaW5nIHZhbHVlLCBpbnRlcnByZXRpbmcgYmFja3NsYXNoLWVzY2FwZXMuXG5cbnBwLnJlYWRDb2RlUG9pbnQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGNoID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zKSwgY29kZTtcblxuICBpZiAoY2ggPT09IDEyMykgeyAvLyAneydcbiAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uIDwgNikgeyB0aGlzLnVuZXhwZWN0ZWQoKTsgfVxuICAgIHZhciBjb2RlUG9zID0gKyt0aGlzLnBvcztcbiAgICBjb2RlID0gdGhpcy5yZWFkSGV4Q2hhcih0aGlzLmlucHV0LmluZGV4T2YoXCJ9XCIsIHRoaXMucG9zKSAtIHRoaXMucG9zKTtcbiAgICArK3RoaXMucG9zO1xuICAgIGlmIChjb2RlID4gMHgxMEZGRkYpIHsgdGhpcy5pbnZhbGlkU3RyaW5nVG9rZW4oY29kZVBvcywgXCJDb2RlIHBvaW50IG91dCBvZiBib3VuZHNcIik7IH1cbiAgfSBlbHNlIHtcbiAgICBjb2RlID0gdGhpcy5yZWFkSGV4Q2hhcig0KTtcbiAgfVxuICByZXR1cm4gY29kZVxufTtcblxucHAucmVhZFN0cmluZyA9IGZ1bmN0aW9uKHF1b3RlKSB7XG4gIHZhciBvdXQgPSBcIlwiLCBjaHVua1N0YXJ0ID0gKyt0aGlzLnBvcztcbiAgZm9yICg7Oykge1xuICAgIGlmICh0aGlzLnBvcyA+PSB0aGlzLmlucHV0Lmxlbmd0aCkgeyB0aGlzLnJhaXNlKHRoaXMuc3RhcnQsIFwiVW50ZXJtaW5hdGVkIHN0cmluZyBjb25zdGFudFwiKTsgfVxuICAgIHZhciBjaCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyk7XG4gICAgaWYgKGNoID09PSBxdW90ZSkgeyBicmVhayB9XG4gICAgaWYgKGNoID09PSA5MikgeyAvLyAnXFwnXG4gICAgICBvdXQgKz0gdGhpcy5pbnB1dC5zbGljZShjaHVua1N0YXJ0LCB0aGlzLnBvcyk7XG4gICAgICBvdXQgKz0gdGhpcy5yZWFkRXNjYXBlZENoYXIoZmFsc2UpO1xuICAgICAgY2h1bmtTdGFydCA9IHRoaXMucG9zO1xuICAgIH0gZWxzZSBpZiAoY2ggPT09IDB4MjAyOCB8fCBjaCA9PT0gMHgyMDI5KSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uIDwgMTApIHsgdGhpcy5yYWlzZSh0aGlzLnN0YXJ0LCBcIlVudGVybWluYXRlZCBzdHJpbmcgY29uc3RhbnRcIik7IH1cbiAgICAgICsrdGhpcy5wb3M7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmxvY2F0aW9ucykge1xuICAgICAgICB0aGlzLmN1ckxpbmUrKztcbiAgICAgICAgdGhpcy5saW5lU3RhcnQgPSB0aGlzLnBvcztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGlzTmV3TGluZShjaCkpIHsgdGhpcy5yYWlzZSh0aGlzLnN0YXJ0LCBcIlVudGVybWluYXRlZCBzdHJpbmcgY29uc3RhbnRcIik7IH1cbiAgICAgICsrdGhpcy5wb3M7XG4gICAgfVxuICB9XG4gIG91dCArPSB0aGlzLmlucHV0LnNsaWNlKGNodW5rU3RhcnQsIHRoaXMucG9zKyspO1xuICByZXR1cm4gdGhpcy5maW5pc2hUb2tlbih0eXBlcyQxLnN0cmluZywgb3V0KVxufTtcblxuLy8gUmVhZHMgdGVtcGxhdGUgc3RyaW5nIHRva2Vucy5cblxudmFyIElOVkFMSURfVEVNUExBVEVfRVNDQVBFX0VSUk9SID0ge307XG5cbnBwLnRyeVJlYWRUZW1wbGF0ZVRva2VuID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuaW5UZW1wbGF0ZUVsZW1lbnQgPSB0cnVlO1xuICB0cnkge1xuICAgIHRoaXMucmVhZFRtcGxUb2tlbigpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoZXJyID09PSBJTlZBTElEX1RFTVBMQVRFX0VTQ0FQRV9FUlJPUikge1xuICAgICAgdGhpcy5yZWFkSW52YWxpZFRlbXBsYXRlVG9rZW4oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgZXJyXG4gICAgfVxuICB9XG5cbiAgdGhpcy5pblRlbXBsYXRlRWxlbWVudCA9IGZhbHNlO1xufTtcblxucHAuaW52YWxpZFN0cmluZ1Rva2VuID0gZnVuY3Rpb24ocG9zaXRpb24sIG1lc3NhZ2UpIHtcbiAgaWYgKHRoaXMuaW5UZW1wbGF0ZUVsZW1lbnQgJiYgdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDkpIHtcbiAgICB0aHJvdyBJTlZBTElEX1RFTVBMQVRFX0VTQ0FQRV9FUlJPUlxuICB9IGVsc2Uge1xuICAgIHRoaXMucmFpc2UocG9zaXRpb24sIG1lc3NhZ2UpO1xuICB9XG59O1xuXG5wcC5yZWFkVG1wbFRva2VuID0gZnVuY3Rpb24oKSB7XG4gIHZhciBvdXQgPSBcIlwiLCBjaHVua1N0YXJ0ID0gdGhpcy5wb3M7XG4gIGZvciAoOzspIHtcbiAgICBpZiAodGhpcy5wb3MgPj0gdGhpcy5pbnB1dC5sZW5ndGgpIHsgdGhpcy5yYWlzZSh0aGlzLnN0YXJ0LCBcIlVudGVybWluYXRlZCB0ZW1wbGF0ZVwiKTsgfVxuICAgIHZhciBjaCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyk7XG4gICAgaWYgKGNoID09PSA5NiB8fCBjaCA9PT0gMzYgJiYgdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMSkgPT09IDEyMykgeyAvLyAnYCcsICckeydcbiAgICAgIGlmICh0aGlzLnBvcyA9PT0gdGhpcy5zdGFydCAmJiAodGhpcy50eXBlID09PSB0eXBlcyQxLnRlbXBsYXRlIHx8IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5pbnZhbGlkVGVtcGxhdGUpKSB7XG4gICAgICAgIGlmIChjaCA9PT0gMzYpIHtcbiAgICAgICAgICB0aGlzLnBvcyArPSAyO1xuICAgICAgICAgIHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEuZG9sbGFyQnJhY2VMKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICsrdGhpcy5wb3M7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuZmluaXNoVG9rZW4odHlwZXMkMS5iYWNrUXVvdGUpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIG91dCArPSB0aGlzLmlucHV0LnNsaWNlKGNodW5rU3RhcnQsIHRoaXMucG9zKTtcbiAgICAgIHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEudGVtcGxhdGUsIG91dClcbiAgICB9XG4gICAgaWYgKGNoID09PSA5MikgeyAvLyAnXFwnXG4gICAgICBvdXQgKz0gdGhpcy5pbnB1dC5zbGljZShjaHVua1N0YXJ0LCB0aGlzLnBvcyk7XG4gICAgICBvdXQgKz0gdGhpcy5yZWFkRXNjYXBlZENoYXIodHJ1ZSk7XG4gICAgICBjaHVua1N0YXJ0ID0gdGhpcy5wb3M7XG4gICAgfSBlbHNlIGlmIChpc05ld0xpbmUoY2gpKSB7XG4gICAgICBvdXQgKz0gdGhpcy5pbnB1dC5zbGljZShjaHVua1N0YXJ0LCB0aGlzLnBvcyk7XG4gICAgICArK3RoaXMucG9zO1xuICAgICAgc3dpdGNoIChjaCkge1xuICAgICAgY2FzZSAxMzpcbiAgICAgICAgaWYgKHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcykgPT09IDEwKSB7ICsrdGhpcy5wb3M7IH1cbiAgICAgIGNhc2UgMTA6XG4gICAgICAgIG91dCArPSBcIlxcblwiO1xuICAgICAgICBicmVha1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgb3V0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoY2gpO1xuICAgICAgICBicmVha1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5sb2NhdGlvbnMpIHtcbiAgICAgICAgKyt0aGlzLmN1ckxpbmU7XG4gICAgICAgIHRoaXMubGluZVN0YXJ0ID0gdGhpcy5wb3M7XG4gICAgICB9XG4gICAgICBjaHVua1N0YXJ0ID0gdGhpcy5wb3M7XG4gICAgfSBlbHNlIHtcbiAgICAgICsrdGhpcy5wb3M7XG4gICAgfVxuICB9XG59O1xuXG4vLyBSZWFkcyBhIHRlbXBsYXRlIHRva2VuIHRvIHNlYXJjaCBmb3IgdGhlIGVuZCwgd2l0aG91dCB2YWxpZGF0aW5nIGFueSBlc2NhcGUgc2VxdWVuY2VzXG5wcC5yZWFkSW52YWxpZFRlbXBsYXRlVG9rZW4gPSBmdW5jdGlvbigpIHtcbiAgZm9yICg7IHRoaXMucG9zIDwgdGhpcy5pbnB1dC5sZW5ndGg7IHRoaXMucG9zKyspIHtcbiAgICBzd2l0Y2ggKHRoaXMuaW5wdXRbdGhpcy5wb3NdKSB7XG4gICAgY2FzZSBcIlxcXFxcIjpcbiAgICAgICsrdGhpcy5wb3M7XG4gICAgICBicmVha1xuXG4gICAgY2FzZSBcIiRcIjpcbiAgICAgIGlmICh0aGlzLmlucHV0W3RoaXMucG9zICsgMV0gIT09IFwie1wiKSB7IGJyZWFrIH1cbiAgICAgIC8vIGZhbGwgdGhyb3VnaFxuICAgIGNhc2UgXCJgXCI6XG4gICAgICByZXR1cm4gdGhpcy5maW5pc2hUb2tlbih0eXBlcyQxLmludmFsaWRUZW1wbGF0ZSwgdGhpcy5pbnB1dC5zbGljZSh0aGlzLnN0YXJ0LCB0aGlzLnBvcykpXG5cbiAgICBjYXNlIFwiXFxyXCI6XG4gICAgICBpZiAodGhpcy5pbnB1dFt0aGlzLnBvcyArIDFdID09PSBcIlxcblwiKSB7ICsrdGhpcy5wb3M7IH1cbiAgICAgIC8vIGZhbGwgdGhyb3VnaFxuICAgIGNhc2UgXCJcXG5cIjogY2FzZSBcIlxcdTIwMjhcIjogY2FzZSBcIlxcdTIwMjlcIjpcbiAgICAgICsrdGhpcy5jdXJMaW5lO1xuICAgICAgdGhpcy5saW5lU3RhcnQgPSB0aGlzLnBvcyArIDE7XG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuICB0aGlzLnJhaXNlKHRoaXMuc3RhcnQsIFwiVW50ZXJtaW5hdGVkIHRlbXBsYXRlXCIpO1xufTtcblxuLy8gVXNlZCB0byByZWFkIGVzY2FwZWQgY2hhcmFjdGVyc1xuXG5wcC5yZWFkRXNjYXBlZENoYXIgPSBmdW5jdGlvbihpblRlbXBsYXRlKSB7XG4gIHZhciBjaCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCgrK3RoaXMucG9zKTtcbiAgKyt0aGlzLnBvcztcbiAgc3dpdGNoIChjaCkge1xuICBjYXNlIDExMDogcmV0dXJuIFwiXFxuXCIgLy8gJ24nIC0+ICdcXG4nXG4gIGNhc2UgMTE0OiByZXR1cm4gXCJcXHJcIiAvLyAncicgLT4gJ1xccidcbiAgY2FzZSAxMjA6IHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKHRoaXMucmVhZEhleENoYXIoMikpIC8vICd4J1xuICBjYXNlIDExNzogcmV0dXJuIGNvZGVQb2ludFRvU3RyaW5nKHRoaXMucmVhZENvZGVQb2ludCgpKSAvLyAndSdcbiAgY2FzZSAxMTY6IHJldHVybiBcIlxcdFwiIC8vICd0JyAtPiAnXFx0J1xuICBjYXNlIDk4OiByZXR1cm4gXCJcXGJcIiAvLyAnYicgLT4gJ1xcYidcbiAgY2FzZSAxMTg6IHJldHVybiBcIlxcdTAwMGJcIiAvLyAndicgLT4gJ1xcdTAwMGInXG4gIGNhc2UgMTAyOiByZXR1cm4gXCJcXGZcIiAvLyAnZicgLT4gJ1xcZidcbiAgY2FzZSAxMzogaWYgKHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcykgPT09IDEwKSB7ICsrdGhpcy5wb3M7IH0gLy8gJ1xcclxcbidcbiAgY2FzZSAxMDogLy8gJyBcXG4nXG4gICAgaWYgKHRoaXMub3B0aW9ucy5sb2NhdGlvbnMpIHsgdGhpcy5saW5lU3RhcnQgPSB0aGlzLnBvczsgKyt0aGlzLmN1ckxpbmU7IH1cbiAgICByZXR1cm4gXCJcIlxuICBjYXNlIDU2OlxuICBjYXNlIDU3OlxuICAgIGlmICh0aGlzLnN0cmljdCkge1xuICAgICAgdGhpcy5pbnZhbGlkU3RyaW5nVG9rZW4oXG4gICAgICAgIHRoaXMucG9zIC0gMSxcbiAgICAgICAgXCJJbnZhbGlkIGVzY2FwZSBzZXF1ZW5jZVwiXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoaW5UZW1wbGF0ZSkge1xuICAgICAgdmFyIGNvZGVQb3MgPSB0aGlzLnBvcyAtIDE7XG5cbiAgICAgIHRoaXMuaW52YWxpZFN0cmluZ1Rva2VuKFxuICAgICAgICBjb2RlUG9zLFxuICAgICAgICBcIkludmFsaWQgZXNjYXBlIHNlcXVlbmNlIGluIHRlbXBsYXRlIHN0cmluZ1wiXG4gICAgICApO1xuICAgIH1cbiAgZGVmYXVsdDpcbiAgICBpZiAoY2ggPj0gNDggJiYgY2ggPD0gNTUpIHtcbiAgICAgIHZhciBvY3RhbFN0ciA9IHRoaXMuaW5wdXQuc3Vic3RyKHRoaXMucG9zIC0gMSwgMykubWF0Y2goL15bMC03XSsvKVswXTtcbiAgICAgIHZhciBvY3RhbCA9IHBhcnNlSW50KG9jdGFsU3RyLCA4KTtcbiAgICAgIGlmIChvY3RhbCA+IDI1NSkge1xuICAgICAgICBvY3RhbFN0ciA9IG9jdGFsU3RyLnNsaWNlKDAsIC0xKTtcbiAgICAgICAgb2N0YWwgPSBwYXJzZUludChvY3RhbFN0ciwgOCk7XG4gICAgICB9XG4gICAgICB0aGlzLnBvcyArPSBvY3RhbFN0ci5sZW5ndGggLSAxO1xuICAgICAgY2ggPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MpO1xuICAgICAgaWYgKChvY3RhbFN0ciAhPT0gXCIwXCIgfHwgY2ggPT09IDU2IHx8IGNoID09PSA1NykgJiYgKHRoaXMuc3RyaWN0IHx8IGluVGVtcGxhdGUpKSB7XG4gICAgICAgIHRoaXMuaW52YWxpZFN0cmluZ1Rva2VuKFxuICAgICAgICAgIHRoaXMucG9zIC0gMSAtIG9jdGFsU3RyLmxlbmd0aCxcbiAgICAgICAgICBpblRlbXBsYXRlXG4gICAgICAgICAgICA/IFwiT2N0YWwgbGl0ZXJhbCBpbiB0ZW1wbGF0ZSBzdHJpbmdcIlxuICAgICAgICAgICAgOiBcIk9jdGFsIGxpdGVyYWwgaW4gc3RyaWN0IG1vZGVcIlxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUob2N0YWwpXG4gICAgfVxuICAgIGlmIChpc05ld0xpbmUoY2gpKSB7XG4gICAgICAvLyBVbmljb2RlIG5ldyBsaW5lIGNoYXJhY3RlcnMgYWZ0ZXIgXFwgZ2V0IHJlbW92ZWQgZnJvbSBvdXRwdXQgaW4gYm90aFxuICAgICAgLy8gdGVtcGxhdGUgbGl0ZXJhbHMgYW5kIHN0cmluZ3NcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMubG9jYXRpb25zKSB7IHRoaXMubGluZVN0YXJ0ID0gdGhpcy5wb3M7ICsrdGhpcy5jdXJMaW5lOyB9XG4gICAgICByZXR1cm4gXCJcIlxuICAgIH1cbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShjaClcbiAgfVxufTtcblxuLy8gVXNlZCB0byByZWFkIGNoYXJhY3RlciBlc2NhcGUgc2VxdWVuY2VzICgnXFx4JywgJ1xcdScsICdcXFUnKS5cblxucHAucmVhZEhleENoYXIgPSBmdW5jdGlvbihsZW4pIHtcbiAgdmFyIGNvZGVQb3MgPSB0aGlzLnBvcztcbiAgdmFyIG4gPSB0aGlzLnJlYWRJbnQoMTYsIGxlbik7XG4gIGlmIChuID09PSBudWxsKSB7IHRoaXMuaW52YWxpZFN0cmluZ1Rva2VuKGNvZGVQb3MsIFwiQmFkIGNoYXJhY3RlciBlc2NhcGUgc2VxdWVuY2VcIik7IH1cbiAgcmV0dXJuIG5cbn07XG5cbi8vIFJlYWQgYW4gaWRlbnRpZmllciwgYW5kIHJldHVybiBpdCBhcyBhIHN0cmluZy4gU2V0cyBgdGhpcy5jb250YWluc0VzY2Bcbi8vIHRvIHdoZXRoZXIgdGhlIHdvcmQgY29udGFpbmVkIGEgJ1xcdScgZXNjYXBlLlxuLy9cbi8vIEluY3JlbWVudGFsbHkgYWRkcyBvbmx5IGVzY2FwZWQgY2hhcnMsIGFkZGluZyBvdGhlciBjaHVua3MgYXMtaXNcbi8vIGFzIGEgbWljcm8tb3B0aW1pemF0aW9uLlxuXG5wcC5yZWFkV29yZDEgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5jb250YWluc0VzYyA9IGZhbHNlO1xuICB2YXIgd29yZCA9IFwiXCIsIGZpcnN0ID0gdHJ1ZSwgY2h1bmtTdGFydCA9IHRoaXMucG9zO1xuICB2YXIgYXN0cmFsID0gdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDY7XG4gIHdoaWxlICh0aGlzLnBvcyA8IHRoaXMuaW5wdXQubGVuZ3RoKSB7XG4gICAgdmFyIGNoID0gdGhpcy5mdWxsQ2hhckNvZGVBdFBvcygpO1xuICAgIGlmIChpc0lkZW50aWZpZXJDaGFyKGNoLCBhc3RyYWwpKSB7XG4gICAgICB0aGlzLnBvcyArPSBjaCA8PSAweGZmZmYgPyAxIDogMjtcbiAgICB9IGVsc2UgaWYgKGNoID09PSA5MikgeyAvLyBcIlxcXCJcbiAgICAgIHRoaXMuY29udGFpbnNFc2MgPSB0cnVlO1xuICAgICAgd29yZCArPSB0aGlzLmlucHV0LnNsaWNlKGNodW5rU3RhcnQsIHRoaXMucG9zKTtcbiAgICAgIHZhciBlc2NTdGFydCA9IHRoaXMucG9zO1xuICAgICAgaWYgKHRoaXMuaW5wdXQuY2hhckNvZGVBdCgrK3RoaXMucG9zKSAhPT0gMTE3KSAvLyBcInVcIlxuICAgICAgICB7IHRoaXMuaW52YWxpZFN0cmluZ1Rva2VuKHRoaXMucG9zLCBcIkV4cGVjdGluZyBVbmljb2RlIGVzY2FwZSBzZXF1ZW5jZSBcXFxcdVhYWFhcIik7IH1cbiAgICAgICsrdGhpcy5wb3M7XG4gICAgICB2YXIgZXNjID0gdGhpcy5yZWFkQ29kZVBvaW50KCk7XG4gICAgICBpZiAoIShmaXJzdCA/IGlzSWRlbnRpZmllclN0YXJ0IDogaXNJZGVudGlmaWVyQ2hhcikoZXNjLCBhc3RyYWwpKVxuICAgICAgICB7IHRoaXMuaW52YWxpZFN0cmluZ1Rva2VuKGVzY1N0YXJ0LCBcIkludmFsaWQgVW5pY29kZSBlc2NhcGVcIik7IH1cbiAgICAgIHdvcmQgKz0gY29kZVBvaW50VG9TdHJpbmcoZXNjKTtcbiAgICAgIGNodW5rU3RhcnQgPSB0aGlzLnBvcztcbiAgICB9IGVsc2Uge1xuICAgICAgYnJlYWtcbiAgICB9XG4gICAgZmlyc3QgPSBmYWxzZTtcbiAgfVxuICByZXR1cm4gd29yZCArIHRoaXMuaW5wdXQuc2xpY2UoY2h1bmtTdGFydCwgdGhpcy5wb3MpXG59O1xuXG4vLyBSZWFkIGFuIGlkZW50aWZpZXIgb3Iga2V5d29yZCB0b2tlbi4gV2lsbCBjaGVjayBmb3IgcmVzZXJ2ZWRcbi8vIHdvcmRzIHdoZW4gbmVjZXNzYXJ5LlxuXG5wcC5yZWFkV29yZCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgd29yZCA9IHRoaXMucmVhZFdvcmQxKCk7XG4gIHZhciB0eXBlID0gdHlwZXMkMS5uYW1lO1xuICBpZiAodGhpcy5rZXl3b3Jkcy50ZXN0KHdvcmQpKSB7XG4gICAgdHlwZSA9IGtleXdvcmRzW3dvcmRdO1xuICB9XG4gIHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGUsIHdvcmQpXG59O1xuXG4vLyBBY29ybiBpcyBhIHRpbnksIGZhc3QgSmF2YVNjcmlwdCBwYXJzZXIgd3JpdHRlbiBpbiBKYXZhU2NyaXB0LlxuLy9cbi8vIEFjb3JuIHdhcyB3cml0dGVuIGJ5IE1hcmlqbiBIYXZlcmJla2UsIEluZ3ZhciBTdGVwYW55YW4sIGFuZFxuLy8gdmFyaW91cyBjb250cmlidXRvcnMgYW5kIHJlbGVhc2VkIHVuZGVyIGFuIE1JVCBsaWNlbnNlLlxuLy9cbi8vIEdpdCByZXBvc2l0b3JpZXMgZm9yIEFjb3JuIGFyZSBhdmFpbGFibGUgYXRcbi8vXG4vLyAgICAgaHR0cDovL21hcmlqbmhhdmVyYmVrZS5ubC9naXQvYWNvcm5cbi8vICAgICBodHRwczovL2dpdGh1Yi5jb20vYWNvcm5qcy9hY29ybi5naXRcbi8vXG4vLyBQbGVhc2UgdXNlIHRoZSBbZ2l0aHViIGJ1ZyB0cmFja2VyXVtnaGJ0XSB0byByZXBvcnQgaXNzdWVzLlxuLy9cbi8vIFtnaGJ0XTogaHR0cHM6Ly9naXRodWIuY29tL2Fjb3JuanMvYWNvcm4vaXNzdWVzXG5cblxudmFyIHZlcnNpb24gPSBcIjguMTUuMFwiO1xuXG5QYXJzZXIuYWNvcm4gPSB7XG4gIFBhcnNlcjogUGFyc2VyLFxuICB2ZXJzaW9uOiB2ZXJzaW9uLFxuICBkZWZhdWx0T3B0aW9uczogZGVmYXVsdE9wdGlvbnMsXG4gIFBvc2l0aW9uOiBQb3NpdGlvbixcbiAgU291cmNlTG9jYXRpb246IFNvdXJjZUxvY2F0aW9uLFxuICBnZXRMaW5lSW5mbzogZ2V0TGluZUluZm8sXG4gIE5vZGU6IE5vZGUsXG4gIFRva2VuVHlwZTogVG9rZW5UeXBlLFxuICB0b2tUeXBlczogdHlwZXMkMSxcbiAga2V5d29yZFR5cGVzOiBrZXl3b3JkcyxcbiAgVG9rQ29udGV4dDogVG9rQ29udGV4dCxcbiAgdG9rQ29udGV4dHM6IHR5cGVzLFxuICBpc0lkZW50aWZpZXJDaGFyOiBpc0lkZW50aWZpZXJDaGFyLFxuICBpc0lkZW50aWZpZXJTdGFydDogaXNJZGVudGlmaWVyU3RhcnQsXG4gIFRva2VuOiBUb2tlbixcbiAgaXNOZXdMaW5lOiBpc05ld0xpbmUsXG4gIGxpbmVCcmVhazogbGluZUJyZWFrLFxuICBsaW5lQnJlYWtHOiBsaW5lQnJlYWtHLFxuICBub25BU0NJSXdoaXRlc3BhY2U6IG5vbkFTQ0lJd2hpdGVzcGFjZVxufTtcblxuLy8gVGhlIG1haW4gZXhwb3J0ZWQgaW50ZXJmYWNlICh1bmRlciBgc2VsZi5hY29ybmAgd2hlbiBpbiB0aGVcbi8vIGJyb3dzZXIpIGlzIGEgYHBhcnNlYCBmdW5jdGlvbiB0aGF0IHRha2VzIGEgY29kZSBzdHJpbmcgYW5kIHJldHVybnNcbi8vIGFuIGFic3RyYWN0IHN5bnRheCB0cmVlIGFzIHNwZWNpZmllZCBieSB0aGUgW0VTVHJlZSBzcGVjXVtlc3RyZWVdLlxuLy9cbi8vIFtlc3RyZWVdOiBodHRwczovL2dpdGh1Yi5jb20vZXN0cmVlL2VzdHJlZVxuXG5mdW5jdGlvbiBwYXJzZShpbnB1dCwgb3B0aW9ucykge1xuICByZXR1cm4gUGFyc2VyLnBhcnNlKGlucHV0LCBvcHRpb25zKVxufVxuXG4vLyBUaGlzIGZ1bmN0aW9uIHRyaWVzIHRvIHBhcnNlIGEgc2luZ2xlIGV4cHJlc3Npb24gYXQgYSBnaXZlblxuLy8gb2Zmc2V0IGluIGEgc3RyaW5nLiBVc2VmdWwgZm9yIHBhcnNpbmcgbWl4ZWQtbGFuZ3VhZ2UgZm9ybWF0c1xuLy8gdGhhdCBlbWJlZCBKYXZhU2NyaXB0IGV4cHJlc3Npb25zLlxuXG5mdW5jdGlvbiBwYXJzZUV4cHJlc3Npb25BdChpbnB1dCwgcG9zLCBvcHRpb25zKSB7XG4gIHJldHVybiBQYXJzZXIucGFyc2VFeHByZXNzaW9uQXQoaW5wdXQsIHBvcywgb3B0aW9ucylcbn1cblxuLy8gQWNvcm4gaXMgb3JnYW5pemVkIGFzIGEgdG9rZW5pemVyIGFuZCBhIHJlY3Vyc2l2ZS1kZXNjZW50IHBhcnNlci5cbi8vIFRoZSBgdG9rZW5pemVyYCBleHBvcnQgcHJvdmlkZXMgYW4gaW50ZXJmYWNlIHRvIHRoZSB0b2tlbml6ZXIuXG5cbmZ1bmN0aW9uIHRva2VuaXplcihpbnB1dCwgb3B0aW9ucykge1xuICByZXR1cm4gUGFyc2VyLnRva2VuaXplcihpbnB1dCwgb3B0aW9ucylcbn1cblxuZXhwb3J0IHsgTm9kZSwgUGFyc2VyLCBQb3NpdGlvbiwgU291cmNlTG9jYXRpb24sIFRva0NvbnRleHQsIFRva2VuLCBUb2tlblR5cGUsIGRlZmF1bHRPcHRpb25zLCBnZXRMaW5lSW5mbywgaXNJZGVudGlmaWVyQ2hhciwgaXNJZGVudGlmaWVyU3RhcnQsIGlzTmV3TGluZSwga2V5d29yZHMgYXMga2V5d29yZFR5cGVzLCBsaW5lQnJlYWssIGxpbmVCcmVha0csIG5vbkFTQ0lJd2hpdGVzcGFjZSwgcGFyc2UsIHBhcnNlRXhwcmVzc2lvbkF0LCB0eXBlcyBhcyB0b2tDb250ZXh0cywgdHlwZXMkMSBhcyB0b2tUeXBlcywgdG9rZW5pemVyLCB2ZXJzaW9uIH07XG4iLCAiaW1wb3J0IHsgcGFyc2UgYXMgYWNvcm5QYXJzZSB9IGZyb20gXCJhY29yblwiO1xuXG5cbi8qKiBMb29zZSBBU1Qgbm9kZSB0eXBlIFx1MjAxNCBhY29ybiBub2RlcyB3aXRoIGB0eXBlYCwgYHN0YXJ0YCwgYGVuZGAgKyBhcmJpdHJhcnkgZmllbGRzLiAqL1xuZXhwb3J0IHR5cGUgQXN0Tm9kZSA9IHsgdHlwZTogc3RyaW5nOyBzdGFydDogbnVtYmVyOyBlbmQ6IG51bWJlcjsgW2s6IHN0cmluZ106IGFueSB9O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFNjb3BlIHZhbGlkYXRpb25cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5leHBvcnQgY29uc3QgdmFsaWRhdGVTY29wZXMgPSAocHJvZ3JhbTogQXN0Tm9kZSwgYWxsb3dlZEdsb2JhbHM6IHN0cmluZ1tdID0gW10pID0+IHtcbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBnbG9iYWxzID0gbmV3IFNldChhbGxvd2VkR2xvYmFscyk7XG4gIGNvbnN0IHNjb3BlczogQXJyYXk8U2V0PHN0cmluZz4+ID0gW25ldyBTZXQoKV07XG5cbiAgY29uc3QgZGVjbGFyZSA9IChuYW1lOiBzdHJpbmcpID0+IHNjb3Blc1tzY29wZXMubGVuZ3RoIC0gMV0uYWRkKG5hbWUpO1xuICBjb25zdCBpc0RlY2xhcmVkID0gKG5hbWU6IHN0cmluZykgPT4gc2NvcGVzLnNvbWUoKHMpID0+IHMuaGFzKG5hbWUpKSB8fCBnbG9iYWxzLmhhcyhuYW1lKTtcbiAgY29uc3QgZW50ZXIgPSAoKSA9PiBzY29wZXMucHVzaChuZXcgU2V0KCkpO1xuICBjb25zdCBleGl0ID0gKCkgPT4geyBzY29wZXMucG9wKCk7IH07XG4gIGNvbnN0IGNoZWNrSWRlbnQgPSAobmFtZTogc3RyaW5nKSA9PiB7XG4gICAgaWYgKCFpc0RlY2xhcmVkKG5hbWUpKSBlcnJvcnMucHVzaChgdW5kZWNsYXJlZDogJHtuYW1lfWApO1xuICB9O1xuXG4gIGNvbnN0IGRlY2xhcmVQYXR0ZXJuID0gKHA6IEFzdE5vZGUpID0+IHtcbiAgICBpZiAocC50eXBlID09PSBcIklkZW50aWZpZXJcIikgZGVjbGFyZShwLm5hbWUpO1xuICAgIGVsc2UgaWYgKHAudHlwZSA9PT0gXCJBc3NpZ25tZW50UGF0dGVyblwiKSBkZWNsYXJlUGF0dGVybihwLmxlZnQpO1xuICAgIGVsc2UgaWYgKHAudHlwZSA9PT0gXCJSZXN0RWxlbWVudFwiKSBkZWNsYXJlUGF0dGVybihwLmFyZ3VtZW50KTtcbiAgICBlbHNlIGlmIChwLnR5cGUgPT09IFwiQXJyYXlQYXR0ZXJuXCIpIChwLmVsZW1lbnRzIGFzIEFzdE5vZGVbXSkuZm9yRWFjaChkZWNsYXJlUGF0dGVybik7XG4gICAgZWxzZSBpZiAocC50eXBlID09PSBcIk9iamVjdFBhdHRlcm5cIikgKHAucHJvcGVydGllcyBhcyBBc3ROb2RlW10pLmZvckVhY2goKHByb3ApID0+IHtcbiAgICAgIGlmIChwcm9wLnR5cGUgPT09IFwiUmVzdEVsZW1lbnRcIikgZGVjbGFyZVBhdHRlcm4ocHJvcC5hcmd1bWVudCk7XG4gICAgICBlbHNlIGRlY2xhcmVQYXR0ZXJuKHByb3AudmFsdWUpO1xuICAgIH0pO1xuICB9O1xuXG4gIGNvbnN0IHZpc2l0RXhwciA9IChlOiBBc3ROb2RlKTogdm9pZCA9PiB7XG4gICAgaWYgKCFlKSByZXR1cm47XG4gICAgc3dpdGNoIChlLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJJZGVudGlmaWVyXCI6XG4gICAgICAgIGNoZWNrSWRlbnQoZS5uYW1lKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkxpdGVyYWxcIjpcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlNwcmVhZEVsZW1lbnRcIjpcbiAgICAgICAgdmlzaXRFeHByKGUuYXJndW1lbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQXJyYXlFeHByZXNzaW9uXCI6XG4gICAgICAgIChlLmVsZW1lbnRzIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgoZWwpID0+IGVsICYmIHZpc2l0RXhwcihlbCkpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiT2JqZWN0RXhwcmVzc2lvblwiOlxuICAgICAgICAoZS5wcm9wZXJ0aWVzIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgocCkgPT4ge1xuICAgICAgICAgIGlmIChwLnR5cGUgPT09IFwiU3ByZWFkRWxlbWVudFwiKSB2aXNpdEV4cHIocC5hcmd1bWVudCk7XG4gICAgICAgICAgZWxzZSB2aXNpdEV4cHIocC52YWx1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQXdhaXRFeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLmFyZ3VtZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkNoYWluRXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5leHByZXNzaW9uKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIk5ld0V4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUuY2FsbGVlKTtcbiAgICAgICAgKGUuYXJndW1lbnRzIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgoYSkgPT4gdmlzaXRFeHByKGEpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkNhbGxFeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLmNhbGxlZSk7XG4gICAgICAgIChlLmFyZ3VtZW50cyBhcyBBc3ROb2RlW10pLmZvckVhY2goKGEpID0+IHZpc2l0RXhwcihhKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLm9iamVjdCk7XG4gICAgICAgIGlmIChlLmNvbXB1dGVkKSB2aXNpdEV4cHIoZS5wcm9wZXJ0eSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJBc3NpZ25tZW50RXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5sZWZ0KTtcbiAgICAgICAgdmlzaXRFeHByKGUucmlnaHQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiVXBkYXRlRXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5hcmd1bWVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJCaW5hcnlFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiTG9naWNhbEV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUubGVmdCk7XG4gICAgICAgIHZpc2l0RXhwcihlLnJpZ2h0KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlVuYXJ5RXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5hcmd1bWVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJDb25kaXRpb25hbEV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUudGVzdCk7XG4gICAgICAgIHZpc2l0RXhwcihlLmNvbnNlcXVlbnQpO1xuICAgICAgICB2aXNpdEV4cHIoZS5hbHRlcm5hdGUpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQXJyb3dGdW5jdGlvbkV4cHJlc3Npb25cIjpcbiAgICAgICAgZW50ZXIoKTtcbiAgICAgICAgKGUucGFyYW1zIGFzIEFzdE5vZGVbXSkuZm9yRWFjaChkZWNsYXJlUGF0dGVybik7XG4gICAgICAgIGlmIChlLmJvZHkudHlwZSA9PT0gXCJCbG9ja1N0YXRlbWVudFwiKSB2aXNpdFN0bXQoZS5ib2R5KTtcbiAgICAgICAgZWxzZSB2aXNpdEV4cHIoZS5ib2R5KTtcbiAgICAgICAgZXhpdCgpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHZpc2l0VmFyRGVjbCA9IChkOiBBc3ROb2RlKSA9PiB7XG4gICAgZGVjbGFyZVBhdHRlcm4oZC5pZCk7XG4gICAgaWYgKGQuaW5pdCkgdmlzaXRFeHByKGQuaW5pdCk7XG4gIH07XG5cbiAgY29uc3QgdmlzaXRTdG10ID0gKHM6IEFzdE5vZGUpOiB2b2lkID0+IHtcbiAgICBzd2l0Y2ggKHMudHlwZSkge1xuICAgICAgY2FzZSBcIkJsb2NrU3RhdGVtZW50XCI6XG4gICAgICAgIGVudGVyKCk7XG4gICAgICAgIChzLmJvZHkgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKHZpc2l0U3RtdCk7XG4gICAgICAgIGV4aXQoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkV4cHJlc3Npb25TdGF0ZW1lbnRcIjpcbiAgICAgICAgdmlzaXRFeHByKHMuZXhwcmVzc2lvbik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJJZlN0YXRlbWVudFwiOlxuICAgICAgICB2aXNpdEV4cHIocy50ZXN0KTtcbiAgICAgICAgdmlzaXRTdG10KHMuY29uc2VxdWVudCk7XG4gICAgICAgIGlmIChzLmFsdGVybmF0ZSkgdmlzaXRTdG10KHMuYWx0ZXJuYXRlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlJldHVyblN0YXRlbWVudFwiOlxuICAgICAgICBpZiAocy5hcmd1bWVudCkgdmlzaXRFeHByKHMuYXJndW1lbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiVGhyb3dTdGF0ZW1lbnRcIjpcbiAgICAgICAgaWYgKHMuYXJndW1lbnQpIHZpc2l0RXhwcihzLmFyZ3VtZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIjpcbiAgICAgICAgKHMuZGVjbGFyYXRpb25zIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCh2aXNpdFZhckRlY2wpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiV2hpbGVTdGF0ZW1lbnRcIjpcbiAgICAgICAgdmlzaXRFeHByKHMudGVzdCk7XG4gICAgICAgIHZpc2l0U3RtdChzLmJvZHkpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiRm9yU3RhdGVtZW50XCI6IHtcbiAgICAgICAgZW50ZXIoKTtcbiAgICAgICAgaWYgKHMuaW5pdD8udHlwZSA9PT0gXCJWYXJpYWJsZURlY2xhcmF0aW9uXCIpIChzLmluaXQuZGVjbGFyYXRpb25zIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCh2aXNpdFZhckRlY2wpO1xuICAgICAgICBlbHNlIGlmIChzLmluaXQpIHZpc2l0RXhwcihzLmluaXQpO1xuICAgICAgICBpZiAocy50ZXN0KSB2aXNpdEV4cHIocy50ZXN0KTtcbiAgICAgICAgaWYgKHMudXBkYXRlKSB2aXNpdEV4cHIocy51cGRhdGUpO1xuICAgICAgICB2aXNpdFN0bXQocy5ib2R5KTtcbiAgICAgICAgZXhpdCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjYXNlIFwiRm9ySW5TdGF0ZW1lbnRcIjpcbiAgICAgIGNhc2UgXCJGb3JPZlN0YXRlbWVudFwiOiB7XG4gICAgICAgIGVudGVyKCk7XG4gICAgICAgIGlmIChzLmxlZnQudHlwZSA9PT0gXCJWYXJpYWJsZURlY2xhcmF0aW9uXCIpIChzLmxlZnQuZGVjbGFyYXRpb25zIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCh2aXNpdFZhckRlY2wpO1xuICAgICAgICBlbHNlIHZpc2l0RXhwcihzLmxlZnQpO1xuICAgICAgICB2aXNpdEV4cHIocy5yaWdodCk7XG4gICAgICAgIHZpc2l0U3RtdChzLmJvZHkpO1xuICAgICAgICBleGl0KCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJTd2l0Y2hTdGF0ZW1lbnRcIjoge1xuICAgICAgICB2aXNpdEV4cHIocy5kaXNjcmltaW5hbnQpO1xuICAgICAgICBlbnRlcigpO1xuICAgICAgICAocy5jYXNlcyBhcyBBc3ROb2RlW10pLmZvckVhY2goKGMpID0+IHtcbiAgICAgICAgICBpZiAoYy50ZXN0KSB2aXNpdEV4cHIoYy50ZXN0KTtcbiAgICAgICAgICAoYy5jb25zZXF1ZW50IGFzIEFzdE5vZGVbXSkuZm9yRWFjaCh2aXNpdFN0bXQpO1xuICAgICAgICB9KTtcbiAgICAgICAgZXhpdCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjYXNlIFwiVHJ5U3RhdGVtZW50XCI6XG4gICAgICAgIHZpc2l0U3RtdChzLmJsb2NrKTtcbiAgICAgICAgaWYgKHMuaGFuZGxlcikge1xuICAgICAgICAgIGVudGVyKCk7XG4gICAgICAgICAgaWYgKHMuaGFuZGxlci5wYXJhbSkgZGVjbGFyZVBhdHRlcm4ocy5oYW5kbGVyLnBhcmFtKTtcbiAgICAgICAgICB2aXNpdFN0bXQocy5oYW5kbGVyLmJvZHkpO1xuICAgICAgICAgIGV4aXQoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocy5maW5hbGl6ZXIpIHZpc2l0U3RtdChzLmZpbmFsaXplcik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJCcmVha1N0YXRlbWVudFwiOlxuICAgICAgY2FzZSBcIkNvbnRpbnVlU3RhdGVtZW50XCI6XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gIH07XG5cbiAgKHByb2dyYW0uYm9keSBhcyBBc3ROb2RlW10pLmZvckVhY2godmlzaXRTdG10KTtcbiAgcmV0dXJuIGVycm9ycztcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gUHJvdG90eXBlIGFjY2VzcyB2YWxpZGF0aW9uXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZXhwb3J0IGNvbnN0IHZhbGlkYXRlTm9Qcm90b3R5cGUgPSAocHJvZ3JhbTogQXN0Tm9kZSkgPT4ge1xuICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IGZvcmJpZGRlbk1lbWJlcnMgPSBuZXcgU2V0KFtcInByb3RvdHlwZVwiLCBcImNvbnN0cnVjdG9yXCIsIFwiX19wcm90b19fXCJdKTtcblxuICBjb25zdCB2aXNpdEV4cHIgPSAoZTogQXN0Tm9kZSk6IHZvaWQgPT4ge1xuICAgIGlmICghZSkgcmV0dXJuO1xuICAgIHN3aXRjaCAoZS50eXBlKSB7XG4gICAgICBjYXNlIFwiTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgICBpZiAoIWUuY29tcHV0ZWQgJiYgZS5wcm9wZXJ0eS50eXBlID09PSBcIklkZW50aWZpZXJcIiAmJiBmb3JiaWRkZW5NZW1iZXJzLmhhcyhlLnByb3BlcnR5Lm5hbWUpKSB7XG4gICAgICAgICAgZXJyb3JzLnB1c2goXCJwcm90b3R5cGUgYWNjZXNzXCIpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvbXB1dGVkIGFjY2VzcyBpcyBhbGxvd2VkIFx1MjAxNCBydW50aW1lIF9fY2hrIGd1YXJkcyBhZ2FpbnN0IGZvcmJpZGRlbiBrZXlzXG4gICAgICAgIHZpc2l0RXhwcihlLm9iamVjdCk7XG4gICAgICAgIGlmIChlLmNvbXB1dGVkKSB2aXNpdEV4cHIoZS5wcm9wZXJ0eSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJTcHJlYWRFbGVtZW50XCI6XG4gICAgICAgIHZpc2l0RXhwcihlLmFyZ3VtZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIk5ld0V4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUuY2FsbGVlKTtcbiAgICAgICAgKGUuYXJndW1lbnRzIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgoYSkgPT4gdmlzaXRFeHByKGEpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkNhbGxFeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLmNhbGxlZSk7XG4gICAgICAgIChlLmFyZ3VtZW50cyBhcyBBc3ROb2RlW10pLmZvckVhY2goKGEpID0+IHZpc2l0RXhwcihhKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJBd2FpdEV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUuYXJndW1lbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQ2hhaW5FeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLmV4cHJlc3Npb24pO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQXJyYXlFeHByZXNzaW9uXCI6XG4gICAgICAgIChlLmVsZW1lbnRzIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgoZWwpID0+IGVsICYmIHZpc2l0RXhwcihlbCkpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiT2JqZWN0RXhwcmVzc2lvblwiOlxuICAgICAgICAoZS5wcm9wZXJ0aWVzIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgocCkgPT4ge1xuICAgICAgICAgIGlmIChwLnR5cGUgPT09IFwiU3ByZWFkRWxlbWVudFwiKSB2aXNpdEV4cHIocC5hcmd1bWVudCk7XG4gICAgICAgICAgZWxzZSB2aXNpdEV4cHIocC52YWx1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQXNzaWdubWVudEV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUubGVmdCk7XG4gICAgICAgIHZpc2l0RXhwcihlLnJpZ2h0KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlVwZGF0ZUV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUuYXJndW1lbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQmluYXJ5RXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIkxvZ2ljYWxFeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLmxlZnQpO1xuICAgICAgICB2aXNpdEV4cHIoZS5yaWdodCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJVbmFyeUV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUuYXJndW1lbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQ29uZGl0aW9uYWxFeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLnRlc3QpO1xuICAgICAgICB2aXNpdEV4cHIoZS5jb25zZXF1ZW50KTtcbiAgICAgICAgdmlzaXRFeHByKGUuYWx0ZXJuYXRlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkFycm93RnVuY3Rpb25FeHByZXNzaW9uXCI6XG4gICAgICAgIGlmIChlLmJvZHkudHlwZSA9PT0gXCJCbG9ja1N0YXRlbWVudFwiKSB2aXNpdFN0bXQoZS5ib2R5KTtcbiAgICAgICAgZWxzZSB2aXNpdEV4cHIoZS5ib2R5KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIklkZW50aWZpZXJcIjpcbiAgICAgIGNhc2UgXCJMaXRlcmFsXCI6XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgdmlzaXRTdG10ID0gKHM6IEFzdE5vZGUpOiB2b2lkID0+IHtcbiAgICBzd2l0Y2ggKHMudHlwZSkge1xuICAgICAgY2FzZSBcIkJsb2NrU3RhdGVtZW50XCI6XG4gICAgICAgIChzLmJvZHkgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKHZpc2l0U3RtdCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJFeHByZXNzaW9uU3RhdGVtZW50XCI6XG4gICAgICAgIHZpc2l0RXhwcihzLmV4cHJlc3Npb24pO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiSWZTdGF0ZW1lbnRcIjpcbiAgICAgICAgdmlzaXRFeHByKHMudGVzdCk7XG4gICAgICAgIHZpc2l0U3RtdChzLmNvbnNlcXVlbnQpO1xuICAgICAgICBpZiAocy5hbHRlcm5hdGUpIHZpc2l0U3RtdChzLmFsdGVybmF0ZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJSZXR1cm5TdGF0ZW1lbnRcIjpcbiAgICAgICAgaWYgKHMuYXJndW1lbnQpIHZpc2l0RXhwcihzLmFyZ3VtZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlRocm93U3RhdGVtZW50XCI6XG4gICAgICAgIGlmIChzLmFyZ3VtZW50KSB2aXNpdEV4cHIocy5hcmd1bWVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJWYXJpYWJsZURlY2xhcmF0aW9uXCI6XG4gICAgICAgIChzLmRlY2xhcmF0aW9ucyBhcyBBc3ROb2RlW10pLmZvckVhY2goKGQpID0+IGQuaW5pdCAmJiB2aXNpdEV4cHIoZC5pbml0KSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJXaGlsZVN0YXRlbWVudFwiOlxuICAgICAgICB2aXNpdEV4cHIocy50ZXN0KTtcbiAgICAgICAgdmlzaXRTdG10KHMuYm9keSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJGb3JTdGF0ZW1lbnRcIjpcbiAgICAgICAgaWYgKHMuaW5pdD8udHlwZSA9PT0gXCJWYXJpYWJsZURlY2xhcmF0aW9uXCIpIChzLmluaXQuZGVjbGFyYXRpb25zIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgoZDogQXN0Tm9kZSkgPT4gZC5pbml0ICYmIHZpc2l0RXhwcihkLmluaXQpKTtcbiAgICAgICAgZWxzZSBpZiAocy5pbml0KSB2aXNpdEV4cHIocy5pbml0KTtcbiAgICAgICAgaWYgKHMudGVzdCkgdmlzaXRFeHByKHMudGVzdCk7XG4gICAgICAgIGlmIChzLnVwZGF0ZSkgdmlzaXRFeHByKHMudXBkYXRlKTtcbiAgICAgICAgdmlzaXRTdG10KHMuYm9keSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJGb3JJblN0YXRlbWVudFwiOlxuICAgICAgY2FzZSBcIkZvck9mU3RhdGVtZW50XCI6XG4gICAgICAgIGlmIChzLmxlZnQudHlwZSA9PT0gXCJWYXJpYWJsZURlY2xhcmF0aW9uXCIpIChzLmxlZnQuZGVjbGFyYXRpb25zIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgoZDogQXN0Tm9kZSkgPT4gZC5pbml0ICYmIHZpc2l0RXhwcihkLmluaXQpKTtcbiAgICAgICAgZWxzZSB2aXNpdEV4cHIocy5sZWZ0KTtcbiAgICAgICAgdmlzaXRFeHByKHMucmlnaHQpO1xuICAgICAgICB2aXNpdFN0bXQocy5ib2R5KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlN3aXRjaFN0YXRlbWVudFwiOlxuICAgICAgICB2aXNpdEV4cHIocy5kaXNjcmltaW5hbnQpO1xuICAgICAgICAocy5jYXNlcyBhcyBBc3ROb2RlW10pLmZvckVhY2goKGMpID0+IHtcbiAgICAgICAgICBpZiAoYy50ZXN0KSB2aXNpdEV4cHIoYy50ZXN0KTtcbiAgICAgICAgICAoYy5jb25zZXF1ZW50IGFzIEFzdE5vZGVbXSkuZm9yRWFjaCh2aXNpdFN0bXQpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlRyeVN0YXRlbWVudFwiOlxuICAgICAgICB2aXNpdFN0bXQocy5ibG9jayk7XG4gICAgICAgIGlmIChzLmhhbmRsZXIpIHZpc2l0U3RtdChzLmhhbmRsZXIuYm9keSk7XG4gICAgICAgIGlmIChzLmZpbmFsaXplcikgdmlzaXRTdG10KHMuZmluYWxpemVyKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkJyZWFrU3RhdGVtZW50XCI6XG4gICAgICBjYXNlIFwiQ29udGludWVTdGF0ZW1lbnRcIjpcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcblxuICAocHJvZ3JhbS5ib2R5IGFzIEFzdE5vZGVbXSkuZm9yRWFjaCh2aXNpdFN0bXQpO1xuICByZXR1cm4gZXJyb3JzO1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBQYXJzZXIgXHUyMDE0IHJldHVybnMgYWNvcm4gQVNUIGRpcmVjdGx5XG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZXhwb3J0IGNvbnN0IHBhcnNlID0gKHNyYzogc3RyaW5nKTogQXN0Tm9kZSA9PiB7XG4gIHJldHVybiBhY29yblBhcnNlKHNyYywge1xuICAgIGVjbWFWZXJzaW9uOiBcImxhdGVzdFwiLFxuICAgIHNvdXJjZVR5cGU6IFwic2NyaXB0XCIsXG4gICAgYWxsb3dSZXR1cm5PdXRzaWRlRnVuY3Rpb246IHRydWUsXG4gICAgYWxsb3dBd2FpdE91dHNpZGVGdW5jdGlvbjogdHJ1ZSxcbiAgfSkgYXMgdW5rbm93biBhcyBBc3ROb2RlO1xufTtcbiIsICIvKipcbiAqIGNvZGVnZW4udHMgXHUyMDE0IFNlY3VyaXR5LWNyaXRpY2FsIGNvZGUgZ2VuZXJhdGlvbiBhbmQgcnVudGltZSBleGVjdXRpb24uXG4gKlxuICogVGFrZXMgYWNvcm4gQVNUIChmcm9tIHBhcnNlci50cykgYW5kIHByb2R1Y2VzIEphdmFTY3JpcHQgc291cmNlIHN0cmluZ3NcbiAqIGV2YWx1YXRlZCB2aWEgYG5ldyBGdW5jdGlvbigpYC4gVGhlIHJlbmRlciBmdW5jdGlvbnMgYWN0IGFzIGEgd2hpdGVsaXN0OlxuICogdW5zdXBwb3J0ZWQgbm9kZSB0eXBlcyBhcmUgcmVqZWN0ZWQgYXQgdGhlIGBkZWZhdWx0YCBicmFuY2ggb2YgZWFjaCBzd2l0Y2guXG4gKiBFdmVyeSBpZGVudGlmaWVyIGlzIHZhbGlkYXRlZCBieSBgYXNzZXJ0U2FmZUlkZW50YCBhcyBkZWZlbnNlLWluLWRlcHRoLlxuICpcbiAqIEF1ZGl0IHN1cmZhY2U6IHJlbmRlckV4cHIsIHJlbmRlclN0bXQsIHJlbmRlclBhdHRlcm4sIGFuZCB0aGUgcnVubmVyXG4gKiBmdW5jdGlvbnMgdGhhdCBpbnRlcnBvbGF0ZSBmdWVsIHJlZmVyZW5jZXMuXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBBc3ROb2RlIH0gZnJvbSBcIi4vcGFyc2VyLnRzXCI7XG5pbXBvcnQgeyBwYXJzZSwgdmFsaWRhdGVTY29wZXMsIHZhbGlkYXRlTm9Qcm90b3R5cGUgfSBmcm9tIFwiLi9wYXJzZXIudHNcIjtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBEZWZlbnNlLWluLWRlcHRoOiBpZGVudGlmaWVyIHZhbGlkYXRpb25cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5jb25zdCBTQUZFX0lERU5UX1JFID0gL15bQS1aYS16XyRdW0EtWmEtejAtOV8kXSokLztcblxuY29uc3QgRk9SQklEREVOX0lERU5UUyA9IG5ldyBTZXQoW1xuICBcImV2YWxcIiwgXCJhcmd1bWVudHNcIiwgXCJ0aGlzXCIsIFwiZ2xvYmFsVGhpc1wiLCBcIndpbmRvd1wiLCBcImRvY3VtZW50XCIsXG4gIFwicHJvY2Vzc1wiLCBcInJlcXVpcmVcIiwgXCJtb2R1bGVcIiwgXCJleHBvcnRzXCIsIFwiX19kaXJuYW1lXCIsIFwiX19maWxlbmFtZVwiLFxuICBcImltcG9ydFNjcmlwdHNcIixcbl0pO1xuXG5jb25zdCBTQUZFX0NPTlNUUlVDVE9SUyA9IG5ldyBTZXQoW1wiTWFwXCIsIFwiU2V0XCJdKTtcblxuZXhwb3J0IGNvbnN0IGFzc2VydFNhZmVJZGVudCA9IChuYW1lOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgaWYgKCFTQUZFX0lERU5UX1JFLnRlc3QobmFtZSkpXG4gICAgdGhyb3cgbmV3IEVycm9yKGB1bnNhZmUgaWRlbnRpZmllciBpbiBjb2RlZ2VuOiAke0pTT04uc3RyaW5naWZ5KG5hbWUpfWApO1xuICBpZiAoRk9SQklEREVOX0lERU5UUy5oYXMobmFtZSkpXG4gICAgdGhyb3cgbmV3IEVycm9yKGBmb3JiaWRkZW4gaWRlbnRpZmllciBpbiBjb2RlZ2VuOiAke25hbWV9YCk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIENvZGUgZ2VuZXJhdGlvbiAoYWNvcm4gQVNUIFx1MjE5MiBKUyBzb3VyY2Ugc3RyaW5nKVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNvbnN0IHJlbmRlckxpdGVyYWwgPSAobm9kZTogQXN0Tm9kZSkgPT4ge1xuICBpZiAobm9kZS5yZWdleCkge1xuICAgIGlmICh0eXBlb2Ygbm9kZS5yYXcgPT09IFwic3RyaW5nXCIgJiYgbm9kZS5yYXcuc3RhcnRzV2l0aChcIi9cIikpIHJldHVybiBub2RlLnJhdztcbiAgICBjb25zdCBwYXR0ZXJuID0gU3RyaW5nKG5vZGUucmVnZXgucGF0dGVybiA/PyBcIlwiKTtcbiAgICBjb25zdCBmbGFncyA9IFN0cmluZyhub2RlLnJlZ2V4LmZsYWdzID8/IFwiXCIpO1xuICAgIGNvbnN0IGVzY2FwZWQgPSBwYXR0ZXJuLnJlcGxhY2UoL1xcXFwvZywgXCJcXFxcXFxcXFwiKS5yZXBsYWNlKC9cXC8vZywgXCJcXFxcL1wiKTtcbiAgICByZXR1cm4gYC8ke2VzY2FwZWR9LyR7ZmxhZ3N9YDtcbiAgfVxuICBpZiAobm9kZS5iaWdpbnQgIT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKFwiYmlnaW50IGxpdGVyYWxzIG5vdCBzdXBwb3J0ZWRcIik7XG4gIGNvbnN0IHYgPSBub2RlLnZhbHVlO1xuICBpZiAodiA9PT0gbnVsbCkgcmV0dXJuIFwibnVsbFwiO1xuICBpZiAodHlwZW9mIHYgPT09IFwic3RyaW5nXCIpIHJldHVybiBKU09OLnN0cmluZ2lmeSh2KTtcbiAgcmV0dXJuIFN0cmluZyh2KTtcbn07XG5cbmNvbnN0IHJlbmRlckV4cHIgPSAoZTogQXN0Tm9kZSk6IHN0cmluZyA9PiB7XG4gIHN3aXRjaCAoZS50eXBlKSB7XG4gICAgY2FzZSBcIklkZW50aWZpZXJcIjpcbiAgICAgIGFzc2VydFNhZmVJZGVudChlLm5hbWUpO1xuICAgICAgcmV0dXJuIGUubmFtZTtcbiAgICBjYXNlIFwiQ2hhaW5FeHByZXNzaW9uXCI6XG4gICAgICByZXR1cm4gcmVuZGVyRXhwcihlLmV4cHJlc3Npb24pO1xuICAgIGNhc2UgXCJTcHJlYWRFbGVtZW50XCI6XG4gICAgICByZXR1cm4gYC4uLiR7cmVuZGVyRXhwcihlLmFyZ3VtZW50KX1gO1xuICAgIGNhc2UgXCJMaXRlcmFsXCI6XG4gICAgICByZXR1cm4gcmVuZGVyTGl0ZXJhbChlKTtcbiAgICBjYXNlIFwiQXJyYXlFeHByZXNzaW9uXCI6XG4gICAgICByZXR1cm4gYFskeyhlLmVsZW1lbnRzIGFzIEFzdE5vZGVbXSkubWFwKChlbCkgPT4gZWwgPyByZW5kZXJFeHByKGVsKSA6IFwiXCIpLmpvaW4oXCIsIFwiKX1dYDtcbiAgICBjYXNlIFwiT2JqZWN0RXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIGB7JHsoZS5wcm9wZXJ0aWVzIGFzIEFzdE5vZGVbXSkubWFwKChwKSA9PiBwLnR5cGUgPT09IFwiU3ByZWFkRWxlbWVudFwiID8gYC4uLiR7cmVuZGVyRXhwcihwLmFyZ3VtZW50KX1gIDogcmVuZGVyUHJvcChwKSkuam9pbihcIiwgXCIpfX1gO1xuICAgIGNhc2UgXCJBd2FpdEV4cHJlc3Npb25cIjpcbiAgICAgIHJldHVybiBgKGF3YWl0ICR7cmVuZGVyRXhwcihlLmFyZ3VtZW50KX0pYDtcbiAgICBjYXNlIFwiQ2FsbEV4cHJlc3Npb25cIjoge1xuICAgICAgY29uc3QgY2FsbGVlU3RyID0gcmVuZGVyRXhwcihlLmNhbGxlZSk7XG4gICAgICBjb25zdCBuZWVkc1BhcmVucyA9IGUuY2FsbGVlLnR5cGUgPT09IFwiQXJyb3dGdW5jdGlvbkV4cHJlc3Npb25cIjtcbiAgICAgIHJldHVybiBgJHtuZWVkc1BhcmVucyA/IFwiKFwiIDogXCJcIn0ke2NhbGxlZVN0cn0ke25lZWRzUGFyZW5zID8gXCIpXCIgOiBcIlwifSR7ZS5vcHRpb25hbCA/IFwiPy5cIiA6IFwiXCJ9KCR7KGUuYXJndW1lbnRzIGFzIEFzdE5vZGVbXSkubWFwKHJlbmRlckV4cHIpLmpvaW4oXCIsIFwiKX0pYDtcbiAgICB9XG4gICAgY2FzZSBcIk1lbWJlckV4cHJlc3Npb25cIjpcbiAgICAgIHJldHVybiBlLmNvbXB1dGVkXG4gICAgICAgID8gYCR7cmVuZGVyRXhwcihlLm9iamVjdCl9JHtlLm9wdGlvbmFsID8gXCI/LlwiIDogXCJcIn1bX19jaGsoJHtyZW5kZXJFeHByKGUucHJvcGVydHkpfSldYFxuICAgICAgICA6IGAke3JlbmRlckV4cHIoZS5vYmplY3QpfSR7ZS5vcHRpb25hbCA/IFwiPy5cIiA6IFwiLlwifSR7cmVuZGVyRXhwcihlLnByb3BlcnR5KX1gO1xuICAgIGNhc2UgXCJBc3NpZ25tZW50RXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIGAke3JlbmRlckV4cHIoZS5sZWZ0KX0gJHtlLm9wZXJhdG9yfSAke3JlbmRlckV4cHIoZS5yaWdodCl9YDtcbiAgICBjYXNlIFwiVXBkYXRlRXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIGUucHJlZml4XG4gICAgICAgID8gYCR7ZS5vcGVyYXRvcn0ke3JlbmRlckV4cHIoZS5hcmd1bWVudCl9YFxuICAgICAgICA6IGAke3JlbmRlckV4cHIoZS5hcmd1bWVudCl9JHtlLm9wZXJhdG9yfWA7XG4gICAgY2FzZSBcIkJpbmFyeUV4cHJlc3Npb25cIjpcbiAgICBjYXNlIFwiTG9naWNhbEV4cHJlc3Npb25cIjpcbiAgICAgIHJldHVybiBgKCR7cmVuZGVyRXhwcihlLmxlZnQpfSAke2Uub3BlcmF0b3J9ICR7cmVuZGVyRXhwcihlLnJpZ2h0KX0pYDtcbiAgICBjYXNlIFwiVW5hcnlFeHByZXNzaW9uXCI6XG4gICAgICByZXR1cm4gZS5vcGVyYXRvciA9PT0gXCJ0eXBlb2ZcIlxuICAgICAgICA/IGAoJHtlLm9wZXJhdG9yfSAke3JlbmRlckV4cHIoZS5hcmd1bWVudCl9KWBcbiAgICAgICAgOiBgKCR7ZS5vcGVyYXRvcn0ke3JlbmRlckV4cHIoZS5hcmd1bWVudCl9KWA7XG4gICAgY2FzZSBcIkNvbmRpdGlvbmFsRXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIGAoJHtyZW5kZXJFeHByKGUudGVzdCl9ID8gJHtyZW5kZXJFeHByKGUuY29uc2VxdWVudCl9IDogJHtyZW5kZXJFeHByKGUuYWx0ZXJuYXRlKX0pYDtcbiAgICBjYXNlIFwiTmV3RXhwcmVzc2lvblwiOiB7XG4gICAgICBpZiAoZS5jYWxsZWUudHlwZSAhPT0gXCJJZGVudGlmaWVyXCIpIHRocm93IG5ldyBFcnJvcihcIm5ldzogb25seSBzaW1wbGUgY29uc3RydWN0b3JzIGFsbG93ZWRcIik7XG4gICAgICBjb25zdCBuYW1lID0gZS5jYWxsZWUubmFtZTtcbiAgICAgIGFzc2VydFNhZmVJZGVudChuYW1lKTtcbiAgICAgIGlmICghU0FGRV9DT05TVFJVQ1RPUlMuaGFzKG5hbWUpKSB0aHJvdyBuZXcgRXJyb3IoYG5ldzogJHtuYW1lfSBpcyBub3QgYW4gYWxsb3dlZCBjb25zdHJ1Y3RvcmApO1xuICAgICAgcmV0dXJuIGBuZXcgJHtuYW1lfSgkeyhlLmFyZ3VtZW50cyBhcyBBc3ROb2RlW10pLm1hcChyZW5kZXJFeHByKS5qb2luKFwiLCBcIil9KWA7XG4gICAgfVxuICAgIGNhc2UgXCJBcnJvd0Z1bmN0aW9uRXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIHJlbmRlckFycm93KGUpO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYHVuc3VwcG9ydGVkIGV4cHJlc3Npb246ICR7ZS50eXBlfWApO1xuICB9XG59O1xuXG5jb25zdCByZW5kZXJQcm9wID0gKHA6IEFzdE5vZGUpID0+IHtcbiAgaWYgKHAuY29tcHV0ZWQpIHRocm93IG5ldyBFcnJvcihcImNvbXB1dGVkIHByb3BlcnRpZXMgbm90IHN1cHBvcnRlZFwiKTtcbiAgaWYgKHAubWV0aG9kKSB0aHJvdyBuZXcgRXJyb3IoXCJtZXRob2QgcHJvcGVydGllcyBub3Qgc3VwcG9ydGVkXCIpO1xuICBpZiAocC5raW5kICE9PSBcImluaXRcIikgdGhyb3cgbmV3IEVycm9yKGB1bnN1cHBvcnRlZCBwcm9wZXJ0eSBraW5kOiAke3Aua2luZH1gKTtcbiAgY29uc3Qga2V5ID1cbiAgICBwLmtleS50eXBlID09PSBcIklkZW50aWZpZXJcIiA/IHAua2V5Lm5hbWUgOiByZW5kZXJMaXRlcmFsKHAua2V5KTtcbiAgaWYgKHAuc2hvcnRoYW5kICYmIHAudmFsdWUudHlwZSA9PT0gXCJJZGVudGlmaWVyXCIgJiYgcC52YWx1ZS5uYW1lID09PSBrZXkpIHtcbiAgICBhc3NlcnRTYWZlSWRlbnQoa2V5KTtcbiAgICByZXR1cm4ga2V5O1xuICB9XG4gIHJldHVybiBgJHtrZXl9OiAke3JlbmRlckV4cHIocC52YWx1ZSl9YDtcbn07XG5cbmNvbnN0IHJlbmRlckFycm93ID0gKGU6IEFzdE5vZGUpID0+IHtcbiAgY29uc3QgcGFyYW1zID0gYCgkeyhlLnBhcmFtcyBhcyBBc3ROb2RlW10pLm1hcChyZW5kZXJQYXR0ZXJuKS5qb2luKFwiLCBcIil9KWA7XG4gIGNvbnN0IHByZWZpeCA9IGUuYXN5bmMgPyBcImFzeW5jIFwiIDogXCJcIjtcbiAgaWYgKGUuYm9keS50eXBlID09PSBcIkJsb2NrU3RhdGVtZW50XCIpIHtcbiAgICByZXR1cm4gYCR7cHJlZml4fSR7cGFyYW1zfSA9PiAke3JlbmRlclN0bXQoZS5ib2R5LCB0cnVlKX1gO1xuICB9XG4gIHJldHVybiBgJHtwcmVmaXh9JHtwYXJhbXN9ID0+IHsgX19idXJuKCk7IHJldHVybiAke3JlbmRlckV4cHIoZS5ib2R5KX07IH1gO1xufTtcblxuY29uc3QgcmVuZGVyU3RtdCA9IChzOiBBc3ROb2RlLCBpbkZuID0gZmFsc2UpOiBzdHJpbmcgPT4ge1xuICBjb25zdCBidXJuID0gaW5GbiA/IFwiX19idXJuKCk7XCIgOiBcIlwiO1xuICBjb25zdCByZW5kZXJMb29wQm9keSA9IChib2R5OiBBc3ROb2RlKSA9PiB7XG4gICAgaWYgKGJvZHkudHlwZSA9PT0gXCJCbG9ja1N0YXRlbWVudFwiKSB7XG4gICAgICBjb25zdCBpbm5lciA9IChib2R5LmJvZHkgYXMgQXN0Tm9kZVtdKS5tYXAoKGIpID0+IHJlbmRlclN0bXQoYiwgaW5GbikpLmpvaW4oXCJcIik7XG4gICAgICByZXR1cm4gYHtfX2J1cm4oKTske2lubmVyfX1gO1xuICAgIH1cbiAgICByZXR1cm4gYHtfX2J1cm4oKTske3JlbmRlclN0bXQoYm9keSwgaW5Gbil9fWA7XG4gIH07XG4gIHN3aXRjaCAocy50eXBlKSB7XG4gICAgY2FzZSBcIkJsb2NrU3RhdGVtZW50XCI6XG4gICAgICByZXR1cm4gYHskeyhzLmJvZHkgYXMgQXN0Tm9kZVtdKS5tYXAoKGIpID0+IHJlbmRlclN0bXQoYiwgaW5GbikpLmpvaW4oXCJcIil9fWA7XG4gICAgY2FzZSBcIkV4cHJlc3Npb25TdGF0ZW1lbnRcIjpcbiAgICAgIHJldHVybiBgJHtidXJufSR7cmVuZGVyRXhwcihzLmV4cHJlc3Npb24pfTtgO1xuICAgIGNhc2UgXCJJZlN0YXRlbWVudFwiOiB7XG4gICAgICBjb25zdCB3cmFwID0gKHN0bXQ6IEFzdE5vZGUpID0+XG4gICAgICAgIHN0bXQudHlwZSA9PT0gXCJCbG9ja1N0YXRlbWVudFwiID8gcmVuZGVyU3RtdChzdG10LCBpbkZuKSA6IGB7JHtyZW5kZXJTdG10KHN0bXQsIGluRm4pfX1gO1xuICAgICAgcmV0dXJuIGAke2J1cm59aWYgKCR7cmVuZGVyRXhwcihzLnRlc3QpfSkgJHt3cmFwKHMuY29uc2VxdWVudCl9JHtzLmFsdGVybmF0ZSA/IGAgZWxzZSAke3dyYXAocy5hbHRlcm5hdGUpfWAgOiBcIlwifWA7XG4gICAgfVxuICAgIGNhc2UgXCJSZXR1cm5TdGF0ZW1lbnRcIjpcbiAgICAgIHJldHVybiBgJHtidXJufXJldHVybiR7cy5hcmd1bWVudCA/IGAgJHtyZW5kZXJFeHByKHMuYXJndW1lbnQpfWAgOiBcIlwifTtgO1xuICAgIGNhc2UgXCJUaHJvd1N0YXRlbWVudFwiOlxuICAgICAgcmV0dXJuIGAke2J1cm59dGhyb3cgJHtyZW5kZXJFeHByKHMuYXJndW1lbnQpfTtgO1xuICAgIGNhc2UgXCJWYXJpYWJsZURlY2xhcmF0aW9uXCI6XG4gICAgICBpZiAocy5raW5kID09PSBcInZhclwiKSB0aHJvdyBuZXcgRXJyb3IoXCJ2YXIgZGVjbGFyYXRpb25zIG5vdCBhbGxvd2VkXCIpO1xuICAgICAgcmV0dXJuIGAke2J1cm59JHtzLmtpbmR9ICR7KHMuZGVjbGFyYXRpb25zIGFzIEFzdE5vZGVbXSkubWFwKHJlbmRlckRlY2wpLmpvaW4oXCIsIFwiKX07YDtcbiAgICBjYXNlIFwiQnJlYWtTdGF0ZW1lbnRcIjpcbiAgICAgIHJldHVybiBgJHtidXJufWJyZWFrO2A7XG4gICAgY2FzZSBcIkNvbnRpbnVlU3RhdGVtZW50XCI6XG4gICAgICByZXR1cm4gYCR7YnVybn1jb250aW51ZTtgO1xuICAgIGNhc2UgXCJXaGlsZVN0YXRlbWVudFwiOlxuICAgICAgcmV0dXJuIGAke2J1cm59d2hpbGUgKCR7cmVuZGVyRXhwcihzLnRlc3QpfSkgJHtyZW5kZXJMb29wQm9keShzLmJvZHkpfWA7XG4gICAgY2FzZSBcIkZvclN0YXRlbWVudFwiOiB7XG4gICAgICBjb25zdCBpbml0ID1cbiAgICAgICAgcy5pbml0ID09IG51bGxcbiAgICAgICAgICA/IFwiXCJcbiAgICAgICAgICA6IHMuaW5pdC50eXBlID09PSBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIlxuICAgICAgICAgID8gYCR7cy5pbml0LmtpbmR9ICR7KHMuaW5pdC5kZWNsYXJhdGlvbnMgYXMgQXN0Tm9kZVtdKS5tYXAocmVuZGVyRGVjbCkuam9pbihcIiwgXCIpfWBcbiAgICAgICAgICA6IHJlbmRlckV4cHIocy5pbml0KTtcbiAgICAgIGNvbnN0IHRlc3QgPSBzLnRlc3QgPyByZW5kZXJFeHByKHMudGVzdCkgOiBcIlwiO1xuICAgICAgY29uc3QgdXBkYXRlID0gcy51cGRhdGUgPyByZW5kZXJFeHByKHMudXBkYXRlKSA6IFwiXCI7XG4gICAgICByZXR1cm4gYCR7YnVybn1mb3IgKCR7aW5pdH07ICR7dGVzdH07ICR7dXBkYXRlfSkgJHtyZW5kZXJMb29wQm9keShzLmJvZHkpfWA7XG4gICAgfVxuICAgIGNhc2UgXCJGb3JJblN0YXRlbWVudFwiOiB7XG4gICAgICBjb25zdCBsZWZ0ID0gcy5sZWZ0LnR5cGUgPT09IFwiVmFyaWFibGVEZWNsYXJhdGlvblwiXG4gICAgICAgID8gYCR7cy5sZWZ0LmtpbmR9ICR7KHMubGVmdC5kZWNsYXJhdGlvbnMgYXMgQXN0Tm9kZVtdKS5tYXAocmVuZGVyRGVjbCkuam9pbihcIiwgXCIpfWBcbiAgICAgICAgOiByZW5kZXJFeHByKHMubGVmdCk7XG4gICAgICByZXR1cm4gYCR7YnVybn1mb3IgKCR7bGVmdH0gaW4gJHtyZW5kZXJFeHByKHMucmlnaHQpfSkgJHtyZW5kZXJMb29wQm9keShzLmJvZHkpfWA7XG4gICAgfVxuICAgIGNhc2UgXCJGb3JPZlN0YXRlbWVudFwiOiB7XG4gICAgICBpZiAocy5hd2FpdCkgdGhyb3cgbmV3IEVycm9yKFwiZm9yLWF3YWl0LW9mIG5vdCBzdXBwb3J0ZWRcIik7XG4gICAgICBjb25zdCBsZWZ0ID0gcy5sZWZ0LnR5cGUgPT09IFwiVmFyaWFibGVEZWNsYXJhdGlvblwiXG4gICAgICAgID8gYCR7cy5sZWZ0LmtpbmR9ICR7KHMubGVmdC5kZWNsYXJhdGlvbnMgYXMgQXN0Tm9kZVtdKS5tYXAocmVuZGVyRGVjbCkuam9pbihcIiwgXCIpfWBcbiAgICAgICAgOiByZW5kZXJFeHByKHMubGVmdCk7XG4gICAgICByZXR1cm4gYCR7YnVybn1mb3IgKCR7bGVmdH0gb2YgJHtyZW5kZXJFeHByKHMucmlnaHQpfSkgJHtyZW5kZXJMb29wQm9keShzLmJvZHkpfWA7XG4gICAgfVxuICAgIGNhc2UgXCJTd2l0Y2hTdGF0ZW1lbnRcIjoge1xuICAgICAgY29uc3QgY2FzZXMgPSAocy5jYXNlcyBhcyBBc3ROb2RlW10pLm1hcCgoYykgPT4ge1xuICAgICAgICBjb25zdCBoZWFkID0gYy50ZXN0ID8gYGNhc2UgJHtyZW5kZXJFeHByKGMudGVzdCl9OmAgOiBcImRlZmF1bHQ6XCI7XG4gICAgICAgIGNvbnN0IGJvZHkgPSAoYy5jb25zZXF1ZW50IGFzIEFzdE5vZGVbXSkubWFwKChzdG10KSA9PiByZW5kZXJTdG10KHN0bXQsIGluRm4pKS5qb2luKFwiXCIpO1xuICAgICAgICByZXR1cm4gYCR7aGVhZH0ke2JvZHl9YDtcbiAgICAgIH0pLmpvaW4oXCJcIik7XG4gICAgICByZXR1cm4gYCR7YnVybn1zd2l0Y2ggKCR7cmVuZGVyRXhwcihzLmRpc2NyaW1pbmFudCl9KSB7JHtjYXNlc319YDtcbiAgICB9XG4gICAgY2FzZSBcIlRyeVN0YXRlbWVudFwiOiB7XG4gICAgICBjb25zdCBibG9jayA9IHJlbmRlclN0bXQocy5ibG9jaywgaW5Gbik7XG4gICAgICBjb25zdCBoYW5kbGVyID0gcy5oYW5kbGVyXG4gICAgICAgID8gKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcmFtID0gcy5oYW5kbGVyLnBhcmFtID8gcmVuZGVyUGF0dGVybihzLmhhbmRsZXIucGFyYW0pIDogXCJcIjtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSByZW5kZXJTdG10KHMuaGFuZGxlci5ib2R5LCBpbkZuKTtcbiAgICAgICAgICAgIHJldHVybiBgY2F0Y2gke3BhcmFtID8gYCAoJHtwYXJhbX0pYCA6IFwiXCJ9ICR7Ym9keX1gO1xuICAgICAgICAgIH0pKClcbiAgICAgICAgOiBcIlwiO1xuICAgICAgY29uc3QgZmluYWxpemVyID0gcy5maW5hbGl6ZXIgPyBgIGZpbmFsbHkgJHtyZW5kZXJTdG10KHMuZmluYWxpemVyLCBpbkZuKX1gIDogXCJcIjtcbiAgICAgIHJldHVybiBgJHtidXJufXRyeSAke2Jsb2NrfSR7aGFuZGxlcn0ke2ZpbmFsaXplcn1gO1xuICAgIH1cbiAgICBjYXNlIFwiRW1wdHlTdGF0ZW1lbnRcIjpcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYHVuc3VwcG9ydGVkIHN0YXRlbWVudDogJHtzLnR5cGV9YCk7XG4gIH1cbn07XG5cbmNvbnN0IHJlbmRlckRlY2wgPSAoZDogQXN0Tm9kZSkgPT5cbiAgYCR7cmVuZGVyUGF0dGVybihkLmlkKX0ke2QuaW5pdCA/IGAgPSAke3JlbmRlckV4cHIoZC5pbml0KX1gIDogXCJcIn1gO1xuXG5jb25zdCByZW5kZXJQYXR0ZXJuID0gKHA6IEFzdE5vZGUpOiBzdHJpbmcgPT4ge1xuICBzd2l0Y2ggKHAudHlwZSkge1xuICAgIGNhc2UgXCJJZGVudGlmaWVyXCI6XG4gICAgICBhc3NlcnRTYWZlSWRlbnQocC5uYW1lKTtcbiAgICAgIHJldHVybiBwLm5hbWU7XG4gICAgY2FzZSBcIkFzc2lnbm1lbnRQYXR0ZXJuXCI6XG4gICAgICByZXR1cm4gYCR7cmVuZGVyUGF0dGVybihwLmxlZnQpfSA9ICR7cmVuZGVyRXhwcihwLnJpZ2h0KX1gO1xuICAgIGNhc2UgXCJSZXN0RWxlbWVudFwiOlxuICAgICAgcmV0dXJuIGAuLi4ke3JlbmRlclBhdHRlcm4ocC5hcmd1bWVudCl9YDtcbiAgICBjYXNlIFwiQXJyYXlQYXR0ZXJuXCI6XG4gICAgICByZXR1cm4gYFskeyhwLmVsZW1lbnRzIGFzIChBc3ROb2RlIHwgbnVsbClbXSkubWFwKChlbCkgPT4gZWwgPyByZW5kZXJQYXR0ZXJuKGVsKSA6IFwiXCIpLmpvaW4oXCIsIFwiKX1dYDtcbiAgICBjYXNlIFwiT2JqZWN0UGF0dGVyblwiOlxuICAgICAgcmV0dXJuIGB7JHsocC5wcm9wZXJ0aWVzIGFzIEFzdE5vZGVbXSkubWFwKChwcm9wKSA9PlxuICAgICAgICBwcm9wLnR5cGUgPT09IFwiUmVzdEVsZW1lbnRcIiA/IGAuLi4ke3JlbmRlclBhdHRlcm4ocHJvcC5hcmd1bWVudCl9YCA6IHJlbmRlclBhdHRlcm5Qcm9wZXJ0eShwcm9wKVxuICAgICAgKS5qb2luKFwiLCBcIil9fWA7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcihgdW5zdXBwb3J0ZWQgcGF0dGVybjogJHtwLnR5cGV9YCk7XG4gIH1cbn07XG5cbmNvbnN0IHJlbmRlclBhdHRlcm5Qcm9wZXJ0eSA9IChwOiBBc3ROb2RlKTogc3RyaW5nID0+IHtcbiAgaWYgKHAuY29tcHV0ZWQpIHRocm93IG5ldyBFcnJvcihcImNvbXB1dGVkIHBhdHRlcm4gcHJvcGVydGllcyBub3Qgc3VwcG9ydGVkXCIpO1xuICBjb25zdCBrZXkgPVxuICAgIHAua2V5LnR5cGUgPT09IFwiSWRlbnRpZmllclwiID8gcC5rZXkubmFtZSA6IHJlbmRlckxpdGVyYWwocC5rZXkpO1xuICBpZiAoXG4gICAgcC5zaG9ydGhhbmQgJiZcbiAgICBwLmtleS50eXBlID09PSBcIklkZW50aWZpZXJcIiAmJlxuICAgIHAudmFsdWUudHlwZSA9PT0gXCJJZGVudGlmaWVyXCIgJiZcbiAgICBwLnZhbHVlLm5hbWUgPT09IHAua2V5Lm5hbWVcbiAgKSB7XG4gICAgYXNzZXJ0U2FmZUlkZW50KGtleSk7XG4gICAgcmV0dXJuIGtleTtcbiAgfVxuICByZXR1cm4gYCR7a2V5fTogJHtyZW5kZXJQYXR0ZXJuKHAudmFsdWUpfWA7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFJlc2VydmVkIG5hbWUgdmFsaWRhdGlvblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNvbnN0IHZhbGlkYXRlTm9SZXNlcnZlZFJ1bnRpbWVOYW1lcyA9IChwcm9ncmFtOiBBc3ROb2RlLCByZXNlcnZlZE5hbWVzOiBzdHJpbmdbXSk6IHN0cmluZ1tdID0+IHtcbiAgY29uc3QgcmVzZXJ2ZWQgPSBuZXcgU2V0KHJlc2VydmVkTmFtZXMpO1xuICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG5cbiAgY29uc3QgaGl0ID0gKG5hbWU6IHN0cmluZykgPT4ge1xuICAgIGlmIChyZXNlcnZlZC5oYXMobmFtZSkpIGVycm9ycy5wdXNoKGByZXNlcnZlZCBpZGVudGlmaWVyOiAke25hbWV9YCk7XG4gIH07XG5cbiAgY29uc3QgdmlzaXRQYXR0ZXJuID0gKHA6IEFzdE5vZGUpOiB2b2lkID0+IHtcbiAgICBzd2l0Y2ggKHAudHlwZSkge1xuICAgICAgY2FzZSBcIklkZW50aWZpZXJcIjpcbiAgICAgICAgaGl0KHAubmFtZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJBc3NpZ25tZW50UGF0dGVyblwiOlxuICAgICAgICB2aXNpdFBhdHRlcm4ocC5sZWZ0KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlJlc3RFbGVtZW50XCI6XG4gICAgICAgIHZpc2l0UGF0dGVybihwLmFyZ3VtZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkFycmF5UGF0dGVyblwiOlxuICAgICAgICAocC5lbGVtZW50cyBhcyAoQXN0Tm9kZSB8IG51bGwpW10pLmZvckVhY2goKGVsKSA9PiBlbCAmJiB2aXNpdFBhdHRlcm4oZWwpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIk9iamVjdFBhdHRlcm5cIjpcbiAgICAgICAgKHAucHJvcGVydGllcyBhcyBBc3ROb2RlW10pLmZvckVhY2goKHByb3ApID0+IHtcbiAgICAgICAgICBpZiAocHJvcC50eXBlID09PSBcIlJlc3RFbGVtZW50XCIpIHZpc2l0UGF0dGVybihwcm9wLmFyZ3VtZW50KTtcbiAgICAgICAgICBlbHNlIHZpc2l0UGF0dGVybihwcm9wLnZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgdmlzaXRFeHByID0gKGU6IEFzdE5vZGUpOiB2b2lkID0+IHtcbiAgICBpZiAoIWUpIHJldHVybjtcbiAgICBzd2l0Y2ggKGUudHlwZSkge1xuICAgICAgY2FzZSBcIklkZW50aWZpZXJcIjpcbiAgICAgICAgaGl0KGUubmFtZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJMaXRlcmFsXCI6XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJTcHJlYWRFbGVtZW50XCI6XG4gICAgICAgIHZpc2l0RXhwcihlLmFyZ3VtZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkFycmF5RXhwcmVzc2lvblwiOlxuICAgICAgICAoZS5lbGVtZW50cyBhcyBBc3ROb2RlW10pLmZvckVhY2goKGVsKSA9PiBlbCAmJiB2aXNpdEV4cHIoZWwpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIk9iamVjdEV4cHJlc3Npb25cIjpcbiAgICAgICAgKGUucHJvcGVydGllcyBhcyBBc3ROb2RlW10pLmZvckVhY2goKHApID0+IHtcbiAgICAgICAgICBpZiAocC50eXBlID09PSBcIlNwcmVhZEVsZW1lbnRcIikge1xuICAgICAgICAgICAgdmlzaXRFeHByKHAuYXJndW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocC5zaG9ydGhhbmQgJiYgcC52YWx1ZS50eXBlID09PSBcIklkZW50aWZpZXJcIikgaGl0KHAudmFsdWUubmFtZSk7XG4gICAgICAgICAgdmlzaXRFeHByKHAudmFsdWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkF3YWl0RXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5hcmd1bWVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJDaGFpbkV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUuZXhwcmVzc2lvbik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJOZXdFeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLmNhbGxlZSk7XG4gICAgICAgIChlLmFyZ3VtZW50cyBhcyBBc3ROb2RlW10pLmZvckVhY2goKGEpID0+IHZpc2l0RXhwcihhKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJDYWxsRXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5jYWxsZWUpO1xuICAgICAgICAoZS5hcmd1bWVudHMgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKChhKSA9PiB2aXNpdEV4cHIoYSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5vYmplY3QpO1xuICAgICAgICBpZiAoZS5jb21wdXRlZCkgdmlzaXRFeHByKGUucHJvcGVydHkpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQXNzaWdubWVudEV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUubGVmdCk7XG4gICAgICAgIHZpc2l0RXhwcihlLnJpZ2h0KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlVwZGF0ZUV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUuYXJndW1lbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQmluYXJ5RXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIkxvZ2ljYWxFeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLmxlZnQpO1xuICAgICAgICB2aXNpdEV4cHIoZS5yaWdodCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJVbmFyeUV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUuYXJndW1lbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQ29uZGl0aW9uYWxFeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLnRlc3QpO1xuICAgICAgICB2aXNpdEV4cHIoZS5jb25zZXF1ZW50KTtcbiAgICAgICAgdmlzaXRFeHByKGUuYWx0ZXJuYXRlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkFycm93RnVuY3Rpb25FeHByZXNzaW9uXCI6XG4gICAgICAgIChlLnBhcmFtcyBhcyBBc3ROb2RlW10pLmZvckVhY2godmlzaXRQYXR0ZXJuKTtcbiAgICAgICAgaWYgKGUuYm9keS50eXBlID09PSBcIkJsb2NrU3RhdGVtZW50XCIpIHZpc2l0U3RtdChlLmJvZHkpO1xuICAgICAgICBlbHNlIHZpc2l0RXhwcihlLmJvZHkpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHZpc2l0VmFyRGVjbCA9IChkOiBBc3ROb2RlKSA9PiB7XG4gICAgdmlzaXRQYXR0ZXJuKGQuaWQpO1xuICAgIGlmIChkLmluaXQpIHZpc2l0RXhwcihkLmluaXQpO1xuICB9O1xuXG4gIGNvbnN0IHZpc2l0U3RtdCA9IChzOiBBc3ROb2RlKTogdm9pZCA9PiB7XG4gICAgc3dpdGNoIChzLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJCbG9ja1N0YXRlbWVudFwiOlxuICAgICAgICAocy5ib2R5IGFzIEFzdE5vZGVbXSkuZm9yRWFjaCh2aXNpdFN0bXQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiRXhwcmVzc2lvblN0YXRlbWVudFwiOlxuICAgICAgICB2aXNpdEV4cHIocy5leHByZXNzaW9uKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIklmU3RhdGVtZW50XCI6XG4gICAgICAgIHZpc2l0RXhwcihzLnRlc3QpO1xuICAgICAgICB2aXNpdFN0bXQocy5jb25zZXF1ZW50KTtcbiAgICAgICAgaWYgKHMuYWx0ZXJuYXRlKSB2aXNpdFN0bXQocy5hbHRlcm5hdGUpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiUmV0dXJuU3RhdGVtZW50XCI6XG4gICAgICAgIGlmIChzLmFyZ3VtZW50KSB2aXNpdEV4cHIocy5hcmd1bWVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJUaHJvd1N0YXRlbWVudFwiOlxuICAgICAgICB2aXNpdEV4cHIocy5hcmd1bWVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJWYXJpYWJsZURlY2xhcmF0aW9uXCI6XG4gICAgICAgIChzLmRlY2xhcmF0aW9ucyBhcyBBc3ROb2RlW10pLmZvckVhY2godmlzaXRWYXJEZWNsKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIldoaWxlU3RhdGVtZW50XCI6XG4gICAgICAgIHZpc2l0RXhwcihzLnRlc3QpO1xuICAgICAgICB2aXNpdFN0bXQocy5ib2R5KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkZvclN0YXRlbWVudFwiOlxuICAgICAgICBpZiAocy5pbml0Py50eXBlID09PSBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIikgKHMuaW5pdC5kZWNsYXJhdGlvbnMgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKHZpc2l0VmFyRGVjbCk7XG4gICAgICAgIGVsc2UgaWYgKHMuaW5pdCkgdmlzaXRFeHByKHMuaW5pdCk7XG4gICAgICAgIGlmIChzLnRlc3QpIHZpc2l0RXhwcihzLnRlc3QpO1xuICAgICAgICBpZiAocy51cGRhdGUpIHZpc2l0RXhwcihzLnVwZGF0ZSk7XG4gICAgICAgIHZpc2l0U3RtdChzLmJvZHkpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiRm9ySW5TdGF0ZW1lbnRcIjpcbiAgICAgIGNhc2UgXCJGb3JPZlN0YXRlbWVudFwiOlxuICAgICAgICBpZiAocy5sZWZ0LnR5cGUgPT09IFwiVmFyaWFibGVEZWNsYXJhdGlvblwiKSAocy5sZWZ0LmRlY2xhcmF0aW9ucyBhcyBBc3ROb2RlW10pLmZvckVhY2godmlzaXRWYXJEZWNsKTtcbiAgICAgICAgZWxzZSB2aXNpdEV4cHIocy5sZWZ0KTtcbiAgICAgICAgdmlzaXRFeHByKHMucmlnaHQpO1xuICAgICAgICB2aXNpdFN0bXQocy5ib2R5KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlN3aXRjaFN0YXRlbWVudFwiOlxuICAgICAgICB2aXNpdEV4cHIocy5kaXNjcmltaW5hbnQpO1xuICAgICAgICAocy5jYXNlcyBhcyBBc3ROb2RlW10pLmZvckVhY2goKGMpID0+IHtcbiAgICAgICAgICBpZiAoYy50ZXN0KSB2aXNpdEV4cHIoYy50ZXN0KTtcbiAgICAgICAgICAoYy5jb25zZXF1ZW50IGFzIEFzdE5vZGVbXSkuZm9yRWFjaCh2aXNpdFN0bXQpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlRyeVN0YXRlbWVudFwiOlxuICAgICAgICB2aXNpdFN0bXQocy5ibG9jayk7XG4gICAgICAgIGlmIChzLmhhbmRsZXIpIHtcbiAgICAgICAgICBpZiAocy5oYW5kbGVyLnBhcmFtKSB2aXNpdFBhdHRlcm4ocy5oYW5kbGVyLnBhcmFtKTtcbiAgICAgICAgICB2aXNpdFN0bXQocy5oYW5kbGVyLmJvZHkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzLmZpbmFsaXplcikgdmlzaXRTdG10KHMuZmluYWxpemVyKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkJyZWFrU3RhdGVtZW50XCI6XG4gICAgICBjYXNlIFwiQ29udGludWVTdGF0ZW1lbnRcIjpcbiAgICAgIGNhc2UgXCJFbXB0eVN0YXRlbWVudFwiOlxuICAgICAgICByZXR1cm47XG4gICAgfVxuICB9O1xuXG4gIChwcm9ncmFtLmJvZHkgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKHZpc2l0U3RtdCk7XG4gIHJldHVybiBlcnJvcnM7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFJ1bm5lciBjb2RlZ2VuICh3cmFwcyBwcm9ncmFtIGJvZHkgd2l0aCBmdWVsIG1ldGVyaW5nKVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydCBjb25zdCByZW5kZXJXaXRoRnVlbCA9IChwcm9ncmFtOiBBc3ROb2RlLCBmdWVsID0gMTAwMDApID0+IHtcbiAgY29uc3QgcHJlbHVkZSA9IGBsZXQgX19mdWVsID0gJHtmdWVsfTsgY29uc3QgX19idXJuID0gKCkgPT4geyBpZiAoLS1fX2Z1ZWwgPCAwKSB0aHJvdyBuZXcgRXJyb3IoXCJmdWVsIGV4aGF1c3RlZFwiKTsgfTske0NIS19GTn1gO1xuICBjb25zdCBib2R5ID0gKHByb2dyYW0uYm9keSBhcyBBc3ROb2RlW10pLm1hcCgocykgPT4gcmVuZGVyU3RtdChzLCB0cnVlKSkuam9pbihcIlwiKTtcbiAgcmV0dXJuIGAke3ByZWx1ZGV9JHtib2R5fWA7XG59O1xuXG5jb25zdCBDSEtfRk4gPSBgY29uc3QgX19jaGsgPSAoaykgPT4geyBpZiAodHlwZW9mIGsgPT09IFwic3RyaW5nXCIgJiYgKGsgPT09IFwiY29uc3RydWN0b3JcIiB8fCBrID09PSBcIl9fcHJvdG9fX1wiIHx8IGsgPT09IFwicHJvdG90eXBlXCIpKSB0aHJvdyBuZXcgRXJyb3IoXCJmb3JiaWRkZW4gcHJvcGVydHk6IFwiICsgayk7IHJldHVybiBrOyB9O2A7XG5cbmNvbnN0IHJlbmRlclJ1bm5lcldpdGhGdWVsU2hhcmVkID0gKHByb2dyYW06IEFzdE5vZGUsIGZ1ZWxSZWZOYW1lID0gXCJfX2Z1ZWxcIikgPT4ge1xuICBhc3NlcnRTYWZlSWRlbnQoZnVlbFJlZk5hbWUpO1xuICBjb25zdCByZXNlcnZlZEVycnMgPSB2YWxpZGF0ZU5vUmVzZXJ2ZWRSdW50aW1lTmFtZXMocHJvZ3JhbSwgW2Z1ZWxSZWZOYW1lLCBcIl9fYnVyblwiLCBcIl9fY2hrXCJdKTtcbiAgaWYgKHJlc2VydmVkRXJycy5sZW5ndGgpIHRocm93IG5ldyBFcnJvcihyZXNlcnZlZEVycnMuam9pbihcIiwgXCIpKTtcbiAgY29uc3QgcHJlbHVkZSA9IGBjb25zdCBfX2J1cm4gPSAoKSA9PiB7IGlmICgtLSR7ZnVlbFJlZk5hbWV9LnZhbHVlIDwgMCkgdGhyb3cgbmV3IEVycm9yKFwiZnVlbCBleGhhdXN0ZWRcIik7IH07JHtDSEtfRk59YDtcbiAgY29uc3QgYm9keSA9IChwcm9ncmFtLmJvZHkgYXMgQXN0Tm9kZVtdKS5tYXAoKHMpID0+IHJlbmRlclN0bXQocywgdHJ1ZSkpLmpvaW4oXCJcIik7XG4gIHJldHVybiBgJHtwcmVsdWRlfWNvbnN0IF9fcnVuID0gKCkgPT4geyR7Ym9keX19OyB0cnkgeyBjb25zdCBvayA9IF9fcnVuKCk7IHJldHVybiB7IG9rLCBmdWVsOiAke2Z1ZWxSZWZOYW1lfS52YWx1ZSB9OyB9IGNhdGNoIChlcnIpIHsgcmV0dXJuIHsgZXJyOiBTdHJpbmcoZXJyKSwgZnVlbDogJHtmdWVsUmVmTmFtZX0udmFsdWUgfTsgfWA7XG59O1xuXG5jb25zdCByZW5kZXJSdW5uZXJXaXRoRnVlbFNoYXJlZEFzeW5jID0gKHByb2dyYW06IEFzdE5vZGUsIGZ1ZWxSZWZOYW1lID0gXCJfX2Z1ZWxcIikgPT4ge1xuICBhc3NlcnRTYWZlSWRlbnQoZnVlbFJlZk5hbWUpO1xuICBjb25zdCByZXNlcnZlZEVycnMgPSB2YWxpZGF0ZU5vUmVzZXJ2ZWRSdW50aW1lTmFtZXMocHJvZ3JhbSwgW2Z1ZWxSZWZOYW1lLCBcIl9fYnVyblwiLCBcIl9fY2hrXCJdKTtcbiAgaWYgKHJlc2VydmVkRXJycy5sZW5ndGgpIHRocm93IG5ldyBFcnJvcihyZXNlcnZlZEVycnMuam9pbihcIiwgXCIpKTtcbiAgY29uc3QgcHJlbHVkZSA9IGBjb25zdCBfX2J1cm4gPSAoKSA9PiB7IGlmICgtLSR7ZnVlbFJlZk5hbWV9LnZhbHVlIDwgMCkgdGhyb3cgbmV3IEVycm9yKFwiZnVlbCBleGhhdXN0ZWRcIik7IH07JHtDSEtfRk59YDtcbiAgY29uc3QgYm9keSA9IChwcm9ncmFtLmJvZHkgYXMgQXN0Tm9kZVtdKS5tYXAoKHMpID0+IHJlbmRlclN0bXQocywgdHJ1ZSkpLmpvaW4oXCJcIik7XG4gIHJldHVybiBgJHtwcmVsdWRlfWNvbnN0IF9fcnVuID0gYXN5bmMgKCkgPT4geyR7Ym9keX19OyByZXR1cm4gX19ydW4oKS50aGVuKG9rID0+ICh7IG9rLCBmdWVsOiAke2Z1ZWxSZWZOYW1lfS52YWx1ZSB9KSkuY2F0Y2goZXJyID0+ICh7IGVycjogU3RyaW5nKGVyciksIGZ1ZWw6ICR7ZnVlbFJlZk5hbWV9LnZhbHVlIH0pKTtgO1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBSdW50aW1lIGhlbHBlcnNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5leHBvcnQgdHlwZSBydW5SZXMgPSB7IG9rOiB1bmtub3duOyBmdWVsOiBudW1iZXIgfSB8IHsgZXJyOiBzdHJpbmc7IGZ1ZWw6IG51bWJlciB9O1xuXG5jb25zdCBTQUZFX09CSkVDVCA9IE9iamVjdC5mcmVlemUoT2JqZWN0LmFzc2lnbihPYmplY3QuY3JlYXRlKG51bGwpLCB7XG4gIGtleXM6IChvYmo6IHVua25vd24pID0+IE9iamVjdC5rZXlzKG9iaiBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiksXG4gIHZhbHVlczogKG9iajogdW5rbm93bikgPT4gT2JqZWN0LnZhbHVlcyhvYmogYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pLFxuICBlbnRyaWVzOiAob2JqOiB1bmtub3duKSA9PiBPYmplY3QuZW50cmllcyhvYmogYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pLFxuICBmcm9tRW50cmllczogKGVudHJpZXM6IHVua25vd24pID0+IE9iamVjdC5mcm9tRW50cmllcyhlbnRyaWVzIGFzIEl0ZXJhYmxlPFtzdHJpbmcsIHVua25vd25dPiksXG4gIGFzc2lnbjogKHRhcmdldDogdW5rbm93biwgLi4uc291cmNlczogdW5rbm93bltdKSA9PiBPYmplY3QuYXNzaWduKHRhcmdldCBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgLi4uc291cmNlcyksXG4gIGZyZWV6ZTogKG9iajogdW5rbm93bikgPT4gT2JqZWN0LmZyZWV6ZShvYmogYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pLFxufSkpO1xuXG5jb25zdCBTQUZFX0FSUkFZID0gT2JqZWN0LmZyZWV6ZShPYmplY3QuYXNzaWduKE9iamVjdC5jcmVhdGUobnVsbCksIHtcbiAgaXNBcnJheTogKHY6IHVua25vd24pID0+IEFycmF5LmlzQXJyYXkodiksXG4gIGZyb206ICh2OiB1bmtub3duLCBtYXBGbj86IHVua25vd24pID0+IG1hcEZuID8gQXJyYXkuZnJvbSh2IGFzIEl0ZXJhYmxlPHVua25vd24+LCBtYXBGbiBhcyAodjogdW5rbm93biwgaTogbnVtYmVyKSA9PiB1bmtub3duKSA6IEFycmF5LmZyb20odiBhcyBJdGVyYWJsZTx1bmtub3duPiksXG4gIG9mOiAoLi4uaXRlbXM6IHVua25vd25bXSkgPT4gQXJyYXkub2YoLi4uaXRlbXMpLFxufSkpO1xuXG5jb25zdCBTQUZFX01BVEggPSBPYmplY3QuZnJlZXplKE9iamVjdC5hc3NpZ24oT2JqZWN0LmNyZWF0ZShudWxsKSwge1xuICBhYnM6IE1hdGguYWJzLCBjZWlsOiBNYXRoLmNlaWwsIGZsb29yOiBNYXRoLmZsb29yLCByb3VuZDogTWF0aC5yb3VuZCxcbiAgbWluOiBNYXRoLm1pbiwgbWF4OiBNYXRoLm1heCwgcG93OiBNYXRoLnBvdywgc3FydDogTWF0aC5zcXJ0LFxuICBzaWduOiBNYXRoLnNpZ24sIHRydW5jOiBNYXRoLnRydW5jLCBsb2c6IE1hdGgubG9nLCBsb2cyOiBNYXRoLmxvZzIsXG4gIHJhbmRvbTogTWF0aC5yYW5kb20sIFBJOiBNYXRoLlBJLCBFOiBNYXRoLkUsXG59KSk7XG5cbnR5cGUgRnVlbFJlZiA9IHsgdmFsdWU6IG51bWJlciB9O1xudHlwZSBGdW5jdGlvblBhcmFtID0geyBuYW1lOiBzdHJpbmcsIHJlc3Q6IGJvb2xlYW4gfTtcblxuY29uc3QgcGFyc2VGdW5jdGlvbkN0b3IgPSAoY3RvckFyZ3M6IHVua25vd25bXSk6IHsgcGFyYW1zOiBGdW5jdGlvblBhcmFtW10sIGJvZHk6IHN0cmluZyB9ID0+IHtcbiAgaWYgKGN0b3JBcmdzLnNvbWUoKHYpID0+IHR5cGVvZiB2ICE9PSBcInN0cmluZ1wiKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkZ1bmN0aW9uIGFyZ3VtZW50cyBtdXN0IGJlIHN0cmluZ3NcIik7XG4gIH1cbiAgY29uc3QgcGFydHMgPSBjdG9yQXJncyBhcyBzdHJpbmdbXTtcbiAgY29uc3QgYm9keSA9IHBhcnRzLmxlbmd0aCA/IHBhcnRzW3BhcnRzLmxlbmd0aCAtIDFdIDogXCJcIjtcbiAgY29uc3QgcmF3UGFyYW1zID0gcGFydHMuc2xpY2UoMCwgLTEpO1xuICBjb25zdCBwYXJhbXM6IEZ1bmN0aW9uUGFyYW1bXSA9IFtdO1xuICBmb3IgKGNvbnN0IHJhdyBvZiByYXdQYXJhbXMpIHtcbiAgICBmb3IgKGNvbnN0IHNlZyBvZiByYXcuc3BsaXQoXCIsXCIpKSB7XG4gICAgICBjb25zdCBuYW1lID0gc2VnLnRyaW0oKTtcbiAgICAgIGlmICghbmFtZSkgY29udGludWU7XG4gICAgICBjb25zdCByZXN0ID0gbmFtZS5zdGFydHNXaXRoKFwiLi4uXCIpO1xuICAgICAgY29uc3QgYmFzZSA9IHJlc3QgPyBuYW1lLnNsaWNlKDMpIDogbmFtZTtcbiAgICAgIGlmICghL15bQS1aYS16XyRdW0EtWmEtejAtOV8kXSokLy50ZXN0KGJhc2UpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBmdW5jdGlvbiBwYXJhbWV0ZXI6ICR7bmFtZX1gKTtcbiAgICAgIH1cbiAgICAgIHBhcmFtcy5wdXNoKHsgbmFtZTogYmFzZSwgcmVzdCB9KTtcbiAgICB9XG4gIH1cbiAgY29uc3QgcmVzdENvdW50ID0gcGFyYW1zLmZpbHRlcigocCkgPT4gcC5yZXN0KS5sZW5ndGg7XG4gIGlmIChyZXN0Q291bnQgPiAxIHx8IChyZXN0Q291bnQgPT09IDEgJiYgIXBhcmFtc1twYXJhbXMubGVuZ3RoIC0gMV0ucmVzdCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZXN0IHBhcmFtZXRlciBtdXN0IGJlIHRoZSBsYXN0IHBhcmFtZXRlclwiKTtcbiAgfVxuICByZXR1cm4geyBwYXJhbXMsIGJvZHkgfTtcbn07XG5cbmNvbnN0IG1hcEZ1bmN0aW9uQXJncyA9IChwYXJhbXM6IEZ1bmN0aW9uUGFyYW1bXSwgY2FsbEFyZ3M6IHVua25vd25bXSk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0+IHtcbiAgY29uc3QgZW52OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9O1xuICBsZXQgaWR4ID0gMDtcbiAgZm9yIChjb25zdCBwIG9mIHBhcmFtcykge1xuICAgIGlmIChwLnJlc3QpIHtcbiAgICAgIGVudltwLm5hbWVdID0gY2FsbEFyZ3Muc2xpY2UoaWR4KTtcbiAgICAgIGlkeCA9IGNhbGxBcmdzLmxlbmd0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgZW52W3AubmFtZV0gPSBjYWxsQXJnc1tpZHgrK107XG4gICAgfVxuICB9XG4gIHJldHVybiBlbnY7XG59O1xuXG5jb25zdCBtYWtlU2FmZUZ1bmN0aW9uU3luYyA9IChmdWVsUmVmOiBGdWVsUmVmLCBvdXRlckdsb2JhbHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSA9PiAoLi4uY3RvckFyZ3M6IHVua25vd25bXSkgPT4ge1xuICBjb25zdCB7IHBhcmFtcywgYm9keSB9ID0gcGFyc2VGdW5jdGlvbkN0b3IoY3RvckFyZ3MpO1xuICByZXR1cm4gKC4uLmNhbGxBcmdzOiB1bmtub3duW10pID0+IHtcbiAgICBjb25zdCBsb2NhbEVudiA9IHsgLi4ub3V0ZXJHbG9iYWxzLCAuLi5tYXBGdW5jdGlvbkFyZ3MocGFyYW1zLCBjYWxsQXJncykgfTtcbiAgICBjb25zdCByZXMgPSBydW5XaXRoRnVlbFNoYXJlZChib2R5LCBmdWVsUmVmLCBsb2NhbEVudik7XG4gICAgaWYgKFwiZXJyXCIgaW4gcmVzKSB0aHJvdyBuZXcgRXJyb3IocmVzLmVycik7XG4gICAgcmV0dXJuIHJlcy5vaztcbiAgfTtcbn07XG5cbmNvbnN0IG1ha2VTYWZlRnVuY3Rpb25Bc3luYyA9IChmdWVsUmVmOiBGdWVsUmVmLCBvdXRlckdsb2JhbHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSA9PiAoLi4uY3RvckFyZ3M6IHVua25vd25bXSkgPT4ge1xuICBjb25zdCB7IHBhcmFtcywgYm9keSB9ID0gcGFyc2VGdW5jdGlvbkN0b3IoY3RvckFyZ3MpO1xuICByZXR1cm4gYXN5bmMgKC4uLmNhbGxBcmdzOiB1bmtub3duW10pID0+IHtcbiAgICBjb25zdCBsb2NhbEVudiA9IHsgLi4ub3V0ZXJHbG9iYWxzLCAuLi5tYXBGdW5jdGlvbkFyZ3MocGFyYW1zLCBjYWxsQXJncykgfTtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBydW5XaXRoRnVlbFNoYXJlZEFzeW5jKGJvZHksIGZ1ZWxSZWYsIGxvY2FsRW52KTtcbiAgICBpZiAoXCJlcnJcIiBpbiByZXMpIHRocm93IG5ldyBFcnJvcihyZXMuZXJyKTtcbiAgICByZXR1cm4gcmVzLm9rO1xuICB9O1xufTtcblxuY29uc3Qgd2l0aEJ1aWx0aW5zID0gKFxuICBlbnY6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICBmdWVsUmVmOiBGdWVsUmVmLFxuICBtb2RlOiBcInN5bmNcIiB8IFwiYXN5bmNcIixcbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0+IHtcbiAgY29uc3QgYmFzZUdsb2JhbHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge1xuICAgIC4uLmVudixcbiAgICBPYmplY3Q6IFNBRkVfT0JKRUNULFxuICAgIEFycmF5OiBTQUZFX0FSUkFZLFxuICAgIE1hdGg6IFNBRkVfTUFUSCxcbiAgICBNYXAsXG4gICAgU2V0LFxuICAgIFByb21pc2UsXG4gIH07XG4gIHJldHVybiB7XG4gICAgLi4uYmFzZUdsb2JhbHMsXG4gICAgRnVuY3Rpb246IG1vZGUgPT09IFwiYXN5bmNcIlxuICAgICAgPyBtYWtlU2FmZUZ1bmN0aW9uQXN5bmMoZnVlbFJlZiwgYmFzZUdsb2JhbHMpXG4gICAgICA6IG1ha2VTYWZlRnVuY3Rpb25TeW5jKGZ1ZWxSZWYsIGJhc2VHbG9iYWxzKSxcbiAgfTtcbn07XG5cbmNvbnN0IHN0cmluZ2lmeUVycm9yID0gKGVycjogdW5rbm93bik6IHN0cmluZyA9PiB7XG4gIGlmIChlcnIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgIGNvbnN0IHN0YWNrID0gZXJyLnN0YWNrIHx8ICcnO1xuICAgIGNvbnN0IHByZWZpeCA9IGAke2Vyci5uYW1lfTogJHtlcnIubWVzc2FnZX1gO1xuICAgIGNvbnN0IGNsZWFuU3RhY2sgPSBzdGFja1xuICAgICAgLnJlcGxhY2UoL15bXlxcbl0qXFxuPy8sICcnKVxuICAgICAgLnJlcGxhY2UoL3NwYWNldGltZWRiX21vZHVsZTooXFxkKyk6KFxcZCspL2csICc8YnVuZGxlZDokMTokMj4nKTtcbiAgICByZXR1cm4gY2xlYW5TdGFjayA/IGAke3ByZWZpeH1cXG4ke2NsZWFuU3RhY2t9YCA6IHByZWZpeDtcbiAgfVxuICBpZiAodHlwZW9mIGVyciA9PT0gJ29iamVjdCcgJiYgZXJyICE9PSBudWxsKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShlcnIpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIFN0cmluZyhlcnIpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gU3RyaW5nKGVycik7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFB1YmxpYyBydW50aW1lIEFQSVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydCBjb25zdCBydW5XaXRoRnVlbCA9IChcbiAgc3JjOiBzdHJpbmcsXG4gIGZ1ZWwgPSAxMDAwMCxcbiAgZW52OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9LFxuKTogcnVuUmVzID0+IHtcbiAgY29uc3QgZnVlbFJlZiA9IHsgdmFsdWU6IGZ1ZWwgfTtcbiAgcmV0dXJuIHJ1bldpdGhGdWVsU2hhcmVkKHNyYywgZnVlbFJlZiwgZW52KTtcbn07XG5cbmV4cG9ydCBjb25zdCBydW5XaXRoRnVlbFNoYXJlZCA9IChcbiAgc3JjOiBzdHJpbmcsXG4gIGZ1ZWxSZWY6IEZ1ZWxSZWYsXG4gIGVudjogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fSxcbiAgZnVlbFJlZk5hbWUgPSBcIl9fZnVlbFwiXG4pOiBydW5SZXMgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHJ1bnRpbWVFbnYgPSB3aXRoQnVpbHRpbnMoZW52LCBmdWVsUmVmLCBcInN5bmNcIik7XG4gICAgY29uc3QgcHJvZ3JhbSA9IHBhcnNlKHNyYyk7XG4gICAgY29uc3QgcHJvdG9FcnJzID0gdmFsaWRhdGVOb1Byb3RvdHlwZShwcm9ncmFtKTtcbiAgICBpZiAocHJvdG9FcnJzLmxlbmd0aCkgcmV0dXJuIHsgZXJyOiBcInByb3RvdHlwZSBhY2Nlc3NcIiwgZnVlbDogZnVlbFJlZi52YWx1ZSB9O1xuICAgIGNvbnN0IHNjb3BlRXJycyA9IHZhbGlkYXRlU2NvcGVzKHByb2dyYW0sIFsuLi5PYmplY3Qua2V5cyhydW50aW1lRW52KSwgZnVlbFJlZk5hbWVdKTtcbiAgICBpZiAoc2NvcGVFcnJzLmxlbmd0aCkgcmV0dXJuIHsgZXJyOiBzY29wZUVycnMuam9pbihcIiwgXCIpLCBmdWVsOiBmdWVsUmVmLnZhbHVlIH07XG4gICAgY29uc3QgY29kZSA9IHJlbmRlclJ1bm5lcldpdGhGdWVsU2hhcmVkKHByb2dyYW0sIGZ1ZWxSZWZOYW1lKTtcbiAgICBjb25zdCBmdWxsRW52ID0geyAuLi5ydW50aW1lRW52LCBbZnVlbFJlZk5hbWVdOiBmdWVsUmVmIH07XG4gICAgcmV0dXJuIChuZXcgRnVuY3Rpb24oLi4uT2JqZWN0LmtleXMoZnVsbEVudiksIGNvZGUpIGFzICguLi5hcmdzOnVua25vd25bXSkgPT4gcnVuUmVzKSguLi5PYmplY3QudmFsdWVzKGZ1bGxFbnYpKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIHsgZXJyOiBzdHJpbmdpZnlFcnJvcihlcnIpLCBmdWVsOiBmdWVsUmVmLnZhbHVlIH07XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBydW5XaXRoRnVlbFNoYXJlZEFzeW5jID0gYXN5bmMgKFxuICBzcmM6IHN0cmluZyxcbiAgZnVlbFJlZjogRnVlbFJlZixcbiAgZW52OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9LFxuICBmdWVsUmVmTmFtZSA9IFwiX19mdWVsXCJcbik6IFByb21pc2U8cnVuUmVzPiA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgcnVudGltZUVudiA9IHdpdGhCdWlsdGlucyhlbnYsIGZ1ZWxSZWYsIFwiYXN5bmNcIik7XG4gICAgY29uc3QgcHJvZ3JhbSA9IHBhcnNlKHNyYyk7XG4gICAgY29uc3QgcHJvdG9FcnJzID0gdmFsaWRhdGVOb1Byb3RvdHlwZShwcm9ncmFtKTtcbiAgICBpZiAocHJvdG9FcnJzLmxlbmd0aCkgcmV0dXJuIHsgZXJyOiBcInByb3RvdHlwZSBhY2Nlc3NcIiwgZnVlbDogZnVlbFJlZi52YWx1ZSB9O1xuICAgIGNvbnN0IHNjb3BlRXJycyA9IHZhbGlkYXRlU2NvcGVzKHByb2dyYW0sIFsuLi5PYmplY3Qua2V5cyhydW50aW1lRW52KSwgZnVlbFJlZk5hbWVdKTtcbiAgICBpZiAoc2NvcGVFcnJzLmxlbmd0aCkgcmV0dXJuIHsgZXJyOiBzY29wZUVycnMuam9pbihcIiwgXCIpLCBmdWVsOiBmdWVsUmVmLnZhbHVlIH07XG4gICAgY29uc3QgY29kZSA9IHJlbmRlclJ1bm5lcldpdGhGdWVsU2hhcmVkQXN5bmMocHJvZ3JhbSwgZnVlbFJlZk5hbWUpO1xuICAgIGNvbnN0IGZ1bGxFbnYgPSB7IC4uLnJ1bnRpbWVFbnYsIFtmdWVsUmVmTmFtZV06IGZ1ZWxSZWYgfTtcbiAgICBjb25zdCBmbiA9IG5ldyBGdW5jdGlvbiguLi5PYmplY3Qua2V5cyhmdWxsRW52KSwgY29kZSkgYXMgKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gUHJvbWlzZTxydW5SZXM+O1xuICAgIHJldHVybiBhd2FpdCBmbiguLi5PYmplY3QudmFsdWVzKGZ1bGxFbnYpKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIHsgZXJyOiBzdHJpbmdpZnlFcnJvcihlcnIpLCBmdWVsOiBmdWVsUmVmLnZhbHVlIH07XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBydW5XaXRoRnVlbEFzeW5jID0gYXN5bmMgKFxuICBzcmM6IHN0cmluZyxcbiAgZnVlbCA9IDEwMDAwLFxuICBlbnY6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge31cbik6IFByb21pc2U8cnVuUmVzPiA9PiB7XG4gIGNvbnN0IGZ1ZWxSZWYgPSB7IHZhbHVlOiBmdWVsIH07XG4gIHJldHVybiBydW5XaXRoRnVlbFNoYXJlZEFzeW5jKHNyYywgZnVlbFJlZiwgZW52KTtcbn07XG4iLCAiaW1wb3J0IHR5cGUgeyBKc29uYWJsZSB9IGZyb20gXCJAaGFzaG5vdGVzL2NvcmUvbm90ZXNcIjtcblxuZXhwb3J0IHR5cGUgT3BlblJvdXRlclJlcXVlc3QgPSB7XG4gIGFwaUtleTogc3RyaW5nO1xuICBtb2RlbDogc3RyaW5nO1xuICBwcm9tcHQ6IHN0cmluZztcbiAgc2NoZW1hOiBKc29uYWJsZTtcbn07XG5cbnR5cGUgT3BlblJvdXRlck1lc3NhZ2UgPSB7XG4gIHJvbGU6IFwidXNlclwiO1xuICBjb250ZW50OiBzdHJpbmc7XG59O1xuXG50eXBlIE9wZW5Sb3V0ZXJSZXNwb25zZSA9IHtcbiAgY2hvaWNlcz86IEFycmF5PHtcbiAgICBtZXNzYWdlPzoge1xuICAgICAgY29udGVudD86IHN0cmluZztcbiAgICB9O1xuICB9Pjtcbn07XG5cbmNvbnN0IE9QRU5ST1VURVJfVVJMID0gXCJodHRwczovL29wZW5yb3V0ZXIuYWkvYXBpL3YxL2NoYXQvY29tcGxldGlvbnNcIjtcbmNvbnN0IGNsaXAgPSAoczogc3RyaW5nLCBtYXggPSAyMDAwKTogc3RyaW5nID0+IChzLmxlbmd0aCA8PSBtYXggPyBzIDogcy5zbGljZSgwLCBtYXgpICsgXCIuLi48dHJ1bmNhdGVkPlwiKTtcblxuY29uc3QgYXNFcnJvck1lc3NhZ2UgPSBhc3luYyAocmVzOiBSZXNwb25zZSk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gIGNvbnN0IHRleHQgPSBhd2FpdCByZXMudGV4dCgpO1xuICBpZiAoIXRleHQpIHJldHVybiBgJHtyZXMuc3RhdHVzfSAke3Jlcy5zdGF0dXNUZXh0fWA7XG4gIHRyeSB7XG4gICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZSh0ZXh0KSBhcyB7IGVycm9yPzogeyBtZXNzYWdlPzogc3RyaW5nIH0gfTtcbiAgICBjb25zdCBtc2cgPSBwYXJzZWQ/LmVycm9yPy5tZXNzYWdlO1xuICAgIHJldHVybiBtc2cgPyBgJHtyZXMuc3RhdHVzfSAke21zZ31gIDogYCR7cmVzLnN0YXR1c30gJHt0ZXh0fWA7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBgJHtyZXMuc3RhdHVzfSAke3RleHR9YDtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IG9wZW5Sb3V0ZXJSZXF1ZXN0ID0gYXN5bmMgKFxuICByZXE6IE9wZW5Sb3V0ZXJSZXF1ZXN0LFxuKTogUHJvbWlzZTxKc29uYWJsZT4gPT4ge1xuICBpZiAoIXJlcS5hcGlLZXkpIHRocm93IG5ldyBFcnJvcihcIm9wZW5Sb3V0ZXJSZXF1ZXN0OiBhcGlLZXkgaXMgcmVxdWlyZWRcIik7XG4gIGlmICghcmVxLm1vZGVsKSByZXEubW9kZWwgPSBcIm9wZW5haS9ncHQtb3NzLTIwYlwiXG4gIGlmICghcmVxLnByb21wdCkgdGhyb3cgbmV3IEVycm9yKFwib3BlblJvdXRlclJlcXVlc3Q6IHByb21wdCBpcyByZXF1aXJlZFwiKTtcbiAgaWYgKCFyZXEuc2NoZW1hKSByZXEuc2NoZW1hID0ge3R5cGU6XCJzdHJpbmdcIn1cbiAgaWYgKHR5cGVvZiByZXEuc2NoZW1hICE9PSBcIm9iamVjdFwiIHx8IEFycmF5LmlzQXJyYXkocmVxLnNjaGVtYSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJvcGVuUm91dGVyUmVxdWVzdDogc2NoZW1hIG11c3QgYmUgYW4gb2JqZWN0XCIpO1xuICB9XG5cbiAgY29uc3QgbWVzc2FnZXM6IE9wZW5Sb3V0ZXJNZXNzYWdlW10gPSBbeyByb2xlOiBcInVzZXJcIiwgY29udGVudDogcmVxLnByb21wdCB9XTtcbiAgY29uc3QgbWtCb2R5ID0gKCkgPT4gKHtcbiAgICBtb2RlbDogcmVxLm1vZGVsLFxuICAgIG1lc3NhZ2VzLFxuICAgIHJlYXNvbmluZzoge1xuICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIGV4Y2x1ZGU6IHRydWUsXG4gICAgfSxcbiAgICByZXNwb25zZV9mb3JtYXQ6IHtcbiAgICAgIHR5cGU6IFwianNvbl9zY2hlbWFcIixcbiAgICAgIGpzb25fc2NoZW1hOiB7XG4gICAgICAgIG5hbWU6IFwic3RydWN0dXJlZF9vdXRwdXRcIixcbiAgICAgICAgc3RyaWN0OiB0cnVlLFxuICAgICAgICBzY2hlbWE6IHJlcS5zY2hlbWEsXG4gICAgICB9LFxuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnN0IGRvRmV0Y2ggPSAoKSA9PiBmZXRjaChPUEVOUk9VVEVSX1VSTCwge1xuICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgaGVhZGVyczoge1xuICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICBcIkF1dGhvcml6YXRpb25cIjogYEJlYXJlciAke3JlcS5hcGlLZXl9YCxcbiAgICB9LFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KG1rQm9keSgpKSxcbiAgfSk7XG5cbiAgY29uc3QgcmVzID0gYXdhaXQgZG9GZXRjaCgpO1xuICBpZiAoIXJlcy5vaykgdGhyb3cgbmV3IEVycm9yKGBPcGVuUm91dGVyIHJlcXVlc3QgZmFpbGVkOiAke2F3YWl0IGFzRXJyb3JNZXNzYWdlKHJlcyl9YCk7XG5cbiAgY29uc3QgZGF0YSA9IGF3YWl0IHJlcy5qc29uKCkgYXMgT3BlblJvdXRlclJlc3BvbnNlO1xuICBjb25zdCBjb250ZW50ID0gZGF0YS5jaG9pY2VzPy5bMF0/Lm1lc3NhZ2U/LmNvbnRlbnQ7XG4gIGlmICh0eXBlb2YgY29udGVudCAhPT0gXCJzdHJpbmdcIikge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIFwiT3BlblJvdXRlciByZXNwb25zZSBtaXNzaW5nIGNob2ljZXNbMF0ubWVzc2FnZS5jb250ZW50XCJcbiAgICAgICsgXCJcXG5tb2RlbDogXCIgKyByZXEubW9kZWxcbiAgICAgICsgXCJcXG5zY2hlbWE6IFwiICsgY2xpcChKU09OLnN0cmluZ2lmeShyZXEuc2NoZW1hKSlcbiAgICAgICsgXCJcXG5yZXNwb25zZTogXCIgKyBjbGlwKEpTT04uc3RyaW5naWZ5KGRhdGEpKVxuICAgICk7XG4gIH1cbiAgaWYgKGNvbnRlbnQudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIFwiT3BlblJvdXRlciByZXNwb25zZSBjb250ZW50IHdhcyBlbXB0eVwiXG4gICAgICArIFwiXFxubW9kZWw6IFwiICsgcmVxLm1vZGVsXG4gICAgICArIFwiXFxuc2NoZW1hOiBcIiArIGNsaXAoSlNPTi5zdHJpbmdpZnkocmVxLnNjaGVtYSkpXG4gICAgICArIFwiXFxucmVzcG9uc2U6IFwiICsgY2xpcChKU09OLnN0cmluZ2lmeShkYXRhKSlcbiAgICApO1xuICB9XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UoY29udGVudCkgYXMgSnNvbmFibGU7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnN0IHBhcnNlTXNnID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpO1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIFwiT3BlblJvdXRlciByZXNwb25zZSBjb250ZW50IHdhcyBub3QgdmFsaWQgSlNPTlwiXG4gICAgICArIFwiXFxubW9kZWw6IFwiICsgcmVxLm1vZGVsXG4gICAgICArIFwiXFxucGFyc2UgZXJyb3I6IFwiICsgcGFyc2VNc2dcbiAgICAgICsgXCJcXG5zY2hlbWE6IFwiICsgY2xpcChKU09OLnN0cmluZ2lmeShyZXEuc2NoZW1hKSlcbiAgICAgICsgXCJcXG5jb250ZW50OiBcIiArIGNsaXAoY29udGVudClcbiAgICAgICsgXCJcXG5yZXNwb25zZTogXCIgKyBjbGlwKEpTT04uc3RyaW5naWZ5KGRhdGEpKVxuICAgICk7XG4gIH1cbn07XG4iLCAiaW1wb3J0IHsgcnVuV2l0aEZ1ZWxTaGFyZWQsIHJ1bldpdGhGdWVsU2hhcmVkQXN5bmMgfSBmcm9tIFwiQGhhc2hub3Rlcy9jb3JlL2NvZGVnZW5cIjtcbmltcG9ydCB7IGZyb21qc29uLCBoYXNoRGF0YSwgdHlwZSBKc29uYWJsZSwgdHlwZSBSZWYgfSBmcm9tIFwiQGhhc2hub3Rlcy9jb3JlL25vdGVzXCI7XG5pbXBvcnQgeyBhZGROb3RlLCBhc1JlZiwgY2FsbE5vdGUsIGRlUmVmLCBnZXROb3RlIH0gZnJvbSBcIi4vZGIudHNcIjtcbmltcG9ydCB7IG9wZW5Sb3V0ZXJSZXF1ZXN0IH0gZnJvbSBcIi4vb3BlbnJvdXRlci50c1wiO1xuaW1wb3J0IHsgSFRNTCwgdHlwZSBWaWV3LCB0eXBlIFZpZXdDb250ZXh0LCB0eXBlIFZEb20gfSBmcm9tIFwiLi92aWV3cy50c1wiO1xuXG50eXBlIENsaWVudEZ1ZWxPcHRpb25zID0ge1xuICBmdWVsPzogbnVtYmVyO1xuICBlbnY/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbn07XG5cbmNvbnN0IGxvY2FsU3RvcmVLZXkgPSAoZm5SZWY6IHN0cmluZywga2V5OiBSZWYgfCBKc29uYWJsZSk6IHN0cmluZyA9PlxuICBgJHtmblJlZn18JHtoYXNoRGF0YShrZXkgYXMgSnNvbmFibGUpfWA7XG5cbi8qKiBDcmVhdGUgYSBzdG9yZSBzY29wZWQgdG8gYSBzcGVjaWZpYyBub3RlIHJlZi4gKi9cbmNvbnN0IG1ha2VTdG9yZSA9IChcbiAgbm90ZVJlZjogc3RyaW5nLFxuICBtZW1TdG9yZTogTWFwPHN0cmluZywgSnNvbmFibGU+LFxuICBsczogU3RvcmFnZSB8IHVuZGVmaW5lZCxcbikgPT4gKHtcbiAgZ2V0OiAoa2V5OiBSZWYgfCBKc29uYWJsZSk6IEpzb25hYmxlIHwgdW5kZWZpbmVkID0+IHtcbiAgICBjb25zdCBza2V5ID0gYGhhc2hub3RlczpzdG9yZToke2xvY2FsU3RvcmVLZXkobm90ZVJlZiwga2V5KX1gO1xuICAgIGNvbnN0IHJhdyA9IGxzPy5nZXRJdGVtKHNrZXkpO1xuICAgIGlmIChyYXcgIT0gbnVsbCkgcmV0dXJuIGZyb21qc29uKHJhdykgYXMgSnNvbmFibGU7XG4gICAgcmV0dXJuIG1lbVN0b3JlLmdldChza2V5KTtcbiAgfSxcbiAgc2V0OiAoa2V5OiBSZWYgfCBKc29uYWJsZSwgdmFsdWU6IFJlZiB8IEpzb25hYmxlKTogSnNvbmFibGUgPT4ge1xuICAgIGNvbnN0IHNrZXkgPSBgaGFzaG5vdGVzOnN0b3JlOiR7bG9jYWxTdG9yZUtleShub3RlUmVmLCBrZXkpfWA7XG4gICAgY29uc3QgdiA9IHZhbHVlIGFzIEpzb25hYmxlO1xuICAgIGlmIChscykgbHMuc2V0SXRlbShza2V5LCBKU09OLnN0cmluZ2lmeSh2KSk7XG4gICAgZWxzZSBtZW1TdG9yZS5zZXQoc2tleSwgdik7XG4gICAgcmV0dXJuIHY7XG4gIH0sXG59KTtcblxudHlwZSBMb2NhbEV4ZWN1dG9yID0gKGZuOiBSZWYgfCBKc29uYWJsZSwgYXJnczogUmVmIHwgSnNvbmFibGUpID0+IFByb21pc2U8dW5rbm93bj47XG5cbi8qKlxuICogUGFyc2UgX19kZXBzIGZyb20gYSBjb21waWxlZCBub3RlIGJvZHkuXG4gKiBMb29rcyBmb3IgYGNvbnN0IF9fZGVwcyA9IFtcIiNoYXNoMVwiLCBcIiNoYXNoMlwiXTtgIGFzIHRoZSBmaXJzdCBsaW5lLlxuICovXG5jb25zdCBwYXJzZURlcHMgPSAoc3JjOiBzdHJpbmcpOiBzdHJpbmdbXSA9PiB7XG4gIGNvbnN0IG0gPSBzcmMubWF0Y2goL15jb25zdCBfX2RlcHMgPSBcXFsoW15cXF1dKilcXF07Lyk7XG4gIGlmICghbSkgcmV0dXJuIFtdO1xuICByZXR1cm4gWy4uLm1bMV0ubWF0Y2hBbGwoL1wiKFteXCJdKylcIi9nKV0ubWFwKHggPT4geFsxXSk7XG59O1xuXG5jb25zdCBjcmVhdGVMb2NhbEV4ZWN1dG9yID0gKG9wdGlvbnM6IENsaWVudEZ1ZWxPcHRpb25zKTogTG9jYWxFeGVjdXRvciA9PiB7XG4gIGNvbnN0IGZ1ZWxSZWYgPSB7IHZhbHVlOiBvcHRpb25zLmZ1ZWwgPz8gMTAwMDAwIH07XG4gIGNvbnN0IG1lbVN0b3JlID0gbmV3IE1hcDxzdHJpbmcsIEpzb25hYmxlPigpO1xuICBjb25zdCBscyA9ICgoKSA9PiB7XG4gICAgdHJ5IHsgcmV0dXJuIHR5cGVvZiBsb2NhbFN0b3JhZ2UgIT09IFwidW5kZWZpbmVkXCIgPyBsb2NhbFN0b3JhZ2UgOiB1bmRlZmluZWQ7IH0gY2F0Y2ggeyByZXR1cm4gdW5kZWZpbmVkOyB9XG4gIH0pKCk7XG4gIGNvbnN0IHByb21wdFVzZXIgPSAobWVzc2FnZTogc3RyaW5nLCBkZWZhdWx0VmFsdWUgPSBcIlwiKTogc3RyaW5nIHwgbnVsbCA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHAgPSAoZ2xvYmFsVGhpcyBhcyB7IHByb21wdD86IChtOiBzdHJpbmcsIGQ/OiBzdHJpbmcpID0+IHN0cmluZyB8IG51bGwgfSkucHJvbXB0O1xuICAgICAgaWYgKHR5cGVvZiBwID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBwKG1lc3NhZ2UsIGRlZmF1bHRWYWx1ZSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBuby1vcFxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfTtcblxuICAvLyBDYWNoZTogaGFzaCBcdTIxOTIgbm90ZSBkYXRhIChzdHJpbmcgZm9yIGNvZGUsIGFueSBKc29uYWJsZSBmb3IgZGF0YSlcbiAgY29uc3Qgbm90ZUNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIEpzb25hYmxlPigpO1xuXG4gIC8vIE1hcCBmcm9tIHdyYXBwZXIgZnVuY3Rpb24gXHUyMTkyIGhhc2ggKGZvciByZW1vdGUoKSB0byByZXNvbHZlKVxuICBjb25zdCBmblRvSGFzaCA9IG5ldyBNYXA8RnVuY3Rpb24sIHN0cmluZz4oKTtcblxuICAvKiogUmVjdXJzaXZlbHkgZmV0Y2ggZGVwIHNvdXJjZXMgaW50byBub3RlQ2FjaGUgKG5vIGV4ZWN1dGlvbikuICovXG4gIGNvbnN0IHByZWZldGNoID0gYXN5bmMgKHJlZjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgaWYgKG5vdGVDYWNoZS5oYXMocmVmKSkgcmV0dXJuO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBkZVJlZihyZWYgYXMgUmVmKTtcbiAgICBub3RlQ2FjaGUuc2V0KHJlZiwgZGF0YSBhcyBKc29uYWJsZSk7XG4gICAgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBmb3IgKGNvbnN0IGRlcCBvZiBwYXJzZURlcHMoZGF0YSkpIGF3YWl0IHByZWZldGNoKGRlcCk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGNhbGxMb2NhbDogTG9jYWxFeGVjdXRvciA9IGFzeW5jIChmbklucHV0OiBSZWYgfCBKc29uYWJsZSwgYXJnc0lucHV0OiBSZWYgfCBKc29uYWJsZSk6IFByb21pc2U8dW5rbm93bj4gPT4ge1xuICAgIGNvbnN0IGZuUmVmID0gYXdhaXQgYXNSZWYoZm5JbnB1dCk7XG4gICAgY29uc3QgYXJnc1JlZiA9IGF3YWl0IGFzUmVmKGFyZ3NJbnB1dCk7XG5cbiAgICBjb25zdCBmbk5vdGUgPSBhd2FpdCBkZVJlZihmblJlZik7XG4gICAgaWYgKHR5cGVvZiBmbk5vdGUgIT09IFwic3RyaW5nXCIpIHRocm93IG5ldyBFcnJvcihcImZ1bmN0aW9uIG5vdGUgbXVzdCByZXNvbHZlIHRvIGEgc3RyaW5nXCIpO1xuICAgIGNvbnN0IGFyZ3NOb3RlID0gYXdhaXQgZGVSZWYoYXJnc1JlZik7XG4gICAgY29uc3QgYXJncyA9IEFycmF5LmlzQXJyYXkoYXJnc05vdGUpID8gYXJnc05vdGUgOiBbYXJnc05vdGVdO1xuXG4gICAgY29uc3Qgc3RvcmUgPSBtYWtlU3RvcmUoZm5SZWYsIG1lbVN0b3JlLCBscyk7XG4gICAgY29uc3QgcmVtb3RlID0gKGZuOiB1bmtub3duKTogKC4uLnJlbW90ZUFyZ3M6IChSZWYgfCBKc29uYWJsZSlbXSkgPT4gUHJvbWlzZTxKc29uYWJsZT4gPT4ge1xuICAgICAgY29uc3QgaGFzaCA9IGZuVG9IYXNoLmdldChmbiBhcyBGdW5jdGlvbikgPz8gZm47XG4gICAgICByZXR1cm4gKC4uLnJlbW90ZUFyZ3M6IChSZWYgfCBKc29uYWJsZSlbXSkgPT4gY2FsbE5vdGUoaGFzaCBhcyBSZWYgfCBKc29uYWJsZSwgcmVtb3RlQXJncyk7XG4gICAgfTtcblxuICAgIC8qKiBSZXR1cm4gYSBjYWxsYWJsZSB3cmFwcGVyIHRoYXQgcnVucyB0aGUgZGVwJ3MgYm9keSB3aXRoIGFyZ3MgYXJyYXksIG93biBzdG9yZS4gKi9cbiAgICBjb25zdCBnZXRGdW5jU3luYyA9IChyZWY6IHN0cmluZyk6ICguLi5jYWxsQXJnczogdW5rbm93bltdKSA9PiB1bmtub3duID0+IHtcbiAgICAgIGNvbnN0IHNyYyA9IG5vdGVDYWNoZS5nZXQocmVmKTtcbiAgICAgIGlmIChzcmMgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IEVycm9yKGBnZXRGdW5jU3luYzogbm90ZSAke3JlZn0gbm90IGluIGNhY2hlYCk7XG4gICAgICBpZiAodHlwZW9mIHNyYyAhPT0gXCJzdHJpbmdcIikgdGhyb3cgbmV3IEVycm9yKGBnZXRGdW5jU3luYzogbm90ZSAke3JlZn0gaXMgbm90IGNvZGVgKTtcbiAgICAgIGNvbnN0IGZuID0gKC4uLmNhbGxBcmdzOiB1bmtub3duW10pID0+IHtcbiAgICAgICAgY29uc3QgZGVwU3RvcmUgPSBtYWtlU3RvcmUocmVmLCBtZW1TdG9yZSwgbHMpO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBydW5XaXRoRnVlbFNoYXJlZChzcmMsIGZ1ZWxSZWYsIHsgLi4uZW52LCBhcmdzOiBjYWxsQXJncywgc3RvcmU6IGRlcFN0b3JlIH0pO1xuICAgICAgICBpZiAoXCJlcnJcIiBpbiByZXN1bHQpIHRocm93IG5ldyBFcnJvcihyZXN1bHQuZXJyKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5vaztcbiAgICAgIH07XG4gICAgICBmblRvSGFzaC5zZXQoZm4sIHJlZik7XG4gICAgICByZXR1cm4gZm47XG4gICAgfTtcblxuICAgIC8qKiBSZXR1cm4gSlNPTiBkYXRhIGZyb20gYSBwcmVmZXRjaGVkIG5vdGUuICovXG4gICAgY29uc3QgZ2V0RGF0YVN5bmMgPSAocmVmOiBzdHJpbmcpOiB1bmtub3duID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBub3RlQ2FjaGUuZ2V0KHJlZik7XG4gICAgICBpZiAoZGF0YSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgRXJyb3IoYGdldERhdGFTeW5jOiBub3RlICR7cmVmfSBub3QgaW4gY2FjaGVgKTtcbiAgICAgIHJldHVybiBkYXRhO1xuICAgIH07XG5cbiAgICBjb25zdCBlbnY6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge1xuICAgICAgLi4uKG9wdGlvbnMuZW52ID8/IHt9KSxcbiAgICAgIGFyZ3MsXG4gICAgICBjYWxsOiBjYWxsTG9jYWwsXG4gICAgICBjYWxsTm90ZTogY2FsbExvY2FsLFxuICAgICAgcmVtb3RlLFxuICAgICAgc3RvcmUsXG4gICAgICBnZXRGdW5jU3luYyxcbiAgICAgIGdldERhdGFTeW5jLFxuICAgICAgYWRkTm90ZSxcbiAgICAgIGdldE5vdGUsXG4gICAgICBhc1JlZixcbiAgICAgIGRlcmVmOiBkZVJlZixcbiAgICAgIGhhc2hEYXRhLFxuICAgICAgZnJvbWpzb24sXG4gICAgICBwcm9tcHRVc2VyLFxuICAgICAgb3BlblJvdXRlclJlcXVlc3QsXG4gICAgICBIVE1MLFxuICAgICAgSlNPTixcbiAgICAgIGNvbnNvbGUsXG4gICAgfTtcblxuICAgIC8vIFByZS1mZXRjaCBhbGwgZGVwIHNvdXJjZXMgYmVmb3JlIGV4ZWN1dGluZ1xuICAgIGNvbnN0IGRlcHMgPSBwYXJzZURlcHMoZm5Ob3RlKTtcbiAgICBmb3IgKGNvbnN0IGRlcCBvZiBkZXBzKSBhd2FpdCBwcmVmZXRjaChkZXApO1xuXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcnVuV2l0aEZ1ZWxTaGFyZWRBc3luYyhcbiAgICAgIGZuTm90ZSxcbiAgICAgIGZ1ZWxSZWYsXG4gICAgICBlbnYsXG4gICAgKTtcblxuICAgIGlmIChcImVyclwiIGluIHJlc3VsdCkgdGhyb3cgbmV3IEVycm9yKHJlc3VsdC5lcnIpO1xuICAgIHJldHVybiByZXN1bHQub2s7XG4gIH07XG5cbiAgcmV0dXJuIGNhbGxMb2NhbDtcbn07XG5cbmV4cG9ydCBjb25zdCBjYWxsTm90ZUNsaWVudCA9IGFzeW5jIChcbiAgZm46IFJlZiB8IEpzb25hYmxlLFxuICBhcmdzPzogKFJlZiB8IEpzb25hYmxlKVtdLFxuICBvcHRpb25zOiBDbGllbnRGdWVsT3B0aW9ucyA9IHt9XG4pOiBQcm9taXNlPEpzb25hYmxlPiA9PiB7XG4gIGNvbnN0IGNhbGxMb2NhbCA9IGNyZWF0ZUxvY2FsRXhlY3V0b3Iob3B0aW9ucyk7XG4gIHJldHVybiAoYXdhaXQgY2FsbExvY2FsKGZuLCBhcmdzID8/IFtdKSkgYXMgSnNvbmFibGU7XG59O1xuXG5leHBvcnQgY29uc3QgY2FsbFZpZXdDbGllbnQgPSBhc3luYyAoXG4gIGZuOiBSZWYgfCBKc29uYWJsZSxcbiAgX2FyZ3M/OiAoUmVmIHwgSnNvbmFibGUpW10sXG4gIG9wdGlvbnM6IENsaWVudEZ1ZWxPcHRpb25zID0ge31cbik6IFByb21pc2U8Vmlldz4gPT4ge1xuICAvLyBWaWV3IG5vdGVzIGhhdmUgaW5saW5lZCBib2RpZXMgXHUyMDE0IGFyZ3NbMF0gaXMgdGhlIHVwcGVyIG9iamVjdC5cbiAgLy8gUHJlLWZldGNoIGRlcCBzb3VyY2VzIGFzeW5jLCB0aGVuIHJldHVybiBhIHN5bmMgd3JhcHBlci5cbiAgY29uc3QgZnVlbEJ1ZGdldCA9IG9wdGlvbnMuZnVlbCA/PyAxMDAwMDA7XG4gIGNvbnN0IGZ1ZWxSZWYgPSB7IHZhbHVlOiBmdWVsQnVkZ2V0IH07XG4gIGNvbnN0IG5vdGVDYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBKc29uYWJsZT4oKTtcbiAgY29uc3QgbWVtU3RvcmUgPSBuZXcgTWFwPHN0cmluZywgSnNvbmFibGU+KCk7XG4gIGNvbnN0IGxzID0gKCgpID0+IHtcbiAgICB0cnkgeyByZXR1cm4gdHlwZW9mIGxvY2FsU3RvcmFnZSAhPT0gXCJ1bmRlZmluZWRcIiA/IGxvY2FsU3RvcmFnZSA6IHVuZGVmaW5lZDsgfSBjYXRjaCB7IHJldHVybiB1bmRlZmluZWQ7IH1cbiAgfSkoKTtcbiAgY29uc3QgcHJvbXB0VXNlciA9IChtZXNzYWdlOiBzdHJpbmcsIGRlZmF1bHRWYWx1ZSA9IFwiXCIpOiBzdHJpbmcgfCBudWxsID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcCA9IChnbG9iYWxUaGlzIGFzIHsgcHJvbXB0PzogKG06IHN0cmluZywgZD86IHN0cmluZykgPT4gc3RyaW5nIHwgbnVsbCB9KS5wcm9tcHQ7XG4gICAgICBpZiAodHlwZW9mIHAgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHAobWVzc2FnZSwgZGVmYXVsdFZhbHVlKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIG5vLW9wXG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9O1xuXG4gIC8vIE1hcCBmcm9tIHdyYXBwZXIgZnVuY3Rpb24gXHUyMTkyIGhhc2ggKGZvciByZW1vdGUoKSB0byByZXNvbHZlKVxuICBjb25zdCBmblRvSGFzaCA9IG5ldyBNYXA8RnVuY3Rpb24sIHN0cmluZz4oKTtcblxuICBjb25zdCBmblJlZiA9IGF3YWl0IGFzUmVmKGZuKTtcbiAgY29uc3QgZm5Ob3RlID0gYXdhaXQgZGVSZWYoZm5SZWYpO1xuICBpZiAodHlwZW9mIGZuTm90ZSAhPT0gXCJzdHJpbmdcIikgdGhyb3cgbmV3IEVycm9yKFwidmlldyBub3RlIG11c3QgcmVzb2x2ZSB0byBhIHN0cmluZ1wiKTtcblxuICAvKiogUmVjdXJzaXZlbHkgZmV0Y2ggZGVwIGRhdGEgaW50byBub3RlQ2FjaGUgKG5vIGV4ZWN1dGlvbikuICovXG4gIGNvbnN0IHByZWZldGNoID0gYXN5bmMgKHJlZjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgaWYgKG5vdGVDYWNoZS5oYXMocmVmKSkgcmV0dXJuO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBkZVJlZihyZWYgYXMgUmVmKTtcbiAgICBub3RlQ2FjaGUuc2V0KHJlZiwgZGF0YSBhcyBKc29uYWJsZSk7XG4gICAgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBmb3IgKGNvbnN0IGRlcCBvZiBwYXJzZURlcHMoZGF0YSkpIGF3YWl0IHByZWZldGNoKGRlcCk7XG4gICAgfVxuICB9O1xuICBmb3IgKGNvbnN0IGRlcCBvZiBwYXJzZURlcHMoZm5Ob3RlKSkgYXdhaXQgcHJlZmV0Y2goZGVwKTtcblxuICBjb25zdCBzdG9yZSA9IG1ha2VTdG9yZShmblJlZiwgbWVtU3RvcmUsIGxzKTtcbiAgY29uc3QgcmVtb3RlID0gKGZuOiB1bmtub3duKTogKC4uLnJlbW90ZUFyZ3M6IChSZWYgfCBKc29uYWJsZSlbXSkgPT4gUHJvbWlzZTxKc29uYWJsZT4gPT4ge1xuICAgIGNvbnN0IGhhc2ggPSBmblRvSGFzaC5nZXQoZm4gYXMgRnVuY3Rpb24pID8/IGZuO1xuICAgIHJldHVybiAoLi4ucmVtb3RlQXJnczogKFJlZiB8IEpzb25hYmxlKVtdKSA9PiBjYWxsTm90ZShoYXNoIGFzIFJlZiB8IEpzb25hYmxlLCByZW1vdGVBcmdzKTtcbiAgfTtcblxuICAvKiogUmV0dXJuIGEgY2FsbGFibGUgd3JhcHBlciB0aGF0IHJ1bnMgdGhlIGRlcCdzIGJvZHkgd2l0aCBhcmdzIGFycmF5LCBvd24gc3RvcmUuICovXG4gIGNvbnN0IGdldEZ1bmNTeW5jID0gKHJlZjogc3RyaW5nKTogKC4uLmNhbGxBcmdzOiB1bmtub3duW10pID0+IHVua25vd24gPT4ge1xuICAgIGNvbnN0IHNyYyA9IG5vdGVDYWNoZS5nZXQocmVmKTtcbiAgICBpZiAoc3JjID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBFcnJvcihgZ2V0RnVuY1N5bmM6IG5vdGUgJHtyZWZ9IG5vdCBpbiBjYWNoZWApO1xuICAgIGlmICh0eXBlb2Ygc3JjICE9PSBcInN0cmluZ1wiKSB0aHJvdyBuZXcgRXJyb3IoYGdldEZ1bmNTeW5jOiBub3RlICR7cmVmfSBpcyBub3QgY29kZWApO1xuICAgIGNvbnN0IGZuID0gKC4uLmNhbGxBcmdzOiB1bmtub3duW10pID0+IHtcbiAgICAgIGNvbnN0IGRlcFN0b3JlID0gbWFrZVN0b3JlKHJlZiwgbWVtU3RvcmUsIGxzKTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHJ1bldpdGhGdWVsU2hhcmVkKHNyYywgZnVlbFJlZiwgeyAuLi5iYXNlRW52LCBhcmdzOiBjYWxsQXJncywgc3RvcmU6IGRlcFN0b3JlIH0pO1xuICAgICAgaWYgKFwiZXJyXCIgaW4gcmVzdWx0KSB0aHJvdyBuZXcgRXJyb3IocmVzdWx0LmVycik7XG4gICAgICByZXR1cm4gcmVzdWx0Lm9rO1xuICAgIH07XG4gICAgZm5Ub0hhc2guc2V0KGZuLCByZWYpO1xuICAgIHJldHVybiBmbjtcbiAgfTtcblxuICAvKiogUmV0dXJuIEpTT04gZGF0YSBmcm9tIGEgcHJlZmV0Y2hlZCBub3RlLiAqL1xuICBjb25zdCBnZXREYXRhU3luYyA9IChyZWY6IHN0cmluZyk6IHVua25vd24gPT4ge1xuICAgIGNvbnN0IGRhdGEgPSBub3RlQ2FjaGUuZ2V0KHJlZik7XG4gICAgaWYgKGRhdGEgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IEVycm9yKGBnZXREYXRhU3luYzogbm90ZSAke3JlZn0gbm90IGluIGNhY2hlYCk7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH07XG5cbiAgY29uc3QgYmFzZUVudjogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7XG4gICAgLi4uKG9wdGlvbnMuZW52ID8/IHt9KSxcbiAgICByZW1vdGUsIGdldEZ1bmNTeW5jLCBnZXREYXRhU3luYywgc3RvcmUsIGFkZE5vdGUsIGdldE5vdGUsIGFzUmVmLCBkZXJlZjogZGVSZWYsIGhhc2hEYXRhLCBmcm9tanNvbiwgcHJvbXB0VXNlciwgb3BlblJvdXRlclJlcXVlc3QsIEhUTUwsIEpTT04sIGNvbnNvbGUsXG4gIH07XG5cbiAgLy8gSW5saW5lZCBib2R5IFx1MjAxNCBhcmdzWzBdIGlzIHRoZSB3aW5kb3cgb2JqZWN0LlxuICByZXR1cm4gKHVwcGVyOiBWaWV3Q29udGV4dCk6IFZEb20gPT4ge1xuICAgIGNvbnN0IHdyYXBwZWRVcHBlcjogVmlld0NvbnRleHQgPSB7XG4gICAgICAuLi51cHBlcixcbiAgICAgIG9uVXNlckV2ZW50OiAoKSA9PiB7XG4gICAgICAgIC8vIFJlZmlsbCBidWRnZXQgb24gZXhwbGljaXQgdXNlciBpbnRlcmFjdGlvbjsga2VlcCBzaGFyZWQgY2FwIHRvIHByZXNlcnZlIGFudGktbG9vcCBiZWhhdmlvci5cbiAgICAgICAgZnVlbFJlZi52YWx1ZSA9IGZ1ZWxCdWRnZXQ7XG4gICAgICB9LFxuICAgIH1cbiAgICBjb25zdCByZXN1bHQgPSBydW5XaXRoRnVlbFNoYXJlZChmbk5vdGUsIGZ1ZWxSZWYsIHsgLi4uYmFzZUVudiwgYXJnczogW3dyYXBwZWRVcHBlcl0gfSk7XG4gICAgaWYgKFwiZXJyXCIgaW4gcmVzdWx0KSB0aHJvdyBuZXcgRXJyb3IocmVzdWx0LmVycik7XG4gICAgcmV0dXJuIHJlc3VsdC5vayBhcyBWRG9tO1xuICB9O1xufTtcbiIsICJpbXBvcnQgeyBjYWxsVmlld0NsaWVudCwgSFRNTCwgcmVuZGVyRG9tIH0gZnJvbSBcIkBoYXNobm90ZXMvbGliXCI7XG5pbXBvcnQgeyBpc1JlZiwgdG9qc29uLCB0eXBlIFJlZiB9IGZyb20gXCJAaGFzaG5vdGVzL2NvcmUvbm90ZXNcIjtcbmltcG9ydCB7IGdldE5vdGUsIGdldFNlcnZlciB9IGZyb20gXCIuLi8uLi9saWIvc3JjL2RiXCI7XG5cbmNvbnN0IERFVl9VUkwgPSBcImh0dHA6Ly9sb2NhbGhvc3Q6NDMyMVwiO1xudHlwZSBIaXN0b3J5RW50cnkgPSB7IHRzSGFzaDogc3RyaW5nOyBqc0hhc2g6IHN0cmluZzsgZXhwb3J0TmFtZTogc3RyaW5nOyBmaWxlbmFtZT86IHN0cmluZyB9O1xuXG5jb25zdCBlbCA9ICh0YWc6IHN0cmluZywgdGV4dD86IHN0cmluZyk6IEhUTUxFbGVtZW50ID0+IHtcbiAgY29uc3QgZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgaWYgKHRleHQpIGUudGV4dENvbnRlbnQgPSB0ZXh0O1xuICByZXR1cm4gZTtcbn07XG5cbmNvbnN0IGVycm9yVGV4dCA9IChlcnI6IHVua25vd24pOiBzdHJpbmcgPT4ge1xuICBpZiAoZXJyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICBjb25zdCBzdGFjayA9IGVyci5zdGFjayA/IGBcXG4ke2Vyci5zdGFja31gIDogXCJcIjtcbiAgICByZXR1cm4gYCR7ZXJyLm5hbWV9OiAke2Vyci5tZXNzYWdlfSR7c3RhY2t9YDtcbiAgfVxuICByZXR1cm4gU3RyaW5nKGVycik7XG59O1xuXG5jb25zdCByZXBvcnREZXZFcnJvciA9IGFzeW5jIChzb3VyY2U6IHN0cmluZywgZXJyOiB1bmtub3duKSA9PiB7XG4gIGNvbnN0IG1lc3NhZ2UgPSBlcnJvclRleHQoZXJyKTtcbiAgY29uc3Qgc3RhY2sgPSBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IChlcnIuc3RhY2sgfHwgXCJcIikgOiBcIlwiO1xuICB0cnkge1xuICAgIGF3YWl0IGZldGNoKGAke0RFVl9VUkx9L2Jyb3dzZXItZXJyb3JgLCB7XG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBzb3VyY2UsXG4gICAgICAgIG1lc3NhZ2UsXG4gICAgICAgIHN0YWNrLFxuICAgICAgICBwYWdlOiB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUsXG4gICAgICB9KSxcbiAgICB9KTtcbiAgfSBjYXRjaCB7XG4gICAgLy8gUmVwb3J0aW5nIHNob3VsZCBuZXZlciBicmVhayB0aGUgVUkgZmxvdy5cbiAgfVxufTtcblxuY29uc3QgcmVuZGVyRXJyb3JQYW5lbCA9IChcbiAgbW91bnQ6IEhUTUxFbGVtZW50LFxuICB0aXRsZTogc3RyaW5nLFxuICBlcnI6IHVua25vd24sXG4gIGNvbnRleHQ6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fSxcbikgPT4ge1xuICBtb3VudC5pbm5lckhUTUwgPSBcIlwiO1xuXG4gIGNvbnN0IGJveCA9IGVsKFwiZGl2XCIpO1xuICBib3guc3R5bGUuY3NzVGV4dCA9IFwibWFyZ2luOjhweCAwO3BhZGRpbmc6MTJweDtib3JkZXI6MXB4IHNvbGlkICNiNDQ7YmFja2dyb3VuZDpyZ2JhKDE4MCw2OCw2OCwwLjEyKTtcIjtcblxuICBjb25zdCBoID0gZWwoXCJoM1wiLCB0aXRsZSk7XG4gIGguc3R5bGUuY3NzVGV4dCA9IFwibWFyZ2luOjAgMCA4cHggMDtmb250LXNpemU6MXJlbTtcIjtcbiAgYm94LmFwcGVuZChoKTtcblxuICBjb25zdCBtZXRhID0gT2JqZWN0LmVudHJpZXMoY29udGV4dClcbiAgICAubWFwKChbaywgdl0pID0+IGAke2t9OiAke3Z9YClcbiAgICAuam9pbihcIlxcblwiKTtcbiAgaWYgKG1ldGEpIHtcbiAgICBjb25zdCBtID0gZWwoXCJwcmVcIiwgbWV0YSk7XG4gICAgbS5zdHlsZS5jc3NUZXh0ID0gXCJtYXJnaW46MCAwIDhweCAwO3doaXRlLXNwYWNlOnByZS13cmFwO29wYWNpdHk6MC44NTtcIjtcbiAgICBib3guYXBwZW5kKG0pO1xuICB9XG5cbiAgY29uc3QgYm9keSA9IGVsKFwicHJlXCIsIGVycm9yVGV4dChlcnIpKTtcbiAgYm9keS5zdHlsZS5jc3NUZXh0ID0gXCJtYXJnaW46MDt3aGl0ZS1zcGFjZTpwcmUtd3JhcDtvdmVyZmxvdzphdXRvO21heC1oZWlnaHQ6NTB2aDtcIjtcbiAgYm94LmFwcGVuZChib2R5KTtcbiAgbW91bnQuYXBwZW5kKGJveCk7XG59O1xuXG5jb25zdCBwYXJzZVBhdGhTZWcgPSAocGF0aG5hbWU6IHN0cmluZywgaWR4OiBudW1iZXIpOiBzdHJpbmcgPT4ge1xuICBjb25zdCBzZWdzID0gcGF0aG5hbWUucmVwbGFjZSgvXlxcLysvLCBcIlwiKS5zcGxpdChcIi9cIik7XG4gIGlmIChpZHggPCAwIHx8IGlkeCA+PSBzZWdzLmxlbmd0aCkgcmV0dXJuIFwiXCI7XG4gIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoc2Vnc1tpZHhdKS50cmltKCk7XG59O1xuXG5jb25zdCBwYXJzZVJlZkF0ID0gKHBhdGhuYW1lOiBzdHJpbmcsIGlkeDogbnVtYmVyKTogUmVmIHwgbnVsbCA9PiB7XG4gIGNvbnN0IHNlZyA9IHBhcnNlUGF0aFNlZyhwYXRobmFtZSwgaWR4KTtcbiAgaWYgKCFzZWcpIHJldHVybiBudWxsO1xuICBpZiAoaXNSZWYoc2VnKSkgcmV0dXJuIHNlZztcbiAgaWYgKC9eW2EtZjAtOV17MzJ9JC9pLnRlc3Qoc2VnKSkgcmV0dXJuIGAjJHtzZWd9YDtcbiAgcmV0dXJuIG51bGw7XG59O1xuXG5jb25zdCBzdGFydFBvbGxpbmcgPSAobW91bnQ6IEhUTUxFbGVtZW50LCBwb2xsOiAoKSA9PiBQcm9taXNlPHZvaWQ+KSA9PiB7XG4gIG1vdW50LmlubmVySFRNTCA9IFwiXCI7XG4gIG1vdW50LnRleHRDb250ZW50ID0gXCJDb25uZWN0aW5nIHRvIGRldiBzZXJ2ZXIuLi5cIjtcbiAgY29uc3QgcnVuID0gYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBwb2xsKCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwibGl2ZSBwb2xsIGZhaWxlZFwiLCBlcnIpO1xuICAgICAgdm9pZCByZXBvcnREZXZFcnJvcihcInBvbGxcIiwgZXJyKTtcbiAgICB9XG4gIH07XG4gIHJ1bigpO1xuICBzZXRJbnRlcnZhbChydW4sIDUwMCk7XG59O1xuXG5jb25zdCBmZXRjaEhpc3RvcnkgPSBhc3luYyAoKTogUHJvbWlzZTxIaXN0b3J5RW50cnlbXT4gPT5cbiAgSlNPTi5wYXJzZShhd2FpdCAoYXdhaXQgZmV0Y2goYCR7REVWX1VSTH0vaGlzdG9yeWApKS50ZXh0KCkpO1xuXG5jb25zdCBsYXRlc3RWaWV3ID0gKGhpc3Rvcnk6IEhpc3RvcnlFbnRyeVtdKSA9PlxuICBbLi4uaGlzdG9yeV0ucmV2ZXJzZSgpLmZpbmQoZSA9PiBlLmV4cG9ydE5hbWUgPT09IFwidmlld1wiIHx8IGUuZXhwb3J0TmFtZSA9PT0gXCJkZWZhdWx0XCIpO1xuXG5jb25zdCByZW5kZXJSZWYgPSBhc3luYyAobW91bnQ6IEhUTUxFbGVtZW50LCByZWY6IFJlZikgPT4ge1xuICBjb25zdCBub3RlID0gYXdhaXQgZ2V0Tm90ZShyZWYpO1xuICB0cnkge1xuICAgIGNvbnN0IHZpZXcgPSBhd2FpdCBjYWxsVmlld0NsaWVudChyZWYpO1xuICAgIG1vdW50LmlubmVySFRNTCA9IFwiXCI7XG4gICAgbW91bnQuYXBwZW5kKHJlbmRlckRvbSh2aWV3LCB7IHBhdGhuYW1lOiB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgfSkpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICB2b2lkIHJlcG9ydERldkVycm9yKFwicmVuZGVyUmVmXCIsIGVycik7XG4gICAgcmVuZGVyRXJyb3JQYW5lbChtb3VudCwgXCJGYWlsZWQgdG8gcmVuZGVyIG5vdGUgdmlld1wiLCBlcnIsIHtcbiAgICAgIHJlZixcbiAgICAgIHBhdGg6IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSxcbiAgICAgIG5vdGU6IHRvanNvbihub3RlKSxcbiAgICB9KTtcbiAgfVxufTtcblxuY29uc3QgcmVuZGVyUmF3UmVmID0gYXN5bmMgKG1vdW50OiBIVE1MRWxlbWVudCwgcmVmOiBSZWYpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBub3RlID0gYXdhaXQgZ2V0Tm90ZShyZWYpO1xuICAgIG1vdW50LmlubmVySFRNTCA9IFwiXCI7XG4gICAgY29uc3Qgd3JhcCA9IGVsKFwiZGl2XCIpO1xuICAgIHdyYXAuc3R5bGUuY3NzVGV4dCA9IFwicGFkZGluZzo4cHg7XCI7XG4gICAgY29uc3QgaCA9IGVsKFwiaDNcIiwgYHJhdyBub3RlICR7cmVmfWApO1xuICAgIGguc3R5bGUuY3NzVGV4dCA9IFwibWFyZ2luOjAgMCA4cHggMDtmb250LXNpemU6MXJlbTtcIjtcbiAgICBjb25zdCBwcmUgPSBlbChcInByZVwiLCB0b2pzb24obm90ZSkpO1xuICAgIHByZS5zdHlsZS5jc3NUZXh0ID0gXCJtYXJnaW46MDt3aGl0ZS1zcGFjZTpwcmUtd3JhcDtvdmVyZmxvdzphdXRvO21heC1oZWlnaHQ6NzB2aDtcIjtcbiAgICB3cmFwLmFwcGVuZChoLCBwcmUpO1xuICAgIG1vdW50LmFwcGVuZCh3cmFwKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdm9pZCByZXBvcnREZXZFcnJvcihcInJlbmRlclJhd1JlZlwiLCBlcnIpO1xuICAgIHJlbmRlckVycm9yUGFuZWwobW91bnQsIFwiRmFpbGVkIHRvIGxvYWQgcmF3IG5vdGVcIiwgZXJyLCB7XG4gICAgICByZWYsXG4gICAgICBwYXRoOiB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUsXG4gICAgfSk7XG4gIH1cbn07XG5cbmNvbnN0IGJvb3RMaXZlVmlldyA9IChtb3VudDogSFRNTEVsZW1lbnQsIHBhdGg6IHN0cmluZykgPT4ge1xuICBsZXQgbGFzdCA9IFwiXCI7XG4gIGxldCBsYXN0RXJyb3JLZXkgPSBcIlwiO1xuICBzdGFydFBvbGxpbmcobW91bnQsIGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgaGlzdG9yeSA9IGF3YWl0IGZldGNoSGlzdG9yeSgpO1xuICAgICAgY29uc3QgdmlldyA9IGxhdGVzdFZpZXcoaGlzdG9yeSk7XG4gICAgICBpZiAoIXZpZXcpIHsgbW91bnQuaW5uZXJIVE1MID0gXCJcIjsgbW91bnQuYXBwZW5kKGVsKFwicFwiLCBcIk5vIHZpZXcgZm91bmQuXCIpKTsgcmV0dXJuOyB9XG4gICAgICBpZiAodmlldy5qc0hhc2ggPT09IGxhc3QpIHJldHVybjtcbiAgICAgIGxhc3QgPSB2aWV3LmpzSGFzaDtcblxuICAgICAgY29uc3QgYmFyID0gZWwoXCJkaXZcIik7XG4gICAgICBiYXIuc3R5bGUuY3NzVGV4dCA9IFwicGFkZGluZzo0cHggOHB4O2ZvbnQtc2l6ZTowLjg1ZW07b3BhY2l0eTowLjY7XCI7XG4gICAgICBjb25zdCBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG4gICAgICBhLmhyZWYgPSBgL3ZpZXcvJHt2aWV3LmpzSGFzaC5zbGljZSgxKX1gO1xuICAgICAgYS50ZXh0Q29udGVudCA9IGAke3ZpZXcuZmlsZW5hbWUgPz8gdmlldy5leHBvcnROYW1lfSBcdTIxOTIgJHt2aWV3LmpzSGFzaC5zbGljZSgwLCAxNCl9XHUyMDI2YDtcbiAgICAgIGJhci5hcHBlbmQoYSk7XG5cbiAgICAgIGNvbnN0IHJlbmRlcmVkID0gcmVuZGVyRG9tKGF3YWl0IGNhbGxWaWV3Q2xpZW50KHZpZXcuanNIYXNoIGFzIFJlZiksIHsgcGF0aG5hbWU6IHBhdGgucmVwbGFjZShcIi9saXZlL3ZpZXdcIiwgXCJcIikgfHwgXCIvXCIgfSk7XG4gICAgICBtb3VudC5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgbW91bnQuYXBwZW5kKGJhciwgcmVuZGVyZWQpO1xuICAgICAgbGFzdEVycm9yS2V5ID0gXCJcIjtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnN0IGtleSA9IGVycm9yVGV4dChlcnIpO1xuICAgICAgdm9pZCByZXBvcnREZXZFcnJvcihcImJvb3RMaXZlVmlld1wiLCBlcnIpO1xuICAgICAgaWYgKGtleSAhPT0gbGFzdEVycm9yS2V5KSB7XG4gICAgICAgIHJlbmRlckVycm9yUGFuZWwobW91bnQsIFwiRmFpbGVkIHRvIHJlbmRlciBsYXRlc3QgbGl2ZSB2aWV3XCIsIGVyciwge1xuICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgcmV0cnk6IFwiYXV0b21hdGljICg1MDBtcylcIixcbiAgICAgICAgfSk7XG4gICAgICAgIGxhc3RFcnJvcktleSA9IGtleTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufTtcblxuY29uc3QgYm9vdExpdmVJbmRleCA9IChtb3VudDogSFRNTEVsZW1lbnQpID0+IHtcbiAgbGV0IGxhc3QgPSBcIlwiO1xuICBzdGFydFBvbGxpbmcobW91bnQsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBqc29uID0gYXdhaXQgKGF3YWl0IGZldGNoKGAke0RFVl9VUkx9L2hpc3RvcnlgKSkudGV4dCgpO1xuICAgIGlmIChqc29uID09PSBsYXN0KSByZXR1cm47XG4gICAgbGFzdCA9IGpzb247XG5cbiAgICBjb25zdCBoaXN0b3J5OiBIaXN0b3J5RW50cnlbXSA9IEpTT04ucGFyc2UoanNvbik7XG4gICAgbW91bnQuaW5uZXJIVE1MID0gXCJcIjtcbiAgICBtb3VudC5hcHBlbmQoZWwoXCJoMlwiLCBcImhhc2hub3RlcyBkZXZcIikpO1xuICAgIG1vdW50LmFwcGVuZChlbChcInBcIiwgYCR7aGlzdG9yeS5sZW5ndGh9IGNvbXBpbGVkIG5vdGVzICgke2dldFNlcnZlcigpfSlgKSk7XG5cbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGhpc3RvcnkpIHtcbiAgICAgIGNvbnN0IHJvdyA9IGVsKFwiZGl2XCIpO1xuICAgICAgY29uc3QgaXNWaWV3ID0gZW50cnkuZXhwb3J0TmFtZSA9PT0gXCJ2aWV3XCIgfHwgZW50cnkuZXhwb3J0TmFtZSA9PT0gXCJkZWZhdWx0XCI7XG4gICAgICBpZiAoaXNWaWV3KSB7XG4gICAgICAgIGNvbnN0IGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcbiAgICAgICAgYS5ocmVmID0gYC92aWV3LyR7ZW50cnkuanNIYXNoLnNsaWNlKDEpfWA7XG4gICAgICAgIGEudGV4dENvbnRlbnQgPSBlbnRyeS5leHBvcnROYW1lO1xuICAgICAgICByb3cuYXBwZW5kKGEpO1xuICAgICAgICBjb25zdCByYXcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcbiAgICAgICAgcmF3LmhyZWYgPSBgLyR7ZW50cnkuanNIYXNoLnNsaWNlKDEpfWA7XG4gICAgICAgIHJhdy50ZXh0Q29udGVudCA9IFwiIChyYXcpXCI7XG4gICAgICAgIHJhdy5zdHlsZS5jc3NUZXh0ID0gXCJvcGFjaXR5OjAuNTtmb250LXNpemU6MC44NWVtO1wiO1xuICAgICAgICByb3cuYXBwZW5kKHJhdyk7XG4gICAgICAgIGNvbnN0IGxpdmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcbiAgICAgICAgbGl2ZS5ocmVmID0gXCIvbGl2ZS92aWV3XCI7XG4gICAgICAgIGxpdmUudGV4dENvbnRlbnQgPSBcIiAobGl2ZSlcIjtcbiAgICAgICAgbGl2ZS5zdHlsZS5jc3NUZXh0ID0gXCJvcGFjaXR5OjAuNTtmb250LXNpemU6MC44NWVtO1wiO1xuICAgICAgICByb3cuYXBwZW5kKGxpdmUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgc3BhbiA9IGVsKFwic3BhblwiLCBlbnRyeS5leHBvcnROYW1lKTtcbiAgICAgICAgc3Bhbi5zdHlsZS5vcGFjaXR5ID0gXCIwLjVcIjtcbiAgICAgICAgcm93LmFwcGVuZChzcGFuKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGhhc2ggPSBlbChcInNwYW5cIiwgYCAke2VudHJ5LmpzSGFzaC5zbGljZSgwLCAxNCl9XHUyMDI2YCk7XG4gICAgICBoYXNoLnN0eWxlLmNzc1RleHQgPSBcIm9wYWNpdHk6MC40O2ZvbnQtc2l6ZTowLjg1ZW07XCI7XG4gICAgICByb3cuYXBwZW5kKGhhc2gpO1xuICAgICAgbW91bnQuYXBwZW5kKHJvdyk7XG4gICAgfVxuICB9KTtcbn07XG5cbmV4cG9ydCBjb25zdCBib290ID0gYXN5bmMgKCkgPT4ge1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImVycm9yXCIsIChldikgPT4ge1xuICAgIHZvaWQgcmVwb3J0RGV2RXJyb3IoXCJ3aW5kb3cub25lcnJvclwiLCBldi5lcnJvciB8fCBldi5tZXNzYWdlKTtcbiAgfSk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwidW5oYW5kbGVkcmVqZWN0aW9uXCIsIChldikgPT4ge1xuICAgIHZvaWQgcmVwb3J0RGV2RXJyb3IoXCJ3aW5kb3cudW5oYW5kbGVkcmVqZWN0aW9uXCIsIGV2LnJlYXNvbik7XG4gIH0pO1xuXG4gIGNvbnN0IG1vdW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhcHBcIikgPz8gZG9jdW1lbnQuYm9keTtcbiAgY29uc3QgcGF0aCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5yZXBsYWNlKC9cXC8rJC8sIFwiXCIpO1xuXG4gIGlmIChwYXRoLnN0YXJ0c1dpdGgoXCIvbGl2ZS92aWV3XCIpKSByZXR1cm4gYm9vdExpdmVWaWV3KG1vdW50LCBwYXRoKTtcbiAgaWYgKHBhdGggPT09IFwiL2xpdmVcIikgcmV0dXJuIGJvb3RMaXZlSW5kZXgobW91bnQpO1xuXG4gIGlmIChwYXRoLnN0YXJ0c1dpdGgoXCIvdmlldy9cIikpIHtcbiAgICBjb25zdCByZWYgPSBwYXJzZVJlZkF0KHBhdGgsIDEpO1xuICAgIGlmICghcmVmKSB7IG1vdW50LnRleHRDb250ZW50ID0gXCJPcGVuIC92aWV3Lzxub3RlLWhhc2g+IHRvIHJlbmRlciB0aGF0IG5vdGUgYXMgYSB2aWV3LlwiOyByZXR1cm47IH1cbiAgICBhd2FpdCByZW5kZXJSZWYobW91bnQsIHJlZik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgcmVmID0gcGFyc2VSZWZBdChwYXRoLCAwKTtcbiAgaWYgKCFyZWYpIHtcbiAgICBtb3VudC50ZXh0Q29udGVudCA9IFwiT3BlbiAvPG5vdGUtaGFzaD4gZm9yIHJhdyBkYXRhIG9yIC92aWV3Lzxub3RlLWhhc2g+IHRvIHJlbmRlciBhcyBhIHZpZXcuXCI7XG4gICAgcmV0dXJuO1xuICB9XG4gIGF3YWl0IHJlbmRlclJhd1JlZihtb3VudCwgcmVmKTtcbn07XG4iLCAiaW1wb3J0IHsgYm9vdCB9IGZyb20gXCIuL21haW4udHNcIjtcblxuYm9vdCgpLmNhdGNoKChlcnIpID0+IHtcbiAgY29uc29sZS5lcnJvcihlcnIpO1xuICBjb25zdCBtb3VudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYXBwXCIpID8/IGRvY3VtZW50LmJvZHk7XG4gIG1vdW50LnRleHRDb250ZW50ID0gYEFwcCBib290IGZhaWxlZDogJHtTdHJpbmcoZXJyKX1gO1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBTUEsSUFBTSxjQUFpQyxDQUFDLFNBQVMsYUFBYSxXQUFXLGFBQWEsUUFBUSxPQUFPO0FBQ3JHLElBQU0saUJBQXVDLENBQUMsV0FBVyxPQUFPO0FBQ2hFLElBQU0sZUFBZTtBQUNyQixJQUFNLFVBQVUsb0JBQUksSUFBSSxDQUFDLE9BQU8sUUFBUSxLQUFLLFFBQVEsWUFBWSxXQUFXLFVBQVUsV0FBVyxRQUFRLE1BQU0sQ0FBQztBQUNoSCxJQUFNLHdCQUF3QixvQkFBSSxJQUFJLENBQUMsV0FBVSxTQUFRLFVBQVMsU0FBUSxLQUFJLFFBQU8sVUFBUyxnQkFBZSxrQkFBaUIsbUJBQWtCLG9CQUFtQixxQkFBb0IsS0FBSSxLQUFJLE1BQUssTUFBSyxNQUFLLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxNQUFLLFVBQVMsYUFBWSxXQUFVLGFBQVksZUFBYyxlQUFjLGVBQWMscUJBQW9CLE1BQUssTUFBSyxRQUFPLFVBQVMsS0FBSyxDQUFDO0FBcURwWCxJ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SUFBSSxJQUFJLElBQUksR0FBRyxLQUFLLEdBQUcsSUFBSSxJQUFJLElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEtBQUssSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksSUFBSSxJQUFJLEdBQUcsS0FBSyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxJQUFJLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxHQUFHLEtBQUssSUFBSSxLQUFLLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsS0FBSyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksSUFBSSxJQUFJLElBQUksS0FBSyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksSUFBSSxHQUFHLElBQUksS0FBSyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEtBQUssR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFJLE1BQU0sR0FBRyxHQUFHLElBQUksT0FBTyxJQUFJLE1BQU0sR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsS0FBSyxHQUFHLEtBQUssR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsT0FBTyxHQUFHLE1BQU0sR0FBRyxLQUFLLElBQUksR0FBRyxJQUFJLEtBQUssR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsS0FBSyxHQUFHLE1BQU0sSUFBSSxLQUFLLElBQUksR0FBRyxJQUFJLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEtBQUssR0FBRyxLQUFLLEdBQUcsSUFBSSxHQUFHLEtBQUssR0FBRyxJQUFJLElBQUksS0FBSyxJQUFJLEtBQUssR0FBRyxHQUFHLEdBQUcsS0FBSyxHQUFHLEtBQUssR0FBRyxHQUFHLEdBQUcsTUFBTSxHQUFHLFFBQVEsR0FBRztBQUd6b0MsSUFBSSw2QkFBNkIsQ0FBQyxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxJQUFJLEtBQUssSUFBSSxJQUFJLEtBQUssSUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksS0FBSyxJQUFJLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksSUFBSSxLQUFLLElBQUksSUFBSSxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksR0FBRyxHQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksSUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxLQUFLLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxLQUFLLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxJQUFJLElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLElBQUksSUFBSSxHQUFHLEdBQUcsR0FBRyxLQUFLLElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxJQUFJLElBQUksSUFBSSxHQUFHLEtBQUssSUFBSSxLQUFLLElBQUksSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLElBQUksSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxJQUFJLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxJQUFJLElBQUksS0FBSyxJQUFJLElBQUksR0FBRyxHQUFHLElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxLQUFLLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksSUFBSSxHQUFHLEtBQUssSUFBSSxJQUFJLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxLQUFLLEdBQUcsSUFBSSxLQUFLLEtBQUssS0FBSyxJQUFJLEtBQUssTUFBTSxJQUFJLElBQUksTUFBTSxJQUFJLEdBQUcsSUFBSSxNQUFNLEdBQUcsS0FBSyxNQUFNLElBQUksTUFBTSxLQUFLLEdBQUcsSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLEdBQUcsSUFBSSxLQUFLLElBQUksS0FBSyxJQUFJLEtBQUssSUFBSSxHQUFHLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxNQUFNLEdBQUcsTUFBTSxJQUFJLEdBQUcsTUFBTSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFLLElBQUksR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEtBQUssTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLE1BQU0sSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsS0FBSyxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLE1BQU0sSUFBSSxHQUFHLEdBQUcsS0FBSyxJQUFJLEtBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxHQUFHLEtBQUssSUFBSSxJQUFJLElBQUksS0FBSyxJQUFJLEtBQUssSUFBSSxHQUFHLEdBQUcsS0FBSyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsS0FBSyxJQUFJLElBQUksR0FBRyxHQUFHLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLE1BQU0sT0FBTyxJQUFJLE1BQU0sR0FBRyxLQUFLLEdBQUcsTUFBTSxJQUFJLE1BQU0sSUFBSSxLQUFLLE1BQU0sS0FBSyxNQUFNLE1BQU0sR0FBRyxJQUFJO0FBR25wRSxJQUFJLDBCQUEwQjtBQUc5QixJQUFJLCtCQUErQjtBQVNuQyxJQUFJLGdCQUFnQjtB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VTtBQUNyQixVQUFJLE9BQU8sSUFBSTtBQUNmLFlBQU0sT0FBTyxHQUFHO0FBQUEsSUFDbEI7QUFBQSxFQUNGLENBQUM7QUFDSDtBQUVPLElBQU0sT0FBTyxZQUFZO0FBQzlCLFNBQU8saUJBQWlCLFNBQVMsQ0FBQyxPQUFPO0FBQ3ZDLFNBQUssZUFBZSxrQkFBa0IsR0FBRyxTQUFTLEdBQUcsT0FBTztBQUFBLEVBQzlELENBQUM7QUFDRCxTQUFPLGlCQUFpQixzQkFBc0IsQ0FBQyxPQUFPO0FBQ3BELFNBQUssZUFBZSw2QkFBNkIsR0FBRyxNQUFNO0FBQUEsRUFDNUQsQ0FBQztBQUVELFFBQU0sUUFBUSxTQUFTLGVBQWUsS0FBSyxLQUFLLFNBQVM7QUFDekQsUUFBTUEsUUFBTyxPQUFPLFNBQVMsU0FBUyxRQUFRLFFBQVEsRUFBRTtBQUV4RCxNQUFJQSxNQUFLLFdBQVcsWUFBWSxFQUFHLFFBQU8sYUFBYSxPQUFPQSxLQUFJO0FBQ2xFLE1BQUlBLFVBQVMsUUFBUyxRQUFPLGNBQWMsS0FBSztBQUVoRCxNQUFJQSxNQUFLLFdBQVcsUUFBUSxHQUFHO0FBQzdCLFVBQU1ELE9BQU0sV0FBV0MsT0FBTSxDQUFDO0FBQzlCLFFBQUksQ0FBQ0QsTUFBSztBQUFFLFlBQU0sY0FBYztBQUF5RDtBQUFBLElBQVE7QUFDakcsVUFBTSxVQUFVLE9BQU9BLElBQUc7QUFDMUI7QUFBQSxFQUNGO0FBRUEsUUFBTUEsT0FBTSxXQUFXQyxPQUFNLENBQUM7QUFDOUIsTUFBSSxDQUFDRCxNQUFLO0FBQ1IsVUFBTSxjQUFjO0FBQ3BCO0FBQUEsRUFDRjtBQUNBLFFBQU0sYUFBYSxPQUFPQSxJQUFHO0FBQy9COzs7QUN0UEEsS0FBSyxFQUFFLE1BQU0sQ0FBQyxRQUFRO0FBQ3BCLFVBQVEsTUFBTSxHQUFHO0FBQ2pCLFFBQU0sUUFBUSxTQUFTLGVBQWUsS0FBSyxLQUFLLFNBQVM7QUFDekQsUUFBTSxjQUFjLG9CQUFvQixPQUFPLEdBQUcsQ0FBQztBQUNyRCxDQUFDOyIsCiAgIm5hbWVzIjogWyJlbCIsICJvZmZzZXQiLCAiZGF0YSIsICJ0ZXh0IiwgImRhdGEiLCAiVG9rZW5UeXBlIiwgIlBvc2l0aW9uIiwgIlNvdXJjZUxvY2F0aW9uIiwgIm9mZnNldCIsICJ0ZXh0IiwgIlBhcnNlciIsICJyZWYiLCAicGFyc2UiLCAiRGVzdHJ1Y3R1cmluZ0Vycm9ycyIsICJUb2tDb250ZXh0IiwgIlNjb3BlIiwgIk5vZGUiLCAiQnJhbmNoSUQiLCAiUmVnRXhwVmFsaWRhdGlvblN0YXRlIiwgImN1cnJlbnQiLCAiVG9rZW4iLCAiZWwiLCAicGFyc2UiLCAiZWwiLCAiZW52IiwgImVudiIsICJwYXJzZSIsICJ0ZXh0IiwgImRhdGEiLCAibm90ZUNhY2hlIiwgInJlZiIsICJkYXRhIiwgImZuIiwgInRleHQiLCAicmVmIiwgInBhdGgiXQp9Cg==
