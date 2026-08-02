import { describe, expect, it } from "vitest";
import { matchExternalApplications } from "./matchExternalApplications.js";
import { parseExternalApplicationsSettings } from "../parseExternalApplicationsSettings.js";
import { createSettingsAccountKey } from "../../../settings/SettingsAccountKey.js";
import type { ExternalServiceTriggerContext } from "../../external-services/template/buildExternalServiceVariables.js";

const parsedSettings = parseExternalApplicationsSettings({
  applications: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      name: "CRM",
      enabled: true,
      urlTemplate: "https://crm.example.test",
      openMode: "electron_window",
      window: { width: 1100, height: 800 },
      variables: [],
      triggers: [{ eventType: "incoming_ringing", delaySeconds: 2 }],
    },
  ],
});

if (!parsedSettings.ok) {
  throw new Error("invalid_external_applications_test_fixture");
}

const trigger: ExternalServiceTriggerContext = {
  eventType: "incoming_ringing",
  occurredAt: "2026-07-31T00:00:00.000Z",
  profileKey: createSettingsAccountKey("test"),
  callId: "call-1",
};

describe("matchExternalApplications", () => {
  it("returns enabled applications matching a focused trigger", () => {
    const matches = matchExternalApplications(
      parsedSettings.value,
      trigger,
      true,
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]?.delaySeconds).toBe(2);
  });

  it("does not screen-pop focus-gated events for unfocused calls", () => {
    expect(
      matchExternalApplications(
        parsedSettings.value,
        trigger,
        false,
      ),
    ).toEqual([]);
  });

  it("matches post_call_processing without a call-focus gate", () => {
    const postCallSettings = parseExternalApplicationsSettings({
      applications: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          name: "CRM",
          enabled: true,
          urlTemplate: "https://crm.example.test/wrapup",
          openMode: "electron_window",
          window: { width: 1100, height: 800 },
          variables: [],
          triggers: [{ eventType: "post_call_processing", delaySeconds: 0 }],
        },
      ],
    });
    if (!postCallSettings.ok) {
      throw new Error("invalid_external_applications_post_call_fixture");
    }
    const matches = matchExternalApplications(
      postCallSettings.value,
      {
        eventType: "post_call_processing",
        occurredAt: "2026-07-31T00:00:00.000Z",
        profileKey: createSettingsAccountKey("test"),
      },
      false,
    );
    expect(matches).toHaveLength(1);
  });
});
