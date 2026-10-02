import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        // `_x` marks intentionally unused bindings; rest siblings strip fields before responding.
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn"
    }
  },
  {
    // Jest tests load mocked modules with require() and build loosely typed fixtures.
    files: ["**/__tests__/**", "**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      // next/image is mocked with a plain <img> in component tests.
      "@next/next/no-img-element": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "venv/**",
    "**/venv/**",
    "guardrails-service/**",
    "scratch/**",
    ".worktrees/**",
    "e2b-sandbox-template/**",
  ]),
]);

export default eslintConfig;
