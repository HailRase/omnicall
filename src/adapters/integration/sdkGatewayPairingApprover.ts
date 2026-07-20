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
 * Fail-closed approver: decisions must be resolved via approve/deny APIs.
 * Unresolved pending requests time out as deny when the registry expires them.
 */
export class DeferredSdkPairingApprover {
  private readonly deferred = new Map<string, Deferred>();

  readonly approver: SdkPairingApprover = (pending) =>
    new Promise<SdkPairingApprovalDecision>((resolve) => {
      this.deferred.set(pending.pairingRequestId, { pending, resolve });
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
