/**
 * - Purpose: enqueue External Services jobs from committed product events.
 * - Inputs: Domain event plus typed Application snapshot after store commit.
 * - Outputs: non-async enqueue side effects without awaiting transport.
 */

import { matchExternalServiceRequests } from "@domain/index.js";
import type { DomainEvent } from "@domain/shared/DomainEvent.js";
import type { Logger, UuidGenerator } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { ExternalServiceDispatchJob } from "./ExternalServiceDispatchJob.js";
import type { ExternalServicesDispatchQueue } from "./ExternalServicesDispatchQueue.js";
import type { ExternalServicesProductSnapshot } from "./ExternalServicesProductSnapshot.js";
import type { ExternalServicesRuntimeRegistry } from "./ExternalServicesRuntimeRegistry.js";
import { ExternalServicesCallContextTracker } from "./ExternalServicesCallContextTracker.js";
import { mapDomainEventToExternalServiceTrigger } from "./mapDomainEventToExternalServiceTrigger.js";

export type ExternalServicesAutomationServiceDeps = Readonly<{
  registry: ExternalServicesRuntimeRegistry;
  queue: ExternalServicesDispatchQueue;
  uuidGenerator: UuidGenerator;
  logger: Logger;
  tracker?: ExternalServicesCallContextTracker;
}>;

export class ExternalServicesAutomationService {
  private readonly tracker: ExternalServicesCallContextTracker;

  constructor(private readonly deps: ExternalServicesAutomationServiceDeps) {
    this.tracker = deps.tracker ?? new ExternalServicesCallContextTracker();
  }

  handleCommittedEvent(
    event: DomainEvent,
    snapshot: ExternalServicesProductSnapshot,
  ): void {
    try {
      const runtime = this.deps.registry.getSnapshot();
      if (runtime.profileKey === null || runtime.profileKey !== snapshot.profileKey) {
        return;
      }
      const mapped = mapDomainEventToExternalServiceTrigger(event, {
        profileKey: snapshot.profileKey,
        focusedCallId: snapshot.focusedCallId,
        tracker: this.tracker,
        ...(snapshot.userLogin !== undefined ? { userLogin: snapshot.userLogin } : {}),
      });
      if (mapped === null) {
        return;
      }
      const matches = matchExternalServiceRequests(
        runtime.settings,
        mapped.trigger,
        mapped.focusedAtEvent,
      );
      for (const match of matches) {
        this.deps.queue.enqueue(
          createAutomaticJob({
            match,
            trigger: mapped.trigger,
            profileKey: snapshot.profileKey,
            lifecycleGeneration: runtime.lifecycleGeneration,
            settingsRevision: runtime.settingsRevision,
            jobId: this.deps.uuidGenerator.generate(),
            correlationId: createCorrelationId(),
          }),
        );
      }
    } catch (error: unknown) {
      this.deps.logger.warn("external_services_event_handling_failed", {
        featureId: "F-031",
        boundedContext: "Integration",
        operation: "handle_committed_event",
        result: "failed",
        code: error instanceof Error ? error.name : "unknown",
      });
    }
  }
}

function createAutomaticJob(params: Readonly<{
  match: ReturnType<typeof matchExternalServiceRequests>[number];
  trigger: ReturnType<typeof mapDomainEventToExternalServiceTrigger> extends null
    ? never
    : NonNullable<ReturnType<typeof mapDomainEventToExternalServiceTrigger>>["trigger"];
  profileKey: ExternalServicesProductSnapshot["profileKey"];
  lifecycleGeneration: number;
  settingsRevision: number;
  jobId: string;
  correlationId: ReturnType<typeof createCorrelationId>;
}>): ExternalServiceDispatchJob {
  return {
    jobId: params.jobId,
    correlationId: params.correlationId,
    profileKey: params.profileKey,
    lifecycleGeneration: params.lifecycleGeneration,
    settingsRevision: params.settingsRevision,
    collectionId: params.match.collection.id,
    requestId: params.match.request.id,
    collectionName: params.match.collection.name,
    requestName: params.match.request.name,
    collection: params.match.collection,
    request: params.match.request,
    trigger: params.trigger,
    mode: "automatic",
    resolveManual: null,
  };
}
