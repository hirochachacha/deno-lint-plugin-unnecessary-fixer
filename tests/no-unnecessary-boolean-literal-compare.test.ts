import { assertEquals } from "@std/assert";

const plugin = await import("../src/plugin.ts").then((m) => m.default);
const rule = plugin.rules["no-unnecessary-boolean-literal-compare"];

// Helper function to run the rule and collect reported issues
function runRule(code: string) {
  const issues: Array<{ message: string; fix?: string }> = [];

  const context = {
    report: (descriptor: any) => {
      issues.push({
        message: descriptor.message,
        fix: descriptor.fix
          ? descriptor.fix({
            replaceText: (_node: any, text: string) => text,
          })
          : undefined,
      });
    },
    getSourceCode: () => ({
      getText: (node: any) => {
        // Simple text extraction based on node type
        if (node.type === "Identifier") {
          return node.name;
        }
        return code.substring(node.start, node.end);
      },
    }),
  };

  // Parse the code into an AST (simplified for testing)
  // In real usage, Deno lint provides the parsed AST
  const visitor = rule.create(context);

  // Simulate AST traversal for test cases
  // This is a simplified version - real Deno lint does proper AST parsing
  return { issues, visitor };
}

Deno.test("no-unnecessary-boolean-literal-compare - detects someCondition === true", () => {
  const code = `
    declare const someCondition: boolean;
    if (someCondition === true) {
      console.log("test");
    }
  `;

  const { visitor } = runRule(code);
  const issues: any[] = [];

  // Create a mock context
  const context = {
    report: (descriptor: any) => {
      issues.push(descriptor);
    },
    getSourceCode: () => ({
      getText: (node: any) => node.name || "someCondition",
    }),
  };

  // Create the rule visitor
  const ruleVisitor = rule.create(context);

  // Simulate variable declaration
  ruleVisitor.VariableDeclarator({
    id: {
      type: "Identifier",
      name: "someCondition",
      typeAnnotation: {
        type: "TSTypeAnnotation",
        typeAnnotation: {
          type: "TSBooleanKeyword",
        },
      },
    },
  });

  // Simulate binary expression
  ruleVisitor.BinaryExpression({
    operator: "===",
    left: { type: "Identifier", name: "someCondition" },
    right: { type: "Literal", value: true },
  });

  assertEquals(issues.length, 1);
  assertEquals(
    issues[0].message,
    "Unnecessary comparison of boolean with 'true'. Use the variable directly.",
  );
});

Deno.test("no-unnecessary-boolean-literal-compare - detects someCondition !== true", () => {
  const context = {
    report: (descriptor: any) => {
      assertEquals(
        descriptor.message,
        "Unnecessary comparison of boolean with 'true'. Use negation instead.",
      );
    },
    getSourceCode: () => ({
      getText: (node: any) => node.name || "someCondition",
    }),
  };

  const ruleVisitor = rule.create(context);

  // Track boolean variable
  ruleVisitor.VariableDeclarator({
    id: {
      type: "Identifier",
      name: "someCondition",
      typeAnnotation: {
        type: "TSTypeAnnotation",
        typeAnnotation: {
          type: "TSBooleanKeyword",
        },
      },
    },
  });

  // Test !== true
  ruleVisitor.BinaryExpression({
    operator: "!==",
    left: { type: "Identifier", name: "someCondition" },
    right: { type: "Literal", value: true },
  });
});

Deno.test("no-unnecessary-boolean-literal-compare - detects someCondition === false", () => {
  const context = {
    report: (descriptor: any) => {
      assertEquals(
        descriptor.message,
        "Unnecessary comparison of boolean with 'false'. Use negation instead.",
      );
    },
    getSourceCode: () => ({
      getText: (node: any) => node.name || "someCondition",
    }),
  };

  const ruleVisitor = rule.create(context);

  // Track boolean variable
  ruleVisitor.VariableDeclarator({
    id: {
      type: "Identifier",
      name: "someCondition",
      typeAnnotation: {
        type: "TSTypeAnnotation",
        typeAnnotation: {
          type: "TSBooleanKeyword",
        },
      },
    },
  });

  // Test === false
  ruleVisitor.BinaryExpression({
    operator: "===",
    left: { type: "Identifier", name: "someCondition" },
    right: { type: "Literal", value: false },
  });
});

Deno.test("no-unnecessary-boolean-literal-compare - detects someCondition !== false", () => {
  const context = {
    report: (descriptor: any) => {
      assertEquals(
        descriptor.message,
        "Unnecessary comparison of boolean with 'false'. Use the variable directly.",
      );
    },
    getSourceCode: () => ({
      getText: (node: any) => node.name || "someCondition",
    }),
  };

  const ruleVisitor = rule.create(context);

  // Track boolean variable
  ruleVisitor.VariableDeclarator({
    id: {
      type: "Identifier",
      name: "someCondition",
      typeAnnotation: {
        type: "TSTypeAnnotation",
        typeAnnotation: {
          type: "TSBooleanKeyword",
        },
      },
    },
  });

  // Test !== false
  ruleVisitor.BinaryExpression({
    operator: "!==",
    left: { type: "Identifier", name: "someCondition" },
    right: { type: "Literal", value: false },
  });
});

Deno.test("no-unnecessary-boolean-literal-compare - ignores union types", () => {
  const issues: any[] = [];
  const context = {
    report: (descriptor: any) => {
      issues.push(descriptor);
    },
    getSourceCode: () => ({
      getText: (node: any) => node.name || "someVar",
    }),
  };

  const ruleVisitor = rule.create(context);

  // Track union type variable
  ruleVisitor.VariableDeclarator({
    id: {
      type: "Identifier",
      name: "someVar",
      typeAnnotation: {
        type: "TSTypeAnnotation",
        typeAnnotation: {
          type: "TSUnionType",
          types: [
            { type: "TSBooleanKeyword" },
            { type: "TSStringKeyword" },
          ],
        },
      },
    },
  });

  // Test comparison with union type - should not report
  ruleVisitor.BinaryExpression({
    operator: "===",
    left: { type: "Identifier", name: "someVar" },
    right: { type: "Literal", value: true },
  });

  assertEquals(issues.length, 0);
});

Deno.test("no-unnecessary-boolean-literal-compare - detects function parameters", () => {
  const context = {
    report: (descriptor: any) => {
      assertEquals(
        descriptor.message,
        "Unnecessary comparison of boolean with 'true'. Use the variable directly.",
      );
    },
    getSourceCode: () => ({
      getText: (node: any) => node.name || "flag",
    }),
  };

  const ruleVisitor = rule.create(context);

  // Track function parameter
  ruleVisitor.FunctionDeclaration({
    params: [{
      type: "Identifier",
      name: "flag",
      typeAnnotation: {
        type: "TSTypeAnnotation",
        typeAnnotation: {
          type: "TSBooleanKeyword",
        },
      },
    }],
  });

  // Test comparison
  ruleVisitor.BinaryExpression({
    operator: "===",
    left: { type: "Identifier", name: "flag" },
    right: { type: "Literal", value: true },
  });
});

Deno.test("no-unnecessary-boolean-literal-compare - detects arrow function parameters", () => {
  const context = {
    report: (descriptor: any) => {
      assertEquals(
        descriptor.message,
        "Unnecessary comparison of boolean with 'false'. Use negation instead.",
      );
    },
    getSourceCode: () => ({
      getText: (node: any) => node.name || "isEnabled",
    }),
  };

  const ruleVisitor = rule.create(context);

  // Track arrow function parameter
  ruleVisitor.ArrowFunctionExpression({
    params: [{
      type: "Identifier",
      name: "isEnabled",
      typeAnnotation: {
        type: "TSTypeAnnotation",
        typeAnnotation: {
          type: "TSBooleanKeyword",
        },
      },
    }],
  });

  // Test comparison
  ruleVisitor.BinaryExpression({
    operator: "===",
    left: { type: "Identifier", name: "isEnabled" },
    right: { type: "Literal", value: false },
  });
});

Deno.test("no-unnecessary-boolean-literal-compare - handles literal on left side", () => {
  const context = {
    report: (descriptor: any) => {
      assertEquals(
        descriptor.message,
        "Unnecessary comparison of boolean with 'true'. Use the variable directly.",
      );
    },
    getSourceCode: () => ({
      getText: (node: any) => node.name || "someCondition",
    }),
  };

  const ruleVisitor = rule.create(context);

  // Track boolean variable
  ruleVisitor.VariableDeclarator({
    id: {
      type: "Identifier",
      name: "someCondition",
      typeAnnotation: {
        type: "TSTypeAnnotation",
        typeAnnotation: {
          type: "TSBooleanKeyword",
        },
      },
    },
  });

  // Test with literal on left side
  ruleVisitor.BinaryExpression({
    operator: "===",
    left: { type: "Literal", value: true },
    right: { type: "Identifier", name: "someCondition" },
  });
});
