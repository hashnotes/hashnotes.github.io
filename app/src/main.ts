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

const LIVE_HASH_URL = "http://localhost:4321/hash";

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

const bootLive = async (mount: HTMLElement) => {
  mount.innerHTML = "";
  mount.textContent = "Connecting to live server...";

  let currentHash = "";

  const poll = async () => {
    try {
      const res = await fetch(LIVE_HASH_URL);
      const hash = (await res.text()).trim() as Ref;
      if (hash && hash !== currentHash) {
        currentHash = hash;
        await renderRef(mount, hash);
      }
    } catch {
      // live server not running yet — keep polling
    }
  };

  await poll();
  setInterval(poll, 1000);
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
