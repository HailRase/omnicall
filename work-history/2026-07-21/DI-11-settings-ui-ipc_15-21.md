# DI-11 Settings UI IPC

**Дата:** 2026-07-21 15:21
**Статус:** не выполнено
**Коммит:** —

## Где
- `src/main/sdk/registerSdkGatewaySettingsIpc.ts`
- `src/shared/ipc/`
- `src/renderer/hooks/useSdkSettingsPanel.ts`
- `src/renderer/components/settings/panels/`
- `src/renderer/components/integration/SdkOriginTrustConsentModal.tsx`

## Что
- Реализованы IPC-операции allow/deny/unblock/matrix и snapshot pending Origin с request ID.
- Добавлена синхронизация Origin-состояния gateway с UserSettings и сохранение blacklist при редактировании allowlist.
- Добавлены blacklist/matrix/TOFU controls и AlertDialog consent modal.
- Обновлены v11 fixtures, migration/navigation проверки и domain mutation tests.
- Добавлен `SdkActivateConsentPort` для Application consent boundary.

## Зачем
- Завершить Settings/UI/IPC часть DI-11 с fail-closed Origin trust и сохранением решений TOFU.

## Результат
- `npx tsc --noEmit` — успешно.
- `npm run i18n:check` — успешно.
- Focused Vitest — 5 файлов, 25 тестов успешно.
- Полная wiring-цепочка activate consent в `ExternalSdkAccountHandler` и main matrix gate остаётся незавершённой.
