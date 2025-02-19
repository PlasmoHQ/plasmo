import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts", "src/worker.ts"],
  external: ["./worker"]
})
