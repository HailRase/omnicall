# TypeScript & Public Types

How integrators should import and use types from `@axata/axatalk-sdk` without
drifting from the protocol package.

Public contract truth: [`etc/api/sdk.api.md`](../../etc/api/sdk.api.md).  
Inventory: [API reference](./api-reference.md).

## Import rule (CRM / host apps)

Prefer **one package** for day-to-day CRM work:

```ts
import {
  createAxatalkClient,
  isAxatalkClientError,
  isInteractionRequiredError,
  readInteractionRequiredDetails,
  type AxatalkClient,
  type AxatalkEventOf,
  type SnapshotMessage,
  type CapabilityId,
  type PublicOperatorStatus,
  type ActivateProfileMode
} from '@axata/axatalk-sdk';
```

Use `@axata/axatalk-protocol` when you need:

- runtime Zod schemas (`EventMessageSchema`, `validateWireMessage`, …);
- golden fixtures;
- advanced wire unions beyond the client surface.

SDK re-exports the DTO types hosts actually touch (`SnapshotMessage`,
`CapabilityId`, `ProtocolErrorCode`, `PublicOperatorStatus`, …). Schemas stay on
protocol only (keeps browser bundles smaller).

## Events

`subscribe` narrows the listener by event name:

```ts
client.subscribe('call:incoming', (event) => {
  // event: AxatalkEventOf<'call:incoming'>
  void event.payload.callId;
});
```

Helper alias:

```ts
type CampaignOffered = AxatalkEventOf<'operator:campaign-offered'>;
```

Not delivered via `subscribe` (by design):

| Protocol event | Host signal |
| --- | --- |
| `sdk:permission-changed` | `getGrantedCapabilities()` after auth / reconnect |
| `sdk:revoked` | connection state `revoked` |

Product event names: `PUBLIC_EVENT_TYPES` / `PublicEventType`.

## Snapshot

```ts
const snapshot: SnapshotMessage = await client.getSnapshot();
const calls = snapshot.sections.calls; // SnapshotCallSummary[] | undefined
const status = snapshot.sections.operator?.status; // PublicOperatorStatus | undefined
```

## Errors

Keep `AxatalkClientError.details` as opaque `WireJsonObject` for forward
compatibility. Prefer typed readers:

```ts
try {
  await client.account.logout({ expectedRevision });
} catch (error: unknown) {
  if (isInteractionRequiredError(error)) {
    const details = readInteractionRequiredDetails(error.details);
    // details?.requiresReason, details?.reasons
  }
  if (isConflictError(error)) {
    const details = readConflictErrorDetails(error.details);
    // details?.failure_kind, details?.activate_consent_pending
  }
  if (isOperationFailedError(error)) {
    const details = readOperationFailedDetails(error.details);
    // e.g. failure_kind === 'sip_not_registered'
  }
  if (!isAxatalkClientError(error)) throw error;
}
```

See [Errors](./errors.md).

## Result DTO tightening (non-breaking for hosts)

| Field | Type |
| --- | --- |
| `ActivateProfileResult.mode` | `ActivateProfileMode` (`sip_only` \| `ocp`) |
| `OperatorStatusChangeResult.accepted` | literal `true` |
| `OperatorStatusChangeResult.targetStatus` | `PublicOperatorStatus` |

These match desktop protocol v1 replies. Unexpected wire shapes still fail closed
as `invalid_payload`.

## Inventory sync (agents / maintainers)

1. Change public exports → rebuild → `npm run api:check` (updates `etc/api/*.api.md`).
2. Refresh the inventory table in `api-reference.md` so heading count + rows match
   the report (typed exports **and** `export { Name }` re-exports).
3. `npm run docs:check` compares inventory ↔ report without a hardcoded symbol count.

Do not document symbols that are absent from `etc/api/sdk.api.md`.
