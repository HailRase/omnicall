/**
 * Short-lived privileged activate grants (DI-08 / ADR-0013 §B / ADR-0016).
 * Fail closed: no grant → no account.activate elevation / local approval.
 */

import { encodeSdkProfileRef } from "@shared/integration/sdkProfileRefCodec.js";

export const SDK_ACCOUNT_ACTIVATE_GRANT_TTL_MS = 120_000;

export type SdkAccountActivateGrant = Readonly<{
  clientId: string;
  profileRef: string;
  profileId: string;
  expiresAtMs: number;
}>;

export type IssueSdkAccountActivateGrantInput = Readonly<{
  clientId: string;
  profileId: string;
  nowMs: number;
  ttlMs?: number;
}>;

export type IssueSdkAccountActivateGrantResult =
  | { readonly ok: true; readonly grant: SdkAccountActivateGrant }
  | { readonly ok: false; readonly reason: "invalid_profile" | "ref_too_long" };

/**
 * In-memory desktop grant registry. Not a reusable bearer for browser apps.
 */
export class SdkAccountActivateGrantStore {
  private readonly grants = new Map<string, SdkAccountActivateGrant>();

  issue(
    input: IssueSdkAccountActivateGrantInput,
  ): IssueSdkAccountActivateGrantResult {
    const clientId = input.clientId.trim();
    const profileId = input.profileId.trim();
    if (clientId.length === 0 || profileId.length === 0) {
      return { ok: false, reason: "invalid_profile" };
    }
    const profileRef = encodeSdkProfileRef(profileId);
    if (profileRef === null) {
      return { ok: false, reason: "ref_too_long" };
    }
    const ttlMs =
      input.ttlMs !== undefined && input.ttlMs > 0
        ? input.ttlMs
        : SDK_ACCOUNT_ACTIVATE_GRANT_TTL_MS;
    const grant: SdkAccountActivateGrant = {
      clientId,
      profileRef,
      profileId,
      expiresAtMs: input.nowMs + ttlMs,
    };
    this.grants.set(grantKey(clientId, profileRef), grant);
    return { ok: true, grant };
  }

  /**
   * Local approval gate: valid, non-expired grant for this client + profileRef.
   */
  hasValidGrant(
    clientId: string,
    profileRef: string,
    nowMs: number,
  ): boolean {
    this.prune(nowMs);
    const grant = this.grants.get(grantKey(clientId, profileRef));
    return grant !== undefined && grant.expiresAtMs > nowMs;
  }

  hasAnyValidGrant(clientId: string, nowMs: number): boolean {
    this.prune(nowMs);
    for (const grant of this.grants.values()) {
      if (grant.clientId === clientId && grant.expiresAtMs > nowMs) {
        return true;
      }
    }
    return false;
  }

  clearForClient(clientId: string): number {
    let cleared = 0;
    for (const [key, grant] of this.grants) {
      if (grant.clientId === clientId) {
        this.grants.delete(key);
        cleared += 1;
      }
    }
    return cleared;
  }

  clearAll(): void {
    this.grants.clear();
  }

  prune(nowMs: number): void {
    for (const [key, grant] of this.grants) {
      if (grant.expiresAtMs <= nowMs) {
        this.grants.delete(key);
      }
    }
  }
}

function grantKey(clientId: string, profileRef: string): string {
  return `${clientId}\0${profileRef}`;
}
