export const noUnnecessaryTypeConversion = {
  create(context: any) {
    // Track variable types for more accurate detection
    const variableTypes = new Map<string, string>();

    // Helper to determine if an expression is definitely a string
    function isDefinitelyString(node: any): boolean {
      if (node.type === "Literal" && typeof node.value === "string") {
        return true;
      }
      if (node.type === "TemplateLiteral") {
        return true;
      }
      if (node.type === "Identifier") {
        return variableTypes.get(node.name) === "string";
      }
      return false;
    }

    // Helper to determine if an expression is definitely a number
    function isDefinitelyNumber(node: any): boolean {
      if (node.type === "Literal" && typeof node.value === "number") {
        return true;
      }
      if (node.type === "Identifier") {
        return variableTypes.get(node.name) === "number";
      }
      if (node.type === "BinaryExpression") {
        const arithmeticOps = ["+", "-", "*", "/", "%", "**"];
        return arithmeticOps.includes(node.operator) &&
          isDefinitelyNumber(node.left) &&
          isDefinitelyNumber(node.right);
      }
      return false;
    }

    // Helper to determine if an expression is definitely a boolean
    function isDefinitelyBoolean(node: any): boolean {
      if (node.type === "Literal" && typeof node.value === "boolean") {
        return true;
      }
      if (node.type === "Identifier") {
        return variableTypes.get(node.name) === "boolean";
      }
      if (node.type === "BinaryExpression") {
        const comparisonOps = ["==", "===", "!=", "!==", "<", ">", "<=", ">="];
        return comparisonOps.includes(node.operator);
      }
      if (node.type === "UnaryExpression" && node.operator === "!") {
        return true;
      }
      return false;
    }

    // Helper to determine if an expression is definitely a BigInt
    function isDefinitelyBigInt(node: any): boolean {
      if (node.type === "Literal" && typeof node.value === "bigint") {
        return true;
      }
      if (
        node.type === "CallExpression" &&
        node.callee.type === "Identifier" &&
        node.callee.name === "BigInt"
      ) {
        return true;
      }
      if (node.type === "Identifier") {
        return variableTypes.get(node.name) === "bigint";
      }
      return false;
    }

    // Helper to get the source text of a node
    function getSourceText(node: any): string {
      return context.getSourceCode().getText(node);
    }

    return {
      // Track variable declarations
      VariableDeclarator(node: any) {
        if (node.id.type === "Identifier" && node.init) {
          if (isDefinitelyString(node.init)) {
            variableTypes.set(node.id.name, "string");
          } else if (isDefinitelyNumber(node.init)) {
            variableTypes.set(node.id.name, "number");
          } else if (isDefinitelyBoolean(node.init)) {
            variableTypes.set(node.id.name, "boolean");
          } else if (isDefinitelyBigInt(node.init)) {
            variableTypes.set(node.id.name, "bigint");
          }
        }
      },

      // Check String() calls
      CallExpression(node: any) {
        if (node.callee.type === "Identifier") {
          const funcName = node.callee.name;

          // String() conversion
          if (funcName === "String" && node.arguments.length === 1) {
            const arg = node.arguments[0];
            if (isDefinitelyString(arg)) {
              context.report({
                node,
                message: "Unnecessary String() conversion of string value",
                fix(fixer: any) {
                  return fixer.replaceText(node, getSourceText(arg));
                },
              });
            }
          } // Number() conversion
          else if (funcName === "Number" && node.arguments.length === 1) {
            const arg = node.arguments[0];
            if (isDefinitelyNumber(arg)) {
              context.report({
                node,
                message: "Unnecessary Number() conversion of numeric value",
                fix(fixer: any) {
                  return fixer.replaceText(node, getSourceText(arg));
                },
              });
            }
          } // Boolean() conversion
          else if (funcName === "Boolean" && node.arguments.length === 1) {
            const arg = node.arguments[0];
            if (isDefinitelyBoolean(arg)) {
              context.report({
                node,
                message: "Unnecessary Boolean() conversion of boolean value",
                fix(fixer: any) {
                  return fixer.replaceText(node, getSourceText(arg));
                },
              });
            }
          } // BigInt() conversion
          else if (funcName === "BigInt" && node.arguments.length === 1) {
            const arg = node.arguments[0];
            if (isDefinitelyBigInt(arg)) {
              context.report({
                node,
                message: "Unnecessary BigInt() conversion of BigInt value",
                fix(fixer: any) {
                  return fixer.replaceText(node, getSourceText(arg));
                },
              });
            }
          }
        }
      },

      // Check .toString() calls on strings
      MemberExpression(node: any) {
        if (
          node.property.type === "Identifier" &&
          node.property.name === "toString" &&
          node.parent?.type === "CallExpression" &&
          node.parent.callee === node &&
          node.parent.arguments.length === 0
        ) {
          if (isDefinitelyString(node.object)) {
            context.report({
              node: node.parent,
              message: "Unnecessary .toString() call on string value",
              fix(fixer: any) {
                return fixer.replaceText(
                  node.parent,
                  getSourceText(node.object),
                );
              },
            });
          }
        }
      },

      // Check unary operators
      UnaryExpression(node: any) {
        // Unary + on number
        if (node.operator === "+" && isDefinitelyNumber(node.argument)) {
          context.report({
            node,
            message: "Unnecessary unary + operator on numeric value",
            fix(fixer: any) {
              return fixer.replaceText(node, getSourceText(node.argument));
            },
          });
        } // Double bitwise NOT (~~) on number
        else if (
          node.operator === "~" &&
          node.argument.type === "UnaryExpression" &&
          node.argument.operator === "~" &&
          isDefinitelyNumber(node.argument.argument)
        ) {
          context.report({
            node,
            message: "Unnecessary ~~ operator on numeric value",
            fix(fixer: any) {
              return fixer.replaceText(
                node,
                getSourceText(node.argument.argument),
              );
            },
          });
        } // Double logical NOT (!!) on boolean
        else if (
          node.operator === "!" &&
          node.argument.type === "UnaryExpression" &&
          node.argument.operator === "!" &&
          isDefinitelyBoolean(node.argument.argument)
        ) {
          context.report({
            node,
            message: "Unnecessary !! operator on boolean value",
            fix(fixer: any) {
              return fixer.replaceText(
                node,
                getSourceText(node.argument.argument),
              );
            },
          });
        }
      },

      // Check binary expressions for string concatenation
      BinaryExpression(node: any) {
        if (node.operator === "+") {
          // Check for '' + string
          if (
            node.left.type === "Literal" &&
            node.left.value === "" &&
            isDefinitelyString(node.right)
          ) {
            context.report({
              node,
              message: "Unnecessary empty string concatenation",
              fix(fixer: any) {
                return fixer.replaceText(node, getSourceText(node.right));
              },
            });
          } // Check for string + ''
          else if (
            node.right.type === "Literal" &&
            node.right.value === "" &&
            isDefinitelyString(node.left)
          ) {
            context.report({
              node,
              message: "Unnecessary empty string concatenation",
              fix(fixer: any) {
                return fixer.replaceText(node, getSourceText(node.left));
              },
            });
          }
        }
      },

      // Check assignment expressions for str += ''
      AssignmentExpression(node: any) {
        if (
          node.operator === "+=" &&
          node.left.type === "Identifier" &&
          node.right.type === "Literal" &&
          node.right.value === "" &&
          isDefinitelyString(node.left)
        ) {
          context.report({
            node,
            message: "Unnecessary empty string concatenation assignment",
            fix(fixer: any) {
              // Remove the entire statement if it's an expression statement
              if (node.parent?.type === "ExpressionStatement") {
                return fixer.remove(node.parent);
              }
              // Otherwise just replace with the variable
              return fixer.replaceText(node, getSourceText(node.left));
            },
          });
        }
      },
    };
  },
};
