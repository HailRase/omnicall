import { describe, expect, it } from "vitest";
import { createDefaultSdkOriginCapabilityMatrix } from "./SdkOriginTrust.js";
import {
  migrateLegacySdkIntegrationSettings,
  parseSdkIntegrationSettings,
  parseSdkOriginsDraft,
  SDK_INTEGRATION_DEFAULTS,
} from "./SdkIntegrationSettings.js";

describe("SdkIntegrationSettings", () => {
  it("defaults when missing", () => {
    expect(parseSdkIntegrationSettings(undefined)).toEqual(SDK_INTEGRATION_DEFAULTS);
  });

  it("accepts fail-closed empty managed origins", () => {
    expect(
      parseSdkIntegrationSettings({
        originsManaged: true,
        origins: [],
      }),
    ).toEqual({
      originsManaged: true,
      origins: [],
      operatorModalTimeouts: SDK_INTEGRATION_DEFAULTS.operatorModalTimeouts,
    });
  });

  it("parses operatorModalTimeouts and falls back to defaults when missing", () => {
    expect(
      parseSdkIntegrationSettings({
        originsManaged: true,
        origins: [],
        operatorModalTimeouts: {
          consentTtlMs: 60_000,
          originTrustTtlMs: 120_000,
          pairingTtlMs: 180_000,
        },
      }),
    ).toEqual({
      originsManaged: true,
      origins: [],
      operatorModalTimeouts: {
        consentTtlMs: 60_000,
        originTrustTtlMs: 120_000,
        pairingTtlMs: 180_000,
      },
    });
  });

  it("rejects wildcards and null origins", () => {
    expect(
      parseSdkIntegrationSettings({
        originsManaged: true,
        origins: [{
          origin: "https://*.example.com",
          state: "allowed",
          matrix: null,
          previouslyAllowed: true,
        }],
      }),
    ).toBeNull();
    expect(
      parseSdkIntegrationSettings({
        originsManaged: true,
        origins: [{
          origin: "null",
          state: "allowed",
          matrix: null,
          previouslyAllowed: true,
        }],
      }),
    ).toBeNull();
  });

  it("parses origins draft and rejects invalid entries", () => {
    expect(parseSdkOriginsDraft("https://a.example\nhttps://b.example")).toEqual([
      "https://a.example",
      "https://b.example",
    ]);
    expect(parseSdkOriginsDraft("https://ok.example, *")).toBeNull();
  });

  it("migrates DI-09 {enabled, allowedOrigins} to trust entries and discards enabled", () => {
    const legacy = {
      enabled: false,
      allowedOrigins: ["https://crm.example.com", "https://helpdesk.example.com"],
      originsManaged: true,
    };
    const migrated = migrateLegacySdkIntegrationSettings(legacy);
    expect(migrated).toEqual({
      originsManaged: true,
      origins: [
        {
          origin: "https://crm.example.com",
          state: "allowed",
          matrix: createDefaultSdkOriginCapabilityMatrix(),
          previouslyAllowed: true,
        },
        {
          origin: "https://helpdesk.example.com",
          state: "allowed",
          matrix: createDefaultSdkOriginCapabilityMatrix(),
          previouslyAllowed: true,
        },
      ],
      operatorModalTimeouts: SDK_INTEGRATION_DEFAULTS.operatorModalTimeouts,
    });
    expect(parseSdkIntegrationSettings(legacy)).toEqual(migrated);
    expect(migrated).not.toHaveProperty("enabled");
  });
});
