# ADR-0013: SDK Window Policy and Sign-In Relationship to ADR-AF-003

## Type

DOCUMENT.

## Status

Accepted (2026-07-20) — activate consent UX / per-Origin activate deny **extended by
ADR-0018** (2026-07-21). Raw credential ban unchanged.

**Amended (2026-07-27):** `window:hide` enabled on the product surface under the
recovery + active-call policy in §A.2–A.3 (replaces the prior “unavailable until tray ADR”
product deny).

**Amended (2026-08-02):** allowlisted raise reason `notification_actionable` for optional
F-034 / ADR-0025 per-module `errors_only` (WU-08). Defaults remain no new raises.

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

   **Local focus policy (desktop main, DI-05+):** shared native helper
   `bringBrowserWindowToFront` (restore → `show` → `focus` → `moveTop` → brief
   temporary `setAlwaysOnTop` pulse that **restores the prior pin**). Used by:

   | Trigger | Path | Notes |
   | --- | --- | --- |
   | SDK `window:show` | `SdkWindowCommandHandler` | capability + Origin matrix; **1s rate limit** |
   | Incoming / outgoing call | renderer edge → IPC `shell:window-raise` | once per `callId`; no shared 1s with SDK show |
   | OCP preview campaign offer | renderer `useShellWindowAttentionFromCampaign` → IPC `shell:window-raise` (`ocp_campaign_offer`) | once per `activeCampaign.id`; **not** progressive badges; same `bringBrowserWindowToFront` |
   | Origin TOFU pending | main gateway `onOriginTrustPending` | raise + attention event → snapshot refresh → root `SdkConnectCeremonyModal` (transport step) |
   | Pairing pending | main gateway `onPairingPending` | raise + attention → snapshot refresh → root `SdkConnectCeremonyModal` (pairing step; no Settings redirect) |
   | Activate consent pending | renderer → IPC raise | once per consent episode (`attentionId`, like pairingRequestId); not once per origin+profile forever |
   | Second app instance | main `second-instance` | same bring-to-front helper |
   | Actionable notification (F-034 optional) | capture policy → renderer `useNotifications` → IPC `shell:window-raise` (`notification_actionable`) | only when module `raiseWindow === "errors_only"` **and** interruptClass `actionable` **and** level ≥ warning; dedupe by notification id; defaults `never` ⇒ **zero** new raises; informational/remote **never**; does not gate critical rows above |

   Raise helpers must **not** leave a *new* permanent always-on-top as a side
   effect of focus stealing — the temporary pulse must restore
   `BrowserWindow.isAlwaysOnTop()` (including a user-owned titlebar pin from
   F-016 `UserSettings.windowAlwaysOnTop`). User pin is orthogonal to SDK
   `window:show` / `window:hide` (visibility); hide must not clear pin.
   Must not raise on every WebSocket connect/reconnect without operator
   interaction. Domain / Call Engine never import Electron.

   **SDK-hide interaction (F-034):** `notification_actionable` uses the same
   `bringBrowserWindowToFront` path as telephony/campaign raises (tray Show recovery
   still applies). It must not bypass telephony-busy / Origin-matrix rules that already
   constrain SDK `window:show`. Prefer no raise over violating intentional host hide for
   informational toasts (informational/remote are already policy-denied).

2. **`window:hide` (privileged, capability `window.hide`):** **Available** on the protocol v1
   product surface under this amendment. Rules:
   - Capability is **privileged**: never in pairing profile defaults; never requested via
     client `sanitizeRequestedCapabilities`. Desktop elevates it only when the Origin
     matrix enables `window.hide` (same elevation pattern as `account.activate`).
   - Command requires `payload.expectedRevision` (schema). Mismatch → `stale_state`
     (+ current revision) via Application `SdkSessionRevisionCoordinator` (WU-02 /
     ADR-0027). Active-call / telephony-busy denial remains `conflict` (business).
   - Native hide runs in **main** (`BrowserWindow.hide`) after Application revision
     validate + telephony busy checks (broker → short native IPC under aggregate lock).
     Success emits `window:visibility-changed` with `visible: false` and **post-success**
     `reply.revision`.
   - **Recovery (mandatory):** while the softphone is SDK-hidden, main keeps a **minimal
     system tray** with a Show action that restores via the shared
     `bringBrowserWindowToFront` helper. Authorized `window:show`, second-instance focus,
     and telephony raise edges also restore. Full minimize-to-tray / close-to-tray product
     UX remains a separate P11 shell deliverable; this tray exists so hide cannot strand
     the operator without CRM.
   - Settings Origin matrix exposes an enable toggle for `window.hide` (default **off**).

3. **Active/incoming call rule:** hide is **denied** while the softphone has ringing,
   connecting, or established call context (renderer mirrors busy → main via typed IPC;
   main does not import Call Engine). Denial code: `conflict`. Focus-stealing show
   operations remain rate-limited (1s for SDK `window:show`).

4. **Ownership:** revision validate/advance for window commands is Application-owned
   (`SdkSessionRevisionCoordinator`, ADR-0027). Native BrowserWindow mutations still execute
   in **main** after capability/policy checks (ADR-0009) via short typed IPC. They do not
   go through Call Engine.

### B. SDK sign-in relationship to ADR-AF-003

1. **Account remains the sole interactive sign-in surface** for humans (ADR-AF-003). Avatar
   logout remains the only user logout entry point; OCP reason cascade unchanged.

2. **Protocol v1 excludes raw credential commands** (no SIP password, OCP API key, OCP
   session token, or secret-storage values on the wire). This is non-negotiable for P12.

3. **Preferred SDK account path (DI-08 + ADR-0018):** privileged `account:activate-profile`
   with a **login** string (optional `mode: sip_only | ocp`) — **not** passwords, **not** a
   Settings-issued temporary `profileRef` grant:
   - requires Origin not blacklisted, Origin matrix allowing activate, **and** session
     capability `account.activate` (elevated from Origin matrix; pairing defaults never
     include it; desktop emits `sdk:permission-changed` when matrix toggles);
   - desktop looks up a local saved profile by login (trim; case preserved; `1001` matches
     `1001@domain` local-part); SIP username and OCP login are the same identity;
   - when a complete SIP and/or OCP method exists, a renderer consent modal offers the
     available method(s); Allow runs unified Account sign-in (ADR-AF-003);
   - same login + same `clientId` already signed in → idempotent success
     (`alreadyAuthenticated`) **without** modal;
   - same login + **different** `clientId` → reauthorize consent modal;
   - different login while signed in → immediate `conflict` + `logout_required` and an
     informational modal (logout-first; ADR-AF-003/005);
   - Cancel/dismiss → `forbidden` + `authorization_canceled_by_user`; Deny → persist
     activate-disabled for Origin + `activate_denied_for_origin`;
   - missing / incomplete saved profile → `not_found` + `account_not_found` /
     `account_incomplete`;
   - SDK receives only operation result + redacted state — never secrets.

4. **Logout via SDK (DI-07):** `account:logout` maps to
   existing `AccountLogoutOrchestrationService` / avatar-equivalent workflow, including
   `interaction_required` when an OCP reason is needed (`requiresReason` + reasons list;
   no `logoutToken`). Intentional logout recovery
   disarm/reset semantics are preserved. This does **not** add a second human logout UI.

5. **Raw credential provisioning**, if a future business requirement proves unavoidable, is
   a **separate administrative feature** with its own ADR, capability, local approval, audit,
   and expiry — **out of protocol v1 / P12**.

## Alternatives Considered

| Alternative | Why not |
| --- | --- |
| Enable `window:hide` with no recovery | Call / focus stranding — rejected; tray Show + `window:show` required |
| Keep product-deny forever | Blocks CRM host UX that must dismiss softphone when idle |
| Allow SDK SIP/OCP password login in v1 | Bypasses AF-003; secret exfiltration via XSS |
| Separate SDK-only sign-in Facade in main | Second composition; forbidden by ADR-0009 |

## Consequences

- DI-05 show path unchanged; hide is an additive privileged command on the same main
  window handler + product surface.
- DI-09 Settings matrix includes `window.hide` (default off); the old permanently-disabled
  hide Switch is removed in favor of the matrix row.
- DI-08 is security-gated; ADR-AF-003/005/006 regression tests are mandatory.
- CRM integrators document “pair + activate saved profile”, not “send password”; hide is
  documented as matrix-granted + idle-only.

## Architecture Checks

- Secrets never cross WS, IPC DTOs, events, projections, or logs.
- UI Kit settings for SDK do not become a sign-in surface.
- SIP-only mode remains usable with OCP and SDK disabled.

## Related Links

- Feature Registry: F-011, F-001, F-024, F-028
- ADR-AF-003, ADR-AF-005, ADR-AF-006
- `omnicall-kit/docs/SECURITY.md` (Credential Policy)
- Related: ADR-0009, ADR-0011, ADR-0012, ADR-0018
