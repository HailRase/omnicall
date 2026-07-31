/**
 * - Purpose: enqueue External Application opens from committed product events.
 * - Inputs: Domain event plus typed Application snapshot after store commit.
 * - Outputs: non-async enqueue side effects without awaiting window opens.
 */

import {
  createCallId,
  evaluateExternalApplicationConditions,
  matchExternalApplications,
  type ExternalApplicationDefinition,
  type ExternalApplicationJournalEntry,
  type SettingsAccountKey,
} from "@domain/index.js";
import type { DomainEvent } from "@domain/shared/DomainEvent.js";
import type {
  Clock,
  Logger,
  UuidGenerator,
} from "@ports/index.js";
import type { ExternalApplicationsJournalRepository } from "@ports/integration/ExternalApplicationsJournalRepository.js";
import type { ExternalApplicationWindowGateway } from "@ports/integration/ExternalApplicationWindowGateway.js";
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
  windowGateway: ExternalApplicationWindowGateway;
  journalRepository: ExternalApplicationsJournalRepository | null;
  uuidGenerator: UuidGenerator;
  clock: Clock;
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

      // Close/minimize existing call windows before scheduling terminal-event opens.
      if (isTerminalCallEvent(event.type)) {
        const endedCallId = readCallId(event);
        if (endedCallId !== null) {
          void this.deps.windowGateway.applyCallEndedLifecycle({
            callId: createCallId(endedCallId),
          });
        }
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
        const conditions = evaluateExternalApplicationConditions(
          match.application.conditions,
          mapped.trigger,
        );
        if (!conditions.ok) {
          void this.appendConditionSkip(snapshot.profileKey, match.application, mapped.trigger, conditions.reason);
          continue;
        }
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

  private async appendConditionSkip(
    profileKey: SettingsAccountKey,
    application: ExternalApplicationDefinition,
    trigger: ExternalApplicationDispatchJob["trigger"],
    reason: string,
  ): Promise<void> {
    if (this.deps.journalRepository === null) {
      return;
    }
    const entry: ExternalApplicationJournalEntry = {
      id: this.deps.uuidGenerator.generate(),
      profileKey,
      applicationId: application.id,
      applicationName: application.name,
      eventType: trigger.eventType,
      startedAt: this.deps.clock.now().toISOString(),
      outcome: "skipped_condition",
      skipReason: reason,
      resolvedUrl: null,
      openMode: application.openMode,
      callId: trigger.callId ?? null,
      correlationId: createCorrelationId(),
    };
    try {
      await this.deps.journalRepository.append(profileKey, entry);
    } catch (error: unknown) {
      this.deps.logger.warn("external_applications_journal_append_failed", {
        featureId: "F-032",
        boundedContext: "Integration",
        operation: "append_journal",
        result: "failed",
        code: error instanceof Error ? error.name : "unknown",
      });
    }
  }
}

function readCallId(event: DomainEvent): string | null {
  const callId = event["callId"];
  return typeof callId === "string" && callId.length > 0 ? callId : null;
}

function isTerminalCallEvent(type: string): boolean {
  return (
    type === "CallEnded" ||
    type === "CallRejected" ||
    type === "CallRejectedByDnd" ||
    type === "IncomingCallEndedBeforeAnswer"
  );
}
