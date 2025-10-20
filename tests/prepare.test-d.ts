import { prepare, restore } from "json-mark"
import { expectTypeOf, test } from "vitest"

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
  }

  const prepared = prepare(value)
  const restored = restore(prepared)

  expectTypeOf(restored).toEqualTypeOf<typeof value>()
})

test("restore works with manual type", () => {
  const value = { id: 123n, buffer: new Uint8Array([1, 2, 3]), count: 42 }
  const prepared = prepare(value) as string
  expectTypeOf(prepared).toBeString()
  expectTypeOf(restore(prepared)).toBeUnknown()
  expectTypeOf(restore<typeof value>(prepared)).toEqualTypeOf<typeof value>()
})
