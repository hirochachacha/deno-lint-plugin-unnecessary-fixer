# Deno Lint Plugin - Unnecessary Code Fixer

A Deno lint plugin that detects and automatically fixes unnecessary code
patterns in TypeScript, including redundant type assertions, boolean
comparisons, and type conversions.

## Features

This plugin provides three rules to clean up your TypeScript code:

### 1. **no-unnecessary-type-assertion**

Detects when types are asserted unnecessarily:

- Same type assertions: `(variable as Type)` when variable is already `Type`
- Literal type assertions: `<number>42`, `"hello" as string`
- Property access assertions: `(obj as Type).prop` → `obj.prop`
- Non-null assertions: `value!` when value is not nullable
- Type assertions on expressions that already produce the target type

### 2. **no-unnecessary-boolean-literal-compare**

Detects unnecessary boolean literal comparisons:

- `someCondition === true` → `someCondition`
- `someCondition !== true` → `!someCondition`
- `someCondition === false` → `!someCondition`
- `someCondition !== false` → `someCondition`

### 3. **no-unnecessary-type-conversion**

Detects redundant type conversions:

- `String('text')` → `'text'`
- `'text'.toString()` → `'text'`
- `Number(123)` → `123`
- `+123` → `123`
- `Boolean(true)` → `true`
- `!!true` → `true`
- Empty string concatenations: `'' + 'text'` → `'text'`

## Installation

1. Configure your `deno.json` to include the plugin:

```json
{
  "lint": {
    "plugins": ["jsr:@hirochachacha/deno-lint-plugin-unnecessary-fixer"],
    "rules": {
      "include": [
        "unnecessary-fixer/no-unnecessary-type-assertion",
        "unnecessary-fixer/no-unnecessary-boolean-literal-compare",
        "unnecessary-fixer/no-unnecessary-type-conversion"
      ]
    }
  }
}
```

## Usage

Run the linter on your code:

```bash
# Lint a specific file
deno lint your-file.ts

# Lint all files in a directory
deno lint src/

# Auto-fix issues (when Deno supports it)
deno lint --fix
```

## Examples

### Unnecessary Same-Type Assertions

```typescript
// Before
type User = { name: string };
const user: User = { name: "Alice" };
console.log((user as User).name);

// After
console.log(user.name);
```

### Unnecessary Literal Type Assertions

```typescript
// Before
const num = <number> 42;
const str = "hello" as string;

// After
const num = 42;
const str = "hello";
```

### Unnecessary Property Access Assertions

```typescript
// Before
interface Person {
  name: string;
}
const person: Person = { name: "Bob" };
console.log((person as Person).name);

// After
console.log(person.name);
```

### Unnecessary Non-Null Assertions

```typescript
// Before
const value = "hello"!;
const num = 42!;

// After
const value = "hello";
const num = 42;
```

## Development

### Running Tests

```bash
# Run all tests
deno task test

# Run tests in watch mode
deno task test:watch
```

### Project Structure

```
.
├── src/
│   ├── plugin.ts                          # Main plugin entry
│   └── rules/
│       └── no-unnecessary-type-assertion.ts  # Rule implementation
├── tests/
│   ├── no-unnecessary-type-assertion.test.ts # Unit tests
│   └── fixtures/                          # Test fixtures
├── docs/
│   └── how-it-works/                      # Documentation
└── examples/                              # Example files
```

## License

MIT
