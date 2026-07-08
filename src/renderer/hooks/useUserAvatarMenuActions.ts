import { useCallback } from "react";
import type { AuthUiState } from "@application/projections/settings/accountBootstrapProjection.js";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { PhoneStatus } from "@application/index.js";
import { mapAvatarMenuDndDisabledReason } from "../helpers/mapAvatarMenuDndDisabledReason.js";
import { mapAvatarMenuLogoutDisabledReason } from "../helpers/mapAvatarMenuLogoutDisabledReason.js";
import { mapAvatarMenuShellNavigationDisabledReason } from "../helpers/mapAvatarMenuShellNavigationDisabledReason.js";
import type { UseSessionLogoutActionsResult } from "./useSessionLogoutActions.js";
import { usePhoneStatusActions } from "./usePhoneStatusActions.js";

type UseUserAvatarMenuActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  phoneStatus: PhoneStatus;
  phoneStatusDisabled: boolean;
  isSipRegistered: boolean;
  isOcpMode: boolean;
  authUiState: AuthUiState;
  sessionLogoutActions: UseSessionLogoutActionsResult;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onOpenContacts: () => void;
  onMenuClose: () => void;
}>;

export type UseUserAvatarMenuActionsResult = Readonly<{
  dndEnabled: boolean;
  dndDisabledReason: string | null;
  historyDisabledReason: string | null;
  contactsDisabledReason: string | null;
  logoutDisabledReason: string | null;
  handleOpenSettings: () => void;
  handleOpenHistory: () => void;
  handleOpenContacts: () => void;
  handleToggleDnd: () => void;
  handleLogout: () => void;
}>;

/**
 * - Purpose: bind avatar menu items to settings, DND, and session logout actions.
 * - Inputs: facade, phone status, session logout shell, menu close callback.
 * - Outputs: menu item handlers and disabled reasons for presentation.
 */
export function useUserAvatarMenuActions(
  input: UseUserAvatarMenuActionsInput,
): UseUserAvatarMenuActionsResult {
  const {
    facade,
    phoneStatus,
    phoneStatusDisabled,
    isSipRegistered,
    isOcpMode,
    authUiState,
    sessionLogoutActions,
    onOpenSettings,
    onOpenHistory,
    onOpenContacts,
    onMenuClose,
  } = input;

  const dndDisabledReason = mapAvatarMenuDndDisabledReason({
    phoneStatusDisabled,
    isSipRegistered,
  });

  const shellNavigationDisabledReason = mapAvatarMenuShellNavigationDisabledReason({
    isSipRegistered,
    authUiState,
  });

  const { handlePhoneStatusChange } = usePhoneStatusActions({
    facade,
    disabled: dndDisabledReason !== null,
  });

  const dndEnabled = phoneStatus === "dnd";
  const logoutDisabledReason = mapAvatarMenuLogoutDisabledReason({
    isOcpMode,
    authUiState,
    shell: sessionLogoutActions.shell,
  });

  const handleOpenSettings = useCallback((): void => {
    onMenuClose();
    onOpenSettings();
  }, [onMenuClose, onOpenSettings]);

  const handleOpenHistory = useCallback((): void => {
    if (shellNavigationDisabledReason !== null) {
      return;
    }

    onMenuClose();
    onOpenHistory();
  }, [onMenuClose, onOpenHistory, shellNavigationDisabledReason]);

  const handleOpenContacts = useCallback((): void => {
    if (shellNavigationDisabledReason !== null) {
      return;
    }

    onMenuClose();
    onOpenContacts();
  }, [onMenuClose, onOpenContacts, shellNavigationDisabledReason]);

  const handleToggleDnd = useCallback((): void => {
    if (dndDisabledReason !== null) {
      return;
    }

    handlePhoneStatusChange(dndEnabled ? "online" : "dnd");
    onMenuClose();
  }, [dndDisabledReason, dndEnabled, handlePhoneStatusChange, onMenuClose]);

  const handleLogout = useCallback((): void => {
    if (logoutDisabledReason !== null) {
      return;
    }

    onMenuClose();
    sessionLogoutActions.handleEndSession();
  }, [logoutDisabledReason, onMenuClose, sessionLogoutActions]);

  return {
    dndEnabled,
    dndDisabledReason,
    historyDisabledReason: shellNavigationDisabledReason,
    contactsDisabledReason: shellNavigationDisabledReason,
    logoutDisabledReason,
    handleOpenSettings,
    handleOpenHistory,
    handleOpenContacts,
    handleToggleDnd,
    handleLogout,
  };
}
