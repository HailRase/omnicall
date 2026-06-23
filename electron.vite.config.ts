import { resolve } from "node:path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

const srcRoot = resolve(__dirname, "src");

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@shared": resolve(srcRoot, "shared"),
        "@infrastructure": resolve(srcRoot, "infrastructure"),
        "@ports": resolve(srcRoot, "ports"),
        "@adapters": resolve(srcRoot, "adapters"),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@shared": resolve(srcRoot, "shared"),
      },
    },
  },
  renderer: {
    plugins: [react()],
    resolve: {
      alias: {
        "@renderer": resolve(srcRoot, "renderer"),
        "@application": resolve(srcRoot, "application"),
        "@shared": resolve(srcRoot, "shared"),
      },
    },
  },
});
