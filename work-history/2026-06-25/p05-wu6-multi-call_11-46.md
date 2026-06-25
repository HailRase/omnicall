# P05 WU6 Multi-Call Completeness

**Дата:** 2026-06-25 11:46
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/telephony/events/MultiCallOperationRejected.ts`
- `src/application/services/MultiCallPolicyService.ts`
- `src/application/services/IncomingCallOrchestrator.ts`
- `src/application/integration/MultiCallCompleteness.integration.test.ts`
- `src/renderer/components/call/CallLinesShell.tsx`
- `docs/softphone/handoffs/P05-WU6-Multi-Call-Completeness-Handoff.md`

## Что
- Добавлен `MultiCallOperationRejected` и `lastPolicyViolation` в projection
- Hold-all на incoming answer (симметрия LF-021), compensating rollback hold-all (B1)
- Guard connecting/hold-all для dial, answer, resume; auto-486 при multiSessions OFF (A3)
- Блок auto-answer при активном вызове (F1)
- `CallLinesShell` + per-line resume/hangup; tone/audio interim (C1/C2)
- Тесты и обновление Feature Registry / Legacy Coverage

## Зачем
Закрыть mock gate P05 WU6 по product decisions перед RAT step 08 (real JsSIP multi-call).

## Результат
- `npm run test`: 636 passed, 1 skipped
- `npm run lint`: OK
- `npm run typecheck`: OK
- RAT step 08 не начат (по gate)
