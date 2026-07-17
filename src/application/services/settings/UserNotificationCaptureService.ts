import type { UserNotificationJournalEntry } from "@domain/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import { isErr, ok } from "@shared/result/index.js";
import type {
  RecordUserNotificationInput,
  RecordUserNotificationUseCase,
} from "../../use-cases/settings/RecordUserNotificationUseCase.js";

export type UserNotificationCaptureInput = Readonly<{
  notification: RecordUserNotificationInput;
  popupEnabled: boolean;
}>;

export type UserNotificationCaptureOutcome = Readonly<{
  entry: UserNotificationJournalEntry;
  shouldPresentPopup: boolean;
}>;

export class UserNotificationCaptureService {
  constructor(
    private readonly recordNotification: RecordUserNotificationUseCase,
  ) {}

  async capture(
    input: UserNotificationCaptureInput,
  ): Promise<Result<UserNotificationCaptureOutcome, PlatformError>> {
    const recorded = await this.recordNotification.execute({
      ...input.notification,
      suppressedAtEmission: !input.popupEnabled,
    });
    if (isErr(recorded)) {
      return recorded;
    }
    return ok({
      entry: recorded.value,
      shouldPresentPopup: input.popupEnabled,
    });
  }
}
