/**
 * - Purpose: resolve template URL and open External Application target.
 * - Inputs: validated dispatch job plus window/browser/journal ports.
 * - Outputs: open attempt with journal entry and structured logs.
 */

import {
  buildExternalServiceVariables,
  createCallId,
  resolveExternalServiceTemplate,
  type ExternalApplicationJournalEntry,
  type ExternalApplicationJournalOutcome,
} from "@domain/index.js";
import type { ExternalUrlGateway } from "@ports/updates/ExternalUrlGateway.js";
import type { ExternalApplicationWindowGateway } from "@ports/integration/ExternalApplicationWindowGateway.js";
import type { ExternalApplicationsJournalRepository } from "@ports/integration/ExternalApplicationsJournalRepository.js";
import type { Clock, Logger, UuidGenerator } from "@ports/index.js";
import { isAllowedHttpsUrl } from "@shared/validation/isAllowedHttpsUrl.js";
import type { ExternalApplicationDispatchJob } from "./ExternalApplicationDispatchJob.js";
import type { ExternalApplicationsRuntimeRegistry } from "./ExternalApplicationsRuntimeRegistry.js";

const MAX_JOURNAL_URL_LENGTH = 512;

export async function executeExternalApplicationJob(
  job: ExternalApplicationDispatchJob,
  deps: Readonly<{
    registry: ExternalApplicationsRuntimeRegistry;
    windowGateway: ExternalApplicationWindowGateway;
    externalUrlGateway: ExternalUrlGateway;
    journalRepository: ExternalApplicationsJournalRepository | null;
    clock: Clock;
    uuidGenerator: UuidGenerator;
    logger: Logger;
  }>,
): Promise<void> {
  const validity = deps.registry.validateJobStart(job);
  if (!validity.ok) {
    deps.logger.debug("external_applications_job_skipped", {
      featureId: "F-032",
      boundedContext: "Integration",
      operation: "execute_open",
      result: "skipped",
      code: validity.reason,
      correlationId: job.correlationId,
    });
    await appendJournal(deps, job, {
      outcome: "skipped_lifecycle",
      skipReason: validity.reason,
      resolvedUrl: null,
      callId: job.trigger.callId ?? null,
    });
    return;
  }

  const variables = buildExternalServiceVariables(
    job.application.variables,
    job.trigger,
  );
  const resolvedUrl = resolveExternalServiceTemplate(
    job.application.urlTemplate,
    variables,
  ).trim();
  if (!isAllowedHttpsUrl(resolvedUrl)) {
    deps.logger.warn("external_applications_url_rejected", {
      featureId: "F-032",
      boundedContext: "Integration",
      operation: "execute_open",
      result: "invalid_url",
      correlationId: job.correlationId,
    });
    await appendJournal(deps, job, {
      outcome: "skipped_invalid_url",
      skipReason: "invalid_url",
      resolvedUrl: truncateUrl(resolvedUrl),
      callId: job.trigger.callId ?? null,
    });
    return;
  }

  const callId = createCallId(job.trigger.callId ?? `manual-${job.jobId}`);

  try {
    if (job.application.openMode === "external_browser") {
      const result = await deps.externalUrlGateway.openUrl(resolvedUrl);
      if (!result.ok) {
        deps.logger.warn("external_applications_browser_open_failed", {
          featureId: "F-032",
          boundedContext: "Integration",
          operation: "execute_open",
          result: "failed",
          correlationId: job.correlationId,
        });
        await appendJournal(deps, job, {
          outcome: "failed",
          skipReason: "browser_open_failed",
          resolvedUrl: truncateUrl(resolvedUrl),
          callId: String(callId),
        });
        return;
      }
      await appendJournal(deps, job, {
        outcome: "opened",
        skipReason: null,
        resolvedUrl: truncateUrl(resolvedUrl),
        callId: String(callId),
      });
      return;
    }

    const result = await deps.windowGateway.openWindow({
      url: resolvedUrl,
      title: job.application.name,
      width: job.application.window.width,
      height: job.application.window.height,
      x: job.application.window.x,
      y: job.application.window.y,
      applicationId: job.application.id,
      callId,
      raiseOnOpen: job.application.windowBehavior.raiseOnOpen,
      alwaysOnTopDuringCall: job.application.windowBehavior.alwaysOnTopDuringCall,
      onCallEnded: job.application.windowBehavior.onCallEnded,
    });
    if (!result.ok) {
      deps.logger.warn("external_applications_window_open_failed", {
        featureId: "F-032",
        boundedContext: "Integration",
        operation: "execute_open",
        result: "failed",
        code: result.reason,
        correlationId: job.correlationId,
      });
      await appendJournal(deps, job, {
        outcome: "failed",
        skipReason: result.reason,
        resolvedUrl: truncateUrl(resolvedUrl),
        callId: String(callId),
      });
      return;
    }
    const outcome: ExternalApplicationJournalOutcome = result.focusedExisting
      ? "focused_existing"
      : "opened";
    await appendJournal(deps, job, {
      outcome,
      skipReason: null,
      resolvedUrl: truncateUrl(resolvedUrl),
      callId: String(callId),
    });
  } catch (error: unknown) {
    deps.logger.error(
      "external_applications_execute_failed",
      {
        featureId: "F-032",
        boundedContext: "Integration",
        operation: "execute_open",
        result: "failed",
        correlationId: job.correlationId,
      },
      error,
    );
    await appendJournal(deps, job, {
      outcome: "failed",
      skipReason: "execute_failed",
      resolvedUrl: truncateUrl(resolvedUrl),
      callId: String(callId),
    });
  }
}

async function appendJournal(
  deps: Readonly<{
    journalRepository: ExternalApplicationsJournalRepository | null;
    clock: Clock;
    uuidGenerator: UuidGenerator;
    logger: Logger;
  }>,
  job: ExternalApplicationDispatchJob,
  facts: Readonly<{
    outcome: ExternalApplicationJournalOutcome;
    skipReason: string | null;
    resolvedUrl: string | null;
    callId: string | null;
  }>,
): Promise<void> {
  if (deps.journalRepository === null) {
    return;
  }
  const entry: ExternalApplicationJournalEntry = {
    id: deps.uuidGenerator.generate(),
    profileKey: job.profileKey,
    applicationId: job.application.id,
    applicationName: job.application.name,
    eventType: job.trigger.eventType,
    startedAt: deps.clock.now().toISOString(),
    outcome: facts.outcome,
    skipReason: facts.skipReason,
    resolvedUrl: facts.resolvedUrl,
    openMode: job.application.openMode,
    callId: facts.callId,
    correlationId: job.correlationId,
  };
  try {
    await deps.journalRepository.append(job.profileKey, entry);
  } catch (error: unknown) {
    deps.logger.warn("external_applications_journal_append_failed", {
      featureId: "F-032",
      boundedContext: "Integration",
      operation: "append_journal",
      result: "failed",
      correlationId: job.correlationId,
      code: error instanceof Error ? error.name : "unknown",
    });
  }
}

function truncateUrl(url: string): string {
  if (url.length <= MAX_JOURNAL_URL_LENGTH) {
    return url;
  }
  return `${url.slice(0, MAX_JOURNAL_URL_LENGTH)}…`;
}
