# Исправление consultation_not_active при старте консультации

**Дата:** 2026-06-29 12:17
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/attendedTransferOperations.ts`
- `src/application/services/CallEngine.ts`
- `src/application/services/TransferCallControlService.ts`
- `src/application/services/CallEngine.attendedTransfer.test.ts`

## Что
- Выявлена причина: `executeStartConsultation` требовал `Active` сразу после `makeCall`, а при SIP 180/183 возвращался `Ringing`
- Добавлен режим отложенной активации: `Connecting`/`Ringing` оставляют сессию в `consultation_dialing`
- Добавлен `completeConsultationWhenAnswered` — переход в `consultation_active` по `handleOutboundCallAnswered`
- Тест: консультация с `progress_180` → ответ → успешный attended transfer

## Зачем
- Убрать ложный откат «Ошибка консультации: consultation_not_active» пока абонент ещё не ответил на консультационный вызов.

## Результат
- `npm run test` — 778 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
