import { validateBreakReason, type Call, type CallId } from "@domain/index.js";
import type { Logger, SettingsRepository } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { CallEngine } from "@application/services/telephony/CallEngine.js";

export type RejectCallInput = Readonly<{
  callId: CallId;
  breakReason?: string;
  correlationId?: CorrelationId;
}>;

export class RejectCallUseCase {
  constructor(
    private readonly callEngine: CallEngine,
    private readonly settingsRepository: SettingsRepository,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: RejectCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const incomingSettings = await this.settingsRepository.getIncomingCallSettings();
    const breakReason = input.breakReason?.trim();

    if (incomingSettings.rejectReasonRequired) {
      const validationErrors = validateBreakReason(
        breakReason ?? "",
        incomingSettings.allowedBreakReasons,
      );
      if (validationErrors.length > 0) {
        return err(
          createPlatformError(
            "validation_failed",
            "Invalid reject reason",
            validationErrors,
          ),
        );
      }
    }

    this.logger.info("incoming_reject_requested", {
      correlationId,
      featureId: "F-002",
      boundedContext: "Telephony",
      operation: "reject_call",
      previousState: "Ringing",
      nextState: "Ended",
      result: breakReason ?? "none",
    });

    if (breakReason !== undefined) {
      return this.callEngine.rejectCall({
        callId: input.callId,
        correlationId,
        breakReason,
      });
    }
    return this.callEngine.rejectCall({
      callId: input.callId,
      correlationId,
    });
  }
}
