# RAT Progress



**Branch:** feature/real-adapters

**Base snapshot:** `00-SNAPSHOT.md` (2026-06-24, 488 tests)



| Step | Status | Date | Agent notes | Tests | Smoke |

| --- | --- | --- | --- | --- | --- |

| 00 Branch & guardrails | done | 2026-06-24 | Registry RAT notes F-001/002/003/009; guardrails closed; no src/ changes; commit — | 488 | n/a |

| 01 Adapter mode bootstrap | done | 2026-06-24 | adapterMode resolver; createSoftphoneComposition dispatcher; mock extracted; real stub; renderer wired | 496 (+8) | n/a |

| 02 JsSIP registration | done | 2026-06-24 | JsSipTelephonyAdapter; resolveJsSipTransportUrl (legacy parity); registration lifecycle fix; Electron CSP/preload/CJS; createRealAccountBootstrap; readSipEnvDefaults | 508 (+20) | R1 **pass** (partial — see notes) |

| 03 Browser media | done | 2026-06-24 | BrowserMediaAdapter (WebAudio tones, hidden audio, mute/unmute); JsSip peer-connection hook; real bootstrap wired | 515 (+7) | R2 **partial** (see notes) |

| 04 Call lifecycle in/out | done | 2026-06-24 | makeCall/incoming/answer/reject/hangup/callEnded; bindPeerConnection on session lifecycle; mapTelephonyIncomingNotification wired | 525 (+10) | R2+R3 **pending manual** (see notes) |

| 05 Hold / mute real | pending | | | | |

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

## Dev credentials



Copy `docs/softphone/real-integration/env.local.example` → `.env.local` at repo root.


