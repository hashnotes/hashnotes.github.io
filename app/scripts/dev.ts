import { context } from "esbuild";
import { extname, resolve } from "node:path";

const appDir = resolve(import.meta.dir, "..");
const devOutDir = resolve(appDir, ".dev-build");
const devAsset = resolve(devOutDir, "assets/app.js");
const entry = resolve(appDir, "src/entry.ts");
const port = Number(Bun.env.PORT || 5173);

const mime: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".map": "application/json; charset=utf-8",
};

const ctx = await context({
  entryPoints: [entry],
  bundle: true,
  sourcemap: "inline",
  minify: false,
  platform: "browser",
  format: "esm",
  target: "es2022",
  outfile: devAsset,
});

await ctx.watch();
await ctx.rebuild();

const indexHtml = async (): Promise<Response> => {
  const template = await Bun.file(resolve(appDir, "index.html")).text();
  const html = template.replace(
    /<script type="module" src="\/src\/entry\.ts"><\/script>/,
    `<script type="module" src="/assets/app.js"></script>`,
  );
  return new Response(html, {
    headers: {
      "content-type": mime[".html"],
      "cache-control": "no-store",
    },
  });
};

Bun.serve({
  port,
  fetch: async (req) => {
    const url = new URL(req.url);
    const pathname = url.pathname;

    if (!extname(pathname)) return indexHtml();

    if (pathname === "/assets/app.js") {
      return new Response(Bun.file(devAsset), {
        headers: {
          "content-type": mime[".js"],
          "cache-control": "no-store",
        },
      });
    }

    const localPath = resolve(appDir, "." + pathname);
    if (!localPath.startsWith(appDir)) return new Response("Forbidden", { status: 403 });
    const file = Bun.file(localPath);
    if (await file.exists()) {
      const ext = extname(pathname);
      return new Response(file, {
        headers: {
          "content-type": mime[ext] || file.type || "application/octet-stream",
        },
      });
    }
    return new Response("Not found", { status: 404 });
  },
});

console.log(`App dev server on http://localhost:${port} (esbuild + Bun.serve)`);
