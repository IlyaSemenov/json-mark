import type { CustomType } from "./customType"
import { originalJSON } from "./install"

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

export interface JSONMarkOptions {
  /**
   * The marker prefix for custom types.
   *
   * @default "\uEEEE" // a Unicode Private Use Area character that is not likely to be used in normal JSON strings
   */
  marker: string
  /**
   * The delimiter between the custom type ID and the stringified value.
   *
   * @default ":"
   */
  delimiter: string
}

const defaultOptions: JSONMarkOptions = {
  marker: "\uEEEE",
  delimiter: ":",
}

type TypeRegistry<T = unknown> = Record<string, CustomType<T>>

export class JSONMark<TTypeMap extends Record<string, any> = Record<string, unknown>> implements JSON {
  constructor(types: {
    [K in keyof TTypeMap]: CustomType<TTypeMap[K]>
  }, options?: Partial<JSONMarkOptions>) {
    this.options = { ...defaultOptions, ...options }
    this.types = {
      string: {
        test: value => typeof value === "string" && value.startsWith(this.options.marker),
        parse: value => value,
      },
      ...types,
    }
  }

  readonly types: TypeRegistry<any>
  readonly options: JSONMarkOptions

  get [Symbol.toStringTag]() {
    return "JSONMark"
  }

  stringify = <T>(
    obj: T,
    // TODO: support array replacer.
    replacer?: ((this: any, key: string, value: any) => any) | (string | number)[] | null,
    space?: string | number,
  ): StringifiedObject<T> => {
    const stringifyValue = this.#stringifyValue
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
    const parseValue = this.#parseValue
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

  #stringifyValue = (value: unknown): unknown => {
    for (const [typeName, { test, stringify }] of Object.entries(this.types)) {
      if (test(value)) {
        return this.options.marker + typeName + this.options.delimiter + (stringify ?? String)(value)
      }
    }
    return value
  }

  #parseValue = (value: unknown): unknown => {
    if (typeof value === "string" && value.startsWith(this.options.marker)) {
      const delimiterIndex = value.indexOf(this.options.delimiter)
      if (delimiterIndex > 0) {
        const typeName = value.slice(1, delimiterIndex)
        const type = this.types[typeName]
        if (type) {
          return type.parse(value.slice(delimiterIndex + 1))
        }
      }
    }
    return value
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
