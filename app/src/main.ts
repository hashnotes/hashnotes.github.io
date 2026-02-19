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

const parseRef = (pathname: string): Ref | null => {
  const seg = decodeURIComponent(pathname.replace(/^\/+/, "").split("/")[0]).trim();
  if (!seg) return null;
  if (isRef(seg)) return seg;
  if (/^[a-f0-9]{32}$/i.test(seg)) return `#${seg}`;
  return null;
};

const startPolling = (mount: HTMLElement, poll: () => Promise<void>) => {
  mount.innerHTML = "";
  mount.textContent = "Connecting to dev server...";
  poll().then(() => setInterval(poll, 500));
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
    mount.innerHTML = "";
    mount.append(renderDom(() => HTML.pre(`failed to render note: ${ref}\n${err}\n${tojson(note)}`), { pathname: "/" }));
  }
};

const bootLiveView = (mount: HTMLElement, path: string) => {
  let last = "";
  startPolling(mount, async () => {
    const history = await fetchHistory();
    const view = latestView(history);
    if (!view) { mount.innerHTML = ""; mount.append(el("p", "No view found.")); return; }
    if (view.jsHash === last) return;
    last = view.jsHash;

    const bar = el("div");
    bar.style.cssText = "padding:4px 8px;font-size:0.85em;opacity:0.6;";
    const a = document.createElement("a");
    a.href = `/${view.jsHash.slice(1)}`;
    a.textContent = `${view.filename ?? view.exportName} → ${view.jsHash.slice(0, 14)}…`;
    bar.append(a);

    const rendered = renderDom(await callViewClient(view.jsHash as Ref), { pathname: path.replace("/live/view", "") || "/" });
    mount.innerHTML = "";
    mount.append(bar, rendered);
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
        a.href = `/${entry.jsHash.slice(1)}`;
        a.textContent = entry.exportName;
        row.append(a);
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
  const mount = document.getElementById("app") ?? document.body;
  const path = window.location.pathname.replace(/\/+$/, "");

  if (path.startsWith("/live/view")) return bootLiveView(mount, path);
  if (path === "/live") return bootLiveIndex(mount);

  const ref = parseRef(path);
  if (!ref) { mount.textContent = "Open /<note-hash> to render that note as a view."; return; }
  await renderRef(mount, ref);
};
