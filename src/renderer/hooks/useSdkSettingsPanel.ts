/** Bind Settings → Integrations → SDK Server card to settings + gateway IPC. */
import { useCallback, useEffect, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  createDefaultSdkOriginCapabilityMatrix,
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
  SdkPendingOriginTrustProjection,
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
  const [pendingOriginTrust, setPendingOriginTrust] = useState<
    readonly SdkPendingOriginTrustProjection[]
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
    setAllowedOriginsLive(
      (response.snapshot.origins ?? [])
        .filter((entry) => entry.state === "allowed")
        .map((entry) => entry.origin),
    );
    setPairedClients(response.snapshot.paired ?? response.snapshot.pairedClients ?? []);
    setPendingPairing(response.snapshot.pendingPairing);
    setPendingOriginTrust(response.snapshot.pendingOriginTrust ?? []);
    if ("grant" in response) {
      setLastGrant(response.grant);
    }
  }, []);

  const refreshSnapshot = useCallback(async (): Promise<void> => {
    const response = await invokeSdkGatewaySettings({ op: "getSnapshot" });
    applySnapshot(response);
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
      onActiveUserSettingsRefresh(settingsResult.value);
      setProfileOptions(await loadSdkProfileOptions(facade));
      // Prefer live gateway trust (machine-common hydrate) over account silo.
      const response = await invokeSdkGatewaySettings({ op: "getSnapshot" });
      applySnapshot(response);
      const snapshotOrigins =
        response.ok && response.snapshot.origins !== undefined
          ? response.snapshot.origins
          : null;
      // Live gateway snapshot is SoT; mirror into the active account bucket when it differs.
      const live: SdkIntegrationSettings =
        snapshotOrigins !== null
          ? { originsManaged: true, origins: snapshotOrigins }
          : settingsResult.value.sdkIntegration;
      setSettings(live);
      setOriginsDraft(
        live.origins
          .filter((entry) => entry.state === "allowed")
          .map((entry) => entry.origin)
          .join("\n"),
      );
      if (
        snapshotOrigins !== null &&
        JSON.stringify(live.origins) !==
          JSON.stringify(settingsResult.value.sdkIntegration.origins)
      ) {
        const mirrored = await facade.saveUserSettings({
          ...settingsResult.value,
          sdkIntegration: live,
        });
        if (mirrored.ok) {
          onActiveUserSettingsRefresh(mirrored.value);
        }
      }
    })();
  }, [
    applySnapshot,
    facade,
    invokeSdkGatewaySettings,
    onActiveUserSettingsRefresh,
  ]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refreshSnapshot();
    }, 1500);
    return () => window.clearInterval(timer);
  }, [refreshSnapshot]);

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
      if (
        response.ok &&
        response.snapshot.origins !== undefined &&
        JSON.stringify(response.snapshot.origins) !== JSON.stringify(settings.origins)
      ) {
        await persistAndApply({
          originsManaged: true,
          origins: response.snapshot.origins,
        });
      }
      setErrorKey(response.ok ? null : mapSdkGatewayOpError(operation));
    } finally {
      setBusy(false);
    }
  }, [applySnapshot, invokeSdkGatewaySettings, persistAndApply, settings.origins]);

  return {
    settings,
    diagnostics,
    allowedOriginsLive,
    pairedClients,
    pendingPairing,
    pendingOriginTrust,
    profileOptions,
    selectedClientId,
    selectedProfileId,
    lastGrant,
    originsDraft,
    errorKey,
    busy,
    onOriginsDraftChange: setOriginsDraft,
    onOriginsSave: () => {
      const parsed = parseSdkOriginsDraft(originsDraft);
      if (parsed === null) {
        setErrorKey("settings.integrations.sdk.error.originsInvalid");
        return;
      }
      void persistAndApply({
        ...settings,
        origins: [
          ...settings.origins.filter((entry) => entry.state === "denied"),
          ...parsed.map((origin) => ({
            origin,
            state: "allowed" as const,
            matrix:
              settings.origins.find((entry) => entry.origin === origin)?.matrix ??
              createDefaultSdkOriginCapabilityMatrix(),
            previouslyAllowed: true,
          })),
        ],
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
    onAllowOriginTrust: (originTrustRequestId) => {
      void runOp({ op: "allowOriginTrust", originTrustRequestId });
    },
    onDenyOriginTrust: (originTrustRequestId) => {
      void runOp({ op: "denyOriginTrust", originTrustRequestId });
    },
    onUnblockOrigin: (origin) => {
      void runOp({ op: "unblockOrigin", origin });
    },
    onSetOriginMatrix: (origin, matrix) => {
      void runOp({ op: "setOriginMatrix", origin, matrix });
    },
  };
}

