import { getJSONSourceLocation } from "@parcel/diagnostic"

import { state } from "./state"

export async function handleDeclarativeNetRequest() {
  const { program, filePath, ptrs, asset } = state

  if (!program.declarative_net_request) {
    return
  }

  const rrs = program.declarative_net_request.rule_resources

  if (!rrs) {
    return
  }

  program.declarative_net_request.rule_resources = rrs.map((resources, i) => {
    resources.path = asset.addURLDependency(resources.path, {
      pipeline: "raw-env",
      loc: {
        filePath,
        ...getJSONSourceLocation(
          ptrs[`/declarative_net_request/rule_resources/${i}/path`],
          "value"
        )
      }
    })

    return resources
  })
}
