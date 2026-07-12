# Headset multi-session policy lock

**Дата:** 2026-07-10 12:02
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/headset/session/resolveHeadsetSessionFocus.ts`
- `src/application/headset/resolveHangupTargetId.ts`
- `src/application/headset/forwardHeadsetHardwareEvent.ts`
- `src/application/services/headset/HeadsetIntegrationService.ts`
- `src/ports/headset/HeadsetGateway.ts`
- `src/adapters/mock/MockHeadsetGateway.ts`
- `src/renderer/hooks/useCallFeatureShell.ts`
- `docs/softphone/Feature-Registry.md`, `docs/softphone/handoffs/P10-Headset-Integration-Handoff.md`

## Что
- Focus priority: incoming → outgoing → selected → primary → active → held
- Hangup (hook-on) targets focused session, including Held
- Mute from headset applies to focused established (incl. Held); LED still no mute+hold
- After answer: UI/headset selection stays on answered call; reject/miss restores prior
- Wired `setAutoReconnectEnabled` from UserSettings into gateway
- USB failover не делаем (disconnect + toast)

## Зачем
- Зафиксировать multi-session политики по ответам Q1–Q7 и довести focus/LED/hangup до согласованного контракта

## Результат
- vitest headset suites: 52 passed
- AccountBootstrapFacade tests: 26 passed
