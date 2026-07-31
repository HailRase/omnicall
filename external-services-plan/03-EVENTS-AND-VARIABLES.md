# F-031 Events and Variables

- Purpose: map stable webhook triggers to existing typed facts and define deterministic templating.
- Inputs: committed Domain events, call-focus projection, active profile identity, and collection variables.
- Outputs: normalized trigger contexts and substituted HTTP definitions.

## Concrete event map

| External code | Source fact | Current path | Mapping rule |
| --- | --- | --- | --- |
| `incoming_ringing` | `IncomingCallRingingStarted` | `src/domain/telephony/events/callEvents.ts` | Emit once for its `callId`; this fact is created by `IncomingCallOrchestrator`, so re-invite/hold events do not remap to ringing. |
| `outgoing_connecting` | `OutgoingCallRequested` | `src/domain/telephony/events/callEvents.ts` | Emit when Call Engine accepts the outgoing intent and publishes the requested fact. |
| `call_answered` | `CallAnswered` | same | Emit for inbound or outbound using the tracked call direction/parties. |
| `call_ended` | `CallEnded` | same | Emit for every final ended fact; derive reason from tracked terminal/history context and fall back to `undefined`. |
| `call_rejected` | `CallRejected` and `CallRejectedByDnd` | same | Emit once per call; normalize explicit reason or `dnd`. |
| `call_missed` | `IncomingCallEndedBeforeAnswer` | same | Emit once per call and keep it distinct from rejection. |
| `campaign_offered` | `OperatorCampaignOffered` | `src/domain/integration/ocp/events/OperatorCampaignOffered.ts` | Cache typed campaign fields by `campaignId`, then emit. |
| `campaign_accepted` | `OperatorCampaignCleared` with `reasonCode: "accepted"` | `src/domain/integration/ocp/events/OperatorCampaignCleared.ts` | Join cached offer fields by `campaignId`; emit, then clear cache. |
| `campaign_rejected` | `OperatorCampaignCleared` with `reasonCode: "rejected"` | same | Join cached offer fields by `campaignId`; emit, then clear cache. |
| `acd_context_appeared` | `CallOcpContextResolved` | `src/domain/integration/ocp/events/CallOcpContextResolved.ts` | Emit once per call/context fingerprint when queue/context becomes available. |
| `manual_run` | `RunExternalServiceRequestNowUseCase` | new Application use case | Build from active profile plus current focused call when one exists. |

`CallFailed`, hold/resume, registration, OCP session/status, SDK, and transfer facts do not map to v1 trigger codes.

## Call context tracker

Create `src/application/services/integration/external-services/ExternalServicesCallContextTracker.ts`.

- On `IncomingCallReceived`, cache `callId`, inbound direction, caller from `phoneNumber`, and called party from active profile login.
- On `OutgoingCallRequested`, cache outbound direction, called party from `phoneNumber`, and caller from active profile login.
- On ACD resolution, merge only the typed `callerId`, `calledId`, `queueName`, direction, and local party label required below.
- On rejection/missed/failure, cache terminal reason before any later `CallEnded`.
- On `CallHistoryRecorded`, optionally enrich reason/outcome by `callId`; do not use history persistence as the trigger source.
- Remove a call cache after all synchronous terminal facts for that publication turn have been normalized; schedule cleanup with `queueMicrotask` so `IncomingCallEndedBeforeAnswer` followed by `CallEnded` can both resolve.
- Bound the cache and clear it on logout/dispose.

## Focus source of truth

Current renderer selection is local state in `src/renderer/hooks/useCallFeatureShell.ts`; headset mirrors only operator-selected IDs through `AccountBootstrapFacade.setHeadsetSelectedCallId`. The event bus is synchronous, and `bindFacade` currently commits Zustand projections before `bindSdkBrokerSession` reads them. F-031 must use the same post-commit ordering rather than an early composition subscriber.

WU-11 must add an Application-defined `CallFocusProjection` reduced into the renderer projection store:

- Its pure reducer receives automatic focus transitions; explicit line-selection intent updates the same projection through the existing shell/store intent boundary.
- `useCallFeatureShell` reads the same focused ID instead of owning a conflicting local product focus rule.
- `bindExternalServicesAutomation` subscribes after `bindFacade`, reads the committed focus/call/OCP snapshot through an Application mapper, and then invokes the framework-neutral automation service.
- Each normalized call trigger records `focusedAtEvent: boolean`; later async queue work never re-evaluates focus.
- ACD context requires its `callId` to equal focused call ID.
- Campaign events have no call ID in existing typed events and are Operator events, not call lifecycle events; they fire without a call-focus gate. If F-028 later adds a typed call association, adopting it requires a separate compatibility decision.

Focus transition policy:

- New incoming ringing and new outgoing connecting become focused before their matching trigger is evaluated, matching the existing shell auto-selection behavior.
- Explicit line selection supersedes fallback focus while that line is alive.
- Answer/end/reject/miss are eligible only when the event call equals the focus snapshot.
- A terminal event retains its `focusedAtEvent` result for the immediate terminal sequence.
- Non-focused call facts are discarded before matching and never queued.

Candidate ordering paths:

```txt
src/renderer/hooks/useAccountBootstrap.ts
src/renderer/stores/useAccountBootstrapStore.ts
src/renderer/bootstrap/bindExternalServicesAutomation.ts
src/application/integration/readExternalServicesProductStateFromStore.ts
src/application/projections/telephony/callFocusProjection.ts
```

## Variable catalog

Always available:

| Variable | Source |
| --- | --- |
| `timestamp` | event occurrence time normalized to ISO-8601 UTC |
| `event_type` | stable external code |
| `user_login` | active profile/account identity, or missing |

Call variables:

| Variable | Source |
| --- | --- |
| `call_id` | typed event `callId` |
| `caller_id` | tracker inbound remote / outbound local; ACD typed value may enrich |
| `called_id` | tracker inbound local / outbound remote; ACD typed value may enrich |
| `call_direction` | `inbound` or `outbound` |
| `hangup_reason` | rejection/missed/history/terminal context; only meaningful for `call_ended` |

Campaign variables from `OperatorCampaignOffered`:

| Variable | Existing typed field |
| --- | --- |
| `campaign_id` | `campaignId` |
| `campaign_progressive` | `progressive` serialized as `true`/`false` |
| `campaign_client_phone` | `clientPhone` |
| `campaign_company` | `companyTitle` |
| `campaign_strategy` | `strategyTitle` |
| `campaign_selection` | `selectionTitle` |
| `queue_name` | `queueTitle` |

ACD variables from `CallOcpContextResolved`:

| Variable | Existing typed field |
| --- | --- |
| `queue_name` | `queueName` |
| `acd_phase` | `phase` |
| `acd_event` | `ocp.event` |

Do not expose `mainAcallId`, `acallId`, raw OCP payloads, OCP auth material, or SDK private fields in v1. This deliberately uses the desktop-safe queue/context subset and does not expand F-028 wire surface.

### Discoverability (product UI)

- Domain SSoT: `src/domain/integration/external-services/template/ExternalServiceVariableCatalog.ts` (`EXTERNAL_SERVICE_VARIABLE_CATALOG`, `EXTERNAL_SERVICE_SYSTEM_VARIABLE_NAMES`).
- Request editor Variables tab renders that catalog with localized descriptions and Insert into URL/Body.
- Collection workspace always shows a compact custom-variables preview (hint, example, `{{token}}` column).
- Collection variables dialog: example syntax, live inspection via `inspectExternalServiceCollectionVariableRows`, save blocked on duplicate/empty-key-with-value; soft warning for system-name collisions.
- Normalize/save path: `normalizeExternalServiceCollectionVariables` (Domain) used by `replaceExternalServiceCollectionVariables`.
- URL bar hint + collection-variables dialog explain `{{name}}` syntax and system-name precedence.
- Keep UI catalog names in sync with `buildExternalServiceVariables` and campaign/ACD mappers; extend Domain catalog first when adding variables.

## Collection variables (authored)

- Purpose: shared constants for all requests in one collection (`base_url`, tokens, tenant ids).
- Syntax in templates: `{{key}}` (case-sensitive, non-nested).
- Not the same as system Variables tab entries; system merge order still wins on name collision.
- Empty values allowed; unique keys required; blank draft rows dropped on save.

## Merge precedence

Build one string dictionary in this order:

1. Collection variables.
2. Standard event variables.
3. Campaign/ACD additive variables.

Later system values override colliding collection keys so users cannot spoof `event_type`, `timestamp`, call identity, or profile identity.

## Template algorithm

Create pure functions in `src/domain/integration/external-services/template/`.

1. Scan each source string for non-nested `{{name}}` tokens using a deterministic global expression.
2. Trim the token name for lookup; names remain case-sensitive.
3. Replace every occurrence with the dictionary value.
4. Replace missing names with the exact literal `undefined`.
5. Do not recursively expand placeholders introduced by replacement values.
6. Do not URL-encode URL/header/body replacements implicitly.
7. For enabled query rows, resolve key/value then append through `URLSearchParams`; this performs query encoding exactly once.
8. Preserve duplicate query/header names and authored ordering.
9. Compose form bodies from enabled key/value rows represented by the editor’s body value model; use URL encoding exactly once.
10. For JSON mode, resolve as text, attempt `JSON.parse` only to produce `jsonValidity: "valid" | "invalid"`, and send the text unchanged.

## URL composition

- Resolve URL templates first.
- Parse the result as `URL`; accept only `http:` or `https:`.
- Preserve authored query entries already in the URL, then append enabled query-table rows in order.
- Invalid URL/protocol fails before transport and produces a Run result/journal validation error.
- Fragment text may remain but is not sent by standard HTTP clients; UI should not imply server receipt.

## Tests

- Exhaustive source-event-to-code mapping and ignored-event tests.
- Focused/non-focused tests for every call trigger, including rapid multi-line sequences.
- Campaign accepted/rejected cache joins and missing-cache fallback.
- ACD safe-field mapping proving wire IDs are absent.
- Missing, repeated, adjacent, empty, case-sensitive, and non-recursive placeholders.
- Query/form encoding, duplicate keys, JSON warning without send suppression, and unsupported URL protocol.
