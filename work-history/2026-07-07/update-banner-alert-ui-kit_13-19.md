# UpdateAvailableBanner на Alert UI Kit

**Дата:** 2026-07-07 13:19
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/updates/UpdateAvailableBanner.tsx`
- `src/renderer/components/updates/UpdateAvailableBanner.module.css`
- `src/renderer/components/updates/UpdateAvailableBanner.module.css.d.ts`

## Что
- Заменена кастомная карточка на `Alert`, `AlertTitle`, `AlertDescription` из UI Kit
- Иконка `updates.available` в слоте Alert (animated по умолчанию)
- Кнопки «Скачать» и «Позже» переведены на `Button` (`primary` / `outline`, `sm`)
- CSS упрощён: остались только позиционирование overlay, тень, анимация и ряд действий
- Обновлены типы CSS-модуля

## Зачем
Унифицировать баннер обновления с UI Kit Alert и семантической иконкой обновления.

## Результат
- `npm run test -- --run UpdateAvailableBanner.test.tsx` — 4/4 OK
- `npm run lint` — OK
- `npm run typecheck` — pre-existing ошибки в `Alert.stories.tsx`, `useActionNotifications.ts` (не в scope)
