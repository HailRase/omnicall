import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { EXTERNAL_SERVICES_HTTP_TIMEOUT_MS } from "@shared/ipc/ExternalServicesHttpContract.js";
import { executeExternalServicesHttpRequest } from "./executeExternalServicesHttpRequest.js";

type RequestListener = (
  req: IncomingMessage,
  res: ServerResponse,
) => void;

const servers: Array<ReturnType<typeof createServer>> = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }
            resolve();
          });
        }),
    ),
  );
});

async function listen(handler: RequestListener): Promise<string> {
  const server = createServer(handler);
  servers.push(server);
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

describe("executeExternalServicesHttpRequest", () => {
  it("returns 2xx bodies and strips protected headers on cross-origin redirects", async () => {
    let sawAuthorizationOnSecondHop = false;
    const finalUrl = await listen((req, res) => {
      sawAuthorizationOnSecondHop = req.headers.authorization !== undefined;
      res.statusCode = 200;
      res.end("final-body");
    });
    const startUrl = await listen((_req, res) => {
      res.statusCode = 302;
      res.setHeader("Location", `${finalUrl}/final`);
      res.end();
    });

    const result = await executeExternalServicesHttpRequest(
      {
        method: "POST",
        url: `${startUrl}/start`,
        headers: [{ key: "Authorization", value: "Bearer secret" }],
        body: "{}",
        timeoutMs: EXTERNAL_SERVICES_HTTP_TIMEOUT_MS,
        correlationId: createCorrelationId(),
      },
      new AbortController().signal,
    );

    expect(result).toMatchObject({
      kind: "response",
      status: 200,
      body: "final-body",
    });
    expect(sawAuthorizationOnSecondHop).toBe(false);
  });

  it("maps abort timeout to timeout transport code", async () => {
    const baseUrl = await listen((_req, res) => {
      setTimeout(() => {
        res.statusCode = 200;
        res.end("late");
      }, 50);
    });
    const controller = new AbortController();
    controller.abort("timeout");

    const result = await executeExternalServicesHttpRequest(
      {
        method: "GET",
        url: `${baseUrl}/slow`,
        headers: [],
        body: null,
        timeoutMs: EXTERNAL_SERVICES_HTTP_TIMEOUT_MS,
        correlationId: createCorrelationId(),
      },
      controller.signal,
    );

    expect(result).toMatchObject({
      kind: "network_error",
      code: "timeout",
    });
  });
});
