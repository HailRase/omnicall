# FIX — RAT Smoke UX — R1-5 reconnect overlay countdown/attempts

**Дата:** 2026-06-24 17:49
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useReconnectCountdown.ts`
- `src/application/services/ConnectionRecoveryOrchestrationService.ts`
- `src/adapters/telephony/jssip/createJsSipUserAgent.ts`
- `src/renderer/hooks/useReconnectCountdown.test.ts`
- `src/application/services/ConnectionRecoveryOrchestrationService.test.ts`

## Что
- Countdown hook: `setInterval` 1s вместо one-shot `setTimeout`
- Orchestration: дедупликация повторных `SipTransportDisconnected` / OCP disconnect при активной recovery-сессии
- Убран `clearChannel` при первом disconnect — сессия не сбрасывается при дубликатах
- Документировано разделение ownership: JsSIP `connection_recovery_*` (transport) vs app orchestration (policy/UI)
- Тесты: тик 5→4→3→0; монотонный attempt при duplicate disconnect и retry chain

## Зачем
UX FAIL на R1-5 smoke: countdown прыгал к 0, attempt 2→1 при повторных disconnect от JsSIP transport recovery.

## Результат
- `npm run test -- --run` на 3 файлах: 7/7 PASS
- Acceptance: countdown тикает каждую секунду; attempt монотонен до success/terminal; auto recovery не затронут
