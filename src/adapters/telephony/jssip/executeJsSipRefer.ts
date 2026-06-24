import { createPlatformError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";

import type { JsSipReferCommandOptions, JsSipRtcSessionPort } from "./JsSipRtcSessionPort.js";
import {
  formatReferRequestFailure,
  mapReferNotifyFailureMessage,
} from "./jsSipReferEventUtils.js";

export type JsSipReferOptions = Readonly<{
  replacesRawSession?: unknown;
}>;

/**
 * - Purpose: await JsSIP REFER completion via ReferSubscriber NOTIFY accepted.
 * - Inputs: RTC session port, SIP refer target, optional replaces session.
 * - Outputs: gateway Result for blind or attended transfer adapters.
 */
export function executeJsSipRefer(
  session: JsSipRtcSessionPort,
  target: string,
  options?: JsSipReferOptions,
): Promise<Result<void, PlatformError>> {
  return new Promise((resolve) => {
    let settled = false;
    let refer202Received = false;

    const settle = (result: Result<void, PlatformError>): void => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve(result);
    };

    const onRequestFailed = (...args: unknown[]): void => {
      settle(
        err(
          createPlatformError(
            "operation_failed",
            `REFER failed: ${formatReferRequestFailure(args[0])}`,
          ),
        ),
      );
    };

    const onRequestSucceeded = (): void => {
      refer202Received = true;
    };

    const onNotifyFailed = (...args: unknown[]): void => {
      settle(
        err(
          createPlatformError(
            "operation_failed",
            mapReferNotifyFailureMessage(args[0]),
          ),
        ),
      );
    };

    const onAccepted = (): void => {
      settle(ok(undefined));
    };

    const onEnded = (): void => {
      if (settled) {
        return;
      }
      if (!refer202Received) {
        settle(
          err(
            createPlatformError(
              "operation_failed",
              "SIP session ended before REFER completed",
            ),
          ),
        );
        return;
      }
      // Dev SBC tears down the transferor leg after REFER 202; NOTIFY may not
      // reach ReferSubscriber once JsSIP terminates the dialog (see RTCSession._terminate).
      settle(ok(undefined));
    };

    const cleanup = (): void => {
      session.off("ended", onEnded);
    };

    session.on("ended", onEnded);

    const referOptions: JsSipReferCommandOptions =
      options?.replacesRawSession !== undefined
        ? {
            eventHandlers: {
              requestFailed: onRequestFailed,
              requestSucceeded: onRequestSucceeded,
              failed: onNotifyFailed,
              accepted: onAccepted,
            },
            replaces: options.replacesRawSession,
          }
        : {
            eventHandlers: {
              requestFailed: onRequestFailed,
              requestSucceeded: onRequestSucceeded,
              failed: onNotifyFailed,
              accepted: onAccepted,
            },
          };

    const referResult = session.refer(target, referOptions);

    if (referResult === false) {
      settle(
        err(
          createPlatformError(
            "operation_failed",
            "SIP REFER is not available for the current session state",
          ),
        ),
      );
    }
  });
}
