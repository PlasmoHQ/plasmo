import inquirer from "inquirer"

export const quickPrompt = async (label = "", defaultValue = "") => {
  const { data } = await inquirer.prompt({
    name: "data",
    prefix: "🟡",
    message: label,
    default: defaultValue
  })

  return data as string
}
