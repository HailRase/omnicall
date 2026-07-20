/**
 * Single-use auth challenge / nonce cache (DI-04 / ADR-0016).
 */

import type { AuthChallenge } from "@axatalk/protocol";

import {
  createSdkBase64UrlNonce,
  createSdkIsoTimestamp,
  createSdkOpaqueId,
} from "./sdkGatewayIds.js";

export const SDK_AUTH_CHALLENGE_TTL_MS = 60_000;

type ChallengeEntry = Readonly<{
  challenge: AuthChallenge;
  clientId: string;
  origin: string;
  consumed: boolean;
}>;

export class SdkAuthChallengeCache {
  private readonly entries = new Map<string, ChallengeEntry>();

  issue(input: {
    readonly clientId: string;
    readonly origin: string;
    readonly now: () => Date;
    readonly ttlMs?: number;
  }): AuthChallenge {
    this.prune(input.now);
    const ttlMs = input.ttlMs ?? SDK_AUTH_CHALLENGE_TTL_MS;
    const now = input.now();
    const challenge: AuthChallenge = {
      challengeId: createSdkOpaqueId("chal"),
      nonce: createSdkBase64UrlNonce(),
      expiresAt: createSdkIsoTimestamp(
        () => new Date(now.getTime() + ttlMs),
      ),
    };
    this.entries.set(challenge.challengeId, {
      challenge,
      clientId: input.clientId,
      origin: input.origin,
      consumed: false,
    });
    return challenge;
  }

  /**
   * Consume a challenge for PoP verification.
   * Returns the challenge entry when valid/unconsumed; null on miss/expiry/replay.
   */
  consume(input: {
    readonly challengeId: string;
    readonly clientId: string;
    readonly origin: string;
    readonly now: () => Date;
  }): AuthChallenge | null {
    this.prune(input.now);
    const entry = this.entries.get(input.challengeId);
    if (entry === undefined || entry.consumed) {
      return null;
    }
    if (entry.clientId !== input.clientId || entry.origin !== input.origin) {
      return null;
    }
    if (Date.parse(entry.challenge.expiresAt) <= input.now().getTime()) {
      this.entries.delete(input.challengeId);
      return null;
    }
    this.entries.set(input.challengeId, { ...entry, consumed: true });
    return entry.challenge;
  }

  private prune(now: () => Date): void {
    const nowMs = now().getTime();
    for (const [id, entry] of this.entries) {
      if (entry.consumed || Date.parse(entry.challenge.expiresAt) <= nowMs) {
        this.entries.delete(id);
      }
    }
  }
}
