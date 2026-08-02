# F-034 Audit Remediation (2026-08-02)

- Purpose: record post-WU-10 hardening that closes audit High findings without SemVer/OS-banner scope.
- Inputs: holistic audit of Notification Center vs ADR-0025 / ADR-AF-007 / LF-060.
- Outputs: policy-faithful journal failure path, observability, catalog/UI completeness, docs sync.

## Compatibility law (unchanged)

- Default preferences still present the same in-app toasts as pre-remediation.
- Journal still records when popups are suppressed.
- ADR-0013 critical raises remain ungated by Notification Center prefs.
- WU-09 OS banners remain **deferred** (no Electron adapter); not a silent product flip.

## Remediation map

| Audit finding | Severity | Resolution |
| --- | --- | --- |
| Journal IO fail forced toast on (prefs bypass) | High | `RecordUserNotificationUseCase` returns `{ entry, persisted }`; Capture returns policy even when `persisted=false` |
| Silent capture throw in renderer | High | `onCaptureFailure` + structured Capture logs; throw path remains last-resort fail-open only |
| Fragile producer allowlist | High | Tagging test scans all `src/renderer` sources (excludes test/story) |
| Dead `appearance.closable` | Low | Wired through Appearance UI → `useNotifications` → Sonner `closeButton` |
| No suppress reason on journal rows | Low | Additive `suppressReasons[]` on entries; legacy rows parse as `[]` |
| EA toasts under `settings` module | Low | Catalog + producer use `externalApplications` (defaults still popup-on) |
| Missing Telephony focus preset | Low | UI preset writes same fields as Default/Quiet (no schema change) |
| OS banners when minimized | High (accepted deferral) | Remains WU-09; do not start without explicit product WU |

## Explicit non-changes

- No `SETTINGS_SCHEMA_VERSION` bump (module catalog fill-defaults; closable already persisted).
- No journal document schemaVersion bump (`suppressReasons` optional on parse).
- No package SemVer / CHANGELOG / release cut.
- No E2E suite (product acceptance remains unit/component + docs gates).
