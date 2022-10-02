import { readFile } from "fs/promises"
import type { Node, VariableDeclaration } from "typescript"
import typescript from "typescript"

import type { ManifestContentScript } from "@plasmo/constants"
import { eLog, vLog } from "@plasmo/utils"

import { parseAst } from "./parse-ast"

const {
  ScriptTarget,
  SyntaxKind,
  createSourceFile,
  isObjectLiteralExpression,
  isVariableStatement
} = typescript

export const extractContentScriptConfig = async (path: string) => {
  try {
    const sourceContent = await readFile(path, "utf8")

    const sourceFile = createSourceFile(
      path,
      sourceContent,
      ScriptTarget.Latest,
      true
    )

    const variableDeclarationMap = sourceFile.statements
      .filter(isVariableStatement)
      .reduce((output, node) => {
        node.declarationList.forEachChild((vd: VariableDeclaration) => {
          output[vd.name.getText()] = vd.initializer
        })

        return output
      }, {} as Record<string, Node>)

    const configAST = variableDeclarationMap["config"]

    if (!configAST || !isObjectLiteralExpression(configAST)) {
      return null
    }

    const config = configAST.properties.reduce((output, node) => {
      if (node.getChildCount() < 3) {
        return output
      }

      const [keyNode, _, valueNode] = node.getChildren()

      const key = keyNode.getText()

      try {
        if (valueNode.kind === SyntaxKind.Identifier) {
          output[key] = parseAst(variableDeclarationMap[valueNode.getText()])
        } else {
          output[key] = parseAst(valueNode)
        }
      } catch (error) {
        eLog(error)
      }

      return output
    }, {} as ManifestContentScript)

    vLog("Parsed config:", config)

    return {
      config
    }
  } catch (error) {
    vLog(error)
    return null
  }
}
