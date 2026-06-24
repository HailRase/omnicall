import type { MakeCallProgress } from "@ports/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";

import type { JsSipRtcSessionPort } from "./JsSipRtcSessionPort.js";
import {
  extractSipProgressCode,
  formatSessionFailure,
} from "./jsSipSessionEventUtils.js";

/**
 * - Purpose: await outbound JsSIP session progress until answer or terminal failure.
 * - Inputs: outbound RTC session port after ua.call.
 * - Outputs: MakeCallProgress result matching TelephonyGateway contract.
 */
export function executeJsSipOutboundCall(
  session: JsSipRtcSessionPort,
): Promise<Result<MakeCallProgress, PlatformError>> {
  return new Promise((resolve) => {
    let settled = false;

    const settle = (result: Result<MakeCallProgress, PlatformError>): void => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve(result);
    };

    const onProgress = (...args: unknown[]): void => {
      const code = extractSipProgressCode(args[0]);
      if (code === 183) {
        settle(ok({ stage: "progress", progressCode: 183 }));
        return;
      }
      if (code === 180) {
        settle(ok({ stage: "progress", progressCode: 180 }));
      }
    };

    const onConfirmed = (): void => {
      settle(ok({ stage: "answered" }));
    };

    const onFailed = (...args: unknown[]): void => {
      settle(err(createPlatformError("operation_failed", formatSessionFailure(args[0]))));
    };

    const onEnded = (): void => {
      if (!settled) {
        settle(err(createPlatformError("operation_failed", "call_ended_before_answer")));
      }
    };

    const cleanup = (): void => {
      session.off("progress", onProgress);
      session.off("confirmed", onConfirmed);
      session.off("failed", onFailed);
      session.off("ended", onEnded);
    };

    session.on("progress", onProgress);
    session.on("confirmed", onConfirmed);
    session.on("failed", onFailed);
    session.on("ended", onEnded);
  });
}
