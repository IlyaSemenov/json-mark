import { expectTypeOf, test } from "vitest"

import { prepare, restore } from "./prepare"
import type { MarkedString } from "./prepare"

test("prepare transforms bigint to MarkedString", () => {
  const value = 123n
  const result = prepare(value)

  expectTypeOf(result).toEqualTypeOf<MarkedString<123n>>()
})

test("restore transforms MarkedString back to bigint", () => {
  const value = "123" as MarkedString<bigint>
  const result = restore(value)

  expectTypeOf(result).toEqualTypeOf<bigint>()
})

test("prepare preserves standard types", () => {
  const str = "hello"
  const num = 42
  const bool = true
  const nul = null

  expectTypeOf(prepare(str)).toEqualTypeOf<string>()
  expectTypeOf(prepare(num)).toEqualTypeOf<number>()
  expectTypeOf(prepare(bool)).toEqualTypeOf<boolean>()
  expectTypeOf(prepare(nul)).toEqualTypeOf<null>()
})

test("restore preserves standard types", () => {
  const str = "hello"
  const num = 42
  const bool = true
  const nul = null

  expectTypeOf(restore(str)).toEqualTypeOf<string>()
  expectTypeOf(restore(num)).toEqualTypeOf<number>()
  expectTypeOf(restore(bool)).toEqualTypeOf<boolean>()
  expectTypeOf(restore(nul)).toEqualTypeOf<null>()
})

test("prepare handles simple object with bigint", () => {
  const obj = { id: 123n, name: "test" }
  const result = prepare(obj)

  expectTypeOf(result).toEqualTypeOf<{
    id: MarkedString<bigint>
    name: string
  }>()
})

test("restore handles simple object with MarkedString", () => {
  const obj = {
    id: "123" as MarkedString<bigint>,
    name: "test",
  }
  const result = restore(obj)

  expectTypeOf(result).toEqualTypeOf<{
    id: bigint
    name: string
  }>()
})

test("round-trip type preservation", () => {
  const original = { id: 123n, name: "test" }

  const prepared = prepare(original)
  const restored = restore(prepared)

  expectTypeOf(restored).toEqualTypeOf<typeof original>()
})

test("prepare handles array of bigints", () => {
  const arr = [123n, 456n, 789n]
  const result = prepare(arr)

  expectTypeOf(result).toEqualTypeOf<Array<MarkedString<bigint>>>()
})

test("restore handles array of MarkedStrings", () => {
  const arr = ["123" as MarkedString<bigint>, "456" as MarkedString<bigint>]
  const result = restore(arr)

  expectTypeOf(result).toEqualTypeOf<Array<bigint>>()
})

test("prepare handles Uint8Array", () => {
  const buffer = new Uint8Array([1, 2, 3])
  const result = prepare(buffer)

  expectTypeOf(result).toEqualTypeOf<MarkedString<typeof buffer>>()
})

test("restore handles Uint8Array MarkedString", () => {
  const value = "base64string" as MarkedString<Uint8Array>
  const result = restore(value)

  expectTypeOf(result).toEqualTypeOf<Uint8Array>()
})

test("prepare handles object with Uint8Array", () => {
  const obj = { buffer: new Uint8Array([1, 2, 3]), name: "test" }
  const result = prepare(obj)

  expectTypeOf(result).toEqualTypeOf<{
    buffer: MarkedString<Uint8Array<ArrayBuffer>>
    name: string
  }>()
})

test("prepare handles nested objects with bigint", () => {
  const obj = {
    level1: {
      id: 123n,
      level2: {
        value: 456n,
      },
    },
  }
  const result = prepare(obj)

  expectTypeOf(result).toEqualTypeOf<{
    level1: {
      id: MarkedString<bigint>
      level2: {
        value: MarkedString<bigint>
      }
    }
  }>()
})

test("restore handles nested objects with MarkedStrings", () => {
  const obj = {
    level1: {
      id: "123" as MarkedString<bigint>,
      level2: {
        value: "456" as MarkedString<bigint>,
      },
    },
  }
  const result = restore(obj)

  expectTypeOf(result).toEqualTypeOf<{
    level1: {
      id: bigint
      level2: {
        value: bigint
      }
    }
  }>()
})

test("prepare handles mixed custom types", () => {
  const obj = {
    id: 123n,
    buffer: new Uint8Array([1, 2, 3]),
    name: "test",
  }
  const result = prepare(obj)

  expectTypeOf(result).toEqualTypeOf<{
    id: MarkedString<bigint>
    buffer: MarkedString<Uint8Array<ArrayBuffer>>
    name: string
  }>()
})

test("restore handles mixed custom types", () => {
  const obj = {
    id: "123" as MarkedString<bigint>,
    buffer: "base64" as MarkedString<Uint8Array>,
    name: "test",
  }
  const result = restore(obj)

  expectTypeOf(result).toEqualTypeOf<{
    id: bigint
    buffer: Uint8Array
    name: string
  }>()
})

test("prepare handles object with array of bigints", () => {
  const obj = { ids: [1n, 2n, 3n], name: "test" }
  const result = prepare(obj)

  expectTypeOf(result).toEqualTypeOf<{
    ids: Array<MarkedString<bigint>>
    name: string
  }>()
})

test("restore handles object with array of MarkedStrings", () => {
  const obj = {
    ids: ["1" as MarkedString<bigint>, "2" as MarkedString<bigint>],
    name: "test",
  }
  const result = restore(obj)

  expectTypeOf(result).toEqualTypeOf<{
    ids: Array<bigint>
    name: string
  }>()
})

test("prepare handles complex nested structure", () => {
  const obj = {
    users: [
      { id: 1n, name: "Alice", balance: 100n },
      { id: 2n, name: "Bob", balance: 200n },
    ],
    metadata: {
      count: 2,
      timestamp: 123456789n,
      data: new Uint8Array([255, 0]),
    },
  }
  const result = prepare(obj)

  expectTypeOf(result).toEqualTypeOf<{
    users: Array<{
      id: MarkedString<bigint>
      name: string
      balance: MarkedString<bigint>
    }>
    metadata: {
      count: number
      timestamp: MarkedString<bigint>
      data: MarkedString<Uint8Array<ArrayBuffer>>
    }
  }>()
})

test("restore handles complex nested structure", () => {
  const obj = {
    users: [
      {
        id: "1" as MarkedString<bigint>,
        name: "Alice",
        balance: "100" as MarkedString<bigint>,
      },
    ],
    metadata: {
      count: 2,
      timestamp: "123456789" as MarkedString<bigint>,
      data: "base64" as MarkedString<Uint8Array>,
    },
  }
  const result = restore(obj)

  expectTypeOf(result).toEqualTypeOf<{
    users: Array<{
      id: bigint
      name: string
      balance: bigint
    }>
    metadata: {
      count: number
      timestamp: bigint
      data: Uint8Array
    }
  }>()
})

test("round-trip complex structure preserves types", () => {
  const original = {
    id: 123n,
    buffer: new Uint8Array([1, 2, 3]),
    items: [456n, 789n],
    nested: {
      value: 999n,
    },
  }

  const prepared = prepare(original)
  const restored = restore(prepared)

  expectTypeOf(restored).toEqualTypeOf<typeof original>()
})

test("prepare handles bigint or null union", () => {
  const obj = { value: 123n as bigint | null }
  const result = prepare(obj)

  expectTypeOf(result).toEqualTypeOf<{
    value: MarkedString<bigint> | null
  }>()
})

test("restore handles MarkedString or null union", () => {
  const obj = { value: "123" as MarkedString<bigint> | null }
  const result = restore(obj)

  expectTypeOf(result).toEqualTypeOf<{
    value: bigint | null
  }>()
})

test("prepare handles optional bigint property", () => {
  const obj: { id?: bigint, name: string } = { name: "test" }
  const result = prepare(obj)

  expectTypeOf(result).toEqualTypeOf<{
    id?: MarkedString<bigint>
    name: string
  }>()
})

test("restore handles optional MarkedString property", () => {
  const obj: { id?: MarkedString<bigint>, name: string } = { name: "test" }
  const result = restore(obj)

  expectTypeOf(result).toEqualTypeOf<{
    id?: bigint
    name: string
  }>()
})
