import { readdir, readFile, rename, stat, writeFile } from "fs/promises"
import { join, resolve } from "path"

const stripFileUnderscore = async (filePath: string) => {
  const fileContents = await readFile(resolve(filePath), "utf8")
  const newFileContents = fileContents.replace(/\/_/g, "/")
  await writeFile(filePath, newFileContents, "utf8")
}

export const stripUnderscore = async (dir = "") => {
  const entries = await readdir(dir)

  for (const entry of entries) {
    const entryPath = join(dir, entry)
    const entryStat = await stat(entryPath)
    if (entryStat.isDirectory()) {
      const newPath = entryPath.replace("/_", "/")
      await rename(entryPath, newPath)
      await stripUnderscore(newPath)
    } else {
      const newPath = entryPath.replace("/_", "/")
      await rename(entryPath, newPath)
      await stripFileUnderscore(newPath)
    }
  }
}
