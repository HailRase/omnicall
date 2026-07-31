/**
 * - Purpose: enqueue External Application opens from committed product events.
 * - Inputs: Domain event plus typed Application snapshot after store commit.
 * - Outputs: non-async enqueue side effects without awaiting window opens.
 */

import { matchExternalApplications } from "@domain/index.js";
import type { DomainEvent } from "@domain/shared/DomainEvent.js";
import type { Logger, UuidGenerator } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { ExternalServicesCallContextTracker } from "../external-services/ExternalServicesCallContextTracker.js";
import { mapDomainEventToExternalServiceTrigger } from "../external-services/mapDomainEventToExternalServiceTrigger.js";
import type { ExternalServicesProductSnapshot } from "../external-services/ExternalServicesProductSnapshot.js";
import type { ExternalApplicationDispatchJob } from "./ExternalApplicationDispatchJob.js";
import type { ExternalApplicationsDelayScheduler } from "./ExternalApplicationsDelayScheduler.js";
import type { ExternalApplicationsRuntimeRegistry } from "./ExternalApplicationsRuntimeRegistry.js";

export type ExternalApplicationsAutomationServiceDeps = Readonly<{
  registry: ExternalApplicationsRuntimeRegistry;
  scheduler: ExternalApplicationsDelayScheduler;
  uuidGenerator: UuidGenerator;
  logger: Logger;
  tracker?: ExternalServicesCallContextTracker;
}>;

export class ExternalApplicationsAutomationService {
  private readonly tracker: ExternalServicesCallContextTracker;

  constructor(private readonly deps: ExternalApplicationsAutomationServiceDeps) {
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
      const matches = matchExternalApplications(
        runtime.settings,
        mapped.trigger,
        mapped.focusedAtEvent,
      );
      for (const match of matches) {
        const job: ExternalApplicationDispatchJob = {
          jobId: this.deps.uuidGenerator.generate(),
          correlationId: createCorrelationId(),
          profileKey: snapshot.profileKey,
          lifecycleGeneration: runtime.lifecycleGeneration,
          settingsRevision: runtime.settingsRevision,
          mode: "automatic",
          applicationId: match.application.id,
          application: match.application,
          trigger: mapped.trigger,
        };
        this.deps.scheduler.schedule(job, match.delaySeconds);
      }
    } catch (error: unknown) {
      this.deps.logger.warn("external_applications_event_handling_failed", {
        featureId: "F-032",
        boundedContext: "Integration",
        operation: "handle_committed_event",
        result: "failed",
        code: error instanceof Error ? error.name : "unknown",
      });
    }
  }
}
