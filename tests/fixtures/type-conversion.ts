// Test cases for no-unnecessary-type-conversion rule

// Incorrect patterns that should be fixed:

// String conversions
"123"; // should be '123'
"123"; // should be '123'
"123"; // should be '123'
"123"; // should be '123'

// Number conversions
123; // should be 123
123; // should be 123
123; // should be 123

// Boolean conversions
true; // should be true
true; // should be true
false; // should be false
false; // should be false

// BigInt conversions
BigInt(1); // should be BigInt(1)

// Assignment with empty string
let str = "123";
 // should be deleted

// With variables
const myString = "hello";
myString; // should be myString
myString; // should be myString
myString; // should be myString
myString; // should be myString

const myNumber = 42;
myNumber; // should be myNumber
myNumber; // should be myNumber
myNumber; // should be myNumber

const myBool = true;
myBool; // should be myBool
myBool; // should be myBool

// Correct patterns that should NOT be fixed:

// When the type is unknown or union type
function foo(bar: string | number) {
  String(bar); // OK - bar could be number
  bar.toString(); // OK - valid for both string and number
  "" + bar; // OK - bar could be number
  bar + ""; // OK - bar could be number

  Number(bar); // OK - bar could be string
  +bar; // OK - bar could be string
  ~~bar; // OK - bar could be string

  Boolean(bar); // OK - bar could be falsy
  !!bar; // OK - bar could be falsy

  bar += ""; // OK - bar type is union
}

// Necessary conversions
BigInt(1); // OK - converting number to BigInt
String(123); // OK - converting number to string
Number("123"); // OK - converting string to number
Boolean(0); // OK - converting falsy value
!!""; // OK - converting falsy value

// More complex expressions
const sum = 1 + 2;
sum; // should be sum
sum; // should be sum

const condition = true && false;
Boolean(condition); // should be condition
!!condition; // should be condition
