import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    globalSetup: "./tests/global-setup.ts",
    env: { DATABASE_URL: "file:./test.db", AUTH_SECRET: "test-secret" },
    fileParallelism: false,
  },
});
