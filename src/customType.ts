import type { JSONMarkOptions } from "./JSONMark"

export interface CustomType<T> {
  test: (value: unknown, options: JSONMarkOptions) => boolean
  stringify?: (value: T, options: JSONMarkOptions) => string
  parse: (value: string, options: JSONMarkOptions) => T
}

export function customType<T>(type: CustomType<T>) {
  return type
}
