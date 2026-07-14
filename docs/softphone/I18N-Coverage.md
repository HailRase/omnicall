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
| `src/renderer/shells/SoftphoneReadyShell.tsx`, `src/renderer/components/notifications/*`, `src/renderer/hooks/useActionNotifications.ts` | unified notification copy, aria labels, action labels | `notifications.*`, `legacy operator.toast.*`, `updates.*`, `account.*`, `call.*`, `settings.*` | migrated | notification/component tests + `i18n:check` |
| `src/renderer/hooks/useSipSystemStateActions.ts` | action feedback via semantic keys | `settings.systemState.action.*` | migrated | settings panel tests |

| `src/renderer/components/integration/ocp/OcpCampaignEventModal.tsx`, `useOcpCampaignModal.ts` | i18n-driven OCP campaign accept/reject dialog | `ocp.campaign.modal.*` | migrated | `OcpCampaignEventModal.test.tsx`, `useOcpCampaignModal.test.ts`, `i18n:check` |
| E-10 dialpad / reject-with-break | i18n-driven dialpad block + reject choice/modal | `ocp.dialpad.reservedToCall`, `ocp.incomingCall.rejectWithoutBreak`, `ocp.incomingCall.rejectWithBreakReason`, `ocp.incomingCall.breakModal.*` | migrated | `useDialpadShell.ocpBlock.test.ts`, `IncomingCallSessionCard.test.tsx`, `OcpRejectBreakReasonModal.test.tsx`, `useOcpRejectWithBreak.test.ts`, `i18n:check` |
| `src/renderer/components/integration/ocp/OcpLogoutReasonModal.tsx`, `useOcpLogoutModal.ts` | i18n-driven OCP logout reason overlay | `ocp.logout.modal.*` | migrated | `OcpLogoutReasonModal.test.tsx`, `useOcpLogoutModal.test.ts`, `i18n:check` |
| `src/renderer/widgets/OperatorStatusSelector/*`, `OcpStatusDropdown`, `OcpConnectionBanner`, `OcpProxyStatusScreen` | i18n-driven operator status chrome | `ocp.status.*`, `ocp.dropdown.*`, `ocp.connection.*`, `ocp.proxyStatus.*`, `ocp.operatorStatus.*` | migrated | `OcpStatusChrome.test.tsx`, `useOperatorStatusSelector.test.ts`, `i18n:check` |
| F-028 E-13 i18n gate | Full OCP + Integrations key parity across locales | `ocp.*`, `settings.integrations.*` | migrated | `messages.test.ts` key parity, `npm run i18n:check`, `OcpFullFlow.integration.test.ts` |
| `src/renderer/components/settings/panels/SettingsCodecsPanel.tsx` | i18n-driven codec order/enablement UI | `settings.codecs.*` | migrated | `SettingsCodecsPanel.test.tsx` |
| `src/renderer/components/account/AccountPanel.tsx`, `SavedAccountProfileSelector.tsx`, `DeleteSavedAccountProfileConfirmationModal.tsx`, `SwitchSavedAccountProfileConfirmationModal.tsx` | i18n-driven saved profile tabs, delete/switch modals, disabled reasons (action feedback moved to notifications) | `account.profile.*`, `account.error.*`, `account.warning.*`, `account.actions.disabled.*` | migrated | `AccountPanel.test.tsx`, `SavedAccountProfileSelector.test.tsx`, modal tests, `useAccountActions.test.ts` |
| `src/renderer/components/settings/panels/SettingsAccountPanel.tsx` | account settings panel copy | `account.*`, `settings.account.*` | migrated | `SettingsAccountPanel.test.tsx` |
| `src/application/projections/settings/mapAccountAuthorizationError.ts` | semantic auth error keys for UI | `account.error.*` | migrated | `mapAccountAuthorizationError.test.ts` |
| `src/renderer/components/history/*`, `src/renderer/components/contacts/*`, `src/renderer/hooks/useContactEditShell.ts`, `src/renderer/hooks/useContactActions.ts`, `src/renderer/hooks/useDialogReturnFocus.ts`, `src/renderer/hooks/useRestoreRouteFocus.ts` | i18n-driven history details, add/open contact action, contact form validation, CSV import/export summary, dialog/route focus restore | `history.*`, `contacts.*` | migrated | `HistoryDetailPanel.test.tsx`, `ContactsImportSummaryPanel.test.tsx`, `useContactEditShell.test.tsx`, `useDialogReturnFocus.test.ts`, Storybook light/dark stories, `npm run i18n:check` |

## Remaining gaps

- Legacy `recovery.*` catalog keys retained for legacy operator platform-deferred paths; SIP recovery UI uses `settings.systemState.*` and `header.sipStatus.*`.
- Story/test fixtures may contain localized literals for assertions — allowed per ADR-0006.

## Verification commands

- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run i18n:check` (full-repo scan of renderer + UI-facing projections)
- `npm run ui:catalog`
