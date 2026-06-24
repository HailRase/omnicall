import { createPlatformError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";

import type { JsSipRtcSessionPort } from "./JsSipRtcSessionPort.js";
import { formatSessionFailure } from "./jsSipSessionEventUtils.js";

export type JsSipHoldResumeOperation = "hold" | "unhold";

/**
 * - Purpose: await JsSIP session hold or unhold re-INVITE completion.
 * - Inputs: RTC session port and hold or unhold operation.
 * - Outputs: gateway Result for holdCall or resumeCall adapters.
 */
export function executeJsSipHoldResume(
  session: JsSipRtcSessionPort,
  operation: JsSipHoldResumeOperation,
): Promise<Result<void, PlatformError>> {
  return new Promise((resolve) => {
    let settled = false;

    const settle = (result: Result<void, PlatformError>): void => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve(result);
    };

    const onSucceeded = (): void => {
      settle(ok(undefined));
    };

    const onFailed = (...args: unknown[]): void => {
      settle(
        err(
          createPlatformError(
            "operation_failed",
            `${operation} failed: ${formatSessionFailure(args[0])}`,
          ),
        ),
      );
    };

    const onEnded = (): void => {
      if (!settled) {
        settle(
          err(
            createPlatformError(
              "operation_failed",
              `SIP session ended during ${operation}`,
            ),
          ),
        );
      }
    };

    const cleanup = (): void => {
      session.off("failed", onFailed);
      session.off("ended", onEnded);
    };

    session.on("failed", onFailed);
    session.on("ended", onEnded);

    const started =
      operation === "hold"
        ? session.hold(undefined, onSucceeded)
        : session.unhold(undefined, onSucceeded);

    if (!started) {
      settle(
        err(
          createPlatformError(
            "operation_failed",
            `SIP ${operation} is not available for the current session state`,
          ),
        ),
      );
    }
  });
}
