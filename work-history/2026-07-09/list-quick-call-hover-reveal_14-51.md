# Hover-reveal для кнопки «Позвонить» в списках

**Дата:** 2026-07-09 14:51
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/list/ListQuickCallReveal.tsx`
- `src/renderer/hooks/useListRowActionReveal.ts`
- `src/renderer/components/history/HistoryPanelShell.tsx`
- `src/renderer/components/contacts/ContactsPanelShell.tsx`

## Что
- Добавлен `ListQuickCallReveal` с framer-motion: slide-in/out справа
- Хук `useListRowActionReveal` — hover/focus на строке, на touch без hover кнопка всегда видна
- Подключено в истории звонков и списке контактов
- Юнит-тесты для reveal-компонента и хука
- Доработка анимации: убран `overflow: hidden` и width-reveal (обрезал круг); scale+slide с `transform-origin: right`, spring ~300ms на появление, ~260ms на исчезновение

## Зачем
Спрятать зелёную кнопку быстрого звонка до наведения на строку, чтобы списки выглядели чище.

## Результат
- `npm run test -- --run` по затронутым файлам: passed
