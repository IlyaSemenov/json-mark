import { originalJSON } from "./install"
import { parseValue, stringifyValue } from "./transformer"

const tag = Symbol("type")

export type StringifiedJson<T> = string & {
  [tag]?: T
}

export function stringify<T>(
  obj: T,
  // TODO: support array replacer.
  replacer?: ((this: any, key: string, value: any) => any) | null,
  space?: string | number,
): StringifiedJson<T> {
  return originalJSON.stringify(
    obj,
    function (key, value) {
      const stringifiedValue = stringifyValue(value)
      if (stringifiedValue !== value) {
        return stringifiedValue
      }
      if (typeof replacer === "function") {
        return replacer.call(this, key, value)
      }
      return value
    },
    space,
  ) as StringifiedJson<T>
}

export function parse<T>(
  text: StringifiedJson<T>,
  reviver?: (this: any, key: string, value: any) => any,
): T {
  return originalJSON.parse(
    text,
    function (key, value) {
      const parsedValue = parseValue(value)
      if (parsedValue !== value) {
        return parsedValue
      }
      if (typeof reviver === "function") {
        return reviver.call(this, key, value)
      }
      return value
    },
  )
}
