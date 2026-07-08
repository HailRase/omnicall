# P08 F-014 SIP Registration Retry — Gate Handoff

- **Feature:** F-014
- **Legacy:** LF-008, LF-009, LF-010
- **Phase:** P08 Connection Loss, Recovery, And Cleanup
- **Work-history:** `work-history/2026-06-25/f014-gate-closure_22-58.md`

## Scope

Separate transport (`SipReconnect*`) and registration (`SipRegistrationRetry*`) recovery on live WebSocket. Flat per-user policy (5×5s default). Manual re-register via `ReregisterSipUseCase`. RU failure copy in overlay.

## Delivered

| Area | Path |
| --- | --- |
| Domain events | `src/domain/telephony/events/sipRegistrationRetryEvents.ts` |
| Settings | `src/domain/settings/SipRecoverySettings.ts`, `UserSettings.ts` |
| Orchestration | `src/application/services/recovery/ConnectionRecoveryOrchestrationService.ts` |
| Use case | `src/application/use-cases/telephony/ReregisterSipUseCase.ts` |
| Projection | `src/application/projections/telephony/sipSessionHealthProjection.ts` |
| Shell derive | `src/application/projections/telephony/deriveSipSystemStateShell.ts` |
| Adapter | `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts` (`reregister`) |
| UI | `ConnectionOverlay.tsx`, `SettingsOverlay.tsx` |
| Facade test helper | `AccountBootstrapFacade.simulateSipRegistrationFailed` |

## Tests

| Layer | File |
| --- | --- |
| Integration | `src/application/integration/SipRecoveryOrchestration.integration.test.ts` (transport + registration retry + terminal) |
| Use case | `src/application/use-cases/telephony/ReregisterSipUseCase.test.ts` |
| Projection shell | `src/application/projections/telephony/deriveSipSystemStateShell.test.ts` |
| UI | `src/renderer/components/recovery/ConnectionOverlay.test.tsx` |

## Gate checklist

- [x] Transport vs registration recovery split (`SipReconnect*` / `SipRegistrationRetry*`)
- [x] `RegistrationFailed` → `sip_registration_failed` (not transport lost)
- [x] Auto retry via `reregister()` on live transport
- [x] Per-user flat policy in settings UI
- [x] Pause retry during active calls
- [x] Manual re-register (`ReregisterSipUseCase`)
- [x] RU failure reason mapping in overlay
- [x] Integration test: authorize → registration failed → scheduled → success → connected
- [x] Integration test: terminal failure → `manual_retry_available`
- [x] UI catalog synced (`SettingsOverlay` SIP test ids; `ConnectionOverlay` without static `reconnect-in-progress`)
- [x] Legacy evidence LF-008 / LF-010 updated
- [x] `npm run test` — **704 passed**, 1 skipped
- [x] `npm run lint` — green
- [x] `npm run typecheck` — green
- [x] `npm run ui:catalog` — catalog regenerated (commit `docs/softphone/UI-Component-Catalog.md` for `ui:catalog:check`)

## Verification commands

```bash
npm run test && npm run lint && npm run typecheck && npm run ui:catalog:check
```

## Stop gate

Do **not** start T-003 (F-008 DTMF) or P10 until `/review` returns `gate_pass` on this handoff.
