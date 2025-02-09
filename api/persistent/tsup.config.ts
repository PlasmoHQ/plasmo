import { defineConfig } from "tsup"

export default defineConfig((opt) => {
  const isProd = !opt.watch
  return {
    entry: ["src/index.ts", "src/background.ts"],

    format: ["esm", "cjs"],

    target: "esnext",
    platform: "node",
    splitting: false,
    bundle: true,
    dts: true,

    watch: opt.watch,
    sourcemap: !isProd,
    minify: isProd,
    clean: isProd
  }
})
