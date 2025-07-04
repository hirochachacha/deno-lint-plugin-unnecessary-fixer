// This file demonstrates the edge case where type assertions are necessary
// for type narrowing from unknown/any types

// Example 1: Event.target has type EventTarget | null, but accessing .value requires type narrowing
function handleInput(e: Event) {
  // This type assertion should NOT be flagged as unnecessary
  // because e.target needs to be narrowed from EventTarget | null to HTMLTextAreaElement
  const value = (e.target as HTMLTextAreaElement).value;
  console.log(value);
}

// Example 2: Similar case with HTMLInputElement
function handleChange(event: Event) {
  // This is necessary type narrowing
  const inputValue = (event.target as HTMLInputElement).value;
  const isChecked = (event.target as HTMLInputElement).checked;

  console.log(inputValue, isChecked);
}

// Example 3: Cases that SHOULD still be flagged
function unnecessaryAssertions() {
  const str = "hello";
  // This should still be flagged as unnecessary
  const str2 = str;

  const num = 42;
  // This should still be flagged as unnecessary
  const num2 = num;
}

// Example 4: Type narrowing in React-style event handlers
type ChangeEvent = {
  target: EventTarget | null;
};

function handleReactChange(e: ChangeEvent) {
  // This assertion is necessary for type narrowing
  const value = (e.target as HTMLInputElement).value;
  console.log(value);
}
