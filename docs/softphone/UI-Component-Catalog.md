# UI Component Catalog

> **Auto-generated.** Do not edit by hand. Run: `npm run ui:catalog`

## Index

| Component | Path | Exported props | Test IDs | @uiMeta |
| --- | --- | --- | --- | --- |
| `App` | `src/renderer/App.tsx` | `—` | softphone-shell, shutdown-progress, shutdown-error | — |
| `AccountPanel` | `src/renderer/components/account/AccountPanel.tsx` | `—` | account-panel, account-mode-tabs, account-mode-sip, account-mode-ocp, account-error, account-error-open-system-state, account-username, account-forget-saved-password, account-domain, account-server, account-password-hint, account-ocp-login, account-ocp-domain, account-save-profile-row, account-save-profile-checkbox, account-remember-password-row, account-remember-password-checkbox, account-recovery-actions, account-authorize | — |
| `AccountPasswordField` | `src/renderer/components/account/AccountPasswordField.tsx` | `—` | — | — |
| `DeleteSavedAccountProfileConfirmationModal` | `src/renderer/components/account/DeleteSavedAccountProfileConfirmationModal.tsx` | `DeleteSavedAccountProfileConfirmationModalProps` | delete-saved-account-profile-modal, delete-saved-account-profile-cancel, delete-saved-account-profile-confirm | — |
| `DiscardAccountDraftConfirmationModal` | `src/renderer/components/account/DiscardAccountDraftConfirmationModal.tsx` | `—` | discard-account-draft-modal, discard-account-draft-confirm | — |
| `OcpSignInProgress` | `src/renderer/components/account/OcpSignInProgress.tsx` | `—` | account-ocp-progress-reconnect, account-ocp-progress-modal, account-ocp-progress-live-status, account-ocp-progress-disconnect | — |
| `OcpSignInProgressStatusIcon` | `src/renderer/components/account/OcpSignInProgressStatusIcon.tsx` | `OcpSignInProgressStatusIconProps` | account-ocp-progress-failure-icon | — |
| `OverwriteSavedAccountCredentialsConfirmationModal` | `src/renderer/components/account/OverwriteSavedAccountCredentialsConfirmationModal.tsx` | `OverwriteSavedAccountCredentialsConfirmationModalProps` | overwrite-saved-account-credentials-modal, overwrite-saved-account-credentials-cancel, overwrite-saved-account-credentials-continue, overwrite-saved-account-credentials-more, overwrite-saved-account-credentials-confirm | f=F-024 |
| `SavedAccountProfileSelector` | `src/renderer/components/account/SavedAccountProfileSelector.tsx` | `SavedAccountProfileSelectorProps` | saved-account-profile-selector, saved-account-profile-tablist, saved-account-profile-tab-new-group, saved-account-profile-tab-new, saved-account-profile-tab-group, saved-account-profile-tab | — |
| `ActiveCallControlsPanel` | `src/renderer/components/call/ActiveCallControlsPanel.tsx` | `ActiveCallControlsPanelProps` | active-call-controls, active-call-mute-indicator, control-disabled-reason | — |
| `CallContextBadges` | `src/renderer/components/call/CallContextBadges.tsx` | `CallContextBadgesProps` | call-context-badges, queue-info-label, queue-info-label, incoming-campaign-context, incoming-campaign-context, incoming-campaign-context | f=F-028 lf=LF-037,LF-038 |
| `CallControlsBar` | `src/renderer/components/call/CallControlsBar.tsx` | `CallControlsBarProps` | call-controls-bar, control-view-mode-fullscreen, control-view-mode-expanded, control-view-mode-hidden | lf=LF-022,LF-023 f=F-004,F-016 smoke=R7- |
| `CallIdleEmptyState` | `src/renderer/components/call/CallIdleEmptyState.tsx` | `—` | call-idle-empty-state | lf=LF-020 f=F-003,F-016 |
| `CallLineRow` | `src/renderer/components/call/CallLineRow.tsx` | `CallLineRowProps` | — | lf=LF-011,LF-021,LF-022,LF-023 f=F-016 smoke=R7- |
| `CallLinesShell` | `src/renderer/components/call/CallLinesShell.tsx` | `CallLinesShellProps` | call-lines-panel | — |
| `CallSessionCard` | `src/renderer/components/call/CallSessionCard.tsx` | `CallSessionCardProps` | — | lf=LF-011,LF-021 f=F-016 smoke=R7- |
| `CallSessionStack` | `src/renderer/components/call/CallSessionStack.tsx` | `CallSessionStackProps` | call-session-stack, multi-call-policy-error | lf=LF-021 f=F-016 smoke=R7- |
| `CallVideoSurface` | `src/renderer/components/call/CallVideoSurface.tsx` | `CallVideoSurfaceProps` | — | — |
| `DtmfKeypadPanel` | `src/renderer/components/call/DtmfKeypadPanel.tsx` | `DtmfKeypadPanelProps` | dtmf-keypad-panel | lf=LF-024 f=F-008,F-016 |
| `IncomingCallOverlay` | `src/renderer/components/call/IncomingCallOverlay.tsx` | `IncomingCallOverlayProps` | incoming-call-overlay-anchor, incoming-call-overlay, incoming-call-overlay-dismiss, incoming-call-overlay-body, caller-identity, auto-answer-countdown, answer-call, answer-call-video | lf=LF-013,LF-014 f=F-002 smoke=R3-2 |
| `IncomingCallRejectControl` | `src/renderer/components/call/IncomingCallRejectControl.tsx` | `IncomingCallRejectControlProps` | reject-call, reject-call, reject-call-without-break, reject-call-with-break | f=F-028 |
| `IncomingCallSessionCard` | `src/renderer/components/call/IncomingCallSessionCard.tsx` | `IncomingCallSessionCardProps` | incoming-call-session-select, caller-identity, incoming-call-status-label, auto-answer-countdown, answer-call, answer-call-video, incoming-answer-disabled-reason | lf=LF-013,LF-014 f=F-002,F-027,F-028 smoke=R3-2 |
| `IncomingCallStatusMessage` | `src/renderer/components/call/IncomingCallStatusMessage.tsx` | `IncomingCallStatusMessageProps` | incoming-call-status | — |
| `MultiCallHoldAllIndicator` | `src/renderer/components/call/MultiCallHoldAllIndicator.tsx` | `MultiCallHoldAllIndicatorProps` | multi-call-hold-all-indicator | — |
| `MultiLineCallList` | `src/renderer/components/call/MultiLineCallList.tsx` | `MultiLineCallListProps` | multi-line-call-list | — |
| `OutgoingCallCard` | `src/renderer/components/call/OutgoingCallCard.tsx` | `OutgoingCallCardProps` | outgoing-call-card, call-state-label | — |
| `RejectReasonSelector` | `src/renderer/components/call/RejectReasonSelector.tsx` | `RejectReasonSelectorProps` | reject-reason-select | — |
| `ScreenSharePickerDialog` | `src/renderer/components/call/ScreenSharePickerDialog.tsx` | `ScreenSharePickerDialogProps` | screen-share-picker-dialog, screen-share-picker-tab-screen, screen-share-picker-tab-window, screen-share-picker-tab-chrome-tab, screen-share-picker-grid, screen-share-picker-error, screen-share-picker-cancel, screen-share-picker-confirm | — |
| `TransferPanel` | `src/renderer/components/call/TransferPanel.tsx` | `TransferPanelProps` | transfer-panel, transfer-source-line, transfer-target-input, transfer-target-divider, transfer-target-candidates, transfer-next-step, transfer-consultation-line, transfer-in-progress-indicator, control-attended-transfer, transfer-disabled-reason | — |
| `TransferSuccessOverlay` | `src/renderer/components/call/TransferSuccessOverlay.tsx` | `TransferSuccessOverlayProps` | transfer-success-overlay | lf=LF-028,LF-029 f=F-006,F-007 smoke=transfer-success |
| `TruncatedTextLine` | `src/renderer/components/call/TruncatedTextLine.tsx` | `TruncatedTextLineProps` | — | — |
| `VideoFullscreenControlsBar` | `src/renderer/components/call/VideoFullscreenControlsBar.tsx` | `VideoFullscreenControlsBarProps` | video-fullscreen-controls-bar | — |
| `VideoFullscreenModal` | `src/renderer/components/call/VideoFullscreenModal.tsx` | `VideoFullscreenModalProps` | video-fullscreen-modal | — |
| `ContactDeleteConfirmationModal` | `src/renderer/components/contacts/ContactDeleteConfirmationModal.tsx` | `ContactDeleteConfirmationModalProps` | contacts-delete-modal, contacts-delete-cancel, contacts-delete-confirm | — |
| `ContactEditPanel` | `src/renderer/components/contacts/ContactEditPanel.tsx` | `ContactEditPanelProps` | contacts-edit-loading, contacts-edit-not-found, contacts-edit-form, contacts-field-display-name, contacts-field-primary-phone, contacts-field-secondary-phone, contacts-field-company, contacts-field-notes, contacts-save | — |
| `ContactsImportSummaryPanel` | `src/renderer/components/contacts/ContactsImportSummaryPanel.tsx` | `ContactsImportSummaryPanelProps` | contacts-import-summary-panel, contacts-import-summary-created, contacts-import-summary-skipped, contacts-import-summary-failed, contacts-import-summary-failed-rows, contacts-import-summary-close | — |
| `ContactsPanelShell` | `src/renderer/components/contacts/ContactsPanelShell.tsx` | `ContactsPanelShellProps` | contacts-list-loading, contacts-list-error, contacts-list-empty, contacts-search-input, contacts-list-search-empty, contacts-list, contacts-details-loading, contacts-details-not-found, contacts-details, contacts-call, contacts-edit, contacts-delete, contacts-csv-menu, contacts-csv-import, contacts-csv-export | f=F-025 smoke=contacts-panel |
| `Dialpad` | `src/renderer/components/dialpad/Dialpad.tsx` | `DialpadProps` | dialpad-panel, dialpad-input, dialpad-key-0, dialpad-call, dialpad-video-call | lf=LF-020 f=F-003,F-013,F-016,F-021 smoke=R7- |
| `RegistrationStatusDot` | `src/renderer/components/header/RegistrationStatusDot.tsx` | `RegistrationStatusDotProps` | registration-status-dot | lf=LF-011 f=F-016 smoke=R7- |
| `UserAvatarMenu` | `src/renderer/components/header/UserAvatarMenu.tsx` | `UserAvatarMenuProps` | user-avatar-menu, user-menu-identity, user-menu-open-contacts, user-menu-open-history, user-menu-open-settings, user-menu-toggle-dnd, user-menu-logout | lf=LF-086 f=F-016 smoke=R7- |
| `UserHeaderIdentity` | `src/renderer/components/header/UserHeaderIdentity.tsx` | `UserHeaderIdentityProps` | user-header-identity, user-sip-status, user-sip-status-timer | lf=LF-086 f=F-016 smoke=R7- |
| `HistoryDeleteConfirmationModal` | `src/renderer/components/history/HistoryDeleteConfirmationModal.tsx` | `HistoryDeleteConfirmationModalProps` | history-delete-modal, history-delete-cancel, history-delete-confirm | — |
| `HistoryDetailPanel` | `src/renderer/components/history/HistoryDetailPanel.tsx` | `HistoryDetailPanelProps` | history-detail-loading, history-detail-not-found, history-detail-panel, history-detail-redial, history-detail-contact-action, history-detail-delete | f=F-013 lf=LF-052,LF-053 smoke=history-detail-panel |
| `HistoryPanelShell` | `src/renderer/components/history/HistoryPanelShell.tsx` | `HistoryPanelShellProps` | history-filter-all, history-filter-missed, history-panel-loading, history-panel-error, history-panel-filter-empty, history-panel-list, history-panel-empty | f=F-013 lf=LF-052,LF-053 smoke=history-panel |
| `AppIcon` | `src/renderer/components/icons/AppIcon.tsx` | `AppIconProps` | — | — |
| `IconControlButton` | `src/renderer/components/icons/IconControlButton.tsx` | `IconControlButtonProps` | — | — |
| `IconTooltip` | `src/renderer/components/icons/IconTooltip.tsx` | `IconTooltipProps` | icon-tooltip-bubble, icon-tooltip-host | — |
| `SdkActivateProfileConsentModal` | `src/renderer/components/integration/SdkActivateProfileConsentModal.tsx` | `SdkActivateProfileConsentModalProps` | sdk-activate-consent-modal, sdk-activate-consent-modes, sdk-activate-consent-dismiss, sdk-activate-consent-cancel, sdk-activate-consent-more, sdk-activate-consent-deny, sdk-activate-consent-allow | — |
| `SdkConnectCeremonyModal` | `src/renderer/components/integration/SdkConnectCeremonyModal.tsx` | `SdkConnectCeremonyModalProps` | sdk-connect-ceremony-modal, sdk-connect-ceremony-waiting, sdk-connect-ceremony-pairing-meta, sdk-connect-ceremony-deny-transport, sdk-connect-ceremony-allow-transport, sdk-connect-ceremony-cancel-waiting, sdk-connect-ceremony-deny-pairing | — |
| `SdkModalDeadlineTimer` | `src/renderer/components/integration/SdkModalDeadlineTimer.tsx` | `SdkModalDeadlineTimerProps` | — | — |
| `OcpCampaignEventModal` | `src/renderer/components/integration/ocp/OcpCampaignEventModal.tsx` | `OcpCampaignEventModalProps` | ocp-campaign-modal, ocp-campaign-details, ocp-campaign-phone, ocp-campaign-meta, ocp-campaign-strategy, ocp-campaign-reject, ocp-campaign-accept | f=F-028 lf=LF-039,LF-040 |
| `OcpConnectionBanner` | `src/renderer/components/integration/ocp/OcpConnectionBanner.tsx` | `OcpConnectionBannerProps` | ocp-connection-banner-anchor, ocp-connection-banner, ocp-connection-banner-message, ocp-retry-connect | — |
| `OcpLogoutReasonModal` | `src/renderer/components/integration/ocp/OcpLogoutReasonModal.tsx` | `OcpLogoutReasonModalProps` | ocp-logout-cancel-action, ocp-logout-confirm, ocp-logout-reasons-empty | f=F-028 lf=LF-048 |
| `OcpProxyStatusScreen` | `src/renderer/components/integration/ocp/OcpProxyStatusScreen.tsx` | `OcpProxyStatusScreenProps` | ocp-proxy-status-screen, ocp-proxy-open-integrations | — |
| `OcpRejectBreakReasonModal` | `src/renderer/components/integration/ocp/OcpRejectBreakReasonModal.tsx` | `OcpRejectBreakReasonModalProps` | ocp-reject-break-modal, ocp-reject-break-empty, ocp-reject-break-cancel, ocp-reject-break-confirm | f=F-028 |
| `OcpStatusDropdown` | `src/renderer/components/integration/ocp/OcpStatusDropdown.tsx` | `OcpStatusDropdownProps` | ocp-status-dropdown, ocp-status-dropdown-ready, ocp-status-dropdown-breaks, ocp-post-call-finish-footer, ocp-post-call-finish-appeal | — |
| `OcpStatusTimer` | `src/renderer/components/integration/ocp/OcpStatusTimer.tsx` | `OcpStatusTimerProps` | ocp-status-timer | — |
| `ListQuickCallButton` | `src/renderer/components/list/ListQuickCallButton.tsx` | `ListQuickCallButtonProps` | — | — |
| `ListQuickCallReveal` | `src/renderer/components/list/ListQuickCallReveal.tsx` | `ListQuickCallRevealProps` | — | — |
| `PersonListAvatar` | `src/renderer/components/list/PersonListAvatar.tsx` | `PersonListAvatarProps` | person-list-avatar, person-list-avatar-missed | — |
| `NotificationToastAction` | `src/renderer/components/notifications/NotificationToastAction.tsx` | `NotificationToastActionProps` | notification-toast-action | — |
| `NotificationViewport` | `src/renderer/components/notifications/NotificationViewport.tsx` | `NotificationViewportProps` | notification-viewport | — |
| `LogoutActiveSessionConfirmationModal` | `src/renderer/components/session/LogoutActiveSessionConfirmationModal.tsx` | `LogoutActiveSessionConfirmationModalProps` | logout-active-session-modal, logout-delayed-jobs-warning | — |
| `SettingsFullscreenOverlay` | `src/renderer/components/settings/SettingsFullscreenOverlay.tsx` | `SettingsFullscreenOverlayProps` | settings-overlay, settings-overlay-backdrop, settings-overlay-chrome-titlebar | f=F-016,F-017 smoke=settings-overlay |
| `SettingsNumberInput` | `src/renderer/components/settings/SettingsNumberInput.tsx` | `SettingsNumberInputProps` | — | — |
| `SettingsPanel` | `src/renderer/components/settings/SettingsPanel.tsx` | `SettingsPanelProps` | settings-overlay-body, settings-section-title, settings-overlay-close | lf=LF-032,LF-076,LF-008 f=F-016,F-014,F-017 smoke=R7-5 |
| `SettingsSidebar` | `src/renderer/components/settings/SettingsSidebar.tsx` | `SettingsSidebarProps` | settings-sidebar, icon-tooltip-host | — |
| `SettingsNavLeafItem` | `src/renderer/components/settings/SettingsSidebarNavItems.tsx` | `SettingsNavLeafItemProps` | — | — |
| `ExternalApplicationsConditionsSection` | `src/renderer/components/settings/external-applications/ExternalApplicationsConditionsSection.tsx` | `ExternalApplicationsConditionsSectionProps` | external-applications-conditions, external-applications-condition-queue-add | f=F-032 |
| `ExternalApplicationsEditor` | `src/renderer/components/settings/external-applications/ExternalApplicationsEditor.tsx` | `ExternalApplicationsEditorProps` | external-applications-editor, external-applications-save, external-applications-url, external-applications-open-now, external-applications-tab-general, external-applications-tab-events, external-applications-tab-conditions, external-applications-tab-variables | f=F-032 |
| `ExternalApplicationsGeneralTab` | `src/renderer/components/settings/external-applications/ExternalApplicationsGeneralTab.tsx` | `ExternalApplicationsGeneralTabProps` | — | f=F-032 |
| `ExternalApplicationsHistoryPanel` | `src/renderer/components/settings/external-applications/ExternalApplicationsHistoryPanel.tsx` | `ExternalApplicationsHistoryPanelProps` | external-applications-history, external-applications-history-empty | f=F-032 |
| `ExternalApplicationsInlineRename` | `src/renderer/components/settings/external-applications/ExternalApplicationsInlineRename.tsx` | `ExternalApplicationsInlineRenameProps` | — | f=F-032 |
| `ExternalApplicationsPanel` | `src/renderer/components/settings/external-applications/ExternalApplicationsPanel.tsx` | `ExternalApplicationsPanelProps` | external-applications-panel | f=F-032 |
| `ExternalApplicationsSidebar` | `src/renderer/components/settings/external-applications/ExternalApplicationsSidebar.tsx` | `ExternalApplicationsSidebarProps` | external-applications-sidebar, external-applications-history-nav, external-applications-add | f=F-032 |
| `ExternalApplicationsVariablesTab` | `src/renderer/components/settings/external-applications/ExternalApplicationsVariablesTab.tsx` | `ExternalApplicationsVariablesTabProps` | external-applications-variables, external-applications-variables-add | f=F-032 |
| `ExternalApplicationsWindowBehavior` | `src/renderer/components/settings/external-applications/ExternalApplicationsWindowBehavior.tsx` | `ExternalApplicationsWindowBehaviorProps` | external-applications-window-behavior | f=F-032 |
| `OnCallEndedChoiceCards` | `src/renderer/components/settings/external-applications/OnCallEndedChoiceCards.tsx` | `OnCallEndedChoiceCardsProps` | external-applications-on-call-ended | f=F-032 |
| `DesktopStage` | `src/renderer/components/settings/external-applications/OnCallEndedSchematicParts.tsx` | `—` | — | — |
| `LeaveOpenSchematic` | `src/renderer/components/settings/external-applications/OnCallEndedSchematics.tsx` | `—` | — | — |
| `OpenModeChoiceCards` | `src/renderer/components/settings/external-applications/OpenModeChoiceCards.tsx` | `OpenModeChoiceCardsProps` | external-applications-open-mode | f=F-032 |
| `ElectronWindowSchematic` | `src/renderer/components/settings/external-applications/OpenModeSchematics.tsx` | `—` | — | — |
| `buildOnCallEndedOptions` | `src/renderer/components/settings/external-applications/onCallEndedOptions.tsx` | `—` | — | — |
| `ExternalServicesBodyModeRadios` | `src/renderer/components/settings/external-services/ExternalServicesBodyModeRadios.tsx` | `ExternalServicesBodyModeRadiosProps` | external-services-body-mode | f=F-031 |
| `ExternalServicesCollectionVariableRow` | `src/renderer/components/settings/external-services/ExternalServicesCollectionVariableRow.tsx` | `ExternalServicesCollectionVariableRowProps` | — | f=F-031 |
| `ExternalServicesCollectionsDialogs` | `src/renderer/components/settings/external-services/ExternalServicesCollectionsDialogs.tsx` | `ExternalServicesCollectionsDialogsProps` | external-services-discard-changes | f=F-031 |
| `ExternalServicesInlineRename` | `src/renderer/components/settings/external-services/ExternalServicesInlineRename.tsx` | `ExternalServicesInlineRenameProps` | — | f=F-031 |
| `ExternalServicesJournal` | `src/renderer/components/settings/external-services/ExternalServicesJournal.tsx` | `ExternalServicesJournalProps` | external-services-journal-section, external-services-journal, external-services-journal-retry, external-services-journal-empty, external-services-journal | f=F-031 |
| `ExternalServicesJournalEntry` | `src/renderer/components/settings/external-services/ExternalServicesJournalEntry.tsx` | `ExternalServicesJournalEntryProps` | — | f=F-031 |
| `ExternalServicesJournalEntryDetail` | `src/renderer/components/settings/external-services/ExternalServicesJournalEntryDetail.tsx` | `ExternalServicesJournalEntryDetailProps` | — | f=F-031 |
| `ExternalServicesKeyValueTable` | `src/renderer/components/settings/external-services/ExternalServicesKeyValueTable.tsx` | `ExternalServicesKeyValueTableProps` | — | f=F-031 |
| `ExternalServicesPanel` | `src/renderer/components/settings/external-services/ExternalServicesPanel.tsx` | `ExternalServicesPanelProps` | external-services-workspace, external-services-workspace-banner, external-services-load-error, external-services-load-retry, external-services-workspace-body | f=F-031 |
| `ExternalServicesQueue` | `src/renderer/components/settings/external-services/ExternalServicesQueue.tsx` | `ExternalServicesQueueProps` | external-services-queue-empty, external-services-queue | f=F-031 |
| `ExternalServicesRequestEditor` | `src/renderer/components/settings/external-services/ExternalServicesRequestEditor.tsx` | `ExternalServicesRequestEditorProps` | external-services-request-editor, external-services-request-enabled, external-services-save, external-services-body-editor | f=F-031 |
| `ExternalServicesRequestUrlBar` | `src/renderer/components/settings/external-services/ExternalServicesRequestUrlBar.tsx` | `ExternalServicesRequestUrlBarProps` | external-services-request-method, external-services-request-url, external-services-run-now | f=F-031 |
| `ExternalServicesRequestsView` | `src/renderer/components/settings/external-services/ExternalServicesRequestsView.tsx` | `ExternalServicesRequestsViewProps` | external-services-requests, external-services-create-request, external-services-collection-variables | f=F-031 |
| `ExternalServicesResponsePane` | `src/renderer/components/settings/external-services/ExternalServicesResponsePane.tsx` | `ExternalServicesResponsePaneProps` | external-services-response-pane, external-services-response-resize, external-services-queue-tab, external-services-response-empty | f=F-031 |
| `ExternalServicesRunResult` | `src/renderer/components/settings/external-services/ExternalServicesRunResult.tsx` | `ExternalServicesRunResultProps` | external-services-run-progress, external-services-run-result | f=F-031 |
| `ExternalServicesSidebar` | `src/renderer/components/settings/external-services/ExternalServicesSidebar.tsx` | `ExternalServicesSidebarProps` | external-services-collections, external-services-create-collection, external-services-import-collection | f=F-031 |
| `ExternalServicesSystemVariablesHelp` | `src/renderer/components/settings/external-services/ExternalServicesSystemVariablesHelp.tsx` | `ExternalServicesSystemVariablesHelpProps` | external-services-system-variables, external-services-variables-insert-target | f=F-031 |
| `ExternalServicesTriggerList` | `src/renderer/components/settings/external-services/ExternalServicesTriggerList.tsx` | `ExternalServicesTriggerListProps` | external-services-triggers | f=F-031 |
| `ExternalServicesTriggerVariableHelp` | `src/renderer/components/settings/external-services/ExternalServicesTriggerVariableHelp.tsx` | `ExternalServicesTriggerVariableHelpProps` | — | f=F-031 |
| `ExternalServicesVariableHelpButton` | `src/renderer/components/settings/external-services/ExternalServicesVariableHelpButton.tsx` | `ExternalServicesVariableHelpButtonProps` | — | f=F-031 |
| `ExternalServicesVariablesDialog` | `src/renderer/components/settings/external-services/ExternalServicesVariablesDialog.tsx` | `ExternalServicesVariablesDialogProps` | external-services-variables-example, external-services-variables-system-warning, external-services-collection-variables-editor | f=F-031 |
| `ExternalServicesWelcome` | `src/renderer/components/settings/external-services/ExternalServicesWelcome.tsx` | `ExternalServicesWelcomeProps` | external-services-welcome | f=F-031 |
| `ExternalServicesTemplateField` | `src/renderer/components/settings/external-services/templateAutocomplete/ExternalServicesTemplateField.tsx` | `ExternalServicesTemplateFieldProps` | — | f=F-031 |
| `TemplateAutocompletePopup` | `src/renderer/components/settings/external-services/templateAutocomplete/TemplateAutocompletePopup.tsx` | `TemplateAutocompletePopupProps` | external-services-template-autocomplete | f=F-031 |
| `CodecPreferencesSortableList` | `src/renderer/components/settings/panels/CodecPreferencesSortableList.tsx` | `CodecPreferencesSortableListProps` | — | — |
| `NotificationHistoryTable` | `src/renderer/components/settings/panels/NotificationHistoryTable.tsx` | `—` | settings-notification-history-table | — |
| `OcpModuleSettingsCard` | `src/renderer/components/settings/panels/OcpModuleSettingsCard.tsx` | `OcpModuleSettingsCardProps` | ocp-module-settings-card, ocp-module-active-login, ocp-module-enabled-toggle, ocp-module-auto-connect-toggle, ocp-module-domain-input, ocp-module-error | f=F-028 lf=LF-086,LF-087 |
| `SdkModuleSettingsBlockedSitesSection` | `src/renderer/components/settings/panels/SdkModuleSettingsBlockedSitesSection.tsx` | `—` | sdk-module-blacklist, sdk-module-blacklist-empty | — |
| `SdkModuleSettingsCard` | `src/renderer/components/settings/panels/SdkModuleSettingsCard.tsx` | `—` | sdk-module-settings-card, sdk-module-section-tabs, sdk-module-tab-main, sdk-module-tab-trusted, sdk-module-tab-blocked, sdk-module-error | f=F-011 lf=LF-051,LF-065 |
| `SdkModuleSettingsClientsSection` | `src/renderer/components/settings/panels/SdkModuleSettingsClientsSection.tsx` | `—` | — | — |
| `SdkModuleSettingsOriginAddressEditor` | `src/renderer/components/settings/panels/SdkModuleSettingsOriginAddressEditor.tsx` | `—` | — | — |
| `SdkModuleSettingsOriginConfirmDialog` | `src/renderer/components/settings/panels/SdkModuleSettingsOriginConfirmDialog.tsx` | `—` | — | — |
| `SdkModuleSettingsOriginMatrix` | `src/renderer/components/settings/panels/SdkModuleSettingsOriginMatrix.tsx` | `—` | — | — |
| `SdkModuleSettingsPairedSection` | `src/renderer/components/settings/panels/SdkModuleSettingsPairedSection.tsx` | `—` | sdk-module-paired | — |
| `SdkModuleSettingsStatusSection` | `src/renderer/components/settings/panels/SdkModuleSettingsStatusSection.tsx` | `—` | sdk-module-diagnostics, sdk-module-refresh, sdk-module-bind | — |
| `SdkModuleSettingsTimeoutsSection` | `src/renderer/components/settings/panels/SdkModuleSettingsTimeoutsSection.tsx` | `—` | sdk-module-timeouts, sdk-timeout-consent, sdk-timeout-origin-trust, sdk-timeout-pairing | f=F-011 lf=LF-051 |
| `SdkModuleSettingsTrustedSiteItem` | `src/renderer/components/settings/panels/SdkModuleSettingsTrustedSiteItem.tsx` | `—` | — | — |
| `SdkModuleSettingsTrustedSitesSection` | `src/renderer/components/settings/panels/SdkModuleSettingsTrustedSitesSection.tsx` | `—` | sdk-module-allowed-origins, sdk-module-origin-add-input, sdk-module-origin-add, sdk-module-origins-empty, sdk-module-trusted-accordion | — |
| `SettingsAccountPanel` | `src/renderer/components/settings/panels/SettingsAccountPanel.tsx` | `SettingsAccountPanelProps` | settings-account-panel | — |
| `SettingsCodecsPanel` | `src/renderer/components/settings/panels/SettingsCodecsPanel.tsx` | `SettingsCodecsPanelProps` | settings-codecs-panel, settings-codecs-error | — |
| `SettingsDiagnosticsPanel` | `src/renderer/components/settings/panels/SettingsDiagnosticsPanel.tsx` | `—` | — | — |
| `SettingsGeneralPanel` | `src/renderer/components/settings/panels/SettingsGeneralPanel.tsx` | `SettingsGeneralPanelProps` | settings-general-panel, settings-theme-control, settings-language-select, settings-current-version, settings-latest-version, settings-update-status, settings-check-updates, settings-open-download-page | — |
| `SettingsHeadsetPanel` | `src/renderer/components/settings/panels/SettingsHeadsetPanel.tsx` | `SettingsHeadsetPanelProps` | settings-headset-panel, settings-headset-enabled-toggle, settings-headset-auto-reconnect-toggle, settings-headset-status, settings-headset-device-label, settings-headset-capabilities, settings-headset-empty-hint, settings-headset-reconnect-hint, settings-headset-enable-first-hint, settings-headset-device-select, settings-headset-connect, settings-headset-disconnect | — |
| `SettingsIntegrationsPanel` | `src/renderer/components/settings/panels/SettingsIntegrationsPanel.tsx` | `SettingsIntegrationsPanelProps` | settings-integrations-panel | f=F-028,F-011,F-031 |
| `SettingsNotificationAppearancePanel` | `src/renderer/components/settings/panels/SettingsNotificationAppearancePanel.tsx` | `SettingsNotificationAppearancePanelProps` | settings-notification-appearance, settings-notification-placement-control, settings-notification-stacking-control, settings-notification-duration, settings-notification-max-visible, settings-notification-closable | lf=LF-060 f=F-034 |
| `SettingsNotificationCenterPanel` | `src/renderer/components/settings/panels/SettingsNotificationCenterPanel.tsx` | `SettingsNotificationCenterPanelProps` | settings-notification-center, settings-notification-center-tabs, settings-notification-center-tab-preferences, settings-notification-center-tab-appearance, settings-notification-center-tab-history, settings-notification-history-unavailable | lf=LF-060 f=F-034 |
| `SettingsNotificationHistoryPanel` | `src/renderer/components/settings/panels/SettingsNotificationHistoryPanel.tsx` | `—` | settings-notification-history, settings-notification-history-module, settings-notification-history-error, settings-notification-history-loading, settings-notification-history-empty, settings-notification-history-page, settings-notification-history-page-size | — |
| `SettingsNotificationModuleRow` | `src/renderer/components/settings/panels/SettingsNotificationModuleRow.tsx` | `SettingsNotificationModuleRowProps` | — | — |
| `SettingsNotificationPreferencesPanel` | `src/renderer/components/settings/panels/SettingsNotificationPreferencesPanel.tsx` | `SettingsNotificationPreferencesPanelProps` | settings-notification-preferences, settings-notification-master-popup, settings-notification-master-off-hint, settings-notification-preset-default, settings-notification-preset-quiet-successes, settings-notification-preset-telephony-focus | — |
| `SettingsPlaceholderPanel` | `src/renderer/components/settings/panels/SettingsPlaceholderPanel.tsx` | `SettingsPlaceholderPanelProps` | — | — |
| `SettingsPreferencesTransferSection` | `src/renderer/components/settings/panels/SettingsPreferencesTransferSection.tsx` | `SettingsPreferencesTransferSectionProps` | settings-preferences-transfer, settings-preferences-export, settings-preferences-import | — |
| `SettingsRingtoneSection` | `src/renderer/components/settings/panels/SettingsRingtoneSection.tsx` | `SettingsRingtoneSectionProps` | settings-incoming-ringtone-select, settings-incoming-ringtone-preview, settings-incoming-ringtone-hint | — |
| `SettingsSessionsPanel` | `src/renderer/components/settings/panels/SettingsSessionsPanel.tsx` | `SettingsSessionsPanelProps` | settings-sessions-panel, settings-multi-sessions-toggle, settings-multi-sessions-hint, settings-auto-answer-enabled-toggle, settings-auto-answer-hint, settings-auto-answer-timeout, settings-auto-answer-during-active-session-toggle, settings-auto-answer-during-active-session-hint | — |
| `SettingsSystemStateOcpTab` | `src/renderer/components/settings/panels/SettingsSystemStateOcpTab.tsx` | `SettingsSystemStateOcpTabProps` | settings-system-state-ocp-tab, settings-ocp-recovery-actions | lf=LF-057 f=F-016,F-028 |
| `SettingsSystemStatePanel` | `src/renderer/components/settings/panels/SettingsSystemStatePanel.tsx` | `SettingsSystemStatePanelProps` | settings-system-state-panel, settings-system-state-tabs, settings-system-state-tab-sip, settings-system-state-tab-ocp, settings-sip-recovery-server, settings-sip-auto-reconnect-toggle, settings-sip-recovery-registration, settings-sip-auto-reregister-toggle, settings-sip-auto-register-startup-toggle, settings-sip-journal, settings-sip-journal-empty, settings-sip-journal-entry, settings-sip-journal-clear | lf=LF-008,LF-057 f=F-014,F-016,F-021 smoke=R7- |
| `SettingsVideoPanel` | `src/renderer/components/settings/panels/SettingsVideoPanel.tsx` | `SettingsVideoPanelProps` | settings-video-panel, settings-video-mic-select, settings-video-camera-select, settings-video-preview-frame, settings-video-preview, settings-video-preview-error, settings-video-devices-error, settings-video-refresh-devices, settings-video-default-view-select, settings-video-enable-local-video-after-connect-toggle, settings-video-auto-fullscreen-toggle, settings-video-conference-substring | — |
| `ShellDialpadPanel` | `src/renderer/components/shell/ShellDialpadPanel.tsx` | `ShellDialpadPanelProps` | — | — |
| `ShellOverlaySheet` | `src/renderer/components/shell/ShellOverlaySheet.tsx` | `ShellOverlaySheetProps` | — | — |
| `ShellTitleBar` | `src/renderer/components/shell/ShellTitleBar.tsx` | `ShellTitleBarProps` | shell-titlebar, shell-titlebar | — |
| `ShellWindowControls` | `src/renderer/components/shell/ShellWindowControls.tsx` | `ShellWindowControlsProps` | shell-window-controls, shell-window-controls | lf=LF-079 f=F-016 |
| `Accordion` | `src/renderer/components/ui/accordion/Accordion.tsx` | `AccordionProps` | — | — |
| `AlertDialog` | `src/renderer/components/ui/alert-dialog/AlertDialog.tsx` | `AlertDialogProps` | — | — |
| `Dialog` | `src/renderer/components/ui/dialog/Dialog.tsx` | `DialogProps` | — | — |
| `DropdownMenu` | `src/renderer/components/ui/dropdown-menu/DropdownMenu.tsx` | `DropdownMenuProps` | — | — |
| `SidebarProvider` | `src/renderer/components/ui/sidebar/SidebarProvider.tsx` | `SidebarProviderProps` | — | — |
| `Toaster` | `src/renderer/components/ui/sonner/Sonner.tsx` | `ToasterProps` | — | — |
| `Tabs` | `src/renderer/components/ui/tabs/Tabs.tsx` | `TabsProps` | ui-tabs-indicator | — |
| `ToastProvider` | `src/renderer/components/ui/toast/Toast.tsx` | `ToastProviderProps` | — | — |
| `TooltipProvider` | `src/renderer/components/ui/tooltip/Tooltip.tsx` | `TooltipProviderProps` | — | — |
| `UpdateAvailableBanner` | `src/renderer/components/updates/UpdateAvailableBanner.tsx` | `UpdateAvailableBannerProps` | update-available-banner-anchor, update-available-banner, update-available-banner-message, update-available-banner-download, update-available-banner-later | — |
| `ShellNavigationController` | `src/renderer/navigation/ShellNavigationController.tsx` | `—` | — | — |
| `ShellRoutePanelOutlet` | `src/renderer/navigation/ShellRoutePanelOutlet.tsx` | `—` | shell-route-panel-outlet | — |
| `ShellRouteDataController` | `src/renderer/navigation/routeData/ShellRouteDataController.tsx` | `—` | — | — |
| `AuthAccountShell` | `src/renderer/shells/AuthAccountShell.tsx` | `—` | — | — |
| `BootstrapSplashShell` | `src/renderer/shells/BootstrapSplashShell.tsx` | `BootstrapSplashShellProps` | bootstrap-ball-stage | lf=LF-002 f=F-016 |
| `SessionFeatureShell` | `src/renderer/shells/SessionFeatureShell.tsx` | `—` | — | — |
| `SoftphoneReadyShell` | `src/renderer/shells/SoftphoneReadyShell.tsx` | `—` | — | — |
| `SoftphoneShellHeader` | `src/renderer/shells/SoftphoneShellHeader.tsx` | `—` | shell-header | lf=LF-011,LF-076,LF-086 f=F-016 smoke=R7- |
| `CallContextShell` | `src/renderer/shells/call/CallContextShell.tsx` | `—` | call-context-zone, call-session-block | — |
| `CallControlsShell` | `src/renderer/shells/call/CallControlsShell.tsx` | `—` | call-controls-zone, remote-audio-mount | — |
| `IncomingCallOverlayShell` | `src/renderer/shells/call/IncomingCallOverlayShell.tsx` | `—` | — | — |
| `ContactsShellRoutePanel` | `src/renderer/shells/contacts/ContactsShellRoutePanel.tsx` | `—` | — | — |
| `HistoryShellRoutePanel` | `src/renderer/shells/history/HistoryShellRoutePanel.tsx` | `—` | — | — |
| `OperatorStatusSelector` | `src/renderer/widgets/OperatorStatusSelector/OperatorStatusSelector.tsx` | `OperatorStatusSelectorProps` | ocp-status-selector, ocp-status-dot, ocp-status-label, ocp-status-selector-root | — |
| `SoftphoneLayout` | `src/renderer/widgets/SoftphoneLayout/SoftphoneLayout.tsx` | `SoftphoneLayoutProps` | softphone-layout, layout-header-zone, layout-context-zone, layout-controls-zone, layout-overlay-layer | lf=LF-011 f=F-014 smoke=R7- |

## Usage

- Agents: read this file for renderer component map and smoke test IDs.
- Developers: add `@uiMeta lf=… f=… smoke=…` to component JSDoc; re-run catalog.
- Storybook: `npm run storybook` for visual states.
