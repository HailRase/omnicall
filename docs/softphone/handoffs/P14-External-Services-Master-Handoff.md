# P14 External Services (F-031) — Master Handoff

## Status

| Field | Value |
| --- | --- |
| Feature | F-031 External Services (Outbound HTTP Automations) |
| Legacy | `_none_` (new product feature; no LF parity) |
| Phase | P14 External Services |
| Feature status | **in-progress** (WU-10 journal UI complete 2026-07-29) |
| Branch | `feature/external-services` |
| Task | T-052 claimed (`/logic` → `/ui`) |
| Plan | `external-services-plan/` |
| ADR | [ADR-0022](../adr/ADR-0022-external-services-http-isolation.md) — **Accepted** |
| Next | **WU-11** real event integration and focus hardening |

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
| WU-01 | Domain data model and settings migration | **done** | Immutable parser/types; `UserSettings` v12; focused tests, typecheck, targeted lint, registry PASS; global lint blocked by pre-existing SDK dist files |
| WU-02 | Ports and mock adapters | **done** | HTTP/journal/collection-file, clock and UUID ports; deterministic mocks; focused contract tests; ADR-0022 Accepted |
| WU-03 | Variable resolver and event matcher | **done** | Pure matcher/template/request/security policies; typed call/campaign/ACD mapper and tracker; focused tests + typecheck PASS |
| WU-04 | Execution engine and manual run | **done** | Queue max-3/FIFO; execute/manual Use Cases; journal redaction; typed IPC + main `fetch` redirects≤5/1 MiB/10s; composition synthetic `handleExternalServicesCommittedEvent`; focused tests + typecheck PASS |
| WU-05 | Profile persistence and lifecycle wiring | **done** | File journal document + `FileExternalServicesJournalRepository`; Save/Query Use Cases; `AccountSessionActivated`/`UserSessionEnded` lifecycle; profile A/B + in-flight + corrupt fail-visible tests; typecheck PASS |
| WU-06 | F-030 preferences export/import extension | **done** | External Services nested round-trip in `omnicall.preferences` v1; journal excluded; facade `replaceActiveSettings` after import; Preferences/UseCase/runtime refresh tests; `P11-Operator-Preferences-Export-Design.md` synced |
| WU-07 | Collection JSON import/export | **done** | Domain document + Export/Import Use Cases; typed IPC/preload/main collection file gateway (2 MiB); facade import/export; round-trip/collision/cancel/fail-closed tests; typecheck PASS |
| WU-08 | Navigation and collections UI | **done** | Integrations leaf beside OCP; SDK top-level preserved; collection summaries/CRUD/import/export/variables; journal placement; i18n five locales; nav/panel/component tests + light/dark stories |
| WU-09 | Requests editor and Run now UI | **done** | Request list badges/toggle + editor fields, key/value rows, triggers, save/delete/discard; facade Run now queued/running/result feedback; five locales; focused component/mutation tests and light/dark stories |
| WU-10 | Journal UI | **done** | Journal VM + hook; accordion diagnostics (*** headers, truncation, cap 100); empty/loading/error/retry; five locales; projection/component tests + light/dark stories; typecheck/i18n/ui:catalog PASS |
| WU-11 | Real event integration hardening | pending | — |
| WU-12 | Documentation close, preflight, release decision | pending | — |

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

**Gate:** Accepted at WU-02 port freeze; WU-04 implemented ADR HTTP limits/redirect/header strip in main.
Do not start UI before WU-04 is done (WU-04 complete — UI begins at WU-08 after WU-05…WU-07).

## Runtime composition (target)

```txt
UI → Facade / Use Cases → ExternalServicesAutomationService
  → OutboundHttpPort + JournalRepository
  → Preload adapter → typed IPC → Electron main HTTP
```

- Compose in softphone composition / real account bootstrap via `createExternalServicesCompositionForBootstrap`.
- Synthetic test entry: `AccountBootstrapFacade.handleExternalServicesCommittedEvent` / `runExternalServiceRequestNow`.
- Bind `bindExternalServicesAutomation` after `bindFacade` (post-commit projections) — **WU-11**.
- Dispose composition in facade `dispose()`; binder disposal lands with WU-11.
- Zero collections → inert matching; SIP-only preserved.

## Trigger / variable / focus matrix

Stable automatic codes: `incoming_ringing`, `outgoing_connecting`, `call_answered`,
`call_ended`, `call_rejected`, `call_missed`, `campaign_offered`, `campaign_accepted`,
`campaign_rejected`, `acd_context_appeared`. Manual: `manual_run`.

- Focus gate: every call-related trigger requires focused call at evaluation time.
- Base variables: `call_id`, `caller_id`, `called_id`, `timestamp`, `call_direction`,
  `event_type`, `user_login`, `hangup_reason` (+ additive campaign/ACD when present).
- Missing `{{name}}` → literal `undefined`.
- WU-03 maps campaign offer/accept/reject and safe ACD queue/phase/event fields; WU-11 wires the post-commit focus projection.

## Settings schema and F-030

| Item | Target |
| --- | --- |
| Schema | `UserSettings` **v12** nested `externalServices` (WU-01 done) |
| Default | Empty collections; inert |
| F-030 | Include config; exclude journal; disclose portable credentials in authored headers/query; runtime refresh on successful import (WU-06 done) |
| Collection file | Versioned OmniCall JSON; regenerate IDs on import (WU-07 done) |

## Acceptance

Product/architecture/security gate: `external-services-plan/11-ACCEPTANCE.md`.
F-031 registry status becomes `implemented` only when WU-12 acceptance passes.

## Non-regression

- SIP-only bootstrap with empty External Services.
- No Call Engine, SIP state, OCP wire, SDK command, headset, or transfer behavior change.
- F-011 snapshots/events/capabilities expose no F-031 config or journal.
- Existing F-028/F-030 secret exclusions for SIP/OCP/SDK remain true.

## Open risks

See `external-services-plan/12-RISKS-NONGOALS.md`. Residual: local/private SSRF and
plain-HTTP credential exposure accepted in v1 per product law.

## Review gate

- After each WU: update this table + `PROGRESS.md` + work-history; keep registry truthful.
- Stop for `/preflight` or `/review` when a WU Done-when checklist requires it.
- Continue hint after WU-10: `Implement WU-11 from external-services-plan/10-WORK-UNITS.md`
