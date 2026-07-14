/**
 * - Purpose: bind Settings → Integrations → OCP Module card to facade + session projection.
 * - Inputs: AccountBootstrapFacade, ocpIntegration from loaded UserSettings, setUserSettings.
 * - Outputs: presentational props for OcpModuleSettingsCard; no SIP/Electron.
 */

import { useCallback, useEffect, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type {
  OcpIntegrationSettings,
  UserSettings,
} from "@application/index.js";
import type { OcpSessionProjection } from "@application/projections/integration/ocpSessionProjection.js";
import type { TranslationKey } from "../i18n/messages.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";

export type OcpSettingsPanelErrorKey =
  | "settings.integrations.ocp.error.domainRequired"
  | "settings.integrations.ocp.error.tokenRequired"
  | "settings.integrations.ocp.error.saveFailed"
  | "settings.integrations.ocp.error.connectFailed";

export type UseOcpSettingsPanelResult = Readonly<{
  settings: OcpIntegrationSettings;
  session: OcpSessionProjection;
  tokenDraft: string;
  tokenVisible: boolean;
  hasSavedToken: boolean;
  actionLoading: "save-token" | "delete-token" | "connect" | "disconnect" | null;
  errorKey: OcpSettingsPanelErrorKey | null;
  onEnabledChange: (enabled: boolean) => void;
  onDomainChange: (domain: string) => void;
  onAutoConnectChange: (autoConnect: boolean) => void;
  onAutoSipAuthChange: (autoSipAuth: boolean) => void;
  onTokenDraftChange: (token: string) => void;
  onTokenVisibleChange: (visible: boolean) => void;
  onSaveToken: () => void;
  onDeleteToken: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
}>;

type UseOcpSettingsPanelInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  userSettings: UserSettings;
  onUserSettingsChange: (settings: UserSettings) => void;
}>;

function resolveActionErrorKey(code: string | undefined): OcpSettingsPanelErrorKey {
  if (code === "auth_token_required") {
    return "settings.integrations.ocp.error.tokenRequired";
  }
  if (code === "domain_required" || code === "ocpIntegration_invalid") {
    return "settings.integrations.ocp.error.domainRequired";
  }
  return "settings.integrations.ocp.error.connectFailed";
}

/**
 * - Purpose: orchestrate OCP settings mutations and connection controls for Integrations UI.
 */
export function useOcpSettingsPanel(
  input: UseOcpSettingsPanelInput,
): UseOcpSettingsPanelResult {
  const { facade, userSettings, onUserSettingsChange } = input;
  const session = useAccountBootstrapStore((state) => state.ocpSessionProjection);
  const [tokenDraft, setTokenDraft] = useState("");
  const [tokenVisible, setTokenVisible] = useState(false);
  const [hasSavedToken, setHasSavedToken] = useState(false);
  const [actionLoading, setActionLoading] = useState<
    UseOcpSettingsPanelResult["actionLoading"]
  >(null);
  const [errorKey, setErrorKey] = useState<OcpSettingsPanelErrorKey | null>(null);

  const settings = userSettings.ocpIntegration;

  useEffect(() => {
    if (facade === null) {
      setHasSavedToken(false);
      return;
    }
    let cancelled = false;
    void facade.getOcpToken().then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setHasSavedToken(result.value !== null && result.value.length > 0);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [facade, userSettings]);

  const persistOcpSettings = useCallback(
    async (next: OcpIntegrationSettings): Promise<boolean> => {
      if (facade === null) {
        return false;
      }
      const result = await facade.updateOcpSettings(next);
      if (!result.ok) {
        setErrorKey("settings.integrations.ocp.error.saveFailed");
        return false;
      }
      setErrorKey(null);
      onUserSettingsChange(result.value);
      return true;
    },
    [facade, onUserSettingsChange],
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

  const onAutoSipAuthChange = useCallback(
    (autoSipAuth: boolean): void => {
      void persistOcpSettings({ ...settings, autoSipAuth });
    },
    [persistOcpSettings, settings],
  );

  const onSaveToken = useCallback((): void => {
    if (facade === null) {
      return;
    }
    const trimmed = tokenDraft.trim();
    if (trimmed.length === 0) {
      setErrorKey("settings.integrations.ocp.error.tokenRequired");
      return;
    }
    setActionLoading("save-token");
    void facade
      .saveOcpToken(trimmed)
      .then((result) => {
        if (!result.ok) {
          setErrorKey(resolveActionErrorKey(result.error.code));
          return;
        }
        setErrorKey(null);
        setTokenDraft("");
        setHasSavedToken(true);
      })
      .finally(() => {
        setActionLoading(null);
      });
  }, [facade, tokenDraft]);

  const onDeleteToken = useCallback((): void => {
    if (facade === null) {
      return;
    }
    setActionLoading("delete-token");
    void facade
      .deleteOcpToken()
      .then((result) => {
        if (!result.ok) {
          setErrorKey("settings.integrations.ocp.error.saveFailed");
          return;
        }
        setErrorKey(null);
        setTokenDraft("");
        setHasSavedToken(false);
      })
      .finally(() => {
        setActionLoading(null);
      });
  }, [facade]);

  const onConnect = useCallback((): void => {
    if (facade === null) {
      return;
    }
    if (settings.domain.trim().length === 0) {
      setErrorKey("settings.integrations.ocp.error.domainRequired");
      return;
    }
    if (!hasSavedToken && tokenDraft.trim().length === 0) {
      setErrorKey("settings.integrations.ocp.error.tokenRequired");
      return;
    }
    setActionLoading("connect");
    void facade
      .connectOcp()
      .then((result) => {
        if (!result.ok) {
          setErrorKey(resolveActionErrorKey(result.error.code));
          return;
        }
        setErrorKey(null);
      })
      .finally(() => {
        setActionLoading(null);
      });
  }, [facade, hasSavedToken, settings.domain, tokenDraft]);

  const onDisconnect = useCallback((): void => {
    if (facade === null) {
      return;
    }
    setActionLoading("disconnect");
    void facade
      .disconnectOcp()
      .then((result) => {
        if (!result.ok) {
          setErrorKey("settings.integrations.ocp.error.connectFailed");
          return;
        }
        setErrorKey(null);
      })
      .finally(() => {
        setActionLoading(null);
      });
  }, [facade]);

  return {
    settings,
    session,
    tokenDraft,
    tokenVisible,
    hasSavedToken,
    actionLoading,
    errorKey,
    onEnabledChange,
    onDomainChange,
    onAutoConnectChange,
    onAutoSipAuthChange,
    onTokenDraftChange: setTokenDraft,
    onTokenVisibleChange: setTokenVisible,
    onSaveToken,
    onDeleteToken,
    onConnect,
    onDisconnect,
  };
}

export type OcpStatusTranslationKey = Extract<
  TranslationKey,
  | "settings.integrations.ocp.status.disconnected"
  | "settings.integrations.ocp.status.connecting"
  | "settings.integrations.ocp.status.connected"
  | "settings.integrations.ocp.status.authenticated"
  | "settings.integrations.ocp.status.reconnecting"
  | "settings.integrations.ocp.status.failed"
  | "settings.integrations.ocp.status.sessionClosed"
  | "settings.integrations.ocp.status.disabled"
>;

export function resolveOcpStatusLabelKey(
  enabled: boolean,
  connectionState: OcpSessionProjection["connectionState"],
): OcpStatusTranslationKey {
  if (!enabled) {
    return "settings.integrations.ocp.status.disabled";
  }
  switch (connectionState) {
    case "connecting":
      return "settings.integrations.ocp.status.connecting";
    case "connected":
      return "settings.integrations.ocp.status.connected";
    case "authenticated":
      return "settings.integrations.ocp.status.authenticated";
    case "reconnecting":
      return "settings.integrations.ocp.status.reconnecting";
    case "failed":
      return "settings.integrations.ocp.status.failed";
    case "sessionClosed":
      return "settings.integrations.ocp.status.sessionClosed";
    default:
      return "settings.integrations.ocp.status.disconnected";
  }
}
