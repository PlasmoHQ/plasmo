import { copy, writeJson } from "fs-extra"
import { writeFile } from "fs/promises"
import { resolve } from "path"

import { hasFlag, iLog } from "@plasmo/utils"

import { generateGitIgnore } from "~features/extension-devtools/git-ignore"
import {
  PackageJSON,
  generatePackage
} from "~features/extension-devtools/package-file"
import { getTemplatePath } from "~features/extension-devtools/template-path"
import type { PackageManagerInfo } from "~features/helpers/package-manager"

import type { CommonPath } from "./common-path"

export const createBlankProject = async (
  { projectDirectory, packageName, packageFilePath, gitIgnorePath }: CommonPath,
  { packageManager = null as PackageManagerInfo, isExample = false }
) => {
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

  await writeJson(packageFilePath, packageData, {
    spaces: 2
  })

  iLog(`Copying template files...`)

  const { initTemplatePath, bppYaml } = getTemplatePath()

  const bppSubmitWorkflowYamlPath = resolve(
    projectDirectory,
    ".github",
    "workflows",
    "submit.yml"
  )

  await Promise.all([
    copy(initTemplatePath, projectDirectory),
    !hasFlag("--no-bpp") &&
      !isExample &&
      copy(bppYaml, bppSubmitWorkflowYamlPath),
    writeFile(gitIgnorePath, generateGitIgnore())
  ])
}
