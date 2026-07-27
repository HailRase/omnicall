import { z } from 'zod';

import { DISCOVERY_VERSION } from './constants.js';
import { OpaqueIdSchema, ProtocolVersionSchema } from './primitives.js';

/**
 * Loopback HTTP discovery document (`discoveryVersion: 1`, ADR-0015).
 * Never contains secrets, tokens, phone numbers, or capability grants.
 * @public
 */
export const DiscoveryDocumentSchema = z
  .object({
    discoveryVersion: z.literal(DISCOVERY_VERSION),
    protocolMin: ProtocolVersionSchema,
    protocolMax: ProtocolVersionSchema,
    desktopVersion: z.string().min(1).max(64),
    serverInstanceId: OpaqueIdSchema,
    wsUrl: z
      .string()
      .min(1)
      .max(256)
      .regex(/^wss?:\/\/.+/),
    maxMessageBytes: z.number().int().positive().max(1_048_576),
    heartbeatSeconds: z.number().int().positive().max(3600),
    pairingRequired: z.boolean()
  })
  .readonly()
  .refine((doc) => doc.protocolMin <= doc.protocolMax, {
    error: 'protocolMin must be <= protocolMax'
  });

/** @public */
export type DiscoveryDocument = z.infer<typeof DiscoveryDocumentSchema>;
