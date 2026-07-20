# Reset / Downgraded Settings — Recovery Design

**Status:** backlog design note (return after SDK work)  
**Context:** F-016 / Settings schema (`UserSettings`), P11 persistence  
**Related code:**

- `src/domain/settings/migrateUserSettings.ts`
- `src/adapters/settings/parsePersistedUserSettings.ts`
- `src/adapters/settings/FileSettingsRepository.ts`
- `src/renderer/hooks/useAccountBootstrap.ts`
- `src/renderer/App.tsx`
- `docs/softphone/P11-Settings-Schema-Design.md`

**Symptom today:** opening an older Axatalk build after a newer build wrote settings shows raw red text on the main shell, e.g.

```txt
settings_corrupt:unsupported_schema_version:uns…
```

(Full message is truncated in UI; root cause is a higher `schemaVersion` on disk than the running build understands.)

---

## Goal

Define a **product-correct, architecture-safe** policy for when the running app encounters persisted `UserSettings` written by a **newer** app version (downgrade / mixed-build scenario).

Outcomes we want:

1. No raw technical `settings_corrupt:*` string on the main screen.
2. Clear distinction between **corrupt data**, **schema too new**, and **validation failure**.
3. No silent wipe of user flags.
4. Explicit, recoverable UX (update app and/or user-confirmed reset).
5. An ADR that locks the policy before implementation.

Non-goals for this note:

- Implementing the change now.
- Full bidirectional schema downgrade of every new field.
- Changing contacts/history recovery (those already use conservative empty defaults).

---

## Problem (current behavior)

| Step | What happens |
| --- | --- |
| 1 | Newer build saves `UserSettings` with current `SETTINGS_SCHEMA_VERSION` (e.g. `9`). |
| 2 | Older build loads the same profile file. |
| 3 | `migrateUserSettings` rejects unknown / future versions as `unsupported_schema_version`. |
| 4 | Adapter throws `settings_corrupt:unsupported_schema_version:…`. |
| 5 | Bootstrap fails; `App` renders `error.message` as plain red text (not i18n). |

P11 design intentionally **hard-fails** unknown versions to avoid silently overriding user flags. That principle is good. The bug is that **“schema from the future”** is classified and surfaced the same way as **corrupt JSON**, and the UI has no recovery path.

---

## Options considered

### Option A — Downgrade not supported (fail closed + clear UX)

**Idea:** Older builds must not pretend they can use data written by newer builds. Detect `schema_too_new` and show a localized blocking screen: “Settings were created by a newer version. Please update Axatalk.”

| | |
| --- | --- |
| Pros | Honest; no data loss; no silent coercion; simplest Domain rules |
| Cons | Old build cannot run against newer data without updating or resetting |
| Fit | Strong for a telephony desktop app where mixed builds on one `userData` are rare and risky |

### Option B — Support N−1 (forward-compatible subset)

**Idea:** Evolve schema additively only. Older builds that understand `N−1` may read a known subset, ignore unknown keys, and **must not** rewrite the file with a lower `schemaVersion` unless an explicit downgrade migration exists.

| | |
| --- | --- |
| Pros | Softens one-version downgrade pain for power users / QA |
| Cons | Requires strict additive discipline, ignore-unknown rules, write-guard, tests per bump; easy to get wrong |
| Fit | Possible later; too heavy as the first fix |

### Option C — Explicit user-confirmed reset

**Idea:** When schema is too new (or corrupt beyond repair), offer “Reset settings to defaults for this version.” Only after confirmation: write current-schema defaults, log the action, continue bootstrap.

| | |
| --- | --- |
| Pros | Unblocks old build without silent wipe; user owns the trade-off |
| Cons | Loses local preference flags for that profile; must never auto-run |
| Fit | Excellent companion to Option A |

### Option D — Silent recover to defaults (like contacts/history)

**Idea:** On unsupported version, log + load `createDefaultUserSettings()` and keep going (and possibly overwrite disk).

| | |
| --- | --- |
| Pros | App always opens |
| Cons | Silent loss of theme/language/auto-answer/headset prefs; conflates corrupt with future schema; **rejected** as a hack for `UserSettings` |
| Fit | Wrong for this aggregate |

### Option E — UI-only catch-all

**Idea:** Swallow bootstrap errors in the renderer so “something” opens.

| | |
| --- | --- |
| Pros | Hides the red string |
| Cons | Leaves Domain/adapter contract broken; may boot with undefined settings; **rejected** |
| Fit | None |

---

## Recommended implementation for Axatalk

**Primary policy: Option A + Option C**

1. **Downgrade is not silently supported.**
2. **Classify `schema_too_new` separately from corrupt data.**
3. **Show localized recovery UX** with:
   - primary: update / open the matching newer build;
   - secondary: explicit “Reset settings for this version” (user consent).
4. Defer Option B (N−1 read support) unless product later requires it; if so, do it under a new ADR with additive-only rules.
5. Never adopt Option D or E for `UserSettings`.

This matches existing P11 intent (no silent override of user flags) while fixing the user-visible failure mode.

---

## What to do (work breakdown)

### 1. ADR

Create an ADR under `docs/softphone/adr/`, e.g. `ADR-XXXX-settings-schema-downgrade-policy.md`.

Decide and record:

- Downgrade policy = **A + C**.
- Error taxonomy (below).
- Write rule: never persist a lower `schemaVersion` over a higher one without explicit reset/downgrade path.
- UX + i18n requirements.
- Out of scope: Option B unless revisited.

### 2. Domain / migration classification

In `migrateUserSettings` (and any shared result type):

| Condition | Code | Notes |
| --- | --- | --- |
| Invalid JSON / non-object payload | `settings_corrupt` (or keep adapter `invalid_json`) | Damaged file |
| `schemaVersion` > app `SETTINGS_SCHEMA_VERSION` (or otherwise unknown future) | `settings_schema_too_new` | Downgrade case |
| Same version, invalid fields | `settings_validation_failed` | Keep existing behavior |
| Known older versions `0…current` | migrate / coerce as today | Unchanged |

Stop stuffing future-schema into `settings_corrupt:unsupported_schema_version:…`.

### 3. Adapter boundary

`parsePersistedUserSettingsJson` / `FileSettingsRepository.getUserSettings`:

- Map Domain migration errors to typed failures (prefer `Result` / `PlatformError`, not raw `throw new Error(string)` long-term).
- Do **not** auto-write defaults on `schema_too_new`.
- Optional: refuse overwrite while `schema_too_new` is unresolved (mirror `corruptDocumentDetected` pattern used by saved-account-profiles), until user confirms reset.

### 4. Application / bootstrap

- `AccountBootstrapFacade` / settings load path maps codes to `PlatformError` with stable semantic codes.
- Bootstrap must not die with an unclassified `Error.message`.
- Expose a explicit command/use-case style API, e.g. `resetUserSettingsAfterSchemaTooNew(accountKey)` that:
  - writes `createDefaultUserSettings()` at current schema;
  - logs feature id, account key (non-secret), previous schema version if known, result;
  - refreshes projections;
  - allows bootstrap to continue.

### 5. UI + i18n

Replace raw bootstrap error text in `App` / `useAccountBootstrap` with:

- Localized copy for all locales (`ru`, `en`, `fr`, `de`, `bg`).
- States:
  - **Schema too new** — explain + “Update app” guidance + “Reset settings…” action.
  - **Corrupt settings** — explain + “Reset settings…” (and support/log hint).
  - **Other bootstrap failures** — keep generic localized initialization error (no stack/technical codes).

No hardcoded user-visible English strings in components.

### 6. Tests

- Domain: future `schemaVersion` → `settings_schema_too_new` (not corrupt).
- Adapter: does not overwrite file on load of too-new schema.
- Application: reset path writes current defaults and clears the blocking state.
- UI: renders i18n keys / recovery actions; never shows `settings_corrupt:` raw string for this case.
- Regression: upward migration `v0…vN` still works.

### 7. Docs / registry

- Update `P11-Settings-Schema-Design.md` “Corrupt / unsupported version” section.
- Feature Registry note under F-016 (or linked recovery UX entry).
- Work-history when implemented.

---

## How to do it (suggested sequence)

```txt
1. ADR (policy A+C) — no code yet
2. Domain error taxonomy + migrateUserSettings tests
3. Adapter mapping + write-guard (no silent overwrite)
4. Application reset command + bootstrap mapping to PlatformError
5. Renderer recovery screen + i18n (5 locales)
6. Preflight: test + lint + typecheck + i18n:check
7. STATUS / Feature Registry / design doc sync
```

Implementation agents: `/logic` for Domain/Application; `/ui` for recovery shell; `/review` after handoff.

Do **not** start this while SDK-02 (or other SDK WUs) are in flight unless explicitly prioritized — this note is the return point.

---

## Expected result

### User-visible

| Scenario | Expected UX |
| --- | --- |
| Newer settings, older app | Localized screen: settings require newer app; optional confirmed reset |
| Corrupt JSON | Localized corrupt-settings recovery (reset), not raw exception text |
| Normal upgrade (old file → new app) | Existing upward migration; app starts normally |
| After confirmed reset | App boots with current-schema defaults for that profile |

### Technical

- `schema_too_new` ≠ `corrupt` in Domain and logs.
- No silent defaulting of future schema.
- No writing lower schema over higher without explicit reset.
- Bootstrap errors are semantic + i18n, not `error.message` dumps.
- ADR documents the policy for future schema bumps.

### Explicitly not expected

- Automatic wipe on every unsupported version.
- Old build rewriting v9+ files down to v8 “to make it work.”
- Renderer catch-all that hides all bootstrap failures.

---

## Operational workaround (until implemented)

For developers hitting the red banner today:

1. Prefer running the **same or newer** build that wrote the settings.
2. Or manually reset the profile settings file under Electron `userData` profiles storage (Mac: typically under `~/Library/Application Support/Axatalk/…`) — this loses local prefs for that profile.
3. Do **not** hand-edit `schemaVersion` downward in JSON as a “fix.”

---

## Decision summary

| Choice | Verdict |
| --- | --- |
| A — Fail closed + clear UX | **Adopt** |
| C — Explicit reset | **Adopt** (secondary action) |
| B — N−1 read support | Defer; separate ADR if needed |
| D — Silent defaults | Reject for `UserSettings` |
| E — UI swallow | Reject |

**One-line policy:** *Axatalk does not silently downgrade settings; it explains the mismatch and only resets after the user confirms.*
