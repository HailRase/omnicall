# History detail contact button grouped radius fix

**Дата:** 2026-07-08 12:53
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/history/HistoryDetailPanel.tsx`
- `src/renderer/components/history/HistoryDetailPanel.module.css`

## Что
- Добавлен класс `contact-action-button` с `border-radius: 0` для нижней кнопки группы
- Кнопка «Контакт» использует тот же паттерн grouped button, что «Перезвонить» и «Удалить»
- Добавлен `border-top` для визуального разделителя между кнопками в группе
- Обновлён `HistoryDetailPanel.module.css.d.ts`

## Зачем
Кнопка «Контакт» в деталях истории звонка имела полное скругление углов и не вписывалась в grouped button вместе с «Перезвонить».

## Результат
- `npm run test -- src/renderer/components/history/HistoryDetailPanel.test.tsx` — 5 passed
- stylelint на изменённый CSS — ok
- lint/typecheck в репозитории имеют предсуществующие ошибки, не связанные с этим изменением
