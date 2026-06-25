# P11 WU0 Shell Layout Handoff

- Scope: `SoftphoneLayout` four-zone widget, overlay navigation stubs, call shell zone split, dev-only hints; Feature **F-016** (shell foundation); legacy `LF-011`, `LF-057` (presentation); unblocks WU1 / R7-5 (`LF-032`).
- Out of scope WU0: `multiSessionsEnabled` persistence (WU1), Radix migration (UI-6), tokens/CSS Modules (UI-4), F-008 DTMF adapter.

## Delivered (WU0)

| Area | Path |
| --- | --- |
| Layout widget | `src/renderer/widgets/SoftphoneLayout/SoftphoneLayout.tsx` |
| Overlay UI state | `src/renderer/hooks/useOverlayShell.ts` |
| Overlay sheet stub | `src/renderer/components/shell/ShellOverlaySheet.tsx` |
| Call bindings hook | `src/renderer/hooks/useCallFeatureShell.ts` |
| Context zone | `src/renderer/shells/call/CallContextShell.tsx` |
| Controls zone | `src/renderer/shells/call/CallControlsShell.tsx` |
| Call overlays | `src/renderer/shells/call/CallOverlayShell.tsx` |
| Ready shell wiring | `src/renderer/shells/SoftphoneReadyShell.tsx` |
| Header actions | `src/renderer/shells/SoftphoneShellHeader.tsx` |
| Thin App | `src/renderer/App.tsx` (30 lines) |
| Layout styles | `src/renderer/styles.css` |
| Storybook | `src/renderer/widgets/SoftphoneLayout/SoftphoneLayout.stories.tsx` |
| Tests | `SoftphoneLayout.test.tsx`, `ShellOverlaySheet.test.tsx`, `useOverlayShell.test.tsx` |

## Removed

- `src/renderer/shells/CallFeatureShell.tsx` — split into zone shells + `useCallFeatureShell`.

## Overlay Rule

Settings and Diagnostics open via `ShellOverlaySheet` in `OverlayLayer`. `CallContextShell` remains mounted in `ContextZone` (no panel swap during call).

## Dev vs Prod

- `sip-registered-hint` and header subtitle — `import.meta.env.DEV` only.

## WU0 Gate

- [x] Zones visible in dev (`layout-header-zone`, `layout-context-zone`, `layout-controls-zone`, `layout-overlay-layer`)
- [x] Settings overlay opens over call context (stub `settings-overlay`)
- [x] `App.tsx` < 60 lines
- [x] `npm run test && npm run lint && npm run typecheck` green
- [x] `npm run ui:catalog` regenerated
- [x] Handoff + work-history

## Verification

```bash
npm run test && npm run lint && npm run typecheck
npm run ui:catalog
npm run storybook
```

Baseline 640 → **643 tests** (+3), 1 skipped.

## Next: WU1 Settings Overlay

See user prompt WU1 section: `SettingsRepository.setMultiCallSettings`, `AccountBootstrapFacade.updateMultiCallSettings()`, `SettingsOverlay`, R7-5 via UI.
