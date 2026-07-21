/**
 * Main-process Settings ops for the local SDK gateway (DI-09).
 * Builds allowlisted snapshots; never returns secrets or public keys.
 */

import type { LocalWsServerAdapter } from "@adapters/integration/LocalWsServerAdapter.js";
import { loadSdkOriginAllowlistFromEnv } from "@adapters/integration/sdkGatewayOriginPolicy.js";
import type {
  SdkGatewaySettingsPolicyPayload,
  SdkGatewaySettingsSnapshot,
  SdkPairedClientProjection,
  SdkPendingPairingProjection,
  SdkPendingOriginTrustProjection,
} from "@shared/ipc/SdkGatewaySettingsContract.js";

export function resolveSdkGatewayAllowedOrigins(
  policy: SdkGatewaySettingsPolicyPayload,
): readonly string[] {
  if (!policy.originsManaged) {
    return loadSdkOriginAllowlistFromEnv();
  }
  return policy.origins
    .filter((entry) => entry.state === "allowed")
    .map((entry) => entry.origin);
}

export async function buildSdkGatewaySettingsSnapshot(
  gateway: LocalWsServerAdapter | null,
): Promise<SdkGatewaySettingsSnapshot> {
  if (gateway === null) {
    return {
      diagnostics: {
        status: "disabled",
        bindHost: null,
        bindPort: null,
        connectionCount: 0,
        authenticatedCount: 0,
        unauthenticatedCount: 0,
        pendingPairingCount: 0,
        pairedClientCount: 0,
        allowedOriginsCount: 0,
        lastErrorCode: "gateway_unavailable",
        windowHideAvailable: false,
      },
      origins: [],
      pendingOriginTrust: [],
      paired: [],
      pendingPairing: [],
    };
  }

  const pairedRaw = await gateway.listPairedClients();
  const pairedClients: SdkPairedClientProjection[] = pairedRaw.map((client) => ({
    clientId: client.clientId,
    origin: client.origin,
    profile: client.profile,
    applicationName: client.applicationName,
    createdAt: client.createdAt,
    expiresAt: client.expiresAt,
    revoked: client.revoked,
    capabilityCount: client.grantedCapabilities.length,
  }));

  const pendingPairing: SdkPendingPairingProjection[] = gateway
    .listPendingPairingRequests()
    .map((pending) => ({
      pairingRequestId: pending.pairingRequestId,
      clientId: pending.clientId,
      origin: pending.origin,
      applicationName: pending.applicationName,
      profile: pending.profile,
      expiresAt: pending.expiresAt,
    }));

  const pendingOriginTrust: SdkPendingOriginTrustProjection[] =
    gateway.listPendingOriginTrust().map((entry) => ({
      originTrustRequestId: entry.originTrustRequestId,
      origin: entry.origin,
    }));

  return {
    diagnostics: gateway.getDiagnosticsSnapshot(pairedClients.length),
    origins: gateway.getOriginTrustEntries(),
    pendingOriginTrust,
    paired: pairedClients,
    pendingPairing,
  };
}
