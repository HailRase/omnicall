# Reconnect & Multi-Tab

## Reconnect

| Property | Behavior |
| --- | --- |
| Policy | Bounded (`ReconnectPolicy.maxAttempts`), jittered, cancellable |
| After success | Fresh authentication + **fresh snapshot** |
| Mutations in flight | Rejected typed; **never** auto-resent |
| Queued UI intent | Host must re-issue after new `expectedRevision` |

```ts
client.onStateChange((state) => {
  if (state === 'reconnecting') {
    // Banner only — do not resend originate/hangup/logout/activate
  }
  if (state === 'ready') {
    void client.getSnapshot(); // replace local revision baseline
  }
});
```

## Disconnect

`client.disconnect()`:

- closes transport and cleans timers / pending requests;
- **does not** hang up active calls;
- **does not** confirm logout;
- **does not** activate a profile;
- **does not** tear down the desktop SIP / account session.

## Multi-tab guidance

| Scenario | Expect | Host action |
| --- | --- | --- |
| Two tabs originate | `conflict` / `not_owner` | Single-writer UX; disable duplicate controls |
| Tab A holds, Tab B hangs up | Ownership / conflict errors | Refresh snapshot; sync UI from events |
| Shared PoP install id | Same client identity | Prefer one active controller tab |

Never implement “retry all failed mutations on reconnect” helpers.
