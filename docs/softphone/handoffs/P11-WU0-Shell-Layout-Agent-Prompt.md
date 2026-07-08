# AGENT PROMPT: P11 WU0 — Shell Layout & Overlay Navigation

> **Read first:** `docs/softphone/UI-Architecture.md`, `docs/softphone/UI-Design-System.md`, `docs/softphone/UX-UI-Design-Blueprint.md`.

## Mission

Introduce `SoftphoneLayout` with Header / Context / Controls / Overlay zones; remove dev-only UI noise; prepare overlay-based Settings (WU1) without unmounting call context during established calls.

**No adapter or Domain changes in WU0** except port prep doc note for WU1.

## Onboarding

### Skills

- `.cursor/skills/ux-ui-flow-design/SKILL.md`
- `.cursor/skills/feature-slice-design/SKILL.md`
- `.cursor/skills/softphone-architecture-review/SKILL.md`

### Rules

- `.cursor/rules/00-core.mdc`
- `.cursor/rules/ux-ui-electron-react.mdc`
- `.cursor/rules/typescript-react-electron.mdc`

### Docs

- `docs/softphone/UI-Design-System.md` — stack, phases, overlay rules
- `docs/softphone/real-integration/UI-SMOKE-ENABLERS.md`
- `docs/softphone/handoffs/archive/P05/P05-WU6-Multi-Call-Completeness-Handoff.md` — call lines panel

## Context

- Phase: **P11 WU0** (shell layout foundation)
- RAT steps 00–08: **closed**; next adapter work F-008 DTMF real (parallel track)
- Baseline tests: **640 passed, 1 skipped**
- Dependencies installed: `@radix-ui/react-dialog`, `framer-motion`, `clsx`, Storybook 8

## Legacy / Features

- LF-011, LF-057 (visibility in header/overlay)
- F-001, F-014 (registration / recovery presentation)
- Unblocks: R7-5 via UI-2 settings (`LF-032`)

## Deliverables (WU0 only)

| # | Area | Path |
| --- | --- | --- |
| 1 | Layout widget | `src/renderer/widgets/SoftphoneLayout/` or `shells/SoftphoneLayout.tsx` |
| 2 | Zone composition | Refactor `SoftphoneReadyShell` + `CallFeatureShell` into zones |
| 3 | Dev cleanup | Hide `sip-registered-hint`, bootstrap subtitle behind `import.meta.env.DEV` |
| 4 | Header actions | Placeholder buttons: Settings, Diagnostics (open overlay state only; empty panel OK) |
| 5 | Tests | Layout smoke test IDs; existing tests green |
| 6 | Storybook | Optional stub story for layout zones (after structure exists) |

## Out of scope (STOP)

- Settings `multiSessionsEnabled` persistence (WU1)
- Radix Dialog migration (WU/UI-6)
- CSS Modules / tokens migration (UI-4)
- F-008 DTMF adapter
- legacy operator platform UI changes

## Architecture boundaries

- `SoftphoneLayout` receives slots/children; no facade inside layout component
- Overlay open state in `useShellChromeShell` or dedicated `useOverlayShell` (UI-only)
- Settings/Diagnostics must not unmount `ContextZone` when `hasEstablishedCall`

## Anti-patterns

- PanelNav swapping away from call screen during active call
- Facade in `components/**`
- New Use Case for overlay visibility
- Big-bang rename `shells/` → `widgets/` (incremental OK)

## Verification

```bash
npm run test && npm run lint && npm run typecheck
npm run storybook  # builds after stories added
npm run ui:catalog # after component changes
```

## Gate

- [ ] Zones visible in dev; call context remains when settings overlay opens (stub)
- [ ] No dev hints in production build path
- [ ] `App.tsx` still < 60 lines
- [ ] All tests green

**Stop after WU0.** WU1 = Settings overlay + `setMultiCallSettings` port + facade method.
