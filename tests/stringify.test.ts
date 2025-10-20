import { parse, stringify } from "json-mark"
import { expect, it } from "vitest"

it("handles standard JSON types", () => {
  const obj = { test: true, num: 42, str: "hello", arr: [1, 2, 3] }
  const json = stringify(obj)
  expect(parse(json)).toEqual(obj)
})

it("handles bigint values", () => {
  const value = 123456789012345678901234567890n
  const json = stringify(value)
  expect(parse(json)).toEqual(value)
})

it("handles Uint8Array values", () => {
  const value = new Uint8Array([1, 2, 3, 4, 5])
  const json = stringify(value)
  expect(parse(json)).toEqual(value)
})

it("handles strings that start with PUA markers", () => {
  const str = "\uEE00test"
  const json = stringify(str)
  expect(parse(json)).toEqual(str)
})

it("handles strings that start with PUA markers in nested objects", () => {
  const obj = { escaped: "\uEE00test" }
  const json = stringify(obj)
  expect(parse(json)).toEqual(obj)
})

it("handles nested objects with custom types", () => {
  const obj = {
    nested: {
      bigNum: 999n,
      buffer: new Uint8Array([255, 0, 128]),
      normal: "test",
    },
  }
  const json = stringify(obj)
  expect(parse(json)).toEqual(obj)
})

it("handles arrays with custom types", () => {
  const obj = { items: [1n, 2n, 3n, new Uint8Array([1, 2])] }
  const json = stringify(obj)
  expect(parse(json)).toEqual(obj)
})

it("supports custom replacer function", () => {
  const obj = { a: 1, b: 2 }
  const json = stringify(obj, (key, value) => {
    if (key === "b") {
      return undefined
    }
    return value
  })
  expect(parse(json)).toEqual({ a: 1 })
})

it("supports custom reviver function", () => {
  const obj = { a: 1, b: 2 }
  const json = stringify(obj)
  const result = parse(json, (key, value) => {
    if (key === "b") {
      return value * 10
    }
    return value
  })
  expect(result).toEqual({ a: 1, b: 20 })
})

it("supports space formatting", () => {
  const obj = { test: true }
  expect(stringify(obj, null, 2)).toContain("\n  ")
  expect(stringify(obj, null, "\t")).toContain("\n\t")
})
