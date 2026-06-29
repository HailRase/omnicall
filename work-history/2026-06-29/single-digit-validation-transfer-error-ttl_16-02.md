# Одноцифровый номер и TTL ошибки перевода

**Дата:** 2026-06-29 16:02
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/telephony/PhoneNumber.ts`
- `src/application/projections/transferProjection.ts`
- `src/application/projections/multiLineCallProjection.ts`
- `src/renderer/hooks/useTransferFailureBanner.ts`
- `src/renderer/hooks/useTransferActions.ts`
- `src/renderer/components/call/TransferPanel.tsx`

## Что
- Минимальная длина локального номера снижена с 3 до 1 цифры (диалпад, исходящий звонок, слепой и консультативный перевод)
- Кнопка «Далее» в панели перевода использует `isDialpadNumberValid`
- `multiLineCallProjection` сбрасывает `lastFailureReason` при повторном `CallTransferRequested` / `AttendedTransferRequested`
- Баннер ошибки перевода: автоскрытие через 5 с, сброс при новой попытке, перезапуск таймера при новой ошибке

## Зачем
Короткие внутренние номера (добавочные) должны быть валидны; старая ошибка перевода не должна блокировать следующую попытку.

## Результат
- `npm run test` — 801 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
