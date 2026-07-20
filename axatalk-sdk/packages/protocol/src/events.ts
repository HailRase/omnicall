import { z } from 'zod';

import { PublicCallStateSchema } from './call-state.js';
import { CapabilityIdListSchema } from './capabilities.js';
import {
  IsoTimestampSchema,
  OpaqueIdSchema,
  ProtocolVersionSchema,
  RedactedDisplayNameSchema,
  RedactedPhoneSchema,
  RevisionSchema
} from './primitives.js';

export { PublicCallStateSchema, type PublicCallState } from './call-state.js';

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
  'registration:changed',
  'account:session-activated',
  'account:session-ended',
  'operator:session-changed',
  'operator:status-changed',
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
    direction: z.enum(['inbound', 'outbound']).optional()
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
        status: z.enum(['ready', 'break', 'offline', 'unknown']).optional()
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
        status: z.enum(['ready', 'break', 'offline', 'unknown']),
        reasonId: z.number().int().nonnegative().optional(),
        reasonLabelKey: z.string().min(1).max(128).optional()
      })
      .readonly()
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
 * Protocol v1 public events. Campaign events are intentionally absent (O-CAMP-1).
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
  RegistrationChangedEventSchema,
  AccountSessionActivatedEventSchema,
  AccountSessionEndedEventSchema,
  OperatorSessionChangedEventSchema,
  OperatorStatusChangedEventSchema,
  WindowVisibilityChangedEventSchema,
  SdkPermissionChangedEventSchema,
  SdkRevokedEventSchema,
  SdkServerShutdownEventSchema
]);

/** @public */
export type EventMessage = z.infer<typeof EventMessageSchema>;
