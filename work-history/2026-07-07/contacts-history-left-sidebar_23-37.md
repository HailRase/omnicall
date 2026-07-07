# Contacts/history left sidebar slide-in

**Дата:** 2026-07-07 23:37
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/shell/ShellDialpadPanel.module.css`
- `src/renderer/components/shell/ShellDialpadPanel.tsx`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/renderer/widgets/SoftphoneLayout/SoftphoneLayout.tsx`

## Что
- Панели снова в `OverlayLayer`, якорь `top: var(--shell-titlebar-controls-height)` — window controls не перекрываются
- Полная высота слева: header с аватаром, context, dialpad
- Анимация slide-in/out слева направо (`translateX`)
- Удалён временный слот `mainPanels`

## Зачем
UX: sidebar до аватара, без блокировки traffic lights / Win-Linux controls.

## Результат
19 focused tests passed.
