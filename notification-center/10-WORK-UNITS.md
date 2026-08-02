# F-034 Work Units

- Purpose: execute Notification Center in dependency order with one reviewable primary outcome per WU.
- Inputs: locked product spec, architecture canons, existing LF-060 / F-029 / ADR-0013 baseline.
- Outputs: preferences model, capture policy, tagged producers, Settings hub, portability, optional raise/OS seams, closure gates.

## Dependency order

```txt
WU-00
  → WU-01 → WU-02 → WU-03
                 └→ WU-04 → WU-05 → WU-06
  → WU-02 → WU-07
  → WU-02 → WU-08 (optional)
  → WU-02 → WU-09 (optional / deferrable)
  → all required above → WU-10
```

Only one primary WU executes per continuation prompt. Do not start Preferences UI before WU-02. WU-08/WU-09 may be `deferred` without blocking WU-10 if product accepts v1 without them.

---

## WU-00 — Registry, ADR, and handoff bootstrap

### Goal

Canonical product docs register F-034, ADR-0025, task track, and master handoff before behavior code exists.

### Why

Repository law forbids orphan Settings/UX features and non-obvious capture-policy ownership without a recorded decision.

### How

1. Add F-034 to `docs/softphone/Feature-Registry.md` from `00-PRODUCT-SPEC.md` / `11-ACCEPTANCE.md`.
2. Add `T-053` to `docs/softphone/TASK-QUEUE.md` (claimed; `/logic` → `/ui`).
3. Add F-034 line to `docs/softphone/STATUS.md` (branch `feature/notification-center`, next WU-01).
4. Create `docs/softphone/handoffs/P15-Notification-Center-Master-Handoff.md`.
5. Create proposed `docs/softphone/adr/ADR-0025-notification-center-preferences-policy.md`:
   - CaptureService owns presentation policy.
   - Default-preserving migration.
   - Module catalog expansion.
   - Journal always-on (ADR-AF-007).
   - Raise/OS boundaries; no toast→raise by default.
6. Run `npm run registry:check`.
7. Update `PROGRESS.md` + work history.

### Boundaries

- No production source, settings schema, locale, version, CHANGELOG, SIP/OCP/SDK, or UI behavior changes beyond docs.

### Evidence

- `npm run registry:check`
- Registry/STATUS/TASK-QUEUE/handoff/ADR paths
- `work-history/YYYY-MM-DD/notification-center-wu00_HH-mm.md`

### Done when

- [x] F-034, T-053, STATUS, handoff, ADR-0025 exist and agree
- [x] PROGRESS marks WU-00 done

### Continue hint

`Implement WU-01 from notification-center/10-WORK-UNITS.md`

---

## WU-01 — Domain preferences model and settings migration

### Goal

Validated immutable notification preferences persist on `UserSettings` with behavior-preserving defaults.

### Why

Policy, UI, and F-030 require a stable model before capture wiring changes.

### How

1. Implement Domain types/parsers/defaults from `02-DATA-MODEL.md`.
2. Expand `USER_NOTIFICATION_MODULES` as specified.
3. Bump schema `N → N+1` with migration from flat notification fields.
4. Choose Strategy A (recommended) or B; document in ADR-0025.
5. Update validate/migrate tests and fixtures.
6. Export via `src/domain/index.ts`.
7. Update PROGRESS + work history.

### Boundaries

- No CaptureService behavior change yet (may read new fields with identical effect).
- No renderer UI hub yet.
- Domain imports no Electron/React/Zustand/Node.

### Evidence

- Focused Domain/migration tests
- `npm run typecheck`, `npm run lint`, `npm run registry:check`

### Done when

- [x] Fresh settings equal today’s popup-on defaults
- [x] Prior schema migrates without changing appearance/master behavior
- [x] Malformed current prefs fail closed
- [x] New modules parse in catalog

### Continue hint

`Implement WU-02 from notification-center/10-WORK-UNITS.md`

---

## WU-02 — Capture policy and facade wiring

### Goal

`UserNotificationCaptureService` evaluates presentation policy from preferences and returns popup/raise decisions; journal behavior preserved.

### Why

Single choke point prevents divergent suppress rules in hooks.

### How

1. Implement pure `evaluateNotificationPresentationPolicy`.
2. Extend capture outcome; wire facade to load active preferences.
3. Stop trusting renderer-supplied `popupEnabled` as sole authority (tests updated).
4. Keep fail-open presentation on journal failure unless ADR changes it with tests.
5. Accept ADR-0025.
6. Unit tests for policy matrix + capture service.
7. Update PROGRESS + work history.

### Boundaries

- No Settings hub UI yet.
- `shouldRaiseWindow` may compute but must remain false in product until WU-08 (or prefs raise UI hidden).
- No OS notifications.

### Evidence

- Capture/policy unit tests
- Existing F-029 capture tests still pass or are migrated equivalently
- typecheck/lint

### Done when

- [x] Master off ⇒ journal suppressed flag + no popup decision
- [x] Module off / minLevel suppress works
- [x] Defaults match pre-F-034 presentation for tagged informational toasts

### Continue hint

`Implement WU-03 from notification-center/10-WORK-UNITS.md`

---

## WU-03 — Producer module/function tagging

### Goal

All product toast producers supply accurate `module`, `functionId`, and `interruptClass`.

### Why

Per-module prefs are meaningless while most events fall into `system`.

### How

1. Update `useActionNotifications` and related tests.
2. Update OCP mapper + SoftphoneReadyShell auth feedback.
3. Update contacts/history/video/OCP campaign/status/logout producers.
4. Add a focused test or lint-friendly checklist asserting no new untagged notify in touched files.
5. Update PROGRESS + work history.

### Boundaries

- No new toast copy spam.
- No SIP/OCP protocol changes.
- Do not retarget critical UI (incoming modal) into toast.

### Evidence

- Hook/mapper tests
- Manual spot-check list in work-history

### Done when

- [x] Matrix in `04-CAPTURE-AND-PRESENTATION.md` covered for existing producers
- [x] Default prefs still show the same user-visible toasts

### Continue hint

`Implement WU-04 from notification-center/10-WORK-UNITS.md`

---

## WU-04 — Notification Center Preferences UI

### Goal

Settings → Notifications Preferences tab exposes master + per-module controls bound to saved preferences.

### Why

Users cannot manage what they cannot see; master popup field currently lacks UI.

### How

1. Build Notification Center shell with tabs (Preferences / Appearance placeholder or wired / History placeholder).
2. Implement Preferences panel with UI Kit primitives.
3. Wire save through existing settings actions/facade.
4. i18n ru/en/fr/de/bg; stories light/dark; tests.
5. Hide/disable raise controls if WU-08 not done.
6. Update I18N coverage + UI catalog as needed.
7. PROGRESS + work history.

### Boundaries

- Presentational components only.
- No capture logic in React components.
- History functional regression not required in this WU if tab hosts existing panel unchanged.

### Evidence

- Component/hook tests
- `i18n:check`, typecheck, lint, `ui:catalog:check` if catalog touched

### Done when

- [x] Master toggle persists and affects next toast
- [x] Module disable suppresses that module’s popup only
- [x] minLevel quiet-successes behavior works

### Continue hint

`Implement WU-05 from notification-center/10-WORK-UNITS.md`

---

## WU-05 — Appearance relocation and General cleanup

### Goal

Appearance editors live under Notification Center; General no longer duplicates them; geometry non-regression holds.

### Why

One source of truth for toast chrome settings.

### How

1. Move placement/stacking/duration/maxVisible UI into Appearance tab.
2. General panel: remove editors; add navigation hint to Notifications → Appearance.
3. Keep or alias test IDs; update tests.
4. Re-run viewport geometry tests.
5. PROGRESS + work history.

### Boundaries

- No policy changes.
- No visual redesign of toaster chrome beyond settings relocation.

### Evidence

- Settings panel tests
- `NotificationViewport` / offset tests green

### Done when

- [x] Appearance changes still apply to live toaster
- [x] General has no duplicate editors

### Continue hint

`Implement WU-06 from notification-center/10-WORK-UNITS.md`

---

## WU-06 — History panel module expansion

### Goal

F-029 history filters/labels include the expanded module catalog without losing search/pagination/suppressed marker.

### Why

Prefs modules and history modules must stay aligned.

### How

1. Update filter options + i18n module labels.
2. Regression tests for history panel.
3. PROGRESS + work history.

### Boundaries

- No retention policy change.
- No journal file format break without parser compatibility.

### Evidence

- `SettingsNotificationHistoryPanel` tests
- i18n check

### Done when

- [x] New modules filterable when present in fixtures
- [x] Old entries still render

### Continue hint

`Implement WU-07 from notification-center/10-WORK-UNITS.md`

---

## WU-07 — F-030 preferences portability

### Goal

Operator preferences export/import round-trips Notification Center preferences into the active profile.

### Why

Portable prefs already ship appearance-related fields; nested/module prefs must not be lost.

### How

1. Update `PreferencesExportDocument` + tests.
2. Ensure import refreshes settings snapshot.
3. Update design doc if present.
4. PROGRESS + work history.

### Boundaries

- Journal excluded.
- Secrets exclusions unchanged.

### Evidence

- Preferences export/import tests
- registry cross-evidence

### Done when

- [x] Export/import preserves master/module/appearance
- [x] Invalid import fail-closed

### Continue hint

`Implement WU-08 or defer, then continue toward WU-10`

---

## WU-08 — Optional actionable window raise

### Goal

Per-module `errors_only` can raise the shell for actionable warning/error notifications via allowlisted IPC.

### Why

Some operators want error attention when the window is buried — without raising on every toast.

### How

1. Amend ADR-0013 / ADR-0025 with `notification_actionable` reason.
2. Wire `shouldRaiseWindow` from capture decision to `raiseShellWindow` with dedupe.
3. Enable Preferences raise control.
4. Tests for policy + IPC parse + no raise on informational/remote.
5. Document SDK-hide interaction.
6. PROGRESS + work history — or mark **deferred** with reason.

### Boundaries

- Defaults remain `never`.
- Must not gate incoming/campaign/SDK consent raises.
- No raise on success/info.

### Evidence

- Policy/raise tests
- ADR amendment accepted

### Done when

- [x] Default prefs ⇒ zero new raises
- [x] errors_only + actionable error ⇒ raise once per dedupeKey
- [ ] OR WU explicitly deferred

### Continue hint

`Implement WU-09 or defer, then WU-10`

---

## WU-09 — OS notification seam (optional / deferrable)

### Goal

Define and optionally implement `NotificationGateway` for background OS banners without regressing in-app toasts.

### Why

Toasts inside a minimized window are invisible; OS banners are the industry default — but permission/UX scope is large.

### How (minimal acceptable)

**Defer path (allowed):** document seam in ADR-0025, add port interface + mock only, no Electron adapter, mark deferred.

**Implement path:**

1. Port + Electron adapter + typed IPC.
2. Present OS banner only when shell not focused and prefs allow (module/master).
3. Click focuses shell.
4. Tests + manual smoke on Windows.
5. PROGRESS + work history.

### Boundaries

- Do not duplicate every in-app toast to OS when focused.
- Do not execute URLs from OCP bodies.
- Do not block capture on OS permission dialogs.

### Done when

- [x] Deferred with written reason, **or**
- [ ] OS banner path works for at least actionable errors when unfocused

### Continue hint

`Implement WU-10 from notification-center/10-WORK-UNITS.md`

---

## WU-10 — Documentation close, preflight, and release decision

### Goal

Acceptance gate green; F-034 marked implemented only when evidence complete; release cut only with user authorization.

### Why

Prevents “prefs UI shipped but registry/tests/docs diverge”.

### How

1. Walk `11-ACCEPTANCE.md` checklist.
2. Run full preflight commands from `08-TESTING.md`.
3. Close handoff/STATUS/TASK-QUEUE.
4. Set Feature Registry status `implemented` only if acceptance passes.
5. Do **not** SemVer bump unless user asks to ship.
6. PROGRESS + final work history.

### Boundaries

- No late scope (quiet hours, inbox overlay, etc.).
- No force-push / tag without authorization.

### Evidence

- Preflight command outputs
- Acceptance checklist
- work-history closure entry

### Done when

- [x] All required WUs done; optional WUs done or deferred
- [x] Compatibility law holds
- [x] User informed of ship/no-ship options

### Continue hint

`/preflight` → `/review` (or `/release` only if user authorizes)
