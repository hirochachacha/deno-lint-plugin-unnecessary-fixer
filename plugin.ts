import { noUnnecessaryTypeAssertion } from "./rules/no-unnecessary-type-assertion.ts";

const plugin: Deno.lint.Plugin = {
  name: "no-unnecessary-fixer",
  rules: {
    "no-unnecessary-type-assertion": noUnnecessaryTypeAssertion,
  },
};

export default plugin;
