import { argv, exit } from "process"
import { build, context } from "esbuild"
import fse from "fs-extra"

const watch = argv.includes("-w")

/** @type import('esbuild').BuildOptions */
const commonConfig = {
  sourcemap: watch ? "inline" : false,
  minify: !watch,
  logLevel: watch ? "info" : "warning",

  bundle: true
}

async function main() {
  const config = await fse.readJson("package.json")
  const define = {
    "process.env.APP_VERSION": `"${config.version}"`
  }

  /** @type import('esbuild').BuildOptions */
  const opts = {
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
  }

  if (watch) {
    const ctx = await context(opts)
    await ctx.watch()
  } else {
    await build(opts)
  }
}

main()

process.on("SIGINT", () => exit(0))
process.on("SIGTERM", () => exit(0))
