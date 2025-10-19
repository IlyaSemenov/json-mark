import { install, originalJSON, uninstall } from "json-mark"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

beforeEach(() => {
  // Ensure clean state
  uninstall()
})

afterEach(() => {
  // Cleanup after each test
  uninstall()
})

describe("install", () => {
  it("overrides global JSON methods", () => {
    const originalStringify = JSON.stringify
    const originalParse = JSON.parse

    install()

    expect(JSON.stringify).not.toBe(originalStringify)
    expect(JSON.parse).not.toBe(originalParse)
  })

  it("handles bigint after installation", () => {
    install()

    const obj = { num: 123n }
    const json = JSON.stringify(obj)
    const result = JSON.parse(json)

    expect(result.num).toBe(123n)
  })

  it("does not install twice", () => {
    install()
    const firstStringify = JSON.stringify

    install()
    const secondStringify = JSON.stringify

    expect(firstStringify).toBe(secondStringify)
  })
})

describe("uninstall", () => {
  it("restores original JSON methods", () => {
    const originalStringify = JSON.stringify
    const originalParse = JSON.parse

    install()
    uninstall()

    expect(JSON.stringify).toBe(originalStringify)
    expect(JSON.parse).toBe(originalParse)
  })

  it("can be called when not installed", () => {
    expect(() => uninstall()).not.toThrow()
  })

  it("removes custom type support", () => {
    install()
    uninstall()

    // After uninstall, bigint should throw again
    expect(() => JSON.stringify({ num: 123n })).toThrow()
  })
})

describe("originalJSON", () => {
  it("always references original methods when not installed", () => {
    const nativeStringify = JSON.stringify
    expect(originalJSON.stringify).toBe(nativeStringify)
  })

  it("always references original methods when installed", () => {
    const nativeStringify = JSON.stringify
    const nativeParse = JSON.parse

    install()

    expect(originalJSON.stringify).toBe(nativeStringify)
    expect(originalJSON.parse).toBe(nativeParse)
  })

  it("does not handle custom types", () => {
    install()

    // originalJSON should not handle bigint
    expect(() => originalJSON.stringify({ num: 123n })).toThrow()
  })
})

describe("install/uninstall cycle", () => {
  it("can be installed and uninstalled multiple times", () => {
    const nativeStringify = JSON.stringify

    install()
    expect(JSON.stringify).not.toBe(nativeStringify)

    uninstall()
    expect(JSON.stringify).toBe(nativeStringify)

    install()
    expect(JSON.stringify).not.toBe(nativeStringify)

    uninstall()
    expect(JSON.stringify).toBe(nativeStringify)
  })
})
