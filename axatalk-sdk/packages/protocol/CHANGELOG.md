# @axata/axatalk-protocol

## Unreleased — RC staging (SDK-10 Mode A)

First public release candidate target: **`0.1.0-rc.0`** on npm dist-tag **`rc`**
(linked with `@axata/axatalk-sdk`).

Packages remain `private: true` / `0.0.0` until authorized RC publish.
Stable / `latest` is **blocked on desktop DI-10**.

### Included since incubation (SDK-00…SDK-09)

- Runtime Zod schemas for local protocol v1
- Inferred TypeScript types + golden fixtures (`./fixtures/*`)
- Compatibility and negative fixtures for handshake, auth, commands, events, replies
- Public surface tracked in `etc/api/protocol.api.md` (api:check gate)

### Additive (compatible, desktop DI-05 follow-up 2026-07-26)

- Optional `queueLabel` (string 1…128) on call event payloads and `SnapshotCallSummary`
  for ACD queue titles from desktop OCP call context. Omitted when unknown/direct.
- **ADR-0019 campaign events (same day):** public `operator:campaign-offered` /
  `operator:campaign-cleared`; capability `operator.campaign.read` (default on
  `operator` / `call_controller` profiles); optional snapshot `operator.campaign`
  (same redacted shape as offered). `V1_DEFERRED_CAMPAIGN_EVENTS` is now empty.
  Accept/reject commands remain out of scope. API report updated via `api:check`.
  Cleared `reasonCode` still includes `superseded` for compatibility; desktop
  hold-until-idle for a second preview does not emit that reason (promote →
  Cleared then Offered).
- **ADR-0020 ACD wire (same day):** `call:acd-context` carries OCP MainCallIDInfo
  snake_case fields (`acallid`, `main_acallid`, …) under capability
  `ocp.acd_context.read` (default on `operator` / `call_controller`). Additive
  `queueLabel` on `call:*` remains free of wire ids.
- **ADR-0020 snapshot recovery (same day):** optional `SnapshotCallSummary.acdContext`
  (same MainCallIDInfo snake_case shape, no parent `callId` repeat) for reconnect;
  stripped without `ocp.acd_context.read`. Live `call:acd-context` unchanged.

- **ADR-0013 amendment (2026-07-27):** `window:hide` product-available;
  `V1_PRODUCT_UNAVAILABLE_COMMANDS` emptied (stable export retained). Privileged
  capability `window.hide` — Origin matrix only; telephony-busy deny is a desktop
  product rule (not a permanent protocol deny list entry).

### Not included

- Stable npm `latest` publish
- Desktop Domain / Electron types (forbidden dependency)
