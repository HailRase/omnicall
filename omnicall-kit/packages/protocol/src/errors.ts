import { z } from 'zod';

import { WireJsonObjectSchema } from './primitives.js';

/**
 * Stable machine-readable protocol / client error codes (PROTOCOL.md).
 * Localized UI strings are never transported.
 * @public
 */
export const PROTOCOL_ERROR_CODES = [
  'invalid_message',
  'invalid_payload',
  'unsupported_command',
  'incompatible_version',
  'unauthenticated',
  'forbidden',
  'revoked',
  'not_ready',
  'not_found',
  'not_owner',
  'conflict',
  'stale_state',
  'interaction_required',
  'timeout',
  'rate_limited',
  'operation_failed',
  'local_network_permission_required',
  'local_network_permission_denied',
  'discovery_unreachable',
  'origin_blocked'
] as const;

/** @public */
export const ProtocolErrorCodeSchema = z.enum(PROTOCOL_ERROR_CODES);

/** @public */
export type ProtocolErrorCode = z.infer<typeof ProtocolErrorCodeSchema>;

/**
 * Wire error object carried by failed replies.
 * Client-only LNA/discovery codes may also be used by SDK mapping layers.
 * @public
 */
export const ProtocolErrorObjectSchema = z
  .object({
    code: ProtocolErrorCodeSchema,
    retryable: z.boolean(),
    currentRevision: z.number().int().nonnegative().optional(),
    details: WireJsonObjectSchema.optional()
  })
  .readonly();

/** @public */
export type ProtocolErrorObject = z.infer<typeof ProtocolErrorObjectSchema>;
