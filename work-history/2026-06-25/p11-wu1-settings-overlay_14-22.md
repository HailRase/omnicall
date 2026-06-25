# P11 WU1 — Settings Overlay + multiSessionsEnabled

**Дата:** 2026-06-25 14:22
**Статус:** выполнено
**Коммит:** —

## Где
- `src/ports/settings/SettingsRepository.ts`
- `src/adapters/settings/InMemorySettingsRepository.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/renderer/hooks/useSettingsActions.ts`
- `src/renderer/components/settings/SettingsOverlay.tsx`
- `src/renderer/stores/useAccountBootstrapStore.ts`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/renderer/styles.css`
- `docs/softphone/Feature-Registry.md` (F-016)

## Что
- Prerequisite: `.softphone-layout__overlays` — `position: fixed; inset: 0`
- Port/adapter: `setMultiCallSettings()`; facade `updateMultiCallSettings()` без Use Case
- Store `applyMultiCallSettings` + projection refresh через `setMultiCallSettings`
- UI: `SettingsOverlay` с toggle `multiSessionsEnabled` в settings sheet
- Тесты: repository, facade, component toggle; Storybook + `ui:catalog`
- F-016 evidence обновлён в Feature Registry

## Зачем
Включить R7-5 re-smoke через UI toggle (LF-032, LF-076) без правки дефолтов репозитория; settings overlay не размонтирует call context.

## Результат
- Gate WU1: overlay fixed, toggle wired, ContextZone mounted, F-016 evidence
- `npm run test` — 647 passed, 1 skipped
- `npm run lint`, `npm run typecheck`, `npm run ui:catalog` — green
