/**
 * - Purpose: resolve template URL and open External Application target.
 * - Inputs: validated dispatch job plus window/browser gateways.
 * - Outputs: open attempt with structured skip/failure logs.
 */

import {
  buildExternalServiceVariables,
  createCallId,
  resolveExternalServiceTemplate,
} from "@domain/index.js";
import type { ExternalUrlGateway } from "@ports/updates/ExternalUrlGateway.js";
import type { ExternalApplicationWindowGateway } from "@ports/integration/ExternalApplicationWindowGateway.js";
import type { Logger } from "@ports/index.js";
import { isAllowedHttpsUrl } from "@shared/validation/isAllowedHttpsUrl.js";
import type { ExternalApplicationDispatchJob } from "./ExternalApplicationDispatchJob.js";
import type { ExternalApplicationsRuntimeRegistry } from "./ExternalApplicationsRuntimeRegistry.js";

export async function executeExternalApplicationJob(
  job: ExternalApplicationDispatchJob,
  deps: Readonly<{
    registry: ExternalApplicationsRuntimeRegistry;
    windowGateway: ExternalApplicationWindowGateway;
    externalUrlGateway: ExternalUrlGateway;
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
      }
      return;
    }

    const result = await deps.windowGateway.openWindow({
      url: resolvedUrl,
      title: job.application.name,
      width: job.application.window.width,
      height: job.application.window.height,
      applicationId: job.application.id,
      callId,
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
    }
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
  }
}
