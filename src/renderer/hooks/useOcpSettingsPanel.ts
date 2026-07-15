/**
 * - Purpose: bind Settings → Integrations → OCP Module card to facade login-scoped APIs.
 * - Inputs: AccountBootstrapFacade, optional login hint, refresh active UserSettings snapshot.
 * - Outputs: presentational props for OcpModuleSettingsCard; no SIP/Electron.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  OCP_INTEGRATION_DEFAULTS,
  type OcpConnectLoginOption,
  type OcpIntegrationSettings,
  type SettingsAccountKey,
  type UserSettings,
} from "@application/index.js";
import type { OcpSessionProjection } from "@application/projections/integration/ocpSessionProjection.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";

export type OcpSettingsPanelErrorKey =
  | "settings.integrations.ocp.error.domainRequired"
  | "settings.integrations.ocp.error.apiKeyRequired"
  | "settings.integrations.ocp.error.loginRequired"
  | "settings.integrations.ocp.error.loginAmbiguous"
  | "settings.integrations.ocp.error.saveFailed"
  | "settings.integrations.ocp.error.connectFailed";

export type UseOcpSettingsPanelResult = Readonly<{
  settings: OcpIntegrationSettings;
  session: OcpSessionProjection;
  login: string;
  loginOptions: ReadonlyArray<OcpConnectLoginOption>;
  apiKeyDraft: string;
  apiKeyVisible: boolean;
  hasSavedApiKey: boolean;
  actionLoading: "save-api-key" | "delete-api-key" | "connect" | "disconnect" | null;
  errorKey: OcpSettingsPanelErrorKey | null;
  onLoginChange: (login: string) => void;
  onEnabledChange: (enabled: boolean) => void;
  onDomainChange: (domain: string) => void;
  onAutoConnectChange: (autoConnect: boolean) => void;
  onApiKeyDraftChange: (apiKey: string) => void;
  onApiKeyVisibleChange: (visible: boolean) => void;
  onSaveApiKey: () => void;
  onDeleteApiKey: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
}>;

type UseOcpSettingsPanelInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  /** Optional seed from Account form username (not live bind). */
  initialLoginHint?: string;
  onActiveUserSettingsRefresh: (settings: UserSettings) => void;
}>;

const LOGIN_RESOLVE_DEBOUNCE_MS = 250;

function resolveActionErrorKey(code: string | undefined): OcpSettingsPanelErrorKey {
  if (code === "api_key_required") {
    return "settings.integrations.ocp.error.apiKeyRequired";
  }
  if (code === "login_required") {
    return "settings.integrations.ocp.error.loginRequired";
  }
  if (code === "login_ambiguous") {
    return "settings.integrations.ocp.error.loginAmbiguous";
  }
  if (code === "domain_required" || code === "ocpIntegration_invalid") {
    return "settings.integrations.ocp.error.domainRequired";
  }
  return "settings.integrations.ocp.error.connectFailed";
}

/**
 * - Purpose: orchestrate login-scoped OCP settings and connection controls for Integrations UI.
 */
export function useOcpSettingsPanel(
  input: UseOcpSettingsPanelInput,
): UseOcpSettingsPanelResult {
  const { facade, initialLoginHint = "", onActiveUserSettingsRefresh } = input;
  const session = useAccountBootstrapStore((state) => state.ocpSessionProjection);
  const [login, setLogin] = useState(initialLoginHint);
  const [accountKey, setAccountKey] = useState<SettingsAccountKey | undefined>(undefined);
  const [loginOptions, setLoginOptions] = useState<ReadonlyArray<OcpConnectLoginOption>>([]);
  const [settings, setSettings] = useState<OcpIntegrationSettings>(OCP_INTEGRATION_DEFAULTS);
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [hasSavedApiKey, setHasSavedApiKey] = useState(false);
  const [actionLoading, setActionLoading] = useState<
    UseOcpSettingsPanelResult["actionLoading"]
  >(null);
  const [errorKey, setErrorKey] = useState<OcpSettingsPanelErrorKey | null>(null);
  const loginRequestIdRef = useRef(0);

  const refreshActiveSettings = useCallback(async (): Promise<void> => {
    if (facade === null) {
      return;
    }
    const result = await facade.getUserSettingsForAccount();
    if (result.ok) {
      onActiveUserSettingsRefresh(result.value);
    }
  }, [facade, onActiveUserSettingsRefresh]);

  const applyPanelState = useCallback(
    (panel: Readonly<{
      target: Readonly<{ accountKey: SettingsAccountKey }>;
      settings: OcpIntegrationSettings;
      hasApiKey: boolean;
      loginOptions: ReadonlyArray<OcpConnectLoginOption>;
    }>): void => {
      setAccountKey(panel.target.accountKey);
      setSettings(panel.settings);
      setHasSavedApiKey(panel.hasApiKey);
      setLoginOptions(panel.loginOptions);
      setApiKeyDraft("");
    },
    [],
  );

  useEffect(() => {
    if (facade === null) {
      setLoginOptions([]);
      setAccountKey(undefined);
      setSettings(OCP_INTEGRATION_DEFAULTS);
      setHasSavedApiKey(false);
      return;
    }
    let cancelled = false;
    void facade.listOcpConnectLoginOptions().then((result) => {
      if (cancelled || !result.ok) {
        return;
      }
      setLoginOptions(result.value);
    });
    return () => {
      cancelled = true;
    };
  }, [facade]);

  useEffect(() => {
    if (facade === null) {
      return;
    }
    const trimmed = login.trim();
    if (trimmed.length === 0) {
      setAccountKey(undefined);
      setSettings(OCP_INTEGRATION_DEFAULTS);
      setHasSavedApiKey(false);
      return;
    }

    const requestId = ++loginRequestIdRef.current;
    const timer = setTimeout(() => {
      void facade.getOcpModulePanelState({ login: trimmed }).then((result) => {
        if (requestId !== loginRequestIdRef.current) {
          return;
        }
        if (!result.ok) {
          setErrorKey(resolveActionErrorKey(result.error.message || result.error.code));
          setAccountKey(undefined);
          return;
        }
        setErrorKey(null);
        applyPanelState(result.value);
      });
    }, LOGIN_RESOLVE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [applyPanelState, facade, login]);

  const persistOcpSettings = useCallback(
    async (next: OcpIntegrationSettings): Promise<boolean> => {
      if (facade === null) {
        return false;
      }
      const trimmedLogin = login.trim();
      if (trimmedLogin.length === 0 || accountKey === undefined) {
        setErrorKey("settings.integrations.ocp.error.loginRequired");
        return false;
      }
      const result = await facade.updateOcpSettings(next, { accountKey });
      if (!result.ok) {
        setErrorKey("settings.integrations.ocp.error.saveFailed");
        return false;
      }
      setErrorKey(null);
      setSettings(result.value.ocpIntegration);
      await refreshActiveSettings();
      return true;
    },
    [accountKey, facade, login, refreshActiveSettings],
  );

  const onLoginChange = useCallback((value: string): void => {
    setLogin(value);
    setErrorKey(null);
  }, []);

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

  const onSaveApiKey = useCallback((): void => {
    if (facade === null) {
      return;
    }
    const trimmedLogin = login.trim();
    if (trimmedLogin.length === 0 || accountKey === undefined) {
      setErrorKey("settings.integrations.ocp.error.loginRequired");
      return;
    }
    const trimmed = apiKeyDraft.trim();
    if (trimmed.length === 0) {
      setErrorKey("settings.integrations.ocp.error.apiKeyRequired");
      return;
    }
    setActionLoading("save-api-key");
    void facade
      .saveOcpProxyApiKey(trimmed, { accountKey })
      .then(async (result) => {
        if (!result.ok) {
          setErrorKey(resolveActionErrorKey(result.error.code));
          return;
        }
        setErrorKey(null);
        setApiKeyDraft("");
        setHasSavedApiKey(true);
        await refreshActiveSettings();
      })
      .finally(() => {
        setActionLoading(null);
      });
  }, [accountKey, apiKeyDraft, facade, login, refreshActiveSettings]);

  const onDeleteApiKey = useCallback((): void => {
    if (facade === null) {
      return;
    }
    if (accountKey === undefined) {
      setErrorKey("settings.integrations.ocp.error.loginRequired");
      return;
    }
    setActionLoading("delete-api-key");
    void facade
      .deleteOcpProxyApiKey({ accountKey })
      .then(async (result) => {
        if (!result.ok) {
          setErrorKey("settings.integrations.ocp.error.saveFailed");
          return;
        }
        setErrorKey(null);
        setApiKeyDraft("");
        setHasSavedApiKey(false);
        await refreshActiveSettings();
      })
      .finally(() => {
        setActionLoading(null);
      });
  }, [accountKey, facade, refreshActiveSettings]);

  const onConnect = useCallback((): void => {
    if (facade === null) {
      return;
    }
    const trimmedLogin = login.trim();
    if (trimmedLogin.length === 0 || accountKey === undefined) {
      setErrorKey("settings.integrations.ocp.error.loginRequired");
      return;
    }
    if (settings.domain.trim().length === 0) {
      setErrorKey("settings.integrations.ocp.error.domainRequired");
      return;
    }
    if (!hasSavedApiKey && apiKeyDraft.trim().length === 0) {
      setErrorKey("settings.integrations.ocp.error.apiKeyRequired");
      return;
    }
    setActionLoading("connect");
    const connectInput = { login: trimmedLogin, accountKey };
    const connectPromise =
      apiKeyDraft.trim().length > 0 && !hasSavedApiKey
        ? facade.saveOcpProxyApiKey(apiKeyDraft.trim(), { accountKey }).then((saveResult) => {
            if (!saveResult.ok) {
              return saveResult;
            }
            setHasSavedApiKey(true);
            setApiKeyDraft("");
            return facade.connectOcp(connectInput);
          })
        : facade.connectOcp(connectInput);
    void connectPromise
      .then(async (result) => {
        if (!result.ok) {
          setErrorKey(
            resolveActionErrorKey(result.error.message || result.error.code),
          );
          return;
        }
        setErrorKey(null);
        const panel = await facade.getOcpModulePanelState({
          login: trimmedLogin,
          accountKey,
        });
        if (panel.ok) {
          applyPanelState(panel.value);
        }
        await refreshActiveSettings();
      })
      .finally(() => {
        setActionLoading(null);
      });
  }, [
    accountKey,
    apiKeyDraft,
    applyPanelState,
    facade,
    hasSavedApiKey,
    login,
    refreshActiveSettings,
    settings.domain,
  ]);

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
    login,
    loginOptions,
    apiKeyDraft,
    apiKeyVisible,
    hasSavedApiKey,
    actionLoading,
    errorKey,
    onLoginChange,
    onEnabledChange,
    onDomainChange,
    onAutoConnectChange,
    onApiKeyDraftChange: setApiKeyDraft,
    onApiKeyVisibleChange: setApiKeyVisible,
    onSaveApiKey,
    onDeleteApiKey,
    onConnect,
    onDisconnect,
  };
}

export type OcpStatusTranslationKey =
  | "settings.integrations.ocp.status.disconnected"
  | "settings.integrations.ocp.status.connecting"
  | "settings.integrations.ocp.status.connected"
  | "settings.integrations.ocp.status.authenticated"
  | "settings.integrations.ocp.status.reconnecting"
  | "settings.integrations.ocp.status.failed"
  | "settings.integrations.ocp.status.sessionClosed"
  | "settings.integrations.ocp.status.disabled";

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
