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
  /**
   * When false, skip activeProfileKey / settings promotion (ADR-AF-001).
   * Caller must promote after SIP registration succeeds.
   */
  promoteActiveSession?: boolean;
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
    const promoteActiveSession = input.promoteActiveSession !== false;

    if (source === "manual") {
      this.eventPublisher.publish(
        createManualSipAuthorizationRequestedEvent(correlationId, {
          account: toSipCredentialIdentity(input.account),
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

    if (promoteActiveSession) {
      const promoteResult = await this.persistActiveSession(account, profileKey, correlationId);
      if (!promoteResult.ok) {
        return promoteResult;
      }
    }

    this.eventPublisher.publish(
      createSipCredentialsReceivedEvent(correlationId, {
        credentials: toSipCredentialIdentity(input.account),
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
      promoteActiveSession,
    });

    return ok(account);
  }

  private async persistActiveSession(
    account: SipAccount,
    profileKey: ReturnType<typeof resolveSettingsAccountKeyFromSipAccount>,
    correlationId: CorrelationId,
  ): Promise<Result<SipAccount, ReturnType<typeof createPlatformError>>> {
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
      return ok(account);
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
  }
}

function toSipCredentialIdentity(account: SipAccountInput): Readonly<{
  username: string;
  domain: string;
  server: string;
}> {
  return {
    username: account.username,
    domain: account.domain,
    server: account.server,
  };
}
