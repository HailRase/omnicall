import { z } from 'zod';

import { POP_KEY_ALGORITHM } from './constants.js';
import { CapabilityIdListSchema, PairingProfileSchema } from './capabilities.js';
import {
  ApplicationIdentitySchema,
  Base64UrlSchema,
  IsoTimestampSchema,
  OpaqueIdSchema,
  ProtocolVersionSchema
} from './primitives.js';

/**
 * Authentication challenge issued in server hello (ADR-0016).
 * @public
 */
export const AuthChallengeSchema = z
  .object({
    challengeId: OpaqueIdSchema,
    nonce: Base64UrlSchema,
    expiresAt: IsoTimestampSchema
  })
  .readonly();

/** @public */
export type AuthChallenge = z.infer<typeof AuthChallengeSchema>;

/**
 * Client hello — no product snapshot or PII (PROTOCOL.md).
 * @public
 */
export const ClientHelloSchema = z
  .object({
    protocolVersion: ProtocolVersionSchema,
    kind: z.literal('handshake'),
    type: z.literal('sdk:client-hello'),
    protocolMin: ProtocolVersionSchema,
    protocolMax: ProtocolVersionSchema,
    sdkVersion: z.string().min(1).max(64),
    application: ApplicationIdentitySchema,
    clientId: OpaqueIdSchema.optional(),
    requestedCapabilities: CapabilityIdListSchema,
    clientNonce: Base64UrlSchema,
    occurredAt: IsoTimestampSchema
  })
  .readonly()
  .refine((msg) => msg.protocolMin <= msg.protocolMax, {
    error: 'protocolMin must be <= protocolMax'
  });

/** @public */
export type ClientHello = z.infer<typeof ClientHelloSchema>;

/**
 * Server hello — may include auth challenge; never includes snapshot/PII.
 * @public
 */
export const ServerHelloSchema = z
  .object({
    protocolVersion: ProtocolVersionSchema,
    kind: z.literal('handshake'),
    type: z.literal('sdk:server-hello'),
    selectedProtocolVersion: ProtocolVersionSchema,
    desktopVersion: z.string().min(1).max(64),
    serverInstanceId: OpaqueIdSchema,
    sessionEpoch: OpaqueIdSchema,
    serverNonce: Base64UrlSchema,
    pairingRequired: z.boolean(),
    authChallenge: AuthChallengeSchema.optional(),
    maxMessageBytes: z.number().int().positive().max(1_048_576),
    heartbeatSeconds: z.number().int().positive().max(3600),
    occurredAt: IsoTimestampSchema
  })
  .readonly();

/** @public */
export type ServerHello = z.infer<typeof ServerHelloSchema>;

/**
 * Client proof-of-possession response (ADR-0016). Schemas only — no crypto runtime.
 * @public
 */
export const AuthProofSchema = z
  .object({
    protocolVersion: ProtocolVersionSchema,
    kind: z.literal('auth'),
    type: z.literal('sdk:auth-proof'),
    challengeId: OpaqueIdSchema,
    clientId: OpaqueIdSchema,
    signature: Base64UrlSchema,
    occurredAt: IsoTimestampSchema
  })
  .readonly();

/** @public */
export type AuthProof = z.infer<typeof AuthProofSchema>;

/**
 * Canonical PoP bytestring template (ADR-0016). Callers supply concrete fields.
 * @public
 */
export function buildPopSigningPayload(parts: {
  readonly serverInstanceId: string;
  readonly sessionEpoch: string;
  readonly origin: string;
  readonly clientId: string;
  readonly challengeId: string;
  readonly nonce: string;
}): string {
  return [
    'v1',
    parts.serverInstanceId,
    parts.sessionEpoch,
    parts.origin,
    parts.clientId,
    parts.challengeId,
    parts.nonce
  ].join('|');
}

/** Pairing request (ADR-0016). @public */
export const PairingRequestSchema = z
  .object({
    protocolVersion: ProtocolVersionSchema,
    kind: z.literal('pairing'),
    type: z.literal('pairing:request'),
    clientId: OpaqueIdSchema,
    clientPublicKey: Base64UrlSchema,
    keyAlgorithm: z.literal(POP_KEY_ALGORITHM),
    application: ApplicationIdentitySchema,
    requestedProfile: PairingProfileSchema,
    requestedCapabilities: CapabilityIdListSchema,
    occurredAt: IsoTimestampSchema
  })
  .readonly();

/** @public */
export type PairingRequest = z.infer<typeof PairingRequestSchema>;

/** Pairing pending (ADR-0016). @public */
export const PairingPendingSchema = z
  .object({
    protocolVersion: ProtocolVersionSchema,
    kind: z.literal('pairing'),
    type: z.literal('pairing:pending'),
    pairingRequestId: OpaqueIdSchema,
    expiresAt: IsoTimestampSchema,
    occurredAt: IsoTimestampSchema
  })
  .readonly();

/** @public */
export type PairingPending = z.infer<typeof PairingPendingSchema>;

/** Pairing approved (ADR-0016). @public */
export const PairingApprovedSchema = z
  .object({
    protocolVersion: ProtocolVersionSchema,
    kind: z.literal('pairing'),
    type: z.literal('pairing:approved'),
    clientId: OpaqueIdSchema,
    profile: PairingProfileSchema,
    grantedCapabilities: CapabilityIdListSchema,
    occurredAt: IsoTimestampSchema
  })
  .readonly();

/** @public */
export type PairingApproved = z.infer<typeof PairingApprovedSchema>;

/** Pairing denied (ADR-0016). @public */
export const PairingDeniedSchema = z
  .object({
    protocolVersion: ProtocolVersionSchema,
    kind: z.literal('pairing'),
    type: z.literal('pairing:denied'),
    clientId: OpaqueIdSchema,
    occurredAt: IsoTimestampSchema
  })
  .readonly();

/** @public */
export type PairingDenied = z.infer<typeof PairingDeniedSchema>;

/** @public */
export const PairingMessageSchema = z.discriminatedUnion('type', [
  PairingRequestSchema,
  PairingPendingSchema,
  PairingApprovedSchema,
  PairingDeniedSchema
]);

/** @public */
export type PairingMessage = z.infer<typeof PairingMessageSchema>;

/** @public */
export const HandshakeMessageSchema = z.discriminatedUnion('type', [
  ClientHelloSchema,
  ServerHelloSchema
]);

/** @public */
export type HandshakeMessage = z.infer<typeof HandshakeMessageSchema>;
