import { dirname, resolve } from "path"
import { fileURLToPath } from "url"

export const getTemplatePath = () => {
  const packagePath = dirname(fileURLToPath(import.meta.url))

  const templatePath = resolve(packagePath, "..", "templates")
  const staticTemplatePath = resolve(templatePath, "static")

  const initTemplatePackagePath = resolve(
    require.resolve("@plasmohq/init"),
    ".."
  )

  const initTemplatePath = resolve(initTemplatePackagePath, "templates")
  const initEntryPath = resolve(initTemplatePackagePath, "entries")
  const bppYaml = resolve(initTemplatePackagePath, "bpp.yml")

  return {
    templatePath,
    initTemplatePath,
    initEntryPath,
    staticTemplatePath,
    bppYaml
  }
}

export type TemplatePath = ReturnType<typeof getTemplatePath>
