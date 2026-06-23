import { describe, expect, it } from "vitest";
import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockOperatorPlatformGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createBreakReason, createCallId } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { isErr } from "@shared/result/index.js";

describe("Break reasons and post-call integration", () => {
  it("syncs break reasons after OCP auth (LF-078)", async () => {
    const published: string[] = [];
    const settings = new InMemorySettingsRepository({
      bootstrapConfig: {
        mode: "ocp",
        ocpToken: "token",
        ocpDomain: "ocp.example",
      },
      incomingCallSettings: {
        autoAnswerTimeoutSec: null,
        rejectReasonRequired: false,
        allowedBreakReasons: [],
      },
    });
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway({ scenario: "success" }),
      telephonyGateway: new MockTelephonyGateway("success"),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      logger: createTestLogger(),
    });

    facade.eventPublisher.subscribe((event) => {
      published.push(event.type);
    });

    const authResult = await facade.authenticateOcp.execute({
      token: "token",
      domain: "ocp.example",
    });
    expect(isErr(authResult)).toBe(false);

    await waitFor(() => published.includes("BreakReasonsReceived"));

    const incoming = await settings.getIncomingCallSettings();
    expect(incoming.allowedBreakReasons.length).toBe(3);
  });

  it("orchestrates DND-at-auth to agent break (LF-018 edge)", async () => {
    const published: string[] = [];
    const settings = new InMemorySettingsRepository({
      bootstrapConfig: {
        mode: "ocp",
        ocpToken: "token",
        ocpDomain: "ocp.example",
      },
      phoneStatus: "dnd",
      incomingCallSettings: {
        autoAnswerTimeoutSec: null,
        rejectReasonRequired: false,
        allowedBreakReasons: [],
      },
    });
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway({
        scenario: "success",
        initialAgentStatus: "ready",
      }),
      telephonyGateway: new MockTelephonyGateway("success"),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      logger: createTestLogger(),
    });

    facade.eventPublisher.subscribe((event) => {
      published.push(event.type);
    });

    await facade.authenticateOcp.execute({
      token: "token",
      domain: "ocp.example",
    });

    await waitFor(() => {
      const statusChanges = published.filter((type) => type === "AgentStatusChanged");
      return statusChanges.length >= 2;
    });

    const statusChanges = published.filter((type) => type === "AgentStatusChanged");
    expect(statusChanges.length).toBeGreaterThanOrEqual(2);
  });

  it("triggers post-call update after reject with reason in OCP mode (LF-062)", async () => {
    const published: string[] = [];
    const telephony = new MockTelephonyGateway("success");
    const settings = new InMemorySettingsRepository({
      bootstrapConfig: {
        mode: "ocp",
        ocpToken: "token",
        ocpDomain: "ocp.example",
      },
      phoneStatus: "online",
      incomingCallSettings: {
        autoAnswerTimeoutSec: null,
        rejectReasonRequired: true,
        allowedBreakReasons: [createBreakReason("meeting")],
      },
    });
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway({ scenario: "success" }),
      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      logger: createTestLogger(),
    });

    facade.eventPublisher.subscribe((event) => {
      published.push(event.type);
    });

    await facade.authenticateOcp.execute({
      token: "token",
      domain: "ocp.example",
    });
    await waitFor(() => published.includes("AgentStatusChanged"));

    const rejectCallId = createCallId("incoming-post-call-1");
    await telephony.simulateIncomingCall({
      callId: rejectCallId,
      remoteNumber: "+12025550199",
      correlationId: createCorrelationId(),
    });

    published.length = 0;
    await facade.rejectCall(rejectCallId, "meeting");

    await waitFor(() => published.includes("PostCallStatusUpdated"));
    expect(published).toContain("PostCallStatusUpdated");
    expect(published).toContain("AgentStatusChanged");
  });
});

function waitFor(predicate: () => boolean, timeoutMs = 1000): Promise<void> {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const tick = (): void => {
      if (predicate()) {
        resolve();
        return;
      }

      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error("Timed out waiting for condition"));
        return;
      }

      setTimeout(tick, 10);
    };

    tick();
  });
}
