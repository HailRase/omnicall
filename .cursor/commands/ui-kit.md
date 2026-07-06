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

## Implementation Requirements

- Component in `src/renderer/components/ui/<component-name>/`.
- Co-located `*.module.css`.
- Storybook story under `UI Kit/<ComponentName>`.
- Vitest/Testing Library tests.
- Barrel export from component folder and UI Kit root.
- Update `docs/ui-kit/UI-KIT.md` checklist and next component.
- Verify `docs/ui-kit/VISUAL-SPEC.md` visual gate.
- Create `work-history/YYYY-MM-DD/topic_HH-mm.md`.

## Verification

Run focused tests for the component. If the component touches shared build or styling conventions, also run:

```bash
npm run lint
npm run typecheck
```

## Completion

Respond in Russian with the shared response contract and include:

- component implemented
- checklist status
- tests/checks run
- next recommended UI Kit component
