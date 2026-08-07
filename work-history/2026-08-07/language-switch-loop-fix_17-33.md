# Исправление лупа смены языка интерфейса

**Дата:** 2026-08-07 17:33
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useSdkSettingsPanel.ts`
- `src/renderer/hooks/useNotifications.ts`
- `src/renderer/hooks/useSettingsActions.ts`
- `src/renderer/hooks/useSdkSettingsPanel.test.ts`
- `docs/softphone/I18N-Architecture.md`
- `docs/softphone/UI-Architecture.md`
- `docs/softphone/Feature-Registry.md`
- `docs/softphone/I18N-Coverage.md`
- `docs/softphone/adr/ADR-0006-interface-internationalization.md`

## Что
- Стабилизирован `notify` через refs (`resolveTitle`/`capture`), чтобы смена языка не пересоздавала callback
- Bootstrap `useSdkSettingsPanel` больше не делает полный `onActiveUserSettingsRefresh` на mount
- Mirror-save origins перечитывает актуальные `UserSettings` перед записью
- Optimistic apply языка + idempotent native theme / always-on-top sync
- Добавлены regression-тесты и инварианты в проектную документацию (F-021 / F-011)

## Зачем
- Убрать feedback loop: смена языка → перерисовки/theme/SDK policy spam → откат языка
- Закрепить архитектурные правила refresh projection, чтобы не повторилось

## Результат
- Целевые тесты: 19/19 passed (`useSdkSettingsPanel`, `useSettingsActions`, `useNotifications`)
- ESLint по затронутым файлам: ok
- Downgrade не ожидается: SDK persist/import пути сохранены; меняется только опасный mount refresh
