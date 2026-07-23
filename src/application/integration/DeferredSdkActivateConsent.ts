/**
 * Single-flight activate consent queue (ADR-0018 §E pending guard + consent TTL).
 */

import type {
  SdkActivateConsentDecision,
  SdkActivateConsentPort,
  SdkActivateConsentRequest,
} from "./SdkActivateConsentPort.js";
import type { SdkActivateMode } from "./ExternalSdkAccountPort.js";
import { createCorrelationId } from "@shared/correlation-id/createCorrelationId.js";
import { SDK_ACTIVATE_CONSENT_TTL_MS } from "./sdkActivateTimeouts.js";

export type SdkActivateConsentPending = Readonly<{
  kind: SdkActivateConsentRequest["kind"];
  origin: string;
  login: string;
  profileLabel: string;
  availableModes: readonly SdkActivateMode[];
  /**
   * Unique per consent episode — shell window raise dedupe (ADR-0013), like pairingRequestId.
   */
  attentionId: string;
  preferredMode?: SdkActivateMode;
  currentProfileLabel?: string | null;
}>;

type Deferred = {
  readonly pending: SdkActivateConsentPending;
  readonly resolve: (decision: SdkActivateConsentDecision) => void;
  readonly clearTtl: () => void;
};

export type ConsentTimeoutScheduler = (
  callback: () => void,
  ms: number,
) => { readonly clear: () => void };

/**
 * Renderer-owned deferred consent: one pending modal; duplicates rejected by handler.
 * Activate/reauthorize episodes auto-dismiss with `timeout` after consent TTL.
 */
export class DeferredSdkActivateConsent implements SdkActivateConsentPort {
  private deferred: Deferred | null = null;
  private readonly onPendingChange: (
    pending: SdkActivateConsentPending | null,
  ) => void;
  private readonly createAttentionId: () => string;
  private readonly consentTtlMs: number;
  private readonly scheduleTimeout: ConsentTimeoutScheduler;

  constructor(input?: {
    readonly onPendingChange?: (
      pending: SdkActivateConsentPending | null,
    ) => void;
    readonly createAttentionId?: () => string;
    readonly consentTtlMs?: number;
    readonly scheduleTimeout?: ConsentTimeoutScheduler;
  }) {
    this.onPendingChange = input?.onPendingChange ?? (() => undefined);
    this.createAttentionId =
      input?.createAttentionId ?? (() => createCorrelationId());
    this.consentTtlMs = input?.consentTtlMs ?? SDK_ACTIVATE_CONSENT_TTL_MS;
    this.scheduleTimeout =
      input?.scheduleTimeout ??
      ((callback, ms) => {
        const handle = setTimeout(callback, ms);
        return {
          clear: () => {
            clearTimeout(handle);
          },
        };
      });
  }

  getPending(): SdkActivateConsentPending | null {
    return this.deferred?.pending ?? null;
  }

  isPending(): boolean {
    return this.deferred !== null;
  }

  requestConsent(
    input: SdkActivateConsentRequest,
  ): Promise<SdkActivateConsentDecision> {
    if (this.deferred !== null) {
      return Promise.resolve({ decision: "deny" });
    }
    return new Promise<SdkActivateConsentDecision>((resolve) => {
      const ttl = this.scheduleTimeout(() => {
        if (this.deferred === null) {
          return;
        }
        const entry = this.deferred;
        this.deferred = null;
        this.onPendingChange(null);
        entry.resolve({ decision: "timeout" });
      }, this.consentTtlMs);

      this.deferred = {
        pending: {
          kind: input.kind,
          origin: input.origin,
          login: input.login,
          profileLabel: input.profileLabel,
          availableModes: input.availableModes,
          attentionId: this.createAttentionId(),
          ...(input.preferredMode !== undefined
            ? { preferredMode: input.preferredMode }
            : {}),
        },
        resolve,
        clearTtl: ttl.clear,
      };
      this.onPendingChange(this.deferred.pending);
    });
  }

  notifyLogoutRequired(input: {
    readonly origin: string;
    readonly login: string;
    readonly profileLabel: string;
    readonly currentProfileLabel: string | null;
  }): void {
    if (this.deferred !== null) {
      return;
    }
    this.deferred = {
      pending: {
        kind: "logout_required",
        origin: input.origin,
        login: input.login,
        profileLabel: input.profileLabel,
        availableModes: [],
        attentionId: this.createAttentionId(),
        currentProfileLabel: input.currentProfileLabel,
      },
      resolve: () => undefined,
      clearTtl: () => undefined,
    };
    this.onPendingChange(this.deferred.pending);
  }

  settle(
    decision: "allow" | "deny" | "dismiss",
    mode?: SdkActivateMode,
  ): boolean {
    if (this.deferred === null) {
      return false;
    }
    const entry = this.deferred;
    this.deferred = null;
    entry.clearTtl();
    this.onPendingChange(null);
    if (entry.pending.kind === "logout_required") {
      entry.resolve({ decision: "dismiss" });
      return true;
    }
    if (decision === "allow") {
      const resolvedMode =
        mode ??
        entry.pending.preferredMode ??
        entry.pending.availableModes[0];
      if (resolvedMode === undefined) {
        entry.resolve({ decision: "dismiss" });
        return true;
      }
      entry.resolve({ decision: "allow", mode: resolvedMode });
      return true;
    }
    entry.resolve({ decision });
    return true;
  }
}
