---
name: ui-implementation-agent
description: >-
  UX/UI implementation agent for renderer work. Runs scope-intake, UX state design,
  then React/CSS Modules/Storybook/tests. Registers Feature Registry and work-history.
  Use with /ui command or when user asks to implement visible UI.
---

# SKILL: UI Implementation Agent

You implement **renderer UX/UI** — not Domain rules, not SIP, not Electron APIs.

## Mission

1. Intake scope ([scope-intake](../scope-intake/SKILL.md)).
2. Design states ([ux-ui-flow-design](../ux-ui-flow-design/SKILL.md)) **before** components.
3. Implement presentational UI + tests + catalog.
4. Update docs and work-history.

Respond in **Russian**. Use [response-contract](../_shared/response-contract.md).

## Triggers

- `/ui` command
- User asks to build screen, component, layout, styles, Storybook

## Onboarding (read before code)

```txt
docs/softphone/STATUS.md
docs/softphone/UI-Architecture.md
docs/softphone/UI-Design-System.md
docs/softphone/UX-UI-Design-Blueprint.md
.cursor/rules/ux-ui-electron-react.mdc
.cursor/rules/icons.mdc (if icons)
```

## Implementation order

1. State inventory + disabled reasons + a11y + test IDs (from ux-ui-flow-design).
2. Co-located `*.module.css` + `var(--*)` from `tokens.css` — **both light and dark** (see `ux-ui-electron-react.mdc` → Color Themes).
3. Dumb components: props + callbacks only; Use Cases via hooks outside components.
4. `data-testid` on critical controls; `aria-label` on icon-only buttons.
5. Component tests; Storybook for critical surfaces.
6. `npm run ui:catalog` if components/testids changed.
7. `npm run test && npm run lint && npm run typecheck`.

## Documentation (end of session)

- Feature Registry F-XXX + acceptance evidence paths
- Legacy LF-XXX if applicable
- Handoff gate checkboxes if WU deliverable
- `STATUS.md` if test count or phase status changed
- `work-history/YYYY-MM-DD/topic_HH-mm.md`

## Boundaries (Blocker if violated)

- No SIP / Electron / repository in components
- No business rules in React or stores
- No legacy global `styles.css`; CSS Modules + tokens only
- `AppIcon` + registry for icons ([icons](../icons/SKILL.md))

## Session flow

```txt
/ui → scope-intake → needs_input? → ask user
                  → in_progress → design → code → verify → done → work-history
```

## Next step after done

Suggest: `/preflight` then `/review` (WU gate) or `/audit` (full audit).

## Escalation to `/logic`

Stop UI implementation and escalate when:

- New or changed Use Case, Domain Event, or state machine is required
- New port or projection reducer shape is required
- Business rule would live in a component or hook

**Action:** add TASK-QUEUE row for `/logic`; do not implement Domain in UI session.
