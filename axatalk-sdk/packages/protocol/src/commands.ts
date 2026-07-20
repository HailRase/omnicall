import { z } from 'zod';

import {
  IsoTimestampSchema,
  OpaqueIdSchema,
  ProtocolVersionSchema,
  RevisionSchema
} from './primitives.js';

/** @public */
export const COMMAND_TYPES = [
  'sdk:get-snapshot',
  'sdk:ping',
  'window:show',
  'window:get-state',
  'window:hide',
  'call:originate',
  'call:answer',
  'call:reject',
  'call:hangup',
  'call:hold',
  'call:resume',
  'call:mute',
  'call:unmute',
  'call:send-dtmf',
  'account:activate-profile',
  'account:prepare-logout',
  'account:confirm-logout',
  'operator:get-reasons',
  'operator:change-status'
] as const;

/** @public */
export const CommandTypeSchema = z.enum(COMMAND_TYPES);

/** @public */
export type CommandType = z.infer<typeof CommandTypeSchema>;

const commandEnvelopeBase = {
  protocolVersion: ProtocolVersionSchema,
  kind: z.literal('command'),
  requestId: OpaqueIdSchema,
  serverInstanceId: OpaqueIdSchema,
  sessionEpoch: OpaqueIdSchema,
  occurredAt: IsoTimestampSchema
} as const;

const EmptyPayloadSchema = z.object({}).readonly();

const CallControlPayloadSchema = z
  .object({
    callId: OpaqueIdSchema,
    expectedRevision: RevisionSchema
  })
  .readonly();

/** @public */
export const SdkGetSnapshotCommandSchema = z
  .object({
    ...commandEnvelopeBase,
    type: z.literal('sdk:get-snapshot'),
    payload: EmptyPayloadSchema
  })
  .readonly();

/** @public */
export const SdkPingCommandSchema = z
  .object({
    ...commandEnvelopeBase,
    type: z.literal('sdk:ping'),
    payload: z
      .object({
        nonce: OpaqueIdSchema.optional()
      })
      .readonly()
  })
  .readonly();

/** @public */
export const WindowShowCommandSchema = z
  .object({
    ...commandEnvelopeBase,
    type: z.literal('window:show'),
    payload: EmptyPayloadSchema
  })
  .readonly();

/** @public */
export const WindowGetStateCommandSchema = z
  .object({
    ...commandEnvelopeBase,
    type: z.literal('window:get-state'),
    payload: EmptyPayloadSchema
  })
  .readonly();

/**
 * Schema exists for future tray/background policy. Unavailable in v1 product
 * surface (ADR-0013) — use `isCommandAvailableInProductV1` / policy helpers.
 * @public
 */
export const WindowHideCommandSchema = z
  .object({
    ...commandEnvelopeBase,
    type: z.literal('window:hide'),
    payload: z
      .object({
        expectedRevision: RevisionSchema
      })
      .readonly()
  })
  .readonly();

/** @public */
export const CallOriginateCommandSchema = z
  .object({
    ...commandEnvelopeBase,
    type: z.literal('call:originate'),
    payload: z
      .object({
        destination: z.string().min(1).max(64),
        expectedRevision: RevisionSchema
      })
      .readonly()
  })
  .readonly();

/** @public */
export const CallAnswerCommandSchema = z
  .object({
    ...commandEnvelopeBase,
    type: z.literal('call:answer'),
    payload: CallControlPayloadSchema
  })
  .readonly();

/** @public */
export const CallRejectCommandSchema = z
  .object({
    ...commandEnvelopeBase,
    type: z.literal('call:reject'),
    payload: CallControlPayloadSchema
  })
  .readonly();

/** @public */
export const CallHangupCommandSchema = z
  .object({
    ...commandEnvelopeBase,
    type: z.literal('call:hangup'),
    payload: CallControlPayloadSchema
  })
  .readonly();

/** @public */
export const CallHoldCommandSchema = z
  .object({
    ...commandEnvelopeBase,
    type: z.literal('call:hold'),
    payload: CallControlPayloadSchema
  })
  .readonly();

/** @public */
export const CallResumeCommandSchema = z
  .object({
    ...commandEnvelopeBase,
    type: z.literal('call:resume'),
    payload: CallControlPayloadSchema
  })
  .readonly();

/** @public */
export const CallMuteCommandSchema = z
  .object({
    ...commandEnvelopeBase,
    type: z.literal('call:mute'),
    payload: CallControlPayloadSchema
  })
  .readonly();

/** @public */
export const CallUnmuteCommandSchema = z
  .object({
    ...commandEnvelopeBase,
    type: z.literal('call:unmute'),
    payload: CallControlPayloadSchema
  })
  .readonly();

/** @public */
export const CallSendDtmfCommandSchema = z
  .object({
    ...commandEnvelopeBase,
    type: z.literal('call:send-dtmf'),
    payload: z
      .object({
        callId: OpaqueIdSchema,
        digits: z.string().min(1).max(32).regex(/^[0-9A-D*#]+$/),
        expectedRevision: RevisionSchema
      })
      .readonly()
  })
  .readonly();

/** @public */
export const AccountActivateProfileCommandSchema = z
  .object({
    ...commandEnvelopeBase,
    type: z.literal('account:activate-profile'),
    payload: z
      .object({
        profileRef: OpaqueIdSchema,
        expectedRevision: RevisionSchema
      })
      .readonly()
  })
  .readonly();

/** @public */
export const AccountPrepareLogoutCommandSchema = z
  .object({
    ...commandEnvelopeBase,
    type: z.literal('account:prepare-logout'),
    payload: z
      .object({
        expectedRevision: RevisionSchema
      })
      .readonly()
  })
  .readonly();

/** @public */
export const AccountConfirmLogoutCommandSchema = z
  .object({
    ...commandEnvelopeBase,
    type: z.literal('account:confirm-logout'),
    payload: z
      .object({
        logoutToken: OpaqueIdSchema,
        reasonId: z.number().int().nonnegative().optional(),
        expectedRevision: RevisionSchema
      })
      .readonly()
  })
  .readonly();

/** @public */
export const OperatorGetReasonsCommandSchema = z
  .object({
    ...commandEnvelopeBase,
    type: z.literal('operator:get-reasons'),
    payload: EmptyPayloadSchema
  })
  .readonly();

/** @public */
export const OperatorChangeStatusCommandSchema = z
  .object({
    ...commandEnvelopeBase,
    type: z.literal('operator:change-status'),
    payload: z
      .object({
        target: z.enum(['ready', 'break']),
        reasonId: z.number().int().nonnegative().optional(),
        expectedRevision: RevisionSchema
      })
      .readonly()
  })
  .readonly();

/** @public */
export const CommandMessageSchema = z.discriminatedUnion('type', [
  SdkGetSnapshotCommandSchema,
  SdkPingCommandSchema,
  WindowShowCommandSchema,
  WindowGetStateCommandSchema,
  WindowHideCommandSchema,
  CallOriginateCommandSchema,
  CallAnswerCommandSchema,
  CallRejectCommandSchema,
  CallHangupCommandSchema,
  CallHoldCommandSchema,
  CallResumeCommandSchema,
  CallMuteCommandSchema,
  CallUnmuteCommandSchema,
  CallSendDtmfCommandSchema,
  AccountActivateProfileCommandSchema,
  AccountPrepareLogoutCommandSchema,
  AccountConfirmLogoutCommandSchema,
  OperatorGetReasonsCommandSchema,
  OperatorChangeStatusCommandSchema
]);

/** @public */
export type CommandMessage = z.infer<typeof CommandMessageSchema>;
