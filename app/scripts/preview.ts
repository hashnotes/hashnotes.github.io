import { extname, resolve } from "node:path";

const rootDir = resolve(import.meta.dir, "../..");
const docsDir = resolve(rootDir, "docs");
const port = Number(Bun.env.PORT || 4173);

const mime: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".map": "application/json; charset=utf-8",
};

Bun.serve({
  port,
  fetch: async (req) => {
    const url = new URL(req.url);
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = resolve(docsDir, "." + pathname);
    if (!filePath.startsWith(docsDir)) return new Response("Forbidden", { status: 403 });

    const file = Bun.file(filePath);
    if (await file.exists()) {
      const ext = extname(filePath);
      return new Response(file, {
        headers: { "content-type": mime[ext] || file.type || "application/octet-stream" },
      });
    }

    const fallback = Bun.file(resolve(docsDir, "index.html"));
    if (await fallback.exists()) {
      return new Response(fallback, {
        headers: { "content-type": mime[".html"] },
      });
    }
    return new Response("Not found", { status: 404 });
  },
});

console.log(`Preview server on http://localhost:${port}`);
