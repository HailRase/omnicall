/**
 * Single-flight activate consent queue (ADR-0018 §E pending guard).
 */

import type { SdkActivateConsentPort } from "./SdkActivateConsentPort.js";

export type SdkActivateConsentPending = Readonly<{
  origin: string;
  profileLabel: string;
  profileRef: string;
}>;

type Deferred = {
  readonly pending: SdkActivateConsentPending;
  readonly resolve: (
    decision: "allow" | "deny" | "dismiss",
  ) => void;
};

/**
 * Renderer-owned deferred consent: one pending modal; duplicates rejected by handler.
 */
export class DeferredSdkActivateConsent implements SdkActivateConsentPort {
  private deferred: Deferred | null = null;
  private readonly onPendingChange: (
    pending: SdkActivateConsentPending | null,
  ) => void;

  constructor(input?: {
    readonly onPendingChange?: (
      pending: SdkActivateConsentPending | null,
    ) => void;
  }) {
    this.onPendingChange = input?.onPendingChange ?? (() => undefined);
  }

  getPending(): SdkActivateConsentPending | null {
    return this.deferred?.pending ?? null;
  }

  isPending(): boolean {
    return this.deferred !== null;
  }

  requestConsent(input: {
    readonly origin: string;
    readonly profileLabel: string;
    readonly profileRef: string;
  }): Promise<"allow" | "deny" | "dismiss"> {
    if (this.deferred !== null) {
      return Promise.resolve("deny");
    }
    return new Promise<"allow" | "deny" | "dismiss">((resolve) => {
      this.deferred = {
        pending: {
          origin: input.origin,
          profileLabel: input.profileLabel,
          profileRef: input.profileRef,
        },
        resolve,
      };
      this.onPendingChange(this.deferred.pending);
    });
  }

  settle(decision: "allow" | "deny" | "dismiss"): boolean {
    if (this.deferred === null) {
      return false;
    }
    const entry = this.deferred;
    this.deferred = null;
    this.onPendingChange(null);
    entry.resolve(decision);
    return true;
  }
}
