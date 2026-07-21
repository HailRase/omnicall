/**
 * Authenticated session metadata bound after server-hello / PoP success.
 */

import type { CapabilityId, PairingProfile } from '@axata/axatalk-protocol';

export type SessionIdentity = {
  readonly serverInstanceId: string;
  readonly sessionEpoch: string;
  readonly selectedProtocolVersion: number;
  readonly clientId: string;
  readonly profile: PairingProfile | undefined;
  readonly grantedCapabilities: readonly CapabilityId[];
  readonly heartbeatSeconds: number;
  readonly maxMessageBytes: number;
};

export function clearGrantedCapabilities(
  identity: SessionIdentity | undefined
): SessionIdentity | undefined {
  if (identity === undefined) {
    return undefined;
  }
  return Object.freeze({
    ...identity,
    grantedCapabilities: Object.freeze([])
  });
}
