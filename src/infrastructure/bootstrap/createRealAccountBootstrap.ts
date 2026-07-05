import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { resolveSettingsAccountKey } from "@application/settings/resolveSettingsAccountKey.js";
import {
  ArbiterMediaGateway,
  BrowserMediaAdapter,
  MockHostIntegrationGateway,
  MockOperatorPlatformGateway,
  JsSipTelephonyAdapter,
  SettingsRepositoryCodecPreferencesAdapter,
  WebSocketOperatorPlatformGateway,
  WebSocketOcpSyncGateway,
  OcpWebSocketTransport,
  resolveOcpWebSocketUrl,
} from "@adapters/index.js";
import { createConsoleLogger } from "@infrastructure/logging/index.js";
import type { Logger } from "@ports/index.js";
import type { LogContext } from "@ports/index.js";
import type { CreateAccountBootstrapOptions } from "./createMockAccountBootstrap.js";
import { createRealBootstrapSettingsRepository } from "./createRealBootstrapSettingsRepository.js";
import { wireOcpInboundToFacade } from "./wireOcpInboundToFacade.js";

function createBootstrapLogger(context: LogContext): Logger {
  return createConsoleLogger(context);
}

function resolveRealSettingsRepository(options: CreateAccountBootstrapOptions) {
  if (options.settingsRepository !== undefined) {
    return options.settingsRepository;
  }

  if (options.profilesStorageRoot === undefined) {
    throw new Error("real_bootstrap_requires_profiles_storage_root");
  }

  if (options.filesystem === undefined) {
    throw new Error("real_bootstrap_requires_filesystem_port");
  }

  return createRealBootstrapSettingsRepository({
    profilesStorageRoot: options.profilesStorageRoot,
    filesystem: options.filesystem,
    bootstrapConfig: options.bootstrapConfig ?? { mode: "sip-only" },
  });
}

function resolveRealOcpWsUrl(options: CreateAccountBootstrapOptions): string | null {
  return resolveOcpWebSocketUrl(
    options.ocpWsUrl,
    options.bootstrapConfig?.ocpDomain,
  );
}

function shouldUseRealOcpGateway(options: CreateAccountBootstrapOptions): boolean {
  const mode = options.bootstrapConfig?.mode ?? "sip-only";
  if (mode !== "ocp") {
    return false;
  }
  return resolveRealOcpWsUrl(options) !== null;
}

/**
 * - Purpose: compose real-adapter AccountBootstrapFacade with JsSIP and optional OCP WS.
 * - Inputs: bootstrap config, profiles storage root, optional filesystem port, OCP WS URL.
 * - Outputs: wired AccountBootstrapFacade with disk-backed settings ready for initialize().
 */
export function createRealAccountBootstrap(
  options: CreateAccountBootstrapOptions = {},
): AccountBootstrapFacade {
  const settingsRepository = resolveRealSettingsRepository(options);
  const codecPreferencesPort = new SettingsRepositoryCodecPreferencesAdapter({
    settingsRepository,
    resolveAccountKey: () => resolveSettingsAccountKey(settingsRepository),
  });

  const operatorLogger = createBootstrapLogger({
    featureId: "F-009",
    boundedContext: "Operator",
  });

  const useRealOcp = shouldUseRealOcpGateway(options);
  const wsUrl = resolveRealOcpWsUrl(options) ?? "";

  const ocpTransport = useRealOcp
    ? new OcpWebSocketTransport({
        wsUrl,
        logger: operatorLogger,
      })
    : null;

  const operatorGateway =
    useRealOcp && ocpTransport !== null
      ? new WebSocketOperatorPlatformGateway({
          transport: ocpTransport,
          logger: operatorLogger,
        })
      : new MockOperatorPlatformGateway({
          scenario: options.ocpScenario ?? "success",
          delayMs: 300,
        });

  const ocpSyncGateway =
    useRealOcp && ocpTransport !== null
      ? new WebSocketOcpSyncGateway({ transport: ocpTransport })
      : undefined;

  const telephonyGateway = new JsSipTelephonyAdapter({
    logger: createBootstrapLogger({ featureId: "F-001", boundedContext: "Telephony" }),
    codecPreferencesPort,
  });
  const mediaGateway = new ArbiterMediaGateway(
    new BrowserMediaAdapter({
      logger: createBootstrapLogger({ featureId: "F-005", boundedContext: "Media" }),
      getPeerConnection: (callId) => telephonyGateway.getPeerConnectionForCall(callId),
    }),
  );
  const hostIntegrationGateway = new MockHostIntegrationGateway();

  const facade = new AccountBootstrapFacade({
    operatorGateway,
    telephonyGateway,
    mediaGateway,
    settingsRepository,
    hostIntegrationGateway,
    ...(ocpSyncGateway !== undefined ? { ocpSyncGateway } : {}),
    logger: createBootstrapLogger({ featureId: "F-001", boundedContext: "Telephony" }),
  });

  wireOcpInboundToFacade(facade, operatorGateway);

  telephonyGateway.setPeerConnectionBoundHandler(async (notification) => {
    await facade.notifyPeerConnectionAvailable(
      notification.callId,
      notification.correlationId,
    );
  });

  return facade;
}
