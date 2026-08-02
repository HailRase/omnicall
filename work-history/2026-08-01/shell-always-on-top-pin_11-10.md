# Shell always-on-top pin (F-016)

**Дата:** 2026-08-01 11:10
**Статус:** выполнено
**Коммит:** —

## Где
- `src/main/shellWindow/ShellWindowController.ts`, `src/main/index.ts`
- `src/shared/ipc/ShellWindowAlwaysOnTopContract.ts`, `IpcChannels.ts`, preload/gateway
- `src/renderer/components/shell/ShellWindowControls.tsx`, `useShellWindowControls.ts`
- `src/domain/settings/UserSettings.ts` (schema v17 `windowAlwaysOnTop`)
- docs: Feature-Registry F-016, ADR-0013, UX blueprint, UI-Design-System, CHANGELOG Unreleased

## Что
- Добавлен user-owned always-on-top pin в центре window controls (Win/macOS/Linux)
- Иконки Lucide Pin/PinOff, `aria-pressed` + accent pressed state
- IPC set/toggle/get/changed; raise pulse по-прежнему восстанавливает prior pin
- Persist в `UserSettings.windowAlwaysOnTop` (миграция v16→v17)
- Тесты контракта, controller, controls, migrate; typecheck/lint ок

## Зачем
- Оператору нужен явный pin поверх других окон без конфликта с SDK show/hide и ADR-0013 raise

## Результат
- Pin работает на всех платформах, состояние визуально читаемо, SDK hide/show не сбрасывает pin
- Проверки: targeted vitest PASS; `npm run typecheck` PASS; eslint touched files PASS
- Версию package.json не бампили (по release-agent: cut через `/release`); запись в CHANGELOG `[Unreleased]`
