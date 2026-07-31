/**
 * Shared monotonic session revision for SDK read + mutation surfaces (DI-05/DI-06).
 *
 * Contract (ADR-0017 O-OWN-1 / PROTOCOL):
 * - Mutations require `expectedRevision === peek()`.
 * - Successful mutations call `advance()` and return that **new** value as `reply.revision`.
 * - Clients use `reply.revision` (or a read's current revision) as the next `expectedRevision`.
 * - Reads return `peek()` without advancing so snapshot/ping do not break mutate chains.
 */

export class SdkSessionRevisionClock {
  private revision = 1;

  /** Current aggregate revision (no side effect). */
  peek(): number {
    return this.revision;
  }

  /** Advance after a successful mutation; returns the new aggregate revision. */
  advance(): number {
    this.revision += 1;
    return this.revision;
  }
}
