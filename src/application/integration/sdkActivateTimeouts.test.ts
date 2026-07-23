/**
 * Application re-export parity for activate timeout SSoT (shared implementation).
 */

import { describe, expect, it } from "vitest";

import * as fromApplication from "./sdkActivateTimeouts.js";
import * as fromShared from "@shared/integration/sdkActivateTimeouts.js";

describe("sdkActivateTimeouts application re-export", () => {
  it("matches shared broker timeout and consent TTL", () => {
    expect(fromApplication.SDK_ACTIVATE_BROKER_TIMEOUT_MS).toBe(
      fromShared.SDK_ACTIVATE_BROKER_TIMEOUT_MS,
    );
    expect(fromApplication.SDK_ACTIVATE_CONSENT_TTL_MS).toBe(
      fromShared.SDK_ACTIVATE_CONSENT_TTL_MS,
    );
    expect(
      fromApplication.brokerTimeoutMsForCommand(
        "account:activate-profile",
        5_000,
      ),
    ).toBe(fromShared.SDK_ACTIVATE_BROKER_TIMEOUT_MS);
    expect(fromApplication.releasesSdkInboundQueueWhilePending).toBe(
      fromShared.releasesSdkInboundQueueWhilePending,
    );
  });
});
