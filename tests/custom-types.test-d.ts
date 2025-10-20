import { customType, JSONMark } from "json-mark"
import { expectTypeOf, test } from "vitest"

class Point {
  constructor(public x: number, public y: number) {}
}

const pointType = customType<Point>({
  test: value => value instanceof Point,
  stringify: value => `${value.x},${value.y}`,
  parse: (str) => {
    const [x, y] = str.split(",").map(Number)
    return new Point(x!, y!)
  },
})

test("custom JSONMark stringify returns string", () => {
  const customJSON = new JSONMark({
    types: {
      Point: pointType,
    },
  })

  const data = { position: new Point(10, 20) }
  const result = customJSON.stringify(data)
  expectTypeOf(result).toBeString()
})

test("round-trip with custom type preserves type", () => {
  const customJSON = new JSONMark({
    types: {
      Point: pointType,
    },
  })

  const original = {
    position: new Point(10, 20),
    id: 123n,
    name: "test",
  }

  const json = customJSON.stringify(original)
  const restored = customJSON.parse(json)

  expectTypeOf(restored).toEqualTypeOf<typeof original>()
})
