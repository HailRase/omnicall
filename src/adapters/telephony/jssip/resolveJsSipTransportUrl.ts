/**
 * - Purpose: normalize SIP server input into JsSIP WebSocket transport URL.
 * - Inputs: server string (host:port, ws/wss URL, or http/https URL).
 * - Outputs: transport URL with trailing slash (legacy softphone parity).
 */
export function resolveJsSipTransportUrl(server: string): string {
  const normalizedServer = server.trim().replace(/\/+$/u, "");
  if (normalizedServer.length === 0) {
    throw new Error("SIP server is required");
  }

  const serverUrl = parseServerUrl(normalizedServer);
  const serverHost = serverUrl.hostname;
  const serverPort = serverUrl.port.length > 0 ? Number(serverUrl.port) : undefined;
  const isSecure =
    serverUrl.protocol === "wss:" || serverUrl.protocol === "https:";
  const transportProtocol = isSecure ? "wss" : "ws";
  const transportPort = serverPort ?? (isSecure ? 5063 : 5062);

  return `${transportProtocol}://${serverHost}:${transportPort}/`;
}

function parseServerUrl(normalizedServer: string): URL {
  try {
    if (
      normalizedServer.startsWith("http://") ||
      normalizedServer.startsWith("https://") ||
      normalizedServer.startsWith("ws://") ||
      normalizedServer.startsWith("wss://")
    ) {
      return new URL(normalizedServer);
    }

    return new URL(`wss://${normalizedServer}`);
  } catch {
    throw new Error(`Invalid SIP server URL: ${normalizedServer}`);
  }
}
