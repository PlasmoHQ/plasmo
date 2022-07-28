import { basename, extname, posix, win32 } from "path"

export const toPosix = (path: string) => path.replaceAll(win32.sep, posix.sep)

// use regex to match some.chrome.tsx or other.firefox.tsx
// returns empty string if no sub extension found
export const getSubExt = (path: string) =>
  extname(basename(path, extname(path)))
