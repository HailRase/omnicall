import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  createCallEndedEvent,
  createCallId,
  createIncomingCallReceivedEvent,
  createPhoneNumber,
} from "@domain/index.js";
import { InMemoryDomainEventBus } from "../../events/InMemoryDomainEventBus.js";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import { OcpTelephonyBridgeService } from "./OcpTelephonyBridgeService.js";
import { createOcpConnectionConfig } from "@domain/integration/ocp/OcpConnectionConfig.js";

describe("OcpTelephonyBridgeService", () => {
  it("sends dlg_stop on CallEnded when authenticated", () => {
    const gateway = new MockOcpGateway();
    const config = createOcpConnectionConfig({
      domain: "ocp.example",
      authToken: "token",
    });
    expect(config.ok).toBe(true);
    if (!config.ok) {
      return;
    }
    gateway.connect(config.value);
    gateway.simulateAuthSuccess(42);

    const bus = new InMemoryDomainEventBus();
    const hubMarks: string[] = [];
    const publishedTypes: string[] = [];
    const resolvedPayloads: unknown[] = [];
    bus.subscribe((event) => {
      publishedTypes.push(event.type);
      if (event.type === "CallOcpContextResolved") {
        resolvedPayloads.push(event);
      }
    });
    const bridge = new OcpTelephonyBridgeService({
      eventPublisher: bus,
      ocpGateway: gateway,
      isOcpAuthenticated: () => true,
      getOcpUserLogin: () => "op.test",
      logger: createTestLogger({ featureId: "F-028", boundedContext: "Integration" }),
      callContext: {
        markPending: (callId, direction) => {
          hubMarks.push(`pending:${callId}:${direction}`);
        },
        resolve: (callId, input) => {
          hubMarks.push(`resolve:${callId}:${input.acallId}:${input.queueName ?? ""}`);
        },
        markUnavailable: (callId) => {
          hubMarks.push(`unavailable:${callId}`);
        },
        clear: (callId) => {
          hubMarks.push(`clear:${callId}`);
        },
      },
      clearCampaignOnCallTerminal: () => {
        hubMarks.push("clearCampaign");
      },
    });

    const callId = createCallId("call-1");
    bus.publish(
      createIncomingCallReceivedEvent(createCorrelationId(), {
        callId,
        phoneNumber: createPhoneNumber("+123"),
        direction: "incoming",
      }),
    );
    expect(gateway.getLastSentCommand()).toEqual({
      kind: "get_main_acallid",
      callId,
      userLogin: "op.test",
      callerId: "+123",
      calledId: "op.test",
      lifecycleEvent: "incomingCallProgress",
    });

    gateway.simulateMessage({
      entity: "calls",
      data: {
        mainAcallId: "main-9",
        acallId: "acall-9",
        event: "incomingCallProgress",
        callerId: "+1",
        calledId: "+2",
        queue: "Support",
      },
    });
    expect(bridge.getCorrelationAcallId(callId)).toBe("acall-9");
    expect(hubMarks).toContain("pending:call-1:incoming");
    expect(hubMarks).toContain("resolve:call-1:acall-9:Support");
    expect(publishedTypes.filter((type) => type === "CallOcpContextResolved")).toHaveLength(
      1,
    );
    expect(resolvedPayloads[0]).toMatchObject({
      type: "CallOcpContextResolved",
      callId: "call-1",
      direction: "incoming",
      queueName: "Support",
      phase: "progress",
      localPartyLabel: "op.test",
      ocp: {
        mainAcallId: "main-9",
        acallId: "acall-9",
        event: "incomingCallProgress",
        callerId: "+1",
        calledId: "+2",
        queue: "Support",
      },
    });

    gateway.clearSentCommands();
    bus.publish(createCallEndedEvent(createCorrelationId(), { callId }));
    expect(gateway.getLastSentCommand()).toEqual({
      kind: "dlg_stop",
      callId,
      acallId: "acall-9",
    });
    expect(bridge.getCorrelationAcallId(callId)).toBeUndefined();
    expect(hubMarks).toContain("clear:call-1");
    expect(hubMarks).toContain("clearCampaign");

    bridge.dispose();
  });

  it("skips get_main_acallid when OCP login is missing", () => {
    const gateway = new MockOcpGateway();
    const config = createOcpConnectionConfig({
      domain: "ocp.example",
      authToken: "token",
    });
    expect(config.ok).toBe(true);
    if (!config.ok) {
      return;
    }
    gateway.connect(config.value);
    gateway.simulateAuthSuccess(42);

    const bus = new InMemoryDomainEventBus();
    const unavailable: string[] = [];
    const bridge = new OcpTelephonyBridgeService({
      eventPublisher: bus,
      ocpGateway: gateway,
      isOcpAuthenticated: () => true,
      getOcpUserLogin: () => null,
      logger: createTestLogger({ featureId: "F-028", boundedContext: "Integration" }),
      callContext: {
        markPending: () => undefined,
        resolve: () => undefined,
        markUnavailable: (callId) => {
          unavailable.push(callId);
        },
        clear: () => undefined,
      },
      clearCampaignOnCallTerminal: () => undefined,
    });

    const callId = createCallId("no-login");
    bus.publish(
      createIncomingCallReceivedEvent(createCorrelationId(), {
        callId,
        phoneNumber: createPhoneNumber("+999"),
        direction: "incoming",
      }),
    );
    expect(gateway.getSentCommands()).toHaveLength(0);
    expect(unavailable).toEqual(["no-login"]);
    bridge.dispose();
  });

  it("skips commands when not authenticated", () => {
    const gateway = new MockOcpGateway();
    const bus = new InMemoryDomainEventBus();
    const bridge = new OcpTelephonyBridgeService({
      eventPublisher: bus,
      ocpGateway: gateway,
      isOcpAuthenticated: () => false,
      getOcpUserLogin: () => "op.test",
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
      createCallEndedEvent(createCorrelationId(), {
        callId: createCallId("call-x"),
      }),
    );
    expect(gateway.getSentCommands()).toHaveLength(0);
    bridge.dispose();
  });
});
