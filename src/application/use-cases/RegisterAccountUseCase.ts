import {
  createRegistrationFailedEvent,
  createRegistrationRequestedEvent,
  createRegistrationSucceededEvent,
} from "@domain/index.js";
import type { SipAccount } from "@domain/index.js";
import type { DomainEventPublisher } from "@ports/index.js";
import type { Logger } from "@ports/index.js";
import type { TelephonyGateway } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import { err, isErr, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";

export type RegisterAccountInput = Readonly<{
  account: SipAccount;
  correlationId?: CorrelationId;
}>;

export class RegisterAccountUseCase {
  constructor(
    private readonly telephonyGateway: TelephonyGateway,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: RegisterAccountInput,
  ): Promise<Result<void, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();

    this.eventPublisher.publish(
      createRegistrationRequestedEvent(correlationId, {
        accountId: input.account.id,
      }),
    );

    this.logger.info("registration_requested", {
      correlationId,
      featureId: "F-001",
      boundedContext: "Telephony",
      operation: "register_account",
      previousState: "idle",
      nextState: "registering",
    });

    try {
      const gatewayResult = await this.telephonyGateway.register({
        account: input.account,
        correlationId,
      });

      if (isErr(gatewayResult)) {
        this.eventPublisher.publish(
          createRegistrationFailedEvent(correlationId, {
            accountId: input.account.id,
            reason: gatewayResult.error.message,
          }),
        );

        this.logger.error("registration_failed", {
          correlationId,
          featureId: "F-001",
          boundedContext: "Telephony",
          operation: "register_account",
          previousState: "registering",
          nextState: "failed",
          result: gatewayResult.error.code,
        });

        return gatewayResult;
      }

      this.eventPublisher.publish(
        createRegistrationSucceededEvent(correlationId, {
          accountId: input.account.id,
        }),
      );

      this.logger.info("registration_succeeded", {
        correlationId,
        featureId: "F-001",
        boundedContext: "Telephony",
        operation: "register_account",
        previousState: "registering",
        nextState: "registered",
        result: "succeeded",
      });

      return ok(undefined);
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);

      this.eventPublisher.publish(
        createRegistrationFailedEvent(correlationId, {
          accountId: input.account.id,
          reason: normalized.message,
        }),
      );

      this.logger.error(
        "registration_failed",
        {
          correlationId,
          featureId: "F-001",
          boundedContext: "Telephony",
          operation: "register_account",
          result: "error",
        },
        error,
      );

      return err(normalized);
    }
  }
}
