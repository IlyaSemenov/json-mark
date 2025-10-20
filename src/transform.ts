export interface JSONType<T> {
  test: (value: unknown) => boolean
  stringify?: (value: T) => string
  parse: (value: string) => T
}

export function customType<T>(type: JSONType<T>) {
  return type
}

export type TypeRegistry = Record<string, JSONType<any>>

export function isMarker(marker: string) {
  return marker.length === 1 && marker >= "\uE000" && marker <= "\uF8FF"
}

export function startsWithMarker(value: string) {
  return value.length >= 1 && isMarker(value[0]!)
}

export function stringifyValue<T>(value: T, types: TypeRegistry): T | string {
  for (const [marker, { test, stringify }] of Object.entries(types)) {
    if (test(value)) {
      return marker + (stringify ?? String)(value)
    }
  }
  return value
}

export function parseValue(value: unknown, types: TypeRegistry): unknown {
  if (typeof value === "string" && startsWithMarker(value)) {
    const marker = value[0]!
    const type = types[marker]
    if (type) {
      return type.parse(value.slice(1))
    }
  }
  return value
}
