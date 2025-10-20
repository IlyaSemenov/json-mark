# json-mark

A TypeScript utility library that extends JSON serialization to support custom types like `bigint` and `Uint8Array`.

`json-mark` uses Private Use Area (PUA) Unicode characters to encode type information directly in JSON strings, enabling seamless serialization and deserialization of non-standard JavaScript types.

## Use Cases

- **Database**: Persist `bigint` and other types in JSON fields
- **API communication**: Send custom types over JSON APIs
- **Testing**: Snapshot testing with custom types
- **Inter-process communication**: Send custom types between Node.js processes
- **Websocket messages**: Transmit custom types in real-time apps

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
- Automatically serializes/deserializes custom types
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

### `JSON`

The default `JSON` instance that supports `stringify`, `parse`, `prepare`, and `restore` methods:

```ts
import { JSON } from "json-mark"

const json = JSON.stringify(obj)
const parsed = JSON.parse(json)

const prepared = JSON.prepare(obj)
const restored = JSON.restore(obj)
```

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

## Adding Custom Types

You can create custom `JSONMark` instances with your own types.

### Creating a Custom Instance

```ts
import { builtinTypes, customType, JSONMark } from "json-mark"

// Define a custom type
class Point {
  constructor(public x: number, public y: number) {}
}

// Create custom instance with built-in types + Point
const customJSON = new JSONMark({
  ...builtinTypes,
  // Create a custom type and assign it to use an unique PUA character (\uE000-\uF8FF)
  "\uEE10": customType<Point>({
    test: value => value instanceof Point,
    stringify: value => `${value.x},${value.y}`,
    parse: (str) => {
      const [x, y] = str.split(",").map(Number)
      return new Point(x!, y!)
    },
  }),
})

// Use it
const data = { position: new Point(10, 20) }
const json = customJSON.stringify(data)
const restored = customJSON.parse(json)
// restored.position is Point { x: 10, y: 20 }
```

**Type Handler Interface:**

```ts
interface CustomType<T> {
  test: (value: unknown) => boolean
  stringify?: (value: T) => string // Optional, defaults to String(value)
  parse: (value: string) => T
}
```

**Parameters:**

- `test`: Function that returns `true` if a value is of this type
- `stringify` (optional): Function to convert the value to a string (defaults to `String(value)`)
- `parse`: Function to convert the string back to the original type

## Global JSON Override: `install()` and `uninstall()`

You can monkey-patch the global `JSON` object to make custom type support transparent throughout your application:

### `install(instance?)`

Replaces global `JSON.stringify` and `JSON.parse` with json-mark's enhanced versions. By default, installs the built-in instance:

```ts
import { install } from "json-mark"

// Install with built-in types
install()

// Now the global JSON object supports custom types
const data = { id: 123n, buffer: new Uint8Array([1, 2, 3]) }
const json = JSON.stringify(data) // Works!
const restored = JSON.parse(json) // Works!
console.log(restored.id) // 123n
```

Or install a custom instance with additional types:

```ts
import { builtinTypes, install, JSONMark } from "json-mark"

const customJSON = new JSONMark({
  ...builtinTypes,
  "\uEE10": myCustomType,
})

install(customJSON)
```

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
import { parse, prepare, restore, stringify } from "json-mark"

const data = { id: 123n, name: "test" }

// `stringified` is a string
const stringified = stringify(data)

// `prepared` is { id: string, name: string }
const prepared = prepare(data)

// Both of these will have the original type:
const restored1 = parse(stringified)
const restored2 = restore(prepared)
```

When you create a custom `JSONMark` instance, the custom types are also tracked through the revive cycle.

## License

MIT © Ilya Semenov

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
