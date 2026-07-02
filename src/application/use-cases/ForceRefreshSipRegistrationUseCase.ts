import type { SipAccountId } from "@domain/index.js";
import {
  createRegistrationFailedEvent,
  createRegistrationRequestedEvent,
  createRegistrationSucceededEvent,
  mapSipRegistrationFailureKey,
} from "@domain/index.js";
import type { DomainEventPublisher, Logger, TelephonyGateway } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, isErr, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";

const FEATURE_ID = "F-014";

export type ForceRefreshSipRegistrationInput = Readonly<{
  correlationId?: CorrelationId;
  accountId?: SipAccountId;
}>;

/**
 * - Purpose: proactive SIP registration refresh via unregister-all + register (ADR-0004 §1.6).
 * - Inputs: optional correlation id and account id for success event.
 * - Outputs: gateway forceRefreshRegistration result; registration domain events.
 */
export class ForceRefreshSipRegistrationUseCase {
  constructor(
    private readonly telephonyGateway: TelephonyGateway,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: ForceRefreshSipRegistrationInput = {},
  ): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();

    this.eventPublisher.publish(
      createRegistrationRequestedEvent(correlationId, {
        accountId: input.accountId ?? ("force-refresh" as SipAccountId),
      }),
    );

    this.logger.info("sip_force_refresh_requested", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Telephony",
      operation: "sip_force_refresh",
      previousState: "registered",
      nextState: "registering",
    });

    try {
      const gatewayResult = await this.telephonyGateway.forceRefreshRegistration(correlationId);

      if (isErr(gatewayResult)) {
        const reason = mapSipRegistrationFailureKey(gatewayResult.error.message);
        this.eventPublisher.publish(
          createRegistrationFailedEvent(correlationId, {
            accountId: input.accountId ?? ("force-refresh" as SipAccountId),
            reason,
          }),
        );

        this.logger.error("sip_force_refresh_failed", {
          correlationId,
          featureId: FEATURE_ID,
          boundedContext: "Telephony",
          operation: "sip_force_refresh",
          result: gatewayResult.error.code,
          reason,
        });

        return gatewayResult;
      }

      if (input.accountId !== undefined) {
        this.eventPublisher.publish(
          createRegistrationSucceededEvent(correlationId, {
            accountId: input.accountId,
          }),
        );
      }

      this.logger.info("sip_force_refresh_succeeded", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation: "sip_force_refresh",
        result: "succeeded",
      });

      return ok(undefined);
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      const reason = mapSipRegistrationFailureKey(normalized.message);

      this.eventPublisher.publish(
        createRegistrationFailedEvent(correlationId, {
          accountId: input.accountId ?? ("force-refresh" as SipAccountId),
          reason,
        }),
      );

      this.logger.error(
        "sip_force_refresh_failed",
        {
          correlationId,
          featureId: FEATURE_ID,
          boundedContext: "Telephony",
          operation: "sip_force_refresh",
          result: normalized.code,
        },
        error,
      );

      return err(createPlatformError(normalized.code, normalized.message));
    }
  }
}
