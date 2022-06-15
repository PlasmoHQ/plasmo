import { resolve } from "path"

export const getTemplatePath = () => {
  const templatePath = resolve(__dirname, "..", "templates")

  const initTemplatePath = resolve(templatePath, "init")
  const staticTemplatePath = resolve(templatePath, "static")

  const bppYaml = resolve(templatePath, "bpp.yml")

  return {
    templatePath,
    initTemplatePath,
    staticTemplatePath,
    bppYaml
  }
}

export type TemplatePath = ReturnType<typeof getTemplatePath>
