import { base64ToUint8Array, isUint8Array, uint8ArrayToBase64 } from "uint8array-extras"

import { customType } from "./customType"
import type { TypeRegistry } from "./customType"
import { JSONMark } from "./JSONMark"

export const builtinTypes = {
  "\uEE01": customType<bigint>({
    test: value => typeof value === "bigint",
    stringify: value => value.toString(),
    parse: value => BigInt(value),
  }),
  "\uEE02": customType<Uint8Array>({
    test: value => isUint8Array(value),
    stringify: value => uint8ArrayToBase64(value),
    parse: value => base64ToUint8Array(value),
  }),
} satisfies TypeRegistry

export const JSON = new JSONMark(builtinTypes)

export const { stringify, parse, prepare, restore } = JSON
