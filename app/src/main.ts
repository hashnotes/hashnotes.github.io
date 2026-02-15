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

export const boot = async () => {
  const mount = document.getElementById("app") ?? document.body;
  const ref = parseRefFromPath(window.location.pathname);
  if (!ref) {
    mount.innerHTML = "";
    mount.textContent = "Open /<note-hash> to render that note as a view.";
    return;
  }
  let note = await getNote(ref);

  try {
    const view = await callViewClient(ref, {});

    const el = renderDom(view);
    mount.innerHTML = "";
    mount.append(renderDom(u=>HTML.pre(note as string)))  
    mount.append(el);
  } catch (err) {
    mount.append(renderDom(u=>HTML.pre(`failed to render note: ${ref}\n${err}\n${tojson(note)}`)))
  }
};
