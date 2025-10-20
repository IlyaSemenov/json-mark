import { prepare, restore } from "json-mark"
import { expectTypeOf, test } from "vitest"

test("prepare transforms bigint to string", () => {
  const value = 123n
  const result = prepare(value)
  expectTypeOf(result).toBeString()
})

test("prepare transforms object with custom types", () => {
  const obj = { id: 123n, buffer: new Uint8Array([1, 2, 3]), count: 42 }
  const result = prepare(obj)

  expectTypeOf(result).toExtend<{
    id: string
    buffer: string
    count: number
  }>()
})

test("round-trip preserves type", () => {
  const original = {
    kind: "users",
    users: [
      { id: 1n, name: "Alice" },
      { id: 2n, name: "Bob" },
    ],
    metadata: {
      count: 2,
      timestamp: 123456789n,
      buffer: new Uint8Array([1, 2, 3]),
    },
  }

  const prepared = prepare(original)
  const restored = restore(prepared)

  expectTypeOf(restored).toEqualTypeOf<typeof original>()
})
