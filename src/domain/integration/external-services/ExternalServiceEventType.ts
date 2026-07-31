/**
 * - Purpose: define supported automation event codes.
 * - Inputs: persisted trigger values.
 * - Outputs: automatic and manual event type unions.
 */

export const EXTERNAL_SERVICE_AUTOMATIC_EVENT_TYPES = [
  "incoming_ringing",
  "outgoing_connecting",
  "call_answered",
  "call_ended",
  "call_rejected",
  "call_missed",
  "campaign_offered",
  "campaign_accepted",
  "campaign_rejected",
  "acd_context_appeared",
] as const;

export type ExternalServiceAutomaticEventType =
  (typeof EXTERNAL_SERVICE_AUTOMATIC_EVENT_TYPES)[number];

export type ExternalServiceEventType =
  | ExternalServiceAutomaticEventType
  | "manual_run";

export function isExternalServiceAutomaticEventType(
  value: unknown,
): value is ExternalServiceAutomaticEventType {
  return (
    typeof value === "string" &&
    (EXTERNAL_SERVICE_AUTOMATIC_EVENT_TYPES as readonly string[]).includes(value)
  );
}
