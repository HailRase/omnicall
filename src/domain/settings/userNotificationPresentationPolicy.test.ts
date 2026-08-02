import { describe, expect, it } from "vitest";
import { createDefaultUserNotificationPreferences } from "./UserNotificationPreferences.js";
import type { UserNotificationPreferences } from "./userNotificationPreferencesTypes.js";
import {
  evaluateNotificationPresentationPolicy,
  type NotificationInterruptClass,
} from "./userNotificationPresentationPolicy.js";

function withPrefs(
  mutate: (prefs: UserNotificationPreferences) => UserNotificationPreferences,
): UserNotificationPreferences {
  return mutate(createDefaultUserNotificationPreferences());
}

describe("evaluateNotificationPresentationPolicy", () => {
  it("presents informational toast under default preferences", () => {
    const decision = evaluateNotificationPresentationPolicy({
      level: "info",
      module: "telephony",
      interruptClass: "informational",
      preferences: createDefaultUserNotificationPreferences(),
    });
    expect(decision.shouldPresentPopup).toBe(true);
    expect(decision.shouldRaiseWindow).toBe(false);
    expect(decision.suppressReasons).toContain("raise_not_enabled");
    expect(decision.suppressReasons).toContain("raise_level_too_low");
    expect(decision.suppressReasons).toContain("raise_interrupt_denied");
  });

  it("suppresses popup when master is off and still journals via caller", () => {
    const decision = evaluateNotificationPresentationPolicy({
      level: "success",
      module: "account",
      interruptClass: "informational",
      preferences: withPrefs((prefs) => ({
        ...prefs,
        masterInAppPopupEnabled: false,
      })),
    });
    expect(decision.shouldPresentPopup).toBe(false);
    expect(decision.suppressReasons).toContain("master_popup_disabled");
  });

  it("suppresses popup when module is disabled", () => {
    const decision = evaluateNotificationPresentationPolicy({
      level: "error",
      module: "contacts",
      interruptClass: "actionable",
      preferences: withPrefs((prefs) => ({
        ...prefs,
        modules: {
          ...prefs.modules,
          contacts: { ...prefs.modules.contacts, enabled: false },
        },
      })),
    });
    expect(decision.shouldPresentPopup).toBe(false);
    expect(decision.suppressReasons).toContain("module_disabled");
    expect(decision.shouldRaiseWindow).toBe(false);
  });

  it("suppresses popup below module minLevel", () => {
    const decision = evaluateNotificationPresentationPolicy({
      level: "success",
      module: "history",
      interruptClass: "informational",
      preferences: withPrefs((prefs) => ({
        ...prefs,
        modules: {
          ...prefs.modules,
          history: { ...prefs.modules.history, minLevel: "warning" },
        },
      })),
    });
    expect(decision.shouldPresentPopup).toBe(false);
    expect(decision.suppressReasons).toContain("below_min_level");
  });

  it("allows warning at minLevel warning", () => {
    const decision = evaluateNotificationPresentationPolicy({
      level: "warning",
      module: "history",
      interruptClass: "informational",
      preferences: withPrefs((prefs) => ({
        ...prefs,
        modules: {
          ...prefs.modules,
          history: { ...prefs.modules.history, minLevel: "warning" },
        },
      })),
    });
    expect(decision.shouldPresentPopup).toBe(true);
  });

  it("never presents critical through toast pipeline", () => {
    const decision = evaluateNotificationPresentationPolicy({
      level: "error",
      module: "telephony",
      interruptClass: "critical",
      preferences: createDefaultUserNotificationPreferences(),
    });
    expect(decision.shouldPresentPopup).toBe(false);
    expect(decision.suppressReasons).toContain("interrupt_not_toast");
    expect(decision.shouldRaiseWindow).toBe(false);
  });

  it("computes raise for errors_only actionable warning even when master popup off", () => {
    const decision = evaluateNotificationPresentationPolicy({
      level: "warning",
      module: "headset",
      interruptClass: "actionable",
      preferences: withPrefs((prefs) => ({
        ...prefs,
        masterInAppPopupEnabled: false,
        modules: {
          ...prefs.modules,
          headset: {
            enabled: true,
            minLevel: "info",
            raiseWindow: "errors_only",
          },
        },
      })),
    });
    expect(decision.shouldPresentPopup).toBe(false);
    expect(decision.shouldRaiseWindow).toBe(true);
    expect(decision.suppressReasons).toContain("master_popup_disabled");
    expect(decision.suppressReasons).not.toContain("raise_not_enabled");
  });

  it.each([
    ["informational", false],
    ["remote", false],
    ["critical", false],
    ["actionable", true],
  ] as const)(
    "raise interruptClass %s → shouldRaiseWindow %s",
    (interruptClass: NotificationInterruptClass, expectedRaise: boolean) => {
      const decision = evaluateNotificationPresentationPolicy({
        level: "error",
        module: "settings",
        interruptClass,
        preferences: withPrefs((prefs) => ({
          ...prefs,
          modules: {
            ...prefs.modules,
            settings: {
              enabled: true,
              minLevel: "info",
              raiseWindow: "errors_only",
            },
          },
        })),
      });
      expect(decision.shouldRaiseWindow).toBe(expectedRaise);
    },
  );
});
