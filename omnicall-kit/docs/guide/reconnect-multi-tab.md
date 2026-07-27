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

Shared desk (ADR-0021): every authorized paired client may control the same call when
the Origin matrix grants the action. Snapshot/events stay identical across tabs/browsers
after each client completes pairing + connect + matrix.

| Scenario | Expect | Host action |
| --- | --- | --- |
| Two tabs originate | `conflict` / `stale_state` | Single-writer UX; disable duplicate controls |
| Tab A holds, Tab B hangs up | Both succeed if capable; later tab may see `stale_state` | Refresh snapshot; sync UI from events |
| New browser after pairing | Same call state as other clients | `getSnapshot()` + subscribe |
| Shared PoP install id | Same client identity | Prefer one active controller tab |

Never implement “retry all failed mutations on reconnect” helpers.
