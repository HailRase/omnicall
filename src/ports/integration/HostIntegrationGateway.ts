import type { CallId } from "@domain/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

export type EmitSoftPhoneBreakReasonCommand = Readonly<{
  breakReason: string;
  callId: CallId;
  correlationId: CorrelationId;
}>;

export interface HostIntegrationGateway {
  emitSoftPhoneBreakReason(
    command: EmitSoftPhoneBreakReasonCommand,
  ): Promise<Result<void, PlatformError>>;
}
