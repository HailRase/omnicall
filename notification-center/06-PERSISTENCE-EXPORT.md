# F-034 Persistence and Export

- Purpose: persist Notification Center preferences per profile and keep F-029 journal + F-030 rules coherent.
- Inputs: validated `UserSettings`, active `SettingsAccountKey`, unknown import bundles, journal documents.
- Outputs: atomic profile saves, portable preference round trips, unchanged journal retention semantics.

## Profile preferences

- Preferences live inside `UserSettings` (nested and/or migrated flat fields per `02-DATA-MODEL.md` Strategy A/B).
- `SettingsRepository` remains the only configuration persistence port.
- Save path: load aggregate → replace notification preference slice → validate whole `UserSettings` → atomic write → refresh renderer snapshot.
- Failed validation/persistence leaves prior effective prefs active.
- Anonymous / fresh profiles receive behavior-preserving defaults (popups on, all modules on, appearance defaults).

Do not create a parallel notification-preferences JSON store. That would break migration, profile isolation, and F-030.

## Journal persistence (F-029 unchanged)

- App-scoped rolling 24-hour journal via existing `UserNotificationJournalRepository` adapters.
- Capture still appends when popups are suppressed.
- Secret-like values remain redacted before persistence.
- Corrupt documents remain quarantined by the file adapter.
- Journal stays excluded from F-030 export/import.

If module catalog expands, journal parser must accept new module enums without invalidating historical entries that use older modules.

## `UserSettings` migration

Example for main tip at plan cut (`13 → 14`):

1. Read prior flat notification fields when present.
2. Build `notificationPreferences` (or module map) with identical appearance + `masterInAppPopupEnabled`.
3. Fill every known module with `{ enabled: true, minLevel: "info", raiseWindow: "never" }`.
4. Validate current schema; fail closed on malformed current documents.
5. Future unknown schema versions fail closed.

Update all migration fixtures and operator-preferences fixtures that freeze schema version.

## F-030 operator preferences

Keep `PREFERENCES_EXPORT_FORMAT_VERSION = 1`. Nested `notificationPreferences` ride inside migrated `UserSettings` (schema **14**).

Evidence (WU-07):

```txt
src/domain/settings/PreferencesExportDocument.ts (+ tests)
src/application/use-cases/settings/OperatorPreferencesUseCases.test.ts
docs/softphone/P11-Operator-Preferences-Export-Design.md
```

Rules:

- Export includes notification preferences (master, appearance, modules).
- Import targets active profile through existing whole-settings import.
- Journal excluded.
- SIP/OCP/SDK secrets remain excluded as today.
- Successful import refreshes settings projection without restart; invalid import does not mutate.

## Runtime refresh

After save/import:

- `useSettingsActions` / facade snapshot updates immediately.
- Next `notify` uses new policy.
- Already visible toasts are not retroactively dismissed unless stacking rules already replace them.

## Backup / downgrade note

Older app builds that do not understand schema `N+1` must fail closed on newer profiles (existing platform law). F-034 must not invent silent field dropping that re-enables unsafe dual meaning. Document migration in ADR-0025 and Settings schema design notes.
