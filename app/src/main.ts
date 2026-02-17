import { callViewClient, HTML, renderDom } from "@hashnotes/lib";
import { isRef, tojson, type Ref } from "@hashnotes/core/notes";
import { getNote, getServer } from "../../lib/src/db";

const parseRefFromPath = (pathname: string): Ref | null => {
  const segment = pathname.replace(/^\/+/, "").split("/")[0];
  if (!segment) return null;

  const decoded = decodeURIComponent(segment).trim();
  if (!decoded) return null;

  if (isRef(decoded)) return decoded;
  if (/^[a-f0-9]{32}$/i.test(decoded)) return `#${decoded}`;
  return null;
};

const DEV_URL = "http://localhost:4321";

const renderRef = async (mount: HTMLElement, ref: Ref) => {
  let note = await getNote(ref);
  try {
    const view = await callViewClient(ref, {});
    const el = renderDom(view);
    mount.innerHTML = "";
    mount.append(el);
  } catch (err) {
    mount.innerHTML = "";
    mount.append(renderDom(u => HTML.pre(`failed to render note: ${ref}\n${err}\n${tojson(note)}`)));
  }
};

type HistoryEntry = { tsHash: string; jsHash: string; exportName: string; filename?: string };

const el = (tag: string, text?: string): HTMLElement => {
  const e = document.createElement(tag);
  if (text) e.textContent = text;
  return e;
};

const fetchHistory = async (): Promise<HistoryEntry[]> => {
  const res = await fetch(`${DEV_URL}/history`);
  return JSON.parse(await res.text());
};

const latestView = (history: HistoryEntry[]): HistoryEntry | undefined =>
  [...history].reverse().find(e => e.exportName === "view" || e.exportName === "default");

const bootLive = async (mount: HTMLElement) => {
  mount.innerHTML = "";
  mount.textContent = "Connecting to dev server...";

  let lastJson = "";

  const poll = async () => {
    try {
      const res = await fetch(`${DEV_URL}/history`);
      const json = await res.text();
      if (json === lastJson) return;
      lastJson = json;

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
          a.textContent = entry.exportName
          row.append(a);
          const liveLink = document.createElement("a");
          liveLink.href = "/live/view";
          liveLink.textContent = " (live)";
          liveLink.style.opacity = "0.5";
          liveLink.style.fontSize = "0.85em";
          row.append(liveLink);
        } else {
          const span = el("span", entry.exportName);
          span.style.opacity = "0.5";
          row.append(span);
        }

        const hash = el("span", ` ${entry.jsHash.slice(0, 14)}…`);
        hash.style.opacity = "0.4";
        hash.style.fontSize = "0.85em";
        row.append(hash);

        mount.append(row);
      }
    } catch {
      // dev server not running — keep polling
    }
  };

  await poll();
  setInterval(poll, 500);
};

const bootLiveView = async (mount: HTMLElement) => {
  mount.innerHTML = "";
  mount.textContent = "Connecting to dev server...";

  let lastJsHash = "";

  const poll = async () => {
    try {
      const history = await fetchHistory();
      const view = latestView(history);
      if (!view) {
        mount.innerHTML = "";
        mount.append(el("p", "No view found in compiled notes."));
        return;
      }

      if (view.jsHash === lastJsHash) return;
      lastJsHash = view.jsHash;

      // Permanent link bar
      const bar = el("div");
      bar.style.cssText = "padding:4px 8px;font-size:0.85em;opacity:0.6;";
      const permLink = document.createElement("a");
      permLink.href = `/${view.jsHash.slice(1)}`;
      permLink.textContent = `${view.filename ?? view.exportName} → ${view.jsHash.slice(0, 14)}…`;
      bar.append(permLink);

      // Render the view
      const viewFn = await callViewClient(view.jsHash as Ref, {});
      const rendered = renderDom(viewFn);

      mount.innerHTML = "";
      mount.append(bar);
      mount.append(rendered);
    } catch (err) {
      mount.innerHTML = "";
      mount.append(el("pre", `live view error: ${err}`));
    }
  };

  await poll();
  setInterval(poll, 500);
};

export const boot = async () => {
  const mount = document.getElementById("app") ?? document.body;

  const path = window.location.pathname.replace(/\/+$/, "");

  if (path === "/live/view") {
    return bootLiveView(mount);
  }

  if (path === "/live") {
    return bootLive(mount);
  }

  const ref = parseRefFromPath(window.location.pathname);
  if (!ref) {
    mount.innerHTML = "";
    mount.textContent = "Open /<note-hash> to render that note as a view.";
    return;
  }

  await renderRef(mount, ref);
};
