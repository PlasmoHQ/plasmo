import NodeResolver from '@parcel/node-resolver-core';
import type { PackageJSON } from "@parcel/types"

export type InlinefuncResolverConfig = {
    resolver: NodeResolver,
    config?: InlinefuncPackageJSONConfig
}

export type PlasmoPackageJSONConfig = {
    plasmo?: {
        inlinefunc?: InlinefuncPackageJSONConfig
    }
}

export type InlinefuncPackageJSONConfig = {
    esbuild: {
        config: string
    }
}

export type PlasmoExtendedPackageJSON = PackageJSON & PlasmoPackageJSONConfig
