import { z } from 'zod';

import { MAX_ARRAY_LENGTH, MAX_OBJECT_KEYS, PROTOCOL_MAJOR } from './constants.js';

/** Opaque public identifier (UUID-like or server-issued). @public */
export const OpaqueIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9._:-]+$/);

/** @public */
export type OpaqueId = z.infer<typeof OpaqueIdSchema>;

/** ISO-8601 timestamp string. @public */
export const IsoTimestampSchema = z.string().min(10).max(64);

/** @public */
export type IsoTimestamp = z.infer<typeof IsoTimestampSchema>;

/** Base64url without padding requirement (PoP / nonces). @public */
export const Base64UrlSchema = z
  .string()
  .min(1)
  .max(8192)
  .regex(/^[A-Za-z0-9_-]+$/);

/** @public */
export type Base64Url = z.infer<typeof Base64UrlSchema>;

/** Protocol major version number. @public */
export const ProtocolVersionSchema = z.number().int().positive();

/** @public */
export type ProtocolVersion = z.infer<typeof ProtocolVersionSchema>;

/** Application identity block used in hello / pairing. @public */
export const ApplicationIdentitySchema = z
  .object({
    name: z.string().min(1).max(128),
    version: z.string().min(1).max(64)
  })
  .readonly();

/** @public */
export type ApplicationIdentity = z.infer<typeof ApplicationIdentitySchema>;

/** Snapshot / aggregate revision counter. @public */
export const RevisionSchema = z.number().int().nonnegative();

/** @public */
export type Revision = z.infer<typeof RevisionSchema>;

/**
 * Redacted phone mask (ADR-0017): keep last 4 digits; other digits → `*`;
 * optional leading `+`.
 * @public
 */
export const RedactedPhoneSchema = z
  .string()
  .min(1)
  .max(32)
  .regex(/^\+?[0-9*]*\d{0,4}$/)
  .refine((value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 4) {
      return true;
    }
    return value.includes('*');
  }, { error: 'phone mask must redact leading digits' });

/** @public */
export type RedactedPhone = z.infer<typeof RedactedPhoneSchema>;

/**
 * Redacted display name (ADR-0017): first Unicode scalar + `***`, or `*` alone.
 * @public
 */
export const RedactedDisplayNameSchema = z
  .string()
  .min(1)
  .max(64)
  .refine((value) => {
    if (value === '*') {
      return true;
    }
    return value.endsWith('***') && [...value.slice(0, -3)].length === 1;
  }, { error: 'display name must follow redaction mask' });

/** @public */
export type RedactedDisplayName = z.infer<typeof RedactedDisplayNameSchema>;

/**
 * JSON-safe wire value for open maps such as reply `result` / error `details`.
 * No `unknown`; known PII field names must satisfy ADR-0017 masks.
 * @public
 */
export type WireJsonValue =
  | string
  | number
  | boolean
  | null
  | readonly WireJsonValue[]
  | { readonly [key: string]: WireJsonValue };

const REDACTED_PHONE_FIELD_KEYS = new Set([
  'remoteNumber',
  'phoneNumber',
  'phone'
]);

const REDACTED_DISPLAY_FIELD_KEYS = new Set([
  'remoteDisplayName',
  'displayName'
]);

function isRedactionSafeObject(
  obj: Readonly<Record<string, WireJsonValue>>
): boolean {
  if (Object.keys(obj).length > MAX_OBJECT_KEYS) {
    return false;
  }
  for (const [key, child] of Object.entries(obj)) {
    if (
      REDACTED_PHONE_FIELD_KEYS.has(key) &&
      typeof child === 'string' &&
      !RedactedPhoneSchema.safeParse(child).success
    ) {
      return false;
    }
    if (
      REDACTED_DISPLAY_FIELD_KEYS.has(key) &&
      typeof child === 'string' &&
      !RedactedDisplayNameSchema.safeParse(child).success
    ) {
      return false;
    }
  }
  return true;
}

const WireJsonObjectBaseSchema = z
  .record(z.string().max(128), z.lazy(() => WireJsonValueSchema))
  .refine((obj) => isRedactionSafeObject(obj), {
    error: 'PII fields must use ADR-0017 masks'
  });

/**
 * @public
 */
export const WireJsonValueSchema: z.ZodType<WireJsonValue> = z.lazy(() =>
  z.union([
    z.string().max(4096),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(WireJsonValueSchema).max(MAX_ARRAY_LENGTH),
    WireJsonObjectBaseSchema
  ])
);

/**
 * Readonly JSON-safe object map used by reply results and error details.
 * @public
 */
export const WireJsonObjectSchema = WireJsonObjectBaseSchema.readonly();

/** @public */
export type WireJsonObject = z.infer<typeof WireJsonObjectSchema>;

/** Helper: assert this package authors protocol major 1 schemas. @public */
export function isCurrentProtocolMajor(version: number): boolean {
  return version === PROTOCOL_MAJOR;
}
