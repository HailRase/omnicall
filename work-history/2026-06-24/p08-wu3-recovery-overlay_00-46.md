# P08 WU3 Recovery Overlay + Server Terminate

**Дата:** 2026-06-24 00:46
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/recovery/ConnectionOverlay.tsx`
- `src/renderer/hooks/useConnectionRecoveryShell.ts`, `useReconnectCountdown.ts`
- `src/application/projections/deriveConnectionRecoveryShell.ts`
- `src/application/use-cases/ProcessOcpInboundMessageUseCase.ts`
- `src/domain/operator/ocp/OcpInboundMessages.ts`
- `docs/softphone/handoffs/P08-WU3-Recovery-Overlay-Handoff.md`

## Что
- Presentational `ConnectionOverlay` со всеми projection states, test IDs и a11y (LF-057)
- `useReconnectCountdown` — one-shot setTimeout без setInterval
- `useConnectionRecoveryShell` + derive: showOverlay, blocking, channel rows, disabled retry
- Монтирование overlay в `App.tsx`; OCP-only — non-blocking banner
- Inbound `server_terminate` → `ServerTerminateReceived` + остановка scheduler (LF-049)
- Mock/facade helpers: `simulateServerTerminate`, `MockOperatorPlatformGateway`
- Тесты: overlay, countdown, shell derive, integration ServerTerminate
- Обновлены UX design WU3, F-014, Legacy LF-057/LF-049, handoff

## Зачем
WU3 gate P08: видимый overlay потери связи и безопасная обработка server terminate без manual retry (WU4) и logout cascade (WU3+).

## Результат
`npm run test` — 476 passed (+18); `npm run lint` — ok; `npm run typecheck` — ok.
