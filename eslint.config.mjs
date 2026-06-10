import { FlatCompat } from "@eslint/eslintrc";
import nextPlugin from "@next/eslint-plugin-next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      "@next/next": nextPlugin
    }
  },
  {
    ignores: [".next/**", ".test-build/**", "node_modules/**", "next-env.d.ts", "tests/register-paths.cjs"]
  }
];

export default eslintConfig;
