/**
 * HTTP/WS bind bootstrap for LocalWsServerAdapter (DI-03/DI-04).
 */

import { createServer, type Server as HttpServer } from "node:http";

import { DISCOVERY_PATH } from "@axatalk/protocol";
import { WebSocketServer } from "ws";

import type { SdkGatewayLimits } from "./sdkGatewayConfig.js";
import type { SdkGatewayIdentity } from "./sdkGatewayMessages.js";
import { errorCode, listenHttp, type SdkGatewayLogFn } from "./localWsServerHelpers.js";
import {
  serveSdkDiscoveryHttp,
  tryAcceptSdkUpgrade,
} from "./localWsServerUpgrade.js";
import type { LocalWsSessionRegistry } from "./LocalWsSessionRegistry.js";

export type LocalWsBindResult =
  | {
      readonly ok: true;
      readonly httpServer: HttpServer;
      readonly wss: WebSocketServer;
      readonly host: string;
      readonly port: number;
    }
  | { readonly ok: false; readonly code: string };

export async function bindLocalWsServer(input: {
  readonly host: string;
  readonly port: number;
  readonly limits: SdkGatewayLimits;
  readonly identity: SdkGatewayIdentity;
  readonly sessions: LocalWsSessionRegistry;
  readonly allowedOrigins: readonly string[];
  readonly getAccepting: () => boolean;
  readonly getListening: () => boolean;
  readonly resolveWsHostPort: () => Readonly<{ host: string; port: number }>;
  readonly onLog?: SdkGatewayLogFn;
}): Promise<LocalWsBindResult> {
  const httpServer = createServer((req, res) => {
    const bound = input.resolveWsHostPort();
    serveSdkDiscoveryHttp({
      req,
      res,
      identity: input.identity,
      wsHost: bound.host,
      wsPort: bound.port,
    });
  });
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: input.limits.maxMessageBytes,
    clientTracking: false,
  });
  httpServer.on("upgrade", (req, socket, head) => {
    tryAcceptSdkUpgrade({
      req,
      socket,
      head,
      wss,
      accepting: input.getAccepting(),
      listening: input.getListening(),
      connectionCount: input.sessions.size,
      maxConnections: input.limits.maxConnections,
      allowedOrigins: input.allowedOrigins,
      onAttach: (ws, origin) => {
        input.sessions.attach(ws, origin);
      },
      ...(input.onLog !== undefined ? { onLog: input.onLog } : {}),
    });
  });

  try {
    await listenHttp(httpServer, input.host, input.port);
  } catch (error: unknown) {
    httpServer.close();
    return { ok: false, code: errorCode(error) };
  }

  const address = httpServer.address();
  if (address === null || typeof address === "string") {
    httpServer.close();
    return { ok: false, code: "bind_failed" };
  }

  input.onLog?.("sdk_gateway_listening", {
    host: address.address,
    port: address.port,
    discoveryPath: DISCOVERY_PATH,
    originAllowlistSize: input.allowedOrigins.length,
  });

  return {
    ok: true,
    httpServer,
    wss,
    host: address.address,
    port: address.port,
  };
}
