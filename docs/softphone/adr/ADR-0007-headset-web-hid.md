# ADR-0007: Headset Integration via Web HID

## Status

Accepted (2026-07-09)

## Context

Phase P10 requires optional USB headset call control and LED sync for Jabra and Plantronics/Poly without coupling telephony to vendor SDKs.

## Decision

1. Use renderer **Web HID** as the only v1 transport (`HeadsetGateway` port).
2. Isolate vendor byte parsing and LED encoding in **adapter profiles** under `src/adapters/headset/webhid/`.
3. Keep telephony rules in **Application** via `HeadsetSessionOrchestrator` and existing Use Cases.
4. Make integration **opt-in** through `UserSettings.headsetEnabled` (default `false`).
5. Maintain a **single orchestrator path** — no legacy dual runtime from jssip-phone.
6. Derive orchestrator input from existing call projections — no parallel session store.

## Consequences

- New vendors add adapter profiles only; Call Engine unchanged.
- Electron main grants `hid` permission and handles `select-hid-device`.
- SDK-based adapters can implement `HeadsetGateway` later without orchestrator changes.
- E2E with physical devices remains manual until a device harness exists.
