import { readFile } from "fs/promises"
import astToLiteral from "ts-ast-to-literal"
import {
  Node,
  ScriptTarget,
  SyntaxKind,
  VariableDeclaration,
  createSourceFile,
  isObjectLiteralExpression,
  isVariableStatement
} from "typescript"

import type { ManifestContentScript } from "@plasmo/constants"
import { eLog, vLog } from "@plasmo/utils"

export const extractContentScriptMetadata = async (path: string) => {
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
    // console.log(configAST)

    if (!isObjectLiteralExpression(configAST)) {
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
          output[key] = astToLiteral(
            variableDeclarationMap[valueNode.getText()]
          )
        } else {
          output[key] = astToLiteral(valueNode)
        }
      } catch (error) {
        eLog(error)
      }

      return output
    }, {} as ManifestContentScript)

    return {
      config
    }
  } catch (error) {
    vLog(error)
    return null
  }
}
