// Example 1: Unnecessary non-null assertion on literal
const foo = 3;
const bar = foo!; // unnecessary - foo is not nullable

// Example 2: Unnecessary type assertion on numeric expression
const num1 = 3 + 5; // unnecessary - expression is already number

// Example 3: Type alias to number
type Foo = number;
const num2 = 3 + 5; // unnecessary - expression is already number

// Example 4: Type alias with 'as' syntax
type Bar = number;
const num3 = 3 + 5; // unnecessary - expression is already number

// Example 5: Unnecessary non-null in function
function getValue(x: number): number {
  return x!; // unnecessary - x is not nullable
}

// Example 6: Necessary non-null assertions (should NOT be flagged)
let nullable: string | null = null;
const value1 = nullable!; // necessary - nullable can be null

function maybeNull(): string | null {
  return Math.random() > 0.5 ? "hello" : null;
}
const value2 = maybeNull()!; // necessary - return type can be null

// Example 7: Literals with non-null assertion
const str = "hello"; // unnecessary - string literal is never null
const num = 42; // unnecessary - number literal is never null
const bool = true; // unnecessary - boolean literal is never null
const arr = [1, 2, 3]; // unnecessary - array literal is never null
const obj = { a: 1 }; // unnecessary - object literal is never null

// Example 8: String type assertions
const hello = "world"; // unnecessary - already string
const greeting = "hello"; // unnecessary - already string

// Example 9: Boolean type assertions
const isTrue = true; // unnecessary - already boolean
const isFalse = false; // unnecessary - already boolean

// Example 10: Complex numeric expressions
const calc1 = 10 * 5 + 3; // unnecessary
const calc2 = -42; // unnecessary
const calc3 = +100; // unnecessary

console.log(
  foo,
  bar,
  num1,
  num2,
  num3,
  getValue,
  value1,
  value2,
  str,
  num,
  bool,
  arr,
  obj,
  hello,
  greeting,
  isTrue,
  isFalse,
  calc1,
  calc2,
  calc3,
);
