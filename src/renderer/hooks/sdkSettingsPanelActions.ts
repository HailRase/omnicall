import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  deriveSavedAccountProfileSelectorOptions,
  persistSdkIntegrationSettings as persistSdkIntegrationSettingsApp,
  type SdkIntegrationSettings,
  type UserSettings,
} from "@application/index.js";
import type { SdkGatewaySettingsResponse } from "@shared/ipc/SdkGatewaySettingsContract.js";
import type { SdkGatewayInvoker } from "./sdkSettingsPanelHelpers.js";
import type {
  SdkProfileOption,
  SdkSettingsPanelErrorKey,
} from "./sdkSettingsPanelTypes.js";

type PersistResult = Readonly<{
  ok: boolean;
  settings?: SdkIntegrationSettings;
  response?: SdkGatewaySettingsResponse;
  errorKey?: SdkSettingsPanelErrorKey;
}>;

export async function persistSdkIntegrationSettings(input: {
  facade: AccountBootstrapFacade;
  next: SdkIntegrationSettings;
  invoke: SdkGatewayInvoker;
  onRefresh: (settings: UserSettings) => void;
}): Promise<PersistResult> {
  const result = await persistSdkIntegrationSettingsApp(input);
  if (result.ok) {
    return {
      ok: true,
      settings: result.settings,
      response: result.response,
    };
  }
  return {
    ok: false,
    ...(result.settings !== undefined ? { settings: result.settings } : {}),
    ...(result.response !== undefined ? { response: result.response } : {}),
    errorKey:
      result.reason === "gateway_failed"
        ? "settings.integrations.sdk.error.gatewayFailed"
        : "settings.integrations.sdk.error.saveFailed",
  };
}

export async function loadSdkProfileOptions(
  facade: AccountBootstrapFacade,
): Promise<readonly SdkProfileOption[]> {
  const profilesResult = await facade.listSavedAccountProfiles();
  if (!profilesResult.ok) {
    return [];
  }
  return deriveSavedAccountProfileSelectorOptions(
    profilesResult.value.filter((profile) => profile.lifecycleStatus !== "draft"),
  );
}
