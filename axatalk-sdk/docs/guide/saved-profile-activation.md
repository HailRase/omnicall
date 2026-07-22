# Saved-Account Activation

```ts
await client.account.activateProfile({
  login,             // saved-account login; accepts `@`, no secret
  expectedRevision,  // from fresh snapshot
  mode: 'sip_only'   // optional: `sip_only` or `ocp`
});
```

## Privilege rules

| Rule | Detail |
| --- | --- |
| Capability / policy | Privileged `account.activate` **and** Origin matrix must allow activate (ADR-0018) |
| Pairing request | **Never** — stripped by `sanitizeRequestedCapabilities` |
| Consent | Renderer modal Allow/Deny on **every** activate when policy allows and a profile exists |
| Consent scope | **One activation only** — next activate asks again; no lasting skip-consent TTL |
| Secrets | SDK never accepts/returns SIP password or OCP apiKey |
| Account lookup | Desktop resolves the requested saved account by `login`; no profile-list command exists in v1 |
| SIP vs OCP | Optional `mode` requests `sip_only` or `ocp`; desktop validates it against the saved account |

## Flow (ADR-0018 §E)

1. Origin must be `allowed` (not blacklisted) and session authenticated.
2. The per-Origin matrix must enable `account.activate`; otherwise activation is denied without
   opening the consent modal.
3. Host calls `activateProfile({ login, expectedRevision, mode? })` — **no password**.
4. Desktop outcomes:
   - Origin activate policy off → `forbidden` + `permission_denied` (**no modal**).
   - No matching saved account → `not_found` (+ Account UI as needed).
   - Saved account found + policy on → renderer consent modal:
     - Allow → one unified Account sign-in with local secrets;
     - Deny → persist activate-disabled for Origin + `forbidden`; later attempts denied
       until the Origin matrix re-enables `account.activate`;
     - While modal open, duplicate activate → `conflict` / pending (no spam);
     - Any close/choice clears pending (no hang).
5. Active session → `conflict` (logout-first) unchanged. A successful no-op may return
   `alreadyAuthenticated: true`.

## Failure pedagogy

| Code | Typical cause | Host next step |
| --- | --- | --- |
| `forbidden` | Cap/matrix deny / consent Deny / activate disabled (`permission_denied`) | Direct operator to the Origin matrix; do not retry in a tight loop |
| `not_ready` | Client not in `ready` / product broker not ready | Wait / show connecting |
| `conflict` | Active session (logout-first) **or** activate consent already pending | Logout workflow, or wait for operator to finish/dismiss modal |
| `stale_state` | Wrong revision | Refresh snapshot; retry once if intended |
| `not_found` | Unknown `login` / no saved account | Correct the login or wait for human sign-in in desktop UI |
| `interaction_required` | Human must complete an in-progress Account UI step | Focus softphone; poll snapshot `signedIn` — do not invent credentials |
| `invalid_payload` | Malformed / secret-looking reply | Fail closed; do not parse secrets |
| `timeout` | No reply | Surface retry; no auto-replay |

## Example pattern (Origin matrix + consent)

```ts
if (!client.getGrantedCapabilities().includes('account.activate')) {
  // Do not call activateProfile — ask the operator to enable account.activate
  // for this Origin.
  return;
}
try {
  await client.account.activateProfile({
    login,
    expectedRevision,
    mode: 'sip_only'
  });
} catch (error: unknown) {
  // Handle forbidden / conflict / stale_state / not_found / interaction_required
  void error;
}
```

## Disconnect

`disconnect()` must never send `account:activate-profile`.
