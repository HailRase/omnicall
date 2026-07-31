import { describe, expect, it, vi } from "vitest";
import { createCallId } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { DeterministicUuidGenerator } from "@adapters/mock/DeterministicUuidGenerator.js";
import { InMemoryExternalServicesJournalRepository } from "@adapters/mock/InMemoryExternalServicesJournalRepository.js";
import { MockClock } from "@adapters/mock/MockClock.js";
import { MockOutboundHttpAdapter } from "@adapters/mock/MockOutboundHttpAdapter.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import { createSoftphoneComposition } from "@infrastructure/bootstrap/createSoftphoneComposition.js";
import { createExternalServicesComposition } from "./ExternalServicesComposition.js";
import {
  createExternalServicesTestSettings,
  EXTERNAL_SERVICES_TEST_PROFILE_KEY,
} from "./externalServicesTestFixtures.js";

describe("ExternalServicesAutomation integration", () => {
  it("returns from handleCommittedEvent while mock HTTP remains unresolved", async () => {
    const http = new MockOutboundHttpAdapter();
    http.enqueueDeferred();
    const composition = createExternalServicesComposition({
      outboundHttp: http,
      journalRepository: new InMemoryExternalServicesJournalRepository(),
      clock: new MockClock(new Date("2026-07-29T12:00:00.000Z")),
      uuidGenerator: new DeterministicUuidGenerator(),
      logger: createTestLogger({ featureId: "F-031", boundedContext: "Integration" }),
    });
    const settings = createExternalServicesTestSettings();
    const callId = createCallId("call-external-services-1");
    composition.activateProfile(EXTERNAL_SERVICES_TEST_PROFILE_KEY, settings);

    const snapshot = {
      profileKey: EXTERNAL_SERVICES_TEST_PROFILE_KEY,
      settings,
      settingsRevision: 1,
      focusedCallId: callId,
    };
    composition.handleCommittedEvent(
      {
        type: "IncomingCallReceived",
        callId,
        phoneNumber: "100",
        correlationId: createCorrelationId(),
        occurredAt: "2026-07-29T12:00:00.000Z",
      },
      snapshot,
    );
    const started = Date.now();
    composition.handleCommittedEvent(
      {
        type: "CallAnswered",
        callId,
        correlationId: createCorrelationId(),
        occurredAt: "2026-07-29T12:00:00.000Z",
      },
      snapshot,
    );
    const elapsed = Date.now() - started;

    expect(elapsed).toBeLessThan(50);
    await vi.waitFor(() => {
      expect(http.getDeferredInvocations()).toHaveLength(1);
    });
    expect(http.getInvocations()).toHaveLength(1);

    http.getDeferredInvocations()[0]?.resolve({
      kind: "response",
      status: 200,
      durationMs: 1,
      body: "ok",
    });
  });

  it("wires synthetic handleCommittedEvent through softphone composition", async () => {
    const http = new MockOutboundHttpAdapter();
    http.enqueueResult({
      kind: "response",
      status: 204,
      durationMs: 3,
      body: "",
    });
    const facade = createSoftphoneComposition({
      mode: "mock",
      outboundHttp: http,
      externalServicesUuidGenerator: new DeterministicUuidGenerator(),
      externalServicesClock: new MockClock(new Date("2026-07-29T12:00:00.000Z")),
    });
    const callId = createCallId("call-external-services-2");
    const settings = createExternalServicesTestSettings();
    facade
      .getExternalServicesCompositionForTests()
      ?.activateProfile(EXTERNAL_SERVICES_TEST_PROFILE_KEY, settings);

    const snapshot = {
      profileKey: EXTERNAL_SERVICES_TEST_PROFILE_KEY,
      settings,
      settingsRevision: 1,
      focusedCallId: callId,
    };
    facade.handleExternalServicesCommittedEvent(
      {
        type: "IncomingCallReceived",
        callId,
        phoneNumber: "100",
        correlationId: createCorrelationId(),
        occurredAt: "2026-07-29T12:00:00.000Z",
      },
      snapshot,
    );
    facade.handleExternalServicesCommittedEvent(
      {
        type: "CallAnswered",
        callId,
        correlationId: createCorrelationId(),
        occurredAt: "2026-07-29T12:00:00.000Z",
      },
      snapshot,
    );
    await vi.waitFor(() => {
      expect(http.getInvocations()).toHaveLength(1);
    });
    expect(facade.getExternalServicesCompositionForTests()).not.toBeNull();
    facade.dispose();
  });
});
