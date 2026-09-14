import globals from "globals";

export default [
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser
      },
      ecmaVersion: 2022,
      sourceType: "module"
    },
    rules: {
      "no-undef": "error"
    }
  }
];
