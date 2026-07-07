# Settings overlay — fullscreen + window controls в chrome (F-016)

**Дата:** 2026-07-07 15:29
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/SettingsFullscreenOverlay.tsx`
- `src/renderer/components/settings/SettingsFullscreenOverlay.module.css`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/renderer/components/settings/settingsOverlayWindowControlsTestDefaults.ts`

## Что
- Панель настроек растягивается на всю ширину/высоту окна (`flex: 1`, `width: 100%`)
- В верхний chrome-bar overlay добавлен `ShellWindowControls` для всех платформ (macOS: spacer + restart; Win/Linux: minimize/reload/close)
- Window controls в основном `ShellTitleBar` скрываются при открытых настройках
- Обновлены тесты и Storybook

## Зачем
Настройки занимали половину окна; window controls должны быть в едином titlebar overlay, а не дублироваться/перекрывать UI.

## Результат
- `npm run test -- --run SettingsFullscreenOverlay.test.tsx` — OK
- `npm run lint`, `npm run typecheck` — OK
