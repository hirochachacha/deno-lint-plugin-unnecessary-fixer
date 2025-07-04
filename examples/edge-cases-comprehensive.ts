// Comprehensive edge cases for no-unnecessary-type-assertion rule

// Edge Case 1: Interface declarations (not currently tracked)
interface IUser {
  name: string;
  email: string;
}
const user: IUser = { name: "John", email: "john@example.com" };
const user2 = user; // Should be flagged but currently isn't

// Edge Case 2: Union types with type guards
type Result = { success: true; data: string } | {
  success: false;
  error: Error;
};
function handleResult(result: Result) {
  if (result.success) {
    // Inside type guard, this assertion might be unnecessary
    const data = (result).data;
  }
}

// Edge Case 3: Intersection types
type A = { a: string };
type B = { b: number };
type AB = A & B;
const obj: AB = { a: "test", b: 42 };
const a = (obj).a; // Unnecessary - obj has all properties of A

// Edge Case 4: Array and tuple types
const tuple: [string, number] = ["hello", 42];
const first = (tuple)[0]; // Unnecessary
const arr: number[] = [1, 2, 3];
const arr2 = arr; // Unnecessary
const arr3 = arr as Array<number>; // Unnecessary (different syntax for same type)

// Edge Case 5: Class inheritance
class Animal {
  name: string = "";
}
class Dog extends Animal {
  breed: string = "";
}
const dog: Dog = new Dog();
const animal = dog as Animal; // Unnecessary - Dog is subtype of Animal
const dog2 = animal as Dog; // Necessary - narrowing from supertype

// Edge Case 6: Generic type parameters
function identity<T>(value: T): T {
  return value as T; // May be unnecessary in some cases
}

function processValue<T extends string>(value: T) {
  return value as string; // Should be flagged - T extends string
}

// Edge Case 7: Const assertions
const config = { apiUrl: "https://api.example.com" } as const;
const config2 = config; // Unnecessary
const literal = "hello" as const;
const str = literal; // Unnecessary

// Edge Case 8: Optional chaining with assertions
interface Nested {
  data?: {
    value: string;
  };
}
const nested: Nested = { data: { value: "test" } };
const value1 = (nested.data).value; // Might be necessary
const value2 = nested.data?.value!; // Non-null assertion after optional chain

// Edge Case 9: Type predicates
function isString(value: unknown): value is string {
  return typeof value === "string";
}

const val: unknown = "hello";
if (isString(val)) {
  const str = val; // Unnecessary inside type guard
}

// Edge Case 10: Enum type assertions
enum Status {
  Active = "ACTIVE",
  Inactive = "INACTIVE",
}
const status: Status = Status.Active;
const status2 = status; // Unnecessary

// Edge Case 11: Function type assertions
type Handler = (event: Event) => void;
const handleClick: Handler = (e) => console.log(e);
const handler = handleClick; // Unnecessary

// Edge Case 12: Index signatures
interface StringMap {
  [key: string]: string;
}
const map: StringMap = { foo: "bar" };
const value = (map)["foo"]; // Unnecessary
const value3 = (map as any)["prop"]; // Might be necessary if prop doesn't exist

// Edge Case 13: Promise types
async function fetchData(): Promise<string> {
  return "data";
}
const promise = fetchData();
const promise2 = promise as Promise<string>; // Unnecessary

// Edge Case 14: Template literal types
type Greeting = `Hello, ${string}`;
const msg: Greeting = "Hello, World!" as Greeting;
const msg2 = msg; // Unnecessary

// Edge Case 15: Readonly and mapped types
type ReadonlyUser = Readonly<IUser>;
const readonlyUser: ReadonlyUser = { name: "John", email: "john@example.com" };
const ru = readonlyUser; // Unnecessary

// Edge Case 16: Complex member access patterns
const complexObj = {
  nested: {
    deep: {
      value: 42,
    },
  },
};
// These patterns might not be caught
const deepValue = (complexObj).nested.deep.value;
const deepValue2 = (complexObj.nested as any).deep.value;

// Edge Case 17: Type assertions in destructuring
const destructObj = { a: 1, b: "hello" };
const { a: num, b: str } = destructObj; // May be unnecessary

// Edge Case 18: Assertions with typeof
const someValue = "hello";
const typeofValue = someValue; // Unnecessary

// Edge Case 19: Namespace types
namespace MyNamespace {
  export interface Config {
    url: string;
  }
}
const nsConfig: MyNamespace.Config = { url: "" };
const c = nsConfig; // Unnecessary

// Edge Case 20: Mixed assertion patterns
const mixed = {
  str: "hello",
  num: 42,
  bool: true,
};
// Multiple assertions in one expression
const complexExpr = ((mixed).str).toUpperCase();

// Edge Case 21: Type assertions with method calls
const strObj = "hello";
const upper = (strObj).toUpperCase(); // Unnecessary

// Edge Case 22: Double assertions (asserting twice)
const doubleAssert = "hello" as unknown as string; // Both might be flagged differently

// Edge Case 23: Assertions in conditional expressions
const conditional = true ? ("hello") : ("world"); // Unnecessary

// Edge Case 24: Assertions with spread operators
const spreadObj = { ...({ a: 1 } as { a: number }) }; // May be unnecessary

// Edge Case 25: Circular type references
type Node = {
  value: string;
  next?: Node;
};
const node: Node = { value: "test" };
const n = node; // Unnecessary
