/**
 * Deferred Origin TOFU approval (ADR-0018 / DI-11).
 * Distinct from pairing approve — Origin trust only.
 */

export type SdkOriginTrustDecision =
  | Readonly<{ decision: "allow" }>
  | Readonly<{ decision: "deny" }>
  /** Disconnect / TTL / superseded — do not persist blacklist. */
  | Readonly<{ decision: "cancel" }>;

export type SdkOriginTrustPending = Readonly<{
  originTrustRequestId: string;
  origin: string;
  createdAt: string;
}>;

export type SdkOriginTrustApprover = (
  pending: SdkOriginTrustPending,
) => Promise<SdkOriginTrustDecision>;

type Deferred = {
  readonly pending: SdkOriginTrustPending;
  readonly resolvers: Array<(decision: SdkOriginTrustDecision) => void>;
};

/**
 * Fail-closed Origin TOFU approver: decisions via allow/deny/cancel APIs.
 * One pending modal per Origin (duplicate waiters share settlement).
 * Unresolved rows are cancelled by disconnect / TTL sweeper (not blacklisted).
 */
export class DeferredSdkOriginTrustApprover {
  private readonly byRequestId = new Map<string, Deferred>();
  private readonly byOrigin = new Map<string, string>();
  private readonly onPending:
    | ((pending: SdkOriginTrustPending) => void)
    | undefined;

  constructor(options?: {
    readonly onPending?: (pending: SdkOriginTrustPending) => void;
  }) {
    this.onPending = options?.onPending;
  }

  readonly approver: SdkOriginTrustApprover = (pending) => {
    const existingId = this.byOrigin.get(pending.origin);
    if (existingId !== undefined) {
      const existing = this.byRequestId.get(existingId);
      if (existing !== undefined) {
        return new Promise<SdkOriginTrustDecision>((resolve) => {
          existing.resolvers.push(resolve);
        });
      }
    }
    return new Promise<SdkOriginTrustDecision>((resolve) => {
      this.byRequestId.set(pending.originTrustRequestId, {
        pending,
        resolvers: [resolve],
      });
      this.byOrigin.set(pending.origin, pending.originTrustRequestId);
      this.onPending?.(pending);
    });
  };

  listPending(): readonly SdkOriginTrustPending[] {
    return [...this.byRequestId.values()].map((entry) => entry.pending);
  }

  allow(originTrustRequestId: string): boolean {
    return this.settle(originTrustRequestId, { decision: "allow" });
  }

  deny(originTrustRequestId: string): boolean {
    return this.settle(originTrustRequestId, { decision: "deny" });
  }

  /** Abandon without blacklisting (disconnect / TTL). */
  cancel(originTrustRequestId: string): boolean {
    return this.settle(originTrustRequestId, { decision: "cancel" });
  }

  allowByOrigin(origin: string): boolean {
    const id = this.byOrigin.get(origin);
    return id !== undefined ? this.allow(id) : false;
  }

  denyByOrigin(origin: string): boolean {
    const id = this.byOrigin.get(origin);
    return id !== undefined ? this.deny(id) : false;
  }

  cancelByOrigin(origin: string): boolean {
    const id = this.byOrigin.get(origin);
    return id !== undefined ? this.cancel(id) : false;
  }

  /** Cancel pending older than ttlMs (no blacklist). Returns cancelled count. */
  cancelExpired(nowMs: number, ttlMs: number): number {
    let count = 0;
    for (const entry of [...this.byRequestId.values()]) {
      const created = Date.parse(entry.pending.createdAt);
      if (!Number.isFinite(created) || created + ttlMs <= nowMs) {
        if (this.cancel(entry.pending.originTrustRequestId)) {
          count += 1;
        }
      }
    }
    return count;
  }

  private settle(
    originTrustRequestId: string,
    decision: SdkOriginTrustDecision,
  ): boolean {
    const entry = this.byRequestId.get(originTrustRequestId);
    if (entry === undefined) {
      return false;
    }
    this.byRequestId.delete(originTrustRequestId);
    this.byOrigin.delete(entry.pending.origin);
    for (const resolve of entry.resolvers) {
      resolve(decision);
    }
    return true;
  }
}

/** Test double: always allow Origin. */
export function createAutoAllowOriginTrustApprover(): SdkOriginTrustApprover {
  return () => Promise.resolve({ decision: "allow" as const });
}

/** Test double: always deny Origin. */
export function createAutoDenyOriginTrustApprover(): SdkOriginTrustApprover {
  return () => Promise.resolve({ decision: "deny" as const });
}
