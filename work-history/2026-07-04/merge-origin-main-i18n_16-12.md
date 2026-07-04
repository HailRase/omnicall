# Merge origin/main with i18n WIP

**Дата:** 2026-07-04 16:12
**Статус:** выполнено
**Коммит:** —

## Где
- `feature/real-adapters` @ `2b7027d` (fast-forward с `origin/main`)
- i18n: `src/renderer/i18n/*`, projections, settings, components
- T-008: `SipRecoveryOrchestrationService`, `SettingsSystemStatePanel`, `deriveSipStatusShell`

## Что
- Stash i18n WIP → merge `origin/main` (39 коммитов, SIP T-008 + release/distribution)
- Разрешены конфликты: сохранена архитектура T-008, i18n через semantic keys в header/SIP status
- `ConnectionOverlay` удалён (заменён System State panel); recovery i18n keys сохранены для helpers
- `SettingsGeneralPanel`: language + theme + about (без SIP recovery — перенесено в System State)
- `deriveSipStatusShell` / `deriveHeaderChromeShell`: `primaryLabelKey`, `sipStatusLabelKey`, aria keys
- `package.json` 0.1.0 + release scripts + `i18n:check`

## Зачем
Подтянуть коммиты 02.07 (transport/register refactor) с `origin/main`, не потеряв незакоммиченную i18n-миграцию.

## Результат
- `npm run test`: 1041 passed, 1 skipped
- `npm run typecheck`, `npm run lint`: green
- `npm run i18n:check`: падает на hardcoded copy в `SettingsSystemStatePanel` (T-008, i18n отдельным шагом)
