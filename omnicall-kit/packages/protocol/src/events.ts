import { z } from 'zod';

import { PublicCallStateSchema } from './call-state.js';
import { CapabilityIdListSchema } from './capabilities.js';
import { PublicOperatorStatusSchema } from './operator-status.js';
import {
  IsoTimestampSchema,
  OpaqueIdSchema,
  ProtocolVersionSchema,
  RedactedDisplayNameSchema,
  RedactedPhoneSchema,
  RevisionSchema
} from './primitives.js';

export { PublicCallStateSchema, type PublicCallState } from './call-state.js';
export {
  PublicOperatorStatusSchema,
  type PublicOperatorStatus
} from './operator-status.js';

/** @public */
export const EVENT_TYPES = [
  'call:incoming',
  'call:outgoing',
  'call:ringing',
  'call:answered',
  'call:ended',
  'call:failed',
  'call:held',
  'call:resumed',
  'call:muted',
  'call:unmuted',
  'call:acd-context',
  'registration:changed',
  'account:session-activated',
  'account:session-ended',
  'operator:session-changed',
  'operator:status-changed',
  'operator:campaign-offered',
  'operator:campaign-cleared',
  'window:visibility-changed',
  'sdk:permission-changed',
  'sdk:revoked',
  'sdk:server-shutdown'
] as const;

/** @public */
export const EventTypeSchema = z.enum(EVENT_TYPES);

/** @public */
export type EventType = z.infer<typeof EventTypeSchema>;

const eventEnvelopeBase = {
  protocolVersion: ProtocolVersionSchema,
  kind: z.literal('event'),
  eventId: OpaqueIdSchema,
  sequence: z.number().int().nonnegative(),
  serverInstanceId: OpaqueIdSchema,
  sessionEpoch: OpaqueIdSchema,
  occurredAt: IsoTimestampSchema,
  revision: RevisionSchema
} as const;

const CallEventPayloadSchema = z
  .object({
    callId: OpaqueIdSchema,
    state: PublicCallStateSchema,
    remoteNumber: RedactedPhoneSchema.optional(),
    remoteDisplayName: RedactedDisplayNameSchema.optional(),
    direction: z.enum(['inbound', 'outbound']).optional(),
    /**
     * ACD queue title from desktop OCP call context (F-028).
     * Additive / compatible. Never a raw OCP wire id (`acallid`).
     */
    queueLabel: z.string().min(1).max(128).optional()
  })
  .readonly();

function callEventSchema<T extends EventType>(type: T) {
  return z
    .object({
      ...eventEnvelopeBase,
      type: z.literal(type),
      payload: CallEventPayloadSchema
    })
    .readonly();
}

/** @public */
export const CallIncomingEventSchema = callEventSchema('call:incoming');
/** @public */
export const CallOutgoingEventSchema = callEventSchema('call:outgoing');
/** @public */
export const CallRingingEventSchema = callEventSchema('call:ringing');
/** @public */
export const CallAnsweredEventSchema = callEventSchema('call:answered');
/** @public */
export const CallEndedEventSchema = callEventSchema('call:ended');
/** @public */
export const CallFailedEventSchema = callEventSchema('call:failed');
/** @public */
export const CallHeldEventSchema = callEventSchema('call:held');
/** @public */
export const CallResumedEventSchema = callEventSchema('call:resumed');
/** @public */
export const CallMutedEventSchema = callEventSchema('call:muted');
/** @public */
export const CallUnmutedEventSchema = callEventSchema('call:unmuted');

/**
 * OCP MainCallIDInfo on the public SDK wire (ADR-0020 CRM exception).
 * Field names match live OCP snake_case (`acallid`, `main_acallid`, …).
 * Requires `ocp.acd_context.read` (+ `session.read.redacted`) at fan-out.
 * @public
 */
export const CallAcdContextPayloadSchema = z
  .object({
    /** Desktop SIP / session call id (correlation with other `call:*` events). */
    callId: OpaqueIdSchema,
    /** OCP main ACD call id when present on the wire. */
    main_acallid: z.string().min(1).max(256).optional(),
    /** OCP correlated call id (not the desktop SIP `callId`). */
    acallid: z.string().min(1).max(256),
    /** OCP lifecycle event name (e.g. `incomingCallProgress`). */
    event: z.string().min(1).max(128),
    caller_id: z.string().min(1).max(128),
    called_id: z.string().min(1).max(128),
    /** ACD queue title; empty string for direct/internal calls. */
    queue: z.string().max(128),
    user_login: z.string().min(1).max(128),
    /**
     * Additive helper: lifecycle phase of the sync.
     * `progress` ≈ ringing/connecting; `accepted` ≈ answered refresh.
     */
    phase: z.enum(['progress', 'accepted']).optional(),
    direction: z.enum(['inbound', 'outbound']).optional()
  })
  .readonly();

/** @public */
export type CallAcdContextPayload = z.infer<typeof CallAcdContextPayloadSchema>;

/** @public */
export const CallAcdContextEventSchema = z
  .object({
    ...eventEnvelopeBase,
    type: z.literal('call:acd-context'),
    payload: CallAcdContextPayloadSchema
  })
  .readonly();

/** @public */
export const RegistrationChangedEventSchema = z
  .object({
    ...eventEnvelopeBase,
    type: z.literal('registration:changed'),
    payload: z
      .object({
        state: z.enum(['registered', 'unregistering', 'unregistered', 'failed']),
        reasonCode: z.string().min(1).max(64).optional()
      })
      .readonly()
  })
  .readonly();

/** @public */
export const AccountSessionActivatedEventSchema = z
  .object({
    ...eventEnvelopeBase,
    type: z.literal('account:session-activated'),
    payload: z
      .object({
        profileLabel: z.string().min(1).max(128).optional()
      })
      .readonly()
  })
  .readonly();

/** @public */
export const AccountSessionEndedEventSchema = z
  .object({
    ...eventEnvelopeBase,
    type: z.literal('account:session-ended'),
    payload: z
      .object({
        reasonCode: z.string().min(1).max(64).optional()
      })
      .readonly()
  })
  .readonly();

/** @public */
export const OperatorSessionChangedEventSchema = z
  .object({
    ...eventEnvelopeBase,
    type: z.literal('operator:session-changed'),
    payload: z
      .object({
        connected: z.boolean(),
        status: PublicOperatorStatusSchema.optional()
      })
      .readonly()
  })
  .readonly();

/** @public */
export const OperatorStatusChangedEventSchema = z
  .object({
    ...eventEnvelopeBase,
    type: z.literal('operator:status-changed'),
    payload: z
      .object({
        status: PublicOperatorStatusSchema,
        reasonId: z.number().int().nonnegative().optional(),
        reasonLabelKey: z.string().min(1).max(128).optional(),
        /** Post-call booking target; omitted when cleared / idle. */
        reservedTarget: z.enum(['ready', 'break']).optional(),
        reservedReasonId: z.number().int().nonnegative().optional()
      })
      .readonly()
  })
  .readonly();

/**
 * Redacted campaign offer (ADR-0019). Titles are desktop-safe; phone masked.
 * @public
 */
export const OperatorCampaignOfferedPayloadSchema = z
  .object({
    campaignId: OpaqueIdSchema,
    mode: z.enum(['preview', 'progressive']),
    remoteNumber: RedactedPhoneSchema.optional(),
    companyLabel: z.string().min(1).max(128).optional(),
    strategyLabel: z.string().min(1).max(128).optional(),
    selectionLabel: z.string().min(1).max(128).optional(),
    queueLabel: z.string().min(1).max(128).optional()
  })
  .readonly();

/** @public */
export type OperatorCampaignOfferedPayload = z.infer<
  typeof OperatorCampaignOfferedPayloadSchema
>;

/** @public */
export const OperatorCampaignOfferedEventSchema = z
  .object({
    ...eventEnvelopeBase,
    type: z.literal('operator:campaign-offered'),
    payload: OperatorCampaignOfferedPayloadSchema
  })
  .readonly();

/** @public */
export const OperatorCampaignClearedPayloadSchema = z
  .object({
    campaignId: OpaqueIdSchema,
    reasonCode: z
      .enum([
        'accepted',
        'rejected',
        'call_ended',
        'session_reset',
        'superseded'
      ])
      .optional()
  })
  .readonly();

/** @public */
export type OperatorCampaignClearedPayload = z.infer<
  typeof OperatorCampaignClearedPayloadSchema
>;

/** @public */
export const OperatorCampaignClearedEventSchema = z
  .object({
    ...eventEnvelopeBase,
    type: z.literal('operator:campaign-cleared'),
    payload: OperatorCampaignClearedPayloadSchema
  })
  .readonly();

/** @public */
export const WindowVisibilityChangedEventSchema = z
  .object({
    ...eventEnvelopeBase,
    type: z.literal('window:visibility-changed'),
    payload: z
      .object({
        visible: z.boolean()
      })
      .readonly()
  })
  .readonly();

/** @public */
export const SdkPermissionChangedEventSchema = z
  .object({
    ...eventEnvelopeBase,
    type: z.literal('sdk:permission-changed'),
    payload: z
      .object({
        grantedCapabilities: CapabilityIdListSchema
      })
      .readonly()
  })
  .readonly();

/** @public */
export const SdkRevokedEventSchema = z
  .object({
    ...eventEnvelopeBase,
    type: z.literal('sdk:revoked'),
    payload: z
      .object({
        reasonCode: z.string().min(1).max(64)
      })
      .readonly()
  })
  .readonly();

/** @public */
export const SdkServerShutdownEventSchema = z
  .object({
    ...eventEnvelopeBase,
    type: z.literal('sdk:server-shutdown'),
    payload: z
      .object({
        reasonCode: z.string().min(1).max(64).optional()
      })
      .readonly()
  })
  .readonly();

/**
 * Protocol v1 public events.
 * Campaign events require `operator.campaign.read` (ADR-0019).
 * `call:acd-context` requires `ocp.acd_context.read` (ADR-0020).
 * @public
 */
export const EventMessageSchema = z.discriminatedUnion('type', [
  CallIncomingEventSchema,
  CallOutgoingEventSchema,
  CallRingingEventSchema,
  CallAnsweredEventSchema,
  CallEndedEventSchema,
  CallFailedEventSchema,
  CallHeldEventSchema,
  CallResumedEventSchema,
  CallMutedEventSchema,
  CallUnmutedEventSchema,
  CallAcdContextEventSchema,
  RegistrationChangedEventSchema,
  AccountSessionActivatedEventSchema,
  AccountSessionEndedEventSchema,
  OperatorSessionChangedEventSchema,
  OperatorStatusChangedEventSchema,
  OperatorCampaignOfferedEventSchema,
  OperatorCampaignClearedEventSchema,
  WindowVisibilityChangedEventSchema,
  SdkPermissionChangedEventSchema,
  SdkRevokedEventSchema,
  SdkServerShutdownEventSchema
]);

/** @public */
export type EventMessage = z.infer<typeof EventMessageSchema>;
