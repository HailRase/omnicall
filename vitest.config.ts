import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@domain": resolve(__dirname, "src/domain"),
      "@application": resolve(__dirname, "src/application"),
      "@ports": resolve(__dirname, "src/ports"),
      "@adapters": resolve(__dirname, "src/adapters"),
      "@infrastructure": resolve(__dirname, "src/infrastructure"),
      "@shared": resolve(__dirname, "src/shared"),
    },
  },
  test: {
    environment: "node",
    include: [
      "src/domain/**/*.test.ts",
      "src/application/**/*.test.ts",
      "src/shared/**/*.test.ts",
      "src/ports/**/*.test.ts",
      "src/adapters/**/*.test.ts",
      "src/infrastructure/**/*.test.ts",
      "src/renderer/**/*.test.ts",
      "src/renderer/**/*.test.tsx",
    ],
    exclude: ["node_modules", "out", "dist"],
  },
});
