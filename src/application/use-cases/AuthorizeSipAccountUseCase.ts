import {
  createSipAccount,
  createSipAccountId,
  createSipCredentialsReceivedEvent,
  validateSipAccountInput,
  type SipAccountInput,
} from "@domain/index.js";
import type { DomainEventPublisher } from "@ports/index.js";
import type { Logger } from "@ports/index.js";
import type { SettingsRepository } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { SipAccount } from "@domain/index.js";

export type AuthorizeSipAccountInput = Readonly<{
  account: SipAccountInput;
  correlationId?: CorrelationId;
  source?: "ocp" | "manual";
}>;

export class AuthorizeSipAccountUseCase {
  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: AuthorizeSipAccountInput,
  ): Promise<Result<SipAccount, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const validationErrors = validateSipAccountInput(input.account);

    if (validationErrors.length > 0) {
      const message =
        validationErrors.includes("username_required")
          ? "Access denied: username is required"
          : "Invalid SIP account input";

      this.logger.warn("sip_authorization_rejected", {
        correlationId,
        featureId: "F-001",
        boundedContext: "Telephony",
        operation: "authorize_sip_account",
        result: validationErrors.join(","),
      });

      return err(createPlatformError("validation_failed", message, validationErrors));
    }

    const account = createSipAccount(
      createSipAccountId(input.account.username),
      input.account,
    );

    await this.settingsRepository.saveSipAccount(account);

    this.eventPublisher.publish(
      createSipCredentialsReceivedEvent(correlationId, {
        credentials: input.account,
        source: input.source ?? "manual",
      }),
    );

    this.logger.info("sip_account_authorized", {
      correlationId,
      featureId: "F-001",
      boundedContext: "Telephony",
      operation: "authorize_sip_account",
      result: "succeeded",
    });

    return ok(account);
  }
}
