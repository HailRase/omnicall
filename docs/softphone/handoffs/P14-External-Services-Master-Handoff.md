# P14 External Services (F-031) — Master Handoff

## Status

| Field | Value |
| --- | --- |
| Feature | F-031 External Services (Outbound HTTP Automations) |
| Legacy | `_none_` (new product feature; no LF parity) |
| Phase | P14 External Services |
| Feature status | **implemented** (WU-12 closeout 2026-07-30) |
| Branch | `feature/external-services` |
| Task | T-052 **done** |
| Plan | `external-services-plan/` (all WUs **done**) |
| ADR | [ADR-0022](../adr/ADR-0022-external-services-http-isolation.md) + [ADR-0023](../adr/ADR-0023-external-services-per-trigger-delay.md) — **Accepted** |
| Next | Shipped in **1.2.0** (2026-07-31); optional `/review` archive hygiene |

## Mission

Ship profile-scoped outbound HTTP automations under Settings → Integrations → External
Services without coupling telephony/OCP/SDK paths to network latency or response control.

## Locked non-goals

- Inbound HTTP API; Postman scripts; conditions; chaining; cloud sync.
- Prebuilt Bitrix connector; HMAC; secrets vault; retries; offline catch-up.
- Response-driven call control; nested folders; hold/mute/register/OCP-session/SDK/transfer triggers.
- F-011 protocol/capability changes; F-028 OCP wire changes; SSRF denylist in v1.

## Explicit non-overlap

| Feature | Relationship |
| --- | --- |
| F-011 OmniCall Kit | Separate top-level Settings leaf; no F-031 config/journal in SDK surface |
| F-028 OCP | Consume-only campaign/ACD facts; no OCP control or login trigger |
| F-030 Preferences | Extend export/import with External Services config; journal excluded |
| F-023 / F-024 | Profile-scoped persistence and active account key only |

## WU / evidence table

| WU | Title | Status | Evidence |
| --- | --- | --- | --- |
| WU-00 | Registry, ADR, handoff bootstrap | **done** | F-031 registry; T-052; STATUS; this handoff; ADR-0022 Proposed; `npm run registry:check`; `external-services-plan/PROGRESS.md` |
| WU-01 | Domain data model and settings migration | **done** | Immutable parser/types; `UserSettings` v12; focused tests, typecheck, targeted lint, registry PASS |
| WU-02 | Ports and mock adapters | **done** | HTTP/journal/collection-file, clock and UUID ports; deterministic mocks; focused contract tests; ADR-0022 Accepted |
| WU-03 | Variable resolver and event matcher | **done** | Pure matcher/template/request/security policies; typed call/campaign/ACD mapper and tracker; focused tests + typecheck PASS |
| WU-04 | Execution engine and manual run | **done** | Queue max-3/FIFO; execute/manual Use Cases; journal redaction; typed IPC + main `fetch` redirects≤5/1 MiB/10s; composition synthetic entry; focused tests + typecheck PASS |
| WU-05 | Profile persistence and lifecycle wiring | **done** | File journal document + `FileExternalServicesJournalRepository`; Save/Query Use Cases; lifecycle wiring; profile A/B + in-flight + corrupt tests; typecheck PASS |
| WU-06 | F-030 preferences export/import extension | **done** | External Services nested round-trip in `omnicall.preferences` v1; journal excluded; facade `replaceActiveSettings`; Preferences tests; design synced |
| WU-07 | Collection JSON import/export | **done** | Domain document + Export/Import Use Cases; typed IPC/preload/main collection file gateway (2 MiB); facade import/export; round-trip/fail-closed tests |
| WU-08 | Navigation and collections UI | **done** | Integrations leaf beside OCP; SDK top-level preserved; Postman-like COLLECTIONS sidebar; five locales; nav/panel tests + light/dark stories |
| WU-09 | Requests editor and Run now UI | **done** | Request workspace URL bar + tabs + Send/Response; save/delete/discard; facade Run now; five locales; focused tests and stories |
| WU-10 | Journal UI | **done** | History tab (*** headers, truncation, cap 100); empty/loading/error/retry; five locales; projection/component tests + stories |
| WU-11 | Real event integration hardening | **done** | Application call-focus projection; post-commit binder; typed snapshot; multi-call/campaign/ACD/non-blocking tests |
| WU-13 | Per-trigger delay, queue monitor, logout warning | **done** | Schema v13 bindings; DelayScheduler; Queue UI; logout warning; ADR-0023; migration + scheduler tests |
| WU-12 | Documentation close, preflight, release decision | **done** | Acceptance audited; v13 fixture/lint closeout; full gates PASS; registry/STATUS/TASK-QUEUE synced; SemVer pending ship auth |

Live machine status: `external-services-plan/PROGRESS.md`.

## ADR-0022 gate

| Decision | State |
| --- | --- |
| Main-process HTTP + `OutboundHttpPort` + typed IPC | Accepted |
| Non-async post-commit subscriber; concurrency 3 | Accepted |
| Application-owned focus projection | Accepted |
| Pending cancel / in-flight complete on profile switch | Accepted |
| Local/private URL allowance; no SSRF denylist | Accepted |
| Redirects ≤5; strip protected headers on origin change; 1 MiB / 16 KiB / 100 | Accepted |

## ADR-0023 gate

| Decision | State |
| --- | --- |
| Trigger bindings `{ eventType, delaySeconds }` 0–180 | Accepted |
| Snapshot-at-event; revalidate before FIFO enqueue | Accepted |
| Waiting cancel on lifecycle/revision/dispose/Queue; no journal for drops | Accepted |
| Manual Run ignores delay | Accepted |

## Runtime composition

```txt
UI → Facade / Use Cases → ExternalServicesAutomationService
  → ExternalServicesDelayScheduler → ExternalServicesDispatchQueue
  → OutboundHttpPort + JournalRepository
  → Preload adapter → typed IPC → Electron main HTTP
```

- Compose via `createExternalServicesCompositionForBootstrap`.
- `bindExternalServicesAutomation` registers after `bindFacade`, reads committed projections, disposes with bootstrap.
- Zero collections → inert matching; SIP-only preserved.

## Trigger / variable / focus matrix

Stable automatic codes: `incoming_ringing`, `outgoing_connecting`, `call_answered`,
`call_ended`, `call_rejected`, `call_missed`, `campaign_offered`, `campaign_accepted`,
`campaign_rejected`, `acd_context_appeared`, `post_call_processing`. Manual: `manual_run`.

- Focus gate: every call-related trigger requires focused call at evaluation time.
- Operator-level (no focus gate): `campaign_*`, `post_call_processing` (OCP `OperatorStatusChanged` → `POST_CALL_PROCESSING` only).
- Optional per-trigger delay 0–180s (event-time snapshot).
- Base variables: `call_id`, `caller_id`, `called_id`, `timestamp`, `call_direction`,
  `event_type`, `user_login`, `hangup_reason` (+ additive campaign/ACD when present).
- Missing `{{name}}` → literal `undefined`.

## Settings schema and F-030

| Item | Target |
| --- | --- |
| Schema | `UserSettings` **v13** nested `externalServices` (v12 string triggers migrate) |
| Default | Empty collections; inert |
| F-030 | Include config; exclude journal; portable authored headers/query; runtime refresh on import |
| Collection file | Versioned OmniCall JSON; regenerate IDs on import |

## Acceptance

Product gate: `external-services-plan/11-ACCEPTANCE.md` — closed 2026-07-30 with residual
hook-size debt noted (`useExternalServicesPanel`).

## Non-regression

- SIP-only bootstrap with empty External Services.
- No Call Engine, SIP state, OCP wire, SDK command, headset, or transfer behavior change.
- F-011 snapshots/events/capabilities expose no F-031 config or journal.
- Existing F-028/F-030 secret exclusions for SIP/OCP/SDK remain true.

## Open risks

See `external-services-plan/12-RISKS-NONGOALS.md`. Residual: local/private SSRF and
plain-HTTP credential exposure accepted in v1. Panel hook size debt cleared
(`useExternalServicesPanel` → `externalServicesPanel/*`).

## Review gate

- WU-12 complete. Next command: `/review` for F-031 External Services.
- SemVer/manifest bump requires explicit user authorization.
