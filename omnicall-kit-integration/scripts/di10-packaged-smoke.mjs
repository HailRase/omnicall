/**
 * DI-10 packaged process smoke (Node WS client against live desktop gateway).
 * Does NOT replace browser E2E; records discovery / Origin / incompat cells only.
 *
 * Usage (desktop already running with OMNICALL_SDK_ALLOWED_ORIGINS set):
 *   node omnicall-kit-integration/scripts/di10-packaged-smoke.mjs
 */

import { once } from "node:events";
import { mkdir, writeFile } from "node:fs/promises";
import http from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import WebSocket from "ws";

const DISCOVERY_PORT = 17341;
const DISCOVERY_PATH = "/omnicall/v1/discovery";
const WS_PATH = "/omnicall/v1/ws";
const APPROVED_ORIGIN =
  process.env["OMNICALL_SDK_SMOKE_ORIGIN"] ?? "https://di10-test.example";
const HOSTILE_ORIGIN = "https://hostile.example";

const __dirname = dirname(fileURLToPath(import.meta.url));
const evidenceDir = join(__dirname, "..", "evidence");
const reportPath = join(evidenceDir, "DI-10-packaged-smoke-report.json");

/** @type {Array<{ id: string; result: string; detail?: string }>} */
const cells = [];

function record(id, result, detail) {
  cells.push({ id, result, ...(detail !== undefined ? { detail } : {}) });
  const mark = result === "PASS" ? "PASS" : result;
  console.log(`[${mark}] ${id}${detail ? ` — ${detail}` : ""}`);
}

async function fetchDiscovery() {
  const url = `http://127.0.0.1:${DISCOVERY_PORT}${DISCOVERY_PATH}`;
  const response = await fetch(url, { redirect: "manual" });
  const text = await response.text();
  return { status: response.status, text };
}

function openWs(origin) {
  const ws = new WebSocket(`ws://127.0.0.1:${DISCOVERY_PORT}${WS_PATH}`, {
    headers: { Origin: origin },
  });
  ws.on("error", () => {
    /* fail-closed upgrade errors are expected for hostile Origins */
  });
  return ws;
}

async function waitOpenOrClose(ws, timeoutMs = 5_000) {
  return await Promise.race([
    once(ws, "open").then(() => "open"),
    once(ws, "close").then(() => "close"),
    once(ws, "unexpected-response").then(() => "rejected"),
    once(ws, "error").then(() => "error"),
    new Promise((resolve) => {
      setTimeout(() => {
        resolve("timeout");
      }, timeoutMs);
    }),
  ]);
}

async function main() {
  await mkdir(evidenceDir, { recursive: true });

  try {
    const discovery = await fetchDiscovery();
    if (discovery.status === 200 && discovery.text.includes("omnicall")) {
      const body = JSON.parse(discovery.text);
      const hasSecrets =
        /password|apiKey|token|privateKey/i.test(discovery.text) === true;
      record(
        "packaged.discovery",
        hasSecrets ? "FAIL" : "PASS",
        hasSecrets
          ? "secret-shaped fields in discovery"
          : `desktopVersion=${String(body.desktopVersion ?? "?")}`,
      );
    } else {
      record(
        "packaged.discovery",
        "FAIL",
        `HTTP ${discovery.status}; is OmniCall running with gateway enabled?`,
      );
    }
  } catch (error) {
    record(
      "packaged.discovery",
      "FAIL",
      error instanceof Error ? error.message : "discovery unreachable",
    );
  }

  {
    const hostileOutcome = await new Promise((resolve) => {
      const req = http.request(
        {
          host: "127.0.0.1",
          port: DISCOVERY_PORT,
          path: WS_PATH,
          headers: {
            Connection: "Upgrade",
            Upgrade: "websocket",
            Origin: HOSTILE_ORIGIN,
            "Sec-WebSocket-Version": "13",
            "Sec-WebSocket-Key": "dGhlIHNhbXBsZSBub25jZQ==",
          },
        },
        (res) => {
          resolve(`http_${res.statusCode}`);
          res.resume();
        },
      );
      req.on("upgrade", () => {
        resolve("upgraded");
      });
      req.on("error", (error) => {
        resolve(`error:${error.code ?? error.message}`);
      });
      req.setTimeout(5_000, () => {
        req.destroy();
        resolve("timeout");
      });
      req.end();
    });
    if (hostileOutcome === "upgraded") {
      record("packaged.hostile_origin", "FAIL", "hostile Origin accepted upgrade");
    } else {
      record(
        "packaged.hostile_origin",
        "PASS",
        `upgrade denied (${hostileOutcome})`,
      );
    }
  }

  {
    const ws = openWs(APPROVED_ORIGIN);
    const outcome = await waitOpenOrClose(ws);
    if (outcome !== "open") {
      record(
        "packaged.approved_origin_connect",
        "FAIL",
        `expected open, got ${outcome}; set OMNICALL_SDK_ALLOWED_ORIGINS=${APPROVED_ORIGIN}`,
      );
      ws.terminate();
    } else {
      record("packaged.approved_origin_connect", "PASS");
      let messages = 0;
      ws.on("message", () => {
        messages += 1;
      });
      ws.send(
        JSON.stringify({
          protocolVersion: 99,
          kind: "handshake",
          type: "sdk:client-hello",
          protocolMin: 99,
          protocolMax: 99,
          sdkVersion: "9.9.9-incompat",
          application: { name: "di10-smoke", version: "0.0.0" },
          requestedCapabilities: ["session.read.redacted", "call.originate"],
          clientNonce: "Y2xpZW50bm9uY2UxMjM",
          occurredAt: new Date().toISOString(),
        }),
      );
      const closed = await Promise.race([
        once(ws, "close").then(() => "close"),
        new Promise((resolve) => {
          setTimeout(() => {
            resolve("timeout");
          }, 5_000);
        }),
      ]);
      if (closed === "close" && messages === 0) {
        record(
          "packaged.incompatible_version",
          "PASS",
          "closed with zero product messages",
        );
      } else {
        record(
          "packaged.incompatible_version",
          "FAIL",
          `close=${closed} messages=${messages}`,
        );
      }
      ws.terminate();
    }
  }

  {
    const ws = openWs(APPROVED_ORIGIN);
    const outcome = await waitOpenOrClose(ws);
    if (outcome !== "open") {
      record("packaged.current_handshake", "FAIL", outcome);
      ws.terminate();
    } else {
      const helloPromise = once(ws, "message").then(([data]) => {
        const text = typeof data === "string" ? data : data.toString("utf8");
        return JSON.parse(text);
      });
      ws.send(
        JSON.stringify({
          protocolVersion: 1,
          kind: "handshake",
          type: "sdk:client-hello",
          protocolMin: 1,
          protocolMax: 1,
          sdkVersion: "0.0.0-di10",
          application: { name: "di10-smoke", version: "0.0.0" },
          requestedCapabilities: ["session.read.redacted"],
          clientNonce: "Y2xpZW50bm9uY2UxMjM",
          occurredAt: new Date().toISOString(),
        }),
      );
      const hello = await Promise.race([
        helloPromise,
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(null);
          }, 5_000);
        }),
      ]);
      if (
        hello !== null &&
        hello.type === "sdk:server-hello" &&
        hello.pairingRequired === true
      ) {
        record(
          "packaged.current_handshake",
          "PASS",
          "server-hello pairingRequired; no product state",
        );
      } else {
        record(
          "packaged.current_handshake",
          "FAIL",
          hello === null ? "timeout" : `type=${String(hello.type)}`,
        );
      }
      ws.close();
      ws.terminate();
    }
  }

  const passCount = cells.filter((c) => c.result === "PASS").length;
  const failCount = cells.filter((c) => c.result === "FAIL").length;
  const report = {
    date: new Date().toISOString(),
    mode: "packaged-process-node-ws",
    note: "Node ws client against packaged Electron gateway — not browser Playwright E2E",
    approvedOrigin: APPROVED_ORIGIN,
    cells,
    summary: { passCount, failCount, total: cells.length },
  };
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Wrote ${reportPath}`);
  console.log(`Summary: ${passCount} PASS / ${failCount} FAIL of ${cells.length}`);
  if (failCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
