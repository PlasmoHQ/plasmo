import { state } from "./state"

export const normalizeManifest = () => {
  const { program } = state
  delete program.$schema
}
