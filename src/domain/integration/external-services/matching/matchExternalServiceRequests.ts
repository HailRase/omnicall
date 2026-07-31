/**
 * - Purpose: select enabled automatic requests eligible for a normalized trigger.
 * - Inputs: immutable settings, trigger context, and event-time focus result.
 * - Outputs: ordered collection/request matches without side effects.
 */
import type {
  ExternalServiceCollection,
  ExternalServiceRequest,
  ExternalServicesSettings,
} from "../index.js";
import type { ExternalServiceAutomaticEventType } from "../ExternalServiceEventType.js";
import type { ExternalServiceTriggerContext } from "../template/buildExternalServiceVariables.js";

export type MatchedExternalServiceRequest = Readonly<{
  collection: ExternalServiceCollection;
  request: ExternalServiceRequest;
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

export function matchExternalServiceRequests(
  settings: ExternalServicesSettings,
  trigger: ExternalServiceTriggerContext,
  focusedAtEvent: boolean,
): ReadonlyArray<MatchedExternalServiceRequest> {
  if (
    trigger.eventType === "manual_run" ||
    (isFocusGated(trigger.eventType) && !focusedAtEvent)
  ) {
    return [];
  }
  const eventType: ExternalServiceAutomaticEventType = trigger.eventType;

  return settings.collections.flatMap((collection) =>
    collection.enabled
      ? collection.requests
          .flatMap((request) => {
            const binding = request.triggers.find(
              (triggerBinding) => triggerBinding.eventType === eventType,
            );
            return request.enabled && binding !== undefined
              ? [{ collection, request, delaySeconds: binding.delaySeconds }]
              : [];
          })
      : [],
  );
}

function isFocusGated(eventType: string): boolean {
  return FOCUS_GATED_EVENT_TYPES.has(eventType);
}
