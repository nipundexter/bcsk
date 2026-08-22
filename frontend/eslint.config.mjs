import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  /**
   * Phase A / rule 1 of the separation plan: `src/server/**` is the framework-free core.
   *
   * This is the load-bearing constraint of the whole architecture — it is what lets the
   * core move to a separate service, a worker, or a test harness with no HTTP. Enforced
   * here rather than by convention, because a boundary maintained by discipline alone is
   * one broken import away from not existing.
   */
  {
    files: ["src/server/**/*.ts", "src/server/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["next", "next/*", "server-only", "client-only"],
              message:
                "src/server/** is the framework-free core and must not import from Next.js. " +
                "Anything needing a request, cookies, headers or redirects belongs in the " +
                "delivery layer (src/app/** or src/lib/**), which passes an Actor into the service.",
            },
            {
              group: ["react", "react-dom", "react/*"],
              message:
                "src/server/** must not import React. Rendering is a delivery concern; " +
                "services return plain data.",
            },
            {
              group: ["@/app/*", "@/components/*", "@/features/*"],
              message:
                "src/server/** must not depend on the delivery layer. Dependencies point " +
                "inward: app → server → lib, never the reverse.",
            },
          ],
        },
      ],
    },
  },

  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Test output
    "playwright-report/**",
    "test-results/**",
    "coverage/**",
  ]),
]);

export default eslintConfig;
