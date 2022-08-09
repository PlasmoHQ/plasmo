import parseCSP from "content-security-policy-parser"

export function cspPatchHMR(
  policy: string | null | undefined,
  insert?: string
) {
  let defaultSrc = "'self'"

  if (insert == null) {
    insert = "'unsafe-eval'"
    defaultSrc = "'self' blob: filesystem:"
  }

  if (policy) {
    const csp = parseCSP(policy)
    policy = ""

    if (!csp["script-src"]) {
      csp["script-src"] = [defaultSrc]
    }

    if (!csp["script-src"].includes(insert)) {
      csp["script-src"].push(insert)
    }

    if (csp.sandbox && !csp.sandbox.includes("allow-scripts")) {
      csp.sandbox.push("allow-scripts")
    }

    for (const k in csp) {
      policy += `${k} ${csp[k].join(" ")};`
    }

    return policy
  } else {
    return `script-src ${defaultSrc} ${insert};` + `object-src ${defaultSrc};`
  }
}
