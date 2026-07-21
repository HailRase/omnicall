/**
 * Deterministic ExternalClientGateway test double (DI-01).
 * No sockets, Electron, or JsSIP. Fail closed via `@axata/axatalk-protocol` validators.
 */

import type {
  DiscoveryDocument,
  WireMessage,
} from "@axata/axatalk-protocol";
import {
  validateDiscoveryDocument,
  validateWireMessage,
} from "@axata/axatalk-protocol";
import type {
  ExternalClientGateway,
  ExternalClientGatewayStatus,
  ExternalGatewayValidationResult,
} from "@ports/integration/ExternalClientGateway.js";

export class MockExternalClientGateway implements ExternalClientGateway {
  getStatus(): ExternalClientGatewayStatus {
    return "mock";
  }

  validateWireInbound(
    input: unknown,
  ): ExternalGatewayValidationResult<WireMessage> {
    const result = validateWireMessage(input);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, code: result.code };
  }

  validateDiscoveryInbound(
    input: unknown,
  ): ExternalGatewayValidationResult<DiscoveryDocument> {
    const result = validateDiscoveryDocument(input);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, code: result.code };
  }
}
