import { pascalCase } from "change-case"
import { ensureDir } from "fs-extra"
import { writeFile } from "fs/promises"
import { resolve } from "path"

import { vLog } from "@plasmo/utils"

export const generateIndexTsx = ({
  renderModule = "popup",
  rootId = "root"
}) => {
  const importName = pascalCase(renderModule)

  return `import { createRoot } from "react-dom/client"
import ${importName} from "~${renderModule}"

const root = createRoot(document.getElementById("${rootId}"))
root.render(<${importName} />)
`
}

const basicStyle = `<style>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap");

html,
body {
  font-family: Inter, sans-serif;
  font-size: 14px;
  line-height: 1.4;
  margin: 0;
  padding: 0;
}
</style>
`

export const generateIndexHtml = ({
  title = "Plasmo Extension",
  globalStyle = basicStyle
}) => `<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
    <meta charset="utf-8" />
    ${globalStyle}
  </head>

  <body>
    <div id="root"></div>
    <script src="./index.tsx" type="module"></script>
  </body>
</html>
`

export async function createTemplateFiles(
  moduleFile: string,
  staticDirectory: string,
  title: string
) {
  vLog(
    `${moduleFile}.tsx or an ${moduleFile} directory found, creating statics options`
  )

  const staticOptionsDirectory = resolve(staticDirectory, moduleFile)
  // Generate the static diretory
  await ensureDir(staticOptionsDirectory)

  return Promise.all([
    writeFile(
      resolve(staticOptionsDirectory, "index.html"),
      generateIndexHtml({ title })
    ),
    writeFile(
      resolve(staticOptionsDirectory, "index.tsx"),
      generateIndexTsx({ renderModule: moduleFile })
    )
  ])
}
