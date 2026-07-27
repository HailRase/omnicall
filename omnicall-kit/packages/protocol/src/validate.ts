import type { z } from 'zod';

import {
  DEFAULT_MAX_MESSAGE_BYTES,
  FORBIDDEN_WIRE_KEYS,
  MAX_ARRAY_LENGTH,
  MAX_JSON_DEPTH,
  MAX_OBJECT_KEYS,
  PROTOCOL_MAX,
  PROTOCOL_MIN,
  V1_DEFERRED_CAMPAIGN_EVENTS
} from './constants.js';
import { DiscoveryDocumentSchema } from './discovery.js';
import type { ProtocolErrorCode } from './errors.js';
import { WireMessageSchema } from './messages.js';
import { isIncompatibleProtocolVersion } from './compatibility.js';

/** @public */
export type ValidationLimits = {
  readonly maxBytes: number;
  readonly maxDepth: number;
  readonly maxArrayLength: number;
  readonly maxObjectKeys: number;
};

/** @public */
export const DEFAULT_VALIDATION_LIMITS: ValidationLimits = {
  maxBytes: DEFAULT_MAX_MESSAGE_BYTES,
  maxDepth: MAX_JSON_DEPTH,
  maxArrayLength: MAX_ARRAY_LENGTH,
  maxObjectKeys: MAX_OBJECT_KEYS
};

/** @public */
export type ValidationSuccess<T> = {
  readonly success: true;
  readonly data: T;
};

/** @public */
export type ValidationFailure = {
  readonly success: false;
  readonly code: ProtocolErrorCode;
};

/** @public */
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

/**
 * Structural safety walk. Does not throw; returns a stable error code.
 */
function inspectStructure(
  value: unknown,
  limits: ValidationLimits,
  depth: number
): ProtocolErrorCode | null {
  if (depth > limits.maxDepth) {
    return 'invalid_message';
  }
  if (value === null || typeof value !== 'object') {
    return null;
  }
  if (Array.isArray(value)) {
    if (value.length > limits.maxArrayLength) {
      return 'invalid_message';
    }
    for (const item of value) {
      const nested = inspectStructure(item, limits, depth + 1);
      if (nested !== null) {
        return nested;
      }
    }
    return null;
  }
  const keys = Object.keys(value);
  if (keys.length > limits.maxObjectKeys) {
    return 'invalid_message';
  }
  for (const key of keys) {
    if ((FORBIDDEN_WIRE_KEYS as readonly string[]).includes(key)) {
      return 'invalid_payload';
    }
    const nested = inspectStructure(
      (value as Record<string, unknown>)[key],
      limits,
      depth + 1
    );
    if (nested !== null) {
      return nested;
    }
  }
  return null;
}

function protocolVersionCode(input: unknown): ProtocolErrorCode | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return null;
  }
  const record = input as Record<string, unknown>;
  if (typeof record['protocolVersion'] === 'number') {
    const version = record['protocolVersion'];
    if (version < PROTOCOL_MIN || version > PROTOCOL_MAX) {
      return 'incompatible_version';
    }
  }
  if (
    typeof record['selectedProtocolVersion'] === 'number' &&
    (record['selectedProtocolVersion'] < PROTOCOL_MIN ||
      record['selectedProtocolVersion'] > PROTOCOL_MAX)
  ) {
    return 'incompatible_version';
  }
  if (
    typeof record['protocolMin'] === 'number' &&
    typeof record['protocolMax'] === 'number' &&
    record['kind'] === 'handshake'
  ) {
    if (
      isIncompatibleProtocolVersion(
        record['protocolMin'],
        record['protocolMax'],
        PROTOCOL_MIN,
        PROTOCOL_MAX
      )
    ) {
      return 'incompatible_version';
    }
  }
  return null;
}

function mapZodFailure(input: unknown): ProtocolErrorCode {
  const versionCode = protocolVersionCode(input);
  if (versionCode !== null) {
    return versionCode;
  }
  if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
    const record = input as Record<string, unknown>;
    if (typeof record['type'] === 'string') {
      if (
        (V1_DEFERRED_CAMPAIGN_EVENTS as readonly string[]).includes(
          record['type']
        )
      ) {
        return 'invalid_message';
      }
    }
  }
  return 'invalid_payload';
}

function safeParseSchema<T>(
  schema: z.ZodType<T>,
  input: unknown,
  limits: ValidationLimits = DEFAULT_VALIDATION_LIMITS
): ValidationResult<T> {
  try {
    let serialized: string;
    try {
      serialized = JSON.stringify(input);
    } catch {
      return { success: false, code: 'invalid_message' };
    }
    if (serialized === undefined) {
      return { success: false, code: 'invalid_message' };
    }
    if (utf8ByteLength(serialized) > limits.maxBytes) {
      return { success: false, code: 'invalid_message' };
    }
    const structureCode = inspectStructure(input, limits, 0);
    if (structureCode !== null) {
      return { success: false, code: structureCode };
    }
    const versionCode = protocolVersionCode(input);
    if (versionCode !== null) {
      return { success: false, code: versionCode };
    }
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return { success: false, code: mapZodFailure(input) };
    }
    return { success: true, data: parsed.data };
  } catch {
    return { success: false, code: 'invalid_message' };
  }
}

/**
 * Validate an unknown value as a discovery document. Never throws.
 * @public
 */
export function validateDiscoveryDocument(
  input: unknown,
  limits?: ValidationLimits
): ValidationResult<z.infer<typeof DiscoveryDocumentSchema>> {
  return safeParseSchema(DiscoveryDocumentSchema, input, limits);
}

/**
 * Validate an unknown value as a WebSocket wire message. Never throws.
 * @public
 */
export function validateWireMessage(
  input: unknown,
  limits?: ValidationLimits
): ValidationResult<z.infer<typeof WireMessageSchema>> {
  return safeParseSchema(WireMessageSchema, input, limits);
}

/**
 * Validate with a caller-supplied schema. Never throws; never leaks Zod internals.
 * @public
 */
export function validateWithSchema<T>(
  schema: z.ZodType<T>,
  input: unknown,
  limits?: ValidationLimits
): ValidationResult<T> {
  return safeParseSchema(schema, input, limits);
}

/**
 * Recursively detect forbidden secret-like keys in a JSON-safe value.
 * @public
 */
export function findForbiddenWireKeys(value: unknown): readonly string[] {
  const found = new Set<string>();
  const walk = (node: unknown): void => {
    if (node === null || typeof node !== 'object') {
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item);
      }
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      if ((FORBIDDEN_WIRE_KEYS as readonly string[]).includes(key)) {
        found.add(key);
      }
      walk(child);
    }
  };
  walk(value);
  return [...found];
}
