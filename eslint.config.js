import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import playwright from "eslint-plugin-playwright";

export default tseslint.config(
  {
    ignores: ["playwright-report/", "test-results/", ".auth/", "eslint.config.js"]
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.node
      },
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.js"]
        },
        tsconfigRootDir: import.meta.dirname,
      }
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
    }
  },
  {
    ...playwright.configs["flat/recommended"],
    files: ["e2e/**/*.ts"],
    rules: {
      ...playwright.configs["flat/recommended"].rules,
      "playwright/no-skipped-test": "warn",
      "playwright/no-standalone-expect": "error",
      "playwright/prefer-web-first-assertions": "error",
      "playwright/no-wait-for-timeout": "warn",
    }
  }
);