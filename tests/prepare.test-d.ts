import type { JSONValue } from "json-mark"
import { prepare, restore } from "json-mark"
import { expectTypeOf, it, test } from "vitest"

test("round-trip preserves type", () => {
  const value = {
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
    txHash: null,
  }

  const prepared = prepare(value)
  const restored = restore(prepared)

  expectTypeOf(restored).toEqualTypeOf<typeof value>()
})

it("handles null", () => {
  const prepared = prepare(null)
  expectTypeOf(prepared).toBeNull()
  expectTypeOf(restore(prepared)).toBeNull()
})

test("restore works with manual type", () => {
  const value = { id: 123n, buffer: new Uint8Array([1, 2, 3]), count: 42 }
  const prepared = prepare(value) as string
  expectTypeOf(prepared).toBeString()
  expectTypeOf(restore(prepared)).toExtend<JSONValue>()
  expectTypeOf(restore<typeof value>(prepared)).toEqualTypeOf<typeof value>()
})
