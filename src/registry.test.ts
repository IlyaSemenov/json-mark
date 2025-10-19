import { describe, expect, it } from "vitest"

import { isMarker, registeredTypes, registerType, startsWithMarker } from "./registry"

describe("isMarker", () => {
  it("returns true for valid PUA markers", () => {
    expect(isMarker("\uE000")).toBe(true)
    expect(isMarker("\uEE00")).toBe(true)
    expect(isMarker("\uF8FF")).toBe(true)
  })

  it("returns false for invalid markers", () => {
    expect(isMarker("a")).toBe(false)
    expect(isMarker("")).toBe(false)
    expect(isMarker("ab")).toBe(false)
    expect(isMarker("\u0000")).toBe(false)
    expect(isMarker("\uFFFF")).toBe(false)
  })
})

describe("startsWithMarker", () => {
  it("returns true for strings starting with PUA markers", () => {
    expect(startsWithMarker("\uEE00test")).toBe(true)
    expect(startsWithMarker("\uE000")).toBe(true)
  })

  it("returns false for strings not starting with markers", () => {
    expect(startsWithMarker("test")).toBe(false)
    expect(startsWithMarker("")).toBe(false)
    expect(startsWithMarker("a\uEE00")).toBe(false)
  })
})

describe("registerType", () => {
  it("throws error for invalid marker", () => {
    expect(() => {
      registerType({
        marker: "a",
        test: () => true,
        parse: v => v,
      })
    }).toThrow("Invalid marker")
  })

  it("throws error for duplicate marker", () => {
    const marker = "\uEE99"

    registerType({
      marker,
      test: () => true,
      parse: v => v,
    })

    expect(() => {
      registerType({
        marker,
        test: () => true,
        parse: v => v,
      })
    }).toThrow("already registered")

    // Cleanup
    registeredTypes.delete(marker)
  })

  it("successfully registers a valid type", () => {
    const marker = "\uEE98"

    // Clean up first
    registeredTypes.delete(marker)

    const typeConfig = {
      marker,
      test: (value: unknown) => typeof value === "symbol",
      parse: (v: string) => Symbol(v),
    }

    registerType(typeConfig)
    expect(registeredTypes.has(marker)).toBe(true)
    expect(registeredTypes.get(marker)).toBe(typeConfig)

    // Cleanup
    registeredTypes.delete(marker)
  })
})
