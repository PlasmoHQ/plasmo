import spawnAsync from "@expo/spawn-async"
import { sentenceCase } from "change-case"
import { existsSync } from "fs"
import { copy, outputJson, readJson } from "fs-extra"
import { lstat, readFile, writeFile } from "fs/promises"
import ignore from "ignore"
import { userInfo } from "os"
import { isAbsolute, join, relative, resolve } from "path"
import { temporaryDirectory } from "tempy"

import { getFlag, hasFlag } from "@plasmo/utils/flags"
import { isFileOk } from "@plasmo/utils/fs"
import { iLog, vLog } from "@plasmo/utils/logging"

import type { CommonPath } from "~features/extension-devtools/common-path"
import { generateGitIgnore } from "~features/extension-devtools/git-ignore"
import {
  PackageJSON,
  generatePackage,
  resolveWorkspaceToLatestSemver
} from "~features/extension-devtools/package-file"
import { getTemplatePath } from "~features/extension-devtools/template-path"
import type { PackageManagerInfo } from "~features/helpers/package-manager"

import {
  generatePackageFromManifest,
  getManifestData
} from "./from-existing-manifest"

const withRegex = /(?:^--with-)(?:\w+-?)+(?:[^-]$)/

export class ProjectCreator {
  templatePath = getTemplatePath()

  constructor(
    public commonPath: CommonPath,
    public packageManager: PackageManagerInfo,
    public isExample = false
  ) {}

  async create() {
    return (
      (await this.createFrom()) ||
      (await this.createWith()) ||
      (await this.createBlank())
    )
  }

  async createFrom() {
    const fromPath = getFlag("--from")

    if (!fromPath) {
      return false
    }

    const absFromPath = isAbsolute(fromPath) ? fromPath : resolve(fromPath)
    try {
      const fromStats = await lstat(absFromPath)
      if (fromStats.isFile()) {
        return await this.createFromManifest(absFromPath)
      } else if (fromStats.isDirectory()) {
        return await this.createFromLocalTemplate(absFromPath)
      } else {
        return false
      }
    } catch {
      return false
    }
  }

  async createFromLocalTemplate(absFromPath: string) {
    const ig = ignore().add(["node_modules", ".git", ".env*"])

    const gitIgnorePath = join(absFromPath, ".gitignore")
    const hasGitIgnore = await isFileOk(gitIgnorePath)

    if (hasGitIgnore) {
      const gitIgnoreData = await readFile(gitIgnorePath, "utf-8")
      ig.add(gitIgnoreData)
    }

    await copy(absFromPath, this.commonPath.projectDirectory, {
      filter: (src) =>
        src === absFromPath || !ig.ignores(relative(absFromPath, src))
    })

    return true
  }

  async createFromManifest(absFromPath: string) {
    const existingData = await getManifestData(absFromPath)
    if (existingData === null) {
      return false
    }

    await this.copyBlankInitFiles()

    const packageData = await generatePackageFromManifest(
      this.commonPath,
      this.packageManager,
      existingData
    )

    await outputJson(this.commonPath.packageFilePath, packageData, {
      spaces: 2
    })

    return true
  }

  async createWith() {
    const withExampleName = process.argv.find((arg) => withRegex.test(arg))
    if (withExampleName === undefined) {
      return false
    }

    return this.createWithExample(withExampleName.substring(2))
  }

  async createWithExample(exampleName: string) {
    iLog(`Creating new project ${exampleName.split("-").join(" ")}`)

    const { packageName, packageFilePath } = this.commonPath

    // locate the tmp directory
    const tempDirectory = temporaryDirectory()
    vLog(`Download examples to temporary directory: ${tempDirectory}`)

    try {
      // download the examples
      await spawnAsync(
        "git",
        [
          "clone",
          "--depth",
          "1",
          "https://github.com/PlasmoHQ/examples.git",
          "."
        ],
        { cwd: tempDirectory, ignoreStdio: true }
      )
    } catch (error: any) {
      if (error.errno === "ENOENT") {
        throw new Error("Unable to clone example repo. `git` is not in PATH.")
      }
    }

    const exampleDirectory = resolve(tempDirectory, exampleName)

    if (!existsSync(exampleDirectory)) {
      throw new Error(
        `Example ${exampleName} not found. You may file an example request at: https://docs.plasmo.com/exp`
      )
    }

    vLog("Copy example to project directory")
    await Promise.all([
      copy(exampleDirectory, this.commonPath.projectDirectory),
      !this.isExample && this.copyBppWorkflow()
    ])

    const packageData = (await readJson(packageFilePath)) as PackageJSON

    if (!this.isExample) {
      delete packageData.contributors
      packageData.author = userInfo().username
      packageData.name = packageName
      packageData.displayName = sentenceCase(packageName)

      vLog(
        "Replace workspace refs with the latest package version from npm registry"
      )

      await Promise.all([
        (packageData.dependencies = await resolveWorkspaceToLatestSemver(
          packageData.dependencies
        )),
        (packageData.devDependencies = await resolveWorkspaceToLatestSemver(
          packageData.devDependencies
        ))
      ])
    }

    await outputJson(packageFilePath, packageData, {
      spaces: 2
    })
    return true
  }

  async createBlank() {
    iLog("Creating new blank project")
    const { packageManager, isExample } = this
    const { packageName, packageFilePath } = this.commonPath

    const packageData = generatePackage({
      name: packageName,
      packageManager
    }) as PackageJSON

    if (isExample) {
      packageData.dependencies["plasmo"] = "workspace:*"
      packageData.devDependencies["@plasmohq/prettier-plugin-sort-imports"] =
        "workspace:*"
      packageData.contributors = [packageData.author]
      packageData.author = "Plasmo Corp. <foss@plasmo.com>"

      delete packageData.packageManager
    }

    iLog(`Copying template files...`)
    await Promise.all([
      outputJson(packageFilePath, packageData, {
        spaces: 2
      }),
      this.copyBlankInitFiles()
    ])

    return true
  }

  async copyBlankInitFiles() {
    const entry = getFlag("--entry") || "popup"

    const entryFiles = entry
      .split(new RegExp(",|\\s"))
      .flatMap((e) => [`${e}.ts`, `${e}.tsx`])
      .map((e) => [
        resolve(this.templatePath.initEntryPath, e),
        resolve(this.commonPath.projectDirectory, e)
      ])
      .filter(([entryPath]) => existsSync(entryPath))

    vLog("Using the following entry files: ", entryFiles)

    await Promise.all([
      copy(
        this.templatePath.initTemplatePath,
        this.commonPath.projectDirectory
      ),
      !this.isExample && this.copyBppWorkflow(),
      writeFile(this.commonPath.gitIgnorePath, generateGitIgnore())
    ])

    await Promise.all(entryFiles.map(([src, dest]) => copy(src, dest)))
  }

  async copyBppWorkflow() {
    if (hasFlag("--no-bpp")) {
      return
    }

    iLog(`Copying BPP workflow...`)
    const bppSubmitWorkflowYamlPath = resolve(
      this.commonPath.projectDirectory,
      ".github",
      "workflows",
      "submit.yml"
    )

    return copy(this.templatePath.bppYaml, bppSubmitWorkflowYamlPath)
  }
}
