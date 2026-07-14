import {
  createAccessDeniedDetectedEvent,
  createManualSipAuthorizationRequestedEvent,
  createSipAccount,
  createSipAccountId,
  createSipCredentialsReceivedEvent,
  resolveSettingsAccountKeyFromSipAccount,
  validateSipAccountInput,
  type SipAccountInput,
} from "@domain/index.js";
import type { DomainEventPublisher } from "@ports/index.js";
import type { Logger } from "@ports/index.js";
import type { SettingsRepository } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { SipAccount } from "@domain/index.js";
import { loadUserSettingsWithLegacyMigration } from "../../settings/loadUserSettingsWithLegacyMigration.js";

export type AuthorizeSipAccountInput = Readonly<{
  account: SipAccountInput;
  correlationId?: CorrelationId;
  source?: "manual" | "ocp";
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
    const source = input.source ?? "manual";

    if (source === "manual") {
      this.eventPublisher.publish(
        createManualSipAuthorizationRequestedEvent(correlationId, {
          account: input.account,
        }),
      );
    }

    const validationErrors = validateSipAccountInput(input.account);

    if (validationErrors.length > 0) {
      const message =
        validationErrors.includes("username_required")
          ? "Access denied: username is required"
          : "Invalid SIP account input";

      this.eventPublisher.publish(
        createAccessDeniedDetectedEvent(correlationId, {
          source,
          reason: message,
        }),
      );

      this.logger.warn("sip_authorization_rejected", {
        correlationId,
        featureId: "F-001",
        boundedContext: "Telephony",
        operation: "authorize_sip_account",
        result: validationErrors.join(","),
        source,
      });

      return err(createPlatformError("validation_failed", message, validationErrors));
    }

    const account = createSipAccount(
      createSipAccountId(input.account.username),
      input.account,
    );
    const profileKey = resolveSettingsAccountKeyFromSipAccount(account);

    try {
      await this.settingsRepository.saveSipAccount(account);
      await this.settingsRepository.setActiveProfileKey(profileKey);
      await loadUserSettingsWithLegacyMigration({
        settingsRepository: this.settingsRepository,
        compositeAccountKey: profileKey,
        identity: {
          username: account.username,
          domain: account.domain,
          server: account.server,
        },
        logger: this.logger,
      });
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.logger.warn("sip_authorization_settings_persistence_failed", {
        correlationId,
        featureId: "F-023",
        boundedContext: "Settings",
        operation: "authorize_sip_account",
        result: normalized.message,
      });
      return err(
        createPlatformError(
          "operation_failed",
          "Failed to persist account profile settings",
          normalized,
        ),
      );
    }

    // OCP path: never put SIP password into Domain Events (F-028 AC).
    const eventCredentials =
      source === "ocp"
        ? {
            username: input.account.username,
            password: "",
            domain: input.account.domain,
            server: input.account.server,
          }
        : input.account;

    this.eventPublisher.publish(
      createSipCredentialsReceivedEvent(correlationId, {
        credentials: eventCredentials,
        source,
      }),
    );

    this.logger.info("sip_account_authorized", {
      correlationId,
      featureId: "F-001",
      boundedContext: "Telephony",
      operation: "authorize_sip_account",
      result: "succeeded",
      profileKey,
    });

    return ok(account);
  }
}
