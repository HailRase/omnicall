/**
 * Electron main registration for the loopback SDK WebSocket gateway (DI-03/DI-04).
 * Does not import Domain or Facades. Gateway failure must not block softphone.
 */

import { join } from "node:path";

import { LocalWsServerAdapter } from "@adapters/integration/LocalWsServerAdapter.js";
import { createConsoleLogger } from "@infrastructure/logging/index.js";
import { resolveAxatalkProfilesStorageRoot } from "@infrastructure/bootstrap/resolveAxatalkProfilesStorageRoot.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { app } from "electron";

import { ElectronSafeStorageSecretService } from "../secrets/ElectronSafeStorageSecretService.js";
import { MainProcessSecretStorageAdapter } from "../secrets/MainProcessSecretStorageAdapter.js";

const logger = createConsoleLogger({
  boundedContext: "Integration",
  featureId: "F-011",
});

let gateway: LocalWsServerAdapter | null = null;
let primaryInstance = true;

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
}): Promise<LocalWsServerAdapter | null> {
  if (gateway !== null) {
    return gateway;
  }

  const enabled =
    options.enabled ?? process.env["AXATALK_SDK_GATEWAY"] !== "0";

  gateway = new LocalWsServerAdapter({
    desktopVersion: options.desktopVersion,
    enabled,
    mayClaimEndpoint: () => primaryInstance,
    ...(enabled ? { secretStorage: createGatewaySecretStorage() } : {}),
    onLog: (event, fields) => {
      logger.info(event, {
        correlationId: createCorrelationId(),
        operation: "sdk_gateway",
        ...fields,
      });
    },
  });

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
}
