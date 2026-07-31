/**
 * - Purpose: E-10 integration coverage for Telephony ↔ OCP call lifecycle bridge.
 * - Inputs: domain call events + OCP calls entity via MockOcpGateway.
 * - Outputs: get_main_acallid / dlg_stop commands and dialpad block selector.
 */

import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  createCallAnsweredEvent,
  createCallEndedEvent,
  createCallFailedEvent,
  createCallId,
  createIncomingCallReceivedEvent,
  createOutgoingCallRequestedEvent,
  createOutgoingCallStartedEvent,
  createPhoneNumber,
} from "@domain/index.js";
import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import { createOcpConnectionConfig } from "@domain/integration/ocp/OcpConnectionConfig.js";
import { InMemoryDomainEventBus } from "../events/InMemoryDomainEventBus.js";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import { OcpTelephonyBridgeService } from "../services/integration/OcpTelephonyBridgeService.js";
import {
  initialOperatorStatusProjection,
  reduceOperatorStatusFromUsers,
  selectIsCallButtonBlocked,
} from "../projections/integration/operatorStatusProjection.js";

describe("OcpTelephonyBridge integration (E-10)", () => {
  function createAuthenticatedBridge(): {
    gateway: MockOcpGateway;
    bus: InMemoryDomainEventBus;
    bridge: OcpTelephonyBridgeService;
  } {
    const gateway = new MockOcpGateway();
    const config = createOcpConnectionConfig({
      domain: "ocp.example",
      authToken: "token",
    });
    expect(config.ok).toBe(true);
    if (!config.ok) {
      throw new Error("ocp config invalid");
    }
    gateway.connect(config.value);
    gateway.simulateAuthSuccess(42);

    const bus = new InMemoryDomainEventBus();
    const bridge = new OcpTelephonyBridgeService({
      eventPublisher: bus,
      ocpGateway: gateway,
      isOcpAuthenticated: () => true,
      getOcpUserLogin: () => "op.bridge",
      logger: createTestLogger({ featureId: "F-028", boundedContext: "Integration" }),
      callContext: {
        markPending: () => undefined,
        resolve: () => undefined,
        markUnavailable: () => undefined,
        clear: () => undefined,
      },
      clearCampaignOnCallTerminal: () => undefined,
    });
    return { gateway, bus, bridge };
  }

  it("IncomingCallReceived → get_main_acallid", () => {
    const { gateway, bus, bridge } = createAuthenticatedBridge();
    const callId = createCallId("in-1");

    bus.publish(
      createIncomingCallReceivedEvent(createCorrelationId(), {
        callId,
        phoneNumber: createPhoneNumber("+100"),
        direction: "incoming",
      }),
    );

    expect(gateway.getLastSentCommand()).toEqual({
      kind: "get_main_acallid",
      callId,
      userLogin: "op.bridge",
      callerId: "+100",
      calledId: "op.bridge",
      lifecycleEvent: "incomingCallProgress",
    });
    bridge.dispose();
  });

  it("OutgoingCallStarted and CallAnswered request main acallId", () => {
    const { gateway, bus, bridge } = createAuthenticatedBridge();
    const outId = createCallId("out-1");

    bus.publish(
      createOutgoingCallRequestedEvent(createCorrelationId(), {
        callId: outId,
        phoneNumber: createPhoneNumber("+200"),
      }),
    );
    bus.publish(
      createOutgoingCallStartedEvent(createCorrelationId(), {
        callId: outId,
      }),
    );
    expect(gateway.getLastSentCommand()).toEqual({
      kind: "get_main_acallid",
      callId: outId,
      userLogin: "op.bridge",
      callerId: "op.bridge",
      calledId: "+200",
      lifecycleEvent: "outgoingCallProgress",
    });

    gateway.clearSentCommands();
    bus.publish(
      createCallAnsweredEvent(createCorrelationId(), {
        callId: outId,
      }),
    );
    expect(gateway.getLastSentCommand()).toEqual({
      kind: "get_main_acallid",
      callId: outId,
      userLogin: "op.bridge",
      callerId: "op.bridge",
      calledId: "+200",
      lifecycleEvent: "outgoingCallAccepted",
    });
    bridge.dispose();
  });

  it("CallEnded → dlg_stop with SIP callId wire (correlation cleared)", () => {
    const { gateway, bus, bridge } = createAuthenticatedBridge();
    const callId = createCallId("end-1");

    bus.publish(
      createIncomingCallReceivedEvent(createCorrelationId(), {
        callId,
        phoneNumber: createPhoneNumber("+300"),
        direction: "incoming",
      }),
    );
    gateway.simulateMessage({
      entity: "calls",
      data: { acallId: "acall-42", userLogin: "op" },
    });
    expect(bridge.getCorrelationAcallId(callId)).toBe("acall-42");

    gateway.clearSentCommands();
    bus.publish(createCallEndedEvent(createCorrelationId(), { callId }));
    expect(gateway.getLastSentCommand()).toEqual({
      kind: "dlg_stop",
      callId,
    });
    expect(bridge.getCorrelationAcallId(callId)).toBeUndefined();
    bridge.dispose();
  });

  it("CallFailed clears correlation map and sends dlg_stop once", () => {
    const { gateway, bus, bridge } = createAuthenticatedBridge();
    const callId = createCallId("fail-1");

    bus.publish(
      createOutgoingCallRequestedEvent(createCorrelationId(), {
        callId,
        phoneNumber: createPhoneNumber("+400"),
      }),
    );
    bus.publish(
      createOutgoingCallStartedEvent(createCorrelationId(), {
        callId,
      }),
    );
    gateway.simulateMessage({
      entity: "calls",
      data: { acallId: "acall-fail", userLogin: "op" },
    });

    gateway.clearSentCommands();
    bus.publish(
      createCallFailedEvent(createCorrelationId(), {
        callId,
        reason: "busy",
        details: "486",
      }),
    );
    expect(gateway.getLastSentCommand()).toEqual({
      kind: "dlg_stop",
      callId,
    });
    expect(bridge.getCorrelationAcallId(callId)).toBeUndefined();
    bridge.dispose();
  });

  it("without OCP auth → no gateway commands", () => {
    const gateway = new MockOcpGateway();
    const bus = new InMemoryDomainEventBus();
    const bridge = new OcpTelephonyBridgeService({
      eventPublisher: bus,
      ocpGateway: gateway,
      isOcpAuthenticated: () => false,
      getOcpUserLogin: () => "op.bridge",
      logger: createTestLogger({ featureId: "F-028", boundedContext: "Integration" }),
      callContext: {
        markPending: () => undefined,
        resolve: () => undefined,
        markUnavailable: () => undefined,
        clear: () => undefined,
      },
      clearCampaignOnCallTerminal: () => undefined,
    });

    bus.publish(
      createIncomingCallReceivedEvent(createCorrelationId(), {
        callId: createCallId("no-auth"),
        phoneNumber: createPhoneNumber("+500"),
        direction: "incoming",
      }),
    );
    bus.publish(
      createCallEndedEvent(createCorrelationId(), {
        callId: createCallId("no-auth"),
      }),
    );

    expect(gateway.getSentCommands()).toHaveLength(0);
    bridge.dispose();
  });

  it("RESERVED_TO_CALL → selectIsCallButtonBlocked true", () => {
    const reserved = reduceOperatorStatusFromUsers(initialOperatorStatusProjection(), {
      operatorId: 9,
      status: OperatorStatus.RESERVED_TO_CALL,
      reasonId: 0,
      statusSince: "2026-07-14T12:00:00.000Z",
    });
    expect(selectIsCallButtonBlocked(reserved)).toBe(true);

    const ready = reduceOperatorStatusFromUsers(reserved, {
      operatorId: 9,
      status: OperatorStatus.READY,
      reasonId: 1,
      statusSince: "2026-07-14T12:01:00.000Z",
    });
    expect(selectIsCallButtonBlocked(ready)).toBe(false);
  });
});
