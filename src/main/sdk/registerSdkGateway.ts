/**
 * Electron main registration for the loopback SDK WebSocket gateway (DI-03…DI-11).
 * Does not import Domain Facades. Gateway failure must not block softphone.
 */

import { LocalWsServerAdapter } from "@adapters/integration/LocalWsServerAdapter.js";
import {
  loadSdkOriginAllowlistFromEnv,
  mergePersistedOriginTrustWithEnvSeed,
} from "@adapters/integration/sdkGatewayOriginPolicy.js";
import {
  hydrateSdkOriginTrustForGatewayBoot,
  persistSdkOriginTrustMachineFromEntries,
} from "@adapters/integration/sdkOriginTrustMachineStore.js";
import type { SdkOriginTrustEntry } from "@domain/index.js";
import { resolveOmniCallProfilesStorageRoot } from "@infrastructure/bootstrap/resolveOmniCallProfilesStorageRoot.js";
import { createConsoleLogger } from "@infrastructure/logging/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type {
  SdkGatewaySettingsPolicyPayload,
} from "@shared/ipc/SdkGatewaySettingsContract.js";
import { BrowserWindow, app } from "electron";

import { createSdkGatewayProductSurface } from "./createSdkGatewayProductSurface.js";
import { getSdkBroker } from "./registerSdkBrokerIpc.js";
import {
  registerSdkGatewaySettingsIpc,
  unregisterSdkGatewaySettingsIpcForTests,
} from "./registerSdkGatewaySettingsIpc.js";
import {
  createSdkGatewaySecretStorage,
  registerSdkGatewayPublishEventIpc,
  unregisterSdkGatewayPublishEventIpcForTests,
} from "./sdkGatewayRegistrationHelpers.js";
import type { ShellWindowAttentionController } from "../shellWindow/ShellWindowAttentionController.js";
import { SdkHideTrayController } from "../shellWindow/SdkHideTrayController.js";
import { ShellTelephonyBusyMirror } from "../shellWindow/ShellTelephonyBusyMirror.js";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import type { ShellOperatorAttentionPayload } from "@shared/ipc/ShellWindowRaiseContract.js";

const logger = createConsoleLogger({
  boundedContext: "Integration",
  featureId: "F-011",
});

let gateway: LocalWsServerAdapter | null = null;
let primaryInstance = true;
let lastDesktopVersion = "0.0.0";
let originTrustStorageRoot: string | null = null;
let shellWindowAttention: ShellWindowAttentionController | null = null;
let telephonyBusyMirror: ShellTelephonyBusyMirror | null = null;
let hideTrayController: SdkHideTrayController | null = null;

export function setShellWindowAttentionController(
  controller: ShellWindowAttentionController | null,
): void {
  shellWindowAttention = controller;
}

export function getShellWindowAttentionController(): ShellWindowAttentionController | null {
  return shellWindowAttention;
}

export function getShellTelephonyBusyMirror(): ShellTelephonyBusyMirror {
  if (telephonyBusyMirror === null) {
    telephonyBusyMirror = new ShellTelephonyBusyMirror();
  }
  return telephonyBusyMirror;
}

export function getSdkHideTrayController(): SdkHideTrayController {
  if (hideTrayController === null) {
    hideTrayController = new SdkHideTrayController({
      getMainWindow: () => BrowserWindow.getAllWindows()[0] ?? null,
      log: (event, fields) => {
        logger.info(event, {
          correlationId: createCorrelationId(),
          operation: "sdk_hide_tray",
          ...fields,
        });
      },
    });
  }
  return hideTrayController;
}

function broadcastOperatorAttention(
  payload: ShellOperatorAttentionPayload,
): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (window.isDestroyed()) {
      continue;
    }
    window.webContents.send(IPC_CHANNELS.shellOperatorAttention, payload);
  }
}

function handleSdkPairingPending(pairingRequestId: string): void {
  shellWindowAttention?.raise({
    reason: "sdk_pairing",
    dedupeKey: pairingRequestId,
  });
  broadcastOperatorAttention({ kind: "sdk_pairing" });
}

function handleSdkOriginTrustPending(originTrustRequestId: string): void {
  shellWindowAttention?.raise({
    reason: "sdk_origin_trust",
    dedupeKey: originTrustRequestId,
  });
  broadcastOperatorAttention({ kind: "sdk_origin_trust" });
}

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
 * Hydrates machine-common Origin trust before listen/upgrade (DI-11).
 */
export async function startSdkGateway(options: {
  readonly desktopVersion: string;
  readonly allowedOrigins?: readonly string[];
  readonly originTrustEntries?: readonly SdkOriginTrustEntry[];
  /** Test override — skip disk hydrate when entries provided. */
  readonly skipOriginTrustHydrate?: boolean;
}): Promise<LocalWsServerAdapter | null> {
  if (gateway !== null) {
    return gateway;
  }

  lastDesktopVersion = options.desktopVersion;
  registerSdkGatewayPublishEventIpc(
    () => gateway,
    (reason) => {
      logger.warn("sdk_gateway_publish_event_dropped", {
        operation: "sdk_gateway_publish_event",
        reason,
        result: "error",
      });
    },
  );
  registerSdkGatewaySettingsIpc({
    getGateway: () => gateway,
    applyPolicy: (policy) => applySdkGatewayPolicy(policy),
  });

  const killSwitchOff = process.env["OMNICALL_SDK_GATEWAY"] === "0";
  const bootTrust = await resolveBootOriginTrustEntries(options);
  // Fail-closed: corrupt/unreadable machine store → do not listen (no env-only reopen).
  const enabled = !killSwitchOff && bootTrust.ok;

  gateway = new LocalWsServerAdapter({
    desktopVersion: options.desktopVersion,
    enabled,
    mayClaimEndpoint: () => primaryInstance,
    originTrustEntries: bootTrust.originTrustEntries,
    ...(enabled ? { secretStorage: createSdkGatewaySecretStorage() } : {}),
    onOriginTrustChanged: (entries) => {
      void persistLiveOriginTrust(entries);
    },
    onPairingPending: (pending) => {
      handleSdkPairingPending(pending.pairingRequestId);
    },
    onOriginTrustPending: (pending) => {
      handleSdkOriginTrustPending(pending.originTrustRequestId);
    },
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
        telephonyBusy: getShellTelephonyBusyMirror(),
        hideTray: getSdkHideTrayController(),
      }),
    );
  }

  const result = await gateway.start();
  if (!result.ok) {
    logger.info(
      result.reason === "disabled"
        ? "sdk_gateway_start_skipped"
        : "sdk_gateway_start_failed",
      {
        correlationId: createCorrelationId(),
        operation: "sdk_gateway_start",
        result: !bootTrust.ok ? "origin_trust_hydrate_failed" : result.reason,
      },
    );
    return gateway;
  }

  logger.info("sdk_gateway_start_ok", {
    correlationId: createCorrelationId(),
    operation: "sdk_gateway_start",
    result: "listening",
    host: result.host,
    port: result.port,
    originTrustCount: gateway.getOriginTrustEntries().length,
  });
  return gateway;
}

/**
 * Rebuild gateway trust from Settings policy (exact origins + matrix).
 * Does not tear SIP/account sessions. Env seed merges; denied always wins.
 */
export async function applySdkGatewayPolicy(
  policy: SdkGatewaySettingsPolicyPayload,
): Promise<LocalWsServerAdapter | null> {
  const seed = loadSdkOriginAllowlistFromEnv();
  const originTrustEntries = mergePersistedOriginTrustWithEnvSeed(
    policy.origins,
    seed,
  );

  if (gateway !== null) {
    gateway.setOriginTrustEntries(originTrustEntries);
    if (policy.operatorModalTimeouts !== undefined) {
      gateway.setOperatorModalTimeouts(policy.operatorModalTimeouts);
    }
    return gateway;
  }

  return startSdkGateway({
    desktopVersion: lastDesktopVersion,
    originTrustEntries,
    skipOriginTrustHydrate: true,
  });
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

/** Test-only reset. */
export async function resetSdkGatewayRegistrationForTests(): Promise<void> {
  if (gateway !== null) {
    await gateway.stop();
  }
  gateway = null;
  primaryInstance = true;
  lastDesktopVersion = "0.0.0";
  originTrustStorageRoot = null;
  unregisterSdkGatewayPublishEventIpcForTests();
  unregisterSdkGatewaySettingsIpcForTests();
}

type BootOriginTrustResolution =
  | Readonly<{ ok: true; originTrustEntries: readonly SdkOriginTrustEntry[] }>
  | Readonly<{ ok: false; originTrustEntries: readonly [] }>;

async function resolveBootOriginTrustEntries(options: {
  readonly allowedOrigins?: readonly string[];
  readonly originTrustEntries?: readonly SdkOriginTrustEntry[];
  readonly skipOriginTrustHydrate?: boolean;
}): Promise<BootOriginTrustResolution> {
  if (options.originTrustEntries !== undefined) {
    if (options.allowedOrigins !== undefined) {
      return {
        ok: true,
        originTrustEntries: mergePersistedOriginTrustWithEnvSeed(
          options.originTrustEntries,
          options.allowedOrigins,
        ),
      };
    }
    return { ok: true, originTrustEntries: options.originTrustEntries };
  }

  if (options.skipOriginTrustHydrate === true) {
    const seed = options.allowedOrigins ?? loadSdkOriginAllowlistFromEnv();
    return {
      ok: true,
      originTrustEntries: mergePersistedOriginTrustWithEnvSeed([], seed),
    };
  }

  const defaultStorageRoot = resolveOmniCallProfilesStorageRoot(
    app.getPath("userData"),
  );

  try {
    const hydrated = await hydrateSdkOriginTrustForGatewayBoot({
      storageRoot: defaultStorageRoot,
    });
    originTrustStorageRoot = hydrated.storageRoot;
    return { ok: true, originTrustEntries: hydrated.originTrustEntries };
  } catch (error: unknown) {
    logger.warn("sdk_gateway_origin_trust_hydrate_failed", {
      correlationId: createCorrelationId(),
      operation: "sdk_gateway_start",
      result: "hydrate_failed_fail_closed",
      code: error instanceof Error ? error.name : "unknown",
    });
    originTrustStorageRoot = defaultStorageRoot;
    // Fail-closed: empty trust + do not listen (caller sets enabled=false).
    // Never reopen blacklist via env seed alone.
    return { ok: false, originTrustEntries: [] };
  }
}

async function persistLiveOriginTrust(
  entries: readonly SdkOriginTrustEntry[],
): Promise<void> {
  const storageRoot =
    originTrustStorageRoot ??
    resolveOmniCallProfilesStorageRoot(app.getPath("userData"));
  try {
    await persistSdkOriginTrustMachineFromEntries({
      storageRoot,
      origins: entries,
      originsManaged: true,
    });
  } catch (error: unknown) {
    logger.warn("sdk_gateway_origin_trust_persist_failed", {
      correlationId: createCorrelationId(),
      operation: "sdk_gateway_origin_trust",
      result: "persist_failed",
      code: error instanceof Error ? error.name : "unknown",
    });
  }
}
