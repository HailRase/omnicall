# UI Component Catalog

> **Auto-generated.** Do not edit by hand. Run: `npm run ui:catalog`

## Index

| Component | Path | Exported props | Test IDs | @uiMeta |
| --- | --- | --- | --- | --- |
| `App` | `src/renderer/App.tsx` | `—` | softphone-shell, shutdown-progress, shutdown-error, bootstrap-loading, bootstrap-error | — |
| `AccountPanel` | `src/renderer/components/account/AccountPanel.tsx` | `—` | account-panel, account-username, account-password, account-domain, account-server, account-password, account-password-hint, account-save-profile-row, account-save-profile-checkbox, account-authorize, account-logout | — |
| `DeleteSavedAccountProfileConfirmationModal` | `src/renderer/components/account/DeleteSavedAccountProfileConfirmationModal.tsx` | `DeleteSavedAccountProfileConfirmationModalProps` | delete-saved-account-profile-modal | — |
| `SavedAccountProfileSelector` | `src/renderer/components/account/SavedAccountProfileSelector.tsx` | `SavedAccountProfileSelectorProps` | saved-account-profile-selector, saved-account-profile-tablist, saved-account-profile-delete | — |
| `SwitchSavedAccountProfileConfirmationModal` | `src/renderer/components/account/SwitchSavedAccountProfileConfirmationModal.tsx` | `SwitchSavedAccountProfileConfirmationModalProps` | switch-saved-account-profile-modal | — |
| `ActiveCallControlsPanel` | `src/renderer/components/call/ActiveCallControlsPanel.tsx` | `ActiveCallControlsPanelProps` | active-call-controls, active-call-mute-indicator, control-disabled-reason | — |
| `CallControlsBar` | `src/renderer/components/call/CallControlsBar.tsx` | `CallControlsBarProps` | call-controls-bar | lf=LF-022,LF-023 f=F-004,F-016 smoke=R7- |
| `CallIdleEmptyState` | `src/renderer/components/call/CallIdleEmptyState.tsx` | `—` | call-idle-empty-state | lf=LF-020 f=F-003,F-016 |
| `CallLineRow` | `src/renderer/components/call/CallLineRow.tsx` | `CallLineRowProps` | — | lf=LF-011,LF-021,LF-022,LF-023 f=F-016 smoke=R7- |
| `CallLinesShell` | `src/renderer/components/call/CallLinesShell.tsx` | `CallLinesShellProps` | call-lines-panel, multi-call-policy-error | — |
| `CallSessionCard` | `src/renderer/components/call/CallSessionCard.tsx` | `CallSessionCardProps` | — | lf=LF-011,LF-021 f=F-016 smoke=R7- |
| `CallSessionStack` | `src/renderer/components/call/CallSessionStack.tsx` | `CallSessionStackProps` | call-session-stack, multi-call-policy-error | lf=LF-021 f=F-016 smoke=R7- |
| `CampaignEventModal` | `src/renderer/components/call/CampaignEventModal.tsx` | `CampaignEventModalProps` | campaign-event-modal, campaign-modal-error, campaign-disabled-reason | — |
| `DtmfKeypadPanel` | `src/renderer/components/call/DtmfKeypadPanel.tsx` | `DtmfKeypadPanelProps` | dtmf-keypad-panel | lf=LF-024 f=F-008,F-016 |
| `IncomingCallOverlay` | `src/renderer/components/call/IncomingCallOverlay.tsx` | `IncomingCallOverlayProps` | incoming-call-overlay, caller-identity, auto-answer-countdown, queue-info-label, incoming-campaign-context, incoming-answer-disabled-reason, reject-call, answer-call | lf=LF-013,LF-014 f=F-002 smoke=R3-2 |
| `IncomingCallSessionCard` | `src/renderer/components/call/IncomingCallSessionCard.tsx` | `IncomingCallSessionCardProps` | incoming-call-session-select, caller-identity, incoming-call-status-label, auto-answer-countdown, queue-info-label, incoming-campaign-context, incoming-answer-disabled-reason, reject-call, answer-call | lf=LF-013,LF-014 f=F-002 smoke=R3-2 |
| `IncomingCallStatusMessage` | `src/renderer/components/call/IncomingCallStatusMessage.tsx` | `IncomingCallStatusMessageProps` | incoming-call-status | — |
| `MultiCallHoldAllIndicator` | `src/renderer/components/call/MultiCallHoldAllIndicator.tsx` | `MultiCallHoldAllIndicatorProps` | multi-call-hold-all-indicator | — |
| `MultiLineCallList` | `src/renderer/components/call/MultiLineCallList.tsx` | `MultiLineCallListProps` | multi-line-call-list | — |
| `OutgoingCallCard` | `src/renderer/components/call/OutgoingCallCard.tsx` | `OutgoingCallCardProps` | outgoing-call-card, call-state-label, call-failed-alert | — |
| `QueueInfoLabel` | `src/renderer/components/call/QueueInfoLabel.tsx` | `QueueInfoLabelProps` | queue-info-label | — |
| `RejectReasonSelector` | `src/renderer/components/call/RejectReasonSelector.tsx` | `RejectReasonSelectorProps` | reject-reason-select | — |
| `TransferPanel` | `src/renderer/components/call/TransferPanel.tsx` | `TransferPanelProps` | transfer-panel, transfer-source-line, transfer-target-input, transfer-target-divider, transfer-target-candidates, transfer-next-step, transfer-consultation-line, transfer-in-progress-indicator, control-attended-transfer, transfer-disabled-reason | — |
| `TransferSuccessOverlay` | `src/renderer/components/call/TransferSuccessOverlay.tsx` | `TransferSuccessOverlayProps` | transfer-success-overlay | lf=LF-028,LF-029 f=F-006,F-007 smoke=transfer-success |
| `Dialpad` | `src/renderer/components/dialpad/Dialpad.tsx` | `DialpadProps` | dialpad-panel, dialpad-input, dialpad-key-0, dialpad-call | lf=LF-020 f=F-003,F-016,F-021 smoke=R7- |
| `RegistrationStatusDot` | `src/renderer/components/header/RegistrationStatusDot.tsx` | `RegistrationStatusDotProps` | registration-status-dot | lf=LF-011 f=F-016 smoke=R7- |
| `UserAvatarMenu` | `src/renderer/components/header/UserAvatarMenu.tsx` | `UserAvatarMenuProps` | user-avatar-menu, user-menu-open-settings, user-menu-toggle-dnd, user-menu-logout | lf=LF-086 f=F-016 smoke=R7- |
| `UserHeaderIdentity` | `src/renderer/components/header/UserHeaderIdentity.tsx` | `UserHeaderIdentityProps` | user-header-identity, user-sip-status, user-sip-status-timer | lf=LF-086 f=F-016 smoke=R7- |
| `AppIcon` | `src/renderer/components/icons/AppIcon.tsx` | `AppIconProps` | — | — |
| `IconControlButton` | `src/renderer/components/icons/IconControlButton.tsx` | `IconControlButtonProps` | — | — |
| `IconTooltip` | `src/renderer/components/icons/IconTooltip.tsx` | `IconTooltipProps` | icon-tooltip-bubble, icon-tooltip-host | — |
| `NotificationToast` | `src/renderer/components/notifications/NotificationToast.tsx` | `NotificationToastProps` | notification-toast | — |
| `NotificationViewport` | `src/renderer/components/notifications/NotificationViewport.tsx` | `NotificationViewportProps` | notification-viewport | — |
| `OcpToastStack` | `src/renderer/components/ocp/OcpToastStack.tsx` | `OcpToastStackProps` | ocp-toast-stack, ocp-toast | — |
| `LogoutActiveSessionConfirmationModal` | `src/renderer/components/session/LogoutActiveSessionConfirmationModal.tsx` | `LogoutActiveSessionConfirmationModalProps` | logout-active-session-modal | — |
| `SettingsFullscreenOverlay` | `src/renderer/components/settings/SettingsFullscreenOverlay.tsx` | `SettingsFullscreenOverlayProps` | settings-overlay, settings-overlay-backdrop | f=F-016,F-017 smoke=settings-overlay |
| `SettingsPanel` | `src/renderer/components/settings/SettingsPanel.tsx` | `SettingsPanelProps` | settings-overlay-body, settings-section-title | lf=LF-032,LF-076,LF-008 f=F-016,F-014,F-017 smoke=R7-5 |
| `SettingsSidebar` | `src/renderer/components/settings/SettingsSidebar.tsx` | `SettingsSidebarProps` | settings-sidebar | — |
| `CodecPreferencesSortableList` | `src/renderer/components/settings/panels/CodecPreferencesSortableList.tsx` | `CodecPreferencesSortableListProps` | — | — |
| `SettingsAccountPanel` | `src/renderer/components/settings/panels/SettingsAccountPanel.tsx` | `SettingsAccountPanelProps` | settings-account-panel, account-settings-modal-backdrop | — |
| `SettingsCodecsPanel` | `src/renderer/components/settings/panels/SettingsCodecsPanel.tsx` | `SettingsCodecsPanelProps` | settings-codecs-panel, settings-codecs-error, settings-codecs-video-future-only | — |
| `SettingsDiagnosticsPanel` | `src/renderer/components/settings/panels/SettingsDiagnosticsPanel.tsx` | `—` | — | — |
| `SettingsGeneralPanel` | `src/renderer/components/settings/panels/SettingsGeneralPanel.tsx` | `SettingsGeneralPanelProps` | settings-general-panel, settings-theme-control, settings-language-select, settings-notification-placement-control, settings-notification-stacking-control, settings-notification-duration, settings-notification-max-visible, settings-notification-closable, settings-current-version, settings-latest-version, settings-update-status, settings-check-updates, settings-open-download-page | — |
| `SettingsHeadsetPanel` | `src/renderer/components/settings/panels/SettingsHeadsetPanel.tsx` | `—` | — | — |
| `SettingsPlaceholderPanel` | `src/renderer/components/settings/panels/SettingsPlaceholderPanel.tsx` | `SettingsPlaceholderPanelProps` | — | — |
| `SettingsSessionsPanel` | `src/renderer/components/settings/panels/SettingsSessionsPanel.tsx` | `SettingsSessionsPanelProps` | settings-sessions-panel, settings-multi-sessions-toggle, settings-multi-sessions-hint, settings-auto-answer-enabled-toggle, settings-auto-answer-hint, settings-auto-answer-timeout, settings-auto-answer-during-active-session-toggle, settings-auto-answer-during-active-session-hint | — |
| `SettingsSystemStatePanel` | `src/renderer/components/settings/panels/SettingsSystemStatePanel.tsx` | `SettingsSystemStatePanelProps` | settings-system-state-panel, settings-sip-recovery-server, settings-sip-auto-reconnect-toggle, settings-sip-recovery-registration, settings-sip-auto-reregister-toggle, settings-sip-auto-register-startup-toggle, settings-sip-journal, settings-sip-journal-empty, settings-sip-journal-entry, settings-sip-journal-clear | lf=LF-008,LF-057 f=F-014,F-016,F-021 smoke=R7- |
| `ShellOverlaySheet` | `src/renderer/components/shell/ShellOverlaySheet.tsx` | `ShellOverlaySheetProps` | — | f=F-016 smoke=settings-overlay,diagnostics-overlay |
| `ShellTitleBar` | `src/renderer/components/shell/ShellTitleBar.tsx` | `ShellTitleBarProps` | shell-titlebar, shell-titlebar | — |
| `ShellWindowControls` | `src/renderer/components/shell/ShellWindowControls.tsx` | `ShellWindowControlsProps` | shell-window-controls | lf=LF-079 f=F-016 |
| `BreakReasonPicker` | `src/renderer/components/status/BreakReasonPicker.tsx` | `BreakReasonPickerProps` | break-reason-picker | — |
| `LogoutReasonModal` | `src/renderer/components/status/LogoutReasonModal.tsx` | `LogoutReasonModalProps` | logout-reason-modal, logout-reason-input | — |
| `PhoneStatusBadge` | `src/renderer/components/status/PhoneStatusBadge.tsx` | `—` | phone-status-badge | — |
| `StatusSelector` | `src/renderer/components/status/StatusSelector.tsx` | `StatusSelectorProps` | status-selector, status-selector-current, status-change-in-progress, status-disabled-reason | — |
| `StatusTimer` | `src/renderer/components/status/StatusTimer.tsx` | `StatusTimerProps` | status-timer | — |
| `AlertDialog` | `src/renderer/components/ui/alert-dialog/AlertDialog.tsx` | `AlertDialogProps` | — | — |
| `Dialog` | `src/renderer/components/ui/dialog/Dialog.tsx` | `DialogProps` | — | — |
| `DropdownMenu` | `src/renderer/components/ui/dropdown-menu/DropdownMenu.tsx` | `DropdownMenuProps` | — | — |
| `ToastProvider` | `src/renderer/components/ui/toast/Toast.tsx` | `ToastProviderProps` | — | — |
| `TooltipProvider` | `src/renderer/components/ui/tooltip/Tooltip.tsx` | `TooltipProviderProps` | — | — |
| `UpdateAvailableBanner` | `src/renderer/components/updates/UpdateAvailableBanner.tsx` | `UpdateAvailableBannerProps` | update-available-banner, update-available-banner-message, update-available-banner-download, update-available-banner-later | — |
| `AuthAccountShell` | `src/renderer/shells/AuthAccountShell.tsx` | `—` | — | — |
| `OperatorFeatureShell` | `src/renderer/shells/OperatorFeatureShell.tsx` | `—` | — | — |
| `SessionFeatureShell` | `src/renderer/shells/SessionFeatureShell.tsx` | `—` | — | — |
| `SoftphoneReadyShell` | `src/renderer/shells/SoftphoneReadyShell.tsx` | `—` | — | — |
| `SoftphoneShellHeader` | `src/renderer/shells/SoftphoneShellHeader.tsx` | `—` | shell-header | lf=LF-011,LF-076,LF-086 f=F-016 smoke=R7- |
| `CallContextShell` | `src/renderer/shells/call/CallContextShell.tsx` | `—` | call-context-zone | — |
| `CallControlsShell` | `src/renderer/shells/call/CallControlsShell.tsx` | `—` | call-controls-zone, remote-audio-mount | — |
| `CallOverlayShell` | `src/renderer/shells/call/CallOverlayShell.tsx` | `—` | — | — |
| `SoftphoneLayout` | `src/renderer/widgets/SoftphoneLayout/SoftphoneLayout.tsx` | `SoftphoneLayoutProps` | softphone-layout, layout-header-zone, layout-context-zone, layout-controls-zone, layout-overlay-layer | lf=LF-011 f=F-014 smoke=R7- |

## Usage

- Agents: read this file for renderer component map and smoke test IDs.
- Developers: add `@uiMeta lf=… f=… smoke=…` to component JSDoc; re-run catalog.
- Storybook: `npm run storybook` for visual states.
