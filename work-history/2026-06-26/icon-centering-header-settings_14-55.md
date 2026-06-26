# Центрирование иконок, убран settings из header, animated в меню

**Дата:** 2026-06-26 14:55
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/icons/IconControlButton.tsx`, `IconControlButton.module.css`
- `src/renderer/components/icons/AppIcon.module.css`
- `src/renderer/styles/globals.css`
- `src/renderer/shells/SoftphoneShellHeader.tsx`
- `src/renderer/components/header/UserAvatarMenu.tsx`
- `docs/softphone/Icon-Registry.md`, `Feature-Registry.md`

## Что
- Базовое выравнивание иконок: `IconControlButton` flex-center + `button svg { display: block }`
- Убрана кнопка настроек из main header (`control-open-settings`)
- В avatar menu — animated `shell.settings` (убран `preferAnimated={false}`)

## Зачем
Исправить вертикальное смещение иконок в кнопках; настройки только через меню аватара.

## Результат
751 passed, lint/typecheck/ui:catalog OK.
