/**
 * Minimal local pairing approval surface (DI-04). Full Settings UX is DI-09.
 */

import type {
  SdkPairingApprovalDecision,
  SdkPairingApprover,
  SdkPairingPendingRequest,
} from "./sdkGatewayPairingTypes.js";

type Deferred = {
  readonly pending: SdkPairingPendingRequest;
  readonly resolve: (decision: SdkPairingApprovalDecision) => void;
};

/**
 * Fail-closed approver: decisions via approve/deny APIs.
 * Unresolved pending are denied by disconnect cleanup or TTL sweeper.
 */
export class DeferredSdkPairingApprover {
  private readonly deferred = new Map<string, Deferred>();
  private readonly onPending:
    | ((pending: SdkPairingPendingRequest) => void)
    | undefined;

  constructor(options?: {
    readonly onPending?: (pending: SdkPairingPendingRequest) => void;
  }) {
    this.onPending = options?.onPending;
  }

  readonly approver: SdkPairingApprover = (pending) =>
    new Promise<SdkPairingApprovalDecision>((resolve) => {
      this.deferred.set(pending.pairingRequestId, { pending, resolve });
      this.onPending?.(pending);
    });

  getPending(
    pairingRequestId: string,
  ): SdkPairingPendingRequest | null {
    return this.deferred.get(pairingRequestId)?.pending ?? null;
  }

  listPending(): readonly SdkPairingPendingRequest[] {
    return [...this.deferred.values()].map((entry) => entry.pending);
  }

  approve(pairingRequestId: string): boolean {
    return this.settle(pairingRequestId, { decision: "approve" });
  }

  deny(pairingRequestId: string): boolean {
    return this.settle(pairingRequestId, { decision: "deny" });
  }

  denyByOrigin(origin: string): number {
    let count = 0;
    for (const entry of [...this.deferred.values()]) {
      if (entry.pending.origin === origin) {
        if (this.deny(entry.pending.pairingRequestId)) {
          count += 1;
        }
      }
    }
    return count;
  }

  denyByConnectionId(connectionId: string): number {
    let count = 0;
    for (const entry of [...this.deferred.values()]) {
      if (entry.pending.connectionId === connectionId) {
        if (this.deny(entry.pending.pairingRequestId)) {
          count += 1;
        }
      }
    }
    return count;
  }

  /** Deny pending whose expiresAt has elapsed. Returns denied count. */
  denyExpired(nowMs: number): number {
    let count = 0;
    for (const entry of [...this.deferred.values()]) {
      const expires = Date.parse(entry.pending.expiresAt);
      if (!Number.isFinite(expires) || expires <= nowMs) {
        if (this.deny(entry.pending.pairingRequestId)) {
          count += 1;
        }
      }
    }
    return count;
  }

  private settle(
    pairingRequestId: string,
    decision: SdkPairingApprovalDecision,
  ): boolean {
    const entry = this.deferred.get(pairingRequestId);
    if (entry === undefined) {
      return false;
    }
    this.deferred.delete(pairingRequestId);
    entry.resolve(decision);
    return true;
  }
}

/** Test double: always approve with profile defaults. */
export function createAutoApprovePairingApprover(): SdkPairingApprover {
  return () => Promise.resolve({ decision: "approve" as const });
}

/** Test double: always deny. */
export function createAutoDenyPairingApprover(): SdkPairingApprover {
  return () => Promise.resolve({ decision: "deny" as const });
}
