# F-031 Work Units

- Purpose: execute External Services in dependency order with one reviewable primary outcome per WU.
- Inputs: locked product spec, repository discovery, architecture canons, and prior-WU evidence.
- Outputs: isolated logic first, profile persistence, portable formats, usable UI, real event hardening, and closure gates.

## Dependency order

```txt
WU-00
  → WU-01 → WU-02 → WU-03 → WU-04 → WU-05
                                      ├→ WU-06 → WU-07
                                      └→ WU-08 → WU-09 → WU-10
  → all above → WU-11 → WU-13 → WU-12
```

Only one primary WU is executed per continuation prompt. Do not start UI before WU-04 is done.

---

## WU-00 — Registry, ADR, and handoff bootstrap

### Goal

Canonical product docs register F-031, its architecture decision, task track, and master handoff before behavior code exists.

### Why

Repository law forbids orphan implementation and non-obvious HTTP/event isolation without a recorded decision.

### How

1. Add F-031 to `docs/softphone/Feature-Registry.md`:
   - Name: External Services (Outbound HTTP Automations).
   - Context: Integration; related Settings.
   - Legacy IDs: `_none_ (new product feature)`.
   - Status: `in-progress`.
   - Inputs/outputs/acceptance/tests from `00-PRODUCT-SPEC.md` and `11-ACCEPTANCE.md`.
   - Explicitly separate F-011 inbound SDK and F-028 OCP.
2. Add `T-052` to `docs/softphone/TASK-QUEUE.md`:
   - Priority 1 unless user overrides.
   - Command `/logic` → `/ui`.
   - Status `claimed`.
   - Notes link this plan and WU-00…WU-12.
3. Add an F-031 active/planned line to `docs/softphone/STATUS.md`, branch `feature/external-services`, next WU-01.
4. Create `docs/softphone/handoffs/P14-External-Services-Master-Handoff.md` with WU/evidence table, non-goals, ADR gate, acceptance, and non-regression sections.
5. Create proposed `docs/softphone/adr/ADR-0022-external-services-http-isolation.md` from `ADR-0000-template.md`:
   - Main-process HTTP behind `OutboundHttpPort` and typed IPC.
   - Non-async post-commit subscriber and queue concurrency three.
   - Application-owned focus projection.
   - Profile pending cancellation/in-flight completion.
   - Local/private URL allowance and security bounds.
   - Redirect/protected-header behavior and byte limits.
6. Run `npm run registry:check`.
7. Update `PROGRESS.md`, then write work history.

### Boundaries

- No production source, settings schema, locale, version, CHANGELOG, manifest, SIP/OCP/SDK, or UI behavior changes.
- Do not rewrite existing unrelated modified docs.

### Evidence

- `npm run registry:check`.
- F-031/T-052/STATUS/handoff/ADR paths.
- `work-history/YYYY-MM-DD/external-services-wu00_HH-mm.md`.

### Done when

- [x] Registry check passes.
- [x] F-031, T-052, STATUS, master handoff, and ADR-0022 exist and agree.
- [x] ADR is accepted or explicitly proposed with WU-02 gate.
- [x] PROGRESS marks WU-00 done with evidence.

### Continue hint

`Implement WU-01 from external-services-plan/10-WORK-UNITS.md`

---

## WU-01 — Domain data model and settings migration

### Goal

Validated immutable External Services configuration persists as an empty-by-default `UserSettings` v12 slice.

### Why

All later matching, persistence, portability, and UI require a stable profile-scoped model before ports or HTTP exist.

### How

1. Create under `src/domain/integration/external-services/`:
   - `ExternalServiceIds.ts`
   - `ExternalServiceEventType.ts`
   - `ExternalServiceHttpDefinition.ts`
   - `ExternalServicesSettings.ts`
   - `parseExternalServicesSettings.ts`
   - focused unit tests and `index.ts`.
2. Implement readonly types and invariants from `02-DATA-MODEL.md`; no runtime APIs.
3. Add `externalServices` to `src/domain/settings/UserSettings.ts`; bump schema 11→12 and add defaults.
4. Update `src/domain/settings/validateUserSettings.ts` to parse the nested slice from `unknown`.
5. Update `src/domain/settings/migrateUserSettings.ts`:
   - Current v12 validates.
   - v3–v11 coerce with empty default or validated existing slice.
   - v0–v2 inherit empty defaults.
6. Update exports in `src/domain/index.ts`.
7. Update:
   - `src/domain/settings/validateUserSettings.test.ts`
   - `src/application/settings/migrateUserSettings.test.ts`
   - affected current-schema fixtures found by focused search.
8. Update F-031 registry/handoff schema evidence and PROGRESS; write work history.

### Boundaries

- No HTTP, event subscription, queue, ports, journal, facade, renderer, IPC, or F-030 format changes.
- Domain imports no Node/browser/Electron/React/Zustand/adapters/infrastructure.
- Do not add a secrets vault or nested folders.

### Evidence

- Focused Domain/migration tests.
- `npm run typecheck`, `npm run lint`, `npm run registry:check`.
- Dependency boundary test if current repository convention requires it.
- Work-history path.

### Done when

- [ ] Fresh settings contain empty External Services.
- [ ] v11 migrates to v12 without data loss.
- [ ] Malformed current config fails with structured errors.
- [ ] UUID/trigger/method/body invariants are covered.
- [ ] No technology dependency enters Domain.

### Continue hint

`Implement WU-02 from external-services-plan/10-WORK-UNITS.md`

---

## WU-02 — Ports and mock adapters

### Goal

Application-facing contracts and deterministic mocks exist for HTTP, journal, collection files, clock, and UUID generation.

### Why

Use Cases and engine tests must run without Electron, disk, or real network before real adapters are introduced.

### How

1. Create:
   - `src/ports/integration/OutboundHttpPort.ts`
   - `src/ports/integration/ExternalServicesJournalRepository.ts`
   - `src/ports/integration/ExternalServicesCollectionFileGateway.ts`
   - `src/ports/shared/UuidGenerator.ts` only if no equivalent exists.
2. Define discriminated request/result/error contracts from `01-ARCHITECTURE.md`; `timeoutMs` is literal 10000.
3. Create mocks:
   - `src/adapters/mock/MockOutboundHttpAdapter.ts`
   - `src/adapters/mock/InMemoryExternalServicesJournalRepository.ts`
   - `src/adapters/mock/MockExternalServicesCollectionFileGateway.ts`
   - deterministic UUID generator in test support.
4. Mock HTTP supports queued scripted outcomes, deferred promises, invocation capture, and observed max concurrency without `any`.
5. Journal mock enforces profile buckets, redacted-input invariant, and latest-100 cap.
6. Add contract tests beside mocks/ports and export through existing port/adapter barrels.
7. Finalize/accept ADR-0022 port ownership and limits before WU-04.
8. Update registry/handoff/PROGRESS and work history.

### Boundaries

- No real fetch/Electron IPC/filesystem, event matcher, queue, UI, or facade wiring.
- Ports expose no Call Engine, OCP, SDK, SIP, or response-command method.

### Evidence

- Mock/contract focused tests.
- `npm run typecheck`, `npm run lint`.
- ADR-0022 accepted with explicit transport limits.
- Work-history path.

### Done when

- [x] Every external effect required by later WUs has a narrow port.
- [x] Mocks can prove timeout/network/non-2xx/deferred behavior.
- [x] Journal isolation/cap contract is tested.
- [x] Ports contain no raw Electron/Node objects.

### Continue hint

`Implement WU-03 from external-services-plan/10-WORK-UNITS.md`

---

## WU-03 — Variable resolver and event matcher

### Goal

Pure functions normalize supported trigger facts, gate enablement/focus, resolve templates, and build transport-ready requests.

### Why

The most error-prone business rules must be exhaustive and infrastructure-free before asynchronous execution.

### How

1. Create Domain pure modules:
   - `src/domain/integration/external-services/matching/matchExternalServiceRequests.ts`
   - `src/domain/integration/external-services/template/resolveExternalServiceTemplate.ts`
   - `src/domain/integration/external-services/template/buildExternalServiceVariables.ts`
   - `src/domain/integration/external-services/http/buildExternalServiceHttpRequest.ts`
   - `src/domain/integration/external-services/security/redactExternalServiceHeaders.ts`
   - `src/domain/integration/external-services/security/truncateExternalServiceBody.ts`.
2. Create Application normalization modules:
   - `src/application/services/integration/external-services/ExternalServicesCallContextTracker.ts`
   - `src/application/services/integration/external-services/mapDomainEventToExternalServiceTrigger.ts`.
3. Implement exact source map from `03-EVENTS-AND-VARIABLES.md`.
4. Map campaign fields from `OperatorCampaignOffered` and accepted/rejected from `OperatorCampaignCleared`; map only safe ACD fields from `CallOcpContextResolved`.
5. Accept a `focusedAtEvent` input; WU-11 supplies the real focus projection. Tests use explicit values.
6. Implement variable precedence, literal `undefined`, non-recursive replacement, query encoding once, body modes, JSON validity warning, URL protocol validation.
7. Add exhaustive tests for all locked edge cases and ignored trigger types.
8. Update F-031 trigger/variable evidence, handoff, PROGRESS, and work history.

### Boundaries

- No HTTP call, event-bus subscription, repository, queue, timer, Electron, renderer, or OCP wire parsing.
- Do not expose ACD wire IDs or add new OCP events.
- Do not treat hold/re-invite as ringing.

### Evidence

- Focused matcher/template/mapper tests.
- `npm run typecheck`, `npm run lint`.
- Test proving `undefined`, multi-replace, invalid JSON warning, enable gates, and focus false.
- Work-history path.

### Done when

- [ ] Every v1 stable code maps exhaustively.
- [ ] Missed and rejected are separate.
- [ ] Campaign/ACD fields use existing typed facts only.
- [ ] Request construction is deterministic and pure.
- [ ] No unsupported event can match.

### Continue hint

`Implement WU-04 from external-services-plan/10-WORK-UNITS.md`

---

## WU-04 — Execution engine and manual run

### Goal

Synthetic normalized triggers and manual Run now execute through a concurrency-three queue, fixed timeout transport, result classification, and journal.

### Why

Logic/isolation must be production-ready before profile lifecycle and UI wiring.

### How

1. Create Application runtime files listed in `04-EXECUTION-ENGINE.md`:
   - queue, runtime registry, automation service, execute Use Case, manual Run Use Case, result view model.
2. Keep event subscriber callback non-async; enqueue via microtask and never return a transport promise to publishers.
3. Implement FIFO max-three, start-time revision/ID/enable validation, no retry, and robust `finally` drain.
4. Implement manual path through the same queue; allow disabled definitions, use `manual_run`, and return UI result.
5. Journal every started attempt after redaction/truncation; separate journal persistence failures from HTTP outcomes.
6. Add shared typed IPC contract:
   - `src/shared/ipc/ExternalServicesHttpContract.ts`.
7. Add real bridge:
   - `src/adapters/platform/PreloadOutboundHttpAdapter.ts`
   - minimal preload API in existing typed contract/index files
   - `src/main/integration/registerExternalServicesHttpIpc.ts`
   - register/dispose through current main bootstrap pattern.
8. Use a non-deprecated installed Node/Electron HTTP API after checking typings; enforce ADR-0022 redirect/size/timeout/header policy.
9. Wire engine dependencies into mock/real `createSoftphoneComposition` paths, but expose only a synthetic `handleCommittedEvent(event, snapshot)` test entry point; defer `useAccountBootstrap` post-store event binding and real focus hookup to WU-11.
10. Add queue/Use Case/IPC/main/composition tests, logging redaction tests, docs evidence, PROGRESS, and work history.

### Boundaries

- No modification to Call Engine, telephony Use Cases, OCP protocol, SDK broker, headset, or renderer components.
- No renderer fetch, raw IPC exposure, retries, offline queue, or response command bridge.
- Do not start automatic dispatch from real events yet.

### Evidence

- Queue max-three/FIFO/deferred tests.
- Event publication isolation test with unresolved mock HTTP.
- Manual success/non-2xx/network/timeout/invalid-JSON tests.
- IPC validation and transport bounds tests.
- `npm run typecheck`, `npm run lint`.
- Work-history path.

### Done when

- [x] Fourth request waits for one of three.
- [x] 10-second timeout is enforced by transport boundary.
- [x] 2xx/non-2xx/network outcomes preserve required body/status/timing.
- [x] Journal masks protected headers and caps body.
- [x] No automatic real event subscription exists yet.

### Continue hint

`Implement WU-05 from external-services-plan/10-WORK-UNITS.md`

---

## WU-05 — Profile persistence and lifecycle wiring

### Goal

Config and journal are isolated by account profile; logout/switch/import revisions safely invalidate pending work while in-flight attempts finish.

### Why

F-031 must obey F-023/F-024 profile semantics and never leak definitions/history across identities.

### How

1. Add file journal document/parser and paths:
   - `src/adapters/settings/externalServicesJournalDocument.ts`
   - `src/adapters/settings/FileExternalServicesJournalRepository.ts`
   - update `src/adapters/settings/profileStoragePaths.ts`.
2. Implement atomic append, latest-100 cap, missing-as-empty, corrupt fail-visible, and per-profile encoding.
3. Inject file journal in `src/infrastructure/bootstrap/createRealAccountBootstrap.ts`; in-memory journal in mock composition.
4. Add config save/query facade methods or dedicated Use Cases without direct UI repository access:
   - `SaveExternalServicesSettingsUseCase`
   - `QueryExternalServicesUseCase`.
5. Refresh `ExternalServicesRuntimeRegistry` after active settings load/save.
6. Integrate activation/logout/disposal through existing `AccountBootstrapFacade` lifecycle and `EndUserSessionUseCase` event handling:
   - cancel pending old generation;
   - allow in-flight completion to old journal;
   - disable matching until next active settings loaded.
7. Do not permit failed draft sign-in to promote candidate config.
8. Add profile A/B, logout, delete/disable in-flight, persistence corruption, and restart tests.
9. Update F-023/F-031 evidence, handoff/PROGRESS, and work history.

### Boundaries

- No UI, F-030 export, collection file format, real event trigger hookup, or profile-switch bypass.
- Do not delete config/journal on logout.
- Do not persist unredacted journal headers.

### Evidence

- File/in-memory journal tests.
- Profile lifecycle integration tests.
- Existing F-023/F-024 facade/profile tests.
- `npm run typecheck`, `npm run lint`.
- Work-history path.

### Done when

- [x] Profile A config/journal are invisible to B.
- [x] Logout clears pending and disables new dispatch.
- [x] In-flight old-profile attempt finishes into old-profile journal.
- [x] Restart restores config/journal safely.
- [x] Disabled/deleted pending IDs do not start.

### Continue hint

`Implement WU-06 from external-services-plan/10-WORK-UNITS.md`

---

## WU-06 — F-030 preferences export/import extension

### Goal

Operator preferences round trip includes External Services definitions and refreshes runtime state without exporting journal or existing protected product secrets.

### Why

Portable profile configuration is locked product behavior and must extend, not fork, F-030.

### How

1. Update `src/domain/settings/PreferencesExportDocument.ts` portability behavior/documentation for `UserSettings` v12.
2. Keep outer `PREFERENCES_EXPORT_FORMAT_VERSION = 1` unless implementation changes outer shape.
3. Ensure collection/request/header/query/body/variables/triggers/enables round trip.
4. Keep device resets, OCP linked reset, SIP/OCP/SDK secret exclusions, and forbidden property-name scan.
5. Exclude journal and Run results.
6. Update import facade completion to refresh F-031 runtime registry and renderer snapshot after successful save; failed imports leave both unchanged.
7. Update:
   - `src/domain/settings/PreferencesExportDocument.test.ts`
   - `src/application/use-cases/settings/OperatorPreferencesUseCases.test.ts`
   - relevant facade/renderer settings import tests.
8. Update `docs/softphone/P11-Operator-Preferences-Export-Design.md`, F-030/F-031 registry cross-evidence, handoff/PROGRESS, and work history.

### Boundaries

- No collection-specific import/export UI, journal export, secret vault, or outer format bump without need.
- Do not claim exported files contain no External Services credentials; authored values are portable by product decision.

### Evidence

- F-030 round-trip and fail-closed tests.
- Tests proving existing SIP/OCP/SDK secrets/device IDs remain excluded.
- Runtime refresh test.
- `npm run typecheck`, `npm run lint`, `npm run registry:check`.
- Work-history path.

### Done when

- [x] Definitions round trip exactly under active target profile.
- [x] Journal is absent.
- [x] Existing secret exclusions pass.
- [x] New runtime config applies without restart.
- [x] F-030 design doc matches implementation.

### Continue hint

`Implement WU-07 from external-services-plan/10-WORK-UNITS.md`

---

## WU-07 — Single-collection JSON import/export

### Goal

Users can export and import one lightweight versioned collection safely, with regenerated IDs and fail-closed validation.

### Why

Collection portability is required independently from full operator preferences and must not accept Postman scripts/contracts.

### How

1. Create `ExternalServiceCollectionDocument.ts` and tests per `06-PERSISTENCE-EXPORT.md`.
2. Implement export/import Use Cases and mock file gateway usage.
3. Add typed file IPC contract, preload adapter, and main open/save handlers using current F-030 file-gateway patterns.
4. Enforce JSON extension, UTF-8, 2 MiB maximum, cancel outcomes, and no arbitrary renderer filesystem path.
5. On import validate unknown document, regenerate all IDs, resolve deterministic `(copy N)` name, append to active profile settings, and refresh runtime registry.
6. Add facade methods; UI wiring remains WU-08.
7. Add round-trip, collision, unknown version, malformed, oversize, cancel, file error, and profile target tests.
8. Update registry/handoff/PROGRESS and work history.

### Boundaries

- No Postman v2.1, scripts, nested folders, full-profile/journal export, or UI implementation.
- No reuse of raw F-030 IPC payloads if it weakens format/size contracts.

### Evidence

- Domain/Application/IPC/file gateway tests.
- `npm run typecheck`, `npm run lint`.
- Work-history path.

### Done when

- [x] Valid collection round trips.
- [x] Imported IDs cannot collide.
- [x] Unknown versions fail without mutation.
- [x] Cancel is non-error and file failures are structured.
- [x] Active profile is the only import target.

### Continue hint

`Implement WU-08 from external-services-plan/10-WORK-UNITS.md`

---

## WU-08 — Navigation and collections UI

### Goal

Authenticated users can open External Services, manage collections/variables, see enabled counts, use fast toggles, and access Journal placement.

### Why

The first UI slice must expose safe configuration management on completed logic foundations.

### How

1. Read UI implementation and icons skills plus UI Kit canon.
2. Update `src/renderer/components/settings/settingsSections.ts` with the nested leaf/icon/test ID.
3. Synchronize `SETTINGS_NAV_SECTION_IDS` and authenticated gating in `src/application/projections/settings/deriveSettingsNavigationAvailability.ts`; update `deriveDefaultSettingsSection.ts` tests.
4. Extend routing/composition without altering SDK top-level placement:
   - `src/renderer/components/settings/panels/SettingsIntegrationsPanel.tsx`
   - `src/renderer/components/settings/SettingsPanel.tsx`
   - `src/renderer/shells/SoftphoneReadyShell.tsx`
   - `src/renderer/components/settings/SettingsSidebar.tsx` tests.
5. Add Application collection summary view models and renderer:
   - `useExternalServicesShell.ts`
   - `useExternalServicesActions.ts`
   - panel/collections/row/variables components from `05-UI-UX.md`.
6. Compose existing Button/Switch/Input/FormField/Dialog/AlertDialog/DropdownMenu/Badge/Table/Skeleton primitives.
7. Implement create/rename/delete/duplicate/import/export, enabled count, fast collection toggle, loading/empty/error/disabled states.
8. Add all `settings.integrations.externalServices.*` keys needed by this WU to ru/en/fr/de/bg.
9. Add tests and light/dark stories; run i18n/UI catalog checks.
10. Update I18N coverage, icon/catalog docs, F-016/F-031 registry evidence, handoff/PROGRESS, and work history.

### Boundaries

- No request detail editor/Run UI/journal records yet.
- UI imports no Domain, ports, adapters, repositories, raw IPC, Electron, or HTTP.
- Do not create duplicate generic UI primitives; stop and propose `/ui-kit` if one is missing.

### Evidence

- Navigation/pre-auth/panel/collection component tests.
- `npm run i18n:check`, `npm run ui:catalog`, `npm run typecheck`, `npm run lint`.
- Light/dark Storybook evidence.
- Work-history path.

### Done when

- [x] External Services appears under Integrations beside OCP.
- [x] SDK remains top-level.
- [x] Collection enabled count/toggle is visible without drill-down.
- [x] CRUD/duplicate/import/export intents work through facade.
- [x] All five locales and accessibility tests pass.

### Continue hint

`Implement WU-09 from external-services-plan/10-WORK-UNITS.md`

---

## WU-09 — Requests editor and Run now UI

### Goal

Users can manage flat requests, edit every HTTP/trigger field, and run a request with complete result/error feedback.

### Why

This is the primary user value and must remain a thin UI over tested Application behavior.

### How

1. Add request summaries/mutation facade APIs and renderer smart navigation.
2. Implement requests list with method/status Badges, fast Switch, enabled count context, rename/duplicate/delete.
3. Implement split editor components:
   - method/URL;
   - query table;
   - headers table;
   - body mode/editor;
   - independent trigger switches;
   - save/delete/unsaved confirmation.
4. Implement Run now through facade:
   - queued/running;
   - 2xx success;
   - non-2xx body;
   - network/DNS/timeout/abort/validation;
   - status when present;
   - duration;
   - truncation;
   - invalid JSON warning while still executing.
5. Add i18n keys in all five locales, component tests, hook tests, and light/dark stories.
6. Preserve focus on navigation/dialog close and keyboard operation.
7. Update I18N coverage, registry/handoff/PROGRESS, and work history.

### Boundaries

- No event integration hardening or journal list UI.
- Components never build requests, classify success, resolve templates, or call HTTP.
- No Auth tab, scripts, retries, nested folders, or response actions.

### Evidence

- Requests/editor/Run tests for every locked state.
- `npm run i18n:check`, `npm run ui:catalog`, `npm run typecheck`, `npm run lint`.
- Storybook light/dark evidence.
- Work-history path.

### Done when

- [x] All methods/body modes/query/header/trigger fields are editable.
- [x] Request row enabled state is visible and fast-toggleable.
- [x] Manual Run displays required status/timing/body/error.
- [x] Invalid substituted JSON warns but sends.
- [x] All visible copy is localized.

### Continue hint

`Implement WU-10 from external-services-plan/10-WORK-UNITS.md`

---

## WU-10 — Journal UI

### Goal

Collections root displays the latest 100 attempt records at the bottom with safe expandable diagnostics.

### Why

Users need observable automation outcomes without exposing protected headers or enabling replay/control.

### How

1. Add journal query/refresh Application view models and facade methods.
2. Implement `ExternalServicesJournal.tsx` using Accordion/Table/Badge/Alert/Skeleton as appropriate.
3. Render newest first: timestamp, collection/request snapshots, event, outcome, status, duration.
4. Expanded detail shows URL, already-redacted headers, error, body, and truncation marker as text.
5. Implement empty/loading/error/retry states.
6. Add all journal i18n keys in five locales and tests for masking/truncation/cap/error.
7. Add light/dark story with fixture data containing `***`, never real secrets.
8. Update I18N coverage, registry/handoff/PROGRESS, and work history.

### Boundaries

- No rerun, response command, delete-history, full PII masking, or config mutation from journal.
- UI never performs redaction as the security boundary; it only displays safe view models.

### Evidence

- Journal component/hook/view-model tests.
- `npm run i18n:check`, `npm run ui:catalog`, `npm run typecheck`, `npm run lint`.
- Work-history path.

### Done when

- [x] Journal sits at collections-list bottom.
- [x] At most 100 entries display newest first.
- [x] Protected header values show only `***`.
- [x] Large body truncation is visible.
- [x] Error/retry and accessibility states pass.

### Continue hint

`Implement WU-11 from external-services-plan/10-WORK-UNITS.md`

---

## WU-11 — Real event integration and focus hardening

### Goal

All v1 automatic triggers fire from real committed events under one Application-owned focused-line policy, with proven call-path non-interference.

### Why

Real event wiring is intentionally last so stable logic/UI cannot compromise call behavior and focus races are solved explicitly.

### How

1. Create `src/application/projections/telephony/callFocusProjection.ts` and tests:
   - automatic incoming/outgoing focus;
   - explicit selected line intent;
   - alive/stale fallback;
   - terminal focus snapshot.
2. Reduce the focus projection in `src/renderer/stores/useAccountBootstrapStore.ts` during the same committed event update as call projections.
3. Replace conflicting local focus ownership in `useCallFeatureShell.ts` with projection consumption/explicit selection intent while preserving call-control and headset behavior.
4. Create `src/application/integration/readExternalServicesProductStateFromStore.ts` using a structural typed snapshot, with no Zustand import.
5. Create `src/renderer/bootstrap/bindExternalServicesAutomation.ts`; register it in `src/renderer/hooks/useAccountBootstrap.ts` after `bindFacade(facade)`, mirroring the proven post-commit ordering of `bindSdkBrokerSession`.
6. Ensure the binder callback is non-async and invokes `ExternalServicesAutomationService.handleCommittedEvent(event, snapshot)` without awaiting queue work; record ordering in ADR-0022/handoff.
7. Wire exact source facts from `03-EVENTS-AND-VARIABLES.md`; no raw OCP messages.
8. Cache call/campaign context, suppress duplicates/re-invite false positives, and preserve missed/rejected separation.
9. Add multi-call integration tests:
   - focused/non-focused ringing/answer/end;
   - two rapid incoming lines;
   - selected held versus active;
   - outgoing connecting;
   - rejected and missed;
   - campaign offer/accept/reject;
   - ACD appeared focused only.
10. Add non-interference test with unresolved HTTP while representative call event publication/command completes.
11. Run focused SIP/OCP/SDK/headset regressions and update F-028 consume-only evidence.
12. Update registry/handoff/ADR/PROGRESS and work history.

### Boundaries

- No new OCP wire fields/events, SDK capabilities, Call Engine dependency, transfer triggers, or changed telephony state transitions.
- No HTTP await in publisher/subscriber/call Use Cases.
- Do not reuse headset focus as F-031 SSoT; both consume the shared Application focus.

### Evidence

- Full trigger/focus/multi-call integration tests.
- Existing call-control/headset/OCP campaign/ACD/SDK mapper tests.
- `npm run typecheck`, `npm run lint`.
- Captured proof that HTTP unresolved state does not delay event publication.
- Work-history path.

### Done when

- [ ] Every v1 trigger fires from its real typed source.
- [ ] Every call trigger is focused-only at event time.
- [ ] Two rapid incoming scenarios are deterministic.
- [ ] Re-invite/hold cannot create false ringing.
- [ ] Campaign/ACD add no OCP wire surface.
- [ ] Call path has no latency/failure coupling.

### Continue hint

`Implement WU-13 from external-services-plan/10-WORK-UNITS.md`

---

## WU-13 — Per-trigger delay, queue monitor, logout warning

### Goal

Automatic trigger bindings optionally delay dispatch by 0–180 seconds while Queue exposes and cancels waiting snapshots.

### How

1. Migrate triggers into `{ eventType, delaySeconds }` bindings in settings v13 without losing enabled codes.
2. Capture the dispatch snapshot at event time, schedule it in Application, and revalidate lifecycle/revision before FIFO enqueue.
3. Cancel waiting work on logout, revision, profile generation, dispose, or Queue intent without a journal entry.
4. Add inline trigger delay, Queue tab, logout warning, compact journal names, five-locale copy, tests, ADR-0023, and evidence.

### Boundaries

- No durable queue, retry, sleep recovery, call-end cancellation, raw renderer HTTP, or in-flight abort.

### Done when

- [x] Delay zero preserves immediate dispatch and manual run ignores delay.
- [x] Waiting Queue rows can be cancelled and logout warns only when rows exist.
- [x] Snapshot-at-event, lifecycle cancellation, migration, and UI states are tested.

### Continue hint

`Run /preflight for F-031, then implement WU-12`

---

## WU-12 — Documentation close, preflight, and release decision

### Goal

All acceptance/non-regression gates pass, canonical docs match implementation, and release handling follows explicit user authorization.

### Why

F-031 is not complete while evidence, i18n, profile portability, isolation, or canonical product truth remains open.

### How

1. Audit every checkbox in `11-ACCEPTANCE.md` and every WU evidence row.
2. Run focused tests first, then:
   - `npm run test`
   - `npm run typecheck`
   - `npm run lint`
   - `npm run i18n:check`
   - `npm run ui:catalog`
   - `npm run registry:check`
   - `npm run release:preflight`.
3. Fix only F-031-caused failures; report unrelated pre-existing failures precisely.
4. Synchronize:
   - F-031 registry → `implemented` only after all gates pass;
   - F-030 cross-evidence;
   - STATUS;
   - TASK-QUEUE T-052 → done;
   - master handoff final evidence;
   - ADR-0022 accepted;
   - I18N coverage;
   - F-030 design;
   - plan PROGRESS all done.
5. Decide SemVer:
   - If the feature gate is closed and user is shipping, MINOR bump from current version per `version-release.mdc`, update CHANGELOG, run `npm run release:sync-manifest`.
   - If not cutting a distribution release, document the pending release action and do not tag/build/push.
6. Never commit/tag/push unless explicitly requested.
7. Write final work history and suggest `/review`.

### Boundaries

- No unrelated refactors or backlog work.
- No false implemented status while tests/manual requirements fail.
- No installer build, commit, tag, or push without explicit request.

### Evidence

- Full command results.
- Final canonical doc paths and handoff gate.
- Version/manifest evidence only if applicable.
- `work-history/YYYY-MM-DD/external-services-close_HH-mm.md`.

### Done when

- [x] `11-ACCEPTANCE.md` is fully satisfied or explicit blockers are recorded.
- [x] Full automated gates pass.
- [x] Registry/STATUS/TASK-QUEUE/handoff/I18N/F-030/ADR/PROGRESS agree.
- [x] SemVer decision follows release rule and user authorization.
- [x] `/review` is the next recommended command.

### Continue hint

`Run /review for F-031 External Services`
