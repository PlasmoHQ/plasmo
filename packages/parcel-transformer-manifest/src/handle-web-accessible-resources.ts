import { getJSONSourceLocation } from "@parcel/diagnostic"
import { glob } from "@parcel/utils"
import path from "path"

import type { MV2Data, MV3Data } from "./schema"
import { checkMV2, state } from "./state"

const getWARGlobURLDependency = async (
  files: string[],
  i = 0,
  isMV2 = false
) => {
  const { assetDir, fs, filePath, asset, ptrs } = state
  const globFiles = await Promise.all(
    files.map(
      async (file, fileIndex) =>
        [
          (await glob(path.join(assetDir, file), fs, {})) as string[],
          fileIndex
        ] as const
    )
  )

  return globFiles
    .map(([files, fileIndex]) =>
      files.map((file) =>
        asset.addURLDependency(path.relative(assetDir, file), {
          pipeline: "raw",
          bundleBehavior: "isolated",
          needsStableName: true,
          loc: {
            filePath,
            ...getJSONSourceLocation(
              ptrs[
                `/web_accessible_resources/${i}${
                  isMV2 ? "" : `/resources/${fileIndex}`
                }`
              ]
            )
          }
        })
      )
    )
    .flat()
}

const getWARMV2 = (program: MV2Data) =>
  Promise.all(
    program.web_accessible_resources.map(async (entry, i) =>
      getWARGlobURLDependency([entry], i, true)
    )
  ).then((nested) => nested.flat())

const getWARMV3 = (program: MV3Data) =>
  Promise.all(
    program.web_accessible_resources.map(async (entry, i) => {
      entry.resources = await getWARGlobURLDependency(entry.resources, i)
      return entry
    })
  ).then((nested) => nested.flat())

export const handleWebAccessibleResources = async () => {
  const { program } = state

  if (!program.web_accessible_resources) {
    return
  }

  const isMV2 = checkMV2(program)

  program.web_accessible_resources = isMV2
    ? await getWARMV2(program)
    : await getWARMV3(program)
}
