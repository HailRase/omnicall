# ADR-0013: SDK Window Policy and Sign-In Relationship to ADR-AF-003

## Type

DOCUMENT.

## Status

Accepted (2026-07-20) — activate consent UX / per-Origin activate deny **extended by
ADR-0018** (2026-07-21). Raw credential ban unchanged.

## Context

- **Features:** F-011, F-001, F-024, F-028, F-029
- **Legacy:** LF-080, LF-081
- **Roadmap:** P12
- **Contexts:** Integration, Settings, Operator
- **Layers:** Electron main (window), Application (account sign-in), UI settings

Two product risks:

1. `window:hide` without tray/background policy can strand operators during calls.
2. Raw SIP/OCP credential commands in the SDK would bypass ADR-AF-003 (Account is the sole
   sign-in surface) and leak secrets across WS/IPC/logs.

## Decision

### A. Window show / hide policy

1. **`window:show` (protocol v1, capability `window.show`):** Allowed after authentication.
   Restores/focuses the softphone window subject to rate limits and local focus policy.
   Unavailable/destroyed window returns a typed failure. Implemented no earlier than DI-05.

2. **`window:hide` (privileged, capability `window.hide`):** **Unavailable in protocol v1
   product surface until** a dedicated tray/background + active-call policy ADR (or an
   amendment to this ADR) is Accepted. Until then:
   - command is rejected with `forbidden` / `unsupported_command` as fixtures specify;
   - Settings UX must not offer hide-as-enabled (DI-09 checklist).

3. **Active/incoming call rule (when hide eventually lands):** hide is denied during
   incoming or active calls unless an explicit future policy allows it. Focus-stealing show
   operations remain rate-limited.

4. **Ownership:** native window mutations execute in **main** after capability/policy checks
   (ADR-0009). They do not go through Call Engine.

### B. SDK sign-in relationship to ADR-AF-003

1. **Account remains the sole interactive sign-in surface** for humans (ADR-AF-003). Avatar
   logout remains the only user logout entry point; OCP reason cascade unchanged.

2. **Protocol v1 excludes raw credential commands** (no SIP password, OCP API key, OCP
   session token, or secret-storage values on the wire). This is non-negotiable for P12.

3. **Preferred SDK account path (DI-08 + ADR-0018):** privileged `account:activate-profile`
   using an opaque desktop-approved saved profile reference (`profileRef`):
   - requires Origin not blacklisted, Origin policy allowing activate, **and** session
     capability `account.activate`; when policy allows and a saved profile exists, a
     renderer consent modal Allow is still required on **every** activate (ADR-0018 §E —
     no lasting skip-consent grant);
   - desktop hydrates secrets only inside secure storage / Application boundaries;
   - delegates to the **unified Account sign-in path** (same Facade command family as UI);
   - preserves **active-session logout-first lock** (ADR-AF-003 / ADR-AF-005);
   - missing saved profile → typed `not_found` / `interaction_required` + Account UI;
   - operator Deny on consent → persist activate-disabled for that Origin + `forbidden`;
   - SDK receives only operation result + redacted state — never secrets.

4. **Logout via SDK (DI-07):** `account:prepare-logout` / `account:confirm-logout` map to
   existing `AccountLogoutOrchestrationService` / avatar-equivalent workflow, including
   `interaction_required` when an OCP reason is needed. Intentional logout recovery
   disarm/reset semantics are preserved. This does **not** add a second human logout UI.

5. **Raw credential provisioning**, if a future business requirement proves unavoidable, is
   a **separate administrative feature** with its own ADR, capability, local approval, audit,
   and expiry — **out of protocol v1 / P12**.

## Alternatives Considered

| Alternative | Why not |
| --- | --- |
| Enable `window:hide` immediately | No tray recovery; call stranding |
| Allow SDK SIP/OCP password login in v1 | Bypasses AF-003; secret exfiltration via XSS |
| Separate SDK-only sign-in Facade in main | Second composition; forbidden by ADR-0009 |

## Consequences

- DI-05 ships show only; DI-09 keeps hide disabled until policy exists.
- DI-08 is security-gated; ADR-AF-003/005/006 regression tests are mandatory.
- CRM integrators document “pair + activate saved profile”, not “send password”.

## Architecture Checks

- Secrets never cross WS, IPC DTOs, events, projections, or logs.
- UI Kit settings for SDK do not become a sign-in surface.
- SIP-only mode remains usable with OCP and SDK disabled.

## Related Links

- Feature Registry: F-011, F-001, F-024, F-028
- ADR-AF-003, ADR-AF-005, ADR-AF-006
- `axatalk-sdk/docs/SECURITY.md` (Credential Policy)
- Related: ADR-0009, ADR-0011, ADR-0012, ADR-0018
