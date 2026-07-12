import type { HeadsetGateway } from "@ports/headset/HeadsetGateway.js";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { isErr } from "@shared/result/index.js";

export type ConnectHeadsetDeviceInput = Readonly<{
  correlationId?: ReturnType<typeof createCorrelationId>;
}>;

/**
 * - Purpose: open headset device connection through HeadsetGateway port.
 * - Inputs: optional correlation id.
 * - Outputs: gateway connect result.
 */
export class ConnectHeadsetDeviceUseCase {
  constructor(
    private readonly gateway: HeadsetGateway,
    private readonly logger: Logger,
  ) {}

  execute(input: ConnectHeadsetDeviceInput = {}) {
    const correlationId = input.correlationId ?? createCorrelationId();
    this.logger.info("headset_connect_requested", {
      correlationId,
      featureId: "F-012",
      boundedContext: "Headset",
      operation: "connect_headset",
      result: "requested",
    });
    return this.gateway.connect();
  }
}

export type DisconnectHeadsetDeviceInput = Readonly<{
  correlationId?: ReturnType<typeof createCorrelationId>;
}>;

/**
 * - Purpose: close active headset device connection.
 * - Inputs: optional correlation id.
 * - Outputs: gateway disconnect result.
 */
export class DisconnectHeadsetDeviceUseCase {
  constructor(
    private readonly gateway: HeadsetGateway,
    private readonly logger: Logger,
  ) {}

  execute(input: DisconnectHeadsetDeviceInput = {}) {
    const correlationId = input.correlationId ?? createCorrelationId();
    this.logger.info("headset_disconnect_requested", {
      correlationId,
      featureId: "F-012",
      boundedContext: "Headset",
      operation: "disconnect_headset",
      result: "requested",
    });
    return this.gateway.disconnect();
  }
}

export type TryHeadsetAutoReconnectInput = Readonly<{
  correlationId?: ReturnType<typeof createCorrelationId>;
  preferredDeviceId?: string | null;
}>;

/**
 * - Purpose: reconnect previously granted headset on startup when enabled.
 * - Inputs: optional correlation id and preferred device id.
 * - Outputs: auto-reconnect result or null when no granted device.
 */
export class TryHeadsetAutoReconnectUseCase {
  constructor(
    private readonly gateway: HeadsetGateway,
    private readonly logger: Logger,
  ) {}

  async execute(input: TryHeadsetAutoReconnectInput = {}) {
    const correlationId = input.correlationId ?? createCorrelationId();
    this.logger.info("headset_auto_reconnect_requested", {
      correlationId,
      featureId: "F-012",
      boundedContext: "Headset",
      operation: "headset_auto_reconnect",
      result: "requested",
    });
    const result = await this.gateway.tryAutoReconnect({
      preferredDeviceId: input.preferredDeviceId ?? null,
    });
    if (isErr(result)) {
      return result;
    }
    return result;
  }
}
