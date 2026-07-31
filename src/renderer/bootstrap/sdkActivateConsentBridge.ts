/**
 * Shared activate-consent deferred between broker bind and SoftphoneReadyShell UI.
 */

import {
  DeferredSdkActivateConsent,
  type SdkActivateConsentPending,
} from "@application/integration/DeferredSdkActivateConsent.js";

type Listener = (pending: SdkActivateConsentPending | null) => void;

const listeners = new Set<Listener>();

export const sdkActivateConsentBridge = new DeferredSdkActivateConsent({
  onPendingChange: (pending) => {
    for (const listener of listeners) {
      listener(pending);
    }
  },
});

export function subscribeSdkActivateConsent(
  listener: Listener,
): () => void {
  listeners.add(listener);
  listener(sdkActivateConsentBridge.getPending());
  return () => {
    listeners.delete(listener);
  };
}
