# FIX — RAT Smoke UX — reconnect phases (countdown / in-progress / attempt)

**Дата:** 2026-06-24 17:57
**Статус:** выполнено
**Коммит:** (after push)

## Где
- `src/domain/telephony/events/sipRecoveryEvents.ts`
- `src/domain/operator/events/ocpRecoveryEvents.ts`
- `src/application/services/ConnectionRecoveryOrchestrationService.ts`
- `src/application/projections/connectionRecoveryProjection.ts`
- `src/renderer/hooks/useReconnectCountdown.ts`
- `src/renderer/components/recovery/ConnectionOverlay.tsx`

## Что
- Новые domain events: `SipReconnectAttemptStarted`, `OcpReconnectAttemptStarted`
- Orchestration публикует AttemptStarted в начале `executeReconnectAttempt` (до await gateway)
- Projection: in-progress фаза (`nextRetryAt: null`, attempt обновлён); non-terminal failed остаётся `reconnecting`
- Countdown: `null` при `<= 0` вместо застывшего «0»
- Overlay: countdown только при `> 0`; иначе «Reconnecting now…» (`reconnect-in-progress`)

## Зачем
Таймер замирал на 0 во время реального reconnect; attempt не рос и прыгал (3) из-за gap между scheduled/failed/in-flight без domain events.

## Результат
- Recovery tests + lint PASS
- UX: waiting (countdown) → in-progress (attempt N visible) → waiting (N+1) без flicker в `sip_disconnected`
