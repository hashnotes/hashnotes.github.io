import { callViewClient, renderDom } from "@hashnotes/lib";
import { isRef, type Ref } from "@hashnotes/core/notes";
import { getServer } from "../../lib/src/db";

const parseRefFromPath = (pathname: string): Ref | null => {
  const segment = pathname.replace(/^\/+/, "").split("/")[0];
  if (!segment) return null;

  const decoded = decodeURIComponent(segment).trim();
  if (!decoded) return null;

  if (isRef(decoded)) return decoded;
  if (/^[a-f0-9]{32}$/i.test(decoded)) return `#${decoded}`;
  return null;
};

export const boot = async () => {
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
