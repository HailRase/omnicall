/**
 * IPC registration for SDK gateway Settings operational UX (DI-09).
 */

import type { LocalWsServerAdapter } from "@adapters/integration/LocalWsServerAdapter.js";
import { createConsoleLogger } from "@infrastructure/logging/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  setSdkOriginCapabilityMatrix,
  unblockSdkOrigin,
} from "@domain/settings/sdkOriginTrustMutations.js";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import {
  parseSdkGatewaySettingsOperation,
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
      try {
        return await handleSdkGatewaySettingsOperation(parsed, deps);
      } catch (error: unknown) {
        const reason =
          error instanceof Error && error.message.length > 0
            ? error.message
            : "operation_failed";
        logger.error("sdk_gateway_settings_operation_failed", {
          correlationId: createCorrelationId(),
          operation: "sdk_gateway_settings",
          result: reason,
        });
        return { ok: false, reason };
      }
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
        originsManaged: operation.policy.originsManaged,
        allowedOriginsCount: operation.policy.origins.filter(
          (entry) => entry.state === "allowed",
        ).length,
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
      const revoked = await gateway.revokePairedClient(
        operation.clientId,
        operation.origin,
      );
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
    case "allowOriginTrust":
    case "denyOriginTrust":
    case "cancelOriginTrust": {
      const gateway = runtime.getGateway();
      if (gateway === null) return { ok: false, reason: "gateway_unavailable" };
      const pending = gateway.listPendingOriginTrust().find(
        (entry) =>
          (operation.originTrustRequestId !== undefined &&
            entry.originTrustRequestId === operation.originTrustRequestId) ||
          (operation.origin !== undefined && entry.origin === operation.origin),
      );
      if (pending === undefined) return { ok: false, reason: "origin_trust_not_found" };
      const settled =
        operation.op === "allowOriginTrust"
          ? gateway.allowOriginTrust(pending.originTrustRequestId)
          : operation.op === "denyOriginTrust"
            ? gateway.denyOriginTrust(pending.originTrustRequestId)
            : gateway.cancelOriginTrust(pending.originTrustRequestId);
      if (!settled) return { ok: false, reason: "origin_trust_not_found" };
      return { ok: true, snapshot: await buildSdkGatewaySettingsSnapshot(gateway) };
    }
    case "unblockOrigin": {
      const gateway = runtime.getGateway();
      if (gateway === null) return { ok: false, reason: "gateway_unavailable" };
      const next = unblockSdkOrigin(
        {
          originsManaged: true,
          origins: gateway.getOriginTrustEntries(),
          operatorModalTimeouts: gateway.getOperatorModalTimeouts(),
        },
        operation.origin,
      );
      if (next === null) return { ok: false, reason: "origin_not_denied" };
      gateway.setOriginTrustEntries(next.origins);
      return { ok: true, snapshot: await buildSdkGatewaySettingsSnapshot(gateway) };
    }
    case "setOriginMatrix": {
      const gateway = runtime.getGateway();
      if (gateway === null) return { ok: false, reason: "gateway_unavailable" };
      const next = setSdkOriginCapabilityMatrix(
        {
          originsManaged: true,
          origins: gateway.getOriginTrustEntries(),
          operatorModalTimeouts: gateway.getOperatorModalTimeouts(),
        },
        operation.origin,
        operation.matrix,
      );
      if (next === null) return { ok: false, reason: "origin_not_allowed" };
      gateway.setOriginTrustEntries(next.origins);
      return { ok: true, snapshot: await buildSdkGatewaySettingsSnapshot(gateway) };
    }
    default: {
      const _exhaustive: never = operation;
      return { ok: false, reason: `unsupported:${String(_exhaustive)}` };
    }
  }
}
