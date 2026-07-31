# P14 — External Applications (F-032)

- Purpose: profile-scoped call screen-pop rules that open Electron windows or the system browser.
- Inputs: Settings → Integrations → External Applications items; focused-call / campaign / ACD / post-call Domain events (shared F-031 trigger codes).
- Outputs: resolved HTTPS URLs opened via typed IPC (`external-applications:open-window`) or existing `openExternalUrl`.
- Templates: reuse F-031 `{{name}}` catalog / autocomplete; system precedence over authored variables.
- Edge cases: multiple matching apps → multiple windows; same `applicationId:callId` focuses existing; invalid URL skipped; focus-gated call events; operator-level `campaign_*` + `post_call_processing` (no focus gate); logout invalidates pending delays.
- Non-overlap: not F-031 HTTP automations; not F-011 SDK; not F-028 OCP control plane.
