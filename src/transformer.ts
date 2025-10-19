import { registeredTypes, startsWithMarker } from "./registry"

export function stringifyValue<T>(value: T): T | string {
  for (const [marker, type] of registeredTypes.entries()) {
    if (type.test(value)) {
      return marker + (type.stringify ? type.stringify(value) : String(value))
    }
  }
  return value
}

export function parseValue(value: unknown): unknown {
  if (typeof value === "string" && startsWithMarker(value)) {
    const marker = value[0]!
    const type = registeredTypes.get(marker)
    if (type) {
      return type.parse(value.slice(1))
    }
  }
  return value
}
