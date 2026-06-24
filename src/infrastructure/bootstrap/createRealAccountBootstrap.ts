import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  BrowserMediaAdapter,
  MockHostIntegrationGateway,
  MockOperatorPlatformGateway,
  JsSipTelephonyAdapter,
  InMemorySettingsRepository,
  WebSocketOperatorPlatformGateway,
  WebSocketOcpSyncGateway,
  OcpWebSocketTransport,
  resolveOcpWebSocketUrl,
} from "@adapters/index.js";
import { createConsoleLogger } from "@infrastructure/logging/index.js";
import type { Logger } from "@ports/index.js";
import type { LogContext } from "@ports/index.js";
import type { CreateAccountBootstrapOptions } from "./createMockAccountBootstrap.js";
import { wireOcpInboundToFacade } from "./wireOcpInboundToFacade.js";

function createBootstrapLogger(context: LogContext): Logger {
  return createConsoleLogger(context);
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
 * - Inputs: bootstrap config, optional OCP WS URL, mock scenario overrides for SIP-only.
 * - Outputs: wired AccountBootstrapFacade ready for initialize().
 */
export function createRealAccountBootstrap(
  options: CreateAccountBootstrapOptions = {},
): AccountBootstrapFacade {
  const settingsRepository = new InMemorySettingsRepository({
    bootstrapConfig: options.bootstrapConfig ?? { mode: "sip-only" },
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
  });
  const mediaGateway = new BrowserMediaAdapter({
    logger: createBootstrapLogger({ featureId: "F-005", boundedContext: "Media" }),
    getPeerConnection: (callId) => telephonyGateway.getPeerConnectionForCall(callId),
  });
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
