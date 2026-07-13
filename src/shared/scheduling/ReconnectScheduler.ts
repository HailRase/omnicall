export type TimerHandle = ReturnType<typeof setTimeout>;

export type SchedulerTimerFns = Readonly<{
  setTimeout: (callback: () => void, delayMs: number) => TimerHandle;
  clearTimeout: (handle: TimerHandle) => void;
}>;

const defaultTimerFns: SchedulerTimerFns = {
  setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
  clearTimeout: (handle) => clearTimeout(handle),
};

/**
 * - Purpose: schedule one-shot reconnect delays with explicit cleanup (F-014).
 * - Inputs: delayMs, callback; injectable timer functions for tests.
 * - Outputs: timer handle; cancel/dispose clears pending callbacks.
 */
export class ReconnectScheduler {
  private readonly pending = new Set<TimerHandle>();
  private disposed = false;

  constructor(private readonly timerFns: SchedulerTimerFns = defaultTimerFns) {}

  schedule(delayMs: number, callback: () => void): TimerHandle | null {
    if (this.disposed) {
      return null;
    }

    const handle = this.timerFns.setTimeout(() => {
      this.pending.delete(handle);
      callback();
    }, delayMs);
    this.pending.add(handle);
    return handle;
  }

  cancel(handle: TimerHandle): void {
    if (!this.pending.has(handle)) {
      return;
    }
    this.timerFns.clearTimeout(handle);
    this.pending.delete(handle);
  }

  cancelAll(): void {
    for (const handle of this.pending) {
      this.timerFns.clearTimeout(handle);
    }
    this.pending.clear();
  }

  dispose(): void {
    this.cancelAll();
    this.disposed = true;
  }

  getPendingCount(): number {
    return this.pending.size;
  }
}
