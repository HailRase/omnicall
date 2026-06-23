# P04 Active Call Controls UX Design

- Phase: `P04`, Features: `F-004`, `F-005`, Legacy: `LF-022`, `LF-024`, `LF-027`.
- Primary context: `Telephony`; secondary context: `Media`; UI consumes projection only.
- Visual states: `active`, `held`, `ending`, `ended`; mute badge states: `muted`, `unmuted`.
- Disabled reasons from projection: `no active call`, `hold requires active`, `resume requires held`, `mute requires active or held`, `already muted`, `not muted`, `call ending`, `hangup not allowed`.
- Domain fact `ActiveCallControlFailed` maps to projection field `lastOperationError` (`operation` + `message`).
- Error/recovery states: `hold failed`, `resume failed`, `mute failed`, `unmute failed`, `hangup failed`; recovery UI: error banner (`active-call-control-error`) + `Retry` button (`control-retry`) re-invokes last failed operation via facade.
- Hangup semantics: `CallHangupRequested` is emitted only after successful telephony gateway hangup; then `CallEnded`. Failed hangup emits `ActiveCallControlFailed` and keeps projection out of `ending`.
- Accessibility/test IDs: keyboard reachable native buttons (`Enter`/`Space`), visible focus, `aria-label` on `hold/resume/mute/unmute/hangup/retry`, test IDs `active-call-controls`, `control-hold`, `control-resume`, `control-mute`, `control-unmute`, `control-hangup`, `control-disabled-reason`, `active-call-control-error`, `control-retry`.
