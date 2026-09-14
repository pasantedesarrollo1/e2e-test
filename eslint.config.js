import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser
      },
      ecmaVersion: "latest",
      sourceType: "module"
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": "warn",
      "no-unreachable": "warn" 
    }
  }
];