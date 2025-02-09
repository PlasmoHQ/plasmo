import { Fragment, type FC, type ReactNode } from "react"

export const getLayout = (RawImport: any): FC<{ children: ReactNode }> =>
  typeof RawImport.Layout === "function"
    ? RawImport.Layout
    : typeof RawImport.getGlobalProvider === "function"
    ? RawImport.getGlobalProvider()
    : Fragment
