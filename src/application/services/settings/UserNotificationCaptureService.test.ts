import { describe, expect, it } from "vitest";
import { InMemoryUserNotificationJournalRepository } from "@adapters/settings/InMemoryUserNotificationJournalRepository.js";
import { createSettingsAccountKey } from "@domain/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { RecordUserNotificationUseCase } from "../../use-cases/settings/RecordUserNotificationUseCase.js";
import { QueryUserNotificationJournalUseCase } from "../../use-cases/settings/QueryUserNotificationJournalUseCase.js";
import { UserNotificationCaptureService } from "./UserNotificationCaptureService.js";

describe("UserNotificationCaptureService", () => {
  it("always records and marks notification suppressed when popup is disabled", async () => {
    const repository = new InMemoryUserNotificationJournalRepository();
    const service = new UserNotificationCaptureService(
      new RecordUserNotificationUseCase(repository, createTestLogger()),
    );

    const result = await service.capture({
      popupEnabled: false,
      notification: {
        accountKey: createSettingsAccountKey("agent@pbx.example"),
        accountDisplayLabel: "agent",
        level: "error",
        module: "account",
        functionId: "account.sign_in",
        titleKey: "account.error.authorizationFailed",
        titleParams: { username: "agent", apiKey: "must-not-persist" },
        titleSnapshot: "Authorization failed token=must-not-persist",
        suppressedAtEmission: false,
        correlationId: "corr-1",
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.shouldPresentPopup).toBe(false);
      expect(result.value.entry.suppressedAtEmission).toBe(true);
      expect(result.value.entry.titleParams).toEqual({ username: "agent" });
      expect(result.value.entry.titleSnapshot).not.toContain("must-not-persist");
    }
    expect(await repository.listEntries()).toHaveLength(1);
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
