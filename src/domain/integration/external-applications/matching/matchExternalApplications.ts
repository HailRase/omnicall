/**
 * - Purpose: select enabled External Applications eligible for a normalized trigger.
 * - Inputs: immutable settings, trigger context, and event-time focus result.
 * - Outputs: ordered application matches without side effects.
 */

import type { ExternalServiceAutomaticEventType } from "../../external-services/ExternalServiceEventType.js";
import type { ExternalServiceTriggerContext } from "../../external-services/template/buildExternalServiceVariables.js";
import type {
  ExternalApplicationDefinition,
  ExternalApplicationsSettings,
} from "../ExternalApplicationsSettings.js";

export type MatchedExternalApplication = Readonly<{
  application: ExternalApplicationDefinition;
  delaySeconds: number;
}>;

const FOCUS_GATED_EVENT_TYPES = new Set([
  "incoming_ringing",
  "outgoing_connecting",
  "call_answered",
  "call_ended",
  "call_rejected",
  "call_missed",
  "acd_context_appeared",
]);

export function matchExternalApplications(
  settings: ExternalApplicationsSettings,
  trigger: ExternalServiceTriggerContext,
  focusedAtEvent: boolean,
): ReadonlyArray<MatchedExternalApplication> {
  if (
    trigger.eventType === "manual_run" ||
    (isFocusGated(trigger.eventType) && !focusedAtEvent)
  ) {
    return [];
  }
  const eventType: ExternalServiceAutomaticEventType = trigger.eventType;

  return settings.applications.flatMap((application) => {
    if (!application.enabled) {
      return [];
    }
    const binding = application.triggers.find(
      (triggerBinding) => triggerBinding.eventType === eventType,
    );
    return binding === undefined
      ? []
      : [{ application, delaySeconds: binding.delaySeconds }];
  });
}

function isFocusGated(eventType: string): boolean {
  return FOCUS_GATED_EVENT_TYPES.has(eventType);
}
