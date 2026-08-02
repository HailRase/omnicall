/**
 * - Purpose: retain External Application jobs until configured delay expires.
 * - Inputs: immutable jobs, delay seconds, runtime validator, and enqueue callback.
 * - Outputs: waiting-job projection and cancellation without window side effects.
 */

import type { Clock, Logger } from "@ports/index.js";
import type { ExternalApplicationDispatchJob } from "./ExternalApplicationDispatchJob.js";
import type { ExternalApplicationsRuntimeRegistry } from "./ExternalApplicationsRuntimeRegistry.js";

export type ExternalApplicationsWaitingJob = Readonly<{
  job: ExternalApplicationDispatchJob;
  fireAt: string;
  delaySeconds: number;
}>;

type WaitingEntry = Readonly<{
  waiting: ExternalApplicationsWaitingJob;
  timer: ReturnType<typeof setTimeout>;
}>;

export class ExternalApplicationsDelayScheduler {
  private readonly waiting = new Map<string, WaitingEntry>();

  constructor(
    private readonly deps: Readonly<{
      clock: Clock;
      registry: ExternalApplicationsRuntimeRegistry;
      enqueue: (job: ExternalApplicationDispatchJob) => void;
      logger: Logger;
    }>,
  ) {}

  schedule(job: ExternalApplicationDispatchJob, delaySeconds: number): void {
    if (delaySeconds === 0) {
      this.deps.enqueue(job);
      return;
    }
    const fireAt = new Date(
      this.deps.clock.now().getTime() + delaySeconds * 1000,
    ).toISOString();
    const waiting = Object.freeze({ job, fireAt, delaySeconds });
    const timer = setTimeout(() => this.fire(job.jobId), delaySeconds * 1000);
    this.waiting.set(job.jobId, Object.freeze({ waiting, timer }));
  }

  getWaiting(): ReadonlyArray<ExternalApplicationsWaitingJob> {
    return Object.freeze([...this.waiting.values()].map((entry) => entry.waiting));
  }

  cancel(jobId: string): boolean {
    const entry = this.waiting.get(jobId);
    if (entry === undefined) {
      return false;
    }
    clearTimeout(entry.timer);
    this.waiting.delete(jobId);
    return true;
  }

  cancelWhere(predicate: (job: ExternalApplicationDispatchJob) => boolean): void {
    for (const [jobId, entry] of this.waiting) {
      if (predicate(entry.waiting.job)) {
        this.cancel(jobId);
      }
    }
  }

  dispose(): void {
    this.cancelWhere(() => true);
  }

  private fire(jobId: string): void {
    const entry = this.waiting.get(jobId);
    if (entry === undefined) {
      return;
    }
    this.waiting.delete(jobId);
    const validity = this.deps.registry.validateJobStart(entry.waiting.job);
    if (!validity.ok) {
      this.deps.logger.debug("external_applications_delayed_job_dropped", {
        featureId: "F-032",
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
