/**
 * Bounded request-id replay cache (DI-04 / ADR-0011).
 */

import { REQUEST_DEDUP_TTL_SECONDS } from "@axatalk/protocol";

export class SdkRequestDedupCache {
  private readonly seen = new Map<string, number>();
  private readonly ttlMs: number;

  constructor(ttlSeconds: number = REQUEST_DEDUP_TTL_SECONDS) {
    this.ttlMs = ttlSeconds * 1000;
  }

  /** Returns true when the requestId is new; false on replay. */
  accept(requestId: string, nowMs: number): boolean {
    this.prune(nowMs);
    if (this.seen.has(requestId)) {
      return false;
    }
    this.seen.set(requestId, nowMs + this.ttlMs);
    return true;
  }

  private prune(nowMs: number): void {
    for (const [id, expiresAt] of this.seen) {
      if (expiresAt <= nowMs) {
        this.seen.delete(id);
      }
    }
  }
}
