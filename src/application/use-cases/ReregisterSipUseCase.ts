import type { SipAccountId } from "@domain/index.js";
import {
  createManualSipReregisterRequestedEvent,
  createRegistrationFailedEvent,
  createRegistrationRequestedEvent,
  createRegistrationSucceededEvent,
  mapSipRegistrationFailureKey,
} from "@domain/index.js";
import type { DomainEventPublisher } from "@ports/index.js";
import type { Logger } from "@ports/index.js";
import type { TelephonyGateway } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import { err, isErr, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

const FEATURE_ID = "F-014";

export type ReregisterSipInput = Readonly<{
  correlationId?: CorrelationId;
  accountId?: SipAccountId;
}>;

/**
 * - Purpose: manual or orchestrated SIP REGISTER retry on live transport (LF-010).
 * - Inputs: optional correlation id and account id for success event.
 * - Outputs: gateway reregister result; registration domain events.
 */
export class ReregisterSipUseCase {
  constructor(
    private readonly telephonyGateway: TelephonyGateway,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(input: ReregisterSipInput = {}): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();

    this.eventPublisher.publish(createManualSipReregisterRequestedEvent(correlationId));
    this.eventPublisher.publish(
      createRegistrationRequestedEvent(correlationId, {
        accountId: input.accountId ?? ("manual-reregister" as SipAccountId),
      }),
    );

    this.logger.info("sip_reregister_requested", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Telephony",
      operation: "sip_reregister",
      previousState: "registration_failed",
      nextState: "registering",
    });

    try {
      const gatewayResult = await this.telephonyGateway.reregister(correlationId);

      if (isErr(gatewayResult)) {
        const reason = mapSipRegistrationFailureKey(gatewayResult.error.message);
        this.eventPublisher.publish(
          createRegistrationFailedEvent(correlationId, {
            accountId: input.accountId ?? ("manual-reregister" as SipAccountId),
            reason,
          }),
        );

        this.logger.error("sip_reregister_failed", {
          correlationId,
          featureId: FEATURE_ID,
          boundedContext: "Telephony",
          operation: "sip_reregister",
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

      this.logger.info("sip_reregister_succeeded", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation: "sip_reregister",
        result: "succeeded",
      });

      return ok(undefined);
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      const reason = mapSipRegistrationFailureKey(normalized.message);

      this.eventPublisher.publish(
        createRegistrationFailedEvent(correlationId, {
          accountId: input.accountId ?? ("manual-reregister" as SipAccountId),
          reason,
        }),
      );

      this.logger.error(
        "sip_reregister_failed",
        {
          correlationId,
          featureId: FEATURE_ID,
          boundedContext: "Telephony",
          operation: "sip_reregister",
          result: normalized.code,
        },
        error,
      );

      return err(createPlatformError(normalized.code, normalized.message));
    }
  }
}
