/**
 * - Purpose: prove External Services profile lifecycle isolation for WU-05.
 * - Inputs: mock composition, deferred HTTP, dual-profile settings and journals.
 * - Outputs: logout/disable/in-flight and A/B isolation assertions.
 */

import { describe, expect, it, vi } from "vitest";
import {
  createCallId,
  createDefaultUserSettings,
  createSettingsAccountKey,
  createUserSessionEndedEvent,
  createAccountSessionActivatedEvent,
} from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { DeterministicUuidGenerator } from "@adapters/mock/DeterministicUuidGenerator.js";
import { InMemoryExternalServicesJournalRepository } from "@adapters/mock/InMemoryExternalServicesJournalRepository.js";
import { MockClock } from "@adapters/mock/MockClock.js";
import { MockOutboundHttpAdapter } from "@adapters/mock/MockOutboundHttpAdapter.js";
import { InMemorySettingsRepository } from "@adapters/settings/InMemorySettingsRepository.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createSoftphoneComposition } from "@infrastructure/bootstrap/createSoftphoneComposition.js";
import { createExternalServicesComposition } from "./ExternalServicesComposition.js";
import {
  createExternalServicesTestSettings,
} from "./externalServicesTestFixtures.js";

const profileA = createSettingsAccountKey("agent-a@example.test");
const profileB = createSettingsAccountKey("agent-b@example.test");

describe("External Services profile lifecycle", () => {
  it("isolates config and journal across profiles A and B", async () => {
    const journal = new InMemoryExternalServicesJournalRepository();
    const settingsRepository = new InMemorySettingsRepository();
    const settingsA = createExternalServicesTestSettings({
      url: "https://a.example.test/hook",
    });
    const settingsB = createExternalServicesTestSettings({
      url: "https://b.example.test/hook",
    });
    await settingsRepository.setActiveProfileKey(profileA);
    await settingsRepository.saveUserSettings(profileA, {
      ...createDefaultUserSettings(),
      externalServices: settingsA,
    });
    await settingsRepository.saveUserSettings(profileB, {
      ...createDefaultUserSettings(),
      externalServices: settingsB,
    });
    const http = new MockOutboundHttpAdapter();
    http.enqueueResult({
      kind: "response",
      status: 200,
      durationMs: 1,
      body: "a",
    });
    http.enqueueResult({
      kind: "response",
      status: 201,
      durationMs: 1,
      body: "b",
    });
    const composition = createExternalServicesComposition({
      outboundHttp: http,
      journalRepository: journal,
      clock: new MockClock(new Date("2026-07-29T12:00:00.000Z")),
      uuidGenerator: new DeterministicUuidGenerator(),
      logger: createTestLogger({ featureId: "F-031", boundedContext: "Integration" }),
      settingsRepository,
    });

    composition.activateProfile(profileA, settingsA);
    await composition.runExternalServiceRequestNow({
      collectionId: settingsA.collections[0]!.id,
      requestId: settingsA.collections[0]!.requests[0]!.id,
      expectedSettingsRevision: 1,
      profileKey: profileA,
      occurredAt: "2026-07-29T12:00:00.000Z",
    });
    composition.activateProfile(profileB, settingsB);
    await composition.runExternalServiceRequestNow({
      collectionId: settingsB.collections[0]!.id,
      requestId: settingsB.collections[0]!.requests[0]!.id,
      expectedSettingsRevision: 1,
      profileKey: profileB,
      occurredAt: "2026-07-29T12:00:01.000Z",
    });

    const queryA = await composition.queryExternalServices({ profileKey: profileA });
    const queryB = await composition.queryExternalServices({ profileKey: profileB });
    expect(queryA.ok && queryB.ok).toBe(true);
    if (!queryA.ok || !queryB.ok) {
      return;
    }
    expect(queryA.value.matchingEnabled).toBe(false);
    expect(queryB.value.matchingEnabled).toBe(true);
    expect(queryA.value.journal[0]?.requestUrl).toContain("a.example.test");
    expect(queryB.value.journal[0]?.requestUrl).toContain("b.example.test");
    expect(queryA.value.settings.collections[0]?.requests[0]?.url).toContain(
      "a.example.test",
    );
  });

  it("cancels pending work on logout while in-flight finishes into old journal", async () => {
    const journal = new InMemoryExternalServicesJournalRepository();
    const http = new MockOutboundHttpAdapter();
    http.enqueueDeferred();
    const settings = createExternalServicesTestSettings();
    const composition = createExternalServicesComposition({
      outboundHttp: http,
      journalRepository: journal,
      clock: new MockClock(new Date("2026-07-29T12:00:00.000Z")),
      uuidGenerator: new DeterministicUuidGenerator(),
      logger: createTestLogger({ featureId: "F-031", boundedContext: "Integration" }),
    });
    composition.activateProfile(profileA, settings);
    const callId = createCallId("call-lifecycle-1");
    const snapshot = {
      profileKey: profileA,
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
    composition.handleCommittedEvent(
      {
        type: "CallAnswered",
        callId,
        correlationId: createCorrelationId(),
        occurredAt: "2026-07-29T12:00:00.000Z",
      },
      snapshot,
    );
    await vi.waitFor(() => {
      expect(composition.queue.getInFlightCount()).toBe(1);
      expect(http.getDeferredInvocations()).toHaveLength(1);
    });

    composition.invalidateLifecycle();
    composition.handleCommittedEvent(
      {
        type: "CallAnswered",
        callId,
        correlationId: createCorrelationId(),
        occurredAt: "2026-07-29T12:00:01.000Z",
      },
      snapshot,
    );
    expect(composition.queue.getPendingCount()).toBe(0);
    expect(composition.registry.getSnapshot().profileKey).toBeNull();

    http.getDeferredInvocations()[0]?.resolve({
      kind: "response",
      status: 204,
      durationMs: 4,
      body: "",
    });
    await vi.waitFor(async () => {
      const entries = await journal.list(profileA, 10);
      expect(entries).toHaveLength(1);
    });
  });

  it("drops pending deleted or disabled definitions before they start", async () => {
    const http = new MockOutboundHttpAdapter();
    http.enqueueDeferred();
    const settings = createExternalServicesTestSettings();
    const composition = createExternalServicesComposition({
      outboundHttp: http,
      journalRepository: new InMemoryExternalServicesJournalRepository(),
      clock: new MockClock(new Date("2026-07-29T12:00:00.000Z")),
      uuidGenerator: new DeterministicUuidGenerator(),
      logger: createTestLogger({ featureId: "F-031", boundedContext: "Integration" }),
    });
    composition.activateProfile(profileA, settings);
    const callId = createCallId("call-lifecycle-2");
    const snapshot = {
      profileKey: profileA,
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
    composition.handleCommittedEvent(
      {
        type: "CallAnswered",
        callId,
        correlationId: createCorrelationId(),
        occurredAt: "2026-07-29T12:00:00.000Z",
      },
      snapshot,
    );
    await vi.waitFor(() => {
      expect(composition.queue.getInFlightCount()).toBe(1);
      expect(http.getDeferredInvocations()).toHaveLength(1);
    });

    composition.handleCommittedEvent(
      {
        type: "CallAnswered",
        callId,
        correlationId: createCorrelationId(),
        occurredAt: "2026-07-29T12:00:01.000Z",
      },
      snapshot,
    );
    expect(composition.queue.getPendingCount()).toBe(1);
    composition.replaceActiveSettings(
      createExternalServicesTestSettings({ requestEnabled: false }),
    );
    expect(composition.queue.getPendingCount()).toBe(0);

    http.getDeferredInvocations()[0]?.resolve({
      kind: "response",
      status: 200,
      durationMs: 1,
      body: "ok",
    });
    await vi.waitFor(() => {
      expect(composition.queue.getInFlightCount()).toBe(0);
    });
    expect(http.getInvocations()).toHaveLength(1);
  });

  it("activates on AccountSessionActivated and disables matching after UserSessionEnded", async () => {
    const settingsRepository = new InMemorySettingsRepository();
    const settings = createExternalServicesTestSettings();
    await settingsRepository.setActiveProfileKey(profileA);
    await settingsRepository.saveUserSettings(profileA, {
      ...createDefaultUserSettings(),
      externalServices: settings,
    });
    const http = new MockOutboundHttpAdapter();
    http.enqueueResult({
      kind: "response",
      status: 200,
      durationMs: 1,
      body: "ok",
    });
    const facade = createSoftphoneComposition({
      mode: "mock",
      settingsRepository,
      outboundHttp: http,
      externalServicesUuidGenerator: new DeterministicUuidGenerator(),
      externalServicesClock: new MockClock(new Date("2026-07-29T12:00:00.000Z")),
    });
    const composition = facade.getExternalServicesCompositionForTests();
    expect(composition).not.toBeNull();
    if (composition === null) {
      return;
    }

    facade.eventPublisher.publish(
      createAccountSessionActivatedEvent(createCorrelationId(), {
        profileKey: profileA,
      }),
    );
    await vi.waitFor(() => {
      expect(composition.registry.getSnapshot().profileKey).toBe(profileA);
    });

    facade.eventPublisher.publish(createUserSessionEndedEvent(createCorrelationId()));
    await vi.waitFor(() => {
      expect(composition.registry.getSnapshot().profileKey).toBeNull();
    });

    const callId = createCallId("call-lifecycle-3");
    facade.handleExternalServicesCommittedEvent(
      {
        type: "CallAnswered",
        callId,
        correlationId: createCorrelationId(),
        occurredAt: "2026-07-29T12:00:00.000Z",
      },
      {
        profileKey: profileA,
        focusedCallId: callId,
      },
    );
    expect(http.getInvocations()).toHaveLength(0);
    facade.dispose();
  });

  it("does not promote External Services runtime after failed draft sign-in", async () => {
    const settingsRepository = new InMemorySettingsRepository();
    await settingsRepository.saveUserSettings(profileA, {
      ...createDefaultUserSettings(),
      externalServices: createExternalServicesTestSettings(),
    });
    const facade = createSoftphoneComposition({
      mode: "mock",
      settingsRepository,
    });
    const composition = facade.getExternalServicesCompositionForTests();
    expect(composition).not.toBeNull();
    if (composition === null) {
      return;
    }

    const result = await facade.authorizeManualAccount(
      {
        username: "",
        domain: "example.test",
        server: "wss://sip.example.test",
        password: "bad",
      },
      { saveProfile: false },
    );
    expect(result.ok).toBe(false);
    expect(composition.registry.getSnapshot().profileKey).toBeNull();
    facade.dispose();
  });
});
