/**
 * - Purpose: retain automatic dispatch snapshots until their configured delay expires.
 * - Inputs: immutable jobs, delay seconds, runtime validator, and queue callback.
 * - Outputs: waiting-job projection and cancellation without HTTP side effects.
 */
import type { Clock, Logger } from "@ports/index.js";
import type { ExternalServiceDispatchJob } from "./ExternalServiceDispatchJob.js";
import type { ExternalServicesRuntimeRegistry } from "./ExternalServicesRuntimeRegistry.js";

export type ExternalServicesWaitingJob = Readonly<{
  job: ExternalServiceDispatchJob;
  fireAt: string;
  delaySeconds: number;
}>;

type WaitingEntry = Readonly<{
  waiting: ExternalServicesWaitingJob;
  timer: ReturnType<typeof setTimeout>;
}>;

export class ExternalServicesDelayScheduler {
  private readonly waiting = new Map<string, WaitingEntry>();

  constructor(
    private readonly deps: Readonly<{
      clock: Clock;
      registry: ExternalServicesRuntimeRegistry;
      enqueue: (job: ExternalServiceDispatchJob) => void;
      logger: Logger;
    }>,
  ) {}

  schedule(job: ExternalServiceDispatchJob, delaySeconds: number): void {
    if (delaySeconds === 0) {
      this.deps.enqueue(job);
      return;
    }
    const fireAt = new Date(this.deps.clock.now().getTime() + delaySeconds * 1000).toISOString();
    const waiting = Object.freeze({ job, fireAt, delaySeconds });
    const timer = setTimeout(() => this.fire(job.jobId), delaySeconds * 1000);
    this.waiting.set(job.jobId, Object.freeze({ waiting, timer }));
  }

  getWaiting(): ReadonlyArray<ExternalServicesWaitingJob> {
    return Object.freeze([...this.waiting.values()].map((entry) => entry.waiting));
  }

  cancel(jobId: string): boolean {
    const entry = this.waiting.get(jobId);
    if (entry === undefined) return false;
    clearTimeout(entry.timer);
    this.waiting.delete(jobId);
    return true;
  }

  cancelWhere(predicate: (job: ExternalServiceDispatchJob) => boolean): void {
    for (const [jobId, entry] of this.waiting) {
      if (predicate(entry.waiting.job)) this.cancel(jobId);
    }
  }

  dispose(): void {
    this.cancelWhere(() => true);
  }

  private fire(jobId: string): void {
    const entry = this.waiting.get(jobId);
    if (entry === undefined) return;
    this.waiting.delete(jobId);
    const validity = this.deps.registry.validateJobStart(entry.waiting.job);
    if (!validity.ok) {
      this.deps.logger.debug("external_services_delayed_job_dropped", {
        featureId: "F-031",
        boundedContext: "Integration",
        operation: "delay_fire",
        result: "dropped",
        code: validity.reason,
      });
      return;
    }
    this.deps.enqueue(entry.waiting.job);
  }
}
