import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createAppShutdownRequestedEvent } from "./appLifecycleEvents.js";

describe("appLifecycleEvents", () => {
  it("creates AppShutdownRequested with source", () => {
    const correlationId = createCorrelationId();
    const event = createAppShutdownRequestedEvent(correlationId, {
      source: "before-quit",
    });

    expect(event.type).toBe("AppShutdownRequested");
    expect(event["source"]).toBe("before-quit");
  });
});
