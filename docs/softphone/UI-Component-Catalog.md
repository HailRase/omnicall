# UI Component Catalog

> **Auto-generated.** Do not edit by hand. Run: `npm run ui:catalog`

## Index

| Component | Path | Exported props | Test IDs | @uiMeta |
| --- | --- | --- | --- | --- |
| `App` | `src/renderer/App.tsx` | `—` | softphone-shell, bootstrap-loading, bootstrap-error | — |
| `AccountPanel` | `src/renderer/components/account/AccountPanel.tsx` | `—` | account-panel, account-error | — |
| `AuthStateView` | `src/renderer/components/auth/AuthStateView.tsx` | `—` | — | — |
| `ActiveCallControlsPanel` | `src/renderer/components/call/ActiveCallControlsPanel.tsx` | `ActiveCallControlsPanelProps` | active-call-controls, active-call-mute-indicator, active-call-control-error, control-disabled-reason | — |
| `AutoAnswerCountdown` | `src/renderer/components/call/AutoAnswerCountdown.tsx` | `AutoAnswerCountdownProps` | auto-answer-countdown | — |
| `CallLineRow` | `src/renderer/components/call/CallLineRow.tsx` | `CallLineRowProps` | — | lf=LF-011,LF-021,LF-022,LF-023 f=F-016 smoke=R7- |
| `CallLinesShell` | `src/renderer/components/call/CallLinesShell.tsx` | `CallLinesShellProps` | call-lines-panel, multi-call-policy-error | — |
| `CallerIdentityBlock` | `src/renderer/components/call/CallerIdentityBlock.tsx` | `CallerIdentityBlockProps` | caller-identity, incoming-campaign-context | — |
| `CampaignEventModal` | `src/renderer/components/call/CampaignEventModal.tsx` | `CampaignEventModalProps` | campaign-event-modal, campaign-modal-error, campaign-disabled-reason | — |
| `IncomingCallActions` | `src/renderer/components/call/IncomingCallActions.tsx` | `IncomingCallActionsProps` | incoming-answer-disabled-reason | — |
| `IncomingCallModal` | `src/renderer/components/call/IncomingCallModal.tsx` | `IncomingCallModalProps` | incoming-call-modal, ringing-indicator | — |
| `IncomingCallStatusMessage` | `src/renderer/components/call/IncomingCallStatusMessage.tsx` | `IncomingCallStatusMessageProps` | incoming-call-status | — |
| `MultiCallHoldAllIndicator` | `src/renderer/components/call/MultiCallHoldAllIndicator.tsx` | `MultiCallHoldAllIndicatorProps` | multi-call-hold-all-indicator | — |
| `MultiLineCallList` | `src/renderer/components/call/MultiLineCallList.tsx` | `MultiLineCallListProps` | multi-line-call-list | — |
| `OutgoingCallCard` | `src/renderer/components/call/OutgoingCallCard.tsx` | `OutgoingCallCardProps` | outgoing-call-card, call-state-label, tone-state-indicator, call-ui-state-label, call-failed-alert | — |
| `QueueInfoLabel` | `src/renderer/components/call/QueueInfoLabel.tsx` | `QueueInfoLabelProps` | queue-info-label | — |
| `RejectReasonSelector` | `src/renderer/components/call/RejectReasonSelector.tsx` | `RejectReasonSelectorProps` | reject-reason-select | — |
| `TransferPanel` | `src/renderer/components/call/TransferPanel.tsx` | `TransferPanelProps` | transfer-panel, transfer-in-progress-indicator, transfer-failure-banner, transfer-target-input, transfer-disabled-reason | — |
| `Dialpad` | `src/renderer/components/dialpad/Dialpad.tsx` | `DialpadProps` | dialpad-panel, dialpad-mode-number, call-dtmf-toggle, dialpad-input, dialpad-key-0, dialpad-key-0, dialpad-disabled-reason | — |
| `RegistrationStatusDot` | `src/renderer/components/header/RegistrationStatusDot.tsx` | `RegistrationStatusDotProps` | registration-status-dot | lf=LF-011 f=F-016 smoke=R7- |
| `UserAvatar` | `src/renderer/components/header/UserAvatar.tsx` | `UserAvatarProps` | user-avatar, user-avatar | lf=LF-086 f=F-016 smoke=R7- |
| `AppIcon` | `src/renderer/components/icons/AppIcon.tsx` | `AppIconProps` | — | — |
| `IconControlButton` | `src/renderer/components/icons/IconControlButton.tsx` | `IconControlButtonProps` | — | — |
| `IconTooltip` | `src/renderer/components/icons/IconTooltip.tsx` | `IconTooltipProps` | icon-tooltip-host | — |
| `OcpToastStack` | `src/renderer/components/ocp/OcpToastStack.tsx` | `OcpToastStackProps` | ocp-toast-stack, ocp-toast | — |
| `ConnectionOverlay` | `src/renderer/components/recovery/ConnectionOverlay.tsx` | `ConnectionOverlayProps` | connection-overlay-host, connection-overlay-scrim, connection-overlay, connection-server-terminate, reconnect-countdown | — |
| `LogoutActiveSessionConfirmationModal` | `src/renderer/components/session/LogoutActiveSessionConfirmationModal.tsx` | `LogoutActiveSessionConfirmationModalProps` | logout-active-session-modal | — |
| `SettingsOverlay` | `src/renderer/components/settings/SettingsOverlay.tsx` | `SettingsOverlayProps` | settings-overlay-body, settings-update-error, settings-multi-sessions-toggle, settings-multi-sessions-hint, settings-sip-auto-reregister-toggle, settings-sip-reregister-interval, settings-sip-recovery-hint | lf=LF-032,LF-076,LF-008 f=F-016,F-014 smoke=R7-5 |
| `ShellOverlaySheet` | `src/renderer/components/shell/ShellOverlaySheet.tsx` | `ShellOverlaySheetProps` | — | f=F-016 smoke=settings-overlay,diagnostics-overlay |
| `BreakReasonPicker` | `src/renderer/components/status/BreakReasonPicker.tsx` | `BreakReasonPickerProps` | break-reason-picker | — |
| `LogoutReasonModal` | `src/renderer/components/status/LogoutReasonModal.tsx` | `LogoutReasonModalProps` | logout-reason-modal, logout-reason-input | — |
| `PhoneStatusBadge` | `src/renderer/components/status/PhoneStatusBadge.tsx` | `—` | phone-status-badge | — |
| `StatusSelector` | `src/renderer/components/status/StatusSelector.tsx` | `StatusSelectorProps` | status-selector, status-selector-current, status-change-in-progress, status-rejection-banner, status-disabled-reason | — |
| `StatusTimer` | `src/renderer/components/status/StatusTimer.tsx` | `StatusTimerProps` | status-timer | — |
| `AuthAccountShell` | `src/renderer/shells/AuthAccountShell.tsx` | `—` | — | — |
| `OperatorFeatureShell` | `src/renderer/shells/OperatorFeatureShell.tsx` | `—` | — | — |
| `RecoveryFeatureShell` | `src/renderer/shells/RecoveryFeatureShell.tsx` | `—` | — | — |
| `SessionFeatureShell` | `src/renderer/shells/SessionFeatureShell.tsx` | `—` | logout-error-banner | — |
| `SoftphoneReadyShell` | `src/renderer/shells/SoftphoneReadyShell.tsx` | `—` | — | — |
| `SoftphoneShellHeader` | `src/renderer/shells/SoftphoneShellHeader.tsx` | `—` | shell-header | lf=LF-011,LF-076,LF-086 f=F-016 smoke=R7- |
| `CallContextShell` | `src/renderer/shells/call/CallContextShell.tsx` | `—` | call-context-zone, sip-registered-hint | — |
| `CallControlsShell` | `src/renderer/shells/call/CallControlsShell.tsx` | `—` | call-controls-zone, remote-audio-mount | — |
| `CallOverlayShell` | `src/renderer/shells/call/CallOverlayShell.tsx` | `—` | — | — |
| `SoftphoneLayout` | `src/renderer/widgets/SoftphoneLayout/SoftphoneLayout.tsx` | `SoftphoneLayoutProps` | softphone-layout, layout-header-zone, layout-context-zone, layout-controls-zone, layout-overlay-layer | lf=LF-011 f=F-014 smoke=R7- |

## Usage

- Agents: read this file for renderer component map and smoke test IDs.
- Developers: add `@uiMeta lf=… f=… smoke=…` to component JSDoc; re-run catalog.
- Storybook: `npm run storybook` for visual states.
