import { describe, expect, it } from "vitest";
import { createDefaultUserNotificationPreferences } from "@application/index.js";
import {
  applyNotificationPreferencesPreset,
  MIN_LEVEL_OPTION_LABEL_KEY,
  USER_NOTIFICATION_LEVELS,
} from "./notificationPreferencesUi.js";

describe("notificationPreferencesUi", () => {
  it("maps minLevel values to threshold option copy keys", () => {
    expect(USER_NOTIFICATION_LEVELS).toEqual([
      "info",
      "success",
      "warning",
      "error",
    ]);
    expect(MIN_LEVEL_OPTION_LABEL_KEY.info).toBe(
      "settings.notifications.preferences.minLevel.option.all",
    );
    expect(MIN_LEVEL_OPTION_LABEL_KEY.warning).toBe(
      "settings.notifications.preferences.minLevel.option.warningsAndErrors",
    );
    expect(MIN_LEVEL_OPTION_LABEL_KEY.error).toBe(
      "settings.notifications.preferences.minLevel.option.errorsOnly",
    );
  });

  it("applies quiet successes without changing appearance", () => {
    const current = createDefaultUserNotificationPreferences();
    const next = applyNotificationPreferencesPreset(current, "quietSuccesses");

    expect(next.appearance).toEqual(current.appearance);
    expect(next.modules.system.minLevel).toBe("warning");
    expect(next.modules.sdk.enabled).toBe(true);
  });

  it("applies telephony focus without muting telephony or headset", () => {
    const current = createDefaultUserNotificationPreferences();
    const next = applyNotificationPreferencesPreset(current, "telephonyFocus");

    expect(next.appearance).toEqual(current.appearance);
    expect(next.modules.telephony.minLevel).toBe("info");
    expect(next.modules.headset.minLevel).toBe("info");
    expect(next.modules.account.minLevel).toBe("info");
    expect(next.modules.ocp.minLevel).toBe("info");
    expect(next.modules.contacts.minLevel).toBe("error");
    expect(next.modules.updates.minLevel).toBe("error");
    expect(next.modules.externalApplications.minLevel).toBe("error");
  });

  it("restores default module prefs while preserving appearance", () => {
    const current = {
      ...createDefaultUserNotificationPreferences(),
      masterInAppPopupEnabled: false,
      appearance: {
        ...createDefaultUserNotificationPreferences().appearance,
        maxVisible: 5,
      },
      modules: applyNotificationPreferencesPreset(
        createDefaultUserNotificationPreferences(),
        "quietSuccesses",
      ).modules,
    };

    const next = applyNotificationPreferencesPreset(current, "default");
    expect(next.masterInAppPopupEnabled).toBe(true);
    expect(next.appearance.maxVisible).toBe(5);
    expect(next.modules.telephony.minLevel).toBe("info");
  });
});
