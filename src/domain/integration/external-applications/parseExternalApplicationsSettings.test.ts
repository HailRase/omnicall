import { describe, expect, it } from "vitest";
import { parseExternalApplicationsSettings } from "./parseExternalApplicationsSettings.js";

const application = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "CRM",
  enabled: true,
  urlTemplate: "https://crm.example.test/{{call.id}}",
  openMode: "electron_window",
  window: { width: 1100, height: 800, x: 120, y: 80 },
  variables: [{ key: "tenant", value: "north" }],
  triggers: [{ eventType: "incoming_ringing", delaySeconds: 0 }],
};

describe("parseExternalApplicationsSettings", () => {
  it("freezes a valid settings aggregate with v14-compatible defaults", () => {
    const result = parseExternalApplicationsSettings({ applications: [application] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.applications[0]?.name).toBe("CRM");
      expect(result.value.applications[0]?.window).toEqual({
        width: 1100,
        height: 800,
        x: 120,
        y: 80,
      });
      expect(result.value.applications[0]?.conditions).toEqual({
        callDirection: "any",
        queueNames: [],
      });
      expect(result.value.applications[0]?.windowBehavior).toEqual({
        raiseOnOpen: true,
        alwaysOnTopDuringCall: false,
        onCallEnded: "leave",
      });
      expect(Object.isFrozen(result.value)).toBe(true);
    }
  });

  it("fills default x/y when missing (backward compatible)", () => {
    const result = parseExternalApplicationsSettings({
      applications: [
        {
          ...application,
          window: { width: 1100, height: 800 },
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.applications[0]?.window).toEqual({
        width: 1100,
        height: 800,
        x: 100,
        y: 100,
      });
    }
  });

  it("falls back invalid x/y to defaults and records errors", () => {
    const result = parseExternalApplicationsSettings({
      applications: [
        {
          ...application,
          window: { width: 1100, height: 800, x: 100.5, y: 20000 },
        },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual(
        expect.arrayContaining([
          { path: "applications[0].window.x", code: "not_integer" },
          { path: "applications[0].window.y", code: "out_of_range" },
        ]),
      );
    }
  });

  it("migrates v15 single queueNameEquals into queueNames and drops requireCallerId", () => {
    const result = parseExternalApplicationsSettings({
      applications: [
        {
          ...application,
          conditions: {
            callDirection: "inbound",
            requireCallerId: true,
            queueNameEquals: "Sales",
          },
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.applications[0]?.conditions).toEqual({
        callDirection: "inbound",
        queueNames: ["Sales"],
      });
    }
  });

  it("rejects duplicate application ids and invalid dimensions", () => {
    const result = parseExternalApplicationsSettings({
      applications: [
        application,
        { ...application, window: { width: 1, height: 800, x: 100, y: 100 } },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.map((error) => error.code)).toContain("duplicate");
      expect(result.errors.map((error) => error.code)).toContain("out_of_range");
    }
  });
});
