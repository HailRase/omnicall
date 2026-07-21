/**
 * - Purpose: persist SDK integration settings and apply live gateway policy (DI-09).
 * - Inputs: AccountBootstrapFacade + typed gateway invoker.
 * - Outputs: saved settings + gateway snapshot response; technical failure reasons only.
 */

import type { AccountBootstrapFacade } from "../facades/AccountBootstrapFacade.js";
import type { SdkIntegrationSettings, UserSettings } from "@domain/index.js";
import type {
  SdkGatewaySettingsOperation,
  SdkGatewaySettingsResponse,
} from "@shared/ipc/SdkGatewaySettingsContract.js";

export type SdkGatewaySettingsInvoker = (
  operation: SdkGatewaySettingsOperation,
) => Promise<SdkGatewaySettingsResponse>;

export type PersistSdkIntegrationSettingsResult =
  | Readonly<{
      ok: true;
      settings: SdkIntegrationSettings;
      response: SdkGatewaySettingsResponse;
    }>
  | Readonly<{
      ok: false;
      reason: "save_failed" | "gateway_failed";
      settings?: SdkIntegrationSettings;
      response?: SdkGatewaySettingsResponse;
    }>;

export async function persistSdkIntegrationSettings(input: {
  facade: AccountBootstrapFacade;
  next: SdkIntegrationSettings;
  invoke: SdkGatewaySettingsInvoker;
  onRefresh: (settings: UserSettings) => void;
}): Promise<PersistSdkIntegrationSettingsResult> {
  const current = await input.facade.getUserSettingsForAccount();
  if (!current.ok) {
    return { ok: false, reason: "save_failed" };
  }
  const saved = await input.facade.saveUserSettings({
    ...current.value,
    sdkIntegration: input.next,
  });
  if (!saved.ok) {
    return { ok: false, reason: "save_failed" };
  }
  input.onRefresh(saved.value);
  const response = await input.invoke({
    op: "applyPolicy",
    policy: {
      originsManaged: input.next.originsManaged,
      origins: input.next.origins,
    },
  });
  if (!response.ok) {
    return {
      ok: false,
      reason: "gateway_failed",
      settings: saved.value.sdkIntegration,
      response,
    };
  }
  return {
    ok: true,
    settings: saved.value.sdkIntegration,
    response,
  };
}
