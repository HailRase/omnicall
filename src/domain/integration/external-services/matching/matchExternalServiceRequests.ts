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
          .filter(
            (request) =>
              request.enabled && request.triggers.includes(eventType),
          )
          .map((request) => ({ collection, request }))
      : [],
  );
}

function isFocusGated(eventType: string): boolean {
  return FOCUS_GATED_EVENT_TYPES.has(eventType);
}
