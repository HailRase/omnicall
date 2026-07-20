import { z } from 'zod';

import { ProtocolErrorObjectSchema } from './errors.js';
import { CommandTypeSchema } from './commands.js';
import {
  IsoTimestampSchema,
  OpaqueIdSchema,
  ProtocolVersionSchema,
  RevisionSchema,
  WireJsonObjectSchema
} from './primitives.js';

const replyEnvelopeBase = {
  protocolVersion: ProtocolVersionSchema,
  kind: z.literal('reply'),
  requestId: OpaqueIdSchema,
  commandType: CommandTypeSchema,
  serverInstanceId: OpaqueIdSchema,
  sessionEpoch: OpaqueIdSchema,
  occurredAt: IsoTimestampSchema
} as const;

/**
 * Successful command reply. Result is JSON-safe (no `unknown`); known PII
 * field names inside `result` must follow ADR-0017 masks.
 * @public
 */
export const CommandSuccessReplySchema = z
  .object({
    ...replyEnvelopeBase,
    ok: z.literal(true),
    revision: RevisionSchema,
    result: WireJsonObjectSchema
  })
  .readonly();

/** @public */
export type CommandSuccessReply = z.infer<typeof CommandSuccessReplySchema>;

/**
 * Failed command reply with stable machine-readable error.
 * @public
 */
export const CommandFailureReplySchema = z
  .object({
    ...replyEnvelopeBase,
    ok: z.literal(false),
    error: ProtocolErrorObjectSchema
  })
  .readonly();

/** @public */
export type CommandFailureReply = z.infer<typeof CommandFailureReplySchema>;

/** @public */
export const ReplyMessageSchema = z.discriminatedUnion('ok', [
  CommandSuccessReplySchema,
  CommandFailureReplySchema
]);

/** @public */
export type ReplyMessage = z.infer<typeof ReplyMessageSchema>;
