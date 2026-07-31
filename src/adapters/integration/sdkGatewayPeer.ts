/**
 * Loopback peer / bind checks for the SDK gateway (DI-03 / ADR-0010).
 * Origin allowlist helpers live in sdkGatewayOriginPolicy (DI-04).
 */

/** True when the remote socket address is an approved loopback address. */
export function isLoopbackRemoteAddress(address: string | undefined): boolean {
  if (address === undefined || address.length === 0) {
    return false;
  }
  const normalized = address.startsWith("::ffff:")
    ? address.slice("::ffff:".length)
    : address;
  return normalized === "127.0.0.1" || normalized === "::1";
}

/**
 * True when the listen host is an approved loopback bind target (ADR-0010/0015).
 * Rejects `0.0.0.0`, LAN interfaces, and hostnames.
 */
export function isApprovedLoopbackBindHost(host: string): boolean {
  const trimmed = host.trim();
  if (trimmed.length === 0) {
    return false;
  }
  const normalized = trimmed.startsWith("::ffff:")
    ? trimmed.slice("::ffff:".length)
    : trimmed;
  return normalized === "127.0.0.1" || normalized === "::1";
}

