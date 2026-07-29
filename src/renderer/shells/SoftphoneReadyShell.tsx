import { useCallback, useEffect, useState, type JSX } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { QueryUserNotificationJournalInput } from "@application/use-cases/settings/QueryUserNotificationJournalUseCase.js";
import type { AccountPanelActionReasonKey } from "@application/index.js";
import { resolveFullscreenVideoSession } from "@application/index.js";
import { NotificationViewport } from "../components/notifications/NotificationViewport.js";
import { resolveNotificationDescriptorTitle } from "../components/notifications/resolveNotificationDescriptorTitle.js";
import { UpdateAvailableBanner } from "../components/updates/UpdateAvailableBanner.js";
import { SettingsFullscreenOverlay } from "../components/settings/SettingsFullscreenOverlay.js";
import { SettingsPanel } from "../components/settings/SettingsPanel.js";
import { DEFAULT_AUTO_ANSWER_TIMEOUT_SEC } from "../components/settings/panels/SettingsSessionsPanel.js";
import { useActionNotifications } from "../hooks/useActionNotifications.js";
import { useAccountPanelShell } from "../hooks/useAccountPanelShell.js";
import { useAuthShellFlags } from "../hooks/useAuthShellFlags.js";
import { useCallFeatureShell } from "../hooks/useCallFeatureShell.js";
import { useHeaderChromeShell } from "../hooks/useHeaderChromeShell.js";
import {
  useNotifications,
  type NotificationDescriptor,
  type NotificationParams,
} from "../hooks/useNotifications.js";
import { useVideoCallNotifications } from "../hooks/useVideoCallNotifications.js";
import { useOverlayShell } from "../hooks/useOverlayShell.js";
import { useShellWindowLayout } from "../hooks/useShellWindowLayout.js";
import { useShellWindowControls } from "../hooks/useShellWindowControls.js";
import { useShellWindowAttentionFromCalls } from "../hooks/useShellWindowAttentionFromCalls.js";
import { useShellTelephonyBusyMirror } from "../hooks/useShellTelephonyBusyMirror.js";
import { useShellWindowAttentionFromCampaign } from "../hooks/useShellWindowAttentionFromCampaign.js";
import { useShellWindowAttentionFromSdk } from "../hooks/useShellWindowAttentionFromSdk.js";
import { useAppUpdate } from "../hooks/useAppUpdate.js";
import { useSettingsActions } from "../hooks/useSettingsActions.js";
import { usePreferencesTransferActions } from "../hooks/usePreferencesTransferActions.js";
import { useOcpSettingsPanel } from "../hooks/useOcpSettingsPanel.js";
import { useSdkSettingsPanel } from "../hooks/useSdkSettingsPanel.js";
import { useExternalServicesPanel } from "../hooks/useExternalServicesPanel.js";
import { useOperatorStatusSelector } from "../hooks/useOperatorStatusSelector.js";
import { mapOcpNotificationToToastDescriptor } from "../integration/ocp/createOcpToastNotificationPresenter.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import {
  useSipSystemStateActions,
  useSipSystemStateShell,
} from "../hooks/useSipSystemStateActions.js";
import { useOcpSystemStateShell } from "../hooks/useOcpSystemStateShell.js";
import { useUserAvatarMenu } from "../hooks/useUserAvatarMenu.js";
import { useUserAvatarMenuActions } from "../hooks/useUserAvatarMenuActions.js";
import { useVideoSettingsPanel } from "../hooks/useVideoSettingsPanel.js";
import type { useSoftphoneShellChrome } from "../hooks/useSoftphoneShellChrome.js";
import { useSoftphoneProjections } from "../hooks/useSoftphoneProjections.js";
import { useI18n } from "../i18n/index.js";
import { ShellNavigationController, ShellRouteDataController, ShellRoutePanelOutlet, useShellNavigation } from "../navigation/index.js";
import { HistoryShellRoutePanel } from "./history/HistoryShellRoutePanel.js";
import { ContactsShellRoutePanel } from "./contacts/ContactsShellRoutePanel.js";
import { SoftphoneLayout } from "../widgets/SoftphoneLayout/SoftphoneLayout.js";
import { OperatorStatusSelector } from "../widgets/OperatorStatusSelector/OperatorStatusSelector.js";
import { OcpConnectionBanner } from "../components/integration/ocp/OcpConnectionBanner.js";
import { OcpCampaignEventModal } from "../components/integration/ocp/OcpCampaignEventModal.js";
import { OcpLogoutReasonModal } from "../components/integration/ocp/OcpLogoutReasonModal.js";
import { OcpSignInProgress } from "../components/account/OcpSignInProgress.js";
import { mapOcpAuthFeedbackToMessageKey } from "../integration/ocp/mapOcpAuthFeedbackToToast.js";
import { OcpRejectBreakReasonModal } from "../components/integration/ocp/OcpRejectBreakReasonModal.js";
import { SdkConnectCeremonyModal } from "../components/integration/SdkConnectCeremonyModal.js";
import { SdkActivateProfileConsentModal } from "../components/integration/SdkActivateProfileConsentModal.js";
import { useSdkConnectCeremony } from "../hooks/useSdkConnectCeremony.js";
import {
  sdkActivateConsentBridge,
  subscribeSdkActivateConsent,
} from "../bootstrap/sdkActivateConsentBridge.js";
import type { SdkActivateConsentPending } from "@application/integration/DeferredSdkActivateConsent.js";
import { useOcpCampaignModal } from "../hooks/useOcpCampaignModal.js";
import { useOcpLogoutModal } from "../hooks/useOcpLogoutModal.js";
import { useOcpRejectWithBreak } from "../hooks/useOcpRejectWithBreak.js";
import { CallContextShell } from "./call/CallContextShell.js";
import { CallControlsShell } from "./call/CallControlsShell.js";
import { IncomingCallOverlayShell } from "./call/IncomingCallOverlayShell.js";
import { VideoFullscreenModal } from "../components/call/VideoFullscreenModal.js";
import { ScreenSharePickerDialog } from "../components/call/ScreenSharePickerDialog.js";
import { SessionFeatureShell } from "./SessionFeatureShell.js";
import { SoftphoneShellHeader } from "./SoftphoneShellHeader.js";

type SoftphoneReadyShellProps = Readonly<{
  facade: AccountBootstrapFacade;
  shellChrome: ReturnType<typeof useSoftphoneShellChrome>;
  isShuttingDown: boolean;
}>;

function sanitizeNotificationParamsForCapture(
  params: NotificationParams | undefined,
): Readonly<Record<string, string | number>> {
  const sanitized: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * - Purpose: compose post-bootstrap feature shells inside SoftphoneLayout zones.
 * - Inputs: account bootstrap facade and shared shell chrome hooks.
 * - Outputs: four-zone ready-state softphone UI tree.
 */
export function SoftphoneReadyShell(props: SoftphoneReadyShellProps): JSX.Element {
  return (
    <ShellNavigationController layout={<SoftphoneShellLayoutRoute {...props} />} />
  );
}

function SoftphoneShellLayoutRoute({
  facade,
  shellChrome,
  isShuttingDown,
}: SoftphoneReadyShellProps): JSX.Element {
  const { t, language } = useI18n();
  const { sessionLogoutActions } = shellChrome;
  const {
    projection,
    multiCallProjection,
    applyMultiCallSettings,
    callVideoMediaUiProjection,
  } =
    useSoftphoneProjections();
  const { blockingAuthState, isSipRegistered } = useAuthShellFlags();
  const overlayShell = useOverlayShell();
  const openSystemState = useCallback((): void => {
    overlayShell.openSettings("system-state");
  }, [overlayShell]);
  const shellNavigation = useShellNavigation();
  const [settingsSidebarExpanded, setSettingsSidebarExpanded] = useState(false);
  const [activateConsentPending, setActivateConsentPending] =
    useState<SdkActivateConsentPending | null>(null);
  useEffect(() => subscribeSdkActivateConsent(setActivateConsentPending), []);
  const queryNotificationHistory = useCallback(
    (input: QueryUserNotificationJournalInput) =>
      facade.queryUserNotificationJournal(input),
    [facade],
  );
  const settingsActions = useSettingsActions({
    facade,
    currentSettings: {
      multiSessionsEnabled: multiCallProjection.multiSessionsEnabled,
      autoUnholdOnTransferFailure: multiCallProjection.autoUnholdOnTransferFailure,
    },
    applyMultiCallSettings,
    isSipRegistered,
  });
  const videoSettingsPanel = useVideoSettingsPanel(
    {
      facade,
      preferredVideoInputDeviceId: settingsActions.preferredVideoInputDeviceId,
      sectionActive:
        overlayShell.settingsOpen && overlayShell.settingsSection === "video",
    },
    t("settings.video.systemDefault"),
  );
  const accountActions = settingsActions.account;
  const accountPanelShell = useAccountPanelShell({
    form: accountActions.form,
    submitting: accountActions.submitting,
    panelDisabled: blockingAuthState,
    authUiState: projection.authUiState,
    sessionLogoutActions,
  });
  const translateAccountActionReason = (
    reasonKey: AccountPanelActionReasonKey | null,
  ): string | null => (reasonKey === null ? null : t(reasonKey));
  const accountAuthorizeDisabledReason =
    accountActions.loginDisabledReasonKey !== null
      ? t(accountActions.loginDisabledReasonKey)
      : translateAccountActionReason(accountPanelShell.authorizeDisabledReason);
  const sipSystemStateActions = useSipSystemStateActions({ facade });
  const sipSystemStateShell = useSipSystemStateShell({
    userSettings: settingsActions.userSettings,
    journalEntries: sipSystemStateActions.journalEntries,
  });
  const ocpSystemState = useOcpSystemStateShell({
    facade,
    ocpModuleEnabled: settingsActions.userSettings.ocpIntegration.enabled,
  });
  const headerChrome = useHeaderChromeShell({
    dndEnabled: projection.phoneStatus === "dnd",
    sipAutoReconnectEnabled: settingsActions.userSettings.sipAutoReconnectEnabled,
    sipAutoReregisterEnabled: settingsActions.userSettings.sipAutoReregisterEnabled,
  });
  const userAvatarMenu = useUserAvatarMenu();
  const callBindings = useCallFeatureShell({ facade });
  const fullscreenSession = resolveFullscreenVideoSession(
    callVideoMediaUiProjection.byCallId,
  );
  const isVideoFullscreen = fullscreenSession !== null;
  const fullscreenCallId = fullscreenSession?.callId ?? null;
  const fullscreenVideoState = fullscreenSession?.videoState ?? null;
  const fullscreenLine =
    fullscreenCallId === null
      ? null
      : (callBindings.callLinesShell.lines.find((line) => line.callId === fullscreenCallId) ??
        (callBindings.controlTargetLine?.callId === fullscreenCallId
          ? callBindings.controlTargetLine
          : null));
  useShellWindowLayout({
    settingsOpen: overlayShell.settingsOpen,
    videoFullscreen: isVideoFullscreen,
  });
  const appUpdate = useAppUpdate({
    backgroundCheckOnMount: true,
    dismissedUpdateBannerVersion: settingsActions.userSettings.dismissedUpdateBannerVersion,
    onDismissUpdateBannerVersion: settingsActions.onDismissUpdateBannerVersion,
  });
  const preferencesTransfer = usePreferencesTransferActions({
    facade,
    currentVersion: appUpdate.snapshot.currentVersion,
    onSettingsImported: settingsActions.applyUserSettingsSnapshot,
  });
  const resolveNotificationTitle = useCallback(
    (descriptor: NotificationDescriptor): string =>
      resolveNotificationDescriptorTitle(descriptor, language),
    [language],
  );
  const captureNotification = useCallback(
    async (
      descriptor: NotificationDescriptor,
      id: string,
      titleSnapshot: string,
    ): Promise<Readonly<{ shouldPresentPopup: boolean }>> => {
      const result = await facade.captureUserNotification({
        id,
        level: descriptor.level,
        module: descriptor.module ?? "system",
        functionId: descriptor.functionId ?? "renderer.notification",
        titleKey: descriptor.messageKey ?? null,
        titleParams: sanitizeNotificationParamsForCapture(
          descriptor.messageParams,
        ),
        titleSnapshot,
        popupEnabled: settingsActions.userSettings.notificationPopupEnabled,
        correlationId: descriptor.correlationId ?? null,
      });
      return {
        shouldPresentPopup: result.ok
          ? result.value.shouldPresentPopup
          : settingsActions.userSettings.notificationPopupEnabled,
      };
    },
    [
      facade,
      settingsActions.userSettings.notificationPopupEnabled,
    ],
  );
  const notifications = useNotifications({
    placement: settingsActions.userSettings.notificationPlacement,
    stacking: settingsActions.userSettings.notificationStacking,
    durationMs: settingsActions.userSettings.notificationDurationMs,
    maxVisible: settingsActions.userSettings.notificationMaxVisible,
    capture: captureNotification,
    resolveTitle: resolveNotificationTitle,
  });
  useEffect(() => {
    const notify = notifications.notify;
    facade.setOcpNotificationHandler((payload) => {
      const descriptor = mapOcpNotificationToToastDescriptor(payload);
      if (descriptor !== null) {
        notify(descriptor);
      }
    });
    return () => {
      facade.setOcpNotificationHandler(null);
    };
  }, [facade, notifications]);
  const ocpAuthFeedback = useAccountBootstrapStore(
    (state) => state.ocpSessionProjection.authFeedback,
  );
  useEffect(() => {
    if (ocpAuthFeedback === null) {
      return;
    }
    const messageKey = mapOcpAuthFeedbackToMessageKey(ocpAuthFeedback.reason);
    notifications.notify({
      id: `ocp-auth-feedback-${ocpAuthFeedback.nonce}`,
      level: "warning",
      messageKey,
      action: {
        id: "ocp-auth-feedback-open-system-state",
        labelKey: "account.notification.openSystemStateAction",
        onClick: () => {
          openSystemState();
        },
      },
    });
    facade.clearOcpAuthFeedback();
  }, [facade, notifications, ocpAuthFeedback, openSystemState]);
  const ocpSettingsPanel = useOcpSettingsPanel({
    facade,
    onActiveUserSettingsRefresh: settingsActions.applyUserSettingsSnapshot,
    onOpenAccountSettings: () => {
      overlayShell.openSettings("account");
    },
  });
  const sdkSettingsPanel = useSdkSettingsPanel({
    facade,
    onActiveUserSettingsRefresh: settingsActions.applyUserSettingsSnapshot,
  });
  const externalServicesPanel = useExternalServicesPanel({
    facade,
    sectionActive:
      overlayShell.settingsOpen &&
      overlayShell.settingsSection === "integrations-external-services",
    onActiveUserSettingsRefresh: settingsActions.applyUserSettingsSnapshot,
  });
  useShellWindowAttentionFromCalls({
    incomingCallProjection: callBindings.incomingCallProjection,
    callProjection: callBindings.callProjection,
  });
  useShellTelephonyBusyMirror({
    incomingCallProjection: callBindings.incomingCallProjection,
    callProjection: callBindings.callProjection,
    multiCallProjection: callBindings.multiCallProjection,
  });
  const ocpCampaignEventProjection = useAccountBootstrapStore(
    (state) => state.ocpCampaignEventProjection,
  );
  useShellWindowAttentionFromCampaign({
    campaignEventProjection: ocpCampaignEventProjection,
  });
  const { onRefresh: refreshSdkSnapshotForAttention } = sdkSettingsPanel;
  useShellWindowAttentionFromSdk({
    activateConsentPending,
    refreshSdkSnapshot: refreshSdkSnapshotForAttention,
  });
  const sdkConnectCeremony = useSdkConnectCeremony({
    pendingOriginTrust: sdkSettingsPanel.pendingOriginTrust,
    pendingPairing: sdkSettingsPanel.pendingPairing,
    busy: sdkSettingsPanel.busy,
    isOriginAllowed: (origin) =>
      sdkSettingsPanel.settings.origins.some(
        (entry) => entry.origin === origin && entry.state === "allowed",
      ) || sdkSettingsPanel.allowedOriginsLive.includes(origin),
    onAllowOriginTrust: sdkSettingsPanel.onAllowOriginTrust,
    onDenyOriginTrust: sdkSettingsPanel.onDenyOriginTrust,
    onCancelOriginTrust: sdkSettingsPanel.onCancelOriginTrust,
    onApprovePairing: sdkSettingsPanel.onApprovePairing,
    onDenyPairing: sdkSettingsPanel.onDenyPairing,
  });
  const ocpLogoutModal = useOcpLogoutModal({
    facade,
    sessionLogoutActions,
    notify: notifications.notify,
  });
  const ocpCampaignModal = useOcpCampaignModal({
    facade,
    notify: notifications.notify,
  });
  const ocpRejectWithBreak = useOcpRejectWithBreak({
    facade,
    callId: callBindings.incomingCallProjection.callId,
    rejectIncoming: callBindings.incomingCallActions.handleRejectIncoming,
    rejectIncomingWithBreakReason:
      callBindings.incomingCallActions.handleRejectIncomingWithBreakReason,
    notify: notifications.notify,
  });
  const userAvatarMenuActions = useUserAvatarMenuActions({
    facade,
    phoneStatus: projection.phoneStatus,
    phoneStatusDisabled: blockingAuthState,
    isSipRegistered,
    authUiState: projection.authUiState,
    sessionLogoutActions,
    onOpenSettings: overlayShell.openSettings,
    onOpenHistory: () => {
      shellNavigation.navigateTo({ name: "history" });
    },
    onOpenContacts: () => {
      shellNavigation.navigateTo({ name: "contacts" });
    },
    onMenuClose: userAvatarMenu.close,
    onLogout: ocpLogoutModal.handleRequestLogout,
  });
  const operatorStatusSelector = useOperatorStatusSelector({
    facade,
    isSipRegistered,
    dndEnabled: projection.phoneStatus === "dnd",
    onOpenIntegrationsSettings: () => {
      overlayShell.openSettings("integrations");
    },
    notify: notifications.notify,
  });
  const sipActionErrorText =
    sipSystemStateActions.actionErrorDetail ??
    (sipSystemStateActions.actionErrorKey !== null ? t(sipSystemStateActions.actionErrorKey) : null);
  useActionNotifications({
    notifications,
    onOpenSystemState: openSystemState,
    accountFeedback: {
      error: accountActions.error,
      successKeys: accountActions.successKeys,
      warningKey: accountActions.warningKey,
      openSystemStateAction: accountActions.openSystemStateAction,
    },
    callControls: {
      projection: callBindings.activeCallControlsProjection,
      onRetry: callBindings.callActions.handleRetryLastOperation,
    },
    outgoingFailure: callBindings.callProjection.lastOutgoingFailure,
    dtmfError: callBindings.callProjection.lastDtmfError,
    transferFailure: callBindings.transferPanelShell.failureMessage,
    logoutErrorMessage: sessionLogoutActions.shell.logoutErrorMessage,
    settingsUpdateError: settingsActions.settingsUpdateError,
    sipActionSuccessKey: sipSystemStateActions.actionSuccessKey,
    sipActionErrorText,
    headsetFault: {
      reason: settingsActions.headsetConnectionProjection.lastFaultReason,
      occurredAt: settingsActions.headsetConnectionProjection.lastFaultAt,
    },
  });
  useVideoCallNotifications({
    eventPublisher: facade.eventPublisher,
    notifications,
  });
  const windowControls = useShellWindowControls({ isShuttingDown });

  return (
    <SoftphoneLayout
      videoFullscreen={isVideoFullscreen}
      header={
        <>
          <SoftphoneShellHeader
            headerChrome={headerChrome}
            userAvatarMenu={userAvatarMenu}
            userAvatarMenuActions={userAvatarMenuActions}
            windowControls={windowControls}
            suppressWindowControls={overlayShell.settingsOpen}
            operatorStatusSlot={
              <OperatorStatusSelector
                vm={operatorStatusSelector.vm}
                finishAppeal={operatorStatusSelector.finishAppeal}
                onSelectReason={operatorStatusSelector.onSelectReason}
                onFinishAppeal={operatorStatusSelector.onFinishAppeal}
              />
            }
          />
          <OcpConnectionBanner
            visible={
              operatorStatusSelector.vm.isReconnecting ||
              operatorStatusSelector.vm.isFailed
            }
            mode={
              operatorStatusSelector.vm.isFailed ? "failed" : "reconnecting"
            }
            reconnectAttempt={operatorStatusSelector.vm.reconnectAttempt}
            maxReconnectAttempts={operatorStatusSelector.vm.maxReconnectAttempts}
            onRetry={operatorStatusSelector.onRetryConnect}
          />
        </>
      }
      context={
        <>
          <SessionFeatureShell sessionLogoutActions={sessionLogoutActions} />
          <CallContextShell
            bindings={callBindings}
            ocpRejectWithBreak={ocpRejectWithBreak}
          />
        </>
      }
      controls={
        isVideoFullscreen ? null : <CallControlsShell bindings={callBindings} />
      }
      overlays={
        <>
          {isVideoFullscreen &&
          fullscreenCallId !== null &&
          fullscreenVideoState !== null ? (
            <VideoFullscreenModal
              open
              callId={fullscreenCallId}
              videoState={fullscreenVideoState}
              line={fullscreenLine}
              onBindSurfaces={callBindings.videoCallActions.bindVideoSurfaces}
              onMute={callBindings.callLinesActions.handleMuteLine}
              onUnmute={callBindings.callLinesActions.handleUnmuteLine}
              onToggleCamera={(callId) => {
                callBindings.videoCallActions.handleToggleCamera(
                  callId,
                  fullscreenVideoState,
                );
              }}
              onToggleScreenShare={(callId) => {
                callBindings.videoCallActions.handleToggleScreenShare(
                  callId,
                  fullscreenVideoState,
                );
              }}
              onSetSessionView={callBindings.videoCallActions.handleSetSessionView}
              onHangup={(callId) => {
                callBindings.exitVideoFullscreen();
                callBindings.callLinesActions.handleHangupLine(callId);
              }}
              onClose={(callId) => {
                callBindings.videoCallActions.handleSetSessionView(callId, "expanded");
              }}
            />
          ) : null}
          <ScreenSharePickerDialog
            open={callBindings.screenSharePicker.open}
            loading={callBindings.screenSharePicker.loading}
            confirming={callBindings.screenSharePicker.confirming}
            errorKey={callBindings.screenSharePicker.errorKey}
            activeKind={callBindings.screenSharePicker.activeKind}
            selectedSourceId={callBindings.screenSharePicker.selectedSourceId}
            sources={callBindings.screenSharePicker.sources}
            onActiveKindChange={callBindings.screenSharePicker.setActiveKind}
            onSelectSource={callBindings.screenSharePicker.selectSource}
            onConfirm={callBindings.screenSharePicker.confirm}
            onCancel={callBindings.screenSharePicker.cancel}
          />
          <IncomingCallOverlayShell
            callBindings={callBindings}
            overlayShell={overlayShell}
            ocpRejectWithBreak={ocpRejectWithBreak}
          />
          <OcpLogoutReasonModal
            open={ocpLogoutModal.modalOpen}
            reasons={ocpLogoutModal.reasons}
            selectedReasonId={ocpLogoutModal.selectedReasonId}
            submitting={ocpLogoutModal.submitting}
            requireReasonSelection={ocpLogoutModal.requireReasonSelection}
            onSelectReason={ocpLogoutModal.handleSelectReason}
            onConfirm={() => {
              void ocpLogoutModal.handleConfirm();
            }}
            onCancel={ocpLogoutModal.handleCancel}
          />
          <OcpSignInProgress
            open={accountActions.ocpSignInModalOpen}
            progress={accountActions.authorizationProgress}
            reconnectEnabled={
              accountActions.authorizationProgress.retryAvailable ||
              accountActions.authorizationProgress.failedExecutionStage !== null
            }
            busy={accountActions.submitting}
            density={overlayShell.settingsOpen ? "comfortable" : "compact"}
            onDisconnect={accountActions.handleOcpSignInDisconnect}
            onReconnect={accountActions.handleOcpSignInReconnect}
            onSuccessSettled={accountActions.handleOcpSignInSuccessSettled}
          />
          <OcpCampaignEventModal
            open={ocpCampaignModal.open}
            campaign={ocpCampaignModal.campaign}
            submitting={ocpCampaignModal.submitting}
            pendingAction={ocpCampaignModal.pendingAction}
            onAccept={() => {
              void ocpCampaignModal.handleAccept();
            }}
            onReject={() => {
              void ocpCampaignModal.handleReject();
            }}
          />
          <OcpRejectBreakReasonModal
            open={ocpRejectWithBreak.modalOpen}
            reasons={ocpRejectWithBreak.reasons}
            selectedReasonId={ocpRejectWithBreak.selectedReasonId}
            submitting={ocpRejectWithBreak.submitting}
            onSelectReason={ocpRejectWithBreak.handleSelectReason}
            onConfirm={() => {
              void ocpRejectWithBreak.handleConfirm();
            }}
            onCancel={ocpRejectWithBreak.handleCancel}
          />
          <SdkConnectCeremonyModal
            view={sdkConnectCeremony.view}
            busy={sdkConnectCeremony.busy}
            onAllowTransport={sdkConnectCeremony.onAllowTransport}
            onDenyTransport={sdkConnectCeremony.onDenyTransport}
            onApprovePairing={sdkConnectCeremony.onApprovePairing}
            onDenyPairing={sdkConnectCeremony.onDenyPairing}
            onCancelWaiting={sdkConnectCeremony.onCancelWaiting}
            onDismiss={sdkConnectCeremony.onDismiss}
            onDeadlineExpired={sdkConnectCeremony.onDeadlineExpired}
          />
          <SdkActivateProfileConsentModal
            pending={activateConsentPending}
            onAllow={(mode) => {
              sdkActivateConsentBridge.settle("allow", mode);
            }}
            onDeny={() => {
              sdkActivateConsentBridge.settle("deny");
            }}
            onDismiss={() => {
              sdkActivateConsentBridge.settle("dismiss");
            }}
          />
          <ShellRouteDataController facade={facade} />
          <HistoryShellRoutePanel facade={facade} notify={notifications.notify} />
          <ContactsShellRoutePanel facade={facade} notify={notifications.notify} />
          <UpdateAvailableBanner
            visible={appUpdate.showUpdatePrompt}
            latestVersion={appUpdate.snapshot.latestVersion}
            onDownload={appUpdate.onOpenDownloadPage}
            onDismiss={appUpdate.onDismissUpdatePrompt}
          />
          <NotificationViewport
            placement={notifications.placement}
            stacking={notifications.stacking}
            durationMs={notifications.durationMs}
            maxVisible={notifications.maxVisible}
            items={notifications.items}
            onDismiss={notifications.dismiss}
          />
          <SettingsFullscreenOverlay
            open={overlayShell.settingsOpen}
            onClose={overlayShell.closeOverlay}
            windowControls={windowControls}
          >
            <SettingsPanel
              activeSection={overlayShell.settingsSection}
              sidebarExpanded={settingsSidebarExpanded}
              sectionAvailability={overlayShell.settingsNavigationAvailability}
              onClose={overlayShell.closeOverlay}
              onSectionChange={overlayShell.setSettingsSection}
              onSidebarExpandedChange={setSettingsSidebarExpanded}
              notificationHistoryQuery={queryNotificationHistory}
              language={settingsActions.userSettings.language}
              onLanguageChange={settingsActions.onLanguageChange}
              theme={settingsActions.userSettings.theme}
              onThemeChange={settingsActions.onThemeChange}
              notificationPlacement={settingsActions.userSettings.notificationPlacement}
              onNotificationPlacementChange={settingsActions.onNotificationPlacementChange}
              notificationStacking={settingsActions.userSettings.notificationStacking}
              onNotificationStackingChange={settingsActions.onNotificationStackingChange}
              notificationDurationMs={settingsActions.userSettings.notificationDurationMs}
              onNotificationDurationMsChange={settingsActions.onNotificationDurationMsChange}
              notificationMaxVisible={settingsActions.userSettings.notificationMaxVisible}
              onNotificationMaxVisibleChange={settingsActions.onNotificationMaxVisibleChange}
              multiSessionsEnabled={multiCallProjection.multiSessionsEnabled}
              onMultiSessionsChange={settingsActions.onMultiSessionsToggle}
              autoAnswerEnabled={settingsActions.userSettings.autoAnswerTimeoutSec !== null}
              autoAnswerTimeoutSec={
                settingsActions.userSettings.autoAnswerTimeoutSec ??
                DEFAULT_AUTO_ANSWER_TIMEOUT_SEC
              }
              onAutoAnswerEnabledChange={settingsActions.onAutoAnswerEnabledToggle}
              onAutoAnswerTimeoutChange={settingsActions.onAutoAnswerTimeoutChange}
              autoAnswerDuringActiveSessionEnabled={
                settingsActions.userSettings.autoAnswerDuringActiveSessionEnabled
              }
              onAutoAnswerDuringActiveSessionChange={
                settingsActions.onAutoAnswerDuringActiveSessionToggle
              }
              currentVersion={appUpdate.snapshot.currentVersion}
              latestVersion={appUpdate.snapshot.latestVersion}
              updateStatusMessage={appUpdate.statusMessage}
              canCheckForUpdates={appUpdate.canCheckForUpdates}
              canOpenDownloadPage={appUpdate.canOpenDownloadPage}
              isCheckingUpdates={appUpdate.isChecking}
              onCheckForUpdates={appUpdate.onCheckForUpdates}
              onOpenDownloadPage={appUpdate.onOpenDownloadPage}
              preferencesTransferBusy={preferencesTransfer.isTransferBusy}
              preferencesTransferStatusMessage={preferencesTransfer.transferStatusMessage}
              onExportPreferences={() => {
                void preferencesTransfer.exportPreferences();
              }}
              onImportPreferences={() => {
                void preferencesTransfer.importPreferences();
              }}
              systemState={{
                shell: sipSystemStateShell,
                ocpShell: ocpSystemState.shell,
                ocpRecoveryActionLoading: ocpSystemState.recoveryActionLoading,
                onOcpRecoveryAction: ocpSystemState.onRecoveryAction,
                sipAutoReconnectEnabled: settingsActions.userSettings.sipAutoReconnectEnabled,
                onSipAutoReconnectChange: settingsActions.onSipAutoReconnectToggle,
                sipReconnectIntervalSec: settingsActions.userSettings.sipReconnectIntervalSec,
                onSipReconnectIntervalChange: settingsActions.onSipReconnectIntervalChange,
                sipReconnectMaxAttempts: settingsActions.userSettings.sipReconnectMaxAttempts,
                onSipReconnectMaxAttemptsChange: settingsActions.onSipReconnectMaxAttemptsChange,
                sipAutoReregisterEnabled: settingsActions.userSettings.sipAutoReregisterEnabled,
                onSipAutoReregisterChange: settingsActions.onSipAutoReregisterToggle,
                sipReregisterIntervalSec: settingsActions.userSettings.sipReregisterIntervalSec,
                onSipReregisterIntervalChange: settingsActions.onSipReregisterIntervalChange,
                sipReregisterMaxAttempts: settingsActions.userSettings.sipReregisterMaxAttempts,
                onSipReregisterMaxAttemptsChange:
                  settingsActions.onSipReregisterMaxAttemptsChange,
                sipAutoRegisterOnStartup: settingsActions.userSettings.sipAutoRegisterOnStartup,
                onSipAutoRegisterOnStartupChange:
                  settingsActions.onSipAutoRegisterOnStartupToggle,
                onManualTransportReconnect: sipSystemStateActions.onManualTransportReconnect,
                onManualReregister: sipSystemStateActions.onManualReregister,
                onClearJournal: sipSystemStateActions.onClearJournal,
                actionLoading: sipSystemStateActions.actionLoading,
              }}
              codecPreferences={settingsActions.userSettings.codecPreferences}
              onAudioCodecEnabledChange={settingsActions.onAudioCodecEnabledChange}
              onVideoCodecEnabledChange={settingsActions.onVideoCodecEnabledChange}
              onAudioCodecReorder={settingsActions.onAudioCodecReorder}
              onVideoCodecReorder={settingsActions.onVideoCodecReorder}
              codecPreferencesError={settingsActions.codecPreferencesError}
              headsetConnectionProjection={settingsActions.headsetConnectionProjection}
              headsetEnabled={settingsActions.headsetEnabled}
              headsetAutoReconnect={settingsActions.headsetAutoReconnect}
              preferredDeviceId={settingsActions.preferredDeviceId}
              grantedDevices={settingsActions.grantedDevices}
              onHeadsetEnabledChange={settingsActions.onHeadsetEnabledChange}
              onHeadsetAutoReconnectChange={settingsActions.onHeadsetAutoReconnectChange}
              onConnectHeadset={settingsActions.onConnectHeadset}
              onDisconnectHeadset={settingsActions.onDisconnectHeadset}
              preferredAudioInputDeviceId={settingsActions.preferredAudioInputDeviceId}
              preferredVideoInputDeviceId={settingsActions.preferredVideoInputDeviceId}
              defaultSessionView={settingsActions.defaultSessionView}
              autoFullscreenOnConference={settingsActions.autoFullscreenOnConference}
              conferenceNumberSubstring={settingsActions.conferenceNumberSubstring}
              enableLocalVideoAfterConnect={settingsActions.enableLocalVideoAfterConnect}
              videoAudioDevices={videoSettingsPanel.audioDevices}
              videoCameraDevices={videoSettingsPanel.videoDevices}
              videoDevicesLoading={videoSettingsPanel.devicesLoading}
              videoDevicesError={videoSettingsPanel.devicesError}
              videoPreviewError={videoSettingsPanel.previewError}
              videoPreviewRef={videoSettingsPanel.previewVideoRef}
              onPreferredAudioInputDeviceIdChange={
                settingsActions.onPreferredAudioInputDeviceIdChange
              }
              onPreferredVideoInputDeviceIdChange={
                settingsActions.onPreferredVideoInputDeviceIdChange
              }
              onDefaultSessionViewChange={settingsActions.onDefaultSessionViewChange}
              onAutoFullscreenOnConferenceChange={
                settingsActions.onAutoFullscreenOnConferenceChange
              }
              onConferenceNumberSubstringChange={
                settingsActions.onConferenceNumberSubstringChange
              }
              onEnableLocalVideoAfterConnectChange={
                settingsActions.onEnableLocalVideoAfterConnectChange
              }
              onRefreshVideoDevices={videoSettingsPanel.refreshDevices}
              integrations={{
                ocp: {
                  settings: ocpSettingsPanel.settings,
                  activeLoginLabel: ocpSettingsPanel.activeLoginLabel,
                  errorKey: ocpSettingsPanel.errorKey,
                  configEditable: ocpSettingsPanel.configEditable,
                  onEnabledChange: ocpSettingsPanel.onEnabledChange,
                  onDomainChange: ocpSettingsPanel.onDomainChange,
                  onAutoConnectChange: ocpSettingsPanel.onAutoConnectChange,
                },
                sdk: {
                  settings: sdkSettingsPanel.settings,
                  diagnostics: sdkSettingsPanel.diagnostics,
                  allowedOriginsLive: sdkSettingsPanel.allowedOriginsLive,
                  pairedClients: sdkSettingsPanel.pairedClients,
                  addOriginDraft: sdkSettingsPanel.addOriginDraft,
                  errorKey: sdkSettingsPanel.errorKey,
                  busy: sdkSettingsPanel.busy,
                  onAddOriginDraftChange: sdkSettingsPanel.onAddOriginDraftChange,
                  onAddOrigin: sdkSettingsPanel.onAddOrigin,
                  onRefresh: sdkSettingsPanel.onRefresh,
                  onRevokeClient: sdkSettingsPanel.onRevokeClient,
                  onUnblockOrigin: sdkSettingsPanel.onUnblockOrigin,
                  onBlacklistOrigin: sdkSettingsPanel.onBlacklistOrigin,
                  onRemoveAllowedOrigin: sdkSettingsPanel.onRemoveAllowedOrigin,
                  onRenameAllowedOrigin: sdkSettingsPanel.onRenameAllowedOrigin,
                  onSetOriginMatrix: sdkSettingsPanel.onSetOriginMatrix,
                  onOperatorModalTimeoutsChange:
                    sdkSettingsPanel.onOperatorModalTimeoutsChange,
                },
                externalServices: {
                  collectionsView: externalServicesPanel.collectionsView,
                  requestsView: externalServicesPanel.requestsView,
                  requestEditor: externalServicesPanel.requestEditor,
                  variablesDialog: externalServicesPanel.variablesDialog,
                },
              }}
              account={{
                form: accountActions.form,
                ocpDraft: accountActions.ocpDraft,
                signInMode: accountActions.signInMode,
                submitting: accountActions.submitting,
                error: accountActions.error,
                successKey: accountActions.successKey,
                warningKey: accountActions.warningKey,
                panelMode: accountActions.panelMode,
                disabled: blockingAuthState,
                authorizeDisabledReason: accountAuthorizeDisabledReason,
                savedProfileOptions: accountActions.savedProfileOptions,
                selectedProfileId: accountActions.selectedProfileId,
                saveProfileChecked: accountActions.saveProfileChecked,
                saveProfileDisabled: accountActions.saveProfileDisabled,
                saveProfileDisabledReasonKey: accountActions.saveProfileDisabledReasonKey,
                rememberPasswordChecked: accountActions.rememberPasswordChecked,
                passwordFieldVisible: accountActions.passwordFieldVisible,
                rememberPasswordVisible: accountActions.rememberPasswordVisible,
                rememberPasswordDisabled: accountActions.rememberPasswordDisabled,
                passwordHintKey: accountActions.passwordHintKey,
                showOcpDomainField: accountActions.showOcpDomainField,
                showOcpApiKeyField: accountActions.showOcpApiKeyField,
                hasSavedOcpApiKey: accountActions.hasSavedOcpApiKey,
                allowedRecoveryActions: accountActions.allowedRecoveryActions,
                onRecoveryAction: accountActions.handleRecoveryAction,
                canForgetSavedSipPassword:
                  accountActions.canForgetSavedSipPassword,
                onForgetSavedSipPassword:
                  accountActions.forgetSavedSipPassword,
                deleteConfirmationOpen: accountActions.deleteConfirmationOpen,
                deleteSubmitting: accountActions.deleteSubmitting,
                passwordInputRef: accountActions.passwordInputRef,
                onFieldChange: accountActions.updateField,
                onOcpFieldChange: accountActions.updateOcpField,
                onSignInModeChange: accountActions.setSignInMode,
                onSubmit: accountActions.handleSubmit,
                onProfileSelect: accountActions.selectProfile,
                onSaveProfileChange: accountActions.setSaveProfileChecked,
                onRememberPasswordChange: accountActions.setRememberPasswordChecked,
                onDeleteProfileRequest: accountActions.requestDeleteSelectedProfile,
                onDeleteProfileConfirm: accountActions.confirmDeleteSelectedProfile,
                onDeleteProfileCancel: accountActions.cancelDeleteSelectedProfile,
                overwriteConfirmationOpen: accountActions.overwriteConfirmationOpen,
                draftDiscardConfirmationOpen:
                  accountActions.draftDiscardConfirmationOpen,
                onDraftDiscardConfirm:
                  accountActions.confirmDiscardDraftAndSelectProfile,
                onDraftDiscardCancel: accountActions.cancelDiscardDraft,
                onOverwriteCredentialsConfirm:
                  accountActions.confirmOverwriteExistingCredentials,
                onOverwriteCredentialsContinue:
                  accountActions.continueWithoutOverwritingCredentials,
                onOverwriteCredentialsCancel:
                  accountActions.cancelOverwriteExistingCredentials,
              }}
            />
          </SettingsFullscreenOverlay>
          <ShellRoutePanelOutlet />
        </>
      }
    />
  );
}
