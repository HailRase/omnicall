import js from "@eslint/js";
import boundaries from "eslint-plugin-boundaries";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

const boundaryElements = [
  { type: "domain", pattern: "src/domain/**", mode: "folder" },
  {
    type: "application",
    pattern: "src/application/**",
    mode: "folder",
  },
  { type: "ports", pattern: "src/ports/**", mode: "folder" },
  { type: "adapters", pattern: "src/adapters/**", mode: "folder" },
  {
    type: "infrastructure",
    pattern: "src/infrastructure/**",
    mode: "folder",
  },
  { type: "shared", pattern: "src/shared/**", mode: "folder" },
  { type: "renderer", pattern: "src/renderer/**", mode: "folder" },
  { type: "main", pattern: "src/main/**", mode: "folder" },
  { type: "preload", pattern: "src/preload/**", mode: "folder" },
];

export default tseslint.config(
  {
    ignores: [
      "out/**",
      "dist/**",
      "node_modules/**",
      "scripts/**",
      // DI-* Node smoke harnesses (same class as root scripts/** — not product TS).
      "axatalk-sdk-integration/scripts/**",
      ".storybook/**",
      // Nested SDK workspace has its own ESLint/tsconfig (SDK-00+). Do not lint it from desktop root.
      "axatalk-sdk/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      boundaries,
    },
    settings: {
      "boundaries/elements": boundaryElements,
      "boundaries/include": ["src/**"],
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-deprecated": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            { from: "domain", allow: ["domain", "shared"] },
            {
              from: "application",
              allow: ["application", "domain", "ports", "shared"],
            },
            { from: "ports", allow: ["ports", "domain", "shared"] },
            {
              from: "adapters",
              allow: [
                "adapters",
                "ports",
                "domain",
                "shared",
                "infrastructure",
              ],
            },
            {
              from: "infrastructure",
              allow: [
                "infrastructure",
                "ports",
                "shared",
                "adapters",
                "application",
                "domain",
              ],
            },
            { from: "shared", allow: ["shared"] },
            {
              from: "renderer",
              allow: ["renderer", "application", "shared", "infrastructure"],
            },
            {
              from: "main",
              allow: [
                "main",
                "infrastructure",
                "adapters",
                "ports",
                "shared",
              ],
            },
            { from: "preload", allow: ["preload", "shared"] },
          ],
        },
      ],
    },
  },
  {
    files: ["eslint.config.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@axata/axatalk-protocol",
                "@axata/axatalk-protocol/*",
                "zod",
                "zod/*",
                "electron",
                "electron/*",
                "ws",
                "ws/*",
              ],
              message:
                "Domain must not import @axata/axatalk-protocol, Zod, Electron, or ws (F-011 / ADR-0009).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/renderer/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/dot-notation": [
        "error",
        {
          allowPrivateClassPropertyAccess: true,
          allowKeywords: true,
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          message:
            "CSS Modules: use dot notation (styles.rowPanel), not styles['rowPanel']. For dynamic variants use a Record map.",
          selector:
            "MemberExpression[computed=true][property.type='Literal']:matches([object.name='styles'], [object.name=/Styles$/])",
        },
        {
          message:
            "CSS Modules: use a typed Record map for dynamic class names instead of template literals on styles.",
          selector:
            "MemberExpression[computed=true][property.type='TemplateLiteral']:matches([object.name='styles'], [object.name=/Styles$/])",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@domain", "@domain/*"],
              message:
                "Renderer must not import Domain directly. Use @application view-models and projections (see docs/softphone/UI-Architecture.md).",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "src/renderer/components/**/*.{ts,tsx}",
      "src/renderer/shared/ui/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@domain", "@domain/*"],
              message: "Components must not import Domain.",
            },
            {
              group: ["@adapters", "@adapters/*", "@ports", "@ports/*"],
              message: "Components must not import adapters or ports.",
            },
            {
              group: ["**/facades/**", "**/use-cases/**", "**/*UseCase*"],
              message:
                "Components must not import facades or Use Cases. Use *Actions hooks.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/renderer/hooks/**/*Actions.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@domain", "@domain/*"],
              message: "Renderer must not import Domain directly.",
            },
            {
              group: ["@adapters", "@adapters/*", "@ports", "@ports/*"],
              message: "Actions hooks use facade only, not adapters/ports.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/adapters/media/browser/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ["**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "boundaries/element-types": "off",
    },
  },
);
