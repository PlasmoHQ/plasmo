import { build } from "esbuild"
import glob from "tiny-glob"

async function main() {
  const entryPoints = await glob("./src/polyfills/**/*.ts", {
    filesOnly: true
  })

  await build({
    entryPoints,

    bundle: true,
    minify: true,
    sourcemap: false,

    platform: "browser",
    format: "cjs",
    target: ["chrome74", "safari11"],

    alias: {
      stream: "stream-browserify",
      http: "stream-http"
    },

    outdir: "dist/polyfills"
  })
}

main()
