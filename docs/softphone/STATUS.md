# Project Status (live)

> **Authoritative snapshot for agents.** Update after each closed WU or RAT step. Reviewer skills read this during Discovery.

**Updated:** 2026-08-06
**Version:** `1.3.1` (brand: **OmniCall** / SoftOmniTel; packages `@softomnitel/omnicall-kit@0.2.1` + `@softomnitel/omnicall-protocol@0.1.0`)
**Feedback channels:** ADR-0026 (amended 2026-08-06) — anti-dual; ephemeral outcomes → `notify`; Account validation → Alert + journaled critical; Account server/register → toast (`actionable`) + System State CTA; OCP modal/banner keep ownership; list-load/RunResult/codec policy keep owning surfaces — `UI-Architecture.md` § Feedback Channel Law
**Tests:** `1.3.1` cut — release preflight green (2026-08-03); first-run CTA unit suites green (2026-08-05); OCP progress honesty + Account feedback channel suites (2026-08-06)
**First-run CTA (F-016 polish):** unregistered idle CTA only → Settings Account; empty saved-profile Account hint — `P11-First-Run-Sign-In-CTA.md`
**Settings nav:** Integrations = always-open cluster (OCP + External Services + **External Applications**; canon: `UI-Design-System.md` § Settings Nav Groups)
**Settings schema:** `UserSettings` **v19** = v18 (EA/ringtone/always-on-top) + nested `notificationPreferences` (F-034); migrates 3…18 upward (no downgrade)
**OCP reconnect UX:** auto-drop recovery = global overlay `OcpConnectionBanner` (`transportRecoveryActive` owns banner across flaps; `--z-shell-status-banner`) + silent progress (no sign-in Dialog / no token toasts); compact one-line chip `OCP · status` + outline Retry (viewport-edge geometry for ≥360px main display — not Sonner); banner Retry = System State `retry_server` (shared Facade recovery + login cascade); Login/Reconnect/SDK activate keep **six-stage** modal (immediate failure reveal; monotonic stages — early `creds` must not regress phone→SIP order; ADR-AF-002 amendment 2026-08-06)
**Lint / typecheck:** green at `/release` cut `1.3.0`
**Splash contract:** `docs/softphone/Bootstrap-Splash-Contract.md` — single-stage `#boot-splash` + min visible dwell 4000ms + exit crossfade; do not reintroduce React loading splash handoff; do not delay `initialize` for dwell
**OCP call context:** `docs/softphone/OCP-Call-Context.md` — queue from `get_main_acallid` (wire: `acallid` + parties + `event`; never outbound `call_id`); desktop queue badge; SDK `call:acd-context` + snapshot `calls[].acdContext` under `ocp.acd_context.read` (ADR-0020) + additive `queueLabel`; campaign single-modal FSM + `operator:campaign-*` (ADR-0019); dual UI/SDK ownership + delivery reliability sections documented

**Auth Flow Refactoring / Hardening:** implementation + automated gate complete 2026-07-17 — independent account/OCP/SIP state, OCP progress (six stages as of 2026-08-06), crash-safe saved profiles/secrets, one-click saved-profile entry, Account validation Alert + server/register toast (ADR-0026 amend 2026-08-06), rolling 24-hour notification journal (F-029). Real staging OCP smoke SM-1…20 remains external verification. Version: `1.1.0`.

**Guides (onboarding):** [`guides/README.md`](../../guides/README.md) — установка, пользователь, агенты Cursor, релизы.

## Closed — F-011 Host Integration / SDK production-readiness

| Field | Value |
| --- | --- |
| Feature | **F-011** Host Integration Contract + corrective WU-00…WU-07 |
| Status | **implemented** (WU-07 PASS 2026-08-03) |
| Task | **T-054** **done** |
| Plan | `omnicall-kit-integration/sdk-production-readiness/` · `CLOSEOUT.md` |
| Handoff | `handoffs/P12-External-Host-API-Master-Handoff.md` |
| ADR | ADR-0027 (+ ADR-0009…0018 historical) |
| Gate | unit + integration + desktop/kit preflight only — agents must not run packaged Electron / Chromium / Edge smoke |
| Release | Desktop **`1.3.1`** + kit **`0.2.1`** (2026-08-03) |

## Closed — F-034 Notification Center

| Field | Value |
| --- | --- |
| Feature | **F-034** Notification Center (preferences + capture policy + Settings hub) |
| Status | **implemented** (WU-00…WU-08 done; WU-09 OS deferred; WU-10 close 2026-08-02) |
| Branch | `feature/notification-center` |
| Task | **T-053** **done** |
| Plan | `notification-center/` · progress `notification-center/PROGRESS.md` |
| Handoff | `handoffs/P15-Notification-Center-Master-Handoff.md` |
| ADR | ADR-0025 (**Accepted**); ADR-0013 `notification_actionable` |
| Related | F-016 / LF-060 toasts; F-029 / ADR-AF-007 journal; ADR-0013; F-030 portability |
| Release | MINOR shipped **`1.3.0`** (2026-08-02) |
| Next | WU-09 OS banners only with explicit product start |
| Non-overlap | Not Call DND; defaults never toast→raise; OS banners deferred; no SIP/OCP/SDK wire changes |

## Closed — F-031 External Services

| Field | Value |
| --- | --- |
| Feature | **F-031** External Services (Outbound HTTP Automations) |
| Status | **implemented** (WU-00…WU-13 + WU-12 closeout 2026-07-30) |
| Branch | `feature/external-services` |
| Task | **T-052** **done** |
| Plan | `external-services-plan/` · progress all WUs **done** |
| Handoff | `handoffs/P14-External-Services-Master-Handoff.md` |
| ADR | ADR-0022 + ADR-0023 (**Accepted**) |
| Release | MINOR shipped **`1.2.0`** (2026-07-31) |
| Non-overlap | Not F-011 inbound SDK; not F-028 OCP control; outbound webhooks only |

## Closed — F-032 External Applications

| Field | Value |
| --- | --- |
| Feature | **F-032** External Applications (Call Screen-Pop Windows) |
| Status | **implemented** (2026-07-31) |
| Branch | `feature/external-applications` |
| Design | `P14-External-Applications-Design.md` |
| ADR | ADR-0024 (**Accepted**; close-guard 2026-08-02; window origin x/y 2026-08-03) |
| Schema | Introduced at **v16**; current aggregate **v19** (with F-033/F-034); window x/y via nested parse (no bump) |
| Release | MINOR shipped with **`1.3.0`** (2026-08-02) |
| Non-overlap | Not F-031 HTTP; not F-011 SDK; not F-028 OCP control |
| Extensions (2026-07-31) | App-level open conditions; sidebar History journal; raise/always-on-top/on-call-ended window lifecycle |
| Extensions (2026-08-02) | Guest close-guard (`window.omnicall.setCloseGuard`); minimal guest preload; no-guard path unchanged |
| Extensions (2026-08-03) | Window x/y open path + workArea clamp; General-tab geometry editor (adaptive preview); session-only multi-app overlays via Layers checkbox menu on desktop |

## Closed — F-033 Selectable Incoming Ringtone Catalog

| Field | Value |
| --- | --- |
| Feature | **F-033** Selectable Incoming Ringtone Catalog |
| Status | **implemented** (2026-08-01; classic FM ring 2026-08-02) |
| Design | `P11-Incoming-Ringtone-Catalog-Design.md` |
| Schema | `UserSettings` **v18** (`incomingRingtoneId`, default `classic`) |
| Release | MINOR shipped with **`1.3.0`** (2026-08-02) |
| Non-overlap | Not F-018 Tone FSM; WebAudio presets only (no OEM assets) |
| UX | Settings → Sessions: select ≥10 presets + preview |
| Classic | FM ring (660 Hz + square LFO, cadence `[440,66,660,1980]`, peak 0.5) |
| Catalog | Original F-033 step presets (single oscillator) |

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
| F-030 Preferences export/import | done | `P11-Operator-Preferences-Export-Design.md` |

**P11 phase gate:** WU0–WU5 + post-WU5 polish + Call UI parity **done**. **T-008** SIP transport/register refactor **done** (LF-009/LF-057 header + «Состояние системы»). **F-022 / LF-084 codec preferences** **done** (T-009 UI + T-010 adapter, `5692747`…`bb085f8`). **LF-060** toast viewport geometry **done** (T-051). **LF-082 theme** done 2026-06-26. Remaining for phase close: UI-6 Radix modals, draggable widget (LF-056).

## Next work (priority)

See also: `TASK-QUEUE.md` for agent claim/done workflow.

1. **F-027** WU8 manual SBC smoke (checklist) → then registry **implemented** — `handoffs/P13-Video-Calls-WU8-SBC-Smoke-Checklist.md` (do not interrupt without explicit claim)
2. P11 polish: UI-6 Radix modals — `/ui`
3. **F-008** DTMF real adapter — `/adapter`
4. Optional: F-034 WU-09 OS banners — only with explicit product start

**Recently closed (TASK-QUEUE):** **T-053 / F-034** Notification Center WU-00…WU-10 (`implemented`; WU-09 OS deferred; 2026-08-02); **F-032/F-033** merged to local `main` from `feature/external-applications` (2026-08-02); **F-031/F-032** additive automatic trigger `post_call_processing` (2026-07-31); **F-014/F-028 / LF-058** OCP transport recovery UX harden (2026-07-30); **T-052 / F-031** External Services (`implemented`; 2026-07-30).

**F-011 / P12 corrective track:** **T-054 / WU-07 PASS** (2026-08-03). F-011 **`implemented`**. Shipped Desktop **`1.3.1`** + kit **`0.2.1`**. Gate = unit + integration + preflight only.

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
| Shipped | **1.4.1** (2026-08-07) — F-021 language-switch race / Settings SDK bootstrap loop fix |
| Previous | **1.4.0** (F-032 UX, F-016 CTA, F-028 OCP, F-031 journal), **1.3.1**, **1.3.0**… |
| Next cut | PATCH hotfix as needed; WU-09 OS banners deferred |
| Source repo | `HailRase/softphone-electron` (target: **private**) |
| Distribution | [`HailRase/omnicall-releases`](https://github.com/HailRase/omnicall-releases) (public: installers + manifest) |
| Manifest (live) | `omnicall-releases/main/update-manifest.json` |
| CI | `ci.yml` · `release.yml` → publish to omnicall-releases |
| Migration | [`guides/Distribution-Migration-Checklist.md`](../../guides/Distribution-Migration-Checklist.md) |

**Release cut:** tag on **softphone-electron** → CI publishes to **omnicall-releases**. Secret: `OMNICALL_RELEASES_TOKEN`.

## Archived handoffs

Completed phases P02–P08: `handoffs/archive/P0N/`
