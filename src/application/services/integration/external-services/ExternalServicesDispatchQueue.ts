/**
 * - Purpose: schedule External Services jobs with FIFO concurrency three.
 * - Inputs: immutable jobs and an async executor for started work.
 * - Outputs: bounded in-flight execution with drop/dispose invalidation.
 */

import type { Logger } from "@ports/index.js";
import type { ExternalServiceDispatchJob } from "./ExternalServiceDispatchJob.js";
import type { ExternalServicesRuntimeRegistry } from "./ExternalServicesRuntimeRegistry.js";

export const EXTERNAL_SERVICES_MAX_CONCURRENCY = 3;

export type ExternalServiceJobExecutor = (
  job: ExternalServiceDispatchJob,
) => Promise<void>;

export type ExternalServicesDispatchQueueDeps = Readonly<{
  registry: ExternalServicesRuntimeRegistry;
  executeJob: ExternalServiceJobExecutor;
  logger: Logger;
}>;

export class ExternalServicesDispatchQueue {
  private readonly pending: ExternalServiceDispatchJob[] = [];
  private readonly inFlight = new Map<string, Promise<void>>();
  private disposed = false;
  private drainScheduled = false;

  constructor(private readonly deps: ExternalServicesDispatchQueueDeps) {}

  enqueue(job: ExternalServiceDispatchJob): void {
    if (this.disposed) {
      this.deps.logger.debug("external_services_job_rejected_disposed", {
        featureId: "F-031",
        boundedContext: "Integration",
        operation: "enqueue",
        correlationId: job.correlationId,
        jobId: job.jobId,
        collectionId: job.collectionId,
        requestId: job.requestId,
        eventType: job.trigger.eventType,
      });
      return;
    }
    this.pending.push(job);
    this.scheduleDrain();
  }

  getPendingCount(): number {
    return this.pending.length;
  }

  getInFlightCount(): number {
    return this.inFlight.size;
  }

  dropPendingWhere(
    predicate: (job: ExternalServiceDispatchJob) => boolean,
  ): number {
    let dropped = 0;
    for (let index = this.pending.length - 1; index >= 0; index -= 1) {
      const job = this.pending[index];
      if (job === undefined || !predicate(job)) {
        continue;
      }
      this.pending.splice(index, 1);
      dropped += 1;
      this.logDropped(job, "lifecycle_invalidated");
    }
    return dropped;
  }

  dispose(): void {
    this.disposed = true;
    while (this.pending.length > 0) {
      const job = this.pending.shift();
      if (job !== undefined) {
        this.logDropped(job, "disposed");
      }
    }
  }

  private scheduleDrain(): void {
    if (this.drainScheduled || this.disposed) {
      return;
    }
    this.drainScheduled = true;
    queueMicrotask(() => {
      this.drainScheduled = false;
      this.drain();
    });
  }

  private drain(): void {
    if (this.disposed) {
      return;
    }
    while (
      this.inFlight.size < EXTERNAL_SERVICES_MAX_CONCURRENCY &&
      this.pending.length > 0
    ) {
      const job = this.pending.shift();
      if (job === undefined) {
        return;
      }
      const validity = this.deps.registry.validateJobStart(job);
      if (!validity.ok) {
        this.logDropped(job, validity.reason);
        continue;
      }
      this.startJob(job);
    }
  }

  private startJob(job: ExternalServiceDispatchJob): void {
    this.deps.logger.info("external_services_job_started", {
      featureId: "F-031",
      boundedContext: "Integration",
      operation: "dispatch_start",
      correlationId: job.correlationId,
      jobId: job.jobId,
      collectionId: job.collectionId,
      requestId: job.requestId,
      eventType: job.trigger.eventType,
      profileKeyHash: hashProfileKey(job.profileKey),
    });
    const execution = this.deps
      .executeJob(job)
      .catch((error: unknown) => {
        this.deps.logger.error(
          "external_services_job_executor_failed",
          {
            featureId: "F-031",
            boundedContext: "Integration",
            operation: "dispatch_execute",
            correlationId: job.correlationId,
            jobId: job.jobId,
            collectionId: job.collectionId,
            requestId: job.requestId,
            eventType: job.trigger.eventType,
            result: "failed",
          },
          error,
        );
      })
      .finally(() => {
        this.inFlight.delete(job.jobId);
        this.scheduleDrain();
      });
    this.inFlight.set(job.jobId, execution);
  }

  private logDropped(job: ExternalServiceDispatchJob, reason: string): void {
    this.deps.logger.debug("external_services_job_dropped", {
      featureId: "F-031",
      boundedContext: "Integration",
      operation: "dispatch_drop",
      correlationId: job.correlationId,
      jobId: job.jobId,
      collectionId: job.collectionId,
      requestId: job.requestId,
      eventType: job.trigger.eventType,
      result: reason,
      profileKeyHash: hashProfileKey(job.profileKey),
    });
    if (job.resolveManual !== null) {
      job.resolveManual({
        kind: "error",
        category: "validation",
        status: null,
        durationMs: 0,
        body: "",
        bodyTruncated: false,
        code: reason,
        jsonValidity: "not_applicable",
      });
    }
  }
}

function hashProfileKey(profileKey: string): string {
  let hash = 0;
  for (let index = 0; index < profileKey.length; index += 1) {
    hash = (hash * 31 + profileKey.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
