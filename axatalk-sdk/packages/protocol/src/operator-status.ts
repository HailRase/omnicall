import { z } from 'zod';

/**
 * Coarse public operator status projected to hosts (snapshot + events).
 * Not an OCP wire enum dump.
 * @public
 */
export const PublicOperatorStatusSchema = z.enum([
  'ready',
  'break',
  'offline',
  'post_call_processing',
  'unknown'
]);

/** @public */
export type PublicOperatorStatus = z.infer<typeof PublicOperatorStatusSchema>;
