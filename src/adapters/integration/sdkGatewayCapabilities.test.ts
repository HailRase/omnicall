/**
 * Unit tests for live Origin-policy capability intersection (ADR-0018 / ADR-0021).
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

  it("expands call.control umbrella before ∩ policy", () => {
    expect(
      intersectCapabilitiesWithOriginPolicy(
        ["session.read.redacted", "call.control"],
        ["session.read.redacted", "call.hold", "call.mute"],
      ),
    ).toEqual(["session.read.redacted", "call.hold", "call.mute"]);
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

  it("detects matrix strip of granular when pairing only had umbrella", () => {
    expect(
      isRequiredCapabilityBlockedByOriginPolicy({
        granted: ["call.control", "session.read.redacted"],
        originPolicyCapabilities: ["session.read.redacted"],
        required: "call.hold",
      }),
    ).toBe(true);
  });
});
