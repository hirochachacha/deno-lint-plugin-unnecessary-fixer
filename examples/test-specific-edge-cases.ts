// Test specific edge cases that should be caught

// 1. Basic same-type assertion (should be caught)
const str: string = "hello";
const str2 = str; // SHOULD BE CAUGHT

// 2. Array type assertion (should be caught)
const arr: number[] = [1, 2, 3];
const arr2 = arr; // SHOULD BE CAUGHT

// 3. Promise type assertion (should be caught)
async function getData(): Promise<string> {
  return "data";
}
const promise = getData();
const promise2 = promise as Promise<string>; // SHOULD BE CAUGHT

// 4. Interface assertion (not tracked - this is a bug)
interface Person {
  name: string;
}
const person: Person = { name: "John" };
const person2 = person; // SHOULD BE CAUGHT but isn't

// 5. Enum assertion (should be caught)
enum Color {
  Red = "RED",
  Blue = "BLUE",
}
const color: Color = Color.Red;
const color2 = color; // SHOULD BE CAUGHT
