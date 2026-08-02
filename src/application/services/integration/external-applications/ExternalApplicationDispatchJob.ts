/**
 * - Purpose: immutable dispatch job for External Application open actions.
 * - Inputs: matched application, trigger context, and lifecycle stamps.
 * - Outputs: queueable job snapshot without side effects.
 */

import type {
  ExternalApplicationDefinition,
  ExternalServiceTriggerContext,
  SettingsAccountKey,
} from "@domain/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

export type ExternalApplicationDispatchJob = Readonly<{
  jobId: string;
  correlationId: CorrelationId;
  profileKey: SettingsAccountKey;
  lifecycleGeneration: number;
  settingsRevision: number;
  mode: "automatic" | "manual";
  applicationId: ExternalApplicationDefinition["id"];
  application: ExternalApplicationDefinition;
  trigger: ExternalServiceTriggerContext;
}>;
