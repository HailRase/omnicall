/**
 * - Purpose: shared automatic trigger event codes for External Services / Applications UI.
 * - Inputs: none.
 * - Outputs: UI event-type union aligned with Domain automatic codes.
 */

export type ExternalServicesAutomaticEventType =
  | "incoming_ringing"
  | "outgoing_connecting"
  | "call_answered"
  | "call_ended"
  | "call_rejected"
  | "call_missed"
  | "campaign_offered"
  | "campaign_accepted"
  | "campaign_rejected"
  | "acd_context_appeared"
  | "post_call_processing";
