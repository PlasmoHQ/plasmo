import { build } from "esbuild"
import fse from "fs-extra"
import { argv } from "process"

const watch = argv.includes("-w")

const commonConfig = {
  watch,
  sourcemap: watch ? "inline" : false,
  minify: !watch,
  logLevel: watch ? "info" : "warning",

  bundle: true
}

async function main() {
  const config = await fse.readJson("package.json")
  const define = {
    "process.env.APP_VERSION": `"${config.version}"`,
    "process.env.DEV_MODE": watch
  }

  await build({
    ...commonConfig,
    entryPoints: ["src/index.ts"],
    external: Object.keys(config.dependencies),
    platform: "node",
    format: "esm",
    define,
    banner: {
      js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);"
    },
    outfile: "dist/index.js"
  })
}

main()
