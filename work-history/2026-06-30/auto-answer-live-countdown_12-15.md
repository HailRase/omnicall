# Auto-answer live countdown

**Дата:** 2026-06-30 12:15
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/telephony/events/callEvents.ts` — `autoAnswerExpiresAt` в `IncomingCallRingingStarted`
- `src/application/projections/deriveAutoAnswerCountdown.ts`
- `src/renderer/hooks/useAutoAnswerCountdown.ts`

## Что
- Оркестратор публикует ISO `autoAnswerExpiresAt` вместе с таймером SIP
- Проекция хранит `autoAnswerExpiresAt` и `autoAnswerTimeoutSec`
- Хук `useAutoAnswerCountdown` тикает каждую секунду (как reconnect countdown)
- Подпись: «Автоответ через N» … «Автоответ через 0»

## Зачем
Статическое значение в проекции не уменьшалось; нужен живой обратный отсчёт без дублирования таймера в UI.

## Результат
- `npm run test` — green
- `npm run typecheck` — green
