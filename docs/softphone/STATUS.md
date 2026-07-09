# Project Status (live)

> **Authoritative snapshot for agents.** Update after each closed WU or RAT step. Reviewer skills read this during Discovery.

**Updated:** 2026-07-09  
**Tests:** 1586 passed (`npm run test`) — last verified 2026-07-09 (F-020 update banner below window controls)  
**Lint / typecheck:** green (last verified 2026-07-09)

**Guides (onboarding):** [`guides/README.md`](../../guides/README.md) — установка, пользователь, агенты Cursor, релизы.

## Active phase

**P10 — Headset integration (F-012)** — **done** (`handoffs/P10-Headset-Integration-Handoff.md`)

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

1. P11 polish: UI-6 Radix modals — `/ui`
2. **F-008** DTMF real adapter — `/adapter`
3. P12 host API foundation

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
| Shipped | **0.8.0** (`v0.8.0`, 2026-07-08) — F-013 call history, F-025 contacts, shell navigation |
| Previous | **0.7.1** (F-016 settings-only resize), **0.7.0** (macOS traffic lights, settings overlay) |
| Next cut | **0.8.1** (PATCH) or **0.9.0** (MINOR) per SemVer table in `RELEASE-PLAYBOOK.md` |
| Source repo | `HailRase/softphone-electron` (target: **private**) |
| Distribution | [`HailRase/axatalk-releases`](https://github.com/HailRase/axatalk-releases) (public: installers + manifest) |
| Manifest (live) | `axatalk-releases/main/update-manifest.json` |
| CI | `ci.yml` · `release.yml` → publish to axatalk-releases |
| Migration | [`guides/Distribution-Migration-Checklist.md`](../../guides/Distribution-Migration-Checklist.md) |

**Release cut:** tag on **softphone-electron** → CI publishes to **axatalk-releases**. Secret: `AXATALK_RELEASES_TOKEN`.

## Archived handoffs

Completed phases P02–P08: `handoffs/archive/P0N/`
