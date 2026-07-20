import { describe, expect, it } from "vitest";
import {
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
        enabled: true,
        allowedOrigins: [],
        originsManaged: true,
      }),
    ).toEqual({
      enabled: true,
      allowedOrigins: [],
      originsManaged: true,
    });
  });

  it("rejects wildcards and null origins", () => {
    expect(
      parseSdkIntegrationSettings({
        enabled: true,
        allowedOrigins: ["https://*.example.com"],
        originsManaged: true,
      }),
    ).toBeNull();
    expect(
      parseSdkIntegrationSettings({
        enabled: true,
        allowedOrigins: ["null"],
        originsManaged: true,
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
});
