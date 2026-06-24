# RAT Step 07 — transfer failure recovery + REFER 487 mapping

**Дата:** 2026-06-24 22:40
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/multiLineCallProjection.ts`
- `src/domain/telephony/events/callEvents.ts`
- `src/application/services/transferCallControlLogging.ts`
- `src/adapters/telephony/jssip/jsSipReferEventUtils.ts`
- `src/adapters/telephony/jssip/executeJsSipRefer.ts`
- `docs/softphone/adr/ADR-0003-sbc-refer-semantics.md`

## Что
- `CallTransferFailed` + `restoredSourceState`; multi-line projection восстанавливает `Active`/`Held` после failed blind transfer
- Классификация NOTIFY sipfrag (487→canceled, 486→busy и т.д.) и user-friendly сообщения в adapter
- `callProjection` сбрасывает `lastError` при новом `CallTransferRequested`
- Тесты projection retry + refer utils; ADR-0003 дополнен таблицей кодов

## Зачем
После реального REFER 487 UI показывал «Transfer not available» из-за залипшего `Transferring` в multi-line projection; сырой SIP текст непонятен оператору.

## Результат
- `npm run test` — 585 passed, 1 skipped
- lint/typecheck green
- SIP 487 на target — ожидаемый SBC-ответ; retry transfer в UI должен работать после перезапуска dev
