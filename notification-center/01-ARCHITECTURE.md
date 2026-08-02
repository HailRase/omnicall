# F-034 Architecture

- Purpose: define the Notification Center vertical slice without breaking LF-060 / F-029 / ADR-0013.
- Inputs: typed notification descriptors, profile preferences, existing Domain Events that already surface as toasts.
- Outputs: capture outcomes, presentation decisions, Settings projections, and portable preference persistence.

## Decision summary

- **Settings** owns preference aggregate shape, migration, F-030 portability, and journal query UX.
- **Application** owns `UserNotificationCaptureService` policy: journal always; popup / optional raise decided from preferences + interrupt class + level + module.
- **Renderer** owns toast queue rendering (`useNotifications` + `NotificationViewport`) and Settings hub UI; it does not invent suppress rules.
- **Domain** owns pure preference parsing, module catalog, level ordering, and policy pure functions (no Electron/React).
- Critical operator attention remains **ADR-0013** (`ShellWindowAttentionController` + allowlisted `ShellWindowRaiseReason`). F-034 may request raise only through that contract for approved optional cases.
- OS notifications use a future `NotificationGateway` port; v1 ships the port/mock only if WU-OS is opened, otherwise documents the seam without runtime OS banners.
- ADR-0025 is required before preference policy code lands to record: capture-owned policy, default-preserving migration, module catalog expansion, and raise/OS boundaries.

## Layer map

```txt
Producers (hooks / OCP presenter / action bridges)
  → NotificationDescriptor { module, functionId, level, interruptClass?, ... }
  → useNotifications.notify
      → AccountBootstrapFacade.captureUserNotification
          → UserNotificationCaptureService
              → RecordUserNotificationUseCase (journal always)
              → evaluateNotificationPresentationPolicy (Domain/Application pure)
          ← { shouldPresentPopup, shouldRaiseWindow?, suppressedReasons }
      → enqueue Sonner item iff shouldPresentPopup
      → optional raiseShellWindow iff shouldRaiseWindow (allowlisted)

Settings UI
  → Notification Center panels (Policy / Appearance / History)
  → facade saveUserSettings / queryUserNotificationJournal
  → UserSettings.notificationPreferences (+ legacy flat fields during migration)
```

## Current baseline (must not regress)

| Asset | Path / contract |
| --- | --- |
| Toast hook | `src/renderer/hooks/useNotifications.ts` |
| Action bridge | `src/renderer/hooks/useActionNotifications.ts` |
| Viewport | `src/renderer/components/notifications/NotificationViewport.tsx` |
| Capture | `src/application/services/settings/UserNotificationCaptureService.ts` |
| Record / Query | `RecordUserNotificationUseCase` / `QueryUserNotificationJournalUseCase` |
| Journal modules | `USER_NOTIFICATION_MODULES` in Domain |
| Raise IPC | `ShellWindowRaiseContract` + `ShellWindowAttentionController` |
| Prefs today | flat `notification*` fields on `UserSettings` + unused-in-UI `notificationPopupEnabled` |

## Domain ownership

Create / extend under `src/domain/settings/`:

- `UserNotificationPreferences.ts` — nested preferences aggregate + defaults matching today’s behavior.
- `userNotificationPresentationPolicy.ts` — pure `evaluatePresentation(input) → decision`.
- Expand `USER_NOTIFICATION_MODULES` with `sdk`, `updates`, `externalServices` (and `externalApplications` only when that feature exists on the branch).
- Level rank helpers for `minLevel` comparison.
- Parsers from `unknown` for migration/validation.

Domain must not import Electron, React, Zustand, Sonner, IPC, or filesystem.

## Application ownership

- Extend `UserNotificationCaptureService.capture` to accept preferences (or read via injected snapshot) and return a richer outcome:

```ts
type UserNotificationCaptureOutcome = Readonly<{
  entry: UserNotificationJournalEntry;
  shouldPresentPopup: boolean;
  shouldRaiseWindow: boolean;
  suppressReasons: ReadonlyArray<NotificationSuppressReason>;
}>;
```

- Keep `suppressedAtEmission` meaning: popup was not presented at emission time (master off, module off, level below threshold, or interrupt rules). Journal always written.
- Facade `captureUserNotification` becomes the single renderer entry; it resolves active preferences from the current profile settings snapshot already available to the facade.
- Do **not** move toast rendering into Application.
- Do **not** subscribe CaptureService to Domain Events directly in v1; producers remain explicit bridges (preserves today’s control and avoids double toasts).

## Ports

### Existing

- `UserNotificationJournalRepository` — unchanged semantics (24h rolling, redaction).
- Settings repository — persists nested preferences inside `UserSettings`.

### Optional later (WU-OS)

```ts
// src/ports/platform/NotificationGateway.ts
type OsNotificationRequest = Readonly<{
  id: string;
  title: string;
  body: string;
  module: UserNotificationModule;
  correlationId: string | null;
  urgency: "normal" | "important";
}>;
```

Adapter: `ElectronNotificationAdapter` in main via typed IPC. Click focuses shell through existing bring-to-front helper. v1 may stop after documenting this seam in ADR-0025 without implementing the adapter.

## Renderer ownership

- `SoftphoneReadyShell` keeps constructing `useNotifications` with `capture` callback.
- Capture callback must pass module/functionId/level/params; policy result drives enqueue.
- Move appearance editors from `SettingsGeneralPanel` into Notification Center Appearance section; General may show a one-line deep-link (“Managed in Notifications”) to avoid two sources of truth.
- History panel stays; module filter options regenerate from Domain catalog.
- No product business rules inside UI Kit Toast primitives.

## Window raise integration

```txt
shouldRaiseWindow === true
  → only if preferences.module.raiseWindow === "errors_only"
  → and level is warning|error
  → and interruptClass is actionable (not informational/remote)
  → and shell raise reason is an allowlisted extension OR reuse a dedicated
      ShellWindowRaiseReason such as "notification_actionable" (requires ADR-0013 amendment)
  → dedupeKey = notification id / correlationId
```

Default preferences keep `raiseWindow: "never"` for all modules → **zero new raises** after migration.

Critical raises remain producer-owned (call hooks / campaign hooks / SDK) and are **out of toast policy**.

## Composition and lifecycle

- No new long-lived subscriber bus required for v1.
- Preferences apply on next `notify` after settings save; no app restart.
- Logout/profile switch: facade resolves new account key + settings; journal query filters by identity as today.
- Capture remains resilient: journal failure logs + structured error; presentation fail-open policy documented in ADR (preserve current enqueue-on-capture-error unless explicitly changed with tests).

## Chosen and rejected alternatives

| Choice | Why |
| --- | --- |
| Policy inside CaptureService | Single choke point already mandated by ADR-AF-007 |
| Nested `notificationPreferences` with migration from flat fields | Cleaner Settings hub; defaults identical |
| Expand module catalog in Domain | Journal filters and prefs share one enum |
| Defer OS gateway implementation | Avoid Electron permission/UX scope in first ship; design seam now |
| Reject toast-owned history | Already rejected in ADR-AF-007 |
| Reject raise-on-every-notify | Focus steal / SDK-hide / operator CRM conflict |
| Reject second toast stack | LF-059 removed; LF-060 is sole viewport |
| Reject store-owned policy | Zustand stays projection-only |

## Boundary impact

- Touches Settings Domain/Application/Renderer heavily.
- Touches Integration/Telephony/Headset/Media only for descriptor tagging (`module` / `functionId` / interrupt class) — no state machine changes.
- May amend ADR-0013 only if `notification_actionable` raise reason is added.
- F-030 export includes new preference fields; journal remains excluded.
- File size budgets: split policy, migration, and Settings panels before exceeding component/hook/file limits.

## Required architecture tests

- Domain policy matrix: master/module/minLevel/interrupt combinations.
- Migration: previous schema → new schema preserves popup-on and appearance values.
- Capture integration: journal written when popup suppressed.
- Descriptor tagging tests: action notifications, OCP mapper, contacts/history/video supply modules.
- Non-interference: incoming raise, campaign raise, SDK consent raise still fire with prefs default.
- Renderer: master toggle and module toggle change presentation without breaking viewport geometry tests.
