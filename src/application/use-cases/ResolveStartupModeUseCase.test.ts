import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "../events/InMemoryDomainEventBus.js";
import { ResolveStartupModeUseCase } from "./ResolveStartupModeUseCase.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";

describe("ResolveStartupModeUseCase", () => {
  it("resolves sip-only ready mode", () => {
    const events = new InMemoryDomainEventBus();
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });

    const useCase = new ResolveStartupModeUseCase(events, createTestLogger());
    const result = useCase.execute({ config: { mode: "sip-only" } });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.resolution.action).toBe("sip_only_ready");
    expect(published).toContain("StartupModeResolved");
  });

  it("resolves ocp authenticate when token and domain exist", () => {
    const useCase = new ResolveStartupModeUseCase(
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );

    const result = useCase.execute({
      config: {
        mode: "ocp",
        ocpToken: "token",
        ocpDomain: "ocp.example",
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.resolution).toEqual({
      action: "ocp_authenticate",
      token: "token",
      domain: "ocp.example",
    });
  });

  it("publishes access denied when ocp credentials are missing", () => {
    const events = new InMemoryDomainEventBus();
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });

    const useCase = new ResolveStartupModeUseCase(events, createTestLogger());
    const result = useCase.execute({ config: { mode: "ocp" } });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.resolution.action).toBe("access_denied");
    expect(published).toContain("AccessDeniedDetected");
  });
});
