/**
 * - Purpose: supply deterministic time to External Services application tests.
 * - Inputs: an initial timestamp and controlled clock adjustments.
 * - Outputs: immutable current-time snapshots without wall-clock dependency.
 */
import type { Clock } from "@ports/shared/Clock.js";

export class MockClock implements Clock {
  private currentMs: number;

  constructor(initial: Date | number) {
    this.currentMs =
      initial instanceof Date ? initial.getTime() : initial;
    if (!Number.isFinite(this.currentMs)) {
      throw new Error("Mock clock initial value must be finite.");
    }
  }

  now(): Date {
    return new Date(this.currentMs);
  }

  set(value: Date | number): void {
    const nextValue = value instanceof Date ? value.getTime() : value;
    if (!Number.isFinite(nextValue)) {
      throw new Error("Mock clock value must be finite.");
    }
    this.currentMs = nextValue;
  }

  advanceBy(milliseconds: number): void {
    if (!Number.isFinite(milliseconds)) {
      throw new Error("Mock clock duration must be finite.");
    }
    this.currentMs += milliseconds;
  }
}
