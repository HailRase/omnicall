import type {
  NotificationInterruptClass,
  NotificationSuppressReason,
  UserNotificationJournalEntry,
  UserNotificationPreferences,
} from "@domain/index.js";
import { evaluateNotificationPresentationPolicy } from "@domain/index.js";
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
  "suppressedAtEmission"
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
  shouldPresentPopup: boolean;
  shouldRaiseWindow: boolean;
  suppressReasons: ReadonlyArray<NotificationSuppressReason>;
}>;

export class UserNotificationCaptureService {
  constructor(
    private readonly recordNotification: RecordUserNotificationUseCase,
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
    const recorded = await this.recordNotification.execute({
      ...input.notification,
      suppressedAtEmission: !decision.shouldPresentPopup,
    });
    if (isErr(recorded)) {
      return recorded;
    }
    return ok({
      entry: recorded.value,
      shouldPresentPopup: decision.shouldPresentPopup,
      shouldRaiseWindow:
        NOTIFICATION_ACTIONABLE_RAISE_PRODUCT_ENABLED && decision.shouldRaiseWindow,
      suppressReasons: decision.suppressReasons,
    });
  }
}
