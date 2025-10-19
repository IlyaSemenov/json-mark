import { originalJSON } from "./install"
import { parse, stringify } from "./stringify"

/**
 * Registry of custom types that will be converted to `string` in the output type of `prepare`.
 *
 * Extend this interface via module augmentation to add your own custom types.
 *
 * @example
 * declare module 'json-mark' {
 *   interface CustomTypesRegistry {
 *     MyCustomType: MyCustomType
 *   }
 * }
 */
export interface CustomTypesRegistry {
  bigint: bigint
  Uint8Array: Uint8Array
}

type CustomTypes = CustomTypesRegistry[keyof CustomTypesRegistry]

const tag = Symbol("json-mark")

export type MarkedString<T> = string & {
  [tag]: T
}

/**
 * Recursively replace custom types with a CustomValue tagged string.
 */
type PrepareTypes<T>
  = T extends CustomTypes
    ? MarkedString<T>
    : T extends Array<infer U>
      ? Array<PrepareTypes<U>>
      : T extends object
        ? { [K in keyof T]: PrepareTypes<T[K]> }
        : T

/**
 * Recursively replace CustomValue tagged strings with the original type.
 */
type RestoreTypes<T>
  = T extends MarkedString<infer U>
    ? U
    : T extends Array<infer U>
      ? Array<RestoreTypes<U>>
      : T extends object
        ? { [K in keyof T]: RestoreTypes<T[K]> }
        : T

/**
 * Prepare object for external serialization with JSON.stringify().
 */
export function prepare<T>(obj: T): PrepareTypes<T> {
  return originalJSON.parse(stringify(obj))
}

/**
 * Restore the original data from an object deserialized with JSON.parse().
 */
export function restore<T>(obj: T): RestoreTypes<T> {
  return parse(originalJSON.stringify(obj))
}
