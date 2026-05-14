import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "node_modules/",
      "dist/",
      "generated/",
      "eslint.config.js",
      "src/modules/_template/**/*",
    ],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": "off",
    },
  },

  {
    files: ["src/modules/_template/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-useless-catch": "off",
      "no-unsafe-optional-chaining": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  prettierConfig,
);
