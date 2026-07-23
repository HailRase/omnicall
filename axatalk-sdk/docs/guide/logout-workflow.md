# Logout Workflow

Single-shot command: `account:logout`.  
There is **no** prepare/confirm handshake and **no** `logoutToken`.

Reasons come from `client.operator.getReasons()` — filter `kind === 'logout'`.

## Happy path (reason known or SIP-only)

```ts
await client.account.logout({
  reasonId, // optional when desktop does not require a reason
  expectedRevision
});
// → { loggedOut: true, revision }
```

## Interaction required (OCP / reason UI)

```ts
import { isAxatalkClientError } from '@axata/axatalk-sdk';

const { reasons } = await client.operator.getReasons();
const logoutReasons = reasons.filter((r) => r.kind === 'logout');

try {
  await client.account.logout({ expectedRevision });
} catch (error: unknown) {
  if (!isAxatalkClientError(error) || error.code !== 'interaction_required') {
    throw error;
  }
  // details: { requiresReason: true, reasons: [...] } — NO logoutToken
  const reasonId = /* host modal pick from logoutReasons / details.reasons */;
  await client.account.logout({ reasonId, expectedRevision: /* fresh */ });
}
```

## Cancel

| User action | SDK action |
| --- | --- |
| Dismiss modal | Do **not** call `logout` again |
| Navigate away | Same — simply abandon |
| `disconnect()` | Does **not** auto-logout |

## SIP-only

Desktop may accept logout without `reasonId` when no OCP reason workflow applies.
Still bind `expectedRevision` and handle `stale_state` / `conflict`.

## Reconnect

Never replay `logout` after reconnect. Re-read snapshot; start a new logout if the
operator still wants to sign out.
