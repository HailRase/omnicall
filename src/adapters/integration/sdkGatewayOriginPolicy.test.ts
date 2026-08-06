import { describe, expect, it } from "vitest";

import type { SdkOriginTrustEntry } from "@domain/index.js";
import {
  evaluateSdkOriginUpgrade,
  isAllowedUpgradeOrigin,
  isSdkDiscoveryCorsEligible,
  mergePersistedOriginTrustWithEnvSeed,
  parseSdkOriginAllowlist,
  resolveSdkOriginTrustState,
  trustEntriesFromAllowlist,
} from "./sdkGatewayOriginPolicy.js";

describe("sdkGatewayOriginPolicy", () => {
  const allowlist = ["https://crm.example", "http://localhost:3000"] as const;
  const trustEntries = trustEntriesFromAllowlist(allowlist);

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

  it("parses only exact HTTP(S) Origins from the CSV allowlist", () => {
    expect(parseSdkOriginAllowlist(" https://a.example , https://b.example ")).toEqual([
      "https://a.example",
      "https://b.example",
    ]);
    expect(
      parseSdkOriginAllowlist(
        "*, https://crm.example.evil/path, https://crm.example/, file:///tmp, http://localhost:3000",
      ),
    ).toEqual(["http://localhost:3000"]);
    expect(parseSdkOriginAllowlist(undefined)).toEqual([]);
  });

  it("resolves trust state from entries", () => {
    expect(resolveSdkOriginTrustState("https://crm.example", trustEntries)).toBe(
      "allowed",
    );
    expect(resolveSdkOriginTrustState("https://unknown.example", trustEntries)).toBe(
      "unknown",
    );
  });

  it("accepts only exact allowed Origins at upgrade", () => {
    expect(evaluateSdkOriginUpgrade("https://crm.example", trustEntries)).toEqual({
      action: "accept",
      trustState: "allowed",
    });
    expect(evaluateSdkOriginUpgrade("https://new.example", trustEntries)).toEqual({
      action: "reject",
      reason: "origin_not_allowed",
    });
    expect(evaluateSdkOriginUpgrade(undefined, trustEntries)).toEqual({
      action: "reject",
      reason: "origin_missing",
    });
    expect(evaluateSdkOriginUpgrade("https://crm.example/", trustEntries)).toEqual({
      action: "reject",
      reason: "origin_missing",
    });
    const deniedEntries = trustEntriesFromAllowlist(["https://crm.example"]).map(
      (entry) =>
        entry.origin === "https://crm.example"
          ? { ...entry, state: "denied" as const }
          : entry,
    );
    expect(evaluateSdkOriginUpgrade("https://crm.example", deniedEntries)).toEqual({
      action: "reject",
      reason: "origin_denied",
    });
  });

  it("CORS eligible for unknown and allowed only", () => {
    expect(isSdkDiscoveryCorsEligible("https://crm.example", trustEntries)).toBe(
      true,
    );
    expect(isSdkDiscoveryCorsEligible("https://new.example", trustEntries)).toBe(
      true,
    );
    const deniedEntries = trustEntriesFromAllowlist(["https://crm.example"]).map(
      (entry) =>
        entry.origin === "https://crm.example"
          ? { ...entry, state: "denied" as const }
          : entry,
    );
    expect(isSdkDiscoveryCorsEligible("https://crm.example", deniedEntries)).toBe(
      false,
    );
  });

  it("env allow seed loses to persisted denied for the same Origin", () => {
    const denied: SdkOriginTrustEntry[] = [
      {
        origin: "https://crm.example",
        state: "denied",
        matrix: null,
        previouslyAllowed: false,
      },
    ];
    const merged = mergePersistedOriginTrustWithEnvSeed(denied, [
      "https://crm.example",
      "https://help.example",
    ]);
    expect(evaluateSdkOriginUpgrade("https://crm.example", merged)).toEqual({
      action: "reject",
      reason: "origin_denied",
    });
    expect(evaluateSdkOriginUpgrade("https://help.example", merged)).toEqual({
      action: "accept",
      trustState: "allowed",
    });
  });
});
