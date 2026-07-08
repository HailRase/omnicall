import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "../../events/InMemoryDomainEventBus.js";
import { ResolveStartupModeUseCase } from "./ResolveStartupModeUseCase.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";

describe("ResolveStartupModeUseCase", () => {
  it("always resolves sip-only ready mode", () => {
    const events = new InMemoryDomainEventBus();
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });

    const useCase = new ResolveStartupModeUseCase(events, createTestLogger());
    const result = useCase.execute({ config: {} });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.resolution.action).toBe("sip_only_ready");
    expect(published).toContain("StartupModeResolved");
    expect(published).not.toContain("AccessDeniedDetected");
  });
});
