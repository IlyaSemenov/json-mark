import { JSON as builtinJSON } from "./instance"

function pickMethods(JSON: JSON) {
  return {
    stringify: JSON.stringify,
    parse: JSON.parse,
  }
}

export const originalJSON: JSON = {
  ...JSON,
  ...pickMethods(JSON),
}

/**
 * Install the JSONMark methods into the global JSON object.
 */
export function install(newJSON: JSON = builtinJSON) {
  Object.assign(JSON, pickMethods(newJSON))
}

/**
 * Uninstall the overridden JSON methods from the global JSON object.
 */
export function uninstall() {
  Object.assign(JSON, pickMethods(originalJSON))
}
