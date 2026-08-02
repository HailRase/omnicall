import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { DeterministicUuidGenerator } from "@adapters/mock/DeterministicUuidGenerator.js";
import { InMemoryExternalServicesJournalRepository } from "@adapters/mock/InMemoryExternalServicesJournalRepository.js";
import { MockClock } from "@adapters/mock/MockClock.js";
import { MockOutboundHttpAdapter } from "@adapters/mock/MockOutboundHttpAdapter.js";
import type { ExternalServicesJournalRepository } from "@ports/integration/ExternalServicesJournalRepository.js";
import type { ExternalServiceJournalEntry, SettingsAccountKey } from "@domain/index.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import type { ExternalServiceDispatchJob } from "../../services/integration/external-services/ExternalServiceDispatchJob.js";
import {
  createExternalServicesTestSettings,
  EXTERNAL_SERVICES_TEST_PROFILE_KEY,
} from "../../services/integration/external-services/externalServicesTestFixtures.js";
import { ExecuteExternalServiceRequestUseCase } from "./ExecuteExternalServiceRequestUseCase.js";

class FailingJournalRepository implements ExternalServicesJournalRepository {
  list(
    profileKey: SettingsAccountKey,
    limit: number,
  ): Promise<ReadonlyArray<ExternalServiceJournalEntry>> {
    void profileKey;
    void limit;
    return Promise.resolve([]);
  }

  append(
    profileKey: SettingsAccountKey,
    entry: ExternalServiceJournalEntry,
  ): Promise<void> {
    void profileKey;
    void entry;
    return Promise.reject(new Error("disk full"));
  }
}

function createJob(
  overrides: Partial<ExternalServiceDispatchJob> = {},
): ExternalServiceDispatchJob {
  const settings = createExternalServicesTestSettings();
  const collection = settings.collections[0]!;
  const request = collection.requests[0]!;
  return {
    jobId: "job-1",
    correlationId: createCorrelationId(),
    profileKey: EXTERNAL_SERVICES_TEST_PROFILE_KEY,
    lifecycleGeneration: 1,
    settingsRevision: 1,
    collectionId: collection.id,
    requestId: request.id,
    collectionName: collection.name,
    requestName: request.name,
    collection,
    request,
    trigger: {
      eventType: "call_answered",
      occurredAt: "2026-07-29T12:00:00.000Z",
      profileKey: EXTERNAL_SERVICES_TEST_PROFILE_KEY,
      callId: "call-1",
    },
    mode: "automatic",
    resolveManual: null,
    ...overrides,
  };
}

describe("ExecuteExternalServiceRequestUseCase", () => {
  it("classifies 2xx success and redacts protected journal headers", async () => {
    const http = new MockOutboundHttpAdapter();
    http.enqueueResult({
      kind: "response",
      status: 201,
      durationMs: 12,
      body: "{\"ok\":true}",
    });
    const journal = new InMemoryExternalServicesJournalRepository();
    const logger = createTestLogger({ featureId: "F-031", boundedContext: "Integration" });
    const useCase = new ExecuteExternalServiceRequestUseCase({
      outboundHttp: http,
      journalRepository: journal,
      clock: new MockClock(new Date("2026-07-29T12:00:00.000Z")),
      uuidGenerator: new DeterministicUuidGenerator(),
      logger,
    });

    const result = await useCase.execute(createJob());
    const entries = await journal.list(EXTERNAL_SERVICES_TEST_PROFILE_KEY, 10);

    expect(result).toMatchObject({
      kind: "success",
      status: 201,
      body: "{\"ok\":true}",
      jsonValidity: "valid",
    });
    expect(entries[0]?.requestHeaders[0]?.value).toBe("***");
    expect(entries[0]?.requestBody).toBe("{\"event\":\"call_answered\"}");
    expect(entries[0]?.requestBodyTruncated).toBe(false);
    expect(entries[0]?.outcome).toBe("http_success");
    expect(JSON.stringify(logger.entries)).not.toContain("Bearer secret-token");
    expect(JSON.stringify(logger.entries)).not.toContain("crm.example.test");
  });

  it("journals empty request body when body mode is none", async () => {
    const http = new MockOutboundHttpAdapter();
    http.enqueueResult({
      kind: "response",
      status: 204,
      durationMs: 5,
      body: "",
    });
    const journal = new InMemoryExternalServicesJournalRepository();
    const useCase = new ExecuteExternalServiceRequestUseCase({
      outboundHttp: http,
      journalRepository: journal,
      clock: new MockClock(new Date("2026-07-29T12:00:00.000Z")),
      uuidGenerator: new DeterministicUuidGenerator(),
      logger: createTestLogger({ featureId: "F-031", boundedContext: "Integration" }),
    });
    const settings = createExternalServicesTestSettings({
      body: { mode: "none", value: "" },
    });
    const collection = settings.collections[0]!;
    const request = collection.requests[0]!;

    await useCase.execute(
      createJob({
        collection,
        request,
        collectionId: collection.id,
        requestId: request.id,
        collectionName: collection.name,
        requestName: request.name,
      }),
    );
    const entries = await journal.list(EXTERNAL_SERVICES_TEST_PROFILE_KEY, 10);

    expect(entries[0]?.requestBody).toBe("");
    expect(entries[0]?.requestBodyTruncated).toBe(false);
  });

  it("keeps non-2xx bodies and separates journal persistence failures", async () => {
    const http = new MockOutboundHttpAdapter();
    http.enqueueResult({
      kind: "response",
      status: 500,
      durationMs: 9,
      body: "server-error",
    });
    const logger = createTestLogger({ featureId: "F-031", boundedContext: "Integration" });
    const useCase = new ExecuteExternalServiceRequestUseCase({
      outboundHttp: http,
      journalRepository: new FailingJournalRepository(),
      clock: new MockClock(new Date("2026-07-29T12:00:00.000Z")),
      uuidGenerator: new DeterministicUuidGenerator(),
      logger,
    });

    const result = await useCase.execute(createJob());

    expect(result).toMatchObject({
      kind: "error",
      category: "http",
      status: 500,
      body: "server-error",
    });
    expect(
      logger.entries.some(
        (entry) => entry.message === "external_services_journal_append_failed",
      ),
    ).toBe(true);
  });

  it("maps timeout and network transport outcomes", async () => {
    const http = new MockOutboundHttpAdapter();
    http.enqueueResult({
      kind: "network_error",
      code: "timeout",
      durationMs: 10_000,
      message: "Timed out.",
    });
    const useCase = new ExecuteExternalServiceRequestUseCase({
      outboundHttp: http,
      journalRepository: new InMemoryExternalServicesJournalRepository(),
      clock: new MockClock(new Date("2026-07-29T12:00:00.000Z")),
      uuidGenerator: new DeterministicUuidGenerator(),
      logger: createTestLogger({ featureId: "F-031", boundedContext: "Integration" }),
    });

    await expect(useCase.execute(createJob())).resolves.toMatchObject({
      kind: "error",
      category: "timeout",
      code: "timeout",
      status: null,
    });
  });
});
