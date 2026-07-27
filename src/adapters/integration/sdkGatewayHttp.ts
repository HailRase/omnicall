/**
 * Tiny loopback HTTP helper for discovery (DI-03 / ADR-0015).
 */

import type { IncomingMessage, ServerResponse } from "node:http";

import {
  DISCOVERY_PATH,
  WS_PATH,
} from "@softomnitel/omnicall-protocol";

import { buildDiscoveryDocument, type SdkGatewayIdentity } from "./sdkGatewayMessages.js";

export function isDiscoveryGet(url: string | undefined, method: string): boolean {
  if (method !== "GET" || url === undefined) {
    return false;
  }
  const pathOnly = url.split("?")[0] ?? url;
  return pathOnly === DISCOVERY_PATH;
}

export function isSdkWsPath(url: string | undefined): boolean {
  if (url === undefined) {
    return false;
  }
  const pathOnly = url.split("?")[0] ?? url;
  return pathOnly === WS_PATH;
}

export function writeDiscoveryResponse(
  res: ServerResponse,
  identity: SdkGatewayIdentity,
  wsUrl: string,
  corsOrigin: string | null = null,
): void {
  const document = buildDiscoveryDocument(identity, wsUrl);
  const body = JSON.stringify(document);
  const headers: Record<string, string | number> = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
  };
  if (corsOrigin !== null) {
    headers["Access-Control-Allow-Origin"] = corsOrigin;
    headers["Vary"] = "Origin";
  }
  res.writeHead(200, headers);
  res.end(body);
}

export function writeNotFound(res: ServerResponse): void {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not Found");
}

export function writeMethodNotAllowed(res: ServerResponse): void {
  res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Method Not Allowed");
}

export function handleDiscoveryHttpRequest(
  req: IncomingMessage,
  res: ServerResponse,
  identity: SdkGatewayIdentity,
  wsUrl: string,
  corsOrigin: string | null = null,
): void {
  const method = req.method ?? "GET";
  if (isDiscoveryGet(req.url, method)) {
    writeDiscoveryResponse(res, identity, wsUrl, corsOrigin);
    return;
  }
  if ((req.url?.split("?")[0] ?? "") === DISCOVERY_PATH) {
    writeMethodNotAllowed(res);
    return;
  }
  writeNotFound(res);
}
