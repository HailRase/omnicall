# Project Status (live)

> **Authoritative snapshot for agents.** Update after each closed WU or RAT step. Reviewer skills read this during Discovery.

**Updated:** 2026-07-17
**Tests:** 2250 passed / 1 skipped (F-029 notification history Table UI; +T-044 OCP SIP profile from creds)
**Lint / typecheck:** green (last verified 2026-07-17)

**Auth Flow Refactoring / Hardening:** implementation + automated gate complete 2026-07-17 — independent account/OCP/SIP state, five-stage OCP progress, crash-safe saved profiles/secrets, one-click saved-profile entry, persistent auth errors and rolling 24-hour notification journal (F-029). Real staging OCP smoke SM-1…20 remains external verification. Version: `0.11.0`.

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

1. **F-027** WU8 manual SBC smoke (checklist) → then registry **implemented** — `handoffs/P13-Video-Calls-WU8-SBC-Smoke-Checklist.md` (do not interrupt without explicit claim)
2. P11 polish: UI-6 Radix modals — `/ui`
3. **F-008** DTMF real adapter — `/adapter`

**Recently closed (TASK-QUEUE):** **T-044 / F-024,F-028** OCP saveProfile SIP domain/server/password from entity:creds (2026-07-17), **T-043 / F-001,F-029** SIP-only staged transport/registration toasts + System State error CTA (2026-07-17), **T-042 / F-028** OCP Reconnect single `/proxy/authenticate` (no recovery twin) (2026-07-17), **T-041 / F-028** OCP Reconnect token uses OCP Domain not SIP Domain (2026-07-17), **T-040 / F-028,F-014** Avatar logout idle reset (no OCP reconnect banner) (2026-07-17), **T-039 / F-001,F-014,F-024** Login re-enable after logout (SIP connected / auth failed) (2026-07-17), **T-036 / F-001,F-024,F-028** Account OCP/SIP mode-isolated validation (2026-07-17), **T-035 / F-024** overwrite modal Cancel + ButtonGroup split (2026-07-17), **T-034 / F-016,F-028** System State SIP/OCP tabs UI (2026-07-16), **T-033 / F-028** Auth Flow Refactoring WU-05 Settings gate + OCP Module edit-only (2026-07-16), **T-033 / F-028** WU-04 Account UI (2026-07-16), **T-033 / F-028** WU-00…WU-03 (2026-07-16), **T-032 / F-028** unified auth gate fixes (2026-07-16; sign-in ownership superseded by ADR-AF-003), **T-029 / F-028** status selector current-first + width/ellipsis (2026-07-14), **T-028 / F-028** status selector polish + single-step post-call modal (2026-07-14), **T-027 / F-028** OCP status UX (FSM + reserve/post-call modal; 2026-07-14), **T-026 / F-028** OCP UI polish (status selector, logout footer, Integrations nested nav; 2026-07-14), **F-028 audit remediation** terminate+Facade+events+autoConnect (2026-07-14), **F-028 E-13** i18n + `OcpFullFlow` + registry/`implemented` (2026-07-14), **F-028 E-12** OCP external command contract + Facade (no `window.Softphone`; 2026-07-14), **T-025 / F-028 E-10 UI** dialpad block + reject-with-break (2026-07-14), **T-020 E-10/E-11 logic** OCP telephony bridge + SIP from creds (2026-07-14), **T-024 / F-028 E-09** OCP campaign accept/reject modal (2026-07-14), **T-023 / F-028 E-08** OCP logout reason modal + cascade SIP (2026-07-14), **T-022 / F-028 E-07** Operator Status Selector header UI (2026-07-14), **T-021 / F-028** Settings Integrations UI + OCP toast wiring (2026-07-14), **T-013 / F-013** call history outcome/endReason/durations (`39afae2`, `handoffs/P09-F013-Call-History-Display-Logic-Handoff.md`), **P10 / F-012** headset Web HID integration (`handoffs/P10-Headset-Integration-Handoff.md`, ADR-0007), RAT SIP core merged to `main` (`feature/real-adapters` stale ancestor), **F-024** saved SIP account profiles (`0a2ae05`, `handoffs/P11-F024-Saved-Account-Profiles-Handoff.md`), **F-023** local account profiles + disk persistence (T-011), **F-022 / T-009 / T-010** codec preferences (LF-084), **T-008** SIP transport/register state refactor (`TRANSPORT-REGISTER-STATE-REFACTORING.md`), T-007 Call UI design parity (`handoffs/P11-Call-UI-Design-Parity-Handoff.md`), post-WU5 shell polish (`handoffs/P11-Post-WU5-Shell-Polish-Handoff.md`), T-005 fullscreen settings panel, T-001 icon tooltips, T-002 AppIcon wiring, **F-014 SIP registration retry** (`handoffs/P08-SIP-Registration-Retry-Handoff.md`).

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
| Shipped | **0.10.3** (`v0.10.3`, 2026-07-13) — F-027 video UX hardening, screen-share picker, PiP swap, audio-only detection |
| Previous | **0.10.2**, **0.10.0** (`v0.10.0`, 2026-07-12) — F-012 headset, F-027 video calls, F-013 history polish, SIP-only path |
| Next cut | **0.10.4** (PATCH) or **0.11.0** (MINOR) per SemVer table in `RELEASE-PLAYBOOK.md` |
| Source repo | `HailRase/softphone-electron` (target: **private**) |
| Distribution | [`HailRase/axatalk-releases`](https://github.com/HailRase/axatalk-releases) (public: installers + manifest) |
| Manifest (live) | `axatalk-releases/main/update-manifest.json` |
| CI | `ci.yml` · `release.yml` → publish to axatalk-releases |
| Migration | [`guides/Distribution-Migration-Checklist.md`](../../guides/Distribution-Migration-Checklist.md) |

**Release cut:** tag on **softphone-electron** → CI publishes to **axatalk-releases**. Secret: `AXATALK_RELEASES_TOKEN`.

## Archived handoffs

Completed phases P02–P08: `handoffs/archive/P0N/`
