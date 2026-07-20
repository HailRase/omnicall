/**
 * Small helpers for LocalWsServerAdapter (DI-03). Keep `ws` usage in adapters only.
 */

import type { Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";

import type { RawData } from "ws";

export function listenHttp(
  server: HttpServer,
  host: string,
  port: number,
): Promise<AddressInfo> {
  return new Promise((resolve, reject) => {
    const onError = (error: Error): void => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = (): void => {
      server.off("error", onError);
      const address = server.address();
      if (address === null || typeof address === "string") {
        reject(new Error("listen_address_unavailable"));
        return;
      }
      resolve(address);
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });
}

export function closeHttpServer(server: HttpServer): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => {
      resolve();
    });
  });
}

export function rawDataToString(data: RawData): string {
  if (typeof data === "string") {
    return data;
  }
  if (Buffer.isBuffer(data)) {
    return data.toString("utf8");
  }
  if (Array.isArray(data)) {
    return Buffer.concat(data).toString("utf8");
  }
  return Buffer.from(data).toString("utf8");
}

export function headerValue(
  value: string | string[] | undefined,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

export function errorCode(error: unknown): string {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return "unknown";
  }
  const code = error.code;
  return typeof code === "string" ? code : "unknown";
}

export type SdkGatewayLogFn = (
  event: string,
  fields: Readonly<Record<string, string | number | boolean>>,
) => void;
