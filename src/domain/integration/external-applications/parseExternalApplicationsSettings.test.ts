import { describe, expect, it } from "vitest";
import { parseExternalApplicationsSettings } from "./parseExternalApplicationsSettings.js";

const application = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "CRM",
  enabled: true,
  urlTemplate: "https://crm.example.test/{{call.id}}",
  openMode: "electron_window",
  window: { width: 1100, height: 800 },
  variables: [{ key: "tenant", value: "north" }],
  triggers: [{ eventType: "incoming_ringing", delaySeconds: 0 }],
};

describe("parseExternalApplicationsSettings", () => {
  it("freezes a valid settings aggregate", () => {
    const result = parseExternalApplicationsSettings({ applications: [application] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.applications[0]?.name).toBe("CRM");
      expect(Object.isFrozen(result.value)).toBe(true);
    }
  });

  it("rejects duplicate application ids and invalid dimensions", () => {
    const result = parseExternalApplicationsSettings({
      applications: [application, { ...application, window: { width: 1, height: 800 } }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.map((error) => error.code)).toContain("duplicate");
      expect(result.errors.map((error) => error.code)).toContain("out_of_range");
    }
  });
});
