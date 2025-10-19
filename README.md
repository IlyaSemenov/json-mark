# json-mark

A TypeScript utility library that extends JSON serialization to support custom types like `bigint` and `Uint8Array`.

`json-mark` uses Private Use Area (PUA) Unicode characters to encode type information directly in JSON strings, enabling seamless serialization and deserialization of non-standard JavaScript types.

## Installation

```sh
npm install json-mark
```

## Quick Start

```ts
import { parse, stringify } from "json-mark"

// Serialize objects with bigint and Uint8Array
const data = {
  id: 123456789012345678901234567890n,
  buffer: new Uint8Array([1, 2, 3, 4, 5]),
  name: "test"
}

const json = stringify(data)
const restored = parse(json)

console.log(restored.id) // 123456789012345678901234567890n
console.log(restored.buffer) // Uint8Array([1, 2, 3, 4, 5])
```

## API Overview

### `stringify()` and `parse()`

Use these as drop-in replacements for `JSON.stringify()` and `JSON.parse()` with extended type support:

```ts
import { parse, stringify } from "json-mark"

// stringify supports the same signature as JSON.stringify
const json = stringify(obj)

// parse supports the same signature as JSON.parse
const obj = parse(json)
```

**Features:**

- Handles all standard JSON types
- Automatically serializes/deserializes custom registered types
- Supports `replacer` and `reviver` functions
- Supports pretty-printing with `space` parameter

### `prepare()` and `restore()`

For scenarios where you need to use native `JSON.stringify()` and `JSON.parse()` (e.g., when passing data to external APIs or libraries):

```ts
import { prepare, restore } from "json-mark"

const data = {
  id: 123n,
  buffer: new Uint8Array([1, 2, 3])
}

// Convert custom types to marked strings
const prepared = prepare(data)

// Now safe to use with native JSON
const json = JSON.stringify(prepared)
const parsed = JSON.parse(json)

// Restore original types
const restored = restore(parsed)
console.log(restored.id) // 123n (bigint)
console.log(restored.buffer) // Uint8Array([1, 2, 3])
```

**Type Safety:** Both `prepare()` and `restore()` are fully type-safe. TypeScript will correctly transform custom types to a branded `string` and back.

## Built-in Types

`json-mark` comes with built-in support for the following types:

### `bigint`

```ts
import { parse, stringify } from "json-mark"

const data = { largeNumber: 9007199254740991n }
const json = stringify(data)
const restored = parse(json)
// restored.largeNumber is bigint
```

### `Uint8Array`

```ts
import { parse, stringify } from "json-mark"

const data = { buffer: new Uint8Array([255, 128, 64]) }
const json = stringify(data)
const restored = parse(json)
// restored.buffer is Uint8Array
```

**Note:** Built-in types are automatically registered when you import from `json-mark`. If your bundler tree-shakes the side effect, see [Manual Registration](#manual-registration-of-built-in-types) below.

## Registering Custom Types

You can register your own custom types to extend json-mark's serialization capabilities.

### Runtime Registration

Use `registerType()` to register a new type at runtime:

```ts
import { parse, registerType, stringify } from "json-mark"

// Define a custom type
class Point {
  constructor(public x: number, public y: number) {}
}

// Register the type
registerType<Point>({
  marker: "\uEE10", // Must be a PUA character (\uE000-\uF8FF)
  test: value => value instanceof Point,
  stringify: value => `${value.x},${value.y}`,
  parse: (str) => {
    const [x, y] = str.split(",").map(Number)
    return new Point(x, y)
  }
})

// Now you can serialize Point instances
const data = { position: new Point(10, 20) }
const json = stringify(data)
const restored = parse(json)
// restored.position is Point { x: 10, y: 20 }
```

**Parameters:**

- `marker`: A single PUA Unicode character (\uE000-\uF8FF) that uniquely identifies this type
- `test`: Function that returns `true` if a value is of this type
- `stringify` (optional): Function to convert the value to a string (defaults to `String(value)`)
- `parse`: Function to convert the string back to the original type

### Type-Level Registration with Module Augmentation

To get full TypeScript support with `prepare()` and `restore()`, augment the `CustomTypesRegistry` interface:

```ts
import { prepare, registerType, restore } from "json-mark"

class Point {
  constructor(public x: number, public y: number) {}
}

// 1. Register at runtime
registerType<Point>({
  marker: "\uEE10",
  test: value => value instanceof Point,
  stringify: value => `${value.x},${value.y}`,
  parse: (str) => {
    const [x, y] = str.split(",").map(Number)
    return new Point(x, y)
  }
})

// 2. Augment the type registry
declare module "json-mark" {
  interface CustomTypesRegistry {
    Point: Point
  }
}

// Now prepare() and restore() are fully type-safe
const data = { position: new Point(10, 20), name: "origin" }
const prepared = prepare(data)
// prepared.position is MarkedString<Point>
// prepared.name is string

const restored = restore(prepared)
// restored.position is Point
// restored.name is string
```

## Manual Registration of Built-in Types

If your bundler tree-shakes the automatic side effect registration (e.g., when using specific bundler configurations), you can manually register built-in types:

```ts
import { registerBuiltinTypes } from "json-mark"

// Call this once at your application entry point
registerBuiltinTypes()
```

This explicitly registers `bigint`, `Uint8Array`, and the string escaping mechanism.

**When do you need this?**

- When you import from `json-mark` but built-in types don't work
- When your bundler removes side effects despite the `sideEffects` field in `package.json`
- When you want explicit control over when types are registered

## Global JSON Override: `install()` and `uninstall()`

You can monkey-patch the global `JSON` object to make custom type support transparent throughout your application:

### `install()`

Replaces global `JSON.stringify` and `JSON.parse` with json-mark's enhanced versions:

```ts
import { install } from "json-mark"

// Install enhanced JSON globally
install()

// Now the global JSON object supports custom types
const data = { id: 123n, buffer: new Uint8Array([1, 2, 3]) }
const json = JSON.stringify(data) // Works!
const restored = JSON.parse(json) // Works!
console.log(restored.id) // 123n
```

**Features:**

- Makes custom type support available everywhere
- Safe to call multiple times (won't double-install)
- Can be useful for testing or when you control the entire application

### `uninstall()`

Restores the original native `JSON` methods:

```ts
import { install, uninstall } from "json-mark"

install()
// ... use enhanced JSON ...
uninstall()

// Now JSON is back to native behavior
// JSON.stringify({ num: 123n }) // throws TypeError
```

### `originalJSON`

Access the original native JSON methods even when `install()` is active:

```ts
import { install, originalJSON } from "json-mark"

install()

// This uses json-mark's enhanced version
JSON.stringify({ id: 123n }) // Works

// This uses the native version
originalJSON.stringify({ id: 123n }) // Throws TypeError
```

**Use case:** When you need native JSON behavior even in an environment where json-mark is installed globally.

## How It Works

json-mark uses [Private Use Area (PUA)](https://en.wikipedia.org/wiki/Private_Use_Areas) Unicode characters (U+E000 to U+F8FF) as markers to encode type information:

1. **During serialization**: Custom values are converted to strings prefixed with a PUA marker:

   ```text
   123n → "\uEE01123"
   new Uint8Array([1, 2]) → "\uEE02AQI=" (base64)
   ```

2. **During deserialization**: Strings starting with PUA markers are converted back to their original types:

   ```text
   "\uEE01123" → 123n
   "\uEE02AQI=" → new Uint8Array([1, 2])
   ```

3. **Escaping**: Regular strings that happen to start with PUA markers are automatically escaped to prevent conflicts.

**Built-in markers:**

- `\uEE00`: String escaping mechanism
- `\uEE01`: `bigint`
- `\uEE02`: `Uint8Array`
- `\uEE10`-`\uF8FF`: Available for your custom types

## TypeScript Support

json-mark is written in TypeScript and provides full type safety:

```ts
import { prepare, restore } from "json-mark"
import type { MarkedString } from "json-mark"

const data = { id: 123n, name: "test" }

const prepared = prepare(data)
// Type: { id: MarkedString<bigint>, name: string }

const restored = restore(prepared)
// Type: { id: bigint, name: string }
```

For custom types, use module augmentation to get the same type safety (see [Type-Level Registration](#type-level-registration-with-module-augmentation)).

## Use Cases

- **Database drivers**: Serialize `bigint` IDs and `Uint8Array` buffers
- **API communication**: Send custom types over JSON APIs
- **State management**: Store complex types in JSON-based state
- **Testing**: Snapshot testing with custom types
- **Inter-process communication**: Send custom types between Node.js processes
- **WebSocket messages**: Transmit custom types in real-time apps

## License

MIT © Ilya Semenov

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
