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
| Consent TTL | **120 s** — unanswered modal auto-clears; softphone header shows muted `MM:SS` countdown; SDK gets `timeout` + `activate_phase: consent` |
| Secrets | SDK never accepts/returns SIP password or OCP apiKey |
| Account lookup | Desktop resolves the requested saved account by `login`; no profile-list command exists in v1 |
| SIP vs OCP | Optional `mode` requests `sip_only` or `ocp`; desktop validates it against the saved account |
| Client wait | `activateProfile` waits `SDK_ACTIVATE_CLIENT_TIMEOUT_MS` (~420 s, max Settings consent + auth), not the default 5 s. Modal countdown default remains 120 s (operator Settings). |

## Flow (ADR-0018 §E)

1. Origin must be `allowed` (not blacklisted) and session authenticated.
2. The per-Origin matrix must enable `account.activate`; otherwise activation is denied without
   opening the consent modal.
3. Host calls `activateProfile({ login, expectedRevision, mode? })` — **no password**.
4. Desktop outcomes:
   - Origin activate policy off → `forbidden` + `permission_denied` (**no modal**).
   - No matching saved account → `not_found` (+ Account UI as needed).
   - Saved account found + policy on → renderer consent modal:
     - Allow → auth budget starts for the chosen mode (sip_only or OCP stage sum);
     - Deny → persist activate-disabled for Origin + `forbidden`; later attempts denied
       until the Origin matrix re-enables `account.activate`;
     - While modal open, duplicate activate → `conflict` / pending (no spam);
     - Consent TTL / any close/choice clears pending (no hang).
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
| `timeout` | Consent TTL **or** auth budget / stage timeout (`details.activate_phase`) | Retry only after modal cleared; inspect `failure_kind` / softphone UI for OCP |
| `operation_failed` | e.g. `failure_kind: session_exist` after Allow | Direct operator to softphone SESSION_EXIST / retry UX |
| `operation_failed` (no details) | Transport reconnect mid-consent (should be rare after Desktop inbound-queue release) | Keep one client/WS during consent; retry activate after reconnect |

```ts
} catch (error: unknown) {
  if (isAxatalkClientError(error) && error.code === 'timeout') {
    const phase = error.details?.['activate_phase'];
    // phase === 'consent' → operator never answered; safe to retry
    // phase === 'sign_in' → auth failed after Allow; check softphone
  }
}
```

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
  // Handle forbidden / conflict / stale_state / not_found / timeout / operation_failed
  void error;
}
```

## Disconnect

`disconnect()` must never send `account:activate-profile`.
