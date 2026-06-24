# Baseline Snapshot — 2026-06-24

## Implemented (mock)

- F-000 … F-015, F-014: platform through recovery — mock gateways
- 488 unit/integration/component tests green (P08 WU4 baseline)
- UI: dialpad, incoming modal, active controls, transfer panel, status selector,
  connection overlay, campaign modal, OCP toasts

## Not implemented (real)

- Persisted settings (`InMemorySettingsRepository` only)
- E2E harness
- F-016 Settings, F-017 Diagnostics

## Real adapters (RAT, 2026-06-24)

- **Done (active):** JsSIP registration R1, browser media R2, call lifecycle R3, hold/mute R4
- **Deferred (ADR-0002):** OCP WebSocket R5 — see `OCP-PLUGIN-BACKLOG.md`
- **Next (active):** real SIP transfer R6 / step 07

## Real SIP library (RAT)

- Dependency: `@hailrase/jssip` — fork of upstream JsSIP with a micro-fix (`docs/softphone/real-integration/JSSIP-FORK.md`).

## Key paths

| Layer | Path |
| --- | --- |
| Composition | `src/infrastructure/bootstrap/createAccountBootstrap.ts` |
| Facade | `src/application/facades/AccountBootstrapFacade.ts` (~700 lines) |
| Telephony port | `src/ports/telephony/TelephonyGateway.ts` |
| Media port | `src/ports/media/MediaGateway.ts` |
| OCP port | `src/ports/operator/OperatorPlatformGateway.ts` |
| OCP sync port | `src/ports/operator/OcpSyncGateway.ts` |
| Renderer bootstrap | `src/renderer/hooks/useAccountBootstrap.ts` |
| Manual SIP UI | `src/renderer/components/account/AccountPanel.tsx` |
| Incoming mapper | `src/adapters/telephony/mapTelephonyIncomingNotification.ts` |

## Recommended slice order

| Slice | Scope | Legacy |
| --- | --- | --- |
| R1 | SIP register / unregister / transport hooks | LF-007, LF-008 |
| R2 | Browser media (ringtone, remote audio) | LF-012, LF-033 |
| R3 | Outgoing + incoming + hangup | LF-013–017, LF-020 |
| R4 | Hold / mute real | LF-022, LF-024, LF-027 |
| R5 | OCP WebSocket — **DEFERRED** (ADR-0002) | LF-001–004, LF-037–040 |
| R6 | Transfer (active next) | LF-028, LF-029 |
