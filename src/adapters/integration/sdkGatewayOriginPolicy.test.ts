import { describe, expect, it } from "vitest";

import {
  isAllowedUpgradeOrigin,
  parseSdkOriginAllowlist,
} from "./sdkGatewayOriginPolicy.js";

describe("sdkGatewayOriginPolicy", () => {
  const allowlist = ["https://crm.example", "http://localhost:3000"] as const;

  it("accepts exact Origin members only", () => {
    expect(isAllowedUpgradeOrigin("https://crm.example", allowlist)).toBe(true);
    expect(isAllowedUpgradeOrigin("http://localhost:3000", allowlist)).toBe(true);
  });

  it("rejects missing, null, wrong host, and suffix tricks", () => {
    expect(isAllowedUpgradeOrigin(undefined, allowlist)).toBe(false);
    expect(isAllowedUpgradeOrigin("", allowlist)).toBe(false);
    expect(isAllowedUpgradeOrigin("null", allowlist)).toBe(false);
    expect(isAllowedUpgradeOrigin("NULL", allowlist)).toBe(false);
    expect(isAllowedUpgradeOrigin("https://evil.example", allowlist)).toBe(false);
    expect(isAllowedUpgradeOrigin("https://crm.example.evil", allowlist)).toBe(
      false,
    );
    expect(isAllowedUpgradeOrigin("https://sub.crm.example", allowlist)).toBe(
      false,
    );
    expect(isAllowedUpgradeOrigin("https://crm.example/", allowlist)).toBe(false);
  });

  it("fails closed on empty allowlist", () => {
    expect(isAllowedUpgradeOrigin("https://crm.example", [])).toBe(false);
  });

  it("parses CSV allowlist", () => {
    expect(parseSdkOriginAllowlist(" https://a.example , https://b.example ")).toEqual([
      "https://a.example",
      "https://b.example",
    ]);
    expect(parseSdkOriginAllowlist(undefined)).toEqual([]);
  });
});
