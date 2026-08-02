/**
 * - Purpose: forward committed product facts to External Applications automation.
 * - Inputs: initialized facade and the committed bootstrap projection store.
 * - Outputs: disposable, synchronous post-commit event subscription.
 */

import { readExternalServicesProductStateFromStore } from "@application/integration/readExternalServicesProductStateFromStore.js";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";

export type BoundExternalApplicationsAutomation = Readonly<{
  dispose: () => void;
}>;

export type ExternalApplicationsAutomationFacade = Pick<
  AccountBootstrapFacade,
  "eventPublisher" | "handleExternalApplicationsCommittedEvent"
>;

export function bindExternalApplicationsAutomation(
  facade: ExternalApplicationsAutomationFacade,
): BoundExternalApplicationsAutomation {
  const unsubscribe = facade.eventPublisher.subscribe((event) => {
    const snapshot = readExternalServicesProductStateFromStore(
      useAccountBootstrapStore.getState(),
    );
    if (snapshot === null) {
      return;
    }
    facade.handleExternalApplicationsCommittedEvent(event, snapshot);
  });
  return { dispose: unsubscribe };
}
