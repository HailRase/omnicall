import { z } from 'zod';

import {
  AccountLoginSchema,
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
  'account:logout',
  'operator:get-reasons',
  'operator:change-status',
  'operator:finish-appeal'
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
 * Hide softphone window (privileged `window.hide`). Product rules: Origin matrix
 * grant, expectedRevision match, deny while telephony busy, tray recovery
 * (ADR-0013 amended 2026-07-27).
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
        login: AccountLoginSchema,
        expectedRevision: RevisionSchema,
        mode: z.enum(['sip_only', 'ocp']).optional()
      })
      .readonly()
  })
  .readonly();

/**
 * Single-shot account logout (CRM chooses reason via `operator:get-reasons`).
 * No prepare/confirm token handshake.
 * @public
 */
export const AccountLogoutCommandSchema = z
  .object({
    ...commandEnvelopeBase,
    type: z.literal('account:logout'),
    payload: z
      .object({
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

/**
 * Finish OCP post-call appeal (apply reserved Ready/Break or default Ready).
 * Allowed only while operator is in post-call processing; target comes from desktop.
 * @public
 */
export const OperatorFinishAppealCommandSchema = z
  .object({
    ...commandEnvelopeBase,
    type: z.literal('operator:finish-appeal'),
    payload: z
      .object({
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
  AccountLogoutCommandSchema,
  OperatorGetReasonsCommandSchema,
  OperatorChangeStatusCommandSchema,
  OperatorFinishAppealCommandSchema
]);

/** @public */
export type CommandMessage = z.infer<typeof CommandMessageSchema>;
