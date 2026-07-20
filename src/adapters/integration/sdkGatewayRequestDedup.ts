/**
 * Bounded request-id replay cache (DI-04 / DI-06 / ADR-0011 / ADR-0017).
 * Duplicate requestId within TTL returns the cached reply (no second side effect).
 */

import type { WireMessage } from "@axatalk/protocol";
import { REQUEST_DEDUP_TTL_SECONDS } from "@axatalk/protocol";

type PendingEntry = {
  readonly kind: "pending";
  readonly waiters: Array<(reply: WireMessage) => void>;
  expiresAt: number;
};

type DoneEntry = {
  readonly kind: "done";
  readonly reply: WireMessage;
  expiresAt: number;
};

type CacheEntry = PendingEntry | DoneEntry;

export type SdkDedupBeginResult =
  | { readonly action: "execute" }
  | { readonly action: "replay"; readonly reply: WireMessage }
  | { readonly action: "await"; readonly promise: Promise<WireMessage> };

export class SdkRequestDedupCache {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly ttlMs: number;

  constructor(ttlSeconds: number = REQUEST_DEDUP_TTL_SECONDS) {
    this.ttlMs = ttlSeconds * 1000;
  }

  /**
   * Legacy gate used by deny/ping paths before reply-cache upgrade.
   * Prefer `begin`/`complete` for product commands (ADR-0017 cached reply).
   */
  accept(requestId: string, nowMs: number): boolean {
    this.prune(nowMs);
    const existing = this.entries.get(requestId);
    if (existing !== undefined) {
      return false;
    }
    this.entries.set(requestId, {
      kind: "pending",
      waiters: [],
      expiresAt: nowMs + this.ttlMs,
    });
    return true;
  }

  begin(requestId: string, nowMs: number): SdkDedupBeginResult {
    this.prune(nowMs);
    const existing = this.entries.get(requestId);
    if (existing?.kind === "done") {
      return { action: "replay", reply: existing.reply };
    }
    if (existing?.kind === "pending") {
      const promise = new Promise<WireMessage>((resolve) => {
        existing.waiters.push(resolve);
      });
      return { action: "await", promise };
    }
    this.entries.set(requestId, {
      kind: "pending",
      waiters: [],
      expiresAt: nowMs + this.ttlMs,
    });
    return { action: "execute" };
  }

  complete(requestId: string, reply: WireMessage, nowMs: number): void {
    const existing = this.entries.get(requestId);
    const waiters =
      existing?.kind === "pending" ? [...existing.waiters] : [];
    this.entries.set(requestId, {
      kind: "done",
      reply,
      expiresAt: nowMs + this.ttlMs,
    });
    for (const waiter of waiters) {
      waiter(reply);
    }
  }

  /** Drop a reserved pending slot without caching (e.g. connection closed). */
  abandon(requestId: string): void {
    const existing = this.entries.get(requestId);
    if (existing?.kind === "pending") {
      this.entries.delete(requestId);
    }
  }

  private prune(nowMs: number): void {
    for (const [id, entry] of this.entries) {
      if (entry.expiresAt <= nowMs && entry.kind === "done") {
        this.entries.delete(id);
      }
    }
  }
}
