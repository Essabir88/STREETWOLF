import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    env: {
      // src/db/index.ts throws at import time if this is unset. Tests that
      // don't mock "@/db" (e.g. products.test.ts, which only imports a pure
      // helper) still transitively import that module, but never actually
      // run a query against it — the pg Pool connects lazily — so a
      // syntactically valid but unreachable URL is enough.
      DATABASE_URL: "postgres://test:test@localhost:5432/test_unused",
      JWT_SECRET: "test-jwt-secret-not-for-production-use-only",
    },
  },
});
