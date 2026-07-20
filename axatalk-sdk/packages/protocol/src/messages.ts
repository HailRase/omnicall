import { z } from 'zod';

import { CommandMessageSchema } from './commands.js';
import { DiscoveryDocumentSchema } from './discovery.js';
import { EventMessageSchema } from './events.js';
import {
  AuthProofSchema,
  HandshakeMessageSchema,
  PairingMessageSchema
} from './handshake.js';
import { ReplyMessageSchema } from './replies.js';
import { SnapshotMessageSchema } from './snapshot.js';

/**
 * Any authenticated or pre-auth WebSocket protocol message for v1.
 * Discovery documents are HTTP-only and validated separately.
 * @public
 */
export const WireMessageSchema = z.union([
  HandshakeMessageSchema,
  PairingMessageSchema,
  AuthProofSchema,
  CommandMessageSchema,
  ReplyMessageSchema,
  EventMessageSchema,
  SnapshotMessageSchema
]);

/** @public */
export type WireMessage = z.infer<typeof WireMessageSchema>;

/** @public */
export const ProtocolDocumentSchema = z.union([
  DiscoveryDocumentSchema,
  WireMessageSchema
]);

/** @public */
export type ProtocolDocument = z.infer<typeof ProtocolDocumentSchema>;
