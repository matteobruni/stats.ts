import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import stylistic from "@stylistic/eslint-plugin";
import tseslint from "typescript-eslint";

export default defineConfig(
  js.configs.recommended,
  stylistic.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  eslintConfigPrettier,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-var-requires": "warn",
      "@typescript-eslint/no-restricted-types": [
        "warn",
        {
          "types": {
            "Object": { "message": "Usa {} al suo posto", "fixWith": "{}" },
            "Function": { "message": "Usa un tipo funzione specifico, es: () => void" }
          }
        }
      ],
    },
    ignores: ["dist/", "node_modules/", ".github/"],
  }
);