import { describe, expect, it } from "vitest";
import { createDefaultUserSettings } from "./UserSettings.js";
import {
  buildSipRegistrationRecoveryPolicy,
  buildSipTransportRecoveryPolicy,
} from "./SipRecoverySettings.js";

describe("SipRecoverySettings", () => {
  it("builds separate transport and registration policies from v2 settings", () => {
    const settings = {
      ...createDefaultUserSettings(),
      sipReconnectIntervalSec: 10,
      sipReconnectMaxAttempts: 3,
      sipReregisterIntervalSec: 7,
      sipReregisterMaxAttempts: 4,
    };

    const transport = buildSipTransportRecoveryPolicy(settings);
    const registration = buildSipRegistrationRecoveryPolicy(settings);

    expect(transport).toEqual({
      maxAttempts: 3,
      baseDelayMs: 10_000,
      backoffMultiplier: 1,
      maxDelayMs: 10_000,
      jitterFraction: 0,
    });
    expect(registration).toEqual({
      maxAttempts: 4,
      baseDelayMs: 7_000,
      backoffMultiplier: 1,
      maxDelayMs: 7_000,
      jitterFraction: 0,
    });
  });

  it("clamps interval to minimum 5 seconds", () => {
    const settings = {
      ...createDefaultUserSettings(),
      sipReconnectIntervalSec: 1,
      sipReregisterIntervalSec: 2,
    };

    expect(buildSipTransportRecoveryPolicy(settings).baseDelayMs).toBe(5000);
    expect(buildSipRegistrationRecoveryPolicy(settings).baseDelayMs).toBe(5000);
  });
});
