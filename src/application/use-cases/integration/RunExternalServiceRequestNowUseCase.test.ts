import { describe, expect, it } from "vitest";
import { DeterministicUuidGenerator } from "@adapters/mock/DeterministicUuidGenerator.js";
import { InMemoryExternalServicesJournalRepository } from "@adapters/mock/InMemoryExternalServicesJournalRepository.js";
import { MockClock } from "@adapters/mock/MockClock.js";
import { MockOutboundHttpAdapter } from "@adapters/mock/MockOutboundHttpAdapter.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import { createExternalServicesComposition } from "../../services/integration/external-services/ExternalServicesComposition.js";
import {
  createExternalServicesTestSettings,
  EXTERNAL_SERVICES_TEST_PROFILE_KEY,
} from "../../services/integration/external-services/externalServicesTestFixtures.js";
describe("RunExternalServiceRequestNowUseCase", () => {
  it("runs disabled definitions through the shared queue as manual_run", async () => {
    const http = new MockOutboundHttpAdapter();
    http.enqueueResult({
      kind: "response",
      status: 200,
      durationMs: 5,
      body: "ok",
    });
    const composition = createExternalServicesComposition({
      outboundHttp: http,
      journalRepository: new InMemoryExternalServicesJournalRepository(),
      clock: new MockClock(new Date("2026-07-29T12:00:00.000Z")),
      uuidGenerator: new DeterministicUuidGenerator(),
      logger: createTestLogger({ featureId: "F-031", boundedContext: "Integration" }),
    });
    const settings = createExternalServicesTestSettings({
      collectionEnabled: false,
      requestEnabled: false,
    });
    composition.registry.activateProfile(
      EXTERNAL_SERVICES_TEST_PROFILE_KEY,
      settings,
      1,
    );

    const collectionId = settings.collections[0]!.id;
    const requestId = settings.collections[0]!.requests[0]!.id;
    const resultPromise = composition.runExternalServiceRequestNow({
      collectionId,
      requestId,
      expectedSettingsRevision: 1,
      profileKey: EXTERNAL_SERVICES_TEST_PROFILE_KEY,
      occurredAt: "2026-07-29T12:00:00.000Z",
      userLogin: "agent.login",
    });
    await Promise.resolve();
    await Promise.resolve();
    const result = await resultPromise;

    expect(result.kind).toBe("success");
    expect(http.getInvocations()[0]?.body).toContain("manual_run");
    expect(http.getInvocations()[0]?.url).toContain("crm.example.test");
  });

  it("resolves user_login from manual run profile facts", async () => {
    const http = new MockOutboundHttpAdapter();
    http.enqueueResult({
      kind: "response",
      status: 200,
      durationMs: 4,
      body: "ok",
    });
    const composition = createExternalServicesComposition({
      outboundHttp: http,
      journalRepository: new InMemoryExternalServicesJournalRepository(),
      clock: new MockClock(new Date("2026-07-29T12:00:00.000Z")),
      uuidGenerator: new DeterministicUuidGenerator(),
      logger: createTestLogger({ featureId: "F-031", boundedContext: "Integration" }),
    });
    const settings = createExternalServicesTestSettings({
      url: "https://hooks.example.test/run?login={{user_login}}",
      body: { mode: "none", value: "" },
    });
    composition.registry.activateProfile(
      EXTERNAL_SERVICES_TEST_PROFILE_KEY,
      settings,
      1,
    );

    const resultPromise = composition.runExternalServiceRequestNow({
      collectionId: settings.collections[0]!.id,
      requestId: settings.collections[0]!.requests[0]!.id,
      expectedSettingsRevision: 1,
      profileKey: EXTERNAL_SERVICES_TEST_PROFILE_KEY,
      occurredAt: "2026-07-29T12:00:00.000Z",
      userLogin: "ocp.agent",
    });
    await Promise.resolve();
    await Promise.resolve();
    await resultPromise;

    expect(http.getInvocations()[0]?.url).toBe(
      "https://hooks.example.test/run?login=ocp.agent",
    );
  });

  it("rejects stale revisions and missing request IDs", async () => {
    const composition = createExternalServicesComposition({
      outboundHttp: new MockOutboundHttpAdapter(),
      journalRepository: new InMemoryExternalServicesJournalRepository(),
      clock: new MockClock(new Date("2026-07-29T12:00:00.000Z")),
      uuidGenerator: new DeterministicUuidGenerator(),
      logger: createTestLogger({ featureId: "F-031", boundedContext: "Integration" }),
    });
    composition.registry.activateProfile(
      EXTERNAL_SERVICES_TEST_PROFILE_KEY,
      createExternalServicesTestSettings(),
      1,
    );

    const settings = createExternalServicesTestSettings();
    await expect(
      composition.runExternalServiceRequestNow({
        collectionId: settings.collections[0]!.id,
        requestId: settings.collections[0]!.requests[0]!.id,
        expectedSettingsRevision: 99,
        profileKey: EXTERNAL_SERVICES_TEST_PROFILE_KEY,
        occurredAt: "2026-07-29T12:00:00.000Z",
      }),
    ).resolves.toMatchObject({
      kind: "error",
      category: "validation",
      code: "stale_settings_revision",
    });
  });
});
