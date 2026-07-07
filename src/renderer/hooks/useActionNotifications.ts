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
 * - Outputs: side effects that enqueue global notifications for every action outcome.
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
  const { notify, dismiss } = notifications;
  const {
    projection: callControlsProjection,
    onRetry: retryCallOperation,
  } = callControls;
  const {
    showPrompt: showUpdatePrompt,
    latestVersion: latestUpdateVersion,
    onDownload: onUpdateDownload,
    onDismiss: onUpdateDismiss,
  } = appUpdate;

  const seenUpdateVersionRef = useRef<string | null>(null);

  const accountError = accountFeedback.error;
  const lastOperationError = callControlsProjection.lastOperationError;

  useEffect(() => {
    if (accountFeedback.successKey === null) {
      return;
    }
    notify({
      level: "success",
      messageKey: accountFeedback.successKey,
    });
  }, [accountFeedback.successKey, notify]);

  useEffect(() => {
    if (accountFeedback.warningKey === null) {
      return;
    }
    notify({
      level: "warning",
      messageKey: accountFeedback.warningKey,
    });
  }, [accountFeedback.warningKey, notify]);

  useEffect(() => {
    if (accountError === null) {
      return;
    }
    const { id: _accountErrorId, ...descriptor } = buildAccountErrorDescriptor(accountError);
    notify(descriptor);
  }, [accountError, notify]);

  useEffect(() => {
    if (lastOperationError === null) {
      return;
    }
    notify({
      level: "error",
      messageText: lastOperationError.message,
      action: {
        id: `retry-call-${lastOperationError.operation}`,
        labelKey: "common.retry",
        onClick: retryCallOperation,
      },
    });
  }, [lastOperationError, notify, retryCallOperation]);

  useEffect(() => {
    if (dtmfError === null) {
      return;
    }
    notify({
      level: "error",
      messageText: dtmfError,
    });
  }, [dtmfError, notify]);

  useEffect(() => {
    if (transferFailure === null) {
      return;
    }
    notify({
      level: "error",
      messageText: transferFailure,
    });
  }, [notify, transferFailure]);

  useEffect(() => {
    if (logoutErrorMessage === null) {
      return;
    }
    notify({
      level: "error",
      messageText: logoutErrorMessage,
    });
  }, [logoutErrorMessage, notify]);

  useEffect(() => {
    if (settingsUpdateError === null) {
      return;
    }
    notify({
      level: "error",
      messageText: settingsUpdateError,
    });
  }, [notify, settingsUpdateError]);

  useEffect(() => {
    if (sipActionSuccessKey === null) {
      return;
    }
    notify({
      level: "success",
      messageKey: sipActionSuccessKey,
    });
  }, [notify, sipActionSuccessKey]);

  useEffect(() => {
    if (sipActionErrorText === null) {
      return;
    }
    notify({
      level: "error",
      messageText: sipActionErrorText,
    });
  }, [notify, sipActionErrorText]);

  useEffect(() => {
    if (statusRejectionBanner === null) {
      return;
    }
    notify({
      level: "error",
      messageText: statusRejectionBanner,
    });
  }, [notify, statusRejectionBanner]);

  useEffect(() => {
    ocpToasts.forEach((toast) => {
      notify({
        level: toast.level === "warn" ? "warning" : toast.level,
        messageText: toast.message,
      });
    });
  }, [notify, ocpToasts]);

  useEffect(() => {
    if (!showUpdatePrompt) {
      seenUpdateVersionRef.current = null;
      if (latestUpdateVersion !== undefined) {
        dismiss(`update-${latestUpdateVersion}`);
      }
      return;
    }
    const version = latestUpdateVersion ?? "available";
    if (seenUpdateVersionRef.current === version) {
      return;
    }
    seenUpdateVersionRef.current = version;
    notify({
      id: `update-${version}`,
      level: "info",
      messageKey: "updates.prompt.message",
      messageParams: { latestVersion: latestUpdateVersion },
      durationMs: 0,
      closable: true,
      action: {
        id: "update-download",
        labelKey: "updates.prompt.download",
        onClick: onUpdateDownload,
      },
      onClose: onUpdateDismiss,
    });
  }, [dismiss, latestUpdateVersion, notify, onUpdateDismiss, onUpdateDownload, showUpdatePrompt]);
}
