/**
 * Copyright (c) 2022 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 *
 * Based on: https://github.com/terser/terser/blob/master/lib/output.js#L293
 * Copyright 2012 (c) Mihai Bazon <mihai.bazon@gmail.com>
 * BSD license
 */

export function toUtf8(str: string, identifier = false) {
  return str.replace(/[\u0000-\u001f\u007f-\uffff]/g, function (ch) {
    let code = ch.charCodeAt(0).toString(16)
    if (code.length <= 2 && !identifier) {
      while (code.length < 2) {
        code = "0" + code
      }
      return "\\x" + code
    } else {
      while (code.length < 4) {
        code = "0" + code
      }
      return "\\u" + code
    }
  })
}
