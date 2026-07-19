/**
 * - Purpose: bind Settings → Integrations → OCP Module card to active-profile edit APIs.
 * - Inputs: AccountBootstrapFacade, refresh active UserSettings snapshot.
 * - Outputs: presentational props for edit-only OcpModuleSettingsCard; no SIP/Electron.
 */

import { useCallback, useEffect, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  deriveOcpModuleEditShell,
  OCP_INTEGRATION_DEFAULTS,
  type OcpIntegrationSettings,
  type UserSettings,
} from "@application/index.js";
import type { OcpSessionProjection } from "@application/projections/integration/ocpSessionProjection.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import { useAuthShellFlags } from "./useAuthShellFlags.js";

export type OcpSettingsPanelErrorKey =
  | "settings.integrations.ocp.error.domainRequired"
  | "settings.integrations.ocp.error.saveFailed";

export type UseOcpSettingsPanelResult = Readonly<{
  settings: OcpIntegrationSettings;
  session: OcpSessionProjection;
  activeLoginLabel: string | null;
  errorKey: OcpSettingsPanelErrorKey | null;
  configEditable: boolean;
  openAccountForRecoveryVisible: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onDomainChange: (domain: string) => void;
  onAutoConnectChange: (autoConnect: boolean) => void;
  onOpenAccountForRecovery: () => void;
}>;

type UseOcpSettingsPanelInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  onActiveUserSettingsRefresh: (settings: UserSettings) => void;
  onOpenAccountSettings: () => void;
}>;

/**
 * - Purpose: orchestrate active-profile OCP configuration editing (ADR-AF-003 edit-only).
 * - API key is acquired during OCP authorization, not edited in Integrations.
 */
export function useOcpSettingsPanel(
  input: UseOcpSettingsPanelInput,
): UseOcpSettingsPanelResult {
  const { facade, onActiveUserSettingsRefresh, onOpenAccountSettings } = input;
  const session = useAccountBootstrapStore((state) => state.ocpSessionProjection);
  const { hasActiveAccountSession } = useAuthShellFlags();
  const [settings, setSettings] = useState<OcpIntegrationSettings>(OCP_INTEGRATION_DEFAULTS);
  const [activeLoginLabel, setActiveLoginLabel] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<OcpSettingsPanelErrorKey | null>(null);

  const editShell = deriveOcpModuleEditShell({
    hasActiveAccountSession,
  });

  const refreshActiveSettings = useCallback(async (): Promise<void> => {
    if (facade === null) {
      return;
    }
    const result = await facade.getUserSettingsForAccount();
    if (result.ok) {
      onActiveUserSettingsRefresh(result.value);
    }
  }, [facade, onActiveUserSettingsRefresh]);

  const loadActivePanel = useCallback(async (): Promise<void> => {
    if (facade === null) {
      setSettings(OCP_INTEGRATION_DEFAULTS);
      setActiveLoginLabel(null);
      return;
    }
    const settingsResult = await facade.getUserSettingsForAccount();
    if (!settingsResult.ok) {
      setErrorKey("settings.integrations.ocp.error.saveFailed");
      return;
    }
    setErrorKey(null);
    setSettings(settingsResult.value.ocpIntegration);
    const activeAccount = await facade.getActiveSipAccount();
    const username = activeAccount?.username.trim() ?? "";
    setActiveLoginLabel(username.length > 0 ? username : null);
  }, [facade]);

  useEffect(() => {
    void loadActivePanel();
  }, [loadActivePanel]);

  // Re-load when local account session activates so Integrations binds the active bucket.
  useEffect(() => {
    if (!hasActiveAccountSession) {
      return;
    }
    void loadActivePanel();
  }, [hasActiveAccountSession, loadActivePanel]);

  const persistOcpSettings = useCallback(
    async (next: OcpIntegrationSettings): Promise<boolean> => {
      if (facade === null || !editShell.configEditable) {
        return false;
      }
      const result = await facade.updateOcpSettings(next);
      if (!result.ok) {
        setErrorKey("settings.integrations.ocp.error.saveFailed");
        return false;
      }
      setErrorKey(null);
      setSettings(result.value.ocpIntegration);
      await refreshActiveSettings();
      return true;
    },
    [editShell.configEditable, facade, refreshActiveSettings],
  );

  const onEnabledChange = useCallback(
    (enabled: boolean): void => {
      void persistOcpSettings({ ...settings, enabled });
    },
    [persistOcpSettings, settings],
  );

  const onDomainChange = useCallback(
    (domain: string): void => {
      void persistOcpSettings({ ...settings, domain });
    },
    [persistOcpSettings, settings],
  );

  const onAutoConnectChange = useCallback(
    (autoConnect: boolean): void => {
      void persistOcpSettings({ ...settings, autoConnect });
    },
    [persistOcpSettings, settings],
  );

  const onOpenAccountForRecovery = useCallback((): void => {
    onOpenAccountSettings();
  }, [onOpenAccountSettings]);

  return {
    settings,
    session,
    activeLoginLabel,
    errorKey,
    configEditable: editShell.configEditable,
    openAccountForRecoveryVisible: editShell.openAccountForRecoveryVisible,
    onEnabledChange,
    onDomainChange,
    onAutoConnectChange,
    onOpenAccountForRecovery,
  };
}

export type OcpServerStatusTranslationKey =
  | "account.server.status.disconnected"
  | "account.server.status.connecting"
  | "account.server.status.connected"
  | "account.server.status.reconnecting"
  | "account.server.status.failed";

export type OcpAuthorizationStatusTranslationKey =
  | "account.authorization.status.idle"
  | "account.authorization.status.pending"
  | "account.authorization.status.authorized"
  | "account.authorization.status.timeout"
  | "account.authorization.status.rejected";

export function resolveOcpServerStatusLabelKey(
  serverState: OcpSessionProjection["serverState"],
): OcpServerStatusTranslationKey {
  switch (serverState) {
    case "connecting":
      return "account.server.status.connecting";
    case "connected":
      return "account.server.status.connected";
    case "reconnecting":
      return "account.server.status.reconnecting";
    case "failed":
      return "account.server.status.failed";
    default:
      return "account.server.status.disconnected";
  }
}

export function resolveOcpAuthorizationStatusLabelKey(
  authorizationState: OcpSessionProjection["authorizationState"],
): OcpAuthorizationStatusTranslationKey {
  switch (authorizationState.phase) {
    case "pending":
      return "account.authorization.status.pending";
    case "authorized":
      return "account.authorization.status.authorized";
    case "timeout":
      return "account.authorization.status.timeout";
    case "rejected":
      return "account.authorization.status.rejected";
    default:
      return "account.authorization.status.idle";
  }
}
