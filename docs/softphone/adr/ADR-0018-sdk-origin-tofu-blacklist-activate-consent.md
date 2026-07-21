# ADR-0018: SDK Origin TOFU, Blacklist, Per-Origin Capability Policy, Always-On Gateway, and Activate Consent

## Type

DOCUMENT.

## Status

Accepted (2026-07-21) — decisions frozen with product owner 2026-07-21 (docs refactor).

## Context

- **Features:** F-011, F-001, F-016, F-024
- **Legacy:** LF-080, LF-081
- **Roadmap:** P12
- **Contexts:** Integration, Settings, Account
- **Layers:** Electron main (gateway upgrade policy), Application settings projections,
  Renderer Settings UI + consent modals, `@axata/axatalk-sdk` error mapping
- **Amends:** ADR-0011 §Decision.1 (pre-allowlist-only upgrade), ADR-0013 §B (activate UX),
  ADR-AF-004 (Settings pre-auth gate exception for Axatalk SDK), ADR-0009 Consequences
  rollback (Settings listener flag → env kill-switch only), ADR-0015 discovery CORS
  eligibility for `unknown` Origins
- **Does not change:** ADR-0013 raw-credential ban; ADR-0009 process ownership / broker;
  ADR-0010 loopback bind; ADR-0015 discovery URL path; ADR-0016 PoP crypto

Integrator friction observed during live `sdk-demo` smoke:

1. Pre-allowlist Origin caused `origin_denied` after revoke/restart without a first-contact UI.
2. Settings SDK controls were gated behind account session (ADR-AF-004), blocking blacklist
   / Origin policy edits before SIP sign-in.
3. Product `not_ready` / pairing UX were conflated with Origin policy failures.
4. Saved-profile activate (DI-08) lacked a clear first-consent modal and durable
   per-Origin “activate denied” policy separate from transport blacklist.

Raw SIP/OCP credential login over the SDK remains **out of scope** (ADR-0013). This ADR
fixes Origin trust UX and clarifies activate-with-saved-profile consent.

## Decision

### A. Always-on loopback gateway

1. When the Axatalk Desktop process starts as the primary instance, the SDK loopback
   gateway **always listens** on the documented bind (`127.0.0.1:17341` per ADR-0015)
   subject only to single-instance ownership and occupied-port fail-closed (ADR-0010).
2. The Settings control that **disables / enables the SDK server listener** is **removed**.
   Operators manage trust via Origin allow / blacklist / capability policy — not by
   stopping the listener. (DI-09 shipped an enable toggle; DI-11 removes it — policy
   change, not a documentation typo against ADR-0009’s earlier rollback wording.)
3. Env overrides that force the gateway off (`AXATALK_SDK_GATEWAY=0`) remain an
   **engineering / enterprise kill-switch** only; they are not exposed as a normal
   Settings toggle. Documented for support, not for integrator onboarding.

### B. Origin trust states (exact string match retained)

Every Origin is classified as exactly one of:

| State | Meaning | WebSocket upgrade |
| --- | --- | --- |
| `unknown` | Never decided (or unblocked after first-contact Deny) | Accept upgrade → Origin TOFU modal |
| `allowed` | Operator allowed this Origin | Accept upgrade → pairing / PoP / session |
| `denied` (blacklist) | Operator blocked this Origin | **Reject upgrade** — do not open the socket |

Rules:

1. **Exact Origin** match only (no wildcard / suffix / substring) — unchanged from ADR-0011.
2. **First contact (`unknown`):** desktop accepts the WebSocket, runs handshake, then shows
   a **renderer modal** (Allow / Deny): “this Origin wants to connect”.
   - This modal is **Origin trust only** — it is **not** the pairing/`pairing:pending`
     client-identity ceremony (ADR-0016). Pairing / PoP / session grants run **after**
     Origin is `allowed`.
3. **Allow:** Origin → `allowed`; WebSocket session continues; desktop initializes the
   **per-Origin capability matrix** to non-privileged `call_controller` defaults
   (ADR-0016 catalog minus privileged ids). `account.activate` defaults **off**.
   `window.hide` remains unavailable (ADR-0013). Fine-grained matrix edits stay in Settings.
4. **Deny (first time):** send typed wire failure **`forbidden`** with stable details key
   **`origin_denied`**, then **close** the socket. Persist Origin as `denied`.
5. **Repeat from blacklist:** **do not establish** the WebSocket (HTTP upgrade reject). No
   application JSON frame. SDK maps the transport failure to non-retryable client code
   **`origin_blocked`** (not a desktop wire code; client-side mapping like LNA errors).
6. **Unblock** from blacklist:
   - If the Origin **previously was `allowed`** (matrix retained from before blacklist) →
     restore to **`allowed`** with the **retained** capability matrix.
   - If the Origin was blacklisted from **first-contact Deny** (never `allowed`) →
     restore to **`unknown`** so the TOFU modal appears again on next connect.
7. **Cannot add or edit** an Origin allow/policy / capability matrix while it is
   blacklisted — Unblock first, then add/edit permissions. While `denied`, the retained
   matrix is stored read-only for restore and is **not** consulted for authorization.
8. **Quick blacklist** from an allowed Origin: move to `denied`. **Per-Origin capability
   matrix is retained** on disk but **ignored for authorization** while `denied`.

Pre-seeded / managed Origins (IT policy files) may enter as `allowed` without a modal;
enterprise may disable TOFU and require pre-seed only (compat mode). Default product
behavior for consumer desktop is TOFU as above.

Env `AXATALK_SDK_ALLOWED_ORIGINS` becomes an optional **seed / managed allow** input into
the same store — not the only gate. Blacklist still wins over allow seed.

### C. Settings IA — Axatalk SDK (pre-auth)

1. **ADR-AF-004 exception:** Settings → **Axatalk SDK** is available **before** account
   session activation. **Integrations → OCP Module** and other Settings sections remain
   gated as today.
2. Navigation placement: **top-level** Settings nav leaf **immediately below** the
   Integrations group (not nested under Integrations children). Integrations remains
   OCP Module only; Axatalk SDK is a sibling section in the rail order.
3. Axatalk SDK Settings contains at least:
   - **Blacklist** (denied Origins) with Unblock;
   - **Allowed Origins / Domains** with per-Origin create / edit (URL rename keeps matrix) /
     delete and quick blacklist (not a bulk textarea replace);
   - **Per-Origin capability matrix** (see §D) — Settings UI exposes **all** matrix
     capability toggles per allowed Origin (`session.read.redacted`, `window.show`,
     `operator.status.write`, `session.logout`, `call.originate`, `call.control`,
     `account.activate`); `window.hide` is shown disabled (ADR-0013);
   - Diagnostics (listen status, bind port, connection counts) without secrets;
   - Paired client revoke controls (from DI-09) remain here; policy lists themselves are
     editable pre-auth.
4. Settings are **machine/common** (not per-SIP-user silos) for Origin trust + capability
   matrix + blacklist — any operator who can open Settings can manage them under this
   ADR. Shared-PC risk is accepted for this surface; account-bound secrets and saved
   profiles remain account-scoped (ADR-AF-003/006).

   **DI-11 implementation:** durable SoT is
   `profiles/sdk-origin-trust.json` under the Axatalk storage root (see
   `sdkOriginTrustMachineStore.ts`). Boot hydrates the live gateway from this file
   before upgrade/discovery. Legacy per-profile `UserSettings.sdkIntegration` rows are
   one-shot migrated into the machine file when it is empty; Settings may still mirror
   trust into the active account bucket for UX, but cold-start admission uses the
   machine-common store. `AXATALK_SDK_ALLOWED_ORIGINS` remains an allow seed only —
   persisted `denied` always wins.

### D. Per-Origin capability policy matrix

1. Each `allowed` Origin has its own matrix of **which capabilities may be granted** to
   sessions for that Origin (subset of the ADR-0011 catalog).
2. Pairing / session grants must be ⊆ Origin policy. Desktop strips or denies anything
   outside the matrix.
3. Privileged `account.activate` and unavailable `window.hide` remain special:
   - `window.hide` — still unavailable in product v1 (ADR-0013);
   - `account.activate` — matrix flag “activate allowed for this Origin”; actual activate
     still requires the consent path in §E on **every** activate attempt when enabled.
4. While Origin is `denied`, matrix values are stored read-only for Unblock restore and
   **not consulted** for authorization. Consumer Settings must not add/edit allow or
   matrix entries until Unblock.
5. Command denied by matrix while Origin `allowed` and session live → typed **`forbidden`**
   with details key **`permission_denied`** (or capability-specific key); **do not** tear
   the transport solely for capability deny.

Default on first Origin Allow (modal): non-privileged `call_controller` defaults
(`session.read.redacted`, `window.show`, `call.originate`, `call.control`,
`session.logout`, `operator.status.write`). `account.activate` defaults **off** until
explicitly enabled in the Settings matrix.

### E. Saved-profile activate consent (no passwords on the wire)

Extends ADR-0013 §B / DI-08 — **does not** introduce raw credential commands.

1. After Origin is `allowed` and the SDK session is authenticated, the host may call
   `account.activateProfile` with an opaque **`profileRef`**. Desktop may resolve a unique
   local saved profile; UI may show a human label such as `alex.supervisor`. Integrators
   must not send SIP passwords or OCP apiKeys.
2. If Origin matrix has activate **disabled** → immediate **`forbidden`** with details key
   **`permission_denied`** (or `activate_denied_for_origin`) — **no consent modal**.
3. If no matching saved profile → **`not_found`** (primary) and optionally surface Account
   UI via `window.show`; use **`interaction_required`** only when the operator must finish
   a human Account step already in progress. SDK must not invent credentials.
4. If a saved profile exists and Origin matrix allows activate → **renderer consent modal**:
   “Origin X wants to sign in as {profileLabel} — Allow / Deny”.
5. **Allow (one login only):** desktop loads secrets only from secure storage, runs the
   unified Account sign-in path (ADR-AF-003), returns success + redacted state. This
   consent authorizes **this single activate** — the next `activateProfile` requires a
   **new** consent modal (no lasting “activate grant TTL” that skips the modal).
6. **Deny:** persist Origin matrix flag **activate disabled**, return **`forbidden`**
   (`permission_denied` / `activate_denied_for_origin`), keep WS up. Subsequent activate
   attempts from that Origin receive immediate **`forbidden`** (no modal) until an
   operator re-enables activate in Settings. **Do not** silent-ignore activate.
7. **Pending guard (no spam / no hang):** while an activate consent is pending for an
   Origin/session, additional activate requests are rejected with primary typed
   **`conflict`** (optional details key `activate_consent_pending`) — do not queue
   parallel modals. **Any** terminal UI action (Allow, Deny, or dismiss/close of the
   modal) **clears** pending so the gateway cannot wedge.
8. Active account session lock: logout-first **`conflict`** unchanged (ADR-AF-003/005).
9. SIP vs OCP is **not** chosen on the wire by the SDK; it is a property of the **saved
   profile** inside desktop.

Raw credential provisioning over SDK remains a **future separate ADR** if ever required.

### F. Error and reconnect pedagogy (integrator-facing)

| Situation | Transport | SDK-visible outcome |
| --- | --- | --- |
| First Origin Deny | `forbidden` + `origin_denied`, then close | Terminal; stop auto-retry |
| Blacklisted Origin reconnect | Upgrade reject (no JSON) | Client code **`origin_blocked`** (non-retryable) |
| Capability / activate policy deny | Keep WS | `forbidden` + `permission_denied` |
| Activate consent Deny | Keep WS | `forbidden` + activate-disabled persisted |
| Activate consent already pending | Keep WS | Primary **`conflict`** (optional `activate_consent_pending`) — no second modal |
| No saved profile | Keep WS | `not_found` (+ Account UI as needed) |
| Broker / composition not ready | Keep WS | `not_ready` (distinct from Origin deny) |

Integrator-facing copy for blocked Origin (non-normative): explain that the site was
blocked in Axatalk and the operator must Unblock under Settings → Integrations →
Axatalk SDK. Machine code remains authoritative.

### G. Modal ownership (renderer)

1. Origin TOFU Allow/Deny and activate consent Allow/Deny are **renderer** UI (modal —
   explicit choice; not a dismissible toast/notification as the primary control).
2. Main owns upgrade admission and may hold the connection / command until the renderer
   reports the decision over the typed broker/IPC (DI-11 names events in evidence).
3. Main must not invent a second product composition; renderer Application owns the
   decision projection and Settings persistence path.

### H. Discovery CORS (with ADR-0015)

Loopback discovery `GET` reflects **exact** Origin in CORS (`Access-Control-Allow-Origin`)
when the Origin state is **`unknown` or `allowed`** (so first-contact TOFU can reach the
gateway). **`denied`** Origins must not receive discovery ACAO. Credentialed misuse remains
fail-closed per ADR-0015.

### I. Implementation vehicle

- Desktop work unit: **DI-11** (docs may land earlier; **code merge** only when DI-10 gate
  policy allows — no silent rewrite of DI-04/09 without this ADR).
- **F-011 `implemented` / P12 close require DI-11 `/sdk-review` PASS** (ADR-0018 behavior
  in product) in addition to DI-10 evidence policy — or an explicit human waiver in
  evidence. This ADR alone does not close F-011.
- No SemVer bump until DI-11 ships user-visible Settings/TOFU behavior.

## Alternatives Considered

| Alternative | Why not |
| --- | --- |
| Keep pre-allowlist-only upgrade | Integrator deadlock; no first-contact UX |
| Settings toggle to stop listener | Hides trust problems; breaks discovery expectations |
| Silent ignore on activate deny | Causes reconnect/retry storms; opaque CRM bugs |
| Send SIP/OCP passwords on activate | Violates ADR-0013; XSS exfiltration |
| Pre-auth edit of all Settings | Violates ADR-AF-004; only Axatalk SDK is excepted |
| Single global capability matrix | Rejected — product requires per-Origin matrix |
| Unblock always → `unknown` | Rejected — previously allowed Origins must restore matrix |
| Long-lived notification for TOFU | Rejected — too easy to ignore; use renderer modal |
| Lasting activate grant skipping consent | Rejected — every activate asks again when policy allows |

## Consequences

- DI-04 Origin upgrade checks must be reworked under DI-11 to implement §B.
- DI-09 Settings card is superseded/extended by DI-11 IA (§C–D); listener enable toggle
  removed; hide remains disabled.
- ADR-0009 rollback wording updated: env kill-switch, not Settings flag.
- ADR-AF-004 gains a narrow pre-auth exception; tests must cover deep links to Axatalk SDK
  pre-auth and continued block of OCP Module.
- ADR-0015 CORS eligibility includes `unknown` for TOFU bootstrap.
- SDK guides (`SECURITY`, pairing, saved-profile activation, errors) must describe TOFU,
  blacklist, `origin_blocked`, and activate consent pending rules.
- Enterprise managed allow/deny lists remain supported as seeds into the same state machine.

## Architecture Checks

- Domain never sees pairing secrets or profile passwords.
- Main owns upgrade allow/deny and native window show; Origin/activate **modals** live in
  renderer; Account activate still terminates in Application / Account Facade via broker
  (ADR-0009).
- Public protocol still has no raw credential fields.
- SIP-only mode remains valid with OCP disabled.
- Exact Origin matching and loopback-only bind unchanged.

## Related Links

- Feature Registry: F-011
- Work unit: `axatalk-sdk-integration/WORK-UNITS.md` — DI-11
- `axatalk-sdk/docs/SECURITY.md`
- Related: ADR-0009, ADR-0011, ADR-0013, ADR-0015, ADR-0016, ADR-AF-003, ADR-AF-004,
  ADR-AF-005
