# P11 WU1 Settings Overlay Handoff

- Scope: `multiSessionsEnabled` UI toggle, settings write path, overlay layer fix; Feature **F-016**; legacy **LF-032**, **LF-076**; enables R7-5 re-smoke without repository default hacks.
- Out of scope WU1: full settings schema/migration, diagnostics panel (F-017), Radix migration, CSS Modules/tokens.

## Delivered (WU1)

| Area | Path |
| --- | --- |
| Port | `src/ports/settings/SettingsRepository.ts` — `setMultiCallSettings` |
| Adapter | `src/adapters/settings/InMemorySettingsRepository.ts` + test |
| Facade | `AccountBootstrapFacade.updateMultiCallSettings()` (no Use Case) + test |
| Store | `useAccountBootstrapStore.applyMultiCallSettings` |
| Actions | `src/renderer/hooks/useSettingsActions.ts` |
| UI | `src/renderer/components/settings/SettingsOverlay.tsx` |
| Wiring | `src/renderer/shells/SoftphoneReadyShell.tsx` |
| Overlay fix | `src/renderer/styles.css` — `.softphone-layout__overlays` fixed inset |
| Storybook | `SettingsOverlay.stories.tsx` |

## Settings write path

```txt
SettingsOverlay → useSettingsActions → facade.updateMultiCallSettings()
  → SettingsRepository.setMultiCallSettings()
  → applyMultiCallSettings → setMultiCallSettings(multiCallProjection)
```

## Overlay rule

`CallContextShell` stays mounted in `ContextZone` while `ShellOverlaySheet` settings is open.

## R7-5 manual smoke (operator)

1. Register SIP, establish first call.
2. Open **Settings**, disable **Allow multiple call sessions**.
3. Attempt second call — expect block per LF-032.
4. Re-enable toggle — second session allowed (R7-5 pass without editing repo defaults).

## WU1 Gate

- [x] `setMultiCallSettings` port + adapter
- [x] Facade update without Use Case
- [x] Toggle wired to store projection
- [x] ContextZone not unmounted on settings open
- [x] Overlay layer fixed positioning (WU0 review follow-up)
- [x] Tests + Storybook + ui:catalog
- [x] F-016 evidence in Feature Registry

## Verification

```bash
npm run test && npm run lint && npm run typecheck
npm run ui:catalog
```

Baseline WU0 643 → **647 tests** (+4), 1 skipped.

## Next

- P11 WU2: blocking overlay click-through (LF-057 High from review)
- Settings schema + additional panels per Implementation Roadmap P11
