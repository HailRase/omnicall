# RAT Progress

> **OCP (step 06 / R5): DEFERRED** per [ADR-0002](../adr/ADR-0002-defer-ocp-plugin.md) and [OCP-PLUGIN-BACKLOG.md](../OCP-PLUGIN-BACKLOG.md).
> **Transfer (step 07 / 07b / R6): BACKLOG** per [TRANSFER-REAL-ADAPTER-BACKLOG.md](./TRANSFER-REAL-ADAPTER-BACKLOG.md).
> **Active track:** **P11 WU0** shell layout + overlay UX → **F-008 DTMF real** → P10 headset. RAT steps 00–08 **closed**.

**Branch:** feature/real-adapters

**Base snapshot:** `00-SNAPSHOT.md` (2026-06-24, 488 tests)

**Canonical automated tests (2026-06-25):** **640 passed, 1 skipped** — authoritative count for summary table and gates. Per-step `Automated:` lines below are historical snapshots unless they match 640.


| Step | Status | Date | Agent notes | Tests | Smoke |

| --- | --- | --- | --- | --- | --- |

| 00 Branch & guardrails | done | 2026-06-24 | Registry RAT notes F-001/002/003/009; guardrails closed; no src/ changes; commit — | 488 | n/a |

| 01 Adapter mode bootstrap | done | 2026-06-24 | adapterMode resolver; createSoftphoneComposition dispatcher; mock extracted; real stub; renderer wired | 496 (+8) | n/a |

| 02 JsSIP registration | done | 2026-06-24 | JsSipTelephonyAdapter; resolveJsSipTransportUrl; registration lifecycle; reconnect UX (countdown/in-progress); createRealAccountBootstrap | 558 | R1 **pass** (manual 2026-06-24) |

| 03 Browser media | done | 2026-06-24 | BrowserMediaAdapter (WebAudio tones, hidden audio, mute/unmute); JsSip peer-connection hook; real bootstrap wired | 558 | R2 **pass** (manual 2026-06-24) |

| 04 Call lifecycle in/out | done | 2026-06-24 | makeCall/incoming/answer/reject/hangup/callEnded; bindPeerConnection; outbound `confirmed` bridge; `ensureJsSipRtcSessionPort` incoming | 558 | R3 **pass** (manual 2026-06-24) |

| 05 Hold / mute real | done | 2026-06-24 | holdCall/resumeCall re-INVITE; BrowserMediaAdapter mute verified; error banner already wired | 558 | R4 **pass** (manual 2026-06-24) |

| 06 OCP WebSocket | **deferred** | 2026-06-24 | Code landed (WS adapters); R5 smoke **out of scope** per ADR-0002 — resume via OCP-PLUGIN-BACKLOG | 574 | R5 **deferred** |

| 07 Transfer | **backlog** | 2026-06-25 | JsSIP REFER blind/attended landed; on-net blind PASS; attended unverified — see TRANSFER-REAL-ADAPTER-BACKLOG | 599 | R6 partial |
| 07b External Refer-To | **backlog** | 2026-06-25 | `buildBlindReferTarget`; off-net B,C FAIL — paused per user; resume via backlog doc | 599 | R6 B,C **FAIL** |
| 08 Multi-call real | **done** | 2026-06-25 | R7-1…R7-5 PASS manual dev SBC; R7-5 via temp `InMemorySettingsRepository` default | 640 | R7 **closed** |



## Current focus (2026-06-25)

**RAT SIP core (steps 00–08):** **closed** — R7 multi-call PASS (R7-1…R7-5).

**UI track (P11):** WU0 shell layout — `handoffs/P11-WU0-Shell-Layout-Agent-Prompt.md`, `UI-Architecture.md`, `UI-Design-System.md`. WU1: Settings overlay + `multiSessionsEnabled` (re-smoke R7-5 without repo hack). See `UI-SMOKE-ENABLERS.md`.

**Next adapter:** F-008 DTMF real, P10 headset, merge `feature/real-adapters`.

**Backlog:** transfer R6; OCP R5 (ADR-0002); Tone FSM (`MULTI-CALL-BACKLOG.md`).

| Area | Status |
| --- | --- |
| P05 WU6 multi-call (mock) | done |
| P11 WU0 shell layout | **pending** — docs + deps ready |
| P11 WU1 settings overlay | pending after WU0 |
| Transfer real SBC | backlog |
| P08 WU5 logout | done |

## Where we stopped (2026-06-25)

- **OCP / R5:** deferred (ADR-0002).
- **SIP core R1–R4:** closed.
- **R6 transfer:** backlog — partial (A,D pass; B,C fail; attended pending).
- **Canonical tests:** 640 passed, 1 skipped; lint/typecheck green.
- **RAT step 08:** **done** — R7-1…R7-5 PASS manual 2026-06-25 (R7-5: temp repo default `multiSessionsEnabled=false`).



## Step 02 smoke notes (R1) — 2026-06-24

> **Superseded counts:** automated line below is a step snapshot; canonical **558 passed, 1 skipped**.

**Environment:** Electron `npm run dev`, `VITE_ADAPTER_MODE=real`, `.env.local` (onedemoserver.online:5063 → `wss://…:5063/`).

**Automated (step snapshot):** `npm run test` 508 passed, 1 skipped (`SIP_SANDBOX`); lint/typecheck green.

| R1 checklist | Result |

| --- | --- |

| Manual SIP form registers | **OK** — user verified on dev SBC |

| PhoneStatusBadge → Online | **OK** — registration succeeded |

| Wrong password → RegistrationFailed | **PASS** — manual smoke 2026-06-24 |

| Disconnect network → ConnectionOverlay SIP | **PASS** — `connection-overlay` + `connection-channel-sip` Reconnecting |

| Reconnect / manual retry | **PASS (auto)** — network restore clears overlay; manual retry N/A (auto in progress); UX fixes in reconnect phase |



**Fixes applied before smoke:** CSP + preload CJS; `resolveJsSipTransportUrl`; no `teardownUa` on `registrationFailed`; `registrationInFlight` transport guard.



## Step 03 smoke notes (R2) — 2026-06-24

> **Superseded:** R2 items below were blocked at step 03; closed in manual session R2+R3+R4 (see end of file). Canonical tests **558 passed, 1 skipped**.

**Environment:** Electron `npm run dev`, `VITE_ADAPTER_MODE=real`, `.env.local` (dev SBC).

**Automated (step snapshot):** `npm run test` 515 passed, 1 skipped; lint/typecheck green.

| R2 checklist | Result |
| --- | --- |
| Incoming ringtone audible | **PASS** — manual R2+R3+R4 session (R2-1) |
| Ringtone stops on answer | **PASS** — manual R2+R3+R4 session (R2-2) |
| Remote audio audible both directions | **PASS** — manual R2+R3+R4 session (R2-3) |

**Implemented this step:** `BrowserMediaAdapter` wired in `createRealAccountBootstrap`; adapter-private `getPeerConnectionForCall` / `bindPeerConnection` on `JsSipTelephonyAdapter`; unit tests for tones, attachRemoteAudio, mute/unmute.

## Step 04 smoke notes (R2 close-out + R3) — 2026-06-24

> **Superseded:** `pending manual` rows below closed in manual session R2+R3+R4. Canonical tests **558 passed, 1 skipped**.

**Environment:** Electron `npm run dev`, `VITE_ADAPTER_MODE=real`, `.env.local` (dev SBC).

**Automated (step snapshot):** `npm run test` 525 passed, 1 skipped; lint/typecheck green.

| R2 checklist (unblocked) | Result |
| --- | --- |
| Incoming ringtone audible | **PASS** — manual R2+R3+R4 session (R2-1) |
| Ringtone stops on answer | **PASS** — manual R2+R3+R4 session (R2-2) |
| Remote audio audible both directions | **PASS** — manual R2+R3+R4 session (R2-3) |

| R3 checklist | Result |
| --- | --- |
| Outgoing answered call | **PASS** — manual R2+R3+R4 session (R3-1) |
| Incoming answered call | **PASS** — manual R2+R3+R4 session (R3-2) |
| Reject incoming | **PASS** — manual R2+R3+R4 session (R3-3) |
| Hangup ends call, UI → idle | **PASS** — manual R2+R3+R4 session (R3-4) |
| DND rejects with 486 | **PASS** — manual R2+R3+R4 session (R3-5) |

**Implemented this step:** `JsSipTelephonyAdapter` call lifecycle (makeCall progress/answered/failed, newRTCSession incoming, answer/reject/hangup, setCallEndedHandler); peer-connection bind/unbind on RTC session lifecycle; adapter unit tests (+10).

## Step 05 smoke notes (R4) — 2026-06-24

> **Superseded:** `pending manual` rows below closed in manual session R2+R3+R4. Canonical tests **558 passed, 1 skipped**.

**Environment:** Electron `npm run dev`, `VITE_ADAPTER_MODE=real`, `.env.local` (dev SBC).

**Automated (step snapshot):** `npm run test` 541 passed, 1 skipped; lint/typecheck green.

| R4 checklist | Result |
| --- | --- |
| Hold / resume | **PASS** — manual R2+R3+R4 session (R4-1) |
| Mute / unmute | **PASS** — manual R2+R3+R4 session (R4-2) |

| R2+R3 (carry-over) | Result |
| --- | --- |
| Incoming ringtone / remote audio | **PASS** — R2-1/2/3 |
| Outgoing/incoming answer, reject, hangup, DND | **PASS** — R3-1/2/3/4/5 |

**Implemented this step:** `JsSipTelephonyAdapter.holdCall`/`resumeCall` via `executeJsSipHoldResume`; `JsSipRtcSessionPort` hold/unhold; adapter unit tests (+16); `ActiveCallControlsPanel` error banner verified (existing P04 wiring).

## Manual smoke session R2+R3+R4 — 2026-06-24

> **Superseded counts:** automated line below is a post-fix snapshot; canonical **558 passed, 1 skipped**.

**Environment:** Electron `npm run dev`, `VITE_ADAPTER_MODE=real`, `.env.local` (dev SBC onedemoserver.online).

**Automated (post-fix snapshot):** `npm run test` 551 passed, 1 skipped; lint/typecheck green.

**Fixes applied during smoke (before/during retest):**

- Outbound: `setCallAnsweredHandler` + `confirmed`/`accepted` lifecycle; ringback on SIP 180 and 183; `notifyPeerConnectionAvailable` + deferred `attachRemoteAudio`; `createConsoleLogger` in real bootstrap.
- Incoming: `ensureJsSipRtcSessionPort` in `handleNewRtcSession` (fixes `session.getConnection is not a function`).

| ID | Checklist | Result | Notes |
| --- | --- | --- | --- |
| R2-1 | Incoming ringtone audible | **PASS** | retest R3-2 |
| R2-2 | Ringtone stops on answer | **PASS** | retest R3-2 |
| R2-3 | Remote audio both directions | **PASS** | outgoing + incoming |
| R3-1 | Outgoing answered call | **PASS** | UI `activeCallDtmfMode`, state Active after answer |
| R3-2 | Incoming answered call | **PASS** | modal + answer flow |
| R3-3 | Reject incoming | **PASS** | modal closed, idle, ringtone stopped |
| R3-4 | Hangup → UI idle | **PASS** | verified on outgoing |
| R3-5 | DND rejects with 486 | **PASS** | no modal; SIP 486 to server; auto-reject |
| R4-1 | Hold / resume | **PASS** | outgoing retest R3-1 |
| R4-2 | Mute / unmute | **PASS** | outgoing retest R3-1 |

## Manual smoke session R1 carry-over — 2026-06-24

| ID | Checklist | Result | Notes |
| --- | --- | --- | --- |
| R1-3 | Wrong password → RegistrationFailed | **PASS** | |
| R1-4 | Disconnect network → ConnectionOverlay SIP | **PASS** | SIP row Reconnecting, attempt counter |
| R1-5 | Reconnect / manual retry | **PASS (auto)** | overlay cleared on network restore; manual retry not exercised (disabled during auto-reconnect) |

**UX follow-up (implemented same day):** `SipReconnectAttemptStarted` / countdown 1s tick / «Reconnecting now…» in-progress phase; debounce duplicate transport disconnect in orchestration.

**R1 gate:** **closed** (sip-only dev SBC).

**R2+R3+R4 gate:** **closed** (see session below).

**Next track work:** main roadmap — P08 SIP recovery, F-008 DTMF real, P10 headset, merge `feature/real-adapters` for R1–R4. Transfer: **backlog** (`TRANSFER-REAL-ADAPTER-BACKLOG.md`). OCP step 06 / R5 **deferred** (ADR-0002).

## Step 06 notes (R5 — DEFERRED) — 2026-06-24

> **Superseded by ADR-0002.** R5 manual smoke is **not** an active gate. Resume via `OCP-PLUGIN-BACKLOG.md`.

**Code landed (dormant):** `OcpWebSocketTransport`; `WebSocketOperatorPlatformGateway`; `WebSocketOcpSyncGateway`; `setInboundRawHandler`; `wireOcpInboundToFacade`; `VITE_OCP_*` env.

**Automated:** 574 passed, 1 skipped; lint/typecheck green.

| R5 checklist | Result |
| --- | --- |
| OCP auth success path | **deferred** |
| Status Ready / Break | **deferred** |
| Queue name on incoming | **deferred** |
| Campaign modal accept/reject | **deferred** |

**R5 gate:** **deferred** — not required for SIP core delivery.

## Step 07 smoke notes (R6) — 2026-06-24

**Environment:** Electron `npm run dev`, `?adapters=real`, `.env.local` (dev SBC onedemoserver.online); two test extensions required.

**Automated:** `npm run test` 582 passed, 1 skipped; lint/typecheck green.

**Implemented this step:** `executeJsSipRefer`; `JsSipTelephonyAdapter.blindTransfer` / `attendedTransfer` via REFER + Replaces; ADR-0003 REFER semantics; adapter unit tests (+8).

| R6 checklist | Result |
| --- | --- |
| Blind transfer to second extension | **pending manual** |
| Attended transfer with consultation | **pending manual** |
| Transfer failure banner + retry | **pending manual** |

**R6 gate:** **open** — close after manual smoke matrix A–D on dev SBC.

## Step 07b notes (external Refer-To) — 2026-06-24

**Environment:** Electron `npm run dev`, `?adapters=real`, `.env.local` (dev SBC onedemoserver.online).

**Automated:** `npm run test` 599 passed, 1 skipped; lint/typecheck green.

**Implemented:** `buildBlindReferTarget` + `classifyReferTargetKind`; `executeJsSipRefer` NOTIFY mapping + 202/ended lifecycle; `referInFlightCallIds`; transfer projection recovery; ADR-0003; step-07b prompt doc.

**User manual smoke matrix (final session 2026-06-24):**

| ID | Scenario | Result | Notes |
| --- | --- | --- | --- |
| A | Incoming client → blind transfer internal operator | **PASS** | on-net extension |
| B | Incoming operator → blind transfer external client | **FAIL** | off-net / PSTN |
| C | Outgoing to operator → blind transfer external client | **FAIL** | off-net / PSTN |
| D | Outgoing to client → blind transfer internal operator | **PASS** | on-net extension |

**R6 gate:** **backlog** — see `TRANSFER-REAL-ADAPTER-BACKLOG.md`.

**07b gate:** **backlog** — paused 2026-06-25; resume via SIP trace + `TRANSFER-REAL-ADAPTER-BACKLOG.md`.

## Step 08 notes (R7 multi-call) — 2026-06-25

**Environment:** Electron `npm run dev`, `?adapters=real`, `.env.local` (dev SBC onedemoserver.online); two test extensions required.

**Automated:** `npm run test` 640 passed, 1 skipped; lint/typecheck green.

**Implemented this step:**

- `JsSipTelephonyAdapter` audit: per-call `sessions` Map; independent hold/resume re-INVITE; hangup unbinds one session only (+3 adapter unit tests: R7-1, R7-2, R7-4 scenarios).
- `BrowserMediaAdapter`: exclusive remote audio attach (C1) — pauses other lines on active attach (+1 unit test).
- `telephonyCallControlOperations.executeResumeCall`: `attachRemoteAudioWhenReady` after successful unhold (R7-3 audio swap).

| R7 checklist | Result |
| --- | --- |
| R7-1 Second outgoing with first held | **PASS** — manual 2026-06-25 |
| R7-2 Answer incoming with active held | **PASS** — manual 2026-06-25 |
| R7-3 Exclusive resume swap | **PASS** — manual 2026-06-25 |
| R7-4 Hangup active, held remains (D1) | **PASS** — manual 2026-06-25 |
| R7-5 multiSessions OFF → auto-486 | **PASS** — manual 2026-06-25; smoke via temp `InMemorySettingsRepository` default `false` (no settings UI yet) |

**R7 gate:** **closed** (R7-1…R7-5 PASS). Follow-up: P11 UI for `multiSessionsEnabled` toggle.

## Dev credentials



Copy `docs/softphone/real-integration/env.local.example` → `.env.local` at repo root.


