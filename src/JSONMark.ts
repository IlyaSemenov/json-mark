import { originalJSON } from "./install"
import type { JSONType } from "./transform"
import { parseValue, stringifyValue } from "./transform"

const objectTypeTag = Symbol("objectType")

/**
 * The final JSON string.
 */
export type StringifiedObject<T> = string & {
  [objectTypeTag]?: T
}

const valueTypeTag = Symbol("valueType")

/**
 * The inner string value created for a custom type value (for future final JSON stringification).
 */
export type StringifiedValue<T> = string & {
  [valueTypeTag]: T
}

export class JSONMark<TTypeMap extends Record<string, any> = Record<string, unknown>> implements JSON {
  constructor(private readonly types: {
    [K in keyof TTypeMap]: JSONType<TTypeMap[K]>
  }) {}

  get [Symbol.toStringTag]() {
    return "JSONMark"
  }

  stringify = <T>(
    obj: T,
    // TODO: support array replacer.
    replacer?: ((this: any, key: string, value: any) => any) | (string | number)[] | null,
    space?: string | number,
  ): StringifiedObject<T> => {
    const types = this.types
    return originalJSON.stringify(
      obj,
      function (key, value) {
        const stringifiedValue = stringifyValue(value, types)
        if (stringifiedValue !== value) {
          return stringifiedValue
        }
        if (typeof replacer === "function") {
          return replacer.call(this, key, value)
        }
        // TODO: support array replacer.
        return value
      },
      space,
    ) as StringifiedObject<T>
  }

  parse = <T>(
    text: StringifiedObject<T>,
    reviver?: (this: any, key: string, value: any) => any,
  ): T => {
    const types = this.types
    return originalJSON.parse(
      text,
      function (key, value) {
        const parsedValue = parseValue(value, types)
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

  prepare = <T>(obj: T): PrepareTypes<T, TTypeMap[keyof TTypeMap]> => {
    return originalJSON.parse(this.stringify(obj))
  }

  restore = <T>(obj: T): RestoreTypes<T> => {
    return this.parse(originalJSON.stringify(obj))
  }
}

/**
 * Recursively replace custom types with a type-tagged string.
 */
type PrepareTypes<T, CustomTypes>
  = T extends CustomTypes
    ? StringifiedValue<T>
    : T extends Array<infer U>
      ? Array<PrepareTypes<U, CustomTypes>>
      : T extends object
        ? { [K in keyof T]: PrepareTypes<T[K], CustomTypes> }
        : T

/**
 * Recursively replace type-tagged strings with the original type.
 */
type RestoreTypes<T>
  = T extends StringifiedValue<infer U>
    ? U
    : T extends Array<infer U>
      ? Array<RestoreTypes<U>>
      : T extends object
        ? { [K in keyof T]: RestoreTypes<T[K]> }
        : T
