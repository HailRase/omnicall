import { useEffect, useRef } from "react";
import type {
  ActiveCallControlsProjection,
  OcpToastItem,
} from "@application/index.js";
import type { AccountAuthorizationErrorProjection } from "@application/projections/mapAccountAuthorizationError.js";
import type { TranslationKey } from "../i18n/messages.js";
import type {
  NotificationDescriptor,
  UseNotificationsResult,
} from "./useNotifications.js";

type NotificationApi = Pick<
  UseNotificationsResult,
  "notify" | "dismiss"
>;

type UseActionNotificationsInput = Readonly<{
  notifications: NotificationApi;
  accountFeedback: Readonly<{
    error: AccountAuthorizationErrorProjection | null;
    successKey: TranslationKey | null;
    warningKey: TranslationKey | null;
  }>;
  callControls: Readonly<{
    projection: ActiveCallControlsProjection;
    onRetry: () => void;
  }>;
  dtmfError: string | null;
  transferFailure: string | null;
  logoutErrorMessage: string | null;
  settingsUpdateError: string | null;
  sipActionSuccessKey: TranslationKey | null;
  sipActionErrorText: string | null;
  statusRejectionBanner: string | null;
  ocpToasts: ReadonlyArray<OcpToastItem>;
  appUpdate: Readonly<{
    showPrompt: boolean;
    latestVersion: string | undefined;
    onDownload: () => void;
    onDismiss: () => void;
  }>;
}>;

function buildAccountErrorDescriptor(
  error: AccountAuthorizationErrorProjection,
): NotificationDescriptor {
  if (error.params !== undefined) {
    return {
      id: `account-error-${error.key}`,
      level: "error",
      messageKey: error.key,
      messageParams: error.params,
    };
  }
  return {
    id: `account-error-${error.key}`,
    level: "error",
    messageKey: error.key,
  };
}

/**
 * - Purpose: bridge action outcome sources into unified renderer notifications.
 * - Inputs: action feedback projections and callbacks from feature hooks.
 * - Outputs: side effects that enqueue deduplicated global notifications.
 */
export function useActionNotifications(input: UseActionNotificationsInput): void {
  const {
    notifications,
    accountFeedback,
    callControls,
    dtmfError,
    transferFailure,
    logoutErrorMessage,
    settingsUpdateError,
    sipActionSuccessKey,
    sipActionErrorText,
    statusRejectionBanner,
    ocpToasts,
    appUpdate,
  } = input;
  const seenCallErrorRef = useRef<string | null>(null);
  const seenDtmfErrorRef = useRef<string | null>(null);
  const seenTransferErrorRef = useRef<string | null>(null);
  const seenLogoutErrorRef = useRef<string | null>(null);
  const seenSettingsErrorRef = useRef<string | null>(null);
  const seenSipSuccessRef = useRef<TranslationKey | null>(null);
  const seenSipErrorRef = useRef<string | null>(null);
  const seenStatusErrorRef = useRef<string | null>(null);
  const seenUpdateVersionRef = useRef<string | null>(null);

  useEffect(() => {
    if (accountFeedback.successKey !== null) {
      notifications.notify({
        id: `account-success-${accountFeedback.successKey}`,
        level: "success",
        messageKey: accountFeedback.successKey,
      });
    }
  }, [accountFeedback.successKey, notifications]);

  useEffect(() => {
    if (accountFeedback.warningKey !== null) {
      notifications.notify({
        id: `account-warning-${accountFeedback.warningKey}`,
        level: "warning",
        messageKey: accountFeedback.warningKey,
      });
    }
  }, [accountFeedback.warningKey, notifications]);

  useEffect(() => {
    if (accountFeedback.error === null) {
      return;
    }
    notifications.notify(buildAccountErrorDescriptor(accountFeedback.error));
  }, [accountFeedback.error, notifications]);

  useEffect(() => {
    const error = callControls.projection.lastOperationError;
    if (error === null) {
      seenCallErrorRef.current = null;
      return;
    }
    const signature = `${error.operation}|${error.message}`;
    if (seenCallErrorRef.current === signature) {
      return;
    }
    seenCallErrorRef.current = signature;
    notifications.notify({
      id: `call-op-${signature}`,
      level: "error",
      messageText: error.message,
      action: {
        id: `retry-call-${error.operation}`,
        labelKey: "common.retry",
        onClick: callControls.onRetry,
      },
    });
  }, [callControls, notifications]);

  useEffect(() => {
    if (dtmfError === null) {
      seenDtmfErrorRef.current = null;
      return;
    }
    if (seenDtmfErrorRef.current === dtmfError) {
      return;
    }
    seenDtmfErrorRef.current = dtmfError;
    notifications.notify({
      id: `dtmf-error-${dtmfError}`,
      level: "error",
      messageText: dtmfError,
    });
  }, [dtmfError, notifications]);

  useEffect(() => {
    if (transferFailure === null) {
      seenTransferErrorRef.current = null;
      return;
    }
    if (seenTransferErrorRef.current === transferFailure) {
      return;
    }
    seenTransferErrorRef.current = transferFailure;
    notifications.notify({
      id: `transfer-error-${transferFailure}`,
      level: "error",
      messageText: transferFailure,
    });
  }, [notifications, transferFailure]);

  useEffect(() => {
    if (logoutErrorMessage === null) {
      seenLogoutErrorRef.current = null;
      return;
    }
    if (seenLogoutErrorRef.current === logoutErrorMessage) {
      return;
    }
    seenLogoutErrorRef.current = logoutErrorMessage;
    notifications.notify({
      id: `logout-error-${logoutErrorMessage}`,
      level: "error",
      messageText: logoutErrorMessage,
    });
  }, [logoutErrorMessage, notifications]);

  useEffect(() => {
    if (settingsUpdateError === null) {
      seenSettingsErrorRef.current = null;
      return;
    }
    if (seenSettingsErrorRef.current === settingsUpdateError) {
      return;
    }
    seenSettingsErrorRef.current = settingsUpdateError;
    notifications.notify({
      id: `settings-error-${settingsUpdateError}`,
      level: "error",
      messageText: settingsUpdateError,
    });
  }, [notifications, settingsUpdateError]);

  useEffect(() => {
    if (sipActionSuccessKey === null) {
      seenSipSuccessRef.current = null;
      return;
    }
    if (seenSipSuccessRef.current === sipActionSuccessKey) {
      return;
    }
    seenSipSuccessRef.current = sipActionSuccessKey;
    notifications.notify({
      id: `sip-success-${sipActionSuccessKey}`,
      level: "success",
      messageKey: sipActionSuccessKey,
    });
  }, [notifications, sipActionSuccessKey]);

  useEffect(() => {
    if (sipActionErrorText === null) {
      seenSipErrorRef.current = null;
      return;
    }
    if (seenSipErrorRef.current === sipActionErrorText) {
      return;
    }
    seenSipErrorRef.current = sipActionErrorText;
    notifications.notify({
      id: `sip-error-${sipActionErrorText}`,
      level: "error",
      messageText: sipActionErrorText,
    });
  }, [notifications, sipActionErrorText]);

  useEffect(() => {
    if (statusRejectionBanner === null) {
      seenStatusErrorRef.current = null;
      return;
    }
    if (seenStatusErrorRef.current === statusRejectionBanner) {
      return;
    }
    seenStatusErrorRef.current = statusRejectionBanner;
    notifications.notify({
      id: `status-rejection-${statusRejectionBanner}`,
      level: "error",
      messageText: statusRejectionBanner,
    });
  }, [notifications, statusRejectionBanner]);

  useEffect(() => {
    ocpToasts.forEach((toast) => {
      notifications.notify({
        id: `ocp-${toast.id}`,
        level: toast.level === "warn" ? "warning" : toast.level,
        messageText: toast.message,
      });
    });
  }, [notifications, ocpToasts]);

  useEffect(() => {
    if (!appUpdate.showPrompt) {
      if (appUpdate.latestVersion !== undefined) {
        notifications.dismiss(`update-${appUpdate.latestVersion}`);
      }
      return;
    }
    const version = appUpdate.latestVersion ?? "available";
    if (seenUpdateVersionRef.current === version) {
      return;
    }
    seenUpdateVersionRef.current = version;
    notifications.notify({
      id: `update-${version}`,
      level: "info",
      messageKey: "updates.prompt.message",
      messageParams: { latestVersion: appUpdate.latestVersion },
      durationMs: 0,
      action: {
        id: "update-download",
        labelKey: "updates.prompt.download",
        onClick: appUpdate.onDownload,
      },
      onClose: appUpdate.onDismiss,
    });
  }, [appUpdate, notifications]);
}
