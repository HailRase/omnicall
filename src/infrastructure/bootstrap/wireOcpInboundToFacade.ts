import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { OperatorPlatformGateway } from "@ports/index.js";

/**
 * - Purpose: connect OCP inbound WebSocket payloads to ProcessOcpInboundMessageUseCase.
 * - Inputs: facade and operator gateway with setInboundRawHandler.
 * - Outputs: unsubscribe function for inbound handler cleanup.
 */
export function wireOcpInboundToFacade(
  facade: AccountBootstrapFacade,
  operatorGateway: OperatorPlatformGateway,
): () => void {
  return operatorGateway.setInboundRawHandler((raw, correlationId) => {
    facade.processOcpInboundMessageRaw(raw, correlationId);
  });
}
