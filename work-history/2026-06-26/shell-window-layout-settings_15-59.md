# Shell window layout for settings overlay

**Дата:** 2026-06-26 15:59
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/platform/ShellWindowLayout.ts`
- `src/ports/platform/ShellWindowGateway.ts`
- `src/application/services/ShellWindowLayoutService.ts`
- `src/main/shellWindow/ShellWindowController.ts`
- `src/shared/ipc/ShellWindowLayoutContract.ts`
- `src/adapters/platform/PreloadShellWindowGateway.ts`
- `src/renderer/hooks/useShellWindowLayout.ts`

## Что
- Domain: режимы `compact` / `settings`, расчёт bounds (bottom-right / center), интерполяция и easing 280ms
- Port `ShellWindowGateway` + `ShellWindowLayoutService` + mock adapter
- IPC `shell:apply-window-layout`, preload API, main-process анимация `setBounds`
- Старт: окно в правом нижнем углу; настройки: 1000px по центру; закрытие: восстановление ширины в углу
- Hook `useShellWindowLayout` подключён в `SoftphoneReadyShell`
- Feature Registry F-016, Legacy LF-055/LF-056, TASK-QUEUE T-006 (drag remainder)

## Зачем
Плавное изменение размера и позиции BrowserWindow синхронно с overlay настроек, без нарушения границ UI/Application/Domain.

## Результат
`npm run test` — 775 passed, 1 skipped; lint и typecheck — green.
