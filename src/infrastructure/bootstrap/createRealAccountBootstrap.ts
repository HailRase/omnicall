import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  BrowserMediaAdapter,
  MockHostIntegrationGateway,
  MockOperatorPlatformGateway,
  JsSipTelephonyAdapter,
  InMemorySettingsRepository,
} from "@adapters/index.js";
import { createConsoleLogger } from "@infrastructure/logging/index.js";
import type { Logger } from "@ports/index.js";
import type { LogContext } from "@ports/index.js";
import type { CreateAccountBootstrapOptions } from "./createMockAccountBootstrap.js";

function createBootstrapLogger(context: LogContext): Logger {
  return createConsoleLogger(context);
}

/**
 * - Purpose: compose real-adapter AccountBootstrapFacade with JsSIP telephony gateway.
 * - Inputs: bootstrap config and optional mock scenario overrides for non-SIP gateways.
 * - Outputs: wired AccountBootstrapFacade ready for initialize().
 */
export function createRealAccountBootstrap(
  options: CreateAccountBootstrapOptions = {},
): AccountBootstrapFacade {
  const settingsRepository = new InMemorySettingsRepository({
    bootstrapConfig: options.bootstrapConfig ?? { mode: "sip-only" },
  });

  const operatorGateway = new MockOperatorPlatformGateway({
    scenario: options.ocpScenario ?? "success",
    delayMs: 300,
  });

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
    logger: createBootstrapLogger({ featureId: "F-001", boundedContext: "Telephony" }),
  });

  telephonyGateway.setPeerConnectionBoundHandler(async (notification) => {
    await facade.notifyPeerConnectionAvailable(
      notification.callId,
      notification.correlationId,
    );
  });

  return facade;
}
