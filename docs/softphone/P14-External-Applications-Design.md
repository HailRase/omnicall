# P14 — External Applications (F-032)

- Purpose: profile-scoped call screen-pop rules that open Electron windows or the system browser.
- Inputs: Settings → Integrations → External Applications items; focused-call / campaign / ACD / post-call Domain events (shared F-031 trigger codes).
- Outputs: resolved HTTPS URLs opened via typed IPC (`external-applications:open-window`) or existing `openExternalUrl`; optional call-ended lifecycle via `external-applications:apply-call-ended`.
- Templates: reuse F-031 `{{name}}` catalog / autocomplete; system precedence over authored variables.
- Variables tab: shared F-031 system catalog (browse-only, group when-available subtitles, `?` help popups) + authored key/value block labeled **always**; `{{` popup shows `System|Collection · {when}` like External Services.
- Events tab: each trigger row reuses F-031 `?` help (`ExternalServicesTriggerVariableHelp`) listing system groups/`{{token}}`s from Domain `resolveExternalServiceEventVariableGroups` (same matrix as Variables when-hints; `post_call_processing` = always only — no `call_id`).
- Conditions (own Settings tab; app-level, shared by all events): call direction (default any); optional queue name list (`queue_name` match any entry, case-insensitive; empty = any); fail-closed when direction/queue facts missing; manual Open now ignores conditions.
- Manual Open now: same F-031 product snapshot facts as External Services Send (`user_login` from SIP username else OCP login; optional focused `call_id`); call/campaign/acd tokens remain `undefined` outside context; conditions still ignored.
- Window geometry (electron_window): persisted `window` is W×H + origin x/y (defaults 1100×800 @ 100,100; clamps W/H and x/y to domain ranges); missing x/y parse to defaults without schema bump; open path `executeExternalApplicationJob` → typed IPC → main `BrowserWindow` at nearest-display workArea clamp (partially visible); focus-existing does not move/resize.
- Geometry editor UI (General tab bottom, electron_window only; hidden for external_browser): left-aligned stage; adaptive preview scale (divisor 4–8 from stage content width via ResizeObserver so `screen.avail*` desktop fits the stage); right controls for presets and deferred validated W×H/X/Y; drag/resize live via DOM, commit on pointer-up; card title = application name; session-only multi-app overlays via Layers checkbox menu on the desktop (not persisted / not F-030).

## Geometry preview scale

- Purpose: keep the desktop preview readable as the settings panel resizes without a phantom horizontal scrollbar.
- Inputs: stage content-box width; primary `screen.availWidth`.
- Outputs: preview divisor in `[4, 8]` applied to desktop, cards, overlays, and pointer math (`floor(real ÷ scale)`).
- Fit budget: reserves desktop border chrome only; overlay picker is absolute on the desktop (no sidebar width reserve).

## Geometry multi-app overlays

- Purpose: session-only preview of other `electron_window` apps relative to the edited window.
- Inputs: eligible peer apps (same profile, not current, not `external_browser`); operator checkbox toggles.
- Outputs: read-only peer cards on the desktop; selection is not persisted / not F-030.
- Trigger: animated Layers icon absolute top-right on the desktop; DropdownMenuCheckboxItem multiselect; disabled when no eligible peers.
- Window behavior (electron_window): raise on open, always-on-top during call, on call end leave/minimize/close (applied before terminal-event opens so `call_ended` pops are not closed by the same hangup).
- Close guard (electron_window): guest page may register `window.omnicall.setCloseGuard`; native Close runs that callback; `true` closes, otherwise window stays; no guard = prior unrestricted close; call-ended `close` + app dispose force-close without guard; timeout/error fail-closed.
- Draft persistence UX: Save persists the full draft; sidebar ⋯ enable/disable immediately persists only `enabled` from the last saved baseline (other dirty fields stay local); dirty state shows selected-row accent + unsaved hint; leaving a dirty draft (other app / history / create / duplicate / rename) opens a discard dialog (F-031 pattern).
- History: profile journal (cap 100, newest-first) under `profiles/external-applications-journal/`; Settings sidebar **History** entry; excluded from F-030 export.
- Edge cases: multiple matching apps → multiple windows; same `applicationId:callId` focuses existing; invalid URL skipped; focus-gated call events; operator-level `campaign_*` + `post_call_processing`; logout invalidates pending delays.
- Schema: `UserSettings` **v16** (`conditions.queueNames[]` + `windowBehavior`; v15 `queueNameEquals` / `requireCallerId` migrate forward; empty queues + direction any = prior open behavior).
- Guest bridge: minimal preload `externalApplicationGuest` only (sandbox + contextIsolation); not the main softphone preload; no Node in guest; ADR-0024 amendment. Guest preload must stay self-contained (no shared Rollup chunks with main preload) so Electron `sandbox: true` keeps `window.softphone` working.
- Non-overlap: not F-031 HTTP automations; not F-011 SDK; not F-028 OCP control plane.

## Guest close-guard contract

- Purpose: let any card page decide whether the Electron window may close.
- Inputs: `setCloseGuard(() => boolean | Promise<boolean>)` on `window.omnicall`.
- Outputs: `true` allows close; any other value / throw / timeout blocks close; `clearCloseGuard()` restores unrestricted close.
- Softphone does not read card fields; the page owns validation (local and/or its server).
- Force paths skip the guard: call-ended policy `close`, IPC registration dispose / app shutdown destroy.
