# F-032 openMode preview contrast

**Дата:** 2026-08-03 12:48
**Статус:** выполнено
**Коммит:** `ae968b7`

## Где
- `src/renderer/components/settings/external-applications/OpenModeSchematics.tsx`
- `src/renderer/components/settings/external-applications/OpenModeChoiceCards.module.css`

## Что
- Softphone inner UI: `surface-alt` + border (видны на light, где surface/elevated оба белые)
- Preview container: больше горизонтальный padding (`sm` / `md`)
- Desktop taskbar: единый `surface-deep` + clipPath + outline со скруглением снизу
- Контраст title/chrome/content/tabs для light/dark

## Зачем
- Читаемость preview на светлой теме и одинаковый footer у обеих карточек

## Результат
- Ручная проверка light/dark в Settings → External Applications → General
