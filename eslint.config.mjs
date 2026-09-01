import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    files: ["app/(workspace)/**/*.tsx"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
  globalIgnores(["convex/_generated"]),
]);
