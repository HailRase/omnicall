# Settings reload after successful SIP authorization

**Дата:** 2026-07-06 01:28
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/deriveSettingsAccountProfileShell.ts` — `deriveActiveProfileSettingsSyncKey`
- `src/renderer/hooks/useSettingsActions.ts`
- `src/renderer/stores/useAccountBootstrapStore.ts`

## Что
- Sync key по `sip_registered` + identity — триггер перезагрузки UserSettings в UI
- При загрузке применяются theme, language, multi-call projection, native theme
- Store: refresh multi-call projection на `RegistrationSucceeded`
- Тесты: projection sync key + hook reload после registration

## Зачем
После авторизации настройки профиля оставались дефолтными до перезапуска — `useSettingsActions` грузил settings только при mount facade.

## Результат
- Tests: PASS; lint, typecheck: PASS
