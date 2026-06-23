import type {
  EmitSoftPhoneBreakReasonCommand,
  HostIntegrationGateway,
} from "@ports/index.js";
import { ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

export class MockHostIntegrationGateway implements HostIntegrationGateway {
  private readonly emittedBreakReasons: EmitSoftPhoneBreakReasonCommand[] = [];

  getEmittedBreakReasons(): ReadonlyArray<EmitSoftPhoneBreakReasonCommand> {
    return this.emittedBreakReasons;
  }

  emitSoftPhoneBreakReason(
    command: EmitSoftPhoneBreakReasonCommand,
  ): Promise<Result<void, PlatformError>> {
    this.emittedBreakReasons.push(command);
    return Promise.resolve(ok(undefined));
  }
}
