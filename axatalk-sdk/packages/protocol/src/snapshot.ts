import { z } from 'zod';

import { PublicCallStateSchema } from './call-state.js';
import { CapabilityIdListSchema } from './capabilities.js';
import { OperatorCampaignOfferedPayloadSchema } from './events.js';
import {
  IsoTimestampSchema,
  OpaqueIdSchema,
  ProtocolVersionSchema,
  RedactedDisplayNameSchema,
  RedactedPhoneSchema,
  RevisionSchema
} from './primitives.js';

/**
 * Authenticated snapshot (PROTOCOL.md). Unauthorized sections are omitted.
 * @public
 */
export const SnapshotSessionSectionSchema = z
  .object({
    clientId: OpaqueIdSchema,
    grantedCapabilities: CapabilityIdListSchema,
    authenticated: z.literal(true)
  })
  .readonly();

/** @public */
export const SnapshotAccountSectionSchema = z
  .object({
    signedIn: z.boolean(),
    profileLabel: z.string().min(1).max(128).optional()
  })
  .readonly();

/** @public */
export const SnapshotRegistrationSectionSchema = z
  .object({
    state: z.enum(['registered', 'unregistering', 'unregistered', 'failed']),
    reasonCode: z.string().min(1).max(64).optional()
  })
  .readonly();

/** @public */
export const SnapshotCallSummarySchema = z
  .object({
    callId: OpaqueIdSchema,
    state: PublicCallStateSchema,
    direction: z.enum(['inbound', 'outbound']),
    remoteNumber: RedactedPhoneSchema.optional(),
    remoteDisplayName: RedactedDisplayNameSchema.optional(),
    muted: z.boolean().optional(),
    ownerClientId: OpaqueIdSchema.optional(),
    /**
     * ACD queue title from desktop OCP call context (F-028).
     * Additive / compatible. Omitted when direct/internal or unknown.
     */
    queueLabel: z.string().min(1).max(128).optional()
  })
  .readonly();

/** @public */
export type SnapshotCallSummary = z.infer<typeof SnapshotCallSummarySchema>;

/**
 * Post-call booking (Ready/Break after the current busy/PCP cycle).
 * Omitted when no reservation is active. Additive / compatible (ADR-0012).
 * @public
 */
export const SnapshotOperatorReservedTargetSchema = z.enum(['ready', 'break']);

/**
 * Active campaign offer for reconnect recovery (ADR-0019).
 * Same redacted shape as `operator:campaign-offered` payload.
 * @public
 */
export const SnapshotOperatorCampaignSchema = OperatorCampaignOfferedPayloadSchema;

/** @public */
export const SnapshotOperatorSectionSchema = z
  .object({
    connected: z.boolean(),
    status: z
      .enum(['ready', 'break', 'offline', 'post_call_processing', 'unknown'])
      .optional(),
    reasonId: z.number().int().nonnegative().optional(),
    reasonLabelKey: z.string().min(1).max(128).optional(),
    reservedTarget: SnapshotOperatorReservedTargetSchema.optional(),
    reservedReasonId: z.number().int().nonnegative().optional(),
    /** Present while an offer is active; omit when cleared / unauthorized. */
    campaign: SnapshotOperatorCampaignSchema.optional()
  })
  .readonly();

/** @public */
export const SnapshotWindowSectionSchema = z
  .object({
    visible: z.boolean()
  })
  .readonly();

/** @public */
export const SnapshotSectionsSchema = z
  .object({
    session: SnapshotSessionSectionSchema.optional(),
    account: SnapshotAccountSectionSchema.optional(),
    registration: SnapshotRegistrationSectionSchema.optional(),
    calls: z.array(SnapshotCallSummarySchema).max(32).optional(),
    operator: SnapshotOperatorSectionSchema.optional(),
    window: SnapshotWindowSectionSchema.optional()
  })
  .readonly();

/** @public */
export type SnapshotSections = z.infer<typeof SnapshotSectionsSchema>;

/** @public */
export const SnapshotMessageSchema = z
  .object({
    protocolVersion: ProtocolVersionSchema,
    kind: z.literal('snapshot'),
    type: z.literal('sdk:snapshot'),
    serverInstanceId: OpaqueIdSchema,
    sessionEpoch: OpaqueIdSchema,
    revision: RevisionSchema,
    occurredAt: IsoTimestampSchema,
    sections: SnapshotSectionsSchema
  })
  .readonly();

/** @public */
export type SnapshotMessage = z.infer<typeof SnapshotMessageSchema>;
