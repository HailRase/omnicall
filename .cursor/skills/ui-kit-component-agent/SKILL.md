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
- Stop if component state styling needs new colors and no semantic token exists yet.
- Ask the user if the need is product-specific and should stay local.

## Implementation Order

1. Choose the target component from `docs/ui-kit/UI-KIT.md`.
2. Read `docs/ui-kit/VISUAL-SPEC.md` for exact sizes, spacing, focus, and state rules.
3. Identify inherited gates: Base, Native Control, Form Control, Radix Primitive, Feedback/Display, Icon-only.
4. Mark status as `in progress`.
5. Define public props, root slot, ref target, controlled props, and controlled/uncontrolled behavior.
6. Implement component, CSS Module, story, test, and barrel export.
7. Verify disabled, loading, invalid, focus, light, dark, and visual-canon states.
8. Mark local checklist and applicable Universal Quality Gates in `docs/ui-kit/UI-KIT.md`.
9. Run focused tests; run broader checks if requested by `/ui-kit`.
10. Create work-history.

## Defaults

- Path: `src/renderer/components/ui/<component-name>/`.
- Storybook title: `UI Kit/<ComponentName>`.
- CSS: co-located `*.module.css`, kebab-case selectors.
- Class names: `clsx` plus typed variant maps.
- Public exports: component and props type.
- Copy: all visible text comes from props or story fixtures.

## Hard Rules

- Put native `...rest` props before internally controlled props.
- Controlled props include `disabled`, `aria-busy`, `data-*` state attributes, and guarded event handlers.
- Do not use CSS `filter`, `brightness`, hardcoded hex/rgb, or theme branches for variant states.
- Add or reuse semantic tokens for hover, active, selected, destructive, and elevated states.
- P0 components require tests for default behavior, ref forwarding, className preservation, disabled/loading semantics, and controlled prop protection.
- Storybook must show all variants in both light and dark themes before the component can be marked done.
- Icon-only components require controlled `aria-label`, semantic `AppIcon`, and disabled reason tooltip coverage.
- Form controls require label/description/error wiring and invalid/disabled tests.
- Radix components must keep Radix focus/keyboard behavior and test open/close, escape, keyboard navigation, disabled items, and controlled state where applicable.
- Feedback/display components require semantic roles, tone token tests, slot rendering tests, and reduced-motion coverage where applicable.
- Never mark `done` while any applicable inherited gate is unverified.

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
