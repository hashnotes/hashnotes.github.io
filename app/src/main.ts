import { callViewClient, HTML, renderDom } from "@hashnotes/lib";
import { isRef, tojson, type Ref } from "@hashnotes/core/notes";
import { getNote, getServer } from "../../lib/src/db";

const DEV_URL = "http://localhost:4321";
type HistoryEntry = { tsHash: string; jsHash: string; exportName: string; filename?: string };

const el = (tag: string, text?: string): HTMLElement => {
  const e = document.createElement(tag);
  if (text) e.textContent = text;
  return e;
};

const errorText = (err: unknown): string => {
  if (err instanceof Error) {
    const stack = err.stack ? `\n${err.stack}` : "";
    return `${err.name}: ${err.message}${stack}`;
  }
  return String(err);
};

const reportDevError = async (source: string, err: unknown) => {
  const message = errorText(err);
  const stack = err instanceof Error ? (err.stack || "") : "";
  try {
    await fetch(`${DEV_URL}/browser-error`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source,
        message,
        stack,
        page: window.location.pathname,
      }),
    });
  } catch {
    // Reporting should never break the UI flow.
  }
};

const renderErrorPanel = (
  mount: HTMLElement,
  title: string,
  err: unknown,
  context: Record<string, string> = {},
) => {
  mount.innerHTML = "";

  const box = el("div");
  box.style.cssText = "margin:8px 0;padding:12px;border:1px solid #b44;background:rgba(180,68,68,0.12);";

  const h = el("h3", title);
  h.style.cssText = "margin:0 0 8px 0;font-size:1rem;";
  box.append(h);

  const meta = Object.entries(context)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
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

const parsePathSeg = (pathname: string, idx: number): string => {
  const segs = pathname.replace(/^\/+/, "").split("/");
  if (idx < 0 || idx >= segs.length) return "";
  return decodeURIComponent(segs[idx]).trim();
};

const parseRefAt = (pathname: string, idx: number): Ref | null => {
  const seg = parsePathSeg(pathname, idx);
  if (!seg) return null;
  if (isRef(seg)) return seg;
  if (/^[a-f0-9]{32}$/i.test(seg)) return `#${seg}`;
  return null;
};

const startPolling = (mount: HTMLElement, poll: () => Promise<void>) => {
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

const fetchHistory = async (): Promise<HistoryEntry[]> =>
  JSON.parse(await (await fetch(`${DEV_URL}/history`)).text());

const latestView = (history: HistoryEntry[]) =>
  [...history].reverse().find(e => e.exportName === "view" || e.exportName === "default");

const renderRef = async (mount: HTMLElement, ref: Ref) => {
  const note = await getNote(ref);
  try {
    const view = await callViewClient(ref);
    mount.innerHTML = "";
    mount.append(renderDom(view, { pathname: window.location.pathname }));
  } catch (err) {
    void reportDevError("renderRef", err);
    renderErrorPanel(mount, "Failed to render note view", err, {
      ref,
      path: window.location.pathname,
      note: tojson(note),
    });
  }
};

const renderRawRef = async (mount: HTMLElement, ref: Ref) => {
  try {
    const note = await getNote(ref);
    mount.innerHTML = "";
    const wrap = el("div");
    wrap.style.cssText = "padding:8px;";
    const h = el("h3", `raw note ${ref}`);
    h.style.cssText = "margin:0 0 8px 0;font-size:1rem;";
    const pre = el("pre", tojson(note));
    pre.style.cssText = "margin:0;white-space:pre-wrap;overflow:auto;max-height:70vh;";
    wrap.append(h, pre);
    mount.append(wrap);
  } catch (err) {
    void reportDevError("renderRawRef", err);
    renderErrorPanel(mount, "Failed to load raw note", err, {
      ref,
      path: window.location.pathname,
    });
  }
};

const bootLiveView = (mount: HTMLElement, path: string) => {
  let last = "";
  let lastErrorKey = "";
  startPolling(mount, async () => {
    try {
      const history = await fetchHistory();
      const view = latestView(history);
      if (!view) { mount.innerHTML = ""; mount.append(el("p", "No view found.")); return; }
      if (view.jsHash === last) return;
      last = view.jsHash;

      const bar = el("div");
      bar.style.cssText = "padding:4px 8px;font-size:0.85em;opacity:0.6;";
      const a = document.createElement("a");
      a.href = `/view/${view.jsHash.slice(1)}`;
      a.textContent = `${view.filename ?? view.exportName} → ${view.jsHash.slice(0, 14)}…`;
      bar.append(a);

      const rendered = renderDom(await callViewClient(view.jsHash as Ref), { pathname: path.replace("/live/view", "") || "/" });
      mount.innerHTML = "";
      mount.append(bar, rendered);
      lastErrorKey = "";
    } catch (err) {
      const key = errorText(err);
      void reportDevError("bootLiveView", err);
      if (key !== lastErrorKey) {
        renderErrorPanel(mount, "Failed to render latest live view", err, {
          path,
          retry: "automatic (500ms)",
        });
        lastErrorKey = key;
      }
    }
  });
};

const bootLiveIndex = (mount: HTMLElement) => {
  let last = "";
  startPolling(mount, async () => {
    const json = await (await fetch(`${DEV_URL}/history`)).text();
    if (json === last) return;
    last = json;

    const history: HistoryEntry[] = JSON.parse(json);
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
      const hash = el("span", ` ${entry.jsHash.slice(0, 14)}…`);
      hash.style.cssText = "opacity:0.4;font-size:0.85em;";
      row.append(hash);
      mount.append(row);
    }
  });
};

export const boot = async () => {
  window.addEventListener("error", (ev) => {
    void reportDevError("window.onerror", ev.error || ev.message);
  });
  window.addEventListener("unhandledrejection", (ev) => {
    void reportDevError("window.unhandledrejection", ev.reason);
  });

  const mount = document.getElementById("app") ?? document.body;
  const path = window.location.pathname.replace(/\/+$/, "");

  if (path.startsWith("/live/view")) return bootLiveView(mount, path);
  if (path === "/live") return bootLiveIndex(mount);

  if (path.startsWith("/view/")) {
    const ref = parseRefAt(path, 1);
    if (!ref) { mount.textContent = "Open /view/<note-hash> to render that note as a view."; return; }
    await renderRef(mount, ref);
    return;
  }

  const ref = parseRefAt(path, 0);
  if (!ref) {
    mount.textContent = "Open /<note-hash> for raw data or /view/<note-hash> to render as a view.";
    return;
  }
  await renderRawRef(mount, ref);
};
