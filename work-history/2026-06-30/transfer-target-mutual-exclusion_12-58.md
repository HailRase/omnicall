# Transfer target: номер или сессии

**Дата:** 2026-06-30 12:58
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/TransferPanel.tsx`
- `src/renderer/components/call/TransferPanel.module.css`
- `src/renderer/components/call/TransferPanel.test.tsx`

## Что
- Порядок шага 1: номер → «или» → сессии
- Взаимоисключение: выбор сессии блокирует input; ручной ввод блокирует кнопки сессий
- Повторный клик по выбранной сессии снимает выбор и разблокирует номер
- Скролл только в `.candidateScroll`; шаг 1 без скролла всего body (`bodyStepTarget`)
- Кнопка «Далее» прижата к низу блока шага

## Зачем
UX по запросу: явный выбор между ручным номером и текущими сессиями без одновременного редактирования.

## Результат
- `npm run test` (TransferPanel) — 23 passed
- `npm run lint` — ok
