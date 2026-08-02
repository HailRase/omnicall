import { resolve } from "node:path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

const srcRoot = resolve(__dirname, "src");

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@domain": resolve(srcRoot, "domain"),
        "@shared": resolve(srcRoot, "shared"),
        "@infrastructure": resolve(srcRoot, "infrastructure"),
        "@ports": resolve(srcRoot, "ports"),
        "@adapters": resolve(srcRoot, "adapters"),
      },
    },
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(srcRoot, "preload/index.ts"),
          externalApplicationGuest: resolve(
            srcRoot,
            "preload/externalApplicationGuest.ts",
          ),
        },
        output: {
          format: "cjs",
          entryFileNames: "[name].js",
          // Sandboxed Electron preloads cannot reliably load shared Rollup chunks.
          // Keep each preload entry self-contained (no `require("./chunks/…")`).
          manualChunks: undefined,
          chunkFileNames: "[name].js",
        },
      },
    },
    resolve: {
      alias: {
        "@shared": resolve(srcRoot, "shared"),
      },
    },
  },
  renderer: {
    plugins: [react()],
    css: {
      modules: {
        localsConvention: "camelCase",
      },
    },
    optimizeDeps: {
      include: ["@hailrase/jssip", "@hailrase/jssip/lib/RTCSession.js"],
    },
    resolve: {
      alias: {
        "@renderer": resolve(srcRoot, "renderer"),
        "@application": resolve(srcRoot, "application"),
        "@domain": resolve(srcRoot, "domain"),
        "@infrastructure": resolve(srcRoot, "infrastructure"),
        "@adapters": resolve(srcRoot, "adapters"),
        "@ports": resolve(srcRoot, "ports"),
        "@shared": resolve(srcRoot, "shared"),
      },
    },
  },
});
