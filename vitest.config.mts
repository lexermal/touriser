import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // server-only throws outside React Server Components; tests import db.ts directly.
      "server-only": path.resolve(import.meta.dirname, "tests/unit/empty.ts"),
    },
  },
  test: { include: ["tests/unit/**/*.test.ts"] },
});
