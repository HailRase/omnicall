# F-034 Testing Strategy

- Purpose: prove preference policy, migration safety, tagging completeness, UI, and non-regression of toast/journal/raise.
- Inputs: pure Domain functions, capture tests, renderer hooks/components, settings migration fixtures.
- Outputs: focused evidence per WU and full preflight evidence before feature closure.

## Domain unit tests

- Preferences parser: defaults, full map, missing module keys filled, unknown keys handled per locked strategy.
- Level rank / minLevel matrix for every level pair.
- Presentation policy matrix covering master, module enabled, minLevel, interruptClass, raiseWindow.
- Critical interrupt never becomes a normal toast present decision.
- Remote interrupt never raises.
- `UserSettings` migration N→N+1 preserves appearance + master popup + enables all modules.
- Future schema fail-closed.
- Expanded `USER_NOTIFICATION_MODULES` accepted by journal persistence parsers.

## Application unit tests

- `UserNotificationCaptureService`: journal always; `suppressedAtEmission` mirrors popup decision; raise flags per policy.
- Facade capture uses preferences from settings snapshot (not caller boolean authority).
- Record/Query journal regression: filters by new modules.
- F-030 document round trip includes notification preferences; journal excluded.
- Logging assertions: required fields present; secrets absent.

## Renderer / hook tests

- `useNotifications`: respects `shouldPresentPopup`; does not enqueue when false; fail-open on capture throw remains tested.
- `useActionNotifications`: descriptors include module/functionId/interruptClass.
- OCP mapper: `module: ocp`, `functionId: ocp.notification`, `interruptClass: remote`.
- Contacts/history/video producers tagged.
- SoftphoneReadyShell OCP auth feedback tagged.
- Settings Notification Center: master toggle, module toggle, minLevel select, appearance controls, history still loads.
- General panel no longer double-owns appearance editors.
- Viewport geometry tests remain green (`resolveNotificationToasterOffset`, `NotificationViewport.test.tsx`).

## Integration / composition

- Save preferences → notify → suppressed module produces journal entry with `suppressedAtEmission: true` and no toast item.
- Default preferences → existing staged SIP success keys still present.
- ADR-0013 incoming/campaign raise hooks still call raise with defaults.
- Profile switch changes effective module suppressions without restart.
- SIP-only bootstrap unaffected when prefs are defaults.

## i18n / catalog / registry

- `npm run i18n:check`
- `npm run ui:catalog:check` when UI catalog touched
- `npm run registry:check` when Feature Registry touched

## Commands

Per WU: focused Vitest paths first, then:

```txt
npm run typecheck
npm run lint
```

Closure WU:

```txt
npm run test
npm run lint
npm run typecheck
npm run i18n:check
npm run registry:check
npm run ui:catalog:check
```

(Adjust to repository `/preflight` command if it already aggregates these.)

## Manual smoke (closure)

- Toggle master off → perform account action → no toast, history shows suppressed.
- Disable OCP module → trigger OCP notification → suppressed; SIP toast still shows.
- Set telephony minLevel=error → warning SIP toast suppressed; error shown.
- Appearance placement change still moves toaster.
- Incoming call while prefs customized still raises + shows incoming UI.
- Compact shell + Settings resize: toasts remain inside window.
