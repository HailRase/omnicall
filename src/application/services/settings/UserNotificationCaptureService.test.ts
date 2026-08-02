import { describe, expect, it } from "vitest";
import { InMemoryUserNotificationJournalRepository } from "@adapters/settings/InMemoryUserNotificationJournalRepository.js";
import {
  createDefaultUserNotificationPreferences,
  createSettingsAccountKey,
} from "@domain/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { RecordUserNotificationUseCase } from "../../use-cases/settings/RecordUserNotificationUseCase.js";
import { QueryUserNotificationJournalUseCase } from "../../use-cases/settings/QueryUserNotificationJournalUseCase.js";
import {
  NOTIFICATION_ACTIONABLE_RAISE_PRODUCT_ENABLED,
  UserNotificationCaptureService,
} from "./UserNotificationCaptureService.js";

function createService(): UserNotificationCaptureService {
  return new UserNotificationCaptureService(
    new RecordUserNotificationUseCase(
      new InMemoryUserNotificationJournalRepository(),
      createTestLogger(),
    ),
  );
}

describe("UserNotificationCaptureService", () => {
  it("always records and suppresses popup from preferences when master is off", async () => {
    const repository = new InMemoryUserNotificationJournalRepository();
    const service = new UserNotificationCaptureService(
      new RecordUserNotificationUseCase(repository, createTestLogger()),
    );
    const preferences = {
      ...createDefaultUserNotificationPreferences(),
      masterInAppPopupEnabled: false,
    };

    const result = await service.capture({
      popupEnabled: true,
      preferences,
      interruptClass: "informational",
      notification: {
        accountKey: createSettingsAccountKey("agent@pbx.example"),
        accountDisplayLabel: "agent",
        level: "error",
        module: "account",
        functionId: "account.sign_in",
        titleKey: "account.error.authorizationFailed",
        titleParams: { username: "agent", apiKey: "must-not-persist" },
        titleSnapshot: "Authorization failed token=must-not-persist",
        correlationId: "corr-1",
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.shouldPresentPopup).toBe(false);
      expect(result.value.shouldRaiseWindow).toBe(false);
      expect(result.value.suppressReasons).toContain("master_popup_disabled");
      expect(result.value.entry.suppressedAtEmission).toBe(true);
      expect(result.value.entry.titleParams).toEqual({ username: "agent" });
      expect(result.value.entry.titleSnapshot).not.toContain("must-not-persist");
    }
    expect(await repository.listEntries()).toHaveLength(1);
  });

  it("ignores caller popupEnabled when preferences allow presentation", async () => {
    const service = createService();
    const result = await service.capture({
      popupEnabled: false,
      preferences: createDefaultUserNotificationPreferences(),
      notification: {
        accountKey: createSettingsAccountKey("agent@pbx.example"),
        accountDisplayLabel: "agent",
        level: "info",
        module: "system",
        functionId: "renderer.notification",
        titleSnapshot: "Hello",
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.shouldPresentPopup).toBe(true);
      expect(result.value.entry.suppressedAtEmission).toBe(false);
    }
  });

  it("suppresses by module minLevel and keeps journal entry", async () => {
    const repository = new InMemoryUserNotificationJournalRepository();
    const service = new UserNotificationCaptureService(
      new RecordUserNotificationUseCase(repository, createTestLogger()),
    );
    const defaults = createDefaultUserNotificationPreferences();
    const result = await service.capture({
      preferences: {
        ...defaults,
        modules: {
          ...defaults.modules,
          ocp: { ...defaults.modules.ocp, minLevel: "error" },
        },
      },
      interruptClass: "remote",
      notification: {
        accountKey: createSettingsAccountKey("agent@pbx.example"),
        accountDisplayLabel: "agent",
        level: "warning",
        module: "ocp",
        functionId: "ocp.notification",
        titleSnapshot: "OCP warning",
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.shouldPresentPopup).toBe(false);
      expect(result.value.suppressReasons).toContain("below_min_level");
      expect(result.value.entry.suppressedAtEmission).toBe(true);
    }
    expect(await repository.listEntries()).toHaveLength(1);
  });

  it("forwards shouldRaiseWindow when product raise is enabled and policy raises", async () => {
    expect(NOTIFICATION_ACTIONABLE_RAISE_PRODUCT_ENABLED).toBe(true);
    const defaults = createDefaultUserNotificationPreferences();
    const service = createService();
    const result = await service.capture({
      preferences: {
        ...defaults,
        modules: {
          ...defaults.modules,
          headset: {
            enabled: true,
            minLevel: "info",
            raiseWindow: "errors_only",
          },
        },
      },
      interruptClass: "actionable",
      notification: {
        accountKey: createSettingsAccountKey("agent@pbx.example"),
        accountDisplayLabel: "agent",
        level: "error",
        module: "headset",
        functionId: "headset.fault",
        titleSnapshot: "Headset fault",
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.shouldPresentPopup).toBe(true);
      expect(result.value.shouldRaiseWindow).toBe(true);
    }
  });

  it("keeps shouldRaiseWindow false for default never raise prefs", async () => {
    const service = createService();
    const result = await service.capture({
      preferences: createDefaultUserNotificationPreferences(),
      interruptClass: "actionable",
      notification: {
        accountKey: createSettingsAccountKey("agent@pbx.example"),
        accountDisplayLabel: "agent",
        level: "error",
        module: "headset",
        functionId: "headset.fault",
        titleSnapshot: "Headset fault",
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.shouldRaiseWindow).toBe(false);
    }
  });

  it("queries by identity, module, title and page", async () => {
    const repository = new InMemoryUserNotificationJournalRepository();
    const recorder = new RecordUserNotificationUseCase(
      repository,
      createTestLogger(),
    );
    const accountKey = createSettingsAccountKey("agent@pbx.example");
    for (const [index, title] of ["Alpha", "Beta", "Alpha two"].entries()) {
      await recorder.execute({
        id: `n-${index}`,
        emittedAt: new Date(Date.now() - index).toISOString(),
        accountKey,
        accountDisplayLabel: "agent",
        level: "info",
        module: index === 1 ? "ocp" : "account",
        functionId: "test",
        titleSnapshot: title,
        suppressedAtEmission: false,
      });
    }
    const query = new QueryUserNotificationJournalUseCase(repository);

    const result = await query.execute({
      accountKey,
      module: "account",
      search: "alpha",
      page: 1,
      pageSize: 1,
    });
    expect(result.total).toBe(2);
    expect(result.entries).toHaveLength(1);
    expect(result.pageCount).toBe(2);
  });
});
