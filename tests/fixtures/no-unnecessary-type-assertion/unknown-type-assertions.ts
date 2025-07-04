// Test file for type assertions on unknown types
// These assertions should NOT be flagged as unnecessary

// Edge case: Type assertion needed to access properties on unknown
function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      // This assertion is necessary - we can't index into unknown without it
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

// Similar case with any type
function processAnyValue(value: any) {
  // This should be flagged if property exists
  const result = (value as any).existingProp; // If value has existingProp, this is unnecessary

  // But this is necessary for unknown
  function processUnknown(val: unknown) {
    const res = (val).prop; // Necessary
    return res;
  }
}

// Type narrowing from unknown is necessary
function handleEvent(e: Event) {
  // If e.target is unknown/any, this assertion is necessary
  const value = (e.target as HTMLInputElement).value;
  return value;
}

// More unknown type examples
function parseJSON(jsonString: string): unknown {
  const parsed: unknown = JSON.parse(jsonString);

  // All these assertions are necessary
  if (typeof parsed === "object" && parsed !== null) {
    const obj = parsed as Record<string, unknown>;
    const name = (obj).name;
    const items = (parsed as { items: unknown[] }).items;
  }

  return parsed;
}

// Computed property access on unknown
function accessDynamic(data: unknown, key: string) {
  if (data && typeof data === "object") {
    // This assertion is necessary
    return (data)[key];
  }
  return undefined;
}
