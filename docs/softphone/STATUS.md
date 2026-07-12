# Project Status (live)

> **Authoritative snapshot for agents.** Update after each closed WU or RAT step. Reviewer skills read this during Discovery.

**Updated:** 2026-07-12  
**Tests:** 1844 passed, 1 skipped (`npm run test`); typecheck green; targeted video/shell layout tests — last verified 2026-07-12 (P13 WU9/WU10 gate doc sync)  
**Lint / typecheck:** green (last verified 2026-07-12)

**Guides (onboarding):** [`guides/README.md`](../../guides/README.md) — установка, пользователь, агенты Cursor, релизы.

## Active phase

**P10 — Headset integration (F-012)** — **done** (`handoffs/P10-Headset-Integration-Handoff.md`)

**P13 — Video calls (F-027)** — **in progress** (WU1–WU7 + Settings Video UI + WU9a/b/WU10 stability done; WU8 SBC smoke next)

| WU | Status | Notes |
| --- | --- | --- |
| WU1 Domain + ports | done | `CallMediaMode`, `CallVideoMediaState`, `LocalMediaCapturePort`, ADR-0008 |
| WU2 Settings schema | done | `UserSettings` v5 video prefs; `P13-Video-Call-Settings-Schema.md` |
| WU3 Application plumbing | done | per-call mediaMode through Use Cases/CallEngine/gateways; SDP still audio |
| WU4 Browser capture adapter | done | `BrowserLocalMediaCaptureAdapter` + mock; gUM/stub/replaceTrack/`onended` |
| WU5 JsSIP video enablement | done | video SDP, optional local capture, remote SDP detection, video codec prefs |
| WU6 UI dial + surfaces | done | dual dial; `CallVideoSurface`; cam/screen/view controls; store projection |
| WU7 Incoming video answer | done | Answer + Answer with video; hold disables cam/screen controls |
| Settings Video UI | done | Settings → Video: devices, preview, default view, auto-fullscreen |
| WU9a/b + WU10 | done | `handoffs/P13-Video-Calls-WU9-WU10-Handoff.md` — answer gate, picker, fullscreen UX, stability |
| WU8 SBC smoke + close | pending | checklist `handoffs/P13-Video-Calls-WU8-SBC-Smoke-Checklist.md`; needs manual SBC |

Design: `P13-Video-Calls-Design.md`. ADR: `adr/ADR-0008-video-calls-media-mode.md`.

**P11 — Settings, Personalization, Shell UX**

| WU | Status | Handoff |
| --- | --- | --- |
| WU0 Shell layout | done | `handoffs/P11-WU0-Shell-Layout-Handoff.md` |
| WU1 Settings overlay | done | `handoffs/P11-WU1-Settings-Overlay-Handoff.md` |
| WU2 Call line UX | done | `handoffs/P11-WU2-Call-Line-UX-Handoff.md` |
| WU3 Header collapsed | done | `handoffs/P11-WU3-Header-Collapsed-Handoff.md` |
| WU4 Settings schema | done | `handoffs/P11-WU4-Settings-Schema-Handoff.md` |
| WU5 UI-4 CSS Modules | done | `handoffs/P11-WU5-UI-4-Final-Gate-Handoff.md` |
| Post-WU5 shell polish | done | `handoffs/P11-Post-WU5-Shell-Polish-Handoff.md` |
| Call UI design parity (T-007) | done | `handoffs/P11-Call-UI-Design-Parity-Handoff.md` |
| F-023 Local account profiles (T-011) | done | `P11-Local-Account-Profiles-Design.md` |
| F-024 Saved SIP profiles (T-012) | done | `handoffs/P11-F024-Saved-Account-Profiles-Handoff.md` |

**P11 phase gate:** WU0–WU5 + post-WU5 polish + Call UI parity **done**. **T-008** SIP transport/register refactor **done** (LF-009/LF-057 header + «Состояние системы»). **F-022 / LF-084 codec preferences** **done** (T-009 UI + T-010 adapter, `5692747`…`bb085f8`). Remaining for phase close: UI-6 Radix modals, draggable widget (LF-056), toast placement (LF-060). **LF-082 theme** done 2026-06-26.

## Next work (priority)

See also: `TASK-QUEUE.md` for agent claim/done workflow.

1. **F-027** WU8 manual SBC smoke (checklist) → then registry **implemented** — `handoffs/P13-Video-Calls-WU8-SBC-Smoke-Checklist.md`
2. P11 polish: UI-6 Radix modals — `/ui`
3. **F-008** DTMF real adapter — `/adapter`
4. P12 host API foundation

**Recently closed (TASK-QUEUE):** **T-013 / F-013** call history outcome/endReason/durations (`39afae2`, `handoffs/P09-F013-Call-History-Display-Logic-Handoff.md`), **P10 / F-012** headset Web HID integration (`handoffs/P10-Headset-Integration-Handoff.md`, ADR-0007), RAT SIP core merged to `main` (`feature/real-adapters` stale ancestor), **F-024** saved SIP account profiles (`0a2ae05`, `handoffs/P11-F024-Saved-Account-Profiles-Handoff.md`), **F-023** local account profiles + disk persistence (T-011), **F-022 / T-009 / T-010** codec preferences (LF-084), **T-008** SIP transport/register state refactor (`TRANSPORT-REGISTER-STATE-REFACTORING.md`), T-007 Call UI design parity (`handoffs/P11-Call-UI-Design-Parity-Handoff.md`), post-WU5 shell polish (`handoffs/P11-Post-WU5-Shell-Polish-Handoff.md`), T-005 fullscreen settings panel, T-001 icon tooltips, T-002 AppIcon wiring, **F-014 SIP registration retry** (`handoffs/P08-SIP-Registration-Retry-Handoff.md`).

## RAT (Real Adapter Track)

| Item | Status |
| --- | --- |
| Branch | `main` (RAT merged; `feature/real-adapters` stale) |
| Steps 00–08 | **closed** (R7 multi-call PASS) |
| Legacy operator integration step | **removed** (ADR-0005) |
| Transfer step 07 / R6 | **backlog** |
| Baseline snapshot | `real-integration/00-SNAPSHOT.md` (historical 488) |
| Live progress | `real-integration/PROGRESS.md` |

## Backlog (do not scope-creep)

- Legacy operator integration removed per ADR-0005
- Real transfer — `real-integration/TRANSFER-REAL-ADAPTER-BACKLOG.md`

## Release train

| Field | Value |
| --- | --- |
| Shipped | **0.9.0** (`v0.9.0`, 2026-07-08) — F-002 global incoming call overlay, F-025 contacts CSV fix |
| Previous | **0.8.0** (F-013 call history, F-025 contacts, shell navigation), **0.7.1** (F-016 settings-only resize) |
| Next cut | **0.9.1** (PATCH) or **0.10.0** (MINOR) per SemVer table in `RELEASE-PLAYBOOK.md` |
| Source repo | `HailRase/softphone-electron` (target: **private**) |
| Distribution | [`HailRase/axatalk-releases`](https://github.com/HailRase/axatalk-releases) (public: installers + manifest) |
| Manifest (live) | `axatalk-releases/main/update-manifest.json` |
| CI | `ci.yml` · `release.yml` → publish to axatalk-releases |
| Migration | [`guides/Distribution-Migration-Checklist.md`](../../guides/Distribution-Migration-Checklist.md) |

**Release cut:** tag on **softphone-electron** → CI publishes to **axatalk-releases**. Secret: `AXATALK_RELEASES_TOKEN`.

## Archived handoffs

Completed phases P02–P08: `handoffs/archive/P0N/`
