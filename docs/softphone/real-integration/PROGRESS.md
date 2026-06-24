# RAT Progress



**Branch:** feature/real-adapters

**Base snapshot:** `00-SNAPSHOT.md` (2026-06-24, 488 tests)



| Step | Status | Date | Agent notes | Tests | Smoke |

| --- | --- | --- | --- | --- | --- |

| 00 Branch & guardrails | done | 2026-06-24 | Registry RAT notes F-001/002/003/009; guardrails closed; no src/ changes; commit — | 488 | n/a |

| 01 Adapter mode bootstrap | done | 2026-06-24 | adapterMode resolver; createSoftphoneComposition dispatcher; mock extracted; real stub; renderer wired | 496 (+8) | n/a |

| 02 JsSIP registration | done | 2026-06-24 | JsSipTelephonyAdapter; resolveJsSipTransportUrl (legacy parity); registration lifecycle fix; Electron CSP/preload/CJS; createRealAccountBootstrap; readSipEnvDefaults | 508 (+20) | R1 **pass** (partial — see notes) |

| 03 Browser media | done | 2026-06-24 | BrowserMediaAdapter (WebAudio tones, hidden audio, mute/unmute); JsSip peer-connection hook; real bootstrap wired | 551 | R2 **pass** (manual 2026-06-24) |

| 04 Call lifecycle in/out | done | 2026-06-24 | makeCall/incoming/answer/reject/hangup/callEnded; bindPeerConnection; outbound `confirmed` bridge; `ensureJsSipRtcSessionPort` incoming | 551 | R3 **pass** (manual 2026-06-24) |

| 05 Hold / mute real | done | 2026-06-24 | holdCall/resumeCall re-INVITE; BrowserMediaAdapter mute verified; error banner already wired | 551 | R4 **pass** (manual 2026-06-24) |

| 06 OCP WebSocket | pending | | | | |

| 07 Transfer (deferred) | pending | | | | |



## Current blocker



(none)



## Step 02 smoke notes (R1) — 2026-06-24



**Environment:** Electron `npm run dev`, `VITE_ADAPTER_MODE=real`, `.env.local` (onedemoserver.online:5063 → `wss://…:5063/`).



**Automated:** `npm run test` 508 passed, 1 skipped (`SIP_SANDBOX`); lint/typecheck green.



| R1 checklist | Result |

| --- | --- |

| Manual SIP form registers | **OK** — user verified on dev SBC |

| PhoneStatusBadge → Online | **OK** — registration succeeded |

| Wrong password → RegistrationFailed | not verified this session |

| Disconnect network → ConnectionOverlay SIP | not verified this session |

| Reconnect / manual retry | not verified this session |



**Fixes applied before smoke:** CSP + preload CJS; `resolveJsSipTransportUrl`; no `teardownUa` on `registrationFailed`; `registrationInFlight` transport guard.



## Step 03 smoke notes (R2) — 2026-06-24

**Environment:** Electron `npm run dev`, `VITE_ADAPTER_MODE=real`, `.env.local` (dev SBC).

**Automated:** `npm run test` 515 passed, 1 skipped; lint/typecheck green.

| R2 checklist | Result |
| --- | --- |
| Incoming ringtone audible | **blocked** until RAT step 04 (incoming call handler + `playRingtone` path) |
| Ringtone stops on answer | **blocked** until step 04 |
| Remote audio audible both directions | **blocked** until step 04 (`bindPeerConnection` + answer flow) |

**Implemented this step:** `BrowserMediaAdapter` wired in `createRealAccountBootstrap`; adapter-private `getPeerConnectionForCall` / `bindPeerConnection` on `JsSipTelephonyAdapter`; unit tests for tones, attachRemoteAudio, mute/unmute.

## Step 04 smoke notes (R2 close-out + R3) — 2026-06-24

**Environment:** Electron `npm run dev`, `VITE_ADAPTER_MODE=real`, `.env.local` (dev SBC).

**Automated:** `npm run test` 525 passed, 1 skipped; lint/typecheck green.

| R2 checklist (unblocked) | Result |
| --- | --- |
| Incoming ringtone audible | **pending manual** — incoming handler + `playRingtone` path wired |
| Ringtone stops on answer | **pending manual** — answer + `stopRingtone` path wired |
| Remote audio audible both directions | **pending manual** — `bindPeerConnection` on session + `attachRemoteAudio` wired |

| R3 checklist | Result |
| --- | --- |
| Outgoing answered call | **pending manual** |
| Incoming answered call | **pending manual** |
| Reject incoming | **pending manual** |
| Hangup ends call, UI → idle | **pending manual** |
| DND rejects with 486 | **pending manual** |

**Implemented this step:** `JsSipTelephonyAdapter` call lifecycle (makeCall progress/answered/failed, newRTCSession incoming, answer/reject/hangup, setCallEndedHandler); peer-connection bind/unbind on RTC session lifecycle; adapter unit tests (+10).

## Step 05 smoke notes (R4) — 2026-06-24

**Environment:** Electron `npm run dev`, `VITE_ADAPTER_MODE=real`, `.env.local` (dev SBC).

**Automated:** `npm run test` 541 passed, 1 skipped; lint/typecheck green.

| R4 checklist | Result |
| --- | --- |
| Hold / resume | **pending manual** — `holdCall`/`resumeCall` re-INVITE wired |
| Mute / unmute | **pending manual** — local `track.enabled` via `BrowserMediaAdapter` |

| R2+R3 (carry-over) | Result |
| --- | --- |
| Incoming ringtone / remote audio | **pending manual** |
| Outgoing/incoming answer, reject, hangup, DND | **pending manual** |

**Implemented this step:** `JsSipTelephonyAdapter.holdCall`/`resumeCall` via `executeJsSipHoldResume`; `JsSipRtcSessionPort` hold/unhold; adapter unit tests (+16); `ActiveCallControlsPanel` error banner verified (existing P04 wiring).

## Manual smoke session R2+R3+R4 — 2026-06-24

**Environment:** Electron `npm run dev`, `VITE_ADAPTER_MODE=real`, `.env.local` (dev SBC onedemoserver.online).

**Automated (post-fix):** `npm run test` 551 passed, 1 skipped; lint/typecheck green.

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

**R1 carry-over (optional):** wrong password, disconnect overlay, reconnect — not verified this session.

**R2+R3+R4 gate:** **closed** (all checklist items PASS on dev SBC, 2026-06-24).

**Next track work:** RAT step 06 — R5 OCP WebSocket manual smoke (after implementation).

## Dev credentials



Copy `docs/softphone/real-integration/env.local.example` → `.env.local` at repo root.


