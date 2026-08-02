# F-034 Risks and Non-goals

- Purpose: make accepted trade-offs, mitigations, and excluded scope explicit.
- Inputs: locked v1 product decisions, architecture discovery, and operator UX constraints.
- Outputs: implementation guardrails and review stop conditions.

## Risks and chosen mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Migration changes defaults and hides existing toasts | Operator misses SIP/OCP errors | Behavior-preserving defaults; acceptance compatibility law; migration tests |
| Per-module prefs while producers untagged | Prefs appear broken / everything is `system` | WU-03 tagging before claiming module UX complete; bridge defaults documented |
| Raise on notifications steals CRM focus | Productivity / SDK-hide breakage | Default `never`; actionable+errors_only only; ADR allowlist; remote never raises |
| Dual sources of truth (General + Notifications appearance) | Divergent UI state | WU-05 relocation; single save path |
| Policy in renderer diverges from capture | Suppressed toast still shown or vice versa | CaptureService sole authority; renderer applies decision only |
| OS notifications scope explosion | Delayed ship / permission bugs | WU-09 explicitly deferrable |
| Journal format break on new modules | History load failure | Additive enum parse; fixtures for old+new |
| Schema bump conflicts with parallel feature branches | Merge pain | Bump from then-current N; reconcile migrations on merge |
| Quiet-successes preset hides actionable warnings if mis-ranked | Missed recovery CTA | Level rank tested; actionable errors remain error level |
| Capture fail-open floods UI when journal disk broken | Noisy toasts | Keep current fail-open but log structurally; do not retry-loop |
| Settings hub complexity | Incomplete WU | Tabs with three clear panels; no in-call inbox |

## Explicit non-goals (v1)

- In-call Notification Center overlay / inbox drawer.
- Quiet hours, schedules, Focus modes.
- Per-message “don’t show again” without journal.
- Replacing incoming/campaign/SDK modals with toast+raise.
- Raise on every toast or on success/info.
- Second toast stack or LF-059 revival.
- Cloud sync of prefs beyond F-030.
- Sound-per-notification channel (ringtone remains separate).
- Full PII masking beyond existing journal sanitizers.
- Changing Call Engine, SIP register, OCP wire, SDK protocol, External Services HTTP, headset HID.
- Transfer R6 backlog work.
- SemVer/release cut without user authorization.

## Deferred decisions requiring new scope

- OS banner implementation details (actions, grouping, Windows Focus Assist interplay).
- Badge counts / taskbar flashFrame as soft attention.
- Per-functionId toggles finer than module (e.g. only `ocp.notification`).
- Account-global vs OS-user journal split redesign.
- Telemetry analytics on suppress rates.
- Admin-enforced enterprise notification policy.

## Review stop conditions

Stop and request a new product/ADR decision if implementation would require:

- Gating ADR-0013 critical raises behind notification prefs.
- Awaiting notification IO on Call Engine / telephony Use Cases.
- Renderer raw IPC/Node for notifications.
- Storing unsanitized secrets in journal/prefs.
- Silent default flip from show→hide for existing toast classes.
- Duplicating UI Kit Toast primitives locally without `/ui-kit`.
- Relaxing TypeScript, i18n, file-budget, or validation rules.
