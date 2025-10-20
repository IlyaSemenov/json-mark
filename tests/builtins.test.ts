import { parse, stringify } from "json-mark"
import { describe, expect, it } from "vitest"

describe("special numbers", () => {
  it("supports NaN", () => {
    const data = { value: Number.NaN }
    const json = stringify(data)
    const restored = parse(json)
    expect(Number.isNaN(restored.value)).toBe(true)
  })

  it("supports Infinity", () => {
    const data = { value: Infinity }
    const json = stringify(data)
    const restored = parse(json)
    expect(restored.value).toBe(Infinity)
  })

  it("supports -Infinity", () => {
    const data = { value: -Infinity }
    const json = stringify(data)
    const restored = parse(json)
    expect(restored.value).toBe(-Infinity)
  })
})

describe.todo("date", () => {
  it("supports Date instances", () => {
    const date = new Date("2025-10-20T10:30:00.000Z")
    const json = stringify(date)
    const restored = parse(json)
    expect(restored).toBeInstanceOf(Date)
    expect(restored.getTime()).toBe(date.getTime())
  })

  it("preserves millisecond precision", () => {
    const date = new Date(1729423800123)
    const data = { time: date }
    const json = stringify(data)
    const restored = parse(json)
    expect(restored.time.getTime()).toBe(1729423800123)
  })
})

describe("regExp", () => {
  it("supports RegExp instances", () => {
    const regex = /test/gi
    const data = { pattern: regex }
    const json = stringify(data)
    const restored = parse(json)
    expect(restored.pattern).toBeInstanceOf(RegExp)
    expect(restored.pattern.source).toBe("test")
    expect(restored.pattern.flags).toBe("gi")
  })

  it("supports RegExp without flags", () => {
    const regex = /hello/
    const data = { pattern: regex }
    const json = stringify(data)
    const restored = parse(json)
    expect(restored.pattern.source).toBe("hello")
    expect(restored.pattern.flags).toBe("")
  })

  it("supports complex RegExp patterns", () => {
    const regex = /[a-z]+\|(\d|X){2,5}/i
    const data = { pattern: regex }
    const json = stringify(data)
    const restored = parse(json)
    expect(restored.pattern.source).toBe(regex.source)
    expect(restored.pattern.flags).toBe("i")
  })
})

describe.todo("url", () => {
  it("supports URL instances", () => {
    const url = new URL("https://example.com/path?query=value")
    const data = { link: url }
    const json = stringify(data)
    const restored = parse(json)
    expect(restored.link).toBeInstanceOf(URL)
    expect(restored.link.href).toBe("https://example.com/path?query=value")
  })

  it("preserves URL components", () => {
    const url = new URL("https://user:pass@example.com:8080/path?q=1#hash")
    const data = { link: url }
    const json = stringify(data)
    const restored = parse(json)
    expect(restored.link.protocol).toBe("https:")
    expect(restored.link.hostname).toBe("example.com")
    expect(restored.link.port).toBe("8080")
    expect(restored.link.pathname).toBe("/path")
    expect(restored.link.search).toBe("?q=1")
    expect(restored.link.hash).toBe("#hash")
  })
})

describe("typed arrays", () => {
  it("supports Int8Array", () => {
    const arr = new Int8Array([-128, -1, 0, 1, 127])
    const data = { array: arr }
    const json = stringify(data)
    const restored = parse(json)
    expect(restored.array).toBeInstanceOf(Int8Array)
    expect(Array.from(restored.array)).toEqual([-128, -1, 0, 1, 127])
  })

  it("supports Uint8ClampedArray", () => {
    const arr = new Uint8ClampedArray([0, 128, 255])
    const data = { array: arr }
    const json = stringify(data)
    const restored = parse(json)
    expect(restored.array).toBeInstanceOf(Uint8ClampedArray)
    expect(Array.from(restored.array)).toEqual([0, 128, 255])
  })

  it("supports Int16Array", () => {
    const arr = new Int16Array([-32768, -1, 0, 1, 32767])
    const data = { array: arr }
    const json = stringify(data)
    const restored = parse(json)
    expect(restored.array).toBeInstanceOf(Int16Array)
    expect(Array.from(restored.array)).toEqual([-32768, -1, 0, 1, 32767])
  })

  it("supports Uint16Array", () => {
    const arr = new Uint16Array([0, 1000, 65535])
    const data = { array: arr }
    const json = stringify(data)
    const restored = parse(json)
    expect(restored.array).toBeInstanceOf(Uint16Array)
    expect(Array.from(restored.array)).toEqual([0, 1000, 65535])
  })

  it("supports Int32Array", () => {
    const arr = new Int32Array([-2147483648, -1, 0, 1, 2147483647])
    const data = { array: arr }
    const json = stringify(data)
    const restored = parse(json)
    expect(restored.array).toBeInstanceOf(Int32Array)
    expect(Array.from(restored.array)).toEqual([-2147483648, -1, 0, 1, 2147483647])
  })

  it("supports Uint32Array", () => {
    const arr = new Uint32Array([0, 1000, 4294967295])
    const data = { array: arr }
    const json = stringify(data)
    const restored = parse(json)
    expect(restored.array).toBeInstanceOf(Uint32Array)
    expect(Array.from(restored.array)).toEqual([0, 1000, 4294967295])
  })

  it("supports Float32Array", () => {
    const arr = new Float32Array([0.5, -1.5, 3.14159])
    const data = { array: arr }
    const json = stringify(data)
    const restored = parse(json)
    expect(restored.array).toBeInstanceOf(Float32Array)
    expect(Array.from(restored.array)).toEqual(Array.from(arr))
  })

  it("supports Float64Array", () => {
    const arr = new Float64Array([0.5, -1.5, Math.PI])
    const data = { array: arr }
    const json = stringify(data)
    const restored = parse(json)
    expect(restored.array).toBeInstanceOf(Float64Array)
    expect(Array.from(restored.array)).toEqual([0.5, -1.5, Math.PI])
  })

  it("supports BigInt64Array", () => {
    const arr = new BigInt64Array([-9223372036854775808n, -1n, 0n, 1n, 9223372036854775807n])
    const data = { array: arr }
    const json = stringify(data)
    const restored = parse(json)
    expect(restored.array).toBeInstanceOf(BigInt64Array)
    expect(Array.from(restored.array)).toEqual([-9223372036854775808n, -1n, 0n, 1n, 9223372036854775807n])
  })

  it("supports BigUint64Array", () => {
    const arr = new BigUint64Array([0n, 1000n, 18446744073709551615n])
    const data = { array: arr }
    const json = stringify(data)
    const restored = parse(json)
    expect(restored.array).toBeInstanceOf(BigUint64Array)
    expect(Array.from(restored.array)).toEqual([0n, 1000n, 18446744073709551615n])
  })
})

describe("mixed built-in types", () => {
  it("supports all new built-in types together", () => {
    const data = {
      regex: /test/gi,
      nan: Number.NaN,
      inf: Infinity,
      negInf: -Infinity,
      int8: new Int8Array([1, 2, 3]),
      uint64: new BigUint64Array([4n, 5n, 6n]),
      bigint: 123n,
      // TODO:
      // date: new Date("2025-10-20T10:30:00.000Z"),
      // url: new URL("https://example.com"),
    }
    const json = stringify(data)
    const restored = parse(json)
    expect(restored).toEqual(data)
  })
})
