# ADR-AF-005: Account Session Activates Before SIP Ready

## Type

DOCUMENT.

## Status

Accepted (2026-07-16)

## Context

- **Features:** F-001, F-014, F-016, F-023, F-024, F-028
- **Legacy:** LF-006, LF-007, LF-008, LF-057, LF-077
- **Contexts:** Settings (primary), Telephony, Integration
- **Layers:** Domain Events, Application Use Cases / Facade, projections

ADR-AF-001 deferred profile/settings promotion until SIP registration succeeded. ADR-AF-004 gated all Settings sections (except Account) on SIP-ready. Product feedback requires the opposite for local account UX:

1. On **Войти**, profile metadata and user settings must apply immediately.
2. SIP `403` / registration failure must not undo the account session or block Settings.
3. The operator cannot switch identity while already under an account; avatar logout is required first.
4. OCP Server / Authorization status belongs in **Settings → Состояние системы** (OCP tab), not Account / OCP Module. The OCP tab is disabled when `ocpIntegration.enabled === false` (SIP-only).

## Decision

1. **Account session activation** happens on Login (SIP-only or OCP), not on `RegistrationSucceeded`.
   - Persist opted-in draft artifacts (unchanged).
   - Promote `activeProfileKey`, load profile-scoped `UserSettings`, mark saved profile successful-use, apply side effects.
   - Publish `AccountSessionActivated`.
   - Then attempt SIP registration as a best-effort telephony step.

2. **SIP registration failure** after activation:
   - Does not clear active profile/settings.
   - Does not re-enable Login for another identity.
   - Surfaces in SIP System State / registration projection; Login remains disabled until avatar logout.

3. **Settings gate (supersedes ADR-AF-004 condition):** `hasActiveAccountSession` from bootstrap projection (`AccountSessionActivated` … `UserSessionEnded`), not `isSipRegistered`.

4. **Login lock (ADR-AF-003 preserved):** Facade rejects sign-in while `hasActiveAccountSession` with `account.signIn.disabled.logoutFirst`.

5. **OCP dual status placement (amends ADR-AF-003 recovery UI):**
   - Canonical read model: `deriveOcpSystemStateShell` + System State tab availability.
   - OCP tab enabled only when `ocpIntegration.enabled === true`.
   - Account may still expose in-progress recovery actions during an unfinished OCP sign-in attempt; persistent Server/Authorization chrome moves to System State (UI WU).
   - OCP Module remains edit-only configuration; no status ownership.

6. **ADR-AF-001 amendment:** draft → successful-use marker is set on account-session activation (Login), not on SIP-ready. Failed SIP does not demote the profile.

## Alternatives Considered

| Alternative | Why rejected |
|---|---|
| Keep promote-after-register | Conflicts with immediate settings requirement |
| Gate Settings on SIP-ready | Blocks General/System State after 403 despite local login |
| Allow profile switch without logout | Violates avatar-only logout / single active identity |

## Consequences

- **Positive:** local settings usable immediately; SIP outages are telephony state, not account lockout.
- **Negative:** operators may edit settings while SIP is unregistered; dial/call features still require SIP-ready.
- **Testing:** promote-before-register unit/facade tests; gate on `hasActiveAccountSession`; OCP tab disabled when module off; logout clears session and re-enables Login.
- **Rollback:** restore promote-after-register + SIP-ready gate only with a new ADR.

## Architecture Checks

- UI → Application → Domain preserved.
- Secrets stay out of JSON/events/logs.
- Domain remains framework-independent.
- SIP recovery / OCP dual FSM ownership unchanged (ADR-AF-002).

## Related Links

- Amends: ADR-AF-001, ADR-AF-003, ADR-AF-004
- Plan: `auth-flow/auth-flow-refactoring.md`
- Feature Registry: F-001, F-014, F-016, F-024, F-028
