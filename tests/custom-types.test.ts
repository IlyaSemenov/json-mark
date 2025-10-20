import { customType, JSONMark } from "json-mark"
import { describe, expect, it } from "vitest"

class Point {
  constructor(public x: number, public y: number) {}
}

class Color {
  constructor(public r: number, public g: number, public b: number) {}
}

const pointType = customType<Point>({
  test: value => value instanceof Point,
  stringify: value => `${value.x},${value.y}`,
  parse: (str) => {
    const [x, y] = str.split(",").map(Number)
    return new Point(x!, y!)
  },
})

const colorType = customType<Color>({
  test: value => value instanceof Color,
  stringify: value => `${value.r},${value.g},${value.b}`,
  parse: (str) => {
    const [r, g, b] = str.split(",").map(Number)
    return new Color(r!, g!, b!)
  },
})

describe("custom types", () => {
  it("supports custom Point type", () => {
    const customJSON = new JSONMark({
      types: {
        Point: pointType,
      },
    })

    const data = { position: new Point(10, 20), name: "test" }
    const json = customJSON.stringify(data)
    const restored = customJSON.parse(json)

    expect(restored.position).toBeInstanceOf(Point)
    expect(restored.position.x).toBe(10)
    expect(restored.position.y).toBe(20)
    expect(restored.name).toBe("test")
  })

  it("supports multiple custom types", () => {
    const customJSON = new JSONMark({
      types: {
        Point: pointType,
        Color: colorType,
      },
    })

    const data = {
      position: new Point(10, 20),
      color: new Color(255, 128, 64),
      label: "marker",
    }
    const json = customJSON.stringify(data)
    const restored = customJSON.parse(json)

    expect(restored.position).toBeInstanceOf(Point)
    expect(restored.position.x).toBe(10)
    expect(restored.position.y).toBe(20)
    expect(restored.color).toBeInstanceOf(Color)
    expect(restored.color.r).toBe(255)
    expect(restored.color.g).toBe(128)
    expect(restored.color.b).toBe(64)
    expect(restored.label).toBe("marker")
  })

  it("custom types work with nested objects", () => {
    const customJSON = new JSONMark({
      types: {
        Point: pointType,
      },
    })

    const data = {
      shapes: [
        { center: new Point(0, 0), radius: 5 },
        { center: new Point(10, 10), radius: 3 },
      ],
    }
    const json = customJSON.stringify(data)
    const restored = customJSON.parse(json)

    expect(restored.shapes[0]?.center).toBeInstanceOf(Point)
    expect(restored.shapes[0]?.center.x).toBe(0)
    expect(restored.shapes[0]?.center.y).toBe(0)
    expect(restored.shapes[1]?.center).toBeInstanceOf(Point)
    expect(restored.shapes[1]?.center.x).toBe(10)
    expect(restored.shapes[1]?.center.y).toBe(10)
  })

  it("custom types work with prepare and restore", () => {
    const customJSON = new JSONMark({
      types: {
        Point: pointType,
      },
    })

    const data = { position: new Point(15, 25) }
    const prepared = customJSON.prepare(data)

    // Should be serializable with native JSON
    const json = JSON.stringify(prepared)
    expect(json).toBeTruthy()

    const parsed = JSON.parse(json)
    const restored = customJSON.restore<typeof data>(parsed)

    expect(restored.position).toBeInstanceOf(Point)
    expect(restored.position.x).toBe(15)
    expect(restored.position.y).toBe(25)
  })

  it("custom types coexist with built-in types", () => {
    const customJSON = new JSONMark({
      types: {
        Point: pointType,
      },
    })

    const data = {
      position: new Point(5, 10),
      id: 999n,
      buffer: new Uint8Array([1, 2, 3]),
      name: "mixed",
    }
    const json = customJSON.stringify(data)
    const restored = customJSON.parse(json)

    expect(restored.position).toBeInstanceOf(Point)
    expect(restored.position.x).toBe(5)
    expect(restored.position.y).toBe(10)
    expect(restored.id).toBe(999n)
    expect(restored.buffer).toBeInstanceOf(Uint8Array)
    expect(Array.from(restored.buffer)).toEqual([1, 2, 3])
    expect(restored.name).toBe("mixed")
  })

  it("custom type with default stringify (uses String())", () => {
    class SimpleValue {
      constructor(public value: string) {}
      toString() {
        return this.value
      }
    }

    const customJSON = new JSONMark({
      types: {
        SimpleValue: customType<SimpleValue>({
          test: value => value instanceof SimpleValue,
          // No stringify provided, should use String(value)
          parse: str => new SimpleValue(str),
        }),
      },
    })

    const data = { simple: new SimpleValue("hello") }
    const json = customJSON.stringify(data)
    const restored = customJSON.parse(json)

    expect(restored.simple).toBeInstanceOf(SimpleValue)
    expect(restored.simple.value).toBe("hello")
  })

  it("supports custom replacer with custom types", () => {
    const customJSON = new JSONMark({
      types: {
        Point: pointType,
      },
    })

    const data = { position: new Point(1, 2), filter: "me" }
    const json = customJSON.stringify(data, (key, value) => {
      if (key === "filter") {
        return undefined
      }
      return value
    })
    const restored = customJSON.parse(json)

    expect(restored.position).toBeInstanceOf(Point)
    expect(restored).not.toHaveProperty("filter")
  })

  it("supports custom reviver with custom types", () => {
    const customJSON = new JSONMark({
      types: {
        Point: pointType,
      },
    })

    const data = { position: new Point(3, 4), multiplier: 2 }
    const json = customJSON.stringify(data)
    const restored = customJSON.parse(json, (key, value) => {
      if (key === "multiplier") {
        return value * 10
      }
      return value
    })

    expect(restored.position).toBeInstanceOf(Point)
    expect(restored.multiplier).toBe(20)
  })
})
