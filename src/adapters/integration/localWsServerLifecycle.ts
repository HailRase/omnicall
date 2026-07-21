/**
 * Start/stop helpers for LocalWsServerAdapter (keeps adapter under size limit).
 */

import type { Server as HttpServer } from "node:http";
import type { WebSocketServer } from "ws";

import { closeHttpServer, type SdkGatewayLogFn } from "./localWsServerHelpers.js";
import { bindLocalWsServer } from "./localWsServerBind.js";
import type { SdkGatewayLimits } from "./sdkGatewayConfig.js";
import {
  createGatewayIdentityShell,
  type SdkGatewayIdentity,
} from "./sdkGatewayMessages.js";
import type { SdkGatewayPairingStore } from "./sdkGatewayPairingStore.js";
import type { SdkOriginTrustEntry } from "@domain/index.js";

import type { SdkOriginTrustApprover } from "./sdkGatewayOriginTrustApprover.js";
import type { SdkPairingApprover } from "./sdkGatewayPairingTypes.js";
import type { SdkGatewayProductSurface } from "./sdkGatewayProductSurface.js";
import { LocalWsSessionRegistry } from "./LocalWsSessionRegistry.js";
import type { WireMessage } from "@axata/axatalk-protocol";
import type { CapabilityId } from "@axata/axatalk-protocol";
import type { ExternalGatewayValidationResult } from "@ports/integration/ExternalClientGateway.js";

export async function bindLocalWsListening(input: {
  readonly desktopVersion: string;
  readonly host: string;
  readonly port: number;
  readonly limits: SdkGatewayLimits;
  readonly pairingStore: SdkGatewayPairingStore;
  readonly pairingApprover: SdkPairingApprover;
  readonly getOriginTrustEntries: () => readonly SdkOriginTrustEntry[];
  readonly originTrustApprover: SdkOriginTrustApprover;
  readonly onOriginTrustDecision: (
    input: Readonly<{
      origin: string;
      decision: Readonly<{ decision: "allow" } | { decision: "deny" }>;
    }>,
  ) => void;
  readonly getOriginMatrixCapabilities: (
    origin: string,
  ) => readonly CapabilityId[];
  readonly getAccepting: () => boolean;
  readonly getListening: () => boolean;
  readonly resolveWsHostPort: () => Readonly<{ host: string; port: number }>;
  readonly getProductSurface: () => SdkGatewayProductSurface | null;
  readonly validateWireInbound: (
    value: unknown,
  ) => ExternalGatewayValidationResult<WireMessage>;
  readonly now: () => Date;
  readonly onLog?: SdkGatewayLogFn;
}): Promise<
  | {
      readonly ok: true;
      readonly host: string;
      readonly port: number;
      readonly identity: SdkGatewayIdentity;
      readonly sessions: LocalWsSessionRegistry;
      readonly httpServer: HttpServer;
      readonly wss: WebSocketServer;
    }
  | { readonly ok: false; readonly code: string }
> {
  const shell = createGatewayIdentityShell(input.desktopVersion);
  const identity: SdkGatewayIdentity = {
    ...shell,
    maxMessageBytes: input.limits.maxMessageBytes,
    heartbeatSeconds: input.limits.heartbeatSeconds,
  };
  let identityRef: SdkGatewayIdentity | null = identity;
  const sessions = new LocalWsSessionRegistry({
    limits: input.limits,
    now: input.now,
    validateWire: (value) => input.validateWireInbound(value),
    getIdentity: () => identityRef,
    pairingStore: input.pairingStore,
    pairingApprover: input.pairingApprover,
    getOriginTrustState: (origin) => {
      const entry = input
        .getOriginTrustEntries()
        .find((row) => row.origin === origin);
      return entry?.state ?? "unknown";
    },
    originTrustApprover: input.originTrustApprover,
    onOriginTrustDecision: input.onOriginTrustDecision,
    getOriginMatrixCapabilities: input.getOriginMatrixCapabilities,
    getProductSurface: input.getProductSurface,
    ...(input.onLog !== undefined ? { onLog: input.onLog } : {}),
  });
  const bound = await bindLocalWsServer({
    host: input.host,
    port: input.port,
    limits: input.limits,
    identity,
    sessions,
    getOriginTrustEntries: input.getOriginTrustEntries,
    getAccepting: input.getAccepting,
    getListening: input.getListening,
    resolveWsHostPort: input.resolveWsHostPort,
    ...(input.onLog !== undefined ? { onLog: input.onLog } : {}),
  });
  if (!bound.ok) {
    identityRef = null;
    return { ok: false, code: bound.code };
  }
  return {
    ok: true,
    host: bound.host,
    port: bound.port,
    identity,
    sessions,
    httpServer: bound.httpServer,
    wss: bound.wss,
  };
}

export async function disposeLocalWsListening(input: {
  readonly sessions: LocalWsSessionRegistry | null;
  readonly wss: WebSocketServer | null;
  readonly httpServer: HttpServer | null;
}): Promise<void> {
  input.sessions?.terminateAll();
  if (input.wss !== null) {
    await new Promise<void>((resolve) => {
      input.wss!.close(() => {
        resolve();
      });
    });
  }
  if (input.httpServer !== null) {
    await closeHttpServer(input.httpServer);
  }
}
