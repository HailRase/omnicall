import { describe, expect, it } from "vitest";
import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockOcpSyncGateway,
  MockOperatorPlatformGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createCallId, createMainAcallId } from "@domain/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

describe("OcpDlgStopSync integration", () => {
  it("sends dlg_stop exactly once on ringing call end", async () => {
    const telephony = new MockTelephonyGateway();
    const ocpSyncGateway = new MockOcpSyncGateway();
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({ phoneStatus: "online" }),
      ocpSyncGateway,
      logger: createTestLogger(),
    });

    const eventTypes: string[] = [];
    facade.eventPublisher.subscribe((event) => {
      eventTypes.push(event.type);
    });

    const correlationId = createCorrelationId();
    const callId = createCallId("dlg-int-1");
    const mainAcallId = createMainAcallId("acall-dlg-int-1");

    facade.eventPublisher.publish({
      type: "OcpAuthenticationSucceeded",
      correlationId,
      occurredAt: new Date().toISOString(),
      sessionId: "session-1",
      agentId: "agent-001",
    });

    await telephony.simulateIncomingCall({
      callId,
      remoteNumber: "+12025550301",
      mainAcallId,
      correlationId,
    });

    eventTypes.length = 0;
    await telephony.simulateCallEnded({ callId, correlationId });

    expect(ocpSyncGateway.getDlgStopSendCount()).toBe(1);
    expect(ocpSyncGateway.getLastDlgStopCommand()).toEqual({
      callId: "dlg-int-1",
      mainAcallId: "acall-dlg-int-1",
      correlationId,
    });
    expect(eventTypes).toContain("DlgStopRequested");
    expect(eventTypes).toContain("DlgStopSent");
    expect(eventTypes.filter((type) => type === "DlgStopSent")).toHaveLength(1);
  });

  it("no-ops dlg_stop in SIP-only mode", async () => {
    const telephony = new MockTelephonyGateway();
    const ocpSyncGateway = new MockOcpSyncGateway();
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({ phoneStatus: "online" }),
      ocpSyncGateway,
      logger: createTestLogger(),
    });

    const published: string[] = [];
    facade.eventPublisher.subscribe((event) => {
      published.push(event.type);
    });

    const correlationId = createCorrelationId();
    const callId = createCallId("dlg-sip-only");

    await telephony.simulateIncomingCall({
      callId,
      remoteNumber: "+12025550302",
      correlationId,
    });

    published.length = 0;
    await telephony.simulateCallEnded({ callId, correlationId });

    expect(ocpSyncGateway.getDlgStopSendCount()).toBe(0);
    expect(published).not.toContain("DlgStopSent");
  });
});
