# Task Queue

> Optional queue for agents when user does not specify a task. `scope-intake` reads this after `STATUS.md`.

**Updated:** 2026-08-02

| ID | Priority | Task | F-XXX | Command | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| T-053 | 0 | Notification Center preferences + policy + Settings hub (WU-00…WU-10) | F-034 | `/logic` → `/ui` | done | F-034 implemented 2026-08-02; WU-08 raise done; WU-09 OS deferred (port+mock); WU-10 acceptance+docs close; SemVer pending ship auth — `notification-center/`; handoff `P15-Notification-Center-Master-Handoff.md` |
| T-052 | 0 | External Services outbound HTTP automations (WU-00…WU-12) | F-031 | `/logic` → `/ui` | done | closed 2026-07-30 — F-031 `implemented`; shipped **1.2.0** (2026-07-31); ADR-0022/0023 Accepted |
| T-051 | 0 | Toast viewport geometry during compact/settings layout transition | F-016 | `/ui` | done | closed 2026-07-28 — LF-060; clamp Sonner viewport/toast to BrowserWindow width, retain 24px edge and titlebar-safe top inset; compact notification tests pass |
| T-050 | 0 | OCP queue badges + campaign progressive gate + preview modal blur | F-028 | `/logic` → `/ui` | done | closed 2026-07-26 — `OCP-Call-Context.md`; LF-037…040 parity; v0.13.0 |
| T-049 | 0 | Overwrite modal: dismiss before sign-in settles + restore ButtonGroup footer | F-024 | `/logic` → `/ui` | done | closed 2026-07-19 — confirm closes immediately; Cancel + ButtonGroup continue/menu-overwrite |
| T-048 | 0 | OCP post-call: reserve in dropdown + finish-appeal footer (no modal) | F-028 | `/logic` → `/ui` | done | closed 2026-07-19 — FinishPostCallAppealUseCase; clear reserved on idle; footer button |
| T-047 | 0 | OCP users: wire reason_id null → status.value for system statuses | F-028 | `/logic` | done | closed 2026-07-19 — Domain `resolveOperatorReasonId`; parse + projection; READY/RINGING/… match reason catalog |
| T-046 | 0 | Header: move SIP identity into avatar menu; status selector fills width without shell widen | F-016,F-028 | `/ui` | done | closed 2026-07-19 — identity in menu (non-selectable) + separator; OperatorStatusSelector ellipsis/tooltip; no shell width growth |
| T-045 | 0 | OCP status selector: server-driven chip + flat Ready/Break dropdown | F-028 | `/logic` | done | closed 2026-07-19 — chip from users projection only; flat Ready → Separator → Break; no «Текущий»/group labels |
| T-044 | 0 | OCP sign-in: persist SIP domain/server/password from entity:creds, not OCP Domain | F-024,F-028 | `/logic` | done | closed 2026-07-17 — persistOcpDerivedSipArtifacts; provisional OCP-host draft migrated/deleted |
| T-043 | 0 | SIP-only sign-in: split transport/registration toasts + System State error CTA | F-001,F-029 | `/logic` | done | closed 2026-07-17 — deriveAccountSignInNotificationFeedback; no false SIP-ready success |
| T-042 | 0 | OCP Reconnect must not send duplicate /proxy/authenticate (recovery race) | F-028 | `/logic` | done | closed 2026-07-17 — ignoreTransportDrops after cancelAll until next connecting\|connected |
| T-041 | 0 | OCP Reconnect token must use OCP Domain, not SIP Domain from creds | F-028 | `/logic` | done | closed 2026-07-17 — creds no longer overwrite session domain; resolveOcpProxyAuthenticateDomain + heal |
| T-040 | 0 | Avatar logout must not start OCP reconnect; reset OCP projections to idle | F-028,F-014 | `/logic` | done | closed 2026-07-17 — disarm transport recovery before disconnect + hub.resetToIdle |
| T-039 | 0 | Login stays disabled after logout when SIP connected but auth failed | F-001,F-014,F-024 | `/logic` | done | closed 2026-07-17 — EndUserSession publishes UserSessionEnded on partial teardown; Account VM refreshes on `hasActiveAccountSession` |
| T-038 | 0 | Notification history Settings panel → UI Kit Table | F-029 | `/ui` | done | closed 2026-07-17 — UI Kit Table + column/level i18n; filters/pagination preserved |
| T-037 | 0 | Overwrite credentials confirm loops back to the same prompt instead of signing in | F-024 | `/ui` | done | closed 2026-07-17 — confirm calls `handleSubmit(true, true)`; hook regression test |
| T-036 | 0 | Account OCP/SIP mode-isolated validation (New OCP draft false required-fields toast) | F-001,F-024,F-028 | `/logic` | done | closed 2026-07-17 — OCP ignores SIP leftovers + rememberPassword without SIP password |
| T-035 | 0 | Overwrite credentials modal: Cancel + ButtonGroup split (continue / overwrite menu) | F-024 | `/ui` | done | closed 2026-07-17 — Cancel + ButtonGroup (continue primary, overwrite in menu) |
| T-034 | 0 | System State SIP/OCP tabs UI (remove status from Account/OCP Module) | F-016,F-028 | `/ui` | done | closed 2026-07-16 — SIP/OCP tabs + `deriveOcpSystemStateShell`; dual status stripped from Account + OCP Module; next WU-06 |
| T-033 | 0 | Auth Flow Refactoring + Hardening + notification journal | F-001,F-014,F-016,F-023,F-024,F-028,F-029 | `/logic` → `/ui` | done | closed 2026-07-17 — WU-00…06 + Hardening WU-07-01…11; ADR-AF-001…007 |
| T-032 | 0 | Unified SIP/OCP authorization gate fixes (retry, startup register, renderer coverage) | F-001,F-014,F-024,F-028 | `/logic` → `/ui` | done | `handoffs/P11-Unified-Authorization-Gate-Handoff.md` — closed 2026-07-16; sign-in ownership superseded by ADR-AF-003 / T-033; SM-1…SM-16 still unchecked |
| T-031 | 0 | OCP Integrations login input-select + scoped settings wire | F-028 | `/ui` | done | closed 2026-07-15 — Input+datalist login; scoped save/connect; i18n 5 locales; next `/preflight` → `/review` |
| T-030 | 0 | OCP HTTP authenticate + saved-account OCP sign-in | F-028 | `/logic` → `/ui` | done | HTTP auth + login-picker Application API (2026-07-15); UI picker → T-031; next `/preflight` → `/review` after T-031 |
| T-029 | 0 | OCP status selector: current-first + width/ellipsis + break↔break UX | F-028 | `/logic` | done | closed 2026-07-14 — pin current in dropdown; fill to shell edge + IconTooltip; Break→Break verified |
| T-028 | 0 | OCP status selector polish + single-step post-call modal | F-028 | `/ui` | done | closed 2026-07-14 — reason-only chip, hover border, no widen, post-call one-step |
| T-027 | 0 | OCP status UX: break↔break, busy selector, reserve toast, post-call modal | F-028 | `/logic` | done | closed 2026-07-14 — FSM + ChangeOperatorStatus intent + OcpPostCallStatusModal |
| T-020 | 0 | OCP Module Integration (E-01…E-13) | F-028 | `/logic` → `/ui` | done | closed 2026-07-14 — E-13 + audit remediation (terminate/Facade/events/autoConnect); next `/preflight` → `/review` |
| T-026 | 1 | OCP UI polish: status selector, logout footer, Integrations nav parent/child | F-028 | `/ui` | done | closed 2026-07-14 — pill selector + ellipsis tooltip; Ready/Break subtitles; logout footer end; Integrations→OCP nested nav |
| T-024 | 1 | OCP Campaign Event Modal (E-09) | F-028 | `/ui` | done | closed 2026-07-14 — Dialog accept/reject + useOcpCampaignModal; toast already T-021 |
| T-023 | 1 | OCP Logout Reason Modal (E-08) | F-028 | `/ui` | done | closed 2026-07-14 — fullPanel ShellOverlaySheet + cascade OCP+SIP from avatar logout |
| T-022 | 1 | OCP Operator Status Selector (E-07) | F-028 | `/ui` | done | closed 2026-07-14 — header selector + connection banner + proxy overlay + i18n |
| T-019 | 0 | Video calls full parity (P13) | F-027 | `/logic` → `/adapter` → `/ui` | claimed | WU1–WU7 done; WU8 manual SBC — `handoffs/P13-Video-Calls-WU8-SBC-Smoke-Checklist.md` |
| T-014 | 0 | Headset vendor profile registry (EXT-1/2/3) | F-012 | `/adapter` | done | closed 2026-07-10 — `profiles/` + `resolveHeadsetVendorProfile`; next T-015 |
| T-015 | 1 | Headset gateway factory (EXT-4) | F-012 | `/adapter` | done | closed 2026-07-10 — `createHeadsetGateway` + SdkHeadsetGatewayStub; next T-016 |
| T-016 | 2 | Headset capabilities + mute/hold policies (EXT-5–8) | F-012 | `/logic` | done | closed 2026-07-10 — policies + SyncContract; next EXT-9/11 optional |
| T-017 | 3 | Electron HID device picker preferred id (EXT-11) | F-012 | `/adapter` | done | closed 2026-07-10 — select-hid-device prefers softphone id |
| T-018 | 4 | Headset capabilities in connection projection UI (EXT-9) | F-012 | `/ui` | done | closed 2026-07-10 — capabilities in projection + Settings summary |
| T-013 | 0 | Call history outcome/endReason/durations polish | F-013 | `/logic` | done | missed only for unanswered incoming; endReason + ring/talk durations; list shows clock time only — closed 2026-07-09 |
| T-011 | 0 | Local account profiles + disk persistence | F-023 | `/logic` + `/adapter` | done | `P11-Local-Account-Profiles-Design.md` — closed 2026-07-06 (`0a2ae05`) |
| T-012 | 0 | Saved SIP account profiles (quick sign-in) | F-024 | `/logic` + `/ui` | done | `handoffs/P11-F024-Saved-Account-Profiles-Handoff.md` — closed 2026-07-06 (`0a2ae05`) |
| T-008 | 0 | SIP transport/register state refactor (8 phases) | F-001,F-014,F-016 | `/logic` + `/ui` | done | `TRANSPORT-REGISTER-STATE-REFACTORING.md` — closed 2026-07-02; review follow-up 2026-07-04 |
| T-001 | 1 | Icon tooltips (1s delay) | F-016 | `/ui` | done | `handoffs/P11-Icon-Tooltips-Agent-Prompt.md` |
| T-002 | 2 | Wire AppIcon in header/call controls | F-016 | `/ui` | done | `Icon-Registry.md` |
| T-021 | 1 | OCP Settings Integrations UI + toast wiring | F-028 | `/ui` | done | closed 2026-07-14 — Integrations nav + panels + Zustand OCP sync + toast presenter → `useNotifications` |
| T-003 | 3 | F-008 DTMF real adapter | F-008 | `/adapter` | pending | `JsSipTelephonyAdapter.sendDtmf` |
| T-005 | 5 | Fullscreen settings panel with sidebar sections | F-016, F-017 | `/ui` | done | P11 settings UX polish |
| T-007 | 7 | Call UI design parity (reference skeleton) | F-003,F-004,F-016 | `/ui` | done | `handoffs/P11-Call-UI-Design-Parity-Handoff.md` tasks 1–8 |
| T-009 | 8 | Codec preferences UI panel (LF-084) | F-022 | `/ui` | done | SettingsCodecsPanel + dnd-kit + i18n — closed 2026-07-05 |
| T-010 | 9 | JsSIP codec apply on call/answer | F-022 | `/adapter` | done | WU-4 dual-layer apply — closed 2026-07-05; manual SBC smoke optional/deferred |

## Status values

`pending` | `claimed` | `done` | `blocked` | `deferred`

Agents: set `claimed` at start, `done` when work-history written.
