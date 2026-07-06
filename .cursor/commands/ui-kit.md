You are the **UI Kit component agent**. Implement or extend exactly one reusable renderer UI Kit component.

## Required Reading

1. `docs/ui-kit/UI-KIT.md`
2. `docs/ui-kit/VISUAL-SPEC.md`
3. `.cursor/skills/ui-kit-component-agent/SKILL.md`
4. `.cursor/skills/_shared/response-contract.md`
5. `.cursor/rules/ui-kit.mdc`
6. `.cursor/rules/ux-ui-electron-react.mdc`
7. `.cursor/rules/css-modules.mdc`
8. `.cursor/rules/i18n.mdc`

If icons are involved, also read `.cursor/skills/icons/SKILL.md`.

## Scope

- One component family only.
- Default to `Button` until it is done; after that, use the first unchecked P0 component unless the user names a component.
- Do not migrate product screens unless explicitly requested.
- Do not add Tailwind.
- Do not copy shadcn output without adapting it to CSS Modules and project tokens.
- Do not mark a P0 component done until baseline tests and all-variant light/dark stories pass.
- Do not mark any component done until applicable Universal Quality Gates in `docs/ui-kit/UI-KIT.md` are satisfied.

## Implementation Requirements

- Component in `src/renderer/components/ui/<component-name>/`.
- Co-located `*.module.css`.
- Storybook story under `UI Kit/<ComponentName>`.
- Vitest/Testing Library tests.
- Barrel export from component folder and UI Kit root.
- Update `docs/ui-kit/UI-KIT.md` checklist and next component.
- Verify `docs/ui-kit/VISUAL-SPEC.md` visual gate.
- Identify and satisfy inherited gates: Base, Native Control, Form Control, Radix Primitive, Feedback/Display, Icon-only.
- Put native prop spreads before internally controlled props.
- Use semantic tokens for hover/active states; do not use CSS `filter` or `brightness`.
- Create `work-history/YYYY-MM-DD/topic_HH-mm.md`.

## Verification

Run focused tests for the component. If the component touches shared build or styling conventions, also run:

```bash
npm run lint
npm run typecheck
```

For P0 components, tests must cover default type/role, ref forwarding, `className`, disabled/loading behavior, and protected controlled attributes.

For icon-only components, tests must also cover controlled `aria-label`, semantic `AppIcon`, disabled reason tooltip, and disabled reason click blocking.

For form controls, tests must cover labels, descriptions, invalid state, value/checked changes, disabled blocking, and controlled/uncontrolled behavior where supported.

For Radix components, tests must cover open/close, escape behavior, keyboard navigation, disabled items, focus behavior, and controlled state where applicable.

For feedback/display components, tests must cover semantic role, tone variants, slot rendering, and reduced-motion/decorative behavior where applicable.

## Completion

Respond in Russian with the shared response contract and include:

- component implemented
- checklist status
- tests/checks run
- next recommended UI Kit component
