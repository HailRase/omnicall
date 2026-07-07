# Settings overlay — safe area для window controls (F-016)

**Дата:** 2026-07-07 15:22
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/styles/tokens.css`
- `src/renderer/hooks/useShellWindowControls.ts`
- `src/renderer/components/shell/ShellTitleBar.tsx`
- `src/renderer/components/settings/SettingsFullscreenOverlay.tsx`
- `src/renderer/components/settings/SettingsFullscreenOverlay.module.css`
- `src/renderer/shells/SoftphoneShellHeader.tsx`
- `src/renderer/shells/SoftphoneReadyShell.tsx`

## Что
- Добавлены токены safe-area для titlebar (34px), macOS traffic lights (74px) и frameless controls (144px)
- `data-shell-platform` на `documentElement` для платформенных CSS-правил
- В overlay настроек — верхняя chrome-полоса с отступами под traffic lights (macOS) и Minimize/Reload/Close (Win/Linux)
- При открытых настройках скрывается дублирующий ряд window controls в `ShellTitleBar`
- Тесты: `ShellTitleBar`, `SettingsFullscreenOverlay`, `SoftphoneShellHeader`

## Зачем
Устранить перекрытие native/custom window controls с кнопкой разворота sidebar и закрытия настроек на macOS (и унифицировать поведение на всех платформах).

## Результат
- `npm run test -- --run ShellTitleBar.test.tsx SettingsFullscreenOverlay.test.tsx SoftphoneShellHeader.test.tsx` — 8/8 OK
- `npm run lint`, `npm run typecheck` — OK
