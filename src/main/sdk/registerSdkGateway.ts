/**
 * Electron main registration for the loopback SDK WebSocket gateway (DI-03…DI-09).
 * Does not import Domain or Facades. Gateway failure must not block softphone.
 */

import { join } from "node:path";

import { LocalWsServerAdapter } from "@adapters/integration/LocalWsServerAdapter.js";
import { createConsoleLogger } from "@infrastructure/logging/index.js";
import { resolveAxatalkProfilesStorageRoot } from "@infrastructure/bootstrap/resolveAxatalkProfilesStorageRoot.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import {
  parseSdkGatewayPublishEventIpcPayload,
} from "@shared/ipc/SdkGatewayEventContract.js";
import type {
  SdkActivateGrantResultProjection,
  SdkGatewaySettingsPolicyPayload,
} from "@shared/ipc/SdkGatewaySettingsContract.js";
import { BrowserWindow, app, ipcMain } from "electron";

import { createSdkGatewayProductSurface } from "./createSdkGatewayProductSurface.js";
import { getSdkBroker } from "./registerSdkBrokerIpc.js";
import {
  registerSdkGatewaySettingsIpc,
  unregisterSdkGatewaySettingsIpcForTests,
} from "./registerSdkGatewaySettingsIpc.js";
import { resolveSdkGatewayAllowedOrigins } from "./sdkGatewaySettingsOps.js";
import { ElectronSafeStorageSecretService } from "../secrets/ElectronSafeStorageSecretService.js";
import { MainProcessSecretStorageAdapter } from "../secrets/MainProcessSecretStorageAdapter.js";

const logger = createConsoleLogger({
  boundedContext: "Integration",
  featureId: "F-011",
});

let gateway: LocalWsServerAdapter | null = null;
let primaryInstance = true;
let publishEventIpcRegistered = false;
let lastDesktopVersion = "0.0.0";

/** Record Electron single-instance ownership before claiming the fixed endpoint. */
export function setSdkGatewayPrimaryInstance(isPrimary: boolean): void {
  primaryInstance = isPrimary;
}

export function isSdkGatewayPrimaryInstance(): boolean {
  return primaryInstance;
}

/**
 * Start the loopback gateway when enabled (pairing/auth DI-04).
 * Failures are logged and swallowed so SIP-only boot continues.
 */
export async function startSdkGateway(options: {
  readonly desktopVersion: string;
  readonly enabled?: boolean;
  readonly allowedOrigins?: readonly string[];
}): Promise<LocalWsServerAdapter | null> {
  if (gateway !== null) {
    return gateway;
  }

  lastDesktopVersion = options.desktopVersion;
  registerPublishEventIpc();
  registerSdkGatewaySettingsIpc({
    getGateway: () => gateway,
    applyPolicy: (policy) => applySdkGatewayPolicy(policy),
    issueActivateGrant: (input) => issueSdkAccountActivateGrant(input),
  });

  const envEnabled = process.env["AXATALK_SDK_GATEWAY"] !== "0";
  const enabled = options.enabled ?? envEnabled;
  const allowedOrigins = options.allowedOrigins;

  gateway = new LocalWsServerAdapter({
    desktopVersion: options.desktopVersion,
    enabled,
    mayClaimEndpoint: () => primaryInstance,
    ...(allowedOrigins !== undefined ? { allowedOrigins } : {}),
    ...(enabled ? { secretStorage: createGatewaySecretStorage() } : {}),
    onLog: (event, fields) => {
      logger.info(event, {
        correlationId: createCorrelationId(),
        operation: "sdk_gateway",
        ...fields,
      });
    },
  });

  if (enabled) {
    gateway.setProductSurface(
      createSdkGatewayProductSurface({
        getBroker: () => getSdkBroker(),
        getMainWindow: () => BrowserWindow.getAllWindows()[0] ?? null,
      }),
    );
  }

  const result = await gateway.start();
  if (!result.ok) {
    const event =
      result.reason === "disabled"
        ? "sdk_gateway_start_skipped"
        : "sdk_gateway_start_failed";
    logger.info(event, {
      correlationId: createCorrelationId(),
      operation: "sdk_gateway_start",
      result: result.reason,
    });
    return gateway;
  }

  logger.info("sdk_gateway_start_ok", {
    correlationId: createCorrelationId(),
    operation: "sdk_gateway_start",
    result: "listening",
    host: result.host,
    port: result.port,
  });
  return gateway;
}

/**
 * Rebuild gateway with Settings policy (enablement + exact origins).
 * Does not tear SIP/account sessions.
 */
export async function applySdkGatewayPolicy(
  policy: SdkGatewaySettingsPolicyPayload,
): Promise<LocalWsServerAdapter | null> {
  const envForcedOff = process.env["AXATALK_SDK_GATEWAY"] === "0";
  const enabled = !envForcedOff && policy.enabled;
  const allowedOrigins = resolveSdkGatewayAllowedOrigins(policy);

  if (gateway !== null) {
    await gateway.stop();
    gateway = null;
  }

  return startSdkGateway({
    desktopVersion: lastDesktopVersion,
    enabled,
    allowedOrigins,
  });
}

export function issueSdkAccountActivateGrant(input: {
  readonly clientId: string;
  readonly profileId: string;
}): SdkActivateGrantResultProjection {
  if (gateway === null) {
    return { ok: false, reason: "not_listening" };
  }
  const issued = gateway.issueAccountActivateGrant(input);
  if (!issued.ok) {
    return { ok: false, reason: issued.reason };
  }
  return { ok: true, profileRef: issued.profileRef };
}

export function beginSdkGatewayAppShutdown(): void {
  gateway?.beginAppShutdown();
}

export function cancelSdkGatewayAppShutdown(): void {
  gateway?.cancelAppShutdown();
}

export async function stopSdkGateway(): Promise<void> {
  if (gateway === null) {
    return;
  }
  await gateway.stop();
}

export function getSdkGateway(): LocalWsServerAdapter | null {
  return gateway;
}

/** Narrow main API for pairing approve (Settings UX lands in DI-09). */
export function approveSdkPairingRequest(pairingRequestId: string): boolean {
  return gateway?.approvePairingRequest(pairingRequestId) ?? false;
}

export function denySdkPairingRequest(pairingRequestId: string): boolean {
  return gateway?.denyPairingRequest(pairingRequestId) ?? false;
}

export async function revokeSdkPairedClient(clientId: string): Promise<boolean> {
  if (gateway === null) {
    return false;
  }
  return gateway.revokePairedClient(clientId);
}

function createGatewaySecretStorage(): MainProcessSecretStorageAdapter {
  const storageRoot = resolveAxatalkProfilesStorageRoot(app.getPath("userData"));
  return new MainProcessSecretStorageAdapter(
    new ElectronSafeStorageSecretService(join(storageRoot, "secrets")),
  );
}

/** Test-only reset. */
export async function resetSdkGatewayRegistrationForTests(): Promise<void> {
  if (gateway !== null) {
    await gateway.stop();
  }
  gateway = null;
  primaryInstance = true;
  lastDesktopVersion = "0.0.0";
  if (publishEventIpcRegistered && typeof ipcMain?.removeHandler === "function") {
    ipcMain.removeHandler(IPC_CHANNELS.sdkGatewayPublishEvent);
    publishEventIpcRegistered = false;
  }
  unregisterSdkGatewaySettingsIpcForTests();
}

function registerPublishEventIpc(): void {
  if (publishEventIpcRegistered || typeof ipcMain?.handle !== "function") {
    return;
  }
  publishEventIpcRegistered = true;
  ipcMain.handle(IPC_CHANNELS.sdkGatewayPublishEvent, (_event, payload: unknown) => {
    const parsed = parseSdkGatewayPublishEventIpcPayload(payload);
    if (parsed === null || gateway === null) {
      return { ok: false as const, delivered: 0 };
    }
    const delivered = gateway.publishPublicEvent(parsed.draft);
    return { ok: true as const, delivered };
  });
}
