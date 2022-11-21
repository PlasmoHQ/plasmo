import { getState } from "./state"

export const normalizeManifest = () => {
  const { program } = getState()
  delete program.$schema
}
