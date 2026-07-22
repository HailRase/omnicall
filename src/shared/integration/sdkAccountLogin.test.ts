/**
 * Login matching helpers for SDK account activate.
 */

import { describe, expect, it } from "vitest";

import {
  sdkAccountLoginLocalPart,
  sdkAccountLoginsMatch,
  trimSdkAccountLogin,
} from "./sdkAccountLogin.js";

describe("sdkAccountLogin", () => {
  it("trims spaces and preserves case", () => {
    expect(trimSdkAccountLogin("  Agent1001  ")).toBe("Agent1001");
  });

  it("matches full login and local-part variants", () => {
    expect(sdkAccountLoginsMatch("1001", "1001")).toBe(true);
    expect(sdkAccountLoginsMatch("1001", "1001@corp.local")).toBe(true);
    expect(sdkAccountLoginsMatch("1001@corp.local", "1001")).toBe(true);
    expect(sdkAccountLoginsMatch("1001@a", "1001@b")).toBe(true);
    expect(sdkAccountLoginsMatch("1001", "1002")).toBe(false);
    expect(sdkAccountLoginsMatch("Agent", "agent")).toBe(false);
  });

  it("exposes local part", () => {
    expect(sdkAccountLoginLocalPart("1001@corp")).toBe("1001");
    expect(sdkAccountLoginLocalPart("1001")).toBe("1001");
  });
});
