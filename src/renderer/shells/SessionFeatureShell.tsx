import type { JSX } from "react";
import chromeTextStyles from "../components/shell/ShellChromeText.module.css";
import { LogoutActiveSessionConfirmationModal } from "../components/session/LogoutActiveSessionConfirmationModal.js";
import type { UseSessionLogoutActionsResult } from "../hooks/useSessionLogoutActions.js";
import { useI18n } from "../i18n/index.js";

type SessionFeatureShellProps = Readonly<{
  sessionLogoutActions: UseSessionLogoutActionsResult;
}>;

/**
 * - Purpose: compose SIP session logout banner and confirmation modal.
 * - Inputs: session logout actions from shell chrome hook.
 * - Outputs: logout error banner and confirmation dialog.
 */
export function SessionFeatureShell({
  sessionLogoutActions,
}: SessionFeatureShellProps): JSX.Element {
  const { t } = useI18n();
  return (
    <>
      {sessionLogoutActions.shell.showLogoutErrorBanner && (
        <p className={chromeTextStyles.error} role="alert" data-testid="logout-error-banner">
          {sessionLogoutActions.shell.logoutErrorMessage}
          <button
            type="button"
            aria-label={t("common.retry")}
            onClick={sessionLogoutActions.handleRetryLogout}
          >
            {t("common.retry")}
          </button>
        </p>
      )}

      <LogoutActiveSessionConfirmationModal
        open={sessionLogoutActions.confirmationModalOpen}
        onConfirm={sessionLogoutActions.handleConfirmLogout}
        onCancel={sessionLogoutActions.handleCancelLogout}
      />
    </>
  );
}
