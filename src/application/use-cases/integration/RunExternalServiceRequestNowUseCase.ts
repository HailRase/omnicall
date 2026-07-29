/**
 * - Purpose: enqueue a manual External Services Run now through the shared queue.
 * - Inputs: collection/request IDs, expected revision, and optional focus context.
 * - Outputs: promise of classified UI result independent from telephony.
 */

import type {
  ExternalServiceCollectionId,
  ExternalServiceRequestId,
  ExternalServiceTriggerContext,
  ExternalServicesSettings,
  SettingsAccountKey,
} from "@domain/index.js";
import type { Logger, UuidGenerator } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { ExternalServiceDispatchJob } from "../../services/integration/external-services/ExternalServiceDispatchJob.js";
import type { ExternalServiceExecutionResult } from "../../services/integration/external-services/ExternalServiceExecutionResult.js";
import type { ExternalServicesDispatchQueue } from "../../services/integration/external-services/ExternalServicesDispatchQueue.js";
import type { ExternalServicesRuntimeRegistry } from "../../services/integration/external-services/ExternalServicesRuntimeRegistry.js";

export type RunExternalServiceRequestNowInput = Readonly<{
  collectionId: ExternalServiceCollectionId;
  requestId: ExternalServiceRequestId;
  expectedSettingsRevision: number;
  profileKey: SettingsAccountKey;
  occurredAt: string;
  userLogin?: string;
  focusedCallContext?: Readonly<{
    callId: string;
    callerId?: string;
    calledId?: string;
    callDirection?: "inbound" | "outbound";
  }>;
}>;

export type RunExternalServiceRequestNowUseCaseDeps = Readonly<{
  registry: ExternalServicesRuntimeRegistry;
  queue: ExternalServicesDispatchQueue;
  uuidGenerator: UuidGenerator;
  logger: Logger;
}>;

export class RunExternalServiceRequestNowUseCase {
  constructor(private readonly deps: RunExternalServiceRequestNowUseCaseDeps) {}

  execute(input: RunExternalServiceRequestNowInput): Promise<ExternalServiceExecutionResult> {
    const snapshot = this.deps.registry.getSnapshot();
    if (snapshot.profileKey === null || snapshot.profileKey !== input.profileKey) {
      return Promise.resolve(validationError("profile_inactive"));
    }
    if (input.expectedSettingsRevision !== snapshot.settingsRevision) {
      return Promise.resolve(validationError("stale_settings_revision"));
    }
    const definition = findDefinition(snapshot.settings, input.collectionId, input.requestId);
    if (definition === null) {
      return Promise.resolve(validationError("definition_missing"));
    }

    const correlationId = createCorrelationId();
    return new Promise<ExternalServiceExecutionResult>((resolve) => {
      const job = createManualJob({
        input,
        definition,
        snapshotGeneration: snapshot.lifecycleGeneration,
        snapshotRevision: snapshot.settingsRevision,
        correlationId,
        jobId: this.deps.uuidGenerator.generate(),
        resolve,
      });
      this.deps.logger.info("external_services_manual_run_enqueued", {
        featureId: "F-031",
        boundedContext: "Integration",
        operation: "manual_run_enqueue",
        correlationId,
        jobId: job.jobId,
        collectionId: job.collectionId,
        requestId: job.requestId,
        eventType: "manual_run",
      });
      this.deps.queue.enqueue(job);
    });
  }
}

function findDefinition(
  settings: ExternalServicesSettings,
  collectionId: ExternalServiceCollectionId,
  requestId: ExternalServiceRequestId,
): Readonly<{
  collection: ExternalServicesSettings["collections"][number];
  request: ExternalServicesSettings["collections"][number]["requests"][number];
}> | null {
  const collection = settings.collections.find((item) => item.id === collectionId);
  const request = collection?.requests.find((item) => item.id === requestId);
  if (collection === undefined || request === undefined) {
    return null;
  }
  return { collection, request };
}

function createManualJob(params: Readonly<{
  input: RunExternalServiceRequestNowInput;
  definition: NonNullable<ReturnType<typeof findDefinition>>;
  snapshotGeneration: number;
  snapshotRevision: number;
  correlationId: ReturnType<typeof createCorrelationId>;
  jobId: string;
  resolve: (result: ExternalServiceExecutionResult) => void;
}>): ExternalServiceDispatchJob {
  const trigger: ExternalServiceTriggerContext = {
    eventType: "manual_run",
    occurredAt: params.input.occurredAt,
    profileKey: params.input.profileKey,
    ...(params.input.userLogin !== undefined ? { userLogin: params.input.userLogin } : {}),
    ...(params.input.focusedCallContext !== undefined
      ? {
          callId: params.input.focusedCallContext.callId,
          ...(params.input.focusedCallContext.callerId !== undefined
            ? { callerId: params.input.focusedCallContext.callerId }
            : {}),
          ...(params.input.focusedCallContext.calledId !== undefined
            ? { calledId: params.input.focusedCallContext.calledId }
            : {}),
          ...(params.input.focusedCallContext.callDirection !== undefined
            ? { callDirection: params.input.focusedCallContext.callDirection }
            : {}),
        }
      : {}),
  };
  return {
    jobId: params.jobId,
    correlationId: params.correlationId,
    profileKey: params.input.profileKey,
    lifecycleGeneration: params.snapshotGeneration,
    settingsRevision: params.snapshotRevision,
    collectionId: params.definition.collection.id,
    requestId: params.definition.request.id,
    collectionName: params.definition.collection.name,
    requestName: params.definition.request.name,
    collection: params.definition.collection,
    request: params.definition.request,
    trigger,
    mode: "manual",
    resolveManual: params.resolve,
  };
}

function validationError(code: string): ExternalServiceExecutionResult {
  return {
    kind: "error",
    category: "validation",
    status: null,
    durationMs: 0,
    body: "",
    bodyTruncated: false,
    code,
    jsonValidity: "not_applicable",
  };
}
