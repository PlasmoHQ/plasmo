import { createHash } from "crypto"

/**
 * Fast hash for local file revving
 * DO NOT USE FOR SENSITIVE PURPOSES
 * md5 is good enough for file-revving: https://github.com/sindresorhus/rev-hash
 */
export const getMd5RevHash = (buff: Buffer) =>
  createHash("md5").update(buff).digest("hex").slice(0, 18)
