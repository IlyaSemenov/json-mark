import { JSONMark } from "json-mark"
import { expect, it } from "vitest"

const customJSON = new JSONMark({ marker: "→", delimiter: "|" })

it("supports custom marker and delimiter", () => {
  const value = 12345678901234567890n

  const json = customJSON.stringify(value)
  expect(json).toBe("\"→bigint|12345678901234567890\"")

  const restored = customJSON.parse(json)
  expect(restored).toBe(value)
})

it("handles strings starting with custom marker", () => {
  const str = "→hello"

  const json = customJSON.stringify(str)
  expect(json).toBe("\"→string|→hello\"")

  const restored = customJSON.parse(json)
  expect(restored).toBe(str)
})
