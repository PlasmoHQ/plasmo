import spawnAsync from "@expo/spawn-async"
import { sentenceCase } from "change-case"
import { existsSync } from "fs"
import { copy, outputJson, readJson } from "fs-extra"
import { lstat, readFile, writeFile } from "fs/promises"
import ignore from "ignore"
import { isAbsolute, join, relative, resolve } from "path"
import { temporaryDirectory } from "tempy"

import { getFlag, hasFlag } from "@plasmo/utils/flags"
import { isAccessible } from "@plasmo/utils/fs"
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
import { quickPrompt } from "~features/helpers/prompt"

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
    const fromStats = await lstat(absFromPath)

    if (fromStats.isFile()) {
      return await this.createFromManifest(absFromPath)
    } else if (fromStats.isDirectory()) {
      return await this.createFromLocalTemplate(absFromPath)
    } else {
      return false
    }
  }

  async createFromLocalTemplate(absFromPath: string) {
    const ig = ignore().add(["node_modules", ".git", ".env*"])

    const gitIgnorePath = join(absFromPath, ".gitignore")
    const hasGitIgnore = await isAccessible(gitIgnorePath)

    if (hasGitIgnore) {
      const gitIgnoreData = await readFile(gitIgnorePath, "utf-8")
      ig.add(gitIgnoreData)
    }

    await copy(absFromPath, this.commonPath.projectDirectory, {
      filter: (src) =>
        src === absFromPath || !ig.ignores(relative(absFromPath, src))
    })

    const packageData = await readJson(this.commonPath.packageFilePath)

    await this.outputPackageData(packageData)

    iLog(`Creating new project from ${absFromPath}`)
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

    await this.outputPackageData(packageData, { resolveWorkspaceRefs: true })

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
      this.copyBppWorkflow()
    ])

    const packageData = await readJson(this.commonPath.packageFilePath)
    await this.outputPackageData(packageData, { resolveWorkspaceRefs: true })

    iLog(`Creating new project ${exampleName.split("-").join(" ")}`)
    return true
  }

  async createBlank() {
    const packageData = await generatePackage({
      name: this.commonPath.packageName,
      packageManager: this.isExample ? undefined : this.packageManager
    })

    vLog(`Copying template files...`)
    await Promise.all([
      this.outputPackageData(packageData, { resolveWorkspaceRefs: true }),
      this.copyBlankInitFiles()
    ])

    iLog("Creating new blank project")
    return true
  }

  private async outputPackageData(
    packageData: PackageJSON,
    { resolveWorkspaceRefs = false } = {}
  ) {
    const { packageName, packageFilePath } = this.commonPath

    packageData.name = packageName
    packageData.displayName = sentenceCase(packageName)

    packageData.description = await quickPrompt(
      "Extension description:",
      packageData.description
    )

    if (this.isExample) {
      delete packageData.packageManager
      packageData.contributors = [
        await quickPrompt("Contributor name:", packageData.author)
      ]
      packageData.author = "Plasmo Corp. <foss@plasmo.com>"
    } else {
      delete packageData.contributors
      packageData.author = await quickPrompt("Auhor name:", packageData.author)

      if (resolveWorkspaceRefs) {
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
    }

    await outputJson(packageFilePath, packageData, {
      spaces: 2
    })
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
      this.copyBppWorkflow(),
      writeFile(this.commonPath.gitIgnorePath, generateGitIgnore())
    ])

    await Promise.all(entryFiles.map(([src, dest]) => copy(src, dest)))
  }

  async copyBppWorkflow() {
    if (this.isExample || hasFlag("--no-bpp")) {
      return
    }

    vLog(`Copying BPP workflow...`)
    const bppSubmitWorkflowYamlPath = resolve(
      this.commonPath.projectDirectory,
      ".github",
      "workflows",
      "submit.yml"
    )

    return copy(this.templatePath.bppYaml, bppSubmitWorkflowYamlPath)
  }
}
