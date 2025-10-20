# json-mark

A TypeScript utility library that extends JSON serialization to support custom types:

- `bigint`
- `Uint8Array` and other typed arrays
- `RegExp`
- special numbers (`NaN`, `Infinity`, `-Infinity`)
- any other custom type given the respective serializer callback

`json-mark` encodes type information directly in JSON strings using a configurable marker character followed by a string type name:

```text
123456789n → "=bigint:123456789"
```

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

// Serialize objects with extended types
const data = {
  id: 123456789012345678901234567890n,
  buffer: new Uint8Array([1, 2, 3, 4, 5]),
  pattern: /test/gi,
  special: Number.NaN,
  name: "test"
}

const json = stringify(data)
const restored = parse(json)

console.log(restored.id) // 123456789012345678901234567890n
console.log(restored.buffer) // Uint8Array([1, 2, 3, 4, 5])
console.log(restored.pattern) // /test/gi
console.log(Number.isNaN(restored.special)) // true
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

## Adding Custom Types

You can extend custom `JSONMark` instances with your own types.

```ts
import { customType, JSONMark } from "json-mark"

// Define a custom type
class Point {
  constructor(public x: number, public y: number) {}
}

// Create custom instance with your custom types (built-in types are auto-included)
const customJSON = new JSONMark({
  types: {
    Point: customType<Point>({
      test: value => value instanceof Point,
      stringify: value => `${value.x},${value.y}`,
      parse: (str) => {
        const [x, y] = str.split(",").map(Number)
        return new Point(x!, y!)
      },
    }),
  },
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
import { install, JSONMark } from "json-mark"

const customJSON = new JSONMark({
  types: {
    MyType: myCustomType,
  },
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

json-mark encodes values as strings using the following pattern:

```text
<marker><typeName><delimiter><payload>
```

- **marker**: a single character. Defaults to `=`. Configurable.
- **typeName**: a string key identifying the type (e.g., `bigint`, `Uint8Array`, `Point`).
- **delimiter**: a separator character between the type and payload. Defaults to `:`. Configurable.
- **payload**: the stringified value for that type.

Examples with the default configuration (marker `=`, delimiter `:`):

```text
123n → "=bigint:123"
new Uint8Array([1, 2, 3]) → "=Uint8Array:AQID" (base64)
/test/gi → "=RegExp:test|gi"
Infinity → "=Infinity" (no delimiter for empty payload)
```

Deserialization reverses the process when a string starts with the configured marker:

```text
"=bigint:123" → 123n
"=Uint8Array:AQID" → new Uint8Array([1, 2, 3])
"=RegExp:test|gi" → /test/gi
"=Infinity" → Infinity
```

Escaping: regular strings that start with the marker are encoded via the built-in `string` type to avoid ambiguity:

```text
"=hello" → "=string:=hello" → parse → "=hello"
```

### Using Custom Marker and Delimiter

You can customize the marker and delimiter. For example, to minimize escaping overhead, you could pick a Unicode Private Use Area (PUA) character for the marker:

```ts
import { JSONMark } from "json-mark"

const customJSON = new JSONMark({
  marker: "\uEEEE",
  delimiter: "|",
})
```

```text
123n → "\uEEEEbigint|123"
```

## TypeScript Support

json-mark is written in TypeScript and provides type inference for the values:

```ts
import { parse, prepare, restore, stringify } from "json-mark"

const data = { id: 123n, name: "test" }

// `stringified` is a string (tagged with the original type).
const stringified = stringify(data)

// `prepared` is JSONValue (tagged with the original type).
const prepared = prepare(data)

// Both of these will have the original type:
const restored1 = parse(stringified)
const restored2 = restore(prepared)
```

When passing prepared data through the native `JSON.stringify` and `JSON.parse`, you will need to cast manually:

```ts
import { prepare, restore } from "json-mark"

const data = { id: 123n, name: "test" }

// `prepared` is JSONValue (tagged with the original type).
const prepared = prepare(data)

const json = JSON.stringify(prepared) // returns string
const parsed = JSON.parse(json) // returns any

// Manually restore the type:
const restored = restore(parsed) as typeof data
// or:
const restored = restore<typeof data>(parsed)
```

## License

MIT © Ilya Semenov

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
