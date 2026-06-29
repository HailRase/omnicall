# Transfer panel — ложные сообщения при переводе

**Дата:** 2026-06-29 22:52
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/TransferPanel.tsx`
- `src/renderer/components/call/TransferPanel.test.tsx`

## Что
- `renderDisabledReason`: на шаге 3+ не показывать blind/cancel reasons (после очистки номера — ложный invalid_target)
- При `transferInProgress` скрывать disabled-reason (прогресс уже в отдельном блоке)
- Тесты на дубль «Перевод выполняется» и invalid_target на шаге консультации

## Зачем
Убрать «Некорректный номер перевода» при успешном переводе и двойное «Перевод выполняется».

## Результат
TransferPanel tests — ok; lint — ok.
