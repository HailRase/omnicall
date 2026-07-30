# Settings-only window maximize (F-016)

**Дата:** 2026-07-30 10:53
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/platform/ShellWindowLayout.ts`
- `src/main/shellWindow/ShellWindowController.ts`
- `src/renderer/components/shell/ShellWindowControls.tsx`
- `src/renderer/hooks/useShellWindowControls.ts`
- `src/shared/ipc/IpcChannels.ts`, `ShellWindowMaximizedContract.ts`
- `docs/softphone/Feature-Registry.md`, `Icon-Registry.md`

## Что
- Maximize только в режиме настроек (`setMaximizable` + кнопка в titlebar)
- Restore возвращает к минимальному размеру настроек (1000×session height, по центру)
- Win/Linux: Minimize → Maximize/Restore → Reload → Close
- macOS в settings: Close → Minimize → Maximize (зелёный) + Reload рядом
- i18n (ru/en/fr/de/bg) + иконки `shell.window.maximize` / `restore`

## Зачем
- Дать удобный полноэкранный просмотр настроек без maximize в компактном softphone-окне

## Результат
- `npm run typecheck` — OK
- `npm run i18n:check` — OK
- тесты ShellWindowLayout / ShellWindowController / ShellWindowControls / messages — OK
