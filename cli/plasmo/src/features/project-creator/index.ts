import spawnAsync from "@expo/spawn-async"
import { sentenceCase } from "change-case"
import { existsSync } from "fs"
import { copy, readJson, writeJson } from "fs-extra"
import { writeFile } from "fs/promises"
import { userInfo } from "os"
import { resolve } from "path"
import { temporaryDirectory } from "tempy"

import { getFlag, hasFlag, iLog, vLog } from "@plasmo/utils"

import type { CommonPath } from "~features/extension-devtools/common-path"
import { generateGitIgnore } from "~features/extension-devtools/git-ignore"
import {
  PackageJSON,
  generatePackage,
  resolveWorkspaceToLatestSemver
} from "~features/extension-devtools/package-file"
import {
  TemplatePath,
  getTemplatePath
} from "~features/extension-devtools/template-path"
import type { PackageManagerInfo } from "~features/helpers/package-manager"

import {
  generatePackageFromManifest,
  getExistingManifest
} from "./from-existing-manifest"

const withRegex = /(?:^--with-)(?:\w+-?)+(?:[^-]$)/

export class ProjectCreator {
  commonPath: CommonPath
  templatePath: TemplatePath
  packageManager: PackageManagerInfo
  isExample = false

  constructor(
    _commonPath: CommonPath,
    _packageManager: PackageManagerInfo,
    _isExample = false
  ) {
    this.commonPath = _commonPath
    this.packageManager = _packageManager
    this.isExample = _isExample

    this.templatePath = getTemplatePath()
  }

  async create() {
    return (
      (await this.createFromManifest()) ||
      (await this.createWithExample()) ||
      (await this.createBlank())
    )
  }

  async createFromManifest() {
    const existingData = await getExistingManifest()

    if (existingData === null) {
      return false
    }

    await this.copyBlankInitFiles()

    const packageData = await generatePackageFromManifest(
      this.commonPath,
      this.packageManager,
      existingData
    )

    await writeJson(this.commonPath.packageFilePath, packageData, {
      spaces: 2
    })

    return true
  }

  async createWithExample() {
    const withExampleName = process.argv.find((arg) => withRegex.test(arg))
    if (withExampleName === undefined) {
      return false
    }

    return this.createWith(withExampleName.substring(2))
  }

  async createWith(exampleName: string) {
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

    await writeJson(packageFilePath, packageData, {
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
      writeJson(packageFilePath, packageData, {
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
