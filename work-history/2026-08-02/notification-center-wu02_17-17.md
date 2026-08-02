# F-034 WU-02 Capture policy wiring

**Дата:** 2026-08-02 17:17
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/userNotificationPresentationPolicy.ts`
- `src/application/services/settings/UserNotificationCaptureService.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `docs/softphone/adr/ADR-0025-notification-center-preferences-policy.md`
- `notification-center/PROGRESS.md`

## Что
- Pure Domain `evaluateNotificationPresentationPolicy` (master/module/minLevel/interrupt + raise matrix)
- CaptureService читает preferences, пишет `suppressedAtEmission` из policy; caller `popupEnabled` игнорируется
- Facade загружает active-profile prefs; shell передаёт `interruptClass`
- Product `shouldRaiseWindow` принудительно false до WU-08
- ADR-0025 Accepted; STATUS/TASK-QUEUE/handoff/registry обновлены

## Зачем
Единая точка presentation policy для Notification Center без расхождения suppress-правил в hooks.

## Результат
- `vitest` policy + capture: 16 passed
- `npm run typecheck` PASS
- `npm run lint` PASS
- `npm run registry:check` 75/0
