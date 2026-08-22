import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    // JWT_SECRET must exist before src/lib/auth.ts or payment-token.ts is imported —
    // requiredSecret() throws by design when it is missing (SEC-1).
    env: { JWT_SECRET: "test-secret-at-least-32-characters-long-xxxx" },
    coverage: { provider: "v8", include: ["src/lib/**", "src/services/**"], reporter: ["text", "lcov"] },
  },
});
