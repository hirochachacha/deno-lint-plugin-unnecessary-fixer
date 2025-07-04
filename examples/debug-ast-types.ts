// This file helps understand AST node types for different TypeScript types

// String type
const str: string = "hello";
const str2 = str; // typeAnnotation.type should be TSStringKeyword

// Number type
const num: number = 42;
const num2 = num; // typeAnnotation.type should be TSNumberKeyword

// Boolean type
const bool: boolean = true;
const bool2 = bool; // typeAnnotation.type should be TSBooleanKeyword

// Array type
const arr: number[] = [1, 2, 3];
const arr2 = arr; // typeAnnotation.type should be TSArrayType

// Generic array type
const arr3: Array<string> = ["a", "b"];
const arr4 = arr3; // typeAnnotation.type should be TSTypeReference with typeName "Array"
