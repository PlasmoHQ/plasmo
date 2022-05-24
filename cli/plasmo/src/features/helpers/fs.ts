import { constants } from "fs"
import { access, readdir } from "fs/promises"

import { vLog } from "@plasmo/utils"

async function canAccessWithProperty(path: string, property: number) {
  try {
    await access(path, property)
    return true
  } catch (err) {
    return false
  }
}

export async function isWriteable(directory: string) {
  return canAccessWithProperty(directory, constants.W_OK)
}

export async function fileExists(path: string) {
  return canAccessWithProperty(path, constants.F_OK)
}

const validFileSet = new Set([
  ".DS_Store",
  ".git",
  ".gitattributes",
  ".gitignore",
  ".gitlab-ci.yml",
  ".hg",
  ".hgcheck",
  ".hgignore",
  ".idea",
  ".npmignore",
  ".travis.yml",
  "LICENSE",
  "Thumbs.db",
  "docs",
  "mkdocs.yml",
  "npm-debug.log",
  "yarn-debug.log",
  "yarn-error.log",
  ".pnpm-debug.log"
])

export async function isFolderEmpty(root: string) {
  const conflicts = (await readdir(root, { withFileTypes: true }))
    .filter((dirData) => !validFileSet.has(dirData.name))
    // Support IntelliJ IDEA-based editors
    .filter((dirData) => !/\.iml$/.test(dirData.name))

  if (conflicts.length > 0) {
    vLog(`Found conflicting contents in ${root}`)

    const data = conflicts.reduce(
      (result, dirent) =>
        `${result}\n\t${dirent.name}${dirent.isDirectory() ? "/" : ""}`,
      ""
    )

    vLog(data)

    return false
  }

  return true
}
