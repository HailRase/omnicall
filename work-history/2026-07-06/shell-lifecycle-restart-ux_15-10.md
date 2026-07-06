# Shell lifecycle UX refactor (F-016, LF-079)

**Дата:** 2026-07-06 15:51
**Статус:** выполнено
**Коммит:** —

## Где
- `src/main/index.ts`, `src/main/lifecycle/AppShutdownCoordinator.ts`
- `src/shared/ipc/AppShutdownContract.ts`, `IpcChannels.ts`, `PreloadApi.ts`, `src/shared/platform/AppLifecycle.ts`
- `src/preload/index.ts`, `src/adapters/platform/PreloadAppLifecycleGateway.ts`, `src/ports/platform/AppLifecycleGateway.ts`
- `src/renderer/hooks/useAppShutdown.ts`, `useShellWindowControls.ts`, `src/renderer/App.tsx`
- `src/renderer/components/shell/ShellWindowControls.*`, `ShellTitleBar.*`, `src/renderer/shells/SoftphoneShellHeader.*`
- `src/renderer/i18n/messages.ts`, `docs/softphone/Feature-Registry.md`, `docs/softphone/UI-Component-Catalog.md`

## Что
- Добавлен явный reset/cancel shutdown path: IPC `app:cancel-shutdown`, `AppShutdownCoordinator.cancelShutdown`, retry после cleanup failure.
- Исправлен hang до готовности facade: `useAppShutdown` подписан всегда, при `facade === null` отправляет deterministic ack с `cleanupSkipped: true`.
- Перенесены `AppShutdownSource`/`AppShutdownAction` в shared (`src/shared/platform/AppLifecycle.ts`), убрана зависимость shared IPC от Domain.
- Введён `ShellTitleBar` и нативный UX controls: Win/Linux `Minimize -> Reload -> Close` (fixed hit area 46x32, close danger hover, no gaps), macOS без дублей close/minimize с отдельным reload action рядом с traffic lights.
- Добавлены shell/system banners для shutdown progress/error в `App.tsx` через i18n (ru/en/fr/de), блокированы повторные действия во время shutdown.
- Обновлены тесты: coordinator reset/retry, hook cleanup-failure + facade-null, IPC contract cancel payload, window controls order/macOS/disabled/a11y.

## Зачем
- Цель — убрать зависания close/restart при ошибке cleanup или неготовом bootstrap и довести кастомный titlebar до максимально нативного поведения на Win/Linux/macOS.

## Результат
- `npm test` — PASS (1285 passed, 1 skipped).
- `npm run lint` — PASS (включая `lint:css`).
- `npm run lint:css` — PASS.
- `npm run i18n:check` — PASS.
- `npm run ui:catalog` — PASS.
