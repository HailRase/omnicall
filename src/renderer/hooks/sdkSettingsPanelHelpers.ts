import type {
  SdkGatewayDiagnosticsProjection,
  SdkGatewaySettingsOperation,
  SdkGatewaySettingsResponse,
} from "@shared/ipc/SdkGatewaySettingsContract.js";
import type { SdkSettingsPanelErrorKey } from "./sdkSettingsPanelTypes.js";

export const EMPTY_SDK_DIAGNOSTICS: SdkGatewayDiagnosticsProjection = {
  status: "disabled",
  bindHost: null,
  bindPort: null,
  connectionCount: 0,
  authenticatedCount: 0,
  unauthenticatedCount: 0,
  pendingPairingCount: 0,
  pairedClientCount: 0,
  allowedOriginsCount: 0,
  lastErrorCode: null,
  windowHideAvailable: false,
};

export type SdkGatewayInvoker = (
  operation: SdkGatewaySettingsOperation,
) => Promise<SdkGatewaySettingsResponse>;

export function defaultSdkGatewayInvoker(
  operation: SdkGatewaySettingsOperation,
): Promise<SdkGatewaySettingsResponse> {
  if (
    typeof window === "undefined" ||
    window.softphone?.invokeSdkGatewaySettings === undefined
  ) {
    return Promise.resolve({ ok: false, reason: "preload_unavailable" });
  }
  return window.softphone.invokeSdkGatewaySettings(operation);
}

export function mapSdkGatewayOpError(
  operation: SdkGatewaySettingsOperation,
): SdkSettingsPanelErrorKey {
  if (operation.op === "revokeClient") {
    return "settings.integrations.sdk.error.revokeFailed";
  }
  return "settings.integrations.sdk.error.gatewayFailed";
}
