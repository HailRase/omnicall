import { describe, expect, it } from "vitest";
import {
  parseAppShutdownCancelPayload,
  parseAppShutdownAckPayload,
  parseAppShutdownPayload,
} from "./AppShutdownContract.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

describe("AppShutdownContract", () => {
  it("parses valid shutdown payload with quit action", () => {
    const correlationId = createCorrelationId();
    const parsed = parseAppShutdownPayload({
      correlationId,
      source: "before-quit",
      action: "quit",
    });

    expect(parsed).toEqual({
      correlationId,
      source: "before-quit",
      action: "quit",
    });
  });

  it("parses restart-button shutdown payload", () => {
    const correlationId = createCorrelationId();
    const parsed = parseAppShutdownPayload({
      correlationId,
      source: "restart-button",
      action: "restart",
    });

    expect(parsed).toEqual({
      correlationId,
      source: "restart-button",
      action: "restart",
    });
  });

  it("rejects invalid shutdown payload", () => {
    expect(parseAppShutdownPayload(null)).toBeNull();
    expect(parseAppShutdownPayload({ correlationId: "bad", source: "before-quit" })).toBeNull();
    expect(
      parseAppShutdownPayload({
        correlationId: createCorrelationId(),
        source: "invalid",
        action: "quit",
      }),
    ).toBeNull();
    expect(
      parseAppShutdownPayload({
        correlationId: createCorrelationId(),
        source: "before-quit",
        action: "invalid",
      }),
    ).toBeNull();
  });

  it("parses shutdown acknowledgement payload", () => {
    const correlationId = createCorrelationId();
    expect(parseAppShutdownAckPayload({ correlationId, action: "quit", cleanupSkipped: false })).toEqual({
      correlationId,
      action: "quit",
      cleanupSkipped: false,
    });
    expect(
      parseAppShutdownAckPayload({ correlationId, action: "restart", cleanupSkipped: true }),
    ).toEqual({
      correlationId,
      action: "restart",
      cleanupSkipped: true,
    });
  });

  it("parses shutdown cancel payload", () => {
    const correlationId = createCorrelationId();
    expect(
      parseAppShutdownCancelPayload({
        correlationId,
        action: "quit",
        reason: "cleanup_failed",
      }),
    ).toEqual({
      correlationId,
      action: "quit",
      reason: "cleanup_failed",
    });
  });
});
