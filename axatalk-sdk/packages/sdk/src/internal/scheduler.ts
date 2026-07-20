/**
 * Injectable clock/timers for deterministic fake-time tests and leak proofs.
 */

export type TimerHandle = {
  readonly clear: () => void;
};

export type Scheduler = {
  readonly now: () => number;
  readonly setTimeout: (callback: () => void, delayMs: number) => TimerHandle;
};

export type JitterSource = {
  /** Uniform value in [0, 1). */
  readonly nextUnitInterval: () => number;
};

export type FakeScheduler = Scheduler & {
  readonly advanceBy: (ms: number) => void;
  readonly advanceByAsync: (ms: number) => Promise<void>;
  readonly pendingTimerCount: () => number;
  readonly clearAll: () => void;
};

type PendingTimer = {
  readonly id: number;
  readonly dueAt: number;
  readonly callback: () => void;
};

export function createFakeScheduler(startMs = 0): FakeScheduler {
  let nowMs = startMs;
  let nextId = 1;
  const timers = new Map<number, PendingTimer>();

  const runDue = (): void => {
    for (;;) {
      let due: PendingTimer | undefined;
      for (const timer of timers.values()) {
        if (timer.dueAt > nowMs) {
          continue;
        }
        if (due === undefined || timer.dueAt < due.dueAt || timer.id < due.id) {
          due = timer;
        }
      }
      if (due === undefined) {
        return;
      }
      timers.delete(due.id);
      due.callback();
    }
  };

  return {
    now: () => nowMs,
    setTimeout: (callback, delayMs) => {
      const id = nextId;
      nextId += 1;
      const delay = Math.max(0, delayMs);
      timers.set(id, { id, dueAt: nowMs + delay, callback });
      return {
        clear: () => {
          timers.delete(id);
        }
      };
    },
    advanceBy: (ms) => {
      if (ms < 0) {
        throw new Error('advanceBy requires non-negative ms');
      }
      nowMs += ms;
      runDue();
    },
    /**
     * Advance time and resolve queued microtasks from timer callbacks (Promises).
     * Call from async tests after advances that complete Promise-based work.
     */
    advanceByAsync: async (ms: number) => {
      if (ms < 0) {
        throw new Error('advanceBy requires non-negative ms');
      }
      nowMs += ms;
      runDue();
      await Promise.resolve();
      await Promise.resolve();
      runDue();
    },
    pendingTimerCount: () => timers.size,
    clearAll: () => {
      timers.clear();
    }
  };
}

export function createFixedJitterSource(value: number): JitterSource {
  if (value < 0 || value >= 1) {
    throw new Error('fixed jitter must be in [0, 1)');
  }
  return {
    nextUnitInterval: () => value
  };
}
