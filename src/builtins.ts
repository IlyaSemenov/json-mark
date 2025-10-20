import { base64ToUint8Array, isUint8Array, uint8ArrayToBase64 } from "uint8array-extras"

import { customType } from "./customType"
import type { TypeRegistry } from "./customType"

export const builtinTypes = {
  bigint: customType<bigint>({
    test: value => typeof value === "bigint",
    stringify: value => value.toString(),
    parse: value => BigInt(value),
  }),
  Uint8Array: customType<Uint8Array>({
    test: value => isUint8Array(value),
    stringify: value => uint8ArrayToBase64(value),
    parse: value => base64ToUint8Array(value),
  }),
} satisfies TypeRegistry
