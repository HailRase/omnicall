# OmniCall Kit Security Baseline

## Threat Model

The local WebSocket is a privileged control surface. Loopback does not imply trust.
Attackers include:

- an arbitrary website opened by the user;
- XSS in an approved web application;
- a malicious browser extension;
- a replaying or cloned client;
- another local process;
- an outdated SDK or desktop application;
- a client that floods, stalls, or races commands.

## Mandatory Trust Layers

### Network

- Desktop binds only to explicit loopback addresses.
- Desktop fails closed when the configured port is occupied.
- Frame size, message depth, connection count, and outbound queue are bounded.
- Idle and unauthenticated connections expire.
- Endpoint discovery is loopback HTTP only (`ADR-0015`); discovery documents never carry
  pairing secrets or tokens.
- HTTPS CRM pages require browser Local Network Access / loopback permission before
  discovery or WebSocket succeed; denial maps to stable client errors (not silent success).
- SDK loopback gateway **always listens** at primary-instance startup (ADR-0018). Consumer
  Settings do **not** expose an enable/disable listener toggle. Engineering kill-switch
  `OMNICALL_SDK_GATEWAY=0` (or omit gateway startup) remains support-only.

### Origin

- Origin strings are matched **exactly** (no wildcard / suffix / substring).
- Missing or `null` Origin is rejected.
- **Admission** follows ADR-0018 trust states:
  - `unknown` — accept upgrade → renderer Origin TOFU modal (Allow/Deny); **not** pairing;
  - `allowed` — accept upgrade → normal pairing / PoP / session (ADR-0016);
  - `denied` (blacklist) — **reject upgrade** (no socket); first Deny sends wire
    `forbidden` + details `origin_denied`, then closes.
- Unblock: previously `allowed` Origins restore to `allowed` with retained matrix;
  first-contact-only denials restore to `unknown` (modal again).
- Origin is an additional gate, not proof of client identity.
- Per-Origin capability matrix (Settings) further limits which capabilities may be granted;
  matrix is ignored while the Origin is blacklisted but retained read-only for Unblock
  restore (no consumer edits while `denied`).
- **Live enforcement:** desktop authorizes each command/event/snapshot with
  `pairingGrants ∩ currentOriginMatrix` (ADR-0018 §D). Matrix shrink applies immediately;
  matrix expand does not auto-elevate beyond pairing grants. Matrix strip of a still-paired
  grant → `forbidden` + details `permission_denied`.
- Discovery CORS reflects exact Origin for `unknown` and `allowed` only (ADR-0015).
### Pairing

- Pairing requires an explicit local user or administrator decision.
- Each client installation receives a distinct revocable identity.
- Pairing material is never embedded in JavaScript bundles or URLs.
- Proof-of-possession uses Web Crypto ECDSA P-256 with a non-extractable private key
  persisted only via IndexedDB (`ADR-0016`); never `localStorage` / `sessionStorage`.
- Session credentials are short-lived and bound to Origin, client ID, server instance,
  and negotiated capabilities.
- Replay is limited with nonces, unique request IDs, expiry, and a bounded deduplication cache.

### Authorization

Server-issued capabilities are the only authorization source:

- `session.read.redacted`
- `window.show`
- `window.hide`
- `operator.status.write`
- `operator.campaign.read`
- `ocp.acd_context.read`
- `call.originate`
- `call.control`
- `account.activate`
- `session.logout`

Capabilities are checked for every command, not only during handshake.

## Capability Levels

1. **Unauthenticated** — handshake and pairing request only.
2. **Presentation** — redacted state and window show.
3. **Operator** — operator status changes.
4. **Call controller** — call mutations, preferably scoped to calls created by the client.
5. **Privileged session** — account activation (Origin matrix + consent), logout, and
   window hide (privileged; matrix-gated; product-available per ADR-0013 amendment).

## Credential Policy

Normal browser SDK flows must not accept:

- SIP passwords;
- OCP API keys;
- OCP session tokens;
- secret-storage values;
- remembered profile secrets.

Preferred account flow:

1. Origin is `allowed` and the SDK session is authenticated (ADR-0018).
2. SDK requests activation of a saved account via `login` and optional `mode` (no passwords).
3. If Origin policy disallows activate → typed `forbidden` + `permission_denied`
   (no modal; do not silent-ignore).
4. If no local saved profile → typed `not_found` and desktop may show Account sign-in UI.
5. Otherwise desktop shows **renderer** consent modal (Allow / Deny) for **this one login**.
   - Deny → persist activate-disabled for that Origin + `forbidden`; later attempts denied
     until Settings re-enables activate.
   - Allow → one sign-in; the **next** activate asks again (no lasting skip-consent grant).
   - While consent is pending, duplicate activate requests are rejected with primary wire
     code **`conflict`** (optional details key `activate_consent_pending`); any modal
     close / choice clears pending (no hang).
6. Allow → desktop retrieves secrets from its own secure storage and runs the unified
   Account sign-in path.
7. SDK receives only an operation result and redacted state.

Raw credential provisioning, if a business requirement proves unavoidable, is a separate
administrative feature with its own ADR, capability, local approval, audit, and expiry —
**deferred**; not part of ADR-0018 / DI-11.
## Privacy Policy

- Phone numbers and display names are masked unless a specific capability grants them.
- Events are delivered per authorized session, never indiscriminately broadcast.
- Contacts, call history, raw SIP URIs, OCP wire IDs, and upstream error text are excluded
  from protocol v1 unless separately approved.
- **Exception (ADR-0020):** `call:acd-context` and snapshot `calls[].acdContext` may carry
  OCP MainCallIDInfo wire (`acallid`, `caller_id`, `called_id`, …) only when
  `ocp.acd_context.read` is granted (default on `operator` / `call_controller` profiles;
  Origin matrix can disable). Ordinary `call:*` / campaign DTOs stay redacted.
- Logs contain command type, request ID, client ID, correlation ID, result, and duration only.
- Payloads and authorization headers are never logged.
- Publish-path failures (`sdk_gateway_publish_event_dropped`,
  `sdk_gateway_event_publish_failed`) log allowlisted fields only (no event payloads).

## Command Safety

- **Inbound frames are serialized per WebSocket connection** on the desktop gateway
  (receive order). Async auth/pairing handlers must not race later commands on the same
  socket (e.g. `sdk:auth-proof` then immediate `sdk:ping`).
- **Exception:** `account:activate-profile` releases the inbound queue while awaiting
  operator consent / auth so client `sdk:ping` heartbeats still complete (otherwise SDK
  reconnects and the in-flight activate fails with bare `operation_failed`).
- Mutations are serialized per call or account aggregate.
- Destructive commands support ownership/lease policy and expected revision.
- Conflicts return stable errors such as `conflict`, `stale_state`, or `not_owner`.
- `window.hide` is product-available under ADR-0013 (amended 2026-07-27): privileged
  Origin-matrix grant, `expectedRevision` match, deny while ringing/connecting/established
  (`conflict`), and minimal tray Show recovery while SDK-hidden.
- Focus-stealing window operations are rate-limited. Authorized `window.show` raises the
  desktop shell above other apps per ADR-0013 local focus policy (restore/show/focus/
  z-order; temporary always-on-top pulse must restore any prior pin — never leave the
  shell permanently always-on-top). The same native helper raises the shell for
  incoming/outgoing calls and operator-attention flows (Origin TOFU, pairing, activate
  consent); TOFU/pairing present via root `SdkConnectCeremonyModal` (not Settings
  auto-open). Telephony raises are
  not subject to the SDK `window.show` 1s rate limit (edge per callId instead).
  Successful show/raise disposes the hide-only tray.
- Logout requires the OCP reason workflow when applicable.

## Compatibility Safety

Handshake negotiates:

- protocol minimum and maximum;
- SDK version;
- desktop version;
- capabilities;
- server instance ID;
- session epoch;
- current snapshot revision.

An incompatible client receives no snapshot or PII. After desktop restart, the SDK discards
old request IDs and state, reauthenticates, and obtains a fresh snapshot.

## Required Security Tests

- hostile, missing, and `null` Origin;
- first-contact Deny (typed `forbidden`+`origin_denied` + close) and blacklisted upgrade
  reject → client `origin_blocked` (ADR-0018);
- Unblock restore: prior allowed+matrix vs unknown after first Deny;
- discovery CORS for unknown+allowed only;
- unauthenticated snapshot/event access;
- replayed pairing, authentication, and command messages;
- duplicate request IDs;
- capability escalation, per-Origin matrix deny, and revoked clients;
- activate consent Deny / pending guard / missing profile / logout-first conflict;
- conflicting commands from two tabs;
- oversized frames, deep JSON, connection flood, and slow consumers;
- secret and PII absence in logs and unauthorized events;
- occupied port and second Electron instance;
- desktop restart or update during an active call;
- old SDK against new desktop and new SDK against old desktop;
- OCP endpoint injection and SSRF attempts;
- logout and hide policy bypass attempts;
- pre-auth Settings → OmniCall Kit reachable; OCP Module still gated (ADR-AF-004 + ADR-0018).

## Security Release Gate

Public npm publication is blocked until an independent security review reports no Blockers
and every mandatory security test passes against a packaged desktop build.
