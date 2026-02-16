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
    mount.append(renderDom(u => HTML.pre(note as string)));
    mount.append(el);
  } catch (err) {
    mount.innerHTML = "";
    mount.append(renderDom(u => HTML.pre(`failed to render note: ${ref}\n${err}\n${tojson(note)}`)));
  }
};

type HistoryEntry = { tsHash: string; jsHash: string; exportName: string };

const bootLive = async (mount: HTMLElement) => {
  mount.innerHTML = "";
  mount.textContent = "Connecting to dev server...";

  let lastJson = "";

  const el = (tag: string, text?: string): HTMLElement => {
    const e = document.createElement(tag);
    if (text) e.textContent = text;
    return e;
  };

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
          a.textContent = entry.exportName;
          row.append(a);
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
  setInterval(poll, 2000);
};

export const boot = async () => {
  const mount = document.getElementById("app") ?? document.body;

  if (window.location.pathname.replace(/\/+$/, "") === "/live") {
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
