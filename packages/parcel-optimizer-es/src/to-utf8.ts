/**
 * Copyright (c) 2023 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 */

export function toUtf8(str: string) {
  return str
    .split("")
    .map((ch) =>
      ch.charCodeAt(0) <= 0x7f
        ? ch
        : "\\u" + ("0000" + ch.charCodeAt(0).toString(16)).slice(-4)
    )
    .join("")
}
