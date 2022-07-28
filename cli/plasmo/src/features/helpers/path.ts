import { posix, win32 } from "path"

export const toPosix = (path: string) => path.replaceAll(win32.sep, posix.sep)
