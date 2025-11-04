import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/main.ts"],
  format: ["esm"],
  platform: "node",
  target: "node20",
  outDir: "dist",
  splitting: false,
  sourcemap: true,
  dts: false,
  shims: true,
  clean: true,
  minify: true,
  outExtension() {
    return { js: ".js" };
  },
});
