import type {
  EmitSoftPhoneBreakReasonCommand,
  HostIntegrationGateway,
} from "@ports/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";

export type HostLegacyEventEmitter = (
  eventName: "soft-phone-break-reason",
  payload: Readonly<{
    breakReason: string;
    callId: string;
    correlationId: string;
  }>,
) => void;

export class HostIntegrationGatewayAdapter implements HostIntegrationGateway {
  constructor(
    private readonly emitter: HostLegacyEventEmitter = () => {
      return;
    },
  ) {}

  emitSoftPhoneBreakReason(
    command: EmitSoftPhoneBreakReasonCommand,
  ): Promise<Result<void, PlatformError>> {
    try {
      this.emitter("soft-phone-break-reason", {
        breakReason: command.breakReason,
        callId: command.callId,
        correlationId: command.correlationId,
      });
      return Promise.resolve(ok(undefined));
    } catch (error: unknown) {
      return Promise.resolve(
        err(
          createPlatformError(
            "operation_failed",
            "Failed to emit soft-phone-break-reason",
            error,
          ),
        ),
      );
    }
  }
}
