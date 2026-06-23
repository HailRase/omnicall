import { describe, expect, it } from "vitest";
import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockOperatorPlatformGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { isErr } from "@shared/result/index.js";

describe("DndAgentStatusOrchestration integration", () => {
  it("maps phone DND to agent break after OCP auth sync (LF-018)", async () => {
    const published: string[] = [];
    const settings = new InMemorySettingsRepository({
      bootstrapConfig: {
        mode: "ocp",
        ocpToken: "token",
        ocpDomain: "ocp.example",
      },
      phoneStatus: "online",
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

    const authResult = await facade.authenticateOcp.execute({
      token: "token",
      domain: "ocp.example",
    });
    expect(isErr(authResult)).toBe(false);

    await waitFor(() => published.includes("AgentStatusChanged"));

    published.length = 0;
    await facade.setPhoneStatus("dnd");

    await waitFor(() => published.includes("AgentStatusChanged"));

    expect(published).toContain("PhoneStatusChanged");
    expect(published).toContain("AgentStatusChangeRequested");
    expect(published).toContain("AgentStatusChanged");
    expect(published).not.toContain("AgentStatusChangeRejected");
    expect((await settings.getPhoneStatus())).toBe("dnd");
  });

  it("no-ops DND orchestration in SIP-only mode", async () => {
    const published: string[] = [];
    const settings = new InMemorySettingsRepository({
      bootstrapConfig: { mode: "sip-only" },
      phoneStatus: "online",
    });
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: new MockTelephonyGateway("success"),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      logger: createTestLogger(),
    });

    facade.eventPublisher.subscribe((event) => {
      published.push(event.type);
    });

    await facade.setPhoneStatus("dnd");

    expect(published).toContain("PhoneStatusChanged");
    expect(published).not.toContain("AgentStatusChangeRequested");
    expect(published).not.toContain("AgentStatusChanged");
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
