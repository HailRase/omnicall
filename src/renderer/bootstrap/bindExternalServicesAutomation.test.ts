import { afterEach, describe, expect, it, vi } from "vitest";
import type { AccountBootstrapProjection } from "@application/projections/settings/accountBootstrapProjection.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import { bindExternalServicesAutomation } from "./bindExternalServicesAutomation.js";

const initialStoreState = useAccountBootstrapStore.getState();
const profileKey = "1001@pbx.example" as NonNullable<
  AccountBootstrapProjection["profileKey"]
>;

afterEach(() => {
  useAccountBootstrapStore.setState(initialStoreState, true);
});

describe("bindExternalServicesAutomation", () => {
  it("forwards the post-commit focused snapshot and unsubscribes on dispose", () => {
    const eventPublisher = new InMemoryDomainEventBus();
    const handleExternalServicesCommittedEvent = vi.fn();
    useAccountBootstrapStore.setState({
      projection: {
        ...initialStoreState.projection,
        hasActiveAccountSession: true,
        profileKey,
        sipUsername: "1001",
      },
      callFocusProjection: {
        focusedCallId: "call-1",
        explicitCallId: "call-1",
        suspendedExplicitCallId: null,
      },
    });
    const bound = bindExternalServicesAutomation({
      eventPublisher,
      handleExternalServicesCommittedEvent,
    });
    const event = {
      type: "CallAnswered",
      callId: "call-1",
      correlationId: createCorrelationId(),
      occurredAt: "2026-07-30T07:00:00.000Z",
    };

    eventPublisher.publish(event);

    expect(handleExternalServicesCommittedEvent).toHaveBeenCalledWith(event, {
      profileKey,
      focusedCallId: "call-1",
      userLogin: "1001",
    });

    bound.dispose();
    eventPublisher.publish(event);
    expect(handleExternalServicesCommittedEvent).toHaveBeenCalledTimes(1);
  });
});
