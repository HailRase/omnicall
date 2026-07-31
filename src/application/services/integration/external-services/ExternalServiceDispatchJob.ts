/**
 * - Purpose: define immutable queued External Services dispatch work.
 * - Inputs: captured definition snapshot, trigger facts, and lifecycle stamps.
 * - Outputs: FIFO job records for concurrency-bounded execution.
 */

import type {
  ExternalServiceCollection,
  ExternalServiceCollectionId,
  ExternalServiceRequest,
  ExternalServiceRequestId,
  ExternalServiceTriggerContext,
  SettingsAccountKey,
} from "@domain/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { ExternalServiceExecutionResult } from "./ExternalServiceExecutionResult.js";

export type ExternalServiceDispatchMode = "automatic" | "manual";

export type ExternalServiceDispatchJob = Readonly<{
  jobId: string;
  correlationId: CorrelationId;
  profileKey: SettingsAccountKey;
  lifecycleGeneration: number;
  settingsRevision: number;
  collectionId: ExternalServiceCollectionId;
  requestId: ExternalServiceRequestId;
  collectionName: string;
  requestName: string;
  collection: ExternalServiceCollection;
  request: ExternalServiceRequest;
  trigger: ExternalServiceTriggerContext;
  mode: ExternalServiceDispatchMode;
  resolveManual: ((result: ExternalServiceExecutionResult) => void) | null;
}>;
