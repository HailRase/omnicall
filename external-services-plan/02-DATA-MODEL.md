# F-031 Data Model

- Purpose: define immutable, validated configuration and journal contracts.
- Inputs: profile settings, editor drafts, imported JSON, trigger variables, and transport results.
- Outputs: current-schema `UserSettings`, executable request definitions, and safe journal records.

## Settings aggregate

Add `externalServices: ExternalServicesSettings` to `UserSettings` and bump `SETTINGS_SCHEMA_VERSION` from 11 to 12 in WU-01. Existing v11 data migrates additively to `EXTERNAL_SERVICES_DEFAULTS`; the F-030 bundle format remains independent.

```ts
type ExternalServicesSettings = Readonly<{
  collections: ReadonlyArray<ExternalServiceCollection>;
}>;

const EXTERNAL_SERVICES_DEFAULTS: ExternalServicesSettings = Object.freeze({
  collections: Object.freeze([]),
});
```

Create the model under `src/domain/integration/external-services/`, re-export it from `src/domain/index.ts`, and integrate it in:

- `src/domain/settings/UserSettings.ts`
- `src/domain/settings/validateUserSettings.ts`
- `src/domain/settings/migrateUserSettings.ts`
- `src/application/settings/migrateUserSettings.test.ts`
- `src/domain/settings/validateUserSettings.test.ts`

## Identity

```ts
type ExternalServiceCollectionId = string & {
  readonly __brand: "ExternalServiceCollectionId";
};

type ExternalServiceRequestId = string & {
  readonly __brand: "ExternalServiceRequestId";
};
```

- IDs are RFC 4122 UUID strings and never derive from names or array indexes.
- Domain parsers validate UUID syntax and uniqueness within one settings aggregate.
- Rename preserves IDs; duplicate/import-as-copy obtains new collection and request IDs.
- UUID generation occurs through `src/ports/shared/UuidGenerator.ts`; Domain receives generated strings and validates them.

## Collection

```ts
type ExternalServiceVariable = Readonly<{
  key: string;
  value: string;
}>;

type ExternalServiceCollection = Readonly<{
  id: ExternalServiceCollectionId;
  name: string;
  enabled: boolean;
  variables: ReadonlyArray<ExternalServiceVariable>;
  requests: ReadonlyArray<ExternalServiceRequest>;
}>;
```

Invariants:

- Trimmed non-empty collection name with a documented maximum length of 120 characters.
- Variable keys are trimmed, non-empty, case-sensitive, and unique within the collection.
- Empty values are valid; `base_url` is conventional, not reserved or automatically inserted.
- Mutation/normalize rejects duplicate keys and rows with an empty key plus a non-empty value; blank key+value draft rows are dropped.
- Authored keys that match system catalog names are allowed but overridden at run time (UI soft-warns).
- Request IDs are unique across the entire settings aggregate, not only a collection.
- There is no nested folder field or count limit.

## Request

```ts
type ExternalServiceHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type ExternalServiceBodyMode = "none" | "json" | "x-www-form-urlencoded" | "raw";

type ExternalServiceKeyValue = Readonly<{
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}>;

type ExternalServiceRequestBody = Readonly<{
  mode: ExternalServiceBodyMode;
  value: string;
}>;

type ExternalServiceRequest = Readonly<{
  id: ExternalServiceRequestId;
  name: string;
  enabled: boolean;
  method: ExternalServiceHttpMethod;
  url: string;
  query: ReadonlyArray<ExternalServiceKeyValue>;
  headers: ReadonlyArray<ExternalServiceKeyValue>;
  body: ExternalServiceRequestBody;
  triggers: ReadonlyArray<ExternalServiceEventType>;
}>;
```

Invariants:

- Name is trimmed, non-empty, and at most 120 characters.
- URL is non-empty but may contain templates; final URL protocol validation occurs after substitution.
- Key/value row IDs are UUIDs for stable editor rendering; disabled rows are persisted but not sent.
- Header/query keys are trimmed; enabled blank keys are validation errors.
- Trigger codes are unique and limited to automatic event codes; `manual_run` cannot be stored as a switch.
- `none` always produces `null` body; other modes retain exact authored text.
- GET/DELETE body behavior is allowed only if the selected main HTTP API supports it consistently; ADR-0022 must lock the final rule before WU-04. Recommended v1: permit bodies for all listed methods because the constructor is universal.

## Trigger and variable facts

```ts
type ExternalServiceAutomaticEventType =
  | "incoming_ringing"
  | "outgoing_connecting"
  | "call_answered"
  | "call_ended"
  | "call_rejected"
  | "call_missed"
  | "campaign_offered"
  | "campaign_accepted"
  | "campaign_rejected"
  | "acd_context_appeared";

type ExternalServiceEventType =
  | ExternalServiceAutomaticEventType
  | "manual_run";

type ExternalServiceTriggerContext = Readonly<{
  eventType: ExternalServiceEventType;
  occurredAt: string;
  profileKey: SettingsAccountKey;
  callId?: string;
  callerId?: string;
  calledId?: string;
  callDirection?: "inbound" | "outbound";
  userLogin?: string;
  hangupReason?: string;
  campaign?: Readonly<Record<string, string>>;
  acd?: Readonly<Record<string, string>>;
}>;
```

Campaign/ACD records are not accepted from raw wire payloads. WU-03 replaces the generic planning notation with explicit readonly fields discovered in existing typed projections before code is written.

## Dispatch job

```ts
type ExternalServiceDispatchJob = Readonly<{
  jobId: string;
  profileKey: SettingsAccountKey;
  collectionId: ExternalServiceCollectionId;
  requestId: ExternalServiceRequestId;
  definitionRevision: string;
  event: ExternalServiceTriggerContext;
  enqueuedAt: string;
  correlationId: CorrelationId;
  source: "automatic" | "manual";
}>;
```

- Jobs snapshot an immutable executable definition or a revision plus validated snapshot; they never re-read mutable UI state while in flight.
- Before starting a pending job, the queue checks that profile, collection, and request are still current/enabled.
- Manual jobs bypass trigger/enable matching only for the selected existing request; deletion/profile invalidation still prevents a pending start.

## Journal

```ts
type ExternalServiceJournalOutcome =
  | "http_success"
  | "http_error"
  | "network_error"
  | "timeout"
  | "aborted";

type ExternalServiceJournalEntry = Readonly<{
  id: string;
  profileKey: SettingsAccountKey;
  collectionId: ExternalServiceCollectionId;
  collectionName: string;
  requestId: ExternalServiceRequestId;
  requestName: string;
  eventType: ExternalServiceEventType;
  startedAt: string;
  durationMs: number;
  outcome: ExternalServiceJournalOutcome;
  status: number | null;
  requestUrl: string;
  requestHeaders: ReadonlyArray<ExternalServiceKeyValue>;
  responseBody: string;
  responseBodyTruncated: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  correlationId: CorrelationId;
}>;
```

- Persist only redacted request headers; protected values are `***`.
- Response body is UTF-8-normalized and capped at 16 KiB before persistence.
- Repository retains at most 100 records per profile.
- Journal names are snapshots so completed in-flight work remains understandable after rename/delete.

## Unknown-boundary validation

- `parseExternalServicesSettings(unknown)` fails with structured field paths; it does not coerce malformed current-version data.
- v11→v12 migration supplies empty defaults; later nested-format evolution requires an explicit parser/migrator.
- Collection import parser rejects wrong format/version, malformed UUIDs, duplicate IDs, unsupported methods/body modes/triggers, and oversized files.
- IPC request/response parsers validate protocol, method, header rows, body size, URL length, and timeout literal.
- No `any`, type assertion chains, deprecated APIs, or untyped event payloads are permitted.
