# OmniCall Local Protocol v1 Design

## Status

Design baseline with **SDK-01 decisions closed** (ADR-0014…0017). The contract becomes
implementation-frozen only when SDK-02 and desktop DI-02 close against the same
compatibility fixtures.

## Principles

- Public DTOs are not desktop Domain objects.
- Every message is runtime-validated.
- Commands, replies, events, and snapshots are discriminated unions.
- All values are JSON-safe.
- Machine-readable codes are stable; localized text is never transported.
- Protocol version is independent from npm package and desktop versions.

## Envelope Requirements

Every message identifies:

- protocol version;
- message kind;
- message type;
- server instance and session epoch after handshake;
- request ID for commands/replies or event ID and sequence for events;
- occurrence timestamp;
- payload validated by message type.

Unknown required fields, unsupported versions, invalid payloads, and oversized messages fail
closed with a stable error or connection close according to protocol policy.

## Handshake

The client hello contains:

- supported protocol range;
- SDK version;
- client application name and version;
- stable paired client ID when available;
- requested capabilities;
- client nonce.

The server hello contains:

- selected protocol version;
- desktop version;
- server instance ID and session epoch;
- server nonce;
- pairing or authentication challenge;
- maximum message size;
- heartbeat policy.

No product snapshot or PII is sent before authentication succeeds.

Proof-of-possession and pairing ceremony: **ADR-0016**.

**Desktop inbound ordering (normative for gateway):** for each WebSocket connection,
desktop processes inbound frames **strictly in receive order** (serialize async handlers
per connection). Clients may send `sdk:auth-proof` and immediately follow with `sdk:ping`
(or other commands) without an artificial delay; the gateway must not evaluate the ping
until proof handling has finished (success → `authenticated`, or fail-closed close).

**Exception — long activate hop:** `account:activate-profile` may wait on operator consent
for up to `SDK_ACTIVATE_CLIENT_TIMEOUT_MS`. That hop **must release** the per-connection
inbound queue while pending so client heartbeats (`sdk:ping`) are still answered. Holding
the queue for the whole consent wait causes SDK reconnect → bare `operation_failed` on the
in-flight activate (no `activate_phase`). Auth-proof ordering above is unchanged.

## Endpoint Discovery

Loopback HTTP discovery (not WS-only): **ADR-0015**.

- `GET http://127.0.0.1:17341/omnicall/v1/discovery`
- WebSocket: `ws://127.0.0.1:17341/omnicall/v1/ws`
- Response `discoveryVersion: 1` fields listed in ADR-0015; never contains secrets.

## Command Namespaces

### SDK lifecycle

- `sdk:get-snapshot`
- `sdk:ping`

### Window

- `window:show`
- `window:get-state`
- `window:hide` — privileged (`window.hide`); Origin matrix; telephony-busy deny; tray recovery (ADR-0013)

### Calls

- `call:originate`
- `call:answer`
- `call:reject`
- `call:hangup`
- `call:hold`
- `call:resume`
- `call:mute`
- `call:unmute`
- `call:send-dtmf`

### Account

- `account:activate-profile`
- `account:logout`

### Operator

- `operator:get-reasons`
- `operator:change-status`
- `operator:finish-appeal`

Protocol v1 does not include raw SIP or OCP credential commands.

Public operator/account mapping vs F-028 E-12: **ADR-0017** (O-OCP-1).

`operator:change-status` is the **only** public mutation for Ready/Break intent. Desktop
resolves mode from current OCP state (`auto`): idle → apply (`change_status_to_*`);
busy / post-call processing → reserve (`update_post_call_status`). Success result always
includes `kind: "applied" | "reserved"` plus `targetStatus` / `reasonId`. There is **no**
separate `operator:reserve-status` command (hosts must not decide mode client-side).

`operator:finish-appeal` applies the reserved Ready/Break (or default Ready) **only** while
the operator is in post-call processing. Missing OCP login → `not_found`. Wrong status →
`conflict` with `details.failure_kind: "not_in_post_call_processing"`. Capability:
`operator.status.write`. Public snapshot/event status includes `post_call_processing` so
hosts can enable the control without guessing. Optional additive fields
`reservedTarget` / `reservedReasonId` on snapshot operator section and
`operator:status-changed` expose the active post-call booking after reconnect (compatible
per ADR-0012).

## Event Namespaces

### Calls

- `call:incoming`
- `call:outgoing`
- `call:ringing`
- `call:answered`
- `call:ended`
- `call:failed`
- `call:held`
- `call:resumed`
- `call:muted`
- `call:unmuted`
- `call:acd-context` — OCP MainCallIDInfo wire (`acallid`, `main_acallid?`,
  `event`, `caller_id`, `called_id`, `queue`, `user_login`) + desktop `callId`;
  requires `ocp.acd_context.read` (ADR-0020). Optional helpers: `phase`, `direction`.

Call event / snapshot call-summary payloads may include additive optional
`queueLabel` (desktop-safe ACD title from F-028 OCP call context). Omitted when
unknown or direct/internal. Never carries OCP wire ids (`acallid`). Prefer
`call:acd-context` for CRM handlers that need `main_acallid`. See
`docs/softphone/OCP-Call-Context.md`.

Snapshot call summaries may also include additive optional `acdContext` — the
same OCP MainCallIDInfo snake_case fields as `call:acd-context` (without
repeating parent `callId`), gated by `ocp.acd_context.read` (ADR-0020). Stripped
without the capability. Used for reconnect recovery; live `call:acd-context`
remains the primary push path.

### Registration and account

- `registration:changed`
- `account:session-activated`
- `account:session-ended`

### Operator

- `operator:session-changed`
- `operator:status-changed`
- `operator:campaign-offered` — requires `operator.campaign.read` (ADR-0019)
- `operator:campaign-cleared` — requires `operator.campaign.read` (ADR-0019)

Campaign payloads are redacted (ADR-0017 O-PII-1): opaque `campaignId`,
`mode` (`preview` | `progressive`), optional masked `remoteNumber`, optional
desktop-safe labels (`companyLabel`, `strategyLabel`, `selectionLabel`,
`queueLabel`). Never OCP wire ids (`acallid`, `strategyCallId`, …). Accept/reject
commands remain out of v1 (desktop modal owns control). Cleared `reasonCode`
includes `superseded` for schema compatibility; desktop hold-until-idle for a
second preview does not emit that reason (see ADR-0019 / OCP-Call-Context).

### Window and SDK

- `window:visibility-changed`
- `sdk:permission-changed` — auth lifecycle (not in public `subscribe` surface); shares
  per-connection `sequence` with product events
- `sdk:revoked` — auth lifecycle; shares `sequence`; connection closes after delivery
- `sdk:server-shutdown` — public; desktop emits best-effort on controlled quit/stop
  (`app_quit` / `gateway_stop`) before tearing down sockets (ADR-0009)

Internal retry events, ringtone/tone events, raw SIP status codes, adapter events, headset
events, and raw OCP messages are not public events.

**Sequence invariant:** one monotonic `sequence` per authenticated connection for every
`kind: "event"` frame. Clients must advance their cursor for auth lifecycle events even
when those types are not exposed via `subscribe`, otherwise the next public event can
false-trigger `event.sequence_gap`. Desktop validates event candidates before bumping
sequence so a schema reject cannot punch a hole.

## Snapshot

The authenticated snapshot contains independently versioned sections:

- SDK session and granted capabilities;
- account session state;
- aggregated SIP registration/connectivity state;
- active call summaries (`queueLabel` for redacted session readers; optional
  `acdContext` wire when `ocp.acd_context.read` is granted);
- redacted operator/OCP state when enabled (coarse status; optional
  `reservedTarget` / `reservedReasonId` for post-call booking; optional
  `campaign` offer when `operator.campaign.read` is granted);
- window state;
- snapshot revision and server instance metadata.

Each field follows least privilege. Unauthorized sections are omitted, not filled with
placeholder sensitive values. Mask formats: **ADR-0017** (O-PII-1).

## Replies and Errors

Every command resolves to either:

- success with a typed result and resulting revision; or
- failure with a stable code, retryability, optional current revision, and safe details.

Initial error codes:

- `invalid_message`
- `invalid_payload`
- `unsupported_command`
- `incompatible_version`
- `unauthenticated`
- `forbidden`
- `revoked`
- `not_ready`
- `not_found`
- `not_owner`
- `conflict`
- `stale_state`
- `interaction_required`
- `timeout`
- `rate_limited`
- `operation_failed`
- `local_network_permission_required` — client-side / SDK mapping (not a desktop wire code)
- `local_network_permission_denied` — client-side / SDK mapping
- `discovery_unreachable` — client-side / SDK mapping
- `origin_blocked` — client-side / SDK mapping when desktop rejects the WebSocket upgrade
  for a blacklisted Origin (ADR-0018; no JSON frame on the wire)

Wire details keys (inside `forbidden` / related failures — no secrets):

- `origin_denied` — first-contact Origin Deny (typed reply then close)
- `permission_denied` — capability or Origin matrix deny (including activate disabled)
- `activate_denied_for_origin` — activate blocked for Origin after consent Deny / policy
- `activate_consent_pending` — optional details key with primary wire code `conflict` when
  a second activate arrives while the consent modal is open (ADR-0018)
- `activate_phase` — `"consent"` | `"sign_in"` on activate timeouts / sign-in failures
  (ADR-0018 timeout sync)
- `auth_mode` — `"sip_only"` | `"ocp"` when the failure occurred after mode selection
- `failure_kind` — allowlisted semantic key (`timeout`, `session_exist`,
  `credentials_timeout`, `http_failed`, `sip_not_registered`, …); never raw
  SIP/OCP exception text. For `call:originate`, desktop may reply
  `operation_failed` + `failure_kind: "sip_not_registered"` **without** emitting
  `call:outgoing` / `call:failed` when SIP REGISTER is not active (no call
  lifecycle side effects).

Activate wall budgets (constants in `@softomnitel/omnicall-protocol` / desktop
`src/shared/integration/sdkActivateTimeouts.ts`):

- Consent TTL: `SDK_ACTIVATE_CONSENT_TTL_MS` (120 s)
- SIP-only auth: `SDK_ACTIVATE_SIP_ONLY_AUTH_BUDGET_MS` (60 s)
- OCP auth: `SDK_ACTIVATE_OCP_AUTH_BUDGET_MS` (sum of desktop OCP stage timeouts + slack)
- Client/broker hop for `account:activate-profile` only:
  `SDK_ACTIVATE_CLIENT_TIMEOUT_MS` (~420 s = max Settings consent 300s + auth + hop).
  Operator modal countdown default remains 120 s. Other commands keep the default short hop.

Raw exceptions and upstream SIP/OCP messages never cross the boundary.

## Ownership, Idempotency, Revision

**ADR-0017** (O-OWN-1) + **ADR-0021** (shared desk):

- Snapshot may record informational `ownerClientId` after SDK originate/answer.
- **Control is capability-gated for any paired client** (not ownership-gated).
- Granular caps `call.answer|reject|hangup|hold|mute` or umbrella `call.control`
  (umbrella also covers DTMF).
- `expectedRevision` required on mutations; duplicate `requestId` returns cached reply
  scoped by **Origin + clientId** (ADR-0027; unauthenticated scoped by connection).
- SDK clients track **latest-known revision** from snapshots, successful replies,
  public events, and `stale_state.currentRevision` (ADR-0027); snapshot cache stays
  separate. Reconnect/revoke clears both. Never auto-replay mutations on revision advance.
- Disconnect does not end calls.
- Transfer / conference are not public SDK commands.

## Versioning and Deprecation

- Adding an optional response field is compatible.
- Adding a new command or event is compatible when old clients may ignore it.
- Removing, renaming, changing type, or changing semantics is breaking.
- Breaking changes require a new protocol major version and a compatibility window.
- Desktop supports the documented current and previous protocol versions during migration.
- Deprecation window: **ADR-0017** (≥90 days or two desktop minors, whichever longer).
- Golden fixtures are tested in both the SDK and desktop projects
  (`docs/COMPATIBILITY-FIXTURES.md`, ADR-0014).

## Runtime Schemas

Zod schemas in `@softomnitel/omnicall-protocol` are the source of truth; TypeScript types are inferred
(**ADR-0014** / O-SCHEMA-1). **SDK-02** implements schemas, validators, fixtures, and
compatibility helpers under `packages/protocol/`.

## Capability Profiles

Default approve-time profiles: **ADR-0016** (O-CAP-1) — `presentation`, `operator`,
`call_controller`. Privileged `account.activate` / `window.hide` are never default-granted.

## Browser Support

Chrome/Edge/Firefox with LNA allow on HTTPS CRM pages; Safari unsupported in P12
(**ADR-0015**, `evidence/SDK-01-browser-spike.md`).

## Closed Decisions (SDK-01)

Desktop DI-00 closed architecture policy in ADR-0009…0013. SDK-01 closed the precision rows
below with ADR-0014…0017. IDs match the P12 handoff.

| ID | Decision | Resolution | Blocks cleared for |
| --- | --- | --- | --- |
| O-SCHEMA-1 | Runtime schema library and canonical generation direction | ADR-0014 — Zod → inferred types | SDK-02, DI-01 |
| O-DISC-1 | Exact discovery URL/path, response schema, and versioning | ADR-0015 | SDK-03, DI-03 |
| O-DISC-2 | Discovery via tiny loopback HTTP helper vs WS-only bootstrap | ADR-0015 — HTTP helper | DI-03 |
| O-BRW-1 | Confirmed Chrome/Edge/Firefox policy matrix for HTTPS→loopback WS | ADR-0015 + browser spike | SDK-05 unit/integration |
| O-BRW-2 | Private Network Access / permission-prompt UX keys | ADR-0015 → DI-09 keys reserved | DI-09 |
| O-POP-1 | Proof-of-possession mechanism for paired clients | ADR-0016 — ECDSA P-256 | SDK-04, DI-04 |
| O-POP-2 | Pairing ceremony / approve payload shape with desktop | ADR-0016 | DI-04, DI-09 |
| O-CAP-1 | Default capability sets per pairing profile | ADR-0016 | DI-04 |
| O-PII-1 | Exact PII redaction levels / mask formats | ADR-0017 | SDK-05, DI-05 |
| O-OWN-1 | Exact call ownership and lease semantics | ADR-0017 | SDK-06, DI-06 |
| O-CAMP-1 | Whether campaign events enter v1 or a later capability | ADR-0017 deferred → **ADR-0019** admits `operator:campaign-*` + `operator.campaign.read` | SDK-05, DI-05 |
| O-OCP-1 | Public operator field names vs F-028 E-12 map | ADR-0017 | DI-07 |

Policy baselines (still closed from DI-00 / ADR-0018): loopback-only bind, exact Origin
match with TOFU/blacklist admission (ADR-0018), discovery CORS for `unknown`+`allowed`,
no raw credentials in v1, per-client events, `window:hide` gated, Account sole human
sign-in (ADR-AF-003) with saved-account login activation + per-attempt consent modal
(ADR-0018). Always-on gateway listener (no normal Settings off toggle; env kill-switch
only). F-011 close requires DI-11 behavior (or waiver), not docs alone.

No implementation agent may reopen these rows implicitly in production code without a new ADR.
