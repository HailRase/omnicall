# Saved-Profile Activation

```ts
await client.account.activateProfile({
  profileRef,        // opaque desktop-approved reference (UI may show a label)
  expectedRevision   // from fresh snapshot
});
```

## Privilege rules

| Rule | Detail |
| --- | --- |
| Capability / policy | Privileged `account.activate` **and** Origin matrix must allow activate (ADR-0018) |
| Pairing request | **Never** — stripped by `sanitizeRequestedCapabilities` |
| Consent | Renderer modal Allow/Deny on **every** activate when policy allows and a profile exists |
| Grant scope | **One login only** — next activate asks again; no lasting skip-consent TTL |
| Secrets | SDK never accepts/returns SIP password or OCP apiKey |
| Profile list | **No** `account:list-profiles` in v1 — your product supplies `profileRef` |
| SIP vs OCP | Property of the **saved profile** inside desktop — not a wire selector |

## Flow (ADR-0018 §E)

1. Origin must be `allowed` (not blacklisted) and session authenticated.
2. Host calls `activateProfile({ profileRef, expectedRevision })` — **no password**.
3. Desktop outcomes:
   - Origin activate policy off → `forbidden` + `permission_denied` (**no modal**).
   - No matching saved profile → `not_found` (+ Account UI as needed).
   - Saved profile found + policy on → renderer consent modal:
     - Allow → one unified Account sign-in with local secrets;
     - Deny → persist activate-disabled for Origin + `forbidden`; later attempts denied
       until Settings → Integrations → Axatalk SDK re-enables activate;
     - While modal open, duplicate activate → `conflict` / pending (no spam);
     - Any close/choice clears pending (no hang).
4. Active session → `conflict` (logout-first) unchanged.

## Failure pedagogy

| Code | Typical cause | Host next step |
| --- | --- | --- |
| `forbidden` | Cap/policy deny / consent Deny / activate disabled (`permission_denied`) | Direct operator to Axatalk SDK Settings; do not retry in a tight loop |
| `not_ready` | Client not in `ready` / product broker not ready | Wait / show connecting |
| `conflict` | Active session (logout-first) **or** activate consent already pending | Logout workflow, or wait for operator to finish/dismiss modal |
| `stale_state` | Wrong revision | Refresh snapshot; retry once if intended |
| `not_found` | Unknown `profileRef` / no saved profile | Fix ref or wait for human sign-in in desktop UI |
| `interaction_required` | Human must complete an in-progress Account UI step | Focus softphone; poll snapshot `signedIn` — do not invent credentials |
| `invalid_payload` | Malformed / secret-looking reply | Fail closed; do not parse secrets |
| `timeout` | No reply | Surface retry; no auto-replay |

## Example pattern (grant / policy + consent)

```ts
if (!client.getGrantedCapabilities().includes('account.activate')) {
  // Do not call activateProfile — show Settings grant / Origin policy instructions
  return;
}
try {
  await client.account.activateProfile({ profileRef, expectedRevision });
} catch (error: unknown) {
  // Handle forbidden / conflict / stale_state / not_found / interaction_required
  void error;
}
```

## Disconnect

`disconnect()` must never send `account:activate-profile`.
