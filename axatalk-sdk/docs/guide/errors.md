# Errors Catalog

Stable machine-readable codes. **Never** treat localized text as protocol.

Detect with `isAxatalkClientError(error)` then branch on `error.code`.

## Codes hosts must handle

| Code | Meaning | Host next step |
| --- | --- | --- |
| `forbidden` | Missing capability, Origin policy deny (`permission_denied`), or activate consent Deny | Disable control; open Axatalk SDK Settings; do not tight-loop |
| `not_ready` | Client not in `ready` **or** desktop product broker not ready | Wait / show connecting; distinct from Origin blacklist |
| `timeout` | No reply in budget | Surface retry UI; do **not** auto-replay non-idempotent cmds |
| `stale_state` | Revision mismatch; often has `currentRevision`. Causes include another SDK mutate, **or** desktop coarse-advance after UI/OCP operator status/session change | `getSnapshot()`; retry **once** with new revision if user still intends |
| `conflict` | Aggregate busy / active session / race / activate consent already pending | Show conflict; for activate often logout-first; wait if consent pending |
| `not_found` | Unknown call / reason / login / no saved account | Refresh; for activate correct login or guide human to Account UI |
| `invalid_payload` | Wire/result shape failed closed | Treat as bug / desktop mismatch; do not parse secrets from `details` |
| `interaction_required` | Human step needed (logout reason **or** manual sign-in in progress) | Logout: `details.logoutToken`. Activate: complete Account UI |
| `revoked` | Session revoked | Clear client; re-pair |
| `incompatible_version` | Protocol mismatch | Upgrade SDK or desktop; stop |
| `not_owner` | Another tab/client owns mutation | Coordinate multi-tab; do not force |
| `unauthenticated` | Auth required | Reconnect / pair |
| `rate_limited` | Back off | Honor retryable; jitter |
| `operation_failed` | Generic failure | Show failure; log code only |
| `local_network_permission_required` / `_denied` | Browser LNA / loopback | Guide user to allow local network |
| `discovery_unreachable` | Desktop discovery failed | Is desktop running? Gateway always-on per ADR-0018 |
| `origin_blocked` | Blacklisted Origin — upgrade rejected (no wire JSON) | Operator Unblock in Settings → Axatalk SDK; do not auto-retry |
| `invalid_message` / `unsupported_command` | Protocol mismatch | Fail closed |

### Origin transport failures (ADR-0018)

| Situation | Typical host signal | Next step |
| --- | --- | --- |
| First Origin Deny | `forbidden` + details `origin_denied`, then socket close | Stop retry; wait for operator Allow / Unblock |
| Blacklisted Origin | Client code `origin_blocked` (upgrade fail) | Operator must Unblock in Settings → Axatalk SDK |
| Capability / activate policy deny (WS up) | `forbidden` + `permission_denied` | Edit per-Origin matrix; do not treat as blacklist. Applies to live matrix shrink mid-session as well as activate-off |

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
