# Fix settings open + remove context AccountPanel

**Дата:** 2026-06-26 12:43
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useOverlayShell.ts`, `settingsSections.ts`
- `src/renderer/shells/SoftphoneReadyShell.tsx`

## Что
- `openSettings` игнорирует MouseEvent при `onClick={openSettings}` — валидация через `isSettingsSectionId`
- `AuthAccountShell` убран из context; авторизация только в настройках → Аккаунт
- Тест на передачу объекта события в `openSettings`

## Зачем
Устранить crash `Unsupported settings section: [object Object]` и перенести account UI в settings.

## Результат
711 passed; lint, typecheck — OK.
