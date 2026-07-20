/**
 * DI-10 browser smoke: Edge/Chromium page Origin → packaged desktop gateway.
 *
 * Prerequisites:
 * - Packaged Axatalk running with:
 *   AXATALK_SDK_ALLOWED_ORIGINS=http://127.0.0.1:8765
 *
 * Usage:
 *   node axatalk-sdk-integration/scripts/di10-browser-smoke.mjs
 */

import { createServer } from "node:http";
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";

const PORT = 8765;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const __dirname = dirname(fileURLToPath(import.meta.url));
const pagePath = join(__dirname, "di10-browser-smoke-page.html");
const evidenceDir = join(__dirname, "..", "evidence");
const reportPath = join(evidenceDir, "DI-10-browser-smoke-report.json");

const edgeCandidates = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

/**
 * @param {string} text
 * @returns {string | undefined}
 */
function extractVersion(text) {
  const match = text.match(/(\d+\.\d+\.\d+\.\d+)/);
  return match?.[1];
}

/**
 * @param {string} browserPath
 * @returns {string | undefined}
 */
function readBrowserVersion(browserPath) {
  try {
    const result = spawnSync(browserPath, ["--version"], {
      encoding: "utf8",
      timeout: 5_000,
      windowsHide: true,
    });
    const fromFlag = extractVersion(`${result.stdout ?? ""}${result.stderr ?? ""}`);
    if (fromFlag !== undefined) {
      return fromFlag;
    }
  } catch {
    // fall through — Windows Edge often rejects --version
  }

  if (process.platform === "win32") {
    try {
      const ps = spawnSync(
        "powershell.exe",
        [
          "-NoProfile",
          "-Command",
          `(Get-Item -LiteralPath '${browserPath.replace(/'/g, "''")}').VersionInfo.ProductVersion`,
        ],
        { encoding: "utf8", timeout: 5_000, windowsHide: true },
      );
      return extractVersion(`${ps.stdout ?? ""}`.trim());
    } catch {
      return undefined;
    }
  }

  return undefined;
}

async function main() {
  await mkdir(evidenceDir, { recursive: true });
  const html = await readFile(pagePath);

  /** @type {{ lines: string[] } | null} */
  let lastReport = null;
  /** @type {(value: string) => void} */
  let resolveDone;
  const donePromise = new Promise((resolve) => {
    resolveDone = resolve;
  });

  const server = createServer(async (req, res) => {
    if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }
    if (req.method === "POST" && req.url === "/report") {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      try {
        lastReport = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      } catch {
        lastReport = null;
      }
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.method === "POST" && req.url === "/done") {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      resolveDone(Buffer.concat(chunks).toString("utf8") || "ok");
      res.writeHead(204);
      res.end();
      return;
    }
    res.writeHead(404);
    res.end("not found");
  });

  await new Promise((resolve) => {
    server.listen(PORT, "127.0.0.1", resolve);
  });

  let browserPath = edgeCandidates[0];
  for (const candidate of edgeCandidates) {
    try {
      await access(candidate);
      browserPath = candidate;
      break;
    } catch {
      // try next
    }
  }
  const browserVersion = readBrowserVersion(browserPath);

  const child = spawn(
    browserPath,
    [
      `--user-data-dir=${join(evidenceDir, ".di10-edge-profile")}`,
      "--no-first-run",
      "--disable-extensions",
      `${ORIGIN}/`,
    ],
    { stdio: "ignore", detached: true },
  );
  child.unref();

  const done = await Promise.race([
    donePromise,
    new Promise((resolve) => {
      setTimeout(() => {
        resolve("timeout");
      }, 20_000);
    }),
  ]);

  const lines = lastReport?.lines ?? [];
  const passHandshake = lines.some((line) => line.includes("PASS packaged.browser_handshake"));
  const passOpen = lines.some((line) => line.includes("PASS packaged.browser_ws_open"));
  const report = {
    date: new Date().toISOString(),
    mode: "packaged-electron + Edge Chromium page",
    origin: ORIGIN,
    browserPath,
    ...(browserVersion !== undefined ? { browserVersion } : {}),
    done,
    lines,
    cells: [
      {
        id: "packaged.browser_ws_open",
        result: passOpen ? "PASS" : "FAIL",
      },
      {
        id: "packaged.browser_handshake",
        result: passHandshake ? "PASS" : "FAIL",
      },
    ],
  };
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
  server.close();
  if (!passOpen || !passHandshake) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
