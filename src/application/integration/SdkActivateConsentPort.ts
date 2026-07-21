/**
 * Application port for per-request saved-profile activation consent.
 * Renderer owns the deferred UI implementation; Application owns the decision.
 */
export interface SdkActivateConsentPort {
  requestConsent(input: {
    readonly origin: string;
    readonly profileLabel: string;
    readonly profileRef: string;
  }): Promise<"allow" | "deny" | "dismiss">;
}
