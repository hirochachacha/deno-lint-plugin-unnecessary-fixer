# Unnecessary Type Assertion Examples

This document shows how the `no-unnecessary-type-assertion` rule detects and
fixes redundant type assertions.

## Examples

### Unnecessary assertion to same type

**Before:**

```typescript
type A = { a: string };
const a: A = { a: "test" };
console.log((a as A).a); // Unnecessary - 'a' is already type 'A'
```

**After:**

```typescript
type A = { a: string };
const a: A = { a: "test" };
console.log(a.a);
```

### Unnecessary assertion for class instance

**Before:**

```typescript
class B {
  b: string;
  constructor() {
    this.b = "test";
  }
}
const b = new B();
console.log((b as B).b); // Unnecessary - 'b' is already type 'B'
```

**After:**

```typescript
class B {
  b: string;
  constructor() {
    this.b = "test";
  }
}
const b = new B();
console.log(b.b);
```

### Older TypeScript syntax

**Before:**

```typescript
const x: MyType = getValue();
const result = (<MyType> x).property; // Unnecessary assertion
```

**After:**

```typescript
const x: MyType = getValue();
const result = x.property;
```

## Cases NOT Flagged

### Assertion to 'any' for non-existent properties

```typescript
const a: A = { a: "test" };
console.log((a as any).unknownProp); // OK - property doesn't exist on type A
```

## New: Assertion to 'any' for Existing Properties

### Unnecessary assertion to 'any' when property exists

**Before:**

```typescript
type A = { a: string };
const a: A = { a: "test" };
console.log((a as any).a); // Unnecessary - property 'a' exists on type A
```

**After:**

```typescript
type A = { a: string };
const a: A = { a: "test" };
console.log(a.a);
```

### Class instance assertion to 'any'

**Before:**

```typescript
class B {
  b: string;
  constructor() {
    this.b = "test";
  }
}
const b = new B();
console.log((b as any).b); // Unnecessary - property 'b' exists on class B
```

**After:**

```typescript
class B {
  b: string;
  constructor() {
    this.b = "test";
  }
}
const b = new B();
console.log(b.b);
```

### Assertion to different type

```typescript
interface IC {
  c: string;
}
type C = { c: string };
const c: C = { c: "test" };
console.log((c as IC).c); // OK - casting to compatible but different type
```

## How It Works

The rule:

1. Tracks all variable declarations with their types
2. Tracks class declarations
3. When it sees an assertion expression, checks if the assertion type matches
   the variable's actual type
4. If they match, it's unnecessary and can be removed
5. Assertions to `any` are checked - if the property exists, they're flagged as
   unnecessary

## Fix

The fixer simply replaces the entire assertion expression with just the variable
name:

- `(variable as Type)` → `variable`
- `<Type>variable` → `variable`
