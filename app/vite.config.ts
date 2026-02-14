import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "../docs",
    emptyOutDir: true,
    minify: false,
    sourcemap: true,
  },
});
