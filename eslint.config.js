import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import noSecrets from "eslint-plugin-no-secrets";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**", "eslint-results.sarif"],
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
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
      // Catch high-entropy random strings
      "no-secrets/no-secrets": ["error", { "tolerance": 4.1 }],
      // Catch 'secret: "anything"' in NestJS modules
      "no-restricted-syntax": [
        "error",
        {
          "selector": "Property[key.name='secret'] > Literal[value=/^.+$/]",
          "message": "Leaking secrets I see"
        }
      ]
    },
  }
);
