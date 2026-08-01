# P14 — External Applications (F-032)

- Purpose: profile-scoped call screen-pop rules that open Electron windows or the system browser.
- Inputs: Settings → Integrations → External Applications items; focused-call / campaign / ACD / post-call Domain events (shared F-031 trigger codes).
- Outputs: resolved HTTPS URLs opened via typed IPC (`external-applications:open-window`) or existing `openExternalUrl`; optional call-ended lifecycle via `external-applications:apply-call-ended`.
- Templates: reuse F-031 `{{name}}` catalog / autocomplete; system precedence over authored variables.
- Variables tab: shared F-031 system catalog (browse-only, group when-available subtitles, `?` help popups) + authored key/value block labeled **always**; `{{` popup shows `System|Collection · {when}` like External Services.
- Conditions (own Settings tab; app-level, shared by all events): call direction (default any); optional queue name list (`queue_name` match any entry, case-insensitive; empty = any); fail-closed when direction/queue facts missing; manual Open now ignores conditions.
- Window behavior (electron_window): raise on open, always-on-top during call, on call end leave/minimize/close (applied before terminal-event opens so `call_ended` pops are not closed by the same hangup).
- History: profile journal (cap 100, newest-first) under `profiles/external-applications-journal/`; Settings sidebar **History** entry; excluded from F-030 export.
- Edge cases: multiple matching apps → multiple windows; same `applicationId:callId` focuses existing; invalid URL skipped; focus-gated call events; operator-level `campaign_*` + `post_call_processing`; logout invalidates pending delays.
- Schema: `UserSettings` **v16** (`conditions.queueNames[]` + `windowBehavior`; v15 `queueNameEquals` / `requireCallerId` migrate forward; empty queues + direction any = prior open behavior).
- Non-overlap: not F-031 HTTP automations; not F-011 SDK; not F-028 OCP control plane.
