// Test cases for no-unnecessary-boolean-literal-compare rule

// Should trigger the rule - these are incorrect patterns
declare const someCondition: boolean;

if (someCondition) { // should be `if (someCondition) {`
  console.log("test");
}

if (!someCondition) { // should be `if (!someCondition) {`
  console.log("test");
}

if (!someCondition) { // should be `if (!someCondition) {`
  console.log("test");
}

if (someCondition) { // should be `if (someCondition) {`
  console.log("test");
}

// Testing with function parameters
function testFunc(flag: boolean) {
  if (flag) { // should be `if (flag) {`
    return "yes";
  }

  if (flag) { // should be `if (flag) {`
    return "yes";
  }
}

// Testing with arrow functions
const arrowFunc = (isEnabled: boolean) => {
  if (!isEnabled) { // should be `if (!isEnabled) {`
    return false;
  }

  if (!isEnabled) { // should be `if (!isEnabled) {`
    return false;
  }
};

// Should NOT trigger the rule - these are correct patterns
declare const someObjectBoolean: boolean | Record<string, unknown>;
if (someObjectBoolean === true) {
  console.log("This is fine - union type");
}

declare const someStringBoolean: boolean | string;
if (someStringBoolean === true) {
  console.log("This is fine - union type");
}

// Normal boolean usage without literal comparison
if (someCondition) {
  console.log("This is correct");
}

if (!someCondition) {
  console.log("This is correct");
}

// Union type parameters should not trigger
function unionFunc(param: boolean | null) {
  if (param === true) {
    return "This is fine";
  }
}
