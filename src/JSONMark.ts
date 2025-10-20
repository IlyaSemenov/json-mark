import { builtinTypes } from "./builtins"
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
   * @default "="
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
  marker: "=",
  delimiter: ":",
}

export type TypeRegistry<T> = Record<string, CustomType<T>>

export type BuiltinTypeMap = {
  [K in keyof typeof builtinTypes]: typeof builtinTypes[K] extends CustomType<infer U> ? U : never
}

// Infer TCustomTypeMap (typeName → type) from the types option (TypeRegistry).
export class JSONMark<TCustomTypeMap extends Record<string, any> = object> implements JSON {
  constructor(
    options?: Partial<JSONMarkOptions> & {
      types?: { [K in keyof TCustomTypeMap]: CustomType<TCustomTypeMap[K]> }
    },
  ) {
    const { types, ...restOptions } = options ?? {}
    this.options = { ...defaultOptions, ...restOptions }
    this.types = {
      ...builtinTypes,
      ...types,
    }
  }

  readonly options: JSONMarkOptions
  readonly types: TypeRegistry<any>

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
      const type = this.types[typeName]
      if (type) {
        return type.parse(stringifiedValue, this.options)
      }
    }
    return value
  }

  prepare = <T>(obj: T) => {
    type TypeMap = Omit<BuiltinTypeMap, keyof TCustomTypeMap> & TCustomTypeMap
    return originalJSON.parse(this.stringify(obj)) as PrepareTypes<T, TypeMap[keyof TypeMap]>
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
    ? T extends (number | boolean | null) ? (T | StringifiedValue<T>) : StringifiedValue<T>
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
