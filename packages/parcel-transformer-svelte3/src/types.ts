/**
 * Copyright (c) 2022 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 */
import type { Transformer } from "@parcel/plugin"

type Transform = ConstructorParameters<typeof Transformer>[0]["transform"]

export type MutableAsset = Parameters<Transform>[0]["asset"]
export type Options = Parameters<Transform>[0]["options"]
