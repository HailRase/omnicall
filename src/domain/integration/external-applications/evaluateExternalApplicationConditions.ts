/**
 * - Purpose: decide whether a matched application may open for a trigger.
 * - Inputs: app-level conditions and trusted trigger context.
 * - Outputs: allow or structured skip reason (fail-closed on missing facts).
 */

import type { ExternalServiceTriggerContext } from "../external-services/template/buildExternalServiceVariables.js";
import type { ExternalApplicationConditions } from "./ExternalApplicationsSettings.js";

export const EXTERNAL_APPLICATION_CONDITION_SKIP_REASONS = [
  "direction_mismatch",
  "missing_direction",
  "queue_mismatch",
  "missing_queue",
] as const;

export type ExternalApplicationConditionSkipReason =
  (typeof EXTERNAL_APPLICATION_CONDITION_SKIP_REASONS)[number];

export type ExternalApplicationConditionsResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; reason: ExternalApplicationConditionSkipReason }>;

export function evaluateExternalApplicationConditions(
  conditions: ExternalApplicationConditions,
  trigger: ExternalServiceTriggerContext,
): ExternalApplicationConditionsResult {
  if (conditions.callDirection !== "any") {
    if (trigger.callDirection === undefined) {
      return { ok: false, reason: "missing_direction" };
    }
    if (trigger.callDirection !== conditions.callDirection) {
      return { ok: false, reason: "direction_mismatch" };
    }
  }

  const expectedQueues = conditions.queueNames
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
  if (expectedQueues.length > 0) {
    const actualQueue = readQueueName(trigger);
    if (actualQueue === null) {
      return { ok: false, reason: "missing_queue" };
    }
    const actualLower = actualQueue.toLocaleLowerCase();
    const matched = expectedQueues.some(
      (name) => name.toLocaleLowerCase() === actualLower,
    );
    if (!matched) {
      return { ok: false, reason: "queue_mismatch" };
    }
  }

  return { ok: true };
}

function readQueueName(trigger: ExternalServiceTriggerContext): string | null {
  const fromAcd = trigger.acd?.["queue_name"]?.trim() ?? "";
  if (fromAcd.length > 0) {
    return fromAcd;
  }
  const fromCampaign = trigger.campaign?.["queue_name"]?.trim() ?? "";
  if (fromCampaign.length > 0) {
    return fromCampaign;
  }
  return null;
}
