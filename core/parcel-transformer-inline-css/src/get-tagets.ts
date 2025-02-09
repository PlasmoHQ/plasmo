/**
 * Copyright (c) 2023 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 *
 * Based on: https://github.com/parcel-bundler/parcel/blob/7023c08b7e99a9b8fd3c04995e4ef7ca92dee5c1/packages/transformers/css/src/CSSTransformer.js
 * MIT License
 */

import browserslist from "browserslist"
import { browserslistToTargets } from "lightningcss"

let cache = new Map()

export function getTargets(browsers) {
  if (browsers == null) {
    return undefined
  }

  let cached = cache.get(browsers)
  if (cached != null) {
    return cached
  }

  let targets = browserslistToTargets(browserslist(browsers))

  cache.set(browsers, targets)
  return targets
}
