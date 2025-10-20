import { builtinTypes } from "./builtins"
import { JSONMark } from "./JSONMark"

export const JSON = new JSONMark(builtinTypes)

export const { stringify, parse, prepare, restore } = JSON
