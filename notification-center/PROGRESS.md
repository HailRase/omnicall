# F-034 Notification Center Progress

- Purpose: machine-readable execution state for the F-034 work-unit sequence.
- Inputs: completion evidence from `10-WORK-UNITS.md`.
- Outputs: the next executable WU and its review gate.

| WU | Title | Status | Last update | Evidence |
| --- | --- | --- | --- | --- |
| WU-00 | Registry, ADR, and handoff bootstrap | done | 2026-08-02 | F-034 registry; T-053 claimed; STATUS active; P15 handoff; ADR-0025 Proposed; `npm run registry:check` 75/0; work-history `notification-center-wu00` |
| WU-01 | Domain preferences model and settings migration | done | 2026-08-02 | Schema 14 nested `notificationPreferences` (Strategy A); modules +sdk/updates/externalServices; migrate v13 flat→nested; fail-closed validate; tests + typecheck/lint/registry/i18n; ADR-0025 Strategy A; `externalApplications` deferred |
| WU-02 | Capture policy and facade wiring | done | 2026-08-02 | Domain `evaluateNotificationPresentationPolicy`; CaptureService + facade load active prefs; ignore caller `popupEnabled`; ADR-0025 Accepted; policy + capture unit tests |
| WU-03 | Producer module/function tagging | done | 2026-08-02 | Tagged useActionNotifications (+interruptClass), SoftphoneReadyShell ocp.auth_feedback, OCP mapper remote, contacts/history/video/OCP campaign/status/logout/reject-break; static checklist `notificationProducerTagging.test.ts`; focused suites + typecheck/lint PASS |
| WU-04 | Notification Center Preferences UI | done | 2026-08-02 | Settings Notification Center hub (Preferences/Appearance placeholder/History); Preferences master+modules+presets; i18n ru/en/fr/de/bg; stories light/dark; component + useSettingsActions tests |
| WU-05 | Appearance relocation and General cleanup | done | 2026-08-02 | Appearance panel under Notification Center; General hint CTA; preserved test IDs; viewport geometry tests; i18n five locales; stories Appearance light/dark |
| WU-06 | History panel module expansion | done | 2026-08-02 | History filter/labels share `MODULE_LABEL_KEY` + `USER_NOTIFICATION_MODULE_FILTERS`; testid `settings-notification-history-module`; panel + journal catalog tests; i18n/ui:catalog/typecheck/lint PASS |
| WU-07 | F-030 preferences portability | done | 2026-08-02 | Nested `notificationPreferences` F-030 round-trip; v13 flat→nested in bundle; fail-closed; journals excluded; design + F-030/F-034 registry evidence |
| WU-08 | Optional actionable window raise | done | 2026-08-02 | ADR-0013 `notification_actionable`; Capture raise enabled; `useNotifications` → `raiseShellWindow`; Preferences raise UI; defaults never; focused tests PASS |
| WU-09 | OS notification seam (optional / deferrable) | deferred | 2026-08-02 | Deferred: large permission/UX scope; v1 without OS banners; ADR-0025 seam; port `NotificationGateway` + `MockNotificationGateway` only; no Electron adapter |
| WU-10 | Documentation close, preflight, and release decision | done | 2026-08-02 | Acceptance closed; F-034 `implemented`; T-053 done; handoff/STATUS closed; preflight test 2976/1 skip + lint + typecheck + i18n + registry 75/0; ui:catalog regenerated; SemVer deferred pending ship auth |
| post | Audit remediation (no SemVer / no OS) | done | 2026-08-02 | Policy-faithful journal failure; Capture logs; closable wired; `externalApplications` module; `suppressReasons` on journal; telephonyFocus preset; renderer-wide tagging scan; docs `13-AUDIT-REMEDIATION.md` |

## State rules

- Allowed statuses: `pending`, `in_progress`, `done`, `blocked`, `deferred`.
- Exactly one primary WU may be `in_progress`.
- Mark `done` only after its tests, canonical docs, and work-history evidence exist.
- `deferred` is allowed for WU-08/WU-09 only when explicitly recorded with reason and acceptance still passes without them.
- Record blockers in the Evidence column and stop before dependent WUs.
- Current next WU: **none** — track closed; OS banners remain WU-09 deferred; next `/release` only with ship auth
