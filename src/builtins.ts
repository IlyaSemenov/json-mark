import { base64ToUint8Array, isUint8Array, uint8ArrayToBase64 } from "uint8array-extras"

import { registerType, startsWithMarker } from "./registry"

export function registerBuiltinTypes() {
  // Escape strings that start with any PUA marker.
  // This is future proof for new markers/types.
  registerType({
    marker: "\uEE00",
    test: value => typeof value === "string" && startsWithMarker(value),
    parse: value => value,
  })

  registerType<bigint>({
    marker: "\uEE01",
    test: value => typeof value === "bigint",
    parse: value => BigInt(value),
  })

  registerType<Uint8Array>({
    marker: "\uEE02",
    test: value => isUint8Array(value),
    stringify: value => uint8ArrayToBase64(value),
    parse: value => base64ToUint8Array(value),
  })
}
