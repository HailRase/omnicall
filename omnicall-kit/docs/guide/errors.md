# Errors Catalog

Stable machine-readable codes. **Never** treat localized text as protocol.

Detect with `isOmniCallClientError(error)` then branch on `error.code`.

For common detail shapes prefer typed helpers (do not index `details` ad hoc):

| Helper | When |
| --- | --- |
| `isInteractionRequiredError` + `readInteractionRequiredDetails` | logout reason step |
| `isConflictError` + `readConflictErrorDetails` | `failure_kind`, `activate_consent_pending` |
| `isOperationFailedError` + `readOperationFailedDetails` | e.g. `sip_not_registered` |

Raw `error.details` remains `WireJsonObject | undefined` for additive keys.

## Codes hosts must handle

| Code | Meaning | Host next step |
| --- | --- | --- |
| `forbidden` | Missing capability, Origin policy deny (`permission_denied`), or activate consent Deny | Disable control; open OmniCall Kit Settings; do not tight-loop |
| `not_ready` | Client not in `ready` **or** desktop product broker not ready | Wait / show connecting; distinct from Origin blacklist |
| `timeout` | No reply in budget | Surface retry UI; do **not** auto-replay non-idempotent cmds |
| `stale_state` | Revision mismatch; often has `currentRevision`. Causes include another SDK mutate, **or** desktop coarse-advance after UI/OCP operator status/session change | `getSnapshot()`; retry **once** with new revision if user still intends |
| `conflict` | Aggregate busy / active session / race / activate consent already pending / finish-appeal outside post-call (`details.failure_kind: "not_in_post_call_processing"`) / **`window.hide` while telephony busy** (or hide revision mismatch) | Show conflict; for activate often logout-first; wait if consent pending; for finish-appeal wait until `operator.status === "post_call_processing"`; for hide wait until idle call context then retry, or use tray Show / `window.show` |
| `not_found` | Unknown call / reason / login / no saved account | Refresh; for activate correct login or guide human to Account UI |
| `invalid_payload` | Wire/result shape failed closed | Treat as bug / desktop mismatch; do not parse secrets from `details` |
| `interaction_required` | Human step needed (logout reason **or** manual sign-in in progress) | Logout: `details.requiresReason` + `details.reasons` (no `logoutToken`). Activate: complete Account UI |
| `revoked` | Session revoked | Clear client; re-pair |
| `incompatible_version` | Protocol mismatch | Upgrade SDK or desktop; stop |
| `not_owner` | Another tab/client owns mutation | Coordinate multi-tab; do not force |
| `unauthenticated` | Auth required | Reconnect / pair |
| `rate_limited` | Back off | Honor retryable; jitter |
| `operation_failed` | Generic failure | Show failure; log code only. For `call:originate`, check `details.failure_kind === "sip_not_registered"` — SIP not registered; do not expect `call:failed` event (preflight deny). |
| `local_network_permission_required` / `_denied` | Browser LNA / loopback | Guide user to allow local network |
| `discovery_unreachable` | Desktop discovery failed | Is desktop running? Gateway always-on per ADR-0018 |
| `origin_blocked` | Blacklisted Origin — upgrade rejected (no wire JSON) | Operator Unblock in Settings → OmniCall Kit; do not auto-retry |
| `invalid_message` / `unsupported_command` | Protocol mismatch | Fail closed |

### Origin transport failures (ADR-0018)

| Situation | Typical host signal | Next step |
| --- | --- | --- |
| First Origin Deny | `forbidden` + details `origin_denied`, then socket close | Stop retry; wait for operator Allow / Unblock |
| Blacklisted Origin | Client code `origin_blocked` (upgrade fail) | Operator must Unblock in Settings → OmniCall Kit |
| Capability / activate policy deny (WS up) | `forbidden` + `permission_denied` | Edit per-Origin matrix; do not treat as blacklist. Applies to live matrix shrink mid-session as well as activate-off |

## Mutation recipe template

Every mutation example should follow this shape:

```ts
import {
  isOmniCallClientError,
  isConflictError,
  isInteractionRequiredError,
  isOperationFailedError,
  readConflictErrorDetails,
  readInteractionRequiredDetails,
  readOperationFailedDetails
} from '@softomnitel/omnicall-kit';

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
    if (isOperationFailedError(error)) {
      const details = readOperationFailedDetails(error.details);
      if (details?.failure_kind === 'sip_not_registered') {
        return;
      }
    }
    if (isConflictError(error)) {
      void readConflictErrorDetails(error.details);
      return;
    }
    if (isInteractionRequiredError(error)) {
      void readInteractionRequiredDetails(error.details);
      return;
    }
    if (!isOmniCallClientError(error)) throw error;
    switch (error.code) {
      case 'forbidden':
        break;
      case 'not_ready':
        break;
      case 'stale_state': {
        const next = error.currentRevision ?? (await client.getSnapshot()).revision;
        void next;
        break;
      }
      default:
        break;
    }
  }
}
```

## Logging rule

Log: `code`, `retryable`, optional `currentRevision`.  
Do **not** log: `details` wholesale, tokens, destinations beyond product policy, wire frames.
