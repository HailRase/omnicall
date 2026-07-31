/**
 * - Purpose: execute one External Services job through transport and journal.
 * - Inputs: immutable dispatch job with captured definition and trigger facts.
 * - Outputs: classified execution result; journal failures stay separate.
 */

import {
  buildExternalServiceHttpRequest,
  buildExternalServiceVariables,
  redactExternalServiceHeaders,
  truncateExternalServiceBody,
  type ExternalServiceJournalEntry,
  type ExternalServiceJournalOutcome,
} from "@domain/index.js";
import type { Clock, Logger, OutboundHttpPort, UuidGenerator } from "@ports/index.js";
import {
  OUTBOUND_HTTP_TIMEOUT_MS,
  type OutboundHttpResult,
} from "@ports/integration/OutboundHttpPort.js";
import type { ExternalServicesJournalRepository } from "@ports/integration/ExternalServicesJournalRepository.js";
import type { ExternalServiceDispatchJob } from "../../services/integration/external-services/ExternalServiceDispatchJob.js";
import type {
  ExternalServiceExecutionResult,
  ExternalServiceJsonValidity,
} from "../../services/integration/external-services/ExternalServiceExecutionResult.js";

export type ExecuteExternalServiceRequestUseCaseDeps = Readonly<{
  outboundHttp: OutboundHttpPort;
  journalRepository: ExternalServicesJournalRepository;
  clock: Clock;
  uuidGenerator: UuidGenerator;
  logger: Logger;
}>;

export class ExecuteExternalServiceRequestUseCase {
  constructor(private readonly deps: ExecuteExternalServiceRequestUseCaseDeps) {}

  async execute(job: ExternalServiceDispatchJob): Promise<ExternalServiceExecutionResult> {
    const startedAt = this.deps.clock.now();
    const built = buildExternalServiceHttpRequest(
      job.request,
      buildExternalServiceVariables(job.collection.variables, job.trigger),
      job.correlationId,
    );
    if (built.kind === "validation_error") {
      return this.finishValidationError(job, startedAt, built.code);
    }

    const transport = await this.deps.outboundHttp.execute({
      method: built.request.method,
      url: built.request.url,
      headers: built.request.headers,
      body: built.request.body,
      timeoutMs: OUTBOUND_HTTP_TIMEOUT_MS,
      correlationId: job.correlationId,
    });
    const result = classifyTransportResult(
      transport,
      toJsonValidity(built.jsonValidity),
    );
    await this.appendJournal(job, startedAt, built.request.url, built.request.headers, result);
    this.logCompletion(job, result);
    return result;
  }

  private async finishValidationError(
    job: ExternalServiceDispatchJob,
    startedAt: Date,
    code: string,
  ): Promise<ExternalServiceExecutionResult> {
    const result: ExternalServiceExecutionResult = {
      kind: "error",
      category: "validation",
      status: null,
      durationMs: Math.max(0, this.deps.clock.now().getTime() - startedAt.getTime()),
      body: "",
      bodyTruncated: false,
      code,
      jsonValidity: "not_applicable",
    };
    await this.appendJournal(job, startedAt, job.request.url, [], result);
    this.logCompletion(job, result);
    return result;
  }

  private async appendJournal(
    job: ExternalServiceDispatchJob,
    startedAt: Date,
    requestUrl: string,
    requestHeaders: ExternalServiceJournalEntry["requestHeaders"],
    result: ExternalServiceExecutionResult,
  ): Promise<void> {
    const truncated = truncateExternalServiceBody(result.body);
    const entry = buildJournalEntry(
      job,
      startedAt,
      requestUrl,
      redactExternalServiceHeaders(requestHeaders),
      result,
      truncated,
      this.deps.uuidGenerator.generate(),
    );
    try {
      await this.deps.journalRepository.append(job.profileKey, entry);
    } catch (error: unknown) {
      this.deps.logger.error(
        "external_services_journal_append_failed",
        {
          featureId: "F-031",
          boundedContext: "Integration",
          operation: "journal_append",
          correlationId: job.correlationId,
          jobId: job.jobId,
          collectionId: job.collectionId,
          requestId: job.requestId,
          eventType: job.trigger.eventType,
          result: "failed",
        },
        error,
      );
    }
  }

  private logCompletion(
    job: ExternalServiceDispatchJob,
    result: ExternalServiceExecutionResult,
  ): void {
    this.deps.logger.info("external_services_job_completed", {
      featureId: "F-031",
      boundedContext: "Integration",
      operation: "dispatch_complete",
      correlationId: job.correlationId,
      jobId: job.jobId,
      collectionId: job.collectionId,
      requestId: job.requestId,
      eventType: job.trigger.eventType,
      durationMs: result.durationMs,
      result: result.kind,
      ...(result.kind === "error"
        ? { category: result.category, code: result.code }
        : { status: result.status }),
    });
  }
}

function classifyTransportResult(
  transport: OutboundHttpResult,
  jsonValidity: ExternalServiceJsonValidity,
): ExternalServiceExecutionResult {
  if (transport.kind === "network_error") {
    return {
      kind: "error",
      category: mapNetworkCategory(transport.code),
      status: null,
      durationMs: transport.durationMs,
      body: "",
      bodyTruncated: false,
      code: transport.code,
      jsonValidity,
    };
  }
  const truncated = truncateExternalServiceBody(transport.body);
  if (transport.status >= 200 && transport.status <= 299) {
    return {
      kind: "success",
      status: transport.status,
      durationMs: transport.durationMs,
      body: truncated.body,
      bodyTruncated: truncated.truncated,
      jsonValidity,
    };
  }
  return {
    kind: "error",
    category: "http",
    status: transport.status,
    durationMs: transport.durationMs,
    body: truncated.body,
    bodyTruncated: truncated.truncated,
    code: `http_${transport.status}`,
    jsonValidity,
  };
}

function mapNetworkCategory(
  code: string,
): "network" | "timeout" | "aborted" {
  if (code === "timeout") {
    return "timeout";
  }
  if (code === "aborted") {
    return "aborted";
  }
  return "network";
}

function toJsonValidity(
  value: "valid" | "invalid" | null,
): ExternalServiceJsonValidity {
  if (value === null) {
    return "not_applicable";
  }
  return value;
}

function buildJournalEntry(
  job: ExternalServiceDispatchJob,
  startedAt: Date,
  requestUrl: string,
  requestHeaders: ExternalServiceJournalEntry["requestHeaders"],
  result: ExternalServiceExecutionResult,
  truncated: Readonly<{ body: string; truncated: boolean }>,
  id: string,
): ExternalServiceJournalEntry {
  return {
    id,
    profileKey: job.profileKey,
    collectionId: job.collectionId,
    collectionName: job.collectionName,
    requestId: job.requestId,
    requestName: job.requestName,
    method: job.request.method,
    eventType: job.trigger.eventType,
    startedAt: startedAt.toISOString(),
    durationMs: result.durationMs,
    outcome: toJournalOutcome(result),
    status: result.kind === "success" ? result.status : result.status,
    requestUrl,
    requestHeaders,
    responseBody: truncated.body,
    responseBodyTruncated: truncated.truncated,
    errorCode: result.kind === "error" ? result.code : null,
    errorMessage: result.kind === "error" ? result.code : null,
    correlationId: job.correlationId,
  };
}

function toJournalOutcome(
  result: ExternalServiceExecutionResult,
): ExternalServiceJournalOutcome {
  if (result.kind === "success") {
    return "http_success";
  }
  if (result.category === "http") {
    return "http_error";
  }
  if (result.category === "timeout") {
    return "timeout";
  }
  if (result.category === "aborted") {
    return "aborted";
  }
  return "network_error";
}
