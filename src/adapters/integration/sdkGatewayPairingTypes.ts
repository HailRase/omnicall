/**
 * Pairing record / approval types for SDK gateway (DI-04 / ADR-0016).
 */

import type { CapabilityId, PairingProfile } from "@axata/axatalk-protocol";

export type SdkPairedClientRecord = Readonly<{
  clientId: string;
  origin: string;
  publicKey: string;
  keyAlgorithm: "ECDSA-P256-SHA256";
  profile: PairingProfile;
  grantedCapabilities: readonly CapabilityId[];
  applicationName: string;
  applicationVersion: string;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
}>;

export type SdkPairingPendingRequest = Readonly<{
  pairingRequestId: string;
  clientId: string;
  origin: string;
  /** Owning gateway connection — used to cancel pending on disconnect. */
  connectionId: string;
  publicKey: string;
  keyAlgorithm: "ECDSA-P256-SHA256";
  profile: PairingProfile;
  requestedCapabilities: readonly CapabilityId[];
  applicationName: string;
  applicationVersion: string;
  expiresAt: string;
  createdAt: string;
}>;

export type SdkPairingApprovalDecision =
  | {
      readonly decision: "approve";
      readonly profile?: PairingProfile;
      readonly grantedCapabilities?: readonly CapabilityId[];
    }
  | { readonly decision: "deny" };

export type SdkPairingApprover = (
  pending: SdkPairingPendingRequest,
) => Promise<SdkPairingApprovalDecision>;

/** Public metadata safe for diagnostics (no public key / secrets). */
export type SdkPairedClientPublicMeta = Readonly<{
  clientId: string;
  origin: string;
  profile: PairingProfile;
  grantedCapabilities: readonly CapabilityId[];
  applicationName: string;
  createdAt: string;
  expiresAt: string | null;
  revoked: boolean;
}>;
