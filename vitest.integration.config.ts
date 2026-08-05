import { defineConfig } from "vitest/config";
import path from "node:path";

// Separate from vitest.config.ts on purpose: these tests hit the real shared
// Neon database (dev/preview/prod all share one DB — see LAUNCH_PROGRESS.md).
// They only ever touch rows they create themselves (tagged, disposable family
// names) and clean up in afterAll, but they are NOT run by the default `npm test`
// so they never fire in CI without someone deliberately choosing to run them.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    setupFiles: ["./vitest.setup.integration.ts"],
    testTimeout: 20000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
