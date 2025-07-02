export const noUnnecessaryBooleanLiteralCompare = {
  create(context: any) {
    // Track variable types
    const variableTypes = new Map<string, any>();

    // Helper to check if a type is strictly boolean (not a union with other types)
    function isStrictlyBoolean(typeAnnotation: any): boolean {
      if (!typeAnnotation) return false;

      // Handle TSTypeAnnotation wrapper
      if (typeAnnotation.type === "TSTypeAnnotation") {
        return isStrictlyBoolean(typeAnnotation.typeAnnotation);
      }

      // Direct boolean type reference
      if (typeAnnotation.type === "TSBooleanKeyword") {
        return true;
      }

      // Union types - must check if boolean is mixed with other types
      if (typeAnnotation.type === "TSUnionType") {
        // If it's a union, it's not strictly boolean
        return false;
      }

      return false;
    }

    return {
      // Track variable declarations
      VariableDeclarator(node: any) {
        if (node.id.type === "Identifier" && node.id.typeAnnotation) {
          const isBoolean = isStrictlyBoolean(node.id.typeAnnotation);
          if (isBoolean) {
            variableTypes.set(node.id.name, "boolean");
          }
        }
      },

      // Track function parameters
      FunctionDeclaration(node: any) {
        node.params.forEach((param: any) => {
          if (param.type === "Identifier" && param.typeAnnotation) {
            const isBoolean = isStrictlyBoolean(param.typeAnnotation);
            if (isBoolean) {
              variableTypes.set(param.name, "boolean");
            }
          }
        });
      },

      // Track arrow function parameters
      ArrowFunctionExpression(node: any) {
        node.params.forEach((param: any) => {
          if (param.type === "Identifier" && param.typeAnnotation) {
            const isBoolean = isStrictlyBoolean(param.typeAnnotation);
            if (isBoolean) {
              variableTypes.set(param.name, "boolean");
            }
          }
        });
      },

      // Check binary expressions for unnecessary boolean comparisons
      BinaryExpression(node: any) {
        if (
          node.operator === "===" || node.operator === "!=="
        ) {
          let booleanLiteral = null;
          let otherSide = null;

          // Check if left side is boolean literal
          if (
            node.left.type === "Literal" &&
            (node.left.value === true || node.left.value === false)
          ) {
            booleanLiteral = node.left;
            otherSide = node.right;
          } // Check if right side is boolean literal
          else if (
            node.right.type === "Literal" &&
            (node.right.value === true || node.right.value === false)
          ) {
            booleanLiteral = node.right;
            otherSide = node.left;
          }

          // If we found a boolean literal comparison
          if (booleanLiteral && otherSide) {
            // Check if the other side is a known boolean variable
            if (
              otherSide.type === "Identifier" &&
              variableTypes.get(otherSide.name) === "boolean"
            ) {
              const isStrictEquality = node.operator === "===";
              const comparingToTrue = booleanLiteral.value === true;

              let fixedCode = "";
              let message = "";

              if (isStrictEquality && comparingToTrue) {
                // someCondition === true -> someCondition
                fixedCode = context.getSourceCode().getText(otherSide);
                message =
                  `Unnecessary comparison of boolean with 'true'. Use the variable directly.`;
              } else if (!isStrictEquality && comparingToTrue) {
                // someCondition !== true -> !someCondition
                fixedCode = `!${context.getSourceCode().getText(otherSide)}`;
                message =
                  `Unnecessary comparison of boolean with 'true'. Use negation instead.`;
              } else if (isStrictEquality && !comparingToTrue) {
                // someCondition === false -> !someCondition
                fixedCode = `!${context.getSourceCode().getText(otherSide)}`;
                message =
                  `Unnecessary comparison of boolean with 'false'. Use negation instead.`;
              } else {
                // someCondition !== false -> someCondition
                fixedCode = context.getSourceCode().getText(otherSide);
                message =
                  `Unnecessary comparison of boolean with 'false'. Use the variable directly.`;
              }

              context.report({
                node,
                message,
                fix(fixer: any) {
                  return fixer.replaceText(node, fixedCode);
                },
              });
            }
          }
        }
      },
    };
  },
};
