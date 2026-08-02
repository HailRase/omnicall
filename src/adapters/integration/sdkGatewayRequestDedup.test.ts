/**
 * WU-04: Origin+clientId+requestId dedup isolation + pending lifecycle.
 */

import { PROTOCOL_MAJOR, type WireMessage } from "@softomnitel/omnicall-protocol";
import { describe, expect, it } from "vitest";

import {
  createSdkDedupPrincipal,
  SdkRequestDedupCache,
} from "./sdkGatewayRequestDedup.js";

const ORIGIN_A = "https://crm-a.example";
const ORIGIN_B = "https://crm-b.example";

function replyFor(requestId: string, mark: string): WireMessage {
  return {
    protocolVersion: PROTOCOL_MAJOR,
    kind: "reply",
    ok: true,
    requestId,
    commandType: "sdk:ping",
    serverInstanceId: "srv_dedup_001",
    sessionEpoch: "epoch_dedup_001",
    occurredAt: "2026-08-02T20:00:00.000Z",
    revision: 1,
    result: { mark },
  };
}

function principal(input: {
  origin: string;
  clientId: string | null;
  connectionId: string;
  requestId: string;
}) {
  return createSdkDedupPrincipal(
    {
      id: input.connectionId,
      origin: input.origin,
      clientId: input.clientId,
    },
    input.requestId,
  );
}

describe("SdkRequestDedupCache (WU-04)", () => {
  it("isolates same requestId across different clientIds", () => {
    const cache = new SdkRequestDedupCache();
    const now = 1_000;
    const sharedRequestId = "req_shared_001";
    const clientA = principal({
      origin: ORIGIN_A,
      clientId: "client_a",
      connectionId: "conn_a",
      requestId: sharedRequestId,
    });
    const clientB = principal({
      origin: ORIGIN_A,
      clientId: "client_b",
      connectionId: "conn_b",
      requestId: sharedRequestId,
    });

    expect(cache.begin(clientA, now).action).toBe("execute");
    cache.complete(clientA, replyFor(sharedRequestId, "from_a"), now + 1);

    const beginB = cache.begin(clientB, now + 2);
    expect(beginB.action).toBe("execute");
    cache.complete(clientB, replyFor(sharedRequestId, "from_b"), now + 3);

    const replayA = cache.begin(clientA, now + 4);
    expect(replayA.action).toBe("replay");
    if (replayA.action === "replay") {
      expect(replayA.reply).toMatchObject({
        ok: true,
        result: { mark: "from_a" },
      });
    }

    const replayB = cache.begin(clientB, now + 5);
    expect(replayB.action).toBe("replay");
    if (replayB.action === "replay") {
      expect(replayB.reply).toMatchObject({
        ok: true,
        result: { mark: "from_b" },
      });
    }
  });

  it("isolates same clientId+requestId across Origins", () => {
    const cache = new SdkRequestDedupCache();
    const now = 2_000;
    const requestId = "req_xorigin_001";
    const onA = principal({
      origin: ORIGIN_A,
      clientId: "client_same",
      connectionId: "conn_a",
      requestId,
    });
    const onB = principal({
      origin: ORIGIN_B,
      clientId: "client_same",
      connectionId: "conn_b",
      requestId,
    });

    expect(cache.begin(onA, now).action).toBe("execute");
    cache.complete(onA, replyFor(requestId, "origin_a"), now + 1);

    expect(cache.begin(onB, now + 2).action).toBe("execute");
    const stealAttempt = cache.begin(onB, now + 3);
    expect(stealAttempt.action).toBe("await");

    cache.complete(onB, replyFor(requestId, "origin_b"), now + 4);
    const replayA = cache.begin(onA, now + 5);
    expect(replayA.action).toBe("replay");
    if (replayA.action === "replay") {
      expect(replayA.reply).toMatchObject({ result: { mark: "origin_a" } });
    }
  });

  it("scopes unauthenticated principals by connectionId", () => {
    const cache = new SdkRequestDedupCache();
    const now = 3_000;
    const requestId = "req_unauth_001";
    const conn1 = principal({
      origin: ORIGIN_A,
      clientId: null,
      connectionId: "conn_unauth_1",
      requestId,
    });
    const conn2 = principal({
      origin: ORIGIN_A,
      clientId: null,
      connectionId: "conn_unauth_2",
      requestId,
    });

    expect(cache.begin(conn1, now).action).toBe("execute");
    expect(cache.begin(conn2, now + 1).action).toBe("execute");
    cache.complete(conn1, replyFor(requestId, "c1"), now + 2);
    const replay2 = cache.begin(conn2, now + 3);
    expect(replay2.action).toBe("await");
  });

  it("replays duplicate within TTL without second execute", () => {
    const cache = new SdkRequestDedupCache();
    const now = 4_000;
    const p = principal({
      origin: ORIGIN_A,
      clientId: "client_dup",
      connectionId: "conn_dup",
      requestId: "req_dup_001",
    });
    expect(cache.begin(p, now).action).toBe("execute");
    cache.complete(p, replyFor("req_dup_001", "once"), now + 1);
    const second = cache.begin(p, now + 2);
    expect(second.action).toBe("replay");
  });

  it("abandons owned pending on disconnect and settles waiters", async () => {
    const cache = new SdkRequestDedupCache();
    const now = 5_000;
    const owner = principal({
      origin: ORIGIN_A,
      clientId: "client_own",
      connectionId: "conn_owner",
      requestId: "req_pending_001",
    });
    const waiterPrincipal = principal({
      origin: ORIGIN_A,
      clientId: "client_own",
      connectionId: "conn_waiter",
      requestId: "req_pending_001",
    });

    expect(cache.begin(owner, now).action).toBe("execute");
    const waiting = cache.begin(waiterPrincipal, now + 1);
    expect(waiting.action).toBe("await");
    if (waiting.action !== "await") {
      throw new Error("expected await");
    }

    const abandonedCount = cache.abandonOwnedByConnection(
      "conn_owner",
      "disconnect",
    );
    expect(abandonedCount).toBe(1);
    await expect(waiting.promise).resolves.toEqual({
      outcome: "abandoned",
      reason: "disconnect",
    });
    expect(cache.begin(waiterPrincipal, now + 2).action).toBe("execute");
  });

  it("prunes expired pending and done entries", async () => {
    const cache = new SdkRequestDedupCache(1);
    const start = 10_000;
    const pending = principal({
      origin: ORIGIN_A,
      clientId: "client_ttl",
      connectionId: "conn_ttl",
      requestId: "req_ttl_pending",
    });
    const done = principal({
      origin: ORIGIN_A,
      clientId: "client_ttl",
      connectionId: "conn_ttl",
      requestId: "req_ttl_done",
    });

    expect(cache.begin(pending, start).action).toBe("execute");
    expect(cache.begin(done, start).action).toBe("execute");
    cache.complete(done, replyFor("req_ttl_done", "done"), start + 1);

    const waiting = cache.begin(
      principal({
        origin: ORIGIN_A,
        clientId: "client_ttl",
        connectionId: "conn_other",
        requestId: "req_ttl_pending",
      }),
      start + 2,
    );
    expect(waiting.action).toBe("await");
    if (waiting.action !== "await") {
      throw new Error("expected await");
    }

    expect(cache.begin(done, start + 1_500).action).toBe("execute");
    await expect(waiting.promise).resolves.toEqual({
      outcome: "abandoned",
      reason: "expired",
    });
  });

  it("abandon(failed) clears pending without caching reply", () => {
    const cache = new SdkRequestDedupCache();
    const now = 20_000;
    const p = principal({
      origin: ORIGIN_A,
      clientId: "client_fail",
      connectionId: "conn_fail",
      requestId: "req_fail_001",
    });
    expect(cache.begin(p, now).action).toBe("execute");
    cache.abandon(p, "failed");
    expect(cache.begin(p, now + 1).action).toBe("execute");
  });

  it("stale owner complete cannot overwrite a newer reservation", () => {
    const cache = new SdkRequestDedupCache();
    const now = 25_000;
    const stale = principal({
      origin: ORIGIN_A,
      clientId: "client_race",
      connectionId: "conn_stale",
      requestId: "req_race_001",
    });
    const fresh = principal({
      origin: ORIGIN_A,
      clientId: "client_race",
      connectionId: "conn_fresh",
      requestId: "req_race_001",
    });
    expect(cache.begin(stale, now).action).toBe("execute");
    cache.abandonOwnedByConnection("conn_stale", "disconnect");
    expect(cache.begin(fresh, now + 1).action).toBe("execute");
    cache.complete(stale, replyFor("req_race_001", "stale"), now + 2);
    cache.complete(fresh, replyFor("req_race_001", "fresh"), now + 3);
    const replay = cache.begin(fresh, now + 4);
    expect(replay.action).toBe("replay");
    if (replay.action === "replay") {
      expect(replay.reply).toMatchObject({ result: { mark: "fresh" } });
    }
  });

  it("bounds cache size by evicting oldest done entries", () => {
    const cache = new SdkRequestDedupCache(120, 2);
    const now = 30_000;
    const a = principal({
      origin: ORIGIN_A,
      clientId: "c1",
      connectionId: "conn_1",
      requestId: "req_1",
    });
    const b = principal({
      origin: ORIGIN_A,
      clientId: "c1",
      connectionId: "conn_1",
      requestId: "req_2",
    });
    const c = principal({
      origin: ORIGIN_A,
      clientId: "c1",
      connectionId: "conn_1",
      requestId: "req_3",
    });
    expect(cache.begin(a, now).action).toBe("execute");
    cache.complete(a, replyFor("req_1", "a"), now + 1);
    expect(cache.begin(b, now + 2).action).toBe("execute");
    cache.complete(b, replyFor("req_2", "b"), now + 3);
    expect(cache.begin(c, now + 4).action).toBe("execute");
    cache.complete(c, replyFor("req_3", "c"), now + 5);
    expect(cache.size()).toBeLessThanOrEqual(2);
    expect(cache.begin(c, now + 6).action).toBe("replay");
  });
});
