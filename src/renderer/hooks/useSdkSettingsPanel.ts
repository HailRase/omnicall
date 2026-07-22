/** Bind Settings → Axatalk SDK card to settings + gateway IPC. */
import { useCallback, useEffect, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  allowSdkOrigin,
  denySdkOrigin,
  parseExactSdkOrigin,
  removeAllowedSdkOrigin,
  renameAllowedSdkOrigin,
  SDK_INTEGRATION_DEFAULTS,
  type SdkIntegrationSettings,
  type UserSettings,
} from "@application/index.js";
import type {
  SdkGatewayDiagnosticsProjection,
  SdkGatewaySettingsOperation,
  SdkGatewaySettingsResponse,
  SdkPairedClientProjection,
  SdkPendingPairingProjection,
  SdkPendingOriginTrustProjection,
} from "@shared/ipc/SdkGatewaySettingsContract.js";
import { persistSdkIntegrationSettings } from "./sdkSettingsPanelActions.js";
import {
  defaultSdkGatewayInvoker,
  EMPTY_SDK_DIAGNOSTICS,
  mapSdkGatewayOpError,
  type SdkGatewayInvoker,
} from "./sdkSettingsPanelHelpers.js";
import type {
  SdkSettingsPanelErrorKey,
  UseSdkSettingsPanelResult,
} from "./sdkSettingsPanelTypes.js";
import { subscribeSdkIntegrationSettingsChanged } from "../bootstrap/sdkIntegrationSettingsSync.js";

export type {
  SdkSettingsPanelErrorKey,
  UseSdkSettingsPanelResult,
} from "./sdkSettingsPanelTypes.js";

type UseSdkSettingsPanelInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  onActiveUserSettingsRefresh: (settings: UserSettings) => void;
  invokeSdkGatewaySettings?: SdkGatewayInvoker;
}>;

/** SDK Server settings + live gateway ops (DI-09 / DI-11). */
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
  const [addOriginDraft, setAddOriginDraft] = useState("");
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
  }, []);

  const refreshSnapshot = useCallback(async (): Promise<void> => {
    const response = await invokeSdkGatewaySettings({ op: "getSnapshot" });
    applySnapshot(response);
    if (response.ok && response.snapshot.origins !== undefined) {
      setSettings({
        originsManaged: true,
        origins: response.snapshot.origins,
      });
    }
  }, [applySnapshot, invokeSdkGatewaySettings]);

  useEffect(() => {
    void (async () => {
      if (facade === null) {
        setSettings(SDK_INTEGRATION_DEFAULTS);
        setAddOriginDraft("");
        return;
      }
      const settingsResult = await facade.getUserSettingsForAccount();
      if (!settingsResult.ok) {
        setErrorKey("settings.integrations.sdk.error.saveFailed");
        return;
      }
      setErrorKey(null);
      onActiveUserSettingsRefresh(settingsResult.value);
      const response = await invokeSdkGatewaySettings({ op: "getSnapshot" });
      applySnapshot(response);
      const snapshotOrigins =
        response.ok && response.snapshot.origins !== undefined
          ? response.snapshot.origins
          : null;
      const live: SdkIntegrationSettings =
        snapshotOrigins !== null
          ? { originsManaged: true, origins: snapshotOrigins }
          : settingsResult.value.sdkIntegration;
      setSettings(live);
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

  useEffect(() => {
    return subscribeSdkIntegrationSettingsChanged(() => {
      void refreshSnapshot();
    });
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

  const onRefresh = useCallback((): void => {
    void refreshSnapshot();
  }, [refreshSnapshot]);

  return {
    settings,
    diagnostics,
    allowedOriginsLive,
    pairedClients,
    pendingPairing,
    pendingOriginTrust,
    addOriginDraft,
    errorKey,
    busy,
    onAddOriginDraftChange: setAddOriginDraft,
    onAddOrigin: (draft?: string) => {
      const raw = (draft ?? addOriginDraft).trim();
      const parsed = parseExactSdkOrigin(raw);
      if (parsed === null) {
        setErrorKey("settings.integrations.sdk.error.originsInvalid");
        return;
      }
      const next = allowSdkOrigin(settings, parsed);
      if (next === null) {
        setErrorKey("settings.integrations.sdk.error.originsInvalid");
        return;
      }
      setAddOriginDraft("");
      void persistAndApply(next);
    },
    onRefresh,
    onApprovePairing: (id) => {
      void runOp({ op: "approvePairing", pairingRequestId: id });
    },
    onDenyPairing: (id) => {
      void runOp({ op: "denyPairing", pairingRequestId: id });
    },
    onRevokeClient: (clientId) => {
      void runOp({ op: "revokeClient", clientId });
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
    onBlacklistOrigin: (origin) => {
      const next = denySdkOrigin(settings, origin);
      if (next === null) {
        setErrorKey("settings.integrations.sdk.error.saveFailed");
        return;
      }
      void persistAndApply(next);
    },
    onRemoveAllowedOrigin: (origin) => {
      const next = removeAllowedSdkOrigin(settings, origin);
      if (next === null) {
        setErrorKey("settings.integrations.sdk.error.saveFailed");
        return;
      }
      void persistAndApply(next);
    },
    onRenameAllowedOrigin: (previousOrigin, nextOrigin) => {
      const next = renameAllowedSdkOrigin(settings, previousOrigin, nextOrigin);
      if (next === null) {
        setErrorKey("settings.integrations.sdk.error.originsInvalid");
        return;
      }
      void persistAndApply(next);
    },
    onSetOriginMatrix: (origin, matrix) => {
      void runOp({ op: "setOriginMatrix", origin, matrix });
    },
  };
}
