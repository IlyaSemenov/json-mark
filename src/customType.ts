export interface CustomType<T> {
  test: (value: unknown) => boolean
  stringify?: (value: T) => string
  parse: (value: string) => T
}

export function customType<T>(type: CustomType<T>) {
  return type
}

export type TypeRegistry = Record<string, CustomType<any>>
