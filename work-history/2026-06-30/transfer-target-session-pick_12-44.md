# Выбор сессии для перевода (вариант E)

**Дата:** 2026-06-30 12:44
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/deriveTransferTargetCandidates.ts`
- `src/application/projections/multiLineCallProjection.ts`
- `src/renderer/components/call/TransferPanel.tsx`
- `src/renderer/components/call/TransferPanel.module.css`
- `src/renderer/components/call/TransferPanel.test.tsx`
- `src/renderer/components/call/TransferPanel.stories.tsx`

## Что
- Добавлено поле `remoteNumber` в `CallLine` projection (сохраняется при смене display name)
- Projection `deriveTransferTargetCandidates` — кандидаты Active/Held без source и consultation
- На шаге 1 `TransferPanel`: секция «Другие активные звонки» над input; клик заполняет номер
- Стили candidate cards (light/dark через токены), highlight при совпадении с input
- Тесты projection + UI; Storybook с двумя линиями; UI catalog обновлён

## Зачем
Оператор может выбрать абонента из текущих сессий или ввести номер вручную, не меняя существующий 4-шаговый флоу перевода.

## Результат
- `npm run test` — 893 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
- `npm run ui:catalog` — ok
