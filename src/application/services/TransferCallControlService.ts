import type { Call, CallId } from "@domain/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import {
  completeConsultationWhenAnswered as promoteConsultationWhenAnswered,
  executeAttendedTransfer,
  executeStartConsultation,
} from "./attendedTransferOperations.js";
import { executeBlindTransfer } from "./transferCallControlOperations.js";
import { executeCancelTransfer, executeStartTransferMode } from "./transferModeOperations.js";
import type {
  AttendedTransferInput,
  BlindTransferInput,
  CancelTransferInput,
  StartConsultationInput,
  StartTransferModeInput,
  TransferCallControlDeps,
} from "./transferCallControlTypes.js";

export type {
  AttendedTransferInput,
  BlindTransferInput,
  CancelTransferInput,
  StartConsultationInput,
  StartTransferModeInput,
} from "./transferCallControlTypes.js";

/**
 * - Purpose: delegate blind and attended transfer operations to control handlers.
 * - Inputs: gateway deps, call tracking callbacks, transfer command inputs.
 * - Outputs: call snapshot or normalized platform error.
 */
export class TransferCallControlService {
  constructor(private readonly deps: TransferCallControlDeps) {}

  blindTransfer(input: BlindTransferInput): Promise<Result<Call, PlatformError>> {
    return executeBlindTransfer(this.deps, input);
  }

  startConsultation(input: StartConsultationInput): Promise<Result<Call, PlatformError>> {
    return executeStartConsultation(this.deps, input);
  }

  completeConsultationWhenAnswered(
    consultationCallId: CallId,
    correlationId: CorrelationId,
  ): void {
    promoteConsultationWhenAnswered(this.deps, consultationCallId, correlationId);
  }
  attendedTransfer(input: AttendedTransferInput): Promise<Result<Call, PlatformError>> {
    return executeAttendedTransfer(this.deps, input);
  }

  startTransferMode(input: StartTransferModeInput): Result<void, PlatformError> {
    return executeStartTransferMode(this.deps, input);
  }

  cancelTransfer(input: CancelTransferInput): Promise<Result<void, PlatformError>> {
    return executeCancelTransfer(this.deps, input);
  }
}
