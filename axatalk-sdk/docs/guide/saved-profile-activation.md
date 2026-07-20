# Saved-Profile Activation

```ts
await client.account.activateProfile({
  profileRef,        // opaque desktop-approved reference
  expectedRevision   // from fresh snapshot
});
```

## Privilege rules

| Rule | Detail |
| --- | --- |
| Capability | Privileged `account.activate` |
| Pairing request | **Never** — stripped by `sanitizeRequestedCapabilities` |
| Grant source | Desktop Settings / admin grant (DI-09); TTL desktop-owned |
| Secrets | SDK never accepts/returns SIP password or OCP apiKey |
| Profile list | **No** `account:list-profiles` in v1 — your product supplies `profileRef` |

## Failure pedagogy

| Code | Typical cause | Host next step |
| --- | --- | --- |
| `forbidden` | Cap not granted / revoked | Direct operator to Axatalk Settings grant |
| `not_ready` | Called before `ready` | Wait for ready |
| `conflict` | Active session (logout-first) | Run logout workflow, then retry activate |
| `stale_state` | Wrong revision | Refresh snapshot; retry once if intended |
| `not_found` | Unknown `profileRef` | Fix ref from your desktop-approved channel |
| `invalid_payload` | Malformed / secret-looking reply | Fail closed; do not parse secrets |
| `timeout` | No reply | Surface retry; no auto-replay |

## Example pattern (grant injected by peer / desktop)

Production: desktop grants the cap after human approval.  
Fake-peer demos: peer includes `account.activate` in **granted** capabilities at approve
time — **not** via client `requestedCapabilities`.

```ts
if (!client.getGrantedCapabilities().includes('account.activate')) {
  // Do not call activateProfile — show grant instructions
  return;
}
try {
  await client.account.activateProfile({ profileRef, expectedRevision });
} catch (error: unknown) {
  // Handle forbidden / conflict / stale_state — see Errors catalog
  void error;
}
```

## Disconnect

`disconnect()` must never send `account:activate-profile`.
