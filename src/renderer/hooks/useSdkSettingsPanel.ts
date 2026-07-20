/** Bind Settings → Integrations → SDK Server card to settings + gateway IPC. */
import { useCallback, useEffect, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  parseSdkOriginsDraft,
  SDK_INTEGRATION_DEFAULTS,
  type SdkIntegrationSettings,
  type UserSettings,
} from "@application/index.js";
import type {
  SdkActivateGrantResultProjection,
  SdkGatewayDiagnosticsProjection,
  SdkGatewaySettingsOperation,
  SdkGatewaySettingsResponse,
  SdkPairedClientProjection,
  SdkPendingPairingProjection,
} from "@shared/ipc/SdkGatewaySettingsContract.js";
import {
  loadSdkProfileOptions,
  persistSdkIntegrationSettings,
} from "./sdkSettingsPanelActions.js";
import {
  defaultSdkGatewayInvoker,
  EMPTY_SDK_DIAGNOSTICS,
  mapSdkGatewayOpError,
  type SdkGatewayInvoker,
} from "./sdkSettingsPanelHelpers.js";
import type {
  SdkProfileOption,
  SdkSettingsPanelErrorKey,
  UseSdkSettingsPanelResult,
} from "./sdkSettingsPanelTypes.js";

export type {
  SdkProfileOption,
  SdkSettingsPanelErrorKey,
  UseSdkSettingsPanelResult,
} from "./sdkSettingsPanelTypes.js";

type UseSdkSettingsPanelInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  onActiveUserSettingsRefresh: (settings: UserSettings) => void;
  invokeSdkGatewaySettings?: SdkGatewayInvoker;
}>;

/** SDK Server settings + live gateway ops (DI-09). */
export function useSdkSettingsPanel(
  input: UseSdkSettingsPanelInput,
): UseSdkSettingsPanelResult {
  const {
    facade,
    onActiveUserSettingsRefresh,
    invokeSdkGatewaySettings = defaultSdkGatewayInvoker,
  } = input;

  const [settings, setSettings] = useState(SDK_INTEGRATION_DEFAULTS);
  const [diagnostics, setDiagnostics] =
    useState<SdkGatewayDiagnosticsProjection>(EMPTY_SDK_DIAGNOSTICS);
  const [allowedOriginsLive, setAllowedOriginsLive] = useState<readonly string[]>([]);
  const [pairedClients, setPairedClients] = useState<
    readonly SdkPairedClientProjection[]
  >([]);
  const [pendingPairing, setPendingPairing] = useState<
    readonly SdkPendingPairingProjection[]
  >([]);
  const [profileOptions, setProfileOptions] = useState<readonly SdkProfileOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [lastGrant, setLastGrant] = useState<SdkActivateGrantResultProjection | null>(null);
  const [originsDraft, setOriginsDraft] = useState("");
  const [errorKey, setErrorKey] = useState<SdkSettingsPanelErrorKey | null>(null);
  const [busy, setBusy] = useState(false);

  const applySnapshot = useCallback((response: SdkGatewaySettingsResponse): void => {
    if (!response.ok) {
      setErrorKey("settings.integrations.sdk.error.gatewayFailed");
      return;
    }
    setDiagnostics(response.snapshot.diagnostics);
    setAllowedOriginsLive(response.snapshot.allowedOrigins);
    setPairedClients(response.snapshot.pairedClients);
    setPendingPairing(response.snapshot.pendingPairing);
    if ("grant" in response) {
      setLastGrant(response.grant);
    }
  }, []);

  const refreshSnapshot = useCallback(async (): Promise<void> => {
    applySnapshot(await invokeSdkGatewaySettings({ op: "getSnapshot" }));
  }, [applySnapshot, invokeSdkGatewaySettings]);

  useEffect(() => {
    void (async () => {
      if (facade === null) {
        setSettings(SDK_INTEGRATION_DEFAULTS);
        setOriginsDraft("");
        setProfileOptions([]);
        return;
      }
      const settingsResult = await facade.getUserSettingsForAccount();
      if (!settingsResult.ok) {
        setErrorKey("settings.integrations.sdk.error.saveFailed");
        return;
      }
      setErrorKey(null);
      setSettings(settingsResult.value.sdkIntegration);
      setOriginsDraft(settingsResult.value.sdkIntegration.allowedOrigins.join("\n"));
      onActiveUserSettingsRefresh(settingsResult.value);
      setProfileOptions(await loadSdkProfileOptions(facade));
      await refreshSnapshot();
    })();
  }, [facade, onActiveUserSettingsRefresh, refreshSnapshot]);

  const persistAndApply = useCallback(async (next: SdkIntegrationSettings) => {
    if (facade === null) return;
    setBusy(true);
    try {
      const result = await persistSdkIntegrationSettings({
        facade,
        next,
        invoke: invokeSdkGatewaySettings,
        onRefresh: onActiveUserSettingsRefresh,
      });
      if (result.settings !== undefined) setSettings(result.settings);
      if (result.response !== undefined) applySnapshot(result.response);
      setErrorKey(result.errorKey ?? null);
    } finally {
      setBusy(false);
    }
  }, [applySnapshot, facade, invokeSdkGatewaySettings, onActiveUserSettingsRefresh]);

  const runOp = useCallback(async (operation: SdkGatewaySettingsOperation) => {
    setBusy(true);
    try {
      const response = await invokeSdkGatewaySettings(operation);
      applySnapshot(response);
      setErrorKey(response.ok ? null : mapSdkGatewayOpError(operation));
    } finally {
      setBusy(false);
    }
  }, [applySnapshot, invokeSdkGatewaySettings]);

  return {
    settings,
    diagnostics,
    allowedOriginsLive,
    pairedClients,
    pendingPairing,
    profileOptions,
    selectedClientId,
    selectedProfileId,
    lastGrant,
    originsDraft,
    errorKey,
    busy,
    onEnabledChange: (enabled) => {
      void persistAndApply({ ...settings, enabled });
    },
    onOriginsDraftChange: setOriginsDraft,
    onOriginsSave: () => {
      const parsed = parseSdkOriginsDraft(originsDraft);
      if (parsed === null) {
        setErrorKey("settings.integrations.sdk.error.originsInvalid");
        return;
      }
      void persistAndApply({
        ...settings,
        allowedOrigins: parsed,
        originsManaged: true,
      });
    },
    onRefresh: () => {
      void refreshSnapshot();
    },
    onApprovePairing: (id) => {
      void runOp({ op: "approvePairing", pairingRequestId: id });
    },
    onDenyPairing: (id) => {
      void runOp({ op: "denyPairing", pairingRequestId: id });
    },
    onRevokeClient: (clientId) => {
      void runOp({ op: "revokeClient", clientId });
    },
    onSelectClientId: setSelectedClientId,
    onSelectProfileId: setSelectedProfileId,
    onIssueActivateGrant: () => {
      if (selectedClientId === null || selectedProfileId === null) {
        setErrorKey("settings.integrations.sdk.error.grantFailed");
        return;
      }
      void runOp({
        op: "issueActivateGrant",
        clientId: selectedClientId,
        profileId: selectedProfileId,
      });
    },
  };
}

