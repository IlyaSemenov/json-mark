import { parse, stringify } from "./stringify"

const tag = Symbol("original")

export const JSONMaybeInstalled = JSON as JSON & {
  [tag]?: JSON
}

/**
 * Install the overridden JSON methods into the global JSON object.
 */
export function install() {
  if (!JSONMaybeInstalled[tag]) {
    JSONMaybeInstalled[tag] = { ...JSON, stringify: JSON.stringify, parse: JSON.parse }
    Object.assign(JSONMaybeInstalled, { stringify, parse })
  }
}

/**
 * Uninstall the overridden JSON methods from the global JSON object.
 */
export function uninstall() {
  if (JSONMaybeInstalled[tag]) {
    Object.assign(JSONMaybeInstalled, JSONMaybeInstalled[tag])
    delete JSONMaybeInstalled[tag]
  }
}

/**
 * Proxy object that always exposes the original JSON stringify and parse methods
 * (whether it was upgraded or not).
 */
export const originalJSON = new Proxy({} as JSON, {
  get(target, prop) {
    const original = JSONMaybeInstalled[tag] ?? JSON
    return original[prop as keyof JSON]
  },
})
