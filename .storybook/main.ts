import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = join(root, "src");

const config: StorybookConfig = {
  stories: ["../src/renderer/**/*.stories.@(ts|tsx)", "../src/renderer/**/*.mdx"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-a11y", "@storybook/addon-docs"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  async viteFinal(config) {
    config.resolve ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@renderer": join(srcRoot, "renderer"),
      "@application": join(srcRoot, "application"),
      "@domain": join(srcRoot, "domain"),
      "@infrastructure": join(srcRoot, "infrastructure"),
      "@adapters": join(srcRoot, "adapters"),
      "@ports": join(srcRoot, "ports"),
      "@shared": join(srcRoot, "shared"),
    };
    return config;
  },
};

export default config;
