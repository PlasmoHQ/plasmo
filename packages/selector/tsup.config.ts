import { defineConfig } from "tsup"

export default defineConfig((opt) => {
  const isProd = !opt.watch
  return {
    entry: [
      "src/index.ts",
      "src/monitor.ts",
      "src/background.ts",
      "src/hook.ts"
    ],

    format: ["esm", "cjs"],

    target: "esnext",
    platform: "node",
    splitting: false,
    bundle: true,
    dts: true,

    env: {
      ITERO_MONITOR_API_BASE_URI: isProd
        ? "https://itero.plasmo.com"
        : "http://localhost:3000"
    },

    watch: opt.watch,
    sourcemap: !isProd,
    minify: isProd,
    clean: isProd
  }
})
