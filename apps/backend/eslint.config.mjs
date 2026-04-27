// @ts-check
import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import eslintPluginPrettier from "eslint-plugin-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "eslint.config.mjs"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: "commonjs",
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["**/*.spec.ts"],
    rules: {
      "@typescript-eslint/require-await": "off",
    },
  },
  {
    rules: {
      "no-unused-vars": "off",
      "no-mixed-spaces-and-tabs": "off",
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["^\\.\\./", "^\\.\\.$"],
              message:
                "Use the ~/ path alias (tsconfig paths) instead of parent-relative imports.",
            },
            {
              group: ["^src/"],
              message: 'Use "~/" (tsconfig paths) instead of the "src/" import prefix.',
            },
          ],
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
    },
  },
  {
    plugins: { prettier: eslintPluginPrettier },
    rules: {
      "prettier/prettier": "error",
    },
  },
  eslintConfigPrettier,
);
