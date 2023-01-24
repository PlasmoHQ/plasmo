import { build } from "esbuild"
import glob from "fast-glob"

const commonConfig = {
  bundle: true,
  minify: true,

  platform: "browser",
  format: "cjs",
  target: ["chrome74", "safari11"],
  outdir: "dist/polyfills"
}

async function buildProdPolyfills() {
  const prodPolyfills = await glob("./src/polyfills/**/*.ts", {
    onlyFiles: true
  })

  await build({
    ...commonConfig,
    entryPoints: prodPolyfills,
    alias: {
      stream: "stream-browserify",
      http: "stream-http"
    }
  })
}

async function buildDevPolyfills() {
  const devPolyfills = await glob("./src/dev-polyfills/**/*.ts", {
    onlyFiles: true
  })

  await build({
    ...commonConfig,
    entryPoints: devPolyfills,
    define: {
      "process.env.NODE_ENV": "'development'"
    }
  })
}

async function main() {
  await Promise.all([buildProdPolyfills(), buildDevPolyfills()])
}

main()
