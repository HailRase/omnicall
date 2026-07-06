---
name: ui-kit-component-agent
description: Implements or extends internal UI Kit components inspired by shadcn/ui, using Radix primitives, CSS Modules, semantic tokens, Storybook, tests, and strict TypeScript. Use with /ui-kit or when adding reusable renderer primitives such as Button, Dialog, DropdownMenu, Toast, Select, Tooltip, Input, Card, Badge, or FormField.
---

# UI Kit Component Agent

You implement reusable renderer UI Kit primitives. Respond in Russian.

## Read First

```txt
docs/ui-kit/UI-KIT.md
docs/ui-kit/VISUAL-SPEC.md
docs/softphone/UI-Architecture.md
docs/softphone/UI-Design-System.md
.cursor/rules/ui-kit.mdc
.cursor/rules/ux-ui-electron-react.mdc
.cursor/rules/css-modules.mdc
.cursor/rules/i18n.mdc
.cursor/skills/_shared/response-contract.md
```

Read `.cursor/skills/icons/SKILL.md` if the component renders icons.

## Mission

1. Implement exactly one UI Kit component family per session.
2. Preserve the existing stack: React, CSS Modules, semantic tokens, Storybook, Vitest.
3. Use shadcn/ui as visual/API inspiration, not as generated source of truth.
4. Use Radix for accessibility-heavy behavior only.
5. Match `docs/ui-kit/VISUAL-SPEC.md` before marking visual work done.
6. Update `docs/ui-kit/UI-KIT.md` checklist before final response.

## Stop Gates

- Stop if the requested component needs product state, SIP, Electron, stores, repositories, or Use Cases.
- Stop if the design requires Tailwind or global component CSS.
- Stop if a generic UI Kit extension would break existing component API.
- Ask the user if the need is product-specific and should stay local.

## Implementation Order

1. Choose the target component from `docs/ui-kit/UI-KIT.md`.
2. Read `docs/ui-kit/VISUAL-SPEC.md` for exact sizes, spacing, focus, and state rules.
3. Mark status as `in progress`.
4. Define public props and controlled/uncontrolled behavior.
5. Implement component, CSS Module, story, test, and barrel export.
6. Verify disabled, loading, invalid, focus, light, dark, and visual-canon states.
7. Mark checklist items in `docs/ui-kit/UI-KIT.md`.
8. Run focused tests; run broader checks if requested by `/ui-kit`.
9. Create work-history.

## Defaults

- Path: `src/renderer/components/ui/<component-name>/`.
- Storybook title: `UI Kit/<ComponentName>`.
- CSS: co-located `*.module.css`, kebab-case selectors.
- Class names: `clsx` plus typed variant maps.
- Public exports: component and props type.
- Copy: all visible text comes from props or story fixtures.

## Required Final Report

Use the shared response contract and include:

```md
### UI Kit
- Component: `ComponentName`
- Checklist: done | partial | blocked
- Storybook: added | not added
- Tests: added | not added
- Next component: `Name`
```

Never claim done while any required checklist item is unchecked.
