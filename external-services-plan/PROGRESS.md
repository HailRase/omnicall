# F-031 External Services Progress

- Purpose: machine-readable execution state for the F-031 work-unit sequence.
- Inputs: completion evidence from `10-WORK-UNITS.md`.
- Outputs: the next executable WU and its review gate.

| WU | Title | Status | Last update | Evidence |
| --- | --- | --- | --- | --- |
| WU-00 | Registry, ADR, and handoff bootstrap | done | 2026-07-29 | F-031 in Feature-Registry; T-052 claimed; STATUS F-031 block; handoff `docs/softphone/handoffs/P14-External-Services-Master-Handoff.md`; ADR-0022 Proposed; `npm run registry:check` PASS |
| WU-01 | Domain data model and settings migration | done | 2026-07-29 | External Services domain model/parser; `UserSettings` v12 migration; focused tests, typecheck, targeted lint, registry check PASS; global lint blocked by pre-existing SDK dist files |
| WU-02 | Ports and mock adapters | done | 2026-07-29 | HTTP/journal/collection-file, clock and UUID ports; deterministic mocks and contract tests; `npm run typecheck` PASS; ADR-0022 Accepted |
| WU-03 | Variable resolver and event matcher | done | 2026-07-29 | Pure matcher/template/request/security policies; typed call/campaign/ACD mapper and tracker; focused tests + typecheck PASS |
| WU-04 | Execution engine and manual run | done | 2026-07-29 | Queue/registry/automation/execute/manual Use Cases; typed IPC + preload + main HTTP (redirects≤5, 10s, 1 MiB); composition synthetic event entry; focused tests + typecheck PASS |
| WU-05 | Profile persistence and lifecycle wiring | done | 2026-07-29 | File journal document/parser + `FileExternalServicesJournalRepository`; Save/Query Use Cases; facade activation/logout/dispose; profile A/B + logout in-flight + corrupt + failed-draft tests; typecheck PASS |
| WU-06 | F-030 preferences export/import extension | done | 2026-07-29 | PreferencesExportDocument ES round-trip; OperatorPreferences Use Cases; facade `replaceActiveSettings` after import; `OperatorPreferencesExternalServices.integration.test.ts`; P11 design + F-030/F-031 registry; focused tests + typecheck/lint/registry PASS |
| WU-07 | Collection JSON import/export | done | 2026-07-29 | Domain `ExternalServiceCollectionDocument`; Export/Import Use Cases; typed collection-file IPC + preload + main (JSON, UTF-8, 2 MiB); facade dialog methods; round-trip/collision/cancel/fail-closed tests; `npm run typecheck` PASS |
| WU-08 | Navigation and collections UI | done | 2026-07-30 | Settings leaf + Postman-like COLLECTIONS sidebar tree (polish); Application summaries/mutations; shell/actions/panel hooks; i18n ru/en/fr/de/bg; tests + light/dark stories; `typecheck`/`i18n:check`/`ui:catalog` PASS |
| WU-09 | Requests editor and Run now UI | done | 2026-07-30 | Request workspace URL bar + Params/Headers/Body/Triggers tabs + Send/Response (polish); mutation hook; unsaved-discard; ru/en/fr/de/bg i18n; light/dark stories; focused tests PASS |
| WU-10 | Journal UI | done | 2026-07-30 | Journal panel VM + History tab in response pane (cap 100, redacted headers, truncation); empty/loading/error/retry; ru/en/fr/de/bg i18n; projection/component tests + light/dark stories PASS |
| WU-11 | Real event integration hardening | pending | 2026-07-29 | — |
| WU-12 | Documentation close, preflight, and release decision | pending | 2026-07-29 | — |

## State rules

- Allowed statuses: `pending`, `in_progress`, `done`, `blocked`.
- Exactly one primary WU may be `in_progress`.
- Mark `done` only after its tests, canonical docs, and work-history evidence exist.
- Record blockers in the Evidence column and stop before dependent WUs.
- Current next WU: `WU-11`.
