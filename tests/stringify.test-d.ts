import { parse, stringify } from "json-mark"
import { expectTypeOf, test } from "vitest"

test("stringify returns string", () => {
  const obj = { test: true }
  const result = stringify(obj)
  expectTypeOf(result).toBeString()
})

test("round-trip preserves type", () => {
  const obj = {
    kind: "users",
    users: [
      { id: 1n, name: "Alice" },
      { id: 2n, name: "Bob" },
    ],
    metadata: {
      count: 2,
      timestamp: 123456789n,
    },
  }

  const json = stringify(obj)
  const result = parse(json)

  expectTypeOf(result).toEqualTypeOf<typeof obj>()
})
