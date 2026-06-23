import type { Call } from "@domain/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import {
  executeHangupCall,
  executeHoldCall,
  executeResumeCall,
} from "./telephonyCallControlOperations.js";
import { executeMuteCall, executeUnmuteCall } from "./mediaCallControlOperations.js";
import type {
  ActiveCallControlDeps,
  HangupCallInput,
  HoldCallInput,
  MuteCallInput,
  ResumeCallInput,
  UnmuteCallInput,
} from "./activeCallControlTypes.js";

export type {
  HangupCallInput,
  HoldCallInput,
  MuteCallInput,
  ResumeCallInput,
  UnmuteCallInput,
} from "./activeCallControlTypes.js";

/**
 * - Purpose: delegate P04 active call control operations to specialized handlers.
 * - Inputs: gateway deps, call tracking callbacks, operation inputs.
 * - Outputs: updated call entity or normalized platform error.
 */
export class ActiveCallControlService {
  constructor(private readonly deps: ActiveCallControlDeps) {}

  hangupCall(input: HangupCallInput): Promise<Result<Call, PlatformError>> {
    return executeHangupCall(this.deps, input);
  }

  holdCall(input: HoldCallInput): Promise<Result<Call, PlatformError>> {
    return executeHoldCall(this.deps, input);
  }

  resumeCall(input: ResumeCallInput): Promise<Result<Call, PlatformError>> {
    return executeResumeCall(this.deps, input);
  }

  muteCall(input: MuteCallInput): Promise<Result<Call, PlatformError>> {
    return executeMuteCall(this.deps, input);
  }

  unmuteCall(input: UnmuteCallInput): Promise<Result<Call, PlatformError>> {
    return executeUnmuteCall(this.deps, input);
  }
}
