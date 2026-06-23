import type { Call } from "@domain/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import { executeBlindTransfer } from "./transferCallControlOperations.js";
import type {
  BlindTransferInput,
  TransferCallControlDeps,
} from "./transferCallControlTypes.js";

export type { BlindTransferInput } from "./transferCallControlTypes.js";

/**
 * - Purpose: delegate blind transfer operations to transfer control handlers.
 * - Inputs: gateway deps, call tracking callbacks, blind transfer input.
 * - Outputs: ended call snapshot or normalized platform error.
 */
export class TransferCallControlService {
  constructor(private readonly deps: TransferCallControlDeps) {}

  blindTransfer(input: BlindTransferInput): Promise<Result<Call, PlatformError>> {
    return executeBlindTransfer(this.deps, input);
  }
}
