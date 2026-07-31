/**
 * - Purpose: verify delayed dispatch snapshot scheduling and lifecycle cancel.
 * - Inputs: fake timers, registry stamps, and immutable dispatch jobs.
 * - Outputs: immediate enqueue, delayed fire, and drop/cancel evidence.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { MockClock } from "@adapters/mock/MockClock.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import type { ExternalServiceDispatchJob } from "./ExternalServiceDispatchJob.js";
import { ExternalServicesDelayScheduler } from "./ExternalServicesDelayScheduler.js";
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

describe("ExternalServicesDelayScheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("enqueues immediately when delaySeconds is zero", () => {
    const registry = new ExternalServicesRuntimeRegistry();
    registry.activateProfile(
      EXTERNAL_SERVICES_TEST_PROFILE_KEY,
      createExternalServicesTestSettings(),
      1,
    );
    const enqueued: string[] = [];
    const scheduler = new ExternalServicesDelayScheduler({
      clock: new MockClock(new Date("2026-07-30T12:00:00.000Z")),
      registry,
      enqueue: (job) => {
        enqueued.push(job.jobId);
      },
      logger: createTestLogger({ featureId: "F-031", boundedContext: "Integration" }),
    });

    scheduler.schedule(createJob(registry, "job-now"), 0);

    expect(enqueued).toEqual(["job-now"]);
    expect(scheduler.getWaiting()).toHaveLength(0);
  });

  it("fires a delayed snapshot into the queue and supports cancel", async () => {
    const registry = new ExternalServicesRuntimeRegistry();
    registry.activateProfile(
      EXTERNAL_SERVICES_TEST_PROFILE_KEY,
      createExternalServicesTestSettings(),
      1,
    );
    const enqueued: string[] = [];
    const scheduler = new ExternalServicesDelayScheduler({
      clock: new MockClock(new Date("2026-07-30T12:00:00.000Z")),
      registry,
      enqueue: (job) => {
        enqueued.push(job.jobId);
      },
      logger: createTestLogger({ featureId: "F-031", boundedContext: "Integration" }),
    });
    const job = createJob(registry, "job-delay");

    scheduler.schedule(job, 5);
    expect(scheduler.getWaiting()).toHaveLength(1);
    expect(scheduler.getWaiting()[0]?.fireAt).toBe("2026-07-30T12:00:05.000Z");

    expect(scheduler.cancel("job-delay")).toBe(true);
    expect(scheduler.getWaiting()).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(5_000);
    expect(enqueued).toEqual([]);

    scheduler.schedule(createJob(registry, "job-fire"), 2);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(enqueued).toEqual(["job-fire"]);
    expect(scheduler.getWaiting()).toHaveLength(0);
  });

  it("drops delayed jobs that fail lifecycle validation at fire time", async () => {
    const registry = new ExternalServicesRuntimeRegistry();
    registry.activateProfile(
      EXTERNAL_SERVICES_TEST_PROFILE_KEY,
      createExternalServicesTestSettings(),
      1,
    );
    const enqueued: string[] = [];
    const scheduler = new ExternalServicesDelayScheduler({
      clock: new MockClock(new Date("2026-07-30T12:00:00.000Z")),
      registry,
      enqueue: (job) => {
        enqueued.push(job.jobId);
      },
      logger: createTestLogger({ featureId: "F-031", boundedContext: "Integration" }),
    });
    const job = createJob(registry, "job-stale");
    scheduler.schedule(job, 3);
    registry.invalidateLifecycle();

    await vi.advanceTimersByTimeAsync(3_000);

    expect(enqueued).toEqual([]);
    expect(scheduler.getWaiting()).toHaveLength(0);
  });
});
