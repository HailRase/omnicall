import { describe, expect, it } from "vitest";
import {
  createExternalServicesTestSettings,
  EXTERNAL_SERVICES_TEST_COLLECTION_ID,
  EXTERNAL_SERVICES_TEST_PROFILE_KEY,
} from "../../services/integration/external-services/externalServicesTestFixtures.js";
import {
  deriveExternalServicesCollectionsFromSettings,
  deriveExternalServicesCollectionsPanel,
} from "./deriveExternalServicesCollectionsPanel.js";

describe("deriveExternalServicesCollectionsPanel", () => {
  it("returns empty loading panel when outcome is null", () => {
    const panel = deriveExternalServicesCollectionsPanel(null, "loading");
    expect(panel).toEqual({
      loadState: "loading",
      settingsRevision: 0,
      matchingEnabled: false,
      collections: [],
      enabledCollectionCount: 0,
    });
  });

  it("maps query outcome to UI-safe summaries without branded types", () => {
    const settings = createExternalServicesTestSettings();
    const panel = deriveExternalServicesCollectionsPanel(
      {
        profileKey: EXTERNAL_SERVICES_TEST_PROFILE_KEY,
        settings,
        settingsRevision: 3,
        matchingEnabled: true,
        collections: [
          {
            collection: settings.collections[0]!,
            enabledRequestCount: 1,
            requestCount: 1,
            requests: settings.collections[0]!.requests,
          },
        ],
        enabledCollectionCount: 1,
        journal: [],
        journalStatus: "ready",
      },
      "ready",
    );

    expect(panel.loadState).toBe("ready");
    expect(panel.settingsRevision).toBe(3);
    expect(panel.collections).toEqual([
      {
        id: EXTERNAL_SERVICES_TEST_COLLECTION_ID,
        name: "CRM",
        enabled: true,
        enabledRequestCount: 1,
        requestCount: 1,
        variables: [{ key: "base_url", value: "https://crm.example.test" }],
      },
    ]);
  });

  it("maps settings snapshot after mutations", () => {
    const settings = createExternalServicesTestSettings({
      collectionEnabled: false,
      requestEnabled: false,
    });
    const panel = deriveExternalServicesCollectionsFromSettings(settings, 4, true);
    expect(panel.enabledCollectionCount).toBe(0);
    expect(panel.collections[0]?.enabledRequestCount).toBe(0);
  });
});
