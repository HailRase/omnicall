/**
 * - Purpose: generate deterministic RFC 4122 UUIDs for External Services tests.
 * - Inputs: optional non-negative sequence seed.
 * - Outputs: distinct valid UUID version-four strings.
 */
import type { UuidGenerator } from "@ports/shared/UuidGenerator.js";

const MAX_UUID_SEQUENCE = 0xffff_ffff_ffff;

export class DeterministicUuidGenerator implements UuidGenerator {
  private sequence: number;

  constructor(seed: number = 0) {
    if (!Number.isSafeInteger(seed) || seed < 0 || seed > MAX_UUID_SEQUENCE) {
      throw new Error("UUID generator seed must be a safe non-negative sequence.");
    }
    this.sequence = seed;
  }

  generate(): string {
    if (this.sequence >= MAX_UUID_SEQUENCE) {
      throw new Error("UUID generator sequence is exhausted.");
    }
    this.sequence += 1;
    return `00000000-0000-4000-8000-${this.sequence.toString(16).padStart(12, "0")}`;
  }
}
