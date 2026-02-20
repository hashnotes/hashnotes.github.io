import { build } from "esbuild";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const appDir = resolve(import.meta.dir, "..");
const rootDir = resolve(appDir, "..");
const docsDir = resolve(rootDir, "docs");
const assetsDir = resolve(docsDir, "assets");
const entry = resolve(appDir, "src/entry.ts");
const htmlTemplate = resolve(appDir, "index.html");

await rm(assetsDir, { recursive: true, force: true });
await mkdir(assetsDir, { recursive: true });

const result = await build({
  entryPoints: [entry],
  bundle: true,
  sourcemap: true,
  minify: false,
  platform: "browser",
  format: "esm",
  target: "es2022",
  outdir: assetsDir,
  entryNames: "index-[hash]",
  metafile: true,
  write: true,
});

const outJs = Object.keys(result.metafile.outputs).find(
  (p) => p.endsWith(".js") && p.includes("index-"),
);
if (!outJs) {
  console.error("No JS bundle emitted by esbuild.");
  process.exit(1);
}

const bundleName = outJs.split("/").pop()!;
const template = await readFile(htmlTemplate, "utf8");
const builtHtml = template.replace(
  /<script type="module" src="\/src\/entry\.ts"><\/script>/,
  `<script type="module" src="/assets/${bundleName}"></script>`,
);

await writeFile(resolve(docsDir, "index.html"), builtHtml, "utf8");
await writeFile(resolve(docsDir, "404.html"), builtHtml, "utf8");

console.log(`Built /docs/assets/${bundleName} (esbuild)`);
