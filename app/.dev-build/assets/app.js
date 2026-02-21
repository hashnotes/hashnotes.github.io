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
    upper.onUserEvent = () => {
      fuelRef.value = fuelBudget;
    };
    const result = runWithFuelShared(fnNote, fuelRef, { ...baseEnv, args: [upper] });
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vbGliL3NyYy92aWV3cy50cyIsICIuLi8uLi8uLi9jb3JlL3NyYy9ub3Rlcy50cyIsICIuLi8uLi8uLi9saWIvc3JjL2RiLnRzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9hY29ybi9kaXN0L2Fjb3JuLm1qcyIsICIuLi8uLi8uLi9jb3JlL3NyYy9wYXJzZXIudHMiLCAiLi4vLi4vLi4vY29yZS9zcmMvY29kZWdlbi50cyIsICIuLi8uLi8uLi9saWIvc3JjL29wZW5yb3V0ZXIudHMiLCAiLi4vLi4vLi4vbGliL3NyYy9ydW50aW1lLnRzIiwgIi4uLy4uL3NyYy9tYWluLnRzIiwgIi4uLy4uL3NyYy9lbnRyeS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gcGFnZSB2aWV3XG5cbnR5cGUgTW91c2VFdmVudFR5cGUgPSBcImNsaWNrXCJ8IFwibW91c2Vtb3ZlXCIgfCBcIm1vdXNldXBcIiB8IFwibW91c2Vkb3duXCIgfCBcImRyYWdcIiB8IFwid2hlZWxcIlxudHlwZSBLZXlib2FyZEV2ZW50VHlwZSA9IFwia2V5ZG93blwiIHwgXCJrZXl1cFwiXG50eXBlIERvbUV2ZW50VHlwZSA9IE1vdXNlRXZlbnRUeXBlIHwgS2V5Ym9hcmRFdmVudFR5cGU7XG5cbmNvbnN0IG1vdXNlRXZlbnRzIDogTW91c2VFdmVudFR5cGVbXSA9IFtcImNsaWNrXCIsIFwibW91c2Vtb3ZlXCIsIFwibW91c2V1cFwiLCBcIm1vdXNlZG93blwiLCBcImRyYWdcIiwgXCJ3aGVlbFwiXTtcbmNvbnN0IGtleWJvYXJkRXZlbnRzIDogS2V5Ym9hcmRFdmVudFR5cGVbXSA9IFtcImtleWRvd25cIiwgXCJrZXl1cFwiXTtcbmNvbnN0IHN2Z05hbWVzcGFjZSA9IFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIjtcbmNvbnN0IHN2Z1RhZ3MgPSBuZXcgU2V0KFtcInN2Z1wiLCBcInBhdGhcIiwgXCJnXCIsIFwibGluZVwiLCBcInBvbHlsaW5lXCIsIFwicG9seWdvblwiLCBcImNpcmNsZVwiLCBcImVsbGlwc2VcIiwgXCJyZWN0XCIsIFwidGV4dFwiXSk7XG5jb25zdCBhbGxvd2VkQXR0cmlidXRlTmFtZXMgPSBuZXcgU2V0KFtcInZpZXdCb3hcIixcIndpZHRoXCIsXCJoZWlnaHRcIixcInhtbG5zXCIsXCJkXCIsXCJmaWxsXCIsXCJzdHJva2VcIixcInN0cm9rZS13aWR0aFwiLFwic3Ryb2tlLWxpbmVjYXBcIixcInN0cm9rZS1saW5lam9pblwiLFwic3Ryb2tlLWRhc2hhcnJheVwiLFwic3Ryb2tlLWRhc2hvZmZzZXRcIixcInhcIixcInlcIixcIngxXCIsXCJ5MVwiLFwieDJcIixcInkyXCIsXCJjeFwiLFwiY3lcIixcInJcIixcInJ4XCIsXCJyeVwiLFwicG9pbnRzXCIsXCJ0cmFuc2Zvcm1cIixcIm9wYWNpdHlcIixcImZvbnQtc2l6ZVwiLFwiZm9udC1mYW1pbHlcIixcImZvbnQtd2VpZ2h0XCIsXCJ0ZXh0LWFuY2hvclwiLFwiZG9taW5hbnQtYmFzZWxpbmVcIixcImR4XCIsXCJkeVwiLFwiaHJlZlwiLFwidGFyZ2V0XCIsXCJyZWxcIl0pO1xuXG5cblxuXG5leHBvcnQgdHlwZSBNb3VzZUV2ZW50ID0ge1xuICB0eXBlOiBNb3VzZUV2ZW50VHlwZVxuICB0YXJnZXQ6IFZEb21cbiAgY2xpZW50WD86IG51bWJlclxuICBjbGllbnRZPzogbnVtYmVyXG4gIGRlbHRhWT86IG51bWJlclxuICBjdXJyZW50VGFyZ2V0PzogRWxlbWVudFxuICBwcmV2ZW50RGVmYXVsdD86ICgpID0+IHZvaWRcbn07XG5cbnR5cGUgS2V5Ym9hcmRFdmVudCA9IHtcbiAgdHlwZTogS2V5Ym9hcmRFdmVudFR5cGVcbiAga2V5OiBzdHJpbmcsXG4gIG1ldGFLZXk6IGJvb2xlYW4sXG4gIHNoaWZ0S2V5OiBib29sZWFuLFxuICB0YXJnZXQ6IFZEb20sXG59XG5cbmV4cG9ydCB0eXBlIFZpZXdDb250ZXh0ID0ge1xuICBhZGQ6IChwYXJlbnQ6IFZEb20sIC4uLmVsOiBWRG9tW10pPT4gdm9pZCxcbiAgZGVsOiAoZWw6IFZEb20pID0+IHZvaWQsXG4gIHVwZGF0ZTogKGVsOiBWRG9tKSA9PiB2b2lkLFxuICBvblVzZXJFdmVudD86ICh0eXBlOiBEb21FdmVudFR5cGUpID0+IHZvaWQsXG4gIGxvY2F0aW9uOiB7IHBhdGhuYW1lOiBzdHJpbmcgfSxcbiAgd2lkdGg6IG51bWJlcixcbiAgaGVpZ2h0OiBudW1iZXIsXG59XG5cbmV4cG9ydCB0eXBlIFZEb20gPSB7XG4gIHRhZzogc3RyaW5nXG4gIHRleHRDb250ZW50OiBzdHJpbmdcbiAgaWQ6IHN0cmluZ1xuICBzdHlsZTogUmVjb3JkPHN0cmluZywgc3RyaW5nPlxuICBhdHRyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPlxuICBjaGlsZHJlbjogVkRvbVtdXG4gIG9uY2xpY2s/OiBNb3VzZUxpc3RlbmVyXG4gIG9ubW91c2Vkb3duPzogTW91c2VMaXN0ZW5lclxuICBvbm1vdXNldXA/OiBNb3VzZUxpc3RlbmVyXG4gIG9ubW91c2Vtb3ZlPzogTW91c2VMaXN0ZW5lclxuICBvbndoZWVsPzogTW91c2VMaXN0ZW5lclxuICBvbmtleWRvd24/OiBLZXlMaXN0ZW5lclxuICBvbmtleXVwPzogS2V5TGlzdGVuZXJcbiAgdmFsdWU/OiBzdHJpbmdcbn1cblxudHlwZSBEb21VcGRhdGUgPSB7IG9wOiBcIkRFTFwiLCBlbDogVkRvbSB9IHwgeyBvcDogXCJBRERcIiwgcGFyZW50OiBWRG9tLCBlbDogVkRvbVtdfSB8IHsgb3A6IFwiVVBEQVRFXCIsIGVsOiBWRG9tIH1cblxuXG5sZXQgZG9tcyA9IG5ldyBXZWFrTWFwPEVsZW1lbnQsIFZEb20+KCk7XG5sZXQgZWxlbWVudHMgPSBuZXcgV2Vha01hcDxWRG9tLCBFbGVtZW50PigpO1xuXG5cblxuZXhwb3J0IHR5cGUgVmlldyA9IChjdHg6IFZpZXdDb250ZXh0KSA9PiBWRG9tO1xuXG5leHBvcnQgY29uc3QgcmVuZGVyRG9tID0gKG1rZXI6IFZpZXcsIGxvY2F0aW9uOiB7IHBhdGhuYW1lOiBzdHJpbmcgfSA9IHsgcGF0aG5hbWU6IFwiL1wiIH0sIHdpZHRoID0gZ2xvYmFsVGhpcy5pbm5lcldpZHRoID8/IDAsIGhlaWdodCA9IGdsb2JhbFRoaXMuaW5uZXJIZWlnaHQgPz8gMCk6IEhUTUxFbGVtZW50ID0+IHtcblxuICBsZXQgY3R4UmVmOiBWaWV3Q29udGV4dCB8IG51bGwgPSBudWxsXG5cbiAgY29uc3QgcmVuZGVyID0gKGRvbTpWRG9tKSA6IEVsZW1lbnQ9PntcblxuICAgIGNvbnN0IGVsID0gc3ZnVGFncy5oYXMoZG9tLnRhZykgPyBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoc3ZnTmFtZXNwYWNlLCBkb20udGFnKVxuICAgICAgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGRvbS50YWcpO1xuXG4gICAgZWwudGV4dENvbnRlbnQgPSBkb20udGV4dENvbnRlbnRcbiAgICBpZiAoKGVsIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCB8fCBlbCBpbnN0YW5jZW9mIEhUTUxUZXh0QXJlYUVsZW1lbnQpICYmIGRvbS52YWx1ZSkgZWwudmFsdWUgPSBkb20udmFsdWVcbiAgICBlbGVtZW50cy5zZXQoZG9tLCBlbClcbiAgICBkb21zLnNldChlbCwgZG9tKVxuICAgIGVsLmFwcGVuZCguLi5kb20uY2hpbGRyZW4ubWFwKGM9PnJlbmRlcihjKSkpXG4gICAgT2JqZWN0LmVudHJpZXMoZG9tLmF0dHJzKS5mb3JFYWNoKChbaywgdl0pID0+IHtcbiAgICAgIGlmIChhbGxvd2VkQXR0cmlidXRlTmFtZXMuaGFzKGspKSBlbC5zZXRBdHRyaWJ1dGUoaywgdilcbiAgICB9KVxuICAgIE9iamVjdC5lbnRyaWVzKGRvbS5zdHlsZSkuZm9yRWFjaChzdD0+ZWwuc3R5bGUuc2V0UHJvcGVydHkoLi4uc3QpKVxuICAgIG1vdXNlRXZlbnRzLmZvckVhY2goKHR5cGUpID0+IGVsLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgKGUpID0+IHtcbiAgICAgIGlmIChjdHhSZWYgJiYgY3R4UmVmLm9uVXNlckV2ZW50KSBjdHhSZWYub25Vc2VyRXZlbnQodHlwZSlcbiAgICAgIGNvbnN0IG1lID0gZSBhcyBnbG9iYWxUaGlzLk1vdXNlRXZlbnRcbiAgICAgIGNvbnN0IGV2ZW50OiBNb3VzZUV2ZW50ID0ge1xuICAgICAgICB0eXBlLFxuICAgICAgICB0YXJnZXQ6IGRvbXMuZ2V0KGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50KSEsXG4gICAgICAgIGNsaWVudFg6IG1lLmNsaWVudFgsXG4gICAgICAgIGNsaWVudFk6IG1lLmNsaWVudFksXG4gICAgICAgIGRlbHRhWTogdHlwZSA9PT0gXCJ3aGVlbFwiID8gKG1lIGFzIGdsb2JhbFRoaXMuV2hlZWxFdmVudCkuZGVsdGFZIDogdW5kZWZpbmVkLFxuICAgICAgICBjdXJyZW50VGFyZ2V0OiBlbCxcbiAgICAgICAgcHJldmVudERlZmF1bHQ6ICgpID0+IGUucHJldmVudERlZmF1bHQoKSxcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlID09PSBcImNsaWNrXCIgJiYgZG9tLm9uY2xpY2spIGRvbS5vbmNsaWNrKGV2ZW50KVxuICAgICAgZWxzZSBpZiAodHlwZSA9PT0gXCJtb3VzZWRvd25cIiAmJiBkb20ub25tb3VzZWRvd24pIGRvbS5vbm1vdXNlZG93bihldmVudClcbiAgICAgIGVsc2UgaWYgKHR5cGUgPT09IFwibW91c2V1cFwiICYmIGRvbS5vbm1vdXNldXApIGRvbS5vbm1vdXNldXAoZXZlbnQpXG4gICAgICBlbHNlIGlmICh0eXBlID09PSBcIm1vdXNlbW92ZVwiICYmIGRvbS5vbm1vdXNlbW92ZSkgZG9tLm9ubW91c2Vtb3ZlKGV2ZW50KVxuICAgICAgZWxzZSBpZiAodHlwZSA9PT0gXCJ3aGVlbFwiICYmIGRvbS5vbndoZWVsKSBkb20ub253aGVlbChldmVudClcbiAgICB9KSk7XG4gICAga2V5Ym9hcmRFdmVudHMuZm9yRWFjaCgodHlwZSkgPT4gZWwuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCAoZSkgPT57XG4gICAgICBpZiAoY3R4UmVmICYmIGN0eFJlZi5vblVzZXJFdmVudCkgY3R4UmVmLm9uVXNlckV2ZW50KHR5cGUpXG4gICAgICBsZXQge2tleSwgbWV0YUtleSwgc2hpZnRLZXl9ID0gZSBhcyBnbG9iYWxUaGlzLktleWJvYXJkRXZlbnQ7XG4gICAgICBpZiAoW1wiSU5QVVRcIiAsIFwiVEVYVEFSRUFcIl0uaW5jbHVkZXMoKGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS50YWdOYW1lKSkgZG9tLnZhbHVlID0gKGUudGFyZ2V0IGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlXG4gICAgICBjb25zdCBldmVudDogS2V5Ym9hcmRFdmVudCA9IHsgdHlwZSwga2V5LCBtZXRhS2V5LCBzaGlmdEtleSwgdGFyZ2V0OiBkb21zLmdldChlLnRhcmdldCBhcyBIVE1MRWxlbWVudCkhfVxuICAgICAgaWYgKHR5cGUgPT09IFwia2V5ZG93blwiICYmIGRvbS5vbmtleWRvd24pIGRvbS5vbmtleWRvd24oZXZlbnQpXG4gICAgICBlbHNlIGlmICh0eXBlID09PSBcImtleXVwXCIgJiYgZG9tLm9ua2V5dXApIGRvbS5vbmtleXVwKGV2ZW50KVxuICAgIH0pKVxuICAgIHJldHVybiBlbFxuXG4gIH1cbiAgY29uc3QgY3R4OiBWaWV3Q29udGV4dCA9IHtcbiAgICBhZGQ6IChwYXJlbnQ6IFZEb20sIC4uLmVsOiBWRG9tW10pID0+IHtcbiAgICAgIGVsZW1lbnRzLmdldChwYXJlbnQpPy5hcHBlbmQoLi4uZWwubWFwKGU9PnJlbmRlcihlKSkpXG4gICAgfSxcbiAgICBkZWw6IChlbDogVkRvbSkgPT4ge1xuICAgICAgZG9tcy5kZWxldGUoZWxlbWVudHMuZ2V0KGVsKSEpXG4gICAgICBlbGVtZW50cy5nZXQoZWwpPy5yZW1vdmUoKVxuICAgICAgZWxlbWVudHMuZGVsZXRlKGVsKVxuICAgIH0sXG4gICAgdXBkYXRlOiAoZWw6IFZEb20pID0+IHtcbiAgICAgIGxldCBvbGRlbCA9IGVsZW1lbnRzLmdldChlbCkhXG4gICAgICBpZiAoIW9sZGVsKSByZXR1cm5cbiAgICAgIG9sZGVsLnJlcGxhY2VXaXRoKHJlbmRlcihlbCkpXG4gICAgICBkb21zLmRlbGV0ZShvbGRlbClcbiAgICB9LFxuICAgIGxvY2F0aW9uLFxuICAgIHdpZHRoLFxuICAgIGhlaWdodCxcbiAgfVxuICBjdHhSZWYgPSBjdHhcbiAgcmV0dXJuIHJlbmRlcihta2VyKGN0eCkpIGFzIEhUTUxFbGVtZW50XG59XG5cblxuXG5cbnR5cGUgS2V5TGlzdGVuZXIgPSAoZTpLZXlib2FyZEV2ZW50KSA9PiB2b2lkXG50eXBlIE1vdXNlTGlzdGVuZXIgPSAoZTpNb3VzZUV2ZW50KSA9PiB2b2lkXG50eXBlIFN1YnNjcmliZXIgPSB7XG4gIFwib25rZXl1cFwiPyA6IEtleUxpc3RlbmVyXG4gIFwib25rZXlkb3duXCI/IDogS2V5TGlzdGVuZXJcbiAgXCJvbm1vdXNldXBcIj8gOiBNb3VzZUxpc3RlbmVyXG4gIFwib25tb3VzZWRvd25cIj8gOiBNb3VzZUxpc3RlbmVyXG4gIFwib25tb3VzZW1vdmVcIj8gOiBNb3VzZUxpc3RlbmVyXG4gIFwib25jbGlja1wiPyA6TW91c2VMaXN0ZW5lclxuICBcIm9ud2hlZWxcIj8gOiBNb3VzZUxpc3RlbmVyXG59O1xuXG50eXBlIENvbnRlbnQgPSBzdHJpbmcgfCBWRG9tIHwgQ29udGVudFtdIHwge2lkOiBzdHJpbmd9IHwge3N0eWxlOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+fSB8IFN1YnNjcmliZXIgfCB7dmFsdWU6IHN0cmluZ30gfCB7YXR0cnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz59XG5cblxuY29uc3QgbWtEb20gPSAodGFnOiBzdHJpbmcpID0+ICguLi5jb250ZW50OkNvbnRlbnRbXSkgPT57XG5cbiAgbGV0IGRtIDogVkRvbSA9IHt0YWc6IHRhZywgc3R5bGU6IHt9LCBhdHRyczoge30sIHRleHRDb250ZW50OiBcIlwiLCBpZDogXCJcIiwgY2hpbGRyZW46IFtdfTtcbiAgbGV0IHN0cmluZ3M6IHN0cmluZ1tdID0gW11cbiAgbGV0IGFkZGNvbnRlbnQgPSAoYzogQ29udGVudCkgPT4ge1xuICAgIGlmIChjIGluc3RhbmNlb2YgQXJyYXkpIGMuZm9yRWFjaChhZGRjb250ZW50KTtcbiAgICBlbHNlIGlmICh0eXBlb2YgYyA9PSBcInN0cmluZ1wiKSBzdHJpbmdzLnB1c2goYylcbiAgICBlbHNlIGlmIChjIGluc3RhbmNlb2YgT2JqZWN0KSB7XG4gICAgICBpZiAoXCJ0YWdcIiBpbiBjKSByZXR1cm4gZG0uY2hpbGRyZW4ucHVzaChjIGFzIFZEb20pXG4gICAgICBpZiAoXCJpZFwiIGluIGMpIGRtLmlkID0gYy5pZCBhcyBzdHJpbmc7XG4gICAgICBpZiAoXCJ2YWx1ZVwiIGluIGMpIGRtLnZhbHVlID0gYy52YWx1ZTtcbiAgICAgIGlmIChcImF0dHJzXCIgaW4gYykgT2JqZWN0LmVudHJpZXMoYy5hdHRycykuZm9yRWFjaCgoW2ssIHZdKSA9PiBkbS5hdHRyc1trXSA9IHYpXG4gICAgICBpZiAoXCJzdHlsZVwiIGluIGMpIE9iamVjdC5lbnRyaWVzKGMuc3R5bGUpLmZvckVhY2gocz0+IGRtLnN0eWxlW3NbMF0ucmVwbGFjZSgvKFtBLVpdKS9nLCAnLSQxJyldID0gc1sxXSlcbiAgICAgIGlmIChcIm9uY2xpY2tcIiBpbiBjKSBkbS5vbmNsaWNrID0gKGMgYXMgU3Vic2NyaWJlcikub25jbGlja1xuICAgICAgaWYgKFwib25tb3VzZWRvd25cIiBpbiBjKSBkbS5vbm1vdXNlZG93biA9IChjIGFzIFN1YnNjcmliZXIpLm9ubW91c2Vkb3duXG4gICAgICBpZiAoXCJvbm1vdXNldXBcIiBpbiBjKSBkbS5vbm1vdXNldXAgPSAoYyBhcyBTdWJzY3JpYmVyKS5vbm1vdXNldXBcbiAgICAgIGlmIChcIm9ubW91c2Vtb3ZlXCIgaW4gYykgZG0ub25tb3VzZW1vdmUgPSAoYyBhcyBTdWJzY3JpYmVyKS5vbm1vdXNlbW92ZVxuICAgICAgaWYgKFwib253aGVlbFwiIGluIGMpIGRtLm9ud2hlZWwgPSAoYyBhcyBTdWJzY3JpYmVyKS5vbndoZWVsXG4gICAgICBpZiAoXCJvbmtleWRvd25cIiBpbiBjKSBkbS5vbmtleWRvd24gPSAoYyBhcyBTdWJzY3JpYmVyKS5vbmtleWRvd25cbiAgICAgIGlmIChcIm9ua2V5dXBcIiBpbiBjKSBkbS5vbmtleXVwID0gKGMgYXMgU3Vic2NyaWJlcikub25rZXl1cFxuICAgIH1cbiAgfVxuXG4gIGFkZGNvbnRlbnQoY29udGVudClcbiAgZG0udGV4dENvbnRlbnQgKz0gc3RyaW5ncy5qb2luKFwiIFwiKVxuXG4gIHJldHVybiBkbVxufVxuXG5sZXQgZGl2PSBta0RvbShcImRpdlwiKVxubGV0IHN2ZyA9IG1rRG9tKFwic3ZnXCIpXG5sZXQgcGF0aCA9IG1rRG9tKFwicGF0aFwiKVxubGV0IGcgPSBta0RvbShcImdcIilcbmxldCByZWN0ID0gbWtEb20oXCJyZWN0XCIpXG5sZXQgdGV4dCA9IChhdHRyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiAsIC4uLmNvbnRlbnQ6IHN0cmluZ1tdKSA9PiAoe3RhZzogXCJ0ZXh0XCIsIHN0eWxlOiB7fSwgYXR0cnM6IGF0dHJzIGFzIHtwb3M6c3RyaW5nfSwgdGV4dENvbnRlbnQ6IGNvbnRlbnQuam9pbihcIiBcIiksIGlkOiBcIlwiLCBjaGlsZHJlbjogW119KTtcblxuY29uc3QgcG9wdXAgPSAoLi4uY3M6VkRvbVtdKT0+e1xuXG4gIGNvbnN0IGRpYWxvZ2ZpZWxkID0gZGl2KFxuICAgIHtcbiAgICAgIHN0eWxlOiB7XG4gICAgICAgIGJhY2tncm91bmQ6IFwidmFyKC0tYmFja2dyb3VuZC1jb2xvcilcIixcbiAgICAgICAgY29sb3I6IFwidmFyKC0tY29sb3IpXCIsXG4gICAgICAgIHBhZGRpbmc6IFwiMWVtXCIsXG4gICAgICAgIHBhZGRpbmdCb3R0b206IFwiMmVtXCIsXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIxZW1cIixcbiAgICAgICAgekluZGV4OiBcIjIwMDBcIixcbiAgICAgICAgb3ZlcmZsb3dZOiBcInNjcm9sbFwiLFxuICAgICAgfVxuICAgIH0sXG4gICAgLi4uY3MpXG5cbiAgY29uc3QgcG9wdXBiYWNrZ3JvdW5kID0gZGl2KFxuICAgIHtzdHlsZTp7XG4gICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgdG9wOiBcIjBcIixcbiAgICAgIGxlZnQ6IFwiMFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IFwicmdiYSgxNjYsIDE2NiwgMTY2LCAwLjUpXCIsXG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgYWxpZ25JdGVtczogXCJjZW50ZXJcIixcbiAgICAgIHpJbmRleDogXCIyMDAwXCIsXG4gICAgfX0sXG4gICAgZGlhbG9nZmllbGRcbiAgKVxuXG4gIHJldHVybiBwb3B1cGJhY2tncm91bmRcblxufVxuXG5cbmV4cG9ydCBjb25zdCBIVE1MID0ge1xuICBkaXYsXG4gIHN2ZyxcbiAgc3BhbjogbWtEb20oXCJzcGFuXCIpLFxuICBwOiBta0RvbShcInBcIiksXG4gIGgxOiBta0RvbShcImgxXCIpLFxuICBoMjogbWtEb20oXCJoMlwiKSxcbiAgaDM6IG1rRG9tKFwiaDNcIiksXG4gIGg0OiBta0RvbShcImg0XCIpLFxuICBoNTogbWtEb20oXCJoNVwiKSxcbiAgaDY6IG1rRG9tKFwiaDZcIiksXG4gIGE6IG1rRG9tKFwiYVwiKSxcbiAgYnV0dG9uOiBta0RvbShcImJ1dHRvblwiKSxcbiAgaW5wdXQ6IG1rRG9tKFwiaW5wdXRcIiksXG4gIHRleHRhcmVhOiBta0RvbShcInRleHRhcmVhXCIpLFxuICBwcmU6IG1rRG9tKFwicHJlXCIpLFxuICBzdmdQYXRoOiAocGF0aERhdGE6IHN0cmluZyB8IHN0cmluZ1tdLCBvcHRpb25zOiB7XG4gICAgdmlld0JveD86IHN0cmluZyxcbiAgICB3aWR0aD86IHN0cmluZyxcbiAgICBoZWlnaHQ/OiBzdHJpbmcsXG4gICAgZmlsbD86IHN0cmluZyxcbiAgICBzdHJva2U/OiBzdHJpbmcsXG4gICAgc3Ryb2tlV2lkdGg/OiBzdHJpbmdcbiAgfSA9IHt9LCAuLi5jaGlsZHJlbjogVkRvbVtdKSA9PiB7XG4gICAgY29uc3QgcGF0aHMgPSBwYXRoRGF0YSBpbnN0YW5jZW9mIEFycmF5ID8gcGF0aERhdGEgOiBbcGF0aERhdGFdXG4gICAgY29uc3QgeyB2aWV3Qm94ID0gXCIwIDAgMTAwIDEwMFwiLCB3aWR0aCA9IFwiMTAwXCIsIGhlaWdodCA9IFwiMTAwXCIsIGZpbGwgPSBcIm5vbmVcIiwgc3Ryb2tlID0gXCJ2YXIoLS1jb2xvcilcIiwgc3Ryb2tlV2lkdGggPSBcIjFcIiB9ID0gb3B0aW9uc1xuICAgIGNvbnN0IHBhdGhBdHRyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHsgZmlsbCwgc3Ryb2tlLCBcInN0cm9rZS13aWR0aFwiOiBzdHJva2VXaWR0aCB9XG4gICAgcmV0dXJuIHN2ZyhcbiAgICAgIHsgYXR0cnM6IHsgdmlld0JveCwgd2lkdGgsIGhlaWdodCwgeG1sbnM6IHN2Z05hbWVzcGFjZSB9IH0sXG4gICAgICAuLi5wYXRocy5tYXAoZCA9PiBwYXRoKHsgYXR0cnM6IHsgLi4ucGF0aEF0dHJzLCBkIH0gfSkpLFxuICAgICAgLi4uY2hpbGRyZW5cbiAgICApXG4gIH0sXG4gIHN2Z1RleHQ6IChcbiAgICBjb250ZW50OiBzdHJpbmcsXG4gICAgb3B0aW9uczoge1xuICAgICAgeD86IHN0cmluZyxcbiAgICAgIHk/OiBzdHJpbmcsXG4gICAgICBmaWxsPzogc3RyaW5nLFxuICAgICAgYmFja2dyb3VuZD86IHN0cmluZyxcbiAgICAgIGZvbnRTaXplPzogc3RyaW5nLFxuICAgICAgZm9udEZhbWlseT86IHN0cmluZyxcbiAgICAgIGZvbnRXZWlnaHQ/OiBzdHJpbmcsXG4gICAgICB0ZXh0QW5jaG9yPzogc3RyaW5nLFxuICAgICAgZG9taW5hbnRCYXNlbGluZT86IHN0cmluZyxcbiAgICAgIGR4Pzogc3RyaW5nLFxuICAgICAgZHk/OiBzdHJpbmdcbiAgICB9ID0ge31cbiAgKSA9PiB7XG4gICAgY29uc3QgZnMgPSBOdW1iZXIob3B0aW9ucy5mb250U2l6ZSA/PyAxMilcbiAgICBjb25zdCB4ID0gb3B0aW9ucy54ID8/IFwiNTBcIlxuICAgIGNvbnN0IHkgPSBvcHRpb25zLnkgPz8gXCI1MFwiXG4gICAgY29uc3QgYXR0cnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgICBmaWxsOiBvcHRpb25zLmZpbGwgPz8gXCJ2YXIoLS1jb2xvcilcIixcbiAgICAgIFwiZm9udC1zaXplXCI6IFN0cmluZyhmcyksXG4gICAgICB4LCB5LFxuICAgICAgXCJ0ZXh0LWFuY2hvclwiOiBvcHRpb25zLnRleHRBbmNob3IgPz8gXCJtaWRkbGVcIixcbiAgICAgIFwiZG9taW5hbnQtYmFzZWxpbmVcIjogb3B0aW9ucy5kb21pbmFudEJhc2VsaW5lID8/IFwibWlkZGxlXCIsXG4gICAgfVxuICAgIGlmIChvcHRpb25zLmZvbnRGYW1pbHkpIGF0dHJzW1wiZm9udC1mYW1pbHlcIl0gPSBvcHRpb25zLmZvbnRGYW1pbHlcbiAgICBpZiAob3B0aW9ucy5mb250V2VpZ2h0KSBhdHRyc1tcImZvbnQtd2VpZ2h0XCJdID0gb3B0aW9ucy5mb250V2VpZ2h0XG4gICAgaWYgKG9wdGlvbnMuZHgpIGF0dHJzLmR4ID0gb3B0aW9ucy5keFxuICAgIGlmIChvcHRpb25zLmR5KSBhdHRycy5keSA9IG9wdGlvbnMuZHlcbiAgICBjb25zdCB0ZXh0Tm9kZSA9IHRleHQoYXR0cnMsIGNvbnRlbnQpXG4gICAgaWYgKCFvcHRpb25zLmJhY2tncm91bmQpIHJldHVybiB0ZXh0Tm9kZVxuICAgIGNvbnN0IHBhZCA9IGZzICogMC40XG4gICAgY29uc3QgcncgPSBjb250ZW50Lmxlbmd0aCAqIGZzICogMC42ICsgcGFkICogMlxuICAgIGNvbnN0IHJoID0gZnMgKyBwYWQgKiAyXG4gICAgY29uc3QgcnggPSBOdW1iZXIoeCkgLSBydyAvIDJcbiAgICBjb25zdCByeSA9IE51bWJlcih5KSAtIHJoIC8gMlxuICAgIHJldHVybiBnKFxuICAgICAgcmVjdCh7IGF0dHJzOiB7IHg6IFN0cmluZyhyeCksIHk6IFN0cmluZyhyeSksIHdpZHRoOiBTdHJpbmcocncpLCBoZWlnaHQ6IFN0cmluZyhyaCksIGZpbGw6IG9wdGlvbnMuYmFja2dyb3VuZCwgcng6IFN0cmluZyhwYWQpIH0gfSksXG4gICAgICB0ZXh0Tm9kZSxcbiAgICApXG4gIH0sXG4gIHBvcHVwXG59XG4iLCAiZXhwb3J0IHR5cGUgUmVmID0gYCMke3N0cmluZ31gO1xuXG5jb25zdCBGTlZfT0ZGU0VUXzEgPSAweGNiZjI5Y2U0ODQyMjIzMjVuO1xuY29uc3QgRk5WX09GRlNFVF8yID0gMHg4NDIyMjMyNWNiZjI5Y2U0bjtcbmNvbnN0IEZOVl9QUklNRSA9IDB4MTAwMDAwMDAxYjNuO1xuY29uc3QgTUFTS182NCA9ICgxbiA8PCA2NG4pIC0gMW47XG5cbmNvbnN0IGhhc2g2NCA9ICh2YWx1ZTogc3RyaW5nLCBvZmZzZXQ6IGJpZ2ludCk6IGJpZ2ludCA9PiB7XG4gIGxldCBoYXNoID0gb2Zmc2V0O1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgaGFzaCBePSBCaWdJbnQodmFsdWUuY2hhckNvZGVBdChpKSk7XG4gICAgaGFzaCA9IChoYXNoICogRk5WX1BSSU1FKSAmIE1BU0tfNjQ7XG4gIH1cbiAgcmV0dXJuIGhhc2g7XG59O1xuXG5jb25zdCB0b0hleDY0ID0gKHZhbHVlOiBiaWdpbnQpID0+IHZhbHVlLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgxNiwgXCIwXCIpO1xuXG5leHBvcnQgY29uc3QgaGFzaDEyOCA9ICguLi5kYXRhOiBhbnkpOiBSZWYgPT4ge1xuICBjb25zdCBpbnB1dCA9IEpTT04uc3RyaW5naWZ5KGRhdGEpO1xuICBjb25zdCBoaWdoID0gaGFzaDY0KGlucHV0LCBGTlZfT0ZGU0VUXzEpO1xuICBjb25zdCBsb3cgPSBoYXNoNjQoaW5wdXQsIEZOVl9PRkZTRVRfMik7XG4gIHJldHVybiBgIyR7dG9IZXg2NChoaWdoKX0ke3RvSGV4NjQobG93KX1gIGFzIFJlZjtcbn07XG5cbmV4cG9ydCB0eXBlIEpzb25hYmxlID1cbiAgfCBzdHJpbmdcbiAgfCBudW1iZXJcbiAgfCBib29sZWFuXG4gIHwgbnVsbFxuICB8IEpzb25hYmxlW11cbiAgfCB7IFtrZXk6IHN0cmluZ106IEpzb25hYmxlIH07XG5cblxuZXhwb3J0IHR5cGUgTm90ZSA9IHsgaGFzaDogUmVmOyBkYXRhOiBKc29uYWJsZSB9O1xuXG5leHBvcnQgY29uc3QgdG9qc29uID0gKHg6IEpzb25hYmxlKSA9PiBKU09OLnN0cmluZ2lmeSh4LCBudWxsLCAyKTtcbmV4cG9ydCBjb25zdCBmcm9tanNvbiA9ICh4OiBzdHJpbmcpOiBKc29uYWJsZSA9PiBKU09OLnBhcnNlKHgpO1xuXG5leHBvcnQgY29uc3QgaXNSZWYgPSAodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBSZWYgPT5cbiAgdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiICYmIC9eIyhbYS1mMC05XXszMn0pJC9pLnRlc3QodmFsdWUpO1xuXG5leHBvcnQgY29uc3QgaGFzaERhdGEgPSAodmFsdWU6IEpzb25hYmxlKTogUmVmID0+IHtcbiAgaWYgKGlzUmVmKHZhbHVlKSkgcmV0dXJuIHZhbHVlO1xuICBpZiAoW1wic3RyaW5nXCIsIFwibnVtYmVyXCIsIFwiYm9vbGVhblwiXS5pbmNsdWRlcyh0eXBlb2YgdmFsdWUpIHx8IHZhbHVlID09PSBudWxsKSB7XG4gICAgcmV0dXJuIGhhc2gxMjgodG9qc29uKHZhbHVlKSk7XG4gIH1cbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSByZXR1cm4gaGFzaDEyOChcImFyclwiLCB2YWx1ZS5tYXAoaGFzaERhdGEpKTtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIil7XG4gICAgY29uc3QgZW50cmllcyA9IE9iamVjdC5lbnRyaWVzKHZhbHVlKVxuICAgICAgLnNvcnQoKFthXSwgW2JdKSA9PiAoYSA8IGIgPyAtMSA6IGEgPiBiID8gMSA6IDApKVxuICAgICAgLm1hcCgoW2ssIHZdKSA9PiBbaywgaGFzaERhdGEodildIGFzIGNvbnN0KTtcbiAgICByZXR1cm4gaGFzaDEyOCh0b2pzb24oT2JqZWN0LmZyb21FbnRyaWVzKGVudHJpZXMpKSk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKGB1bnN1cHBvcnRlZCB0eXBlIGZvciBoYXNoaW5nOiAke3R5cGVvZiB2YWx1ZX1gKTtcbn07XG4iLCAiaW1wb3J0IHsgZnJvbWpzb24sIGhhc2hEYXRhLCBpc1JlZiwgdG9qc29uLCB0eXBlIEpzb25hYmxlLCB0eXBlIFJlZiB9IGZyb20gXCJAaGFzaG5vdGVzL2NvcmUvbm90ZXNcIjtcblxuZXhwb3J0IHR5cGUgU2VydmVyTmFtZSA9IFwibG9jYWxcIiB8IFwibWFpbmNsb3VkXCI7XG50eXBlIENhY2hlT3B0aW9ucyA9IHsgc2tpcENhY2hlPzogYm9vbGVhbiB9O1xuXG5jb25zdCBEQl9OQU1FID0gXCJoYXNobm90ZXNcIjtcblxuY29uc3QgZW52ID0gKCkgPT4gKGdsb2JhbFRoaXMgYXMgYW55KT8ucHJvY2Vzcz8uZW52IGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IHVuZGVmaW5lZD4gfCB1bmRlZmluZWQ7XG5jb25zdCBLViA9ICgoKSA9PiB7XG4gIHRyeSB7IGlmICh0eXBlb2YgbG9jYWxTdG9yYWdlICE9PSBcInVuZGVmaW5lZFwiICYmIGxvY2FsU3RvcmFnZSkgcmV0dXJuIGxvY2FsU3RvcmFnZTsgfSBjYXRjaCB7fVxuICBjb25zdCBtID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgcmV0dXJuIHtcbiAgICBnZXRJdGVtOiAoazogc3RyaW5nKSA9PiBtLmdldChrKSA/PyBudWxsLFxuICAgIHNldEl0ZW06IChrOiBzdHJpbmcsIHY6IHN0cmluZykgPT4geyBtLnNldChrLCB2KTsgfSxcbiAgICByZW1vdmVJdGVtOiAoazogc3RyaW5nKSA9PiB7IG0uZGVsZXRlKGspOyB9LFxuICB9O1xufSkoKTtcblxubGV0IFNFUlZFUjogU2VydmVyTmFtZSA9ICgoKSA9PiB7XG4gIGNvbnN0IGUgPSBlbnYoKTtcbiAgY29uc3QgdiA9IGU/LkhBU0hOT1RFU19TRVJWRVI7XG4gIHJldHVybiB2ID09PSBcImxvY2FsXCIgfHwgdiA9PT0gXCJtYWluY2xvdWRcIiA/IHYgOiAoS1YuZ2V0SXRlbShcImRiX3ByZXNldFwiKSA9PT0gXCJsb2NhbFwiID8gXCJsb2NhbFwiIDogXCJtYWluY2xvdWRcIik7XG59KSgpO1xuXG5jb25zdCBiYXNlVXJsID0gKCk6IHN0cmluZyA9PiAoe1xuICBsb2NhbDogXCJodHRwOi8vbG9jYWxob3N0OjMwMDBcIixcbiAgbWFpbmNsb3VkOiBcImh0dHBzOi8vbWFpbmNsb3VkLnNwYWNldGltZWRiLmNvbVwiLFxufSlbU0VSVkVSXVxuXG5jb25zdCBhY2Nlc3NUb2tlbiA9IGFzeW5jICgpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+ID0+IHtcbiAgbGV0IHRva2Vua2V5ID0gKCkgPT4gYGFjY2Vzc190b2tlbjoke1NFUlZFUn1gO1xuICBsZXQgdGtleSA9IHRva2Vua2V5KCk7XG4gIGNvbnN0IGUgPSBlbnYoKTtcbiAgY29uc3QgZW52VG9rZW4gPSAoU0VSVkVSID09PSBcImxvY2FsXCIgPyBlPy5IQVNITk9URVNfQUNDRVNTX1RPS0VOX0xPQ0FMIDogZT8uSEFTSE5PVEVTX0FDQ0VTU19UT0tFTl9NQUlOQ0xPVUQpID8/IGU/LkhBU0hOT1RFU19BQ0NFU1NfVE9LRU47XG4gIGlmIChlbnZUb2tlbikgcmV0dXJuIGVudlRva2VuO1xuXG4gIGxldCB0b2tlbiA9IEtWLmdldEl0ZW0odGtleSlcbiAgaWYgKCF0b2tlbil7XG4gICAgdG9rZW4gPSBhd2FpdCBmZXRjaChgJHtiYXNlVXJsKCl9L3YxL2lkZW50aXR5YCwgeyBtZXRob2Q6IFwiUE9TVFwiLCBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0gfSlcbiAgICAudGhlbihyPT5yLmpzb24oKSkudGhlbihqPT5qLnRva2VuIHx8IG51bGwpXG4gICAgaWYgKHRrZXkgIT0gdG9rZW5rZXkoKSkgcmV0dXJuIGFjY2Vzc1Rva2VuKCk7XG4gICAgaWYgKHRva2VuKSBLVi5zZXRJdGVtKHRrZXksIHRva2VuKVxuICB9XG4gIHJldHVybiB0b2tlblxufTtcblxuZXhwb3J0IGNvbnN0IHNldFNlcnZlciA9ICh2YWx1ZTogU2VydmVyTmFtZSkgPT4ge1xuICBLVi5zZXRJdGVtKFwiZGJfcHJlc2V0XCIsIHZhbHVlKTtcbiAgU0VSVkVSID0gdmFsdWU7XG4gIGNvbnNvbGUubG9nKFwiY29ubmVjdCB0b1wiLCBTRVJWRVIpXG59O1xuXG5leHBvcnQgbGV0IGdldFNlcnZlciA9ICgpID0+IFNFUlZFUjtcbmNvbnNvbGUubG9nKFwiY29ubmVjdCB0b1wiLCBTRVJWRVIpXG5cbmNvbnN0IGNhbGwgPSBhc3luYyAobmFtZTogc3RyaW5nLCBwYXlsb2FkOiB1bmtub3duKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYCR7YmFzZVVybCgpfS92MS9kYXRhYmFzZS8ke0RCX05BTUV9L2NhbGwvJHtuYW1lfWAsIHtcbiAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgIGhlYWRlcnM6IHtcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiwgQXV0aG9yaXphdGlvbjogYXdhaXQgYWNjZXNzVG9rZW4oKS50aGVuKHQ9PnQ/YEJlYXJlciAke3R9YDonJyl9LFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpLFxuICB9KTtcbiAgY29uc3QgdGV4dCA9IGF3YWl0IHJlcy50ZXh0KCk7XG4gIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgRXJyb3IodGV4dCk7XG4gIHJldHVybiB0ZXh0O1xufTtcblxuLy8gU2VjdGlvbjogaW4tbWVtb3J5IG5vdGUgY2FjaGVcbmNvbnN0IG5vdGVDYWNoZSA9IG5ldyBNYXA8UmVmLCBKc29uYWJsZT4oKTtcbmNvbnN0IGFkZEluRmxpZ2h0ID0gbmV3IE1hcDxSZWYsIFByb21pc2U8UmVmPj4oKTtcbmNvbnN0IGdldEluRmxpZ2h0ID0gbmV3IE1hcDxSZWYsIFByb21pc2U8SnNvbmFibGU+PigpO1xuXG5leHBvcnQgY29uc3QgY2xlYXJOb3RlQ2FjaGUgPSAoKSA9PiB7XG4gIG5vdGVDYWNoZS5jbGVhcigpO1xuICBhZGRJbkZsaWdodC5jbGVhcigpO1xuICBnZXRJbkZsaWdodC5jbGVhcigpO1xufTtcblxuLy8gU2VjdGlvbjogbm90ZSBBUElcbmV4cG9ydCBjb25zdCBhZGROb3RlID0gYXN5bmMgKGRhdGE6IEpzb25hYmxlLCBvcHRpb25zOiBDYWNoZU9wdGlvbnMgPSB7fSk6IFByb21pc2U8UmVmPiA9PiB7XG4gIGNvbnN0IHsgc2tpcENhY2hlID0gZmFsc2UgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IGhhc2ggPSBoYXNoRGF0YShkYXRhKTtcblxuICBpZiAoIXNraXBDYWNoZSkge1xuICAgIGNvbnN0IGNhY2hlZCA9IG5vdGVDYWNoZS5nZXQoaGFzaCk7XG4gICAgaWYgKGNhY2hlZCAhPT0gdW5kZWZpbmVkKSByZXR1cm4gaGFzaDtcbiAgICBjb25zdCBwZW5kaW5nID0gYWRkSW5GbGlnaHQuZ2V0KGhhc2gpO1xuICAgIGlmIChwZW5kaW5nKSByZXR1cm4gcGVuZGluZztcbiAgfVxuXG4gIGNvbnN0IHAgPSAoYXN5bmMgKCkgPT4ge1xuICAgIGF3YWl0IGNhbGwoXCJhZGRfbm90ZVwiLCB7IGRhdGE6IHRvanNvbihkYXRhKSB9KTtcbiAgICBpZiAoIXNraXBDYWNoZSkgbm90ZUNhY2hlLnNldChoYXNoLCBkYXRhKTtcbiAgICByZXR1cm4gaGFzaDtcbiAgfSkoKTtcblxuICBpZiAoIXNraXBDYWNoZSkgYWRkSW5GbGlnaHQuc2V0KGhhc2gsIHApO1xuICB0cnkge1xuICAgIHJldHVybiBhd2FpdCBwO1xuICB9IGZpbmFsbHkge1xuICAgIGlmICghc2tpcENhY2hlKSBhZGRJbkZsaWdodC5kZWxldGUoaGFzaCk7XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBnZXROb3RlID0gYXN5bmMgKGhhc2g6IFJlZiwgb3B0aW9uczogQ2FjaGVPcHRpb25zID0ge30pOiBQcm9taXNlPEpzb25hYmxlPiA9PiB7XG4gIGNvbnN0IHsgc2tpcENhY2hlID0gZmFsc2UgfSA9IG9wdGlvbnM7XG5cbiAgaWYgKCFza2lwQ2FjaGUpIHtcbiAgICBjb25zdCBjYWNoZWQgPSBub3RlQ2FjaGUuZ2V0KGhhc2gpO1xuICAgIGlmIChjYWNoZWQgIT09IHVuZGVmaW5lZCkgcmV0dXJuIGNhY2hlZDtcblxuICAgIGNvbnN0IGFkZFBlbmRpbmcgPSBhZGRJbkZsaWdodC5nZXQoaGFzaCk7XG4gICAgaWYgKGFkZFBlbmRpbmcpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGFkZFBlbmRpbmc7XG4gICAgICAgIGNvbnN0IGFmdGVyQWRkID0gbm90ZUNhY2hlLmdldChoYXNoKTtcbiAgICAgICAgaWYgKGFmdGVyQWRkICE9PSB1bmRlZmluZWQpIHJldHVybiBhZnRlckFkZDtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvLyBmYWxsIHRocm91Z2hcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBwZW5kaW5nID0gZ2V0SW5GbGlnaHQuZ2V0KGhhc2gpO1xuICAgIGlmIChwZW5kaW5nKSByZXR1cm4gcGVuZGluZztcbiAgfVxuXG4gIGNvbnN0IHAgPSAoYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHdpcmVWYWx1ZSA9IGF3YWl0IGNhbGwoXCJnZXRfbm90ZVwiLCB7IGhhc2ggfSk7XG4gICAgY29uc3QgZGF0YSA9IGZyb21qc29uKGZyb21qc29uKHdpcmVWYWx1ZSkgYXMgc3RyaW5nKTtcbiAgICBpZiAoIXNraXBDYWNoZSkgbm90ZUNhY2hlLnNldChoYXNoLCBkYXRhKTtcbiAgICByZXR1cm4gZGF0YTtcbiAgfSkoKTtcblxuICBpZiAoIXNraXBDYWNoZSkgZ2V0SW5GbGlnaHQuc2V0KGhhc2gsIHApO1xuICB0cnkge1xuICAgIHJldHVybiBhd2FpdCBwO1xuICB9IGZpbmFsbHkge1xuICAgIGlmICghc2tpcENhY2hlKSBnZXRJbkZsaWdodC5kZWxldGUoaGFzaCk7XG4gIH1cbn07XG5cblxuZXhwb3J0IGNvbnN0IGRlUmVmID0gYXN5bmMgKHZhbHVlOiBKc29uYWJsZSk6IFByb21pc2U8SnNvbmFibGU+ID0+ICBpc1JlZih2YWx1ZSkgPyBnZXROb3RlKHZhbHVlKS50aGVuKGRlUmVmKSA6IHZhbHVlO1xuZXhwb3J0IGNvbnN0IGFzUmVmID0gYXN5bmMgKHZhbHVlOiBSZWYgfCBKc29uYWJsZSk6IFByb21pc2U8UmVmPiA9PiBpc1JlZih2YWx1ZSkgPyB2YWx1ZSA6IGFkZE5vdGUodmFsdWUpO1xuXG5leHBvcnQgY29uc3QgY2FsbE5vdGUgPSBhc3luYyAoZm46IFJlZiB8IEpzb25hYmxlLCBhcmdzPzogUmVmIHwgSnNvbmFibGUpOiBQcm9taXNlPEpzb25hYmxlPiA9PiB7XG4gIGNvbnN0IGZuUmVmID0gYXdhaXQgYXNSZWYoZm4pO1xuICBjb25zdCBhcmdzUmVmID0gYXdhaXQgYXNSZWYoYXJncyA9PT0gdW5kZWZpbmVkID8gW10gOiBhcmdzKTtcbiAgcmV0dXJuIGF3YWl0IGNhbGwoXCJjYWxsX25vdGVcIiwgeyBmbjogZm5SZWYsIGFyZzogYXJnc1JlZiB9KS50aGVuKGZyb21qc29uKS50aGVuKGRlUmVmKVxufTtcbiIsICIvLyBUaGlzIGZpbGUgd2FzIGdlbmVyYXRlZC4gRG8gbm90IG1vZGlmeSBtYW51YWxseSFcbnZhciBhc3RyYWxJZGVudGlmaWVyQ29kZXMgPSBbNTA5LCAwLCAyMjcsIDAsIDE1MCwgNCwgMjk0LCA5LCAxMzY4LCAyLCAyLCAxLCA2LCAzLCA0MSwgMiwgNSwgMCwgMTY2LCAxLCA1NzQsIDMsIDksIDksIDcsIDksIDMyLCA0LCAzMTgsIDEsIDgwLCAzLCA3MSwgMTAsIDUwLCAzLCAxMjMsIDIsIDU0LCAxNCwgMzIsIDEwLCAzLCAxLCAxMSwgMywgNDYsIDEwLCA4LCAwLCA0NiwgOSwgNywgMiwgMzcsIDEzLCAyLCA5LCA2LCAxLCA0NSwgMCwgMTMsIDIsIDQ5LCAxMywgOSwgMywgMiwgMTEsIDgzLCAxMSwgNywgMCwgMywgMCwgMTU4LCAxMSwgNiwgOSwgNywgMywgNTYsIDEsIDIsIDYsIDMsIDEsIDMsIDIsIDEwLCAwLCAxMSwgMSwgMywgNiwgNCwgNCwgNjgsIDgsIDIsIDAsIDMsIDAsIDIsIDMsIDIsIDQsIDIsIDAsIDE1LCAxLCA4MywgMTcsIDEwLCA5LCA1LCAwLCA4MiwgMTksIDEzLCA5LCAyMTQsIDYsIDMsIDgsIDI4LCAxLCA4MywgMTYsIDE2LCA5LCA4MiwgMTIsIDksIDksIDcsIDE5LCA1OCwgMTQsIDUsIDksIDI0MywgMTQsIDE2NiwgOSwgNzEsIDUsIDIsIDEsIDMsIDMsIDIsIDAsIDIsIDEsIDEzLCA5LCAxMjAsIDYsIDMsIDYsIDQsIDAsIDI5LCA5LCA0MSwgNiwgMiwgMywgOSwgMCwgMTAsIDEwLCA0NywgMTUsIDM0MywgOSwgNTQsIDcsIDIsIDcsIDE3LCA5LCA1NywgMjEsIDIsIDEzLCAxMjMsIDUsIDQsIDAsIDIsIDEsIDIsIDYsIDIsIDAsIDksIDksIDQ5LCA0LCAyLCAxLCAyLCA0LCA5LCA5LCAzMzAsIDMsIDEwLCAxLCAyLCAwLCA0OSwgNiwgNCwgNCwgMTQsIDEwLCA1MzUwLCAwLCA3LCAxNCwgMTE0NjUsIDI3LCAyMzQzLCA5LCA4NywgOSwgMzksIDQsIDYwLCA2LCAyNiwgOSwgNTM1LCA5LCA0NzAsIDAsIDIsIDU0LCA4LCAzLCA4MiwgMCwgMTIsIDEsIDE5NjI4LCAxLCA0MTc4LCA5LCA1MTksIDQ1LCAzLCAyMiwgNTQzLCA0LCA0LCA1LCA5LCA3LCAzLCA2LCAzMSwgMywgMTQ5LCAyLCAxNDE4LCA0OSwgNTEzLCA1NCwgNSwgNDksIDksIDAsIDE1LCAwLCAyMywgNCwgMiwgMTQsIDEzNjEsIDYsIDIsIDE2LCAzLCA2LCAyLCAxLCAyLCA0LCAxMDEsIDAsIDE2MSwgNiwgMTAsIDksIDM1NywgMCwgNjIsIDEzLCA0OTksIDEzLCAyNDUsIDEsIDIsIDksIDcyNiwgNiwgMTEwLCA2LCA2LCA5LCA0NzU5LCA5LCA3ODc3MTksIDIzOV07XG5cbi8vIFRoaXMgZmlsZSB3YXMgZ2VuZXJhdGVkLiBEbyBub3QgbW9kaWZ5IG1hbnVhbGx5IVxudmFyIGFzdHJhbElkZW50aWZpZXJTdGFydENvZGVzID0gWzAsIDExLCAyLCAyNSwgMiwgMTgsIDIsIDEsIDIsIDE0LCAzLCAxMywgMzUsIDEyMiwgNzAsIDUyLCAyNjgsIDI4LCA0LCA0OCwgNDgsIDMxLCAxNCwgMjksIDYsIDM3LCAxMSwgMjksIDMsIDM1LCA1LCA3LCAyLCA0LCA0MywgMTU3LCAxOSwgMzUsIDUsIDM1LCA1LCAzOSwgOSwgNTEsIDEzLCAxMCwgMiwgMTQsIDIsIDYsIDIsIDEsIDIsIDEwLCAyLCAxNCwgMiwgNiwgMiwgMSwgNCwgNTEsIDEzLCAzMTAsIDEwLCAyMSwgMTEsIDcsIDI1LCA1LCAyLCA0MSwgMiwgOCwgNzAsIDUsIDMsIDAsIDIsIDQzLCAyLCAxLCA0LCAwLCAzLCAyMiwgMTEsIDIyLCAxMCwgMzAsIDY2LCAxOCwgMiwgMSwgMTEsIDIxLCAxMSwgMjUsIDcxLCA1NSwgNywgMSwgNjUsIDAsIDE2LCAzLCAyLCAyLCAyLCAyOCwgNDMsIDI4LCA0LCAyOCwgMzYsIDcsIDIsIDI3LCAyOCwgNTMsIDExLCAyMSwgMTEsIDE4LCAxNCwgMTcsIDExMSwgNzIsIDU2LCA1MCwgMTQsIDUwLCAxNCwgMzUsIDM5LCAyNywgMTAsIDIyLCAyNTEsIDQxLCA3LCAxLCAxNywgMiwgNjAsIDI4LCAxMSwgMCwgOSwgMjEsIDQzLCAxNywgNDcsIDIwLCAyOCwgMjIsIDEzLCA1MiwgNTgsIDEsIDMsIDAsIDE0LCA0NCwgMzMsIDI0LCAyNywgMzUsIDMwLCAwLCAzLCAwLCA5LCAzNCwgNCwgMCwgMTMsIDQ3LCAxNSwgMywgMjIsIDAsIDIsIDAsIDM2LCAxNywgMiwgMjQsIDIwLCAxLCA2NCwgNiwgMiwgMCwgMiwgMywgMiwgMTQsIDIsIDksIDgsIDQ2LCAzOSwgNywgMywgMSwgMywgMjEsIDIsIDYsIDIsIDEsIDIsIDQsIDQsIDAsIDE5LCAwLCAxMywgNCwgMzEsIDksIDIsIDAsIDMsIDAsIDIsIDM3LCAyLCAwLCAyNiwgMCwgMiwgMCwgNDUsIDUyLCAxOSwgMywgMjEsIDIsIDMxLCA0NywgMjEsIDEsIDIsIDAsIDE4NSwgNDYsIDQyLCAzLCAzNywgNDcsIDIxLCAwLCA2MCwgNDIsIDE0LCAwLCA3MiwgMjYsIDM4LCA2LCAxODYsIDQzLCAxMTcsIDYzLCAzMiwgNywgMywgMCwgMywgNywgMiwgMSwgMiwgMjMsIDE2LCAwLCAyLCAwLCA5NSwgNywgMywgMzgsIDE3LCAwLCAyLCAwLCAyOSwgMCwgMTEsIDM5LCA4LCAwLCAyMiwgMCwgMTIsIDQ1LCAyMCwgMCwgMTksIDcyLCAyMDAsIDMyLCAzMiwgOCwgMiwgMzYsIDE4LCAwLCA1MCwgMjksIDExMywgNiwgMiwgMSwgMiwgMzcsIDIyLCAwLCAyNiwgNSwgMiwgMSwgMiwgMzEsIDE1LCAwLCAzMjgsIDE4LCAxNiwgMCwgMiwgMTIsIDIsIDMzLCAxMjUsIDAsIDgwLCA5MjEsIDEwMywgMTEwLCAxOCwgMTk1LCAyNjM3LCA5NiwgMTYsIDEwNzEsIDE4LCA1LCAyNiwgMzk5NCwgNiwgNTgyLCA2ODQyLCAyOSwgMTc2MywgNTY4LCA4LCAzMCwgMTgsIDc4LCAxOCwgMjksIDE5LCA0NywgMTcsIDMsIDMyLCAyMCwgNiwgMTgsIDQzMywgNDQsIDIxMiwgNjMsIDEyOSwgNzQsIDYsIDAsIDY3LCAxMiwgNjUsIDEsIDIsIDAsIDI5LCA2MTM1LCA5LCAxMjM3LCA0MiwgOSwgODkzNiwgMywgMiwgNiwgMiwgMSwgMiwgMjkwLCAxNiwgMCwgMzAsIDIsIDMsIDAsIDE1LCAzLCA5LCAzOTUsIDIzMDksIDEwNiwgNiwgMTIsIDQsIDgsIDgsIDksIDU5OTEsIDg0LCAyLCA3MCwgMiwgMSwgMywgMCwgMywgMSwgMywgMywgMiwgMTEsIDIsIDAsIDIsIDYsIDIsIDY0LCAyLCAzLCAzLCA3LCAyLCA2LCAyLCAyNywgMiwgMywgMiwgNCwgMiwgMCwgNCwgNiwgMiwgMzM5LCAzLCAyNCwgMiwgMjQsIDIsIDMwLCAyLCAyNCwgMiwgMzAsIDIsIDI0LCAyLCAzMCwgMiwgMjQsIDIsIDMwLCAyLCAyNCwgMiwgNywgMTg0NSwgMzAsIDcsIDUsIDI2MiwgNjEsIDE0NywgNDQsIDExLCA2LCAxNywgMCwgMzIyLCAyOSwgMTksIDQzLCA0ODUsIDI3LCAyMjksIDI5LCAzLCAwLCA0OTYsIDYsIDIsIDMsIDIsIDEsIDIsIDE0LCAyLCAxOTYsIDYwLCA2NywgOCwgMCwgMTIwNSwgMywgMiwgMjYsIDIsIDEsIDIsIDAsIDMsIDAsIDIsIDksIDIsIDMsIDIsIDAsIDIsIDAsIDcsIDAsIDUsIDAsIDIsIDAsIDIsIDAsIDIsIDIsIDIsIDEsIDIsIDAsIDMsIDAsIDIsIDAsIDIsIDAsIDIsIDAsIDIsIDAsIDIsIDEsIDIsIDAsIDMsIDMsIDIsIDYsIDIsIDMsIDIsIDMsIDIsIDAsIDIsIDksIDIsIDE2LCA2LCAyLCAyLCA0LCAyLCAxNiwgNDQyMSwgNDI3MTksIDMzLCA0MTUzLCA3LCAyMjEsIDMsIDU3NjEsIDE1LCA3NDcyLCAxNiwgNjIxLCAyNDY3LCA1NDEsIDE1MDcsIDQ5MzgsIDYsIDQxOTFdO1xuXG4vLyBUaGlzIGZpbGUgd2FzIGdlbmVyYXRlZC4gRG8gbm90IG1vZGlmeSBtYW51YWxseSFcbnZhciBub25BU0NJSWlkZW50aWZpZXJDaGFycyA9IFwiXFx1MjAwY1xcdTIwMGRcXHhiN1xcdTAzMDAtXFx1MDM2ZlxcdTAzODdcXHUwNDgzLVxcdTA0ODdcXHUwNTkxLVxcdTA1YmRcXHUwNWJmXFx1MDVjMVxcdTA1YzJcXHUwNWM0XFx1MDVjNVxcdTA1YzdcXHUwNjEwLVxcdTA2MWFcXHUwNjRiLVxcdTA2NjlcXHUwNjcwXFx1MDZkNi1cXHUwNmRjXFx1MDZkZi1cXHUwNmU0XFx1MDZlN1xcdTA2ZThcXHUwNmVhLVxcdTA2ZWRcXHUwNmYwLVxcdTA2ZjlcXHUwNzExXFx1MDczMC1cXHUwNzRhXFx1MDdhNi1cXHUwN2IwXFx1MDdjMC1cXHUwN2M5XFx1MDdlYi1cXHUwN2YzXFx1MDdmZFxcdTA4MTYtXFx1MDgxOVxcdTA4MWItXFx1MDgyM1xcdTA4MjUtXFx1MDgyN1xcdTA4MjktXFx1MDgyZFxcdTA4NTktXFx1MDg1YlxcdTA4OTctXFx1MDg5ZlxcdTA4Y2EtXFx1MDhlMVxcdTA4ZTMtXFx1MDkwM1xcdTA5M2EtXFx1MDkzY1xcdTA5M2UtXFx1MDk0ZlxcdTA5NTEtXFx1MDk1N1xcdTA5NjJcXHUwOTYzXFx1MDk2Ni1cXHUwOTZmXFx1MDk4MS1cXHUwOTgzXFx1MDliY1xcdTA5YmUtXFx1MDljNFxcdTA5YzdcXHUwOWM4XFx1MDljYi1cXHUwOWNkXFx1MDlkN1xcdTA5ZTJcXHUwOWUzXFx1MDllNi1cXHUwOWVmXFx1MDlmZVxcdTBhMDEtXFx1MGEwM1xcdTBhM2NcXHUwYTNlLVxcdTBhNDJcXHUwYTQ3XFx1MGE0OFxcdTBhNGItXFx1MGE0ZFxcdTBhNTFcXHUwYTY2LVxcdTBhNzFcXHUwYTc1XFx1MGE4MS1cXHUwYTgzXFx1MGFiY1xcdTBhYmUtXFx1MGFjNVxcdTBhYzctXFx1MGFjOVxcdTBhY2ItXFx1MGFjZFxcdTBhZTJcXHUwYWUzXFx1MGFlNi1cXHUwYWVmXFx1MGFmYS1cXHUwYWZmXFx1MGIwMS1cXHUwYjAzXFx1MGIzY1xcdTBiM2UtXFx1MGI0NFxcdTBiNDdcXHUwYjQ4XFx1MGI0Yi1cXHUwYjRkXFx1MGI1NS1cXHUwYjU3XFx1MGI2MlxcdTBiNjNcXHUwYjY2LVxcdTBiNmZcXHUwYjgyXFx1MGJiZS1cXHUwYmMyXFx1MGJjNi1cXHUwYmM4XFx1MGJjYS1cXHUwYmNkXFx1MGJkN1xcdTBiZTYtXFx1MGJlZlxcdTBjMDAtXFx1MGMwNFxcdTBjM2NcXHUwYzNlLVxcdTBjNDRcXHUwYzQ2LVxcdTBjNDhcXHUwYzRhLVxcdTBjNGRcXHUwYzU1XFx1MGM1NlxcdTBjNjJcXHUwYzYzXFx1MGM2Ni1cXHUwYzZmXFx1MGM4MS1cXHUwYzgzXFx1MGNiY1xcdTBjYmUtXFx1MGNjNFxcdTBjYzYtXFx1MGNjOFxcdTBjY2EtXFx1MGNjZFxcdTBjZDVcXHUwY2Q2XFx1MGNlMlxcdTBjZTNcXHUwY2U2LVxcdTBjZWZcXHUwY2YzXFx1MGQwMC1cXHUwZDAzXFx1MGQzYlxcdTBkM2NcXHUwZDNlLVxcdTBkNDRcXHUwZDQ2LVxcdTBkNDhcXHUwZDRhLVxcdTBkNGRcXHUwZDU3XFx1MGQ2MlxcdTBkNjNcXHUwZDY2LVxcdTBkNmZcXHUwZDgxLVxcdTBkODNcXHUwZGNhXFx1MGRjZi1cXHUwZGQ0XFx1MGRkNlxcdTBkZDgtXFx1MGRkZlxcdTBkZTYtXFx1MGRlZlxcdTBkZjJcXHUwZGYzXFx1MGUzMVxcdTBlMzQtXFx1MGUzYVxcdTBlNDctXFx1MGU0ZVxcdTBlNTAtXFx1MGU1OVxcdTBlYjFcXHUwZWI0LVxcdTBlYmNcXHUwZWM4LVxcdTBlY2VcXHUwZWQwLVxcdTBlZDlcXHUwZjE4XFx1MGYxOVxcdTBmMjAtXFx1MGYyOVxcdTBmMzVcXHUwZjM3XFx1MGYzOVxcdTBmM2VcXHUwZjNmXFx1MGY3MS1cXHUwZjg0XFx1MGY4NlxcdTBmODdcXHUwZjhkLVxcdTBmOTdcXHUwZjk5LVxcdTBmYmNcXHUwZmM2XFx1MTAyYi1cXHUxMDNlXFx1MTA0MC1cXHUxMDQ5XFx1MTA1Ni1cXHUxMDU5XFx1MTA1ZS1cXHUxMDYwXFx1MTA2Mi1cXHUxMDY0XFx1MTA2Ny1cXHUxMDZkXFx1MTA3MS1cXHUxMDc0XFx1MTA4Mi1cXHUxMDhkXFx1MTA4Zi1cXHUxMDlkXFx1MTM1ZC1cXHUxMzVmXFx1MTM2OS1cXHUxMzcxXFx1MTcxMi1cXHUxNzE1XFx1MTczMi1cXHUxNzM0XFx1MTc1MlxcdTE3NTNcXHUxNzcyXFx1MTc3M1xcdTE3YjQtXFx1MTdkM1xcdTE3ZGRcXHUxN2UwLVxcdTE3ZTlcXHUxODBiLVxcdTE4MGRcXHUxODBmLVxcdTE4MTlcXHUxOGE5XFx1MTkyMC1cXHUxOTJiXFx1MTkzMC1cXHUxOTNiXFx1MTk0Ni1cXHUxOTRmXFx1MTlkMC1cXHUxOWRhXFx1MWExNy1cXHUxYTFiXFx1MWE1NS1cXHUxYTVlXFx1MWE2MC1cXHUxYTdjXFx1MWE3Zi1cXHUxYTg5XFx1MWE5MC1cXHUxYTk5XFx1MWFiMC1cXHUxYWJkXFx1MWFiZi1cXHUxYWNlXFx1MWIwMC1cXHUxYjA0XFx1MWIzNC1cXHUxYjQ0XFx1MWI1MC1cXHUxYjU5XFx1MWI2Yi1cXHUxYjczXFx1MWI4MC1cXHUxYjgyXFx1MWJhMS1cXHUxYmFkXFx1MWJiMC1cXHUxYmI5XFx1MWJlNi1cXHUxYmYzXFx1MWMyNC1cXHUxYzM3XFx1MWM0MC1cXHUxYzQ5XFx1MWM1MC1cXHUxYzU5XFx1MWNkMC1cXHUxY2QyXFx1MWNkNC1cXHUxY2U4XFx1MWNlZFxcdTFjZjRcXHUxY2Y3LVxcdTFjZjlcXHUxZGMwLVxcdTFkZmZcXHUyMDBjXFx1MjAwZFxcdTIwM2ZcXHUyMDQwXFx1MjA1NFxcdTIwZDAtXFx1MjBkY1xcdTIwZTFcXHUyMGU1LVxcdTIwZjBcXHUyY2VmLVxcdTJjZjFcXHUyZDdmXFx1MmRlMC1cXHUyZGZmXFx1MzAyYS1cXHUzMDJmXFx1MzA5OVxcdTMwOWFcXHUzMGZiXFx1YTYyMC1cXHVhNjI5XFx1YTY2ZlxcdWE2NzQtXFx1YTY3ZFxcdWE2OWVcXHVhNjlmXFx1YTZmMFxcdWE2ZjFcXHVhODAyXFx1YTgwNlxcdWE4MGJcXHVhODIzLVxcdWE4MjdcXHVhODJjXFx1YTg4MFxcdWE4ODFcXHVhOGI0LVxcdWE4YzVcXHVhOGQwLVxcdWE4ZDlcXHVhOGUwLVxcdWE4ZjFcXHVhOGZmLVxcdWE5MDlcXHVhOTI2LVxcdWE5MmRcXHVhOTQ3LVxcdWE5NTNcXHVhOTgwLVxcdWE5ODNcXHVhOWIzLVxcdWE5YzBcXHVhOWQwLVxcdWE5ZDlcXHVhOWU1XFx1YTlmMC1cXHVhOWY5XFx1YWEyOS1cXHVhYTM2XFx1YWE0M1xcdWFhNGNcXHVhYTRkXFx1YWE1MC1cXHVhYTU5XFx1YWE3Yi1cXHVhYTdkXFx1YWFiMFxcdWFhYjItXFx1YWFiNFxcdWFhYjdcXHVhYWI4XFx1YWFiZVxcdWFhYmZcXHVhYWMxXFx1YWFlYi1cXHVhYWVmXFx1YWFmNVxcdWFhZjZcXHVhYmUzLVxcdWFiZWFcXHVhYmVjXFx1YWJlZFxcdWFiZjAtXFx1YWJmOVxcdWZiMWVcXHVmZTAwLVxcdWZlMGZcXHVmZTIwLVxcdWZlMmZcXHVmZTMzXFx1ZmUzNFxcdWZlNGQtXFx1ZmU0ZlxcdWZmMTAtXFx1ZmYxOVxcdWZmM2ZcXHVmZjY1XCI7XG5cbi8vIFRoaXMgZmlsZSB3YXMgZ2VuZXJhdGVkLiBEbyBub3QgbW9kaWZ5IG1hbnVhbGx5IVxudmFyIG5vbkFTQ0lJaWRlbnRpZmllclN0YXJ0Q2hhcnMgPSBcIlxceGFhXFx4YjVcXHhiYVxceGMwLVxceGQ2XFx4ZDgtXFx4ZjZcXHhmOC1cXHUwMmMxXFx1MDJjNi1cXHUwMmQxXFx1MDJlMC1cXHUwMmU0XFx1MDJlY1xcdTAyZWVcXHUwMzcwLVxcdTAzNzRcXHUwMzc2XFx1MDM3N1xcdTAzN2EtXFx1MDM3ZFxcdTAzN2ZcXHUwMzg2XFx1MDM4OC1cXHUwMzhhXFx1MDM4Y1xcdTAzOGUtXFx1MDNhMVxcdTAzYTMtXFx1MDNmNVxcdTAzZjctXFx1MDQ4MVxcdTA0OGEtXFx1MDUyZlxcdTA1MzEtXFx1MDU1NlxcdTA1NTlcXHUwNTYwLVxcdTA1ODhcXHUwNWQwLVxcdTA1ZWFcXHUwNWVmLVxcdTA1ZjJcXHUwNjIwLVxcdTA2NGFcXHUwNjZlXFx1MDY2ZlxcdTA2NzEtXFx1MDZkM1xcdTA2ZDVcXHUwNmU1XFx1MDZlNlxcdTA2ZWVcXHUwNmVmXFx1MDZmYS1cXHUwNmZjXFx1MDZmZlxcdTA3MTBcXHUwNzEyLVxcdTA3MmZcXHUwNzRkLVxcdTA3YTVcXHUwN2IxXFx1MDdjYS1cXHUwN2VhXFx1MDdmNFxcdTA3ZjVcXHUwN2ZhXFx1MDgwMC1cXHUwODE1XFx1MDgxYVxcdTA4MjRcXHUwODI4XFx1MDg0MC1cXHUwODU4XFx1MDg2MC1cXHUwODZhXFx1MDg3MC1cXHUwODg3XFx1MDg4OS1cXHUwODhlXFx1MDhhMC1cXHUwOGM5XFx1MDkwNC1cXHUwOTM5XFx1MDkzZFxcdTA5NTBcXHUwOTU4LVxcdTA5NjFcXHUwOTcxLVxcdTA5ODBcXHUwOTg1LVxcdTA5OGNcXHUwOThmXFx1MDk5MFxcdTA5OTMtXFx1MDlhOFxcdTA5YWEtXFx1MDliMFxcdTA5YjJcXHUwOWI2LVxcdTA5YjlcXHUwOWJkXFx1MDljZVxcdTA5ZGNcXHUwOWRkXFx1MDlkZi1cXHUwOWUxXFx1MDlmMFxcdTA5ZjFcXHUwOWZjXFx1MGEwNS1cXHUwYTBhXFx1MGEwZlxcdTBhMTBcXHUwYTEzLVxcdTBhMjhcXHUwYTJhLVxcdTBhMzBcXHUwYTMyXFx1MGEzM1xcdTBhMzVcXHUwYTM2XFx1MGEzOFxcdTBhMzlcXHUwYTU5LVxcdTBhNWNcXHUwYTVlXFx1MGE3Mi1cXHUwYTc0XFx1MGE4NS1cXHUwYThkXFx1MGE4Zi1cXHUwYTkxXFx1MGE5My1cXHUwYWE4XFx1MGFhYS1cXHUwYWIwXFx1MGFiMlxcdTBhYjNcXHUwYWI1LVxcdTBhYjlcXHUwYWJkXFx1MGFkMFxcdTBhZTBcXHUwYWUxXFx1MGFmOVxcdTBiMDUtXFx1MGIwY1xcdTBiMGZcXHUwYjEwXFx1MGIxMy1cXHUwYjI4XFx1MGIyYS1cXHUwYjMwXFx1MGIzMlxcdTBiMzNcXHUwYjM1LVxcdTBiMzlcXHUwYjNkXFx1MGI1Y1xcdTBiNWRcXHUwYjVmLVxcdTBiNjFcXHUwYjcxXFx1MGI4M1xcdTBiODUtXFx1MGI4YVxcdTBiOGUtXFx1MGI5MFxcdTBiOTItXFx1MGI5NVxcdTBiOTlcXHUwYjlhXFx1MGI5Y1xcdTBiOWVcXHUwYjlmXFx1MGJhM1xcdTBiYTRcXHUwYmE4LVxcdTBiYWFcXHUwYmFlLVxcdTBiYjlcXHUwYmQwXFx1MGMwNS1cXHUwYzBjXFx1MGMwZS1cXHUwYzEwXFx1MGMxMi1cXHUwYzI4XFx1MGMyYS1cXHUwYzM5XFx1MGMzZFxcdTBjNTgtXFx1MGM1YVxcdTBjNWRcXHUwYzYwXFx1MGM2MVxcdTBjODBcXHUwYzg1LVxcdTBjOGNcXHUwYzhlLVxcdTBjOTBcXHUwYzkyLVxcdTBjYThcXHUwY2FhLVxcdTBjYjNcXHUwY2I1LVxcdTBjYjlcXHUwY2JkXFx1MGNkZFxcdTBjZGVcXHUwY2UwXFx1MGNlMVxcdTBjZjFcXHUwY2YyXFx1MGQwNC1cXHUwZDBjXFx1MGQwZS1cXHUwZDEwXFx1MGQxMi1cXHUwZDNhXFx1MGQzZFxcdTBkNGVcXHUwZDU0LVxcdTBkNTZcXHUwZDVmLVxcdTBkNjFcXHUwZDdhLVxcdTBkN2ZcXHUwZDg1LVxcdTBkOTZcXHUwZDlhLVxcdTBkYjFcXHUwZGIzLVxcdTBkYmJcXHUwZGJkXFx1MGRjMC1cXHUwZGM2XFx1MGUwMS1cXHUwZTMwXFx1MGUzMlxcdTBlMzNcXHUwZTQwLVxcdTBlNDZcXHUwZTgxXFx1MGU4MlxcdTBlODRcXHUwZTg2LVxcdTBlOGFcXHUwZThjLVxcdTBlYTNcXHUwZWE1XFx1MGVhNy1cXHUwZWIwXFx1MGViMlxcdTBlYjNcXHUwZWJkXFx1MGVjMC1cXHUwZWM0XFx1MGVjNlxcdTBlZGMtXFx1MGVkZlxcdTBmMDBcXHUwZjQwLVxcdTBmNDdcXHUwZjQ5LVxcdTBmNmNcXHUwZjg4LVxcdTBmOGNcXHUxMDAwLVxcdTEwMmFcXHUxMDNmXFx1MTA1MC1cXHUxMDU1XFx1MTA1YS1cXHUxMDVkXFx1MTA2MVxcdTEwNjVcXHUxMDY2XFx1MTA2ZS1cXHUxMDcwXFx1MTA3NS1cXHUxMDgxXFx1MTA4ZVxcdTEwYTAtXFx1MTBjNVxcdTEwYzdcXHUxMGNkXFx1MTBkMC1cXHUxMGZhXFx1MTBmYy1cXHUxMjQ4XFx1MTI0YS1cXHUxMjRkXFx1MTI1MC1cXHUxMjU2XFx1MTI1OFxcdTEyNWEtXFx1MTI1ZFxcdTEyNjAtXFx1MTI4OFxcdTEyOGEtXFx1MTI4ZFxcdTEyOTAtXFx1MTJiMFxcdTEyYjItXFx1MTJiNVxcdTEyYjgtXFx1MTJiZVxcdTEyYzBcXHUxMmMyLVxcdTEyYzVcXHUxMmM4LVxcdTEyZDZcXHUxMmQ4LVxcdTEzMTBcXHUxMzEyLVxcdTEzMTVcXHUxMzE4LVxcdTEzNWFcXHUxMzgwLVxcdTEzOGZcXHUxM2EwLVxcdTEzZjVcXHUxM2Y4LVxcdTEzZmRcXHUxNDAxLVxcdTE2NmNcXHUxNjZmLVxcdTE2N2ZcXHUxNjgxLVxcdTE2OWFcXHUxNmEwLVxcdTE2ZWFcXHUxNmVlLVxcdTE2ZjhcXHUxNzAwLVxcdTE3MTFcXHUxNzFmLVxcdTE3MzFcXHUxNzQwLVxcdTE3NTFcXHUxNzYwLVxcdTE3NmNcXHUxNzZlLVxcdTE3NzBcXHUxNzgwLVxcdTE3YjNcXHUxN2Q3XFx1MTdkY1xcdTE4MjAtXFx1MTg3OFxcdTE4ODAtXFx1MThhOFxcdTE4YWFcXHUxOGIwLVxcdTE4ZjVcXHUxOTAwLVxcdTE5MWVcXHUxOTUwLVxcdTE5NmRcXHUxOTcwLVxcdTE5NzRcXHUxOTgwLVxcdTE5YWJcXHUxOWIwLVxcdTE5YzlcXHUxYTAwLVxcdTFhMTZcXHUxYTIwLVxcdTFhNTRcXHUxYWE3XFx1MWIwNS1cXHUxYjMzXFx1MWI0NS1cXHUxYjRjXFx1MWI4My1cXHUxYmEwXFx1MWJhZVxcdTFiYWZcXHUxYmJhLVxcdTFiZTVcXHUxYzAwLVxcdTFjMjNcXHUxYzRkLVxcdTFjNGZcXHUxYzVhLVxcdTFjN2RcXHUxYzgwLVxcdTFjOGFcXHUxYzkwLVxcdTFjYmFcXHUxY2JkLVxcdTFjYmZcXHUxY2U5LVxcdTFjZWNcXHUxY2VlLVxcdTFjZjNcXHUxY2Y1XFx1MWNmNlxcdTFjZmFcXHUxZDAwLVxcdTFkYmZcXHUxZTAwLVxcdTFmMTVcXHUxZjE4LVxcdTFmMWRcXHUxZjIwLVxcdTFmNDVcXHUxZjQ4LVxcdTFmNGRcXHUxZjUwLVxcdTFmNTdcXHUxZjU5XFx1MWY1YlxcdTFmNWRcXHUxZjVmLVxcdTFmN2RcXHUxZjgwLVxcdTFmYjRcXHUxZmI2LVxcdTFmYmNcXHUxZmJlXFx1MWZjMi1cXHUxZmM0XFx1MWZjNi1cXHUxZmNjXFx1MWZkMC1cXHUxZmQzXFx1MWZkNi1cXHUxZmRiXFx1MWZlMC1cXHUxZmVjXFx1MWZmMi1cXHUxZmY0XFx1MWZmNi1cXHUxZmZjXFx1MjA3MVxcdTIwN2ZcXHUyMDkwLVxcdTIwOWNcXHUyMTAyXFx1MjEwN1xcdTIxMGEtXFx1MjExM1xcdTIxMTVcXHUyMTE4LVxcdTIxMWRcXHUyMTI0XFx1MjEyNlxcdTIxMjhcXHUyMTJhLVxcdTIxMzlcXHUyMTNjLVxcdTIxM2ZcXHUyMTQ1LVxcdTIxNDlcXHUyMTRlXFx1MjE2MC1cXHUyMTg4XFx1MmMwMC1cXHUyY2U0XFx1MmNlYi1cXHUyY2VlXFx1MmNmMlxcdTJjZjNcXHUyZDAwLVxcdTJkMjVcXHUyZDI3XFx1MmQyZFxcdTJkMzAtXFx1MmQ2N1xcdTJkNmZcXHUyZDgwLVxcdTJkOTZcXHUyZGEwLVxcdTJkYTZcXHUyZGE4LVxcdTJkYWVcXHUyZGIwLVxcdTJkYjZcXHUyZGI4LVxcdTJkYmVcXHUyZGMwLVxcdTJkYzZcXHUyZGM4LVxcdTJkY2VcXHUyZGQwLVxcdTJkZDZcXHUyZGQ4LVxcdTJkZGVcXHUzMDA1LVxcdTMwMDdcXHUzMDIxLVxcdTMwMjlcXHUzMDMxLVxcdTMwMzVcXHUzMDM4LVxcdTMwM2NcXHUzMDQxLVxcdTMwOTZcXHUzMDliLVxcdTMwOWZcXHUzMGExLVxcdTMwZmFcXHUzMGZjLVxcdTMwZmZcXHUzMTA1LVxcdTMxMmZcXHUzMTMxLVxcdTMxOGVcXHUzMWEwLVxcdTMxYmZcXHUzMWYwLVxcdTMxZmZcXHUzNDAwLVxcdTRkYmZcXHU0ZTAwLVxcdWE0OGNcXHVhNGQwLVxcdWE0ZmRcXHVhNTAwLVxcdWE2MGNcXHVhNjEwLVxcdWE2MWZcXHVhNjJhXFx1YTYyYlxcdWE2NDAtXFx1YTY2ZVxcdWE2N2YtXFx1YTY5ZFxcdWE2YTAtXFx1YTZlZlxcdWE3MTctXFx1YTcxZlxcdWE3MjItXFx1YTc4OFxcdWE3OGItXFx1YTdjZFxcdWE3ZDBcXHVhN2QxXFx1YTdkM1xcdWE3ZDUtXFx1YTdkY1xcdWE3ZjItXFx1YTgwMVxcdWE4MDMtXFx1YTgwNVxcdWE4MDctXFx1YTgwYVxcdWE4MGMtXFx1YTgyMlxcdWE4NDAtXFx1YTg3M1xcdWE4ODItXFx1YThiM1xcdWE4ZjItXFx1YThmN1xcdWE4ZmJcXHVhOGZkXFx1YThmZVxcdWE5MGEtXFx1YTkyNVxcdWE5MzAtXFx1YTk0NlxcdWE5NjAtXFx1YTk3Y1xcdWE5ODQtXFx1YTliMlxcdWE5Y2ZcXHVhOWUwLVxcdWE5ZTRcXHVhOWU2LVxcdWE5ZWZcXHVhOWZhLVxcdWE5ZmVcXHVhYTAwLVxcdWFhMjhcXHVhYTQwLVxcdWFhNDJcXHVhYTQ0LVxcdWFhNGJcXHVhYTYwLVxcdWFhNzZcXHVhYTdhXFx1YWE3ZS1cXHVhYWFmXFx1YWFiMVxcdWFhYjVcXHVhYWI2XFx1YWFiOS1cXHVhYWJkXFx1YWFjMFxcdWFhYzJcXHVhYWRiLVxcdWFhZGRcXHVhYWUwLVxcdWFhZWFcXHVhYWYyLVxcdWFhZjRcXHVhYjAxLVxcdWFiMDZcXHVhYjA5LVxcdWFiMGVcXHVhYjExLVxcdWFiMTZcXHVhYjIwLVxcdWFiMjZcXHVhYjI4LVxcdWFiMmVcXHVhYjMwLVxcdWFiNWFcXHVhYjVjLVxcdWFiNjlcXHVhYjcwLVxcdWFiZTJcXHVhYzAwLVxcdWQ3YTNcXHVkN2IwLVxcdWQ3YzZcXHVkN2NiLVxcdWQ3ZmJcXHVmOTAwLVxcdWZhNmRcXHVmYTcwLVxcdWZhZDlcXHVmYjAwLVxcdWZiMDZcXHVmYjEzLVxcdWZiMTdcXHVmYjFkXFx1ZmIxZi1cXHVmYjI4XFx1ZmIyYS1cXHVmYjM2XFx1ZmIzOC1cXHVmYjNjXFx1ZmIzZVxcdWZiNDBcXHVmYjQxXFx1ZmI0M1xcdWZiNDRcXHVmYjQ2LVxcdWZiYjFcXHVmYmQzLVxcdWZkM2RcXHVmZDUwLVxcdWZkOGZcXHVmZDkyLVxcdWZkYzdcXHVmZGYwLVxcdWZkZmJcXHVmZTcwLVxcdWZlNzRcXHVmZTc2LVxcdWZlZmNcXHVmZjIxLVxcdWZmM2FcXHVmZjQxLVxcdWZmNWFcXHVmZjY2LVxcdWZmYmVcXHVmZmMyLVxcdWZmYzdcXHVmZmNhLVxcdWZmY2ZcXHVmZmQyLVxcdWZmZDdcXHVmZmRhLVxcdWZmZGNcIjtcblxuLy8gVGhlc2UgYXJlIGEgcnVuLWxlbmd0aCBhbmQgb2Zmc2V0IGVuY29kZWQgcmVwcmVzZW50YXRpb24gb2YgdGhlXG4vLyA+MHhmZmZmIGNvZGUgcG9pbnRzIHRoYXQgYXJlIGEgdmFsaWQgcGFydCBvZiBpZGVudGlmaWVycy4gVGhlXG4vLyBvZmZzZXQgc3RhcnRzIGF0IDB4MTAwMDAsIGFuZCBlYWNoIHBhaXIgb2YgbnVtYmVycyByZXByZXNlbnRzIGFuXG4vLyBvZmZzZXQgdG8gdGhlIG5leHQgcmFuZ2UsIGFuZCB0aGVuIGEgc2l6ZSBvZiB0aGUgcmFuZ2UuXG5cbi8vIFJlc2VydmVkIHdvcmQgbGlzdHMgZm9yIHZhcmlvdXMgZGlhbGVjdHMgb2YgdGhlIGxhbmd1YWdlXG5cbnZhciByZXNlcnZlZFdvcmRzID0ge1xuICAzOiBcImFic3RyYWN0IGJvb2xlYW4gYnl0ZSBjaGFyIGNsYXNzIGRvdWJsZSBlbnVtIGV4cG9ydCBleHRlbmRzIGZpbmFsIGZsb2F0IGdvdG8gaW1wbGVtZW50cyBpbXBvcnQgaW50IGludGVyZmFjZSBsb25nIG5hdGl2ZSBwYWNrYWdlIHByaXZhdGUgcHJvdGVjdGVkIHB1YmxpYyBzaG9ydCBzdGF0aWMgc3VwZXIgc3luY2hyb25pemVkIHRocm93cyB0cmFuc2llbnQgdm9sYXRpbGVcIixcbiAgNTogXCJjbGFzcyBlbnVtIGV4dGVuZHMgc3VwZXIgY29uc3QgZXhwb3J0IGltcG9ydFwiLFxuICA2OiBcImVudW1cIixcbiAgc3RyaWN0OiBcImltcGxlbWVudHMgaW50ZXJmYWNlIGxldCBwYWNrYWdlIHByaXZhdGUgcHJvdGVjdGVkIHB1YmxpYyBzdGF0aWMgeWllbGRcIixcbiAgc3RyaWN0QmluZDogXCJldmFsIGFyZ3VtZW50c1wiXG59O1xuXG4vLyBBbmQgdGhlIGtleXdvcmRzXG5cbnZhciBlY21hNUFuZExlc3NLZXl3b3JkcyA9IFwiYnJlYWsgY2FzZSBjYXRjaCBjb250aW51ZSBkZWJ1Z2dlciBkZWZhdWx0IGRvIGVsc2UgZmluYWxseSBmb3IgZnVuY3Rpb24gaWYgcmV0dXJuIHN3aXRjaCB0aHJvdyB0cnkgdmFyIHdoaWxlIHdpdGggbnVsbCB0cnVlIGZhbHNlIGluc3RhbmNlb2YgdHlwZW9mIHZvaWQgZGVsZXRlIG5ldyBpbiB0aGlzXCI7XG5cbnZhciBrZXl3b3JkcyQxID0ge1xuICA1OiBlY21hNUFuZExlc3NLZXl3b3JkcyxcbiAgXCI1bW9kdWxlXCI6IGVjbWE1QW5kTGVzc0tleXdvcmRzICsgXCIgZXhwb3J0IGltcG9ydFwiLFxuICA2OiBlY21hNUFuZExlc3NLZXl3b3JkcyArIFwiIGNvbnN0IGNsYXNzIGV4dGVuZHMgZXhwb3J0IGltcG9ydCBzdXBlclwiXG59O1xuXG52YXIga2V5d29yZFJlbGF0aW9uYWxPcGVyYXRvciA9IC9eaW4oc3RhbmNlb2YpPyQvO1xuXG4vLyAjIyBDaGFyYWN0ZXIgY2F0ZWdvcmllc1xuXG52YXIgbm9uQVNDSUlpZGVudGlmaWVyU3RhcnQgPSBuZXcgUmVnRXhwKFwiW1wiICsgbm9uQVNDSUlpZGVudGlmaWVyU3RhcnRDaGFycyArIFwiXVwiKTtcbnZhciBub25BU0NJSWlkZW50aWZpZXIgPSBuZXcgUmVnRXhwKFwiW1wiICsgbm9uQVNDSUlpZGVudGlmaWVyU3RhcnRDaGFycyArIG5vbkFTQ0lJaWRlbnRpZmllckNoYXJzICsgXCJdXCIpO1xuXG4vLyBUaGlzIGhhcyBhIGNvbXBsZXhpdHkgbGluZWFyIHRvIHRoZSB2YWx1ZSBvZiB0aGUgY29kZS4gVGhlXG4vLyBhc3N1bXB0aW9uIGlzIHRoYXQgbG9va2luZyB1cCBhc3RyYWwgaWRlbnRpZmllciBjaGFyYWN0ZXJzIGlzXG4vLyByYXJlLlxuZnVuY3Rpb24gaXNJbkFzdHJhbFNldChjb2RlLCBzZXQpIHtcbiAgdmFyIHBvcyA9IDB4MTAwMDA7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc2V0Lmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcG9zICs9IHNldFtpXTtcbiAgICBpZiAocG9zID4gY29kZSkgeyByZXR1cm4gZmFsc2UgfVxuICAgIHBvcyArPSBzZXRbaSArIDFdO1xuICAgIGlmIChwb3MgPj0gY29kZSkgeyByZXR1cm4gdHJ1ZSB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8vIFRlc3Qgd2hldGhlciBhIGdpdmVuIGNoYXJhY3RlciBjb2RlIHN0YXJ0cyBhbiBpZGVudGlmaWVyLlxuXG5mdW5jdGlvbiBpc0lkZW50aWZpZXJTdGFydChjb2RlLCBhc3RyYWwpIHtcbiAgaWYgKGNvZGUgPCA2NSkgeyByZXR1cm4gY29kZSA9PT0gMzYgfVxuICBpZiAoY29kZSA8IDkxKSB7IHJldHVybiB0cnVlIH1cbiAgaWYgKGNvZGUgPCA5NykgeyByZXR1cm4gY29kZSA9PT0gOTUgfVxuICBpZiAoY29kZSA8IDEyMykgeyByZXR1cm4gdHJ1ZSB9XG4gIGlmIChjb2RlIDw9IDB4ZmZmZikgeyByZXR1cm4gY29kZSA+PSAweGFhICYmIG5vbkFTQ0lJaWRlbnRpZmllclN0YXJ0LnRlc3QoU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKSkgfVxuICBpZiAoYXN0cmFsID09PSBmYWxzZSkgeyByZXR1cm4gZmFsc2UgfVxuICByZXR1cm4gaXNJbkFzdHJhbFNldChjb2RlLCBhc3RyYWxJZGVudGlmaWVyU3RhcnRDb2Rlcylcbn1cblxuLy8gVGVzdCB3aGV0aGVyIGEgZ2l2ZW4gY2hhcmFjdGVyIGlzIHBhcnQgb2YgYW4gaWRlbnRpZmllci5cblxuZnVuY3Rpb24gaXNJZGVudGlmaWVyQ2hhcihjb2RlLCBhc3RyYWwpIHtcbiAgaWYgKGNvZGUgPCA0OCkgeyByZXR1cm4gY29kZSA9PT0gMzYgfVxuICBpZiAoY29kZSA8IDU4KSB7IHJldHVybiB0cnVlIH1cbiAgaWYgKGNvZGUgPCA2NSkgeyByZXR1cm4gZmFsc2UgfVxuICBpZiAoY29kZSA8IDkxKSB7IHJldHVybiB0cnVlIH1cbiAgaWYgKGNvZGUgPCA5NykgeyByZXR1cm4gY29kZSA9PT0gOTUgfVxuICBpZiAoY29kZSA8IDEyMykgeyByZXR1cm4gdHJ1ZSB9XG4gIGlmIChjb2RlIDw9IDB4ZmZmZikgeyByZXR1cm4gY29kZSA+PSAweGFhICYmIG5vbkFTQ0lJaWRlbnRpZmllci50ZXN0KFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSkpIH1cbiAgaWYgKGFzdHJhbCA9PT0gZmFsc2UpIHsgcmV0dXJuIGZhbHNlIH1cbiAgcmV0dXJuIGlzSW5Bc3RyYWxTZXQoY29kZSwgYXN0cmFsSWRlbnRpZmllclN0YXJ0Q29kZXMpIHx8IGlzSW5Bc3RyYWxTZXQoY29kZSwgYXN0cmFsSWRlbnRpZmllckNvZGVzKVxufVxuXG4vLyAjIyBUb2tlbiB0eXBlc1xuXG4vLyBUaGUgYXNzaWdubWVudCBvZiBmaW5lLWdyYWluZWQsIGluZm9ybWF0aW9uLWNhcnJ5aW5nIHR5cGUgb2JqZWN0c1xuLy8gYWxsb3dzIHRoZSB0b2tlbml6ZXIgdG8gc3RvcmUgdGhlIGluZm9ybWF0aW9uIGl0IGhhcyBhYm91dCBhXG4vLyB0b2tlbiBpbiBhIHdheSB0aGF0IGlzIHZlcnkgY2hlYXAgZm9yIHRoZSBwYXJzZXIgdG8gbG9vayB1cC5cblxuLy8gQWxsIHRva2VuIHR5cGUgdmFyaWFibGVzIHN0YXJ0IHdpdGggYW4gdW5kZXJzY29yZSwgdG8gbWFrZSB0aGVtXG4vLyBlYXN5IHRvIHJlY29nbml6ZS5cblxuLy8gVGhlIGBiZWZvcmVFeHByYCBwcm9wZXJ0eSBpcyB1c2VkIHRvIGRpc2FtYmlndWF0ZSBiZXR3ZWVuIHJlZ3VsYXJcbi8vIGV4cHJlc3Npb25zIGFuZCBkaXZpc2lvbnMuIEl0IGlzIHNldCBvbiBhbGwgdG9rZW4gdHlwZXMgdGhhdCBjYW5cbi8vIGJlIGZvbGxvd2VkIGJ5IGFuIGV4cHJlc3Npb24gKHRodXMsIGEgc2xhc2ggYWZ0ZXIgdGhlbSB3b3VsZCBiZSBhXG4vLyByZWd1bGFyIGV4cHJlc3Npb24pLlxuLy9cbi8vIFRoZSBgc3RhcnRzRXhwcmAgcHJvcGVydHkgaXMgdXNlZCB0byBjaGVjayBpZiB0aGUgdG9rZW4gZW5kcyBhXG4vLyBgeWllbGRgIGV4cHJlc3Npb24uIEl0IGlzIHNldCBvbiBhbGwgdG9rZW4gdHlwZXMgdGhhdCBlaXRoZXIgY2FuXG4vLyBkaXJlY3RseSBzdGFydCBhbiBleHByZXNzaW9uIChsaWtlIGEgcXVvdGF0aW9uIG1hcmspIG9yIGNhblxuLy8gY29udGludWUgYW4gZXhwcmVzc2lvbiAobGlrZSB0aGUgYm9keSBvZiBhIHN0cmluZykuXG4vL1xuLy8gYGlzTG9vcGAgbWFya3MgYSBrZXl3b3JkIGFzIHN0YXJ0aW5nIGEgbG9vcCwgd2hpY2ggaXMgaW1wb3J0YW50XG4vLyB0byBrbm93IHdoZW4gcGFyc2luZyBhIGxhYmVsLCBpbiBvcmRlciB0byBhbGxvdyBvciBkaXNhbGxvd1xuLy8gY29udGludWUganVtcHMgdG8gdGhhdCBsYWJlbC5cblxudmFyIFRva2VuVHlwZSA9IGZ1bmN0aW9uIFRva2VuVHlwZShsYWJlbCwgY29uZikge1xuICBpZiAoIGNvbmYgPT09IHZvaWQgMCApIGNvbmYgPSB7fTtcblxuICB0aGlzLmxhYmVsID0gbGFiZWw7XG4gIHRoaXMua2V5d29yZCA9IGNvbmYua2V5d29yZDtcbiAgdGhpcy5iZWZvcmVFeHByID0gISFjb25mLmJlZm9yZUV4cHI7XG4gIHRoaXMuc3RhcnRzRXhwciA9ICEhY29uZi5zdGFydHNFeHByO1xuICB0aGlzLmlzTG9vcCA9ICEhY29uZi5pc0xvb3A7XG4gIHRoaXMuaXNBc3NpZ24gPSAhIWNvbmYuaXNBc3NpZ247XG4gIHRoaXMucHJlZml4ID0gISFjb25mLnByZWZpeDtcbiAgdGhpcy5wb3N0Zml4ID0gISFjb25mLnBvc3RmaXg7XG4gIHRoaXMuYmlub3AgPSBjb25mLmJpbm9wIHx8IG51bGw7XG4gIHRoaXMudXBkYXRlQ29udGV4dCA9IG51bGw7XG59O1xuXG5mdW5jdGlvbiBiaW5vcChuYW1lLCBwcmVjKSB7XG4gIHJldHVybiBuZXcgVG9rZW5UeXBlKG5hbWUsIHtiZWZvcmVFeHByOiB0cnVlLCBiaW5vcDogcHJlY30pXG59XG52YXIgYmVmb3JlRXhwciA9IHtiZWZvcmVFeHByOiB0cnVlfSwgc3RhcnRzRXhwciA9IHtzdGFydHNFeHByOiB0cnVlfTtcblxuLy8gTWFwIGtleXdvcmQgbmFtZXMgdG8gdG9rZW4gdHlwZXMuXG5cbnZhciBrZXl3b3JkcyA9IHt9O1xuXG4vLyBTdWNjaW5jdCBkZWZpbml0aW9ucyBvZiBrZXl3b3JkIHRva2VuIHR5cGVzXG5mdW5jdGlvbiBrdyhuYW1lLCBvcHRpb25zKSB7XG4gIGlmICggb3B0aW9ucyA9PT0gdm9pZCAwICkgb3B0aW9ucyA9IHt9O1xuXG4gIG9wdGlvbnMua2V5d29yZCA9IG5hbWU7XG4gIHJldHVybiBrZXl3b3Jkc1tuYW1lXSA9IG5ldyBUb2tlblR5cGUobmFtZSwgb3B0aW9ucylcbn1cblxudmFyIHR5cGVzJDEgPSB7XG4gIG51bTogbmV3IFRva2VuVHlwZShcIm51bVwiLCBzdGFydHNFeHByKSxcbiAgcmVnZXhwOiBuZXcgVG9rZW5UeXBlKFwicmVnZXhwXCIsIHN0YXJ0c0V4cHIpLFxuICBzdHJpbmc6IG5ldyBUb2tlblR5cGUoXCJzdHJpbmdcIiwgc3RhcnRzRXhwciksXG4gIG5hbWU6IG5ldyBUb2tlblR5cGUoXCJuYW1lXCIsIHN0YXJ0c0V4cHIpLFxuICBwcml2YXRlSWQ6IG5ldyBUb2tlblR5cGUoXCJwcml2YXRlSWRcIiwgc3RhcnRzRXhwciksXG4gIGVvZjogbmV3IFRva2VuVHlwZShcImVvZlwiKSxcblxuICAvLyBQdW5jdHVhdGlvbiB0b2tlbiB0eXBlcy5cbiAgYnJhY2tldEw6IG5ldyBUb2tlblR5cGUoXCJbXCIsIHtiZWZvcmVFeHByOiB0cnVlLCBzdGFydHNFeHByOiB0cnVlfSksXG4gIGJyYWNrZXRSOiBuZXcgVG9rZW5UeXBlKFwiXVwiKSxcbiAgYnJhY2VMOiBuZXcgVG9rZW5UeXBlKFwie1wiLCB7YmVmb3JlRXhwcjogdHJ1ZSwgc3RhcnRzRXhwcjogdHJ1ZX0pLFxuICBicmFjZVI6IG5ldyBUb2tlblR5cGUoXCJ9XCIpLFxuICBwYXJlbkw6IG5ldyBUb2tlblR5cGUoXCIoXCIsIHtiZWZvcmVFeHByOiB0cnVlLCBzdGFydHNFeHByOiB0cnVlfSksXG4gIHBhcmVuUjogbmV3IFRva2VuVHlwZShcIilcIiksXG4gIGNvbW1hOiBuZXcgVG9rZW5UeXBlKFwiLFwiLCBiZWZvcmVFeHByKSxcbiAgc2VtaTogbmV3IFRva2VuVHlwZShcIjtcIiwgYmVmb3JlRXhwciksXG4gIGNvbG9uOiBuZXcgVG9rZW5UeXBlKFwiOlwiLCBiZWZvcmVFeHByKSxcbiAgZG90OiBuZXcgVG9rZW5UeXBlKFwiLlwiKSxcbiAgcXVlc3Rpb246IG5ldyBUb2tlblR5cGUoXCI/XCIsIGJlZm9yZUV4cHIpLFxuICBxdWVzdGlvbkRvdDogbmV3IFRva2VuVHlwZShcIj8uXCIpLFxuICBhcnJvdzogbmV3IFRva2VuVHlwZShcIj0+XCIsIGJlZm9yZUV4cHIpLFxuICB0ZW1wbGF0ZTogbmV3IFRva2VuVHlwZShcInRlbXBsYXRlXCIpLFxuICBpbnZhbGlkVGVtcGxhdGU6IG5ldyBUb2tlblR5cGUoXCJpbnZhbGlkVGVtcGxhdGVcIiksXG4gIGVsbGlwc2lzOiBuZXcgVG9rZW5UeXBlKFwiLi4uXCIsIGJlZm9yZUV4cHIpLFxuICBiYWNrUXVvdGU6IG5ldyBUb2tlblR5cGUoXCJgXCIsIHN0YXJ0c0V4cHIpLFxuICBkb2xsYXJCcmFjZUw6IG5ldyBUb2tlblR5cGUoXCIke1wiLCB7YmVmb3JlRXhwcjogdHJ1ZSwgc3RhcnRzRXhwcjogdHJ1ZX0pLFxuXG4gIC8vIE9wZXJhdG9ycy4gVGhlc2UgY2Fycnkgc2V2ZXJhbCBraW5kcyBvZiBwcm9wZXJ0aWVzIHRvIGhlbHAgdGhlXG4gIC8vIHBhcnNlciB1c2UgdGhlbSBwcm9wZXJseSAodGhlIHByZXNlbmNlIG9mIHRoZXNlIHByb3BlcnRpZXMgaXNcbiAgLy8gd2hhdCBjYXRlZ29yaXplcyB0aGVtIGFzIG9wZXJhdG9ycykuXG4gIC8vXG4gIC8vIGBiaW5vcGAsIHdoZW4gcHJlc2VudCwgc3BlY2lmaWVzIHRoYXQgdGhpcyBvcGVyYXRvciBpcyBhIGJpbmFyeVxuICAvLyBvcGVyYXRvciwgYW5kIHdpbGwgcmVmZXIgdG8gaXRzIHByZWNlZGVuY2UuXG4gIC8vXG4gIC8vIGBwcmVmaXhgIGFuZCBgcG9zdGZpeGAgbWFyayB0aGUgb3BlcmF0b3IgYXMgYSBwcmVmaXggb3IgcG9zdGZpeFxuICAvLyB1bmFyeSBvcGVyYXRvci5cbiAgLy9cbiAgLy8gYGlzQXNzaWduYCBtYXJrcyBhbGwgb2YgYD1gLCBgKz1gLCBgLT1gIGV0Y2V0ZXJhLCB3aGljaCBhY3QgYXNcbiAgLy8gYmluYXJ5IG9wZXJhdG9ycyB3aXRoIGEgdmVyeSBsb3cgcHJlY2VkZW5jZSwgdGhhdCBzaG91bGQgcmVzdWx0XG4gIC8vIGluIEFzc2lnbm1lbnRFeHByZXNzaW9uIG5vZGVzLlxuXG4gIGVxOiBuZXcgVG9rZW5UeXBlKFwiPVwiLCB7YmVmb3JlRXhwcjogdHJ1ZSwgaXNBc3NpZ246IHRydWV9KSxcbiAgYXNzaWduOiBuZXcgVG9rZW5UeXBlKFwiXz1cIiwge2JlZm9yZUV4cHI6IHRydWUsIGlzQXNzaWduOiB0cnVlfSksXG4gIGluY0RlYzogbmV3IFRva2VuVHlwZShcIisrLy0tXCIsIHtwcmVmaXg6IHRydWUsIHBvc3RmaXg6IHRydWUsIHN0YXJ0c0V4cHI6IHRydWV9KSxcbiAgcHJlZml4OiBuZXcgVG9rZW5UeXBlKFwiIS9+XCIsIHtiZWZvcmVFeHByOiB0cnVlLCBwcmVmaXg6IHRydWUsIHN0YXJ0c0V4cHI6IHRydWV9KSxcbiAgbG9naWNhbE9SOiBiaW5vcChcInx8XCIsIDEpLFxuICBsb2dpY2FsQU5EOiBiaW5vcChcIiYmXCIsIDIpLFxuICBiaXR3aXNlT1I6IGJpbm9wKFwifFwiLCAzKSxcbiAgYml0d2lzZVhPUjogYmlub3AoXCJeXCIsIDQpLFxuICBiaXR3aXNlQU5EOiBiaW5vcChcIiZcIiwgNSksXG4gIGVxdWFsaXR5OiBiaW5vcChcIj09LyE9Lz09PS8hPT1cIiwgNiksXG4gIHJlbGF0aW9uYWw6IGJpbm9wKFwiPC8+Lzw9Lz49XCIsIDcpLFxuICBiaXRTaGlmdDogYmlub3AoXCI8PC8+Pi8+Pj5cIiwgOCksXG4gIHBsdXNNaW46IG5ldyBUb2tlblR5cGUoXCIrLy1cIiwge2JlZm9yZUV4cHI6IHRydWUsIGJpbm9wOiA5LCBwcmVmaXg6IHRydWUsIHN0YXJ0c0V4cHI6IHRydWV9KSxcbiAgbW9kdWxvOiBiaW5vcChcIiVcIiwgMTApLFxuICBzdGFyOiBiaW5vcChcIipcIiwgMTApLFxuICBzbGFzaDogYmlub3AoXCIvXCIsIDEwKSxcbiAgc3RhcnN0YXI6IG5ldyBUb2tlblR5cGUoXCIqKlwiLCB7YmVmb3JlRXhwcjogdHJ1ZX0pLFxuICBjb2FsZXNjZTogYmlub3AoXCI/P1wiLCAxKSxcblxuICAvLyBLZXl3b3JkIHRva2VuIHR5cGVzLlxuICBfYnJlYWs6IGt3KFwiYnJlYWtcIiksXG4gIF9jYXNlOiBrdyhcImNhc2VcIiwgYmVmb3JlRXhwciksXG4gIF9jYXRjaDoga3coXCJjYXRjaFwiKSxcbiAgX2NvbnRpbnVlOiBrdyhcImNvbnRpbnVlXCIpLFxuICBfZGVidWdnZXI6IGt3KFwiZGVidWdnZXJcIiksXG4gIF9kZWZhdWx0OiBrdyhcImRlZmF1bHRcIiwgYmVmb3JlRXhwciksXG4gIF9kbzoga3coXCJkb1wiLCB7aXNMb29wOiB0cnVlLCBiZWZvcmVFeHByOiB0cnVlfSksXG4gIF9lbHNlOiBrdyhcImVsc2VcIiwgYmVmb3JlRXhwciksXG4gIF9maW5hbGx5OiBrdyhcImZpbmFsbHlcIiksXG4gIF9mb3I6IGt3KFwiZm9yXCIsIHtpc0xvb3A6IHRydWV9KSxcbiAgX2Z1bmN0aW9uOiBrdyhcImZ1bmN0aW9uXCIsIHN0YXJ0c0V4cHIpLFxuICBfaWY6IGt3KFwiaWZcIiksXG4gIF9yZXR1cm46IGt3KFwicmV0dXJuXCIsIGJlZm9yZUV4cHIpLFxuICBfc3dpdGNoOiBrdyhcInN3aXRjaFwiKSxcbiAgX3Rocm93OiBrdyhcInRocm93XCIsIGJlZm9yZUV4cHIpLFxuICBfdHJ5OiBrdyhcInRyeVwiKSxcbiAgX3Zhcjoga3coXCJ2YXJcIiksXG4gIF9jb25zdDoga3coXCJjb25zdFwiKSxcbiAgX3doaWxlOiBrdyhcIndoaWxlXCIsIHtpc0xvb3A6IHRydWV9KSxcbiAgX3dpdGg6IGt3KFwid2l0aFwiKSxcbiAgX25ldzoga3coXCJuZXdcIiwge2JlZm9yZUV4cHI6IHRydWUsIHN0YXJ0c0V4cHI6IHRydWV9KSxcbiAgX3RoaXM6IGt3KFwidGhpc1wiLCBzdGFydHNFeHByKSxcbiAgX3N1cGVyOiBrdyhcInN1cGVyXCIsIHN0YXJ0c0V4cHIpLFxuICBfY2xhc3M6IGt3KFwiY2xhc3NcIiwgc3RhcnRzRXhwciksXG4gIF9leHRlbmRzOiBrdyhcImV4dGVuZHNcIiwgYmVmb3JlRXhwciksXG4gIF9leHBvcnQ6IGt3KFwiZXhwb3J0XCIpLFxuICBfaW1wb3J0OiBrdyhcImltcG9ydFwiLCBzdGFydHNFeHByKSxcbiAgX251bGw6IGt3KFwibnVsbFwiLCBzdGFydHNFeHByKSxcbiAgX3RydWU6IGt3KFwidHJ1ZVwiLCBzdGFydHNFeHByKSxcbiAgX2ZhbHNlOiBrdyhcImZhbHNlXCIsIHN0YXJ0c0V4cHIpLFxuICBfaW46IGt3KFwiaW5cIiwge2JlZm9yZUV4cHI6IHRydWUsIGJpbm9wOiA3fSksXG4gIF9pbnN0YW5jZW9mOiBrdyhcImluc3RhbmNlb2ZcIiwge2JlZm9yZUV4cHI6IHRydWUsIGJpbm9wOiA3fSksXG4gIF90eXBlb2Y6IGt3KFwidHlwZW9mXCIsIHtiZWZvcmVFeHByOiB0cnVlLCBwcmVmaXg6IHRydWUsIHN0YXJ0c0V4cHI6IHRydWV9KSxcbiAgX3ZvaWQ6IGt3KFwidm9pZFwiLCB7YmVmb3JlRXhwcjogdHJ1ZSwgcHJlZml4OiB0cnVlLCBzdGFydHNFeHByOiB0cnVlfSksXG4gIF9kZWxldGU6IGt3KFwiZGVsZXRlXCIsIHtiZWZvcmVFeHByOiB0cnVlLCBwcmVmaXg6IHRydWUsIHN0YXJ0c0V4cHI6IHRydWV9KVxufTtcblxuLy8gTWF0Y2hlcyBhIHdob2xlIGxpbmUgYnJlYWsgKHdoZXJlIENSTEYgaXMgY29uc2lkZXJlZCBhIHNpbmdsZVxuLy8gbGluZSBicmVhaykuIFVzZWQgdG8gY291bnQgbGluZXMuXG5cbnZhciBsaW5lQnJlYWsgPSAvXFxyXFxuP3xcXG58XFx1MjAyOHxcXHUyMDI5LztcbnZhciBsaW5lQnJlYWtHID0gbmV3IFJlZ0V4cChsaW5lQnJlYWsuc291cmNlLCBcImdcIik7XG5cbmZ1bmN0aW9uIGlzTmV3TGluZShjb2RlKSB7XG4gIHJldHVybiBjb2RlID09PSAxMCB8fCBjb2RlID09PSAxMyB8fCBjb2RlID09PSAweDIwMjggfHwgY29kZSA9PT0gMHgyMDI5XG59XG5cbmZ1bmN0aW9uIG5leHRMaW5lQnJlYWsoY29kZSwgZnJvbSwgZW5kKSB7XG4gIGlmICggZW5kID09PSB2b2lkIDAgKSBlbmQgPSBjb2RlLmxlbmd0aDtcblxuICBmb3IgKHZhciBpID0gZnJvbTsgaSA8IGVuZDsgaSsrKSB7XG4gICAgdmFyIG5leHQgPSBjb2RlLmNoYXJDb2RlQXQoaSk7XG4gICAgaWYgKGlzTmV3TGluZShuZXh0KSlcbiAgICAgIHsgcmV0dXJuIGkgPCBlbmQgLSAxICYmIG5leHQgPT09IDEzICYmIGNvZGUuY2hhckNvZGVBdChpICsgMSkgPT09IDEwID8gaSArIDIgOiBpICsgMSB9XG4gIH1cbiAgcmV0dXJuIC0xXG59XG5cbnZhciBub25BU0NJSXdoaXRlc3BhY2UgPSAvW1xcdTE2ODBcXHUyMDAwLVxcdTIwMGFcXHUyMDJmXFx1MjA1ZlxcdTMwMDBcXHVmZWZmXS87XG5cbnZhciBza2lwV2hpdGVTcGFjZSA9IC8oPzpcXHN8XFwvXFwvLip8XFwvXFwqW15dKj9cXCpcXC8pKi9nO1xuXG52YXIgcmVmID0gT2JqZWN0LnByb3RvdHlwZTtcbnZhciBoYXNPd25Qcm9wZXJ0eSA9IHJlZi5oYXNPd25Qcm9wZXJ0eTtcbnZhciB0b1N0cmluZyA9IHJlZi50b1N0cmluZztcblxudmFyIGhhc093biA9IE9iamVjdC5oYXNPd24gfHwgKGZ1bmN0aW9uIChvYmosIHByb3BOYW1lKSB7IHJldHVybiAoXG4gIGhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wTmFtZSlcbik7IH0pO1xuXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgKGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIChcbiAgdG9TdHJpbmcuY2FsbChvYmopID09PSBcIltvYmplY3QgQXJyYXldXCJcbik7IH0pO1xuXG52YXIgcmVnZXhwQ2FjaGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG5mdW5jdGlvbiB3b3Jkc1JlZ2V4cCh3b3Jkcykge1xuICByZXR1cm4gcmVnZXhwQ2FjaGVbd29yZHNdIHx8IChyZWdleHBDYWNoZVt3b3Jkc10gPSBuZXcgUmVnRXhwKFwiXig/OlwiICsgd29yZHMucmVwbGFjZSgvIC9nLCBcInxcIikgKyBcIikkXCIpKVxufVxuXG5mdW5jdGlvbiBjb2RlUG9pbnRUb1N0cmluZyhjb2RlKSB7XG4gIC8vIFVURi0xNiBEZWNvZGluZ1xuICBpZiAoY29kZSA8PSAweEZGRkYpIHsgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSkgfVxuICBjb2RlIC09IDB4MTAwMDA7XG4gIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKChjb2RlID4+IDEwKSArIDB4RDgwMCwgKGNvZGUgJiAxMDIzKSArIDB4REMwMClcbn1cblxudmFyIGxvbmVTdXJyb2dhdGUgPSAvKD86W1xcdUQ4MDAtXFx1REJGRl0oPyFbXFx1REMwMC1cXHVERkZGXSl8KD86W15cXHVEODAwLVxcdURCRkZdfF4pW1xcdURDMDAtXFx1REZGRl0pLztcblxuLy8gVGhlc2UgYXJlIHVzZWQgd2hlbiBgb3B0aW9ucy5sb2NhdGlvbnNgIGlzIG9uLCBmb3IgdGhlXG4vLyBgc3RhcnRMb2NgIGFuZCBgZW5kTG9jYCBwcm9wZXJ0aWVzLlxuXG52YXIgUG9zaXRpb24gPSBmdW5jdGlvbiBQb3NpdGlvbihsaW5lLCBjb2wpIHtcbiAgdGhpcy5saW5lID0gbGluZTtcbiAgdGhpcy5jb2x1bW4gPSBjb2w7XG59O1xuXG5Qb3NpdGlvbi5wcm90b3R5cGUub2Zmc2V0ID0gZnVuY3Rpb24gb2Zmc2V0IChuKSB7XG4gIHJldHVybiBuZXcgUG9zaXRpb24odGhpcy5saW5lLCB0aGlzLmNvbHVtbiArIG4pXG59O1xuXG52YXIgU291cmNlTG9jYXRpb24gPSBmdW5jdGlvbiBTb3VyY2VMb2NhdGlvbihwLCBzdGFydCwgZW5kKSB7XG4gIHRoaXMuc3RhcnQgPSBzdGFydDtcbiAgdGhpcy5lbmQgPSBlbmQ7XG4gIGlmIChwLnNvdXJjZUZpbGUgIT09IG51bGwpIHsgdGhpcy5zb3VyY2UgPSBwLnNvdXJjZUZpbGU7IH1cbn07XG5cbi8vIFRoZSBgZ2V0TGluZUluZm9gIGZ1bmN0aW9uIGlzIG1vc3RseSB1c2VmdWwgd2hlbiB0aGVcbi8vIGBsb2NhdGlvbnNgIG9wdGlvbiBpcyBvZmYgKGZvciBwZXJmb3JtYW5jZSByZWFzb25zKSBhbmQgeW91XG4vLyB3YW50IHRvIGZpbmQgdGhlIGxpbmUvY29sdW1uIHBvc2l0aW9uIGZvciBhIGdpdmVuIGNoYXJhY3RlclxuLy8gb2Zmc2V0LiBgaW5wdXRgIHNob3VsZCBiZSB0aGUgY29kZSBzdHJpbmcgdGhhdCB0aGUgb2Zmc2V0IHJlZmVyc1xuLy8gaW50by5cblxuZnVuY3Rpb24gZ2V0TGluZUluZm8oaW5wdXQsIG9mZnNldCkge1xuICBmb3IgKHZhciBsaW5lID0gMSwgY3VyID0gMDs7KSB7XG4gICAgdmFyIG5leHRCcmVhayA9IG5leHRMaW5lQnJlYWsoaW5wdXQsIGN1ciwgb2Zmc2V0KTtcbiAgICBpZiAobmV4dEJyZWFrIDwgMCkgeyByZXR1cm4gbmV3IFBvc2l0aW9uKGxpbmUsIG9mZnNldCAtIGN1cikgfVxuICAgICsrbGluZTtcbiAgICBjdXIgPSBuZXh0QnJlYWs7XG4gIH1cbn1cblxuLy8gQSBzZWNvbmQgYXJndW1lbnQgbXVzdCBiZSBnaXZlbiB0byBjb25maWd1cmUgdGhlIHBhcnNlciBwcm9jZXNzLlxuLy8gVGhlc2Ugb3B0aW9ucyBhcmUgcmVjb2duaXplZCAob25seSBgZWNtYVZlcnNpb25gIGlzIHJlcXVpcmVkKTpcblxudmFyIGRlZmF1bHRPcHRpb25zID0ge1xuICAvLyBgZWNtYVZlcnNpb25gIGluZGljYXRlcyB0aGUgRUNNQVNjcmlwdCB2ZXJzaW9uIHRvIHBhcnNlLiBNdXN0IGJlXG4gIC8vIGVpdGhlciAzLCA1LCA2IChvciAyMDE1KSwgNyAoMjAxNiksIDggKDIwMTcpLCA5ICgyMDE4KSwgMTBcbiAgLy8gKDIwMTkpLCAxMSAoMjAyMCksIDEyICgyMDIxKSwgMTMgKDIwMjIpLCAxNCAoMjAyMyksIG9yIGBcImxhdGVzdFwiYFxuICAvLyAodGhlIGxhdGVzdCB2ZXJzaW9uIHRoZSBsaWJyYXJ5IHN1cHBvcnRzKS4gVGhpcyBpbmZsdWVuY2VzXG4gIC8vIHN1cHBvcnQgZm9yIHN0cmljdCBtb2RlLCB0aGUgc2V0IG9mIHJlc2VydmVkIHdvcmRzLCBhbmQgc3VwcG9ydFxuICAvLyBmb3IgbmV3IHN5bnRheCBmZWF0dXJlcy5cbiAgZWNtYVZlcnNpb246IG51bGwsXG4gIC8vIGBzb3VyY2VUeXBlYCBpbmRpY2F0ZXMgdGhlIG1vZGUgdGhlIGNvZGUgc2hvdWxkIGJlIHBhcnNlZCBpbi5cbiAgLy8gQ2FuIGJlIGVpdGhlciBgXCJzY3JpcHRcImAgb3IgYFwibW9kdWxlXCJgLiBUaGlzIGluZmx1ZW5jZXMgZ2xvYmFsXG4gIC8vIHN0cmljdCBtb2RlIGFuZCBwYXJzaW5nIG9mIGBpbXBvcnRgIGFuZCBgZXhwb3J0YCBkZWNsYXJhdGlvbnMuXG4gIHNvdXJjZVR5cGU6IFwic2NyaXB0XCIsXG4gIC8vIGBvbkluc2VydGVkU2VtaWNvbG9uYCBjYW4gYmUgYSBjYWxsYmFjayB0aGF0IHdpbGwgYmUgY2FsbGVkIHdoZW5cbiAgLy8gYSBzZW1pY29sb24gaXMgYXV0b21hdGljYWxseSBpbnNlcnRlZC4gSXQgd2lsbCBiZSBwYXNzZWQgdGhlXG4gIC8vIHBvc2l0aW9uIG9mIHRoZSBpbnNlcnRlZCBzZW1pY29sb24gYXMgYW4gb2Zmc2V0LCBhbmQgaWZcbiAgLy8gYGxvY2F0aW9uc2AgaXMgZW5hYmxlZCwgaXQgaXMgZ2l2ZW4gdGhlIGxvY2F0aW9uIGFzIGEgYHtsaW5lLFxuICAvLyBjb2x1bW59YCBvYmplY3QgYXMgc2Vjb25kIGFyZ3VtZW50LlxuICBvbkluc2VydGVkU2VtaWNvbG9uOiBudWxsLFxuICAvLyBgb25UcmFpbGluZ0NvbW1hYCBpcyBzaW1pbGFyIHRvIGBvbkluc2VydGVkU2VtaWNvbG9uYCwgYnV0IGZvclxuICAvLyB0cmFpbGluZyBjb21tYXMuXG4gIG9uVHJhaWxpbmdDb21tYTogbnVsbCxcbiAgLy8gQnkgZGVmYXVsdCwgcmVzZXJ2ZWQgd29yZHMgYXJlIG9ubHkgZW5mb3JjZWQgaWYgZWNtYVZlcnNpb24gPj0gNS5cbiAgLy8gU2V0IGBhbGxvd1Jlc2VydmVkYCB0byBhIGJvb2xlYW4gdmFsdWUgdG8gZXhwbGljaXRseSB0dXJuIHRoaXMgb25cbiAgLy8gYW4gb2ZmLiBXaGVuIHRoaXMgb3B0aW9uIGhhcyB0aGUgdmFsdWUgXCJuZXZlclwiLCByZXNlcnZlZCB3b3Jkc1xuICAvLyBhbmQga2V5d29yZHMgY2FuIGFsc28gbm90IGJlIHVzZWQgYXMgcHJvcGVydHkgbmFtZXMuXG4gIGFsbG93UmVzZXJ2ZWQ6IG51bGwsXG4gIC8vIFdoZW4gZW5hYmxlZCwgYSByZXR1cm4gYXQgdGhlIHRvcCBsZXZlbCBpcyBub3QgY29uc2lkZXJlZCBhblxuICAvLyBlcnJvci5cbiAgYWxsb3dSZXR1cm5PdXRzaWRlRnVuY3Rpb246IGZhbHNlLFxuICAvLyBXaGVuIGVuYWJsZWQsIGltcG9ydC9leHBvcnQgc3RhdGVtZW50cyBhcmUgbm90IGNvbnN0cmFpbmVkIHRvXG4gIC8vIGFwcGVhcmluZyBhdCB0aGUgdG9wIG9mIHRoZSBwcm9ncmFtLCBhbmQgYW4gaW1wb3J0Lm1ldGEgZXhwcmVzc2lvblxuICAvLyBpbiBhIHNjcmlwdCBpc24ndCBjb25zaWRlcmVkIGFuIGVycm9yLlxuICBhbGxvd0ltcG9ydEV4cG9ydEV2ZXJ5d2hlcmU6IGZhbHNlLFxuICAvLyBCeSBkZWZhdWx0LCBhd2FpdCBpZGVudGlmaWVycyBhcmUgYWxsb3dlZCB0byBhcHBlYXIgYXQgdGhlIHRvcC1sZXZlbCBzY29wZSBvbmx5IGlmIGVjbWFWZXJzaW9uID49IDIwMjIuXG4gIC8vIFdoZW4gZW5hYmxlZCwgYXdhaXQgaWRlbnRpZmllcnMgYXJlIGFsbG93ZWQgdG8gYXBwZWFyIGF0IHRoZSB0b3AtbGV2ZWwgc2NvcGUsXG4gIC8vIGJ1dCB0aGV5IGFyZSBzdGlsbCBub3QgYWxsb3dlZCBpbiBub24tYXN5bmMgZnVuY3Rpb25zLlxuICBhbGxvd0F3YWl0T3V0c2lkZUZ1bmN0aW9uOiBudWxsLFxuICAvLyBXaGVuIGVuYWJsZWQsIHN1cGVyIGlkZW50aWZpZXJzIGFyZSBub3QgY29uc3RyYWluZWQgdG9cbiAgLy8gYXBwZWFyaW5nIGluIG1ldGhvZHMgYW5kIGRvIG5vdCByYWlzZSBhbiBlcnJvciB3aGVuIHRoZXkgYXBwZWFyIGVsc2V3aGVyZS5cbiAgYWxsb3dTdXBlck91dHNpZGVNZXRob2Q6IG51bGwsXG4gIC8vIFdoZW4gZW5hYmxlZCwgaGFzaGJhbmcgZGlyZWN0aXZlIGluIHRoZSBiZWdpbm5pbmcgb2YgZmlsZSBpc1xuICAvLyBhbGxvd2VkIGFuZCB0cmVhdGVkIGFzIGEgbGluZSBjb21tZW50LiBFbmFibGVkIGJ5IGRlZmF1bHQgd2hlblxuICAvLyBgZWNtYVZlcnNpb25gID49IDIwMjMuXG4gIGFsbG93SGFzaEJhbmc6IGZhbHNlLFxuICAvLyBCeSBkZWZhdWx0LCB0aGUgcGFyc2VyIHdpbGwgdmVyaWZ5IHRoYXQgcHJpdmF0ZSBwcm9wZXJ0aWVzIGFyZVxuICAvLyBvbmx5IHVzZWQgaW4gcGxhY2VzIHdoZXJlIHRoZXkgYXJlIHZhbGlkIGFuZCBoYXZlIGJlZW4gZGVjbGFyZWQuXG4gIC8vIFNldCB0aGlzIHRvIGZhbHNlIHRvIHR1cm4gc3VjaCBjaGVja3Mgb2ZmLlxuICBjaGVja1ByaXZhdGVGaWVsZHM6IHRydWUsXG4gIC8vIFdoZW4gYGxvY2F0aW9uc2AgaXMgb24sIGBsb2NgIHByb3BlcnRpZXMgaG9sZGluZyBvYmplY3RzIHdpdGhcbiAgLy8gYHN0YXJ0YCBhbmQgYGVuZGAgcHJvcGVydGllcyBpbiBge2xpbmUsIGNvbHVtbn1gIGZvcm0gKHdpdGhcbiAgLy8gbGluZSBiZWluZyAxLWJhc2VkIGFuZCBjb2x1bW4gMC1iYXNlZCkgd2lsbCBiZSBhdHRhY2hlZCB0byB0aGVcbiAgLy8gbm9kZXMuXG4gIGxvY2F0aW9uczogZmFsc2UsXG4gIC8vIEEgZnVuY3Rpb24gY2FuIGJlIHBhc3NlZCBhcyBgb25Ub2tlbmAgb3B0aW9uLCB3aGljaCB3aWxsXG4gIC8vIGNhdXNlIEFjb3JuIHRvIGNhbGwgdGhhdCBmdW5jdGlvbiB3aXRoIG9iamVjdCBpbiB0aGUgc2FtZVxuICAvLyBmb3JtYXQgYXMgdG9rZW5zIHJldHVybmVkIGZyb20gYHRva2VuaXplcigpLmdldFRva2VuKClgLiBOb3RlXG4gIC8vIHRoYXQgeW91IGFyZSBub3QgYWxsb3dlZCB0byBjYWxsIHRoZSBwYXJzZXIgZnJvbSB0aGVcbiAgLy8gY2FsbGJhY2tcdTIwMTR0aGF0IHdpbGwgY29ycnVwdCBpdHMgaW50ZXJuYWwgc3RhdGUuXG4gIG9uVG9rZW46IG51bGwsXG4gIC8vIEEgZnVuY3Rpb24gY2FuIGJlIHBhc3NlZCBhcyBgb25Db21tZW50YCBvcHRpb24sIHdoaWNoIHdpbGxcbiAgLy8gY2F1c2UgQWNvcm4gdG8gY2FsbCB0aGF0IGZ1bmN0aW9uIHdpdGggYChibG9jaywgdGV4dCwgc3RhcnQsXG4gIC8vIGVuZClgIHBhcmFtZXRlcnMgd2hlbmV2ZXIgYSBjb21tZW50IGlzIHNraXBwZWQuIGBibG9ja2AgaXMgYVxuICAvLyBib29sZWFuIGluZGljYXRpbmcgd2hldGhlciB0aGlzIGlzIGEgYmxvY2sgKGAvKiAqL2ApIGNvbW1lbnQsXG4gIC8vIGB0ZXh0YCBpcyB0aGUgY29udGVudCBvZiB0aGUgY29tbWVudCwgYW5kIGBzdGFydGAgYW5kIGBlbmRgIGFyZVxuICAvLyBjaGFyYWN0ZXIgb2Zmc2V0cyB0aGF0IGRlbm90ZSB0aGUgc3RhcnQgYW5kIGVuZCBvZiB0aGUgY29tbWVudC5cbiAgLy8gV2hlbiB0aGUgYGxvY2F0aW9uc2Agb3B0aW9uIGlzIG9uLCB0d28gbW9yZSBwYXJhbWV0ZXJzIGFyZVxuICAvLyBwYXNzZWQsIHRoZSBmdWxsIGB7bGluZSwgY29sdW1ufWAgbG9jYXRpb25zIG9mIHRoZSBzdGFydCBhbmRcbiAgLy8gZW5kIG9mIHRoZSBjb21tZW50cy4gTm90ZSB0aGF0IHlvdSBhcmUgbm90IGFsbG93ZWQgdG8gY2FsbCB0aGVcbiAgLy8gcGFyc2VyIGZyb20gdGhlIGNhbGxiYWNrXHUyMDE0dGhhdCB3aWxsIGNvcnJ1cHQgaXRzIGludGVybmFsIHN0YXRlLlxuICAvLyBXaGVuIHRoaXMgb3B0aW9uIGhhcyBhbiBhcnJheSBhcyB2YWx1ZSwgb2JqZWN0cyByZXByZXNlbnRpbmcgdGhlXG4gIC8vIGNvbW1lbnRzIGFyZSBwdXNoZWQgdG8gaXQuXG4gIG9uQ29tbWVudDogbnVsbCxcbiAgLy8gTm9kZXMgaGF2ZSB0aGVpciBzdGFydCBhbmQgZW5kIGNoYXJhY3RlcnMgb2Zmc2V0cyByZWNvcmRlZCBpblxuICAvLyBgc3RhcnRgIGFuZCBgZW5kYCBwcm9wZXJ0aWVzIChkaXJlY3RseSBvbiB0aGUgbm9kZSwgcmF0aGVyIHRoYW5cbiAgLy8gdGhlIGBsb2NgIG9iamVjdCwgd2hpY2ggaG9sZHMgbGluZS9jb2x1bW4gZGF0YS4gVG8gYWxzbyBhZGQgYVxuICAvLyBbc2VtaS1zdGFuZGFyZGl6ZWRdW3JhbmdlXSBgcmFuZ2VgIHByb3BlcnR5IGhvbGRpbmcgYSBgW3N0YXJ0LFxuICAvLyBlbmRdYCBhcnJheSB3aXRoIHRoZSBzYW1lIG51bWJlcnMsIHNldCB0aGUgYHJhbmdlc2Agb3B0aW9uIHRvXG4gIC8vIGB0cnVlYC5cbiAgLy9cbiAgLy8gW3JhbmdlXTogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NzQ1Njc4XG4gIHJhbmdlczogZmFsc2UsXG4gIC8vIEl0IGlzIHBvc3NpYmxlIHRvIHBhcnNlIG11bHRpcGxlIGZpbGVzIGludG8gYSBzaW5nbGUgQVNUIGJ5XG4gIC8vIHBhc3NpbmcgdGhlIHRyZWUgcHJvZHVjZWQgYnkgcGFyc2luZyB0aGUgZmlyc3QgZmlsZSBhc1xuICAvLyBgcHJvZ3JhbWAgb3B0aW9uIGluIHN1YnNlcXVlbnQgcGFyc2VzLiBUaGlzIHdpbGwgYWRkIHRoZVxuICAvLyB0b3BsZXZlbCBmb3JtcyBvZiB0aGUgcGFyc2VkIGZpbGUgdG8gdGhlIGBQcm9ncmFtYCAodG9wKSBub2RlXG4gIC8vIG9mIGFuIGV4aXN0aW5nIHBhcnNlIHRyZWUuXG4gIHByb2dyYW06IG51bGwsXG4gIC8vIFdoZW4gYGxvY2F0aW9uc2AgaXMgb24sIHlvdSBjYW4gcGFzcyB0aGlzIHRvIHJlY29yZCB0aGUgc291cmNlXG4gIC8vIGZpbGUgaW4gZXZlcnkgbm9kZSdzIGBsb2NgIG9iamVjdC5cbiAgc291cmNlRmlsZTogbnVsbCxcbiAgLy8gVGhpcyB2YWx1ZSwgaWYgZ2l2ZW4sIGlzIHN0b3JlZCBpbiBldmVyeSBub2RlLCB3aGV0aGVyXG4gIC8vIGBsb2NhdGlvbnNgIGlzIG9uIG9yIG9mZi5cbiAgZGlyZWN0U291cmNlRmlsZTogbnVsbCxcbiAgLy8gV2hlbiBlbmFibGVkLCBwYXJlbnRoZXNpemVkIGV4cHJlc3Npb25zIGFyZSByZXByZXNlbnRlZCBieVxuICAvLyAobm9uLXN0YW5kYXJkKSBQYXJlbnRoZXNpemVkRXhwcmVzc2lvbiBub2Rlc1xuICBwcmVzZXJ2ZVBhcmVuczogZmFsc2Vcbn07XG5cbi8vIEludGVycHJldCBhbmQgZGVmYXVsdCBhbiBvcHRpb25zIG9iamVjdFxuXG52YXIgd2FybmVkQWJvdXRFY21hVmVyc2lvbiA9IGZhbHNlO1xuXG5mdW5jdGlvbiBnZXRPcHRpb25zKG9wdHMpIHtcbiAgdmFyIG9wdGlvbnMgPSB7fTtcblxuICBmb3IgKHZhciBvcHQgaW4gZGVmYXVsdE9wdGlvbnMpXG4gICAgeyBvcHRpb25zW29wdF0gPSBvcHRzICYmIGhhc093bihvcHRzLCBvcHQpID8gb3B0c1tvcHRdIDogZGVmYXVsdE9wdGlvbnNbb3B0XTsgfVxuXG4gIGlmIChvcHRpb25zLmVjbWFWZXJzaW9uID09PSBcImxhdGVzdFwiKSB7XG4gICAgb3B0aW9ucy5lY21hVmVyc2lvbiA9IDFlODtcbiAgfSBlbHNlIGlmIChvcHRpb25zLmVjbWFWZXJzaW9uID09IG51bGwpIHtcbiAgICBpZiAoIXdhcm5lZEFib3V0RWNtYVZlcnNpb24gJiYgdHlwZW9mIGNvbnNvbGUgPT09IFwib2JqZWN0XCIgJiYgY29uc29sZS53YXJuKSB7XG4gICAgICB3YXJuZWRBYm91dEVjbWFWZXJzaW9uID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUud2FybihcIlNpbmNlIEFjb3JuIDguMC4wLCBvcHRpb25zLmVjbWFWZXJzaW9uIGlzIHJlcXVpcmVkLlxcbkRlZmF1bHRpbmcgdG8gMjAyMCwgYnV0IHRoaXMgd2lsbCBzdG9wIHdvcmtpbmcgaW4gdGhlIGZ1dHVyZS5cIik7XG4gICAgfVxuICAgIG9wdGlvbnMuZWNtYVZlcnNpb24gPSAxMTtcbiAgfSBlbHNlIGlmIChvcHRpb25zLmVjbWFWZXJzaW9uID49IDIwMTUpIHtcbiAgICBvcHRpb25zLmVjbWFWZXJzaW9uIC09IDIwMDk7XG4gIH1cblxuICBpZiAob3B0aW9ucy5hbGxvd1Jlc2VydmVkID09IG51bGwpXG4gICAgeyBvcHRpb25zLmFsbG93UmVzZXJ2ZWQgPSBvcHRpb25zLmVjbWFWZXJzaW9uIDwgNTsgfVxuXG4gIGlmICghb3B0cyB8fCBvcHRzLmFsbG93SGFzaEJhbmcgPT0gbnVsbClcbiAgICB7IG9wdGlvbnMuYWxsb3dIYXNoQmFuZyA9IG9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTQ7IH1cblxuICBpZiAoaXNBcnJheShvcHRpb25zLm9uVG9rZW4pKSB7XG4gICAgdmFyIHRva2VucyA9IG9wdGlvbnMub25Ub2tlbjtcbiAgICBvcHRpb25zLm9uVG9rZW4gPSBmdW5jdGlvbiAodG9rZW4pIHsgcmV0dXJuIHRva2Vucy5wdXNoKHRva2VuKTsgfTtcbiAgfVxuICBpZiAoaXNBcnJheShvcHRpb25zLm9uQ29tbWVudCkpXG4gICAgeyBvcHRpb25zLm9uQ29tbWVudCA9IHB1c2hDb21tZW50KG9wdGlvbnMsIG9wdGlvbnMub25Db21tZW50KTsgfVxuXG4gIHJldHVybiBvcHRpb25zXG59XG5cbmZ1bmN0aW9uIHB1c2hDb21tZW50KG9wdGlvbnMsIGFycmF5KSB7XG4gIHJldHVybiBmdW5jdGlvbihibG9jaywgdGV4dCwgc3RhcnQsIGVuZCwgc3RhcnRMb2MsIGVuZExvYykge1xuICAgIHZhciBjb21tZW50ID0ge1xuICAgICAgdHlwZTogYmxvY2sgPyBcIkJsb2NrXCIgOiBcIkxpbmVcIixcbiAgICAgIHZhbHVlOiB0ZXh0LFxuICAgICAgc3RhcnQ6IHN0YXJ0LFxuICAgICAgZW5kOiBlbmRcbiAgICB9O1xuICAgIGlmIChvcHRpb25zLmxvY2F0aW9ucylcbiAgICAgIHsgY29tbWVudC5sb2MgPSBuZXcgU291cmNlTG9jYXRpb24odGhpcywgc3RhcnRMb2MsIGVuZExvYyk7IH1cbiAgICBpZiAob3B0aW9ucy5yYW5nZXMpXG4gICAgICB7IGNvbW1lbnQucmFuZ2UgPSBbc3RhcnQsIGVuZF07IH1cbiAgICBhcnJheS5wdXNoKGNvbW1lbnQpO1xuICB9XG59XG5cbi8vIEVhY2ggc2NvcGUgZ2V0cyBhIGJpdHNldCB0aGF0IG1heSBjb250YWluIHRoZXNlIGZsYWdzXG52YXJcbiAgICBTQ09QRV9UT1AgPSAxLFxuICAgIFNDT1BFX0ZVTkNUSU9OID0gMixcbiAgICBTQ09QRV9BU1lOQyA9IDQsXG4gICAgU0NPUEVfR0VORVJBVE9SID0gOCxcbiAgICBTQ09QRV9BUlJPVyA9IDE2LFxuICAgIFNDT1BFX1NJTVBMRV9DQVRDSCA9IDMyLFxuICAgIFNDT1BFX1NVUEVSID0gNjQsXG4gICAgU0NPUEVfRElSRUNUX1NVUEVSID0gMTI4LFxuICAgIFNDT1BFX0NMQVNTX1NUQVRJQ19CTE9DSyA9IDI1NixcbiAgICBTQ09QRV9DTEFTU19GSUVMRF9JTklUID0gNTEyLFxuICAgIFNDT1BFX1ZBUiA9IFNDT1BFX1RPUCB8IFNDT1BFX0ZVTkNUSU9OIHwgU0NPUEVfQ0xBU1NfU1RBVElDX0JMT0NLO1xuXG5mdW5jdGlvbiBmdW5jdGlvbkZsYWdzKGFzeW5jLCBnZW5lcmF0b3IpIHtcbiAgcmV0dXJuIFNDT1BFX0ZVTkNUSU9OIHwgKGFzeW5jID8gU0NPUEVfQVNZTkMgOiAwKSB8IChnZW5lcmF0b3IgPyBTQ09QRV9HRU5FUkFUT1IgOiAwKVxufVxuXG4vLyBVc2VkIGluIGNoZWNrTFZhbCogYW5kIGRlY2xhcmVOYW1lIHRvIGRldGVybWluZSB0aGUgdHlwZSBvZiBhIGJpbmRpbmdcbnZhclxuICAgIEJJTkRfTk9ORSA9IDAsIC8vIE5vdCBhIGJpbmRpbmdcbiAgICBCSU5EX1ZBUiA9IDEsIC8vIFZhci1zdHlsZSBiaW5kaW5nXG4gICAgQklORF9MRVhJQ0FMID0gMiwgLy8gTGV0LSBvciBjb25zdC1zdHlsZSBiaW5kaW5nXG4gICAgQklORF9GVU5DVElPTiA9IDMsIC8vIEZ1bmN0aW9uIGRlY2xhcmF0aW9uXG4gICAgQklORF9TSU1QTEVfQ0FUQ0ggPSA0LCAvLyBTaW1wbGUgKGlkZW50aWZpZXIgcGF0dGVybikgY2F0Y2ggYmluZGluZ1xuICAgIEJJTkRfT1VUU0lERSA9IDU7IC8vIFNwZWNpYWwgY2FzZSBmb3IgZnVuY3Rpb24gbmFtZXMgYXMgYm91bmQgaW5zaWRlIHRoZSBmdW5jdGlvblxuXG52YXIgUGFyc2VyID0gZnVuY3Rpb24gUGFyc2VyKG9wdGlvbnMsIGlucHV0LCBzdGFydFBvcykge1xuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zID0gZ2V0T3B0aW9ucyhvcHRpb25zKTtcbiAgdGhpcy5zb3VyY2VGaWxlID0gb3B0aW9ucy5zb3VyY2VGaWxlO1xuICB0aGlzLmtleXdvcmRzID0gd29yZHNSZWdleHAoa2V5d29yZHMkMVtvcHRpb25zLmVjbWFWZXJzaW9uID49IDYgPyA2IDogb3B0aW9ucy5zb3VyY2VUeXBlID09PSBcIm1vZHVsZVwiID8gXCI1bW9kdWxlXCIgOiA1XSk7XG4gIHZhciByZXNlcnZlZCA9IFwiXCI7XG4gIGlmIChvcHRpb25zLmFsbG93UmVzZXJ2ZWQgIT09IHRydWUpIHtcbiAgICByZXNlcnZlZCA9IHJlc2VydmVkV29yZHNbb3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2ID8gNiA6IG9wdGlvbnMuZWNtYVZlcnNpb24gPT09IDUgPyA1IDogM107XG4gICAgaWYgKG9wdGlvbnMuc291cmNlVHlwZSA9PT0gXCJtb2R1bGVcIikgeyByZXNlcnZlZCArPSBcIiBhd2FpdFwiOyB9XG4gIH1cbiAgdGhpcy5yZXNlcnZlZFdvcmRzID0gd29yZHNSZWdleHAocmVzZXJ2ZWQpO1xuICB2YXIgcmVzZXJ2ZWRTdHJpY3QgPSAocmVzZXJ2ZWQgPyByZXNlcnZlZCArIFwiIFwiIDogXCJcIikgKyByZXNlcnZlZFdvcmRzLnN0cmljdDtcbiAgdGhpcy5yZXNlcnZlZFdvcmRzU3RyaWN0ID0gd29yZHNSZWdleHAocmVzZXJ2ZWRTdHJpY3QpO1xuICB0aGlzLnJlc2VydmVkV29yZHNTdHJpY3RCaW5kID0gd29yZHNSZWdleHAocmVzZXJ2ZWRTdHJpY3QgKyBcIiBcIiArIHJlc2VydmVkV29yZHMuc3RyaWN0QmluZCk7XG4gIHRoaXMuaW5wdXQgPSBTdHJpbmcoaW5wdXQpO1xuXG4gIC8vIFVzZWQgdG8gc2lnbmFsIHRvIGNhbGxlcnMgb2YgYHJlYWRXb3JkMWAgd2hldGhlciB0aGUgd29yZFxuICAvLyBjb250YWluZWQgYW55IGVzY2FwZSBzZXF1ZW5jZXMuIFRoaXMgaXMgbmVlZGVkIGJlY2F1c2Ugd29yZHMgd2l0aFxuICAvLyBlc2NhcGUgc2VxdWVuY2VzIG11c3Qgbm90IGJlIGludGVycHJldGVkIGFzIGtleXdvcmRzLlxuICB0aGlzLmNvbnRhaW5zRXNjID0gZmFsc2U7XG5cbiAgLy8gU2V0IHVwIHRva2VuIHN0YXRlXG5cbiAgLy8gVGhlIGN1cnJlbnQgcG9zaXRpb24gb2YgdGhlIHRva2VuaXplciBpbiB0aGUgaW5wdXQuXG4gIGlmIChzdGFydFBvcykge1xuICAgIHRoaXMucG9zID0gc3RhcnRQb3M7XG4gICAgdGhpcy5saW5lU3RhcnQgPSB0aGlzLmlucHV0Lmxhc3RJbmRleE9mKFwiXFxuXCIsIHN0YXJ0UG9zIC0gMSkgKyAxO1xuICAgIHRoaXMuY3VyTGluZSA9IHRoaXMuaW5wdXQuc2xpY2UoMCwgdGhpcy5saW5lU3RhcnQpLnNwbGl0KGxpbmVCcmVhaykubGVuZ3RoO1xuICB9IGVsc2Uge1xuICAgIHRoaXMucG9zID0gdGhpcy5saW5lU3RhcnQgPSAwO1xuICAgIHRoaXMuY3VyTGluZSA9IDE7XG4gIH1cblxuICAvLyBQcm9wZXJ0aWVzIG9mIHRoZSBjdXJyZW50IHRva2VuOlxuICAvLyBJdHMgdHlwZVxuICB0aGlzLnR5cGUgPSB0eXBlcyQxLmVvZjtcbiAgLy8gRm9yIHRva2VucyB0aGF0IGluY2x1ZGUgbW9yZSBpbmZvcm1hdGlvbiB0aGFuIHRoZWlyIHR5cGUsIHRoZSB2YWx1ZVxuICB0aGlzLnZhbHVlID0gbnVsbDtcbiAgLy8gSXRzIHN0YXJ0IGFuZCBlbmQgb2Zmc2V0XG4gIHRoaXMuc3RhcnQgPSB0aGlzLmVuZCA9IHRoaXMucG9zO1xuICAvLyBBbmQsIGlmIGxvY2F0aW9ucyBhcmUgdXNlZCwgdGhlIHtsaW5lLCBjb2x1bW59IG9iamVjdFxuICAvLyBjb3JyZXNwb25kaW5nIHRvIHRob3NlIG9mZnNldHNcbiAgdGhpcy5zdGFydExvYyA9IHRoaXMuZW5kTG9jID0gdGhpcy5jdXJQb3NpdGlvbigpO1xuXG4gIC8vIFBvc2l0aW9uIGluZm9ybWF0aW9uIGZvciB0aGUgcHJldmlvdXMgdG9rZW5cbiAgdGhpcy5sYXN0VG9rRW5kTG9jID0gdGhpcy5sYXN0VG9rU3RhcnRMb2MgPSBudWxsO1xuICB0aGlzLmxhc3RUb2tTdGFydCA9IHRoaXMubGFzdFRva0VuZCA9IHRoaXMucG9zO1xuXG4gIC8vIFRoZSBjb250ZXh0IHN0YWNrIGlzIHVzZWQgdG8gc3VwZXJmaWNpYWxseSB0cmFjayBzeW50YWN0aWNcbiAgLy8gY29udGV4dCB0byBwcmVkaWN0IHdoZXRoZXIgYSByZWd1bGFyIGV4cHJlc3Npb24gaXMgYWxsb3dlZCBpbiBhXG4gIC8vIGdpdmVuIHBvc2l0aW9uLlxuICB0aGlzLmNvbnRleHQgPSB0aGlzLmluaXRpYWxDb250ZXh0KCk7XG4gIHRoaXMuZXhwckFsbG93ZWQgPSB0cnVlO1xuXG4gIC8vIEZpZ3VyZSBvdXQgaWYgaXQncyBhIG1vZHVsZSBjb2RlLlxuICB0aGlzLmluTW9kdWxlID0gb3B0aW9ucy5zb3VyY2VUeXBlID09PSBcIm1vZHVsZVwiO1xuICB0aGlzLnN0cmljdCA9IHRoaXMuaW5Nb2R1bGUgfHwgdGhpcy5zdHJpY3REaXJlY3RpdmUodGhpcy5wb3MpO1xuXG4gIC8vIFVzZWQgdG8gc2lnbmlmeSB0aGUgc3RhcnQgb2YgYSBwb3RlbnRpYWwgYXJyb3cgZnVuY3Rpb25cbiAgdGhpcy5wb3RlbnRpYWxBcnJvd0F0ID0gLTE7XG4gIHRoaXMucG90ZW50aWFsQXJyb3dJbkZvckF3YWl0ID0gZmFsc2U7XG5cbiAgLy8gUG9zaXRpb25zIHRvIGRlbGF5ZWQtY2hlY2sgdGhhdCB5aWVsZC9hd2FpdCBkb2VzIG5vdCBleGlzdCBpbiBkZWZhdWx0IHBhcmFtZXRlcnMuXG4gIHRoaXMueWllbGRQb3MgPSB0aGlzLmF3YWl0UG9zID0gdGhpcy5hd2FpdElkZW50UG9zID0gMDtcbiAgLy8gTGFiZWxzIGluIHNjb3BlLlxuICB0aGlzLmxhYmVscyA9IFtdO1xuICAvLyBUaHVzLWZhciB1bmRlZmluZWQgZXhwb3J0cy5cbiAgdGhpcy51bmRlZmluZWRFeHBvcnRzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAvLyBJZiBlbmFibGVkLCBza2lwIGxlYWRpbmcgaGFzaGJhbmcgbGluZS5cbiAgaWYgKHRoaXMucG9zID09PSAwICYmIG9wdGlvbnMuYWxsb3dIYXNoQmFuZyAmJiB0aGlzLmlucHV0LnNsaWNlKDAsIDIpID09PSBcIiMhXCIpXG4gICAgeyB0aGlzLnNraXBMaW5lQ29tbWVudCgyKTsgfVxuXG4gIC8vIFNjb3BlIHRyYWNraW5nIGZvciBkdXBsaWNhdGUgdmFyaWFibGUgbmFtZXMgKHNlZSBzY29wZS5qcylcbiAgdGhpcy5zY29wZVN0YWNrID0gW107XG4gIHRoaXMuZW50ZXJTY29wZShTQ09QRV9UT1ApO1xuXG4gIC8vIEZvciBSZWdFeHAgdmFsaWRhdGlvblxuICB0aGlzLnJlZ2V4cFN0YXRlID0gbnVsbDtcblxuICAvLyBUaGUgc3RhY2sgb2YgcHJpdmF0ZSBuYW1lcy5cbiAgLy8gRWFjaCBlbGVtZW50IGhhcyB0d28gcHJvcGVydGllczogJ2RlY2xhcmVkJyBhbmQgJ3VzZWQnLlxuICAvLyBXaGVuIGl0IGV4aXRlZCBmcm9tIHRoZSBvdXRlcm1vc3QgY2xhc3MgZGVmaW5pdGlvbiwgYWxsIHVzZWQgcHJpdmF0ZSBuYW1lcyBtdXN0IGJlIGRlY2xhcmVkLlxuICB0aGlzLnByaXZhdGVOYW1lU3RhY2sgPSBbXTtcbn07XG5cbnZhciBwcm90b3R5cGVBY2Nlc3NvcnMgPSB7IGluRnVuY3Rpb246IHsgY29uZmlndXJhYmxlOiB0cnVlIH0saW5HZW5lcmF0b3I6IHsgY29uZmlndXJhYmxlOiB0cnVlIH0saW5Bc3luYzogeyBjb25maWd1cmFibGU6IHRydWUgfSxjYW5Bd2FpdDogeyBjb25maWd1cmFibGU6IHRydWUgfSxhbGxvd1N1cGVyOiB7IGNvbmZpZ3VyYWJsZTogdHJ1ZSB9LGFsbG93RGlyZWN0U3VwZXI6IHsgY29uZmlndXJhYmxlOiB0cnVlIH0sdHJlYXRGdW5jdGlvbnNBc1ZhcjogeyBjb25maWd1cmFibGU6IHRydWUgfSxhbGxvd05ld0RvdFRhcmdldDogeyBjb25maWd1cmFibGU6IHRydWUgfSxpbkNsYXNzU3RhdGljQmxvY2s6IHsgY29uZmlndXJhYmxlOiB0cnVlIH0gfTtcblxuUGFyc2VyLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uIHBhcnNlICgpIHtcbiAgdmFyIG5vZGUgPSB0aGlzLm9wdGlvbnMucHJvZ3JhbSB8fCB0aGlzLnN0YXJ0Tm9kZSgpO1xuICB0aGlzLm5leHRUb2tlbigpO1xuICByZXR1cm4gdGhpcy5wYXJzZVRvcExldmVsKG5vZGUpXG59O1xuXG5wcm90b3R5cGVBY2Nlc3NvcnMuaW5GdW5jdGlvbi5nZXQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAodGhpcy5jdXJyZW50VmFyU2NvcGUoKS5mbGFncyAmIFNDT1BFX0ZVTkNUSU9OKSA+IDAgfTtcblxucHJvdG90eXBlQWNjZXNzb3JzLmluR2VuZXJhdG9yLmdldCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICh0aGlzLmN1cnJlbnRWYXJTY29wZSgpLmZsYWdzICYgU0NPUEVfR0VORVJBVE9SKSA+IDAgfTtcblxucHJvdG90eXBlQWNjZXNzb3JzLmluQXN5bmMuZ2V0ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gKHRoaXMuY3VycmVudFZhclNjb3BlKCkuZmxhZ3MgJiBTQ09QRV9BU1lOQykgPiAwIH07XG5cbnByb3RvdHlwZUFjY2Vzc29ycy5jYW5Bd2FpdC5nZXQgPSBmdW5jdGlvbiAoKSB7XG4gIGZvciAodmFyIGkgPSB0aGlzLnNjb3BlU3RhY2subGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgcmVmID0gdGhpcy5zY29wZVN0YWNrW2ldO1xuICAgICAgdmFyIGZsYWdzID0gcmVmLmZsYWdzO1xuICAgIGlmIChmbGFncyAmIChTQ09QRV9DTEFTU19TVEFUSUNfQkxPQ0sgfCBTQ09QRV9DTEFTU19GSUVMRF9JTklUKSkgeyByZXR1cm4gZmFsc2UgfVxuICAgIGlmIChmbGFncyAmIFNDT1BFX0ZVTkNUSU9OKSB7IHJldHVybiAoZmxhZ3MgJiBTQ09QRV9BU1lOQykgPiAwIH1cbiAgfVxuICByZXR1cm4gKHRoaXMuaW5Nb2R1bGUgJiYgdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDEzKSB8fCB0aGlzLm9wdGlvbnMuYWxsb3dBd2FpdE91dHNpZGVGdW5jdGlvblxufTtcblxucHJvdG90eXBlQWNjZXNzb3JzLmFsbG93U3VwZXIuZ2V0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgcmVmID0gdGhpcy5jdXJyZW50VGhpc1Njb3BlKCk7XG4gICAgdmFyIGZsYWdzID0gcmVmLmZsYWdzO1xuICByZXR1cm4gKGZsYWdzICYgU0NPUEVfU1VQRVIpID4gMCB8fCB0aGlzLm9wdGlvbnMuYWxsb3dTdXBlck91dHNpZGVNZXRob2Rcbn07XG5cbnByb3RvdHlwZUFjY2Vzc29ycy5hbGxvd0RpcmVjdFN1cGVyLmdldCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICh0aGlzLmN1cnJlbnRUaGlzU2NvcGUoKS5mbGFncyAmIFNDT1BFX0RJUkVDVF9TVVBFUikgPiAwIH07XG5cbnByb3RvdHlwZUFjY2Vzc29ycy50cmVhdEZ1bmN0aW9uc0FzVmFyLmdldCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMudHJlYXRGdW5jdGlvbnNBc1ZhckluU2NvcGUodGhpcy5jdXJyZW50U2NvcGUoKSkgfTtcblxucHJvdG90eXBlQWNjZXNzb3JzLmFsbG93TmV3RG90VGFyZ2V0LmdldCA9IGZ1bmN0aW9uICgpIHtcbiAgZm9yICh2YXIgaSA9IHRoaXMuc2NvcGVTdGFjay5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIHZhciByZWYgPSB0aGlzLnNjb3BlU3RhY2tbaV07XG4gICAgICB2YXIgZmxhZ3MgPSByZWYuZmxhZ3M7XG4gICAgaWYgKGZsYWdzICYgKFNDT1BFX0NMQVNTX1NUQVRJQ19CTE9DSyB8IFNDT1BFX0NMQVNTX0ZJRUxEX0lOSVQpIHx8XG4gICAgICAgICgoZmxhZ3MgJiBTQ09QRV9GVU5DVElPTikgJiYgIShmbGFncyAmIFNDT1BFX0FSUk9XKSkpIHsgcmV0dXJuIHRydWUgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufTtcblxucHJvdG90eXBlQWNjZXNzb3JzLmluQ2xhc3NTdGF0aWNCbG9jay5nZXQgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiAodGhpcy5jdXJyZW50VmFyU2NvcGUoKS5mbGFncyAmIFNDT1BFX0NMQVNTX1NUQVRJQ19CTE9DSykgPiAwXG59O1xuXG5QYXJzZXIuZXh0ZW5kID0gZnVuY3Rpb24gZXh0ZW5kICgpIHtcbiAgICB2YXIgcGx1Z2lucyA9IFtdLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIHdoaWxlICggbGVuLS0gKSBwbHVnaW5zWyBsZW4gXSA9IGFyZ3VtZW50c1sgbGVuIF07XG5cbiAgdmFyIGNscyA9IHRoaXM7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcGx1Z2lucy5sZW5ndGg7IGkrKykgeyBjbHMgPSBwbHVnaW5zW2ldKGNscyk7IH1cbiAgcmV0dXJuIGNsc1xufTtcblxuUGFyc2VyLnBhcnNlID0gZnVuY3Rpb24gcGFyc2UgKGlucHV0LCBvcHRpb25zKSB7XG4gIHJldHVybiBuZXcgdGhpcyhvcHRpb25zLCBpbnB1dCkucGFyc2UoKVxufTtcblxuUGFyc2VyLnBhcnNlRXhwcmVzc2lvbkF0ID0gZnVuY3Rpb24gcGFyc2VFeHByZXNzaW9uQXQgKGlucHV0LCBwb3MsIG9wdGlvbnMpIHtcbiAgdmFyIHBhcnNlciA9IG5ldyB0aGlzKG9wdGlvbnMsIGlucHV0LCBwb3MpO1xuICBwYXJzZXIubmV4dFRva2VuKCk7XG4gIHJldHVybiBwYXJzZXIucGFyc2VFeHByZXNzaW9uKClcbn07XG5cblBhcnNlci50b2tlbml6ZXIgPSBmdW5jdGlvbiB0b2tlbml6ZXIgKGlucHV0LCBvcHRpb25zKSB7XG4gIHJldHVybiBuZXcgdGhpcyhvcHRpb25zLCBpbnB1dClcbn07XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKCBQYXJzZXIucHJvdG90eXBlLCBwcm90b3R5cGVBY2Nlc3NvcnMgKTtcblxudmFyIHBwJDkgPSBQYXJzZXIucHJvdG90eXBlO1xuXG4vLyAjIyBQYXJzZXIgdXRpbGl0aWVzXG5cbnZhciBsaXRlcmFsID0gL14oPzonKCg/OlxcXFxbXl18W14nXFxcXF0pKj8pJ3xcIigoPzpcXFxcW15dfFteXCJcXFxcXSkqPylcIikvO1xucHAkOS5zdHJpY3REaXJlY3RpdmUgPSBmdW5jdGlvbihzdGFydCkge1xuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uIDwgNSkgeyByZXR1cm4gZmFsc2UgfVxuICBmb3IgKDs7KSB7XG4gICAgLy8gVHJ5IHRvIGZpbmQgc3RyaW5nIGxpdGVyYWwuXG4gICAgc2tpcFdoaXRlU3BhY2UubGFzdEluZGV4ID0gc3RhcnQ7XG4gICAgc3RhcnQgKz0gc2tpcFdoaXRlU3BhY2UuZXhlYyh0aGlzLmlucHV0KVswXS5sZW5ndGg7XG4gICAgdmFyIG1hdGNoID0gbGl0ZXJhbC5leGVjKHRoaXMuaW5wdXQuc2xpY2Uoc3RhcnQpKTtcbiAgICBpZiAoIW1hdGNoKSB7IHJldHVybiBmYWxzZSB9XG4gICAgaWYgKChtYXRjaFsxXSB8fCBtYXRjaFsyXSkgPT09IFwidXNlIHN0cmljdFwiKSB7XG4gICAgICBza2lwV2hpdGVTcGFjZS5sYXN0SW5kZXggPSBzdGFydCArIG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgIHZhciBzcGFjZUFmdGVyID0gc2tpcFdoaXRlU3BhY2UuZXhlYyh0aGlzLmlucHV0KSwgZW5kID0gc3BhY2VBZnRlci5pbmRleCArIHNwYWNlQWZ0ZXJbMF0ubGVuZ3RoO1xuICAgICAgdmFyIG5leHQgPSB0aGlzLmlucHV0LmNoYXJBdChlbmQpO1xuICAgICAgcmV0dXJuIG5leHQgPT09IFwiO1wiIHx8IG5leHQgPT09IFwifVwiIHx8XG4gICAgICAgIChsaW5lQnJlYWsudGVzdChzcGFjZUFmdGVyWzBdKSAmJlxuICAgICAgICAgISgvWyhgLlsrXFwtLyolPD49LD9eJl0vLnRlc3QobmV4dCkgfHwgbmV4dCA9PT0gXCIhXCIgJiYgdGhpcy5pbnB1dC5jaGFyQXQoZW5kICsgMSkgPT09IFwiPVwiKSlcbiAgICB9XG4gICAgc3RhcnQgKz0gbWF0Y2hbMF0ubGVuZ3RoO1xuXG4gICAgLy8gU2tpcCBzZW1pY29sb24sIGlmIGFueS5cbiAgICBza2lwV2hpdGVTcGFjZS5sYXN0SW5kZXggPSBzdGFydDtcbiAgICBzdGFydCArPSBza2lwV2hpdGVTcGFjZS5leGVjKHRoaXMuaW5wdXQpWzBdLmxlbmd0aDtcbiAgICBpZiAodGhpcy5pbnB1dFtzdGFydF0gPT09IFwiO1wiKVxuICAgICAgeyBzdGFydCsrOyB9XG4gIH1cbn07XG5cbi8vIFByZWRpY2F0ZSB0aGF0IHRlc3RzIHdoZXRoZXIgdGhlIG5leHQgdG9rZW4gaXMgb2YgdGhlIGdpdmVuXG4vLyB0eXBlLCBhbmQgaWYgeWVzLCBjb25zdW1lcyBpdCBhcyBhIHNpZGUgZWZmZWN0LlxuXG5wcCQ5LmVhdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZSkge1xuICAgIHRoaXMubmV4dCgpO1xuICAgIHJldHVybiB0cnVlXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn07XG5cbi8vIFRlc3RzIHdoZXRoZXIgcGFyc2VkIHRva2VuIGlzIGEgY29udGV4dHVhbCBrZXl3b3JkLlxuXG5wcCQ5LmlzQ29udGV4dHVhbCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgcmV0dXJuIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5uYW1lICYmIHRoaXMudmFsdWUgPT09IG5hbWUgJiYgIXRoaXMuY29udGFpbnNFc2Ncbn07XG5cbi8vIENvbnN1bWVzIGNvbnRleHR1YWwga2V5d29yZCBpZiBwb3NzaWJsZS5cblxucHAkOS5lYXRDb250ZXh0dWFsID0gZnVuY3Rpb24obmFtZSkge1xuICBpZiAoIXRoaXMuaXNDb250ZXh0dWFsKG5hbWUpKSB7IHJldHVybiBmYWxzZSB9XG4gIHRoaXMubmV4dCgpO1xuICByZXR1cm4gdHJ1ZVxufTtcblxuLy8gQXNzZXJ0cyB0aGF0IGZvbGxvd2luZyB0b2tlbiBpcyBnaXZlbiBjb250ZXh0dWFsIGtleXdvcmQuXG5cbnBwJDkuZXhwZWN0Q29udGV4dHVhbCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgaWYgKCF0aGlzLmVhdENvbnRleHR1YWwobmFtZSkpIHsgdGhpcy51bmV4cGVjdGVkKCk7IH1cbn07XG5cbi8vIFRlc3Qgd2hldGhlciBhIHNlbWljb2xvbiBjYW4gYmUgaW5zZXJ0ZWQgYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24uXG5cbnBwJDkuY2FuSW5zZXJ0U2VtaWNvbG9uID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnR5cGUgPT09IHR5cGVzJDEuZW9mIHx8XG4gICAgdGhpcy50eXBlID09PSB0eXBlcyQxLmJyYWNlUiB8fFxuICAgIGxpbmVCcmVhay50ZXN0KHRoaXMuaW5wdXQuc2xpY2UodGhpcy5sYXN0VG9rRW5kLCB0aGlzLnN0YXJ0KSlcbn07XG5cbnBwJDkuaW5zZXJ0U2VtaWNvbG9uID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmNhbkluc2VydFNlbWljb2xvbigpKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5vbkluc2VydGVkU2VtaWNvbG9uKVxuICAgICAgeyB0aGlzLm9wdGlvbnMub25JbnNlcnRlZFNlbWljb2xvbih0aGlzLmxhc3RUb2tFbmQsIHRoaXMubGFzdFRva0VuZExvYyk7IH1cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG59O1xuXG4vLyBDb25zdW1lIGEgc2VtaWNvbG9uLCBvciwgZmFpbGluZyB0aGF0LCBzZWUgaWYgd2UgYXJlIGFsbG93ZWQgdG9cbi8vIHByZXRlbmQgdGhhdCB0aGVyZSBpcyBhIHNlbWljb2xvbiBhdCB0aGlzIHBvc2l0aW9uLlxuXG5wcCQ5LnNlbWljb2xvbiA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIXRoaXMuZWF0KHR5cGVzJDEuc2VtaSkgJiYgIXRoaXMuaW5zZXJ0U2VtaWNvbG9uKCkpIHsgdGhpcy51bmV4cGVjdGVkKCk7IH1cbn07XG5cbnBwJDkuYWZ0ZXJUcmFpbGluZ0NvbW1hID0gZnVuY3Rpb24odG9rVHlwZSwgbm90TmV4dCkge1xuICBpZiAodGhpcy50eXBlID09PSB0b2tUeXBlKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5vblRyYWlsaW5nQ29tbWEpXG4gICAgICB7IHRoaXMub3B0aW9ucy5vblRyYWlsaW5nQ29tbWEodGhpcy5sYXN0VG9rU3RhcnQsIHRoaXMubGFzdFRva1N0YXJ0TG9jKTsgfVxuICAgIGlmICghbm90TmV4dClcbiAgICAgIHsgdGhpcy5uZXh0KCk7IH1cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG59O1xuXG4vLyBFeHBlY3QgYSB0b2tlbiBvZiBhIGdpdmVuIHR5cGUuIElmIGZvdW5kLCBjb25zdW1lIGl0LCBvdGhlcndpc2UsXG4vLyByYWlzZSBhbiB1bmV4cGVjdGVkIHRva2VuIGVycm9yLlxuXG5wcCQ5LmV4cGVjdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdGhpcy5lYXQodHlwZSkgfHwgdGhpcy51bmV4cGVjdGVkKCk7XG59O1xuXG4vLyBSYWlzZSBhbiB1bmV4cGVjdGVkIHRva2VuIGVycm9yLlxuXG5wcCQ5LnVuZXhwZWN0ZWQgPSBmdW5jdGlvbihwb3MpIHtcbiAgdGhpcy5yYWlzZShwb3MgIT0gbnVsbCA/IHBvcyA6IHRoaXMuc3RhcnQsIFwiVW5leHBlY3RlZCB0b2tlblwiKTtcbn07XG5cbnZhciBEZXN0cnVjdHVyaW5nRXJyb3JzID0gZnVuY3Rpb24gRGVzdHJ1Y3R1cmluZ0Vycm9ycygpIHtcbiAgdGhpcy5zaG9ydGhhbmRBc3NpZ24gPVxuICB0aGlzLnRyYWlsaW5nQ29tbWEgPVxuICB0aGlzLnBhcmVudGhlc2l6ZWRBc3NpZ24gPVxuICB0aGlzLnBhcmVudGhlc2l6ZWRCaW5kID1cbiAgdGhpcy5kb3VibGVQcm90byA9XG4gICAgLTE7XG59O1xuXG5wcCQ5LmNoZWNrUGF0dGVybkVycm9ycyA9IGZ1bmN0aW9uKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMsIGlzQXNzaWduKSB7XG4gIGlmICghcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykgeyByZXR1cm4gfVxuICBpZiAocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy50cmFpbGluZ0NvbW1hID4gLTEpXG4gICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy50cmFpbGluZ0NvbW1hLCBcIkNvbW1hIGlzIG5vdCBwZXJtaXR0ZWQgYWZ0ZXIgdGhlIHJlc3QgZWxlbWVudFwiKTsgfVxuICB2YXIgcGFyZW5zID0gaXNBc3NpZ24gPyByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnBhcmVudGhlc2l6ZWRBc3NpZ24gOiByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnBhcmVudGhlc2l6ZWRCaW5kO1xuICBpZiAocGFyZW5zID4gLTEpIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKHBhcmVucywgaXNBc3NpZ24gPyBcIkFzc2lnbmluZyB0byBydmFsdWVcIiA6IFwiUGFyZW50aGVzaXplZCBwYXR0ZXJuXCIpOyB9XG59O1xuXG5wcCQ5LmNoZWNrRXhwcmVzc2lvbkVycm9ycyA9IGZ1bmN0aW9uKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMsIGFuZFRocm93KSB7XG4gIGlmICghcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykgeyByZXR1cm4gZmFsc2UgfVxuICB2YXIgc2hvcnRoYW5kQXNzaWduID0gcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy5zaG9ydGhhbmRBc3NpZ247XG4gIHZhciBkb3VibGVQcm90byA9IHJlZkRlc3RydWN0dXJpbmdFcnJvcnMuZG91YmxlUHJvdG87XG4gIGlmICghYW5kVGhyb3cpIHsgcmV0dXJuIHNob3J0aGFuZEFzc2lnbiA+PSAwIHx8IGRvdWJsZVByb3RvID49IDAgfVxuICBpZiAoc2hvcnRoYW5kQXNzaWduID49IDApXG4gICAgeyB0aGlzLnJhaXNlKHNob3J0aGFuZEFzc2lnbiwgXCJTaG9ydGhhbmQgcHJvcGVydHkgYXNzaWdubWVudHMgYXJlIHZhbGlkIG9ubHkgaW4gZGVzdHJ1Y3R1cmluZyBwYXR0ZXJuc1wiKTsgfVxuICBpZiAoZG91YmxlUHJvdG8gPj0gMClcbiAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShkb3VibGVQcm90bywgXCJSZWRlZmluaXRpb24gb2YgX19wcm90b19fIHByb3BlcnR5XCIpOyB9XG59O1xuXG5wcCQ5LmNoZWNrWWllbGRBd2FpdEluRGVmYXVsdFBhcmFtcyA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy55aWVsZFBvcyAmJiAoIXRoaXMuYXdhaXRQb3MgfHwgdGhpcy55aWVsZFBvcyA8IHRoaXMuYXdhaXRQb3MpKVxuICAgIHsgdGhpcy5yYWlzZSh0aGlzLnlpZWxkUG9zLCBcIllpZWxkIGV4cHJlc3Npb24gY2Fubm90IGJlIGEgZGVmYXVsdCB2YWx1ZVwiKTsgfVxuICBpZiAodGhpcy5hd2FpdFBvcylcbiAgICB7IHRoaXMucmFpc2UodGhpcy5hd2FpdFBvcywgXCJBd2FpdCBleHByZXNzaW9uIGNhbm5vdCBiZSBhIGRlZmF1bHQgdmFsdWVcIik7IH1cbn07XG5cbnBwJDkuaXNTaW1wbGVBc3NpZ25UYXJnZXQgPSBmdW5jdGlvbihleHByKSB7XG4gIGlmIChleHByLnR5cGUgPT09IFwiUGFyZW50aGVzaXplZEV4cHJlc3Npb25cIilcbiAgICB7IHJldHVybiB0aGlzLmlzU2ltcGxlQXNzaWduVGFyZ2V0KGV4cHIuZXhwcmVzc2lvbikgfVxuICByZXR1cm4gZXhwci50eXBlID09PSBcIklkZW50aWZpZXJcIiB8fCBleHByLnR5cGUgPT09IFwiTWVtYmVyRXhwcmVzc2lvblwiXG59O1xuXG52YXIgcHAkOCA9IFBhcnNlci5wcm90b3R5cGU7XG5cbi8vICMjIyBTdGF0ZW1lbnQgcGFyc2luZ1xuXG4vLyBQYXJzZSBhIHByb2dyYW0uIEluaXRpYWxpemVzIHRoZSBwYXJzZXIsIHJlYWRzIGFueSBudW1iZXIgb2Zcbi8vIHN0YXRlbWVudHMsIGFuZCB3cmFwcyB0aGVtIGluIGEgUHJvZ3JhbSBub2RlLiAgT3B0aW9uYWxseSB0YWtlcyBhXG4vLyBgcHJvZ3JhbWAgYXJndW1lbnQuICBJZiBwcmVzZW50LCB0aGUgc3RhdGVtZW50cyB3aWxsIGJlIGFwcGVuZGVkXG4vLyB0byBpdHMgYm9keSBpbnN0ZWFkIG9mIGNyZWF0aW5nIGEgbmV3IG5vZGUuXG5cbnBwJDgucGFyc2VUb3BMZXZlbCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgdmFyIGV4cG9ydHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBpZiAoIW5vZGUuYm9keSkgeyBub2RlLmJvZHkgPSBbXTsgfVxuICB3aGlsZSAodGhpcy50eXBlICE9PSB0eXBlcyQxLmVvZikge1xuICAgIHZhciBzdG10ID0gdGhpcy5wYXJzZVN0YXRlbWVudChudWxsLCB0cnVlLCBleHBvcnRzKTtcbiAgICBub2RlLmJvZHkucHVzaChzdG10KTtcbiAgfVxuICBpZiAodGhpcy5pbk1vZHVsZSlcbiAgICB7IGZvciAodmFyIGkgPSAwLCBsaXN0ID0gT2JqZWN0LmtleXModGhpcy51bmRlZmluZWRFeHBvcnRzKTsgaSA8IGxpc3QubGVuZ3RoOyBpICs9IDEpXG4gICAgICB7XG4gICAgICAgIHZhciBuYW1lID0gbGlzdFtpXTtcblxuICAgICAgICB0aGlzLnJhaXNlUmVjb3ZlcmFibGUodGhpcy51bmRlZmluZWRFeHBvcnRzW25hbWVdLnN0YXJ0LCAoXCJFeHBvcnQgJ1wiICsgbmFtZSArIFwiJyBpcyBub3QgZGVmaW5lZFwiKSk7XG4gICAgICB9IH1cbiAgdGhpcy5hZGFwdERpcmVjdGl2ZVByb2xvZ3VlKG5vZGUuYm9keSk7XG4gIHRoaXMubmV4dCgpO1xuICBub2RlLnNvdXJjZVR5cGUgPSB0aGlzLm9wdGlvbnMuc291cmNlVHlwZTtcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIlByb2dyYW1cIilcbn07XG5cbnZhciBsb29wTGFiZWwgPSB7a2luZDogXCJsb29wXCJ9LCBzd2l0Y2hMYWJlbCA9IHtraW5kOiBcInN3aXRjaFwifTtcblxucHAkOC5pc0xldCA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA8IDYgfHwgIXRoaXMuaXNDb250ZXh0dWFsKFwibGV0XCIpKSB7IHJldHVybiBmYWxzZSB9XG4gIHNraXBXaGl0ZVNwYWNlLmxhc3RJbmRleCA9IHRoaXMucG9zO1xuICB2YXIgc2tpcCA9IHNraXBXaGl0ZVNwYWNlLmV4ZWModGhpcy5pbnB1dCk7XG4gIHZhciBuZXh0ID0gdGhpcy5wb3MgKyBza2lwWzBdLmxlbmd0aCwgbmV4dENoID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KG5leHQpO1xuICAvLyBGb3IgYW1iaWd1b3VzIGNhc2VzLCBkZXRlcm1pbmUgaWYgYSBMZXhpY2FsRGVjbGFyYXRpb24gKG9yIG9ubHkgYVxuICAvLyBTdGF0ZW1lbnQpIGlzIGFsbG93ZWQgaGVyZS4gSWYgY29udGV4dCBpcyBub3QgZW1wdHkgdGhlbiBvbmx5IGEgU3RhdGVtZW50XG4gIC8vIGlzIGFsbG93ZWQuIEhvd2V2ZXIsIGBsZXQgW2AgaXMgYW4gZXhwbGljaXQgbmVnYXRpdmUgbG9va2FoZWFkIGZvclxuICAvLyBFeHByZXNzaW9uU3RhdGVtZW50LCBzbyBzcGVjaWFsLWNhc2UgaXQgZmlyc3QuXG4gIGlmIChuZXh0Q2ggPT09IDkxIHx8IG5leHRDaCA9PT0gOTIpIHsgcmV0dXJuIHRydWUgfSAvLyAnWycsICdcXCdcbiAgaWYgKGNvbnRleHQpIHsgcmV0dXJuIGZhbHNlIH1cblxuICBpZiAobmV4dENoID09PSAxMjMgfHwgbmV4dENoID4gMHhkN2ZmICYmIG5leHRDaCA8IDB4ZGMwMCkgeyByZXR1cm4gdHJ1ZSB9IC8vICd7JywgYXN0cmFsXG4gIGlmIChpc0lkZW50aWZpZXJTdGFydChuZXh0Q2gsIHRydWUpKSB7XG4gICAgdmFyIHBvcyA9IG5leHQgKyAxO1xuICAgIHdoaWxlIChpc0lkZW50aWZpZXJDaGFyKG5leHRDaCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdChwb3MpLCB0cnVlKSkgeyArK3BvczsgfVxuICAgIGlmIChuZXh0Q2ggPT09IDkyIHx8IG5leHRDaCA+IDB4ZDdmZiAmJiBuZXh0Q2ggPCAweGRjMDApIHsgcmV0dXJuIHRydWUgfVxuICAgIHZhciBpZGVudCA9IHRoaXMuaW5wdXQuc2xpY2UobmV4dCwgcG9zKTtcbiAgICBpZiAoIWtleXdvcmRSZWxhdGlvbmFsT3BlcmF0b3IudGVzdChpZGVudCkpIHsgcmV0dXJuIHRydWUgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufTtcblxuLy8gY2hlY2sgJ2FzeW5jIFtubyBMaW5lVGVybWluYXRvciBoZXJlXSBmdW5jdGlvbidcbi8vIC0gJ2FzeW5jIC8qZm9vKi8gZnVuY3Rpb24nIGlzIE9LLlxuLy8gLSAnYXN5bmMgLypcXG4qLyBmdW5jdGlvbicgaXMgaW52YWxpZC5cbnBwJDguaXNBc3luY0Z1bmN0aW9uID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPCA4IHx8ICF0aGlzLmlzQ29udGV4dHVhbChcImFzeW5jXCIpKVxuICAgIHsgcmV0dXJuIGZhbHNlIH1cblxuICBza2lwV2hpdGVTcGFjZS5sYXN0SW5kZXggPSB0aGlzLnBvcztcbiAgdmFyIHNraXAgPSBza2lwV2hpdGVTcGFjZS5leGVjKHRoaXMuaW5wdXQpO1xuICB2YXIgbmV4dCA9IHRoaXMucG9zICsgc2tpcFswXS5sZW5ndGgsIGFmdGVyO1xuICByZXR1cm4gIWxpbmVCcmVhay50ZXN0KHRoaXMuaW5wdXQuc2xpY2UodGhpcy5wb3MsIG5leHQpKSAmJlxuICAgIHRoaXMuaW5wdXQuc2xpY2UobmV4dCwgbmV4dCArIDgpID09PSBcImZ1bmN0aW9uXCIgJiZcbiAgICAobmV4dCArIDggPT09IHRoaXMuaW5wdXQubGVuZ3RoIHx8XG4gICAgICEoaXNJZGVudGlmaWVyQ2hhcihhZnRlciA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdChuZXh0ICsgOCkpIHx8IGFmdGVyID4gMHhkN2ZmICYmIGFmdGVyIDwgMHhkYzAwKSlcbn07XG5cbnBwJDguaXNVc2luZ0tleXdvcmQgPSBmdW5jdGlvbihpc0F3YWl0VXNpbmcsIGlzRm9yKSB7XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPCAxNyB8fCAhdGhpcy5pc0NvbnRleHR1YWwoaXNBd2FpdFVzaW5nID8gXCJhd2FpdFwiIDogXCJ1c2luZ1wiKSlcbiAgICB7IHJldHVybiBmYWxzZSB9XG5cbiAgc2tpcFdoaXRlU3BhY2UubGFzdEluZGV4ID0gdGhpcy5wb3M7XG4gIHZhciBza2lwID0gc2tpcFdoaXRlU3BhY2UuZXhlYyh0aGlzLmlucHV0KTtcbiAgdmFyIG5leHQgPSB0aGlzLnBvcyArIHNraXBbMF0ubGVuZ3RoO1xuXG4gIGlmIChsaW5lQnJlYWsudGVzdCh0aGlzLmlucHV0LnNsaWNlKHRoaXMucG9zLCBuZXh0KSkpIHsgcmV0dXJuIGZhbHNlIH1cblxuICBpZiAoaXNBd2FpdFVzaW5nKSB7XG4gICAgdmFyIGF3YWl0RW5kUG9zID0gbmV4dCArIDUgLyogYXdhaXQgKi8sIGFmdGVyO1xuICAgIGlmICh0aGlzLmlucHV0LnNsaWNlKG5leHQsIGF3YWl0RW5kUG9zKSAhPT0gXCJ1c2luZ1wiIHx8XG4gICAgICBhd2FpdEVuZFBvcyA9PT0gdGhpcy5pbnB1dC5sZW5ndGggfHxcbiAgICAgIGlzSWRlbnRpZmllckNoYXIoYWZ0ZXIgPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQoYXdhaXRFbmRQb3MpKSB8fFxuICAgICAgKGFmdGVyID4gMHhkN2ZmICYmIGFmdGVyIDwgMHhkYzAwKVxuICAgICkgeyByZXR1cm4gZmFsc2UgfVxuXG4gICAgc2tpcFdoaXRlU3BhY2UubGFzdEluZGV4ID0gYXdhaXRFbmRQb3M7XG4gICAgdmFyIHNraXBBZnRlclVzaW5nID0gc2tpcFdoaXRlU3BhY2UuZXhlYyh0aGlzLmlucHV0KTtcbiAgICBpZiAoc2tpcEFmdGVyVXNpbmcgJiYgbGluZUJyZWFrLnRlc3QodGhpcy5pbnB1dC5zbGljZShhd2FpdEVuZFBvcywgYXdhaXRFbmRQb3MgKyBza2lwQWZ0ZXJVc2luZ1swXS5sZW5ndGgpKSkgeyByZXR1cm4gZmFsc2UgfVxuICB9XG5cbiAgaWYgKGlzRm9yKSB7XG4gICAgdmFyIG9mRW5kUG9zID0gbmV4dCArIDIgLyogb2YgKi8sIGFmdGVyJDE7XG4gICAgaWYgKHRoaXMuaW5wdXQuc2xpY2UobmV4dCwgb2ZFbmRQb3MpID09PSBcIm9mXCIpIHtcbiAgICAgIGlmIChvZkVuZFBvcyA9PT0gdGhpcy5pbnB1dC5sZW5ndGggfHxcbiAgICAgICAgKCFpc0lkZW50aWZpZXJDaGFyKGFmdGVyJDEgPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQob2ZFbmRQb3MpKSAmJiAhKGFmdGVyJDEgPiAweGQ3ZmYgJiYgYWZ0ZXIkMSA8IDB4ZGMwMCkpKSB7IHJldHVybiBmYWxzZSB9XG4gICAgfVxuICB9XG5cbiAgdmFyIGNoID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KG5leHQpO1xuICByZXR1cm4gaXNJZGVudGlmaWVyU3RhcnQoY2gsIHRydWUpIHx8IGNoID09PSA5MiAvLyAnXFwnXG59O1xuXG5wcCQ4LmlzQXdhaXRVc2luZyA9IGZ1bmN0aW9uKGlzRm9yKSB7XG4gIHJldHVybiB0aGlzLmlzVXNpbmdLZXl3b3JkKHRydWUsIGlzRm9yKVxufTtcblxucHAkOC5pc1VzaW5nID0gZnVuY3Rpb24oaXNGb3IpIHtcbiAgcmV0dXJuIHRoaXMuaXNVc2luZ0tleXdvcmQoZmFsc2UsIGlzRm9yKVxufTtcblxuLy8gUGFyc2UgYSBzaW5nbGUgc3RhdGVtZW50LlxuLy9cbi8vIElmIGV4cGVjdGluZyBhIHN0YXRlbWVudCBhbmQgZmluZGluZyBhIHNsYXNoIG9wZXJhdG9yLCBwYXJzZSBhXG4vLyByZWd1bGFyIGV4cHJlc3Npb24gbGl0ZXJhbC4gVGhpcyBpcyB0byBoYW5kbGUgY2FzZXMgbGlrZVxuLy8gYGlmIChmb28pIC9ibGFoLy5leGVjKGZvbylgLCB3aGVyZSBsb29raW5nIGF0IHRoZSBwcmV2aW91cyB0b2tlblxuLy8gZG9lcyBub3QgaGVscC5cblxucHAkOC5wYXJzZVN0YXRlbWVudCA9IGZ1bmN0aW9uKGNvbnRleHQsIHRvcExldmVsLCBleHBvcnRzKSB7XG4gIHZhciBzdGFydHR5cGUgPSB0aGlzLnR5cGUsIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpLCBraW5kO1xuXG4gIGlmICh0aGlzLmlzTGV0KGNvbnRleHQpKSB7XG4gICAgc3RhcnR0eXBlID0gdHlwZXMkMS5fdmFyO1xuICAgIGtpbmQgPSBcImxldFwiO1xuICB9XG5cbiAgLy8gTW9zdCB0eXBlcyBvZiBzdGF0ZW1lbnRzIGFyZSByZWNvZ25pemVkIGJ5IHRoZSBrZXl3b3JkIHRoZXlcbiAgLy8gc3RhcnQgd2l0aC4gTWFueSBhcmUgdHJpdmlhbCB0byBwYXJzZSwgc29tZSByZXF1aXJlIGEgYml0IG9mXG4gIC8vIGNvbXBsZXhpdHkuXG5cbiAgc3dpdGNoIChzdGFydHR5cGUpIHtcbiAgY2FzZSB0eXBlcyQxLl9icmVhazogY2FzZSB0eXBlcyQxLl9jb250aW51ZTogcmV0dXJuIHRoaXMucGFyc2VCcmVha0NvbnRpbnVlU3RhdGVtZW50KG5vZGUsIHN0YXJ0dHlwZS5rZXl3b3JkKVxuICBjYXNlIHR5cGVzJDEuX2RlYnVnZ2VyOiByZXR1cm4gdGhpcy5wYXJzZURlYnVnZ2VyU3RhdGVtZW50KG5vZGUpXG4gIGNhc2UgdHlwZXMkMS5fZG86IHJldHVybiB0aGlzLnBhcnNlRG9TdGF0ZW1lbnQobm9kZSlcbiAgY2FzZSB0eXBlcyQxLl9mb3I6IHJldHVybiB0aGlzLnBhcnNlRm9yU3RhdGVtZW50KG5vZGUpXG4gIGNhc2UgdHlwZXMkMS5fZnVuY3Rpb246XG4gICAgLy8gRnVuY3Rpb24gYXMgc29sZSBib2R5IG9mIGVpdGhlciBhbiBpZiBzdGF0ZW1lbnQgb3IgYSBsYWJlbGVkIHN0YXRlbWVudFxuICAgIC8vIHdvcmtzLCBidXQgbm90IHdoZW4gaXQgaXMgcGFydCBvZiBhIGxhYmVsZWQgc3RhdGVtZW50IHRoYXQgaXMgdGhlIHNvbGVcbiAgICAvLyBib2R5IG9mIGFuIGlmIHN0YXRlbWVudC5cbiAgICBpZiAoKGNvbnRleHQgJiYgKHRoaXMuc3RyaWN0IHx8IGNvbnRleHQgIT09IFwiaWZcIiAmJiBjb250ZXh0ICE9PSBcImxhYmVsXCIpKSAmJiB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNikgeyB0aGlzLnVuZXhwZWN0ZWQoKTsgfVxuICAgIHJldHVybiB0aGlzLnBhcnNlRnVuY3Rpb25TdGF0ZW1lbnQobm9kZSwgZmFsc2UsICFjb250ZXh0KVxuICBjYXNlIHR5cGVzJDEuX2NsYXNzOlxuICAgIGlmIChjb250ZXh0KSB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gICAgcmV0dXJuIHRoaXMucGFyc2VDbGFzcyhub2RlLCB0cnVlKVxuICBjYXNlIHR5cGVzJDEuX2lmOiByZXR1cm4gdGhpcy5wYXJzZUlmU3RhdGVtZW50KG5vZGUpXG4gIGNhc2UgdHlwZXMkMS5fcmV0dXJuOiByZXR1cm4gdGhpcy5wYXJzZVJldHVyblN0YXRlbWVudChub2RlKVxuICBjYXNlIHR5cGVzJDEuX3N3aXRjaDogcmV0dXJuIHRoaXMucGFyc2VTd2l0Y2hTdGF0ZW1lbnQobm9kZSlcbiAgY2FzZSB0eXBlcyQxLl90aHJvdzogcmV0dXJuIHRoaXMucGFyc2VUaHJvd1N0YXRlbWVudChub2RlKVxuICBjYXNlIHR5cGVzJDEuX3RyeTogcmV0dXJuIHRoaXMucGFyc2VUcnlTdGF0ZW1lbnQobm9kZSlcbiAgY2FzZSB0eXBlcyQxLl9jb25zdDogY2FzZSB0eXBlcyQxLl92YXI6XG4gICAga2luZCA9IGtpbmQgfHwgdGhpcy52YWx1ZTtcbiAgICBpZiAoY29udGV4dCAmJiBraW5kICE9PSBcInZhclwiKSB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gICAgcmV0dXJuIHRoaXMucGFyc2VWYXJTdGF0ZW1lbnQobm9kZSwga2luZClcbiAgY2FzZSB0eXBlcyQxLl93aGlsZTogcmV0dXJuIHRoaXMucGFyc2VXaGlsZVN0YXRlbWVudChub2RlKVxuICBjYXNlIHR5cGVzJDEuX3dpdGg6IHJldHVybiB0aGlzLnBhcnNlV2l0aFN0YXRlbWVudChub2RlKVxuICBjYXNlIHR5cGVzJDEuYnJhY2VMOiByZXR1cm4gdGhpcy5wYXJzZUJsb2NrKHRydWUsIG5vZGUpXG4gIGNhc2UgdHlwZXMkMS5zZW1pOiByZXR1cm4gdGhpcy5wYXJzZUVtcHR5U3RhdGVtZW50KG5vZGUpXG4gIGNhc2UgdHlwZXMkMS5fZXhwb3J0OlxuICBjYXNlIHR5cGVzJDEuX2ltcG9ydDpcbiAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID4gMTAgJiYgc3RhcnR0eXBlID09PSB0eXBlcyQxLl9pbXBvcnQpIHtcbiAgICAgIHNraXBXaGl0ZVNwYWNlLmxhc3RJbmRleCA9IHRoaXMucG9zO1xuICAgICAgdmFyIHNraXAgPSBza2lwV2hpdGVTcGFjZS5leGVjKHRoaXMuaW5wdXQpO1xuICAgICAgdmFyIG5leHQgPSB0aGlzLnBvcyArIHNraXBbMF0ubGVuZ3RoLCBuZXh0Q2ggPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQobmV4dCk7XG4gICAgICBpZiAobmV4dENoID09PSA0MCB8fCBuZXh0Q2ggPT09IDQ2KSAvLyAnKCcgb3IgJy4nXG4gICAgICAgIHsgcmV0dXJuIHRoaXMucGFyc2VFeHByZXNzaW9uU3RhdGVtZW50KG5vZGUsIHRoaXMucGFyc2VFeHByZXNzaW9uKCkpIH1cbiAgICB9XG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5hbGxvd0ltcG9ydEV4cG9ydEV2ZXJ5d2hlcmUpIHtcbiAgICAgIGlmICghdG9wTGV2ZWwpXG4gICAgICAgIHsgdGhpcy5yYWlzZSh0aGlzLnN0YXJ0LCBcIidpbXBvcnQnIGFuZCAnZXhwb3J0JyBtYXkgb25seSBhcHBlYXIgYXQgdGhlIHRvcCBsZXZlbFwiKTsgfVxuICAgICAgaWYgKCF0aGlzLmluTW9kdWxlKVxuICAgICAgICB7IHRoaXMucmFpc2UodGhpcy5zdGFydCwgXCInaW1wb3J0JyBhbmQgJ2V4cG9ydCcgbWF5IGFwcGVhciBvbmx5IHdpdGggJ3NvdXJjZVR5cGU6IG1vZHVsZSdcIik7IH1cbiAgICB9XG4gICAgcmV0dXJuIHN0YXJ0dHlwZSA9PT0gdHlwZXMkMS5faW1wb3J0ID8gdGhpcy5wYXJzZUltcG9ydChub2RlKSA6IHRoaXMucGFyc2VFeHBvcnQobm9kZSwgZXhwb3J0cylcblxuICAgIC8vIElmIHRoZSBzdGF0ZW1lbnQgZG9lcyBub3Qgc3RhcnQgd2l0aCBhIHN0YXRlbWVudCBrZXl3b3JkIG9yIGFcbiAgICAvLyBicmFjZSwgaXQncyBhbiBFeHByZXNzaW9uU3RhdGVtZW50IG9yIExhYmVsZWRTdGF0ZW1lbnQuIFdlXG4gICAgLy8gc2ltcGx5IHN0YXJ0IHBhcnNpbmcgYW4gZXhwcmVzc2lvbiwgYW5kIGFmdGVyd2FyZHMsIGlmIHRoZVxuICAgIC8vIG5leHQgdG9rZW4gaXMgYSBjb2xvbiBhbmQgdGhlIGV4cHJlc3Npb24gd2FzIGEgc2ltcGxlXG4gICAgLy8gSWRlbnRpZmllciBub2RlLCB3ZSBzd2l0Y2ggdG8gaW50ZXJwcmV0aW5nIGl0IGFzIGEgbGFiZWwuXG4gIGRlZmF1bHQ6XG4gICAgaWYgKHRoaXMuaXNBc3luY0Z1bmN0aW9uKCkpIHtcbiAgICAgIGlmIChjb250ZXh0KSB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gICAgICB0aGlzLm5leHQoKTtcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlRnVuY3Rpb25TdGF0ZW1lbnQobm9kZSwgdHJ1ZSwgIWNvbnRleHQpXG4gICAgfVxuXG4gICAgdmFyIHVzaW5nS2luZCA9IHRoaXMuaXNBd2FpdFVzaW5nKGZhbHNlKSA/IFwiYXdhaXQgdXNpbmdcIiA6IHRoaXMuaXNVc2luZyhmYWxzZSkgPyBcInVzaW5nXCIgOiBudWxsO1xuICAgIGlmICh1c2luZ0tpbmQpIHtcbiAgICAgIGlmICh0b3BMZXZlbCAmJiB0aGlzLm9wdGlvbnMuc291cmNlVHlwZSA9PT0gXCJzY3JpcHRcIikge1xuICAgICAgICB0aGlzLnJhaXNlKHRoaXMuc3RhcnQsIFwiVXNpbmcgZGVjbGFyYXRpb24gY2Fubm90IGFwcGVhciBpbiB0aGUgdG9wIGxldmVsIHdoZW4gc291cmNlIHR5cGUgaXMgYHNjcmlwdGBcIik7XG4gICAgICB9XG4gICAgICBpZiAodXNpbmdLaW5kID09PSBcImF3YWl0IHVzaW5nXCIpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbkF3YWl0KSB7XG4gICAgICAgICAgdGhpcy5yYWlzZSh0aGlzLnN0YXJ0LCBcIkF3YWl0IHVzaW5nIGNhbm5vdCBhcHBlYXIgb3V0c2lkZSBvZiBhc3luYyBmdW5jdGlvblwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm5leHQoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMubmV4dCgpO1xuICAgICAgdGhpcy5wYXJzZVZhcihub2RlLCBmYWxzZSwgdXNpbmdLaW5kKTtcbiAgICAgIHRoaXMuc2VtaWNvbG9uKCk7XG4gICAgICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiVmFyaWFibGVEZWNsYXJhdGlvblwiKVxuICAgIH1cblxuICAgIHZhciBtYXliZU5hbWUgPSB0aGlzLnZhbHVlLCBleHByID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICBpZiAoc3RhcnR0eXBlID09PSB0eXBlcyQxLm5hbWUgJiYgZXhwci50eXBlID09PSBcIklkZW50aWZpZXJcIiAmJiB0aGlzLmVhdCh0eXBlcyQxLmNvbG9uKSlcbiAgICAgIHsgcmV0dXJuIHRoaXMucGFyc2VMYWJlbGVkU3RhdGVtZW50KG5vZGUsIG1heWJlTmFtZSwgZXhwciwgY29udGV4dCkgfVxuICAgIGVsc2UgeyByZXR1cm4gdGhpcy5wYXJzZUV4cHJlc3Npb25TdGF0ZW1lbnQobm9kZSwgZXhwcikgfVxuICB9XG59O1xuXG5wcCQ4LnBhcnNlQnJlYWtDb250aW51ZVN0YXRlbWVudCA9IGZ1bmN0aW9uKG5vZGUsIGtleXdvcmQpIHtcbiAgdmFyIGlzQnJlYWsgPSBrZXl3b3JkID09PSBcImJyZWFrXCI7XG4gIHRoaXMubmV4dCgpO1xuICBpZiAodGhpcy5lYXQodHlwZXMkMS5zZW1pKSB8fCB0aGlzLmluc2VydFNlbWljb2xvbigpKSB7IG5vZGUubGFiZWwgPSBudWxsOyB9XG4gIGVsc2UgaWYgKHRoaXMudHlwZSAhPT0gdHlwZXMkMS5uYW1lKSB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gIGVsc2Uge1xuICAgIG5vZGUubGFiZWwgPSB0aGlzLnBhcnNlSWRlbnQoKTtcbiAgICB0aGlzLnNlbWljb2xvbigpO1xuICB9XG5cbiAgLy8gVmVyaWZ5IHRoYXQgdGhlcmUgaXMgYW4gYWN0dWFsIGRlc3RpbmF0aW9uIHRvIGJyZWFrIG9yXG4gIC8vIGNvbnRpbnVlIHRvLlxuICB2YXIgaSA9IDA7XG4gIGZvciAoOyBpIDwgdGhpcy5sYWJlbHMubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgbGFiID0gdGhpcy5sYWJlbHNbaV07XG4gICAgaWYgKG5vZGUubGFiZWwgPT0gbnVsbCB8fCBsYWIubmFtZSA9PT0gbm9kZS5sYWJlbC5uYW1lKSB7XG4gICAgICBpZiAobGFiLmtpbmQgIT0gbnVsbCAmJiAoaXNCcmVhayB8fCBsYWIua2luZCA9PT0gXCJsb29wXCIpKSB7IGJyZWFrIH1cbiAgICAgIGlmIChub2RlLmxhYmVsICYmIGlzQnJlYWspIHsgYnJlYWsgfVxuICAgIH1cbiAgfVxuICBpZiAoaSA9PT0gdGhpcy5sYWJlbHMubGVuZ3RoKSB7IHRoaXMucmFpc2Uobm9kZS5zdGFydCwgXCJVbnN5bnRhY3RpYyBcIiArIGtleXdvcmQpOyB9XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgaXNCcmVhayA/IFwiQnJlYWtTdGF0ZW1lbnRcIiA6IFwiQ29udGludWVTdGF0ZW1lbnRcIilcbn07XG5cbnBwJDgucGFyc2VEZWJ1Z2dlclN0YXRlbWVudCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgdGhpcy5uZXh0KCk7XG4gIHRoaXMuc2VtaWNvbG9uKCk7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJEZWJ1Z2dlclN0YXRlbWVudFwiKVxufTtcblxucHAkOC5wYXJzZURvU3RhdGVtZW50ID0gZnVuY3Rpb24obm9kZSkge1xuICB0aGlzLm5leHQoKTtcbiAgdGhpcy5sYWJlbHMucHVzaChsb29wTGFiZWwpO1xuICBub2RlLmJvZHkgPSB0aGlzLnBhcnNlU3RhdGVtZW50KFwiZG9cIik7XG4gIHRoaXMubGFiZWxzLnBvcCgpO1xuICB0aGlzLmV4cGVjdCh0eXBlcyQxLl93aGlsZSk7XG4gIG5vZGUudGVzdCA9IHRoaXMucGFyc2VQYXJlbkV4cHJlc3Npb24oKTtcbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2KVxuICAgIHsgdGhpcy5lYXQodHlwZXMkMS5zZW1pKTsgfVxuICBlbHNlXG4gICAgeyB0aGlzLnNlbWljb2xvbigpOyB9XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJEb1doaWxlU3RhdGVtZW50XCIpXG59O1xuXG4vLyBEaXNhbWJpZ3VhdGluZyBiZXR3ZWVuIGEgYGZvcmAgYW5kIGEgYGZvcmAvYGluYCBvciBgZm9yYC9gb2ZgXG4vLyBsb29wIGlzIG5vbi10cml2aWFsLiBCYXNpY2FsbHksIHdlIGhhdmUgdG8gcGFyc2UgdGhlIGluaXQgYHZhcmBcbi8vIHN0YXRlbWVudCBvciBleHByZXNzaW9uLCBkaXNhbGxvd2luZyB0aGUgYGluYCBvcGVyYXRvciAoc2VlXG4vLyB0aGUgc2Vjb25kIHBhcmFtZXRlciB0byBgcGFyc2VFeHByZXNzaW9uYCksIGFuZCB0aGVuIGNoZWNrXG4vLyB3aGV0aGVyIHRoZSBuZXh0IHRva2VuIGlzIGBpbmAgb3IgYG9mYC4gV2hlbiB0aGVyZSBpcyBubyBpbml0XG4vLyBwYXJ0IChzZW1pY29sb24gaW1tZWRpYXRlbHkgYWZ0ZXIgdGhlIG9wZW5pbmcgcGFyZW50aGVzaXMpLCBpdFxuLy8gaXMgYSByZWd1bGFyIGBmb3JgIGxvb3AuXG5cbnBwJDgucGFyc2VGb3JTdGF0ZW1lbnQgPSBmdW5jdGlvbihub2RlKSB7XG4gIHRoaXMubmV4dCgpO1xuICB2YXIgYXdhaXRBdCA9ICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOSAmJiB0aGlzLmNhbkF3YWl0ICYmIHRoaXMuZWF0Q29udGV4dHVhbChcImF3YWl0XCIpKSA/IHRoaXMubGFzdFRva1N0YXJ0IDogLTE7XG4gIHRoaXMubGFiZWxzLnB1c2gobG9vcExhYmVsKTtcbiAgdGhpcy5lbnRlclNjb3BlKDApO1xuICB0aGlzLmV4cGVjdCh0eXBlcyQxLnBhcmVuTCk7XG4gIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuc2VtaSkge1xuICAgIGlmIChhd2FpdEF0ID4gLTEpIHsgdGhpcy51bmV4cGVjdGVkKGF3YWl0QXQpOyB9XG4gICAgcmV0dXJuIHRoaXMucGFyc2VGb3Iobm9kZSwgbnVsbClcbiAgfVxuICB2YXIgaXNMZXQgPSB0aGlzLmlzTGV0KCk7XG4gIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuX3ZhciB8fCB0aGlzLnR5cGUgPT09IHR5cGVzJDEuX2NvbnN0IHx8IGlzTGV0KSB7XG4gICAgdmFyIGluaXQkMSA9IHRoaXMuc3RhcnROb2RlKCksIGtpbmQgPSBpc0xldCA/IFwibGV0XCIgOiB0aGlzLnZhbHVlO1xuICAgIHRoaXMubmV4dCgpO1xuICAgIHRoaXMucGFyc2VWYXIoaW5pdCQxLCB0cnVlLCBraW5kKTtcbiAgICB0aGlzLmZpbmlzaE5vZGUoaW5pdCQxLCBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIik7XG4gICAgcmV0dXJuIHRoaXMucGFyc2VGb3JBZnRlckluaXQobm9kZSwgaW5pdCQxLCBhd2FpdEF0KVxuICB9XG4gIHZhciBzdGFydHNXaXRoTGV0ID0gdGhpcy5pc0NvbnRleHR1YWwoXCJsZXRcIiksIGlzRm9yT2YgPSBmYWxzZTtcblxuICB2YXIgdXNpbmdLaW5kID0gdGhpcy5pc1VzaW5nKHRydWUpID8gXCJ1c2luZ1wiIDogdGhpcy5pc0F3YWl0VXNpbmcodHJ1ZSkgPyBcImF3YWl0IHVzaW5nXCIgOiBudWxsO1xuICBpZiAodXNpbmdLaW5kKSB7XG4gICAgdmFyIGluaXQkMiA9IHRoaXMuc3RhcnROb2RlKCk7XG4gICAgdGhpcy5uZXh0KCk7XG4gICAgaWYgKHVzaW5nS2luZCA9PT0gXCJhd2FpdCB1c2luZ1wiKSB7IHRoaXMubmV4dCgpOyB9XG4gICAgdGhpcy5wYXJzZVZhcihpbml0JDIsIHRydWUsIHVzaW5nS2luZCk7XG4gICAgdGhpcy5maW5pc2hOb2RlKGluaXQkMiwgXCJWYXJpYWJsZURlY2xhcmF0aW9uXCIpO1xuICAgIHJldHVybiB0aGlzLnBhcnNlRm9yQWZ0ZXJJbml0KG5vZGUsIGluaXQkMiwgYXdhaXRBdClcbiAgfVxuICB2YXIgY29udGFpbnNFc2MgPSB0aGlzLmNvbnRhaW5zRXNjO1xuICB2YXIgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycyA9IG5ldyBEZXN0cnVjdHVyaW5nRXJyb3JzO1xuICB2YXIgaW5pdFBvcyA9IHRoaXMuc3RhcnQ7XG4gIHZhciBpbml0ID0gYXdhaXRBdCA+IC0xXG4gICAgPyB0aGlzLnBhcnNlRXhwclN1YnNjcmlwdHMocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycywgXCJhd2FpdFwiKVxuICAgIDogdGhpcy5wYXJzZUV4cHJlc3Npb24odHJ1ZSwgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycyk7XG4gIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuX2luIHx8IChpc0Zvck9mID0gdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDYgJiYgdGhpcy5pc0NvbnRleHR1YWwoXCJvZlwiKSkpIHtcbiAgICBpZiAoYXdhaXRBdCA+IC0xKSB7IC8vIGltcGxpZXMgYGVjbWFWZXJzaW9uID49IDlgIChzZWUgZGVjbGFyYXRpb24gb2YgYXdhaXRBdClcbiAgICAgIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuX2luKSB7IHRoaXMudW5leHBlY3RlZChhd2FpdEF0KTsgfVxuICAgICAgbm9kZS5hd2FpdCA9IHRydWU7XG4gICAgfSBlbHNlIGlmIChpc0Zvck9mICYmIHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA4KSB7XG4gICAgICBpZiAoaW5pdC5zdGFydCA9PT0gaW5pdFBvcyAmJiAhY29udGFpbnNFc2MgJiYgaW5pdC50eXBlID09PSBcIklkZW50aWZpZXJcIiAmJiBpbml0Lm5hbWUgPT09IFwiYXN5bmNcIikgeyB0aGlzLnVuZXhwZWN0ZWQoKTsgfVxuICAgICAgZWxzZSBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDkpIHsgbm9kZS5hd2FpdCA9IGZhbHNlOyB9XG4gICAgfVxuICAgIGlmIChzdGFydHNXaXRoTGV0ICYmIGlzRm9yT2YpIHsgdGhpcy5yYWlzZShpbml0LnN0YXJ0LCBcIlRoZSBsZWZ0LWhhbmQgc2lkZSBvZiBhIGZvci1vZiBsb29wIG1heSBub3Qgc3RhcnQgd2l0aCAnbGV0Jy5cIik7IH1cbiAgICB0aGlzLnRvQXNzaWduYWJsZShpbml0LCBmYWxzZSwgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycyk7XG4gICAgdGhpcy5jaGVja0xWYWxQYXR0ZXJuKGluaXQpO1xuICAgIHJldHVybiB0aGlzLnBhcnNlRm9ySW4obm9kZSwgaW5pdClcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmNoZWNrRXhwcmVzc2lvbkVycm9ycyhyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCB0cnVlKTtcbiAgfVxuICBpZiAoYXdhaXRBdCA+IC0xKSB7IHRoaXMudW5leHBlY3RlZChhd2FpdEF0KTsgfVxuICByZXR1cm4gdGhpcy5wYXJzZUZvcihub2RlLCBpbml0KVxufTtcblxuLy8gSGVscGVyIG1ldGhvZCB0byBwYXJzZSBmb3IgbG9vcCBhZnRlciB2YXJpYWJsZSBpbml0aWFsaXphdGlvblxucHAkOC5wYXJzZUZvckFmdGVySW5pdCA9IGZ1bmN0aW9uKG5vZGUsIGluaXQsIGF3YWl0QXQpIHtcbiAgaWYgKCh0aGlzLnR5cGUgPT09IHR5cGVzJDEuX2luIHx8ICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNiAmJiB0aGlzLmlzQ29udGV4dHVhbChcIm9mXCIpKSkgJiYgaW5pdC5kZWNsYXJhdGlvbnMubGVuZ3RoID09PSAxKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA5KSB7XG4gICAgICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLl9pbikge1xuICAgICAgICBpZiAoYXdhaXRBdCA+IC0xKSB7IHRoaXMudW5leHBlY3RlZChhd2FpdEF0KTsgfVxuICAgICAgfSBlbHNlIHsgbm9kZS5hd2FpdCA9IGF3YWl0QXQgPiAtMTsgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5wYXJzZUZvckluKG5vZGUsIGluaXQpXG4gIH1cbiAgaWYgKGF3YWl0QXQgPiAtMSkgeyB0aGlzLnVuZXhwZWN0ZWQoYXdhaXRBdCk7IH1cbiAgcmV0dXJuIHRoaXMucGFyc2VGb3Iobm9kZSwgaW5pdClcbn07XG5cbnBwJDgucGFyc2VGdW5jdGlvblN0YXRlbWVudCA9IGZ1bmN0aW9uKG5vZGUsIGlzQXN5bmMsIGRlY2xhcmF0aW9uUG9zaXRpb24pIHtcbiAgdGhpcy5uZXh0KCk7XG4gIHJldHVybiB0aGlzLnBhcnNlRnVuY3Rpb24obm9kZSwgRlVOQ19TVEFURU1FTlQgfCAoZGVjbGFyYXRpb25Qb3NpdGlvbiA/IDAgOiBGVU5DX0hBTkdJTkdfU1RBVEVNRU5UKSwgZmFsc2UsIGlzQXN5bmMpXG59O1xuXG5wcCQ4LnBhcnNlSWZTdGF0ZW1lbnQgPSBmdW5jdGlvbihub2RlKSB7XG4gIHRoaXMubmV4dCgpO1xuICBub2RlLnRlc3QgPSB0aGlzLnBhcnNlUGFyZW5FeHByZXNzaW9uKCk7XG4gIC8vIGFsbG93IGZ1bmN0aW9uIGRlY2xhcmF0aW9ucyBpbiBicmFuY2hlcywgYnV0IG9ubHkgaW4gbm9uLXN0cmljdCBtb2RlXG4gIG5vZGUuY29uc2VxdWVudCA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoXCJpZlwiKTtcbiAgbm9kZS5hbHRlcm5hdGUgPSB0aGlzLmVhdCh0eXBlcyQxLl9lbHNlKSA/IHRoaXMucGFyc2VTdGF0ZW1lbnQoXCJpZlwiKSA6IG51bGw7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJJZlN0YXRlbWVudFwiKVxufTtcblxucHAkOC5wYXJzZVJldHVyblN0YXRlbWVudCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgaWYgKCF0aGlzLmluRnVuY3Rpb24gJiYgIXRoaXMub3B0aW9ucy5hbGxvd1JldHVybk91dHNpZGVGdW5jdGlvbilcbiAgICB7IHRoaXMucmFpc2UodGhpcy5zdGFydCwgXCIncmV0dXJuJyBvdXRzaWRlIG9mIGZ1bmN0aW9uXCIpOyB9XG4gIHRoaXMubmV4dCgpO1xuXG4gIC8vIEluIGByZXR1cm5gIChhbmQgYGJyZWFrYC9gY29udGludWVgKSwgdGhlIGtleXdvcmRzIHdpdGhcbiAgLy8gb3B0aW9uYWwgYXJndW1lbnRzLCB3ZSBlYWdlcmx5IGxvb2sgZm9yIGEgc2VtaWNvbG9uIG9yIHRoZVxuICAvLyBwb3NzaWJpbGl0eSB0byBpbnNlcnQgb25lLlxuXG4gIGlmICh0aGlzLmVhdCh0eXBlcyQxLnNlbWkpIHx8IHRoaXMuaW5zZXJ0U2VtaWNvbG9uKCkpIHsgbm9kZS5hcmd1bWVudCA9IG51bGw7IH1cbiAgZWxzZSB7IG5vZGUuYXJndW1lbnQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpOyB0aGlzLnNlbWljb2xvbigpOyB9XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJSZXR1cm5TdGF0ZW1lbnRcIilcbn07XG5cbnBwJDgucGFyc2VTd2l0Y2hTdGF0ZW1lbnQgPSBmdW5jdGlvbihub2RlKSB7XG4gIHRoaXMubmV4dCgpO1xuICBub2RlLmRpc2NyaW1pbmFudCA9IHRoaXMucGFyc2VQYXJlbkV4cHJlc3Npb24oKTtcbiAgbm9kZS5jYXNlcyA9IFtdO1xuICB0aGlzLmV4cGVjdCh0eXBlcyQxLmJyYWNlTCk7XG4gIHRoaXMubGFiZWxzLnB1c2goc3dpdGNoTGFiZWwpO1xuICB0aGlzLmVudGVyU2NvcGUoMCk7XG5cbiAgLy8gU3RhdGVtZW50cyB1bmRlciBtdXN0IGJlIGdyb3VwZWQgKGJ5IGxhYmVsKSBpbiBTd2l0Y2hDYXNlXG4gIC8vIG5vZGVzLiBgY3VyYCBpcyB1c2VkIHRvIGtlZXAgdGhlIG5vZGUgdGhhdCB3ZSBhcmUgY3VycmVudGx5XG4gIC8vIGFkZGluZyBzdGF0ZW1lbnRzIHRvLlxuXG4gIHZhciBjdXI7XG4gIGZvciAodmFyIHNhd0RlZmF1bHQgPSBmYWxzZTsgdGhpcy50eXBlICE9PSB0eXBlcyQxLmJyYWNlUjspIHtcbiAgICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLl9jYXNlIHx8IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5fZGVmYXVsdCkge1xuICAgICAgdmFyIGlzQ2FzZSA9IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5fY2FzZTtcbiAgICAgIGlmIChjdXIpIHsgdGhpcy5maW5pc2hOb2RlKGN1ciwgXCJTd2l0Y2hDYXNlXCIpOyB9XG4gICAgICBub2RlLmNhc2VzLnB1c2goY3VyID0gdGhpcy5zdGFydE5vZGUoKSk7XG4gICAgICBjdXIuY29uc2VxdWVudCA9IFtdO1xuICAgICAgdGhpcy5uZXh0KCk7XG4gICAgICBpZiAoaXNDYXNlKSB7XG4gICAgICAgIGN1ci50ZXN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChzYXdEZWZhdWx0KSB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZSh0aGlzLmxhc3RUb2tTdGFydCwgXCJNdWx0aXBsZSBkZWZhdWx0IGNsYXVzZXNcIik7IH1cbiAgICAgICAgc2F3RGVmYXVsdCA9IHRydWU7XG4gICAgICAgIGN1ci50ZXN0ID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIHRoaXMuZXhwZWN0KHR5cGVzJDEuY29sb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIWN1cikgeyB0aGlzLnVuZXhwZWN0ZWQoKTsgfVxuICAgICAgY3VyLmNvbnNlcXVlbnQucHVzaCh0aGlzLnBhcnNlU3RhdGVtZW50KG51bGwpKTtcbiAgICB9XG4gIH1cbiAgdGhpcy5leGl0U2NvcGUoKTtcbiAgaWYgKGN1cikgeyB0aGlzLmZpbmlzaE5vZGUoY3VyLCBcIlN3aXRjaENhc2VcIik7IH1cbiAgdGhpcy5uZXh0KCk7IC8vIENsb3NpbmcgYnJhY2VcbiAgdGhpcy5sYWJlbHMucG9wKCk7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJTd2l0Y2hTdGF0ZW1lbnRcIilcbn07XG5cbnBwJDgucGFyc2VUaHJvd1N0YXRlbWVudCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgdGhpcy5uZXh0KCk7XG4gIGlmIChsaW5lQnJlYWsudGVzdCh0aGlzLmlucHV0LnNsaWNlKHRoaXMubGFzdFRva0VuZCwgdGhpcy5zdGFydCkpKVxuICAgIHsgdGhpcy5yYWlzZSh0aGlzLmxhc3RUb2tFbmQsIFwiSWxsZWdhbCBuZXdsaW5lIGFmdGVyIHRocm93XCIpOyB9XG4gIG5vZGUuYXJndW1lbnQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICB0aGlzLnNlbWljb2xvbigpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiVGhyb3dTdGF0ZW1lbnRcIilcbn07XG5cbi8vIFJldXNlZCBlbXB0eSBhcnJheSBhZGRlZCBmb3Igbm9kZSBmaWVsZHMgdGhhdCBhcmUgYWx3YXlzIGVtcHR5LlxuXG52YXIgZW1wdHkkMSA9IFtdO1xuXG5wcCQ4LnBhcnNlQ2F0Y2hDbGF1c2VQYXJhbSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcGFyYW0gPSB0aGlzLnBhcnNlQmluZGluZ0F0b20oKTtcbiAgdmFyIHNpbXBsZSA9IHBhcmFtLnR5cGUgPT09IFwiSWRlbnRpZmllclwiO1xuICB0aGlzLmVudGVyU2NvcGUoc2ltcGxlID8gU0NPUEVfU0lNUExFX0NBVENIIDogMCk7XG4gIHRoaXMuY2hlY2tMVmFsUGF0dGVybihwYXJhbSwgc2ltcGxlID8gQklORF9TSU1QTEVfQ0FUQ0ggOiBCSU5EX0xFWElDQUwpO1xuICB0aGlzLmV4cGVjdCh0eXBlcyQxLnBhcmVuUik7XG5cbiAgcmV0dXJuIHBhcmFtXG59O1xuXG5wcCQ4LnBhcnNlVHJ5U3RhdGVtZW50ID0gZnVuY3Rpb24obm9kZSkge1xuICB0aGlzLm5leHQoKTtcbiAgbm9kZS5ibG9jayA9IHRoaXMucGFyc2VCbG9jaygpO1xuICBub2RlLmhhbmRsZXIgPSBudWxsO1xuICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLl9jYXRjaCkge1xuICAgIHZhciBjbGF1c2UgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICAgIHRoaXMubmV4dCgpO1xuICAgIGlmICh0aGlzLmVhdCh0eXBlcyQxLnBhcmVuTCkpIHtcbiAgICAgIGNsYXVzZS5wYXJhbSA9IHRoaXMucGFyc2VDYXRjaENsYXVzZVBhcmFtKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPCAxMCkgeyB0aGlzLnVuZXhwZWN0ZWQoKTsgfVxuICAgICAgY2xhdXNlLnBhcmFtID0gbnVsbDtcbiAgICAgIHRoaXMuZW50ZXJTY29wZSgwKTtcbiAgICB9XG4gICAgY2xhdXNlLmJvZHkgPSB0aGlzLnBhcnNlQmxvY2soZmFsc2UpO1xuICAgIHRoaXMuZXhpdFNjb3BlKCk7XG4gICAgbm9kZS5oYW5kbGVyID0gdGhpcy5maW5pc2hOb2RlKGNsYXVzZSwgXCJDYXRjaENsYXVzZVwiKTtcbiAgfVxuICBub2RlLmZpbmFsaXplciA9IHRoaXMuZWF0KHR5cGVzJDEuX2ZpbmFsbHkpID8gdGhpcy5wYXJzZUJsb2NrKCkgOiBudWxsO1xuICBpZiAoIW5vZGUuaGFuZGxlciAmJiAhbm9kZS5maW5hbGl6ZXIpXG4gICAgeyB0aGlzLnJhaXNlKG5vZGUuc3RhcnQsIFwiTWlzc2luZyBjYXRjaCBvciBmaW5hbGx5IGNsYXVzZVwiKTsgfVxuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiVHJ5U3RhdGVtZW50XCIpXG59O1xuXG5wcCQ4LnBhcnNlVmFyU3RhdGVtZW50ID0gZnVuY3Rpb24obm9kZSwga2luZCwgYWxsb3dNaXNzaW5nSW5pdGlhbGl6ZXIpIHtcbiAgdGhpcy5uZXh0KCk7XG4gIHRoaXMucGFyc2VWYXIobm9kZSwgZmFsc2UsIGtpbmQsIGFsbG93TWlzc2luZ0luaXRpYWxpemVyKTtcbiAgdGhpcy5zZW1pY29sb24oKTtcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIilcbn07XG5cbnBwJDgucGFyc2VXaGlsZVN0YXRlbWVudCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgdGhpcy5uZXh0KCk7XG4gIG5vZGUudGVzdCA9IHRoaXMucGFyc2VQYXJlbkV4cHJlc3Npb24oKTtcbiAgdGhpcy5sYWJlbHMucHVzaChsb29wTGFiZWwpO1xuICBub2RlLmJvZHkgPSB0aGlzLnBhcnNlU3RhdGVtZW50KFwid2hpbGVcIik7XG4gIHRoaXMubGFiZWxzLnBvcCgpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiV2hpbGVTdGF0ZW1lbnRcIilcbn07XG5cbnBwJDgucGFyc2VXaXRoU3RhdGVtZW50ID0gZnVuY3Rpb24obm9kZSkge1xuICBpZiAodGhpcy5zdHJpY3QpIHsgdGhpcy5yYWlzZSh0aGlzLnN0YXJ0LCBcIid3aXRoJyBpbiBzdHJpY3QgbW9kZVwiKTsgfVxuICB0aGlzLm5leHQoKTtcbiAgbm9kZS5vYmplY3QgPSB0aGlzLnBhcnNlUGFyZW5FeHByZXNzaW9uKCk7XG4gIG5vZGUuYm9keSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoXCJ3aXRoXCIpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiV2l0aFN0YXRlbWVudFwiKVxufTtcblxucHAkOC5wYXJzZUVtcHR5U3RhdGVtZW50ID0gZnVuY3Rpb24obm9kZSkge1xuICB0aGlzLm5leHQoKTtcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIkVtcHR5U3RhdGVtZW50XCIpXG59O1xuXG5wcCQ4LnBhcnNlTGFiZWxlZFN0YXRlbWVudCA9IGZ1bmN0aW9uKG5vZGUsIG1heWJlTmFtZSwgZXhwciwgY29udGV4dCkge1xuICBmb3IgKHZhciBpJDEgPSAwLCBsaXN0ID0gdGhpcy5sYWJlbHM7IGkkMSA8IGxpc3QubGVuZ3RoOyBpJDEgKz0gMSlcbiAgICB7XG4gICAgdmFyIGxhYmVsID0gbGlzdFtpJDFdO1xuXG4gICAgaWYgKGxhYmVsLm5hbWUgPT09IG1heWJlTmFtZSlcbiAgICAgIHsgdGhpcy5yYWlzZShleHByLnN0YXJ0LCBcIkxhYmVsICdcIiArIG1heWJlTmFtZSArIFwiJyBpcyBhbHJlYWR5IGRlY2xhcmVkXCIpO1xuICB9IH1cbiAgdmFyIGtpbmQgPSB0aGlzLnR5cGUuaXNMb29wID8gXCJsb29wXCIgOiB0aGlzLnR5cGUgPT09IHR5cGVzJDEuX3N3aXRjaCA/IFwic3dpdGNoXCIgOiBudWxsO1xuICBmb3IgKHZhciBpID0gdGhpcy5sYWJlbHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgbGFiZWwkMSA9IHRoaXMubGFiZWxzW2ldO1xuICAgIGlmIChsYWJlbCQxLnN0YXRlbWVudFN0YXJ0ID09PSBub2RlLnN0YXJ0KSB7XG4gICAgICAvLyBVcGRhdGUgaW5mb3JtYXRpb24gYWJvdXQgcHJldmlvdXMgbGFiZWxzIG9uIHRoaXMgbm9kZVxuICAgICAgbGFiZWwkMS5zdGF0ZW1lbnRTdGFydCA9IHRoaXMuc3RhcnQ7XG4gICAgICBsYWJlbCQxLmtpbmQgPSBraW5kO1xuICAgIH0gZWxzZSB7IGJyZWFrIH1cbiAgfVxuICB0aGlzLmxhYmVscy5wdXNoKHtuYW1lOiBtYXliZU5hbWUsIGtpbmQ6IGtpbmQsIHN0YXRlbWVudFN0YXJ0OiB0aGlzLnN0YXJ0fSk7XG4gIG5vZGUuYm9keSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoY29udGV4dCA/IGNvbnRleHQuaW5kZXhPZihcImxhYmVsXCIpID09PSAtMSA/IGNvbnRleHQgKyBcImxhYmVsXCIgOiBjb250ZXh0IDogXCJsYWJlbFwiKTtcbiAgdGhpcy5sYWJlbHMucG9wKCk7XG4gIG5vZGUubGFiZWwgPSBleHByO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiTGFiZWxlZFN0YXRlbWVudFwiKVxufTtcblxucHAkOC5wYXJzZUV4cHJlc3Npb25TdGF0ZW1lbnQgPSBmdW5jdGlvbihub2RlLCBleHByKSB7XG4gIG5vZGUuZXhwcmVzc2lvbiA9IGV4cHI7XG4gIHRoaXMuc2VtaWNvbG9uKCk7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJFeHByZXNzaW9uU3RhdGVtZW50XCIpXG59O1xuXG4vLyBQYXJzZSBhIHNlbWljb2xvbi1lbmNsb3NlZCBibG9jayBvZiBzdGF0ZW1lbnRzLCBoYW5kbGluZyBgXCJ1c2Vcbi8vIHN0cmljdFwiYCBkZWNsYXJhdGlvbnMgd2hlbiBgYWxsb3dTdHJpY3RgIGlzIHRydWUgKHVzZWQgZm9yXG4vLyBmdW5jdGlvbiBib2RpZXMpLlxuXG5wcCQ4LnBhcnNlQmxvY2sgPSBmdW5jdGlvbihjcmVhdGVOZXdMZXhpY2FsU2NvcGUsIG5vZGUsIGV4aXRTdHJpY3QpIHtcbiAgaWYgKCBjcmVhdGVOZXdMZXhpY2FsU2NvcGUgPT09IHZvaWQgMCApIGNyZWF0ZU5ld0xleGljYWxTY29wZSA9IHRydWU7XG4gIGlmICggbm9kZSA9PT0gdm9pZCAwICkgbm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG5cbiAgbm9kZS5ib2R5ID0gW107XG4gIHRoaXMuZXhwZWN0KHR5cGVzJDEuYnJhY2VMKTtcbiAgaWYgKGNyZWF0ZU5ld0xleGljYWxTY29wZSkgeyB0aGlzLmVudGVyU2NvcGUoMCk7IH1cbiAgd2hpbGUgKHRoaXMudHlwZSAhPT0gdHlwZXMkMS5icmFjZVIpIHtcbiAgICB2YXIgc3RtdCA9IHRoaXMucGFyc2VTdGF0ZW1lbnQobnVsbCk7XG4gICAgbm9kZS5ib2R5LnB1c2goc3RtdCk7XG4gIH1cbiAgaWYgKGV4aXRTdHJpY3QpIHsgdGhpcy5zdHJpY3QgPSBmYWxzZTsgfVxuICB0aGlzLm5leHQoKTtcbiAgaWYgKGNyZWF0ZU5ld0xleGljYWxTY29wZSkgeyB0aGlzLmV4aXRTY29wZSgpOyB9XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJCbG9ja1N0YXRlbWVudFwiKVxufTtcblxuLy8gUGFyc2UgYSByZWd1bGFyIGBmb3JgIGxvb3AuIFRoZSBkaXNhbWJpZ3VhdGlvbiBjb2RlIGluXG4vLyBgcGFyc2VTdGF0ZW1lbnRgIHdpbGwgYWxyZWFkeSBoYXZlIHBhcnNlZCB0aGUgaW5pdCBzdGF0ZW1lbnQgb3Jcbi8vIGV4cHJlc3Npb24uXG5cbnBwJDgucGFyc2VGb3IgPSBmdW5jdGlvbihub2RlLCBpbml0KSB7XG4gIG5vZGUuaW5pdCA9IGluaXQ7XG4gIHRoaXMuZXhwZWN0KHR5cGVzJDEuc2VtaSk7XG4gIG5vZGUudGVzdCA9IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5zZW1pID8gbnVsbCA6IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gIHRoaXMuZXhwZWN0KHR5cGVzJDEuc2VtaSk7XG4gIG5vZGUudXBkYXRlID0gdGhpcy50eXBlID09PSB0eXBlcyQxLnBhcmVuUiA/IG51bGwgOiB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICB0aGlzLmV4cGVjdCh0eXBlcyQxLnBhcmVuUik7XG4gIG5vZGUuYm9keSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoXCJmb3JcIik7XG4gIHRoaXMuZXhpdFNjb3BlKCk7XG4gIHRoaXMubGFiZWxzLnBvcCgpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiRm9yU3RhdGVtZW50XCIpXG59O1xuXG4vLyBQYXJzZSBhIGBmb3JgL2BpbmAgYW5kIGBmb3JgL2BvZmAgbG9vcCwgd2hpY2ggYXJlIGFsbW9zdFxuLy8gc2FtZSBmcm9tIHBhcnNlcidzIHBlcnNwZWN0aXZlLlxuXG5wcCQ4LnBhcnNlRm9ySW4gPSBmdW5jdGlvbihub2RlLCBpbml0KSB7XG4gIHZhciBpc0ZvckluID0gdGhpcy50eXBlID09PSB0eXBlcyQxLl9pbjtcbiAgdGhpcy5uZXh0KCk7XG5cbiAgaWYgKFxuICAgIGluaXQudHlwZSA9PT0gXCJWYXJpYWJsZURlY2xhcmF0aW9uXCIgJiZcbiAgICBpbml0LmRlY2xhcmF0aW9uc1swXS5pbml0ICE9IG51bGwgJiZcbiAgICAoXG4gICAgICAhaXNGb3JJbiB8fFxuICAgICAgdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uIDwgOCB8fFxuICAgICAgdGhpcy5zdHJpY3QgfHxcbiAgICAgIGluaXQua2luZCAhPT0gXCJ2YXJcIiB8fFxuICAgICAgaW5pdC5kZWNsYXJhdGlvbnNbMF0uaWQudHlwZSAhPT0gXCJJZGVudGlmaWVyXCJcbiAgICApXG4gICkge1xuICAgIHRoaXMucmFpc2UoXG4gICAgICBpbml0LnN0YXJ0LFxuICAgICAgKChpc0ZvckluID8gXCJmb3ItaW5cIiA6IFwiZm9yLW9mXCIpICsgXCIgbG9vcCB2YXJpYWJsZSBkZWNsYXJhdGlvbiBtYXkgbm90IGhhdmUgYW4gaW5pdGlhbGl6ZXJcIilcbiAgICApO1xuICB9XG4gIG5vZGUubGVmdCA9IGluaXQ7XG4gIG5vZGUucmlnaHQgPSBpc0ZvckluID8gdGhpcy5wYXJzZUV4cHJlc3Npb24oKSA6IHRoaXMucGFyc2VNYXliZUFzc2lnbigpO1xuICB0aGlzLmV4cGVjdCh0eXBlcyQxLnBhcmVuUik7XG4gIG5vZGUuYm9keSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoXCJmb3JcIik7XG4gIHRoaXMuZXhpdFNjb3BlKCk7XG4gIHRoaXMubGFiZWxzLnBvcCgpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIGlzRm9ySW4gPyBcIkZvckluU3RhdGVtZW50XCIgOiBcIkZvck9mU3RhdGVtZW50XCIpXG59O1xuXG4vLyBQYXJzZSBhIGxpc3Qgb2YgdmFyaWFibGUgZGVjbGFyYXRpb25zLlxuXG5wcCQ4LnBhcnNlVmFyID0gZnVuY3Rpb24obm9kZSwgaXNGb3IsIGtpbmQsIGFsbG93TWlzc2luZ0luaXRpYWxpemVyKSB7XG4gIG5vZGUuZGVjbGFyYXRpb25zID0gW107XG4gIG5vZGUua2luZCA9IGtpbmQ7XG4gIGZvciAoOzspIHtcbiAgICB2YXIgZGVjbCA9IHRoaXMuc3RhcnROb2RlKCk7XG4gICAgdGhpcy5wYXJzZVZhcklkKGRlY2wsIGtpbmQpO1xuICAgIGlmICh0aGlzLmVhdCh0eXBlcyQxLmVxKSkge1xuICAgICAgZGVjbC5pbml0ID0gdGhpcy5wYXJzZU1heWJlQXNzaWduKGlzRm9yKTtcbiAgICB9IGVsc2UgaWYgKCFhbGxvd01pc3NpbmdJbml0aWFsaXplciAmJiBraW5kID09PSBcImNvbnN0XCIgJiYgISh0aGlzLnR5cGUgPT09IHR5cGVzJDEuX2luIHx8ICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNiAmJiB0aGlzLmlzQ29udGV4dHVhbChcIm9mXCIpKSkpIHtcbiAgICAgIHRoaXMudW5leHBlY3RlZCgpO1xuICAgIH0gZWxzZSBpZiAoIWFsbG93TWlzc2luZ0luaXRpYWxpemVyICYmIChraW5kID09PSBcInVzaW5nXCIgfHwga2luZCA9PT0gXCJhd2FpdCB1c2luZ1wiKSAmJiB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTcgJiYgdGhpcy50eXBlICE9PSB0eXBlcyQxLl9pbiAmJiAhdGhpcy5pc0NvbnRleHR1YWwoXCJvZlwiKSkge1xuICAgICAgdGhpcy5yYWlzZSh0aGlzLmxhc3RUb2tFbmQsIChcIk1pc3NpbmcgaW5pdGlhbGl6ZXIgaW4gXCIgKyBraW5kICsgXCIgZGVjbGFyYXRpb25cIikpO1xuICAgIH0gZWxzZSBpZiAoIWFsbG93TWlzc2luZ0luaXRpYWxpemVyICYmIGRlY2wuaWQudHlwZSAhPT0gXCJJZGVudGlmaWVyXCIgJiYgIShpc0ZvciAmJiAodGhpcy50eXBlID09PSB0eXBlcyQxLl9pbiB8fCB0aGlzLmlzQ29udGV4dHVhbChcIm9mXCIpKSkpIHtcbiAgICAgIHRoaXMucmFpc2UodGhpcy5sYXN0VG9rRW5kLCBcIkNvbXBsZXggYmluZGluZyBwYXR0ZXJucyByZXF1aXJlIGFuIGluaXRpYWxpemF0aW9uIHZhbHVlXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWNsLmluaXQgPSBudWxsO1xuICAgIH1cbiAgICBub2RlLmRlY2xhcmF0aW9ucy5wdXNoKHRoaXMuZmluaXNoTm9kZShkZWNsLCBcIlZhcmlhYmxlRGVjbGFyYXRvclwiKSk7XG4gICAgaWYgKCF0aGlzLmVhdCh0eXBlcyQxLmNvbW1hKSkgeyBicmVhayB9XG4gIH1cbiAgcmV0dXJuIG5vZGVcbn07XG5cbnBwJDgucGFyc2VWYXJJZCA9IGZ1bmN0aW9uKGRlY2wsIGtpbmQpIHtcbiAgZGVjbC5pZCA9IGtpbmQgPT09IFwidXNpbmdcIiB8fCBraW5kID09PSBcImF3YWl0IHVzaW5nXCJcbiAgICA/IHRoaXMucGFyc2VJZGVudCgpXG4gICAgOiB0aGlzLnBhcnNlQmluZGluZ0F0b20oKTtcblxuICB0aGlzLmNoZWNrTFZhbFBhdHRlcm4oZGVjbC5pZCwga2luZCA9PT0gXCJ2YXJcIiA/IEJJTkRfVkFSIDogQklORF9MRVhJQ0FMLCBmYWxzZSk7XG59O1xuXG52YXIgRlVOQ19TVEFURU1FTlQgPSAxLCBGVU5DX0hBTkdJTkdfU1RBVEVNRU5UID0gMiwgRlVOQ19OVUxMQUJMRV9JRCA9IDQ7XG5cbi8vIFBhcnNlIGEgZnVuY3Rpb24gZGVjbGFyYXRpb24gb3IgbGl0ZXJhbCAoZGVwZW5kaW5nIG9uIHRoZVxuLy8gYHN0YXRlbWVudCAmIEZVTkNfU1RBVEVNRU5UYCkuXG5cbi8vIFJlbW92ZSBgYWxsb3dFeHByZXNzaW9uQm9keWAgZm9yIDcuMC4wLCBhcyBpdCBpcyBvbmx5IGNhbGxlZCB3aXRoIGZhbHNlXG5wcCQ4LnBhcnNlRnVuY3Rpb24gPSBmdW5jdGlvbihub2RlLCBzdGF0ZW1lbnQsIGFsbG93RXhwcmVzc2lvbkJvZHksIGlzQXN5bmMsIGZvckluaXQpIHtcbiAgdGhpcy5pbml0RnVuY3Rpb24obm9kZSk7XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOSB8fCB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNiAmJiAhaXNBc3luYykge1xuICAgIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuc3RhciAmJiAoc3RhdGVtZW50ICYgRlVOQ19IQU5HSU5HX1NUQVRFTUVOVCkpXG4gICAgICB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gICAgbm9kZS5nZW5lcmF0b3IgPSB0aGlzLmVhdCh0eXBlcyQxLnN0YXIpO1xuICB9XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOClcbiAgICB7IG5vZGUuYXN5bmMgPSAhIWlzQXN5bmM7IH1cblxuICBpZiAoc3RhdGVtZW50ICYgRlVOQ19TVEFURU1FTlQpIHtcbiAgICBub2RlLmlkID0gKHN0YXRlbWVudCAmIEZVTkNfTlVMTEFCTEVfSUQpICYmIHRoaXMudHlwZSAhPT0gdHlwZXMkMS5uYW1lID8gbnVsbCA6IHRoaXMucGFyc2VJZGVudCgpO1xuICAgIGlmIChub2RlLmlkICYmICEoc3RhdGVtZW50ICYgRlVOQ19IQU5HSU5HX1NUQVRFTUVOVCkpXG4gICAgICAvLyBJZiBpdCBpcyBhIHJlZ3VsYXIgZnVuY3Rpb24gZGVjbGFyYXRpb24gaW4gc2xvcHB5IG1vZGUsIHRoZW4gaXQgaXNcbiAgICAgIC8vIHN1YmplY3QgdG8gQW5uZXggQiBzZW1hbnRpY3MgKEJJTkRfRlVOQ1RJT04pLiBPdGhlcndpc2UsIHRoZSBiaW5kaW5nXG4gICAgICAvLyBtb2RlIGRlcGVuZHMgb24gcHJvcGVydGllcyBvZiB0aGUgY3VycmVudCBzY29wZSAoc2VlXG4gICAgICAvLyB0cmVhdEZ1bmN0aW9uc0FzVmFyKS5cbiAgICAgIHsgdGhpcy5jaGVja0xWYWxTaW1wbGUobm9kZS5pZCwgKHRoaXMuc3RyaWN0IHx8IG5vZGUuZ2VuZXJhdG9yIHx8IG5vZGUuYXN5bmMpID8gdGhpcy50cmVhdEZ1bmN0aW9uc0FzVmFyID8gQklORF9WQVIgOiBCSU5EX0xFWElDQUwgOiBCSU5EX0ZVTkNUSU9OKTsgfVxuICB9XG5cbiAgdmFyIG9sZFlpZWxkUG9zID0gdGhpcy55aWVsZFBvcywgb2xkQXdhaXRQb3MgPSB0aGlzLmF3YWl0UG9zLCBvbGRBd2FpdElkZW50UG9zID0gdGhpcy5hd2FpdElkZW50UG9zO1xuICB0aGlzLnlpZWxkUG9zID0gMDtcbiAgdGhpcy5hd2FpdFBvcyA9IDA7XG4gIHRoaXMuYXdhaXRJZGVudFBvcyA9IDA7XG4gIHRoaXMuZW50ZXJTY29wZShmdW5jdGlvbkZsYWdzKG5vZGUuYXN5bmMsIG5vZGUuZ2VuZXJhdG9yKSk7XG5cbiAgaWYgKCEoc3RhdGVtZW50ICYgRlVOQ19TVEFURU1FTlQpKVxuICAgIHsgbm9kZS5pZCA9IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5uYW1lID8gdGhpcy5wYXJzZUlkZW50KCkgOiBudWxsOyB9XG5cbiAgdGhpcy5wYXJzZUZ1bmN0aW9uUGFyYW1zKG5vZGUpO1xuICB0aGlzLnBhcnNlRnVuY3Rpb25Cb2R5KG5vZGUsIGFsbG93RXhwcmVzc2lvbkJvZHksIGZhbHNlLCBmb3JJbml0KTtcblxuICB0aGlzLnlpZWxkUG9zID0gb2xkWWllbGRQb3M7XG4gIHRoaXMuYXdhaXRQb3MgPSBvbGRBd2FpdFBvcztcbiAgdGhpcy5hd2FpdElkZW50UG9zID0gb2xkQXdhaXRJZGVudFBvcztcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCAoc3RhdGVtZW50ICYgRlVOQ19TVEFURU1FTlQpID8gXCJGdW5jdGlvbkRlY2xhcmF0aW9uXCIgOiBcIkZ1bmN0aW9uRXhwcmVzc2lvblwiKVxufTtcblxucHAkOC5wYXJzZUZ1bmN0aW9uUGFyYW1zID0gZnVuY3Rpb24obm9kZSkge1xuICB0aGlzLmV4cGVjdCh0eXBlcyQxLnBhcmVuTCk7XG4gIG5vZGUucGFyYW1zID0gdGhpcy5wYXJzZUJpbmRpbmdMaXN0KHR5cGVzJDEucGFyZW5SLCBmYWxzZSwgdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDgpO1xuICB0aGlzLmNoZWNrWWllbGRBd2FpdEluRGVmYXVsdFBhcmFtcygpO1xufTtcblxuLy8gUGFyc2UgYSBjbGFzcyBkZWNsYXJhdGlvbiBvciBsaXRlcmFsIChkZXBlbmRpbmcgb24gdGhlXG4vLyBgaXNTdGF0ZW1lbnRgIHBhcmFtZXRlcikuXG5cbnBwJDgucGFyc2VDbGFzcyA9IGZ1bmN0aW9uKG5vZGUsIGlzU3RhdGVtZW50KSB7XG4gIHRoaXMubmV4dCgpO1xuXG4gIC8vIGVjbWEtMjYyIDE0LjYgQ2xhc3MgRGVmaW5pdGlvbnNcbiAgLy8gQSBjbGFzcyBkZWZpbml0aW9uIGlzIGFsd2F5cyBzdHJpY3QgbW9kZSBjb2RlLlxuICB2YXIgb2xkU3RyaWN0ID0gdGhpcy5zdHJpY3Q7XG4gIHRoaXMuc3RyaWN0ID0gdHJ1ZTtcblxuICB0aGlzLnBhcnNlQ2xhc3NJZChub2RlLCBpc1N0YXRlbWVudCk7XG4gIHRoaXMucGFyc2VDbGFzc1N1cGVyKG5vZGUpO1xuICB2YXIgcHJpdmF0ZU5hbWVNYXAgPSB0aGlzLmVudGVyQ2xhc3NCb2R5KCk7XG4gIHZhciBjbGFzc0JvZHkgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICB2YXIgaGFkQ29uc3RydWN0b3IgPSBmYWxzZTtcbiAgY2xhc3NCb2R5LmJvZHkgPSBbXTtcbiAgdGhpcy5leHBlY3QodHlwZXMkMS5icmFjZUwpO1xuICB3aGlsZSAodGhpcy50eXBlICE9PSB0eXBlcyQxLmJyYWNlUikge1xuICAgIHZhciBlbGVtZW50ID0gdGhpcy5wYXJzZUNsYXNzRWxlbWVudChub2RlLnN1cGVyQ2xhc3MgIT09IG51bGwpO1xuICAgIGlmIChlbGVtZW50KSB7XG4gICAgICBjbGFzc0JvZHkuYm9keS5wdXNoKGVsZW1lbnQpO1xuICAgICAgaWYgKGVsZW1lbnQudHlwZSA9PT0gXCJNZXRob2REZWZpbml0aW9uXCIgJiYgZWxlbWVudC5raW5kID09PSBcImNvbnN0cnVjdG9yXCIpIHtcbiAgICAgICAgaWYgKGhhZENvbnN0cnVjdG9yKSB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShlbGVtZW50LnN0YXJ0LCBcIkR1cGxpY2F0ZSBjb25zdHJ1Y3RvciBpbiB0aGUgc2FtZSBjbGFzc1wiKTsgfVxuICAgICAgICBoYWRDb25zdHJ1Y3RvciA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGVsZW1lbnQua2V5ICYmIGVsZW1lbnQua2V5LnR5cGUgPT09IFwiUHJpdmF0ZUlkZW50aWZpZXJcIiAmJiBpc1ByaXZhdGVOYW1lQ29uZmxpY3RlZChwcml2YXRlTmFtZU1hcCwgZWxlbWVudCkpIHtcbiAgICAgICAgdGhpcy5yYWlzZVJlY292ZXJhYmxlKGVsZW1lbnQua2V5LnN0YXJ0LCAoXCJJZGVudGlmaWVyICcjXCIgKyAoZWxlbWVudC5rZXkubmFtZSkgKyBcIicgaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHRoaXMuc3RyaWN0ID0gb2xkU3RyaWN0O1xuICB0aGlzLm5leHQoKTtcbiAgbm9kZS5ib2R5ID0gdGhpcy5maW5pc2hOb2RlKGNsYXNzQm9keSwgXCJDbGFzc0JvZHlcIik7XG4gIHRoaXMuZXhpdENsYXNzQm9keSgpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIGlzU3RhdGVtZW50ID8gXCJDbGFzc0RlY2xhcmF0aW9uXCIgOiBcIkNsYXNzRXhwcmVzc2lvblwiKVxufTtcblxucHAkOC5wYXJzZUNsYXNzRWxlbWVudCA9IGZ1bmN0aW9uKGNvbnN0cnVjdG9yQWxsb3dzU3VwZXIpIHtcbiAgaWYgKHRoaXMuZWF0KHR5cGVzJDEuc2VtaSkpIHsgcmV0dXJuIG51bGwgfVxuXG4gIHZhciBlY21hVmVyc2lvbiA9IHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbjtcbiAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICB2YXIga2V5TmFtZSA9IFwiXCI7XG4gIHZhciBpc0dlbmVyYXRvciA9IGZhbHNlO1xuICB2YXIgaXNBc3luYyA9IGZhbHNlO1xuICB2YXIga2luZCA9IFwibWV0aG9kXCI7XG4gIHZhciBpc1N0YXRpYyA9IGZhbHNlO1xuXG4gIGlmICh0aGlzLmVhdENvbnRleHR1YWwoXCJzdGF0aWNcIikpIHtcbiAgICAvLyBQYXJzZSBzdGF0aWMgaW5pdCBibG9ja1xuICAgIGlmIChlY21hVmVyc2lvbiA+PSAxMyAmJiB0aGlzLmVhdCh0eXBlcyQxLmJyYWNlTCkpIHtcbiAgICAgIHRoaXMucGFyc2VDbGFzc1N0YXRpY0Jsb2NrKG5vZGUpO1xuICAgICAgcmV0dXJuIG5vZGVcbiAgICB9XG4gICAgaWYgKHRoaXMuaXNDbGFzc0VsZW1lbnROYW1lU3RhcnQoKSB8fCB0aGlzLnR5cGUgPT09IHR5cGVzJDEuc3Rhcikge1xuICAgICAgaXNTdGF0aWMgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXlOYW1lID0gXCJzdGF0aWNcIjtcbiAgICB9XG4gIH1cbiAgbm9kZS5zdGF0aWMgPSBpc1N0YXRpYztcbiAgaWYgKCFrZXlOYW1lICYmIGVjbWFWZXJzaW9uID49IDggJiYgdGhpcy5lYXRDb250ZXh0dWFsKFwiYXN5bmNcIikpIHtcbiAgICBpZiAoKHRoaXMuaXNDbGFzc0VsZW1lbnROYW1lU3RhcnQoKSB8fCB0aGlzLnR5cGUgPT09IHR5cGVzJDEuc3RhcikgJiYgIXRoaXMuY2FuSW5zZXJ0U2VtaWNvbG9uKCkpIHtcbiAgICAgIGlzQXN5bmMgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXlOYW1lID0gXCJhc3luY1wiO1xuICAgIH1cbiAgfVxuICBpZiAoIWtleU5hbWUgJiYgKGVjbWFWZXJzaW9uID49IDkgfHwgIWlzQXN5bmMpICYmIHRoaXMuZWF0KHR5cGVzJDEuc3RhcikpIHtcbiAgICBpc0dlbmVyYXRvciA9IHRydWU7XG4gIH1cbiAgaWYgKCFrZXlOYW1lICYmICFpc0FzeW5jICYmICFpc0dlbmVyYXRvcikge1xuICAgIHZhciBsYXN0VmFsdWUgPSB0aGlzLnZhbHVlO1xuICAgIGlmICh0aGlzLmVhdENvbnRleHR1YWwoXCJnZXRcIikgfHwgdGhpcy5lYXRDb250ZXh0dWFsKFwic2V0XCIpKSB7XG4gICAgICBpZiAodGhpcy5pc0NsYXNzRWxlbWVudE5hbWVTdGFydCgpKSB7XG4gICAgICAgIGtpbmQgPSBsYXN0VmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBrZXlOYW1lID0gbGFzdFZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFBhcnNlIGVsZW1lbnQgbmFtZVxuICBpZiAoa2V5TmFtZSkge1xuICAgIC8vICdhc3luYycsICdnZXQnLCAnc2V0Jywgb3IgJ3N0YXRpYycgd2VyZSBub3QgYSBrZXl3b3JkIGNvbnRleHR1YWxseS5cbiAgICAvLyBUaGUgbGFzdCB0b2tlbiBpcyBhbnkgb2YgdGhvc2UuIE1ha2UgaXQgdGhlIGVsZW1lbnQgbmFtZS5cbiAgICBub2RlLmNvbXB1dGVkID0gZmFsc2U7XG4gICAgbm9kZS5rZXkgPSB0aGlzLnN0YXJ0Tm9kZUF0KHRoaXMubGFzdFRva1N0YXJ0LCB0aGlzLmxhc3RUb2tTdGFydExvYyk7XG4gICAgbm9kZS5rZXkubmFtZSA9IGtleU5hbWU7XG4gICAgdGhpcy5maW5pc2hOb2RlKG5vZGUua2V5LCBcIklkZW50aWZpZXJcIik7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5wYXJzZUNsYXNzRWxlbWVudE5hbWUobm9kZSk7XG4gIH1cblxuICAvLyBQYXJzZSBlbGVtZW50IHZhbHVlXG4gIGlmIChlY21hVmVyc2lvbiA8IDEzIHx8IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5wYXJlbkwgfHwga2luZCAhPT0gXCJtZXRob2RcIiB8fCBpc0dlbmVyYXRvciB8fCBpc0FzeW5jKSB7XG4gICAgdmFyIGlzQ29uc3RydWN0b3IgPSAhbm9kZS5zdGF0aWMgJiYgY2hlY2tLZXlOYW1lKG5vZGUsIFwiY29uc3RydWN0b3JcIik7XG4gICAgdmFyIGFsbG93c0RpcmVjdFN1cGVyID0gaXNDb25zdHJ1Y3RvciAmJiBjb25zdHJ1Y3RvckFsbG93c1N1cGVyO1xuICAgIC8vIENvdWxkbid0IG1vdmUgdGhpcyBjaGVjayBpbnRvIHRoZSAncGFyc2VDbGFzc01ldGhvZCcgbWV0aG9kIGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5LlxuICAgIGlmIChpc0NvbnN0cnVjdG9yICYmIGtpbmQgIT09IFwibWV0aG9kXCIpIHsgdGhpcy5yYWlzZShub2RlLmtleS5zdGFydCwgXCJDb25zdHJ1Y3RvciBjYW4ndCBoYXZlIGdldC9zZXQgbW9kaWZpZXJcIik7IH1cbiAgICBub2RlLmtpbmQgPSBpc0NvbnN0cnVjdG9yID8gXCJjb25zdHJ1Y3RvclwiIDoga2luZDtcbiAgICB0aGlzLnBhcnNlQ2xhc3NNZXRob2Qobm9kZSwgaXNHZW5lcmF0b3IsIGlzQXN5bmMsIGFsbG93c0RpcmVjdFN1cGVyKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnBhcnNlQ2xhc3NGaWVsZChub2RlKTtcbiAgfVxuXG4gIHJldHVybiBub2RlXG59O1xuXG5wcCQ4LmlzQ2xhc3NFbGVtZW50TmFtZVN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAoXG4gICAgdGhpcy50eXBlID09PSB0eXBlcyQxLm5hbWUgfHxcbiAgICB0aGlzLnR5cGUgPT09IHR5cGVzJDEucHJpdmF0ZUlkIHx8XG4gICAgdGhpcy50eXBlID09PSB0eXBlcyQxLm51bSB8fFxuICAgIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5zdHJpbmcgfHxcbiAgICB0aGlzLnR5cGUgPT09IHR5cGVzJDEuYnJhY2tldEwgfHxcbiAgICB0aGlzLnR5cGUua2V5d29yZFxuICApXG59O1xuXG5wcCQ4LnBhcnNlQ2xhc3NFbGVtZW50TmFtZSA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5wcml2YXRlSWQpIHtcbiAgICBpZiAodGhpcy52YWx1ZSA9PT0gXCJjb25zdHJ1Y3RvclwiKSB7XG4gICAgICB0aGlzLnJhaXNlKHRoaXMuc3RhcnQsIFwiQ2xhc3NlcyBjYW4ndCBoYXZlIGFuIGVsZW1lbnQgbmFtZWQgJyNjb25zdHJ1Y3RvcidcIik7XG4gICAgfVxuICAgIGVsZW1lbnQuY29tcHV0ZWQgPSBmYWxzZTtcbiAgICBlbGVtZW50LmtleSA9IHRoaXMucGFyc2VQcml2YXRlSWRlbnQoKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnBhcnNlUHJvcGVydHlOYW1lKGVsZW1lbnQpO1xuICB9XG59O1xuXG5wcCQ4LnBhcnNlQ2xhc3NNZXRob2QgPSBmdW5jdGlvbihtZXRob2QsIGlzR2VuZXJhdG9yLCBpc0FzeW5jLCBhbGxvd3NEaXJlY3RTdXBlcikge1xuICAvLyBDaGVjayBrZXkgYW5kIGZsYWdzXG4gIHZhciBrZXkgPSBtZXRob2Qua2V5O1xuICBpZiAobWV0aG9kLmtpbmQgPT09IFwiY29uc3RydWN0b3JcIikge1xuICAgIGlmIChpc0dlbmVyYXRvcikgeyB0aGlzLnJhaXNlKGtleS5zdGFydCwgXCJDb25zdHJ1Y3RvciBjYW4ndCBiZSBhIGdlbmVyYXRvclwiKTsgfVxuICAgIGlmIChpc0FzeW5jKSB7IHRoaXMucmFpc2Uoa2V5LnN0YXJ0LCBcIkNvbnN0cnVjdG9yIGNhbid0IGJlIGFuIGFzeW5jIG1ldGhvZFwiKTsgfVxuICB9IGVsc2UgaWYgKG1ldGhvZC5zdGF0aWMgJiYgY2hlY2tLZXlOYW1lKG1ldGhvZCwgXCJwcm90b3R5cGVcIikpIHtcbiAgICB0aGlzLnJhaXNlKGtleS5zdGFydCwgXCJDbGFzc2VzIG1heSBub3QgaGF2ZSBhIHN0YXRpYyBwcm9wZXJ0eSBuYW1lZCBwcm90b3R5cGVcIik7XG4gIH1cblxuICAvLyBQYXJzZSB2YWx1ZVxuICB2YXIgdmFsdWUgPSBtZXRob2QudmFsdWUgPSB0aGlzLnBhcnNlTWV0aG9kKGlzR2VuZXJhdG9yLCBpc0FzeW5jLCBhbGxvd3NEaXJlY3RTdXBlcik7XG5cbiAgLy8gQ2hlY2sgdmFsdWVcbiAgaWYgKG1ldGhvZC5raW5kID09PSBcImdldFwiICYmIHZhbHVlLnBhcmFtcy5sZW5ndGggIT09IDApXG4gICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUodmFsdWUuc3RhcnQsIFwiZ2V0dGVyIHNob3VsZCBoYXZlIG5vIHBhcmFtc1wiKTsgfVxuICBpZiAobWV0aG9kLmtpbmQgPT09IFwic2V0XCIgJiYgdmFsdWUucGFyYW1zLmxlbmd0aCAhPT0gMSlcbiAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZSh2YWx1ZS5zdGFydCwgXCJzZXR0ZXIgc2hvdWxkIGhhdmUgZXhhY3RseSBvbmUgcGFyYW1cIik7IH1cbiAgaWYgKG1ldGhvZC5raW5kID09PSBcInNldFwiICYmIHZhbHVlLnBhcmFtc1swXS50eXBlID09PSBcIlJlc3RFbGVtZW50XCIpXG4gICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUodmFsdWUucGFyYW1zWzBdLnN0YXJ0LCBcIlNldHRlciBjYW5ub3QgdXNlIHJlc3QgcGFyYW1zXCIpOyB9XG5cbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShtZXRob2QsIFwiTWV0aG9kRGVmaW5pdGlvblwiKVxufTtcblxucHAkOC5wYXJzZUNsYXNzRmllbGQgPSBmdW5jdGlvbihmaWVsZCkge1xuICBpZiAoY2hlY2tLZXlOYW1lKGZpZWxkLCBcImNvbnN0cnVjdG9yXCIpKSB7XG4gICAgdGhpcy5yYWlzZShmaWVsZC5rZXkuc3RhcnQsIFwiQ2xhc3NlcyBjYW4ndCBoYXZlIGEgZmllbGQgbmFtZWQgJ2NvbnN0cnVjdG9yJ1wiKTtcbiAgfSBlbHNlIGlmIChmaWVsZC5zdGF0aWMgJiYgY2hlY2tLZXlOYW1lKGZpZWxkLCBcInByb3RvdHlwZVwiKSkge1xuICAgIHRoaXMucmFpc2UoZmllbGQua2V5LnN0YXJ0LCBcIkNsYXNzZXMgY2FuJ3QgaGF2ZSBhIHN0YXRpYyBmaWVsZCBuYW1lZCAncHJvdG90eXBlJ1wiKTtcbiAgfVxuXG4gIGlmICh0aGlzLmVhdCh0eXBlcyQxLmVxKSkge1xuICAgIC8vIFRvIHJhaXNlIFN5bnRheEVycm9yIGlmICdhcmd1bWVudHMnIGV4aXN0cyBpbiB0aGUgaW5pdGlhbGl6ZXIuXG4gICAgdGhpcy5lbnRlclNjb3BlKFNDT1BFX0NMQVNTX0ZJRUxEX0lOSVQgfCBTQ09QRV9TVVBFUik7XG4gICAgZmllbGQudmFsdWUgPSB0aGlzLnBhcnNlTWF5YmVBc3NpZ24oKTtcbiAgICB0aGlzLmV4aXRTY29wZSgpO1xuICB9IGVsc2Uge1xuICAgIGZpZWxkLnZhbHVlID0gbnVsbDtcbiAgfVxuICB0aGlzLnNlbWljb2xvbigpO1xuXG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUoZmllbGQsIFwiUHJvcGVydHlEZWZpbml0aW9uXCIpXG59O1xuXG5wcCQ4LnBhcnNlQ2xhc3NTdGF0aWNCbG9jayA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgbm9kZS5ib2R5ID0gW107XG5cbiAgdmFyIG9sZExhYmVscyA9IHRoaXMubGFiZWxzO1xuICB0aGlzLmxhYmVscyA9IFtdO1xuICB0aGlzLmVudGVyU2NvcGUoU0NPUEVfQ0xBU1NfU1RBVElDX0JMT0NLIHwgU0NPUEVfU1VQRVIpO1xuICB3aGlsZSAodGhpcy50eXBlICE9PSB0eXBlcyQxLmJyYWNlUikge1xuICAgIHZhciBzdG10ID0gdGhpcy5wYXJzZVN0YXRlbWVudChudWxsKTtcbiAgICBub2RlLmJvZHkucHVzaChzdG10KTtcbiAgfVxuICB0aGlzLm5leHQoKTtcbiAgdGhpcy5leGl0U2NvcGUoKTtcbiAgdGhpcy5sYWJlbHMgPSBvbGRMYWJlbHM7XG5cbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIlN0YXRpY0Jsb2NrXCIpXG59O1xuXG5wcCQ4LnBhcnNlQ2xhc3NJZCA9IGZ1bmN0aW9uKG5vZGUsIGlzU3RhdGVtZW50KSB7XG4gIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEubmFtZSkge1xuICAgIG5vZGUuaWQgPSB0aGlzLnBhcnNlSWRlbnQoKTtcbiAgICBpZiAoaXNTdGF0ZW1lbnQpXG4gICAgICB7IHRoaXMuY2hlY2tMVmFsU2ltcGxlKG5vZGUuaWQsIEJJTkRfTEVYSUNBTCwgZmFsc2UpOyB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGlzU3RhdGVtZW50ID09PSB0cnVlKVxuICAgICAgeyB0aGlzLnVuZXhwZWN0ZWQoKTsgfVxuICAgIG5vZGUuaWQgPSBudWxsO1xuICB9XG59O1xuXG5wcCQ4LnBhcnNlQ2xhc3NTdXBlciA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgbm9kZS5zdXBlckNsYXNzID0gdGhpcy5lYXQodHlwZXMkMS5fZXh0ZW5kcykgPyB0aGlzLnBhcnNlRXhwclN1YnNjcmlwdHMobnVsbCwgZmFsc2UpIDogbnVsbDtcbn07XG5cbnBwJDguZW50ZXJDbGFzc0JvZHkgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGVsZW1lbnQgPSB7ZGVjbGFyZWQ6IE9iamVjdC5jcmVhdGUobnVsbCksIHVzZWQ6IFtdfTtcbiAgdGhpcy5wcml2YXRlTmFtZVN0YWNrLnB1c2goZWxlbWVudCk7XG4gIHJldHVybiBlbGVtZW50LmRlY2xhcmVkXG59O1xuXG5wcCQ4LmV4aXRDbGFzc0JvZHkgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJlZiA9IHRoaXMucHJpdmF0ZU5hbWVTdGFjay5wb3AoKTtcbiAgdmFyIGRlY2xhcmVkID0gcmVmLmRlY2xhcmVkO1xuICB2YXIgdXNlZCA9IHJlZi51c2VkO1xuICBpZiAoIXRoaXMub3B0aW9ucy5jaGVja1ByaXZhdGVGaWVsZHMpIHsgcmV0dXJuIH1cbiAgdmFyIGxlbiA9IHRoaXMucHJpdmF0ZU5hbWVTdGFjay5sZW5ndGg7XG4gIHZhciBwYXJlbnQgPSBsZW4gPT09IDAgPyBudWxsIDogdGhpcy5wcml2YXRlTmFtZVN0YWNrW2xlbiAtIDFdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHVzZWQubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgaWQgPSB1c2VkW2ldO1xuICAgIGlmICghaGFzT3duKGRlY2xhcmVkLCBpZC5uYW1lKSkge1xuICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICBwYXJlbnQudXNlZC5wdXNoKGlkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucmFpc2VSZWNvdmVyYWJsZShpZC5zdGFydCwgKFwiUHJpdmF0ZSBmaWVsZCAnI1wiICsgKGlkLm5hbWUpICsgXCInIG11c3QgYmUgZGVjbGFyZWQgaW4gYW4gZW5jbG9zaW5nIGNsYXNzXCIpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGlzUHJpdmF0ZU5hbWVDb25mbGljdGVkKHByaXZhdGVOYW1lTWFwLCBlbGVtZW50KSB7XG4gIHZhciBuYW1lID0gZWxlbWVudC5rZXkubmFtZTtcbiAgdmFyIGN1cnIgPSBwcml2YXRlTmFtZU1hcFtuYW1lXTtcblxuICB2YXIgbmV4dCA9IFwidHJ1ZVwiO1xuICBpZiAoZWxlbWVudC50eXBlID09PSBcIk1ldGhvZERlZmluaXRpb25cIiAmJiAoZWxlbWVudC5raW5kID09PSBcImdldFwiIHx8IGVsZW1lbnQua2luZCA9PT0gXCJzZXRcIikpIHtcbiAgICBuZXh0ID0gKGVsZW1lbnQuc3RhdGljID8gXCJzXCIgOiBcImlcIikgKyBlbGVtZW50LmtpbmQ7XG4gIH1cblxuICAvLyBgY2xhc3MgeyBnZXQgI2EoKXt9OyBzdGF0aWMgc2V0ICNhKF8pe30gfWAgaXMgYWxzbyBjb25mbGljdC5cbiAgaWYgKFxuICAgIGN1cnIgPT09IFwiaWdldFwiICYmIG5leHQgPT09IFwiaXNldFwiIHx8XG4gICAgY3VyciA9PT0gXCJpc2V0XCIgJiYgbmV4dCA9PT0gXCJpZ2V0XCIgfHxcbiAgICBjdXJyID09PSBcInNnZXRcIiAmJiBuZXh0ID09PSBcInNzZXRcIiB8fFxuICAgIGN1cnIgPT09IFwic3NldFwiICYmIG5leHQgPT09IFwic2dldFwiXG4gICkge1xuICAgIHByaXZhdGVOYW1lTWFwW25hbWVdID0gXCJ0cnVlXCI7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH0gZWxzZSBpZiAoIWN1cnIpIHtcbiAgICBwcml2YXRlTmFtZU1hcFtuYW1lXSA9IG5leHQ7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxufVxuXG5mdW5jdGlvbiBjaGVja0tleU5hbWUobm9kZSwgbmFtZSkge1xuICB2YXIgY29tcHV0ZWQgPSBub2RlLmNvbXB1dGVkO1xuICB2YXIga2V5ID0gbm9kZS5rZXk7XG4gIHJldHVybiAhY29tcHV0ZWQgJiYgKFxuICAgIGtleS50eXBlID09PSBcIklkZW50aWZpZXJcIiAmJiBrZXkubmFtZSA9PT0gbmFtZSB8fFxuICAgIGtleS50eXBlID09PSBcIkxpdGVyYWxcIiAmJiBrZXkudmFsdWUgPT09IG5hbWVcbiAgKVxufVxuXG4vLyBQYXJzZXMgbW9kdWxlIGV4cG9ydCBkZWNsYXJhdGlvbi5cblxucHAkOC5wYXJzZUV4cG9ydEFsbERlY2xhcmF0aW9uID0gZnVuY3Rpb24obm9kZSwgZXhwb3J0cykge1xuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDExKSB7XG4gICAgaWYgKHRoaXMuZWF0Q29udGV4dHVhbChcImFzXCIpKSB7XG4gICAgICBub2RlLmV4cG9ydGVkID0gdGhpcy5wYXJzZU1vZHVsZUV4cG9ydE5hbWUoKTtcbiAgICAgIHRoaXMuY2hlY2tFeHBvcnQoZXhwb3J0cywgbm9kZS5leHBvcnRlZCwgdGhpcy5sYXN0VG9rU3RhcnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBub2RlLmV4cG9ydGVkID0gbnVsbDtcbiAgICB9XG4gIH1cbiAgdGhpcy5leHBlY3RDb250ZXh0dWFsKFwiZnJvbVwiKTtcbiAgaWYgKHRoaXMudHlwZSAhPT0gdHlwZXMkMS5zdHJpbmcpIHsgdGhpcy51bmV4cGVjdGVkKCk7IH1cbiAgbm9kZS5zb3VyY2UgPSB0aGlzLnBhcnNlRXhwckF0b20oKTtcbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSAxNilcbiAgICB7IG5vZGUuYXR0cmlidXRlcyA9IHRoaXMucGFyc2VXaXRoQ2xhdXNlKCk7IH1cbiAgdGhpcy5zZW1pY29sb24oKTtcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIkV4cG9ydEFsbERlY2xhcmF0aW9uXCIpXG59O1xuXG5wcCQ4LnBhcnNlRXhwb3J0ID0gZnVuY3Rpb24obm9kZSwgZXhwb3J0cykge1xuICB0aGlzLm5leHQoKTtcbiAgLy8gZXhwb3J0ICogZnJvbSAnLi4uJ1xuICBpZiAodGhpcy5lYXQodHlwZXMkMS5zdGFyKSkge1xuICAgIHJldHVybiB0aGlzLnBhcnNlRXhwb3J0QWxsRGVjbGFyYXRpb24obm9kZSwgZXhwb3J0cylcbiAgfVxuICBpZiAodGhpcy5lYXQodHlwZXMkMS5fZGVmYXVsdCkpIHsgLy8gZXhwb3J0IGRlZmF1bHQgLi4uXG4gICAgdGhpcy5jaGVja0V4cG9ydChleHBvcnRzLCBcImRlZmF1bHRcIiwgdGhpcy5sYXN0VG9rU3RhcnQpO1xuICAgIG5vZGUuZGVjbGFyYXRpb24gPSB0aGlzLnBhcnNlRXhwb3J0RGVmYXVsdERlY2xhcmF0aW9uKCk7XG4gICAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIkV4cG9ydERlZmF1bHREZWNsYXJhdGlvblwiKVxuICB9XG4gIC8vIGV4cG9ydCB2YXJ8Y29uc3R8bGV0fGZ1bmN0aW9ufGNsYXNzIC4uLlxuICBpZiAodGhpcy5zaG91bGRQYXJzZUV4cG9ydFN0YXRlbWVudCgpKSB7XG4gICAgbm9kZS5kZWNsYXJhdGlvbiA9IHRoaXMucGFyc2VFeHBvcnREZWNsYXJhdGlvbihub2RlKTtcbiAgICBpZiAobm9kZS5kZWNsYXJhdGlvbi50eXBlID09PSBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIilcbiAgICAgIHsgdGhpcy5jaGVja1ZhcmlhYmxlRXhwb3J0KGV4cG9ydHMsIG5vZGUuZGVjbGFyYXRpb24uZGVjbGFyYXRpb25zKTsgfVxuICAgIGVsc2VcbiAgICAgIHsgdGhpcy5jaGVja0V4cG9ydChleHBvcnRzLCBub2RlLmRlY2xhcmF0aW9uLmlkLCBub2RlLmRlY2xhcmF0aW9uLmlkLnN0YXJ0KTsgfVxuICAgIG5vZGUuc3BlY2lmaWVycyA9IFtdO1xuICAgIG5vZGUuc291cmNlID0gbnVsbDtcbiAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDE2KVxuICAgICAgeyBub2RlLmF0dHJpYnV0ZXMgPSBbXTsgfVxuICB9IGVsc2UgeyAvLyBleHBvcnQgeyB4LCB5IGFzIHogfSBbZnJvbSAnLi4uJ11cbiAgICBub2RlLmRlY2xhcmF0aW9uID0gbnVsbDtcbiAgICBub2RlLnNwZWNpZmllcnMgPSB0aGlzLnBhcnNlRXhwb3J0U3BlY2lmaWVycyhleHBvcnRzKTtcbiAgICBpZiAodGhpcy5lYXRDb250ZXh0dWFsKFwiZnJvbVwiKSkge1xuICAgICAgaWYgKHRoaXMudHlwZSAhPT0gdHlwZXMkMS5zdHJpbmcpIHsgdGhpcy51bmV4cGVjdGVkKCk7IH1cbiAgICAgIG5vZGUuc291cmNlID0gdGhpcy5wYXJzZUV4cHJBdG9tKCk7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDE2KVxuICAgICAgICB7IG5vZGUuYXR0cmlidXRlcyA9IHRoaXMucGFyc2VXaXRoQ2xhdXNlKCk7IH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxpc3QgPSBub2RlLnNwZWNpZmllcnM7IGkgPCBsaXN0Lmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIC8vIGNoZWNrIGZvciBrZXl3b3JkcyB1c2VkIGFzIGxvY2FsIG5hbWVzXG4gICAgICAgIHZhciBzcGVjID0gbGlzdFtpXTtcblxuICAgICAgICB0aGlzLmNoZWNrVW5yZXNlcnZlZChzcGVjLmxvY2FsKTtcbiAgICAgICAgLy8gY2hlY2sgaWYgZXhwb3J0IGlzIGRlZmluZWRcbiAgICAgICAgdGhpcy5jaGVja0xvY2FsRXhwb3J0KHNwZWMubG9jYWwpO1xuXG4gICAgICAgIGlmIChzcGVjLmxvY2FsLnR5cGUgPT09IFwiTGl0ZXJhbFwiKSB7XG4gICAgICAgICAgdGhpcy5yYWlzZShzcGVjLmxvY2FsLnN0YXJ0LCBcIkEgc3RyaW5nIGxpdGVyYWwgY2Fubm90IGJlIHVzZWQgYXMgYW4gZXhwb3J0ZWQgYmluZGluZyB3aXRob3V0IGBmcm9tYC5cIik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbm9kZS5zb3VyY2UgPSBudWxsO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSAxNilcbiAgICAgICAgeyBub2RlLmF0dHJpYnV0ZXMgPSBbXTsgfVxuICAgIH1cbiAgICB0aGlzLnNlbWljb2xvbigpO1xuICB9XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJFeHBvcnROYW1lZERlY2xhcmF0aW9uXCIpXG59O1xuXG5wcCQ4LnBhcnNlRXhwb3J0RGVjbGFyYXRpb24gPSBmdW5jdGlvbihub2RlKSB7XG4gIHJldHVybiB0aGlzLnBhcnNlU3RhdGVtZW50KG51bGwpXG59O1xuXG5wcCQ4LnBhcnNlRXhwb3J0RGVmYXVsdERlY2xhcmF0aW9uID0gZnVuY3Rpb24oKSB7XG4gIHZhciBpc0FzeW5jO1xuICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLl9mdW5jdGlvbiB8fCAoaXNBc3luYyA9IHRoaXMuaXNBc3luY0Z1bmN0aW9uKCkpKSB7XG4gICAgdmFyIGZOb2RlID0gdGhpcy5zdGFydE5vZGUoKTtcbiAgICB0aGlzLm5leHQoKTtcbiAgICBpZiAoaXNBc3luYykgeyB0aGlzLm5leHQoKTsgfVxuICAgIHJldHVybiB0aGlzLnBhcnNlRnVuY3Rpb24oZk5vZGUsIEZVTkNfU1RBVEVNRU5UIHwgRlVOQ19OVUxMQUJMRV9JRCwgZmFsc2UsIGlzQXN5bmMpXG4gIH0gZWxzZSBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLl9jbGFzcykge1xuICAgIHZhciBjTm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gICAgcmV0dXJuIHRoaXMucGFyc2VDbGFzcyhjTm9kZSwgXCJudWxsYWJsZUlEXCIpXG4gIH0gZWxzZSB7XG4gICAgdmFyIGRlY2xhcmF0aW9uID0gdGhpcy5wYXJzZU1heWJlQXNzaWduKCk7XG4gICAgdGhpcy5zZW1pY29sb24oKTtcbiAgICByZXR1cm4gZGVjbGFyYXRpb25cbiAgfVxufTtcblxucHAkOC5jaGVja0V4cG9ydCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIHBvcykge1xuICBpZiAoIWV4cG9ydHMpIHsgcmV0dXJuIH1cbiAgaWYgKHR5cGVvZiBuYW1lICE9PSBcInN0cmluZ1wiKVxuICAgIHsgbmFtZSA9IG5hbWUudHlwZSA9PT0gXCJJZGVudGlmaWVyXCIgPyBuYW1lLm5hbWUgOiBuYW1lLnZhbHVlOyB9XG4gIGlmIChoYXNPd24oZXhwb3J0cywgbmFtZSkpXG4gICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUocG9zLCBcIkR1cGxpY2F0ZSBleHBvcnQgJ1wiICsgbmFtZSArIFwiJ1wiKTsgfVxuICBleHBvcnRzW25hbWVdID0gdHJ1ZTtcbn07XG5cbnBwJDguY2hlY2tQYXR0ZXJuRXhwb3J0ID0gZnVuY3Rpb24oZXhwb3J0cywgcGF0KSB7XG4gIHZhciB0eXBlID0gcGF0LnR5cGU7XG4gIGlmICh0eXBlID09PSBcIklkZW50aWZpZXJcIilcbiAgICB7IHRoaXMuY2hlY2tFeHBvcnQoZXhwb3J0cywgcGF0LCBwYXQuc3RhcnQpOyB9XG4gIGVsc2UgaWYgKHR5cGUgPT09IFwiT2JqZWN0UGF0dGVyblwiKVxuICAgIHsgZm9yICh2YXIgaSA9IDAsIGxpc3QgPSBwYXQucHJvcGVydGllczsgaSA8IGxpc3QubGVuZ3RoOyBpICs9IDEpXG4gICAgICB7XG4gICAgICAgIHZhciBwcm9wID0gbGlzdFtpXTtcblxuICAgICAgICB0aGlzLmNoZWNrUGF0dGVybkV4cG9ydChleHBvcnRzLCBwcm9wKTtcbiAgICAgIH0gfVxuICBlbHNlIGlmICh0eXBlID09PSBcIkFycmF5UGF0dGVyblwiKVxuICAgIHsgZm9yICh2YXIgaSQxID0gMCwgbGlzdCQxID0gcGF0LmVsZW1lbnRzOyBpJDEgPCBsaXN0JDEubGVuZ3RoOyBpJDEgKz0gMSkge1xuICAgICAgdmFyIGVsdCA9IGxpc3QkMVtpJDFdO1xuXG4gICAgICAgIGlmIChlbHQpIHsgdGhpcy5jaGVja1BhdHRlcm5FeHBvcnQoZXhwb3J0cywgZWx0KTsgfVxuICAgIH0gfVxuICBlbHNlIGlmICh0eXBlID09PSBcIlByb3BlcnR5XCIpXG4gICAgeyB0aGlzLmNoZWNrUGF0dGVybkV4cG9ydChleHBvcnRzLCBwYXQudmFsdWUpOyB9XG4gIGVsc2UgaWYgKHR5cGUgPT09IFwiQXNzaWdubWVudFBhdHRlcm5cIilcbiAgICB7IHRoaXMuY2hlY2tQYXR0ZXJuRXhwb3J0KGV4cG9ydHMsIHBhdC5sZWZ0KTsgfVxuICBlbHNlIGlmICh0eXBlID09PSBcIlJlc3RFbGVtZW50XCIpXG4gICAgeyB0aGlzLmNoZWNrUGF0dGVybkV4cG9ydChleHBvcnRzLCBwYXQuYXJndW1lbnQpOyB9XG59O1xuXG5wcCQ4LmNoZWNrVmFyaWFibGVFeHBvcnQgPSBmdW5jdGlvbihleHBvcnRzLCBkZWNscykge1xuICBpZiAoIWV4cG9ydHMpIHsgcmV0dXJuIH1cbiAgZm9yICh2YXIgaSA9IDAsIGxpc3QgPSBkZWNsczsgaSA8IGxpc3QubGVuZ3RoOyBpICs9IDEpXG4gICAge1xuICAgIHZhciBkZWNsID0gbGlzdFtpXTtcblxuICAgIHRoaXMuY2hlY2tQYXR0ZXJuRXhwb3J0KGV4cG9ydHMsIGRlY2wuaWQpO1xuICB9XG59O1xuXG5wcCQ4LnNob3VsZFBhcnNlRXhwb3J0U3RhdGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnR5cGUua2V5d29yZCA9PT0gXCJ2YXJcIiB8fFxuICAgIHRoaXMudHlwZS5rZXl3b3JkID09PSBcImNvbnN0XCIgfHxcbiAgICB0aGlzLnR5cGUua2V5d29yZCA9PT0gXCJjbGFzc1wiIHx8XG4gICAgdGhpcy50eXBlLmtleXdvcmQgPT09IFwiZnVuY3Rpb25cIiB8fFxuICAgIHRoaXMuaXNMZXQoKSB8fFxuICAgIHRoaXMuaXNBc3luY0Z1bmN0aW9uKClcbn07XG5cbi8vIFBhcnNlcyBhIGNvbW1hLXNlcGFyYXRlZCBsaXN0IG9mIG1vZHVsZSBleHBvcnRzLlxuXG5wcCQ4LnBhcnNlRXhwb3J0U3BlY2lmaWVyID0gZnVuY3Rpb24oZXhwb3J0cykge1xuICB2YXIgbm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gIG5vZGUubG9jYWwgPSB0aGlzLnBhcnNlTW9kdWxlRXhwb3J0TmFtZSgpO1xuXG4gIG5vZGUuZXhwb3J0ZWQgPSB0aGlzLmVhdENvbnRleHR1YWwoXCJhc1wiKSA/IHRoaXMucGFyc2VNb2R1bGVFeHBvcnROYW1lKCkgOiBub2RlLmxvY2FsO1xuICB0aGlzLmNoZWNrRXhwb3J0KFxuICAgIGV4cG9ydHMsXG4gICAgbm9kZS5leHBvcnRlZCxcbiAgICBub2RlLmV4cG9ydGVkLnN0YXJ0XG4gICk7XG5cbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIkV4cG9ydFNwZWNpZmllclwiKVxufTtcblxucHAkOC5wYXJzZUV4cG9ydFNwZWNpZmllcnMgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gIHZhciBub2RlcyA9IFtdLCBmaXJzdCA9IHRydWU7XG4gIC8vIGV4cG9ydCB7IHgsIHkgYXMgeiB9IFtmcm9tICcuLi4nXVxuICB0aGlzLmV4cGVjdCh0eXBlcyQxLmJyYWNlTCk7XG4gIHdoaWxlICghdGhpcy5lYXQodHlwZXMkMS5icmFjZVIpKSB7XG4gICAgaWYgKCFmaXJzdCkge1xuICAgICAgdGhpcy5leHBlY3QodHlwZXMkMS5jb21tYSk7XG4gICAgICBpZiAodGhpcy5hZnRlclRyYWlsaW5nQ29tbWEodHlwZXMkMS5icmFjZVIpKSB7IGJyZWFrIH1cbiAgICB9IGVsc2UgeyBmaXJzdCA9IGZhbHNlOyB9XG5cbiAgICBub2Rlcy5wdXNoKHRoaXMucGFyc2VFeHBvcnRTcGVjaWZpZXIoZXhwb3J0cykpO1xuICB9XG4gIHJldHVybiBub2Rlc1xufTtcblxuLy8gUGFyc2VzIGltcG9ydCBkZWNsYXJhdGlvbi5cblxucHAkOC5wYXJzZUltcG9ydCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgdGhpcy5uZXh0KCk7XG5cbiAgLy8gaW1wb3J0ICcuLi4nXG4gIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuc3RyaW5nKSB7XG4gICAgbm9kZS5zcGVjaWZpZXJzID0gZW1wdHkkMTtcbiAgICBub2RlLnNvdXJjZSA9IHRoaXMucGFyc2VFeHByQXRvbSgpO1xuICB9IGVsc2Uge1xuICAgIG5vZGUuc3BlY2lmaWVycyA9IHRoaXMucGFyc2VJbXBvcnRTcGVjaWZpZXJzKCk7XG4gICAgdGhpcy5leHBlY3RDb250ZXh0dWFsKFwiZnJvbVwiKTtcbiAgICBub2RlLnNvdXJjZSA9IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5zdHJpbmcgPyB0aGlzLnBhcnNlRXhwckF0b20oKSA6IHRoaXMudW5leHBlY3RlZCgpO1xuICB9XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTYpXG4gICAgeyBub2RlLmF0dHJpYnV0ZXMgPSB0aGlzLnBhcnNlV2l0aENsYXVzZSgpOyB9XG4gIHRoaXMuc2VtaWNvbG9uKCk7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJJbXBvcnREZWNsYXJhdGlvblwiKVxufTtcblxuLy8gUGFyc2VzIGEgY29tbWEtc2VwYXJhdGVkIGxpc3Qgb2YgbW9kdWxlIGltcG9ydHMuXG5cbnBwJDgucGFyc2VJbXBvcnRTcGVjaWZpZXIgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICBub2RlLmltcG9ydGVkID0gdGhpcy5wYXJzZU1vZHVsZUV4cG9ydE5hbWUoKTtcblxuICBpZiAodGhpcy5lYXRDb250ZXh0dWFsKFwiYXNcIikpIHtcbiAgICBub2RlLmxvY2FsID0gdGhpcy5wYXJzZUlkZW50KCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5jaGVja1VucmVzZXJ2ZWQobm9kZS5pbXBvcnRlZCk7XG4gICAgbm9kZS5sb2NhbCA9IG5vZGUuaW1wb3J0ZWQ7XG4gIH1cbiAgdGhpcy5jaGVja0xWYWxTaW1wbGUobm9kZS5sb2NhbCwgQklORF9MRVhJQ0FMKTtcblxuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiSW1wb3J0U3BlY2lmaWVyXCIpXG59O1xuXG5wcCQ4LnBhcnNlSW1wb3J0RGVmYXVsdFNwZWNpZmllciA9IGZ1bmN0aW9uKCkge1xuICAvLyBpbXBvcnQgZGVmYXVsdE9iaiwgeyB4LCB5IGFzIHogfSBmcm9tICcuLi4nXG4gIHZhciBub2RlID0gdGhpcy5zdGFydE5vZGUoKTtcbiAgbm9kZS5sb2NhbCA9IHRoaXMucGFyc2VJZGVudCgpO1xuICB0aGlzLmNoZWNrTFZhbFNpbXBsZShub2RlLmxvY2FsLCBCSU5EX0xFWElDQUwpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiSW1wb3J0RGVmYXVsdFNwZWNpZmllclwiKVxufTtcblxucHAkOC5wYXJzZUltcG9ydE5hbWVzcGFjZVNwZWNpZmllciA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gIHRoaXMubmV4dCgpO1xuICB0aGlzLmV4cGVjdENvbnRleHR1YWwoXCJhc1wiKTtcbiAgbm9kZS5sb2NhbCA9IHRoaXMucGFyc2VJZGVudCgpO1xuICB0aGlzLmNoZWNrTFZhbFNpbXBsZShub2RlLmxvY2FsLCBCSU5EX0xFWElDQUwpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiSW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyXCIpXG59O1xuXG5wcCQ4LnBhcnNlSW1wb3J0U3BlY2lmaWVycyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbm9kZXMgPSBbXSwgZmlyc3QgPSB0cnVlO1xuICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLm5hbWUpIHtcbiAgICBub2Rlcy5wdXNoKHRoaXMucGFyc2VJbXBvcnREZWZhdWx0U3BlY2lmaWVyKCkpO1xuICAgIGlmICghdGhpcy5lYXQodHlwZXMkMS5jb21tYSkpIHsgcmV0dXJuIG5vZGVzIH1cbiAgfVxuICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLnN0YXIpIHtcbiAgICBub2Rlcy5wdXNoKHRoaXMucGFyc2VJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXIoKSk7XG4gICAgcmV0dXJuIG5vZGVzXG4gIH1cbiAgdGhpcy5leHBlY3QodHlwZXMkMS5icmFjZUwpO1xuICB3aGlsZSAoIXRoaXMuZWF0KHR5cGVzJDEuYnJhY2VSKSkge1xuICAgIGlmICghZmlyc3QpIHtcbiAgICAgIHRoaXMuZXhwZWN0KHR5cGVzJDEuY29tbWEpO1xuICAgICAgaWYgKHRoaXMuYWZ0ZXJUcmFpbGluZ0NvbW1hKHR5cGVzJDEuYnJhY2VSKSkgeyBicmVhayB9XG4gICAgfSBlbHNlIHsgZmlyc3QgPSBmYWxzZTsgfVxuXG4gICAgbm9kZXMucHVzaCh0aGlzLnBhcnNlSW1wb3J0U3BlY2lmaWVyKCkpO1xuICB9XG4gIHJldHVybiBub2Rlc1xufTtcblxucHAkOC5wYXJzZVdpdGhDbGF1c2UgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG5vZGVzID0gW107XG4gIGlmICghdGhpcy5lYXQodHlwZXMkMS5fd2l0aCkpIHtcbiAgICByZXR1cm4gbm9kZXNcbiAgfVxuICB0aGlzLmV4cGVjdCh0eXBlcyQxLmJyYWNlTCk7XG4gIHZhciBhdHRyaWJ1dGVLZXlzID0ge307XG4gIHZhciBmaXJzdCA9IHRydWU7XG4gIHdoaWxlICghdGhpcy5lYXQodHlwZXMkMS5icmFjZVIpKSB7XG4gICAgaWYgKCFmaXJzdCkge1xuICAgICAgdGhpcy5leHBlY3QodHlwZXMkMS5jb21tYSk7XG4gICAgICBpZiAodGhpcy5hZnRlclRyYWlsaW5nQ29tbWEodHlwZXMkMS5icmFjZVIpKSB7IGJyZWFrIH1cbiAgICB9IGVsc2UgeyBmaXJzdCA9IGZhbHNlOyB9XG5cbiAgICB2YXIgYXR0ciA9IHRoaXMucGFyc2VJbXBvcnRBdHRyaWJ1dGUoKTtcbiAgICB2YXIga2V5TmFtZSA9IGF0dHIua2V5LnR5cGUgPT09IFwiSWRlbnRpZmllclwiID8gYXR0ci5rZXkubmFtZSA6IGF0dHIua2V5LnZhbHVlO1xuICAgIGlmIChoYXNPd24oYXR0cmlidXRlS2V5cywga2V5TmFtZSkpXG4gICAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShhdHRyLmtleS5zdGFydCwgXCJEdXBsaWNhdGUgYXR0cmlidXRlIGtleSAnXCIgKyBrZXlOYW1lICsgXCInXCIpOyB9XG4gICAgYXR0cmlidXRlS2V5c1trZXlOYW1lXSA9IHRydWU7XG4gICAgbm9kZXMucHVzaChhdHRyKTtcbiAgfVxuICByZXR1cm4gbm9kZXNcbn07XG5cbnBwJDgucGFyc2VJbXBvcnRBdHRyaWJ1dGUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICBub2RlLmtleSA9IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5zdHJpbmcgPyB0aGlzLnBhcnNlRXhwckF0b20oKSA6IHRoaXMucGFyc2VJZGVudCh0aGlzLm9wdGlvbnMuYWxsb3dSZXNlcnZlZCAhPT0gXCJuZXZlclwiKTtcbiAgdGhpcy5leHBlY3QodHlwZXMkMS5jb2xvbik7XG4gIGlmICh0aGlzLnR5cGUgIT09IHR5cGVzJDEuc3RyaW5nKSB7XG4gICAgdGhpcy51bmV4cGVjdGVkKCk7XG4gIH1cbiAgbm9kZS52YWx1ZSA9IHRoaXMucGFyc2VFeHByQXRvbSgpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiSW1wb3J0QXR0cmlidXRlXCIpXG59O1xuXG5wcCQ4LnBhcnNlTW9kdWxlRXhwb3J0TmFtZSA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDEzICYmIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5zdHJpbmcpIHtcbiAgICB2YXIgc3RyaW5nTGl0ZXJhbCA9IHRoaXMucGFyc2VMaXRlcmFsKHRoaXMudmFsdWUpO1xuICAgIGlmIChsb25lU3Vycm9nYXRlLnRlc3Qoc3RyaW5nTGl0ZXJhbC52YWx1ZSkpIHtcbiAgICAgIHRoaXMucmFpc2Uoc3RyaW5nTGl0ZXJhbC5zdGFydCwgXCJBbiBleHBvcnQgbmFtZSBjYW5ub3QgaW5jbHVkZSBhIGxvbmUgc3Vycm9nYXRlLlwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0cmluZ0xpdGVyYWxcbiAgfVxuICByZXR1cm4gdGhpcy5wYXJzZUlkZW50KHRydWUpXG59O1xuXG4vLyBTZXQgYEV4cHJlc3Npb25TdGF0ZW1lbnQjZGlyZWN0aXZlYCBwcm9wZXJ0eSBmb3IgZGlyZWN0aXZlIHByb2xvZ3Vlcy5cbnBwJDguYWRhcHREaXJlY3RpdmVQcm9sb2d1ZSA9IGZ1bmN0aW9uKHN0YXRlbWVudHMpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGF0ZW1lbnRzLmxlbmd0aCAmJiB0aGlzLmlzRGlyZWN0aXZlQ2FuZGlkYXRlKHN0YXRlbWVudHNbaV0pOyArK2kpIHtcbiAgICBzdGF0ZW1lbnRzW2ldLmRpcmVjdGl2ZSA9IHN0YXRlbWVudHNbaV0uZXhwcmVzc2lvbi5yYXcuc2xpY2UoMSwgLTEpO1xuICB9XG59O1xucHAkOC5pc0RpcmVjdGl2ZUNhbmRpZGF0ZSA9IGZ1bmN0aW9uKHN0YXRlbWVudCkge1xuICByZXR1cm4gKFxuICAgIHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA1ICYmXG4gICAgc3RhdGVtZW50LnR5cGUgPT09IFwiRXhwcmVzc2lvblN0YXRlbWVudFwiICYmXG4gICAgc3RhdGVtZW50LmV4cHJlc3Npb24udHlwZSA9PT0gXCJMaXRlcmFsXCIgJiZcbiAgICB0eXBlb2Ygc3RhdGVtZW50LmV4cHJlc3Npb24udmFsdWUgPT09IFwic3RyaW5nXCIgJiZcbiAgICAvLyBSZWplY3QgcGFyZW50aGVzaXplZCBzdHJpbmdzLlxuICAgICh0aGlzLmlucHV0W3N0YXRlbWVudC5zdGFydF0gPT09IFwiXFxcIlwiIHx8IHRoaXMuaW5wdXRbc3RhdGVtZW50LnN0YXJ0XSA9PT0gXCInXCIpXG4gIClcbn07XG5cbnZhciBwcCQ3ID0gUGFyc2VyLnByb3RvdHlwZTtcblxuLy8gQ29udmVydCBleGlzdGluZyBleHByZXNzaW9uIGF0b20gdG8gYXNzaWduYWJsZSBwYXR0ZXJuXG4vLyBpZiBwb3NzaWJsZS5cblxucHAkNy50b0Fzc2lnbmFibGUgPSBmdW5jdGlvbihub2RlLCBpc0JpbmRpbmcsIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpIHtcbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2ICYmIG5vZGUpIHtcbiAgICBzd2l0Y2ggKG5vZGUudHlwZSkge1xuICAgIGNhc2UgXCJJZGVudGlmaWVyXCI6XG4gICAgICBpZiAodGhpcy5pbkFzeW5jICYmIG5vZGUubmFtZSA9PT0gXCJhd2FpdFwiKVxuICAgICAgICB7IHRoaXMucmFpc2Uobm9kZS5zdGFydCwgXCJDYW5ub3QgdXNlICdhd2FpdCcgYXMgaWRlbnRpZmllciBpbnNpZGUgYW4gYXN5bmMgZnVuY3Rpb25cIik7IH1cbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlIFwiT2JqZWN0UGF0dGVyblwiOlxuICAgIGNhc2UgXCJBcnJheVBhdHRlcm5cIjpcbiAgICBjYXNlIFwiQXNzaWdubWVudFBhdHRlcm5cIjpcbiAgICBjYXNlIFwiUmVzdEVsZW1lbnRcIjpcbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlIFwiT2JqZWN0RXhwcmVzc2lvblwiOlxuICAgICAgbm9kZS50eXBlID0gXCJPYmplY3RQYXR0ZXJuXCI7XG4gICAgICBpZiAocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykgeyB0aGlzLmNoZWNrUGF0dGVybkVycm9ycyhyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCB0cnVlKTsgfVxuICAgICAgZm9yICh2YXIgaSA9IDAsIGxpc3QgPSBub2RlLnByb3BlcnRpZXM7IGkgPCBsaXN0Lmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHZhciBwcm9wID0gbGlzdFtpXTtcblxuICAgICAgdGhpcy50b0Fzc2lnbmFibGUocHJvcCwgaXNCaW5kaW5nKTtcbiAgICAgICAgLy8gRWFybHkgZXJyb3I6XG4gICAgICAgIC8vICAgQXNzaWdubWVudFJlc3RQcm9wZXJ0eVtZaWVsZCwgQXdhaXRdIDpcbiAgICAgICAgLy8gICAgIGAuLi5gIERlc3RydWN0dXJpbmdBc3NpZ25tZW50VGFyZ2V0W1lpZWxkLCBBd2FpdF1cbiAgICAgICAgLy9cbiAgICAgICAgLy8gICBJdCBpcyBhIFN5bnRheCBFcnJvciBpZiB8RGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnRUYXJnZXR8IGlzIGFuIHxBcnJheUxpdGVyYWx8IG9yIGFuIHxPYmplY3RMaXRlcmFsfC5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIHByb3AudHlwZSA9PT0gXCJSZXN0RWxlbWVudFwiICYmXG4gICAgICAgICAgKHByb3AuYXJndW1lbnQudHlwZSA9PT0gXCJBcnJheVBhdHRlcm5cIiB8fCBwcm9wLmFyZ3VtZW50LnR5cGUgPT09IFwiT2JqZWN0UGF0dGVyblwiKVxuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzLnJhaXNlKHByb3AuYXJndW1lbnQuc3RhcnQsIFwiVW5leHBlY3RlZCB0b2tlblwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYnJlYWtcblxuICAgIGNhc2UgXCJQcm9wZXJ0eVwiOlxuICAgICAgLy8gQXNzaWdubWVudFByb3BlcnR5IGhhcyB0eXBlID09PSBcIlByb3BlcnR5XCJcbiAgICAgIGlmIChub2RlLmtpbmQgIT09IFwiaW5pdFwiKSB7IHRoaXMucmFpc2Uobm9kZS5rZXkuc3RhcnQsIFwiT2JqZWN0IHBhdHRlcm4gY2FuJ3QgY29udGFpbiBnZXR0ZXIgb3Igc2V0dGVyXCIpOyB9XG4gICAgICB0aGlzLnRvQXNzaWduYWJsZShub2RlLnZhbHVlLCBpc0JpbmRpbmcpO1xuICAgICAgYnJlYWtcblxuICAgIGNhc2UgXCJBcnJheUV4cHJlc3Npb25cIjpcbiAgICAgIG5vZGUudHlwZSA9IFwiQXJyYXlQYXR0ZXJuXCI7XG4gICAgICBpZiAocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykgeyB0aGlzLmNoZWNrUGF0dGVybkVycm9ycyhyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCB0cnVlKTsgfVxuICAgICAgdGhpcy50b0Fzc2lnbmFibGVMaXN0KG5vZGUuZWxlbWVudHMsIGlzQmluZGluZyk7XG4gICAgICBicmVha1xuXG4gICAgY2FzZSBcIlNwcmVhZEVsZW1lbnRcIjpcbiAgICAgIG5vZGUudHlwZSA9IFwiUmVzdEVsZW1lbnRcIjtcbiAgICAgIHRoaXMudG9Bc3NpZ25hYmxlKG5vZGUuYXJndW1lbnQsIGlzQmluZGluZyk7XG4gICAgICBpZiAobm9kZS5hcmd1bWVudC50eXBlID09PSBcIkFzc2lnbm1lbnRQYXR0ZXJuXCIpXG4gICAgICAgIHsgdGhpcy5yYWlzZShub2RlLmFyZ3VtZW50LnN0YXJ0LCBcIlJlc3QgZWxlbWVudHMgY2Fubm90IGhhdmUgYSBkZWZhdWx0IHZhbHVlXCIpOyB9XG4gICAgICBicmVha1xuXG4gICAgY2FzZSBcIkFzc2lnbm1lbnRFeHByZXNzaW9uXCI6XG4gICAgICBpZiAobm9kZS5vcGVyYXRvciAhPT0gXCI9XCIpIHsgdGhpcy5yYWlzZShub2RlLmxlZnQuZW5kLCBcIk9ubHkgJz0nIG9wZXJhdG9yIGNhbiBiZSB1c2VkIGZvciBzcGVjaWZ5aW5nIGRlZmF1bHQgdmFsdWUuXCIpOyB9XG4gICAgICBub2RlLnR5cGUgPSBcIkFzc2lnbm1lbnRQYXR0ZXJuXCI7XG4gICAgICBkZWxldGUgbm9kZS5vcGVyYXRvcjtcbiAgICAgIHRoaXMudG9Bc3NpZ25hYmxlKG5vZGUubGVmdCwgaXNCaW5kaW5nKTtcbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlIFwiUGFyZW50aGVzaXplZEV4cHJlc3Npb25cIjpcbiAgICAgIHRoaXMudG9Bc3NpZ25hYmxlKG5vZGUuZXhwcmVzc2lvbiwgaXNCaW5kaW5nLCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKTtcbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlIFwiQ2hhaW5FeHByZXNzaW9uXCI6XG4gICAgICB0aGlzLnJhaXNlUmVjb3ZlcmFibGUobm9kZS5zdGFydCwgXCJPcHRpb25hbCBjaGFpbmluZyBjYW5ub3QgYXBwZWFyIGluIGxlZnQtaGFuZCBzaWRlXCIpO1xuICAgICAgYnJlYWtcblxuICAgIGNhc2UgXCJNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICBpZiAoIWlzQmluZGluZykgeyBicmVhayB9XG5cbiAgICBkZWZhdWx0OlxuICAgICAgdGhpcy5yYWlzZShub2RlLnN0YXJ0LCBcIkFzc2lnbmluZyB0byBydmFsdWVcIik7XG4gICAgfVxuICB9IGVsc2UgaWYgKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpIHsgdGhpcy5jaGVja1BhdHRlcm5FcnJvcnMocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycywgdHJ1ZSk7IH1cbiAgcmV0dXJuIG5vZGVcbn07XG5cbi8vIENvbnZlcnQgbGlzdCBvZiBleHByZXNzaW9uIGF0b21zIHRvIGJpbmRpbmcgbGlzdC5cblxucHAkNy50b0Fzc2lnbmFibGVMaXN0ID0gZnVuY3Rpb24oZXhwckxpc3QsIGlzQmluZGluZykge1xuICB2YXIgZW5kID0gZXhwckxpc3QubGVuZ3RoO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgdmFyIGVsdCA9IGV4cHJMaXN0W2ldO1xuICAgIGlmIChlbHQpIHsgdGhpcy50b0Fzc2lnbmFibGUoZWx0LCBpc0JpbmRpbmcpOyB9XG4gIH1cbiAgaWYgKGVuZCkge1xuICAgIHZhciBsYXN0ID0gZXhwckxpc3RbZW5kIC0gMV07XG4gICAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA9PT0gNiAmJiBpc0JpbmRpbmcgJiYgbGFzdCAmJiBsYXN0LnR5cGUgPT09IFwiUmVzdEVsZW1lbnRcIiAmJiBsYXN0LmFyZ3VtZW50LnR5cGUgIT09IFwiSWRlbnRpZmllclwiKVxuICAgICAgeyB0aGlzLnVuZXhwZWN0ZWQobGFzdC5hcmd1bWVudC5zdGFydCk7IH1cbiAgfVxuICByZXR1cm4gZXhwckxpc3Rcbn07XG5cbi8vIFBhcnNlcyBzcHJlYWQgZWxlbWVudC5cblxucHAkNy5wYXJzZVNwcmVhZCA9IGZ1bmN0aW9uKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpIHtcbiAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICB0aGlzLm5leHQoKTtcbiAgbm9kZS5hcmd1bWVudCA9IHRoaXMucGFyc2VNYXliZUFzc2lnbihmYWxzZSwgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycyk7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJTcHJlYWRFbGVtZW50XCIpXG59O1xuXG5wcCQ3LnBhcnNlUmVzdEJpbmRpbmcgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICB0aGlzLm5leHQoKTtcblxuICAvLyBSZXN0RWxlbWVudCBpbnNpZGUgb2YgYSBmdW5jdGlvbiBwYXJhbWV0ZXIgbXVzdCBiZSBhbiBpZGVudGlmaWVyXG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPT09IDYgJiYgdGhpcy50eXBlICE9PSB0eXBlcyQxLm5hbWUpXG4gICAgeyB0aGlzLnVuZXhwZWN0ZWQoKTsgfVxuXG4gIG5vZGUuYXJndW1lbnQgPSB0aGlzLnBhcnNlQmluZGluZ0F0b20oKTtcblxuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiUmVzdEVsZW1lbnRcIilcbn07XG5cbi8vIFBhcnNlcyBsdmFsdWUgKGFzc2lnbmFibGUpIGF0b20uXG5cbnBwJDcucGFyc2VCaW5kaW5nQXRvbSA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDYpIHtcbiAgICBzd2l0Y2ggKHRoaXMudHlwZSkge1xuICAgIGNhc2UgdHlwZXMkMS5icmFja2V0TDpcbiAgICAgIHZhciBub2RlID0gdGhpcy5zdGFydE5vZGUoKTtcbiAgICAgIHRoaXMubmV4dCgpO1xuICAgICAgbm9kZS5lbGVtZW50cyA9IHRoaXMucGFyc2VCaW5kaW5nTGlzdCh0eXBlcyQxLmJyYWNrZXRSLCB0cnVlLCB0cnVlKTtcbiAgICAgIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJBcnJheVBhdHRlcm5cIilcblxuICAgIGNhc2UgdHlwZXMkMS5icmFjZUw6XG4gICAgICByZXR1cm4gdGhpcy5wYXJzZU9iaih0cnVlKVxuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpcy5wYXJzZUlkZW50KClcbn07XG5cbnBwJDcucGFyc2VCaW5kaW5nTGlzdCA9IGZ1bmN0aW9uKGNsb3NlLCBhbGxvd0VtcHR5LCBhbGxvd1RyYWlsaW5nQ29tbWEsIGFsbG93TW9kaWZpZXJzKSB7XG4gIHZhciBlbHRzID0gW10sIGZpcnN0ID0gdHJ1ZTtcbiAgd2hpbGUgKCF0aGlzLmVhdChjbG9zZSkpIHtcbiAgICBpZiAoZmlyc3QpIHsgZmlyc3QgPSBmYWxzZTsgfVxuICAgIGVsc2UgeyB0aGlzLmV4cGVjdCh0eXBlcyQxLmNvbW1hKTsgfVxuICAgIGlmIChhbGxvd0VtcHR5ICYmIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5jb21tYSkge1xuICAgICAgZWx0cy5wdXNoKG51bGwpO1xuICAgIH0gZWxzZSBpZiAoYWxsb3dUcmFpbGluZ0NvbW1hICYmIHRoaXMuYWZ0ZXJUcmFpbGluZ0NvbW1hKGNsb3NlKSkge1xuICAgICAgYnJlYWtcbiAgICB9IGVsc2UgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5lbGxpcHNpcykge1xuICAgICAgdmFyIHJlc3QgPSB0aGlzLnBhcnNlUmVzdEJpbmRpbmcoKTtcbiAgICAgIHRoaXMucGFyc2VCaW5kaW5nTGlzdEl0ZW0ocmVzdCk7XG4gICAgICBlbHRzLnB1c2gocmVzdCk7XG4gICAgICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLmNvbW1hKSB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZSh0aGlzLnN0YXJ0LCBcIkNvbW1hIGlzIG5vdCBwZXJtaXR0ZWQgYWZ0ZXIgdGhlIHJlc3QgZWxlbWVudFwiKTsgfVxuICAgICAgdGhpcy5leHBlY3QoY2xvc2UpO1xuICAgICAgYnJlYWtcbiAgICB9IGVsc2Uge1xuICAgICAgZWx0cy5wdXNoKHRoaXMucGFyc2VBc3NpZ25hYmxlTGlzdEl0ZW0oYWxsb3dNb2RpZmllcnMpKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGVsdHNcbn07XG5cbnBwJDcucGFyc2VBc3NpZ25hYmxlTGlzdEl0ZW0gPSBmdW5jdGlvbihhbGxvd01vZGlmaWVycykge1xuICB2YXIgZWxlbSA9IHRoaXMucGFyc2VNYXliZURlZmF1bHQodGhpcy5zdGFydCwgdGhpcy5zdGFydExvYyk7XG4gIHRoaXMucGFyc2VCaW5kaW5nTGlzdEl0ZW0oZWxlbSk7XG4gIHJldHVybiBlbGVtXG59O1xuXG5wcCQ3LnBhcnNlQmluZGluZ0xpc3RJdGVtID0gZnVuY3Rpb24ocGFyYW0pIHtcbiAgcmV0dXJuIHBhcmFtXG59O1xuXG4vLyBQYXJzZXMgYXNzaWdubWVudCBwYXR0ZXJuIGFyb3VuZCBnaXZlbiBhdG9tIGlmIHBvc3NpYmxlLlxuXG5wcCQ3LnBhcnNlTWF5YmVEZWZhdWx0ID0gZnVuY3Rpb24oc3RhcnRQb3MsIHN0YXJ0TG9jLCBsZWZ0KSB7XG4gIGxlZnQgPSBsZWZ0IHx8IHRoaXMucGFyc2VCaW5kaW5nQXRvbSgpO1xuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uIDwgNiB8fCAhdGhpcy5lYXQodHlwZXMkMS5lcSkpIHsgcmV0dXJuIGxlZnQgfVxuICB2YXIgbm9kZSA9IHRoaXMuc3RhcnROb2RlQXQoc3RhcnRQb3MsIHN0YXJ0TG9jKTtcbiAgbm9kZS5sZWZ0ID0gbGVmdDtcbiAgbm9kZS5yaWdodCA9IHRoaXMucGFyc2VNYXliZUFzc2lnbigpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiQXNzaWdubWVudFBhdHRlcm5cIilcbn07XG5cbi8vIFRoZSBmb2xsb3dpbmcgdGhyZWUgZnVuY3Rpb25zIGFsbCB2ZXJpZnkgdGhhdCBhIG5vZGUgaXMgYW4gbHZhbHVlIFx1MjAxNFxuLy8gc29tZXRoaW5nIHRoYXQgY2FuIGJlIGJvdW5kLCBvciBhc3NpZ25lZCB0by4gSW4gb3JkZXIgdG8gZG8gc28sIHRoZXkgcGVyZm9ybVxuLy8gYSB2YXJpZXR5IG9mIGNoZWNrczpcbi8vXG4vLyAtIENoZWNrIHRoYXQgbm9uZSBvZiB0aGUgYm91bmQvYXNzaWduZWQtdG8gaWRlbnRpZmllcnMgYXJlIHJlc2VydmVkIHdvcmRzLlxuLy8gLSBSZWNvcmQgbmFtZSBkZWNsYXJhdGlvbnMgZm9yIGJpbmRpbmdzIGluIHRoZSBhcHByb3ByaWF0ZSBzY29wZS5cbi8vIC0gQ2hlY2sgZHVwbGljYXRlIGFyZ3VtZW50IG5hbWVzLCBpZiBjaGVja0NsYXNoZXMgaXMgc2V0LlxuLy9cbi8vIElmIGEgY29tcGxleCBiaW5kaW5nIHBhdHRlcm4gaXMgZW5jb3VudGVyZWQgKGUuZy4sIG9iamVjdCBhbmQgYXJyYXlcbi8vIGRlc3RydWN0dXJpbmcpLCB0aGUgZW50aXJlIHBhdHRlcm4gaXMgcmVjdXJzaXZlbHkgY2hlY2tlZC5cbi8vXG4vLyBUaGVyZSBhcmUgdGhyZWUgdmVyc2lvbnMgb2YgY2hlY2tMVmFsKigpIGFwcHJvcHJpYXRlIGZvciBkaWZmZXJlbnRcbi8vIGNpcmN1bXN0YW5jZXM6XG4vL1xuLy8gLSBjaGVja0xWYWxTaW1wbGUoKSBzaGFsbCBiZSB1c2VkIGlmIHRoZSBzeW50YWN0aWMgY29uc3RydWN0IHN1cHBvcnRzXG4vLyAgIG5vdGhpbmcgb3RoZXIgdGhhbiBpZGVudGlmaWVycyBhbmQgbWVtYmVyIGV4cHJlc3Npb25zLiBQYXJlbnRoZXNpemVkXG4vLyAgIGV4cHJlc3Npb25zIGFyZSBhbHNvIGNvcnJlY3RseSBoYW5kbGVkLiBUaGlzIGlzIGdlbmVyYWxseSBhcHByb3ByaWF0ZSBmb3Jcbi8vICAgY29uc3RydWN0cyBmb3Igd2hpY2ggdGhlIHNwZWMgc2F5c1xuLy9cbi8vICAgPiBJdCBpcyBhIFN5bnRheCBFcnJvciBpZiBBc3NpZ25tZW50VGFyZ2V0VHlwZSBvZiBbdGhlIHByb2R1Y3Rpb25dIGlzIG5vdFxuLy8gICA+IHNpbXBsZS5cbi8vXG4vLyAgIEl0IGlzIGFsc28gYXBwcm9wcmlhdGUgZm9yIGNoZWNraW5nIGlmIGFuIGlkZW50aWZpZXIgaXMgdmFsaWQgYW5kIG5vdFxuLy8gICBkZWZpbmVkIGVsc2V3aGVyZSwgbGlrZSBpbXBvcnQgZGVjbGFyYXRpb25zIG9yIGZ1bmN0aW9uL2NsYXNzIGlkZW50aWZpZXJzLlxuLy9cbi8vICAgRXhhbXBsZXMgd2hlcmUgdGhpcyBpcyB1c2VkIGluY2x1ZGU6XG4vLyAgICAgYSArPSBcdTIwMjY7XG4vLyAgICAgaW1wb3J0IGEgZnJvbSAnXHUyMDI2Jztcbi8vICAgd2hlcmUgYSBpcyB0aGUgbm9kZSB0byBiZSBjaGVja2VkLlxuLy9cbi8vIC0gY2hlY2tMVmFsUGF0dGVybigpIHNoYWxsIGJlIHVzZWQgaWYgdGhlIHN5bnRhY3RpYyBjb25zdHJ1Y3Qgc3VwcG9ydHNcbi8vICAgYW55dGhpbmcgY2hlY2tMVmFsU2ltcGxlKCkgc3VwcG9ydHMsIGFzIHdlbGwgYXMgb2JqZWN0IGFuZCBhcnJheVxuLy8gICBkZXN0cnVjdHVyaW5nIHBhdHRlcm5zLiBUaGlzIGlzIGdlbmVyYWxseSBhcHByb3ByaWF0ZSBmb3IgY29uc3RydWN0cyBmb3Jcbi8vICAgd2hpY2ggdGhlIHNwZWMgc2F5c1xuLy9cbi8vICAgPiBJdCBpcyBhIFN5bnRheCBFcnJvciBpZiBbdGhlIHByb2R1Y3Rpb25dIGlzIG5laXRoZXIgYW4gT2JqZWN0TGl0ZXJhbCBub3Jcbi8vICAgPiBhbiBBcnJheUxpdGVyYWwgYW5kIEFzc2lnbm1lbnRUYXJnZXRUeXBlIG9mIFt0aGUgcHJvZHVjdGlvbl0gaXMgbm90XG4vLyAgID4gc2ltcGxlLlxuLy9cbi8vICAgRXhhbXBsZXMgd2hlcmUgdGhpcyBpcyB1c2VkIGluY2x1ZGU6XG4vLyAgICAgKGEgPSBcdTIwMjYpO1xuLy8gICAgIGNvbnN0IGEgPSBcdTIwMjY7XG4vLyAgICAgdHJ5IHsgXHUyMDI2IH0gY2F0Y2ggKGEpIHsgXHUyMDI2IH1cbi8vICAgd2hlcmUgYSBpcyB0aGUgbm9kZSB0byBiZSBjaGVja2VkLlxuLy9cbi8vIC0gY2hlY2tMVmFsSW5uZXJQYXR0ZXJuKCkgc2hhbGwgYmUgdXNlZCBpZiB0aGUgc3ludGFjdGljIGNvbnN0cnVjdCBzdXBwb3J0c1xuLy8gICBhbnl0aGluZyBjaGVja0xWYWxQYXR0ZXJuKCkgc3VwcG9ydHMsIGFzIHdlbGwgYXMgZGVmYXVsdCBhc3NpZ25tZW50XG4vLyAgIHBhdHRlcm5zLCByZXN0IGVsZW1lbnRzLCBhbmQgb3RoZXIgY29uc3RydWN0cyB0aGF0IG1heSBhcHBlYXIgd2l0aGluIGFuXG4vLyAgIG9iamVjdCBvciBhcnJheSBkZXN0cnVjdHVyaW5nIHBhdHRlcm4uXG4vL1xuLy8gICBBcyBhIHNwZWNpYWwgY2FzZSwgZnVuY3Rpb24gcGFyYW1ldGVycyBhbHNvIHVzZSBjaGVja0xWYWxJbm5lclBhdHRlcm4oKSxcbi8vICAgYXMgdGhleSBhbHNvIHN1cHBvcnQgZGVmYXVsdHMgYW5kIHJlc3QgY29uc3RydWN0cy5cbi8vXG4vLyBUaGVzZSBmdW5jdGlvbnMgZGVsaWJlcmF0ZWx5IHN1cHBvcnQgYm90aCBhc3NpZ25tZW50IGFuZCBiaW5kaW5nIGNvbnN0cnVjdHMsXG4vLyBhcyB0aGUgbG9naWMgZm9yIGJvdGggaXMgZXhjZWVkaW5nbHkgc2ltaWxhci4gSWYgdGhlIG5vZGUgaXMgdGhlIHRhcmdldCBvZlxuLy8gYW4gYXNzaWdubWVudCwgdGhlbiBiaW5kaW5nVHlwZSBzaG91bGQgYmUgc2V0IHRvIEJJTkRfTk9ORS4gT3RoZXJ3aXNlLCBpdFxuLy8gc2hvdWxkIGJlIHNldCB0byB0aGUgYXBwcm9wcmlhdGUgQklORF8qIGNvbnN0YW50LCBsaWtlIEJJTkRfVkFSIG9yXG4vLyBCSU5EX0xFWElDQUwuXG4vL1xuLy8gSWYgdGhlIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aXRoIGEgbm9uLUJJTkRfTk9ORSBiaW5kaW5nVHlwZSwgdGhlblxuLy8gYWRkaXRpb25hbGx5IGEgY2hlY2tDbGFzaGVzIG9iamVjdCBtYXkgYmUgc3BlY2lmaWVkIHRvIGFsbG93IGNoZWNraW5nIGZvclxuLy8gZHVwbGljYXRlIGFyZ3VtZW50IG5hbWVzLiBjaGVja0NsYXNoZXMgaXMgaWdub3JlZCBpZiB0aGUgcHJvdmlkZWQgY29uc3RydWN0XG4vLyBpcyBhbiBhc3NpZ25tZW50IChpLmUuLCBiaW5kaW5nVHlwZSBpcyBCSU5EX05PTkUpLlxuXG5wcCQ3LmNoZWNrTFZhbFNpbXBsZSA9IGZ1bmN0aW9uKGV4cHIsIGJpbmRpbmdUeXBlLCBjaGVja0NsYXNoZXMpIHtcbiAgaWYgKCBiaW5kaW5nVHlwZSA9PT0gdm9pZCAwICkgYmluZGluZ1R5cGUgPSBCSU5EX05PTkU7XG5cbiAgdmFyIGlzQmluZCA9IGJpbmRpbmdUeXBlICE9PSBCSU5EX05PTkU7XG5cbiAgc3dpdGNoIChleHByLnR5cGUpIHtcbiAgY2FzZSBcIklkZW50aWZpZXJcIjpcbiAgICBpZiAodGhpcy5zdHJpY3QgJiYgdGhpcy5yZXNlcnZlZFdvcmRzU3RyaWN0QmluZC50ZXN0KGV4cHIubmFtZSkpXG4gICAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShleHByLnN0YXJ0LCAoaXNCaW5kID8gXCJCaW5kaW5nIFwiIDogXCJBc3NpZ25pbmcgdG8gXCIpICsgZXhwci5uYW1lICsgXCIgaW4gc3RyaWN0IG1vZGVcIik7IH1cbiAgICBpZiAoaXNCaW5kKSB7XG4gICAgICBpZiAoYmluZGluZ1R5cGUgPT09IEJJTkRfTEVYSUNBTCAmJiBleHByLm5hbWUgPT09IFwibGV0XCIpXG4gICAgICAgIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKGV4cHIuc3RhcnQsIFwibGV0IGlzIGRpc2FsbG93ZWQgYXMgYSBsZXhpY2FsbHkgYm91bmQgbmFtZVwiKTsgfVxuICAgICAgaWYgKGNoZWNrQ2xhc2hlcykge1xuICAgICAgICBpZiAoaGFzT3duKGNoZWNrQ2xhc2hlcywgZXhwci5uYW1lKSlcbiAgICAgICAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShleHByLnN0YXJ0LCBcIkFyZ3VtZW50IG5hbWUgY2xhc2hcIik7IH1cbiAgICAgICAgY2hlY2tDbGFzaGVzW2V4cHIubmFtZV0gPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKGJpbmRpbmdUeXBlICE9PSBCSU5EX09VVFNJREUpIHsgdGhpcy5kZWNsYXJlTmFtZShleHByLm5hbWUsIGJpbmRpbmdUeXBlLCBleHByLnN0YXJ0KTsgfVxuICAgIH1cbiAgICBicmVha1xuXG4gIGNhc2UgXCJDaGFpbkV4cHJlc3Npb25cIjpcbiAgICB0aGlzLnJhaXNlUmVjb3ZlcmFibGUoZXhwci5zdGFydCwgXCJPcHRpb25hbCBjaGFpbmluZyBjYW5ub3QgYXBwZWFyIGluIGxlZnQtaGFuZCBzaWRlXCIpO1xuICAgIGJyZWFrXG5cbiAgY2FzZSBcIk1lbWJlckV4cHJlc3Npb25cIjpcbiAgICBpZiAoaXNCaW5kKSB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShleHByLnN0YXJ0LCBcIkJpbmRpbmcgbWVtYmVyIGV4cHJlc3Npb25cIik7IH1cbiAgICBicmVha1xuXG4gIGNhc2UgXCJQYXJlbnRoZXNpemVkRXhwcmVzc2lvblwiOlxuICAgIGlmIChpc0JpbmQpIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKGV4cHIuc3RhcnQsIFwiQmluZGluZyBwYXJlbnRoZXNpemVkIGV4cHJlc3Npb25cIik7IH1cbiAgICByZXR1cm4gdGhpcy5jaGVja0xWYWxTaW1wbGUoZXhwci5leHByZXNzaW9uLCBiaW5kaW5nVHlwZSwgY2hlY2tDbGFzaGVzKVxuXG4gIGRlZmF1bHQ6XG4gICAgdGhpcy5yYWlzZShleHByLnN0YXJ0LCAoaXNCaW5kID8gXCJCaW5kaW5nXCIgOiBcIkFzc2lnbmluZyB0b1wiKSArIFwiIHJ2YWx1ZVwiKTtcbiAgfVxufTtcblxucHAkNy5jaGVja0xWYWxQYXR0ZXJuID0gZnVuY3Rpb24oZXhwciwgYmluZGluZ1R5cGUsIGNoZWNrQ2xhc2hlcykge1xuICBpZiAoIGJpbmRpbmdUeXBlID09PSB2b2lkIDAgKSBiaW5kaW5nVHlwZSA9IEJJTkRfTk9ORTtcblxuICBzd2l0Y2ggKGV4cHIudHlwZSkge1xuICBjYXNlIFwiT2JqZWN0UGF0dGVyblwiOlxuICAgIGZvciAodmFyIGkgPSAwLCBsaXN0ID0gZXhwci5wcm9wZXJ0aWVzOyBpIDwgbGlzdC5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgdmFyIHByb3AgPSBsaXN0W2ldO1xuXG4gICAgdGhpcy5jaGVja0xWYWxJbm5lclBhdHRlcm4ocHJvcCwgYmluZGluZ1R5cGUsIGNoZWNrQ2xhc2hlcyk7XG4gICAgfVxuICAgIGJyZWFrXG5cbiAgY2FzZSBcIkFycmF5UGF0dGVyblwiOlxuICAgIGZvciAodmFyIGkkMSA9IDAsIGxpc3QkMSA9IGV4cHIuZWxlbWVudHM7IGkkMSA8IGxpc3QkMS5sZW5ndGg7IGkkMSArPSAxKSB7XG4gICAgICB2YXIgZWxlbSA9IGxpc3QkMVtpJDFdO1xuXG4gICAgaWYgKGVsZW0pIHsgdGhpcy5jaGVja0xWYWxJbm5lclBhdHRlcm4oZWxlbSwgYmluZGluZ1R5cGUsIGNoZWNrQ2xhc2hlcyk7IH1cbiAgICB9XG4gICAgYnJlYWtcblxuICBkZWZhdWx0OlxuICAgIHRoaXMuY2hlY2tMVmFsU2ltcGxlKGV4cHIsIGJpbmRpbmdUeXBlLCBjaGVja0NsYXNoZXMpO1xuICB9XG59O1xuXG5wcCQ3LmNoZWNrTFZhbElubmVyUGF0dGVybiA9IGZ1bmN0aW9uKGV4cHIsIGJpbmRpbmdUeXBlLCBjaGVja0NsYXNoZXMpIHtcbiAgaWYgKCBiaW5kaW5nVHlwZSA9PT0gdm9pZCAwICkgYmluZGluZ1R5cGUgPSBCSU5EX05PTkU7XG5cbiAgc3dpdGNoIChleHByLnR5cGUpIHtcbiAgY2FzZSBcIlByb3BlcnR5XCI6XG4gICAgLy8gQXNzaWdubWVudFByb3BlcnR5IGhhcyB0eXBlID09PSBcIlByb3BlcnR5XCJcbiAgICB0aGlzLmNoZWNrTFZhbElubmVyUGF0dGVybihleHByLnZhbHVlLCBiaW5kaW5nVHlwZSwgY2hlY2tDbGFzaGVzKTtcbiAgICBicmVha1xuXG4gIGNhc2UgXCJBc3NpZ25tZW50UGF0dGVyblwiOlxuICAgIHRoaXMuY2hlY2tMVmFsUGF0dGVybihleHByLmxlZnQsIGJpbmRpbmdUeXBlLCBjaGVja0NsYXNoZXMpO1xuICAgIGJyZWFrXG5cbiAgY2FzZSBcIlJlc3RFbGVtZW50XCI6XG4gICAgdGhpcy5jaGVja0xWYWxQYXR0ZXJuKGV4cHIuYXJndW1lbnQsIGJpbmRpbmdUeXBlLCBjaGVja0NsYXNoZXMpO1xuICAgIGJyZWFrXG5cbiAgZGVmYXVsdDpcbiAgICB0aGlzLmNoZWNrTFZhbFBhdHRlcm4oZXhwciwgYmluZGluZ1R5cGUsIGNoZWNrQ2xhc2hlcyk7XG4gIH1cbn07XG5cbi8vIFRoZSBhbGdvcml0aG0gdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBhIHJlZ2V4cCBjYW4gYXBwZWFyIGF0IGFcbi8vIGdpdmVuIHBvaW50IGluIHRoZSBwcm9ncmFtIGlzIGxvb3NlbHkgYmFzZWQgb24gc3dlZXQuanMnIGFwcHJvYWNoLlxuLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tb3ppbGxhL3N3ZWV0LmpzL3dpa2kvZGVzaWduXG5cblxudmFyIFRva0NvbnRleHQgPSBmdW5jdGlvbiBUb2tDb250ZXh0KHRva2VuLCBpc0V4cHIsIHByZXNlcnZlU3BhY2UsIG92ZXJyaWRlLCBnZW5lcmF0b3IpIHtcbiAgdGhpcy50b2tlbiA9IHRva2VuO1xuICB0aGlzLmlzRXhwciA9ICEhaXNFeHByO1xuICB0aGlzLnByZXNlcnZlU3BhY2UgPSAhIXByZXNlcnZlU3BhY2U7XG4gIHRoaXMub3ZlcnJpZGUgPSBvdmVycmlkZTtcbiAgdGhpcy5nZW5lcmF0b3IgPSAhIWdlbmVyYXRvcjtcbn07XG5cbnZhciB0eXBlcyA9IHtcbiAgYl9zdGF0OiBuZXcgVG9rQ29udGV4dChcIntcIiwgZmFsc2UpLFxuICBiX2V4cHI6IG5ldyBUb2tDb250ZXh0KFwie1wiLCB0cnVlKSxcbiAgYl90bXBsOiBuZXcgVG9rQ29udGV4dChcIiR7XCIsIGZhbHNlKSxcbiAgcF9zdGF0OiBuZXcgVG9rQ29udGV4dChcIihcIiwgZmFsc2UpLFxuICBwX2V4cHI6IG5ldyBUb2tDb250ZXh0KFwiKFwiLCB0cnVlKSxcbiAgcV90bXBsOiBuZXcgVG9rQ29udGV4dChcImBcIiwgdHJ1ZSwgdHJ1ZSwgZnVuY3Rpb24gKHApIHsgcmV0dXJuIHAudHJ5UmVhZFRlbXBsYXRlVG9rZW4oKTsgfSksXG4gIGZfc3RhdDogbmV3IFRva0NvbnRleHQoXCJmdW5jdGlvblwiLCBmYWxzZSksXG4gIGZfZXhwcjogbmV3IFRva0NvbnRleHQoXCJmdW5jdGlvblwiLCB0cnVlKSxcbiAgZl9leHByX2dlbjogbmV3IFRva0NvbnRleHQoXCJmdW5jdGlvblwiLCB0cnVlLCBmYWxzZSwgbnVsbCwgdHJ1ZSksXG4gIGZfZ2VuOiBuZXcgVG9rQ29udGV4dChcImZ1bmN0aW9uXCIsIGZhbHNlLCBmYWxzZSwgbnVsbCwgdHJ1ZSlcbn07XG5cbnZhciBwcCQ2ID0gUGFyc2VyLnByb3RvdHlwZTtcblxucHAkNi5pbml0aWFsQ29udGV4dCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gW3R5cGVzLmJfc3RhdF1cbn07XG5cbnBwJDYuY3VyQ29udGV4dCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5jb250ZXh0W3RoaXMuY29udGV4dC5sZW5ndGggLSAxXVxufTtcblxucHAkNi5icmFjZUlzQmxvY2sgPSBmdW5jdGlvbihwcmV2VHlwZSkge1xuICB2YXIgcGFyZW50ID0gdGhpcy5jdXJDb250ZXh0KCk7XG4gIGlmIChwYXJlbnQgPT09IHR5cGVzLmZfZXhwciB8fCBwYXJlbnQgPT09IHR5cGVzLmZfc3RhdClcbiAgICB7IHJldHVybiB0cnVlIH1cbiAgaWYgKHByZXZUeXBlID09PSB0eXBlcyQxLmNvbG9uICYmIChwYXJlbnQgPT09IHR5cGVzLmJfc3RhdCB8fCBwYXJlbnQgPT09IHR5cGVzLmJfZXhwcikpXG4gICAgeyByZXR1cm4gIXBhcmVudC5pc0V4cHIgfVxuXG4gIC8vIFRoZSBjaGVjayBmb3IgYHR0Lm5hbWUgJiYgZXhwckFsbG93ZWRgIGRldGVjdHMgd2hldGhlciB3ZSBhcmVcbiAgLy8gYWZ0ZXIgYSBgeWllbGRgIG9yIGBvZmAgY29uc3RydWN0LiBTZWUgdGhlIGB1cGRhdGVDb250ZXh0YCBmb3JcbiAgLy8gYHR0Lm5hbWVgLlxuICBpZiAocHJldlR5cGUgPT09IHR5cGVzJDEuX3JldHVybiB8fCBwcmV2VHlwZSA9PT0gdHlwZXMkMS5uYW1lICYmIHRoaXMuZXhwckFsbG93ZWQpXG4gICAgeyByZXR1cm4gbGluZUJyZWFrLnRlc3QodGhpcy5pbnB1dC5zbGljZSh0aGlzLmxhc3RUb2tFbmQsIHRoaXMuc3RhcnQpKSB9XG4gIGlmIChwcmV2VHlwZSA9PT0gdHlwZXMkMS5fZWxzZSB8fCBwcmV2VHlwZSA9PT0gdHlwZXMkMS5zZW1pIHx8IHByZXZUeXBlID09PSB0eXBlcyQxLmVvZiB8fCBwcmV2VHlwZSA9PT0gdHlwZXMkMS5wYXJlblIgfHwgcHJldlR5cGUgPT09IHR5cGVzJDEuYXJyb3cpXG4gICAgeyByZXR1cm4gdHJ1ZSB9XG4gIGlmIChwcmV2VHlwZSA9PT0gdHlwZXMkMS5icmFjZUwpXG4gICAgeyByZXR1cm4gcGFyZW50ID09PSB0eXBlcy5iX3N0YXQgfVxuICBpZiAocHJldlR5cGUgPT09IHR5cGVzJDEuX3ZhciB8fCBwcmV2VHlwZSA9PT0gdHlwZXMkMS5fY29uc3QgfHwgcHJldlR5cGUgPT09IHR5cGVzJDEubmFtZSlcbiAgICB7IHJldHVybiBmYWxzZSB9XG4gIHJldHVybiAhdGhpcy5leHByQWxsb3dlZFxufTtcblxucHAkNi5pbkdlbmVyYXRvckNvbnRleHQgPSBmdW5jdGlvbigpIHtcbiAgZm9yICh2YXIgaSA9IHRoaXMuY29udGV4dC5sZW5ndGggLSAxOyBpID49IDE7IGktLSkge1xuICAgIHZhciBjb250ZXh0ID0gdGhpcy5jb250ZXh0W2ldO1xuICAgIGlmIChjb250ZXh0LnRva2VuID09PSBcImZ1bmN0aW9uXCIpXG4gICAgICB7IHJldHVybiBjb250ZXh0LmdlbmVyYXRvciB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG5wcCQ2LnVwZGF0ZUNvbnRleHQgPSBmdW5jdGlvbihwcmV2VHlwZSkge1xuICB2YXIgdXBkYXRlLCB0eXBlID0gdGhpcy50eXBlO1xuICBpZiAodHlwZS5rZXl3b3JkICYmIHByZXZUeXBlID09PSB0eXBlcyQxLmRvdClcbiAgICB7IHRoaXMuZXhwckFsbG93ZWQgPSBmYWxzZTsgfVxuICBlbHNlIGlmICh1cGRhdGUgPSB0eXBlLnVwZGF0ZUNvbnRleHQpXG4gICAgeyB1cGRhdGUuY2FsbCh0aGlzLCBwcmV2VHlwZSk7IH1cbiAgZWxzZVxuICAgIHsgdGhpcy5leHByQWxsb3dlZCA9IHR5cGUuYmVmb3JlRXhwcjsgfVxufTtcblxuLy8gVXNlZCB0byBoYW5kbGUgZWRnZSBjYXNlcyB3aGVuIHRva2VuIGNvbnRleHQgY291bGQgbm90IGJlIGluZmVycmVkIGNvcnJlY3RseSBkdXJpbmcgdG9rZW5pemF0aW9uIHBoYXNlXG5cbnBwJDYub3ZlcnJpZGVDb250ZXh0ID0gZnVuY3Rpb24odG9rZW5DdHgpIHtcbiAgaWYgKHRoaXMuY3VyQ29udGV4dCgpICE9PSB0b2tlbkN0eCkge1xuICAgIHRoaXMuY29udGV4dFt0aGlzLmNvbnRleHQubGVuZ3RoIC0gMV0gPSB0b2tlbkN0eDtcbiAgfVxufTtcblxuLy8gVG9rZW4tc3BlY2lmaWMgY29udGV4dCB1cGRhdGUgY29kZVxuXG50eXBlcyQxLnBhcmVuUi51cGRhdGVDb250ZXh0ID0gdHlwZXMkMS5icmFjZVIudXBkYXRlQ29udGV4dCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5jb250ZXh0Lmxlbmd0aCA9PT0gMSkge1xuICAgIHRoaXMuZXhwckFsbG93ZWQgPSB0cnVlO1xuICAgIHJldHVyblxuICB9XG4gIHZhciBvdXQgPSB0aGlzLmNvbnRleHQucG9wKCk7XG4gIGlmIChvdXQgPT09IHR5cGVzLmJfc3RhdCAmJiB0aGlzLmN1ckNvbnRleHQoKS50b2tlbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgb3V0ID0gdGhpcy5jb250ZXh0LnBvcCgpO1xuICB9XG4gIHRoaXMuZXhwckFsbG93ZWQgPSAhb3V0LmlzRXhwcjtcbn07XG5cbnR5cGVzJDEuYnJhY2VMLnVwZGF0ZUNvbnRleHQgPSBmdW5jdGlvbihwcmV2VHlwZSkge1xuICB0aGlzLmNvbnRleHQucHVzaCh0aGlzLmJyYWNlSXNCbG9jayhwcmV2VHlwZSkgPyB0eXBlcy5iX3N0YXQgOiB0eXBlcy5iX2V4cHIpO1xuICB0aGlzLmV4cHJBbGxvd2VkID0gdHJ1ZTtcbn07XG5cbnR5cGVzJDEuZG9sbGFyQnJhY2VMLnVwZGF0ZUNvbnRleHQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5jb250ZXh0LnB1c2godHlwZXMuYl90bXBsKTtcbiAgdGhpcy5leHByQWxsb3dlZCA9IHRydWU7XG59O1xuXG50eXBlcyQxLnBhcmVuTC51cGRhdGVDb250ZXh0ID0gZnVuY3Rpb24ocHJldlR5cGUpIHtcbiAgdmFyIHN0YXRlbWVudFBhcmVucyA9IHByZXZUeXBlID09PSB0eXBlcyQxLl9pZiB8fCBwcmV2VHlwZSA9PT0gdHlwZXMkMS5fZm9yIHx8IHByZXZUeXBlID09PSB0eXBlcyQxLl93aXRoIHx8IHByZXZUeXBlID09PSB0eXBlcyQxLl93aGlsZTtcbiAgdGhpcy5jb250ZXh0LnB1c2goc3RhdGVtZW50UGFyZW5zID8gdHlwZXMucF9zdGF0IDogdHlwZXMucF9leHByKTtcbiAgdGhpcy5leHByQWxsb3dlZCA9IHRydWU7XG59O1xuXG50eXBlcyQxLmluY0RlYy51cGRhdGVDb250ZXh0ID0gZnVuY3Rpb24oKSB7XG4gIC8vIHRva0V4cHJBbGxvd2VkIHN0YXlzIHVuY2hhbmdlZFxufTtcblxudHlwZXMkMS5fZnVuY3Rpb24udXBkYXRlQ29udGV4dCA9IHR5cGVzJDEuX2NsYXNzLnVwZGF0ZUNvbnRleHQgPSBmdW5jdGlvbihwcmV2VHlwZSkge1xuICBpZiAocHJldlR5cGUuYmVmb3JlRXhwciAmJiBwcmV2VHlwZSAhPT0gdHlwZXMkMS5fZWxzZSAmJlxuICAgICAgIShwcmV2VHlwZSA9PT0gdHlwZXMkMS5zZW1pICYmIHRoaXMuY3VyQ29udGV4dCgpICE9PSB0eXBlcy5wX3N0YXQpICYmXG4gICAgICAhKHByZXZUeXBlID09PSB0eXBlcyQxLl9yZXR1cm4gJiYgbGluZUJyZWFrLnRlc3QodGhpcy5pbnB1dC5zbGljZSh0aGlzLmxhc3RUb2tFbmQsIHRoaXMuc3RhcnQpKSkgJiZcbiAgICAgICEoKHByZXZUeXBlID09PSB0eXBlcyQxLmNvbG9uIHx8IHByZXZUeXBlID09PSB0eXBlcyQxLmJyYWNlTCkgJiYgdGhpcy5jdXJDb250ZXh0KCkgPT09IHR5cGVzLmJfc3RhdCkpXG4gICAgeyB0aGlzLmNvbnRleHQucHVzaCh0eXBlcy5mX2V4cHIpOyB9XG4gIGVsc2VcbiAgICB7IHRoaXMuY29udGV4dC5wdXNoKHR5cGVzLmZfc3RhdCk7IH1cbiAgdGhpcy5leHByQWxsb3dlZCA9IGZhbHNlO1xufTtcblxudHlwZXMkMS5jb2xvbi51cGRhdGVDb250ZXh0ID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmN1ckNvbnRleHQoKS50b2tlbiA9PT0gXCJmdW5jdGlvblwiKSB7IHRoaXMuY29udGV4dC5wb3AoKTsgfVxuICB0aGlzLmV4cHJBbGxvd2VkID0gdHJ1ZTtcbn07XG5cbnR5cGVzJDEuYmFja1F1b3RlLnVwZGF0ZUNvbnRleHQgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuY3VyQ29udGV4dCgpID09PSB0eXBlcy5xX3RtcGwpXG4gICAgeyB0aGlzLmNvbnRleHQucG9wKCk7IH1cbiAgZWxzZVxuICAgIHsgdGhpcy5jb250ZXh0LnB1c2godHlwZXMucV90bXBsKTsgfVxuICB0aGlzLmV4cHJBbGxvd2VkID0gZmFsc2U7XG59O1xuXG50eXBlcyQxLnN0YXIudXBkYXRlQ29udGV4dCA9IGZ1bmN0aW9uKHByZXZUeXBlKSB7XG4gIGlmIChwcmV2VHlwZSA9PT0gdHlwZXMkMS5fZnVuY3Rpb24pIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLmNvbnRleHQubGVuZ3RoIC0gMTtcbiAgICBpZiAodGhpcy5jb250ZXh0W2luZGV4XSA9PT0gdHlwZXMuZl9leHByKVxuICAgICAgeyB0aGlzLmNvbnRleHRbaW5kZXhdID0gdHlwZXMuZl9leHByX2dlbjsgfVxuICAgIGVsc2VcbiAgICAgIHsgdGhpcy5jb250ZXh0W2luZGV4XSA9IHR5cGVzLmZfZ2VuOyB9XG4gIH1cbiAgdGhpcy5leHByQWxsb3dlZCA9IHRydWU7XG59O1xuXG50eXBlcyQxLm5hbWUudXBkYXRlQ29udGV4dCA9IGZ1bmN0aW9uKHByZXZUeXBlKSB7XG4gIHZhciBhbGxvd2VkID0gZmFsc2U7XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNiAmJiBwcmV2VHlwZSAhPT0gdHlwZXMkMS5kb3QpIHtcbiAgICBpZiAodGhpcy52YWx1ZSA9PT0gXCJvZlwiICYmICF0aGlzLmV4cHJBbGxvd2VkIHx8XG4gICAgICAgIHRoaXMudmFsdWUgPT09IFwieWllbGRcIiAmJiB0aGlzLmluR2VuZXJhdG9yQ29udGV4dCgpKVxuICAgICAgeyBhbGxvd2VkID0gdHJ1ZTsgfVxuICB9XG4gIHRoaXMuZXhwckFsbG93ZWQgPSBhbGxvd2VkO1xufTtcblxuLy8gQSByZWN1cnNpdmUgZGVzY2VudCBwYXJzZXIgb3BlcmF0ZXMgYnkgZGVmaW5pbmcgZnVuY3Rpb25zIGZvciBhbGxcbi8vIHN5bnRhY3RpYyBlbGVtZW50cywgYW5kIHJlY3Vyc2l2ZWx5IGNhbGxpbmcgdGhvc2UsIGVhY2ggZnVuY3Rpb25cbi8vIGFkdmFuY2luZyB0aGUgaW5wdXQgc3RyZWFtIGFuZCByZXR1cm5pbmcgYW4gQVNUIG5vZGUuIFByZWNlZGVuY2Vcbi8vIG9mIGNvbnN0cnVjdHMgKGZvciBleGFtcGxlLCB0aGUgZmFjdCB0aGF0IGAheFsxXWAgbWVhbnMgYCEoeFsxXSlgXG4vLyBpbnN0ZWFkIG9mIGAoIXgpWzFdYCBpcyBoYW5kbGVkIGJ5IHRoZSBmYWN0IHRoYXQgdGhlIHBhcnNlclxuLy8gZnVuY3Rpb24gdGhhdCBwYXJzZXMgdW5hcnkgcHJlZml4IG9wZXJhdG9ycyBpcyBjYWxsZWQgZmlyc3QsIGFuZFxuLy8gaW4gdHVybiBjYWxscyB0aGUgZnVuY3Rpb24gdGhhdCBwYXJzZXMgYFtdYCBzdWJzY3JpcHRzIFx1MjAxNCB0aGF0XG4vLyB3YXksIGl0J2xsIHJlY2VpdmUgdGhlIG5vZGUgZm9yIGB4WzFdYCBhbHJlYWR5IHBhcnNlZCwgYW5kIHdyYXBzXG4vLyAqdGhhdCogaW4gdGhlIHVuYXJ5IG9wZXJhdG9yIG5vZGUuXG4vL1xuLy8gQWNvcm4gdXNlcyBhbiBbb3BlcmF0b3IgcHJlY2VkZW5jZSBwYXJzZXJdW29wcF0gdG8gaGFuZGxlIGJpbmFyeVxuLy8gb3BlcmF0b3IgcHJlY2VkZW5jZSwgYmVjYXVzZSBpdCBpcyBtdWNoIG1vcmUgY29tcGFjdCB0aGFuIHVzaW5nXG4vLyB0aGUgdGVjaG5pcXVlIG91dGxpbmVkIGFib3ZlLCB3aGljaCB1c2VzIGRpZmZlcmVudCwgbmVzdGluZ1xuLy8gZnVuY3Rpb25zIHRvIHNwZWNpZnkgcHJlY2VkZW5jZSwgZm9yIGFsbCBvZiB0aGUgdGVuIGJpbmFyeVxuLy8gcHJlY2VkZW5jZSBsZXZlbHMgdGhhdCBKYXZhU2NyaXB0IGRlZmluZXMuXG4vL1xuLy8gW29wcF06IGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvT3BlcmF0b3ItcHJlY2VkZW5jZV9wYXJzZXJcblxuXG52YXIgcHAkNSA9IFBhcnNlci5wcm90b3R5cGU7XG5cbi8vIENoZWNrIGlmIHByb3BlcnR5IG5hbWUgY2xhc2hlcyB3aXRoIGFscmVhZHkgYWRkZWQuXG4vLyBPYmplY3QvY2xhc3MgZ2V0dGVycyBhbmQgc2V0dGVycyBhcmUgbm90IGFsbG93ZWQgdG8gY2xhc2ggXHUyMDE0XG4vLyBlaXRoZXIgd2l0aCBlYWNoIG90aGVyIG9yIHdpdGggYW4gaW5pdCBwcm9wZXJ0eSBcdTIwMTQgYW5kIGluXG4vLyBzdHJpY3QgbW9kZSwgaW5pdCBwcm9wZXJ0aWVzIGFyZSBhbHNvIG5vdCBhbGxvd2VkIHRvIGJlIHJlcGVhdGVkLlxuXG5wcCQ1LmNoZWNrUHJvcENsYXNoID0gZnVuY3Rpb24ocHJvcCwgcHJvcEhhc2gsIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpIHtcbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA5ICYmIHByb3AudHlwZSA9PT0gXCJTcHJlYWRFbGVtZW50XCIpXG4gICAgeyByZXR1cm4gfVxuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDYgJiYgKHByb3AuY29tcHV0ZWQgfHwgcHJvcC5tZXRob2QgfHwgcHJvcC5zaG9ydGhhbmQpKVxuICAgIHsgcmV0dXJuIH1cbiAgdmFyIGtleSA9IHByb3Aua2V5O1xuICB2YXIgbmFtZTtcbiAgc3dpdGNoIChrZXkudHlwZSkge1xuICBjYXNlIFwiSWRlbnRpZmllclwiOiBuYW1lID0ga2V5Lm5hbWU7IGJyZWFrXG4gIGNhc2UgXCJMaXRlcmFsXCI6IG5hbWUgPSBTdHJpbmcoa2V5LnZhbHVlKTsgYnJlYWtcbiAgZGVmYXVsdDogcmV0dXJuXG4gIH1cbiAgdmFyIGtpbmQgPSBwcm9wLmtpbmQ7XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNikge1xuICAgIGlmIChuYW1lID09PSBcIl9fcHJvdG9fX1wiICYmIGtpbmQgPT09IFwiaW5pdFwiKSB7XG4gICAgICBpZiAocHJvcEhhc2gucHJvdG8pIHtcbiAgICAgICAgaWYgKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpIHtcbiAgICAgICAgICBpZiAocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy5kb3VibGVQcm90byA8IDApIHtcbiAgICAgICAgICAgIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMuZG91YmxlUHJvdG8gPSBrZXkuc3RhcnQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMucmFpc2VSZWNvdmVyYWJsZShrZXkuc3RhcnQsIFwiUmVkZWZpbml0aW9uIG9mIF9fcHJvdG9fXyBwcm9wZXJ0eVwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcHJvcEhhc2gucHJvdG8gPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm5cbiAgfVxuICBuYW1lID0gXCIkXCIgKyBuYW1lO1xuICB2YXIgb3RoZXIgPSBwcm9wSGFzaFtuYW1lXTtcbiAgaWYgKG90aGVyKSB7XG4gICAgdmFyIHJlZGVmaW5pdGlvbjtcbiAgICBpZiAoa2luZCA9PT0gXCJpbml0XCIpIHtcbiAgICAgIHJlZGVmaW5pdGlvbiA9IHRoaXMuc3RyaWN0ICYmIG90aGVyLmluaXQgfHwgb3RoZXIuZ2V0IHx8IG90aGVyLnNldDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVkZWZpbml0aW9uID0gb3RoZXIuaW5pdCB8fCBvdGhlcltraW5kXTtcbiAgICB9XG4gICAgaWYgKHJlZGVmaW5pdGlvbilcbiAgICAgIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKGtleS5zdGFydCwgXCJSZWRlZmluaXRpb24gb2YgcHJvcGVydHlcIik7IH1cbiAgfSBlbHNlIHtcbiAgICBvdGhlciA9IHByb3BIYXNoW25hbWVdID0ge1xuICAgICAgaW5pdDogZmFsc2UsXG4gICAgICBnZXQ6IGZhbHNlLFxuICAgICAgc2V0OiBmYWxzZVxuICAgIH07XG4gIH1cbiAgb3RoZXJba2luZF0gPSB0cnVlO1xufTtcblxuLy8gIyMjIEV4cHJlc3Npb24gcGFyc2luZ1xuXG4vLyBUaGVzZSBuZXN0LCBmcm9tIHRoZSBtb3N0IGdlbmVyYWwgZXhwcmVzc2lvbiB0eXBlIGF0IHRoZSB0b3AgdG9cbi8vICdhdG9taWMnLCBub25kaXZpc2libGUgZXhwcmVzc2lvbiB0eXBlcyBhdCB0aGUgYm90dG9tLiBNb3N0IG9mXG4vLyB0aGUgZnVuY3Rpb25zIHdpbGwgc2ltcGx5IGxldCB0aGUgZnVuY3Rpb24ocykgYmVsb3cgdGhlbSBwYXJzZSxcbi8vIGFuZCwgKmlmKiB0aGUgc3ludGFjdGljIGNvbnN0cnVjdCB0aGV5IGhhbmRsZSBpcyBwcmVzZW50LCB3cmFwXG4vLyB0aGUgQVNUIG5vZGUgdGhhdCB0aGUgaW5uZXIgcGFyc2VyIGdhdmUgdGhlbSBpbiBhbm90aGVyIG5vZGUuXG5cbi8vIFBhcnNlIGEgZnVsbCBleHByZXNzaW9uLiBUaGUgb3B0aW9uYWwgYXJndW1lbnRzIGFyZSB1c2VkIHRvXG4vLyBmb3JiaWQgdGhlIGBpbmAgb3BlcmF0b3IgKGluIGZvciBsb29wcyBpbml0YWxpemF0aW9uIGV4cHJlc3Npb25zKVxuLy8gYW5kIHByb3ZpZGUgcmVmZXJlbmNlIGZvciBzdG9yaW5nICc9JyBvcGVyYXRvciBpbnNpZGUgc2hvcnRoYW5kXG4vLyBwcm9wZXJ0eSBhc3NpZ25tZW50IGluIGNvbnRleHRzIHdoZXJlIGJvdGggb2JqZWN0IGV4cHJlc3Npb25cbi8vIGFuZCBvYmplY3QgcGF0dGVybiBtaWdodCBhcHBlYXIgKHNvIGl0J3MgcG9zc2libGUgdG8gcmFpc2Vcbi8vIGRlbGF5ZWQgc3ludGF4IGVycm9yIGF0IGNvcnJlY3QgcG9zaXRpb24pLlxuXG5wcCQ1LnBhcnNlRXhwcmVzc2lvbiA9IGZ1bmN0aW9uKGZvckluaXQsIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpIHtcbiAgdmFyIHN0YXJ0UG9zID0gdGhpcy5zdGFydCwgc3RhcnRMb2MgPSB0aGlzLnN0YXJ0TG9jO1xuICB2YXIgZXhwciA9IHRoaXMucGFyc2VNYXliZUFzc2lnbihmb3JJbml0LCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKTtcbiAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5jb21tYSkge1xuICAgIHZhciBub2RlID0gdGhpcy5zdGFydE5vZGVBdChzdGFydFBvcywgc3RhcnRMb2MpO1xuICAgIG5vZGUuZXhwcmVzc2lvbnMgPSBbZXhwcl07XG4gICAgd2hpbGUgKHRoaXMuZWF0KHR5cGVzJDEuY29tbWEpKSB7IG5vZGUuZXhwcmVzc2lvbnMucHVzaCh0aGlzLnBhcnNlTWF5YmVBc3NpZ24oZm9ySW5pdCwgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykpOyB9XG4gICAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIlNlcXVlbmNlRXhwcmVzc2lvblwiKVxuICB9XG4gIHJldHVybiBleHByXG59O1xuXG4vLyBQYXJzZSBhbiBhc3NpZ25tZW50IGV4cHJlc3Npb24uIFRoaXMgaW5jbHVkZXMgYXBwbGljYXRpb25zIG9mXG4vLyBvcGVyYXRvcnMgbGlrZSBgKz1gLlxuXG5wcCQ1LnBhcnNlTWF5YmVBc3NpZ24gPSBmdW5jdGlvbihmb3JJbml0LCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCBhZnRlckxlZnRQYXJzZSkge1xuICBpZiAodGhpcy5pc0NvbnRleHR1YWwoXCJ5aWVsZFwiKSkge1xuICAgIGlmICh0aGlzLmluR2VuZXJhdG9yKSB7IHJldHVybiB0aGlzLnBhcnNlWWllbGQoZm9ySW5pdCkgfVxuICAgIC8vIFRoZSB0b2tlbml6ZXIgd2lsbCBhc3N1bWUgYW4gZXhwcmVzc2lvbiBpcyBhbGxvd2VkIGFmdGVyXG4gICAgLy8gYHlpZWxkYCwgYnV0IHRoaXMgaXNuJ3QgdGhhdCBraW5kIG9mIHlpZWxkXG4gICAgZWxzZSB7IHRoaXMuZXhwckFsbG93ZWQgPSBmYWxzZTsgfVxuICB9XG5cbiAgdmFyIG93bkRlc3RydWN0dXJpbmdFcnJvcnMgPSBmYWxzZSwgb2xkUGFyZW5Bc3NpZ24gPSAtMSwgb2xkVHJhaWxpbmdDb21tYSA9IC0xLCBvbGREb3VibGVQcm90byA9IC0xO1xuICBpZiAocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykge1xuICAgIG9sZFBhcmVuQXNzaWduID0gcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy5wYXJlbnRoZXNpemVkQXNzaWduO1xuICAgIG9sZFRyYWlsaW5nQ29tbWEgPSByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnRyYWlsaW5nQ29tbWE7XG4gICAgb2xkRG91YmxlUHJvdG8gPSByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLmRvdWJsZVByb3RvO1xuICAgIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMucGFyZW50aGVzaXplZEFzc2lnbiA9IHJlZkRlc3RydWN0dXJpbmdFcnJvcnMudHJhaWxpbmdDb21tYSA9IC0xO1xuICB9IGVsc2Uge1xuICAgIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMgPSBuZXcgRGVzdHJ1Y3R1cmluZ0Vycm9ycztcbiAgICBvd25EZXN0cnVjdHVyaW5nRXJyb3JzID0gdHJ1ZTtcbiAgfVxuXG4gIHZhciBzdGFydFBvcyA9IHRoaXMuc3RhcnQsIHN0YXJ0TG9jID0gdGhpcy5zdGFydExvYztcbiAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5wYXJlbkwgfHwgdGhpcy50eXBlID09PSB0eXBlcyQxLm5hbWUpIHtcbiAgICB0aGlzLnBvdGVudGlhbEFycm93QXQgPSB0aGlzLnN0YXJ0O1xuICAgIHRoaXMucG90ZW50aWFsQXJyb3dJbkZvckF3YWl0ID0gZm9ySW5pdCA9PT0gXCJhd2FpdFwiO1xuICB9XG4gIHZhciBsZWZ0ID0gdGhpcy5wYXJzZU1heWJlQ29uZGl0aW9uYWwoZm9ySW5pdCwgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycyk7XG4gIGlmIChhZnRlckxlZnRQYXJzZSkgeyBsZWZ0ID0gYWZ0ZXJMZWZ0UGFyc2UuY2FsbCh0aGlzLCBsZWZ0LCBzdGFydFBvcywgc3RhcnRMb2MpOyB9XG4gIGlmICh0aGlzLnR5cGUuaXNBc3NpZ24pIHtcbiAgICB2YXIgbm9kZSA9IHRoaXMuc3RhcnROb2RlQXQoc3RhcnRQb3MsIHN0YXJ0TG9jKTtcbiAgICBub2RlLm9wZXJhdG9yID0gdGhpcy52YWx1ZTtcbiAgICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLmVxKVxuICAgICAgeyBsZWZ0ID0gdGhpcy50b0Fzc2lnbmFibGUobGVmdCwgZmFsc2UsIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpOyB9XG4gICAgaWYgKCFvd25EZXN0cnVjdHVyaW5nRXJyb3JzKSB7XG4gICAgICByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnBhcmVudGhlc2l6ZWRBc3NpZ24gPSByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnRyYWlsaW5nQ29tbWEgPSByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLmRvdWJsZVByb3RvID0gLTE7XG4gICAgfVxuICAgIGlmIChyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnNob3J0aGFuZEFzc2lnbiA+PSBsZWZ0LnN0YXJ0KVxuICAgICAgeyByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnNob3J0aGFuZEFzc2lnbiA9IC0xOyB9IC8vIHJlc2V0IGJlY2F1c2Ugc2hvcnRoYW5kIGRlZmF1bHQgd2FzIHVzZWQgY29ycmVjdGx5XG4gICAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5lcSlcbiAgICAgIHsgdGhpcy5jaGVja0xWYWxQYXR0ZXJuKGxlZnQpOyB9XG4gICAgZWxzZVxuICAgICAgeyB0aGlzLmNoZWNrTFZhbFNpbXBsZShsZWZ0KTsgfVxuICAgIG5vZGUubGVmdCA9IGxlZnQ7XG4gICAgdGhpcy5uZXh0KCk7XG4gICAgbm9kZS5yaWdodCA9IHRoaXMucGFyc2VNYXliZUFzc2lnbihmb3JJbml0KTtcbiAgICBpZiAob2xkRG91YmxlUHJvdG8gPiAtMSkgeyByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLmRvdWJsZVByb3RvID0gb2xkRG91YmxlUHJvdG87IH1cbiAgICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiQXNzaWdubWVudEV4cHJlc3Npb25cIilcbiAgfSBlbHNlIHtcbiAgICBpZiAob3duRGVzdHJ1Y3R1cmluZ0Vycm9ycykgeyB0aGlzLmNoZWNrRXhwcmVzc2lvbkVycm9ycyhyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCB0cnVlKTsgfVxuICB9XG4gIGlmIChvbGRQYXJlbkFzc2lnbiA+IC0xKSB7IHJlZkRlc3RydWN0dXJpbmdFcnJvcnMucGFyZW50aGVzaXplZEFzc2lnbiA9IG9sZFBhcmVuQXNzaWduOyB9XG4gIGlmIChvbGRUcmFpbGluZ0NvbW1hID4gLTEpIHsgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy50cmFpbGluZ0NvbW1hID0gb2xkVHJhaWxpbmdDb21tYTsgfVxuICByZXR1cm4gbGVmdFxufTtcblxuLy8gUGFyc2UgYSB0ZXJuYXJ5IGNvbmRpdGlvbmFsIChgPzpgKSBvcGVyYXRvci5cblxucHAkNS5wYXJzZU1heWJlQ29uZGl0aW9uYWwgPSBmdW5jdGlvbihmb3JJbml0LCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKSB7XG4gIHZhciBzdGFydFBvcyA9IHRoaXMuc3RhcnQsIHN0YXJ0TG9jID0gdGhpcy5zdGFydExvYztcbiAgdmFyIGV4cHIgPSB0aGlzLnBhcnNlRXhwck9wcyhmb3JJbml0LCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKTtcbiAgaWYgKHRoaXMuY2hlY2tFeHByZXNzaW9uRXJyb3JzKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpKSB7IHJldHVybiBleHByIH1cbiAgaWYgKHRoaXMuZWF0KHR5cGVzJDEucXVlc3Rpb24pKSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZUF0KHN0YXJ0UG9zLCBzdGFydExvYyk7XG4gICAgbm9kZS50ZXN0ID0gZXhwcjtcbiAgICBub2RlLmNvbnNlcXVlbnQgPSB0aGlzLnBhcnNlTWF5YmVBc3NpZ24oKTtcbiAgICB0aGlzLmV4cGVjdCh0eXBlcyQxLmNvbG9uKTtcbiAgICBub2RlLmFsdGVybmF0ZSA9IHRoaXMucGFyc2VNYXliZUFzc2lnbihmb3JJbml0KTtcbiAgICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiQ29uZGl0aW9uYWxFeHByZXNzaW9uXCIpXG4gIH1cbiAgcmV0dXJuIGV4cHJcbn07XG5cbi8vIFN0YXJ0IHRoZSBwcmVjZWRlbmNlIHBhcnNlci5cblxucHAkNS5wYXJzZUV4cHJPcHMgPSBmdW5jdGlvbihmb3JJbml0LCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKSB7XG4gIHZhciBzdGFydFBvcyA9IHRoaXMuc3RhcnQsIHN0YXJ0TG9jID0gdGhpcy5zdGFydExvYztcbiAgdmFyIGV4cHIgPSB0aGlzLnBhcnNlTWF5YmVVbmFyeShyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCBmYWxzZSwgZmFsc2UsIGZvckluaXQpO1xuICBpZiAodGhpcy5jaGVja0V4cHJlc3Npb25FcnJvcnMocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykpIHsgcmV0dXJuIGV4cHIgfVxuICByZXR1cm4gZXhwci5zdGFydCA9PT0gc3RhcnRQb3MgJiYgZXhwci50eXBlID09PSBcIkFycm93RnVuY3Rpb25FeHByZXNzaW9uXCIgPyBleHByIDogdGhpcy5wYXJzZUV4cHJPcChleHByLCBzdGFydFBvcywgc3RhcnRMb2MsIC0xLCBmb3JJbml0KVxufTtcblxuLy8gUGFyc2UgYmluYXJ5IG9wZXJhdG9ycyB3aXRoIHRoZSBvcGVyYXRvciBwcmVjZWRlbmNlIHBhcnNpbmdcbi8vIGFsZ29yaXRobS4gYGxlZnRgIGlzIHRoZSBsZWZ0LWhhbmQgc2lkZSBvZiB0aGUgb3BlcmF0b3IuXG4vLyBgbWluUHJlY2AgcHJvdmlkZXMgY29udGV4dCB0aGF0IGFsbG93cyB0aGUgZnVuY3Rpb24gdG8gc3RvcCBhbmRcbi8vIGRlZmVyIGZ1cnRoZXIgcGFyc2VyIHRvIG9uZSBvZiBpdHMgY2FsbGVycyB3aGVuIGl0IGVuY291bnRlcnMgYW5cbi8vIG9wZXJhdG9yIHRoYXQgaGFzIGEgbG93ZXIgcHJlY2VkZW5jZSB0aGFuIHRoZSBzZXQgaXQgaXMgcGFyc2luZy5cblxucHAkNS5wYXJzZUV4cHJPcCA9IGZ1bmN0aW9uKGxlZnQsIGxlZnRTdGFydFBvcywgbGVmdFN0YXJ0TG9jLCBtaW5QcmVjLCBmb3JJbml0KSB7XG4gIHZhciBwcmVjID0gdGhpcy50eXBlLmJpbm9wO1xuICBpZiAocHJlYyAhPSBudWxsICYmICghZm9ySW5pdCB8fCB0aGlzLnR5cGUgIT09IHR5cGVzJDEuX2luKSkge1xuICAgIGlmIChwcmVjID4gbWluUHJlYykge1xuICAgICAgdmFyIGxvZ2ljYWwgPSB0aGlzLnR5cGUgPT09IHR5cGVzJDEubG9naWNhbE9SIHx8IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5sb2dpY2FsQU5EO1xuICAgICAgdmFyIGNvYWxlc2NlID0gdGhpcy50eXBlID09PSB0eXBlcyQxLmNvYWxlc2NlO1xuICAgICAgaWYgKGNvYWxlc2NlKSB7XG4gICAgICAgIC8vIEhhbmRsZSB0aGUgcHJlY2VkZW5jZSBvZiBgdHQuY29hbGVzY2VgIGFzIGVxdWFsIHRvIHRoZSByYW5nZSBvZiBsb2dpY2FsIGV4cHJlc3Npb25zLlxuICAgICAgICAvLyBJbiBvdGhlciB3b3JkcywgYG5vZGUucmlnaHRgIHNob3VsZG4ndCBjb250YWluIGxvZ2ljYWwgZXhwcmVzc2lvbnMgaW4gb3JkZXIgdG8gY2hlY2sgdGhlIG1peGVkIGVycm9yLlxuICAgICAgICBwcmVjID0gdHlwZXMkMS5sb2dpY2FsQU5ELmJpbm9wO1xuICAgICAgfVxuICAgICAgdmFyIG9wID0gdGhpcy52YWx1ZTtcbiAgICAgIHRoaXMubmV4dCgpO1xuICAgICAgdmFyIHN0YXJ0UG9zID0gdGhpcy5zdGFydCwgc3RhcnRMb2MgPSB0aGlzLnN0YXJ0TG9jO1xuICAgICAgdmFyIHJpZ2h0ID0gdGhpcy5wYXJzZUV4cHJPcCh0aGlzLnBhcnNlTWF5YmVVbmFyeShudWxsLCBmYWxzZSwgZmFsc2UsIGZvckluaXQpLCBzdGFydFBvcywgc3RhcnRMb2MsIHByZWMsIGZvckluaXQpO1xuICAgICAgdmFyIG5vZGUgPSB0aGlzLmJ1aWxkQmluYXJ5KGxlZnRTdGFydFBvcywgbGVmdFN0YXJ0TG9jLCBsZWZ0LCByaWdodCwgb3AsIGxvZ2ljYWwgfHwgY29hbGVzY2UpO1xuICAgICAgaWYgKChsb2dpY2FsICYmIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5jb2FsZXNjZSkgfHwgKGNvYWxlc2NlICYmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEubG9naWNhbE9SIHx8IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5sb2dpY2FsQU5EKSkpIHtcbiAgICAgICAgdGhpcy5yYWlzZVJlY292ZXJhYmxlKHRoaXMuc3RhcnQsIFwiTG9naWNhbCBleHByZXNzaW9ucyBhbmQgY29hbGVzY2UgZXhwcmVzc2lvbnMgY2Fubm90IGJlIG1peGVkLiBXcmFwIGVpdGhlciBieSBwYXJlbnRoZXNlc1wiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLnBhcnNlRXhwck9wKG5vZGUsIGxlZnRTdGFydFBvcywgbGVmdFN0YXJ0TG9jLCBtaW5QcmVjLCBmb3JJbml0KVxuICAgIH1cbiAgfVxuICByZXR1cm4gbGVmdFxufTtcblxucHAkNS5idWlsZEJpbmFyeSA9IGZ1bmN0aW9uKHN0YXJ0UG9zLCBzdGFydExvYywgbGVmdCwgcmlnaHQsIG9wLCBsb2dpY2FsKSB7XG4gIGlmIChyaWdodC50eXBlID09PSBcIlByaXZhdGVJZGVudGlmaWVyXCIpIHsgdGhpcy5yYWlzZShyaWdodC5zdGFydCwgXCJQcml2YXRlIGlkZW50aWZpZXIgY2FuIG9ubHkgYmUgbGVmdCBzaWRlIG9mIGJpbmFyeSBleHByZXNzaW9uXCIpOyB9XG4gIHZhciBub2RlID0gdGhpcy5zdGFydE5vZGVBdChzdGFydFBvcywgc3RhcnRMb2MpO1xuICBub2RlLmxlZnQgPSBsZWZ0O1xuICBub2RlLm9wZXJhdG9yID0gb3A7XG4gIG5vZGUucmlnaHQgPSByaWdodDtcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBsb2dpY2FsID8gXCJMb2dpY2FsRXhwcmVzc2lvblwiIDogXCJCaW5hcnlFeHByZXNzaW9uXCIpXG59O1xuXG4vLyBQYXJzZSB1bmFyeSBvcGVyYXRvcnMsIGJvdGggcHJlZml4IGFuZCBwb3N0Zml4LlxuXG5wcCQ1LnBhcnNlTWF5YmVVbmFyeSA9IGZ1bmN0aW9uKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMsIHNhd1VuYXJ5LCBpbmNEZWMsIGZvckluaXQpIHtcbiAgdmFyIHN0YXJ0UG9zID0gdGhpcy5zdGFydCwgc3RhcnRMb2MgPSB0aGlzLnN0YXJ0TG9jLCBleHByO1xuICBpZiAodGhpcy5pc0NvbnRleHR1YWwoXCJhd2FpdFwiKSAmJiB0aGlzLmNhbkF3YWl0KSB7XG4gICAgZXhwciA9IHRoaXMucGFyc2VBd2FpdChmb3JJbml0KTtcbiAgICBzYXdVbmFyeSA9IHRydWU7XG4gIH0gZWxzZSBpZiAodGhpcy50eXBlLnByZWZpeCkge1xuICAgIHZhciBub2RlID0gdGhpcy5zdGFydE5vZGUoKSwgdXBkYXRlID0gdGhpcy50eXBlID09PSB0eXBlcyQxLmluY0RlYztcbiAgICBub2RlLm9wZXJhdG9yID0gdGhpcy52YWx1ZTtcbiAgICBub2RlLnByZWZpeCA9IHRydWU7XG4gICAgdGhpcy5uZXh0KCk7XG4gICAgbm9kZS5hcmd1bWVudCA9IHRoaXMucGFyc2VNYXliZVVuYXJ5KG51bGwsIHRydWUsIHVwZGF0ZSwgZm9ySW5pdCk7XG4gICAgdGhpcy5jaGVja0V4cHJlc3Npb25FcnJvcnMocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycywgdHJ1ZSk7XG4gICAgaWYgKHVwZGF0ZSkgeyB0aGlzLmNoZWNrTFZhbFNpbXBsZShub2RlLmFyZ3VtZW50KTsgfVxuICAgIGVsc2UgaWYgKHRoaXMuc3RyaWN0ICYmIG5vZGUub3BlcmF0b3IgPT09IFwiZGVsZXRlXCIgJiYgaXNMb2NhbFZhcmlhYmxlQWNjZXNzKG5vZGUuYXJndW1lbnQpKVxuICAgICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUobm9kZS5zdGFydCwgXCJEZWxldGluZyBsb2NhbCB2YXJpYWJsZSBpbiBzdHJpY3QgbW9kZVwiKTsgfVxuICAgIGVsc2UgaWYgKG5vZGUub3BlcmF0b3IgPT09IFwiZGVsZXRlXCIgJiYgaXNQcml2YXRlRmllbGRBY2Nlc3Mobm9kZS5hcmd1bWVudCkpXG4gICAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShub2RlLnN0YXJ0LCBcIlByaXZhdGUgZmllbGRzIGNhbiBub3QgYmUgZGVsZXRlZFwiKTsgfVxuICAgIGVsc2UgeyBzYXdVbmFyeSA9IHRydWU7IH1cbiAgICBleHByID0gdGhpcy5maW5pc2hOb2RlKG5vZGUsIHVwZGF0ZSA/IFwiVXBkYXRlRXhwcmVzc2lvblwiIDogXCJVbmFyeUV4cHJlc3Npb25cIik7XG4gIH0gZWxzZSBpZiAoIXNhd1VuYXJ5ICYmIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5wcml2YXRlSWQpIHtcbiAgICBpZiAoKGZvckluaXQgfHwgdGhpcy5wcml2YXRlTmFtZVN0YWNrLmxlbmd0aCA9PT0gMCkgJiYgdGhpcy5vcHRpb25zLmNoZWNrUHJpdmF0ZUZpZWxkcykgeyB0aGlzLnVuZXhwZWN0ZWQoKTsgfVxuICAgIGV4cHIgPSB0aGlzLnBhcnNlUHJpdmF0ZUlkZW50KCk7XG4gICAgLy8gb25seSBjb3VsZCBiZSBwcml2YXRlIGZpZWxkcyBpbiAnaW4nLCBzdWNoIGFzICN4IGluIG9ialxuICAgIGlmICh0aGlzLnR5cGUgIT09IHR5cGVzJDEuX2luKSB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gIH0gZWxzZSB7XG4gICAgZXhwciA9IHRoaXMucGFyc2VFeHByU3Vic2NyaXB0cyhyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCBmb3JJbml0KTtcbiAgICBpZiAodGhpcy5jaGVja0V4cHJlc3Npb25FcnJvcnMocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykpIHsgcmV0dXJuIGV4cHIgfVxuICAgIHdoaWxlICh0aGlzLnR5cGUucG9zdGZpeCAmJiAhdGhpcy5jYW5JbnNlcnRTZW1pY29sb24oKSkge1xuICAgICAgdmFyIG5vZGUkMSA9IHRoaXMuc3RhcnROb2RlQXQoc3RhcnRQb3MsIHN0YXJ0TG9jKTtcbiAgICAgIG5vZGUkMS5vcGVyYXRvciA9IHRoaXMudmFsdWU7XG4gICAgICBub2RlJDEucHJlZml4ID0gZmFsc2U7XG4gICAgICBub2RlJDEuYXJndW1lbnQgPSBleHByO1xuICAgICAgdGhpcy5jaGVja0xWYWxTaW1wbGUoZXhwcik7XG4gICAgICB0aGlzLm5leHQoKTtcbiAgICAgIGV4cHIgPSB0aGlzLmZpbmlzaE5vZGUobm9kZSQxLCBcIlVwZGF0ZUV4cHJlc3Npb25cIik7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFpbmNEZWMgJiYgdGhpcy5lYXQodHlwZXMkMS5zdGFyc3RhcikpIHtcbiAgICBpZiAoc2F3VW5hcnkpXG4gICAgICB7IHRoaXMudW5leHBlY3RlZCh0aGlzLmxhc3RUb2tTdGFydCk7IH1cbiAgICBlbHNlXG4gICAgICB7IHJldHVybiB0aGlzLmJ1aWxkQmluYXJ5KHN0YXJ0UG9zLCBzdGFydExvYywgZXhwciwgdGhpcy5wYXJzZU1heWJlVW5hcnkobnVsbCwgZmFsc2UsIGZhbHNlLCBmb3JJbml0KSwgXCIqKlwiLCBmYWxzZSkgfVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBleHByXG4gIH1cbn07XG5cbmZ1bmN0aW9uIGlzTG9jYWxWYXJpYWJsZUFjY2Vzcyhub2RlKSB7XG4gIHJldHVybiAoXG4gICAgbm9kZS50eXBlID09PSBcIklkZW50aWZpZXJcIiB8fFxuICAgIG5vZGUudHlwZSA9PT0gXCJQYXJlbnRoZXNpemVkRXhwcmVzc2lvblwiICYmIGlzTG9jYWxWYXJpYWJsZUFjY2Vzcyhub2RlLmV4cHJlc3Npb24pXG4gIClcbn1cblxuZnVuY3Rpb24gaXNQcml2YXRlRmllbGRBY2Nlc3Mobm9kZSkge1xuICByZXR1cm4gKFxuICAgIG5vZGUudHlwZSA9PT0gXCJNZW1iZXJFeHByZXNzaW9uXCIgJiYgbm9kZS5wcm9wZXJ0eS50eXBlID09PSBcIlByaXZhdGVJZGVudGlmaWVyXCIgfHxcbiAgICBub2RlLnR5cGUgPT09IFwiQ2hhaW5FeHByZXNzaW9uXCIgJiYgaXNQcml2YXRlRmllbGRBY2Nlc3Mobm9kZS5leHByZXNzaW9uKSB8fFxuICAgIG5vZGUudHlwZSA9PT0gXCJQYXJlbnRoZXNpemVkRXhwcmVzc2lvblwiICYmIGlzUHJpdmF0ZUZpZWxkQWNjZXNzKG5vZGUuZXhwcmVzc2lvbilcbiAgKVxufVxuXG4vLyBQYXJzZSBjYWxsLCBkb3QsIGFuZCBgW11gLXN1YnNjcmlwdCBleHByZXNzaW9ucy5cblxucHAkNS5wYXJzZUV4cHJTdWJzY3JpcHRzID0gZnVuY3Rpb24ocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycywgZm9ySW5pdCkge1xuICB2YXIgc3RhcnRQb3MgPSB0aGlzLnN0YXJ0LCBzdGFydExvYyA9IHRoaXMuc3RhcnRMb2M7XG4gIHZhciBleHByID0gdGhpcy5wYXJzZUV4cHJBdG9tKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMsIGZvckluaXQpO1xuICBpZiAoZXhwci50eXBlID09PSBcIkFycm93RnVuY3Rpb25FeHByZXNzaW9uXCIgJiYgdGhpcy5pbnB1dC5zbGljZSh0aGlzLmxhc3RUb2tTdGFydCwgdGhpcy5sYXN0VG9rRW5kKSAhPT0gXCIpXCIpXG4gICAgeyByZXR1cm4gZXhwciB9XG4gIHZhciByZXN1bHQgPSB0aGlzLnBhcnNlU3Vic2NyaXB0cyhleHByLCBzdGFydFBvcywgc3RhcnRMb2MsIGZhbHNlLCBmb3JJbml0KTtcbiAgaWYgKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMgJiYgcmVzdWx0LnR5cGUgPT09IFwiTWVtYmVyRXhwcmVzc2lvblwiKSB7XG4gICAgaWYgKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMucGFyZW50aGVzaXplZEFzc2lnbiA+PSByZXN1bHQuc3RhcnQpIHsgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy5wYXJlbnRoZXNpemVkQXNzaWduID0gLTE7IH1cbiAgICBpZiAocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy5wYXJlbnRoZXNpemVkQmluZCA+PSByZXN1bHQuc3RhcnQpIHsgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy5wYXJlbnRoZXNpemVkQmluZCA9IC0xOyB9XG4gICAgaWYgKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMudHJhaWxpbmdDb21tYSA+PSByZXN1bHQuc3RhcnQpIHsgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy50cmFpbGluZ0NvbW1hID0gLTE7IH1cbiAgfVxuICByZXR1cm4gcmVzdWx0XG59O1xuXG5wcCQ1LnBhcnNlU3Vic2NyaXB0cyA9IGZ1bmN0aW9uKGJhc2UsIHN0YXJ0UG9zLCBzdGFydExvYywgbm9DYWxscywgZm9ySW5pdCkge1xuICB2YXIgbWF5YmVBc3luY0Fycm93ID0gdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDggJiYgYmFzZS50eXBlID09PSBcIklkZW50aWZpZXJcIiAmJiBiYXNlLm5hbWUgPT09IFwiYXN5bmNcIiAmJlxuICAgICAgdGhpcy5sYXN0VG9rRW5kID09PSBiYXNlLmVuZCAmJiAhdGhpcy5jYW5JbnNlcnRTZW1pY29sb24oKSAmJiBiYXNlLmVuZCAtIGJhc2Uuc3RhcnQgPT09IDUgJiZcbiAgICAgIHRoaXMucG90ZW50aWFsQXJyb3dBdCA9PT0gYmFzZS5zdGFydDtcbiAgdmFyIG9wdGlvbmFsQ2hhaW5lZCA9IGZhbHNlO1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgdmFyIGVsZW1lbnQgPSB0aGlzLnBhcnNlU3Vic2NyaXB0KGJhc2UsIHN0YXJ0UG9zLCBzdGFydExvYywgbm9DYWxscywgbWF5YmVBc3luY0Fycm93LCBvcHRpb25hbENoYWluZWQsIGZvckluaXQpO1xuXG4gICAgaWYgKGVsZW1lbnQub3B0aW9uYWwpIHsgb3B0aW9uYWxDaGFpbmVkID0gdHJ1ZTsgfVxuICAgIGlmIChlbGVtZW50ID09PSBiYXNlIHx8IGVsZW1lbnQudHlwZSA9PT0gXCJBcnJvd0Z1bmN0aW9uRXhwcmVzc2lvblwiKSB7XG4gICAgICBpZiAob3B0aW9uYWxDaGFpbmVkKSB7XG4gICAgICAgIHZhciBjaGFpbk5vZGUgPSB0aGlzLnN0YXJ0Tm9kZUF0KHN0YXJ0UG9zLCBzdGFydExvYyk7XG4gICAgICAgIGNoYWluTm9kZS5leHByZXNzaW9uID0gZWxlbWVudDtcbiAgICAgICAgZWxlbWVudCA9IHRoaXMuZmluaXNoTm9kZShjaGFpbk5vZGUsIFwiQ2hhaW5FeHByZXNzaW9uXCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGVsZW1lbnRcbiAgICB9XG5cbiAgICBiYXNlID0gZWxlbWVudDtcbiAgfVxufTtcblxucHAkNS5zaG91bGRQYXJzZUFzeW5jQXJyb3cgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICF0aGlzLmNhbkluc2VydFNlbWljb2xvbigpICYmIHRoaXMuZWF0KHR5cGVzJDEuYXJyb3cpXG59O1xuXG5wcCQ1LnBhcnNlU3Vic2NyaXB0QXN5bmNBcnJvdyA9IGZ1bmN0aW9uKHN0YXJ0UG9zLCBzdGFydExvYywgZXhwckxpc3QsIGZvckluaXQpIHtcbiAgcmV0dXJuIHRoaXMucGFyc2VBcnJvd0V4cHJlc3Npb24odGhpcy5zdGFydE5vZGVBdChzdGFydFBvcywgc3RhcnRMb2MpLCBleHByTGlzdCwgdHJ1ZSwgZm9ySW5pdClcbn07XG5cbnBwJDUucGFyc2VTdWJzY3JpcHQgPSBmdW5jdGlvbihiYXNlLCBzdGFydFBvcywgc3RhcnRMb2MsIG5vQ2FsbHMsIG1heWJlQXN5bmNBcnJvdywgb3B0aW9uYWxDaGFpbmVkLCBmb3JJbml0KSB7XG4gIHZhciBvcHRpb25hbFN1cHBvcnRlZCA9IHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSAxMTtcbiAgdmFyIG9wdGlvbmFsID0gb3B0aW9uYWxTdXBwb3J0ZWQgJiYgdGhpcy5lYXQodHlwZXMkMS5xdWVzdGlvbkRvdCk7XG4gIGlmIChub0NhbGxzICYmIG9wdGlvbmFsKSB7IHRoaXMucmFpc2UodGhpcy5sYXN0VG9rU3RhcnQsIFwiT3B0aW9uYWwgY2hhaW5pbmcgY2Fubm90IGFwcGVhciBpbiB0aGUgY2FsbGVlIG9mIG5ldyBleHByZXNzaW9uc1wiKTsgfVxuXG4gIHZhciBjb21wdXRlZCA9IHRoaXMuZWF0KHR5cGVzJDEuYnJhY2tldEwpO1xuICBpZiAoY29tcHV0ZWQgfHwgKG9wdGlvbmFsICYmIHRoaXMudHlwZSAhPT0gdHlwZXMkMS5wYXJlbkwgJiYgdGhpcy50eXBlICE9PSB0eXBlcyQxLmJhY2tRdW90ZSkgfHwgdGhpcy5lYXQodHlwZXMkMS5kb3QpKSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZUF0KHN0YXJ0UG9zLCBzdGFydExvYyk7XG4gICAgbm9kZS5vYmplY3QgPSBiYXNlO1xuICAgIGlmIChjb21wdXRlZCkge1xuICAgICAgbm9kZS5wcm9wZXJ0eSA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICB0aGlzLmV4cGVjdCh0eXBlcyQxLmJyYWNrZXRSKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5wcml2YXRlSWQgJiYgYmFzZS50eXBlICE9PSBcIlN1cGVyXCIpIHtcbiAgICAgIG5vZGUucHJvcGVydHkgPSB0aGlzLnBhcnNlUHJpdmF0ZUlkZW50KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vZGUucHJvcGVydHkgPSB0aGlzLnBhcnNlSWRlbnQodGhpcy5vcHRpb25zLmFsbG93UmVzZXJ2ZWQgIT09IFwibmV2ZXJcIik7XG4gICAgfVxuICAgIG5vZGUuY29tcHV0ZWQgPSAhIWNvbXB1dGVkO1xuICAgIGlmIChvcHRpb25hbFN1cHBvcnRlZCkge1xuICAgICAgbm9kZS5vcHRpb25hbCA9IG9wdGlvbmFsO1xuICAgIH1cbiAgICBiYXNlID0gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiTWVtYmVyRXhwcmVzc2lvblwiKTtcbiAgfSBlbHNlIGlmICghbm9DYWxscyAmJiB0aGlzLmVhdCh0eXBlcyQxLnBhcmVuTCkpIHtcbiAgICB2YXIgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycyA9IG5ldyBEZXN0cnVjdHVyaW5nRXJyb3JzLCBvbGRZaWVsZFBvcyA9IHRoaXMueWllbGRQb3MsIG9sZEF3YWl0UG9zID0gdGhpcy5hd2FpdFBvcywgb2xkQXdhaXRJZGVudFBvcyA9IHRoaXMuYXdhaXRJZGVudFBvcztcbiAgICB0aGlzLnlpZWxkUG9zID0gMDtcbiAgICB0aGlzLmF3YWl0UG9zID0gMDtcbiAgICB0aGlzLmF3YWl0SWRlbnRQb3MgPSAwO1xuICAgIHZhciBleHByTGlzdCA9IHRoaXMucGFyc2VFeHByTGlzdCh0eXBlcyQxLnBhcmVuUiwgdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDgsIGZhbHNlLCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKTtcbiAgICBpZiAobWF5YmVBc3luY0Fycm93ICYmICFvcHRpb25hbCAmJiB0aGlzLnNob3VsZFBhcnNlQXN5bmNBcnJvdygpKSB7XG4gICAgICB0aGlzLmNoZWNrUGF0dGVybkVycm9ycyhyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCBmYWxzZSk7XG4gICAgICB0aGlzLmNoZWNrWWllbGRBd2FpdEluRGVmYXVsdFBhcmFtcygpO1xuICAgICAgaWYgKHRoaXMuYXdhaXRJZGVudFBvcyA+IDApXG4gICAgICAgIHsgdGhpcy5yYWlzZSh0aGlzLmF3YWl0SWRlbnRQb3MsIFwiQ2Fubm90IHVzZSAnYXdhaXQnIGFzIGlkZW50aWZpZXIgaW5zaWRlIGFuIGFzeW5jIGZ1bmN0aW9uXCIpOyB9XG4gICAgICB0aGlzLnlpZWxkUG9zID0gb2xkWWllbGRQb3M7XG4gICAgICB0aGlzLmF3YWl0UG9zID0gb2xkQXdhaXRQb3M7XG4gICAgICB0aGlzLmF3YWl0SWRlbnRQb3MgPSBvbGRBd2FpdElkZW50UG9zO1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VTdWJzY3JpcHRBc3luY0Fycm93KHN0YXJ0UG9zLCBzdGFydExvYywgZXhwckxpc3QsIGZvckluaXQpXG4gICAgfVxuICAgIHRoaXMuY2hlY2tFeHByZXNzaW9uRXJyb3JzKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMsIHRydWUpO1xuICAgIHRoaXMueWllbGRQb3MgPSBvbGRZaWVsZFBvcyB8fCB0aGlzLnlpZWxkUG9zO1xuICAgIHRoaXMuYXdhaXRQb3MgPSBvbGRBd2FpdFBvcyB8fCB0aGlzLmF3YWl0UG9zO1xuICAgIHRoaXMuYXdhaXRJZGVudFBvcyA9IG9sZEF3YWl0SWRlbnRQb3MgfHwgdGhpcy5hd2FpdElkZW50UG9zO1xuICAgIHZhciBub2RlJDEgPSB0aGlzLnN0YXJ0Tm9kZUF0KHN0YXJ0UG9zLCBzdGFydExvYyk7XG4gICAgbm9kZSQxLmNhbGxlZSA9IGJhc2U7XG4gICAgbm9kZSQxLmFyZ3VtZW50cyA9IGV4cHJMaXN0O1xuICAgIGlmIChvcHRpb25hbFN1cHBvcnRlZCkge1xuICAgICAgbm9kZSQxLm9wdGlvbmFsID0gb3B0aW9uYWw7XG4gICAgfVxuICAgIGJhc2UgPSB0aGlzLmZpbmlzaE5vZGUobm9kZSQxLCBcIkNhbGxFeHByZXNzaW9uXCIpO1xuICB9IGVsc2UgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5iYWNrUXVvdGUpIHtcbiAgICBpZiAob3B0aW9uYWwgfHwgb3B0aW9uYWxDaGFpbmVkKSB7XG4gICAgICB0aGlzLnJhaXNlKHRoaXMuc3RhcnQsIFwiT3B0aW9uYWwgY2hhaW5pbmcgY2Fubm90IGFwcGVhciBpbiB0aGUgdGFnIG9mIHRhZ2dlZCB0ZW1wbGF0ZSBleHByZXNzaW9uc1wiKTtcbiAgICB9XG4gICAgdmFyIG5vZGUkMiA9IHRoaXMuc3RhcnROb2RlQXQoc3RhcnRQb3MsIHN0YXJ0TG9jKTtcbiAgICBub2RlJDIudGFnID0gYmFzZTtcbiAgICBub2RlJDIucXVhc2kgPSB0aGlzLnBhcnNlVGVtcGxhdGUoe2lzVGFnZ2VkOiB0cnVlfSk7XG4gICAgYmFzZSA9IHRoaXMuZmluaXNoTm9kZShub2RlJDIsIFwiVGFnZ2VkVGVtcGxhdGVFeHByZXNzaW9uXCIpO1xuICB9XG4gIHJldHVybiBiYXNlXG59O1xuXG4vLyBQYXJzZSBhbiBhdG9taWMgZXhwcmVzc2lvbiBcdTIwMTQgZWl0aGVyIGEgc2luZ2xlIHRva2VuIHRoYXQgaXMgYW5cbi8vIGV4cHJlc3Npb24sIGFuIGV4cHJlc3Npb24gc3RhcnRlZCBieSBhIGtleXdvcmQgbGlrZSBgZnVuY3Rpb25gIG9yXG4vLyBgbmV3YCwgb3IgYW4gZXhwcmVzc2lvbiB3cmFwcGVkIGluIHB1bmN0dWF0aW9uIGxpa2UgYCgpYCwgYFtdYCxcbi8vIG9yIGB7fWAuXG5cbnBwJDUucGFyc2VFeHByQXRvbSA9IGZ1bmN0aW9uKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMsIGZvckluaXQsIGZvck5ldykge1xuICAvLyBJZiBhIGRpdmlzaW9uIG9wZXJhdG9yIGFwcGVhcnMgaW4gYW4gZXhwcmVzc2lvbiBwb3NpdGlvbiwgdGhlXG4gIC8vIHRva2VuaXplciBnb3QgY29uZnVzZWQsIGFuZCB3ZSBmb3JjZSBpdCB0byByZWFkIGEgcmVnZXhwIGluc3RlYWQuXG4gIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuc2xhc2gpIHsgdGhpcy5yZWFkUmVnZXhwKCk7IH1cblxuICB2YXIgbm9kZSwgY2FuQmVBcnJvdyA9IHRoaXMucG90ZW50aWFsQXJyb3dBdCA9PT0gdGhpcy5zdGFydDtcbiAgc3dpdGNoICh0aGlzLnR5cGUpIHtcbiAgY2FzZSB0eXBlcyQxLl9zdXBlcjpcbiAgICBpZiAoIXRoaXMuYWxsb3dTdXBlcilcbiAgICAgIHsgdGhpcy5yYWlzZSh0aGlzLnN0YXJ0LCBcIidzdXBlcicga2V5d29yZCBvdXRzaWRlIGEgbWV0aG9kXCIpOyB9XG4gICAgbm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gICAgdGhpcy5uZXh0KCk7XG4gICAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5wYXJlbkwgJiYgIXRoaXMuYWxsb3dEaXJlY3RTdXBlcilcbiAgICAgIHsgdGhpcy5yYWlzZShub2RlLnN0YXJ0LCBcInN1cGVyKCkgY2FsbCBvdXRzaWRlIGNvbnN0cnVjdG9yIG9mIGEgc3ViY2xhc3NcIik7IH1cbiAgICAvLyBUaGUgYHN1cGVyYCBrZXl3b3JkIGNhbiBhcHBlYXIgYXQgYmVsb3c6XG4gICAgLy8gU3VwZXJQcm9wZXJ0eTpcbiAgICAvLyAgICAgc3VwZXIgWyBFeHByZXNzaW9uIF1cbiAgICAvLyAgICAgc3VwZXIgLiBJZGVudGlmaWVyTmFtZVxuICAgIC8vIFN1cGVyQ2FsbDpcbiAgICAvLyAgICAgc3VwZXIgKCBBcmd1bWVudHMgKVxuICAgIGlmICh0aGlzLnR5cGUgIT09IHR5cGVzJDEuZG90ICYmIHRoaXMudHlwZSAhPT0gdHlwZXMkMS5icmFja2V0TCAmJiB0aGlzLnR5cGUgIT09IHR5cGVzJDEucGFyZW5MKVxuICAgICAgeyB0aGlzLnVuZXhwZWN0ZWQoKTsgfVxuICAgIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJTdXBlclwiKVxuXG4gIGNhc2UgdHlwZXMkMS5fdGhpczpcbiAgICBub2RlID0gdGhpcy5zdGFydE5vZGUoKTtcbiAgICB0aGlzLm5leHQoKTtcbiAgICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiVGhpc0V4cHJlc3Npb25cIilcblxuICBjYXNlIHR5cGVzJDEubmFtZTpcbiAgICB2YXIgc3RhcnRQb3MgPSB0aGlzLnN0YXJ0LCBzdGFydExvYyA9IHRoaXMuc3RhcnRMb2MsIGNvbnRhaW5zRXNjID0gdGhpcy5jb250YWluc0VzYztcbiAgICB2YXIgaWQgPSB0aGlzLnBhcnNlSWRlbnQoZmFsc2UpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOCAmJiAhY29udGFpbnNFc2MgJiYgaWQubmFtZSA9PT0gXCJhc3luY1wiICYmICF0aGlzLmNhbkluc2VydFNlbWljb2xvbigpICYmIHRoaXMuZWF0KHR5cGVzJDEuX2Z1bmN0aW9uKSkge1xuICAgICAgdGhpcy5vdmVycmlkZUNvbnRleHQodHlwZXMuZl9leHByKTtcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlRnVuY3Rpb24odGhpcy5zdGFydE5vZGVBdChzdGFydFBvcywgc3RhcnRMb2MpLCAwLCBmYWxzZSwgdHJ1ZSwgZm9ySW5pdClcbiAgICB9XG4gICAgaWYgKGNhbkJlQXJyb3cgJiYgIXRoaXMuY2FuSW5zZXJ0U2VtaWNvbG9uKCkpIHtcbiAgICAgIGlmICh0aGlzLmVhdCh0eXBlcyQxLmFycm93KSlcbiAgICAgICAgeyByZXR1cm4gdGhpcy5wYXJzZUFycm93RXhwcmVzc2lvbih0aGlzLnN0YXJ0Tm9kZUF0KHN0YXJ0UG9zLCBzdGFydExvYyksIFtpZF0sIGZhbHNlLCBmb3JJbml0KSB9XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDggJiYgaWQubmFtZSA9PT0gXCJhc3luY1wiICYmIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5uYW1lICYmICFjb250YWluc0VzYyAmJlxuICAgICAgICAgICghdGhpcy5wb3RlbnRpYWxBcnJvd0luRm9yQXdhaXQgfHwgdGhpcy52YWx1ZSAhPT0gXCJvZlwiIHx8IHRoaXMuY29udGFpbnNFc2MpKSB7XG4gICAgICAgIGlkID0gdGhpcy5wYXJzZUlkZW50KGZhbHNlKTtcbiAgICAgICAgaWYgKHRoaXMuY2FuSW5zZXJ0U2VtaWNvbG9uKCkgfHwgIXRoaXMuZWF0KHR5cGVzJDEuYXJyb3cpKVxuICAgICAgICAgIHsgdGhpcy51bmV4cGVjdGVkKCk7IH1cbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VBcnJvd0V4cHJlc3Npb24odGhpcy5zdGFydE5vZGVBdChzdGFydFBvcywgc3RhcnRMb2MpLCBbaWRdLCB0cnVlLCBmb3JJbml0KVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaWRcblxuICBjYXNlIHR5cGVzJDEucmVnZXhwOlxuICAgIHZhciB2YWx1ZSA9IHRoaXMudmFsdWU7XG4gICAgbm9kZSA9IHRoaXMucGFyc2VMaXRlcmFsKHZhbHVlLnZhbHVlKTtcbiAgICBub2RlLnJlZ2V4ID0ge3BhdHRlcm46IHZhbHVlLnBhdHRlcm4sIGZsYWdzOiB2YWx1ZS5mbGFnc307XG4gICAgcmV0dXJuIG5vZGVcblxuICBjYXNlIHR5cGVzJDEubnVtOiBjYXNlIHR5cGVzJDEuc3RyaW5nOlxuICAgIHJldHVybiB0aGlzLnBhcnNlTGl0ZXJhbCh0aGlzLnZhbHVlKVxuXG4gIGNhc2UgdHlwZXMkMS5fbnVsbDogY2FzZSB0eXBlcyQxLl90cnVlOiBjYXNlIHR5cGVzJDEuX2ZhbHNlOlxuICAgIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICAgIG5vZGUudmFsdWUgPSB0aGlzLnR5cGUgPT09IHR5cGVzJDEuX251bGwgPyBudWxsIDogdGhpcy50eXBlID09PSB0eXBlcyQxLl90cnVlO1xuICAgIG5vZGUucmF3ID0gdGhpcy50eXBlLmtleXdvcmQ7XG4gICAgdGhpcy5uZXh0KCk7XG4gICAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIkxpdGVyYWxcIilcblxuICBjYXNlIHR5cGVzJDEucGFyZW5MOlxuICAgIHZhciBzdGFydCA9IHRoaXMuc3RhcnQsIGV4cHIgPSB0aGlzLnBhcnNlUGFyZW5BbmREaXN0aW5ndWlzaEV4cHJlc3Npb24oY2FuQmVBcnJvdywgZm9ySW5pdCk7XG4gICAgaWYgKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpIHtcbiAgICAgIGlmIChyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnBhcmVudGhlc2l6ZWRBc3NpZ24gPCAwICYmICF0aGlzLmlzU2ltcGxlQXNzaWduVGFyZ2V0KGV4cHIpKVxuICAgICAgICB7IHJlZkRlc3RydWN0dXJpbmdFcnJvcnMucGFyZW50aGVzaXplZEFzc2lnbiA9IHN0YXJ0OyB9XG4gICAgICBpZiAocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy5wYXJlbnRoZXNpemVkQmluZCA8IDApXG4gICAgICAgIHsgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy5wYXJlbnRoZXNpemVkQmluZCA9IHN0YXJ0OyB9XG4gICAgfVxuICAgIHJldHVybiBleHByXG5cbiAgY2FzZSB0eXBlcyQxLmJyYWNrZXRMOlxuICAgIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICAgIHRoaXMubmV4dCgpO1xuICAgIG5vZGUuZWxlbWVudHMgPSB0aGlzLnBhcnNlRXhwckxpc3QodHlwZXMkMS5icmFja2V0UiwgdHJ1ZSwgdHJ1ZSwgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycyk7XG4gICAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIkFycmF5RXhwcmVzc2lvblwiKVxuXG4gIGNhc2UgdHlwZXMkMS5icmFjZUw6XG4gICAgdGhpcy5vdmVycmlkZUNvbnRleHQodHlwZXMuYl9leHByKTtcbiAgICByZXR1cm4gdGhpcy5wYXJzZU9iaihmYWxzZSwgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycylcblxuICBjYXNlIHR5cGVzJDEuX2Z1bmN0aW9uOlxuICAgIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICAgIHRoaXMubmV4dCgpO1xuICAgIHJldHVybiB0aGlzLnBhcnNlRnVuY3Rpb24obm9kZSwgMClcblxuICBjYXNlIHR5cGVzJDEuX2NsYXNzOlxuICAgIHJldHVybiB0aGlzLnBhcnNlQ2xhc3ModGhpcy5zdGFydE5vZGUoKSwgZmFsc2UpXG5cbiAgY2FzZSB0eXBlcyQxLl9uZXc6XG4gICAgcmV0dXJuIHRoaXMucGFyc2VOZXcoKVxuXG4gIGNhc2UgdHlwZXMkMS5iYWNrUXVvdGU6XG4gICAgcmV0dXJuIHRoaXMucGFyc2VUZW1wbGF0ZSgpXG5cbiAgY2FzZSB0eXBlcyQxLl9pbXBvcnQ6XG4gICAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSAxMSkge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VFeHBySW1wb3J0KGZvck5ldylcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMudW5leHBlY3RlZCgpXG4gICAgfVxuXG4gIGRlZmF1bHQ6XG4gICAgcmV0dXJuIHRoaXMucGFyc2VFeHByQXRvbURlZmF1bHQoKVxuICB9XG59O1xuXG5wcCQ1LnBhcnNlRXhwckF0b21EZWZhdWx0ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMudW5leHBlY3RlZCgpO1xufTtcblxucHAkNS5wYXJzZUV4cHJJbXBvcnQgPSBmdW5jdGlvbihmb3JOZXcpIHtcbiAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuXG4gIC8vIENvbnN1bWUgYGltcG9ydGAgYXMgYW4gaWRlbnRpZmllciBmb3IgYGltcG9ydC5tZXRhYC5cbiAgLy8gQmVjYXVzZSBgdGhpcy5wYXJzZUlkZW50KHRydWUpYCBkb2Vzbid0IGNoZWNrIGVzY2FwZSBzZXF1ZW5jZXMsIGl0IG5lZWRzIHRoZSBjaGVjayBvZiBgdGhpcy5jb250YWluc0VzY2AuXG4gIGlmICh0aGlzLmNvbnRhaW5zRXNjKSB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZSh0aGlzLnN0YXJ0LCBcIkVzY2FwZSBzZXF1ZW5jZSBpbiBrZXl3b3JkIGltcG9ydFwiKTsgfVxuICB0aGlzLm5leHQoKTtcblxuICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLnBhcmVuTCAmJiAhZm9yTmV3KSB7XG4gICAgcmV0dXJuIHRoaXMucGFyc2VEeW5hbWljSW1wb3J0KG5vZGUpXG4gIH0gZWxzZSBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLmRvdCkge1xuICAgIHZhciBtZXRhID0gdGhpcy5zdGFydE5vZGVBdChub2RlLnN0YXJ0LCBub2RlLmxvYyAmJiBub2RlLmxvYy5zdGFydCk7XG4gICAgbWV0YS5uYW1lID0gXCJpbXBvcnRcIjtcbiAgICBub2RlLm1ldGEgPSB0aGlzLmZpbmlzaE5vZGUobWV0YSwgXCJJZGVudGlmaWVyXCIpO1xuICAgIHJldHVybiB0aGlzLnBhcnNlSW1wb3J0TWV0YShub2RlKVxuICB9IGVsc2Uge1xuICAgIHRoaXMudW5leHBlY3RlZCgpO1xuICB9XG59O1xuXG5wcCQ1LnBhcnNlRHluYW1pY0ltcG9ydCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgdGhpcy5uZXh0KCk7IC8vIHNraXAgYChgXG5cbiAgLy8gUGFyc2Ugbm9kZS5zb3VyY2UuXG4gIG5vZGUuc291cmNlID0gdGhpcy5wYXJzZU1heWJlQXNzaWduKCk7XG5cbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSAxNikge1xuICAgIGlmICghdGhpcy5lYXQodHlwZXMkMS5wYXJlblIpKSB7XG4gICAgICB0aGlzLmV4cGVjdCh0eXBlcyQxLmNvbW1hKTtcbiAgICAgIGlmICghdGhpcy5hZnRlclRyYWlsaW5nQ29tbWEodHlwZXMkMS5wYXJlblIpKSB7XG4gICAgICAgIG5vZGUub3B0aW9ucyA9IHRoaXMucGFyc2VNYXliZUFzc2lnbigpO1xuICAgICAgICBpZiAoIXRoaXMuZWF0KHR5cGVzJDEucGFyZW5SKSkge1xuICAgICAgICAgIHRoaXMuZXhwZWN0KHR5cGVzJDEuY29tbWEpO1xuICAgICAgICAgIGlmICghdGhpcy5hZnRlclRyYWlsaW5nQ29tbWEodHlwZXMkMS5wYXJlblIpKSB7XG4gICAgICAgICAgICB0aGlzLnVuZXhwZWN0ZWQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5vZGUub3B0aW9ucyA9IG51bGw7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vZGUub3B0aW9ucyA9IG51bGw7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIFZlcmlmeSBlbmRpbmcuXG4gICAgaWYgKCF0aGlzLmVhdCh0eXBlcyQxLnBhcmVuUikpIHtcbiAgICAgIHZhciBlcnJvclBvcyA9IHRoaXMuc3RhcnQ7XG4gICAgICBpZiAodGhpcy5lYXQodHlwZXMkMS5jb21tYSkgJiYgdGhpcy5lYXQodHlwZXMkMS5wYXJlblIpKSB7XG4gICAgICAgIHRoaXMucmFpc2VSZWNvdmVyYWJsZShlcnJvclBvcywgXCJUcmFpbGluZyBjb21tYSBpcyBub3QgYWxsb3dlZCBpbiBpbXBvcnQoKVwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudW5leHBlY3RlZChlcnJvclBvcyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIkltcG9ydEV4cHJlc3Npb25cIilcbn07XG5cbnBwJDUucGFyc2VJbXBvcnRNZXRhID0gZnVuY3Rpb24obm9kZSkge1xuICB0aGlzLm5leHQoKTsgLy8gc2tpcCBgLmBcblxuICB2YXIgY29udGFpbnNFc2MgPSB0aGlzLmNvbnRhaW5zRXNjO1xuICBub2RlLnByb3BlcnR5ID0gdGhpcy5wYXJzZUlkZW50KHRydWUpO1xuXG4gIGlmIChub2RlLnByb3BlcnR5Lm5hbWUgIT09IFwibWV0YVwiKVxuICAgIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKG5vZGUucHJvcGVydHkuc3RhcnQsIFwiVGhlIG9ubHkgdmFsaWQgbWV0YSBwcm9wZXJ0eSBmb3IgaW1wb3J0IGlzICdpbXBvcnQubWV0YSdcIik7IH1cbiAgaWYgKGNvbnRhaW5zRXNjKVxuICAgIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKG5vZGUuc3RhcnQsIFwiJ2ltcG9ydC5tZXRhJyBtdXN0IG5vdCBjb250YWluIGVzY2FwZWQgY2hhcmFjdGVyc1wiKTsgfVxuICBpZiAodGhpcy5vcHRpb25zLnNvdXJjZVR5cGUgIT09IFwibW9kdWxlXCIgJiYgIXRoaXMub3B0aW9ucy5hbGxvd0ltcG9ydEV4cG9ydEV2ZXJ5d2hlcmUpXG4gICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUobm9kZS5zdGFydCwgXCJDYW5ub3QgdXNlICdpbXBvcnQubWV0YScgb3V0c2lkZSBhIG1vZHVsZVwiKTsgfVxuXG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJNZXRhUHJvcGVydHlcIilcbn07XG5cbnBwJDUucGFyc2VMaXRlcmFsID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICBub2RlLnZhbHVlID0gdmFsdWU7XG4gIG5vZGUucmF3ID0gdGhpcy5pbnB1dC5zbGljZSh0aGlzLnN0YXJ0LCB0aGlzLmVuZCk7XG4gIGlmIChub2RlLnJhdy5jaGFyQ29kZUF0KG5vZGUucmF3Lmxlbmd0aCAtIDEpID09PSAxMTApXG4gICAgeyBub2RlLmJpZ2ludCA9IG5vZGUudmFsdWUgIT0gbnVsbCA/IG5vZGUudmFsdWUudG9TdHJpbmcoKSA6IG5vZGUucmF3LnNsaWNlKDAsIC0xKS5yZXBsYWNlKC9fL2csIFwiXCIpOyB9XG4gIHRoaXMubmV4dCgpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiTGl0ZXJhbFwiKVxufTtcblxucHAkNS5wYXJzZVBhcmVuRXhwcmVzc2lvbiA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmV4cGVjdCh0eXBlcyQxLnBhcmVuTCk7XG4gIHZhciB2YWwgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICB0aGlzLmV4cGVjdCh0eXBlcyQxLnBhcmVuUik7XG4gIHJldHVybiB2YWxcbn07XG5cbnBwJDUuc2hvdWxkUGFyc2VBcnJvdyA9IGZ1bmN0aW9uKGV4cHJMaXN0KSB7XG4gIHJldHVybiAhdGhpcy5jYW5JbnNlcnRTZW1pY29sb24oKVxufTtcblxucHAkNS5wYXJzZVBhcmVuQW5kRGlzdGluZ3Vpc2hFeHByZXNzaW9uID0gZnVuY3Rpb24oY2FuQmVBcnJvdywgZm9ySW5pdCkge1xuICB2YXIgc3RhcnRQb3MgPSB0aGlzLnN0YXJ0LCBzdGFydExvYyA9IHRoaXMuc3RhcnRMb2MsIHZhbCwgYWxsb3dUcmFpbGluZ0NvbW1hID0gdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDg7XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNikge1xuICAgIHRoaXMubmV4dCgpO1xuXG4gICAgdmFyIGlubmVyU3RhcnRQb3MgPSB0aGlzLnN0YXJ0LCBpbm5lclN0YXJ0TG9jID0gdGhpcy5zdGFydExvYztcbiAgICB2YXIgZXhwckxpc3QgPSBbXSwgZmlyc3QgPSB0cnVlLCBsYXN0SXNDb21tYSA9IGZhbHNlO1xuICAgIHZhciByZWZEZXN0cnVjdHVyaW5nRXJyb3JzID0gbmV3IERlc3RydWN0dXJpbmdFcnJvcnMsIG9sZFlpZWxkUG9zID0gdGhpcy55aWVsZFBvcywgb2xkQXdhaXRQb3MgPSB0aGlzLmF3YWl0UG9zLCBzcHJlYWRTdGFydDtcbiAgICB0aGlzLnlpZWxkUG9zID0gMDtcbiAgICB0aGlzLmF3YWl0UG9zID0gMDtcbiAgICAvLyBEbyBub3Qgc2F2ZSBhd2FpdElkZW50UG9zIHRvIGFsbG93IGNoZWNraW5nIGF3YWl0cyBuZXN0ZWQgaW4gcGFyYW1ldGVyc1xuICAgIHdoaWxlICh0aGlzLnR5cGUgIT09IHR5cGVzJDEucGFyZW5SKSB7XG4gICAgICBmaXJzdCA/IGZpcnN0ID0gZmFsc2UgOiB0aGlzLmV4cGVjdCh0eXBlcyQxLmNvbW1hKTtcbiAgICAgIGlmIChhbGxvd1RyYWlsaW5nQ29tbWEgJiYgdGhpcy5hZnRlclRyYWlsaW5nQ29tbWEodHlwZXMkMS5wYXJlblIsIHRydWUpKSB7XG4gICAgICAgIGxhc3RJc0NvbW1hID0gdHJ1ZTtcbiAgICAgICAgYnJlYWtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLmVsbGlwc2lzKSB7XG4gICAgICAgIHNwcmVhZFN0YXJ0ID0gdGhpcy5zdGFydDtcbiAgICAgICAgZXhwckxpc3QucHVzaCh0aGlzLnBhcnNlUGFyZW5JdGVtKHRoaXMucGFyc2VSZXN0QmluZGluZygpKSk7XG4gICAgICAgIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuY29tbWEpIHtcbiAgICAgICAgICB0aGlzLnJhaXNlUmVjb3ZlcmFibGUoXG4gICAgICAgICAgICB0aGlzLnN0YXJ0LFxuICAgICAgICAgICAgXCJDb21tYSBpcyBub3QgcGVybWl0dGVkIGFmdGVyIHRoZSByZXN0IGVsZW1lbnRcIlxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGV4cHJMaXN0LnB1c2godGhpcy5wYXJzZU1heWJlQXNzaWduKGZhbHNlLCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCB0aGlzLnBhcnNlUGFyZW5JdGVtKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBpbm5lckVuZFBvcyA9IHRoaXMubGFzdFRva0VuZCwgaW5uZXJFbmRMb2MgPSB0aGlzLmxhc3RUb2tFbmRMb2M7XG4gICAgdGhpcy5leHBlY3QodHlwZXMkMS5wYXJlblIpO1xuXG4gICAgaWYgKGNhbkJlQXJyb3cgJiYgdGhpcy5zaG91bGRQYXJzZUFycm93KGV4cHJMaXN0KSAmJiB0aGlzLmVhdCh0eXBlcyQxLmFycm93KSkge1xuICAgICAgdGhpcy5jaGVja1BhdHRlcm5FcnJvcnMocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycywgZmFsc2UpO1xuICAgICAgdGhpcy5jaGVja1lpZWxkQXdhaXRJbkRlZmF1bHRQYXJhbXMoKTtcbiAgICAgIHRoaXMueWllbGRQb3MgPSBvbGRZaWVsZFBvcztcbiAgICAgIHRoaXMuYXdhaXRQb3MgPSBvbGRBd2FpdFBvcztcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlUGFyZW5BcnJvd0xpc3Qoc3RhcnRQb3MsIHN0YXJ0TG9jLCBleHByTGlzdCwgZm9ySW5pdClcbiAgICB9XG5cbiAgICBpZiAoIWV4cHJMaXN0Lmxlbmd0aCB8fCBsYXN0SXNDb21tYSkgeyB0aGlzLnVuZXhwZWN0ZWQodGhpcy5sYXN0VG9rU3RhcnQpOyB9XG4gICAgaWYgKHNwcmVhZFN0YXJ0KSB7IHRoaXMudW5leHBlY3RlZChzcHJlYWRTdGFydCk7IH1cbiAgICB0aGlzLmNoZWNrRXhwcmVzc2lvbkVycm9ycyhyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCB0cnVlKTtcbiAgICB0aGlzLnlpZWxkUG9zID0gb2xkWWllbGRQb3MgfHwgdGhpcy55aWVsZFBvcztcbiAgICB0aGlzLmF3YWl0UG9zID0gb2xkQXdhaXRQb3MgfHwgdGhpcy5hd2FpdFBvcztcblxuICAgIGlmIChleHByTGlzdC5sZW5ndGggPiAxKSB7XG4gICAgICB2YWwgPSB0aGlzLnN0YXJ0Tm9kZUF0KGlubmVyU3RhcnRQb3MsIGlubmVyU3RhcnRMb2MpO1xuICAgICAgdmFsLmV4cHJlc3Npb25zID0gZXhwckxpc3Q7XG4gICAgICB0aGlzLmZpbmlzaE5vZGVBdCh2YWwsIFwiU2VxdWVuY2VFeHByZXNzaW9uXCIsIGlubmVyRW5kUG9zLCBpbm5lckVuZExvYyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbCA9IGV4cHJMaXN0WzBdO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YWwgPSB0aGlzLnBhcnNlUGFyZW5FeHByZXNzaW9uKCk7XG4gIH1cblxuICBpZiAodGhpcy5vcHRpb25zLnByZXNlcnZlUGFyZW5zKSB7XG4gICAgdmFyIHBhciA9IHRoaXMuc3RhcnROb2RlQXQoc3RhcnRQb3MsIHN0YXJ0TG9jKTtcbiAgICBwYXIuZXhwcmVzc2lvbiA9IHZhbDtcbiAgICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKHBhciwgXCJQYXJlbnRoZXNpemVkRXhwcmVzc2lvblwiKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiB2YWxcbiAgfVxufTtcblxucHAkNS5wYXJzZVBhcmVuSXRlbSA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgcmV0dXJuIGl0ZW1cbn07XG5cbnBwJDUucGFyc2VQYXJlbkFycm93TGlzdCA9IGZ1bmN0aW9uKHN0YXJ0UG9zLCBzdGFydExvYywgZXhwckxpc3QsIGZvckluaXQpIHtcbiAgcmV0dXJuIHRoaXMucGFyc2VBcnJvd0V4cHJlc3Npb24odGhpcy5zdGFydE5vZGVBdChzdGFydFBvcywgc3RhcnRMb2MpLCBleHByTGlzdCwgZmFsc2UsIGZvckluaXQpXG59O1xuXG4vLyBOZXcncyBwcmVjZWRlbmNlIGlzIHNsaWdodGx5IHRyaWNreS4gSXQgbXVzdCBhbGxvdyBpdHMgYXJndW1lbnQgdG9cbi8vIGJlIGEgYFtdYCBvciBkb3Qgc3Vic2NyaXB0IGV4cHJlc3Npb24sIGJ1dCBub3QgYSBjYWxsIFx1MjAxNCBhdCBsZWFzdCxcbi8vIG5vdCB3aXRob3V0IHdyYXBwaW5nIGl0IGluIHBhcmVudGhlc2VzLiBUaHVzLCBpdCB1c2VzIHRoZSBub0NhbGxzXG4vLyBhcmd1bWVudCB0byBwYXJzZVN1YnNjcmlwdHMgdG8gcHJldmVudCBpdCBmcm9tIGNvbnN1bWluZyB0aGVcbi8vIGFyZ3VtZW50IGxpc3QuXG5cbnZhciBlbXB0eSA9IFtdO1xuXG5wcCQ1LnBhcnNlTmV3ID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmNvbnRhaW5zRXNjKSB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZSh0aGlzLnN0YXJ0LCBcIkVzY2FwZSBzZXF1ZW5jZSBpbiBrZXl3b3JkIG5ld1wiKTsgfVxuICB2YXIgbm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gIHRoaXMubmV4dCgpO1xuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDYgJiYgdGhpcy50eXBlID09PSB0eXBlcyQxLmRvdCkge1xuICAgIHZhciBtZXRhID0gdGhpcy5zdGFydE5vZGVBdChub2RlLnN0YXJ0LCBub2RlLmxvYyAmJiBub2RlLmxvYy5zdGFydCk7XG4gICAgbWV0YS5uYW1lID0gXCJuZXdcIjtcbiAgICBub2RlLm1ldGEgPSB0aGlzLmZpbmlzaE5vZGUobWV0YSwgXCJJZGVudGlmaWVyXCIpO1xuICAgIHRoaXMubmV4dCgpO1xuICAgIHZhciBjb250YWluc0VzYyA9IHRoaXMuY29udGFpbnNFc2M7XG4gICAgbm9kZS5wcm9wZXJ0eSA9IHRoaXMucGFyc2VJZGVudCh0cnVlKTtcbiAgICBpZiAobm9kZS5wcm9wZXJ0eS5uYW1lICE9PSBcInRhcmdldFwiKVxuICAgICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUobm9kZS5wcm9wZXJ0eS5zdGFydCwgXCJUaGUgb25seSB2YWxpZCBtZXRhIHByb3BlcnR5IGZvciBuZXcgaXMgJ25ldy50YXJnZXQnXCIpOyB9XG4gICAgaWYgKGNvbnRhaW5zRXNjKVxuICAgICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUobm9kZS5zdGFydCwgXCInbmV3LnRhcmdldCcgbXVzdCBub3QgY29udGFpbiBlc2NhcGVkIGNoYXJhY3RlcnNcIik7IH1cbiAgICBpZiAoIXRoaXMuYWxsb3dOZXdEb3RUYXJnZXQpXG4gICAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShub2RlLnN0YXJ0LCBcIiduZXcudGFyZ2V0JyBjYW4gb25seSBiZSB1c2VkIGluIGZ1bmN0aW9ucyBhbmQgY2xhc3Mgc3RhdGljIGJsb2NrXCIpOyB9XG4gICAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIk1ldGFQcm9wZXJ0eVwiKVxuICB9XG4gIHZhciBzdGFydFBvcyA9IHRoaXMuc3RhcnQsIHN0YXJ0TG9jID0gdGhpcy5zdGFydExvYztcbiAgbm9kZS5jYWxsZWUgPSB0aGlzLnBhcnNlU3Vic2NyaXB0cyh0aGlzLnBhcnNlRXhwckF0b20obnVsbCwgZmFsc2UsIHRydWUpLCBzdGFydFBvcywgc3RhcnRMb2MsIHRydWUsIGZhbHNlKTtcbiAgaWYgKHRoaXMuZWF0KHR5cGVzJDEucGFyZW5MKSkgeyBub2RlLmFyZ3VtZW50cyA9IHRoaXMucGFyc2VFeHByTGlzdCh0eXBlcyQxLnBhcmVuUiwgdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDgsIGZhbHNlKTsgfVxuICBlbHNlIHsgbm9kZS5hcmd1bWVudHMgPSBlbXB0eTsgfVxuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiTmV3RXhwcmVzc2lvblwiKVxufTtcblxuLy8gUGFyc2UgdGVtcGxhdGUgZXhwcmVzc2lvbi5cblxucHAkNS5wYXJzZVRlbXBsYXRlRWxlbWVudCA9IGZ1bmN0aW9uKHJlZikge1xuICB2YXIgaXNUYWdnZWQgPSByZWYuaXNUYWdnZWQ7XG5cbiAgdmFyIGVsZW0gPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLmludmFsaWRUZW1wbGF0ZSkge1xuICAgIGlmICghaXNUYWdnZWQpIHtcbiAgICAgIHRoaXMucmFpc2VSZWNvdmVyYWJsZSh0aGlzLnN0YXJ0LCBcIkJhZCBlc2NhcGUgc2VxdWVuY2UgaW4gdW50YWdnZWQgdGVtcGxhdGUgbGl0ZXJhbFwiKTtcbiAgICB9XG4gICAgZWxlbS52YWx1ZSA9IHtcbiAgICAgIHJhdzogdGhpcy52YWx1ZS5yZXBsYWNlKC9cXHJcXG4/L2csIFwiXFxuXCIpLFxuICAgICAgY29va2VkOiBudWxsXG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBlbGVtLnZhbHVlID0ge1xuICAgICAgcmF3OiB0aGlzLmlucHV0LnNsaWNlKHRoaXMuc3RhcnQsIHRoaXMuZW5kKS5yZXBsYWNlKC9cXHJcXG4/L2csIFwiXFxuXCIpLFxuICAgICAgY29va2VkOiB0aGlzLnZhbHVlXG4gICAgfTtcbiAgfVxuICB0aGlzLm5leHQoKTtcbiAgZWxlbS50YWlsID0gdGhpcy50eXBlID09PSB0eXBlcyQxLmJhY2tRdW90ZTtcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShlbGVtLCBcIlRlbXBsYXRlRWxlbWVudFwiKVxufTtcblxucHAkNS5wYXJzZVRlbXBsYXRlID0gZnVuY3Rpb24ocmVmKSB7XG4gIGlmICggcmVmID09PSB2b2lkIDAgKSByZWYgPSB7fTtcbiAgdmFyIGlzVGFnZ2VkID0gcmVmLmlzVGFnZ2VkOyBpZiAoIGlzVGFnZ2VkID09PSB2b2lkIDAgKSBpc1RhZ2dlZCA9IGZhbHNlO1xuXG4gIHZhciBub2RlID0gdGhpcy5zdGFydE5vZGUoKTtcbiAgdGhpcy5uZXh0KCk7XG4gIG5vZGUuZXhwcmVzc2lvbnMgPSBbXTtcbiAgdmFyIGN1ckVsdCA9IHRoaXMucGFyc2VUZW1wbGF0ZUVsZW1lbnQoe2lzVGFnZ2VkOiBpc1RhZ2dlZH0pO1xuICBub2RlLnF1YXNpcyA9IFtjdXJFbHRdO1xuICB3aGlsZSAoIWN1ckVsdC50YWlsKSB7XG4gICAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5lb2YpIHsgdGhpcy5yYWlzZSh0aGlzLnBvcywgXCJVbnRlcm1pbmF0ZWQgdGVtcGxhdGUgbGl0ZXJhbFwiKTsgfVxuICAgIHRoaXMuZXhwZWN0KHR5cGVzJDEuZG9sbGFyQnJhY2VMKTtcbiAgICBub2RlLmV4cHJlc3Npb25zLnB1c2godGhpcy5wYXJzZUV4cHJlc3Npb24oKSk7XG4gICAgdGhpcy5leHBlY3QodHlwZXMkMS5icmFjZVIpO1xuICAgIG5vZGUucXVhc2lzLnB1c2goY3VyRWx0ID0gdGhpcy5wYXJzZVRlbXBsYXRlRWxlbWVudCh7aXNUYWdnZWQ6IGlzVGFnZ2VkfSkpO1xuICB9XG4gIHRoaXMubmV4dCgpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiVGVtcGxhdGVMaXRlcmFsXCIpXG59O1xuXG5wcCQ1LmlzQXN5bmNQcm9wID0gZnVuY3Rpb24ocHJvcCkge1xuICByZXR1cm4gIXByb3AuY29tcHV0ZWQgJiYgcHJvcC5rZXkudHlwZSA9PT0gXCJJZGVudGlmaWVyXCIgJiYgcHJvcC5rZXkubmFtZSA9PT0gXCJhc3luY1wiICYmXG4gICAgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5uYW1lIHx8IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5udW0gfHwgdGhpcy50eXBlID09PSB0eXBlcyQxLnN0cmluZyB8fCB0aGlzLnR5cGUgPT09IHR5cGVzJDEuYnJhY2tldEwgfHwgdGhpcy50eXBlLmtleXdvcmQgfHwgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA5ICYmIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5zdGFyKSkgJiZcbiAgICAhbGluZUJyZWFrLnRlc3QodGhpcy5pbnB1dC5zbGljZSh0aGlzLmxhc3RUb2tFbmQsIHRoaXMuc3RhcnQpKVxufTtcblxuLy8gUGFyc2UgYW4gb2JqZWN0IGxpdGVyYWwgb3IgYmluZGluZyBwYXR0ZXJuLlxuXG5wcCQ1LnBhcnNlT2JqID0gZnVuY3Rpb24oaXNQYXR0ZXJuLCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKSB7XG4gIHZhciBub2RlID0gdGhpcy5zdGFydE5vZGUoKSwgZmlyc3QgPSB0cnVlLCBwcm9wSGFzaCA9IHt9O1xuICBub2RlLnByb3BlcnRpZXMgPSBbXTtcbiAgdGhpcy5uZXh0KCk7XG4gIHdoaWxlICghdGhpcy5lYXQodHlwZXMkMS5icmFjZVIpKSB7XG4gICAgaWYgKCFmaXJzdCkge1xuICAgICAgdGhpcy5leHBlY3QodHlwZXMkMS5jb21tYSk7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDUgJiYgdGhpcy5hZnRlclRyYWlsaW5nQ29tbWEodHlwZXMkMS5icmFjZVIpKSB7IGJyZWFrIH1cbiAgICB9IGVsc2UgeyBmaXJzdCA9IGZhbHNlOyB9XG5cbiAgICB2YXIgcHJvcCA9IHRoaXMucGFyc2VQcm9wZXJ0eShpc1BhdHRlcm4sIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpO1xuICAgIGlmICghaXNQYXR0ZXJuKSB7IHRoaXMuY2hlY2tQcm9wQ2xhc2gocHJvcCwgcHJvcEhhc2gsIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpOyB9XG4gICAgbm9kZS5wcm9wZXJ0aWVzLnB1c2gocHJvcCk7XG4gIH1cbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBpc1BhdHRlcm4gPyBcIk9iamVjdFBhdHRlcm5cIiA6IFwiT2JqZWN0RXhwcmVzc2lvblwiKVxufTtcblxucHAkNS5wYXJzZVByb3BlcnR5ID0gZnVuY3Rpb24oaXNQYXR0ZXJuLCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKSB7XG4gIHZhciBwcm9wID0gdGhpcy5zdGFydE5vZGUoKSwgaXNHZW5lcmF0b3IsIGlzQXN5bmMsIHN0YXJ0UG9zLCBzdGFydExvYztcbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA5ICYmIHRoaXMuZWF0KHR5cGVzJDEuZWxsaXBzaXMpKSB7XG4gICAgaWYgKGlzUGF0dGVybikge1xuICAgICAgcHJvcC5hcmd1bWVudCA9IHRoaXMucGFyc2VJZGVudChmYWxzZSk7XG4gICAgICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLmNvbW1hKSB7XG4gICAgICAgIHRoaXMucmFpc2VSZWNvdmVyYWJsZSh0aGlzLnN0YXJ0LCBcIkNvbW1hIGlzIG5vdCBwZXJtaXR0ZWQgYWZ0ZXIgdGhlIHJlc3QgZWxlbWVudFwiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmZpbmlzaE5vZGUocHJvcCwgXCJSZXN0RWxlbWVudFwiKVxuICAgIH1cbiAgICAvLyBQYXJzZSBhcmd1bWVudC5cbiAgICBwcm9wLmFyZ3VtZW50ID0gdGhpcy5wYXJzZU1heWJlQXNzaWduKGZhbHNlLCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKTtcbiAgICAvLyBUbyBkaXNhbGxvdyB0cmFpbGluZyBjb21tYSB2aWEgYHRoaXMudG9Bc3NpZ25hYmxlKClgLlxuICAgIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuY29tbWEgJiYgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycyAmJiByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnRyYWlsaW5nQ29tbWEgPCAwKSB7XG4gICAgICByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnRyYWlsaW5nQ29tbWEgPSB0aGlzLnN0YXJ0O1xuICAgIH1cbiAgICAvLyBGaW5pc2hcbiAgICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKHByb3AsIFwiU3ByZWFkRWxlbWVudFwiKVxuICB9XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNikge1xuICAgIHByb3AubWV0aG9kID0gZmFsc2U7XG4gICAgcHJvcC5zaG9ydGhhbmQgPSBmYWxzZTtcbiAgICBpZiAoaXNQYXR0ZXJuIHx8IHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpIHtcbiAgICAgIHN0YXJ0UG9zID0gdGhpcy5zdGFydDtcbiAgICAgIHN0YXJ0TG9jID0gdGhpcy5zdGFydExvYztcbiAgICB9XG4gICAgaWYgKCFpc1BhdHRlcm4pXG4gICAgICB7IGlzR2VuZXJhdG9yID0gdGhpcy5lYXQodHlwZXMkMS5zdGFyKTsgfVxuICB9XG4gIHZhciBjb250YWluc0VzYyA9IHRoaXMuY29udGFpbnNFc2M7XG4gIHRoaXMucGFyc2VQcm9wZXJ0eU5hbWUocHJvcCk7XG4gIGlmICghaXNQYXR0ZXJuICYmICFjb250YWluc0VzYyAmJiB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOCAmJiAhaXNHZW5lcmF0b3IgJiYgdGhpcy5pc0FzeW5jUHJvcChwcm9wKSkge1xuICAgIGlzQXN5bmMgPSB0cnVlO1xuICAgIGlzR2VuZXJhdG9yID0gdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDkgJiYgdGhpcy5lYXQodHlwZXMkMS5zdGFyKTtcbiAgICB0aGlzLnBhcnNlUHJvcGVydHlOYW1lKHByb3ApO1xuICB9IGVsc2Uge1xuICAgIGlzQXN5bmMgPSBmYWxzZTtcbiAgfVxuICB0aGlzLnBhcnNlUHJvcGVydHlWYWx1ZShwcm9wLCBpc1BhdHRlcm4sIGlzR2VuZXJhdG9yLCBpc0FzeW5jLCBzdGFydFBvcywgc3RhcnRMb2MsIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMsIGNvbnRhaW5zRXNjKTtcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShwcm9wLCBcIlByb3BlcnR5XCIpXG59O1xuXG5wcCQ1LnBhcnNlR2V0dGVyU2V0dGVyID0gZnVuY3Rpb24ocHJvcCkge1xuICB2YXIga2luZCA9IHByb3Aua2V5Lm5hbWU7XG4gIHRoaXMucGFyc2VQcm9wZXJ0eU5hbWUocHJvcCk7XG4gIHByb3AudmFsdWUgPSB0aGlzLnBhcnNlTWV0aG9kKGZhbHNlKTtcbiAgcHJvcC5raW5kID0ga2luZDtcbiAgdmFyIHBhcmFtQ291bnQgPSBwcm9wLmtpbmQgPT09IFwiZ2V0XCIgPyAwIDogMTtcbiAgaWYgKHByb3AudmFsdWUucGFyYW1zLmxlbmd0aCAhPT0gcGFyYW1Db3VudCkge1xuICAgIHZhciBzdGFydCA9IHByb3AudmFsdWUuc3RhcnQ7XG4gICAgaWYgKHByb3Aua2luZCA9PT0gXCJnZXRcIilcbiAgICAgIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKHN0YXJ0LCBcImdldHRlciBzaG91bGQgaGF2ZSBubyBwYXJhbXNcIik7IH1cbiAgICBlbHNlXG4gICAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShzdGFydCwgXCJzZXR0ZXIgc2hvdWxkIGhhdmUgZXhhY3RseSBvbmUgcGFyYW1cIik7IH1cbiAgfSBlbHNlIHtcbiAgICBpZiAocHJvcC5raW5kID09PSBcInNldFwiICYmIHByb3AudmFsdWUucGFyYW1zWzBdLnR5cGUgPT09IFwiUmVzdEVsZW1lbnRcIilcbiAgICAgIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKHByb3AudmFsdWUucGFyYW1zWzBdLnN0YXJ0LCBcIlNldHRlciBjYW5ub3QgdXNlIHJlc3QgcGFyYW1zXCIpOyB9XG4gIH1cbn07XG5cbnBwJDUucGFyc2VQcm9wZXJ0eVZhbHVlID0gZnVuY3Rpb24ocHJvcCwgaXNQYXR0ZXJuLCBpc0dlbmVyYXRvciwgaXNBc3luYywgc3RhcnRQb3MsIHN0YXJ0TG9jLCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCBjb250YWluc0VzYykge1xuICBpZiAoKGlzR2VuZXJhdG9yIHx8IGlzQXN5bmMpICYmIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5jb2xvbilcbiAgICB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG5cbiAgaWYgKHRoaXMuZWF0KHR5cGVzJDEuY29sb24pKSB7XG4gICAgcHJvcC52YWx1ZSA9IGlzUGF0dGVybiA/IHRoaXMucGFyc2VNYXliZURlZmF1bHQodGhpcy5zdGFydCwgdGhpcy5zdGFydExvYykgOiB0aGlzLnBhcnNlTWF5YmVBc3NpZ24oZmFsc2UsIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpO1xuICAgIHByb3Aua2luZCA9IFwiaW5pdFwiO1xuICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2ICYmIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5wYXJlbkwpIHtcbiAgICBpZiAoaXNQYXR0ZXJuKSB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gICAgcHJvcC5tZXRob2QgPSB0cnVlO1xuICAgIHByb3AudmFsdWUgPSB0aGlzLnBhcnNlTWV0aG9kKGlzR2VuZXJhdG9yLCBpc0FzeW5jKTtcbiAgICBwcm9wLmtpbmQgPSBcImluaXRcIjtcbiAgfSBlbHNlIGlmICghaXNQYXR0ZXJuICYmICFjb250YWluc0VzYyAmJlxuICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA1ICYmICFwcm9wLmNvbXB1dGVkICYmIHByb3Aua2V5LnR5cGUgPT09IFwiSWRlbnRpZmllclwiICYmXG4gICAgICAgICAgICAgKHByb3Aua2V5Lm5hbWUgPT09IFwiZ2V0XCIgfHwgcHJvcC5rZXkubmFtZSA9PT0gXCJzZXRcIikgJiZcbiAgICAgICAgICAgICAodGhpcy50eXBlICE9PSB0eXBlcyQxLmNvbW1hICYmIHRoaXMudHlwZSAhPT0gdHlwZXMkMS5icmFjZVIgJiYgdGhpcy50eXBlICE9PSB0eXBlcyQxLmVxKSkge1xuICAgIGlmIChpc0dlbmVyYXRvciB8fCBpc0FzeW5jKSB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gICAgdGhpcy5wYXJzZUdldHRlclNldHRlcihwcm9wKTtcbiAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNiAmJiAhcHJvcC5jb21wdXRlZCAmJiBwcm9wLmtleS50eXBlID09PSBcIklkZW50aWZpZXJcIikge1xuICAgIGlmIChpc0dlbmVyYXRvciB8fCBpc0FzeW5jKSB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gICAgdGhpcy5jaGVja1VucmVzZXJ2ZWQocHJvcC5rZXkpO1xuICAgIGlmIChwcm9wLmtleS5uYW1lID09PSBcImF3YWl0XCIgJiYgIXRoaXMuYXdhaXRJZGVudFBvcylcbiAgICAgIHsgdGhpcy5hd2FpdElkZW50UG9zID0gc3RhcnRQb3M7IH1cbiAgICBpZiAoaXNQYXR0ZXJuKSB7XG4gICAgICBwcm9wLnZhbHVlID0gdGhpcy5wYXJzZU1heWJlRGVmYXVsdChzdGFydFBvcywgc3RhcnRMb2MsIHRoaXMuY29weU5vZGUocHJvcC5rZXkpKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5lcSAmJiByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKSB7XG4gICAgICBpZiAocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy5zaG9ydGhhbmRBc3NpZ24gPCAwKVxuICAgICAgICB7IHJlZkRlc3RydWN0dXJpbmdFcnJvcnMuc2hvcnRoYW5kQXNzaWduID0gdGhpcy5zdGFydDsgfVxuICAgICAgcHJvcC52YWx1ZSA9IHRoaXMucGFyc2VNYXliZURlZmF1bHQoc3RhcnRQb3MsIHN0YXJ0TG9jLCB0aGlzLmNvcHlOb2RlKHByb3Aua2V5KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByb3AudmFsdWUgPSB0aGlzLmNvcHlOb2RlKHByb3Aua2V5KTtcbiAgICB9XG4gICAgcHJvcC5raW5kID0gXCJpbml0XCI7XG4gICAgcHJvcC5zaG9ydGhhbmQgPSB0cnVlO1xuICB9IGVsc2UgeyB0aGlzLnVuZXhwZWN0ZWQoKTsgfVxufTtcblxucHAkNS5wYXJzZVByb3BlcnR5TmFtZSA9IGZ1bmN0aW9uKHByb3ApIHtcbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2KSB7XG4gICAgaWYgKHRoaXMuZWF0KHR5cGVzJDEuYnJhY2tldEwpKSB7XG4gICAgICBwcm9wLmNvbXB1dGVkID0gdHJ1ZTtcbiAgICAgIHByb3Aua2V5ID0gdGhpcy5wYXJzZU1heWJlQXNzaWduKCk7XG4gICAgICB0aGlzLmV4cGVjdCh0eXBlcyQxLmJyYWNrZXRSKTtcbiAgICAgIHJldHVybiBwcm9wLmtleVxuICAgIH0gZWxzZSB7XG4gICAgICBwcm9wLmNvbXB1dGVkID0gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiBwcm9wLmtleSA9IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5udW0gfHwgdGhpcy50eXBlID09PSB0eXBlcyQxLnN0cmluZyA/IHRoaXMucGFyc2VFeHByQXRvbSgpIDogdGhpcy5wYXJzZUlkZW50KHRoaXMub3B0aW9ucy5hbGxvd1Jlc2VydmVkICE9PSBcIm5ldmVyXCIpXG59O1xuXG4vLyBJbml0aWFsaXplIGVtcHR5IGZ1bmN0aW9uIG5vZGUuXG5cbnBwJDUuaW5pdEZ1bmN0aW9uID0gZnVuY3Rpb24obm9kZSkge1xuICBub2RlLmlkID0gbnVsbDtcbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2KSB7IG5vZGUuZ2VuZXJhdG9yID0gbm9kZS5leHByZXNzaW9uID0gZmFsc2U7IH1cbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA4KSB7IG5vZGUuYXN5bmMgPSBmYWxzZTsgfVxufTtcblxuLy8gUGFyc2Ugb2JqZWN0IG9yIGNsYXNzIG1ldGhvZC5cblxucHAkNS5wYXJzZU1ldGhvZCA9IGZ1bmN0aW9uKGlzR2VuZXJhdG9yLCBpc0FzeW5jLCBhbGxvd0RpcmVjdFN1cGVyKSB7XG4gIHZhciBub2RlID0gdGhpcy5zdGFydE5vZGUoKSwgb2xkWWllbGRQb3MgPSB0aGlzLnlpZWxkUG9zLCBvbGRBd2FpdFBvcyA9IHRoaXMuYXdhaXRQb3MsIG9sZEF3YWl0SWRlbnRQb3MgPSB0aGlzLmF3YWl0SWRlbnRQb3M7XG5cbiAgdGhpcy5pbml0RnVuY3Rpb24obm9kZSk7XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNilcbiAgICB7IG5vZGUuZ2VuZXJhdG9yID0gaXNHZW5lcmF0b3I7IH1cbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA4KVxuICAgIHsgbm9kZS5hc3luYyA9ICEhaXNBc3luYzsgfVxuXG4gIHRoaXMueWllbGRQb3MgPSAwO1xuICB0aGlzLmF3YWl0UG9zID0gMDtcbiAgdGhpcy5hd2FpdElkZW50UG9zID0gMDtcbiAgdGhpcy5lbnRlclNjb3BlKGZ1bmN0aW9uRmxhZ3MoaXNBc3luYywgbm9kZS5nZW5lcmF0b3IpIHwgU0NPUEVfU1VQRVIgfCAoYWxsb3dEaXJlY3RTdXBlciA/IFNDT1BFX0RJUkVDVF9TVVBFUiA6IDApKTtcblxuICB0aGlzLmV4cGVjdCh0eXBlcyQxLnBhcmVuTCk7XG4gIG5vZGUucGFyYW1zID0gdGhpcy5wYXJzZUJpbmRpbmdMaXN0KHR5cGVzJDEucGFyZW5SLCBmYWxzZSwgdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDgpO1xuICB0aGlzLmNoZWNrWWllbGRBd2FpdEluRGVmYXVsdFBhcmFtcygpO1xuICB0aGlzLnBhcnNlRnVuY3Rpb25Cb2R5KG5vZGUsIGZhbHNlLCB0cnVlLCBmYWxzZSk7XG5cbiAgdGhpcy55aWVsZFBvcyA9IG9sZFlpZWxkUG9zO1xuICB0aGlzLmF3YWl0UG9zID0gb2xkQXdhaXRQb3M7XG4gIHRoaXMuYXdhaXRJZGVudFBvcyA9IG9sZEF3YWl0SWRlbnRQb3M7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJGdW5jdGlvbkV4cHJlc3Npb25cIilcbn07XG5cbi8vIFBhcnNlIGFycm93IGZ1bmN0aW9uIGV4cHJlc3Npb24gd2l0aCBnaXZlbiBwYXJhbWV0ZXJzLlxuXG5wcCQ1LnBhcnNlQXJyb3dFeHByZXNzaW9uID0gZnVuY3Rpb24obm9kZSwgcGFyYW1zLCBpc0FzeW5jLCBmb3JJbml0KSB7XG4gIHZhciBvbGRZaWVsZFBvcyA9IHRoaXMueWllbGRQb3MsIG9sZEF3YWl0UG9zID0gdGhpcy5hd2FpdFBvcywgb2xkQXdhaXRJZGVudFBvcyA9IHRoaXMuYXdhaXRJZGVudFBvcztcblxuICB0aGlzLmVudGVyU2NvcGUoZnVuY3Rpb25GbGFncyhpc0FzeW5jLCBmYWxzZSkgfCBTQ09QRV9BUlJPVyk7XG4gIHRoaXMuaW5pdEZ1bmN0aW9uKG5vZGUpO1xuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDgpIHsgbm9kZS5hc3luYyA9ICEhaXNBc3luYzsgfVxuXG4gIHRoaXMueWllbGRQb3MgPSAwO1xuICB0aGlzLmF3YWl0UG9zID0gMDtcbiAgdGhpcy5hd2FpdElkZW50UG9zID0gMDtcblxuICBub2RlLnBhcmFtcyA9IHRoaXMudG9Bc3NpZ25hYmxlTGlzdChwYXJhbXMsIHRydWUpO1xuICB0aGlzLnBhcnNlRnVuY3Rpb25Cb2R5KG5vZGUsIHRydWUsIGZhbHNlLCBmb3JJbml0KTtcblxuICB0aGlzLnlpZWxkUG9zID0gb2xkWWllbGRQb3M7XG4gIHRoaXMuYXdhaXRQb3MgPSBvbGRBd2FpdFBvcztcbiAgdGhpcy5hd2FpdElkZW50UG9zID0gb2xkQXdhaXRJZGVudFBvcztcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIkFycm93RnVuY3Rpb25FeHByZXNzaW9uXCIpXG59O1xuXG4vLyBQYXJzZSBmdW5jdGlvbiBib2R5IGFuZCBjaGVjayBwYXJhbWV0ZXJzLlxuXG5wcCQ1LnBhcnNlRnVuY3Rpb25Cb2R5ID0gZnVuY3Rpb24obm9kZSwgaXNBcnJvd0Z1bmN0aW9uLCBpc01ldGhvZCwgZm9ySW5pdCkge1xuICB2YXIgaXNFeHByZXNzaW9uID0gaXNBcnJvd0Z1bmN0aW9uICYmIHRoaXMudHlwZSAhPT0gdHlwZXMkMS5icmFjZUw7XG4gIHZhciBvbGRTdHJpY3QgPSB0aGlzLnN0cmljdCwgdXNlU3RyaWN0ID0gZmFsc2U7XG5cbiAgaWYgKGlzRXhwcmVzc2lvbikge1xuICAgIG5vZGUuYm9keSA9IHRoaXMucGFyc2VNYXliZUFzc2lnbihmb3JJbml0KTtcbiAgICBub2RlLmV4cHJlc3Npb24gPSB0cnVlO1xuICAgIHRoaXMuY2hlY2tQYXJhbXMobm9kZSwgZmFsc2UpO1xuICB9IGVsc2Uge1xuICAgIHZhciBub25TaW1wbGUgPSB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNyAmJiAhdGhpcy5pc1NpbXBsZVBhcmFtTGlzdChub2RlLnBhcmFtcyk7XG4gICAgaWYgKCFvbGRTdHJpY3QgfHwgbm9uU2ltcGxlKSB7XG4gICAgICB1c2VTdHJpY3QgPSB0aGlzLnN0cmljdERpcmVjdGl2ZSh0aGlzLmVuZCk7XG4gICAgICAvLyBJZiB0aGlzIGlzIGEgc3RyaWN0IG1vZGUgZnVuY3Rpb24sIHZlcmlmeSB0aGF0IGFyZ3VtZW50IG5hbWVzXG4gICAgICAvLyBhcmUgbm90IHJlcGVhdGVkLCBhbmQgaXQgZG9lcyBub3QgdHJ5IHRvIGJpbmQgdGhlIHdvcmRzIGBldmFsYFxuICAgICAgLy8gb3IgYGFyZ3VtZW50c2AuXG4gICAgICBpZiAodXNlU3RyaWN0ICYmIG5vblNpbXBsZSlcbiAgICAgICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUobm9kZS5zdGFydCwgXCJJbGxlZ2FsICd1c2Ugc3RyaWN0JyBkaXJlY3RpdmUgaW4gZnVuY3Rpb24gd2l0aCBub24tc2ltcGxlIHBhcmFtZXRlciBsaXN0XCIpOyB9XG4gICAgfVxuICAgIC8vIFN0YXJ0IGEgbmV3IHNjb3BlIHdpdGggcmVnYXJkIHRvIGxhYmVscyBhbmQgdGhlIGBpbkZ1bmN0aW9uYFxuICAgIC8vIGZsYWcgKHJlc3RvcmUgdGhlbSB0byB0aGVpciBvbGQgdmFsdWUgYWZ0ZXJ3YXJkcykuXG4gICAgdmFyIG9sZExhYmVscyA9IHRoaXMubGFiZWxzO1xuICAgIHRoaXMubGFiZWxzID0gW107XG4gICAgaWYgKHVzZVN0cmljdCkgeyB0aGlzLnN0cmljdCA9IHRydWU7IH1cblxuICAgIC8vIEFkZCB0aGUgcGFyYW1zIHRvIHZhckRlY2xhcmVkTmFtZXMgdG8gZW5zdXJlIHRoYXQgYW4gZXJyb3IgaXMgdGhyb3duXG4gICAgLy8gaWYgYSBsZXQvY29uc3QgZGVjbGFyYXRpb24gaW4gdGhlIGZ1bmN0aW9uIGNsYXNoZXMgd2l0aCBvbmUgb2YgdGhlIHBhcmFtcy5cbiAgICB0aGlzLmNoZWNrUGFyYW1zKG5vZGUsICFvbGRTdHJpY3QgJiYgIXVzZVN0cmljdCAmJiAhaXNBcnJvd0Z1bmN0aW9uICYmICFpc01ldGhvZCAmJiB0aGlzLmlzU2ltcGxlUGFyYW1MaXN0KG5vZGUucGFyYW1zKSk7XG4gICAgLy8gRW5zdXJlIHRoZSBmdW5jdGlvbiBuYW1lIGlzbid0IGEgZm9yYmlkZGVuIGlkZW50aWZpZXIgaW4gc3RyaWN0IG1vZGUsIGUuZy4gJ2V2YWwnXG4gICAgaWYgKHRoaXMuc3RyaWN0ICYmIG5vZGUuaWQpIHsgdGhpcy5jaGVja0xWYWxTaW1wbGUobm9kZS5pZCwgQklORF9PVVRTSURFKTsgfVxuICAgIG5vZGUuYm9keSA9IHRoaXMucGFyc2VCbG9jayhmYWxzZSwgdW5kZWZpbmVkLCB1c2VTdHJpY3QgJiYgIW9sZFN0cmljdCk7XG4gICAgbm9kZS5leHByZXNzaW9uID0gZmFsc2U7XG4gICAgdGhpcy5hZGFwdERpcmVjdGl2ZVByb2xvZ3VlKG5vZGUuYm9keS5ib2R5KTtcbiAgICB0aGlzLmxhYmVscyA9IG9sZExhYmVscztcbiAgfVxuICB0aGlzLmV4aXRTY29wZSgpO1xufTtcblxucHAkNS5pc1NpbXBsZVBhcmFtTGlzdCA9IGZ1bmN0aW9uKHBhcmFtcykge1xuICBmb3IgKHZhciBpID0gMCwgbGlzdCA9IHBhcmFtczsgaSA8IGxpc3QubGVuZ3RoOyBpICs9IDEpXG4gICAge1xuICAgIHZhciBwYXJhbSA9IGxpc3RbaV07XG5cbiAgICBpZiAocGFyYW0udHlwZSAhPT0gXCJJZGVudGlmaWVyXCIpIHsgcmV0dXJuIGZhbHNlXG4gIH0gfVxuICByZXR1cm4gdHJ1ZVxufTtcblxuLy8gQ2hlY2tzIGZ1bmN0aW9uIHBhcmFtcyBmb3IgdmFyaW91cyBkaXNhbGxvd2VkIHBhdHRlcm5zIHN1Y2ggYXMgdXNpbmcgXCJldmFsXCJcbi8vIG9yIFwiYXJndW1lbnRzXCIgYW5kIGR1cGxpY2F0ZSBwYXJhbWV0ZXJzLlxuXG5wcCQ1LmNoZWNrUGFyYW1zID0gZnVuY3Rpb24obm9kZSwgYWxsb3dEdXBsaWNhdGVzKSB7XG4gIHZhciBuYW1lSGFzaCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGZvciAodmFyIGkgPSAwLCBsaXN0ID0gbm9kZS5wYXJhbXM7IGkgPCBsaXN0Lmxlbmd0aDsgaSArPSAxKVxuICAgIHtcbiAgICB2YXIgcGFyYW0gPSBsaXN0W2ldO1xuXG4gICAgdGhpcy5jaGVja0xWYWxJbm5lclBhdHRlcm4ocGFyYW0sIEJJTkRfVkFSLCBhbGxvd0R1cGxpY2F0ZXMgPyBudWxsIDogbmFtZUhhc2gpO1xuICB9XG59O1xuXG4vLyBQYXJzZXMgYSBjb21tYS1zZXBhcmF0ZWQgbGlzdCBvZiBleHByZXNzaW9ucywgYW5kIHJldHVybnMgdGhlbSBhc1xuLy8gYW4gYXJyYXkuIGBjbG9zZWAgaXMgdGhlIHRva2VuIHR5cGUgdGhhdCBlbmRzIHRoZSBsaXN0LCBhbmRcbi8vIGBhbGxvd0VtcHR5YCBjYW4gYmUgdHVybmVkIG9uIHRvIGFsbG93IHN1YnNlcXVlbnQgY29tbWFzIHdpdGhcbi8vIG5vdGhpbmcgaW4gYmV0d2VlbiB0aGVtIHRvIGJlIHBhcnNlZCBhcyBgbnVsbGAgKHdoaWNoIGlzIG5lZWRlZFxuLy8gZm9yIGFycmF5IGxpdGVyYWxzKS5cblxucHAkNS5wYXJzZUV4cHJMaXN0ID0gZnVuY3Rpb24oY2xvc2UsIGFsbG93VHJhaWxpbmdDb21tYSwgYWxsb3dFbXB0eSwgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykge1xuICB2YXIgZWx0cyA9IFtdLCBmaXJzdCA9IHRydWU7XG4gIHdoaWxlICghdGhpcy5lYXQoY2xvc2UpKSB7XG4gICAgaWYgKCFmaXJzdCkge1xuICAgICAgdGhpcy5leHBlY3QodHlwZXMkMS5jb21tYSk7XG4gICAgICBpZiAoYWxsb3dUcmFpbGluZ0NvbW1hICYmIHRoaXMuYWZ0ZXJUcmFpbGluZ0NvbW1hKGNsb3NlKSkgeyBicmVhayB9XG4gICAgfSBlbHNlIHsgZmlyc3QgPSBmYWxzZTsgfVxuXG4gICAgdmFyIGVsdCA9ICh2b2lkIDApO1xuICAgIGlmIChhbGxvd0VtcHR5ICYmIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5jb21tYSlcbiAgICAgIHsgZWx0ID0gbnVsbDsgfVxuICAgIGVsc2UgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5lbGxpcHNpcykge1xuICAgICAgZWx0ID0gdGhpcy5wYXJzZVNwcmVhZChyZWZEZXN0cnVjdHVyaW5nRXJyb3JzKTtcbiAgICAgIGlmIChyZWZEZXN0cnVjdHVyaW5nRXJyb3JzICYmIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5jb21tYSAmJiByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnRyYWlsaW5nQ29tbWEgPCAwKVxuICAgICAgICB7IHJlZkRlc3RydWN0dXJpbmdFcnJvcnMudHJhaWxpbmdDb21tYSA9IHRoaXMuc3RhcnQ7IH1cbiAgICB9IGVsc2Uge1xuICAgICAgZWx0ID0gdGhpcy5wYXJzZU1heWJlQXNzaWduKGZhbHNlLCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKTtcbiAgICB9XG4gICAgZWx0cy5wdXNoKGVsdCk7XG4gIH1cbiAgcmV0dXJuIGVsdHNcbn07XG5cbnBwJDUuY2hlY2tVbnJlc2VydmVkID0gZnVuY3Rpb24ocmVmKSB7XG4gIHZhciBzdGFydCA9IHJlZi5zdGFydDtcbiAgdmFyIGVuZCA9IHJlZi5lbmQ7XG4gIHZhciBuYW1lID0gcmVmLm5hbWU7XG5cbiAgaWYgKHRoaXMuaW5HZW5lcmF0b3IgJiYgbmFtZSA9PT0gXCJ5aWVsZFwiKVxuICAgIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKHN0YXJ0LCBcIkNhbm5vdCB1c2UgJ3lpZWxkJyBhcyBpZGVudGlmaWVyIGluc2lkZSBhIGdlbmVyYXRvclwiKTsgfVxuICBpZiAodGhpcy5pbkFzeW5jICYmIG5hbWUgPT09IFwiYXdhaXRcIilcbiAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShzdGFydCwgXCJDYW5ub3QgdXNlICdhd2FpdCcgYXMgaWRlbnRpZmllciBpbnNpZGUgYW4gYXN5bmMgZnVuY3Rpb25cIik7IH1cbiAgaWYgKCEodGhpcy5jdXJyZW50VGhpc1Njb3BlKCkuZmxhZ3MgJiBTQ09QRV9WQVIpICYmIG5hbWUgPT09IFwiYXJndW1lbnRzXCIpXG4gICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUoc3RhcnQsIFwiQ2Fubm90IHVzZSAnYXJndW1lbnRzJyBpbiBjbGFzcyBmaWVsZCBpbml0aWFsaXplclwiKTsgfVxuICBpZiAodGhpcy5pbkNsYXNzU3RhdGljQmxvY2sgJiYgKG5hbWUgPT09IFwiYXJndW1lbnRzXCIgfHwgbmFtZSA9PT0gXCJhd2FpdFwiKSlcbiAgICB7IHRoaXMucmFpc2Uoc3RhcnQsIChcIkNhbm5vdCB1c2UgXCIgKyBuYW1lICsgXCIgaW4gY2xhc3Mgc3RhdGljIGluaXRpYWxpemF0aW9uIGJsb2NrXCIpKTsgfVxuICBpZiAodGhpcy5rZXl3b3Jkcy50ZXN0KG5hbWUpKVxuICAgIHsgdGhpcy5yYWlzZShzdGFydCwgKFwiVW5leHBlY3RlZCBrZXl3b3JkICdcIiArIG5hbWUgKyBcIidcIikpOyB9XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPCA2ICYmXG4gICAgdGhpcy5pbnB1dC5zbGljZShzdGFydCwgZW5kKS5pbmRleE9mKFwiXFxcXFwiKSAhPT0gLTEpIHsgcmV0dXJuIH1cbiAgdmFyIHJlID0gdGhpcy5zdHJpY3QgPyB0aGlzLnJlc2VydmVkV29yZHNTdHJpY3QgOiB0aGlzLnJlc2VydmVkV29yZHM7XG4gIGlmIChyZS50ZXN0KG5hbWUpKSB7XG4gICAgaWYgKCF0aGlzLmluQXN5bmMgJiYgbmFtZSA9PT0gXCJhd2FpdFwiKVxuICAgICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUoc3RhcnQsIFwiQ2Fubm90IHVzZSBrZXl3b3JkICdhd2FpdCcgb3V0c2lkZSBhbiBhc3luYyBmdW5jdGlvblwiKTsgfVxuICAgIHRoaXMucmFpc2VSZWNvdmVyYWJsZShzdGFydCwgKFwiVGhlIGtleXdvcmQgJ1wiICsgbmFtZSArIFwiJyBpcyByZXNlcnZlZFwiKSk7XG4gIH1cbn07XG5cbi8vIFBhcnNlIHRoZSBuZXh0IHRva2VuIGFzIGFuIGlkZW50aWZpZXIuIElmIGBsaWJlcmFsYCBpcyB0cnVlICh1c2VkXG4vLyB3aGVuIHBhcnNpbmcgcHJvcGVydGllcyksIGl0IHdpbGwgYWxzbyBjb252ZXJ0IGtleXdvcmRzIGludG9cbi8vIGlkZW50aWZpZXJzLlxuXG5wcCQ1LnBhcnNlSWRlbnQgPSBmdW5jdGlvbihsaWJlcmFsKSB7XG4gIHZhciBub2RlID0gdGhpcy5wYXJzZUlkZW50Tm9kZSgpO1xuICB0aGlzLm5leHQoISFsaWJlcmFsKTtcbiAgdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiSWRlbnRpZmllclwiKTtcbiAgaWYgKCFsaWJlcmFsKSB7XG4gICAgdGhpcy5jaGVja1VucmVzZXJ2ZWQobm9kZSk7XG4gICAgaWYgKG5vZGUubmFtZSA9PT0gXCJhd2FpdFwiICYmICF0aGlzLmF3YWl0SWRlbnRQb3MpXG4gICAgICB7IHRoaXMuYXdhaXRJZGVudFBvcyA9IG5vZGUuc3RhcnQ7IH1cbiAgfVxuICByZXR1cm4gbm9kZVxufTtcblxucHAkNS5wYXJzZUlkZW50Tm9kZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEubmFtZSkge1xuICAgIG5vZGUubmFtZSA9IHRoaXMudmFsdWU7XG4gIH0gZWxzZSBpZiAodGhpcy50eXBlLmtleXdvcmQpIHtcbiAgICBub2RlLm5hbWUgPSB0aGlzLnR5cGUua2V5d29yZDtcblxuICAgIC8vIFRvIGZpeCBodHRwczovL2dpdGh1Yi5jb20vYWNvcm5qcy9hY29ybi9pc3N1ZXMvNTc1XG4gICAgLy8gYGNsYXNzYCBhbmQgYGZ1bmN0aW9uYCBrZXl3b3JkcyBwdXNoIG5ldyBjb250ZXh0IGludG8gdGhpcy5jb250ZXh0LlxuICAgIC8vIEJ1dCB0aGVyZSBpcyBubyBjaGFuY2UgdG8gcG9wIHRoZSBjb250ZXh0IGlmIHRoZSBrZXl3b3JkIGlzIGNvbnN1bWVkIGFzIGFuIGlkZW50aWZpZXIgc3VjaCBhcyBhIHByb3BlcnR5IG5hbWUuXG4gICAgLy8gSWYgdGhlIHByZXZpb3VzIHRva2VuIGlzIGEgZG90LCB0aGlzIGRvZXMgbm90IGFwcGx5IGJlY2F1c2UgdGhlIGNvbnRleHQtbWFuYWdpbmcgY29kZSBhbHJlYWR5IGlnbm9yZWQgdGhlIGtleXdvcmRcbiAgICBpZiAoKG5vZGUubmFtZSA9PT0gXCJjbGFzc1wiIHx8IG5vZGUubmFtZSA9PT0gXCJmdW5jdGlvblwiKSAmJlxuICAgICAgKHRoaXMubGFzdFRva0VuZCAhPT0gdGhpcy5sYXN0VG9rU3RhcnQgKyAxIHx8IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLmxhc3RUb2tTdGFydCkgIT09IDQ2KSkge1xuICAgICAgdGhpcy5jb250ZXh0LnBvcCgpO1xuICAgIH1cbiAgICB0aGlzLnR5cGUgPSB0eXBlcyQxLm5hbWU7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy51bmV4cGVjdGVkKCk7XG4gIH1cbiAgcmV0dXJuIG5vZGVcbn07XG5cbnBwJDUucGFyc2VQcml2YXRlSWRlbnQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLnByaXZhdGVJZCkge1xuICAgIG5vZGUubmFtZSA9IHRoaXMudmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy51bmV4cGVjdGVkKCk7XG4gIH1cbiAgdGhpcy5uZXh0KCk7XG4gIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIlByaXZhdGVJZGVudGlmaWVyXCIpO1xuXG4gIC8vIEZvciB2YWxpZGF0aW5nIGV4aXN0ZW5jZVxuICBpZiAodGhpcy5vcHRpb25zLmNoZWNrUHJpdmF0ZUZpZWxkcykge1xuICAgIGlmICh0aGlzLnByaXZhdGVOYW1lU3RhY2subGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLnJhaXNlKG5vZGUuc3RhcnQsIChcIlByaXZhdGUgZmllbGQgJyNcIiArIChub2RlLm5hbWUpICsgXCInIG11c3QgYmUgZGVjbGFyZWQgaW4gYW4gZW5jbG9zaW5nIGNsYXNzXCIpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wcml2YXRlTmFtZVN0YWNrW3RoaXMucHJpdmF0ZU5hbWVTdGFjay5sZW5ndGggLSAxXS51c2VkLnB1c2gobm9kZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5vZGVcbn07XG5cbi8vIFBhcnNlcyB5aWVsZCBleHByZXNzaW9uIGluc2lkZSBnZW5lcmF0b3IuXG5cbnBwJDUucGFyc2VZaWVsZCA9IGZ1bmN0aW9uKGZvckluaXQpIHtcbiAgaWYgKCF0aGlzLnlpZWxkUG9zKSB7IHRoaXMueWllbGRQb3MgPSB0aGlzLnN0YXJ0OyB9XG5cbiAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICB0aGlzLm5leHQoKTtcbiAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5zZW1pIHx8IHRoaXMuY2FuSW5zZXJ0U2VtaWNvbG9uKCkgfHwgKHRoaXMudHlwZSAhPT0gdHlwZXMkMS5zdGFyICYmICF0aGlzLnR5cGUuc3RhcnRzRXhwcikpIHtcbiAgICBub2RlLmRlbGVnYXRlID0gZmFsc2U7XG4gICAgbm9kZS5hcmd1bWVudCA9IG51bGw7XG4gIH0gZWxzZSB7XG4gICAgbm9kZS5kZWxlZ2F0ZSA9IHRoaXMuZWF0KHR5cGVzJDEuc3Rhcik7XG4gICAgbm9kZS5hcmd1bWVudCA9IHRoaXMucGFyc2VNYXliZUFzc2lnbihmb3JJbml0KTtcbiAgfVxuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiWWllbGRFeHByZXNzaW9uXCIpXG59O1xuXG5wcCQ1LnBhcnNlQXdhaXQgPSBmdW5jdGlvbihmb3JJbml0KSB7XG4gIGlmICghdGhpcy5hd2FpdFBvcykgeyB0aGlzLmF3YWl0UG9zID0gdGhpcy5zdGFydDsgfVxuXG4gIHZhciBub2RlID0gdGhpcy5zdGFydE5vZGUoKTtcbiAgdGhpcy5uZXh0KCk7XG4gIG5vZGUuYXJndW1lbnQgPSB0aGlzLnBhcnNlTWF5YmVVbmFyeShudWxsLCB0cnVlLCBmYWxzZSwgZm9ySW5pdCk7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJBd2FpdEV4cHJlc3Npb25cIilcbn07XG5cbnZhciBwcCQ0ID0gUGFyc2VyLnByb3RvdHlwZTtcblxuLy8gVGhpcyBmdW5jdGlvbiBpcyB1c2VkIHRvIHJhaXNlIGV4Y2VwdGlvbnMgb24gcGFyc2UgZXJyb3JzLiBJdFxuLy8gdGFrZXMgYW4gb2Zmc2V0IGludGVnZXIgKGludG8gdGhlIGN1cnJlbnQgYGlucHV0YCkgdG8gaW5kaWNhdGVcbi8vIHRoZSBsb2NhdGlvbiBvZiB0aGUgZXJyb3IsIGF0dGFjaGVzIHRoZSBwb3NpdGlvbiB0byB0aGUgZW5kXG4vLyBvZiB0aGUgZXJyb3IgbWVzc2FnZSwgYW5kIHRoZW4gcmFpc2VzIGEgYFN5bnRheEVycm9yYCB3aXRoIHRoYXRcbi8vIG1lc3NhZ2UuXG5cbnBwJDQucmFpc2UgPSBmdW5jdGlvbihwb3MsIG1lc3NhZ2UpIHtcbiAgdmFyIGxvYyA9IGdldExpbmVJbmZvKHRoaXMuaW5wdXQsIHBvcyk7XG4gIG1lc3NhZ2UgKz0gXCIgKFwiICsgbG9jLmxpbmUgKyBcIjpcIiArIGxvYy5jb2x1bW4gKyBcIilcIjtcbiAgaWYgKHRoaXMuc291cmNlRmlsZSkge1xuICAgIG1lc3NhZ2UgKz0gXCIgaW4gXCIgKyB0aGlzLnNvdXJjZUZpbGU7XG4gIH1cbiAgdmFyIGVyciA9IG5ldyBTeW50YXhFcnJvcihtZXNzYWdlKTtcbiAgZXJyLnBvcyA9IHBvczsgZXJyLmxvYyA9IGxvYzsgZXJyLnJhaXNlZEF0ID0gdGhpcy5wb3M7XG4gIHRocm93IGVyclxufTtcblxucHAkNC5yYWlzZVJlY292ZXJhYmxlID0gcHAkNC5yYWlzZTtcblxucHAkNC5jdXJQb3NpdGlvbiA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5vcHRpb25zLmxvY2F0aW9ucykge1xuICAgIHJldHVybiBuZXcgUG9zaXRpb24odGhpcy5jdXJMaW5lLCB0aGlzLnBvcyAtIHRoaXMubGluZVN0YXJ0KVxuICB9XG59O1xuXG52YXIgcHAkMyA9IFBhcnNlci5wcm90b3R5cGU7XG5cbnZhciBTY29wZSA9IGZ1bmN0aW9uIFNjb3BlKGZsYWdzKSB7XG4gIHRoaXMuZmxhZ3MgPSBmbGFncztcbiAgLy8gQSBsaXN0IG9mIHZhci1kZWNsYXJlZCBuYW1lcyBpbiB0aGUgY3VycmVudCBsZXhpY2FsIHNjb3BlXG4gIHRoaXMudmFyID0gW107XG4gIC8vIEEgbGlzdCBvZiBsZXhpY2FsbHktZGVjbGFyZWQgbmFtZXMgaW4gdGhlIGN1cnJlbnQgbGV4aWNhbCBzY29wZVxuICB0aGlzLmxleGljYWwgPSBbXTtcbiAgLy8gQSBsaXN0IG9mIGxleGljYWxseS1kZWNsYXJlZCBGdW5jdGlvbkRlY2xhcmF0aW9uIG5hbWVzIGluIHRoZSBjdXJyZW50IGxleGljYWwgc2NvcGVcbiAgdGhpcy5mdW5jdGlvbnMgPSBbXTtcbn07XG5cbi8vIFRoZSBmdW5jdGlvbnMgaW4gdGhpcyBtb2R1bGUga2VlcCB0cmFjayBvZiBkZWNsYXJlZCB2YXJpYWJsZXMgaW4gdGhlIGN1cnJlbnQgc2NvcGUgaW4gb3JkZXIgdG8gZGV0ZWN0IGR1cGxpY2F0ZSB2YXJpYWJsZSBuYW1lcy5cblxucHAkMy5lbnRlclNjb3BlID0gZnVuY3Rpb24oZmxhZ3MpIHtcbiAgdGhpcy5zY29wZVN0YWNrLnB1c2gobmV3IFNjb3BlKGZsYWdzKSk7XG59O1xuXG5wcCQzLmV4aXRTY29wZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnNjb3BlU3RhY2sucG9wKCk7XG59O1xuXG4vLyBUaGUgc3BlYyBzYXlzOlxuLy8gPiBBdCB0aGUgdG9wIGxldmVsIG9mIGEgZnVuY3Rpb24sIG9yIHNjcmlwdCwgZnVuY3Rpb24gZGVjbGFyYXRpb25zIGFyZVxuLy8gPiB0cmVhdGVkIGxpa2UgdmFyIGRlY2xhcmF0aW9ucyByYXRoZXIgdGhhbiBsaWtlIGxleGljYWwgZGVjbGFyYXRpb25zLlxucHAkMy50cmVhdEZ1bmN0aW9uc0FzVmFySW5TY29wZSA9IGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHJldHVybiAoc2NvcGUuZmxhZ3MgJiBTQ09QRV9GVU5DVElPTikgfHwgIXRoaXMuaW5Nb2R1bGUgJiYgKHNjb3BlLmZsYWdzICYgU0NPUEVfVE9QKVxufTtcblxucHAkMy5kZWNsYXJlTmFtZSA9IGZ1bmN0aW9uKG5hbWUsIGJpbmRpbmdUeXBlLCBwb3MpIHtcbiAgdmFyIHJlZGVjbGFyZWQgPSBmYWxzZTtcbiAgaWYgKGJpbmRpbmdUeXBlID09PSBCSU5EX0xFWElDQUwpIHtcbiAgICB2YXIgc2NvcGUgPSB0aGlzLmN1cnJlbnRTY29wZSgpO1xuICAgIHJlZGVjbGFyZWQgPSBzY29wZS5sZXhpY2FsLmluZGV4T2YobmFtZSkgPiAtMSB8fCBzY29wZS5mdW5jdGlvbnMuaW5kZXhPZihuYW1lKSA+IC0xIHx8IHNjb3BlLnZhci5pbmRleE9mKG5hbWUpID4gLTE7XG4gICAgc2NvcGUubGV4aWNhbC5wdXNoKG5hbWUpO1xuICAgIGlmICh0aGlzLmluTW9kdWxlICYmIChzY29wZS5mbGFncyAmIFNDT1BFX1RPUCkpXG4gICAgICB7IGRlbGV0ZSB0aGlzLnVuZGVmaW5lZEV4cG9ydHNbbmFtZV07IH1cbiAgfSBlbHNlIGlmIChiaW5kaW5nVHlwZSA9PT0gQklORF9TSU1QTEVfQ0FUQ0gpIHtcbiAgICB2YXIgc2NvcGUkMSA9IHRoaXMuY3VycmVudFNjb3BlKCk7XG4gICAgc2NvcGUkMS5sZXhpY2FsLnB1c2gobmFtZSk7XG4gIH0gZWxzZSBpZiAoYmluZGluZ1R5cGUgPT09IEJJTkRfRlVOQ1RJT04pIHtcbiAgICB2YXIgc2NvcGUkMiA9IHRoaXMuY3VycmVudFNjb3BlKCk7XG4gICAgaWYgKHRoaXMudHJlYXRGdW5jdGlvbnNBc1ZhcilcbiAgICAgIHsgcmVkZWNsYXJlZCA9IHNjb3BlJDIubGV4aWNhbC5pbmRleE9mKG5hbWUpID4gLTE7IH1cbiAgICBlbHNlXG4gICAgICB7IHJlZGVjbGFyZWQgPSBzY29wZSQyLmxleGljYWwuaW5kZXhPZihuYW1lKSA+IC0xIHx8IHNjb3BlJDIudmFyLmluZGV4T2YobmFtZSkgPiAtMTsgfVxuICAgIHNjb3BlJDIuZnVuY3Rpb25zLnB1c2gobmFtZSk7XG4gIH0gZWxzZSB7XG4gICAgZm9yICh2YXIgaSA9IHRoaXMuc2NvcGVTdGFjay5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgdmFyIHNjb3BlJDMgPSB0aGlzLnNjb3BlU3RhY2tbaV07XG4gICAgICBpZiAoc2NvcGUkMy5sZXhpY2FsLmluZGV4T2YobmFtZSkgPiAtMSAmJiAhKChzY29wZSQzLmZsYWdzICYgU0NPUEVfU0lNUExFX0NBVENIKSAmJiBzY29wZSQzLmxleGljYWxbMF0gPT09IG5hbWUpIHx8XG4gICAgICAgICAgIXRoaXMudHJlYXRGdW5jdGlvbnNBc1ZhckluU2NvcGUoc2NvcGUkMykgJiYgc2NvcGUkMy5mdW5jdGlvbnMuaW5kZXhPZihuYW1lKSA+IC0xKSB7XG4gICAgICAgIHJlZGVjbGFyZWQgPSB0cnVlO1xuICAgICAgICBicmVha1xuICAgICAgfVxuICAgICAgc2NvcGUkMy52YXIucHVzaChuYW1lKTtcbiAgICAgIGlmICh0aGlzLmluTW9kdWxlICYmIChzY29wZSQzLmZsYWdzICYgU0NPUEVfVE9QKSlcbiAgICAgICAgeyBkZWxldGUgdGhpcy51bmRlZmluZWRFeHBvcnRzW25hbWVdOyB9XG4gICAgICBpZiAoc2NvcGUkMy5mbGFncyAmIFNDT1BFX1ZBUikgeyBicmVhayB9XG4gICAgfVxuICB9XG4gIGlmIChyZWRlY2xhcmVkKSB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShwb3MsIChcIklkZW50aWZpZXIgJ1wiICsgbmFtZSArIFwiJyBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCIpKTsgfVxufTtcblxucHAkMy5jaGVja0xvY2FsRXhwb3J0ID0gZnVuY3Rpb24oaWQpIHtcbiAgLy8gc2NvcGUuZnVuY3Rpb25zIG11c3QgYmUgZW1wdHkgYXMgTW9kdWxlIGNvZGUgaXMgYWx3YXlzIHN0cmljdC5cbiAgaWYgKHRoaXMuc2NvcGVTdGFja1swXS5sZXhpY2FsLmluZGV4T2YoaWQubmFtZSkgPT09IC0xICYmXG4gICAgICB0aGlzLnNjb3BlU3RhY2tbMF0udmFyLmluZGV4T2YoaWQubmFtZSkgPT09IC0xKSB7XG4gICAgdGhpcy51bmRlZmluZWRFeHBvcnRzW2lkLm5hbWVdID0gaWQ7XG4gIH1cbn07XG5cbnBwJDMuY3VycmVudFNjb3BlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnNjb3BlU3RhY2tbdGhpcy5zY29wZVN0YWNrLmxlbmd0aCAtIDFdXG59O1xuXG5wcCQzLmN1cnJlbnRWYXJTY29wZSA9IGZ1bmN0aW9uKCkge1xuICBmb3IgKHZhciBpID0gdGhpcy5zY29wZVN0YWNrLmxlbmd0aCAtIDE7OyBpLS0pIHtcbiAgICB2YXIgc2NvcGUgPSB0aGlzLnNjb3BlU3RhY2tbaV07XG4gICAgaWYgKHNjb3BlLmZsYWdzICYgKFNDT1BFX1ZBUiB8IFNDT1BFX0NMQVNTX0ZJRUxEX0lOSVQgfCBTQ09QRV9DTEFTU19TVEFUSUNfQkxPQ0spKSB7IHJldHVybiBzY29wZSB9XG4gIH1cbn07XG5cbi8vIENvdWxkIGJlIHVzZWZ1bCBmb3IgYHRoaXNgLCBgbmV3LnRhcmdldGAsIGBzdXBlcigpYCwgYHN1cGVyLnByb3BlcnR5YCwgYW5kIGBzdXBlcltwcm9wZXJ0eV1gLlxucHAkMy5jdXJyZW50VGhpc1Njb3BlID0gZnVuY3Rpb24oKSB7XG4gIGZvciAodmFyIGkgPSB0aGlzLnNjb3BlU3RhY2subGVuZ3RoIC0gMTs7IGktLSkge1xuICAgIHZhciBzY29wZSA9IHRoaXMuc2NvcGVTdGFja1tpXTtcbiAgICBpZiAoc2NvcGUuZmxhZ3MgJiAoU0NPUEVfVkFSIHwgU0NPUEVfQ0xBU1NfRklFTERfSU5JVCB8IFNDT1BFX0NMQVNTX1NUQVRJQ19CTE9DSykgJiZcbiAgICAgICAgIShzY29wZS5mbGFncyAmIFNDT1BFX0FSUk9XKSkgeyByZXR1cm4gc2NvcGUgfVxuICB9XG59O1xuXG52YXIgTm9kZSA9IGZ1bmN0aW9uIE5vZGUocGFyc2VyLCBwb3MsIGxvYykge1xuICB0aGlzLnR5cGUgPSBcIlwiO1xuICB0aGlzLnN0YXJ0ID0gcG9zO1xuICB0aGlzLmVuZCA9IDA7XG4gIGlmIChwYXJzZXIub3B0aW9ucy5sb2NhdGlvbnMpXG4gICAgeyB0aGlzLmxvYyA9IG5ldyBTb3VyY2VMb2NhdGlvbihwYXJzZXIsIGxvYyk7IH1cbiAgaWYgKHBhcnNlci5vcHRpb25zLmRpcmVjdFNvdXJjZUZpbGUpXG4gICAgeyB0aGlzLnNvdXJjZUZpbGUgPSBwYXJzZXIub3B0aW9ucy5kaXJlY3RTb3VyY2VGaWxlOyB9XG4gIGlmIChwYXJzZXIub3B0aW9ucy5yYW5nZXMpXG4gICAgeyB0aGlzLnJhbmdlID0gW3BvcywgMF07IH1cbn07XG5cbi8vIFN0YXJ0IGFuIEFTVCBub2RlLCBhdHRhY2hpbmcgYSBzdGFydCBvZmZzZXQuXG5cbnZhciBwcCQyID0gUGFyc2VyLnByb3RvdHlwZTtcblxucHAkMi5zdGFydE5vZGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBOb2RlKHRoaXMsIHRoaXMuc3RhcnQsIHRoaXMuc3RhcnRMb2MpXG59O1xuXG5wcCQyLnN0YXJ0Tm9kZUF0ID0gZnVuY3Rpb24ocG9zLCBsb2MpIHtcbiAgcmV0dXJuIG5ldyBOb2RlKHRoaXMsIHBvcywgbG9jKVxufTtcblxuLy8gRmluaXNoIGFuIEFTVCBub2RlLCBhZGRpbmcgYHR5cGVgIGFuZCBgZW5kYCBwcm9wZXJ0aWVzLlxuXG5mdW5jdGlvbiBmaW5pc2hOb2RlQXQobm9kZSwgdHlwZSwgcG9zLCBsb2MpIHtcbiAgbm9kZS50eXBlID0gdHlwZTtcbiAgbm9kZS5lbmQgPSBwb3M7XG4gIGlmICh0aGlzLm9wdGlvbnMubG9jYXRpb25zKVxuICAgIHsgbm9kZS5sb2MuZW5kID0gbG9jOyB9XG4gIGlmICh0aGlzLm9wdGlvbnMucmFuZ2VzKVxuICAgIHsgbm9kZS5yYW5nZVsxXSA9IHBvczsgfVxuICByZXR1cm4gbm9kZVxufVxuXG5wcCQyLmZpbmlzaE5vZGUgPSBmdW5jdGlvbihub2RlLCB0eXBlKSB7XG4gIHJldHVybiBmaW5pc2hOb2RlQXQuY2FsbCh0aGlzLCBub2RlLCB0eXBlLCB0aGlzLmxhc3RUb2tFbmQsIHRoaXMubGFzdFRva0VuZExvYylcbn07XG5cbi8vIEZpbmlzaCBub2RlIGF0IGdpdmVuIHBvc2l0aW9uXG5cbnBwJDIuZmluaXNoTm9kZUF0ID0gZnVuY3Rpb24obm9kZSwgdHlwZSwgcG9zLCBsb2MpIHtcbiAgcmV0dXJuIGZpbmlzaE5vZGVBdC5jYWxsKHRoaXMsIG5vZGUsIHR5cGUsIHBvcywgbG9jKVxufTtcblxucHAkMi5jb3B5Tm9kZSA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgdmFyIG5ld05vZGUgPSBuZXcgTm9kZSh0aGlzLCBub2RlLnN0YXJ0LCB0aGlzLnN0YXJ0TG9jKTtcbiAgZm9yICh2YXIgcHJvcCBpbiBub2RlKSB7IG5ld05vZGVbcHJvcF0gPSBub2RlW3Byb3BdOyB9XG4gIHJldHVybiBuZXdOb2RlXG59O1xuXG4vLyBUaGlzIGZpbGUgd2FzIGdlbmVyYXRlZCBieSBcImJpbi9nZW5lcmF0ZS11bmljb2RlLXNjcmlwdC12YWx1ZXMuanNcIi4gRG8gbm90IG1vZGlmeSBtYW51YWxseSFcbnZhciBzY3JpcHRWYWx1ZXNBZGRlZEluVW5pY29kZSA9IFwiR2FyYSBHYXJheSBHdWtoIEd1cnVuZ19LaGVtYSBIcmt0IEthdGFrYW5hX09yX0hpcmFnYW5hIEthd2kgS2lyYXRfUmFpIEtyYWkgTmFnX011bmRhcmkgTmFnbSBPbF9PbmFsIE9uYW8gU3VudSBTdW51d2FyIFRvZGhyaSBUb2RyIFR1bHVfVGlnYWxhcmkgVHV0ZyBVbmtub3duIFp6enpcIjtcblxuLy8gVGhpcyBmaWxlIGNvbnRhaW5zIFVuaWNvZGUgcHJvcGVydGllcyBleHRyYWN0ZWQgZnJvbSB0aGUgRUNNQVNjcmlwdCBzcGVjaWZpY2F0aW9uLlxuLy8gVGhlIGxpc3RzIGFyZSBleHRyYWN0ZWQgbGlrZSBzbzpcbi8vICQkKCcjdGFibGUtYmluYXJ5LXVuaWNvZGUtcHJvcGVydGllcyA+IGZpZ3VyZSA+IHRhYmxlID4gdGJvZHkgPiB0ciA+IHRkOm50aC1jaGlsZCgxKSBjb2RlJykubWFwKGVsID0+IGVsLmlubmVyVGV4dClcblxuLy8gI3RhYmxlLWJpbmFyeS11bmljb2RlLXByb3BlcnRpZXNcbnZhciBlY21hOUJpbmFyeVByb3BlcnRpZXMgPSBcIkFTQ0lJIEFTQ0lJX0hleF9EaWdpdCBBSGV4IEFscGhhYmV0aWMgQWxwaGEgQW55IEFzc2lnbmVkIEJpZGlfQ29udHJvbCBCaWRpX0MgQmlkaV9NaXJyb3JlZCBCaWRpX00gQ2FzZV9JZ25vcmFibGUgQ0kgQ2FzZWQgQ2hhbmdlc19XaGVuX0Nhc2Vmb2xkZWQgQ1dDRiBDaGFuZ2VzX1doZW5fQ2FzZW1hcHBlZCBDV0NNIENoYW5nZXNfV2hlbl9Mb3dlcmNhc2VkIENXTCBDaGFuZ2VzX1doZW5fTkZLQ19DYXNlZm9sZGVkIENXS0NGIENoYW5nZXNfV2hlbl9UaXRsZWNhc2VkIENXVCBDaGFuZ2VzX1doZW5fVXBwZXJjYXNlZCBDV1UgRGFzaCBEZWZhdWx0X0lnbm9yYWJsZV9Db2RlX1BvaW50IERJIERlcHJlY2F0ZWQgRGVwIERpYWNyaXRpYyBEaWEgRW1vamkgRW1vamlfQ29tcG9uZW50IEVtb2ppX01vZGlmaWVyIEVtb2ppX01vZGlmaWVyX0Jhc2UgRW1vamlfUHJlc2VudGF0aW9uIEV4dGVuZGVyIEV4dCBHcmFwaGVtZV9CYXNlIEdyX0Jhc2UgR3JhcGhlbWVfRXh0ZW5kIEdyX0V4dCBIZXhfRGlnaXQgSGV4IElEU19CaW5hcnlfT3BlcmF0b3IgSURTQiBJRFNfVHJpbmFyeV9PcGVyYXRvciBJRFNUIElEX0NvbnRpbnVlIElEQyBJRF9TdGFydCBJRFMgSWRlb2dyYXBoaWMgSWRlbyBKb2luX0NvbnRyb2wgSm9pbl9DIExvZ2ljYWxfT3JkZXJfRXhjZXB0aW9uIExPRSBMb3dlcmNhc2UgTG93ZXIgTWF0aCBOb25jaGFyYWN0ZXJfQ29kZV9Qb2ludCBOQ2hhciBQYXR0ZXJuX1N5bnRheCBQYXRfU3luIFBhdHRlcm5fV2hpdGVfU3BhY2UgUGF0X1dTIFF1b3RhdGlvbl9NYXJrIFFNYXJrIFJhZGljYWwgUmVnaW9uYWxfSW5kaWNhdG9yIFJJIFNlbnRlbmNlX1Rlcm1pbmFsIFNUZXJtIFNvZnRfRG90dGVkIFNEIFRlcm1pbmFsX1B1bmN0dWF0aW9uIFRlcm0gVW5pZmllZF9JZGVvZ3JhcGggVUlkZW8gVXBwZXJjYXNlIFVwcGVyIFZhcmlhdGlvbl9TZWxlY3RvciBWUyBXaGl0ZV9TcGFjZSBzcGFjZSBYSURfQ29udGludWUgWElEQyBYSURfU3RhcnQgWElEU1wiO1xudmFyIGVjbWExMEJpbmFyeVByb3BlcnRpZXMgPSBlY21hOUJpbmFyeVByb3BlcnRpZXMgKyBcIiBFeHRlbmRlZF9QaWN0b2dyYXBoaWNcIjtcbnZhciBlY21hMTFCaW5hcnlQcm9wZXJ0aWVzID0gZWNtYTEwQmluYXJ5UHJvcGVydGllcztcbnZhciBlY21hMTJCaW5hcnlQcm9wZXJ0aWVzID0gZWNtYTExQmluYXJ5UHJvcGVydGllcyArIFwiIEVCYXNlIEVDb21wIEVNb2QgRVByZXMgRXh0UGljdFwiO1xudmFyIGVjbWExM0JpbmFyeVByb3BlcnRpZXMgPSBlY21hMTJCaW5hcnlQcm9wZXJ0aWVzO1xudmFyIGVjbWExNEJpbmFyeVByb3BlcnRpZXMgPSBlY21hMTNCaW5hcnlQcm9wZXJ0aWVzO1xuXG52YXIgdW5pY29kZUJpbmFyeVByb3BlcnRpZXMgPSB7XG4gIDk6IGVjbWE5QmluYXJ5UHJvcGVydGllcyxcbiAgMTA6IGVjbWExMEJpbmFyeVByb3BlcnRpZXMsXG4gIDExOiBlY21hMTFCaW5hcnlQcm9wZXJ0aWVzLFxuICAxMjogZWNtYTEyQmluYXJ5UHJvcGVydGllcyxcbiAgMTM6IGVjbWExM0JpbmFyeVByb3BlcnRpZXMsXG4gIDE0OiBlY21hMTRCaW5hcnlQcm9wZXJ0aWVzXG59O1xuXG4vLyAjdGFibGUtYmluYXJ5LXVuaWNvZGUtcHJvcGVydGllcy1vZi1zdHJpbmdzXG52YXIgZWNtYTE0QmluYXJ5UHJvcGVydGllc09mU3RyaW5ncyA9IFwiQmFzaWNfRW1vamkgRW1vamlfS2V5Y2FwX1NlcXVlbmNlIFJHSV9FbW9qaV9Nb2RpZmllcl9TZXF1ZW5jZSBSR0lfRW1vamlfRmxhZ19TZXF1ZW5jZSBSR0lfRW1vamlfVGFnX1NlcXVlbmNlIFJHSV9FbW9qaV9aV0pfU2VxdWVuY2UgUkdJX0Vtb2ppXCI7XG5cbnZhciB1bmljb2RlQmluYXJ5UHJvcGVydGllc09mU3RyaW5ncyA9IHtcbiAgOTogXCJcIixcbiAgMTA6IFwiXCIsXG4gIDExOiBcIlwiLFxuICAxMjogXCJcIixcbiAgMTM6IFwiXCIsXG4gIDE0OiBlY21hMTRCaW5hcnlQcm9wZXJ0aWVzT2ZTdHJpbmdzXG59O1xuXG4vLyAjdGFibGUtdW5pY29kZS1nZW5lcmFsLWNhdGVnb3J5LXZhbHVlc1xudmFyIHVuaWNvZGVHZW5lcmFsQ2F0ZWdvcnlWYWx1ZXMgPSBcIkNhc2VkX0xldHRlciBMQyBDbG9zZV9QdW5jdHVhdGlvbiBQZSBDb25uZWN0b3JfUHVuY3R1YXRpb24gUGMgQ29udHJvbCBDYyBjbnRybCBDdXJyZW5jeV9TeW1ib2wgU2MgRGFzaF9QdW5jdHVhdGlvbiBQZCBEZWNpbWFsX051bWJlciBOZCBkaWdpdCBFbmNsb3NpbmdfTWFyayBNZSBGaW5hbF9QdW5jdHVhdGlvbiBQZiBGb3JtYXQgQ2YgSW5pdGlhbF9QdW5jdHVhdGlvbiBQaSBMZXR0ZXIgTCBMZXR0ZXJfTnVtYmVyIE5sIExpbmVfU2VwYXJhdG9yIFpsIExvd2VyY2FzZV9MZXR0ZXIgTGwgTWFyayBNIENvbWJpbmluZ19NYXJrIE1hdGhfU3ltYm9sIFNtIE1vZGlmaWVyX0xldHRlciBMbSBNb2RpZmllcl9TeW1ib2wgU2sgTm9uc3BhY2luZ19NYXJrIE1uIE51bWJlciBOIE9wZW5fUHVuY3R1YXRpb24gUHMgT3RoZXIgQyBPdGhlcl9MZXR0ZXIgTG8gT3RoZXJfTnVtYmVyIE5vIE90aGVyX1B1bmN0dWF0aW9uIFBvIE90aGVyX1N5bWJvbCBTbyBQYXJhZ3JhcGhfU2VwYXJhdG9yIFpwIFByaXZhdGVfVXNlIENvIFB1bmN0dWF0aW9uIFAgcHVuY3QgU2VwYXJhdG9yIFogU3BhY2VfU2VwYXJhdG9yIFpzIFNwYWNpbmdfTWFyayBNYyBTdXJyb2dhdGUgQ3MgU3ltYm9sIFMgVGl0bGVjYXNlX0xldHRlciBMdCBVbmFzc2lnbmVkIENuIFVwcGVyY2FzZV9MZXR0ZXIgTHVcIjtcblxuLy8gI3RhYmxlLXVuaWNvZGUtc2NyaXB0LXZhbHVlc1xudmFyIGVjbWE5U2NyaXB0VmFsdWVzID0gXCJBZGxhbSBBZGxtIEFob20gQW5hdG9saWFuX0hpZXJvZ2x5cGhzIEhsdXcgQXJhYmljIEFyYWIgQXJtZW5pYW4gQXJtbiBBdmVzdGFuIEF2c3QgQmFsaW5lc2UgQmFsaSBCYW11bSBCYW11IEJhc3NhX1ZhaCBCYXNzIEJhdGFrIEJhdGsgQmVuZ2FsaSBCZW5nIEJoYWlrc3VraSBCaGtzIEJvcG9tb2ZvIEJvcG8gQnJhaG1pIEJyYWggQnJhaWxsZSBCcmFpIEJ1Z2luZXNlIEJ1Z2kgQnVoaWQgQnVoZCBDYW5hZGlhbl9BYm9yaWdpbmFsIENhbnMgQ2FyaWFuIENhcmkgQ2F1Y2FzaWFuX0FsYmFuaWFuIEFnaGIgQ2hha21hIENha20gQ2hhbSBDaGFtIENoZXJva2VlIENoZXIgQ29tbW9uIFp5eXkgQ29wdGljIENvcHQgUWFhYyBDdW5laWZvcm0gWHN1eCBDeXByaW90IENwcnQgQ3lyaWxsaWMgQ3lybCBEZXNlcmV0IERzcnQgRGV2YW5hZ2FyaSBEZXZhIER1cGxveWFuIER1cGwgRWd5cHRpYW5fSGllcm9nbHlwaHMgRWd5cCBFbGJhc2FuIEVsYmEgRXRoaW9waWMgRXRoaSBHZW9yZ2lhbiBHZW9yIEdsYWdvbGl0aWMgR2xhZyBHb3RoaWMgR290aCBHcmFudGhhIEdyYW4gR3JlZWsgR3JlayBHdWphcmF0aSBHdWpyIEd1cm11a2hpIEd1cnUgSGFuIEhhbmkgSGFuZ3VsIEhhbmcgSGFudW5vbyBIYW5vIEhhdHJhbiBIYXRyIEhlYnJldyBIZWJyIEhpcmFnYW5hIEhpcmEgSW1wZXJpYWxfQXJhbWFpYyBBcm1pIEluaGVyaXRlZCBaaW5oIFFhYWkgSW5zY3JpcHRpb25hbF9QYWhsYXZpIFBobGkgSW5zY3JpcHRpb25hbF9QYXJ0aGlhbiBQcnRpIEphdmFuZXNlIEphdmEgS2FpdGhpIEt0aGkgS2FubmFkYSBLbmRhIEthdGFrYW5hIEthbmEgS2F5YWhfTGkgS2FsaSBLaGFyb3NodGhpIEtoYXIgS2htZXIgS2htciBLaG9qa2kgS2hvaiBLaHVkYXdhZGkgU2luZCBMYW8gTGFvbyBMYXRpbiBMYXRuIExlcGNoYSBMZXBjIExpbWJ1IExpbWIgTGluZWFyX0EgTGluYSBMaW5lYXJfQiBMaW5iIExpc3UgTGlzdSBMeWNpYW4gTHljaSBMeWRpYW4gTHlkaSBNYWhhamFuaSBNYWhqIE1hbGF5YWxhbSBNbHltIE1hbmRhaWMgTWFuZCBNYW5pY2hhZWFuIE1hbmkgTWFyY2hlbiBNYXJjIE1hc2FyYW1fR29uZGkgR29ubSBNZWV0ZWlfTWF5ZWsgTXRlaSBNZW5kZV9LaWtha3VpIE1lbmQgTWVyb2l0aWNfQ3Vyc2l2ZSBNZXJjIE1lcm9pdGljX0hpZXJvZ2x5cGhzIE1lcm8gTWlhbyBQbHJkIE1vZGkgTW9uZ29saWFuIE1vbmcgTXJvIE1yb28gTXVsdGFuaSBNdWx0IE15YW5tYXIgTXltciBOYWJhdGFlYW4gTmJhdCBOZXdfVGFpX0x1ZSBUYWx1IE5ld2EgTmV3YSBOa28gTmtvbyBOdXNodSBOc2h1IE9naGFtIE9nYW0gT2xfQ2hpa2kgT2xjayBPbGRfSHVuZ2FyaWFuIEh1bmcgT2xkX0l0YWxpYyBJdGFsIE9sZF9Ob3J0aF9BcmFiaWFuIE5hcmIgT2xkX1Blcm1pYyBQZXJtIE9sZF9QZXJzaWFuIFhwZW8gT2xkX1NvdXRoX0FyYWJpYW4gU2FyYiBPbGRfVHVya2ljIE9ya2ggT3JpeWEgT3J5YSBPc2FnZSBPc2dlIE9zbWFueWEgT3NtYSBQYWhhd2hfSG1vbmcgSG1uZyBQYWxteXJlbmUgUGFsbSBQYXVfQ2luX0hhdSBQYXVjIFBoYWdzX1BhIFBoYWcgUGhvZW5pY2lhbiBQaG54IFBzYWx0ZXJfUGFobGF2aSBQaGxwIFJlamFuZyBSam5nIFJ1bmljIFJ1bnIgU2FtYXJpdGFuIFNhbXIgU2F1cmFzaHRyYSBTYXVyIFNoYXJhZGEgU2hyZCBTaGF2aWFuIFNoYXcgU2lkZGhhbSBTaWRkIFNpZ25Xcml0aW5nIFNnbncgU2luaGFsYSBTaW5oIFNvcmFfU29tcGVuZyBTb3JhIFNveW9tYm8gU295byBTdW5kYW5lc2UgU3VuZCBTeWxvdGlfTmFncmkgU3lsbyBTeXJpYWMgU3lyYyBUYWdhbG9nIFRnbGcgVGFnYmFud2EgVGFnYiBUYWlfTGUgVGFsZSBUYWlfVGhhbSBMYW5hIFRhaV9WaWV0IFRhdnQgVGFrcmkgVGFrciBUYW1pbCBUYW1sIFRhbmd1dCBUYW5nIFRlbHVndSBUZWx1IFRoYWFuYSBUaGFhIFRoYWkgVGhhaSBUaWJldGFuIFRpYnQgVGlmaW5hZ2ggVGZuZyBUaXJodXRhIFRpcmggVWdhcml0aWMgVWdhciBWYWkgVmFpaSBXYXJhbmdfQ2l0aSBXYXJhIFlpIFlpaWkgWmFuYWJhemFyX1NxdWFyZSBaYW5iXCI7XG52YXIgZWNtYTEwU2NyaXB0VmFsdWVzID0gZWNtYTlTY3JpcHRWYWx1ZXMgKyBcIiBEb2dyYSBEb2dyIEd1bmphbGFfR29uZGkgR29uZyBIYW5pZmlfUm9oaW5neWEgUm9oZyBNYWthc2FyIE1ha2EgTWVkZWZhaWRyaW4gTWVkZiBPbGRfU29nZGlhbiBTb2dvIFNvZ2RpYW4gU29nZFwiO1xudmFyIGVjbWExMVNjcmlwdFZhbHVlcyA9IGVjbWExMFNjcmlwdFZhbHVlcyArIFwiIEVseW1haWMgRWx5bSBOYW5kaW5hZ2FyaSBOYW5kIE55aWFrZW5nX1B1YWNodWVfSG1vbmcgSG1ucCBXYW5jaG8gV2Nob1wiO1xudmFyIGVjbWExMlNjcmlwdFZhbHVlcyA9IGVjbWExMVNjcmlwdFZhbHVlcyArIFwiIENob3Jhc21pYW4gQ2hycyBEaWFrIERpdmVzX0FrdXJ1IEtoaXRhbl9TbWFsbF9TY3JpcHQgS2l0cyBZZXppIFllemlkaVwiO1xudmFyIGVjbWExM1NjcmlwdFZhbHVlcyA9IGVjbWExMlNjcmlwdFZhbHVlcyArIFwiIEN5cHJvX01pbm9hbiBDcG1uIE9sZF9VeWdodXIgT3VnciBUYW5nc2EgVG5zYSBUb3RvIFZpdGhrdXFpIFZpdGhcIjtcbnZhciBlY21hMTRTY3JpcHRWYWx1ZXMgPSBlY21hMTNTY3JpcHRWYWx1ZXMgKyBcIiBcIiArIHNjcmlwdFZhbHVlc0FkZGVkSW5Vbmljb2RlO1xuXG52YXIgdW5pY29kZVNjcmlwdFZhbHVlcyA9IHtcbiAgOTogZWNtYTlTY3JpcHRWYWx1ZXMsXG4gIDEwOiBlY21hMTBTY3JpcHRWYWx1ZXMsXG4gIDExOiBlY21hMTFTY3JpcHRWYWx1ZXMsXG4gIDEyOiBlY21hMTJTY3JpcHRWYWx1ZXMsXG4gIDEzOiBlY21hMTNTY3JpcHRWYWx1ZXMsXG4gIDE0OiBlY21hMTRTY3JpcHRWYWx1ZXNcbn07XG5cbnZhciBkYXRhID0ge307XG5mdW5jdGlvbiBidWlsZFVuaWNvZGVEYXRhKGVjbWFWZXJzaW9uKSB7XG4gIHZhciBkID0gZGF0YVtlY21hVmVyc2lvbl0gPSB7XG4gICAgYmluYXJ5OiB3b3Jkc1JlZ2V4cCh1bmljb2RlQmluYXJ5UHJvcGVydGllc1tlY21hVmVyc2lvbl0gKyBcIiBcIiArIHVuaWNvZGVHZW5lcmFsQ2F0ZWdvcnlWYWx1ZXMpLFxuICAgIGJpbmFyeU9mU3RyaW5nczogd29yZHNSZWdleHAodW5pY29kZUJpbmFyeVByb3BlcnRpZXNPZlN0cmluZ3NbZWNtYVZlcnNpb25dKSxcbiAgICBub25CaW5hcnk6IHtcbiAgICAgIEdlbmVyYWxfQ2F0ZWdvcnk6IHdvcmRzUmVnZXhwKHVuaWNvZGVHZW5lcmFsQ2F0ZWdvcnlWYWx1ZXMpLFxuICAgICAgU2NyaXB0OiB3b3Jkc1JlZ2V4cCh1bmljb2RlU2NyaXB0VmFsdWVzW2VjbWFWZXJzaW9uXSlcbiAgICB9XG4gIH07XG4gIGQubm9uQmluYXJ5LlNjcmlwdF9FeHRlbnNpb25zID0gZC5ub25CaW5hcnkuU2NyaXB0O1xuXG4gIGQubm9uQmluYXJ5LmdjID0gZC5ub25CaW5hcnkuR2VuZXJhbF9DYXRlZ29yeTtcbiAgZC5ub25CaW5hcnkuc2MgPSBkLm5vbkJpbmFyeS5TY3JpcHQ7XG4gIGQubm9uQmluYXJ5LnNjeCA9IGQubm9uQmluYXJ5LlNjcmlwdF9FeHRlbnNpb25zO1xufVxuXG5mb3IgKHZhciBpID0gMCwgbGlzdCA9IFs5LCAxMCwgMTEsIDEyLCAxMywgMTRdOyBpIDwgbGlzdC5sZW5ndGg7IGkgKz0gMSkge1xuICB2YXIgZWNtYVZlcnNpb24gPSBsaXN0W2ldO1xuXG4gIGJ1aWxkVW5pY29kZURhdGEoZWNtYVZlcnNpb24pO1xufVxuXG52YXIgcHAkMSA9IFBhcnNlci5wcm90b3R5cGU7XG5cbi8vIFRyYWNrIGRpc2p1bmN0aW9uIHN0cnVjdHVyZSB0byBkZXRlcm1pbmUgd2hldGhlciBhIGR1cGxpY2F0ZVxuLy8gY2FwdHVyZSBncm91cCBuYW1lIGlzIGFsbG93ZWQgYmVjYXVzZSBpdCBpcyBpbiBhIHNlcGFyYXRlIGJyYW5jaC5cbnZhciBCcmFuY2hJRCA9IGZ1bmN0aW9uIEJyYW5jaElEKHBhcmVudCwgYmFzZSkge1xuICAvLyBQYXJlbnQgZGlzanVuY3Rpb24gYnJhbmNoXG4gIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAvLyBJZGVudGlmaWVzIHRoaXMgc2V0IG9mIHNpYmxpbmcgYnJhbmNoZXNcbiAgdGhpcy5iYXNlID0gYmFzZSB8fCB0aGlzO1xufTtcblxuQnJhbmNoSUQucHJvdG90eXBlLnNlcGFyYXRlZEZyb20gPSBmdW5jdGlvbiBzZXBhcmF0ZWRGcm9tIChhbHQpIHtcbiAgLy8gQSBicmFuY2ggaXMgc2VwYXJhdGUgZnJvbSBhbm90aGVyIGJyYW5jaCBpZiB0aGV5IG9yIGFueSBvZlxuICAvLyB0aGVpciBwYXJlbnRzIGFyZSBzaWJsaW5ncyBpbiBhIGdpdmVuIGRpc2p1bmN0aW9uXG4gIGZvciAodmFyIHNlbGYgPSB0aGlzOyBzZWxmOyBzZWxmID0gc2VsZi5wYXJlbnQpIHtcbiAgICBmb3IgKHZhciBvdGhlciA9IGFsdDsgb3RoZXI7IG90aGVyID0gb3RoZXIucGFyZW50KSB7XG4gICAgICBpZiAoc2VsZi5iYXNlID09PSBvdGhlci5iYXNlICYmIHNlbGYgIT09IG90aGVyKSB7IHJldHVybiB0cnVlIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG5CcmFuY2hJRC5wcm90b3R5cGUuc2libGluZyA9IGZ1bmN0aW9uIHNpYmxpbmcgKCkge1xuICByZXR1cm4gbmV3IEJyYW5jaElEKHRoaXMucGFyZW50LCB0aGlzLmJhc2UpXG59O1xuXG52YXIgUmVnRXhwVmFsaWRhdGlvblN0YXRlID0gZnVuY3Rpb24gUmVnRXhwVmFsaWRhdGlvblN0YXRlKHBhcnNlcikge1xuICB0aGlzLnBhcnNlciA9IHBhcnNlcjtcbiAgdGhpcy52YWxpZEZsYWdzID0gXCJnaW1cIiArIChwYXJzZXIub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2ID8gXCJ1eVwiIDogXCJcIikgKyAocGFyc2VyLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOSA/IFwic1wiIDogXCJcIikgKyAocGFyc2VyLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTMgPyBcImRcIiA6IFwiXCIpICsgKHBhcnNlci5vcHRpb25zLmVjbWFWZXJzaW9uID49IDE1ID8gXCJ2XCIgOiBcIlwiKTtcbiAgdGhpcy51bmljb2RlUHJvcGVydGllcyA9IGRhdGFbcGFyc2VyLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTQgPyAxNCA6IHBhcnNlci5vcHRpb25zLmVjbWFWZXJzaW9uXTtcbiAgdGhpcy5zb3VyY2UgPSBcIlwiO1xuICB0aGlzLmZsYWdzID0gXCJcIjtcbiAgdGhpcy5zdGFydCA9IDA7XG4gIHRoaXMuc3dpdGNoVSA9IGZhbHNlO1xuICB0aGlzLnN3aXRjaFYgPSBmYWxzZTtcbiAgdGhpcy5zd2l0Y2hOID0gZmFsc2U7XG4gIHRoaXMucG9zID0gMDtcbiAgdGhpcy5sYXN0SW50VmFsdWUgPSAwO1xuICB0aGlzLmxhc3RTdHJpbmdWYWx1ZSA9IFwiXCI7XG4gIHRoaXMubGFzdEFzc2VydGlvbklzUXVhbnRpZmlhYmxlID0gZmFsc2U7XG4gIHRoaXMubnVtQ2FwdHVyaW5nUGFyZW5zID0gMDtcbiAgdGhpcy5tYXhCYWNrUmVmZXJlbmNlID0gMDtcbiAgdGhpcy5ncm91cE5hbWVzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgdGhpcy5iYWNrUmVmZXJlbmNlTmFtZXMgPSBbXTtcbiAgdGhpcy5icmFuY2hJRCA9IG51bGw7XG59O1xuXG5SZWdFeHBWYWxpZGF0aW9uU3RhdGUucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gcmVzZXQgKHN0YXJ0LCBwYXR0ZXJuLCBmbGFncykge1xuICB2YXIgdW5pY29kZVNldHMgPSBmbGFncy5pbmRleE9mKFwidlwiKSAhPT0gLTE7XG4gIHZhciB1bmljb2RlID0gZmxhZ3MuaW5kZXhPZihcInVcIikgIT09IC0xO1xuICB0aGlzLnN0YXJ0ID0gc3RhcnQgfCAwO1xuICB0aGlzLnNvdXJjZSA9IHBhdHRlcm4gKyBcIlwiO1xuICB0aGlzLmZsYWdzID0gZmxhZ3M7XG4gIGlmICh1bmljb2RlU2V0cyAmJiB0aGlzLnBhcnNlci5vcHRpb25zLmVjbWFWZXJzaW9uID49IDE1KSB7XG4gICAgdGhpcy5zd2l0Y2hVID0gdHJ1ZTtcbiAgICB0aGlzLnN3aXRjaFYgPSB0cnVlO1xuICAgIHRoaXMuc3dpdGNoTiA9IHRydWU7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5zd2l0Y2hVID0gdW5pY29kZSAmJiB0aGlzLnBhcnNlci5vcHRpb25zLmVjbWFWZXJzaW9uID49IDY7XG4gICAgdGhpcy5zd2l0Y2hWID0gZmFsc2U7XG4gICAgdGhpcy5zd2l0Y2hOID0gdW5pY29kZSAmJiB0aGlzLnBhcnNlci5vcHRpb25zLmVjbWFWZXJzaW9uID49IDk7XG4gIH1cbn07XG5cblJlZ0V4cFZhbGlkYXRpb25TdGF0ZS5wcm90b3R5cGUucmFpc2UgPSBmdW5jdGlvbiByYWlzZSAobWVzc2FnZSkge1xuICB0aGlzLnBhcnNlci5yYWlzZVJlY292ZXJhYmxlKHRoaXMuc3RhcnQsIChcIkludmFsaWQgcmVndWxhciBleHByZXNzaW9uOiAvXCIgKyAodGhpcy5zb3VyY2UpICsgXCIvOiBcIiArIG1lc3NhZ2UpKTtcbn07XG5cbi8vIElmIHUgZmxhZyBpcyBnaXZlbiwgdGhpcyByZXR1cm5zIHRoZSBjb2RlIHBvaW50IGF0IHRoZSBpbmRleCAoaXQgY29tYmluZXMgYSBzdXJyb2dhdGUgcGFpcikuXG4vLyBPdGhlcndpc2UsIHRoaXMgcmV0dXJucyB0aGUgY29kZSB1bml0IG9mIHRoZSBpbmRleCAoY2FuIGJlIGEgcGFydCBvZiBhIHN1cnJvZ2F0ZSBwYWlyKS5cblJlZ0V4cFZhbGlkYXRpb25TdGF0ZS5wcm90b3R5cGUuYXQgPSBmdW5jdGlvbiBhdCAoaSwgZm9yY2VVKSB7XG4gICAgaWYgKCBmb3JjZVUgPT09IHZvaWQgMCApIGZvcmNlVSA9IGZhbHNlO1xuXG4gIHZhciBzID0gdGhpcy5zb3VyY2U7XG4gIHZhciBsID0gcy5sZW5ndGg7XG4gIGlmIChpID49IGwpIHtcbiAgICByZXR1cm4gLTFcbiAgfVxuICB2YXIgYyA9IHMuY2hhckNvZGVBdChpKTtcbiAgaWYgKCEoZm9yY2VVIHx8IHRoaXMuc3dpdGNoVSkgfHwgYyA8PSAweEQ3RkYgfHwgYyA+PSAweEUwMDAgfHwgaSArIDEgPj0gbCkge1xuICAgIHJldHVybiBjXG4gIH1cbiAgdmFyIG5leHQgPSBzLmNoYXJDb2RlQXQoaSArIDEpO1xuICByZXR1cm4gbmV4dCA+PSAweERDMDAgJiYgbmV4dCA8PSAweERGRkYgPyAoYyA8PCAxMCkgKyBuZXh0IC0gMHgzNUZEQzAwIDogY1xufTtcblxuUmVnRXhwVmFsaWRhdGlvblN0YXRlLnByb3RvdHlwZS5uZXh0SW5kZXggPSBmdW5jdGlvbiBuZXh0SW5kZXggKGksIGZvcmNlVSkge1xuICAgIGlmICggZm9yY2VVID09PSB2b2lkIDAgKSBmb3JjZVUgPSBmYWxzZTtcblxuICB2YXIgcyA9IHRoaXMuc291cmNlO1xuICB2YXIgbCA9IHMubGVuZ3RoO1xuICBpZiAoaSA+PSBsKSB7XG4gICAgcmV0dXJuIGxcbiAgfVxuICB2YXIgYyA9IHMuY2hhckNvZGVBdChpKSwgbmV4dDtcbiAgaWYgKCEoZm9yY2VVIHx8IHRoaXMuc3dpdGNoVSkgfHwgYyA8PSAweEQ3RkYgfHwgYyA+PSAweEUwMDAgfHwgaSArIDEgPj0gbCB8fFxuICAgICAgKG5leHQgPSBzLmNoYXJDb2RlQXQoaSArIDEpKSA8IDB4REMwMCB8fCBuZXh0ID4gMHhERkZGKSB7XG4gICAgcmV0dXJuIGkgKyAxXG4gIH1cbiAgcmV0dXJuIGkgKyAyXG59O1xuXG5SZWdFeHBWYWxpZGF0aW9uU3RhdGUucHJvdG90eXBlLmN1cnJlbnQgPSBmdW5jdGlvbiBjdXJyZW50IChmb3JjZVUpIHtcbiAgICBpZiAoIGZvcmNlVSA9PT0gdm9pZCAwICkgZm9yY2VVID0gZmFsc2U7XG5cbiAgcmV0dXJuIHRoaXMuYXQodGhpcy5wb3MsIGZvcmNlVSlcbn07XG5cblJlZ0V4cFZhbGlkYXRpb25TdGF0ZS5wcm90b3R5cGUubG9va2FoZWFkID0gZnVuY3Rpb24gbG9va2FoZWFkIChmb3JjZVUpIHtcbiAgICBpZiAoIGZvcmNlVSA9PT0gdm9pZCAwICkgZm9yY2VVID0gZmFsc2U7XG5cbiAgcmV0dXJuIHRoaXMuYXQodGhpcy5uZXh0SW5kZXgodGhpcy5wb3MsIGZvcmNlVSksIGZvcmNlVSlcbn07XG5cblJlZ0V4cFZhbGlkYXRpb25TdGF0ZS5wcm90b3R5cGUuYWR2YW5jZSA9IGZ1bmN0aW9uIGFkdmFuY2UgKGZvcmNlVSkge1xuICAgIGlmICggZm9yY2VVID09PSB2b2lkIDAgKSBmb3JjZVUgPSBmYWxzZTtcblxuICB0aGlzLnBvcyA9IHRoaXMubmV4dEluZGV4KHRoaXMucG9zLCBmb3JjZVUpO1xufTtcblxuUmVnRXhwVmFsaWRhdGlvblN0YXRlLnByb3RvdHlwZS5lYXQgPSBmdW5jdGlvbiBlYXQgKGNoLCBmb3JjZVUpIHtcbiAgICBpZiAoIGZvcmNlVSA9PT0gdm9pZCAwICkgZm9yY2VVID0gZmFsc2U7XG5cbiAgaWYgKHRoaXMuY3VycmVudChmb3JjZVUpID09PSBjaCkge1xuICAgIHRoaXMuYWR2YW5jZShmb3JjZVUpO1xuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG5SZWdFeHBWYWxpZGF0aW9uU3RhdGUucHJvdG90eXBlLmVhdENoYXJzID0gZnVuY3Rpb24gZWF0Q2hhcnMgKGNocywgZm9yY2VVKSB7XG4gICAgaWYgKCBmb3JjZVUgPT09IHZvaWQgMCApIGZvcmNlVSA9IGZhbHNlO1xuXG4gIHZhciBwb3MgPSB0aGlzLnBvcztcbiAgZm9yICh2YXIgaSA9IDAsIGxpc3QgPSBjaHM7IGkgPCBsaXN0Lmxlbmd0aDsgaSArPSAxKSB7XG4gICAgdmFyIGNoID0gbGlzdFtpXTtcblxuICAgICAgdmFyIGN1cnJlbnQgPSB0aGlzLmF0KHBvcywgZm9yY2VVKTtcbiAgICBpZiAoY3VycmVudCA9PT0gLTEgfHwgY3VycmVudCAhPT0gY2gpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICBwb3MgPSB0aGlzLm5leHRJbmRleChwb3MsIGZvcmNlVSk7XG4gIH1cbiAgdGhpcy5wb3MgPSBwb3M7XG4gIHJldHVybiB0cnVlXG59O1xuXG4vKipcbiAqIFZhbGlkYXRlIHRoZSBmbGFncyBwYXJ0IG9mIGEgZ2l2ZW4gUmVnRXhwTGl0ZXJhbC5cbiAqXG4gKiBAcGFyYW0ge1JlZ0V4cFZhbGlkYXRpb25TdGF0ZX0gc3RhdGUgVGhlIHN0YXRlIHRvIHZhbGlkYXRlIFJlZ0V4cC5cbiAqIEByZXR1cm5zIHt2b2lkfVxuICovXG5wcCQxLnZhbGlkYXRlUmVnRXhwRmxhZ3MgPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgdmFsaWRGbGFncyA9IHN0YXRlLnZhbGlkRmxhZ3M7XG4gIHZhciBmbGFncyA9IHN0YXRlLmZsYWdzO1xuXG4gIHZhciB1ID0gZmFsc2U7XG4gIHZhciB2ID0gZmFsc2U7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBmbGFncy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBmbGFnID0gZmxhZ3MuY2hhckF0KGkpO1xuICAgIGlmICh2YWxpZEZsYWdzLmluZGV4T2YoZmxhZykgPT09IC0xKSB7XG4gICAgICB0aGlzLnJhaXNlKHN0YXRlLnN0YXJ0LCBcIkludmFsaWQgcmVndWxhciBleHByZXNzaW9uIGZsYWdcIik7XG4gICAgfVxuICAgIGlmIChmbGFncy5pbmRleE9mKGZsYWcsIGkgKyAxKSA+IC0xKSB7XG4gICAgICB0aGlzLnJhaXNlKHN0YXRlLnN0YXJ0LCBcIkR1cGxpY2F0ZSByZWd1bGFyIGV4cHJlc3Npb24gZmxhZ1wiKTtcbiAgICB9XG4gICAgaWYgKGZsYWcgPT09IFwidVwiKSB7IHUgPSB0cnVlOyB9XG4gICAgaWYgKGZsYWcgPT09IFwidlwiKSB7IHYgPSB0cnVlOyB9XG4gIH1cbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSAxNSAmJiB1ICYmIHYpIHtcbiAgICB0aGlzLnJhaXNlKHN0YXRlLnN0YXJ0LCBcIkludmFsaWQgcmVndWxhciBleHByZXNzaW9uIGZsYWdcIik7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGhhc1Byb3Aob2JqKSB7XG4gIGZvciAodmFyIF8gaW4gb2JqKSB7IHJldHVybiB0cnVlIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICogVmFsaWRhdGUgdGhlIHBhdHRlcm4gcGFydCBvZiBhIGdpdmVuIFJlZ0V4cExpdGVyYWwuXG4gKlxuICogQHBhcmFtIHtSZWdFeHBWYWxpZGF0aW9uU3RhdGV9IHN0YXRlIFRoZSBzdGF0ZSB0byB2YWxpZGF0ZSBSZWdFeHAuXG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqL1xucHAkMS52YWxpZGF0ZVJlZ0V4cFBhdHRlcm4gPSBmdW5jdGlvbihzdGF0ZSkge1xuICB0aGlzLnJlZ2V4cF9wYXR0ZXJuKHN0YXRlKTtcblxuICAvLyBUaGUgZ29hbCBzeW1ib2wgZm9yIHRoZSBwYXJzZSBpcyB8UGF0dGVyblt+VSwgfk5dfC4gSWYgdGhlIHJlc3VsdCBvZlxuICAvLyBwYXJzaW5nIGNvbnRhaW5zIGEgfEdyb3VwTmFtZXwsIHJlcGFyc2Ugd2l0aCB0aGUgZ29hbCBzeW1ib2xcbiAgLy8gfFBhdHRlcm5bflUsICtOXXwgYW5kIHVzZSB0aGlzIHJlc3VsdCBpbnN0ZWFkLiBUaHJvdyBhICpTeW50YXhFcnJvcipcbiAgLy8gZXhjZXB0aW9uIGlmIF9QXyBkaWQgbm90IGNvbmZvcm0gdG8gdGhlIGdyYW1tYXIsIGlmIGFueSBlbGVtZW50cyBvZiBfUF9cbiAgLy8gd2VyZSBub3QgbWF0Y2hlZCBieSB0aGUgcGFyc2UsIG9yIGlmIGFueSBFYXJseSBFcnJvciBjb25kaXRpb25zIGV4aXN0LlxuICBpZiAoIXN0YXRlLnN3aXRjaE4gJiYgdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDkgJiYgaGFzUHJvcChzdGF0ZS5ncm91cE5hbWVzKSkge1xuICAgIHN0YXRlLnN3aXRjaE4gPSB0cnVlO1xuICAgIHRoaXMucmVnZXhwX3BhdHRlcm4oc3RhdGUpO1xuICB9XG59O1xuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1QYXR0ZXJuXG5wcCQxLnJlZ2V4cF9wYXR0ZXJuID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgc3RhdGUucG9zID0gMDtcbiAgc3RhdGUubGFzdEludFZhbHVlID0gMDtcbiAgc3RhdGUubGFzdFN0cmluZ1ZhbHVlID0gXCJcIjtcbiAgc3RhdGUubGFzdEFzc2VydGlvbklzUXVhbnRpZmlhYmxlID0gZmFsc2U7XG4gIHN0YXRlLm51bUNhcHR1cmluZ1BhcmVucyA9IDA7XG4gIHN0YXRlLm1heEJhY2tSZWZlcmVuY2UgPSAwO1xuICBzdGF0ZS5ncm91cE5hbWVzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgc3RhdGUuYmFja1JlZmVyZW5jZU5hbWVzLmxlbmd0aCA9IDA7XG4gIHN0YXRlLmJyYW5jaElEID0gbnVsbDtcblxuICB0aGlzLnJlZ2V4cF9kaXNqdW5jdGlvbihzdGF0ZSk7XG5cbiAgaWYgKHN0YXRlLnBvcyAhPT0gc3RhdGUuc291cmNlLmxlbmd0aCkge1xuICAgIC8vIE1ha2UgdGhlIHNhbWUgbWVzc2FnZXMgYXMgVjguXG4gICAgaWYgKHN0YXRlLmVhdCgweDI5IC8qICkgKi8pKSB7XG4gICAgICBzdGF0ZS5yYWlzZShcIlVubWF0Y2hlZCAnKSdcIik7XG4gICAgfVxuICAgIGlmIChzdGF0ZS5lYXQoMHg1RCAvKiBdICovKSB8fCBzdGF0ZS5lYXQoMHg3RCAvKiB9ICovKSkge1xuICAgICAgc3RhdGUucmFpc2UoXCJMb25lIHF1YW50aWZpZXIgYnJhY2tldHNcIik7XG4gICAgfVxuICB9XG4gIGlmIChzdGF0ZS5tYXhCYWNrUmVmZXJlbmNlID4gc3RhdGUubnVtQ2FwdHVyaW5nUGFyZW5zKSB7XG4gICAgc3RhdGUucmFpc2UoXCJJbnZhbGlkIGVzY2FwZVwiKTtcbiAgfVxuICBmb3IgKHZhciBpID0gMCwgbGlzdCA9IHN0YXRlLmJhY2tSZWZlcmVuY2VOYW1lczsgaSA8IGxpc3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICB2YXIgbmFtZSA9IGxpc3RbaV07XG5cbiAgICBpZiAoIXN0YXRlLmdyb3VwTmFtZXNbbmFtZV0pIHtcbiAgICAgIHN0YXRlLnJhaXNlKFwiSW52YWxpZCBuYW1lZCBjYXB0dXJlIHJlZmVyZW5jZWRcIik7XG4gICAgfVxuICB9XG59O1xuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1EaXNqdW5jdGlvblxucHAkMS5yZWdleHBfZGlzanVuY3Rpb24gPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgdHJhY2tEaXNqdW5jdGlvbiA9IHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSAxNjtcbiAgaWYgKHRyYWNrRGlzanVuY3Rpb24pIHsgc3RhdGUuYnJhbmNoSUQgPSBuZXcgQnJhbmNoSUQoc3RhdGUuYnJhbmNoSUQsIG51bGwpOyB9XG4gIHRoaXMucmVnZXhwX2FsdGVybmF0aXZlKHN0YXRlKTtcbiAgd2hpbGUgKHN0YXRlLmVhdCgweDdDIC8qIHwgKi8pKSB7XG4gICAgaWYgKHRyYWNrRGlzanVuY3Rpb24pIHsgc3RhdGUuYnJhbmNoSUQgPSBzdGF0ZS5icmFuY2hJRC5zaWJsaW5nKCk7IH1cbiAgICB0aGlzLnJlZ2V4cF9hbHRlcm5hdGl2ZShzdGF0ZSk7XG4gIH1cbiAgaWYgKHRyYWNrRGlzanVuY3Rpb24pIHsgc3RhdGUuYnJhbmNoSUQgPSBzdGF0ZS5icmFuY2hJRC5wYXJlbnQ7IH1cblxuICAvLyBNYWtlIHRoZSBzYW1lIG1lc3NhZ2UgYXMgVjguXG4gIGlmICh0aGlzLnJlZ2V4cF9lYXRRdWFudGlmaWVyKHN0YXRlLCB0cnVlKSkge1xuICAgIHN0YXRlLnJhaXNlKFwiTm90aGluZyB0byByZXBlYXRcIik7XG4gIH1cbiAgaWYgKHN0YXRlLmVhdCgweDdCIC8qIHsgKi8pKSB7XG4gICAgc3RhdGUucmFpc2UoXCJMb25lIHF1YW50aWZpZXIgYnJhY2tldHNcIik7XG4gIH1cbn07XG5cbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLUFsdGVybmF0aXZlXG5wcCQxLnJlZ2V4cF9hbHRlcm5hdGl2ZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHdoaWxlIChzdGF0ZS5wb3MgPCBzdGF0ZS5zb3VyY2UubGVuZ3RoICYmIHRoaXMucmVnZXhwX2VhdFRlcm0oc3RhdGUpKSB7fVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtYW5uZXhCLVRlcm1cbnBwJDEucmVnZXhwX2VhdFRlcm0gPSBmdW5jdGlvbihzdGF0ZSkge1xuICBpZiAodGhpcy5yZWdleHBfZWF0QXNzZXJ0aW9uKHN0YXRlKSkge1xuICAgIC8vIEhhbmRsZSBgUXVhbnRpZmlhYmxlQXNzZXJ0aW9uIFF1YW50aWZpZXJgIGFsdGVybmF0aXZlLlxuICAgIC8vIGBzdGF0ZS5sYXN0QXNzZXJ0aW9uSXNRdWFudGlmaWFibGVgIGlzIHRydWUgaWYgdGhlIGxhc3QgZWF0ZW4gQXNzZXJ0aW9uXG4gICAgLy8gaXMgYSBRdWFudGlmaWFibGVBc3NlcnRpb24uXG4gICAgaWYgKHN0YXRlLmxhc3RBc3NlcnRpb25Jc1F1YW50aWZpYWJsZSAmJiB0aGlzLnJlZ2V4cF9lYXRRdWFudGlmaWVyKHN0YXRlKSkge1xuICAgICAgLy8gTWFrZSB0aGUgc2FtZSBtZXNzYWdlIGFzIFY4LlxuICAgICAgaWYgKHN0YXRlLnN3aXRjaFUpIHtcbiAgICAgICAgc3RhdGUucmFpc2UoXCJJbnZhbGlkIHF1YW50aWZpZXJcIik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBpZiAoc3RhdGUuc3dpdGNoVSA/IHRoaXMucmVnZXhwX2VhdEF0b20oc3RhdGUpIDogdGhpcy5yZWdleHBfZWF0RXh0ZW5kZWRBdG9tKHN0YXRlKSkge1xuICAgIHRoaXMucmVnZXhwX2VhdFF1YW50aWZpZXIoc3RhdGUpO1xuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICByZXR1cm4gZmFsc2Vcbn07XG5cbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLWFubmV4Qi1Bc3NlcnRpb25cbnBwJDEucmVnZXhwX2VhdEFzc2VydGlvbiA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcbiAgc3RhdGUubGFzdEFzc2VydGlvbklzUXVhbnRpZmlhYmxlID0gZmFsc2U7XG5cbiAgLy8gXiwgJFxuICBpZiAoc3RhdGUuZWF0KDB4NUUgLyogXiAqLykgfHwgc3RhdGUuZWF0KDB4MjQgLyogJCAqLykpIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgLy8gXFxiIFxcQlxuICBpZiAoc3RhdGUuZWF0KDB4NUMgLyogXFwgKi8pKSB7XG4gICAgaWYgKHN0YXRlLmVhdCgweDQyIC8qIEIgKi8pIHx8IHN0YXRlLmVhdCgweDYyIC8qIGIgKi8pKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICBzdGF0ZS5wb3MgPSBzdGFydDtcbiAgfVxuXG4gIC8vIExvb2thaGVhZCAvIExvb2tiZWhpbmRcbiAgaWYgKHN0YXRlLmVhdCgweDI4IC8qICggKi8pICYmIHN0YXRlLmVhdCgweDNGIC8qID8gKi8pKSB7XG4gICAgdmFyIGxvb2tiZWhpbmQgPSBmYWxzZTtcbiAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDkpIHtcbiAgICAgIGxvb2tiZWhpbmQgPSBzdGF0ZS5lYXQoMHgzQyAvKiA8ICovKTtcbiAgICB9XG4gICAgaWYgKHN0YXRlLmVhdCgweDNEIC8qID0gKi8pIHx8IHN0YXRlLmVhdCgweDIxIC8qICEgKi8pKSB7XG4gICAgICB0aGlzLnJlZ2V4cF9kaXNqdW5jdGlvbihzdGF0ZSk7XG4gICAgICBpZiAoIXN0YXRlLmVhdCgweDI5IC8qICkgKi8pKSB7XG4gICAgICAgIHN0YXRlLnJhaXNlKFwiVW50ZXJtaW5hdGVkIGdyb3VwXCIpO1xuICAgICAgfVxuICAgICAgc3RhdGUubGFzdEFzc2VydGlvbklzUXVhbnRpZmlhYmxlID0gIWxvb2tiZWhpbmQ7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuXG4gIHN0YXRlLnBvcyA9IHN0YXJ0O1xuICByZXR1cm4gZmFsc2Vcbn07XG5cbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLVF1YW50aWZpZXJcbnBwJDEucmVnZXhwX2VhdFF1YW50aWZpZXIgPSBmdW5jdGlvbihzdGF0ZSwgbm9FcnJvcikge1xuICBpZiAoIG5vRXJyb3IgPT09IHZvaWQgMCApIG5vRXJyb3IgPSBmYWxzZTtcblxuICBpZiAodGhpcy5yZWdleHBfZWF0UXVhbnRpZmllclByZWZpeChzdGF0ZSwgbm9FcnJvcikpIHtcbiAgICBzdGF0ZS5lYXQoMHgzRiAvKiA/ICovKTtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHJldHVybiBmYWxzZVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtUXVhbnRpZmllclByZWZpeFxucHAkMS5yZWdleHBfZWF0UXVhbnRpZmllclByZWZpeCA9IGZ1bmN0aW9uKHN0YXRlLCBub0Vycm9yKSB7XG4gIHJldHVybiAoXG4gICAgc3RhdGUuZWF0KDB4MkEgLyogKiAqLykgfHxcbiAgICBzdGF0ZS5lYXQoMHgyQiAvKiArICovKSB8fFxuICAgIHN0YXRlLmVhdCgweDNGIC8qID8gKi8pIHx8XG4gICAgdGhpcy5yZWdleHBfZWF0QnJhY2VkUXVhbnRpZmllcihzdGF0ZSwgbm9FcnJvcilcbiAgKVxufTtcbnBwJDEucmVnZXhwX2VhdEJyYWNlZFF1YW50aWZpZXIgPSBmdW5jdGlvbihzdGF0ZSwgbm9FcnJvcikge1xuICB2YXIgc3RhcnQgPSBzdGF0ZS5wb3M7XG4gIGlmIChzdGF0ZS5lYXQoMHg3QiAvKiB7ICovKSkge1xuICAgIHZhciBtaW4gPSAwLCBtYXggPSAtMTtcbiAgICBpZiAodGhpcy5yZWdleHBfZWF0RGVjaW1hbERpZ2l0cyhzdGF0ZSkpIHtcbiAgICAgIG1pbiA9IHN0YXRlLmxhc3RJbnRWYWx1ZTtcbiAgICAgIGlmIChzdGF0ZS5lYXQoMHgyQyAvKiAsICovKSAmJiB0aGlzLnJlZ2V4cF9lYXREZWNpbWFsRGlnaXRzKHN0YXRlKSkge1xuICAgICAgICBtYXggPSBzdGF0ZS5sYXN0SW50VmFsdWU7XG4gICAgICB9XG4gICAgICBpZiAoc3RhdGUuZWF0KDB4N0QgLyogfSAqLykpIHtcbiAgICAgICAgLy8gU3ludGF4RXJyb3IgaW4gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3NlYy10ZXJtXG4gICAgICAgIGlmIChtYXggIT09IC0xICYmIG1heCA8IG1pbiAmJiAhbm9FcnJvcikge1xuICAgICAgICAgIHN0YXRlLnJhaXNlKFwibnVtYmVycyBvdXQgb2Ygb3JkZXIgaW4ge30gcXVhbnRpZmllclwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc3RhdGUuc3dpdGNoVSAmJiAhbm9FcnJvcikge1xuICAgICAgc3RhdGUucmFpc2UoXCJJbmNvbXBsZXRlIHF1YW50aWZpZXJcIik7XG4gICAgfVxuICAgIHN0YXRlLnBvcyA9IHN0YXJ0O1xuICB9XG4gIHJldHVybiBmYWxzZVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtQXRvbVxucHAkMS5yZWdleHBfZWF0QXRvbSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHJldHVybiAoXG4gICAgdGhpcy5yZWdleHBfZWF0UGF0dGVybkNoYXJhY3RlcnMoc3RhdGUpIHx8XG4gICAgc3RhdGUuZWF0KDB4MkUgLyogLiAqLykgfHxcbiAgICB0aGlzLnJlZ2V4cF9lYXRSZXZlcnNlU29saWR1c0F0b21Fc2NhcGUoc3RhdGUpIHx8XG4gICAgdGhpcy5yZWdleHBfZWF0Q2hhcmFjdGVyQ2xhc3Moc3RhdGUpIHx8XG4gICAgdGhpcy5yZWdleHBfZWF0VW5jYXB0dXJpbmdHcm91cChzdGF0ZSkgfHxcbiAgICB0aGlzLnJlZ2V4cF9lYXRDYXB0dXJpbmdHcm91cChzdGF0ZSlcbiAgKVxufTtcbnBwJDEucmVnZXhwX2VhdFJldmVyc2VTb2xpZHVzQXRvbUVzY2FwZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcbiAgaWYgKHN0YXRlLmVhdCgweDVDIC8qIFxcICovKSkge1xuICAgIGlmICh0aGlzLnJlZ2V4cF9lYXRBdG9tRXNjYXBlKHN0YXRlKSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgc3RhdGUucG9zID0gc3RhcnQ7XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xucHAkMS5yZWdleHBfZWF0VW5jYXB0dXJpbmdHcm91cCA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcbiAgaWYgKHN0YXRlLmVhdCgweDI4IC8qICggKi8pKSB7XG4gICAgaWYgKHN0YXRlLmVhdCgweDNGIC8qID8gKi8pKSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDE2KSB7XG4gICAgICAgIHZhciBhZGRNb2RpZmllcnMgPSB0aGlzLnJlZ2V4cF9lYXRNb2RpZmllcnMoc3RhdGUpO1xuICAgICAgICB2YXIgaGFzSHlwaGVuID0gc3RhdGUuZWF0KDB4MkQgLyogLSAqLyk7XG4gICAgICAgIGlmIChhZGRNb2RpZmllcnMgfHwgaGFzSHlwaGVuKSB7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhZGRNb2RpZmllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBtb2RpZmllciA9IGFkZE1vZGlmaWVycy5jaGFyQXQoaSk7XG4gICAgICAgICAgICBpZiAoYWRkTW9kaWZpZXJzLmluZGV4T2YobW9kaWZpZXIsIGkgKyAxKSA+IC0xKSB7XG4gICAgICAgICAgICAgIHN0YXRlLnJhaXNlKFwiRHVwbGljYXRlIHJlZ3VsYXIgZXhwcmVzc2lvbiBtb2RpZmllcnNcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChoYXNIeXBoZW4pIHtcbiAgICAgICAgICAgIHZhciByZW1vdmVNb2RpZmllcnMgPSB0aGlzLnJlZ2V4cF9lYXRNb2RpZmllcnMoc3RhdGUpO1xuICAgICAgICAgICAgaWYgKCFhZGRNb2RpZmllcnMgJiYgIXJlbW92ZU1vZGlmaWVycyAmJiBzdGF0ZS5jdXJyZW50KCkgPT09IDB4M0EgLyogOiAqLykge1xuICAgICAgICAgICAgICBzdGF0ZS5yYWlzZShcIkludmFsaWQgcmVndWxhciBleHByZXNzaW9uIG1vZGlmaWVyc1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAodmFyIGkkMSA9IDA7IGkkMSA8IHJlbW92ZU1vZGlmaWVycy5sZW5ndGg7IGkkMSsrKSB7XG4gICAgICAgICAgICAgIHZhciBtb2RpZmllciQxID0gcmVtb3ZlTW9kaWZpZXJzLmNoYXJBdChpJDEpO1xuICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgcmVtb3ZlTW9kaWZpZXJzLmluZGV4T2YobW9kaWZpZXIkMSwgaSQxICsgMSkgPiAtMSB8fFxuICAgICAgICAgICAgICAgIGFkZE1vZGlmaWVycy5pbmRleE9mKG1vZGlmaWVyJDEpID4gLTFcbiAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUucmFpc2UoXCJEdXBsaWNhdGUgcmVndWxhciBleHByZXNzaW9uIG1vZGlmaWVyc1wiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHN0YXRlLmVhdCgweDNBIC8qIDogKi8pKSB7XG4gICAgICAgIHRoaXMucmVnZXhwX2Rpc2p1bmN0aW9uKHN0YXRlKTtcbiAgICAgICAgaWYgKHN0YXRlLmVhdCgweDI5IC8qICkgKi8pKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgICBzdGF0ZS5yYWlzZShcIlVudGVybWluYXRlZCBncm91cFwiKTtcbiAgICAgIH1cbiAgICB9XG4gICAgc3RhdGUucG9zID0gc3RhcnQ7XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xucHAkMS5yZWdleHBfZWF0Q2FwdHVyaW5nR3JvdXAgPSBmdW5jdGlvbihzdGF0ZSkge1xuICBpZiAoc3RhdGUuZWF0KDB4MjggLyogKCAqLykpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDkpIHtcbiAgICAgIHRoaXMucmVnZXhwX2dyb3VwU3BlY2lmaWVyKHN0YXRlKTtcbiAgICB9IGVsc2UgaWYgKHN0YXRlLmN1cnJlbnQoKSA9PT0gMHgzRiAvKiA/ICovKSB7XG4gICAgICBzdGF0ZS5yYWlzZShcIkludmFsaWQgZ3JvdXBcIik7XG4gICAgfVxuICAgIHRoaXMucmVnZXhwX2Rpc2p1bmN0aW9uKHN0YXRlKTtcbiAgICBpZiAoc3RhdGUuZWF0KDB4MjkgLyogKSAqLykpIHtcbiAgICAgIHN0YXRlLm51bUNhcHR1cmluZ1BhcmVucyArPSAxO1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgc3RhdGUucmFpc2UoXCJVbnRlcm1pbmF0ZWQgZ3JvdXBcIik7XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuLy8gUmVndWxhckV4cHJlc3Npb25Nb2RpZmllcnMgOjpcbi8vICAgW2VtcHR5XVxuLy8gICBSZWd1bGFyRXhwcmVzc2lvbk1vZGlmaWVycyBSZWd1bGFyRXhwcmVzc2lvbk1vZGlmaWVyXG5wcCQxLnJlZ2V4cF9lYXRNb2RpZmllcnMgPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgbW9kaWZpZXJzID0gXCJcIjtcbiAgdmFyIGNoID0gMDtcbiAgd2hpbGUgKChjaCA9IHN0YXRlLmN1cnJlbnQoKSkgIT09IC0xICYmIGlzUmVndWxhckV4cHJlc3Npb25Nb2RpZmllcihjaCkpIHtcbiAgICBtb2RpZmllcnMgKz0gY29kZVBvaW50VG9TdHJpbmcoY2gpO1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgfVxuICByZXR1cm4gbW9kaWZpZXJzXG59O1xuLy8gUmVndWxhckV4cHJlc3Npb25Nb2RpZmllciA6OiBvbmUgb2Zcbi8vICAgYGlgIGBtYCBgc2BcbmZ1bmN0aW9uIGlzUmVndWxhckV4cHJlc3Npb25Nb2RpZmllcihjaCkge1xuICByZXR1cm4gY2ggPT09IDB4NjkgLyogaSAqLyB8fCBjaCA9PT0gMHg2ZCAvKiBtICovIHx8IGNoID09PSAweDczIC8qIHMgKi9cbn1cblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtYW5uZXhCLUV4dGVuZGVkQXRvbVxucHAkMS5yZWdleHBfZWF0RXh0ZW5kZWRBdG9tID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgcmV0dXJuIChcbiAgICBzdGF0ZS5lYXQoMHgyRSAvKiAuICovKSB8fFxuICAgIHRoaXMucmVnZXhwX2VhdFJldmVyc2VTb2xpZHVzQXRvbUVzY2FwZShzdGF0ZSkgfHxcbiAgICB0aGlzLnJlZ2V4cF9lYXRDaGFyYWN0ZXJDbGFzcyhzdGF0ZSkgfHxcbiAgICB0aGlzLnJlZ2V4cF9lYXRVbmNhcHR1cmluZ0dyb3VwKHN0YXRlKSB8fFxuICAgIHRoaXMucmVnZXhwX2VhdENhcHR1cmluZ0dyb3VwKHN0YXRlKSB8fFxuICAgIHRoaXMucmVnZXhwX2VhdEludmFsaWRCcmFjZWRRdWFudGlmaWVyKHN0YXRlKSB8fFxuICAgIHRoaXMucmVnZXhwX2VhdEV4dGVuZGVkUGF0dGVybkNoYXJhY3RlcihzdGF0ZSlcbiAgKVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtYW5uZXhCLUludmFsaWRCcmFjZWRRdWFudGlmaWVyXG5wcCQxLnJlZ2V4cF9lYXRJbnZhbGlkQnJhY2VkUXVhbnRpZmllciA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIGlmICh0aGlzLnJlZ2V4cF9lYXRCcmFjZWRRdWFudGlmaWVyKHN0YXRlLCB0cnVlKSkge1xuICAgIHN0YXRlLnJhaXNlKFwiTm90aGluZyB0byByZXBlYXRcIik7XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1TeW50YXhDaGFyYWN0ZXJcbnBwJDEucmVnZXhwX2VhdFN5bnRheENoYXJhY3RlciA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBjaCA9IHN0YXRlLmN1cnJlbnQoKTtcbiAgaWYgKGlzU3ludGF4Q2hhcmFjdGVyKGNoKSkge1xuICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IGNoO1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHJldHVybiBmYWxzZVxufTtcbmZ1bmN0aW9uIGlzU3ludGF4Q2hhcmFjdGVyKGNoKSB7XG4gIHJldHVybiAoXG4gICAgY2ggPT09IDB4MjQgLyogJCAqLyB8fFxuICAgIGNoID49IDB4MjggLyogKCAqLyAmJiBjaCA8PSAweDJCIC8qICsgKi8gfHxcbiAgICBjaCA9PT0gMHgyRSAvKiAuICovIHx8XG4gICAgY2ggPT09IDB4M0YgLyogPyAqLyB8fFxuICAgIGNoID49IDB4NUIgLyogWyAqLyAmJiBjaCA8PSAweDVFIC8qIF4gKi8gfHxcbiAgICBjaCA+PSAweDdCIC8qIHsgKi8gJiYgY2ggPD0gMHg3RCAvKiB9ICovXG4gIClcbn1cblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtUGF0dGVybkNoYXJhY3RlclxuLy8gQnV0IGVhdCBlYWdlci5cbnBwJDEucmVnZXhwX2VhdFBhdHRlcm5DaGFyYWN0ZXJzID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIHN0YXJ0ID0gc3RhdGUucG9zO1xuICB2YXIgY2ggPSAwO1xuICB3aGlsZSAoKGNoID0gc3RhdGUuY3VycmVudCgpKSAhPT0gLTEgJiYgIWlzU3ludGF4Q2hhcmFjdGVyKGNoKSkge1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgfVxuICByZXR1cm4gc3RhdGUucG9zICE9PSBzdGFydFxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtYW5uZXhCLUV4dGVuZGVkUGF0dGVybkNoYXJhY3RlclxucHAkMS5yZWdleHBfZWF0RXh0ZW5kZWRQYXR0ZXJuQ2hhcmFjdGVyID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIGNoID0gc3RhdGUuY3VycmVudCgpO1xuICBpZiAoXG4gICAgY2ggIT09IC0xICYmXG4gICAgY2ggIT09IDB4MjQgLyogJCAqLyAmJlxuICAgICEoY2ggPj0gMHgyOCAvKiAoICovICYmIGNoIDw9IDB4MkIgLyogKyAqLykgJiZcbiAgICBjaCAhPT0gMHgyRSAvKiAuICovICYmXG4gICAgY2ggIT09IDB4M0YgLyogPyAqLyAmJlxuICAgIGNoICE9PSAweDVCIC8qIFsgKi8gJiZcbiAgICBjaCAhPT0gMHg1RSAvKiBeICovICYmXG4gICAgY2ggIT09IDB4N0MgLyogfCAqL1xuICApIHtcbiAgICBzdGF0ZS5hZHZhbmNlKCk7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn07XG5cbi8vIEdyb3VwU3BlY2lmaWVyIDo6XG4vLyAgIFtlbXB0eV1cbi8vICAgYD9gIEdyb3VwTmFtZVxucHAkMS5yZWdleHBfZ3JvdXBTcGVjaWZpZXIgPSBmdW5jdGlvbihzdGF0ZSkge1xuICBpZiAoc3RhdGUuZWF0KDB4M0YgLyogPyAqLykpIHtcbiAgICBpZiAoIXRoaXMucmVnZXhwX2VhdEdyb3VwTmFtZShzdGF0ZSkpIHsgc3RhdGUucmFpc2UoXCJJbnZhbGlkIGdyb3VwXCIpOyB9XG4gICAgdmFyIHRyYWNrRGlzanVuY3Rpb24gPSB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTY7XG4gICAgdmFyIGtub3duID0gc3RhdGUuZ3JvdXBOYW1lc1tzdGF0ZS5sYXN0U3RyaW5nVmFsdWVdO1xuICAgIGlmIChrbm93bikge1xuICAgICAgaWYgKHRyYWNrRGlzanVuY3Rpb24pIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxpc3QgPSBrbm93bjsgaSA8IGxpc3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICB2YXIgYWx0SUQgPSBsaXN0W2ldO1xuXG4gICAgICAgICAgaWYgKCFhbHRJRC5zZXBhcmF0ZWRGcm9tKHN0YXRlLmJyYW5jaElEKSlcbiAgICAgICAgICAgIHsgc3RhdGUucmFpc2UoXCJEdXBsaWNhdGUgY2FwdHVyZSBncm91cCBuYW1lXCIpOyB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXRlLnJhaXNlKFwiRHVwbGljYXRlIGNhcHR1cmUgZ3JvdXAgbmFtZVwiKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRyYWNrRGlzanVuY3Rpb24pIHtcbiAgICAgIChrbm93biB8fCAoc3RhdGUuZ3JvdXBOYW1lc1tzdGF0ZS5sYXN0U3RyaW5nVmFsdWVdID0gW10pKS5wdXNoKHN0YXRlLmJyYW5jaElEKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RhdGUuZ3JvdXBOYW1lc1tzdGF0ZS5sYXN0U3RyaW5nVmFsdWVdID0gdHJ1ZTtcbiAgICB9XG4gIH1cbn07XG5cbi8vIEdyb3VwTmFtZSA6OlxuLy8gICBgPGAgUmVnRXhwSWRlbnRpZmllck5hbWUgYD5gXG4vLyBOb3RlOiB0aGlzIHVwZGF0ZXMgYHN0YXRlLmxhc3RTdHJpbmdWYWx1ZWAgcHJvcGVydHkgd2l0aCB0aGUgZWF0ZW4gbmFtZS5cbnBwJDEucmVnZXhwX2VhdEdyb3VwTmFtZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHN0YXRlLmxhc3RTdHJpbmdWYWx1ZSA9IFwiXCI7XG4gIGlmIChzdGF0ZS5lYXQoMHgzQyAvKiA8ICovKSkge1xuICAgIGlmICh0aGlzLnJlZ2V4cF9lYXRSZWdFeHBJZGVudGlmaWVyTmFtZShzdGF0ZSkgJiYgc3RhdGUuZWF0KDB4M0UgLyogPiAqLykpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICAgIHN0YXRlLnJhaXNlKFwiSW52YWxpZCBjYXB0dXJlIGdyb3VwIG5hbWVcIik7XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG4vLyBSZWdFeHBJZGVudGlmaWVyTmFtZSA6OlxuLy8gICBSZWdFeHBJZGVudGlmaWVyU3RhcnRcbi8vICAgUmVnRXhwSWRlbnRpZmllck5hbWUgUmVnRXhwSWRlbnRpZmllclBhcnRcbi8vIE5vdGU6IHRoaXMgdXBkYXRlcyBgc3RhdGUubGFzdFN0cmluZ1ZhbHVlYCBwcm9wZXJ0eSB3aXRoIHRoZSBlYXRlbiBuYW1lLlxucHAkMS5yZWdleHBfZWF0UmVnRXhwSWRlbnRpZmllck5hbWUgPSBmdW5jdGlvbihzdGF0ZSkge1xuICBzdGF0ZS5sYXN0U3RyaW5nVmFsdWUgPSBcIlwiO1xuICBpZiAodGhpcy5yZWdleHBfZWF0UmVnRXhwSWRlbnRpZmllclN0YXJ0KHN0YXRlKSkge1xuICAgIHN0YXRlLmxhc3RTdHJpbmdWYWx1ZSArPSBjb2RlUG9pbnRUb1N0cmluZyhzdGF0ZS5sYXN0SW50VmFsdWUpO1xuICAgIHdoaWxlICh0aGlzLnJlZ2V4cF9lYXRSZWdFeHBJZGVudGlmaWVyUGFydChzdGF0ZSkpIHtcbiAgICAgIHN0YXRlLmxhc3RTdHJpbmdWYWx1ZSArPSBjb2RlUG9pbnRUb1N0cmluZyhzdGF0ZS5sYXN0SW50VmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHJldHVybiBmYWxzZVxufTtcblxuLy8gUmVnRXhwSWRlbnRpZmllclN0YXJ0IDo6XG4vLyAgIFVuaWNvZGVJRFN0YXJ0XG4vLyAgIGAkYFxuLy8gICBgX2Bcbi8vICAgYFxcYCBSZWdFeHBVbmljb2RlRXNjYXBlU2VxdWVuY2VbK1VdXG5wcCQxLnJlZ2V4cF9lYXRSZWdFeHBJZGVudGlmaWVyU3RhcnQgPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgc3RhcnQgPSBzdGF0ZS5wb3M7XG4gIHZhciBmb3JjZVUgPSB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTE7XG4gIHZhciBjaCA9IHN0YXRlLmN1cnJlbnQoZm9yY2VVKTtcbiAgc3RhdGUuYWR2YW5jZShmb3JjZVUpO1xuXG4gIGlmIChjaCA9PT0gMHg1QyAvKiBcXCAqLyAmJiB0aGlzLnJlZ2V4cF9lYXRSZWdFeHBVbmljb2RlRXNjYXBlU2VxdWVuY2Uoc3RhdGUsIGZvcmNlVSkpIHtcbiAgICBjaCA9IHN0YXRlLmxhc3RJbnRWYWx1ZTtcbiAgfVxuICBpZiAoaXNSZWdFeHBJZGVudGlmaWVyU3RhcnQoY2gpKSB7XG4gICAgc3RhdGUubGFzdEludFZhbHVlID0gY2g7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIHN0YXRlLnBvcyA9IHN0YXJ0O1xuICByZXR1cm4gZmFsc2Vcbn07XG5mdW5jdGlvbiBpc1JlZ0V4cElkZW50aWZpZXJTdGFydChjaCkge1xuICByZXR1cm4gaXNJZGVudGlmaWVyU3RhcnQoY2gsIHRydWUpIHx8IGNoID09PSAweDI0IC8qICQgKi8gfHwgY2ggPT09IDB4NUYgLyogXyAqL1xufVxuXG4vLyBSZWdFeHBJZGVudGlmaWVyUGFydCA6OlxuLy8gICBVbmljb2RlSURDb250aW51ZVxuLy8gICBgJGBcbi8vICAgYF9gXG4vLyAgIGBcXGAgUmVnRXhwVW5pY29kZUVzY2FwZVNlcXVlbmNlWytVXVxuLy8gICA8WldOSj5cbi8vICAgPFpXSj5cbnBwJDEucmVnZXhwX2VhdFJlZ0V4cElkZW50aWZpZXJQYXJ0ID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIHN0YXJ0ID0gc3RhdGUucG9zO1xuICB2YXIgZm9yY2VVID0gdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDExO1xuICB2YXIgY2ggPSBzdGF0ZS5jdXJyZW50KGZvcmNlVSk7XG4gIHN0YXRlLmFkdmFuY2UoZm9yY2VVKTtcblxuICBpZiAoY2ggPT09IDB4NUMgLyogXFwgKi8gJiYgdGhpcy5yZWdleHBfZWF0UmVnRXhwVW5pY29kZUVzY2FwZVNlcXVlbmNlKHN0YXRlLCBmb3JjZVUpKSB7XG4gICAgY2ggPSBzdGF0ZS5sYXN0SW50VmFsdWU7XG4gIH1cbiAgaWYgKGlzUmVnRXhwSWRlbnRpZmllclBhcnQoY2gpKSB7XG4gICAgc3RhdGUubGFzdEludFZhbHVlID0gY2g7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIHN0YXRlLnBvcyA9IHN0YXJ0O1xuICByZXR1cm4gZmFsc2Vcbn07XG5mdW5jdGlvbiBpc1JlZ0V4cElkZW50aWZpZXJQYXJ0KGNoKSB7XG4gIHJldHVybiBpc0lkZW50aWZpZXJDaGFyKGNoLCB0cnVlKSB8fCBjaCA9PT0gMHgyNCAvKiAkICovIHx8IGNoID09PSAweDVGIC8qIF8gKi8gfHwgY2ggPT09IDB4MjAwQyAvKiA8WldOSj4gKi8gfHwgY2ggPT09IDB4MjAwRCAvKiA8WldKPiAqL1xufVxuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1hbm5leEItQXRvbUVzY2FwZVxucHAkMS5yZWdleHBfZWF0QXRvbUVzY2FwZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIGlmIChcbiAgICB0aGlzLnJlZ2V4cF9lYXRCYWNrUmVmZXJlbmNlKHN0YXRlKSB8fFxuICAgIHRoaXMucmVnZXhwX2VhdENoYXJhY3RlckNsYXNzRXNjYXBlKHN0YXRlKSB8fFxuICAgIHRoaXMucmVnZXhwX2VhdENoYXJhY3RlckVzY2FwZShzdGF0ZSkgfHxcbiAgICAoc3RhdGUuc3dpdGNoTiAmJiB0aGlzLnJlZ2V4cF9lYXRLR3JvdXBOYW1lKHN0YXRlKSlcbiAgKSB7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICBpZiAoc3RhdGUuc3dpdGNoVSkge1xuICAgIC8vIE1ha2UgdGhlIHNhbWUgbWVzc2FnZSBhcyBWOC5cbiAgICBpZiAoc3RhdGUuY3VycmVudCgpID09PSAweDYzIC8qIGMgKi8pIHtcbiAgICAgIHN0YXRlLnJhaXNlKFwiSW52YWxpZCB1bmljb2RlIGVzY2FwZVwiKTtcbiAgICB9XG4gICAgc3RhdGUucmFpc2UoXCJJbnZhbGlkIGVzY2FwZVwiKTtcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn07XG5wcCQxLnJlZ2V4cF9lYXRCYWNrUmVmZXJlbmNlID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIHN0YXJ0ID0gc3RhdGUucG9zO1xuICBpZiAodGhpcy5yZWdleHBfZWF0RGVjaW1hbEVzY2FwZShzdGF0ZSkpIHtcbiAgICB2YXIgbiA9IHN0YXRlLmxhc3RJbnRWYWx1ZTtcbiAgICBpZiAoc3RhdGUuc3dpdGNoVSkge1xuICAgICAgLy8gRm9yIFN5bnRheEVycm9yIGluIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNzZWMtYXRvbWVzY2FwZVxuICAgICAgaWYgKG4gPiBzdGF0ZS5tYXhCYWNrUmVmZXJlbmNlKSB7XG4gICAgICAgIHN0YXRlLm1heEJhY2tSZWZlcmVuY2UgPSBuO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgaWYgKG4gPD0gc3RhdGUubnVtQ2FwdHVyaW5nUGFyZW5zKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICBzdGF0ZS5wb3MgPSBzdGFydDtcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn07XG5wcCQxLnJlZ2V4cF9lYXRLR3JvdXBOYW1lID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgaWYgKHN0YXRlLmVhdCgweDZCIC8qIGsgKi8pKSB7XG4gICAgaWYgKHRoaXMucmVnZXhwX2VhdEdyb3VwTmFtZShzdGF0ZSkpIHtcbiAgICAgIHN0YXRlLmJhY2tSZWZlcmVuY2VOYW1lcy5wdXNoKHN0YXRlLmxhc3RTdHJpbmdWYWx1ZSk7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICBzdGF0ZS5yYWlzZShcIkludmFsaWQgbmFtZWQgcmVmZXJlbmNlXCIpO1xuICB9XG4gIHJldHVybiBmYWxzZVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtYW5uZXhCLUNoYXJhY3RlckVzY2FwZVxucHAkMS5yZWdleHBfZWF0Q2hhcmFjdGVyRXNjYXBlID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgcmV0dXJuIChcbiAgICB0aGlzLnJlZ2V4cF9lYXRDb250cm9sRXNjYXBlKHN0YXRlKSB8fFxuICAgIHRoaXMucmVnZXhwX2VhdENDb250cm9sTGV0dGVyKHN0YXRlKSB8fFxuICAgIHRoaXMucmVnZXhwX2VhdFplcm8oc3RhdGUpIHx8XG4gICAgdGhpcy5yZWdleHBfZWF0SGV4RXNjYXBlU2VxdWVuY2Uoc3RhdGUpIHx8XG4gICAgdGhpcy5yZWdleHBfZWF0UmVnRXhwVW5pY29kZUVzY2FwZVNlcXVlbmNlKHN0YXRlLCBmYWxzZSkgfHxcbiAgICAoIXN0YXRlLnN3aXRjaFUgJiYgdGhpcy5yZWdleHBfZWF0TGVnYWN5T2N0YWxFc2NhcGVTZXF1ZW5jZShzdGF0ZSkpIHx8XG4gICAgdGhpcy5yZWdleHBfZWF0SWRlbnRpdHlFc2NhcGUoc3RhdGUpXG4gIClcbn07XG5wcCQxLnJlZ2V4cF9lYXRDQ29udHJvbExldHRlciA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcbiAgaWYgKHN0YXRlLmVhdCgweDYzIC8qIGMgKi8pKSB7XG4gICAgaWYgKHRoaXMucmVnZXhwX2VhdENvbnRyb2xMZXR0ZXIoc3RhdGUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICBzdGF0ZS5wb3MgPSBzdGFydDtcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn07XG5wcCQxLnJlZ2V4cF9lYXRaZXJvID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgaWYgKHN0YXRlLmN1cnJlbnQoKSA9PT0gMHgzMCAvKiAwICovICYmICFpc0RlY2ltYWxEaWdpdChzdGF0ZS5sb29rYWhlYWQoKSkpIHtcbiAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSAwO1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHJldHVybiBmYWxzZVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtQ29udHJvbEVzY2FwZVxucHAkMS5yZWdleHBfZWF0Q29udHJvbEVzY2FwZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBjaCA9IHN0YXRlLmN1cnJlbnQoKTtcbiAgaWYgKGNoID09PSAweDc0IC8qIHQgKi8pIHtcbiAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSAweDA5OyAvKiBcXHQgKi9cbiAgICBzdGF0ZS5hZHZhbmNlKCk7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICBpZiAoY2ggPT09IDB4NkUgLyogbiAqLykge1xuICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IDB4MEE7IC8qIFxcbiAqL1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIGlmIChjaCA9PT0gMHg3NiAvKiB2ICovKSB7XG4gICAgc3RhdGUubGFzdEludFZhbHVlID0gMHgwQjsgLyogXFx2ICovXG4gICAgc3RhdGUuYWR2YW5jZSgpO1xuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgaWYgKGNoID09PSAweDY2IC8qIGYgKi8pIHtcbiAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSAweDBDOyAvKiBcXGYgKi9cbiAgICBzdGF0ZS5hZHZhbmNlKCk7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICBpZiAoY2ggPT09IDB4NzIgLyogciAqLykge1xuICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IDB4MEQ7IC8qIFxcciAqL1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHJldHVybiBmYWxzZVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtQ29udHJvbExldHRlclxucHAkMS5yZWdleHBfZWF0Q29udHJvbExldHRlciA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBjaCA9IHN0YXRlLmN1cnJlbnQoKTtcbiAgaWYgKGlzQ29udHJvbExldHRlcihjaCkpIHtcbiAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSBjaCAlIDB4MjA7XG4gICAgc3RhdGUuYWR2YW5jZSgpO1xuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuZnVuY3Rpb24gaXNDb250cm9sTGV0dGVyKGNoKSB7XG4gIHJldHVybiAoXG4gICAgKGNoID49IDB4NDEgLyogQSAqLyAmJiBjaCA8PSAweDVBIC8qIFogKi8pIHx8XG4gICAgKGNoID49IDB4NjEgLyogYSAqLyAmJiBjaCA8PSAweDdBIC8qIHogKi8pXG4gIClcbn1cblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtUmVnRXhwVW5pY29kZUVzY2FwZVNlcXVlbmNlXG5wcCQxLnJlZ2V4cF9lYXRSZWdFeHBVbmljb2RlRXNjYXBlU2VxdWVuY2UgPSBmdW5jdGlvbihzdGF0ZSwgZm9yY2VVKSB7XG4gIGlmICggZm9yY2VVID09PSB2b2lkIDAgKSBmb3JjZVUgPSBmYWxzZTtcblxuICB2YXIgc3RhcnQgPSBzdGF0ZS5wb3M7XG4gIHZhciBzd2l0Y2hVID0gZm9yY2VVIHx8IHN0YXRlLnN3aXRjaFU7XG5cbiAgaWYgKHN0YXRlLmVhdCgweDc1IC8qIHUgKi8pKSB7XG4gICAgaWYgKHRoaXMucmVnZXhwX2VhdEZpeGVkSGV4RGlnaXRzKHN0YXRlLCA0KSkge1xuICAgICAgdmFyIGxlYWQgPSBzdGF0ZS5sYXN0SW50VmFsdWU7XG4gICAgICBpZiAoc3dpdGNoVSAmJiBsZWFkID49IDB4RDgwMCAmJiBsZWFkIDw9IDB4REJGRikge1xuICAgICAgICB2YXIgbGVhZFN1cnJvZ2F0ZUVuZCA9IHN0YXRlLnBvcztcbiAgICAgICAgaWYgKHN0YXRlLmVhdCgweDVDIC8qIFxcICovKSAmJiBzdGF0ZS5lYXQoMHg3NSAvKiB1ICovKSAmJiB0aGlzLnJlZ2V4cF9lYXRGaXhlZEhleERpZ2l0cyhzdGF0ZSwgNCkpIHtcbiAgICAgICAgICB2YXIgdHJhaWwgPSBzdGF0ZS5sYXN0SW50VmFsdWU7XG4gICAgICAgICAgaWYgKHRyYWlsID49IDB4REMwMCAmJiB0cmFpbCA8PSAweERGRkYpIHtcbiAgICAgICAgICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IChsZWFkIC0gMHhEODAwKSAqIDB4NDAwICsgKHRyYWlsIC0gMHhEQzAwKSArIDB4MTAwMDA7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzdGF0ZS5wb3MgPSBsZWFkU3Vycm9nYXRlRW5kO1xuICAgICAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSBsZWFkO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgaWYgKFxuICAgICAgc3dpdGNoVSAmJlxuICAgICAgc3RhdGUuZWF0KDB4N0IgLyogeyAqLykgJiZcbiAgICAgIHRoaXMucmVnZXhwX2VhdEhleERpZ2l0cyhzdGF0ZSkgJiZcbiAgICAgIHN0YXRlLmVhdCgweDdEIC8qIH0gKi8pICYmXG4gICAgICBpc1ZhbGlkVW5pY29kZShzdGF0ZS5sYXN0SW50VmFsdWUpXG4gICAgKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICBpZiAoc3dpdGNoVSkge1xuICAgICAgc3RhdGUucmFpc2UoXCJJbnZhbGlkIHVuaWNvZGUgZXNjYXBlXCIpO1xuICAgIH1cbiAgICBzdGF0ZS5wb3MgPSBzdGFydDtcbiAgfVxuXG4gIHJldHVybiBmYWxzZVxufTtcbmZ1bmN0aW9uIGlzVmFsaWRVbmljb2RlKGNoKSB7XG4gIHJldHVybiBjaCA+PSAwICYmIGNoIDw9IDB4MTBGRkZGXG59XG5cbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLWFubmV4Qi1JZGVudGl0eUVzY2FwZVxucHAkMS5yZWdleHBfZWF0SWRlbnRpdHlFc2NhcGUgPSBmdW5jdGlvbihzdGF0ZSkge1xuICBpZiAoc3RhdGUuc3dpdGNoVSkge1xuICAgIGlmICh0aGlzLnJlZ2V4cF9lYXRTeW50YXhDaGFyYWN0ZXIoc3RhdGUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICBpZiAoc3RhdGUuZWF0KDB4MkYgLyogLyAqLykpIHtcbiAgICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IDB4MkY7IC8qIC8gKi9cbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgdmFyIGNoID0gc3RhdGUuY3VycmVudCgpO1xuICBpZiAoY2ggIT09IDB4NjMgLyogYyAqLyAmJiAoIXN0YXRlLnN3aXRjaE4gfHwgY2ggIT09IDB4NkIgLyogayAqLykpIHtcbiAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSBjaDtcbiAgICBzdGF0ZS5hZHZhbmNlKCk7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIHJldHVybiBmYWxzZVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtRGVjaW1hbEVzY2FwZVxucHAkMS5yZWdleHBfZWF0RGVjaW1hbEVzY2FwZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IDA7XG4gIHZhciBjaCA9IHN0YXRlLmN1cnJlbnQoKTtcbiAgaWYgKGNoID49IDB4MzEgLyogMSAqLyAmJiBjaCA8PSAweDM5IC8qIDkgKi8pIHtcbiAgICBkbyB7XG4gICAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSAxMCAqIHN0YXRlLmxhc3RJbnRWYWx1ZSArIChjaCAtIDB4MzAgLyogMCAqLyk7XG4gICAgICBzdGF0ZS5hZHZhbmNlKCk7XG4gICAgfSB3aGlsZSAoKGNoID0gc3RhdGUuY3VycmVudCgpKSA+PSAweDMwIC8qIDAgKi8gJiYgY2ggPD0gMHgzOSAvKiA5ICovKVxuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG4vLyBSZXR1cm4gdmFsdWVzIHVzZWQgYnkgY2hhcmFjdGVyIHNldCBwYXJzaW5nIG1ldGhvZHMsIG5lZWRlZCB0b1xuLy8gZm9yYmlkIG5lZ2F0aW9uIG9mIHNldHMgdGhhdCBjYW4gbWF0Y2ggc3RyaW5ncy5cbnZhciBDaGFyU2V0Tm9uZSA9IDA7IC8vIE5vdGhpbmcgcGFyc2VkXG52YXIgQ2hhclNldE9rID0gMTsgLy8gQ29uc3RydWN0IHBhcnNlZCwgY2Fubm90IGNvbnRhaW4gc3RyaW5nc1xudmFyIENoYXJTZXRTdHJpbmcgPSAyOyAvLyBDb25zdHJ1Y3QgcGFyc2VkLCBjYW4gY29udGFpbiBzdHJpbmdzXG5cbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLUNoYXJhY3RlckNsYXNzRXNjYXBlXG5wcCQxLnJlZ2V4cF9lYXRDaGFyYWN0ZXJDbGFzc0VzY2FwZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBjaCA9IHN0YXRlLmN1cnJlbnQoKTtcblxuICBpZiAoaXNDaGFyYWN0ZXJDbGFzc0VzY2FwZShjaCkpIHtcbiAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSAtMTtcbiAgICBzdGF0ZS5hZHZhbmNlKCk7XG4gICAgcmV0dXJuIENoYXJTZXRPa1xuICB9XG5cbiAgdmFyIG5lZ2F0ZSA9IGZhbHNlO1xuICBpZiAoXG4gICAgc3RhdGUuc3dpdGNoVSAmJlxuICAgIHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA5ICYmXG4gICAgKChuZWdhdGUgPSBjaCA9PT0gMHg1MCAvKiBQICovKSB8fCBjaCA9PT0gMHg3MCAvKiBwICovKVxuICApIHtcbiAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSAtMTtcbiAgICBzdGF0ZS5hZHZhbmNlKCk7XG4gICAgdmFyIHJlc3VsdDtcbiAgICBpZiAoXG4gICAgICBzdGF0ZS5lYXQoMHg3QiAvKiB7ICovKSAmJlxuICAgICAgKHJlc3VsdCA9IHRoaXMucmVnZXhwX2VhdFVuaWNvZGVQcm9wZXJ0eVZhbHVlRXhwcmVzc2lvbihzdGF0ZSkpICYmXG4gICAgICBzdGF0ZS5lYXQoMHg3RCAvKiB9ICovKVxuICAgICkge1xuICAgICAgaWYgKG5lZ2F0ZSAmJiByZXN1bHQgPT09IENoYXJTZXRTdHJpbmcpIHsgc3RhdGUucmFpc2UoXCJJbnZhbGlkIHByb3BlcnR5IG5hbWVcIik7IH1cbiAgICAgIHJldHVybiByZXN1bHRcbiAgICB9XG4gICAgc3RhdGUucmFpc2UoXCJJbnZhbGlkIHByb3BlcnR5IG5hbWVcIik7XG4gIH1cblxuICByZXR1cm4gQ2hhclNldE5vbmVcbn07XG5cbmZ1bmN0aW9uIGlzQ2hhcmFjdGVyQ2xhc3NFc2NhcGUoY2gpIHtcbiAgcmV0dXJuIChcbiAgICBjaCA9PT0gMHg2NCAvKiBkICovIHx8XG4gICAgY2ggPT09IDB4NDQgLyogRCAqLyB8fFxuICAgIGNoID09PSAweDczIC8qIHMgKi8gfHxcbiAgICBjaCA9PT0gMHg1MyAvKiBTICovIHx8XG4gICAgY2ggPT09IDB4NzcgLyogdyAqLyB8fFxuICAgIGNoID09PSAweDU3IC8qIFcgKi9cbiAgKVxufVxuXG4vLyBVbmljb2RlUHJvcGVydHlWYWx1ZUV4cHJlc3Npb24gOjpcbi8vICAgVW5pY29kZVByb3BlcnR5TmFtZSBgPWAgVW5pY29kZVByb3BlcnR5VmFsdWVcbi8vICAgTG9uZVVuaWNvZGVQcm9wZXJ0eU5hbWVPclZhbHVlXG5wcCQxLnJlZ2V4cF9lYXRVbmljb2RlUHJvcGVydHlWYWx1ZUV4cHJlc3Npb24gPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgc3RhcnQgPSBzdGF0ZS5wb3M7XG5cbiAgLy8gVW5pY29kZVByb3BlcnR5TmFtZSBgPWAgVW5pY29kZVByb3BlcnR5VmFsdWVcbiAgaWYgKHRoaXMucmVnZXhwX2VhdFVuaWNvZGVQcm9wZXJ0eU5hbWUoc3RhdGUpICYmIHN0YXRlLmVhdCgweDNEIC8qID0gKi8pKSB7XG4gICAgdmFyIG5hbWUgPSBzdGF0ZS5sYXN0U3RyaW5nVmFsdWU7XG4gICAgaWYgKHRoaXMucmVnZXhwX2VhdFVuaWNvZGVQcm9wZXJ0eVZhbHVlKHN0YXRlKSkge1xuICAgICAgdmFyIHZhbHVlID0gc3RhdGUubGFzdFN0cmluZ1ZhbHVlO1xuICAgICAgdGhpcy5yZWdleHBfdmFsaWRhdGVVbmljb2RlUHJvcGVydHlOYW1lQW5kVmFsdWUoc3RhdGUsIG5hbWUsIHZhbHVlKTtcbiAgICAgIHJldHVybiBDaGFyU2V0T2tcbiAgICB9XG4gIH1cbiAgc3RhdGUucG9zID0gc3RhcnQ7XG5cbiAgLy8gTG9uZVVuaWNvZGVQcm9wZXJ0eU5hbWVPclZhbHVlXG4gIGlmICh0aGlzLnJlZ2V4cF9lYXRMb25lVW5pY29kZVByb3BlcnR5TmFtZU9yVmFsdWUoc3RhdGUpKSB7XG4gICAgdmFyIG5hbWVPclZhbHVlID0gc3RhdGUubGFzdFN0cmluZ1ZhbHVlO1xuICAgIHJldHVybiB0aGlzLnJlZ2V4cF92YWxpZGF0ZVVuaWNvZGVQcm9wZXJ0eU5hbWVPclZhbHVlKHN0YXRlLCBuYW1lT3JWYWx1ZSlcbiAgfVxuICByZXR1cm4gQ2hhclNldE5vbmVcbn07XG5cbnBwJDEucmVnZXhwX3ZhbGlkYXRlVW5pY29kZVByb3BlcnR5TmFtZUFuZFZhbHVlID0gZnVuY3Rpb24oc3RhdGUsIG5hbWUsIHZhbHVlKSB7XG4gIGlmICghaGFzT3duKHN0YXRlLnVuaWNvZGVQcm9wZXJ0aWVzLm5vbkJpbmFyeSwgbmFtZSkpXG4gICAgeyBzdGF0ZS5yYWlzZShcIkludmFsaWQgcHJvcGVydHkgbmFtZVwiKTsgfVxuICBpZiAoIXN0YXRlLnVuaWNvZGVQcm9wZXJ0aWVzLm5vbkJpbmFyeVtuYW1lXS50ZXN0KHZhbHVlKSlcbiAgICB7IHN0YXRlLnJhaXNlKFwiSW52YWxpZCBwcm9wZXJ0eSB2YWx1ZVwiKTsgfVxufTtcblxucHAkMS5yZWdleHBfdmFsaWRhdGVVbmljb2RlUHJvcGVydHlOYW1lT3JWYWx1ZSA9IGZ1bmN0aW9uKHN0YXRlLCBuYW1lT3JWYWx1ZSkge1xuICBpZiAoc3RhdGUudW5pY29kZVByb3BlcnRpZXMuYmluYXJ5LnRlc3QobmFtZU9yVmFsdWUpKSB7IHJldHVybiBDaGFyU2V0T2sgfVxuICBpZiAoc3RhdGUuc3dpdGNoViAmJiBzdGF0ZS51bmljb2RlUHJvcGVydGllcy5iaW5hcnlPZlN0cmluZ3MudGVzdChuYW1lT3JWYWx1ZSkpIHsgcmV0dXJuIENoYXJTZXRTdHJpbmcgfVxuICBzdGF0ZS5yYWlzZShcIkludmFsaWQgcHJvcGVydHkgbmFtZVwiKTtcbn07XG5cbi8vIFVuaWNvZGVQcm9wZXJ0eU5hbWUgOjpcbi8vICAgVW5pY29kZVByb3BlcnR5TmFtZUNoYXJhY3RlcnNcbnBwJDEucmVnZXhwX2VhdFVuaWNvZGVQcm9wZXJ0eU5hbWUgPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgY2ggPSAwO1xuICBzdGF0ZS5sYXN0U3RyaW5nVmFsdWUgPSBcIlwiO1xuICB3aGlsZSAoaXNVbmljb2RlUHJvcGVydHlOYW1lQ2hhcmFjdGVyKGNoID0gc3RhdGUuY3VycmVudCgpKSkge1xuICAgIHN0YXRlLmxhc3RTdHJpbmdWYWx1ZSArPSBjb2RlUG9pbnRUb1N0cmluZyhjaCk7XG4gICAgc3RhdGUuYWR2YW5jZSgpO1xuICB9XG4gIHJldHVybiBzdGF0ZS5sYXN0U3RyaW5nVmFsdWUgIT09IFwiXCJcbn07XG5cbmZ1bmN0aW9uIGlzVW5pY29kZVByb3BlcnR5TmFtZUNoYXJhY3RlcihjaCkge1xuICByZXR1cm4gaXNDb250cm9sTGV0dGVyKGNoKSB8fCBjaCA9PT0gMHg1RiAvKiBfICovXG59XG5cbi8vIFVuaWNvZGVQcm9wZXJ0eVZhbHVlIDo6XG4vLyAgIFVuaWNvZGVQcm9wZXJ0eVZhbHVlQ2hhcmFjdGVyc1xucHAkMS5yZWdleHBfZWF0VW5pY29kZVByb3BlcnR5VmFsdWUgPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgY2ggPSAwO1xuICBzdGF0ZS5sYXN0U3RyaW5nVmFsdWUgPSBcIlwiO1xuICB3aGlsZSAoaXNVbmljb2RlUHJvcGVydHlWYWx1ZUNoYXJhY3RlcihjaCA9IHN0YXRlLmN1cnJlbnQoKSkpIHtcbiAgICBzdGF0ZS5sYXN0U3RyaW5nVmFsdWUgKz0gY29kZVBvaW50VG9TdHJpbmcoY2gpO1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgfVxuICByZXR1cm4gc3RhdGUubGFzdFN0cmluZ1ZhbHVlICE9PSBcIlwiXG59O1xuZnVuY3Rpb24gaXNVbmljb2RlUHJvcGVydHlWYWx1ZUNoYXJhY3RlcihjaCkge1xuICByZXR1cm4gaXNVbmljb2RlUHJvcGVydHlOYW1lQ2hhcmFjdGVyKGNoKSB8fCBpc0RlY2ltYWxEaWdpdChjaClcbn1cblxuLy8gTG9uZVVuaWNvZGVQcm9wZXJ0eU5hbWVPclZhbHVlIDo6XG4vLyAgIFVuaWNvZGVQcm9wZXJ0eVZhbHVlQ2hhcmFjdGVyc1xucHAkMS5yZWdleHBfZWF0TG9uZVVuaWNvZGVQcm9wZXJ0eU5hbWVPclZhbHVlID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgcmV0dXJuIHRoaXMucmVnZXhwX2VhdFVuaWNvZGVQcm9wZXJ0eVZhbHVlKHN0YXRlKVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtQ2hhcmFjdGVyQ2xhc3NcbnBwJDEucmVnZXhwX2VhdENoYXJhY3RlckNsYXNzID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgaWYgKHN0YXRlLmVhdCgweDVCIC8qIFsgKi8pKSB7XG4gICAgdmFyIG5lZ2F0ZSA9IHN0YXRlLmVhdCgweDVFIC8qIF4gKi8pO1xuICAgIHZhciByZXN1bHQgPSB0aGlzLnJlZ2V4cF9jbGFzc0NvbnRlbnRzKHN0YXRlKTtcbiAgICBpZiAoIXN0YXRlLmVhdCgweDVEIC8qIF0gKi8pKVxuICAgICAgeyBzdGF0ZS5yYWlzZShcIlVudGVybWluYXRlZCBjaGFyYWN0ZXIgY2xhc3NcIik7IH1cbiAgICBpZiAobmVnYXRlICYmIHJlc3VsdCA9PT0gQ2hhclNldFN0cmluZylcbiAgICAgIHsgc3RhdGUucmFpc2UoXCJOZWdhdGVkIGNoYXJhY3RlciBjbGFzcyBtYXkgY29udGFpbiBzdHJpbmdzXCIpOyB9XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn07XG5cbi8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNwcm9kLUNsYXNzQ29udGVudHNcbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLUNsYXNzUmFuZ2VzXG5wcCQxLnJlZ2V4cF9jbGFzc0NvbnRlbnRzID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgaWYgKHN0YXRlLmN1cnJlbnQoKSA9PT0gMHg1RCAvKiBdICovKSB7IHJldHVybiBDaGFyU2V0T2sgfVxuICBpZiAoc3RhdGUuc3dpdGNoVikgeyByZXR1cm4gdGhpcy5yZWdleHBfY2xhc3NTZXRFeHByZXNzaW9uKHN0YXRlKSB9XG4gIHRoaXMucmVnZXhwX25vbkVtcHR5Q2xhc3NSYW5nZXMoc3RhdGUpO1xuICByZXR1cm4gQ2hhclNldE9rXG59O1xuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1Ob25lbXB0eUNsYXNzUmFuZ2VzXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1Ob25lbXB0eUNsYXNzUmFuZ2VzTm9EYXNoXG5wcCQxLnJlZ2V4cF9ub25FbXB0eUNsYXNzUmFuZ2VzID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgd2hpbGUgKHRoaXMucmVnZXhwX2VhdENsYXNzQXRvbShzdGF0ZSkpIHtcbiAgICB2YXIgbGVmdCA9IHN0YXRlLmxhc3RJbnRWYWx1ZTtcbiAgICBpZiAoc3RhdGUuZWF0KDB4MkQgLyogLSAqLykgJiYgdGhpcy5yZWdleHBfZWF0Q2xhc3NBdG9tKHN0YXRlKSkge1xuICAgICAgdmFyIHJpZ2h0ID0gc3RhdGUubGFzdEludFZhbHVlO1xuICAgICAgaWYgKHN0YXRlLnN3aXRjaFUgJiYgKGxlZnQgPT09IC0xIHx8IHJpZ2h0ID09PSAtMSkpIHtcbiAgICAgICAgc3RhdGUucmFpc2UoXCJJbnZhbGlkIGNoYXJhY3RlciBjbGFzc1wiKTtcbiAgICAgIH1cbiAgICAgIGlmIChsZWZ0ICE9PSAtMSAmJiByaWdodCAhPT0gLTEgJiYgbGVmdCA+IHJpZ2h0KSB7XG4gICAgICAgIHN0YXRlLnJhaXNlKFwiUmFuZ2Ugb3V0IG9mIG9yZGVyIGluIGNoYXJhY3RlciBjbGFzc1wiKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLUNsYXNzQXRvbVxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtQ2xhc3NBdG9tTm9EYXNoXG5wcCQxLnJlZ2V4cF9lYXRDbGFzc0F0b20gPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgc3RhcnQgPSBzdGF0ZS5wb3M7XG5cbiAgaWYgKHN0YXRlLmVhdCgweDVDIC8qIFxcICovKSkge1xuICAgIGlmICh0aGlzLnJlZ2V4cF9lYXRDbGFzc0VzY2FwZShzdGF0ZSkpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICAgIGlmIChzdGF0ZS5zd2l0Y2hVKSB7XG4gICAgICAvLyBNYWtlIHRoZSBzYW1lIG1lc3NhZ2UgYXMgVjguXG4gICAgICB2YXIgY2gkMSA9IHN0YXRlLmN1cnJlbnQoKTtcbiAgICAgIGlmIChjaCQxID09PSAweDYzIC8qIGMgKi8gfHwgaXNPY3RhbERpZ2l0KGNoJDEpKSB7XG4gICAgICAgIHN0YXRlLnJhaXNlKFwiSW52YWxpZCBjbGFzcyBlc2NhcGVcIik7XG4gICAgICB9XG4gICAgICBzdGF0ZS5yYWlzZShcIkludmFsaWQgZXNjYXBlXCIpO1xuICAgIH1cbiAgICBzdGF0ZS5wb3MgPSBzdGFydDtcbiAgfVxuXG4gIHZhciBjaCA9IHN0YXRlLmN1cnJlbnQoKTtcbiAgaWYgKGNoICE9PSAweDVEIC8qIF0gKi8pIHtcbiAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSBjaDtcbiAgICBzdGF0ZS5hZHZhbmNlKCk7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIHJldHVybiBmYWxzZVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtYW5uZXhCLUNsYXNzRXNjYXBlXG5wcCQxLnJlZ2V4cF9lYXRDbGFzc0VzY2FwZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcblxuICBpZiAoc3RhdGUuZWF0KDB4NjIgLyogYiAqLykpIHtcbiAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSAweDA4OyAvKiA8QlM+ICovXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIGlmIChzdGF0ZS5zd2l0Y2hVICYmIHN0YXRlLmVhdCgweDJEIC8qIC0gKi8pKSB7XG4gICAgc3RhdGUubGFzdEludFZhbHVlID0gMHgyRDsgLyogLSAqL1xuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBpZiAoIXN0YXRlLnN3aXRjaFUgJiYgc3RhdGUuZWF0KDB4NjMgLyogYyAqLykpIHtcbiAgICBpZiAodGhpcy5yZWdleHBfZWF0Q2xhc3NDb250cm9sTGV0dGVyKHN0YXRlKSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgc3RhdGUucG9zID0gc3RhcnQ7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIHRoaXMucmVnZXhwX2VhdENoYXJhY3RlckNsYXNzRXNjYXBlKHN0YXRlKSB8fFxuICAgIHRoaXMucmVnZXhwX2VhdENoYXJhY3RlckVzY2FwZShzdGF0ZSlcbiAgKVxufTtcblxuLy8gaHR0cHM6Ly90YzM5LmVzL2VjbWEyNjIvI3Byb2QtQ2xhc3NTZXRFeHByZXNzaW9uXG4vLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jcHJvZC1DbGFzc1VuaW9uXG4vLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jcHJvZC1DbGFzc0ludGVyc2VjdGlvblxuLy8gaHR0cHM6Ly90YzM5LmVzL2VjbWEyNjIvI3Byb2QtQ2xhc3NTdWJ0cmFjdGlvblxucHAkMS5yZWdleHBfY2xhc3NTZXRFeHByZXNzaW9uID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIHJlc3VsdCA9IENoYXJTZXRPaywgc3ViUmVzdWx0O1xuICBpZiAodGhpcy5yZWdleHBfZWF0Q2xhc3NTZXRSYW5nZShzdGF0ZSkpIDsgZWxzZSBpZiAoc3ViUmVzdWx0ID0gdGhpcy5yZWdleHBfZWF0Q2xhc3NTZXRPcGVyYW5kKHN0YXRlKSkge1xuICAgIGlmIChzdWJSZXN1bHQgPT09IENoYXJTZXRTdHJpbmcpIHsgcmVzdWx0ID0gQ2hhclNldFN0cmluZzsgfVxuICAgIC8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNwcm9kLUNsYXNzSW50ZXJzZWN0aW9uXG4gICAgdmFyIHN0YXJ0ID0gc3RhdGUucG9zO1xuICAgIHdoaWxlIChzdGF0ZS5lYXRDaGFycyhbMHgyNiwgMHgyNl0gLyogJiYgKi8pKSB7XG4gICAgICBpZiAoXG4gICAgICAgIHN0YXRlLmN1cnJlbnQoKSAhPT0gMHgyNiAvKiAmICovICYmXG4gICAgICAgIChzdWJSZXN1bHQgPSB0aGlzLnJlZ2V4cF9lYXRDbGFzc1NldE9wZXJhbmQoc3RhdGUpKVxuICAgICAgKSB7XG4gICAgICAgIGlmIChzdWJSZXN1bHQgIT09IENoYXJTZXRTdHJpbmcpIHsgcmVzdWx0ID0gQ2hhclNldE9rOyB9XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgICBzdGF0ZS5yYWlzZShcIkludmFsaWQgY2hhcmFjdGVyIGluIGNoYXJhY3RlciBjbGFzc1wiKTtcbiAgICB9XG4gICAgaWYgKHN0YXJ0ICE9PSBzdGF0ZS5wb3MpIHsgcmV0dXJuIHJlc3VsdCB9XG4gICAgLy8gaHR0cHM6Ly90YzM5LmVzL2VjbWEyNjIvI3Byb2QtQ2xhc3NTdWJ0cmFjdGlvblxuICAgIHdoaWxlIChzdGF0ZS5lYXRDaGFycyhbMHgyRCwgMHgyRF0gLyogLS0gKi8pKSB7XG4gICAgICBpZiAodGhpcy5yZWdleHBfZWF0Q2xhc3NTZXRPcGVyYW5kKHN0YXRlKSkgeyBjb250aW51ZSB9XG4gICAgICBzdGF0ZS5yYWlzZShcIkludmFsaWQgY2hhcmFjdGVyIGluIGNoYXJhY3RlciBjbGFzc1wiKTtcbiAgICB9XG4gICAgaWYgKHN0YXJ0ICE9PSBzdGF0ZS5wb3MpIHsgcmV0dXJuIHJlc3VsdCB9XG4gIH0gZWxzZSB7XG4gICAgc3RhdGUucmFpc2UoXCJJbnZhbGlkIGNoYXJhY3RlciBpbiBjaGFyYWN0ZXIgY2xhc3NcIik7XG4gIH1cbiAgLy8gaHR0cHM6Ly90YzM5LmVzL2VjbWEyNjIvI3Byb2QtQ2xhc3NVbmlvblxuICBmb3IgKDs7KSB7XG4gICAgaWYgKHRoaXMucmVnZXhwX2VhdENsYXNzU2V0UmFuZ2Uoc3RhdGUpKSB7IGNvbnRpbnVlIH1cbiAgICBzdWJSZXN1bHQgPSB0aGlzLnJlZ2V4cF9lYXRDbGFzc1NldE9wZXJhbmQoc3RhdGUpO1xuICAgIGlmICghc3ViUmVzdWx0KSB7IHJldHVybiByZXN1bHQgfVxuICAgIGlmIChzdWJSZXN1bHQgPT09IENoYXJTZXRTdHJpbmcpIHsgcmVzdWx0ID0gQ2hhclNldFN0cmluZzsgfVxuICB9XG59O1xuXG4vLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jcHJvZC1DbGFzc1NldFJhbmdlXG5wcCQxLnJlZ2V4cF9lYXRDbGFzc1NldFJhbmdlID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIHN0YXJ0ID0gc3RhdGUucG9zO1xuICBpZiAodGhpcy5yZWdleHBfZWF0Q2xhc3NTZXRDaGFyYWN0ZXIoc3RhdGUpKSB7XG4gICAgdmFyIGxlZnQgPSBzdGF0ZS5sYXN0SW50VmFsdWU7XG4gICAgaWYgKHN0YXRlLmVhdCgweDJEIC8qIC0gKi8pICYmIHRoaXMucmVnZXhwX2VhdENsYXNzU2V0Q2hhcmFjdGVyKHN0YXRlKSkge1xuICAgICAgdmFyIHJpZ2h0ID0gc3RhdGUubGFzdEludFZhbHVlO1xuICAgICAgaWYgKGxlZnQgIT09IC0xICYmIHJpZ2h0ICE9PSAtMSAmJiBsZWZ0ID4gcmlnaHQpIHtcbiAgICAgICAgc3RhdGUucmFpc2UoXCJSYW5nZSBvdXQgb2Ygb3JkZXIgaW4gY2hhcmFjdGVyIGNsYXNzXCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgc3RhdGUucG9zID0gc3RhcnQ7XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG4vLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jcHJvZC1DbGFzc1NldE9wZXJhbmRcbnBwJDEucmVnZXhwX2VhdENsYXNzU2V0T3BlcmFuZCA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIGlmICh0aGlzLnJlZ2V4cF9lYXRDbGFzc1NldENoYXJhY3RlcihzdGF0ZSkpIHsgcmV0dXJuIENoYXJTZXRPayB9XG4gIHJldHVybiB0aGlzLnJlZ2V4cF9lYXRDbGFzc1N0cmluZ0Rpc2p1bmN0aW9uKHN0YXRlKSB8fCB0aGlzLnJlZ2V4cF9lYXROZXN0ZWRDbGFzcyhzdGF0ZSlcbn07XG5cbi8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNwcm9kLU5lc3RlZENsYXNzXG5wcCQxLnJlZ2V4cF9lYXROZXN0ZWRDbGFzcyA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcbiAgaWYgKHN0YXRlLmVhdCgweDVCIC8qIFsgKi8pKSB7XG4gICAgdmFyIG5lZ2F0ZSA9IHN0YXRlLmVhdCgweDVFIC8qIF4gKi8pO1xuICAgIHZhciByZXN1bHQgPSB0aGlzLnJlZ2V4cF9jbGFzc0NvbnRlbnRzKHN0YXRlKTtcbiAgICBpZiAoc3RhdGUuZWF0KDB4NUQgLyogXSAqLykpIHtcbiAgICAgIGlmIChuZWdhdGUgJiYgcmVzdWx0ID09PSBDaGFyU2V0U3RyaW5nKSB7XG4gICAgICAgIHN0YXRlLnJhaXNlKFwiTmVnYXRlZCBjaGFyYWN0ZXIgY2xhc3MgbWF5IGNvbnRhaW4gc3RyaW5nc1wiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHRcbiAgICB9XG4gICAgc3RhdGUucG9zID0gc3RhcnQ7XG4gIH1cbiAgaWYgKHN0YXRlLmVhdCgweDVDIC8qIFxcICovKSkge1xuICAgIHZhciByZXN1bHQkMSA9IHRoaXMucmVnZXhwX2VhdENoYXJhY3RlckNsYXNzRXNjYXBlKHN0YXRlKTtcbiAgICBpZiAocmVzdWx0JDEpIHtcbiAgICAgIHJldHVybiByZXN1bHQkMVxuICAgIH1cbiAgICBzdGF0ZS5wb3MgPSBzdGFydDtcbiAgfVxuICByZXR1cm4gbnVsbFxufTtcblxuLy8gaHR0cHM6Ly90YzM5LmVzL2VjbWEyNjIvI3Byb2QtQ2xhc3NTdHJpbmdEaXNqdW5jdGlvblxucHAkMS5yZWdleHBfZWF0Q2xhc3NTdHJpbmdEaXNqdW5jdGlvbiA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcbiAgaWYgKHN0YXRlLmVhdENoYXJzKFsweDVDLCAweDcxXSAvKiBcXHEgKi8pKSB7XG4gICAgaWYgKHN0YXRlLmVhdCgweDdCIC8qIHsgKi8pKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gdGhpcy5yZWdleHBfY2xhc3NTdHJpbmdEaXNqdW5jdGlvbkNvbnRlbnRzKHN0YXRlKTtcbiAgICAgIGlmIChzdGF0ZS5lYXQoMHg3RCAvKiB9ICovKSkge1xuICAgICAgICByZXR1cm4gcmVzdWx0XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE1ha2UgdGhlIHNhbWUgbWVzc2FnZSBhcyBWOC5cbiAgICAgIHN0YXRlLnJhaXNlKFwiSW52YWxpZCBlc2NhcGVcIik7XG4gICAgfVxuICAgIHN0YXRlLnBvcyA9IHN0YXJ0O1xuICB9XG4gIHJldHVybiBudWxsXG59O1xuXG4vLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jcHJvZC1DbGFzc1N0cmluZ0Rpc2p1bmN0aW9uQ29udGVudHNcbnBwJDEucmVnZXhwX2NsYXNzU3RyaW5nRGlzanVuY3Rpb25Db250ZW50cyA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciByZXN1bHQgPSB0aGlzLnJlZ2V4cF9jbGFzc1N0cmluZyhzdGF0ZSk7XG4gIHdoaWxlIChzdGF0ZS5lYXQoMHg3QyAvKiB8ICovKSkge1xuICAgIGlmICh0aGlzLnJlZ2V4cF9jbGFzc1N0cmluZyhzdGF0ZSkgPT09IENoYXJTZXRTdHJpbmcpIHsgcmVzdWx0ID0gQ2hhclNldFN0cmluZzsgfVxuICB9XG4gIHJldHVybiByZXN1bHRcbn07XG5cbi8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNwcm9kLUNsYXNzU3RyaW5nXG4vLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jcHJvZC1Ob25FbXB0eUNsYXNzU3RyaW5nXG5wcCQxLnJlZ2V4cF9jbGFzc1N0cmluZyA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBjb3VudCA9IDA7XG4gIHdoaWxlICh0aGlzLnJlZ2V4cF9lYXRDbGFzc1NldENoYXJhY3RlcihzdGF0ZSkpIHsgY291bnQrKzsgfVxuICByZXR1cm4gY291bnQgPT09IDEgPyBDaGFyU2V0T2sgOiBDaGFyU2V0U3RyaW5nXG59O1xuXG4vLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jcHJvZC1DbGFzc1NldENoYXJhY3RlclxucHAkMS5yZWdleHBfZWF0Q2xhc3NTZXRDaGFyYWN0ZXIgPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgc3RhcnQgPSBzdGF0ZS5wb3M7XG4gIGlmIChzdGF0ZS5lYXQoMHg1QyAvKiBcXCAqLykpIHtcbiAgICBpZiAoXG4gICAgICB0aGlzLnJlZ2V4cF9lYXRDaGFyYWN0ZXJFc2NhcGUoc3RhdGUpIHx8XG4gICAgICB0aGlzLnJlZ2V4cF9lYXRDbGFzc1NldFJlc2VydmVkUHVuY3R1YXRvcihzdGF0ZSlcbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICAgIGlmIChzdGF0ZS5lYXQoMHg2MiAvKiBiICovKSkge1xuICAgICAgc3RhdGUubGFzdEludFZhbHVlID0gMHgwODsgLyogPEJTPiAqL1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgc3RhdGUucG9zID0gc3RhcnQ7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgdmFyIGNoID0gc3RhdGUuY3VycmVudCgpO1xuICBpZiAoY2ggPCAwIHx8IGNoID09PSBzdGF0ZS5sb29rYWhlYWQoKSAmJiBpc0NsYXNzU2V0UmVzZXJ2ZWREb3VibGVQdW5jdHVhdG9yQ2hhcmFjdGVyKGNoKSkgeyByZXR1cm4gZmFsc2UgfVxuICBpZiAoaXNDbGFzc1NldFN5bnRheENoYXJhY3RlcihjaCkpIHsgcmV0dXJuIGZhbHNlIH1cbiAgc3RhdGUuYWR2YW5jZSgpO1xuICBzdGF0ZS5sYXN0SW50VmFsdWUgPSBjaDtcbiAgcmV0dXJuIHRydWVcbn07XG5cbi8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNwcm9kLUNsYXNzU2V0UmVzZXJ2ZWREb3VibGVQdW5jdHVhdG9yXG5mdW5jdGlvbiBpc0NsYXNzU2V0UmVzZXJ2ZWREb3VibGVQdW5jdHVhdG9yQ2hhcmFjdGVyKGNoKSB7XG4gIHJldHVybiAoXG4gICAgY2ggPT09IDB4MjEgLyogISAqLyB8fFxuICAgIGNoID49IDB4MjMgLyogIyAqLyAmJiBjaCA8PSAweDI2IC8qICYgKi8gfHxcbiAgICBjaCA+PSAweDJBIC8qICogKi8gJiYgY2ggPD0gMHgyQyAvKiAsICovIHx8XG4gICAgY2ggPT09IDB4MkUgLyogLiAqLyB8fFxuICAgIGNoID49IDB4M0EgLyogOiAqLyAmJiBjaCA8PSAweDQwIC8qIEAgKi8gfHxcbiAgICBjaCA9PT0gMHg1RSAvKiBeICovIHx8XG4gICAgY2ggPT09IDB4NjAgLyogYCAqLyB8fFxuICAgIGNoID09PSAweDdFIC8qIH4gKi9cbiAgKVxufVxuXG4vLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jcHJvZC1DbGFzc1NldFN5bnRheENoYXJhY3RlclxuZnVuY3Rpb24gaXNDbGFzc1NldFN5bnRheENoYXJhY3RlcihjaCkge1xuICByZXR1cm4gKFxuICAgIGNoID09PSAweDI4IC8qICggKi8gfHxcbiAgICBjaCA9PT0gMHgyOSAvKiApICovIHx8XG4gICAgY2ggPT09IDB4MkQgLyogLSAqLyB8fFxuICAgIGNoID09PSAweDJGIC8qIC8gKi8gfHxcbiAgICBjaCA+PSAweDVCIC8qIFsgKi8gJiYgY2ggPD0gMHg1RCAvKiBdICovIHx8XG4gICAgY2ggPj0gMHg3QiAvKiB7ICovICYmIGNoIDw9IDB4N0QgLyogfSAqL1xuICApXG59XG5cbi8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNwcm9kLUNsYXNzU2V0UmVzZXJ2ZWRQdW5jdHVhdG9yXG5wcCQxLnJlZ2V4cF9lYXRDbGFzc1NldFJlc2VydmVkUHVuY3R1YXRvciA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBjaCA9IHN0YXRlLmN1cnJlbnQoKTtcbiAgaWYgKGlzQ2xhc3NTZXRSZXNlcnZlZFB1bmN0dWF0b3IoY2gpKSB7XG4gICAgc3RhdGUubGFzdEludFZhbHVlID0gY2g7XG4gICAgc3RhdGUuYWR2YW5jZSgpO1xuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG4vLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jcHJvZC1DbGFzc1NldFJlc2VydmVkUHVuY3R1YXRvclxuZnVuY3Rpb24gaXNDbGFzc1NldFJlc2VydmVkUHVuY3R1YXRvcihjaCkge1xuICByZXR1cm4gKFxuICAgIGNoID09PSAweDIxIC8qICEgKi8gfHxcbiAgICBjaCA9PT0gMHgyMyAvKiAjICovIHx8XG4gICAgY2ggPT09IDB4MjUgLyogJSAqLyB8fFxuICAgIGNoID09PSAweDI2IC8qICYgKi8gfHxcbiAgICBjaCA9PT0gMHgyQyAvKiAsICovIHx8XG4gICAgY2ggPT09IDB4MkQgLyogLSAqLyB8fFxuICAgIGNoID49IDB4M0EgLyogOiAqLyAmJiBjaCA8PSAweDNFIC8qID4gKi8gfHxcbiAgICBjaCA9PT0gMHg0MCAvKiBAICovIHx8XG4gICAgY2ggPT09IDB4NjAgLyogYCAqLyB8fFxuICAgIGNoID09PSAweDdFIC8qIH4gKi9cbiAgKVxufVxuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1hbm5leEItQ2xhc3NDb250cm9sTGV0dGVyXG5wcCQxLnJlZ2V4cF9lYXRDbGFzc0NvbnRyb2xMZXR0ZXIgPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgY2ggPSBzdGF0ZS5jdXJyZW50KCk7XG4gIGlmIChpc0RlY2ltYWxEaWdpdChjaCkgfHwgY2ggPT09IDB4NUYgLyogXyAqLykge1xuICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IGNoICUgMHgyMDtcbiAgICBzdGF0ZS5hZHZhbmNlKCk7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn07XG5cbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLUhleEVzY2FwZVNlcXVlbmNlXG5wcCQxLnJlZ2V4cF9lYXRIZXhFc2NhcGVTZXF1ZW5jZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcbiAgaWYgKHN0YXRlLmVhdCgweDc4IC8qIHggKi8pKSB7XG4gICAgaWYgKHRoaXMucmVnZXhwX2VhdEZpeGVkSGV4RGlnaXRzKHN0YXRlLCAyKSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgaWYgKHN0YXRlLnN3aXRjaFUpIHtcbiAgICAgIHN0YXRlLnJhaXNlKFwiSW52YWxpZCBlc2NhcGVcIik7XG4gICAgfVxuICAgIHN0YXRlLnBvcyA9IHN0YXJ0O1xuICB9XG4gIHJldHVybiBmYWxzZVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtRGVjaW1hbERpZ2l0c1xucHAkMS5yZWdleHBfZWF0RGVjaW1hbERpZ2l0cyA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcbiAgdmFyIGNoID0gMDtcbiAgc3RhdGUubGFzdEludFZhbHVlID0gMDtcbiAgd2hpbGUgKGlzRGVjaW1hbERpZ2l0KGNoID0gc3RhdGUuY3VycmVudCgpKSkge1xuICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IDEwICogc3RhdGUubGFzdEludFZhbHVlICsgKGNoIC0gMHgzMCAvKiAwICovKTtcbiAgICBzdGF0ZS5hZHZhbmNlKCk7XG4gIH1cbiAgcmV0dXJuIHN0YXRlLnBvcyAhPT0gc3RhcnRcbn07XG5mdW5jdGlvbiBpc0RlY2ltYWxEaWdpdChjaCkge1xuICByZXR1cm4gY2ggPj0gMHgzMCAvKiAwICovICYmIGNoIDw9IDB4MzkgLyogOSAqL1xufVxuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1IZXhEaWdpdHNcbnBwJDEucmVnZXhwX2VhdEhleERpZ2l0cyA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcbiAgdmFyIGNoID0gMDtcbiAgc3RhdGUubGFzdEludFZhbHVlID0gMDtcbiAgd2hpbGUgKGlzSGV4RGlnaXQoY2ggPSBzdGF0ZS5jdXJyZW50KCkpKSB7XG4gICAgc3RhdGUubGFzdEludFZhbHVlID0gMTYgKiBzdGF0ZS5sYXN0SW50VmFsdWUgKyBoZXhUb0ludChjaCk7XG4gICAgc3RhdGUuYWR2YW5jZSgpO1xuICB9XG4gIHJldHVybiBzdGF0ZS5wb3MgIT09IHN0YXJ0XG59O1xuZnVuY3Rpb24gaXNIZXhEaWdpdChjaCkge1xuICByZXR1cm4gKFxuICAgIChjaCA+PSAweDMwIC8qIDAgKi8gJiYgY2ggPD0gMHgzOSAvKiA5ICovKSB8fFxuICAgIChjaCA+PSAweDQxIC8qIEEgKi8gJiYgY2ggPD0gMHg0NiAvKiBGICovKSB8fFxuICAgIChjaCA+PSAweDYxIC8qIGEgKi8gJiYgY2ggPD0gMHg2NiAvKiBmICovKVxuICApXG59XG5mdW5jdGlvbiBoZXhUb0ludChjaCkge1xuICBpZiAoY2ggPj0gMHg0MSAvKiBBICovICYmIGNoIDw9IDB4NDYgLyogRiAqLykge1xuICAgIHJldHVybiAxMCArIChjaCAtIDB4NDEgLyogQSAqLylcbiAgfVxuICBpZiAoY2ggPj0gMHg2MSAvKiBhICovICYmIGNoIDw9IDB4NjYgLyogZiAqLykge1xuICAgIHJldHVybiAxMCArIChjaCAtIDB4NjEgLyogYSAqLylcbiAgfVxuICByZXR1cm4gY2ggLSAweDMwIC8qIDAgKi9cbn1cblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtYW5uZXhCLUxlZ2FjeU9jdGFsRXNjYXBlU2VxdWVuY2Vcbi8vIEFsbG93cyBvbmx5IDAtMzc3KG9jdGFsKSBpLmUuIDAtMjU1KGRlY2ltYWwpLlxucHAkMS5yZWdleHBfZWF0TGVnYWN5T2N0YWxFc2NhcGVTZXF1ZW5jZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIGlmICh0aGlzLnJlZ2V4cF9lYXRPY3RhbERpZ2l0KHN0YXRlKSkge1xuICAgIHZhciBuMSA9IHN0YXRlLmxhc3RJbnRWYWx1ZTtcbiAgICBpZiAodGhpcy5yZWdleHBfZWF0T2N0YWxEaWdpdChzdGF0ZSkpIHtcbiAgICAgIHZhciBuMiA9IHN0YXRlLmxhc3RJbnRWYWx1ZTtcbiAgICAgIGlmIChuMSA8PSAzICYmIHRoaXMucmVnZXhwX2VhdE9jdGFsRGlnaXQoc3RhdGUpKSB7XG4gICAgICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IG4xICogNjQgKyBuMiAqIDggKyBzdGF0ZS5sYXN0SW50VmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSBuMSAqIDggKyBuMjtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RhdGUubGFzdEludFZhbHVlID0gbjE7XG4gICAgfVxuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1PY3RhbERpZ2l0XG5wcCQxLnJlZ2V4cF9lYXRPY3RhbERpZ2l0ID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIGNoID0gc3RhdGUuY3VycmVudCgpO1xuICBpZiAoaXNPY3RhbERpZ2l0KGNoKSkge1xuICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IGNoIC0gMHgzMDsgLyogMCAqL1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IDA7XG4gIHJldHVybiBmYWxzZVxufTtcbmZ1bmN0aW9uIGlzT2N0YWxEaWdpdChjaCkge1xuICByZXR1cm4gY2ggPj0gMHgzMCAvKiAwICovICYmIGNoIDw9IDB4MzcgLyogNyAqL1xufVxuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1IZXg0RGlnaXRzXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1IZXhEaWdpdFxuLy8gQW5kIEhleERpZ2l0IEhleERpZ2l0IGluIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLUhleEVzY2FwZVNlcXVlbmNlXG5wcCQxLnJlZ2V4cF9lYXRGaXhlZEhleERpZ2l0cyA9IGZ1bmN0aW9uKHN0YXRlLCBsZW5ndGgpIHtcbiAgdmFyIHN0YXJ0ID0gc3RhdGUucG9zO1xuICBzdGF0ZS5sYXN0SW50VmFsdWUgPSAwO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGNoID0gc3RhdGUuY3VycmVudCgpO1xuICAgIGlmICghaXNIZXhEaWdpdChjaCkpIHtcbiAgICAgIHN0YXRlLnBvcyA9IHN0YXJ0O1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IDE2ICogc3RhdGUubGFzdEludFZhbHVlICsgaGV4VG9JbnQoY2gpO1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgfVxuICByZXR1cm4gdHJ1ZVxufTtcblxuLy8gT2JqZWN0IHR5cGUgdXNlZCB0byByZXByZXNlbnQgdG9rZW5zLiBOb3RlIHRoYXQgbm9ybWFsbHksIHRva2Vuc1xuLy8gc2ltcGx5IGV4aXN0IGFzIHByb3BlcnRpZXMgb24gdGhlIHBhcnNlciBvYmplY3QuIFRoaXMgaXMgb25seVxuLy8gdXNlZCBmb3IgdGhlIG9uVG9rZW4gY2FsbGJhY2sgYW5kIHRoZSBleHRlcm5hbCB0b2tlbml6ZXIuXG5cbnZhciBUb2tlbiA9IGZ1bmN0aW9uIFRva2VuKHApIHtcbiAgdGhpcy50eXBlID0gcC50eXBlO1xuICB0aGlzLnZhbHVlID0gcC52YWx1ZTtcbiAgdGhpcy5zdGFydCA9IHAuc3RhcnQ7XG4gIHRoaXMuZW5kID0gcC5lbmQ7XG4gIGlmIChwLm9wdGlvbnMubG9jYXRpb25zKVxuICAgIHsgdGhpcy5sb2MgPSBuZXcgU291cmNlTG9jYXRpb24ocCwgcC5zdGFydExvYywgcC5lbmRMb2MpOyB9XG4gIGlmIChwLm9wdGlvbnMucmFuZ2VzKVxuICAgIHsgdGhpcy5yYW5nZSA9IFtwLnN0YXJ0LCBwLmVuZF07IH1cbn07XG5cbi8vICMjIFRva2VuaXplclxuXG52YXIgcHAgPSBQYXJzZXIucHJvdG90eXBlO1xuXG4vLyBNb3ZlIHRvIHRoZSBuZXh0IHRva2VuXG5cbnBwLm5leHQgPSBmdW5jdGlvbihpZ25vcmVFc2NhcGVTZXF1ZW5jZUluS2V5d29yZCkge1xuICBpZiAoIWlnbm9yZUVzY2FwZVNlcXVlbmNlSW5LZXl3b3JkICYmIHRoaXMudHlwZS5rZXl3b3JkICYmIHRoaXMuY29udGFpbnNFc2MpXG4gICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUodGhpcy5zdGFydCwgXCJFc2NhcGUgc2VxdWVuY2UgaW4ga2V5d29yZCBcIiArIHRoaXMudHlwZS5rZXl3b3JkKTsgfVxuICBpZiAodGhpcy5vcHRpb25zLm9uVG9rZW4pXG4gICAgeyB0aGlzLm9wdGlvbnMub25Ub2tlbihuZXcgVG9rZW4odGhpcykpOyB9XG5cbiAgdGhpcy5sYXN0VG9rRW5kID0gdGhpcy5lbmQ7XG4gIHRoaXMubGFzdFRva1N0YXJ0ID0gdGhpcy5zdGFydDtcbiAgdGhpcy5sYXN0VG9rRW5kTG9jID0gdGhpcy5lbmRMb2M7XG4gIHRoaXMubGFzdFRva1N0YXJ0TG9jID0gdGhpcy5zdGFydExvYztcbiAgdGhpcy5uZXh0VG9rZW4oKTtcbn07XG5cbnBwLmdldFRva2VuID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMubmV4dCgpO1xuICByZXR1cm4gbmV3IFRva2VuKHRoaXMpXG59O1xuXG4vLyBJZiB3ZSdyZSBpbiBhbiBFUzYgZW52aXJvbm1lbnQsIG1ha2UgcGFyc2VycyBpdGVyYWJsZVxuaWYgKHR5cGVvZiBTeW1ib2wgIT09IFwidW5kZWZpbmVkXCIpXG4gIHsgcHBbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGlzJDEkMSA9IHRoaXM7XG5cbiAgICByZXR1cm4ge1xuICAgICAgbmV4dDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdG9rZW4gPSB0aGlzJDEkMS5nZXRUb2tlbigpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGRvbmU6IHRva2VuLnR5cGUgPT09IHR5cGVzJDEuZW9mLFxuICAgICAgICAgIHZhbHVlOiB0b2tlblxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9OyB9XG5cbi8vIFRvZ2dsZSBzdHJpY3QgbW9kZS4gUmUtcmVhZHMgdGhlIG5leHQgbnVtYmVyIG9yIHN0cmluZyB0byBwbGVhc2Vcbi8vIHBlZGFudGljIHRlc3RzIChgXCJ1c2Ugc3RyaWN0XCI7IDAxMDtgIHNob3VsZCBmYWlsKS5cblxuLy8gUmVhZCBhIHNpbmdsZSB0b2tlbiwgdXBkYXRpbmcgdGhlIHBhcnNlciBvYmplY3QncyB0b2tlbi1yZWxhdGVkXG4vLyBwcm9wZXJ0aWVzLlxuXG5wcC5uZXh0VG9rZW4gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGN1ckNvbnRleHQgPSB0aGlzLmN1ckNvbnRleHQoKTtcbiAgaWYgKCFjdXJDb250ZXh0IHx8ICFjdXJDb250ZXh0LnByZXNlcnZlU3BhY2UpIHsgdGhpcy5za2lwU3BhY2UoKTsgfVxuXG4gIHRoaXMuc3RhcnQgPSB0aGlzLnBvcztcbiAgaWYgKHRoaXMub3B0aW9ucy5sb2NhdGlvbnMpIHsgdGhpcy5zdGFydExvYyA9IHRoaXMuY3VyUG9zaXRpb24oKTsgfVxuICBpZiAodGhpcy5wb3MgPj0gdGhpcy5pbnB1dC5sZW5ndGgpIHsgcmV0dXJuIHRoaXMuZmluaXNoVG9rZW4odHlwZXMkMS5lb2YpIH1cblxuICBpZiAoY3VyQ29udGV4dC5vdmVycmlkZSkgeyByZXR1cm4gY3VyQ29udGV4dC5vdmVycmlkZSh0aGlzKSB9XG4gIGVsc2UgeyB0aGlzLnJlYWRUb2tlbih0aGlzLmZ1bGxDaGFyQ29kZUF0UG9zKCkpOyB9XG59O1xuXG5wcC5yZWFkVG9rZW4gPSBmdW5jdGlvbihjb2RlKSB7XG4gIC8vIElkZW50aWZpZXIgb3Iga2V5d29yZC4gJ1xcdVhYWFgnIHNlcXVlbmNlcyBhcmUgYWxsb3dlZCBpblxuICAvLyBpZGVudGlmaWVycywgc28gJ1xcJyBhbHNvIGRpc3BhdGNoZXMgdG8gdGhhdC5cbiAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KGNvZGUsIHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2KSB8fCBjb2RlID09PSA5MiAvKiAnXFwnICovKVxuICAgIHsgcmV0dXJuIHRoaXMucmVhZFdvcmQoKSB9XG5cbiAgcmV0dXJuIHRoaXMuZ2V0VG9rZW5Gcm9tQ29kZShjb2RlKVxufTtcblxucHAuZnVsbENoYXJDb2RlQXRQb3MgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGNvZGUgPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MpO1xuICBpZiAoY29kZSA8PSAweGQ3ZmYgfHwgY29kZSA+PSAweGRjMDApIHsgcmV0dXJuIGNvZGUgfVxuICB2YXIgbmV4dCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyArIDEpO1xuICByZXR1cm4gbmV4dCA8PSAweGRiZmYgfHwgbmV4dCA+PSAweGUwMDAgPyBjb2RlIDogKGNvZGUgPDwgMTApICsgbmV4dCAtIDB4MzVmZGMwMFxufTtcblxucHAuc2tpcEJsb2NrQ29tbWVudCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc3RhcnRMb2MgPSB0aGlzLm9wdGlvbnMub25Db21tZW50ICYmIHRoaXMuY3VyUG9zaXRpb24oKTtcbiAgdmFyIHN0YXJ0ID0gdGhpcy5wb3MsIGVuZCA9IHRoaXMuaW5wdXQuaW5kZXhPZihcIiovXCIsIHRoaXMucG9zICs9IDIpO1xuICBpZiAoZW5kID09PSAtMSkgeyB0aGlzLnJhaXNlKHRoaXMucG9zIC0gMiwgXCJVbnRlcm1pbmF0ZWQgY29tbWVudFwiKTsgfVxuICB0aGlzLnBvcyA9IGVuZCArIDI7XG4gIGlmICh0aGlzLm9wdGlvbnMubG9jYXRpb25zKSB7XG4gICAgZm9yICh2YXIgbmV4dEJyZWFrID0gKHZvaWQgMCksIHBvcyA9IHN0YXJ0OyAobmV4dEJyZWFrID0gbmV4dExpbmVCcmVhayh0aGlzLmlucHV0LCBwb3MsIHRoaXMucG9zKSkgPiAtMTspIHtcbiAgICAgICsrdGhpcy5jdXJMaW5lO1xuICAgICAgcG9zID0gdGhpcy5saW5lU3RhcnQgPSBuZXh0QnJlYWs7XG4gICAgfVxuICB9XG4gIGlmICh0aGlzLm9wdGlvbnMub25Db21tZW50KVxuICAgIHsgdGhpcy5vcHRpb25zLm9uQ29tbWVudCh0cnVlLCB0aGlzLmlucHV0LnNsaWNlKHN0YXJ0ICsgMiwgZW5kKSwgc3RhcnQsIHRoaXMucG9zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRMb2MsIHRoaXMuY3VyUG9zaXRpb24oKSk7IH1cbn07XG5cbnBwLnNraXBMaW5lQ29tbWVudCA9IGZ1bmN0aW9uKHN0YXJ0U2tpcCkge1xuICB2YXIgc3RhcnQgPSB0aGlzLnBvcztcbiAgdmFyIHN0YXJ0TG9jID0gdGhpcy5vcHRpb25zLm9uQ29tbWVudCAmJiB0aGlzLmN1clBvc2l0aW9uKCk7XG4gIHZhciBjaCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyArPSBzdGFydFNraXApO1xuICB3aGlsZSAodGhpcy5wb3MgPCB0aGlzLmlucHV0Lmxlbmd0aCAmJiAhaXNOZXdMaW5lKGNoKSkge1xuICAgIGNoID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KCsrdGhpcy5wb3MpO1xuICB9XG4gIGlmICh0aGlzLm9wdGlvbnMub25Db21tZW50KVxuICAgIHsgdGhpcy5vcHRpb25zLm9uQ29tbWVudChmYWxzZSwgdGhpcy5pbnB1dC5zbGljZShzdGFydCArIHN0YXJ0U2tpcCwgdGhpcy5wb3MpLCBzdGFydCwgdGhpcy5wb3MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydExvYywgdGhpcy5jdXJQb3NpdGlvbigpKTsgfVxufTtcblxuLy8gQ2FsbGVkIGF0IHRoZSBzdGFydCBvZiB0aGUgcGFyc2UgYW5kIGFmdGVyIGV2ZXJ5IHRva2VuLiBTa2lwc1xuLy8gd2hpdGVzcGFjZSBhbmQgY29tbWVudHMsIGFuZC5cblxucHAuc2tpcFNwYWNlID0gZnVuY3Rpb24oKSB7XG4gIGxvb3A6IHdoaWxlICh0aGlzLnBvcyA8IHRoaXMuaW5wdXQubGVuZ3RoKSB7XG4gICAgdmFyIGNoID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zKTtcbiAgICBzd2l0Y2ggKGNoKSB7XG4gICAgY2FzZSAzMjogY2FzZSAxNjA6IC8vICcgJ1xuICAgICAgKyt0aGlzLnBvcztcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAxMzpcbiAgICAgIGlmICh0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MgKyAxKSA9PT0gMTApIHtcbiAgICAgICAgKyt0aGlzLnBvcztcbiAgICAgIH1cbiAgICBjYXNlIDEwOiBjYXNlIDgyMzI6IGNhc2UgODIzMzpcbiAgICAgICsrdGhpcy5wb3M7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmxvY2F0aW9ucykge1xuICAgICAgICArK3RoaXMuY3VyTGluZTtcbiAgICAgICAgdGhpcy5saW5lU3RhcnQgPSB0aGlzLnBvcztcbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgY2FzZSA0NzogLy8gJy8nXG4gICAgICBzd2l0Y2ggKHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyArIDEpKSB7XG4gICAgICBjYXNlIDQyOiAvLyAnKidcbiAgICAgICAgdGhpcy5za2lwQmxvY2tDb21tZW50KCk7XG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIDQ3OlxuICAgICAgICB0aGlzLnNraXBMaW5lQ29tbWVudCgyKTtcbiAgICAgICAgYnJlYWtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGJyZWFrIGxvb3BcbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIGlmIChjaCA+IDggJiYgY2ggPCAxNCB8fCBjaCA+PSA1NzYwICYmIG5vbkFTQ0lJd2hpdGVzcGFjZS50ZXN0KFN0cmluZy5mcm9tQ2hhckNvZGUoY2gpKSkge1xuICAgICAgICArK3RoaXMucG9zO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWsgbG9vcFxuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuLy8gQ2FsbGVkIGF0IHRoZSBlbmQgb2YgZXZlcnkgdG9rZW4uIFNldHMgYGVuZGAsIGB2YWxgLCBhbmRcbi8vIG1haW50YWlucyBgY29udGV4dGAgYW5kIGBleHByQWxsb3dlZGAsIGFuZCBza2lwcyB0aGUgc3BhY2UgYWZ0ZXJcbi8vIHRoZSB0b2tlbiwgc28gdGhhdCB0aGUgbmV4dCBvbmUncyBgc3RhcnRgIHdpbGwgcG9pbnQgYXQgdGhlXG4vLyByaWdodCBwb3NpdGlvbi5cblxucHAuZmluaXNoVG9rZW4gPSBmdW5jdGlvbih0eXBlLCB2YWwpIHtcbiAgdGhpcy5lbmQgPSB0aGlzLnBvcztcbiAgaWYgKHRoaXMub3B0aW9ucy5sb2NhdGlvbnMpIHsgdGhpcy5lbmRMb2MgPSB0aGlzLmN1clBvc2l0aW9uKCk7IH1cbiAgdmFyIHByZXZUeXBlID0gdGhpcy50eXBlO1xuICB0aGlzLnR5cGUgPSB0eXBlO1xuICB0aGlzLnZhbHVlID0gdmFsO1xuXG4gIHRoaXMudXBkYXRlQ29udGV4dChwcmV2VHlwZSk7XG59O1xuXG4vLyAjIyMgVG9rZW4gcmVhZGluZ1xuXG4vLyBUaGlzIGlzIHRoZSBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB0byBmZXRjaCB0aGUgbmV4dCB0b2tlbi4gSXRcbi8vIGlzIHNvbWV3aGF0IG9ic2N1cmUsIGJlY2F1c2UgaXQgd29ya3MgaW4gY2hhcmFjdGVyIGNvZGVzIHJhdGhlclxuLy8gdGhhbiBjaGFyYWN0ZXJzLCBhbmQgYmVjYXVzZSBvcGVyYXRvciBwYXJzaW5nIGhhcyBiZWVuIGlubGluZWRcbi8vIGludG8gaXQuXG4vL1xuLy8gQWxsIGluIHRoZSBuYW1lIG9mIHNwZWVkLlxuLy9cbnBwLnJlYWRUb2tlbl9kb3QgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG5leHQgPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MgKyAxKTtcbiAgaWYgKG5leHQgPj0gNDggJiYgbmV4dCA8PSA1NykgeyByZXR1cm4gdGhpcy5yZWFkTnVtYmVyKHRydWUpIH1cbiAgdmFyIG5leHQyID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMik7XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNiAmJiBuZXh0ID09PSA0NiAmJiBuZXh0MiA9PT0gNDYpIHsgLy8gNDYgPSBkb3QgJy4nXG4gICAgdGhpcy5wb3MgKz0gMztcbiAgICByZXR1cm4gdGhpcy5maW5pc2hUb2tlbih0eXBlcyQxLmVsbGlwc2lzKVxuICB9IGVsc2Uge1xuICAgICsrdGhpcy5wb3M7XG4gICAgcmV0dXJuIHRoaXMuZmluaXNoVG9rZW4odHlwZXMkMS5kb3QpXG4gIH1cbn07XG5cbnBwLnJlYWRUb2tlbl9zbGFzaCA9IGZ1bmN0aW9uKCkgeyAvLyAnLydcbiAgdmFyIG5leHQgPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MgKyAxKTtcbiAgaWYgKHRoaXMuZXhwckFsbG93ZWQpIHsgKyt0aGlzLnBvczsgcmV0dXJuIHRoaXMucmVhZFJlZ2V4cCgpIH1cbiAgaWYgKG5leHQgPT09IDYxKSB7IHJldHVybiB0aGlzLmZpbmlzaE9wKHR5cGVzJDEuYXNzaWduLCAyKSB9XG4gIHJldHVybiB0aGlzLmZpbmlzaE9wKHR5cGVzJDEuc2xhc2gsIDEpXG59O1xuXG5wcC5yZWFkVG9rZW5fbXVsdF9tb2R1bG9fZXhwID0gZnVuY3Rpb24oY29kZSkgeyAvLyAnJSonXG4gIHZhciBuZXh0ID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMSk7XG4gIHZhciBzaXplID0gMTtcbiAgdmFyIHRva2VudHlwZSA9IGNvZGUgPT09IDQyID8gdHlwZXMkMS5zdGFyIDogdHlwZXMkMS5tb2R1bG87XG5cbiAgLy8gZXhwb25lbnRpYXRpb24gb3BlcmF0b3IgKiogYW5kICoqPVxuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDcgJiYgY29kZSA9PT0gNDIgJiYgbmV4dCA9PT0gNDIpIHtcbiAgICArK3NpemU7XG4gICAgdG9rZW50eXBlID0gdHlwZXMkMS5zdGFyc3RhcjtcbiAgICBuZXh0ID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMik7XG4gIH1cblxuICBpZiAobmV4dCA9PT0gNjEpIHsgcmV0dXJuIHRoaXMuZmluaXNoT3AodHlwZXMkMS5hc3NpZ24sIHNpemUgKyAxKSB9XG4gIHJldHVybiB0aGlzLmZpbmlzaE9wKHRva2VudHlwZSwgc2l6ZSlcbn07XG5cbnBwLnJlYWRUb2tlbl9waXBlX2FtcCA9IGZ1bmN0aW9uKGNvZGUpIHsgLy8gJ3wmJ1xuICB2YXIgbmV4dCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyArIDEpO1xuICBpZiAobmV4dCA9PT0gY29kZSkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTIpIHtcbiAgICAgIHZhciBuZXh0MiA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyArIDIpO1xuICAgICAgaWYgKG5leHQyID09PSA2MSkgeyByZXR1cm4gdGhpcy5maW5pc2hPcCh0eXBlcyQxLmFzc2lnbiwgMykgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5maW5pc2hPcChjb2RlID09PSAxMjQgPyB0eXBlcyQxLmxvZ2ljYWxPUiA6IHR5cGVzJDEubG9naWNhbEFORCwgMilcbiAgfVxuICBpZiAobmV4dCA9PT0gNjEpIHsgcmV0dXJuIHRoaXMuZmluaXNoT3AodHlwZXMkMS5hc3NpZ24sIDIpIH1cbiAgcmV0dXJuIHRoaXMuZmluaXNoT3AoY29kZSA9PT0gMTI0ID8gdHlwZXMkMS5iaXR3aXNlT1IgOiB0eXBlcyQxLmJpdHdpc2VBTkQsIDEpXG59O1xuXG5wcC5yZWFkVG9rZW5fY2FyZXQgPSBmdW5jdGlvbigpIHsgLy8gJ14nXG4gIHZhciBuZXh0ID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMSk7XG4gIGlmIChuZXh0ID09PSA2MSkgeyByZXR1cm4gdGhpcy5maW5pc2hPcCh0eXBlcyQxLmFzc2lnbiwgMikgfVxuICByZXR1cm4gdGhpcy5maW5pc2hPcCh0eXBlcyQxLmJpdHdpc2VYT1IsIDEpXG59O1xuXG5wcC5yZWFkVG9rZW5fcGx1c19taW4gPSBmdW5jdGlvbihjb2RlKSB7IC8vICcrLSdcbiAgdmFyIG5leHQgPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MgKyAxKTtcbiAgaWYgKG5leHQgPT09IGNvZGUpIHtcbiAgICBpZiAobmV4dCA9PT0gNDUgJiYgIXRoaXMuaW5Nb2R1bGUgJiYgdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMikgPT09IDYyICYmXG4gICAgICAgICh0aGlzLmxhc3RUb2tFbmQgPT09IDAgfHwgbGluZUJyZWFrLnRlc3QodGhpcy5pbnB1dC5zbGljZSh0aGlzLmxhc3RUb2tFbmQsIHRoaXMucG9zKSkpKSB7XG4gICAgICAvLyBBIGAtLT5gIGxpbmUgY29tbWVudFxuICAgICAgdGhpcy5za2lwTGluZUNvbW1lbnQoMyk7XG4gICAgICB0aGlzLnNraXBTcGFjZSgpO1xuICAgICAgcmV0dXJuIHRoaXMubmV4dFRva2VuKClcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZmluaXNoT3AodHlwZXMkMS5pbmNEZWMsIDIpXG4gIH1cbiAgaWYgKG5leHQgPT09IDYxKSB7IHJldHVybiB0aGlzLmZpbmlzaE9wKHR5cGVzJDEuYXNzaWduLCAyKSB9XG4gIHJldHVybiB0aGlzLmZpbmlzaE9wKHR5cGVzJDEucGx1c01pbiwgMSlcbn07XG5cbnBwLnJlYWRUb2tlbl9sdF9ndCA9IGZ1bmN0aW9uKGNvZGUpIHsgLy8gJzw+J1xuICB2YXIgbmV4dCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyArIDEpO1xuICB2YXIgc2l6ZSA9IDE7XG4gIGlmIChuZXh0ID09PSBjb2RlKSB7XG4gICAgc2l6ZSA9IGNvZGUgPT09IDYyICYmIHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyArIDIpID09PSA2MiA/IDMgOiAyO1xuICAgIGlmICh0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MgKyBzaXplKSA9PT0gNjEpIHsgcmV0dXJuIHRoaXMuZmluaXNoT3AodHlwZXMkMS5hc3NpZ24sIHNpemUgKyAxKSB9XG4gICAgcmV0dXJuIHRoaXMuZmluaXNoT3AodHlwZXMkMS5iaXRTaGlmdCwgc2l6ZSlcbiAgfVxuICBpZiAobmV4dCA9PT0gMzMgJiYgY29kZSA9PT0gNjAgJiYgIXRoaXMuaW5Nb2R1bGUgJiYgdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMikgPT09IDQ1ICYmXG4gICAgICB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MgKyAzKSA9PT0gNDUpIHtcbiAgICAvLyBgPCEtLWAsIGFuIFhNTC1zdHlsZSBjb21tZW50IHRoYXQgc2hvdWxkIGJlIGludGVycHJldGVkIGFzIGEgbGluZSBjb21tZW50XG4gICAgdGhpcy5za2lwTGluZUNvbW1lbnQoNCk7XG4gICAgdGhpcy5za2lwU3BhY2UoKTtcbiAgICByZXR1cm4gdGhpcy5uZXh0VG9rZW4oKVxuICB9XG4gIGlmIChuZXh0ID09PSA2MSkgeyBzaXplID0gMjsgfVxuICByZXR1cm4gdGhpcy5maW5pc2hPcCh0eXBlcyQxLnJlbGF0aW9uYWwsIHNpemUpXG59O1xuXG5wcC5yZWFkVG9rZW5fZXFfZXhjbCA9IGZ1bmN0aW9uKGNvZGUpIHsgLy8gJz0hJ1xuICB2YXIgbmV4dCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyArIDEpO1xuICBpZiAobmV4dCA9PT0gNjEpIHsgcmV0dXJuIHRoaXMuZmluaXNoT3AodHlwZXMkMS5lcXVhbGl0eSwgdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMikgPT09IDYxID8gMyA6IDIpIH1cbiAgaWYgKGNvZGUgPT09IDYxICYmIG5leHQgPT09IDYyICYmIHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2KSB7IC8vICc9PidcbiAgICB0aGlzLnBvcyArPSAyO1xuICAgIHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEuYXJyb3cpXG4gIH1cbiAgcmV0dXJuIHRoaXMuZmluaXNoT3AoY29kZSA9PT0gNjEgPyB0eXBlcyQxLmVxIDogdHlwZXMkMS5wcmVmaXgsIDEpXG59O1xuXG5wcC5yZWFkVG9rZW5fcXVlc3Rpb24gPSBmdW5jdGlvbigpIHsgLy8gJz8nXG4gIHZhciBlY21hVmVyc2lvbiA9IHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbjtcbiAgaWYgKGVjbWFWZXJzaW9uID49IDExKSB7XG4gICAgdmFyIG5leHQgPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MgKyAxKTtcbiAgICBpZiAobmV4dCA9PT0gNDYpIHtcbiAgICAgIHZhciBuZXh0MiA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyArIDIpO1xuICAgICAgaWYgKG5leHQyIDwgNDggfHwgbmV4dDIgPiA1NykgeyByZXR1cm4gdGhpcy5maW5pc2hPcCh0eXBlcyQxLnF1ZXN0aW9uRG90LCAyKSB9XG4gICAgfVxuICAgIGlmIChuZXh0ID09PSA2Mykge1xuICAgICAgaWYgKGVjbWFWZXJzaW9uID49IDEyKSB7XG4gICAgICAgIHZhciBuZXh0MiQxID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMik7XG4gICAgICAgIGlmIChuZXh0MiQxID09PSA2MSkgeyByZXR1cm4gdGhpcy5maW5pc2hPcCh0eXBlcyQxLmFzc2lnbiwgMykgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuZmluaXNoT3AodHlwZXMkMS5jb2FsZXNjZSwgMilcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXMuZmluaXNoT3AodHlwZXMkMS5xdWVzdGlvbiwgMSlcbn07XG5cbnBwLnJlYWRUb2tlbl9udW1iZXJTaWduID0gZnVuY3Rpb24oKSB7IC8vICcjJ1xuICB2YXIgZWNtYVZlcnNpb24gPSB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb247XG4gIHZhciBjb2RlID0gMzU7IC8vICcjJ1xuICBpZiAoZWNtYVZlcnNpb24gPj0gMTMpIHtcbiAgICArK3RoaXMucG9zO1xuICAgIGNvZGUgPSB0aGlzLmZ1bGxDaGFyQ29kZUF0UG9zKCk7XG4gICAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KGNvZGUsIHRydWUpIHx8IGNvZGUgPT09IDkyIC8qICdcXCcgKi8pIHtcbiAgICAgIHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEucHJpdmF0ZUlkLCB0aGlzLnJlYWRXb3JkMSgpKVxuICAgIH1cbiAgfVxuXG4gIHRoaXMucmFpc2UodGhpcy5wb3MsIFwiVW5leHBlY3RlZCBjaGFyYWN0ZXIgJ1wiICsgY29kZVBvaW50VG9TdHJpbmcoY29kZSkgKyBcIidcIik7XG59O1xuXG5wcC5nZXRUb2tlbkZyb21Db2RlID0gZnVuY3Rpb24oY29kZSkge1xuICBzd2l0Y2ggKGNvZGUpIHtcbiAgLy8gVGhlIGludGVycHJldGF0aW9uIG9mIGEgZG90IGRlcGVuZHMgb24gd2hldGhlciBpdCBpcyBmb2xsb3dlZFxuICAvLyBieSBhIGRpZ2l0IG9yIGFub3RoZXIgdHdvIGRvdHMuXG4gIGNhc2UgNDY6IC8vICcuJ1xuICAgIHJldHVybiB0aGlzLnJlYWRUb2tlbl9kb3QoKVxuXG4gIC8vIFB1bmN0dWF0aW9uIHRva2Vucy5cbiAgY2FzZSA0MDogKyt0aGlzLnBvczsgcmV0dXJuIHRoaXMuZmluaXNoVG9rZW4odHlwZXMkMS5wYXJlbkwpXG4gIGNhc2UgNDE6ICsrdGhpcy5wb3M7IHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEucGFyZW5SKVxuICBjYXNlIDU5OiArK3RoaXMucG9zOyByZXR1cm4gdGhpcy5maW5pc2hUb2tlbih0eXBlcyQxLnNlbWkpXG4gIGNhc2UgNDQ6ICsrdGhpcy5wb3M7IHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEuY29tbWEpXG4gIGNhc2UgOTE6ICsrdGhpcy5wb3M7IHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEuYnJhY2tldEwpXG4gIGNhc2UgOTM6ICsrdGhpcy5wb3M7IHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEuYnJhY2tldFIpXG4gIGNhc2UgMTIzOiArK3RoaXMucG9zOyByZXR1cm4gdGhpcy5maW5pc2hUb2tlbih0eXBlcyQxLmJyYWNlTClcbiAgY2FzZSAxMjU6ICsrdGhpcy5wb3M7IHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEuYnJhY2VSKVxuICBjYXNlIDU4OiArK3RoaXMucG9zOyByZXR1cm4gdGhpcy5maW5pc2hUb2tlbih0eXBlcyQxLmNvbG9uKVxuXG4gIGNhc2UgOTY6IC8vICdgJ1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPCA2KSB7IGJyZWFrIH1cbiAgICArK3RoaXMucG9zO1xuICAgIHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEuYmFja1F1b3RlKVxuXG4gIGNhc2UgNDg6IC8vICcwJ1xuICAgIHZhciBuZXh0ID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMSk7XG4gICAgaWYgKG5leHQgPT09IDEyMCB8fCBuZXh0ID09PSA4OCkgeyByZXR1cm4gdGhpcy5yZWFkUmFkaXhOdW1iZXIoMTYpIH0gLy8gJzB4JywgJzBYJyAtIGhleCBudW1iZXJcbiAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDYpIHtcbiAgICAgIGlmIChuZXh0ID09PSAxMTEgfHwgbmV4dCA9PT0gNzkpIHsgcmV0dXJuIHRoaXMucmVhZFJhZGl4TnVtYmVyKDgpIH0gLy8gJzBvJywgJzBPJyAtIG9jdGFsIG51bWJlclxuICAgICAgaWYgKG5leHQgPT09IDk4IHx8IG5leHQgPT09IDY2KSB7IHJldHVybiB0aGlzLnJlYWRSYWRpeE51bWJlcigyKSB9IC8vICcwYicsICcwQicgLSBiaW5hcnkgbnVtYmVyXG4gICAgfVxuXG4gIC8vIEFueXRoaW5nIGVsc2UgYmVnaW5uaW5nIHdpdGggYSBkaWdpdCBpcyBhbiBpbnRlZ2VyLCBvY3RhbFxuICAvLyBudW1iZXIsIG9yIGZsb2F0LlxuICBjYXNlIDQ5OiBjYXNlIDUwOiBjYXNlIDUxOiBjYXNlIDUyOiBjYXNlIDUzOiBjYXNlIDU0OiBjYXNlIDU1OiBjYXNlIDU2OiBjYXNlIDU3OiAvLyAxLTlcbiAgICByZXR1cm4gdGhpcy5yZWFkTnVtYmVyKGZhbHNlKVxuXG4gIC8vIFF1b3RlcyBwcm9kdWNlIHN0cmluZ3MuXG4gIGNhc2UgMzQ6IGNhc2UgMzk6IC8vICdcIicsIFwiJ1wiXG4gICAgcmV0dXJuIHRoaXMucmVhZFN0cmluZyhjb2RlKVxuXG4gIC8vIE9wZXJhdG9ycyBhcmUgcGFyc2VkIGlubGluZSBpbiB0aW55IHN0YXRlIG1hY2hpbmVzLiAnPScgKDYxKSBpc1xuICAvLyBvZnRlbiByZWZlcnJlZCB0by4gYGZpbmlzaE9wYCBzaW1wbHkgc2tpcHMgdGhlIGFtb3VudCBvZlxuICAvLyBjaGFyYWN0ZXJzIGl0IGlzIGdpdmVuIGFzIHNlY29uZCBhcmd1bWVudCwgYW5kIHJldHVybnMgYSB0b2tlblxuICAvLyBvZiB0aGUgdHlwZSBnaXZlbiBieSBpdHMgZmlyc3QgYXJndW1lbnQuXG4gIGNhc2UgNDc6IC8vICcvJ1xuICAgIHJldHVybiB0aGlzLnJlYWRUb2tlbl9zbGFzaCgpXG5cbiAgY2FzZSAzNzogY2FzZSA0MjogLy8gJyUqJ1xuICAgIHJldHVybiB0aGlzLnJlYWRUb2tlbl9tdWx0X21vZHVsb19leHAoY29kZSlcblxuICBjYXNlIDEyNDogY2FzZSAzODogLy8gJ3wmJ1xuICAgIHJldHVybiB0aGlzLnJlYWRUb2tlbl9waXBlX2FtcChjb2RlKVxuXG4gIGNhc2UgOTQ6IC8vICdeJ1xuICAgIHJldHVybiB0aGlzLnJlYWRUb2tlbl9jYXJldCgpXG5cbiAgY2FzZSA0MzogY2FzZSA0NTogLy8gJystJ1xuICAgIHJldHVybiB0aGlzLnJlYWRUb2tlbl9wbHVzX21pbihjb2RlKVxuXG4gIGNhc2UgNjA6IGNhc2UgNjI6IC8vICc8PidcbiAgICByZXR1cm4gdGhpcy5yZWFkVG9rZW5fbHRfZ3QoY29kZSlcblxuICBjYXNlIDYxOiBjYXNlIDMzOiAvLyAnPSEnXG4gICAgcmV0dXJuIHRoaXMucmVhZFRva2VuX2VxX2V4Y2woY29kZSlcblxuICBjYXNlIDYzOiAvLyAnPydcbiAgICByZXR1cm4gdGhpcy5yZWFkVG9rZW5fcXVlc3Rpb24oKVxuXG4gIGNhc2UgMTI2OiAvLyAnfidcbiAgICByZXR1cm4gdGhpcy5maW5pc2hPcCh0eXBlcyQxLnByZWZpeCwgMSlcblxuICBjYXNlIDM1OiAvLyAnIydcbiAgICByZXR1cm4gdGhpcy5yZWFkVG9rZW5fbnVtYmVyU2lnbigpXG4gIH1cblxuICB0aGlzLnJhaXNlKHRoaXMucG9zLCBcIlVuZXhwZWN0ZWQgY2hhcmFjdGVyICdcIiArIGNvZGVQb2ludFRvU3RyaW5nKGNvZGUpICsgXCInXCIpO1xufTtcblxucHAuZmluaXNoT3AgPSBmdW5jdGlvbih0eXBlLCBzaXplKSB7XG4gIHZhciBzdHIgPSB0aGlzLmlucHV0LnNsaWNlKHRoaXMucG9zLCB0aGlzLnBvcyArIHNpemUpO1xuICB0aGlzLnBvcyArPSBzaXplO1xuICByZXR1cm4gdGhpcy5maW5pc2hUb2tlbih0eXBlLCBzdHIpXG59O1xuXG5wcC5yZWFkUmVnZXhwID0gZnVuY3Rpb24oKSB7XG4gIHZhciBlc2NhcGVkLCBpbkNsYXNzLCBzdGFydCA9IHRoaXMucG9zO1xuICBmb3IgKDs7KSB7XG4gICAgaWYgKHRoaXMucG9zID49IHRoaXMuaW5wdXQubGVuZ3RoKSB7IHRoaXMucmFpc2Uoc3RhcnQsIFwiVW50ZXJtaW5hdGVkIHJlZ3VsYXIgZXhwcmVzc2lvblwiKTsgfVxuICAgIHZhciBjaCA9IHRoaXMuaW5wdXQuY2hhckF0KHRoaXMucG9zKTtcbiAgICBpZiAobGluZUJyZWFrLnRlc3QoY2gpKSB7IHRoaXMucmFpc2Uoc3RhcnQsIFwiVW50ZXJtaW5hdGVkIHJlZ3VsYXIgZXhwcmVzc2lvblwiKTsgfVxuICAgIGlmICghZXNjYXBlZCkge1xuICAgICAgaWYgKGNoID09PSBcIltcIikgeyBpbkNsYXNzID0gdHJ1ZTsgfVxuICAgICAgZWxzZSBpZiAoY2ggPT09IFwiXVwiICYmIGluQ2xhc3MpIHsgaW5DbGFzcyA9IGZhbHNlOyB9XG4gICAgICBlbHNlIGlmIChjaCA9PT0gXCIvXCIgJiYgIWluQ2xhc3MpIHsgYnJlYWsgfVxuICAgICAgZXNjYXBlZCA9IGNoID09PSBcIlxcXFxcIjtcbiAgICB9IGVsc2UgeyBlc2NhcGVkID0gZmFsc2U7IH1cbiAgICArK3RoaXMucG9zO1xuICB9XG4gIHZhciBwYXR0ZXJuID0gdGhpcy5pbnB1dC5zbGljZShzdGFydCwgdGhpcy5wb3MpO1xuICArK3RoaXMucG9zO1xuICB2YXIgZmxhZ3NTdGFydCA9IHRoaXMucG9zO1xuICB2YXIgZmxhZ3MgPSB0aGlzLnJlYWRXb3JkMSgpO1xuICBpZiAodGhpcy5jb250YWluc0VzYykgeyB0aGlzLnVuZXhwZWN0ZWQoZmxhZ3NTdGFydCk7IH1cblxuICAvLyBWYWxpZGF0ZSBwYXR0ZXJuXG4gIHZhciBzdGF0ZSA9IHRoaXMucmVnZXhwU3RhdGUgfHwgKHRoaXMucmVnZXhwU3RhdGUgPSBuZXcgUmVnRXhwVmFsaWRhdGlvblN0YXRlKHRoaXMpKTtcbiAgc3RhdGUucmVzZXQoc3RhcnQsIHBhdHRlcm4sIGZsYWdzKTtcbiAgdGhpcy52YWxpZGF0ZVJlZ0V4cEZsYWdzKHN0YXRlKTtcbiAgdGhpcy52YWxpZGF0ZVJlZ0V4cFBhdHRlcm4oc3RhdGUpO1xuXG4gIC8vIENyZWF0ZSBMaXRlcmFsI3ZhbHVlIHByb3BlcnR5IHZhbHVlLlxuICB2YXIgdmFsdWUgPSBudWxsO1xuICB0cnkge1xuICAgIHZhbHVlID0gbmV3IFJlZ0V4cChwYXR0ZXJuLCBmbGFncyk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBFU1RyZWUgcmVxdWlyZXMgbnVsbCBpZiBpdCBmYWlsZWQgdG8gaW5zdGFudGlhdGUgUmVnRXhwIG9iamVjdC5cbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vZXN0cmVlL2VzdHJlZS9ibG9iL2EyNzAwM2FkZjRmZDdiZmFkNDRkZTljZWYzNzJhMmVhY2Q1MjdiMWMvZXM1Lm1kI3JlZ2V4cGxpdGVyYWxcbiAgfVxuXG4gIHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEucmVnZXhwLCB7cGF0dGVybjogcGF0dGVybiwgZmxhZ3M6IGZsYWdzLCB2YWx1ZTogdmFsdWV9KVxufTtcblxuLy8gUmVhZCBhbiBpbnRlZ2VyIGluIHRoZSBnaXZlbiByYWRpeC4gUmV0dXJuIG51bGwgaWYgemVybyBkaWdpdHNcbi8vIHdlcmUgcmVhZCwgdGhlIGludGVnZXIgdmFsdWUgb3RoZXJ3aXNlLiBXaGVuIGBsZW5gIGlzIGdpdmVuLCB0aGlzXG4vLyB3aWxsIHJldHVybiBgbnVsbGAgdW5sZXNzIHRoZSBpbnRlZ2VyIGhhcyBleGFjdGx5IGBsZW5gIGRpZ2l0cy5cblxucHAucmVhZEludCA9IGZ1bmN0aW9uKHJhZGl4LCBsZW4sIG1heWJlTGVnYWN5T2N0YWxOdW1lcmljTGl0ZXJhbCkge1xuICAvLyBgbGVuYCBpcyB1c2VkIGZvciBjaGFyYWN0ZXIgZXNjYXBlIHNlcXVlbmNlcy4gSW4gdGhhdCBjYXNlLCBkaXNhbGxvdyBzZXBhcmF0b3JzLlxuICB2YXIgYWxsb3dTZXBhcmF0b3JzID0gdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDEyICYmIGxlbiA9PT0gdW5kZWZpbmVkO1xuXG4gIC8vIGBtYXliZUxlZ2FjeU9jdGFsTnVtZXJpY0xpdGVyYWxgIGlzIHRydWUgaWYgaXQgZG9lc24ndCBoYXZlIHByZWZpeCAoMHgsMG8sMGIpXG4gIC8vIGFuZCBpc24ndCBmcmFjdGlvbiBwYXJ0IG5vciBleHBvbmVudCBwYXJ0LiBJbiB0aGF0IGNhc2UsIGlmIHRoZSBmaXJzdCBkaWdpdFxuICAvLyBpcyB6ZXJvIHRoZW4gZGlzYWxsb3cgc2VwYXJhdG9ycy5cbiAgdmFyIGlzTGVnYWN5T2N0YWxOdW1lcmljTGl0ZXJhbCA9IG1heWJlTGVnYWN5T2N0YWxOdW1lcmljTGl0ZXJhbCAmJiB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MpID09PSA0ODtcblxuICB2YXIgc3RhcnQgPSB0aGlzLnBvcywgdG90YWwgPSAwLCBsYXN0Q29kZSA9IDA7XG4gIGZvciAodmFyIGkgPSAwLCBlID0gbGVuID09IG51bGwgPyBJbmZpbml0eSA6IGxlbjsgaSA8IGU7ICsraSwgKyt0aGlzLnBvcykge1xuICAgIHZhciBjb2RlID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zKSwgdmFsID0gKHZvaWQgMCk7XG5cbiAgICBpZiAoYWxsb3dTZXBhcmF0b3JzICYmIGNvZGUgPT09IDk1KSB7XG4gICAgICBpZiAoaXNMZWdhY3lPY3RhbE51bWVyaWNMaXRlcmFsKSB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZSh0aGlzLnBvcywgXCJOdW1lcmljIHNlcGFyYXRvciBpcyBub3QgYWxsb3dlZCBpbiBsZWdhY3kgb2N0YWwgbnVtZXJpYyBsaXRlcmFsc1wiKTsgfVxuICAgICAgaWYgKGxhc3RDb2RlID09PSA5NSkgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUodGhpcy5wb3MsIFwiTnVtZXJpYyBzZXBhcmF0b3IgbXVzdCBiZSBleGFjdGx5IG9uZSB1bmRlcnNjb3JlXCIpOyB9XG4gICAgICBpZiAoaSA9PT0gMCkgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUodGhpcy5wb3MsIFwiTnVtZXJpYyBzZXBhcmF0b3IgaXMgbm90IGFsbG93ZWQgYXQgdGhlIGZpcnN0IG9mIGRpZ2l0c1wiKTsgfVxuICAgICAgbGFzdENvZGUgPSBjb2RlO1xuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICBpZiAoY29kZSA+PSA5NykgeyB2YWwgPSBjb2RlIC0gOTcgKyAxMDsgfSAvLyBhXG4gICAgZWxzZSBpZiAoY29kZSA+PSA2NSkgeyB2YWwgPSBjb2RlIC0gNjUgKyAxMDsgfSAvLyBBXG4gICAgZWxzZSBpZiAoY29kZSA+PSA0OCAmJiBjb2RlIDw9IDU3KSB7IHZhbCA9IGNvZGUgLSA0ODsgfSAvLyAwLTlcbiAgICBlbHNlIHsgdmFsID0gSW5maW5pdHk7IH1cbiAgICBpZiAodmFsID49IHJhZGl4KSB7IGJyZWFrIH1cbiAgICBsYXN0Q29kZSA9IGNvZGU7XG4gICAgdG90YWwgPSB0b3RhbCAqIHJhZGl4ICsgdmFsO1xuICB9XG5cbiAgaWYgKGFsbG93U2VwYXJhdG9ycyAmJiBsYXN0Q29kZSA9PT0gOTUpIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKHRoaXMucG9zIC0gMSwgXCJOdW1lcmljIHNlcGFyYXRvciBpcyBub3QgYWxsb3dlZCBhdCB0aGUgbGFzdCBvZiBkaWdpdHNcIik7IH1cbiAgaWYgKHRoaXMucG9zID09PSBzdGFydCB8fCBsZW4gIT0gbnVsbCAmJiB0aGlzLnBvcyAtIHN0YXJ0ICE9PSBsZW4pIHsgcmV0dXJuIG51bGwgfVxuXG4gIHJldHVybiB0b3RhbFxufTtcblxuZnVuY3Rpb24gc3RyaW5nVG9OdW1iZXIoc3RyLCBpc0xlZ2FjeU9jdGFsTnVtZXJpY0xpdGVyYWwpIHtcbiAgaWYgKGlzTGVnYWN5T2N0YWxOdW1lcmljTGl0ZXJhbCkge1xuICAgIHJldHVybiBwYXJzZUludChzdHIsIDgpXG4gIH1cblxuICAvLyBgcGFyc2VGbG9hdCh2YWx1ZSlgIHN0b3BzIHBhcnNpbmcgYXQgdGhlIGZpcnN0IG51bWVyaWMgc2VwYXJhdG9yIHRoZW4gcmV0dXJucyBhIHdyb25nIHZhbHVlLlxuICByZXR1cm4gcGFyc2VGbG9hdChzdHIucmVwbGFjZSgvXy9nLCBcIlwiKSlcbn1cblxuZnVuY3Rpb24gc3RyaW5nVG9CaWdJbnQoc3RyKSB7XG4gIGlmICh0eXBlb2YgQmlnSW50ICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgLy8gYEJpZ0ludCh2YWx1ZSlgIHRocm93cyBzeW50YXggZXJyb3IgaWYgdGhlIHN0cmluZyBjb250YWlucyBudW1lcmljIHNlcGFyYXRvcnMuXG4gIHJldHVybiBCaWdJbnQoc3RyLnJlcGxhY2UoL18vZywgXCJcIikpXG59XG5cbnBwLnJlYWRSYWRpeE51bWJlciA9IGZ1bmN0aW9uKHJhZGl4KSB7XG4gIHZhciBzdGFydCA9IHRoaXMucG9zO1xuICB0aGlzLnBvcyArPSAyOyAvLyAweFxuICB2YXIgdmFsID0gdGhpcy5yZWFkSW50KHJhZGl4KTtcbiAgaWYgKHZhbCA9PSBudWxsKSB7IHRoaXMucmFpc2UodGhpcy5zdGFydCArIDIsIFwiRXhwZWN0ZWQgbnVtYmVyIGluIHJhZGl4IFwiICsgcmFkaXgpOyB9XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTEgJiYgdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zKSA9PT0gMTEwKSB7XG4gICAgdmFsID0gc3RyaW5nVG9CaWdJbnQodGhpcy5pbnB1dC5zbGljZShzdGFydCwgdGhpcy5wb3MpKTtcbiAgICArK3RoaXMucG9zO1xuICB9IGVsc2UgaWYgKGlzSWRlbnRpZmllclN0YXJ0KHRoaXMuZnVsbENoYXJDb2RlQXRQb3MoKSkpIHsgdGhpcy5yYWlzZSh0aGlzLnBvcywgXCJJZGVudGlmaWVyIGRpcmVjdGx5IGFmdGVyIG51bWJlclwiKTsgfVxuICByZXR1cm4gdGhpcy5maW5pc2hUb2tlbih0eXBlcyQxLm51bSwgdmFsKVxufTtcblxuLy8gUmVhZCBhbiBpbnRlZ2VyLCBvY3RhbCBpbnRlZ2VyLCBvciBmbG9hdGluZy1wb2ludCBudW1iZXIuXG5cbnBwLnJlYWROdW1iZXIgPSBmdW5jdGlvbihzdGFydHNXaXRoRG90KSB7XG4gIHZhciBzdGFydCA9IHRoaXMucG9zO1xuICBpZiAoIXN0YXJ0c1dpdGhEb3QgJiYgdGhpcy5yZWFkSW50KDEwLCB1bmRlZmluZWQsIHRydWUpID09PSBudWxsKSB7IHRoaXMucmFpc2Uoc3RhcnQsIFwiSW52YWxpZCBudW1iZXJcIik7IH1cbiAgdmFyIG9jdGFsID0gdGhpcy5wb3MgLSBzdGFydCA+PSAyICYmIHRoaXMuaW5wdXQuY2hhckNvZGVBdChzdGFydCkgPT09IDQ4O1xuICBpZiAob2N0YWwgJiYgdGhpcy5zdHJpY3QpIHsgdGhpcy5yYWlzZShzdGFydCwgXCJJbnZhbGlkIG51bWJlclwiKTsgfVxuICB2YXIgbmV4dCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyk7XG4gIGlmICghb2N0YWwgJiYgIXN0YXJ0c1dpdGhEb3QgJiYgdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDExICYmIG5leHQgPT09IDExMCkge1xuICAgIHZhciB2YWwkMSA9IHN0cmluZ1RvQmlnSW50KHRoaXMuaW5wdXQuc2xpY2Uoc3RhcnQsIHRoaXMucG9zKSk7XG4gICAgKyt0aGlzLnBvcztcbiAgICBpZiAoaXNJZGVudGlmaWVyU3RhcnQodGhpcy5mdWxsQ2hhckNvZGVBdFBvcygpKSkgeyB0aGlzLnJhaXNlKHRoaXMucG9zLCBcIklkZW50aWZpZXIgZGlyZWN0bHkgYWZ0ZXIgbnVtYmVyXCIpOyB9XG4gICAgcmV0dXJuIHRoaXMuZmluaXNoVG9rZW4odHlwZXMkMS5udW0sIHZhbCQxKVxuICB9XG4gIGlmIChvY3RhbCAmJiAvWzg5XS8udGVzdCh0aGlzLmlucHV0LnNsaWNlKHN0YXJ0LCB0aGlzLnBvcykpKSB7IG9jdGFsID0gZmFsc2U7IH1cbiAgaWYgKG5leHQgPT09IDQ2ICYmICFvY3RhbCkgeyAvLyAnLidcbiAgICArK3RoaXMucG9zO1xuICAgIHRoaXMucmVhZEludCgxMCk7XG4gICAgbmV4dCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyk7XG4gIH1cbiAgaWYgKChuZXh0ID09PSA2OSB8fCBuZXh0ID09PSAxMDEpICYmICFvY3RhbCkgeyAvLyAnZUUnXG4gICAgbmV4dCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCgrK3RoaXMucG9zKTtcbiAgICBpZiAobmV4dCA9PT0gNDMgfHwgbmV4dCA9PT0gNDUpIHsgKyt0aGlzLnBvczsgfSAvLyAnKy0nXG4gICAgaWYgKHRoaXMucmVhZEludCgxMCkgPT09IG51bGwpIHsgdGhpcy5yYWlzZShzdGFydCwgXCJJbnZhbGlkIG51bWJlclwiKTsgfVxuICB9XG4gIGlmIChpc0lkZW50aWZpZXJTdGFydCh0aGlzLmZ1bGxDaGFyQ29kZUF0UG9zKCkpKSB7IHRoaXMucmFpc2UodGhpcy5wb3MsIFwiSWRlbnRpZmllciBkaXJlY3RseSBhZnRlciBudW1iZXJcIik7IH1cblxuICB2YXIgdmFsID0gc3RyaW5nVG9OdW1iZXIodGhpcy5pbnB1dC5zbGljZShzdGFydCwgdGhpcy5wb3MpLCBvY3RhbCk7XG4gIHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEubnVtLCB2YWwpXG59O1xuXG4vLyBSZWFkIGEgc3RyaW5nIHZhbHVlLCBpbnRlcnByZXRpbmcgYmFja3NsYXNoLWVzY2FwZXMuXG5cbnBwLnJlYWRDb2RlUG9pbnQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGNoID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zKSwgY29kZTtcblxuICBpZiAoY2ggPT09IDEyMykgeyAvLyAneydcbiAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uIDwgNikgeyB0aGlzLnVuZXhwZWN0ZWQoKTsgfVxuICAgIHZhciBjb2RlUG9zID0gKyt0aGlzLnBvcztcbiAgICBjb2RlID0gdGhpcy5yZWFkSGV4Q2hhcih0aGlzLmlucHV0LmluZGV4T2YoXCJ9XCIsIHRoaXMucG9zKSAtIHRoaXMucG9zKTtcbiAgICArK3RoaXMucG9zO1xuICAgIGlmIChjb2RlID4gMHgxMEZGRkYpIHsgdGhpcy5pbnZhbGlkU3RyaW5nVG9rZW4oY29kZVBvcywgXCJDb2RlIHBvaW50IG91dCBvZiBib3VuZHNcIik7IH1cbiAgfSBlbHNlIHtcbiAgICBjb2RlID0gdGhpcy5yZWFkSGV4Q2hhcig0KTtcbiAgfVxuICByZXR1cm4gY29kZVxufTtcblxucHAucmVhZFN0cmluZyA9IGZ1bmN0aW9uKHF1b3RlKSB7XG4gIHZhciBvdXQgPSBcIlwiLCBjaHVua1N0YXJ0ID0gKyt0aGlzLnBvcztcbiAgZm9yICg7Oykge1xuICAgIGlmICh0aGlzLnBvcyA+PSB0aGlzLmlucHV0Lmxlbmd0aCkgeyB0aGlzLnJhaXNlKHRoaXMuc3RhcnQsIFwiVW50ZXJtaW5hdGVkIHN0cmluZyBjb25zdGFudFwiKTsgfVxuICAgIHZhciBjaCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyk7XG4gICAgaWYgKGNoID09PSBxdW90ZSkgeyBicmVhayB9XG4gICAgaWYgKGNoID09PSA5MikgeyAvLyAnXFwnXG4gICAgICBvdXQgKz0gdGhpcy5pbnB1dC5zbGljZShjaHVua1N0YXJ0LCB0aGlzLnBvcyk7XG4gICAgICBvdXQgKz0gdGhpcy5yZWFkRXNjYXBlZENoYXIoZmFsc2UpO1xuICAgICAgY2h1bmtTdGFydCA9IHRoaXMucG9zO1xuICAgIH0gZWxzZSBpZiAoY2ggPT09IDB4MjAyOCB8fCBjaCA9PT0gMHgyMDI5KSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uIDwgMTApIHsgdGhpcy5yYWlzZSh0aGlzLnN0YXJ0LCBcIlVudGVybWluYXRlZCBzdHJpbmcgY29uc3RhbnRcIik7IH1cbiAgICAgICsrdGhpcy5wb3M7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmxvY2F0aW9ucykge1xuICAgICAgICB0aGlzLmN1ckxpbmUrKztcbiAgICAgICAgdGhpcy5saW5lU3RhcnQgPSB0aGlzLnBvcztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGlzTmV3TGluZShjaCkpIHsgdGhpcy5yYWlzZSh0aGlzLnN0YXJ0LCBcIlVudGVybWluYXRlZCBzdHJpbmcgY29uc3RhbnRcIik7IH1cbiAgICAgICsrdGhpcy5wb3M7XG4gICAgfVxuICB9XG4gIG91dCArPSB0aGlzLmlucHV0LnNsaWNlKGNodW5rU3RhcnQsIHRoaXMucG9zKyspO1xuICByZXR1cm4gdGhpcy5maW5pc2hUb2tlbih0eXBlcyQxLnN0cmluZywgb3V0KVxufTtcblxuLy8gUmVhZHMgdGVtcGxhdGUgc3RyaW5nIHRva2Vucy5cblxudmFyIElOVkFMSURfVEVNUExBVEVfRVNDQVBFX0VSUk9SID0ge307XG5cbnBwLnRyeVJlYWRUZW1wbGF0ZVRva2VuID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuaW5UZW1wbGF0ZUVsZW1lbnQgPSB0cnVlO1xuICB0cnkge1xuICAgIHRoaXMucmVhZFRtcGxUb2tlbigpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoZXJyID09PSBJTlZBTElEX1RFTVBMQVRFX0VTQ0FQRV9FUlJPUikge1xuICAgICAgdGhpcy5yZWFkSW52YWxpZFRlbXBsYXRlVG9rZW4oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgZXJyXG4gICAgfVxuICB9XG5cbiAgdGhpcy5pblRlbXBsYXRlRWxlbWVudCA9IGZhbHNlO1xufTtcblxucHAuaW52YWxpZFN0cmluZ1Rva2VuID0gZnVuY3Rpb24ocG9zaXRpb24sIG1lc3NhZ2UpIHtcbiAgaWYgKHRoaXMuaW5UZW1wbGF0ZUVsZW1lbnQgJiYgdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDkpIHtcbiAgICB0aHJvdyBJTlZBTElEX1RFTVBMQVRFX0VTQ0FQRV9FUlJPUlxuICB9IGVsc2Uge1xuICAgIHRoaXMucmFpc2UocG9zaXRpb24sIG1lc3NhZ2UpO1xuICB9XG59O1xuXG5wcC5yZWFkVG1wbFRva2VuID0gZnVuY3Rpb24oKSB7XG4gIHZhciBvdXQgPSBcIlwiLCBjaHVua1N0YXJ0ID0gdGhpcy5wb3M7XG4gIGZvciAoOzspIHtcbiAgICBpZiAodGhpcy5wb3MgPj0gdGhpcy5pbnB1dC5sZW5ndGgpIHsgdGhpcy5yYWlzZSh0aGlzLnN0YXJ0LCBcIlVudGVybWluYXRlZCB0ZW1wbGF0ZVwiKTsgfVxuICAgIHZhciBjaCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyk7XG4gICAgaWYgKGNoID09PSA5NiB8fCBjaCA9PT0gMzYgJiYgdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMSkgPT09IDEyMykgeyAvLyAnYCcsICckeydcbiAgICAgIGlmICh0aGlzLnBvcyA9PT0gdGhpcy5zdGFydCAmJiAodGhpcy50eXBlID09PSB0eXBlcyQxLnRlbXBsYXRlIHx8IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5pbnZhbGlkVGVtcGxhdGUpKSB7XG4gICAgICAgIGlmIChjaCA9PT0gMzYpIHtcbiAgICAgICAgICB0aGlzLnBvcyArPSAyO1xuICAgICAgICAgIHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEuZG9sbGFyQnJhY2VMKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICsrdGhpcy5wb3M7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuZmluaXNoVG9rZW4odHlwZXMkMS5iYWNrUXVvdGUpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIG91dCArPSB0aGlzLmlucHV0LnNsaWNlKGNodW5rU3RhcnQsIHRoaXMucG9zKTtcbiAgICAgIHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEudGVtcGxhdGUsIG91dClcbiAgICB9XG4gICAgaWYgKGNoID09PSA5MikgeyAvLyAnXFwnXG4gICAgICBvdXQgKz0gdGhpcy5pbnB1dC5zbGljZShjaHVua1N0YXJ0LCB0aGlzLnBvcyk7XG4gICAgICBvdXQgKz0gdGhpcy5yZWFkRXNjYXBlZENoYXIodHJ1ZSk7XG4gICAgICBjaHVua1N0YXJ0ID0gdGhpcy5wb3M7XG4gICAgfSBlbHNlIGlmIChpc05ld0xpbmUoY2gpKSB7XG4gICAgICBvdXQgKz0gdGhpcy5pbnB1dC5zbGljZShjaHVua1N0YXJ0LCB0aGlzLnBvcyk7XG4gICAgICArK3RoaXMucG9zO1xuICAgICAgc3dpdGNoIChjaCkge1xuICAgICAgY2FzZSAxMzpcbiAgICAgICAgaWYgKHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcykgPT09IDEwKSB7ICsrdGhpcy5wb3M7IH1cbiAgICAgIGNhc2UgMTA6XG4gICAgICAgIG91dCArPSBcIlxcblwiO1xuICAgICAgICBicmVha1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgb3V0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoY2gpO1xuICAgICAgICBicmVha1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5sb2NhdGlvbnMpIHtcbiAgICAgICAgKyt0aGlzLmN1ckxpbmU7XG4gICAgICAgIHRoaXMubGluZVN0YXJ0ID0gdGhpcy5wb3M7XG4gICAgICB9XG4gICAgICBjaHVua1N0YXJ0ID0gdGhpcy5wb3M7XG4gICAgfSBlbHNlIHtcbiAgICAgICsrdGhpcy5wb3M7XG4gICAgfVxuICB9XG59O1xuXG4vLyBSZWFkcyBhIHRlbXBsYXRlIHRva2VuIHRvIHNlYXJjaCBmb3IgdGhlIGVuZCwgd2l0aG91dCB2YWxpZGF0aW5nIGFueSBlc2NhcGUgc2VxdWVuY2VzXG5wcC5yZWFkSW52YWxpZFRlbXBsYXRlVG9rZW4gPSBmdW5jdGlvbigpIHtcbiAgZm9yICg7IHRoaXMucG9zIDwgdGhpcy5pbnB1dC5sZW5ndGg7IHRoaXMucG9zKyspIHtcbiAgICBzd2l0Y2ggKHRoaXMuaW5wdXRbdGhpcy5wb3NdKSB7XG4gICAgY2FzZSBcIlxcXFxcIjpcbiAgICAgICsrdGhpcy5wb3M7XG4gICAgICBicmVha1xuXG4gICAgY2FzZSBcIiRcIjpcbiAgICAgIGlmICh0aGlzLmlucHV0W3RoaXMucG9zICsgMV0gIT09IFwie1wiKSB7IGJyZWFrIH1cbiAgICAgIC8vIGZhbGwgdGhyb3VnaFxuICAgIGNhc2UgXCJgXCI6XG4gICAgICByZXR1cm4gdGhpcy5maW5pc2hUb2tlbih0eXBlcyQxLmludmFsaWRUZW1wbGF0ZSwgdGhpcy5pbnB1dC5zbGljZSh0aGlzLnN0YXJ0LCB0aGlzLnBvcykpXG5cbiAgICBjYXNlIFwiXFxyXCI6XG4gICAgICBpZiAodGhpcy5pbnB1dFt0aGlzLnBvcyArIDFdID09PSBcIlxcblwiKSB7ICsrdGhpcy5wb3M7IH1cbiAgICAgIC8vIGZhbGwgdGhyb3VnaFxuICAgIGNhc2UgXCJcXG5cIjogY2FzZSBcIlxcdTIwMjhcIjogY2FzZSBcIlxcdTIwMjlcIjpcbiAgICAgICsrdGhpcy5jdXJMaW5lO1xuICAgICAgdGhpcy5saW5lU3RhcnQgPSB0aGlzLnBvcyArIDE7XG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuICB0aGlzLnJhaXNlKHRoaXMuc3RhcnQsIFwiVW50ZXJtaW5hdGVkIHRlbXBsYXRlXCIpO1xufTtcblxuLy8gVXNlZCB0byByZWFkIGVzY2FwZWQgY2hhcmFjdGVyc1xuXG5wcC5yZWFkRXNjYXBlZENoYXIgPSBmdW5jdGlvbihpblRlbXBsYXRlKSB7XG4gIHZhciBjaCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCgrK3RoaXMucG9zKTtcbiAgKyt0aGlzLnBvcztcbiAgc3dpdGNoIChjaCkge1xuICBjYXNlIDExMDogcmV0dXJuIFwiXFxuXCIgLy8gJ24nIC0+ICdcXG4nXG4gIGNhc2UgMTE0OiByZXR1cm4gXCJcXHJcIiAvLyAncicgLT4gJ1xccidcbiAgY2FzZSAxMjA6IHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKHRoaXMucmVhZEhleENoYXIoMikpIC8vICd4J1xuICBjYXNlIDExNzogcmV0dXJuIGNvZGVQb2ludFRvU3RyaW5nKHRoaXMucmVhZENvZGVQb2ludCgpKSAvLyAndSdcbiAgY2FzZSAxMTY6IHJldHVybiBcIlxcdFwiIC8vICd0JyAtPiAnXFx0J1xuICBjYXNlIDk4OiByZXR1cm4gXCJcXGJcIiAvLyAnYicgLT4gJ1xcYidcbiAgY2FzZSAxMTg6IHJldHVybiBcIlxcdTAwMGJcIiAvLyAndicgLT4gJ1xcdTAwMGInXG4gIGNhc2UgMTAyOiByZXR1cm4gXCJcXGZcIiAvLyAnZicgLT4gJ1xcZidcbiAgY2FzZSAxMzogaWYgKHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcykgPT09IDEwKSB7ICsrdGhpcy5wb3M7IH0gLy8gJ1xcclxcbidcbiAgY2FzZSAxMDogLy8gJyBcXG4nXG4gICAgaWYgKHRoaXMub3B0aW9ucy5sb2NhdGlvbnMpIHsgdGhpcy5saW5lU3RhcnQgPSB0aGlzLnBvczsgKyt0aGlzLmN1ckxpbmU7IH1cbiAgICByZXR1cm4gXCJcIlxuICBjYXNlIDU2OlxuICBjYXNlIDU3OlxuICAgIGlmICh0aGlzLnN0cmljdCkge1xuICAgICAgdGhpcy5pbnZhbGlkU3RyaW5nVG9rZW4oXG4gICAgICAgIHRoaXMucG9zIC0gMSxcbiAgICAgICAgXCJJbnZhbGlkIGVzY2FwZSBzZXF1ZW5jZVwiXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoaW5UZW1wbGF0ZSkge1xuICAgICAgdmFyIGNvZGVQb3MgPSB0aGlzLnBvcyAtIDE7XG5cbiAgICAgIHRoaXMuaW52YWxpZFN0cmluZ1Rva2VuKFxuICAgICAgICBjb2RlUG9zLFxuICAgICAgICBcIkludmFsaWQgZXNjYXBlIHNlcXVlbmNlIGluIHRlbXBsYXRlIHN0cmluZ1wiXG4gICAgICApO1xuICAgIH1cbiAgZGVmYXVsdDpcbiAgICBpZiAoY2ggPj0gNDggJiYgY2ggPD0gNTUpIHtcbiAgICAgIHZhciBvY3RhbFN0ciA9IHRoaXMuaW5wdXQuc3Vic3RyKHRoaXMucG9zIC0gMSwgMykubWF0Y2goL15bMC03XSsvKVswXTtcbiAgICAgIHZhciBvY3RhbCA9IHBhcnNlSW50KG9jdGFsU3RyLCA4KTtcbiAgICAgIGlmIChvY3RhbCA+IDI1NSkge1xuICAgICAgICBvY3RhbFN0ciA9IG9jdGFsU3RyLnNsaWNlKDAsIC0xKTtcbiAgICAgICAgb2N0YWwgPSBwYXJzZUludChvY3RhbFN0ciwgOCk7XG4gICAgICB9XG4gICAgICB0aGlzLnBvcyArPSBvY3RhbFN0ci5sZW5ndGggLSAxO1xuICAgICAgY2ggPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MpO1xuICAgICAgaWYgKChvY3RhbFN0ciAhPT0gXCIwXCIgfHwgY2ggPT09IDU2IHx8IGNoID09PSA1NykgJiYgKHRoaXMuc3RyaWN0IHx8IGluVGVtcGxhdGUpKSB7XG4gICAgICAgIHRoaXMuaW52YWxpZFN0cmluZ1Rva2VuKFxuICAgICAgICAgIHRoaXMucG9zIC0gMSAtIG9jdGFsU3RyLmxlbmd0aCxcbiAgICAgICAgICBpblRlbXBsYXRlXG4gICAgICAgICAgICA/IFwiT2N0YWwgbGl0ZXJhbCBpbiB0ZW1wbGF0ZSBzdHJpbmdcIlxuICAgICAgICAgICAgOiBcIk9jdGFsIGxpdGVyYWwgaW4gc3RyaWN0IG1vZGVcIlxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUob2N0YWwpXG4gICAgfVxuICAgIGlmIChpc05ld0xpbmUoY2gpKSB7XG4gICAgICAvLyBVbmljb2RlIG5ldyBsaW5lIGNoYXJhY3RlcnMgYWZ0ZXIgXFwgZ2V0IHJlbW92ZWQgZnJvbSBvdXRwdXQgaW4gYm90aFxuICAgICAgLy8gdGVtcGxhdGUgbGl0ZXJhbHMgYW5kIHN0cmluZ3NcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMubG9jYXRpb25zKSB7IHRoaXMubGluZVN0YXJ0ID0gdGhpcy5wb3M7ICsrdGhpcy5jdXJMaW5lOyB9XG4gICAgICByZXR1cm4gXCJcIlxuICAgIH1cbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShjaClcbiAgfVxufTtcblxuLy8gVXNlZCB0byByZWFkIGNoYXJhY3RlciBlc2NhcGUgc2VxdWVuY2VzICgnXFx4JywgJ1xcdScsICdcXFUnKS5cblxucHAucmVhZEhleENoYXIgPSBmdW5jdGlvbihsZW4pIHtcbiAgdmFyIGNvZGVQb3MgPSB0aGlzLnBvcztcbiAgdmFyIG4gPSB0aGlzLnJlYWRJbnQoMTYsIGxlbik7XG4gIGlmIChuID09PSBudWxsKSB7IHRoaXMuaW52YWxpZFN0cmluZ1Rva2VuKGNvZGVQb3MsIFwiQmFkIGNoYXJhY3RlciBlc2NhcGUgc2VxdWVuY2VcIik7IH1cbiAgcmV0dXJuIG5cbn07XG5cbi8vIFJlYWQgYW4gaWRlbnRpZmllciwgYW5kIHJldHVybiBpdCBhcyBhIHN0cmluZy4gU2V0cyBgdGhpcy5jb250YWluc0VzY2Bcbi8vIHRvIHdoZXRoZXIgdGhlIHdvcmQgY29udGFpbmVkIGEgJ1xcdScgZXNjYXBlLlxuLy9cbi8vIEluY3JlbWVudGFsbHkgYWRkcyBvbmx5IGVzY2FwZWQgY2hhcnMsIGFkZGluZyBvdGhlciBjaHVua3MgYXMtaXNcbi8vIGFzIGEgbWljcm8tb3B0aW1pemF0aW9uLlxuXG5wcC5yZWFkV29yZDEgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5jb250YWluc0VzYyA9IGZhbHNlO1xuICB2YXIgd29yZCA9IFwiXCIsIGZpcnN0ID0gdHJ1ZSwgY2h1bmtTdGFydCA9IHRoaXMucG9zO1xuICB2YXIgYXN0cmFsID0gdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDY7XG4gIHdoaWxlICh0aGlzLnBvcyA8IHRoaXMuaW5wdXQubGVuZ3RoKSB7XG4gICAgdmFyIGNoID0gdGhpcy5mdWxsQ2hhckNvZGVBdFBvcygpO1xuICAgIGlmIChpc0lkZW50aWZpZXJDaGFyKGNoLCBhc3RyYWwpKSB7XG4gICAgICB0aGlzLnBvcyArPSBjaCA8PSAweGZmZmYgPyAxIDogMjtcbiAgICB9IGVsc2UgaWYgKGNoID09PSA5MikgeyAvLyBcIlxcXCJcbiAgICAgIHRoaXMuY29udGFpbnNFc2MgPSB0cnVlO1xuICAgICAgd29yZCArPSB0aGlzLmlucHV0LnNsaWNlKGNodW5rU3RhcnQsIHRoaXMucG9zKTtcbiAgICAgIHZhciBlc2NTdGFydCA9IHRoaXMucG9zO1xuICAgICAgaWYgKHRoaXMuaW5wdXQuY2hhckNvZGVBdCgrK3RoaXMucG9zKSAhPT0gMTE3KSAvLyBcInVcIlxuICAgICAgICB7IHRoaXMuaW52YWxpZFN0cmluZ1Rva2VuKHRoaXMucG9zLCBcIkV4cGVjdGluZyBVbmljb2RlIGVzY2FwZSBzZXF1ZW5jZSBcXFxcdVhYWFhcIik7IH1cbiAgICAgICsrdGhpcy5wb3M7XG4gICAgICB2YXIgZXNjID0gdGhpcy5yZWFkQ29kZVBvaW50KCk7XG4gICAgICBpZiAoIShmaXJzdCA/IGlzSWRlbnRpZmllclN0YXJ0IDogaXNJZGVudGlmaWVyQ2hhcikoZXNjLCBhc3RyYWwpKVxuICAgICAgICB7IHRoaXMuaW52YWxpZFN0cmluZ1Rva2VuKGVzY1N0YXJ0LCBcIkludmFsaWQgVW5pY29kZSBlc2NhcGVcIik7IH1cbiAgICAgIHdvcmQgKz0gY29kZVBvaW50VG9TdHJpbmcoZXNjKTtcbiAgICAgIGNodW5rU3RhcnQgPSB0aGlzLnBvcztcbiAgICB9IGVsc2Uge1xuICAgICAgYnJlYWtcbiAgICB9XG4gICAgZmlyc3QgPSBmYWxzZTtcbiAgfVxuICByZXR1cm4gd29yZCArIHRoaXMuaW5wdXQuc2xpY2UoY2h1bmtTdGFydCwgdGhpcy5wb3MpXG59O1xuXG4vLyBSZWFkIGFuIGlkZW50aWZpZXIgb3Iga2V5d29yZCB0b2tlbi4gV2lsbCBjaGVjayBmb3IgcmVzZXJ2ZWRcbi8vIHdvcmRzIHdoZW4gbmVjZXNzYXJ5LlxuXG5wcC5yZWFkV29yZCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgd29yZCA9IHRoaXMucmVhZFdvcmQxKCk7XG4gIHZhciB0eXBlID0gdHlwZXMkMS5uYW1lO1xuICBpZiAodGhpcy5rZXl3b3Jkcy50ZXN0KHdvcmQpKSB7XG4gICAgdHlwZSA9IGtleXdvcmRzW3dvcmRdO1xuICB9XG4gIHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGUsIHdvcmQpXG59O1xuXG4vLyBBY29ybiBpcyBhIHRpbnksIGZhc3QgSmF2YVNjcmlwdCBwYXJzZXIgd3JpdHRlbiBpbiBKYXZhU2NyaXB0LlxuLy9cbi8vIEFjb3JuIHdhcyB3cml0dGVuIGJ5IE1hcmlqbiBIYXZlcmJla2UsIEluZ3ZhciBTdGVwYW55YW4sIGFuZFxuLy8gdmFyaW91cyBjb250cmlidXRvcnMgYW5kIHJlbGVhc2VkIHVuZGVyIGFuIE1JVCBsaWNlbnNlLlxuLy9cbi8vIEdpdCByZXBvc2l0b3JpZXMgZm9yIEFjb3JuIGFyZSBhdmFpbGFibGUgYXRcbi8vXG4vLyAgICAgaHR0cDovL21hcmlqbmhhdmVyYmVrZS5ubC9naXQvYWNvcm5cbi8vICAgICBodHRwczovL2dpdGh1Yi5jb20vYWNvcm5qcy9hY29ybi5naXRcbi8vXG4vLyBQbGVhc2UgdXNlIHRoZSBbZ2l0aHViIGJ1ZyB0cmFja2VyXVtnaGJ0XSB0byByZXBvcnQgaXNzdWVzLlxuLy9cbi8vIFtnaGJ0XTogaHR0cHM6Ly9naXRodWIuY29tL2Fjb3JuanMvYWNvcm4vaXNzdWVzXG5cblxudmFyIHZlcnNpb24gPSBcIjguMTUuMFwiO1xuXG5QYXJzZXIuYWNvcm4gPSB7XG4gIFBhcnNlcjogUGFyc2VyLFxuICB2ZXJzaW9uOiB2ZXJzaW9uLFxuICBkZWZhdWx0T3B0aW9uczogZGVmYXVsdE9wdGlvbnMsXG4gIFBvc2l0aW9uOiBQb3NpdGlvbixcbiAgU291cmNlTG9jYXRpb246IFNvdXJjZUxvY2F0aW9uLFxuICBnZXRMaW5lSW5mbzogZ2V0TGluZUluZm8sXG4gIE5vZGU6IE5vZGUsXG4gIFRva2VuVHlwZTogVG9rZW5UeXBlLFxuICB0b2tUeXBlczogdHlwZXMkMSxcbiAga2V5d29yZFR5cGVzOiBrZXl3b3JkcyxcbiAgVG9rQ29udGV4dDogVG9rQ29udGV4dCxcbiAgdG9rQ29udGV4dHM6IHR5cGVzLFxuICBpc0lkZW50aWZpZXJDaGFyOiBpc0lkZW50aWZpZXJDaGFyLFxuICBpc0lkZW50aWZpZXJTdGFydDogaXNJZGVudGlmaWVyU3RhcnQsXG4gIFRva2VuOiBUb2tlbixcbiAgaXNOZXdMaW5lOiBpc05ld0xpbmUsXG4gIGxpbmVCcmVhazogbGluZUJyZWFrLFxuICBsaW5lQnJlYWtHOiBsaW5lQnJlYWtHLFxuICBub25BU0NJSXdoaXRlc3BhY2U6IG5vbkFTQ0lJd2hpdGVzcGFjZVxufTtcblxuLy8gVGhlIG1haW4gZXhwb3J0ZWQgaW50ZXJmYWNlICh1bmRlciBgc2VsZi5hY29ybmAgd2hlbiBpbiB0aGVcbi8vIGJyb3dzZXIpIGlzIGEgYHBhcnNlYCBmdW5jdGlvbiB0aGF0IHRha2VzIGEgY29kZSBzdHJpbmcgYW5kIHJldHVybnNcbi8vIGFuIGFic3RyYWN0IHN5bnRheCB0cmVlIGFzIHNwZWNpZmllZCBieSB0aGUgW0VTVHJlZSBzcGVjXVtlc3RyZWVdLlxuLy9cbi8vIFtlc3RyZWVdOiBodHRwczovL2dpdGh1Yi5jb20vZXN0cmVlL2VzdHJlZVxuXG5mdW5jdGlvbiBwYXJzZShpbnB1dCwgb3B0aW9ucykge1xuICByZXR1cm4gUGFyc2VyLnBhcnNlKGlucHV0LCBvcHRpb25zKVxufVxuXG4vLyBUaGlzIGZ1bmN0aW9uIHRyaWVzIHRvIHBhcnNlIGEgc2luZ2xlIGV4cHJlc3Npb24gYXQgYSBnaXZlblxuLy8gb2Zmc2V0IGluIGEgc3RyaW5nLiBVc2VmdWwgZm9yIHBhcnNpbmcgbWl4ZWQtbGFuZ3VhZ2UgZm9ybWF0c1xuLy8gdGhhdCBlbWJlZCBKYXZhU2NyaXB0IGV4cHJlc3Npb25zLlxuXG5mdW5jdGlvbiBwYXJzZUV4cHJlc3Npb25BdChpbnB1dCwgcG9zLCBvcHRpb25zKSB7XG4gIHJldHVybiBQYXJzZXIucGFyc2VFeHByZXNzaW9uQXQoaW5wdXQsIHBvcywgb3B0aW9ucylcbn1cblxuLy8gQWNvcm4gaXMgb3JnYW5pemVkIGFzIGEgdG9rZW5pemVyIGFuZCBhIHJlY3Vyc2l2ZS1kZXNjZW50IHBhcnNlci5cbi8vIFRoZSBgdG9rZW5pemVyYCBleHBvcnQgcHJvdmlkZXMgYW4gaW50ZXJmYWNlIHRvIHRoZSB0b2tlbml6ZXIuXG5cbmZ1bmN0aW9uIHRva2VuaXplcihpbnB1dCwgb3B0aW9ucykge1xuICByZXR1cm4gUGFyc2VyLnRva2VuaXplcihpbnB1dCwgb3B0aW9ucylcbn1cblxuZXhwb3J0IHsgTm9kZSwgUGFyc2VyLCBQb3NpdGlvbiwgU291cmNlTG9jYXRpb24sIFRva0NvbnRleHQsIFRva2VuLCBUb2tlblR5cGUsIGRlZmF1bHRPcHRpb25zLCBnZXRMaW5lSW5mbywgaXNJZGVudGlmaWVyQ2hhciwgaXNJZGVudGlmaWVyU3RhcnQsIGlzTmV3TGluZSwga2V5d29yZHMgYXMga2V5d29yZFR5cGVzLCBsaW5lQnJlYWssIGxpbmVCcmVha0csIG5vbkFTQ0lJd2hpdGVzcGFjZSwgcGFyc2UsIHBhcnNlRXhwcmVzc2lvbkF0LCB0eXBlcyBhcyB0b2tDb250ZXh0cywgdHlwZXMkMSBhcyB0b2tUeXBlcywgdG9rZW5pemVyLCB2ZXJzaW9uIH07XG4iLCAiaW1wb3J0IHsgcGFyc2UgYXMgYWNvcm5QYXJzZSB9IGZyb20gXCJhY29yblwiO1xuXG5cbi8qKiBMb29zZSBBU1Qgbm9kZSB0eXBlIFx1MjAxNCBhY29ybiBub2RlcyB3aXRoIGB0eXBlYCwgYHN0YXJ0YCwgYGVuZGAgKyBhcmJpdHJhcnkgZmllbGRzLiAqL1xuZXhwb3J0IHR5cGUgQXN0Tm9kZSA9IHsgdHlwZTogc3RyaW5nOyBzdGFydDogbnVtYmVyOyBlbmQ6IG51bWJlcjsgW2s6IHN0cmluZ106IGFueSB9O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFNjb3BlIHZhbGlkYXRpb25cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5leHBvcnQgY29uc3QgdmFsaWRhdGVTY29wZXMgPSAocHJvZ3JhbTogQXN0Tm9kZSwgYWxsb3dlZEdsb2JhbHM6IHN0cmluZ1tdID0gW10pID0+IHtcbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBnbG9iYWxzID0gbmV3IFNldChhbGxvd2VkR2xvYmFscyk7XG4gIGNvbnN0IHNjb3BlczogQXJyYXk8U2V0PHN0cmluZz4+ID0gW25ldyBTZXQoKV07XG5cbiAgY29uc3QgZGVjbGFyZSA9IChuYW1lOiBzdHJpbmcpID0+IHNjb3Blc1tzY29wZXMubGVuZ3RoIC0gMV0uYWRkKG5hbWUpO1xuICBjb25zdCBpc0RlY2xhcmVkID0gKG5hbWU6IHN0cmluZykgPT4gc2NvcGVzLnNvbWUoKHMpID0+IHMuaGFzKG5hbWUpKSB8fCBnbG9iYWxzLmhhcyhuYW1lKTtcbiAgY29uc3QgZW50ZXIgPSAoKSA9PiBzY29wZXMucHVzaChuZXcgU2V0KCkpO1xuICBjb25zdCBleGl0ID0gKCkgPT4geyBzY29wZXMucG9wKCk7IH07XG4gIGNvbnN0IGNoZWNrSWRlbnQgPSAobmFtZTogc3RyaW5nKSA9PiB7XG4gICAgaWYgKCFpc0RlY2xhcmVkKG5hbWUpKSBlcnJvcnMucHVzaChgdW5kZWNsYXJlZDogJHtuYW1lfWApO1xuICB9O1xuXG4gIGNvbnN0IGRlY2xhcmVQYXR0ZXJuID0gKHA6IEFzdE5vZGUpID0+IHtcbiAgICBpZiAocC50eXBlID09PSBcIklkZW50aWZpZXJcIikgZGVjbGFyZShwLm5hbWUpO1xuICAgIGVsc2UgaWYgKHAudHlwZSA9PT0gXCJBc3NpZ25tZW50UGF0dGVyblwiKSBkZWNsYXJlUGF0dGVybihwLmxlZnQpO1xuICAgIGVsc2UgaWYgKHAudHlwZSA9PT0gXCJSZXN0RWxlbWVudFwiKSBkZWNsYXJlUGF0dGVybihwLmFyZ3VtZW50KTtcbiAgICBlbHNlIGlmIChwLnR5cGUgPT09IFwiQXJyYXlQYXR0ZXJuXCIpIChwLmVsZW1lbnRzIGFzIEFzdE5vZGVbXSkuZm9yRWFjaChkZWNsYXJlUGF0dGVybik7XG4gICAgZWxzZSBpZiAocC50eXBlID09PSBcIk9iamVjdFBhdHRlcm5cIikgKHAucHJvcGVydGllcyBhcyBBc3ROb2RlW10pLmZvckVhY2goKHByb3ApID0+IHtcbiAgICAgIGlmIChwcm9wLnR5cGUgPT09IFwiUmVzdEVsZW1lbnRcIikgZGVjbGFyZVBhdHRlcm4ocHJvcC5hcmd1bWVudCk7XG4gICAgICBlbHNlIGRlY2xhcmVQYXR0ZXJuKHByb3AudmFsdWUpO1xuICAgIH0pO1xuICB9O1xuXG4gIGNvbnN0IHZpc2l0RXhwciA9IChlOiBBc3ROb2RlKTogdm9pZCA9PiB7XG4gICAgaWYgKCFlKSByZXR1cm47XG4gICAgc3dpdGNoIChlLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJJZGVudGlmaWVyXCI6XG4gICAgICAgIGNoZWNrSWRlbnQoZS5uYW1lKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkxpdGVyYWxcIjpcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlNwcmVhZEVsZW1lbnRcIjpcbiAgICAgICAgdmlzaXRFeHByKGUuYXJndW1lbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQXJyYXlFeHByZXNzaW9uXCI6XG4gICAgICAgIChlLmVsZW1lbnRzIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgoZWwpID0+IGVsICYmIHZpc2l0RXhwcihlbCkpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiT2JqZWN0RXhwcmVzc2lvblwiOlxuICAgICAgICAoZS5wcm9wZXJ0aWVzIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgocCkgPT4ge1xuICAgICAgICAgIGlmIChwLnR5cGUgPT09IFwiU3ByZWFkRWxlbWVudFwiKSB2aXNpdEV4cHIocC5hcmd1bWVudCk7XG4gICAgICAgICAgZWxzZSB2aXNpdEV4cHIocC52YWx1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQXdhaXRFeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLmFyZ3VtZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkNoYWluRXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5leHByZXNzaW9uKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIk5ld0V4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUuY2FsbGVlKTtcbiAgICAgICAgKGUuYXJndW1lbnRzIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgoYSkgPT4gdmlzaXRFeHByKGEpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkNhbGxFeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLmNhbGxlZSk7XG4gICAgICAgIChlLmFyZ3VtZW50cyBhcyBBc3ROb2RlW10pLmZvckVhY2goKGEpID0+IHZpc2l0RXhwcihhKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLm9iamVjdCk7XG4gICAgICAgIGlmIChlLmNvbXB1dGVkKSB2aXNpdEV4cHIoZS5wcm9wZXJ0eSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJBc3NpZ25tZW50RXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5sZWZ0KTtcbiAgICAgICAgdmlzaXRFeHByKGUucmlnaHQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiVXBkYXRlRXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5hcmd1bWVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJCaW5hcnlFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiTG9naWNhbEV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUubGVmdCk7XG4gICAgICAgIHZpc2l0RXhwcihlLnJpZ2h0KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlVuYXJ5RXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5hcmd1bWVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJDb25kaXRpb25hbEV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUudGVzdCk7XG4gICAgICAgIHZpc2l0RXhwcihlLmNvbnNlcXVlbnQpO1xuICAgICAgICB2aXNpdEV4cHIoZS5hbHRlcm5hdGUpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQXJyb3dGdW5jdGlvbkV4cHJlc3Npb25cIjpcbiAgICAgICAgZW50ZXIoKTtcbiAgICAgICAgKGUucGFyYW1zIGFzIEFzdE5vZGVbXSkuZm9yRWFjaChkZWNsYXJlUGF0dGVybik7XG4gICAgICAgIGlmIChlLmJvZHkudHlwZSA9PT0gXCJCbG9ja1N0YXRlbWVudFwiKSB2aXNpdFN0bXQoZS5ib2R5KTtcbiAgICAgICAgZWxzZSB2aXNpdEV4cHIoZS5ib2R5KTtcbiAgICAgICAgZXhpdCgpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHZpc2l0VmFyRGVjbCA9IChkOiBBc3ROb2RlKSA9PiB7XG4gICAgZGVjbGFyZVBhdHRlcm4oZC5pZCk7XG4gICAgaWYgKGQuaW5pdCkgdmlzaXRFeHByKGQuaW5pdCk7XG4gIH07XG5cbiAgY29uc3QgdmlzaXRTdG10ID0gKHM6IEFzdE5vZGUpOiB2b2lkID0+IHtcbiAgICBzd2l0Y2ggKHMudHlwZSkge1xuICAgICAgY2FzZSBcIkJsb2NrU3RhdGVtZW50XCI6XG4gICAgICAgIGVudGVyKCk7XG4gICAgICAgIChzLmJvZHkgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKHZpc2l0U3RtdCk7XG4gICAgICAgIGV4aXQoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkV4cHJlc3Npb25TdGF0ZW1lbnRcIjpcbiAgICAgICAgdmlzaXRFeHByKHMuZXhwcmVzc2lvbik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJJZlN0YXRlbWVudFwiOlxuICAgICAgICB2aXNpdEV4cHIocy50ZXN0KTtcbiAgICAgICAgdmlzaXRTdG10KHMuY29uc2VxdWVudCk7XG4gICAgICAgIGlmIChzLmFsdGVybmF0ZSkgdmlzaXRTdG10KHMuYWx0ZXJuYXRlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlJldHVyblN0YXRlbWVudFwiOlxuICAgICAgICBpZiAocy5hcmd1bWVudCkgdmlzaXRFeHByKHMuYXJndW1lbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiVGhyb3dTdGF0ZW1lbnRcIjpcbiAgICAgICAgaWYgKHMuYXJndW1lbnQpIHZpc2l0RXhwcihzLmFyZ3VtZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIjpcbiAgICAgICAgKHMuZGVjbGFyYXRpb25zIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCh2aXNpdFZhckRlY2wpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiV2hpbGVTdGF0ZW1lbnRcIjpcbiAgICAgICAgdmlzaXRFeHByKHMudGVzdCk7XG4gICAgICAgIHZpc2l0U3RtdChzLmJvZHkpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiRm9yU3RhdGVtZW50XCI6IHtcbiAgICAgICAgZW50ZXIoKTtcbiAgICAgICAgaWYgKHMuaW5pdD8udHlwZSA9PT0gXCJWYXJpYWJsZURlY2xhcmF0aW9uXCIpIChzLmluaXQuZGVjbGFyYXRpb25zIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCh2aXNpdFZhckRlY2wpO1xuICAgICAgICBlbHNlIGlmIChzLmluaXQpIHZpc2l0RXhwcihzLmluaXQpO1xuICAgICAgICBpZiAocy50ZXN0KSB2aXNpdEV4cHIocy50ZXN0KTtcbiAgICAgICAgaWYgKHMudXBkYXRlKSB2aXNpdEV4cHIocy51cGRhdGUpO1xuICAgICAgICB2aXNpdFN0bXQocy5ib2R5KTtcbiAgICAgICAgZXhpdCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjYXNlIFwiRm9ySW5TdGF0ZW1lbnRcIjpcbiAgICAgIGNhc2UgXCJGb3JPZlN0YXRlbWVudFwiOiB7XG4gICAgICAgIGVudGVyKCk7XG4gICAgICAgIGlmIChzLmxlZnQudHlwZSA9PT0gXCJWYXJpYWJsZURlY2xhcmF0aW9uXCIpIChzLmxlZnQuZGVjbGFyYXRpb25zIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCh2aXNpdFZhckRlY2wpO1xuICAgICAgICBlbHNlIHZpc2l0RXhwcihzLmxlZnQpO1xuICAgICAgICB2aXNpdEV4cHIocy5yaWdodCk7XG4gICAgICAgIHZpc2l0U3RtdChzLmJvZHkpO1xuICAgICAgICBleGl0KCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJTd2l0Y2hTdGF0ZW1lbnRcIjoge1xuICAgICAgICB2aXNpdEV4cHIocy5kaXNjcmltaW5hbnQpO1xuICAgICAgICBlbnRlcigpO1xuICAgICAgICAocy5jYXNlcyBhcyBBc3ROb2RlW10pLmZvckVhY2goKGMpID0+IHtcbiAgICAgICAgICBpZiAoYy50ZXN0KSB2aXNpdEV4cHIoYy50ZXN0KTtcbiAgICAgICAgICAoYy5jb25zZXF1ZW50IGFzIEFzdE5vZGVbXSkuZm9yRWFjaCh2aXNpdFN0bXQpO1xuICAgICAgICB9KTtcbiAgICAgICAgZXhpdCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjYXNlIFwiVHJ5U3RhdGVtZW50XCI6XG4gICAgICAgIHZpc2l0U3RtdChzLmJsb2NrKTtcbiAgICAgICAgaWYgKHMuaGFuZGxlcikge1xuICAgICAgICAgIGVudGVyKCk7XG4gICAgICAgICAgaWYgKHMuaGFuZGxlci5wYXJhbSkgZGVjbGFyZVBhdHRlcm4ocy5oYW5kbGVyLnBhcmFtKTtcbiAgICAgICAgICB2aXNpdFN0bXQocy5oYW5kbGVyLmJvZHkpO1xuICAgICAgICAgIGV4aXQoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocy5maW5hbGl6ZXIpIHZpc2l0U3RtdChzLmZpbmFsaXplcik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJCcmVha1N0YXRlbWVudFwiOlxuICAgICAgY2FzZSBcIkNvbnRpbnVlU3RhdGVtZW50XCI6XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gIH07XG5cbiAgKHByb2dyYW0uYm9keSBhcyBBc3ROb2RlW10pLmZvckVhY2godmlzaXRTdG10KTtcbiAgcmV0dXJuIGVycm9ycztcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gUHJvdG90eXBlIGFjY2VzcyB2YWxpZGF0aW9uXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZXhwb3J0IGNvbnN0IHZhbGlkYXRlTm9Qcm90b3R5cGUgPSAocHJvZ3JhbTogQXN0Tm9kZSkgPT4ge1xuICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IGZvcmJpZGRlbk1lbWJlcnMgPSBuZXcgU2V0KFtcInByb3RvdHlwZVwiLCBcImNvbnN0cnVjdG9yXCIsIFwiX19wcm90b19fXCJdKTtcblxuICBjb25zdCB2aXNpdEV4cHIgPSAoZTogQXN0Tm9kZSk6IHZvaWQgPT4ge1xuICAgIGlmICghZSkgcmV0dXJuO1xuICAgIHN3aXRjaCAoZS50eXBlKSB7XG4gICAgICBjYXNlIFwiTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgICBpZiAoIWUuY29tcHV0ZWQgJiYgZS5wcm9wZXJ0eS50eXBlID09PSBcIklkZW50aWZpZXJcIiAmJiBmb3JiaWRkZW5NZW1iZXJzLmhhcyhlLnByb3BlcnR5Lm5hbWUpKSB7XG4gICAgICAgICAgZXJyb3JzLnB1c2goXCJwcm90b3R5cGUgYWNjZXNzXCIpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvbXB1dGVkIGFjY2VzcyBpcyBhbGxvd2VkIFx1MjAxNCBydW50aW1lIF9fY2hrIGd1YXJkcyBhZ2FpbnN0IGZvcmJpZGRlbiBrZXlzXG4gICAgICAgIHZpc2l0RXhwcihlLm9iamVjdCk7XG4gICAgICAgIGlmIChlLmNvbXB1dGVkKSB2aXNpdEV4cHIoZS5wcm9wZXJ0eSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJTcHJlYWRFbGVtZW50XCI6XG4gICAgICAgIHZpc2l0RXhwcihlLmFyZ3VtZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIk5ld0V4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUuY2FsbGVlKTtcbiAgICAgICAgKGUuYXJndW1lbnRzIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgoYSkgPT4gdmlzaXRFeHByKGEpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkNhbGxFeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLmNhbGxlZSk7XG4gICAgICAgIChlLmFyZ3VtZW50cyBhcyBBc3ROb2RlW10pLmZvckVhY2goKGEpID0+IHZpc2l0RXhwcihhKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJBd2FpdEV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUuYXJndW1lbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQ2hhaW5FeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLmV4cHJlc3Npb24pO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQXJyYXlFeHByZXNzaW9uXCI6XG4gICAgICAgIChlLmVsZW1lbnRzIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgoZWwpID0+IGVsICYmIHZpc2l0RXhwcihlbCkpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiT2JqZWN0RXhwcmVzc2lvblwiOlxuICAgICAgICAoZS5wcm9wZXJ0aWVzIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgocCkgPT4ge1xuICAgICAgICAgIGlmIChwLnR5cGUgPT09IFwiU3ByZWFkRWxlbWVudFwiKSB2aXNpdEV4cHIocC5hcmd1bWVudCk7XG4gICAgICAgICAgZWxzZSB2aXNpdEV4cHIocC52YWx1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQXNzaWdubWVudEV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUubGVmdCk7XG4gICAgICAgIHZpc2l0RXhwcihlLnJpZ2h0KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlVwZGF0ZUV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUuYXJndW1lbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQmluYXJ5RXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIkxvZ2ljYWxFeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLmxlZnQpO1xuICAgICAgICB2aXNpdEV4cHIoZS5yaWdodCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJVbmFyeUV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUuYXJndW1lbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQ29uZGl0aW9uYWxFeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLnRlc3QpO1xuICAgICAgICB2aXNpdEV4cHIoZS5jb25zZXF1ZW50KTtcbiAgICAgICAgdmlzaXRFeHByKGUuYWx0ZXJuYXRlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkFycm93RnVuY3Rpb25FeHByZXNzaW9uXCI6XG4gICAgICAgIGlmIChlLmJvZHkudHlwZSA9PT0gXCJCbG9ja1N0YXRlbWVudFwiKSB2aXNpdFN0bXQoZS5ib2R5KTtcbiAgICAgICAgZWxzZSB2aXNpdEV4cHIoZS5ib2R5KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIklkZW50aWZpZXJcIjpcbiAgICAgIGNhc2UgXCJMaXRlcmFsXCI6XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgdmlzaXRTdG10ID0gKHM6IEFzdE5vZGUpOiB2b2lkID0+IHtcbiAgICBzd2l0Y2ggKHMudHlwZSkge1xuICAgICAgY2FzZSBcIkJsb2NrU3RhdGVtZW50XCI6XG4gICAgICAgIChzLmJvZHkgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKHZpc2l0U3RtdCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJFeHByZXNzaW9uU3RhdGVtZW50XCI6XG4gICAgICAgIHZpc2l0RXhwcihzLmV4cHJlc3Npb24pO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiSWZTdGF0ZW1lbnRcIjpcbiAgICAgICAgdmlzaXRFeHByKHMudGVzdCk7XG4gICAgICAgIHZpc2l0U3RtdChzLmNvbnNlcXVlbnQpO1xuICAgICAgICBpZiAocy5hbHRlcm5hdGUpIHZpc2l0U3RtdChzLmFsdGVybmF0ZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJSZXR1cm5TdGF0ZW1lbnRcIjpcbiAgICAgICAgaWYgKHMuYXJndW1lbnQpIHZpc2l0RXhwcihzLmFyZ3VtZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlRocm93U3RhdGVtZW50XCI6XG4gICAgICAgIGlmIChzLmFyZ3VtZW50KSB2aXNpdEV4cHIocy5hcmd1bWVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJWYXJpYWJsZURlY2xhcmF0aW9uXCI6XG4gICAgICAgIChzLmRlY2xhcmF0aW9ucyBhcyBBc3ROb2RlW10pLmZvckVhY2goKGQpID0+IGQuaW5pdCAmJiB2aXNpdEV4cHIoZC5pbml0KSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJXaGlsZVN0YXRlbWVudFwiOlxuICAgICAgICB2aXNpdEV4cHIocy50ZXN0KTtcbiAgICAgICAgdmlzaXRTdG10KHMuYm9keSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJGb3JTdGF0ZW1lbnRcIjpcbiAgICAgICAgaWYgKHMuaW5pdD8udHlwZSA9PT0gXCJWYXJpYWJsZURlY2xhcmF0aW9uXCIpIChzLmluaXQuZGVjbGFyYXRpb25zIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgoZDogQXN0Tm9kZSkgPT4gZC5pbml0ICYmIHZpc2l0RXhwcihkLmluaXQpKTtcbiAgICAgICAgZWxzZSBpZiAocy5pbml0KSB2aXNpdEV4cHIocy5pbml0KTtcbiAgICAgICAgaWYgKHMudGVzdCkgdmlzaXRFeHByKHMudGVzdCk7XG4gICAgICAgIGlmIChzLnVwZGF0ZSkgdmlzaXRFeHByKHMudXBkYXRlKTtcbiAgICAgICAgdmlzaXRTdG10KHMuYm9keSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJGb3JJblN0YXRlbWVudFwiOlxuICAgICAgY2FzZSBcIkZvck9mU3RhdGVtZW50XCI6XG4gICAgICAgIGlmIChzLmxlZnQudHlwZSA9PT0gXCJWYXJpYWJsZURlY2xhcmF0aW9uXCIpIChzLmxlZnQuZGVjbGFyYXRpb25zIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgoZDogQXN0Tm9kZSkgPT4gZC5pbml0ICYmIHZpc2l0RXhwcihkLmluaXQpKTtcbiAgICAgICAgZWxzZSB2aXNpdEV4cHIocy5sZWZ0KTtcbiAgICAgICAgdmlzaXRFeHByKHMucmlnaHQpO1xuICAgICAgICB2aXNpdFN0bXQocy5ib2R5KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlN3aXRjaFN0YXRlbWVudFwiOlxuICAgICAgICB2aXNpdEV4cHIocy5kaXNjcmltaW5hbnQpO1xuICAgICAgICAocy5jYXNlcyBhcyBBc3ROb2RlW10pLmZvckVhY2goKGMpID0+IHtcbiAgICAgICAgICBpZiAoYy50ZXN0KSB2aXNpdEV4cHIoYy50ZXN0KTtcbiAgICAgICAgICAoYy5jb25zZXF1ZW50IGFzIEFzdE5vZGVbXSkuZm9yRWFjaCh2aXNpdFN0bXQpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlRyeVN0YXRlbWVudFwiOlxuICAgICAgICB2aXNpdFN0bXQocy5ibG9jayk7XG4gICAgICAgIGlmIChzLmhhbmRsZXIpIHZpc2l0U3RtdChzLmhhbmRsZXIuYm9keSk7XG4gICAgICAgIGlmIChzLmZpbmFsaXplcikgdmlzaXRTdG10KHMuZmluYWxpemVyKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkJyZWFrU3RhdGVtZW50XCI6XG4gICAgICBjYXNlIFwiQ29udGludWVTdGF0ZW1lbnRcIjpcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcblxuICAocHJvZ3JhbS5ib2R5IGFzIEFzdE5vZGVbXSkuZm9yRWFjaCh2aXNpdFN0bXQpO1xuICByZXR1cm4gZXJyb3JzO1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBQYXJzZXIgXHUyMDE0IHJldHVybnMgYWNvcm4gQVNUIGRpcmVjdGx5XG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZXhwb3J0IGNvbnN0IHBhcnNlID0gKHNyYzogc3RyaW5nKTogQXN0Tm9kZSA9PiB7XG4gIHJldHVybiBhY29yblBhcnNlKHNyYywge1xuICAgIGVjbWFWZXJzaW9uOiBcImxhdGVzdFwiLFxuICAgIHNvdXJjZVR5cGU6IFwic2NyaXB0XCIsXG4gICAgYWxsb3dSZXR1cm5PdXRzaWRlRnVuY3Rpb246IHRydWUsXG4gICAgYWxsb3dBd2FpdE91dHNpZGVGdW5jdGlvbjogdHJ1ZSxcbiAgfSkgYXMgdW5rbm93biBhcyBBc3ROb2RlO1xufTtcbiIsICIvKipcbiAqIGNvZGVnZW4udHMgXHUyMDE0IFNlY3VyaXR5LWNyaXRpY2FsIGNvZGUgZ2VuZXJhdGlvbiBhbmQgcnVudGltZSBleGVjdXRpb24uXG4gKlxuICogVGFrZXMgYWNvcm4gQVNUIChmcm9tIHBhcnNlci50cykgYW5kIHByb2R1Y2VzIEphdmFTY3JpcHQgc291cmNlIHN0cmluZ3NcbiAqIGV2YWx1YXRlZCB2aWEgYG5ldyBGdW5jdGlvbigpYC4gVGhlIHJlbmRlciBmdW5jdGlvbnMgYWN0IGFzIGEgd2hpdGVsaXN0OlxuICogdW5zdXBwb3J0ZWQgbm9kZSB0eXBlcyBhcmUgcmVqZWN0ZWQgYXQgdGhlIGBkZWZhdWx0YCBicmFuY2ggb2YgZWFjaCBzd2l0Y2guXG4gKiBFdmVyeSBpZGVudGlmaWVyIGlzIHZhbGlkYXRlZCBieSBgYXNzZXJ0U2FmZUlkZW50YCBhcyBkZWZlbnNlLWluLWRlcHRoLlxuICpcbiAqIEF1ZGl0IHN1cmZhY2U6IHJlbmRlckV4cHIsIHJlbmRlclN0bXQsIHJlbmRlclBhdHRlcm4sIGFuZCB0aGUgcnVubmVyXG4gKiBmdW5jdGlvbnMgdGhhdCBpbnRlcnBvbGF0ZSBmdWVsIHJlZmVyZW5jZXMuXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBBc3ROb2RlIH0gZnJvbSBcIi4vcGFyc2VyLnRzXCI7XG5pbXBvcnQgeyBwYXJzZSwgdmFsaWRhdGVTY29wZXMsIHZhbGlkYXRlTm9Qcm90b3R5cGUgfSBmcm9tIFwiLi9wYXJzZXIudHNcIjtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBEZWZlbnNlLWluLWRlcHRoOiBpZGVudGlmaWVyIHZhbGlkYXRpb25cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5jb25zdCBTQUZFX0lERU5UX1JFID0gL15bQS1aYS16XyRdW0EtWmEtejAtOV8kXSokLztcblxuY29uc3QgRk9SQklEREVOX0lERU5UUyA9IG5ldyBTZXQoW1xuICBcImV2YWxcIiwgXCJhcmd1bWVudHNcIiwgXCJ0aGlzXCIsIFwiZ2xvYmFsVGhpc1wiLCBcIndpbmRvd1wiLCBcImRvY3VtZW50XCIsXG4gIFwicHJvY2Vzc1wiLCBcInJlcXVpcmVcIiwgXCJtb2R1bGVcIiwgXCJleHBvcnRzXCIsIFwiX19kaXJuYW1lXCIsIFwiX19maWxlbmFtZVwiLFxuICBcImltcG9ydFNjcmlwdHNcIixcbl0pO1xuXG5jb25zdCBTQUZFX0NPTlNUUlVDVE9SUyA9IG5ldyBTZXQoW1wiTWFwXCIsIFwiU2V0XCJdKTtcblxuZXhwb3J0IGNvbnN0IGFzc2VydFNhZmVJZGVudCA9IChuYW1lOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgaWYgKCFTQUZFX0lERU5UX1JFLnRlc3QobmFtZSkpXG4gICAgdGhyb3cgbmV3IEVycm9yKGB1bnNhZmUgaWRlbnRpZmllciBpbiBjb2RlZ2VuOiAke0pTT04uc3RyaW5naWZ5KG5hbWUpfWApO1xuICBpZiAoRk9SQklEREVOX0lERU5UUy5oYXMobmFtZSkpXG4gICAgdGhyb3cgbmV3IEVycm9yKGBmb3JiaWRkZW4gaWRlbnRpZmllciBpbiBjb2RlZ2VuOiAke25hbWV9YCk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIENvZGUgZ2VuZXJhdGlvbiAoYWNvcm4gQVNUIFx1MjE5MiBKUyBzb3VyY2Ugc3RyaW5nKVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNvbnN0IHJlbmRlckxpdGVyYWwgPSAobm9kZTogQXN0Tm9kZSkgPT4ge1xuICBpZiAobm9kZS5yZWdleCkge1xuICAgIGlmICh0eXBlb2Ygbm9kZS5yYXcgPT09IFwic3RyaW5nXCIgJiYgbm9kZS5yYXcuc3RhcnRzV2l0aChcIi9cIikpIHJldHVybiBub2RlLnJhdztcbiAgICBjb25zdCBwYXR0ZXJuID0gU3RyaW5nKG5vZGUucmVnZXgucGF0dGVybiA/PyBcIlwiKTtcbiAgICBjb25zdCBmbGFncyA9IFN0cmluZyhub2RlLnJlZ2V4LmZsYWdzID8/IFwiXCIpO1xuICAgIGNvbnN0IGVzY2FwZWQgPSBwYXR0ZXJuLnJlcGxhY2UoL1xcXFwvZywgXCJcXFxcXFxcXFwiKS5yZXBsYWNlKC9cXC8vZywgXCJcXFxcL1wiKTtcbiAgICByZXR1cm4gYC8ke2VzY2FwZWR9LyR7ZmxhZ3N9YDtcbiAgfVxuICBpZiAobm9kZS5iaWdpbnQgIT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKFwiYmlnaW50IGxpdGVyYWxzIG5vdCBzdXBwb3J0ZWRcIik7XG4gIGNvbnN0IHYgPSBub2RlLnZhbHVlO1xuICBpZiAodiA9PT0gbnVsbCkgcmV0dXJuIFwibnVsbFwiO1xuICBpZiAodHlwZW9mIHYgPT09IFwic3RyaW5nXCIpIHJldHVybiBKU09OLnN0cmluZ2lmeSh2KTtcbiAgcmV0dXJuIFN0cmluZyh2KTtcbn07XG5cbmNvbnN0IHJlbmRlckV4cHIgPSAoZTogQXN0Tm9kZSk6IHN0cmluZyA9PiB7XG4gIHN3aXRjaCAoZS50eXBlKSB7XG4gICAgY2FzZSBcIklkZW50aWZpZXJcIjpcbiAgICAgIGFzc2VydFNhZmVJZGVudChlLm5hbWUpO1xuICAgICAgcmV0dXJuIGUubmFtZTtcbiAgICBjYXNlIFwiQ2hhaW5FeHByZXNzaW9uXCI6XG4gICAgICByZXR1cm4gcmVuZGVyRXhwcihlLmV4cHJlc3Npb24pO1xuICAgIGNhc2UgXCJTcHJlYWRFbGVtZW50XCI6XG4gICAgICByZXR1cm4gYC4uLiR7cmVuZGVyRXhwcihlLmFyZ3VtZW50KX1gO1xuICAgIGNhc2UgXCJMaXRlcmFsXCI6XG4gICAgICByZXR1cm4gcmVuZGVyTGl0ZXJhbChlKTtcbiAgICBjYXNlIFwiQXJyYXlFeHByZXNzaW9uXCI6XG4gICAgICByZXR1cm4gYFskeyhlLmVsZW1lbnRzIGFzIEFzdE5vZGVbXSkubWFwKChlbCkgPT4gZWwgPyByZW5kZXJFeHByKGVsKSA6IFwiXCIpLmpvaW4oXCIsIFwiKX1dYDtcbiAgICBjYXNlIFwiT2JqZWN0RXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIGB7JHsoZS5wcm9wZXJ0aWVzIGFzIEFzdE5vZGVbXSkubWFwKChwKSA9PiBwLnR5cGUgPT09IFwiU3ByZWFkRWxlbWVudFwiID8gYC4uLiR7cmVuZGVyRXhwcihwLmFyZ3VtZW50KX1gIDogcmVuZGVyUHJvcChwKSkuam9pbihcIiwgXCIpfX1gO1xuICAgIGNhc2UgXCJBd2FpdEV4cHJlc3Npb25cIjpcbiAgICAgIHJldHVybiBgKGF3YWl0ICR7cmVuZGVyRXhwcihlLmFyZ3VtZW50KX0pYDtcbiAgICBjYXNlIFwiQ2FsbEV4cHJlc3Npb25cIjoge1xuICAgICAgY29uc3QgY2FsbGVlU3RyID0gcmVuZGVyRXhwcihlLmNhbGxlZSk7XG4gICAgICBjb25zdCBuZWVkc1BhcmVucyA9IGUuY2FsbGVlLnR5cGUgPT09IFwiQXJyb3dGdW5jdGlvbkV4cHJlc3Npb25cIjtcbiAgICAgIHJldHVybiBgJHtuZWVkc1BhcmVucyA/IFwiKFwiIDogXCJcIn0ke2NhbGxlZVN0cn0ke25lZWRzUGFyZW5zID8gXCIpXCIgOiBcIlwifSR7ZS5vcHRpb25hbCA/IFwiPy5cIiA6IFwiXCJ9KCR7KGUuYXJndW1lbnRzIGFzIEFzdE5vZGVbXSkubWFwKHJlbmRlckV4cHIpLmpvaW4oXCIsIFwiKX0pYDtcbiAgICB9XG4gICAgY2FzZSBcIk1lbWJlckV4cHJlc3Npb25cIjpcbiAgICAgIHJldHVybiBlLmNvbXB1dGVkXG4gICAgICAgID8gYCR7cmVuZGVyRXhwcihlLm9iamVjdCl9JHtlLm9wdGlvbmFsID8gXCI/LlwiIDogXCJcIn1bX19jaGsoJHtyZW5kZXJFeHByKGUucHJvcGVydHkpfSldYFxuICAgICAgICA6IGAke3JlbmRlckV4cHIoZS5vYmplY3QpfSR7ZS5vcHRpb25hbCA/IFwiPy5cIiA6IFwiLlwifSR7cmVuZGVyRXhwcihlLnByb3BlcnR5KX1gO1xuICAgIGNhc2UgXCJBc3NpZ25tZW50RXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIGAke3JlbmRlckV4cHIoZS5sZWZ0KX0gJHtlLm9wZXJhdG9yfSAke3JlbmRlckV4cHIoZS5yaWdodCl9YDtcbiAgICBjYXNlIFwiVXBkYXRlRXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIGUucHJlZml4XG4gICAgICAgID8gYCR7ZS5vcGVyYXRvcn0ke3JlbmRlckV4cHIoZS5hcmd1bWVudCl9YFxuICAgICAgICA6IGAke3JlbmRlckV4cHIoZS5hcmd1bWVudCl9JHtlLm9wZXJhdG9yfWA7XG4gICAgY2FzZSBcIkJpbmFyeUV4cHJlc3Npb25cIjpcbiAgICBjYXNlIFwiTG9naWNhbEV4cHJlc3Npb25cIjpcbiAgICAgIHJldHVybiBgKCR7cmVuZGVyRXhwcihlLmxlZnQpfSAke2Uub3BlcmF0b3J9ICR7cmVuZGVyRXhwcihlLnJpZ2h0KX0pYDtcbiAgICBjYXNlIFwiVW5hcnlFeHByZXNzaW9uXCI6XG4gICAgICByZXR1cm4gZS5vcGVyYXRvciA9PT0gXCJ0eXBlb2ZcIlxuICAgICAgICA/IGAoJHtlLm9wZXJhdG9yfSAke3JlbmRlckV4cHIoZS5hcmd1bWVudCl9KWBcbiAgICAgICAgOiBgKCR7ZS5vcGVyYXRvcn0ke3JlbmRlckV4cHIoZS5hcmd1bWVudCl9KWA7XG4gICAgY2FzZSBcIkNvbmRpdGlvbmFsRXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIGAoJHtyZW5kZXJFeHByKGUudGVzdCl9ID8gJHtyZW5kZXJFeHByKGUuY29uc2VxdWVudCl9IDogJHtyZW5kZXJFeHByKGUuYWx0ZXJuYXRlKX0pYDtcbiAgICBjYXNlIFwiTmV3RXhwcmVzc2lvblwiOiB7XG4gICAgICBpZiAoZS5jYWxsZWUudHlwZSAhPT0gXCJJZGVudGlmaWVyXCIpIHRocm93IG5ldyBFcnJvcihcIm5ldzogb25seSBzaW1wbGUgY29uc3RydWN0b3JzIGFsbG93ZWRcIik7XG4gICAgICBjb25zdCBuYW1lID0gZS5jYWxsZWUubmFtZTtcbiAgICAgIGFzc2VydFNhZmVJZGVudChuYW1lKTtcbiAgICAgIGlmICghU0FGRV9DT05TVFJVQ1RPUlMuaGFzKG5hbWUpKSB0aHJvdyBuZXcgRXJyb3IoYG5ldzogJHtuYW1lfSBpcyBub3QgYW4gYWxsb3dlZCBjb25zdHJ1Y3RvcmApO1xuICAgICAgcmV0dXJuIGBuZXcgJHtuYW1lfSgkeyhlLmFyZ3VtZW50cyBhcyBBc3ROb2RlW10pLm1hcChyZW5kZXJFeHByKS5qb2luKFwiLCBcIil9KWA7XG4gICAgfVxuICAgIGNhc2UgXCJBcnJvd0Z1bmN0aW9uRXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIHJlbmRlckFycm93KGUpO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYHVuc3VwcG9ydGVkIGV4cHJlc3Npb246ICR7ZS50eXBlfWApO1xuICB9XG59O1xuXG5jb25zdCByZW5kZXJQcm9wID0gKHA6IEFzdE5vZGUpID0+IHtcbiAgaWYgKHAuY29tcHV0ZWQpIHRocm93IG5ldyBFcnJvcihcImNvbXB1dGVkIHByb3BlcnRpZXMgbm90IHN1cHBvcnRlZFwiKTtcbiAgaWYgKHAubWV0aG9kKSB0aHJvdyBuZXcgRXJyb3IoXCJtZXRob2QgcHJvcGVydGllcyBub3Qgc3VwcG9ydGVkXCIpO1xuICBpZiAocC5raW5kICE9PSBcImluaXRcIikgdGhyb3cgbmV3IEVycm9yKGB1bnN1cHBvcnRlZCBwcm9wZXJ0eSBraW5kOiAke3Aua2luZH1gKTtcbiAgY29uc3Qga2V5ID1cbiAgICBwLmtleS50eXBlID09PSBcIklkZW50aWZpZXJcIiA/IHAua2V5Lm5hbWUgOiByZW5kZXJMaXRlcmFsKHAua2V5KTtcbiAgaWYgKHAuc2hvcnRoYW5kICYmIHAudmFsdWUudHlwZSA9PT0gXCJJZGVudGlmaWVyXCIgJiYgcC52YWx1ZS5uYW1lID09PSBrZXkpIHtcbiAgICBhc3NlcnRTYWZlSWRlbnQoa2V5KTtcbiAgICByZXR1cm4ga2V5O1xuICB9XG4gIHJldHVybiBgJHtrZXl9OiAke3JlbmRlckV4cHIocC52YWx1ZSl9YDtcbn07XG5cbmNvbnN0IHJlbmRlckFycm93ID0gKGU6IEFzdE5vZGUpID0+IHtcbiAgY29uc3QgcGFyYW1zID0gYCgkeyhlLnBhcmFtcyBhcyBBc3ROb2RlW10pLm1hcChyZW5kZXJQYXR0ZXJuKS5qb2luKFwiLCBcIil9KWA7XG4gIGNvbnN0IHByZWZpeCA9IGUuYXN5bmMgPyBcImFzeW5jIFwiIDogXCJcIjtcbiAgaWYgKGUuYm9keS50eXBlID09PSBcIkJsb2NrU3RhdGVtZW50XCIpIHtcbiAgICByZXR1cm4gYCR7cHJlZml4fSR7cGFyYW1zfSA9PiAke3JlbmRlclN0bXQoZS5ib2R5LCB0cnVlKX1gO1xuICB9XG4gIHJldHVybiBgJHtwcmVmaXh9JHtwYXJhbXN9ID0+IHsgX19idXJuKCk7IHJldHVybiAke3JlbmRlckV4cHIoZS5ib2R5KX07IH1gO1xufTtcblxuY29uc3QgcmVuZGVyU3RtdCA9IChzOiBBc3ROb2RlLCBpbkZuID0gZmFsc2UpOiBzdHJpbmcgPT4ge1xuICBjb25zdCBidXJuID0gaW5GbiA/IFwiX19idXJuKCk7XCIgOiBcIlwiO1xuICBjb25zdCByZW5kZXJMb29wQm9keSA9IChib2R5OiBBc3ROb2RlKSA9PiB7XG4gICAgaWYgKGJvZHkudHlwZSA9PT0gXCJCbG9ja1N0YXRlbWVudFwiKSB7XG4gICAgICBjb25zdCBpbm5lciA9IChib2R5LmJvZHkgYXMgQXN0Tm9kZVtdKS5tYXAoKGIpID0+IHJlbmRlclN0bXQoYiwgaW5GbikpLmpvaW4oXCJcIik7XG4gICAgICByZXR1cm4gYHtfX2J1cm4oKTske2lubmVyfX1gO1xuICAgIH1cbiAgICByZXR1cm4gYHtfX2J1cm4oKTske3JlbmRlclN0bXQoYm9keSwgaW5Gbil9fWA7XG4gIH07XG4gIHN3aXRjaCAocy50eXBlKSB7XG4gICAgY2FzZSBcIkJsb2NrU3RhdGVtZW50XCI6XG4gICAgICByZXR1cm4gYHskeyhzLmJvZHkgYXMgQXN0Tm9kZVtdKS5tYXAoKGIpID0+IHJlbmRlclN0bXQoYiwgaW5GbikpLmpvaW4oXCJcIil9fWA7XG4gICAgY2FzZSBcIkV4cHJlc3Npb25TdGF0ZW1lbnRcIjpcbiAgICAgIHJldHVybiBgJHtidXJufSR7cmVuZGVyRXhwcihzLmV4cHJlc3Npb24pfTtgO1xuICAgIGNhc2UgXCJJZlN0YXRlbWVudFwiOiB7XG4gICAgICBjb25zdCB3cmFwID0gKHN0bXQ6IEFzdE5vZGUpID0+XG4gICAgICAgIHN0bXQudHlwZSA9PT0gXCJCbG9ja1N0YXRlbWVudFwiID8gcmVuZGVyU3RtdChzdG10LCBpbkZuKSA6IGB7JHtyZW5kZXJTdG10KHN0bXQsIGluRm4pfX1gO1xuICAgICAgcmV0dXJuIGAke2J1cm59aWYgKCR7cmVuZGVyRXhwcihzLnRlc3QpfSkgJHt3cmFwKHMuY29uc2VxdWVudCl9JHtzLmFsdGVybmF0ZSA/IGAgZWxzZSAke3dyYXAocy5hbHRlcm5hdGUpfWAgOiBcIlwifWA7XG4gICAgfVxuICAgIGNhc2UgXCJSZXR1cm5TdGF0ZW1lbnRcIjpcbiAgICAgIHJldHVybiBgJHtidXJufXJldHVybiR7cy5hcmd1bWVudCA/IGAgJHtyZW5kZXJFeHByKHMuYXJndW1lbnQpfWAgOiBcIlwifTtgO1xuICAgIGNhc2UgXCJUaHJvd1N0YXRlbWVudFwiOlxuICAgICAgcmV0dXJuIGAke2J1cm59dGhyb3cgJHtyZW5kZXJFeHByKHMuYXJndW1lbnQpfTtgO1xuICAgIGNhc2UgXCJWYXJpYWJsZURlY2xhcmF0aW9uXCI6XG4gICAgICBpZiAocy5raW5kID09PSBcInZhclwiKSB0aHJvdyBuZXcgRXJyb3IoXCJ2YXIgZGVjbGFyYXRpb25zIG5vdCBhbGxvd2VkXCIpO1xuICAgICAgcmV0dXJuIGAke2J1cm59JHtzLmtpbmR9ICR7KHMuZGVjbGFyYXRpb25zIGFzIEFzdE5vZGVbXSkubWFwKHJlbmRlckRlY2wpLmpvaW4oXCIsIFwiKX07YDtcbiAgICBjYXNlIFwiQnJlYWtTdGF0ZW1lbnRcIjpcbiAgICAgIHJldHVybiBgJHtidXJufWJyZWFrO2A7XG4gICAgY2FzZSBcIkNvbnRpbnVlU3RhdGVtZW50XCI6XG4gICAgICByZXR1cm4gYCR7YnVybn1jb250aW51ZTtgO1xuICAgIGNhc2UgXCJXaGlsZVN0YXRlbWVudFwiOlxuICAgICAgcmV0dXJuIGAke2J1cm59d2hpbGUgKCR7cmVuZGVyRXhwcihzLnRlc3QpfSkgJHtyZW5kZXJMb29wQm9keShzLmJvZHkpfWA7XG4gICAgY2FzZSBcIkZvclN0YXRlbWVudFwiOiB7XG4gICAgICBjb25zdCBpbml0ID1cbiAgICAgICAgcy5pbml0ID09IG51bGxcbiAgICAgICAgICA/IFwiXCJcbiAgICAgICAgICA6IHMuaW5pdC50eXBlID09PSBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIlxuICAgICAgICAgID8gYCR7cy5pbml0LmtpbmR9ICR7KHMuaW5pdC5kZWNsYXJhdGlvbnMgYXMgQXN0Tm9kZVtdKS5tYXAocmVuZGVyRGVjbCkuam9pbihcIiwgXCIpfWBcbiAgICAgICAgICA6IHJlbmRlckV4cHIocy5pbml0KTtcbiAgICAgIGNvbnN0IHRlc3QgPSBzLnRlc3QgPyByZW5kZXJFeHByKHMudGVzdCkgOiBcIlwiO1xuICAgICAgY29uc3QgdXBkYXRlID0gcy51cGRhdGUgPyByZW5kZXJFeHByKHMudXBkYXRlKSA6IFwiXCI7XG4gICAgICByZXR1cm4gYCR7YnVybn1mb3IgKCR7aW5pdH07ICR7dGVzdH07ICR7dXBkYXRlfSkgJHtyZW5kZXJMb29wQm9keShzLmJvZHkpfWA7XG4gICAgfVxuICAgIGNhc2UgXCJGb3JJblN0YXRlbWVudFwiOiB7XG4gICAgICBjb25zdCBsZWZ0ID0gcy5sZWZ0LnR5cGUgPT09IFwiVmFyaWFibGVEZWNsYXJhdGlvblwiXG4gICAgICAgID8gYCR7cy5sZWZ0LmtpbmR9ICR7KHMubGVmdC5kZWNsYXJhdGlvbnMgYXMgQXN0Tm9kZVtdKS5tYXAocmVuZGVyRGVjbCkuam9pbihcIiwgXCIpfWBcbiAgICAgICAgOiByZW5kZXJFeHByKHMubGVmdCk7XG4gICAgICByZXR1cm4gYCR7YnVybn1mb3IgKCR7bGVmdH0gaW4gJHtyZW5kZXJFeHByKHMucmlnaHQpfSkgJHtyZW5kZXJMb29wQm9keShzLmJvZHkpfWA7XG4gICAgfVxuICAgIGNhc2UgXCJGb3JPZlN0YXRlbWVudFwiOiB7XG4gICAgICBpZiAocy5hd2FpdCkgdGhyb3cgbmV3IEVycm9yKFwiZm9yLWF3YWl0LW9mIG5vdCBzdXBwb3J0ZWRcIik7XG4gICAgICBjb25zdCBsZWZ0ID0gcy5sZWZ0LnR5cGUgPT09IFwiVmFyaWFibGVEZWNsYXJhdGlvblwiXG4gICAgICAgID8gYCR7cy5sZWZ0LmtpbmR9ICR7KHMubGVmdC5kZWNsYXJhdGlvbnMgYXMgQXN0Tm9kZVtdKS5tYXAocmVuZGVyRGVjbCkuam9pbihcIiwgXCIpfWBcbiAgICAgICAgOiByZW5kZXJFeHByKHMubGVmdCk7XG4gICAgICByZXR1cm4gYCR7YnVybn1mb3IgKCR7bGVmdH0gb2YgJHtyZW5kZXJFeHByKHMucmlnaHQpfSkgJHtyZW5kZXJMb29wQm9keShzLmJvZHkpfWA7XG4gICAgfVxuICAgIGNhc2UgXCJTd2l0Y2hTdGF0ZW1lbnRcIjoge1xuICAgICAgY29uc3QgY2FzZXMgPSAocy5jYXNlcyBhcyBBc3ROb2RlW10pLm1hcCgoYykgPT4ge1xuICAgICAgICBjb25zdCBoZWFkID0gYy50ZXN0ID8gYGNhc2UgJHtyZW5kZXJFeHByKGMudGVzdCl9OmAgOiBcImRlZmF1bHQ6XCI7XG4gICAgICAgIGNvbnN0IGJvZHkgPSAoYy5jb25zZXF1ZW50IGFzIEFzdE5vZGVbXSkubWFwKChzdG10KSA9PiByZW5kZXJTdG10KHN0bXQsIGluRm4pKS5qb2luKFwiXCIpO1xuICAgICAgICByZXR1cm4gYCR7aGVhZH0ke2JvZHl9YDtcbiAgICAgIH0pLmpvaW4oXCJcIik7XG4gICAgICByZXR1cm4gYCR7YnVybn1zd2l0Y2ggKCR7cmVuZGVyRXhwcihzLmRpc2NyaW1pbmFudCl9KSB7JHtjYXNlc319YDtcbiAgICB9XG4gICAgY2FzZSBcIlRyeVN0YXRlbWVudFwiOiB7XG4gICAgICBjb25zdCBibG9jayA9IHJlbmRlclN0bXQocy5ibG9jaywgaW5Gbik7XG4gICAgICBjb25zdCBoYW5kbGVyID0gcy5oYW5kbGVyXG4gICAgICAgID8gKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcmFtID0gcy5oYW5kbGVyLnBhcmFtID8gcmVuZGVyUGF0dGVybihzLmhhbmRsZXIucGFyYW0pIDogXCJcIjtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSByZW5kZXJTdG10KHMuaGFuZGxlci5ib2R5LCBpbkZuKTtcbiAgICAgICAgICAgIHJldHVybiBgY2F0Y2gke3BhcmFtID8gYCAoJHtwYXJhbX0pYCA6IFwiXCJ9ICR7Ym9keX1gO1xuICAgICAgICAgIH0pKClcbiAgICAgICAgOiBcIlwiO1xuICAgICAgY29uc3QgZmluYWxpemVyID0gcy5maW5hbGl6ZXIgPyBgIGZpbmFsbHkgJHtyZW5kZXJTdG10KHMuZmluYWxpemVyLCBpbkZuKX1gIDogXCJcIjtcbiAgICAgIHJldHVybiBgJHtidXJufXRyeSAke2Jsb2NrfSR7aGFuZGxlcn0ke2ZpbmFsaXplcn1gO1xuICAgIH1cbiAgICBjYXNlIFwiRW1wdHlTdGF0ZW1lbnRcIjpcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYHVuc3VwcG9ydGVkIHN0YXRlbWVudDogJHtzLnR5cGV9YCk7XG4gIH1cbn07XG5cbmNvbnN0IHJlbmRlckRlY2wgPSAoZDogQXN0Tm9kZSkgPT5cbiAgYCR7cmVuZGVyUGF0dGVybihkLmlkKX0ke2QuaW5pdCA/IGAgPSAke3JlbmRlckV4cHIoZC5pbml0KX1gIDogXCJcIn1gO1xuXG5jb25zdCByZW5kZXJQYXR0ZXJuID0gKHA6IEFzdE5vZGUpOiBzdHJpbmcgPT4ge1xuICBzd2l0Y2ggKHAudHlwZSkge1xuICAgIGNhc2UgXCJJZGVudGlmaWVyXCI6XG4gICAgICBhc3NlcnRTYWZlSWRlbnQocC5uYW1lKTtcbiAgICAgIHJldHVybiBwLm5hbWU7XG4gICAgY2FzZSBcIkFzc2lnbm1lbnRQYXR0ZXJuXCI6XG4gICAgICByZXR1cm4gYCR7cmVuZGVyUGF0dGVybihwLmxlZnQpfSA9ICR7cmVuZGVyRXhwcihwLnJpZ2h0KX1gO1xuICAgIGNhc2UgXCJSZXN0RWxlbWVudFwiOlxuICAgICAgcmV0dXJuIGAuLi4ke3JlbmRlclBhdHRlcm4ocC5hcmd1bWVudCl9YDtcbiAgICBjYXNlIFwiQXJyYXlQYXR0ZXJuXCI6XG4gICAgICByZXR1cm4gYFskeyhwLmVsZW1lbnRzIGFzIChBc3ROb2RlIHwgbnVsbClbXSkubWFwKChlbCkgPT4gZWwgPyByZW5kZXJQYXR0ZXJuKGVsKSA6IFwiXCIpLmpvaW4oXCIsIFwiKX1dYDtcbiAgICBjYXNlIFwiT2JqZWN0UGF0dGVyblwiOlxuICAgICAgcmV0dXJuIGB7JHsocC5wcm9wZXJ0aWVzIGFzIEFzdE5vZGVbXSkubWFwKChwcm9wKSA9PlxuICAgICAgICBwcm9wLnR5cGUgPT09IFwiUmVzdEVsZW1lbnRcIiA/IGAuLi4ke3JlbmRlclBhdHRlcm4ocHJvcC5hcmd1bWVudCl9YCA6IHJlbmRlclBhdHRlcm5Qcm9wZXJ0eShwcm9wKVxuICAgICAgKS5qb2luKFwiLCBcIil9fWA7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcihgdW5zdXBwb3J0ZWQgcGF0dGVybjogJHtwLnR5cGV9YCk7XG4gIH1cbn07XG5cbmNvbnN0IHJlbmRlclBhdHRlcm5Qcm9wZXJ0eSA9IChwOiBBc3ROb2RlKTogc3RyaW5nID0+IHtcbiAgaWYgKHAuY29tcHV0ZWQpIHRocm93IG5ldyBFcnJvcihcImNvbXB1dGVkIHBhdHRlcm4gcHJvcGVydGllcyBub3Qgc3VwcG9ydGVkXCIpO1xuICBjb25zdCBrZXkgPVxuICAgIHAua2V5LnR5cGUgPT09IFwiSWRlbnRpZmllclwiID8gcC5rZXkubmFtZSA6IHJlbmRlckxpdGVyYWwocC5rZXkpO1xuICBpZiAoXG4gICAgcC5zaG9ydGhhbmQgJiZcbiAgICBwLmtleS50eXBlID09PSBcIklkZW50aWZpZXJcIiAmJlxuICAgIHAudmFsdWUudHlwZSA9PT0gXCJJZGVudGlmaWVyXCIgJiZcbiAgICBwLnZhbHVlLm5hbWUgPT09IHAua2V5Lm5hbWVcbiAgKSB7XG4gICAgYXNzZXJ0U2FmZUlkZW50KGtleSk7XG4gICAgcmV0dXJuIGtleTtcbiAgfVxuICByZXR1cm4gYCR7a2V5fTogJHtyZW5kZXJQYXR0ZXJuKHAudmFsdWUpfWA7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFJlc2VydmVkIG5hbWUgdmFsaWRhdGlvblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNvbnN0IHZhbGlkYXRlTm9SZXNlcnZlZFJ1bnRpbWVOYW1lcyA9IChwcm9ncmFtOiBBc3ROb2RlLCByZXNlcnZlZE5hbWVzOiBzdHJpbmdbXSk6IHN0cmluZ1tdID0+IHtcbiAgY29uc3QgcmVzZXJ2ZWQgPSBuZXcgU2V0KHJlc2VydmVkTmFtZXMpO1xuICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG5cbiAgY29uc3QgaGl0ID0gKG5hbWU6IHN0cmluZykgPT4ge1xuICAgIGlmIChyZXNlcnZlZC5oYXMobmFtZSkpIGVycm9ycy5wdXNoKGByZXNlcnZlZCBpZGVudGlmaWVyOiAke25hbWV9YCk7XG4gIH07XG5cbiAgY29uc3QgdmlzaXRQYXR0ZXJuID0gKHA6IEFzdE5vZGUpOiB2b2lkID0+IHtcbiAgICBzd2l0Y2ggKHAudHlwZSkge1xuICAgICAgY2FzZSBcIklkZW50aWZpZXJcIjpcbiAgICAgICAgaGl0KHAubmFtZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJBc3NpZ25tZW50UGF0dGVyblwiOlxuICAgICAgICB2aXNpdFBhdHRlcm4ocC5sZWZ0KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlJlc3RFbGVtZW50XCI6XG4gICAgICAgIHZpc2l0UGF0dGVybihwLmFyZ3VtZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkFycmF5UGF0dGVyblwiOlxuICAgICAgICAocC5lbGVtZW50cyBhcyAoQXN0Tm9kZSB8IG51bGwpW10pLmZvckVhY2goKGVsKSA9PiBlbCAmJiB2aXNpdFBhdHRlcm4oZWwpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIk9iamVjdFBhdHRlcm5cIjpcbiAgICAgICAgKHAucHJvcGVydGllcyBhcyBBc3ROb2RlW10pLmZvckVhY2goKHByb3ApID0+IHtcbiAgICAgICAgICBpZiAocHJvcC50eXBlID09PSBcIlJlc3RFbGVtZW50XCIpIHZpc2l0UGF0dGVybihwcm9wLmFyZ3VtZW50KTtcbiAgICAgICAgICBlbHNlIHZpc2l0UGF0dGVybihwcm9wLnZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgdmlzaXRFeHByID0gKGU6IEFzdE5vZGUpOiB2b2lkID0+IHtcbiAgICBpZiAoIWUpIHJldHVybjtcbiAgICBzd2l0Y2ggKGUudHlwZSkge1xuICAgICAgY2FzZSBcIklkZW50aWZpZXJcIjpcbiAgICAgICAgaGl0KGUubmFtZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJMaXRlcmFsXCI6XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJTcHJlYWRFbGVtZW50XCI6XG4gICAgICAgIHZpc2l0RXhwcihlLmFyZ3VtZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkFycmF5RXhwcmVzc2lvblwiOlxuICAgICAgICAoZS5lbGVtZW50cyBhcyBBc3ROb2RlW10pLmZvckVhY2goKGVsKSA9PiBlbCAmJiB2aXNpdEV4cHIoZWwpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIk9iamVjdEV4cHJlc3Npb25cIjpcbiAgICAgICAgKGUucHJvcGVydGllcyBhcyBBc3ROb2RlW10pLmZvckVhY2goKHApID0+IHtcbiAgICAgICAgICBpZiAocC50eXBlID09PSBcIlNwcmVhZEVsZW1lbnRcIikge1xuICAgICAgICAgICAgdmlzaXRFeHByKHAuYXJndW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocC5zaG9ydGhhbmQgJiYgcC52YWx1ZS50eXBlID09PSBcIklkZW50aWZpZXJcIikgaGl0KHAudmFsdWUubmFtZSk7XG4gICAgICAgICAgdmlzaXRFeHByKHAudmFsdWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkF3YWl0RXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5hcmd1bWVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJDaGFpbkV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUuZXhwcmVzc2lvbik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJOZXdFeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLmNhbGxlZSk7XG4gICAgICAgIChlLmFyZ3VtZW50cyBhcyBBc3ROb2RlW10pLmZvckVhY2goKGEpID0+IHZpc2l0RXhwcihhKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJDYWxsRXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5jYWxsZWUpO1xuICAgICAgICAoZS5hcmd1bWVudHMgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKChhKSA9PiB2aXNpdEV4cHIoYSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5vYmplY3QpO1xuICAgICAgICBpZiAoZS5jb21wdXRlZCkgdmlzaXRFeHByKGUucHJvcGVydHkpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQXNzaWdubWVudEV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUubGVmdCk7XG4gICAgICAgIHZpc2l0RXhwcihlLnJpZ2h0KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlVwZGF0ZUV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUuYXJndW1lbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQmluYXJ5RXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIkxvZ2ljYWxFeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLmxlZnQpO1xuICAgICAgICB2aXNpdEV4cHIoZS5yaWdodCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJVbmFyeUV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUuYXJndW1lbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQ29uZGl0aW9uYWxFeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLnRlc3QpO1xuICAgICAgICB2aXNpdEV4cHIoZS5jb25zZXF1ZW50KTtcbiAgICAgICAgdmlzaXRFeHByKGUuYWx0ZXJuYXRlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkFycm93RnVuY3Rpb25FeHByZXNzaW9uXCI6XG4gICAgICAgIChlLnBhcmFtcyBhcyBBc3ROb2RlW10pLmZvckVhY2godmlzaXRQYXR0ZXJuKTtcbiAgICAgICAgaWYgKGUuYm9keS50eXBlID09PSBcIkJsb2NrU3RhdGVtZW50XCIpIHZpc2l0U3RtdChlLmJvZHkpO1xuICAgICAgICBlbHNlIHZpc2l0RXhwcihlLmJvZHkpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHZpc2l0VmFyRGVjbCA9IChkOiBBc3ROb2RlKSA9PiB7XG4gICAgdmlzaXRQYXR0ZXJuKGQuaWQpO1xuICAgIGlmIChkLmluaXQpIHZpc2l0RXhwcihkLmluaXQpO1xuICB9O1xuXG4gIGNvbnN0IHZpc2l0U3RtdCA9IChzOiBBc3ROb2RlKTogdm9pZCA9PiB7XG4gICAgc3dpdGNoIChzLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJCbG9ja1N0YXRlbWVudFwiOlxuICAgICAgICAocy5ib2R5IGFzIEFzdE5vZGVbXSkuZm9yRWFjaCh2aXNpdFN0bXQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiRXhwcmVzc2lvblN0YXRlbWVudFwiOlxuICAgICAgICB2aXNpdEV4cHIocy5leHByZXNzaW9uKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIklmU3RhdGVtZW50XCI6XG4gICAgICAgIHZpc2l0RXhwcihzLnRlc3QpO1xuICAgICAgICB2aXNpdFN0bXQocy5jb25zZXF1ZW50KTtcbiAgICAgICAgaWYgKHMuYWx0ZXJuYXRlKSB2aXNpdFN0bXQocy5hbHRlcm5hdGUpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiUmV0dXJuU3RhdGVtZW50XCI6XG4gICAgICAgIGlmIChzLmFyZ3VtZW50KSB2aXNpdEV4cHIocy5hcmd1bWVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJUaHJvd1N0YXRlbWVudFwiOlxuICAgICAgICB2aXNpdEV4cHIocy5hcmd1bWVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJWYXJpYWJsZURlY2xhcmF0aW9uXCI6XG4gICAgICAgIChzLmRlY2xhcmF0aW9ucyBhcyBBc3ROb2RlW10pLmZvckVhY2godmlzaXRWYXJEZWNsKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIldoaWxlU3RhdGVtZW50XCI6XG4gICAgICAgIHZpc2l0RXhwcihzLnRlc3QpO1xuICAgICAgICB2aXNpdFN0bXQocy5ib2R5KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkZvclN0YXRlbWVudFwiOlxuICAgICAgICBpZiAocy5pbml0Py50eXBlID09PSBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIikgKHMuaW5pdC5kZWNsYXJhdGlvbnMgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKHZpc2l0VmFyRGVjbCk7XG4gICAgICAgIGVsc2UgaWYgKHMuaW5pdCkgdmlzaXRFeHByKHMuaW5pdCk7XG4gICAgICAgIGlmIChzLnRlc3QpIHZpc2l0RXhwcihzLnRlc3QpO1xuICAgICAgICBpZiAocy51cGRhdGUpIHZpc2l0RXhwcihzLnVwZGF0ZSk7XG4gICAgICAgIHZpc2l0U3RtdChzLmJvZHkpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiRm9ySW5TdGF0ZW1lbnRcIjpcbiAgICAgIGNhc2UgXCJGb3JPZlN0YXRlbWVudFwiOlxuICAgICAgICBpZiAocy5sZWZ0LnR5cGUgPT09IFwiVmFyaWFibGVEZWNsYXJhdGlvblwiKSAocy5sZWZ0LmRlY2xhcmF0aW9ucyBhcyBBc3ROb2RlW10pLmZvckVhY2godmlzaXRWYXJEZWNsKTtcbiAgICAgICAgZWxzZSB2aXNpdEV4cHIocy5sZWZ0KTtcbiAgICAgICAgdmlzaXRFeHByKHMucmlnaHQpO1xuICAgICAgICB2aXNpdFN0bXQocy5ib2R5KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlN3aXRjaFN0YXRlbWVudFwiOlxuICAgICAgICB2aXNpdEV4cHIocy5kaXNjcmltaW5hbnQpO1xuICAgICAgICAocy5jYXNlcyBhcyBBc3ROb2RlW10pLmZvckVhY2goKGMpID0+IHtcbiAgICAgICAgICBpZiAoYy50ZXN0KSB2aXNpdEV4cHIoYy50ZXN0KTtcbiAgICAgICAgICAoYy5jb25zZXF1ZW50IGFzIEFzdE5vZGVbXSkuZm9yRWFjaCh2aXNpdFN0bXQpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlRyeVN0YXRlbWVudFwiOlxuICAgICAgICB2aXNpdFN0bXQocy5ibG9jayk7XG4gICAgICAgIGlmIChzLmhhbmRsZXIpIHtcbiAgICAgICAgICBpZiAocy5oYW5kbGVyLnBhcmFtKSB2aXNpdFBhdHRlcm4ocy5oYW5kbGVyLnBhcmFtKTtcbiAgICAgICAgICB2aXNpdFN0bXQocy5oYW5kbGVyLmJvZHkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzLmZpbmFsaXplcikgdmlzaXRTdG10KHMuZmluYWxpemVyKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkJyZWFrU3RhdGVtZW50XCI6XG4gICAgICBjYXNlIFwiQ29udGludWVTdGF0ZW1lbnRcIjpcbiAgICAgIGNhc2UgXCJFbXB0eVN0YXRlbWVudFwiOlxuICAgICAgICByZXR1cm47XG4gICAgfVxuICB9O1xuXG4gIChwcm9ncmFtLmJvZHkgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKHZpc2l0U3RtdCk7XG4gIHJldHVybiBlcnJvcnM7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFJ1bm5lciBjb2RlZ2VuICh3cmFwcyBwcm9ncmFtIGJvZHkgd2l0aCBmdWVsIG1ldGVyaW5nKVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydCBjb25zdCByZW5kZXJXaXRoRnVlbCA9IChwcm9ncmFtOiBBc3ROb2RlLCBmdWVsID0gMTAwMDApID0+IHtcbiAgY29uc3QgcHJlbHVkZSA9IGBsZXQgX19mdWVsID0gJHtmdWVsfTsgY29uc3QgX19idXJuID0gKCkgPT4geyBpZiAoLS1fX2Z1ZWwgPCAwKSB0aHJvdyBuZXcgRXJyb3IoXCJmdWVsIGV4aGF1c3RlZFwiKTsgfTske0NIS19GTn1gO1xuICBjb25zdCBib2R5ID0gKHByb2dyYW0uYm9keSBhcyBBc3ROb2RlW10pLm1hcCgocykgPT4gcmVuZGVyU3RtdChzLCB0cnVlKSkuam9pbihcIlwiKTtcbiAgcmV0dXJuIGAke3ByZWx1ZGV9JHtib2R5fWA7XG59O1xuXG5jb25zdCBDSEtfRk4gPSBgY29uc3QgX19jaGsgPSAoaykgPT4geyBpZiAodHlwZW9mIGsgPT09IFwic3RyaW5nXCIgJiYgKGsgPT09IFwiY29uc3RydWN0b3JcIiB8fCBrID09PSBcIl9fcHJvdG9fX1wiIHx8IGsgPT09IFwicHJvdG90eXBlXCIpKSB0aHJvdyBuZXcgRXJyb3IoXCJmb3JiaWRkZW4gcHJvcGVydHk6IFwiICsgayk7IHJldHVybiBrOyB9O2A7XG5cbmNvbnN0IHJlbmRlclJ1bm5lcldpdGhGdWVsU2hhcmVkID0gKHByb2dyYW06IEFzdE5vZGUsIGZ1ZWxSZWZOYW1lID0gXCJfX2Z1ZWxcIikgPT4ge1xuICBhc3NlcnRTYWZlSWRlbnQoZnVlbFJlZk5hbWUpO1xuICBjb25zdCByZXNlcnZlZEVycnMgPSB2YWxpZGF0ZU5vUmVzZXJ2ZWRSdW50aW1lTmFtZXMocHJvZ3JhbSwgW2Z1ZWxSZWZOYW1lLCBcIl9fYnVyblwiLCBcIl9fY2hrXCJdKTtcbiAgaWYgKHJlc2VydmVkRXJycy5sZW5ndGgpIHRocm93IG5ldyBFcnJvcihyZXNlcnZlZEVycnMuam9pbihcIiwgXCIpKTtcbiAgY29uc3QgcHJlbHVkZSA9IGBjb25zdCBfX2J1cm4gPSAoKSA9PiB7IGlmICgtLSR7ZnVlbFJlZk5hbWV9LnZhbHVlIDwgMCkgdGhyb3cgbmV3IEVycm9yKFwiZnVlbCBleGhhdXN0ZWRcIik7IH07JHtDSEtfRk59YDtcbiAgY29uc3QgYm9keSA9IChwcm9ncmFtLmJvZHkgYXMgQXN0Tm9kZVtdKS5tYXAoKHMpID0+IHJlbmRlclN0bXQocywgdHJ1ZSkpLmpvaW4oXCJcIik7XG4gIHJldHVybiBgJHtwcmVsdWRlfWNvbnN0IF9fcnVuID0gKCkgPT4geyR7Ym9keX19OyB0cnkgeyBjb25zdCBvayA9IF9fcnVuKCk7IHJldHVybiB7IG9rLCBmdWVsOiAke2Z1ZWxSZWZOYW1lfS52YWx1ZSB9OyB9IGNhdGNoIChlcnIpIHsgcmV0dXJuIHsgZXJyOiBTdHJpbmcoZXJyKSwgZnVlbDogJHtmdWVsUmVmTmFtZX0udmFsdWUgfTsgfWA7XG59O1xuXG5jb25zdCByZW5kZXJSdW5uZXJXaXRoRnVlbFNoYXJlZEFzeW5jID0gKHByb2dyYW06IEFzdE5vZGUsIGZ1ZWxSZWZOYW1lID0gXCJfX2Z1ZWxcIikgPT4ge1xuICBhc3NlcnRTYWZlSWRlbnQoZnVlbFJlZk5hbWUpO1xuICBjb25zdCByZXNlcnZlZEVycnMgPSB2YWxpZGF0ZU5vUmVzZXJ2ZWRSdW50aW1lTmFtZXMocHJvZ3JhbSwgW2Z1ZWxSZWZOYW1lLCBcIl9fYnVyblwiLCBcIl9fY2hrXCJdKTtcbiAgaWYgKHJlc2VydmVkRXJycy5sZW5ndGgpIHRocm93IG5ldyBFcnJvcihyZXNlcnZlZEVycnMuam9pbihcIiwgXCIpKTtcbiAgY29uc3QgcHJlbHVkZSA9IGBjb25zdCBfX2J1cm4gPSAoKSA9PiB7IGlmICgtLSR7ZnVlbFJlZk5hbWV9LnZhbHVlIDwgMCkgdGhyb3cgbmV3IEVycm9yKFwiZnVlbCBleGhhdXN0ZWRcIik7IH07JHtDSEtfRk59YDtcbiAgY29uc3QgYm9keSA9IChwcm9ncmFtLmJvZHkgYXMgQXN0Tm9kZVtdKS5tYXAoKHMpID0+IHJlbmRlclN0bXQocywgdHJ1ZSkpLmpvaW4oXCJcIik7XG4gIHJldHVybiBgJHtwcmVsdWRlfWNvbnN0IF9fcnVuID0gYXN5bmMgKCkgPT4geyR7Ym9keX19OyByZXR1cm4gX19ydW4oKS50aGVuKG9rID0+ICh7IG9rLCBmdWVsOiAke2Z1ZWxSZWZOYW1lfS52YWx1ZSB9KSkuY2F0Y2goZXJyID0+ICh7IGVycjogU3RyaW5nKGVyciksIGZ1ZWw6ICR7ZnVlbFJlZk5hbWV9LnZhbHVlIH0pKTtgO1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBSdW50aW1lIGhlbHBlcnNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5leHBvcnQgdHlwZSBydW5SZXMgPSB7IG9rOiB1bmtub3duOyBmdWVsOiBudW1iZXIgfSB8IHsgZXJyOiBzdHJpbmc7IGZ1ZWw6IG51bWJlciB9O1xuXG5jb25zdCBTQUZFX09CSkVDVCA9IE9iamVjdC5mcmVlemUoT2JqZWN0LmFzc2lnbihPYmplY3QuY3JlYXRlKG51bGwpLCB7XG4gIGtleXM6IChvYmo6IHVua25vd24pID0+IE9iamVjdC5rZXlzKG9iaiBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiksXG4gIHZhbHVlczogKG9iajogdW5rbm93bikgPT4gT2JqZWN0LnZhbHVlcyhvYmogYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pLFxuICBlbnRyaWVzOiAob2JqOiB1bmtub3duKSA9PiBPYmplY3QuZW50cmllcyhvYmogYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pLFxuICBmcm9tRW50cmllczogKGVudHJpZXM6IHVua25vd24pID0+IE9iamVjdC5mcm9tRW50cmllcyhlbnRyaWVzIGFzIEl0ZXJhYmxlPFtzdHJpbmcsIHVua25vd25dPiksXG4gIGFzc2lnbjogKHRhcmdldDogdW5rbm93biwgLi4uc291cmNlczogdW5rbm93bltdKSA9PiBPYmplY3QuYXNzaWduKHRhcmdldCBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgLi4uc291cmNlcyksXG4gIGZyZWV6ZTogKG9iajogdW5rbm93bikgPT4gT2JqZWN0LmZyZWV6ZShvYmogYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pLFxufSkpO1xuXG5jb25zdCBTQUZFX0FSUkFZID0gT2JqZWN0LmZyZWV6ZShPYmplY3QuYXNzaWduKE9iamVjdC5jcmVhdGUobnVsbCksIHtcbiAgaXNBcnJheTogKHY6IHVua25vd24pID0+IEFycmF5LmlzQXJyYXkodiksXG4gIGZyb206ICh2OiB1bmtub3duLCBtYXBGbj86IHVua25vd24pID0+IG1hcEZuID8gQXJyYXkuZnJvbSh2IGFzIEl0ZXJhYmxlPHVua25vd24+LCBtYXBGbiBhcyAodjogdW5rbm93biwgaTogbnVtYmVyKSA9PiB1bmtub3duKSA6IEFycmF5LmZyb20odiBhcyBJdGVyYWJsZTx1bmtub3duPiksXG4gIG9mOiAoLi4uaXRlbXM6IHVua25vd25bXSkgPT4gQXJyYXkub2YoLi4uaXRlbXMpLFxufSkpO1xuXG5jb25zdCBTQUZFX01BVEggPSBPYmplY3QuZnJlZXplKE9iamVjdC5hc3NpZ24oT2JqZWN0LmNyZWF0ZShudWxsKSwge1xuICBhYnM6IE1hdGguYWJzLCBjZWlsOiBNYXRoLmNlaWwsIGZsb29yOiBNYXRoLmZsb29yLCByb3VuZDogTWF0aC5yb3VuZCxcbiAgbWluOiBNYXRoLm1pbiwgbWF4OiBNYXRoLm1heCwgcG93OiBNYXRoLnBvdywgc3FydDogTWF0aC5zcXJ0LFxuICBzaWduOiBNYXRoLnNpZ24sIHRydW5jOiBNYXRoLnRydW5jLCBsb2c6IE1hdGgubG9nLCBsb2cyOiBNYXRoLmxvZzIsXG4gIHJhbmRvbTogTWF0aC5yYW5kb20sIFBJOiBNYXRoLlBJLCBFOiBNYXRoLkUsXG59KSk7XG5cbnR5cGUgRnVlbFJlZiA9IHsgdmFsdWU6IG51bWJlciB9O1xudHlwZSBGdW5jdGlvblBhcmFtID0geyBuYW1lOiBzdHJpbmcsIHJlc3Q6IGJvb2xlYW4gfTtcblxuY29uc3QgcGFyc2VGdW5jdGlvbkN0b3IgPSAoY3RvckFyZ3M6IHVua25vd25bXSk6IHsgcGFyYW1zOiBGdW5jdGlvblBhcmFtW10sIGJvZHk6IHN0cmluZyB9ID0+IHtcbiAgaWYgKGN0b3JBcmdzLnNvbWUoKHYpID0+IHR5cGVvZiB2ICE9PSBcInN0cmluZ1wiKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkZ1bmN0aW9uIGFyZ3VtZW50cyBtdXN0IGJlIHN0cmluZ3NcIik7XG4gIH1cbiAgY29uc3QgcGFydHMgPSBjdG9yQXJncyBhcyBzdHJpbmdbXTtcbiAgY29uc3QgYm9keSA9IHBhcnRzLmxlbmd0aCA/IHBhcnRzW3BhcnRzLmxlbmd0aCAtIDFdIDogXCJcIjtcbiAgY29uc3QgcmF3UGFyYW1zID0gcGFydHMuc2xpY2UoMCwgLTEpO1xuICBjb25zdCBwYXJhbXM6IEZ1bmN0aW9uUGFyYW1bXSA9IFtdO1xuICBmb3IgKGNvbnN0IHJhdyBvZiByYXdQYXJhbXMpIHtcbiAgICBmb3IgKGNvbnN0IHNlZyBvZiByYXcuc3BsaXQoXCIsXCIpKSB7XG4gICAgICBjb25zdCBuYW1lID0gc2VnLnRyaW0oKTtcbiAgICAgIGlmICghbmFtZSkgY29udGludWU7XG4gICAgICBjb25zdCByZXN0ID0gbmFtZS5zdGFydHNXaXRoKFwiLi4uXCIpO1xuICAgICAgY29uc3QgYmFzZSA9IHJlc3QgPyBuYW1lLnNsaWNlKDMpIDogbmFtZTtcbiAgICAgIGlmICghL15bQS1aYS16XyRdW0EtWmEtejAtOV8kXSokLy50ZXN0KGJhc2UpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBmdW5jdGlvbiBwYXJhbWV0ZXI6ICR7bmFtZX1gKTtcbiAgICAgIH1cbiAgICAgIHBhcmFtcy5wdXNoKHsgbmFtZTogYmFzZSwgcmVzdCB9KTtcbiAgICB9XG4gIH1cbiAgY29uc3QgcmVzdENvdW50ID0gcGFyYW1zLmZpbHRlcigocCkgPT4gcC5yZXN0KS5sZW5ndGg7XG4gIGlmIChyZXN0Q291bnQgPiAxIHx8IChyZXN0Q291bnQgPT09IDEgJiYgIXBhcmFtc1twYXJhbXMubGVuZ3RoIC0gMV0ucmVzdCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZXN0IHBhcmFtZXRlciBtdXN0IGJlIHRoZSBsYXN0IHBhcmFtZXRlclwiKTtcbiAgfVxuICByZXR1cm4geyBwYXJhbXMsIGJvZHkgfTtcbn07XG5cbmNvbnN0IG1hcEZ1bmN0aW9uQXJncyA9IChwYXJhbXM6IEZ1bmN0aW9uUGFyYW1bXSwgY2FsbEFyZ3M6IHVua25vd25bXSk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0+IHtcbiAgY29uc3QgZW52OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9O1xuICBsZXQgaWR4ID0gMDtcbiAgZm9yIChjb25zdCBwIG9mIHBhcmFtcykge1xuICAgIGlmIChwLnJlc3QpIHtcbiAgICAgIGVudltwLm5hbWVdID0gY2FsbEFyZ3Muc2xpY2UoaWR4KTtcbiAgICAgIGlkeCA9IGNhbGxBcmdzLmxlbmd0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgZW52W3AubmFtZV0gPSBjYWxsQXJnc1tpZHgrK107XG4gICAgfVxuICB9XG4gIHJldHVybiBlbnY7XG59O1xuXG5jb25zdCBtYWtlU2FmZUZ1bmN0aW9uU3luYyA9IChmdWVsUmVmOiBGdWVsUmVmLCBvdXRlckdsb2JhbHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSA9PiAoLi4uY3RvckFyZ3M6IHVua25vd25bXSkgPT4ge1xuICBjb25zdCB7IHBhcmFtcywgYm9keSB9ID0gcGFyc2VGdW5jdGlvbkN0b3IoY3RvckFyZ3MpO1xuICByZXR1cm4gKC4uLmNhbGxBcmdzOiB1bmtub3duW10pID0+IHtcbiAgICBjb25zdCBsb2NhbEVudiA9IHsgLi4ub3V0ZXJHbG9iYWxzLCAuLi5tYXBGdW5jdGlvbkFyZ3MocGFyYW1zLCBjYWxsQXJncykgfTtcbiAgICBjb25zdCByZXMgPSBydW5XaXRoRnVlbFNoYXJlZChib2R5LCBmdWVsUmVmLCBsb2NhbEVudik7XG4gICAgaWYgKFwiZXJyXCIgaW4gcmVzKSB0aHJvdyBuZXcgRXJyb3IocmVzLmVycik7XG4gICAgcmV0dXJuIHJlcy5vaztcbiAgfTtcbn07XG5cbmNvbnN0IG1ha2VTYWZlRnVuY3Rpb25Bc3luYyA9IChmdWVsUmVmOiBGdWVsUmVmLCBvdXRlckdsb2JhbHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSA9PiAoLi4uY3RvckFyZ3M6IHVua25vd25bXSkgPT4ge1xuICBjb25zdCB7IHBhcmFtcywgYm9keSB9ID0gcGFyc2VGdW5jdGlvbkN0b3IoY3RvckFyZ3MpO1xuICByZXR1cm4gYXN5bmMgKC4uLmNhbGxBcmdzOiB1bmtub3duW10pID0+IHtcbiAgICBjb25zdCBsb2NhbEVudiA9IHsgLi4ub3V0ZXJHbG9iYWxzLCAuLi5tYXBGdW5jdGlvbkFyZ3MocGFyYW1zLCBjYWxsQXJncykgfTtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBydW5XaXRoRnVlbFNoYXJlZEFzeW5jKGJvZHksIGZ1ZWxSZWYsIGxvY2FsRW52KTtcbiAgICBpZiAoXCJlcnJcIiBpbiByZXMpIHRocm93IG5ldyBFcnJvcihyZXMuZXJyKTtcbiAgICByZXR1cm4gcmVzLm9rO1xuICB9O1xufTtcblxuY29uc3Qgd2l0aEJ1aWx0aW5zID0gKFxuICBlbnY6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICBmdWVsUmVmOiBGdWVsUmVmLFxuICBtb2RlOiBcInN5bmNcIiB8IFwiYXN5bmNcIixcbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0+IHtcbiAgY29uc3QgYmFzZUdsb2JhbHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge1xuICAgIC4uLmVudixcbiAgICBPYmplY3Q6IFNBRkVfT0JKRUNULFxuICAgIEFycmF5OiBTQUZFX0FSUkFZLFxuICAgIE1hdGg6IFNBRkVfTUFUSCxcbiAgICBNYXAsXG4gICAgU2V0LFxuICAgIFByb21pc2UsXG4gIH07XG4gIHJldHVybiB7XG4gICAgLi4uYmFzZUdsb2JhbHMsXG4gICAgRnVuY3Rpb246IG1vZGUgPT09IFwiYXN5bmNcIlxuICAgICAgPyBtYWtlU2FmZUZ1bmN0aW9uQXN5bmMoZnVlbFJlZiwgYmFzZUdsb2JhbHMpXG4gICAgICA6IG1ha2VTYWZlRnVuY3Rpb25TeW5jKGZ1ZWxSZWYsIGJhc2VHbG9iYWxzKSxcbiAgfTtcbn07XG5cbmNvbnN0IHN0cmluZ2lmeUVycm9yID0gKGVycjogdW5rbm93bik6IHN0cmluZyA9PiB7XG4gIGlmIChlcnIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgIGNvbnN0IHN0YWNrID0gZXJyLnN0YWNrIHx8ICcnO1xuICAgIGNvbnN0IHByZWZpeCA9IGAke2Vyci5uYW1lfTogJHtlcnIubWVzc2FnZX1gO1xuICAgIGNvbnN0IGNsZWFuU3RhY2sgPSBzdGFja1xuICAgICAgLnJlcGxhY2UoL15bXlxcbl0qXFxuPy8sICcnKVxuICAgICAgLnJlcGxhY2UoL3NwYWNldGltZWRiX21vZHVsZTooXFxkKyk6KFxcZCspL2csICc8YnVuZGxlZDokMTokMj4nKTtcbiAgICByZXR1cm4gY2xlYW5TdGFjayA/IGAke3ByZWZpeH1cXG4ke2NsZWFuU3RhY2t9YCA6IHByZWZpeDtcbiAgfVxuICBpZiAodHlwZW9mIGVyciA9PT0gJ29iamVjdCcgJiYgZXJyICE9PSBudWxsKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShlcnIpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIFN0cmluZyhlcnIpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gU3RyaW5nKGVycik7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFB1YmxpYyBydW50aW1lIEFQSVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydCBjb25zdCBydW5XaXRoRnVlbCA9IChcbiAgc3JjOiBzdHJpbmcsXG4gIGZ1ZWwgPSAxMDAwMCxcbiAgZW52OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9LFxuKTogcnVuUmVzID0+IHtcbiAgY29uc3QgZnVlbFJlZiA9IHsgdmFsdWU6IGZ1ZWwgfTtcbiAgcmV0dXJuIHJ1bldpdGhGdWVsU2hhcmVkKHNyYywgZnVlbFJlZiwgZW52KTtcbn07XG5cbmV4cG9ydCBjb25zdCBydW5XaXRoRnVlbFNoYXJlZCA9IChcbiAgc3JjOiBzdHJpbmcsXG4gIGZ1ZWxSZWY6IEZ1ZWxSZWYsXG4gIGVudjogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fSxcbiAgZnVlbFJlZk5hbWUgPSBcIl9fZnVlbFwiXG4pOiBydW5SZXMgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHJ1bnRpbWVFbnYgPSB3aXRoQnVpbHRpbnMoZW52LCBmdWVsUmVmLCBcInN5bmNcIik7XG4gICAgY29uc3QgcHJvZ3JhbSA9IHBhcnNlKHNyYyk7XG4gICAgY29uc3QgcHJvdG9FcnJzID0gdmFsaWRhdGVOb1Byb3RvdHlwZShwcm9ncmFtKTtcbiAgICBpZiAocHJvdG9FcnJzLmxlbmd0aCkgcmV0dXJuIHsgZXJyOiBcInByb3RvdHlwZSBhY2Nlc3NcIiwgZnVlbDogZnVlbFJlZi52YWx1ZSB9O1xuICAgIGNvbnN0IHNjb3BlRXJycyA9IHZhbGlkYXRlU2NvcGVzKHByb2dyYW0sIFsuLi5PYmplY3Qua2V5cyhydW50aW1lRW52KSwgZnVlbFJlZk5hbWVdKTtcbiAgICBpZiAoc2NvcGVFcnJzLmxlbmd0aCkgcmV0dXJuIHsgZXJyOiBzY29wZUVycnMuam9pbihcIiwgXCIpLCBmdWVsOiBmdWVsUmVmLnZhbHVlIH07XG4gICAgY29uc3QgY29kZSA9IHJlbmRlclJ1bm5lcldpdGhGdWVsU2hhcmVkKHByb2dyYW0sIGZ1ZWxSZWZOYW1lKTtcbiAgICBjb25zdCBmdWxsRW52ID0geyAuLi5ydW50aW1lRW52LCBbZnVlbFJlZk5hbWVdOiBmdWVsUmVmIH07XG4gICAgcmV0dXJuIChuZXcgRnVuY3Rpb24oLi4uT2JqZWN0LmtleXMoZnVsbEVudiksIGNvZGUpIGFzICguLi5hcmdzOnVua25vd25bXSkgPT4gcnVuUmVzKSguLi5PYmplY3QudmFsdWVzKGZ1bGxFbnYpKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIHsgZXJyOiBzdHJpbmdpZnlFcnJvcihlcnIpLCBmdWVsOiBmdWVsUmVmLnZhbHVlIH07XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBydW5XaXRoRnVlbFNoYXJlZEFzeW5jID0gYXN5bmMgKFxuICBzcmM6IHN0cmluZyxcbiAgZnVlbFJlZjogRnVlbFJlZixcbiAgZW52OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9LFxuICBmdWVsUmVmTmFtZSA9IFwiX19mdWVsXCJcbik6IFByb21pc2U8cnVuUmVzPiA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgcnVudGltZUVudiA9IHdpdGhCdWlsdGlucyhlbnYsIGZ1ZWxSZWYsIFwiYXN5bmNcIik7XG4gICAgY29uc3QgcHJvZ3JhbSA9IHBhcnNlKHNyYyk7XG4gICAgY29uc3QgcHJvdG9FcnJzID0gdmFsaWRhdGVOb1Byb3RvdHlwZShwcm9ncmFtKTtcbiAgICBpZiAocHJvdG9FcnJzLmxlbmd0aCkgcmV0dXJuIHsgZXJyOiBcInByb3RvdHlwZSBhY2Nlc3NcIiwgZnVlbDogZnVlbFJlZi52YWx1ZSB9O1xuICAgIGNvbnN0IHNjb3BlRXJycyA9IHZhbGlkYXRlU2NvcGVzKHByb2dyYW0sIFsuLi5PYmplY3Qua2V5cyhydW50aW1lRW52KSwgZnVlbFJlZk5hbWVdKTtcbiAgICBpZiAoc2NvcGVFcnJzLmxlbmd0aCkgcmV0dXJuIHsgZXJyOiBzY29wZUVycnMuam9pbihcIiwgXCIpLCBmdWVsOiBmdWVsUmVmLnZhbHVlIH07XG4gICAgY29uc3QgY29kZSA9IHJlbmRlclJ1bm5lcldpdGhGdWVsU2hhcmVkQXN5bmMocHJvZ3JhbSwgZnVlbFJlZk5hbWUpO1xuICAgIGNvbnN0IGZ1bGxFbnYgPSB7IC4uLnJ1bnRpbWVFbnYsIFtmdWVsUmVmTmFtZV06IGZ1ZWxSZWYgfTtcbiAgICBjb25zdCBmbiA9IG5ldyBGdW5jdGlvbiguLi5PYmplY3Qua2V5cyhmdWxsRW52KSwgY29kZSkgYXMgKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gUHJvbWlzZTxydW5SZXM+O1xuICAgIHJldHVybiBhd2FpdCBmbiguLi5PYmplY3QudmFsdWVzKGZ1bGxFbnYpKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIHsgZXJyOiBzdHJpbmdpZnlFcnJvcihlcnIpLCBmdWVsOiBmdWVsUmVmLnZhbHVlIH07XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBydW5XaXRoRnVlbEFzeW5jID0gYXN5bmMgKFxuICBzcmM6IHN0cmluZyxcbiAgZnVlbCA9IDEwMDAwLFxuICBlbnY6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge31cbik6IFByb21pc2U8cnVuUmVzPiA9PiB7XG4gIGNvbnN0IGZ1ZWxSZWYgPSB7IHZhbHVlOiBmdWVsIH07XG4gIHJldHVybiBydW5XaXRoRnVlbFNoYXJlZEFzeW5jKHNyYywgZnVlbFJlZiwgZW52KTtcbn07XG4iLCAiaW1wb3J0IHR5cGUgeyBKc29uYWJsZSB9IGZyb20gXCJAaGFzaG5vdGVzL2NvcmUvbm90ZXNcIjtcblxuZXhwb3J0IHR5cGUgT3BlblJvdXRlclJlcXVlc3QgPSB7XG4gIGFwaUtleTogc3RyaW5nO1xuICBtb2RlbDogc3RyaW5nO1xuICBwcm9tcHQ6IHN0cmluZztcbiAgc2NoZW1hOiBKc29uYWJsZTtcbn07XG5cbnR5cGUgT3BlblJvdXRlck1lc3NhZ2UgPSB7XG4gIHJvbGU6IFwidXNlclwiO1xuICBjb250ZW50OiBzdHJpbmc7XG59O1xuXG50eXBlIE9wZW5Sb3V0ZXJSZXNwb25zZSA9IHtcbiAgY2hvaWNlcz86IEFycmF5PHtcbiAgICBtZXNzYWdlPzoge1xuICAgICAgY29udGVudD86IHN0cmluZztcbiAgICB9O1xuICB9Pjtcbn07XG5cbmNvbnN0IE9QRU5ST1VURVJfVVJMID0gXCJodHRwczovL29wZW5yb3V0ZXIuYWkvYXBpL3YxL2NoYXQvY29tcGxldGlvbnNcIjtcbmNvbnN0IGNsaXAgPSAoczogc3RyaW5nLCBtYXggPSAyMDAwKTogc3RyaW5nID0+IChzLmxlbmd0aCA8PSBtYXggPyBzIDogcy5zbGljZSgwLCBtYXgpICsgXCIuLi48dHJ1bmNhdGVkPlwiKTtcblxuY29uc3QgYXNFcnJvck1lc3NhZ2UgPSBhc3luYyAocmVzOiBSZXNwb25zZSk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gIGNvbnN0IHRleHQgPSBhd2FpdCByZXMudGV4dCgpO1xuICBpZiAoIXRleHQpIHJldHVybiBgJHtyZXMuc3RhdHVzfSAke3Jlcy5zdGF0dXNUZXh0fWA7XG4gIHRyeSB7XG4gICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZSh0ZXh0KSBhcyB7IGVycm9yPzogeyBtZXNzYWdlPzogc3RyaW5nIH0gfTtcbiAgICBjb25zdCBtc2cgPSBwYXJzZWQ/LmVycm9yPy5tZXNzYWdlO1xuICAgIHJldHVybiBtc2cgPyBgJHtyZXMuc3RhdHVzfSAke21zZ31gIDogYCR7cmVzLnN0YXR1c30gJHt0ZXh0fWA7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBgJHtyZXMuc3RhdHVzfSAke3RleHR9YDtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IG9wZW5Sb3V0ZXJSZXF1ZXN0ID0gYXN5bmMgKFxuICByZXE6IE9wZW5Sb3V0ZXJSZXF1ZXN0LFxuKTogUHJvbWlzZTxKc29uYWJsZT4gPT4ge1xuICBpZiAoIXJlcS5hcGlLZXkpIHRocm93IG5ldyBFcnJvcihcIm9wZW5Sb3V0ZXJSZXF1ZXN0OiBhcGlLZXkgaXMgcmVxdWlyZWRcIik7XG4gIGlmICghcmVxLm1vZGVsKSByZXEubW9kZWwgPSBcIm9wZW5haS9ncHQtb3NzLTIwYlwiXG4gIGlmICghcmVxLnByb21wdCkgdGhyb3cgbmV3IEVycm9yKFwib3BlblJvdXRlclJlcXVlc3Q6IHByb21wdCBpcyByZXF1aXJlZFwiKTtcbiAgaWYgKCFyZXEuc2NoZW1hKSByZXEuc2NoZW1hID0ge3R5cGU6XCJzdHJpbmdcIn1cbiAgaWYgKHR5cGVvZiByZXEuc2NoZW1hICE9PSBcIm9iamVjdFwiIHx8IEFycmF5LmlzQXJyYXkocmVxLnNjaGVtYSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJvcGVuUm91dGVyUmVxdWVzdDogc2NoZW1hIG11c3QgYmUgYW4gb2JqZWN0XCIpO1xuICB9XG5cbiAgY29uc3QgbWVzc2FnZXM6IE9wZW5Sb3V0ZXJNZXNzYWdlW10gPSBbeyByb2xlOiBcInVzZXJcIiwgY29udGVudDogcmVxLnByb21wdCB9XTtcbiAgY29uc3QgbWtCb2R5ID0gKCkgPT4gKHtcbiAgICBtb2RlbDogcmVxLm1vZGVsLFxuICAgIG1lc3NhZ2VzLFxuICAgIHJlYXNvbmluZzoge1xuICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIGV4Y2x1ZGU6IHRydWUsXG4gICAgfSxcbiAgICByZXNwb25zZV9mb3JtYXQ6IHtcbiAgICAgIHR5cGU6IFwianNvbl9zY2hlbWFcIixcbiAgICAgIGpzb25fc2NoZW1hOiB7XG4gICAgICAgIG5hbWU6IFwic3RydWN0dXJlZF9vdXRwdXRcIixcbiAgICAgICAgc3RyaWN0OiB0cnVlLFxuICAgICAgICBzY2hlbWE6IHJlcS5zY2hlbWEsXG4gICAgICB9LFxuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnN0IGRvRmV0Y2ggPSAoKSA9PiBmZXRjaChPUEVOUk9VVEVSX1VSTCwge1xuICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgaGVhZGVyczoge1xuICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICBcIkF1dGhvcml6YXRpb25cIjogYEJlYXJlciAke3JlcS5hcGlLZXl9YCxcbiAgICB9LFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KG1rQm9keSgpKSxcbiAgfSk7XG5cbiAgY29uc3QgcmVzID0gYXdhaXQgZG9GZXRjaCgpO1xuICBpZiAoIXJlcy5vaykgdGhyb3cgbmV3IEVycm9yKGBPcGVuUm91dGVyIHJlcXVlc3QgZmFpbGVkOiAke2F3YWl0IGFzRXJyb3JNZXNzYWdlKHJlcyl9YCk7XG5cbiAgY29uc3QgZGF0YSA9IGF3YWl0IHJlcy5qc29uKCkgYXMgT3BlblJvdXRlclJlc3BvbnNlO1xuICBjb25zdCBjb250ZW50ID0gZGF0YS5jaG9pY2VzPy5bMF0/Lm1lc3NhZ2U/LmNvbnRlbnQ7XG4gIGlmICh0eXBlb2YgY29udGVudCAhPT0gXCJzdHJpbmdcIikge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIFwiT3BlblJvdXRlciByZXNwb25zZSBtaXNzaW5nIGNob2ljZXNbMF0ubWVzc2FnZS5jb250ZW50XCJcbiAgICAgICsgXCJcXG5tb2RlbDogXCIgKyByZXEubW9kZWxcbiAgICAgICsgXCJcXG5zY2hlbWE6IFwiICsgY2xpcChKU09OLnN0cmluZ2lmeShyZXEuc2NoZW1hKSlcbiAgICAgICsgXCJcXG5yZXNwb25zZTogXCIgKyBjbGlwKEpTT04uc3RyaW5naWZ5KGRhdGEpKVxuICAgICk7XG4gIH1cbiAgaWYgKGNvbnRlbnQudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIFwiT3BlblJvdXRlciByZXNwb25zZSBjb250ZW50IHdhcyBlbXB0eVwiXG4gICAgICArIFwiXFxubW9kZWw6IFwiICsgcmVxLm1vZGVsXG4gICAgICArIFwiXFxuc2NoZW1hOiBcIiArIGNsaXAoSlNPTi5zdHJpbmdpZnkocmVxLnNjaGVtYSkpXG4gICAgICArIFwiXFxucmVzcG9uc2U6IFwiICsgY2xpcChKU09OLnN0cmluZ2lmeShkYXRhKSlcbiAgICApO1xuICB9XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UoY29udGVudCkgYXMgSnNvbmFibGU7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnN0IHBhcnNlTXNnID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpO1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIFwiT3BlblJvdXRlciByZXNwb25zZSBjb250ZW50IHdhcyBub3QgdmFsaWQgSlNPTlwiXG4gICAgICArIFwiXFxubW9kZWw6IFwiICsgcmVxLm1vZGVsXG4gICAgICArIFwiXFxucGFyc2UgZXJyb3I6IFwiICsgcGFyc2VNc2dcbiAgICAgICsgXCJcXG5zY2hlbWE6IFwiICsgY2xpcChKU09OLnN0cmluZ2lmeShyZXEuc2NoZW1hKSlcbiAgICAgICsgXCJcXG5jb250ZW50OiBcIiArIGNsaXAoY29udGVudClcbiAgICAgICsgXCJcXG5yZXNwb25zZTogXCIgKyBjbGlwKEpTT04uc3RyaW5naWZ5KGRhdGEpKVxuICAgICk7XG4gIH1cbn07XG4iLCAiaW1wb3J0IHsgcnVuV2l0aEZ1ZWxTaGFyZWQsIHJ1bldpdGhGdWVsU2hhcmVkQXN5bmMgfSBmcm9tIFwiQGhhc2hub3Rlcy9jb3JlL2NvZGVnZW5cIjtcbmltcG9ydCB7IGZyb21qc29uLCBoYXNoRGF0YSwgdHlwZSBKc29uYWJsZSwgdHlwZSBSZWYgfSBmcm9tIFwiQGhhc2hub3Rlcy9jb3JlL25vdGVzXCI7XG5pbXBvcnQgeyBhZGROb3RlLCBhc1JlZiwgY2FsbE5vdGUsIGRlUmVmLCBnZXROb3RlIH0gZnJvbSBcIi4vZGIudHNcIjtcbmltcG9ydCB7IG9wZW5Sb3V0ZXJSZXF1ZXN0IH0gZnJvbSBcIi4vb3BlbnJvdXRlci50c1wiO1xuaW1wb3J0IHsgSFRNTCwgdHlwZSBWaWV3LCB0eXBlIFZpZXdDb250ZXh0LCB0eXBlIFZEb20gfSBmcm9tIFwiLi92aWV3cy50c1wiO1xuXG50eXBlIENsaWVudEZ1ZWxPcHRpb25zID0ge1xuICBmdWVsPzogbnVtYmVyO1xuICBlbnY/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbn07XG5cbmNvbnN0IGxvY2FsU3RvcmVLZXkgPSAoZm5SZWY6IHN0cmluZywga2V5OiBSZWYgfCBKc29uYWJsZSk6IHN0cmluZyA9PlxuICBgJHtmblJlZn18JHtoYXNoRGF0YShrZXkgYXMgSnNvbmFibGUpfWA7XG5cbi8qKiBDcmVhdGUgYSBzdG9yZSBzY29wZWQgdG8gYSBzcGVjaWZpYyBub3RlIHJlZi4gKi9cbmNvbnN0IG1ha2VTdG9yZSA9IChcbiAgbm90ZVJlZjogc3RyaW5nLFxuICBtZW1TdG9yZTogTWFwPHN0cmluZywgSnNvbmFibGU+LFxuICBsczogU3RvcmFnZSB8IHVuZGVmaW5lZCxcbikgPT4gKHtcbiAgZ2V0OiAoa2V5OiBSZWYgfCBKc29uYWJsZSk6IEpzb25hYmxlIHwgdW5kZWZpbmVkID0+IHtcbiAgICBjb25zdCBza2V5ID0gYGhhc2hub3RlczpzdG9yZToke2xvY2FsU3RvcmVLZXkobm90ZVJlZiwga2V5KX1gO1xuICAgIGNvbnN0IHJhdyA9IGxzPy5nZXRJdGVtKHNrZXkpO1xuICAgIGlmIChyYXcgIT0gbnVsbCkgcmV0dXJuIGZyb21qc29uKHJhdykgYXMgSnNvbmFibGU7XG4gICAgcmV0dXJuIG1lbVN0b3JlLmdldChza2V5KTtcbiAgfSxcbiAgc2V0OiAoa2V5OiBSZWYgfCBKc29uYWJsZSwgdmFsdWU6IFJlZiB8IEpzb25hYmxlKTogSnNvbmFibGUgPT4ge1xuICAgIGNvbnN0IHNrZXkgPSBgaGFzaG5vdGVzOnN0b3JlOiR7bG9jYWxTdG9yZUtleShub3RlUmVmLCBrZXkpfWA7XG4gICAgY29uc3QgdiA9IHZhbHVlIGFzIEpzb25hYmxlO1xuICAgIGlmIChscykgbHMuc2V0SXRlbShza2V5LCBKU09OLnN0cmluZ2lmeSh2KSk7XG4gICAgZWxzZSBtZW1TdG9yZS5zZXQoc2tleSwgdik7XG4gICAgcmV0dXJuIHY7XG4gIH0sXG59KTtcblxudHlwZSBMb2NhbEV4ZWN1dG9yID0gKGZuOiBSZWYgfCBKc29uYWJsZSwgYXJnczogUmVmIHwgSnNvbmFibGUpID0+IFByb21pc2U8dW5rbm93bj47XG5cbi8qKlxuICogUGFyc2UgX19kZXBzIGZyb20gYSBjb21waWxlZCBub3RlIGJvZHkuXG4gKiBMb29rcyBmb3IgYGNvbnN0IF9fZGVwcyA9IFtcIiNoYXNoMVwiLCBcIiNoYXNoMlwiXTtgIGFzIHRoZSBmaXJzdCBsaW5lLlxuICovXG5jb25zdCBwYXJzZURlcHMgPSAoc3JjOiBzdHJpbmcpOiBzdHJpbmdbXSA9PiB7XG4gIGNvbnN0IG0gPSBzcmMubWF0Y2goL15jb25zdCBfX2RlcHMgPSBcXFsoW15cXF1dKilcXF07Lyk7XG4gIGlmICghbSkgcmV0dXJuIFtdO1xuICByZXR1cm4gWy4uLm1bMV0ubWF0Y2hBbGwoL1wiKFteXCJdKylcIi9nKV0ubWFwKHggPT4geFsxXSk7XG59O1xuXG5jb25zdCBjcmVhdGVMb2NhbEV4ZWN1dG9yID0gKG9wdGlvbnM6IENsaWVudEZ1ZWxPcHRpb25zKTogTG9jYWxFeGVjdXRvciA9PiB7XG4gIGNvbnN0IGZ1ZWxSZWYgPSB7IHZhbHVlOiBvcHRpb25zLmZ1ZWwgPz8gMTAwMDAwIH07XG4gIGNvbnN0IG1lbVN0b3JlID0gbmV3IE1hcDxzdHJpbmcsIEpzb25hYmxlPigpO1xuICBjb25zdCBscyA9ICgoKSA9PiB7XG4gICAgdHJ5IHsgcmV0dXJuIHR5cGVvZiBsb2NhbFN0b3JhZ2UgIT09IFwidW5kZWZpbmVkXCIgPyBsb2NhbFN0b3JhZ2UgOiB1bmRlZmluZWQ7IH0gY2F0Y2ggeyByZXR1cm4gdW5kZWZpbmVkOyB9XG4gIH0pKCk7XG4gIGNvbnN0IHByb21wdFVzZXIgPSAobWVzc2FnZTogc3RyaW5nLCBkZWZhdWx0VmFsdWUgPSBcIlwiKTogc3RyaW5nIHwgbnVsbCA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHAgPSAoZ2xvYmFsVGhpcyBhcyB7IHByb21wdD86IChtOiBzdHJpbmcsIGQ/OiBzdHJpbmcpID0+IHN0cmluZyB8IG51bGwgfSkucHJvbXB0O1xuICAgICAgaWYgKHR5cGVvZiBwID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBwKG1lc3NhZ2UsIGRlZmF1bHRWYWx1ZSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBuby1vcFxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfTtcblxuICAvLyBDYWNoZTogaGFzaCBcdTIxOTIgbm90ZSBkYXRhIChzdHJpbmcgZm9yIGNvZGUsIGFueSBKc29uYWJsZSBmb3IgZGF0YSlcbiAgY29uc3Qgbm90ZUNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIEpzb25hYmxlPigpO1xuXG4gIC8vIE1hcCBmcm9tIHdyYXBwZXIgZnVuY3Rpb24gXHUyMTkyIGhhc2ggKGZvciByZW1vdGUoKSB0byByZXNvbHZlKVxuICBjb25zdCBmblRvSGFzaCA9IG5ldyBNYXA8RnVuY3Rpb24sIHN0cmluZz4oKTtcblxuICAvKiogUmVjdXJzaXZlbHkgZmV0Y2ggZGVwIHNvdXJjZXMgaW50byBub3RlQ2FjaGUgKG5vIGV4ZWN1dGlvbikuICovXG4gIGNvbnN0IHByZWZldGNoID0gYXN5bmMgKHJlZjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgaWYgKG5vdGVDYWNoZS5oYXMocmVmKSkgcmV0dXJuO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBkZVJlZihyZWYgYXMgUmVmKTtcbiAgICBub3RlQ2FjaGUuc2V0KHJlZiwgZGF0YSBhcyBKc29uYWJsZSk7XG4gICAgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBmb3IgKGNvbnN0IGRlcCBvZiBwYXJzZURlcHMoZGF0YSkpIGF3YWl0IHByZWZldGNoKGRlcCk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGNhbGxMb2NhbDogTG9jYWxFeGVjdXRvciA9IGFzeW5jIChmbklucHV0OiBSZWYgfCBKc29uYWJsZSwgYXJnc0lucHV0OiBSZWYgfCBKc29uYWJsZSk6IFByb21pc2U8dW5rbm93bj4gPT4ge1xuICAgIGNvbnN0IGZuUmVmID0gYXdhaXQgYXNSZWYoZm5JbnB1dCk7XG4gICAgY29uc3QgYXJnc1JlZiA9IGF3YWl0IGFzUmVmKGFyZ3NJbnB1dCk7XG5cbiAgICBjb25zdCBmbk5vdGUgPSBhd2FpdCBkZVJlZihmblJlZik7XG4gICAgaWYgKHR5cGVvZiBmbk5vdGUgIT09IFwic3RyaW5nXCIpIHRocm93IG5ldyBFcnJvcihcImZ1bmN0aW9uIG5vdGUgbXVzdCByZXNvbHZlIHRvIGEgc3RyaW5nXCIpO1xuICAgIGNvbnN0IGFyZ3NOb3RlID0gYXdhaXQgZGVSZWYoYXJnc1JlZik7XG4gICAgY29uc3QgYXJncyA9IEFycmF5LmlzQXJyYXkoYXJnc05vdGUpID8gYXJnc05vdGUgOiBbYXJnc05vdGVdO1xuXG4gICAgY29uc3Qgc3RvcmUgPSBtYWtlU3RvcmUoZm5SZWYsIG1lbVN0b3JlLCBscyk7XG4gICAgY29uc3QgcmVtb3RlID0gKGZuOiB1bmtub3duKTogKC4uLnJlbW90ZUFyZ3M6IChSZWYgfCBKc29uYWJsZSlbXSkgPT4gUHJvbWlzZTxKc29uYWJsZT4gPT4ge1xuICAgICAgY29uc3QgaGFzaCA9IGZuVG9IYXNoLmdldChmbiBhcyBGdW5jdGlvbikgPz8gZm47XG4gICAgICByZXR1cm4gKC4uLnJlbW90ZUFyZ3M6IChSZWYgfCBKc29uYWJsZSlbXSkgPT4gY2FsbE5vdGUoaGFzaCBhcyBSZWYgfCBKc29uYWJsZSwgcmVtb3RlQXJncyk7XG4gICAgfTtcblxuICAgIC8qKiBSZXR1cm4gYSBjYWxsYWJsZSB3cmFwcGVyIHRoYXQgcnVucyB0aGUgZGVwJ3MgYm9keSB3aXRoIGFyZ3MgYXJyYXksIG93biBzdG9yZS4gKi9cbiAgICBjb25zdCBnZXRGdW5jU3luYyA9IChyZWY6IHN0cmluZyk6ICguLi5jYWxsQXJnczogdW5rbm93bltdKSA9PiB1bmtub3duID0+IHtcbiAgICAgIGNvbnN0IHNyYyA9IG5vdGVDYWNoZS5nZXQocmVmKTtcbiAgICAgIGlmIChzcmMgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IEVycm9yKGBnZXRGdW5jU3luYzogbm90ZSAke3JlZn0gbm90IGluIGNhY2hlYCk7XG4gICAgICBpZiAodHlwZW9mIHNyYyAhPT0gXCJzdHJpbmdcIikgdGhyb3cgbmV3IEVycm9yKGBnZXRGdW5jU3luYzogbm90ZSAke3JlZn0gaXMgbm90IGNvZGVgKTtcbiAgICAgIGNvbnN0IGZuID0gKC4uLmNhbGxBcmdzOiB1bmtub3duW10pID0+IHtcbiAgICAgICAgY29uc3QgZGVwU3RvcmUgPSBtYWtlU3RvcmUocmVmLCBtZW1TdG9yZSwgbHMpO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBydW5XaXRoRnVlbFNoYXJlZChzcmMsIGZ1ZWxSZWYsIHsgLi4uZW52LCBhcmdzOiBjYWxsQXJncywgc3RvcmU6IGRlcFN0b3JlIH0pO1xuICAgICAgICBpZiAoXCJlcnJcIiBpbiByZXN1bHQpIHRocm93IG5ldyBFcnJvcihyZXN1bHQuZXJyKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5vaztcbiAgICAgIH07XG4gICAgICBmblRvSGFzaC5zZXQoZm4sIHJlZik7XG4gICAgICByZXR1cm4gZm47XG4gICAgfTtcblxuICAgIC8qKiBSZXR1cm4gSlNPTiBkYXRhIGZyb20gYSBwcmVmZXRjaGVkIG5vdGUuICovXG4gICAgY29uc3QgZ2V0RGF0YVN5bmMgPSAocmVmOiBzdHJpbmcpOiB1bmtub3duID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBub3RlQ2FjaGUuZ2V0KHJlZik7XG4gICAgICBpZiAoZGF0YSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgRXJyb3IoYGdldERhdGFTeW5jOiBub3RlICR7cmVmfSBub3QgaW4gY2FjaGVgKTtcbiAgICAgIHJldHVybiBkYXRhO1xuICAgIH07XG5cbiAgICBjb25zdCBlbnY6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge1xuICAgICAgLi4uKG9wdGlvbnMuZW52ID8/IHt9KSxcbiAgICAgIGFyZ3MsXG4gICAgICBjYWxsOiBjYWxsTG9jYWwsXG4gICAgICBjYWxsTm90ZTogY2FsbExvY2FsLFxuICAgICAgcmVtb3RlLFxuICAgICAgc3RvcmUsXG4gICAgICBnZXRGdW5jU3luYyxcbiAgICAgIGdldERhdGFTeW5jLFxuICAgICAgYWRkTm90ZSxcbiAgICAgIGdldE5vdGUsXG4gICAgICBhc1JlZixcbiAgICAgIGRlcmVmOiBkZVJlZixcbiAgICAgIGhhc2hEYXRhLFxuICAgICAgZnJvbWpzb24sXG4gICAgICBwcm9tcHRVc2VyLFxuICAgICAgb3BlblJvdXRlclJlcXVlc3QsXG4gICAgICBIVE1MLFxuICAgICAgSlNPTixcbiAgICAgIGNvbnNvbGUsXG4gICAgfTtcblxuICAgIC8vIFByZS1mZXRjaCBhbGwgZGVwIHNvdXJjZXMgYmVmb3JlIGV4ZWN1dGluZ1xuICAgIGNvbnN0IGRlcHMgPSBwYXJzZURlcHMoZm5Ob3RlKTtcbiAgICBmb3IgKGNvbnN0IGRlcCBvZiBkZXBzKSBhd2FpdCBwcmVmZXRjaChkZXApO1xuXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcnVuV2l0aEZ1ZWxTaGFyZWRBc3luYyhcbiAgICAgIGZuTm90ZSxcbiAgICAgIGZ1ZWxSZWYsXG4gICAgICBlbnYsXG4gICAgKTtcblxuICAgIGlmIChcImVyclwiIGluIHJlc3VsdCkgdGhyb3cgbmV3IEVycm9yKHJlc3VsdC5lcnIpO1xuICAgIHJldHVybiByZXN1bHQub2s7XG4gIH07XG5cbiAgcmV0dXJuIGNhbGxMb2NhbDtcbn07XG5cbmV4cG9ydCBjb25zdCBjYWxsTm90ZUNsaWVudCA9IGFzeW5jIChcbiAgZm46IFJlZiB8IEpzb25hYmxlLFxuICBhcmdzPzogKFJlZiB8IEpzb25hYmxlKVtdLFxuICBvcHRpb25zOiBDbGllbnRGdWVsT3B0aW9ucyA9IHt9XG4pOiBQcm9taXNlPEpzb25hYmxlPiA9PiB7XG4gIGNvbnN0IGNhbGxMb2NhbCA9IGNyZWF0ZUxvY2FsRXhlY3V0b3Iob3B0aW9ucyk7XG4gIHJldHVybiAoYXdhaXQgY2FsbExvY2FsKGZuLCBhcmdzID8/IFtdKSkgYXMgSnNvbmFibGU7XG59O1xuXG5leHBvcnQgY29uc3QgY2FsbFZpZXdDbGllbnQgPSBhc3luYyAoXG4gIGZuOiBSZWYgfCBKc29uYWJsZSxcbiAgX2FyZ3M/OiAoUmVmIHwgSnNvbmFibGUpW10sXG4gIG9wdGlvbnM6IENsaWVudEZ1ZWxPcHRpb25zID0ge31cbik6IFByb21pc2U8Vmlldz4gPT4ge1xuICAvLyBWaWV3IG5vdGVzIGhhdmUgaW5saW5lZCBib2RpZXMgXHUyMDE0IGFyZ3NbMF0gaXMgdGhlIHVwcGVyIG9iamVjdC5cbiAgLy8gUHJlLWZldGNoIGRlcCBzb3VyY2VzIGFzeW5jLCB0aGVuIHJldHVybiBhIHN5bmMgd3JhcHBlci5cbiAgY29uc3QgZnVlbEJ1ZGdldCA9IG9wdGlvbnMuZnVlbCA/PyAxMDAwMDA7XG4gIGNvbnN0IGZ1ZWxSZWYgPSB7IHZhbHVlOiBmdWVsQnVkZ2V0IH07XG4gIGNvbnN0IG5vdGVDYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBKc29uYWJsZT4oKTtcbiAgY29uc3QgbWVtU3RvcmUgPSBuZXcgTWFwPHN0cmluZywgSnNvbmFibGU+KCk7XG4gIGNvbnN0IGxzID0gKCgpID0+IHtcbiAgICB0cnkgeyByZXR1cm4gdHlwZW9mIGxvY2FsU3RvcmFnZSAhPT0gXCJ1bmRlZmluZWRcIiA/IGxvY2FsU3RvcmFnZSA6IHVuZGVmaW5lZDsgfSBjYXRjaCB7IHJldHVybiB1bmRlZmluZWQ7IH1cbiAgfSkoKTtcbiAgY29uc3QgcHJvbXB0VXNlciA9IChtZXNzYWdlOiBzdHJpbmcsIGRlZmF1bHRWYWx1ZSA9IFwiXCIpOiBzdHJpbmcgfCBudWxsID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcCA9IChnbG9iYWxUaGlzIGFzIHsgcHJvbXB0PzogKG06IHN0cmluZywgZD86IHN0cmluZykgPT4gc3RyaW5nIHwgbnVsbCB9KS5wcm9tcHQ7XG4gICAgICBpZiAodHlwZW9mIHAgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHAobWVzc2FnZSwgZGVmYXVsdFZhbHVlKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIG5vLW9wXG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9O1xuXG4gIC8vIE1hcCBmcm9tIHdyYXBwZXIgZnVuY3Rpb24gXHUyMTkyIGhhc2ggKGZvciByZW1vdGUoKSB0byByZXNvbHZlKVxuICBjb25zdCBmblRvSGFzaCA9IG5ldyBNYXA8RnVuY3Rpb24sIHN0cmluZz4oKTtcblxuICBjb25zdCBmblJlZiA9IGF3YWl0IGFzUmVmKGZuKTtcbiAgY29uc3QgZm5Ob3RlID0gYXdhaXQgZGVSZWYoZm5SZWYpO1xuICBpZiAodHlwZW9mIGZuTm90ZSAhPT0gXCJzdHJpbmdcIikgdGhyb3cgbmV3IEVycm9yKFwidmlldyBub3RlIG11c3QgcmVzb2x2ZSB0byBhIHN0cmluZ1wiKTtcblxuICAvKiogUmVjdXJzaXZlbHkgZmV0Y2ggZGVwIGRhdGEgaW50byBub3RlQ2FjaGUgKG5vIGV4ZWN1dGlvbikuICovXG4gIGNvbnN0IHByZWZldGNoID0gYXN5bmMgKHJlZjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgaWYgKG5vdGVDYWNoZS5oYXMocmVmKSkgcmV0dXJuO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBkZVJlZihyZWYgYXMgUmVmKTtcbiAgICBub3RlQ2FjaGUuc2V0KHJlZiwgZGF0YSBhcyBKc29uYWJsZSk7XG4gICAgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBmb3IgKGNvbnN0IGRlcCBvZiBwYXJzZURlcHMoZGF0YSkpIGF3YWl0IHByZWZldGNoKGRlcCk7XG4gICAgfVxuICB9O1xuICBmb3IgKGNvbnN0IGRlcCBvZiBwYXJzZURlcHMoZm5Ob3RlKSkgYXdhaXQgcHJlZmV0Y2goZGVwKTtcblxuICBjb25zdCBzdG9yZSA9IG1ha2VTdG9yZShmblJlZiwgbWVtU3RvcmUsIGxzKTtcbiAgY29uc3QgcmVtb3RlID0gKGZuOiB1bmtub3duKTogKC4uLnJlbW90ZUFyZ3M6IChSZWYgfCBKc29uYWJsZSlbXSkgPT4gUHJvbWlzZTxKc29uYWJsZT4gPT4ge1xuICAgIGNvbnN0IGhhc2ggPSBmblRvSGFzaC5nZXQoZm4gYXMgRnVuY3Rpb24pID8/IGZuO1xuICAgIHJldHVybiAoLi4ucmVtb3RlQXJnczogKFJlZiB8IEpzb25hYmxlKVtdKSA9PiBjYWxsTm90ZShoYXNoIGFzIFJlZiB8IEpzb25hYmxlLCByZW1vdGVBcmdzKTtcbiAgfTtcblxuICAvKiogUmV0dXJuIGEgY2FsbGFibGUgd3JhcHBlciB0aGF0IHJ1bnMgdGhlIGRlcCdzIGJvZHkgd2l0aCBhcmdzIGFycmF5LCBvd24gc3RvcmUuICovXG4gIGNvbnN0IGdldEZ1bmNTeW5jID0gKHJlZjogc3RyaW5nKTogKC4uLmNhbGxBcmdzOiB1bmtub3duW10pID0+IHVua25vd24gPT4ge1xuICAgIGNvbnN0IHNyYyA9IG5vdGVDYWNoZS5nZXQocmVmKTtcbiAgICBpZiAoc3JjID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBFcnJvcihgZ2V0RnVuY1N5bmM6IG5vdGUgJHtyZWZ9IG5vdCBpbiBjYWNoZWApO1xuICAgIGlmICh0eXBlb2Ygc3JjICE9PSBcInN0cmluZ1wiKSB0aHJvdyBuZXcgRXJyb3IoYGdldEZ1bmNTeW5jOiBub3RlICR7cmVmfSBpcyBub3QgY29kZWApO1xuICAgIGNvbnN0IGZuID0gKC4uLmNhbGxBcmdzOiB1bmtub3duW10pID0+IHtcbiAgICAgIGNvbnN0IGRlcFN0b3JlID0gbWFrZVN0b3JlKHJlZiwgbWVtU3RvcmUsIGxzKTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHJ1bldpdGhGdWVsU2hhcmVkKHNyYywgZnVlbFJlZiwgeyAuLi5iYXNlRW52LCBhcmdzOiBjYWxsQXJncywgc3RvcmU6IGRlcFN0b3JlIH0pO1xuICAgICAgaWYgKFwiZXJyXCIgaW4gcmVzdWx0KSB0aHJvdyBuZXcgRXJyb3IocmVzdWx0LmVycik7XG4gICAgICByZXR1cm4gcmVzdWx0Lm9rO1xuICAgIH07XG4gICAgZm5Ub0hhc2guc2V0KGZuLCByZWYpO1xuICAgIHJldHVybiBmbjtcbiAgfTtcblxuICAvKiogUmV0dXJuIEpTT04gZGF0YSBmcm9tIGEgcHJlZmV0Y2hlZCBub3RlLiAqL1xuICBjb25zdCBnZXREYXRhU3luYyA9IChyZWY6IHN0cmluZyk6IHVua25vd24gPT4ge1xuICAgIGNvbnN0IGRhdGEgPSBub3RlQ2FjaGUuZ2V0KHJlZik7XG4gICAgaWYgKGRhdGEgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IEVycm9yKGBnZXREYXRhU3luYzogbm90ZSAke3JlZn0gbm90IGluIGNhY2hlYCk7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH07XG5cbiAgY29uc3QgYmFzZUVudjogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7XG4gICAgLi4uKG9wdGlvbnMuZW52ID8/IHt9KSxcbiAgICByZW1vdGUsIGdldEZ1bmNTeW5jLCBnZXREYXRhU3luYywgc3RvcmUsIGFkZE5vdGUsIGdldE5vdGUsIGFzUmVmLCBkZXJlZjogZGVSZWYsIGhhc2hEYXRhLCBmcm9tanNvbiwgcHJvbXB0VXNlciwgb3BlblJvdXRlclJlcXVlc3QsIEhUTUwsIEpTT04sIGNvbnNvbGUsXG4gIH07XG5cbiAgLy8gSW5saW5lZCBib2R5IFx1MjAxNCBhcmdzWzBdIGlzIHRoZSB3aW5kb3cgb2JqZWN0LlxuICByZXR1cm4gKHVwcGVyOiBWaWV3Q29udGV4dCk6IFZEb20gPT4ge1xuICAgIC8vIEluc3RhbGwgY2FsbGJhY2sgb24gdGhlIGFjdHVhbCBWaWV3Q29udGV4dCBvYmplY3QgdXNlZCBieSByZW5kZXJEb20gZXZlbnQgZGlzcGF0Y2guXG4gICAgdXBwZXIub25Vc2VyRXZlbnQgPSAoKSA9PiB7XG4gICAgICBmdWVsUmVmLnZhbHVlID0gZnVlbEJ1ZGdldDtcbiAgICB9O1xuICAgIGNvbnN0IHJlc3VsdCA9IHJ1bldpdGhGdWVsU2hhcmVkKGZuTm90ZSwgZnVlbFJlZiwgeyAuLi5iYXNlRW52LCBhcmdzOiBbdXBwZXJdIH0pO1xuICAgIGlmIChcImVyclwiIGluIHJlc3VsdCkgdGhyb3cgbmV3IEVycm9yKHJlc3VsdC5lcnIpO1xuICAgIHJldHVybiByZXN1bHQub2sgYXMgVkRvbTtcbiAgfTtcbn07XG4iLCAiaW1wb3J0IHsgY2FsbFZpZXdDbGllbnQsIEhUTUwsIHJlbmRlckRvbSB9IGZyb20gXCJAaGFzaG5vdGVzL2xpYlwiO1xuaW1wb3J0IHsgaXNSZWYsIHRvanNvbiwgdHlwZSBSZWYgfSBmcm9tIFwiQGhhc2hub3Rlcy9jb3JlL25vdGVzXCI7XG5pbXBvcnQgeyBnZXROb3RlLCBnZXRTZXJ2ZXIgfSBmcm9tIFwiLi4vLi4vbGliL3NyYy9kYlwiO1xuXG5jb25zdCBERVZfVVJMID0gXCJodHRwOi8vbG9jYWxob3N0OjQzMjFcIjtcbnR5cGUgSGlzdG9yeUVudHJ5ID0geyB0c0hhc2g6IHN0cmluZzsganNIYXNoOiBzdHJpbmc7IGV4cG9ydE5hbWU6IHN0cmluZzsgZmlsZW5hbWU/OiBzdHJpbmcgfTtcblxuY29uc3QgZWwgPSAodGFnOiBzdHJpbmcsIHRleHQ/OiBzdHJpbmcpOiBIVE1MRWxlbWVudCA9PiB7XG4gIGNvbnN0IGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyk7XG4gIGlmICh0ZXh0KSBlLnRleHRDb250ZW50ID0gdGV4dDtcbiAgcmV0dXJuIGU7XG59O1xuXG5jb25zdCBlcnJvclRleHQgPSAoZXJyOiB1bmtub3duKTogc3RyaW5nID0+IHtcbiAgaWYgKGVyciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgY29uc3Qgc3RhY2sgPSBlcnIuc3RhY2sgPyBgXFxuJHtlcnIuc3RhY2t9YCA6IFwiXCI7XG4gICAgcmV0dXJuIGAke2Vyci5uYW1lfTogJHtlcnIubWVzc2FnZX0ke3N0YWNrfWA7XG4gIH1cbiAgcmV0dXJuIFN0cmluZyhlcnIpO1xufTtcblxuY29uc3QgcmVwb3J0RGV2RXJyb3IgPSBhc3luYyAoc291cmNlOiBzdHJpbmcsIGVycjogdW5rbm93bikgPT4ge1xuICBjb25zdCBtZXNzYWdlID0gZXJyb3JUZXh0KGVycik7XG4gIGNvbnN0IHN0YWNrID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyAoZXJyLnN0YWNrIHx8IFwiXCIpIDogXCJcIjtcbiAgdHJ5IHtcbiAgICBhd2FpdCBmZXRjaChgJHtERVZfVVJMfS9icm93c2VyLWVycm9yYCwge1xuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgIGhlYWRlcnM6IHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgc291cmNlLFxuICAgICAgICBtZXNzYWdlLFxuICAgICAgICBzdGFjayxcbiAgICAgICAgcGFnZTogd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLFxuICAgICAgfSksXG4gICAgfSk7XG4gIH0gY2F0Y2gge1xuICAgIC8vIFJlcG9ydGluZyBzaG91bGQgbmV2ZXIgYnJlYWsgdGhlIFVJIGZsb3cuXG4gIH1cbn07XG5cbmNvbnN0IHJlbmRlckVycm9yUGFuZWwgPSAoXG4gIG1vdW50OiBIVE1MRWxlbWVudCxcbiAgdGl0bGU6IHN0cmluZyxcbiAgZXJyOiB1bmtub3duLFxuICBjb250ZXh0OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge30sXG4pID0+IHtcbiAgbW91bnQuaW5uZXJIVE1MID0gXCJcIjtcblxuICBjb25zdCBib3ggPSBlbChcImRpdlwiKTtcbiAgYm94LnN0eWxlLmNzc1RleHQgPSBcIm1hcmdpbjo4cHggMDtwYWRkaW5nOjEycHg7Ym9yZGVyOjFweCBzb2xpZCAjYjQ0O2JhY2tncm91bmQ6cmdiYSgxODAsNjgsNjgsMC4xMik7XCI7XG5cbiAgY29uc3QgaCA9IGVsKFwiaDNcIiwgdGl0bGUpO1xuICBoLnN0eWxlLmNzc1RleHQgPSBcIm1hcmdpbjowIDAgOHB4IDA7Zm9udC1zaXplOjFyZW07XCI7XG4gIGJveC5hcHBlbmQoaCk7XG5cbiAgY29uc3QgbWV0YSA9IE9iamVjdC5lbnRyaWVzKGNvbnRleHQpXG4gICAgLm1hcCgoW2ssIHZdKSA9PiBgJHtrfTogJHt2fWApXG4gICAgLmpvaW4oXCJcXG5cIik7XG4gIGlmIChtZXRhKSB7XG4gICAgY29uc3QgbSA9IGVsKFwicHJlXCIsIG1ldGEpO1xuICAgIG0uc3R5bGUuY3NzVGV4dCA9IFwibWFyZ2luOjAgMCA4cHggMDt3aGl0ZS1zcGFjZTpwcmUtd3JhcDtvcGFjaXR5OjAuODU7XCI7XG4gICAgYm94LmFwcGVuZChtKTtcbiAgfVxuXG4gIGNvbnN0IGJvZHkgPSBlbChcInByZVwiLCBlcnJvclRleHQoZXJyKSk7XG4gIGJvZHkuc3R5bGUuY3NzVGV4dCA9IFwibWFyZ2luOjA7d2hpdGUtc3BhY2U6cHJlLXdyYXA7b3ZlcmZsb3c6YXV0bzttYXgtaGVpZ2h0OjUwdmg7XCI7XG4gIGJveC5hcHBlbmQoYm9keSk7XG4gIG1vdW50LmFwcGVuZChib3gpO1xufTtcblxuY29uc3QgcGFyc2VQYXRoU2VnID0gKHBhdGhuYW1lOiBzdHJpbmcsIGlkeDogbnVtYmVyKTogc3RyaW5nID0+IHtcbiAgY29uc3Qgc2VncyA9IHBhdGhuYW1lLnJlcGxhY2UoL15cXC8rLywgXCJcIikuc3BsaXQoXCIvXCIpO1xuICBpZiAoaWR4IDwgMCB8fCBpZHggPj0gc2Vncy5sZW5ndGgpIHJldHVybiBcIlwiO1xuICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHNlZ3NbaWR4XSkudHJpbSgpO1xufTtcblxuY29uc3QgcGFyc2VSZWZBdCA9IChwYXRobmFtZTogc3RyaW5nLCBpZHg6IG51bWJlcik6IFJlZiB8IG51bGwgPT4ge1xuICBjb25zdCBzZWcgPSBwYXJzZVBhdGhTZWcocGF0aG5hbWUsIGlkeCk7XG4gIGlmICghc2VnKSByZXR1cm4gbnVsbDtcbiAgaWYgKGlzUmVmKHNlZykpIHJldHVybiBzZWc7XG4gIGlmICgvXlthLWYwLTldezMyfSQvaS50ZXN0KHNlZykpIHJldHVybiBgIyR7c2VnfWA7XG4gIHJldHVybiBudWxsO1xufTtcblxuY29uc3Qgc3RhcnRQb2xsaW5nID0gKG1vdW50OiBIVE1MRWxlbWVudCwgcG9sbDogKCkgPT4gUHJvbWlzZTx2b2lkPikgPT4ge1xuICBtb3VudC5pbm5lckhUTUwgPSBcIlwiO1xuICBtb3VudC50ZXh0Q29udGVudCA9IFwiQ29ubmVjdGluZyB0byBkZXYgc2VydmVyLi4uXCI7XG4gIGNvbnN0IHJ1biA9IGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgcG9sbCgpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc29sZS5lcnJvcihcImxpdmUgcG9sbCBmYWlsZWRcIiwgZXJyKTtcbiAgICAgIHZvaWQgcmVwb3J0RGV2RXJyb3IoXCJwb2xsXCIsIGVycik7XG4gICAgfVxuICB9O1xuICBydW4oKTtcbiAgc2V0SW50ZXJ2YWwocnVuLCA1MDApO1xufTtcblxuY29uc3QgZmV0Y2hIaXN0b3J5ID0gYXN5bmMgKCk6IFByb21pc2U8SGlzdG9yeUVudHJ5W10+ID0+XG4gIEpTT04ucGFyc2UoYXdhaXQgKGF3YWl0IGZldGNoKGAke0RFVl9VUkx9L2hpc3RvcnlgKSkudGV4dCgpKTtcblxuY29uc3QgbGF0ZXN0VmlldyA9IChoaXN0b3J5OiBIaXN0b3J5RW50cnlbXSkgPT5cbiAgWy4uLmhpc3RvcnldLnJldmVyc2UoKS5maW5kKGUgPT4gZS5leHBvcnROYW1lID09PSBcInZpZXdcIiB8fCBlLmV4cG9ydE5hbWUgPT09IFwiZGVmYXVsdFwiKTtcblxuY29uc3QgcmVuZGVyUmVmID0gYXN5bmMgKG1vdW50OiBIVE1MRWxlbWVudCwgcmVmOiBSZWYpID0+IHtcbiAgY29uc3Qgbm90ZSA9IGF3YWl0IGdldE5vdGUocmVmKTtcbiAgdHJ5IHtcbiAgICBjb25zdCB2aWV3ID0gYXdhaXQgY2FsbFZpZXdDbGllbnQocmVmKTtcbiAgICBtb3VudC5pbm5lckhUTUwgPSBcIlwiO1xuICAgIG1vdW50LmFwcGVuZChyZW5kZXJEb20odmlldywgeyBwYXRobmFtZTogd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lIH0pKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdm9pZCByZXBvcnREZXZFcnJvcihcInJlbmRlclJlZlwiLCBlcnIpO1xuICAgIHJlbmRlckVycm9yUGFuZWwobW91bnQsIFwiRmFpbGVkIHRvIHJlbmRlciBub3RlIHZpZXdcIiwgZXJyLCB7XG4gICAgICByZWYsXG4gICAgICBwYXRoOiB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUsXG4gICAgICBub3RlOiB0b2pzb24obm90ZSksXG4gICAgfSk7XG4gIH1cbn07XG5cbmNvbnN0IHJlbmRlclJhd1JlZiA9IGFzeW5jIChtb3VudDogSFRNTEVsZW1lbnQsIHJlZjogUmVmKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3Qgbm90ZSA9IGF3YWl0IGdldE5vdGUocmVmKTtcbiAgICBtb3VudC5pbm5lckhUTUwgPSBcIlwiO1xuICAgIGNvbnN0IHdyYXAgPSBlbChcImRpdlwiKTtcbiAgICB3cmFwLnN0eWxlLmNzc1RleHQgPSBcInBhZGRpbmc6OHB4O1wiO1xuICAgIGNvbnN0IGggPSBlbChcImgzXCIsIGByYXcgbm90ZSAke3JlZn1gKTtcbiAgICBoLnN0eWxlLmNzc1RleHQgPSBcIm1hcmdpbjowIDAgOHB4IDA7Zm9udC1zaXplOjFyZW07XCI7XG4gICAgY29uc3QgcHJlID0gZWwoXCJwcmVcIiwgdG9qc29uKG5vdGUpKTtcbiAgICBwcmUuc3R5bGUuY3NzVGV4dCA9IFwibWFyZ2luOjA7d2hpdGUtc3BhY2U6cHJlLXdyYXA7b3ZlcmZsb3c6YXV0bzttYXgtaGVpZ2h0Ojcwdmg7XCI7XG4gICAgd3JhcC5hcHBlbmQoaCwgcHJlKTtcbiAgICBtb3VudC5hcHBlbmQod3JhcCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHZvaWQgcmVwb3J0RGV2RXJyb3IoXCJyZW5kZXJSYXdSZWZcIiwgZXJyKTtcbiAgICByZW5kZXJFcnJvclBhbmVsKG1vdW50LCBcIkZhaWxlZCB0byBsb2FkIHJhdyBub3RlXCIsIGVyciwge1xuICAgICAgcmVmLFxuICAgICAgcGF0aDogd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLFxuICAgIH0pO1xuICB9XG59O1xuXG5jb25zdCBib290TGl2ZVZpZXcgPSAobW91bnQ6IEhUTUxFbGVtZW50LCBwYXRoOiBzdHJpbmcpID0+IHtcbiAgbGV0IGxhc3QgPSBcIlwiO1xuICBsZXQgbGFzdEVycm9yS2V5ID0gXCJcIjtcbiAgc3RhcnRQb2xsaW5nKG1vdW50LCBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGhpc3RvcnkgPSBhd2FpdCBmZXRjaEhpc3RvcnkoKTtcbiAgICAgIGNvbnN0IHZpZXcgPSBsYXRlc3RWaWV3KGhpc3RvcnkpO1xuICAgICAgaWYgKCF2aWV3KSB7IG1vdW50LmlubmVySFRNTCA9IFwiXCI7IG1vdW50LmFwcGVuZChlbChcInBcIiwgXCJObyB2aWV3IGZvdW5kLlwiKSk7IHJldHVybjsgfVxuICAgICAgaWYgKHZpZXcuanNIYXNoID09PSBsYXN0KSByZXR1cm47XG4gICAgICBsYXN0ID0gdmlldy5qc0hhc2g7XG5cbiAgICAgIGNvbnN0IGJhciA9IGVsKFwiZGl2XCIpO1xuICAgICAgYmFyLnN0eWxlLmNzc1RleHQgPSBcInBhZGRpbmc6NHB4IDhweDtmb250LXNpemU6MC44NWVtO29wYWNpdHk6MC42O1wiO1xuICAgICAgY29uc3QgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICAgICAgYS5ocmVmID0gYC92aWV3LyR7dmlldy5qc0hhc2guc2xpY2UoMSl9YDtcbiAgICAgIGEudGV4dENvbnRlbnQgPSBgJHt2aWV3LmZpbGVuYW1lID8/IHZpZXcuZXhwb3J0TmFtZX0gXHUyMTkyICR7dmlldy5qc0hhc2guc2xpY2UoMCwgMTQpfVx1MjAyNmA7XG4gICAgICBiYXIuYXBwZW5kKGEpO1xuXG4gICAgICBjb25zdCByZW5kZXJlZCA9IHJlbmRlckRvbShhd2FpdCBjYWxsVmlld0NsaWVudCh2aWV3LmpzSGFzaCBhcyBSZWYpLCB7IHBhdGhuYW1lOiBwYXRoLnJlcGxhY2UoXCIvbGl2ZS92aWV3XCIsIFwiXCIpIHx8IFwiL1wiIH0pO1xuICAgICAgbW91bnQuaW5uZXJIVE1MID0gXCJcIjtcbiAgICAgIG1vdW50LmFwcGVuZChiYXIsIHJlbmRlcmVkKTtcbiAgICAgIGxhc3RFcnJvcktleSA9IFwiXCI7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zdCBrZXkgPSBlcnJvclRleHQoZXJyKTtcbiAgICAgIHZvaWQgcmVwb3J0RGV2RXJyb3IoXCJib290TGl2ZVZpZXdcIiwgZXJyKTtcbiAgICAgIGlmIChrZXkgIT09IGxhc3RFcnJvcktleSkge1xuICAgICAgICByZW5kZXJFcnJvclBhbmVsKG1vdW50LCBcIkZhaWxlZCB0byByZW5kZXIgbGF0ZXN0IGxpdmUgdmlld1wiLCBlcnIsIHtcbiAgICAgICAgICBwYXRoLFxuICAgICAgICAgIHJldHJ5OiBcImF1dG9tYXRpYyAoNTAwbXMpXCIsXG4gICAgICAgIH0pO1xuICAgICAgICBsYXN0RXJyb3JLZXkgPSBrZXk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn07XG5cbmNvbnN0IGJvb3RMaXZlSW5kZXggPSAobW91bnQ6IEhUTUxFbGVtZW50KSA9PiB7XG4gIGxldCBsYXN0ID0gXCJcIjtcbiAgc3RhcnRQb2xsaW5nKG1vdW50LCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QganNvbiA9IGF3YWl0IChhd2FpdCBmZXRjaChgJHtERVZfVVJMfS9oaXN0b3J5YCkpLnRleHQoKTtcbiAgICBpZiAoanNvbiA9PT0gbGFzdCkgcmV0dXJuO1xuICAgIGxhc3QgPSBqc29uO1xuXG4gICAgY29uc3QgaGlzdG9yeTogSGlzdG9yeUVudHJ5W10gPSBKU09OLnBhcnNlKGpzb24pO1xuICAgIG1vdW50LmlubmVySFRNTCA9IFwiXCI7XG4gICAgbW91bnQuYXBwZW5kKGVsKFwiaDJcIiwgXCJoYXNobm90ZXMgZGV2XCIpKTtcbiAgICBtb3VudC5hcHBlbmQoZWwoXCJwXCIsIGAke2hpc3RvcnkubGVuZ3RofSBjb21waWxlZCBub3RlcyAoJHtnZXRTZXJ2ZXIoKX0pYCkpO1xuXG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBoaXN0b3J5KSB7XG4gICAgICBjb25zdCByb3cgPSBlbChcImRpdlwiKTtcbiAgICAgIGNvbnN0IGlzVmlldyA9IGVudHJ5LmV4cG9ydE5hbWUgPT09IFwidmlld1wiIHx8IGVudHJ5LmV4cG9ydE5hbWUgPT09IFwiZGVmYXVsdFwiO1xuICAgICAgaWYgKGlzVmlldykge1xuICAgICAgICBjb25zdCBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG4gICAgICAgIGEuaHJlZiA9IGAvdmlldy8ke2VudHJ5LmpzSGFzaC5zbGljZSgxKX1gO1xuICAgICAgICBhLnRleHRDb250ZW50ID0gZW50cnkuZXhwb3J0TmFtZTtcbiAgICAgICAgcm93LmFwcGVuZChhKTtcbiAgICAgICAgY29uc3QgcmF3ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG4gICAgICAgIHJhdy5ocmVmID0gYC8ke2VudHJ5LmpzSGFzaC5zbGljZSgxKX1gO1xuICAgICAgICByYXcudGV4dENvbnRlbnQgPSBcIiAocmF3KVwiO1xuICAgICAgICByYXcuc3R5bGUuY3NzVGV4dCA9IFwib3BhY2l0eTowLjU7Zm9udC1zaXplOjAuODVlbTtcIjtcbiAgICAgICAgcm93LmFwcGVuZChyYXcpO1xuICAgICAgICBjb25zdCBsaXZlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG4gICAgICAgIGxpdmUuaHJlZiA9IFwiL2xpdmUvdmlld1wiO1xuICAgICAgICBsaXZlLnRleHRDb250ZW50ID0gXCIgKGxpdmUpXCI7XG4gICAgICAgIGxpdmUuc3R5bGUuY3NzVGV4dCA9IFwib3BhY2l0eTowLjU7Zm9udC1zaXplOjAuODVlbTtcIjtcbiAgICAgICAgcm93LmFwcGVuZChsaXZlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHNwYW4gPSBlbChcInNwYW5cIiwgZW50cnkuZXhwb3J0TmFtZSk7XG4gICAgICAgIHNwYW4uc3R5bGUub3BhY2l0eSA9IFwiMC41XCI7XG4gICAgICAgIHJvdy5hcHBlbmQoc3Bhbik7XG4gICAgICB9XG4gICAgICBjb25zdCBoYXNoID0gZWwoXCJzcGFuXCIsIGAgJHtlbnRyeS5qc0hhc2guc2xpY2UoMCwgMTQpfVx1MjAyNmApO1xuICAgICAgaGFzaC5zdHlsZS5jc3NUZXh0ID0gXCJvcGFjaXR5OjAuNDtmb250LXNpemU6MC44NWVtO1wiO1xuICAgICAgcm93LmFwcGVuZChoYXNoKTtcbiAgICAgIG1vdW50LmFwcGVuZChyb3cpO1xuICAgIH1cbiAgfSk7XG59O1xuXG5leHBvcnQgY29uc3QgYm9vdCA9IGFzeW5jICgpID0+IHtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJlcnJvclwiLCAoZXYpID0+IHtcbiAgICB2b2lkIHJlcG9ydERldkVycm9yKFwid2luZG93Lm9uZXJyb3JcIiwgZXYuZXJyb3IgfHwgZXYubWVzc2FnZSk7XG4gIH0pO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInVuaGFuZGxlZHJlamVjdGlvblwiLCAoZXYpID0+IHtcbiAgICB2b2lkIHJlcG9ydERldkVycm9yKFwid2luZG93LnVuaGFuZGxlZHJlamVjdGlvblwiLCBldi5yZWFzb24pO1xuICB9KTtcblxuICBjb25zdCBtb3VudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYXBwXCIpID8/IGRvY3VtZW50LmJvZHk7XG4gIGNvbnN0IHBhdGggPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcblxuICBpZiAocGF0aC5zdGFydHNXaXRoKFwiL2xpdmUvdmlld1wiKSkgcmV0dXJuIGJvb3RMaXZlVmlldyhtb3VudCwgcGF0aCk7XG4gIGlmIChwYXRoID09PSBcIi9saXZlXCIpIHJldHVybiBib290TGl2ZUluZGV4KG1vdW50KTtcblxuICBpZiAocGF0aC5zdGFydHNXaXRoKFwiL3ZpZXcvXCIpKSB7XG4gICAgY29uc3QgcmVmID0gcGFyc2VSZWZBdChwYXRoLCAxKTtcbiAgICBpZiAoIXJlZikgeyBtb3VudC50ZXh0Q29udGVudCA9IFwiT3BlbiAvdmlldy88bm90ZS1oYXNoPiB0byByZW5kZXIgdGhhdCBub3RlIGFzIGEgdmlldy5cIjsgcmV0dXJuOyB9XG4gICAgYXdhaXQgcmVuZGVyUmVmKG1vdW50LCByZWYpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHJlZiA9IHBhcnNlUmVmQXQocGF0aCwgMCk7XG4gIGlmICghcmVmKSB7XG4gICAgbW91bnQudGV4dENvbnRlbnQgPSBcIk9wZW4gLzxub3RlLWhhc2g+IGZvciByYXcgZGF0YSBvciAvdmlldy88bm90ZS1oYXNoPiB0byByZW5kZXIgYXMgYSB2aWV3LlwiO1xuICAgIHJldHVybjtcbiAgfVxuICBhd2FpdCByZW5kZXJSYXdSZWYobW91bnQsIHJlZik7XG59O1xuIiwgImltcG9ydCB7IGJvb3QgfSBmcm9tIFwiLi9tYWluLnRzXCI7XG5cbmJvb3QoKS5jYXRjaCgoZXJyKSA9PiB7XG4gIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgY29uc3QgbW91bnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFwcFwiKSA/PyBkb2N1bWVudC5ib2R5O1xuICBtb3VudC50ZXh0Q29udGVudCA9IGBBcHAgYm9vdCBmYWlsZWQ6ICR7U3RyaW5nKGVycil9YDtcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQU1BLElBQU0sY0FBaUMsQ0FBQyxTQUFTLGFBQWEsV0FBVyxhQUFhLFFBQVEsT0FBTztBQUNyRyxJQUFNLGlCQUF1QyxDQUFDLFdBQVcsT0FBTztBQUNoRSxJQUFNLGVBQWU7QUFDckIsSUFBTSxVQUFVLG9CQUFJLElBQUksQ0FBQyxPQUFPLFFBQVEsS0FBSyxRQUFRLFlBQVksV0FBVyxVQUFVLFdBQVcsUUFBUSxNQUFNLENBQUM7QUFDaEgsSUFBTSx3QkFBd0Isb0JBQUksSUFBSSxDQUFDLFdBQVUsU0FBUSxVQUFTLFNBQVEsS0FBSSxRQUFPLFVBQVMsZ0JBQWUsa0JBQWlCLG1CQUFrQixvQkFBbUIscUJBQW9CLEtBQUksS0FBSSxNQUFLLE1BQUssTUFBSyxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssTUFBSyxVQUFTLGFBQVksV0FBVSxhQUFZLGVBQWMsZUFBYyxlQUFjLHFCQUFvQixNQUFLLE1BQUssUUFBTyxVQUFTLEtBQUssQ0FBQztBQXFEcFgsSUFBSSxPQUFPLG9CQUFJLFFBQXVCO0FBQ3RDLElBQUksV0FBVyxvQkFBSSxRQUF1QjtBQU1uQyxJQUFNLFlBQVksQ0FBQyxNQUFZLFdBQWlDLEVB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RyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFLLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFJLElBQUksSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxHQUFHLEtBQUssR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksSUFBSSxJQUFJLEdBQUcsR0FBRyxLQUFLLElBQUksS0FBSyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEtBQUssR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxJQUFJLEtBQUssR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFJLElBQUksR0FBRyxJQUFJLEtBQUssR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFLLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksSUFBSSxNQUFNLEdBQUcsR0FBRyxJQUFJLE9BQU8sSUFBSSxNQUFNLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEtBQUssR0FBRyxLQUFLLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLE9BQU8sR0FBRyxNQUFNLEdBQUcsS0FBSyxJQUFJLEdBQUcsSUFBSSxLQUFLLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEtBQUssR0FBRyxNQUFNLElBQUksS0FBSyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLElBQUksTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFLLEdBQUcsS0FBSyxHQUFHLElBQUksR0FBRyxLQUFLLEdBQUcsSUFBSSxJQUFJLEtBQUssSUFBSSxLQUFLLEdBQUcsR0FBRyxHQUFHLEtBQUssR0FBRyxLQUFLLEdBQUcsR0FBRyxHQUFHLE1BQU0sR0FBRyxRQUFRLEdBQUc7QUFHem9DLElBQUksNkJBQTZCLENBQUMsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksSUFBSSxLQUFLLElBQUksSUFBSSxLQUFLLElBQUksR0FBRyxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksR0FBRyxJQUFJLElBQUksSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEtBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLElBQUksSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksS0FBSyxJQUFJLElBQUksSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksS0FBSyxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksS0FBSyxJQUFJLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxHQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLElBQUksSUFBSSxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksR0FBRyxJQUFJLElBQUksR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxHQUFHLEdBQUcsS0FBSyxJQUFJLElBQUksR0FBRyxJQUFJLElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxLQUFLLElBQUksS0FBSyxJQUFJLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxJQUFJLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLEtBQUssSUFBSSxJQUFJLEdBQUcsR0FBRyxJQUFJLElBQUksR0FBRyxJQUFJLElBQUksS0FBSyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksR0FBRyxLQUFLLElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksS0FBSyxHQUFHLElBQUksS0FBSyxLQUFLLEtBQUssSUFBSSxLQUFLLE1BQU0sSUFBSSxJQUFJLE1BQU0sSUFBSSxHQUFHLElBQUksTUFBTSxHQUFHLEtBQUssTUFBTSxJQUFJLE1BQU0sS0FBSyxHQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxHQUFHLElBQUksS0FBSyxJQUFJLEtBQUssSUFBSSxLQUFLLElBQUksR0FBRyxHQUFHLElBQUksSUFBSSxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksTUFBTSxHQUFHLE1BQU0sSUFBSSxHQUFHLE1BQU0sR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsS0FBSyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxLQUFLLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxNQUFNLElBQUksR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEtBQUssR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsR0FBRyxNQUFNLElBQUksR0FBRyxHQUFHLEtBQUssSUFBSSxLQUFLLElBQUksSUFBSSxHQUFHLElBQUksR0FBRyxLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssSUFBSSxLQUFLLElBQUksR0FBRyxHQUFHLEtBQUssR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEtBQUssSUFBSSxJQUFJLEdBQUcsR0FBRyxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxNQUFNLE9BQU8sSUFBSSxNQUFNLEdBQUcsS0FBSyxHQUFHLE1BQU0sSUFBSSxNQUFNLElBQUksS0FBSyxNQUFNLEtBQUssTUFBTSxNQUFNLEdBQUcsSUFBSTtBQUducEUsSUFBSSwwQkFBMEI7QUFHOUIsSUFBSSwrQkFBK0I7QUFTbkMsSUFBSSxnQkFBZ0I7QUFBQSxFQUNsQixHQUFHO0FBQUEsRUFDSCxHQUFHO0FBQUEsRUFDSCxHQUFHO0FBQUEsRUFDSCxRQUFRO0FBQUEsRUFDUixZQUFZO0FBQ2Q7QUFJ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O0FBQ3ZDLFNBQUssZUFBZSxrQkFBa0IsR0FBRyxTQUFTLEdBQUcsT0FBTztBQUFBLEVBQzlELENBQUM7QUFDRCxTQUFPLGlCQUFpQixzQkFBc0IsQ0FBQyxPQUFPO0FBQ3BELFNBQUssZUFBZSw2QkFBNkIsR0FBRyxNQUFNO0FBQUEsRUFDNUQsQ0FBQztBQUVELFFBQU0sUUFBUSxTQUFTLGVBQWUsS0FBSyxLQUFLLFNBQVM7QUFDekQsUUFBTUEsUUFBTyxPQUFPLFNBQVMsU0FBUyxRQUFRLFFBQVEsRUFBRTtBQUV4RCxNQUFJQSxNQUFLLFdBQVcsWUFBWSxFQUFHLFFBQU8sYUFBYSxPQUFPQSxLQUFJO0FBQ2xFLE1BQUlBLFVBQVMsUUFBUyxRQUFPLGNBQWMsS0FBSztBQUVoRCxNQUFJQSxNQUFLLFdBQVcsUUFBUSxHQUFHO0FBQzdCLFVBQU1ELE9BQU0sV0FBV0MsT0FBTSxDQUFDO0FBQzlCLFFBQUksQ0FBQ0QsTUFBSztBQUFFLFlBQU0sY0FBYztBQUF5RDtBQUFBLElBQVE7QUFDakcsVUFBTSxVQUFVLE9BQU9BLElBQUc7QUFDMUI7QUFBQSxFQUNGO0FBRUEsUUFBTUEsT0FBTSxXQUFXQyxPQUFNLENBQUM7QUFDOUIsTUFBSSxDQUFDRCxNQUFLO0FBQ1IsVUFBTSxjQUFjO0FBQ3BCO0FBQUEsRUFDRjtBQUNBLFFBQU0sYUFBYSxPQUFPQSxJQUFHO0FBQy9COzs7QUN0UEEsS0FBSyxFQUFFLE1BQU0sQ0FBQyxRQUFRO0FBQ3BCLFVBQVEsTUFBTSxHQUFHO0FBQ2pCLFFBQU0sUUFBUSxTQUFTLGVBQWUsS0FBSyxLQUFLLFNBQVM7QUFDekQsUUFBTSxjQUFjLG9CQUFvQixPQUFPLEdBQUcsQ0FBQztBQUNyRCxDQUFDOyIsCiAgIm5hbWVzIjogWyJlbCIsICJvZmZzZXQiLCAiZGF0YSIsICJ0ZXh0IiwgImRhdGEiLCAiVG9rZW5UeXBlIiwgIlBvc2l0aW9uIiwgIlNvdXJjZUxvY2F0aW9uIiwgIm9mZnNldCIsICJ0ZXh0IiwgIlBhcnNlciIsICJyZWYiLCAicGFyc2UiLCAiRGVzdHJ1Y3R1cmluZ0Vycm9ycyIsICJUb2tDb250ZXh0IiwgIlNjb3BlIiwgIk5vZGUiLCAiQnJhbmNoSUQiLCAiUmVnRXhwVmFsaWRhdGlvblN0YXRlIiwgImN1cnJlbnQiLCAiVG9rZW4iLCAiZWwiLCAicGFyc2UiLCAiZWwiLCAiZW52IiwgImVudiIsICJwYXJzZSIsICJ0ZXh0IiwgImRhdGEiLCAibm90ZUNhY2hlIiwgInJlZiIsICJkYXRhIiwgImZuIiwgInRleHQiLCAicmVmIiwgInBhdGgiXQp9Cg==
