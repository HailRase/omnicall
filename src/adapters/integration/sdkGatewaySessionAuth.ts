/**
 * Pairing ceremony + PoP auth handlers for LocalWsSessionRegistry (DI-04).
 */

import type { AuthProof, PairingRequest, WireMessage } from "@axatalk/protocol";

import { SdkAuthChallengeCache } from "./sdkGatewayAuthChallenge.js";
import { resolveGrantedCapabilities } from "./sdkGatewayCapabilities.js";
import type { SdkGatewayConnection } from "./sdkGatewayConnection.js";
import {
  createSdkIsoTimestamp,
  createSdkOpaqueId,
} from "./sdkGatewayIds.js";
import {
  buildPairingApproved,
  buildPairingDenied,
  buildPairingPending,
  type SdkGatewayIdentity,
} from "./sdkGatewayMessages.js";
import type { SdkPairingApprover } from "./sdkGatewayPairingTypes.js";
import type { SdkGatewayPairingStore } from "./sdkGatewayPairingStore.js";
import {
  isValidSdkPopPublicKey,
  verifySdkPopSignature,
} from "./sdkGatewayPopCrypto.js";
import type { SdkAccountActivateGrantStore } from "./sdkAccountActivateGrantStore.js";
import { elevateAccountActivateCapability } from "./sdkAccountActivateCapability.js";

export const SDK_PAIRING_PENDING_TTL_MS = 5 * 60_000;
export const SDK_AUTH_SESSION_TTL_MS = 30 * 60_000;

export type SdkSessionAuthDeps = Readonly<{
  pairingStore: SdkGatewayPairingStore;
  pairingApprover: SdkPairingApprover;
  challenges: SdkAuthChallengeCache;
  now: () => Date;
  getIdentity: () => SdkGatewayIdentity | null;
  sendJson: (connection: SdkGatewayConnection, message: WireMessage) => void;
  closeConnection: (connection: SdkGatewayConnection, reason: string) => void;
  audit: (
    event: string,
    fields: Readonly<Record<string, string | number | boolean>>,
  ) => void;
  activateGrantStore: SdkAccountActivateGrantStore;
}>;

export async function handlePairingRequest(
  deps: SdkSessionAuthDeps,
  connection: SdkGatewayConnection,
  message: PairingRequest,
): Promise<void> {
  if (!isValidSdkPopPublicKey(message.clientPublicKey)) {
    deps.closeConnection(connection, "invalid_payload");
    return;
  }
  const createdAt = createSdkIsoTimestamp(deps.now);
  const expiresAt = createSdkIsoTimestamp(
    () => new Date(deps.now().getTime() + SDK_PAIRING_PENDING_TTL_MS),
  );
  const pending = {
    pairingRequestId: createSdkOpaqueId("pair"),
    clientId: message.clientId,
    origin: connection.origin,
    publicKey: message.clientPublicKey,
    keyAlgorithm: message.keyAlgorithm,
    profile: message.requestedProfile,
    requestedCapabilities: message.requestedCapabilities,
    applicationName: message.application.name,
    applicationVersion: message.application.version,
    expiresAt,
    createdAt,
  };
  deps.sendJson(
    connection,
    buildPairingPending({
      pairingRequestId: pending.pairingRequestId,
      expiresAt,
      now: deps.now,
    }),
  );
  deps.audit("sdk_gateway_pairing_pending", {
    clientId: message.clientId,
    result: "pending",
  });

  const decision = await deps.pairingApprover(pending);
  if (Date.parse(expiresAt) <= deps.now().getTime()) {
    deps.sendJson(
      connection,
      buildPairingDenied({ clientId: message.clientId, now: deps.now }),
    );
    deps.audit("sdk_gateway_pairing_denied", {
      clientId: message.clientId,
      result: "expired",
    });
    return;
  }
  if (decision.decision === "deny") {
    deps.sendJson(
      connection,
      buildPairingDenied({ clientId: message.clientId, now: deps.now }),
    );
    deps.audit("sdk_gateway_pairing_denied", {
      clientId: message.clientId,
      result: "denied",
    });
    return;
  }
  const profile = decision.profile ?? message.requestedProfile;
  const grantedCapabilities = resolveGrantedCapabilities({
    profile,
    requestedCapabilities: message.requestedCapabilities,
    ...(decision.grantedCapabilities !== undefined
      ? { explicitGrants: decision.grantedCapabilities }
      : {}),
  });
  await deps.pairingStore.save({
    clientId: message.clientId,
    origin: connection.origin,
    publicKey: message.clientPublicKey,
    keyAlgorithm: "ECDSA-P256-SHA256",
    profile,
    grantedCapabilities,
    applicationName: message.application.name,
    applicationVersion: message.application.version,
    createdAt,
    expiresAt: null,
    revokedAt: null,
  });
  deps.sendJson(
    connection,
    buildPairingApproved({
      clientId: message.clientId,
      profile,
      grantedCapabilities,
      now: deps.now,
    }),
  );
  deps.audit("sdk_gateway_pairing_approved", {
    clientId: message.clientId,
    result: "approved",
  });
}

export async function handleAuthProof(
  deps: SdkSessionAuthDeps,
  connection: SdkGatewayConnection,
  message: AuthProof,
): Promise<void> {
  const identity = deps.getIdentity();
  if (identity === null) {
    deps.closeConnection(connection, "not_ready");
    return;
  }
  const challenge = deps.challenges.consume({
    challengeId: message.challengeId,
    clientId: message.clientId,
    origin: connection.origin,
    now: deps.now,
  });
  if (challenge === null) {
    deps.closeConnection(connection, "unauthenticated");
    deps.audit("sdk_gateway_auth_failed", {
      clientId: message.clientId,
      result: "challenge_invalid",
    });
    return;
  }
  const paired = await deps.pairingStore.findActive(
    message.clientId,
    connection.origin,
    deps.now().getTime(),
  );
  if (paired === null) {
    deps.closeConnection(connection, "unauthenticated");
    deps.audit("sdk_gateway_auth_failed", {
      clientId: message.clientId,
      result: "unknown_client",
    });
    return;
  }
  const ok = verifySdkPopSignature({
    publicKeyBase64Url: paired.publicKey,
    serverInstanceId: identity.serverInstanceId,
    sessionEpoch: identity.sessionEpoch,
    origin: connection.origin,
    clientId: message.clientId,
    challengeId: challenge.challengeId,
    nonce: challenge.nonce,
    signatureBase64Url: message.signature,
  });
  if (!ok) {
    deps.closeConnection(connection, "unauthenticated");
    deps.audit("sdk_gateway_auth_failed", {
      clientId: message.clientId,
      result: "bad_signature",
    });
    return;
  }
  connection.authState = "authenticated";
  connection.clientId = message.clientId;
  connection.grantedCapabilities = paired.grantedCapabilities;
  connection.sessionExpiresAtMs =
    deps.now().getTime() + SDK_AUTH_SESSION_TTL_MS;
  if (
    deps.activateGrantStore.hasAnyValidGrant(
      message.clientId,
      deps.now().getTime(),
    )
  ) {
    elevateAccountActivateCapability(connection);
  }
  deps.audit("sdk_gateway_auth_ok", {
    clientId: message.clientId,
    result: "authenticated",
  });
}
