import { useCallback, useMemo, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  deriveSessionLogoutShell,
  type SessionLogoutProjectionInput,
} from "@application/projections/platform/deriveSessionLogoutShell.js";
import { isErr } from "@shared/result/index.js";

type UseSessionLogoutActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  shellInput: SessionLogoutProjectionInput;
}>;

export type UseSessionLogoutActionsResult = Readonly<{
  shell: ReturnType<typeof deriveSessionLogoutShell>;
  confirmationModalOpen: boolean;
  handleEndSession: () => void;
  handleConfirmLogout: () => void;
  handleCancelLogout: () => void;
  handleRetryLogout: () => void;
}>;

/**
 * - Purpose: bind SIP-only end-session control to EndUserSessionUseCase (LF-079).
 * - Inputs: facade and projection-derived shell input.
 * - Outputs: shell flags, confirmation modal state, and logout callbacks.
 */
export function useSessionLogoutActions(
  input: UseSessionLogoutActionsInput,
): UseSessionLogoutActionsResult {
  const { facade, shellInput } = input;
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [logoutInProgress, setLogoutInProgress] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const shell = useMemo(
    () =>
      deriveSessionLogoutShell({
        ...shellInput,
        logoutInProgress,
        logoutError,
      }),
    [shellInput, logoutInProgress, logoutError],
  );

  const executeLogout = useCallback(async (): Promise<void> => {
    if (facade === null) {
      return;
    }

    setLogoutInProgress(true);
    setLogoutError(null);

    const result = await facade.endUserSessionCommand();

    setLogoutInProgress(false);

    if (isErr(result)) {
      setLogoutError(result.error.message);
    }
  }, [facade]);

  const handleEndSession = useCallback((): void => {
    if (shell.endSessionDisabledReason !== null) {
      return;
    }

    if (shell.logoutConfirmationRequired) {
      setConfirmationModalOpen(true);
      return;
    }

    void executeLogout();
  }, [executeLogout, shell.endSessionDisabledReason, shell.logoutConfirmationRequired]);

  const handleConfirmLogout = useCallback((): void => {
    setConfirmationModalOpen(false);
    void executeLogout();
  }, [executeLogout]);

  const handleCancelLogout = useCallback((): void => {
    setConfirmationModalOpen(false);
  }, []);

  const handleRetryLogout = useCallback((): void => {
    void executeLogout();
  }, [executeLogout]);

  return {
    shell,
    confirmationModalOpen,
    handleEndSession,
    handleConfirmLogout,
    handleCancelLogout,
    handleRetryLogout,
  };
}
