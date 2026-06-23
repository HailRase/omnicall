import type { OcpAuthResult } from "@domain/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

export type OcpAuthenticateCommand = Readonly<{
  token: string;
  domain: string;
  correlationId: CorrelationId;
}>;

export interface OperatorPlatformGateway {
  authenticate(command: OcpAuthenticateCommand): Promise<OcpAuthResult>;
}
