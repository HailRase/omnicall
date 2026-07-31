import { describe, expect, it, vi } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import {
  EXTERNAL_SERVICES_MAX_CONCURRENCY,
  ExternalServicesDispatchQueue,
} from "./ExternalServicesDispatchQueue.js";
import type { ExternalServiceDispatchJob } from "./ExternalServiceDispatchJob.js";
import { ExternalServicesRuntimeRegistry } from "./ExternalServicesRuntimeRegistry.js";
import {
  createExternalServicesTestSettings,
  EXTERNAL_SERVICES_TEST_PROFILE_KEY,
} from "./externalServicesTestFixtures.js";

function createJob(
  registry: ExternalServicesRuntimeRegistry,
  id: string,
): ExternalServiceDispatchJob {
  const settings = createExternalServicesTestSettings();
  const snapshot = registry.getSnapshot();
  const collection = settings.collections[0]!;
  const request = collection.requests[0]!;
  return {
    jobId: id,
    correlationId: createCorrelationId(),
    profileKey: EXTERNAL_SERVICES_TEST_PROFILE_KEY,
    lifecycleGeneration: snapshot.lifecycleGeneration,
    settingsRevision: snapshot.settingsRevision,
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
  };
}

describe("ExternalServicesDispatchQueue", () => {
  it("starts at most three jobs and keeps FIFO order for the fourth", async () => {
    const registry = new ExternalServicesRuntimeRegistry();
    registry.activateProfile(
      EXTERNAL_SERVICES_TEST_PROFILE_KEY,
      createExternalServicesTestSettings(),
      1,
    );
    const started: string[] = [];
    const deferred = new Map<string, () => void>();
    const queue = new ExternalServicesDispatchQueue({
      registry,
      logger: createTestLogger({ featureId: "F-031", boundedContext: "Integration" }),
      executeJob: (job) =>
        new Promise<void>((resolve) => {
          started.push(job.jobId);
          deferred.set(job.jobId, resolve);
        }),
    });

    queue.enqueue(createJob(registry, "job-1"));
    queue.enqueue(createJob(registry, "job-2"));
    queue.enqueue(createJob(registry, "job-3"));
    queue.enqueue(createJob(registry, "job-4"));
    await Promise.resolve();
    await Promise.resolve();

    expect(EXTERNAL_SERVICES_MAX_CONCURRENCY).toBe(3);
    expect(started).toEqual(["job-1", "job-2", "job-3"]);
    expect(queue.getInFlightCount()).toBe(3);
    expect(queue.getPendingCount()).toBe(1);

    deferred.get("job-2")?.();
    await vi.waitFor(() => {
      expect(started).toEqual(["job-1", "job-2", "job-3", "job-4"]);
    });
    deferred.get("job-1")?.();
    deferred.get("job-3")?.();
    deferred.get("job-4")?.();
  });

  it("drops invalid pending jobs and catches rejected executors", async () => {
    const registry = new ExternalServicesRuntimeRegistry();
    registry.activateProfile(
      EXTERNAL_SERVICES_TEST_PROFILE_KEY,
      createExternalServicesTestSettings(),
      1,
    );
    const logger = createTestLogger({ featureId: "F-031", boundedContext: "Integration" });
    const queue = new ExternalServicesDispatchQueue({
      registry,
      logger,
      executeJob: () => Promise.reject(new Error("executor boom")),
    });

    const stale = createJob(registry, "stale");
    registry.replaceSettings(createExternalServicesTestSettings(), 2);
    queue.enqueue(stale);
    queue.enqueue(createJob(registry, "fresh"));
    await Promise.resolve();
    await Promise.resolve();
    await vi.waitFor(() => {
      expect(
        logger.entries.some((entry) => entry.message === "external_services_job_dropped"),
      ).toBe(true);
      expect(
        logger.entries.some(
          (entry) => entry.message === "external_services_job_executor_failed",
        ),
      ).toBe(true);
    });
  });
});
