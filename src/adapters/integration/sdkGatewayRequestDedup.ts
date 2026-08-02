/**
 * Bounded Origin+clientId+requestId replay cache (DI-04 / DI-06 / ADR-0027).
 * - Purpose: idempotent command replies without cross-client coupling.
 * - Inputs: principal (origin, clientId|connection, requestId), reply, clock.
 * - Outputs: execute | replay | await; abandon settles waiters; TTL prune.
 */

import type { WireMessage } from "@softomnitel/omnicall-protocol";
import { REQUEST_DEDUP_TTL_SECONDS } from "@softomnitel/omnicall-protocol";

/** Hard cap on cache entries (pending + done). */
export const SDK_REQUEST_DEDUP_MAX_ENTRIES = 256 as const;

export type SdkDedupAbandonReason =
  | "disconnect"
  | "expired"
  | "evicted"
  | "failed";

export type SdkDedupPrincipal = Readonly<{
  origin: string;
  /**
   * Authenticated clientId. Null ⇒ unauthenticated; key uses connectionId.
   */
  clientId: string | null;
  /** Owning connection (abandon-on-disconnect + unauth scope). */
  connectionId: string;
  requestId: string;
}>;

export type SdkDedupAwaitOutcome =
  | { readonly outcome: "reply"; readonly reply: WireMessage }
  | { readonly outcome: "abandoned"; readonly reason: SdkDedupAbandonReason };

export type SdkDedupBeginResult =
  | { readonly action: "execute" }
  | { readonly action: "replay"; readonly reply: WireMessage }
  | {
      readonly action: "await";
      readonly promise: Promise<SdkDedupAwaitOutcome>;
    }
  | { readonly action: "rejected"; readonly reason: SdkDedupAbandonReason };

type Waiter = (outcome: SdkDedupAwaitOutcome) => void;

type PendingEntry = {
  readonly kind: "pending";
  readonly waiters: Waiter[];
  readonly ownerConnectionId: string;
  expiresAt: number;
  createdAt: number;
};

type DoneEntry = {
  readonly kind: "done";
  readonly reply: WireMessage;
  expiresAt: number;
  createdAt: number;
};

type CacheEntry = PendingEntry | DoneEntry;

/** Build principal from a live gateway connection + requestId. */
export function createSdkDedupPrincipal(
  connection: Readonly<{
    id: string;
    origin: string;
    clientId: string | null;
  }>,
  requestId: string,
): SdkDedupPrincipal {
  return {
    origin: connection.origin,
    clientId: connection.clientId,
    connectionId: connection.id,
    requestId,
  };
}

function buildDedupKey(principal: SdkDedupPrincipal): string {
  const identity =
    principal.clientId !== null && principal.clientId.length > 0
      ? principal.clientId
      : `conn:${principal.connectionId}`;
  return `${principal.origin}\0${identity}\0${principal.requestId}`;
}

export class SdkRequestDedupCache {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  constructor(
    ttlSeconds: number = REQUEST_DEDUP_TTL_SECONDS,
    maxEntries: number = SDK_REQUEST_DEDUP_MAX_ENTRIES,
  ) {
    this.ttlMs = ttlSeconds * 1000;
    this.maxEntries = maxEntries;
  }

  /** Test/diagnostics: live entry count after optional prune. */
  size(nowMs?: number): number {
    if (nowMs !== undefined) {
      this.prune(nowMs);
    }
    return this.entries.size;
  }

  /**
   * Legacy gate used by deny/ping paths before reply-cache upgrade.
   * Prefer `begin`/`complete` for product commands (ADR-0017 cached reply).
   */
  accept(principal: SdkDedupPrincipal, nowMs: number): boolean {
    return this.begin(principal, nowMs).action === "execute";
  }

  begin(principal: SdkDedupPrincipal, nowMs: number): SdkDedupBeginResult {
    this.prune(nowMs);
    const key = buildDedupKey(principal);
    const existing = this.entries.get(key);
    if (existing?.kind === "done") {
      return { action: "replay", reply: existing.reply };
    }
    if (existing?.kind === "pending") {
      const promise = new Promise<SdkDedupAwaitOutcome>((resolve) => {
        existing.waiters.push(resolve);
      });
      return { action: "await", promise };
    }
    if (!this.ensureCapacity(nowMs)) {
      return { action: "rejected", reason: "evicted" };
    }
    this.entries.set(key, {
      kind: "pending",
      waiters: [],
      ownerConnectionId: principal.connectionId,
      expiresAt: nowMs + this.ttlMs,
      createdAt: nowMs,
    });
    return { action: "execute" };
  }

  complete(
    principal: SdkDedupPrincipal,
    reply: WireMessage,
    nowMs: number,
  ): void {
    const key = buildDedupKey(principal);
    const existing = this.entries.get(key);
    if (existing === undefined || existing.kind !== "pending") {
      return;
    }
    // Stale owner must not finish a slot reserved by a later connection.
    if (existing.ownerConnectionId !== principal.connectionId) {
      return;
    }
    const waiters = [...existing.waiters];
    this.entries.set(key, {
      kind: "done",
      reply,
      expiresAt: nowMs + this.ttlMs,
      createdAt: existing.createdAt,
    });
    const outcome: SdkDedupAwaitOutcome = { outcome: "reply", reply };
    for (const waiter of waiters) {
      waiter(outcome);
    }
  }

  /** Drop a reserved pending slot without caching a reply. */
  abandon(
    principal: SdkDedupPrincipal,
    reason: SdkDedupAbandonReason = "failed",
  ): void {
    this.abandonKey(buildDedupKey(principal), reason);
  }

  /** Abandon every pending entry owned by a connection (disconnect). */
  abandonOwnedByConnection(
    connectionId: string,
    reason: SdkDedupAbandonReason = "disconnect",
  ): number {
    let abandoned = 0;
    for (const [key, entry] of [...this.entries]) {
      if (entry.kind === "pending" && entry.ownerConnectionId === connectionId) {
        this.abandonKey(key, reason);
        abandoned += 1;
      }
    }
    return abandoned;
  }

  private abandonKey(key: string, reason: SdkDedupAbandonReason): void {
    const existing = this.entries.get(key);
    if (existing?.kind !== "pending") {
      return;
    }
    this.entries.delete(key);
    const outcome: SdkDedupAwaitOutcome = { outcome: "abandoned", reason };
    for (const waiter of existing.waiters) {
      waiter(outcome);
    }
  }

  private prune(nowMs: number): void {
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt > nowMs) {
        continue;
      }
      if (entry.kind === "done") {
        this.entries.delete(key);
        continue;
      }
      this.abandonKey(key, "expired");
    }
  }

  /** Make room for one new entry; returns false when still full. */
  private ensureCapacity(nowMs: number): boolean {
    if (this.entries.size < this.maxEntries) {
      return true;
    }
    this.prune(nowMs);
    if (this.entries.size < this.maxEntries) {
      return true;
    }
    const oldestDone = this.findOldestKey("done");
    if (oldestDone !== null) {
      this.entries.delete(oldestDone);
      return true;
    }
    const oldestPending = this.findOldestKey("pending");
    if (oldestPending !== null) {
      this.abandonKey(oldestPending, "evicted");
      return this.entries.size < this.maxEntries;
    }
    return false;
  }

  private findOldestKey(kind: CacheEntry["kind"]): string | null {
    let oldestKey: string | null = null;
    let oldestCreated = Number.POSITIVE_INFINITY;
    for (const [key, entry] of this.entries) {
      if (entry.kind !== kind || entry.createdAt >= oldestCreated) {
        continue;
      }
      oldestCreated = entry.createdAt;
      oldestKey = key;
    }
    return oldestKey;
  }
}
