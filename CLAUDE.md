# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

This is a Deno lint plugin that detects and automatically fixes unnecessary type
assertions in TypeScript code. The plugin identifies redundant type assertions
such as:

- Same-type assertions: `(variable as Type)` when variable is already `Type`
- Literal type assertions: `<number>42`, `"hello" as string`
- Property access assertions: `(obj as Type).prop` → `obj.prop`
- Non-null assertions: `value!` when value is not nullable
- Type assertions to `any` when accessing existing properties

## Key Commands

```bash
# Run tests
deno task test

# Run tests in watch mode for development
deno task test:watch

# Lint the codebase
deno task lint

# Lint test fixtures specifically
deno task lint:fixtures

# Run a single test file
deno test tests/no-unnecessary-type-assertion.test.ts --allow-read --no-check
```

## Architecture

The plugin follows Deno's lint plugin architecture:

1. **Entry Point**: `plugin.ts` - Exports the plugin with its rules
2. **Rule Implementation**: `rules/no-unnecessary-type-assertion.ts` - Contains
   the AST visitor pattern implementation that:
   - Tracks type information from declarations
   - Detects various patterns of unnecessary assertions
   - Provides automatic fixes by removing redundant syntax
3. **Testing**: Tests use Deno's built-in test runner with `@std/assert` for
   assertions

The rule uses an AST visitor pattern to:

- Track type aliases, variable declarations, class declarations, and interface
  definitions
- Build a type information map during traversal
- Check type assertions against tracked type information
- Generate fixes that preserve the underlying expression while removing
  unnecessary assertion syntax

## Development Notes

- The plugin is self-dogfooding: it's configured to lint itself in `deno.json`
- Test fixtures in `/tests/fixtures/` demonstrate all supported detection
  patterns
- When modifying the rule, ensure all 13 unit tests pass
- The rule supports both angle bracket (`<Type>`) and `as` syntax for type
  assertions
