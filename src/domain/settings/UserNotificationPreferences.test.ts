import { describe, expect, it } from "vitest";
import { USER_NOTIFICATION_MODULES } from "./UserNotificationJournalEntry.js";
import { coerceUserNotificationPreferencesFromRecord } from "./coerceUserNotificationPreferences.js";
import {
  createDefaultUserNotificationPreferences,
  DEFAULT_MODULE_PREFERENCES,
  parseUserNotificationPreferences,
  USER_NOTIFICATION_LEVEL_RANK,
} from "./UserNotificationPreferences.js";

describe("UserNotificationPreferences", () => {
  it("defaults preserve popup-on presentation for every catalog module", () => {
    const prefs = createDefaultUserNotificationPreferences();
    expect(prefs.masterInAppPopupEnabled).toBe(true);
    expect(prefs.appearance.placement).toBe("bottom-right");
    expect(prefs.appearance.stacking).toBe("stacked");
    expect(prefs.appearance.durationMs).toBe(4200);
    expect(prefs.appearance.closable).toBe(true);
    expect(prefs.appearance.maxVisible).toBe(3);
    expect(Object.keys(prefs.modules)).toEqual([...USER_NOTIFICATION_MODULES]);
    for (const module of USER_NOTIFICATION_MODULES) {
      expect(prefs.modules[module]).toEqual(DEFAULT_MODULE_PREFERENCES);
    }
  });

  it("ranks levels for minLevel comparisons", () => {
    expect(USER_NOTIFICATION_LEVEL_RANK.info).toBeLessThan(
      USER_NOTIFICATION_LEVEL_RANK.success,
    );
    expect(USER_NOTIFICATION_LEVEL_RANK.success).toBeLessThan(
      USER_NOTIFICATION_LEVEL_RANK.warning,
    );
    expect(USER_NOTIFICATION_LEVEL_RANK.warning).toBeLessThan(
      USER_NOTIFICATION_LEVEL_RANK.error,
    );
  });

  it("parses expanded module catalog members", () => {
    const defaults = createDefaultUserNotificationPreferences();
    const result = parseUserNotificationPreferences({
      ...defaults,
      modules: {
        ...defaults.modules,
        sdk: { enabled: false, minLevel: "warning", raiseWindow: "never" },
        updates: { enabled: true, minLevel: "info", raiseWindow: "never" },
        externalServices: {
          enabled: true,
          minLevel: "error",
          raiseWindow: "errors_only",
        },
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.modules.sdk.enabled).toBe(false);
      expect(result.value.modules.sdk.minLevel).toBe("warning");
      expect(result.value.modules.updates.enabled).toBe(true);
      expect(result.value.modules.externalServices.minLevel).toBe("error");
      expect(result.value.modules.externalServices.raiseWindow).toBe("errors_only");
    }
  });

  it("fills missing module keys with defaults", () => {
    const result = parseUserNotificationPreferences({
      masterInAppPopupEnabled: true,
      appearance: createDefaultUserNotificationPreferences().appearance,
      modules: {
        system: { enabled: false, minLevel: "error", raiseWindow: "never" },
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.modules.system.enabled).toBe(false);
      expect(result.value.modules.telephony).toEqual(DEFAULT_MODULE_PREFERENCES);
      expect(result.value.modules.sdk).toEqual(DEFAULT_MODULE_PREFERENCES);
    }
  });

  it("rejects unknown module keys in strict parse", () => {
    const defaults = createDefaultUserNotificationPreferences();
    const result = parseUserNotificationPreferences({
      ...defaults,
      modules: {
        ...defaults.modules,
        ghost: DEFAULT_MODULE_PREFERENCES,
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("notificationPreferences.modules.ghost_unknown");
    }
  });

  it("migrates flat schema fields into nested preferences without behavior change", () => {
    const prefs = coerceUserNotificationPreferencesFromRecord({
      notificationPlacement: "top-left",
      notificationStacking: "single",
      notificationDurationMs: 6500,
      notificationClosable: false,
      notificationMaxVisible: 1,
      notificationPopupEnabled: false,
    });
    expect(prefs.masterInAppPopupEnabled).toBe(false);
    expect(prefs.appearance).toEqual({
      placement: "top-left",
      stacking: "single",
      durationMs: 6500,
      closable: false,
      maxVisible: 1,
    });
    for (const module of USER_NOTIFICATION_MODULES) {
      expect(prefs.modules[module]).toEqual(DEFAULT_MODULE_PREFERENCES);
    }
  });

  it("strips unknown modules during migration coerce", () => {
    const prefs = coerceUserNotificationPreferencesFromRecord({
      notificationPreferences: {
        masterInAppPopupEnabled: true,
        appearance: createDefaultUserNotificationPreferences().appearance,
        modules: {
          system: { enabled: false, minLevel: "warning", raiseWindow: "never" },
          ghost: DEFAULT_MODULE_PREFERENCES,
        },
      },
    });
    expect(prefs.modules.system.enabled).toBe(false);
    expect(
      (prefs.modules as Readonly<Record<string, unknown>>)["ghost"],
    ).toBeUndefined();
    expect(prefs.modules.media).toEqual(DEFAULT_MODULE_PREFERENCES);
  });
});
