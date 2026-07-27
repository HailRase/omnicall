import { z } from 'zod';

/** Public call lifecycle states projected to hosts (not Domain enum dump). @public */
export const PublicCallStateSchema = z.enum([
  'ringing',
  'connecting',
  'active',
  'held',
  'ending',
  'ended',
  'failed'
]);

/** @public */
export type PublicCallState = z.infer<typeof PublicCallStateSchema>;
