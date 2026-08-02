# F-034 Policy and Channels

- Purpose: lock presentation policy, interrupt classes, and delivery-channel rules.
- Inputs: descriptor metadata, active `UserNotificationPreferences`, shell visibility facts (optional).
- Outputs: deterministic `{ shouldPresentPopup, shouldRaiseWindow, suppressReasons }`.

## Policy function (pure)

```ts
type PresentationPolicyInput = Readonly<{
  level: UserNotificationLevel;
  module: UserNotificationModule;
  interruptClass: NotificationInterruptClass;
  preferences: UserNotificationPreferences;
}>;

type PresentationPolicyDecision = Readonly<{
  shouldPresentPopup: boolean;
  shouldRaiseWindow: boolean;
  suppressReasons: ReadonlyArray<
    | "master_popup_disabled"
    | "module_disabled"
    | "below_min_level"
    | "interrupt_not_toast"
    | "raise_not_enabled"
    | "raise_level_too_low"
    | "raise_interrupt_denied"
  >;
}>;
```

Place pure evaluation in Domain (`userNotificationPresentationPolicy.ts`). CaptureService calls it after validating inputs and before/while recording journal.

## Evaluation order

1. If `interruptClass === "critical"` → `shouldPresentPopup = false` for toast pipeline (critical UX is modal/banner/ADR-0013). Journal may still record if a producer incorrectly routes critical through capture; prefer producers not calling toast notify for critical.
2. If `masterInAppPopupEnabled === false` → suppress popup (`master_popup_disabled`).
3. If `modules[module].enabled === false` → suppress popup (`module_disabled`).
4. If `rank(level) < rank(minLevel)` → suppress popup (`below_min_level`).
5. Else → `shouldPresentPopup = true`.

Raise evaluation (independent, only when popup would be meaningful or even if suppressed — **locked choice**: raise may occur only when the event is actionable and prefs allow, **even if** toast suppressed?  

**Locked v1:** raise is considered only when `shouldPresentPopup` would have been true **or** when level is `error|warning` and module enabled but master toast off is **not** enough to force raise. Simpler lock:

- `shouldRaiseWindow` requires all of:
  - `modules[module].raiseWindow === "errors_only"`
  - `level` is `warning` or `error`
  - `interruptClass === "actionable"`
  - `modules[module].enabled === true`
  - master popup may be false — **still allow raise** for errors_only (operator chose “surface errors even without toasts” via raise). Document in UI copy.
- Else `shouldRaiseWindow = false` with appropriate suppress reasons.

Default prefs ⇒ raise always false.

## Channel matrix

| Channel | Owner | When |
| --- | --- | --- |
| Journal | F-029 capture | Always on every capture attempt that validates |
| In-app toast | LF-060 viewport | `shouldPresentPopup` |
| Shell raise | ADR-0013 controller | Existing producers **or** F-034 optional actionable raise |
| OS banner | Future `NotificationGateway` | Deferred; if implemented, only when window not focused and prefs allow |

## Existing ADR-0013 reasons (untouched)

```txt
incoming_call
outgoing_call
ocp_campaign_offer
sdk_origin_trust
sdk_pairing
sdk_activate_consent
second_instance
```

These producers call `raiseShellWindow` directly and **do not** go through toast policy. F-034 must not gate or delay them.

## Optional raise reason extension

If optional module `errors_only` is implemented:

1. Amend ADR-0013 (or ADR-0025 references amendment) to add:

```ts
"notification_actionable"
```

2. Payload includes `dedupeKey` = notification id.
3. Main still uses `bringBrowserWindowToFront`.
4. SDK-hide: follow existing show/hide policy; do not bypass telephony-busy / rate-limit rules already applied to SDK show. If conflict exists, **prefer no raise** over violating SDK hide (document in ADR).

## OCP remote notifications

`mapOcpNotificationToToastDescriptor` presentation uses **only**:

- `body` → `messageText` (skip if trim empty)
- `type` → level: `success`→success, `error`→error; all other wire types → `info`

Ignored for toast lifecycle: `uuid`, `time`, `blocked`, `deleted`, `sticky`, `position` (and any other OCP fields). Optional stable toast id from wire `id` when non-empty.

Always tags:

- `module: "ocp"`
- `functionId: "ocp.notification"`
- `interruptClass: "remote"`

Remote class: never auto-raise in v1. Suppressible via OCP module prefs / minLevel / master. Placement/duration/stacking from Softphone Notification Center prefs (F-034 / ADR-0025), not OCP wire.

## Recommended operator presets (UI helpers, not separate schema)

Settings may offer non-persisted quick actions that write the same fields:

| Preset | Effect |
| --- | --- |
| Default | All modules enabled, minLevel `info`, raise `never`, master on |
| Quiet successes | All modules `minLevel = warning` (errors+warnings only) |
| Telephony focus | `telephony`+`headset`+`account`+`ocp` full (`info`); noise modules (`contacts`/`history`/`updates`/`sdk`/`externalServices`/`externalApplications`) `minLevel = error` |

Presets are non-persisted UI helpers that write the same preference fields (implemented in Preferences panel).

## Shell visibility (informational)

v1 policy does **not** require knowing minimized/obscured state for toast suppress (toasts in a hidden BrowserWindow are inherently unseen — that is why OS channel is deferred). Do not invent focus polling in renderer for v1 policy.

## Non-regression examples

| Event | Today | After defaults |
| --- | --- | --- |
| SIP registration succeeded toast | shown + journaled | shown + journaled |
| Master popup off (via new UI) | field existed, no UI | journaled, suppressed |
| Incoming call | modal + raise | modal + raise |
| OCP notification (any sticky/position) | toast via prefs | toast if OCP module allows; duration/placement from Softphone prefs |
| CSV export success | toast often untagged → system | toast with `contacts` module, still shown by default |
