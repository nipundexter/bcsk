import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    // No JWT_SECRET here any more: the web app verifies nothing itself, it asks
    // `GET /auth/me`. Injecting one would suggest it still owns a signing key.
    coverage: { provider: "v8", include: ["src/lib/**", "src/services/**"], reporter: ["text", "lcov"] },
  },
});
