/**
 * IPC registration for SDK gateway Settings operational UX (DI-09).
 */

import type { LocalWsServerAdapter } from "@adapters/integration/LocalWsServerAdapter.js";
import { createConsoleLogger } from "@infrastructure/logging/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import {
  parseSdkGatewaySettingsOperation,
  type SdkActivateGrantResultProjection,
  type SdkGatewaySettingsOperation,
  type SdkGatewaySettingsPolicyPayload,
  type SdkGatewaySettingsResponse,
} from "@shared/ipc/SdkGatewaySettingsContract.js";
import { ipcMain } from "electron";

import { buildSdkGatewaySettingsSnapshot } from "./sdkGatewaySettingsOps.js";

const logger = createConsoleLogger({
  boundedContext: "Integration",
  featureId: "F-011",
});

export type SdkGatewaySettingsIpcDeps = Readonly<{
  getGateway: () => LocalWsServerAdapter | null;
  applyPolicy: (
    policy: SdkGatewaySettingsPolicyPayload,
  ) => Promise<LocalWsServerAdapter | null>;
  issueActivateGrant: (input: {
    readonly clientId: string;
    readonly profileId: string;
  }) => SdkActivateGrantResultProjection;
}>;

let settingsIpcRegistered = false;
let deps: SdkGatewaySettingsIpcDeps | null = null;

export function registerSdkGatewaySettingsIpc(
  nextDeps: SdkGatewaySettingsIpcDeps,
): void {
  deps = nextDeps;
  if (settingsIpcRegistered || typeof ipcMain?.handle !== "function") {
    return;
  }
  settingsIpcRegistered = true;
  ipcMain.handle(
    IPC_CHANNELS.sdkGatewaySettingsInvoke,
    async (_event, payload: unknown): Promise<SdkGatewaySettingsResponse> => {
      const parsed = parseSdkGatewaySettingsOperation(payload);
      if (parsed === null || deps === null) {
        return { ok: false, reason: "invalid_operation" };
      }
      return handleSdkGatewaySettingsOperation(parsed, deps);
    },
  );
}

export function unregisterSdkGatewaySettingsIpcForTests(): void {
  if (settingsIpcRegistered && typeof ipcMain?.removeHandler === "function") {
    ipcMain.removeHandler(IPC_CHANNELS.sdkGatewaySettingsInvoke);
  }
  settingsIpcRegistered = false;
  deps = null;
}

async function handleSdkGatewaySettingsOperation(
  operation: SdkGatewaySettingsOperation,
  runtime: SdkGatewaySettingsIpcDeps,
): Promise<SdkGatewaySettingsResponse> {
  switch (operation.op) {
    case "getSnapshot": {
      const snapshot = await buildSdkGatewaySettingsSnapshot(runtime.getGateway());
      return { ok: true, snapshot };
    }
    case "applyPolicy": {
      await runtime.applyPolicy(operation.policy);
      logger.info("sdk_gateway_policy_applied", {
        correlationId: createCorrelationId(),
        operation: "sdk_gateway_settings",
        enabled: operation.policy.enabled,
        originsManaged: operation.policy.originsManaged,
        allowedOriginsCount: operation.policy.allowedOrigins.length,
      });
      const snapshot = await buildSdkGatewaySettingsSnapshot(runtime.getGateway());
      return { ok: true, snapshot };
    }
    case "approvePairing": {
      const gateway = runtime.getGateway();
      const ok = gateway?.approvePairingRequest(operation.pairingRequestId) ?? false;
      if (!ok) {
        return { ok: false, reason: "pairing_not_found" };
      }
      const snapshot = await buildSdkGatewaySettingsSnapshot(gateway);
      return { ok: true, snapshot };
    }
    case "denyPairing": {
      const gateway = runtime.getGateway();
      const ok = gateway?.denyPairingRequest(operation.pairingRequestId) ?? false;
      if (!ok) {
        return { ok: false, reason: "pairing_not_found" };
      }
      const snapshot = await buildSdkGatewaySettingsSnapshot(gateway);
      return { ok: true, snapshot };
    }
    case "revokeClient": {
      const gateway = runtime.getGateway();
      if (gateway === null) {
        return { ok: false, reason: "gateway_unavailable" };
      }
      const revoked = await gateway.revokePairedClient(operation.clientId);
      if (!revoked) {
        return { ok: false, reason: "client_not_found" };
      }
      logger.info("sdk_gateway_client_revoked", {
        correlationId: createCorrelationId(),
        operation: "sdk_gateway_settings",
        result: "revoked",
      });
      const snapshot = await buildSdkGatewaySettingsSnapshot(gateway);
      return { ok: true, snapshot };
    }
    case "issueActivateGrant": {
      const grant = runtime.issueActivateGrant({
        clientId: operation.clientId,
        profileId: operation.profileId,
      });
      const snapshot = await buildSdkGatewaySettingsSnapshot(runtime.getGateway());
      return { ok: true, grant, snapshot };
    }
    default: {
      const _exhaustive: never = operation;
      return { ok: false, reason: `unsupported:${String(_exhaustive)}` };
    }
  }
}
