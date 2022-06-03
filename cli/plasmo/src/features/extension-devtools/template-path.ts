import { resolve } from "path"

export const getTemplatePath = () => {
  const templatePath = resolve(__dirname, "..", "templates")

  const initTemplatePath = resolve(templatePath, "init")
  const staticTemplatePath = resolve(templatePath, "static")

  const bppYaml = resolve(templatePath, "bpp.yml")
  const parcelConfig = resolve(templatePath, "parcel-config.json")

  return {
    templatePath,
    initTemplatePath,
    staticTemplatePath,
    bppYaml,
    parcelConfig
  }
}

export type TemplatePath = ReturnType<typeof getTemplatePath>
