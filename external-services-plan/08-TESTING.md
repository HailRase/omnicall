# F-031 Testing Strategy

- Purpose: prove product behavior, isolation, profile safety, and non-regression at each WU.
- Inputs: pure Domain functions, mock ports, composition fixtures, renderer components, and typed IPC fixtures.
- Outputs: focused evidence per WU and full preflight evidence before feature closure.

## Domain unit tests

Candidate tests under `src/domain/integration/external-services/`:

- Settings parser: valid empty/full config, UUID uniqueness, invalid names/rows/method/body/trigger, no nested folders.
- Enable matcher: collection/request combinations and independent multi-trigger selection.
- Template resolver: repeated/missing/adjacent/case-sensitive/non-recursive placeholders and literal `undefined`.
- Request builder: existing URL query + table append, duplicate keys, encoding once, body modes, default content type.
- JSON validity: valid/invalid after substitution; invalid remains executable.
- Redaction: protected header names case-insensitive, duplicates, exact `***`.
- Truncation: below/at/above 16 KiB and surrogate-pair boundary.
- Collection document: round trip, wrong format/version, malformed IDs, unsupported fields.
- `UserSettings` v11→v12 migration, defaults, current validation, future version fail-closed.

## Application unit tests

- `ExternalServicesCallContextTracker.test.ts`: caller/called/direction/reason lifecycle and terminal cleanup.
- `ExternalServicesEventMapper.test.ts`: every stable code, ignored out-of-v1 facts, campaign clear reason mapping, safe ACD fields.
- `ExternalServicesFocusFilter.test.ts`: focused-only event snapshots, rapid two-line order, stale selection, terminal retention.
- `ExternalServicesDispatchQueue.test.ts`: FIFO, maximum three, settle/drain, rejected executor, dispose.
- `ExecuteExternalServiceRequestUseCase.test.ts`: all result categories, 2xx/non-2xx, body retained, journal failure separated.
- `RunExternalServiceRequestNowUseCase.test.ts`: disabled manual run, stale IDs/revision, queue sharing, `manual_run`.
- Save/query/import/export Use Cases: aggregate replacement, copy suffix/ID regeneration, unknown versions.
- Lifecycle: logout/profile switch cancels pending, in-flight finishes into captured profile.
- Logging: required fields present; URLs, headers, bodies, phone numbers, and token values absent.

Use `MockOutboundHttpAdapter`, in-memory journal/config repositories, deterministic clock, UUID generator, and deferred promises. No real network is required.

## Integration tests

- Publish supported event → mapper/focus/matcher → queue → mock HTTP invocation → journal.
- Event `publish()` returns while mock HTTP remains unresolved.
- Three in flight and fourth pending across automatic/manual jobs.
- Delete/disable after enqueue drops pending but allows in-flight completion.
- Profile A config/journal invisible in profile B.
- SIP-only bootstrap with empty defaults performs no HTTP.
- Campaign offered/accepted/rejected uses existing typed events without OCP gateway change.
- ACD context consumes `CallOcpContextResolved` and excludes raw wire IDs.
- F-030 import refreshes runtime matcher without app restart.
- Composition disposal unsubscribes and prevents later starts.

Candidate integration paths:

```txt
src/application/integration/ExternalServicesAutomation.integration.test.ts
src/infrastructure/bootstrap/createSoftphoneComposition.externalServices.test.ts
src/infrastructure/bootstrap/createRealAccountBootstrap.externalServices.test.ts
```

## Adapter and IPC tests

- Mock transport contract: response, network, timeout, and deferred completion.
- Shared IPC parser accepts exact valid shape and rejects malformed method/protocol/timeout/headers/body.
- Preload adapter maps typed IPC outcomes to `OutboundHttpPort`.
- Main handler enforces 10 seconds, redirect/size limits, abort cleanup, and status/body retention.
- Localhost/private test server is allowed in main integration tests when environment supports loopback.
- Journal file adapter validates, atomically appends, caps 100, isolates profile paths, and fails visibly on corrupt data.
- Collection file gateway covers save/open/cancel/size/error without arbitrary path exposure.

## Renderer tests

- Navigation child registration and pre-auth disabled reason.
- Collections empty/loading/error/list states.
- Fast collection/request toggles and enabled-request count.
- Smart navigation and focus restoration.
- Rename/duplicate/delete confirmations and copy suffix.
- Request editor method/URL/query/header/body/trigger inputs and validation.
- Run queued/success/non-2xx/network/timeout/invalid-JSON/truncated-body states.
- Journal empty/error/records, masked headers, body truncation indicator.
- All visible copy resolves through i18n; locale key parity.
- Critical Storybook surfaces render in light/dark.

## Non-regression targets

- Existing Call Engine and telephony event tests.
- `CallHistoryRecordingOrchestrationService` and missed/rejected outcome tests.
- `OcpTelephonyBridgeService`, `OcpSessionLifecycleService`, campaign projection, and ACD context tests.
- F-011 broker/snapshot/event tests, especially no added public fields/capabilities.
- F-023 profile repository/migration tests.
- F-030 `PreferencesExportDocument` and operator preference Use Case tests.
- Renderer Settings/OCP/SDK navigation and panel tests.

## Verification sequence

Run focused tests after each WU:

```powershell
npx vitest run <touched-test-files>
npm run typecheck
npm run lint
```

Run when relevant:

```powershell
npm run i18n:check
npm run ui:catalog
npm run registry:check
```

WU-12 release gate:

```powershell
npm run test
npm run typecheck
npm run lint
npm run i18n:check
npm run registry:check
npm run release:preflight
```

Use the repository’s `npm run preflight` only if present at execution time; do not invent a command. Any environment-dependent loopback/manual test is supplemental and cannot replace mock isolation tests.

## Performance evidence

- Unit test measures ordering, not wall-clock microbenchmarks.
- Integration test holds HTTP promises unresolved and proves event publication and a representative call command complete independently.
- Queue test records maximum observed concurrency exactly three.
- No test relies on arbitrary sleeps; use deferred promises/fake timers.

## Completion evidence

Each WU records:

- Focused command and pass/fail.
- New/updated test file paths.
- Registry/handoff acceptance evidence.
- Work-history path.
- Known external/manual verification still pending.
