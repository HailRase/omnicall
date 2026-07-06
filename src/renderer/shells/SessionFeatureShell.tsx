import type { JSX } from "react";
import { LogoutActiveSessionConfirmationModal } from "../components/session/LogoutActiveSessionConfirmationModal.js";
import type { UseSessionLogoutActionsResult } from "../hooks/useSessionLogoutActions.js";

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
  return (
    <>
      <LogoutActiveSessionConfirmationModal
        open={sessionLogoutActions.confirmationModalOpen}
        onConfirm={sessionLogoutActions.handleConfirmLogout}
        onCancel={sessionLogoutActions.handleCancelLogout}
      />
    </>
  );
}
