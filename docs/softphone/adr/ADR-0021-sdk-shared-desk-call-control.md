# ADR-0021: SDK shared desk call control + granular call capabilities

- Status: Accepted
- Date: 2026-07-27
- Deciders: Softphone platform
- Related: ADR-0017 (O-OWN-1), ADR-0018 (Origin matrix), F-011 / DI-06

## Context

Protocol v1 (ADR-0017 O-OWN-1) gated `call.control` mutations on SDK call ownership:
only the `clientId` that originated or answered a call could hold/mute/hangup. UI- or
headset-started calls had no SDK owner → hosts received `not_owner`. CRM integrators
need a **shared desk**: any Origin that completed pairing + PoP and has live
`pairing ∩ Origin matrix` grants must control the same OmniCall call surface, and a
fresh tab/browser after its own pairing must see the same redacted snapshot/events.

Operators also need **per-action** Origin matrix toggles (answer / reject / hangup /
hold / mute), not only the coarse `call.control` umbrella.

Transfer and conference remain out of the public SDK surface.

## Decision

### 1. Shared desk control (amends O-OWN-1 control gate)

- Any authenticated session with the required capability may execute
  `call:answer|reject|hangup|hold|resume|mute|unmute|send-dtmf` for a live desktop call.
- Ownership registry remains **informational** (`ownerClientId` on snapshot/events after
  SDK originate/answer). It does **not** deny cross-client control.
- Wire code `not_owner` stays reserved for future/other surfaces; call router no longer
  emits it for the shared-desk control path.
- Concurrency remains `expectedRevision` + per-call mutex + `requestId` idempotency.
- Disconnect/revoke still never ends SIP calls (ADR-0016/0017).

### 2. Granular capabilities (additive, no downgrade)

New capability IDs (protocol v1 additive):

| Capability | Commands |
| --- | --- |
| `call.answer` | `call:answer` |
| `call.reject` | `call:reject` |
| `call.hangup` | `call:hangup` |
| `call.hold` | `call:hold`, `call:resume` |
| `call.mute` | `call:mute`, `call:unmute` |

- Umbrella `call.control` remains valid and implies all granular actions **plus**
  `call:send-dtmf`.
- Authorization: `sessionHasCapability(granted, required)` → required present **or**
  (required is granular **and** `call.control` present).
- Pairing profile `call_controller` defaults include umbrella **and** granular ids.
- Live ceiling: expand pairing `call.control` → granular, then `∩` Origin matrix
  (ADR-0018 §D preserved).

### 3. Origin matrix UX + migration

- Settings matrix exposes originate + umbrella + granular rows.
- Toggling umbrella mirrors all granular; toggling granular sets umbrella = AND(granular).
- Persisted matrices missing granular keys inherit booleans from stored `call.control`
  (no wipe; no silent enable when umbrella was false).
- Write/load normalize (`normalizeSdkOriginCallMatrix`): `call.control` = AND(granular).
  Never silent-enables granular; clears umbrella when any granular row is false so
  hand-edited IPC/settings blobs cannot keep `call.control:true` while e.g. hold is off
  (umbrella would otherwise still authorize hold via `sessionHasCapability`).

### 4. State identity across clients

- Snapshot + event fan-out already project desktop Call Engine state. After a new
  browser completes Origin trust + pairing + PoP + matrix, `sdk:get-snapshot` and
  subscribed events match other authorized clients for the same OmniCall instance.
- No per-tab private call copy.

### 5. Non-goals

- No SDK transfer / conference.
- No silent ownership steal semantics (ownership is non-authoritative).
- No change to SIP-only bootstrap or OCP optional path.

## Consequences

- Desktop DI-06 call handler, gateway capability map, protocol package, SDK client
  guards, Settings i18n, and F-011 registry notes update in the same change set.
- Existing pairings that only stored `call.control` keep working via umbrella expand.
- Existing Origin matrices without granular keys migrate from `call.control`.
- Docs: PROTOCOL.md, SECURITY.md, capabilities guide, ADR-0017 supersession note.

## Architecture Checks

- Single renderer Application composition; main stays transport/auth only.
- Commands still terminate in Facade / Use Cases / Call Engine with `callType: "sdk"`.
- Additive protocol capability ids; no removal of `call.control`.
