export const noUnnecessaryTypeAssertion = {
  create(context: any) {
    // Track type information
    // deno-lint-ignore no-explicit-any
    const typeInfo = new Map<string, any>();

    return {
      // Track type aliases
      TSTypeAliasDeclaration(node: any) {
        if (node.id.type === "Identifier") {
          typeInfo.set(node.id.name, {
            type: "alias",
            aliasType: node.typeAnnotation,
            node: node,
          });
        }
      },

      // Track variable declarations with their types
      VariableDeclarator(node: any) {
        if (node.id.type === "Identifier") {
          const properties = new Set<string>();

          // If it has a type annotation, extract property info
          if (node.id.typeAnnotation) {
            extractProperties(node.id.typeAnnotation, properties);
          }

          // If initialized with object literal, track its properties
          if (node.init && node.init.type === "ObjectExpression") {
            node.init.properties.forEach((prop: any) => {
              if (
                prop.type === "Property" && prop.key.type === "Identifier"
              ) {
                properties.add(prop.key.name);
              }
            });
          }

          typeInfo.set(node.id.name, {
            type: node.id.typeAnnotation,
            node: node,
            properties: properties,
            // If it's initialized with 'new ClassName()', inherit class properties
            className: node.init && node.init.type === "NewExpression" &&
                node.init.callee.type === "Identifier"
              ? node.init.callee.name
              : undefined,
          });
        }
      },

      // Track interface declarations
      TSInterfaceDeclaration(node: any) {
        if (node.id && node.id.type === "Identifier") {
          const properties = new Set<string>();

          // Track interface properties
          if (node.body && node.body.body) {
            node.body.body.forEach((member: any) => {
              if (
                member.type === "TSPropertySignature" &&
                member.key?.type === "Identifier"
              ) {
                properties.add(member.key.name);
              } else if (
                member.type === "TSMethodSignature" &&
                member.key?.type === "Identifier"
              ) {
                properties.add(member.key.name);
              }
            });
          }

          typeInfo.set(node.id.name, {
            type: "interface",
            interfaceName: node.id.name,
            node: node,
            properties: properties,
          });
        }
      },

      // Track class declarations
      ClassDeclaration(node: any) {
        if (node.id) {
          const properties = new Set<string>();

          // Track class properties and methods
          if (node.body && node.body.body) {
            node.body.body.forEach((member: any) => {
              if (
                member.type === "PropertyDefinition" &&
                member.key.type === "Identifier"
              ) {
                properties.add(member.key.name);
              } else if (
                member.type === "MethodDefinition" &&
                member.key.type === "Identifier"
              ) {
                properties.add(member.key.name);
              }
            });
          }

          typeInfo.set(node.id.name, {
            type: "class",
            className: node.id.name,
            node: node,
            properties: properties,
          });
        }
      },

      // Check TSAsExpression (TypeScript "as" casting)
      TSAsExpression(node: any) {
        const isCastToAny = node.typeAnnotation.type === "TSAnyKeyword";

        // Skip type assertions on member expressions where we're narrowing from unknown/any
        // e.g., (e.target as HTMLTextAreaElement) where target might be unknown
        if (!isCastToAny && node.expression.type === "MemberExpression") {
          // For now, we'll be conservative and not flag any type assertions on member expressions
          // where we don't have full type information about the object or property
          const objectName = node.expression.object.type === "Identifier"
            ? node.expression.object.name
            : null;
          if (!objectName || !typeInfo.has(objectName)) {
            // We don't have type info for the object, so the assertion might be necessary
            return;
          }
        }

        // Check for type assertions on literals or expressions
        if (
          !isCastToAny &&
          isUnnecessaryTypeAssertion(node.expression, node.typeAnnotation)
        ) {
          context.report({
            node: node,
            message: `Unnecessary type assertion`,
            fix(fixer: any) {
              const exprText = context.sourceCode.getText(node.expression);
              return fixer.replaceText(node, exprText);
            },
          });
          return;
        }

        // For casts to 'any', check if it's being used for member access
        if (isCastToAny && node.parent?.type === "MemberExpression") {
          const memberExpr = node.parent;
          if (
            memberExpr.property.type === "Identifier" &&
            node.expression.type === "Identifier"
          ) {
            const varName = node.expression.name;
            const propName = memberExpr.property.name;
            const varInfo = typeInfo.get(varName);

            if (varInfo && hasProperty(varInfo, propName)) {
              context.report({
                node: node,
                message:
                  `Unnecessary type assertion to 'any' - property '${propName}' exists on '${varName}'`,
                fix(fixer: any) {
                  return fixer.replaceText(node, varName);
                },
              });
              return;
            }
          }
        }

        // Skip other casts to 'any' as they might be intentional
        if (isCastToAny) {
          return;
        }

        // Check if used in member expression
        if (
          node.parent?.type === "MemberExpression" &&
          node.parent.object === node
        ) {
          // Skip if the expression is of type unknown - the assertion is necessary
          if (node.expression.type === "Identifier") {
            const varName = node.expression.name;
            const varInfo = typeInfo.get(varName);
            if (
              varInfo &&
              varInfo.type?.typeAnnotation?.type === "TSUnknownKeyword"
            ) {
              return;
            }
          }

          context.report({
            node: node,
            message: `Unnecessary type assertion when accessing property`,
            fix(fixer: any) {
              const exprText = context.sourceCode.getText(node.expression);
              return fixer.replaceText(node, exprText);
            },
          });
          return;
        }

        // Get the expression being cast
        if (node.expression.type === "Identifier") {
          const varName = node.expression.name;
          const varInfo = typeInfo.get(varName);

          if (varInfo) {
            // Check if the cast type matches the variable's type
            const castTypeName = getCastTypeName(node.typeAnnotation);
            const actualTypeName = getActualTypeName(varInfo);

            if (
              castTypeName && actualTypeName &&
              typesAreEquivalent(castTypeName, actualTypeName)
            ) {
              context.report({
                node: node,
                message:
                  `Unnecessary type assertion - '${varName}' is already type '${actualTypeName}'`,
                fix(fixer: any) {
                  return fixer.replaceText(node, varName);
                },
              });
            }
          }
        }
      },

      // Also check TSTypeAssertion (older <Type> syntax)
      TSTypeAssertion(node: any) {
        // Check if used in member expression
        if (
          node.parent?.type === "MemberExpression" &&
          node.parent.object === node
        ) {
          // Skip if the expression is of type unknown - the assertion is necessary
          if (node.expression.type === "Identifier") {
            const varName = node.expression.name;
            const varInfo = typeInfo.get(varName);
            if (
              varInfo &&
              varInfo.type?.typeAnnotation?.type === "TSUnknownKeyword"
            ) {
              return;
            }
          }

          context.report({
            node: node,
            message: `Unnecessary type assertion when accessing property`,
            fix(fixer: any) {
              const exprText = context.sourceCode.getText(node.expression);
              return fixer.replaceText(node, exprText);
            },
          });
          return;
        }

        // Check for type assertions on literals or expressions
        if (
          isUnnecessaryTypeAssertion(node.expression, node.typeAnnotation)
        ) {
          context.report({
            node: node,
            message: `Unnecessary type assertion`,
            fix(fixer: any) {
              // Get the source text of the expression
              const exprText = context.sourceCode.getText(node.expression);
              return fixer.replaceText(node, exprText);
            },
          });
          return;
        }

        if (node.expression.type === "Identifier") {
          const varName = node.expression.name;
          const varInfo = typeInfo.get(varName);

          if (varInfo) {
            const castTypeName = getCastTypeName(node.typeAnnotation);
            const actualTypeName = getActualTypeName(varInfo);

            if (
              castTypeName && actualTypeName &&
              typesAreEquivalent(castTypeName, actualTypeName)
            ) {
              context.report({
                node: node,
                message:
                  `Unnecessary type assertion - '${varName}' is already type '${actualTypeName}'`,
                fix(fixer: any) {
                  return fixer.replaceText(node, varName);
                },
              });
            }
          }
        }
      },

      // Check TSNonNullExpression (! operator)
      TSNonNullExpression(node: any) {
        // Check if it's a literal or computed value
        if (isDefinitelyNonNull(node.expression)) {
          context.report({
            node: node,
            message: `Unnecessary non-null assertion`,
            fix(fixer: any) {
              const exprText = context.sourceCode.getText(node.expression);
              return fixer.replaceText(node, exprText);
            },
          });
          return;
        }

        // Check if it's an identifier with known type
        if (node.expression.type === "Identifier") {
          const varName = node.expression.name;
          const varInfo = typeInfo.get(varName);

          // If we have type info and it's not nullable, flag it
          if (varInfo && varInfo.type && !isNullableType(varInfo.type)) {
            context.report({
              node: node,
              message:
                `Unnecessary non-null assertion - '${varName}' is not nullable`,
              fix(fixer: any) {
                return fixer.replaceText(node, varName);
              },
            });
          }
        }
      },
    };

    function getCastTypeName(typeAnnotation: any): string | null {
      // Handle generic Array<T> syntax first
      if (
        typeAnnotation.type === "TSTypeReference" &&
        typeAnnotation.typeName?.type === "Identifier" &&
        typeAnnotation.typeName.name === "Array" &&
        typeAnnotation.typeParameters?.params?.length === 1
      ) {
        const elementType = getCastTypeName(
          typeAnnotation.typeParameters.params[0],
        );
        return elementType ? `Array<${elementType}>` : null;
      }

      // Handle type references (custom types, interfaces, classes)
      if (
        typeAnnotation.type === "TSTypeReference" &&
        typeAnnotation.typeName.type === "Identifier"
      ) {
        return typeAnnotation.typeName.name;
      }

      // Handle built-in primitive types
      if (typeAnnotation.type === "TSStringKeyword") {
        return "string";
      }
      if (typeAnnotation.type === "TSNumberKeyword") {
        return "number";
      }
      if (typeAnnotation.type === "TSBooleanKeyword") {
        return "boolean";
      }
      if (typeAnnotation.type === "TSAnyKeyword") {
        return "any";
      }
      if (typeAnnotation.type === "TSUnknownKeyword") {
        return "unknown";
      }
      if (typeAnnotation.type === "TSVoidKeyword") {
        return "void";
      }
      if (typeAnnotation.type === "TSNullKeyword") {
        return "null";
      }
      if (typeAnnotation.type === "TSUndefinedKeyword") {
        return "undefined";
      }

      // Handle array types
      if (typeAnnotation.type === "TSArrayType") {
        const elementType = getCastTypeName(typeAnnotation.elementType);
        return elementType ? `${elementType}[]` : null;
      }

      return null;
    }

    function getActualTypeName(varInfo: any) {
      if (varInfo.type === "class") {
        return varInfo.className;
      }
      if (varInfo.type === "interface") {
        return varInfo.interfaceName;
      }
      if (varInfo.type && varInfo.type.typeAnnotation) {
        return getCastTypeName(varInfo.type.typeAnnotation);
      }
      return null;
    }

    function hasProperty(varInfo: any, propName: string) {
      // Check direct properties
      if (varInfo.properties && varInfo.properties.has(propName)) {
        return true;
      }

      // If it's an instance of a class, check the class properties
      if (varInfo.className) {
        const classInfo = typeInfo.get(varInfo.className);
        if (
          classInfo && classInfo.properties &&
          classInfo.properties.has(propName)
        ) {
          return true;
        }
      }

      return false;
    }

    function extractProperties(typeAnnotation: any, properties: Set<string>) {
      if (!typeAnnotation || !typeAnnotation.typeAnnotation) return;

      const annotation = typeAnnotation.typeAnnotation;

      // Handle type literal: { a: string; b: number; }
      if (annotation.type === "TSTypeLiteral") {
        annotation.members?.forEach((member: any) => {
          if (
            member.type === "TSPropertySignature" &&
            member.key?.type === "Identifier"
          ) {
            properties.add(member.key.name);
          }
        });
      }
    }

    function isUnnecessaryTypeAssertion(expression: any, typeAnnotation: any) {
      // Resolve type aliases
      let resolvedType = typeAnnotation;
      if (
        typeAnnotation.type === "TSTypeReference" &&
        typeAnnotation.typeName?.type === "Identifier"
      ) {
        const aliasName = typeAnnotation.typeName.name;
        const aliasInfo = typeInfo.get(aliasName);
        if (aliasInfo && aliasInfo.type === "alias") {
          resolvedType = aliasInfo.aliasType;
        }
      }

      // Check if asserting number type on numeric literal or arithmetic
      if (
        resolvedType.type === "TSNumberKeyword" ||
        (resolvedType.type === "TSTypeReference" &&
          resolvedType.typeName?.type === "Identifier" &&
          resolvedType.typeName.name === "number")
      ) {
        return isNumericExpression(expression);
      }

      // Check if asserting string type on string literal
      if (
        resolvedType.type === "TSStringKeyword" ||
        (resolvedType.type === "TSTypeReference" &&
          resolvedType.typeName?.type === "Identifier" &&
          resolvedType.typeName.name === "string")
      ) {
        return expression.type === "Literal" &&
          typeof expression.value === "string";
      }

      // Check if asserting boolean type on boolean literal
      if (
        resolvedType.type === "TSBooleanKeyword" ||
        (resolvedType.type === "TSTypeReference" &&
          resolvedType.typeName?.type === "Identifier" &&
          resolvedType.typeName.name === "boolean")
      ) {
        return expression.type === "Literal" &&
          typeof expression.value === "boolean";
      }

      return false;
    }

    function isNumericExpression(node: any): boolean {
      if (node.type === "Literal" && typeof node.value === "number") {
        return true;
      }
      if (node.type === "BinaryExpression") {
        const arithmeticOps = ["+", "-", "*", "/", "%", "**"];
        if (arithmeticOps.includes(node.operator)) {
          return isNumericExpression(node.left) &&
            isNumericExpression(node.right);
        }
      }
      if (
        node.type === "UnaryExpression" &&
        (node.operator === "+" || node.operator === "-")
      ) {
        return isNumericExpression(node.argument);
      }
      return false;
    }

    function isDefinitelyNonNull(node: any): boolean {
      // Literals are never null
      if (node.type === "Literal") {
        return node.value !== null;
      }

      // Array/Object expressions are never null
      if (
        node.type === "ArrayExpression" || node.type === "ObjectExpression"
      ) {
        return true;
      }

      // New expressions are never null
      if (node.type === "NewExpression") {
        return true;
      }

      // Numeric/string expressions are never null
      if (isNumericExpression(node)) {
        return true;
      }

      // Binary expressions (except nullish coalescing) are never null
      if (node.type === "BinaryExpression" && node.operator !== "??") {
        return true;
      }

      return false;
    }

    function isNullableType(typeAnnotation: any): boolean {
      if (!typeAnnotation || !typeAnnotation.typeAnnotation) return false;

      const annotation = typeAnnotation.typeAnnotation;

      // Union types might be nullable
      if (annotation.type === "TSUnionType") {
        return annotation.types.some((t: any) =>
          t.type === "TSNullKeyword" ||
          t.type === "TSUndefinedKeyword"
        );
      }

      // Optional types are nullable
      if (annotation.type === "TSOptionalType") {
        return true;
      }

      return false;
    }

    function typesAreEquivalent(type1: string, type2: string): boolean {
      // Direct match
      if (type1 === type2) return true;

      // Handle Array<T> vs T[] equivalence
      const arrayGenericMatch = type1.match(/^Array<(.+)>$/);
      const arrayBracketMatch = type2.match(/^(.+)\[\]$/);

      if (arrayGenericMatch && arrayBracketMatch) {
        return arrayGenericMatch[1] === arrayBracketMatch[1];
      }

      const arrayGenericMatch2 = type2.match(/^Array<(.+)>$/);
      const arrayBracketMatch2 = type1.match(/^(.+)\[\]$/);

      if (arrayGenericMatch2 && arrayBracketMatch2) {
        return arrayGenericMatch2[1] === arrayBracketMatch2[1];
      }

      return false;
    }
  },
};
