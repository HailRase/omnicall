# I18N Coverage Matrix

## Coverage baseline

- Scope audited: all non-test/non-story UI-facing modules in `src/renderer/components/**`, `src/renderer/helpers/**`, `src/renderer/shells/**`, `src/renderer/hooks/**`, and `src/application/projections/**`.
- Supported locales: `ru`, `en`, `fr`, `de`, `bg`.
- Result: user-visible copy migrated to catalog/runtime; projection layer emits semantic keys.

| Module / Area | Copy contract | Namespace(s) | Migration status | Verification |
| --- | --- | --- | --- | --- |
| `src/renderer/i18n/messages.ts`, `src/renderer/i18n/runtime.ts`, `src/renderer/i18n/catalogs/bgMessages.ts` | Typed catalog + runtime translation | all product namespaces | migrated | `messages.test.ts`, `npm run i18n:check` |
| `src/domain/settings/*` | Language value object + schema validation | n/a (domain value) | migrated | `SupportedLanguage.test.ts`, settings validation tests |
| `src/application/projections/*` (UI-facing) | Semantic reason/label keys + params | `settings.systemState.*`, `connection.recovery.disabled.*`, `call.line.status.*`, … | migrated | projection unit tests |
| `src/renderer/components/settings/panels/SettingsSystemStatePanel.tsx` | i18n-driven system state UI | `settings.systemState.*` | migrated | `SettingsSystemStatePanel.test.tsx` |
| `src/renderer/components/dialpad/Dialpad.tsx` | i18n-driven dialpad copy | `dialpad.panel.*`, `dialpad.input.*`, `dialpad.call.*`, `dialpad.keys.*` | migrated | `Dialpad.test.tsx` |
| `src/renderer/shells/SoftphoneReadyShell.tsx`, `src/renderer/components/notifications/*`, `src/renderer/hooks/useActionNotifications.ts` | unified notification copy, aria labels, action labels | `notifications.*`, `ocp.toast.*`, `updates.*`, `account.*`, `call.*`, `settings.*` | migrated | notification/component tests + `i18n:check` |
| `src/renderer/hooks/useSipSystemStateActions.ts` | action feedback via semantic keys | `settings.systemState.action.*` | migrated | settings panel tests |

| `src/renderer/components/settings/panels/SettingsCodecsPanel.tsx` | i18n-driven codec order/enablement UI | `settings.codecs.*` | migrated | `SettingsCodecsPanel.test.tsx` |
| `src/renderer/components/account/AccountPanel.tsx`, `SavedAccountProfileSelector.tsx`, `DeleteSavedAccountProfileConfirmationModal.tsx`, `SwitchSavedAccountProfileConfirmationModal.tsx` | i18n-driven saved profile tabs, delete/switch modals, disabled reasons (action feedback moved to notifications) | `account.profile.*`, `account.error.*`, `account.warning.*`, `account.actions.disabled.*` | migrated | `AccountPanel.test.tsx`, `SavedAccountProfileSelector.test.tsx`, modal tests, `useAccountActions.test.ts` |
| `src/renderer/components/settings/panels/SettingsAccountPanel.tsx` | account settings panel copy | `account.*`, `settings.account.*` | migrated | `SettingsAccountPanel.test.tsx` |
| `src/application/projections/mapAccountAuthorizationError.ts` | semantic auth error keys for UI | `account.error.*` | migrated | `mapAccountAuthorizationError.test.ts` |

## Remaining gaps

- Legacy `recovery.*` catalog keys retained for OCP-deferred paths; SIP recovery UI uses `settings.systemState.*` and `header.sipStatus.*`.
- Story/test fixtures may contain localized literals for assertions — allowed per ADR-0006.

## Verification commands

- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run i18n:check` (full-repo scan of renderer + UI-facing projections)
- `npm run ui:catalog`
