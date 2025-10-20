import { base64ToUint8Array, isUint8Array, uint8ArrayToBase64 } from "uint8array-extras"

import { customType } from "./customType"
import type { TypeRegistry } from "./customType"

export const builtinTypes = {
  // Special numbers (must be first to test before other types)
  "NaN": customType<number>({
    test: value => Number.isNaN(value),
    stringify: () => "",
    parse: () => Number.NaN,
  }),
  "Infinity": customType<number>({
    test: value => value === Infinity,
    stringify: () => "",
    parse: () => Infinity,
  }),
  "-Infinity": customType<number>({
    test: value => value === -Infinity,
    stringify: () => "",
    parse: () => -Infinity,
  }),

  // RegExp
  "RegExp": customType<RegExp>({
    test: value => value instanceof RegExp,
    stringify: value => `${value.source}|${value.flags}`,
    parse: (value) => {
      const delimiterIndex = value.lastIndexOf("|")
      const source = value.slice(0, delimiterIndex)
      const flags = value.slice(delimiterIndex + 1)
      return new RegExp(source, flags)
    },
  }),

  // BigInt
  "bigint": customType<bigint>({
    test: value => typeof value === "bigint",
    stringify: value => value.toString(),
    parse: value => BigInt(value),
  }),

  // Typed Arrays
  "Uint8Array": customType<Uint8Array>({
    test: value => isUint8Array(value),
    stringify: value => uint8ArrayToBase64(value),
    parse: value => base64ToUint8Array(value),
  }),
  "Int8Array": customType<Int8Array>({
    test: value => value instanceof Int8Array,
    stringify: value => uint8ArrayToBase64(new Uint8Array(value.buffer, value.byteOffset, value.byteLength)),
    parse: value => new Int8Array(base64ToUint8Array(value).buffer),
  }),
  "Uint8ClampedArray": customType<Uint8ClampedArray>({
    test: value => value instanceof Uint8ClampedArray,
    stringify: value => uint8ArrayToBase64(new Uint8Array(value.buffer, value.byteOffset, value.byteLength)),
    parse: value => new Uint8ClampedArray(base64ToUint8Array(value).buffer),
  }),
  "Int16Array": customType<Int16Array>({
    test: value => value instanceof Int16Array,
    stringify: value => uint8ArrayToBase64(new Uint8Array(value.buffer, value.byteOffset, value.byteLength)),
    parse: value => new Int16Array(base64ToUint8Array(value).buffer),
  }),
  "Uint16Array": customType<Uint16Array>({
    test: value => value instanceof Uint16Array,
    stringify: value => uint8ArrayToBase64(new Uint8Array(value.buffer, value.byteOffset, value.byteLength)),
    parse: value => new Uint16Array(base64ToUint8Array(value).buffer),
  }),
  "Int32Array": customType<Int32Array>({
    test: value => value instanceof Int32Array,
    stringify: value => uint8ArrayToBase64(new Uint8Array(value.buffer, value.byteOffset, value.byteLength)),
    parse: value => new Int32Array(base64ToUint8Array(value).buffer),
  }),
  "Uint32Array": customType<Uint32Array>({
    test: value => value instanceof Uint32Array,
    stringify: value => uint8ArrayToBase64(new Uint8Array(value.buffer, value.byteOffset, value.byteLength)),
    parse: value => new Uint32Array(base64ToUint8Array(value).buffer),
  }),
  "Float32Array": customType<Float32Array>({
    test: value => value instanceof Float32Array,
    stringify: value => uint8ArrayToBase64(new Uint8Array(value.buffer, value.byteOffset, value.byteLength)),
    parse: value => new Float32Array(base64ToUint8Array(value).buffer),
  }),
  "Float64Array": customType<Float64Array>({
    test: value => value instanceof Float64Array,
    stringify: value => uint8ArrayToBase64(new Uint8Array(value.buffer, value.byteOffset, value.byteLength)),
    parse: value => new Float64Array(base64ToUint8Array(value).buffer),
  }),
  "BigInt64Array": customType<BigInt64Array>({
    test: value => value instanceof BigInt64Array,
    stringify: value => uint8ArrayToBase64(new Uint8Array(value.buffer, value.byteOffset, value.byteLength)),
    parse: value => new BigInt64Array(base64ToUint8Array(value).buffer),
  }),
  "BigUint64Array": customType<BigUint64Array>({
    test: value => value instanceof BigUint64Array,
    stringify: value => uint8ArrayToBase64(new Uint8Array(value.buffer, value.byteOffset, value.byteLength)),
    parse: value => new BigUint64Array(base64ToUint8Array(value).buffer),
  }),
} satisfies TypeRegistry
