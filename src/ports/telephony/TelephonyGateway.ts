import type { SipAccount } from "@domain/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

export type RegisterAccountCommand = Readonly<{
  account: SipAccount;
  correlationId: CorrelationId;
}>;

export interface TelephonyGateway {
  register(command: RegisterAccountCommand): Promise<Result<void, PlatformError>>;
  unregister(correlationId: CorrelationId): Promise<Result<void, PlatformError>>;
}
