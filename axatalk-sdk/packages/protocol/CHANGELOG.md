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
  Does not introduce new event types or campaign events. API report updated via `api:check`.

### Not included

- Stable npm `latest` publish
- Desktop Domain / Electron types (forbidden dependency)
