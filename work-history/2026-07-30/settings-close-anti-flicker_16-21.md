# Settings close anti-flicker

**Дата:** 2026-07-30 16:21
**Статус:** выполнено
**Коммит:** `e2dbf9a`

## Где
- `src/main/shellWindow/ShellWindowController.ts`
- `src/renderer/components/settings/SettingsFullscreenOverlay.tsx`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/application/services/platform/ShellWindowLayoutService.ts`
- `docs/softphone/Feature-Registry.md`, `docs/softphone/UI-Architecture.md`

## Что
- Maximize→compact анимируется от work-area bounds без промежуточного snap на settings-min
- Оверлей на закрытии остаётся непрозрачным на `SETTINGS_SHELL_LAYOUT_ANIMATION_MS` (носитель motion — bounds окна)
- Shell chrome / density держатся до `onVisibleChange(false)`
- Экспорт `SETTINGS_SHELL_LAYOUT_ANIMATION_MS` из Application (без `@domain` в renderer)
- Обновлены acceptance/contract в Feature Registry и UI-Architecture

## Зачем
- Убрать мерцание при закрытии настроек в обычном и maximized режиме

## Результат
- `vitest` ShellWindowController + SettingsFullscreenOverlay + ShellWindowLayoutService — PASS
