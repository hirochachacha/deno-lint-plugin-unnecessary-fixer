import { noUnnecessaryTypeAssertion } from "./rules/no-unnecessary-type-assertion.ts";
import { noUnnecessaryBooleanLiteralCompare } from "./rules/no-unnecessary-boolean-literal-compare.ts";
import { noUnnecessaryTypeConversion } from "./rules/no-unnecessary-type-conversion.ts";

const plugin: Deno.lint.Plugin = {
  name: "unnecessary-fixer",
  rules: {
    "no-unnecessary-type-assertion": noUnnecessaryTypeAssertion,
    "no-unnecessary-boolean-literal-compare":
      noUnnecessaryBooleanLiteralCompare,
    "no-unnecessary-type-conversion": noUnnecessaryTypeConversion,
  },
};

export default plugin;
