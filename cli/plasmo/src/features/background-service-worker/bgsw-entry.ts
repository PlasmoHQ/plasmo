import { ensureDir } from "fs-extra"
import { writeFile } from "fs/promises"
import { relative, resolve } from "path"

import { toPosix } from "~features/helpers/path"
import type { BaseFactory } from "~features/manifest-factory/base"

export const createBgswEntry = async (
  { indexFilePath = "", withMessaging = false },
  plasmoManifest: BaseFactory
) => {
  const bgswStaticDirectory = resolve(
    plasmoManifest.commonPath.staticDirectory,
    "background"
  )

  const bgswEntryFilePath = resolve(bgswStaticDirectory, "index.ts")
  const indexImportPath = relative(bgswStaticDirectory, indexFilePath)

  const bgswCode = [
    withMessaging && `import "./messaging"`,
    indexFilePath && `import "${toPosix(indexImportPath).slice(0, -3)}"`
  ]
    .filter(Boolean)
    .join("\n")

  await ensureDir(bgswStaticDirectory)
  await writeFile(bgswEntryFilePath, bgswCode)
}
