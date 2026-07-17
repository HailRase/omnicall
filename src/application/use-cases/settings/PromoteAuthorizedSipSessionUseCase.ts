/**
 * - Purpose: promote SIP session/profile on Login (account activation) — ADR-AF-005.
 * - Inputs: authorized SipAccount + optional correlationId.
 * - Outputs: activeProfileKey + settings load + successful-use marker + AccountSessionActivated.
 */

import {
  createAccountSessionActivatedEvent,
  deriveLegacyUsernameOnlySettingsAccountKeyFromIdentity,
  deriveSavedAccountProfileId,
  resolveSettingsAccountKeyFromSipAccount,
  type SipAccount,
} from "@domain/index.js";
import type {
  DomainEventPublisher,
  Logger,
  SavedAccountProfileRepository,
  SettingsRepository,
} from "@ports/index.js";
import type { SecretStoragePort } from "@ports/secrets/SecretStoragePort.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import { loadUserSettingsWithLegacyMigration } from "../../settings/loadUserSettingsWithLegacyMigration.js";
import { migrateProfileScopedSecrets } from "../../services/settings/migrateProfileScopedSecrets.js";

export type PromoteAuthorizedSipSessionInput = Readonly<{
  account: SipAccount;
  correlationId?: CorrelationId;
}>;

export class PromoteAuthorizedSipSessionUseCase {
  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly savedAccountProfileRepository: SavedAccountProfileRepository,
    private readonly secretStoragePort: SecretStoragePort,
    private readonly logger: Logger,
    private readonly eventPublisher?: DomainEventPublisher,
  ) {}

  async execute(
    input: PromoteAuthorizedSipSessionInput,
  ): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const profileKey = resolveSettingsAccountKeyFromSipAccount(input.account);
    const provisionalKey = deriveLegacyUsernameOnlySettingsAccountKeyFromIdentity({
      username: input.account.username,
      domain: input.account.domain,
      server: input.account.server,
    });

    try {
      await this.settingsRepository.saveSipAccount(input.account);
      await this.settingsRepository.setActiveProfileKey(profileKey);
      await loadUserSettingsWithLegacyMigration({
        settingsRepository: this.settingsRepository,
        compositeAccountKey: profileKey,
        identity: {
          username: input.account.username,
          domain: input.account.domain,
          server: input.account.server,
        },
        logger: this.logger,
      });

      await migrateProfileScopedSecrets({
        secretStorage: this.secretStoragePort,
        fromScopeKey: provisionalKey,
        toScopeKey: profileKey,
        logger: this.logger,
        correlationId,
      });

      const savedProfileId = deriveSavedAccountProfileId({
        username: input.account.username,
        domain: input.account.domain,
        server: input.account.server,
      });
      await this.savedAccountProfileRepository.markProfileSuccessful(
        savedProfileId,
        new Date().toISOString(),
      );
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.logger.warn("sip_session_promotion_failed", {
        correlationId,
        featureId: "F-023",
        boundedContext: "Settings",
        operation: "promote_authorized_sip_session",
        result: normalized.message,
        profileKey,
      });
      return err(
        createPlatformError(
          "operation_failed",
          "Failed to promote authorized SIP session",
          normalized,
        ),
      );
    }

    this.eventPublisher?.publish(
      createAccountSessionActivatedEvent(correlationId, { profileKey }),
    );

    this.logger.info("sip_session_promoted", {
      correlationId,
      featureId: "F-001",
      boundedContext: "Settings",
      operation: "promote_authorized_sip_session",
      result: "succeeded",
      profileKey,
    });

    return ok(undefined);
  }
}
