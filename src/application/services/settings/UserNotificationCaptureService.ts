import type {
  NotificationInterruptClass,
  NotificationSuppressReason,
  UserNotificationJournalEntry,
  UserNotificationPreferences,
} from "@domain/index.js";
import { evaluateNotificationPresentationPolicy } from "@domain/index.js";
import type { Logger } from "@ports/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import { isErr, ok } from "@shared/result/index.js";
import type {
  RecordUserNotificationInput,
  RecordUserNotificationUseCase,
} from "../../use-cases/settings/RecordUserNotificationUseCase.js";

/**
 * WU-08: product may request ADR-0013 `notification_actionable` raise when
 * Domain policy sets `shouldRaiseWindow` (defaults remain `never` / no raise).
 */
export const NOTIFICATION_ACTIONABLE_RAISE_PRODUCT_ENABLED = true;

export type UserNotificationCaptureNotificationInput = Omit<
  RecordUserNotificationInput,
  "suppressedAtEmission" | "suppressReasons"
>;

export type UserNotificationCaptureInput = Readonly<{
  notification: UserNotificationCaptureNotificationInput;
  preferences: UserNotificationPreferences;
  interruptClass?: NotificationInterruptClass;
  /**
   * Ignored on the product path. Kept optional for transitional callers/tests.
   * Presentation uses `preferences` via Domain policy.
   */
  popupEnabled?: boolean;
}>;

export type UserNotificationCaptureOutcome = Readonly<{
  entry: UserNotificationJournalEntry;
  journalPersisted: boolean;
  shouldPresentPopup: boolean;
  shouldRaiseWindow: boolean;
  suppressReasons: ReadonlyArray<NotificationSuppressReason>;
}>;

/**
 * - Purpose: single choke-point for journal record + presentation/raise policy.
 * - Inputs: sanitized notification payload, active preferences, interrupt class.
 * - Outputs: journal entry, persist flag, popup/raise decisions, suppress reasons.
 */
export class UserNotificationCaptureService {
  constructor(
    private readonly recordNotification: RecordUserNotificationUseCase,
    private readonly logger: Logger,
  ) {}

  async capture(
    input: UserNotificationCaptureInput,
  ): Promise<Result<UserNotificationCaptureOutcome, PlatformError>> {
    const interruptClass = input.interruptClass ?? "informational";
    const decision = evaluateNotificationPresentationPolicy({
      level: input.notification.level,
      module: input.notification.module,
      interruptClass,
      preferences: input.preferences,
    });
    const shouldRaiseWindow =
      NOTIFICATION_ACTIONABLE_RAISE_PRODUCT_ENABLED && decision.shouldRaiseWindow;
    const recorded = await this.recordNotification.execute({
      ...input.notification,
      suppressedAtEmission: !decision.shouldPresentPopup,
      suppressReasons: decision.suppressReasons,
    });
    if (isErr(recorded)) {
      this.logger.error("capture_user_notification", {
        featureId: "F-034",
        boundedContext: "Settings",
        operation: "capture_user_notification",
        module: input.notification.module,
        functionId: input.notification.functionId,
        level: input.notification.level,
        interruptClass,
        result: "validation_failed",
      });
      return recorded;
    }

    const journalPersisted = recorded.value.persisted;
    this.logger.info("capture_user_notification", {
      featureId: "F-034",
      boundedContext: "Settings",
      operation: "capture_user_notification",
      module: input.notification.module,
      functionId: input.notification.functionId,
      level: input.notification.level,
      interruptClass,
      shouldPresentPopup: decision.shouldPresentPopup,
      shouldRaiseWindow,
      journalPersisted,
      suppressReasons: decision.suppressReasons.join(","),
      result: journalPersisted ? "ok" : "journal_failed",
      ...(input.notification.correlationId
        ? { notificationCorrelationId: input.notification.correlationId }
        : {}),
    });

    return ok({
      entry: recorded.value.entry,
      journalPersisted,
      shouldPresentPopup: decision.shouldPresentPopup,
      shouldRaiseWindow,
      suppressReasons: decision.suppressReasons,
    });
  }
}
