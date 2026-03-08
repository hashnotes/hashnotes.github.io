// ../lib/src/views.ts
var mouseEvents = ["click", "mousemove", "mouseup", "mousedown", "mouseout", "drag", "wheel"];
var keyboardEvents = ["keydown", "keyup"];
var svgNamespace = "http://www.w3.org/2000/svg";
var svgTags = /* @__PURE__ */ new Set(["svg", "path", "g", "line", "polyline", "polygon", "circle", "ellipse", "rect", "text"]);
var allowedAttributeNames = /* @__PURE__ */ new Set(["viewBox", "width", "height", "xmlns", "d", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-dasharray", "stroke-dashoffset", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "points", "transform", "opacity", "font-size", "font-family", "font-weight", "text-anchor", "dominant-baseline", "dx", "dy", "href", "target", "rel", "title"]);
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
      const mappedTarget = doms.get(e.target) || dom;
      const event = {
        type,
        target: mappedTarget,
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
      else if (type === "mouseout" && dom.onmouseout) dom.onmouseout(event);
      else if (type === "wheel" && dom.onwheel) dom.onwheel(event);
    }));
    keyboardEvents.forEach((type) => el2.addEventListener(type, (e) => {
      if (ctxRef && ctxRef.onUserEvent) ctxRef.onUserEvent(type);
      let { key, metaKey, shiftKey } = e;
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) dom.value = e.target.value;
      const event = { type, key, metaKey, shiftKey, target: doms.get(e.target) || dom };
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
      if ("onmouseout" in c) dm.onmouseout = c.onmouseout;
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
var setServer = (value) => {
  KV.setItem("db_preset", value);
  SERVER = value;
  console.log("connect to", SERVER);
};
var getServer = () => SERVER;
setServer("local");
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
    const code = parsed?.error?.code;
    const detail = parsed?.error ? clip(JSON.stringify(parsed.error)) : clip(text2);
    if (msg) return `${res.status} ${code ? code + ": " : ""}${msg}
error: ${detail}`;
    return `${res.status} ${detail}`;
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vbGliL3NyYy92aWV3cy50cyIsICIuLi8uLi8uLi9jb3JlL3NyYy9ub3Rlcy50cyIsICIuLi8uLi8uLi9saWIvc3JjL2RiLnRzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9hY29ybi9kaXN0L2Fjb3JuLm1qcyIsICIuLi8uLi8uLi9jb3JlL3NyYy9wYXJzZXIudHMiLCAiLi4vLi4vLi4vY29yZS9zcmMvY29kZWdlbi50cyIsICIuLi8uLi8uLi9saWIvc3JjL29wZW5yb3V0ZXIudHMiLCAiLi4vLi4vLi4vbGliL3NyYy9ydW50aW1lLnRzIiwgIi4uLy4uL3NyYy9tYWluLnRzIiwgIi4uLy4uL3NyYy9lbnRyeS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gcGFnZSB2aWV3XG5cbnR5cGUgTW91c2VFdmVudFR5cGUgPSBcImNsaWNrXCJ8IFwibW91c2Vtb3ZlXCIgfCBcIm1vdXNldXBcIiB8IFwibW91c2Vkb3duXCIgfCBcIm1vdXNlb3V0XCIgfCBcImRyYWdcIiB8IFwid2hlZWxcIlxudHlwZSBLZXlib2FyZEV2ZW50VHlwZSA9IFwia2V5ZG93blwiIHwgXCJrZXl1cFwiXG50eXBlIERvbUV2ZW50VHlwZSA9IE1vdXNlRXZlbnRUeXBlIHwgS2V5Ym9hcmRFdmVudFR5cGU7XG5cbmNvbnN0IG1vdXNlRXZlbnRzIDogTW91c2VFdmVudFR5cGVbXSA9IFtcImNsaWNrXCIsIFwibW91c2Vtb3ZlXCIsIFwibW91c2V1cFwiLCBcIm1vdXNlZG93blwiLCBcIm1vdXNlb3V0XCIsIFwiZHJhZ1wiLCBcIndoZWVsXCJdO1xuY29uc3Qga2V5Ym9hcmRFdmVudHMgOiBLZXlib2FyZEV2ZW50VHlwZVtdID0gW1wia2V5ZG93blwiLCBcImtleXVwXCJdO1xuY29uc3Qgc3ZnTmFtZXNwYWNlID0gXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiO1xuY29uc3Qgc3ZnVGFncyA9IG5ldyBTZXQoW1wic3ZnXCIsIFwicGF0aFwiLCBcImdcIiwgXCJsaW5lXCIsIFwicG9seWxpbmVcIiwgXCJwb2x5Z29uXCIsIFwiY2lyY2xlXCIsIFwiZWxsaXBzZVwiLCBcInJlY3RcIiwgXCJ0ZXh0XCJdKTtcbmNvbnN0IGFsbG93ZWRBdHRyaWJ1dGVOYW1lcyA9IG5ldyBTZXQoW1widmlld0JveFwiLFwid2lkdGhcIixcImhlaWdodFwiLFwieG1sbnNcIixcImRcIixcImZpbGxcIixcInN0cm9rZVwiLFwic3Ryb2tlLXdpZHRoXCIsXCJzdHJva2UtbGluZWNhcFwiLFwic3Ryb2tlLWxpbmVqb2luXCIsXCJzdHJva2UtZGFzaGFycmF5XCIsXCJzdHJva2UtZGFzaG9mZnNldFwiLFwieFwiLFwieVwiLFwieDFcIixcInkxXCIsXCJ4MlwiLFwieTJcIixcImN4XCIsXCJjeVwiLFwiclwiLFwicnhcIixcInJ5XCIsXCJwb2ludHNcIixcInRyYW5zZm9ybVwiLFwib3BhY2l0eVwiLFwiZm9udC1zaXplXCIsXCJmb250LWZhbWlseVwiLFwiZm9udC13ZWlnaHRcIixcInRleHQtYW5jaG9yXCIsXCJkb21pbmFudC1iYXNlbGluZVwiLFwiZHhcIixcImR5XCIsXCJocmVmXCIsXCJ0YXJnZXRcIixcInJlbFwiLFwidGl0bGVcIl0pO1xuXG5cblxuXG5leHBvcnQgdHlwZSBNb3VzZUV2ZW50ID0ge1xuICB0eXBlOiBNb3VzZUV2ZW50VHlwZVxuICB0YXJnZXQ6IFZEb21cbiAgY2xpZW50WD86IG51bWJlclxuICBjbGllbnRZPzogbnVtYmVyXG4gIGRlbHRhWT86IG51bWJlclxuICBjdXJyZW50VGFyZ2V0PzogRWxlbWVudFxuICBwcmV2ZW50RGVmYXVsdD86ICgpID0+IHZvaWRcbn07XG5cbnR5cGUgS2V5Ym9hcmRFdmVudCA9IHtcbiAgdHlwZTogS2V5Ym9hcmRFdmVudFR5cGVcbiAga2V5OiBzdHJpbmcsXG4gIG1ldGFLZXk6IGJvb2xlYW4sXG4gIHNoaWZ0S2V5OiBib29sZWFuLFxuICB0YXJnZXQ6IFZEb20sXG59XG5cbmV4cG9ydCB0eXBlIFZpZXdDb250ZXh0ID0ge1xuICBhZGQ6IChwYXJlbnQ6IFZEb20sIC4uLmVsOiBWRG9tW10pPT4gdm9pZCxcbiAgZGVsOiAoZWw6IFZEb20pID0+IHZvaWQsXG4gIHVwZGF0ZTogKGVsOiBWRG9tKSA9PiB2b2lkLFxuICBvblVzZXJFdmVudD86ICh0eXBlOiBEb21FdmVudFR5cGUpID0+IHZvaWQsXG4gIGxvY2F0aW9uOiB7IHBhdGhuYW1lOiBzdHJpbmcgfSxcbiAgd2lkdGg6IG51bWJlcixcbiAgaGVpZ2h0OiBudW1iZXIsXG59XG5cbmV4cG9ydCB0eXBlIFZEb20gPSB7XG4gIHRhZzogc3RyaW5nXG4gIHRleHRDb250ZW50OiBzdHJpbmdcbiAgaWQ6IHN0cmluZ1xuICBzdHlsZTogUmVjb3JkPHN0cmluZywgc3RyaW5nPlxuICBhdHRyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPlxuICBjaGlsZHJlbjogVkRvbVtdXG4gIG9uY2xpY2s/OiBNb3VzZUxpc3RlbmVyXG4gIG9ubW91c2Vkb3duPzogTW91c2VMaXN0ZW5lclxuICBvbm1vdXNldXA/OiBNb3VzZUxpc3RlbmVyXG4gIG9ubW91c2Vtb3ZlPzogTW91c2VMaXN0ZW5lclxuICBvbm1vdXNlb3V0PzogTW91c2VMaXN0ZW5lclxuICBvbndoZWVsPzogTW91c2VMaXN0ZW5lclxuICBvbmtleWRvd24/OiBLZXlMaXN0ZW5lclxuICBvbmtleXVwPzogS2V5TGlzdGVuZXJcbiAgdmFsdWU/OiBzdHJpbmdcbn1cblxudHlwZSBEb21VcGRhdGUgPSB7IG9wOiBcIkRFTFwiLCBlbDogVkRvbSB9IHwgeyBvcDogXCJBRERcIiwgcGFyZW50OiBWRG9tLCBlbDogVkRvbVtdfSB8IHsgb3A6IFwiVVBEQVRFXCIsIGVsOiBWRG9tIH1cblxuXG5sZXQgZG9tcyA9IG5ldyBXZWFrTWFwPEVsZW1lbnQsIFZEb20+KCk7XG5sZXQgZWxlbWVudHMgPSBuZXcgV2Vha01hcDxWRG9tLCBFbGVtZW50PigpO1xuXG5cblxuZXhwb3J0IHR5cGUgVmlldyA9IChjdHg6IFZpZXdDb250ZXh0KSA9PiBWRG9tO1xuXG5leHBvcnQgY29uc3QgcmVuZGVyRG9tID0gKG1rZXI6IFZpZXcsIGxvY2F0aW9uOiB7IHBhdGhuYW1lOiBzdHJpbmcgfSA9IHsgcGF0aG5hbWU6IFwiL1wiIH0sIHdpZHRoID0gZ2xvYmFsVGhpcy5pbm5lcldpZHRoID8/IDAsIGhlaWdodCA9IGdsb2JhbFRoaXMuaW5uZXJIZWlnaHQgPz8gMCk6IEhUTUxFbGVtZW50ID0+IHtcblxuICBsZXQgY3R4UmVmOiBWaWV3Q29udGV4dCB8IG51bGwgPSBudWxsXG5cbiAgY29uc3QgcmVuZGVyID0gKGRvbTpWRG9tKSA6IEVsZW1lbnQ9PntcblxuICAgIGNvbnN0IGVsID0gc3ZnVGFncy5oYXMoZG9tLnRhZykgPyBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoc3ZnTmFtZXNwYWNlLCBkb20udGFnKVxuICAgICAgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGRvbS50YWcpO1xuXG4gICAgZWwudGV4dENvbnRlbnQgPSBkb20udGV4dENvbnRlbnRcbiAgICBpZiAoKGVsIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCB8fCBlbCBpbnN0YW5jZW9mIEhUTUxUZXh0QXJlYUVsZW1lbnQpICYmIGRvbS52YWx1ZSkgZWwudmFsdWUgPSBkb20udmFsdWVcbiAgICBlbGVtZW50cy5zZXQoZG9tLCBlbClcbiAgICBkb21zLnNldChlbCwgZG9tKVxuICAgIGVsLmFwcGVuZCguLi5kb20uY2hpbGRyZW4ubWFwKGM9PnJlbmRlcihjKSkpXG4gICAgT2JqZWN0LmVudHJpZXMoZG9tLmF0dHJzKS5mb3JFYWNoKChbaywgdl0pID0+IHtcbiAgICAgIGlmIChhbGxvd2VkQXR0cmlidXRlTmFtZXMuaGFzKGspKSBlbC5zZXRBdHRyaWJ1dGUoaywgdilcbiAgICB9KVxuICAgIE9iamVjdC5lbnRyaWVzKGRvbS5zdHlsZSkuZm9yRWFjaChzdD0+ZWwuc3R5bGUuc2V0UHJvcGVydHkoLi4uc3QpKVxuICAgIG1vdXNlRXZlbnRzLmZvckVhY2goKHR5cGUpID0+IGVsLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgKGUpID0+IHtcbiAgICAgIGlmIChjdHhSZWYgJiYgY3R4UmVmLm9uVXNlckV2ZW50KSBjdHhSZWYub25Vc2VyRXZlbnQodHlwZSlcbiAgICAgIGNvbnN0IG1lID0gZSBhcyBnbG9iYWxUaGlzLk1vdXNlRXZlbnRcbiAgICAgIGNvbnN0IG1hcHBlZFRhcmdldCA9IGRvbXMuZ2V0KGUudGFyZ2V0IGFzIEVsZW1lbnQpIHx8IGRvbVxuICAgICAgY29uc3QgZXZlbnQ6IE1vdXNlRXZlbnQgPSB7XG4gICAgICAgIHR5cGUsXG4gICAgICAgIHRhcmdldDogbWFwcGVkVGFyZ2V0LFxuICAgICAgICBjbGllbnRYOiBtZS5jbGllbnRYLFxuICAgICAgICBjbGllbnRZOiBtZS5jbGllbnRZLFxuICAgICAgICBkZWx0YVk6IHR5cGUgPT09IFwid2hlZWxcIiA/IChtZSBhcyBnbG9iYWxUaGlzLldoZWVsRXZlbnQpLmRlbHRhWSA6IHVuZGVmaW5lZCxcbiAgICAgICAgY3VycmVudFRhcmdldDogZWwsXG4gICAgICAgIHByZXZlbnREZWZhdWx0OiAoKSA9PiBlLnByZXZlbnREZWZhdWx0KCksXG4gICAgICB9XG4gICAgICBpZiAodHlwZSA9PT0gXCJjbGlja1wiICYmIGRvbS5vbmNsaWNrKSBkb20ub25jbGljayhldmVudClcbiAgICAgIGVsc2UgaWYgKHR5cGUgPT09IFwibW91c2Vkb3duXCIgJiYgZG9tLm9ubW91c2Vkb3duKSBkb20ub25tb3VzZWRvd24oZXZlbnQpXG4gICAgICBlbHNlIGlmICh0eXBlID09PSBcIm1vdXNldXBcIiAmJiBkb20ub25tb3VzZXVwKSBkb20ub25tb3VzZXVwKGV2ZW50KVxuICAgICAgZWxzZSBpZiAodHlwZSA9PT0gXCJtb3VzZW1vdmVcIiAmJiBkb20ub25tb3VzZW1vdmUpIGRvbS5vbm1vdXNlbW92ZShldmVudClcbiAgICAgIGVsc2UgaWYgKHR5cGUgPT09IFwibW91c2VvdXRcIiAmJiBkb20ub25tb3VzZW91dCkgZG9tLm9ubW91c2VvdXQoZXZlbnQpXG4gICAgICBlbHNlIGlmICh0eXBlID09PSBcIndoZWVsXCIgJiYgZG9tLm9ud2hlZWwpIGRvbS5vbndoZWVsKGV2ZW50KVxuICAgIH0pKTtcbiAgICBrZXlib2FyZEV2ZW50cy5mb3JFYWNoKCh0eXBlKSA9PiBlbC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIChlKSA9PntcbiAgICAgIGlmIChjdHhSZWYgJiYgY3R4UmVmLm9uVXNlckV2ZW50KSBjdHhSZWYub25Vc2VyRXZlbnQodHlwZSlcbiAgICAgIGxldCB7a2V5LCBtZXRhS2V5LCBzaGlmdEtleX0gPSBlIGFzIGdsb2JhbFRoaXMuS2V5Ym9hcmRFdmVudDtcbiAgICAgIGlmIChbXCJJTlBVVFwiICwgXCJURVhUQVJFQVwiXS5pbmNsdWRlcygoZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLnRhZ05hbWUpKSBkb20udmFsdWUgPSAoZS50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWVcbiAgICAgIGNvbnN0IGV2ZW50OiBLZXlib2FyZEV2ZW50ID0geyB0eXBlLCBrZXksIG1ldGFLZXksIHNoaWZ0S2V5LCB0YXJnZXQ6IGRvbXMuZ2V0KGUudGFyZ2V0IGFzIEVsZW1lbnQpIHx8IGRvbX1cbiAgICAgIGlmICh0eXBlID09PSBcImtleWRvd25cIiAmJiBkb20ub25rZXlkb3duKSBkb20ub25rZXlkb3duKGV2ZW50KVxuICAgICAgZWxzZSBpZiAodHlwZSA9PT0gXCJrZXl1cFwiICYmIGRvbS5vbmtleXVwKSBkb20ub25rZXl1cChldmVudClcbiAgICB9KSlcbiAgICByZXR1cm4gZWxcblxuICB9XG4gIGNvbnN0IGN0eDogVmlld0NvbnRleHQgPSB7XG4gICAgYWRkOiAocGFyZW50OiBWRG9tLCAuLi5lbDogVkRvbVtdKSA9PiB7XG4gICAgICBlbGVtZW50cy5nZXQocGFyZW50KT8uYXBwZW5kKC4uLmVsLm1hcChlPT5yZW5kZXIoZSkpKVxuICAgIH0sXG4gICAgZGVsOiAoZWw6IFZEb20pID0+IHtcbiAgICAgIGRvbXMuZGVsZXRlKGVsZW1lbnRzLmdldChlbCkhKVxuICAgICAgZWxlbWVudHMuZ2V0KGVsKT8ucmVtb3ZlKClcbiAgICAgIGVsZW1lbnRzLmRlbGV0ZShlbClcbiAgICB9LFxuICAgIHVwZGF0ZTogKGVsOiBWRG9tKSA9PiB7XG4gICAgICBsZXQgb2xkZWwgPSBlbGVtZW50cy5nZXQoZWwpIVxuICAgICAgaWYgKCFvbGRlbCkgcmV0dXJuXG4gICAgICBvbGRlbC5yZXBsYWNlV2l0aChyZW5kZXIoZWwpKVxuICAgICAgZG9tcy5kZWxldGUob2xkZWwpXG4gICAgfSxcbiAgICBsb2NhdGlvbixcbiAgICB3aWR0aCxcbiAgICBoZWlnaHQsXG4gIH1cbiAgY3R4UmVmID0gY3R4XG4gIHJldHVybiByZW5kZXIobWtlcihjdHgpKSBhcyBIVE1MRWxlbWVudFxufVxuXG5cblxuXG50eXBlIEtleUxpc3RlbmVyID0gKGU6S2V5Ym9hcmRFdmVudCkgPT4gdm9pZFxudHlwZSBNb3VzZUxpc3RlbmVyID0gKGU6TW91c2VFdmVudCkgPT4gdm9pZFxudHlwZSBTdWJzY3JpYmVyID0ge1xuICBcIm9ua2V5dXBcIj8gOiBLZXlMaXN0ZW5lclxuICBcIm9ua2V5ZG93blwiPyA6IEtleUxpc3RlbmVyXG4gIFwib25tb3VzZXVwXCI/IDogTW91c2VMaXN0ZW5lclxuICBcIm9ubW91c2Vkb3duXCI/IDogTW91c2VMaXN0ZW5lclxuICBcIm9ubW91c2Vtb3ZlXCI/IDogTW91c2VMaXN0ZW5lclxuICBcIm9ubW91c2VvdXRcIj8gOiBNb3VzZUxpc3RlbmVyXG4gIFwib25jbGlja1wiPyA6TW91c2VMaXN0ZW5lclxuICBcIm9ud2hlZWxcIj8gOiBNb3VzZUxpc3RlbmVyXG59O1xuXG50eXBlIENvbnRlbnQgPSBzdHJpbmcgfCBWRG9tIHwgQ29udGVudFtdIHwge2lkOiBzdHJpbmd9IHwge3N0eWxlOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+fSB8IFN1YnNjcmliZXIgfCB7dmFsdWU6IHN0cmluZ30gfCB7YXR0cnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz59XG5cblxuY29uc3QgbWtEb20gPSAodGFnOiBzdHJpbmcpID0+ICguLi5jb250ZW50OkNvbnRlbnRbXSkgPT57XG5cbiAgbGV0IGRtIDogVkRvbSA9IHt0YWc6IHRhZywgc3R5bGU6IHt9LCBhdHRyczoge30sIHRleHRDb250ZW50OiBcIlwiLCBpZDogXCJcIiwgY2hpbGRyZW46IFtdfTtcbiAgbGV0IHN0cmluZ3M6IHN0cmluZ1tdID0gW11cbiAgbGV0IGFkZGNvbnRlbnQgPSAoYzogQ29udGVudCkgPT4ge1xuICAgIGlmIChjIGluc3RhbmNlb2YgQXJyYXkpIGMuZm9yRWFjaChhZGRjb250ZW50KTtcbiAgICBlbHNlIGlmICh0eXBlb2YgYyA9PSBcInN0cmluZ1wiKSBzdHJpbmdzLnB1c2goYylcbiAgICBlbHNlIGlmIChjIGluc3RhbmNlb2YgT2JqZWN0KSB7XG4gICAgICBpZiAoXCJ0YWdcIiBpbiBjKSByZXR1cm4gZG0uY2hpbGRyZW4ucHVzaChjIGFzIFZEb20pXG4gICAgICBpZiAoXCJpZFwiIGluIGMpIGRtLmlkID0gYy5pZCBhcyBzdHJpbmc7XG4gICAgICBpZiAoXCJ2YWx1ZVwiIGluIGMpIGRtLnZhbHVlID0gYy52YWx1ZTtcbiAgICAgIGlmIChcImF0dHJzXCIgaW4gYykgT2JqZWN0LmVudHJpZXMoYy5hdHRycykuZm9yRWFjaCgoW2ssIHZdKSA9PiBkbS5hdHRyc1trXSA9IHYpXG4gICAgICBpZiAoXCJzdHlsZVwiIGluIGMpIE9iamVjdC5lbnRyaWVzKGMuc3R5bGUpLmZvckVhY2gocz0+IGRtLnN0eWxlW3NbMF0ucmVwbGFjZSgvKFtBLVpdKS9nLCAnLSQxJyldID0gc1sxXSlcbiAgICAgIGlmIChcIm9uY2xpY2tcIiBpbiBjKSBkbS5vbmNsaWNrID0gKGMgYXMgU3Vic2NyaWJlcikub25jbGlja1xuICAgICAgaWYgKFwib25tb3VzZWRvd25cIiBpbiBjKSBkbS5vbm1vdXNlZG93biA9IChjIGFzIFN1YnNjcmliZXIpLm9ubW91c2Vkb3duXG4gICAgICBpZiAoXCJvbm1vdXNldXBcIiBpbiBjKSBkbS5vbm1vdXNldXAgPSAoYyBhcyBTdWJzY3JpYmVyKS5vbm1vdXNldXBcbiAgICAgIGlmIChcIm9ubW91c2Vtb3ZlXCIgaW4gYykgZG0ub25tb3VzZW1vdmUgPSAoYyBhcyBTdWJzY3JpYmVyKS5vbm1vdXNlbW92ZVxuICAgICAgaWYgKFwib25tb3VzZW91dFwiIGluIGMpIGRtLm9ubW91c2VvdXQgPSAoYyBhcyBTdWJzY3JpYmVyKS5vbm1vdXNlb3V0XG4gICAgICBpZiAoXCJvbndoZWVsXCIgaW4gYykgZG0ub253aGVlbCA9IChjIGFzIFN1YnNjcmliZXIpLm9ud2hlZWxcbiAgICAgIGlmIChcIm9ua2V5ZG93blwiIGluIGMpIGRtLm9ua2V5ZG93biA9IChjIGFzIFN1YnNjcmliZXIpLm9ua2V5ZG93blxuICAgICAgaWYgKFwib25rZXl1cFwiIGluIGMpIGRtLm9ua2V5dXAgPSAoYyBhcyBTdWJzY3JpYmVyKS5vbmtleXVwXG4gICAgfVxuICB9XG5cbiAgYWRkY29udGVudChjb250ZW50KVxuICBkbS50ZXh0Q29udGVudCArPSBzdHJpbmdzLmpvaW4oXCIgXCIpXG5cbiAgcmV0dXJuIGRtXG59XG5cbmxldCBkaXY9IG1rRG9tKFwiZGl2XCIpXG5sZXQgc3ZnID0gbWtEb20oXCJzdmdcIilcbmxldCBwYXRoID0gbWtEb20oXCJwYXRoXCIpXG5sZXQgZyA9IG1rRG9tKFwiZ1wiKVxubGV0IHJlY3QgPSBta0RvbShcInJlY3RcIilcbmxldCB0ZXh0ID0gKGF0dHJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ICwgLi4uY29udGVudDogc3RyaW5nW10pID0+ICh7dGFnOiBcInRleHRcIiwgc3R5bGU6IHt9LCBhdHRyczogYXR0cnMgYXMge3BvczpzdHJpbmd9LCB0ZXh0Q29udGVudDogY29udGVudC5qb2luKFwiIFwiKSwgaWQ6IFwiXCIsIGNoaWxkcmVuOiBbXX0pO1xuXG5jb25zdCBwb3B1cCA9ICguLi5jczpWRG9tW10pPT57XG5cbiAgY29uc3QgZGlhbG9nZmllbGQgPSBkaXYoXG4gICAge1xuICAgICAgc3R5bGU6IHtcbiAgICAgICAgYmFja2dyb3VuZDogXCJ2YXIoLS1iYWNrZ3JvdW5kLWNvbG9yKVwiLFxuICAgICAgICBjb2xvcjogXCJ2YXIoLS1jb2xvcilcIixcbiAgICAgICAgcGFkZGluZzogXCIxZW1cIixcbiAgICAgICAgcGFkZGluZ0JvdHRvbTogXCIyZW1cIixcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjFlbVwiLFxuICAgICAgICB6SW5kZXg6IFwiMjAwMFwiLFxuICAgICAgICBvdmVyZmxvd1k6IFwic2Nyb2xsXCIsXG4gICAgICB9XG4gICAgfSxcbiAgICAuLi5jcylcblxuICBjb25zdCBwb3B1cGJhY2tncm91bmQgPSBkaXYoXG4gICAge3N0eWxlOntcbiAgICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gICAgICB0b3A6IFwiMFwiLFxuICAgICAgbGVmdDogXCIwXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogXCJyZ2JhKDE2NiwgMTY2LCAxNjYsIDAuNSlcIixcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICAgICAgekluZGV4OiBcIjIwMDBcIixcbiAgICB9fSxcbiAgICBkaWFsb2dmaWVsZFxuICApXG5cbiAgcmV0dXJuIHBvcHVwYmFja2dyb3VuZFxuXG59XG5cblxuZXhwb3J0IGNvbnN0IEhUTUwgPSB7XG4gIGRpdixcbiAgc3ZnLFxuICBzcGFuOiBta0RvbShcInNwYW5cIiksXG4gIHA6IG1rRG9tKFwicFwiKSxcbiAgaDE6IG1rRG9tKFwiaDFcIiksXG4gIGgyOiBta0RvbShcImgyXCIpLFxuICBoMzogbWtEb20oXCJoM1wiKSxcbiAgaDQ6IG1rRG9tKFwiaDRcIiksXG4gIGg1OiBta0RvbShcImg1XCIpLFxuICBoNjogbWtEb20oXCJoNlwiKSxcbiAgYTogbWtEb20oXCJhXCIpLFxuICBidXR0b246IG1rRG9tKFwiYnV0dG9uXCIpLFxuICBpbnB1dDogbWtEb20oXCJpbnB1dFwiKSxcbiAgdGV4dGFyZWE6IG1rRG9tKFwidGV4dGFyZWFcIiksXG4gIHByZTogbWtEb20oXCJwcmVcIiksXG4gIHN2Z1BhdGg6IChwYXRoRGF0YTogc3RyaW5nIHwgc3RyaW5nW10sIG9wdGlvbnM6IHtcbiAgICB2aWV3Qm94Pzogc3RyaW5nLFxuICAgIHdpZHRoPzogc3RyaW5nLFxuICAgIGhlaWdodD86IHN0cmluZyxcbiAgICBmaWxsPzogc3RyaW5nLFxuICAgIHN0cm9rZT86IHN0cmluZyxcbiAgICBzdHJva2VXaWR0aD86IHN0cmluZ1xuICB9ID0ge30sIC4uLmNoaWxkcmVuOiBWRG9tW10pID0+IHtcbiAgICBjb25zdCBwYXRocyA9IHBhdGhEYXRhIGluc3RhbmNlb2YgQXJyYXkgPyBwYXRoRGF0YSA6IFtwYXRoRGF0YV1cbiAgICBjb25zdCB7IHZpZXdCb3ggPSBcIjAgMCAxMDAgMTAwXCIsIHdpZHRoID0gXCIxMDBcIiwgaGVpZ2h0ID0gXCIxMDBcIiwgZmlsbCA9IFwibm9uZVwiLCBzdHJva2UgPSBcInZhcigtLWNvbG9yKVwiLCBzdHJva2VXaWR0aCA9IFwiMVwiIH0gPSBvcHRpb25zXG4gICAgY29uc3QgcGF0aEF0dHJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0geyBmaWxsLCBzdHJva2UsIFwic3Ryb2tlLXdpZHRoXCI6IHN0cm9rZVdpZHRoIH1cbiAgICByZXR1cm4gc3ZnKFxuICAgICAgeyBhdHRyczogeyB2aWV3Qm94LCB3aWR0aCwgaGVpZ2h0LCB4bWxuczogc3ZnTmFtZXNwYWNlIH0gfSxcbiAgICAgIC4uLnBhdGhzLm1hcChkID0+IHBhdGgoeyBhdHRyczogeyAuLi5wYXRoQXR0cnMsIGQgfSB9KSksXG4gICAgICAuLi5jaGlsZHJlblxuICAgIClcbiAgfSxcbiAgc3ZnVGV4dDogKFxuICAgIGNvbnRlbnQ6IHN0cmluZyxcbiAgICBvcHRpb25zOiB7XG4gICAgICB4Pzogc3RyaW5nLFxuICAgICAgeT86IHN0cmluZyxcbiAgICAgIGZpbGw/OiBzdHJpbmcsXG4gICAgICBiYWNrZ3JvdW5kPzogc3RyaW5nLFxuICAgICAgZm9udFNpemU/OiBzdHJpbmcsXG4gICAgICBmb250RmFtaWx5Pzogc3RyaW5nLFxuICAgICAgZm9udFdlaWdodD86IHN0cmluZyxcbiAgICAgIHRleHRBbmNob3I/OiBzdHJpbmcsXG4gICAgICBkb21pbmFudEJhc2VsaW5lPzogc3RyaW5nLFxuICAgICAgZHg/OiBzdHJpbmcsXG4gICAgICBkeT86IHN0cmluZ1xuICAgIH0gPSB7fVxuICApID0+IHtcbiAgICBjb25zdCBmcyA9IE51bWJlcihvcHRpb25zLmZvbnRTaXplID8/IDEyKVxuICAgIGNvbnN0IHggPSBvcHRpb25zLnggPz8gXCI1MFwiXG4gICAgY29uc3QgeSA9IG9wdGlvbnMueSA/PyBcIjUwXCJcbiAgICBjb25zdCBhdHRyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAgIGZpbGw6IG9wdGlvbnMuZmlsbCA/PyBcInZhcigtLWNvbG9yKVwiLFxuICAgICAgXCJmb250LXNpemVcIjogU3RyaW5nKGZzKSxcbiAgICAgIHgsIHksXG4gICAgICBcInRleHQtYW5jaG9yXCI6IG9wdGlvbnMudGV4dEFuY2hvciA/PyBcIm1pZGRsZVwiLFxuICAgICAgXCJkb21pbmFudC1iYXNlbGluZVwiOiBvcHRpb25zLmRvbWluYW50QmFzZWxpbmUgPz8gXCJtaWRkbGVcIixcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMuZm9udEZhbWlseSkgYXR0cnNbXCJmb250LWZhbWlseVwiXSA9IG9wdGlvbnMuZm9udEZhbWlseVxuICAgIGlmIChvcHRpb25zLmZvbnRXZWlnaHQpIGF0dHJzW1wiZm9udC13ZWlnaHRcIl0gPSBvcHRpb25zLmZvbnRXZWlnaHRcbiAgICBpZiAob3B0aW9ucy5keCkgYXR0cnMuZHggPSBvcHRpb25zLmR4XG4gICAgaWYgKG9wdGlvbnMuZHkpIGF0dHJzLmR5ID0gb3B0aW9ucy5keVxuICAgIGNvbnN0IHRleHROb2RlID0gdGV4dChhdHRycywgY29udGVudClcbiAgICBpZiAoIW9wdGlvbnMuYmFja2dyb3VuZCkgcmV0dXJuIHRleHROb2RlXG4gICAgY29uc3QgcGFkID0gZnMgKiAwLjRcbiAgICBjb25zdCBydyA9IGNvbnRlbnQubGVuZ3RoICogZnMgKiAwLjYgKyBwYWQgKiAyXG4gICAgY29uc3QgcmggPSBmcyArIHBhZCAqIDJcbiAgICBjb25zdCByeCA9IE51bWJlcih4KSAtIHJ3IC8gMlxuICAgIGNvbnN0IHJ5ID0gTnVtYmVyKHkpIC0gcmggLyAyXG4gICAgcmV0dXJuIGcoXG4gICAgICByZWN0KHsgYXR0cnM6IHsgeDogU3RyaW5nKHJ4KSwgeTogU3RyaW5nKHJ5KSwgd2lkdGg6IFN0cmluZyhydyksIGhlaWdodDogU3RyaW5nKHJoKSwgZmlsbDogb3B0aW9ucy5iYWNrZ3JvdW5kLCByeDogU3RyaW5nKHBhZCkgfSB9KSxcbiAgICAgIHRleHROb2RlLFxuICAgIClcbiAgfSxcbiAgcG9wdXBcbn1cbiIsICJleHBvcnQgdHlwZSBSZWYgPSBgIyR7c3RyaW5nfWA7XG5cbmNvbnN0IEZOVl9PRkZTRVRfMSA9IDB4Y2JmMjljZTQ4NDIyMjMyNW47XG5jb25zdCBGTlZfT0ZGU0VUXzIgPSAweDg0MjIyMzI1Y2JmMjljZTRuO1xuY29uc3QgRk5WX1BSSU1FID0gMHgxMDAwMDAwMDFiM247XG5jb25zdCBNQVNLXzY0ID0gKDFuIDw8IDY0bikgLSAxbjtcblxuY29uc3QgaGFzaDY0ID0gKHZhbHVlOiBzdHJpbmcsIG9mZnNldDogYmlnaW50KTogYmlnaW50ID0+IHtcbiAgbGV0IGhhc2ggPSBvZmZzZXQ7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpICs9IDEpIHtcbiAgICBoYXNoIF49IEJpZ0ludCh2YWx1ZS5jaGFyQ29kZUF0KGkpKTtcbiAgICBoYXNoID0gKGhhc2ggKiBGTlZfUFJJTUUpICYgTUFTS182NDtcbiAgfVxuICByZXR1cm4gaGFzaDtcbn07XG5cbmNvbnN0IHRvSGV4NjQgPSAodmFsdWU6IGJpZ2ludCkgPT4gdmFsdWUudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDE2LCBcIjBcIik7XG5cbmV4cG9ydCBjb25zdCBoYXNoMTI4ID0gKC4uLmRhdGE6IGFueSk6IFJlZiA9PiB7XG4gIGNvbnN0IGlucHV0ID0gSlNPTi5zdHJpbmdpZnkoZGF0YSk7XG4gIGNvbnN0IGhpZ2ggPSBoYXNoNjQoaW5wdXQsIEZOVl9PRkZTRVRfMSk7XG4gIGNvbnN0IGxvdyA9IGhhc2g2NChpbnB1dCwgRk5WX09GRlNFVF8yKTtcbiAgcmV0dXJuIGAjJHt0b0hleDY0KGhpZ2gpfSR7dG9IZXg2NChsb3cpfWAgYXMgUmVmO1xufTtcblxuZXhwb3J0IHR5cGUgSnNvbmFibGUgPVxuICB8IHN0cmluZ1xuICB8IG51bWJlclxuICB8IGJvb2xlYW5cbiAgfCBudWxsXG4gIHwgSnNvbmFibGVbXVxuICB8IHsgW2tleTogc3RyaW5nXTogSnNvbmFibGUgfTtcblxuXG5leHBvcnQgdHlwZSBOb3RlID0geyBoYXNoOiBSZWY7IGRhdGE6IEpzb25hYmxlIH07XG5cbmV4cG9ydCBjb25zdCB0b2pzb24gPSAoeDogSnNvbmFibGUpID0+IEpTT04uc3RyaW5naWZ5KHgsIG51bGwsIDIpO1xuZXhwb3J0IGNvbnN0IGZyb21qc29uID0gKHg6IHN0cmluZyk6IEpzb25hYmxlID0+IEpTT04ucGFyc2UoeCk7XG5cbmV4cG9ydCBjb25zdCBpc1JlZiA9ICh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFJlZiA9PlxuICB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgJiYgL14jKFthLWYwLTldezMyfSkkL2kudGVzdCh2YWx1ZSk7XG5cbmV4cG9ydCBjb25zdCBoYXNoRGF0YSA9ICh2YWx1ZTogSnNvbmFibGUpOiBSZWYgPT4ge1xuICBpZiAoaXNSZWYodmFsdWUpKSByZXR1cm4gdmFsdWU7XG4gIGlmIChbXCJzdHJpbmdcIiwgXCJudW1iZXJcIiwgXCJib29sZWFuXCJdLmluY2x1ZGVzKHR5cGVvZiB2YWx1ZSkgfHwgdmFsdWUgPT09IG51bGwpIHtcbiAgICByZXR1cm4gaGFzaDEyOCh0b2pzb24odmFsdWUpKTtcbiAgfVxuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHJldHVybiBoYXNoMTI4KFwiYXJyXCIsIHZhbHVlLm1hcChoYXNoRGF0YSkpO1xuICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiKXtcbiAgICBjb25zdCBlbnRyaWVzID0gT2JqZWN0LmVudHJpZXModmFsdWUpXG4gICAgICAuc29ydCgoW2FdLCBbYl0pID0+IChhIDwgYiA/IC0xIDogYSA+IGIgPyAxIDogMCkpXG4gICAgICAubWFwKChbaywgdl0pID0+IFtrLCBoYXNoRGF0YSh2KV0gYXMgY29uc3QpO1xuICAgIHJldHVybiBoYXNoMTI4KHRvanNvbihPYmplY3QuZnJvbUVudHJpZXMoZW50cmllcykpKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoYHVuc3VwcG9ydGVkIHR5cGUgZm9yIGhhc2hpbmc6ICR7dHlwZW9mIHZhbHVlfWApO1xufTtcbiIsICJpbXBvcnQgeyBmcm9tanNvbiwgaGFzaERhdGEsIGlzUmVmLCB0b2pzb24sIHR5cGUgSnNvbmFibGUsIHR5cGUgUmVmIH0gZnJvbSBcIkBoYXNobm90ZXMvY29yZS9ub3Rlc1wiO1xuXG5leHBvcnQgdHlwZSBTZXJ2ZXJOYW1lID0gXCJsb2NhbFwiIHwgXCJtYWluY2xvdWRcIjtcbnR5cGUgQ2FjaGVPcHRpb25zID0geyBza2lwQ2FjaGU/OiBib29sZWFuIH07XG5cbmNvbnN0IERCX05BTUUgPSBcImhhc2hub3Rlc1wiO1xuXG5jb25zdCBlbnYgPSAoKSA9PiAoZ2xvYmFsVGhpcyBhcyBhbnkpPy5wcm9jZXNzPy5lbnYgYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgdW5kZWZpbmVkPiB8IHVuZGVmaW5lZDtcbmNvbnN0IEtWID0gKCgpID0+IHtcbiAgdHJ5IHsgaWYgKHR5cGVvZiBsb2NhbFN0b3JhZ2UgIT09IFwidW5kZWZpbmVkXCIgJiYgbG9jYWxTdG9yYWdlKSByZXR1cm4gbG9jYWxTdG9yYWdlOyB9IGNhdGNoIHt9XG4gIGNvbnN0IG0gPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICByZXR1cm4ge1xuICAgIGdldEl0ZW06IChrOiBzdHJpbmcpID0+IG0uZ2V0KGspID8/IG51bGwsXG4gICAgc2V0SXRlbTogKGs6IHN0cmluZywgdjogc3RyaW5nKSA9PiB7IG0uc2V0KGssIHYpOyB9LFxuICAgIHJlbW92ZUl0ZW06IChrOiBzdHJpbmcpID0+IHsgbS5kZWxldGUoayk7IH0sXG4gIH07XG59KSgpO1xuXG5sZXQgU0VSVkVSOiBTZXJ2ZXJOYW1lID0gKCgpID0+IHtcbiAgY29uc3QgZSA9IGVudigpO1xuICBjb25zdCB2ID0gZT8uSEFTSE5PVEVTX1NFUlZFUjtcbiAgcmV0dXJuIHYgPT09IFwibG9jYWxcIiB8fCB2ID09PSBcIm1haW5jbG91ZFwiID8gdiA6IChLVi5nZXRJdGVtKFwiZGJfcHJlc2V0XCIpID09PSBcImxvY2FsXCIgPyBcImxvY2FsXCIgOiBcIm1haW5jbG91ZFwiKTtcbn0pKCk7XG5cbmNvbnN0IGJhc2VVcmwgPSAoKTogc3RyaW5nID0+ICh7XG4gIGxvY2FsOiBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMFwiLFxuICBtYWluY2xvdWQ6IFwiaHR0cHM6Ly9tYWluY2xvdWQuc3BhY2V0aW1lZGIuY29tXCIsXG59KVtTRVJWRVJdXG5cbmNvbnN0IGFjY2Vzc1Rva2VuID0gYXN5bmMgKCk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4gPT4ge1xuICBsZXQgdG9rZW5rZXkgPSAoKSA9PiBgYWNjZXNzX3Rva2VuOiR7U0VSVkVSfWA7XG4gIGxldCB0a2V5ID0gdG9rZW5rZXkoKTtcbiAgY29uc3QgZSA9IGVudigpO1xuICBjb25zdCBlbnZUb2tlbiA9IChTRVJWRVIgPT09IFwibG9jYWxcIiA/IGU/LkhBU0hOT1RFU19BQ0NFU1NfVE9LRU5fTE9DQUwgOiBlPy5IQVNITk9URVNfQUNDRVNTX1RPS0VOX01BSU5DTE9VRCkgPz8gZT8uSEFTSE5PVEVTX0FDQ0VTU19UT0tFTjtcbiAgaWYgKGVudlRva2VuKSByZXR1cm4gZW52VG9rZW47XG5cbiAgbGV0IHRva2VuID0gS1YuZ2V0SXRlbSh0a2V5KVxuICBpZiAoIXRva2VuKXtcbiAgICB0b2tlbiA9IGF3YWl0IGZldGNoKGAke2Jhc2VVcmwoKX0vdjEvaWRlbnRpdHlgLCB7IG1ldGhvZDogXCJQT1NUXCIsIGhlYWRlcnM6IHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSB9KVxuICAgIC50aGVuKHI9PnIuanNvbigpKS50aGVuKGo9PmoudG9rZW4gfHwgbnVsbClcbiAgICBpZiAodGtleSAhPSB0b2tlbmtleSgpKSByZXR1cm4gYWNjZXNzVG9rZW4oKTtcbiAgICBpZiAodG9rZW4pIEtWLnNldEl0ZW0odGtleSwgdG9rZW4pXG4gIH1cbiAgcmV0dXJuIHRva2VuXG59O1xuXG5leHBvcnQgY29uc3Qgc2V0U2VydmVyID0gKHZhbHVlOiBTZXJ2ZXJOYW1lKSA9PiB7XG4gIEtWLnNldEl0ZW0oXCJkYl9wcmVzZXRcIiwgdmFsdWUpO1xuICBTRVJWRVIgPSB2YWx1ZTtcbiAgY29uc29sZS5sb2coXCJjb25uZWN0IHRvXCIsIFNFUlZFUilcbn07XG5cbmV4cG9ydCBsZXQgZ2V0U2VydmVyID0gKCkgPT4gU0VSVkVSO1xuXG5zZXRTZXJ2ZXIoXCJsb2NhbFwiKVxuY29uc29sZS5sb2coXCJjb25uZWN0IHRvXCIsIFNFUlZFUilcblxuY29uc3QgY2FsbCA9IGFzeW5jIChuYW1lOiBzdHJpbmcsIHBheWxvYWQ6IHVua25vd24pOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgJHtiYXNlVXJsKCl9L3YxL2RhdGFiYXNlLyR7REJfTkFNRX0vY2FsbC8ke25hbWV9YCwge1xuICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgaGVhZGVyczoge1wiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLCBBdXRob3JpemF0aW9uOiBhd2FpdCBhY2Nlc3NUb2tlbigpLnRoZW4odD0+dD9gQmVhcmVyICR7dH1gOicnKX0sXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkocGF5bG9hZCksXG4gIH0pO1xuICBjb25zdCB0ZXh0ID0gYXdhaXQgcmVzLnRleHQoKTtcbiAgaWYgKCFyZXMub2spIHRocm93IG5ldyBFcnJvcih0ZXh0KTtcbiAgcmV0dXJuIHRleHQ7XG59O1xuXG4vLyBTZWN0aW9uOiBpbi1tZW1vcnkgbm90ZSBjYWNoZVxuY29uc3Qgbm90ZUNhY2hlID0gbmV3IE1hcDxSZWYsIEpzb25hYmxlPigpO1xuY29uc3QgYWRkSW5GbGlnaHQgPSBuZXcgTWFwPFJlZiwgUHJvbWlzZTxSZWY+PigpO1xuY29uc3QgZ2V0SW5GbGlnaHQgPSBuZXcgTWFwPFJlZiwgUHJvbWlzZTxKc29uYWJsZT4+KCk7XG5cbmV4cG9ydCBjb25zdCBjbGVhck5vdGVDYWNoZSA9ICgpID0+IHtcbiAgbm90ZUNhY2hlLmNsZWFyKCk7XG4gIGFkZEluRmxpZ2h0LmNsZWFyKCk7XG4gIGdldEluRmxpZ2h0LmNsZWFyKCk7XG59O1xuXG4vLyBTZWN0aW9uOiBub3RlIEFQSVxuZXhwb3J0IGNvbnN0IGFkZE5vdGUgPSBhc3luYyAoZGF0YTogSnNvbmFibGUsIG9wdGlvbnM6IENhY2hlT3B0aW9ucyA9IHt9KTogUHJvbWlzZTxSZWY+ID0+IHtcbiAgY29uc3QgeyBza2lwQ2FjaGUgPSBmYWxzZSB9ID0gb3B0aW9ucztcbiAgY29uc3QgaGFzaCA9IGhhc2hEYXRhKGRhdGEpO1xuXG4gIGlmICghc2tpcENhY2hlKSB7XG4gICAgY29uc3QgY2FjaGVkID0gbm90ZUNhY2hlLmdldChoYXNoKTtcbiAgICBpZiAoY2FjaGVkICE9PSB1bmRlZmluZWQpIHJldHVybiBoYXNoO1xuICAgIGNvbnN0IHBlbmRpbmcgPSBhZGRJbkZsaWdodC5nZXQoaGFzaCk7XG4gICAgaWYgKHBlbmRpbmcpIHJldHVybiBwZW5kaW5nO1xuICB9XG5cbiAgY29uc3QgcCA9IChhc3luYyAoKSA9PiB7XG4gICAgYXdhaXQgY2FsbChcImFkZF9ub3RlXCIsIHsgZGF0YTogdG9qc29uKGRhdGEpIH0pO1xuICAgIGlmICghc2tpcENhY2hlKSBub3RlQ2FjaGUuc2V0KGhhc2gsIGRhdGEpO1xuICAgIHJldHVybiBoYXNoO1xuICB9KSgpO1xuXG4gIGlmICghc2tpcENhY2hlKSBhZGRJbkZsaWdodC5zZXQoaGFzaCwgcCk7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGF3YWl0IHA7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKCFza2lwQ2FjaGUpIGFkZEluRmxpZ2h0LmRlbGV0ZShoYXNoKTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IGdldE5vdGUgPSBhc3luYyAoaGFzaDogUmVmLCBvcHRpb25zOiBDYWNoZU9wdGlvbnMgPSB7fSk6IFByb21pc2U8SnNvbmFibGU+ID0+IHtcbiAgY29uc3QgeyBza2lwQ2FjaGUgPSBmYWxzZSB9ID0gb3B0aW9ucztcblxuICBpZiAoIXNraXBDYWNoZSkge1xuICAgIGNvbnN0IGNhY2hlZCA9IG5vdGVDYWNoZS5nZXQoaGFzaCk7XG4gICAgaWYgKGNhY2hlZCAhPT0gdW5kZWZpbmVkKSByZXR1cm4gY2FjaGVkO1xuXG4gICAgY29uc3QgYWRkUGVuZGluZyA9IGFkZEluRmxpZ2h0LmdldChoYXNoKTtcbiAgICBpZiAoYWRkUGVuZGluZykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgYWRkUGVuZGluZztcbiAgICAgICAgY29uc3QgYWZ0ZXJBZGQgPSBub3RlQ2FjaGUuZ2V0KGhhc2gpO1xuICAgICAgICBpZiAoYWZ0ZXJBZGQgIT09IHVuZGVmaW5lZCkgcmV0dXJuIGFmdGVyQWRkO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIGZhbGwgdGhyb3VnaFxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHBlbmRpbmcgPSBnZXRJbkZsaWdodC5nZXQoaGFzaCk7XG4gICAgaWYgKHBlbmRpbmcpIHJldHVybiBwZW5kaW5nO1xuICB9XG5cbiAgY29uc3QgcCA9IChhc3luYyAoKSA9PiB7XG4gICAgY29uc3Qgd2lyZVZhbHVlID0gYXdhaXQgY2FsbChcImdldF9ub3RlXCIsIHsgaGFzaCB9KTtcbiAgICBjb25zdCBkYXRhID0gZnJvbWpzb24oZnJvbWpzb24od2lyZVZhbHVlKSBhcyBzdHJpbmcpO1xuICAgIGlmICghc2tpcENhY2hlKSBub3RlQ2FjaGUuc2V0KGhhc2gsIGRhdGEpO1xuICAgIHJldHVybiBkYXRhO1xuICB9KSgpO1xuXG4gIGlmICghc2tpcENhY2hlKSBnZXRJbkZsaWdodC5zZXQoaGFzaCwgcCk7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGF3YWl0IHA7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKCFza2lwQ2FjaGUpIGdldEluRmxpZ2h0LmRlbGV0ZShoYXNoKTtcbiAgfVxufTtcblxuXG5leHBvcnQgY29uc3QgZGVSZWYgPSBhc3luYyAodmFsdWU6IEpzb25hYmxlKTogUHJvbWlzZTxKc29uYWJsZT4gPT4gIGlzUmVmKHZhbHVlKSA/IGdldE5vdGUodmFsdWUpLnRoZW4oZGVSZWYpIDogdmFsdWU7XG5leHBvcnQgY29uc3QgYXNSZWYgPSBhc3luYyAodmFsdWU6IFJlZiB8IEpzb25hYmxlKTogUHJvbWlzZTxSZWY+ID0+IGlzUmVmKHZhbHVlKSA/IHZhbHVlIDogYWRkTm90ZSh2YWx1ZSk7XG5cbmV4cG9ydCBjb25zdCBjYWxsTm90ZSA9IGFzeW5jIChmbjogUmVmIHwgSnNvbmFibGUsIGFyZ3M/OiBSZWYgfCBKc29uYWJsZSk6IFByb21pc2U8SnNvbmFibGU+ID0+IHtcbiAgY29uc3QgZm5SZWYgPSBhd2FpdCBhc1JlZihmbik7XG4gIGNvbnN0IGFyZ3NSZWYgPSBhd2FpdCBhc1JlZihhcmdzID09PSB1bmRlZmluZWQgPyBbXSA6IGFyZ3MpO1xuICByZXR1cm4gYXdhaXQgY2FsbChcImNhbGxfbm90ZVwiLCB7IGZuOiBmblJlZiwgYXJnOiBhcmdzUmVmIH0pLnRoZW4oZnJvbWpzb24pLnRoZW4oZGVSZWYpXG59O1xuIiwgIi8vIFRoaXMgZmlsZSB3YXMgZ2VuZXJhdGVkLiBEbyBub3QgbW9kaWZ5IG1hbnVhbGx5IVxudmFyIGFzdHJhbElkZW50aWZpZXJDb2RlcyA9IFs1MDksIDAsIDIyNywgMCwgMTUwLCA0LCAyOTQsIDksIDEzNjgsIDIsIDIsIDEsIDYsIDMsIDQxLCAyLCA1LCAwLCAxNjYsIDEsIDU3NCwgMywgOSwgOSwgNywgOSwgMzIsIDQsIDMxOCwgMSwgODAsIDMsIDcxLCAxMCwgNTAsIDMsIDEyMywgMiwgNTQsIDE0LCAzMiwgMTAsIDMsIDEsIDExLCAzLCA0NiwgMTAsIDgsIDAsIDQ2LCA5LCA3LCAyLCAzNywgMTMsIDIsIDksIDYsIDEsIDQ1LCAwLCAxMywgMiwgNDksIDEzLCA5LCAzLCAyLCAxMSwgODMsIDExLCA3LCAwLCAzLCAwLCAxNTgsIDExLCA2LCA5LCA3LCAzLCA1NiwgMSwgMiwgNiwgMywgMSwgMywgMiwgMTAsIDAsIDExLCAxLCAzLCA2LCA0LCA0LCA2OCwgOCwgMiwgMCwgMywgMCwgMiwgMywgMiwgNCwgMiwgMCwgMTUsIDEsIDgzLCAxNywgMTAsIDksIDUsIDAsIDgyLCAxOSwgMTMsIDksIDIxNCwgNiwgMywgOCwgMjgsIDEsIDgzLCAxNiwgMTYsIDksIDgyLCAxMiwgOSwgOSwgNywgMTksIDU4LCAxNCwgNSwgOSwgMjQzLCAxNCwgMTY2LCA5LCA3MSwgNSwgMiwgMSwgMywgMywgMiwgMCwgMiwgMSwgMTMsIDksIDEyMCwgNiwgMywgNiwgNCwgMCwgMjksIDksIDQxLCA2LCAyLCAzLCA5LCAwLCAxMCwgMTAsIDQ3LCAxNSwgMzQzLCA5LCA1NCwgNywgMiwgNywgMTcsIDksIDU3LCAyMSwgMiwgMTMsIDEyMywgNSwgNCwgMCwgMiwgMSwgMiwgNiwgMiwgMCwgOSwgOSwgNDksIDQsIDIsIDEsIDIsIDQsIDksIDksIDMzMCwgMywgMTAsIDEsIDIsIDAsIDQ5LCA2LCA0LCA0LCAxNCwgMTAsIDUzNTAsIDAsIDcsIDE0LCAxMTQ2NSwgMjcsIDIzNDMsIDksIDg3LCA5LCAzOSwgNCwgNjAsIDYsIDI2LCA5LCA1MzUsIDksIDQ3MCwgMCwgMiwgNTQsIDgsIDMsIDgyLCAwLCAxMiwgMSwgMTk2MjgsIDEsIDQxNzgsIDksIDUxOSwgNDUsIDMsIDIyLCA1NDMsIDQsIDQsIDUsIDksIDcsIDMsIDYsIDMxLCAzLCAxNDksIDIsIDE0MTgsIDQ5LCA1MTMsIDU0LCA1LCA0OSwgOSwgMCwgMTUsIDAsIDIzLCA0LCAyLCAxNCwgMTM2MSwgNiwgMiwgMTYsIDMsIDYsIDIsIDEsIDIsIDQsIDEwMSwgMCwgMTYxLCA2LCAxMCwgOSwgMzU3LCAwLCA2MiwgMTMsIDQ5OSwgMTMsIDI0NSwgMSwgMiwgOSwgNzI2LCA2LCAxMTAsIDYsIDYsIDksIDQ3NTksIDksIDc4NzcxOSwgMjM5XTtcblxuLy8gVGhpcyBmaWxlIHdhcyBnZW5lcmF0ZWQuIERvIG5vdCBtb2RpZnkgbWFudWFsbHkhXG52YXIgYXN0cmFsSWRlbnRpZmllclN0YXJ0Q29kZXMgPSBbMCwgMTEsIDIsIDI1LCAyLCAxOCwgMiwgMSwgMiwgMTQsIDMsIDEzLCAzNSwgMTIyLCA3MCwgNTIsIDI2OCwgMjgsIDQsIDQ4LCA0OCwgMzEsIDE0LCAyOSwgNiwgMzcsIDExLCAyOSwgMywgMzUsIDUsIDcsIDIsIDQsIDQzLCAxNTcsIDE5LCAzNSwgNSwgMzUsIDUsIDM5LCA5LCA1MSwgMTMsIDEwLCAyLCAxNCwgMiwgNiwgMiwgMSwgMiwgMTAsIDIsIDE0LCAyLCA2LCAyLCAxLCA0LCA1MSwgMTMsIDMxMCwgMTAsIDIxLCAxMSwgNywgMjUsIDUsIDIsIDQxLCAyLCA4LCA3MCwgNSwgMywgMCwgMiwgNDMsIDIsIDEsIDQsIDAsIDMsIDIyLCAxMSwgMjIsIDEwLCAzMCwgNjYsIDE4LCAyLCAxLCAxMSwgMjEsIDExLCAyNSwgNzEsIDU1LCA3LCAxLCA2NSwgMCwgMTYsIDMsIDIsIDIsIDIsIDI4LCA0MywgMjgsIDQsIDI4LCAzNiwgNywgMiwgMjcsIDI4LCA1MywgMTEsIDIxLCAxMSwgMTgsIDE0LCAxNywgMTExLCA3MiwgNTYsIDUwLCAxNCwgNTAsIDE0LCAzNSwgMzksIDI3LCAxMCwgMjIsIDI1MSwgNDEsIDcsIDEsIDE3LCAyLCA2MCwgMjgsIDExLCAwLCA5LCAyMSwgNDMsIDE3LCA0NywgMjAsIDI4LCAyMiwgMTMsIDUyLCA1OCwgMSwgMywgMCwgMTQsIDQ0LCAzMywgMjQsIDI3LCAzNSwgMzAsIDAsIDMsIDAsIDksIDM0LCA0LCAwLCAxMywgNDcsIDE1LCAzLCAyMiwgMCwgMiwgMCwgMzYsIDE3LCAyLCAyNCwgMjAsIDEsIDY0LCA2LCAyLCAwLCAyLCAzLCAyLCAxNCwgMiwgOSwgOCwgNDYsIDM5LCA3LCAzLCAxLCAzLCAyMSwgMiwgNiwgMiwgMSwgMiwgNCwgNCwgMCwgMTksIDAsIDEzLCA0LCAzMSwgOSwgMiwgMCwgMywgMCwgMiwgMzcsIDIsIDAsIDI2LCAwLCAyLCAwLCA0NSwgNTIsIDE5LCAzLCAyMSwgMiwgMzEsIDQ3LCAyMSwgMSwgMiwgMCwgMTg1LCA0NiwgNDIsIDMsIDM3LCA0NywgMjEsIDAsIDYwLCA0MiwgMTQsIDAsIDcyLCAyNiwgMzgsIDYsIDE4NiwgNDMsIDExNywgNjMsIDMyLCA3LCAzLCAwLCAzLCA3LCAyLCAxLCAyLCAyMywgMTYsIDAsIDIsIDAsIDk1LCA3LCAzLCAzOCwgMTcsIDAsIDIsIDAsIDI5LCAwLCAxMSwgMzksIDgsIDAsIDIyLCAwLCAxMiwgNDUsIDIwLCAwLCAxOSwgNzIsIDIwMCwgMzIsIDMyLCA4LCAyLCAzNiwgMTgsIDAsIDUwLCAyOSwgMTEzLCA2LCAyLCAxLCAyLCAzNywgMjIsIDAsIDI2LCA1LCAyLCAxLCAyLCAzMSwgMTUsIDAsIDMyOCwgMTgsIDE2LCAwLCAyLCAxMiwgMiwgMzMsIDEyNSwgMCwgODAsIDkyMSwgMTAzLCAxMTAsIDE4LCAxOTUsIDI2MzcsIDk2LCAxNiwgMTA3MSwgMTgsIDUsIDI2LCAzOTk0LCA2LCA1ODIsIDY4NDIsIDI5LCAxNzYzLCA1NjgsIDgsIDMwLCAxOCwgNzgsIDE4LCAyOSwgMTksIDQ3LCAxNywgMywgMzIsIDIwLCA2LCAxOCwgNDMzLCA0NCwgMjEyLCA2MywgMTI5LCA3NCwgNiwgMCwgNjcsIDEyLCA2NSwgMSwgMiwgMCwgMjksIDYxMzUsIDksIDEyMzcsIDQyLCA5LCA4OTM2LCAzLCAyLCA2LCAyLCAxLCAyLCAyOTAsIDE2LCAwLCAzMCwgMiwgMywgMCwgMTUsIDMsIDksIDM5NSwgMjMwOSwgMTA2LCA2LCAxMiwgNCwgOCwgOCwgOSwgNTk5MSwgODQsIDIsIDcwLCAyLCAxLCAzLCAwLCAzLCAxLCAzLCAzLCAyLCAxMSwgMiwgMCwgMiwgNiwgMiwgNjQsIDIsIDMsIDMsIDcsIDIsIDYsIDIsIDI3LCAyLCAzLCAyLCA0LCAyLCAwLCA0LCA2LCAyLCAzMzksIDMsIDI0LCAyLCAyNCwgMiwgMzAsIDIsIDI0LCAyLCAzMCwgMiwgMjQsIDIsIDMwLCAyLCAyNCwgMiwgMzAsIDIsIDI0LCAyLCA3LCAxODQ1LCAzMCwgNywgNSwgMjYyLCA2MSwgMTQ3LCA0NCwgMTEsIDYsIDE3LCAwLCAzMjIsIDI5LCAxOSwgNDMsIDQ4NSwgMjcsIDIyOSwgMjksIDMsIDAsIDQ5NiwgNiwgMiwgMywgMiwgMSwgMiwgMTQsIDIsIDE5NiwgNjAsIDY3LCA4LCAwLCAxMjA1LCAzLCAyLCAyNiwgMiwgMSwgMiwgMCwgMywgMCwgMiwgOSwgMiwgMywgMiwgMCwgMiwgMCwgNywgMCwgNSwgMCwgMiwgMCwgMiwgMCwgMiwgMiwgMiwgMSwgMiwgMCwgMywgMCwgMiwgMCwgMiwgMCwgMiwgMCwgMiwgMCwgMiwgMSwgMiwgMCwgMywgMywgMiwgNiwgMiwgMywgMiwgMywgMiwgMCwgMiwgOSwgMiwgMTYsIDYsIDIsIDIsIDQsIDIsIDE2LCA0NDIxLCA0MjcxOSwgMzMsIDQxNTMsIDcsIDIyMSwgMywgNTc2MSwgMTUsIDc0NzIsIDE2LCA2MjEsIDI0NjcsIDU0MSwgMTUwNywgNDkzOCwgNiwgNDE5MV07XG5cbi8vIFRoaXMgZmlsZSB3YXMgZ2VuZXJhdGVkLiBEbyBub3QgbW9kaWZ5IG1hbnVhbGx5IVxudmFyIG5vbkFTQ0lJaWRlbnRpZmllckNoYXJzID0gXCJcXHUyMDBjXFx1MjAwZFxceGI3XFx1MDMwMC1cXHUwMzZmXFx1MDM4N1xcdTA0ODMtXFx1MDQ4N1xcdTA1OTEtXFx1MDViZFxcdTA1YmZcXHUwNWMxXFx1MDVjMlxcdTA1YzRcXHUwNWM1XFx1MDVjN1xcdTA2MTAtXFx1MDYxYVxcdTA2NGItXFx1MDY2OVxcdTA2NzBcXHUwNmQ2LVxcdTA2ZGNcXHUwNmRmLVxcdTA2ZTRcXHUwNmU3XFx1MDZlOFxcdTA2ZWEtXFx1MDZlZFxcdTA2ZjAtXFx1MDZmOVxcdTA3MTFcXHUwNzMwLVxcdTA3NGFcXHUwN2E2LVxcdTA3YjBcXHUwN2MwLVxcdTA3YzlcXHUwN2ViLVxcdTA3ZjNcXHUwN2ZkXFx1MDgxNi1cXHUwODE5XFx1MDgxYi1cXHUwODIzXFx1MDgyNS1cXHUwODI3XFx1MDgyOS1cXHUwODJkXFx1MDg1OS1cXHUwODViXFx1MDg5Ny1cXHUwODlmXFx1MDhjYS1cXHUwOGUxXFx1MDhlMy1cXHUwOTAzXFx1MDkzYS1cXHUwOTNjXFx1MDkzZS1cXHUwOTRmXFx1MDk1MS1cXHUwOTU3XFx1MDk2MlxcdTA5NjNcXHUwOTY2LVxcdTA5NmZcXHUwOTgxLVxcdTA5ODNcXHUwOWJjXFx1MDliZS1cXHUwOWM0XFx1MDljN1xcdTA5YzhcXHUwOWNiLVxcdTA5Y2RcXHUwOWQ3XFx1MDllMlxcdTA5ZTNcXHUwOWU2LVxcdTA5ZWZcXHUwOWZlXFx1MGEwMS1cXHUwYTAzXFx1MGEzY1xcdTBhM2UtXFx1MGE0MlxcdTBhNDdcXHUwYTQ4XFx1MGE0Yi1cXHUwYTRkXFx1MGE1MVxcdTBhNjYtXFx1MGE3MVxcdTBhNzVcXHUwYTgxLVxcdTBhODNcXHUwYWJjXFx1MGFiZS1cXHUwYWM1XFx1MGFjNy1cXHUwYWM5XFx1MGFjYi1cXHUwYWNkXFx1MGFlMlxcdTBhZTNcXHUwYWU2LVxcdTBhZWZcXHUwYWZhLVxcdTBhZmZcXHUwYjAxLVxcdTBiMDNcXHUwYjNjXFx1MGIzZS1cXHUwYjQ0XFx1MGI0N1xcdTBiNDhcXHUwYjRiLVxcdTBiNGRcXHUwYjU1LVxcdTBiNTdcXHUwYjYyXFx1MGI2M1xcdTBiNjYtXFx1MGI2ZlxcdTBiODJcXHUwYmJlLVxcdTBiYzJcXHUwYmM2LVxcdTBiYzhcXHUwYmNhLVxcdTBiY2RcXHUwYmQ3XFx1MGJlNi1cXHUwYmVmXFx1MGMwMC1cXHUwYzA0XFx1MGMzY1xcdTBjM2UtXFx1MGM0NFxcdTBjNDYtXFx1MGM0OFxcdTBjNGEtXFx1MGM0ZFxcdTBjNTVcXHUwYzU2XFx1MGM2MlxcdTBjNjNcXHUwYzY2LVxcdTBjNmZcXHUwYzgxLVxcdTBjODNcXHUwY2JjXFx1MGNiZS1cXHUwY2M0XFx1MGNjNi1cXHUwY2M4XFx1MGNjYS1cXHUwY2NkXFx1MGNkNVxcdTBjZDZcXHUwY2UyXFx1MGNlM1xcdTBjZTYtXFx1MGNlZlxcdTBjZjNcXHUwZDAwLVxcdTBkMDNcXHUwZDNiXFx1MGQzY1xcdTBkM2UtXFx1MGQ0NFxcdTBkNDYtXFx1MGQ0OFxcdTBkNGEtXFx1MGQ0ZFxcdTBkNTdcXHUwZDYyXFx1MGQ2M1xcdTBkNjYtXFx1MGQ2ZlxcdTBkODEtXFx1MGQ4M1xcdTBkY2FcXHUwZGNmLVxcdTBkZDRcXHUwZGQ2XFx1MGRkOC1cXHUwZGRmXFx1MGRlNi1cXHUwZGVmXFx1MGRmMlxcdTBkZjNcXHUwZTMxXFx1MGUzNC1cXHUwZTNhXFx1MGU0Ny1cXHUwZTRlXFx1MGU1MC1cXHUwZTU5XFx1MGViMVxcdTBlYjQtXFx1MGViY1xcdTBlYzgtXFx1MGVjZVxcdTBlZDAtXFx1MGVkOVxcdTBmMThcXHUwZjE5XFx1MGYyMC1cXHUwZjI5XFx1MGYzNVxcdTBmMzdcXHUwZjM5XFx1MGYzZVxcdTBmM2ZcXHUwZjcxLVxcdTBmODRcXHUwZjg2XFx1MGY4N1xcdTBmOGQtXFx1MGY5N1xcdTBmOTktXFx1MGZiY1xcdTBmYzZcXHUxMDJiLVxcdTEwM2VcXHUxMDQwLVxcdTEwNDlcXHUxMDU2LVxcdTEwNTlcXHUxMDVlLVxcdTEwNjBcXHUxMDYyLVxcdTEwNjRcXHUxMDY3LVxcdTEwNmRcXHUxMDcxLVxcdTEwNzRcXHUxMDgyLVxcdTEwOGRcXHUxMDhmLVxcdTEwOWRcXHUxMzVkLVxcdTEzNWZcXHUxMzY5LVxcdTEzNzFcXHUxNzEyLVxcdTE3MTVcXHUxNzMyLVxcdTE3MzRcXHUxNzUyXFx1MTc1M1xcdTE3NzJcXHUxNzczXFx1MTdiNC1cXHUxN2QzXFx1MTdkZFxcdTE3ZTAtXFx1MTdlOVxcdTE4MGItXFx1MTgwZFxcdTE4MGYtXFx1MTgxOVxcdTE4YTlcXHUxOTIwLVxcdTE5MmJcXHUxOTMwLVxcdTE5M2JcXHUxOTQ2LVxcdTE5NGZcXHUxOWQwLVxcdTE5ZGFcXHUxYTE3LVxcdTFhMWJcXHUxYTU1LVxcdTFhNWVcXHUxYTYwLVxcdTFhN2NcXHUxYTdmLVxcdTFhODlcXHUxYTkwLVxcdTFhOTlcXHUxYWIwLVxcdTFhYmRcXHUxYWJmLVxcdTFhY2VcXHUxYjAwLVxcdTFiMDRcXHUxYjM0LVxcdTFiNDRcXHUxYjUwLVxcdTFiNTlcXHUxYjZiLVxcdTFiNzNcXHUxYjgwLVxcdTFiODJcXHUxYmExLVxcdTFiYWRcXHUxYmIwLVxcdTFiYjlcXHUxYmU2LVxcdTFiZjNcXHUxYzI0LVxcdTFjMzdcXHUxYzQwLVxcdTFjNDlcXHUxYzUwLVxcdTFjNTlcXHUxY2QwLVxcdTFjZDJcXHUxY2Q0LVxcdTFjZThcXHUxY2VkXFx1MWNmNFxcdTFjZjctXFx1MWNmOVxcdTFkYzAtXFx1MWRmZlxcdTIwMGNcXHUyMDBkXFx1MjAzZlxcdTIwNDBcXHUyMDU0XFx1MjBkMC1cXHUyMGRjXFx1MjBlMVxcdTIwZTUtXFx1MjBmMFxcdTJjZWYtXFx1MmNmMVxcdTJkN2ZcXHUyZGUwLVxcdTJkZmZcXHUzMDJhLVxcdTMwMmZcXHUzMDk5XFx1MzA5YVxcdTMwZmJcXHVhNjIwLVxcdWE2MjlcXHVhNjZmXFx1YTY3NC1cXHVhNjdkXFx1YTY5ZVxcdWE2OWZcXHVhNmYwXFx1YTZmMVxcdWE4MDJcXHVhODA2XFx1YTgwYlxcdWE4MjMtXFx1YTgyN1xcdWE4MmNcXHVhODgwXFx1YTg4MVxcdWE4YjQtXFx1YThjNVxcdWE4ZDAtXFx1YThkOVxcdWE4ZTAtXFx1YThmMVxcdWE4ZmYtXFx1YTkwOVxcdWE5MjYtXFx1YTkyZFxcdWE5NDctXFx1YTk1M1xcdWE5ODAtXFx1YTk4M1xcdWE5YjMtXFx1YTljMFxcdWE5ZDAtXFx1YTlkOVxcdWE5ZTVcXHVhOWYwLVxcdWE5ZjlcXHVhYTI5LVxcdWFhMzZcXHVhYTQzXFx1YWE0Y1xcdWFhNGRcXHVhYTUwLVxcdWFhNTlcXHVhYTdiLVxcdWFhN2RcXHVhYWIwXFx1YWFiMi1cXHVhYWI0XFx1YWFiN1xcdWFhYjhcXHVhYWJlXFx1YWFiZlxcdWFhYzFcXHVhYWViLVxcdWFhZWZcXHVhYWY1XFx1YWFmNlxcdWFiZTMtXFx1YWJlYVxcdWFiZWNcXHVhYmVkXFx1YWJmMC1cXHVhYmY5XFx1ZmIxZVxcdWZlMDAtXFx1ZmUwZlxcdWZlMjAtXFx1ZmUyZlxcdWZlMzNcXHVmZTM0XFx1ZmU0ZC1cXHVmZTRmXFx1ZmYxMC1cXHVmZjE5XFx1ZmYzZlxcdWZmNjVcIjtcblxuLy8gVGhpcyBmaWxlIHdhcyBnZW5lcmF0ZWQuIERvIG5vdCBtb2RpZnkgbWFudWFsbHkhXG52YXIgbm9uQVNDSUlpZGVudGlmaWVyU3RhcnRDaGFycyA9IFwiXFx4YWFcXHhiNVxceGJhXFx4YzAtXFx4ZDZcXHhkOC1cXHhmNlxceGY4LVxcdTAyYzFcXHUwMmM2LVxcdTAyZDFcXHUwMmUwLVxcdTAyZTRcXHUwMmVjXFx1MDJlZVxcdTAzNzAtXFx1MDM3NFxcdTAzNzZcXHUwMzc3XFx1MDM3YS1cXHUwMzdkXFx1MDM3ZlxcdTAzODZcXHUwMzg4LVxcdTAzOGFcXHUwMzhjXFx1MDM4ZS1cXHUwM2ExXFx1MDNhMy1cXHUwM2Y1XFx1MDNmNy1cXHUwNDgxXFx1MDQ4YS1cXHUwNTJmXFx1MDUzMS1cXHUwNTU2XFx1MDU1OVxcdTA1NjAtXFx1MDU4OFxcdTA1ZDAtXFx1MDVlYVxcdTA1ZWYtXFx1MDVmMlxcdTA2MjAtXFx1MDY0YVxcdTA2NmVcXHUwNjZmXFx1MDY3MS1cXHUwNmQzXFx1MDZkNVxcdTA2ZTVcXHUwNmU2XFx1MDZlZVxcdTA2ZWZcXHUwNmZhLVxcdTA2ZmNcXHUwNmZmXFx1MDcxMFxcdTA3MTItXFx1MDcyZlxcdTA3NGQtXFx1MDdhNVxcdTA3YjFcXHUwN2NhLVxcdTA3ZWFcXHUwN2Y0XFx1MDdmNVxcdTA3ZmFcXHUwODAwLVxcdTA4MTVcXHUwODFhXFx1MDgyNFxcdTA4MjhcXHUwODQwLVxcdTA4NThcXHUwODYwLVxcdTA4NmFcXHUwODcwLVxcdTA4ODdcXHUwODg5LVxcdTA4OGVcXHUwOGEwLVxcdTA4YzlcXHUwOTA0LVxcdTA5MzlcXHUwOTNkXFx1MDk1MFxcdTA5NTgtXFx1MDk2MVxcdTA5NzEtXFx1MDk4MFxcdTA5ODUtXFx1MDk4Y1xcdTA5OGZcXHUwOTkwXFx1MDk5My1cXHUwOWE4XFx1MDlhYS1cXHUwOWIwXFx1MDliMlxcdTA5YjYtXFx1MDliOVxcdTA5YmRcXHUwOWNlXFx1MDlkY1xcdTA5ZGRcXHUwOWRmLVxcdTA5ZTFcXHUwOWYwXFx1MDlmMVxcdTA5ZmNcXHUwYTA1LVxcdTBhMGFcXHUwYTBmXFx1MGExMFxcdTBhMTMtXFx1MGEyOFxcdTBhMmEtXFx1MGEzMFxcdTBhMzJcXHUwYTMzXFx1MGEzNVxcdTBhMzZcXHUwYTM4XFx1MGEzOVxcdTBhNTktXFx1MGE1Y1xcdTBhNWVcXHUwYTcyLVxcdTBhNzRcXHUwYTg1LVxcdTBhOGRcXHUwYThmLVxcdTBhOTFcXHUwYTkzLVxcdTBhYThcXHUwYWFhLVxcdTBhYjBcXHUwYWIyXFx1MGFiM1xcdTBhYjUtXFx1MGFiOVxcdTBhYmRcXHUwYWQwXFx1MGFlMFxcdTBhZTFcXHUwYWY5XFx1MGIwNS1cXHUwYjBjXFx1MGIwZlxcdTBiMTBcXHUwYjEzLVxcdTBiMjhcXHUwYjJhLVxcdTBiMzBcXHUwYjMyXFx1MGIzM1xcdTBiMzUtXFx1MGIzOVxcdTBiM2RcXHUwYjVjXFx1MGI1ZFxcdTBiNWYtXFx1MGI2MVxcdTBiNzFcXHUwYjgzXFx1MGI4NS1cXHUwYjhhXFx1MGI4ZS1cXHUwYjkwXFx1MGI5Mi1cXHUwYjk1XFx1MGI5OVxcdTBiOWFcXHUwYjljXFx1MGI5ZVxcdTBiOWZcXHUwYmEzXFx1MGJhNFxcdTBiYTgtXFx1MGJhYVxcdTBiYWUtXFx1MGJiOVxcdTBiZDBcXHUwYzA1LVxcdTBjMGNcXHUwYzBlLVxcdTBjMTBcXHUwYzEyLVxcdTBjMjhcXHUwYzJhLVxcdTBjMzlcXHUwYzNkXFx1MGM1OC1cXHUwYzVhXFx1MGM1ZFxcdTBjNjBcXHUwYzYxXFx1MGM4MFxcdTBjODUtXFx1MGM4Y1xcdTBjOGUtXFx1MGM5MFxcdTBjOTItXFx1MGNhOFxcdTBjYWEtXFx1MGNiM1xcdTBjYjUtXFx1MGNiOVxcdTBjYmRcXHUwY2RkXFx1MGNkZVxcdTBjZTBcXHUwY2UxXFx1MGNmMVxcdTBjZjJcXHUwZDA0LVxcdTBkMGNcXHUwZDBlLVxcdTBkMTBcXHUwZDEyLVxcdTBkM2FcXHUwZDNkXFx1MGQ0ZVxcdTBkNTQtXFx1MGQ1NlxcdTBkNWYtXFx1MGQ2MVxcdTBkN2EtXFx1MGQ3ZlxcdTBkODUtXFx1MGQ5NlxcdTBkOWEtXFx1MGRiMVxcdTBkYjMtXFx1MGRiYlxcdTBkYmRcXHUwZGMwLVxcdTBkYzZcXHUwZTAxLVxcdTBlMzBcXHUwZTMyXFx1MGUzM1xcdTBlNDAtXFx1MGU0NlxcdTBlODFcXHUwZTgyXFx1MGU4NFxcdTBlODYtXFx1MGU4YVxcdTBlOGMtXFx1MGVhM1xcdTBlYTVcXHUwZWE3LVxcdTBlYjBcXHUwZWIyXFx1MGViM1xcdTBlYmRcXHUwZWMwLVxcdTBlYzRcXHUwZWM2XFx1MGVkYy1cXHUwZWRmXFx1MGYwMFxcdTBmNDAtXFx1MGY0N1xcdTBmNDktXFx1MGY2Y1xcdTBmODgtXFx1MGY4Y1xcdTEwMDAtXFx1MTAyYVxcdTEwM2ZcXHUxMDUwLVxcdTEwNTVcXHUxMDVhLVxcdTEwNWRcXHUxMDYxXFx1MTA2NVxcdTEwNjZcXHUxMDZlLVxcdTEwNzBcXHUxMDc1LVxcdTEwODFcXHUxMDhlXFx1MTBhMC1cXHUxMGM1XFx1MTBjN1xcdTEwY2RcXHUxMGQwLVxcdTEwZmFcXHUxMGZjLVxcdTEyNDhcXHUxMjRhLVxcdTEyNGRcXHUxMjUwLVxcdTEyNTZcXHUxMjU4XFx1MTI1YS1cXHUxMjVkXFx1MTI2MC1cXHUxMjg4XFx1MTI4YS1cXHUxMjhkXFx1MTI5MC1cXHUxMmIwXFx1MTJiMi1cXHUxMmI1XFx1MTJiOC1cXHUxMmJlXFx1MTJjMFxcdTEyYzItXFx1MTJjNVxcdTEyYzgtXFx1MTJkNlxcdTEyZDgtXFx1MTMxMFxcdTEzMTItXFx1MTMxNVxcdTEzMTgtXFx1MTM1YVxcdTEzODAtXFx1MTM4ZlxcdTEzYTAtXFx1MTNmNVxcdTEzZjgtXFx1MTNmZFxcdTE0MDEtXFx1MTY2Y1xcdTE2NmYtXFx1MTY3ZlxcdTE2ODEtXFx1MTY5YVxcdTE2YTAtXFx1MTZlYVxcdTE2ZWUtXFx1MTZmOFxcdTE3MDAtXFx1MTcxMVxcdTE3MWYtXFx1MTczMVxcdTE3NDAtXFx1MTc1MVxcdTE3NjAtXFx1MTc2Y1xcdTE3NmUtXFx1MTc3MFxcdTE3ODAtXFx1MTdiM1xcdTE3ZDdcXHUxN2RjXFx1MTgyMC1cXHUxODc4XFx1MTg4MC1cXHUxOGE4XFx1MThhYVxcdTE4YjAtXFx1MThmNVxcdTE5MDAtXFx1MTkxZVxcdTE5NTAtXFx1MTk2ZFxcdTE5NzAtXFx1MTk3NFxcdTE5ODAtXFx1MTlhYlxcdTE5YjAtXFx1MTljOVxcdTFhMDAtXFx1MWExNlxcdTFhMjAtXFx1MWE1NFxcdTFhYTdcXHUxYjA1LVxcdTFiMzNcXHUxYjQ1LVxcdTFiNGNcXHUxYjgzLVxcdTFiYTBcXHUxYmFlXFx1MWJhZlxcdTFiYmEtXFx1MWJlNVxcdTFjMDAtXFx1MWMyM1xcdTFjNGQtXFx1MWM0ZlxcdTFjNWEtXFx1MWM3ZFxcdTFjODAtXFx1MWM4YVxcdTFjOTAtXFx1MWNiYVxcdTFjYmQtXFx1MWNiZlxcdTFjZTktXFx1MWNlY1xcdTFjZWUtXFx1MWNmM1xcdTFjZjVcXHUxY2Y2XFx1MWNmYVxcdTFkMDAtXFx1MWRiZlxcdTFlMDAtXFx1MWYxNVxcdTFmMTgtXFx1MWYxZFxcdTFmMjAtXFx1MWY0NVxcdTFmNDgtXFx1MWY0ZFxcdTFmNTAtXFx1MWY1N1xcdTFmNTlcXHUxZjViXFx1MWY1ZFxcdTFmNWYtXFx1MWY3ZFxcdTFmODAtXFx1MWZiNFxcdTFmYjYtXFx1MWZiY1xcdTFmYmVcXHUxZmMyLVxcdTFmYzRcXHUxZmM2LVxcdTFmY2NcXHUxZmQwLVxcdTFmZDNcXHUxZmQ2LVxcdTFmZGJcXHUxZmUwLVxcdTFmZWNcXHUxZmYyLVxcdTFmZjRcXHUxZmY2LVxcdTFmZmNcXHUyMDcxXFx1MjA3ZlxcdTIwOTAtXFx1MjA5Y1xcdTIxMDJcXHUyMTA3XFx1MjEwYS1cXHUyMTEzXFx1MjExNVxcdTIxMTgtXFx1MjExZFxcdTIxMjRcXHUyMTI2XFx1MjEyOFxcdTIxMmEtXFx1MjEzOVxcdTIxM2MtXFx1MjEzZlxcdTIxNDUtXFx1MjE0OVxcdTIxNGVcXHUyMTYwLVxcdTIxODhcXHUyYzAwLVxcdTJjZTRcXHUyY2ViLVxcdTJjZWVcXHUyY2YyXFx1MmNmM1xcdTJkMDAtXFx1MmQyNVxcdTJkMjdcXHUyZDJkXFx1MmQzMC1cXHUyZDY3XFx1MmQ2ZlxcdTJkODAtXFx1MmQ5NlxcdTJkYTAtXFx1MmRhNlxcdTJkYTgtXFx1MmRhZVxcdTJkYjAtXFx1MmRiNlxcdTJkYjgtXFx1MmRiZVxcdTJkYzAtXFx1MmRjNlxcdTJkYzgtXFx1MmRjZVxcdTJkZDAtXFx1MmRkNlxcdTJkZDgtXFx1MmRkZVxcdTMwMDUtXFx1MzAwN1xcdTMwMjEtXFx1MzAyOVxcdTMwMzEtXFx1MzAzNVxcdTMwMzgtXFx1MzAzY1xcdTMwNDEtXFx1MzA5NlxcdTMwOWItXFx1MzA5ZlxcdTMwYTEtXFx1MzBmYVxcdTMwZmMtXFx1MzBmZlxcdTMxMDUtXFx1MzEyZlxcdTMxMzEtXFx1MzE4ZVxcdTMxYTAtXFx1MzFiZlxcdTMxZjAtXFx1MzFmZlxcdTM0MDAtXFx1NGRiZlxcdTRlMDAtXFx1YTQ4Y1xcdWE0ZDAtXFx1YTRmZFxcdWE1MDAtXFx1YTYwY1xcdWE2MTAtXFx1YTYxZlxcdWE2MmFcXHVhNjJiXFx1YTY0MC1cXHVhNjZlXFx1YTY3Zi1cXHVhNjlkXFx1YTZhMC1cXHVhNmVmXFx1YTcxNy1cXHVhNzFmXFx1YTcyMi1cXHVhNzg4XFx1YTc4Yi1cXHVhN2NkXFx1YTdkMFxcdWE3ZDFcXHVhN2QzXFx1YTdkNS1cXHVhN2RjXFx1YTdmMi1cXHVhODAxXFx1YTgwMy1cXHVhODA1XFx1YTgwNy1cXHVhODBhXFx1YTgwYy1cXHVhODIyXFx1YTg0MC1cXHVhODczXFx1YTg4Mi1cXHVhOGIzXFx1YThmMi1cXHVhOGY3XFx1YThmYlxcdWE4ZmRcXHVhOGZlXFx1YTkwYS1cXHVhOTI1XFx1YTkzMC1cXHVhOTQ2XFx1YTk2MC1cXHVhOTdjXFx1YTk4NC1cXHVhOWIyXFx1YTljZlxcdWE5ZTAtXFx1YTllNFxcdWE5ZTYtXFx1YTllZlxcdWE5ZmEtXFx1YTlmZVxcdWFhMDAtXFx1YWEyOFxcdWFhNDAtXFx1YWE0MlxcdWFhNDQtXFx1YWE0YlxcdWFhNjAtXFx1YWE3NlxcdWFhN2FcXHVhYTdlLVxcdWFhYWZcXHVhYWIxXFx1YWFiNVxcdWFhYjZcXHVhYWI5LVxcdWFhYmRcXHVhYWMwXFx1YWFjMlxcdWFhZGItXFx1YWFkZFxcdWFhZTAtXFx1YWFlYVxcdWFhZjItXFx1YWFmNFxcdWFiMDEtXFx1YWIwNlxcdWFiMDktXFx1YWIwZVxcdWFiMTEtXFx1YWIxNlxcdWFiMjAtXFx1YWIyNlxcdWFiMjgtXFx1YWIyZVxcdWFiMzAtXFx1YWI1YVxcdWFiNWMtXFx1YWI2OVxcdWFiNzAtXFx1YWJlMlxcdWFjMDAtXFx1ZDdhM1xcdWQ3YjAtXFx1ZDdjNlxcdWQ3Y2ItXFx1ZDdmYlxcdWY5MDAtXFx1ZmE2ZFxcdWZhNzAtXFx1ZmFkOVxcdWZiMDAtXFx1ZmIwNlxcdWZiMTMtXFx1ZmIxN1xcdWZiMWRcXHVmYjFmLVxcdWZiMjhcXHVmYjJhLVxcdWZiMzZcXHVmYjM4LVxcdWZiM2NcXHVmYjNlXFx1ZmI0MFxcdWZiNDFcXHVmYjQzXFx1ZmI0NFxcdWZiNDYtXFx1ZmJiMVxcdWZiZDMtXFx1ZmQzZFxcdWZkNTAtXFx1ZmQ4ZlxcdWZkOTItXFx1ZmRjN1xcdWZkZjAtXFx1ZmRmYlxcdWZlNzAtXFx1ZmU3NFxcdWZlNzYtXFx1ZmVmY1xcdWZmMjEtXFx1ZmYzYVxcdWZmNDEtXFx1ZmY1YVxcdWZmNjYtXFx1ZmZiZVxcdWZmYzItXFx1ZmZjN1xcdWZmY2EtXFx1ZmZjZlxcdWZmZDItXFx1ZmZkN1xcdWZmZGEtXFx1ZmZkY1wiO1xuXG4vLyBUaGVzZSBhcmUgYSBydW4tbGVuZ3RoIGFuZCBvZmZzZXQgZW5jb2RlZCByZXByZXNlbnRhdGlvbiBvZiB0aGVcbi8vID4weGZmZmYgY29kZSBwb2ludHMgdGhhdCBhcmUgYSB2YWxpZCBwYXJ0IG9mIGlkZW50aWZpZXJzLiBUaGVcbi8vIG9mZnNldCBzdGFydHMgYXQgMHgxMDAwMCwgYW5kIGVhY2ggcGFpciBvZiBudW1iZXJzIHJlcHJlc2VudHMgYW5cbi8vIG9mZnNldCB0byB0aGUgbmV4dCByYW5nZSwgYW5kIHRoZW4gYSBzaXplIG9mIHRoZSByYW5nZS5cblxuLy8gUmVzZXJ2ZWQgd29yZCBsaXN0cyBmb3IgdmFyaW91cyBkaWFsZWN0cyBvZiB0aGUgbGFuZ3VhZ2VcblxudmFyIHJlc2VydmVkV29yZHMgPSB7XG4gIDM6IFwiYWJzdHJhY3QgYm9vbGVhbiBieXRlIGNoYXIgY2xhc3MgZG91YmxlIGVudW0gZXhwb3J0IGV4dGVuZHMgZmluYWwgZmxvYXQgZ290byBpbXBsZW1lbnRzIGltcG9ydCBpbnQgaW50ZXJmYWNlIGxvbmcgbmF0aXZlIHBhY2thZ2UgcHJpdmF0ZSBwcm90ZWN0ZWQgcHVibGljIHNob3J0IHN0YXRpYyBzdXBlciBzeW5jaHJvbml6ZWQgdGhyb3dzIHRyYW5zaWVudCB2b2xhdGlsZVwiLFxuICA1OiBcImNsYXNzIGVudW0gZXh0ZW5kcyBzdXBlciBjb25zdCBleHBvcnQgaW1wb3J0XCIsXG4gIDY6IFwiZW51bVwiLFxuICBzdHJpY3Q6IFwiaW1wbGVtZW50cyBpbnRlcmZhY2UgbGV0IHBhY2thZ2UgcHJpdmF0ZSBwcm90ZWN0ZWQgcHVibGljIHN0YXRpYyB5aWVsZFwiLFxuICBzdHJpY3RCaW5kOiBcImV2YWwgYXJndW1lbnRzXCJcbn07XG5cbi8vIEFuZCB0aGUga2V5d29yZHNcblxudmFyIGVjbWE1QW5kTGVzc0tleXdvcmRzID0gXCJicmVhayBjYXNlIGNhdGNoIGNvbnRpbnVlIGRlYnVnZ2VyIGRlZmF1bHQgZG8gZWxzZSBmaW5hbGx5IGZvciBmdW5jdGlvbiBpZiByZXR1cm4gc3dpdGNoIHRocm93IHRyeSB2YXIgd2hpbGUgd2l0aCBudWxsIHRydWUgZmFsc2UgaW5zdGFuY2VvZiB0eXBlb2Ygdm9pZCBkZWxldGUgbmV3IGluIHRoaXNcIjtcblxudmFyIGtleXdvcmRzJDEgPSB7XG4gIDU6IGVjbWE1QW5kTGVzc0tleXdvcmRzLFxuICBcIjVtb2R1bGVcIjogZWNtYTVBbmRMZXNzS2V5d29yZHMgKyBcIiBleHBvcnQgaW1wb3J0XCIsXG4gIDY6IGVjbWE1QW5kTGVzc0tleXdvcmRzICsgXCIgY29uc3QgY2xhc3MgZXh0ZW5kcyBleHBvcnQgaW1wb3J0IHN1cGVyXCJcbn07XG5cbnZhciBrZXl3b3JkUmVsYXRpb25hbE9wZXJhdG9yID0gL15pbihzdGFuY2VvZik/JC87XG5cbi8vICMjIENoYXJhY3RlciBjYXRlZ29yaWVzXG5cbnZhciBub25BU0NJSWlkZW50aWZpZXJTdGFydCA9IG5ldyBSZWdFeHAoXCJbXCIgKyBub25BU0NJSWlkZW50aWZpZXJTdGFydENoYXJzICsgXCJdXCIpO1xudmFyIG5vbkFTQ0lJaWRlbnRpZmllciA9IG5ldyBSZWdFeHAoXCJbXCIgKyBub25BU0NJSWlkZW50aWZpZXJTdGFydENoYXJzICsgbm9uQVNDSUlpZGVudGlmaWVyQ2hhcnMgKyBcIl1cIik7XG5cbi8vIFRoaXMgaGFzIGEgY29tcGxleGl0eSBsaW5lYXIgdG8gdGhlIHZhbHVlIG9mIHRoZSBjb2RlLiBUaGVcbi8vIGFzc3VtcHRpb24gaXMgdGhhdCBsb29raW5nIHVwIGFzdHJhbCBpZGVudGlmaWVyIGNoYXJhY3RlcnMgaXNcbi8vIHJhcmUuXG5mdW5jdGlvbiBpc0luQXN0cmFsU2V0KGNvZGUsIHNldCkge1xuICB2YXIgcG9zID0gMHgxMDAwMDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZXQubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBwb3MgKz0gc2V0W2ldO1xuICAgIGlmIChwb3MgPiBjb2RlKSB7IHJldHVybiBmYWxzZSB9XG4gICAgcG9zICs9IHNldFtpICsgMV07XG4gICAgaWYgKHBvcyA+PSBjb2RlKSB7IHJldHVybiB0cnVlIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLy8gVGVzdCB3aGV0aGVyIGEgZ2l2ZW4gY2hhcmFjdGVyIGNvZGUgc3RhcnRzIGFuIGlkZW50aWZpZXIuXG5cbmZ1bmN0aW9uIGlzSWRlbnRpZmllclN0YXJ0KGNvZGUsIGFzdHJhbCkge1xuICBpZiAoY29kZSA8IDY1KSB7IHJldHVybiBjb2RlID09PSAzNiB9XG4gIGlmIChjb2RlIDwgOTEpIHsgcmV0dXJuIHRydWUgfVxuICBpZiAoY29kZSA8IDk3KSB7IHJldHVybiBjb2RlID09PSA5NSB9XG4gIGlmIChjb2RlIDwgMTIzKSB7IHJldHVybiB0cnVlIH1cbiAgaWYgKGNvZGUgPD0gMHhmZmZmKSB7IHJldHVybiBjb2RlID49IDB4YWEgJiYgbm9uQVNDSUlpZGVudGlmaWVyU3RhcnQudGVzdChTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUpKSB9XG4gIGlmIChhc3RyYWwgPT09IGZhbHNlKSB7IHJldHVybiBmYWxzZSB9XG4gIHJldHVybiBpc0luQXN0cmFsU2V0KGNvZGUsIGFzdHJhbElkZW50aWZpZXJTdGFydENvZGVzKVxufVxuXG4vLyBUZXN0IHdoZXRoZXIgYSBnaXZlbiBjaGFyYWN0ZXIgaXMgcGFydCBvZiBhbiBpZGVudGlmaWVyLlxuXG5mdW5jdGlvbiBpc0lkZW50aWZpZXJDaGFyKGNvZGUsIGFzdHJhbCkge1xuICBpZiAoY29kZSA8IDQ4KSB7IHJldHVybiBjb2RlID09PSAzNiB9XG4gIGlmIChjb2RlIDwgNTgpIHsgcmV0dXJuIHRydWUgfVxuICBpZiAoY29kZSA8IDY1KSB7IHJldHVybiBmYWxzZSB9XG4gIGlmIChjb2RlIDwgOTEpIHsgcmV0dXJuIHRydWUgfVxuICBpZiAoY29kZSA8IDk3KSB7IHJldHVybiBjb2RlID09PSA5NSB9XG4gIGlmIChjb2RlIDwgMTIzKSB7IHJldHVybiB0cnVlIH1cbiAgaWYgKGNvZGUgPD0gMHhmZmZmKSB7IHJldHVybiBjb2RlID49IDB4YWEgJiYgbm9uQVNDSUlpZGVudGlmaWVyLnRlc3QoU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKSkgfVxuICBpZiAoYXN0cmFsID09PSBmYWxzZSkgeyByZXR1cm4gZmFsc2UgfVxuICByZXR1cm4gaXNJbkFzdHJhbFNldChjb2RlLCBhc3RyYWxJZGVudGlmaWVyU3RhcnRDb2RlcykgfHwgaXNJbkFzdHJhbFNldChjb2RlLCBhc3RyYWxJZGVudGlmaWVyQ29kZXMpXG59XG5cbi8vICMjIFRva2VuIHR5cGVzXG5cbi8vIFRoZSBhc3NpZ25tZW50IG9mIGZpbmUtZ3JhaW5lZCwgaW5mb3JtYXRpb24tY2FycnlpbmcgdHlwZSBvYmplY3RzXG4vLyBhbGxvd3MgdGhlIHRva2VuaXplciB0byBzdG9yZSB0aGUgaW5mb3JtYXRpb24gaXQgaGFzIGFib3V0IGFcbi8vIHRva2VuIGluIGEgd2F5IHRoYXQgaXMgdmVyeSBjaGVhcCBmb3IgdGhlIHBhcnNlciB0byBsb29rIHVwLlxuXG4vLyBBbGwgdG9rZW4gdHlwZSB2YXJpYWJsZXMgc3RhcnQgd2l0aCBhbiB1bmRlcnNjb3JlLCB0byBtYWtlIHRoZW1cbi8vIGVhc3kgdG8gcmVjb2duaXplLlxuXG4vLyBUaGUgYGJlZm9yZUV4cHJgIHByb3BlcnR5IGlzIHVzZWQgdG8gZGlzYW1iaWd1YXRlIGJldHdlZW4gcmVndWxhclxuLy8gZXhwcmVzc2lvbnMgYW5kIGRpdmlzaW9ucy4gSXQgaXMgc2V0IG9uIGFsbCB0b2tlbiB0eXBlcyB0aGF0IGNhblxuLy8gYmUgZm9sbG93ZWQgYnkgYW4gZXhwcmVzc2lvbiAodGh1cywgYSBzbGFzaCBhZnRlciB0aGVtIHdvdWxkIGJlIGFcbi8vIHJlZ3VsYXIgZXhwcmVzc2lvbikuXG4vL1xuLy8gVGhlIGBzdGFydHNFeHByYCBwcm9wZXJ0eSBpcyB1c2VkIHRvIGNoZWNrIGlmIHRoZSB0b2tlbiBlbmRzIGFcbi8vIGB5aWVsZGAgZXhwcmVzc2lvbi4gSXQgaXMgc2V0IG9uIGFsbCB0b2tlbiB0eXBlcyB0aGF0IGVpdGhlciBjYW5cbi8vIGRpcmVjdGx5IHN0YXJ0IGFuIGV4cHJlc3Npb24gKGxpa2UgYSBxdW90YXRpb24gbWFyaykgb3IgY2FuXG4vLyBjb250aW51ZSBhbiBleHByZXNzaW9uIChsaWtlIHRoZSBib2R5IG9mIGEgc3RyaW5nKS5cbi8vXG4vLyBgaXNMb29wYCBtYXJrcyBhIGtleXdvcmQgYXMgc3RhcnRpbmcgYSBsb29wLCB3aGljaCBpcyBpbXBvcnRhbnRcbi8vIHRvIGtub3cgd2hlbiBwYXJzaW5nIGEgbGFiZWwsIGluIG9yZGVyIHRvIGFsbG93IG9yIGRpc2FsbG93XG4vLyBjb250aW51ZSBqdW1wcyB0byB0aGF0IGxhYmVsLlxuXG52YXIgVG9rZW5UeXBlID0gZnVuY3Rpb24gVG9rZW5UeXBlKGxhYmVsLCBjb25mKSB7XG4gIGlmICggY29uZiA9PT0gdm9pZCAwICkgY29uZiA9IHt9O1xuXG4gIHRoaXMubGFiZWwgPSBsYWJlbDtcbiAgdGhpcy5rZXl3b3JkID0gY29uZi5rZXl3b3JkO1xuICB0aGlzLmJlZm9yZUV4cHIgPSAhIWNvbmYuYmVmb3JlRXhwcjtcbiAgdGhpcy5zdGFydHNFeHByID0gISFjb25mLnN0YXJ0c0V4cHI7XG4gIHRoaXMuaXNMb29wID0gISFjb25mLmlzTG9vcDtcbiAgdGhpcy5pc0Fzc2lnbiA9ICEhY29uZi5pc0Fzc2lnbjtcbiAgdGhpcy5wcmVmaXggPSAhIWNvbmYucHJlZml4O1xuICB0aGlzLnBvc3RmaXggPSAhIWNvbmYucG9zdGZpeDtcbiAgdGhpcy5iaW5vcCA9IGNvbmYuYmlub3AgfHwgbnVsbDtcbiAgdGhpcy51cGRhdGVDb250ZXh0ID0gbnVsbDtcbn07XG5cbmZ1bmN0aW9uIGJpbm9wKG5hbWUsIHByZWMpIHtcbiAgcmV0dXJuIG5ldyBUb2tlblR5cGUobmFtZSwge2JlZm9yZUV4cHI6IHRydWUsIGJpbm9wOiBwcmVjfSlcbn1cbnZhciBiZWZvcmVFeHByID0ge2JlZm9yZUV4cHI6IHRydWV9LCBzdGFydHNFeHByID0ge3N0YXJ0c0V4cHI6IHRydWV9O1xuXG4vLyBNYXAga2V5d29yZCBuYW1lcyB0byB0b2tlbiB0eXBlcy5cblxudmFyIGtleXdvcmRzID0ge307XG5cbi8vIFN1Y2NpbmN0IGRlZmluaXRpb25zIG9mIGtleXdvcmQgdG9rZW4gdHlwZXNcbmZ1bmN0aW9uIGt3KG5hbWUsIG9wdGlvbnMpIHtcbiAgaWYgKCBvcHRpb25zID09PSB2b2lkIDAgKSBvcHRpb25zID0ge307XG5cbiAgb3B0aW9ucy5rZXl3b3JkID0gbmFtZTtcbiAgcmV0dXJuIGtleXdvcmRzW25hbWVdID0gbmV3IFRva2VuVHlwZShuYW1lLCBvcHRpb25zKVxufVxuXG52YXIgdHlwZXMkMSA9IHtcbiAgbnVtOiBuZXcgVG9rZW5UeXBlKFwibnVtXCIsIHN0YXJ0c0V4cHIpLFxuICByZWdleHA6IG5ldyBUb2tlblR5cGUoXCJyZWdleHBcIiwgc3RhcnRzRXhwciksXG4gIHN0cmluZzogbmV3IFRva2VuVHlwZShcInN0cmluZ1wiLCBzdGFydHNFeHByKSxcbiAgbmFtZTogbmV3IFRva2VuVHlwZShcIm5hbWVcIiwgc3RhcnRzRXhwciksXG4gIHByaXZhdGVJZDogbmV3IFRva2VuVHlwZShcInByaXZhdGVJZFwiLCBzdGFydHNFeHByKSxcbiAgZW9mOiBuZXcgVG9rZW5UeXBlKFwiZW9mXCIpLFxuXG4gIC8vIFB1bmN0dWF0aW9uIHRva2VuIHR5cGVzLlxuICBicmFja2V0TDogbmV3IFRva2VuVHlwZShcIltcIiwge2JlZm9yZUV4cHI6IHRydWUsIHN0YXJ0c0V4cHI6IHRydWV9KSxcbiAgYnJhY2tldFI6IG5ldyBUb2tlblR5cGUoXCJdXCIpLFxuICBicmFjZUw6IG5ldyBUb2tlblR5cGUoXCJ7XCIsIHtiZWZvcmVFeHByOiB0cnVlLCBzdGFydHNFeHByOiB0cnVlfSksXG4gIGJyYWNlUjogbmV3IFRva2VuVHlwZShcIn1cIiksXG4gIHBhcmVuTDogbmV3IFRva2VuVHlwZShcIihcIiwge2JlZm9yZUV4cHI6IHRydWUsIHN0YXJ0c0V4cHI6IHRydWV9KSxcbiAgcGFyZW5SOiBuZXcgVG9rZW5UeXBlKFwiKVwiKSxcbiAgY29tbWE6IG5ldyBUb2tlblR5cGUoXCIsXCIsIGJlZm9yZUV4cHIpLFxuICBzZW1pOiBuZXcgVG9rZW5UeXBlKFwiO1wiLCBiZWZvcmVFeHByKSxcbiAgY29sb246IG5ldyBUb2tlblR5cGUoXCI6XCIsIGJlZm9yZUV4cHIpLFxuICBkb3Q6IG5ldyBUb2tlblR5cGUoXCIuXCIpLFxuICBxdWVzdGlvbjogbmV3IFRva2VuVHlwZShcIj9cIiwgYmVmb3JlRXhwciksXG4gIHF1ZXN0aW9uRG90OiBuZXcgVG9rZW5UeXBlKFwiPy5cIiksXG4gIGFycm93OiBuZXcgVG9rZW5UeXBlKFwiPT5cIiwgYmVmb3JlRXhwciksXG4gIHRlbXBsYXRlOiBuZXcgVG9rZW5UeXBlKFwidGVtcGxhdGVcIiksXG4gIGludmFsaWRUZW1wbGF0ZTogbmV3IFRva2VuVHlwZShcImludmFsaWRUZW1wbGF0ZVwiKSxcbiAgZWxsaXBzaXM6IG5ldyBUb2tlblR5cGUoXCIuLi5cIiwgYmVmb3JlRXhwciksXG4gIGJhY2tRdW90ZTogbmV3IFRva2VuVHlwZShcImBcIiwgc3RhcnRzRXhwciksXG4gIGRvbGxhckJyYWNlTDogbmV3IFRva2VuVHlwZShcIiR7XCIsIHtiZWZvcmVFeHByOiB0cnVlLCBzdGFydHNFeHByOiB0cnVlfSksXG5cbiAgLy8gT3BlcmF0b3JzLiBUaGVzZSBjYXJyeSBzZXZlcmFsIGtpbmRzIG9mIHByb3BlcnRpZXMgdG8gaGVscCB0aGVcbiAgLy8gcGFyc2VyIHVzZSB0aGVtIHByb3Blcmx5ICh0aGUgcHJlc2VuY2Ugb2YgdGhlc2UgcHJvcGVydGllcyBpc1xuICAvLyB3aGF0IGNhdGVnb3JpemVzIHRoZW0gYXMgb3BlcmF0b3JzKS5cbiAgLy9cbiAgLy8gYGJpbm9wYCwgd2hlbiBwcmVzZW50LCBzcGVjaWZpZXMgdGhhdCB0aGlzIG9wZXJhdG9yIGlzIGEgYmluYXJ5XG4gIC8vIG9wZXJhdG9yLCBhbmQgd2lsbCByZWZlciB0byBpdHMgcHJlY2VkZW5jZS5cbiAgLy9cbiAgLy8gYHByZWZpeGAgYW5kIGBwb3N0Zml4YCBtYXJrIHRoZSBvcGVyYXRvciBhcyBhIHByZWZpeCBvciBwb3N0Zml4XG4gIC8vIHVuYXJ5IG9wZXJhdG9yLlxuICAvL1xuICAvLyBgaXNBc3NpZ25gIG1hcmtzIGFsbCBvZiBgPWAsIGArPWAsIGAtPWAgZXRjZXRlcmEsIHdoaWNoIGFjdCBhc1xuICAvLyBiaW5hcnkgb3BlcmF0b3JzIHdpdGggYSB2ZXJ5IGxvdyBwcmVjZWRlbmNlLCB0aGF0IHNob3VsZCByZXN1bHRcbiAgLy8gaW4gQXNzaWdubWVudEV4cHJlc3Npb24gbm9kZXMuXG5cbiAgZXE6IG5ldyBUb2tlblR5cGUoXCI9XCIsIHtiZWZvcmVFeHByOiB0cnVlLCBpc0Fzc2lnbjogdHJ1ZX0pLFxuICBhc3NpZ246IG5ldyBUb2tlblR5cGUoXCJfPVwiLCB7YmVmb3JlRXhwcjogdHJ1ZSwgaXNBc3NpZ246IHRydWV9KSxcbiAgaW5jRGVjOiBuZXcgVG9rZW5UeXBlKFwiKysvLS1cIiwge3ByZWZpeDogdHJ1ZSwgcG9zdGZpeDogdHJ1ZSwgc3RhcnRzRXhwcjogdHJ1ZX0pLFxuICBwcmVmaXg6IG5ldyBUb2tlblR5cGUoXCIhL35cIiwge2JlZm9yZUV4cHI6IHRydWUsIHByZWZpeDogdHJ1ZSwgc3RhcnRzRXhwcjogdHJ1ZX0pLFxuICBsb2dpY2FsT1I6IGJpbm9wKFwifHxcIiwgMSksXG4gIGxvZ2ljYWxBTkQ6IGJpbm9wKFwiJiZcIiwgMiksXG4gIGJpdHdpc2VPUjogYmlub3AoXCJ8XCIsIDMpLFxuICBiaXR3aXNlWE9SOiBiaW5vcChcIl5cIiwgNCksXG4gIGJpdHdpc2VBTkQ6IGJpbm9wKFwiJlwiLCA1KSxcbiAgZXF1YWxpdHk6IGJpbm9wKFwiPT0vIT0vPT09LyE9PVwiLCA2KSxcbiAgcmVsYXRpb25hbDogYmlub3AoXCI8Lz4vPD0vPj1cIiwgNyksXG4gIGJpdFNoaWZ0OiBiaW5vcChcIjw8Lz4+Lz4+PlwiLCA4KSxcbiAgcGx1c01pbjogbmV3IFRva2VuVHlwZShcIisvLVwiLCB7YmVmb3JlRXhwcjogdHJ1ZSwgYmlub3A6IDksIHByZWZpeDogdHJ1ZSwgc3RhcnRzRXhwcjogdHJ1ZX0pLFxuICBtb2R1bG86IGJpbm9wKFwiJVwiLCAxMCksXG4gIHN0YXI6IGJpbm9wKFwiKlwiLCAxMCksXG4gIHNsYXNoOiBiaW5vcChcIi9cIiwgMTApLFxuICBzdGFyc3RhcjogbmV3IFRva2VuVHlwZShcIioqXCIsIHtiZWZvcmVFeHByOiB0cnVlfSksXG4gIGNvYWxlc2NlOiBiaW5vcChcIj8/XCIsIDEpLFxuXG4gIC8vIEtleXdvcmQgdG9rZW4gdHlwZXMuXG4gIF9icmVhazoga3coXCJicmVha1wiKSxcbiAgX2Nhc2U6IGt3KFwiY2FzZVwiLCBiZWZvcmVFeHByKSxcbiAgX2NhdGNoOiBrdyhcImNhdGNoXCIpLFxuICBfY29udGludWU6IGt3KFwiY29udGludWVcIiksXG4gIF9kZWJ1Z2dlcjoga3coXCJkZWJ1Z2dlclwiKSxcbiAgX2RlZmF1bHQ6IGt3KFwiZGVmYXVsdFwiLCBiZWZvcmVFeHByKSxcbiAgX2RvOiBrdyhcImRvXCIsIHtpc0xvb3A6IHRydWUsIGJlZm9yZUV4cHI6IHRydWV9KSxcbiAgX2Vsc2U6IGt3KFwiZWxzZVwiLCBiZWZvcmVFeHByKSxcbiAgX2ZpbmFsbHk6IGt3KFwiZmluYWxseVwiKSxcbiAgX2Zvcjoga3coXCJmb3JcIiwge2lzTG9vcDogdHJ1ZX0pLFxuICBfZnVuY3Rpb246IGt3KFwiZnVuY3Rpb25cIiwgc3RhcnRzRXhwciksXG4gIF9pZjoga3coXCJpZlwiKSxcbiAgX3JldHVybjoga3coXCJyZXR1cm5cIiwgYmVmb3JlRXhwciksXG4gIF9zd2l0Y2g6IGt3KFwic3dpdGNoXCIpLFxuICBfdGhyb3c6IGt3KFwidGhyb3dcIiwgYmVmb3JlRXhwciksXG4gIF90cnk6IGt3KFwidHJ5XCIpLFxuICBfdmFyOiBrdyhcInZhclwiKSxcbiAgX2NvbnN0OiBrdyhcImNvbnN0XCIpLFxuICBfd2hpbGU6IGt3KFwid2hpbGVcIiwge2lzTG9vcDogdHJ1ZX0pLFxuICBfd2l0aDoga3coXCJ3aXRoXCIpLFxuICBfbmV3OiBrdyhcIm5ld1wiLCB7YmVmb3JlRXhwcjogdHJ1ZSwgc3RhcnRzRXhwcjogdHJ1ZX0pLFxuICBfdGhpczoga3coXCJ0aGlzXCIsIHN0YXJ0c0V4cHIpLFxuICBfc3VwZXI6IGt3KFwic3VwZXJcIiwgc3RhcnRzRXhwciksXG4gIF9jbGFzczoga3coXCJjbGFzc1wiLCBzdGFydHNFeHByKSxcbiAgX2V4dGVuZHM6IGt3KFwiZXh0ZW5kc1wiLCBiZWZvcmVFeHByKSxcbiAgX2V4cG9ydDoga3coXCJleHBvcnRcIiksXG4gIF9pbXBvcnQ6IGt3KFwiaW1wb3J0XCIsIHN0YXJ0c0V4cHIpLFxuICBfbnVsbDoga3coXCJudWxsXCIsIHN0YXJ0c0V4cHIpLFxuICBfdHJ1ZToga3coXCJ0cnVlXCIsIHN0YXJ0c0V4cHIpLFxuICBfZmFsc2U6IGt3KFwiZmFsc2VcIiwgc3RhcnRzRXhwciksXG4gIF9pbjoga3coXCJpblwiLCB7YmVmb3JlRXhwcjogdHJ1ZSwgYmlub3A6IDd9KSxcbiAgX2luc3RhbmNlb2Y6IGt3KFwiaW5zdGFuY2VvZlwiLCB7YmVmb3JlRXhwcjogdHJ1ZSwgYmlub3A6IDd9KSxcbiAgX3R5cGVvZjoga3coXCJ0eXBlb2ZcIiwge2JlZm9yZUV4cHI6IHRydWUsIHByZWZpeDogdHJ1ZSwgc3RhcnRzRXhwcjogdHJ1ZX0pLFxuICBfdm9pZDoga3coXCJ2b2lkXCIsIHtiZWZvcmVFeHByOiB0cnVlLCBwcmVmaXg6IHRydWUsIHN0YXJ0c0V4cHI6IHRydWV9KSxcbiAgX2RlbGV0ZToga3coXCJkZWxldGVcIiwge2JlZm9yZUV4cHI6IHRydWUsIHByZWZpeDogdHJ1ZSwgc3RhcnRzRXhwcjogdHJ1ZX0pXG59O1xuXG4vLyBNYXRjaGVzIGEgd2hvbGUgbGluZSBicmVhayAod2hlcmUgQ1JMRiBpcyBjb25zaWRlcmVkIGEgc2luZ2xlXG4vLyBsaW5lIGJyZWFrKS4gVXNlZCB0byBjb3VudCBsaW5lcy5cblxudmFyIGxpbmVCcmVhayA9IC9cXHJcXG4/fFxcbnxcXHUyMDI4fFxcdTIwMjkvO1xudmFyIGxpbmVCcmVha0cgPSBuZXcgUmVnRXhwKGxpbmVCcmVhay5zb3VyY2UsIFwiZ1wiKTtcblxuZnVuY3Rpb24gaXNOZXdMaW5lKGNvZGUpIHtcbiAgcmV0dXJuIGNvZGUgPT09IDEwIHx8IGNvZGUgPT09IDEzIHx8IGNvZGUgPT09IDB4MjAyOCB8fCBjb2RlID09PSAweDIwMjlcbn1cblxuZnVuY3Rpb24gbmV4dExpbmVCcmVhayhjb2RlLCBmcm9tLCBlbmQpIHtcbiAgaWYgKCBlbmQgPT09IHZvaWQgMCApIGVuZCA9IGNvZGUubGVuZ3RoO1xuXG4gIGZvciAodmFyIGkgPSBmcm9tOyBpIDwgZW5kOyBpKyspIHtcbiAgICB2YXIgbmV4dCA9IGNvZGUuY2hhckNvZGVBdChpKTtcbiAgICBpZiAoaXNOZXdMaW5lKG5leHQpKVxuICAgICAgeyByZXR1cm4gaSA8IGVuZCAtIDEgJiYgbmV4dCA9PT0gMTMgJiYgY29kZS5jaGFyQ29kZUF0KGkgKyAxKSA9PT0gMTAgPyBpICsgMiA6IGkgKyAxIH1cbiAgfVxuICByZXR1cm4gLTFcbn1cblxudmFyIG5vbkFTQ0lJd2hpdGVzcGFjZSA9IC9bXFx1MTY4MFxcdTIwMDAtXFx1MjAwYVxcdTIwMmZcXHUyMDVmXFx1MzAwMFxcdWZlZmZdLztcblxudmFyIHNraXBXaGl0ZVNwYWNlID0gLyg/Olxcc3xcXC9cXC8uKnxcXC9cXCpbXl0qP1xcKlxcLykqL2c7XG5cbnZhciByZWYgPSBPYmplY3QucHJvdG90eXBlO1xudmFyIGhhc093blByb3BlcnR5ID0gcmVmLmhhc093blByb3BlcnR5O1xudmFyIHRvU3RyaW5nID0gcmVmLnRvU3RyaW5nO1xuXG52YXIgaGFzT3duID0gT2JqZWN0Lmhhc093biB8fCAoZnVuY3Rpb24gKG9iaiwgcHJvcE5hbWUpIHsgcmV0dXJuIChcbiAgaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3BOYW1lKVxuKTsgfSk7XG5cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCAoZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gKFxuICB0b1N0cmluZy5jYWxsKG9iaikgPT09IFwiW29iamVjdCBBcnJheV1cIlxuKTsgfSk7XG5cbnZhciByZWdleHBDYWNoZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbmZ1bmN0aW9uIHdvcmRzUmVnZXhwKHdvcmRzKSB7XG4gIHJldHVybiByZWdleHBDYWNoZVt3b3Jkc10gfHwgKHJlZ2V4cENhY2hlW3dvcmRzXSA9IG5ldyBSZWdFeHAoXCJeKD86XCIgKyB3b3Jkcy5yZXBsYWNlKC8gL2csIFwifFwiKSArIFwiKSRcIikpXG59XG5cbmZ1bmN0aW9uIGNvZGVQb2ludFRvU3RyaW5nKGNvZGUpIHtcbiAgLy8gVVRGLTE2IERlY29kaW5nXG4gIGlmIChjb2RlIDw9IDB4RkZGRikgeyByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKSB9XG4gIGNvZGUgLT0gMHgxMDAwMDtcbiAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoKGNvZGUgPj4gMTApICsgMHhEODAwLCAoY29kZSAmIDEwMjMpICsgMHhEQzAwKVxufVxuXG52YXIgbG9uZVN1cnJvZ2F0ZSA9IC8oPzpbXFx1RDgwMC1cXHVEQkZGXSg/IVtcXHVEQzAwLVxcdURGRkZdKXwoPzpbXlxcdUQ4MDAtXFx1REJGRl18XilbXFx1REMwMC1cXHVERkZGXSkvO1xuXG4vLyBUaGVzZSBhcmUgdXNlZCB3aGVuIGBvcHRpb25zLmxvY2F0aW9uc2AgaXMgb24sIGZvciB0aGVcbi8vIGBzdGFydExvY2AgYW5kIGBlbmRMb2NgIHByb3BlcnRpZXMuXG5cbnZhciBQb3NpdGlvbiA9IGZ1bmN0aW9uIFBvc2l0aW9uKGxpbmUsIGNvbCkge1xuICB0aGlzLmxpbmUgPSBsaW5lO1xuICB0aGlzLmNvbHVtbiA9IGNvbDtcbn07XG5cblBvc2l0aW9uLnByb3RvdHlwZS5vZmZzZXQgPSBmdW5jdGlvbiBvZmZzZXQgKG4pIHtcbiAgcmV0dXJuIG5ldyBQb3NpdGlvbih0aGlzLmxpbmUsIHRoaXMuY29sdW1uICsgbilcbn07XG5cbnZhciBTb3VyY2VMb2NhdGlvbiA9IGZ1bmN0aW9uIFNvdXJjZUxvY2F0aW9uKHAsIHN0YXJ0LCBlbmQpIHtcbiAgdGhpcy5zdGFydCA9IHN0YXJ0O1xuICB0aGlzLmVuZCA9IGVuZDtcbiAgaWYgKHAuc291cmNlRmlsZSAhPT0gbnVsbCkgeyB0aGlzLnNvdXJjZSA9IHAuc291cmNlRmlsZTsgfVxufTtcblxuLy8gVGhlIGBnZXRMaW5lSW5mb2AgZnVuY3Rpb24gaXMgbW9zdGx5IHVzZWZ1bCB3aGVuIHRoZVxuLy8gYGxvY2F0aW9uc2Agb3B0aW9uIGlzIG9mZiAoZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMpIGFuZCB5b3Vcbi8vIHdhbnQgdG8gZmluZCB0aGUgbGluZS9jb2x1bW4gcG9zaXRpb24gZm9yIGEgZ2l2ZW4gY2hhcmFjdGVyXG4vLyBvZmZzZXQuIGBpbnB1dGAgc2hvdWxkIGJlIHRoZSBjb2RlIHN0cmluZyB0aGF0IHRoZSBvZmZzZXQgcmVmZXJzXG4vLyBpbnRvLlxuXG5mdW5jdGlvbiBnZXRMaW5lSW5mbyhpbnB1dCwgb2Zmc2V0KSB7XG4gIGZvciAodmFyIGxpbmUgPSAxLCBjdXIgPSAwOzspIHtcbiAgICB2YXIgbmV4dEJyZWFrID0gbmV4dExpbmVCcmVhayhpbnB1dCwgY3VyLCBvZmZzZXQpO1xuICAgIGlmIChuZXh0QnJlYWsgPCAwKSB7IHJldHVybiBuZXcgUG9zaXRpb24obGluZSwgb2Zmc2V0IC0gY3VyKSB9XG4gICAgKytsaW5lO1xuICAgIGN1ciA9IG5leHRCcmVhaztcbiAgfVxufVxuXG4vLyBBIHNlY29uZCBhcmd1bWVudCBtdXN0IGJlIGdpdmVuIHRvIGNvbmZpZ3VyZSB0aGUgcGFyc2VyIHByb2Nlc3MuXG4vLyBUaGVzZSBvcHRpb25zIGFyZSByZWNvZ25pemVkIChvbmx5IGBlY21hVmVyc2lvbmAgaXMgcmVxdWlyZWQpOlxuXG52YXIgZGVmYXVsdE9wdGlvbnMgPSB7XG4gIC8vIGBlY21hVmVyc2lvbmAgaW5kaWNhdGVzIHRoZSBFQ01BU2NyaXB0IHZlcnNpb24gdG8gcGFyc2UuIE11c3QgYmVcbiAgLy8gZWl0aGVyIDMsIDUsIDYgKG9yIDIwMTUpLCA3ICgyMDE2KSwgOCAoMjAxNyksIDkgKDIwMTgpLCAxMFxuICAvLyAoMjAxOSksIDExICgyMDIwKSwgMTIgKDIwMjEpLCAxMyAoMjAyMiksIDE0ICgyMDIzKSwgb3IgYFwibGF0ZXN0XCJgXG4gIC8vICh0aGUgbGF0ZXN0IHZlcnNpb24gdGhlIGxpYnJhcnkgc3VwcG9ydHMpLiBUaGlzIGluZmx1ZW5jZXNcbiAgLy8gc3VwcG9ydCBmb3Igc3RyaWN0IG1vZGUsIHRoZSBzZXQgb2YgcmVzZXJ2ZWQgd29yZHMsIGFuZCBzdXBwb3J0XG4gIC8vIGZvciBuZXcgc3ludGF4IGZlYXR1cmVzLlxuICBlY21hVmVyc2lvbjogbnVsbCxcbiAgLy8gYHNvdXJjZVR5cGVgIGluZGljYXRlcyB0aGUgbW9kZSB0aGUgY29kZSBzaG91bGQgYmUgcGFyc2VkIGluLlxuICAvLyBDYW4gYmUgZWl0aGVyIGBcInNjcmlwdFwiYCBvciBgXCJtb2R1bGVcImAuIFRoaXMgaW5mbHVlbmNlcyBnbG9iYWxcbiAgLy8gc3RyaWN0IG1vZGUgYW5kIHBhcnNpbmcgb2YgYGltcG9ydGAgYW5kIGBleHBvcnRgIGRlY2xhcmF0aW9ucy5cbiAgc291cmNlVHlwZTogXCJzY3JpcHRcIixcbiAgLy8gYG9uSW5zZXJ0ZWRTZW1pY29sb25gIGNhbiBiZSBhIGNhbGxiYWNrIHRoYXQgd2lsbCBiZSBjYWxsZWQgd2hlblxuICAvLyBhIHNlbWljb2xvbiBpcyBhdXRvbWF0aWNhbGx5IGluc2VydGVkLiBJdCB3aWxsIGJlIHBhc3NlZCB0aGVcbiAgLy8gcG9zaXRpb24gb2YgdGhlIGluc2VydGVkIHNlbWljb2xvbiBhcyBhbiBvZmZzZXQsIGFuZCBpZlxuICAvLyBgbG9jYXRpb25zYCBpcyBlbmFibGVkLCBpdCBpcyBnaXZlbiB0aGUgbG9jYXRpb24gYXMgYSBge2xpbmUsXG4gIC8vIGNvbHVtbn1gIG9iamVjdCBhcyBzZWNvbmQgYXJndW1lbnQuXG4gIG9uSW5zZXJ0ZWRTZW1pY29sb246IG51bGwsXG4gIC8vIGBvblRyYWlsaW5nQ29tbWFgIGlzIHNpbWlsYXIgdG8gYG9uSW5zZXJ0ZWRTZW1pY29sb25gLCBidXQgZm9yXG4gIC8vIHRyYWlsaW5nIGNvbW1hcy5cbiAgb25UcmFpbGluZ0NvbW1hOiBudWxsLFxuICAvLyBCeSBkZWZhdWx0LCByZXNlcnZlZCB3b3JkcyBhcmUgb25seSBlbmZvcmNlZCBpZiBlY21hVmVyc2lvbiA+PSA1LlxuICAvLyBTZXQgYGFsbG93UmVzZXJ2ZWRgIHRvIGEgYm9vbGVhbiB2YWx1ZSB0byBleHBsaWNpdGx5IHR1cm4gdGhpcyBvblxuICAvLyBhbiBvZmYuIFdoZW4gdGhpcyBvcHRpb24gaGFzIHRoZSB2YWx1ZSBcIm5ldmVyXCIsIHJlc2VydmVkIHdvcmRzXG4gIC8vIGFuZCBrZXl3b3JkcyBjYW4gYWxzbyBub3QgYmUgdXNlZCBhcyBwcm9wZXJ0eSBuYW1lcy5cbiAgYWxsb3dSZXNlcnZlZDogbnVsbCxcbiAgLy8gV2hlbiBlbmFibGVkLCBhIHJldHVybiBhdCB0aGUgdG9wIGxldmVsIGlzIG5vdCBjb25zaWRlcmVkIGFuXG4gIC8vIGVycm9yLlxuICBhbGxvd1JldHVybk91dHNpZGVGdW5jdGlvbjogZmFsc2UsXG4gIC8vIFdoZW4gZW5hYmxlZCwgaW1wb3J0L2V4cG9ydCBzdGF0ZW1lbnRzIGFyZSBub3QgY29uc3RyYWluZWQgdG9cbiAgLy8gYXBwZWFyaW5nIGF0IHRoZSB0b3Agb2YgdGhlIHByb2dyYW0sIGFuZCBhbiBpbXBvcnQubWV0YSBleHByZXNzaW9uXG4gIC8vIGluIGEgc2NyaXB0IGlzbid0IGNvbnNpZGVyZWQgYW4gZXJyb3IuXG4gIGFsbG93SW1wb3J0RXhwb3J0RXZlcnl3aGVyZTogZmFsc2UsXG4gIC8vIEJ5IGRlZmF1bHQsIGF3YWl0IGlkZW50aWZpZXJzIGFyZSBhbGxvd2VkIHRvIGFwcGVhciBhdCB0aGUgdG9wLWxldmVsIHNjb3BlIG9ubHkgaWYgZWNtYVZlcnNpb24gPj0gMjAyMi5cbiAgLy8gV2hlbiBlbmFibGVkLCBhd2FpdCBpZGVudGlmaWVycyBhcmUgYWxsb3dlZCB0byBhcHBlYXIgYXQgdGhlIHRvcC1sZXZlbCBzY29wZSxcbiAgLy8gYnV0IHRoZXkgYXJlIHN0aWxsIG5vdCBhbGxvd2VkIGluIG5vbi1hc3luYyBmdW5jdGlvbnMuXG4gIGFsbG93QXdhaXRPdXRzaWRlRnVuY3Rpb246IG51bGwsXG4gIC8vIFdoZW4gZW5hYmxlZCwgc3VwZXIgaWRlbnRpZmllcnMgYXJlIG5vdCBjb25zdHJhaW5lZCB0b1xuICAvLyBhcHBlYXJpbmcgaW4gbWV0aG9kcyBhbmQgZG8gbm90IHJhaXNlIGFuIGVycm9yIHdoZW4gdGhleSBhcHBlYXIgZWxzZXdoZXJlLlxuICBhbGxvd1N1cGVyT3V0c2lkZU1ldGhvZDogbnVsbCxcbiAgLy8gV2hlbiBlbmFibGVkLCBoYXNoYmFuZyBkaXJlY3RpdmUgaW4gdGhlIGJlZ2lubmluZyBvZiBmaWxlIGlzXG4gIC8vIGFsbG93ZWQgYW5kIHRyZWF0ZWQgYXMgYSBsaW5lIGNvbW1lbnQuIEVuYWJsZWQgYnkgZGVmYXVsdCB3aGVuXG4gIC8vIGBlY21hVmVyc2lvbmAgPj0gMjAyMy5cbiAgYWxsb3dIYXNoQmFuZzogZmFsc2UsXG4gIC8vIEJ5IGRlZmF1bHQsIHRoZSBwYXJzZXIgd2lsbCB2ZXJpZnkgdGhhdCBwcml2YXRlIHByb3BlcnRpZXMgYXJlXG4gIC8vIG9ubHkgdXNlZCBpbiBwbGFjZXMgd2hlcmUgdGhleSBhcmUgdmFsaWQgYW5kIGhhdmUgYmVlbiBkZWNsYXJlZC5cbiAgLy8gU2V0IHRoaXMgdG8gZmFsc2UgdG8gdHVybiBzdWNoIGNoZWNrcyBvZmYuXG4gIGNoZWNrUHJpdmF0ZUZpZWxkczogdHJ1ZSxcbiAgLy8gV2hlbiBgbG9jYXRpb25zYCBpcyBvbiwgYGxvY2AgcHJvcGVydGllcyBob2xkaW5nIG9iamVjdHMgd2l0aFxuICAvLyBgc3RhcnRgIGFuZCBgZW5kYCBwcm9wZXJ0aWVzIGluIGB7bGluZSwgY29sdW1ufWAgZm9ybSAod2l0aFxuICAvLyBsaW5lIGJlaW5nIDEtYmFzZWQgYW5kIGNvbHVtbiAwLWJhc2VkKSB3aWxsIGJlIGF0dGFjaGVkIHRvIHRoZVxuICAvLyBub2Rlcy5cbiAgbG9jYXRpb25zOiBmYWxzZSxcbiAgLy8gQSBmdW5jdGlvbiBjYW4gYmUgcGFzc2VkIGFzIGBvblRva2VuYCBvcHRpb24sIHdoaWNoIHdpbGxcbiAgLy8gY2F1c2UgQWNvcm4gdG8gY2FsbCB0aGF0IGZ1bmN0aW9uIHdpdGggb2JqZWN0IGluIHRoZSBzYW1lXG4gIC8vIGZvcm1hdCBhcyB0b2tlbnMgcmV0dXJuZWQgZnJvbSBgdG9rZW5pemVyKCkuZ2V0VG9rZW4oKWAuIE5vdGVcbiAgLy8gdGhhdCB5b3UgYXJlIG5vdCBhbGxvd2VkIHRvIGNhbGwgdGhlIHBhcnNlciBmcm9tIHRoZVxuICAvLyBjYWxsYmFja1x1MjAxNHRoYXQgd2lsbCBjb3JydXB0IGl0cyBpbnRlcm5hbCBzdGF0ZS5cbiAgb25Ub2tlbjogbnVsbCxcbiAgLy8gQSBmdW5jdGlvbiBjYW4gYmUgcGFzc2VkIGFzIGBvbkNvbW1lbnRgIG9wdGlvbiwgd2hpY2ggd2lsbFxuICAvLyBjYXVzZSBBY29ybiB0byBjYWxsIHRoYXQgZnVuY3Rpb24gd2l0aCBgKGJsb2NrLCB0ZXh0LCBzdGFydCxcbiAgLy8gZW5kKWAgcGFyYW1ldGVycyB3aGVuZXZlciBhIGNvbW1lbnQgaXMgc2tpcHBlZC4gYGJsb2NrYCBpcyBhXG4gIC8vIGJvb2xlYW4gaW5kaWNhdGluZyB3aGV0aGVyIHRoaXMgaXMgYSBibG9jayAoYC8qICovYCkgY29tbWVudCxcbiAgLy8gYHRleHRgIGlzIHRoZSBjb250ZW50IG9mIHRoZSBjb21tZW50LCBhbmQgYHN0YXJ0YCBhbmQgYGVuZGAgYXJlXG4gIC8vIGNoYXJhY3RlciBvZmZzZXRzIHRoYXQgZGVub3RlIHRoZSBzdGFydCBhbmQgZW5kIG9mIHRoZSBjb21tZW50LlxuICAvLyBXaGVuIHRoZSBgbG9jYXRpb25zYCBvcHRpb24gaXMgb24sIHR3byBtb3JlIHBhcmFtZXRlcnMgYXJlXG4gIC8vIHBhc3NlZCwgdGhlIGZ1bGwgYHtsaW5lLCBjb2x1bW59YCBsb2NhdGlvbnMgb2YgdGhlIHN0YXJ0IGFuZFxuICAvLyBlbmQgb2YgdGhlIGNvbW1lbnRzLiBOb3RlIHRoYXQgeW91IGFyZSBub3QgYWxsb3dlZCB0byBjYWxsIHRoZVxuICAvLyBwYXJzZXIgZnJvbSB0aGUgY2FsbGJhY2tcdTIwMTR0aGF0IHdpbGwgY29ycnVwdCBpdHMgaW50ZXJuYWwgc3RhdGUuXG4gIC8vIFdoZW4gdGhpcyBvcHRpb24gaGFzIGFuIGFycmF5IGFzIHZhbHVlLCBvYmplY3RzIHJlcHJlc2VudGluZyB0aGVcbiAgLy8gY29tbWVudHMgYXJlIHB1c2hlZCB0byBpdC5cbiAgb25Db21tZW50OiBudWxsLFxuICAvLyBOb2RlcyBoYXZlIHRoZWlyIHN0YXJ0IGFuZCBlbmQgY2hhcmFjdGVycyBvZmZzZXRzIHJlY29yZGVkIGluXG4gIC8vIGBzdGFydGAgYW5kIGBlbmRgIHByb3BlcnRpZXMgKGRpcmVjdGx5IG9uIHRoZSBub2RlLCByYXRoZXIgdGhhblxuICAvLyB0aGUgYGxvY2Agb2JqZWN0LCB3aGljaCBob2xkcyBsaW5lL2NvbHVtbiBkYXRhLiBUbyBhbHNvIGFkZCBhXG4gIC8vIFtzZW1pLXN0YW5kYXJkaXplZF1bcmFuZ2VdIGByYW5nZWAgcHJvcGVydHkgaG9sZGluZyBhIGBbc3RhcnQsXG4gIC8vIGVuZF1gIGFycmF5IHdpdGggdGhlIHNhbWUgbnVtYmVycywgc2V0IHRoZSBgcmFuZ2VzYCBvcHRpb24gdG9cbiAgLy8gYHRydWVgLlxuICAvL1xuICAvLyBbcmFuZ2VdOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD03NDU2NzhcbiAgcmFuZ2VzOiBmYWxzZSxcbiAgLy8gSXQgaXMgcG9zc2libGUgdG8gcGFyc2UgbXVsdGlwbGUgZmlsZXMgaW50byBhIHNpbmdsZSBBU1QgYnlcbiAgLy8gcGFzc2luZyB0aGUgdHJlZSBwcm9kdWNlZCBieSBwYXJzaW5nIHRoZSBmaXJzdCBmaWxlIGFzXG4gIC8vIGBwcm9ncmFtYCBvcHRpb24gaW4gc3Vic2VxdWVudCBwYXJzZXMuIFRoaXMgd2lsbCBhZGQgdGhlXG4gIC8vIHRvcGxldmVsIGZvcm1zIG9mIHRoZSBwYXJzZWQgZmlsZSB0byB0aGUgYFByb2dyYW1gICh0b3ApIG5vZGVcbiAgLy8gb2YgYW4gZXhpc3RpbmcgcGFyc2UgdHJlZS5cbiAgcHJvZ3JhbTogbnVsbCxcbiAgLy8gV2hlbiBgbG9jYXRpb25zYCBpcyBvbiwgeW91IGNhbiBwYXNzIHRoaXMgdG8gcmVjb3JkIHRoZSBzb3VyY2VcbiAgLy8gZmlsZSBpbiBldmVyeSBub2RlJ3MgYGxvY2Agb2JqZWN0LlxuICBzb3VyY2VGaWxlOiBudWxsLFxuICAvLyBUaGlzIHZhbHVlLCBpZiBnaXZlbiwgaXMgc3RvcmVkIGluIGV2ZXJ5IG5vZGUsIHdoZXRoZXJcbiAgLy8gYGxvY2F0aW9uc2AgaXMgb24gb3Igb2ZmLlxuICBkaXJlY3RTb3VyY2VGaWxlOiBudWxsLFxuICAvLyBXaGVuIGVuYWJsZWQsIHBhcmVudGhlc2l6ZWQgZXhwcmVzc2lvbnMgYXJlIHJlcHJlc2VudGVkIGJ5XG4gIC8vIChub24tc3RhbmRhcmQpIFBhcmVudGhlc2l6ZWRFeHByZXNzaW9uIG5vZGVzXG4gIHByZXNlcnZlUGFyZW5zOiBmYWxzZVxufTtcblxuLy8gSW50ZXJwcmV0IGFuZCBkZWZhdWx0IGFuIG9wdGlvbnMgb2JqZWN0XG5cbnZhciB3YXJuZWRBYm91dEVjbWFWZXJzaW9uID0gZmFsc2U7XG5cbmZ1bmN0aW9uIGdldE9wdGlvbnMob3B0cykge1xuICB2YXIgb3B0aW9ucyA9IHt9O1xuXG4gIGZvciAodmFyIG9wdCBpbiBkZWZhdWx0T3B0aW9ucylcbiAgICB7IG9wdGlvbnNbb3B0XSA9IG9wdHMgJiYgaGFzT3duKG9wdHMsIG9wdCkgPyBvcHRzW29wdF0gOiBkZWZhdWx0T3B0aW9uc1tvcHRdOyB9XG5cbiAgaWYgKG9wdGlvbnMuZWNtYVZlcnNpb24gPT09IFwibGF0ZXN0XCIpIHtcbiAgICBvcHRpb25zLmVjbWFWZXJzaW9uID0gMWU4O1xuICB9IGVsc2UgaWYgKG9wdGlvbnMuZWNtYVZlcnNpb24gPT0gbnVsbCkge1xuICAgIGlmICghd2FybmVkQWJvdXRFY21hVmVyc2lvbiAmJiB0eXBlb2YgY29uc29sZSA9PT0gXCJvYmplY3RcIiAmJiBjb25zb2xlLndhcm4pIHtcbiAgICAgIHdhcm5lZEFib3V0RWNtYVZlcnNpb24gPSB0cnVlO1xuICAgICAgY29uc29sZS53YXJuKFwiU2luY2UgQWNvcm4gOC4wLjAsIG9wdGlvbnMuZWNtYVZlcnNpb24gaXMgcmVxdWlyZWQuXFxuRGVmYXVsdGluZyB0byAyMDIwLCBidXQgdGhpcyB3aWxsIHN0b3Agd29ya2luZyBpbiB0aGUgZnV0dXJlLlwiKTtcbiAgICB9XG4gICAgb3B0aW9ucy5lY21hVmVyc2lvbiA9IDExO1xuICB9IGVsc2UgaWYgKG9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMjAxNSkge1xuICAgIG9wdGlvbnMuZWNtYVZlcnNpb24gLT0gMjAwOTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLmFsbG93UmVzZXJ2ZWQgPT0gbnVsbClcbiAgICB7IG9wdGlvbnMuYWxsb3dSZXNlcnZlZCA9IG9wdGlvbnMuZWNtYVZlcnNpb24gPCA1OyB9XG5cbiAgaWYgKCFvcHRzIHx8IG9wdHMuYWxsb3dIYXNoQmFuZyA9PSBudWxsKVxuICAgIHsgb3B0aW9ucy5hbGxvd0hhc2hCYW5nID0gb3B0aW9ucy5lY21hVmVyc2lvbiA+PSAxNDsgfVxuXG4gIGlmIChpc0FycmF5KG9wdGlvbnMub25Ub2tlbikpIHtcbiAgICB2YXIgdG9rZW5zID0gb3B0aW9ucy5vblRva2VuO1xuICAgIG9wdGlvbnMub25Ub2tlbiA9IGZ1bmN0aW9uICh0b2tlbikgeyByZXR1cm4gdG9rZW5zLnB1c2godG9rZW4pOyB9O1xuICB9XG4gIGlmIChpc0FycmF5KG9wdGlvbnMub25Db21tZW50KSlcbiAgICB7IG9wdGlvbnMub25Db21tZW50ID0gcHVzaENvbW1lbnQob3B0aW9ucywgb3B0aW9ucy5vbkNvbW1lbnQpOyB9XG5cbiAgcmV0dXJuIG9wdGlvbnNcbn1cblxuZnVuY3Rpb24gcHVzaENvbW1lbnQob3B0aW9ucywgYXJyYXkpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGJsb2NrLCB0ZXh0LCBzdGFydCwgZW5kLCBzdGFydExvYywgZW5kTG9jKSB7XG4gICAgdmFyIGNvbW1lbnQgPSB7XG4gICAgICB0eXBlOiBibG9jayA/IFwiQmxvY2tcIiA6IFwiTGluZVwiLFxuICAgICAgdmFsdWU6IHRleHQsXG4gICAgICBzdGFydDogc3RhcnQsXG4gICAgICBlbmQ6IGVuZFxuICAgIH07XG4gICAgaWYgKG9wdGlvbnMubG9jYXRpb25zKVxuICAgICAgeyBjb21tZW50LmxvYyA9IG5ldyBTb3VyY2VMb2NhdGlvbih0aGlzLCBzdGFydExvYywgZW5kTG9jKTsgfVxuICAgIGlmIChvcHRpb25zLnJhbmdlcylcbiAgICAgIHsgY29tbWVudC5yYW5nZSA9IFtzdGFydCwgZW5kXTsgfVxuICAgIGFycmF5LnB1c2goY29tbWVudCk7XG4gIH1cbn1cblxuLy8gRWFjaCBzY29wZSBnZXRzIGEgYml0c2V0IHRoYXQgbWF5IGNvbnRhaW4gdGhlc2UgZmxhZ3NcbnZhclxuICAgIFNDT1BFX1RPUCA9IDEsXG4gICAgU0NPUEVfRlVOQ1RJT04gPSAyLFxuICAgIFNDT1BFX0FTWU5DID0gNCxcbiAgICBTQ09QRV9HRU5FUkFUT1IgPSA4LFxuICAgIFNDT1BFX0FSUk9XID0gMTYsXG4gICAgU0NPUEVfU0lNUExFX0NBVENIID0gMzIsXG4gICAgU0NPUEVfU1VQRVIgPSA2NCxcbiAgICBTQ09QRV9ESVJFQ1RfU1VQRVIgPSAxMjgsXG4gICAgU0NPUEVfQ0xBU1NfU1RBVElDX0JMT0NLID0gMjU2LFxuICAgIFNDT1BFX0NMQVNTX0ZJRUxEX0lOSVQgPSA1MTIsXG4gICAgU0NPUEVfVkFSID0gU0NPUEVfVE9QIHwgU0NPUEVfRlVOQ1RJT04gfCBTQ09QRV9DTEFTU19TVEFUSUNfQkxPQ0s7XG5cbmZ1bmN0aW9uIGZ1bmN0aW9uRmxhZ3MoYXN5bmMsIGdlbmVyYXRvcikge1xuICByZXR1cm4gU0NPUEVfRlVOQ1RJT04gfCAoYXN5bmMgPyBTQ09QRV9BU1lOQyA6IDApIHwgKGdlbmVyYXRvciA/IFNDT1BFX0dFTkVSQVRPUiA6IDApXG59XG5cbi8vIFVzZWQgaW4gY2hlY2tMVmFsKiBhbmQgZGVjbGFyZU5hbWUgdG8gZGV0ZXJtaW5lIHRoZSB0eXBlIG9mIGEgYmluZGluZ1xudmFyXG4gICAgQklORF9OT05FID0gMCwgLy8gTm90IGEgYmluZGluZ1xuICAgIEJJTkRfVkFSID0gMSwgLy8gVmFyLXN0eWxlIGJpbmRpbmdcbiAgICBCSU5EX0xFWElDQUwgPSAyLCAvLyBMZXQtIG9yIGNvbnN0LXN0eWxlIGJpbmRpbmdcbiAgICBCSU5EX0ZVTkNUSU9OID0gMywgLy8gRnVuY3Rpb24gZGVjbGFyYXRpb25cbiAgICBCSU5EX1NJTVBMRV9DQVRDSCA9IDQsIC8vIFNpbXBsZSAoaWRlbnRpZmllciBwYXR0ZXJuKSBjYXRjaCBiaW5kaW5nXG4gICAgQklORF9PVVRTSURFID0gNTsgLy8gU3BlY2lhbCBjYXNlIGZvciBmdW5jdGlvbiBuYW1lcyBhcyBib3VuZCBpbnNpZGUgdGhlIGZ1bmN0aW9uXG5cbnZhciBQYXJzZXIgPSBmdW5jdGlvbiBQYXJzZXIob3B0aW9ucywgaW5wdXQsIHN0YXJ0UG9zKSB7XG4gIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgPSBnZXRPcHRpb25zKG9wdGlvbnMpO1xuICB0aGlzLnNvdXJjZUZpbGUgPSBvcHRpb25zLnNvdXJjZUZpbGU7XG4gIHRoaXMua2V5d29yZHMgPSB3b3Jkc1JlZ2V4cChrZXl3b3JkcyQxW29wdGlvbnMuZWNtYVZlcnNpb24gPj0gNiA/IDYgOiBvcHRpb25zLnNvdXJjZVR5cGUgPT09IFwibW9kdWxlXCIgPyBcIjVtb2R1bGVcIiA6IDVdKTtcbiAgdmFyIHJlc2VydmVkID0gXCJcIjtcbiAgaWYgKG9wdGlvbnMuYWxsb3dSZXNlcnZlZCAhPT0gdHJ1ZSkge1xuICAgIHJlc2VydmVkID0gcmVzZXJ2ZWRXb3Jkc1tvcHRpb25zLmVjbWFWZXJzaW9uID49IDYgPyA2IDogb3B0aW9ucy5lY21hVmVyc2lvbiA9PT0gNSA/IDUgOiAzXTtcbiAgICBpZiAob3B0aW9ucy5zb3VyY2VUeXBlID09PSBcIm1vZHVsZVwiKSB7IHJlc2VydmVkICs9IFwiIGF3YWl0XCI7IH1cbiAgfVxuICB0aGlzLnJlc2VydmVkV29yZHMgPSB3b3Jkc1JlZ2V4cChyZXNlcnZlZCk7XG4gIHZhciByZXNlcnZlZFN0cmljdCA9IChyZXNlcnZlZCA/IHJlc2VydmVkICsgXCIgXCIgOiBcIlwiKSArIHJlc2VydmVkV29yZHMuc3RyaWN0O1xuICB0aGlzLnJlc2VydmVkV29yZHNTdHJpY3QgPSB3b3Jkc1JlZ2V4cChyZXNlcnZlZFN0cmljdCk7XG4gIHRoaXMucmVzZXJ2ZWRXb3Jkc1N0cmljdEJpbmQgPSB3b3Jkc1JlZ2V4cChyZXNlcnZlZFN0cmljdCArIFwiIFwiICsgcmVzZXJ2ZWRXb3Jkcy5zdHJpY3RCaW5kKTtcbiAgdGhpcy5pbnB1dCA9IFN0cmluZyhpbnB1dCk7XG5cbiAgLy8gVXNlZCB0byBzaWduYWwgdG8gY2FsbGVycyBvZiBgcmVhZFdvcmQxYCB3aGV0aGVyIHRoZSB3b3JkXG4gIC8vIGNvbnRhaW5lZCBhbnkgZXNjYXBlIHNlcXVlbmNlcy4gVGhpcyBpcyBuZWVkZWQgYmVjYXVzZSB3b3JkcyB3aXRoXG4gIC8vIGVzY2FwZSBzZXF1ZW5jZXMgbXVzdCBub3QgYmUgaW50ZXJwcmV0ZWQgYXMga2V5d29yZHMuXG4gIHRoaXMuY29udGFpbnNFc2MgPSBmYWxzZTtcblxuICAvLyBTZXQgdXAgdG9rZW4gc3RhdGVcblxuICAvLyBUaGUgY3VycmVudCBwb3NpdGlvbiBvZiB0aGUgdG9rZW5pemVyIGluIHRoZSBpbnB1dC5cbiAgaWYgKHN0YXJ0UG9zKSB7XG4gICAgdGhpcy5wb3MgPSBzdGFydFBvcztcbiAgICB0aGlzLmxpbmVTdGFydCA9IHRoaXMuaW5wdXQubGFzdEluZGV4T2YoXCJcXG5cIiwgc3RhcnRQb3MgLSAxKSArIDE7XG4gICAgdGhpcy5jdXJMaW5lID0gdGhpcy5pbnB1dC5zbGljZSgwLCB0aGlzLmxpbmVTdGFydCkuc3BsaXQobGluZUJyZWFrKS5sZW5ndGg7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5wb3MgPSB0aGlzLmxpbmVTdGFydCA9IDA7XG4gICAgdGhpcy5jdXJMaW5lID0gMTtcbiAgfVxuXG4gIC8vIFByb3BlcnRpZXMgb2YgdGhlIGN1cnJlbnQgdG9rZW46XG4gIC8vIEl0cyB0eXBlXG4gIHRoaXMudHlwZSA9IHR5cGVzJDEuZW9mO1xuICAvLyBGb3IgdG9rZW5zIHRoYXQgaW5jbHVkZSBtb3JlIGluZm9ybWF0aW9uIHRoYW4gdGhlaXIgdHlwZSwgdGhlIHZhbHVlXG4gIHRoaXMudmFsdWUgPSBudWxsO1xuICAvLyBJdHMgc3RhcnQgYW5kIGVuZCBvZmZzZXRcbiAgdGhpcy5zdGFydCA9IHRoaXMuZW5kID0gdGhpcy5wb3M7XG4gIC8vIEFuZCwgaWYgbG9jYXRpb25zIGFyZSB1c2VkLCB0aGUge2xpbmUsIGNvbHVtbn0gb2JqZWN0XG4gIC8vIGNvcnJlc3BvbmRpbmcgdG8gdGhvc2Ugb2Zmc2V0c1xuICB0aGlzLnN0YXJ0TG9jID0gdGhpcy5lbmRMb2MgPSB0aGlzLmN1clBvc2l0aW9uKCk7XG5cbiAgLy8gUG9zaXRpb24gaW5mb3JtYXRpb24gZm9yIHRoZSBwcmV2aW91cyB0b2tlblxuICB0aGlzLmxhc3RUb2tFbmRMb2MgPSB0aGlzLmxhc3RUb2tTdGFydExvYyA9IG51bGw7XG4gIHRoaXMubGFzdFRva1N0YXJ0ID0gdGhpcy5sYXN0VG9rRW5kID0gdGhpcy5wb3M7XG5cbiAgLy8gVGhlIGNvbnRleHQgc3RhY2sgaXMgdXNlZCB0byBzdXBlcmZpY2lhbGx5IHRyYWNrIHN5bnRhY3RpY1xuICAvLyBjb250ZXh0IHRvIHByZWRpY3Qgd2hldGhlciBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBpcyBhbGxvd2VkIGluIGFcbiAgLy8gZ2l2ZW4gcG9zaXRpb24uXG4gIHRoaXMuY29udGV4dCA9IHRoaXMuaW5pdGlhbENvbnRleHQoKTtcbiAgdGhpcy5leHByQWxsb3dlZCA9IHRydWU7XG5cbiAgLy8gRmlndXJlIG91dCBpZiBpdCdzIGEgbW9kdWxlIGNvZGUuXG4gIHRoaXMuaW5Nb2R1bGUgPSBvcHRpb25zLnNvdXJjZVR5cGUgPT09IFwibW9kdWxlXCI7XG4gIHRoaXMuc3RyaWN0ID0gdGhpcy5pbk1vZHVsZSB8fCB0aGlzLnN0cmljdERpcmVjdGl2ZSh0aGlzLnBvcyk7XG5cbiAgLy8gVXNlZCB0byBzaWduaWZ5IHRoZSBzdGFydCBvZiBhIHBvdGVudGlhbCBhcnJvdyBmdW5jdGlvblxuICB0aGlzLnBvdGVudGlhbEFycm93QXQgPSAtMTtcbiAgdGhpcy5wb3RlbnRpYWxBcnJvd0luRm9yQXdhaXQgPSBmYWxzZTtcblxuICAvLyBQb3NpdGlvbnMgdG8gZGVsYXllZC1jaGVjayB0aGF0IHlpZWxkL2F3YWl0IGRvZXMgbm90IGV4aXN0IGluIGRlZmF1bHQgcGFyYW1ldGVycy5cbiAgdGhpcy55aWVsZFBvcyA9IHRoaXMuYXdhaXRQb3MgPSB0aGlzLmF3YWl0SWRlbnRQb3MgPSAwO1xuICAvLyBMYWJlbHMgaW4gc2NvcGUuXG4gIHRoaXMubGFiZWxzID0gW107XG4gIC8vIFRodXMtZmFyIHVuZGVmaW5lZCBleHBvcnRzLlxuICB0aGlzLnVuZGVmaW5lZEV4cG9ydHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gIC8vIElmIGVuYWJsZWQsIHNraXAgbGVhZGluZyBoYXNoYmFuZyBsaW5lLlxuICBpZiAodGhpcy5wb3MgPT09IDAgJiYgb3B0aW9ucy5hbGxvd0hhc2hCYW5nICYmIHRoaXMuaW5wdXQuc2xpY2UoMCwgMikgPT09IFwiIyFcIilcbiAgICB7IHRoaXMuc2tpcExpbmVDb21tZW50KDIpOyB9XG5cbiAgLy8gU2NvcGUgdHJhY2tpbmcgZm9yIGR1cGxpY2F0ZSB2YXJpYWJsZSBuYW1lcyAoc2VlIHNjb3BlLmpzKVxuICB0aGlzLnNjb3BlU3RhY2sgPSBbXTtcbiAgdGhpcy5lbnRlclNjb3BlKFNDT1BFX1RPUCk7XG5cbiAgLy8gRm9yIFJlZ0V4cCB2YWxpZGF0aW9uXG4gIHRoaXMucmVnZXhwU3RhdGUgPSBudWxsO1xuXG4gIC8vIFRoZSBzdGFjayBvZiBwcml2YXRlIG5hbWVzLlxuICAvLyBFYWNoIGVsZW1lbnQgaGFzIHR3byBwcm9wZXJ0aWVzOiAnZGVjbGFyZWQnIGFuZCAndXNlZCcuXG4gIC8vIFdoZW4gaXQgZXhpdGVkIGZyb20gdGhlIG91dGVybW9zdCBjbGFzcyBkZWZpbml0aW9uLCBhbGwgdXNlZCBwcml2YXRlIG5hbWVzIG11c3QgYmUgZGVjbGFyZWQuXG4gIHRoaXMucHJpdmF0ZU5hbWVTdGFjayA9IFtdO1xufTtcblxudmFyIHByb3RvdHlwZUFjY2Vzc29ycyA9IHsgaW5GdW5jdGlvbjogeyBjb25maWd1cmFibGU6IHRydWUgfSxpbkdlbmVyYXRvcjogeyBjb25maWd1cmFibGU6IHRydWUgfSxpbkFzeW5jOiB7IGNvbmZpZ3VyYWJsZTogdHJ1ZSB9LGNhbkF3YWl0OiB7IGNvbmZpZ3VyYWJsZTogdHJ1ZSB9LGFsbG93U3VwZXI6IHsgY29uZmlndXJhYmxlOiB0cnVlIH0sYWxsb3dEaXJlY3RTdXBlcjogeyBjb25maWd1cmFibGU6IHRydWUgfSx0cmVhdEZ1bmN0aW9uc0FzVmFyOiB7IGNvbmZpZ3VyYWJsZTogdHJ1ZSB9LGFsbG93TmV3RG90VGFyZ2V0OiB7IGNvbmZpZ3VyYWJsZTogdHJ1ZSB9LGluQ2xhc3NTdGF0aWNCbG9jazogeyBjb25maWd1cmFibGU6IHRydWUgfSB9O1xuXG5QYXJzZXIucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24gcGFyc2UgKCkge1xuICB2YXIgbm9kZSA9IHRoaXMub3B0aW9ucy5wcm9ncmFtIHx8IHRoaXMuc3RhcnROb2RlKCk7XG4gIHRoaXMubmV4dFRva2VuKCk7XG4gIHJldHVybiB0aGlzLnBhcnNlVG9wTGV2ZWwobm9kZSlcbn07XG5cbnByb3RvdHlwZUFjY2Vzc29ycy5pbkZ1bmN0aW9uLmdldCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICh0aGlzLmN1cnJlbnRWYXJTY29wZSgpLmZsYWdzICYgU0NPUEVfRlVOQ1RJT04pID4gMCB9O1xuXG5wcm90b3R5cGVBY2Nlc3NvcnMuaW5HZW5lcmF0b3IuZ2V0ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gKHRoaXMuY3VycmVudFZhclNjb3BlKCkuZmxhZ3MgJiBTQ09QRV9HRU5FUkFUT1IpID4gMCB9O1xuXG5wcm90b3R5cGVBY2Nlc3NvcnMuaW5Bc3luYy5nZXQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAodGhpcy5jdXJyZW50VmFyU2NvcGUoKS5mbGFncyAmIFNDT1BFX0FTWU5DKSA+IDAgfTtcblxucHJvdG90eXBlQWNjZXNzb3JzLmNhbkF3YWl0LmdldCA9IGZ1bmN0aW9uICgpIHtcbiAgZm9yICh2YXIgaSA9IHRoaXMuc2NvcGVTdGFjay5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIHZhciByZWYgPSB0aGlzLnNjb3BlU3RhY2tbaV07XG4gICAgICB2YXIgZmxhZ3MgPSByZWYuZmxhZ3M7XG4gICAgaWYgKGZsYWdzICYgKFNDT1BFX0NMQVNTX1NUQVRJQ19CTE9DSyB8IFNDT1BFX0NMQVNTX0ZJRUxEX0lOSVQpKSB7IHJldHVybiBmYWxzZSB9XG4gICAgaWYgKGZsYWdzICYgU0NPUEVfRlVOQ1RJT04pIHsgcmV0dXJuIChmbGFncyAmIFNDT1BFX0FTWU5DKSA+IDAgfVxuICB9XG4gIHJldHVybiAodGhpcy5pbk1vZHVsZSAmJiB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTMpIHx8IHRoaXMub3B0aW9ucy5hbGxvd0F3YWl0T3V0c2lkZUZ1bmN0aW9uXG59O1xuXG5wcm90b3R5cGVBY2Nlc3NvcnMuYWxsb3dTdXBlci5nZXQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciByZWYgPSB0aGlzLmN1cnJlbnRUaGlzU2NvcGUoKTtcbiAgICB2YXIgZmxhZ3MgPSByZWYuZmxhZ3M7XG4gIHJldHVybiAoZmxhZ3MgJiBTQ09QRV9TVVBFUikgPiAwIHx8IHRoaXMub3B0aW9ucy5hbGxvd1N1cGVyT3V0c2lkZU1ldGhvZFxufTtcblxucHJvdG90eXBlQWNjZXNzb3JzLmFsbG93RGlyZWN0U3VwZXIuZ2V0ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gKHRoaXMuY3VycmVudFRoaXNTY29wZSgpLmZsYWdzICYgU0NPUEVfRElSRUNUX1NVUEVSKSA+IDAgfTtcblxucHJvdG90eXBlQWNjZXNzb3JzLnRyZWF0RnVuY3Rpb25zQXNWYXIuZ2V0ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy50cmVhdEZ1bmN0aW9uc0FzVmFySW5TY29wZSh0aGlzLmN1cnJlbnRTY29wZSgpKSB9O1xuXG5wcm90b3R5cGVBY2Nlc3NvcnMuYWxsb3dOZXdEb3RUYXJnZXQuZ2V0ID0gZnVuY3Rpb24gKCkge1xuICBmb3IgKHZhciBpID0gdGhpcy5zY29wZVN0YWNrLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgdmFyIHJlZiA9IHRoaXMuc2NvcGVTdGFja1tpXTtcbiAgICAgIHZhciBmbGFncyA9IHJlZi5mbGFncztcbiAgICBpZiAoZmxhZ3MgJiAoU0NPUEVfQ0xBU1NfU1RBVElDX0JMT0NLIHwgU0NPUEVfQ0xBU1NfRklFTERfSU5JVCkgfHxcbiAgICAgICAgKChmbGFncyAmIFNDT1BFX0ZVTkNUSU9OKSAmJiAhKGZsYWdzICYgU0NPUEVfQVJST1cpKSkgeyByZXR1cm4gdHJ1ZSB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG5wcm90b3R5cGVBY2Nlc3NvcnMuaW5DbGFzc1N0YXRpY0Jsb2NrLmdldCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuICh0aGlzLmN1cnJlbnRWYXJTY29wZSgpLmZsYWdzICYgU0NPUEVfQ0xBU1NfU1RBVElDX0JMT0NLKSA+IDBcbn07XG5cblBhcnNlci5leHRlbmQgPSBmdW5jdGlvbiBleHRlbmQgKCkge1xuICAgIHZhciBwbHVnaW5zID0gW10sIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgd2hpbGUgKCBsZW4tLSApIHBsdWdpbnNbIGxlbiBdID0gYXJndW1lbnRzWyBsZW4gXTtcblxuICB2YXIgY2xzID0gdGhpcztcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBwbHVnaW5zLmxlbmd0aDsgaSsrKSB7IGNscyA9IHBsdWdpbnNbaV0oY2xzKTsgfVxuICByZXR1cm4gY2xzXG59O1xuXG5QYXJzZXIucGFyc2UgPSBmdW5jdGlvbiBwYXJzZSAoaW5wdXQsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIG5ldyB0aGlzKG9wdGlvbnMsIGlucHV0KS5wYXJzZSgpXG59O1xuXG5QYXJzZXIucGFyc2VFeHByZXNzaW9uQXQgPSBmdW5jdGlvbiBwYXJzZUV4cHJlc3Npb25BdCAoaW5wdXQsIHBvcywgb3B0aW9ucykge1xuICB2YXIgcGFyc2VyID0gbmV3IHRoaXMob3B0aW9ucywgaW5wdXQsIHBvcyk7XG4gIHBhcnNlci5uZXh0VG9rZW4oKTtcbiAgcmV0dXJuIHBhcnNlci5wYXJzZUV4cHJlc3Npb24oKVxufTtcblxuUGFyc2VyLnRva2VuaXplciA9IGZ1bmN0aW9uIHRva2VuaXplciAoaW5wdXQsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIG5ldyB0aGlzKG9wdGlvbnMsIGlucHV0KVxufTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoIFBhcnNlci5wcm90b3R5cGUsIHByb3RvdHlwZUFjY2Vzc29ycyApO1xuXG52YXIgcHAkOSA9IFBhcnNlci5wcm90b3R5cGU7XG5cbi8vICMjIFBhcnNlciB1dGlsaXRpZXNcblxudmFyIGxpdGVyYWwgPSAvXig/OicoKD86XFxcXFteXXxbXidcXFxcXSkqPyknfFwiKCg/OlxcXFxbXl18W15cIlxcXFxdKSo/KVwiKS87XG5wcCQ5LnN0cmljdERpcmVjdGl2ZSA9IGZ1bmN0aW9uKHN0YXJ0KSB7XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPCA1KSB7IHJldHVybiBmYWxzZSB9XG4gIGZvciAoOzspIHtcbiAgICAvLyBUcnkgdG8gZmluZCBzdHJpbmcgbGl0ZXJhbC5cbiAgICBza2lwV2hpdGVTcGFjZS5sYXN0SW5kZXggPSBzdGFydDtcbiAgICBzdGFydCArPSBza2lwV2hpdGVTcGFjZS5leGVjKHRoaXMuaW5wdXQpWzBdLmxlbmd0aDtcbiAgICB2YXIgbWF0Y2ggPSBsaXRlcmFsLmV4ZWModGhpcy5pbnB1dC5zbGljZShzdGFydCkpO1xuICAgIGlmICghbWF0Y2gpIHsgcmV0dXJuIGZhbHNlIH1cbiAgICBpZiAoKG1hdGNoWzFdIHx8IG1hdGNoWzJdKSA9PT0gXCJ1c2Ugc3RyaWN0XCIpIHtcbiAgICAgIHNraXBXaGl0ZVNwYWNlLmxhc3RJbmRleCA9IHN0YXJ0ICsgbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgdmFyIHNwYWNlQWZ0ZXIgPSBza2lwV2hpdGVTcGFjZS5leGVjKHRoaXMuaW5wdXQpLCBlbmQgPSBzcGFjZUFmdGVyLmluZGV4ICsgc3BhY2VBZnRlclswXS5sZW5ndGg7XG4gICAgICB2YXIgbmV4dCA9IHRoaXMuaW5wdXQuY2hhckF0KGVuZCk7XG4gICAgICByZXR1cm4gbmV4dCA9PT0gXCI7XCIgfHwgbmV4dCA9PT0gXCJ9XCIgfHxcbiAgICAgICAgKGxpbmVCcmVhay50ZXN0KHNwYWNlQWZ0ZXJbMF0pICYmXG4gICAgICAgICAhKC9bKGAuWytcXC0vKiU8Pj0sP14mXS8udGVzdChuZXh0KSB8fCBuZXh0ID09PSBcIiFcIiAmJiB0aGlzLmlucHV0LmNoYXJBdChlbmQgKyAxKSA9PT0gXCI9XCIpKVxuICAgIH1cbiAgICBzdGFydCArPSBtYXRjaFswXS5sZW5ndGg7XG5cbiAgICAvLyBTa2lwIHNlbWljb2xvbiwgaWYgYW55LlxuICAgIHNraXBXaGl0ZVNwYWNlLmxhc3RJbmRleCA9IHN0YXJ0O1xuICAgIHN0YXJ0ICs9IHNraXBXaGl0ZVNwYWNlLmV4ZWModGhpcy5pbnB1dClbMF0ubGVuZ3RoO1xuICAgIGlmICh0aGlzLmlucHV0W3N0YXJ0XSA9PT0gXCI7XCIpXG4gICAgICB7IHN0YXJ0Kys7IH1cbiAgfVxufTtcblxuLy8gUHJlZGljYXRlIHRoYXQgdGVzdHMgd2hldGhlciB0aGUgbmV4dCB0b2tlbiBpcyBvZiB0aGUgZ2l2ZW5cbi8vIHR5cGUsIGFuZCBpZiB5ZXMsIGNvbnN1bWVzIGl0IGFzIGEgc2lkZSBlZmZlY3QuXG5cbnBwJDkuZWF0ID0gZnVuY3Rpb24odHlwZSkge1xuICBpZiAodGhpcy50eXBlID09PSB0eXBlKSB7XG4gICAgdGhpcy5uZXh0KCk7XG4gICAgcmV0dXJuIHRydWVcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufTtcblxuLy8gVGVzdHMgd2hldGhlciBwYXJzZWQgdG9rZW4gaXMgYSBjb250ZXh0dWFsIGtleXdvcmQuXG5cbnBwJDkuaXNDb250ZXh0dWFsID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gdGhpcy50eXBlID09PSB0eXBlcyQxLm5hbWUgJiYgdGhpcy52YWx1ZSA9PT0gbmFtZSAmJiAhdGhpcy5jb250YWluc0VzY1xufTtcblxuLy8gQ29uc3VtZXMgY29udGV4dHVhbCBrZXl3b3JkIGlmIHBvc3NpYmxlLlxuXG5wcCQ5LmVhdENvbnRleHR1YWwgPSBmdW5jdGlvbihuYW1lKSB7XG4gIGlmICghdGhpcy5pc0NvbnRleHR1YWwobmFtZSkpIHsgcmV0dXJuIGZhbHNlIH1cbiAgdGhpcy5uZXh0KCk7XG4gIHJldHVybiB0cnVlXG59O1xuXG4vLyBBc3NlcnRzIHRoYXQgZm9sbG93aW5nIHRva2VuIGlzIGdpdmVuIGNvbnRleHR1YWwga2V5d29yZC5cblxucHAkOS5leHBlY3RDb250ZXh0dWFsID0gZnVuY3Rpb24obmFtZSkge1xuICBpZiAoIXRoaXMuZWF0Q29udGV4dHVhbChuYW1lKSkgeyB0aGlzLnVuZXhwZWN0ZWQoKTsgfVxufTtcblxuLy8gVGVzdCB3aGV0aGVyIGEgc2VtaWNvbG9uIGNhbiBiZSBpbnNlcnRlZCBhdCB0aGUgY3VycmVudCBwb3NpdGlvbi5cblxucHAkOS5jYW5JbnNlcnRTZW1pY29sb24gPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5lb2YgfHxcbiAgICB0aGlzLnR5cGUgPT09IHR5cGVzJDEuYnJhY2VSIHx8XG4gICAgbGluZUJyZWFrLnRlc3QodGhpcy5pbnB1dC5zbGljZSh0aGlzLmxhc3RUb2tFbmQsIHRoaXMuc3RhcnQpKVxufTtcblxucHAkOS5pbnNlcnRTZW1pY29sb24gPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuY2FuSW5zZXJ0U2VtaWNvbG9uKCkpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLm9uSW5zZXJ0ZWRTZW1pY29sb24pXG4gICAgICB7IHRoaXMub3B0aW9ucy5vbkluc2VydGVkU2VtaWNvbG9uKHRoaXMubGFzdFRva0VuZCwgdGhpcy5sYXN0VG9rRW5kTG9jKTsgfVxuICAgIHJldHVybiB0cnVlXG4gIH1cbn07XG5cbi8vIENvbnN1bWUgYSBzZW1pY29sb24sIG9yLCBmYWlsaW5nIHRoYXQsIHNlZSBpZiB3ZSBhcmUgYWxsb3dlZCB0b1xuLy8gcHJldGVuZCB0aGF0IHRoZXJlIGlzIGEgc2VtaWNvbG9uIGF0IHRoaXMgcG9zaXRpb24uXG5cbnBwJDkuc2VtaWNvbG9uID0gZnVuY3Rpb24oKSB7XG4gIGlmICghdGhpcy5lYXQodHlwZXMkMS5zZW1pKSAmJiAhdGhpcy5pbnNlcnRTZW1pY29sb24oKSkgeyB0aGlzLnVuZXhwZWN0ZWQoKTsgfVxufTtcblxucHAkOS5hZnRlclRyYWlsaW5nQ29tbWEgPSBmdW5jdGlvbih0b2tUeXBlLCBub3ROZXh0KSB7XG4gIGlmICh0aGlzLnR5cGUgPT09IHRva1R5cGUpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLm9uVHJhaWxpbmdDb21tYSlcbiAgICAgIHsgdGhpcy5vcHRpb25zLm9uVHJhaWxpbmdDb21tYSh0aGlzLmxhc3RUb2tTdGFydCwgdGhpcy5sYXN0VG9rU3RhcnRMb2MpOyB9XG4gICAgaWYgKCFub3ROZXh0KVxuICAgICAgeyB0aGlzLm5leHQoKTsgfVxuICAgIHJldHVybiB0cnVlXG4gIH1cbn07XG5cbi8vIEV4cGVjdCBhIHRva2VuIG9mIGEgZ2l2ZW4gdHlwZS4gSWYgZm91bmQsIGNvbnN1bWUgaXQsIG90aGVyd2lzZSxcbi8vIHJhaXNlIGFuIHVuZXhwZWN0ZWQgdG9rZW4gZXJyb3IuXG5cbnBwJDkuZXhwZWN0ID0gZnVuY3Rpb24odHlwZSkge1xuICB0aGlzLmVhdCh0eXBlKSB8fCB0aGlzLnVuZXhwZWN0ZWQoKTtcbn07XG5cbi8vIFJhaXNlIGFuIHVuZXhwZWN0ZWQgdG9rZW4gZXJyb3IuXG5cbnBwJDkudW5leHBlY3RlZCA9IGZ1bmN0aW9uKHBvcykge1xuICB0aGlzLnJhaXNlKHBvcyAhPSBudWxsID8gcG9zIDogdGhpcy5zdGFydCwgXCJVbmV4cGVjdGVkIHRva2VuXCIpO1xufTtcblxudmFyIERlc3RydWN0dXJpbmdFcnJvcnMgPSBmdW5jdGlvbiBEZXN0cnVjdHVyaW5nRXJyb3JzKCkge1xuICB0aGlzLnNob3J0aGFuZEFzc2lnbiA9XG4gIHRoaXMudHJhaWxpbmdDb21tYSA9XG4gIHRoaXMucGFyZW50aGVzaXplZEFzc2lnbiA9XG4gIHRoaXMucGFyZW50aGVzaXplZEJpbmQgPVxuICB0aGlzLmRvdWJsZVByb3RvID1cbiAgICAtMTtcbn07XG5cbnBwJDkuY2hlY2tQYXR0ZXJuRXJyb3JzID0gZnVuY3Rpb24ocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycywgaXNBc3NpZ24pIHtcbiAgaWYgKCFyZWZEZXN0cnVjdHVyaW5nRXJyb3JzKSB7IHJldHVybiB9XG4gIGlmIChyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnRyYWlsaW5nQ29tbWEgPiAtMSlcbiAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnRyYWlsaW5nQ29tbWEsIFwiQ29tbWEgaXMgbm90IHBlcm1pdHRlZCBhZnRlciB0aGUgcmVzdCBlbGVtZW50XCIpOyB9XG4gIHZhciBwYXJlbnMgPSBpc0Fzc2lnbiA/IHJlZkRlc3RydWN0dXJpbmdFcnJvcnMucGFyZW50aGVzaXplZEFzc2lnbiA6IHJlZkRlc3RydWN0dXJpbmdFcnJvcnMucGFyZW50aGVzaXplZEJpbmQ7XG4gIGlmIChwYXJlbnMgPiAtMSkgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUocGFyZW5zLCBpc0Fzc2lnbiA/IFwiQXNzaWduaW5nIHRvIHJ2YWx1ZVwiIDogXCJQYXJlbnRoZXNpemVkIHBhdHRlcm5cIik7IH1cbn07XG5cbnBwJDkuY2hlY2tFeHByZXNzaW9uRXJyb3JzID0gZnVuY3Rpb24ocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycywgYW5kVGhyb3cpIHtcbiAgaWYgKCFyZWZEZXN0cnVjdHVyaW5nRXJyb3JzKSB7IHJldHVybiBmYWxzZSB9XG4gIHZhciBzaG9ydGhhbmRBc3NpZ24gPSByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnNob3J0aGFuZEFzc2lnbjtcbiAgdmFyIGRvdWJsZVByb3RvID0gcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy5kb3VibGVQcm90bztcbiAgaWYgKCFhbmRUaHJvdykgeyByZXR1cm4gc2hvcnRoYW5kQXNzaWduID49IDAgfHwgZG91YmxlUHJvdG8gPj0gMCB9XG4gIGlmIChzaG9ydGhhbmRBc3NpZ24gPj0gMClcbiAgICB7IHRoaXMucmFpc2Uoc2hvcnRoYW5kQXNzaWduLCBcIlNob3J0aGFuZCBwcm9wZXJ0eSBhc3NpZ25tZW50cyBhcmUgdmFsaWQgb25seSBpbiBkZXN0cnVjdHVyaW5nIHBhdHRlcm5zXCIpOyB9XG4gIGlmIChkb3VibGVQcm90byA+PSAwKVxuICAgIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKGRvdWJsZVByb3RvLCBcIlJlZGVmaW5pdGlvbiBvZiBfX3Byb3RvX18gcHJvcGVydHlcIik7IH1cbn07XG5cbnBwJDkuY2hlY2tZaWVsZEF3YWl0SW5EZWZhdWx0UGFyYW1zID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLnlpZWxkUG9zICYmICghdGhpcy5hd2FpdFBvcyB8fCB0aGlzLnlpZWxkUG9zIDwgdGhpcy5hd2FpdFBvcykpXG4gICAgeyB0aGlzLnJhaXNlKHRoaXMueWllbGRQb3MsIFwiWWllbGQgZXhwcmVzc2lvbiBjYW5ub3QgYmUgYSBkZWZhdWx0IHZhbHVlXCIpOyB9XG4gIGlmICh0aGlzLmF3YWl0UG9zKVxuICAgIHsgdGhpcy5yYWlzZSh0aGlzLmF3YWl0UG9zLCBcIkF3YWl0IGV4cHJlc3Npb24gY2Fubm90IGJlIGEgZGVmYXVsdCB2YWx1ZVwiKTsgfVxufTtcblxucHAkOS5pc1NpbXBsZUFzc2lnblRhcmdldCA9IGZ1bmN0aW9uKGV4cHIpIHtcbiAgaWYgKGV4cHIudHlwZSA9PT0gXCJQYXJlbnRoZXNpemVkRXhwcmVzc2lvblwiKVxuICAgIHsgcmV0dXJuIHRoaXMuaXNTaW1wbGVBc3NpZ25UYXJnZXQoZXhwci5leHByZXNzaW9uKSB9XG4gIHJldHVybiBleHByLnR5cGUgPT09IFwiSWRlbnRpZmllclwiIHx8IGV4cHIudHlwZSA9PT0gXCJNZW1iZXJFeHByZXNzaW9uXCJcbn07XG5cbnZhciBwcCQ4ID0gUGFyc2VyLnByb3RvdHlwZTtcblxuLy8gIyMjIFN0YXRlbWVudCBwYXJzaW5nXG5cbi8vIFBhcnNlIGEgcHJvZ3JhbS4gSW5pdGlhbGl6ZXMgdGhlIHBhcnNlciwgcmVhZHMgYW55IG51bWJlciBvZlxuLy8gc3RhdGVtZW50cywgYW5kIHdyYXBzIHRoZW0gaW4gYSBQcm9ncmFtIG5vZGUuICBPcHRpb25hbGx5IHRha2VzIGFcbi8vIGBwcm9ncmFtYCBhcmd1bWVudC4gIElmIHByZXNlbnQsIHRoZSBzdGF0ZW1lbnRzIHdpbGwgYmUgYXBwZW5kZWRcbi8vIHRvIGl0cyBib2R5IGluc3RlYWQgb2YgY3JlYXRpbmcgYSBuZXcgbm9kZS5cblxucHAkOC5wYXJzZVRvcExldmVsID0gZnVuY3Rpb24obm9kZSkge1xuICB2YXIgZXhwb3J0cyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGlmICghbm9kZS5ib2R5KSB7IG5vZGUuYm9keSA9IFtdOyB9XG4gIHdoaWxlICh0aGlzLnR5cGUgIT09IHR5cGVzJDEuZW9mKSB7XG4gICAgdmFyIHN0bXQgPSB0aGlzLnBhcnNlU3RhdGVtZW50KG51bGwsIHRydWUsIGV4cG9ydHMpO1xuICAgIG5vZGUuYm9keS5wdXNoKHN0bXQpO1xuICB9XG4gIGlmICh0aGlzLmluTW9kdWxlKVxuICAgIHsgZm9yICh2YXIgaSA9IDAsIGxpc3QgPSBPYmplY3Qua2V5cyh0aGlzLnVuZGVmaW5lZEV4cG9ydHMpOyBpIDwgbGlzdC5sZW5ndGg7IGkgKz0gMSlcbiAgICAgIHtcbiAgICAgICAgdmFyIG5hbWUgPSBsaXN0W2ldO1xuXG4gICAgICAgIHRoaXMucmFpc2VSZWNvdmVyYWJsZSh0aGlzLnVuZGVmaW5lZEV4cG9ydHNbbmFtZV0uc3RhcnQsIChcIkV4cG9ydCAnXCIgKyBuYW1lICsgXCInIGlzIG5vdCBkZWZpbmVkXCIpKTtcbiAgICAgIH0gfVxuICB0aGlzLmFkYXB0RGlyZWN0aXZlUHJvbG9ndWUobm9kZS5ib2R5KTtcbiAgdGhpcy5uZXh0KCk7XG4gIG5vZGUuc291cmNlVHlwZSA9IHRoaXMub3B0aW9ucy5zb3VyY2VUeXBlO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiUHJvZ3JhbVwiKVxufTtcblxudmFyIGxvb3BMYWJlbCA9IHtraW5kOiBcImxvb3BcIn0sIHN3aXRjaExhYmVsID0ge2tpbmQ6IFwic3dpdGNoXCJ9O1xuXG5wcCQ4LmlzTGV0ID0gZnVuY3Rpb24oY29udGV4dCkge1xuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uIDwgNiB8fCAhdGhpcy5pc0NvbnRleHR1YWwoXCJsZXRcIikpIHsgcmV0dXJuIGZhbHNlIH1cbiAgc2tpcFdoaXRlU3BhY2UubGFzdEluZGV4ID0gdGhpcy5wb3M7XG4gIHZhciBza2lwID0gc2tpcFdoaXRlU3BhY2UuZXhlYyh0aGlzLmlucHV0KTtcbiAgdmFyIG5leHQgPSB0aGlzLnBvcyArIHNraXBbMF0ubGVuZ3RoLCBuZXh0Q2ggPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQobmV4dCk7XG4gIC8vIEZvciBhbWJpZ3VvdXMgY2FzZXMsIGRldGVybWluZSBpZiBhIExleGljYWxEZWNsYXJhdGlvbiAob3Igb25seSBhXG4gIC8vIFN0YXRlbWVudCkgaXMgYWxsb3dlZCBoZXJlLiBJZiBjb250ZXh0IGlzIG5vdCBlbXB0eSB0aGVuIG9ubHkgYSBTdGF0ZW1lbnRcbiAgLy8gaXMgYWxsb3dlZC4gSG93ZXZlciwgYGxldCBbYCBpcyBhbiBleHBsaWNpdCBuZWdhdGl2ZSBsb29rYWhlYWQgZm9yXG4gIC8vIEV4cHJlc3Npb25TdGF0ZW1lbnQsIHNvIHNwZWNpYWwtY2FzZSBpdCBmaXJzdC5cbiAgaWYgKG5leHRDaCA9PT0gOTEgfHwgbmV4dENoID09PSA5MikgeyByZXR1cm4gdHJ1ZSB9IC8vICdbJywgJ1xcJ1xuICBpZiAoY29udGV4dCkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIGlmIChuZXh0Q2ggPT09IDEyMyB8fCBuZXh0Q2ggPiAweGQ3ZmYgJiYgbmV4dENoIDwgMHhkYzAwKSB7IHJldHVybiB0cnVlIH0gLy8gJ3snLCBhc3RyYWxcbiAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KG5leHRDaCwgdHJ1ZSkpIHtcbiAgICB2YXIgcG9zID0gbmV4dCArIDE7XG4gICAgd2hpbGUgKGlzSWRlbnRpZmllckNoYXIobmV4dENoID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHBvcyksIHRydWUpKSB7ICsrcG9zOyB9XG4gICAgaWYgKG5leHRDaCA9PT0gOTIgfHwgbmV4dENoID4gMHhkN2ZmICYmIG5leHRDaCA8IDB4ZGMwMCkgeyByZXR1cm4gdHJ1ZSB9XG4gICAgdmFyIGlkZW50ID0gdGhpcy5pbnB1dC5zbGljZShuZXh0LCBwb3MpO1xuICAgIGlmICgha2V5d29yZFJlbGF0aW9uYWxPcGVyYXRvci50ZXN0KGlkZW50KSkgeyByZXR1cm4gdHJ1ZSB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG4vLyBjaGVjayAnYXN5bmMgW25vIExpbmVUZXJtaW5hdG9yIGhlcmVdIGZ1bmN0aW9uJ1xuLy8gLSAnYXN5bmMgLypmb28qLyBmdW5jdGlvbicgaXMgT0suXG4vLyAtICdhc3luYyAvKlxcbiovIGZ1bmN0aW9uJyBpcyBpbnZhbGlkLlxucHAkOC5pc0FzeW5jRnVuY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA8IDggfHwgIXRoaXMuaXNDb250ZXh0dWFsKFwiYXN5bmNcIikpXG4gICAgeyByZXR1cm4gZmFsc2UgfVxuXG4gIHNraXBXaGl0ZVNwYWNlLmxhc3RJbmRleCA9IHRoaXMucG9zO1xuICB2YXIgc2tpcCA9IHNraXBXaGl0ZVNwYWNlLmV4ZWModGhpcy5pbnB1dCk7XG4gIHZhciBuZXh0ID0gdGhpcy5wb3MgKyBza2lwWzBdLmxlbmd0aCwgYWZ0ZXI7XG4gIHJldHVybiAhbGluZUJyZWFrLnRlc3QodGhpcy5pbnB1dC5zbGljZSh0aGlzLnBvcywgbmV4dCkpICYmXG4gICAgdGhpcy5pbnB1dC5zbGljZShuZXh0LCBuZXh0ICsgOCkgPT09IFwiZnVuY3Rpb25cIiAmJlxuICAgIChuZXh0ICsgOCA9PT0gdGhpcy5pbnB1dC5sZW5ndGggfHxcbiAgICAgIShpc0lkZW50aWZpZXJDaGFyKGFmdGVyID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KG5leHQgKyA4KSkgfHwgYWZ0ZXIgPiAweGQ3ZmYgJiYgYWZ0ZXIgPCAweGRjMDApKVxufTtcblxucHAkOC5pc1VzaW5nS2V5d29yZCA9IGZ1bmN0aW9uKGlzQXdhaXRVc2luZywgaXNGb3IpIHtcbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA8IDE3IHx8ICF0aGlzLmlzQ29udGV4dHVhbChpc0F3YWl0VXNpbmcgPyBcImF3YWl0XCIgOiBcInVzaW5nXCIpKVxuICAgIHsgcmV0dXJuIGZhbHNlIH1cblxuICBza2lwV2hpdGVTcGFjZS5sYXN0SW5kZXggPSB0aGlzLnBvcztcbiAgdmFyIHNraXAgPSBza2lwV2hpdGVTcGFjZS5leGVjKHRoaXMuaW5wdXQpO1xuICB2YXIgbmV4dCA9IHRoaXMucG9zICsgc2tpcFswXS5sZW5ndGg7XG5cbiAgaWYgKGxpbmVCcmVhay50ZXN0KHRoaXMuaW5wdXQuc2xpY2UodGhpcy5wb3MsIG5leHQpKSkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIGlmIChpc0F3YWl0VXNpbmcpIHtcbiAgICB2YXIgYXdhaXRFbmRQb3MgPSBuZXh0ICsgNSAvKiBhd2FpdCAqLywgYWZ0ZXI7XG4gICAgaWYgKHRoaXMuaW5wdXQuc2xpY2UobmV4dCwgYXdhaXRFbmRQb3MpICE9PSBcInVzaW5nXCIgfHxcbiAgICAgIGF3YWl0RW5kUG9zID09PSB0aGlzLmlucHV0Lmxlbmd0aCB8fFxuICAgICAgaXNJZGVudGlmaWVyQ2hhcihhZnRlciA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdChhd2FpdEVuZFBvcykpIHx8XG4gICAgICAoYWZ0ZXIgPiAweGQ3ZmYgJiYgYWZ0ZXIgPCAweGRjMDApXG4gICAgKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgICBza2lwV2hpdGVTcGFjZS5sYXN0SW5kZXggPSBhd2FpdEVuZFBvcztcbiAgICB2YXIgc2tpcEFmdGVyVXNpbmcgPSBza2lwV2hpdGVTcGFjZS5leGVjKHRoaXMuaW5wdXQpO1xuICAgIGlmIChza2lwQWZ0ZXJVc2luZyAmJiBsaW5lQnJlYWsudGVzdCh0aGlzLmlucHV0LnNsaWNlKGF3YWl0RW5kUG9zLCBhd2FpdEVuZFBvcyArIHNraXBBZnRlclVzaW5nWzBdLmxlbmd0aCkpKSB7IHJldHVybiBmYWxzZSB9XG4gIH1cblxuICBpZiAoaXNGb3IpIHtcbiAgICB2YXIgb2ZFbmRQb3MgPSBuZXh0ICsgMiAvKiBvZiAqLywgYWZ0ZXIkMTtcbiAgICBpZiAodGhpcy5pbnB1dC5zbGljZShuZXh0LCBvZkVuZFBvcykgPT09IFwib2ZcIikge1xuICAgICAgaWYgKG9mRW5kUG9zID09PSB0aGlzLmlucHV0Lmxlbmd0aCB8fFxuICAgICAgICAoIWlzSWRlbnRpZmllckNoYXIoYWZ0ZXIkMSA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdChvZkVuZFBvcykpICYmICEoYWZ0ZXIkMSA+IDB4ZDdmZiAmJiBhZnRlciQxIDwgMHhkYzAwKSkpIHsgcmV0dXJuIGZhbHNlIH1cbiAgICB9XG4gIH1cblxuICB2YXIgY2ggPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQobmV4dCk7XG4gIHJldHVybiBpc0lkZW50aWZpZXJTdGFydChjaCwgdHJ1ZSkgfHwgY2ggPT09IDkyIC8vICdcXCdcbn07XG5cbnBwJDguaXNBd2FpdFVzaW5nID0gZnVuY3Rpb24oaXNGb3IpIHtcbiAgcmV0dXJuIHRoaXMuaXNVc2luZ0tleXdvcmQodHJ1ZSwgaXNGb3IpXG59O1xuXG5wcCQ4LmlzVXNpbmcgPSBmdW5jdGlvbihpc0Zvcikge1xuICByZXR1cm4gdGhpcy5pc1VzaW5nS2V5d29yZChmYWxzZSwgaXNGb3IpXG59O1xuXG4vLyBQYXJzZSBhIHNpbmdsZSBzdGF0ZW1lbnQuXG4vL1xuLy8gSWYgZXhwZWN0aW5nIGEgc3RhdGVtZW50IGFuZCBmaW5kaW5nIGEgc2xhc2ggb3BlcmF0b3IsIHBhcnNlIGFcbi8vIHJlZ3VsYXIgZXhwcmVzc2lvbiBsaXRlcmFsLiBUaGlzIGlzIHRvIGhhbmRsZSBjYXNlcyBsaWtlXG4vLyBgaWYgKGZvbykgL2JsYWgvLmV4ZWMoZm9vKWAsIHdoZXJlIGxvb2tpbmcgYXQgdGhlIHByZXZpb3VzIHRva2VuXG4vLyBkb2VzIG5vdCBoZWxwLlxuXG5wcCQ4LnBhcnNlU3RhdGVtZW50ID0gZnVuY3Rpb24oY29udGV4dCwgdG9wTGV2ZWwsIGV4cG9ydHMpIHtcbiAgdmFyIHN0YXJ0dHlwZSA9IHRoaXMudHlwZSwgbm9kZSA9IHRoaXMuc3RhcnROb2RlKCksIGtpbmQ7XG5cbiAgaWYgKHRoaXMuaXNMZXQoY29udGV4dCkpIHtcbiAgICBzdGFydHR5cGUgPSB0eXBlcyQxLl92YXI7XG4gICAga2luZCA9IFwibGV0XCI7XG4gIH1cblxuICAvLyBNb3N0IHR5cGVzIG9mIHN0YXRlbWVudHMgYXJlIHJlY29nbml6ZWQgYnkgdGhlIGtleXdvcmQgdGhleVxuICAvLyBzdGFydCB3aXRoLiBNYW55IGFyZSB0cml2aWFsIHRvIHBhcnNlLCBzb21lIHJlcXVpcmUgYSBiaXQgb2ZcbiAgLy8gY29tcGxleGl0eS5cblxuICBzd2l0Y2ggKHN0YXJ0dHlwZSkge1xuICBjYXNlIHR5cGVzJDEuX2JyZWFrOiBjYXNlIHR5cGVzJDEuX2NvbnRpbnVlOiByZXR1cm4gdGhpcy5wYXJzZUJyZWFrQ29udGludWVTdGF0ZW1lbnQobm9kZSwgc3RhcnR0eXBlLmtleXdvcmQpXG4gIGNhc2UgdHlwZXMkMS5fZGVidWdnZXI6IHJldHVybiB0aGlzLnBhcnNlRGVidWdnZXJTdGF0ZW1lbnQobm9kZSlcbiAgY2FzZSB0eXBlcyQxLl9kbzogcmV0dXJuIHRoaXMucGFyc2VEb1N0YXRlbWVudChub2RlKVxuICBjYXNlIHR5cGVzJDEuX2ZvcjogcmV0dXJuIHRoaXMucGFyc2VGb3JTdGF0ZW1lbnQobm9kZSlcbiAgY2FzZSB0eXBlcyQxLl9mdW5jdGlvbjpcbiAgICAvLyBGdW5jdGlvbiBhcyBzb2xlIGJvZHkgb2YgZWl0aGVyIGFuIGlmIHN0YXRlbWVudCBvciBhIGxhYmVsZWQgc3RhdGVtZW50XG4gICAgLy8gd29ya3MsIGJ1dCBub3Qgd2hlbiBpdCBpcyBwYXJ0IG9mIGEgbGFiZWxlZCBzdGF0ZW1lbnQgdGhhdCBpcyB0aGUgc29sZVxuICAgIC8vIGJvZHkgb2YgYW4gaWYgc3RhdGVtZW50LlxuICAgIGlmICgoY29udGV4dCAmJiAodGhpcy5zdHJpY3QgfHwgY29udGV4dCAhPT0gXCJpZlwiICYmIGNvbnRleHQgIT09IFwibGFiZWxcIikpICYmIHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2KSB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gICAgcmV0dXJuIHRoaXMucGFyc2VGdW5jdGlvblN0YXRlbWVudChub2RlLCBmYWxzZSwgIWNvbnRleHQpXG4gIGNhc2UgdHlwZXMkMS5fY2xhc3M6XG4gICAgaWYgKGNvbnRleHQpIHsgdGhpcy51bmV4cGVjdGVkKCk7IH1cbiAgICByZXR1cm4gdGhpcy5wYXJzZUNsYXNzKG5vZGUsIHRydWUpXG4gIGNhc2UgdHlwZXMkMS5faWY6IHJldHVybiB0aGlzLnBhcnNlSWZTdGF0ZW1lbnQobm9kZSlcbiAgY2FzZSB0eXBlcyQxLl9yZXR1cm46IHJldHVybiB0aGlzLnBhcnNlUmV0dXJuU3RhdGVtZW50KG5vZGUpXG4gIGNhc2UgdHlwZXMkMS5fc3dpdGNoOiByZXR1cm4gdGhpcy5wYXJzZVN3aXRjaFN0YXRlbWVudChub2RlKVxuICBjYXNlIHR5cGVzJDEuX3Rocm93OiByZXR1cm4gdGhpcy5wYXJzZVRocm93U3RhdGVtZW50KG5vZGUpXG4gIGNhc2UgdHlwZXMkMS5fdHJ5OiByZXR1cm4gdGhpcy5wYXJzZVRyeVN0YXRlbWVudChub2RlKVxuICBjYXNlIHR5cGVzJDEuX2NvbnN0OiBjYXNlIHR5cGVzJDEuX3ZhcjpcbiAgICBraW5kID0ga2luZCB8fCB0aGlzLnZhbHVlO1xuICAgIGlmIChjb250ZXh0ICYmIGtpbmQgIT09IFwidmFyXCIpIHsgdGhpcy51bmV4cGVjdGVkKCk7IH1cbiAgICByZXR1cm4gdGhpcy5wYXJzZVZhclN0YXRlbWVudChub2RlLCBraW5kKVxuICBjYXNlIHR5cGVzJDEuX3doaWxlOiByZXR1cm4gdGhpcy5wYXJzZVdoaWxlU3RhdGVtZW50KG5vZGUpXG4gIGNhc2UgdHlwZXMkMS5fd2l0aDogcmV0dXJuIHRoaXMucGFyc2VXaXRoU3RhdGVtZW50KG5vZGUpXG4gIGNhc2UgdHlwZXMkMS5icmFjZUw6IHJldHVybiB0aGlzLnBhcnNlQmxvY2sodHJ1ZSwgbm9kZSlcbiAgY2FzZSB0eXBlcyQxLnNlbWk6IHJldHVybiB0aGlzLnBhcnNlRW1wdHlTdGF0ZW1lbnQobm9kZSlcbiAgY2FzZSB0eXBlcyQxLl9leHBvcnQ6XG4gIGNhc2UgdHlwZXMkMS5faW1wb3J0OlxuICAgIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPiAxMCAmJiBzdGFydHR5cGUgPT09IHR5cGVzJDEuX2ltcG9ydCkge1xuICAgICAgc2tpcFdoaXRlU3BhY2UubGFzdEluZGV4ID0gdGhpcy5wb3M7XG4gICAgICB2YXIgc2tpcCA9IHNraXBXaGl0ZVNwYWNlLmV4ZWModGhpcy5pbnB1dCk7XG4gICAgICB2YXIgbmV4dCA9IHRoaXMucG9zICsgc2tpcFswXS5sZW5ndGgsIG5leHRDaCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdChuZXh0KTtcbiAgICAgIGlmIChuZXh0Q2ggPT09IDQwIHx8IG5leHRDaCA9PT0gNDYpIC8vICcoJyBvciAnLidcbiAgICAgICAgeyByZXR1cm4gdGhpcy5wYXJzZUV4cHJlc3Npb25TdGF0ZW1lbnQobm9kZSwgdGhpcy5wYXJzZUV4cHJlc3Npb24oKSkgfVxuICAgIH1cblxuICAgIGlmICghdGhpcy5vcHRpb25zLmFsbG93SW1wb3J0RXhwb3J0RXZlcnl3aGVyZSkge1xuICAgICAgaWYgKCF0b3BMZXZlbClcbiAgICAgICAgeyB0aGlzLnJhaXNlKHRoaXMuc3RhcnQsIFwiJ2ltcG9ydCcgYW5kICdleHBvcnQnIG1heSBvbmx5IGFwcGVhciBhdCB0aGUgdG9wIGxldmVsXCIpOyB9XG4gICAgICBpZiAoIXRoaXMuaW5Nb2R1bGUpXG4gICAgICAgIHsgdGhpcy5yYWlzZSh0aGlzLnN0YXJ0LCBcIidpbXBvcnQnIGFuZCAnZXhwb3J0JyBtYXkgYXBwZWFyIG9ubHkgd2l0aCAnc291cmNlVHlwZTogbW9kdWxlJ1wiKTsgfVxuICAgIH1cbiAgICByZXR1cm4gc3RhcnR0eXBlID09PSB0eXBlcyQxLl9pbXBvcnQgPyB0aGlzLnBhcnNlSW1wb3J0KG5vZGUpIDogdGhpcy5wYXJzZUV4cG9ydChub2RlLCBleHBvcnRzKVxuXG4gICAgLy8gSWYgdGhlIHN0YXRlbWVudCBkb2VzIG5vdCBzdGFydCB3aXRoIGEgc3RhdGVtZW50IGtleXdvcmQgb3IgYVxuICAgIC8vIGJyYWNlLCBpdCdzIGFuIEV4cHJlc3Npb25TdGF0ZW1lbnQgb3IgTGFiZWxlZFN0YXRlbWVudC4gV2VcbiAgICAvLyBzaW1wbHkgc3RhcnQgcGFyc2luZyBhbiBleHByZXNzaW9uLCBhbmQgYWZ0ZXJ3YXJkcywgaWYgdGhlXG4gICAgLy8gbmV4dCB0b2tlbiBpcyBhIGNvbG9uIGFuZCB0aGUgZXhwcmVzc2lvbiB3YXMgYSBzaW1wbGVcbiAgICAvLyBJZGVudGlmaWVyIG5vZGUsIHdlIHN3aXRjaCB0byBpbnRlcnByZXRpbmcgaXQgYXMgYSBsYWJlbC5cbiAgZGVmYXVsdDpcbiAgICBpZiAodGhpcy5pc0FzeW5jRnVuY3Rpb24oKSkge1xuICAgICAgaWYgKGNvbnRleHQpIHsgdGhpcy51bmV4cGVjdGVkKCk7IH1cbiAgICAgIHRoaXMubmV4dCgpO1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VGdW5jdGlvblN0YXRlbWVudChub2RlLCB0cnVlLCAhY29udGV4dClcbiAgICB9XG5cbiAgICB2YXIgdXNpbmdLaW5kID0gdGhpcy5pc0F3YWl0VXNpbmcoZmFsc2UpID8gXCJhd2FpdCB1c2luZ1wiIDogdGhpcy5pc1VzaW5nKGZhbHNlKSA/IFwidXNpbmdcIiA6IG51bGw7XG4gICAgaWYgKHVzaW5nS2luZCkge1xuICAgICAgaWYgKHRvcExldmVsICYmIHRoaXMub3B0aW9ucy5zb3VyY2VUeXBlID09PSBcInNjcmlwdFwiKSB7XG4gICAgICAgIHRoaXMucmFpc2UodGhpcy5zdGFydCwgXCJVc2luZyBkZWNsYXJhdGlvbiBjYW5ub3QgYXBwZWFyIGluIHRoZSB0b3AgbGV2ZWwgd2hlbiBzb3VyY2UgdHlwZSBpcyBgc2NyaXB0YFwiKTtcbiAgICAgIH1cbiAgICAgIGlmICh1c2luZ0tpbmQgPT09IFwiYXdhaXQgdXNpbmdcIikge1xuICAgICAgICBpZiAoIXRoaXMuY2FuQXdhaXQpIHtcbiAgICAgICAgICB0aGlzLnJhaXNlKHRoaXMuc3RhcnQsIFwiQXdhaXQgdXNpbmcgY2Fubm90IGFwcGVhciBvdXRzaWRlIG9mIGFzeW5jIGZ1bmN0aW9uXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubmV4dCgpO1xuICAgICAgfVxuICAgICAgdGhpcy5uZXh0KCk7XG4gICAgICB0aGlzLnBhcnNlVmFyKG5vZGUsIGZhbHNlLCB1c2luZ0tpbmQpO1xuICAgICAgdGhpcy5zZW1pY29sb24oKTtcbiAgICAgIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJWYXJpYWJsZURlY2xhcmF0aW9uXCIpXG4gICAgfVxuXG4gICAgdmFyIG1heWJlTmFtZSA9IHRoaXMudmFsdWUsIGV4cHIgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgIGlmIChzdGFydHR5cGUgPT09IHR5cGVzJDEubmFtZSAmJiBleHByLnR5cGUgPT09IFwiSWRlbnRpZmllclwiICYmIHRoaXMuZWF0KHR5cGVzJDEuY29sb24pKVxuICAgICAgeyByZXR1cm4gdGhpcy5wYXJzZUxhYmVsZWRTdGF0ZW1lbnQobm9kZSwgbWF5YmVOYW1lLCBleHByLCBjb250ZXh0KSB9XG4gICAgZWxzZSB7IHJldHVybiB0aGlzLnBhcnNlRXhwcmVzc2lvblN0YXRlbWVudChub2RlLCBleHByKSB9XG4gIH1cbn07XG5cbnBwJDgucGFyc2VCcmVha0NvbnRpbnVlU3RhdGVtZW50ID0gZnVuY3Rpb24obm9kZSwga2V5d29yZCkge1xuICB2YXIgaXNCcmVhayA9IGtleXdvcmQgPT09IFwiYnJlYWtcIjtcbiAgdGhpcy5uZXh0KCk7XG4gIGlmICh0aGlzLmVhdCh0eXBlcyQxLnNlbWkpIHx8IHRoaXMuaW5zZXJ0U2VtaWNvbG9uKCkpIHsgbm9kZS5sYWJlbCA9IG51bGw7IH1cbiAgZWxzZSBpZiAodGhpcy50eXBlICE9PSB0eXBlcyQxLm5hbWUpIHsgdGhpcy51bmV4cGVjdGVkKCk7IH1cbiAgZWxzZSB7XG4gICAgbm9kZS5sYWJlbCA9IHRoaXMucGFyc2VJZGVudCgpO1xuICAgIHRoaXMuc2VtaWNvbG9uKCk7XG4gIH1cblxuICAvLyBWZXJpZnkgdGhhdCB0aGVyZSBpcyBhbiBhY3R1YWwgZGVzdGluYXRpb24gdG8gYnJlYWsgb3JcbiAgLy8gY29udGludWUgdG8uXG4gIHZhciBpID0gMDtcbiAgZm9yICg7IGkgPCB0aGlzLmxhYmVscy5sZW5ndGg7ICsraSkge1xuICAgIHZhciBsYWIgPSB0aGlzLmxhYmVsc1tpXTtcbiAgICBpZiAobm9kZS5sYWJlbCA9PSBudWxsIHx8IGxhYi5uYW1lID09PSBub2RlLmxhYmVsLm5hbWUpIHtcbiAgICAgIGlmIChsYWIua2luZCAhPSBudWxsICYmIChpc0JyZWFrIHx8IGxhYi5raW5kID09PSBcImxvb3BcIikpIHsgYnJlYWsgfVxuICAgICAgaWYgKG5vZGUubGFiZWwgJiYgaXNCcmVhaykgeyBicmVhayB9XG4gICAgfVxuICB9XG4gIGlmIChpID09PSB0aGlzLmxhYmVscy5sZW5ndGgpIHsgdGhpcy5yYWlzZShub2RlLnN0YXJ0LCBcIlVuc3ludGFjdGljIFwiICsga2V5d29yZCk7IH1cbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBpc0JyZWFrID8gXCJCcmVha1N0YXRlbWVudFwiIDogXCJDb250aW51ZVN0YXRlbWVudFwiKVxufTtcblxucHAkOC5wYXJzZURlYnVnZ2VyU3RhdGVtZW50ID0gZnVuY3Rpb24obm9kZSkge1xuICB0aGlzLm5leHQoKTtcbiAgdGhpcy5zZW1pY29sb24oKTtcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIkRlYnVnZ2VyU3RhdGVtZW50XCIpXG59O1xuXG5wcCQ4LnBhcnNlRG9TdGF0ZW1lbnQgPSBmdW5jdGlvbihub2RlKSB7XG4gIHRoaXMubmV4dCgpO1xuICB0aGlzLmxhYmVscy5wdXNoKGxvb3BMYWJlbCk7XG4gIG5vZGUuYm9keSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoXCJkb1wiKTtcbiAgdGhpcy5sYWJlbHMucG9wKCk7XG4gIHRoaXMuZXhwZWN0KHR5cGVzJDEuX3doaWxlKTtcbiAgbm9kZS50ZXN0ID0gdGhpcy5wYXJzZVBhcmVuRXhwcmVzc2lvbigpO1xuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDYpXG4gICAgeyB0aGlzLmVhdCh0eXBlcyQxLnNlbWkpOyB9XG4gIGVsc2VcbiAgICB7IHRoaXMuc2VtaWNvbG9uKCk7IH1cbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIkRvV2hpbGVTdGF0ZW1lbnRcIilcbn07XG5cbi8vIERpc2FtYmlndWF0aW5nIGJldHdlZW4gYSBgZm9yYCBhbmQgYSBgZm9yYC9gaW5gIG9yIGBmb3JgL2BvZmBcbi8vIGxvb3AgaXMgbm9uLXRyaXZpYWwuIEJhc2ljYWxseSwgd2UgaGF2ZSB0byBwYXJzZSB0aGUgaW5pdCBgdmFyYFxuLy8gc3RhdGVtZW50IG9yIGV4cHJlc3Npb24sIGRpc2FsbG93aW5nIHRoZSBgaW5gIG9wZXJhdG9yIChzZWVcbi8vIHRoZSBzZWNvbmQgcGFyYW1ldGVyIHRvIGBwYXJzZUV4cHJlc3Npb25gKSwgYW5kIHRoZW4gY2hlY2tcbi8vIHdoZXRoZXIgdGhlIG5leHQgdG9rZW4gaXMgYGluYCBvciBgb2ZgLiBXaGVuIHRoZXJlIGlzIG5vIGluaXRcbi8vIHBhcnQgKHNlbWljb2xvbiBpbW1lZGlhdGVseSBhZnRlciB0aGUgb3BlbmluZyBwYXJlbnRoZXNpcyksIGl0XG4vLyBpcyBhIHJlZ3VsYXIgYGZvcmAgbG9vcC5cblxucHAkOC5wYXJzZUZvclN0YXRlbWVudCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgdGhpcy5uZXh0KCk7XG4gIHZhciBhd2FpdEF0ID0gKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA5ICYmIHRoaXMuY2FuQXdhaXQgJiYgdGhpcy5lYXRDb250ZXh0dWFsKFwiYXdhaXRcIikpID8gdGhpcy5sYXN0VG9rU3RhcnQgOiAtMTtcbiAgdGhpcy5sYWJlbHMucHVzaChsb29wTGFiZWwpO1xuICB0aGlzLmVudGVyU2NvcGUoMCk7XG4gIHRoaXMuZXhwZWN0KHR5cGVzJDEucGFyZW5MKTtcbiAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5zZW1pKSB7XG4gICAgaWYgKGF3YWl0QXQgPiAtMSkgeyB0aGlzLnVuZXhwZWN0ZWQoYXdhaXRBdCk7IH1cbiAgICByZXR1cm4gdGhpcy5wYXJzZUZvcihub2RlLCBudWxsKVxuICB9XG4gIHZhciBpc0xldCA9IHRoaXMuaXNMZXQoKTtcbiAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5fdmFyIHx8IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5fY29uc3QgfHwgaXNMZXQpIHtcbiAgICB2YXIgaW5pdCQxID0gdGhpcy5zdGFydE5vZGUoKSwga2luZCA9IGlzTGV0ID8gXCJsZXRcIiA6IHRoaXMudmFsdWU7XG4gICAgdGhpcy5uZXh0KCk7XG4gICAgdGhpcy5wYXJzZVZhcihpbml0JDEsIHRydWUsIGtpbmQpO1xuICAgIHRoaXMuZmluaXNoTm9kZShpbml0JDEsIFwiVmFyaWFibGVEZWNsYXJhdGlvblwiKTtcbiAgICByZXR1cm4gdGhpcy5wYXJzZUZvckFmdGVySW5pdChub2RlLCBpbml0JDEsIGF3YWl0QXQpXG4gIH1cbiAgdmFyIHN0YXJ0c1dpdGhMZXQgPSB0aGlzLmlzQ29udGV4dHVhbChcImxldFwiKSwgaXNGb3JPZiA9IGZhbHNlO1xuXG4gIHZhciB1c2luZ0tpbmQgPSB0aGlzLmlzVXNpbmcodHJ1ZSkgPyBcInVzaW5nXCIgOiB0aGlzLmlzQXdhaXRVc2luZyh0cnVlKSA/IFwiYXdhaXQgdXNpbmdcIiA6IG51bGw7XG4gIGlmICh1c2luZ0tpbmQpIHtcbiAgICB2YXIgaW5pdCQyID0gdGhpcy5zdGFydE5vZGUoKTtcbiAgICB0aGlzLm5leHQoKTtcbiAgICBpZiAodXNpbmdLaW5kID09PSBcImF3YWl0IHVzaW5nXCIpIHsgdGhpcy5uZXh0KCk7IH1cbiAgICB0aGlzLnBhcnNlVmFyKGluaXQkMiwgdHJ1ZSwgdXNpbmdLaW5kKTtcbiAgICB0aGlzLmZpbmlzaE5vZGUoaW5pdCQyLCBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIik7XG4gICAgcmV0dXJuIHRoaXMucGFyc2VGb3JBZnRlckluaXQobm9kZSwgaW5pdCQyLCBhd2FpdEF0KVxuICB9XG4gIHZhciBjb250YWluc0VzYyA9IHRoaXMuY29udGFpbnNFc2M7XG4gIHZhciByZWZEZXN0cnVjdHVyaW5nRXJyb3JzID0gbmV3IERlc3RydWN0dXJpbmdFcnJvcnM7XG4gIHZhciBpbml0UG9zID0gdGhpcy5zdGFydDtcbiAgdmFyIGluaXQgPSBhd2FpdEF0ID4gLTFcbiAgICA/IHRoaXMucGFyc2VFeHByU3Vic2NyaXB0cyhyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCBcImF3YWl0XCIpXG4gICAgOiB0aGlzLnBhcnNlRXhwcmVzc2lvbih0cnVlLCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKTtcbiAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5faW4gfHwgKGlzRm9yT2YgPSB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNiAmJiB0aGlzLmlzQ29udGV4dHVhbChcIm9mXCIpKSkge1xuICAgIGlmIChhd2FpdEF0ID4gLTEpIHsgLy8gaW1wbGllcyBgZWNtYVZlcnNpb24gPj0gOWAgKHNlZSBkZWNsYXJhdGlvbiBvZiBhd2FpdEF0KVxuICAgICAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5faW4pIHsgdGhpcy51bmV4cGVjdGVkKGF3YWl0QXQpOyB9XG4gICAgICBub2RlLmF3YWl0ID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKGlzRm9yT2YgJiYgdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDgpIHtcbiAgICAgIGlmIChpbml0LnN0YXJ0ID09PSBpbml0UG9zICYmICFjb250YWluc0VzYyAmJiBpbml0LnR5cGUgPT09IFwiSWRlbnRpZmllclwiICYmIGluaXQubmFtZSA9PT0gXCJhc3luY1wiKSB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gICAgICBlbHNlIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOSkgeyBub2RlLmF3YWl0ID0gZmFsc2U7IH1cbiAgICB9XG4gICAgaWYgKHN0YXJ0c1dpdGhMZXQgJiYgaXNGb3JPZikgeyB0aGlzLnJhaXNlKGluaXQuc3RhcnQsIFwiVGhlIGxlZnQtaGFuZCBzaWRlIG9mIGEgZm9yLW9mIGxvb3AgbWF5IG5vdCBzdGFydCB3aXRoICdsZXQnLlwiKTsgfVxuICAgIHRoaXMudG9Bc3NpZ25hYmxlKGluaXQsIGZhbHNlLCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKTtcbiAgICB0aGlzLmNoZWNrTFZhbFBhdHRlcm4oaW5pdCk7XG4gICAgcmV0dXJuIHRoaXMucGFyc2VGb3JJbihub2RlLCBpbml0KVxuICB9IGVsc2Uge1xuICAgIHRoaXMuY2hlY2tFeHByZXNzaW9uRXJyb3JzKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMsIHRydWUpO1xuICB9XG4gIGlmIChhd2FpdEF0ID4gLTEpIHsgdGhpcy51bmV4cGVjdGVkKGF3YWl0QXQpOyB9XG4gIHJldHVybiB0aGlzLnBhcnNlRm9yKG5vZGUsIGluaXQpXG59O1xuXG4vLyBIZWxwZXIgbWV0aG9kIHRvIHBhcnNlIGZvciBsb29wIGFmdGVyIHZhcmlhYmxlIGluaXRpYWxpemF0aW9uXG5wcCQ4LnBhcnNlRm9yQWZ0ZXJJbml0ID0gZnVuY3Rpb24obm9kZSwgaW5pdCwgYXdhaXRBdCkge1xuICBpZiAoKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5faW4gfHwgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2ICYmIHRoaXMuaXNDb250ZXh0dWFsKFwib2ZcIikpKSAmJiBpbml0LmRlY2xhcmF0aW9ucy5sZW5ndGggPT09IDEpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDkpIHtcbiAgICAgIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuX2luKSB7XG4gICAgICAgIGlmIChhd2FpdEF0ID4gLTEpIHsgdGhpcy51bmV4cGVjdGVkKGF3YWl0QXQpOyB9XG4gICAgICB9IGVsc2UgeyBub2RlLmF3YWl0ID0gYXdhaXRBdCA+IC0xOyB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnBhcnNlRm9ySW4obm9kZSwgaW5pdClcbiAgfVxuICBpZiAoYXdhaXRBdCA+IC0xKSB7IHRoaXMudW5leHBlY3RlZChhd2FpdEF0KTsgfVxuICByZXR1cm4gdGhpcy5wYXJzZUZvcihub2RlLCBpbml0KVxufTtcblxucHAkOC5wYXJzZUZ1bmN0aW9uU3RhdGVtZW50ID0gZnVuY3Rpb24obm9kZSwgaXNBc3luYywgZGVjbGFyYXRpb25Qb3NpdGlvbikge1xuICB0aGlzLm5leHQoKTtcbiAgcmV0dXJuIHRoaXMucGFyc2VGdW5jdGlvbihub2RlLCBGVU5DX1NUQVRFTUVOVCB8IChkZWNsYXJhdGlvblBvc2l0aW9uID8gMCA6IEZVTkNfSEFOR0lOR19TVEFURU1FTlQpLCBmYWxzZSwgaXNBc3luYylcbn07XG5cbnBwJDgucGFyc2VJZlN0YXRlbWVudCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgdGhpcy5uZXh0KCk7XG4gIG5vZGUudGVzdCA9IHRoaXMucGFyc2VQYXJlbkV4cHJlc3Npb24oKTtcbiAgLy8gYWxsb3cgZnVuY3Rpb24gZGVjbGFyYXRpb25zIGluIGJyYW5jaGVzLCBidXQgb25seSBpbiBub24tc3RyaWN0IG1vZGVcbiAgbm9kZS5jb25zZXF1ZW50ID0gdGhpcy5wYXJzZVN0YXRlbWVudChcImlmXCIpO1xuICBub2RlLmFsdGVybmF0ZSA9IHRoaXMuZWF0KHR5cGVzJDEuX2Vsc2UpID8gdGhpcy5wYXJzZVN0YXRlbWVudChcImlmXCIpIDogbnVsbDtcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIklmU3RhdGVtZW50XCIpXG59O1xuXG5wcCQ4LnBhcnNlUmV0dXJuU3RhdGVtZW50ID0gZnVuY3Rpb24obm9kZSkge1xuICBpZiAoIXRoaXMuaW5GdW5jdGlvbiAmJiAhdGhpcy5vcHRpb25zLmFsbG93UmV0dXJuT3V0c2lkZUZ1bmN0aW9uKVxuICAgIHsgdGhpcy5yYWlzZSh0aGlzLnN0YXJ0LCBcIidyZXR1cm4nIG91dHNpZGUgb2YgZnVuY3Rpb25cIik7IH1cbiAgdGhpcy5uZXh0KCk7XG5cbiAgLy8gSW4gYHJldHVybmAgKGFuZCBgYnJlYWtgL2Bjb250aW51ZWApLCB0aGUga2V5d29yZHMgd2l0aFxuICAvLyBvcHRpb25hbCBhcmd1bWVudHMsIHdlIGVhZ2VybHkgbG9vayBmb3IgYSBzZW1pY29sb24gb3IgdGhlXG4gIC8vIHBvc3NpYmlsaXR5IHRvIGluc2VydCBvbmUuXG5cbiAgaWYgKHRoaXMuZWF0KHR5cGVzJDEuc2VtaSkgfHwgdGhpcy5pbnNlcnRTZW1pY29sb24oKSkgeyBub2RlLmFyZ3VtZW50ID0gbnVsbDsgfVxuICBlbHNlIHsgbm9kZS5hcmd1bWVudCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7IHRoaXMuc2VtaWNvbG9uKCk7IH1cbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIlJldHVyblN0YXRlbWVudFwiKVxufTtcblxucHAkOC5wYXJzZVN3aXRjaFN0YXRlbWVudCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgdGhpcy5uZXh0KCk7XG4gIG5vZGUuZGlzY3JpbWluYW50ID0gdGhpcy5wYXJzZVBhcmVuRXhwcmVzc2lvbigpO1xuICBub2RlLmNhc2VzID0gW107XG4gIHRoaXMuZXhwZWN0KHR5cGVzJDEuYnJhY2VMKTtcbiAgdGhpcy5sYWJlbHMucHVzaChzd2l0Y2hMYWJlbCk7XG4gIHRoaXMuZW50ZXJTY29wZSgwKTtcblxuICAvLyBTdGF0ZW1lbnRzIHVuZGVyIG11c3QgYmUgZ3JvdXBlZCAoYnkgbGFiZWwpIGluIFN3aXRjaENhc2VcbiAgLy8gbm9kZXMuIGBjdXJgIGlzIHVzZWQgdG8ga2VlcCB0aGUgbm9kZSB0aGF0IHdlIGFyZSBjdXJyZW50bHlcbiAgLy8gYWRkaW5nIHN0YXRlbWVudHMgdG8uXG5cbiAgdmFyIGN1cjtcbiAgZm9yICh2YXIgc2F3RGVmYXVsdCA9IGZhbHNlOyB0aGlzLnR5cGUgIT09IHR5cGVzJDEuYnJhY2VSOykge1xuICAgIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuX2Nhc2UgfHwgdGhpcy50eXBlID09PSB0eXBlcyQxLl9kZWZhdWx0KSB7XG4gICAgICB2YXIgaXNDYXNlID0gdGhpcy50eXBlID09PSB0eXBlcyQxLl9jYXNlO1xuICAgICAgaWYgKGN1cikgeyB0aGlzLmZpbmlzaE5vZGUoY3VyLCBcIlN3aXRjaENhc2VcIik7IH1cbiAgICAgIG5vZGUuY2FzZXMucHVzaChjdXIgPSB0aGlzLnN0YXJ0Tm9kZSgpKTtcbiAgICAgIGN1ci5jb25zZXF1ZW50ID0gW107XG4gICAgICB0aGlzLm5leHQoKTtcbiAgICAgIGlmIChpc0Nhc2UpIHtcbiAgICAgICAgY3VyLnRlc3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHNhd0RlZmF1bHQpIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKHRoaXMubGFzdFRva1N0YXJ0LCBcIk11bHRpcGxlIGRlZmF1bHQgY2xhdXNlc1wiKTsgfVxuICAgICAgICBzYXdEZWZhdWx0ID0gdHJ1ZTtcbiAgICAgICAgY3VyLnRlc3QgPSBudWxsO1xuICAgICAgfVxuICAgICAgdGhpcy5leHBlY3QodHlwZXMkMS5jb2xvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghY3VyKSB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gICAgICBjdXIuY29uc2VxdWVudC5wdXNoKHRoaXMucGFyc2VTdGF0ZW1lbnQobnVsbCkpO1xuICAgIH1cbiAgfVxuICB0aGlzLmV4aXRTY29wZSgpO1xuICBpZiAoY3VyKSB7IHRoaXMuZmluaXNoTm9kZShjdXIsIFwiU3dpdGNoQ2FzZVwiKTsgfVxuICB0aGlzLm5leHQoKTsgLy8gQ2xvc2luZyBicmFjZVxuICB0aGlzLmxhYmVscy5wb3AoKTtcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIlN3aXRjaFN0YXRlbWVudFwiKVxufTtcblxucHAkOC5wYXJzZVRocm93U3RhdGVtZW50ID0gZnVuY3Rpb24obm9kZSkge1xuICB0aGlzLm5leHQoKTtcbiAgaWYgKGxpbmVCcmVhay50ZXN0KHRoaXMuaW5wdXQuc2xpY2UodGhpcy5sYXN0VG9rRW5kLCB0aGlzLnN0YXJ0KSkpXG4gICAgeyB0aGlzLnJhaXNlKHRoaXMubGFzdFRva0VuZCwgXCJJbGxlZ2FsIG5ld2xpbmUgYWZ0ZXIgdGhyb3dcIik7IH1cbiAgbm9kZS5hcmd1bWVudCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gIHRoaXMuc2VtaWNvbG9uKCk7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJUaHJvd1N0YXRlbWVudFwiKVxufTtcblxuLy8gUmV1c2VkIGVtcHR5IGFycmF5IGFkZGVkIGZvciBub2RlIGZpZWxkcyB0aGF0IGFyZSBhbHdheXMgZW1wdHkuXG5cbnZhciBlbXB0eSQxID0gW107XG5cbnBwJDgucGFyc2VDYXRjaENsYXVzZVBhcmFtID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwYXJhbSA9IHRoaXMucGFyc2VCaW5kaW5nQXRvbSgpO1xuICB2YXIgc2ltcGxlID0gcGFyYW0udHlwZSA9PT0gXCJJZGVudGlmaWVyXCI7XG4gIHRoaXMuZW50ZXJTY29wZShzaW1wbGUgPyBTQ09QRV9TSU1QTEVfQ0FUQ0ggOiAwKTtcbiAgdGhpcy5jaGVja0xWYWxQYXR0ZXJuKHBhcmFtLCBzaW1wbGUgPyBCSU5EX1NJTVBMRV9DQVRDSCA6IEJJTkRfTEVYSUNBTCk7XG4gIHRoaXMuZXhwZWN0KHR5cGVzJDEucGFyZW5SKTtcblxuICByZXR1cm4gcGFyYW1cbn07XG5cbnBwJDgucGFyc2VUcnlTdGF0ZW1lbnQgPSBmdW5jdGlvbihub2RlKSB7XG4gIHRoaXMubmV4dCgpO1xuICBub2RlLmJsb2NrID0gdGhpcy5wYXJzZUJsb2NrKCk7XG4gIG5vZGUuaGFuZGxlciA9IG51bGw7XG4gIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuX2NhdGNoKSB7XG4gICAgdmFyIGNsYXVzZSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gICAgdGhpcy5uZXh0KCk7XG4gICAgaWYgKHRoaXMuZWF0KHR5cGVzJDEucGFyZW5MKSkge1xuICAgICAgY2xhdXNlLnBhcmFtID0gdGhpcy5wYXJzZUNhdGNoQ2xhdXNlUGFyYW0oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA8IDEwKSB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gICAgICBjbGF1c2UucGFyYW0gPSBudWxsO1xuICAgICAgdGhpcy5lbnRlclNjb3BlKDApO1xuICAgIH1cbiAgICBjbGF1c2UuYm9keSA9IHRoaXMucGFyc2VCbG9jayhmYWxzZSk7XG4gICAgdGhpcy5leGl0U2NvcGUoKTtcbiAgICBub2RlLmhhbmRsZXIgPSB0aGlzLmZpbmlzaE5vZGUoY2xhdXNlLCBcIkNhdGNoQ2xhdXNlXCIpO1xuICB9XG4gIG5vZGUuZmluYWxpemVyID0gdGhpcy5lYXQodHlwZXMkMS5fZmluYWxseSkgPyB0aGlzLnBhcnNlQmxvY2soKSA6IG51bGw7XG4gIGlmICghbm9kZS5oYW5kbGVyICYmICFub2RlLmZpbmFsaXplcilcbiAgICB7IHRoaXMucmFpc2Uobm9kZS5zdGFydCwgXCJNaXNzaW5nIGNhdGNoIG9yIGZpbmFsbHkgY2xhdXNlXCIpOyB9XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJUcnlTdGF0ZW1lbnRcIilcbn07XG5cbnBwJDgucGFyc2VWYXJTdGF0ZW1lbnQgPSBmdW5jdGlvbihub2RlLCBraW5kLCBhbGxvd01pc3NpbmdJbml0aWFsaXplcikge1xuICB0aGlzLm5leHQoKTtcbiAgdGhpcy5wYXJzZVZhcihub2RlLCBmYWxzZSwga2luZCwgYWxsb3dNaXNzaW5nSW5pdGlhbGl6ZXIpO1xuICB0aGlzLnNlbWljb2xvbigpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiVmFyaWFibGVEZWNsYXJhdGlvblwiKVxufTtcblxucHAkOC5wYXJzZVdoaWxlU3RhdGVtZW50ID0gZnVuY3Rpb24obm9kZSkge1xuICB0aGlzLm5leHQoKTtcbiAgbm9kZS50ZXN0ID0gdGhpcy5wYXJzZVBhcmVuRXhwcmVzc2lvbigpO1xuICB0aGlzLmxhYmVscy5wdXNoKGxvb3BMYWJlbCk7XG4gIG5vZGUuYm9keSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoXCJ3aGlsZVwiKTtcbiAgdGhpcy5sYWJlbHMucG9wKCk7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJXaGlsZVN0YXRlbWVudFwiKVxufTtcblxucHAkOC5wYXJzZVdpdGhTdGF0ZW1lbnQgPSBmdW5jdGlvbihub2RlKSB7XG4gIGlmICh0aGlzLnN0cmljdCkgeyB0aGlzLnJhaXNlKHRoaXMuc3RhcnQsIFwiJ3dpdGgnIGluIHN0cmljdCBtb2RlXCIpOyB9XG4gIHRoaXMubmV4dCgpO1xuICBub2RlLm9iamVjdCA9IHRoaXMucGFyc2VQYXJlbkV4cHJlc3Npb24oKTtcbiAgbm9kZS5ib2R5ID0gdGhpcy5wYXJzZVN0YXRlbWVudChcIndpdGhcIik7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJXaXRoU3RhdGVtZW50XCIpXG59O1xuXG5wcCQ4LnBhcnNlRW1wdHlTdGF0ZW1lbnQgPSBmdW5jdGlvbihub2RlKSB7XG4gIHRoaXMubmV4dCgpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiRW1wdHlTdGF0ZW1lbnRcIilcbn07XG5cbnBwJDgucGFyc2VMYWJlbGVkU3RhdGVtZW50ID0gZnVuY3Rpb24obm9kZSwgbWF5YmVOYW1lLCBleHByLCBjb250ZXh0KSB7XG4gIGZvciAodmFyIGkkMSA9IDAsIGxpc3QgPSB0aGlzLmxhYmVsczsgaSQxIDwgbGlzdC5sZW5ndGg7IGkkMSArPSAxKVxuICAgIHtcbiAgICB2YXIgbGFiZWwgPSBsaXN0W2kkMV07XG5cbiAgICBpZiAobGFiZWwubmFtZSA9PT0gbWF5YmVOYW1lKVxuICAgICAgeyB0aGlzLnJhaXNlKGV4cHIuc3RhcnQsIFwiTGFiZWwgJ1wiICsgbWF5YmVOYW1lICsgXCInIGlzIGFscmVhZHkgZGVjbGFyZWRcIik7XG4gIH0gfVxuICB2YXIga2luZCA9IHRoaXMudHlwZS5pc0xvb3AgPyBcImxvb3BcIiA6IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5fc3dpdGNoID8gXCJzd2l0Y2hcIiA6IG51bGw7XG4gIGZvciAodmFyIGkgPSB0aGlzLmxhYmVscy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIHZhciBsYWJlbCQxID0gdGhpcy5sYWJlbHNbaV07XG4gICAgaWYgKGxhYmVsJDEuc3RhdGVtZW50U3RhcnQgPT09IG5vZGUuc3RhcnQpIHtcbiAgICAgIC8vIFVwZGF0ZSBpbmZvcm1hdGlvbiBhYm91dCBwcmV2aW91cyBsYWJlbHMgb24gdGhpcyBub2RlXG4gICAgICBsYWJlbCQxLnN0YXRlbWVudFN0YXJ0ID0gdGhpcy5zdGFydDtcbiAgICAgIGxhYmVsJDEua2luZCA9IGtpbmQ7XG4gICAgfSBlbHNlIHsgYnJlYWsgfVxuICB9XG4gIHRoaXMubGFiZWxzLnB1c2goe25hbWU6IG1heWJlTmFtZSwga2luZDoga2luZCwgc3RhdGVtZW50U3RhcnQ6IHRoaXMuc3RhcnR9KTtcbiAgbm9kZS5ib2R5ID0gdGhpcy5wYXJzZVN0YXRlbWVudChjb250ZXh0ID8gY29udGV4dC5pbmRleE9mKFwibGFiZWxcIikgPT09IC0xID8gY29udGV4dCArIFwibGFiZWxcIiA6IGNvbnRleHQgOiBcImxhYmVsXCIpO1xuICB0aGlzLmxhYmVscy5wb3AoKTtcbiAgbm9kZS5sYWJlbCA9IGV4cHI7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJMYWJlbGVkU3RhdGVtZW50XCIpXG59O1xuXG5wcCQ4LnBhcnNlRXhwcmVzc2lvblN0YXRlbWVudCA9IGZ1bmN0aW9uKG5vZGUsIGV4cHIpIHtcbiAgbm9kZS5leHByZXNzaW9uID0gZXhwcjtcbiAgdGhpcy5zZW1pY29sb24oKTtcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIkV4cHJlc3Npb25TdGF0ZW1lbnRcIilcbn07XG5cbi8vIFBhcnNlIGEgc2VtaWNvbG9uLWVuY2xvc2VkIGJsb2NrIG9mIHN0YXRlbWVudHMsIGhhbmRsaW5nIGBcInVzZVxuLy8gc3RyaWN0XCJgIGRlY2xhcmF0aW9ucyB3aGVuIGBhbGxvd1N0cmljdGAgaXMgdHJ1ZSAodXNlZCBmb3Jcbi8vIGZ1bmN0aW9uIGJvZGllcykuXG5cbnBwJDgucGFyc2VCbG9jayA9IGZ1bmN0aW9uKGNyZWF0ZU5ld0xleGljYWxTY29wZSwgbm9kZSwgZXhpdFN0cmljdCkge1xuICBpZiAoIGNyZWF0ZU5ld0xleGljYWxTY29wZSA9PT0gdm9pZCAwICkgY3JlYXRlTmV3TGV4aWNhbFNjb3BlID0gdHJ1ZTtcbiAgaWYgKCBub2RlID09PSB2b2lkIDAgKSBub2RlID0gdGhpcy5zdGFydE5vZGUoKTtcblxuICBub2RlLmJvZHkgPSBbXTtcbiAgdGhpcy5leHBlY3QodHlwZXMkMS5icmFjZUwpO1xuICBpZiAoY3JlYXRlTmV3TGV4aWNhbFNjb3BlKSB7IHRoaXMuZW50ZXJTY29wZSgwKTsgfVxuICB3aGlsZSAodGhpcy50eXBlICE9PSB0eXBlcyQxLmJyYWNlUikge1xuICAgIHZhciBzdG10ID0gdGhpcy5wYXJzZVN0YXRlbWVudChudWxsKTtcbiAgICBub2RlLmJvZHkucHVzaChzdG10KTtcbiAgfVxuICBpZiAoZXhpdFN0cmljdCkgeyB0aGlzLnN0cmljdCA9IGZhbHNlOyB9XG4gIHRoaXMubmV4dCgpO1xuICBpZiAoY3JlYXRlTmV3TGV4aWNhbFNjb3BlKSB7IHRoaXMuZXhpdFNjb3BlKCk7IH1cbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIkJsb2NrU3RhdGVtZW50XCIpXG59O1xuXG4vLyBQYXJzZSBhIHJlZ3VsYXIgYGZvcmAgbG9vcC4gVGhlIGRpc2FtYmlndWF0aW9uIGNvZGUgaW5cbi8vIGBwYXJzZVN0YXRlbWVudGAgd2lsbCBhbHJlYWR5IGhhdmUgcGFyc2VkIHRoZSBpbml0IHN0YXRlbWVudCBvclxuLy8gZXhwcmVzc2lvbi5cblxucHAkOC5wYXJzZUZvciA9IGZ1bmN0aW9uKG5vZGUsIGluaXQpIHtcbiAgbm9kZS5pbml0ID0gaW5pdDtcbiAgdGhpcy5leHBlY3QodHlwZXMkMS5zZW1pKTtcbiAgbm9kZS50ZXN0ID0gdGhpcy50eXBlID09PSB0eXBlcyQxLnNlbWkgPyBudWxsIDogdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgdGhpcy5leHBlY3QodHlwZXMkMS5zZW1pKTtcbiAgbm9kZS51cGRhdGUgPSB0aGlzLnR5cGUgPT09IHR5cGVzJDEucGFyZW5SID8gbnVsbCA6IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gIHRoaXMuZXhwZWN0KHR5cGVzJDEucGFyZW5SKTtcbiAgbm9kZS5ib2R5ID0gdGhpcy5wYXJzZVN0YXRlbWVudChcImZvclwiKTtcbiAgdGhpcy5leGl0U2NvcGUoKTtcbiAgdGhpcy5sYWJlbHMucG9wKCk7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJGb3JTdGF0ZW1lbnRcIilcbn07XG5cbi8vIFBhcnNlIGEgYGZvcmAvYGluYCBhbmQgYGZvcmAvYG9mYCBsb29wLCB3aGljaCBhcmUgYWxtb3N0XG4vLyBzYW1lIGZyb20gcGFyc2VyJ3MgcGVyc3BlY3RpdmUuXG5cbnBwJDgucGFyc2VGb3JJbiA9IGZ1bmN0aW9uKG5vZGUsIGluaXQpIHtcbiAgdmFyIGlzRm9ySW4gPSB0aGlzLnR5cGUgPT09IHR5cGVzJDEuX2luO1xuICB0aGlzLm5leHQoKTtcblxuICBpZiAoXG4gICAgaW5pdC50eXBlID09PSBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIiAmJlxuICAgIGluaXQuZGVjbGFyYXRpb25zWzBdLmluaXQgIT0gbnVsbCAmJlxuICAgIChcbiAgICAgICFpc0ZvckluIHx8XG4gICAgICB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPCA4IHx8XG4gICAgICB0aGlzLnN0cmljdCB8fFxuICAgICAgaW5pdC5raW5kICE9PSBcInZhclwiIHx8XG4gICAgICBpbml0LmRlY2xhcmF0aW9uc1swXS5pZC50eXBlICE9PSBcIklkZW50aWZpZXJcIlxuICAgIClcbiAgKSB7XG4gICAgdGhpcy5yYWlzZShcbiAgICAgIGluaXQuc3RhcnQsXG4gICAgICAoKGlzRm9ySW4gPyBcImZvci1pblwiIDogXCJmb3Itb2ZcIikgKyBcIiBsb29wIHZhcmlhYmxlIGRlY2xhcmF0aW9uIG1heSBub3QgaGF2ZSBhbiBpbml0aWFsaXplclwiKVxuICAgICk7XG4gIH1cbiAgbm9kZS5sZWZ0ID0gaW5pdDtcbiAgbm9kZS5yaWdodCA9IGlzRm9ySW4gPyB0aGlzLnBhcnNlRXhwcmVzc2lvbigpIDogdGhpcy5wYXJzZU1heWJlQXNzaWduKCk7XG4gIHRoaXMuZXhwZWN0KHR5cGVzJDEucGFyZW5SKTtcbiAgbm9kZS5ib2R5ID0gdGhpcy5wYXJzZVN0YXRlbWVudChcImZvclwiKTtcbiAgdGhpcy5leGl0U2NvcGUoKTtcbiAgdGhpcy5sYWJlbHMucG9wKCk7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgaXNGb3JJbiA/IFwiRm9ySW5TdGF0ZW1lbnRcIiA6IFwiRm9yT2ZTdGF0ZW1lbnRcIilcbn07XG5cbi8vIFBhcnNlIGEgbGlzdCBvZiB2YXJpYWJsZSBkZWNsYXJhdGlvbnMuXG5cbnBwJDgucGFyc2VWYXIgPSBmdW5jdGlvbihub2RlLCBpc0Zvciwga2luZCwgYWxsb3dNaXNzaW5nSW5pdGlhbGl6ZXIpIHtcbiAgbm9kZS5kZWNsYXJhdGlvbnMgPSBbXTtcbiAgbm9kZS5raW5kID0ga2luZDtcbiAgZm9yICg7Oykge1xuICAgIHZhciBkZWNsID0gdGhpcy5zdGFydE5vZGUoKTtcbiAgICB0aGlzLnBhcnNlVmFySWQoZGVjbCwga2luZCk7XG4gICAgaWYgKHRoaXMuZWF0KHR5cGVzJDEuZXEpKSB7XG4gICAgICBkZWNsLmluaXQgPSB0aGlzLnBhcnNlTWF5YmVBc3NpZ24oaXNGb3IpO1xuICAgIH0gZWxzZSBpZiAoIWFsbG93TWlzc2luZ0luaXRpYWxpemVyICYmIGtpbmQgPT09IFwiY29uc3RcIiAmJiAhKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5faW4gfHwgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2ICYmIHRoaXMuaXNDb250ZXh0dWFsKFwib2ZcIikpKSkge1xuICAgICAgdGhpcy51bmV4cGVjdGVkKCk7XG4gICAgfSBlbHNlIGlmICghYWxsb3dNaXNzaW5nSW5pdGlhbGl6ZXIgJiYgKGtpbmQgPT09IFwidXNpbmdcIiB8fCBraW5kID09PSBcImF3YWl0IHVzaW5nXCIpICYmIHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSAxNyAmJiB0aGlzLnR5cGUgIT09IHR5cGVzJDEuX2luICYmICF0aGlzLmlzQ29udGV4dHVhbChcIm9mXCIpKSB7XG4gICAgICB0aGlzLnJhaXNlKHRoaXMubGFzdFRva0VuZCwgKFwiTWlzc2luZyBpbml0aWFsaXplciBpbiBcIiArIGtpbmQgKyBcIiBkZWNsYXJhdGlvblwiKSk7XG4gICAgfSBlbHNlIGlmICghYWxsb3dNaXNzaW5nSW5pdGlhbGl6ZXIgJiYgZGVjbC5pZC50eXBlICE9PSBcIklkZW50aWZpZXJcIiAmJiAhKGlzRm9yICYmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuX2luIHx8IHRoaXMuaXNDb250ZXh0dWFsKFwib2ZcIikpKSkge1xuICAgICAgdGhpcy5yYWlzZSh0aGlzLmxhc3RUb2tFbmQsIFwiQ29tcGxleCBiaW5kaW5nIHBhdHRlcm5zIHJlcXVpcmUgYW4gaW5pdGlhbGl6YXRpb24gdmFsdWVcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlY2wuaW5pdCA9IG51bGw7XG4gICAgfVxuICAgIG5vZGUuZGVjbGFyYXRpb25zLnB1c2godGhpcy5maW5pc2hOb2RlKGRlY2wsIFwiVmFyaWFibGVEZWNsYXJhdG9yXCIpKTtcbiAgICBpZiAoIXRoaXMuZWF0KHR5cGVzJDEuY29tbWEpKSB7IGJyZWFrIH1cbiAgfVxuICByZXR1cm4gbm9kZVxufTtcblxucHAkOC5wYXJzZVZhcklkID0gZnVuY3Rpb24oZGVjbCwga2luZCkge1xuICBkZWNsLmlkID0ga2luZCA9PT0gXCJ1c2luZ1wiIHx8IGtpbmQgPT09IFwiYXdhaXQgdXNpbmdcIlxuICAgID8gdGhpcy5wYXJzZUlkZW50KClcbiAgICA6IHRoaXMucGFyc2VCaW5kaW5nQXRvbSgpO1xuXG4gIHRoaXMuY2hlY2tMVmFsUGF0dGVybihkZWNsLmlkLCBraW5kID09PSBcInZhclwiID8gQklORF9WQVIgOiBCSU5EX0xFWElDQUwsIGZhbHNlKTtcbn07XG5cbnZhciBGVU5DX1NUQVRFTUVOVCA9IDEsIEZVTkNfSEFOR0lOR19TVEFURU1FTlQgPSAyLCBGVU5DX05VTExBQkxFX0lEID0gNDtcblxuLy8gUGFyc2UgYSBmdW5jdGlvbiBkZWNsYXJhdGlvbiBvciBsaXRlcmFsIChkZXBlbmRpbmcgb24gdGhlXG4vLyBgc3RhdGVtZW50ICYgRlVOQ19TVEFURU1FTlRgKS5cblxuLy8gUmVtb3ZlIGBhbGxvd0V4cHJlc3Npb25Cb2R5YCBmb3IgNy4wLjAsIGFzIGl0IGlzIG9ubHkgY2FsbGVkIHdpdGggZmFsc2VcbnBwJDgucGFyc2VGdW5jdGlvbiA9IGZ1bmN0aW9uKG5vZGUsIHN0YXRlbWVudCwgYWxsb3dFeHByZXNzaW9uQm9keSwgaXNBc3luYywgZm9ySW5pdCkge1xuICB0aGlzLmluaXRGdW5jdGlvbihub2RlKTtcbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA5IHx8IHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2ICYmICFpc0FzeW5jKSB7XG4gICAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5zdGFyICYmIChzdGF0ZW1lbnQgJiBGVU5DX0hBTkdJTkdfU1RBVEVNRU5UKSlcbiAgICAgIHsgdGhpcy51bmV4cGVjdGVkKCk7IH1cbiAgICBub2RlLmdlbmVyYXRvciA9IHRoaXMuZWF0KHR5cGVzJDEuc3Rhcik7XG4gIH1cbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA4KVxuICAgIHsgbm9kZS5hc3luYyA9ICEhaXNBc3luYzsgfVxuXG4gIGlmIChzdGF0ZW1lbnQgJiBGVU5DX1NUQVRFTUVOVCkge1xuICAgIG5vZGUuaWQgPSAoc3RhdGVtZW50ICYgRlVOQ19OVUxMQUJMRV9JRCkgJiYgdGhpcy50eXBlICE9PSB0eXBlcyQxLm5hbWUgPyBudWxsIDogdGhpcy5wYXJzZUlkZW50KCk7XG4gICAgaWYgKG5vZGUuaWQgJiYgIShzdGF0ZW1lbnQgJiBGVU5DX0hBTkdJTkdfU1RBVEVNRU5UKSlcbiAgICAgIC8vIElmIGl0IGlzIGEgcmVndWxhciBmdW5jdGlvbiBkZWNsYXJhdGlvbiBpbiBzbG9wcHkgbW9kZSwgdGhlbiBpdCBpc1xuICAgICAgLy8gc3ViamVjdCB0byBBbm5leCBCIHNlbWFudGljcyAoQklORF9GVU5DVElPTikuIE90aGVyd2lzZSwgdGhlIGJpbmRpbmdcbiAgICAgIC8vIG1vZGUgZGVwZW5kcyBvbiBwcm9wZXJ0aWVzIG9mIHRoZSBjdXJyZW50IHNjb3BlIChzZWVcbiAgICAgIC8vIHRyZWF0RnVuY3Rpb25zQXNWYXIpLlxuICAgICAgeyB0aGlzLmNoZWNrTFZhbFNpbXBsZShub2RlLmlkLCAodGhpcy5zdHJpY3QgfHwgbm9kZS5nZW5lcmF0b3IgfHwgbm9kZS5hc3luYykgPyB0aGlzLnRyZWF0RnVuY3Rpb25zQXNWYXIgPyBCSU5EX1ZBUiA6IEJJTkRfTEVYSUNBTCA6IEJJTkRfRlVOQ1RJT04pOyB9XG4gIH1cblxuICB2YXIgb2xkWWllbGRQb3MgPSB0aGlzLnlpZWxkUG9zLCBvbGRBd2FpdFBvcyA9IHRoaXMuYXdhaXRQb3MsIG9sZEF3YWl0SWRlbnRQb3MgPSB0aGlzLmF3YWl0SWRlbnRQb3M7XG4gIHRoaXMueWllbGRQb3MgPSAwO1xuICB0aGlzLmF3YWl0UG9zID0gMDtcbiAgdGhpcy5hd2FpdElkZW50UG9zID0gMDtcbiAgdGhpcy5lbnRlclNjb3BlKGZ1bmN0aW9uRmxhZ3Mobm9kZS5hc3luYywgbm9kZS5nZW5lcmF0b3IpKTtcblxuICBpZiAoIShzdGF0ZW1lbnQgJiBGVU5DX1NUQVRFTUVOVCkpXG4gICAgeyBub2RlLmlkID0gdGhpcy50eXBlID09PSB0eXBlcyQxLm5hbWUgPyB0aGlzLnBhcnNlSWRlbnQoKSA6IG51bGw7IH1cblxuICB0aGlzLnBhcnNlRnVuY3Rpb25QYXJhbXMobm9kZSk7XG4gIHRoaXMucGFyc2VGdW5jdGlvbkJvZHkobm9kZSwgYWxsb3dFeHByZXNzaW9uQm9keSwgZmFsc2UsIGZvckluaXQpO1xuXG4gIHRoaXMueWllbGRQb3MgPSBvbGRZaWVsZFBvcztcbiAgdGhpcy5hd2FpdFBvcyA9IG9sZEF3YWl0UG9zO1xuICB0aGlzLmF3YWl0SWRlbnRQb3MgPSBvbGRBd2FpdElkZW50UG9zO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIChzdGF0ZW1lbnQgJiBGVU5DX1NUQVRFTUVOVCkgPyBcIkZ1bmN0aW9uRGVjbGFyYXRpb25cIiA6IFwiRnVuY3Rpb25FeHByZXNzaW9uXCIpXG59O1xuXG5wcCQ4LnBhcnNlRnVuY3Rpb25QYXJhbXMgPSBmdW5jdGlvbihub2RlKSB7XG4gIHRoaXMuZXhwZWN0KHR5cGVzJDEucGFyZW5MKTtcbiAgbm9kZS5wYXJhbXMgPSB0aGlzLnBhcnNlQmluZGluZ0xpc3QodHlwZXMkMS5wYXJlblIsIGZhbHNlLCB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOCk7XG4gIHRoaXMuY2hlY2tZaWVsZEF3YWl0SW5EZWZhdWx0UGFyYW1zKCk7XG59O1xuXG4vLyBQYXJzZSBhIGNsYXNzIGRlY2xhcmF0aW9uIG9yIGxpdGVyYWwgKGRlcGVuZGluZyBvbiB0aGVcbi8vIGBpc1N0YXRlbWVudGAgcGFyYW1ldGVyKS5cblxucHAkOC5wYXJzZUNsYXNzID0gZnVuY3Rpb24obm9kZSwgaXNTdGF0ZW1lbnQpIHtcbiAgdGhpcy5uZXh0KCk7XG5cbiAgLy8gZWNtYS0yNjIgMTQuNiBDbGFzcyBEZWZpbml0aW9uc1xuICAvLyBBIGNsYXNzIGRlZmluaXRpb24gaXMgYWx3YXlzIHN0cmljdCBtb2RlIGNvZGUuXG4gIHZhciBvbGRTdHJpY3QgPSB0aGlzLnN0cmljdDtcbiAgdGhpcy5zdHJpY3QgPSB0cnVlO1xuXG4gIHRoaXMucGFyc2VDbGFzc0lkKG5vZGUsIGlzU3RhdGVtZW50KTtcbiAgdGhpcy5wYXJzZUNsYXNzU3VwZXIobm9kZSk7XG4gIHZhciBwcml2YXRlTmFtZU1hcCA9IHRoaXMuZW50ZXJDbGFzc0JvZHkoKTtcbiAgdmFyIGNsYXNzQm9keSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gIHZhciBoYWRDb25zdHJ1Y3RvciA9IGZhbHNlO1xuICBjbGFzc0JvZHkuYm9keSA9IFtdO1xuICB0aGlzLmV4cGVjdCh0eXBlcyQxLmJyYWNlTCk7XG4gIHdoaWxlICh0aGlzLnR5cGUgIT09IHR5cGVzJDEuYnJhY2VSKSB7XG4gICAgdmFyIGVsZW1lbnQgPSB0aGlzLnBhcnNlQ2xhc3NFbGVtZW50KG5vZGUuc3VwZXJDbGFzcyAhPT0gbnVsbCk7XG4gICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgIGNsYXNzQm9keS5ib2R5LnB1c2goZWxlbWVudCk7XG4gICAgICBpZiAoZWxlbWVudC50eXBlID09PSBcIk1ldGhvZERlZmluaXRpb25cIiAmJiBlbGVtZW50LmtpbmQgPT09IFwiY29uc3RydWN0b3JcIikge1xuICAgICAgICBpZiAoaGFkQ29uc3RydWN0b3IpIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKGVsZW1lbnQuc3RhcnQsIFwiRHVwbGljYXRlIGNvbnN0cnVjdG9yIGluIHRoZSBzYW1lIGNsYXNzXCIpOyB9XG4gICAgICAgIGhhZENvbnN0cnVjdG9yID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoZWxlbWVudC5rZXkgJiYgZWxlbWVudC5rZXkudHlwZSA9PT0gXCJQcml2YXRlSWRlbnRpZmllclwiICYmIGlzUHJpdmF0ZU5hbWVDb25mbGljdGVkKHByaXZhdGVOYW1lTWFwLCBlbGVtZW50KSkge1xuICAgICAgICB0aGlzLnJhaXNlUmVjb3ZlcmFibGUoZWxlbWVudC5rZXkuc3RhcnQsIChcIklkZW50aWZpZXIgJyNcIiArIChlbGVtZW50LmtleS5uYW1lKSArIFwiJyBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCIpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgdGhpcy5zdHJpY3QgPSBvbGRTdHJpY3Q7XG4gIHRoaXMubmV4dCgpO1xuICBub2RlLmJvZHkgPSB0aGlzLmZpbmlzaE5vZGUoY2xhc3NCb2R5LCBcIkNsYXNzQm9keVwiKTtcbiAgdGhpcy5leGl0Q2xhc3NCb2R5KCk7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgaXNTdGF0ZW1lbnQgPyBcIkNsYXNzRGVjbGFyYXRpb25cIiA6IFwiQ2xhc3NFeHByZXNzaW9uXCIpXG59O1xuXG5wcCQ4LnBhcnNlQ2xhc3NFbGVtZW50ID0gZnVuY3Rpb24oY29uc3RydWN0b3JBbGxvd3NTdXBlcikge1xuICBpZiAodGhpcy5lYXQodHlwZXMkMS5zZW1pKSkgeyByZXR1cm4gbnVsbCB9XG5cbiAgdmFyIGVjbWFWZXJzaW9uID0gdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uO1xuICB2YXIgbm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gIHZhciBrZXlOYW1lID0gXCJcIjtcbiAgdmFyIGlzR2VuZXJhdG9yID0gZmFsc2U7XG4gIHZhciBpc0FzeW5jID0gZmFsc2U7XG4gIHZhciBraW5kID0gXCJtZXRob2RcIjtcbiAgdmFyIGlzU3RhdGljID0gZmFsc2U7XG5cbiAgaWYgKHRoaXMuZWF0Q29udGV4dHVhbChcInN0YXRpY1wiKSkge1xuICAgIC8vIFBhcnNlIHN0YXRpYyBpbml0IGJsb2NrXG4gICAgaWYgKGVjbWFWZXJzaW9uID49IDEzICYmIHRoaXMuZWF0KHR5cGVzJDEuYnJhY2VMKSkge1xuICAgICAgdGhpcy5wYXJzZUNsYXNzU3RhdGljQmxvY2sobm9kZSk7XG4gICAgICByZXR1cm4gbm9kZVxuICAgIH1cbiAgICBpZiAodGhpcy5pc0NsYXNzRWxlbWVudE5hbWVTdGFydCgpIHx8IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5zdGFyKSB7XG4gICAgICBpc1N0YXRpYyA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtleU5hbWUgPSBcInN0YXRpY1wiO1xuICAgIH1cbiAgfVxuICBub2RlLnN0YXRpYyA9IGlzU3RhdGljO1xuICBpZiAoIWtleU5hbWUgJiYgZWNtYVZlcnNpb24gPj0gOCAmJiB0aGlzLmVhdENvbnRleHR1YWwoXCJhc3luY1wiKSkge1xuICAgIGlmICgodGhpcy5pc0NsYXNzRWxlbWVudE5hbWVTdGFydCgpIHx8IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5zdGFyKSAmJiAhdGhpcy5jYW5JbnNlcnRTZW1pY29sb24oKSkge1xuICAgICAgaXNBc3luYyA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtleU5hbWUgPSBcImFzeW5jXCI7XG4gICAgfVxuICB9XG4gIGlmICgha2V5TmFtZSAmJiAoZWNtYVZlcnNpb24gPj0gOSB8fCAhaXNBc3luYykgJiYgdGhpcy5lYXQodHlwZXMkMS5zdGFyKSkge1xuICAgIGlzR2VuZXJhdG9yID0gdHJ1ZTtcbiAgfVxuICBpZiAoIWtleU5hbWUgJiYgIWlzQXN5bmMgJiYgIWlzR2VuZXJhdG9yKSB7XG4gICAgdmFyIGxhc3RWYWx1ZSA9IHRoaXMudmFsdWU7XG4gICAgaWYgKHRoaXMuZWF0Q29udGV4dHVhbChcImdldFwiKSB8fCB0aGlzLmVhdENvbnRleHR1YWwoXCJzZXRcIikpIHtcbiAgICAgIGlmICh0aGlzLmlzQ2xhc3NFbGVtZW50TmFtZVN0YXJ0KCkpIHtcbiAgICAgICAga2luZCA9IGxhc3RWYWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGtleU5hbWUgPSBsYXN0VmFsdWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gUGFyc2UgZWxlbWVudCBuYW1lXG4gIGlmIChrZXlOYW1lKSB7XG4gICAgLy8gJ2FzeW5jJywgJ2dldCcsICdzZXQnLCBvciAnc3RhdGljJyB3ZXJlIG5vdCBhIGtleXdvcmQgY29udGV4dHVhbGx5LlxuICAgIC8vIFRoZSBsYXN0IHRva2VuIGlzIGFueSBvZiB0aG9zZS4gTWFrZSBpdCB0aGUgZWxlbWVudCBuYW1lLlxuICAgIG5vZGUuY29tcHV0ZWQgPSBmYWxzZTtcbiAgICBub2RlLmtleSA9IHRoaXMuc3RhcnROb2RlQXQodGhpcy5sYXN0VG9rU3RhcnQsIHRoaXMubGFzdFRva1N0YXJ0TG9jKTtcbiAgICBub2RlLmtleS5uYW1lID0ga2V5TmFtZTtcbiAgICB0aGlzLmZpbmlzaE5vZGUobm9kZS5rZXksIFwiSWRlbnRpZmllclwiKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnBhcnNlQ2xhc3NFbGVtZW50TmFtZShub2RlKTtcbiAgfVxuXG4gIC8vIFBhcnNlIGVsZW1lbnQgdmFsdWVcbiAgaWYgKGVjbWFWZXJzaW9uIDwgMTMgfHwgdGhpcy50eXBlID09PSB0eXBlcyQxLnBhcmVuTCB8fCBraW5kICE9PSBcIm1ldGhvZFwiIHx8IGlzR2VuZXJhdG9yIHx8IGlzQXN5bmMpIHtcbiAgICB2YXIgaXNDb25zdHJ1Y3RvciA9ICFub2RlLnN0YXRpYyAmJiBjaGVja0tleU5hbWUobm9kZSwgXCJjb25zdHJ1Y3RvclwiKTtcbiAgICB2YXIgYWxsb3dzRGlyZWN0U3VwZXIgPSBpc0NvbnN0cnVjdG9yICYmIGNvbnN0cnVjdG9yQWxsb3dzU3VwZXI7XG4gICAgLy8gQ291bGRuJ3QgbW92ZSB0aGlzIGNoZWNrIGludG8gdGhlICdwYXJzZUNsYXNzTWV0aG9kJyBtZXRob2QgZm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHkuXG4gICAgaWYgKGlzQ29uc3RydWN0b3IgJiYga2luZCAhPT0gXCJtZXRob2RcIikgeyB0aGlzLnJhaXNlKG5vZGUua2V5LnN0YXJ0LCBcIkNvbnN0cnVjdG9yIGNhbid0IGhhdmUgZ2V0L3NldCBtb2RpZmllclwiKTsgfVxuICAgIG5vZGUua2luZCA9IGlzQ29uc3RydWN0b3IgPyBcImNvbnN0cnVjdG9yXCIgOiBraW5kO1xuICAgIHRoaXMucGFyc2VDbGFzc01ldGhvZChub2RlLCBpc0dlbmVyYXRvciwgaXNBc3luYywgYWxsb3dzRGlyZWN0U3VwZXIpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMucGFyc2VDbGFzc0ZpZWxkKG5vZGUpO1xuICB9XG5cbiAgcmV0dXJuIG5vZGVcbn07XG5cbnBwJDguaXNDbGFzc0VsZW1lbnROYW1lU3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIChcbiAgICB0aGlzLnR5cGUgPT09IHR5cGVzJDEubmFtZSB8fFxuICAgIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5wcml2YXRlSWQgfHxcbiAgICB0aGlzLnR5cGUgPT09IHR5cGVzJDEubnVtIHx8XG4gICAgdGhpcy50eXBlID09PSB0eXBlcyQxLnN0cmluZyB8fFxuICAgIHRoaXMudHlwZSA9PT0gdHlwZXMkMS5icmFja2V0TCB8fFxuICAgIHRoaXMudHlwZS5rZXl3b3JkXG4gIClcbn07XG5cbnBwJDgucGFyc2VDbGFzc0VsZW1lbnROYW1lID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLnByaXZhdGVJZCkge1xuICAgIGlmICh0aGlzLnZhbHVlID09PSBcImNvbnN0cnVjdG9yXCIpIHtcbiAgICAgIHRoaXMucmFpc2UodGhpcy5zdGFydCwgXCJDbGFzc2VzIGNhbid0IGhhdmUgYW4gZWxlbWVudCBuYW1lZCAnI2NvbnN0cnVjdG9yJ1wiKTtcbiAgICB9XG4gICAgZWxlbWVudC5jb21wdXRlZCA9IGZhbHNlO1xuICAgIGVsZW1lbnQua2V5ID0gdGhpcy5wYXJzZVByaXZhdGVJZGVudCgpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMucGFyc2VQcm9wZXJ0eU5hbWUoZWxlbWVudCk7XG4gIH1cbn07XG5cbnBwJDgucGFyc2VDbGFzc01ldGhvZCA9IGZ1bmN0aW9uKG1ldGhvZCwgaXNHZW5lcmF0b3IsIGlzQXN5bmMsIGFsbG93c0RpcmVjdFN1cGVyKSB7XG4gIC8vIENoZWNrIGtleSBhbmQgZmxhZ3NcbiAgdmFyIGtleSA9IG1ldGhvZC5rZXk7XG4gIGlmIChtZXRob2Qua2luZCA9PT0gXCJjb25zdHJ1Y3RvclwiKSB7XG4gICAgaWYgKGlzR2VuZXJhdG9yKSB7IHRoaXMucmFpc2Uoa2V5LnN0YXJ0LCBcIkNvbnN0cnVjdG9yIGNhbid0IGJlIGEgZ2VuZXJhdG9yXCIpOyB9XG4gICAgaWYgKGlzQXN5bmMpIHsgdGhpcy5yYWlzZShrZXkuc3RhcnQsIFwiQ29uc3RydWN0b3IgY2FuJ3QgYmUgYW4gYXN5bmMgbWV0aG9kXCIpOyB9XG4gIH0gZWxzZSBpZiAobWV0aG9kLnN0YXRpYyAmJiBjaGVja0tleU5hbWUobWV0aG9kLCBcInByb3RvdHlwZVwiKSkge1xuICAgIHRoaXMucmFpc2Uoa2V5LnN0YXJ0LCBcIkNsYXNzZXMgbWF5IG5vdCBoYXZlIGEgc3RhdGljIHByb3BlcnR5IG5hbWVkIHByb3RvdHlwZVwiKTtcbiAgfVxuXG4gIC8vIFBhcnNlIHZhbHVlXG4gIHZhciB2YWx1ZSA9IG1ldGhvZC52YWx1ZSA9IHRoaXMucGFyc2VNZXRob2QoaXNHZW5lcmF0b3IsIGlzQXN5bmMsIGFsbG93c0RpcmVjdFN1cGVyKTtcblxuICAvLyBDaGVjayB2YWx1ZVxuICBpZiAobWV0aG9kLmtpbmQgPT09IFwiZ2V0XCIgJiYgdmFsdWUucGFyYW1zLmxlbmd0aCAhPT0gMClcbiAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZSh2YWx1ZS5zdGFydCwgXCJnZXR0ZXIgc2hvdWxkIGhhdmUgbm8gcGFyYW1zXCIpOyB9XG4gIGlmIChtZXRob2Qua2luZCA9PT0gXCJzZXRcIiAmJiB2YWx1ZS5wYXJhbXMubGVuZ3RoICE9PSAxKVxuICAgIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKHZhbHVlLnN0YXJ0LCBcInNldHRlciBzaG91bGQgaGF2ZSBleGFjdGx5IG9uZSBwYXJhbVwiKTsgfVxuICBpZiAobWV0aG9kLmtpbmQgPT09IFwic2V0XCIgJiYgdmFsdWUucGFyYW1zWzBdLnR5cGUgPT09IFwiUmVzdEVsZW1lbnRcIilcbiAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZSh2YWx1ZS5wYXJhbXNbMF0uc3RhcnQsIFwiU2V0dGVyIGNhbm5vdCB1c2UgcmVzdCBwYXJhbXNcIik7IH1cblxuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG1ldGhvZCwgXCJNZXRob2REZWZpbml0aW9uXCIpXG59O1xuXG5wcCQ4LnBhcnNlQ2xhc3NGaWVsZCA9IGZ1bmN0aW9uKGZpZWxkKSB7XG4gIGlmIChjaGVja0tleU5hbWUoZmllbGQsIFwiY29uc3RydWN0b3JcIikpIHtcbiAgICB0aGlzLnJhaXNlKGZpZWxkLmtleS5zdGFydCwgXCJDbGFzc2VzIGNhbid0IGhhdmUgYSBmaWVsZCBuYW1lZCAnY29uc3RydWN0b3InXCIpO1xuICB9IGVsc2UgaWYgKGZpZWxkLnN0YXRpYyAmJiBjaGVja0tleU5hbWUoZmllbGQsIFwicHJvdG90eXBlXCIpKSB7XG4gICAgdGhpcy5yYWlzZShmaWVsZC5rZXkuc3RhcnQsIFwiQ2xhc3NlcyBjYW4ndCBoYXZlIGEgc3RhdGljIGZpZWxkIG5hbWVkICdwcm90b3R5cGUnXCIpO1xuICB9XG5cbiAgaWYgKHRoaXMuZWF0KHR5cGVzJDEuZXEpKSB7XG4gICAgLy8gVG8gcmFpc2UgU3ludGF4RXJyb3IgaWYgJ2FyZ3VtZW50cycgZXhpc3RzIGluIHRoZSBpbml0aWFsaXplci5cbiAgICB0aGlzLmVudGVyU2NvcGUoU0NPUEVfQ0xBU1NfRklFTERfSU5JVCB8IFNDT1BFX1NVUEVSKTtcbiAgICBmaWVsZC52YWx1ZSA9IHRoaXMucGFyc2VNYXliZUFzc2lnbigpO1xuICAgIHRoaXMuZXhpdFNjb3BlKCk7XG4gIH0gZWxzZSB7XG4gICAgZmllbGQudmFsdWUgPSBudWxsO1xuICB9XG4gIHRoaXMuc2VtaWNvbG9uKCk7XG5cbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShmaWVsZCwgXCJQcm9wZXJ0eURlZmluaXRpb25cIilcbn07XG5cbnBwJDgucGFyc2VDbGFzc1N0YXRpY0Jsb2NrID0gZnVuY3Rpb24obm9kZSkge1xuICBub2RlLmJvZHkgPSBbXTtcblxuICB2YXIgb2xkTGFiZWxzID0gdGhpcy5sYWJlbHM7XG4gIHRoaXMubGFiZWxzID0gW107XG4gIHRoaXMuZW50ZXJTY29wZShTQ09QRV9DTEFTU19TVEFUSUNfQkxPQ0sgfCBTQ09QRV9TVVBFUik7XG4gIHdoaWxlICh0aGlzLnR5cGUgIT09IHR5cGVzJDEuYnJhY2VSKSB7XG4gICAgdmFyIHN0bXQgPSB0aGlzLnBhcnNlU3RhdGVtZW50KG51bGwpO1xuICAgIG5vZGUuYm9keS5wdXNoKHN0bXQpO1xuICB9XG4gIHRoaXMubmV4dCgpO1xuICB0aGlzLmV4aXRTY29wZSgpO1xuICB0aGlzLmxhYmVscyA9IG9sZExhYmVscztcblxuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiU3RhdGljQmxvY2tcIilcbn07XG5cbnBwJDgucGFyc2VDbGFzc0lkID0gZnVuY3Rpb24obm9kZSwgaXNTdGF0ZW1lbnQpIHtcbiAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5uYW1lKSB7XG4gICAgbm9kZS5pZCA9IHRoaXMucGFyc2VJZGVudCgpO1xuICAgIGlmIChpc1N0YXRlbWVudClcbiAgICAgIHsgdGhpcy5jaGVja0xWYWxTaW1wbGUobm9kZS5pZCwgQklORF9MRVhJQ0FMLCBmYWxzZSk7IH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoaXNTdGF0ZW1lbnQgPT09IHRydWUpXG4gICAgICB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gICAgbm9kZS5pZCA9IG51bGw7XG4gIH1cbn07XG5cbnBwJDgucGFyc2VDbGFzc1N1cGVyID0gZnVuY3Rpb24obm9kZSkge1xuICBub2RlLnN1cGVyQ2xhc3MgPSB0aGlzLmVhdCh0eXBlcyQxLl9leHRlbmRzKSA/IHRoaXMucGFyc2VFeHByU3Vic2NyaXB0cyhudWxsLCBmYWxzZSkgOiBudWxsO1xufTtcblxucHAkOC5lbnRlckNsYXNzQm9keSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZWxlbWVudCA9IHtkZWNsYXJlZDogT2JqZWN0LmNyZWF0ZShudWxsKSwgdXNlZDogW119O1xuICB0aGlzLnByaXZhdGVOYW1lU3RhY2sucHVzaChlbGVtZW50KTtcbiAgcmV0dXJuIGVsZW1lbnQuZGVjbGFyZWRcbn07XG5cbnBwJDguZXhpdENsYXNzQm9keSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcmVmID0gdGhpcy5wcml2YXRlTmFtZVN0YWNrLnBvcCgpO1xuICB2YXIgZGVjbGFyZWQgPSByZWYuZGVjbGFyZWQ7XG4gIHZhciB1c2VkID0gcmVmLnVzZWQ7XG4gIGlmICghdGhpcy5vcHRpb25zLmNoZWNrUHJpdmF0ZUZpZWxkcykgeyByZXR1cm4gfVxuICB2YXIgbGVuID0gdGhpcy5wcml2YXRlTmFtZVN0YWNrLmxlbmd0aDtcbiAgdmFyIHBhcmVudCA9IGxlbiA9PT0gMCA/IG51bGwgOiB0aGlzLnByaXZhdGVOYW1lU3RhY2tbbGVuIC0gMV07XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdXNlZC5sZW5ndGg7ICsraSkge1xuICAgIHZhciBpZCA9IHVzZWRbaV07XG4gICAgaWYgKCFoYXNPd24oZGVjbGFyZWQsIGlkLm5hbWUpKSB7XG4gICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgIHBhcmVudC51c2VkLnB1c2goaWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yYWlzZVJlY292ZXJhYmxlKGlkLnN0YXJ0LCAoXCJQcml2YXRlIGZpZWxkICcjXCIgKyAoaWQubmFtZSkgKyBcIicgbXVzdCBiZSBkZWNsYXJlZCBpbiBhbiBlbmNsb3NpbmcgY2xhc3NcIikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuZnVuY3Rpb24gaXNQcml2YXRlTmFtZUNvbmZsaWN0ZWQocHJpdmF0ZU5hbWVNYXAsIGVsZW1lbnQpIHtcbiAgdmFyIG5hbWUgPSBlbGVtZW50LmtleS5uYW1lO1xuICB2YXIgY3VyciA9IHByaXZhdGVOYW1lTWFwW25hbWVdO1xuXG4gIHZhciBuZXh0ID0gXCJ0cnVlXCI7XG4gIGlmIChlbGVtZW50LnR5cGUgPT09IFwiTWV0aG9kRGVmaW5pdGlvblwiICYmIChlbGVtZW50LmtpbmQgPT09IFwiZ2V0XCIgfHwgZWxlbWVudC5raW5kID09PSBcInNldFwiKSkge1xuICAgIG5leHQgPSAoZWxlbWVudC5zdGF0aWMgPyBcInNcIiA6IFwiaVwiKSArIGVsZW1lbnQua2luZDtcbiAgfVxuXG4gIC8vIGBjbGFzcyB7IGdldCAjYSgpe307IHN0YXRpYyBzZXQgI2EoXyl7fSB9YCBpcyBhbHNvIGNvbmZsaWN0LlxuICBpZiAoXG4gICAgY3VyciA9PT0gXCJpZ2V0XCIgJiYgbmV4dCA9PT0gXCJpc2V0XCIgfHxcbiAgICBjdXJyID09PSBcImlzZXRcIiAmJiBuZXh0ID09PSBcImlnZXRcIiB8fFxuICAgIGN1cnIgPT09IFwic2dldFwiICYmIG5leHQgPT09IFwic3NldFwiIHx8XG4gICAgY3VyciA9PT0gXCJzc2V0XCIgJiYgbmV4dCA9PT0gXCJzZ2V0XCJcbiAgKSB7XG4gICAgcHJpdmF0ZU5hbWVNYXBbbmFtZV0gPSBcInRydWVcIjtcbiAgICByZXR1cm4gZmFsc2VcbiAgfSBlbHNlIGlmICghY3Vycikge1xuICAgIHByaXZhdGVOYW1lTWFwW25hbWVdID0gbmV4dDtcbiAgICByZXR1cm4gZmFsc2VcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG59XG5cbmZ1bmN0aW9uIGNoZWNrS2V5TmFtZShub2RlLCBuYW1lKSB7XG4gIHZhciBjb21wdXRlZCA9IG5vZGUuY29tcHV0ZWQ7XG4gIHZhciBrZXkgPSBub2RlLmtleTtcbiAgcmV0dXJuICFjb21wdXRlZCAmJiAoXG4gICAga2V5LnR5cGUgPT09IFwiSWRlbnRpZmllclwiICYmIGtleS5uYW1lID09PSBuYW1lIHx8XG4gICAga2V5LnR5cGUgPT09IFwiTGl0ZXJhbFwiICYmIGtleS52YWx1ZSA9PT0gbmFtZVxuICApXG59XG5cbi8vIFBhcnNlcyBtb2R1bGUgZXhwb3J0IGRlY2xhcmF0aW9uLlxuXG5wcCQ4LnBhcnNlRXhwb3J0QWxsRGVjbGFyYXRpb24gPSBmdW5jdGlvbihub2RlLCBleHBvcnRzKSB7XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTEpIHtcbiAgICBpZiAodGhpcy5lYXRDb250ZXh0dWFsKFwiYXNcIikpIHtcbiAgICAgIG5vZGUuZXhwb3J0ZWQgPSB0aGlzLnBhcnNlTW9kdWxlRXhwb3J0TmFtZSgpO1xuICAgICAgdGhpcy5jaGVja0V4cG9ydChleHBvcnRzLCBub2RlLmV4cG9ydGVkLCB0aGlzLmxhc3RUb2tTdGFydCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vZGUuZXhwb3J0ZWQgPSBudWxsO1xuICAgIH1cbiAgfVxuICB0aGlzLmV4cGVjdENvbnRleHR1YWwoXCJmcm9tXCIpO1xuICBpZiAodGhpcy50eXBlICE9PSB0eXBlcyQxLnN0cmluZykgeyB0aGlzLnVuZXhwZWN0ZWQoKTsgfVxuICBub2RlLnNvdXJjZSA9IHRoaXMucGFyc2VFeHByQXRvbSgpO1xuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDE2KVxuICAgIHsgbm9kZS5hdHRyaWJ1dGVzID0gdGhpcy5wYXJzZVdpdGhDbGF1c2UoKTsgfVxuICB0aGlzLnNlbWljb2xvbigpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiRXhwb3J0QWxsRGVjbGFyYXRpb25cIilcbn07XG5cbnBwJDgucGFyc2VFeHBvcnQgPSBmdW5jdGlvbihub2RlLCBleHBvcnRzKSB7XG4gIHRoaXMubmV4dCgpO1xuICAvLyBleHBvcnQgKiBmcm9tICcuLi4nXG4gIGlmICh0aGlzLmVhdCh0eXBlcyQxLnN0YXIpKSB7XG4gICAgcmV0dXJuIHRoaXMucGFyc2VFeHBvcnRBbGxEZWNsYXJhdGlvbihub2RlLCBleHBvcnRzKVxuICB9XG4gIGlmICh0aGlzLmVhdCh0eXBlcyQxLl9kZWZhdWx0KSkgeyAvLyBleHBvcnQgZGVmYXVsdCAuLi5cbiAgICB0aGlzLmNoZWNrRXhwb3J0KGV4cG9ydHMsIFwiZGVmYXVsdFwiLCB0aGlzLmxhc3RUb2tTdGFydCk7XG4gICAgbm9kZS5kZWNsYXJhdGlvbiA9IHRoaXMucGFyc2VFeHBvcnREZWZhdWx0RGVjbGFyYXRpb24oKTtcbiAgICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiRXhwb3J0RGVmYXVsdERlY2xhcmF0aW9uXCIpXG4gIH1cbiAgLy8gZXhwb3J0IHZhcnxjb25zdHxsZXR8ZnVuY3Rpb258Y2xhc3MgLi4uXG4gIGlmICh0aGlzLnNob3VsZFBhcnNlRXhwb3J0U3RhdGVtZW50KCkpIHtcbiAgICBub2RlLmRlY2xhcmF0aW9uID0gdGhpcy5wYXJzZUV4cG9ydERlY2xhcmF0aW9uKG5vZGUpO1xuICAgIGlmIChub2RlLmRlY2xhcmF0aW9uLnR5cGUgPT09IFwiVmFyaWFibGVEZWNsYXJhdGlvblwiKVxuICAgICAgeyB0aGlzLmNoZWNrVmFyaWFibGVFeHBvcnQoZXhwb3J0cywgbm9kZS5kZWNsYXJhdGlvbi5kZWNsYXJhdGlvbnMpOyB9XG4gICAgZWxzZVxuICAgICAgeyB0aGlzLmNoZWNrRXhwb3J0KGV4cG9ydHMsIG5vZGUuZGVjbGFyYXRpb24uaWQsIG5vZGUuZGVjbGFyYXRpb24uaWQuc3RhcnQpOyB9XG4gICAgbm9kZS5zcGVjaWZpZXJzID0gW107XG4gICAgbm9kZS5zb3VyY2UgPSBudWxsO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTYpXG4gICAgICB7IG5vZGUuYXR0cmlidXRlcyA9IFtdOyB9XG4gIH0gZWxzZSB7IC8vIGV4cG9ydCB7IHgsIHkgYXMgeiB9IFtmcm9tICcuLi4nXVxuICAgIG5vZGUuZGVjbGFyYXRpb24gPSBudWxsO1xuICAgIG5vZGUuc3BlY2lmaWVycyA9IHRoaXMucGFyc2VFeHBvcnRTcGVjaWZpZXJzKGV4cG9ydHMpO1xuICAgIGlmICh0aGlzLmVhdENvbnRleHR1YWwoXCJmcm9tXCIpKSB7XG4gICAgICBpZiAodGhpcy50eXBlICE9PSB0eXBlcyQxLnN0cmluZykgeyB0aGlzLnVuZXhwZWN0ZWQoKTsgfVxuICAgICAgbm9kZS5zb3VyY2UgPSB0aGlzLnBhcnNlRXhwckF0b20oKTtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTYpXG4gICAgICAgIHsgbm9kZS5hdHRyaWJ1dGVzID0gdGhpcy5wYXJzZVdpdGhDbGF1c2UoKTsgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGlzdCA9IG5vZGUuc3BlY2lmaWVyczsgaSA8IGxpc3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgLy8gY2hlY2sgZm9yIGtleXdvcmRzIHVzZWQgYXMgbG9jYWwgbmFtZXNcbiAgICAgICAgdmFyIHNwZWMgPSBsaXN0W2ldO1xuXG4gICAgICAgIHRoaXMuY2hlY2tVbnJlc2VydmVkKHNwZWMubG9jYWwpO1xuICAgICAgICAvLyBjaGVjayBpZiBleHBvcnQgaXMgZGVmaW5lZFxuICAgICAgICB0aGlzLmNoZWNrTG9jYWxFeHBvcnQoc3BlYy5sb2NhbCk7XG5cbiAgICAgICAgaWYgKHNwZWMubG9jYWwudHlwZSA9PT0gXCJMaXRlcmFsXCIpIHtcbiAgICAgICAgICB0aGlzLnJhaXNlKHNwZWMubG9jYWwuc3RhcnQsIFwiQSBzdHJpbmcgbGl0ZXJhbCBjYW5ub3QgYmUgdXNlZCBhcyBhbiBleHBvcnRlZCBiaW5kaW5nIHdpdGhvdXQgYGZyb21gLlwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBub2RlLnNvdXJjZSA9IG51bGw7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDE2KVxuICAgICAgICB7IG5vZGUuYXR0cmlidXRlcyA9IFtdOyB9XG4gICAgfVxuICAgIHRoaXMuc2VtaWNvbG9uKCk7XG4gIH1cbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIkV4cG9ydE5hbWVkRGVjbGFyYXRpb25cIilcbn07XG5cbnBwJDgucGFyc2VFeHBvcnREZWNsYXJhdGlvbiA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgcmV0dXJuIHRoaXMucGFyc2VTdGF0ZW1lbnQobnVsbClcbn07XG5cbnBwJDgucGFyc2VFeHBvcnREZWZhdWx0RGVjbGFyYXRpb24gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGlzQXN5bmM7XG4gIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuX2Z1bmN0aW9uIHx8IChpc0FzeW5jID0gdGhpcy5pc0FzeW5jRnVuY3Rpb24oKSkpIHtcbiAgICB2YXIgZk5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICAgIHRoaXMubmV4dCgpO1xuICAgIGlmIChpc0FzeW5jKSB7IHRoaXMubmV4dCgpOyB9XG4gICAgcmV0dXJuIHRoaXMucGFyc2VGdW5jdGlvbihmTm9kZSwgRlVOQ19TVEFURU1FTlQgfCBGVU5DX05VTExBQkxFX0lELCBmYWxzZSwgaXNBc3luYylcbiAgfSBlbHNlIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuX2NsYXNzKSB7XG4gICAgdmFyIGNOb2RlID0gdGhpcy5zdGFydE5vZGUoKTtcbiAgICByZXR1cm4gdGhpcy5wYXJzZUNsYXNzKGNOb2RlLCBcIm51bGxhYmxlSURcIilcbiAgfSBlbHNlIHtcbiAgICB2YXIgZGVjbGFyYXRpb24gPSB0aGlzLnBhcnNlTWF5YmVBc3NpZ24oKTtcbiAgICB0aGlzLnNlbWljb2xvbigpO1xuICAgIHJldHVybiBkZWNsYXJhdGlvblxuICB9XG59O1xuXG5wcCQ4LmNoZWNrRXhwb3J0ID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgcG9zKSB7XG4gIGlmICghZXhwb3J0cykgeyByZXR1cm4gfVxuICBpZiAodHlwZW9mIG5hbWUgIT09IFwic3RyaW5nXCIpXG4gICAgeyBuYW1lID0gbmFtZS50eXBlID09PSBcIklkZW50aWZpZXJcIiA/IG5hbWUubmFtZSA6IG5hbWUudmFsdWU7IH1cbiAgaWYgKGhhc093bihleHBvcnRzLCBuYW1lKSlcbiAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShwb3MsIFwiRHVwbGljYXRlIGV4cG9ydCAnXCIgKyBuYW1lICsgXCInXCIpOyB9XG4gIGV4cG9ydHNbbmFtZV0gPSB0cnVlO1xufTtcblxucHAkOC5jaGVja1BhdHRlcm5FeHBvcnQgPSBmdW5jdGlvbihleHBvcnRzLCBwYXQpIHtcbiAgdmFyIHR5cGUgPSBwYXQudHlwZTtcbiAgaWYgKHR5cGUgPT09IFwiSWRlbnRpZmllclwiKVxuICAgIHsgdGhpcy5jaGVja0V4cG9ydChleHBvcnRzLCBwYXQsIHBhdC5zdGFydCk7IH1cbiAgZWxzZSBpZiAodHlwZSA9PT0gXCJPYmplY3RQYXR0ZXJuXCIpXG4gICAgeyBmb3IgKHZhciBpID0gMCwgbGlzdCA9IHBhdC5wcm9wZXJ0aWVzOyBpIDwgbGlzdC5sZW5ndGg7IGkgKz0gMSlcbiAgICAgIHtcbiAgICAgICAgdmFyIHByb3AgPSBsaXN0W2ldO1xuXG4gICAgICAgIHRoaXMuY2hlY2tQYXR0ZXJuRXhwb3J0KGV4cG9ydHMsIHByb3ApO1xuICAgICAgfSB9XG4gIGVsc2UgaWYgKHR5cGUgPT09IFwiQXJyYXlQYXR0ZXJuXCIpXG4gICAgeyBmb3IgKHZhciBpJDEgPSAwLCBsaXN0JDEgPSBwYXQuZWxlbWVudHM7IGkkMSA8IGxpc3QkMS5sZW5ndGg7IGkkMSArPSAxKSB7XG4gICAgICB2YXIgZWx0ID0gbGlzdCQxW2kkMV07XG5cbiAgICAgICAgaWYgKGVsdCkgeyB0aGlzLmNoZWNrUGF0dGVybkV4cG9ydChleHBvcnRzLCBlbHQpOyB9XG4gICAgfSB9XG4gIGVsc2UgaWYgKHR5cGUgPT09IFwiUHJvcGVydHlcIilcbiAgICB7IHRoaXMuY2hlY2tQYXR0ZXJuRXhwb3J0KGV4cG9ydHMsIHBhdC52YWx1ZSk7IH1cbiAgZWxzZSBpZiAodHlwZSA9PT0gXCJBc3NpZ25tZW50UGF0dGVyblwiKVxuICAgIHsgdGhpcy5jaGVja1BhdHRlcm5FeHBvcnQoZXhwb3J0cywgcGF0LmxlZnQpOyB9XG4gIGVsc2UgaWYgKHR5cGUgPT09IFwiUmVzdEVsZW1lbnRcIilcbiAgICB7IHRoaXMuY2hlY2tQYXR0ZXJuRXhwb3J0KGV4cG9ydHMsIHBhdC5hcmd1bWVudCk7IH1cbn07XG5cbnBwJDguY2hlY2tWYXJpYWJsZUV4cG9ydCA9IGZ1bmN0aW9uKGV4cG9ydHMsIGRlY2xzKSB7XG4gIGlmICghZXhwb3J0cykgeyByZXR1cm4gfVxuICBmb3IgKHZhciBpID0gMCwgbGlzdCA9IGRlY2xzOyBpIDwgbGlzdC5sZW5ndGg7IGkgKz0gMSlcbiAgICB7XG4gICAgdmFyIGRlY2wgPSBsaXN0W2ldO1xuXG4gICAgdGhpcy5jaGVja1BhdHRlcm5FeHBvcnQoZXhwb3J0cywgZGVjbC5pZCk7XG4gIH1cbn07XG5cbnBwJDguc2hvdWxkUGFyc2VFeHBvcnRTdGF0ZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMudHlwZS5rZXl3b3JkID09PSBcInZhclwiIHx8XG4gICAgdGhpcy50eXBlLmtleXdvcmQgPT09IFwiY29uc3RcIiB8fFxuICAgIHRoaXMudHlwZS5rZXl3b3JkID09PSBcImNsYXNzXCIgfHxcbiAgICB0aGlzLnR5cGUua2V5d29yZCA9PT0gXCJmdW5jdGlvblwiIHx8XG4gICAgdGhpcy5pc0xldCgpIHx8XG4gICAgdGhpcy5pc0FzeW5jRnVuY3Rpb24oKVxufTtcblxuLy8gUGFyc2VzIGEgY29tbWEtc2VwYXJhdGVkIGxpc3Qgb2YgbW9kdWxlIGV4cG9ydHMuXG5cbnBwJDgucGFyc2VFeHBvcnRTcGVjaWZpZXIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gIHZhciBub2RlID0gdGhpcy5zdGFydE5vZGUoKTtcbiAgbm9kZS5sb2NhbCA9IHRoaXMucGFyc2VNb2R1bGVFeHBvcnROYW1lKCk7XG5cbiAgbm9kZS5leHBvcnRlZCA9IHRoaXMuZWF0Q29udGV4dHVhbChcImFzXCIpID8gdGhpcy5wYXJzZU1vZHVsZUV4cG9ydE5hbWUoKSA6IG5vZGUubG9jYWw7XG4gIHRoaXMuY2hlY2tFeHBvcnQoXG4gICAgZXhwb3J0cyxcbiAgICBub2RlLmV4cG9ydGVkLFxuICAgIG5vZGUuZXhwb3J0ZWQuc3RhcnRcbiAgKTtcblxuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiRXhwb3J0U3BlY2lmaWVyXCIpXG59O1xuXG5wcCQ4LnBhcnNlRXhwb3J0U3BlY2lmaWVycyA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiAgdmFyIG5vZGVzID0gW10sIGZpcnN0ID0gdHJ1ZTtcbiAgLy8gZXhwb3J0IHsgeCwgeSBhcyB6IH0gW2Zyb20gJy4uLiddXG4gIHRoaXMuZXhwZWN0KHR5cGVzJDEuYnJhY2VMKTtcbiAgd2hpbGUgKCF0aGlzLmVhdCh0eXBlcyQxLmJyYWNlUikpIHtcbiAgICBpZiAoIWZpcnN0KSB7XG4gICAgICB0aGlzLmV4cGVjdCh0eXBlcyQxLmNvbW1hKTtcbiAgICAgIGlmICh0aGlzLmFmdGVyVHJhaWxpbmdDb21tYSh0eXBlcyQxLmJyYWNlUikpIHsgYnJlYWsgfVxuICAgIH0gZWxzZSB7IGZpcnN0ID0gZmFsc2U7IH1cblxuICAgIG5vZGVzLnB1c2godGhpcy5wYXJzZUV4cG9ydFNwZWNpZmllcihleHBvcnRzKSk7XG4gIH1cbiAgcmV0dXJuIG5vZGVzXG59O1xuXG4vLyBQYXJzZXMgaW1wb3J0IGRlY2xhcmF0aW9uLlxuXG5wcCQ4LnBhcnNlSW1wb3J0ID0gZnVuY3Rpb24obm9kZSkge1xuICB0aGlzLm5leHQoKTtcblxuICAvLyBpbXBvcnQgJy4uLidcbiAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5zdHJpbmcpIHtcbiAgICBub2RlLnNwZWNpZmllcnMgPSBlbXB0eSQxO1xuICAgIG5vZGUuc291cmNlID0gdGhpcy5wYXJzZUV4cHJBdG9tKCk7XG4gIH0gZWxzZSB7XG4gICAgbm9kZS5zcGVjaWZpZXJzID0gdGhpcy5wYXJzZUltcG9ydFNwZWNpZmllcnMoKTtcbiAgICB0aGlzLmV4cGVjdENvbnRleHR1YWwoXCJmcm9tXCIpO1xuICAgIG5vZGUuc291cmNlID0gdGhpcy50eXBlID09PSB0eXBlcyQxLnN0cmluZyA/IHRoaXMucGFyc2VFeHByQXRvbSgpIDogdGhpcy51bmV4cGVjdGVkKCk7XG4gIH1cbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSAxNilcbiAgICB7IG5vZGUuYXR0cmlidXRlcyA9IHRoaXMucGFyc2VXaXRoQ2xhdXNlKCk7IH1cbiAgdGhpcy5zZW1pY29sb24oKTtcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIkltcG9ydERlY2xhcmF0aW9uXCIpXG59O1xuXG4vLyBQYXJzZXMgYSBjb21tYS1zZXBhcmF0ZWQgbGlzdCBvZiBtb2R1bGUgaW1wb3J0cy5cblxucHAkOC5wYXJzZUltcG9ydFNwZWNpZmllciA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gIG5vZGUuaW1wb3J0ZWQgPSB0aGlzLnBhcnNlTW9kdWxlRXhwb3J0TmFtZSgpO1xuXG4gIGlmICh0aGlzLmVhdENvbnRleHR1YWwoXCJhc1wiKSkge1xuICAgIG5vZGUubG9jYWwgPSB0aGlzLnBhcnNlSWRlbnQoKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmNoZWNrVW5yZXNlcnZlZChub2RlLmltcG9ydGVkKTtcbiAgICBub2RlLmxvY2FsID0gbm9kZS5pbXBvcnRlZDtcbiAgfVxuICB0aGlzLmNoZWNrTFZhbFNpbXBsZShub2RlLmxvY2FsLCBCSU5EX0xFWElDQUwpO1xuXG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJJbXBvcnRTcGVjaWZpZXJcIilcbn07XG5cbnBwJDgucGFyc2VJbXBvcnREZWZhdWx0U3BlY2lmaWVyID0gZnVuY3Rpb24oKSB7XG4gIC8vIGltcG9ydCBkZWZhdWx0T2JqLCB7IHgsIHkgYXMgeiB9IGZyb20gJy4uLidcbiAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICBub2RlLmxvY2FsID0gdGhpcy5wYXJzZUlkZW50KCk7XG4gIHRoaXMuY2hlY2tMVmFsU2ltcGxlKG5vZGUubG9jYWwsIEJJTkRfTEVYSUNBTCk7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJJbXBvcnREZWZhdWx0U3BlY2lmaWVyXCIpXG59O1xuXG5wcCQ4LnBhcnNlSW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyID0gZnVuY3Rpb24oKSB7XG4gIHZhciBub2RlID0gdGhpcy5zdGFydE5vZGUoKTtcbiAgdGhpcy5uZXh0KCk7XG4gIHRoaXMuZXhwZWN0Q29udGV4dHVhbChcImFzXCIpO1xuICBub2RlLmxvY2FsID0gdGhpcy5wYXJzZUlkZW50KCk7XG4gIHRoaXMuY2hlY2tMVmFsU2ltcGxlKG5vZGUubG9jYWwsIEJJTkRfTEVYSUNBTCk7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXJcIilcbn07XG5cbnBwJDgucGFyc2VJbXBvcnRTcGVjaWZpZXJzID0gZnVuY3Rpb24oKSB7XG4gIHZhciBub2RlcyA9IFtdLCBmaXJzdCA9IHRydWU7XG4gIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEubmFtZSkge1xuICAgIG5vZGVzLnB1c2godGhpcy5wYXJzZUltcG9ydERlZmF1bHRTcGVjaWZpZXIoKSk7XG4gICAgaWYgKCF0aGlzLmVhdCh0eXBlcyQxLmNvbW1hKSkgeyByZXR1cm4gbm9kZXMgfVxuICB9XG4gIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuc3Rhcikge1xuICAgIG5vZGVzLnB1c2godGhpcy5wYXJzZUltcG9ydE5hbWVzcGFjZVNwZWNpZmllcigpKTtcbiAgICByZXR1cm4gbm9kZXNcbiAgfVxuICB0aGlzLmV4cGVjdCh0eXBlcyQxLmJyYWNlTCk7XG4gIHdoaWxlICghdGhpcy5lYXQodHlwZXMkMS5icmFjZVIpKSB7XG4gICAgaWYgKCFmaXJzdCkge1xuICAgICAgdGhpcy5leHBlY3QodHlwZXMkMS5jb21tYSk7XG4gICAgICBpZiAodGhpcy5hZnRlclRyYWlsaW5nQ29tbWEodHlwZXMkMS5icmFjZVIpKSB7IGJyZWFrIH1cbiAgICB9IGVsc2UgeyBmaXJzdCA9IGZhbHNlOyB9XG5cbiAgICBub2Rlcy5wdXNoKHRoaXMucGFyc2VJbXBvcnRTcGVjaWZpZXIoKSk7XG4gIH1cbiAgcmV0dXJuIG5vZGVzXG59O1xuXG5wcCQ4LnBhcnNlV2l0aENsYXVzZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbm9kZXMgPSBbXTtcbiAgaWYgKCF0aGlzLmVhdCh0eXBlcyQxLl93aXRoKSkge1xuICAgIHJldHVybiBub2Rlc1xuICB9XG4gIHRoaXMuZXhwZWN0KHR5cGVzJDEuYnJhY2VMKTtcbiAgdmFyIGF0dHJpYnV0ZUtleXMgPSB7fTtcbiAgdmFyIGZpcnN0ID0gdHJ1ZTtcbiAgd2hpbGUgKCF0aGlzLmVhdCh0eXBlcyQxLmJyYWNlUikpIHtcbiAgICBpZiAoIWZpcnN0KSB7XG4gICAgICB0aGlzLmV4cGVjdCh0eXBlcyQxLmNvbW1hKTtcbiAgICAgIGlmICh0aGlzLmFmdGVyVHJhaWxpbmdDb21tYSh0eXBlcyQxLmJyYWNlUikpIHsgYnJlYWsgfVxuICAgIH0gZWxzZSB7IGZpcnN0ID0gZmFsc2U7IH1cblxuICAgIHZhciBhdHRyID0gdGhpcy5wYXJzZUltcG9ydEF0dHJpYnV0ZSgpO1xuICAgIHZhciBrZXlOYW1lID0gYXR0ci5rZXkudHlwZSA9PT0gXCJJZGVudGlmaWVyXCIgPyBhdHRyLmtleS5uYW1lIDogYXR0ci5rZXkudmFsdWU7XG4gICAgaWYgKGhhc093bihhdHRyaWJ1dGVLZXlzLCBrZXlOYW1lKSlcbiAgICAgIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKGF0dHIua2V5LnN0YXJ0LCBcIkR1cGxpY2F0ZSBhdHRyaWJ1dGUga2V5ICdcIiArIGtleU5hbWUgKyBcIidcIik7IH1cbiAgICBhdHRyaWJ1dGVLZXlzW2tleU5hbWVdID0gdHJ1ZTtcbiAgICBub2Rlcy5wdXNoKGF0dHIpO1xuICB9XG4gIHJldHVybiBub2Rlc1xufTtcblxucHAkOC5wYXJzZUltcG9ydEF0dHJpYnV0ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gIG5vZGUua2V5ID0gdGhpcy50eXBlID09PSB0eXBlcyQxLnN0cmluZyA/IHRoaXMucGFyc2VFeHByQXRvbSgpIDogdGhpcy5wYXJzZUlkZW50KHRoaXMub3B0aW9ucy5hbGxvd1Jlc2VydmVkICE9PSBcIm5ldmVyXCIpO1xuICB0aGlzLmV4cGVjdCh0eXBlcyQxLmNvbG9uKTtcbiAgaWYgKHRoaXMudHlwZSAhPT0gdHlwZXMkMS5zdHJpbmcpIHtcbiAgICB0aGlzLnVuZXhwZWN0ZWQoKTtcbiAgfVxuICBub2RlLnZhbHVlID0gdGhpcy5wYXJzZUV4cHJBdG9tKCk7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJJbXBvcnRBdHRyaWJ1dGVcIilcbn07XG5cbnBwJDgucGFyc2VNb2R1bGVFeHBvcnROYW1lID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTMgJiYgdGhpcy50eXBlID09PSB0eXBlcyQxLnN0cmluZykge1xuICAgIHZhciBzdHJpbmdMaXRlcmFsID0gdGhpcy5wYXJzZUxpdGVyYWwodGhpcy52YWx1ZSk7XG4gICAgaWYgKGxvbmVTdXJyb2dhdGUudGVzdChzdHJpbmdMaXRlcmFsLnZhbHVlKSkge1xuICAgICAgdGhpcy5yYWlzZShzdHJpbmdMaXRlcmFsLnN0YXJ0LCBcIkFuIGV4cG9ydCBuYW1lIGNhbm5vdCBpbmNsdWRlIGEgbG9uZSBzdXJyb2dhdGUuXCIpO1xuICAgIH1cbiAgICByZXR1cm4gc3RyaW5nTGl0ZXJhbFxuICB9XG4gIHJldHVybiB0aGlzLnBhcnNlSWRlbnQodHJ1ZSlcbn07XG5cbi8vIFNldCBgRXhwcmVzc2lvblN0YXRlbWVudCNkaXJlY3RpdmVgIHByb3BlcnR5IGZvciBkaXJlY3RpdmUgcHJvbG9ndWVzLlxucHAkOC5hZGFwdERpcmVjdGl2ZVByb2xvZ3VlID0gZnVuY3Rpb24oc3RhdGVtZW50cykge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0YXRlbWVudHMubGVuZ3RoICYmIHRoaXMuaXNEaXJlY3RpdmVDYW5kaWRhdGUoc3RhdGVtZW50c1tpXSk7ICsraSkge1xuICAgIHN0YXRlbWVudHNbaV0uZGlyZWN0aXZlID0gc3RhdGVtZW50c1tpXS5leHByZXNzaW9uLnJhdy5zbGljZSgxLCAtMSk7XG4gIH1cbn07XG5wcCQ4LmlzRGlyZWN0aXZlQ2FuZGlkYXRlID0gZnVuY3Rpb24oc3RhdGVtZW50KSB7XG4gIHJldHVybiAoXG4gICAgdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDUgJiZcbiAgICBzdGF0ZW1lbnQudHlwZSA9PT0gXCJFeHByZXNzaW9uU3RhdGVtZW50XCIgJiZcbiAgICBzdGF0ZW1lbnQuZXhwcmVzc2lvbi50eXBlID09PSBcIkxpdGVyYWxcIiAmJlxuICAgIHR5cGVvZiBzdGF0ZW1lbnQuZXhwcmVzc2lvbi52YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJlxuICAgIC8vIFJlamVjdCBwYXJlbnRoZXNpemVkIHN0cmluZ3MuXG4gICAgKHRoaXMuaW5wdXRbc3RhdGVtZW50LnN0YXJ0XSA9PT0gXCJcXFwiXCIgfHwgdGhpcy5pbnB1dFtzdGF0ZW1lbnQuc3RhcnRdID09PSBcIidcIilcbiAgKVxufTtcblxudmFyIHBwJDcgPSBQYXJzZXIucHJvdG90eXBlO1xuXG4vLyBDb252ZXJ0IGV4aXN0aW5nIGV4cHJlc3Npb24gYXRvbSB0byBhc3NpZ25hYmxlIHBhdHRlcm5cbi8vIGlmIHBvc3NpYmxlLlxuXG5wcCQ3LnRvQXNzaWduYWJsZSA9IGZ1bmN0aW9uKG5vZGUsIGlzQmluZGluZywgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykge1xuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDYgJiYgbm9kZSkge1xuICAgIHN3aXRjaCAobm9kZS50eXBlKSB7XG4gICAgY2FzZSBcIklkZW50aWZpZXJcIjpcbiAgICAgIGlmICh0aGlzLmluQXN5bmMgJiYgbm9kZS5uYW1lID09PSBcImF3YWl0XCIpXG4gICAgICAgIHsgdGhpcy5yYWlzZShub2RlLnN0YXJ0LCBcIkNhbm5vdCB1c2UgJ2F3YWl0JyBhcyBpZGVudGlmaWVyIGluc2lkZSBhbiBhc3luYyBmdW5jdGlvblwiKTsgfVxuICAgICAgYnJlYWtcblxuICAgIGNhc2UgXCJPYmplY3RQYXR0ZXJuXCI6XG4gICAgY2FzZSBcIkFycmF5UGF0dGVyblwiOlxuICAgIGNhc2UgXCJBc3NpZ25tZW50UGF0dGVyblwiOlxuICAgIGNhc2UgXCJSZXN0RWxlbWVudFwiOlxuICAgICAgYnJlYWtcblxuICAgIGNhc2UgXCJPYmplY3RFeHByZXNzaW9uXCI6XG4gICAgICBub2RlLnR5cGUgPSBcIk9iamVjdFBhdHRlcm5cIjtcbiAgICAgIGlmIChyZWZEZXN0cnVjdHVyaW5nRXJyb3JzKSB7IHRoaXMuY2hlY2tQYXR0ZXJuRXJyb3JzKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMsIHRydWUpOyB9XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGlzdCA9IG5vZGUucHJvcGVydGllczsgaSA8IGxpc3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgdmFyIHByb3AgPSBsaXN0W2ldO1xuXG4gICAgICB0aGlzLnRvQXNzaWduYWJsZShwcm9wLCBpc0JpbmRpbmcpO1xuICAgICAgICAvLyBFYXJseSBlcnJvcjpcbiAgICAgICAgLy8gICBBc3NpZ25tZW50UmVzdFByb3BlcnR5W1lpZWxkLCBBd2FpdF0gOlxuICAgICAgICAvLyAgICAgYC4uLmAgRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnRUYXJnZXRbWWllbGQsIEF3YWl0XVxuICAgICAgICAvL1xuICAgICAgICAvLyAgIEl0IGlzIGEgU3ludGF4IEVycm9yIGlmIHxEZXN0cnVjdHVyaW5nQXNzaWdubWVudFRhcmdldHwgaXMgYW4gfEFycmF5TGl0ZXJhbHwgb3IgYW4gfE9iamVjdExpdGVyYWx8LlxuICAgICAgICBpZiAoXG4gICAgICAgICAgcHJvcC50eXBlID09PSBcIlJlc3RFbGVtZW50XCIgJiZcbiAgICAgICAgICAocHJvcC5hcmd1bWVudC50eXBlID09PSBcIkFycmF5UGF0dGVyblwiIHx8IHByb3AuYXJndW1lbnQudHlwZSA9PT0gXCJPYmplY3RQYXR0ZXJuXCIpXG4gICAgICAgICkge1xuICAgICAgICAgIHRoaXMucmFpc2UocHJvcC5hcmd1bWVudC5zdGFydCwgXCJVbmV4cGVjdGVkIHRva2VuXCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBicmVha1xuXG4gICAgY2FzZSBcIlByb3BlcnR5XCI6XG4gICAgICAvLyBBc3NpZ25tZW50UHJvcGVydHkgaGFzIHR5cGUgPT09IFwiUHJvcGVydHlcIlxuICAgICAgaWYgKG5vZGUua2luZCAhPT0gXCJpbml0XCIpIHsgdGhpcy5yYWlzZShub2RlLmtleS5zdGFydCwgXCJPYmplY3QgcGF0dGVybiBjYW4ndCBjb250YWluIGdldHRlciBvciBzZXR0ZXJcIik7IH1cbiAgICAgIHRoaXMudG9Bc3NpZ25hYmxlKG5vZGUudmFsdWUsIGlzQmluZGluZyk7XG4gICAgICBicmVha1xuXG4gICAgY2FzZSBcIkFycmF5RXhwcmVzc2lvblwiOlxuICAgICAgbm9kZS50eXBlID0gXCJBcnJheVBhdHRlcm5cIjtcbiAgICAgIGlmIChyZWZEZXN0cnVjdHVyaW5nRXJyb3JzKSB7IHRoaXMuY2hlY2tQYXR0ZXJuRXJyb3JzKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMsIHRydWUpOyB9XG4gICAgICB0aGlzLnRvQXNzaWduYWJsZUxpc3Qobm9kZS5lbGVtZW50cywgaXNCaW5kaW5nKTtcbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlIFwiU3ByZWFkRWxlbWVudFwiOlxuICAgICAgbm9kZS50eXBlID0gXCJSZXN0RWxlbWVudFwiO1xuICAgICAgdGhpcy50b0Fzc2lnbmFibGUobm9kZS5hcmd1bWVudCwgaXNCaW5kaW5nKTtcbiAgICAgIGlmIChub2RlLmFyZ3VtZW50LnR5cGUgPT09IFwiQXNzaWdubWVudFBhdHRlcm5cIilcbiAgICAgICAgeyB0aGlzLnJhaXNlKG5vZGUuYXJndW1lbnQuc3RhcnQsIFwiUmVzdCBlbGVtZW50cyBjYW5ub3QgaGF2ZSBhIGRlZmF1bHQgdmFsdWVcIik7IH1cbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlIFwiQXNzaWdubWVudEV4cHJlc3Npb25cIjpcbiAgICAgIGlmIChub2RlLm9wZXJhdG9yICE9PSBcIj1cIikgeyB0aGlzLnJhaXNlKG5vZGUubGVmdC5lbmQsIFwiT25seSAnPScgb3BlcmF0b3IgY2FuIGJlIHVzZWQgZm9yIHNwZWNpZnlpbmcgZGVmYXVsdCB2YWx1ZS5cIik7IH1cbiAgICAgIG5vZGUudHlwZSA9IFwiQXNzaWdubWVudFBhdHRlcm5cIjtcbiAgICAgIGRlbGV0ZSBub2RlLm9wZXJhdG9yO1xuICAgICAgdGhpcy50b0Fzc2lnbmFibGUobm9kZS5sZWZ0LCBpc0JpbmRpbmcpO1xuICAgICAgYnJlYWtcblxuICAgIGNhc2UgXCJQYXJlbnRoZXNpemVkRXhwcmVzc2lvblwiOlxuICAgICAgdGhpcy50b0Fzc2lnbmFibGUobm9kZS5leHByZXNzaW9uLCBpc0JpbmRpbmcsIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpO1xuICAgICAgYnJlYWtcblxuICAgIGNhc2UgXCJDaGFpbkV4cHJlc3Npb25cIjpcbiAgICAgIHRoaXMucmFpc2VSZWNvdmVyYWJsZShub2RlLnN0YXJ0LCBcIk9wdGlvbmFsIGNoYWluaW5nIGNhbm5vdCBhcHBlYXIgaW4gbGVmdC1oYW5kIHNpZGVcIik7XG4gICAgICBicmVha1xuXG4gICAgY2FzZSBcIk1lbWJlckV4cHJlc3Npb25cIjpcbiAgICAgIGlmICghaXNCaW5kaW5nKSB7IGJyZWFrIH1cblxuICAgIGRlZmF1bHQ6XG4gICAgICB0aGlzLnJhaXNlKG5vZGUuc3RhcnQsIFwiQXNzaWduaW5nIHRvIHJ2YWx1ZVwiKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykgeyB0aGlzLmNoZWNrUGF0dGVybkVycm9ycyhyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCB0cnVlKTsgfVxuICByZXR1cm4gbm9kZVxufTtcblxuLy8gQ29udmVydCBsaXN0IG9mIGV4cHJlc3Npb24gYXRvbXMgdG8gYmluZGluZyBsaXN0LlxuXG5wcCQ3LnRvQXNzaWduYWJsZUxpc3QgPSBmdW5jdGlvbihleHByTGlzdCwgaXNCaW5kaW5nKSB7XG4gIHZhciBlbmQgPSBleHByTGlzdC5sZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZW5kOyBpKyspIHtcbiAgICB2YXIgZWx0ID0gZXhwckxpc3RbaV07XG4gICAgaWYgKGVsdCkgeyB0aGlzLnRvQXNzaWduYWJsZShlbHQsIGlzQmluZGluZyk7IH1cbiAgfVxuICBpZiAoZW5kKSB7XG4gICAgdmFyIGxhc3QgPSBleHByTGlzdFtlbmQgLSAxXTtcbiAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID09PSA2ICYmIGlzQmluZGluZyAmJiBsYXN0ICYmIGxhc3QudHlwZSA9PT0gXCJSZXN0RWxlbWVudFwiICYmIGxhc3QuYXJndW1lbnQudHlwZSAhPT0gXCJJZGVudGlmaWVyXCIpXG4gICAgICB7IHRoaXMudW5leHBlY3RlZChsYXN0LmFyZ3VtZW50LnN0YXJ0KTsgfVxuICB9XG4gIHJldHVybiBleHByTGlzdFxufTtcblxuLy8gUGFyc2VzIHNwcmVhZCBlbGVtZW50LlxuXG5wcCQ3LnBhcnNlU3ByZWFkID0gZnVuY3Rpb24ocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykge1xuICB2YXIgbm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gIHRoaXMubmV4dCgpO1xuICBub2RlLmFyZ3VtZW50ID0gdGhpcy5wYXJzZU1heWJlQXNzaWduKGZhbHNlLCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKTtcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIlNwcmVhZEVsZW1lbnRcIilcbn07XG5cbnBwJDcucGFyc2VSZXN0QmluZGluZyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gIHRoaXMubmV4dCgpO1xuXG4gIC8vIFJlc3RFbGVtZW50IGluc2lkZSBvZiBhIGZ1bmN0aW9uIHBhcmFtZXRlciBtdXN0IGJlIGFuIGlkZW50aWZpZXJcbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA9PT0gNiAmJiB0aGlzLnR5cGUgIT09IHR5cGVzJDEubmFtZSlcbiAgICB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG5cbiAgbm9kZS5hcmd1bWVudCA9IHRoaXMucGFyc2VCaW5kaW5nQXRvbSgpO1xuXG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJSZXN0RWxlbWVudFwiKVxufTtcblxuLy8gUGFyc2VzIGx2YWx1ZSAoYXNzaWduYWJsZSkgYXRvbS5cblxucHAkNy5wYXJzZUJpbmRpbmdBdG9tID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNikge1xuICAgIHN3aXRjaCAodGhpcy50eXBlKSB7XG4gICAgY2FzZSB0eXBlcyQxLmJyYWNrZXRMOlxuICAgICAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICAgICAgdGhpcy5uZXh0KCk7XG4gICAgICBub2RlLmVsZW1lbnRzID0gdGhpcy5wYXJzZUJpbmRpbmdMaXN0KHR5cGVzJDEuYnJhY2tldFIsIHRydWUsIHRydWUpO1xuICAgICAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIkFycmF5UGF0dGVyblwiKVxuXG4gICAgY2FzZSB0eXBlcyQxLmJyYWNlTDpcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlT2JqKHRydWUpXG4gICAgfVxuICB9XG4gIHJldHVybiB0aGlzLnBhcnNlSWRlbnQoKVxufTtcblxucHAkNy5wYXJzZUJpbmRpbmdMaXN0ID0gZnVuY3Rpb24oY2xvc2UsIGFsbG93RW1wdHksIGFsbG93VHJhaWxpbmdDb21tYSwgYWxsb3dNb2RpZmllcnMpIHtcbiAgdmFyIGVsdHMgPSBbXSwgZmlyc3QgPSB0cnVlO1xuICB3aGlsZSAoIXRoaXMuZWF0KGNsb3NlKSkge1xuICAgIGlmIChmaXJzdCkgeyBmaXJzdCA9IGZhbHNlOyB9XG4gICAgZWxzZSB7IHRoaXMuZXhwZWN0KHR5cGVzJDEuY29tbWEpOyB9XG4gICAgaWYgKGFsbG93RW1wdHkgJiYgdGhpcy50eXBlID09PSB0eXBlcyQxLmNvbW1hKSB7XG4gICAgICBlbHRzLnB1c2gobnVsbCk7XG4gICAgfSBlbHNlIGlmIChhbGxvd1RyYWlsaW5nQ29tbWEgJiYgdGhpcy5hZnRlclRyYWlsaW5nQ29tbWEoY2xvc2UpKSB7XG4gICAgICBicmVha1xuICAgIH0gZWxzZSBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLmVsbGlwc2lzKSB7XG4gICAgICB2YXIgcmVzdCA9IHRoaXMucGFyc2VSZXN0QmluZGluZygpO1xuICAgICAgdGhpcy5wYXJzZUJpbmRpbmdMaXN0SXRlbShyZXN0KTtcbiAgICAgIGVsdHMucHVzaChyZXN0KTtcbiAgICAgIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuY29tbWEpIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKHRoaXMuc3RhcnQsIFwiQ29tbWEgaXMgbm90IHBlcm1pdHRlZCBhZnRlciB0aGUgcmVzdCBlbGVtZW50XCIpOyB9XG4gICAgICB0aGlzLmV4cGVjdChjbG9zZSk7XG4gICAgICBicmVha1xuICAgIH0gZWxzZSB7XG4gICAgICBlbHRzLnB1c2godGhpcy5wYXJzZUFzc2lnbmFibGVMaXN0SXRlbShhbGxvd01vZGlmaWVycykpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZWx0c1xufTtcblxucHAkNy5wYXJzZUFzc2lnbmFibGVMaXN0SXRlbSA9IGZ1bmN0aW9uKGFsbG93TW9kaWZpZXJzKSB7XG4gIHZhciBlbGVtID0gdGhpcy5wYXJzZU1heWJlRGVmYXVsdCh0aGlzLnN0YXJ0LCB0aGlzLnN0YXJ0TG9jKTtcbiAgdGhpcy5wYXJzZUJpbmRpbmdMaXN0SXRlbShlbGVtKTtcbiAgcmV0dXJuIGVsZW1cbn07XG5cbnBwJDcucGFyc2VCaW5kaW5nTGlzdEl0ZW0gPSBmdW5jdGlvbihwYXJhbSkge1xuICByZXR1cm4gcGFyYW1cbn07XG5cbi8vIFBhcnNlcyBhc3NpZ25tZW50IHBhdHRlcm4gYXJvdW5kIGdpdmVuIGF0b20gaWYgcG9zc2libGUuXG5cbnBwJDcucGFyc2VNYXliZURlZmF1bHQgPSBmdW5jdGlvbihzdGFydFBvcywgc3RhcnRMb2MsIGxlZnQpIHtcbiAgbGVmdCA9IGxlZnQgfHwgdGhpcy5wYXJzZUJpbmRpbmdBdG9tKCk7XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPCA2IHx8ICF0aGlzLmVhdCh0eXBlcyQxLmVxKSkgeyByZXR1cm4gbGVmdCB9XG4gIHZhciBub2RlID0gdGhpcy5zdGFydE5vZGVBdChzdGFydFBvcywgc3RhcnRMb2MpO1xuICBub2RlLmxlZnQgPSBsZWZ0O1xuICBub2RlLnJpZ2h0ID0gdGhpcy5wYXJzZU1heWJlQXNzaWduKCk7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJBc3NpZ25tZW50UGF0dGVyblwiKVxufTtcblxuLy8gVGhlIGZvbGxvd2luZyB0aHJlZSBmdW5jdGlvbnMgYWxsIHZlcmlmeSB0aGF0IGEgbm9kZSBpcyBhbiBsdmFsdWUgXHUyMDE0XG4vLyBzb21ldGhpbmcgdGhhdCBjYW4gYmUgYm91bmQsIG9yIGFzc2lnbmVkIHRvLiBJbiBvcmRlciB0byBkbyBzbywgdGhleSBwZXJmb3JtXG4vLyBhIHZhcmlldHkgb2YgY2hlY2tzOlxuLy9cbi8vIC0gQ2hlY2sgdGhhdCBub25lIG9mIHRoZSBib3VuZC9hc3NpZ25lZC10byBpZGVudGlmaWVycyBhcmUgcmVzZXJ2ZWQgd29yZHMuXG4vLyAtIFJlY29yZCBuYW1lIGRlY2xhcmF0aW9ucyBmb3IgYmluZGluZ3MgaW4gdGhlIGFwcHJvcHJpYXRlIHNjb3BlLlxuLy8gLSBDaGVjayBkdXBsaWNhdGUgYXJndW1lbnQgbmFtZXMsIGlmIGNoZWNrQ2xhc2hlcyBpcyBzZXQuXG4vL1xuLy8gSWYgYSBjb21wbGV4IGJpbmRpbmcgcGF0dGVybiBpcyBlbmNvdW50ZXJlZCAoZS5nLiwgb2JqZWN0IGFuZCBhcnJheVxuLy8gZGVzdHJ1Y3R1cmluZyksIHRoZSBlbnRpcmUgcGF0dGVybiBpcyByZWN1cnNpdmVseSBjaGVja2VkLlxuLy9cbi8vIFRoZXJlIGFyZSB0aHJlZSB2ZXJzaW9ucyBvZiBjaGVja0xWYWwqKCkgYXBwcm9wcmlhdGUgZm9yIGRpZmZlcmVudFxuLy8gY2lyY3Vtc3RhbmNlczpcbi8vXG4vLyAtIGNoZWNrTFZhbFNpbXBsZSgpIHNoYWxsIGJlIHVzZWQgaWYgdGhlIHN5bnRhY3RpYyBjb25zdHJ1Y3Qgc3VwcG9ydHNcbi8vICAgbm90aGluZyBvdGhlciB0aGFuIGlkZW50aWZpZXJzIGFuZCBtZW1iZXIgZXhwcmVzc2lvbnMuIFBhcmVudGhlc2l6ZWRcbi8vICAgZXhwcmVzc2lvbnMgYXJlIGFsc28gY29ycmVjdGx5IGhhbmRsZWQuIFRoaXMgaXMgZ2VuZXJhbGx5IGFwcHJvcHJpYXRlIGZvclxuLy8gICBjb25zdHJ1Y3RzIGZvciB3aGljaCB0aGUgc3BlYyBzYXlzXG4vL1xuLy8gICA+IEl0IGlzIGEgU3ludGF4IEVycm9yIGlmIEFzc2lnbm1lbnRUYXJnZXRUeXBlIG9mIFt0aGUgcHJvZHVjdGlvbl0gaXMgbm90XG4vLyAgID4gc2ltcGxlLlxuLy9cbi8vICAgSXQgaXMgYWxzbyBhcHByb3ByaWF0ZSBmb3IgY2hlY2tpbmcgaWYgYW4gaWRlbnRpZmllciBpcyB2YWxpZCBhbmQgbm90XG4vLyAgIGRlZmluZWQgZWxzZXdoZXJlLCBsaWtlIGltcG9ydCBkZWNsYXJhdGlvbnMgb3IgZnVuY3Rpb24vY2xhc3MgaWRlbnRpZmllcnMuXG4vL1xuLy8gICBFeGFtcGxlcyB3aGVyZSB0aGlzIGlzIHVzZWQgaW5jbHVkZTpcbi8vICAgICBhICs9IFx1MjAyNjtcbi8vICAgICBpbXBvcnQgYSBmcm9tICdcdTIwMjYnO1xuLy8gICB3aGVyZSBhIGlzIHRoZSBub2RlIHRvIGJlIGNoZWNrZWQuXG4vL1xuLy8gLSBjaGVja0xWYWxQYXR0ZXJuKCkgc2hhbGwgYmUgdXNlZCBpZiB0aGUgc3ludGFjdGljIGNvbnN0cnVjdCBzdXBwb3J0c1xuLy8gICBhbnl0aGluZyBjaGVja0xWYWxTaW1wbGUoKSBzdXBwb3J0cywgYXMgd2VsbCBhcyBvYmplY3QgYW5kIGFycmF5XG4vLyAgIGRlc3RydWN0dXJpbmcgcGF0dGVybnMuIFRoaXMgaXMgZ2VuZXJhbGx5IGFwcHJvcHJpYXRlIGZvciBjb25zdHJ1Y3RzIGZvclxuLy8gICB3aGljaCB0aGUgc3BlYyBzYXlzXG4vL1xuLy8gICA+IEl0IGlzIGEgU3ludGF4IEVycm9yIGlmIFt0aGUgcHJvZHVjdGlvbl0gaXMgbmVpdGhlciBhbiBPYmplY3RMaXRlcmFsIG5vclxuLy8gICA+IGFuIEFycmF5TGl0ZXJhbCBhbmQgQXNzaWdubWVudFRhcmdldFR5cGUgb2YgW3RoZSBwcm9kdWN0aW9uXSBpcyBub3Rcbi8vICAgPiBzaW1wbGUuXG4vL1xuLy8gICBFeGFtcGxlcyB3aGVyZSB0aGlzIGlzIHVzZWQgaW5jbHVkZTpcbi8vICAgICAoYSA9IFx1MjAyNik7XG4vLyAgICAgY29uc3QgYSA9IFx1MjAyNjtcbi8vICAgICB0cnkgeyBcdTIwMjYgfSBjYXRjaCAoYSkgeyBcdTIwMjYgfVxuLy8gICB3aGVyZSBhIGlzIHRoZSBub2RlIHRvIGJlIGNoZWNrZWQuXG4vL1xuLy8gLSBjaGVja0xWYWxJbm5lclBhdHRlcm4oKSBzaGFsbCBiZSB1c2VkIGlmIHRoZSBzeW50YWN0aWMgY29uc3RydWN0IHN1cHBvcnRzXG4vLyAgIGFueXRoaW5nIGNoZWNrTFZhbFBhdHRlcm4oKSBzdXBwb3J0cywgYXMgd2VsbCBhcyBkZWZhdWx0IGFzc2lnbm1lbnRcbi8vICAgcGF0dGVybnMsIHJlc3QgZWxlbWVudHMsIGFuZCBvdGhlciBjb25zdHJ1Y3RzIHRoYXQgbWF5IGFwcGVhciB3aXRoaW4gYW5cbi8vICAgb2JqZWN0IG9yIGFycmF5IGRlc3RydWN0dXJpbmcgcGF0dGVybi5cbi8vXG4vLyAgIEFzIGEgc3BlY2lhbCBjYXNlLCBmdW5jdGlvbiBwYXJhbWV0ZXJzIGFsc28gdXNlIGNoZWNrTFZhbElubmVyUGF0dGVybigpLFxuLy8gICBhcyB0aGV5IGFsc28gc3VwcG9ydCBkZWZhdWx0cyBhbmQgcmVzdCBjb25zdHJ1Y3RzLlxuLy9cbi8vIFRoZXNlIGZ1bmN0aW9ucyBkZWxpYmVyYXRlbHkgc3VwcG9ydCBib3RoIGFzc2lnbm1lbnQgYW5kIGJpbmRpbmcgY29uc3RydWN0cyxcbi8vIGFzIHRoZSBsb2dpYyBmb3IgYm90aCBpcyBleGNlZWRpbmdseSBzaW1pbGFyLiBJZiB0aGUgbm9kZSBpcyB0aGUgdGFyZ2V0IG9mXG4vLyBhbiBhc3NpZ25tZW50LCB0aGVuIGJpbmRpbmdUeXBlIHNob3VsZCBiZSBzZXQgdG8gQklORF9OT05FLiBPdGhlcndpc2UsIGl0XG4vLyBzaG91bGQgYmUgc2V0IHRvIHRoZSBhcHByb3ByaWF0ZSBCSU5EXyogY29uc3RhbnQsIGxpa2UgQklORF9WQVIgb3Jcbi8vIEJJTkRfTEVYSUNBTC5cbi8vXG4vLyBJZiB0aGUgZnVuY3Rpb24gaXMgY2FsbGVkIHdpdGggYSBub24tQklORF9OT05FIGJpbmRpbmdUeXBlLCB0aGVuXG4vLyBhZGRpdGlvbmFsbHkgYSBjaGVja0NsYXNoZXMgb2JqZWN0IG1heSBiZSBzcGVjaWZpZWQgdG8gYWxsb3cgY2hlY2tpbmcgZm9yXG4vLyBkdXBsaWNhdGUgYXJndW1lbnQgbmFtZXMuIGNoZWNrQ2xhc2hlcyBpcyBpZ25vcmVkIGlmIHRoZSBwcm92aWRlZCBjb25zdHJ1Y3Rcbi8vIGlzIGFuIGFzc2lnbm1lbnQgKGkuZS4sIGJpbmRpbmdUeXBlIGlzIEJJTkRfTk9ORSkuXG5cbnBwJDcuY2hlY2tMVmFsU2ltcGxlID0gZnVuY3Rpb24oZXhwciwgYmluZGluZ1R5cGUsIGNoZWNrQ2xhc2hlcykge1xuICBpZiAoIGJpbmRpbmdUeXBlID09PSB2b2lkIDAgKSBiaW5kaW5nVHlwZSA9IEJJTkRfTk9ORTtcblxuICB2YXIgaXNCaW5kID0gYmluZGluZ1R5cGUgIT09IEJJTkRfTk9ORTtcblxuICBzd2l0Y2ggKGV4cHIudHlwZSkge1xuICBjYXNlIFwiSWRlbnRpZmllclwiOlxuICAgIGlmICh0aGlzLnN0cmljdCAmJiB0aGlzLnJlc2VydmVkV29yZHNTdHJpY3RCaW5kLnRlc3QoZXhwci5uYW1lKSlcbiAgICAgIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKGV4cHIuc3RhcnQsIChpc0JpbmQgPyBcIkJpbmRpbmcgXCIgOiBcIkFzc2lnbmluZyB0byBcIikgKyBleHByLm5hbWUgKyBcIiBpbiBzdHJpY3QgbW9kZVwiKTsgfVxuICAgIGlmIChpc0JpbmQpIHtcbiAgICAgIGlmIChiaW5kaW5nVHlwZSA9PT0gQklORF9MRVhJQ0FMICYmIGV4cHIubmFtZSA9PT0gXCJsZXRcIilcbiAgICAgICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUoZXhwci5zdGFydCwgXCJsZXQgaXMgZGlzYWxsb3dlZCBhcyBhIGxleGljYWxseSBib3VuZCBuYW1lXCIpOyB9XG4gICAgICBpZiAoY2hlY2tDbGFzaGVzKSB7XG4gICAgICAgIGlmIChoYXNPd24oY2hlY2tDbGFzaGVzLCBleHByLm5hbWUpKVxuICAgICAgICAgIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKGV4cHIuc3RhcnQsIFwiQXJndW1lbnQgbmFtZSBjbGFzaFwiKTsgfVxuICAgICAgICBjaGVja0NsYXNoZXNbZXhwci5uYW1lXSA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAoYmluZGluZ1R5cGUgIT09IEJJTkRfT1VUU0lERSkgeyB0aGlzLmRlY2xhcmVOYW1lKGV4cHIubmFtZSwgYmluZGluZ1R5cGUsIGV4cHIuc3RhcnQpOyB9XG4gICAgfVxuICAgIGJyZWFrXG5cbiAgY2FzZSBcIkNoYWluRXhwcmVzc2lvblwiOlxuICAgIHRoaXMucmFpc2VSZWNvdmVyYWJsZShleHByLnN0YXJ0LCBcIk9wdGlvbmFsIGNoYWluaW5nIGNhbm5vdCBhcHBlYXIgaW4gbGVmdC1oYW5kIHNpZGVcIik7XG4gICAgYnJlYWtcblxuICBjYXNlIFwiTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgIGlmIChpc0JpbmQpIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKGV4cHIuc3RhcnQsIFwiQmluZGluZyBtZW1iZXIgZXhwcmVzc2lvblwiKTsgfVxuICAgIGJyZWFrXG5cbiAgY2FzZSBcIlBhcmVudGhlc2l6ZWRFeHByZXNzaW9uXCI6XG4gICAgaWYgKGlzQmluZCkgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUoZXhwci5zdGFydCwgXCJCaW5kaW5nIHBhcmVudGhlc2l6ZWQgZXhwcmVzc2lvblwiKTsgfVxuICAgIHJldHVybiB0aGlzLmNoZWNrTFZhbFNpbXBsZShleHByLmV4cHJlc3Npb24sIGJpbmRpbmdUeXBlLCBjaGVja0NsYXNoZXMpXG5cbiAgZGVmYXVsdDpcbiAgICB0aGlzLnJhaXNlKGV4cHIuc3RhcnQsIChpc0JpbmQgPyBcIkJpbmRpbmdcIiA6IFwiQXNzaWduaW5nIHRvXCIpICsgXCIgcnZhbHVlXCIpO1xuICB9XG59O1xuXG5wcCQ3LmNoZWNrTFZhbFBhdHRlcm4gPSBmdW5jdGlvbihleHByLCBiaW5kaW5nVHlwZSwgY2hlY2tDbGFzaGVzKSB7XG4gIGlmICggYmluZGluZ1R5cGUgPT09IHZvaWQgMCApIGJpbmRpbmdUeXBlID0gQklORF9OT05FO1xuXG4gIHN3aXRjaCAoZXhwci50eXBlKSB7XG4gIGNhc2UgXCJPYmplY3RQYXR0ZXJuXCI6XG4gICAgZm9yICh2YXIgaSA9IDAsIGxpc3QgPSBleHByLnByb3BlcnRpZXM7IGkgPCBsaXN0Lmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICB2YXIgcHJvcCA9IGxpc3RbaV07XG5cbiAgICB0aGlzLmNoZWNrTFZhbElubmVyUGF0dGVybihwcm9wLCBiaW5kaW5nVHlwZSwgY2hlY2tDbGFzaGVzKTtcbiAgICB9XG4gICAgYnJlYWtcblxuICBjYXNlIFwiQXJyYXlQYXR0ZXJuXCI6XG4gICAgZm9yICh2YXIgaSQxID0gMCwgbGlzdCQxID0gZXhwci5lbGVtZW50czsgaSQxIDwgbGlzdCQxLmxlbmd0aDsgaSQxICs9IDEpIHtcbiAgICAgIHZhciBlbGVtID0gbGlzdCQxW2kkMV07XG5cbiAgICBpZiAoZWxlbSkgeyB0aGlzLmNoZWNrTFZhbElubmVyUGF0dGVybihlbGVtLCBiaW5kaW5nVHlwZSwgY2hlY2tDbGFzaGVzKTsgfVxuICAgIH1cbiAgICBicmVha1xuXG4gIGRlZmF1bHQ6XG4gICAgdGhpcy5jaGVja0xWYWxTaW1wbGUoZXhwciwgYmluZGluZ1R5cGUsIGNoZWNrQ2xhc2hlcyk7XG4gIH1cbn07XG5cbnBwJDcuY2hlY2tMVmFsSW5uZXJQYXR0ZXJuID0gZnVuY3Rpb24oZXhwciwgYmluZGluZ1R5cGUsIGNoZWNrQ2xhc2hlcykge1xuICBpZiAoIGJpbmRpbmdUeXBlID09PSB2b2lkIDAgKSBiaW5kaW5nVHlwZSA9IEJJTkRfTk9ORTtcblxuICBzd2l0Y2ggKGV4cHIudHlwZSkge1xuICBjYXNlIFwiUHJvcGVydHlcIjpcbiAgICAvLyBBc3NpZ25tZW50UHJvcGVydHkgaGFzIHR5cGUgPT09IFwiUHJvcGVydHlcIlxuICAgIHRoaXMuY2hlY2tMVmFsSW5uZXJQYXR0ZXJuKGV4cHIudmFsdWUsIGJpbmRpbmdUeXBlLCBjaGVja0NsYXNoZXMpO1xuICAgIGJyZWFrXG5cbiAgY2FzZSBcIkFzc2lnbm1lbnRQYXR0ZXJuXCI6XG4gICAgdGhpcy5jaGVja0xWYWxQYXR0ZXJuKGV4cHIubGVmdCwgYmluZGluZ1R5cGUsIGNoZWNrQ2xhc2hlcyk7XG4gICAgYnJlYWtcblxuICBjYXNlIFwiUmVzdEVsZW1lbnRcIjpcbiAgICB0aGlzLmNoZWNrTFZhbFBhdHRlcm4oZXhwci5hcmd1bWVudCwgYmluZGluZ1R5cGUsIGNoZWNrQ2xhc2hlcyk7XG4gICAgYnJlYWtcblxuICBkZWZhdWx0OlxuICAgIHRoaXMuY2hlY2tMVmFsUGF0dGVybihleHByLCBiaW5kaW5nVHlwZSwgY2hlY2tDbGFzaGVzKTtcbiAgfVxufTtcblxuLy8gVGhlIGFsZ29yaXRobSB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIGEgcmVnZXhwIGNhbiBhcHBlYXIgYXQgYVxuLy8gZ2l2ZW4gcG9pbnQgaW4gdGhlIHByb2dyYW0gaXMgbG9vc2VseSBiYXNlZCBvbiBzd2VldC5qcycgYXBwcm9hY2guXG4vLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL21vemlsbGEvc3dlZXQuanMvd2lraS9kZXNpZ25cblxuXG52YXIgVG9rQ29udGV4dCA9IGZ1bmN0aW9uIFRva0NvbnRleHQodG9rZW4sIGlzRXhwciwgcHJlc2VydmVTcGFjZSwgb3ZlcnJpZGUsIGdlbmVyYXRvcikge1xuICB0aGlzLnRva2VuID0gdG9rZW47XG4gIHRoaXMuaXNFeHByID0gISFpc0V4cHI7XG4gIHRoaXMucHJlc2VydmVTcGFjZSA9ICEhcHJlc2VydmVTcGFjZTtcbiAgdGhpcy5vdmVycmlkZSA9IG92ZXJyaWRlO1xuICB0aGlzLmdlbmVyYXRvciA9ICEhZ2VuZXJhdG9yO1xufTtcblxudmFyIHR5cGVzID0ge1xuICBiX3N0YXQ6IG5ldyBUb2tDb250ZXh0KFwie1wiLCBmYWxzZSksXG4gIGJfZXhwcjogbmV3IFRva0NvbnRleHQoXCJ7XCIsIHRydWUpLFxuICBiX3RtcGw6IG5ldyBUb2tDb250ZXh0KFwiJHtcIiwgZmFsc2UpLFxuICBwX3N0YXQ6IG5ldyBUb2tDb250ZXh0KFwiKFwiLCBmYWxzZSksXG4gIHBfZXhwcjogbmV3IFRva0NvbnRleHQoXCIoXCIsIHRydWUpLFxuICBxX3RtcGw6IG5ldyBUb2tDb250ZXh0KFwiYFwiLCB0cnVlLCB0cnVlLCBmdW5jdGlvbiAocCkgeyByZXR1cm4gcC50cnlSZWFkVGVtcGxhdGVUb2tlbigpOyB9KSxcbiAgZl9zdGF0OiBuZXcgVG9rQ29udGV4dChcImZ1bmN0aW9uXCIsIGZhbHNlKSxcbiAgZl9leHByOiBuZXcgVG9rQ29udGV4dChcImZ1bmN0aW9uXCIsIHRydWUpLFxuICBmX2V4cHJfZ2VuOiBuZXcgVG9rQ29udGV4dChcImZ1bmN0aW9uXCIsIHRydWUsIGZhbHNlLCBudWxsLCB0cnVlKSxcbiAgZl9nZW46IG5ldyBUb2tDb250ZXh0KFwiZnVuY3Rpb25cIiwgZmFsc2UsIGZhbHNlLCBudWxsLCB0cnVlKVxufTtcblxudmFyIHBwJDYgPSBQYXJzZXIucHJvdG90eXBlO1xuXG5wcCQ2LmluaXRpYWxDb250ZXh0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBbdHlwZXMuYl9zdGF0XVxufTtcblxucHAkNi5jdXJDb250ZXh0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmNvbnRleHRbdGhpcy5jb250ZXh0Lmxlbmd0aCAtIDFdXG59O1xuXG5wcCQ2LmJyYWNlSXNCbG9jayA9IGZ1bmN0aW9uKHByZXZUeXBlKSB7XG4gIHZhciBwYXJlbnQgPSB0aGlzLmN1ckNvbnRleHQoKTtcbiAgaWYgKHBhcmVudCA9PT0gdHlwZXMuZl9leHByIHx8IHBhcmVudCA9PT0gdHlwZXMuZl9zdGF0KVxuICAgIHsgcmV0dXJuIHRydWUgfVxuICBpZiAocHJldlR5cGUgPT09IHR5cGVzJDEuY29sb24gJiYgKHBhcmVudCA9PT0gdHlwZXMuYl9zdGF0IHx8IHBhcmVudCA9PT0gdHlwZXMuYl9leHByKSlcbiAgICB7IHJldHVybiAhcGFyZW50LmlzRXhwciB9XG5cbiAgLy8gVGhlIGNoZWNrIGZvciBgdHQubmFtZSAmJiBleHByQWxsb3dlZGAgZGV0ZWN0cyB3aGV0aGVyIHdlIGFyZVxuICAvLyBhZnRlciBhIGB5aWVsZGAgb3IgYG9mYCBjb25zdHJ1Y3QuIFNlZSB0aGUgYHVwZGF0ZUNvbnRleHRgIGZvclxuICAvLyBgdHQubmFtZWAuXG4gIGlmIChwcmV2VHlwZSA9PT0gdHlwZXMkMS5fcmV0dXJuIHx8IHByZXZUeXBlID09PSB0eXBlcyQxLm5hbWUgJiYgdGhpcy5leHByQWxsb3dlZClcbiAgICB7IHJldHVybiBsaW5lQnJlYWsudGVzdCh0aGlzLmlucHV0LnNsaWNlKHRoaXMubGFzdFRva0VuZCwgdGhpcy5zdGFydCkpIH1cbiAgaWYgKHByZXZUeXBlID09PSB0eXBlcyQxLl9lbHNlIHx8IHByZXZUeXBlID09PSB0eXBlcyQxLnNlbWkgfHwgcHJldlR5cGUgPT09IHR5cGVzJDEuZW9mIHx8IHByZXZUeXBlID09PSB0eXBlcyQxLnBhcmVuUiB8fCBwcmV2VHlwZSA9PT0gdHlwZXMkMS5hcnJvdylcbiAgICB7IHJldHVybiB0cnVlIH1cbiAgaWYgKHByZXZUeXBlID09PSB0eXBlcyQxLmJyYWNlTClcbiAgICB7IHJldHVybiBwYXJlbnQgPT09IHR5cGVzLmJfc3RhdCB9XG4gIGlmIChwcmV2VHlwZSA9PT0gdHlwZXMkMS5fdmFyIHx8IHByZXZUeXBlID09PSB0eXBlcyQxLl9jb25zdCB8fCBwcmV2VHlwZSA9PT0gdHlwZXMkMS5uYW1lKVxuICAgIHsgcmV0dXJuIGZhbHNlIH1cbiAgcmV0dXJuICF0aGlzLmV4cHJBbGxvd2VkXG59O1xuXG5wcCQ2LmluR2VuZXJhdG9yQ29udGV4dCA9IGZ1bmN0aW9uKCkge1xuICBmb3IgKHZhciBpID0gdGhpcy5jb250ZXh0Lmxlbmd0aCAtIDE7IGkgPj0gMTsgaS0tKSB7XG4gICAgdmFyIGNvbnRleHQgPSB0aGlzLmNvbnRleHRbaV07XG4gICAgaWYgKGNvbnRleHQudG9rZW4gPT09IFwiZnVuY3Rpb25cIilcbiAgICAgIHsgcmV0dXJuIGNvbnRleHQuZ2VuZXJhdG9yIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn07XG5cbnBwJDYudXBkYXRlQ29udGV4dCA9IGZ1bmN0aW9uKHByZXZUeXBlKSB7XG4gIHZhciB1cGRhdGUsIHR5cGUgPSB0aGlzLnR5cGU7XG4gIGlmICh0eXBlLmtleXdvcmQgJiYgcHJldlR5cGUgPT09IHR5cGVzJDEuZG90KVxuICAgIHsgdGhpcy5leHByQWxsb3dlZCA9IGZhbHNlOyB9XG4gIGVsc2UgaWYgKHVwZGF0ZSA9IHR5cGUudXBkYXRlQ29udGV4dClcbiAgICB7IHVwZGF0ZS5jYWxsKHRoaXMsIHByZXZUeXBlKTsgfVxuICBlbHNlXG4gICAgeyB0aGlzLmV4cHJBbGxvd2VkID0gdHlwZS5iZWZvcmVFeHByOyB9XG59O1xuXG4vLyBVc2VkIHRvIGhhbmRsZSBlZGdlIGNhc2VzIHdoZW4gdG9rZW4gY29udGV4dCBjb3VsZCBub3QgYmUgaW5mZXJyZWQgY29ycmVjdGx5IGR1cmluZyB0b2tlbml6YXRpb24gcGhhc2VcblxucHAkNi5vdmVycmlkZUNvbnRleHQgPSBmdW5jdGlvbih0b2tlbkN0eCkge1xuICBpZiAodGhpcy5jdXJDb250ZXh0KCkgIT09IHRva2VuQ3R4KSB7XG4gICAgdGhpcy5jb250ZXh0W3RoaXMuY29udGV4dC5sZW5ndGggLSAxXSA9IHRva2VuQ3R4O1xuICB9XG59O1xuXG4vLyBUb2tlbi1zcGVjaWZpYyBjb250ZXh0IHVwZGF0ZSBjb2RlXG5cbnR5cGVzJDEucGFyZW5SLnVwZGF0ZUNvbnRleHQgPSB0eXBlcyQxLmJyYWNlUi51cGRhdGVDb250ZXh0ID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmNvbnRleHQubGVuZ3RoID09PSAxKSB7XG4gICAgdGhpcy5leHByQWxsb3dlZCA9IHRydWU7XG4gICAgcmV0dXJuXG4gIH1cbiAgdmFyIG91dCA9IHRoaXMuY29udGV4dC5wb3AoKTtcbiAgaWYgKG91dCA9PT0gdHlwZXMuYl9zdGF0ICYmIHRoaXMuY3VyQ29udGV4dCgpLnRva2VuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBvdXQgPSB0aGlzLmNvbnRleHQucG9wKCk7XG4gIH1cbiAgdGhpcy5leHByQWxsb3dlZCA9ICFvdXQuaXNFeHByO1xufTtcblxudHlwZXMkMS5icmFjZUwudXBkYXRlQ29udGV4dCA9IGZ1bmN0aW9uKHByZXZUeXBlKSB7XG4gIHRoaXMuY29udGV4dC5wdXNoKHRoaXMuYnJhY2VJc0Jsb2NrKHByZXZUeXBlKSA/IHR5cGVzLmJfc3RhdCA6IHR5cGVzLmJfZXhwcik7XG4gIHRoaXMuZXhwckFsbG93ZWQgPSB0cnVlO1xufTtcblxudHlwZXMkMS5kb2xsYXJCcmFjZUwudXBkYXRlQ29udGV4dCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmNvbnRleHQucHVzaCh0eXBlcy5iX3RtcGwpO1xuICB0aGlzLmV4cHJBbGxvd2VkID0gdHJ1ZTtcbn07XG5cbnR5cGVzJDEucGFyZW5MLnVwZGF0ZUNvbnRleHQgPSBmdW5jdGlvbihwcmV2VHlwZSkge1xuICB2YXIgc3RhdGVtZW50UGFyZW5zID0gcHJldlR5cGUgPT09IHR5cGVzJDEuX2lmIHx8IHByZXZUeXBlID09PSB0eXBlcyQxLl9mb3IgfHwgcHJldlR5cGUgPT09IHR5cGVzJDEuX3dpdGggfHwgcHJldlR5cGUgPT09IHR5cGVzJDEuX3doaWxlO1xuICB0aGlzLmNvbnRleHQucHVzaChzdGF0ZW1lbnRQYXJlbnMgPyB0eXBlcy5wX3N0YXQgOiB0eXBlcy5wX2V4cHIpO1xuICB0aGlzLmV4cHJBbGxvd2VkID0gdHJ1ZTtcbn07XG5cbnR5cGVzJDEuaW5jRGVjLnVwZGF0ZUNvbnRleHQgPSBmdW5jdGlvbigpIHtcbiAgLy8gdG9rRXhwckFsbG93ZWQgc3RheXMgdW5jaGFuZ2VkXG59O1xuXG50eXBlcyQxLl9mdW5jdGlvbi51cGRhdGVDb250ZXh0ID0gdHlwZXMkMS5fY2xhc3MudXBkYXRlQ29udGV4dCA9IGZ1bmN0aW9uKHByZXZUeXBlKSB7XG4gIGlmIChwcmV2VHlwZS5iZWZvcmVFeHByICYmIHByZXZUeXBlICE9PSB0eXBlcyQxLl9lbHNlICYmXG4gICAgICAhKHByZXZUeXBlID09PSB0eXBlcyQxLnNlbWkgJiYgdGhpcy5jdXJDb250ZXh0KCkgIT09IHR5cGVzLnBfc3RhdCkgJiZcbiAgICAgICEocHJldlR5cGUgPT09IHR5cGVzJDEuX3JldHVybiAmJiBsaW5lQnJlYWsudGVzdCh0aGlzLmlucHV0LnNsaWNlKHRoaXMubGFzdFRva0VuZCwgdGhpcy5zdGFydCkpKSAmJlxuICAgICAgISgocHJldlR5cGUgPT09IHR5cGVzJDEuY29sb24gfHwgcHJldlR5cGUgPT09IHR5cGVzJDEuYnJhY2VMKSAmJiB0aGlzLmN1ckNvbnRleHQoKSA9PT0gdHlwZXMuYl9zdGF0KSlcbiAgICB7IHRoaXMuY29udGV4dC5wdXNoKHR5cGVzLmZfZXhwcik7IH1cbiAgZWxzZVxuICAgIHsgdGhpcy5jb250ZXh0LnB1c2godHlwZXMuZl9zdGF0KTsgfVxuICB0aGlzLmV4cHJBbGxvd2VkID0gZmFsc2U7XG59O1xuXG50eXBlcyQxLmNvbG9uLnVwZGF0ZUNvbnRleHQgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuY3VyQ29udGV4dCgpLnRva2VuID09PSBcImZ1bmN0aW9uXCIpIHsgdGhpcy5jb250ZXh0LnBvcCgpOyB9XG4gIHRoaXMuZXhwckFsbG93ZWQgPSB0cnVlO1xufTtcblxudHlwZXMkMS5iYWNrUXVvdGUudXBkYXRlQ29udGV4dCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5jdXJDb250ZXh0KCkgPT09IHR5cGVzLnFfdG1wbClcbiAgICB7IHRoaXMuY29udGV4dC5wb3AoKTsgfVxuICBlbHNlXG4gICAgeyB0aGlzLmNvbnRleHQucHVzaCh0eXBlcy5xX3RtcGwpOyB9XG4gIHRoaXMuZXhwckFsbG93ZWQgPSBmYWxzZTtcbn07XG5cbnR5cGVzJDEuc3Rhci51cGRhdGVDb250ZXh0ID0gZnVuY3Rpb24ocHJldlR5cGUpIHtcbiAgaWYgKHByZXZUeXBlID09PSB0eXBlcyQxLl9mdW5jdGlvbikge1xuICAgIHZhciBpbmRleCA9IHRoaXMuY29udGV4dC5sZW5ndGggLSAxO1xuICAgIGlmICh0aGlzLmNvbnRleHRbaW5kZXhdID09PSB0eXBlcy5mX2V4cHIpXG4gICAgICB7IHRoaXMuY29udGV4dFtpbmRleF0gPSB0eXBlcy5mX2V4cHJfZ2VuOyB9XG4gICAgZWxzZVxuICAgICAgeyB0aGlzLmNvbnRleHRbaW5kZXhdID0gdHlwZXMuZl9nZW47IH1cbiAgfVxuICB0aGlzLmV4cHJBbGxvd2VkID0gdHJ1ZTtcbn07XG5cbnR5cGVzJDEubmFtZS51cGRhdGVDb250ZXh0ID0gZnVuY3Rpb24ocHJldlR5cGUpIHtcbiAgdmFyIGFsbG93ZWQgPSBmYWxzZTtcbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2ICYmIHByZXZUeXBlICE9PSB0eXBlcyQxLmRvdCkge1xuICAgIGlmICh0aGlzLnZhbHVlID09PSBcIm9mXCIgJiYgIXRoaXMuZXhwckFsbG93ZWQgfHxcbiAgICAgICAgdGhpcy52YWx1ZSA9PT0gXCJ5aWVsZFwiICYmIHRoaXMuaW5HZW5lcmF0b3JDb250ZXh0KCkpXG4gICAgICB7IGFsbG93ZWQgPSB0cnVlOyB9XG4gIH1cbiAgdGhpcy5leHByQWxsb3dlZCA9IGFsbG93ZWQ7XG59O1xuXG4vLyBBIHJlY3Vyc2l2ZSBkZXNjZW50IHBhcnNlciBvcGVyYXRlcyBieSBkZWZpbmluZyBmdW5jdGlvbnMgZm9yIGFsbFxuLy8gc3ludGFjdGljIGVsZW1lbnRzLCBhbmQgcmVjdXJzaXZlbHkgY2FsbGluZyB0aG9zZSwgZWFjaCBmdW5jdGlvblxuLy8gYWR2YW5jaW5nIHRoZSBpbnB1dCBzdHJlYW0gYW5kIHJldHVybmluZyBhbiBBU1Qgbm9kZS4gUHJlY2VkZW5jZVxuLy8gb2YgY29uc3RydWN0cyAoZm9yIGV4YW1wbGUsIHRoZSBmYWN0IHRoYXQgYCF4WzFdYCBtZWFucyBgISh4WzFdKWBcbi8vIGluc3RlYWQgb2YgYCgheClbMV1gIGlzIGhhbmRsZWQgYnkgdGhlIGZhY3QgdGhhdCB0aGUgcGFyc2VyXG4vLyBmdW5jdGlvbiB0aGF0IHBhcnNlcyB1bmFyeSBwcmVmaXggb3BlcmF0b3JzIGlzIGNhbGxlZCBmaXJzdCwgYW5kXG4vLyBpbiB0dXJuIGNhbGxzIHRoZSBmdW5jdGlvbiB0aGF0IHBhcnNlcyBgW11gIHN1YnNjcmlwdHMgXHUyMDE0IHRoYXRcbi8vIHdheSwgaXQnbGwgcmVjZWl2ZSB0aGUgbm9kZSBmb3IgYHhbMV1gIGFscmVhZHkgcGFyc2VkLCBhbmQgd3JhcHNcbi8vICp0aGF0KiBpbiB0aGUgdW5hcnkgb3BlcmF0b3Igbm9kZS5cbi8vXG4vLyBBY29ybiB1c2VzIGFuIFtvcGVyYXRvciBwcmVjZWRlbmNlIHBhcnNlcl1bb3BwXSB0byBoYW5kbGUgYmluYXJ5XG4vLyBvcGVyYXRvciBwcmVjZWRlbmNlLCBiZWNhdXNlIGl0IGlzIG11Y2ggbW9yZSBjb21wYWN0IHRoYW4gdXNpbmdcbi8vIHRoZSB0ZWNobmlxdWUgb3V0bGluZWQgYWJvdmUsIHdoaWNoIHVzZXMgZGlmZmVyZW50LCBuZXN0aW5nXG4vLyBmdW5jdGlvbnMgdG8gc3BlY2lmeSBwcmVjZWRlbmNlLCBmb3IgYWxsIG9mIHRoZSB0ZW4gYmluYXJ5XG4vLyBwcmVjZWRlbmNlIGxldmVscyB0aGF0IEphdmFTY3JpcHQgZGVmaW5lcy5cbi8vXG4vLyBbb3BwXTogaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9PcGVyYXRvci1wcmVjZWRlbmNlX3BhcnNlclxuXG5cbnZhciBwcCQ1ID0gUGFyc2VyLnByb3RvdHlwZTtcblxuLy8gQ2hlY2sgaWYgcHJvcGVydHkgbmFtZSBjbGFzaGVzIHdpdGggYWxyZWFkeSBhZGRlZC5cbi8vIE9iamVjdC9jbGFzcyBnZXR0ZXJzIGFuZCBzZXR0ZXJzIGFyZSBub3QgYWxsb3dlZCB0byBjbGFzaCBcdTIwMTRcbi8vIGVpdGhlciB3aXRoIGVhY2ggb3RoZXIgb3Igd2l0aCBhbiBpbml0IHByb3BlcnR5IFx1MjAxNCBhbmQgaW5cbi8vIHN0cmljdCBtb2RlLCBpbml0IHByb3BlcnRpZXMgYXJlIGFsc28gbm90IGFsbG93ZWQgdG8gYmUgcmVwZWF0ZWQuXG5cbnBwJDUuY2hlY2tQcm9wQ2xhc2ggPSBmdW5jdGlvbihwcm9wLCBwcm9wSGFzaCwgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykge1xuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDkgJiYgcHJvcC50eXBlID09PSBcIlNwcmVhZEVsZW1lbnRcIilcbiAgICB7IHJldHVybiB9XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNiAmJiAocHJvcC5jb21wdXRlZCB8fCBwcm9wLm1ldGhvZCB8fCBwcm9wLnNob3J0aGFuZCkpXG4gICAgeyByZXR1cm4gfVxuICB2YXIga2V5ID0gcHJvcC5rZXk7XG4gIHZhciBuYW1lO1xuICBzd2l0Y2ggKGtleS50eXBlKSB7XG4gIGNhc2UgXCJJZGVudGlmaWVyXCI6IG5hbWUgPSBrZXkubmFtZTsgYnJlYWtcbiAgY2FzZSBcIkxpdGVyYWxcIjogbmFtZSA9IFN0cmluZyhrZXkudmFsdWUpOyBicmVha1xuICBkZWZhdWx0OiByZXR1cm5cbiAgfVxuICB2YXIga2luZCA9IHByb3Aua2luZDtcbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2KSB7XG4gICAgaWYgKG5hbWUgPT09IFwiX19wcm90b19fXCIgJiYga2luZCA9PT0gXCJpbml0XCIpIHtcbiAgICAgIGlmIChwcm9wSGFzaC5wcm90bykge1xuICAgICAgICBpZiAocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykge1xuICAgICAgICAgIGlmIChyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLmRvdWJsZVByb3RvIDwgMCkge1xuICAgICAgICAgICAgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy5kb3VibGVQcm90byA9IGtleS5zdGFydDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5yYWlzZVJlY292ZXJhYmxlKGtleS5zdGFydCwgXCJSZWRlZmluaXRpb24gb2YgX19wcm90b19fIHByb3BlcnR5XCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwcm9wSGFzaC5wcm90byA9IHRydWU7XG4gICAgfVxuICAgIHJldHVyblxuICB9XG4gIG5hbWUgPSBcIiRcIiArIG5hbWU7XG4gIHZhciBvdGhlciA9IHByb3BIYXNoW25hbWVdO1xuICBpZiAob3RoZXIpIHtcbiAgICB2YXIgcmVkZWZpbml0aW9uO1xuICAgIGlmIChraW5kID09PSBcImluaXRcIikge1xuICAgICAgcmVkZWZpbml0aW9uID0gdGhpcy5zdHJpY3QgJiYgb3RoZXIuaW5pdCB8fCBvdGhlci5nZXQgfHwgb3RoZXIuc2V0O1xuICAgIH0gZWxzZSB7XG4gICAgICByZWRlZmluaXRpb24gPSBvdGhlci5pbml0IHx8IG90aGVyW2tpbmRdO1xuICAgIH1cbiAgICBpZiAocmVkZWZpbml0aW9uKVxuICAgICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUoa2V5LnN0YXJ0LCBcIlJlZGVmaW5pdGlvbiBvZiBwcm9wZXJ0eVwiKTsgfVxuICB9IGVsc2Uge1xuICAgIG90aGVyID0gcHJvcEhhc2hbbmFtZV0gPSB7XG4gICAgICBpbml0OiBmYWxzZSxcbiAgICAgIGdldDogZmFsc2UsXG4gICAgICBzZXQ6IGZhbHNlXG4gICAgfTtcbiAgfVxuICBvdGhlcltraW5kXSA9IHRydWU7XG59O1xuXG4vLyAjIyMgRXhwcmVzc2lvbiBwYXJzaW5nXG5cbi8vIFRoZXNlIG5lc3QsIGZyb20gdGhlIG1vc3QgZ2VuZXJhbCBleHByZXNzaW9uIHR5cGUgYXQgdGhlIHRvcCB0b1xuLy8gJ2F0b21pYycsIG5vbmRpdmlzaWJsZSBleHByZXNzaW9uIHR5cGVzIGF0IHRoZSBib3R0b20uIE1vc3Qgb2Zcbi8vIHRoZSBmdW5jdGlvbnMgd2lsbCBzaW1wbHkgbGV0IHRoZSBmdW5jdGlvbihzKSBiZWxvdyB0aGVtIHBhcnNlLFxuLy8gYW5kLCAqaWYqIHRoZSBzeW50YWN0aWMgY29uc3RydWN0IHRoZXkgaGFuZGxlIGlzIHByZXNlbnQsIHdyYXBcbi8vIHRoZSBBU1Qgbm9kZSB0aGF0IHRoZSBpbm5lciBwYXJzZXIgZ2F2ZSB0aGVtIGluIGFub3RoZXIgbm9kZS5cblxuLy8gUGFyc2UgYSBmdWxsIGV4cHJlc3Npb24uIFRoZSBvcHRpb25hbCBhcmd1bWVudHMgYXJlIHVzZWQgdG9cbi8vIGZvcmJpZCB0aGUgYGluYCBvcGVyYXRvciAoaW4gZm9yIGxvb3BzIGluaXRhbGl6YXRpb24gZXhwcmVzc2lvbnMpXG4vLyBhbmQgcHJvdmlkZSByZWZlcmVuY2UgZm9yIHN0b3JpbmcgJz0nIG9wZXJhdG9yIGluc2lkZSBzaG9ydGhhbmRcbi8vIHByb3BlcnR5IGFzc2lnbm1lbnQgaW4gY29udGV4dHMgd2hlcmUgYm90aCBvYmplY3QgZXhwcmVzc2lvblxuLy8gYW5kIG9iamVjdCBwYXR0ZXJuIG1pZ2h0IGFwcGVhciAoc28gaXQncyBwb3NzaWJsZSB0byByYWlzZVxuLy8gZGVsYXllZCBzeW50YXggZXJyb3IgYXQgY29ycmVjdCBwb3NpdGlvbikuXG5cbnBwJDUucGFyc2VFeHByZXNzaW9uID0gZnVuY3Rpb24oZm9ySW5pdCwgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykge1xuICB2YXIgc3RhcnRQb3MgPSB0aGlzLnN0YXJ0LCBzdGFydExvYyA9IHRoaXMuc3RhcnRMb2M7XG4gIHZhciBleHByID0gdGhpcy5wYXJzZU1heWJlQXNzaWduKGZvckluaXQsIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpO1xuICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLmNvbW1hKSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZUF0KHN0YXJ0UG9zLCBzdGFydExvYyk7XG4gICAgbm9kZS5leHByZXNzaW9ucyA9IFtleHByXTtcbiAgICB3aGlsZSAodGhpcy5lYXQodHlwZXMkMS5jb21tYSkpIHsgbm9kZS5leHByZXNzaW9ucy5wdXNoKHRoaXMucGFyc2VNYXliZUFzc2lnbihmb3JJbml0LCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKSk7IH1cbiAgICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiU2VxdWVuY2VFeHByZXNzaW9uXCIpXG4gIH1cbiAgcmV0dXJuIGV4cHJcbn07XG5cbi8vIFBhcnNlIGFuIGFzc2lnbm1lbnQgZXhwcmVzc2lvbi4gVGhpcyBpbmNsdWRlcyBhcHBsaWNhdGlvbnMgb2Zcbi8vIG9wZXJhdG9ycyBsaWtlIGArPWAuXG5cbnBwJDUucGFyc2VNYXliZUFzc2lnbiA9IGZ1bmN0aW9uKGZvckluaXQsIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMsIGFmdGVyTGVmdFBhcnNlKSB7XG4gIGlmICh0aGlzLmlzQ29udGV4dHVhbChcInlpZWxkXCIpKSB7XG4gICAgaWYgKHRoaXMuaW5HZW5lcmF0b3IpIHsgcmV0dXJuIHRoaXMucGFyc2VZaWVsZChmb3JJbml0KSB9XG4gICAgLy8gVGhlIHRva2VuaXplciB3aWxsIGFzc3VtZSBhbiBleHByZXNzaW9uIGlzIGFsbG93ZWQgYWZ0ZXJcbiAgICAvLyBgeWllbGRgLCBidXQgdGhpcyBpc24ndCB0aGF0IGtpbmQgb2YgeWllbGRcbiAgICBlbHNlIHsgdGhpcy5leHByQWxsb3dlZCA9IGZhbHNlOyB9XG4gIH1cblxuICB2YXIgb3duRGVzdHJ1Y3R1cmluZ0Vycm9ycyA9IGZhbHNlLCBvbGRQYXJlbkFzc2lnbiA9IC0xLCBvbGRUcmFpbGluZ0NvbW1hID0gLTEsIG9sZERvdWJsZVByb3RvID0gLTE7XG4gIGlmIChyZWZEZXN0cnVjdHVyaW5nRXJyb3JzKSB7XG4gICAgb2xkUGFyZW5Bc3NpZ24gPSByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnBhcmVudGhlc2l6ZWRBc3NpZ247XG4gICAgb2xkVHJhaWxpbmdDb21tYSA9IHJlZkRlc3RydWN0dXJpbmdFcnJvcnMudHJhaWxpbmdDb21tYTtcbiAgICBvbGREb3VibGVQcm90byA9IHJlZkRlc3RydWN0dXJpbmdFcnJvcnMuZG91YmxlUHJvdG87XG4gICAgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy5wYXJlbnRoZXNpemVkQXNzaWduID0gcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy50cmFpbGluZ0NvbW1hID0gLTE7XG4gIH0gZWxzZSB7XG4gICAgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycyA9IG5ldyBEZXN0cnVjdHVyaW5nRXJyb3JzO1xuICAgIG93bkRlc3RydWN0dXJpbmdFcnJvcnMgPSB0cnVlO1xuICB9XG5cbiAgdmFyIHN0YXJ0UG9zID0gdGhpcy5zdGFydCwgc3RhcnRMb2MgPSB0aGlzLnN0YXJ0TG9jO1xuICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLnBhcmVuTCB8fCB0aGlzLnR5cGUgPT09IHR5cGVzJDEubmFtZSkge1xuICAgIHRoaXMucG90ZW50aWFsQXJyb3dBdCA9IHRoaXMuc3RhcnQ7XG4gICAgdGhpcy5wb3RlbnRpYWxBcnJvd0luRm9yQXdhaXQgPSBmb3JJbml0ID09PSBcImF3YWl0XCI7XG4gIH1cbiAgdmFyIGxlZnQgPSB0aGlzLnBhcnNlTWF5YmVDb25kaXRpb25hbChmb3JJbml0LCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKTtcbiAgaWYgKGFmdGVyTGVmdFBhcnNlKSB7IGxlZnQgPSBhZnRlckxlZnRQYXJzZS5jYWxsKHRoaXMsIGxlZnQsIHN0YXJ0UG9zLCBzdGFydExvYyk7IH1cbiAgaWYgKHRoaXMudHlwZS5pc0Fzc2lnbikge1xuICAgIHZhciBub2RlID0gdGhpcy5zdGFydE5vZGVBdChzdGFydFBvcywgc3RhcnRMb2MpO1xuICAgIG5vZGUub3BlcmF0b3IgPSB0aGlzLnZhbHVlO1xuICAgIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuZXEpXG4gICAgICB7IGxlZnQgPSB0aGlzLnRvQXNzaWduYWJsZShsZWZ0LCBmYWxzZSwgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycyk7IH1cbiAgICBpZiAoIW93bkRlc3RydWN0dXJpbmdFcnJvcnMpIHtcbiAgICAgIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMucGFyZW50aGVzaXplZEFzc2lnbiA9IHJlZkRlc3RydWN0dXJpbmdFcnJvcnMudHJhaWxpbmdDb21tYSA9IHJlZkRlc3RydWN0dXJpbmdFcnJvcnMuZG91YmxlUHJvdG8gPSAtMTtcbiAgICB9XG4gICAgaWYgKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMuc2hvcnRoYW5kQXNzaWduID49IGxlZnQuc3RhcnQpXG4gICAgICB7IHJlZkRlc3RydWN0dXJpbmdFcnJvcnMuc2hvcnRoYW5kQXNzaWduID0gLTE7IH0gLy8gcmVzZXQgYmVjYXVzZSBzaG9ydGhhbmQgZGVmYXVsdCB3YXMgdXNlZCBjb3JyZWN0bHlcbiAgICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLmVxKVxuICAgICAgeyB0aGlzLmNoZWNrTFZhbFBhdHRlcm4obGVmdCk7IH1cbiAgICBlbHNlXG4gICAgICB7IHRoaXMuY2hlY2tMVmFsU2ltcGxlKGxlZnQpOyB9XG4gICAgbm9kZS5sZWZ0ID0gbGVmdDtcbiAgICB0aGlzLm5leHQoKTtcbiAgICBub2RlLnJpZ2h0ID0gdGhpcy5wYXJzZU1heWJlQXNzaWduKGZvckluaXQpO1xuICAgIGlmIChvbGREb3VibGVQcm90byA+IC0xKSB7IHJlZkRlc3RydWN0dXJpbmdFcnJvcnMuZG91YmxlUHJvdG8gPSBvbGREb3VibGVQcm90bzsgfVxuICAgIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJBc3NpZ25tZW50RXhwcmVzc2lvblwiKVxuICB9IGVsc2Uge1xuICAgIGlmIChvd25EZXN0cnVjdHVyaW5nRXJyb3JzKSB7IHRoaXMuY2hlY2tFeHByZXNzaW9uRXJyb3JzKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMsIHRydWUpOyB9XG4gIH1cbiAgaWYgKG9sZFBhcmVuQXNzaWduID4gLTEpIHsgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy5wYXJlbnRoZXNpemVkQXNzaWduID0gb2xkUGFyZW5Bc3NpZ247IH1cbiAgaWYgKG9sZFRyYWlsaW5nQ29tbWEgPiAtMSkgeyByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnRyYWlsaW5nQ29tbWEgPSBvbGRUcmFpbGluZ0NvbW1hOyB9XG4gIHJldHVybiBsZWZ0XG59O1xuXG4vLyBQYXJzZSBhIHRlcm5hcnkgY29uZGl0aW9uYWwgKGA/OmApIG9wZXJhdG9yLlxuXG5wcCQ1LnBhcnNlTWF5YmVDb25kaXRpb25hbCA9IGZ1bmN0aW9uKGZvckluaXQsIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpIHtcbiAgdmFyIHN0YXJ0UG9zID0gdGhpcy5zdGFydCwgc3RhcnRMb2MgPSB0aGlzLnN0YXJ0TG9jO1xuICB2YXIgZXhwciA9IHRoaXMucGFyc2VFeHByT3BzKGZvckluaXQsIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpO1xuICBpZiAodGhpcy5jaGVja0V4cHJlc3Npb25FcnJvcnMocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykpIHsgcmV0dXJuIGV4cHIgfVxuICBpZiAodGhpcy5lYXQodHlwZXMkMS5xdWVzdGlvbikpIHtcbiAgICB2YXIgbm9kZSA9IHRoaXMuc3RhcnROb2RlQXQoc3RhcnRQb3MsIHN0YXJ0TG9jKTtcbiAgICBub2RlLnRlc3QgPSBleHByO1xuICAgIG5vZGUuY29uc2VxdWVudCA9IHRoaXMucGFyc2VNYXliZUFzc2lnbigpO1xuICAgIHRoaXMuZXhwZWN0KHR5cGVzJDEuY29sb24pO1xuICAgIG5vZGUuYWx0ZXJuYXRlID0gdGhpcy5wYXJzZU1heWJlQXNzaWduKGZvckluaXQpO1xuICAgIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJDb25kaXRpb25hbEV4cHJlc3Npb25cIilcbiAgfVxuICByZXR1cm4gZXhwclxufTtcblxuLy8gU3RhcnQgdGhlIHByZWNlZGVuY2UgcGFyc2VyLlxuXG5wcCQ1LnBhcnNlRXhwck9wcyA9IGZ1bmN0aW9uKGZvckluaXQsIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpIHtcbiAgdmFyIHN0YXJ0UG9zID0gdGhpcy5zdGFydCwgc3RhcnRMb2MgPSB0aGlzLnN0YXJ0TG9jO1xuICB2YXIgZXhwciA9IHRoaXMucGFyc2VNYXliZVVuYXJ5KHJlZkRlc3RydWN0dXJpbmdFcnJvcnMsIGZhbHNlLCBmYWxzZSwgZm9ySW5pdCk7XG4gIGlmICh0aGlzLmNoZWNrRXhwcmVzc2lvbkVycm9ycyhyZWZEZXN0cnVjdHVyaW5nRXJyb3JzKSkgeyByZXR1cm4gZXhwciB9XG4gIHJldHVybiBleHByLnN0YXJ0ID09PSBzdGFydFBvcyAmJiBleHByLnR5cGUgPT09IFwiQXJyb3dGdW5jdGlvbkV4cHJlc3Npb25cIiA/IGV4cHIgOiB0aGlzLnBhcnNlRXhwck9wKGV4cHIsIHN0YXJ0UG9zLCBzdGFydExvYywgLTEsIGZvckluaXQpXG59O1xuXG4vLyBQYXJzZSBiaW5hcnkgb3BlcmF0b3JzIHdpdGggdGhlIG9wZXJhdG9yIHByZWNlZGVuY2UgcGFyc2luZ1xuLy8gYWxnb3JpdGhtLiBgbGVmdGAgaXMgdGhlIGxlZnQtaGFuZCBzaWRlIG9mIHRoZSBvcGVyYXRvci5cbi8vIGBtaW5QcmVjYCBwcm92aWRlcyBjb250ZXh0IHRoYXQgYWxsb3dzIHRoZSBmdW5jdGlvbiB0byBzdG9wIGFuZFxuLy8gZGVmZXIgZnVydGhlciBwYXJzZXIgdG8gb25lIG9mIGl0cyBjYWxsZXJzIHdoZW4gaXQgZW5jb3VudGVycyBhblxuLy8gb3BlcmF0b3IgdGhhdCBoYXMgYSBsb3dlciBwcmVjZWRlbmNlIHRoYW4gdGhlIHNldCBpdCBpcyBwYXJzaW5nLlxuXG5wcCQ1LnBhcnNlRXhwck9wID0gZnVuY3Rpb24obGVmdCwgbGVmdFN0YXJ0UG9zLCBsZWZ0U3RhcnRMb2MsIG1pblByZWMsIGZvckluaXQpIHtcbiAgdmFyIHByZWMgPSB0aGlzLnR5cGUuYmlub3A7XG4gIGlmIChwcmVjICE9IG51bGwgJiYgKCFmb3JJbml0IHx8IHRoaXMudHlwZSAhPT0gdHlwZXMkMS5faW4pKSB7XG4gICAgaWYgKHByZWMgPiBtaW5QcmVjKSB7XG4gICAgICB2YXIgbG9naWNhbCA9IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5sb2dpY2FsT1IgfHwgdGhpcy50eXBlID09PSB0eXBlcyQxLmxvZ2ljYWxBTkQ7XG4gICAgICB2YXIgY29hbGVzY2UgPSB0aGlzLnR5cGUgPT09IHR5cGVzJDEuY29hbGVzY2U7XG4gICAgICBpZiAoY29hbGVzY2UpIHtcbiAgICAgICAgLy8gSGFuZGxlIHRoZSBwcmVjZWRlbmNlIG9mIGB0dC5jb2FsZXNjZWAgYXMgZXF1YWwgdG8gdGhlIHJhbmdlIG9mIGxvZ2ljYWwgZXhwcmVzc2lvbnMuXG4gICAgICAgIC8vIEluIG90aGVyIHdvcmRzLCBgbm9kZS5yaWdodGAgc2hvdWxkbid0IGNvbnRhaW4gbG9naWNhbCBleHByZXNzaW9ucyBpbiBvcmRlciB0byBjaGVjayB0aGUgbWl4ZWQgZXJyb3IuXG4gICAgICAgIHByZWMgPSB0eXBlcyQxLmxvZ2ljYWxBTkQuYmlub3A7XG4gICAgICB9XG4gICAgICB2YXIgb3AgPSB0aGlzLnZhbHVlO1xuICAgICAgdGhpcy5uZXh0KCk7XG4gICAgICB2YXIgc3RhcnRQb3MgPSB0aGlzLnN0YXJ0LCBzdGFydExvYyA9IHRoaXMuc3RhcnRMb2M7XG4gICAgICB2YXIgcmlnaHQgPSB0aGlzLnBhcnNlRXhwck9wKHRoaXMucGFyc2VNYXliZVVuYXJ5KG51bGwsIGZhbHNlLCBmYWxzZSwgZm9ySW5pdCksIHN0YXJ0UG9zLCBzdGFydExvYywgcHJlYywgZm9ySW5pdCk7XG4gICAgICB2YXIgbm9kZSA9IHRoaXMuYnVpbGRCaW5hcnkobGVmdFN0YXJ0UG9zLCBsZWZ0U3RhcnRMb2MsIGxlZnQsIHJpZ2h0LCBvcCwgbG9naWNhbCB8fCBjb2FsZXNjZSk7XG4gICAgICBpZiAoKGxvZ2ljYWwgJiYgdGhpcy50eXBlID09PSB0eXBlcyQxLmNvYWxlc2NlKSB8fCAoY29hbGVzY2UgJiYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5sb2dpY2FsT1IgfHwgdGhpcy50eXBlID09PSB0eXBlcyQxLmxvZ2ljYWxBTkQpKSkge1xuICAgICAgICB0aGlzLnJhaXNlUmVjb3ZlcmFibGUodGhpcy5zdGFydCwgXCJMb2dpY2FsIGV4cHJlc3Npb25zIGFuZCBjb2FsZXNjZSBleHByZXNzaW9ucyBjYW5ub3QgYmUgbWl4ZWQuIFdyYXAgZWl0aGVyIGJ5IHBhcmVudGhlc2VzXCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMucGFyc2VFeHByT3Aobm9kZSwgbGVmdFN0YXJ0UG9zLCBsZWZ0U3RhcnRMb2MsIG1pblByZWMsIGZvckluaXQpXG4gICAgfVxuICB9XG4gIHJldHVybiBsZWZ0XG59O1xuXG5wcCQ1LmJ1aWxkQmluYXJ5ID0gZnVuY3Rpb24oc3RhcnRQb3MsIHN0YXJ0TG9jLCBsZWZ0LCByaWdodCwgb3AsIGxvZ2ljYWwpIHtcbiAgaWYgKHJpZ2h0LnR5cGUgPT09IFwiUHJpdmF0ZUlkZW50aWZpZXJcIikgeyB0aGlzLnJhaXNlKHJpZ2h0LnN0YXJ0LCBcIlByaXZhdGUgaWRlbnRpZmllciBjYW4gb25seSBiZSBsZWZ0IHNpZGUgb2YgYmluYXJ5IGV4cHJlc3Npb25cIik7IH1cbiAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZUF0KHN0YXJ0UG9zLCBzdGFydExvYyk7XG4gIG5vZGUubGVmdCA9IGxlZnQ7XG4gIG5vZGUub3BlcmF0b3IgPSBvcDtcbiAgbm9kZS5yaWdodCA9IHJpZ2h0O1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIGxvZ2ljYWwgPyBcIkxvZ2ljYWxFeHByZXNzaW9uXCIgOiBcIkJpbmFyeUV4cHJlc3Npb25cIilcbn07XG5cbi8vIFBhcnNlIHVuYXJ5IG9wZXJhdG9ycywgYm90aCBwcmVmaXggYW5kIHBvc3RmaXguXG5cbnBwJDUucGFyc2VNYXliZVVuYXJ5ID0gZnVuY3Rpb24ocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycywgc2F3VW5hcnksIGluY0RlYywgZm9ySW5pdCkge1xuICB2YXIgc3RhcnRQb3MgPSB0aGlzLnN0YXJ0LCBzdGFydExvYyA9IHRoaXMuc3RhcnRMb2MsIGV4cHI7XG4gIGlmICh0aGlzLmlzQ29udGV4dHVhbChcImF3YWl0XCIpICYmIHRoaXMuY2FuQXdhaXQpIHtcbiAgICBleHByID0gdGhpcy5wYXJzZUF3YWl0KGZvckluaXQpO1xuICAgIHNhd1VuYXJ5ID0gdHJ1ZTtcbiAgfSBlbHNlIGlmICh0aGlzLnR5cGUucHJlZml4KSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpLCB1cGRhdGUgPSB0aGlzLnR5cGUgPT09IHR5cGVzJDEuaW5jRGVjO1xuICAgIG5vZGUub3BlcmF0b3IgPSB0aGlzLnZhbHVlO1xuICAgIG5vZGUucHJlZml4ID0gdHJ1ZTtcbiAgICB0aGlzLm5leHQoKTtcbiAgICBub2RlLmFyZ3VtZW50ID0gdGhpcy5wYXJzZU1heWJlVW5hcnkobnVsbCwgdHJ1ZSwgdXBkYXRlLCBmb3JJbml0KTtcbiAgICB0aGlzLmNoZWNrRXhwcmVzc2lvbkVycm9ycyhyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCB0cnVlKTtcbiAgICBpZiAodXBkYXRlKSB7IHRoaXMuY2hlY2tMVmFsU2ltcGxlKG5vZGUuYXJndW1lbnQpOyB9XG4gICAgZWxzZSBpZiAodGhpcy5zdHJpY3QgJiYgbm9kZS5vcGVyYXRvciA9PT0gXCJkZWxldGVcIiAmJiBpc0xvY2FsVmFyaWFibGVBY2Nlc3Mobm9kZS5hcmd1bWVudCkpXG4gICAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShub2RlLnN0YXJ0LCBcIkRlbGV0aW5nIGxvY2FsIHZhcmlhYmxlIGluIHN0cmljdCBtb2RlXCIpOyB9XG4gICAgZWxzZSBpZiAobm9kZS5vcGVyYXRvciA9PT0gXCJkZWxldGVcIiAmJiBpc1ByaXZhdGVGaWVsZEFjY2Vzcyhub2RlLmFyZ3VtZW50KSlcbiAgICAgIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKG5vZGUuc3RhcnQsIFwiUHJpdmF0ZSBmaWVsZHMgY2FuIG5vdCBiZSBkZWxldGVkXCIpOyB9XG4gICAgZWxzZSB7IHNhd1VuYXJ5ID0gdHJ1ZTsgfVxuICAgIGV4cHIgPSB0aGlzLmZpbmlzaE5vZGUobm9kZSwgdXBkYXRlID8gXCJVcGRhdGVFeHByZXNzaW9uXCIgOiBcIlVuYXJ5RXhwcmVzc2lvblwiKTtcbiAgfSBlbHNlIGlmICghc2F3VW5hcnkgJiYgdGhpcy50eXBlID09PSB0eXBlcyQxLnByaXZhdGVJZCkge1xuICAgIGlmICgoZm9ySW5pdCB8fCB0aGlzLnByaXZhdGVOYW1lU3RhY2subGVuZ3RoID09PSAwKSAmJiB0aGlzLm9wdGlvbnMuY2hlY2tQcml2YXRlRmllbGRzKSB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gICAgZXhwciA9IHRoaXMucGFyc2VQcml2YXRlSWRlbnQoKTtcbiAgICAvLyBvbmx5IGNvdWxkIGJlIHByaXZhdGUgZmllbGRzIGluICdpbicsIHN1Y2ggYXMgI3ggaW4gb2JqXG4gICAgaWYgKHRoaXMudHlwZSAhPT0gdHlwZXMkMS5faW4pIHsgdGhpcy51bmV4cGVjdGVkKCk7IH1cbiAgfSBlbHNlIHtcbiAgICBleHByID0gdGhpcy5wYXJzZUV4cHJTdWJzY3JpcHRzKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMsIGZvckluaXQpO1xuICAgIGlmICh0aGlzLmNoZWNrRXhwcmVzc2lvbkVycm9ycyhyZWZEZXN0cnVjdHVyaW5nRXJyb3JzKSkgeyByZXR1cm4gZXhwciB9XG4gICAgd2hpbGUgKHRoaXMudHlwZS5wb3N0Zml4ICYmICF0aGlzLmNhbkluc2VydFNlbWljb2xvbigpKSB7XG4gICAgICB2YXIgbm9kZSQxID0gdGhpcy5zdGFydE5vZGVBdChzdGFydFBvcywgc3RhcnRMb2MpO1xuICAgICAgbm9kZSQxLm9wZXJhdG9yID0gdGhpcy52YWx1ZTtcbiAgICAgIG5vZGUkMS5wcmVmaXggPSBmYWxzZTtcbiAgICAgIG5vZGUkMS5hcmd1bWVudCA9IGV4cHI7XG4gICAgICB0aGlzLmNoZWNrTFZhbFNpbXBsZShleHByKTtcbiAgICAgIHRoaXMubmV4dCgpO1xuICAgICAgZXhwciA9IHRoaXMuZmluaXNoTm9kZShub2RlJDEsIFwiVXBkYXRlRXhwcmVzc2lvblwiKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIWluY0RlYyAmJiB0aGlzLmVhdCh0eXBlcyQxLnN0YXJzdGFyKSkge1xuICAgIGlmIChzYXdVbmFyeSlcbiAgICAgIHsgdGhpcy51bmV4cGVjdGVkKHRoaXMubGFzdFRva1N0YXJ0KTsgfVxuICAgIGVsc2VcbiAgICAgIHsgcmV0dXJuIHRoaXMuYnVpbGRCaW5hcnkoc3RhcnRQb3MsIHN0YXJ0TG9jLCBleHByLCB0aGlzLnBhcnNlTWF5YmVVbmFyeShudWxsLCBmYWxzZSwgZmFsc2UsIGZvckluaXQpLCBcIioqXCIsIGZhbHNlKSB9XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGV4cHJcbiAgfVxufTtcblxuZnVuY3Rpb24gaXNMb2NhbFZhcmlhYmxlQWNjZXNzKG5vZGUpIHtcbiAgcmV0dXJuIChcbiAgICBub2RlLnR5cGUgPT09IFwiSWRlbnRpZmllclwiIHx8XG4gICAgbm9kZS50eXBlID09PSBcIlBhcmVudGhlc2l6ZWRFeHByZXNzaW9uXCIgJiYgaXNMb2NhbFZhcmlhYmxlQWNjZXNzKG5vZGUuZXhwcmVzc2lvbilcbiAgKVxufVxuXG5mdW5jdGlvbiBpc1ByaXZhdGVGaWVsZEFjY2Vzcyhub2RlKSB7XG4gIHJldHVybiAoXG4gICAgbm9kZS50eXBlID09PSBcIk1lbWJlckV4cHJlc3Npb25cIiAmJiBub2RlLnByb3BlcnR5LnR5cGUgPT09IFwiUHJpdmF0ZUlkZW50aWZpZXJcIiB8fFxuICAgIG5vZGUudHlwZSA9PT0gXCJDaGFpbkV4cHJlc3Npb25cIiAmJiBpc1ByaXZhdGVGaWVsZEFjY2Vzcyhub2RlLmV4cHJlc3Npb24pIHx8XG4gICAgbm9kZS50eXBlID09PSBcIlBhcmVudGhlc2l6ZWRFeHByZXNzaW9uXCIgJiYgaXNQcml2YXRlRmllbGRBY2Nlc3Mobm9kZS5leHByZXNzaW9uKVxuICApXG59XG5cbi8vIFBhcnNlIGNhbGwsIGRvdCwgYW5kIGBbXWAtc3Vic2NyaXB0IGV4cHJlc3Npb25zLlxuXG5wcCQ1LnBhcnNlRXhwclN1YnNjcmlwdHMgPSBmdW5jdGlvbihyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCBmb3JJbml0KSB7XG4gIHZhciBzdGFydFBvcyA9IHRoaXMuc3RhcnQsIHN0YXJ0TG9jID0gdGhpcy5zdGFydExvYztcbiAgdmFyIGV4cHIgPSB0aGlzLnBhcnNlRXhwckF0b20ocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycywgZm9ySW5pdCk7XG4gIGlmIChleHByLnR5cGUgPT09IFwiQXJyb3dGdW5jdGlvbkV4cHJlc3Npb25cIiAmJiB0aGlzLmlucHV0LnNsaWNlKHRoaXMubGFzdFRva1N0YXJ0LCB0aGlzLmxhc3RUb2tFbmQpICE9PSBcIilcIilcbiAgICB7IHJldHVybiBleHByIH1cbiAgdmFyIHJlc3VsdCA9IHRoaXMucGFyc2VTdWJzY3JpcHRzKGV4cHIsIHN0YXJ0UG9zLCBzdGFydExvYywgZmFsc2UsIGZvckluaXQpO1xuICBpZiAocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycyAmJiByZXN1bHQudHlwZSA9PT0gXCJNZW1iZXJFeHByZXNzaW9uXCIpIHtcbiAgICBpZiAocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy5wYXJlbnRoZXNpemVkQXNzaWduID49IHJlc3VsdC5zdGFydCkgeyByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnBhcmVudGhlc2l6ZWRBc3NpZ24gPSAtMTsgfVxuICAgIGlmIChyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnBhcmVudGhlc2l6ZWRCaW5kID49IHJlc3VsdC5zdGFydCkgeyByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnBhcmVudGhlc2l6ZWRCaW5kID0gLTE7IH1cbiAgICBpZiAocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy50cmFpbGluZ0NvbW1hID49IHJlc3VsdC5zdGFydCkgeyByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnRyYWlsaW5nQ29tbWEgPSAtMTsgfVxuICB9XG4gIHJldHVybiByZXN1bHRcbn07XG5cbnBwJDUucGFyc2VTdWJzY3JpcHRzID0gZnVuY3Rpb24oYmFzZSwgc3RhcnRQb3MsIHN0YXJ0TG9jLCBub0NhbGxzLCBmb3JJbml0KSB7XG4gIHZhciBtYXliZUFzeW5jQXJyb3cgPSB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOCAmJiBiYXNlLnR5cGUgPT09IFwiSWRlbnRpZmllclwiICYmIGJhc2UubmFtZSA9PT0gXCJhc3luY1wiICYmXG4gICAgICB0aGlzLmxhc3RUb2tFbmQgPT09IGJhc2UuZW5kICYmICF0aGlzLmNhbkluc2VydFNlbWljb2xvbigpICYmIGJhc2UuZW5kIC0gYmFzZS5zdGFydCA9PT0gNSAmJlxuICAgICAgdGhpcy5wb3RlbnRpYWxBcnJvd0F0ID09PSBiYXNlLnN0YXJ0O1xuICB2YXIgb3B0aW9uYWxDaGFpbmVkID0gZmFsc2U7XG5cbiAgd2hpbGUgKHRydWUpIHtcbiAgICB2YXIgZWxlbWVudCA9IHRoaXMucGFyc2VTdWJzY3JpcHQoYmFzZSwgc3RhcnRQb3MsIHN0YXJ0TG9jLCBub0NhbGxzLCBtYXliZUFzeW5jQXJyb3csIG9wdGlvbmFsQ2hhaW5lZCwgZm9ySW5pdCk7XG5cbiAgICBpZiAoZWxlbWVudC5vcHRpb25hbCkgeyBvcHRpb25hbENoYWluZWQgPSB0cnVlOyB9XG4gICAgaWYgKGVsZW1lbnQgPT09IGJhc2UgfHwgZWxlbWVudC50eXBlID09PSBcIkFycm93RnVuY3Rpb25FeHByZXNzaW9uXCIpIHtcbiAgICAgIGlmIChvcHRpb25hbENoYWluZWQpIHtcbiAgICAgICAgdmFyIGNoYWluTm9kZSA9IHRoaXMuc3RhcnROb2RlQXQoc3RhcnRQb3MsIHN0YXJ0TG9jKTtcbiAgICAgICAgY2hhaW5Ob2RlLmV4cHJlc3Npb24gPSBlbGVtZW50O1xuICAgICAgICBlbGVtZW50ID0gdGhpcy5maW5pc2hOb2RlKGNoYWluTm9kZSwgXCJDaGFpbkV4cHJlc3Npb25cIik7XG4gICAgICB9XG4gICAgICByZXR1cm4gZWxlbWVudFxuICAgIH1cblxuICAgIGJhc2UgPSBlbGVtZW50O1xuICB9XG59O1xuXG5wcCQ1LnNob3VsZFBhcnNlQXN5bmNBcnJvdyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gIXRoaXMuY2FuSW5zZXJ0U2VtaWNvbG9uKCkgJiYgdGhpcy5lYXQodHlwZXMkMS5hcnJvdylcbn07XG5cbnBwJDUucGFyc2VTdWJzY3JpcHRBc3luY0Fycm93ID0gZnVuY3Rpb24oc3RhcnRQb3MsIHN0YXJ0TG9jLCBleHByTGlzdCwgZm9ySW5pdCkge1xuICByZXR1cm4gdGhpcy5wYXJzZUFycm93RXhwcmVzc2lvbih0aGlzLnN0YXJ0Tm9kZUF0KHN0YXJ0UG9zLCBzdGFydExvYyksIGV4cHJMaXN0LCB0cnVlLCBmb3JJbml0KVxufTtcblxucHAkNS5wYXJzZVN1YnNjcmlwdCA9IGZ1bmN0aW9uKGJhc2UsIHN0YXJ0UG9zLCBzdGFydExvYywgbm9DYWxscywgbWF5YmVBc3luY0Fycm93LCBvcHRpb25hbENoYWluZWQsIGZvckluaXQpIHtcbiAgdmFyIG9wdGlvbmFsU3VwcG9ydGVkID0gdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDExO1xuICB2YXIgb3B0aW9uYWwgPSBvcHRpb25hbFN1cHBvcnRlZCAmJiB0aGlzLmVhdCh0eXBlcyQxLnF1ZXN0aW9uRG90KTtcbiAgaWYgKG5vQ2FsbHMgJiYgb3B0aW9uYWwpIHsgdGhpcy5yYWlzZSh0aGlzLmxhc3RUb2tTdGFydCwgXCJPcHRpb25hbCBjaGFpbmluZyBjYW5ub3QgYXBwZWFyIGluIHRoZSBjYWxsZWUgb2YgbmV3IGV4cHJlc3Npb25zXCIpOyB9XG5cbiAgdmFyIGNvbXB1dGVkID0gdGhpcy5lYXQodHlwZXMkMS5icmFja2V0TCk7XG4gIGlmIChjb21wdXRlZCB8fCAob3B0aW9uYWwgJiYgdGhpcy50eXBlICE9PSB0eXBlcyQxLnBhcmVuTCAmJiB0aGlzLnR5cGUgIT09IHR5cGVzJDEuYmFja1F1b3RlKSB8fCB0aGlzLmVhdCh0eXBlcyQxLmRvdCkpIHtcbiAgICB2YXIgbm9kZSA9IHRoaXMuc3RhcnROb2RlQXQoc3RhcnRQb3MsIHN0YXJ0TG9jKTtcbiAgICBub2RlLm9iamVjdCA9IGJhc2U7XG4gICAgaWYgKGNvbXB1dGVkKSB7XG4gICAgICBub2RlLnByb3BlcnR5ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgIHRoaXMuZXhwZWN0KHR5cGVzJDEuYnJhY2tldFIpO1xuICAgIH0gZWxzZSBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLnByaXZhdGVJZCAmJiBiYXNlLnR5cGUgIT09IFwiU3VwZXJcIikge1xuICAgICAgbm9kZS5wcm9wZXJ0eSA9IHRoaXMucGFyc2VQcml2YXRlSWRlbnQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbm9kZS5wcm9wZXJ0eSA9IHRoaXMucGFyc2VJZGVudCh0aGlzLm9wdGlvbnMuYWxsb3dSZXNlcnZlZCAhPT0gXCJuZXZlclwiKTtcbiAgICB9XG4gICAgbm9kZS5jb21wdXRlZCA9ICEhY29tcHV0ZWQ7XG4gICAgaWYgKG9wdGlvbmFsU3VwcG9ydGVkKSB7XG4gICAgICBub2RlLm9wdGlvbmFsID0gb3B0aW9uYWw7XG4gICAgfVxuICAgIGJhc2UgPSB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJNZW1iZXJFeHByZXNzaW9uXCIpO1xuICB9IGVsc2UgaWYgKCFub0NhbGxzICYmIHRoaXMuZWF0KHR5cGVzJDEucGFyZW5MKSkge1xuICAgIHZhciByZWZEZXN0cnVjdHVyaW5nRXJyb3JzID0gbmV3IERlc3RydWN0dXJpbmdFcnJvcnMsIG9sZFlpZWxkUG9zID0gdGhpcy55aWVsZFBvcywgb2xkQXdhaXRQb3MgPSB0aGlzLmF3YWl0UG9zLCBvbGRBd2FpdElkZW50UG9zID0gdGhpcy5hd2FpdElkZW50UG9zO1xuICAgIHRoaXMueWllbGRQb3MgPSAwO1xuICAgIHRoaXMuYXdhaXRQb3MgPSAwO1xuICAgIHRoaXMuYXdhaXRJZGVudFBvcyA9IDA7XG4gICAgdmFyIGV4cHJMaXN0ID0gdGhpcy5wYXJzZUV4cHJMaXN0KHR5cGVzJDEucGFyZW5SLCB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOCwgZmFsc2UsIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpO1xuICAgIGlmIChtYXliZUFzeW5jQXJyb3cgJiYgIW9wdGlvbmFsICYmIHRoaXMuc2hvdWxkUGFyc2VBc3luY0Fycm93KCkpIHtcbiAgICAgIHRoaXMuY2hlY2tQYXR0ZXJuRXJyb3JzKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMsIGZhbHNlKTtcbiAgICAgIHRoaXMuY2hlY2tZaWVsZEF3YWl0SW5EZWZhdWx0UGFyYW1zKCk7XG4gICAgICBpZiAodGhpcy5hd2FpdElkZW50UG9zID4gMClcbiAgICAgICAgeyB0aGlzLnJhaXNlKHRoaXMuYXdhaXRJZGVudFBvcywgXCJDYW5ub3QgdXNlICdhd2FpdCcgYXMgaWRlbnRpZmllciBpbnNpZGUgYW4gYXN5bmMgZnVuY3Rpb25cIik7IH1cbiAgICAgIHRoaXMueWllbGRQb3MgPSBvbGRZaWVsZFBvcztcbiAgICAgIHRoaXMuYXdhaXRQb3MgPSBvbGRBd2FpdFBvcztcbiAgICAgIHRoaXMuYXdhaXRJZGVudFBvcyA9IG9sZEF3YWl0SWRlbnRQb3M7XG4gICAgICByZXR1cm4gdGhpcy5wYXJzZVN1YnNjcmlwdEFzeW5jQXJyb3coc3RhcnRQb3MsIHN0YXJ0TG9jLCBleHByTGlzdCwgZm9ySW5pdClcbiAgICB9XG4gICAgdGhpcy5jaGVja0V4cHJlc3Npb25FcnJvcnMocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycywgdHJ1ZSk7XG4gICAgdGhpcy55aWVsZFBvcyA9IG9sZFlpZWxkUG9zIHx8IHRoaXMueWllbGRQb3M7XG4gICAgdGhpcy5hd2FpdFBvcyA9IG9sZEF3YWl0UG9zIHx8IHRoaXMuYXdhaXRQb3M7XG4gICAgdGhpcy5hd2FpdElkZW50UG9zID0gb2xkQXdhaXRJZGVudFBvcyB8fCB0aGlzLmF3YWl0SWRlbnRQb3M7XG4gICAgdmFyIG5vZGUkMSA9IHRoaXMuc3RhcnROb2RlQXQoc3RhcnRQb3MsIHN0YXJ0TG9jKTtcbiAgICBub2RlJDEuY2FsbGVlID0gYmFzZTtcbiAgICBub2RlJDEuYXJndW1lbnRzID0gZXhwckxpc3Q7XG4gICAgaWYgKG9wdGlvbmFsU3VwcG9ydGVkKSB7XG4gICAgICBub2RlJDEub3B0aW9uYWwgPSBvcHRpb25hbDtcbiAgICB9XG4gICAgYmFzZSA9IHRoaXMuZmluaXNoTm9kZShub2RlJDEsIFwiQ2FsbEV4cHJlc3Npb25cIik7XG4gIH0gZWxzZSBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLmJhY2tRdW90ZSkge1xuICAgIGlmIChvcHRpb25hbCB8fCBvcHRpb25hbENoYWluZWQpIHtcbiAgICAgIHRoaXMucmFpc2UodGhpcy5zdGFydCwgXCJPcHRpb25hbCBjaGFpbmluZyBjYW5ub3QgYXBwZWFyIGluIHRoZSB0YWcgb2YgdGFnZ2VkIHRlbXBsYXRlIGV4cHJlc3Npb25zXCIpO1xuICAgIH1cbiAgICB2YXIgbm9kZSQyID0gdGhpcy5zdGFydE5vZGVBdChzdGFydFBvcywgc3RhcnRMb2MpO1xuICAgIG5vZGUkMi50YWcgPSBiYXNlO1xuICAgIG5vZGUkMi5xdWFzaSA9IHRoaXMucGFyc2VUZW1wbGF0ZSh7aXNUYWdnZWQ6IHRydWV9KTtcbiAgICBiYXNlID0gdGhpcy5maW5pc2hOb2RlKG5vZGUkMiwgXCJUYWdnZWRUZW1wbGF0ZUV4cHJlc3Npb25cIik7XG4gIH1cbiAgcmV0dXJuIGJhc2Vcbn07XG5cbi8vIFBhcnNlIGFuIGF0b21pYyBleHByZXNzaW9uIFx1MjAxNCBlaXRoZXIgYSBzaW5nbGUgdG9rZW4gdGhhdCBpcyBhblxuLy8gZXhwcmVzc2lvbiwgYW4gZXhwcmVzc2lvbiBzdGFydGVkIGJ5IGEga2V5d29yZCBsaWtlIGBmdW5jdGlvbmAgb3Jcbi8vIGBuZXdgLCBvciBhbiBleHByZXNzaW9uIHdyYXBwZWQgaW4gcHVuY3R1YXRpb24gbGlrZSBgKClgLCBgW11gLFxuLy8gb3IgYHt9YC5cblxucHAkNS5wYXJzZUV4cHJBdG9tID0gZnVuY3Rpb24ocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycywgZm9ySW5pdCwgZm9yTmV3KSB7XG4gIC8vIElmIGEgZGl2aXNpb24gb3BlcmF0b3IgYXBwZWFycyBpbiBhbiBleHByZXNzaW9uIHBvc2l0aW9uLCB0aGVcbiAgLy8gdG9rZW5pemVyIGdvdCBjb25mdXNlZCwgYW5kIHdlIGZvcmNlIGl0IHRvIHJlYWQgYSByZWdleHAgaW5zdGVhZC5cbiAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5zbGFzaCkgeyB0aGlzLnJlYWRSZWdleHAoKTsgfVxuXG4gIHZhciBub2RlLCBjYW5CZUFycm93ID0gdGhpcy5wb3RlbnRpYWxBcnJvd0F0ID09PSB0aGlzLnN0YXJ0O1xuICBzd2l0Y2ggKHRoaXMudHlwZSkge1xuICBjYXNlIHR5cGVzJDEuX3N1cGVyOlxuICAgIGlmICghdGhpcy5hbGxvd1N1cGVyKVxuICAgICAgeyB0aGlzLnJhaXNlKHRoaXMuc3RhcnQsIFwiJ3N1cGVyJyBrZXl3b3JkIG91dHNpZGUgYSBtZXRob2RcIik7IH1cbiAgICBub2RlID0gdGhpcy5zdGFydE5vZGUoKTtcbiAgICB0aGlzLm5leHQoKTtcbiAgICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLnBhcmVuTCAmJiAhdGhpcy5hbGxvd0RpcmVjdFN1cGVyKVxuICAgICAgeyB0aGlzLnJhaXNlKG5vZGUuc3RhcnQsIFwic3VwZXIoKSBjYWxsIG91dHNpZGUgY29uc3RydWN0b3Igb2YgYSBzdWJjbGFzc1wiKTsgfVxuICAgIC8vIFRoZSBgc3VwZXJgIGtleXdvcmQgY2FuIGFwcGVhciBhdCBiZWxvdzpcbiAgICAvLyBTdXBlclByb3BlcnR5OlxuICAgIC8vICAgICBzdXBlciBbIEV4cHJlc3Npb24gXVxuICAgIC8vICAgICBzdXBlciAuIElkZW50aWZpZXJOYW1lXG4gICAgLy8gU3VwZXJDYWxsOlxuICAgIC8vICAgICBzdXBlciAoIEFyZ3VtZW50cyApXG4gICAgaWYgKHRoaXMudHlwZSAhPT0gdHlwZXMkMS5kb3QgJiYgdGhpcy50eXBlICE9PSB0eXBlcyQxLmJyYWNrZXRMICYmIHRoaXMudHlwZSAhPT0gdHlwZXMkMS5wYXJlbkwpXG4gICAgICB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gICAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIlN1cGVyXCIpXG5cbiAgY2FzZSB0eXBlcyQxLl90aGlzOlxuICAgIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICAgIHRoaXMubmV4dCgpO1xuICAgIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJUaGlzRXhwcmVzc2lvblwiKVxuXG4gIGNhc2UgdHlwZXMkMS5uYW1lOlxuICAgIHZhciBzdGFydFBvcyA9IHRoaXMuc3RhcnQsIHN0YXJ0TG9jID0gdGhpcy5zdGFydExvYywgY29udGFpbnNFc2MgPSB0aGlzLmNvbnRhaW5zRXNjO1xuICAgIHZhciBpZCA9IHRoaXMucGFyc2VJZGVudChmYWxzZSk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA4ICYmICFjb250YWluc0VzYyAmJiBpZC5uYW1lID09PSBcImFzeW5jXCIgJiYgIXRoaXMuY2FuSW5zZXJ0U2VtaWNvbG9uKCkgJiYgdGhpcy5lYXQodHlwZXMkMS5fZnVuY3Rpb24pKSB7XG4gICAgICB0aGlzLm92ZXJyaWRlQ29udGV4dCh0eXBlcy5mX2V4cHIpO1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VGdW5jdGlvbih0aGlzLnN0YXJ0Tm9kZUF0KHN0YXJ0UG9zLCBzdGFydExvYyksIDAsIGZhbHNlLCB0cnVlLCBmb3JJbml0KVxuICAgIH1cbiAgICBpZiAoY2FuQmVBcnJvdyAmJiAhdGhpcy5jYW5JbnNlcnRTZW1pY29sb24oKSkge1xuICAgICAgaWYgKHRoaXMuZWF0KHR5cGVzJDEuYXJyb3cpKVxuICAgICAgICB7IHJldHVybiB0aGlzLnBhcnNlQXJyb3dFeHByZXNzaW9uKHRoaXMuc3RhcnROb2RlQXQoc3RhcnRQb3MsIHN0YXJ0TG9jKSwgW2lkXSwgZmFsc2UsIGZvckluaXQpIH1cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOCAmJiBpZC5uYW1lID09PSBcImFzeW5jXCIgJiYgdGhpcy50eXBlID09PSB0eXBlcyQxLm5hbWUgJiYgIWNvbnRhaW5zRXNjICYmXG4gICAgICAgICAgKCF0aGlzLnBvdGVudGlhbEFycm93SW5Gb3JBd2FpdCB8fCB0aGlzLnZhbHVlICE9PSBcIm9mXCIgfHwgdGhpcy5jb250YWluc0VzYykpIHtcbiAgICAgICAgaWQgPSB0aGlzLnBhcnNlSWRlbnQoZmFsc2UpO1xuICAgICAgICBpZiAodGhpcy5jYW5JbnNlcnRTZW1pY29sb24oKSB8fCAhdGhpcy5lYXQodHlwZXMkMS5hcnJvdykpXG4gICAgICAgICAgeyB0aGlzLnVuZXhwZWN0ZWQoKTsgfVxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUFycm93RXhwcmVzc2lvbih0aGlzLnN0YXJ0Tm9kZUF0KHN0YXJ0UG9zLCBzdGFydExvYyksIFtpZF0sIHRydWUsIGZvckluaXQpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpZFxuXG4gIGNhc2UgdHlwZXMkMS5yZWdleHA6XG4gICAgdmFyIHZhbHVlID0gdGhpcy52YWx1ZTtcbiAgICBub2RlID0gdGhpcy5wYXJzZUxpdGVyYWwodmFsdWUudmFsdWUpO1xuICAgIG5vZGUucmVnZXggPSB7cGF0dGVybjogdmFsdWUucGF0dGVybiwgZmxhZ3M6IHZhbHVlLmZsYWdzfTtcbiAgICByZXR1cm4gbm9kZVxuXG4gIGNhc2UgdHlwZXMkMS5udW06IGNhc2UgdHlwZXMkMS5zdHJpbmc6XG4gICAgcmV0dXJuIHRoaXMucGFyc2VMaXRlcmFsKHRoaXMudmFsdWUpXG5cbiAgY2FzZSB0eXBlcyQxLl9udWxsOiBjYXNlIHR5cGVzJDEuX3RydWU6IGNhc2UgdHlwZXMkMS5fZmFsc2U6XG4gICAgbm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gICAgbm9kZS52YWx1ZSA9IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5fbnVsbCA/IG51bGwgOiB0aGlzLnR5cGUgPT09IHR5cGVzJDEuX3RydWU7XG4gICAgbm9kZS5yYXcgPSB0aGlzLnR5cGUua2V5d29yZDtcbiAgICB0aGlzLm5leHQoKTtcbiAgICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiTGl0ZXJhbFwiKVxuXG4gIGNhc2UgdHlwZXMkMS5wYXJlbkw6XG4gICAgdmFyIHN0YXJ0ID0gdGhpcy5zdGFydCwgZXhwciA9IHRoaXMucGFyc2VQYXJlbkFuZERpc3Rpbmd1aXNoRXhwcmVzc2lvbihjYW5CZUFycm93LCBmb3JJbml0KTtcbiAgICBpZiAocmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykge1xuICAgICAgaWYgKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMucGFyZW50aGVzaXplZEFzc2lnbiA8IDAgJiYgIXRoaXMuaXNTaW1wbGVBc3NpZ25UYXJnZXQoZXhwcikpXG4gICAgICAgIHsgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy5wYXJlbnRoZXNpemVkQXNzaWduID0gc3RhcnQ7IH1cbiAgICAgIGlmIChyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnBhcmVudGhlc2l6ZWRCaW5kIDwgMClcbiAgICAgICAgeyByZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnBhcmVudGhlc2l6ZWRCaW5kID0gc3RhcnQ7IH1cbiAgICB9XG4gICAgcmV0dXJuIGV4cHJcblxuICBjYXNlIHR5cGVzJDEuYnJhY2tldEw6XG4gICAgbm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gICAgdGhpcy5uZXh0KCk7XG4gICAgbm9kZS5lbGVtZW50cyA9IHRoaXMucGFyc2VFeHByTGlzdCh0eXBlcyQxLmJyYWNrZXRSLCB0cnVlLCB0cnVlLCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKTtcbiAgICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiQXJyYXlFeHByZXNzaW9uXCIpXG5cbiAgY2FzZSB0eXBlcyQxLmJyYWNlTDpcbiAgICB0aGlzLm92ZXJyaWRlQ29udGV4dCh0eXBlcy5iX2V4cHIpO1xuICAgIHJldHVybiB0aGlzLnBhcnNlT2JqKGZhbHNlLCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKVxuXG4gIGNhc2UgdHlwZXMkMS5fZnVuY3Rpb246XG4gICAgbm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gICAgdGhpcy5uZXh0KCk7XG4gICAgcmV0dXJuIHRoaXMucGFyc2VGdW5jdGlvbihub2RlLCAwKVxuXG4gIGNhc2UgdHlwZXMkMS5fY2xhc3M6XG4gICAgcmV0dXJuIHRoaXMucGFyc2VDbGFzcyh0aGlzLnN0YXJ0Tm9kZSgpLCBmYWxzZSlcblxuICBjYXNlIHR5cGVzJDEuX25ldzpcbiAgICByZXR1cm4gdGhpcy5wYXJzZU5ldygpXG5cbiAgY2FzZSB0eXBlcyQxLmJhY2tRdW90ZTpcbiAgICByZXR1cm4gdGhpcy5wYXJzZVRlbXBsYXRlKClcblxuICBjYXNlIHR5cGVzJDEuX2ltcG9ydDpcbiAgICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDExKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJzZUV4cHJJbXBvcnQoZm9yTmV3KVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy51bmV4cGVjdGVkKClcbiAgICB9XG5cbiAgZGVmYXVsdDpcbiAgICByZXR1cm4gdGhpcy5wYXJzZUV4cHJBdG9tRGVmYXVsdCgpXG4gIH1cbn07XG5cbnBwJDUucGFyc2VFeHByQXRvbURlZmF1bHQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy51bmV4cGVjdGVkKCk7XG59O1xuXG5wcCQ1LnBhcnNlRXhwckltcG9ydCA9IGZ1bmN0aW9uKGZvck5ldykge1xuICB2YXIgbm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG5cbiAgLy8gQ29uc3VtZSBgaW1wb3J0YCBhcyBhbiBpZGVudGlmaWVyIGZvciBgaW1wb3J0Lm1ldGFgLlxuICAvLyBCZWNhdXNlIGB0aGlzLnBhcnNlSWRlbnQodHJ1ZSlgIGRvZXNuJ3QgY2hlY2sgZXNjYXBlIHNlcXVlbmNlcywgaXQgbmVlZHMgdGhlIGNoZWNrIG9mIGB0aGlzLmNvbnRhaW5zRXNjYC5cbiAgaWYgKHRoaXMuY29udGFpbnNFc2MpIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKHRoaXMuc3RhcnQsIFwiRXNjYXBlIHNlcXVlbmNlIGluIGtleXdvcmQgaW1wb3J0XCIpOyB9XG4gIHRoaXMubmV4dCgpO1xuXG4gIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEucGFyZW5MICYmICFmb3JOZXcpIHtcbiAgICByZXR1cm4gdGhpcy5wYXJzZUR5bmFtaWNJbXBvcnQobm9kZSlcbiAgfSBlbHNlIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuZG90KSB7XG4gICAgdmFyIG1ldGEgPSB0aGlzLnN0YXJ0Tm9kZUF0KG5vZGUuc3RhcnQsIG5vZGUubG9jICYmIG5vZGUubG9jLnN0YXJ0KTtcbiAgICBtZXRhLm5hbWUgPSBcImltcG9ydFwiO1xuICAgIG5vZGUubWV0YSA9IHRoaXMuZmluaXNoTm9kZShtZXRhLCBcIklkZW50aWZpZXJcIik7XG4gICAgcmV0dXJuIHRoaXMucGFyc2VJbXBvcnRNZXRhKG5vZGUpXG4gIH0gZWxzZSB7XG4gICAgdGhpcy51bmV4cGVjdGVkKCk7XG4gIH1cbn07XG5cbnBwJDUucGFyc2VEeW5hbWljSW1wb3J0ID0gZnVuY3Rpb24obm9kZSkge1xuICB0aGlzLm5leHQoKTsgLy8gc2tpcCBgKGBcblxuICAvLyBQYXJzZSBub2RlLnNvdXJjZS5cbiAgbm9kZS5zb3VyY2UgPSB0aGlzLnBhcnNlTWF5YmVBc3NpZ24oKTtcblxuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDE2KSB7XG4gICAgaWYgKCF0aGlzLmVhdCh0eXBlcyQxLnBhcmVuUikpIHtcbiAgICAgIHRoaXMuZXhwZWN0KHR5cGVzJDEuY29tbWEpO1xuICAgICAgaWYgKCF0aGlzLmFmdGVyVHJhaWxpbmdDb21tYSh0eXBlcyQxLnBhcmVuUikpIHtcbiAgICAgICAgbm9kZS5vcHRpb25zID0gdGhpcy5wYXJzZU1heWJlQXNzaWduKCk7XG4gICAgICAgIGlmICghdGhpcy5lYXQodHlwZXMkMS5wYXJlblIpKSB7XG4gICAgICAgICAgdGhpcy5leHBlY3QodHlwZXMkMS5jb21tYSk7XG4gICAgICAgICAgaWYgKCF0aGlzLmFmdGVyVHJhaWxpbmdDb21tYSh0eXBlcyQxLnBhcmVuUikpIHtcbiAgICAgICAgICAgIHRoaXMudW5leHBlY3RlZCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbm9kZS5vcHRpb25zID0gbnVsbDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbm9kZS5vcHRpb25zID0gbnVsbDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gVmVyaWZ5IGVuZGluZy5cbiAgICBpZiAoIXRoaXMuZWF0KHR5cGVzJDEucGFyZW5SKSkge1xuICAgICAgdmFyIGVycm9yUG9zID0gdGhpcy5zdGFydDtcbiAgICAgIGlmICh0aGlzLmVhdCh0eXBlcyQxLmNvbW1hKSAmJiB0aGlzLmVhdCh0eXBlcyQxLnBhcmVuUikpIHtcbiAgICAgICAgdGhpcy5yYWlzZVJlY292ZXJhYmxlKGVycm9yUG9zLCBcIlRyYWlsaW5nIGNvbW1hIGlzIG5vdCBhbGxvd2VkIGluIGltcG9ydCgpXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy51bmV4cGVjdGVkKGVycm9yUG9zKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiSW1wb3J0RXhwcmVzc2lvblwiKVxufTtcblxucHAkNS5wYXJzZUltcG9ydE1ldGEgPSBmdW5jdGlvbihub2RlKSB7XG4gIHRoaXMubmV4dCgpOyAvLyBza2lwIGAuYFxuXG4gIHZhciBjb250YWluc0VzYyA9IHRoaXMuY29udGFpbnNFc2M7XG4gIG5vZGUucHJvcGVydHkgPSB0aGlzLnBhcnNlSWRlbnQodHJ1ZSk7XG5cbiAgaWYgKG5vZGUucHJvcGVydHkubmFtZSAhPT0gXCJtZXRhXCIpXG4gICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUobm9kZS5wcm9wZXJ0eS5zdGFydCwgXCJUaGUgb25seSB2YWxpZCBtZXRhIHByb3BlcnR5IGZvciBpbXBvcnQgaXMgJ2ltcG9ydC5tZXRhJ1wiKTsgfVxuICBpZiAoY29udGFpbnNFc2MpXG4gICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUobm9kZS5zdGFydCwgXCInaW1wb3J0Lm1ldGEnIG11c3Qgbm90IGNvbnRhaW4gZXNjYXBlZCBjaGFyYWN0ZXJzXCIpOyB9XG4gIGlmICh0aGlzLm9wdGlvbnMuc291cmNlVHlwZSAhPT0gXCJtb2R1bGVcIiAmJiAhdGhpcy5vcHRpb25zLmFsbG93SW1wb3J0RXhwb3J0RXZlcnl3aGVyZSlcbiAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShub2RlLnN0YXJ0LCBcIkNhbm5vdCB1c2UgJ2ltcG9ydC5tZXRhJyBvdXRzaWRlIGEgbW9kdWxlXCIpOyB9XG5cbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIk1ldGFQcm9wZXJ0eVwiKVxufTtcblxucHAkNS5wYXJzZUxpdGVyYWwgPSBmdW5jdGlvbih2YWx1ZSkge1xuICB2YXIgbm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gIG5vZGUudmFsdWUgPSB2YWx1ZTtcbiAgbm9kZS5yYXcgPSB0aGlzLmlucHV0LnNsaWNlKHRoaXMuc3RhcnQsIHRoaXMuZW5kKTtcbiAgaWYgKG5vZGUucmF3LmNoYXJDb2RlQXQobm9kZS5yYXcubGVuZ3RoIC0gMSkgPT09IDExMClcbiAgICB7IG5vZGUuYmlnaW50ID0gbm9kZS52YWx1ZSAhPSBudWxsID8gbm9kZS52YWx1ZS50b1N0cmluZygpIDogbm9kZS5yYXcuc2xpY2UoMCwgLTEpLnJlcGxhY2UoL18vZywgXCJcIik7IH1cbiAgdGhpcy5uZXh0KCk7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJMaXRlcmFsXCIpXG59O1xuXG5wcCQ1LnBhcnNlUGFyZW5FeHByZXNzaW9uID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuZXhwZWN0KHR5cGVzJDEucGFyZW5MKTtcbiAgdmFyIHZhbCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gIHRoaXMuZXhwZWN0KHR5cGVzJDEucGFyZW5SKTtcbiAgcmV0dXJuIHZhbFxufTtcblxucHAkNS5zaG91bGRQYXJzZUFycm93ID0gZnVuY3Rpb24oZXhwckxpc3QpIHtcbiAgcmV0dXJuICF0aGlzLmNhbkluc2VydFNlbWljb2xvbigpXG59O1xuXG5wcCQ1LnBhcnNlUGFyZW5BbmREaXN0aW5ndWlzaEV4cHJlc3Npb24gPSBmdW5jdGlvbihjYW5CZUFycm93LCBmb3JJbml0KSB7XG4gIHZhciBzdGFydFBvcyA9IHRoaXMuc3RhcnQsIHN0YXJ0TG9jID0gdGhpcy5zdGFydExvYywgdmFsLCBhbGxvd1RyYWlsaW5nQ29tbWEgPSB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gODtcbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2KSB7XG4gICAgdGhpcy5uZXh0KCk7XG5cbiAgICB2YXIgaW5uZXJTdGFydFBvcyA9IHRoaXMuc3RhcnQsIGlubmVyU3RhcnRMb2MgPSB0aGlzLnN0YXJ0TG9jO1xuICAgIHZhciBleHByTGlzdCA9IFtdLCBmaXJzdCA9IHRydWUsIGxhc3RJc0NvbW1hID0gZmFsc2U7XG4gICAgdmFyIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMgPSBuZXcgRGVzdHJ1Y3R1cmluZ0Vycm9ycywgb2xkWWllbGRQb3MgPSB0aGlzLnlpZWxkUG9zLCBvbGRBd2FpdFBvcyA9IHRoaXMuYXdhaXRQb3MsIHNwcmVhZFN0YXJ0O1xuICAgIHRoaXMueWllbGRQb3MgPSAwO1xuICAgIHRoaXMuYXdhaXRQb3MgPSAwO1xuICAgIC8vIERvIG5vdCBzYXZlIGF3YWl0SWRlbnRQb3MgdG8gYWxsb3cgY2hlY2tpbmcgYXdhaXRzIG5lc3RlZCBpbiBwYXJhbWV0ZXJzXG4gICAgd2hpbGUgKHRoaXMudHlwZSAhPT0gdHlwZXMkMS5wYXJlblIpIHtcbiAgICAgIGZpcnN0ID8gZmlyc3QgPSBmYWxzZSA6IHRoaXMuZXhwZWN0KHR5cGVzJDEuY29tbWEpO1xuICAgICAgaWYgKGFsbG93VHJhaWxpbmdDb21tYSAmJiB0aGlzLmFmdGVyVHJhaWxpbmdDb21tYSh0eXBlcyQxLnBhcmVuUiwgdHJ1ZSkpIHtcbiAgICAgICAgbGFzdElzQ29tbWEgPSB0cnVlO1xuICAgICAgICBicmVha1xuICAgICAgfSBlbHNlIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuZWxsaXBzaXMpIHtcbiAgICAgICAgc3ByZWFkU3RhcnQgPSB0aGlzLnN0YXJ0O1xuICAgICAgICBleHByTGlzdC5wdXNoKHRoaXMucGFyc2VQYXJlbkl0ZW0odGhpcy5wYXJzZVJlc3RCaW5kaW5nKCkpKTtcbiAgICAgICAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5jb21tYSkge1xuICAgICAgICAgIHRoaXMucmFpc2VSZWNvdmVyYWJsZShcbiAgICAgICAgICAgIHRoaXMuc3RhcnQsXG4gICAgICAgICAgICBcIkNvbW1hIGlzIG5vdCBwZXJtaXR0ZWQgYWZ0ZXIgdGhlIHJlc3QgZWxlbWVudFwiXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBicmVha1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXhwckxpc3QucHVzaCh0aGlzLnBhcnNlTWF5YmVBc3NpZ24oZmFsc2UsIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMsIHRoaXMucGFyc2VQYXJlbkl0ZW0pKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIGlubmVyRW5kUG9zID0gdGhpcy5sYXN0VG9rRW5kLCBpbm5lckVuZExvYyA9IHRoaXMubGFzdFRva0VuZExvYztcbiAgICB0aGlzLmV4cGVjdCh0eXBlcyQxLnBhcmVuUik7XG5cbiAgICBpZiAoY2FuQmVBcnJvdyAmJiB0aGlzLnNob3VsZFBhcnNlQXJyb3coZXhwckxpc3QpICYmIHRoaXMuZWF0KHR5cGVzJDEuYXJyb3cpKSB7XG4gICAgICB0aGlzLmNoZWNrUGF0dGVybkVycm9ycyhyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLCBmYWxzZSk7XG4gICAgICB0aGlzLmNoZWNrWWllbGRBd2FpdEluRGVmYXVsdFBhcmFtcygpO1xuICAgICAgdGhpcy55aWVsZFBvcyA9IG9sZFlpZWxkUG9zO1xuICAgICAgdGhpcy5hd2FpdFBvcyA9IG9sZEF3YWl0UG9zO1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VQYXJlbkFycm93TGlzdChzdGFydFBvcywgc3RhcnRMb2MsIGV4cHJMaXN0LCBmb3JJbml0KVxuICAgIH1cblxuICAgIGlmICghZXhwckxpc3QubGVuZ3RoIHx8IGxhc3RJc0NvbW1hKSB7IHRoaXMudW5leHBlY3RlZCh0aGlzLmxhc3RUb2tTdGFydCk7IH1cbiAgICBpZiAoc3ByZWFkU3RhcnQpIHsgdGhpcy51bmV4cGVjdGVkKHNwcmVhZFN0YXJ0KTsgfVxuICAgIHRoaXMuY2hlY2tFeHByZXNzaW9uRXJyb3JzKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMsIHRydWUpO1xuICAgIHRoaXMueWllbGRQb3MgPSBvbGRZaWVsZFBvcyB8fCB0aGlzLnlpZWxkUG9zO1xuICAgIHRoaXMuYXdhaXRQb3MgPSBvbGRBd2FpdFBvcyB8fCB0aGlzLmF3YWl0UG9zO1xuXG4gICAgaWYgKGV4cHJMaXN0Lmxlbmd0aCA+IDEpIHtcbiAgICAgIHZhbCA9IHRoaXMuc3RhcnROb2RlQXQoaW5uZXJTdGFydFBvcywgaW5uZXJTdGFydExvYyk7XG4gICAgICB2YWwuZXhwcmVzc2lvbnMgPSBleHByTGlzdDtcbiAgICAgIHRoaXMuZmluaXNoTm9kZUF0KHZhbCwgXCJTZXF1ZW5jZUV4cHJlc3Npb25cIiwgaW5uZXJFbmRQb3MsIGlubmVyRW5kTG9jKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsID0gZXhwckxpc3RbMF07XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhbCA9IHRoaXMucGFyc2VQYXJlbkV4cHJlc3Npb24oKTtcbiAgfVxuXG4gIGlmICh0aGlzLm9wdGlvbnMucHJlc2VydmVQYXJlbnMpIHtcbiAgICB2YXIgcGFyID0gdGhpcy5zdGFydE5vZGVBdChzdGFydFBvcywgc3RhcnRMb2MpO1xuICAgIHBhci5leHByZXNzaW9uID0gdmFsO1xuICAgIHJldHVybiB0aGlzLmZpbmlzaE5vZGUocGFyLCBcIlBhcmVudGhlc2l6ZWRFeHByZXNzaW9uXCIpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHZhbFxuICB9XG59O1xuXG5wcCQ1LnBhcnNlUGFyZW5JdGVtID0gZnVuY3Rpb24oaXRlbSkge1xuICByZXR1cm4gaXRlbVxufTtcblxucHAkNS5wYXJzZVBhcmVuQXJyb3dMaXN0ID0gZnVuY3Rpb24oc3RhcnRQb3MsIHN0YXJ0TG9jLCBleHByTGlzdCwgZm9ySW5pdCkge1xuICByZXR1cm4gdGhpcy5wYXJzZUFycm93RXhwcmVzc2lvbih0aGlzLnN0YXJ0Tm9kZUF0KHN0YXJ0UG9zLCBzdGFydExvYyksIGV4cHJMaXN0LCBmYWxzZSwgZm9ySW5pdClcbn07XG5cbi8vIE5ldydzIHByZWNlZGVuY2UgaXMgc2xpZ2h0bHkgdHJpY2t5LiBJdCBtdXN0IGFsbG93IGl0cyBhcmd1bWVudCB0b1xuLy8gYmUgYSBgW11gIG9yIGRvdCBzdWJzY3JpcHQgZXhwcmVzc2lvbiwgYnV0IG5vdCBhIGNhbGwgXHUyMDE0IGF0IGxlYXN0LFxuLy8gbm90IHdpdGhvdXQgd3JhcHBpbmcgaXQgaW4gcGFyZW50aGVzZXMuIFRodXMsIGl0IHVzZXMgdGhlIG5vQ2FsbHNcbi8vIGFyZ3VtZW50IHRvIHBhcnNlU3Vic2NyaXB0cyB0byBwcmV2ZW50IGl0IGZyb20gY29uc3VtaW5nIHRoZVxuLy8gYXJndW1lbnQgbGlzdC5cblxudmFyIGVtcHR5ID0gW107XG5cbnBwJDUucGFyc2VOZXcgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuY29udGFpbnNFc2MpIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKHRoaXMuc3RhcnQsIFwiRXNjYXBlIHNlcXVlbmNlIGluIGtleXdvcmQgbmV3XCIpOyB9XG4gIHZhciBub2RlID0gdGhpcy5zdGFydE5vZGUoKTtcbiAgdGhpcy5uZXh0KCk7XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNiAmJiB0aGlzLnR5cGUgPT09IHR5cGVzJDEuZG90KSB7XG4gICAgdmFyIG1ldGEgPSB0aGlzLnN0YXJ0Tm9kZUF0KG5vZGUuc3RhcnQsIG5vZGUubG9jICYmIG5vZGUubG9jLnN0YXJ0KTtcbiAgICBtZXRhLm5hbWUgPSBcIm5ld1wiO1xuICAgIG5vZGUubWV0YSA9IHRoaXMuZmluaXNoTm9kZShtZXRhLCBcIklkZW50aWZpZXJcIik7XG4gICAgdGhpcy5uZXh0KCk7XG4gICAgdmFyIGNvbnRhaW5zRXNjID0gdGhpcy5jb250YWluc0VzYztcbiAgICBub2RlLnByb3BlcnR5ID0gdGhpcy5wYXJzZUlkZW50KHRydWUpO1xuICAgIGlmIChub2RlLnByb3BlcnR5Lm5hbWUgIT09IFwidGFyZ2V0XCIpXG4gICAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShub2RlLnByb3BlcnR5LnN0YXJ0LCBcIlRoZSBvbmx5IHZhbGlkIG1ldGEgcHJvcGVydHkgZm9yIG5ldyBpcyAnbmV3LnRhcmdldCdcIik7IH1cbiAgICBpZiAoY29udGFpbnNFc2MpXG4gICAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShub2RlLnN0YXJ0LCBcIiduZXcudGFyZ2V0JyBtdXN0IG5vdCBjb250YWluIGVzY2FwZWQgY2hhcmFjdGVyc1wiKTsgfVxuICAgIGlmICghdGhpcy5hbGxvd05ld0RvdFRhcmdldClcbiAgICAgIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKG5vZGUuc3RhcnQsIFwiJ25ldy50YXJnZXQnIGNhbiBvbmx5IGJlIHVzZWQgaW4gZnVuY3Rpb25zIGFuZCBjbGFzcyBzdGF0aWMgYmxvY2tcIik7IH1cbiAgICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiTWV0YVByb3BlcnR5XCIpXG4gIH1cbiAgdmFyIHN0YXJ0UG9zID0gdGhpcy5zdGFydCwgc3RhcnRMb2MgPSB0aGlzLnN0YXJ0TG9jO1xuICBub2RlLmNhbGxlZSA9IHRoaXMucGFyc2VTdWJzY3JpcHRzKHRoaXMucGFyc2VFeHByQXRvbShudWxsLCBmYWxzZSwgdHJ1ZSksIHN0YXJ0UG9zLCBzdGFydExvYywgdHJ1ZSwgZmFsc2UpO1xuICBpZiAodGhpcy5lYXQodHlwZXMkMS5wYXJlbkwpKSB7IG5vZGUuYXJndW1lbnRzID0gdGhpcy5wYXJzZUV4cHJMaXN0KHR5cGVzJDEucGFyZW5SLCB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOCwgZmFsc2UpOyB9XG4gIGVsc2UgeyBub2RlLmFyZ3VtZW50cyA9IGVtcHR5OyB9XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJOZXdFeHByZXNzaW9uXCIpXG59O1xuXG4vLyBQYXJzZSB0ZW1wbGF0ZSBleHByZXNzaW9uLlxuXG5wcCQ1LnBhcnNlVGVtcGxhdGVFbGVtZW50ID0gZnVuY3Rpb24ocmVmKSB7XG4gIHZhciBpc1RhZ2dlZCA9IHJlZi5pc1RhZ2dlZDtcblxuICB2YXIgZWxlbSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuaW52YWxpZFRlbXBsYXRlKSB7XG4gICAgaWYgKCFpc1RhZ2dlZCkge1xuICAgICAgdGhpcy5yYWlzZVJlY292ZXJhYmxlKHRoaXMuc3RhcnQsIFwiQmFkIGVzY2FwZSBzZXF1ZW5jZSBpbiB1bnRhZ2dlZCB0ZW1wbGF0ZSBsaXRlcmFsXCIpO1xuICAgIH1cbiAgICBlbGVtLnZhbHVlID0ge1xuICAgICAgcmF3OiB0aGlzLnZhbHVlLnJlcGxhY2UoL1xcclxcbj8vZywgXCJcXG5cIiksXG4gICAgICBjb29rZWQ6IG51bGxcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIGVsZW0udmFsdWUgPSB7XG4gICAgICByYXc6IHRoaXMuaW5wdXQuc2xpY2UodGhpcy5zdGFydCwgdGhpcy5lbmQpLnJlcGxhY2UoL1xcclxcbj8vZywgXCJcXG5cIiksXG4gICAgICBjb29rZWQ6IHRoaXMudmFsdWVcbiAgICB9O1xuICB9XG4gIHRoaXMubmV4dCgpO1xuICBlbGVtLnRhaWwgPSB0aGlzLnR5cGUgPT09IHR5cGVzJDEuYmFja1F1b3RlO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKGVsZW0sIFwiVGVtcGxhdGVFbGVtZW50XCIpXG59O1xuXG5wcCQ1LnBhcnNlVGVtcGxhdGUgPSBmdW5jdGlvbihyZWYpIHtcbiAgaWYgKCByZWYgPT09IHZvaWQgMCApIHJlZiA9IHt9O1xuICB2YXIgaXNUYWdnZWQgPSByZWYuaXNUYWdnZWQ7IGlmICggaXNUYWdnZWQgPT09IHZvaWQgMCApIGlzVGFnZ2VkID0gZmFsc2U7XG5cbiAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICB0aGlzLm5leHQoKTtcbiAgbm9kZS5leHByZXNzaW9ucyA9IFtdO1xuICB2YXIgY3VyRWx0ID0gdGhpcy5wYXJzZVRlbXBsYXRlRWxlbWVudCh7aXNUYWdnZWQ6IGlzVGFnZ2VkfSk7XG4gIG5vZGUucXVhc2lzID0gW2N1ckVsdF07XG4gIHdoaWxlICghY3VyRWx0LnRhaWwpIHtcbiAgICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLmVvZikgeyB0aGlzLnJhaXNlKHRoaXMucG9zLCBcIlVudGVybWluYXRlZCB0ZW1wbGF0ZSBsaXRlcmFsXCIpOyB9XG4gICAgdGhpcy5leHBlY3QodHlwZXMkMS5kb2xsYXJCcmFjZUwpO1xuICAgIG5vZGUuZXhwcmVzc2lvbnMucHVzaCh0aGlzLnBhcnNlRXhwcmVzc2lvbigpKTtcbiAgICB0aGlzLmV4cGVjdCh0eXBlcyQxLmJyYWNlUik7XG4gICAgbm9kZS5xdWFzaXMucHVzaChjdXJFbHQgPSB0aGlzLnBhcnNlVGVtcGxhdGVFbGVtZW50KHtpc1RhZ2dlZDogaXNUYWdnZWR9KSk7XG4gIH1cbiAgdGhpcy5uZXh0KCk7XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJUZW1wbGF0ZUxpdGVyYWxcIilcbn07XG5cbnBwJDUuaXNBc3luY1Byb3AgPSBmdW5jdGlvbihwcm9wKSB7XG4gIHJldHVybiAhcHJvcC5jb21wdXRlZCAmJiBwcm9wLmtleS50eXBlID09PSBcIklkZW50aWZpZXJcIiAmJiBwcm9wLmtleS5uYW1lID09PSBcImFzeW5jXCIgJiZcbiAgICAodGhpcy50eXBlID09PSB0eXBlcyQxLm5hbWUgfHwgdGhpcy50eXBlID09PSB0eXBlcyQxLm51bSB8fCB0aGlzLnR5cGUgPT09IHR5cGVzJDEuc3RyaW5nIHx8IHRoaXMudHlwZSA9PT0gdHlwZXMkMS5icmFja2V0TCB8fCB0aGlzLnR5cGUua2V5d29yZCB8fCAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDkgJiYgdGhpcy50eXBlID09PSB0eXBlcyQxLnN0YXIpKSAmJlxuICAgICFsaW5lQnJlYWsudGVzdCh0aGlzLmlucHV0LnNsaWNlKHRoaXMubGFzdFRva0VuZCwgdGhpcy5zdGFydCkpXG59O1xuXG4vLyBQYXJzZSBhbiBvYmplY3QgbGl0ZXJhbCBvciBiaW5kaW5nIHBhdHRlcm4uXG5cbnBwJDUucGFyc2VPYmogPSBmdW5jdGlvbihpc1BhdHRlcm4sIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpIHtcbiAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpLCBmaXJzdCA9IHRydWUsIHByb3BIYXNoID0ge307XG4gIG5vZGUucHJvcGVydGllcyA9IFtdO1xuICB0aGlzLm5leHQoKTtcbiAgd2hpbGUgKCF0aGlzLmVhdCh0eXBlcyQxLmJyYWNlUikpIHtcbiAgICBpZiAoIWZpcnN0KSB7XG4gICAgICB0aGlzLmV4cGVjdCh0eXBlcyQxLmNvbW1hKTtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNSAmJiB0aGlzLmFmdGVyVHJhaWxpbmdDb21tYSh0eXBlcyQxLmJyYWNlUikpIHsgYnJlYWsgfVxuICAgIH0gZWxzZSB7IGZpcnN0ID0gZmFsc2U7IH1cblxuICAgIHZhciBwcm9wID0gdGhpcy5wYXJzZVByb3BlcnR5KGlzUGF0dGVybiwgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycyk7XG4gICAgaWYgKCFpc1BhdHRlcm4pIHsgdGhpcy5jaGVja1Byb3BDbGFzaChwcm9wLCBwcm9wSGFzaCwgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycyk7IH1cbiAgICBub2RlLnByb3BlcnRpZXMucHVzaChwcm9wKTtcbiAgfVxuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIGlzUGF0dGVybiA/IFwiT2JqZWN0UGF0dGVyblwiIDogXCJPYmplY3RFeHByZXNzaW9uXCIpXG59O1xuXG5wcCQ1LnBhcnNlUHJvcGVydHkgPSBmdW5jdGlvbihpc1BhdHRlcm4sIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpIHtcbiAgdmFyIHByb3AgPSB0aGlzLnN0YXJ0Tm9kZSgpLCBpc0dlbmVyYXRvciwgaXNBc3luYywgc3RhcnRQb3MsIHN0YXJ0TG9jO1xuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDkgJiYgdGhpcy5lYXQodHlwZXMkMS5lbGxpcHNpcykpIHtcbiAgICBpZiAoaXNQYXR0ZXJuKSB7XG4gICAgICBwcm9wLmFyZ3VtZW50ID0gdGhpcy5wYXJzZUlkZW50KGZhbHNlKTtcbiAgICAgIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEuY29tbWEpIHtcbiAgICAgICAgdGhpcy5yYWlzZVJlY292ZXJhYmxlKHRoaXMuc3RhcnQsIFwiQ29tbWEgaXMgbm90IHBlcm1pdHRlZCBhZnRlciB0aGUgcmVzdCBlbGVtZW50XCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShwcm9wLCBcIlJlc3RFbGVtZW50XCIpXG4gICAgfVxuICAgIC8vIFBhcnNlIGFyZ3VtZW50LlxuICAgIHByb3AuYXJndW1lbnQgPSB0aGlzLnBhcnNlTWF5YmVBc3NpZ24oZmFsc2UsIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpO1xuICAgIC8vIFRvIGRpc2FsbG93IHRyYWlsaW5nIGNvbW1hIHZpYSBgdGhpcy50b0Fzc2lnbmFibGUoKWAuXG4gICAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5jb21tYSAmJiByZWZEZXN0cnVjdHVyaW5nRXJyb3JzICYmIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMudHJhaWxpbmdDb21tYSA8IDApIHtcbiAgICAgIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMudHJhaWxpbmdDb21tYSA9IHRoaXMuc3RhcnQ7XG4gICAgfVxuICAgIC8vIEZpbmlzaFxuICAgIHJldHVybiB0aGlzLmZpbmlzaE5vZGUocHJvcCwgXCJTcHJlYWRFbGVtZW50XCIpXG4gIH1cbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2KSB7XG4gICAgcHJvcC5tZXRob2QgPSBmYWxzZTtcbiAgICBwcm9wLnNob3J0aGFuZCA9IGZhbHNlO1xuICAgIGlmIChpc1BhdHRlcm4gfHwgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycykge1xuICAgICAgc3RhcnRQb3MgPSB0aGlzLnN0YXJ0O1xuICAgICAgc3RhcnRMb2MgPSB0aGlzLnN0YXJ0TG9jO1xuICAgIH1cbiAgICBpZiAoIWlzUGF0dGVybilcbiAgICAgIHsgaXNHZW5lcmF0b3IgPSB0aGlzLmVhdCh0eXBlcyQxLnN0YXIpOyB9XG4gIH1cbiAgdmFyIGNvbnRhaW5zRXNjID0gdGhpcy5jb250YWluc0VzYztcbiAgdGhpcy5wYXJzZVByb3BlcnR5TmFtZShwcm9wKTtcbiAgaWYgKCFpc1BhdHRlcm4gJiYgIWNvbnRhaW5zRXNjICYmIHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA4ICYmICFpc0dlbmVyYXRvciAmJiB0aGlzLmlzQXN5bmNQcm9wKHByb3ApKSB7XG4gICAgaXNBc3luYyA9IHRydWU7XG4gICAgaXNHZW5lcmF0b3IgPSB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOSAmJiB0aGlzLmVhdCh0eXBlcyQxLnN0YXIpO1xuICAgIHRoaXMucGFyc2VQcm9wZXJ0eU5hbWUocHJvcCk7XG4gIH0gZWxzZSB7XG4gICAgaXNBc3luYyA9IGZhbHNlO1xuICB9XG4gIHRoaXMucGFyc2VQcm9wZXJ0eVZhbHVlKHByb3AsIGlzUGF0dGVybiwgaXNHZW5lcmF0b3IsIGlzQXN5bmMsIHN0YXJ0UG9zLCBzdGFydExvYywgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycywgY29udGFpbnNFc2MpO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKHByb3AsIFwiUHJvcGVydHlcIilcbn07XG5cbnBwJDUucGFyc2VHZXR0ZXJTZXR0ZXIgPSBmdW5jdGlvbihwcm9wKSB7XG4gIHZhciBraW5kID0gcHJvcC5rZXkubmFtZTtcbiAgdGhpcy5wYXJzZVByb3BlcnR5TmFtZShwcm9wKTtcbiAgcHJvcC52YWx1ZSA9IHRoaXMucGFyc2VNZXRob2QoZmFsc2UpO1xuICBwcm9wLmtpbmQgPSBraW5kO1xuICB2YXIgcGFyYW1Db3VudCA9IHByb3Aua2luZCA9PT0gXCJnZXRcIiA/IDAgOiAxO1xuICBpZiAocHJvcC52YWx1ZS5wYXJhbXMubGVuZ3RoICE9PSBwYXJhbUNvdW50KSB7XG4gICAgdmFyIHN0YXJ0ID0gcHJvcC52YWx1ZS5zdGFydDtcbiAgICBpZiAocHJvcC5raW5kID09PSBcImdldFwiKVxuICAgICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUoc3RhcnQsIFwiZ2V0dGVyIHNob3VsZCBoYXZlIG5vIHBhcmFtc1wiKTsgfVxuICAgIGVsc2VcbiAgICAgIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKHN0YXJ0LCBcInNldHRlciBzaG91bGQgaGF2ZSBleGFjdGx5IG9uZSBwYXJhbVwiKTsgfVxuICB9IGVsc2Uge1xuICAgIGlmIChwcm9wLmtpbmQgPT09IFwic2V0XCIgJiYgcHJvcC52YWx1ZS5wYXJhbXNbMF0udHlwZSA9PT0gXCJSZXN0RWxlbWVudFwiKVxuICAgICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUocHJvcC52YWx1ZS5wYXJhbXNbMF0uc3RhcnQsIFwiU2V0dGVyIGNhbm5vdCB1c2UgcmVzdCBwYXJhbXNcIik7IH1cbiAgfVxufTtcblxucHAkNS5wYXJzZVByb3BlcnR5VmFsdWUgPSBmdW5jdGlvbihwcm9wLCBpc1BhdHRlcm4sIGlzR2VuZXJhdG9yLCBpc0FzeW5jLCBzdGFydFBvcywgc3RhcnRMb2MsIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMsIGNvbnRhaW5zRXNjKSB7XG4gIGlmICgoaXNHZW5lcmF0b3IgfHwgaXNBc3luYykgJiYgdGhpcy50eXBlID09PSB0eXBlcyQxLmNvbG9uKVxuICAgIHsgdGhpcy51bmV4cGVjdGVkKCk7IH1cblxuICBpZiAodGhpcy5lYXQodHlwZXMkMS5jb2xvbikpIHtcbiAgICBwcm9wLnZhbHVlID0gaXNQYXR0ZXJuID8gdGhpcy5wYXJzZU1heWJlRGVmYXVsdCh0aGlzLnN0YXJ0LCB0aGlzLnN0YXJ0TG9jKSA6IHRoaXMucGFyc2VNYXliZUFzc2lnbihmYWxzZSwgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycyk7XG4gICAgcHJvcC5raW5kID0gXCJpbml0XCI7XG4gIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDYgJiYgdGhpcy50eXBlID09PSB0eXBlcyQxLnBhcmVuTCkge1xuICAgIGlmIChpc1BhdHRlcm4pIHsgdGhpcy51bmV4cGVjdGVkKCk7IH1cbiAgICBwcm9wLm1ldGhvZCA9IHRydWU7XG4gICAgcHJvcC52YWx1ZSA9IHRoaXMucGFyc2VNZXRob2QoaXNHZW5lcmF0b3IsIGlzQXN5bmMpO1xuICAgIHByb3Aua2luZCA9IFwiaW5pdFwiO1xuICB9IGVsc2UgaWYgKCFpc1BhdHRlcm4gJiYgIWNvbnRhaW5zRXNjICYmXG4gICAgICAgICAgICAgdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDUgJiYgIXByb3AuY29tcHV0ZWQgJiYgcHJvcC5rZXkudHlwZSA9PT0gXCJJZGVudGlmaWVyXCIgJiZcbiAgICAgICAgICAgICAocHJvcC5rZXkubmFtZSA9PT0gXCJnZXRcIiB8fCBwcm9wLmtleS5uYW1lID09PSBcInNldFwiKSAmJlxuICAgICAgICAgICAgICh0aGlzLnR5cGUgIT09IHR5cGVzJDEuY29tbWEgJiYgdGhpcy50eXBlICE9PSB0eXBlcyQxLmJyYWNlUiAmJiB0aGlzLnR5cGUgIT09IHR5cGVzJDEuZXEpKSB7XG4gICAgaWYgKGlzR2VuZXJhdG9yIHx8IGlzQXN5bmMpIHsgdGhpcy51bmV4cGVjdGVkKCk7IH1cbiAgICB0aGlzLnBhcnNlR2V0dGVyU2V0dGVyKHByb3ApO1xuICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2ICYmICFwcm9wLmNvbXB1dGVkICYmIHByb3Aua2V5LnR5cGUgPT09IFwiSWRlbnRpZmllclwiKSB7XG4gICAgaWYgKGlzR2VuZXJhdG9yIHx8IGlzQXN5bmMpIHsgdGhpcy51bmV4cGVjdGVkKCk7IH1cbiAgICB0aGlzLmNoZWNrVW5yZXNlcnZlZChwcm9wLmtleSk7XG4gICAgaWYgKHByb3Aua2V5Lm5hbWUgPT09IFwiYXdhaXRcIiAmJiAhdGhpcy5hd2FpdElkZW50UG9zKVxuICAgICAgeyB0aGlzLmF3YWl0SWRlbnRQb3MgPSBzdGFydFBvczsgfVxuICAgIGlmIChpc1BhdHRlcm4pIHtcbiAgICAgIHByb3AudmFsdWUgPSB0aGlzLnBhcnNlTWF5YmVEZWZhdWx0KHN0YXJ0UG9zLCBzdGFydExvYywgdGhpcy5jb3B5Tm9kZShwcm9wLmtleSkpO1xuICAgIH0gZWxzZSBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLmVxICYmIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpIHtcbiAgICAgIGlmIChyZWZEZXN0cnVjdHVyaW5nRXJyb3JzLnNob3J0aGFuZEFzc2lnbiA8IDApXG4gICAgICAgIHsgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy5zaG9ydGhhbmRBc3NpZ24gPSB0aGlzLnN0YXJ0OyB9XG4gICAgICBwcm9wLnZhbHVlID0gdGhpcy5wYXJzZU1heWJlRGVmYXVsdChzdGFydFBvcywgc3RhcnRMb2MsIHRoaXMuY29weU5vZGUocHJvcC5rZXkpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvcC52YWx1ZSA9IHRoaXMuY29weU5vZGUocHJvcC5rZXkpO1xuICAgIH1cbiAgICBwcm9wLmtpbmQgPSBcImluaXRcIjtcbiAgICBwcm9wLnNob3J0aGFuZCA9IHRydWU7XG4gIH0gZWxzZSB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG59O1xuXG5wcCQ1LnBhcnNlUHJvcGVydHlOYW1lID0gZnVuY3Rpb24ocHJvcCkge1xuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDYpIHtcbiAgICBpZiAodGhpcy5lYXQodHlwZXMkMS5icmFja2V0TCkpIHtcbiAgICAgIHByb3AuY29tcHV0ZWQgPSB0cnVlO1xuICAgICAgcHJvcC5rZXkgPSB0aGlzLnBhcnNlTWF5YmVBc3NpZ24oKTtcbiAgICAgIHRoaXMuZXhwZWN0KHR5cGVzJDEuYnJhY2tldFIpO1xuICAgICAgcmV0dXJuIHByb3Aua2V5XG4gICAgfSBlbHNlIHtcbiAgICAgIHByb3AuY29tcHV0ZWQgPSBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHByb3Aua2V5ID0gdGhpcy50eXBlID09PSB0eXBlcyQxLm51bSB8fCB0aGlzLnR5cGUgPT09IHR5cGVzJDEuc3RyaW5nID8gdGhpcy5wYXJzZUV4cHJBdG9tKCkgOiB0aGlzLnBhcnNlSWRlbnQodGhpcy5vcHRpb25zLmFsbG93UmVzZXJ2ZWQgIT09IFwibmV2ZXJcIilcbn07XG5cbi8vIEluaXRpYWxpemUgZW1wdHkgZnVuY3Rpb24gbm9kZS5cblxucHAkNS5pbml0RnVuY3Rpb24gPSBmdW5jdGlvbihub2RlKSB7XG4gIG5vZGUuaWQgPSBudWxsO1xuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDYpIHsgbm9kZS5nZW5lcmF0b3IgPSBub2RlLmV4cHJlc3Npb24gPSBmYWxzZTsgfVxuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDgpIHsgbm9kZS5hc3luYyA9IGZhbHNlOyB9XG59O1xuXG4vLyBQYXJzZSBvYmplY3Qgb3IgY2xhc3MgbWV0aG9kLlxuXG5wcCQ1LnBhcnNlTWV0aG9kID0gZnVuY3Rpb24oaXNHZW5lcmF0b3IsIGlzQXN5bmMsIGFsbG93RGlyZWN0U3VwZXIpIHtcbiAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpLCBvbGRZaWVsZFBvcyA9IHRoaXMueWllbGRQb3MsIG9sZEF3YWl0UG9zID0gdGhpcy5hd2FpdFBvcywgb2xkQXdhaXRJZGVudFBvcyA9IHRoaXMuYXdhaXRJZGVudFBvcztcblxuICB0aGlzLmluaXRGdW5jdGlvbihub2RlKTtcbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2KVxuICAgIHsgbm9kZS5nZW5lcmF0b3IgPSBpc0dlbmVyYXRvcjsgfVxuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDgpXG4gICAgeyBub2RlLmFzeW5jID0gISFpc0FzeW5jOyB9XG5cbiAgdGhpcy55aWVsZFBvcyA9IDA7XG4gIHRoaXMuYXdhaXRQb3MgPSAwO1xuICB0aGlzLmF3YWl0SWRlbnRQb3MgPSAwO1xuICB0aGlzLmVudGVyU2NvcGUoZnVuY3Rpb25GbGFncyhpc0FzeW5jLCBub2RlLmdlbmVyYXRvcikgfCBTQ09QRV9TVVBFUiB8IChhbGxvd0RpcmVjdFN1cGVyID8gU0NPUEVfRElSRUNUX1NVUEVSIDogMCkpO1xuXG4gIHRoaXMuZXhwZWN0KHR5cGVzJDEucGFyZW5MKTtcbiAgbm9kZS5wYXJhbXMgPSB0aGlzLnBhcnNlQmluZGluZ0xpc3QodHlwZXMkMS5wYXJlblIsIGZhbHNlLCB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOCk7XG4gIHRoaXMuY2hlY2tZaWVsZEF3YWl0SW5EZWZhdWx0UGFyYW1zKCk7XG4gIHRoaXMucGFyc2VGdW5jdGlvbkJvZHkobm9kZSwgZmFsc2UsIHRydWUsIGZhbHNlKTtcblxuICB0aGlzLnlpZWxkUG9zID0gb2xkWWllbGRQb3M7XG4gIHRoaXMuYXdhaXRQb3MgPSBvbGRBd2FpdFBvcztcbiAgdGhpcy5hd2FpdElkZW50UG9zID0gb2xkQXdhaXRJZGVudFBvcztcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIkZ1bmN0aW9uRXhwcmVzc2lvblwiKVxufTtcblxuLy8gUGFyc2UgYXJyb3cgZnVuY3Rpb24gZXhwcmVzc2lvbiB3aXRoIGdpdmVuIHBhcmFtZXRlcnMuXG5cbnBwJDUucGFyc2VBcnJvd0V4cHJlc3Npb24gPSBmdW5jdGlvbihub2RlLCBwYXJhbXMsIGlzQXN5bmMsIGZvckluaXQpIHtcbiAgdmFyIG9sZFlpZWxkUG9zID0gdGhpcy55aWVsZFBvcywgb2xkQXdhaXRQb3MgPSB0aGlzLmF3YWl0UG9zLCBvbGRBd2FpdElkZW50UG9zID0gdGhpcy5hd2FpdElkZW50UG9zO1xuXG4gIHRoaXMuZW50ZXJTY29wZShmdW5jdGlvbkZsYWdzKGlzQXN5bmMsIGZhbHNlKSB8IFNDT1BFX0FSUk9XKTtcbiAgdGhpcy5pbml0RnVuY3Rpb24obm9kZSk7XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOCkgeyBub2RlLmFzeW5jID0gISFpc0FzeW5jOyB9XG5cbiAgdGhpcy55aWVsZFBvcyA9IDA7XG4gIHRoaXMuYXdhaXRQb3MgPSAwO1xuICB0aGlzLmF3YWl0SWRlbnRQb3MgPSAwO1xuXG4gIG5vZGUucGFyYW1zID0gdGhpcy50b0Fzc2lnbmFibGVMaXN0KHBhcmFtcywgdHJ1ZSk7XG4gIHRoaXMucGFyc2VGdW5jdGlvbkJvZHkobm9kZSwgdHJ1ZSwgZmFsc2UsIGZvckluaXQpO1xuXG4gIHRoaXMueWllbGRQb3MgPSBvbGRZaWVsZFBvcztcbiAgdGhpcy5hd2FpdFBvcyA9IG9sZEF3YWl0UG9zO1xuICB0aGlzLmF3YWl0SWRlbnRQb3MgPSBvbGRBd2FpdElkZW50UG9zO1xuICByZXR1cm4gdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiQXJyb3dGdW5jdGlvbkV4cHJlc3Npb25cIilcbn07XG5cbi8vIFBhcnNlIGZ1bmN0aW9uIGJvZHkgYW5kIGNoZWNrIHBhcmFtZXRlcnMuXG5cbnBwJDUucGFyc2VGdW5jdGlvbkJvZHkgPSBmdW5jdGlvbihub2RlLCBpc0Fycm93RnVuY3Rpb24sIGlzTWV0aG9kLCBmb3JJbml0KSB7XG4gIHZhciBpc0V4cHJlc3Npb24gPSBpc0Fycm93RnVuY3Rpb24gJiYgdGhpcy50eXBlICE9PSB0eXBlcyQxLmJyYWNlTDtcbiAgdmFyIG9sZFN0cmljdCA9IHRoaXMuc3RyaWN0LCB1c2VTdHJpY3QgPSBmYWxzZTtcblxuICBpZiAoaXNFeHByZXNzaW9uKSB7XG4gICAgbm9kZS5ib2R5ID0gdGhpcy5wYXJzZU1heWJlQXNzaWduKGZvckluaXQpO1xuICAgIG5vZGUuZXhwcmVzc2lvbiA9IHRydWU7XG4gICAgdGhpcy5jaGVja1BhcmFtcyhub2RlLCBmYWxzZSk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIG5vblNpbXBsZSA9IHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA3ICYmICF0aGlzLmlzU2ltcGxlUGFyYW1MaXN0KG5vZGUucGFyYW1zKTtcbiAgICBpZiAoIW9sZFN0cmljdCB8fCBub25TaW1wbGUpIHtcbiAgICAgIHVzZVN0cmljdCA9IHRoaXMuc3RyaWN0RGlyZWN0aXZlKHRoaXMuZW5kKTtcbiAgICAgIC8vIElmIHRoaXMgaXMgYSBzdHJpY3QgbW9kZSBmdW5jdGlvbiwgdmVyaWZ5IHRoYXQgYXJndW1lbnQgbmFtZXNcbiAgICAgIC8vIGFyZSBub3QgcmVwZWF0ZWQsIGFuZCBpdCBkb2VzIG5vdCB0cnkgdG8gYmluZCB0aGUgd29yZHMgYGV2YWxgXG4gICAgICAvLyBvciBgYXJndW1lbnRzYC5cbiAgICAgIGlmICh1c2VTdHJpY3QgJiYgbm9uU2ltcGxlKVxuICAgICAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShub2RlLnN0YXJ0LCBcIklsbGVnYWwgJ3VzZSBzdHJpY3QnIGRpcmVjdGl2ZSBpbiBmdW5jdGlvbiB3aXRoIG5vbi1zaW1wbGUgcGFyYW1ldGVyIGxpc3RcIik7IH1cbiAgICB9XG4gICAgLy8gU3RhcnQgYSBuZXcgc2NvcGUgd2l0aCByZWdhcmQgdG8gbGFiZWxzIGFuZCB0aGUgYGluRnVuY3Rpb25gXG4gICAgLy8gZmxhZyAocmVzdG9yZSB0aGVtIHRvIHRoZWlyIG9sZCB2YWx1ZSBhZnRlcndhcmRzKS5cbiAgICB2YXIgb2xkTGFiZWxzID0gdGhpcy5sYWJlbHM7XG4gICAgdGhpcy5sYWJlbHMgPSBbXTtcbiAgICBpZiAodXNlU3RyaWN0KSB7IHRoaXMuc3RyaWN0ID0gdHJ1ZTsgfVxuXG4gICAgLy8gQWRkIHRoZSBwYXJhbXMgdG8gdmFyRGVjbGFyZWROYW1lcyB0byBlbnN1cmUgdGhhdCBhbiBlcnJvciBpcyB0aHJvd25cbiAgICAvLyBpZiBhIGxldC9jb25zdCBkZWNsYXJhdGlvbiBpbiB0aGUgZnVuY3Rpb24gY2xhc2hlcyB3aXRoIG9uZSBvZiB0aGUgcGFyYW1zLlxuICAgIHRoaXMuY2hlY2tQYXJhbXMobm9kZSwgIW9sZFN0cmljdCAmJiAhdXNlU3RyaWN0ICYmICFpc0Fycm93RnVuY3Rpb24gJiYgIWlzTWV0aG9kICYmIHRoaXMuaXNTaW1wbGVQYXJhbUxpc3Qobm9kZS5wYXJhbXMpKTtcbiAgICAvLyBFbnN1cmUgdGhlIGZ1bmN0aW9uIG5hbWUgaXNuJ3QgYSBmb3JiaWRkZW4gaWRlbnRpZmllciBpbiBzdHJpY3QgbW9kZSwgZS5nLiAnZXZhbCdcbiAgICBpZiAodGhpcy5zdHJpY3QgJiYgbm9kZS5pZCkgeyB0aGlzLmNoZWNrTFZhbFNpbXBsZShub2RlLmlkLCBCSU5EX09VVFNJREUpOyB9XG4gICAgbm9kZS5ib2R5ID0gdGhpcy5wYXJzZUJsb2NrKGZhbHNlLCB1bmRlZmluZWQsIHVzZVN0cmljdCAmJiAhb2xkU3RyaWN0KTtcbiAgICBub2RlLmV4cHJlc3Npb24gPSBmYWxzZTtcbiAgICB0aGlzLmFkYXB0RGlyZWN0aXZlUHJvbG9ndWUobm9kZS5ib2R5LmJvZHkpO1xuICAgIHRoaXMubGFiZWxzID0gb2xkTGFiZWxzO1xuICB9XG4gIHRoaXMuZXhpdFNjb3BlKCk7XG59O1xuXG5wcCQ1LmlzU2ltcGxlUGFyYW1MaXN0ID0gZnVuY3Rpb24ocGFyYW1zKSB7XG4gIGZvciAodmFyIGkgPSAwLCBsaXN0ID0gcGFyYW1zOyBpIDwgbGlzdC5sZW5ndGg7IGkgKz0gMSlcbiAgICB7XG4gICAgdmFyIHBhcmFtID0gbGlzdFtpXTtcblxuICAgIGlmIChwYXJhbS50eXBlICE9PSBcIklkZW50aWZpZXJcIikgeyByZXR1cm4gZmFsc2VcbiAgfSB9XG4gIHJldHVybiB0cnVlXG59O1xuXG4vLyBDaGVja3MgZnVuY3Rpb24gcGFyYW1zIGZvciB2YXJpb3VzIGRpc2FsbG93ZWQgcGF0dGVybnMgc3VjaCBhcyB1c2luZyBcImV2YWxcIlxuLy8gb3IgXCJhcmd1bWVudHNcIiBhbmQgZHVwbGljYXRlIHBhcmFtZXRlcnMuXG5cbnBwJDUuY2hlY2tQYXJhbXMgPSBmdW5jdGlvbihub2RlLCBhbGxvd0R1cGxpY2F0ZXMpIHtcbiAgdmFyIG5hbWVIYXNoID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgZm9yICh2YXIgaSA9IDAsIGxpc3QgPSBub2RlLnBhcmFtczsgaSA8IGxpc3QubGVuZ3RoOyBpICs9IDEpXG4gICAge1xuICAgIHZhciBwYXJhbSA9IGxpc3RbaV07XG5cbiAgICB0aGlzLmNoZWNrTFZhbElubmVyUGF0dGVybihwYXJhbSwgQklORF9WQVIsIGFsbG93RHVwbGljYXRlcyA/IG51bGwgOiBuYW1lSGFzaCk7XG4gIH1cbn07XG5cbi8vIFBhcnNlcyBhIGNvbW1hLXNlcGFyYXRlZCBsaXN0IG9mIGV4cHJlc3Npb25zLCBhbmQgcmV0dXJucyB0aGVtIGFzXG4vLyBhbiBhcnJheS4gYGNsb3NlYCBpcyB0aGUgdG9rZW4gdHlwZSB0aGF0IGVuZHMgdGhlIGxpc3QsIGFuZFxuLy8gYGFsbG93RW1wdHlgIGNhbiBiZSB0dXJuZWQgb24gdG8gYWxsb3cgc3Vic2VxdWVudCBjb21tYXMgd2l0aFxuLy8gbm90aGluZyBpbiBiZXR3ZWVuIHRoZW0gdG8gYmUgcGFyc2VkIGFzIGBudWxsYCAod2hpY2ggaXMgbmVlZGVkXG4vLyBmb3IgYXJyYXkgbGl0ZXJhbHMpLlxuXG5wcCQ1LnBhcnNlRXhwckxpc3QgPSBmdW5jdGlvbihjbG9zZSwgYWxsb3dUcmFpbGluZ0NvbW1hLCBhbGxvd0VtcHR5LCByZWZEZXN0cnVjdHVyaW5nRXJyb3JzKSB7XG4gIHZhciBlbHRzID0gW10sIGZpcnN0ID0gdHJ1ZTtcbiAgd2hpbGUgKCF0aGlzLmVhdChjbG9zZSkpIHtcbiAgICBpZiAoIWZpcnN0KSB7XG4gICAgICB0aGlzLmV4cGVjdCh0eXBlcyQxLmNvbW1hKTtcbiAgICAgIGlmIChhbGxvd1RyYWlsaW5nQ29tbWEgJiYgdGhpcy5hZnRlclRyYWlsaW5nQ29tbWEoY2xvc2UpKSB7IGJyZWFrIH1cbiAgICB9IGVsc2UgeyBmaXJzdCA9IGZhbHNlOyB9XG5cbiAgICB2YXIgZWx0ID0gKHZvaWQgMCk7XG4gICAgaWYgKGFsbG93RW1wdHkgJiYgdGhpcy50eXBlID09PSB0eXBlcyQxLmNvbW1hKVxuICAgICAgeyBlbHQgPSBudWxsOyB9XG4gICAgZWxzZSBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLmVsbGlwc2lzKSB7XG4gICAgICBlbHQgPSB0aGlzLnBhcnNlU3ByZWFkKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpO1xuICAgICAgaWYgKHJlZkRlc3RydWN0dXJpbmdFcnJvcnMgJiYgdGhpcy50eXBlID09PSB0eXBlcyQxLmNvbW1hICYmIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMudHJhaWxpbmdDb21tYSA8IDApXG4gICAgICAgIHsgcmVmRGVzdHJ1Y3R1cmluZ0Vycm9ycy50cmFpbGluZ0NvbW1hID0gdGhpcy5zdGFydDsgfVxuICAgIH0gZWxzZSB7XG4gICAgICBlbHQgPSB0aGlzLnBhcnNlTWF5YmVBc3NpZ24oZmFsc2UsIHJlZkRlc3RydWN0dXJpbmdFcnJvcnMpO1xuICAgIH1cbiAgICBlbHRzLnB1c2goZWx0KTtcbiAgfVxuICByZXR1cm4gZWx0c1xufTtcblxucHAkNS5jaGVja1VucmVzZXJ2ZWQgPSBmdW5jdGlvbihyZWYpIHtcbiAgdmFyIHN0YXJ0ID0gcmVmLnN0YXJ0O1xuICB2YXIgZW5kID0gcmVmLmVuZDtcbiAgdmFyIG5hbWUgPSByZWYubmFtZTtcblxuICBpZiAodGhpcy5pbkdlbmVyYXRvciAmJiBuYW1lID09PSBcInlpZWxkXCIpXG4gICAgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUoc3RhcnQsIFwiQ2Fubm90IHVzZSAneWllbGQnIGFzIGlkZW50aWZpZXIgaW5zaWRlIGEgZ2VuZXJhdG9yXCIpOyB9XG4gIGlmICh0aGlzLmluQXN5bmMgJiYgbmFtZSA9PT0gXCJhd2FpdFwiKVxuICAgIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKHN0YXJ0LCBcIkNhbm5vdCB1c2UgJ2F3YWl0JyBhcyBpZGVudGlmaWVyIGluc2lkZSBhbiBhc3luYyBmdW5jdGlvblwiKTsgfVxuICBpZiAoISh0aGlzLmN1cnJlbnRUaGlzU2NvcGUoKS5mbGFncyAmIFNDT1BFX1ZBUikgJiYgbmFtZSA9PT0gXCJhcmd1bWVudHNcIilcbiAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShzdGFydCwgXCJDYW5ub3QgdXNlICdhcmd1bWVudHMnIGluIGNsYXNzIGZpZWxkIGluaXRpYWxpemVyXCIpOyB9XG4gIGlmICh0aGlzLmluQ2xhc3NTdGF0aWNCbG9jayAmJiAobmFtZSA9PT0gXCJhcmd1bWVudHNcIiB8fCBuYW1lID09PSBcImF3YWl0XCIpKVxuICAgIHsgdGhpcy5yYWlzZShzdGFydCwgKFwiQ2Fubm90IHVzZSBcIiArIG5hbWUgKyBcIiBpbiBjbGFzcyBzdGF0aWMgaW5pdGlhbGl6YXRpb24gYmxvY2tcIikpOyB9XG4gIGlmICh0aGlzLmtleXdvcmRzLnRlc3QobmFtZSkpXG4gICAgeyB0aGlzLnJhaXNlKHN0YXJ0LCAoXCJVbmV4cGVjdGVkIGtleXdvcmQgJ1wiICsgbmFtZSArIFwiJ1wiKSk7IH1cbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA8IDYgJiZcbiAgICB0aGlzLmlucHV0LnNsaWNlKHN0YXJ0LCBlbmQpLmluZGV4T2YoXCJcXFxcXCIpICE9PSAtMSkgeyByZXR1cm4gfVxuICB2YXIgcmUgPSB0aGlzLnN0cmljdCA/IHRoaXMucmVzZXJ2ZWRXb3Jkc1N0cmljdCA6IHRoaXMucmVzZXJ2ZWRXb3JkcztcbiAgaWYgKHJlLnRlc3QobmFtZSkpIHtcbiAgICBpZiAoIXRoaXMuaW5Bc3luYyAmJiBuYW1lID09PSBcImF3YWl0XCIpXG4gICAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZShzdGFydCwgXCJDYW5ub3QgdXNlIGtleXdvcmQgJ2F3YWl0JyBvdXRzaWRlIGFuIGFzeW5jIGZ1bmN0aW9uXCIpOyB9XG4gICAgdGhpcy5yYWlzZVJlY292ZXJhYmxlKHN0YXJ0LCAoXCJUaGUga2V5d29yZCAnXCIgKyBuYW1lICsgXCInIGlzIHJlc2VydmVkXCIpKTtcbiAgfVxufTtcblxuLy8gUGFyc2UgdGhlIG5leHQgdG9rZW4gYXMgYW4gaWRlbnRpZmllci4gSWYgYGxpYmVyYWxgIGlzIHRydWUgKHVzZWRcbi8vIHdoZW4gcGFyc2luZyBwcm9wZXJ0aWVzKSwgaXQgd2lsbCBhbHNvIGNvbnZlcnQga2V5d29yZHMgaW50b1xuLy8gaWRlbnRpZmllcnMuXG5cbnBwJDUucGFyc2VJZGVudCA9IGZ1bmN0aW9uKGxpYmVyYWwpIHtcbiAgdmFyIG5vZGUgPSB0aGlzLnBhcnNlSWRlbnROb2RlKCk7XG4gIHRoaXMubmV4dCghIWxpYmVyYWwpO1xuICB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJJZGVudGlmaWVyXCIpO1xuICBpZiAoIWxpYmVyYWwpIHtcbiAgICB0aGlzLmNoZWNrVW5yZXNlcnZlZChub2RlKTtcbiAgICBpZiAobm9kZS5uYW1lID09PSBcImF3YWl0XCIgJiYgIXRoaXMuYXdhaXRJZGVudFBvcylcbiAgICAgIHsgdGhpcy5hd2FpdElkZW50UG9zID0gbm9kZS5zdGFydDsgfVxuICB9XG4gIHJldHVybiBub2RlXG59O1xuXG5wcCQ1LnBhcnNlSWRlbnROb2RlID0gZnVuY3Rpb24oKSB7XG4gIHZhciBub2RlID0gdGhpcy5zdGFydE5vZGUoKTtcbiAgaWYgKHRoaXMudHlwZSA9PT0gdHlwZXMkMS5uYW1lKSB7XG4gICAgbm9kZS5uYW1lID0gdGhpcy52YWx1ZTtcbiAgfSBlbHNlIGlmICh0aGlzLnR5cGUua2V5d29yZCkge1xuICAgIG5vZGUubmFtZSA9IHRoaXMudHlwZS5rZXl3b3JkO1xuXG4gICAgLy8gVG8gZml4IGh0dHBzOi8vZ2l0aHViLmNvbS9hY29ybmpzL2Fjb3JuL2lzc3Vlcy81NzVcbiAgICAvLyBgY2xhc3NgIGFuZCBgZnVuY3Rpb25gIGtleXdvcmRzIHB1c2ggbmV3IGNvbnRleHQgaW50byB0aGlzLmNvbnRleHQuXG4gICAgLy8gQnV0IHRoZXJlIGlzIG5vIGNoYW5jZSB0byBwb3AgdGhlIGNvbnRleHQgaWYgdGhlIGtleXdvcmQgaXMgY29uc3VtZWQgYXMgYW4gaWRlbnRpZmllciBzdWNoIGFzIGEgcHJvcGVydHkgbmFtZS5cbiAgICAvLyBJZiB0aGUgcHJldmlvdXMgdG9rZW4gaXMgYSBkb3QsIHRoaXMgZG9lcyBub3QgYXBwbHkgYmVjYXVzZSB0aGUgY29udGV4dC1tYW5hZ2luZyBjb2RlIGFscmVhZHkgaWdub3JlZCB0aGUga2V5d29yZFxuICAgIGlmICgobm9kZS5uYW1lID09PSBcImNsYXNzXCIgfHwgbm9kZS5uYW1lID09PSBcImZ1bmN0aW9uXCIpICYmXG4gICAgICAodGhpcy5sYXN0VG9rRW5kICE9PSB0aGlzLmxhc3RUb2tTdGFydCArIDEgfHwgdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMubGFzdFRva1N0YXJ0KSAhPT0gNDYpKSB7XG4gICAgICB0aGlzLmNvbnRleHQucG9wKCk7XG4gICAgfVxuICAgIHRoaXMudHlwZSA9IHR5cGVzJDEubmFtZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnVuZXhwZWN0ZWQoKTtcbiAgfVxuICByZXR1cm4gbm9kZVxufTtcblxucHAkNS5wYXJzZVByaXZhdGVJZGVudCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gIGlmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEucHJpdmF0ZUlkKSB7XG4gICAgbm9kZS5uYW1lID0gdGhpcy52YWx1ZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnVuZXhwZWN0ZWQoKTtcbiAgfVxuICB0aGlzLm5leHQoKTtcbiAgdGhpcy5maW5pc2hOb2RlKG5vZGUsIFwiUHJpdmF0ZUlkZW50aWZpZXJcIik7XG5cbiAgLy8gRm9yIHZhbGlkYXRpbmcgZXhpc3RlbmNlXG4gIGlmICh0aGlzLm9wdGlvbnMuY2hlY2tQcml2YXRlRmllbGRzKSB7XG4gICAgaWYgKHRoaXMucHJpdmF0ZU5hbWVTdGFjay5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMucmFpc2Uobm9kZS5zdGFydCwgKFwiUHJpdmF0ZSBmaWVsZCAnI1wiICsgKG5vZGUubmFtZSkgKyBcIicgbXVzdCBiZSBkZWNsYXJlZCBpbiBhbiBlbmNsb3NpbmcgY2xhc3NcIikpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnByaXZhdGVOYW1lU3RhY2tbdGhpcy5wcml2YXRlTmFtZVN0YWNrLmxlbmd0aCAtIDFdLnVzZWQucHVzaChub2RlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbm9kZVxufTtcblxuLy8gUGFyc2VzIHlpZWxkIGV4cHJlc3Npb24gaW5zaWRlIGdlbmVyYXRvci5cblxucHAkNS5wYXJzZVlpZWxkID0gZnVuY3Rpb24oZm9ySW5pdCkge1xuICBpZiAoIXRoaXMueWllbGRQb3MpIHsgdGhpcy55aWVsZFBvcyA9IHRoaXMuc3RhcnQ7IH1cblxuICB2YXIgbm9kZSA9IHRoaXMuc3RhcnROb2RlKCk7XG4gIHRoaXMubmV4dCgpO1xuICBpZiAodGhpcy50eXBlID09PSB0eXBlcyQxLnNlbWkgfHwgdGhpcy5jYW5JbnNlcnRTZW1pY29sb24oKSB8fCAodGhpcy50eXBlICE9PSB0eXBlcyQxLnN0YXIgJiYgIXRoaXMudHlwZS5zdGFydHNFeHByKSkge1xuICAgIG5vZGUuZGVsZWdhdGUgPSBmYWxzZTtcbiAgICBub2RlLmFyZ3VtZW50ID0gbnVsbDtcbiAgfSBlbHNlIHtcbiAgICBub2RlLmRlbGVnYXRlID0gdGhpcy5lYXQodHlwZXMkMS5zdGFyKTtcbiAgICBub2RlLmFyZ3VtZW50ID0gdGhpcy5wYXJzZU1heWJlQXNzaWduKGZvckluaXQpO1xuICB9XG4gIHJldHVybiB0aGlzLmZpbmlzaE5vZGUobm9kZSwgXCJZaWVsZEV4cHJlc3Npb25cIilcbn07XG5cbnBwJDUucGFyc2VBd2FpdCA9IGZ1bmN0aW9uKGZvckluaXQpIHtcbiAgaWYgKCF0aGlzLmF3YWl0UG9zKSB7IHRoaXMuYXdhaXRQb3MgPSB0aGlzLnN0YXJ0OyB9XG5cbiAgdmFyIG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSgpO1xuICB0aGlzLm5leHQoKTtcbiAgbm9kZS5hcmd1bWVudCA9IHRoaXMucGFyc2VNYXliZVVuYXJ5KG51bGwsIHRydWUsIGZhbHNlLCBmb3JJbml0KTtcbiAgcmV0dXJuIHRoaXMuZmluaXNoTm9kZShub2RlLCBcIkF3YWl0RXhwcmVzc2lvblwiKVxufTtcblxudmFyIHBwJDQgPSBQYXJzZXIucHJvdG90eXBlO1xuXG4vLyBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgdG8gcmFpc2UgZXhjZXB0aW9ucyBvbiBwYXJzZSBlcnJvcnMuIEl0XG4vLyB0YWtlcyBhbiBvZmZzZXQgaW50ZWdlciAoaW50byB0aGUgY3VycmVudCBgaW5wdXRgKSB0byBpbmRpY2F0ZVxuLy8gdGhlIGxvY2F0aW9uIG9mIHRoZSBlcnJvciwgYXR0YWNoZXMgdGhlIHBvc2l0aW9uIHRvIHRoZSBlbmRcbi8vIG9mIHRoZSBlcnJvciBtZXNzYWdlLCBhbmQgdGhlbiByYWlzZXMgYSBgU3ludGF4RXJyb3JgIHdpdGggdGhhdFxuLy8gbWVzc2FnZS5cblxucHAkNC5yYWlzZSA9IGZ1bmN0aW9uKHBvcywgbWVzc2FnZSkge1xuICB2YXIgbG9jID0gZ2V0TGluZUluZm8odGhpcy5pbnB1dCwgcG9zKTtcbiAgbWVzc2FnZSArPSBcIiAoXCIgKyBsb2MubGluZSArIFwiOlwiICsgbG9jLmNvbHVtbiArIFwiKVwiO1xuICBpZiAodGhpcy5zb3VyY2VGaWxlKSB7XG4gICAgbWVzc2FnZSArPSBcIiBpbiBcIiArIHRoaXMuc291cmNlRmlsZTtcbiAgfVxuICB2YXIgZXJyID0gbmV3IFN5bnRheEVycm9yKG1lc3NhZ2UpO1xuICBlcnIucG9zID0gcG9zOyBlcnIubG9jID0gbG9jOyBlcnIucmFpc2VkQXQgPSB0aGlzLnBvcztcbiAgdGhyb3cgZXJyXG59O1xuXG5wcCQ0LnJhaXNlUmVjb3ZlcmFibGUgPSBwcCQ0LnJhaXNlO1xuXG5wcCQ0LmN1clBvc2l0aW9uID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLm9wdGlvbnMubG9jYXRpb25zKSB7XG4gICAgcmV0dXJuIG5ldyBQb3NpdGlvbih0aGlzLmN1ckxpbmUsIHRoaXMucG9zIC0gdGhpcy5saW5lU3RhcnQpXG4gIH1cbn07XG5cbnZhciBwcCQzID0gUGFyc2VyLnByb3RvdHlwZTtcblxudmFyIFNjb3BlID0gZnVuY3Rpb24gU2NvcGUoZmxhZ3MpIHtcbiAgdGhpcy5mbGFncyA9IGZsYWdzO1xuICAvLyBBIGxpc3Qgb2YgdmFyLWRlY2xhcmVkIG5hbWVzIGluIHRoZSBjdXJyZW50IGxleGljYWwgc2NvcGVcbiAgdGhpcy52YXIgPSBbXTtcbiAgLy8gQSBsaXN0IG9mIGxleGljYWxseS1kZWNsYXJlZCBuYW1lcyBpbiB0aGUgY3VycmVudCBsZXhpY2FsIHNjb3BlXG4gIHRoaXMubGV4aWNhbCA9IFtdO1xuICAvLyBBIGxpc3Qgb2YgbGV4aWNhbGx5LWRlY2xhcmVkIEZ1bmN0aW9uRGVjbGFyYXRpb24gbmFtZXMgaW4gdGhlIGN1cnJlbnQgbGV4aWNhbCBzY29wZVxuICB0aGlzLmZ1bmN0aW9ucyA9IFtdO1xufTtcblxuLy8gVGhlIGZ1bmN0aW9ucyBpbiB0aGlzIG1vZHVsZSBrZWVwIHRyYWNrIG9mIGRlY2xhcmVkIHZhcmlhYmxlcyBpbiB0aGUgY3VycmVudCBzY29wZSBpbiBvcmRlciB0byBkZXRlY3QgZHVwbGljYXRlIHZhcmlhYmxlIG5hbWVzLlxuXG5wcCQzLmVudGVyU2NvcGUgPSBmdW5jdGlvbihmbGFncykge1xuICB0aGlzLnNjb3BlU3RhY2sucHVzaChuZXcgU2NvcGUoZmxhZ3MpKTtcbn07XG5cbnBwJDMuZXhpdFNjb3BlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuc2NvcGVTdGFjay5wb3AoKTtcbn07XG5cbi8vIFRoZSBzcGVjIHNheXM6XG4vLyA+IEF0IHRoZSB0b3AgbGV2ZWwgb2YgYSBmdW5jdGlvbiwgb3Igc2NyaXB0LCBmdW5jdGlvbiBkZWNsYXJhdGlvbnMgYXJlXG4vLyA+IHRyZWF0ZWQgbGlrZSB2YXIgZGVjbGFyYXRpb25zIHJhdGhlciB0aGFuIGxpa2UgbGV4aWNhbCBkZWNsYXJhdGlvbnMuXG5wcCQzLnRyZWF0RnVuY3Rpb25zQXNWYXJJblNjb3BlID0gZnVuY3Rpb24oc2NvcGUpIHtcbiAgcmV0dXJuIChzY29wZS5mbGFncyAmIFNDT1BFX0ZVTkNUSU9OKSB8fCAhdGhpcy5pbk1vZHVsZSAmJiAoc2NvcGUuZmxhZ3MgJiBTQ09QRV9UT1ApXG59O1xuXG5wcCQzLmRlY2xhcmVOYW1lID0gZnVuY3Rpb24obmFtZSwgYmluZGluZ1R5cGUsIHBvcykge1xuICB2YXIgcmVkZWNsYXJlZCA9IGZhbHNlO1xuICBpZiAoYmluZGluZ1R5cGUgPT09IEJJTkRfTEVYSUNBTCkge1xuICAgIHZhciBzY29wZSA9IHRoaXMuY3VycmVudFNjb3BlKCk7XG4gICAgcmVkZWNsYXJlZCA9IHNjb3BlLmxleGljYWwuaW5kZXhPZihuYW1lKSA+IC0xIHx8IHNjb3BlLmZ1bmN0aW9ucy5pbmRleE9mKG5hbWUpID4gLTEgfHwgc2NvcGUudmFyLmluZGV4T2YobmFtZSkgPiAtMTtcbiAgICBzY29wZS5sZXhpY2FsLnB1c2gobmFtZSk7XG4gICAgaWYgKHRoaXMuaW5Nb2R1bGUgJiYgKHNjb3BlLmZsYWdzICYgU0NPUEVfVE9QKSlcbiAgICAgIHsgZGVsZXRlIHRoaXMudW5kZWZpbmVkRXhwb3J0c1tuYW1lXTsgfVxuICB9IGVsc2UgaWYgKGJpbmRpbmdUeXBlID09PSBCSU5EX1NJTVBMRV9DQVRDSCkge1xuICAgIHZhciBzY29wZSQxID0gdGhpcy5jdXJyZW50U2NvcGUoKTtcbiAgICBzY29wZSQxLmxleGljYWwucHVzaChuYW1lKTtcbiAgfSBlbHNlIGlmIChiaW5kaW5nVHlwZSA9PT0gQklORF9GVU5DVElPTikge1xuICAgIHZhciBzY29wZSQyID0gdGhpcy5jdXJyZW50U2NvcGUoKTtcbiAgICBpZiAodGhpcy50cmVhdEZ1bmN0aW9uc0FzVmFyKVxuICAgICAgeyByZWRlY2xhcmVkID0gc2NvcGUkMi5sZXhpY2FsLmluZGV4T2YobmFtZSkgPiAtMTsgfVxuICAgIGVsc2VcbiAgICAgIHsgcmVkZWNsYXJlZCA9IHNjb3BlJDIubGV4aWNhbC5pbmRleE9mKG5hbWUpID4gLTEgfHwgc2NvcGUkMi52YXIuaW5kZXhPZihuYW1lKSA+IC0xOyB9XG4gICAgc2NvcGUkMi5mdW5jdGlvbnMucHVzaChuYW1lKTtcbiAgfSBlbHNlIHtcbiAgICBmb3IgKHZhciBpID0gdGhpcy5zY29wZVN0YWNrLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICB2YXIgc2NvcGUkMyA9IHRoaXMuc2NvcGVTdGFja1tpXTtcbiAgICAgIGlmIChzY29wZSQzLmxleGljYWwuaW5kZXhPZihuYW1lKSA+IC0xICYmICEoKHNjb3BlJDMuZmxhZ3MgJiBTQ09QRV9TSU1QTEVfQ0FUQ0gpICYmIHNjb3BlJDMubGV4aWNhbFswXSA9PT0gbmFtZSkgfHxcbiAgICAgICAgICAhdGhpcy50cmVhdEZ1bmN0aW9uc0FzVmFySW5TY29wZShzY29wZSQzKSAmJiBzY29wZSQzLmZ1bmN0aW9ucy5pbmRleE9mKG5hbWUpID4gLTEpIHtcbiAgICAgICAgcmVkZWNsYXJlZCA9IHRydWU7XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgICBzY29wZSQzLnZhci5wdXNoKG5hbWUpO1xuICAgICAgaWYgKHRoaXMuaW5Nb2R1bGUgJiYgKHNjb3BlJDMuZmxhZ3MgJiBTQ09QRV9UT1ApKVxuICAgICAgICB7IGRlbGV0ZSB0aGlzLnVuZGVmaW5lZEV4cG9ydHNbbmFtZV07IH1cbiAgICAgIGlmIChzY29wZSQzLmZsYWdzICYgU0NPUEVfVkFSKSB7IGJyZWFrIH1cbiAgICB9XG4gIH1cbiAgaWYgKHJlZGVjbGFyZWQpIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKHBvcywgKFwiSWRlbnRpZmllciAnXCIgKyBuYW1lICsgXCInIGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIikpOyB9XG59O1xuXG5wcCQzLmNoZWNrTG9jYWxFeHBvcnQgPSBmdW5jdGlvbihpZCkge1xuICAvLyBzY29wZS5mdW5jdGlvbnMgbXVzdCBiZSBlbXB0eSBhcyBNb2R1bGUgY29kZSBpcyBhbHdheXMgc3RyaWN0LlxuICBpZiAodGhpcy5zY29wZVN0YWNrWzBdLmxleGljYWwuaW5kZXhPZihpZC5uYW1lKSA9PT0gLTEgJiZcbiAgICAgIHRoaXMuc2NvcGVTdGFja1swXS52YXIuaW5kZXhPZihpZC5uYW1lKSA9PT0gLTEpIHtcbiAgICB0aGlzLnVuZGVmaW5lZEV4cG9ydHNbaWQubmFtZV0gPSBpZDtcbiAgfVxufTtcblxucHAkMy5jdXJyZW50U2NvcGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuc2NvcGVTdGFja1t0aGlzLnNjb3BlU3RhY2subGVuZ3RoIC0gMV1cbn07XG5cbnBwJDMuY3VycmVudFZhclNjb3BlID0gZnVuY3Rpb24oKSB7XG4gIGZvciAodmFyIGkgPSB0aGlzLnNjb3BlU3RhY2subGVuZ3RoIC0gMTs7IGktLSkge1xuICAgIHZhciBzY29wZSA9IHRoaXMuc2NvcGVTdGFja1tpXTtcbiAgICBpZiAoc2NvcGUuZmxhZ3MgJiAoU0NPUEVfVkFSIHwgU0NPUEVfQ0xBU1NfRklFTERfSU5JVCB8IFNDT1BFX0NMQVNTX1NUQVRJQ19CTE9DSykpIHsgcmV0dXJuIHNjb3BlIH1cbiAgfVxufTtcblxuLy8gQ291bGQgYmUgdXNlZnVsIGZvciBgdGhpc2AsIGBuZXcudGFyZ2V0YCwgYHN1cGVyKClgLCBgc3VwZXIucHJvcGVydHlgLCBhbmQgYHN1cGVyW3Byb3BlcnR5XWAuXG5wcCQzLmN1cnJlbnRUaGlzU2NvcGUgPSBmdW5jdGlvbigpIHtcbiAgZm9yICh2YXIgaSA9IHRoaXMuc2NvcGVTdGFjay5sZW5ndGggLSAxOzsgaS0tKSB7XG4gICAgdmFyIHNjb3BlID0gdGhpcy5zY29wZVN0YWNrW2ldO1xuICAgIGlmIChzY29wZS5mbGFncyAmIChTQ09QRV9WQVIgfCBTQ09QRV9DTEFTU19GSUVMRF9JTklUIHwgU0NPUEVfQ0xBU1NfU1RBVElDX0JMT0NLKSAmJlxuICAgICAgICAhKHNjb3BlLmZsYWdzICYgU0NPUEVfQVJST1cpKSB7IHJldHVybiBzY29wZSB9XG4gIH1cbn07XG5cbnZhciBOb2RlID0gZnVuY3Rpb24gTm9kZShwYXJzZXIsIHBvcywgbG9jKSB7XG4gIHRoaXMudHlwZSA9IFwiXCI7XG4gIHRoaXMuc3RhcnQgPSBwb3M7XG4gIHRoaXMuZW5kID0gMDtcbiAgaWYgKHBhcnNlci5vcHRpb25zLmxvY2F0aW9ucylcbiAgICB7IHRoaXMubG9jID0gbmV3IFNvdXJjZUxvY2F0aW9uKHBhcnNlciwgbG9jKTsgfVxuICBpZiAocGFyc2VyLm9wdGlvbnMuZGlyZWN0U291cmNlRmlsZSlcbiAgICB7IHRoaXMuc291cmNlRmlsZSA9IHBhcnNlci5vcHRpb25zLmRpcmVjdFNvdXJjZUZpbGU7IH1cbiAgaWYgKHBhcnNlci5vcHRpb25zLnJhbmdlcylcbiAgICB7IHRoaXMucmFuZ2UgPSBbcG9zLCAwXTsgfVxufTtcblxuLy8gU3RhcnQgYW4gQVNUIG5vZGUsIGF0dGFjaGluZyBhIHN0YXJ0IG9mZnNldC5cblxudmFyIHBwJDIgPSBQYXJzZXIucHJvdG90eXBlO1xuXG5wcCQyLnN0YXJ0Tm9kZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IE5vZGUodGhpcywgdGhpcy5zdGFydCwgdGhpcy5zdGFydExvYylcbn07XG5cbnBwJDIuc3RhcnROb2RlQXQgPSBmdW5jdGlvbihwb3MsIGxvYykge1xuICByZXR1cm4gbmV3IE5vZGUodGhpcywgcG9zLCBsb2MpXG59O1xuXG4vLyBGaW5pc2ggYW4gQVNUIG5vZGUsIGFkZGluZyBgdHlwZWAgYW5kIGBlbmRgIHByb3BlcnRpZXMuXG5cbmZ1bmN0aW9uIGZpbmlzaE5vZGVBdChub2RlLCB0eXBlLCBwb3MsIGxvYykge1xuICBub2RlLnR5cGUgPSB0eXBlO1xuICBub2RlLmVuZCA9IHBvcztcbiAgaWYgKHRoaXMub3B0aW9ucy5sb2NhdGlvbnMpXG4gICAgeyBub2RlLmxvYy5lbmQgPSBsb2M7IH1cbiAgaWYgKHRoaXMub3B0aW9ucy5yYW5nZXMpXG4gICAgeyBub2RlLnJhbmdlWzFdID0gcG9zOyB9XG4gIHJldHVybiBub2RlXG59XG5cbnBwJDIuZmluaXNoTm9kZSA9IGZ1bmN0aW9uKG5vZGUsIHR5cGUpIHtcbiAgcmV0dXJuIGZpbmlzaE5vZGVBdC5jYWxsKHRoaXMsIG5vZGUsIHR5cGUsIHRoaXMubGFzdFRva0VuZCwgdGhpcy5sYXN0VG9rRW5kTG9jKVxufTtcblxuLy8gRmluaXNoIG5vZGUgYXQgZ2l2ZW4gcG9zaXRpb25cblxucHAkMi5maW5pc2hOb2RlQXQgPSBmdW5jdGlvbihub2RlLCB0eXBlLCBwb3MsIGxvYykge1xuICByZXR1cm4gZmluaXNoTm9kZUF0LmNhbGwodGhpcywgbm9kZSwgdHlwZSwgcG9zLCBsb2MpXG59O1xuXG5wcCQyLmNvcHlOb2RlID0gZnVuY3Rpb24obm9kZSkge1xuICB2YXIgbmV3Tm9kZSA9IG5ldyBOb2RlKHRoaXMsIG5vZGUuc3RhcnQsIHRoaXMuc3RhcnRMb2MpO1xuICBmb3IgKHZhciBwcm9wIGluIG5vZGUpIHsgbmV3Tm9kZVtwcm9wXSA9IG5vZGVbcHJvcF07IH1cbiAgcmV0dXJuIG5ld05vZGVcbn07XG5cbi8vIFRoaXMgZmlsZSB3YXMgZ2VuZXJhdGVkIGJ5IFwiYmluL2dlbmVyYXRlLXVuaWNvZGUtc2NyaXB0LXZhbHVlcy5qc1wiLiBEbyBub3QgbW9kaWZ5IG1hbnVhbGx5IVxudmFyIHNjcmlwdFZhbHVlc0FkZGVkSW5Vbmljb2RlID0gXCJHYXJhIEdhcmF5IEd1a2ggR3VydW5nX0toZW1hIEhya3QgS2F0YWthbmFfT3JfSGlyYWdhbmEgS2F3aSBLaXJhdF9SYWkgS3JhaSBOYWdfTXVuZGFyaSBOYWdtIE9sX09uYWwgT25hbyBTdW51IFN1bnV3YXIgVG9kaHJpIFRvZHIgVHVsdV9UaWdhbGFyaSBUdXRnIFVua25vd24gWnp6elwiO1xuXG4vLyBUaGlzIGZpbGUgY29udGFpbnMgVW5pY29kZSBwcm9wZXJ0aWVzIGV4dHJhY3RlZCBmcm9tIHRoZSBFQ01BU2NyaXB0IHNwZWNpZmljYXRpb24uXG4vLyBUaGUgbGlzdHMgYXJlIGV4dHJhY3RlZCBsaWtlIHNvOlxuLy8gJCQoJyN0YWJsZS1iaW5hcnktdW5pY29kZS1wcm9wZXJ0aWVzID4gZmlndXJlID4gdGFibGUgPiB0Ym9keSA+IHRyID4gdGQ6bnRoLWNoaWxkKDEpIGNvZGUnKS5tYXAoZWwgPT4gZWwuaW5uZXJUZXh0KVxuXG4vLyAjdGFibGUtYmluYXJ5LXVuaWNvZGUtcHJvcGVydGllc1xudmFyIGVjbWE5QmluYXJ5UHJvcGVydGllcyA9IFwiQVNDSUkgQVNDSUlfSGV4X0RpZ2l0IEFIZXggQWxwaGFiZXRpYyBBbHBoYSBBbnkgQXNzaWduZWQgQmlkaV9Db250cm9sIEJpZGlfQyBCaWRpX01pcnJvcmVkIEJpZGlfTSBDYXNlX0lnbm9yYWJsZSBDSSBDYXNlZCBDaGFuZ2VzX1doZW5fQ2FzZWZvbGRlZCBDV0NGIENoYW5nZXNfV2hlbl9DYXNlbWFwcGVkIENXQ00gQ2hhbmdlc19XaGVuX0xvd2VyY2FzZWQgQ1dMIENoYW5nZXNfV2hlbl9ORktDX0Nhc2Vmb2xkZWQgQ1dLQ0YgQ2hhbmdlc19XaGVuX1RpdGxlY2FzZWQgQ1dUIENoYW5nZXNfV2hlbl9VcHBlcmNhc2VkIENXVSBEYXNoIERlZmF1bHRfSWdub3JhYmxlX0NvZGVfUG9pbnQgREkgRGVwcmVjYXRlZCBEZXAgRGlhY3JpdGljIERpYSBFbW9qaSBFbW9qaV9Db21wb25lbnQgRW1vamlfTW9kaWZpZXIgRW1vamlfTW9kaWZpZXJfQmFzZSBFbW9qaV9QcmVzZW50YXRpb24gRXh0ZW5kZXIgRXh0IEdyYXBoZW1lX0Jhc2UgR3JfQmFzZSBHcmFwaGVtZV9FeHRlbmQgR3JfRXh0IEhleF9EaWdpdCBIZXggSURTX0JpbmFyeV9PcGVyYXRvciBJRFNCIElEU19UcmluYXJ5X09wZXJhdG9yIElEU1QgSURfQ29udGludWUgSURDIElEX1N0YXJ0IElEUyBJZGVvZ3JhcGhpYyBJZGVvIEpvaW5fQ29udHJvbCBKb2luX0MgTG9naWNhbF9PcmRlcl9FeGNlcHRpb24gTE9FIExvd2VyY2FzZSBMb3dlciBNYXRoIE5vbmNoYXJhY3Rlcl9Db2RlX1BvaW50IE5DaGFyIFBhdHRlcm5fU3ludGF4IFBhdF9TeW4gUGF0dGVybl9XaGl0ZV9TcGFjZSBQYXRfV1MgUXVvdGF0aW9uX01hcmsgUU1hcmsgUmFkaWNhbCBSZWdpb25hbF9JbmRpY2F0b3IgUkkgU2VudGVuY2VfVGVybWluYWwgU1Rlcm0gU29mdF9Eb3R0ZWQgU0QgVGVybWluYWxfUHVuY3R1YXRpb24gVGVybSBVbmlmaWVkX0lkZW9ncmFwaCBVSWRlbyBVcHBlcmNhc2UgVXBwZXIgVmFyaWF0aW9uX1NlbGVjdG9yIFZTIFdoaXRlX1NwYWNlIHNwYWNlIFhJRF9Db250aW51ZSBYSURDIFhJRF9TdGFydCBYSURTXCI7XG52YXIgZWNtYTEwQmluYXJ5UHJvcGVydGllcyA9IGVjbWE5QmluYXJ5UHJvcGVydGllcyArIFwiIEV4dGVuZGVkX1BpY3RvZ3JhcGhpY1wiO1xudmFyIGVjbWExMUJpbmFyeVByb3BlcnRpZXMgPSBlY21hMTBCaW5hcnlQcm9wZXJ0aWVzO1xudmFyIGVjbWExMkJpbmFyeVByb3BlcnRpZXMgPSBlY21hMTFCaW5hcnlQcm9wZXJ0aWVzICsgXCIgRUJhc2UgRUNvbXAgRU1vZCBFUHJlcyBFeHRQaWN0XCI7XG52YXIgZWNtYTEzQmluYXJ5UHJvcGVydGllcyA9IGVjbWExMkJpbmFyeVByb3BlcnRpZXM7XG52YXIgZWNtYTE0QmluYXJ5UHJvcGVydGllcyA9IGVjbWExM0JpbmFyeVByb3BlcnRpZXM7XG5cbnZhciB1bmljb2RlQmluYXJ5UHJvcGVydGllcyA9IHtcbiAgOTogZWNtYTlCaW5hcnlQcm9wZXJ0aWVzLFxuICAxMDogZWNtYTEwQmluYXJ5UHJvcGVydGllcyxcbiAgMTE6IGVjbWExMUJpbmFyeVByb3BlcnRpZXMsXG4gIDEyOiBlY21hMTJCaW5hcnlQcm9wZXJ0aWVzLFxuICAxMzogZWNtYTEzQmluYXJ5UHJvcGVydGllcyxcbiAgMTQ6IGVjbWExNEJpbmFyeVByb3BlcnRpZXNcbn07XG5cbi8vICN0YWJsZS1iaW5hcnktdW5pY29kZS1wcm9wZXJ0aWVzLW9mLXN0cmluZ3NcbnZhciBlY21hMTRCaW5hcnlQcm9wZXJ0aWVzT2ZTdHJpbmdzID0gXCJCYXNpY19FbW9qaSBFbW9qaV9LZXljYXBfU2VxdWVuY2UgUkdJX0Vtb2ppX01vZGlmaWVyX1NlcXVlbmNlIFJHSV9FbW9qaV9GbGFnX1NlcXVlbmNlIFJHSV9FbW9qaV9UYWdfU2VxdWVuY2UgUkdJX0Vtb2ppX1pXSl9TZXF1ZW5jZSBSR0lfRW1vamlcIjtcblxudmFyIHVuaWNvZGVCaW5hcnlQcm9wZXJ0aWVzT2ZTdHJpbmdzID0ge1xuICA5OiBcIlwiLFxuICAxMDogXCJcIixcbiAgMTE6IFwiXCIsXG4gIDEyOiBcIlwiLFxuICAxMzogXCJcIixcbiAgMTQ6IGVjbWExNEJpbmFyeVByb3BlcnRpZXNPZlN0cmluZ3Ncbn07XG5cbi8vICN0YWJsZS11bmljb2RlLWdlbmVyYWwtY2F0ZWdvcnktdmFsdWVzXG52YXIgdW5pY29kZUdlbmVyYWxDYXRlZ29yeVZhbHVlcyA9IFwiQ2FzZWRfTGV0dGVyIExDIENsb3NlX1B1bmN0dWF0aW9uIFBlIENvbm5lY3Rvcl9QdW5jdHVhdGlvbiBQYyBDb250cm9sIENjIGNudHJsIEN1cnJlbmN5X1N5bWJvbCBTYyBEYXNoX1B1bmN0dWF0aW9uIFBkIERlY2ltYWxfTnVtYmVyIE5kIGRpZ2l0IEVuY2xvc2luZ19NYXJrIE1lIEZpbmFsX1B1bmN0dWF0aW9uIFBmIEZvcm1hdCBDZiBJbml0aWFsX1B1bmN0dWF0aW9uIFBpIExldHRlciBMIExldHRlcl9OdW1iZXIgTmwgTGluZV9TZXBhcmF0b3IgWmwgTG93ZXJjYXNlX0xldHRlciBMbCBNYXJrIE0gQ29tYmluaW5nX01hcmsgTWF0aF9TeW1ib2wgU20gTW9kaWZpZXJfTGV0dGVyIExtIE1vZGlmaWVyX1N5bWJvbCBTayBOb25zcGFjaW5nX01hcmsgTW4gTnVtYmVyIE4gT3Blbl9QdW5jdHVhdGlvbiBQcyBPdGhlciBDIE90aGVyX0xldHRlciBMbyBPdGhlcl9OdW1iZXIgTm8gT3RoZXJfUHVuY3R1YXRpb24gUG8gT3RoZXJfU3ltYm9sIFNvIFBhcmFncmFwaF9TZXBhcmF0b3IgWnAgUHJpdmF0ZV9Vc2UgQ28gUHVuY3R1YXRpb24gUCBwdW5jdCBTZXBhcmF0b3IgWiBTcGFjZV9TZXBhcmF0b3IgWnMgU3BhY2luZ19NYXJrIE1jIFN1cnJvZ2F0ZSBDcyBTeW1ib2wgUyBUaXRsZWNhc2VfTGV0dGVyIEx0IFVuYXNzaWduZWQgQ24gVXBwZXJjYXNlX0xldHRlciBMdVwiO1xuXG4vLyAjdGFibGUtdW5pY29kZS1zY3JpcHQtdmFsdWVzXG52YXIgZWNtYTlTY3JpcHRWYWx1ZXMgPSBcIkFkbGFtIEFkbG0gQWhvbSBBbmF0b2xpYW5fSGllcm9nbHlwaHMgSGx1dyBBcmFiaWMgQXJhYiBBcm1lbmlhbiBBcm1uIEF2ZXN0YW4gQXZzdCBCYWxpbmVzZSBCYWxpIEJhbXVtIEJhbXUgQmFzc2FfVmFoIEJhc3MgQmF0YWsgQmF0ayBCZW5nYWxpIEJlbmcgQmhhaWtzdWtpIEJoa3MgQm9wb21vZm8gQm9wbyBCcmFobWkgQnJhaCBCcmFpbGxlIEJyYWkgQnVnaW5lc2UgQnVnaSBCdWhpZCBCdWhkIENhbmFkaWFuX0Fib3JpZ2luYWwgQ2FucyBDYXJpYW4gQ2FyaSBDYXVjYXNpYW5fQWxiYW5pYW4gQWdoYiBDaGFrbWEgQ2FrbSBDaGFtIENoYW0gQ2hlcm9rZWUgQ2hlciBDb21tb24gWnl5eSBDb3B0aWMgQ29wdCBRYWFjIEN1bmVpZm9ybSBYc3V4IEN5cHJpb3QgQ3BydCBDeXJpbGxpYyBDeXJsIERlc2VyZXQgRHNydCBEZXZhbmFnYXJpIERldmEgRHVwbG95YW4gRHVwbCBFZ3lwdGlhbl9IaWVyb2dseXBocyBFZ3lwIEVsYmFzYW4gRWxiYSBFdGhpb3BpYyBFdGhpIEdlb3JnaWFuIEdlb3IgR2xhZ29saXRpYyBHbGFnIEdvdGhpYyBHb3RoIEdyYW50aGEgR3JhbiBHcmVlayBHcmVrIEd1amFyYXRpIEd1anIgR3VybXVraGkgR3VydSBIYW4gSGFuaSBIYW5ndWwgSGFuZyBIYW51bm9vIEhhbm8gSGF0cmFuIEhhdHIgSGVicmV3IEhlYnIgSGlyYWdhbmEgSGlyYSBJbXBlcmlhbF9BcmFtYWljIEFybWkgSW5oZXJpdGVkIFppbmggUWFhaSBJbnNjcmlwdGlvbmFsX1BhaGxhdmkgUGhsaSBJbnNjcmlwdGlvbmFsX1BhcnRoaWFuIFBydGkgSmF2YW5lc2UgSmF2YSBLYWl0aGkgS3RoaSBLYW5uYWRhIEtuZGEgS2F0YWthbmEgS2FuYSBLYXlhaF9MaSBLYWxpIEtoYXJvc2h0aGkgS2hhciBLaG1lciBLaG1yIEtob2praSBLaG9qIEtodWRhd2FkaSBTaW5kIExhbyBMYW9vIExhdGluIExhdG4gTGVwY2hhIExlcGMgTGltYnUgTGltYiBMaW5lYXJfQSBMaW5hIExpbmVhcl9CIExpbmIgTGlzdSBMaXN1IEx5Y2lhbiBMeWNpIEx5ZGlhbiBMeWRpIE1haGFqYW5pIE1haGogTWFsYXlhbGFtIE1seW0gTWFuZGFpYyBNYW5kIE1hbmljaGFlYW4gTWFuaSBNYXJjaGVuIE1hcmMgTWFzYXJhbV9Hb25kaSBHb25tIE1lZXRlaV9NYXllayBNdGVpIE1lbmRlX0tpa2FrdWkgTWVuZCBNZXJvaXRpY19DdXJzaXZlIE1lcmMgTWVyb2l0aWNfSGllcm9nbHlwaHMgTWVybyBNaWFvIFBscmQgTW9kaSBNb25nb2xpYW4gTW9uZyBNcm8gTXJvbyBNdWx0YW5pIE11bHQgTXlhbm1hciBNeW1yIE5hYmF0YWVhbiBOYmF0IE5ld19UYWlfTHVlIFRhbHUgTmV3YSBOZXdhIE5rbyBOa29vIE51c2h1IE5zaHUgT2doYW0gT2dhbSBPbF9DaGlraSBPbGNrIE9sZF9IdW5nYXJpYW4gSHVuZyBPbGRfSXRhbGljIEl0YWwgT2xkX05vcnRoX0FyYWJpYW4gTmFyYiBPbGRfUGVybWljIFBlcm0gT2xkX1BlcnNpYW4gWHBlbyBPbGRfU291dGhfQXJhYmlhbiBTYXJiIE9sZF9UdXJraWMgT3JraCBPcml5YSBPcnlhIE9zYWdlIE9zZ2UgT3NtYW55YSBPc21hIFBhaGF3aF9IbW9uZyBIbW5nIFBhbG15cmVuZSBQYWxtIFBhdV9DaW5fSGF1IFBhdWMgUGhhZ3NfUGEgUGhhZyBQaG9lbmljaWFuIFBobnggUHNhbHRlcl9QYWhsYXZpIFBobHAgUmVqYW5nIFJqbmcgUnVuaWMgUnVuciBTYW1hcml0YW4gU2FtciBTYXVyYXNodHJhIFNhdXIgU2hhcmFkYSBTaHJkIFNoYXZpYW4gU2hhdyBTaWRkaGFtIFNpZGQgU2lnbldyaXRpbmcgU2dudyBTaW5oYWxhIFNpbmggU29yYV9Tb21wZW5nIFNvcmEgU295b21ibyBTb3lvIFN1bmRhbmVzZSBTdW5kIFN5bG90aV9OYWdyaSBTeWxvIFN5cmlhYyBTeXJjIFRhZ2Fsb2cgVGdsZyBUYWdiYW53YSBUYWdiIFRhaV9MZSBUYWxlIFRhaV9UaGFtIExhbmEgVGFpX1ZpZXQgVGF2dCBUYWtyaSBUYWtyIFRhbWlsIFRhbWwgVGFuZ3V0IFRhbmcgVGVsdWd1IFRlbHUgVGhhYW5hIFRoYWEgVGhhaSBUaGFpIFRpYmV0YW4gVGlidCBUaWZpbmFnaCBUZm5nIFRpcmh1dGEgVGlyaCBVZ2FyaXRpYyBVZ2FyIFZhaSBWYWlpIFdhcmFuZ19DaXRpIFdhcmEgWWkgWWlpaSBaYW5hYmF6YXJfU3F1YXJlIFphbmJcIjtcbnZhciBlY21hMTBTY3JpcHRWYWx1ZXMgPSBlY21hOVNjcmlwdFZhbHVlcyArIFwiIERvZ3JhIERvZ3IgR3VuamFsYV9Hb25kaSBHb25nIEhhbmlmaV9Sb2hpbmd5YSBSb2hnIE1ha2FzYXIgTWFrYSBNZWRlZmFpZHJpbiBNZWRmIE9sZF9Tb2dkaWFuIFNvZ28gU29nZGlhbiBTb2dkXCI7XG52YXIgZWNtYTExU2NyaXB0VmFsdWVzID0gZWNtYTEwU2NyaXB0VmFsdWVzICsgXCIgRWx5bWFpYyBFbHltIE5hbmRpbmFnYXJpIE5hbmQgTnlpYWtlbmdfUHVhY2h1ZV9IbW9uZyBIbW5wIFdhbmNobyBXY2hvXCI7XG52YXIgZWNtYTEyU2NyaXB0VmFsdWVzID0gZWNtYTExU2NyaXB0VmFsdWVzICsgXCIgQ2hvcmFzbWlhbiBDaHJzIERpYWsgRGl2ZXNfQWt1cnUgS2hpdGFuX1NtYWxsX1NjcmlwdCBLaXRzIFllemkgWWV6aWRpXCI7XG52YXIgZWNtYTEzU2NyaXB0VmFsdWVzID0gZWNtYTEyU2NyaXB0VmFsdWVzICsgXCIgQ3lwcm9fTWlub2FuIENwbW4gT2xkX1V5Z2h1ciBPdWdyIFRhbmdzYSBUbnNhIFRvdG8gVml0aGt1cWkgVml0aFwiO1xudmFyIGVjbWExNFNjcmlwdFZhbHVlcyA9IGVjbWExM1NjcmlwdFZhbHVlcyArIFwiIFwiICsgc2NyaXB0VmFsdWVzQWRkZWRJblVuaWNvZGU7XG5cbnZhciB1bmljb2RlU2NyaXB0VmFsdWVzID0ge1xuICA5OiBlY21hOVNjcmlwdFZhbHVlcyxcbiAgMTA6IGVjbWExMFNjcmlwdFZhbHVlcyxcbiAgMTE6IGVjbWExMVNjcmlwdFZhbHVlcyxcbiAgMTI6IGVjbWExMlNjcmlwdFZhbHVlcyxcbiAgMTM6IGVjbWExM1NjcmlwdFZhbHVlcyxcbiAgMTQ6IGVjbWExNFNjcmlwdFZhbHVlc1xufTtcblxudmFyIGRhdGEgPSB7fTtcbmZ1bmN0aW9uIGJ1aWxkVW5pY29kZURhdGEoZWNtYVZlcnNpb24pIHtcbiAgdmFyIGQgPSBkYXRhW2VjbWFWZXJzaW9uXSA9IHtcbiAgICBiaW5hcnk6IHdvcmRzUmVnZXhwKHVuaWNvZGVCaW5hcnlQcm9wZXJ0aWVzW2VjbWFWZXJzaW9uXSArIFwiIFwiICsgdW5pY29kZUdlbmVyYWxDYXRlZ29yeVZhbHVlcyksXG4gICAgYmluYXJ5T2ZTdHJpbmdzOiB3b3Jkc1JlZ2V4cCh1bmljb2RlQmluYXJ5UHJvcGVydGllc09mU3RyaW5nc1tlY21hVmVyc2lvbl0pLFxuICAgIG5vbkJpbmFyeToge1xuICAgICAgR2VuZXJhbF9DYXRlZ29yeTogd29yZHNSZWdleHAodW5pY29kZUdlbmVyYWxDYXRlZ29yeVZhbHVlcyksXG4gICAgICBTY3JpcHQ6IHdvcmRzUmVnZXhwKHVuaWNvZGVTY3JpcHRWYWx1ZXNbZWNtYVZlcnNpb25dKVxuICAgIH1cbiAgfTtcbiAgZC5ub25CaW5hcnkuU2NyaXB0X0V4dGVuc2lvbnMgPSBkLm5vbkJpbmFyeS5TY3JpcHQ7XG5cbiAgZC5ub25CaW5hcnkuZ2MgPSBkLm5vbkJpbmFyeS5HZW5lcmFsX0NhdGVnb3J5O1xuICBkLm5vbkJpbmFyeS5zYyA9IGQubm9uQmluYXJ5LlNjcmlwdDtcbiAgZC5ub25CaW5hcnkuc2N4ID0gZC5ub25CaW5hcnkuU2NyaXB0X0V4dGVuc2lvbnM7XG59XG5cbmZvciAodmFyIGkgPSAwLCBsaXN0ID0gWzksIDEwLCAxMSwgMTIsIDEzLCAxNF07IGkgPCBsaXN0Lmxlbmd0aDsgaSArPSAxKSB7XG4gIHZhciBlY21hVmVyc2lvbiA9IGxpc3RbaV07XG5cbiAgYnVpbGRVbmljb2RlRGF0YShlY21hVmVyc2lvbik7XG59XG5cbnZhciBwcCQxID0gUGFyc2VyLnByb3RvdHlwZTtcblxuLy8gVHJhY2sgZGlzanVuY3Rpb24gc3RydWN0dXJlIHRvIGRldGVybWluZSB3aGV0aGVyIGEgZHVwbGljYXRlXG4vLyBjYXB0dXJlIGdyb3VwIG5hbWUgaXMgYWxsb3dlZCBiZWNhdXNlIGl0IGlzIGluIGEgc2VwYXJhdGUgYnJhbmNoLlxudmFyIEJyYW5jaElEID0gZnVuY3Rpb24gQnJhbmNoSUQocGFyZW50LCBiYXNlKSB7XG4gIC8vIFBhcmVudCBkaXNqdW5jdGlvbiBicmFuY2hcbiAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gIC8vIElkZW50aWZpZXMgdGhpcyBzZXQgb2Ygc2libGluZyBicmFuY2hlc1xuICB0aGlzLmJhc2UgPSBiYXNlIHx8IHRoaXM7XG59O1xuXG5CcmFuY2hJRC5wcm90b3R5cGUuc2VwYXJhdGVkRnJvbSA9IGZ1bmN0aW9uIHNlcGFyYXRlZEZyb20gKGFsdCkge1xuICAvLyBBIGJyYW5jaCBpcyBzZXBhcmF0ZSBmcm9tIGFub3RoZXIgYnJhbmNoIGlmIHRoZXkgb3IgYW55IG9mXG4gIC8vIHRoZWlyIHBhcmVudHMgYXJlIHNpYmxpbmdzIGluIGEgZ2l2ZW4gZGlzanVuY3Rpb25cbiAgZm9yICh2YXIgc2VsZiA9IHRoaXM7IHNlbGY7IHNlbGYgPSBzZWxmLnBhcmVudCkge1xuICAgIGZvciAodmFyIG90aGVyID0gYWx0OyBvdGhlcjsgb3RoZXIgPSBvdGhlci5wYXJlbnQpIHtcbiAgICAgIGlmIChzZWxmLmJhc2UgPT09IG90aGVyLmJhc2UgJiYgc2VsZiAhPT0gb3RoZXIpIHsgcmV0dXJuIHRydWUgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn07XG5cbkJyYW5jaElELnByb3RvdHlwZS5zaWJsaW5nID0gZnVuY3Rpb24gc2libGluZyAoKSB7XG4gIHJldHVybiBuZXcgQnJhbmNoSUQodGhpcy5wYXJlbnQsIHRoaXMuYmFzZSlcbn07XG5cbnZhciBSZWdFeHBWYWxpZGF0aW9uU3RhdGUgPSBmdW5jdGlvbiBSZWdFeHBWYWxpZGF0aW9uU3RhdGUocGFyc2VyKSB7XG4gIHRoaXMucGFyc2VyID0gcGFyc2VyO1xuICB0aGlzLnZhbGlkRmxhZ3MgPSBcImdpbVwiICsgKHBhcnNlci5vcHRpb25zLmVjbWFWZXJzaW9uID49IDYgPyBcInV5XCIgOiBcIlwiKSArIChwYXJzZXIub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA5ID8gXCJzXCIgOiBcIlwiKSArIChwYXJzZXIub3B0aW9ucy5lY21hVmVyc2lvbiA+PSAxMyA/IFwiZFwiIDogXCJcIikgKyAocGFyc2VyLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTUgPyBcInZcIiA6IFwiXCIpO1xuICB0aGlzLnVuaWNvZGVQcm9wZXJ0aWVzID0gZGF0YVtwYXJzZXIub3B0aW9ucy5lY21hVmVyc2lvbiA+PSAxNCA/IDE0IDogcGFyc2VyLm9wdGlvbnMuZWNtYVZlcnNpb25dO1xuICB0aGlzLnNvdXJjZSA9IFwiXCI7XG4gIHRoaXMuZmxhZ3MgPSBcIlwiO1xuICB0aGlzLnN0YXJ0ID0gMDtcbiAgdGhpcy5zd2l0Y2hVID0gZmFsc2U7XG4gIHRoaXMuc3dpdGNoViA9IGZhbHNlO1xuICB0aGlzLnN3aXRjaE4gPSBmYWxzZTtcbiAgdGhpcy5wb3MgPSAwO1xuICB0aGlzLmxhc3RJbnRWYWx1ZSA9IDA7XG4gIHRoaXMubGFzdFN0cmluZ1ZhbHVlID0gXCJcIjtcbiAgdGhpcy5sYXN0QXNzZXJ0aW9uSXNRdWFudGlmaWFibGUgPSBmYWxzZTtcbiAgdGhpcy5udW1DYXB0dXJpbmdQYXJlbnMgPSAwO1xuICB0aGlzLm1heEJhY2tSZWZlcmVuY2UgPSAwO1xuICB0aGlzLmdyb3VwTmFtZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICB0aGlzLmJhY2tSZWZlcmVuY2VOYW1lcyA9IFtdO1xuICB0aGlzLmJyYW5jaElEID0gbnVsbDtcbn07XG5cblJlZ0V4cFZhbGlkYXRpb25TdGF0ZS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiByZXNldCAoc3RhcnQsIHBhdHRlcm4sIGZsYWdzKSB7XG4gIHZhciB1bmljb2RlU2V0cyA9IGZsYWdzLmluZGV4T2YoXCJ2XCIpICE9PSAtMTtcbiAgdmFyIHVuaWNvZGUgPSBmbGFncy5pbmRleE9mKFwidVwiKSAhPT0gLTE7XG4gIHRoaXMuc3RhcnQgPSBzdGFydCB8IDA7XG4gIHRoaXMuc291cmNlID0gcGF0dGVybiArIFwiXCI7XG4gIHRoaXMuZmxhZ3MgPSBmbGFncztcbiAgaWYgKHVuaWNvZGVTZXRzICYmIHRoaXMucGFyc2VyLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTUpIHtcbiAgICB0aGlzLnN3aXRjaFUgPSB0cnVlO1xuICAgIHRoaXMuc3dpdGNoViA9IHRydWU7XG4gICAgdGhpcy5zd2l0Y2hOID0gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnN3aXRjaFUgPSB1bmljb2RlICYmIHRoaXMucGFyc2VyLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNjtcbiAgICB0aGlzLnN3aXRjaFYgPSBmYWxzZTtcbiAgICB0aGlzLnN3aXRjaE4gPSB1bmljb2RlICYmIHRoaXMucGFyc2VyLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOTtcbiAgfVxufTtcblxuUmVnRXhwVmFsaWRhdGlvblN0YXRlLnByb3RvdHlwZS5yYWlzZSA9IGZ1bmN0aW9uIHJhaXNlIChtZXNzYWdlKSB7XG4gIHRoaXMucGFyc2VyLnJhaXNlUmVjb3ZlcmFibGUodGhpcy5zdGFydCwgKFwiSW52YWxpZCByZWd1bGFyIGV4cHJlc3Npb246IC9cIiArICh0aGlzLnNvdXJjZSkgKyBcIi86IFwiICsgbWVzc2FnZSkpO1xufTtcblxuLy8gSWYgdSBmbGFnIGlzIGdpdmVuLCB0aGlzIHJldHVybnMgdGhlIGNvZGUgcG9pbnQgYXQgdGhlIGluZGV4IChpdCBjb21iaW5lcyBhIHN1cnJvZ2F0ZSBwYWlyKS5cbi8vIE90aGVyd2lzZSwgdGhpcyByZXR1cm5zIHRoZSBjb2RlIHVuaXQgb2YgdGhlIGluZGV4IChjYW4gYmUgYSBwYXJ0IG9mIGEgc3Vycm9nYXRlIHBhaXIpLlxuUmVnRXhwVmFsaWRhdGlvblN0YXRlLnByb3RvdHlwZS5hdCA9IGZ1bmN0aW9uIGF0IChpLCBmb3JjZVUpIHtcbiAgICBpZiAoIGZvcmNlVSA9PT0gdm9pZCAwICkgZm9yY2VVID0gZmFsc2U7XG5cbiAgdmFyIHMgPSB0aGlzLnNvdXJjZTtcbiAgdmFyIGwgPSBzLmxlbmd0aDtcbiAgaWYgKGkgPj0gbCkge1xuICAgIHJldHVybiAtMVxuICB9XG4gIHZhciBjID0gcy5jaGFyQ29kZUF0KGkpO1xuICBpZiAoIShmb3JjZVUgfHwgdGhpcy5zd2l0Y2hVKSB8fCBjIDw9IDB4RDdGRiB8fCBjID49IDB4RTAwMCB8fCBpICsgMSA+PSBsKSB7XG4gICAgcmV0dXJuIGNcbiAgfVxuICB2YXIgbmV4dCA9IHMuY2hhckNvZGVBdChpICsgMSk7XG4gIHJldHVybiBuZXh0ID49IDB4REMwMCAmJiBuZXh0IDw9IDB4REZGRiA/IChjIDw8IDEwKSArIG5leHQgLSAweDM1RkRDMDAgOiBjXG59O1xuXG5SZWdFeHBWYWxpZGF0aW9uU3RhdGUucHJvdG90eXBlLm5leHRJbmRleCA9IGZ1bmN0aW9uIG5leHRJbmRleCAoaSwgZm9yY2VVKSB7XG4gICAgaWYgKCBmb3JjZVUgPT09IHZvaWQgMCApIGZvcmNlVSA9IGZhbHNlO1xuXG4gIHZhciBzID0gdGhpcy5zb3VyY2U7XG4gIHZhciBsID0gcy5sZW5ndGg7XG4gIGlmIChpID49IGwpIHtcbiAgICByZXR1cm4gbFxuICB9XG4gIHZhciBjID0gcy5jaGFyQ29kZUF0KGkpLCBuZXh0O1xuICBpZiAoIShmb3JjZVUgfHwgdGhpcy5zd2l0Y2hVKSB8fCBjIDw9IDB4RDdGRiB8fCBjID49IDB4RTAwMCB8fCBpICsgMSA+PSBsIHx8XG4gICAgICAobmV4dCA9IHMuY2hhckNvZGVBdChpICsgMSkpIDwgMHhEQzAwIHx8IG5leHQgPiAweERGRkYpIHtcbiAgICByZXR1cm4gaSArIDFcbiAgfVxuICByZXR1cm4gaSArIDJcbn07XG5cblJlZ0V4cFZhbGlkYXRpb25TdGF0ZS5wcm90b3R5cGUuY3VycmVudCA9IGZ1bmN0aW9uIGN1cnJlbnQgKGZvcmNlVSkge1xuICAgIGlmICggZm9yY2VVID09PSB2b2lkIDAgKSBmb3JjZVUgPSBmYWxzZTtcblxuICByZXR1cm4gdGhpcy5hdCh0aGlzLnBvcywgZm9yY2VVKVxufTtcblxuUmVnRXhwVmFsaWRhdGlvblN0YXRlLnByb3RvdHlwZS5sb29rYWhlYWQgPSBmdW5jdGlvbiBsb29rYWhlYWQgKGZvcmNlVSkge1xuICAgIGlmICggZm9yY2VVID09PSB2b2lkIDAgKSBmb3JjZVUgPSBmYWxzZTtcblxuICByZXR1cm4gdGhpcy5hdCh0aGlzLm5leHRJbmRleCh0aGlzLnBvcywgZm9yY2VVKSwgZm9yY2VVKVxufTtcblxuUmVnRXhwVmFsaWRhdGlvblN0YXRlLnByb3RvdHlwZS5hZHZhbmNlID0gZnVuY3Rpb24gYWR2YW5jZSAoZm9yY2VVKSB7XG4gICAgaWYgKCBmb3JjZVUgPT09IHZvaWQgMCApIGZvcmNlVSA9IGZhbHNlO1xuXG4gIHRoaXMucG9zID0gdGhpcy5uZXh0SW5kZXgodGhpcy5wb3MsIGZvcmNlVSk7XG59O1xuXG5SZWdFeHBWYWxpZGF0aW9uU3RhdGUucHJvdG90eXBlLmVhdCA9IGZ1bmN0aW9uIGVhdCAoY2gsIGZvcmNlVSkge1xuICAgIGlmICggZm9yY2VVID09PSB2b2lkIDAgKSBmb3JjZVUgPSBmYWxzZTtcblxuICBpZiAodGhpcy5jdXJyZW50KGZvcmNlVSkgPT09IGNoKSB7XG4gICAgdGhpcy5hZHZhbmNlKGZvcmNlVSk7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn07XG5cblJlZ0V4cFZhbGlkYXRpb25TdGF0ZS5wcm90b3R5cGUuZWF0Q2hhcnMgPSBmdW5jdGlvbiBlYXRDaGFycyAoY2hzLCBmb3JjZVUpIHtcbiAgICBpZiAoIGZvcmNlVSA9PT0gdm9pZCAwICkgZm9yY2VVID0gZmFsc2U7XG5cbiAgdmFyIHBvcyA9IHRoaXMucG9zO1xuICBmb3IgKHZhciBpID0gMCwgbGlzdCA9IGNoczsgaSA8IGxpc3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICB2YXIgY2ggPSBsaXN0W2ldO1xuXG4gICAgICB2YXIgY3VycmVudCA9IHRoaXMuYXQocG9zLCBmb3JjZVUpO1xuICAgIGlmIChjdXJyZW50ID09PSAtMSB8fCBjdXJyZW50ICE9PSBjaCkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIHBvcyA9IHRoaXMubmV4dEluZGV4KHBvcywgZm9yY2VVKTtcbiAgfVxuICB0aGlzLnBvcyA9IHBvcztcbiAgcmV0dXJuIHRydWVcbn07XG5cbi8qKlxuICogVmFsaWRhdGUgdGhlIGZsYWdzIHBhcnQgb2YgYSBnaXZlbiBSZWdFeHBMaXRlcmFsLlxuICpcbiAqIEBwYXJhbSB7UmVnRXhwVmFsaWRhdGlvblN0YXRlfSBzdGF0ZSBUaGUgc3RhdGUgdG8gdmFsaWRhdGUgUmVnRXhwLlxuICogQHJldHVybnMge3ZvaWR9XG4gKi9cbnBwJDEudmFsaWRhdGVSZWdFeHBGbGFncyA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciB2YWxpZEZsYWdzID0gc3RhdGUudmFsaWRGbGFncztcbiAgdmFyIGZsYWdzID0gc3RhdGUuZmxhZ3M7XG5cbiAgdmFyIHUgPSBmYWxzZTtcbiAgdmFyIHYgPSBmYWxzZTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGZsYWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGZsYWcgPSBmbGFncy5jaGFyQXQoaSk7XG4gICAgaWYgKHZhbGlkRmxhZ3MuaW5kZXhPZihmbGFnKSA9PT0gLTEpIHtcbiAgICAgIHRoaXMucmFpc2Uoc3RhdGUuc3RhcnQsIFwiSW52YWxpZCByZWd1bGFyIGV4cHJlc3Npb24gZmxhZ1wiKTtcbiAgICB9XG4gICAgaWYgKGZsYWdzLmluZGV4T2YoZmxhZywgaSArIDEpID4gLTEpIHtcbiAgICAgIHRoaXMucmFpc2Uoc3RhdGUuc3RhcnQsIFwiRHVwbGljYXRlIHJlZ3VsYXIgZXhwcmVzc2lvbiBmbGFnXCIpO1xuICAgIH1cbiAgICBpZiAoZmxhZyA9PT0gXCJ1XCIpIHsgdSA9IHRydWU7IH1cbiAgICBpZiAoZmxhZyA9PT0gXCJ2XCIpIHsgdiA9IHRydWU7IH1cbiAgfVxuICBpZiAodGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDE1ICYmIHUgJiYgdikge1xuICAgIHRoaXMucmFpc2Uoc3RhdGUuc3RhcnQsIFwiSW52YWxpZCByZWd1bGFyIGV4cHJlc3Npb24gZmxhZ1wiKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gaGFzUHJvcChvYmopIHtcbiAgZm9yICh2YXIgXyBpbiBvYmopIHsgcmV0dXJuIHRydWUgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSB0aGUgcGF0dGVybiBwYXJ0IG9mIGEgZ2l2ZW4gUmVnRXhwTGl0ZXJhbC5cbiAqXG4gKiBAcGFyYW0ge1JlZ0V4cFZhbGlkYXRpb25TdGF0ZX0gc3RhdGUgVGhlIHN0YXRlIHRvIHZhbGlkYXRlIFJlZ0V4cC5cbiAqIEByZXR1cm5zIHt2b2lkfVxuICovXG5wcCQxLnZhbGlkYXRlUmVnRXhwUGF0dGVybiA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHRoaXMucmVnZXhwX3BhdHRlcm4oc3RhdGUpO1xuXG4gIC8vIFRoZSBnb2FsIHN5bWJvbCBmb3IgdGhlIHBhcnNlIGlzIHxQYXR0ZXJuW35VLCB+Tl18LiBJZiB0aGUgcmVzdWx0IG9mXG4gIC8vIHBhcnNpbmcgY29udGFpbnMgYSB8R3JvdXBOYW1lfCwgcmVwYXJzZSB3aXRoIHRoZSBnb2FsIHN5bWJvbFxuICAvLyB8UGF0dGVyblt+VSwgK05dfCBhbmQgdXNlIHRoaXMgcmVzdWx0IGluc3RlYWQuIFRocm93IGEgKlN5bnRheEVycm9yKlxuICAvLyBleGNlcHRpb24gaWYgX1BfIGRpZCBub3QgY29uZm9ybSB0byB0aGUgZ3JhbW1hciwgaWYgYW55IGVsZW1lbnRzIG9mIF9QX1xuICAvLyB3ZXJlIG5vdCBtYXRjaGVkIGJ5IHRoZSBwYXJzZSwgb3IgaWYgYW55IEVhcmx5IEVycm9yIGNvbmRpdGlvbnMgZXhpc3QuXG4gIGlmICghc3RhdGUuc3dpdGNoTiAmJiB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOSAmJiBoYXNQcm9wKHN0YXRlLmdyb3VwTmFtZXMpKSB7XG4gICAgc3RhdGUuc3dpdGNoTiA9IHRydWU7XG4gICAgdGhpcy5yZWdleHBfcGF0dGVybihzdGF0ZSk7XG4gIH1cbn07XG5cbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLVBhdHRlcm5cbnBwJDEucmVnZXhwX3BhdHRlcm4gPSBmdW5jdGlvbihzdGF0ZSkge1xuICBzdGF0ZS5wb3MgPSAwO1xuICBzdGF0ZS5sYXN0SW50VmFsdWUgPSAwO1xuICBzdGF0ZS5sYXN0U3RyaW5nVmFsdWUgPSBcIlwiO1xuICBzdGF0ZS5sYXN0QXNzZXJ0aW9uSXNRdWFudGlmaWFibGUgPSBmYWxzZTtcbiAgc3RhdGUubnVtQ2FwdHVyaW5nUGFyZW5zID0gMDtcbiAgc3RhdGUubWF4QmFja1JlZmVyZW5jZSA9IDA7XG4gIHN0YXRlLmdyb3VwTmFtZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBzdGF0ZS5iYWNrUmVmZXJlbmNlTmFtZXMubGVuZ3RoID0gMDtcbiAgc3RhdGUuYnJhbmNoSUQgPSBudWxsO1xuXG4gIHRoaXMucmVnZXhwX2Rpc2p1bmN0aW9uKHN0YXRlKTtcblxuICBpZiAoc3RhdGUucG9zICE9PSBzdGF0ZS5zb3VyY2UubGVuZ3RoKSB7XG4gICAgLy8gTWFrZSB0aGUgc2FtZSBtZXNzYWdlcyBhcyBWOC5cbiAgICBpZiAoc3RhdGUuZWF0KDB4MjkgLyogKSAqLykpIHtcbiAgICAgIHN0YXRlLnJhaXNlKFwiVW5tYXRjaGVkICcpJ1wiKTtcbiAgICB9XG4gICAgaWYgKHN0YXRlLmVhdCgweDVEIC8qIF0gKi8pIHx8IHN0YXRlLmVhdCgweDdEIC8qIH0gKi8pKSB7XG4gICAgICBzdGF0ZS5yYWlzZShcIkxvbmUgcXVhbnRpZmllciBicmFja2V0c1wiKTtcbiAgICB9XG4gIH1cbiAgaWYgKHN0YXRlLm1heEJhY2tSZWZlcmVuY2UgPiBzdGF0ZS5udW1DYXB0dXJpbmdQYXJlbnMpIHtcbiAgICBzdGF0ZS5yYWlzZShcIkludmFsaWQgZXNjYXBlXCIpO1xuICB9XG4gIGZvciAodmFyIGkgPSAwLCBsaXN0ID0gc3RhdGUuYmFja1JlZmVyZW5jZU5hbWVzOyBpIDwgbGlzdC5sZW5ndGg7IGkgKz0gMSkge1xuICAgIHZhciBuYW1lID0gbGlzdFtpXTtcblxuICAgIGlmICghc3RhdGUuZ3JvdXBOYW1lc1tuYW1lXSkge1xuICAgICAgc3RhdGUucmFpc2UoXCJJbnZhbGlkIG5hbWVkIGNhcHR1cmUgcmVmZXJlbmNlZFwiKTtcbiAgICB9XG4gIH1cbn07XG5cbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLURpc2p1bmN0aW9uXG5wcCQxLnJlZ2V4cF9kaXNqdW5jdGlvbiA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciB0cmFja0Rpc2p1bmN0aW9uID0gdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDE2O1xuICBpZiAodHJhY2tEaXNqdW5jdGlvbikgeyBzdGF0ZS5icmFuY2hJRCA9IG5ldyBCcmFuY2hJRChzdGF0ZS5icmFuY2hJRCwgbnVsbCk7IH1cbiAgdGhpcy5yZWdleHBfYWx0ZXJuYXRpdmUoc3RhdGUpO1xuICB3aGlsZSAoc3RhdGUuZWF0KDB4N0MgLyogfCAqLykpIHtcbiAgICBpZiAodHJhY2tEaXNqdW5jdGlvbikgeyBzdGF0ZS5icmFuY2hJRCA9IHN0YXRlLmJyYW5jaElELnNpYmxpbmcoKTsgfVxuICAgIHRoaXMucmVnZXhwX2FsdGVybmF0aXZlKHN0YXRlKTtcbiAgfVxuICBpZiAodHJhY2tEaXNqdW5jdGlvbikgeyBzdGF0ZS5icmFuY2hJRCA9IHN0YXRlLmJyYW5jaElELnBhcmVudDsgfVxuXG4gIC8vIE1ha2UgdGhlIHNhbWUgbWVzc2FnZSBhcyBWOC5cbiAgaWYgKHRoaXMucmVnZXhwX2VhdFF1YW50aWZpZXIoc3RhdGUsIHRydWUpKSB7XG4gICAgc3RhdGUucmFpc2UoXCJOb3RoaW5nIHRvIHJlcGVhdFwiKTtcbiAgfVxuICBpZiAoc3RhdGUuZWF0KDB4N0IgLyogeyAqLykpIHtcbiAgICBzdGF0ZS5yYWlzZShcIkxvbmUgcXVhbnRpZmllciBicmFja2V0c1wiKTtcbiAgfVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtQWx0ZXJuYXRpdmVcbnBwJDEucmVnZXhwX2FsdGVybmF0aXZlID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgd2hpbGUgKHN0YXRlLnBvcyA8IHN0YXRlLnNvdXJjZS5sZW5ndGggJiYgdGhpcy5yZWdleHBfZWF0VGVybShzdGF0ZSkpIHt9XG59O1xuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1hbm5leEItVGVybVxucHAkMS5yZWdleHBfZWF0VGVybSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIGlmICh0aGlzLnJlZ2V4cF9lYXRBc3NlcnRpb24oc3RhdGUpKSB7XG4gICAgLy8gSGFuZGxlIGBRdWFudGlmaWFibGVBc3NlcnRpb24gUXVhbnRpZmllcmAgYWx0ZXJuYXRpdmUuXG4gICAgLy8gYHN0YXRlLmxhc3RBc3NlcnRpb25Jc1F1YW50aWZpYWJsZWAgaXMgdHJ1ZSBpZiB0aGUgbGFzdCBlYXRlbiBBc3NlcnRpb25cbiAgICAvLyBpcyBhIFF1YW50aWZpYWJsZUFzc2VydGlvbi5cbiAgICBpZiAoc3RhdGUubGFzdEFzc2VydGlvbklzUXVhbnRpZmlhYmxlICYmIHRoaXMucmVnZXhwX2VhdFF1YW50aWZpZXIoc3RhdGUpKSB7XG4gICAgICAvLyBNYWtlIHRoZSBzYW1lIG1lc3NhZ2UgYXMgVjguXG4gICAgICBpZiAoc3RhdGUuc3dpdGNoVSkge1xuICAgICAgICBzdGF0ZS5yYWlzZShcIkludmFsaWQgcXVhbnRpZmllclwiKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIGlmIChzdGF0ZS5zd2l0Y2hVID8gdGhpcy5yZWdleHBfZWF0QXRvbShzdGF0ZSkgOiB0aGlzLnJlZ2V4cF9lYXRFeHRlbmRlZEF0b20oc3RhdGUpKSB7XG4gICAgdGhpcy5yZWdleHBfZWF0UXVhbnRpZmllcihzdGF0ZSk7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIHJldHVybiBmYWxzZVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtYW5uZXhCLUFzc2VydGlvblxucHAkMS5yZWdleHBfZWF0QXNzZXJ0aW9uID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIHN0YXJ0ID0gc3RhdGUucG9zO1xuICBzdGF0ZS5sYXN0QXNzZXJ0aW9uSXNRdWFudGlmaWFibGUgPSBmYWxzZTtcblxuICAvLyBeLCAkXG4gIGlmIChzdGF0ZS5lYXQoMHg1RSAvKiBeICovKSB8fCBzdGF0ZS5lYXQoMHgyNCAvKiAkICovKSkge1xuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICAvLyBcXGIgXFxCXG4gIGlmIChzdGF0ZS5lYXQoMHg1QyAvKiBcXCAqLykpIHtcbiAgICBpZiAoc3RhdGUuZWF0KDB4NDIgLyogQiAqLykgfHwgc3RhdGUuZWF0KDB4NjIgLyogYiAqLykpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICAgIHN0YXRlLnBvcyA9IHN0YXJ0O1xuICB9XG5cbiAgLy8gTG9va2FoZWFkIC8gTG9va2JlaGluZFxuICBpZiAoc3RhdGUuZWF0KDB4MjggLyogKCAqLykgJiYgc3RhdGUuZWF0KDB4M0YgLyogPyAqLykpIHtcbiAgICB2YXIgbG9va2JlaGluZCA9IGZhbHNlO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOSkge1xuICAgICAgbG9va2JlaGluZCA9IHN0YXRlLmVhdCgweDNDIC8qIDwgKi8pO1xuICAgIH1cbiAgICBpZiAoc3RhdGUuZWF0KDB4M0QgLyogPSAqLykgfHwgc3RhdGUuZWF0KDB4MjEgLyogISAqLykpIHtcbiAgICAgIHRoaXMucmVnZXhwX2Rpc2p1bmN0aW9uKHN0YXRlKTtcbiAgICAgIGlmICghc3RhdGUuZWF0KDB4MjkgLyogKSAqLykpIHtcbiAgICAgICAgc3RhdGUucmFpc2UoXCJVbnRlcm1pbmF0ZWQgZ3JvdXBcIik7XG4gICAgICB9XG4gICAgICBzdGF0ZS5sYXN0QXNzZXJ0aW9uSXNRdWFudGlmaWFibGUgPSAhbG9va2JlaGluZDtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG5cbiAgc3RhdGUucG9zID0gc3RhcnQ7XG4gIHJldHVybiBmYWxzZVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtUXVhbnRpZmllclxucHAkMS5yZWdleHBfZWF0UXVhbnRpZmllciA9IGZ1bmN0aW9uKHN0YXRlLCBub0Vycm9yKSB7XG4gIGlmICggbm9FcnJvciA9PT0gdm9pZCAwICkgbm9FcnJvciA9IGZhbHNlO1xuXG4gIGlmICh0aGlzLnJlZ2V4cF9lYXRRdWFudGlmaWVyUHJlZml4KHN0YXRlLCBub0Vycm9yKSkge1xuICAgIHN0YXRlLmVhdCgweDNGIC8qID8gKi8pO1xuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1RdWFudGlmaWVyUHJlZml4XG5wcCQxLnJlZ2V4cF9lYXRRdWFudGlmaWVyUHJlZml4ID0gZnVuY3Rpb24oc3RhdGUsIG5vRXJyb3IpIHtcbiAgcmV0dXJuIChcbiAgICBzdGF0ZS5lYXQoMHgyQSAvKiAqICovKSB8fFxuICAgIHN0YXRlLmVhdCgweDJCIC8qICsgKi8pIHx8XG4gICAgc3RhdGUuZWF0KDB4M0YgLyogPyAqLykgfHxcbiAgICB0aGlzLnJlZ2V4cF9lYXRCcmFjZWRRdWFudGlmaWVyKHN0YXRlLCBub0Vycm9yKVxuICApXG59O1xucHAkMS5yZWdleHBfZWF0QnJhY2VkUXVhbnRpZmllciA9IGZ1bmN0aW9uKHN0YXRlLCBub0Vycm9yKSB7XG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcbiAgaWYgKHN0YXRlLmVhdCgweDdCIC8qIHsgKi8pKSB7XG4gICAgdmFyIG1pbiA9IDAsIG1heCA9IC0xO1xuICAgIGlmICh0aGlzLnJlZ2V4cF9lYXREZWNpbWFsRGlnaXRzKHN0YXRlKSkge1xuICAgICAgbWluID0gc3RhdGUubGFzdEludFZhbHVlO1xuICAgICAgaWYgKHN0YXRlLmVhdCgweDJDIC8qICwgKi8pICYmIHRoaXMucmVnZXhwX2VhdERlY2ltYWxEaWdpdHMoc3RhdGUpKSB7XG4gICAgICAgIG1heCA9IHN0YXRlLmxhc3RJbnRWYWx1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChzdGF0ZS5lYXQoMHg3RCAvKiB9ICovKSkge1xuICAgICAgICAvLyBTeW50YXhFcnJvciBpbiBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jc2VjLXRlcm1cbiAgICAgICAgaWYgKG1heCAhPT0gLTEgJiYgbWF4IDwgbWluICYmICFub0Vycm9yKSB7XG4gICAgICAgICAgc3RhdGUucmFpc2UoXCJudW1iZXJzIG91dCBvZiBvcmRlciBpbiB7fSBxdWFudGlmaWVyXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChzdGF0ZS5zd2l0Y2hVICYmICFub0Vycm9yKSB7XG4gICAgICBzdGF0ZS5yYWlzZShcIkluY29tcGxldGUgcXVhbnRpZmllclwiKTtcbiAgICB9XG4gICAgc3RhdGUucG9zID0gc3RhcnQ7XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1BdG9tXG5wcCQxLnJlZ2V4cF9lYXRBdG9tID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgcmV0dXJuIChcbiAgICB0aGlzLnJlZ2V4cF9lYXRQYXR0ZXJuQ2hhcmFjdGVycyhzdGF0ZSkgfHxcbiAgICBzdGF0ZS5lYXQoMHgyRSAvKiAuICovKSB8fFxuICAgIHRoaXMucmVnZXhwX2VhdFJldmVyc2VTb2xpZHVzQXRvbUVzY2FwZShzdGF0ZSkgfHxcbiAgICB0aGlzLnJlZ2V4cF9lYXRDaGFyYWN0ZXJDbGFzcyhzdGF0ZSkgfHxcbiAgICB0aGlzLnJlZ2V4cF9lYXRVbmNhcHR1cmluZ0dyb3VwKHN0YXRlKSB8fFxuICAgIHRoaXMucmVnZXhwX2VhdENhcHR1cmluZ0dyb3VwKHN0YXRlKVxuICApXG59O1xucHAkMS5yZWdleHBfZWF0UmV2ZXJzZVNvbGlkdXNBdG9tRXNjYXBlID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIHN0YXJ0ID0gc3RhdGUucG9zO1xuICBpZiAoc3RhdGUuZWF0KDB4NUMgLyogXFwgKi8pKSB7XG4gICAgaWYgKHRoaXMucmVnZXhwX2VhdEF0b21Fc2NhcGUoc3RhdGUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICBzdGF0ZS5wb3MgPSBzdGFydDtcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn07XG5wcCQxLnJlZ2V4cF9lYXRVbmNhcHR1cmluZ0dyb3VwID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIHN0YXJ0ID0gc3RhdGUucG9zO1xuICBpZiAoc3RhdGUuZWF0KDB4MjggLyogKCAqLykpIHtcbiAgICBpZiAoc3RhdGUuZWF0KDB4M0YgLyogPyAqLykpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTYpIHtcbiAgICAgICAgdmFyIGFkZE1vZGlmaWVycyA9IHRoaXMucmVnZXhwX2VhdE1vZGlmaWVycyhzdGF0ZSk7XG4gICAgICAgIHZhciBoYXNIeXBoZW4gPSBzdGF0ZS5lYXQoMHgyRCAvKiAtICovKTtcbiAgICAgICAgaWYgKGFkZE1vZGlmaWVycyB8fCBoYXNIeXBoZW4pIHtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFkZE1vZGlmaWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG1vZGlmaWVyID0gYWRkTW9kaWZpZXJzLmNoYXJBdChpKTtcbiAgICAgICAgICAgIGlmIChhZGRNb2RpZmllcnMuaW5kZXhPZihtb2RpZmllciwgaSArIDEpID4gLTEpIHtcbiAgICAgICAgICAgICAgc3RhdGUucmFpc2UoXCJEdXBsaWNhdGUgcmVndWxhciBleHByZXNzaW9uIG1vZGlmaWVyc1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGhhc0h5cGhlbikge1xuICAgICAgICAgICAgdmFyIHJlbW92ZU1vZGlmaWVycyA9IHRoaXMucmVnZXhwX2VhdE1vZGlmaWVycyhzdGF0ZSk7XG4gICAgICAgICAgICBpZiAoIWFkZE1vZGlmaWVycyAmJiAhcmVtb3ZlTW9kaWZpZXJzICYmIHN0YXRlLmN1cnJlbnQoKSA9PT0gMHgzQSAvKiA6ICovKSB7XG4gICAgICAgICAgICAgIHN0YXRlLnJhaXNlKFwiSW52YWxpZCByZWd1bGFyIGV4cHJlc3Npb24gbW9kaWZpZXJzXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgaSQxID0gMDsgaSQxIDwgcmVtb3ZlTW9kaWZpZXJzLmxlbmd0aDsgaSQxKyspIHtcbiAgICAgICAgICAgICAgdmFyIG1vZGlmaWVyJDEgPSByZW1vdmVNb2RpZmllcnMuY2hhckF0KGkkMSk7XG4gICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICByZW1vdmVNb2RpZmllcnMuaW5kZXhPZihtb2RpZmllciQxLCBpJDEgKyAxKSA+IC0xIHx8XG4gICAgICAgICAgICAgICAgYWRkTW9kaWZpZXJzLmluZGV4T2YobW9kaWZpZXIkMSkgPiAtMVxuICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBzdGF0ZS5yYWlzZShcIkR1cGxpY2F0ZSByZWd1bGFyIGV4cHJlc3Npb24gbW9kaWZpZXJzXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoc3RhdGUuZWF0KDB4M0EgLyogOiAqLykpIHtcbiAgICAgICAgdGhpcy5yZWdleHBfZGlzanVuY3Rpb24oc3RhdGUpO1xuICAgICAgICBpZiAoc3RhdGUuZWF0KDB4MjkgLyogKSAqLykpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICAgIHN0YXRlLnJhaXNlKFwiVW50ZXJtaW5hdGVkIGdyb3VwXCIpO1xuICAgICAgfVxuICAgIH1cbiAgICBzdGF0ZS5wb3MgPSBzdGFydDtcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn07XG5wcCQxLnJlZ2V4cF9lYXRDYXB0dXJpbmdHcm91cCA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIGlmIChzdGF0ZS5lYXQoMHgyOCAvKiAoICovKSkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOSkge1xuICAgICAgdGhpcy5yZWdleHBfZ3JvdXBTcGVjaWZpZXIoc3RhdGUpO1xuICAgIH0gZWxzZSBpZiAoc3RhdGUuY3VycmVudCgpID09PSAweDNGIC8qID8gKi8pIHtcbiAgICAgIHN0YXRlLnJhaXNlKFwiSW52YWxpZCBncm91cFwiKTtcbiAgICB9XG4gICAgdGhpcy5yZWdleHBfZGlzanVuY3Rpb24oc3RhdGUpO1xuICAgIGlmIChzdGF0ZS5lYXQoMHgyOSAvKiApICovKSkge1xuICAgICAgc3RhdGUubnVtQ2FwdHVyaW5nUGFyZW5zICs9IDE7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICBzdGF0ZS5yYWlzZShcIlVudGVybWluYXRlZCBncm91cFwiKTtcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn07XG4vLyBSZWd1bGFyRXhwcmVzc2lvbk1vZGlmaWVycyA6OlxuLy8gICBbZW1wdHldXG4vLyAgIFJlZ3VsYXJFeHByZXNzaW9uTW9kaWZpZXJzIFJlZ3VsYXJFeHByZXNzaW9uTW9kaWZpZXJcbnBwJDEucmVnZXhwX2VhdE1vZGlmaWVycyA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBtb2RpZmllcnMgPSBcIlwiO1xuICB2YXIgY2ggPSAwO1xuICB3aGlsZSAoKGNoID0gc3RhdGUuY3VycmVudCgpKSAhPT0gLTEgJiYgaXNSZWd1bGFyRXhwcmVzc2lvbk1vZGlmaWVyKGNoKSkge1xuICAgIG1vZGlmaWVycyArPSBjb2RlUG9pbnRUb1N0cmluZyhjaCk7XG4gICAgc3RhdGUuYWR2YW5jZSgpO1xuICB9XG4gIHJldHVybiBtb2RpZmllcnNcbn07XG4vLyBSZWd1bGFyRXhwcmVzc2lvbk1vZGlmaWVyIDo6IG9uZSBvZlxuLy8gICBgaWAgYG1gIGBzYFxuZnVuY3Rpb24gaXNSZWd1bGFyRXhwcmVzc2lvbk1vZGlmaWVyKGNoKSB7XG4gIHJldHVybiBjaCA9PT0gMHg2OSAvKiBpICovIHx8IGNoID09PSAweDZkIC8qIG0gKi8gfHwgY2ggPT09IDB4NzMgLyogcyAqL1xufVxuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1hbm5leEItRXh0ZW5kZWRBdG9tXG5wcCQxLnJlZ2V4cF9lYXRFeHRlbmRlZEF0b20gPSBmdW5jdGlvbihzdGF0ZSkge1xuICByZXR1cm4gKFxuICAgIHN0YXRlLmVhdCgweDJFIC8qIC4gKi8pIHx8XG4gICAgdGhpcy5yZWdleHBfZWF0UmV2ZXJzZVNvbGlkdXNBdG9tRXNjYXBlKHN0YXRlKSB8fFxuICAgIHRoaXMucmVnZXhwX2VhdENoYXJhY3RlckNsYXNzKHN0YXRlKSB8fFxuICAgIHRoaXMucmVnZXhwX2VhdFVuY2FwdHVyaW5nR3JvdXAoc3RhdGUpIHx8XG4gICAgdGhpcy5yZWdleHBfZWF0Q2FwdHVyaW5nR3JvdXAoc3RhdGUpIHx8XG4gICAgdGhpcy5yZWdleHBfZWF0SW52YWxpZEJyYWNlZFF1YW50aWZpZXIoc3RhdGUpIHx8XG4gICAgdGhpcy5yZWdleHBfZWF0RXh0ZW5kZWRQYXR0ZXJuQ2hhcmFjdGVyKHN0YXRlKVxuICApXG59O1xuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1hbm5leEItSW52YWxpZEJyYWNlZFF1YW50aWZpZXJcbnBwJDEucmVnZXhwX2VhdEludmFsaWRCcmFjZWRRdWFudGlmaWVyID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgaWYgKHRoaXMucmVnZXhwX2VhdEJyYWNlZFF1YW50aWZpZXIoc3RhdGUsIHRydWUpKSB7XG4gICAgc3RhdGUucmFpc2UoXCJOb3RoaW5nIHRvIHJlcGVhdFwiKTtcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn07XG5cbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLVN5bnRheENoYXJhY3RlclxucHAkMS5yZWdleHBfZWF0U3ludGF4Q2hhcmFjdGVyID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIGNoID0gc3RhdGUuY3VycmVudCgpO1xuICBpZiAoaXNTeW50YXhDaGFyYWN0ZXIoY2gpKSB7XG4gICAgc3RhdGUubGFzdEludFZhbHVlID0gY2g7XG4gICAgc3RhdGUuYWR2YW5jZSgpO1xuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuZnVuY3Rpb24gaXNTeW50YXhDaGFyYWN0ZXIoY2gpIHtcbiAgcmV0dXJuIChcbiAgICBjaCA9PT0gMHgyNCAvKiAkICovIHx8XG4gICAgY2ggPj0gMHgyOCAvKiAoICovICYmIGNoIDw9IDB4MkIgLyogKyAqLyB8fFxuICAgIGNoID09PSAweDJFIC8qIC4gKi8gfHxcbiAgICBjaCA9PT0gMHgzRiAvKiA/ICovIHx8XG4gICAgY2ggPj0gMHg1QiAvKiBbICovICYmIGNoIDw9IDB4NUUgLyogXiAqLyB8fFxuICAgIGNoID49IDB4N0IgLyogeyAqLyAmJiBjaCA8PSAweDdEIC8qIH0gKi9cbiAgKVxufVxuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1QYXR0ZXJuQ2hhcmFjdGVyXG4vLyBCdXQgZWF0IGVhZ2VyLlxucHAkMS5yZWdleHBfZWF0UGF0dGVybkNoYXJhY3RlcnMgPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgc3RhcnQgPSBzdGF0ZS5wb3M7XG4gIHZhciBjaCA9IDA7XG4gIHdoaWxlICgoY2ggPSBzdGF0ZS5jdXJyZW50KCkpICE9PSAtMSAmJiAhaXNTeW50YXhDaGFyYWN0ZXIoY2gpKSB7XG4gICAgc3RhdGUuYWR2YW5jZSgpO1xuICB9XG4gIHJldHVybiBzdGF0ZS5wb3MgIT09IHN0YXJ0XG59O1xuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1hbm5leEItRXh0ZW5kZWRQYXR0ZXJuQ2hhcmFjdGVyXG5wcCQxLnJlZ2V4cF9lYXRFeHRlbmRlZFBhdHRlcm5DaGFyYWN0ZXIgPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgY2ggPSBzdGF0ZS5jdXJyZW50KCk7XG4gIGlmIChcbiAgICBjaCAhPT0gLTEgJiZcbiAgICBjaCAhPT0gMHgyNCAvKiAkICovICYmXG4gICAgIShjaCA+PSAweDI4IC8qICggKi8gJiYgY2ggPD0gMHgyQiAvKiArICovKSAmJlxuICAgIGNoICE9PSAweDJFIC8qIC4gKi8gJiZcbiAgICBjaCAhPT0gMHgzRiAvKiA/ICovICYmXG4gICAgY2ggIT09IDB4NUIgLyogWyAqLyAmJlxuICAgIGNoICE9PSAweDVFIC8qIF4gKi8gJiZcbiAgICBjaCAhPT0gMHg3QyAvKiB8ICovXG4gICkge1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHJldHVybiBmYWxzZVxufTtcblxuLy8gR3JvdXBTcGVjaWZpZXIgOjpcbi8vICAgW2VtcHR5XVxuLy8gICBgP2AgR3JvdXBOYW1lXG5wcCQxLnJlZ2V4cF9ncm91cFNwZWNpZmllciA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIGlmIChzdGF0ZS5lYXQoMHgzRiAvKiA/ICovKSkge1xuICAgIGlmICghdGhpcy5yZWdleHBfZWF0R3JvdXBOYW1lKHN0YXRlKSkgeyBzdGF0ZS5yYWlzZShcIkludmFsaWQgZ3JvdXBcIik7IH1cbiAgICB2YXIgdHJhY2tEaXNqdW5jdGlvbiA9IHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSAxNjtcbiAgICB2YXIga25vd24gPSBzdGF0ZS5ncm91cE5hbWVzW3N0YXRlLmxhc3RTdHJpbmdWYWx1ZV07XG4gICAgaWYgKGtub3duKSB7XG4gICAgICBpZiAodHJhY2tEaXNqdW5jdGlvbikge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGlzdCA9IGtub3duOyBpIDwgbGlzdC5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgIHZhciBhbHRJRCA9IGxpc3RbaV07XG5cbiAgICAgICAgICBpZiAoIWFsdElELnNlcGFyYXRlZEZyb20oc3RhdGUuYnJhbmNoSUQpKVxuICAgICAgICAgICAgeyBzdGF0ZS5yYWlzZShcIkR1cGxpY2F0ZSBjYXB0dXJlIGdyb3VwIG5hbWVcIik7IH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdGUucmFpc2UoXCJEdXBsaWNhdGUgY2FwdHVyZSBncm91cCBuYW1lXCIpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodHJhY2tEaXNqdW5jdGlvbikge1xuICAgICAgKGtub3duIHx8IChzdGF0ZS5ncm91cE5hbWVzW3N0YXRlLmxhc3RTdHJpbmdWYWx1ZV0gPSBbXSkpLnB1c2goc3RhdGUuYnJhbmNoSUQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGF0ZS5ncm91cE5hbWVzW3N0YXRlLmxhc3RTdHJpbmdWYWx1ZV0gPSB0cnVlO1xuICAgIH1cbiAgfVxufTtcblxuLy8gR3JvdXBOYW1lIDo6XG4vLyAgIGA8YCBSZWdFeHBJZGVudGlmaWVyTmFtZSBgPmBcbi8vIE5vdGU6IHRoaXMgdXBkYXRlcyBgc3RhdGUubGFzdFN0cmluZ1ZhbHVlYCBwcm9wZXJ0eSB3aXRoIHRoZSBlYXRlbiBuYW1lLlxucHAkMS5yZWdleHBfZWF0R3JvdXBOYW1lID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgc3RhdGUubGFzdFN0cmluZ1ZhbHVlID0gXCJcIjtcbiAgaWYgKHN0YXRlLmVhdCgweDNDIC8qIDwgKi8pKSB7XG4gICAgaWYgKHRoaXMucmVnZXhwX2VhdFJlZ0V4cElkZW50aWZpZXJOYW1lKHN0YXRlKSAmJiBzdGF0ZS5lYXQoMHgzRSAvKiA+ICovKSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgc3RhdGUucmFpc2UoXCJJbnZhbGlkIGNhcHR1cmUgZ3JvdXAgbmFtZVwiKTtcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn07XG5cbi8vIFJlZ0V4cElkZW50aWZpZXJOYW1lIDo6XG4vLyAgIFJlZ0V4cElkZW50aWZpZXJTdGFydFxuLy8gICBSZWdFeHBJZGVudGlmaWVyTmFtZSBSZWdFeHBJZGVudGlmaWVyUGFydFxuLy8gTm90ZTogdGhpcyB1cGRhdGVzIGBzdGF0ZS5sYXN0U3RyaW5nVmFsdWVgIHByb3BlcnR5IHdpdGggdGhlIGVhdGVuIG5hbWUuXG5wcCQxLnJlZ2V4cF9lYXRSZWdFeHBJZGVudGlmaWVyTmFtZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHN0YXRlLmxhc3RTdHJpbmdWYWx1ZSA9IFwiXCI7XG4gIGlmICh0aGlzLnJlZ2V4cF9lYXRSZWdFeHBJZGVudGlmaWVyU3RhcnQoc3RhdGUpKSB7XG4gICAgc3RhdGUubGFzdFN0cmluZ1ZhbHVlICs9IGNvZGVQb2ludFRvU3RyaW5nKHN0YXRlLmxhc3RJbnRWYWx1ZSk7XG4gICAgd2hpbGUgKHRoaXMucmVnZXhwX2VhdFJlZ0V4cElkZW50aWZpZXJQYXJ0KHN0YXRlKSkge1xuICAgICAgc3RhdGUubGFzdFN0cmluZ1ZhbHVlICs9IGNvZGVQb2ludFRvU3RyaW5nKHN0YXRlLmxhc3RJbnRWYWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG4vLyBSZWdFeHBJZGVudGlmaWVyU3RhcnQgOjpcbi8vICAgVW5pY29kZUlEU3RhcnRcbi8vICAgYCRgXG4vLyAgIGBfYFxuLy8gICBgXFxgIFJlZ0V4cFVuaWNvZGVFc2NhcGVTZXF1ZW5jZVsrVV1cbnBwJDEucmVnZXhwX2VhdFJlZ0V4cElkZW50aWZpZXJTdGFydCA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcbiAgdmFyIGZvcmNlVSA9IHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSAxMTtcbiAgdmFyIGNoID0gc3RhdGUuY3VycmVudChmb3JjZVUpO1xuICBzdGF0ZS5hZHZhbmNlKGZvcmNlVSk7XG5cbiAgaWYgKGNoID09PSAweDVDIC8qIFxcICovICYmIHRoaXMucmVnZXhwX2VhdFJlZ0V4cFVuaWNvZGVFc2NhcGVTZXF1ZW5jZShzdGF0ZSwgZm9yY2VVKSkge1xuICAgIGNoID0gc3RhdGUubGFzdEludFZhbHVlO1xuICB9XG4gIGlmIChpc1JlZ0V4cElkZW50aWZpZXJTdGFydChjaCkpIHtcbiAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSBjaDtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgc3RhdGUucG9zID0gc3RhcnQ7XG4gIHJldHVybiBmYWxzZVxufTtcbmZ1bmN0aW9uIGlzUmVnRXhwSWRlbnRpZmllclN0YXJ0KGNoKSB7XG4gIHJldHVybiBpc0lkZW50aWZpZXJTdGFydChjaCwgdHJ1ZSkgfHwgY2ggPT09IDB4MjQgLyogJCAqLyB8fCBjaCA9PT0gMHg1RiAvKiBfICovXG59XG5cbi8vIFJlZ0V4cElkZW50aWZpZXJQYXJ0IDo6XG4vLyAgIFVuaWNvZGVJRENvbnRpbnVlXG4vLyAgIGAkYFxuLy8gICBgX2Bcbi8vICAgYFxcYCBSZWdFeHBVbmljb2RlRXNjYXBlU2VxdWVuY2VbK1VdXG4vLyAgIDxaV05KPlxuLy8gICA8WldKPlxucHAkMS5yZWdleHBfZWF0UmVnRXhwSWRlbnRpZmllclBhcnQgPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgc3RhcnQgPSBzdGF0ZS5wb3M7XG4gIHZhciBmb3JjZVUgPSB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTE7XG4gIHZhciBjaCA9IHN0YXRlLmN1cnJlbnQoZm9yY2VVKTtcbiAgc3RhdGUuYWR2YW5jZShmb3JjZVUpO1xuXG4gIGlmIChjaCA9PT0gMHg1QyAvKiBcXCAqLyAmJiB0aGlzLnJlZ2V4cF9lYXRSZWdFeHBVbmljb2RlRXNjYXBlU2VxdWVuY2Uoc3RhdGUsIGZvcmNlVSkpIHtcbiAgICBjaCA9IHN0YXRlLmxhc3RJbnRWYWx1ZTtcbiAgfVxuICBpZiAoaXNSZWdFeHBJZGVudGlmaWVyUGFydChjaCkpIHtcbiAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSBjaDtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgc3RhdGUucG9zID0gc3RhcnQ7XG4gIHJldHVybiBmYWxzZVxufTtcbmZ1bmN0aW9uIGlzUmVnRXhwSWRlbnRpZmllclBhcnQoY2gpIHtcbiAgcmV0dXJuIGlzSWRlbnRpZmllckNoYXIoY2gsIHRydWUpIHx8IGNoID09PSAweDI0IC8qICQgKi8gfHwgY2ggPT09IDB4NUYgLyogXyAqLyB8fCBjaCA9PT0gMHgyMDBDIC8qIDxaV05KPiAqLyB8fCBjaCA9PT0gMHgyMDBEIC8qIDxaV0o+ICovXG59XG5cbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLWFubmV4Qi1BdG9tRXNjYXBlXG5wcCQxLnJlZ2V4cF9lYXRBdG9tRXNjYXBlID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgaWYgKFxuICAgIHRoaXMucmVnZXhwX2VhdEJhY2tSZWZlcmVuY2Uoc3RhdGUpIHx8XG4gICAgdGhpcy5yZWdleHBfZWF0Q2hhcmFjdGVyQ2xhc3NFc2NhcGUoc3RhdGUpIHx8XG4gICAgdGhpcy5yZWdleHBfZWF0Q2hhcmFjdGVyRXNjYXBlKHN0YXRlKSB8fFxuICAgIChzdGF0ZS5zd2l0Y2hOICYmIHRoaXMucmVnZXhwX2VhdEtHcm91cE5hbWUoc3RhdGUpKVxuICApIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIGlmIChzdGF0ZS5zd2l0Y2hVKSB7XG4gICAgLy8gTWFrZSB0aGUgc2FtZSBtZXNzYWdlIGFzIFY4LlxuICAgIGlmIChzdGF0ZS5jdXJyZW50KCkgPT09IDB4NjMgLyogYyAqLykge1xuICAgICAgc3RhdGUucmFpc2UoXCJJbnZhbGlkIHVuaWNvZGUgZXNjYXBlXCIpO1xuICAgIH1cbiAgICBzdGF0ZS5yYWlzZShcIkludmFsaWQgZXNjYXBlXCIpO1xuICB9XG4gIHJldHVybiBmYWxzZVxufTtcbnBwJDEucmVnZXhwX2VhdEJhY2tSZWZlcmVuY2UgPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgc3RhcnQgPSBzdGF0ZS5wb3M7XG4gIGlmICh0aGlzLnJlZ2V4cF9lYXREZWNpbWFsRXNjYXBlKHN0YXRlKSkge1xuICAgIHZhciBuID0gc3RhdGUubGFzdEludFZhbHVlO1xuICAgIGlmIChzdGF0ZS5zd2l0Y2hVKSB7XG4gICAgICAvLyBGb3IgU3ludGF4RXJyb3IgaW4gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3NlYy1hdG9tZXNjYXBlXG4gICAgICBpZiAobiA+IHN0YXRlLm1heEJhY2tSZWZlcmVuY2UpIHtcbiAgICAgICAgc3RhdGUubWF4QmFja1JlZmVyZW5jZSA9IG47XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICBpZiAobiA8PSBzdGF0ZS5udW1DYXB0dXJpbmdQYXJlbnMpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICAgIHN0YXRlLnBvcyA9IHN0YXJ0O1xuICB9XG4gIHJldHVybiBmYWxzZVxufTtcbnBwJDEucmVnZXhwX2VhdEtHcm91cE5hbWUgPSBmdW5jdGlvbihzdGF0ZSkge1xuICBpZiAoc3RhdGUuZWF0KDB4NkIgLyogayAqLykpIHtcbiAgICBpZiAodGhpcy5yZWdleHBfZWF0R3JvdXBOYW1lKHN0YXRlKSkge1xuICAgICAgc3RhdGUuYmFja1JlZmVyZW5jZU5hbWVzLnB1c2goc3RhdGUubGFzdFN0cmluZ1ZhbHVlKTtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICAgIHN0YXRlLnJhaXNlKFwiSW52YWxpZCBuYW1lZCByZWZlcmVuY2VcIik7XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1hbm5leEItQ2hhcmFjdGVyRXNjYXBlXG5wcCQxLnJlZ2V4cF9lYXRDaGFyYWN0ZXJFc2NhcGUgPSBmdW5jdGlvbihzdGF0ZSkge1xuICByZXR1cm4gKFxuICAgIHRoaXMucmVnZXhwX2VhdENvbnRyb2xFc2NhcGUoc3RhdGUpIHx8XG4gICAgdGhpcy5yZWdleHBfZWF0Q0NvbnRyb2xMZXR0ZXIoc3RhdGUpIHx8XG4gICAgdGhpcy5yZWdleHBfZWF0WmVybyhzdGF0ZSkgfHxcbiAgICB0aGlzLnJlZ2V4cF9lYXRIZXhFc2NhcGVTZXF1ZW5jZShzdGF0ZSkgfHxcbiAgICB0aGlzLnJlZ2V4cF9lYXRSZWdFeHBVbmljb2RlRXNjYXBlU2VxdWVuY2Uoc3RhdGUsIGZhbHNlKSB8fFxuICAgICghc3RhdGUuc3dpdGNoVSAmJiB0aGlzLnJlZ2V4cF9lYXRMZWdhY3lPY3RhbEVzY2FwZVNlcXVlbmNlKHN0YXRlKSkgfHxcbiAgICB0aGlzLnJlZ2V4cF9lYXRJZGVudGl0eUVzY2FwZShzdGF0ZSlcbiAgKVxufTtcbnBwJDEucmVnZXhwX2VhdENDb250cm9sTGV0dGVyID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIHN0YXJ0ID0gc3RhdGUucG9zO1xuICBpZiAoc3RhdGUuZWF0KDB4NjMgLyogYyAqLykpIHtcbiAgICBpZiAodGhpcy5yZWdleHBfZWF0Q29udHJvbExldHRlcihzdGF0ZSkpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICAgIHN0YXRlLnBvcyA9IHN0YXJ0O1xuICB9XG4gIHJldHVybiBmYWxzZVxufTtcbnBwJDEucmVnZXhwX2VhdFplcm8gPSBmdW5jdGlvbihzdGF0ZSkge1xuICBpZiAoc3RhdGUuY3VycmVudCgpID09PSAweDMwIC8qIDAgKi8gJiYgIWlzRGVjaW1hbERpZ2l0KHN0YXRlLmxvb2thaGVhZCgpKSkge1xuICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IDA7XG4gICAgc3RhdGUuYWR2YW5jZSgpO1xuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1Db250cm9sRXNjYXBlXG5wcCQxLnJlZ2V4cF9lYXRDb250cm9sRXNjYXBlID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIGNoID0gc3RhdGUuY3VycmVudCgpO1xuICBpZiAoY2ggPT09IDB4NzQgLyogdCAqLykge1xuICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IDB4MDk7IC8qIFxcdCAqL1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIGlmIChjaCA9PT0gMHg2RSAvKiBuICovKSB7XG4gICAgc3RhdGUubGFzdEludFZhbHVlID0gMHgwQTsgLyogXFxuICovXG4gICAgc3RhdGUuYWR2YW5jZSgpO1xuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgaWYgKGNoID09PSAweDc2IC8qIHYgKi8pIHtcbiAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSAweDBCOyAvKiBcXHYgKi9cbiAgICBzdGF0ZS5hZHZhbmNlKCk7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICBpZiAoY2ggPT09IDB4NjYgLyogZiAqLykge1xuICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IDB4MEM7IC8qIFxcZiAqL1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIGlmIChjaCA9PT0gMHg3MiAvKiByICovKSB7XG4gICAgc3RhdGUubGFzdEludFZhbHVlID0gMHgwRDsgLyogXFxyICovXG4gICAgc3RhdGUuYWR2YW5jZSgpO1xuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1Db250cm9sTGV0dGVyXG5wcCQxLnJlZ2V4cF9lYXRDb250cm9sTGV0dGVyID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIGNoID0gc3RhdGUuY3VycmVudCgpO1xuICBpZiAoaXNDb250cm9sTGV0dGVyKGNoKSkge1xuICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IGNoICUgMHgyMDtcbiAgICBzdGF0ZS5hZHZhbmNlKCk7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn07XG5mdW5jdGlvbiBpc0NvbnRyb2xMZXR0ZXIoY2gpIHtcbiAgcmV0dXJuIChcbiAgICAoY2ggPj0gMHg0MSAvKiBBICovICYmIGNoIDw9IDB4NUEgLyogWiAqLykgfHxcbiAgICAoY2ggPj0gMHg2MSAvKiBhICovICYmIGNoIDw9IDB4N0EgLyogeiAqLylcbiAgKVxufVxuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1SZWdFeHBVbmljb2RlRXNjYXBlU2VxdWVuY2VcbnBwJDEucmVnZXhwX2VhdFJlZ0V4cFVuaWNvZGVFc2NhcGVTZXF1ZW5jZSA9IGZ1bmN0aW9uKHN0YXRlLCBmb3JjZVUpIHtcbiAgaWYgKCBmb3JjZVUgPT09IHZvaWQgMCApIGZvcmNlVSA9IGZhbHNlO1xuXG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcbiAgdmFyIHN3aXRjaFUgPSBmb3JjZVUgfHwgc3RhdGUuc3dpdGNoVTtcblxuICBpZiAoc3RhdGUuZWF0KDB4NzUgLyogdSAqLykpIHtcbiAgICBpZiAodGhpcy5yZWdleHBfZWF0Rml4ZWRIZXhEaWdpdHMoc3RhdGUsIDQpKSB7XG4gICAgICB2YXIgbGVhZCA9IHN0YXRlLmxhc3RJbnRWYWx1ZTtcbiAgICAgIGlmIChzd2l0Y2hVICYmIGxlYWQgPj0gMHhEODAwICYmIGxlYWQgPD0gMHhEQkZGKSB7XG4gICAgICAgIHZhciBsZWFkU3Vycm9nYXRlRW5kID0gc3RhdGUucG9zO1xuICAgICAgICBpZiAoc3RhdGUuZWF0KDB4NUMgLyogXFwgKi8pICYmIHN0YXRlLmVhdCgweDc1IC8qIHUgKi8pICYmIHRoaXMucmVnZXhwX2VhdEZpeGVkSGV4RGlnaXRzKHN0YXRlLCA0KSkge1xuICAgICAgICAgIHZhciB0cmFpbCA9IHN0YXRlLmxhc3RJbnRWYWx1ZTtcbiAgICAgICAgICBpZiAodHJhaWwgPj0gMHhEQzAwICYmIHRyYWlsIDw9IDB4REZGRikge1xuICAgICAgICAgICAgc3RhdGUubGFzdEludFZhbHVlID0gKGxlYWQgLSAweEQ4MDApICogMHg0MDAgKyAodHJhaWwgLSAweERDMDApICsgMHgxMDAwMDtcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN0YXRlLnBvcyA9IGxlYWRTdXJyb2dhdGVFbmQ7XG4gICAgICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IGxlYWQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICBpZiAoXG4gICAgICBzd2l0Y2hVICYmXG4gICAgICBzdGF0ZS5lYXQoMHg3QiAvKiB7ICovKSAmJlxuICAgICAgdGhpcy5yZWdleHBfZWF0SGV4RGlnaXRzKHN0YXRlKSAmJlxuICAgICAgc3RhdGUuZWF0KDB4N0QgLyogfSAqLykgJiZcbiAgICAgIGlzVmFsaWRVbmljb2RlKHN0YXRlLmxhc3RJbnRWYWx1ZSlcbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICAgIGlmIChzd2l0Y2hVKSB7XG4gICAgICBzdGF0ZS5yYWlzZShcIkludmFsaWQgdW5pY29kZSBlc2NhcGVcIik7XG4gICAgfVxuICAgIHN0YXRlLnBvcyA9IHN0YXJ0O1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlXG59O1xuZnVuY3Rpb24gaXNWYWxpZFVuaWNvZGUoY2gpIHtcbiAgcmV0dXJuIGNoID49IDAgJiYgY2ggPD0gMHgxMEZGRkZcbn1cblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtYW5uZXhCLUlkZW50aXR5RXNjYXBlXG5wcCQxLnJlZ2V4cF9lYXRJZGVudGl0eUVzY2FwZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIGlmIChzdGF0ZS5zd2l0Y2hVKSB7XG4gICAgaWYgKHRoaXMucmVnZXhwX2VhdFN5bnRheENoYXJhY3RlcihzdGF0ZSkpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICAgIGlmIChzdGF0ZS5lYXQoMHgyRiAvKiAvICovKSkge1xuICAgICAgc3RhdGUubGFzdEludFZhbHVlID0gMHgyRjsgLyogLyAqL1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICB2YXIgY2ggPSBzdGF0ZS5jdXJyZW50KCk7XG4gIGlmIChjaCAhPT0gMHg2MyAvKiBjICovICYmICghc3RhdGUuc3dpdGNoTiB8fCBjaCAhPT0gMHg2QiAvKiBrICovKSkge1xuICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IGNoO1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1EZWNpbWFsRXNjYXBlXG5wcCQxLnJlZ2V4cF9lYXREZWNpbWFsRXNjYXBlID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgc3RhdGUubGFzdEludFZhbHVlID0gMDtcbiAgdmFyIGNoID0gc3RhdGUuY3VycmVudCgpO1xuICBpZiAoY2ggPj0gMHgzMSAvKiAxICovICYmIGNoIDw9IDB4MzkgLyogOSAqLykge1xuICAgIGRvIHtcbiAgICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IDEwICogc3RhdGUubGFzdEludFZhbHVlICsgKGNoIC0gMHgzMCAvKiAwICovKTtcbiAgICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgICB9IHdoaWxlICgoY2ggPSBzdGF0ZS5jdXJyZW50KCkpID49IDB4MzAgLyogMCAqLyAmJiBjaCA8PSAweDM5IC8qIDkgKi8pXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn07XG5cbi8vIFJldHVybiB2YWx1ZXMgdXNlZCBieSBjaGFyYWN0ZXIgc2V0IHBhcnNpbmcgbWV0aG9kcywgbmVlZGVkIHRvXG4vLyBmb3JiaWQgbmVnYXRpb24gb2Ygc2V0cyB0aGF0IGNhbiBtYXRjaCBzdHJpbmdzLlxudmFyIENoYXJTZXROb25lID0gMDsgLy8gTm90aGluZyBwYXJzZWRcbnZhciBDaGFyU2V0T2sgPSAxOyAvLyBDb25zdHJ1Y3QgcGFyc2VkLCBjYW5ub3QgY29udGFpbiBzdHJpbmdzXG52YXIgQ2hhclNldFN0cmluZyA9IDI7IC8vIENvbnN0cnVjdCBwYXJzZWQsIGNhbiBjb250YWluIHN0cmluZ3NcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtQ2hhcmFjdGVyQ2xhc3NFc2NhcGVcbnBwJDEucmVnZXhwX2VhdENoYXJhY3RlckNsYXNzRXNjYXBlID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIGNoID0gc3RhdGUuY3VycmVudCgpO1xuXG4gIGlmIChpc0NoYXJhY3RlckNsYXNzRXNjYXBlKGNoKSkge1xuICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IC0xO1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgICByZXR1cm4gQ2hhclNldE9rXG4gIH1cblxuICB2YXIgbmVnYXRlID0gZmFsc2U7XG4gIGlmIChcbiAgICBzdGF0ZS5zd2l0Y2hVICYmXG4gICAgdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDkgJiZcbiAgICAoKG5lZ2F0ZSA9IGNoID09PSAweDUwIC8qIFAgKi8pIHx8IGNoID09PSAweDcwIC8qIHAgKi8pXG4gICkge1xuICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IC0xO1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgICB2YXIgcmVzdWx0O1xuICAgIGlmIChcbiAgICAgIHN0YXRlLmVhdCgweDdCIC8qIHsgKi8pICYmXG4gICAgICAocmVzdWx0ID0gdGhpcy5yZWdleHBfZWF0VW5pY29kZVByb3BlcnR5VmFsdWVFeHByZXNzaW9uKHN0YXRlKSkgJiZcbiAgICAgIHN0YXRlLmVhdCgweDdEIC8qIH0gKi8pXG4gICAgKSB7XG4gICAgICBpZiAobmVnYXRlICYmIHJlc3VsdCA9PT0gQ2hhclNldFN0cmluZykgeyBzdGF0ZS5yYWlzZShcIkludmFsaWQgcHJvcGVydHkgbmFtZVwiKTsgfVxuICAgICAgcmV0dXJuIHJlc3VsdFxuICAgIH1cbiAgICBzdGF0ZS5yYWlzZShcIkludmFsaWQgcHJvcGVydHkgbmFtZVwiKTtcbiAgfVxuXG4gIHJldHVybiBDaGFyU2V0Tm9uZVxufTtcblxuZnVuY3Rpb24gaXNDaGFyYWN0ZXJDbGFzc0VzY2FwZShjaCkge1xuICByZXR1cm4gKFxuICAgIGNoID09PSAweDY0IC8qIGQgKi8gfHxcbiAgICBjaCA9PT0gMHg0NCAvKiBEICovIHx8XG4gICAgY2ggPT09IDB4NzMgLyogcyAqLyB8fFxuICAgIGNoID09PSAweDUzIC8qIFMgKi8gfHxcbiAgICBjaCA9PT0gMHg3NyAvKiB3ICovIHx8XG4gICAgY2ggPT09IDB4NTcgLyogVyAqL1xuICApXG59XG5cbi8vIFVuaWNvZGVQcm9wZXJ0eVZhbHVlRXhwcmVzc2lvbiA6OlxuLy8gICBVbmljb2RlUHJvcGVydHlOYW1lIGA9YCBVbmljb2RlUHJvcGVydHlWYWx1ZVxuLy8gICBMb25lVW5pY29kZVByb3BlcnR5TmFtZU9yVmFsdWVcbnBwJDEucmVnZXhwX2VhdFVuaWNvZGVQcm9wZXJ0eVZhbHVlRXhwcmVzc2lvbiA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcblxuICAvLyBVbmljb2RlUHJvcGVydHlOYW1lIGA9YCBVbmljb2RlUHJvcGVydHlWYWx1ZVxuICBpZiAodGhpcy5yZWdleHBfZWF0VW5pY29kZVByb3BlcnR5TmFtZShzdGF0ZSkgJiYgc3RhdGUuZWF0KDB4M0QgLyogPSAqLykpIHtcbiAgICB2YXIgbmFtZSA9IHN0YXRlLmxhc3RTdHJpbmdWYWx1ZTtcbiAgICBpZiAodGhpcy5yZWdleHBfZWF0VW5pY29kZVByb3BlcnR5VmFsdWUoc3RhdGUpKSB7XG4gICAgICB2YXIgdmFsdWUgPSBzdGF0ZS5sYXN0U3RyaW5nVmFsdWU7XG4gICAgICB0aGlzLnJlZ2V4cF92YWxpZGF0ZVVuaWNvZGVQcm9wZXJ0eU5hbWVBbmRWYWx1ZShzdGF0ZSwgbmFtZSwgdmFsdWUpO1xuICAgICAgcmV0dXJuIENoYXJTZXRPa1xuICAgIH1cbiAgfVxuICBzdGF0ZS5wb3MgPSBzdGFydDtcblxuICAvLyBMb25lVW5pY29kZVByb3BlcnR5TmFtZU9yVmFsdWVcbiAgaWYgKHRoaXMucmVnZXhwX2VhdExvbmVVbmljb2RlUHJvcGVydHlOYW1lT3JWYWx1ZShzdGF0ZSkpIHtcbiAgICB2YXIgbmFtZU9yVmFsdWUgPSBzdGF0ZS5sYXN0U3RyaW5nVmFsdWU7XG4gICAgcmV0dXJuIHRoaXMucmVnZXhwX3ZhbGlkYXRlVW5pY29kZVByb3BlcnR5TmFtZU9yVmFsdWUoc3RhdGUsIG5hbWVPclZhbHVlKVxuICB9XG4gIHJldHVybiBDaGFyU2V0Tm9uZVxufTtcblxucHAkMS5yZWdleHBfdmFsaWRhdGVVbmljb2RlUHJvcGVydHlOYW1lQW5kVmFsdWUgPSBmdW5jdGlvbihzdGF0ZSwgbmFtZSwgdmFsdWUpIHtcbiAgaWYgKCFoYXNPd24oc3RhdGUudW5pY29kZVByb3BlcnRpZXMubm9uQmluYXJ5LCBuYW1lKSlcbiAgICB7IHN0YXRlLnJhaXNlKFwiSW52YWxpZCBwcm9wZXJ0eSBuYW1lXCIpOyB9XG4gIGlmICghc3RhdGUudW5pY29kZVByb3BlcnRpZXMubm9uQmluYXJ5W25hbWVdLnRlc3QodmFsdWUpKVxuICAgIHsgc3RhdGUucmFpc2UoXCJJbnZhbGlkIHByb3BlcnR5IHZhbHVlXCIpOyB9XG59O1xuXG5wcCQxLnJlZ2V4cF92YWxpZGF0ZVVuaWNvZGVQcm9wZXJ0eU5hbWVPclZhbHVlID0gZnVuY3Rpb24oc3RhdGUsIG5hbWVPclZhbHVlKSB7XG4gIGlmIChzdGF0ZS51bmljb2RlUHJvcGVydGllcy5iaW5hcnkudGVzdChuYW1lT3JWYWx1ZSkpIHsgcmV0dXJuIENoYXJTZXRPayB9XG4gIGlmIChzdGF0ZS5zd2l0Y2hWICYmIHN0YXRlLnVuaWNvZGVQcm9wZXJ0aWVzLmJpbmFyeU9mU3RyaW5ncy50ZXN0KG5hbWVPclZhbHVlKSkgeyByZXR1cm4gQ2hhclNldFN0cmluZyB9XG4gIHN0YXRlLnJhaXNlKFwiSW52YWxpZCBwcm9wZXJ0eSBuYW1lXCIpO1xufTtcblxuLy8gVW5pY29kZVByb3BlcnR5TmFtZSA6OlxuLy8gICBVbmljb2RlUHJvcGVydHlOYW1lQ2hhcmFjdGVyc1xucHAkMS5yZWdleHBfZWF0VW5pY29kZVByb3BlcnR5TmFtZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBjaCA9IDA7XG4gIHN0YXRlLmxhc3RTdHJpbmdWYWx1ZSA9IFwiXCI7XG4gIHdoaWxlIChpc1VuaWNvZGVQcm9wZXJ0eU5hbWVDaGFyYWN0ZXIoY2ggPSBzdGF0ZS5jdXJyZW50KCkpKSB7XG4gICAgc3RhdGUubGFzdFN0cmluZ1ZhbHVlICs9IGNvZGVQb2ludFRvU3RyaW5nKGNoKTtcbiAgICBzdGF0ZS5hZHZhbmNlKCk7XG4gIH1cbiAgcmV0dXJuIHN0YXRlLmxhc3RTdHJpbmdWYWx1ZSAhPT0gXCJcIlxufTtcblxuZnVuY3Rpb24gaXNVbmljb2RlUHJvcGVydHlOYW1lQ2hhcmFjdGVyKGNoKSB7XG4gIHJldHVybiBpc0NvbnRyb2xMZXR0ZXIoY2gpIHx8IGNoID09PSAweDVGIC8qIF8gKi9cbn1cblxuLy8gVW5pY29kZVByb3BlcnR5VmFsdWUgOjpcbi8vICAgVW5pY29kZVByb3BlcnR5VmFsdWVDaGFyYWN0ZXJzXG5wcCQxLnJlZ2V4cF9lYXRVbmljb2RlUHJvcGVydHlWYWx1ZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBjaCA9IDA7XG4gIHN0YXRlLmxhc3RTdHJpbmdWYWx1ZSA9IFwiXCI7XG4gIHdoaWxlIChpc1VuaWNvZGVQcm9wZXJ0eVZhbHVlQ2hhcmFjdGVyKGNoID0gc3RhdGUuY3VycmVudCgpKSkge1xuICAgIHN0YXRlLmxhc3RTdHJpbmdWYWx1ZSArPSBjb2RlUG9pbnRUb1N0cmluZyhjaCk7XG4gICAgc3RhdGUuYWR2YW5jZSgpO1xuICB9XG4gIHJldHVybiBzdGF0ZS5sYXN0U3RyaW5nVmFsdWUgIT09IFwiXCJcbn07XG5mdW5jdGlvbiBpc1VuaWNvZGVQcm9wZXJ0eVZhbHVlQ2hhcmFjdGVyKGNoKSB7XG4gIHJldHVybiBpc1VuaWNvZGVQcm9wZXJ0eU5hbWVDaGFyYWN0ZXIoY2gpIHx8IGlzRGVjaW1hbERpZ2l0KGNoKVxufVxuXG4vLyBMb25lVW5pY29kZVByb3BlcnR5TmFtZU9yVmFsdWUgOjpcbi8vICAgVW5pY29kZVByb3BlcnR5VmFsdWVDaGFyYWN0ZXJzXG5wcCQxLnJlZ2V4cF9lYXRMb25lVW5pY29kZVByb3BlcnR5TmFtZU9yVmFsdWUgPSBmdW5jdGlvbihzdGF0ZSkge1xuICByZXR1cm4gdGhpcy5yZWdleHBfZWF0VW5pY29kZVByb3BlcnR5VmFsdWUoc3RhdGUpXG59O1xuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1DaGFyYWN0ZXJDbGFzc1xucHAkMS5yZWdleHBfZWF0Q2hhcmFjdGVyQ2xhc3MgPSBmdW5jdGlvbihzdGF0ZSkge1xuICBpZiAoc3RhdGUuZWF0KDB4NUIgLyogWyAqLykpIHtcbiAgICB2YXIgbmVnYXRlID0gc3RhdGUuZWF0KDB4NUUgLyogXiAqLyk7XG4gICAgdmFyIHJlc3VsdCA9IHRoaXMucmVnZXhwX2NsYXNzQ29udGVudHMoc3RhdGUpO1xuICAgIGlmICghc3RhdGUuZWF0KDB4NUQgLyogXSAqLykpXG4gICAgICB7IHN0YXRlLnJhaXNlKFwiVW50ZXJtaW5hdGVkIGNoYXJhY3RlciBjbGFzc1wiKTsgfVxuICAgIGlmIChuZWdhdGUgJiYgcmVzdWx0ID09PSBDaGFyU2V0U3RyaW5nKVxuICAgICAgeyBzdGF0ZS5yYWlzZShcIk5lZ2F0ZWQgY2hhcmFjdGVyIGNsYXNzIG1heSBjb250YWluIHN0cmluZ3NcIik7IH1cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHJldHVybiBmYWxzZVxufTtcblxuLy8gaHR0cHM6Ly90YzM5LmVzL2VjbWEyNjIvI3Byb2QtQ2xhc3NDb250ZW50c1xuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtQ2xhc3NSYW5nZXNcbnBwJDEucmVnZXhwX2NsYXNzQ29udGVudHMgPSBmdW5jdGlvbihzdGF0ZSkge1xuICBpZiAoc3RhdGUuY3VycmVudCgpID09PSAweDVEIC8qIF0gKi8pIHsgcmV0dXJuIENoYXJTZXRPayB9XG4gIGlmIChzdGF0ZS5zd2l0Y2hWKSB7IHJldHVybiB0aGlzLnJlZ2V4cF9jbGFzc1NldEV4cHJlc3Npb24oc3RhdGUpIH1cbiAgdGhpcy5yZWdleHBfbm9uRW1wdHlDbGFzc1JhbmdlcyhzdGF0ZSk7XG4gIHJldHVybiBDaGFyU2V0T2tcbn07XG5cbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLU5vbmVtcHR5Q2xhc3NSYW5nZXNcbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLU5vbmVtcHR5Q2xhc3NSYW5nZXNOb0Rhc2hcbnBwJDEucmVnZXhwX25vbkVtcHR5Q2xhc3NSYW5nZXMgPSBmdW5jdGlvbihzdGF0ZSkge1xuICB3aGlsZSAodGhpcy5yZWdleHBfZWF0Q2xhc3NBdG9tKHN0YXRlKSkge1xuICAgIHZhciBsZWZ0ID0gc3RhdGUubGFzdEludFZhbHVlO1xuICAgIGlmIChzdGF0ZS5lYXQoMHgyRCAvKiAtICovKSAmJiB0aGlzLnJlZ2V4cF9lYXRDbGFzc0F0b20oc3RhdGUpKSB7XG4gICAgICB2YXIgcmlnaHQgPSBzdGF0ZS5sYXN0SW50VmFsdWU7XG4gICAgICBpZiAoc3RhdGUuc3dpdGNoVSAmJiAobGVmdCA9PT0gLTEgfHwgcmlnaHQgPT09IC0xKSkge1xuICAgICAgICBzdGF0ZS5yYWlzZShcIkludmFsaWQgY2hhcmFjdGVyIGNsYXNzXCIpO1xuICAgICAgfVxuICAgICAgaWYgKGxlZnQgIT09IC0xICYmIHJpZ2h0ICE9PSAtMSAmJiBsZWZ0ID4gcmlnaHQpIHtcbiAgICAgICAgc3RhdGUucmFpc2UoXCJSYW5nZSBvdXQgb2Ygb3JkZXIgaW4gY2hhcmFjdGVyIGNsYXNzXCIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtQ2xhc3NBdG9tXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1DbGFzc0F0b21Ob0Rhc2hcbnBwJDEucmVnZXhwX2VhdENsYXNzQXRvbSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcblxuICBpZiAoc3RhdGUuZWF0KDB4NUMgLyogXFwgKi8pKSB7XG4gICAgaWYgKHRoaXMucmVnZXhwX2VhdENsYXNzRXNjYXBlKHN0YXRlKSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgaWYgKHN0YXRlLnN3aXRjaFUpIHtcbiAgICAgIC8vIE1ha2UgdGhlIHNhbWUgbWVzc2FnZSBhcyBWOC5cbiAgICAgIHZhciBjaCQxID0gc3RhdGUuY3VycmVudCgpO1xuICAgICAgaWYgKGNoJDEgPT09IDB4NjMgLyogYyAqLyB8fCBpc09jdGFsRGlnaXQoY2gkMSkpIHtcbiAgICAgICAgc3RhdGUucmFpc2UoXCJJbnZhbGlkIGNsYXNzIGVzY2FwZVwiKTtcbiAgICAgIH1cbiAgICAgIHN0YXRlLnJhaXNlKFwiSW52YWxpZCBlc2NhcGVcIik7XG4gICAgfVxuICAgIHN0YXRlLnBvcyA9IHN0YXJ0O1xuICB9XG5cbiAgdmFyIGNoID0gc3RhdGUuY3VycmVudCgpO1xuICBpZiAoY2ggIT09IDB4NUQgLyogXSAqLykge1xuICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IGNoO1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1hbm5leEItQ2xhc3NFc2NhcGVcbnBwJDEucmVnZXhwX2VhdENsYXNzRXNjYXBlID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIHN0YXJ0ID0gc3RhdGUucG9zO1xuXG4gIGlmIChzdGF0ZS5lYXQoMHg2MiAvKiBiICovKSkge1xuICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IDB4MDg7IC8qIDxCUz4gKi9cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgaWYgKHN0YXRlLnN3aXRjaFUgJiYgc3RhdGUuZWF0KDB4MkQgLyogLSAqLykpIHtcbiAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSAweDJEOyAvKiAtICovXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIGlmICghc3RhdGUuc3dpdGNoVSAmJiBzdGF0ZS5lYXQoMHg2MyAvKiBjICovKSkge1xuICAgIGlmICh0aGlzLnJlZ2V4cF9lYXRDbGFzc0NvbnRyb2xMZXR0ZXIoc3RhdGUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICBzdGF0ZS5wb3MgPSBzdGFydDtcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgdGhpcy5yZWdleHBfZWF0Q2hhcmFjdGVyQ2xhc3NFc2NhcGUoc3RhdGUpIHx8XG4gICAgdGhpcy5yZWdleHBfZWF0Q2hhcmFjdGVyRXNjYXBlKHN0YXRlKVxuICApXG59O1xuXG4vLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jcHJvZC1DbGFzc1NldEV4cHJlc3Npb25cbi8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNwcm9kLUNsYXNzVW5pb25cbi8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNwcm9kLUNsYXNzSW50ZXJzZWN0aW9uXG4vLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jcHJvZC1DbGFzc1N1YnRyYWN0aW9uXG5wcCQxLnJlZ2V4cF9jbGFzc1NldEV4cHJlc3Npb24gPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgcmVzdWx0ID0gQ2hhclNldE9rLCBzdWJSZXN1bHQ7XG4gIGlmICh0aGlzLnJlZ2V4cF9lYXRDbGFzc1NldFJhbmdlKHN0YXRlKSkgOyBlbHNlIGlmIChzdWJSZXN1bHQgPSB0aGlzLnJlZ2V4cF9lYXRDbGFzc1NldE9wZXJhbmQoc3RhdGUpKSB7XG4gICAgaWYgKHN1YlJlc3VsdCA9PT0gQ2hhclNldFN0cmluZykgeyByZXN1bHQgPSBDaGFyU2V0U3RyaW5nOyB9XG4gICAgLy8gaHR0cHM6Ly90YzM5LmVzL2VjbWEyNjIvI3Byb2QtQ2xhc3NJbnRlcnNlY3Rpb25cbiAgICB2YXIgc3RhcnQgPSBzdGF0ZS5wb3M7XG4gICAgd2hpbGUgKHN0YXRlLmVhdENoYXJzKFsweDI2LCAweDI2XSAvKiAmJiAqLykpIHtcbiAgICAgIGlmIChcbiAgICAgICAgc3RhdGUuY3VycmVudCgpICE9PSAweDI2IC8qICYgKi8gJiZcbiAgICAgICAgKHN1YlJlc3VsdCA9IHRoaXMucmVnZXhwX2VhdENsYXNzU2V0T3BlcmFuZChzdGF0ZSkpXG4gICAgICApIHtcbiAgICAgICAgaWYgKHN1YlJlc3VsdCAhPT0gQ2hhclNldFN0cmluZykgeyByZXN1bHQgPSBDaGFyU2V0T2s7IH1cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICAgIHN0YXRlLnJhaXNlKFwiSW52YWxpZCBjaGFyYWN0ZXIgaW4gY2hhcmFjdGVyIGNsYXNzXCIpO1xuICAgIH1cbiAgICBpZiAoc3RhcnQgIT09IHN0YXRlLnBvcykgeyByZXR1cm4gcmVzdWx0IH1cbiAgICAvLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jcHJvZC1DbGFzc1N1YnRyYWN0aW9uXG4gICAgd2hpbGUgKHN0YXRlLmVhdENoYXJzKFsweDJELCAweDJEXSAvKiAtLSAqLykpIHtcbiAgICAgIGlmICh0aGlzLnJlZ2V4cF9lYXRDbGFzc1NldE9wZXJhbmQoc3RhdGUpKSB7IGNvbnRpbnVlIH1cbiAgICAgIHN0YXRlLnJhaXNlKFwiSW52YWxpZCBjaGFyYWN0ZXIgaW4gY2hhcmFjdGVyIGNsYXNzXCIpO1xuICAgIH1cbiAgICBpZiAoc3RhcnQgIT09IHN0YXRlLnBvcykgeyByZXR1cm4gcmVzdWx0IH1cbiAgfSBlbHNlIHtcbiAgICBzdGF0ZS5yYWlzZShcIkludmFsaWQgY2hhcmFjdGVyIGluIGNoYXJhY3RlciBjbGFzc1wiKTtcbiAgfVxuICAvLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jcHJvZC1DbGFzc1VuaW9uXG4gIGZvciAoOzspIHtcbiAgICBpZiAodGhpcy5yZWdleHBfZWF0Q2xhc3NTZXRSYW5nZShzdGF0ZSkpIHsgY29udGludWUgfVxuICAgIHN1YlJlc3VsdCA9IHRoaXMucmVnZXhwX2VhdENsYXNzU2V0T3BlcmFuZChzdGF0ZSk7XG4gICAgaWYgKCFzdWJSZXN1bHQpIHsgcmV0dXJuIHJlc3VsdCB9XG4gICAgaWYgKHN1YlJlc3VsdCA9PT0gQ2hhclNldFN0cmluZykgeyByZXN1bHQgPSBDaGFyU2V0U3RyaW5nOyB9XG4gIH1cbn07XG5cbi8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNwcm9kLUNsYXNzU2V0UmFuZ2VcbnBwJDEucmVnZXhwX2VhdENsYXNzU2V0UmFuZ2UgPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgc3RhcnQgPSBzdGF0ZS5wb3M7XG4gIGlmICh0aGlzLnJlZ2V4cF9lYXRDbGFzc1NldENoYXJhY3RlcihzdGF0ZSkpIHtcbiAgICB2YXIgbGVmdCA9IHN0YXRlLmxhc3RJbnRWYWx1ZTtcbiAgICBpZiAoc3RhdGUuZWF0KDB4MkQgLyogLSAqLykgJiYgdGhpcy5yZWdleHBfZWF0Q2xhc3NTZXRDaGFyYWN0ZXIoc3RhdGUpKSB7XG4gICAgICB2YXIgcmlnaHQgPSBzdGF0ZS5sYXN0SW50VmFsdWU7XG4gICAgICBpZiAobGVmdCAhPT0gLTEgJiYgcmlnaHQgIT09IC0xICYmIGxlZnQgPiByaWdodCkge1xuICAgICAgICBzdGF0ZS5yYWlzZShcIlJhbmdlIG91dCBvZiBvcmRlciBpbiBjaGFyYWN0ZXIgY2xhc3NcIik7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICBzdGF0ZS5wb3MgPSBzdGFydDtcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn07XG5cbi8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNwcm9kLUNsYXNzU2V0T3BlcmFuZFxucHAkMS5yZWdleHBfZWF0Q2xhc3NTZXRPcGVyYW5kID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgaWYgKHRoaXMucmVnZXhwX2VhdENsYXNzU2V0Q2hhcmFjdGVyKHN0YXRlKSkgeyByZXR1cm4gQ2hhclNldE9rIH1cbiAgcmV0dXJuIHRoaXMucmVnZXhwX2VhdENsYXNzU3RyaW5nRGlzanVuY3Rpb24oc3RhdGUpIHx8IHRoaXMucmVnZXhwX2VhdE5lc3RlZENsYXNzKHN0YXRlKVxufTtcblxuLy8gaHR0cHM6Ly90YzM5LmVzL2VjbWEyNjIvI3Byb2QtTmVzdGVkQ2xhc3NcbnBwJDEucmVnZXhwX2VhdE5lc3RlZENsYXNzID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIHN0YXJ0ID0gc3RhdGUucG9zO1xuICBpZiAoc3RhdGUuZWF0KDB4NUIgLyogWyAqLykpIHtcbiAgICB2YXIgbmVnYXRlID0gc3RhdGUuZWF0KDB4NUUgLyogXiAqLyk7XG4gICAgdmFyIHJlc3VsdCA9IHRoaXMucmVnZXhwX2NsYXNzQ29udGVudHMoc3RhdGUpO1xuICAgIGlmIChzdGF0ZS5lYXQoMHg1RCAvKiBdICovKSkge1xuICAgICAgaWYgKG5lZ2F0ZSAmJiByZXN1bHQgPT09IENoYXJTZXRTdHJpbmcpIHtcbiAgICAgICAgc3RhdGUucmFpc2UoXCJOZWdhdGVkIGNoYXJhY3RlciBjbGFzcyBtYXkgY29udGFpbiBzdHJpbmdzXCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdFxuICAgIH1cbiAgICBzdGF0ZS5wb3MgPSBzdGFydDtcbiAgfVxuICBpZiAoc3RhdGUuZWF0KDB4NUMgLyogXFwgKi8pKSB7XG4gICAgdmFyIHJlc3VsdCQxID0gdGhpcy5yZWdleHBfZWF0Q2hhcmFjdGVyQ2xhc3NFc2NhcGUoc3RhdGUpO1xuICAgIGlmIChyZXN1bHQkMSkge1xuICAgICAgcmV0dXJuIHJlc3VsdCQxXG4gICAgfVxuICAgIHN0YXRlLnBvcyA9IHN0YXJ0O1xuICB9XG4gIHJldHVybiBudWxsXG59O1xuXG4vLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jcHJvZC1DbGFzc1N0cmluZ0Rpc2p1bmN0aW9uXG5wcCQxLnJlZ2V4cF9lYXRDbGFzc1N0cmluZ0Rpc2p1bmN0aW9uID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIHN0YXJ0ID0gc3RhdGUucG9zO1xuICBpZiAoc3RhdGUuZWF0Q2hhcnMoWzB4NUMsIDB4NzFdIC8qIFxccSAqLykpIHtcbiAgICBpZiAoc3RhdGUuZWF0KDB4N0IgLyogeyAqLykpIHtcbiAgICAgIHZhciByZXN1bHQgPSB0aGlzLnJlZ2V4cF9jbGFzc1N0cmluZ0Rpc2p1bmN0aW9uQ29udGVudHMoc3RhdGUpO1xuICAgICAgaWYgKHN0YXRlLmVhdCgweDdEIC8qIH0gKi8pKSB7XG4gICAgICAgIHJldHVybiByZXN1bHRcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTWFrZSB0aGUgc2FtZSBtZXNzYWdlIGFzIFY4LlxuICAgICAgc3RhdGUucmFpc2UoXCJJbnZhbGlkIGVzY2FwZVwiKTtcbiAgICB9XG4gICAgc3RhdGUucG9zID0gc3RhcnQ7XG4gIH1cbiAgcmV0dXJuIG51bGxcbn07XG5cbi8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNwcm9kLUNsYXNzU3RyaW5nRGlzanVuY3Rpb25Db250ZW50c1xucHAkMS5yZWdleHBfY2xhc3NTdHJpbmdEaXNqdW5jdGlvbkNvbnRlbnRzID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIHJlc3VsdCA9IHRoaXMucmVnZXhwX2NsYXNzU3RyaW5nKHN0YXRlKTtcbiAgd2hpbGUgKHN0YXRlLmVhdCgweDdDIC8qIHwgKi8pKSB7XG4gICAgaWYgKHRoaXMucmVnZXhwX2NsYXNzU3RyaW5nKHN0YXRlKSA9PT0gQ2hhclNldFN0cmluZykgeyByZXN1bHQgPSBDaGFyU2V0U3RyaW5nOyB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufTtcblxuLy8gaHR0cHM6Ly90YzM5LmVzL2VjbWEyNjIvI3Byb2QtQ2xhc3NTdHJpbmdcbi8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNwcm9kLU5vbkVtcHR5Q2xhc3NTdHJpbmdcbnBwJDEucmVnZXhwX2NsYXNzU3RyaW5nID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIGNvdW50ID0gMDtcbiAgd2hpbGUgKHRoaXMucmVnZXhwX2VhdENsYXNzU2V0Q2hhcmFjdGVyKHN0YXRlKSkgeyBjb3VudCsrOyB9XG4gIHJldHVybiBjb3VudCA9PT0gMSA/IENoYXJTZXRPayA6IENoYXJTZXRTdHJpbmdcbn07XG5cbi8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNwcm9kLUNsYXNzU2V0Q2hhcmFjdGVyXG5wcCQxLnJlZ2V4cF9lYXRDbGFzc1NldENoYXJhY3RlciA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzdGFydCA9IHN0YXRlLnBvcztcbiAgaWYgKHN0YXRlLmVhdCgweDVDIC8qIFxcICovKSkge1xuICAgIGlmIChcbiAgICAgIHRoaXMucmVnZXhwX2VhdENoYXJhY3RlckVzY2FwZShzdGF0ZSkgfHxcbiAgICAgIHRoaXMucmVnZXhwX2VhdENsYXNzU2V0UmVzZXJ2ZWRQdW5jdHVhdG9yKHN0YXRlKVxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgaWYgKHN0YXRlLmVhdCgweDYyIC8qIGIgKi8pKSB7XG4gICAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSAweDA4OyAvKiA8QlM+ICovXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICBzdGF0ZS5wb3MgPSBzdGFydDtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICB2YXIgY2ggPSBzdGF0ZS5jdXJyZW50KCk7XG4gIGlmIChjaCA8IDAgfHwgY2ggPT09IHN0YXRlLmxvb2thaGVhZCgpICYmIGlzQ2xhc3NTZXRSZXNlcnZlZERvdWJsZVB1bmN0dWF0b3JDaGFyYWN0ZXIoY2gpKSB7IHJldHVybiBmYWxzZSB9XG4gIGlmIChpc0NsYXNzU2V0U3ludGF4Q2hhcmFjdGVyKGNoKSkgeyByZXR1cm4gZmFsc2UgfVxuICBzdGF0ZS5hZHZhbmNlKCk7XG4gIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IGNoO1xuICByZXR1cm4gdHJ1ZVxufTtcblxuLy8gaHR0cHM6Ly90YzM5LmVzL2VjbWEyNjIvI3Byb2QtQ2xhc3NTZXRSZXNlcnZlZERvdWJsZVB1bmN0dWF0b3JcbmZ1bmN0aW9uIGlzQ2xhc3NTZXRSZXNlcnZlZERvdWJsZVB1bmN0dWF0b3JDaGFyYWN0ZXIoY2gpIHtcbiAgcmV0dXJuIChcbiAgICBjaCA9PT0gMHgyMSAvKiAhICovIHx8XG4gICAgY2ggPj0gMHgyMyAvKiAjICovICYmIGNoIDw9IDB4MjYgLyogJiAqLyB8fFxuICAgIGNoID49IDB4MkEgLyogKiAqLyAmJiBjaCA8PSAweDJDIC8qICwgKi8gfHxcbiAgICBjaCA9PT0gMHgyRSAvKiAuICovIHx8XG4gICAgY2ggPj0gMHgzQSAvKiA6ICovICYmIGNoIDw9IDB4NDAgLyogQCAqLyB8fFxuICAgIGNoID09PSAweDVFIC8qIF4gKi8gfHxcbiAgICBjaCA9PT0gMHg2MCAvKiBgICovIHx8XG4gICAgY2ggPT09IDB4N0UgLyogfiAqL1xuICApXG59XG5cbi8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNwcm9kLUNsYXNzU2V0U3ludGF4Q2hhcmFjdGVyXG5mdW5jdGlvbiBpc0NsYXNzU2V0U3ludGF4Q2hhcmFjdGVyKGNoKSB7XG4gIHJldHVybiAoXG4gICAgY2ggPT09IDB4MjggLyogKCAqLyB8fFxuICAgIGNoID09PSAweDI5IC8qICkgKi8gfHxcbiAgICBjaCA9PT0gMHgyRCAvKiAtICovIHx8XG4gICAgY2ggPT09IDB4MkYgLyogLyAqLyB8fFxuICAgIGNoID49IDB4NUIgLyogWyAqLyAmJiBjaCA8PSAweDVEIC8qIF0gKi8gfHxcbiAgICBjaCA+PSAweDdCIC8qIHsgKi8gJiYgY2ggPD0gMHg3RCAvKiB9ICovXG4gIClcbn1cblxuLy8gaHR0cHM6Ly90YzM5LmVzL2VjbWEyNjIvI3Byb2QtQ2xhc3NTZXRSZXNlcnZlZFB1bmN0dWF0b3JcbnBwJDEucmVnZXhwX2VhdENsYXNzU2V0UmVzZXJ2ZWRQdW5jdHVhdG9yID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIGNoID0gc3RhdGUuY3VycmVudCgpO1xuICBpZiAoaXNDbGFzc1NldFJlc2VydmVkUHVuY3R1YXRvcihjaCkpIHtcbiAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSBjaDtcbiAgICBzdGF0ZS5hZHZhbmNlKCk7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn07XG5cbi8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNwcm9kLUNsYXNzU2V0UmVzZXJ2ZWRQdW5jdHVhdG9yXG5mdW5jdGlvbiBpc0NsYXNzU2V0UmVzZXJ2ZWRQdW5jdHVhdG9yKGNoKSB7XG4gIHJldHVybiAoXG4gICAgY2ggPT09IDB4MjEgLyogISAqLyB8fFxuICAgIGNoID09PSAweDIzIC8qICMgKi8gfHxcbiAgICBjaCA9PT0gMHgyNSAvKiAlICovIHx8XG4gICAgY2ggPT09IDB4MjYgLyogJiAqLyB8fFxuICAgIGNoID09PSAweDJDIC8qICwgKi8gfHxcbiAgICBjaCA9PT0gMHgyRCAvKiAtICovIHx8XG4gICAgY2ggPj0gMHgzQSAvKiA6ICovICYmIGNoIDw9IDB4M0UgLyogPiAqLyB8fFxuICAgIGNoID09PSAweDQwIC8qIEAgKi8gfHxcbiAgICBjaCA9PT0gMHg2MCAvKiBgICovIHx8XG4gICAgY2ggPT09IDB4N0UgLyogfiAqL1xuICApXG59XG5cbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLWFubmV4Qi1DbGFzc0NvbnRyb2xMZXR0ZXJcbnBwJDEucmVnZXhwX2VhdENsYXNzQ29udHJvbExldHRlciA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBjaCA9IHN0YXRlLmN1cnJlbnQoKTtcbiAgaWYgKGlzRGVjaW1hbERpZ2l0KGNoKSB8fCBjaCA9PT0gMHg1RiAvKiBfICovKSB7XG4gICAgc3RhdGUubGFzdEludFZhbHVlID0gY2ggJSAweDIwO1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHJldHVybiBmYWxzZVxufTtcblxuLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtSGV4RXNjYXBlU2VxdWVuY2VcbnBwJDEucmVnZXhwX2VhdEhleEVzY2FwZVNlcXVlbmNlID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIHN0YXJ0ID0gc3RhdGUucG9zO1xuICBpZiAoc3RhdGUuZWF0KDB4NzggLyogeCAqLykpIHtcbiAgICBpZiAodGhpcy5yZWdleHBfZWF0Rml4ZWRIZXhEaWdpdHMoc3RhdGUsIDIpKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICBpZiAoc3RhdGUuc3dpdGNoVSkge1xuICAgICAgc3RhdGUucmFpc2UoXCJJbnZhbGlkIGVzY2FwZVwiKTtcbiAgICB9XG4gICAgc3RhdGUucG9zID0gc3RhcnQ7XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1EZWNpbWFsRGlnaXRzXG5wcCQxLnJlZ2V4cF9lYXREZWNpbWFsRGlnaXRzID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIHN0YXJ0ID0gc3RhdGUucG9zO1xuICB2YXIgY2ggPSAwO1xuICBzdGF0ZS5sYXN0SW50VmFsdWUgPSAwO1xuICB3aGlsZSAoaXNEZWNpbWFsRGlnaXQoY2ggPSBzdGF0ZS5jdXJyZW50KCkpKSB7XG4gICAgc3RhdGUubGFzdEludFZhbHVlID0gMTAgKiBzdGF0ZS5sYXN0SW50VmFsdWUgKyAoY2ggLSAweDMwIC8qIDAgKi8pO1xuICAgIHN0YXRlLmFkdmFuY2UoKTtcbiAgfVxuICByZXR1cm4gc3RhdGUucG9zICE9PSBzdGFydFxufTtcbmZ1bmN0aW9uIGlzRGVjaW1hbERpZ2l0KGNoKSB7XG4gIHJldHVybiBjaCA+PSAweDMwIC8qIDAgKi8gJiYgY2ggPD0gMHgzOSAvKiA5ICovXG59XG5cbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLUhleERpZ2l0c1xucHAkMS5yZWdleHBfZWF0SGV4RGlnaXRzID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIHN0YXJ0ID0gc3RhdGUucG9zO1xuICB2YXIgY2ggPSAwO1xuICBzdGF0ZS5sYXN0SW50VmFsdWUgPSAwO1xuICB3aGlsZSAoaXNIZXhEaWdpdChjaCA9IHN0YXRlLmN1cnJlbnQoKSkpIHtcbiAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSAxNiAqIHN0YXRlLmxhc3RJbnRWYWx1ZSArIGhleFRvSW50KGNoKTtcbiAgICBzdGF0ZS5hZHZhbmNlKCk7XG4gIH1cbiAgcmV0dXJuIHN0YXRlLnBvcyAhPT0gc3RhcnRcbn07XG5mdW5jdGlvbiBpc0hleERpZ2l0KGNoKSB7XG4gIHJldHVybiAoXG4gICAgKGNoID49IDB4MzAgLyogMCAqLyAmJiBjaCA8PSAweDM5IC8qIDkgKi8pIHx8XG4gICAgKGNoID49IDB4NDEgLyogQSAqLyAmJiBjaCA8PSAweDQ2IC8qIEYgKi8pIHx8XG4gICAgKGNoID49IDB4NjEgLyogYSAqLyAmJiBjaCA8PSAweDY2IC8qIGYgKi8pXG4gIClcbn1cbmZ1bmN0aW9uIGhleFRvSW50KGNoKSB7XG4gIGlmIChjaCA+PSAweDQxIC8qIEEgKi8gJiYgY2ggPD0gMHg0NiAvKiBGICovKSB7XG4gICAgcmV0dXJuIDEwICsgKGNoIC0gMHg0MSAvKiBBICovKVxuICB9XG4gIGlmIChjaCA+PSAweDYxIC8qIGEgKi8gJiYgY2ggPD0gMHg2NiAvKiBmICovKSB7XG4gICAgcmV0dXJuIDEwICsgKGNoIC0gMHg2MSAvKiBhICovKVxuICB9XG4gIHJldHVybiBjaCAtIDB4MzAgLyogMCAqL1xufVxuXG4vLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzguMC8jcHJvZC1hbm5leEItTGVnYWN5T2N0YWxFc2NhcGVTZXF1ZW5jZVxuLy8gQWxsb3dzIG9ubHkgMC0zNzcob2N0YWwpIGkuZS4gMC0yNTUoZGVjaW1hbCkuXG5wcCQxLnJlZ2V4cF9lYXRMZWdhY3lPY3RhbEVzY2FwZVNlcXVlbmNlID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgaWYgKHRoaXMucmVnZXhwX2VhdE9jdGFsRGlnaXQoc3RhdGUpKSB7XG4gICAgdmFyIG4xID0gc3RhdGUubGFzdEludFZhbHVlO1xuICAgIGlmICh0aGlzLnJlZ2V4cF9lYXRPY3RhbERpZ2l0KHN0YXRlKSkge1xuICAgICAgdmFyIG4yID0gc3RhdGUubGFzdEludFZhbHVlO1xuICAgICAgaWYgKG4xIDw9IDMgJiYgdGhpcy5yZWdleHBfZWF0T2N0YWxEaWdpdChzdGF0ZSkpIHtcbiAgICAgICAgc3RhdGUubGFzdEludFZhbHVlID0gbjEgKiA2NCArIG4yICogOCArIHN0YXRlLmxhc3RJbnRWYWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IG4xICogOCArIG4yO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdGF0ZS5sYXN0SW50VmFsdWUgPSBuMTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn07XG5cbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLU9jdGFsRGlnaXRcbnBwJDEucmVnZXhwX2VhdE9jdGFsRGlnaXQgPSBmdW5jdGlvbihzdGF0ZSkge1xuICB2YXIgY2ggPSBzdGF0ZS5jdXJyZW50KCk7XG4gIGlmIChpc09jdGFsRGlnaXQoY2gpKSB7XG4gICAgc3RhdGUubGFzdEludFZhbHVlID0gY2ggLSAweDMwOyAvKiAwICovXG4gICAgc3RhdGUuYWR2YW5jZSgpO1xuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgc3RhdGUubGFzdEludFZhbHVlID0gMDtcbiAgcmV0dXJuIGZhbHNlXG59O1xuZnVuY3Rpb24gaXNPY3RhbERpZ2l0KGNoKSB7XG4gIHJldHVybiBjaCA+PSAweDMwIC8qIDAgKi8gJiYgY2ggPD0gMHgzNyAvKiA3ICovXG59XG5cbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLUhleDREaWdpdHNcbi8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOC4wLyNwcm9kLUhleERpZ2l0XG4vLyBBbmQgSGV4RGlnaXQgSGV4RGlnaXQgaW4gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi84LjAvI3Byb2QtSGV4RXNjYXBlU2VxdWVuY2VcbnBwJDEucmVnZXhwX2VhdEZpeGVkSGV4RGlnaXRzID0gZnVuY3Rpb24oc3RhdGUsIGxlbmd0aCkge1xuICB2YXIgc3RhcnQgPSBzdGF0ZS5wb3M7XG4gIHN0YXRlLmxhc3RJbnRWYWx1ZSA9IDA7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgY2ggPSBzdGF0ZS5jdXJyZW50KCk7XG4gICAgaWYgKCFpc0hleERpZ2l0KGNoKSkge1xuICAgICAgc3RhdGUucG9zID0gc3RhcnQ7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgc3RhdGUubGFzdEludFZhbHVlID0gMTYgKiBzdGF0ZS5sYXN0SW50VmFsdWUgKyBoZXhUb0ludChjaCk7XG4gICAgc3RhdGUuYWR2YW5jZSgpO1xuICB9XG4gIHJldHVybiB0cnVlXG59O1xuXG4vLyBPYmplY3QgdHlwZSB1c2VkIHRvIHJlcHJlc2VudCB0b2tlbnMuIE5vdGUgdGhhdCBub3JtYWxseSwgdG9rZW5zXG4vLyBzaW1wbHkgZXhpc3QgYXMgcHJvcGVydGllcyBvbiB0aGUgcGFyc2VyIG9iamVjdC4gVGhpcyBpcyBvbmx5XG4vLyB1c2VkIGZvciB0aGUgb25Ub2tlbiBjYWxsYmFjayBhbmQgdGhlIGV4dGVybmFsIHRva2VuaXplci5cblxudmFyIFRva2VuID0gZnVuY3Rpb24gVG9rZW4ocCkge1xuICB0aGlzLnR5cGUgPSBwLnR5cGU7XG4gIHRoaXMudmFsdWUgPSBwLnZhbHVlO1xuICB0aGlzLnN0YXJ0ID0gcC5zdGFydDtcbiAgdGhpcy5lbmQgPSBwLmVuZDtcbiAgaWYgKHAub3B0aW9ucy5sb2NhdGlvbnMpXG4gICAgeyB0aGlzLmxvYyA9IG5ldyBTb3VyY2VMb2NhdGlvbihwLCBwLnN0YXJ0TG9jLCBwLmVuZExvYyk7IH1cbiAgaWYgKHAub3B0aW9ucy5yYW5nZXMpXG4gICAgeyB0aGlzLnJhbmdlID0gW3Auc3RhcnQsIHAuZW5kXTsgfVxufTtcblxuLy8gIyMgVG9rZW5pemVyXG5cbnZhciBwcCA9IFBhcnNlci5wcm90b3R5cGU7XG5cbi8vIE1vdmUgdG8gdGhlIG5leHQgdG9rZW5cblxucHAubmV4dCA9IGZ1bmN0aW9uKGlnbm9yZUVzY2FwZVNlcXVlbmNlSW5LZXl3b3JkKSB7XG4gIGlmICghaWdub3JlRXNjYXBlU2VxdWVuY2VJbktleXdvcmQgJiYgdGhpcy50eXBlLmtleXdvcmQgJiYgdGhpcy5jb250YWluc0VzYylcbiAgICB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZSh0aGlzLnN0YXJ0LCBcIkVzY2FwZSBzZXF1ZW5jZSBpbiBrZXl3b3JkIFwiICsgdGhpcy50eXBlLmtleXdvcmQpOyB9XG4gIGlmICh0aGlzLm9wdGlvbnMub25Ub2tlbilcbiAgICB7IHRoaXMub3B0aW9ucy5vblRva2VuKG5ldyBUb2tlbih0aGlzKSk7IH1cblxuICB0aGlzLmxhc3RUb2tFbmQgPSB0aGlzLmVuZDtcbiAgdGhpcy5sYXN0VG9rU3RhcnQgPSB0aGlzLnN0YXJ0O1xuICB0aGlzLmxhc3RUb2tFbmRMb2MgPSB0aGlzLmVuZExvYztcbiAgdGhpcy5sYXN0VG9rU3RhcnRMb2MgPSB0aGlzLnN0YXJ0TG9jO1xuICB0aGlzLm5leHRUb2tlbigpO1xufTtcblxucHAuZ2V0VG9rZW4gPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5uZXh0KCk7XG4gIHJldHVybiBuZXcgVG9rZW4odGhpcylcbn07XG5cbi8vIElmIHdlJ3JlIGluIGFuIEVTNiBlbnZpcm9ubWVudCwgbWFrZSBwYXJzZXJzIGl0ZXJhYmxlXG5pZiAodHlwZW9mIFN5bWJvbCAhPT0gXCJ1bmRlZmluZWRcIilcbiAgeyBwcFtTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoaXMkMSQxID0gdGhpcztcblxuICAgIHJldHVybiB7XG4gICAgICBuZXh0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB0b2tlbiA9IHRoaXMkMSQxLmdldFRva2VuKCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZG9uZTogdG9rZW4udHlwZSA9PT0gdHlwZXMkMS5lb2YsXG4gICAgICAgICAgdmFsdWU6IHRva2VuXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07IH1cblxuLy8gVG9nZ2xlIHN0cmljdCBtb2RlLiBSZS1yZWFkcyB0aGUgbmV4dCBudW1iZXIgb3Igc3RyaW5nIHRvIHBsZWFzZVxuLy8gcGVkYW50aWMgdGVzdHMgKGBcInVzZSBzdHJpY3RcIjsgMDEwO2Agc2hvdWxkIGZhaWwpLlxuXG4vLyBSZWFkIGEgc2luZ2xlIHRva2VuLCB1cGRhdGluZyB0aGUgcGFyc2VyIG9iamVjdCdzIHRva2VuLXJlbGF0ZWRcbi8vIHByb3BlcnRpZXMuXG5cbnBwLm5leHRUb2tlbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY3VyQ29udGV4dCA9IHRoaXMuY3VyQ29udGV4dCgpO1xuICBpZiAoIWN1ckNvbnRleHQgfHwgIWN1ckNvbnRleHQucHJlc2VydmVTcGFjZSkgeyB0aGlzLnNraXBTcGFjZSgpOyB9XG5cbiAgdGhpcy5zdGFydCA9IHRoaXMucG9zO1xuICBpZiAodGhpcy5vcHRpb25zLmxvY2F0aW9ucykgeyB0aGlzLnN0YXJ0TG9jID0gdGhpcy5jdXJQb3NpdGlvbigpOyB9XG4gIGlmICh0aGlzLnBvcyA+PSB0aGlzLmlucHV0Lmxlbmd0aCkgeyByZXR1cm4gdGhpcy5maW5pc2hUb2tlbih0eXBlcyQxLmVvZikgfVxuXG4gIGlmIChjdXJDb250ZXh0Lm92ZXJyaWRlKSB7IHJldHVybiBjdXJDb250ZXh0Lm92ZXJyaWRlKHRoaXMpIH1cbiAgZWxzZSB7IHRoaXMucmVhZFRva2VuKHRoaXMuZnVsbENoYXJDb2RlQXRQb3MoKSk7IH1cbn07XG5cbnBwLnJlYWRUb2tlbiA9IGZ1bmN0aW9uKGNvZGUpIHtcbiAgLy8gSWRlbnRpZmllciBvciBrZXl3b3JkLiAnXFx1WFhYWCcgc2VxdWVuY2VzIGFyZSBhbGxvd2VkIGluXG4gIC8vIGlkZW50aWZpZXJzLCBzbyAnXFwnIGFsc28gZGlzcGF0Y2hlcyB0byB0aGF0LlxuICBpZiAoaXNJZGVudGlmaWVyU3RhcnQoY29kZSwgdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDYpIHx8IGNvZGUgPT09IDkyIC8qICdcXCcgKi8pXG4gICAgeyByZXR1cm4gdGhpcy5yZWFkV29yZCgpIH1cblxuICByZXR1cm4gdGhpcy5nZXRUb2tlbkZyb21Db2RlKGNvZGUpXG59O1xuXG5wcC5mdWxsQ2hhckNvZGVBdFBvcyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY29kZSA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyk7XG4gIGlmIChjb2RlIDw9IDB4ZDdmZiB8fCBjb2RlID49IDB4ZGMwMCkgeyByZXR1cm4gY29kZSB9XG4gIHZhciBuZXh0ID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMSk7XG4gIHJldHVybiBuZXh0IDw9IDB4ZGJmZiB8fCBuZXh0ID49IDB4ZTAwMCA/IGNvZGUgOiAoY29kZSA8PCAxMCkgKyBuZXh0IC0gMHgzNWZkYzAwXG59O1xuXG5wcC5za2lwQmxvY2tDb21tZW50ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBzdGFydExvYyA9IHRoaXMub3B0aW9ucy5vbkNvbW1lbnQgJiYgdGhpcy5jdXJQb3NpdGlvbigpO1xuICB2YXIgc3RhcnQgPSB0aGlzLnBvcywgZW5kID0gdGhpcy5pbnB1dC5pbmRleE9mKFwiKi9cIiwgdGhpcy5wb3MgKz0gMik7XG4gIGlmIChlbmQgPT09IC0xKSB7IHRoaXMucmFpc2UodGhpcy5wb3MgLSAyLCBcIlVudGVybWluYXRlZCBjb21tZW50XCIpOyB9XG4gIHRoaXMucG9zID0gZW5kICsgMjtcbiAgaWYgKHRoaXMub3B0aW9ucy5sb2NhdGlvbnMpIHtcbiAgICBmb3IgKHZhciBuZXh0QnJlYWsgPSAodm9pZCAwKSwgcG9zID0gc3RhcnQ7IChuZXh0QnJlYWsgPSBuZXh0TGluZUJyZWFrKHRoaXMuaW5wdXQsIHBvcywgdGhpcy5wb3MpKSA+IC0xOykge1xuICAgICAgKyt0aGlzLmN1ckxpbmU7XG4gICAgICBwb3MgPSB0aGlzLmxpbmVTdGFydCA9IG5leHRCcmVhaztcbiAgICB9XG4gIH1cbiAgaWYgKHRoaXMub3B0aW9ucy5vbkNvbW1lbnQpXG4gICAgeyB0aGlzLm9wdGlvbnMub25Db21tZW50KHRydWUsIHRoaXMuaW5wdXQuc2xpY2Uoc3RhcnQgKyAyLCBlbmQpLCBzdGFydCwgdGhpcy5wb3MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydExvYywgdGhpcy5jdXJQb3NpdGlvbigpKTsgfVxufTtcblxucHAuc2tpcExpbmVDb21tZW50ID0gZnVuY3Rpb24oc3RhcnRTa2lwKSB7XG4gIHZhciBzdGFydCA9IHRoaXMucG9zO1xuICB2YXIgc3RhcnRMb2MgPSB0aGlzLm9wdGlvbnMub25Db21tZW50ICYmIHRoaXMuY3VyUG9zaXRpb24oKTtcbiAgdmFyIGNoID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICs9IHN0YXJ0U2tpcCk7XG4gIHdoaWxlICh0aGlzLnBvcyA8IHRoaXMuaW5wdXQubGVuZ3RoICYmICFpc05ld0xpbmUoY2gpKSB7XG4gICAgY2ggPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQoKyt0aGlzLnBvcyk7XG4gIH1cbiAgaWYgKHRoaXMub3B0aW9ucy5vbkNvbW1lbnQpXG4gICAgeyB0aGlzLm9wdGlvbnMub25Db21tZW50KGZhbHNlLCB0aGlzLmlucHV0LnNsaWNlKHN0YXJ0ICsgc3RhcnRTa2lwLCB0aGlzLnBvcyksIHN0YXJ0LCB0aGlzLnBvcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0TG9jLCB0aGlzLmN1clBvc2l0aW9uKCkpOyB9XG59O1xuXG4vLyBDYWxsZWQgYXQgdGhlIHN0YXJ0IG9mIHRoZSBwYXJzZSBhbmQgYWZ0ZXIgZXZlcnkgdG9rZW4uIFNraXBzXG4vLyB3aGl0ZXNwYWNlIGFuZCBjb21tZW50cywgYW5kLlxuXG5wcC5za2lwU3BhY2UgPSBmdW5jdGlvbigpIHtcbiAgbG9vcDogd2hpbGUgKHRoaXMucG9zIDwgdGhpcy5pbnB1dC5sZW5ndGgpIHtcbiAgICB2YXIgY2ggPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MpO1xuICAgIHN3aXRjaCAoY2gpIHtcbiAgICBjYXNlIDMyOiBjYXNlIDE2MDogLy8gJyAnXG4gICAgICArK3RoaXMucG9zO1xuICAgICAgYnJlYWtcbiAgICBjYXNlIDEzOlxuICAgICAgaWYgKHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyArIDEpID09PSAxMCkge1xuICAgICAgICArK3RoaXMucG9zO1xuICAgICAgfVxuICAgIGNhc2UgMTA6IGNhc2UgODIzMjogY2FzZSA4MjMzOlxuICAgICAgKyt0aGlzLnBvcztcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMubG9jYXRpb25zKSB7XG4gICAgICAgICsrdGhpcy5jdXJMaW5lO1xuICAgICAgICB0aGlzLmxpbmVTdGFydCA9IHRoaXMucG9zO1xuICAgICAgfVxuICAgICAgYnJlYWtcbiAgICBjYXNlIDQ3OiAvLyAnLydcbiAgICAgIHN3aXRjaCAodGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMSkpIHtcbiAgICAgIGNhc2UgNDI6IC8vICcqJ1xuICAgICAgICB0aGlzLnNraXBCbG9ja0NvbW1lbnQoKTtcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgNDc6XG4gICAgICAgIHRoaXMuc2tpcExpbmVDb21tZW50KDIpO1xuICAgICAgICBicmVha1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYnJlYWsgbG9vcFxuICAgICAgfVxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgaWYgKGNoID4gOCAmJiBjaCA8IDE0IHx8IGNoID49IDU3NjAgJiYgbm9uQVNDSUl3aGl0ZXNwYWNlLnRlc3QoU3RyaW5nLmZyb21DaGFyQ29kZShjaCkpKSB7XG4gICAgICAgICsrdGhpcy5wb3M7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhayBsb29wXG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4vLyBDYWxsZWQgYXQgdGhlIGVuZCBvZiBldmVyeSB0b2tlbi4gU2V0cyBgZW5kYCwgYHZhbGAsIGFuZFxuLy8gbWFpbnRhaW5zIGBjb250ZXh0YCBhbmQgYGV4cHJBbGxvd2VkYCwgYW5kIHNraXBzIHRoZSBzcGFjZSBhZnRlclxuLy8gdGhlIHRva2VuLCBzbyB0aGF0IHRoZSBuZXh0IG9uZSdzIGBzdGFydGAgd2lsbCBwb2ludCBhdCB0aGVcbi8vIHJpZ2h0IHBvc2l0aW9uLlxuXG5wcC5maW5pc2hUb2tlbiA9IGZ1bmN0aW9uKHR5cGUsIHZhbCkge1xuICB0aGlzLmVuZCA9IHRoaXMucG9zO1xuICBpZiAodGhpcy5vcHRpb25zLmxvY2F0aW9ucykgeyB0aGlzLmVuZExvYyA9IHRoaXMuY3VyUG9zaXRpb24oKTsgfVxuICB2YXIgcHJldlR5cGUgPSB0aGlzLnR5cGU7XG4gIHRoaXMudHlwZSA9IHR5cGU7XG4gIHRoaXMudmFsdWUgPSB2YWw7XG5cbiAgdGhpcy51cGRhdGVDb250ZXh0KHByZXZUeXBlKTtcbn07XG5cbi8vICMjIyBUb2tlbiByZWFkaW5nXG5cbi8vIFRoaXMgaXMgdGhlIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHRvIGZldGNoIHRoZSBuZXh0IHRva2VuLiBJdFxuLy8gaXMgc29tZXdoYXQgb2JzY3VyZSwgYmVjYXVzZSBpdCB3b3JrcyBpbiBjaGFyYWN0ZXIgY29kZXMgcmF0aGVyXG4vLyB0aGFuIGNoYXJhY3RlcnMsIGFuZCBiZWNhdXNlIG9wZXJhdG9yIHBhcnNpbmcgaGFzIGJlZW4gaW5saW5lZFxuLy8gaW50byBpdC5cbi8vXG4vLyBBbGwgaW4gdGhlIG5hbWUgb2Ygc3BlZWQuXG4vL1xucHAucmVhZFRva2VuX2RvdCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbmV4dCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyArIDEpO1xuICBpZiAobmV4dCA+PSA0OCAmJiBuZXh0IDw9IDU3KSB7IHJldHVybiB0aGlzLnJlYWROdW1iZXIodHJ1ZSkgfVxuICB2YXIgbmV4dDIgPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MgKyAyKTtcbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2ICYmIG5leHQgPT09IDQ2ICYmIG5leHQyID09PSA0NikgeyAvLyA0NiA9IGRvdCAnLidcbiAgICB0aGlzLnBvcyArPSAzO1xuICAgIHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEuZWxsaXBzaXMpXG4gIH0gZWxzZSB7XG4gICAgKyt0aGlzLnBvcztcbiAgICByZXR1cm4gdGhpcy5maW5pc2hUb2tlbih0eXBlcyQxLmRvdClcbiAgfVxufTtcblxucHAucmVhZFRva2VuX3NsYXNoID0gZnVuY3Rpb24oKSB7IC8vICcvJ1xuICB2YXIgbmV4dCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyArIDEpO1xuICBpZiAodGhpcy5leHByQWxsb3dlZCkgeyArK3RoaXMucG9zOyByZXR1cm4gdGhpcy5yZWFkUmVnZXhwKCkgfVxuICBpZiAobmV4dCA9PT0gNjEpIHsgcmV0dXJuIHRoaXMuZmluaXNoT3AodHlwZXMkMS5hc3NpZ24sIDIpIH1cbiAgcmV0dXJuIHRoaXMuZmluaXNoT3AodHlwZXMkMS5zbGFzaCwgMSlcbn07XG5cbnBwLnJlYWRUb2tlbl9tdWx0X21vZHVsb19leHAgPSBmdW5jdGlvbihjb2RlKSB7IC8vICclKidcbiAgdmFyIG5leHQgPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MgKyAxKTtcbiAgdmFyIHNpemUgPSAxO1xuICB2YXIgdG9rZW50eXBlID0gY29kZSA9PT0gNDIgPyB0eXBlcyQxLnN0YXIgOiB0eXBlcyQxLm1vZHVsbztcblxuICAvLyBleHBvbmVudGlhdGlvbiBvcGVyYXRvciAqKiBhbmQgKio9XG4gIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNyAmJiBjb2RlID09PSA0MiAmJiBuZXh0ID09PSA0Mikge1xuICAgICsrc2l6ZTtcbiAgICB0b2tlbnR5cGUgPSB0eXBlcyQxLnN0YXJzdGFyO1xuICAgIG5leHQgPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MgKyAyKTtcbiAgfVxuXG4gIGlmIChuZXh0ID09PSA2MSkgeyByZXR1cm4gdGhpcy5maW5pc2hPcCh0eXBlcyQxLmFzc2lnbiwgc2l6ZSArIDEpIH1cbiAgcmV0dXJuIHRoaXMuZmluaXNoT3AodG9rZW50eXBlLCBzaXplKVxufTtcblxucHAucmVhZFRva2VuX3BpcGVfYW1wID0gZnVuY3Rpb24oY29kZSkgeyAvLyAnfCYnXG4gIHZhciBuZXh0ID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMSk7XG4gIGlmIChuZXh0ID09PSBjb2RlKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSAxMikge1xuICAgICAgdmFyIG5leHQyID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMik7XG4gICAgICBpZiAobmV4dDIgPT09IDYxKSB7IHJldHVybiB0aGlzLmZpbmlzaE9wKHR5cGVzJDEuYXNzaWduLCAzKSB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmZpbmlzaE9wKGNvZGUgPT09IDEyNCA/IHR5cGVzJDEubG9naWNhbE9SIDogdHlwZXMkMS5sb2dpY2FsQU5ELCAyKVxuICB9XG4gIGlmIChuZXh0ID09PSA2MSkgeyByZXR1cm4gdGhpcy5maW5pc2hPcCh0eXBlcyQxLmFzc2lnbiwgMikgfVxuICByZXR1cm4gdGhpcy5maW5pc2hPcChjb2RlID09PSAxMjQgPyB0eXBlcyQxLmJpdHdpc2VPUiA6IHR5cGVzJDEuYml0d2lzZUFORCwgMSlcbn07XG5cbnBwLnJlYWRUb2tlbl9jYXJldCA9IGZ1bmN0aW9uKCkgeyAvLyAnXidcbiAgdmFyIG5leHQgPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MgKyAxKTtcbiAgaWYgKG5leHQgPT09IDYxKSB7IHJldHVybiB0aGlzLmZpbmlzaE9wKHR5cGVzJDEuYXNzaWduLCAyKSB9XG4gIHJldHVybiB0aGlzLmZpbmlzaE9wKHR5cGVzJDEuYml0d2lzZVhPUiwgMSlcbn07XG5cbnBwLnJlYWRUb2tlbl9wbHVzX21pbiA9IGZ1bmN0aW9uKGNvZGUpIHsgLy8gJystJ1xuICB2YXIgbmV4dCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyArIDEpO1xuICBpZiAobmV4dCA9PT0gY29kZSkge1xuICAgIGlmIChuZXh0ID09PSA0NSAmJiAhdGhpcy5pbk1vZHVsZSAmJiB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MgKyAyKSA9PT0gNjIgJiZcbiAgICAgICAgKHRoaXMubGFzdFRva0VuZCA9PT0gMCB8fCBsaW5lQnJlYWsudGVzdCh0aGlzLmlucHV0LnNsaWNlKHRoaXMubGFzdFRva0VuZCwgdGhpcy5wb3MpKSkpIHtcbiAgICAgIC8vIEEgYC0tPmAgbGluZSBjb21tZW50XG4gICAgICB0aGlzLnNraXBMaW5lQ29tbWVudCgzKTtcbiAgICAgIHRoaXMuc2tpcFNwYWNlKCk7XG4gICAgICByZXR1cm4gdGhpcy5uZXh0VG9rZW4oKVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5maW5pc2hPcCh0eXBlcyQxLmluY0RlYywgMilcbiAgfVxuICBpZiAobmV4dCA9PT0gNjEpIHsgcmV0dXJuIHRoaXMuZmluaXNoT3AodHlwZXMkMS5hc3NpZ24sIDIpIH1cbiAgcmV0dXJuIHRoaXMuZmluaXNoT3AodHlwZXMkMS5wbHVzTWluLCAxKVxufTtcblxucHAucmVhZFRva2VuX2x0X2d0ID0gZnVuY3Rpb24oY29kZSkgeyAvLyAnPD4nXG4gIHZhciBuZXh0ID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMSk7XG4gIHZhciBzaXplID0gMTtcbiAgaWYgKG5leHQgPT09IGNvZGUpIHtcbiAgICBzaXplID0gY29kZSA9PT0gNjIgJiYgdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMikgPT09IDYyID8gMyA6IDI7XG4gICAgaWYgKHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyArIHNpemUpID09PSA2MSkgeyByZXR1cm4gdGhpcy5maW5pc2hPcCh0eXBlcyQxLmFzc2lnbiwgc2l6ZSArIDEpIH1cbiAgICByZXR1cm4gdGhpcy5maW5pc2hPcCh0eXBlcyQxLmJpdFNoaWZ0LCBzaXplKVxuICB9XG4gIGlmIChuZXh0ID09PSAzMyAmJiBjb2RlID09PSA2MCAmJiAhdGhpcy5pbk1vZHVsZSAmJiB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MgKyAyKSA9PT0gNDUgJiZcbiAgICAgIHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyArIDMpID09PSA0NSkge1xuICAgIC8vIGA8IS0tYCwgYW4gWE1MLXN0eWxlIGNvbW1lbnQgdGhhdCBzaG91bGQgYmUgaW50ZXJwcmV0ZWQgYXMgYSBsaW5lIGNvbW1lbnRcbiAgICB0aGlzLnNraXBMaW5lQ29tbWVudCg0KTtcbiAgICB0aGlzLnNraXBTcGFjZSgpO1xuICAgIHJldHVybiB0aGlzLm5leHRUb2tlbigpXG4gIH1cbiAgaWYgKG5leHQgPT09IDYxKSB7IHNpemUgPSAyOyB9XG4gIHJldHVybiB0aGlzLmZpbmlzaE9wKHR5cGVzJDEucmVsYXRpb25hbCwgc2l6ZSlcbn07XG5cbnBwLnJlYWRUb2tlbl9lcV9leGNsID0gZnVuY3Rpb24oY29kZSkgeyAvLyAnPSEnXG4gIHZhciBuZXh0ID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMSk7XG4gIGlmIChuZXh0ID09PSA2MSkgeyByZXR1cm4gdGhpcy5maW5pc2hPcCh0eXBlcyQxLmVxdWFsaXR5LCB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MgKyAyKSA9PT0gNjEgPyAzIDogMikgfVxuICBpZiAoY29kZSA9PT0gNjEgJiYgbmV4dCA9PT0gNjIgJiYgdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uID49IDYpIHsgLy8gJz0+J1xuICAgIHRoaXMucG9zICs9IDI7XG4gICAgcmV0dXJuIHRoaXMuZmluaXNoVG9rZW4odHlwZXMkMS5hcnJvdylcbiAgfVxuICByZXR1cm4gdGhpcy5maW5pc2hPcChjb2RlID09PSA2MSA/IHR5cGVzJDEuZXEgOiB0eXBlcyQxLnByZWZpeCwgMSlcbn07XG5cbnBwLnJlYWRUb2tlbl9xdWVzdGlvbiA9IGZ1bmN0aW9uKCkgeyAvLyAnPydcbiAgdmFyIGVjbWFWZXJzaW9uID0gdGhpcy5vcHRpb25zLmVjbWFWZXJzaW9uO1xuICBpZiAoZWNtYVZlcnNpb24gPj0gMTEpIHtcbiAgICB2YXIgbmV4dCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyArIDEpO1xuICAgIGlmIChuZXh0ID09PSA0Nikge1xuICAgICAgdmFyIG5leHQyID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zICsgMik7XG4gICAgICBpZiAobmV4dDIgPCA0OCB8fCBuZXh0MiA+IDU3KSB7IHJldHVybiB0aGlzLmZpbmlzaE9wKHR5cGVzJDEucXVlc3Rpb25Eb3QsIDIpIH1cbiAgICB9XG4gICAgaWYgKG5leHQgPT09IDYzKSB7XG4gICAgICBpZiAoZWNtYVZlcnNpb24gPj0gMTIpIHtcbiAgICAgICAgdmFyIG5leHQyJDEgPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MgKyAyKTtcbiAgICAgICAgaWYgKG5leHQyJDEgPT09IDYxKSB7IHJldHVybiB0aGlzLmZpbmlzaE9wKHR5cGVzJDEuYXNzaWduLCAzKSB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5maW5pc2hPcCh0eXBlcyQxLmNvYWxlc2NlLCAyKVxuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpcy5maW5pc2hPcCh0eXBlcyQxLnF1ZXN0aW9uLCAxKVxufTtcblxucHAucmVhZFRva2VuX251bWJlclNpZ24gPSBmdW5jdGlvbigpIHsgLy8gJyMnXG4gIHZhciBlY21hVmVyc2lvbiA9IHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbjtcbiAgdmFyIGNvZGUgPSAzNTsgLy8gJyMnXG4gIGlmIChlY21hVmVyc2lvbiA+PSAxMykge1xuICAgICsrdGhpcy5wb3M7XG4gICAgY29kZSA9IHRoaXMuZnVsbENoYXJDb2RlQXRQb3MoKTtcbiAgICBpZiAoaXNJZGVudGlmaWVyU3RhcnQoY29kZSwgdHJ1ZSkgfHwgY29kZSA9PT0gOTIgLyogJ1xcJyAqLykge1xuICAgICAgcmV0dXJuIHRoaXMuZmluaXNoVG9rZW4odHlwZXMkMS5wcml2YXRlSWQsIHRoaXMucmVhZFdvcmQxKCkpXG4gICAgfVxuICB9XG5cbiAgdGhpcy5yYWlzZSh0aGlzLnBvcywgXCJVbmV4cGVjdGVkIGNoYXJhY3RlciAnXCIgKyBjb2RlUG9pbnRUb1N0cmluZyhjb2RlKSArIFwiJ1wiKTtcbn07XG5cbnBwLmdldFRva2VuRnJvbUNvZGUgPSBmdW5jdGlvbihjb2RlKSB7XG4gIHN3aXRjaCAoY29kZSkge1xuICAvLyBUaGUgaW50ZXJwcmV0YXRpb24gb2YgYSBkb3QgZGVwZW5kcyBvbiB3aGV0aGVyIGl0IGlzIGZvbGxvd2VkXG4gIC8vIGJ5IGEgZGlnaXQgb3IgYW5vdGhlciB0d28gZG90cy5cbiAgY2FzZSA0NjogLy8gJy4nXG4gICAgcmV0dXJuIHRoaXMucmVhZFRva2VuX2RvdCgpXG5cbiAgLy8gUHVuY3R1YXRpb24gdG9rZW5zLlxuICBjYXNlIDQwOiArK3RoaXMucG9zOyByZXR1cm4gdGhpcy5maW5pc2hUb2tlbih0eXBlcyQxLnBhcmVuTClcbiAgY2FzZSA0MTogKyt0aGlzLnBvczsgcmV0dXJuIHRoaXMuZmluaXNoVG9rZW4odHlwZXMkMS5wYXJlblIpXG4gIGNhc2UgNTk6ICsrdGhpcy5wb3M7IHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEuc2VtaSlcbiAgY2FzZSA0NDogKyt0aGlzLnBvczsgcmV0dXJuIHRoaXMuZmluaXNoVG9rZW4odHlwZXMkMS5jb21tYSlcbiAgY2FzZSA5MTogKyt0aGlzLnBvczsgcmV0dXJuIHRoaXMuZmluaXNoVG9rZW4odHlwZXMkMS5icmFja2V0TClcbiAgY2FzZSA5MzogKyt0aGlzLnBvczsgcmV0dXJuIHRoaXMuZmluaXNoVG9rZW4odHlwZXMkMS5icmFja2V0UilcbiAgY2FzZSAxMjM6ICsrdGhpcy5wb3M7IHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEuYnJhY2VMKVxuICBjYXNlIDEyNTogKyt0aGlzLnBvczsgcmV0dXJuIHRoaXMuZmluaXNoVG9rZW4odHlwZXMkMS5icmFjZVIpXG4gIGNhc2UgNTg6ICsrdGhpcy5wb3M7IHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEuY29sb24pXG5cbiAgY2FzZSA5NjogLy8gJ2AnXG4gICAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA8IDYpIHsgYnJlYWsgfVxuICAgICsrdGhpcy5wb3M7XG4gICAgcmV0dXJuIHRoaXMuZmluaXNoVG9rZW4odHlwZXMkMS5iYWNrUXVvdGUpXG5cbiAgY2FzZSA0ODogLy8gJzAnXG4gICAgdmFyIG5leHQgPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MgKyAxKTtcbiAgICBpZiAobmV4dCA9PT0gMTIwIHx8IG5leHQgPT09IDg4KSB7IHJldHVybiB0aGlzLnJlYWRSYWRpeE51bWJlcigxNikgfSAvLyAnMHgnLCAnMFgnIC0gaGV4IG51bWJlclxuICAgIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNikge1xuICAgICAgaWYgKG5leHQgPT09IDExMSB8fCBuZXh0ID09PSA3OSkgeyByZXR1cm4gdGhpcy5yZWFkUmFkaXhOdW1iZXIoOCkgfSAvLyAnMG8nLCAnME8nIC0gb2N0YWwgbnVtYmVyXG4gICAgICBpZiAobmV4dCA9PT0gOTggfHwgbmV4dCA9PT0gNjYpIHsgcmV0dXJuIHRoaXMucmVhZFJhZGl4TnVtYmVyKDIpIH0gLy8gJzBiJywgJzBCJyAtIGJpbmFyeSBudW1iZXJcbiAgICB9XG5cbiAgLy8gQW55dGhpbmcgZWxzZSBiZWdpbm5pbmcgd2l0aCBhIGRpZ2l0IGlzIGFuIGludGVnZXIsIG9jdGFsXG4gIC8vIG51bWJlciwgb3IgZmxvYXQuXG4gIGNhc2UgNDk6IGNhc2UgNTA6IGNhc2UgNTE6IGNhc2UgNTI6IGNhc2UgNTM6IGNhc2UgNTQ6IGNhc2UgNTU6IGNhc2UgNTY6IGNhc2UgNTc6IC8vIDEtOVxuICAgIHJldHVybiB0aGlzLnJlYWROdW1iZXIoZmFsc2UpXG5cbiAgLy8gUXVvdGVzIHByb2R1Y2Ugc3RyaW5ncy5cbiAgY2FzZSAzNDogY2FzZSAzOTogLy8gJ1wiJywgXCInXCJcbiAgICByZXR1cm4gdGhpcy5yZWFkU3RyaW5nKGNvZGUpXG5cbiAgLy8gT3BlcmF0b3JzIGFyZSBwYXJzZWQgaW5saW5lIGluIHRpbnkgc3RhdGUgbWFjaGluZXMuICc9JyAoNjEpIGlzXG4gIC8vIG9mdGVuIHJlZmVycmVkIHRvLiBgZmluaXNoT3BgIHNpbXBseSBza2lwcyB0aGUgYW1vdW50IG9mXG4gIC8vIGNoYXJhY3RlcnMgaXQgaXMgZ2l2ZW4gYXMgc2Vjb25kIGFyZ3VtZW50LCBhbmQgcmV0dXJucyBhIHRva2VuXG4gIC8vIG9mIHRoZSB0eXBlIGdpdmVuIGJ5IGl0cyBmaXJzdCBhcmd1bWVudC5cbiAgY2FzZSA0NzogLy8gJy8nXG4gICAgcmV0dXJuIHRoaXMucmVhZFRva2VuX3NsYXNoKClcblxuICBjYXNlIDM3OiBjYXNlIDQyOiAvLyAnJSonXG4gICAgcmV0dXJuIHRoaXMucmVhZFRva2VuX211bHRfbW9kdWxvX2V4cChjb2RlKVxuXG4gIGNhc2UgMTI0OiBjYXNlIDM4OiAvLyAnfCYnXG4gICAgcmV0dXJuIHRoaXMucmVhZFRva2VuX3BpcGVfYW1wKGNvZGUpXG5cbiAgY2FzZSA5NDogLy8gJ14nXG4gICAgcmV0dXJuIHRoaXMucmVhZFRva2VuX2NhcmV0KClcblxuICBjYXNlIDQzOiBjYXNlIDQ1OiAvLyAnKy0nXG4gICAgcmV0dXJuIHRoaXMucmVhZFRva2VuX3BsdXNfbWluKGNvZGUpXG5cbiAgY2FzZSA2MDogY2FzZSA2MjogLy8gJzw+J1xuICAgIHJldHVybiB0aGlzLnJlYWRUb2tlbl9sdF9ndChjb2RlKVxuXG4gIGNhc2UgNjE6IGNhc2UgMzM6IC8vICc9ISdcbiAgICByZXR1cm4gdGhpcy5yZWFkVG9rZW5fZXFfZXhjbChjb2RlKVxuXG4gIGNhc2UgNjM6IC8vICc/J1xuICAgIHJldHVybiB0aGlzLnJlYWRUb2tlbl9xdWVzdGlvbigpXG5cbiAgY2FzZSAxMjY6IC8vICd+J1xuICAgIHJldHVybiB0aGlzLmZpbmlzaE9wKHR5cGVzJDEucHJlZml4LCAxKVxuXG4gIGNhc2UgMzU6IC8vICcjJ1xuICAgIHJldHVybiB0aGlzLnJlYWRUb2tlbl9udW1iZXJTaWduKClcbiAgfVxuXG4gIHRoaXMucmFpc2UodGhpcy5wb3MsIFwiVW5leHBlY3RlZCBjaGFyYWN0ZXIgJ1wiICsgY29kZVBvaW50VG9TdHJpbmcoY29kZSkgKyBcIidcIik7XG59O1xuXG5wcC5maW5pc2hPcCA9IGZ1bmN0aW9uKHR5cGUsIHNpemUpIHtcbiAgdmFyIHN0ciA9IHRoaXMuaW5wdXQuc2xpY2UodGhpcy5wb3MsIHRoaXMucG9zICsgc2l6ZSk7XG4gIHRoaXMucG9zICs9IHNpemU7XG4gIHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGUsIHN0cilcbn07XG5cbnBwLnJlYWRSZWdleHAgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGVzY2FwZWQsIGluQ2xhc3MsIHN0YXJ0ID0gdGhpcy5wb3M7XG4gIGZvciAoOzspIHtcbiAgICBpZiAodGhpcy5wb3MgPj0gdGhpcy5pbnB1dC5sZW5ndGgpIHsgdGhpcy5yYWlzZShzdGFydCwgXCJVbnRlcm1pbmF0ZWQgcmVndWxhciBleHByZXNzaW9uXCIpOyB9XG4gICAgdmFyIGNoID0gdGhpcy5pbnB1dC5jaGFyQXQodGhpcy5wb3MpO1xuICAgIGlmIChsaW5lQnJlYWsudGVzdChjaCkpIHsgdGhpcy5yYWlzZShzdGFydCwgXCJVbnRlcm1pbmF0ZWQgcmVndWxhciBleHByZXNzaW9uXCIpOyB9XG4gICAgaWYgKCFlc2NhcGVkKSB7XG4gICAgICBpZiAoY2ggPT09IFwiW1wiKSB7IGluQ2xhc3MgPSB0cnVlOyB9XG4gICAgICBlbHNlIGlmIChjaCA9PT0gXCJdXCIgJiYgaW5DbGFzcykgeyBpbkNsYXNzID0gZmFsc2U7IH1cbiAgICAgIGVsc2UgaWYgKGNoID09PSBcIi9cIiAmJiAhaW5DbGFzcykgeyBicmVhayB9XG4gICAgICBlc2NhcGVkID0gY2ggPT09IFwiXFxcXFwiO1xuICAgIH0gZWxzZSB7IGVzY2FwZWQgPSBmYWxzZTsgfVxuICAgICsrdGhpcy5wb3M7XG4gIH1cbiAgdmFyIHBhdHRlcm4gPSB0aGlzLmlucHV0LnNsaWNlKHN0YXJ0LCB0aGlzLnBvcyk7XG4gICsrdGhpcy5wb3M7XG4gIHZhciBmbGFnc1N0YXJ0ID0gdGhpcy5wb3M7XG4gIHZhciBmbGFncyA9IHRoaXMucmVhZFdvcmQxKCk7XG4gIGlmICh0aGlzLmNvbnRhaW5zRXNjKSB7IHRoaXMudW5leHBlY3RlZChmbGFnc1N0YXJ0KTsgfVxuXG4gIC8vIFZhbGlkYXRlIHBhdHRlcm5cbiAgdmFyIHN0YXRlID0gdGhpcy5yZWdleHBTdGF0ZSB8fCAodGhpcy5yZWdleHBTdGF0ZSA9IG5ldyBSZWdFeHBWYWxpZGF0aW9uU3RhdGUodGhpcykpO1xuICBzdGF0ZS5yZXNldChzdGFydCwgcGF0dGVybiwgZmxhZ3MpO1xuICB0aGlzLnZhbGlkYXRlUmVnRXhwRmxhZ3Moc3RhdGUpO1xuICB0aGlzLnZhbGlkYXRlUmVnRXhwUGF0dGVybihzdGF0ZSk7XG5cbiAgLy8gQ3JlYXRlIExpdGVyYWwjdmFsdWUgcHJvcGVydHkgdmFsdWUuXG4gIHZhciB2YWx1ZSA9IG51bGw7XG4gIHRyeSB7XG4gICAgdmFsdWUgPSBuZXcgUmVnRXhwKHBhdHRlcm4sIGZsYWdzKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIEVTVHJlZSByZXF1aXJlcyBudWxsIGlmIGl0IGZhaWxlZCB0byBpbnN0YW50aWF0ZSBSZWdFeHAgb2JqZWN0LlxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9lc3RyZWUvZXN0cmVlL2Jsb2IvYTI3MDAzYWRmNGZkN2JmYWQ0NGRlOWNlZjM3MmEyZWFjZDUyN2IxYy9lczUubWQjcmVnZXhwbGl0ZXJhbFxuICB9XG5cbiAgcmV0dXJuIHRoaXMuZmluaXNoVG9rZW4odHlwZXMkMS5yZWdleHAsIHtwYXR0ZXJuOiBwYXR0ZXJuLCBmbGFnczogZmxhZ3MsIHZhbHVlOiB2YWx1ZX0pXG59O1xuXG4vLyBSZWFkIGFuIGludGVnZXIgaW4gdGhlIGdpdmVuIHJhZGl4LiBSZXR1cm4gbnVsbCBpZiB6ZXJvIGRpZ2l0c1xuLy8gd2VyZSByZWFkLCB0aGUgaW50ZWdlciB2YWx1ZSBvdGhlcndpc2UuIFdoZW4gYGxlbmAgaXMgZ2l2ZW4sIHRoaXNcbi8vIHdpbGwgcmV0dXJuIGBudWxsYCB1bmxlc3MgdGhlIGludGVnZXIgaGFzIGV4YWN0bHkgYGxlbmAgZGlnaXRzLlxuXG5wcC5yZWFkSW50ID0gZnVuY3Rpb24ocmFkaXgsIGxlbiwgbWF5YmVMZWdhY3lPY3RhbE51bWVyaWNMaXRlcmFsKSB7XG4gIC8vIGBsZW5gIGlzIHVzZWQgZm9yIGNoYXJhY3RlciBlc2NhcGUgc2VxdWVuY2VzLiBJbiB0aGF0IGNhc2UsIGRpc2FsbG93IHNlcGFyYXRvcnMuXG4gIHZhciBhbGxvd1NlcGFyYXRvcnMgPSB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTIgJiYgbGVuID09PSB1bmRlZmluZWQ7XG5cbiAgLy8gYG1heWJlTGVnYWN5T2N0YWxOdW1lcmljTGl0ZXJhbGAgaXMgdHJ1ZSBpZiBpdCBkb2Vzbid0IGhhdmUgcHJlZml4ICgweCwwbywwYilcbiAgLy8gYW5kIGlzbid0IGZyYWN0aW9uIHBhcnQgbm9yIGV4cG9uZW50IHBhcnQuIEluIHRoYXQgY2FzZSwgaWYgdGhlIGZpcnN0IGRpZ2l0XG4gIC8vIGlzIHplcm8gdGhlbiBkaXNhbGxvdyBzZXBhcmF0b3JzLlxuICB2YXIgaXNMZWdhY3lPY3RhbE51bWVyaWNMaXRlcmFsID0gbWF5YmVMZWdhY3lPY3RhbE51bWVyaWNMaXRlcmFsICYmIHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcykgPT09IDQ4O1xuXG4gIHZhciBzdGFydCA9IHRoaXMucG9zLCB0b3RhbCA9IDAsIGxhc3RDb2RlID0gMDtcbiAgZm9yICh2YXIgaSA9IDAsIGUgPSBsZW4gPT0gbnVsbCA/IEluZmluaXR5IDogbGVuOyBpIDwgZTsgKytpLCArK3RoaXMucG9zKSB7XG4gICAgdmFyIGNvZGUgPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MpLCB2YWwgPSAodm9pZCAwKTtcblxuICAgIGlmIChhbGxvd1NlcGFyYXRvcnMgJiYgY29kZSA9PT0gOTUpIHtcbiAgICAgIGlmIChpc0xlZ2FjeU9jdGFsTnVtZXJpY0xpdGVyYWwpIHsgdGhpcy5yYWlzZVJlY292ZXJhYmxlKHRoaXMucG9zLCBcIk51bWVyaWMgc2VwYXJhdG9yIGlzIG5vdCBhbGxvd2VkIGluIGxlZ2FjeSBvY3RhbCBudW1lcmljIGxpdGVyYWxzXCIpOyB9XG4gICAgICBpZiAobGFzdENvZGUgPT09IDk1KSB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZSh0aGlzLnBvcywgXCJOdW1lcmljIHNlcGFyYXRvciBtdXN0IGJlIGV4YWN0bHkgb25lIHVuZGVyc2NvcmVcIik7IH1cbiAgICAgIGlmIChpID09PSAwKSB7IHRoaXMucmFpc2VSZWNvdmVyYWJsZSh0aGlzLnBvcywgXCJOdW1lcmljIHNlcGFyYXRvciBpcyBub3QgYWxsb3dlZCBhdCB0aGUgZmlyc3Qgb2YgZGlnaXRzXCIpOyB9XG4gICAgICBsYXN0Q29kZSA9IGNvZGU7XG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIGlmIChjb2RlID49IDk3KSB7IHZhbCA9IGNvZGUgLSA5NyArIDEwOyB9IC8vIGFcbiAgICBlbHNlIGlmIChjb2RlID49IDY1KSB7IHZhbCA9IGNvZGUgLSA2NSArIDEwOyB9IC8vIEFcbiAgICBlbHNlIGlmIChjb2RlID49IDQ4ICYmIGNvZGUgPD0gNTcpIHsgdmFsID0gY29kZSAtIDQ4OyB9IC8vIDAtOVxuICAgIGVsc2UgeyB2YWwgPSBJbmZpbml0eTsgfVxuICAgIGlmICh2YWwgPj0gcmFkaXgpIHsgYnJlYWsgfVxuICAgIGxhc3RDb2RlID0gY29kZTtcbiAgICB0b3RhbCA9IHRvdGFsICogcmFkaXggKyB2YWw7XG4gIH1cblxuICBpZiAoYWxsb3dTZXBhcmF0b3JzICYmIGxhc3RDb2RlID09PSA5NSkgeyB0aGlzLnJhaXNlUmVjb3ZlcmFibGUodGhpcy5wb3MgLSAxLCBcIk51bWVyaWMgc2VwYXJhdG9yIGlzIG5vdCBhbGxvd2VkIGF0IHRoZSBsYXN0IG9mIGRpZ2l0c1wiKTsgfVxuICBpZiAodGhpcy5wb3MgPT09IHN0YXJ0IHx8IGxlbiAhPSBudWxsICYmIHRoaXMucG9zIC0gc3RhcnQgIT09IGxlbikgeyByZXR1cm4gbnVsbCB9XG5cbiAgcmV0dXJuIHRvdGFsXG59O1xuXG5mdW5jdGlvbiBzdHJpbmdUb051bWJlcihzdHIsIGlzTGVnYWN5T2N0YWxOdW1lcmljTGl0ZXJhbCkge1xuICBpZiAoaXNMZWdhY3lPY3RhbE51bWVyaWNMaXRlcmFsKSB7XG4gICAgcmV0dXJuIHBhcnNlSW50KHN0ciwgOClcbiAgfVxuXG4gIC8vIGBwYXJzZUZsb2F0KHZhbHVlKWAgc3RvcHMgcGFyc2luZyBhdCB0aGUgZmlyc3QgbnVtZXJpYyBzZXBhcmF0b3IgdGhlbiByZXR1cm5zIGEgd3JvbmcgdmFsdWUuXG4gIHJldHVybiBwYXJzZUZsb2F0KHN0ci5yZXBsYWNlKC9fL2csIFwiXCIpKVxufVxuXG5mdW5jdGlvbiBzdHJpbmdUb0JpZ0ludChzdHIpIHtcbiAgaWYgKHR5cGVvZiBCaWdJbnQgIT09IFwiZnVuY3Rpb25cIikge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICAvLyBgQmlnSW50KHZhbHVlKWAgdGhyb3dzIHN5bnRheCBlcnJvciBpZiB0aGUgc3RyaW5nIGNvbnRhaW5zIG51bWVyaWMgc2VwYXJhdG9ycy5cbiAgcmV0dXJuIEJpZ0ludChzdHIucmVwbGFjZSgvXy9nLCBcIlwiKSlcbn1cblxucHAucmVhZFJhZGl4TnVtYmVyID0gZnVuY3Rpb24ocmFkaXgpIHtcbiAgdmFyIHN0YXJ0ID0gdGhpcy5wb3M7XG4gIHRoaXMucG9zICs9IDI7IC8vIDB4XG4gIHZhciB2YWwgPSB0aGlzLnJlYWRJbnQocmFkaXgpO1xuICBpZiAodmFsID09IG51bGwpIHsgdGhpcy5yYWlzZSh0aGlzLnN0YXJ0ICsgMiwgXCJFeHBlY3RlZCBudW1iZXIgaW4gcmFkaXggXCIgKyByYWRpeCk7IH1cbiAgaWYgKHRoaXMub3B0aW9ucy5lY21hVmVyc2lvbiA+PSAxMSAmJiB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MpID09PSAxMTApIHtcbiAgICB2YWwgPSBzdHJpbmdUb0JpZ0ludCh0aGlzLmlucHV0LnNsaWNlKHN0YXJ0LCB0aGlzLnBvcykpO1xuICAgICsrdGhpcy5wb3M7XG4gIH0gZWxzZSBpZiAoaXNJZGVudGlmaWVyU3RhcnQodGhpcy5mdWxsQ2hhckNvZGVBdFBvcygpKSkgeyB0aGlzLnJhaXNlKHRoaXMucG9zLCBcIklkZW50aWZpZXIgZGlyZWN0bHkgYWZ0ZXIgbnVtYmVyXCIpOyB9XG4gIHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEubnVtLCB2YWwpXG59O1xuXG4vLyBSZWFkIGFuIGludGVnZXIsIG9jdGFsIGludGVnZXIsIG9yIGZsb2F0aW5nLXBvaW50IG51bWJlci5cblxucHAucmVhZE51bWJlciA9IGZ1bmN0aW9uKHN0YXJ0c1dpdGhEb3QpIHtcbiAgdmFyIHN0YXJ0ID0gdGhpcy5wb3M7XG4gIGlmICghc3RhcnRzV2l0aERvdCAmJiB0aGlzLnJlYWRJbnQoMTAsIHVuZGVmaW5lZCwgdHJ1ZSkgPT09IG51bGwpIHsgdGhpcy5yYWlzZShzdGFydCwgXCJJbnZhbGlkIG51bWJlclwiKTsgfVxuICB2YXIgb2N0YWwgPSB0aGlzLnBvcyAtIHN0YXJ0ID49IDIgJiYgdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHN0YXJ0KSA9PT0gNDg7XG4gIGlmIChvY3RhbCAmJiB0aGlzLnN0cmljdCkgeyB0aGlzLnJhaXNlKHN0YXJ0LCBcIkludmFsaWQgbnVtYmVyXCIpOyB9XG4gIHZhciBuZXh0ID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zKTtcbiAgaWYgKCFvY3RhbCAmJiAhc3RhcnRzV2l0aERvdCAmJiB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gMTEgJiYgbmV4dCA9PT0gMTEwKSB7XG4gICAgdmFyIHZhbCQxID0gc3RyaW5nVG9CaWdJbnQodGhpcy5pbnB1dC5zbGljZShzdGFydCwgdGhpcy5wb3MpKTtcbiAgICArK3RoaXMucG9zO1xuICAgIGlmIChpc0lkZW50aWZpZXJTdGFydCh0aGlzLmZ1bGxDaGFyQ29kZUF0UG9zKCkpKSB7IHRoaXMucmFpc2UodGhpcy5wb3MsIFwiSWRlbnRpZmllciBkaXJlY3RseSBhZnRlciBudW1iZXJcIik7IH1cbiAgICByZXR1cm4gdGhpcy5maW5pc2hUb2tlbih0eXBlcyQxLm51bSwgdmFsJDEpXG4gIH1cbiAgaWYgKG9jdGFsICYmIC9bODldLy50ZXN0KHRoaXMuaW5wdXQuc2xpY2Uoc3RhcnQsIHRoaXMucG9zKSkpIHsgb2N0YWwgPSBmYWxzZTsgfVxuICBpZiAobmV4dCA9PT0gNDYgJiYgIW9jdGFsKSB7IC8vICcuJ1xuICAgICsrdGhpcy5wb3M7XG4gICAgdGhpcy5yZWFkSW50KDEwKTtcbiAgICBuZXh0ID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zKTtcbiAgfVxuICBpZiAoKG5leHQgPT09IDY5IHx8IG5leHQgPT09IDEwMSkgJiYgIW9jdGFsKSB7IC8vICdlRSdcbiAgICBuZXh0ID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KCsrdGhpcy5wb3MpO1xuICAgIGlmIChuZXh0ID09PSA0MyB8fCBuZXh0ID09PSA0NSkgeyArK3RoaXMucG9zOyB9IC8vICcrLSdcbiAgICBpZiAodGhpcy5yZWFkSW50KDEwKSA9PT0gbnVsbCkgeyB0aGlzLnJhaXNlKHN0YXJ0LCBcIkludmFsaWQgbnVtYmVyXCIpOyB9XG4gIH1cbiAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KHRoaXMuZnVsbENoYXJDb2RlQXRQb3MoKSkpIHsgdGhpcy5yYWlzZSh0aGlzLnBvcywgXCJJZGVudGlmaWVyIGRpcmVjdGx5IGFmdGVyIG51bWJlclwiKTsgfVxuXG4gIHZhciB2YWwgPSBzdHJpbmdUb051bWJlcih0aGlzLmlucHV0LnNsaWNlKHN0YXJ0LCB0aGlzLnBvcyksIG9jdGFsKTtcbiAgcmV0dXJuIHRoaXMuZmluaXNoVG9rZW4odHlwZXMkMS5udW0sIHZhbClcbn07XG5cbi8vIFJlYWQgYSBzdHJpbmcgdmFsdWUsIGludGVycHJldGluZyBiYWNrc2xhc2gtZXNjYXBlcy5cblxucHAucmVhZENvZGVQb2ludCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY2ggPSB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MpLCBjb2RlO1xuXG4gIGlmIChjaCA9PT0gMTIzKSB7IC8vICd7J1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPCA2KSB7IHRoaXMudW5leHBlY3RlZCgpOyB9XG4gICAgdmFyIGNvZGVQb3MgPSArK3RoaXMucG9zO1xuICAgIGNvZGUgPSB0aGlzLnJlYWRIZXhDaGFyKHRoaXMuaW5wdXQuaW5kZXhPZihcIn1cIiwgdGhpcy5wb3MpIC0gdGhpcy5wb3MpO1xuICAgICsrdGhpcy5wb3M7XG4gICAgaWYgKGNvZGUgPiAweDEwRkZGRikgeyB0aGlzLmludmFsaWRTdHJpbmdUb2tlbihjb2RlUG9zLCBcIkNvZGUgcG9pbnQgb3V0IG9mIGJvdW5kc1wiKTsgfVxuICB9IGVsc2Uge1xuICAgIGNvZGUgPSB0aGlzLnJlYWRIZXhDaGFyKDQpO1xuICB9XG4gIHJldHVybiBjb2RlXG59O1xuXG5wcC5yZWFkU3RyaW5nID0gZnVuY3Rpb24ocXVvdGUpIHtcbiAgdmFyIG91dCA9IFwiXCIsIGNodW5rU3RhcnQgPSArK3RoaXMucG9zO1xuICBmb3IgKDs7KSB7XG4gICAgaWYgKHRoaXMucG9zID49IHRoaXMuaW5wdXQubGVuZ3RoKSB7IHRoaXMucmFpc2UodGhpcy5zdGFydCwgXCJVbnRlcm1pbmF0ZWQgc3RyaW5nIGNvbnN0YW50XCIpOyB9XG4gICAgdmFyIGNoID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zKTtcbiAgICBpZiAoY2ggPT09IHF1b3RlKSB7IGJyZWFrIH1cbiAgICBpZiAoY2ggPT09IDkyKSB7IC8vICdcXCdcbiAgICAgIG91dCArPSB0aGlzLmlucHV0LnNsaWNlKGNodW5rU3RhcnQsIHRoaXMucG9zKTtcbiAgICAgIG91dCArPSB0aGlzLnJlYWRFc2NhcGVkQ2hhcihmYWxzZSk7XG4gICAgICBjaHVua1N0YXJ0ID0gdGhpcy5wb3M7XG4gICAgfSBlbHNlIGlmIChjaCA9PT0gMHgyMDI4IHx8IGNoID09PSAweDIwMjkpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPCAxMCkgeyB0aGlzLnJhaXNlKHRoaXMuc3RhcnQsIFwiVW50ZXJtaW5hdGVkIHN0cmluZyBjb25zdGFudFwiKTsgfVxuICAgICAgKyt0aGlzLnBvcztcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMubG9jYXRpb25zKSB7XG4gICAgICAgIHRoaXMuY3VyTGluZSsrO1xuICAgICAgICB0aGlzLmxpbmVTdGFydCA9IHRoaXMucG9zO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoaXNOZXdMaW5lKGNoKSkgeyB0aGlzLnJhaXNlKHRoaXMuc3RhcnQsIFwiVW50ZXJtaW5hdGVkIHN0cmluZyBjb25zdGFudFwiKTsgfVxuICAgICAgKyt0aGlzLnBvcztcbiAgICB9XG4gIH1cbiAgb3V0ICs9IHRoaXMuaW5wdXQuc2xpY2UoY2h1bmtTdGFydCwgdGhpcy5wb3MrKyk7XG4gIHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEuc3RyaW5nLCBvdXQpXG59O1xuXG4vLyBSZWFkcyB0ZW1wbGF0ZSBzdHJpbmcgdG9rZW5zLlxuXG52YXIgSU5WQUxJRF9URU1QTEFURV9FU0NBUEVfRVJST1IgPSB7fTtcblxucHAudHJ5UmVhZFRlbXBsYXRlVG9rZW4gPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5pblRlbXBsYXRlRWxlbWVudCA9IHRydWU7XG4gIHRyeSB7XG4gICAgdGhpcy5yZWFkVG1wbFRva2VuKCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmIChlcnIgPT09IElOVkFMSURfVEVNUExBVEVfRVNDQVBFX0VSUk9SKSB7XG4gICAgICB0aGlzLnJlYWRJbnZhbGlkVGVtcGxhdGVUb2tlbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBlcnJcbiAgICB9XG4gIH1cblxuICB0aGlzLmluVGVtcGxhdGVFbGVtZW50ID0gZmFsc2U7XG59O1xuXG5wcC5pbnZhbGlkU3RyaW5nVG9rZW4gPSBmdW5jdGlvbihwb3NpdGlvbiwgbWVzc2FnZSkge1xuICBpZiAodGhpcy5pblRlbXBsYXRlRWxlbWVudCAmJiB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gOSkge1xuICAgIHRocm93IElOVkFMSURfVEVNUExBVEVfRVNDQVBFX0VSUk9SXG4gIH0gZWxzZSB7XG4gICAgdGhpcy5yYWlzZShwb3NpdGlvbiwgbWVzc2FnZSk7XG4gIH1cbn07XG5cbnBwLnJlYWRUbXBsVG9rZW4gPSBmdW5jdGlvbigpIHtcbiAgdmFyIG91dCA9IFwiXCIsIGNodW5rU3RhcnQgPSB0aGlzLnBvcztcbiAgZm9yICg7Oykge1xuICAgIGlmICh0aGlzLnBvcyA+PSB0aGlzLmlucHV0Lmxlbmd0aCkgeyB0aGlzLnJhaXNlKHRoaXMuc3RhcnQsIFwiVW50ZXJtaW5hdGVkIHRlbXBsYXRlXCIpOyB9XG4gICAgdmFyIGNoID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zKTtcbiAgICBpZiAoY2ggPT09IDk2IHx8IGNoID09PSAzNiAmJiB0aGlzLmlucHV0LmNoYXJDb2RlQXQodGhpcy5wb3MgKyAxKSA9PT0gMTIzKSB7IC8vICdgJywgJyR7J1xuICAgICAgaWYgKHRoaXMucG9zID09PSB0aGlzLnN0YXJ0ICYmICh0aGlzLnR5cGUgPT09IHR5cGVzJDEudGVtcGxhdGUgfHwgdGhpcy50eXBlID09PSB0eXBlcyQxLmludmFsaWRUZW1wbGF0ZSkpIHtcbiAgICAgICAgaWYgKGNoID09PSAzNikge1xuICAgICAgICAgIHRoaXMucG9zICs9IDI7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuZmluaXNoVG9rZW4odHlwZXMkMS5kb2xsYXJCcmFjZUwpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgKyt0aGlzLnBvcztcbiAgICAgICAgICByZXR1cm4gdGhpcy5maW5pc2hUb2tlbih0eXBlcyQxLmJhY2tRdW90ZSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgb3V0ICs9IHRoaXMuaW5wdXQuc2xpY2UoY2h1bmtTdGFydCwgdGhpcy5wb3MpO1xuICAgICAgcmV0dXJuIHRoaXMuZmluaXNoVG9rZW4odHlwZXMkMS50ZW1wbGF0ZSwgb3V0KVxuICAgIH1cbiAgICBpZiAoY2ggPT09IDkyKSB7IC8vICdcXCdcbiAgICAgIG91dCArPSB0aGlzLmlucHV0LnNsaWNlKGNodW5rU3RhcnQsIHRoaXMucG9zKTtcbiAgICAgIG91dCArPSB0aGlzLnJlYWRFc2NhcGVkQ2hhcih0cnVlKTtcbiAgICAgIGNodW5rU3RhcnQgPSB0aGlzLnBvcztcbiAgICB9IGVsc2UgaWYgKGlzTmV3TGluZShjaCkpIHtcbiAgICAgIG91dCArPSB0aGlzLmlucHV0LnNsaWNlKGNodW5rU3RhcnQsIHRoaXMucG9zKTtcbiAgICAgICsrdGhpcy5wb3M7XG4gICAgICBzd2l0Y2ggKGNoKSB7XG4gICAgICBjYXNlIDEzOlxuICAgICAgICBpZiAodGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zKSA9PT0gMTApIHsgKyt0aGlzLnBvczsgfVxuICAgICAgY2FzZSAxMDpcbiAgICAgICAgb3V0ICs9IFwiXFxuXCI7XG4gICAgICAgIGJyZWFrXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBvdXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjaCk7XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmxvY2F0aW9ucykge1xuICAgICAgICArK3RoaXMuY3VyTGluZTtcbiAgICAgICAgdGhpcy5saW5lU3RhcnQgPSB0aGlzLnBvcztcbiAgICAgIH1cbiAgICAgIGNodW5rU3RhcnQgPSB0aGlzLnBvcztcbiAgICB9IGVsc2Uge1xuICAgICAgKyt0aGlzLnBvcztcbiAgICB9XG4gIH1cbn07XG5cbi8vIFJlYWRzIGEgdGVtcGxhdGUgdG9rZW4gdG8gc2VhcmNoIGZvciB0aGUgZW5kLCB3aXRob3V0IHZhbGlkYXRpbmcgYW55IGVzY2FwZSBzZXF1ZW5jZXNcbnBwLnJlYWRJbnZhbGlkVGVtcGxhdGVUb2tlbiA9IGZ1bmN0aW9uKCkge1xuICBmb3IgKDsgdGhpcy5wb3MgPCB0aGlzLmlucHV0Lmxlbmd0aDsgdGhpcy5wb3MrKykge1xuICAgIHN3aXRjaCAodGhpcy5pbnB1dFt0aGlzLnBvc10pIHtcbiAgICBjYXNlIFwiXFxcXFwiOlxuICAgICAgKyt0aGlzLnBvcztcbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlIFwiJFwiOlxuICAgICAgaWYgKHRoaXMuaW5wdXRbdGhpcy5wb3MgKyAxXSAhPT0gXCJ7XCIpIHsgYnJlYWsgfVxuICAgICAgLy8gZmFsbCB0aHJvdWdoXG4gICAgY2FzZSBcImBcIjpcbiAgICAgIHJldHVybiB0aGlzLmZpbmlzaFRva2VuKHR5cGVzJDEuaW52YWxpZFRlbXBsYXRlLCB0aGlzLmlucHV0LnNsaWNlKHRoaXMuc3RhcnQsIHRoaXMucG9zKSlcblxuICAgIGNhc2UgXCJcXHJcIjpcbiAgICAgIGlmICh0aGlzLmlucHV0W3RoaXMucG9zICsgMV0gPT09IFwiXFxuXCIpIHsgKyt0aGlzLnBvczsgfVxuICAgICAgLy8gZmFsbCB0aHJvdWdoXG4gICAgY2FzZSBcIlxcblwiOiBjYXNlIFwiXFx1MjAyOFwiOiBjYXNlIFwiXFx1MjAyOVwiOlxuICAgICAgKyt0aGlzLmN1ckxpbmU7XG4gICAgICB0aGlzLmxpbmVTdGFydCA9IHRoaXMucG9zICsgMTtcbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG4gIHRoaXMucmFpc2UodGhpcy5zdGFydCwgXCJVbnRlcm1pbmF0ZWQgdGVtcGxhdGVcIik7XG59O1xuXG4vLyBVc2VkIHRvIHJlYWQgZXNjYXBlZCBjaGFyYWN0ZXJzXG5cbnBwLnJlYWRFc2NhcGVkQ2hhciA9IGZ1bmN0aW9uKGluVGVtcGxhdGUpIHtcbiAgdmFyIGNoID0gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KCsrdGhpcy5wb3MpO1xuICArK3RoaXMucG9zO1xuICBzd2l0Y2ggKGNoKSB7XG4gIGNhc2UgMTEwOiByZXR1cm4gXCJcXG5cIiAvLyAnbicgLT4gJ1xcbidcbiAgY2FzZSAxMTQ6IHJldHVybiBcIlxcclwiIC8vICdyJyAtPiAnXFxyJ1xuICBjYXNlIDEyMDogcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUodGhpcy5yZWFkSGV4Q2hhcigyKSkgLy8gJ3gnXG4gIGNhc2UgMTE3OiByZXR1cm4gY29kZVBvaW50VG9TdHJpbmcodGhpcy5yZWFkQ29kZVBvaW50KCkpIC8vICd1J1xuICBjYXNlIDExNjogcmV0dXJuIFwiXFx0XCIgLy8gJ3QnIC0+ICdcXHQnXG4gIGNhc2UgOTg6IHJldHVybiBcIlxcYlwiIC8vICdiJyAtPiAnXFxiJ1xuICBjYXNlIDExODogcmV0dXJuIFwiXFx1MDAwYlwiIC8vICd2JyAtPiAnXFx1MDAwYidcbiAgY2FzZSAxMDI6IHJldHVybiBcIlxcZlwiIC8vICdmJyAtPiAnXFxmJ1xuICBjYXNlIDEzOiBpZiAodGhpcy5pbnB1dC5jaGFyQ29kZUF0KHRoaXMucG9zKSA9PT0gMTApIHsgKyt0aGlzLnBvczsgfSAvLyAnXFxyXFxuJ1xuICBjYXNlIDEwOiAvLyAnIFxcbidcbiAgICBpZiAodGhpcy5vcHRpb25zLmxvY2F0aW9ucykgeyB0aGlzLmxpbmVTdGFydCA9IHRoaXMucG9zOyArK3RoaXMuY3VyTGluZTsgfVxuICAgIHJldHVybiBcIlwiXG4gIGNhc2UgNTY6XG4gIGNhc2UgNTc6XG4gICAgaWYgKHRoaXMuc3RyaWN0KSB7XG4gICAgICB0aGlzLmludmFsaWRTdHJpbmdUb2tlbihcbiAgICAgICAgdGhpcy5wb3MgLSAxLFxuICAgICAgICBcIkludmFsaWQgZXNjYXBlIHNlcXVlbmNlXCJcbiAgICAgICk7XG4gICAgfVxuICAgIGlmIChpblRlbXBsYXRlKSB7XG4gICAgICB2YXIgY29kZVBvcyA9IHRoaXMucG9zIC0gMTtcblxuICAgICAgdGhpcy5pbnZhbGlkU3RyaW5nVG9rZW4oXG4gICAgICAgIGNvZGVQb3MsXG4gICAgICAgIFwiSW52YWxpZCBlc2NhcGUgc2VxdWVuY2UgaW4gdGVtcGxhdGUgc3RyaW5nXCJcbiAgICAgICk7XG4gICAgfVxuICBkZWZhdWx0OlxuICAgIGlmIChjaCA+PSA0OCAmJiBjaCA8PSA1NSkge1xuICAgICAgdmFyIG9jdGFsU3RyID0gdGhpcy5pbnB1dC5zdWJzdHIodGhpcy5wb3MgLSAxLCAzKS5tYXRjaCgvXlswLTddKy8pWzBdO1xuICAgICAgdmFyIG9jdGFsID0gcGFyc2VJbnQob2N0YWxTdHIsIDgpO1xuICAgICAgaWYgKG9jdGFsID4gMjU1KSB7XG4gICAgICAgIG9jdGFsU3RyID0gb2N0YWxTdHIuc2xpY2UoMCwgLTEpO1xuICAgICAgICBvY3RhbCA9IHBhcnNlSW50KG9jdGFsU3RyLCA4KTtcbiAgICAgIH1cbiAgICAgIHRoaXMucG9zICs9IG9jdGFsU3RyLmxlbmd0aCAtIDE7XG4gICAgICBjaCA9IHRoaXMuaW5wdXQuY2hhckNvZGVBdCh0aGlzLnBvcyk7XG4gICAgICBpZiAoKG9jdGFsU3RyICE9PSBcIjBcIiB8fCBjaCA9PT0gNTYgfHwgY2ggPT09IDU3KSAmJiAodGhpcy5zdHJpY3QgfHwgaW5UZW1wbGF0ZSkpIHtcbiAgICAgICAgdGhpcy5pbnZhbGlkU3RyaW5nVG9rZW4oXG4gICAgICAgICAgdGhpcy5wb3MgLSAxIC0gb2N0YWxTdHIubGVuZ3RoLFxuICAgICAgICAgIGluVGVtcGxhdGVcbiAgICAgICAgICAgID8gXCJPY3RhbCBsaXRlcmFsIGluIHRlbXBsYXRlIHN0cmluZ1wiXG4gICAgICAgICAgICA6IFwiT2N0YWwgbGl0ZXJhbCBpbiBzdHJpY3QgbW9kZVwiXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShvY3RhbClcbiAgICB9XG4gICAgaWYgKGlzTmV3TGluZShjaCkpIHtcbiAgICAgIC8vIFVuaWNvZGUgbmV3IGxpbmUgY2hhcmFjdGVycyBhZnRlciBcXCBnZXQgcmVtb3ZlZCBmcm9tIG91dHB1dCBpbiBib3RoXG4gICAgICAvLyB0ZW1wbGF0ZSBsaXRlcmFscyBhbmQgc3RyaW5nc1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5sb2NhdGlvbnMpIHsgdGhpcy5saW5lU3RhcnQgPSB0aGlzLnBvczsgKyt0aGlzLmN1ckxpbmU7IH1cbiAgICAgIHJldHVybiBcIlwiXG4gICAgfVxuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKGNoKVxuICB9XG59O1xuXG4vLyBVc2VkIHRvIHJlYWQgY2hhcmFjdGVyIGVzY2FwZSBzZXF1ZW5jZXMgKCdcXHgnLCAnXFx1JywgJ1xcVScpLlxuXG5wcC5yZWFkSGV4Q2hhciA9IGZ1bmN0aW9uKGxlbikge1xuICB2YXIgY29kZVBvcyA9IHRoaXMucG9zO1xuICB2YXIgbiA9IHRoaXMucmVhZEludCgxNiwgbGVuKTtcbiAgaWYgKG4gPT09IG51bGwpIHsgdGhpcy5pbnZhbGlkU3RyaW5nVG9rZW4oY29kZVBvcywgXCJCYWQgY2hhcmFjdGVyIGVzY2FwZSBzZXF1ZW5jZVwiKTsgfVxuICByZXR1cm4gblxufTtcblxuLy8gUmVhZCBhbiBpZGVudGlmaWVyLCBhbmQgcmV0dXJuIGl0IGFzIGEgc3RyaW5nLiBTZXRzIGB0aGlzLmNvbnRhaW5zRXNjYFxuLy8gdG8gd2hldGhlciB0aGUgd29yZCBjb250YWluZWQgYSAnXFx1JyBlc2NhcGUuXG4vL1xuLy8gSW5jcmVtZW50YWxseSBhZGRzIG9ubHkgZXNjYXBlZCBjaGFycywgYWRkaW5nIG90aGVyIGNodW5rcyBhcy1pc1xuLy8gYXMgYSBtaWNyby1vcHRpbWl6YXRpb24uXG5cbnBwLnJlYWRXb3JkMSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmNvbnRhaW5zRXNjID0gZmFsc2U7XG4gIHZhciB3b3JkID0gXCJcIiwgZmlyc3QgPSB0cnVlLCBjaHVua1N0YXJ0ID0gdGhpcy5wb3M7XG4gIHZhciBhc3RyYWwgPSB0aGlzLm9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNjtcbiAgd2hpbGUgKHRoaXMucG9zIDwgdGhpcy5pbnB1dC5sZW5ndGgpIHtcbiAgICB2YXIgY2ggPSB0aGlzLmZ1bGxDaGFyQ29kZUF0UG9zKCk7XG4gICAgaWYgKGlzSWRlbnRpZmllckNoYXIoY2gsIGFzdHJhbCkpIHtcbiAgICAgIHRoaXMucG9zICs9IGNoIDw9IDB4ZmZmZiA/IDEgOiAyO1xuICAgIH0gZWxzZSBpZiAoY2ggPT09IDkyKSB7IC8vIFwiXFxcIlxuICAgICAgdGhpcy5jb250YWluc0VzYyA9IHRydWU7XG4gICAgICB3b3JkICs9IHRoaXMuaW5wdXQuc2xpY2UoY2h1bmtTdGFydCwgdGhpcy5wb3MpO1xuICAgICAgdmFyIGVzY1N0YXJ0ID0gdGhpcy5wb3M7XG4gICAgICBpZiAodGhpcy5pbnB1dC5jaGFyQ29kZUF0KCsrdGhpcy5wb3MpICE9PSAxMTcpIC8vIFwidVwiXG4gICAgICAgIHsgdGhpcy5pbnZhbGlkU3RyaW5nVG9rZW4odGhpcy5wb3MsIFwiRXhwZWN0aW5nIFVuaWNvZGUgZXNjYXBlIHNlcXVlbmNlIFxcXFx1WFhYWFwiKTsgfVxuICAgICAgKyt0aGlzLnBvcztcbiAgICAgIHZhciBlc2MgPSB0aGlzLnJlYWRDb2RlUG9pbnQoKTtcbiAgICAgIGlmICghKGZpcnN0ID8gaXNJZGVudGlmaWVyU3RhcnQgOiBpc0lkZW50aWZpZXJDaGFyKShlc2MsIGFzdHJhbCkpXG4gICAgICAgIHsgdGhpcy5pbnZhbGlkU3RyaW5nVG9rZW4oZXNjU3RhcnQsIFwiSW52YWxpZCBVbmljb2RlIGVzY2FwZVwiKTsgfVxuICAgICAgd29yZCArPSBjb2RlUG9pbnRUb1N0cmluZyhlc2MpO1xuICAgICAgY2h1bmtTdGFydCA9IHRoaXMucG9zO1xuICAgIH0gZWxzZSB7XG4gICAgICBicmVha1xuICAgIH1cbiAgICBmaXJzdCA9IGZhbHNlO1xuICB9XG4gIHJldHVybiB3b3JkICsgdGhpcy5pbnB1dC5zbGljZShjaHVua1N0YXJ0LCB0aGlzLnBvcylcbn07XG5cbi8vIFJlYWQgYW4gaWRlbnRpZmllciBvciBrZXl3b3JkIHRva2VuLiBXaWxsIGNoZWNrIGZvciByZXNlcnZlZFxuLy8gd29yZHMgd2hlbiBuZWNlc3NhcnkuXG5cbnBwLnJlYWRXb3JkID0gZnVuY3Rpb24oKSB7XG4gIHZhciB3b3JkID0gdGhpcy5yZWFkV29yZDEoKTtcbiAgdmFyIHR5cGUgPSB0eXBlcyQxLm5hbWU7XG4gIGlmICh0aGlzLmtleXdvcmRzLnRlc3Qod29yZCkpIHtcbiAgICB0eXBlID0ga2V5d29yZHNbd29yZF07XG4gIH1cbiAgcmV0dXJuIHRoaXMuZmluaXNoVG9rZW4odHlwZSwgd29yZClcbn07XG5cbi8vIEFjb3JuIGlzIGEgdGlueSwgZmFzdCBKYXZhU2NyaXB0IHBhcnNlciB3cml0dGVuIGluIEphdmFTY3JpcHQuXG4vL1xuLy8gQWNvcm4gd2FzIHdyaXR0ZW4gYnkgTWFyaWpuIEhhdmVyYmVrZSwgSW5ndmFyIFN0ZXBhbnlhbiwgYW5kXG4vLyB2YXJpb3VzIGNvbnRyaWJ1dG9ycyBhbmQgcmVsZWFzZWQgdW5kZXIgYW4gTUlUIGxpY2Vuc2UuXG4vL1xuLy8gR2l0IHJlcG9zaXRvcmllcyBmb3IgQWNvcm4gYXJlIGF2YWlsYWJsZSBhdFxuLy9cbi8vICAgICBodHRwOi8vbWFyaWpuaGF2ZXJiZWtlLm5sL2dpdC9hY29yblxuLy8gICAgIGh0dHBzOi8vZ2l0aHViLmNvbS9hY29ybmpzL2Fjb3JuLmdpdFxuLy9cbi8vIFBsZWFzZSB1c2UgdGhlIFtnaXRodWIgYnVnIHRyYWNrZXJdW2doYnRdIHRvIHJlcG9ydCBpc3N1ZXMuXG4vL1xuLy8gW2doYnRdOiBodHRwczovL2dpdGh1Yi5jb20vYWNvcm5qcy9hY29ybi9pc3N1ZXNcblxuXG52YXIgdmVyc2lvbiA9IFwiOC4xNS4wXCI7XG5cblBhcnNlci5hY29ybiA9IHtcbiAgUGFyc2VyOiBQYXJzZXIsXG4gIHZlcnNpb246IHZlcnNpb24sXG4gIGRlZmF1bHRPcHRpb25zOiBkZWZhdWx0T3B0aW9ucyxcbiAgUG9zaXRpb246IFBvc2l0aW9uLFxuICBTb3VyY2VMb2NhdGlvbjogU291cmNlTG9jYXRpb24sXG4gIGdldExpbmVJbmZvOiBnZXRMaW5lSW5mbyxcbiAgTm9kZTogTm9kZSxcbiAgVG9rZW5UeXBlOiBUb2tlblR5cGUsXG4gIHRva1R5cGVzOiB0eXBlcyQxLFxuICBrZXl3b3JkVHlwZXM6IGtleXdvcmRzLFxuICBUb2tDb250ZXh0OiBUb2tDb250ZXh0LFxuICB0b2tDb250ZXh0czogdHlwZXMsXG4gIGlzSWRlbnRpZmllckNoYXI6IGlzSWRlbnRpZmllckNoYXIsXG4gIGlzSWRlbnRpZmllclN0YXJ0OiBpc0lkZW50aWZpZXJTdGFydCxcbiAgVG9rZW46IFRva2VuLFxuICBpc05ld0xpbmU6IGlzTmV3TGluZSxcbiAgbGluZUJyZWFrOiBsaW5lQnJlYWssXG4gIGxpbmVCcmVha0c6IGxpbmVCcmVha0csXG4gIG5vbkFTQ0lJd2hpdGVzcGFjZTogbm9uQVNDSUl3aGl0ZXNwYWNlXG59O1xuXG4vLyBUaGUgbWFpbiBleHBvcnRlZCBpbnRlcmZhY2UgKHVuZGVyIGBzZWxmLmFjb3JuYCB3aGVuIGluIHRoZVxuLy8gYnJvd3NlcikgaXMgYSBgcGFyc2VgIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYSBjb2RlIHN0cmluZyBhbmQgcmV0dXJuc1xuLy8gYW4gYWJzdHJhY3Qgc3ludGF4IHRyZWUgYXMgc3BlY2lmaWVkIGJ5IHRoZSBbRVNUcmVlIHNwZWNdW2VzdHJlZV0uXG4vL1xuLy8gW2VzdHJlZV06IGh0dHBzOi8vZ2l0aHViLmNvbS9lc3RyZWUvZXN0cmVlXG5cbmZ1bmN0aW9uIHBhcnNlKGlucHV0LCBvcHRpb25zKSB7XG4gIHJldHVybiBQYXJzZXIucGFyc2UoaW5wdXQsIG9wdGlvbnMpXG59XG5cbi8vIFRoaXMgZnVuY3Rpb24gdHJpZXMgdG8gcGFyc2UgYSBzaW5nbGUgZXhwcmVzc2lvbiBhdCBhIGdpdmVuXG4vLyBvZmZzZXQgaW4gYSBzdHJpbmcuIFVzZWZ1bCBmb3IgcGFyc2luZyBtaXhlZC1sYW5ndWFnZSBmb3JtYXRzXG4vLyB0aGF0IGVtYmVkIEphdmFTY3JpcHQgZXhwcmVzc2lvbnMuXG5cbmZ1bmN0aW9uIHBhcnNlRXhwcmVzc2lvbkF0KGlucHV0LCBwb3MsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIFBhcnNlci5wYXJzZUV4cHJlc3Npb25BdChpbnB1dCwgcG9zLCBvcHRpb25zKVxufVxuXG4vLyBBY29ybiBpcyBvcmdhbml6ZWQgYXMgYSB0b2tlbml6ZXIgYW5kIGEgcmVjdXJzaXZlLWRlc2NlbnQgcGFyc2VyLlxuLy8gVGhlIGB0b2tlbml6ZXJgIGV4cG9ydCBwcm92aWRlcyBhbiBpbnRlcmZhY2UgdG8gdGhlIHRva2VuaXplci5cblxuZnVuY3Rpb24gdG9rZW5pemVyKGlucHV0LCBvcHRpb25zKSB7XG4gIHJldHVybiBQYXJzZXIudG9rZW5pemVyKGlucHV0LCBvcHRpb25zKVxufVxuXG5leHBvcnQgeyBOb2RlLCBQYXJzZXIsIFBvc2l0aW9uLCBTb3VyY2VMb2NhdGlvbiwgVG9rQ29udGV4dCwgVG9rZW4sIFRva2VuVHlwZSwgZGVmYXVsdE9wdGlvbnMsIGdldExpbmVJbmZvLCBpc0lkZW50aWZpZXJDaGFyLCBpc0lkZW50aWZpZXJTdGFydCwgaXNOZXdMaW5lLCBrZXl3b3JkcyBhcyBrZXl3b3JkVHlwZXMsIGxpbmVCcmVhaywgbGluZUJyZWFrRywgbm9uQVNDSUl3aGl0ZXNwYWNlLCBwYXJzZSwgcGFyc2VFeHByZXNzaW9uQXQsIHR5cGVzIGFzIHRva0NvbnRleHRzLCB0eXBlcyQxIGFzIHRva1R5cGVzLCB0b2tlbml6ZXIsIHZlcnNpb24gfTtcbiIsICJpbXBvcnQgeyBwYXJzZSBhcyBhY29yblBhcnNlIH0gZnJvbSBcImFjb3JuXCI7XG5cblxuLyoqIExvb3NlIEFTVCBub2RlIHR5cGUgXHUyMDE0IGFjb3JuIG5vZGVzIHdpdGggYHR5cGVgLCBgc3RhcnRgLCBgZW5kYCArIGFyYml0cmFyeSBmaWVsZHMuICovXG5leHBvcnQgdHlwZSBBc3ROb2RlID0geyB0eXBlOiBzdHJpbmc7IHN0YXJ0OiBudW1iZXI7IGVuZDogbnVtYmVyOyBbazogc3RyaW5nXTogYW55IH07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gU2NvcGUgdmFsaWRhdGlvblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydCBjb25zdCB2YWxpZGF0ZVNjb3BlcyA9IChwcm9ncmFtOiBBc3ROb2RlLCBhbGxvd2VkR2xvYmFsczogc3RyaW5nW10gPSBbXSkgPT4ge1xuICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IGdsb2JhbHMgPSBuZXcgU2V0KGFsbG93ZWRHbG9iYWxzKTtcbiAgY29uc3Qgc2NvcGVzOiBBcnJheTxTZXQ8c3RyaW5nPj4gPSBbbmV3IFNldCgpXTtcblxuICBjb25zdCBkZWNsYXJlID0gKG5hbWU6IHN0cmluZykgPT4gc2NvcGVzW3Njb3Blcy5sZW5ndGggLSAxXS5hZGQobmFtZSk7XG4gIGNvbnN0IGlzRGVjbGFyZWQgPSAobmFtZTogc3RyaW5nKSA9PiBzY29wZXMuc29tZSgocykgPT4gcy5oYXMobmFtZSkpIHx8IGdsb2JhbHMuaGFzKG5hbWUpO1xuICBjb25zdCBlbnRlciA9ICgpID0+IHNjb3Blcy5wdXNoKG5ldyBTZXQoKSk7XG4gIGNvbnN0IGV4aXQgPSAoKSA9PiB7IHNjb3Blcy5wb3AoKTsgfTtcbiAgY29uc3QgY2hlY2tJZGVudCA9IChuYW1lOiBzdHJpbmcpID0+IHtcbiAgICBpZiAoIWlzRGVjbGFyZWQobmFtZSkpIGVycm9ycy5wdXNoKGB1bmRlY2xhcmVkOiAke25hbWV9YCk7XG4gIH07XG5cbiAgY29uc3QgZGVjbGFyZVBhdHRlcm4gPSAocDogQXN0Tm9kZSkgPT4ge1xuICAgIGlmIChwLnR5cGUgPT09IFwiSWRlbnRpZmllclwiKSBkZWNsYXJlKHAubmFtZSk7XG4gICAgZWxzZSBpZiAocC50eXBlID09PSBcIkFzc2lnbm1lbnRQYXR0ZXJuXCIpIGRlY2xhcmVQYXR0ZXJuKHAubGVmdCk7XG4gICAgZWxzZSBpZiAocC50eXBlID09PSBcIlJlc3RFbGVtZW50XCIpIGRlY2xhcmVQYXR0ZXJuKHAuYXJndW1lbnQpO1xuICAgIGVsc2UgaWYgKHAudHlwZSA9PT0gXCJBcnJheVBhdHRlcm5cIikgKHAuZWxlbWVudHMgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKGRlY2xhcmVQYXR0ZXJuKTtcbiAgICBlbHNlIGlmIChwLnR5cGUgPT09IFwiT2JqZWN0UGF0dGVyblwiKSAocC5wcm9wZXJ0aWVzIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgocHJvcCkgPT4ge1xuICAgICAgaWYgKHByb3AudHlwZSA9PT0gXCJSZXN0RWxlbWVudFwiKSBkZWNsYXJlUGF0dGVybihwcm9wLmFyZ3VtZW50KTtcbiAgICAgIGVsc2UgZGVjbGFyZVBhdHRlcm4ocHJvcC52YWx1ZSk7XG4gICAgfSk7XG4gIH07XG5cbiAgY29uc3QgdmlzaXRFeHByID0gKGU6IEFzdE5vZGUpOiB2b2lkID0+IHtcbiAgICBpZiAoIWUpIHJldHVybjtcbiAgICBzd2l0Y2ggKGUudHlwZSkge1xuICAgICAgY2FzZSBcIklkZW50aWZpZXJcIjpcbiAgICAgICAgY2hlY2tJZGVudChlLm5hbWUpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiTGl0ZXJhbFwiOlxuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiU3ByZWFkRWxlbWVudFwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5hcmd1bWVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJBcnJheUV4cHJlc3Npb25cIjpcbiAgICAgICAgKGUuZWxlbWVudHMgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKChlbCkgPT4gZWwgJiYgdmlzaXRFeHByKGVsKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJPYmplY3RFeHByZXNzaW9uXCI6XG4gICAgICAgIChlLnByb3BlcnRpZXMgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKChwKSA9PiB7XG4gICAgICAgICAgaWYgKHAudHlwZSA9PT0gXCJTcHJlYWRFbGVtZW50XCIpIHZpc2l0RXhwcihwLmFyZ3VtZW50KTtcbiAgICAgICAgICBlbHNlIHZpc2l0RXhwcihwLnZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJBd2FpdEV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUuYXJndW1lbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQ2hhaW5FeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLmV4cHJlc3Npb24pO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiTmV3RXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5jYWxsZWUpO1xuICAgICAgICAoZS5hcmd1bWVudHMgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKChhKSA9PiB2aXNpdEV4cHIoYSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQ2FsbEV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUuY2FsbGVlKTtcbiAgICAgICAgKGUuYXJndW1lbnRzIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgoYSkgPT4gdmlzaXRFeHByKGEpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIk1lbWJlckV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUub2JqZWN0KTtcbiAgICAgICAgaWYgKGUuY29tcHV0ZWQpIHZpc2l0RXhwcihlLnByb3BlcnR5KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkFzc2lnbm1lbnRFeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLmxlZnQpO1xuICAgICAgICB2aXNpdEV4cHIoZS5yaWdodCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJVcGRhdGVFeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLmFyZ3VtZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkJpbmFyeUV4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJMb2dpY2FsRXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5sZWZ0KTtcbiAgICAgICAgdmlzaXRFeHByKGUucmlnaHQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiVW5hcnlFeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLmFyZ3VtZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkNvbmRpdGlvbmFsRXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS50ZXN0KTtcbiAgICAgICAgdmlzaXRFeHByKGUuY29uc2VxdWVudCk7XG4gICAgICAgIHZpc2l0RXhwcihlLmFsdGVybmF0ZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJBcnJvd0Z1bmN0aW9uRXhwcmVzc2lvblwiOlxuICAgICAgICBlbnRlcigpO1xuICAgICAgICAoZS5wYXJhbXMgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKGRlY2xhcmVQYXR0ZXJuKTtcbiAgICAgICAgaWYgKGUuYm9keS50eXBlID09PSBcIkJsb2NrU3RhdGVtZW50XCIpIHZpc2l0U3RtdChlLmJvZHkpO1xuICAgICAgICBlbHNlIHZpc2l0RXhwcihlLmJvZHkpO1xuICAgICAgICBleGl0KCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgdmlzaXRWYXJEZWNsID0gKGQ6IEFzdE5vZGUpID0+IHtcbiAgICBkZWNsYXJlUGF0dGVybihkLmlkKTtcbiAgICBpZiAoZC5pbml0KSB2aXNpdEV4cHIoZC5pbml0KTtcbiAgfTtcblxuICBjb25zdCB2aXNpdFN0bXQgPSAoczogQXN0Tm9kZSk6IHZvaWQgPT4ge1xuICAgIHN3aXRjaCAocy50eXBlKSB7XG4gICAgICBjYXNlIFwiQmxvY2tTdGF0ZW1lbnRcIjpcbiAgICAgICAgZW50ZXIoKTtcbiAgICAgICAgKHMuYm9keSBhcyBBc3ROb2RlW10pLmZvckVhY2godmlzaXRTdG10KTtcbiAgICAgICAgZXhpdCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiRXhwcmVzc2lvblN0YXRlbWVudFwiOlxuICAgICAgICB2aXNpdEV4cHIocy5leHByZXNzaW9uKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIklmU3RhdGVtZW50XCI6XG4gICAgICAgIHZpc2l0RXhwcihzLnRlc3QpO1xuICAgICAgICB2aXNpdFN0bXQocy5jb25zZXF1ZW50KTtcbiAgICAgICAgaWYgKHMuYWx0ZXJuYXRlKSB2aXNpdFN0bXQocy5hbHRlcm5hdGUpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiUmV0dXJuU3RhdGVtZW50XCI6XG4gICAgICAgIGlmIChzLmFyZ3VtZW50KSB2aXNpdEV4cHIocy5hcmd1bWVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJUaHJvd1N0YXRlbWVudFwiOlxuICAgICAgICBpZiAocy5hcmd1bWVudCkgdmlzaXRFeHByKHMuYXJndW1lbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiVmFyaWFibGVEZWNsYXJhdGlvblwiOlxuICAgICAgICAocy5kZWNsYXJhdGlvbnMgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKHZpc2l0VmFyRGVjbCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJXaGlsZVN0YXRlbWVudFwiOlxuICAgICAgICB2aXNpdEV4cHIocy50ZXN0KTtcbiAgICAgICAgdmlzaXRTdG10KHMuYm9keSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJGb3JTdGF0ZW1lbnRcIjoge1xuICAgICAgICBlbnRlcigpO1xuICAgICAgICBpZiAocy5pbml0Py50eXBlID09PSBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIikgKHMuaW5pdC5kZWNsYXJhdGlvbnMgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKHZpc2l0VmFyRGVjbCk7XG4gICAgICAgIGVsc2UgaWYgKHMuaW5pdCkgdmlzaXRFeHByKHMuaW5pdCk7XG4gICAgICAgIGlmIChzLnRlc3QpIHZpc2l0RXhwcihzLnRlc3QpO1xuICAgICAgICBpZiAocy51cGRhdGUpIHZpc2l0RXhwcihzLnVwZGF0ZSk7XG4gICAgICAgIHZpc2l0U3RtdChzLmJvZHkpO1xuICAgICAgICBleGl0KCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJGb3JJblN0YXRlbWVudFwiOlxuICAgICAgY2FzZSBcIkZvck9mU3RhdGVtZW50XCI6IHtcbiAgICAgICAgZW50ZXIoKTtcbiAgICAgICAgaWYgKHMubGVmdC50eXBlID09PSBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIikgKHMubGVmdC5kZWNsYXJhdGlvbnMgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKHZpc2l0VmFyRGVjbCk7XG4gICAgICAgIGVsc2UgdmlzaXRFeHByKHMubGVmdCk7XG4gICAgICAgIHZpc2l0RXhwcihzLnJpZ2h0KTtcbiAgICAgICAgdmlzaXRTdG10KHMuYm9keSk7XG4gICAgICAgIGV4aXQoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY2FzZSBcIlN3aXRjaFN0YXRlbWVudFwiOiB7XG4gICAgICAgIHZpc2l0RXhwcihzLmRpc2NyaW1pbmFudCk7XG4gICAgICAgIGVudGVyKCk7XG4gICAgICAgIChzLmNhc2VzIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgoYykgPT4ge1xuICAgICAgICAgIGlmIChjLnRlc3QpIHZpc2l0RXhwcihjLnRlc3QpO1xuICAgICAgICAgIChjLmNvbnNlcXVlbnQgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKHZpc2l0U3RtdCk7XG4gICAgICAgIH0pO1xuICAgICAgICBleGl0KCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJUcnlTdGF0ZW1lbnRcIjpcbiAgICAgICAgdmlzaXRTdG10KHMuYmxvY2spO1xuICAgICAgICBpZiAocy5oYW5kbGVyKSB7XG4gICAgICAgICAgZW50ZXIoKTtcbiAgICAgICAgICBpZiAocy5oYW5kbGVyLnBhcmFtKSBkZWNsYXJlUGF0dGVybihzLmhhbmRsZXIucGFyYW0pO1xuICAgICAgICAgIHZpc2l0U3RtdChzLmhhbmRsZXIuYm9keSk7XG4gICAgICAgICAgZXhpdCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzLmZpbmFsaXplcikgdmlzaXRTdG10KHMuZmluYWxpemVyKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkJyZWFrU3RhdGVtZW50XCI6XG4gICAgICBjYXNlIFwiQ29udGludWVTdGF0ZW1lbnRcIjpcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcblxuICAocHJvZ3JhbS5ib2R5IGFzIEFzdE5vZGVbXSkuZm9yRWFjaCh2aXNpdFN0bXQpO1xuICByZXR1cm4gZXJyb3JzO1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBQcm90b3R5cGUgYWNjZXNzIHZhbGlkYXRpb25cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5leHBvcnQgY29uc3QgdmFsaWRhdGVOb1Byb3RvdHlwZSA9IChwcm9ncmFtOiBBc3ROb2RlKSA9PiB7XG4gIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgZm9yYmlkZGVuTWVtYmVycyA9IG5ldyBTZXQoW1wicHJvdG90eXBlXCIsIFwiY29uc3RydWN0b3JcIiwgXCJfX3Byb3RvX19cIl0pO1xuXG4gIGNvbnN0IHZpc2l0RXhwciA9IChlOiBBc3ROb2RlKTogdm9pZCA9PiB7XG4gICAgaWYgKCFlKSByZXR1cm47XG4gICAgc3dpdGNoIChlLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICAgIGlmICghZS5jb21wdXRlZCAmJiBlLnByb3BlcnR5LnR5cGUgPT09IFwiSWRlbnRpZmllclwiICYmIGZvcmJpZGRlbk1lbWJlcnMuaGFzKGUucHJvcGVydHkubmFtZSkpIHtcbiAgICAgICAgICBlcnJvcnMucHVzaChcInByb3RvdHlwZSBhY2Nlc3NcIik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29tcHV0ZWQgYWNjZXNzIGlzIGFsbG93ZWQgXHUyMDE0IHJ1bnRpbWUgX19jaGsgZ3VhcmRzIGFnYWluc3QgZm9yYmlkZGVuIGtleXNcbiAgICAgICAgdmlzaXRFeHByKGUub2JqZWN0KTtcbiAgICAgICAgaWYgKGUuY29tcHV0ZWQpIHZpc2l0RXhwcihlLnByb3BlcnR5KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlNwcmVhZEVsZW1lbnRcIjpcbiAgICAgICAgdmlzaXRFeHByKGUuYXJndW1lbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiTmV3RXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5jYWxsZWUpO1xuICAgICAgICAoZS5hcmd1bWVudHMgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKChhKSA9PiB2aXNpdEV4cHIoYSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQ2FsbEV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUuY2FsbGVlKTtcbiAgICAgICAgKGUuYXJndW1lbnRzIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgoYSkgPT4gdmlzaXRFeHByKGEpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkF3YWl0RXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5hcmd1bWVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJDaGFpbkV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUuZXhwcmVzc2lvbik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJBcnJheUV4cHJlc3Npb25cIjpcbiAgICAgICAgKGUuZWxlbWVudHMgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKChlbCkgPT4gZWwgJiYgdmlzaXRFeHByKGVsKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJPYmplY3RFeHByZXNzaW9uXCI6XG4gICAgICAgIChlLnByb3BlcnRpZXMgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKChwKSA9PiB7XG4gICAgICAgICAgaWYgKHAudHlwZSA9PT0gXCJTcHJlYWRFbGVtZW50XCIpIHZpc2l0RXhwcihwLmFyZ3VtZW50KTtcbiAgICAgICAgICBlbHNlIHZpc2l0RXhwcihwLnZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJBc3NpZ25tZW50RXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5sZWZ0KTtcbiAgICAgICAgdmlzaXRFeHByKGUucmlnaHQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiVXBkYXRlRXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5hcmd1bWVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJCaW5hcnlFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiTG9naWNhbEV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUubGVmdCk7XG4gICAgICAgIHZpc2l0RXhwcihlLnJpZ2h0KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlVuYXJ5RXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5hcmd1bWVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJDb25kaXRpb25hbEV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUudGVzdCk7XG4gICAgICAgIHZpc2l0RXhwcihlLmNvbnNlcXVlbnQpO1xuICAgICAgICB2aXNpdEV4cHIoZS5hbHRlcm5hdGUpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQXJyb3dGdW5jdGlvbkV4cHJlc3Npb25cIjpcbiAgICAgICAgaWYgKGUuYm9keS50eXBlID09PSBcIkJsb2NrU3RhdGVtZW50XCIpIHZpc2l0U3RtdChlLmJvZHkpO1xuICAgICAgICBlbHNlIHZpc2l0RXhwcihlLmJvZHkpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiSWRlbnRpZmllclwiOlxuICAgICAgY2FzZSBcIkxpdGVyYWxcIjpcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCB2aXNpdFN0bXQgPSAoczogQXN0Tm9kZSk6IHZvaWQgPT4ge1xuICAgIHN3aXRjaCAocy50eXBlKSB7XG4gICAgICBjYXNlIFwiQmxvY2tTdGF0ZW1lbnRcIjpcbiAgICAgICAgKHMuYm9keSBhcyBBc3ROb2RlW10pLmZvckVhY2godmlzaXRTdG10KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkV4cHJlc3Npb25TdGF0ZW1lbnRcIjpcbiAgICAgICAgdmlzaXRFeHByKHMuZXhwcmVzc2lvbik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJJZlN0YXRlbWVudFwiOlxuICAgICAgICB2aXNpdEV4cHIocy50ZXN0KTtcbiAgICAgICAgdmlzaXRTdG10KHMuY29uc2VxdWVudCk7XG4gICAgICAgIGlmIChzLmFsdGVybmF0ZSkgdmlzaXRTdG10KHMuYWx0ZXJuYXRlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlJldHVyblN0YXRlbWVudFwiOlxuICAgICAgICBpZiAocy5hcmd1bWVudCkgdmlzaXRFeHByKHMuYXJndW1lbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiVGhyb3dTdGF0ZW1lbnRcIjpcbiAgICAgICAgaWYgKHMuYXJndW1lbnQpIHZpc2l0RXhwcihzLmFyZ3VtZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIjpcbiAgICAgICAgKHMuZGVjbGFyYXRpb25zIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgoZCkgPT4gZC5pbml0ICYmIHZpc2l0RXhwcihkLmluaXQpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIldoaWxlU3RhdGVtZW50XCI6XG4gICAgICAgIHZpc2l0RXhwcihzLnRlc3QpO1xuICAgICAgICB2aXNpdFN0bXQocy5ib2R5KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkZvclN0YXRlbWVudFwiOlxuICAgICAgICBpZiAocy5pbml0Py50eXBlID09PSBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIikgKHMuaW5pdC5kZWNsYXJhdGlvbnMgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKChkOiBBc3ROb2RlKSA9PiBkLmluaXQgJiYgdmlzaXRFeHByKGQuaW5pdCkpO1xuICAgICAgICBlbHNlIGlmIChzLmluaXQpIHZpc2l0RXhwcihzLmluaXQpO1xuICAgICAgICBpZiAocy50ZXN0KSB2aXNpdEV4cHIocy50ZXN0KTtcbiAgICAgICAgaWYgKHMudXBkYXRlKSB2aXNpdEV4cHIocy51cGRhdGUpO1xuICAgICAgICB2aXNpdFN0bXQocy5ib2R5KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkZvckluU3RhdGVtZW50XCI6XG4gICAgICBjYXNlIFwiRm9yT2ZTdGF0ZW1lbnRcIjpcbiAgICAgICAgaWYgKHMubGVmdC50eXBlID09PSBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIikgKHMubGVmdC5kZWNsYXJhdGlvbnMgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKChkOiBBc3ROb2RlKSA9PiBkLmluaXQgJiYgdmlzaXRFeHByKGQuaW5pdCkpO1xuICAgICAgICBlbHNlIHZpc2l0RXhwcihzLmxlZnQpO1xuICAgICAgICB2aXNpdEV4cHIocy5yaWdodCk7XG4gICAgICAgIHZpc2l0U3RtdChzLmJvZHkpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiU3dpdGNoU3RhdGVtZW50XCI6XG4gICAgICAgIHZpc2l0RXhwcihzLmRpc2NyaW1pbmFudCk7XG4gICAgICAgIChzLmNhc2VzIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgoYykgPT4ge1xuICAgICAgICAgIGlmIChjLnRlc3QpIHZpc2l0RXhwcihjLnRlc3QpO1xuICAgICAgICAgIChjLmNvbnNlcXVlbnQgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKHZpc2l0U3RtdCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiVHJ5U3RhdGVtZW50XCI6XG4gICAgICAgIHZpc2l0U3RtdChzLmJsb2NrKTtcbiAgICAgICAgaWYgKHMuaGFuZGxlcikgdmlzaXRTdG10KHMuaGFuZGxlci5ib2R5KTtcbiAgICAgICAgaWYgKHMuZmluYWxpemVyKSB2aXNpdFN0bXQocy5maW5hbGl6ZXIpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQnJlYWtTdGF0ZW1lbnRcIjpcbiAgICAgIGNhc2UgXCJDb250aW51ZVN0YXRlbWVudFwiOlxuICAgICAgICByZXR1cm47XG4gICAgfVxuICB9O1xuXG4gIChwcm9ncmFtLmJvZHkgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKHZpc2l0U3RtdCk7XG4gIHJldHVybiBlcnJvcnM7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFBhcnNlciBcdTIwMTQgcmV0dXJucyBhY29ybiBBU1QgZGlyZWN0bHlcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5leHBvcnQgY29uc3QgcGFyc2UgPSAoc3JjOiBzdHJpbmcpOiBBc3ROb2RlID0+IHtcbiAgcmV0dXJuIGFjb3JuUGFyc2Uoc3JjLCB7XG4gICAgZWNtYVZlcnNpb246IFwibGF0ZXN0XCIsXG4gICAgc291cmNlVHlwZTogXCJzY3JpcHRcIixcbiAgICBhbGxvd1JldHVybk91dHNpZGVGdW5jdGlvbjogdHJ1ZSxcbiAgICBhbGxvd0F3YWl0T3V0c2lkZUZ1bmN0aW9uOiB0cnVlLFxuICB9KSBhcyB1bmtub3duIGFzIEFzdE5vZGU7XG59O1xuIiwgIi8qKlxuICogY29kZWdlbi50cyBcdTIwMTQgU2VjdXJpdHktY3JpdGljYWwgY29kZSBnZW5lcmF0aW9uIGFuZCBydW50aW1lIGV4ZWN1dGlvbi5cbiAqXG4gKiBUYWtlcyBhY29ybiBBU1QgKGZyb20gcGFyc2VyLnRzKSBhbmQgcHJvZHVjZXMgSmF2YVNjcmlwdCBzb3VyY2Ugc3RyaW5nc1xuICogZXZhbHVhdGVkIHZpYSBgbmV3IEZ1bmN0aW9uKClgLiBUaGUgcmVuZGVyIGZ1bmN0aW9ucyBhY3QgYXMgYSB3aGl0ZWxpc3Q6XG4gKiB1bnN1cHBvcnRlZCBub2RlIHR5cGVzIGFyZSByZWplY3RlZCBhdCB0aGUgYGRlZmF1bHRgIGJyYW5jaCBvZiBlYWNoIHN3aXRjaC5cbiAqIEV2ZXJ5IGlkZW50aWZpZXIgaXMgdmFsaWRhdGVkIGJ5IGBhc3NlcnRTYWZlSWRlbnRgIGFzIGRlZmVuc2UtaW4tZGVwdGguXG4gKlxuICogQXVkaXQgc3VyZmFjZTogcmVuZGVyRXhwciwgcmVuZGVyU3RtdCwgcmVuZGVyUGF0dGVybiwgYW5kIHRoZSBydW5uZXJcbiAqIGZ1bmN0aW9ucyB0aGF0IGludGVycG9sYXRlIGZ1ZWwgcmVmZXJlbmNlcy5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7IEFzdE5vZGUgfSBmcm9tIFwiLi9wYXJzZXIudHNcIjtcbmltcG9ydCB7IHBhcnNlLCB2YWxpZGF0ZVNjb3BlcywgdmFsaWRhdGVOb1Byb3RvdHlwZSB9IGZyb20gXCIuL3BhcnNlci50c1wiO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIERlZmVuc2UtaW4tZGVwdGg6IGlkZW50aWZpZXIgdmFsaWRhdGlvblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNvbnN0IFNBRkVfSURFTlRfUkUgPSAvXltBLVphLXpfJF1bQS1aYS16MC05XyRdKiQvO1xuXG5jb25zdCBGT1JCSURERU5fSURFTlRTID0gbmV3IFNldChbXG4gIFwiZXZhbFwiLCBcImFyZ3VtZW50c1wiLCBcInRoaXNcIiwgXCJnbG9iYWxUaGlzXCIsIFwid2luZG93XCIsIFwiZG9jdW1lbnRcIixcbiAgXCJwcm9jZXNzXCIsIFwicmVxdWlyZVwiLCBcIm1vZHVsZVwiLCBcImV4cG9ydHNcIiwgXCJfX2Rpcm5hbWVcIiwgXCJfX2ZpbGVuYW1lXCIsXG4gIFwiaW1wb3J0U2NyaXB0c1wiLFxuXSk7XG5cbmNvbnN0IFNBRkVfQ09OU1RSVUNUT1JTID0gbmV3IFNldChbXCJNYXBcIiwgXCJTZXRcIl0pO1xuXG5leHBvcnQgY29uc3QgYXNzZXJ0U2FmZUlkZW50ID0gKG5hbWU6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBpZiAoIVNBRkVfSURFTlRfUkUudGVzdChuYW1lKSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoYHVuc2FmZSBpZGVudGlmaWVyIGluIGNvZGVnZW46ICR7SlNPTi5zdHJpbmdpZnkobmFtZSl9YCk7XG4gIGlmIChGT1JCSURERU5fSURFTlRTLmhhcyhuYW1lKSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGZvcmJpZGRlbiBpZGVudGlmaWVyIGluIGNvZGVnZW46ICR7bmFtZX1gKTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gQ29kZSBnZW5lcmF0aW9uIChhY29ybiBBU1QgXHUyMTkyIEpTIHNvdXJjZSBzdHJpbmcpXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY29uc3QgcmVuZGVyTGl0ZXJhbCA9IChub2RlOiBBc3ROb2RlKSA9PiB7XG4gIGlmIChub2RlLnJlZ2V4KSB7XG4gICAgaWYgKHR5cGVvZiBub2RlLnJhdyA9PT0gXCJzdHJpbmdcIiAmJiBub2RlLnJhdy5zdGFydHNXaXRoKFwiL1wiKSkgcmV0dXJuIG5vZGUucmF3O1xuICAgIGNvbnN0IHBhdHRlcm4gPSBTdHJpbmcobm9kZS5yZWdleC5wYXR0ZXJuID8/IFwiXCIpO1xuICAgIGNvbnN0IGZsYWdzID0gU3RyaW5nKG5vZGUucmVnZXguZmxhZ3MgPz8gXCJcIik7XG4gICAgY29uc3QgZXNjYXBlZCA9IHBhdHRlcm4ucmVwbGFjZSgvXFxcXC9nLCBcIlxcXFxcXFxcXCIpLnJlcGxhY2UoL1xcLy9nLCBcIlxcXFwvXCIpO1xuICAgIHJldHVybiBgLyR7ZXNjYXBlZH0vJHtmbGFnc31gO1xuICB9XG4gIGlmIChub2RlLmJpZ2ludCAhPSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJiaWdpbnQgbGl0ZXJhbHMgbm90IHN1cHBvcnRlZFwiKTtcbiAgY29uc3QgdiA9IG5vZGUudmFsdWU7XG4gIGlmICh2ID09PSBudWxsKSByZXR1cm4gXCJudWxsXCI7XG4gIGlmICh0eXBlb2YgdiA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHYpO1xuICByZXR1cm4gU3RyaW5nKHYpO1xufTtcblxuY29uc3QgcmVuZGVyRXhwciA9IChlOiBBc3ROb2RlKTogc3RyaW5nID0+IHtcbiAgc3dpdGNoIChlLnR5cGUpIHtcbiAgICBjYXNlIFwiSWRlbnRpZmllclwiOlxuICAgICAgYXNzZXJ0U2FmZUlkZW50KGUubmFtZSk7XG4gICAgICByZXR1cm4gZS5uYW1lO1xuICAgIGNhc2UgXCJDaGFpbkV4cHJlc3Npb25cIjpcbiAgICAgIHJldHVybiByZW5kZXJFeHByKGUuZXhwcmVzc2lvbik7XG4gICAgY2FzZSBcIlNwcmVhZEVsZW1lbnRcIjpcbiAgICAgIHJldHVybiBgLi4uJHtyZW5kZXJFeHByKGUuYXJndW1lbnQpfWA7XG4gICAgY2FzZSBcIkxpdGVyYWxcIjpcbiAgICAgIHJldHVybiByZW5kZXJMaXRlcmFsKGUpO1xuICAgIGNhc2UgXCJBcnJheUV4cHJlc3Npb25cIjpcbiAgICAgIHJldHVybiBgWyR7KGUuZWxlbWVudHMgYXMgQXN0Tm9kZVtdKS5tYXAoKGVsKSA9PiBlbCA/IHJlbmRlckV4cHIoZWwpIDogXCJcIikuam9pbihcIiwgXCIpfV1gO1xuICAgIGNhc2UgXCJPYmplY3RFeHByZXNzaW9uXCI6XG4gICAgICByZXR1cm4gYHskeyhlLnByb3BlcnRpZXMgYXMgQXN0Tm9kZVtdKS5tYXAoKHApID0+IHAudHlwZSA9PT0gXCJTcHJlYWRFbGVtZW50XCIgPyBgLi4uJHtyZW5kZXJFeHByKHAuYXJndW1lbnQpfWAgOiByZW5kZXJQcm9wKHApKS5qb2luKFwiLCBcIil9fWA7XG4gICAgY2FzZSBcIkF3YWl0RXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIGAoYXdhaXQgJHtyZW5kZXJFeHByKGUuYXJndW1lbnQpfSlgO1xuICAgIGNhc2UgXCJDYWxsRXhwcmVzc2lvblwiOiB7XG4gICAgICBjb25zdCBjYWxsZWVTdHIgPSByZW5kZXJFeHByKGUuY2FsbGVlKTtcbiAgICAgIGNvbnN0IG5lZWRzUGFyZW5zID0gZS5jYWxsZWUudHlwZSA9PT0gXCJBcnJvd0Z1bmN0aW9uRXhwcmVzc2lvblwiO1xuICAgICAgcmV0dXJuIGAke25lZWRzUGFyZW5zID8gXCIoXCIgOiBcIlwifSR7Y2FsbGVlU3RyfSR7bmVlZHNQYXJlbnMgPyBcIilcIiA6IFwiXCJ9JHtlLm9wdGlvbmFsID8gXCI/LlwiIDogXCJcIn0oJHsoZS5hcmd1bWVudHMgYXMgQXN0Tm9kZVtdKS5tYXAocmVuZGVyRXhwcikuam9pbihcIiwgXCIpfSlgO1xuICAgIH1cbiAgICBjYXNlIFwiTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIGUuY29tcHV0ZWRcbiAgICAgICAgPyBgJHtyZW5kZXJFeHByKGUub2JqZWN0KX0ke2Uub3B0aW9uYWwgPyBcIj8uXCIgOiBcIlwifVtfX2Noaygke3JlbmRlckV4cHIoZS5wcm9wZXJ0eSl9KV1gXG4gICAgICAgIDogYCR7cmVuZGVyRXhwcihlLm9iamVjdCl9JHtlLm9wdGlvbmFsID8gXCI/LlwiIDogXCIuXCJ9JHtyZW5kZXJFeHByKGUucHJvcGVydHkpfWA7XG4gICAgY2FzZSBcIkFzc2lnbm1lbnRFeHByZXNzaW9uXCI6XG4gICAgICByZXR1cm4gYCR7cmVuZGVyRXhwcihlLmxlZnQpfSAke2Uub3BlcmF0b3J9ICR7cmVuZGVyRXhwcihlLnJpZ2h0KX1gO1xuICAgIGNhc2UgXCJVcGRhdGVFeHByZXNzaW9uXCI6XG4gICAgICByZXR1cm4gZS5wcmVmaXhcbiAgICAgICAgPyBgJHtlLm9wZXJhdG9yfSR7cmVuZGVyRXhwcihlLmFyZ3VtZW50KX1gXG4gICAgICAgIDogYCR7cmVuZGVyRXhwcihlLmFyZ3VtZW50KX0ke2Uub3BlcmF0b3J9YDtcbiAgICBjYXNlIFwiQmluYXJ5RXhwcmVzc2lvblwiOlxuICAgIGNhc2UgXCJMb2dpY2FsRXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIGAoJHtyZW5kZXJFeHByKGUubGVmdCl9ICR7ZS5vcGVyYXRvcn0gJHtyZW5kZXJFeHByKGUucmlnaHQpfSlgO1xuICAgIGNhc2UgXCJVbmFyeUV4cHJlc3Npb25cIjpcbiAgICAgIHJldHVybiBlLm9wZXJhdG9yID09PSBcInR5cGVvZlwiXG4gICAgICAgID8gYCgke2Uub3BlcmF0b3J9ICR7cmVuZGVyRXhwcihlLmFyZ3VtZW50KX0pYFxuICAgICAgICA6IGAoJHtlLm9wZXJhdG9yfSR7cmVuZGVyRXhwcihlLmFyZ3VtZW50KX0pYDtcbiAgICBjYXNlIFwiQ29uZGl0aW9uYWxFeHByZXNzaW9uXCI6XG4gICAgICByZXR1cm4gYCgke3JlbmRlckV4cHIoZS50ZXN0KX0gPyAke3JlbmRlckV4cHIoZS5jb25zZXF1ZW50KX0gOiAke3JlbmRlckV4cHIoZS5hbHRlcm5hdGUpfSlgO1xuICAgIGNhc2UgXCJOZXdFeHByZXNzaW9uXCI6IHtcbiAgICAgIGlmIChlLmNhbGxlZS50eXBlICE9PSBcIklkZW50aWZpZXJcIikgdGhyb3cgbmV3IEVycm9yKFwibmV3OiBvbmx5IHNpbXBsZSBjb25zdHJ1Y3RvcnMgYWxsb3dlZFwiKTtcbiAgICAgIGNvbnN0IG5hbWUgPSBlLmNhbGxlZS5uYW1lO1xuICAgICAgYXNzZXJ0U2FmZUlkZW50KG5hbWUpO1xuICAgICAgaWYgKCFTQUZFX0NPTlNUUlVDVE9SUy5oYXMobmFtZSkpIHRocm93IG5ldyBFcnJvcihgbmV3OiAke25hbWV9IGlzIG5vdCBhbiBhbGxvd2VkIGNvbnN0cnVjdG9yYCk7XG4gICAgICByZXR1cm4gYG5ldyAke25hbWV9KCR7KGUuYXJndW1lbnRzIGFzIEFzdE5vZGVbXSkubWFwKHJlbmRlckV4cHIpLmpvaW4oXCIsIFwiKX0pYDtcbiAgICB9XG4gICAgY2FzZSBcIkFycm93RnVuY3Rpb25FeHByZXNzaW9uXCI6XG4gICAgICByZXR1cm4gcmVuZGVyQXJyb3coZSk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcihgdW5zdXBwb3J0ZWQgZXhwcmVzc2lvbjogJHtlLnR5cGV9YCk7XG4gIH1cbn07XG5cbmNvbnN0IHJlbmRlclByb3AgPSAocDogQXN0Tm9kZSkgPT4ge1xuICBpZiAocC5jb21wdXRlZCkgdGhyb3cgbmV3IEVycm9yKFwiY29tcHV0ZWQgcHJvcGVydGllcyBub3Qgc3VwcG9ydGVkXCIpO1xuICBpZiAocC5tZXRob2QpIHRocm93IG5ldyBFcnJvcihcIm1ldGhvZCBwcm9wZXJ0aWVzIG5vdCBzdXBwb3J0ZWRcIik7XG4gIGlmIChwLmtpbmQgIT09IFwiaW5pdFwiKSB0aHJvdyBuZXcgRXJyb3IoYHVuc3VwcG9ydGVkIHByb3BlcnR5IGtpbmQ6ICR7cC5raW5kfWApO1xuICBjb25zdCBrZXkgPVxuICAgIHAua2V5LnR5cGUgPT09IFwiSWRlbnRpZmllclwiID8gcC5rZXkubmFtZSA6IHJlbmRlckxpdGVyYWwocC5rZXkpO1xuICBpZiAocC5zaG9ydGhhbmQgJiYgcC52YWx1ZS50eXBlID09PSBcIklkZW50aWZpZXJcIiAmJiBwLnZhbHVlLm5hbWUgPT09IGtleSkge1xuICAgIGFzc2VydFNhZmVJZGVudChrZXkpO1xuICAgIHJldHVybiBrZXk7XG4gIH1cbiAgcmV0dXJuIGAke2tleX06ICR7cmVuZGVyRXhwcihwLnZhbHVlKX1gO1xufTtcblxuY29uc3QgcmVuZGVyQXJyb3cgPSAoZTogQXN0Tm9kZSkgPT4ge1xuICBjb25zdCBwYXJhbXMgPSBgKCR7KGUucGFyYW1zIGFzIEFzdE5vZGVbXSkubWFwKHJlbmRlclBhdHRlcm4pLmpvaW4oXCIsIFwiKX0pYDtcbiAgY29uc3QgcHJlZml4ID0gZS5hc3luYyA/IFwiYXN5bmMgXCIgOiBcIlwiO1xuICBpZiAoZS5ib2R5LnR5cGUgPT09IFwiQmxvY2tTdGF0ZW1lbnRcIikge1xuICAgIHJldHVybiBgJHtwcmVmaXh9JHtwYXJhbXN9ID0+ICR7cmVuZGVyU3RtdChlLmJvZHksIHRydWUpfWA7XG4gIH1cbiAgcmV0dXJuIGAke3ByZWZpeH0ke3BhcmFtc30gPT4geyBfX2J1cm4oKTsgcmV0dXJuICR7cmVuZGVyRXhwcihlLmJvZHkpfTsgfWA7XG59O1xuXG5jb25zdCByZW5kZXJTdG10ID0gKHM6IEFzdE5vZGUsIGluRm4gPSBmYWxzZSk6IHN0cmluZyA9PiB7XG4gIGNvbnN0IGJ1cm4gPSBpbkZuID8gXCJfX2J1cm4oKTtcIiA6IFwiXCI7XG4gIGNvbnN0IHJlbmRlckxvb3BCb2R5ID0gKGJvZHk6IEFzdE5vZGUpID0+IHtcbiAgICBpZiAoYm9keS50eXBlID09PSBcIkJsb2NrU3RhdGVtZW50XCIpIHtcbiAgICAgIGNvbnN0IGlubmVyID0gKGJvZHkuYm9keSBhcyBBc3ROb2RlW10pLm1hcCgoYikgPT4gcmVuZGVyU3RtdChiLCBpbkZuKSkuam9pbihcIlwiKTtcbiAgICAgIHJldHVybiBge19fYnVybigpOyR7aW5uZXJ9fWA7XG4gICAgfVxuICAgIHJldHVybiBge19fYnVybigpOyR7cmVuZGVyU3RtdChib2R5LCBpbkZuKX19YDtcbiAgfTtcbiAgc3dpdGNoIChzLnR5cGUpIHtcbiAgICBjYXNlIFwiQmxvY2tTdGF0ZW1lbnRcIjpcbiAgICAgIHJldHVybiBgeyR7KHMuYm9keSBhcyBBc3ROb2RlW10pLm1hcCgoYikgPT4gcmVuZGVyU3RtdChiLCBpbkZuKSkuam9pbihcIlwiKX19YDtcbiAgICBjYXNlIFwiRXhwcmVzc2lvblN0YXRlbWVudFwiOlxuICAgICAgcmV0dXJuIGAke2J1cm59JHtyZW5kZXJFeHByKHMuZXhwcmVzc2lvbil9O2A7XG4gICAgY2FzZSBcIklmU3RhdGVtZW50XCI6IHtcbiAgICAgIGNvbnN0IHdyYXAgPSAoc3RtdDogQXN0Tm9kZSkgPT5cbiAgICAgICAgc3RtdC50eXBlID09PSBcIkJsb2NrU3RhdGVtZW50XCIgPyByZW5kZXJTdG10KHN0bXQsIGluRm4pIDogYHske3JlbmRlclN0bXQoc3RtdCwgaW5Gbil9fWA7XG4gICAgICByZXR1cm4gYCR7YnVybn1pZiAoJHtyZW5kZXJFeHByKHMudGVzdCl9KSAke3dyYXAocy5jb25zZXF1ZW50KX0ke3MuYWx0ZXJuYXRlID8gYCBlbHNlICR7d3JhcChzLmFsdGVybmF0ZSl9YCA6IFwiXCJ9YDtcbiAgICB9XG4gICAgY2FzZSBcIlJldHVyblN0YXRlbWVudFwiOlxuICAgICAgcmV0dXJuIGAke2J1cm59cmV0dXJuJHtzLmFyZ3VtZW50ID8gYCAke3JlbmRlckV4cHIocy5hcmd1bWVudCl9YCA6IFwiXCJ9O2A7XG4gICAgY2FzZSBcIlRocm93U3RhdGVtZW50XCI6XG4gICAgICByZXR1cm4gYCR7YnVybn10aHJvdyAke3JlbmRlckV4cHIocy5hcmd1bWVudCl9O2A7XG4gICAgY2FzZSBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIjpcbiAgICAgIGlmIChzLmtpbmQgPT09IFwidmFyXCIpIHRocm93IG5ldyBFcnJvcihcInZhciBkZWNsYXJhdGlvbnMgbm90IGFsbG93ZWRcIik7XG4gICAgICByZXR1cm4gYCR7YnVybn0ke3Mua2luZH0gJHsocy5kZWNsYXJhdGlvbnMgYXMgQXN0Tm9kZVtdKS5tYXAocmVuZGVyRGVjbCkuam9pbihcIiwgXCIpfTtgO1xuICAgIGNhc2UgXCJCcmVha1N0YXRlbWVudFwiOlxuICAgICAgcmV0dXJuIGAke2J1cm59YnJlYWs7YDtcbiAgICBjYXNlIFwiQ29udGludWVTdGF0ZW1lbnRcIjpcbiAgICAgIHJldHVybiBgJHtidXJufWNvbnRpbnVlO2A7XG4gICAgY2FzZSBcIldoaWxlU3RhdGVtZW50XCI6XG4gICAgICByZXR1cm4gYCR7YnVybn13aGlsZSAoJHtyZW5kZXJFeHByKHMudGVzdCl9KSAke3JlbmRlckxvb3BCb2R5KHMuYm9keSl9YDtcbiAgICBjYXNlIFwiRm9yU3RhdGVtZW50XCI6IHtcbiAgICAgIGNvbnN0IGluaXQgPVxuICAgICAgICBzLmluaXQgPT0gbnVsbFxuICAgICAgICAgID8gXCJcIlxuICAgICAgICAgIDogcy5pbml0LnR5cGUgPT09IFwiVmFyaWFibGVEZWNsYXJhdGlvblwiXG4gICAgICAgICAgPyBgJHtzLmluaXQua2luZH0gJHsocy5pbml0LmRlY2xhcmF0aW9ucyBhcyBBc3ROb2RlW10pLm1hcChyZW5kZXJEZWNsKS5qb2luKFwiLCBcIil9YFxuICAgICAgICAgIDogcmVuZGVyRXhwcihzLmluaXQpO1xuICAgICAgY29uc3QgdGVzdCA9IHMudGVzdCA/IHJlbmRlckV4cHIocy50ZXN0KSA6IFwiXCI7XG4gICAgICBjb25zdCB1cGRhdGUgPSBzLnVwZGF0ZSA/IHJlbmRlckV4cHIocy51cGRhdGUpIDogXCJcIjtcbiAgICAgIHJldHVybiBgJHtidXJufWZvciAoJHtpbml0fTsgJHt0ZXN0fTsgJHt1cGRhdGV9KSAke3JlbmRlckxvb3BCb2R5KHMuYm9keSl9YDtcbiAgICB9XG4gICAgY2FzZSBcIkZvckluU3RhdGVtZW50XCI6IHtcbiAgICAgIGNvbnN0IGxlZnQgPSBzLmxlZnQudHlwZSA9PT0gXCJWYXJpYWJsZURlY2xhcmF0aW9uXCJcbiAgICAgICAgPyBgJHtzLmxlZnQua2luZH0gJHsocy5sZWZ0LmRlY2xhcmF0aW9ucyBhcyBBc3ROb2RlW10pLm1hcChyZW5kZXJEZWNsKS5qb2luKFwiLCBcIil9YFxuICAgICAgICA6IHJlbmRlckV4cHIocy5sZWZ0KTtcbiAgICAgIHJldHVybiBgJHtidXJufWZvciAoJHtsZWZ0fSBpbiAke3JlbmRlckV4cHIocy5yaWdodCl9KSAke3JlbmRlckxvb3BCb2R5KHMuYm9keSl9YDtcbiAgICB9XG4gICAgY2FzZSBcIkZvck9mU3RhdGVtZW50XCI6IHtcbiAgICAgIGlmIChzLmF3YWl0KSB0aHJvdyBuZXcgRXJyb3IoXCJmb3ItYXdhaXQtb2Ygbm90IHN1cHBvcnRlZFwiKTtcbiAgICAgIGNvbnN0IGxlZnQgPSBzLmxlZnQudHlwZSA9PT0gXCJWYXJpYWJsZURlY2xhcmF0aW9uXCJcbiAgICAgICAgPyBgJHtzLmxlZnQua2luZH0gJHsocy5sZWZ0LmRlY2xhcmF0aW9ucyBhcyBBc3ROb2RlW10pLm1hcChyZW5kZXJEZWNsKS5qb2luKFwiLCBcIil9YFxuICAgICAgICA6IHJlbmRlckV4cHIocy5sZWZ0KTtcbiAgICAgIHJldHVybiBgJHtidXJufWZvciAoJHtsZWZ0fSBvZiAke3JlbmRlckV4cHIocy5yaWdodCl9KSAke3JlbmRlckxvb3BCb2R5KHMuYm9keSl9YDtcbiAgICB9XG4gICAgY2FzZSBcIlN3aXRjaFN0YXRlbWVudFwiOiB7XG4gICAgICBjb25zdCBjYXNlcyA9IChzLmNhc2VzIGFzIEFzdE5vZGVbXSkubWFwKChjKSA9PiB7XG4gICAgICAgIGNvbnN0IGhlYWQgPSBjLnRlc3QgPyBgY2FzZSAke3JlbmRlckV4cHIoYy50ZXN0KX06YCA6IFwiZGVmYXVsdDpcIjtcbiAgICAgICAgY29uc3QgYm9keSA9IChjLmNvbnNlcXVlbnQgYXMgQXN0Tm9kZVtdKS5tYXAoKHN0bXQpID0+IHJlbmRlclN0bXQoc3RtdCwgaW5GbikpLmpvaW4oXCJcIik7XG4gICAgICAgIHJldHVybiBgJHtoZWFkfSR7Ym9keX1gO1xuICAgICAgfSkuam9pbihcIlwiKTtcbiAgICAgIHJldHVybiBgJHtidXJufXN3aXRjaCAoJHtyZW5kZXJFeHByKHMuZGlzY3JpbWluYW50KX0pIHske2Nhc2VzfX1gO1xuICAgIH1cbiAgICBjYXNlIFwiVHJ5U3RhdGVtZW50XCI6IHtcbiAgICAgIGNvbnN0IGJsb2NrID0gcmVuZGVyU3RtdChzLmJsb2NrLCBpbkZuKTtcbiAgICAgIGNvbnN0IGhhbmRsZXIgPSBzLmhhbmRsZXJcbiAgICAgICAgPyAoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFyYW0gPSBzLmhhbmRsZXIucGFyYW0gPyByZW5kZXJQYXR0ZXJuKHMuaGFuZGxlci5wYXJhbSkgOiBcIlwiO1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IHJlbmRlclN0bXQocy5oYW5kbGVyLmJvZHksIGluRm4pO1xuICAgICAgICAgICAgcmV0dXJuIGBjYXRjaCR7cGFyYW0gPyBgICgke3BhcmFtfSlgIDogXCJcIn0gJHtib2R5fWA7XG4gICAgICAgICAgfSkoKVxuICAgICAgICA6IFwiXCI7XG4gICAgICBjb25zdCBmaW5hbGl6ZXIgPSBzLmZpbmFsaXplciA/IGAgZmluYWxseSAke3JlbmRlclN0bXQocy5maW5hbGl6ZXIsIGluRm4pfWAgOiBcIlwiO1xuICAgICAgcmV0dXJuIGAke2J1cm59dHJ5ICR7YmxvY2t9JHtoYW5kbGVyfSR7ZmluYWxpemVyfWA7XG4gICAgfVxuICAgIGNhc2UgXCJFbXB0eVN0YXRlbWVudFwiOlxuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcihgdW5zdXBwb3J0ZWQgc3RhdGVtZW50OiAke3MudHlwZX1gKTtcbiAgfVxufTtcblxuY29uc3QgcmVuZGVyRGVjbCA9IChkOiBBc3ROb2RlKSA9PlxuICBgJHtyZW5kZXJQYXR0ZXJuKGQuaWQpfSR7ZC5pbml0ID8gYCA9ICR7cmVuZGVyRXhwcihkLmluaXQpfWAgOiBcIlwifWA7XG5cbmNvbnN0IHJlbmRlclBhdHRlcm4gPSAocDogQXN0Tm9kZSk6IHN0cmluZyA9PiB7XG4gIHN3aXRjaCAocC50eXBlKSB7XG4gICAgY2FzZSBcIklkZW50aWZpZXJcIjpcbiAgICAgIGFzc2VydFNhZmVJZGVudChwLm5hbWUpO1xuICAgICAgcmV0dXJuIHAubmFtZTtcbiAgICBjYXNlIFwiQXNzaWdubWVudFBhdHRlcm5cIjpcbiAgICAgIHJldHVybiBgJHtyZW5kZXJQYXR0ZXJuKHAubGVmdCl9ID0gJHtyZW5kZXJFeHByKHAucmlnaHQpfWA7XG4gICAgY2FzZSBcIlJlc3RFbGVtZW50XCI6XG4gICAgICByZXR1cm4gYC4uLiR7cmVuZGVyUGF0dGVybihwLmFyZ3VtZW50KX1gO1xuICAgIGNhc2UgXCJBcnJheVBhdHRlcm5cIjpcbiAgICAgIHJldHVybiBgWyR7KHAuZWxlbWVudHMgYXMgKEFzdE5vZGUgfCBudWxsKVtdKS5tYXAoKGVsKSA9PiBlbCA/IHJlbmRlclBhdHRlcm4oZWwpIDogXCJcIikuam9pbihcIiwgXCIpfV1gO1xuICAgIGNhc2UgXCJPYmplY3RQYXR0ZXJuXCI6XG4gICAgICByZXR1cm4gYHskeyhwLnByb3BlcnRpZXMgYXMgQXN0Tm9kZVtdKS5tYXAoKHByb3ApID0+XG4gICAgICAgIHByb3AudHlwZSA9PT0gXCJSZXN0RWxlbWVudFwiID8gYC4uLiR7cmVuZGVyUGF0dGVybihwcm9wLmFyZ3VtZW50KX1gIDogcmVuZGVyUGF0dGVyblByb3BlcnR5KHByb3ApXG4gICAgICApLmpvaW4oXCIsIFwiKX19YDtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKGB1bnN1cHBvcnRlZCBwYXR0ZXJuOiAke3AudHlwZX1gKTtcbiAgfVxufTtcblxuY29uc3QgcmVuZGVyUGF0dGVyblByb3BlcnR5ID0gKHA6IEFzdE5vZGUpOiBzdHJpbmcgPT4ge1xuICBpZiAocC5jb21wdXRlZCkgdGhyb3cgbmV3IEVycm9yKFwiY29tcHV0ZWQgcGF0dGVybiBwcm9wZXJ0aWVzIG5vdCBzdXBwb3J0ZWRcIik7XG4gIGNvbnN0IGtleSA9XG4gICAgcC5rZXkudHlwZSA9PT0gXCJJZGVudGlmaWVyXCIgPyBwLmtleS5uYW1lIDogcmVuZGVyTGl0ZXJhbChwLmtleSk7XG4gIGlmIChcbiAgICBwLnNob3J0aGFuZCAmJlxuICAgIHAua2V5LnR5cGUgPT09IFwiSWRlbnRpZmllclwiICYmXG4gICAgcC52YWx1ZS50eXBlID09PSBcIklkZW50aWZpZXJcIiAmJlxuICAgIHAudmFsdWUubmFtZSA9PT0gcC5rZXkubmFtZVxuICApIHtcbiAgICBhc3NlcnRTYWZlSWRlbnQoa2V5KTtcbiAgICByZXR1cm4ga2V5O1xuICB9XG4gIHJldHVybiBgJHtrZXl9OiAke3JlbmRlclBhdHRlcm4ocC52YWx1ZSl9YDtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gUmVzZXJ2ZWQgbmFtZSB2YWxpZGF0aW9uXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY29uc3QgdmFsaWRhdGVOb1Jlc2VydmVkUnVudGltZU5hbWVzID0gKHByb2dyYW06IEFzdE5vZGUsIHJlc2VydmVkTmFtZXM6IHN0cmluZ1tdKTogc3RyaW5nW10gPT4ge1xuICBjb25zdCByZXNlcnZlZCA9IG5ldyBTZXQocmVzZXJ2ZWROYW1lcyk7XG4gIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcblxuICBjb25zdCBoaXQgPSAobmFtZTogc3RyaW5nKSA9PiB7XG4gICAgaWYgKHJlc2VydmVkLmhhcyhuYW1lKSkgZXJyb3JzLnB1c2goYHJlc2VydmVkIGlkZW50aWZpZXI6ICR7bmFtZX1gKTtcbiAgfTtcblxuICBjb25zdCB2aXNpdFBhdHRlcm4gPSAocDogQXN0Tm9kZSk6IHZvaWQgPT4ge1xuICAgIHN3aXRjaCAocC50eXBlKSB7XG4gICAgICBjYXNlIFwiSWRlbnRpZmllclwiOlxuICAgICAgICBoaXQocC5uYW1lKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkFzc2lnbm1lbnRQYXR0ZXJuXCI6XG4gICAgICAgIHZpc2l0UGF0dGVybihwLmxlZnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiUmVzdEVsZW1lbnRcIjpcbiAgICAgICAgdmlzaXRQYXR0ZXJuKHAuYXJndW1lbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQXJyYXlQYXR0ZXJuXCI6XG4gICAgICAgIChwLmVsZW1lbnRzIGFzIChBc3ROb2RlIHwgbnVsbClbXSkuZm9yRWFjaCgoZWwpID0+IGVsICYmIHZpc2l0UGF0dGVybihlbCkpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiT2JqZWN0UGF0dGVyblwiOlxuICAgICAgICAocC5wcm9wZXJ0aWVzIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgocHJvcCkgPT4ge1xuICAgICAgICAgIGlmIChwcm9wLnR5cGUgPT09IFwiUmVzdEVsZW1lbnRcIikgdmlzaXRQYXR0ZXJuKHByb3AuYXJndW1lbnQpO1xuICAgICAgICAgIGVsc2UgdmlzaXRQYXR0ZXJuKHByb3AudmFsdWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCB2aXNpdEV4cHIgPSAoZTogQXN0Tm9kZSk6IHZvaWQgPT4ge1xuICAgIGlmICghZSkgcmV0dXJuO1xuICAgIHN3aXRjaCAoZS50eXBlKSB7XG4gICAgICBjYXNlIFwiSWRlbnRpZmllclwiOlxuICAgICAgICBoaXQoZS5uYW1lKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkxpdGVyYWxcIjpcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlNwcmVhZEVsZW1lbnRcIjpcbiAgICAgICAgdmlzaXRFeHByKGUuYXJndW1lbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQXJyYXlFeHByZXNzaW9uXCI6XG4gICAgICAgIChlLmVsZW1lbnRzIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgoZWwpID0+IGVsICYmIHZpc2l0RXhwcihlbCkpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiT2JqZWN0RXhwcmVzc2lvblwiOlxuICAgICAgICAoZS5wcm9wZXJ0aWVzIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgocCkgPT4ge1xuICAgICAgICAgIGlmIChwLnR5cGUgPT09IFwiU3ByZWFkRWxlbWVudFwiKSB7XG4gICAgICAgICAgICB2aXNpdEV4cHIocC5hcmd1bWVudCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChwLnNob3J0aGFuZCAmJiBwLnZhbHVlLnR5cGUgPT09IFwiSWRlbnRpZmllclwiKSBoaXQocC52YWx1ZS5uYW1lKTtcbiAgICAgICAgICB2aXNpdEV4cHIocC52YWx1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQXdhaXRFeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLmFyZ3VtZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkNoYWluRXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5leHByZXNzaW9uKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIk5ld0V4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUuY2FsbGVlKTtcbiAgICAgICAgKGUuYXJndW1lbnRzIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgoYSkgPT4gdmlzaXRFeHByKGEpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIkNhbGxFeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLmNhbGxlZSk7XG4gICAgICAgIChlLmFyZ3VtZW50cyBhcyBBc3ROb2RlW10pLmZvckVhY2goKGEpID0+IHZpc2l0RXhwcihhKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICAgIHZpc2l0RXhwcihlLm9iamVjdCk7XG4gICAgICAgIGlmIChlLmNvbXB1dGVkKSB2aXNpdEV4cHIoZS5wcm9wZXJ0eSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJBc3NpZ25tZW50RXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5sZWZ0KTtcbiAgICAgICAgdmlzaXRFeHByKGUucmlnaHQpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiVXBkYXRlRXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5hcmd1bWVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJCaW5hcnlFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiTG9naWNhbEV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUubGVmdCk7XG4gICAgICAgIHZpc2l0RXhwcihlLnJpZ2h0KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlVuYXJ5RXhwcmVzc2lvblwiOlxuICAgICAgICB2aXNpdEV4cHIoZS5hcmd1bWVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJDb25kaXRpb25hbEV4cHJlc3Npb25cIjpcbiAgICAgICAgdmlzaXRFeHByKGUudGVzdCk7XG4gICAgICAgIHZpc2l0RXhwcihlLmNvbnNlcXVlbnQpO1xuICAgICAgICB2aXNpdEV4cHIoZS5hbHRlcm5hdGUpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQXJyb3dGdW5jdGlvbkV4cHJlc3Npb25cIjpcbiAgICAgICAgKGUucGFyYW1zIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCh2aXNpdFBhdHRlcm4pO1xuICAgICAgICBpZiAoZS5ib2R5LnR5cGUgPT09IFwiQmxvY2tTdGF0ZW1lbnRcIikgdmlzaXRTdG10KGUuYm9keSk7XG4gICAgICAgIGVsc2UgdmlzaXRFeHByKGUuYm9keSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgdmlzaXRWYXJEZWNsID0gKGQ6IEFzdE5vZGUpID0+IHtcbiAgICB2aXNpdFBhdHRlcm4oZC5pZCk7XG4gICAgaWYgKGQuaW5pdCkgdmlzaXRFeHByKGQuaW5pdCk7XG4gIH07XG5cbiAgY29uc3QgdmlzaXRTdG10ID0gKHM6IEFzdE5vZGUpOiB2b2lkID0+IHtcbiAgICBzd2l0Y2ggKHMudHlwZSkge1xuICAgICAgY2FzZSBcIkJsb2NrU3RhdGVtZW50XCI6XG4gICAgICAgIChzLmJvZHkgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKHZpc2l0U3RtdCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJFeHByZXNzaW9uU3RhdGVtZW50XCI6XG4gICAgICAgIHZpc2l0RXhwcihzLmV4cHJlc3Npb24pO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiSWZTdGF0ZW1lbnRcIjpcbiAgICAgICAgdmlzaXRFeHByKHMudGVzdCk7XG4gICAgICAgIHZpc2l0U3RtdChzLmNvbnNlcXVlbnQpO1xuICAgICAgICBpZiAocy5hbHRlcm5hdGUpIHZpc2l0U3RtdChzLmFsdGVybmF0ZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJSZXR1cm5TdGF0ZW1lbnRcIjpcbiAgICAgICAgaWYgKHMuYXJndW1lbnQpIHZpc2l0RXhwcihzLmFyZ3VtZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlRocm93U3RhdGVtZW50XCI6XG4gICAgICAgIHZpc2l0RXhwcihzLmFyZ3VtZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIjpcbiAgICAgICAgKHMuZGVjbGFyYXRpb25zIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCh2aXNpdFZhckRlY2wpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiV2hpbGVTdGF0ZW1lbnRcIjpcbiAgICAgICAgdmlzaXRFeHByKHMudGVzdCk7XG4gICAgICAgIHZpc2l0U3RtdChzLmJvZHkpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiRm9yU3RhdGVtZW50XCI6XG4gICAgICAgIGlmIChzLmluaXQ/LnR5cGUgPT09IFwiVmFyaWFibGVEZWNsYXJhdGlvblwiKSAocy5pbml0LmRlY2xhcmF0aW9ucyBhcyBBc3ROb2RlW10pLmZvckVhY2godmlzaXRWYXJEZWNsKTtcbiAgICAgICAgZWxzZSBpZiAocy5pbml0KSB2aXNpdEV4cHIocy5pbml0KTtcbiAgICAgICAgaWYgKHMudGVzdCkgdmlzaXRFeHByKHMudGVzdCk7XG4gICAgICAgIGlmIChzLnVwZGF0ZSkgdmlzaXRFeHByKHMudXBkYXRlKTtcbiAgICAgICAgdmlzaXRTdG10KHMuYm9keSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJGb3JJblN0YXRlbWVudFwiOlxuICAgICAgY2FzZSBcIkZvck9mU3RhdGVtZW50XCI6XG4gICAgICAgIGlmIChzLmxlZnQudHlwZSA9PT0gXCJWYXJpYWJsZURlY2xhcmF0aW9uXCIpIChzLmxlZnQuZGVjbGFyYXRpb25zIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCh2aXNpdFZhckRlY2wpO1xuICAgICAgICBlbHNlIHZpc2l0RXhwcihzLmxlZnQpO1xuICAgICAgICB2aXNpdEV4cHIocy5yaWdodCk7XG4gICAgICAgIHZpc2l0U3RtdChzLmJvZHkpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiU3dpdGNoU3RhdGVtZW50XCI6XG4gICAgICAgIHZpc2l0RXhwcihzLmRpc2NyaW1pbmFudCk7XG4gICAgICAgIChzLmNhc2VzIGFzIEFzdE5vZGVbXSkuZm9yRWFjaCgoYykgPT4ge1xuICAgICAgICAgIGlmIChjLnRlc3QpIHZpc2l0RXhwcihjLnRlc3QpO1xuICAgICAgICAgIChjLmNvbnNlcXVlbnQgYXMgQXN0Tm9kZVtdKS5mb3JFYWNoKHZpc2l0U3RtdCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiVHJ5U3RhdGVtZW50XCI6XG4gICAgICAgIHZpc2l0U3RtdChzLmJsb2NrKTtcbiAgICAgICAgaWYgKHMuaGFuZGxlcikge1xuICAgICAgICAgIGlmIChzLmhhbmRsZXIucGFyYW0pIHZpc2l0UGF0dGVybihzLmhhbmRsZXIucGFyYW0pO1xuICAgICAgICAgIHZpc2l0U3RtdChzLmhhbmRsZXIuYm9keSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMuZmluYWxpemVyKSB2aXNpdFN0bXQocy5maW5hbGl6ZXIpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiQnJlYWtTdGF0ZW1lbnRcIjpcbiAgICAgIGNhc2UgXCJDb250aW51ZVN0YXRlbWVudFwiOlxuICAgICAgY2FzZSBcIkVtcHR5U3RhdGVtZW50XCI6XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gIH07XG5cbiAgKHByb2dyYW0uYm9keSBhcyBBc3ROb2RlW10pLmZvckVhY2godmlzaXRTdG10KTtcbiAgcmV0dXJuIGVycm9ycztcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gUnVubmVyIGNvZGVnZW4gKHdyYXBzIHByb2dyYW0gYm9keSB3aXRoIGZ1ZWwgbWV0ZXJpbmcpXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZXhwb3J0IGNvbnN0IHJlbmRlcldpdGhGdWVsID0gKHByb2dyYW06IEFzdE5vZGUsIGZ1ZWwgPSAxMDAwMCkgPT4ge1xuICBjb25zdCBwcmVsdWRlID0gYGxldCBfX2Z1ZWwgPSAke2Z1ZWx9OyBjb25zdCBfX2J1cm4gPSAoKSA9PiB7IGlmICgtLV9fZnVlbCA8IDApIHRocm93IG5ldyBFcnJvcihcImZ1ZWwgZXhoYXVzdGVkXCIpOyB9OyR7Q0hLX0ZOfWA7XG4gIGNvbnN0IGJvZHkgPSAocHJvZ3JhbS5ib2R5IGFzIEFzdE5vZGVbXSkubWFwKChzKSA9PiByZW5kZXJTdG10KHMsIHRydWUpKS5qb2luKFwiXCIpO1xuICByZXR1cm4gYCR7cHJlbHVkZX0ke2JvZHl9YDtcbn07XG5cbmNvbnN0IENIS19GTiA9IGBjb25zdCBfX2NoayA9IChrKSA9PiB7IGlmICh0eXBlb2YgayA9PT0gXCJzdHJpbmdcIiAmJiAoayA9PT0gXCJjb25zdHJ1Y3RvclwiIHx8IGsgPT09IFwiX19wcm90b19fXCIgfHwgayA9PT0gXCJwcm90b3R5cGVcIikpIHRocm93IG5ldyBFcnJvcihcImZvcmJpZGRlbiBwcm9wZXJ0eTogXCIgKyBrKTsgcmV0dXJuIGs7IH07YDtcblxuY29uc3QgcmVuZGVyUnVubmVyV2l0aEZ1ZWxTaGFyZWQgPSAocHJvZ3JhbTogQXN0Tm9kZSwgZnVlbFJlZk5hbWUgPSBcIl9fZnVlbFwiKSA9PiB7XG4gIGFzc2VydFNhZmVJZGVudChmdWVsUmVmTmFtZSk7XG4gIGNvbnN0IHJlc2VydmVkRXJycyA9IHZhbGlkYXRlTm9SZXNlcnZlZFJ1bnRpbWVOYW1lcyhwcm9ncmFtLCBbZnVlbFJlZk5hbWUsIFwiX19idXJuXCIsIFwiX19jaGtcIl0pO1xuICBpZiAocmVzZXJ2ZWRFcnJzLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKHJlc2VydmVkRXJycy5qb2luKFwiLCBcIikpO1xuICBjb25zdCBwcmVsdWRlID0gYGNvbnN0IF9fYnVybiA9ICgpID0+IHsgaWYgKC0tJHtmdWVsUmVmTmFtZX0udmFsdWUgPCAwKSB0aHJvdyBuZXcgRXJyb3IoXCJmdWVsIGV4aGF1c3RlZFwiKTsgfTske0NIS19GTn1gO1xuICBjb25zdCBib2R5ID0gKHByb2dyYW0uYm9keSBhcyBBc3ROb2RlW10pLm1hcCgocykgPT4gcmVuZGVyU3RtdChzLCB0cnVlKSkuam9pbihcIlwiKTtcbiAgcmV0dXJuIGAke3ByZWx1ZGV9Y29uc3QgX19ydW4gPSAoKSA9PiB7JHtib2R5fX07IHRyeSB7IGNvbnN0IG9rID0gX19ydW4oKTsgcmV0dXJuIHsgb2ssIGZ1ZWw6ICR7ZnVlbFJlZk5hbWV9LnZhbHVlIH07IH0gY2F0Y2ggKGVycikgeyByZXR1cm4geyBlcnI6IFN0cmluZyhlcnIpLCBmdWVsOiAke2Z1ZWxSZWZOYW1lfS52YWx1ZSB9OyB9YDtcbn07XG5cbmNvbnN0IHJlbmRlclJ1bm5lcldpdGhGdWVsU2hhcmVkQXN5bmMgPSAocHJvZ3JhbTogQXN0Tm9kZSwgZnVlbFJlZk5hbWUgPSBcIl9fZnVlbFwiKSA9PiB7XG4gIGFzc2VydFNhZmVJZGVudChmdWVsUmVmTmFtZSk7XG4gIGNvbnN0IHJlc2VydmVkRXJycyA9IHZhbGlkYXRlTm9SZXNlcnZlZFJ1bnRpbWVOYW1lcyhwcm9ncmFtLCBbZnVlbFJlZk5hbWUsIFwiX19idXJuXCIsIFwiX19jaGtcIl0pO1xuICBpZiAocmVzZXJ2ZWRFcnJzLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKHJlc2VydmVkRXJycy5qb2luKFwiLCBcIikpO1xuICBjb25zdCBwcmVsdWRlID0gYGNvbnN0IF9fYnVybiA9ICgpID0+IHsgaWYgKC0tJHtmdWVsUmVmTmFtZX0udmFsdWUgPCAwKSB0aHJvdyBuZXcgRXJyb3IoXCJmdWVsIGV4aGF1c3RlZFwiKTsgfTske0NIS19GTn1gO1xuICBjb25zdCBib2R5ID0gKHByb2dyYW0uYm9keSBhcyBBc3ROb2RlW10pLm1hcCgocykgPT4gcmVuZGVyU3RtdChzLCB0cnVlKSkuam9pbihcIlwiKTtcbiAgcmV0dXJuIGAke3ByZWx1ZGV9Y29uc3QgX19ydW4gPSBhc3luYyAoKSA9PiB7JHtib2R5fX07IHJldHVybiBfX3J1bigpLnRoZW4ob2sgPT4gKHsgb2ssIGZ1ZWw6ICR7ZnVlbFJlZk5hbWV9LnZhbHVlIH0pKS5jYXRjaChlcnIgPT4gKHsgZXJyOiBTdHJpbmcoZXJyKSwgZnVlbDogJHtmdWVsUmVmTmFtZX0udmFsdWUgfSkpO2A7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFJ1bnRpbWUgaGVscGVyc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydCB0eXBlIHJ1blJlcyA9IHsgb2s6IHVua25vd247IGZ1ZWw6IG51bWJlciB9IHwgeyBlcnI6IHN0cmluZzsgZnVlbDogbnVtYmVyIH07XG5cbmNvbnN0IFNBRkVfT0JKRUNUID0gT2JqZWN0LmZyZWV6ZShPYmplY3QuYXNzaWduKE9iamVjdC5jcmVhdGUobnVsbCksIHtcbiAga2V5czogKG9iajogdW5rbm93bikgPT4gT2JqZWN0LmtleXMob2JqIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KSxcbiAgdmFsdWVzOiAob2JqOiB1bmtub3duKSA9PiBPYmplY3QudmFsdWVzKG9iaiBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiksXG4gIGVudHJpZXM6IChvYmo6IHVua25vd24pID0+IE9iamVjdC5lbnRyaWVzKG9iaiBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiksXG4gIGZyb21FbnRyaWVzOiAoZW50cmllczogdW5rbm93bikgPT4gT2JqZWN0LmZyb21FbnRyaWVzKGVudHJpZXMgYXMgSXRlcmFibGU8W3N0cmluZywgdW5rbm93bl0+KSxcbiAgYXNzaWduOiAodGFyZ2V0OiB1bmtub3duLCAuLi5zb3VyY2VzOiB1bmtub3duW10pID0+IE9iamVjdC5hc3NpZ24odGFyZ2V0IGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+LCAuLi5zb3VyY2VzKSxcbiAgZnJlZXplOiAob2JqOiB1bmtub3duKSA9PiBPYmplY3QuZnJlZXplKG9iaiBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiksXG59KSk7XG5cbmNvbnN0IFNBRkVfQVJSQVkgPSBPYmplY3QuZnJlZXplKE9iamVjdC5hc3NpZ24oT2JqZWN0LmNyZWF0ZShudWxsKSwge1xuICBpc0FycmF5OiAodjogdW5rbm93bikgPT4gQXJyYXkuaXNBcnJheSh2KSxcbiAgZnJvbTogKHY6IHVua25vd24sIG1hcEZuPzogdW5rbm93bikgPT4gbWFwRm4gPyBBcnJheS5mcm9tKHYgYXMgSXRlcmFibGU8dW5rbm93bj4sIG1hcEZuIGFzICh2OiB1bmtub3duLCBpOiBudW1iZXIpID0+IHVua25vd24pIDogQXJyYXkuZnJvbSh2IGFzIEl0ZXJhYmxlPHVua25vd24+KSxcbiAgb2Y6ICguLi5pdGVtczogdW5rbm93bltdKSA9PiBBcnJheS5vZiguLi5pdGVtcyksXG59KSk7XG5cbmNvbnN0IFNBRkVfTUFUSCA9IE9iamVjdC5mcmVlemUoT2JqZWN0LmFzc2lnbihPYmplY3QuY3JlYXRlKG51bGwpLCB7XG4gIGFiczogTWF0aC5hYnMsIGNlaWw6IE1hdGguY2VpbCwgZmxvb3I6IE1hdGguZmxvb3IsIHJvdW5kOiBNYXRoLnJvdW5kLFxuICBtaW46IE1hdGgubWluLCBtYXg6IE1hdGgubWF4LCBwb3c6IE1hdGgucG93LCBzcXJ0OiBNYXRoLnNxcnQsXG4gIHNpZ246IE1hdGguc2lnbiwgdHJ1bmM6IE1hdGgudHJ1bmMsIGxvZzogTWF0aC5sb2csIGxvZzI6IE1hdGgubG9nMixcbiAgcmFuZG9tOiBNYXRoLnJhbmRvbSwgUEk6IE1hdGguUEksIEU6IE1hdGguRSxcbn0pKTtcblxudHlwZSBGdWVsUmVmID0geyB2YWx1ZTogbnVtYmVyIH07XG50eXBlIEZ1bmN0aW9uUGFyYW0gPSB7IG5hbWU6IHN0cmluZywgcmVzdDogYm9vbGVhbiB9O1xuXG5jb25zdCBwYXJzZUZ1bmN0aW9uQ3RvciA9IChjdG9yQXJnczogdW5rbm93bltdKTogeyBwYXJhbXM6IEZ1bmN0aW9uUGFyYW1bXSwgYm9keTogc3RyaW5nIH0gPT4ge1xuICBpZiAoY3RvckFyZ3Muc29tZSgodikgPT4gdHlwZW9mIHYgIT09IFwic3RyaW5nXCIpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiRnVuY3Rpb24gYXJndW1lbnRzIG11c3QgYmUgc3RyaW5nc1wiKTtcbiAgfVxuICBjb25zdCBwYXJ0cyA9IGN0b3JBcmdzIGFzIHN0cmluZ1tdO1xuICBjb25zdCBib2R5ID0gcGFydHMubGVuZ3RoID8gcGFydHNbcGFydHMubGVuZ3RoIC0gMV0gOiBcIlwiO1xuICBjb25zdCByYXdQYXJhbXMgPSBwYXJ0cy5zbGljZSgwLCAtMSk7XG4gIGNvbnN0IHBhcmFtczogRnVuY3Rpb25QYXJhbVtdID0gW107XG4gIGZvciAoY29uc3QgcmF3IG9mIHJhd1BhcmFtcykge1xuICAgIGZvciAoY29uc3Qgc2VnIG9mIHJhdy5zcGxpdChcIixcIikpIHtcbiAgICAgIGNvbnN0IG5hbWUgPSBzZWcudHJpbSgpO1xuICAgICAgaWYgKCFuYW1lKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHJlc3QgPSBuYW1lLnN0YXJ0c1dpdGgoXCIuLi5cIik7XG4gICAgICBjb25zdCBiYXNlID0gcmVzdCA/IG5hbWUuc2xpY2UoMykgOiBuYW1lO1xuICAgICAgaWYgKCEvXltBLVphLXpfJF1bQS1aYS16MC05XyRdKiQvLnRlc3QoYmFzZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGZ1bmN0aW9uIHBhcmFtZXRlcjogJHtuYW1lfWApO1xuICAgICAgfVxuICAgICAgcGFyYW1zLnB1c2goeyBuYW1lOiBiYXNlLCByZXN0IH0pO1xuICAgIH1cbiAgfVxuICBjb25zdCByZXN0Q291bnQgPSBwYXJhbXMuZmlsdGVyKChwKSA9PiBwLnJlc3QpLmxlbmd0aDtcbiAgaWYgKHJlc3RDb3VudCA+IDEgfHwgKHJlc3RDb3VudCA9PT0gMSAmJiAhcGFyYW1zW3BhcmFtcy5sZW5ndGggLSAxXS5yZXN0KSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlJlc3QgcGFyYW1ldGVyIG11c3QgYmUgdGhlIGxhc3QgcGFyYW1ldGVyXCIpO1xuICB9XG4gIHJldHVybiB7IHBhcmFtcywgYm9keSB9O1xufTtcblxuY29uc3QgbWFwRnVuY3Rpb25BcmdzID0gKHBhcmFtczogRnVuY3Rpb25QYXJhbVtdLCBjYWxsQXJnczogdW5rbm93bltdKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPT4ge1xuICBjb25zdCBlbnY6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge307XG4gIGxldCBpZHggPSAwO1xuICBmb3IgKGNvbnN0IHAgb2YgcGFyYW1zKSB7XG4gICAgaWYgKHAucmVzdCkge1xuICAgICAgZW52W3AubmFtZV0gPSBjYWxsQXJncy5zbGljZShpZHgpO1xuICAgICAgaWR4ID0gY2FsbEFyZ3MubGVuZ3RoO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbnZbcC5uYW1lXSA9IGNhbGxBcmdzW2lkeCsrXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGVudjtcbn07XG5cbmNvbnN0IG1ha2VTYWZlRnVuY3Rpb25TeW5jID0gKGZ1ZWxSZWY6IEZ1ZWxSZWYsIG91dGVyR2xvYmFsczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pID0+ICguLi5jdG9yQXJnczogdW5rbm93bltdKSA9PiB7XG4gIGNvbnN0IHsgcGFyYW1zLCBib2R5IH0gPSBwYXJzZUZ1bmN0aW9uQ3RvcihjdG9yQXJncyk7XG4gIHJldHVybiAoLi4uY2FsbEFyZ3M6IHVua25vd25bXSkgPT4ge1xuICAgIGNvbnN0IGxvY2FsRW52ID0geyAuLi5vdXRlckdsb2JhbHMsIC4uLm1hcEZ1bmN0aW9uQXJncyhwYXJhbXMsIGNhbGxBcmdzKSB9O1xuICAgIGNvbnN0IHJlcyA9IHJ1bldpdGhGdWVsU2hhcmVkKGJvZHksIGZ1ZWxSZWYsIGxvY2FsRW52KTtcbiAgICBpZiAoXCJlcnJcIiBpbiByZXMpIHRocm93IG5ldyBFcnJvcihyZXMuZXJyKTtcbiAgICByZXR1cm4gcmVzLm9rO1xuICB9O1xufTtcblxuY29uc3QgbWFrZVNhZmVGdW5jdGlvbkFzeW5jID0gKGZ1ZWxSZWY6IEZ1ZWxSZWYsIG91dGVyR2xvYmFsczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pID0+ICguLi5jdG9yQXJnczogdW5rbm93bltdKSA9PiB7XG4gIGNvbnN0IHsgcGFyYW1zLCBib2R5IH0gPSBwYXJzZUZ1bmN0aW9uQ3RvcihjdG9yQXJncyk7XG4gIHJldHVybiBhc3luYyAoLi4uY2FsbEFyZ3M6IHVua25vd25bXSkgPT4ge1xuICAgIGNvbnN0IGxvY2FsRW52ID0geyAuLi5vdXRlckdsb2JhbHMsIC4uLm1hcEZ1bmN0aW9uQXJncyhwYXJhbXMsIGNhbGxBcmdzKSB9O1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHJ1bldpdGhGdWVsU2hhcmVkQXN5bmMoYm9keSwgZnVlbFJlZiwgbG9jYWxFbnYpO1xuICAgIGlmIChcImVyclwiIGluIHJlcykgdGhyb3cgbmV3IEVycm9yKHJlcy5lcnIpO1xuICAgIHJldHVybiByZXMub2s7XG4gIH07XG59O1xuXG5jb25zdCB3aXRoQnVpbHRpbnMgPSAoXG4gIGVudjogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gIGZ1ZWxSZWY6IEZ1ZWxSZWYsXG4gIG1vZGU6IFwic3luY1wiIHwgXCJhc3luY1wiLFxuKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPT4ge1xuICBjb25zdCBiYXNlR2xvYmFsczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7XG4gICAgLi4uZW52LFxuICAgIE9iamVjdDogU0FGRV9PQkpFQ1QsXG4gICAgQXJyYXk6IFNBRkVfQVJSQVksXG4gICAgTWF0aDogU0FGRV9NQVRILFxuICAgIE1hcCxcbiAgICBTZXQsXG4gICAgUHJvbWlzZSxcbiAgfTtcbiAgcmV0dXJuIHtcbiAgICAuLi5iYXNlR2xvYmFscyxcbiAgICBGdW5jdGlvbjogbW9kZSA9PT0gXCJhc3luY1wiXG4gICAgICA/IG1ha2VTYWZlRnVuY3Rpb25Bc3luYyhmdWVsUmVmLCBiYXNlR2xvYmFscylcbiAgICAgIDogbWFrZVNhZmVGdW5jdGlvblN5bmMoZnVlbFJlZiwgYmFzZUdsb2JhbHMpLFxuICB9O1xufTtcblxuY29uc3Qgc3RyaW5naWZ5RXJyb3IgPSAoZXJyOiB1bmtub3duKTogc3RyaW5nID0+IHtcbiAgaWYgKGVyciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgY29uc3Qgc3RhY2sgPSBlcnIuc3RhY2sgfHwgJyc7XG4gICAgY29uc3QgcHJlZml4ID0gYCR7ZXJyLm5hbWV9OiAke2Vyci5tZXNzYWdlfWA7XG4gICAgY29uc3QgY2xlYW5TdGFjayA9IHN0YWNrXG4gICAgICAucmVwbGFjZSgvXlteXFxuXSpcXG4/LywgJycpXG4gICAgICAucmVwbGFjZSgvc3BhY2V0aW1lZGJfbW9kdWxlOihcXGQrKTooXFxkKykvZywgJzxidW5kbGVkOiQxOiQyPicpO1xuICAgIHJldHVybiBjbGVhblN0YWNrID8gYCR7cHJlZml4fVxcbiR7Y2xlYW5TdGFja31gIDogcHJlZml4O1xuICB9XG4gIGlmICh0eXBlb2YgZXJyID09PSAnb2JqZWN0JyAmJiBlcnIgIT09IG51bGwpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGVycik7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gU3RyaW5nKGVycik7XG4gICAgfVxuICB9XG4gIHJldHVybiBTdHJpbmcoZXJyKTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gUHVibGljIHJ1bnRpbWUgQVBJXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZXhwb3J0IGNvbnN0IHJ1bldpdGhGdWVsID0gKFxuICBzcmM6IHN0cmluZyxcbiAgZnVlbCA9IDEwMDAwLFxuICBlbnY6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge30sXG4pOiBydW5SZXMgPT4ge1xuICBjb25zdCBmdWVsUmVmID0geyB2YWx1ZTogZnVlbCB9O1xuICByZXR1cm4gcnVuV2l0aEZ1ZWxTaGFyZWQoc3JjLCBmdWVsUmVmLCBlbnYpO1xufTtcblxuZXhwb3J0IGNvbnN0IHJ1bldpdGhGdWVsU2hhcmVkID0gKFxuICBzcmM6IHN0cmluZyxcbiAgZnVlbFJlZjogRnVlbFJlZixcbiAgZW52OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9LFxuICBmdWVsUmVmTmFtZSA9IFwiX19mdWVsXCJcbik6IHJ1blJlcyA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgcnVudGltZUVudiA9IHdpdGhCdWlsdGlucyhlbnYsIGZ1ZWxSZWYsIFwic3luY1wiKTtcbiAgICBjb25zdCBwcm9ncmFtID0gcGFyc2Uoc3JjKTtcbiAgICBjb25zdCBwcm90b0VycnMgPSB2YWxpZGF0ZU5vUHJvdG90eXBlKHByb2dyYW0pO1xuICAgIGlmIChwcm90b0VycnMubGVuZ3RoKSByZXR1cm4geyBlcnI6IFwicHJvdG90eXBlIGFjY2Vzc1wiLCBmdWVsOiBmdWVsUmVmLnZhbHVlIH07XG4gICAgY29uc3Qgc2NvcGVFcnJzID0gdmFsaWRhdGVTY29wZXMocHJvZ3JhbSwgWy4uLk9iamVjdC5rZXlzKHJ1bnRpbWVFbnYpLCBmdWVsUmVmTmFtZV0pO1xuICAgIGlmIChzY29wZUVycnMubGVuZ3RoKSByZXR1cm4geyBlcnI6IHNjb3BlRXJycy5qb2luKFwiLCBcIiksIGZ1ZWw6IGZ1ZWxSZWYudmFsdWUgfTtcbiAgICBjb25zdCBjb2RlID0gcmVuZGVyUnVubmVyV2l0aEZ1ZWxTaGFyZWQocHJvZ3JhbSwgZnVlbFJlZk5hbWUpO1xuICAgIGNvbnN0IGZ1bGxFbnYgPSB7IC4uLnJ1bnRpbWVFbnYsIFtmdWVsUmVmTmFtZV06IGZ1ZWxSZWYgfTtcbiAgICByZXR1cm4gKG5ldyBGdW5jdGlvbiguLi5PYmplY3Qua2V5cyhmdWxsRW52KSwgY29kZSkgYXMgKC4uLmFyZ3M6dW5rbm93bltdKSA9PiBydW5SZXMpKC4uLk9iamVjdC52YWx1ZXMoZnVsbEVudikpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4geyBlcnI6IHN0cmluZ2lmeUVycm9yKGVyciksIGZ1ZWw6IGZ1ZWxSZWYudmFsdWUgfTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IHJ1bldpdGhGdWVsU2hhcmVkQXN5bmMgPSBhc3luYyAoXG4gIHNyYzogc3RyaW5nLFxuICBmdWVsUmVmOiBGdWVsUmVmLFxuICBlbnY6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge30sXG4gIGZ1ZWxSZWZOYW1lID0gXCJfX2Z1ZWxcIlxuKTogUHJvbWlzZTxydW5SZXM+ID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBydW50aW1lRW52ID0gd2l0aEJ1aWx0aW5zKGVudiwgZnVlbFJlZiwgXCJhc3luY1wiKTtcbiAgICBjb25zdCBwcm9ncmFtID0gcGFyc2Uoc3JjKTtcbiAgICBjb25zdCBwcm90b0VycnMgPSB2YWxpZGF0ZU5vUHJvdG90eXBlKHByb2dyYW0pO1xuICAgIGlmIChwcm90b0VycnMubGVuZ3RoKSByZXR1cm4geyBlcnI6IFwicHJvdG90eXBlIGFjY2Vzc1wiLCBmdWVsOiBmdWVsUmVmLnZhbHVlIH07XG4gICAgY29uc3Qgc2NvcGVFcnJzID0gdmFsaWRhdGVTY29wZXMocHJvZ3JhbSwgWy4uLk9iamVjdC5rZXlzKHJ1bnRpbWVFbnYpLCBmdWVsUmVmTmFtZV0pO1xuICAgIGlmIChzY29wZUVycnMubGVuZ3RoKSByZXR1cm4geyBlcnI6IHNjb3BlRXJycy5qb2luKFwiLCBcIiksIGZ1ZWw6IGZ1ZWxSZWYudmFsdWUgfTtcbiAgICBjb25zdCBjb2RlID0gcmVuZGVyUnVubmVyV2l0aEZ1ZWxTaGFyZWRBc3luYyhwcm9ncmFtLCBmdWVsUmVmTmFtZSk7XG4gICAgY29uc3QgZnVsbEVudiA9IHsgLi4ucnVudGltZUVudiwgW2Z1ZWxSZWZOYW1lXTogZnVlbFJlZiB9O1xuICAgIGNvbnN0IGZuID0gbmV3IEZ1bmN0aW9uKC4uLk9iamVjdC5rZXlzKGZ1bGxFbnYpLCBjb2RlKSBhcyAoLi4uYXJnczogdW5rbm93bltdKSA9PiBQcm9taXNlPHJ1blJlcz47XG4gICAgcmV0dXJuIGF3YWl0IGZuKC4uLk9iamVjdC52YWx1ZXMoZnVsbEVudikpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4geyBlcnI6IHN0cmluZ2lmeUVycm9yKGVyciksIGZ1ZWw6IGZ1ZWxSZWYudmFsdWUgfTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IHJ1bldpdGhGdWVsQXN5bmMgPSBhc3luYyAoXG4gIHNyYzogc3RyaW5nLFxuICBmdWVsID0gMTAwMDAsXG4gIGVudjogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fVxuKTogUHJvbWlzZTxydW5SZXM+ID0+IHtcbiAgY29uc3QgZnVlbFJlZiA9IHsgdmFsdWU6IGZ1ZWwgfTtcbiAgcmV0dXJuIHJ1bldpdGhGdWVsU2hhcmVkQXN5bmMoc3JjLCBmdWVsUmVmLCBlbnYpO1xufTtcbiIsICJpbXBvcnQgdHlwZSB7IEpzb25hYmxlIH0gZnJvbSBcIkBoYXNobm90ZXMvY29yZS9ub3Rlc1wiO1xuXG5leHBvcnQgdHlwZSBPcGVuUm91dGVyUmVxdWVzdCA9IHtcbiAgYXBpS2V5OiBzdHJpbmc7XG4gIG1vZGVsOiBzdHJpbmc7XG4gIHByb21wdDogc3RyaW5nO1xuICBzY2hlbWE6IEpzb25hYmxlO1xufTtcblxudHlwZSBPcGVuUm91dGVyTWVzc2FnZSA9IHtcbiAgcm9sZTogXCJ1c2VyXCI7XG4gIGNvbnRlbnQ6IHN0cmluZztcbn07XG5cbnR5cGUgT3BlblJvdXRlclJlc3BvbnNlID0ge1xuICBjaG9pY2VzPzogQXJyYXk8e1xuICAgIG1lc3NhZ2U/OiB7XG4gICAgICBjb250ZW50Pzogc3RyaW5nO1xuICAgIH07XG4gIH0+O1xufTtcblxuY29uc3QgT1BFTlJPVVRFUl9VUkwgPSBcImh0dHBzOi8vb3BlbnJvdXRlci5haS9hcGkvdjEvY2hhdC9jb21wbGV0aW9uc1wiO1xuY29uc3QgY2xpcCA9IChzOiBzdHJpbmcsIG1heCA9IDIwMDApOiBzdHJpbmcgPT4gKHMubGVuZ3RoIDw9IG1heCA/IHMgOiBzLnNsaWNlKDAsIG1heCkgKyBcIi4uLjx0cnVuY2F0ZWQ+XCIpO1xuXG5jb25zdCBhc0Vycm9yTWVzc2FnZSA9IGFzeW5jIChyZXM6IFJlc3BvbnNlKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgY29uc3QgdGV4dCA9IGF3YWl0IHJlcy50ZXh0KCk7XG4gIGlmICghdGV4dCkgcmV0dXJuIGAke3Jlcy5zdGF0dXN9ICR7cmVzLnN0YXR1c1RleHR9YDtcbiAgdHJ5IHtcbiAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKHRleHQpIGFzIHsgZXJyb3I/OiB7IG1lc3NhZ2U/OiBzdHJpbmc7IGNvZGU/OiBzdHJpbmcgfSB9O1xuICAgIGNvbnN0IG1zZyA9IHBhcnNlZD8uZXJyb3I/Lm1lc3NhZ2U7XG4gICAgY29uc3QgY29kZSA9IHBhcnNlZD8uZXJyb3I/LmNvZGU7XG4gICAgY29uc3QgZGV0YWlsID0gcGFyc2VkPy5lcnJvciA/IGNsaXAoSlNPTi5zdHJpbmdpZnkocGFyc2VkLmVycm9yKSkgOiBjbGlwKHRleHQpO1xuICAgIGlmIChtc2cpIHJldHVybiBgJHtyZXMuc3RhdHVzfSAke2NvZGUgPyBjb2RlICsgXCI6IFwiIDogXCJcIn0ke21zZ31cXG5lcnJvcjogJHtkZXRhaWx9YDtcbiAgICByZXR1cm4gYCR7cmVzLnN0YXR1c30gJHtkZXRhaWx9YDtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIGAke3Jlcy5zdGF0dXN9ICR7dGV4dH1gO1xuICB9XG59O1xuXG5leHBvcnQgY29uc3Qgb3BlblJvdXRlclJlcXVlc3QgPSBhc3luYyAoXG4gIHJlcTogT3BlblJvdXRlclJlcXVlc3QsXG4pOiBQcm9taXNlPEpzb25hYmxlPiA9PiB7XG4gIGlmICghcmVxLmFwaUtleSkgdGhyb3cgbmV3IEVycm9yKFwib3BlblJvdXRlclJlcXVlc3Q6IGFwaUtleSBpcyByZXF1aXJlZFwiKTtcbiAgaWYgKCFyZXEubW9kZWwpIHJlcS5tb2RlbCA9IFwib3BlbmFpL2dwdC1vc3MtMjBiXCJcbiAgaWYgKCFyZXEucHJvbXB0KSB0aHJvdyBuZXcgRXJyb3IoXCJvcGVuUm91dGVyUmVxdWVzdDogcHJvbXB0IGlzIHJlcXVpcmVkXCIpO1xuICBpZiAoIXJlcS5zY2hlbWEpIHJlcS5zY2hlbWEgPSB7dHlwZTpcInN0cmluZ1wifVxuICBpZiAodHlwZW9mIHJlcS5zY2hlbWEgIT09IFwib2JqZWN0XCIgfHwgQXJyYXkuaXNBcnJheShyZXEuc2NoZW1hKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIm9wZW5Sb3V0ZXJSZXF1ZXN0OiBzY2hlbWEgbXVzdCBiZSBhbiBvYmplY3RcIik7XG4gIH1cblxuICBjb25zdCBtZXNzYWdlczogT3BlblJvdXRlck1lc3NhZ2VbXSA9IFt7IHJvbGU6IFwidXNlclwiLCBjb250ZW50OiByZXEucHJvbXB0IH1dO1xuICBjb25zdCBta0JvZHkgPSAoKSA9PiAoe1xuICAgIG1vZGVsOiByZXEubW9kZWwsXG4gICAgbWVzc2FnZXMsXG4gICAgcmVzcG9uc2VfZm9ybWF0OiB7XG4gICAgICB0eXBlOiBcImpzb25fc2NoZW1hXCIsXG4gICAgICBqc29uX3NjaGVtYToge1xuICAgICAgICBuYW1lOiBcInN0cnVjdHVyZWRfb3V0cHV0XCIsXG4gICAgICAgIHN0cmljdDogdHJ1ZSxcbiAgICAgICAgc2NoZW1hOiByZXEuc2NoZW1hLFxuICAgICAgfSxcbiAgICB9LFxuICB9KTtcblxuICBjb25zdCBkb0ZldGNoID0gKCkgPT4gZmV0Y2goT1BFTlJPVVRFUl9VUkwsIHtcbiAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgXCJBdXRob3JpemF0aW9uXCI6IGBCZWFyZXIgJHtyZXEuYXBpS2V5fWAsXG4gICAgfSxcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShta0JvZHkoKSksXG4gIH0pO1xuXG4gIGNvbnN0IHJlcyA9IGF3YWl0IGRvRmV0Y2goKTtcbiAgaWYgKCFyZXMub2spIHRocm93IG5ldyBFcnJvcihgT3BlblJvdXRlciByZXF1ZXN0IGZhaWxlZDogJHthd2FpdCBhc0Vycm9yTWVzc2FnZShyZXMpfWApO1xuXG4gIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpIGFzIE9wZW5Sb3V0ZXJSZXNwb25zZTtcbiAgY29uc3QgY29udGVudCA9IGRhdGEuY2hvaWNlcz8uWzBdPy5tZXNzYWdlPy5jb250ZW50O1xuICBpZiAodHlwZW9mIGNvbnRlbnQgIT09IFwic3RyaW5nXCIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBcIk9wZW5Sb3V0ZXIgcmVzcG9uc2UgbWlzc2luZyBjaG9pY2VzWzBdLm1lc3NhZ2UuY29udGVudFwiXG4gICAgICArIFwiXFxubW9kZWw6IFwiICsgcmVxLm1vZGVsXG4gICAgICArIFwiXFxuc2NoZW1hOiBcIiArIGNsaXAoSlNPTi5zdHJpbmdpZnkocmVxLnNjaGVtYSkpXG4gICAgICArIFwiXFxucmVzcG9uc2U6IFwiICsgY2xpcChKU09OLnN0cmluZ2lmeShkYXRhKSlcbiAgICApO1xuICB9XG4gIGlmIChjb250ZW50LnRyaW0oKS5sZW5ndGggPT09IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBcIk9wZW5Sb3V0ZXIgcmVzcG9uc2UgY29udGVudCB3YXMgZW1wdHlcIlxuICAgICAgKyBcIlxcbm1vZGVsOiBcIiArIHJlcS5tb2RlbFxuICAgICAgKyBcIlxcbnNjaGVtYTogXCIgKyBjbGlwKEpTT04uc3RyaW5naWZ5KHJlcS5zY2hlbWEpKVxuICAgICAgKyBcIlxcbnJlc3BvbnNlOiBcIiArIGNsaXAoSlNPTi5zdHJpbmdpZnkoZGF0YSkpXG4gICAgKTtcbiAgfVxuICB0cnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKGNvbnRlbnQpIGFzIEpzb25hYmxlO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zdCBwYXJzZU1zZyA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBcIk9wZW5Sb3V0ZXIgcmVzcG9uc2UgY29udGVudCB3YXMgbm90IHZhbGlkIEpTT05cIlxuICAgICAgKyBcIlxcbm1vZGVsOiBcIiArIHJlcS5tb2RlbFxuICAgICAgKyBcIlxcbnBhcnNlIGVycm9yOiBcIiArIHBhcnNlTXNnXG4gICAgICArIFwiXFxuc2NoZW1hOiBcIiArIGNsaXAoSlNPTi5zdHJpbmdpZnkocmVxLnNjaGVtYSkpXG4gICAgICArIFwiXFxuY29udGVudDogXCIgKyBjbGlwKGNvbnRlbnQpXG4gICAgICArIFwiXFxucmVzcG9uc2U6IFwiICsgY2xpcChKU09OLnN0cmluZ2lmeShkYXRhKSlcbiAgICApO1xuICB9XG59O1xuIiwgImltcG9ydCB7IHJ1bldpdGhGdWVsU2hhcmVkLCBydW5XaXRoRnVlbFNoYXJlZEFzeW5jIH0gZnJvbSBcIkBoYXNobm90ZXMvY29yZS9jb2RlZ2VuXCI7XG5pbXBvcnQgeyBmcm9tanNvbiwgaGFzaERhdGEsIHR5cGUgSnNvbmFibGUsIHR5cGUgUmVmIH0gZnJvbSBcIkBoYXNobm90ZXMvY29yZS9ub3Rlc1wiO1xuaW1wb3J0IHsgYWRkTm90ZSwgYXNSZWYsIGNhbGxOb3RlLCBkZVJlZiwgZ2V0Tm90ZSB9IGZyb20gXCIuL2RiLnRzXCI7XG5pbXBvcnQgeyBvcGVuUm91dGVyUmVxdWVzdCB9IGZyb20gXCIuL29wZW5yb3V0ZXIudHNcIjtcbmltcG9ydCB7IEhUTUwsIHR5cGUgVmlldywgdHlwZSBWaWV3Q29udGV4dCwgdHlwZSBWRG9tIH0gZnJvbSBcIi4vdmlld3MudHNcIjtcblxudHlwZSBDbGllbnRGdWVsT3B0aW9ucyA9IHtcbiAgZnVlbD86IG51bWJlcjtcbiAgZW52PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG59O1xuXG5jb25zdCBsb2NhbFN0b3JlS2V5ID0gKGZuUmVmOiBzdHJpbmcsIGtleTogUmVmIHwgSnNvbmFibGUpOiBzdHJpbmcgPT5cbiAgYCR7Zm5SZWZ9fCR7aGFzaERhdGEoa2V5IGFzIEpzb25hYmxlKX1gO1xuXG4vKiogQ3JlYXRlIGEgc3RvcmUgc2NvcGVkIHRvIGEgc3BlY2lmaWMgbm90ZSByZWYuICovXG5jb25zdCBtYWtlU3RvcmUgPSAoXG4gIG5vdGVSZWY6IHN0cmluZyxcbiAgbWVtU3RvcmU6IE1hcDxzdHJpbmcsIEpzb25hYmxlPixcbiAgbHM6IFN0b3JhZ2UgfCB1bmRlZmluZWQsXG4pID0+ICh7XG4gIGdldDogKGtleTogUmVmIHwgSnNvbmFibGUpOiBKc29uYWJsZSB8IHVuZGVmaW5lZCA9PiB7XG4gICAgY29uc3Qgc2tleSA9IGBoYXNobm90ZXM6c3RvcmU6JHtsb2NhbFN0b3JlS2V5KG5vdGVSZWYsIGtleSl9YDtcbiAgICBjb25zdCByYXcgPSBscz8uZ2V0SXRlbShza2V5KTtcbiAgICBpZiAocmF3ICE9IG51bGwpIHJldHVybiBmcm9tanNvbihyYXcpIGFzIEpzb25hYmxlO1xuICAgIHJldHVybiBtZW1TdG9yZS5nZXQoc2tleSk7XG4gIH0sXG4gIHNldDogKGtleTogUmVmIHwgSnNvbmFibGUsIHZhbHVlOiBSZWYgfCBKc29uYWJsZSk6IEpzb25hYmxlID0+IHtcbiAgICBjb25zdCBza2V5ID0gYGhhc2hub3RlczpzdG9yZToke2xvY2FsU3RvcmVLZXkobm90ZVJlZiwga2V5KX1gO1xuICAgIGNvbnN0IHYgPSB2YWx1ZSBhcyBKc29uYWJsZTtcbiAgICBpZiAobHMpIGxzLnNldEl0ZW0oc2tleSwgSlNPTi5zdHJpbmdpZnkodikpO1xuICAgIGVsc2UgbWVtU3RvcmUuc2V0KHNrZXksIHYpO1xuICAgIHJldHVybiB2O1xuICB9LFxufSk7XG5cbnR5cGUgTG9jYWxFeGVjdXRvciA9IChmbjogUmVmIHwgSnNvbmFibGUsIGFyZ3M6IFJlZiB8IEpzb25hYmxlKSA9PiBQcm9taXNlPHVua25vd24+O1xuXG4vKipcbiAqIFBhcnNlIF9fZGVwcyBmcm9tIGEgY29tcGlsZWQgbm90ZSBib2R5LlxuICogTG9va3MgZm9yIGBjb25zdCBfX2RlcHMgPSBbXCIjaGFzaDFcIiwgXCIjaGFzaDJcIl07YCBhcyB0aGUgZmlyc3QgbGluZS5cbiAqL1xuY29uc3QgcGFyc2VEZXBzID0gKHNyYzogc3RyaW5nKTogc3RyaW5nW10gPT4ge1xuICBjb25zdCBtID0gc3JjLm1hdGNoKC9eY29uc3QgX19kZXBzID0gXFxbKFteXFxdXSopXFxdOy8pO1xuICBpZiAoIW0pIHJldHVybiBbXTtcbiAgcmV0dXJuIFsuLi5tWzFdLm1hdGNoQWxsKC9cIihbXlwiXSspXCIvZyldLm1hcCh4ID0+IHhbMV0pO1xufTtcblxuY29uc3QgY3JlYXRlTG9jYWxFeGVjdXRvciA9IChvcHRpb25zOiBDbGllbnRGdWVsT3B0aW9ucyk6IExvY2FsRXhlY3V0b3IgPT4ge1xuICBjb25zdCBmdWVsUmVmID0geyB2YWx1ZTogb3B0aW9ucy5mdWVsID8/IDEwMDAwMCB9O1xuICBjb25zdCBtZW1TdG9yZSA9IG5ldyBNYXA8c3RyaW5nLCBKc29uYWJsZT4oKTtcbiAgY29uc3QgbHMgPSAoKCkgPT4ge1xuICAgIHRyeSB7IHJldHVybiB0eXBlb2YgbG9jYWxTdG9yYWdlICE9PSBcInVuZGVmaW5lZFwiID8gbG9jYWxTdG9yYWdlIDogdW5kZWZpbmVkOyB9IGNhdGNoIHsgcmV0dXJuIHVuZGVmaW5lZDsgfVxuICB9KSgpO1xuICBjb25zdCBwcm9tcHRVc2VyID0gKG1lc3NhZ2U6IHN0cmluZywgZGVmYXVsdFZhbHVlID0gXCJcIik6IHN0cmluZyB8IG51bGwgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwID0gKGdsb2JhbFRoaXMgYXMgeyBwcm9tcHQ/OiAobTogc3RyaW5nLCBkPzogc3RyaW5nKSA9PiBzdHJpbmcgfCBudWxsIH0pLnByb21wdDtcbiAgICAgIGlmICh0eXBlb2YgcCA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gcChtZXNzYWdlLCBkZWZhdWx0VmFsdWUpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gbm8tb3BcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH07XG5cbiAgLy8gQ2FjaGU6IGhhc2ggXHUyMTkyIG5vdGUgZGF0YSAoc3RyaW5nIGZvciBjb2RlLCBhbnkgSnNvbmFibGUgZm9yIGRhdGEpXG4gIGNvbnN0IG5vdGVDYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBKc29uYWJsZT4oKTtcblxuICAvLyBNYXAgZnJvbSB3cmFwcGVyIGZ1bmN0aW9uIFx1MjE5MiBoYXNoIChmb3IgcmVtb3RlKCkgdG8gcmVzb2x2ZSlcbiAgY29uc3QgZm5Ub0hhc2ggPSBuZXcgTWFwPEZ1bmN0aW9uLCBzdHJpbmc+KCk7XG5cbiAgLyoqIFJlY3Vyc2l2ZWx5IGZldGNoIGRlcCBzb3VyY2VzIGludG8gbm90ZUNhY2hlIChubyBleGVjdXRpb24pLiAqL1xuICBjb25zdCBwcmVmZXRjaCA9IGFzeW5jIChyZWY6IHN0cmluZyk6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgIGlmIChub3RlQ2FjaGUuaGFzKHJlZikpIHJldHVybjtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZGVSZWYocmVmIGFzIFJlZik7XG4gICAgbm90ZUNhY2hlLnNldChyZWYsIGRhdGEgYXMgSnNvbmFibGUpO1xuICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgZm9yIChjb25zdCBkZXAgb2YgcGFyc2VEZXBzKGRhdGEpKSBhd2FpdCBwcmVmZXRjaChkZXApO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBjYWxsTG9jYWw6IExvY2FsRXhlY3V0b3IgPSBhc3luYyAoZm5JbnB1dDogUmVmIHwgSnNvbmFibGUsIGFyZ3NJbnB1dDogUmVmIHwgSnNvbmFibGUpOiBQcm9taXNlPHVua25vd24+ID0+IHtcbiAgICBjb25zdCBmblJlZiA9IGF3YWl0IGFzUmVmKGZuSW5wdXQpO1xuICAgIGNvbnN0IGFyZ3NSZWYgPSBhd2FpdCBhc1JlZihhcmdzSW5wdXQpO1xuXG4gICAgY29uc3QgZm5Ob3RlID0gYXdhaXQgZGVSZWYoZm5SZWYpO1xuICAgIGlmICh0eXBlb2YgZm5Ob3RlICE9PSBcInN0cmluZ1wiKSB0aHJvdyBuZXcgRXJyb3IoXCJmdW5jdGlvbiBub3RlIG11c3QgcmVzb2x2ZSB0byBhIHN0cmluZ1wiKTtcbiAgICBjb25zdCBhcmdzTm90ZSA9IGF3YWl0IGRlUmVmKGFyZ3NSZWYpO1xuICAgIGNvbnN0IGFyZ3MgPSBBcnJheS5pc0FycmF5KGFyZ3NOb3RlKSA/IGFyZ3NOb3RlIDogW2FyZ3NOb3RlXTtcblxuICAgIGNvbnN0IHN0b3JlID0gbWFrZVN0b3JlKGZuUmVmLCBtZW1TdG9yZSwgbHMpO1xuICAgIGNvbnN0IHJlbW90ZSA9IChmbjogdW5rbm93bik6ICguLi5yZW1vdGVBcmdzOiAoUmVmIHwgSnNvbmFibGUpW10pID0+IFByb21pc2U8SnNvbmFibGU+ID0+IHtcbiAgICAgIGNvbnN0IGhhc2ggPSBmblRvSGFzaC5nZXQoZm4gYXMgRnVuY3Rpb24pID8/IGZuO1xuICAgICAgcmV0dXJuICguLi5yZW1vdGVBcmdzOiAoUmVmIHwgSnNvbmFibGUpW10pID0+IGNhbGxOb3RlKGhhc2ggYXMgUmVmIHwgSnNvbmFibGUsIHJlbW90ZUFyZ3MpO1xuICAgIH07XG5cbiAgICAvKiogUmV0dXJuIGEgY2FsbGFibGUgd3JhcHBlciB0aGF0IHJ1bnMgdGhlIGRlcCdzIGJvZHkgd2l0aCBhcmdzIGFycmF5LCBvd24gc3RvcmUuICovXG4gICAgY29uc3QgZ2V0RnVuY1N5bmMgPSAocmVmOiBzdHJpbmcpOiAoLi4uY2FsbEFyZ3M6IHVua25vd25bXSkgPT4gdW5rbm93biA9PiB7XG4gICAgICBjb25zdCBzcmMgPSBub3RlQ2FjaGUuZ2V0KHJlZik7XG4gICAgICBpZiAoc3JjID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBFcnJvcihgZ2V0RnVuY1N5bmM6IG5vdGUgJHtyZWZ9IG5vdCBpbiBjYWNoZWApO1xuICAgICAgaWYgKHR5cGVvZiBzcmMgIT09IFwic3RyaW5nXCIpIHRocm93IG5ldyBFcnJvcihgZ2V0RnVuY1N5bmM6IG5vdGUgJHtyZWZ9IGlzIG5vdCBjb2RlYCk7XG4gICAgICBjb25zdCBmbiA9ICguLi5jYWxsQXJnczogdW5rbm93bltdKSA9PiB7XG4gICAgICAgIGNvbnN0IGRlcFN0b3JlID0gbWFrZVN0b3JlKHJlZiwgbWVtU3RvcmUsIGxzKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gcnVuV2l0aEZ1ZWxTaGFyZWQoc3JjLCBmdWVsUmVmLCB7IC4uLmVudiwgYXJnczogY2FsbEFyZ3MsIHN0b3JlOiBkZXBTdG9yZSB9KTtcbiAgICAgICAgaWYgKFwiZXJyXCIgaW4gcmVzdWx0KSB0aHJvdyBuZXcgRXJyb3IocmVzdWx0LmVycik7XG4gICAgICAgIHJldHVybiByZXN1bHQub2s7XG4gICAgICB9O1xuICAgICAgZm5Ub0hhc2guc2V0KGZuLCByZWYpO1xuICAgICAgcmV0dXJuIGZuO1xuICAgIH07XG5cbiAgICAvKiogUmV0dXJuIEpTT04gZGF0YSBmcm9tIGEgcHJlZmV0Y2hlZCBub3RlLiAqL1xuICAgIGNvbnN0IGdldERhdGFTeW5jID0gKHJlZjogc3RyaW5nKTogdW5rbm93biA9PiB7XG4gICAgICBjb25zdCBkYXRhID0gbm90ZUNhY2hlLmdldChyZWYpO1xuICAgICAgaWYgKGRhdGEgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IEVycm9yKGBnZXREYXRhU3luYzogbm90ZSAke3JlZn0gbm90IGluIGNhY2hlYCk7XG4gICAgICByZXR1cm4gZGF0YTtcbiAgICB9O1xuXG4gICAgY29uc3QgZW52OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHtcbiAgICAgIC4uLihvcHRpb25zLmVudiA/PyB7fSksXG4gICAgICBhcmdzLFxuICAgICAgY2FsbDogY2FsbExvY2FsLFxuICAgICAgY2FsbE5vdGU6IGNhbGxMb2NhbCxcbiAgICAgIHJlbW90ZSxcbiAgICAgIHN0b3JlLFxuICAgICAgZ2V0RnVuY1N5bmMsXG4gICAgICBnZXREYXRhU3luYyxcbiAgICAgIGFkZE5vdGUsXG4gICAgICBnZXROb3RlLFxuICAgICAgYXNSZWYsXG4gICAgICBkZXJlZjogZGVSZWYsXG4gICAgICBoYXNoRGF0YSxcbiAgICAgIGZyb21qc29uLFxuICAgICAgcHJvbXB0VXNlcixcbiAgICAgIG9wZW5Sb3V0ZXJSZXF1ZXN0LFxuICAgICAgSFRNTCxcbiAgICAgIEpTT04sXG4gICAgICBjb25zb2xlLFxuICAgIH07XG5cbiAgICAvLyBQcmUtZmV0Y2ggYWxsIGRlcCBzb3VyY2VzIGJlZm9yZSBleGVjdXRpbmdcbiAgICBjb25zdCBkZXBzID0gcGFyc2VEZXBzKGZuTm90ZSk7XG4gICAgZm9yIChjb25zdCBkZXAgb2YgZGVwcykgYXdhaXQgcHJlZmV0Y2goZGVwKTtcblxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJ1bldpdGhGdWVsU2hhcmVkQXN5bmMoXG4gICAgICBmbk5vdGUsXG4gICAgICBmdWVsUmVmLFxuICAgICAgZW52LFxuICAgICk7XG5cbiAgICBpZiAoXCJlcnJcIiBpbiByZXN1bHQpIHRocm93IG5ldyBFcnJvcihyZXN1bHQuZXJyKTtcbiAgICByZXR1cm4gcmVzdWx0Lm9rO1xuICB9O1xuXG4gIHJldHVybiBjYWxsTG9jYWw7XG59O1xuXG5leHBvcnQgY29uc3QgY2FsbE5vdGVDbGllbnQgPSBhc3luYyAoXG4gIGZuOiBSZWYgfCBKc29uYWJsZSxcbiAgYXJncz86IChSZWYgfCBKc29uYWJsZSlbXSxcbiAgb3B0aW9uczogQ2xpZW50RnVlbE9wdGlvbnMgPSB7fVxuKTogUHJvbWlzZTxKc29uYWJsZT4gPT4ge1xuICBjb25zdCBjYWxsTG9jYWwgPSBjcmVhdGVMb2NhbEV4ZWN1dG9yKG9wdGlvbnMpO1xuICByZXR1cm4gKGF3YWl0IGNhbGxMb2NhbChmbiwgYXJncyA/PyBbXSkpIGFzIEpzb25hYmxlO1xufTtcblxuZXhwb3J0IGNvbnN0IGNhbGxWaWV3Q2xpZW50ID0gYXN5bmMgKFxuICBmbjogUmVmIHwgSnNvbmFibGUsXG4gIF9hcmdzPzogKFJlZiB8IEpzb25hYmxlKVtdLFxuICBvcHRpb25zOiBDbGllbnRGdWVsT3B0aW9ucyA9IHt9XG4pOiBQcm9taXNlPFZpZXc+ID0+IHtcbiAgLy8gVmlldyBub3RlcyBoYXZlIGlubGluZWQgYm9kaWVzIFx1MjAxNCBhcmdzWzBdIGlzIHRoZSB1cHBlciBvYmplY3QuXG4gIC8vIFByZS1mZXRjaCBkZXAgc291cmNlcyBhc3luYywgdGhlbiByZXR1cm4gYSBzeW5jIHdyYXBwZXIuXG4gIGNvbnN0IGZ1ZWxCdWRnZXQgPSBvcHRpb25zLmZ1ZWwgPz8gMTAwMDAwO1xuICBjb25zdCBmdWVsUmVmID0geyB2YWx1ZTogZnVlbEJ1ZGdldCB9O1xuICBjb25zdCBub3RlQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgSnNvbmFibGU+KCk7XG4gIGNvbnN0IG1lbVN0b3JlID0gbmV3IE1hcDxzdHJpbmcsIEpzb25hYmxlPigpO1xuICBjb25zdCBscyA9ICgoKSA9PiB7XG4gICAgdHJ5IHsgcmV0dXJuIHR5cGVvZiBsb2NhbFN0b3JhZ2UgIT09IFwidW5kZWZpbmVkXCIgPyBsb2NhbFN0b3JhZ2UgOiB1bmRlZmluZWQ7IH0gY2F0Y2ggeyByZXR1cm4gdW5kZWZpbmVkOyB9XG4gIH0pKCk7XG4gIGNvbnN0IHByb21wdFVzZXIgPSAobWVzc2FnZTogc3RyaW5nLCBkZWZhdWx0VmFsdWUgPSBcIlwiKTogc3RyaW5nIHwgbnVsbCA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHAgPSAoZ2xvYmFsVGhpcyBhcyB7IHByb21wdD86IChtOiBzdHJpbmcsIGQ/OiBzdHJpbmcpID0+IHN0cmluZyB8IG51bGwgfSkucHJvbXB0O1xuICAgICAgaWYgKHR5cGVvZiBwID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBwKG1lc3NhZ2UsIGRlZmF1bHRWYWx1ZSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBuby1vcFxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfTtcblxuICAvLyBNYXAgZnJvbSB3cmFwcGVyIGZ1bmN0aW9uIFx1MjE5MiBoYXNoIChmb3IgcmVtb3RlKCkgdG8gcmVzb2x2ZSlcbiAgY29uc3QgZm5Ub0hhc2ggPSBuZXcgTWFwPEZ1bmN0aW9uLCBzdHJpbmc+KCk7XG5cbiAgY29uc3QgZm5SZWYgPSBhd2FpdCBhc1JlZihmbik7XG4gIGNvbnN0IGZuTm90ZSA9IGF3YWl0IGRlUmVmKGZuUmVmKTtcbiAgaWYgKHR5cGVvZiBmbk5vdGUgIT09IFwic3RyaW5nXCIpIHRocm93IG5ldyBFcnJvcihcInZpZXcgbm90ZSBtdXN0IHJlc29sdmUgdG8gYSBzdHJpbmdcIik7XG5cbiAgLyoqIFJlY3Vyc2l2ZWx5IGZldGNoIGRlcCBkYXRhIGludG8gbm90ZUNhY2hlIChubyBleGVjdXRpb24pLiAqL1xuICBjb25zdCBwcmVmZXRjaCA9IGFzeW5jIChyZWY6IHN0cmluZyk6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgIGlmIChub3RlQ2FjaGUuaGFzKHJlZikpIHJldHVybjtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZGVSZWYocmVmIGFzIFJlZik7XG4gICAgbm90ZUNhY2hlLnNldChyZWYsIGRhdGEgYXMgSnNvbmFibGUpO1xuICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgZm9yIChjb25zdCBkZXAgb2YgcGFyc2VEZXBzKGRhdGEpKSBhd2FpdCBwcmVmZXRjaChkZXApO1xuICAgIH1cbiAgfTtcbiAgZm9yIChjb25zdCBkZXAgb2YgcGFyc2VEZXBzKGZuTm90ZSkpIGF3YWl0IHByZWZldGNoKGRlcCk7XG5cbiAgY29uc3Qgc3RvcmUgPSBtYWtlU3RvcmUoZm5SZWYsIG1lbVN0b3JlLCBscyk7XG4gIGNvbnN0IHJlbW90ZSA9IChmbjogdW5rbm93bik6ICguLi5yZW1vdGVBcmdzOiAoUmVmIHwgSnNvbmFibGUpW10pID0+IFByb21pc2U8SnNvbmFibGU+ID0+IHtcbiAgICBjb25zdCBoYXNoID0gZm5Ub0hhc2guZ2V0KGZuIGFzIEZ1bmN0aW9uKSA/PyBmbjtcbiAgICByZXR1cm4gKC4uLnJlbW90ZUFyZ3M6IChSZWYgfCBKc29uYWJsZSlbXSkgPT4gY2FsbE5vdGUoaGFzaCBhcyBSZWYgfCBKc29uYWJsZSwgcmVtb3RlQXJncyk7XG4gIH07XG5cbiAgLyoqIFJldHVybiBhIGNhbGxhYmxlIHdyYXBwZXIgdGhhdCBydW5zIHRoZSBkZXAncyBib2R5IHdpdGggYXJncyBhcnJheSwgb3duIHN0b3JlLiAqL1xuICBjb25zdCBnZXRGdW5jU3luYyA9IChyZWY6IHN0cmluZyk6ICguLi5jYWxsQXJnczogdW5rbm93bltdKSA9PiB1bmtub3duID0+IHtcbiAgICBjb25zdCBzcmMgPSBub3RlQ2FjaGUuZ2V0KHJlZik7XG4gICAgaWYgKHNyYyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgRXJyb3IoYGdldEZ1bmNTeW5jOiBub3RlICR7cmVmfSBub3QgaW4gY2FjaGVgKTtcbiAgICBpZiAodHlwZW9mIHNyYyAhPT0gXCJzdHJpbmdcIikgdGhyb3cgbmV3IEVycm9yKGBnZXRGdW5jU3luYzogbm90ZSAke3JlZn0gaXMgbm90IGNvZGVgKTtcbiAgICBjb25zdCBmbiA9ICguLi5jYWxsQXJnczogdW5rbm93bltdKSA9PiB7XG4gICAgICBjb25zdCBkZXBTdG9yZSA9IG1ha2VTdG9yZShyZWYsIG1lbVN0b3JlLCBscyk7XG4gICAgICBjb25zdCByZXN1bHQgPSBydW5XaXRoRnVlbFNoYXJlZChzcmMsIGZ1ZWxSZWYsIHsgLi4uYmFzZUVudiwgYXJnczogY2FsbEFyZ3MsIHN0b3JlOiBkZXBTdG9yZSB9KTtcbiAgICAgIGlmIChcImVyclwiIGluIHJlc3VsdCkgdGhyb3cgbmV3IEVycm9yKHJlc3VsdC5lcnIpO1xuICAgICAgcmV0dXJuIHJlc3VsdC5vaztcbiAgICB9O1xuICAgIGZuVG9IYXNoLnNldChmbiwgcmVmKTtcbiAgICByZXR1cm4gZm47XG4gIH07XG5cbiAgLyoqIFJldHVybiBKU09OIGRhdGEgZnJvbSBhIHByZWZldGNoZWQgbm90ZS4gKi9cbiAgY29uc3QgZ2V0RGF0YVN5bmMgPSAocmVmOiBzdHJpbmcpOiB1bmtub3duID0+IHtcbiAgICBjb25zdCBkYXRhID0gbm90ZUNhY2hlLmdldChyZWYpO1xuICAgIGlmIChkYXRhID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBFcnJvcihgZ2V0RGF0YVN5bmM6IG5vdGUgJHtyZWZ9IG5vdCBpbiBjYWNoZWApO1xuICAgIHJldHVybiBkYXRhO1xuICB9O1xuXG4gIGNvbnN0IGJhc2VFbnY6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge1xuICAgIC4uLihvcHRpb25zLmVudiA/PyB7fSksXG4gICAgcmVtb3RlLCBnZXRGdW5jU3luYywgZ2V0RGF0YVN5bmMsIHN0b3JlLCBhZGROb3RlLCBnZXROb3RlLCBhc1JlZiwgZGVyZWY6IGRlUmVmLCBoYXNoRGF0YSwgZnJvbWpzb24sIHByb21wdFVzZXIsIG9wZW5Sb3V0ZXJSZXF1ZXN0LCBIVE1MLCBKU09OLCBjb25zb2xlLFxuICB9O1xuXG4gIC8vIElubGluZWQgYm9keSBcdTIwMTQgYXJnc1swXSBpcyB0aGUgd2luZG93IG9iamVjdC5cbiAgcmV0dXJuICh1cHBlcjogVmlld0NvbnRleHQpOiBWRG9tID0+IHtcbiAgICAvLyBJbnN0YWxsIGNhbGxiYWNrIG9uIHRoZSBhY3R1YWwgVmlld0NvbnRleHQgb2JqZWN0IHVzZWQgYnkgcmVuZGVyRG9tIGV2ZW50IGRpc3BhdGNoLlxuICAgIHVwcGVyLm9uVXNlckV2ZW50ID0gKCkgPT4ge1xuICAgICAgZnVlbFJlZi52YWx1ZSA9IGZ1ZWxCdWRnZXQ7XG4gICAgfTtcbiAgICBjb25zdCByZXN1bHQgPSBydW5XaXRoRnVlbFNoYXJlZChmbk5vdGUsIGZ1ZWxSZWYsIHsgLi4uYmFzZUVudiwgYXJnczogW3VwcGVyXSB9KTtcbiAgICBpZiAoXCJlcnJcIiBpbiByZXN1bHQpIHRocm93IG5ldyBFcnJvcihyZXN1bHQuZXJyKTtcbiAgICByZXR1cm4gcmVzdWx0Lm9rIGFzIFZEb207XG4gIH07XG59O1xuIiwgImltcG9ydCB7IGNhbGxWaWV3Q2xpZW50LCBIVE1MLCByZW5kZXJEb20gfSBmcm9tIFwiQGhhc2hub3Rlcy9saWJcIjtcbmltcG9ydCB7IGlzUmVmLCB0b2pzb24sIHR5cGUgUmVmIH0gZnJvbSBcIkBoYXNobm90ZXMvY29yZS9ub3Rlc1wiO1xuaW1wb3J0IHsgZ2V0Tm90ZSwgZ2V0U2VydmVyIH0gZnJvbSBcIi4uLy4uL2xpYi9zcmMvZGJcIjtcblxuY29uc3QgREVWX1VSTCA9IFwiaHR0cDovL2xvY2FsaG9zdDo0MzIxXCI7XG50eXBlIEhpc3RvcnlFbnRyeSA9IHsgdHNIYXNoOiBzdHJpbmc7IGpzSGFzaDogc3RyaW5nOyBleHBvcnROYW1lOiBzdHJpbmc7IGZpbGVuYW1lPzogc3RyaW5nIH07XG5cbmNvbnN0IGVsID0gKHRhZzogc3RyaW5nLCB0ZXh0Pzogc3RyaW5nKTogSFRNTEVsZW1lbnQgPT4ge1xuICBjb25zdCBlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpO1xuICBpZiAodGV4dCkgZS50ZXh0Q29udGVudCA9IHRleHQ7XG4gIHJldHVybiBlO1xufTtcblxuY29uc3QgZXJyb3JUZXh0ID0gKGVycjogdW5rbm93bik6IHN0cmluZyA9PiB7XG4gIGlmIChlcnIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgIGNvbnN0IHN0YWNrID0gZXJyLnN0YWNrID8gYFxcbiR7ZXJyLnN0YWNrfWAgOiBcIlwiO1xuICAgIHJldHVybiBgJHtlcnIubmFtZX06ICR7ZXJyLm1lc3NhZ2V9JHtzdGFja31gO1xuICB9XG4gIHJldHVybiBTdHJpbmcoZXJyKTtcbn07XG5cbmNvbnN0IHJlcG9ydERldkVycm9yID0gYXN5bmMgKHNvdXJjZTogc3RyaW5nLCBlcnI6IHVua25vd24pID0+IHtcbiAgY29uc3QgbWVzc2FnZSA9IGVycm9yVGV4dChlcnIpO1xuICBjb25zdCBzdGFjayA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gKGVyci5zdGFjayB8fCBcIlwiKSA6IFwiXCI7XG4gIHRyeSB7XG4gICAgYXdhaXQgZmV0Y2goYCR7REVWX1VSTH0vYnJvd3Nlci1lcnJvcmAsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIHNvdXJjZSxcbiAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgc3RhY2ssXG4gICAgICAgIHBhZ2U6IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSxcbiAgICAgIH0pLFxuICAgIH0pO1xuICB9IGNhdGNoIHtcbiAgICAvLyBSZXBvcnRpbmcgc2hvdWxkIG5ldmVyIGJyZWFrIHRoZSBVSSBmbG93LlxuICB9XG59O1xuXG5jb25zdCByZW5kZXJFcnJvclBhbmVsID0gKFxuICBtb3VudDogSFRNTEVsZW1lbnQsXG4gIHRpdGxlOiBzdHJpbmcsXG4gIGVycjogdW5rbm93bixcbiAgY29udGV4dDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9LFxuKSA9PiB7XG4gIG1vdW50LmlubmVySFRNTCA9IFwiXCI7XG5cbiAgY29uc3QgYm94ID0gZWwoXCJkaXZcIik7XG4gIGJveC5zdHlsZS5jc3NUZXh0ID0gXCJtYXJnaW46OHB4IDA7cGFkZGluZzoxMnB4O2JvcmRlcjoxcHggc29saWQgI2I0NDtiYWNrZ3JvdW5kOnJnYmEoMTgwLDY4LDY4LDAuMTIpO1wiO1xuXG4gIGNvbnN0IGggPSBlbChcImgzXCIsIHRpdGxlKTtcbiAgaC5zdHlsZS5jc3NUZXh0ID0gXCJtYXJnaW46MCAwIDhweCAwO2ZvbnQtc2l6ZToxcmVtO1wiO1xuICBib3guYXBwZW5kKGgpO1xuXG4gIGNvbnN0IG1ldGEgPSBPYmplY3QuZW50cmllcyhjb250ZXh0KVxuICAgIC5tYXAoKFtrLCB2XSkgPT4gYCR7a306ICR7dn1gKVxuICAgIC5qb2luKFwiXFxuXCIpO1xuICBpZiAobWV0YSkge1xuICAgIGNvbnN0IG0gPSBlbChcInByZVwiLCBtZXRhKTtcbiAgICBtLnN0eWxlLmNzc1RleHQgPSBcIm1hcmdpbjowIDAgOHB4IDA7d2hpdGUtc3BhY2U6cHJlLXdyYXA7b3BhY2l0eTowLjg1O1wiO1xuICAgIGJveC5hcHBlbmQobSk7XG4gIH1cblxuICBjb25zdCBib2R5ID0gZWwoXCJwcmVcIiwgZXJyb3JUZXh0KGVycikpO1xuICBib2R5LnN0eWxlLmNzc1RleHQgPSBcIm1hcmdpbjowO3doaXRlLXNwYWNlOnByZS13cmFwO292ZXJmbG93OmF1dG87bWF4LWhlaWdodDo1MHZoO1wiO1xuICBib3guYXBwZW5kKGJvZHkpO1xuICBtb3VudC5hcHBlbmQoYm94KTtcbn07XG5cbmNvbnN0IHBhcnNlUGF0aFNlZyA9IChwYXRobmFtZTogc3RyaW5nLCBpZHg6IG51bWJlcik6IHN0cmluZyA9PiB7XG4gIGNvbnN0IHNlZ3MgPSBwYXRobmFtZS5yZXBsYWNlKC9eXFwvKy8sIFwiXCIpLnNwbGl0KFwiL1wiKTtcbiAgaWYgKGlkeCA8IDAgfHwgaWR4ID49IHNlZ3MubGVuZ3RoKSByZXR1cm4gXCJcIjtcbiAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChzZWdzW2lkeF0pLnRyaW0oKTtcbn07XG5cbmNvbnN0IHBhcnNlUmVmQXQgPSAocGF0aG5hbWU6IHN0cmluZywgaWR4OiBudW1iZXIpOiBSZWYgfCBudWxsID0+IHtcbiAgY29uc3Qgc2VnID0gcGFyc2VQYXRoU2VnKHBhdGhuYW1lLCBpZHgpO1xuICBpZiAoIXNlZykgcmV0dXJuIG51bGw7XG4gIGlmIChpc1JlZihzZWcpKSByZXR1cm4gc2VnO1xuICBpZiAoL15bYS1mMC05XXszMn0kL2kudGVzdChzZWcpKSByZXR1cm4gYCMke3NlZ31gO1xuICByZXR1cm4gbnVsbDtcbn07XG5cbmNvbnN0IHN0YXJ0UG9sbGluZyA9IChtb3VudDogSFRNTEVsZW1lbnQsIHBvbGw6ICgpID0+IFByb21pc2U8dm9pZD4pID0+IHtcbiAgbW91bnQuaW5uZXJIVE1MID0gXCJcIjtcbiAgbW91bnQudGV4dENvbnRlbnQgPSBcIkNvbm5lY3RpbmcgdG8gZGV2IHNlcnZlci4uLlwiO1xuICBjb25zdCBydW4gPSBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHBvbGwoKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJsaXZlIHBvbGwgZmFpbGVkXCIsIGVycik7XG4gICAgICB2b2lkIHJlcG9ydERldkVycm9yKFwicG9sbFwiLCBlcnIpO1xuICAgIH1cbiAgfTtcbiAgcnVuKCk7XG4gIHNldEludGVydmFsKHJ1biwgNTAwKTtcbn07XG5cbmNvbnN0IGZldGNoSGlzdG9yeSA9IGFzeW5jICgpOiBQcm9taXNlPEhpc3RvcnlFbnRyeVtdPiA9PlxuICBKU09OLnBhcnNlKGF3YWl0IChhd2FpdCBmZXRjaChgJHtERVZfVVJMfS9oaXN0b3J5YCkpLnRleHQoKSk7XG5cbmNvbnN0IGxhdGVzdFZpZXcgPSAoaGlzdG9yeTogSGlzdG9yeUVudHJ5W10pID0+XG4gIFsuLi5oaXN0b3J5XS5yZXZlcnNlKCkuZmluZChlID0+IGUuZXhwb3J0TmFtZSA9PT0gXCJ2aWV3XCIgfHwgZS5leHBvcnROYW1lID09PSBcImRlZmF1bHRcIik7XG5cbmNvbnN0IHJlbmRlclJlZiA9IGFzeW5jIChtb3VudDogSFRNTEVsZW1lbnQsIHJlZjogUmVmKSA9PiB7XG4gIGNvbnN0IG5vdGUgPSBhd2FpdCBnZXROb3RlKHJlZik7XG4gIHRyeSB7XG4gICAgY29uc3QgdmlldyA9IGF3YWl0IGNhbGxWaWV3Q2xpZW50KHJlZik7XG4gICAgbW91bnQuaW5uZXJIVE1MID0gXCJcIjtcbiAgICBtb3VudC5hcHBlbmQocmVuZGVyRG9tKHZpZXcsIHsgcGF0aG5hbWU6IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSB9KSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHZvaWQgcmVwb3J0RGV2RXJyb3IoXCJyZW5kZXJSZWZcIiwgZXJyKTtcbiAgICByZW5kZXJFcnJvclBhbmVsKG1vdW50LCBcIkZhaWxlZCB0byByZW5kZXIgbm90ZSB2aWV3XCIsIGVyciwge1xuICAgICAgcmVmLFxuICAgICAgcGF0aDogd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLFxuICAgICAgbm90ZTogdG9qc29uKG5vdGUpLFxuICAgIH0pO1xuICB9XG59O1xuXG5jb25zdCByZW5kZXJSYXdSZWYgPSBhc3luYyAobW91bnQ6IEhUTUxFbGVtZW50LCByZWY6IFJlZikgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IG5vdGUgPSBhd2FpdCBnZXROb3RlKHJlZik7XG4gICAgbW91bnQuaW5uZXJIVE1MID0gXCJcIjtcbiAgICBjb25zdCB3cmFwID0gZWwoXCJkaXZcIik7XG4gICAgd3JhcC5zdHlsZS5jc3NUZXh0ID0gXCJwYWRkaW5nOjhweDtcIjtcbiAgICBjb25zdCBoID0gZWwoXCJoM1wiLCBgcmF3IG5vdGUgJHtyZWZ9YCk7XG4gICAgaC5zdHlsZS5jc3NUZXh0ID0gXCJtYXJnaW46MCAwIDhweCAwO2ZvbnQtc2l6ZToxcmVtO1wiO1xuICAgIGNvbnN0IHByZSA9IGVsKFwicHJlXCIsIHRvanNvbihub3RlKSk7XG4gICAgcHJlLnN0eWxlLmNzc1RleHQgPSBcIm1hcmdpbjowO3doaXRlLXNwYWNlOnByZS13cmFwO292ZXJmbG93OmF1dG87bWF4LWhlaWdodDo3MHZoO1wiO1xuICAgIHdyYXAuYXBwZW5kKGgsIHByZSk7XG4gICAgbW91bnQuYXBwZW5kKHdyYXApO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICB2b2lkIHJlcG9ydERldkVycm9yKFwicmVuZGVyUmF3UmVmXCIsIGVycik7XG4gICAgcmVuZGVyRXJyb3JQYW5lbChtb3VudCwgXCJGYWlsZWQgdG8gbG9hZCByYXcgbm90ZVwiLCBlcnIsIHtcbiAgICAgIHJlZixcbiAgICAgIHBhdGg6IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSxcbiAgICB9KTtcbiAgfVxufTtcblxuY29uc3QgYm9vdExpdmVWaWV3ID0gKG1vdW50OiBIVE1MRWxlbWVudCwgcGF0aDogc3RyaW5nKSA9PiB7XG4gIGxldCBsYXN0ID0gXCJcIjtcbiAgbGV0IGxhc3RFcnJvcktleSA9IFwiXCI7XG4gIHN0YXJ0UG9sbGluZyhtb3VudCwgYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBoaXN0b3J5ID0gYXdhaXQgZmV0Y2hIaXN0b3J5KCk7XG4gICAgICBjb25zdCB2aWV3ID0gbGF0ZXN0VmlldyhoaXN0b3J5KTtcbiAgICAgIGlmICghdmlldykgeyBtb3VudC5pbm5lckhUTUwgPSBcIlwiOyBtb3VudC5hcHBlbmQoZWwoXCJwXCIsIFwiTm8gdmlldyBmb3VuZC5cIikpOyByZXR1cm47IH1cbiAgICAgIGlmICh2aWV3LmpzSGFzaCA9PT0gbGFzdCkgcmV0dXJuO1xuICAgICAgbGFzdCA9IHZpZXcuanNIYXNoO1xuXG4gICAgICBjb25zdCBiYXIgPSBlbChcImRpdlwiKTtcbiAgICAgIGJhci5zdHlsZS5jc3NUZXh0ID0gXCJwYWRkaW5nOjRweCA4cHg7Zm9udC1zaXplOjAuODVlbTtvcGFjaXR5OjAuNjtcIjtcbiAgICAgIGNvbnN0IGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcbiAgICAgIGEuaHJlZiA9IGAvdmlldy8ke3ZpZXcuanNIYXNoLnNsaWNlKDEpfWA7XG4gICAgICBhLnRleHRDb250ZW50ID0gYCR7dmlldy5maWxlbmFtZSA/PyB2aWV3LmV4cG9ydE5hbWV9IFx1MjE5MiAke3ZpZXcuanNIYXNoLnNsaWNlKDAsIDE0KX1cdTIwMjZgO1xuICAgICAgYmFyLmFwcGVuZChhKTtcblxuICAgICAgY29uc3QgcmVuZGVyZWQgPSByZW5kZXJEb20oYXdhaXQgY2FsbFZpZXdDbGllbnQodmlldy5qc0hhc2ggYXMgUmVmKSwgeyBwYXRobmFtZTogcGF0aC5yZXBsYWNlKFwiL2xpdmUvdmlld1wiLCBcIlwiKSB8fCBcIi9cIiB9KTtcbiAgICAgIG1vdW50LmlubmVySFRNTCA9IFwiXCI7XG4gICAgICBtb3VudC5hcHBlbmQoYmFyLCByZW5kZXJlZCk7XG4gICAgICBsYXN0RXJyb3JLZXkgPSBcIlwiO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc3Qga2V5ID0gZXJyb3JUZXh0KGVycik7XG4gICAgICB2b2lkIHJlcG9ydERldkVycm9yKFwiYm9vdExpdmVWaWV3XCIsIGVycik7XG4gICAgICBpZiAoa2V5ICE9PSBsYXN0RXJyb3JLZXkpIHtcbiAgICAgICAgcmVuZGVyRXJyb3JQYW5lbChtb3VudCwgXCJGYWlsZWQgdG8gcmVuZGVyIGxhdGVzdCBsaXZlIHZpZXdcIiwgZXJyLCB7XG4gICAgICAgICAgcGF0aCxcbiAgICAgICAgICByZXRyeTogXCJhdXRvbWF0aWMgKDUwMG1zKVwiLFxuICAgICAgICB9KTtcbiAgICAgICAgbGFzdEVycm9yS2V5ID0ga2V5O1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59O1xuXG5jb25zdCBib290TGl2ZUluZGV4ID0gKG1vdW50OiBIVE1MRWxlbWVudCkgPT4ge1xuICBsZXQgbGFzdCA9IFwiXCI7XG4gIHN0YXJ0UG9sbGluZyhtb3VudCwgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IGpzb24gPSBhd2FpdCAoYXdhaXQgZmV0Y2goYCR7REVWX1VSTH0vaGlzdG9yeWApKS50ZXh0KCk7XG4gICAgaWYgKGpzb24gPT09IGxhc3QpIHJldHVybjtcbiAgICBsYXN0ID0ganNvbjtcblxuICAgIGNvbnN0IGhpc3Rvcnk6IEhpc3RvcnlFbnRyeVtdID0gSlNPTi5wYXJzZShqc29uKTtcbiAgICBtb3VudC5pbm5lckhUTUwgPSBcIlwiO1xuICAgIG1vdW50LmFwcGVuZChlbChcImgyXCIsIFwiaGFzaG5vdGVzIGRldlwiKSk7XG4gICAgbW91bnQuYXBwZW5kKGVsKFwicFwiLCBgJHtoaXN0b3J5Lmxlbmd0aH0gY29tcGlsZWQgbm90ZXMgKCR7Z2V0U2VydmVyKCl9KWApKTtcblxuICAgIGZvciAoY29uc3QgZW50cnkgb2YgaGlzdG9yeSkge1xuICAgICAgY29uc3Qgcm93ID0gZWwoXCJkaXZcIik7XG4gICAgICBjb25zdCBpc1ZpZXcgPSBlbnRyeS5leHBvcnROYW1lID09PSBcInZpZXdcIiB8fCBlbnRyeS5leHBvcnROYW1lID09PSBcImRlZmF1bHRcIjtcbiAgICAgIGlmIChpc1ZpZXcpIHtcbiAgICAgICAgY29uc3QgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICAgICAgICBhLmhyZWYgPSBgL3ZpZXcvJHtlbnRyeS5qc0hhc2guc2xpY2UoMSl9YDtcbiAgICAgICAgYS50ZXh0Q29udGVudCA9IGVudHJ5LmV4cG9ydE5hbWU7XG4gICAgICAgIHJvdy5hcHBlbmQoYSk7XG4gICAgICAgIGNvbnN0IHJhdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICAgICAgICByYXcuaHJlZiA9IGAvJHtlbnRyeS5qc0hhc2guc2xpY2UoMSl9YDtcbiAgICAgICAgcmF3LnRleHRDb250ZW50ID0gXCIgKHJhdylcIjtcbiAgICAgICAgcmF3LnN0eWxlLmNzc1RleHQgPSBcIm9wYWNpdHk6MC41O2ZvbnQtc2l6ZTowLjg1ZW07XCI7XG4gICAgICAgIHJvdy5hcHBlbmQocmF3KTtcbiAgICAgICAgY29uc3QgbGl2ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICAgICAgICBsaXZlLmhyZWYgPSBcIi9saXZlL3ZpZXdcIjtcbiAgICAgICAgbGl2ZS50ZXh0Q29udGVudCA9IFwiIChsaXZlKVwiO1xuICAgICAgICBsaXZlLnN0eWxlLmNzc1RleHQgPSBcIm9wYWNpdHk6MC41O2ZvbnQtc2l6ZTowLjg1ZW07XCI7XG4gICAgICAgIHJvdy5hcHBlbmQobGl2ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBzcGFuID0gZWwoXCJzcGFuXCIsIGVudHJ5LmV4cG9ydE5hbWUpO1xuICAgICAgICBzcGFuLnN0eWxlLm9wYWNpdHkgPSBcIjAuNVwiO1xuICAgICAgICByb3cuYXBwZW5kKHNwYW4pO1xuICAgICAgfVxuICAgICAgY29uc3QgaGFzaCA9IGVsKFwic3BhblwiLCBgICR7ZW50cnkuanNIYXNoLnNsaWNlKDAsIDE0KX1cdTIwMjZgKTtcbiAgICAgIGhhc2guc3R5bGUuY3NzVGV4dCA9IFwib3BhY2l0eTowLjQ7Zm9udC1zaXplOjAuODVlbTtcIjtcbiAgICAgIHJvdy5hcHBlbmQoaGFzaCk7XG4gICAgICBtb3VudC5hcHBlbmQocm93KTtcbiAgICB9XG4gIH0pO1xufTtcblxuZXhwb3J0IGNvbnN0IGJvb3QgPSBhc3luYyAoKSA9PiB7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgKGV2KSA9PiB7XG4gICAgdm9pZCByZXBvcnREZXZFcnJvcihcIndpbmRvdy5vbmVycm9yXCIsIGV2LmVycm9yIHx8IGV2Lm1lc3NhZ2UpO1xuICB9KTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJ1bmhhbmRsZWRyZWplY3Rpb25cIiwgKGV2KSA9PiB7XG4gICAgdm9pZCByZXBvcnREZXZFcnJvcihcIndpbmRvdy51bmhhbmRsZWRyZWplY3Rpb25cIiwgZXYucmVhc29uKTtcbiAgfSk7XG5cbiAgY29uc3QgbW91bnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFwcFwiKSA/PyBkb2N1bWVudC5ib2R5O1xuICBjb25zdCBwYXRoID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnJlcGxhY2UoL1xcLyskLywgXCJcIik7XG5cbiAgaWYgKHBhdGguc3RhcnRzV2l0aChcIi9saXZlL3ZpZXdcIikpIHJldHVybiBib290TGl2ZVZpZXcobW91bnQsIHBhdGgpO1xuICBpZiAocGF0aCA9PT0gXCIvbGl2ZVwiKSByZXR1cm4gYm9vdExpdmVJbmRleChtb3VudCk7XG5cbiAgaWYgKHBhdGguc3RhcnRzV2l0aChcIi92aWV3L1wiKSkge1xuICAgIGNvbnN0IHJlZiA9IHBhcnNlUmVmQXQocGF0aCwgMSk7XG4gICAgaWYgKCFyZWYpIHsgbW91bnQudGV4dENvbnRlbnQgPSBcIk9wZW4gL3ZpZXcvPG5vdGUtaGFzaD4gdG8gcmVuZGVyIHRoYXQgbm90ZSBhcyBhIHZpZXcuXCI7IHJldHVybjsgfVxuICAgIGF3YWl0IHJlbmRlclJlZihtb3VudCwgcmVmKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCByZWYgPSBwYXJzZVJlZkF0KHBhdGgsIDApO1xuICBpZiAoIXJlZikge1xuICAgIG1vdW50LnRleHRDb250ZW50ID0gXCJPcGVuIC88bm90ZS1oYXNoPiBmb3IgcmF3IGRhdGEgb3IgL3ZpZXcvPG5vdGUtaGFzaD4gdG8gcmVuZGVyIGFzIGEgdmlldy5cIjtcbiAgICByZXR1cm47XG4gIH1cbiAgYXdhaXQgcmVuZGVyUmF3UmVmKG1vdW50LCByZWYpO1xufTtcbiIsICJpbXBvcnQgeyBib290IH0gZnJvbSBcIi4vbWFpbi50c1wiO1xuXG5ib290KCkuY2F0Y2goKGVycikgPT4ge1xuICBjb25zb2xlLmVycm9yKGVycik7XG4gIGNvbnN0IG1vdW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhcHBcIikgPz8gZG9jdW1lbnQuYm9keTtcbiAgbW91bnQudGV4dENvbnRlbnQgPSBgQXBwIGJvb3QgZmFpbGVkOiAke1N0cmluZyhlcnIpfWA7XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFNQSxJQUFNLGNBQWlDLENBQUMsU0FBUyxhQUFhLFdBQVcsYUFBYSxZQUFZ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SUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFJLElBQUksSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxHQUFHLEtBQUssR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksSUFBSSxJQUFJLEdBQUcsR0FBRyxLQUFLLElBQUksS0FBSyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEtBQUssR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxJQUFJLEtBQUssR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFJLElBQUksR0FBRyxJQUFJLEtBQUssR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFLLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksSUFBSSxNQUFNLEdBQUcsR0FBRyxJQUFJLE9BQU8sSUFBSSxNQUFNLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEtBQUssR0FBRyxLQUFLLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLE9BQU8sR0FBRyxNQUFNLEdBQUcsS0FBSyxJQUFJLEdBQUcsSUFBSSxLQUFLLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEtBQUssR0FBRyxNQUFNLElBQUksS0FBSyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLElBQUksTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFLLEdBQUcsS0FBSyxHQUFHLElBQUksR0FBRyxLQUFLLEdBQUcsSUFBSSxJQUFJLEtBQUssSUFBSSxLQUFLLEdBQUcsR0FBRyxHQUFHLEtBQUssR0FBRyxLQUFLLEdBQUcsR0FBRyxHQUFHLE1BQU0sR0FBRyxRQUFRLEdBQUc7QUFHem9DLElBQUksNkJBQTZCLENBQUMsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksSUFBSSxLQUFLLElBQUksSUFBSSxLQUFLLElBQUksR0FBRyxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksR0FBRyxJQUFJLElBQUksSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEtBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLElBQUksSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksS0FBSyxJQUFJLElBQUksSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksS0FBSyxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksS0FBSyxJQUFJLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxHQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLElBQUksSUFBSSxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksR0FBRyxJQUFJLElBQUksR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxHQUFHLEdBQUcsS0FBSyxJQUFJLElBQUksR0FBRyxJQUFJLElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxLQUFLLElBQUksS0FBSyxJQUFJLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxJQUFJLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLEtBQUssSUFBSSxJQUFJLEdBQUcsR0FBRyxJQUFJLElBQUksR0FBRyxJQUFJLElBQUksS0FBSyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksR0FBRyxLQUFLLElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksS0FBSyxHQUFHLElBQUksS0FBSyxLQUFLLEtBQUssSUFBSSxLQUFLLE1BQU0sSUFBSSxJQUFJLE1BQU0sSUFBSSxHQUFHLElBQUksTUFBTSxHQUFHLEtBQUssTUFBTSxJQUFJLE1BQU0sS0FBSyxHQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxHQUFHLElBQUksS0FBSyxJQUFJLEtBQUssSUFBSSxLQUFLLElBQUksR0FBRyxHQUFHLElBQUksSUFBSSxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksTUFBTSxHQUFHLE1BQU0sSUFBSSxHQUFHLE1BQU0sR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsS0FBSyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxLQUFLLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxNQUFNLElBQUksR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEtBQUssR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsR0FBRyxNQUFNLElBQUksR0FBRyxHQUFHLEtBQUssSUFBSSxLQUFLLElBQUksSUFBSSxH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NkIsR0FBRyxNQUFNO0FBQUEsRUFDNUQsQ0FBQztBQUVELFFBQU0sUUFBUSxTQUFTLGVBQWUsS0FBSyxLQUFLLFNBQVM7QUFDekQsUUFBTUEsUUFBTyxPQUFPLFNBQVMsU0FBUyxRQUFRLFFBQVEsRUFBRTtBQUV4RCxNQUFJQSxNQUFLLFdBQVcsWUFBWSxFQUFHLFFBQU8sYUFBYSxPQUFPQSxLQUFJO0FBQ2xFLE1BQUlBLFVBQVMsUUFBUyxRQUFPLGNBQWMsS0FBSztBQUVoRCxNQUFJQSxNQUFLLFdBQVcsUUFBUSxHQUFHO0FBQzdCLFVBQU1ELE9BQU0sV0FBV0MsT0FBTSxDQUFDO0FBQzlCLFFBQUksQ0FBQ0QsTUFBSztBQUFFLFlBQU0sY0FBYztBQUF5RDtBQUFBLElBQVE7QUFDakcsVUFBTSxVQUFVLE9BQU9BLElBQUc7QUFDMUI7QUFBQSxFQUNGO0FBRUEsUUFBTUEsT0FBTSxXQUFXQyxPQUFNLENBQUM7QUFDOUIsTUFBSSxDQUFDRCxNQUFLO0FBQ1IsVUFBTSxjQUFjO0FBQ3BCO0FBQUEsRUFDRjtBQUNBLFFBQU0sYUFBYSxPQUFPQSxJQUFHO0FBQy9COzs7QUN0UEEsS0FBSyxFQUFFLE1BQU0sQ0FBQyxRQUFRO0FBQ3BCLFVBQVEsTUFBTSxHQUFHO0FBQ2pCLFFBQU0sUUFBUSxTQUFTLGVBQWUsS0FBSyxLQUFLLFNBQVM7QUFDekQsUUFBTSxjQUFjLG9CQUFvQixPQUFPLEdBQUcsQ0FBQztBQUNyRCxDQUFDOyIsCiAgIm5hbWVzIjogWyJlbCIsICJvZmZzZXQiLCAiZGF0YSIsICJ0ZXh0IiwgImRhdGEiLCAiVG9rZW5UeXBlIiwgIlBvc2l0aW9uIiwgIlNvdXJjZUxvY2F0aW9uIiwgIm9mZnNldCIsICJ0ZXh0IiwgIlBhcnNlciIsICJyZWYiLCAicGFyc2UiLCAiRGVzdHJ1Y3R1cmluZ0Vycm9ycyIsICJUb2tDb250ZXh0IiwgIlNjb3BlIiwgIk5vZGUiLCAiQnJhbmNoSUQiLCAiUmVnRXhwVmFsaWRhdGlvblN0YXRlIiwgImN1cnJlbnQiLCAiVG9rZW4iLCAiZWwiLCAicGFyc2UiLCAiZWwiLCAiZW52IiwgImVudiIsICJwYXJzZSIsICJ0ZXh0IiwgImRhdGEiLCAibm90ZUNhY2hlIiwgInJlZiIsICJkYXRhIiwgImZuIiwgInRleHQiLCAicmVmIiwgInBhdGgiXQp9Cg==
