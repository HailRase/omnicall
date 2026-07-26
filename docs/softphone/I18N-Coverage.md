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
| F-028 call context (2026-07-26) | Queue/campaign badges + preview modal copy | `call.context.*`, `icons.call.queue`, `ocp.campaign.modal.*` (title/phone refresh) | migrated | locale catalogs ru/en/fr/de/bg; `messages.test.ts`; `CallContextBadges` / modal tests |
| E-10 dialpad / reject-with-break | i18n-driven dialpad block + reject choice/modal | `ocp.dialpad.reservedToCall`, `ocp.incomingCall.rejectWithoutBreak`, `ocp.incomingCall.rejectWithBreakReason`, `ocp.incomingCall.breakModal.*` | migrated | `useDialpadShell.ocpBlock.test.ts`, `IncomingCallSessionCard.test.tsx`, `OcpRejectBreakReasonModal.test.tsx`, `useOcpRejectWithBreak.test.ts`, `i18n:check` |
| `src/renderer/components/integration/ocp/OcpLogoutReasonModal.tsx`, `useOcpLogoutModal.ts` | i18n-driven OCP logout reason overlay | `ocp.logout.modal.*` | migrated | `OcpLogoutReasonModal.test.tsx`, `useOcpLogoutModal.test.ts`, `i18n:check` |
| `src/renderer/widgets/OperatorStatusSelector/*`, `OcpStatusDropdown`, `OcpConnectionBanner`, `OcpProxyStatusScreen` | i18n-driven operator status chrome | `ocp.status.*`, `ocp.dropdown.*`, `ocp.connection.*`, `ocp.proxyStatus.*`, `ocp.operatorStatus.*` | migrated | `OcpStatusChrome.test.tsx`, `useOperatorStatusSelector.test.ts`, `i18n:check` |
| F-028 E-13 i18n gate | Full OCP + Integrations key parity across locales | `ocp.*`, `settings.integrations.*` | migrated | `messages.test.ts` key parity, `npm run i18n:check`, `OcpFullFlow.integration.test.ts` |
| F-028 unified auth UX (2026-07-16) | Auth progress + two sign-in methods + progressive OCP setup | `account.authProgress.*`, `account.profile.signInViaOcp*`, `account.profile.useSipPassword*`, `ocp.authFeedback.sip*`, `settings.integrations.ocp.connectAndSignIn`, `settings.integrations.ocp.setup.*`, `settings.integrations.ocp.disconnect.warn`, `settings.integrations.ocp.autoConnect.scopeHint` | migrated | locale catalogs ru/en/fr/de/bg, Integrations/Account component tests |
| F-028 Auth Flow WU-03 (2026-07-16) | Account sign-in / recovery semantic keys for WU-04 UI | `account.signIn.disabled.logoutFirst`, `account.mode.sipOnly`, `account.mode.ocpModule`, `account.recovery.retryServer`, `account.recovery.retryAuthorization`, `account.recovery.reconnect` | migrated | locale catalogs ru/en/fr/de/bg; UI wiring in WU-04 |
| F-028 Auth Flow WU-04 (2026-07-16) | Account mode tabs + dual Server/Auth status labels | `account.mode.tabsAria`, `account.server.label`, `account.server.status.*`, `account.authorization.label`, `account.authorization.status.*` | migrated | `AccountPanel.test.tsx`, `SettingsAccountPanel.test.tsx`, `i18n:check` |
| F-028 Auth Flow WU-05 (2026-07-16) | Settings pre-auth nav gate + OCP Module edit-only copy | `settings.nav.disabled.authorizeFirst`, `settings.integrations.ocp.editOnly.description`, `settings.integrations.ocp.activeProfile`, `settings.integrations.ocp.openAccountForRecovery` | migrated | `SettingsSidebar.test.tsx`, `OcpModuleSettingsCard.test.tsx`, locale catalogs ru/en/fr/de/bg |
| F-011 DI-09 SDK Server Settings (2026-07-20) | Integrations SDK Server card: enablement, origins, paired/revoke, grant, diagnostics, hide disabled | `settings.integrations.sdk.*` | migrated | `SdkModuleSettingsCard.test.tsx`, locale catalogs ru/en/fr/de/bg, `i18n:check` |
| F-011 SDK Settings UX polish (2026-07-21) | Human SDK Settings copy + IA (status first, collapsed permissions, confirmations); shared Settings content measure | `settings.integrations.sdk.*` (matrix/grant/origins/status/hide) | migrated | `SdkModuleSettingsCard.test.tsx`, Storybook Light/Dark, locale catalogs ru/en/fr/de/bg, `i18n:check` |
| F-011 SDK Settings three sections (2026-07-21) | Main / Trusted / Blocked IA; Accordion sites; permission Select allowed/denied labels | `settings.integrations.sdk.section.*`, `permission.*`, `origins.addressLabel|editStart|unsavedHint` | migrated | `SdkModuleSettingsCard.test.tsx`, Accordion UI Kit, `i18n:check` |
| F-011 SDK operator modal TTLs Settings (2026-07-23) | Main tab selects for consent / Origin TOFU / pairing wait times | `settings.integrations.sdk.timeouts.*` | migrated | `SdkModuleSettingsTimeoutsSection.tsx`, locale catalogs ru/en/fr/de/bg, `i18n:check` |
| F-030 Operator preferences export/import (2026-07-24) | Settings → General transfer section | `settings.general.preferences.transfer.*` | migrated | `SettingsPreferencesTransferSection.test.tsx`, locale catalogs ru/en/fr/de/bg, `i18n:check` |
| F-016 / LF-002 Bootstrap splash (2026-07-25) | Single-stage `#boot-splash` + error shell; loading copy synced via `setBootSplashMessage` | `bootstrap.brand`, `bootstrap.loading`, `bootstrap.error.initializationFailed` | migrated | `useBootSplashController.test.ts`, `BootstrapSplashShell.test.tsx`, `Bootstrap-Splash-Contract.md`, locale catalogs ru/en/fr/de/bg, `i18n:check` |
| F-024/F-028 Account correction (2026-07-17) | Overwrite decision, SIP/OCP success distinction, System State recovery CTA | `account.profile.overwrite.continueWithoutSaving`, `account.success.sipRegistrationSucceeded`, `account.success.ocpAndSipReady`, `account.notification.openSystemState*` | migrated | locale catalogs ru/en/fr/de/bg; Account and notification tests |
| F-024 overwrite modal explicit actions (2026-07-17) | Two visible choices: sign in without saving / overwrite and sign in | `account.profile.overwrite.continueWithoutSaving`, `account.profile.overwrite.confirm` | migrated | locale catalogs ru/en/fr/de/bg; modal component tests |
| F-028/F-029 Auth Flow Hardening (2026-07-17) | Five OCP stages, timeout/restart, persistent errors, dirty draft and notification history | `account.authProgress.stage.*`, `account.authProgress.status.*`, `account.draft.discard.*`, `settings.notifications.*` | migrated | locale parity ru/en/fr/de/bg; progress/journal/Account tests |
| F-001/F-029 SIP-only staged auth toasts (2026-07-17) | Split transport/registration success; System State CTA on SIP errors | `account.success.sipTransportConnected`, `account.success.sipRegistrationSucceeded`, `account.error.sipRegistrationFailed`, `account.notification.openSystemStateAction` | migrated | locale parity ru/en/fr/de/bg; notification + Account action tests |
| F-029 notification table UI (2026-07-17) | Settings notification journal column/level labels | `settings.notifications.column.*`, `settings.notifications.level.*`, `settings.notifications.table.caption`, `settings.notifications.popupShown` | migrated | `SettingsNotificationHistoryPanel.test.tsx`; locale parity ru/en/fr/de/bg |
| F-029 notification pagination UI (2026-07-17) | Page and pageSize selectors | `settings.notifications.pageSelect`, `settings.notifications.pageSize` | migrated | `SettingsNotificationHistoryPanel.test.tsx`; locale parity ru/en/fr/de/bg |
| F-029 notification journal UX polish (2026-07-17) | Empty hint, result count, nav icon label | `settings.notifications.emptyHint`, `settings.notifications.results`, `icons.settings.notifications` | migrated | locale parity ru/en/fr/de/bg; panel + sidebar tests |
| F-028 ADR-AF-005 (2026-07-16) | System State OCP tab semantic keys | `settings.systemState.tab.*`, `settings.systemState.tabsAria`, `settings.systemState.ocp.*` | migrated | `deriveOcpSystemStateShell.test.ts`, locale catalogs ru/en/fr/de/bg |
| F-028 T-034 UI (2026-07-16) | System State OCP metric/live summary + wired tabs | `settings.systemState.ocp.metric.authorization`, `settings.systemState.ocp.metric.authorizationAria`, `settings.systemState.ocp.liveSummary` | migrated | `SettingsSystemStatePanel.test.tsx`, `i18n:check` |
| `src/renderer/components/settings/panels/SettingsCodecsPanel.tsx` | i18n-driven codec order/enablement UI | `settings.codecs.*` | migrated | `SettingsCodecsPanel.test.tsx` |
| `src/renderer/components/account/AccountPanel.tsx`, `SavedAccountProfileSelector.tsx`, `DeleteSavedAccountProfileConfirmationModal.tsx` | i18n-driven saved profile tabs, delete modal, mode tabs, dual-status recovery (switch modal removed) | `account.profile.*`, `account.error.*`, `account.warning.*`, `account.actions.disabled.*`, `account.mode.*`, `account.server.*`, `account.authorization.*`, `account.recovery.*` | migrated | `AccountPanel.test.tsx`, `SavedAccountProfileSelector.test.tsx`, modal tests, `useAccountActions.test.ts` |
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
