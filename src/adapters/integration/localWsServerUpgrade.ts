/**
 * Upgrade / HTTP gate helpers for LocalWsServerAdapter (DI-03).
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { Duplex } from "node:stream";

import { WS_PATH } from "@axatalk/protocol";
import type { WebSocketServer } from "ws";

import type { SdkGatewaySocket } from "./sdkGatewayConnection.js";
import { handleDiscoveryHttpRequest, isSdkWsPath } from "./sdkGatewayHttp.js";
import type { SdkGatewayIdentity } from "./sdkGatewayMessages.js";
import {
  isLoopbackRemoteAddress,
  isRejectedUpgradeOrigin,
} from "./sdkGatewayPeer.js";
import { headerValue, type SdkGatewayLogFn } from "./localWsServerHelpers.js";

export function serveSdkDiscoveryHttp(input: {
  readonly req: IncomingMessage;
  readonly res: ServerResponse;
  readonly identity: SdkGatewayIdentity | null;
  readonly wsHost: string;
  readonly wsPort: number;
}): void {
  if (input.identity === null) {
    input.res.writeHead(503);
    input.res.end();
    return;
  }
  handleDiscoveryHttpRequest(
    input.req,
    input.res,
    input.identity,
    `ws://${input.wsHost}:${input.wsPort}${WS_PATH}`,
  );
}

export function tryAcceptSdkUpgrade(input: {
  readonly req: IncomingMessage;
  readonly socket: Duplex;
  readonly head: Buffer;
  readonly wss: WebSocketServer;
  readonly accepting: boolean;
  readonly listening: boolean;
  readonly connectionCount: number;
  readonly maxConnections: number;
  readonly onAttach: (ws: SdkGatewaySocket) => void;
  readonly onLog?: SdkGatewayLogFn;
}): boolean {
  if (!input.accepting || !input.listening) {
    input.socket.destroy();
    return false;
  }
  if (!isSdkWsPath(input.req.url)) {
    input.socket.destroy();
    return false;
  }
  if (!isLoopbackRemoteAddress(input.req.socket.remoteAddress)) {
    input.onLog?.("sdk_gateway_upgrade_rejected", { reason: "non_loopback" });
    input.socket.destroy();
    return false;
  }
  if (isRejectedUpgradeOrigin(headerValue(input.req.headers.origin))) {
    input.onLog?.("sdk_gateway_upgrade_rejected", { reason: "null_origin" });
    input.socket.destroy();
    return false;
  }
  if (input.connectionCount >= input.maxConnections) {
    input.onLog?.("sdk_gateway_upgrade_rejected", { reason: "max_connections" });
    input.socket.destroy();
    return false;
  }
  input.wss.handleUpgrade(input.req, input.socket, input.head, (ws) => {
    input.onAttach(ws);
  });
  return true;
}
