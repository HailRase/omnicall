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
  const isSecure =
    serverUrl.protocol === "wss:" || serverUrl.protocol === "https:";
  const transportProtocol = isSecure ? "wss" : "ws";
  const inputHasUrlScheme = hasUrlSchemeInInput(normalizedServer);
  const explicitPort =
    serverUrl.port.length > 0 ? Number(serverUrl.port) : null;
  const transportPort =
    explicitPort ??
    (inputHasUrlScheme ? (isSecure ? 443 : 80) : isSecure ? 5063 : 5062);
  const transportPath = normalizeTransportPath(serverUrl.pathname);

  return `${transportProtocol}://${serverHost}:${transportPort}${transportPath}`;
}

function normalizeTransportPath(pathname: string): string {
  if (pathname.length === 0 || pathname === "/") {
    return "/";
  }

  const withoutTrailingSlashes = pathname.replace(/\/+$/u, "");
  return `${withoutTrailingSlashes}/`;
}

function hasUrlSchemeInInput(normalizedServer: string): boolean {
  return (
    normalizedServer.startsWith("http://") ||
    normalizedServer.startsWith("https://") ||
    normalizedServer.startsWith("ws://") ||
    normalizedServer.startsWith("wss://")
  );
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
