import { base64ToUint8Array, isUint8Array, uint8ArrayToBase64 } from "uint8array-extras"

import { JSONMark } from "./JSONMark"
import { customType, startsWithMarker } from "./transform"
import type { TypeRegistry } from "./transform"

export const builtinTypes = {
  "\uEE00": customType<string>({
    test: value => typeof value === "string" && startsWithMarker(value),
    stringify: value => value,
    parse: value => value,
  }),
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
