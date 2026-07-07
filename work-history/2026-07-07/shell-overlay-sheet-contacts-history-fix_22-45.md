# Shell overlay fix — contacts/history panels

**Дата:** 2026-07-07 22:45
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/shell/ShellOverlaySheet.tsx`
- `src/renderer/components/contacts/ContactsPanelShell.tsx`
- `src/renderer/components/history/HistoryPanelShell.tsx`
- `src/renderer/widgets/SoftphoneLayout/SoftphoneLayout.module.css`
- `src/renderer/components/settings/SettingsFullscreenOverlay.module.css`
- `src/renderer/components/notifications/NotificationViewport.module.css`

## Что
- Контакты и история переведены на канонический `ShellOverlaySheet` (без дублирования overlay CSS)
- Overlay-панели используют `position: absolute` внутри `OverlayLayer` вместо вложенного `position: fixed`
- Убрано глобальное `.overlays > * { pointer-events: auto }` — pointer-events только у интерактивных overlay
- Добавлен Escape для закрытия sidebar overlay, ключ `shell.overlay.back` (ru/en/fr/de/bg)
- Интеграционный тест: history panel видна внутри `SoftphoneLayout` overlay layer

## Зачем
- Исправить невидимые/некликабельные панели контактов и истории из-за конфликта overlay stacking и pointer-events

## Результат
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run i18n:check` — PASS
- Focused overlay/navigation tests — 18/18 PASS
