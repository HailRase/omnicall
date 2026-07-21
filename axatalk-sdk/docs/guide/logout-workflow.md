# Logout Workflow

Commands: `account:prepare-logout` → optional human step → `account:confirm-logout`.  
There is **no** `account:cancel-logout` command.

## Happy path (no interaction)

```ts
const prepared = await client.account.prepareLogout({ expectedRevision });
await client.account.confirmLogout({
  logoutToken: prepared.logoutToken,
  expectedRevision: prepared.revision
});
```

## Interaction required (OCP / reason UI)

```ts
import { isAxatalkClientError } from '@axata/axatalk-sdk';

try {
  await client.account.prepareLogout({ expectedRevision });
} catch (error: unknown) {
  if (!isAxatalkClientError(error) || error.code !== 'interaction_required') {
    throw error;
  }
  const logoutToken = error.details?.['logoutToken'];
  if (typeof logoutToken !== 'string') {
    // Fail closed — do not invent a token
    return;
  }
  // Host modal: pick reasonId, then:
  // await client.account.confirmLogout({ logoutToken, reasonId, expectedRevision: ... })
  // Cancel = abandon token (and/or disconnect). Never auto-confirm.
}
```

## Cancel

| User action | SDK action |
| --- | --- |
| Dismiss modal | Drop `logoutToken`; do nothing |
| Navigate away | Same — abandon |
| `disconnect()` | Does **not** confirm logout |

## SIP-only

Desktop may return prepare success without `interaction_required` when no OCP reason
workflow applies. Still bind `expectedRevision` and handle `stale_state` / `conflict`.

## Reconnect

Never replay `prepareLogout` / `confirmLogout` after reconnect. Re-read snapshot;
start a new prepare if the operator still wants logout.
