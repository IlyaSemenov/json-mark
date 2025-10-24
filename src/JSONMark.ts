import { builtinTypes } from "./builtins"
import type { CustomType } from "./customType"
import { originalJSON } from "./install"

const typeTag = Symbol("type")

/**
 * The final JSON string, tagged with the original type.
 */
export type StringifiedObject<T> = string & {
  [typeTag]?: T
}

export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue }

/**
 * The "prepared" value (i.e., a JSON-compatible value ready for external serialization), tagged with the original type.
 */
export type PreparedObject<T> = JSONValue & {
  [typeTag]?: T
}

export interface JSONMarkOptions {
  /**
   * The marker prefix for custom types.
   *
   * @default "="
   */
  marker: string
  /**
   * The delimiter between the custom type ID and the stringified value.
   *
   * @default ":"
   */
  delimiter: string
  /**
   * The type registry (typeName → CustomType definition).
   */
  types: TypeRegistry
}

const defaultOptions: JSONMarkOptions = {
  marker: "=",
  delimiter: ":",
  types: builtinTypes,
}

export type TypeRegistry = Record<string, CustomType<any>>

export class JSONMark implements JSON {
  constructor(options?: Partial<JSONMarkOptions>) {
    const { types, ...restOptions } = { ...defaultOptions, ...options }
    this.options = {
      ...defaultOptions,
      ...restOptions,
      types: {
        ...defaultOptions.types,
        ...types,
      },
    }
  }

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
    for (const [typeName, { test, stringify }] of Object.entries(this.options.types)) {
      if (test(value, this.options)) {
        // TODO also try toJSON() if stringify is not provided.
        const payload = stringify ? stringify(value, this.options) : String(value)
        return this.options.marker + typeName + (payload ? (this.options.delimiter + payload) : "")
      }
    }
    return value
  }

  #parseValue = (value: unknown): unknown => {
    if (typeof value === "string" && value.startsWith(this.options.marker)) {
      const delimiterIndex = value.indexOf(this.options.delimiter)
      const [typeName, stringifiedValue] = delimiterIndex > 0
        ? [value.slice(1, delimiterIndex), value.slice(delimiterIndex + 1)]
        : [value.slice(1), ""]
      const type = this.options.types[typeName]
      if (type) {
        return type.parse(stringifiedValue, this.options)
      }
    }
    return value
  }

  prepare: {
    (obj: null): null
    <T>(obj: T): PreparedObject<T>
  } = (obj: unknown) => {
    return originalJSON.parse(this.stringify(obj))
  }

  restore: {
    (obj: null): null
    <T>(obj: PreparedObject<T>): T
    (obj: unknown): unknown
  } = <T>(obj: PreparedObject<T> | null | unknown): T | null => {
    return this.parse(originalJSON.stringify(obj))
  }
}
