import { describe, expect, it } from "vitest";
import {
  MAX_OCP_DOMAIN_LENGTH,
  OCP_INTEGRATION_DEFAULTS,
  parseOcpIntegrationSettings,
} from "./OcpIntegrationSettings.js";

describe("parseOcpIntegrationSettings", () => {
  it("returns defaults for undefined or null", () => {
    expect(parseOcpIntegrationSettings(undefined)).toEqual(OCP_INTEGRATION_DEFAULTS);
    expect(parseOcpIntegrationSettings(null)).toEqual(OCP_INTEGRATION_DEFAULTS);
  });

  it("parses valid payload and trims domain", () => {
    expect(
      parseOcpIntegrationSettings({
        enabled: true,
        domain: "  ocp.example.com  ",
        autoConnect: true,
        linked: true,
      }),
    ).toEqual({
      enabled: true,
      domain: "ocp.example.com",
      autoConnect: true,
      linked: true,
    });
  });

  it("defaults linked false when legacy autoSipAuth shape is present", () => {
    expect(
      parseOcpIntegrationSettings({
        enabled: true,
        domain: "ocp.example.com",
        autoConnect: false,
        autoSipAuth: true,
      }),
    ).toEqual({
      enabled: true,
      domain: "ocp.example.com",
      autoConnect: false,
      linked: false,
    });
  });

  it("allows empty domain", () => {
    expect(
      parseOcpIntegrationSettings({
        ...OCP_INTEGRATION_DEFAULTS,
        domain: "   ",
      }),
    ).toEqual(OCP_INTEGRATION_DEFAULTS);
  });

  it("rejects non-object and invalid field types", () => {
    expect(parseOcpIntegrationSettings("x")).toBeNull();
    expect(
      parseOcpIntegrationSettings({
        enabled: "yes",
        domain: "",
        autoConnect: false,
        linked: false,
      }),
    ).toBeNull();
    expect(
      parseOcpIntegrationSettings({
        enabled: true,
        domain: 1,
        autoConnect: false,
        linked: false,
      }),
    ).toBeNull();
  });

  it("rejects domain longer than max length", () => {
    expect(
      parseOcpIntegrationSettings({
        ...OCP_INTEGRATION_DEFAULTS,
        domain: "a".repeat(MAX_OCP_DOMAIN_LENGTH + 1),
      }),
    ).toBeNull();
  });
});
