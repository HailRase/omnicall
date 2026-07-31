/**
 * - Purpose: provide wall-clock time for External Services application runtime.
 * - Inputs: none.
 * - Outputs: current Date snapshots from the host clock.
 */

import type { Clock } from "@ports/shared/Clock.js";

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
