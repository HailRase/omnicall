import {
  createBreakReason,
  validateBreakReason,
  type BreakReason,
} from "@domain/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok, type Result } from "@shared/result/index.js";

export type SelectRejectReasonInput = Readonly<{
  reason: string;
  allowedReasons: ReadonlyArray<BreakReason>;
}>;

export class SelectRejectReasonUseCase {
  execute(
    input: SelectRejectReasonInput,
  ): Result<BreakReason, ReturnType<typeof createPlatformError>> {
    const validation = validateBreakReason(input.reason, input.allowedReasons);
    if (validation.length > 0) {
      return err(
        createPlatformError("validation_failed", "Invalid reject reason", validation),
      );
    }
    return ok(createBreakReason(input.reason));
  }
}
