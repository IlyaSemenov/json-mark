export interface RegisteredType<T> {
  marker: string
  test: (value: unknown) => boolean
  stringify?: (value: T) => string
  parse: (value: string) => T
}

export const registeredTypes = new Map<string, RegisteredType<any>>()

export function registerType<T>(type: RegisteredType<T>) {
  if (!isMarker(type.marker)) {
    throw new Error(`Invalid marker ${type.marker}.`)
  }
  if (registeredTypes.has(type.marker)) {
    throw new Error(`JSON value type with marker ${type.marker} already registered.`)
  }
  registeredTypes.set(type.marker, type)
}

export function isMarker(marker: string) {
  return marker.length === 1 && marker >= "\uE000" && marker <= "\uF8FF"
}

export function startsWithMarker(value: string) {
  return value.length >= 1 && isMarker(value[0]!)
}
