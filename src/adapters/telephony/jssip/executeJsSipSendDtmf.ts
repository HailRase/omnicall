import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";

import type { JsSipRtcSessionPort } from "./JsSipRtcSessionPort.js";

/**
 * - Purpose: send one DTMF tone through a JsSIP RTC session.
 * - Inputs: session port and validated tone symbol.
 * - Outputs: gateway Result for TelephonyGateway.sendDtmf.
 */
export function executeJsSipSendDtmf(
  session: JsSipRtcSessionPort,
  tone: string,
): Result<void, PlatformError> {
  try {
    session.sendDtmf(tone);
    return ok(undefined);
  } catch (error: unknown) {
    const normalized = normalizeUnknownError(error);
    return err(
      createPlatformError(
        "operation_failed",
        `DTMF send failed: ${normalized.message}`,
      ),
    );
  }
}
