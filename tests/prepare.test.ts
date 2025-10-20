import { prepare, restore } from "json-mark"
import { describe, expect, it } from "vitest"

describe("prepare", () => {
  it("converts bigint for external JSON.stringify", () => {
    const value = 123456789012345678901234567890n
    const prepared = prepare(value)

    // Should be serializable with native JSON
    const json = JSON.stringify(prepared)
    expect(json).toContain("123456789012345678901234567890")
  })

  it("converts Uint8Array for external JSON.stringify", () => {
    const value = new Uint8Array([1, 2, 3])
    const prepared = prepare(value)

    // Should be serializable with native JSON
    const json = JSON.stringify(prepared)
    expect(json).toContain("AQID") // base64 of 123
  })

  it("handles nested custom types", () => {
    const obj = {
      level1: {
        num: 999n,
        level2: {
          buffer: new Uint8Array([255, 0]),
        },
      },
    }
    const prepared = prepare(obj)

    // Should be serializable
    expect(() => JSON.stringify(prepared)).not.toThrow()
  })

  it("preserves standard types", () => {
    const obj = { str: "test", num: 42, bool: true, arr: [1, 2, 3] }
    const prepared = prepare(obj)
    expect(prepared).toEqual(obj)
  })
})

describe("restore", () => {
  it("restores bigint from prepared data", () => {
    const prepared = prepare({ num: 123n })
    const restored = restore(prepared)
    expect(restored.num).toBe(123n)
  })

  it("restores Uint8Array from prepared data", () => {
    const original = new Uint8Array([1, 2, 3, 4])
    const prepared = prepare({ buffer: original })
    const json = JSON.stringify(prepared)
    const parsed = JSON.parse(json)
    const restored = restore(parsed)

    expect(restored.buffer).toBeInstanceOf(Uint8Array)
    expect(Array.from(restored.buffer)).toEqual([1, 2, 3, 4])
  })

  it("handles nested custom types", () => {
    const prepared = prepare({
      level1: {
        num: 999n,
        level2: {
          buffer: new Uint8Array([1, 2, 3]),
        },
      },
    })
    const restored = restore(prepared)
    expect(restored.level1.num).toBe(999n)
    expect(restored.level1.level2.buffer).toBeInstanceOf(Uint8Array)
    expect(Array.from(restored.level1.level2.buffer)).toEqual([1, 2, 3])
  })

  it("preserves standard types", () => {
    const obj = { str: "test", num: 42, bool: true, arr: [1, 2, 3] }
    const restored = restore(obj)
    expect(restored).toEqual(obj)
  })
})

describe("round-trip with external JSON", () => {
  it("preserves data through prepare → JSON.stringify → JSON.parse → restore", () => {
    const original = {
      bigNum: 123456789012345678901234567890n,
      buffer: new Uint8Array([1, 2, 3, 4, 5]),
      text: "hello",
      nested: {
        anotherBig: 999n,
      },
    }

    // Prepare for external serialization
    const prepared = prepare(original)

    // Use native JSON methods
    const json = JSON.stringify(prepared)
    const parsed = JSON.parse(json)

    // Restore original types
    const restored = restore(parsed)

    expect(restored.bigNum).toBe(original.bigNum)
    expect(restored.buffer).toBeInstanceOf(Uint8Array)
    expect(Array.from(restored.buffer)).toEqual([1, 2, 3, 4, 5])
    expect(restored.text).toBe(original.text)
    expect(restored.nested.anotherBig).toBe(original.nested.anotherBig)
  })

  it("handles arrays of custom types", () => {
    const original = {
      numbers: [1n, 2n, 3n],
      buffers: [new Uint8Array([1]), new Uint8Array([2, 3])],
    }

    const prepared = prepare(original)
    const json = JSON.stringify(prepared)
    const parsed = JSON.parse(json)
    const restored = restore(parsed)

    expect(restored.numbers).toEqual([1n, 2n, 3n])
    expect(restored.buffers[0]).toBeInstanceOf(Uint8Array)
    expect(Array.from(restored.buffers[0])).toEqual([1])
    expect(Array.from(restored.buffers[1])).toEqual([2, 3])
  })

  it("handles mixed standard and custom types", () => {
    const original = {
      id: 1,
      name: "test",
      active: true,
      bigValue: 999999999999999999n,
      data: new Uint8Array([255, 128, 64]),
      tags: ["a", "b", "c"],
    }

    const prepared = prepare(original)
    const json = JSON.stringify(prepared)
    const parsed = JSON.parse(json)
    const restored = restore(parsed)

    expect(restored.id).toBe(1)
    expect(restored.name).toBe("test")
    expect(restored.active).toBe(true)
    expect(restored.bigValue).toBe(999999999999999999n)
    expect(restored.data).toBeInstanceOf(Uint8Array)
    expect(Array.from(restored.data)).toEqual([255, 128, 64])
    expect(restored.tags).toEqual(["a", "b", "c"])
  })
})
