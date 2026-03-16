import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import noSecrets from "eslint-plugin-no-secrets";

/** @type {import('eslint').Linter.Config[]} */
export default tseslint.config(
  {
    // Global ignores - replaces .eslintignore
    ignores: ["**/dist/**", "**/node_modules/**", "eslint-results.sarif"],
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    plugins: {
      "no-secrets": noSecrets,
    },
    languageOptions: {
      parser: tseslint.parser,
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
      
      // 1. Catch high-entropy "keys" (random gibberish)
      "no-secrets/no-secrets": ["error", { "tolerance": 4.1 }],

      // 2. The Sniper: Block hardcoded strings in NestJS Module secrets
      "no-restricted-syntax": [
        "error",
        {
          "selector": "Property[key.name='secret'] > Literal[value=/^.+$/]",
          "message": "Leaking secrets or smth"
        }
      ]
    },
  }
);
