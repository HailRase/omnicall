/**
 * - Purpose: forward committed product facts to External Services automation.
 * - Inputs: initialized facade and the committed bootstrap projection store.
 * - Outputs: disposable, synchronous post-commit event subscription.
 */
import { readExternalServicesProductStateFromStore } from "@application/integration/readExternalServicesProductStateFromStore.js";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";

export type BoundExternalServicesAutomation = Readonly<{
  dispose: () => void;
}>;

export type ExternalServicesAutomationFacade = Pick<
  AccountBootstrapFacade,
  "eventPublisher" | "handleExternalServicesCommittedEvent"
>;

export function bindExternalServicesAutomation(
  facade: ExternalServicesAutomationFacade,
): BoundExternalServicesAutomation {
  const unsubscribe = facade.eventPublisher.subscribe((event) => {
    const snapshot = readExternalServicesProductStateFromStore(
      useAccountBootstrapStore.getState(),
    );
    if (snapshot === null) {
      return;
    }
    facade.handleExternalServicesCommittedEvent(event, snapshot);
  });
  return { dispose: unsubscribe };
}
