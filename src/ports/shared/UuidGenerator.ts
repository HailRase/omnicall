/**
 * - Purpose: generate stable UUID values outside External Services domain rules.
 * - Inputs: a request for a new identifier.
 * - Outputs: an RFC 4122 UUID string for domain validation.
 */
export interface UuidGenerator {
  generate(): string;
}
