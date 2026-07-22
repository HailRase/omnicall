/**
 * Unit tests for live Origin-policy capability intersection (ADR-0018).
 */

import { describe, expect, it } from "vitest";

import {
  intersectCapabilitiesWithOriginPolicy,
  isRequiredCapabilityBlockedByOriginPolicy,
} from "./sdkGatewayCapabilities.js";

describe("intersectCapabilitiesWithOriginPolicy", () => {
  it("returns grants ∩ policy", () => {
    expect(
      intersectCapabilitiesWithOriginPolicy(
        ["session.read.redacted", "call.originate", "window.show"],
        ["session.read.redacted", "window.show"],
      ),
    ).toEqual(["session.read.redacted", "window.show"]);
  });

  it("fail-closed on empty policy", () => {
    expect(
      intersectCapabilitiesWithOriginPolicy(
        ["session.read.redacted", "call.originate"],
        [],
      ),
    ).toEqual([]);
  });
});

describe("isRequiredCapabilityBlockedByOriginPolicy", () => {
  it("detects live matrix strip of a paired grant", () => {
    expect(
      isRequiredCapabilityBlockedByOriginPolicy({
        granted: ["call.originate", "session.read.redacted"],
        originPolicyCapabilities: ["session.read.redacted"],
        required: "call.originate",
      }),
    ).toBe(true);
  });

  it("is false when grant was never present", () => {
    expect(
      isRequiredCapabilityBlockedByOriginPolicy({
        granted: ["session.read.redacted"],
        originPolicyCapabilities: ["session.read.redacted"],
        required: "call.originate",
      }),
    ).toBe(false);
  });
});
