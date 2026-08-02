# F-034 WU-08…WU-10 — raise, OS defer, close

**Дата:** 2026-08-02 18:16
**Статус:** выполнено
**Коммит:** —

## Где
- `src/shared/ipc/ShellWindowRaiseContract.ts`
- `src/application/services/settings/UserNotificationCaptureService.ts`
- `src/renderer/hooks/useNotifications.ts`
- `src/renderer/components/settings/panels/SettingsNotificationModuleRow.tsx`
- `src/ports/platform/NotificationGateway.ts`
- `src/adapters/mock/MockNotificationGateway.ts`
- `docs/softphone/adr/ADR-0013-*.md`, `ADR-0025-*.md`
- `notification-center/PROGRESS.md`, `11-ACCEPTANCE.md`
- `docs/softphone/Feature-Registry.md`, `STATUS.md`, `TASK-QUEUE.md`, handoff P15

## Что
- WU-08: allowlist `notification_actionable`; Capture raise enabled; toast path → `raiseShellWindow` с dedupe; Preferences Never/On errors; i18n five locales
- WU-09: deferred — port+mock only, без Electron OS banners
- WU-10: acceptance closed; F-034 `implemented`; T-053 done; SemVer не трогали
- Preflight: vitest 2976/1 skip, lint, typecheck, i18n, registry 75/0; ui:catalog regenerated

## Зачем
Закрыть optional raise, явно отложить OS banners и завершить трек Notification Center без silent downgrade defaults.

## Результат
F-034 готов к `/review`; ship MINOR только по явному `/release`. Defaults ⇒ zero new raises.
