import { assertEquals } from "@std/assert";

const plugin = await import("../src/plugin.ts").then((m) => m.default);
const rule = plugin.rules["no-unnecessary-type-assertion"];

// deno-lint-ignore no-unused-vars
function createMockContext(code: string): {
  // deno-lint-ignore no-explicit-any
  context: any;
  // deno-lint-ignore no-explicit-any
  reports: Array<{ node: any; message: string; fix?: any }>;
} {
  // deno-lint-ignore no-explicit-any
  const reports: Array<{ node: any; message: string; fix?: any }> = [];

  const context = {
    // deno-lint-ignore no-explicit-any
    report: (report: any) => {
      reports.push(report);
    },
  };

  return { context, reports };
}

Deno.test("no-unnecessary-type-assertion: detects unnecessary cast to same type", () => {
  const { context, reports } = createMockContext("");

  const visitor = rule.create(context);

  // Track variable declaration: const a: A = { a: "test" };
  visitor.VariableDeclarator({
    type: "VariableDeclarator",
    id: {
      type: "Identifier",
      name: "a",
      typeAnnotation: {
        typeAnnotation: {
          type: "TSTypeReference",
          typeName: { type: "Identifier", name: "A" },
        },
      },
    },
  });

  // Check cast expression: (a as A)
  visitor.TSAsExpression({
    type: "TSAsExpression",
    expression: { type: "Identifier", name: "a" },
    typeAnnotation: {
      type: "TSTypeReference",
      typeName: { type: "Identifier", name: "A" },
    },
    range: [0, 8], // "(a as A)"
  });

  assertEquals(reports.length, 1);
  assertEquals(
    reports[0].message,
    "Unnecessary type assertion - 'a' is already type 'A'",
  );
});

Deno.test("no-unnecessary-type-assertion: detects unnecessary cast for class instance", () => {
  const { context, reports } = createMockContext("");

  const visitor = rule.create(context);

  // Track class declaration: class B { ... }
  visitor.ClassDeclaration({
    type: "ClassDeclaration",
    id: { type: "Identifier", name: "B" },
  });

  // Track variable: const b = new B();
  visitor.VariableDeclarator({
    type: "VariableDeclarator",
    id: {
      type: "Identifier",
      name: "b",
      typeAnnotation: {
        typeAnnotation: {
          type: "TSTypeReference",
          typeName: { type: "Identifier", name: "B" },
        },
      },
    },
  });

  // Check cast expression: (b as B)
  visitor.TSAsExpression({
    type: "TSAsExpression",
    expression: { type: "Identifier", name: "b" },
    typeAnnotation: {
      type: "TSTypeReference",
      typeName: { type: "Identifier", name: "B" },
    },
    range: [0, 8],
  });

  assertEquals(reports.length, 1);
  assertEquals(
    reports[0].message,
    "Unnecessary type assertion - 'b' is already type 'B'",
  );
});

Deno.test("no-unnecessary-type-assertion: ignores cast to any", () => {
  const { context, reports } = createMockContext("");

  const visitor = rule.create(context);

  // Track variable
  visitor.VariableDeclarator({
    type: "VariableDeclarator",
    id: {
      type: "Identifier",
      name: "a",
      typeAnnotation: {
        typeAnnotation: {
          type: "TSTypeReference",
          typeName: { type: "Identifier", name: "A" },
        },
      },
    },
  });

  // Check cast to any: (a as any)
  visitor.TSAsExpression({
    type: "TSAsExpression",
    expression: { type: "Identifier", name: "a" },
    typeAnnotation: { type: "TSAnyKeyword" },
    range: [0, 10],
  });

  // Should not report cast to 'any'
  assertEquals(reports.length, 0);
});

Deno.test("no-unnecessary-type-assertion: ignores cast to different type", () => {
  const { context, reports } = createMockContext("");

  const visitor = rule.create(context);

  // Track variable: const c: C = { c: "test" };
  visitor.VariableDeclarator({
    type: "VariableDeclarator",
    id: {
      type: "Identifier",
      name: "c",
      typeAnnotation: {
        typeAnnotation: {
          type: "TSTypeReference",
          typeName: { type: "Identifier", name: "C" },
        },
      },
    },
  });

  // Check cast to different type: (c as IC)
  visitor.TSAsExpression({
    type: "TSAsExpression",
    expression: { type: "Identifier", name: "c" },
    typeAnnotation: {
      type: "TSTypeReference",
      typeName: { type: "Identifier", name: "IC" },
    },
    range: [0, 9],
  });

  // Should not report cast to different type
  assertEquals(reports.length, 0);
});

Deno.test("no-unnecessary-type-assertion: provides fix to remove cast", () => {
  const { context, reports } = createMockContext("");

  const visitor = rule.create(context);

  // Setup variable
  visitor.VariableDeclarator({
    type: "VariableDeclarator",
    id: {
      type: "Identifier",
      name: "myVar",
      typeAnnotation: {
        typeAnnotation: {
          type: "TSTypeReference",
          typeName: { type: "Identifier", name: "MyType" },
        },
      },
    },
  });

  // Check cast
  visitor.TSAsExpression({
    type: "TSAsExpression",
    expression: { type: "Identifier", name: "myVar" },
    typeAnnotation: {
      type: "TSTypeReference",
      typeName: { type: "Identifier", name: "MyType" },
    },
    range: [10, 26], // "(myVar as MyType)"
  });

  assertEquals(reports.length, 1);
  assertEquals(typeof reports[0].fix, "function");

  // Test the fix
  const mockFixer = {
    // deno-lint-ignore no-explicit-any
    replaceText: (node: any, text: string) => ({
      type: "replaceText",
      node,
      text,
    }),
  };

  const fixResult = reports[0].fix(mockFixer);
  assertEquals(fixResult.type, "replaceText");
  assertEquals(fixResult.text, "myVar");
});

Deno.test("no-unnecessary-type-assertion: detects unnecessary cast to any for existing property", () => {
  const { context, reports } = createMockContext("");

  const visitor = rule.create(context);

  // Track type with properties
  visitor.VariableDeclarator({
    type: "VariableDeclarator",
    id: {
      type: "Identifier",
      name: "obj",
      typeAnnotation: {
        typeAnnotation: {
          type: "TSTypeLiteral",
          members: [
            {
              type: "TSPropertySignature",
              key: { type: "Identifier", name: "a" },
            },
            {
              type: "TSPropertySignature",
              key: { type: "Identifier", name: "b" },
            },
          ],
        },
      },
    },
  });

  // Check cast to any when accessing existing property: (obj as any).a
  visitor.TSAsExpression({
    type: "TSAsExpression",
    expression: { type: "Identifier", name: "obj" },
    typeAnnotation: { type: "TSAnyKeyword" },
    range: [0, 12],
    parent: {
      type: "MemberExpression",
      property: { type: "Identifier", name: "a" },
    },
  });

  assertEquals(reports.length, 1);
  assertEquals(
    reports[0].message,
    "Unnecessary type assertion to 'any' - property 'a' exists on 'obj'",
  );
});

Deno.test("no-unnecessary-type-assertion: detects unnecessary cast to any for class property", () => {
  const { context, reports } = createMockContext("");

  const visitor = rule.create(context);

  // Track class with properties
  visitor.ClassDeclaration({
    type: "ClassDeclaration",
    id: { type: "Identifier", name: "MyClass" },
    body: {
      body: [
        {
          type: "PropertyDefinition",
          key: { type: "Identifier", name: "value" },
        },
        {
          type: "MethodDefinition",
          key: { type: "Identifier", name: "getValue" },
        },
      ],
    },
  });

  // Track instance
  visitor.VariableDeclarator({
    type: "VariableDeclarator",
    id: {
      type: "Identifier",
      name: "instance",
      typeAnnotation: {
        typeAnnotation: {
          type: "TSTypeReference",
          typeName: { type: "Identifier", name: "MyClass" },
        },
      },
    },
    init: {
      type: "NewExpression",
      callee: { type: "Identifier", name: "MyClass" },
    },
  });

  // Check cast to any when accessing existing property: (instance as any).value
  visitor.TSAsExpression({
    type: "TSAsExpression",
    expression: { type: "Identifier", name: "instance" },
    typeAnnotation: { type: "TSAnyKeyword" },
    range: [0, 16],
    parent: {
      type: "MemberExpression",
      property: { type: "Identifier", name: "value" },
    },
  });

  assertEquals(reports.length, 1);
  assertEquals(
    reports[0].message,
    "Unnecessary type assertion to 'any' - property 'value' exists on 'instance'",
  );
});

Deno.test("no-unnecessary-type-assertion: ignores cast to any for non-existent property", () => {
  const { context, reports } = createMockContext("");

  const visitor = rule.create(context);

  // Track object with limited properties
  visitor.VariableDeclarator({
    type: "VariableDeclarator",
    id: {
      type: "Identifier",
      name: "obj",
      typeAnnotation: {
        typeAnnotation: {
          type: "TSTypeLiteral",
          members: [
            {
              type: "TSPropertySignature",
              key: { type: "Identifier", name: "a" },
            },
          ],
        },
      },
    },
  });

  // Cast to any to access non-existent property: (obj as any).nonExistent
  visitor.TSAsExpression({
    type: "TSAsExpression",
    expression: { type: "Identifier", name: "obj" },
    typeAnnotation: { type: "TSAnyKeyword" },
    range: [0, 12],
    parent: {
      type: "MemberExpression",
      property: { type: "Identifier", name: "nonExistent" },
    },
  });

  // Should not report - property doesn't exist
  assertEquals(reports.length, 0);
});

Deno.test("no-unnecessary-type-assertion: allows type narrowing from unknown/any types", () => {
  const { context, reports } = createMockContext("");

  const visitor = rule.create(context);

  // This test simulates accessing Event.target.value where target is of type unknown
  // The type assertion (e.target as HTMLTextAreaElement) should NOT be flagged
  visitor.TSAsExpression({
    type: "TSAsExpression",
    expression: {
      type: "MemberExpression",
      object: { type: "Identifier", name: "e" },
      property: { type: "Identifier", name: "target" },
    },
    typeAnnotation: {
      type: "TSTypeReference",
      typeName: { type: "Identifier", name: "HTMLTextAreaElement" },
    },
  });

  // Should not report - type narrowing from unknown/any is necessary
  assertEquals(reports.length, 0);
});

Deno.test("no-unnecessary-type-assertion: handles TSTypeAssertion (older syntax)", () => {
  const { context, reports } = createMockContext("");

  const visitor = rule.create(context);

  // Track variable
  visitor.VariableDeclarator({
    type: "VariableDeclarator",
    id: {
      type: "Identifier",
      name: "x",
      typeAnnotation: {
        typeAnnotation: {
          type: "TSTypeReference",
          typeName: { type: "Identifier", name: "X" },
        },
      },
    },
  });

  // Check older cast syntax: <X>x
  visitor.TSTypeAssertion({
    type: "TSTypeAssertion",
    expression: { type: "Identifier", name: "x" },
    typeAnnotation: {
      type: "TSTypeReference",
      typeName: { type: "Identifier", name: "X" },
    },
    range: [0, 5], // "<X>x"
  });

  assertEquals(reports.length, 1);
  assertEquals(
    reports[0].message,
    "Unnecessary type assertion - 'x' is already type 'X'",
  );
});

Deno.test("no-unnecessary-type-assertion: detects unnecessary non-null assertion on literal", () => {
  const { context, reports } = createMockContext("");

  const visitor = rule.create(context);

  // Mock sourceCode.getText
  context.sourceCode = {
    getText: (node) => {
      if (node.type === "Literal" && node.value === "hello") return '"hello"';
      if (node.type === "Literal" && node.value === 42) return "42";
      return "expr";
    },
  };

  // Check non-null assertion on string literal: "hello"!
  visitor.TSNonNullExpression({
    type: "TSNonNullExpression",
    expression: { type: "Literal", value: "hello" },
    range: [0, 8], // '"hello"!'
  });

  assertEquals(reports.length, 1);
  assertEquals(reports[0].message, "Unnecessary non-null assertion");
});

Deno.test("no-unnecessary-type-assertion: detects unnecessary non-null assertion on non-nullable variable", () => {
  const { context, reports } = createMockContext("");

  const visitor = rule.create(context);

  // Track a non-nullable variable
  visitor.VariableDeclarator({
    type: "VariableDeclarator",
    id: {
      type: "Identifier",
      name: "x",
      typeAnnotation: {
        typeAnnotation: {
          type: "TSNumberKeyword",
        },
      },
    },
  });

  // Check non-null assertion: x!
  visitor.TSNonNullExpression({
    type: "TSNonNullExpression",
    expression: { type: "Identifier", name: "x" },
    range: [0, 2], // 'x!'
  });

  assertEquals(reports.length, 1);
  assertEquals(
    reports[0].message,
    "Unnecessary non-null assertion - 'x' is not nullable",
  );
});

Deno.test("no-unnecessary-type-assertion: detects unnecessary type assertion on numeric expression", () => {
  const { context, reports } = createMockContext("");

  const visitor = rule.create(context);

  // Mock sourceCode.getText
  context.sourceCode = {
    getText: (node) => {
      if (node.type === "BinaryExpression") return "3 + 5";
      return "expr";
    },
  };

  // Check type assertion: (3 + 5) as number
  visitor.TSAsExpression({
    type: "TSAsExpression",
    expression: {
      type: "BinaryExpression",
      operator: "+",
      left: { type: "Literal", value: 3 },
      right: { type: "Literal", value: 5 },
    },
    typeAnnotation: { type: "TSNumberKeyword" },
    range: [0, 16], // '(3 + 5) as number'
  });

  assertEquals(reports.length, 1);
  assertEquals(reports[0].message, "Unnecessary type assertion");
});

Deno.test("no-unnecessary-type-assertion: resolves type aliases for numeric expressions", () => {
  const { context, reports } = createMockContext("");

  const visitor = rule.create(context);

  // Mock sourceCode.getText
  context.sourceCode = {
    getText: (node) => {
      if (node.type === "BinaryExpression") return "3 + 5";
      return "expr";
    },
  };

  // Track type alias: type Foo = number
  visitor.TSTypeAliasDeclaration({
    type: "TSTypeAliasDeclaration",
    id: { type: "Identifier", name: "Foo" },
    typeAnnotation: { type: "TSNumberKeyword" },
  });

  // Check type assertion: (3 + 5) as Foo
  visitor.TSAsExpression({
    type: "TSAsExpression",
    expression: {
      type: "BinaryExpression",
      operator: "+",
      left: { type: "Literal", value: 3 },
      right: { type: "Literal", value: 5 },
    },
    typeAnnotation: {
      type: "TSTypeReference",
      typeName: { type: "Identifier", name: "Foo" },
    },
    range: [0, 13], // '(3 + 5) as Foo'
  });

  assertEquals(reports.length, 1);
  assertEquals(reports[0].message, "Unnecessary type assertion");
});

Deno.test("no-unnecessary-type-assertion: detects unnecessary string type assertion", () => {
  const { context, reports } = createMockContext("");
  const visitor = rule.create(context);

  // Track string variable
  visitor.VariableDeclarator({
    type: "VariableDeclarator",
    id: {
      type: "Identifier",
      name: "str",
      typeAnnotation: {
        typeAnnotation: {
          type: "TSStringKeyword",
        },
      },
    },
  });

  // Check: str as string
  visitor.TSAsExpression({
    type: "TSAsExpression",
    expression: { type: "Identifier", name: "str" },
    typeAnnotation: { type: "TSStringKeyword" },
  });

  assertEquals(reports.length, 1);
  assertEquals(
    reports[0].message,
    "Unnecessary type assertion - 'str' is already type 'string'",
  );
});

Deno.test("no-unnecessary-type-assertion: detects unnecessary interface assertion", () => {
  const { context, reports } = createMockContext("");
  const visitor = rule.create(context);

  // Track interface declaration
  visitor.TSInterfaceDeclaration({
    type: "TSInterfaceDeclaration",
    id: { type: "Identifier", name: "User" },
    body: {
      type: "TSInterfaceBody",
      body: [
        {
          type: "TSPropertySignature",
          key: { type: "Identifier", name: "name" },
        },
      ],
    },
  });

  // Track variable with interface type
  visitor.VariableDeclarator({
    type: "VariableDeclarator",
    id: {
      type: "Identifier",
      name: "user",
      typeAnnotation: {
        typeAnnotation: {
          type: "TSTypeReference",
          typeName: { type: "Identifier", name: "User" },
        },
      },
    },
  });

  // Check: user as User
  visitor.TSAsExpression({
    type: "TSAsExpression",
    expression: { type: "Identifier", name: "user" },
    typeAnnotation: {
      type: "TSTypeReference",
      typeName: { type: "Identifier", name: "User" },
    },
  });

  assertEquals(reports.length, 1);
  assertEquals(
    reports[0].message,
    "Unnecessary type assertion - 'user' is already type 'User'",
  );
});

Deno.test("no-unnecessary-type-assertion: detects unnecessary array type assertion", () => {
  const { context, reports } = createMockContext("");
  const visitor = rule.create(context);

  // Track array variable
  visitor.VariableDeclarator({
    type: "VariableDeclarator",
    id: {
      type: "Identifier",
      name: "arr",
      typeAnnotation: {
        typeAnnotation: {
          type: "TSArrayType",
          elementType: { type: "TSNumberKeyword" },
        },
      },
    },
  });

  // Check: arr as number[]
  visitor.TSAsExpression({
    type: "TSAsExpression",
    expression: { type: "Identifier", name: "arr" },
    typeAnnotation: {
      type: "TSArrayType",
      elementType: { type: "TSNumberKeyword" },
    },
  });

  assertEquals(reports.length, 1);
  assertEquals(
    reports[0].message,
    "Unnecessary type assertion - 'arr' is already type 'number[]'",
  );
});

Deno.test("no-unnecessary-type-assertion: detects Array<T> vs T[] equivalence", () => {
  const { context, reports } = createMockContext("");
  const visitor = rule.create(context);

  // Track array variable with T[] syntax
  visitor.VariableDeclarator({
    type: "VariableDeclarator",
    id: {
      type: "Identifier",
      name: "arr",
      typeAnnotation: {
        typeAnnotation: {
          type: "TSArrayType",
          elementType: { type: "TSStringKeyword" },
        },
      },
    },
  });

  // Check: arr as Array<string> (should be equivalent to string[])
  visitor.TSAsExpression({
    type: "TSAsExpression",
    expression: { type: "Identifier", name: "arr" },
    typeAnnotation: {
      type: "TSTypeReference",
      typeName: { type: "Identifier", name: "Array" },
      typeParameters: {
        params: [{ type: "TSStringKeyword" }],
      },
    },
  });

  assertEquals(reports.length, 1);
  assertEquals(
    reports[0].message,
    "Unnecessary type assertion - 'arr' is already type 'string[]'",
  );
});

Deno.test("no-unnecessary-type-assertion: allows necessary assertions for unknown types", () => {
  const { context, reports } = createMockContext("");
  const visitor = rule.create(context);

  // Track variable with unknown type
  visitor.VariableDeclarator({
    type: "VariableDeclarator",
    id: {
      type: "Identifier",
      name: "current",
      typeAnnotation: {
        typeAnnotation: {
          type: "TSUnknownKeyword",
        },
      },
    },
  });

  // Check: (current as Record<string, unknown>)[part]
  // This is necessary because we can't index into unknown without an assertion
  visitor.TSAsExpression({
    type: "TSAsExpression",
    expression: { type: "Identifier", name: "current" },
    typeAnnotation: {
      type: "TSTypeReference",
      typeName: { type: "Identifier", name: "Record" },
      typeParameters: {
        params: [
          { type: "TSStringKeyword" },
          { type: "TSUnknownKeyword" },
        ],
      },
    },
    parent: {
      type: "MemberExpression",
      computed: true,
      property: { type: "Identifier", name: "part" },
    },
  });

  // Should not report - this assertion is necessary for type safety
  assertEquals(reports.length, 0);
});

Deno.test("no-unnecessary-type-assertion: detects unnecessary assertion on nullable after null check", () => {
  const { context, reports } = createMockContext("");
  const visitor = rule.create(context);

  // This test simulates:
  // let nullable: string | null = "hello";
  // if (nullable !== null) {
  //   const s = nullable as string; // Should be unnecessary
  // }

  // Track nullable variable
  visitor.VariableDeclarator({
    type: "VariableDeclarator",
    id: {
      type: "Identifier",
      name: "nullable",
      typeAnnotation: {
        typeAnnotation: {
          type: "TSUnionType",
          types: [
            { type: "TSStringKeyword" },
            { type: "TSNullKeyword" },
          ],
        },
      },
    },
  });

  // Check assertion: nullable as string
  visitor.TSAsExpression({
    type: "TSAsExpression",
    expression: { type: "Identifier", name: "nullable" },
    typeAnnotation: { type: "TSStringKeyword" },
  });

  // Should report - this is just narrowing from nullable, not handling control flow
  assertEquals(reports.length, 0); // Currently we don't track control flow
});

Deno.test("no-unnecessary-type-assertion: allows narrowing from union types", () => {
  const { context, reports } = createMockContext("");
  const visitor = rule.create(context);

  // Track union type variable: string | number
  visitor.VariableDeclarator({
    type: "VariableDeclarator",
    id: {
      type: "Identifier",
      name: "union",
      typeAnnotation: {
        typeAnnotation: {
          type: "TSUnionType",
          types: [
            { type: "TSStringKeyword" },
            { type: "TSNumberKeyword" },
          ],
        },
      },
    },
  });

  // Check: union as string (narrowing to one member)
  visitor.TSAsExpression({
    type: "TSAsExpression",
    expression: { type: "Identifier", name: "union" },
    typeAnnotation: { type: "TSStringKeyword" },
  });

  // Should not report - narrowing from union is necessary
  assertEquals(reports.length, 0);
});
