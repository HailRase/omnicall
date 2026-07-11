# Headset Sync Contract

- Purpose: lock SyncQueue invariants for headset mute/hold LED parity.
- Inputs: UI/hardware intents, snapshot LED reconcile, firmware echo windows.
- Outputs: safe begin/clear of mute/hold sync without dual-runtime regressions.
- Agent map: `HEADSET-AGENT-ONBOARDING.md` §2–4.

## Invariants

1. LED reconcile (`enqueueCommands` from snapshot) **never** calls `beginHoldSessionSync` / `beginMuteSessionSync`.
2. Guards arm only from UI or hardware intent paths (`begin*` / confirm after Use Case).
3. `lastSnapshot` stale retry after intent clear is intentional (orchestrator comment).
4. Mute echo windows (`MUTE_ECHO_MS`, `HOLD_LED_MUTE_ECHO_MS`) change only with device evidence.
5. Focus priority stays: incoming → outgoing → selected → primary → active → held → idle (ADR required to change).

## Mute echo policy (2026-07-11)

| Input | `muteInputMode` | `muteEchoPolicy` | Echo window behavior |
| --- | --- | --- | --- |
| Jabra HSC016 / Evolve | `pulse` | `matchOnly` | Swallow **all** mute HID events while echo active |
| Poly BW3320 / generic | `latch` | **`swallowAll`** | Swallow all firmware bounce during echo (LED sync) |
| Generic latch (future) | `latch` | `matchOnly` | Swallow matching bit only; opposite = user override |

**LED reconcile side effect:** when snapshot emits `setMute` and connected device has `muteEchoPolicy: swallowAll`, orchestrator calls `armHardwareMuteEcho()` (600 ms). Do **not** do this for pulse/Jabra — breaks post-echo user press timing.

**Pending intent:** while `hasPendingSyncIntent()`, all hardware mute events are ignored regardless of policy.

## Key files

```txt
src/application/headset/HeadsetSyncQueue.ts
src/application/headset/HeadsetSessionOrchestrator.ts   → reconcileToDevice, handleHardwareEvent
src/domain/headset/HeadsetCapabilities.ts               → muteEchoPolicy
src/adapters/headset/webhid/profiles/poly*.profile.ts     → swallowAll
```
