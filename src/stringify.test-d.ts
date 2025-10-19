import { expectTypeOf, test } from "vitest"

import { parse, stringify } from "./stringify"
import type { StringifiedJson } from "./stringify"

test("stringify returns StringifiedJson branded type", () => {
  const obj = { test: true }
  const result = stringify(obj)

  expectTypeOf(result).toEqualTypeOf<StringifiedJson<{ test: boolean }>>()
})

test("stringify preserves input type in brand", () => {
  const obj = {
    id: 1,
    name: "test",
    active: true,
    bigNum: 123n,
  }
  const result = stringify(obj)

  expectTypeOf(result).toEqualTypeOf<StringifiedJson<typeof obj>>()
})

test("StringifiedJson is assignable to string", () => {
  const obj = { test: true }
  const result = stringify(obj)

  expectTypeOf(result).toBeString()

  // Can be used where string is expected
  const str: string = result
  expectTypeOf(str).toBeString()
})

test("parse accepts StringifiedJson", () => {
  const json = "{\"test\":true}" as StringifiedJson<{ test: boolean }>
  const result = parse(json)

  expectTypeOf(result).toEqualTypeOf<{ test: boolean }>()
})

test("parse returns original type", () => {
  type Original = {
    id: number
    name: string
    bigNum: bigint
  }

  const json = "{}" as StringifiedJson<Original>
  const result = parse(json)

  expectTypeOf(result).toEqualTypeOf<Original>()
})

test("round-trip preserves type", () => {
  const original = {
    id: 1,
    name: "test",
    active: true,
    bigNum: 123n,
    buffer: new Uint8Array([1, 2, 3]),
  }

  const json = stringify(original)
  const result = parse(json)

  expectTypeOf(result).toEqualTypeOf<typeof original>()
})

test("stringify with replacer preserves type", () => {
  const obj = { a: 1, b: 2 }
  const result = stringify(obj, (key, value) => value)

  expectTypeOf(result).toEqualTypeOf<StringifiedJson<typeof obj>>()
})

test("parse with reviver preserves type", () => {
  const json = "{\"a\":1}" as StringifiedJson<{ a: number }>
  const result = parse(json, (key, value) => value)

  expectTypeOf(result).toEqualTypeOf<{ a: number }>()
})

test("stringify handles complex nested types", () => {
  const obj = {
    users: [
      { id: 1n, name: "Alice" },
      { id: 2n, name: "Bob" },
    ],
    metadata: {
      count: 2,
      timestamp: 123456789n,
    },
  }

  const result = stringify(obj)

  expectTypeOf(result).toEqualTypeOf<StringifiedJson<typeof obj>>()

  const parsed = parse(result)
  expectTypeOf(parsed).toEqualTypeOf<typeof obj>()
})

test("stringify with space parameter preserves type", () => {
  const obj = { test: true }
  const result1 = stringify(obj, null, 2)
  const result2 = stringify(obj, null, "\t")

  expectTypeOf(result1).toEqualTypeOf<StringifiedJson<typeof obj>>()
  expectTypeOf(result2).toEqualTypeOf<StringifiedJson<typeof obj>>()
})
