# Headset Sync Contract

- Purpose: lock SyncQueue invariants for headset mute/hold LED parity.
- Inputs: UI/hardware intents, snapshot LED reconcile, firmware echo windows.
- Outputs: safe begin/clear of mute/hold sync without dual-runtime regressions.

## Invariants

1. LED reconcile (`enqueueCommands` from snapshot) **never** calls `beginHoldSessionSync` / `beginMuteSessionSync`.
2. Guards arm only from UI or hardware intent paths (`begin*` / confirm after Use Case).
3. `lastSnapshot` stale retry after intent clear is intentional (orchestrator comment).
4. Mute echo windows (`MUTE_ECHO_MS`, `HOLD_LED_MUTE_ECHO_MS`) change only with device evidence.
5. Focus priority stays: incoming → outgoing → selected → primary → active → held → idle (ADR required to change).
