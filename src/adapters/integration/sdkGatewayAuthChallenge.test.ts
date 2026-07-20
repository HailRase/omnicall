import { describe, expect, it } from "vitest";

import { SdkAuthChallengeCache } from "./sdkGatewayAuthChallenge.js";

describe("SdkAuthChallengeCache", () => {
  it("consumes a fresh challenge once and rejects replay", () => {
    const cache = new SdkAuthChallengeCache();
    let nowMs = Date.parse("2026-07-20T09:00:00.000Z");
    const now = (): Date => new Date(nowMs);
    const challenge = cache.issue({
      clientId: "client_1",
      origin: "https://crm.example",
      now,
      ttlMs: 60_000,
    });
    expect(
      cache.consume({
        challengeId: challenge.challengeId,
        clientId: "client_1",
        origin: "https://crm.example",
        now,
      }),
    ).toEqual(challenge);
    expect(
      cache.consume({
        challengeId: challenge.challengeId,
        clientId: "client_1",
        origin: "https://crm.example",
        now,
      }),
    ).toBeNull();
  });

  it("rejects expired challenges", () => {
    const cache = new SdkAuthChallengeCache();
    let nowMs = Date.parse("2026-07-20T09:00:00.000Z");
    const now = (): Date => new Date(nowMs);
    const challenge = cache.issue({
      clientId: "client_1",
      origin: "https://crm.example",
      now,
      ttlMs: 1_000,
    });
    nowMs += 1_001;
    expect(
      cache.consume({
        challengeId: challenge.challengeId,
        clientId: "client_1",
        origin: "https://crm.example",
        now,
      }),
    ).toBeNull();
  });

  it("rejects clientId / origin mismatch", () => {
    const cache = new SdkAuthChallengeCache();
    const now = (): Date => new Date("2026-07-20T09:00:00.000Z");
    const challenge = cache.issue({
      clientId: "client_1",
      origin: "https://crm.example",
      now,
    });
    expect(
      cache.consume({
        challengeId: challenge.challengeId,
        clientId: "client_other",
        origin: "https://crm.example",
        now,
      }),
    ).toBeNull();
    expect(
      cache.consume({
        challengeId: challenge.challengeId,
        clientId: "client_1",
        origin: "https://evil.example",
        now,
      }),
    ).toBeNull();
  });
});
