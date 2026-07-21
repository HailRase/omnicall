# Errors Catalog

Stable machine-readable codes. **Never** treat localized text as protocol.

Detect with `isAxatalkClientError(error)` then branch on `error.code`.

## Codes hosts must handle

| Code | Meaning | Host next step |
| --- | --- | --- |
| `forbidden` | Missing capability or policy deny | Disable control; explain grant needed |
| `not_ready` | Client not in `ready` | Wait / show connecting; do not queue mutations blindly |
| `timeout` | No reply in budget | Surface retry UI; do **not** auto-replay non-idempotent cmds |
| `stale_state` | Revision mismatch; often has `currentRevision` | `getSnapshot()`; retry **once** with new revision if user still intends |
| `conflict` | Aggregate busy / active session / race | Show conflict; for activate often logout-first |
| `not_found` | Unknown call / reason / profileRef | Refresh lists; do not invent IDs |
| `invalid_payload` | Wire/result shape failed closed | Treat as bug / desktop mismatch; do not parse secrets from `details` |
| `interaction_required` | Human step needed (logout reason) | Read `details.logoutToken`; show modal; confirm or abandon |
| `revoked` | Session revoked | Clear client; re-pair |
| `incompatible_version` | Protocol mismatch | Upgrade SDK or desktop; stop |
| `not_owner` | Another tab/client owns mutation | Coordinate multi-tab; do not force |
| `unauthenticated` | Auth required | Reconnect / pair |
| `rate_limited` | Back off | Honor retryable; jitter |
| `operation_failed` | Generic failure | Show failure; log code only |
| `local_network_permission_required` / `_denied` | Browser LNA / loopback | Guide user to allow local network |
| `discovery_unreachable` | Desktop discovery failed | Is desktop running? |
| `invalid_message` / `unsupported_command` | Protocol mismatch | Fail closed |

## Mutation recipe template

Every mutation example should follow this shape:

```ts
import { isAxatalkClientError } from '@axata/axatalk-sdk';

async function originateSafe(
  client: {
    getRevision: () => number | undefined;
    getSnapshot: () => Promise<{ revision: number }>;
    calls: {
      originate: (input: {
        destination: string;
        expectedRevision: number;
      }) => Promise<{ callId: string; revision: number }>;
    };
  },
  destination: string
): Promise<void> {
  const revision = client.getRevision() ?? (await client.getSnapshot()).revision;
  try {
    await client.calls.originate({ destination, expectedRevision: revision });
  } catch (error: unknown) {
    if (!isAxatalkClientError(error)) throw error;
    switch (error.code) {
      case 'forbidden':
        // Capability missing — update UI
        break;
      case 'not_ready':
        // Wait for ready
        break;
      case 'stale_state': {
        const next = error.currentRevision ?? (await client.getSnapshot()).revision;
        // Host decides whether to retry once with `next`
        void next;
        break;
      }
      case 'conflict':
      case 'interaction_required':
        // Surface to operator; never auto-confirm
        break;
      default:
        // Log code + retryable only — never dump details/payloads
        break;
    }
  }
}
```

## Logging rule

Log: `code`, `retryable`, optional `currentRevision`.  
Do **not** log: `details` wholesale, tokens, destinations beyond product policy, wire frames.
