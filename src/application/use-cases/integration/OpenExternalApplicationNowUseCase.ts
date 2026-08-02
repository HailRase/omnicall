/**
 * - Purpose: manually open one External Application from Settings (preview / Run now).
 * - Inputs: application id and optional call context overrides.
 * - Outputs: enqueued open job result without blocking the UI thread.
 */

import type { ExternalApplicationId, SettingsAccountKey } from "@domain/index.js";
import type { Logger, UuidGenerator } from "@ports/index.js";
import { createPlatformError, type PlatformError } from "@shared/errors/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { err, ok, type Result } from "@shared/result/index.js";
import type { ExternalApplicationDispatchJob } from "../../services/integration/external-applications/ExternalApplicationDispatchJob.js";
import type { ExternalApplicationsRuntimeRegistry } from "../../services/integration/external-applications/ExternalApplicationsRuntimeRegistry.js";
import type { ExternalServiceTriggerContext } from "@domain/index.js";

export type OpenExternalApplicationNowInput = Readonly<{
  profileKey: SettingsAccountKey;
  applicationId: ExternalApplicationId;
  userLogin?: string;
  focusedCallContext?: Readonly<{
    callId: string;
    callerId?: string;
    calledId?: string;
    callDirection?: "inbound" | "outbound";
  }>;
}>;

export type OpenExternalApplicationNowUseCaseDeps = Readonly<{
  registry: ExternalApplicationsRuntimeRegistry;
  enqueue: (job: ExternalApplicationDispatchJob) => void;
  uuidGenerator: UuidGenerator;
  logger: Logger;
}>;

export class OpenExternalApplicationNowUseCase {
  constructor(private readonly deps: OpenExternalApplicationNowUseCaseDeps) {}

  execute(
    input: OpenExternalApplicationNowInput,
  ): Result<{ jobId: string }, PlatformError> {
    const runtime = this.deps.registry.getSnapshot();
    if (runtime.profileKey === null || runtime.profileKey !== input.profileKey) {
      return err(
        createPlatformError(
          "operation_failed",
          "External Applications open requires the active profile.",
          { reason: "profile_inactive" },
        ),
      );
    }
    const application = runtime.settings.applications.find(
      (item) => item.id === input.applicationId,
    );
    if (application === undefined) {
      return err(
        createPlatformError(
          "operation_failed",
          "External Application definition was not found.",
          { reason: "definition_missing" },
        ),
      );
    }

    const trigger: ExternalServiceTriggerContext = {
      eventType: "manual_run",
      occurredAt: new Date().toISOString(),
      profileKey: input.profileKey,
      ...(input.userLogin !== undefined ? { userLogin: input.userLogin } : {}),
      ...(input.focusedCallContext !== undefined
        ? {
            callId: input.focusedCallContext.callId,
            ...(input.focusedCallContext.callerId !== undefined
              ? { callerId: input.focusedCallContext.callerId }
              : {}),
            ...(input.focusedCallContext.calledId !== undefined
              ? { calledId: input.focusedCallContext.calledId }
              : {}),
            ...(input.focusedCallContext.callDirection !== undefined
              ? { callDirection: input.focusedCallContext.callDirection }
              : {}),
          }
        : {}),
    };
    const jobId = this.deps.uuidGenerator.generate();
    const job: ExternalApplicationDispatchJob = {
      jobId,
      correlationId: createCorrelationId(),
      profileKey: input.profileKey,
      lifecycleGeneration: runtime.lifecycleGeneration,
      settingsRevision: runtime.settingsRevision,
      mode: "manual",
      applicationId: application.id,
      application,
      trigger,
    };
    this.deps.enqueue(job);
    this.deps.logger.info("external_applications_manual_open_enqueued", {
      featureId: "F-032",
      boundedContext: "Integration",
      operation: "open_now",
      result: "enqueued",
      correlationId: job.correlationId,
    });
    return ok({ jobId });
  }
}
