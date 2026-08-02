import {
  createUserNotificationJournalEntryId,
  sanitizeUserNotificationText,
  sanitizeUserNotificationTitleParams,
  type NotificationSuppressReason,
  type SettingsAccountKey,
  type UserNotificationJournalEntry,
  type UserNotificationLevel,
  type UserNotificationModule,
  type UserNotificationTitleParam,
} from "@domain/index.js";
import type { Logger, UserNotificationJournalRepository } from "@ports/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import { err, ok } from "@shared/result/index.js";

let notificationSequence = 0;

export type RecordUserNotificationInput = Readonly<{
  id?: string;
  emittedAt?: string;
  accountKey: SettingsAccountKey;
  accountDisplayLabel: string;
  level: UserNotificationLevel;
  module: UserNotificationModule;
  functionId: string;
  titleKey?: string | null;
  titleParams?: Readonly<Record<string, UserNotificationTitleParam>>;
  titleSnapshot: string;
  suppressedAtEmission: boolean;
  suppressReasons?: ReadonlyArray<NotificationSuppressReason>;
  correlationId?: string | null;
}>;

export type RecordUserNotificationResult = Readonly<{
  entry: UserNotificationJournalEntry;
  persisted: boolean;
}>;

/**
 * - Purpose: sanitize and append a user notification journal entry.
 * - Inputs: capture payload including suppress metadata.
 * - Outputs: entry always when valid; `persisted` false if disk/append fails.
 */
export class RecordUserNotificationUseCase {
  constructor(
    private readonly repository: UserNotificationJournalRepository,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: RecordUserNotificationInput,
  ): Promise<Result<RecordUserNotificationResult, PlatformError>> {
    const emittedAt = input.emittedAt ?? new Date().toISOString();
    const id = createUserNotificationJournalEntryId(
      input.id ?? createNotificationId(emittedAt),
    );
    if (id === null || !Number.isFinite(Date.parse(emittedAt))) {
      return err(
        createPlatformError("validation_failed", "invalid_notification_identity"),
      );
    }
    const entry: UserNotificationJournalEntry = {
      id,
      emittedAt,
      accountKey: input.accountKey,
      accountDisplayLabel: sanitizeUserNotificationText(
        input.accountDisplayLabel,
      ),
      level: input.level,
      module: input.module,
      functionId: sanitizeUserNotificationText(input.functionId),
      titleKey: input.titleKey ?? null,
      titleParams: sanitizeUserNotificationTitleParams(input.titleParams ?? {}),
      titleSnapshot: sanitizeUserNotificationText(input.titleSnapshot),
      suppressedAtEmission: input.suppressedAtEmission,
      suppressReasons: input.suppressReasons ?? [],
      correlationId: input.correlationId ?? null,
    };
    try {
      await this.repository.appendEntry(entry, Date.now());
      return ok({ entry, persisted: true });
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.logger.error(
        "user_notification_record_failed",
        {
          featureId: "F-029",
          boundedContext: "Settings",
          operation: "record_user_notification",
          result: normalized.message,
        },
        normalized,
      );
      return ok({ entry, persisted: false });
    }
  }
}

function createNotificationId(emittedAt: string): string {
  notificationSequence += 1;
  return `notification-${Date.parse(emittedAt)}-${notificationSequence}`;
}
