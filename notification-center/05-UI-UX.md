# F-034 UI and UX

- Purpose: define the Settings Notification Center hub and preference controls.
- Inputs: Application preference/history view models, translated copy, disabled reasons, callbacks.
- Outputs: accessible UI intent only; no capture policy, journal IO, or raise IPC inside presentational components.

## Navigation

- Keep Settings section id `notifications` (`settings-nav-notifications`).
- Replace history-only leaf content with a hub that contains Preferences, Appearance, and History.
- Icon remains `settings.notifications` (Bell / BellIcon); update label copy if needed (“Notifications” stays valid).
- Available without forcing Integrations auth gate (history already available broadly); preferences apply to active profile including anonymous defaults.

## Hub layout

```txt
┌─ Notifications ──────────────────────────────────────────────┐
│ [ Preferences ] [ Appearance ] [ History ]   ← tabs or segments │
│                                                                │
│  Panel content…                                                │
└────────────────────────────────────────────────────────────────┘
```

- Use UI Kit `Tabs` if it already meets a11y gates; otherwise segmented control consistent with General notification controls.
- Light + dark via semantic tokens only.
- Test IDs:

```txt
settings-notification-center
settings-notification-center-tab-preferences
settings-notification-center-tab-appearance
settings-notification-center-tab-history
```

## Preferences panel

### Master switch

- Switch/checkbox: “Show in-app popups”.
- Description: journal continues recording when off.
- Test ID: `settings-notification-master-popup`.
- Binds `masterInAppPopupEnabled` / migrated `notificationPopupEnabled`.

### Module list

Each row:

| Element | Behavior |
| --- | --- |
| Module name | i18n `settings.notifications.module.*` |
| Enabled switch | module.enabled |
| Minimum level select | info / success / warning / error |
| Raise select | Never / On errors (errors_only) — hide or disable until raise reason ships |
| Short description | what the module covers |

Test IDs:

```txt
settings-notification-module-{module}
settings-notification-module-{module}-enabled
settings-notification-module-{module}-min-level
settings-notification-module-{module}-raise
```

Optional preset buttons above the list (Default / Quiet successes) write the same fields through the save path.

Per-module popup filter: label “Show popups”; options All / Success, warnings, and errors / Warnings and errors / Errors only (domain `minLevel` threshold). Hint: selected importance and everything more serious. Controls in a two-column compact row.

### Empty / loading / error

- Preferences load from current `userSettings` snapshot — usually sync; if save fails, show inline error + retry via existing settings error projection patterns.
- No spinner forever: disabled controls need reasons.

## Appearance panel

Move controls from `SettingsGeneralPanel`:

- Placement segmented control
- Stacking segmented control
- Duration number input
- Max visible number input

Preserve existing test IDs where possible (`settings-notification-placement-control`, etc.) or add aliases and update catalog in the same WU.

General panel:

- No notification section (editors and relocation CTA live only under Notifications).

## History panel

- Keep `SettingsNotificationHistoryPanel` + `NotificationHistoryTable` capabilities.
- Extend module filter options for new modules.
- Preserve pagination, search, suppressed marker, account local-part display.
- No functional regression allowed.

## UX states

| State | UI |
| --- | --- |
| Default prefs | All modules on, minLevel info, master on |
| Master off | Module controls visible but popups suppressed; helper text explains journal-only mode |
| Module off | Row unchecked; minLevel/raise disabled with reason |
| Save failure | Error text; previous values remain effective until success |
| Raise deferred | Raise control hidden or disabled with “Coming soon” / omitted entirely per WU plan |
| RTL/long copy | Labels wrap; switches remain clickable; no horizontal clip in Settings content |

## Accessibility

- Every switch has a label and description.
- Selects keyboard-operable (Radix Select / UI Kit).
- Tabs are arrow-key navigable.
- Color is not the only enabled/disabled cue.
- Icon-only controls (if any) use `IconControlButton` + tooltip.

## i18n

- All new copy in `ru`, `en`, `fr`, `de`, `bg`.
- Namespaces:
  - `settings.notifications.*` (extend)
  - `settings.notifications.preferences.*`
  - `settings.notifications.appearance.*` (may alias general keys during move)
  - `settings.notifications.module.sdk|updates|externalServices`
- Domain emits no localized sentences.
- Run `npm run i18n:check` in UI WUs.
- Update `docs/softphone/I18N-Coverage.md`.

## Storybook / catalog

- Add or update stories for Notification Center panels (light + dark).
- Update `docs/softphone/UI-Component-Catalog.md` and run `npm run ui:catalog:check` when components register.

## Explicit UI non-goals

- In-call floating notification inbox.
- Drag-and-drop module priority.
- Per-toast “mute this message” chips.
- Editing journal entries.
- Preview live Sonner spam button in production builds (Storybook-only demos allowed).
