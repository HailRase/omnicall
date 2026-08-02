# F-031 Execution Engine

- Purpose: execute matching outbound requests without coupling HTTP latency to product event paths.
- Inputs: immutable dispatch jobs, validated definitions, variables, active-profile lifecycle, and transport results.
- Outputs: bounded HTTP attempts, manual results, structured logs, and redacted journal entries.

## Components

- `ExternalServicesAutomationService` — non-async event subscriber, focus gate, matcher, immutable job creation.
- `ExternalServicesDispatchQueue` — FIFO scheduling, concurrency accounting, invalidation, and disposal.
- `ExecuteExternalServiceRequestUseCase` — template/build/transport/classify/journal pipeline.
- `RunExternalServiceRequestNowUseCase` — manual execution and UI result.
- `ExternalServicesRuntimeRegistry` — current profile key, settings revision, deleted/disabled IDs, and lifecycle generation.
- `OutboundHttpPort` — technology-neutral transport.

Candidate paths:

```txt
src/application/services/integration/external-services/ExternalServicesAutomationService.ts
src/application/services/integration/external-services/ExternalServicesDispatchQueue.ts
src/application/services/integration/external-services/ExternalServicesRuntimeRegistry.ts
src/application/use-cases/integration/ExecuteExternalServiceRequestUseCase.ts
src/application/use-cases/integration/RunExternalServiceRequestNowUseCase.ts
src/ports/integration/OutboundHttpPort.ts
src/adapters/mock/MockOutboundHttpAdapter.ts
src/adapters/platform/PreloadOutboundHttpAdapter.ts
src/shared/ipc/ExternalServicesHttpContract.ts
src/main/integration/registerExternalServicesHttpIpc.ts
```

## Enqueue contract

The event subscriber:

1. Ignores unsupported events.
2. Normalizes a trigger context and captures focus eligibility.
3. Reads the active profile/config snapshot through injected synchronous Application getters already maintained by composition.
4. Matches collections in persisted order and requests in collection order.
5. Requires collection enabled, request enabled, and trigger selected.
6. Creates one immutable job per match.
7. Calls `queue.enqueue(job)` and returns without awaiting transport or journal IO.

If snapshot acquisition fails, catch `unknown`, emit a structured warning, and return; telephony publication remains successful.

## FIFO concurrency algorithm

- Constant `EXTERNAL_SERVICES_MAX_CONCURRENCY = 3`.
- Queue stores pending jobs in insertion order and an in-flight map by job ID.
- `enqueue` appends and schedules `drain` via `queueMicrotask`.
- `drain` starts jobs while `inFlight.size < 3`.
- Each start moves one job from pending to in-flight before invoking the async executor.
- Completion/failure removes the job in `finally` and schedules another drain.
- Executor rejection is caught at the queue boundary, logged, and never becomes an unhandled rejection.
- No retry, priority, deduplication, persistence, offline replay, or response chaining exists.

Tests use a deferred mock port to prove the fourth job does not start until one of three settles and that start order is FIFO.

## Start-time validity

Before a pending job starts, validate against `ExternalServicesRuntimeRegistry`:

- Lifecycle generation still matches.
- Profile key still matches active profile.
- Collection and request still exist.
- Automatic jobs still have both enable flags on.
- Definition revision still matches the queued snapshot.

Invalid pending jobs are dropped with a debug-level reason and no HTTP/journal entry because no attempt began. Deleting or disabling while in flight does not abort the attempt; its immutable snapshot completes and journals normally.

## Profile switch and logout

- Increment lifecycle generation and remove all pending old-generation jobs.
- Do not abort already in-flight jobs solely for profile switch/logout.
- In-flight completion writes to the captured old profile journal bucket.
- New events cannot match until the new active profile settings snapshot is loaded.
- Composition disposal aborts transport only where the application is shutting down; classify as `aborted` if journal storage is still available.

## Request construction

- Resolve URL, enabled query rows, headers, and body from the same variable dictionary.
- `none` produces `body: null`.
- `json` sends substituted text and defaults `Content-Type: application/json` only when the user did not provide a case-insensitive content-type header.
- `x-www-form-urlencoded` composes encoded rows and defaults `Content-Type: application/x-www-form-urlencoded`.
- `raw` sends exact substituted text and adds no content type.
- User headers preserve order; transport adapter performs only API-required normalization.
- Body and URL size bounds are validated before IPC.

## Timeout and transport

- Every request passes literal `timeoutMs: 10_000`.
- Main creates one abort controller/timer per request and always clears resources in `finally`.
- Timeout maps to `timeout`; explicit app shutdown maps to `aborted`; DNS/connect/TLS/socket failures map to stable network codes.
- HTTP status is never thrown as transport failure.
- Response body is read with a hard byte cap greater than journal display cap, then truncated for result/journal; recommended transport cap is 1 MiB and journal cap is 16 KiB.
- Redirect count and body/header limits are fixed by ADR-0022 and tested.

## Result classification

```ts
type ExternalServiceExecutionResult =
  | Readonly<{
      kind: "success";
      status: number;
      durationMs: number;
      body: string;
      bodyTruncated: boolean;
      jsonValidity: "not_applicable" | "valid" | "invalid";
    }>
  | Readonly<{
      kind: "error";
      category: "http" | "network" | "timeout" | "aborted" | "validation";
      status: number | null;
      durationMs: number;
      body: string;
      bodyTruncated: boolean;
      code: string;
      jsonValidity: "not_applicable" | "valid" | "invalid";
    }>;
```

- `success`: transport response status 200–299.
- `http` error: response status outside 200–299; body remains present.
- Other categories have status `null` unless a response was received.
- Business JSON is never interpreted for success.
- Invalid substituted JSON sets warning metadata but remains sendable.

## Manual run

- UI submits collection ID, request ID, expected settings revision, and product snapshot facts at click time:
  - `userLogin` from `readExternalServicesProductStateFromStore` (SIP username, else OCP authenticated login);
  - optional `focusedCallContext.callId` when a line is focused.
- Composition may enrich focused-call parties from `ExternalServicesCallContextTracker` when that call was already tracked by automation.
- Use Case reloads/validates the active profile definition and rejects stale/deleted IDs.
- Manual run does not require collection/request enabled and does not require an automatic trigger switch.
- It uses `manual_run`, the same queue/concurrency/transport/journal pipeline, and returns a promise to the invoking UI.
- Always-available variables (`timestamp`, `event_type`, `user_login`) resolve on Send; call/campaign/acd tokens stay `undefined` outside their context.
- The UI promise is independent from telephony; closing the editor does not cancel an already started request.
- Multiple manual runs enqueue normally and do not bypass the concurrency limit.
- Journal truncates request and response bodies to 16 KiB; empty request body is omitted from History UI.

## Journal write

1. Capture start time immediately before port execution.
2. Classify result.
3. Redact request headers case-insensitively.
4. Truncate response body to 16 KiB without splitting a UTF-16 surrogate pair.
5. Append to the captured profile bucket.
6. Return manual result even if journal persistence fails, but log the journal failure with `catch (error: unknown)`.

Journal persistence failure must not convert a successful HTTP result into an HTTP error. Automatic execution has no caller; every outcome is observable through structured logs, and journal failure is a separate error log.

## Logging

Every start/completion/drop/error log includes:

- `featureId: "F-031"`
- `boundedContext: "Integration"`
- `operation`
- `correlationId`
- `profileKeyHash` or approved non-secret profile label
- `collectionId`
- `requestId`
- `eventType`
- `jobId`
- `durationMs` and status/category on completion

Never log URL query values, request/response bodies, raw headers, collection variables, tokens, cookies, OCP wire IDs, phone numbers, or credentials. Error messages are normalized before logging.

## Disposal

- Automation service stores and invokes event-bus unsubscriber.
- Queue exposes `dispose()` to reject new jobs, clear pending jobs, and await or detach current jobs according to shutdown contract.
- Main IPC registration returns a disposer and aborts outstanding controllers on app shutdown.
- Mock composition remains deterministic and requires no Electron globals.
