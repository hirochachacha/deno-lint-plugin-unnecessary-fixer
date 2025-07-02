// deno-lint-ignore-file no-explicit-any unnecessary-fixer/no-unnecessary-type-assertion
// This file demonstrates unnecessary type assertions

type A = {
  a: string;
};

const a: A = { a: "test" };

// Unnecessary cast - 'a' is already type 'A'
console.log((a as A).a);

// Cast to 'any' to access existing property (NOW FLAGGED!)
console.log((a as any).a);

// Cast to 'any' to access non-existent property (not flagged)
console.log((a as any).nonExistent);

class B {
  b: string;
  constructor() {
    this.b = "test";
  }
}

const b = new B();

// Unnecessary cast - 'b' is already type 'B'
console.log((b as B).b);

// Cast to 'any' to access existing property (NOW FLAGGED!)
console.log((b as any).b);

interface IC {
  c: string;
}

type C = {
  c: string;
};

const c: C = { c: "test" };

// Unnecessary cast - 'c' is already type 'C'
console.log((c as C).c);

// Different type cast (not flagged)
console.log((c as IC).c);

// Expected:
// - Linter reports "Unnecessary cast" for (a as A)
// - Linter reports "Unnecessary cast to 'any'" for (a as any).a
// - Linter reports "Unnecessary cast" for (b as B)
// - Linter reports "Unnecessary cast to 'any'" for (b as any).b
// - Linter reports "Unnecessary cast" for (c as C)
// - Does NOT report cast to 'any' for non-existent properties
// - Does NOT report casts to different types
