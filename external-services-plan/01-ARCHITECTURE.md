# F-031 Architecture

- Purpose: define the isolated vertical slice for outbound HTTP automations.
- Inputs: typed committed Domain events, active-profile settings, UI commands, and HTTP responses.
- Outputs: queued dispatch attempts, journal projections, and profile-scoped configuration updates.

## Decision summary

- Primary context: Integration owns automation definitions, trigger matching, templates, execution policy, and journal semantics.
- Supporting context: Settings owns profile binding, `UserSettings` migration, and F-030 portability.
- Telephony and Operator contexts publish existing facts only; F-031 consumes them without changing their state machines or wire protocols.
- HTTP transport executes in Electron main behind a typed renderer adapter and `OutboundHttpPort`.
- Application owns event subscription, focus filtering, queueing, orchestration, and UI-facing facade methods.
- Domain owns immutable configuration value types and pure validation/matching/template policies; it imports no runtime technology.
- ADR-0022 is required before runtime code to record cross-process HTTP ownership and non-blocking post-commit event consumption.

## Layer map

```txt
Renderer UI
  → ExternalServices actions/shell hooks
  → AccountBootstrapFacade methods / Use Cases
  → ExternalServicesAutomationService
  → OutboundHttpPort + ExternalServicesJournalRepository
  → PreloadOutboundHttpAdapter / FileExternalServicesJournalRepository
  → typed IPC
  → Electron main HTTP handler
```

Committed Domain/Application events reach F-031 through a renderer-bootstrap binder registered after `bindFacade` commits projections to Zustand, following `bindSdkBrokerSession`. The binder reads a typed Application snapshot and passes immutable input to `ExternalServicesAutomationService`; queue processing runs on a separate promise chain and is never awaited by the publisher.

## Domain model ownership

Create `src/domain/integration/external-services/` for:

- Branded `ExternalServiceCollectionId`, `ExternalServiceRequestId`, and journal entry IDs.
- `ExternalServiceCollection`, `ExternalServiceRequest`, method/body/trigger unions, collection variables, and defaults.
- Parsers from `unknown`, invariants, enablement policy, stable trigger codes, template resolution, and redaction/truncation policies.
- Versioned single-collection transfer document.

Expose `ExternalServicesSettings` as a readonly nested field of `UserSettings`. Integration owns its shape; Settings aggregates and persists it. Do not create an independent config repository in v1 because `SettingsRepository` already provides atomic profile-scoped aggregate persistence and F-030 round trips.

## Ports

### `src/ports/integration/OutboundHttpPort.ts`

```ts
type OutboundHttpRequest = Readonly<{
  method: ExternalServiceHttpMethod;
  url: string;
  headers: ReadonlyArray<ExternalServiceKeyValue>;
  body: string | null;
  timeoutMs: 10000;
  correlationId: CorrelationId;
}>;

type OutboundHttpResult =
  | Readonly<{ kind: "response"; status: number; durationMs: number; body: string }>
  | Readonly<{ kind: "network_error"; code: OutboundHttpErrorCode; durationMs: number; message: string }>;
```

The port returns transport facts only; HTTP 2xx classification stays in Domain/Application policy. It has no call-control callback.

### `src/ports/integration/ExternalServicesJournalRepository.ts`

- `list(profileKey, limit)` returns newest-first immutable records.
- `append(profileKey, entry)` atomically caps storage at 100.
- `clear(profileKey)` is optional only if the locked UI includes a clear action during WU-10; otherwise omit it.
- Adapter validates persisted `unknown` data and never returns unredacted protected headers.

### `src/ports/integration/ExternalServicesCollectionFileGateway.ts`

- Opens save/import dialogs for one versioned collection JSON document.
- Real adapter uses typed preload IPC; mock adapter supports deterministic Use Case tests.
- File payload limits and extension allowlists are enforced at the IPC boundary.

## Application services and Use Cases

- `ExternalServicesAutomationService`: subscribes/unsubscribes, converts supported events to typed trigger facts, applies the focused-line gate, snapshots active profile/config, matches enabled definitions, and enqueues immutable jobs.
- `ExternalServicesDispatchQueue`: FIFO pending jobs, maximum three in flight, profile/request invalidation, and no retries.
- `ExecuteExternalServiceRequestUseCase`: resolves variables, composes query/body/headers, calls `OutboundHttpPort`, classifies result, redacts/truncates, appends journal, and returns a Run result when requested.
- `RunExternalServiceRequestNowUseCase`: creates `manual_run` variables from active profile identity plus optional current focused-call context and delegates to execute (UI supplies snapshot facts via `buildExternalServicesManualRunFacts`; composition may enrich call parties from the tracker).
- `SaveExternalServicesSettingsUseCase`: validates and replaces only the nested settings slice through `SettingsRepository`.
- `QueryExternalServicesUseCase`: returns collection rows, enabled counts, request rows, and journal records as UI-safe Application view models.
- Import/export Use Cases own collection transfer parsing, UUID collision handling, and `(copy)` naming.

Keep queue, trigger mapper, execute, lifecycle, and facade wiring in separate files under 300 lines; functions remain below 30 lines.

## Event subscription and isolation

- Construct the automation service and ports in `src/infrastructure/bootstrap/createSoftphoneComposition.ts`; provide real dependencies through `createRealAccountBootstrap.ts`.
- Add `src/renderer/bootstrap/bindExternalServicesAutomation.ts` and register it in `src/renderer/hooks/useAccountBootstrap.ts` after `bindFacade(facade)`, so every callback observes committed call/OCP/focus projections.
- The renderer binder contains no matching or HTTP rules; it maps the store through a typed `readExternalServicesProductStateFromStore` Application function and forwards event + snapshot.
- Start only after settings/profile repositories, event bus, and store binding are ready; dispose the binder before composition teardown.
- Existing call Use Cases, Call Engine, OCP handlers, and SDK broker publish as before and receive no F-031 dependency.
- Subscriber callbacks must not be `async`; they enqueue and return.
- Worker failures are caught as `unknown`, logged structurally, and journaled when a job identity exists.
- Bootstrap without configured collections creates an inert subscriber and preserves SIP-only behavior.

## Electron HTTP boundary

- Add a shared `ExternalServicesHttpContract` with narrow request/response/error shapes and runtime validators.
- Preload exposes one minimal method such as `executeExternalServiceHttp(request)`; raw `ipcRenderer`, Node globals, redirect hooks, and call APIs remain hidden.
- Main registers one F-031 handler and uses the current non-deprecated Node/Electron HTTP facility selected during WU-04 after checking installed typings.
- Main accepts only `http:`/`https:`, enforces 10 seconds, bounded request/response sizes, abort cleanup, and typed errors.
- Localhost/private destinations are deliberately allowed; no v1 SSRF denylist.
- Redirect policy must be explicit and bounded in ADR-0022; recommended v1 is follow up to five redirects while reapplying timeout and response limits.

## UI projection

- Zustand receives a read-model slice only: selected collection/request IDs, loading/error status, collection summaries, request summaries, Run result, and journal summaries.
- Store reducers cannot save settings, run HTTP, import files, or evaluate trigger rules.
- Shell hooks call facade methods and refresh the projection after mutations.
- Presentational components receive translated labels, disabled reasons, models, and callbacks only.

## Chosen and rejected alternatives

- Chosen: main-process HTTP through a typed port/IPC adapter, avoiding renderer CORS and keeping transport outside UI.
- Existing `OcpProxyAuthenticateHttpAdapter` and `FetchUpdateMetadataAdapter` use renderer `fetch`, but they target controlled endpoints; rejected for F-031 because arbitrary user URLs encounter CORS and expand the renderer network trust boundary.
- Chosen: post-store renderer-bootstrap event binding, because `InMemoryDomainEventBus` is synchronous and subscription order determines whether projections are committed.
- Rejected: direct HTTP from telephony Use Cases, because latency/failure would couple calls to integrations.
- Rejected: a second event bus or Call Engine, because F-031 is an optional consumer of committed facts.
- Rejected: independent config files/repository, because it would duplicate `UserSettings` profile atomicity and F-030 portability.
- Rejected: response command router, because responses are observation-only by product law.

## Boundary impact

- New inward contracts: outbound HTTP, journal persistence, and collection file transfer ports.
- New adapters/infrastructure: mock ports, file journal, preload adapters, shared IPC contracts, main HTTP/file handlers.
- Existing contexts remain producers; no new imports from Telephony/Operator into Infrastructure.
- No F-011 protocol/capability change and no F-028 OCP wire change.
- No legacy LF mapping exists; F-031 is a new product feature.

## Required architecture tests

- Dependency test proves Domain has no Electron, React, Zustand, Node, browser, adapters, or infrastructure imports.
- Event integration test proves publication completes before mocked HTTP resolves.
- Queue test proves at most three concurrent calls and FIFO start order.
- Composition test proves zero configured collections causes no outbound calls.
- IPC contract tests reject malformed payloads/protocols and bound body sizes.
- Non-interference tests keep existing SIP/OCP/SDK composition paths green.
