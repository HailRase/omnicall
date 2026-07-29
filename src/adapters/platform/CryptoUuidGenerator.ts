/**
 * - Purpose: generate RFC 4122 UUID values for External Services runtime IDs.
 * - Inputs: none.
 * - Outputs: cryptographically random UUID strings.
 */

import type { UuidGenerator } from "@ports/shared/UuidGenerator.js";

export class CryptoUuidGenerator implements UuidGenerator {
  generate(): string {
    return globalThis.crypto.randomUUID();
  }
}
