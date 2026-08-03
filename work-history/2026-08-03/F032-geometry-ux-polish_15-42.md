# F-032 geometry editor UX polish

**Дата:** 2026-08-03 15:42
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/external-applications/WindowGeometry*`
- `windowGeometryConstants.ts`, `windowGeometryMath.ts`, `usePointerRafEmit.ts`
- i18n `messages.ts` / `bgMessages.ts`; Feature Registry / P14 / I18N-Coverage

## Что
- Layout: preview слева, настройки справа
- Свободный ввод W/H/X/Y с commit на blur/Enter (без clamp при наборе)
- Масштаб preview 1:10 → 1:5 (в 2 раза крупнее)
- Resize handles: края + углы; drag/resize через rAF
- Визуальная структура секции; docs sync

## Зачем
- Улучшить UX редактора геометрии окна внешних приложений

## Результат
- `vitest` geometry/panel: 24/24 ✓
- `i18n:check` ✓; eslint geometry ✓
