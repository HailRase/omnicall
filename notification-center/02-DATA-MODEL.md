# F-034 Data Model

- Purpose: define immutable, validated Notification Center preferences and module contracts.
- Inputs: existing flat `notification*` `UserSettings` fields, journal module catalog, editor drafts, F-030 bundles.
- Outputs: migrated current-schema `UserSettings`, pure policy inputs, and UI-safe preference view models.

## Schema bump

At WU-01 execution time, bump `SETTINGS_SCHEMA_VERSION` from the **then-current** value `N` to `N+1` (on `origin/main` tip used to cut this plan: **13 → 14**).

Rules:

- Additive migration only.
- Unknown future schemas fail closed.
- Defaults must make post-migration behavior identical to pre-migration behavior for all existing toast classes.
- Outer F-030 `PREFERENCES_EXPORT_FORMAT_VERSION` stays `1` unless the bundle envelope itself changes.

Update:

```txt
src/domain/settings/UserSettings.ts
src/domain/settings/validateUserSettings.ts
src/domain/settings/migrateUserSettings.ts
src/application/settings/migrateUserSettings.test.ts
src/domain/settings/validateUserSettings.test.ts
```

and every fixture asserting the previous current schema version.

## Module catalog

Extend `USER_NOTIFICATION_MODULES`:

```ts
export const USER_NOTIFICATION_MODULES = [
  "system",
  "account",
  "telephony",
  "ocp",
  "settings",
  "contacts",
  "history",
  "headset",
  "media",
  "sdk",
  "updates",
  "externalServices",
  "externalApplications",
] as const;
```

- `externalApplications` added post-WU-10 when F-032 producers existed (defaults popup-on; no silent hide).
- Journal persistence must accept the expanded union; old journal files with known modules continue to parse.
- Journal entries persist additive `suppressReasons: NotificationSuppressReason[]` (missing → `[]` on load; no journal schemaVersion bump).
- UI filter/i18n keys must cover every catalog member.

## Level ordering

```ts
const USER_NOTIFICATION_LEVEL_RANK: Record<UserNotificationLevel, number> = {
  info: 0,
  success: 1,
  warning: 2,
  error: 3,
};
```

`minLevel` means: present popup only when `rank(level) >= rank(minLevel)`.

## Preferences aggregate

Preferred nested shape (names may be adjusted in WU-01 if shorter aliases improve clarity, but semantics are locked):

```ts
type NotificationRaiseWindowMode = "never" | "errors_only";

type UserNotificationModulePreferences = Readonly<{
  enabled: boolean;
  minLevel: UserNotificationLevel;
  raiseWindow: NotificationRaiseWindowMode;
}>;

type UserNotificationAppearancePreferences = Readonly<{
  placement: NotificationPlacement;
  stacking: NotificationStacking;
  durationMs: number;
  closable: boolean;
  maxVisible: number;
}>;

type UserNotificationPreferences = Readonly<{
  masterInAppPopupEnabled: boolean;
  appearance: UserNotificationAppearancePreferences;
  modules: Readonly<Record<UserNotificationModule, UserNotificationModulePreferences>>;
}>;
```

### Defaults (behavior-preserving)

```ts
const DEFAULT_MODULE_PREFERENCES: UserNotificationModulePreferences = {
  enabled: true,
  minLevel: "info",
  raiseWindow: "never",
};

// masterInAppPopupEnabled: true
// appearance: copy of today’s DEFAULT_NOTIFICATION_* constants
// modules: every USER_NOTIFICATION_MODULES member → DEFAULT_MODULE_PREFERENCES
```

## Compatibility with flat fields

Two acceptable persistence strategies (pick one in WU-01; document in ADR-0025):

### Strategy A — nested source of truth (recommended)

- Persist `notificationPreferences` nested object.
- During migration, populate nested fields from flat `notificationPlacement`, `notificationStacking`, `notificationDurationMs`, `notificationClosable`, `notificationMaxVisible`, `notificationPopupEnabled`.
- Keep flat fields as deprecated mirrored getters **or** remove them in the same schema bump with migration-only reads (no dual-write drift).
- If removed, update all TypeScript call sites in the same WU.

### Strategy B — flat + nested modules only

- Keep existing flat appearance/master fields.
- Add `notificationModulePreferences` map only.

Strategy A is preferred for a true Notification Center; Strategy B is acceptable if WU-01 file-budget pressure is extreme. Do not leave two editable sources of truth in UI.

## Capture / journal entry

`UserNotificationJournalEntry` remains:

- `module`, `functionId`, `level`, `titleKey`, `titleParams`, `titleSnapshot`
- `suppressedAtEmission`, `correlationId`, account identity fields

Optional additive (only if needed and migrated carefully):

```ts
interruptClass?: "critical" | "actionable" | "informational" | "remote"
```

If persisted, older journal entries omit it and UI shows “—” / default informational. Prefer **not** requiring interruptClass in the journal document for v1 if it complicates retention parsing; policy can evaluate interruptClass at emission without persisting it.

## Descriptor contract (renderer → capture)

```ts
type NotificationDescriptor = Readonly<{
  id?: string;
  level: NotificationLevel;
  messageKey?: TranslationKey;
  messageText?: string;
  messageParams?: NotificationParams;
  durationMs?: number;
  action?: NotificationAction;
  onClose?: () => void;
  module: UserNotificationModule;          // required after tagging WU
  functionId: string;                      // required after tagging WU
  correlationId?: string | null;
  interruptClass?: NotificationInterruptClass; // default informational
}>;
```

Migration bridge in capture:

- missing `module` → `"system"`
- missing `functionId` → `"renderer.notification"`
- missing `interruptClass` → `"informational"` (OCP remote mapper sets `"remote"`; action bridges set `"actionable"` for errors with CTA / faults)

## Validation invariants

- `masterInAppPopupEnabled` boolean.
- Appearance clamps identical to today’s `NotificationSettings.ts` helpers.
- Every catalog module key present after parse; missing keys filled with defaults (forward-compatible when catalog grows).
- Unknown module keys in stored JSON: reject on current-schema validate, or strip with structured migration warning — choose strip-for-migration / reject-for-current and test both paths.
- `raiseWindow` only `never` | `errors_only`.
- `minLevel` only catalog levels.
- No free-form module strings in Domain policy.

## F-030 portability

- Export/import includes notification preferences (appearance + master + modules).
- Journal remains excluded.
- Import applies to active profile and refreshes renderer settings snapshot without restart.
- Invalid preferences fail closed without partial apply.

## View models

Application projections for Settings:

```ts
type NotificationCenterPreferencesViewModel = Readonly<{
  masterInAppPopupEnabled: boolean;
  appearance: UserNotificationAppearancePreferences;
  modules: ReadonlyArray<{
    module: UserNotificationModule;
    enabled: boolean;
    minLevel: UserNotificationLevel;
    raiseWindow: NotificationRaiseWindowMode;
  }>;
}>;
```

Renderer maps VM → controls; no Domain imports of i18n.
