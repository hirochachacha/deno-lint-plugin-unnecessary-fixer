// deno-lint-ignore-file no-unnecessary-fixer/no-unnecessary-boolean-literal-compare
// Test cases for no-unnecessary-boolean-literal-compare rule - INCORRECT patterns

// Should trigger the rule - these are incorrect patterns
declare const someCondition: boolean;

if (someCondition === true) { // should be `if (someCondition) {`
  console.log("test");
}

if (someCondition !== true) { // should be `if (!someCondition) {`
  console.log("test");
}

if (someCondition === false) { // should be `if (!someCondition) {`
  console.log("test");
}

if (someCondition !== false) { // should be `if (someCondition) {`
  console.log("test");
}

// Testing with function parameters
function testFunc(flag: boolean) {
  if (flag === true) { // should be `if (flag) {`
    return "yes";
  }

  if (flag !== false) { // should be `if (flag) {`
    return "yes";
  }
}

// Testing with arrow functions
const arrowFunc = (isEnabled: boolean) => {
  if (isEnabled === false) { // should be `if (!isEnabled) {`
    return false;
  }

  if (isEnabled !== true) { // should be `if (!isEnabled) {`
    return false;
  }
};
