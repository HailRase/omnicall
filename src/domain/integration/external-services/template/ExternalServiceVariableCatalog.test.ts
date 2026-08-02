import { describe, expect, it } from "vitest";
import { createSettingsAccountKey } from "../../../settings/SettingsAccountKey.js";
import {
  EXTERNAL_SERVICE_SYSTEM_VARIABLE_NAMES,
  EXTERNAL_SERVICE_VARIABLE_CATALOG,
  EXTERNAL_SERVICE_VARIABLE_CATALOG_GROUPS,
  formatExternalServiceVariableToken,
  isExternalServiceSystemVariableName,
  listExternalServiceVariableCatalogByGroup,
  resolveExternalServiceSystemVariableAvailability,
} from "./ExternalServiceVariableCatalog.js";
import { buildExternalServiceVariables } from "./buildExternalServiceVariables.js";

describe("ExternalServiceVariableCatalog", () => {
  it("formats tokens without nested braces", () => {
    expect(formatExternalServiceVariableToken("call_id")).toBe("{{call_id}}");
  });

  it("lists every catalog group with at least one entry", () => {
    for (const group of EXTERNAL_SERVICE_VARIABLE_CATALOG_GROUPS) {
      expect(listExternalServiceVariableCatalogByGroup(group).length).toBeGreaterThan(0);
    }
  });

  it("covers base system keys produced by buildExternalServiceVariables", () => {
    const variables = buildExternalServiceVariables([], {
      eventType: "incoming_ringing",
      occurredAt: "2026-07-30T10:00:00.000Z",
      profileKey: createSettingsAccountKey("agent@pbx.example"),
      callId: "call-1",
      callerId: "100",
      calledId: "200",
      callDirection: "inbound",
      userLogin: "agent",
      hangupReason: undefined,
    });
    const alwaysAndCall = EXTERNAL_SERVICE_VARIABLE_CATALOG.filter(
      (entry) => entry.group === "always" || entry.group === "call",
    ).map((entry) => entry.name);
    for (const name of alwaysAndCall) {
      expect(Object.prototype.hasOwnProperty.call(variables, name)).toBe(true);
    }
  });

  it("keeps catalog names unique within each group", () => {
    for (const group of EXTERNAL_SERVICE_VARIABLE_CATALOG_GROUPS) {
      const names = listExternalServiceVariableCatalogByGroup(group).map((entry) => entry.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it("exposes unique system names for reserved-key checks", () => {
    expect(isExternalServiceSystemVariableName("call_id")).toBe(true);
    expect(isExternalServiceSystemVariableName("base_url")).toBe(false);
    expect(EXTERNAL_SERVICE_SYSTEM_VARIABLE_NAMES).toContain("queue_name");
    expect(new Set(EXTERNAL_SERVICE_SYSTEM_VARIABLE_NAMES).size).toBe(
      EXTERNAL_SERVICE_SYSTEM_VARIABLE_NAMES.length,
    );
  });

  it("resolves availability for unique and dual-group system names", () => {
    expect(resolveExternalServiceSystemVariableAvailability("timestamp")).toBe("always");
    expect(resolveExternalServiceSystemVariableAvailability("call_id")).toBe("call");
    expect(resolveExternalServiceSystemVariableAvailability("campaign_id")).toBe("campaign");
    expect(resolveExternalServiceSystemVariableAvailability("acd_phase")).toBe("acd");
    expect(resolveExternalServiceSystemVariableAvailability("queue_name")).toBe("campaign_acd");
    expect(resolveExternalServiceSystemVariableAvailability("base_url")).toBeNull();
  });
});
