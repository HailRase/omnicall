# F-034 Capture and Presentation

- Purpose: specify the runtime path from producer intent to journal + toast + optional raise.
- Inputs: `NotificationDescriptor`, active profile preferences, facade capture API.
- Outputs: journal entry, optional Sonner item, optional shell raise; structured logs on failure.

## Single capture sink (ADR-AF-007 preserved)

Every user-facing toast must pass:

```txt
notify(descriptor)
  → captureUserNotification(...)
  → UserNotificationCaptureService.capture
  → RecordUserNotificationUseCase
  → presentation policy decision
  → presenter applies decision
```

Forbidden:

- Direct Sonner/`toast()` calls outside `NotificationViewport` sync.
- Journal writes that bypass CaptureService.
- Module suppress logic inside random hooks.

## Facade command shape

Extend `CaptureUserNotificationCommand` as needed:

```ts
type CaptureUserNotificationCommand = Readonly<{
  id?: string;
  level: UserNotificationLevel;
  module: UserNotificationModule;
  functionId: string;
  titleKey: string | null;
  titleParams: Readonly<Record<string, string | number>>;
  titleSnapshot: string;
  correlationId: string | null;
  interruptClass?: NotificationInterruptClass;
  // popupEnabled removed as caller-supplied authority — Capture reads preferences
}>;
```

**Important change vs today:** renderer currently passes `popupEnabled: settings.notificationPopupEnabled`. After F-034, CaptureService (or facade) loads active preferences and evaluates policy centrally. Renderer must not re-implement module rules.

Migration note: during transitional commits, facade may still accept optional `popupEnabled` override for tests, but product path ignores ad-hoc overrides.

## `useNotifications` contract

Keep public `notify` / `dismiss` / `dismissAll` API.

Update capture callback result:

```ts
capture?: (
  descriptor: NotificationDescriptor,
  id: string,
  titleSnapshot: string,
) => Promise<Readonly<{
  shouldPresentPopup: boolean;
  shouldRaiseWindow?: boolean;
}>>;
```

On `shouldPresentPopup`, enqueue as today (stacking/maxVisible/duration unchanged).

On `shouldRaiseWindow`, shell hook (SoftphoneReadyShell or dedicated hook) calls:

```ts
window.softphone.raiseShellWindow({
  reason: "notification_actionable",
  dedupeKey: id,
});
```

WU-08: reason `notification_actionable` is allowlisted (ADR-0013); Capture forwards Domain `shouldRaiseWindow`; `useNotifications` calls injected `raiseWindow` with dedupeKey = notification id; Preferences raise control is enabled (default `never`).

## Producer tagging matrix (required WU)

| Producer | module | functionId examples | interruptClass |
| --- | --- | --- | --- |
| `useActionNotifications` account | `account` | `account.sign_in`, `account.logout` | actionable on errors with CTA; else informational |
| `useActionNotifications` call/SIP | `telephony` | `call.outgoing`, `sip.recovery`, `call.dtmf` | actionable on failures |
| `useActionNotifications` settings | `settings` | `settings.update` | actionable on error |
| `useActionNotifications` headset | `headset` | `headset.fault` | actionable |
| OCP toast presenter | `ocp` | `ocp.notification` | remote |
| OCP auth feedback toast | `ocp` | `ocp.auth_feedback` | actionable |
| OCP campaign / status / reject-break | `ocp` | `ocp.campaign.decision`, `ocp.status.reserved`, `ocp.status.reserve`, `ocp.incoming.reject_with_break` | informational / actionable on error |
| OCP logout modal | `account` | `account.logout` | actionable on error |
| Contacts CSV | `contacts` | `contacts.csv.import`, `contacts.csv.export` | informational / actionable on error |
| History redial / delete | `history` | `history.redial`, `history.delete` | informational / actionable on error |
| Video downgrade | `media` | `media.video.downgrade` | actionable |
| Update check toast (if any) | `updates` | `updates.check` | informational |
| SDK non-modal toasts (if any) | `sdk` | `sdk.*` | actionable/informational |

SoftphoneReadyShell OCP auth feedback is tagged (`ocp` / `ocp.auth_feedback` / `actionable`). Static checklist: `src/renderer/hooks/notificationProducerTagging.test.ts`.

## Presentation chrome (unchanged)

- `NotificationViewport` + `resolveNotificationToasterOffset` geometry laws stay.
- Success/error icon distinction on neutral surface stays.
- CTA actions (`openSystemState`, etc.) stay on descriptors when presented.
- Sticky duration `0` honored when presented.

## Logging

On capture:

```txt
operation: capture_user_notification
featureId: F-034 (and F-029 for journal write)
module, functionId, level, interruptClass
shouldPresentPopup, shouldRaiseWindow
suppressedReasons
correlationId when present
result: ok | journal_failed | validation_failed
```

Never log title params that may contain phones/tokens beyond existing sanitizer output; rely on Domain sanitization already used by F-029.

## Error handling

| Failure | Behavior |
| --- | --- |
| Journal write fails | log error; presentation fail-open (show toast if policy allowed) — preserves today’s catch enqueue |
| Policy throws | treat as bug; fail-open present + log |
| Raise IPC fails | log; do not retry loop; toast unaffected |
| Settings missing module key | defaults filled by parser before policy |

## Concurrency

- Toast queue remains renderer-local.
- No global mutex with Call Engine.
- Rapid notify calls each create journal entries (no dedupe) per LF-060.

## Disposal

- SoftphoneReadyShell clears OCP notification handler on unmount (existing).
- No new background timers in CaptureService.
