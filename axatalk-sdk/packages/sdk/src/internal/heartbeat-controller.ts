/**
 * Ready-state heartbeat using sdk:ping correlation. Failures drive reconnect.
 */

import type { ConnectionState } from './connection-state.js';
import type { DiagnosticsSink } from './diagnostics.js';
import type { Scheduler, TimerHandle } from './scheduler.js';

/** Ready-state heartbeat policy. @public */
export type HeartbeatPolicy = {
  readonly enabled: boolean;
  readonly intervalMs: number;
  readonly timeoutMs: number;
};

export const DEFAULT_HEARTBEAT_POLICY: HeartbeatPolicy = {
  enabled: true,
  intervalMs: 15_000,
  timeoutMs: 5_000
};

export type HeartbeatController = {
  readonly start: (intervalMs: number) => void;
  readonly stop: () => void;
  readonly isRunning: () => boolean;
};

export function createHeartbeatController(deps: {
  readonly scheduler: Scheduler;
  readonly diagnostics?: DiagnosticsSink;
  readonly timeoutMs: number;
  readonly sendPing: (timeoutMs: number) => Promise<boolean>;
  readonly onMissed: () => void;
  readonly connectionState: () => ConnectionState;
}): HeartbeatController {
  let intervalHandle: TimerHandle | undefined;
  let inFlight = false;

  const stop = (): void => {
    intervalHandle?.clear();
    intervalHandle = undefined;
    inFlight = false;
  };

  const tick = (): void => {
    if (inFlight) {
      return;
    }
    inFlight = true;
    void deps.sendPing(deps.timeoutMs).then((ok) => {
      inFlight = false;
      if (intervalHandle === undefined) {
        return;
      }
      deps.diagnostics?.emit({
        level: ok ? 'debug' : 'warn',
        code: ok ? 'heartbeat.ok' : 'heartbeat.missed',
        connectionState: deps.connectionState(),
        commandType: 'sdk:ping',
        result: ok ? 'ok' : 'timeout'
      });
      if (!ok) {
        stop();
        deps.onMissed();
      }
    });
  };

  return {
    start: (intervalMs) => {
      stop();
      const scheduleNext = (): void => {
        intervalHandle = deps.scheduler.setTimeout(() => {
          tick();
          if (intervalHandle === undefined) {
            return;
          }
          scheduleNext();
        }, intervalMs);
      };
      scheduleNext();
    },
    stop,
    isRunning: () => intervalHandle !== undefined
  };
}
