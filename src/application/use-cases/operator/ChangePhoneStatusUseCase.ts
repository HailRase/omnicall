import {
  createPhoneStatusChangedEvent,
  isPhoneStatus,
  type PhoneStatus,
} from "@domain/index.js";
import type { DomainEventPublisher } from "@ports/index.js";
import type { Logger } from "@ports/index.js";
import type { SettingsRepository } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

export type ChangePhoneStatusInput = Readonly<{
  nextStatus: PhoneStatus;
  correlationId?: CorrelationId;
}>;

export class ChangePhoneStatusUseCase {
  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: ChangePhoneStatusInput,
  ): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();

    if (!isPhoneStatus(input.nextStatus)) {
      return err(
        createPlatformError(
          "validation_failed",
          "Invalid phone status",
        ),
      );
    }

    const previousStatus = await this.settingsRepository.getPhoneStatus();

    if (previousStatus === input.nextStatus) {
      return ok(undefined);
    }

    await this.settingsRepository.setPhoneStatus(input.nextStatus);

    this.eventPublisher.publish(
      createPhoneStatusChangedEvent(correlationId, {
        previousStatus,
        nextStatus: input.nextStatus,
      }),
    );

    this.logger.info("phone_status_changed", {
      correlationId,
      featureId: "F-001",
      boundedContext: "Telephony",
      operation: "change_phone_status",
      previousState: previousStatus,
      nextState: input.nextStatus,
      result: "succeeded",
    });

    return ok(undefined);
  }
}
