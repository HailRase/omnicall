# Унифицированная система action-уведомлений

**Дата:** 2026-07-06 17:19
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/NotificationSettings.ts`
- `src/domain/settings/UserSettings.ts`
- `src/domain/settings/validateUserSettings.ts`
- `src/domain/settings/migrateUserSettings.ts`
- `src/renderer/components/notifications/*`
- `src/renderer/hooks/useNotifications.ts`
- `src/renderer/hooks/useActionNotifications.ts`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/renderer/components/settings/*`
- `src/renderer/components/account/*`
- `src/renderer/components/call/*`
- `src/renderer/components/status/*`
- `src/renderer/components/updates/*`
- `src/renderer/i18n/messages.ts`
- `docs/softphone/Feature-Registry.md`
- `docs/softphone/I18N-Coverage.md`

## Что
- Добавлен единый renderer-слой уведомлений: `NotificationViewport`, `NotificationToast`, `useNotifications`.
- Реализован мост `useActionNotifications` для миграции action feedback из account/call/transfer/dtmf/session/settings/sip actions/OCP/update в единый toast-поток.
- Удалены legacy inline action-feedback блоки из `AccountPanel`, call controls/rows, `TransferPanel`, `DtmfKeypadPanel`, `StatusSelector`, `SessionFeatureShell`, `SettingsPanel`, `SettingsSystemStatePanel`.
- Добавлены и подключены настройки уведомлений в `UserSettings` (дефолты, валидация, миграция, UI в `SettingsGeneralPanel`): placement/stacking/duration/closable/maxVisible.
- Обновлены i18n-ключи и aria-label уведомлений для `ru/en/fr/de`, исправлены stories и unit-тесты под новую модель.
- Актуализированы `Feature-Registry` и `I18N-Coverage` под unified notifications и закрытие LF-060.

## Зачем
- Убрать разрозненные toasts/баннеры/inline action feedback и стандартизировать UX обратной связи после действий пользователя.
- Централизовать управление поведением уведомлений и сделать его настраиваемым и персистентным без нарушения архитектурных границ.

## Результат
- Реализована единая система уведомлений с настройками и подключением к основным action-flow в renderer.
- Проверки: `npm run typecheck` ✅, `npm run lint` ✅, `npm run test` ✅, `npm run i18n:check` ✅, `npm run ui:catalog` ✅, `npm run registry:check` ✅.
