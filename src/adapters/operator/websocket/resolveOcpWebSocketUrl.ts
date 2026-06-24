/**
 * - Purpose: normalize OCP WebSocket URL from env or domain override.
 * - Inputs: explicit ws URL or OCP domain host.
 * - Outputs: wss URL with trailing slash when path omitted.
 */
export function resolveOcpWebSocketUrl(
  wsUrl: string | undefined,
  domain: string | undefined,
): string | null {
  const explicit = normalizeWsUrl(wsUrl);
  if (explicit !== null) {
    return explicit;
  }

  const host = domain?.trim() ?? "";
  if (host.length === 0) {
    return null;
  }

  if (host.startsWith("ws://") || host.startsWith("wss://")) {
    return normalizeWsUrl(host);
  }

  return `wss://${host.replace(/\/+$/, "")}/ws/`;
}

function normalizeWsUrl(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.startsWith("http://")) {
    return `ws://${trimmed.slice("http://".length).replace(/\/+$/, "")}/`;
  }

  if (trimmed.startsWith("https://")) {
    return `wss://${trimmed.slice("https://".length).replace(/\/+$/, "")}/`;
  }

  if (trimmed.startsWith("ws://") || trimmed.startsWith("wss://")) {
    return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
  }

  return `wss://${trimmed.replace(/\/+$/, "")}/ws/`;
}
