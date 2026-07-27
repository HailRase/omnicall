# @softomnitel/omnicall-protocol

## 0.1.0

### Minor Changes

- First **stable** public release (Mode B) after DI-10 full close (2026-07-27).
  Runtime Zod schemas, inferred types, and golden fixtures for OmniCall local protocol v1.
  npm dist-tag **`latest`**. Linked with `@softomnitel/omnicall-kit@0.1.0`.

## 0.1.0-rc.0

### Minor Changes

- First public release candidate (Mode A). Protocol package for RC consumers on tag `rc`.

### Typing DX (additive, 2026-07-27)

- Shared `PublicOperatorStatus` / `PublicOperatorStatusSchema` used by snapshot +
  operator status events (same wire values; no semantic change)

### Included since incubation (SDK-00…SDK-09)

- Runtime Zod schemas for local protocol v1
- Inferred TypeScript types + golden fixtures (`./fixtures/*`)
- Compatibility and negative fixtures for handshake, auth, commands, events, replies
- Public surface tracked in `etc/api/protocol.api.md` (api:check gate)

### Additive (compatible)

- Optional `queueLabel` on call events / `SnapshotCallSummary` (ACD queue titles)
- ADR-0019 campaign events + `operator.campaign.read`
- ADR-0020 `call:acd-context` + snapshot `acdContext` under `ocp.acd_context.read`
- ADR-0013 amendment: `window:hide` product-available; `window.hide` capability
