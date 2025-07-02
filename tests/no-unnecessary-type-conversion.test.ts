import { assertEquals } from "@std/assert";

const plugin = await import("../src/plugin.ts").then((m) => m.default);
const rule = plugin.rules["no-unnecessary-type-conversion"];

// Helper to create a mock context and collect reports
function createMockContext() {
  const reports: any[] = [];

  const context = {
    report: (descriptor: any) => {
      reports.push(descriptor);
    },
    getSourceCode: () => ({
      getText: (node: any) => {
        // Simple mock implementation
        if (node.type === "Identifier") {
          return node.name;
        } else if (node.type === "Literal") {
          if (typeof node.value === "string") {
            return `'${node.value}'`;
          }
          return String(node.value);
        }
        return "mockExpression";
      },
    }),
  };

  return { context, reports };
}

Deno.test("no-unnecessary-type-conversion - detects String() on string literal", () => {
  const { context, reports } = createMockContext();
  const visitor = rule.create(context);

  // Simulate String('123')
  visitor.CallExpression({
    callee: { type: "Identifier", name: "String" },
    arguments: [{
      type: "Literal",
      value: "123",
    }],
  });

  assertEquals(reports.length, 1);
  assertEquals(
    reports[0].message,
    "Unnecessary String() conversion of string value",
  );
});

Deno.test("no-unnecessary-type-conversion - detects .toString() on string literal", () => {
  const { context, reports } = createMockContext();
  const visitor = rule.create(context);

  // First set up the member expression
  const callExpr = {
    type: "CallExpression",
    arguments: [],
    callee: null as any,
  };

  const memberExpr = {
    type: "MemberExpression",
    object: { type: "Literal", value: "123" },
    property: { type: "Identifier", name: "toString" },
    parent: callExpr,
  };

  callExpr.callee = memberExpr;

  // Test the member expression
  visitor.MemberExpression(memberExpr);

  assertEquals(reports.length, 1);
  assertEquals(
    reports[0].message,
    "Unnecessary .toString() call on string value",
  );
});

Deno.test("no-unnecessary-type-conversion - detects empty string concatenation", () => {
  const { context, reports } = createMockContext();
  const visitor = rule.create(context);

  // Test '' + '123'
  visitor.BinaryExpression({
    operator: "+",
    left: { type: "Literal", value: "" },
    right: { type: "Literal", value: "123" },
  });

  assertEquals(reports.length, 1);
  assertEquals(reports[0].message, "Unnecessary empty string concatenation");

  // Test '123' + ''
  visitor.BinaryExpression({
    operator: "+",
    left: { type: "Literal", value: "123" },
    right: { type: "Literal", value: "" },
  });

  assertEquals(reports.length, 2);
  assertEquals(reports[1].message, "Unnecessary empty string concatenation");
});

Deno.test("no-unnecessary-type-conversion - detects Number() on numeric literal", () => {
  const { context, reports } = createMockContext();
  const visitor = rule.create(context);

  visitor.CallExpression({
    callee: { type: "Identifier", name: "Number" },
    arguments: [{
      type: "Literal",
      value: 123,
    }],
  });

  assertEquals(reports.length, 1);
  assertEquals(
    reports[0].message,
    "Unnecessary Number() conversion of numeric value",
  );
});

Deno.test("no-unnecessary-type-conversion - detects unary + on number", () => {
  const { context, reports } = createMockContext();
  const visitor = rule.create(context);

  visitor.UnaryExpression({
    operator: "+",
    argument: { type: "Literal", value: 123 },
  });

  assertEquals(reports.length, 1);
  assertEquals(
    reports[0].message,
    "Unnecessary unary + operator on numeric value",
  );
});

Deno.test("no-unnecessary-type-conversion - detects ~~ on number", () => {
  const { context, reports } = createMockContext();
  const visitor = rule.create(context);

  visitor.UnaryExpression({
    operator: "~",
    argument: {
      type: "UnaryExpression",
      operator: "~",
      argument: { type: "Literal", value: 123 },
    },
  });

  assertEquals(reports.length, 1);
  assertEquals(reports[0].message, "Unnecessary ~~ operator on numeric value");
});

Deno.test("no-unnecessary-type-conversion - detects Boolean() on boolean literal", () => {
  const { context, reports } = createMockContext();
  const visitor = rule.create(context);

  visitor.CallExpression({
    callee: { type: "Identifier", name: "Boolean" },
    arguments: [{
      type: "Literal",
      value: true,
    }],
  });

  assertEquals(reports.length, 1);
  assertEquals(
    reports[0].message,
    "Unnecessary Boolean() conversion of boolean value",
  );
});

Deno.test("no-unnecessary-type-conversion - detects !! on boolean", () => {
  const { context, reports } = createMockContext();
  const visitor = rule.create(context);

  visitor.UnaryExpression({
    operator: "!",
    argument: {
      type: "UnaryExpression",
      operator: "!",
      argument: { type: "Literal", value: true },
    },
  });

  assertEquals(reports.length, 1);
  assertEquals(reports[0].message, "Unnecessary !! operator on boolean value");
});

Deno.test("no-unnecessary-type-conversion - detects BigInt() on BigInt", () => {
  const { context, reports } = createMockContext();
  const visitor = rule.create(context);

  visitor.CallExpression({
    callee: { type: "Identifier", name: "BigInt" },
    arguments: [{
      type: "CallExpression",
      callee: { type: "Identifier", name: "BigInt" },
      arguments: [{ type: "Literal", value: 1 }],
    }],
  });

  assertEquals(reports.length, 1);
  assertEquals(
    reports[0].message,
    "Unnecessary BigInt() conversion of BigInt value",
  );
});

Deno.test("no-unnecessary-type-conversion - detects str += ''", () => {
  const { context, reports } = createMockContext();
  const visitor = rule.create(context);

  // First track the variable
  visitor.VariableDeclarator({
    id: { type: "Identifier", name: "str" },
    init: { type: "Literal", value: "123" },
  });

  // Then test the assignment
  visitor.AssignmentExpression({
    operator: "+=",
    left: { type: "Identifier", name: "str" },
    right: { type: "Literal", value: "" },
    parent: { type: "ExpressionStatement" },
  });

  assertEquals(reports.length, 1);
  assertEquals(
    reports[0].message,
    "Unnecessary empty string concatenation assignment",
  );
});

Deno.test("no-unnecessary-type-conversion - ignores necessary conversions", () => {
  const { context, reports } = createMockContext();
  const visitor = rule.create(context);

  // String(123) - necessary
  visitor.CallExpression({
    callee: { type: "Identifier", name: "String" },
    arguments: [{ type: "Literal", value: 123 }],
  });

  // Number('123') - necessary
  visitor.CallExpression({
    callee: { type: "Identifier", name: "Number" },
    arguments: [{ type: "Literal", value: "123" }],
  });

  // Boolean(0) - necessary
  visitor.CallExpression({
    callee: { type: "Identifier", name: "Boolean" },
    arguments: [{ type: "Literal", value: 0 }],
  });

  // BigInt(1) - necessary
  visitor.CallExpression({
    callee: { type: "Identifier", name: "BigInt" },
    arguments: [{ type: "Literal", value: 1 }],
  });

  assertEquals(reports.length, 0);
});

Deno.test("no-unnecessary-type-conversion - tracks variable types", () => {
  const { context, reports } = createMockContext();
  const visitor = rule.create(context);

  // Track string variable
  visitor.VariableDeclarator({
    id: { type: "Identifier", name: "myString" },
    init: { type: "Literal", value: "hello" },
  });

  // String(myString) should be flagged
  visitor.CallExpression({
    callee: { type: "Identifier", name: "String" },
    arguments: [{ type: "Identifier", name: "myString" }],
  });

  // Track number variable
  visitor.VariableDeclarator({
    id: { type: "Identifier", name: "myNumber" },
    init: { type: "Literal", value: 42 },
  });

  // +myNumber should be flagged
  visitor.UnaryExpression({
    operator: "+",
    argument: { type: "Identifier", name: "myNumber" },
  });

  assertEquals(reports.length, 2);
  assertEquals(
    reports[0].message,
    "Unnecessary String() conversion of string value",
  );
  assertEquals(
    reports[1].message,
    "Unnecessary unary + operator on numeric value",
  );
});
